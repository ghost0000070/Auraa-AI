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

  // Verify authorization header
  const authHeader = req.headers.get('Authorization')
  if (!authHeader) {
    return new Response(
      JSON.stringify({ error: 'Missing authorization header' }),
      { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  // Store body variables early to avoid double req.json() parsing
  let requestId: string | undefined
  let userId: string | undefined

  try {
    const body = await req.json()
    requestId = body.requestId
    userId = body.userId

    if (!requestId || !userId) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: requestId and userId' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Verify the user exists and the auth token is valid
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    if (authError || !user || user.id !== userId) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized: Invalid user or token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Fetch deployment request
    const { data: request, error: fetchError } = await supabase
      .from('deployment_requests')
      .select('*')
      .eq('id', requestId)
      .eq('user_id', userId)
      .single()

    if (fetchError || !request) {
      throw new Error('Deployment request not found')
    }

    // Update status to processing
    await supabase
      .from('deployment_requests')
      .update({ status: 'processing' })
      .eq('id', requestId)

    // Template info comes from the deployment request itself
    // The template_id is the string ID from the frontend templates (e.g., "marketing-pro")
    const templateId = request.template_id

    // Fetch user's business profile for context
    const { data: profile } = await supabase
      .from('business_profiles')
      .select('*')
      .eq('user_id', userId)
      .single()

    const deploymentConfig = {
      name: request.employee_name,
      category: request.employee_category,
      templateId: templateId,
      businessContext: profile?.business_name || '',
      industry: profile?.industry || '',
      deployedAt: new Date().toISOString(),
    }

    // Use Puter's free Claude API to generate a deployment script/plan
    let deploymentPlan = 'Basic deployment configuration'

    try {
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
                content: 'You are an AI deployment specialist. Create deployment configurations for AI employees.'
              },
              {
                role: 'user',
                content: `Create a deployment plan for an AI employee:
                Name: ${deploymentConfig.name}
                Category: ${deploymentConfig.category}
                Template: ${deploymentConfig.templateId}
                Business: ${deploymentConfig.businessContext}
                Industry: ${deploymentConfig.industry}
                
                Provide a structured deployment plan including setup steps, integrations, and configuration.`
              }
            ]
          }
        }),
      })

      if (aiResponse.ok) {
        const aiData = await aiResponse.json()
        deploymentPlan = aiData.message?.content?.[0]?.text || aiData.result
      }
    } catch (aiError) {
      console.error('AI deployment plan error:', aiError)
    }

    // Create deployed employee record
    const { data: deployed, error: deployError } = await supabase
      .from('deployed_employees')
      .insert({
        user_id: userId,
        template_id: templateId,
        name: request.employee_name,
        category: request.employee_category,
        status: 'active',
        configuration: deploymentConfig,
        deployment_plan: deploymentPlan,
      })
      .select()
      .single()

    if (deployError) {
      throw deployError
    }

    // Update deployment request status to completed
    await supabase
      .from('deployment_requests')
      .update({ 
        status: 'completed',
        deployed_employee_id: deployed.id,
        completed_at: new Date().toISOString(),
      })
      .eq('id', requestId)

    // Create initial task for the deployed employee
    await supabase
      .from('agent_tasks')
      .insert({
        user_id: userId,
        deployed_employee_id: deployed.id,
        task_type: 'initialization',
        description: 'AI Employee initialization and setup',
        status: 'pending',
      })

    // Initialize metrics
    await supabase
      .from('agent_metrics')
      .insert({
        user_id: userId,
        deployed_employee_id: deployed.id,
        tasks_completed: 0,
        avg_completion_time: 0,
        success_rate: 100,
      })

    return new Response(
      JSON.stringify({ 
        success: true,
        deployedEmployee: deployed,
        message: `${request.employee_name} deployed successfully`,
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('Error:', error)
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    if (supabaseUrl && supabaseKey && requestId && userId) {
      const supabase = createClient(supabaseUrl, supabaseKey)
      await supabase
        .from('deployment_requests')
        .update({ 
          status: 'failed',
          error_message: error instanceof Error ? error.message : 'Unknown error',
        })
        .eq('id', requestId)
        .eq('user_id', userId)
    }

    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
