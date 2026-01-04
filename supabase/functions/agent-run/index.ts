// Agent Run Edge Function - v2.0 with OpenAI/Anthropic fallback
// Updated: 2026-01-04
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// AI API endpoints
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions'
const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages'

interface TaskPayload {
  taskId?: string
  queueId?: string
  action: string
  params: Record<string, unknown>
  context?: string
  userId: string
  employeeId?: string
}

interface ActionResult {
  success: boolean
  result?: unknown
  error?: string
  executionTimeMs?: number
  provider?: string
}

// Execute an action using OpenAI API
async function executeOpenAIAction(action: string, params: Record<string, unknown>, context: string): Promise<ActionResult> {
  const startTime = Date.now()
  const apiKey = Deno.env.get('OPENAI_API_KEY')
  
  console.log('OpenAI API key present:', !!apiKey, 'length:', apiKey?.length || 0)
  
  if (!apiKey) {
    return { success: false, error: 'OpenAI API key not configured', executionTimeMs: Date.now() - startTime }
  }
  
  try {
    const prompt = buildPrompt(action, params, context)

    const response = await fetch(OPENAI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 2000,
      })
    })

    if (!response.ok) {
      const errorBody = await response.text()
      throw new Error(`OpenAI API error: ${response.status} - ${errorBody.substring(0, 200)}`)
    }

    const data = await response.json()
    const content = data.choices?.[0]?.message?.content

    return parseAIResponse(content, startTime, 'openai')
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      executionTimeMs: Date.now() - startTime,
      provider: 'openai'
    }
  }
}

// Execute an action using Anthropic API
async function executeAnthropicAction(action: string, params: Record<string, unknown>, context: string): Promise<ActionResult> {
  const startTime = Date.now()
  const apiKey = Deno.env.get('ANTHROPIC_API_KEY')
  
  if (!apiKey) {
    return { success: false, error: 'Anthropic API key not configured', executionTimeMs: Date.now() - startTime }
  }
  
  try {
    const prompt = buildPrompt(action, params, context)

    const response = await fetch(ANTHROPIC_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-3-haiku-20240307',
        max_tokens: 2000,
        messages: [{ role: 'user', content: prompt }],
      })
    })

    if (!response.ok) {
      const errorBody = await response.text()
      throw new Error(`Anthropic API error: ${response.status} - ${errorBody.substring(0, 200)}`)
    }

    const data = await response.json()
    const content = data.content?.[0]?.text

    return parseAIResponse(content, startTime, 'anthropic')
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      executionTimeMs: Date.now() - startTime,
      provider: 'anthropic'
    }
  }
}

// Build the prompt for AI actions
function buildPrompt(action: string, params: Record<string, unknown>, context: string): string {
  return `You are an AI agent executing the action: ${action}

Context: ${context}

Parameters: ${JSON.stringify(params, null, 2)}

Instructions:
1. Analyze the action and parameters
2. Generate appropriate output based on the action type
3. Return ONLY a valid JSON object with your results
4. Do not include markdown formatting or code blocks

For action "${action}", provide relevant output.`
}

// Parse AI response
function parseAIResponse(content: string, startTime: number, provider: string): ActionResult {
  let result: unknown
  try {
    // Try to extract JSON from response
    const jsonMatch = content.match(/\{[\s\S]*\}/)
    result = jsonMatch ? JSON.parse(jsonMatch[0]) : { text_output: content, raw_format: true }
  } catch {
    result = { text_output: content, raw_format: true }
  }

  return {
    success: true,
    result,
    executionTimeMs: Date.now() - startTime,
    provider
  }
}

// Execute AI action with fallback chain: OpenAI -> Anthropic -> Error
async function executeAIAction(action: string, params: Record<string, unknown>, context: string): Promise<ActionResult> {
  // Try OpenAI first
  const openaiResult = await executeOpenAIAction(action, params, context)
  console.log('OpenAI result:', JSON.stringify(openaiResult))
  if (openaiResult.success) {
    return openaiResult
  }
  
  // Fallback to Anthropic
  const anthropicResult = await executeAnthropicAction(action, params, context)
  console.log('Anthropic result:', JSON.stringify(anthropicResult))
  if (anthropicResult.success) {
    return anthropicResult
  }
  
  // Both failed - check if it's a billing issue
  const isBillingIssue = 
    openaiResult.error?.includes('quota') || 
    openaiResult.error?.includes('429') ||
    anthropicResult.error?.includes('credit balance') ||
    anthropicResult.error?.includes('billing')
  
  if (isBillingIssue) {
    return {
      success: false,
      error: 'AI backend billing required. Please use the app frontend for free AI via Puter.js, or add billing to OpenAI/Anthropic.',
      executionTimeMs: (openaiResult.executionTimeMs || 0) + (anthropicResult.executionTimeMs || 0)
    }
  }
  
  // Return detailed error for other issues
  return {
    success: false,
    error: `AI providers failed. OpenAI: ${openaiResult.error}. Anthropic: ${anthropicResult.error}`,
    executionTimeMs: (openaiResult.executionTimeMs || 0) + (anthropicResult.executionTimeMs || 0)
  }
}

// Execute internal actions (webhook, scrape, etc.)
async function executeInternalAction(action: string, params: Record<string, unknown>): Promise<ActionResult> {
  const startTime = Date.now()
  
  try {
    switch (action) {
      case 'webhook_call': {
        const { url, method = 'POST', body } = params as { url: string; method?: string; body?: unknown }
        const response = await fetch(url, {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: body ? JSON.stringify(body) : undefined
        })
        const result = await response.json().catch(() => ({ status: response.status }))
        return { success: response.ok, result, executionTimeMs: Date.now() - startTime }
      }
      
      case 'analyze_data':
      case 'generate_content':
        // These use AI, delegate to AI provider chain
        return await executeAIAction(action, params, 'Perform the requested analysis or generation')
      
      default:
        return {
          success: false,
          error: `Unknown internal action: ${action}`,
          executionTimeMs: Date.now() - startTime
        }
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      executionTimeMs: Date.now() - startTime
    }
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  // Debug endpoint to check env vars
  const url = new URL(req.url)
  if (url.searchParams.get('debug') === 'env') {
    const openaiKey = Deno.env.get('OPENAI_API_KEY')
    const anthropicKey = Deno.env.get('ANTHROPIC_API_KEY')
    return new Response(JSON.stringify({
      openai_configured: !!openaiKey,
      openai_key_length: openaiKey?.length || 0,
      anthropic_configured: !!anthropicKey,
      anthropic_key_length: anthropicKey?.length || 0,
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }

  try {
    const payload: TaskPayload = await req.json()
    const { taskId, queueId, action, params, context = '', userId, employeeId } = payload

    if (!action || !userId) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: action and userId' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Check if action exists and user has permission
    const { data: actionDef } = await supabase
      .from('agent_actions')
      .select('*')
      .eq('name', action)
      .eq('is_active', true)
      .single()

    if (!actionDef) {
      return new Response(
        JSON.stringify({ error: `Action "${action}" not found or inactive` }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check subscription tier
    const { data: user } = await supabase
      .from('users')
      .select('subscription_tier, role')
      .eq('id', userId)
      .single()

    const userTier = user?.subscription_tier || 'free'
    const isOwner = user?.role === 'owner'
    const tierOrder = ['free', 'pro', 'enterprise']
    const requiredTierIndex = tierOrder.indexOf(actionDef.required_subscription_tier)
    const userTierIndex = tierOrder.indexOf(userTier)

    if (!isOwner && userTierIndex < requiredTierIndex) {
      return new Response(
        JSON.stringify({ 
          error: `Action "${action}" requires ${actionDef.required_subscription_tier} tier`,
          required_tier: actionDef.required_subscription_tier
        }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Update queue status if using queue
    if (queueId) {
      await supabase
        .from('agent_task_queue')
        .update({ 
          status: 'processing', 
          locked_at: new Date().toISOString(),
          locked_by: 'agent-run-function',
          attempts: supabase.rpc('increment_attempts', { row_id: queueId })
        })
        .eq('id', queueId)
    }

    // Execute the action
    let result: ActionResult

    if (actionDef.action_type === 'internal') {
      result = await executeInternalAction(action, params)
    } else {
      // For external_api, email, webhook - use AI to help format/process
      result = await executeAIAction(action, params, context || actionDef.description || '')
    }

    // Log the action execution
    await supabase
      .from('agent_action_logs')
      .insert({
        user_id: userId,
        deployed_employee_id: employeeId,
        action_id: actionDef.id,
        action_name: action,
        input_params: params,
        output_result: result.result,
        status: result.success ? 'success' : 'failed',
        error_message: result.error,
        execution_time_ms: result.executionTimeMs,
        started_at: new Date(Date.now() - (result.executionTimeMs || 0)).toISOString(),
        completed_at: new Date().toISOString()
      })

    // Update queue status if using queue
    if (queueId) {
      await supabase
        .from('agent_task_queue')
        .update({ 
          status: result.success ? 'completed' : 'failed',
          result: result.result,
          error_message: result.error,
          updated_at: new Date().toISOString()
        })
        .eq('id', queueId)
    }

    // Update task status if taskId provided
    if (taskId) {
      await supabase
        .from('agent_tasks')
        .update({
          status: result.success ? 'completed' : 'failed',
          result: result.result,
          error: result.error,
          finished_at: new Date().toISOString(),
          completed_at: new Date().toISOString()
        })
        .eq('id', taskId)
    }

    // Update action usage count
    await supabase
      .from('agent_actions')
      .update({ usage_count: actionDef.usage_count + 1 })
      .eq('id', actionDef.id)

    return new Response(
      JSON.stringify({
        success: result.success,
        action,
        result: result.result,
        error: result.error,
        executionTimeMs: result.executionTimeMs
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: result.success ? 200 : 500,
      }
    )

  } catch (error) {
    console.error('Agent run error:', error)
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
