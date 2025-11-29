import {https} from "firebase-functions/v2";
import {defineSecret} from "firebase-functions/params";
import Stripe from "stripe";
import {
  createSubscriptionProduct,
  createBalanceSetupIntent,
  createConnectedAccountSubscription,
  createEmbeddedCheckoutSession,
  getCheckoutSessionStatus,
  retryInvoicePayment,
  setMinimumBalance,
} from "./subscriptions.js";

const stripeSecretKey = defineSecret("STRIPE_SECRET_KEY");

// Initialize Stripe with the latest API version
const initStripe = () => {
  return new Stripe(stripeSecretKey.value(), {
    apiVersion: "2025-11-17.clover" as any,
    typescript: true,
  });
};

/**
 * Create a subscription product
 * POST /createSubscriptionProduct
 * Body: { productName: string, unitAmount: number, currency?: string, interval?: 'month' | 'year' }
 */
export const createSubscriptionProductEndpoint = https.onRequest(
    {secrets: [stripeSecretKey]},
    async (req, res) => {
    // Set CORS headers
      res.set("Access-Control-Allow-Origin", "*");
      res.set("Access-Control-Allow-Methods", "POST, OPTIONS");
      res.set("Access-Control-Allow-Headers", "Content-Type");

      if (req.method === "OPTIONS") {
        res.status(204).send("");
        return;
      }

      if (req.method !== "POST") {
        res.status(405).json({error: "Method not allowed"});
        return;
      }

      try {
        const {productName, unitAmount, currency = "usd", interval = "month"} = req.body;

        if (!productName || !unitAmount) {
          res.status(400).json({error: "Missing required fields: productName, unitAmount"});
          return;
        }

        const stripe = initStripe();
        const product = await createSubscriptionProduct(
            stripe,
            productName,
            unitAmount,
            currency,
            interval
        );

        res.status(200).json({
          success: true,
          product: {
            id: product.id,
            name: product.name,
            priceId: typeof product.default_price === "string" ? product.default_price : product.default_price?.id,
          },
        });
      } catch (error: any) {
        console.error("Error creating subscription product:", error);
        res.status(500).json({error: error.message});
      }
    }
);

/**
 * Create embedded checkout session
 * POST /createCheckoutSession
 * Body: { connectedAccountId: string, priceId: string, returnUrl: string }
 */
export const createCheckoutSessionEndpoint = https.onRequest(
    {secrets: [stripeSecretKey]},
    async (req, res) => {
      res.set("Access-Control-Allow-Origin", "*");
      res.set("Access-Control-Allow-Methods", "POST, OPTIONS");
      res.set("Access-Control-Allow-Headers", "Content-Type");

      if (req.method === "OPTIONS") {
        res.status(204).send("");
        return;
      }

      if (req.method !== "POST") {
        res.status(405).json({error: "Method not allowed"});
        return;
      }

      try {
        const {connectedAccountId, priceId, returnUrl} = req.body;

        if (!connectedAccountId || !priceId || !returnUrl) {
          res.status(400).json({
            error: "Missing required fields: connectedAccountId, priceId, returnUrl",
          });
          return;
        }

        const stripe = initStripe();
        const session = await createEmbeddedCheckoutSession(
            stripe,
            connectedAccountId,
            priceId,
            returnUrl
        );

        res.status(200).json({
          success: true,
          clientSecret: session.client_secret,
          sessionId: session.id,
        });
      } catch (error: any) {
        console.error("Error creating checkout session:", error);
        res.status(500).json({error: error.message});
      }
    }
);

/**
 * Get checkout session status
 * GET /sessionStatus?session_id=xxx
 */
export const sessionStatusEndpoint = https.onRequest(
    {secrets: [stripeSecretKey]},
    async (req, res) => {
      res.set("Access-Control-Allow-Origin", "*");
      res.set("Access-Control-Allow-Methods", "GET, OPTIONS");
      res.set("Access-Control-Allow-Headers", "Content-Type");

      if (req.method === "OPTIONS") {
        res.status(204).send("");
        return;
      }

      if (req.method !== "GET") {
        res.status(405).json({error: "Method not allowed"});
        return;
      }

      try {
        const sessionId = req.query.session_id as string;

        if (!sessionId) {
          res.status(400).json({error: "Missing session_id parameter"});
          return;
        }

        const stripe = initStripe();
        const sessionStatus = await getCheckoutSessionStatus(stripe, sessionId);

        res.status(200).json(sessionStatus);
      } catch (error: any) {
        console.error("Error retrieving session status:", error);
        res.status(500).json({error: error.message});
      }
    }
);

/**
 * Create subscription with SetupIntent (for Stripe balance payment)
 * POST /createSubscription
 * Body: { connectedAccountId: string, priceId: string, quantity?: number }
 */
export const createSubscriptionEndpoint = https.onRequest(
    {secrets: [stripeSecretKey]},
    async (req, res) => {
      res.set("Access-Control-Allow-Origin", "*");
      res.set("Access-Control-Allow-Methods", "POST, OPTIONS");
      res.set("Access-Control-Allow-Headers", "Content-Type");

      if (req.method === "OPTIONS") {
        res.status(204).send("");
        return;
      }

      if (req.method !== "POST") {
        res.status(405).json({error: "Method not allowed"});
        return;
      }

      try {
        const {connectedAccountId, priceId, quantity = 1} = req.body;

        if (!connectedAccountId || !priceId) {
          res.status(400).json({
            error: "Missing required fields: connectedAccountId, priceId",
          });
          return;
        }

        const stripe = initStripe();

        // Create SetupIntent to attach payment method
        const setupIntent = await createBalanceSetupIntent(stripe, connectedAccountId);

        if (setupIntent.status !== "succeeded" || !setupIntent.payment_method) {
          res.status(400).json({
            error: "Failed to set up payment method",
            setupIntent,
          });
          return;
        }

        // Create subscription with the payment method
        const subscription = await createConnectedAccountSubscription(
            stripe,
            connectedAccountId,
        setupIntent.payment_method as string,
        priceId,
        quantity
        );

        res.status(200).json({
          success: true,
          subscription: {
            id: subscription.id,
            status: subscription.status,
            current_period_end: (subscription as any).current_period_end,
          },
        });
      } catch (error: any) {
        console.error("Error creating subscription:", error);
        res.status(500).json({error: error.message});
      }
    }
);

/**
 * Retry failed invoice payment
 * POST /retryInvoicePayment
 * Body: { invoiceId: string, connectedAccountId: string }
 */
export const retryInvoicePaymentEndpoint = https.onRequest(
    {secrets: [stripeSecretKey]},
    async (req, res) => {
      res.set("Access-Control-Allow-Origin", "*");
      res.set("Access-Control-Allow-Methods", "POST, OPTIONS");
      res.set("Access-Control-Allow-Headers", "Content-Type");

      if (req.method === "OPTIONS") {
        res.status(204).send("");
        return;
      }

      if (req.method !== "POST") {
        res.status(405).json({error: "Method not allowed"});
        return;
      }

      try {
        const {invoiceId, connectedAccountId} = req.body;

        if (!invoiceId || !connectedAccountId) {
          res.status(400).json({
            error: "Missing required fields: invoiceId, connectedAccountId",
          });
          return;
        }

        const stripe = initStripe();
        const result = await retryInvoicePayment(stripe, invoiceId, connectedAccountId);

        res.status(200).json(result);
      } catch (error: any) {
        console.error("Error retrying invoice payment:", error);
        res.status(500).json({error: error.message});
      }
    }
);

/**
 * Set minimum balance for connected account
 * POST /setMinimumBalance
 * Body: { connectedAccountId: string, minimumAmount: number, currency?: string }
 */
export const setMinimumBalanceEndpoint = https.onRequest(
    {secrets: [stripeSecretKey]},
    async (req, res) => {
      res.set("Access-Control-Allow-Origin", "*");
      res.set("Access-Control-Allow-Methods", "POST, OPTIONS");
      res.set("Access-Control-Allow-Headers", "Content-Type");

      if (req.method === "OPTIONS") {
        res.status(204).send("");
        return;
      }

      if (req.method !== "POST") {
        res.status(405).json({error: "Method not allowed"});
        return;
      }

      try {
        const {connectedAccountId, minimumAmount, currency = "usd"} = req.body;

        if (!connectedAccountId || minimumAmount === undefined) {
          res.status(400).json({
            error: "Missing required fields: connectedAccountId, minimumAmount",
          });
          return;
        }

        const stripe = initStripe();
        await setMinimumBalance(stripe, connectedAccountId, minimumAmount, currency);

        res.status(200).json({
          success: true,
          message: `Minimum balance set to ${minimumAmount} ${currency}`,
        });
      } catch (error: any) {
        console.error("Error setting minimum balance:", error);
        res.status(500).json({error: error.message});
      }
    }
);
