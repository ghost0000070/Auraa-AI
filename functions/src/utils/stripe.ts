import Stripe from 'stripe';
import { defineSecret } from 'firebase-functions/params';

const STRIPE_SECRET_KEY = defineSecret("STRIPE_SECRET_KEY");

export const stripe = new Stripe(STRIPE_SECRET_KEY.value(), {
  apiVersion: '2024-04-10',
});
