
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

// --- Genkit Flows ---
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
    prompt: `Generate a Puter.js script for: \"${prompt}\". Only raw code.`,
  });
  return {script: result.text};
});

// --- Helper Functions ---

async function callClaudeSonnet(prompt: string, system: string, apiKey: string) {
  if (!apiKey) {
    throw new https.HttpsError(
        "failed-precondition",
        "Anthropic API Key is missing.",
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

const taskContexts: Record<string, string> = {
    workflowExecution: "Analyze the provided workflow and suggest improvements.",
    businessSync: "Synchronize data with external business systems.",
    analyzeMarketingData: "Analyze marketing data to identify trends and insights.",
    automateSalesOutreach: "Automate sales outreach emails and follow-ups.",
    handleSupportTicket: "Handle a customer support ticket by providing a helpful response.",
    analyzeBusinessData: "Analyze business data to find actionable insights.",
    automateHrTasks: "Automate repetitive HR tasks.",
    generateCode: "Generate code based on the provided specifications.",
    manageProjectTasks: "Manage and prioritize project tasks.",
    analyzeLegalDocument: "Review a legal document for potential issues.",
    analyzeFinancialData: "Analyze financial data and generate a report.",
    managePersonalTasks: "Organize and manage personal tasks.",
    resolveItIssue: "Troubleshoot and resolve an IT issue.",
    optimizeSupplyChain: "Optimize a supply chain for efficiency and cost savings.",
    analyzeSecurityThreat: "Analyze a potential security threat and recommend actions.",
    analyzeProductFeedback: "Analyze customer feedback for product improvement ideas.",
    managePatientRecords: "Manage and update patient medical records.",
    orchestrateAiTeam: "Orchestrate a team of AI agents to accomplish a goal.",
};

async function checkSubscription(userId: string): Promise<void> {
    const userDoc = await db.collection("users").doc(userId).get();
    if (!userDoc.exists || !userDoc.data()?.is_active) {
        throw new https.HttpsError(
            "failed-precondition",
            "A active subscription is required to perform this action.",
        );
    }
}

// --- Callable Functions ---

export const executeAiTask = https.onCall(
    {secrets: [anthropicApiKey]},
    async (request) => {
        if (!request.auth) {
            throw new https.HttpsError("unauthenticated", "User must be authenticated.");
        }

        const userId = request.auth.uid;
        await checkSubscription(userId);

        const {taskName, data} = request.data;

        if (!taskName || !taskContexts[taskName]) {
            throw new https.HttpsError("invalid-argument", `Invalid task name: ${taskName}`);
        }

        const context = taskContexts[taskName];

        try {
            const prompt = JSON.stringify(data);
            const system = `You are an expert AI employee performing: ${taskName}. Context: ${context}. Use Claude 3.5 Sonnet. Return valid JSON only.`;
            const result = await callClaudeSonnet(prompt, system, anthropicApiKey.value());

            let parsedResult;
            try {
                parsedResult = JSON.parse(result);
            } catch (e) {
                console.warn("AI output was not valid JSON, returning as text.", {taskName, result});
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
            console.error(`Error in ${taskName} for user ${userId}:`, error);
            if (error instanceof https.HttpsError) {
                throw error;
            }
            throw new https.HttpsError(
                "internal",
                `An error occurred while executing ${taskName}.`,
            );
        }
    },
);

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
  const userId = request.auth.uid; // Use authenticated user's ID

  const deploymentRequestSchema = z.object({
      ai_helper_template_id: z.string(),
      deployment_config: z.record(z.unknown()).optional(),
      name: z.string().min(1, "Deployment name cannot be empty."),
  });

  const parseResult = deploymentRequestSchema.safeParse(request.data.deploymentRequest);

  if (!parseResult.success) {
      throw new https.HttpsError(
          "invalid-argument",
          "Invalid deployment request: " + parseResult.error.flatten().fieldErrors,
      );
  }

  const {
      ai_helper_template_id: aiHelperTemplateId,
      deployment_config: deploymentConfig,
      name,
  } = parseResult.data;

  try {
      const deploymentData = {
          userId: userId, // Securely set the user ID
          templateId: aiHelperTemplateId,
          name: name,
          status: "active",
          deploymentConfig: deploymentConfig || {},
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
      };
      await db.collection("deployedEmployees").add(deploymentData);

      // Also record the original, validated request for logging
      await db.collection("deploymentRequests").add({
          ...parseResult.data,
          userId: userId, // Ensure logged request also has correct user ID
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          status: "completed",
      });

      return {success: true, message: `AI Employee '${name}' deployed successfully.`};
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
