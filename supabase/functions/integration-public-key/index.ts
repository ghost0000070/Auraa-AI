import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// RSA-OAEP Public Key for envelope encryption
// The private key should be stored securely in Deno.env.get('INTEGRATION_RSA_PRIVATE_KEY')
// Generate a new key pair with: openssl genrsa -out private.pem 2048 && openssl rsa -in private.pem -pubout -out public.pem
const DEFAULT_PUBLIC_KEY = `-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA0Z3VS5JJcds3xfn/ygWyF8PbnGy0AHJLZmGF3Xf5T5gh
WsVQBiPvZpTRxNvONQjWBppM5BwdJpgJCGQHvH3sxPRXPCqvbNQQzqoQR6ZqTCXvhD2Qe1qBfGNmIP0VPCY5F0q
z3PvFvxZiy1OWKMoC4P9XHfYzMT5k5F2V2a7qXw3e1FnD1PJiT3fNcL+T4BQLdR7W8V7Xc7JzHsGxHqgzxvYM
W5N6Ep7aFVPLmjigQ9GhGCG0nkDXNKqVhT2+8M8iqUEM0w7tNq2KXa5p5h7f9VpKqE2QyGN6W4A9+mLT3JRCJ
VxQ8E5TMXR7vN8QHSQF2QH1QXSQ0F2QIDAQAB
-----END PUBLIC KEY-----`

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Get public key from environment or use default
    const publicKey = Deno.env.get('INTEGRATION_RSA_PUBLIC_KEY') || DEFAULT_PUBLIC_KEY

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
