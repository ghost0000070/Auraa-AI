"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __asyncValues = (this && this.__asyncValues) || function (o) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var m = o[Symbol.asyncIterator], i;
    return m ? m.call(o) : (o = typeof __values === "function" ? __values(o) : o[Symbol.iterator](), i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i);
    function verb(n) { i[n] = o[n] && function (v) { return new Promise(function (resolve, reject) { v = o[n](v), settle(resolve, reject, v.done, v.value); }); }; }
    function settle(resolve, reject, d, v) { Promise.resolve(v).then(function(v) { resolve({ value: v, done: d }); }, reject); }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkoutSessionDetails = exports.createPortalSession = exports.createCheckoutSession = exports.retryFailedPaymentsScheduled = exports.stripeWebhook = exports.setMinimumBalanceEndpoint = exports.retryInvoicePaymentEndpoint = exports.createSubscriptionEndpoint = exports.sessionStatusEndpoint = exports.createCheckoutSessionEndpoint = exports.createSubscriptionProductEndpoint = exports.scrapeWebsite = exports.generateChatCompletion = exports.deployAiEmployee = exports.updatePlatformStats = exports.createCustomerPortalSession = exports.generatePuterScript = exports.menuSuggestion = exports.executeAiTask = void 0;
const genkit_1 = require("genkit");
const google_genai_1 = require("@genkit-ai/google-genai");
const v2_1 = require("firebase-functions/v2");
const scheduler_1 = require("firebase-functions/v2/scheduler");
const stripe_js_1 = require("./utils/stripe.js");
const params_1 = require("firebase-functions/params");
const firebase_1 = require("@genkit-ai/firebase");
const admin = __importStar(require("firebase-admin"));
const sdk_1 = __importDefault(require("@anthropic-ai/sdk"));
admin.initializeApp();
const db = admin.firestore();
// Define secrets
const apiKey = (0, params_1.defineSecret)("GOOGLE_GENAI_API_KEY");
const stripeSecretKey = (0, params_1.defineSecret)("STRIPE_SECRET_KEY");
const anthropicApiKey = (0, params_1.defineSecret)("ANTHROPIC_API_KEY");
// Enable telemetry
(0, firebase_1.enableFirebaseTelemetry)();
// Initialize Genkit
const ai = (0, genkit_1.genkit)({
    plugins: [
        (0, google_genai_1.googleAI)(),
    ],
});
// --- Genkit Flows ---
const menuSuggestionFlow = ai.defineFlow({
    name: "menuSuggestionFlow",
    inputSchema: genkit_1.z.string().describe("A restaurant theme").default("seafood"),
    outputSchema: genkit_1.z.string(),
    streamSchema: genkit_1.z.string(),
}, async (subject, { sendChunk }) => {
    var _a, e_1, _b, _c;
    const prompt = `Suggest an item for the menu of a ${subject} restaurant`;
    const { response, stream } = ai.generateStream({
        model: "googleai/gemini-1.5-flash",
        prompt: prompt,
        config: { temperature: 1 },
    });
    try {
        for (var _d = true, stream_1 = __asyncValues(stream), stream_1_1; stream_1_1 = await stream_1.next(), _a = stream_1_1.done, !_a; _d = true) {
            _c = stream_1_1.value;
            _d = false;
            const chunk = _c;
            sendChunk(chunk.text);
        }
    }
    catch (e_1_1) { e_1 = { error: e_1_1 }; }
    finally {
        try {
            if (!_d && !_a && (_b = stream_1.return)) await _b.call(stream_1);
        }
        finally { if (e_1) throw e_1.error; }
    }
    return (await response).text;
});
const puterScriptFlow = ai.defineFlow({
    name: "puterScriptFlow",
    inputSchema: genkit_1.z.object({ prompt: genkit_1.z.string() }),
    outputSchema: genkit_1.z.object({ script: genkit_1.z.string() }),
}, async ({ prompt }) => {
    const result = await ai.generate({
        model: "googleai/gemini-1.5-flash",
        prompt: `Generate a Puter.js script for: "${prompt}". Only raw code.`,
    });
    return { script: result.text };
});
// --- Helper Functions ---
async function callClaudeSonnet(prompt, system, apiKey) {
    if (!apiKey) {
        throw new v2_1.https.HttpsError("failed-precondition", "Anthropic API Key is missing.");
    }
    const client = new sdk_1.default({ apiKey });
    const msg = await client.messages.create({
        model: "claude-3-5-sonnet-20240620",
        max_tokens: 2048,
        temperature: 0.7,
        system: system,
        messages: [{ role: "user", content: prompt }],
    });
    if (msg.content[0].type === "text") {
        return msg.content[0].text;
    }
    throw new Error("Unexpected response format from Anthropic API.");
}
const taskContexts = {
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
async function checkSubscription(userId) {
    var _a;
    const userDoc = await db.collection("users").doc(userId).get();
    if (!userDoc.exists || !((_a = userDoc.data()) === null || _a === void 0 ? void 0 : _a.is_active)) {
        throw new v2_1.https.HttpsError("failed-precondition", "A active subscription is required to perform this action.");
    }
}
// --- Callable Functions ---
exports.executeAiTask = v2_1.https.onCall({ secrets: [anthropicApiKey] }, async (request) => {
    if (!request.auth) {
        throw new v2_1.https.HttpsError("unauthenticated", "User must be authenticated.");
    }
    const userId = request.auth.uid;
    await checkSubscription(userId);
    const { taskName, data } = request.data;
    if (!taskName || !taskContexts[taskName]) {
        throw new v2_1.https.HttpsError("invalid-argument", `Invalid task name: ${taskName}`);
    }
    const context = taskContexts[taskName];
    try {
        const prompt = JSON.stringify(data);
        const system = `You are an expert AI employee performing: ${taskName}. Context: ${context}. Use Claude 3.5 Sonnet. Return valid JSON only.`;
        const result = await callClaudeSonnet(prompt, system, anthropicApiKey.value());
        let parsedResult;
        try {
            parsedResult = JSON.parse(result);
        }
        catch (e) {
            throw new v2_1.https.HttpsError("internal", "The AI's response was not in the expected format.");
        }
        return {
            success: true,
            task: taskName,
            result: parsedResult,
            timestamp: new Date().toISOString(),
            model: "claude-3-5-sonnet",
        };
    }
    catch (error) {
        console.error(`Error in ${taskName} for user ${userId}:`, error);
        if (error instanceof v2_1.https.HttpsError) {
            throw error;
        }
        throw new v2_1.https.HttpsError("internal", `An error occurred while executing ${taskName}.`);
    }
});
exports.menuSuggestion = v2_1.https.onCall({ secrets: [apiKey] }, async (request) => {
    if (!request.auth) {
        throw new v2_1.https.HttpsError("unauthenticated", "User must be authenticated");
    }
    try {
        return await menuSuggestionFlow(request.data);
    }
    catch (error) {
        console.error("Error in menuSuggestion function:", error);
        throw new v2_1.https.HttpsError("internal", "Failed to generate menu suggestion");
    }
});
exports.generatePuterScript = v2_1.https.onCall({ secrets: [apiKey] }, async (request) => {
    if (!request.auth) {
        throw new v2_1.https.HttpsError("unauthenticated", "User must be logged in.");
    }
    return await puterScriptFlow(request.data);
});
exports.createCustomerPortalSession = v2_1.https.onCall({ secrets: [stripeSecretKey] }, async (request) => {
    if (!request.auth) {
        throw new v2_1.https.HttpsError("unauthenticated", "Auth required.");
    }
    if (!request.data.returnUrl) {
        throw new v2_1.https.HttpsError("invalid-argument", "returnUrl is a required parameter.");
    }
    const userId = request.auth.uid;
    try {
        const userDoc = await db.collection("users").doc(userId).get();
        if (!userDoc.exists) {
            throw new v2_1.https.HttpsError("not-found", "User not found");
        }
        const userData = userDoc.data();
        if (!(userData === null || userData === void 0 ? void 0 : userData.stripeId)) {
            throw new v2_1.https.HttpsError("failed-precondition", "User does not have a Stripe ID.");
        }
        const session = await stripe_js_1.stripe.billingPortal.sessions.create({
            customer: userData.stripeId,
            return_url: request.data.returnUrl,
        });
        return { url: session.url };
    }
    catch (error) {
        console.error("Stripe Portal Session Error:", error);
        if (error instanceof v2_1.https.HttpsError) {
            throw error;
        }
        throw new v2_1.https.HttpsError("internal", "Failed to create customer portal session.");
    }
});
exports.updatePlatformStats = (0, scheduler_1.onSchedule)("every 24 hours", async () => {
    try {
        const usersSnapshot = await db.collection("users").get();
        const deployedEmployeesSnapshot = await db.collection("deployedEmployees").get();
        const stats = {
            totalUsers: usersSnapshot.size,
            totalDeployedEmployees: deployedEmployeesSnapshot.size,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        };
        await db.collection("platform_stats").doc("main_stats").set(stats, { merge: true });
        console.log("Platform stats updated successfully:", stats);
    }
    catch (error) {
        console.error("Error updating platform stats:", error);
    }
});
exports.deployAiEmployee = v2_1.https.onCall(async (request) => {
    if (!request.auth) {
        throw new v2_1.https.HttpsError("unauthenticated", "User must be logged in.");
    }
    const userId = request.auth.uid; // Use authenticated user's ID
    const deploymentRequestSchema = genkit_1.z.object({
        ai_helper_template_id: genkit_1.z.string(),
        deployment_config: genkit_1.z.record(genkit_1.z.unknown()).optional(),
        name: genkit_1.z.string().min(1, "Deployment name cannot be empty."),
    });
    const parseResult = deploymentRequestSchema.safeParse(request.data.deploymentRequest);
    if (!parseResult.success) {
        throw new v2_1.https.HttpsError("invalid-argument", "Invalid deployment request: " + parseResult.error.flatten().fieldErrors);
    }
    const { ai_helper_template_id: aiHelperTemplateId, deployment_config: deploymentConfig, name, } = parseResult.data;
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
            userId: userId, // Ensure logged request also has correct user ID
            templateId: aiHelperTemplateId,
            name: name,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            status: "completed",
        });
        return { success: true, message: `AI Employee '${name}' deployed successfully.` };
    }
    catch (error) {
        console.error("Deployment error:", error);
        throw new v2_1.https.HttpsError("internal", "Failed to deploy AI employee.");
    }
});
// --- Primary AI Functions ---
exports.generateChatCompletion = v2_1.https.onCall({ secrets: [anthropicApiKey] }, async (request) => {
    if (!request.auth) {
        throw new v2_1.https.HttpsError("unauthenticated", "User must be authenticated.");
    }
    const { prompt, personality } = request.data;
    const system = personality ?
        `Your personality is: ${personality}` :
        "You are a helpful assistant.";
    try {
        const text = await callClaudeSonnet(prompt, system, anthropicApiKey.value());
        return { completion: { text } };
    }
    catch (error) {
        console.error("Error in generateChatCompletion:", error);
        if (error instanceof v2_1.https.HttpsError) {
            throw error;
        }
        throw new v2_1.https.HttpsError("internal", "The AI is currently unavailable. Please try again later.");
    }
});
// --- Website Scraping Function ---
exports.scrapeWebsite = v2_1.https.onCall(async (request) => {
    var _a;
    if (!request.auth) {
        throw new v2_1.https.HttpsError("unauthenticated", "User must be authenticated.");
    }
    const { url } = request.data;
    if (!url) {
        throw new v2_1.https.HttpsError("invalid-argument", "URL is a required parameter.");
    }
    try {
        const userId = request.auth.uid;
        // Validate URL format
        new URL(url); // This will throw if URL is invalid
        // Store scrape request in Firestore
        await db.collection("websiteIntegrations").add({
            userId,
            url,
            status: "pending",
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        // Basic scraping - fetch HTML content and store metadata
        console.log(`Website scraping initiated for URL: ${url} by user: ${userId}`);
        // Fetch the website HTML (basic implementation)
        const response = await fetch(url, {
            headers: {
                "User-Agent": "Mozilla/5.0 (compatible; Auraa-AI-Bot/1.0)",
            },
        });
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const html = await response.text();
        const title = ((_a = html.match(/<title>(.*?)<\/title>/i)) === null || _a === void 0 ? void 0 : _a[1]) || "Untitled";
        // Update the integration with scraped data
        const integrationRef = await db.collection("websiteIntegrations").add({
            userId,
            url,
            title,
            contentLength: html.length,
            status: "completed",
            scrapedAt: admin.firestore.FieldValue.serverTimestamp(),
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        return {
            success: true,
            message: "Website scraped successfully",
            data: {
                title,
                contentLength: html.length,
                integrationId: integrationRef.id,
            },
        };
    }
    catch (error) {
        console.error("Website Scraping Error:", error);
        if (error instanceof v2_1.https.HttpsError) {
            throw error;
        }
        if (error instanceof TypeError) {
            throw new v2_1.https.HttpsError("invalid-argument", "Invalid URL format provided.");
        }
        throw new v2_1.https.HttpsError("internal", "Failed to initiate website scraping.");
    }
});
// --- Stripe Subscription Endpoints ---
var endpoints_js_1 = require("./stripe/endpoints.js");
Object.defineProperty(exports, "createSubscriptionProductEndpoint", { enumerable: true, get: function () { return endpoints_js_1.createSubscriptionProductEndpoint; } });
Object.defineProperty(exports, "createCheckoutSessionEndpoint", { enumerable: true, get: function () { return endpoints_js_1.createCheckoutSessionEndpoint; } });
Object.defineProperty(exports, "sessionStatusEndpoint", { enumerable: true, get: function () { return endpoints_js_1.sessionStatusEndpoint; } });
Object.defineProperty(exports, "createSubscriptionEndpoint", { enumerable: true, get: function () { return endpoints_js_1.createSubscriptionEndpoint; } });
Object.defineProperty(exports, "retryInvoicePaymentEndpoint", { enumerable: true, get: function () { return endpoints_js_1.retryInvoicePaymentEndpoint; } });
Object.defineProperty(exports, "setMinimumBalanceEndpoint", { enumerable: true, get: function () { return endpoints_js_1.setMinimumBalanceEndpoint; } });
var webhooks_js_1 = require("./stripe/webhooks.js");
Object.defineProperty(exports, "stripeWebhook", { enumerable: true, get: function () { return webhooks_js_1.stripeWebhook; } });
Object.defineProperty(exports, "retryFailedPaymentsScheduled", { enumerable: true, get: function () { return webhooks_js_1.retryFailedPaymentsScheduled; } });
// --- Stripe Checkout (Redirect-based) ---
var checkout_js_1 = require("./stripe/checkout.js");
Object.defineProperty(exports, "createCheckoutSession", { enumerable: true, get: function () { return checkout_js_1.createCheckoutSession; } });
Object.defineProperty(exports, "createPortalSession", { enumerable: true, get: function () { return checkout_js_1.createPortalSession; } });
Object.defineProperty(exports, "checkoutSessionDetails", { enumerable: true, get: function () { return checkout_js_1.checkoutSessionDetails; } });
//# sourceMappingURL=index.js.map