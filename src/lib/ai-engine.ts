import type { PuterChatResponse } from "../types/puter";
import { toast } from "sonner";
import { getFunctions, httpsCallable } from 'firebase/functions';
import { AI_MODELS } from '@/config/constants';

// Use centralized model constants
const MODELS = AI_MODELS;

/**
 * callPuterAI - Primary Strategy (Free Client-Side AI)
 */
async function callPuterAI(prompt: string, systemContext: string, model: string = MODELS.STANDARD): Promise<string> {
    if (typeof window === 'undefined' || !window.puter) {
        throw new Error("Puter.js not loaded or available");
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
 * callCloudFallback - Fallback Strategy (Paid Backend API)
 */
async function callCloudFallback(taskName: string, data: unknown): Promise<string> {
    console.log(`⚠️ Puter AI failed. Falling back to Cloud Function for ${taskName}...`);
    const functions = getFunctions();
    const cloudFn = httpsCallable<{ prompt?: string; personality?: string } | unknown, { completion?: { text: string }; result?: unknown }>(functions, taskName);
    
    const result = await cloudFn(data);
    
    // Cloud functions return { success: true, result: ... } or { completion: { text: ... } }
    const responseData = result.data;
    
    if (responseData.completion) return responseData.completion.text;
    if (responseData.result) return JSON.stringify(responseData.result); // Normalize to string for consistency with Puter
    
    return JSON.stringify(responseData);
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
        // 1. Try Puter (Primary)
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
        // 2. Fallback to Cloud
        try {
            const fallbackResult = await callCloudFallback(taskName, data);
            
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
             console.error(`Failed to execute ${taskName} on both providers.`, { puterError, cloudError });
             toast.error(`Failed to execute ${taskName}`, { id: toastId });
             return {
                success: false,
                error: cloudError instanceof Error ? cloudError.message : String(cloudError),
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
        executeTask(taskName, data, "Perform the requested task to the best of your ability.", MODELS.STANDARD)
};