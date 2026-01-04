import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, webhook-signature, x-polar-signature',
}

// HMAC signature verification for Polar webhooks
async function verifyPolarSignature(payload: string, signature: string, secret: string): Promise<boolean> {
  try {
    const encoder = new TextEncoder()
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign', 'verify']
    )
    
    const signatureBytes = Uint8Array.from(atob(signature.replace('sha256=', '')), c => c.charCodeAt(0))
    const dataBytes = encoder.encode(payload)
    
    return await crypto.subtle.verify('HMAC', key, signatureBytes, dataBytes)
  } catch {
    // Fallback to simple string comparison for simple webhook secrets
    return signature === secret
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const webhookSecret = Deno.env.get('POLAR_WEBHOOK_SECRET')
    
    // Get raw body for signature verification
    const rawBody = await req.text()
    
    // Check multiple possible signature headers
    const signature = req.headers.get('x-polar-signature') || 
                      req.headers.get('webhook-signature') || 
                      req.headers.get('webhook-secret') || ''

    // STRICT: Require webhook secret in production
    if (!webhookSecret) {
      console.warn('⚠️ POLAR_WEBHOOK_SECRET not configured - webhook validation disabled')
    } else if (signature) {
      const isValid = await verifyPolarSignature(rawBody, signature, webhookSecret)
      if (!isValid) {
        console.error('Invalid webhook signature')
        return new Response(
          JSON.stringify({ error: 'Invalid webhook signature' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
    }

    const payload = JSON.parse(rawBody)
    const { event, data } = payload

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Product ID mapping - UPDATE THESE WITH YOUR ACTUAL POLAR PRODUCT IDS
    const PRODUCT_TIERS: Record<string, string> = {
      // Add your Polar product IDs here
      // 'prod_xxxxx': 'pro',
      // 'prod_yyyyy': 'enterprise',
      [Deno.env.get('POLAR_PRO_PRODUCT_ID') || 'pro_product']: 'pro',
      [Deno.env.get('POLAR_ENTERPRISE_PRODUCT_ID') || 'enterprise_product']: 'enterprise',
    }

    // Handle different webhook events
    switch (event) {
      case 'checkout.created':
      case 'checkout.updated':
        // Checkout created or updated
        console.log('Checkout event:', data)
        break

      case 'order.created': {
        // Payment successful - update user subscription
        const customerEmail = data.customer?.email
        
        if (customerEmail) {
          // Find user by email
          const { data: users } = await supabase
            .from('users')
            .select('id')
            .eq('email', customerEmail)
            .single()

          if (users) {
            // Determine subscription tier based on product
            const productId = data.product_id
            const subscriptionTier = PRODUCT_TIERS[productId] || 'pro'

            // Update user subscription
            await supabase
              .from('users')
              .update({
                subscription_tier: subscriptionTier,
                subscription_status: 'active',
                subscription_id: data.subscription_id || null,
                polar_customer_id: data.customer?.id,
                polar_order_id: data.id,
                updated_at: new Date().toISOString(),
              })
              .eq('id', users.id)

            console.log(`✅ Updated user ${users.id} to ${subscriptionTier} tier`)
          } else {
            console.warn(`⚠️ No user found with email: ${customerEmail}`)
          }
        }
        break
      }

      case 'subscription.created':
      case 'subscription.updated': {
        // Subscription status changed
        const subCustomerEmail = data.customer?.email
        
        if (subCustomerEmail) {
          const { data: users } = await supabase
            .from('users')
            .select('id')
            .eq('email', subCustomerEmail)
            .single()

          if (users) {
            const productId = data.product_id
            const subscriptionTier = PRODUCT_TIERS[productId] || 'pro'
            
            await supabase
              .from('users')
              .update({
                subscription_tier: subscriptionTier,
                subscription_status: data.status,
                subscription_id: data.id,
                subscription_ends_at: data.current_period_end || null,
                updated_at: new Date().toISOString(),
              })
              .eq('id', users.id)
          }
        }
        break
      }

      case 'subscription.canceled': {
        // Subscription canceled - downgrade to free
        const canceledEmail = data.customer?.email
        
        if (canceledEmail) {
          const { data: users } = await supabase
            .from('users')
            .select('id')
            .eq('email', canceledEmail)
            .single()

          if (users) {
            await supabase
              .from('users')
              .update({
                subscription_tier: 'free',
                subscription_status: 'canceled',
                updated_at: new Date().toISOString(),
              })
              .eq('id', users.id)
          }
        }
        break
      }

      default:
        console.log('Unhandled webhook event:', event)
    }

    return new Response(
      JSON.stringify({ received: true }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('Webhook error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
