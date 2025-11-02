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
Object.defineProperty(exports, "__esModule", { value: true });
exports.processAiTeamCommunication = exports.resetAdminPassword = exports.fixAdminAccount = exports.deployAiEmployee = exports.customerPortal = exports.generateChatCompletion = exports.helloGenkitFlow = void 0;
const firebase_functions_1 = require("firebase-functions");
const app_1 = require("firebase-admin/app");
const auth_1 = require("firebase-admin/auth");
const firestore_1 = require("firebase-admin/firestore");
const vertexai_1 = require("@google-cloud/vertexai");
const stripe_1 = require("./utils/stripe");
const functions = __importStar(require("firebase-functions")); // Import for Firestore triggers
// Genkit imports
const genkit_1 = require("genkit");
const googleai_1 = require("@genkit-ai/googleai");
const https_1 = require("firebase-functions/https");
const params_1 = require("firebase-functions/params");
const zod_1 = require("zod");
// Define the API key secret
const googleAIapiKey = (0, params_1.defineSecret)("GOOGLE_API_KEY");
const adminEmail = (0, params_1.defineSecret)("ADMIN_EMAIL");
const adminTempPassword = (0, params_1.defineSecret)("ADMIN_TEMP_PASSWORD");
// Configure Genkit
(0, genkit_1.genkit)({
    plugins: [
        (0, googleai_1.googleAI)({
            apiKey: googleAIapiKey.value(),
        }),
    ],
    logLevel: 'debug',
    flowStateStore: 'firebase', // Using firebase for flow state storage
    flowStateRetentionInDays: 7,
});
(0, app_1.initializeApp)();
const db = (0, firestore_1.getFirestore)();
const auth = (0, auth_1.getAuth)();
// Define your Genkit flow
const helloFlow = genkit_1.genkit.defineFlow({
    name: 'helloFlow',
    inputSchema: zod_1.z.string().describe('The name to greet'),
    outputSchema: zod_1.z.object({ message: zod_1.z.string() }),
}, async (name) => {
    // make a generation request
    const result = await genkit_1.genkit.ai.generate({
        model: googleai_1.gemini15Flash,
        prompt: `Hello Gemini, my name is ${name}`,
    });
    const text = result.text();
    console.log(text);
    return { message: text };
});
// Wrap the flow in onCallGenkit for deployment
exports.helloGenkitFlow = (0, https_1.onCallGenkit)({
    secrets: [googleAIapiKey],
    authPolicy: (0, https_1.hasClaim)('email_verified'), // Example policy: user must have a verified email
    enforceAppCheck: true, // Enforce App Check
    consumeAppCheckToken: true,
}, helloFlow);
exports.generateChatCompletion = functions.runWith({ enforceAppCheck: true, consumeAppCheckToken: true }).https.onCall(async (request) => {
    const { prompt, history, model: requestedModel } = request.data;
    // This function currently uses gemini-1.5-flash-001 by default
    // Client-side Gemini-Pro is handled in src/components/ChatInterface.tsx
    // If we want to support other Gemini models via backend for different AI employees,
    // we would add logic here to map `requestedModel` to a specific Vertex AI model string.
    const geminiModelToUse = 'gemini-1.5-flash-001';
    const vertex_ai = new vertexai_1.VertexAI({ project: process.env.GCLOUD_PROJECT, location: 'us-central1' });
    const generativeModel = vertex_ai.preview.getGenerativeModel({
        model: geminiModelToUse,
        generationConfig: {
            maxOutputTokens: 2048,
            temperature: 1,
            topP: 0.95,
        },
    });
    const chat = generativeModel.startChat({
        history: history || [],
    });
    const result = await chat.sendMessage(prompt);
    const response = result.response;
    if (!response?.candidates?.[0]?.content?.parts?.[0]?.text) {
        throw new firebase_functions_1.https.HttpsError('internal', 'Failed to generate a valid response from the AI model.');
    }
    return { response: response.candidates[0].content.parts[0].text };
});
exports.customerPortal = functions.runWith({ enforceAppCheck: true, consumeAppCheckToken: true }).https.onCall(async (request) => {
    const { user_id } = request.data;
    if (!user_id) {
        throw new firebase_functions_1.https.HttpsError('invalid-argument', 'The function must be called with a user_id.');
    }
    const customerRef = db.collection('stripe_customers').doc(user_id);
    let customerDoc = await customerRef.get();
    if (!customerDoc.exists) {
        const stripeCustomer = await stripe_1.stripe.customers.create({
            metadata: { user_id },
        });
        await customerRef.set({ stripe_customer_id: stripeCustomer.id });
        // Also add a basic user role
        await db.collection('user_roles').doc(user_id).set({ role: 'user' });
        customerDoc = await customerRef.get();
    }
    const customer = customerDoc.data();
    const { url } = await stripe_1.stripe.billingPortal.sessions.create({
        customer: customer.stripe_customer_id,
        return_url: 'https://auraa-ai-96399413-e4e2f.web.app/dashboard',
    });
    return { url };
});
exports.deployAiEmployee = functions.runWith({ enforceAppCheck: true, consumeAppCheckToken: true }).https.onCall(async (request) => {
    const { deploymentRequestId } = request.data;
    if (!deploymentRequestId) {
        throw new firebase_functions_1.https.HttpsError('invalid-argument', 'The function must be called with a deploymentRequestId.');
    }
    // Fetch deployment request from Firestore
    const deploymentRequestRef = db.collection('aiEmployeeDeploymentRequests').doc(deploymentRequestId);
    const deploymentRequestDoc = await deploymentRequestRef.get();
    if (!deploymentRequestDoc.exists) {
        throw new firebase_functions_1.https.HttpsError('not-found', 'Deployment request not found in Firestore.');
    }
    const deploymentRequest = deploymentRequestDoc.data();
    if (deploymentRequest.status !== 'pending') {
        throw new firebase_functions_1.https.HttpsError('failed-precondition', `Deployment request has already been processed. Status: ${deploymentRequest.status}`);
    }
    // Fetch AI helper template from Firestore using the template ID stored in the deployment request
    // Assuming 'ai_helper_template_id' is a string ID within the deploymentRequest document
    const templateId = deploymentRequest.ai_helper_template_id;
    if (!templateId) {
        throw new firebase_functions_1.https.HttpsError('failed-precondition', 'AI helper template ID is missing in the deployment request.');
    }
    const templateRef = db.collection('ai_helper_templates').doc(templateId);
    const templateDoc = await templateRef.get();
    if (!templateDoc.exists) {
        await deploymentRequestRef.update({ status: 'rejected', rejection_reason: 'Failed to fetch AI template details from Firestore (template not found).' });
        throw new firebase_functions_1.https.HttpsError('not-found', 'AI template not found in Firestore.');
    }
    const template = templateDoc.data();
    try {
        // Add the deployed AI employee instance to the 'aiEmployees' collection
        await db.collection('aiEmployees').add({
            user_id: deploymentRequest.user_id,
            deployment_request_id: deploymentRequestDoc.id,
            name: template.name || 'AI Employee',
            deployment_config: deploymentRequest.deployment_config,
            status: 'active',
            template_id: templateDoc.id,
            category: template.category,
            model: template.model,
            skills: template.skills, // Assuming 'skills' field exists in ai_helper_templates
            // Include any other relevant fields from the template or deployment request
        });
    }
    catch (error) {
        console.error('Error creating AI employee record in Firestore:', error);
        await deploymentRequestRef.update({ status: 'rejected', rejection_reason: 'Failed to create AI employee record in Firestore.' });
        throw new firebase_functions_1.https.HttpsError('internal', 'Failed to create AI employee in Firestore.');
    }
    await deploymentRequestRef.update({ status: 'approved' });
    return { success: true, message: 'AI Employee deployed successfully.' };
});
exports.fixAdminAccount = functions.runWith({ secrets: [adminEmail, adminTempPassword], enforceAppCheck: true, consumeAppCheckToken: true }).https.onCall(async () => {
    const adminEmailValue = adminEmail.value();
    const tempPasswordValue = adminTempPassword.value();
    try {
        const user = await auth.getUserByEmail(adminEmailValue);
        await auth.updateUser(user.uid, {
            password: tempPasswordValue,
            emailVerified: true,
        });
        await auth.setCustomUserClaims(user.uid, { admin: true });
        await db.collection('user_roles').doc(user.uid).set({ role: 'admin' }, { merge: true });
        await db.collection('subscribers').doc(user.uid).set({
            email: adminEmailValue,
            subscribed: true,
            subscription_tier: 'Enterprise',
            subscription_end: null,
        }, { merge: true });
        return {
            success: true,
            message: 'Admin account fixed successfully',
            user_id: user.uid,
            email: adminEmailValue,
            temporary_password: tempPasswordValue,
            note: 'Please log in with this temporary password and change it immediately'
        };
    }
    catch (error) {
        if (error instanceof Error && error.code === 'auth/user-not-found') {
            const user = await auth.createUser({
                email: adminEmailValue,
                password: tempPasswordValue,
                emailVerified: true,
            });
            await auth.setCustomUserClaims(user.uid, { admin: true });
            await db.collection('user_roles').doc(user.uid).set({ role: 'admin' });
            await db.collection('subscribers').doc(user.uid).set({
                email: adminEmailValue,
                subscribed: true,
                subscription_tier: 'Enterprise',
                subscription_end: null,
            });
            return {
                success: true,
                message: 'Admin account created successfully',
                user_id: user.uid,
                email: adminEmailValue,
                temporary_password: tempPasswordValue,
                note: 'Please log in with this temporary password and change it immediately'
            };
        }
        else if (error instanceof Error) {
            throw new firebase_functions_1.https.HttpsError('internal', error.message);
        }
        throw new firebase_functions_1.https.HttpsError('internal', 'An unknown error occurred.');
    }
});
exports.resetAdminPassword = functions.runWith({ secrets: [adminEmail], enforceAppCheck: true, consumeAppCheckToken: true }).https.onCall(async () => {
    const adminEmailValue = adminEmail.value();
    try {
        const link = await auth.generatePasswordResetLink(adminEmailValue);
        // You would typically send this link to the user via email.
        // For this migration, we'll just return it.
        return {
            success: true,
            message: 'Password reset link generated successfully',
            email: adminEmailValue,
            resetLink: link,
            note: 'This link should be sent to the user to reset their password.'
        };
    }
    catch (error) {
        if (error instanceof Error) {
            throw new firebase_functions_1.https.HttpsError('internal', error.message);
        }
        throw new firebase_functions_1.https.HttpsError('internal', 'An unknown error occurred.');
    }
});
// New Firebase Function to process AI Team Communications
exports.processAiTeamCommunication = functions.firestore
    .document('ai_team_communications/{communicationId}')
    .onCreate(async (snapshot, context) => {
    const communication = snapshot.data();
    const communicationId = snapshot.id;
    console.log(`💬 New AI team communication received: ${communicationId}`);
    // Only process if it's a message from a user to an AI employee
    if (communication.sender_employee !== 'User' || !communication.recipient_employee) {
        console.log('Skipping communication: Not from a user to a specific AI employee.');
        return null;
    }
    const recipientEmployeeName = communication.recipient_employee;
    const userId = communication.user_id;
    try {
        // 1. Fetch the AI employee template for the recipient
        const aiHelperTemplatesRef = db.collection('ai_helper_templates');
        const q = aiHelperTemplatesRef.where('name', '==', recipientEmployeeName);
        const templateSnapshot = await q.get();
        if (templateSnapshot.empty) {
            console.warn(`No AI helper template found for recipient: ${recipientEmployeeName}`);
            // Optionally, send a default "I don't understand" message
            await db.collection('ai_team_communications').add({
                sender_employee: 'System',
                recipient_employee: recipientEmployeeName,
                message_type: 'alert',
                subject: 'Communication Error',
                content: `AI Employee "${recipientEmployeeName}" not found or configured.`,
                user_id: userId,
                is_read: false,
                created_at: firestore_1.FieldValue.serverTimestamp(),
                original_communication_id: communicationId,
            });
            return null;
        }
        const aiTemplate = templateSnapshot.docs[0].data();
        // 2. Determine the Gemini model to use
        const geminiModelToUse = 'gemini-1.5-flash-001'; // Default for backend
        // Optionally, use a more capable model if specified in the template
        // For simplicity, we'll stick to gemini-1.5-flash-001 for now,
        // as "Gemini-Pro" is handled client-side.
        // If aiTemplate.model were 'GPT-4', you could map it to a stronger Gemini model here if desired.
        const vertex_ai = new vertexai_1.VertexAI({ project: process.env.GCLOUD_PROJECT, location: 'us-central1' });
        const generativeModel = vertex_ai.preview.getGenerativeModel({
            model: geminiModelToUse,
            generationConfig: {
                maxOutputTokens: 2048,
                temperature: 0.7, // Adjust temperature for more creative/less factual responses
                topP: 0.95,
            },
        });
        // 3. Craft the prompt for Gemini
        // Include historical context if available in the 'metadata' of the communication
        const chatHistory = (communication.metadata?.history || []).map((msg) => ({
            role: msg.sender === 'User' ? 'user' : 'model',
            parts: [{ text: msg.content }],
        }));
        // Add the AI employee's persona and skills to the prompt
        const capabilities = Array.isArray(aiTemplate.capabilities) ? aiTemplate.capabilities.join(', ') : 'a wide range of tasks';
        const personaPrompt = `You are ${aiTemplate.name}, a ${aiTemplate.category} expert. Your core skills include: ${capabilities}. Your description is: "${aiTemplate.description}". Respond to the user's message concisely and helpfully, leveraging your expertise.`;
        const parts = [{ text: `${personaPrompt}

User: ${communication.content}` }];
        const chat = generativeModel.startChat({
            history: chatHistory,
        });
        const result = await chat.sendMessage({ parts });
        const aiResponseContent = result.response.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!aiResponseContent) {
            throw new Error('Failed to generate a valid response from the AI model.');
        }
        // 4. Store AI's response in Firestore
        await db.collection('ai_team_communications').add({
            sender_employee: aiTemplate.name,
            recipient_employee: 'User', // AI responds to the user
            message_type: 'response',
            subject: `Re: ${communication.subject || 'Team Communication'} `,
            content: aiResponseContent,
            metadata: {
                original_communication_id: communicationId,
                ai_model_used: geminiModelToUse,
            },
            user_id: userId,
            is_read: false,
            created_at: firestore_1.FieldValue.serverTimestamp(),
        });
        console.log(`✅ AI employee "${aiTemplate.name}" responded to communication ${communicationId}`);
        return null;
    }
    catch (error) {
        console.error(`❌ Error processing AI team communication ${communicationId}:`, error);
        // Log an error message in communications if AI fails to respond
        await db.collection('ai_team_communications').add({
            sender_employee: 'System',
            recipient_employee: recipientEmployeeName,
            message_type: 'alert',
            subject: 'AI Response Error',
            content: `AI Employee "${recipientEmployeeName}" encountered an error while responding. Please check logs.`,
            user_id: userId,
            is_read: false,
            created_at: firestore_1.FieldValue.serverTimestamp(),
            original_communication_id: communicationId,
        });
        return null;
    }
});
//# sourceMappingURL=index.js.map