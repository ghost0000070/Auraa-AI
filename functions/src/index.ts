import {genkit, z} from "genkit";
import {googleAI} from "@genkit-ai/google-genai";
import { https } from "firebase-functions/v2";
import { onSchedule } from "firebase-functions/v2/scheduler";
import { stripe } from "./utils/stripe.js";
import { defineSecret } from "firebase-functions/params";
import { enableFirebaseTelemetry } from "@genkit-ai/firebase";
import * as admin from 'firebase-admin';

admin.initializeApp();
const db = admin.firestore();

// Define secrets
const apiKey = defineSecret("GOOGLE_GENAI_API_KEY");
const stripeSecretKey = defineSecret("STRIPE_SECRET_KEY");

// Enable telemetry
enableFirebaseTelemetry();

// Initialize Genkit
const ai = genkit({
  plugins: [
    googleAI()
  ],
});

// Define a simple flow that prompts an LLM to generate menu suggestions.
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
      config: {
        temperature: 1,
      },
    });

    for await (const chunk of stream) {
      sendChunk(chunk.text);
    }

    return (await response).text;
  }
);

export const menuSuggestion = https.onCall({ secrets: [apiKey] }, async (request) => {
    return await menuSuggestionFlow(request.data);
});

// Puter.js Script Generation Flow
const puterScriptFlow = ai.defineFlow({
    name: "puterScriptFlow",
    inputSchema: z.object({
        prompt: z.string().describe("The user's description of the automation task"),
    }),
    outputSchema: z.object({
        script: z.string().describe("The generated Puter.js script"),
    }),
}, async ({ prompt }) => {
    const llmPrompt = `
        You are an expert automation engineer specializing in Puter.js (puter.com).
        Generate a valid, executable Puter.js script to perform the following task: "${prompt}".
        
        The script should be self-contained and ready to run. 
        Do not include markdown code blocks (like \`\`\`javascript). Just return the raw code.
        Include comments explaining the steps.
        
        If the task involves GUI automation, assume standard web interactions.
        If the task involves file manipulation, use Puter's file system API.
    `;

    const result = await ai.generate({
        model: "googleai/gemini-1.5-flash",
        prompt: llmPrompt,
    });

    return { script: result.text };
});

export const generatePuterScript = https.onCall({ secrets: [apiKey] }, async (request) => {
    if (!request.auth) {
        throw new https.HttpsError('unauthenticated', 'User must be logged in.');
    }
    return await puterScriptFlow(request.data);
});

// Stripe Customer Portal Function
export const createCustomerPortalSession = https.onCall({ secrets: [stripeSecretKey] }, async (request) => {
  if (!request.auth) {
    throw new https.HttpsError('unauthenticated', 'The function must be called while authenticated.');
  }

  const userId = request.auth.uid;
  
  try {
    const userDoc = await db.collection('users').doc(userId).get();
    
    if (!userDoc.exists) {
        throw new https.HttpsError('not-found', 'User not found');
    }

    const userData = userDoc.data();
    const customerId = userData?.stripeId;

    if (!customerId) {
        throw new https.HttpsError('failed-precondition', 'Stripe customer ID not found for this user.');
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: request.data.returnUrl || 'https://your-app-url.com/dashboard', 
    });

    return { url: session.url };
  } catch (error) {
    console.error('Error creating customer portal session:', error);
    if (error instanceof https.HttpsError) {
        throw error;
    }
    throw new https.HttpsError('internal', 'Unable to create portal session.');
  }
});

// Scheduled Function to Aggregate Platform Stats
export const updatePlatformStats = onSchedule("every 24 hours", async (event) => {
    try {
        // In a production environment, you would aggregate these metrics from real collection counts.
        const stats = {
            gmv_analyzed: "$32.5 billion",
            orders_processed: "44.2 million",
            customers_served: "19.1 million",
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        };

        await db.collection('platform_stats').add(stats);
        console.log("Platform stats updated successfully.");
    } catch (error) {
        console.error("Error updating platform stats:", error);
    }
});
