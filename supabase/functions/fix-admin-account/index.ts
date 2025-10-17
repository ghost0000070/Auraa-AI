// @ts-ignore: Deno runtime import
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2?dts'

// Declare Deno global for TypeScript (include serve so Deno.serve is typed)
declare const Deno: {
  env: {
    get(key: string): string | undefined;
  };
  serve: (handler: (req: Request) => Response | Promise<Response>, options?: unknown) => unknown;
};

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Use built-in Deno.serve to avoid external std/http import resolution issues
Deno.serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create a Supabase client with service role key for admin operations
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    )

    const adminEmail = 'ghostspooks@icloud.com'
    const tempPassword = 'AdminReset2024!'  // User should change this immediately

    console.log('🔧 Fixing admin account for:', adminEmail)
    console.log('🔑 Using service key:', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ? 'Available' : 'Missing')

    // First, try to delete existing user if it has invalid credentials
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers()
    const existingUser = existingUsers.users?.find((user: { email?: string }) => user.email === adminEmail)

    if (existingUser) {
      console.log('📝 Found existing user, updating...')
      // Update the existing user with a proper password
      const { data: updatedUser, error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
        existingUser.id,
        {
          password: tempPassword,
          email_confirm: true,
          user_metadata: { admin: true }
        }
      )

      if (updateError) {
        console.error('❌ Error updating user:', updateError)
        throw updateError
      }

      console.log('✅ Admin user updated successfully')
      
      // Ensure admin role exists in user_roles table
      const { error: roleError } = await supabaseAdmin
        .from('user_roles')
        .upsert({
          user_id: existingUser.id,
          role: 'admin'
        })

      if (roleError) {
        console.warn('⚠️ Warning: Could not set admin role:', roleError)
      }

      // Ensure Enterprise subscription exists
      const { error: subError } = await supabaseAdmin
        .from('subscribers')
        .upsert({
          user_id: existingUser.id,
          email: adminEmail,
          subscribed: true,
          subscription_tier: 'Enterprise',
          subscription_end: null  // Unlimited
        })

      if (subError) {
        console.warn('⚠️ Warning: Could not set subscription:', subError)
      }

      return new Response(
        JSON.stringify({
          success: true,
          message: 'Admin account fixed successfully',
          user_id: existingUser.id,
          email: adminEmail,
          temporary_password: tempPassword,
          note: 'Please log in with this temporary password and change it immediately'
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      )
    } else {
      console.log('👤 Creating new admin user...')
      // Create new admin user
      const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email: adminEmail,
        password: tempPassword,
        email_confirm: true,
        user_metadata: { admin: true }
      })

      if (createError) {
        console.error('❌ Error creating user:', createError)
        throw createError
      }

      console.log('✅ Admin user created successfully')

      // Set admin role
      const { error: roleError } = await supabaseAdmin
        .from('user_roles')
        .upsert({
          user_id: newUser.user.id,
          role: 'admin'
        })

      if (roleError) {
        console.warn('⚠️ Warning: Could not set admin role:', roleError)
      }

      // Set Enterprise subscription
      const { error: subError } = await supabaseAdmin
        .from('subscribers')
        .upsert({
          user_id: newUser.user.id,
          email: adminEmail,
          subscribed: true,
          subscription_tier: 'Enterprise',
          subscription_end: null  // Unlimited
        })

      if (subError) {
        console.warn('⚠️ Warning: Could not set subscription:', subError)
      }

      return new Response(
        JSON.stringify({
          success: true,
          message: 'Admin account created successfully',
          user_id: newUser.user.id,
          email: adminEmail,
          temporary_password: tempPassword,
          note: 'Please log in with this temporary password and change it immediately'
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      )
    }

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