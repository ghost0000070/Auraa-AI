import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface SubscriptionAction {
  action: 'create-checkout' | 'create-employee-checkout' | 'get-subscription' | 'cancel-subscription' | 'update-subscription' | 'get-portal-url' | 'list-products'
  userId?: string
  productId?: string
  tier?: 'pro' | 'enterprise'
  employeeTemplateId?: string
  employeeName?: string
  employeePrice?: number
  successUrl?: string
  cancelUrl?: string
  metadata?: Record<string, string>
}

// Polar API base URL
const POLAR_API_BASE = 'https://api.polar.sh/v1'

// Product ID mapping (configure these in environment variables)
const TIER_TO_PRODUCT: Record<string, string> = {
  'pro': Deno.env.get('POLAR_PRO_PRODUCT_ID') || '',
  'enterprise': Deno.env.get('POLAR_ENTERPRISE_PRODUCT_ID') || ''
}

// Helper function to make Polar API requests
async function polarRequest(endpoint: string, options: RequestInit = {}) {
  const accessToken = Deno.env.get('POLAR_ACCESS_TOKEN')
  
  if (!accessToken) {
    throw new Error('POLAR_ACCESS_TOKEN not configured')
  }

  const response = await fetch(`${POLAR_API_BASE}${endpoint}`, {
    ...options,
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Polar API error (${response.status}): ${error}`)
  }

  return response.json()
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Verify authorization
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Initialize Supabase client with user's token
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } }
    })

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const body = await req.json() as SubscriptionAction
    const { action } = body

    // Use service role for database operations
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const adminSupabase = createClient(supabaseUrl, serviceRoleKey)

    // Get user data from our database
    const { data: userData } = await adminSupabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single()

    switch (action) {
      case 'list-products': {
        // List available products from Polar
        const organizationId = Deno.env.get('POLAR_ORGANIZATION_ID')
        const products = await polarRequest(`/products?organization_id=${organizationId || ''}`)
        
        return new Response(
          JSON.stringify({ products: products.items || products }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      case 'create-checkout': {
        const { productId, tier, successUrl, cancelUrl, metadata = {} } = body

        // Resolve product ID from tier if not provided directly
        let resolvedProductId = productId
        if (!resolvedProductId && tier) {
          resolvedProductId = TIER_TO_PRODUCT[tier]
        }

        if (!resolvedProductId) {
          return new Response(
            JSON.stringify({ error: 'productId or tier is required. Make sure POLAR_PRO_PRODUCT_ID and POLAR_ENTERPRISE_PRODUCT_ID are configured.' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        // Create a Polar checkout session
        const checkout = await polarRequest('/checkouts/custom/', {
          method: 'POST',
          body: JSON.stringify({
            product_id: resolvedProductId,
            success_url: successUrl || `${req.headers.get('origin')}/checkout-return?success=true`,
            cancel_url: cancelUrl || `${req.headers.get('origin')}/checkout-return?canceled=true`,
            customer_email: user.email,
            customer_name: userData?.full_name || userData?.display_name || undefined,
            metadata: {
              user_id: user.id,
              tier: tier || 'unknown',
              ...metadata
            }
          })
        })

        return new Response(
          JSON.stringify({ 
            checkoutUrl: checkout.url,
            checkoutId: checkout.id
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      case 'create-employee-checkout': {
        // Create checkout for individual AI employee subscription
        const { employeeTemplateId, employeeName, employeePrice, successUrl, cancelUrl } = body

        if (!employeeTemplateId || !employeeName || !employeePrice) {
          return new Response(
            JSON.stringify({ error: 'employeeTemplateId, employeeName, and employeePrice are required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        // Get the Polar product ID for this employee from environment variables
        // Environment variable format: POLAR_EMPLOYEE_{TEMPLATE_ID}_PRODUCT_ID
        // e.g., POLAR_EMPLOYEE_MARKETING_PRO_PRODUCT_ID
        const envKey = `POLAR_EMPLOYEE_${employeeTemplateId.toUpperCase().replace(/-/g, '_')}_PRODUCT_ID`
        const employeeProductId = Deno.env.get(envKey)

        if (!employeeProductId) {
          console.error(`Missing Polar product ID for employee: ${employeeTemplateId}. Set ${envKey} in secrets.`)
          return new Response(
            JSON.stringify({ 
              error: `Product not configured for ${employeeName}. Please contact support.`,
              detail: `Missing environment variable: ${envKey}`
            }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        // Create a Polar checkout for this employee's product
        const checkout = await polarRequest('/checkouts/custom/', {
          method: 'POST',
          body: JSON.stringify({
            product_id: employeeProductId,
            success_url: successUrl || `${req.headers.get('origin')}/marketplace?subscribed=${employeeTemplateId}`,
            cancel_url: cancelUrl || `${req.headers.get('origin')}/marketplace`,
            customer_email: user.email,
            customer_name: userData?.full_name || userData?.display_name || undefined,
            metadata: {
              user_id: user.id,
              checkout_type: 'employee_subscription',
              employee_template_id: employeeTemplateId,
              employee_name: employeeName,
              employee_price: String(employeePrice),
            }
          })
        })

        return new Response(
          JSON.stringify({ 
            checkoutUrl: checkout.url,
            checkoutId: checkout.id
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      case 'get-subscription': {
        // Get the user's current subscription status
        if (!userData?.polar_customer_id) {
          return new Response(
            JSON.stringify({ 
              hasSubscription: false,
              tier: 'free',
              status: 'none'
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        // Get subscriptions for this customer from Polar
        try {
          const subscriptions = await polarRequest(`/subscriptions?customer_id=${userData.polar_customer_id}`)
          
          const activeSubscription = subscriptions.items?.find(
            (sub: { status: string }) => sub.status === 'active'
          )

          return new Response(
            JSON.stringify({
              hasSubscription: !!activeSubscription,
              tier: userData.subscription_tier || 'free',
              status: activeSubscription?.status || userData.subscription_status || 'none',
              subscription: activeSubscription || null,
              endsAt: userData.subscription_ends_at
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        } catch {
          // Fall back to database state if Polar API fails
          return new Response(
            JSON.stringify({
              hasSubscription: userData.subscription_status === 'active',
              tier: userData.subscription_tier || 'free',
              status: userData.subscription_status || 'none',
              endsAt: userData.subscription_ends_at
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }
      }

      case 'cancel-subscription': {
        if (!userData?.subscription_id) {
          return new Response(
            JSON.stringify({ error: 'No active subscription to cancel' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        // Cancel the subscription at period end
        const result = await polarRequest(`/subscriptions/${userData.subscription_id}`, {
          method: 'PATCH',
          body: JSON.stringify({
            cancel_at_period_end: true
          })
        })

        // Update local database
        await adminSupabase
          .from('users')
          .update({
            subscription_status: 'canceling',
            updated_at: new Date().toISOString()
          })
          .eq('id', user.id)

        return new Response(
          JSON.stringify({ 
            success: true,
            message: 'Subscription will be canceled at the end of the billing period',
            endsAt: result.current_period_end
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      case 'update-subscription': {
        const { productId } = body

        if (!userData?.subscription_id) {
          return new Response(
            JSON.stringify({ error: 'No active subscription to update' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        if (!productId) {
          return new Response(
            JSON.stringify({ error: 'productId is required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        // Update the subscription product
        const result = await polarRequest(`/subscriptions/${userData.subscription_id}`, {
          method: 'PATCH',
          body: JSON.stringify({
            product_id: productId
          })
        })

        return new Response(
          JSON.stringify({ 
            success: true,
            subscription: result
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      case 'get-portal-url': {
        // Generate a customer portal URL for subscription management
        if (!userData?.polar_customer_id) {
          return new Response(
            JSON.stringify({ 
              error: 'No subscription found. Please subscribe first.',
              hasSubscription: false
            }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        try {
          // Create a customer portal session
          const portal = await polarRequest('/customer-portal/sessions', {
            method: 'POST',
            body: JSON.stringify({
              customer_id: userData.polar_customer_id,
              return_url: body.successUrl || `${req.headers.get('origin')}/dashboard`
            })
          })

          return new Response(
            JSON.stringify({ 
              portalUrl: portal.url,
              expiresAt: portal.expires_at
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        } catch (error) {
          // If portal API is not available, return subscription info instead
          console.warn('Customer portal not available:', error)
          return new Response(
            JSON.stringify({ 
              error: 'Customer portal not available. Please contact support to manage your subscription.',
              subscription: {
                tier: userData.subscription_tier,
                status: userData.subscription_status,
                endsAt: userData.subscription_ends_at
              }
            }),
            { status: 501, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }
      }

      default:
        return new Response(
          JSON.stringify({ error: `Unknown action: ${action}` }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }

  } catch (error) {
    console.error('Subscription handler error:', error)
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
