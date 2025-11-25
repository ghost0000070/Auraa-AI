import Stripe from 'stripe';
import {defineSecret} from "firebase-functions/params";

const stripeSecretKey = defineSecret("STRIPE_SECRET_KEY");

export const stripe = new Stripe(
    stripeSecretKey.value(),
    {apiVersion: "2023-10-16",
    typescript: true},
);
