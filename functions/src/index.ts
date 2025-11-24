
import {genkit, z} from "genkit";
import {googleAI} from "@genkit-ai/google-genai";
import {https} from "firebase-functions/v2";
import {onSchedule} from "firebase-functions/v2/scheduler";
import {stripe} from "./utils/stripe.js";
import {defineSecret} from "firebase-functions/params";
import {enableFirebaseTelemetry} from "@genkit-ai/firebase";
import * as admin from "firebase-admin";
import Anthropic from "@anthropic-ai/sdk";

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
    googleAI(),
  ],
});

// --- Existing Genkit Flows ---
const menuSuggestionFlow = ai.defineFlow({
  name: "menuSuggestionFlow",
  inputSchema: z.string().describe("A restaurant theme").default("seafood"),
  outputSchema: z.string(),
  streamSchema: z.string(),
}, async (subject, {sendChunk}) => {
  const prompt = `Suggest an item for the menu of a ${subject} restaurant`;
  const {response, stream} = ai.generateStream({
    model: "googleai/gemini-1.5-flash",
    prompt: prompt,
    config: {temperature: 1},
  });
  for await (const chunk of stream) {
    sendChunk(chunk.text);
  }
  return (await response).text;
},
);

const puterScriptFlow = ai.defineFlow({
  name: "puterScriptFlow",
  inputSchema: z.object({prompt: z.string()}),
  outputSchema: z.object({script: z.string()}),
}, async ({prompt}) => {
  const result = await ai.generate({
    model: "googleai/gemini-1.5-flash",
    prompt: `Generate a Puter.js script for: "${prompt}". Only raw code.`,
  });
  return {script: result.text};
});

/**
 * Calls the Claude Sonnet 3.5 model from Anthropic.
 * @param {string} prompt The user's prompt.
 * @param {string} system The system prompt to guide the AI.
 * @param {string} apiKey The Anthropic API key.
 * @return {Promise<string>} The AI's response text.
 * @throws {https.HttpsError} If the API key is missing or a demo key.
 * @throws {Error} If the API response is in an unexpected format.
 */
async function callClaudeSonnet(prompt: string, system: string, apiKey: string) {
  if (!apiKey || apiKey.toLowerCase() === "demo") {
    throw new https.HttpsError(
        "failed-precondition",
        "Anthropic API Key is missing or is a demo key.",
    );
  }

  const client = new Anthropic({apiKey});
  const msg = await client.messages.create({
    model: "claude-3-5-sonnet-20240620",
    max_tokens: 2048,
    temperature: 0.7,
    system: system,
    messages: [{role: "user", content: prompt}],
  });

  if (msg.content[0].type === "text") {
    return msg.content[0].text;
  }
  throw new Error("Unexpected response format from Anthropic API.");
}

/**
 * Executes a given task by calling an AI model.
 * @param {string} taskName The name of the task.
 * @param {unknown} data The data for the task.
 * @param {string} context The context or instructions for the task.
 * @param {{value: () => string}} anthropicKey The secret for the API key.
 * @return {Promise<object>} The result of the task execution.
 * @throws {https.HttpsError} Throws an error if the task fails.
 */
const executeTask = async (
    taskName: string,
    data: unknown,
    context: string,
    anthropicKey: { value: () => string },
) => {
  try {
    const prompt = JSON.stringify(data);
    const system = `You are an expert AI employee performing: ${taskName}. ` +
      `Context: ${context}. Use Claude 3.5 Sonnet. Return valid JSON only.`;
    const result = await callClaudeSonnet(prompt, system, anthropicKey.value());

    let parsedResult;
    try {
      parsedResult = JSON.parse(result);
    } catch (e) {
      parsedResult = {textOutput: result};
    }

    return {
      success: true,
      task: taskName,
      result: parsedResult,
      timestamp: new Date().toISOString(),
      model: "claude-3-5-sonnet",
    };
  } catch (error) {
    console.error(`Error in ${taskName}:`, error);
    if (error instanceof https.HttpsError) {
      throw error;
    }
    throw new https.HttpsError(
        "internal",
        `An error occurred while executing ${taskName}.`,
    );
  }
};


export const menuSuggestion = https.onCall(
    {secrets: [apiKey]},
    async (request) => {
      if (!request.auth) {
        throw new https.HttpsError(
            "unauthenticated",
            "User must be authenticated",
        );
      }
      try {
        return await menuSuggestionFlow(request.data);
      } catch (error) {
        console.error("Error in menuSuggestion function:", error);
        throw new https.HttpsError(
            "internal",
            "Failed to generate menu suggestion",
        );
      }
    });

export const generatePuterScript = https.onCall(
    {secrets: [apiKey]},
    async (request) => {
      if (!request.auth) {
        throw new https.HttpsError(
            "unauthenticated",
            "User must be logged in.",
        );
      }
      return await puterScriptFlow(request.data);
    });

export const createCustomerPortalSession = https.onCall(
    {secrets: [stripeSecretKey]},
    async (request) => {
      if (!request.auth) {
        throw new https.HttpsError("unauthenticated", "Auth required.");
      }
      if (!request.data.returnUrl) {
        throw new https.HttpsError(
            "invalid-argument",
            "returnUrl is a required parameter.",
        );
      }

      const userId = request.auth.uid;
      try {
        const userDoc = await db.collection("users").doc(userId).get();
        if (!userDoc.exists) {
          throw new https.HttpsError("not-found", "User not found");
        }
        const userData = userDoc.data();
        if (!userData?.stripeId) {
          throw new https.HttpsError(
              "failed-precondition",
              "User does not have a Stripe ID.",
          );
        }

        const session = await stripe.billingPortal.sessions.create({
          customer: userData.stripeId,
          return_url: request.data.returnUrl,
        });
        return {url: session.url};
      } catch (error) {
        console.error("Stripe Portal Session Error:", error);
        if (error instanceof https.HttpsError) {
          throw error;
        }
        throw new https.HttpsError(
            "internal",
            "Failed to create customer portal session.",
        );
      }
    });

export const updatePlatformStats = onSchedule("every 24 hours", async () => {
  try {
    const usersSnapshot = await db.collection("users").get();
    const deployedEmployeesSnapshot =
      await db.collection("deployedEmployees").get();

    const stats = {
      totalUsers: usersSnapshot.size,
      totalDeployedEmployees: deployedEmployeesSnapshot.size,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    await db.collection("platform_stats").doc("main_stats").set(
        stats,
        {merge: true},
    );
    console.log("Platform stats updated successfully:", stats);
  } catch (error) {
    console.error("Error updating platform stats:", error);
  }
});

export const deployAiEmployee = https.onCall(async (request) => {
  if (!request.auth) {
    throw new https.HttpsError("unauthenticated", "User must be logged in.");
  }

  const {deploymentRequest} = request.data;
  const {
    user_id: userId,
    ai_helper_template_id: aiHelperTemplateId,
    deployment_config: deploymentConfig,
    name,
  } = deploymentRequest;

  if (!name) {
    throw new https.HttpsError(
        "invalid-argument",
        "The deployment request must include a name.",
    );
  }

  try {
    await db.collection("deployedEmployees").add({
      userId: userId,
      templateId: aiHelperTemplateId,
      name: name,
      status: "active",
      deploymentConfig: deploymentConfig || {},
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    await db.collection("deploymentRequests").add({
      ...deploymentRequest,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      status: "completed",
    });

    return {success: true};
  } catch (error) {
    console.error("Deployment error:", error);
    throw new https.HttpsError("internal", "Failed to deploy AI employee.");
  }
});

// --- Primary AI Functions ---

export const generateChatCompletion = https.onCall(
    {secrets: [anthropicApiKey]},
    async (request) => {
      if (!request.auth) {
        throw new https.HttpsError(
            "unauthenticated",
            "User must be authenticated.",
        );
      }
      const {prompt, personality} = request.data;
      const system = personality ?
        `Your personality is: ${personality}` :
        "You are a helpful assistant.";

      try {
        const text = await callClaudeSonnet(
            prompt,
            system,
            anthropicApiKey.value(),
        );
        return {completion: {text}};
      } catch (error) {
        console.error("Error in generateChatCompletion:", error);
        if (error instanceof https.HttpsError) {
          throw error;
        }
        throw new https.HttpsError(
            "internal",
            "The AI is currently unavailable. Please try again later.",
        );
      }
    });

// --- Task-Specific AI Functions ---

export const workflowExecution = https.onCall(
    {secrets: [anthropicApiKey]},
    async (req) => executeTask(
        "workflowExecution",
        req.data,
        "Analyze the provided workflow and suggest improvements.",
        anthropicApiKey,
    ),
);
export const businessSync = https.onCall(
    {secrets: [anthropicApiKey]},
    async (req) => executeTask(
        "businessSync",
        req.data,
        "Synchronize data with external business systems.",
        anthropicApiKey,
    ),
);
export const analyzeMarketingData = https.onCall(
    {secrets: [anthropicApiKey]},
    async (req) => executeTask(
        "analyzeMarketingData",
        req.data,
        "Analyze marketing data to identify trends and insights.",
        anthropicApiKey,
    ),
);
export const automateSalesOutreach = https.onCall(
    {secrets: [anthropicApiKey]},
    async (req) => executeTask(
        "automateSalesOutreach",
        req.data,
        "Automate sales outreach emails and follow-ups.",
        anthropicApiKey,
    ),
);
export const handleSupportTicket = https.onCall(
    {secrets: [anthropicApiKey]},
    async (req) => executeTask(
        "handleSupportTicket",
        req.data,
        "Handle a customer support ticket by providing a helpful response.",
        anthropicApiKey,
    ),
);
export const analyzeBusinessData = https.onCall(
    {secrets: [anthropicApiKey]},
    async (req) => executeTask(
        "analyzeBusinessData",
        req.data,
        "Analyze business data to find actionable insights.",
        anthropicApiKey,
    ),
);
export const automateHrTasks = https.onCall(
    {secrets: [anthropicApiKey]},
    async (req) => executeTask(
        "automateHrTasks",
        req.data,
        "Automate repetitive HR tasks.",
        anthropicApiKey,
    ),
);
export const generateCode = https.onCall(
    {secrets: [anthropicApiKey]},
    async (req) => executeTask(
        "generateCode",
        req.data,
        "Generate code based on the provided specifications.",
        anthropicApiKey,
    ),
);
export const manageProjectTasks = https.onCall(
    {secrets: [anthropicApiKey]},
    async (req) => executeTask(
        "manageProjectTasks",
        req.data,
        "Manage and prioritize project tasks.",
        anthropicApiKey,
    ),
);
export const analyzeLegalDocument = https.onCall(
    {secrets: [anthropicApiKey]},
    async (req) => executeTask(
        "analyzeLegalDocument",
        req.data,
        "Review a legal document for potential issues.",
        anthropicApiKey,
    ),
);
export const analyzeFinancialData = https.onCall(
    {secrets: [anthropicApiKey]},
    async (req) => executeTask(
        "analyzeFinancialData",
        req.data,
        "Analyze financial data and generate a report.",
        anthropicApiKey,
    ),
);
export const managePersonalTasks = https.onCall(
    {secrets: [anthropicApiKey]},
    async (req) => executeTask(
        "managePersonalTasks",
        req.data,
        "Organize and manage personal tasks.",
        anthropicApiKey,
    ),
);
export const resolveItIssue = https.onCall(
    {secrets: [anthropicApiKey]},
    async (req) => executeTask(
        "resolveItIssue",
        req.data,
        "Troubleshoot and resolve an IT issue.",
        anthropicApiKey,
    ),
);
export const optimizeSupplyChain = https.onCall(
    {secrets: [anthropicApiKey]},
    async (req) => executeTask(
        "optimizeSupplyChain",
        req.data,
        "Optimize a supply chain for efficiency and cost savings.",
        anthropicApiKey,
    ),
);
export const analyzeSecurityThreat = https.onCall(
    {secrets: [anthropicApiKey]},
    async (req) => executeTask(
        "analyzeSecurityThreat",
        req.data,
        "Analyze a potential security threat and recommend actions.",
        anthropicApiKey,
    ),
);
export const analyzeProductFeedback = https.onCall(
    {secrets: [anthropicApiKey]},
    async (req) => executeTask(
        "analyzeProductFeedback",
        req.data,
        "Analyze customer feedback for product improvement ideas.",
        anthropicApiKey,
    ),
);
export const managePatientRecords = https.onCall(
    {secrets: [anthropicApiKey]},
    async (req) => executeTask(
        "managePatientRecords",
        req.data,
        "Manage and update patient medical records.",
        anthropicApiKey,
    ),
);
export const orchestrateAiTeam = https.onCall(
    {secrets: [anthropicApiKey]},
    async (req) => executeTask(
        "orchestrateAiTeam",
        req.data,
        "Orchestrate a team of AI agents to accomplish a goal.",
        anthropicApiKey,
    ),
);
