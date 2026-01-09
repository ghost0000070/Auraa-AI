import type { PuterChatResponse } from "../types/puter";
import { toast } from "sonner";
import { AI_MODELS, TIER_MODELS } from '@/config/constants';
import { supabase } from '../supabase';

// Puter.js is loaded via CDN in index.html, available as window.puter
// Use type declaration from src/types/puter.d.ts

// Use centralized model constants - Claude models via Puter.js (FREE)
const MODELS = AI_MODELS;

// ============================================================================
// BUSINESS CONTEXT TYPES & FUNCTIONS
// ============================================================================

export interface BusinessContext {
    companyName: string;
    industry: string;
    description: string;
    targetAudience: string;
    website?: string;
    brandVoice?: string;
    goals?: string[];
    additionalContext?: Record<string, unknown>;
}

export interface EmployeeContext {
    employeeId: string;
    templateId: string;
    employeeName: string;
    recentMemories: Array<{ type: string; title: string; content: string; createdAt: string }>;
    businessInsights: Array<{ category: string; title: string; insight: string }>;
    pendingActions: Array<{ title: string; description: string; priority: number }>;
}

/**
 * Fetch the user's business profile for context injection
 */
export async function getBusinessContext(userId: string): Promise<BusinessContext | null> {
    const { data, error } = await supabase
        .from('business_profiles')
        .select('*')
        .eq('user_id', userId)
        .single();
    
    if (error || !data) {
        console.warn('No business profile found for user:', userId);
        return null;
    }

    return {
        companyName: data.business_name || 'Unknown Company',
        industry: data.industry || 'General',
        description: data.description || '',
        targetAudience: data.target_audience || '',
        website: data.website_url,
        brandVoice: data.brand_voice,
        goals: data.business_goals || [],
        additionalContext: {
            ...(data.additional_data || {}),
            // Enhanced profile fields
            uniqueValueProposition: data.unique_value_proposition,
            missionStatement: data.mission_statement,
            keyProducts: data.key_products,
            competitorNames: data.competitor_names,
            primarySeoKeywords: data.primary_seo_keywords,
            idealCustomerProfile: data.ideal_customer_profile,
            socialMedia: data.social_media,
            monthlyBudget: data.monthly_budget,
            revenueGoal: data.revenue_goal,
            currentChallenges: data.current_challenges,
            shortTermGoals: data.short_term_goals,
            longTermGoals: data.long_term_goals,
        },
    };
}

/**
 * Fetch employee-specific context including memories and insights
 */
export async function getEmployeeContext(employeeId: string, userId: string): Promise<EmployeeContext | null> {
    // Get employee info from deployed_employees (user's actual deployed instances)
    const { data: employee } = await supabase
        .from('deployed_employees')
        .select('id, name, template_id')
        .eq('id', employeeId)
        .eq('user_id', userId)
        .single();

    if (!employee) return null;

    // Get recent memories
    const { data: memories } = await supabase
        .from('employee_memory')
        .select('memory_type, title, content, created_at')
        .eq('employee_id', employeeId)
        .order('created_at', { ascending: false })
        .limit(20);

    // Get business insights
    const { data: insights } = await supabase
        .from('business_insights')
        .select('category, title, insight')
        .eq('user_id', userId)
        .eq('is_actionable', true)
        .order('created_at', { ascending: false })
        .limit(30);

    // Get pending autonomous actions
    const { data: actions } = await supabase
        .from('autonomous_actions')
        .select('action_title, action_description, priority')
        .eq('employee_id', employeeId)
        .eq('status', 'pending')
        .order('priority', { ascending: false })
        .limit(10);

    return {
        employeeId: employee.id,
        templateId: employee.template_id,
        employeeName: employee.name,
        recentMemories: (memories || []).map(m => ({
            type: m.memory_type,
            title: m.title,
            content: m.content,
            createdAt: m.created_at,
        })),
        businessInsights: (insights || []).map(i => ({
            category: i.category,
            title: i.title,
            insight: i.insight,
        })),
        pendingActions: (actions || []).map(a => ({
            title: a.action_title,
            description: a.action_description,
            priority: a.priority,
        })),
    };
}

/**
 * Build a rich context string for AI prompts including business and employee context
 */
export function buildEnrichedContext(
    baseContext: string,
    businessContext: BusinessContext | null,
    employeeContext: EmployeeContext | null
): string {
    let enrichedContext = baseContext;

    if (businessContext) {
        enrichedContext += `\n\n=== BUSINESS CONTEXT ===
Company: ${businessContext.companyName}
Industry: ${businessContext.industry}
Description: ${businessContext.description}
Target Audience: ${businessContext.targetAudience}
${businessContext.website ? `Website: ${businessContext.website}` : ''}
${businessContext.brandVoice ? `Brand Voice: ${businessContext.brandVoice}` : ''}
${businessContext.goals?.length ? `Business Goals: ${businessContext.goals.join(', ')}` : ''}

Your role is to help this business succeed. Every action you take should consider:
1. How does this align with the company's industry and target audience?
2. How does this help achieve their business goals?
3. Does the tone match their brand voice?
`;
    }

    if (employeeContext) {
        enrichedContext += `\n\n=== YOUR CONTEXT AS ${employeeContext.employeeName.toUpperCase()} ===`;
        
        if (employeeContext.recentMemories.length > 0) {
            enrichedContext += `\n\nRecent Work (what you've done/learned):`;
            employeeContext.recentMemories.slice(0, 5).forEach(m => {
                enrichedContext += `\n- [${m.type}] ${m.title}`;
            });
        }

        if (employeeContext.businessInsights.length > 0) {
            enrichedContext += `\n\nKnown Business Insights:`;
            employeeContext.businessInsights.slice(0, 5).forEach(i => {
                enrichedContext += `\n- [${i.category}] ${i.title}: ${i.insight.substring(0, 100)}...`;
            });
        }

        if (employeeContext.pendingActions.length > 0) {
            enrichedContext += `\n\nYour Pending Actions:`;
            employeeContext.pendingActions.forEach(a => {
                enrichedContext += `\n- [Priority ${a.priority}] ${a.title}`;
            });
        }
    }

    return enrichedContext;
}

/**
 * Store a memory for an employee
 */
export async function storeEmployeeMemory(
    userId: string,
    employeeId: string,
    templateId: string,
    memoryType: 'action' | 'insight' | 'research' | 'decision' | 'delegation' | 'learning',
    title: string,
    content: string,
    metadata?: Record<string, unknown>,
    outcome?: 'success' | 'partial' | 'failed' | 'pending'
): Promise<void> {
    await supabase.from('employee_memory').insert({
        user_id: userId,
        employee_id: employeeId,
        template_id: templateId,
        memory_type: memoryType,
        title,
        content,
        metadata: metadata || {},
        outcome,
    });
}

/**
 * Store a business insight discovered by an employee
 */
export async function storeBusinessInsight(
    userId: string,
    employeeId: string | null,
    templateId: string | null,
    category: 'market' | 'competitor' | 'customer' | 'product' | 'operations' | 'strategy',
    title: string,
    insight: string,
    recommendedAction?: string,
    confidenceScore?: number
): Promise<void> {
    await supabase.from('business_insights').insert({
        user_id: userId,
        employee_id: employeeId,
        template_id: templateId,
        category,
        title,
        insight,
        recommended_action: recommendedAction,
        confidence_score: confidenceScore || 0.7,
        is_actionable: !!recommendedAction,
    });
}

// ============================================================================
// ORIGINAL AI ENGINE CODE
// ============================================================================

/**
 * Get the Claude model based on user's subscription tier
 * Free: Claude 3 Haiku (fast, basic)
 * Pro: Claude 3.5 Sonnet (balanced, powerful)
 * Enterprise: Claude Sonnet 4.5 (latest, most capable)
 */
export function getModelForTier(tier: string | null | undefined): string {
    const normalizedTier = (tier || 'free').toLowerCase();
    return TIER_MODELS[normalizedTier as keyof typeof TIER_MODELS] || TIER_MODELS.free;
}

/**
 * Get user's subscription tier from Supabase
 */
export async function getUserTier(): Promise<string> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return 'free';
    
    const { data } = await supabase
        .from('users')
        .select('subscription_tier')
        .eq('id', user.id)
        .single();
    
    return data?.subscription_tier || 'free';
}

/**
 * Get the appropriate Claude model based on task category/complexity
 * All models are free via Puter.js
 */
export function getModelForCategory(category: string): string {
    switch (category.toLowerCase()) {
        // Complex reasoning and strategic tasks - use Opus
        case 'strategy':
        case 'analytics':
        case 'business intelligence':
        case 'executive':
            return MODELS.COMPLEX;
        
        // Creative and content tasks - use Opus for quality
        case 'marketing':
        case 'content':
        case 'creative':
            return MODELS.CREATIVE;
        
        // Technical and coding tasks - use Sonnet for balanced performance
        case 'engineering':
        case 'development':
        case 'technical':
        case 'coding':
            return MODELS.CODING;
        
        // Fast, simple tasks - use Haiku for speed
        case 'support':
        case 'customer service':
        case 'quick response':
            return MODELS.FAST;
        
        // Default to Sonnet for balanced performance
        default:
            return MODELS.STANDARD;
    }
}

/**
 * callPuterAI - Primary Strategy (Free Client-Side AI)
 * Uses Puter.js to access AI models for FREE (no credits required)
 * Models: gpt-5-mini (FREE, no credits needed)
 */
async function callPuterAI(prompt: string, systemContext: string, model: string = MODELS.STANDARD): Promise<string> {
    // Use puter npm package - works in browser environment
    if (typeof window === 'undefined') {
        throw new Error("Puter.js requires browser environment");
    }

    console.log(`🤖 Using Claude model via Puter.js: ${model}`);

    const fullPrompt = `
        System Context: ${systemContext}
        
        User Request: ${prompt}
        
        Instructions: 
        1. Act exactly as the persona described in the System Context.
        2. Return ONLY valid JSON if the context asks for it.
        3. Do not include markdown formatting (like \`\`\`json) in your response if JSON is requested.
    `;

    // Guard: ensure Puter is available in the browser
    const puter = (typeof window !== 'undefined' ? (window as any).puter : null);
    if (!puter?.ai?.chat) {
        throw new Error('Puter.js is not loaded. Please refresh and allow the Puter script to load.');
    }

    const response = await puter.ai.chat(fullPrompt, { model });
    
    console.log('🔍 Puter response type:', typeof response, response);
    
    // Ensure response is of type PuterChatResponse, not AsyncIterable
    if ((response as AsyncIterable<unknown>)[Symbol.asyncIterator]) {
        // Handle streaming response if necessary, or throw if not expected
        throw new Error("Streaming response from Puter AI not handled by this function.");
    }

    // Handle different response formats from Puter API
    let content: string | undefined;
    
    // Format 1: { message: { content: [{ text: '...' }] } }
    if ((response as PuterChatResponse).message?.content?.[0]?.text) {
        content = (response as PuterChatResponse).message.content[0].text;
    }
    // Format 2: { text: '...' } (direct text response)
    else if ((response as { text?: string }).text) {
        content = (response as { text: string }).text;
    }
    // Format 3: { content: '...' }
    else if ((response as { content?: string }).content) {
        content = (response as { content: string }).content;
    }
    // Format 4: String response directly
    else if (typeof response === 'string') {
        content = response;
    }
    
    console.log('🔍 Extracted content:', content?.substring(0, 100) + '...');
    
    if (!content) throw new Error("Empty response or unexpected format from Puter AI");
    return content;
}

/**
 * callVercelAIGateway - Secondary Strategy (Supabase Edge Function)
 * Fallback when Puter.js is unavailable - routes to agent-run edge function
 */
async function callVercelAIGateway(prompt: string, systemContext: string, category: string = 'default'): Promise<string> {
    console.log(`🌐 Using Edge Function fallback for category: ${category}`);
    
    // Get auth token for edge function
    const { data: { session } } = await supabase.auth.getSession();
    const authToken = session?.access_token;
    
    const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/agent-run`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': authToken ? `Bearer ${authToken}` : '',
        },
        body: JSON.stringify({
            task: 'custom_prompt',
            prompt,
            systemContext,
            category,
        }),
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(error.error || `Vercel AI Gateway failed: ${response.status}`);
    }

    const result = await response.json();
    
    if (!result.text) {
        throw new Error('Empty response from Vercel AI Gateway');
    }
    
    console.log(`✅ Vercel AI Gateway response (model: ${result.model}, tokens: ${result.usage?.totalTokens})`);
    return result.text;
}

/**
 * callCloudFallback - EMERGENCY Fallback (Anthropic API via Edge Function)
 * Only used when both Puter.js AND Vercel AI Gateway are unavailable
 * Primary AI should always be Puter.js (free Claude access)
 */
async function callCloudFallback(taskName: string, data: unknown, context?: string): Promise<string> {
    console.log(`🚨 EMERGENCY: All primary providers unavailable. Using Supabase fallback for ${taskName}`);
    
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        throw new Error('User not authenticated for cloud fallback');
    }

    // Call the agent-run edge function
    const { data: result, error } = await supabase.functions.invoke('agent-run', {
        body: {
            action: 'generate_content',
            params: {
                task: taskName,
                data,
                prompt: JSON.stringify(data)
            },
            context: context || `Executing task: ${taskName}`,
            userId: user.id
        }
    });

    if (error) {
        console.error('Cloud fallback error:', error);
        throw new Error(`Cloud fallback failed: ${error.message}`);
    }

    if (!result?.success) {
        throw new Error(result?.error || 'Cloud fallback returned unsuccessful result');
    }

    // Return the result as a string
    return typeof result.result === 'string' 
        ? result.result 
        : JSON.stringify(result.result);
}

/**
 * executeTask - Main Orchestrator
 * Tries Puter first, falls back to Cloud Function.
 */
async function executeTask(taskName: string, data: unknown, context: string, model: string = MODELS.STANDARD): Promise<{
    success: boolean;
    task?: string;
    result?: unknown;
    timestamp?: string;
    provider?: string;
    error?: string;
}> {
    const toastId = toast.loading(`Executing ${taskName}...`);
    
    // Prepare Prompt & System for Puter
    const prompt = JSON.stringify(data);
    const system = `You are an expert AI employee performing the task: ${taskName}. 
Context: ${context}. 
Return a valid JSON object with your. analysis, results, and any generated content. 
Do not include markdown formatting around the JSON. Just the JSON.`;

    try {
        // 1. Try Puter (Primary - FREE)
        const result = await callPuterAI(prompt, system, model);
        
        // Parse Result
        let parsedResult: unknown;
        try { parsedResult = JSON.parse(result); } 
        catch (e) { parsedResult = { text_output: result, raw_format: true }; }

        toast.success(`${taskName} completed (via Puter)`, { id: toastId });
        return {
            success: true,
            task: taskName,
            result: parsedResult,
            timestamp: new Date().toISOString(),
            provider: "puter"
        };

    } catch (puterError: unknown) {
        console.warn(`⚠️ Puter AI failed, trying Vercel AI Gateway...`, puterError);
        
        // 2. Try Vercel AI Gateway (Secondary - Cached & Observable)
        try {
            // Determine category from model for proper routing
            const category = model === MODELS.COMPLEX ? 'strategy' 
                           : model === MODELS.FAST ? 'support' 
                           : 'default';
            
            const vercelResult = await callVercelAIGateway(prompt, system, category);
            
            // Parse Result
            let parsedResult: unknown;
            try { parsedResult = JSON.parse(vercelResult); } 
            catch (e) { parsedResult = { text_output: vercelResult, raw_format: true }; }

            toast.success(`${taskName} completed (via Vercel AI)`, { id: toastId });
            return {
                success: true,
                task: taskName,
                result: parsedResult,
                timestamp: new Date().toISOString(),
                provider: "vercel-ai-gateway"
            };

        } catch (vercelError: unknown) {
            console.warn(`⚠️ Vercel AI Gateway failed, trying emergency fallback...`, vercelError);
            
            // 3. Emergency Fallback to Supabase Edge Function
            try {
                const fallbackResult = await callCloudFallback(taskName, data, context);
                
                // Parse Fallback Result
                let parsedResult: unknown;
                try { parsedResult = JSON.parse(fallbackResult); } 
                catch (e) { parsedResult = { text_output: fallbackResult, raw_format: true }; }

                toast.success(`${taskName} completed (via Cloud Fallback)`, { id: toastId });
                return {
                    success: true,
                    task: taskName,
                    result: parsedResult,
                    timestamp: new Date().toISOString(),
                    provider: "cloud-fallback"
                };
            } catch (cloudError: unknown) {
                console.error(`❌ Failed to execute ${taskName} on all providers.`, { puterError, vercelError, cloudError });
                toast.error(`Failed to execute ${taskName}`, { id: toastId });
                return {
                    success: false,
                    error: cloudError instanceof Error ? cloudError.message : String(cloudError),
                };
            }
        }
    }
}

/**
 * executeTaskWithTierModel - Execute task using user's subscription tier model
 * Automatically detects user's tier and uses the appropriate Claude model:
 * - Free: Claude 3 Haiku (basic)
 * - Pro: Claude 3.5 Sonnet (balanced)
 * - Enterprise: Claude Sonnet 4.5 (most capable)
 */
async function executeTaskWithTierModel(
    taskName: string, 
    data: unknown, 
    context: string,
    userTier?: string
): Promise<{
    success: boolean;
    task?: string;
    result?: unknown;
    timestamp?: string;
    provider?: string;
    model?: string;
    error?: string;
}> {
    // Get the tier if not provided
    const tier = userTier || await getUserTier();
    const model = getModelForTier(tier);
    
    console.log(`🎯 Using tier-based model: ${model} for ${tier} tier user`);
    
    const result = await executeTask(taskName, data, context, model);
    return { ...result, model };
}

// --- Public API ---

export const AIEngine = {
    
    // 1. Chat (Special handling for simpler signature)
    generateChatCompletion: async (prompt: string, personality?: string) => {
        const system = personality 
            ? `You are an AI employee with this personality: ${personality}. Keep responses concise and professional.` 
            : "You are a helpful AI assistant.";
        
        try {
            // Try Puter
            const text = await callPuterAI(prompt, system, MODELS.FAST);
            return { completion: { text }, provider: 'puter' };
        } catch (e: unknown) {
            // Fallback
            try {
                const text = await callCloudFallback('generateChatCompletion', { prompt, personality });
                return { completion: { text }, provider: 'cloud' };
            } catch (cloudError: unknown) {
                 return { completion: { text: "I'm having trouble connecting to my neural network (All providers failed)." } };
            }
        }
    },

    // 2. Workflows
    workflowExecution: async (data: unknown) => 
        executeTask("workflowExecution", data, "Analyze the workflow request and determine execution steps.", MODELS.COMPLEX),

    businessSync: async (data: unknown) => 
        executeTask("businessSync", data, "Sync business data. Analyze the input data for discrepancies.", MODELS.STANDARD),

    // 3. Specific Tasks
    analyzeMarketingData: async (data: unknown) => 
        executeTask('analyzeMarketingData', data, "Analyze marketing metrics, identify trends, and suggest improvements.", MODELS.STANDARD),
        
    automateSalesOutreach: async (data: unknown) => 
        executeTask('automateSalesOutreach', data, "Draft personalized sales emails based on the provided lead data.", MODELS.STANDARD),
        
    handleSupportTicket: async (data: unknown) => 
        executeTask('handleSupportTicket', data, "Draft a polite and helpful response to the customer support ticket.", MODELS.FAST),
        
    analyzeBusinessData: async (data: unknown) => 
        executeTask('analyzeBusinessData', data, "Analyze the provided business data and generate strategic insights.", MODELS.COMPLEX),
        
    generateCode: async (data: unknown) => 
        executeTask('generateCode', data, "Generate clean, efficient, and well-commented code.", MODELS.COMPLEX),
        
    manageProjectTasks: async (data: unknown) => 
        executeTask('manageProjectTasks', data, "Organize the project tasks, assign priorities, and identify blockers.", MODELS.STANDARD),
        
    analyzeLegalDocument: async (data: unknown) => 
        executeTask('analyzeLegalDocument', data, "Review the legal document for risks, obligations, and compliance.", MODELS.COMPLEX),
        
    analyzeFinancialData: async (data: unknown) => 
        executeTask('analyzeFinancialData', data, "Analyze the financial data/statements and provide a summary.", MODELS.COMPLEX),
        
    orchestrateAiTeam: async (data: unknown) => 
        executeTask('orchestrateAiTeam', data, "Act as the coordinator. Break down the complex problem and assign sub-tasks.", MODELS.COMPLEX),

    // 4. Additional AI Employees (Previously Missing)
    managePersonalTasks: async (data: unknown) => 
        executeTask('managePersonalTasks', data, "Organize and prioritize personal tasks, manage schedules, and set reminders.", MODELS.STANDARD),
        
    resolveItIssue: async (data: unknown) => 
        executeTask('resolveItIssue', data, "Troubleshoot and resolve IT issues with step-by-step guidance.", MODELS.STANDARD),
        
    optimizeSupplyChain: async (data: unknown) => 
        executeTask('optimizeSupplyChain', data, "Analyze supply chain operations and recommend efficiency improvements.", MODELS.COMPLEX),
        
    analyzeSecurityThreat: async (data: unknown) => 
        executeTask('analyzeSecurityThreat', data, "Assess security threats and recommend protective measures.", MODELS.COMPLEX),
        
    analyzeProductFeedback: async (data: unknown) => 
        executeTask('analyzeProductFeedback', data, "Analyze customer feedback and identify product improvement opportunities.", MODELS.STANDARD),
        
    managePatientRecords: async (data: unknown) => 
        executeTask('managePatientRecords', data, "Manage patient records securely and ensure compliance with healthcare regulations.", MODELS.STANDARD),
        
    // Add generic fallback for others
    runGenericTask: async (taskName: string, data: unknown) =>
        executeTask(taskName, data, "Perform the requested task to the best of your ability.", MODELS.STANDARD),
    
    // 5. Tier-Aware Methods (use user's subscription model automatically)
    runTaskWithTierModel: executeTaskWithTierModel,
    
    // Get user's tier-based model for display/info
    getModelForUserTier: async () => {
        const tier = await getUserTier();
        return { tier, model: getModelForTier(tier) };
    },

    // 6. Autonomous Employee Methods
    
    /**
     * Execute a task with full business and employee context
     * This is the primary method for autonomous employee actions
     */
    executeWithFullContext: async (
        taskName: string,
        data: unknown,
        baseContext: string,
        userId: string,
        employeeId?: string,
        model: string = MODELS.STANDARD
    ) => {
        // Fetch business context
        const businessContext = await getBusinessContext(userId);
        
        // Fetch employee context if provided
        const employeeContext = employeeId 
            ? await getEmployeeContext(employeeId, userId)
            : null;
        
        // Build enriched context
        const enrichedContext = buildEnrichedContext(baseContext, businessContext, employeeContext);
        
        // Execute the task with full context
        return executeTask(taskName, data, enrichedContext, model);
    },

    /**
     * Ask an employee to decide what they should do next
     * Returns a structured decision with action type and parameters
     */
    getAutonomousDecision: async (
        userId: string,
        employeeId: string,
        _templateId: string,
        decisionPrompt: string,
        autonomousDuties: string[]
    ): Promise<{
        shouldAct: boolean;
        actionType: string;
        actionTitle: string;
        actionDescription: string;
        actionParameters: Record<string, unknown>;
        reasoning: string;
        priority: number;
    }> => {
        // Fetch full context
        const businessContext = await getBusinessContext(userId);
        const employeeContext = await getEmployeeContext(employeeId, userId);

        if (!businessContext) {
            return {
                shouldAct: false,
                actionType: 'none',
                actionTitle: 'No business profile',
                actionDescription: 'Cannot make decisions without business context',
                actionParameters: {},
                reasoning: 'Business profile not configured',
                priority: 0,
            };
        }

        const prompt = `
${decisionPrompt}

=== BUSINESS PROFILE ===
Company: ${businessContext.companyName}
Industry: ${businessContext.industry}
Description: ${businessContext.description}
Target Audience: ${businessContext.targetAudience}
${businessContext.website ? `Website: ${businessContext.website}` : ''}
${businessContext.brandVoice ? `Brand Voice: ${businessContext.brandVoice}` : ''}
${businessContext.goals?.length ? `Business Goals: ${businessContext.goals.join(', ')}` : ''}

=== YOUR AUTONOMOUS DUTIES ===
${autonomousDuties.map((d, i) => `${i + 1}. ${d}`).join('\n')}

=== RECENT WORK ===
${employeeContext?.recentMemories.slice(0, 10).map(m => `- [${m.type}] ${m.title}`).join('\n') || 'No recent work recorded'}

=== KNOWN INSIGHTS ===
${employeeContext?.businessInsights.slice(0, 10).map(i => `- [${i.category}] ${i.insight.substring(0, 80)}...`).join('\n') || 'No insights yet'}

=== PENDING ACTIONS ===
${employeeContext?.pendingActions.map(a => `- ${a.title}`).join('\n') || 'No pending actions'}

Based on all this context, decide:
1. Should you take action right now? (Consider: Is there work that needs doing? Have you already done similar work recently? Would this add value?)
2. If yes, what specific action from your duties list best serves the business right now?
3. What exactly will you do and why?

Respond with a JSON object:
{
    "shouldAct": true/false,
    "actionType": "research" | "create_content" | "analyze" | "recommend" | "delegate" | "learn",
    "actionTitle": "Brief title of the action",
    "actionDescription": "Detailed description of what you will do",
    "actionParameters": { any structured data needed },
    "reasoning": "Why this action is valuable for the business right now",
    "priority": 1-10 (10 = most urgent)
}
`;

        try {
            const result = await callPuterAI(prompt, 'You are an autonomous AI employee making strategic decisions. Always respond with valid JSON.', MODELS.COMPLEX);
            
            // Parse the decision
            const cleaned = result.replace(/```json\n?|\n?```/g, '').trim();
            const decision = JSON.parse(cleaned);
            
            return {
                shouldAct: decision.shouldAct ?? false,
                actionType: decision.actionType || 'none',
                actionTitle: decision.actionTitle || 'Unknown action',
                actionDescription: decision.actionDescription || '',
                actionParameters: decision.actionParameters || {},
                reasoning: decision.reasoning || '',
                priority: decision.priority || 5,
            };
        } catch (error) {
            console.error('Failed to get autonomous decision:', error);
            return {
                shouldAct: false,
                actionType: 'error',
                actionTitle: 'Decision failed',
                actionDescription: String(error),
                actionParameters: {},
                reasoning: 'AI decision-making failed',
                priority: 0,
            };
        }
    },

    /**
     * Execute an autonomous action and store the result
     */
    executeAutonomousAction: async (
        userId: string,
        employeeId: string,
        templateId: string,
        action: {
            actionType: string;
            actionTitle: string;
            actionDescription: string;
            actionParameters: Record<string, unknown>;
            priority: number;
        }
    ): Promise<{
        success: boolean;
        result: string;
        insightsDiscovered: Array<{ category: string; title: string; insight: string; recommendedAction?: string }>;
    }> => {
        const businessContext = await getBusinessContext(userId);
        
        const prompt = `
You are executing an autonomous action for a business.

=== ACTION TO EXECUTE ===
Type: ${action.actionType}
Title: ${action.actionTitle}
Description: ${action.actionDescription}
Parameters: ${JSON.stringify(action.actionParameters)}

=== BUSINESS CONTEXT ===
Company: ${businessContext?.companyName || 'Unknown'}
Industry: ${businessContext?.industry || 'General'}
Description: ${businessContext?.description || 'N/A'}
Target Audience: ${businessContext?.targetAudience || 'N/A'}
${businessContext?.goals?.length ? `Goals: ${businessContext.goals.join(', ')}` : ''}

Execute this action thoroughly. Research, analyze, and provide actionable output.
Your output should directly help this specific business succeed.

Respond with JSON:
{
    "result": "Detailed output of your work - research findings, content created, analysis, recommendations, etc.",
    "insightsDiscovered": [
        {
            "category": "market|competitor|customer|product|operations|strategy",
            "title": "Brief insight title",
            "insight": "The insight you discovered",
            "recommendedAction": "What the business should do based on this insight"
        }
    ]
}
`;

        try {
            const response = await callPuterAI(prompt, 'You are an expert autonomous AI employee. Execute the action thoroughly and provide valuable output.', MODELS.COMPLEX);
            
            const cleaned = response.replace(/```json\n?|\n?```/g, '').trim();
            const parsed = JSON.parse(cleaned);

            // Store the action result as a memory
            await storeEmployeeMemory(
                userId,
                employeeId,
                templateId,
                'action',
                action.actionTitle,
                parsed.result,
                action.actionParameters,
                'success'
            );

            // Store any discovered insights
            for (const insight of (parsed.insightsDiscovered || [])) {
                await storeBusinessInsight(
                    userId,
                    employeeId,
                    templateId,
                    insight.category,
                    insight.title,
                    insight.insight,
                    insight.recommendedAction,
                    0.8
                );
            }

            return {
                success: true,
                result: parsed.result,
                insightsDiscovered: parsed.insightsDiscovered || [],
            };
        } catch (error) {
            console.error('Failed to execute autonomous action:', error);
            
            // Store failure
            await storeEmployeeMemory(
                userId,
                employeeId,
                templateId,
                'action',
                action.actionTitle,
                `Failed: ${String(error)}`,
                action.actionParameters,
                'failed'
            );

            return {
                success: false,
                result: String(error),
                insightsDiscovered: [],
            };
        }
    },

    // Context helpers exported for use elsewhere
    getBusinessContext,
    getEmployeeContext,
    buildEnrichedContext,
    storeEmployeeMemory,
    storeBusinessInsight,

    /**
     * Delegate work from one employee to another
     * Used by AI Team Orchestrator to coordinate cross-functional work
     */
    delegateToEmployee: async (
        userId: string,
        fromEmployeeId: string,
        toEmployeeId: string,
        taskDescription: string,
        priority: number = 5,
        metadata?: Record<string, unknown>
    ): Promise<{ success: boolean; delegationId?: string; error?: string }> => {
        try {
            // Create a team communication for the delegation
            const { data: comm, error: commError } = await supabase
                .from('team_communications')
                .insert({
                    user_id: userId,
                    sender_employee: fromEmployeeId,
                    recipient_employee: toEmployeeId,
                    message_type: 'handoff',
                    content: taskDescription,
                    is_read: false,
                    metadata: metadata || {},
                })
                .select('id')
                .single();

            if (commError) throw commError;

            // Create an autonomous action for the recipient
            const { data: action, error: actionError } = await supabase
                .from('autonomous_actions')
                .insert({
                    user_id: userId,
                    employee_id: toEmployeeId,
                    template_id: 'delegated', // Mark as delegated task
                    action_type: 'delegated',
                    action_title: `Delegated: ${taskDescription.substring(0, 50)}...`,
                    action_description: taskDescription,
                    action_parameters: {
                        from_employee: fromEmployeeId,
                        delegation_id: comm.id,
                        ...(metadata || {}),
                    },
                    priority,
                    status: 'pending',
                })
                .select('id')
                .single();

            if (actionError) throw actionError;

            return { success: true, delegationId: action.id };
        } catch (error) {
            console.error('Delegation failed:', error);
            return { success: false, error: String(error) };
        }
    },

    /**
     * Get pending delegations for an employee
     */
    getPendingDelegations: async (employeeId: string): Promise<Array<{
        id: string;
        fromEmployee: string;
        task: string;
        priority: number;
        createdAt: string;
    }>> => {
        const { data } = await supabase
            .from('autonomous_actions')
            .select('id, action_description, action_parameters, priority, created_at')
            .eq('employee_id', employeeId)
            .eq('action_type', 'delegated')
            .eq('status', 'pending')
            .order('priority', { ascending: false });

        return (data || []).map(d => ({
            id: d.id,
            fromEmployee: (d.action_parameters as Record<string, unknown>)?.from_employee as string || 'unknown',
            task: d.action_description,
            priority: d.priority,
            createdAt: d.created_at,
        }));
    },
};

// Export executeTaskWithTierModel for external use (getModelForTier and getUserTier are already exported at declaration)
export { executeTaskWithTierModel };