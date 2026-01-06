import type { PuterChatResponse } from "../types/puter";
import { toast } from "sonner";
import { AI_MODELS, TIER_MODELS } from '@/config/constants';
import { supabase } from '../supabase';
import puter from 'puter';

// Use centralized model constants - Claude models via Puter.js (FREE)
const MODELS = AI_MODELS;

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
 * callPuterAI - Primary Strategy (Free Client-Side AI via Claude)
 * Uses Puter.js to access Claude models for free
 * Models: claude-opus (complex), claude-sonnet (standard), claude-haiku (fast)
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

    const response = await puter.ai.chat(fullPrompt, { model });
    
    // Ensure response is of type PuterChatResponse, not AsyncIterable
    if ((response as AsyncIterable<unknown>)[Symbol.asyncIterator]) {
        // Handle streaming response if necessary, or throw if not expected
        throw new Error("Streaming response from Puter AI not handled by this function.");
    }

    const content = (response as PuterChatResponse).message?.content?.[0]?.text;
    
    if (!content) throw new Error("Empty response or unexpected format from Puter AI");
    return content;
}

/**
 * callVercelAIGateway - Secondary Strategy (Vercel AI Gateway with caching & observability)
 * Uses Vercel AI SDK to call Anthropic with built-in caching and monitoring
 * Fallback when Puter.js is unavailable
 */
async function callVercelAIGateway(prompt: string, systemContext: string, category: string = 'default'): Promise<string> {
    console.log(`🌐 Using Vercel AI Gateway for category: ${category}`);
    
    const response = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            prompt,
            systemPrompt: systemContext,
            category,
            maxTokens: 4096,
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
    }
};

// Export executeTaskWithTierModel for external use (getModelForTier and getUserTier are already exported at declaration)
export { executeTaskWithTierModel };