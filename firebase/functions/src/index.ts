import { https } from 'firebase-functions';
import { initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { VertexAI } from '@google-cloud/vertexai';
import { stripe } from './utils/stripe';

initializeApp();
const db = getFirestore();
const auth = getAuth();

export const generateChatCompletion = https.onCall(async (request) => {
  const { prompt, history } = request.data;

  const vertex_ai = new VertexAI({ project: 'auraa-ai-96399413-e4e2f', location: 'us-central1' });
  const model = 'gemini-1.5-flash-001';

  const generativeModel = vertex_ai.preview.getGenerativeModel({
    model: model,
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

  return { response: response.candidates[0].content.parts[0].text };
});

export const customerPortal = https.onCall(async (request) => {
  const { userId } = request.data;

  if (!userId) {
    throw new https.HttpsError('invalid-argument', 'The function must be called with a userId.');
  }

  const customerRef = db.collection('stripe_customers').doc(userId);
  let customerDoc = await customerRef.get();

  if (!customerDoc.exists) {
    const stripeCustomer = await stripe.customers.create({
      metadata: { userId },
    });

    await customerRef.set({ stripe_customer_id: stripeCustomer.id });

    // Also add a basic user role
    await db.collection('user_roles').doc(userId).set({ role: 'user' });

    customerDoc = await customerRef.get();
  }

  const customer = customerDoc.data()!;

  const { url } = await stripe.billingPortal.sessions.create({
    customer: customer.stripe_customer_id,
    return_url: `${process.env.SITE_URL}/dashboard`,
  });

  return { url };
});

export const deployAiEmployee = https.onCall(async (request) => {
  const { deploymentRequestId } = request.data;

  if (!deploymentRequestId) {
    throw new https.HttpsError('invalid-argument', 'The function must be called with a deploymentRequestId.');
  }

  const deploymentRequestRef = db.collection('aiEmployeeDeploymentRequests').doc(deploymentRequestId);
  const deploymentRequestDoc = await deploymentRequestRef.get();

  if (!deploymentRequestDoc.exists) {
    throw new https.HttpsError('not-found', 'Deployment request not found.');
  }

  const deploymentRequest = deploymentRequestDoc.data()!;

  if (deploymentRequest.status !== 'pending') {
    throw new https.HttpsError('failed-precondition', `Deployment request has already been processed. Status: ${deploymentRequest.status}`);
  }

  const templateRef = deploymentRequest.ai_helper_template as FirebaseFirestore.DocumentReference;
  const templateDoc = await templateRef.get();
  const template = templateDoc.data()!;

  try {
    await db.collection('aiEmployees').add({
      user_id: deploymentRequest.user_id,
      deployment_request_id: deploymentRequestRef.id,
      name: template.name || 'AI Employee',
      deployment_config: deploymentRequest.deployment_config,
      status: 'active',
    });
  } catch (error) {
    await deploymentRequestRef.update({ status: 'rejected', rejection_reason: 'Failed to create AI employee record.' });
    throw new https.HttpsError('internal', 'Failed to create AI employee.');
  }

  await deploymentRequestRef.update({ status: 'approved' });

  return { success: true, message: 'AI Employee deployed successfully.' };
});

export const fixAdminAccount = https.onCall(async () => {
  const adminEmail = 'ghostspooks@icloud.com';
  const tempPassword = 'AdminReset2024!';

  try {
    let user = await auth.getUserByEmail(adminEmail);
    await auth.updateUser(user.uid, {
      password: tempPassword,
      emailVerified: true,
    });
    await auth.setCustomUserClaims(user.uid, { admin: true });

    await db.collection('user_roles').doc(user.uid).set({ role: 'admin' }, { merge: true });
    await db.collection('subscribers').doc(user.uid).set({
      email: adminEmail,
      subscribed: true,
      subscription_tier: 'Enterprise',
      subscription_end: null,
    }, { merge: true });

    return {
      success: true,
      message: 'Admin account fixed successfully',
      user_id: user.uid,
      email: adminEmail,
      temporary_password: tempPassword,
      note: 'Please log in with this temporary password and change it immediately'
    };
  } catch (error: any) {
    if (error.code === 'auth/user-not-found') {
      const user = await auth.createUser({
        email: adminEmail,
        password: tempPassword,
        emailVerified: true,
      });
      await auth.setCustomUserClaims(user.uid, { admin: true });

      await db.collection('user_roles').doc(user.uid).set({ role: 'admin' });
      await db.collection('subscribers').doc(user.uid).set({
        email: adminEmail,
        subscribed: true,
        subscription_tier: 'Enterprise',
        subscription_end: null,
      });

      return {
        success: true,
        message: 'Admin account created successfully',
        user_id: user.uid,
        email: adminEmail,
        temporary_password: tempPassword,
        note: 'Please log in with this temporary password and change it immediately'
      };
    } else {
      throw new https.HttpsError('internal', error.message);
    }
  }
});

export const resetAdminPassword = https.onCall(async () => {
  const adminEmail = 'ghostspooks@icloud.com';

  try {
    const link = await auth.generatePasswordResetLink(adminEmail);
    // You would typically send this link to the user via email.
    // For this migration, we'll just return it.
    return {
      success: true,
      message: 'Password reset link generated successfully',
      email: adminEmail,
      resetLink: link,
      note: 'This link should be sent to the user to reset their password.'
    };
  } catch (error: any) {
    throw new https.HttpsError('internal', error.message);
  }
});
