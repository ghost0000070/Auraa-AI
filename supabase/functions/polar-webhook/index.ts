import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, webhook-secret',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const webhookSecret = Deno.env.get('POLAR_WEBHOOK_SECRET')
    const signature = req.headers.get('webhook-secret')

    // Verify webhook signature
    if (webhookSecret && signature !== webhookSecret) {
      return new Response(
        JSON.stringify({ error: 'Invalid webhook signature' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const payload = await req.json()
    const { event, data } = payload

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Handle different webhook events
    switch (event) {
      case 'checkout.created':
      case 'checkout.updated':
        // Checkout created or updated
        console.log('Checkout event:', data)
        break

      case 'order.created':
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
            let subscriptionTier = 'free'
            
            // Map product IDs to tiers (update these with your actual product IDs)
            if (productId === 'YOUR_PRO_PRODUCT_ID') {
              subscriptionTier = 'pro'
            } else if (productId === 'YOUR_ENTERPRISE_PRODUCT_ID') {
              subscriptionTier = 'enterprise'
            }

            // Update user subscription
            await supabase
              .from('users')
              .update({
                subscription_tier: subscriptionTier,
                subscription_status: 'active',
                polar_customer_id: data.customer?.id,
                polar_order_id: data.id,
                updated_at: new Date().toISOString(),
              })
              .eq('id', users.id)

            console.log(`Updated user ${users.id} to ${subscriptionTier} tier`)
          }
        }
        break

      case 'subscription.created':
      case 'subscription.updated':
        // Subscription status changed
        const subCustomerEmail = data.customer?.email
        
        if (subCustomerEmail) {
          const { data: users } = await supabase
            .from('users')
            .select('id')
            .eq('email', subCustomerEmail)
            .single()

          if (users) {
            await supabase
              .from('users')
              .update({
                subscription_status: data.status,
                updated_at: new Date().toISOString(),
              })
              .eq('id', users.id)
          }
        }
        break

      case 'subscription.canceled':
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
