import type { VercelRequest, VercelResponse } from '@vercel/node';
import { db } from './lib/firebase';
import { stripe } from './lib/stripe';

export default async function handler(
  request: VercelRequest,
  response: VercelResponse,
) {
  const { userId } = request.body;

  if (!userId) {
    return response.status(400).json({ error: 'Missing userId in request body' });
  }

  const customerRef = db.collection('stripe_customers').doc(userId);
  let customerDoc = await customerRef.get();

  if (!customerDoc.exists) {
    const stripeCustomer = await stripe.customers.create({
      metadata: { userId },
    });

    await customerRef.set({ stripe_customer_id: stripeCustomer.id });

    await db.collection('user_roles').doc(userId).set({ role: 'user' });

    customerDoc = await customerRef.get();
  }

  const customer = customerDoc.data()!;

  const { url } = await stripe.billingPortal.sessions.create({
    customer: customer.stripe_customer_id,
    return_url: `${process.env.SITE_URL}/dashboard`,
  });

  response.status(200).json({ url });
}
