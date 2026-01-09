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
    // Always fail if verification throws
    return false
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

    // OLD TIER PRODUCTS (Being phased out)
    const PRODUCT_TIERS: Record<string, string> = {
      [Deno.env.get('POLAR_PRO_PRODUCT_ID') || 'pro_product']: 'pro',
      [Deno.env.get('POLAR_ENTERPRISE_PRODUCT_ID') || 'enterprise_product']: 'enterprise',
    }

    // NEW: Employee subscription product mapping
    const EMPLOYEE_PRODUCTS: Record<string, { id: string, price: number }> = {
      'marketing-pro': { id: Deno.env.get('POLAR_MARKETING_PRO_ID') || 'de3ed2d2-27f3-4573-834f-7290784ab0ab', price: 99 },
      'sales-sidekick': { id: Deno.env.get('POLAR_SALES_SIDEKICK_ID') || 'bfb616c0-d573-41fc-9421-bc1872672e78', price: 129 },
      'support-sentinel': { id: Deno.env.get('POLAR_SUPPORT_SENTINEL_ID') || '9dd57182-e64b-4c5d-8a9b-c18b56185063', price: 79 },
      'business-analyst': { id: Deno.env.get('POLAR_BUSINESS_ANALYST_ID') || '001412c7-8d79-48d1-9255-959318d4109b', price: 149 },
      'dev-companion': { id: Deno.env.get('POLAR_DEV_COMPANION_ID') || '56a8eda5-079e-46a4-a967-65121ef4e776', price: 119 },
      'operations-orchestrator': { id: Deno.env.get('POLAR_OPERATIONS_ID') || 'ec6bb65c-ea95-4c1f-94c2-ce3e46402bc5', price: 99 },
      'security-analyst': { id: Deno.env.get('POLAR_SECURITY_ANALYST_ID') || '2e6d7dba-f5b8-45d0-b8d8-12b667ccb5cb', price: 159 },
      'ai-team-orchestrator': { id: Deno.env.get('POLAR_TEAM_ORCHESTRATOR_ID') || 'd5f46d12-19be-45b4-a46f-3eee385dd737', price: 179 },
    }

    // Reverse lookup: Product ID -> Employee Template ID
    const PRODUCT_TO_EMPLOYEE: Record<string, string> = {}
    Object.entries(EMPLOYEE_PRODUCTS).forEach(([templateId, { id }]) => {
      PRODUCT_TO_EMPLOYEE[id] = templateId
    })

    // Handle different webhook events
    switch (event) {
      case 'checkout.created':
      case 'checkout.updated':
        // Checkout created or updated
        console.log('Checkout event:', data)
        break

      case 'order.created': {
        // Payment successful - check if it's an intro subscription or employee subscription
        const customerEmail = data.customer?.email
        const metadata = data.metadata || {}
        
        if (customerEmail) {
          // Find user by email
          const { data: users } = await supabase
            .from('users')
            .select('id, intro_subscription_used')
            .eq('email', customerEmail)
            .single()

          if (users) {
            // Check if this is an employee subscription checkout
            if (metadata.checkout_type === 'employee_subscription') {
              // Create employee subscription record
              const introEndsAt = new Date()
              introEndsAt.setDate(introEndsAt.getDate() + 30)
              
              await supabase
                .from('employee_subscriptions')
                .upsert({
                  user_id: users.id,
                  employee_template_id: metadata.employee_template_id,
                  employee_name: metadata.employee_name,
                  status: 'active',
                  is_trial: false,
                  monthly_price: parseInt(metadata.employee_price || '0') * 100,
                  polar_subscription_id: data.subscription_id || null,
                  polar_checkout_id: data.id,
                  subscribed_at: new Date().toISOString(),
                  current_period_start: new Date().toISOString(),
                  current_period_end: introEndsAt.toISOString(),
                }, { onConflict: 'user_id,employee_template_id' })

              console.log(`✅ Created employee subscription for ${metadata.employee_name} for user ${users.id}`)
            } else {
              // This is an intro subscription (Pro or Enterprise)
              const productId = data.product_id
              const subscriptionTier = PRODUCT_TIERS[productId] || 'pro'

              // Calculate intro period end (30 days from now)
              const introEndsAt = new Date()
              introEndsAt.setDate(introEndsAt.getDate() + 30)

              // Update user subscription with intro period
              await supabase
                .from('users')
                .update({
                  subscription_tier: subscriptionTier,
                  subscription_status: 'active',
                  subscription_id: data.subscription_id || null,
                  polar_customer_id: data.customer?.id,
                  polar_order_id: data.id,
                  // Set intro period
                  intro_subscription_started_at: new Date().toISOString(),
                  intro_subscription_ends_at: introEndsAt.toISOString(),
                  intro_subscription_used: true,
                  updated_at: new Date().toISOString(),
                })
                .eq('id', users.id)

              console.log(`✅ Updated user ${users.id} to ${subscriptionTier} tier with 30-day intro period ending ${introEndsAt.toISOString()}`)
            }
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
        const productId = data.product_id
        
        if (subCustomerEmail) {
          const { data: users } = await supabase
            .from('users')
            .select('id')
            .eq('email', subCustomerEmail)
            .single()

          if (users) {
            // Check if this is an employee subscription
            const employeeTemplateId = PRODUCT_TO_EMPLOYEE[productId]
            
            if (employeeTemplateId) {
              // Handle employee subscription
              const employeeProduct = EMPLOYEE_PRODUCTS[employeeTemplateId]
              
              await supabase
                .from('employee_subscriptions')
                .upsert({
                  user_id: users.id,
                  employee_template_id: employeeTemplateId,
                  polar_subscription_id: data.id,
                  polar_product_id: productId,
                  polar_customer_id: data.customer_id,
                  status: data.status,
                  monthly_price: employeeProduct.price,
                  current_period_start: data.current_period_start,
                  current_period_end: data.current_period_end,
                  updated_at: new Date().toISOString(),
                }, { onConflict: 'polar_subscription_id' })

              console.log(`✅ ${event}: Employee subscription ${employeeTemplateId} for user ${users.id} - status: ${data.status}`)
            } else {
              // Old tier subscription (being phased out)
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

              console.log(`⚠️ ${event}: Old tier subscription ${subscriptionTier} for user ${users.id} (being phased out)`)
            }
          }
        }
        break
      }

      case 'subscription.canceled': {
        // Subscription canceled
        const canceledEmail = data.customer?.email
        const productId = data.product_id
        
        if (canceledEmail) {
          const { data: users } = await supabase
            .from('users')
            .select('id')
            .eq('email', canceledEmail)
            .single()

          if (users) {
            // Check if this is an employee subscription
            const employeeTemplateId = PRODUCT_TO_EMPLOYEE[productId]
            
            if (employeeTemplateId) {
              // Cancel employee subscription
              await supabase
                .from('employee_subscriptions')
                .update({
                  status: 'canceled',
                  canceled_at: new Date().toISOString(),
                  updated_at: new Date().toISOString(),
                })
                .eq('user_id', users.id)
                .eq('polar_subscription_id', data.id)

              console.log(`✅ Canceled employee subscription ${employeeTemplateId} for user ${users.id}`)
            } else {
              // Old tier subscription
              await supabase
                .from('users')
                .update({
                  subscription_tier: 'free',
                  subscription_status: 'canceled',
                  updated_at: new Date().toISOString(),
                })
                .eq('id', users.id)

              console.log(`⚠️ Canceled old tier subscription for user ${users.id}`)
            }
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
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
