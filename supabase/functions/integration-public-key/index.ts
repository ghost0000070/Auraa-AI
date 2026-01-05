import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Get public key from environment - REQUIRED for security
    const publicKey = Deno.env.get('INTEGRATION_RSA_PUBLIC_KEY')

    if (!publicKey) {
      console.error('INTEGRATION_RSA_PUBLIC_KEY not configured')
      return new Response(
        JSON.stringify({ error: 'Integration encryption not configured. Contact administrator.' }),
        { 
          status: 503,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    return new Response(
      JSON.stringify({ 
        publicKey,
        algorithm: 'RSA-OAEP',
        hash: 'SHA-256'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('Error fetching public key:', error)
    return new Response(
      JSON.stringify({ error: 'Failed to fetch public key' }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
