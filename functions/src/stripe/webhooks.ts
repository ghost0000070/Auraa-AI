import {https} from "firebase-functions/v2";
import {defineSecret} from "firebase-functions/params";
import Stripe from "stripe";
import * as admin from "firebase-admin";
import {
  handlePaymentFailure,
  retryInvoicePayment,
  restorePayoutSchedule,
} from "./subscriptions.js";

const stripeSecretKey = defineSecret("STRIPE_SECRET_KEY");
const stripeWebhookSecret = defineSecret("STRIPE_WEBHOOK_SECRET");

const db = admin.firestore();

// Initialize Stripe with the latest API version
const initStripe = () => {
  return new Stripe(stripeSecretKey.value(), {
    apiVersion: "2025-11-17.clover" as any,
    typescript: true,
  });
};

/**
 * Stripe webhook handler
 * POST /stripeWebhook
 * Handles Stripe events for subscription billing
 */
export const stripeWebhook = https.onRequest(
    {
      secrets: [stripeSecretKey, stripeWebhookSecret],
      cors: false,
    },
    async (req, res) => {
      if (req.method !== "POST") {
        res.status(405).json({error: "Method not allowed"});
        return;
      }

      const sig = req.headers["stripe-signature"] as string;
      const webhookSecret = stripeWebhookSecret.value();

      let event: Stripe.Event;

      try {
        const stripe = initStripe();
        event = stripe.webhooks.constructEvent(
            req.rawBody,
            sig,
            webhookSecret
        );
      } catch (err: any) {
        console.error("Webhook signature verification failed:", err.message);
        res.status(400).send(`Webhook Error: ${err.message}`);
        return;
      }

      // Handle the event
      try {
        switch (event.type) {
          case "invoice.payment_failed":
            await handleInvoicePaymentFailed(event.data.object as Stripe.Invoice);
            break;

          case "invoice.payment_succeeded":
            await handleInvoicePaymentSucceeded(event.data.object as Stripe.Invoice);
            break;

          case "customer.subscription.created":
            await handleSubscriptionCreated(event.data.object as Stripe.Subscription);
            break;

          case "customer.subscription.updated":
            await handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
            break;

          case "customer.subscription.deleted":
            await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
            break;

          case "checkout.session.completed":
            await handleCheckoutSessionCompleted(
            event.data.object as Stripe.Checkout.Session
            );
            break;

          case "checkout.session.expired":
            await handleCheckoutSessionExpired(
            event.data.object as Stripe.Checkout.Session
            );
            break;

          default:
            console.log(`Unhandled event type: ${event.type}`);
        }

        res.status(200).json({received: true});
      } catch (error: any) {
        console.error("Error processing webhook:", error);
        res.status(500).json({error: error.message});
      }
    }
);

/**
 * Handle invoice.payment_failed event
 */
async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  console.log(`Payment failed for invoice: ${invoice.id}`);

  const stripe = initStripe();
  const connectedAccountId = (invoice as any).customer_account;

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
        subscriptionId: (invoice as any).subscription,
        status: "failed",
      });

  // Switch to manual payouts to prevent balance depletion
  await handlePaymentFailure(stripe, connectedAccountId, db);

  // Schedule retry (this would be triggered by a separate cloud function or cron job)
  console.log(`Scheduled retry for invoice ${invoice.id}`);
}

/**
 * Handle invoice.payment_succeeded event
 */
async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
  console.log(`Payment succeeded for invoice: ${invoice.id}`);

  const stripe = initStripe();
  const connectedAccountId = (invoice as any).customer_account;

  if (!connectedAccountId) {
    console.log("No connected account ID found in invoice");
    return;
  }

  // Update payment record
  await db
      .collection("subscription_payment_failures")
      .doc(invoice.id || `inv_${Date.now()}`)
      .set(
          {
            status: "succeeded",
            succeededAt: admin.firestore.FieldValue.serverTimestamp(),
          },
          {merge: true}
      );

  // Restore original payout schedule
  await restorePayoutSchedule(stripe, connectedAccountId, db);

  // Log successful payment
  await db.collection("subscription_payments").add({
    invoiceId: invoice.id,
    connectedAccountId,
    amount: invoice.amount_paid,
    currency: invoice.currency,
    subscriptionId: (invoice as any).subscription,
    paidAt: admin.firestore.FieldValue.serverTimestamp(),
  });
}

/**
 * Handle customer.subscription.created event
 */
async function handleSubscriptionCreated(subscription: Stripe.Subscription) {
  console.log(`Subscription created: ${subscription.id}`);

  const connectedAccountId = (subscription as any).customer_account;

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
        currentPeriodStart: (subscription as any).current_period_start,
        currentPeriodEnd: (subscription as any).current_period_end,
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
async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  console.log(`Subscription updated: ${subscription.id}`);

  await db
      .collection("connected_account_subscriptions")
      .doc(subscription.id)
      .update({
        status: subscription.status,
        currentPeriodStart: (subscription as any).current_period_start,
        currentPeriodEnd: (subscription as any).current_period_end,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
}

/**
 * Handle customer.subscription.deleted event
 */
async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  console.log(`Subscription deleted: ${subscription.id}`);

  await db
      .collection("connected_account_subscriptions")
      .doc(subscription.id)
      .update({
        status: "canceled",
        canceledAt: admin.firestore.FieldValue.serverTimestamp(),
      });
}

/**
 * Handle checkout.session.completed event
 */
async function handleCheckoutSessionCompleted(
    session: Stripe.Checkout.Session
) {
  console.log(`Checkout session completed: ${session.id}`);

  const connectedAccountId = (session as any).customer_account;

  if (!connectedAccountId) {
    console.log("No connected account ID found in checkout session");
    return;
  }

  await db.collection("checkout_sessions").doc(session.id).set({
    sessionId: session.id,
    connectedAccountId,
    status: session.status,
    paymentStatus: session.payment_status,
    subscriptionId: session.subscription,
    completedAt: admin.firestore.FieldValue.serverTimestamp(),
  });
}

/**
 * Handle checkout.session.expired event
 */
async function handleCheckoutSessionExpired(
    session: Stripe.Checkout.Session
) {
  console.log(`Checkout session expired: ${session.id}`);

  await db
      .collection("checkout_sessions")
      .doc(session.id)
      .update({
        status: "expired",
        expiredAt: admin.firestore.FieldValue.serverTimestamp(),
      });
}

/**
 * Scheduled function to retry failed payments
 * Runs daily to check for failed invoices with sufficient balance
 */
export const retryFailedPaymentsScheduled = https.onRequest(
    {secrets: [stripeSecretKey]},
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
          const {invoiceId, connectedAccountId} = failureData;

          try {
            const result = await retryInvoicePayment(
                stripe,
                invoiceId,
                connectedAccountId
            );
            retryResults.push({invoiceId, result});

            if (result.success) {
            // Update the failure record
              await doc.ref.update({
                status: "retried_successfully",
                retriedAt: admin.firestore.FieldValue.serverTimestamp(),
              });
            }
          } catch (error: any) {
            console.error(`Error retrying invoice ${invoiceId}:`, error);
            retryResults.push({invoiceId, error: error.message});
          }
        }

        res.status(200).json({
          success: true,
          retriedCount: retryResults.length,
          results: retryResults,
        });
      } catch (error: any) {
        console.error("Error in retry scheduled function:", error);
        res.status(500).json({error: error.message});
      }
    }
);
