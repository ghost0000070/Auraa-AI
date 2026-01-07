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

  // Debug: Log all headers
  const allHeaders: Record<string, string> = {}
  req.headers.forEach((value, key) => {
    allHeaders[key] = key.toLowerCase() === 'authorization' ? `Bearer ${value.substring(7, 20)}...` : value
  })
  console.log('All request headers:', JSON.stringify(allHeaders))

  // Verify authorization header (try both cases for HTTP/2 compatibility)
  const authHeader = req.headers.get('Authorization') || req.headers.get('authorization')
  console.log('Auth header present:', !!authHeader)
  
  if (!authHeader) {
    return new Response(
      JSON.stringify({ error: 'Missing authorization header', headers: Object.keys(allHeaders) }),
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

    // Initialize Supabase client with service role for database operations
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Extract and decode JWT token to get user ID
    // The Supabase gateway already validates the token, so we can trust the payload
    const token = authHeader.replace('Bearer ', '')
    
    let authenticatedUserId: string
    
    try {
      // Decode JWT payload (base64url encoded, second part of the token)
      const parts = token.split('.')
      if (parts.length !== 3) {
        throw new Error('Invalid JWT format')
      }
      
      // Decode base64url to base64, then decode
      const base64Payload = parts[1].replace(/-/g, '+').replace(/_/g, '/')
      const payload = JSON.parse(atob(base64Payload))
      
      console.log('JWT payload:', { 
        sub: payload.sub, 
        role: payload.role,
        exp: payload.exp,
        requestUserId: userId
      })
      
      if (!payload.sub) {
        throw new Error('No subject (user ID) in token')
      }
      
      // Verify token hasn't expired
      if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
        throw new Error('Token expired')
      }
      
      authenticatedUserId = payload.sub
    } catch (jwtError) {
      console.error('JWT decode error:', jwtError)
      return new Response(
        JSON.stringify({ error: 'Unauthorized: Invalid token', details: String(jwtError) }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Fetch deployment request
    const { data: request, error: fetchError } = await supabase
      .from('deployment_requests')
      .select('*')
      .eq('id', requestId)
      .eq('user_id', authenticatedUserId)
      .single()

    if (fetchError || !request) {
      console.log('Fetch error:', { fetchError, requestId, authenticatedUserId })
      throw new Error('Deployment request not found or not owned by user')
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
      .eq('user_id', authenticatedUserId)
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
    const deploymentPlan = `Deployment configuration for ${request.employee_name}:
- Category: ${request.employee_category}
- Template: ${templateId}
- Business: ${profile?.business_name || 'Not specified'}
- Industry: ${profile?.industry || 'General'}
- Deployed: ${new Date().toISOString()}

This AI employee is now active and ready to assist with ${request.employee_category} tasks.`

    // Note: Puter AI can be called here but for speed, using default plan
    // The actual AI interactions happen in the frontend via Puter.js

    // Create deployed employee record
    console.log('Creating deployed employee with data:', {
      user_id: authenticatedUserId,
      template_id: templateId,
      name: request.employee_name,
      role: request.employee_category || 'AI Employee',
      category: request.employee_category,
      status: 'active',
    })
    
    const { data: deployed, error: deployError } = await supabase
      .from('deployed_employees')
      .insert({
        user_id: authenticatedUserId,
        template_id: templateId,
        name: request.employee_name,
        role: request.employee_category || 'AI Employee',
        category: request.employee_category,
        status: 'active',
        configuration: deploymentConfig,
        deployment_plan: deploymentPlan,
      })
      .select()
      .single()

    if (deployError) {
      console.error('Deploy insert error:', JSON.stringify(deployError))
      throw new Error(`Failed to insert deployed_employees: ${deployError.message} (code: ${deployError.code})`)
    }
    
    console.log('Deployed employee created:', deployed?.id)

    // Update deployment request status to completed
    console.log('Updating deployment request to completed')
    const { error: updateError } = await supabase
      .from('deployment_requests')
      .update({ 
        status: 'completed',
        deployed_employee_id: deployed.id,
        completed_at: new Date().toISOString(),
      })
      .eq('id', requestId)
    
    if (updateError) {
      console.error('Update deployment request error:', JSON.stringify(updateError))
    }

    // Create initial task for the deployed employee
    console.log('Creating initial task')
    const { error: taskError } = await supabase
      .from('agent_tasks')
      .insert({
        user_id: authenticatedUserId,
        deployed_employee_id: deployed.id,
        title: 'AI Employee Initialization',
        task_type: 'initialization',
        description: 'AI Employee initialization and setup',
        status: 'pending',
      })
    
    if (taskError) {
      console.error('Task insert error:', JSON.stringify(taskError))
    }

    // Initialize metrics
    console.log('Creating metrics')
    const { error: metricsError } = await supabase
      .from('agent_metrics')
      .insert({
        user_id: authenticatedUserId,
        deployed_employee_id: deployed.id,
        tasks_completed: 0,
        avg_completion_time: 0,
        success_rate: 100,
      })
    
    if (metricsError) {
      console.error('Metrics insert error:', JSON.stringify(metricsError))
    }
    
    console.log('Deployment successful!')

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
    if (supabaseUrl && supabaseKey && requestId) {
      try {
        const supabase = createClient(supabaseUrl, supabaseKey)
        await supabase
          .from('deployment_requests')
          .update({ 
            status: 'failed',
            error_message: error instanceof Error ? error.message : 'Unknown error',
          })
          .eq('id', requestId)
      } catch (updateError) {
        console.error('Failed to update deployment request status:', updateError)
      }
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
