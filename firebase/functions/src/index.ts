import { https, logger } from 'firebase-functions/v2';
import { initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { VertexAI, Part, Content } from '@google-cloud/vertexai';
import { stripe } from './utils/stripe';
import { HttpsError } from 'firebase-functions/v2/https';
import { firestore } from 'firebase-functions/v2';

// Genkit imports
import { genkit, GenkitOptions } from 'genkit';
import { googleAI, gemini15Flash } from '@genkit-ai/googleai';
import { onCallGenkit, hasClaim } from '@genkit-ai/firebase/functions';
import { defineSecret } from 'firebase-functions/params';
import { z } from 'zod';

// Define the API key secret
const googleAIapiKey = defineSecret("GOOGLE_API_KEY");
const adminEmail = defineSecret("ADMIN_EMAIL");
const adminTempPassword = defineSecret("ADMIN_TEMP_PASSWORD");
const STRIPE_SECRET_KEY = defineSecret("STRIPE_SECRET_KEY");

// Configure Genkit
const genkitConfig: GenkitOptions = {
  plugins: [
    googleAI({
      apiKey: googleAIapiKey.value(),
    }),
  ],
  logLevel: 'debug',
  flowStateStore: 'firebase', // Using firebase for flow state storage
};
genkit(genkitConfig);

initializeApp();
const db = getFirestore();
const auth = getAuth();

// Define and export your Genkit flow using onCallGenkit
export const helloFlow = onCallGenkit(
  {
    name: 'helloFlow',
    inputSchema: z.string().describe('The name to greet'),
    outputSchema: z.object({ message: z.string() }),
    secrets: [googleAIapiKey],
    authPolicy: hasClaim('email_verified'), // Example policy: user must have a verified email
    enforceAppCheck: true, // Enforce App Check
    consumeAppCheckToken: true,
  },
  async (name) => {
    // make a generation request
    const result = await genkit.ai.generate({
        model: gemini15Flash,
        prompt: `Hello Gemini, my name is ${name}`,
    });
    const text = result.text();
    logger.log(text);
    return { message: text };
  },
);

export const generateChatCompletion = https.onCall({ enforceAppCheck: true, consumeAppCheckToken: true}, async (request: https.CallableRequest<{ prompt: string; history: Part[]; model: string; }>) => {
    const { prompt, history, model: requestedModel } = request.data;

    const geminiModelToUse = 'gemini-1.5-flash-001';

    const vertex_ai = new VertexAI({ project: process.env.GCLOUD_PROJECT, location: 'us-central1' });

    const generativeModel = vertex_ai.preview.getGenerativeModel({
        model: geminiModelToUse,
        generation_config: {
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
        throw new HttpsError('internal', 'Failed to generate a valid response from the AI model.');
    }

    return { response: response.candidates[0].content.parts[0].text };
});

export const customerPortal = https.onCall({ secrets: [STRIPE_SECRET_KEY], enforceAppCheck: true, consumeAppCheckToken: true }, async (request: https.CallableRequest<{ user_id: string }>) => {
    const { user_id } = request.data;

    if (!user_id) {
        throw new HttpsError('invalid-argument', 'The function must be called with a user_id.');
    }

    const customerRef = db.collection('stripe_customers').doc(user_id);
    let customerDoc = await customerRef.get();

    if (!customerDoc.exists) {
        const stripeCustomer = await stripe.customers.create({
            metadata: { user_id },
        });

        await customerRef.set({ stripe_customer_id: stripeCustomer.id });

        await db.collection('user_roles').doc(user_id).set({ role: 'user' });

        customerDoc = await customerRef.get();
    }

    const customer = customerDoc.data()!;

    const { url } = await stripe.billingPortal.sessions.create({
        customer: customer.stripe_customer_id,
        return_url: 'https://auraa-ai-96399413-e4e2f.web.app/dashboard',
    });

    return { url };
});

export const deployAiEmployee = https.onCall({ enforceAppCheck: true, consumeAppCheckToken: true }, async (request: https.CallableRequest<{ deploymentRequestId: string }>) => {
    const { deploymentRequestId } = request.data;

    if (!deploymentRequestId) {
        throw new HttpsError('invalid-argument', 'The function must be called with a deploymentRequestId.');
    }

    const deploymentRequestRef = db.collection('aiEmployeeDeploymentRequests').doc(deploymentRequestId);
    const deploymentRequestDoc = await deploymentRequestRef.get();

    if (!deploymentRequestDoc.exists) {
        throw new HttpsError('not-found', 'Deployment request not found in Firestore.');
    }

    const deploymentRequest = deploymentRequestDoc.data()!;

    if (deploymentRequest.status !== 'pending') {
        throw new HttpsError('failed-precondition', `Deployment request has already been processed. Status: ${deploymentRequest.status}`);
    }

    const templateId = deploymentRequest.ai_helper_template_id as string;
    if (!templateId) {
        throw new HttpsError('failed-precondition', 'AI helper template ID is missing in the deployment request.');
    }

    const templateRef = db.collection('ai_helper_templates').doc(templateId);
    const templateDoc = await templateRef.get();

    if (!templateDoc.exists) {
        await deploymentRequestRef.update({ status: 'rejected', rejection_reason: 'Failed to fetch AI template details from Firestore (template not found).' });
        throw new HttpsError('not-found', 'AI template not found in Firestore.');
    }

    const template = templateDoc.data()!;

    try {
        await db.collection('aiEmployees').add({
            user_id: deploymentRequest.user_id,
            deployment_request_id: deploymentRequestDoc.id,
            name: template.name || 'AI Employee',
            deployment_config: deploymentRequest.deployment_config,
            status: 'active',
            template_id: templateDoc.id,
            category: template.category,
            model: template.model,
            skills: template.skills,
        });
    } catch (error) {
        logger.error('Error creating AI employee record in Firestore:', error);
        await deploymentRequestRef.update({ status: 'rejected', rejection_reason: 'Failed to create AI employee record in Firestore.' });
        throw new HttpsError('internal', 'Failed to create AI employee in Firestore.');
    }

    await deploymentRequestRef.update({ status: 'approved' });

    return { success: true, message: 'AI Employee deployed successfully.' };
});

export const fixAdminAccount = https.onCall({ secrets: [adminEmail, adminTempPassword], enforceAppCheck: true, consumeAppCheckToken: true }, async () => {
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
    } catch (error: unknown) {
        if (error instanceof Error && (error as { code?: string }).code === 'auth/user-not-found') {
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
        } else if (error instanceof Error) {
            throw new HttpsError('internal', error.message);
        }
        throw new HttpsError('internal', 'An unknown error occurred.');
    }
});

export const resetAdminPassword = https.onCall({ secrets: [adminEmail], enforceAppCheck: true, consumeAppCheckToken: true }, async () => {
    const adminEmailValue = adminEmail.value();

    try {
        const link = await auth.generatePasswordResetLink(adminEmailValue);
        return {
            success: true,
            message: 'Password reset link generated successfully',
            email: adminEmailValue,
            resetLink: link,
            note: 'This link should be sent to the user to reset their password.'
        };
    } catch (error: unknown) {
        if (error instanceof Error) {
            throw new HttpsError('internal', error.message);
        }
        throw new HttpsError('internal', 'An unknown error occurred.');
    }
});

export const processAiTeamCommunication = firestore.onDocumentCreated('ai_team_communications/{communicationId}', async (event) => {
    const snapshot = event.data;
    if (!snapshot) {
        logger.log('No data associated with the event');
        return;
    }
    const communication = snapshot.data();
    const communicationId = snapshot.id;

    logger.log(`💬 New AI team communication received: ${communicationId}`);

    if (communication.sender_employee !== 'User' || !communication.recipient_employee) {
        logger.log('Skipping communication: Not from a user to a specific AI employee.');
        return;
    }

    const recipientEmployeeName = communication.recipient_employee;
    const userId = communication.user_id;

    try {
        const aiHelperTemplatesRef = db.collection('ai_helper_templates');
        const q = aiHelperTemplatesRef.where('name', '==', recipientEmployeeName);
        const templateSnapshot = await q.get();

        if (templateSnapshot.empty) {
            logger.warn(`No AI helper template found for recipient: ${recipientEmployeeName}`);
            await db.collection('ai_team_communications').add({
                sender_employee: 'System',
                recipient_employee: recipientEmployeeName,
                message_type: 'alert',
                subject: 'Communication Error',
                content: `AI Employee "${recipientEmployeeName}" not found or configured.`,
                user_id: userId,
                is_read: false,
                created_at: FieldValue.serverTimestamp(),
                original_communication_id: communicationId,
            });
            return;
        }

        const aiTemplate = templateSnapshot.docs[0].data();
        const geminiModelToUse = 'gemini-1.5-flash-001';

        const vertex_ai = new VertexAI({ project: process.env.GCLOUD_PROJECT, location: 'us-central1' });
        const generativeModel = vertex_ai.preview.getGenerativeModel({
            model: geminiModelToUse,
            generation_config: {
                maxOutputTokens: 2048,
                temperature: 0.7,
                topP: 0.95,
            },
        });

        const chatHistory: Content[] = (communication.metadata?.history || []).map((msg: { sender: string; content: string; }) => ({
            role: msg.sender === 'User' ? 'user' : 'model',
            parts: [{ text: msg.content }],
        }));

        const capabilities = Array.isArray(aiTemplate.capabilities) ? aiTemplate.capabilities.join(', ') : 'a wide range of tasks';
        const personaPrompt = `You are ${aiTemplate.name}, a ${aiTemplate.category} expert. Your core skills include: ${capabilities}. Your description is: "${aiTemplate.description}". Respond to the user's message concisely and helpfully, leveraging your expertise.`,

        const parts: Part[] = [{ text: `${personaPrompt}\n\nUser: ${communication.content}` }];

        const chat = generativeModel.startChat({
            history: chatHistory,
        });

        const result = await chat.sendMessage(parts);
        const aiResponseContent = result.response.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!aiResponseContent) {
            throw new Error('Failed to generate a valid response from the AI model.');
        }

        await db.collection('ai_team_communications').add({
            sender_employee: aiTemplate.name,
            recipient_employee: 'User',
            message_type: 'response',
            subject: `Re: ${communication.subject || 'Team Communication'} `,
            content: aiResponseContent,
            metadata: {
                original_communication_id: communicationId,
                ai_model_used: geminiModelToUse,
            },
            user_id: userId,
            is_read: false,
            created_at: FieldValue.serverTimestamp(),
        });

        logger.log(`✅ AI employee "${aiTemplate.name}" responded to communication ${communicationId}`);

    } catch (error) {        logger.error(`❌ Error processing AI team communication ${communicationId}:`, error);
        await db.collection('ai_team_communications').add({
            sender_employee: 'System',
            recipient_employee: recipientEmployeeName,
            message_type: 'alert',
            subject: 'AI Response Error',
            content: `AI Employee "${recipientEmployeeName}" encountered an error while responding. Please check logs.`,
            user_id: userId,
            is_read: false,
            created_at: FieldValue.serverTimestamp(),
            original_communication_id: communicationId,
        });
    }
});
