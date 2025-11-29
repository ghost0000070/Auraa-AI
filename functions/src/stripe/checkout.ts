import {https} from "firebase-functions/v2";
import {defineSecret} from "firebase-functions/params";
import Stripe from "stripe";

const stripeSecretKey = defineSecret("STRIPE_SECRET_KEY");

// Initialize Stripe
const initStripe = () => {
  return new Stripe(stripeSecretKey.value(), {
    apiVersion: "2025-11-17.clover" as any,
    typescript: true,
  });
};

/**
 * Create a Checkout Session for redirect-based subscription flow
 * POST /createCheckoutSession
 * Body: { lookup_key: string } or { price_id: string }
 */
export const createCheckoutSession = https.onRequest(
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
        const stripe = initStripe();
        const {lookup_key, price_id} = req.body;

        let priceId = price_id;

        // If lookup_key provided, retrieve the price
        if (lookup_key && !price_id) {
          const prices = await stripe.prices.list({
            lookup_keys: [lookup_key],
            expand: ["data.product"],
          });

          if (prices.data.length === 0) {
            res.status(404).json({error: "Price not found for lookup key"});
            return;
          }

          priceId = prices.data[0].id;
        }

        if (!priceId) {
          res.status(400).json({
            error: "Either lookup_key or price_id is required",
          });
          return;
        }

        // Get the domain from request or use environment variable
        const protocol = req.get("x-forwarded-proto") || "http";
        const host = req.get("host") || "localhost:4242";
        const YOUR_DOMAIN = `${protocol}://${host}`;

        // Get user email if available (from query params or body)
        const customerEmail = req.body.email || req.query.email;

        // Create Checkout Session
        const session = await stripe.checkout.sessions.create({
          billing_address_collection: "auto",
          customer_email: customerEmail,
          line_items: [
            {
              price: priceId,
              quantity: 1,
            },
          ],
          mode: "subscription",
          success_url: `${YOUR_DOMAIN}/success.html?session_id={CHECKOUT_SESSION_ID}`,
          cancel_url: `${YOUR_DOMAIN}/cancel.html`,
        });

        // Redirect to Checkout
        res.redirect(303, session.url as string);
      } catch (error: any) {
        console.error("Error creating checkout session:", error);
        res.status(500).json({error: error.message});
      }
    }
);

/**
 * Create a customer portal session
 * POST /createPortalSession
 * Body: { session_id: string }
 */
export const createPortalSession = https.onRequest(
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
        const stripe = initStripe();
        const {session_id} = req.body;

        if (!session_id) {
          res.status(400).json({error: "session_id is required"});
          return;
        }

        // Get the checkout session to retrieve customer ID
        const checkoutSession = await stripe.checkout.sessions.retrieve(session_id);

        if (!checkoutSession.customer) {
          res.status(400).json({error: "No customer found for this session"});
          return;
        }

        // Get the domain from request
        const protocol = req.get("x-forwarded-proto") || "http";
        const host = req.get("host") || "localhost:4242";
        const YOUR_DOMAIN = `${protocol}://${host}`;

        // Create portal session
        const portalSession = await stripe.billingPortal.sessions.create({
          customer: checkoutSession.customer as string,
          return_url: `${YOUR_DOMAIN}/`,
        });

        res.redirect(303, portalSession.url);
      } catch (error: any) {
        console.error("Error creating portal session:", error);
        res.status(500).json({error: error.message});
      }
    }
);

/**
 * Get checkout session details
 * GET /checkoutSessionDetails?session_id=xxx
 */
export const checkoutSessionDetails = https.onRequest(
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
        const stripe = initStripe();
        const sessionId = req.query.session_id as string;

        if (!sessionId) {
          res.status(400).json({error: "session_id parameter is required"});
          return;
        }

        const session = await stripe.checkout.sessions.retrieve(sessionId, {
          expand: ["subscription", "customer"],
        });

        const customer = session.customer as Stripe.Customer | Stripe.DeletedCustomer;
        const customerEmail = customer && !customer.deleted ? (customer as Stripe.Customer).email : null;

        res.status(200).json({
          status: session.status,
          customer_email: customerEmail,
          subscription: session.subscription,
        });
      } catch (error: any) {
        console.error("Error retrieving session details:", error);
        res.status(500).json({error: error.message});
      }
    }
);
