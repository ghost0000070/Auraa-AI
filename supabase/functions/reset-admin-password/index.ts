// @ts-ignore: Deno runtime import
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2?dts'

/**
 * Minimal ambient Deno declaration so TypeScript (when not using the Deno language server)
 * recognizes the global. The real implementation is provided at runtime by Supabase Edge.
 */
declare const Deno: {
  env: { get: (key: string) => string | undefined }
  serve: (handler: (req: Request) => Response | Promise<Response>) => void
}

// Using built-in Deno.serve to avoid external std import resolution issues
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create a Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    )

    const adminEmail = 'ghostspooks@icloud.com'
    
    console.log('🔄 Sending password reset for:', adminEmail)

    // Send password reset email
    const { error } = await supabase.auth.resetPasswordForEmail(adminEmail, {
      redirectTo: `${Deno.env.get('SUPABASE_URL')?.replace('.supabase.co', '')}.supabase.co/auth/callback`
    })

    if (error) {
      console.error('❌ Error sending reset email:', error)
      throw error
    }

    console.log('✅ Password reset email sent successfully')

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Password reset email sent successfully',
        email: adminEmail,
        note: 'Check your email for the password reset link'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('💥 Function error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    return new Response(
      JSON.stringify({
        success: false,
        error: errorMessage
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})