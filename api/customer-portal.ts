
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { db } from './lib/firebase';
import { stripe } from './lib/stripe';

export default async function handler(
  request: VercelRequest,
  response: VercelResponse,
) {
  if (request.method !== 'POST') {
    response.setHeader('Allow', 'POST');
    return response.status(405).end('Method Not Allowed');
  }

  try {
    const { user_id } = request.body;

    if (!user_id) {
      return response.status(400).json({ error: 'User ID is required' });
    }

    const userRef = db.collection('users').doc(user_id);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      return response.status(404).json({ error: 'User not found' });
    }

    const userData = userDoc.data();
    const stripeCustomerId = userData?.stripeCustomerId;

    if (!stripeCustomerId) {
      return response.status(400).json({ error: 'Stripe customer ID not found for this user' });
    }

    const protocol = request.headers['x-forwarded-proto'] || 'http';
    const host = request.headers['x-forwarded-host'] || request.headers.host;
    const returnUrl = `${protocol}://${host}/dashboard`;

    const portalSession = await stripe.billingPortal.sessions.create({
      customer: stripeCustomerId,
      return_url: returnUrl,
    });

    return response.status(200).json({ url: portalSession.url });

  } catch (error) {
    console.error('Error creating customer portal session:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return response.status(500).json({ error: `Failed to create customer portal session: ${errorMessage}` });
  }
}
