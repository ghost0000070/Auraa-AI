import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { prompt, userId, puterUsername } = await req.json()

    if (!prompt || !userId) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: prompt and userId' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Call Puter's free Claude API (no API key required)
    const aiResponse = await fetch('https://api.puter.com/drivers/call', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        interface: 'puter-chat-completion',
        driver: 'claude-sonnet-4-5',
        method: 'complete',
        args: {
          messages: [
            {
              role: 'system',
              content: `You are an expert Puter.js developer. Generate clean, working Puter.js scripts based on user requirements. 
              Puter is a cloud operating system with JavaScript APIs for file system, apps, UI, and more.
              Common patterns:
              - puter.fs.read/write for file operations
              - puter.ui.showWindow for UI
              - puter.apps.launch for launching apps
              Always include error handling and comments.`
            },
            {
              role: 'user',
              content: prompt
            }
          ]
        }
      }),
    })

    if (!aiResponse.ok) {
      throw new Error('Puter AI service failed: ' + await aiResponse.text())
    }

    const aiData = await aiResponse.json()
    const generatedScript = aiData.message?.content?.[0]?.text || aiData.result

    // Update the database with the generated script
    const { data, error } = await supabase
      .from('puter_script_requests')
      .update({
        generated_script: generatedScript,
        status: 'completed',
        completed_at: new Date().toISOString(),
      })
      .eq('user_id', userId)
      .eq('prompt', prompt)
      .eq('status', 'processing')
      .select()
      .single()

    if (error) {
      console.error('Database update error:', error)
      throw error
    }

    return new Response(
      JSON.stringify({ 
        script: generatedScript,
        requestId: data.id 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
