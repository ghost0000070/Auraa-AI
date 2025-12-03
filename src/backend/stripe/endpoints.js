"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.setMinimumBalanceEndpoint = exports.retryInvoicePaymentEndpoint = exports.createSubscriptionEndpoint = exports.sessionStatusEndpoint = exports.createCheckoutSessionEndpoint = exports.createSubscriptionProductEndpoint = void 0;
const v2_1 = require("firebase-functions/v2");
const params_1 = require("firebase-functions/params");
const stripe_1 = __importDefault(require("stripe"));
const subscriptions_js_1 = require("./subscriptions.js");
const stripeSecretKey = (0, params_1.defineSecret)("STRIPE_SECRET_KEY");
// Initialize Stripe with the latest API version
const initStripe = () => {
    return new stripe_1.default(stripeSecretKey.value(), {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        apiVersion: "2025-11-17.clover",
        typescript: true,
    });
};
/**
 * Create a subscription product
 * POST /createSubscriptionProduct
 * Body: { productName: string, unitAmount: number, currency?: string, interval?: 'month' | 'year' }
 */
exports.createSubscriptionProductEndpoint = v2_1.https.onRequest({ secrets: [stripeSecretKey] }, async (req, res) => {
    var _a;
    // Set CORS headers
    res.set("Access-Control-Allow-Origin", "*");
    res.set("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.set("Access-Control-Allow-Headers", "Content-Type");
    if (req.method === "OPTIONS") {
        res.status(204).send("");
        return;
    }
    if (req.method !== "POST") {
        res.status(405).json({ error: "Method not allowed" });
        return;
    }
    try {
        const { productName, unitAmount, currency = "usd", interval = "month" } = req.body;
        if (!productName || !unitAmount) {
            res.status(400).json({ error: "Missing required fields: productName, unitAmount" });
            return;
        }
        const stripe = initStripe();
        const product = await (0, subscriptions_js_1.createSubscriptionProduct)(stripe, productName, unitAmount, currency, interval);
        res.status(200).json({
            success: true,
            product: {
                id: product.id,
                name: product.name,
                priceId: typeof product.default_price === "string" ? product.default_price : (_a = product.default_price) === null || _a === void 0 ? void 0 : _a.id,
            },
        });
    }
    catch (error) {
        console.error("Error creating subscription product:", error);
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        res.status(500).json({ error: errorMessage });
    }
});
/**
 * Create embedded checkout session
 * POST /createCheckoutSession
 * Body: { connectedAccountId: string, priceId: string, returnUrl: string }
 */
exports.createCheckoutSessionEndpoint = v2_1.https.onRequest({ secrets: [stripeSecretKey] }, async (req, res) => {
    res.set("Access-Control-Allow-Origin", "*");
    res.set("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.set("Access-Control-Allow-Headers", "Content-Type");
    if (req.method === "OPTIONS") {
        res.status(204).send("");
        return;
    }
    if (req.method !== "POST") {
        res.status(405).json({ error: "Method not allowed" });
        return;
    }
    try {
        const { connectedAccountId, priceId, returnUrl } = req.body;
        if (!connectedAccountId || !priceId || !returnUrl) {
            res.status(400).json({
                error: "Missing required fields: connectedAccountId, priceId, returnUrl",
            });
            return;
        }
        const stripe = initStripe();
        const session = await (0, subscriptions_js_1.createEmbeddedCheckoutSession)(stripe, connectedAccountId, priceId, returnUrl);
        res.status(200).json({
            success: true,
            clientSecret: session.client_secret,
            sessionId: session.id,
        });
    }
    catch (error) {
        console.error("Error creating checkout session:", error);
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        res.status(500).json({ error: errorMessage });
    }
});
/**
 * Get checkout session status
 * GET /sessionStatus?session_id=xxx
 */
exports.sessionStatusEndpoint = v2_1.https.onRequest({ secrets: [stripeSecretKey] }, async (req, res) => {
    res.set("Access-Control-Allow-Origin", "*");
    res.set("Access-Control-Allow-Methods", "GET, OPTIONS");
    res.set("Access-Control-Allow-Headers", "Content-Type");
    if (req.method === "OPTIONS") {
        res.status(204).send("");
        return;
    }
    if (req.method !== "GET") {
        res.status(405).json({ error: "Method not allowed" });
        return;
    }
    try {
        const sessionId = req.query.session_id;
        if (!sessionId) {
            res.status(400).json({ error: "Missing session_id parameter" });
            return;
        }
        const stripe = initStripe();
        const sessionStatus = await (0, subscriptions_js_1.getCheckoutSessionStatus)(stripe, sessionId);
        res.status(200).json(sessionStatus);
    }
    catch (error) {
        console.error("Error retrieving session status:", error);
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        res.status(500).json({ error: errorMessage });
    }
});
/**
 * Create subscription with SetupIntent (for Stripe balance payment)
 * POST /createSubscription
 * Body: { connectedAccountId: string, priceId: string, quantity?: number }
 */
exports.createSubscriptionEndpoint = v2_1.https.onRequest({ secrets: [stripeSecretKey] }, async (req, res) => {
    res.set("Access-Control-Allow-Origin", "*");
    res.set("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.set("Access-Control-Allow-Headers", "Content-Type");
    if (req.method === "OPTIONS") {
        res.status(204).send("");
        return;
    }
    if (req.method !== "POST") {
        res.status(405).json({ error: "Method not allowed" });
        return;
    }
    try {
        const { connectedAccountId, priceId, quantity = 1 } = req.body;
        if (!connectedAccountId || !priceId) {
            res.status(400).json({
                error: "Missing required fields: connectedAccountId, priceId",
            });
            return;
        }
        const stripe = initStripe();
        // Create SetupIntent to attach payment method
        const setupIntent = await (0, subscriptions_js_1.createBalanceSetupIntent)(stripe, connectedAccountId);
        if (setupIntent.status !== "succeeded" || !setupIntent.payment_method) {
            res.status(400).json({
                error: "Failed to set up payment method",
                setupIntent,
            });
            return;
        }
        // Create subscription with the payment method
        const subscription = await (0, subscriptions_js_1.createConnectedAccountSubscription)(stripe, connectedAccountId, setupIntent.payment_method, priceId, quantity);
        res.status(200).json({
            success: true,
            subscription: {
                id: subscription.id,
                status: subscription.status,
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                current_period_end: subscription.current_period_end,
            },
        });
    }
    catch (error) {
        console.error("Error creating subscription:", error);
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        res.status(500).json({ error: errorMessage });
    }
});
/**
 * Retry failed invoice payment
 * POST /retryInvoicePayment
 * Body: { invoiceId: string, connectedAccountId: string }
 */
exports.retryInvoicePaymentEndpoint = v2_1.https.onRequest({ secrets: [stripeSecretKey] }, async (req, res) => {
    res.set("Access-Control-Allow-Origin", "*");
    res.set("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.set("Access-Control-Allow-Headers", "Content-Type");
    if (req.method === "OPTIONS") {
        res.status(204).send("");
        return;
    }
    if (req.method !== "POST") {
        res.status(405).json({ error: "Method not allowed" });
        return;
    }
    try {
        const { invoiceId, connectedAccountId } = req.body;
        if (!invoiceId || !connectedAccountId) {
            res.status(400).json({
                error: "Missing required fields: invoiceId, connectedAccountId",
            });
            return;
        }
        const stripe = initStripe();
        const result = await (0, subscriptions_js_1.retryInvoicePayment)(stripe, invoiceId, connectedAccountId);
        res.status(200).json(result);
    }
    catch (error) {
        console.error("Error retrying invoice payment:", error);
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        res.status(500).json({ error: errorMessage });
    }
});
/**
 * Set minimum balance for connected account
 * POST /setMinimumBalance
 * Body: { connectedAccountId: string, minimumAmount: number, currency?: string }
 */
exports.setMinimumBalanceEndpoint = v2_1.https.onRequest({ secrets: [stripeSecretKey] }, async (req, res) => {
    res.set("Access-control-Allow-Origin", "*");
    res.set("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.set("Access-Control-Allow-Headers", "Content-Type");
    if (req.method === "OPTIONS") {
        res.status(204).send("");
        return;
    }
    if (req.method !== "POST") {
        res.status(405).json({ error: "Method not allowed" });
        return;
    }
    try {
        const { connectedAccountId, minimumAmount, currency = "usd" } = req.body;
        if (!connectedAccountId || minimumAmount === undefined) {
            res.status(400).json({
                error: "Missing required fields: connectedAccountId, minimumAmount",
            });
            return;
        }
        const stripe = initStripe();
        await (0, subscriptions_js_1.setMinimumBalance)(stripe, connectedAccountId, minimumAmount, currency);
        res.status(200).json({
            success: true,
            message: `Minimum balance set to ${minimumAmount} ${currency}`,
        });
    }
    catch (error) {
        console.error("Error setting minimum balance:", error);
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        res.status(500).json({ error: errorMessage });
    }
});
//# sourceMappingURL=endpoints.js.map