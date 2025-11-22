
import { toast } from "sonner";
import { getFunctions, httpsCallable } from 'firebase/functions';

// Map of task types to Claude models
const MODELS = {
    COMPLEX: 'claude-opus-4-1',
    STANDARD: 'claude-sonnet-4-5',
    FAST: 'claude-haiku-4-5'
};

/**
 * callPuterAI - Primary Strategy (Free Client-Side AI)
 */
async function callPuterAI(prompt: string, systemContext: string, model: string = MODELS.STANDARD) {
    if (typeof window === 'undefined' || !window.puter) {
        throw new Error("Puter.js not loaded");
    }

    const fullPrompt = `
        System Context: ${systemContext}
        
        User Request: ${prompt}
        
        Instructions: 
        1. Act exactly as the persona described in the System Context.
        2. Return ONLY valid JSON if the context asks for it.
        3. Do not include markdown formatting (like \`\`\`json) in your response if JSON is requested.
    `;

    const response = await window.puter.ai.chat(fullPrompt, { model });
    
    // Cast response to handle Puter structure
    const content = (response as any).message?.content?.[0]?.text;
    
    if (!content) throw new Error("Empty response from Puter AI");
    return content;
}

/**
 * callCloudFallback - Fallback Strategy (Paid Backend API)
 */
async function callCloudFallback(taskName: string, data: any) {
    console.log(`⚠️ Puter AI failed. Falling back to Cloud Function for ${taskName}...`);
    const functions = getFunctions();
    const cloudFn = httpsCallable(functions, taskName);
    
    const result = await cloudFn(data);
    
    // Cloud functions return { success: true, result: ... } or { completion: { text: ... } }
    const responseData = result.data as any;
    
    if (responseData.completion) return responseData.completion.text;
    if (responseData.result) return JSON.stringify(responseData.result); // Normalize to string for consistency with Puter
    
    return JSON.stringify(responseData);
}

/**
 * executeTask - Main Orchestrator
 * Tries Puter first, falls back to Cloud Function.
 */
async function executeTask(taskName: string, data: any, context: string, model: string = MODELS.STANDARD) {
    const toastId = toast.loading(`Executing ${taskName}...`);
    
    // Prepare Prompt & System for Puter
    const prompt = JSON.stringify(data);
    const system = `You are an expert AI employee performing the task: ${taskName}. 
Context: ${context}. 
Return a valid JSON object with your analysis, results, and any generated content. 
Do not include markdown formatting around the JSON. Just the JSON.`;

    try {
        // 1. Try Puter (Primary)
        const result = await callPuterAI(prompt, system, model);
        
        // Parse Result
        let parsedResult;
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

    } catch (puterError) {
        // 2. Fallback to Cloud
        try {
            const fallbackResult = await callCloudFallback(taskName, data);
            
            // Parse Fallback Result
            let parsedResult;
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
        } catch (cloudError) {
             console.error(`Failed to execute ${taskName} on both providers.`, { puterError, cloudError });
             toast.error(`Failed to execute ${taskName}`, { id: toastId });
             return {
                success: false,
                error: cloudError instanceof Error ? cloudError.message : "Unknown error",
             };
        }
    }
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
        } catch (e) {
            // Fallback
            try {
                const text = await callCloudFallback('generateChatCompletion', { prompt, personality });
                return { completion: { text }, provider: 'cloud' };
            } catch (cloudError) {
                 return { completion: { text: "I'm having trouble connecting to my neural network (All providers failed)." } };
            }
        }
    },

    // 2. Workflows
    workflowExecution: async (data: any) => 
        executeTask("workflowExecution", data, "Analyze the workflow request and determine execution steps.", MODELS.COMPLEX),

    businessSync: async (data: any) => 
        executeTask("businessSync", data, "Sync business data. Analyze the input data for discrepancies.", MODELS.STANDARD),

    // 3. Specific Tasks
    analyzeMarketingData: async (data: any) => 
        executeTask('analyzeMarketingData', data, "Analyze marketing metrics, identify trends, and suggest improvements.", MODELS.STANDARD),
        
    automateSalesOutreach: async (data: any) => 
        executeTask('automateSalesOutreach', data, "Draft personalized sales emails based on the provided lead data.", MODELS.STANDARD),
        
    handleSupportTicket: async (data: any) => 
        executeTask('handleSupportTicket', data, "Draft a polite and helpful response to the customer support ticket.", MODELS.FAST),
        
    analyzeBusinessData: async (data: any) => 
        executeTask('analyzeBusinessData', data, "Analyze the provided business data and generate strategic insights.", MODELS.COMPLEX),
        
    generateCode: async (data: any) => 
        executeTask('generateCode', data, "Generate clean, efficient, and well-commented code.", MODELS.COMPLEX),
        
    manageProjectTasks: async (data: any) => 
        executeTask('manageProjectTasks', data, "Organize the project tasks, assign priorities, and identify blockers.", MODELS.STANDARD),
        
    analyzeLegalDocument: async (data: any) => 
        executeTask('analyzeLegalDocument', data, "Review the legal document for risks, obligations, and compliance.", MODELS.COMPLEX),
        
    analyzeFinancialData: async (data: any) => 
        executeTask('analyzeFinancialData', data, "Analyze the financial data/statements and provide a summary.", MODELS.COMPLEX),
        
    orchestrateAiTeam: async (data: any) => 
        executeTask('orchestrateAiTeam', data, "Act as the coordinator. Break down the complex problem and assign sub-tasks.", MODELS.COMPLEX),
        
    // Add generic fallback for others
    runGenericTask: async (taskName: string, data: any) =>
        executeTask(taskName, data, "Perform the requested task to the best of your ability.", MODELS.STANDARD)
};
