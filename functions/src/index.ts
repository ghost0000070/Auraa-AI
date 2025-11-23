import {genkit, z} from "genkit";
import {googleAI} from "@genkit-ai/google-genai";
import { https } from "firebase-functions/v2";
import { onSchedule } from "firebase-functions/v2/scheduler";
import { stripe } from "./utils/stripe.js";
import { defineSecret, SecretParam } from "firebase-functions/params";
import { enableFirebaseTelemetry } from "@genkit-ai/firebase";
import * as admin from 'firebase-admin';
import Anthropic from '@anthropic-ai/sdk';

admin.initializeApp();
const db = admin.firestore();

// Define secrets
const apiKey = defineSecret("GOOGLE_GENAI_API_KEY");
const stripeSecretKey = defineSecret("STRIPE_SECRET_KEY");
const anthropicApiKey = defineSecret("ANTHROPIC_API_KEY");

// Enable telemetry
enableFirebaseTelemetry();

// Initialize Genkit
const ai = genkit({
  plugins: [
    googleAI()
  ],
});

// --- Existing Genkit Flows ---
const menuSuggestionFlow = ai.defineFlow({
    name: "menuSuggestionFlow",
    inputSchema: z.string().describe("A restaurant theme").default("seafood"),
    outputSchema: z.string(),
    streamSchema: z.string(),
  }, async (subject, { sendChunk }) => {
    const prompt = `Suggest an item for the menu of a ${subject} themed restaurant`;
    const { response, stream } = ai.generateStream({
      model: "googleai/gemini-1.5-flash",
      prompt: prompt,
      config: { temperature: 1 },
    });
    for await (const chunk of stream) { sendChunk(chunk.text); }
    return (await response).text;
  }
);

const puterScriptFlow = ai.defineFlow({
    name: "puterScriptFlow",
    inputSchema: z.object({ prompt: z.string() }),
    outputSchema: z.object({ script: z.string() }),
}, async ({ prompt }) => {
    const result = await ai.generate({
        model: "googleai/gemini-1.5-flash",
        prompt: `Generate a Puter.js script for: "${prompt}". Return only raw code.`,
    });
    return { script: result.text };
});



// --- Claude Sonnet 3.5 Integration ---

async function callClaudeSonnet(prompt: string, system: string, apiKey: string) {
    // STRICT MODE: Require API Key
    if (!apiKey || apiKey === 'demo' || apiKey === 'DEMO') {
        throw new Error("CRITICAL: Anthropic API Key is missing in backend secrets.");
    }

    const client = new Anthropic({ apiKey });
    const msg = await client.messages.create({
        model: "claude-3-5-sonnet-20240620",
        max_tokens: 2048,
        temperature: 0.7,
        system: system,
        messages: [{ role: "user", content: prompt }]
    });
    
    if (msg.content[0].type === 'text') return msg.content[0].text;
    throw new Error("Unexpected response format.");
}

const executeTask = async (taskName: string, data: unknown, context: string, anthropicKey: SecretParam) => {
    try {
        const prompt = JSON.stringify(data);
        const system = `You are an expert AI employee performing: ${taskName}. Context: ${context}. Use Claude 3.5 Sonnet. Return valid JSON only.`;
        
        const result = await callClaudeSonnet(prompt, system, anthropicKey.value());
        
        let parsedResult;
        try { parsedResult = JSON.parse(result); } catch (e) { parsedResult = { text_output: result }; }

        return {
            success: true,
            task: taskName,
            result: parsedResult,
            timestamp: new Date().toISOString(),
            model: "claude-3-5-sonnet"
        };
    } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
    }
};


export const menuSuggestion = https.onCall({ secrets: [apiKey] }, async (request) => {
    // Verify user is authenticated
    if (!request.auth) {
      throw new https.HttpsError('unauthenticated', 'User must be authenticated');
    }
    
    try {
      return await menuSuggestionFlow(request.data);
    } catch (error) {
      console.error("Error in menuSuggestion function:", error);
      throw new https.HttpsError('internal', 'Failed to generate menu suggestion');
    }
});

export const generatePuterScript = https.onCall({ secrets: [apiKey] }, async (request) => {
    if (!request.auth) throw new https.HttpsError('unauthenticated', 'User must be logged in.');
    return await puterScriptFlow(request.data);
});

export const createCustomerPortalSession = https.onCall({ secrets: [stripeSecretKey] }, async (request) => {
  if (!request.auth) throw new https.HttpsError('unauthenticated', 'Auth required.');
  const userId = request.auth.uid;
  try {
    const userDoc = await db.collection('users').doc(userId).get();
    if (!userDoc.exists) throw new https.HttpsError('not-found', 'User not found');
    const userData = userDoc.data();
    if (!userData?.stripeId) throw new https.HttpsError('failed-precondition', 'No Stripe ID.');
    
    const session = await stripe.billingPortal.sessions.create({
      customer: userData.stripeId,
      return_url: request.data.returnUrl || 'https://your-app-url.com/dashboard', 
    });
    return { url: session.url };
  } catch (error) {
    throw new https.HttpsError('internal', 'Portal session failed.');
  }
});

export const updatePlatformStats = onSchedule("every 24 hours", async (event) => {
    try {
        await db.collection('platform_stats').doc('main_stats').set({
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        }, { merge: true });
        console.log("Platform stats timestamp updated.");
    } catch (error) {
        console.error("Error updating platform stats:", error);
    }
});

// --- NEW: Deploy AI Employee ---
export const deployAiEmployee = https.onCall(async (request) => {
    if (!request.auth) throw new https.HttpsError('unauthenticated', 'User must be logged in.');

    const { deploymentRequest } = request.data;
    const { user_id, ai_helper_template_id, deployment_config } = deploymentRequest;

    try {
        await db.collection('aiEmployees').add({
            userId: user_id,
            templateId: ai_helper_template_id,
            name: "Deployed Agent", 
            status: "active",
            deployment_config: deployment_config || {},
            createdAt: admin.firestore.FieldValue.serverTimestamp()
        });

        await db.collection('aiEmployeeDeploymentRequests').add({
            ...deploymentRequest,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            status: 'completed'
        });

        return { success: true };
    } catch (error) {
        console.error("Deployment error:", error);
        throw new https.HttpsError('internal', 'Failed to deploy AI employee.');
    }
});

// 1. Chat
export const generateChatCompletion = https.onCall({ secrets: [anthropicApiKey] }, async (request) => {
    const { prompt, personality } = request.data;
    const system = personality ? `Personality: ${personality}` : "Helpful Assistant";
    try {
        const text = await callClaudeSonnet(prompt, system, anthropicApiKey.value());
        return { completion: { text } };
    } catch (e) {
        return { completion: { text: "AI Unavailable (Check API Key)" } };
    }
});

export const aiChat = https.onCall({ secrets: [anthropicApiKey] }, async (request) => {
     const { prompt, personality } = request.data;
     try {
        const text = await callClaudeSonnet(prompt, personality || "Assistant", anthropicApiKey.value());
        return { completion: { text } };
     } catch (e) { return { completion: { text: "AI Error" } }; }
});

// 2. Workflow & Business
export const workflowExecution = https.onCall({ secrets: [anthropicApiKey] }, async (req) => executeTask("workflowExecution", req.data, "Analyze workflow.", anthropicApiKey));
export const businessSync = https.onCall({ secrets: [anthropicApiKey] }, async (req) => executeTask("businessSync", req.data, "Sync data.", anthropicApiKey));

// 3. Tasks
export const analyzeMarketingData = https.onCall({ secrets: [anthropicApiKey] }, async (req) => executeTask('analyzeMarketingData', req.data, "Analyze marketing.", anthropicApiKey));
export const automateSalesOutreach = https.onCall({ secrets: [anthropicApiKey] }, async (req) => executeTask('automateSalesOutreach', req.data, "Sales emails.", anthropicApiKey));
export const handleSupportTicket = https.onCall({ secrets: [anthropicApiKey] }, async (req) => executeTask('handleSupportTicket', req.data, "Support response.", anthropicApiKey));
export const analyzeBusinessData = https.onCall({ secrets: [anthropicApiKey] }, async (req) => executeTask('analyzeBusinessData', req.data, "Business insights.", anthropicApiKey));
export const automateHrTasks = https.onCall({ secrets: [anthropicApiKey] }, async (req) => executeTask('automateHrTasks', req.data, "HR tasks.", anthropicApiKey));
export const generateCode = https.onCall({ secrets: [anthropicApiKey] }, async (req) => executeTask('generateCode', req.data, "Generate code.", anthropicApiKey));
export const manageProjectTasks = https.onCall({ secrets: [anthropicApiKey] }, async (req) => executeTask('manageProjectTasks', req.data, "Project management.", anthropicApiKey));
export const analyzeLegalDocument = https.onCall({ secrets: [anthropicApiKey] }, async (req) => executeTask('analyzeLegalDocument', req.data, "Legal review.", anthropicApiKey));
export const analyzeFinancialData = https.onCall({ secrets: [anthropicApiKey] }, async (req) => executeTask('analyzeFinancialData', req.data, "Financial analysis.", anthropicApiKey));
export const managePersonalTasks = https.onCall({ secrets: [anthropicApiKey] }, async (req) => executeTask('managePersonalTasks', req.data, "Personal tasks.", anthropicApiKey));
export const resolveItIssue = https.onCall({ secrets: [anthropicApiKey] }, async (req) => executeTask('resolveItIssue', req.data, "IT resolution.", anthropicApiKey));
export const optimizeSupplyChain = https.onCall({ secrets: [anthropicApiKey] }, async (req) => executeTask('optimizeSupplyChain', req.data, "Supply chain.", anthropicApiKey));
export const analyzeSecurityThreat = https.onCall({ secrets: [anthropicApiKey] }, async (req) => executeTask('analyzeSecurityThreat', req.data, "Security analysis.", anthropicApiKey));
export const analyzeProductFeedback = https.onCall({ secrets: [anthropicApiKey] }, async (req) => executeTask('analyzeProductFeedback', req.data, "Product feedback.", anthropicApiKey));
export const managePatientRecords = https.onCall({ secrets: [anthropicApiKey] }, async (req) => executeTask('managePatientRecords', req.data, "Medical records.", anthropicApiKey));
export const orchestrateAiTeam = https.onCall({ secrets: [anthropicApiKey] }, async (req) => executeTask('orchestrateAiTeam', req.data, "Team orchestration.", anthropicApiKey));
