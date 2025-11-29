import Stripe from "stripe";
import {defineSecret} from "firebase-functions/params";

export const stripeSecretKey = defineSecret("STRIPE_SECRET_KEY");

// Lazy initialization - stripe instance will be created at runtime
let stripeInstance: Stripe | null = null;

export const getStripe = (): Stripe => {
  if (!stripeInstance) {
    stripeInstance = new Stripe(
        stripeSecretKey.value(),
        {
          apiVersion: "2025-11-17.clover" as never,
          typescript: true,
        },
    );
  }
  return stripeInstance;
};

// For backward compatibility
export const stripe = new Proxy({} as Stripe, {
  get: (target, prop) => {
    return getStripe()[prop as keyof Stripe];
  },
});
