"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.retryFailedPaymentsScheduled = exports.stripeWebhook = void 0;
const v2_1 = require("firebase-functions/v2");
const params_1 = require("firebase-functions/params");
const stripe_1 = __importDefault(require("stripe"));
const admin = __importStar(require("firebase-admin"));
const subscriptions_js_1 = require("./subscriptions.js");
const stripeSecretKey = (0, params_1.defineSecret)("STRIPE_SECRET_KEY");
const stripeWebhookSecret = (0, params_1.defineSecret)("STRIPE_WEBHOOK_SECRET");
const db = admin.firestore();
// Initialize Stripe with the latest API version
const initStripe = () => {
    return new stripe_1.default(stripeSecretKey.value(), {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        apiVersion: "2025-11-17.clover",
        typescript: true,
    });
};
/**
 * Stripe webhook handler
 * POST /stripeWebhook
 * Handles Stripe events for subscription billing
 */
exports.stripeWebhook = v2_1.https.onRequest({
    secrets: [stripeSecretKey, stripeWebhookSecret],
    cors: false,
}, 
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async (req, res) => {
    if (req.method !== "POST") {
        res.status(405).json({ error: "Method not allowed" });
        return;
    }
    const sig = req.headers["stripe-signature"];
    const webhookSecret = stripeWebhookSecret.value();
    let event;
    try {
        const stripe = initStripe();
        event = stripe.webhooks.constructEvent(req.rawBody, sig, webhookSecret);
    }
    catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Unknown error";
        console.error("Webhook signature verification failed:", errorMessage);
        res.status(400).send(`Webhook Error: ${errorMessage}`);
        return;
    }
    // Handle the event
    try {
        switch (event.type) {
            case "invoice.payment_failed":
                await handleInvoicePaymentFailed(event.data.object);
                break;
            case "invoice.payment_succeeded":
                await handleInvoicePaymentSucceeded(event.data.object);
                break;
            case "customer.subscription.created":
                await handleSubscriptionCreated(event.data.object);
                break;
            case "customer.subscription.updated":
                await handleSubscriptionUpdated(event.data.object);
                break;
            case "customer.subscription.deleted":
                await handleSubscriptionDeleted(event.data.object);
                break;
            case "checkout.session.completed":
                await handleCheckoutSessionCompleted(event.data.object);
                break;
            case "checkout.session.expired":
                await handleCheckoutSessionExpired(event.data.object);
                break;
            default:
                console.log(`Unhandled event type: ${event.type}`);
        }
        res.status(200).json({ received: true });
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        console.error("Error processing webhook:", error);
        res.status(500).json({ error: errorMessage });
    }
});
/**
 * Handle invoice.payment_failed event
 */
async function handleInvoicePaymentFailed(invoice) {
    console.log(`Payment failed for invoice: ${invoice.id}`);
    const stripe = initStripe();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const connectedAccountId = invoice.customer_account;
    if (!connectedAccountId) {
        console.log("No connected account ID found in invoice");
        return;
    }
    // Log the failure
    await db
        .collection("subscription_payment_failures")
        .doc(invoice.id || `inv_${Date.now()}`)
        .set({
        invoiceId: invoice.id,
        connectedAccountId,
        amount: invoice.amount_due,
        currency: invoice.currency,
        attemptCount: invoice.attempt_count,
        failedAt: admin.firestore.FieldValue.serverTimestamp(),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        subscriptionId: invoice.subscription,
        status: "failed",
    });
    // Switch to manual payouts to prevent balance depletion
    await (0, subscriptions_js_1.handlePaymentFailure)(stripe, connectedAccountId, db);
    // Schedule retry (this would be triggered by a separate cloud function or cron job)
    console.log(`Scheduled retry for invoice ${invoice.id}`);
}
/**
 * Handle invoice.payment_succeeded event
 */
async function handleInvoicePaymentSucceeded(invoice) {
    console.log(`Payment succeeded for invoice: ${invoice.id}`);
    const stripe = initStripe();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const connectedAccountId = invoice.customer_account;
    if (!connectedAccountId) {
        console.log("No connected account ID found in invoice");
        return;
    }
    // Update payment record
    await db
        .collection("subscription_payment_failures")
        .doc(invoice.id || `inv_${Date.now()}`)
        .set({
        status: "succeeded",
        succeededAt: admin.firestore.FieldValue.serverTimestamp(),
    }, { merge: true });
    // Restore original payout schedule
    await (0, subscriptions_js_1.restorePayoutSchedule)(stripe, connectedAccountId, db);
    // Log successful payment
    await db.collection("subscription_payments").add({
        invoiceId: invoice.id,
        connectedAccountId,
        amount: invoice.amount_paid,
        currency: invoice.currency,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        subscriptionId: invoice.subscription,
        paidAt: admin.firestore.FieldValue.serverTimestamp(),
    });
}
/**
 * Handle customer.subscription.created event
 */
async function handleSubscriptionCreated(subscription) {
    console.log(`Subscription created: ${subscription.id}`);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const connectedAccountId = subscription.customer_account;
    if (!connectedAccountId) {
        console.log("No connected account ID found in subscription");
        return;
    }
    await db
        .collection("connected_account_subscriptions")
        .doc(subscription.id)
        .set({
        subscriptionId: subscription.id,
        connectedAccountId,
        status: subscription.status,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        currentPeriodStart: subscription.current_period_start,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        currentPeriodEnd: subscription.current_period_end,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        items: subscription.items.data.map((item) => ({
            id: item.id,
            priceId: item.price.id,
            quantity: item.quantity,
        })),
    });
}
/**
 * Handle customer.subscription.updated event
 */
async function handleSubscriptionUpdated(subscription) {
    console.log(`Subscription updated: ${subscription.id}`);
    await db
        .collection("connected_account_subscriptions")
        .doc(subscription.id)
        .update({
        status: subscription.status,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        currentPeriodStart: subscription.current_period_start,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        currentPeriodEnd: subscription.current_period_end,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
}
/**
 * Handle customer.subscription.deleted event
 */
async function handleSubscriptionDeleted(subscription) {
    console.log(`Subscription deleted: ${subscription.id}`);
    await db
        .collection("connected_account_subscriptions")
        .doc(subscription.id)
        .set({
        subscriptionId: subscription.id,
        status: "canceled",
        canceledAt: admin.firestore.FieldValue.serverTimestamp(),
    }, { merge: true });
}
/**
 * Handle checkout.session.completed event
 */
async function handleCheckoutSessionCompleted(session) {
    console.log(`Checkout session completed: ${session.id}`);
    const customerId = session.customer;
    const subscriptionId = session.subscription;
    if (!customerId) {
        console.log("No customer ID found in checkout session");
        return;
    }
    try {
        // Find the user by Stripe customer ID
        const usersQuery = await db
            .collection("users")
            .where("stripeId", "==", customerId)
            .limit(1)
            .get();
        if (usersQuery.empty) {
            console.error(`No user found with Stripe customer ID: ${customerId}`);
            return;
        }
        const userDoc = usersQuery.docs[0];
        // Update user with subscription info
        await userDoc.ref.update({
            subscriptionId: subscriptionId,
            subscriptionStatus: "active",
            isActive: true,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        console.log(`Updated subscription for user ${userDoc.id}`);
        // Store checkout session for reference
        await db.collection("checkout_sessions").doc(session.id).set({
            sessionId: session.id,
            userId: userDoc.id,
            customerId: customerId,
            status: session.status,
            paymentStatus: session.payment_status,
            subscriptionId: subscriptionId,
            completedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        console.error("Error handling checkout session completed:", errorMessage);
        throw error;
    }
}
/**
 * Handle checkout.session.expired event
 */
async function handleCheckoutSessionExpired(session) {
    console.log(`Checkout session expired: ${session.id}`);
    await db
        .collection("checkout_sessions")
        .doc(session.id)
        .set({
        sessionId: session.id,
        status: "expired",
        expiredAt: admin.firestore.FieldValue.serverTimestamp(),
    }, { merge: true });
}
/**
 * Scheduled function to retry failed payments
 * Runs daily to check for failed invoices with sufficient balance
 */
exports.retryFailedPaymentsScheduled = v2_1.https.onRequest({ secrets: [stripeSecretKey] }, 
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async (req, res) => {
    try {
        const stripe = initStripe();
        // Get all failed payments from the last 30 days
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const failedPaymentsSnapshot = await db
            .collection("subscription_payment_failures")
            .where("status", "==", "failed")
            .where("failedAt", ">=", admin.firestore.Timestamp.fromDate(thirtyDaysAgo))
            .get();
        const retryResults = [];
        for (const doc of failedPaymentsSnapshot.docs) {
            const failureData = doc.data();
            const { invoiceId, connectedAccountId } = failureData;
            try {
                const result = await (0, subscriptions_js_1.retryInvoicePayment)(stripe, invoiceId, connectedAccountId);
                retryResults.push({ invoiceId, result });
                if (result.success) {
                    // Update the failure record
                    await doc.ref.update({
                        status: "retried_successfully",
                        retriedAt: admin.firestore.FieldValue.serverTimestamp(),
                    });
                }
            }
            catch (error) {
                const errorMessage = error instanceof Error ? error.message : "Unknown error";
                console.error(`Error retrying invoice ${invoiceId}:`, error);
                retryResults.push({ invoiceId, error: errorMessage });
            }
        }
        res.status(200).json({
            success: true,
            retriedCount: retryResults.length,
            results: retryResults,
        });
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        console.error("Error in retry scheduled function:", error);
        res.status(500).json({ error: errorMessage });
    }
});
//# sourceMappingURL=webhooks.js.map