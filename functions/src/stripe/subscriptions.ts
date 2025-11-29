import Stripe from "stripe";
import * as admin from "firebase-admin";

/**
 * Create a product with recurring price for SaaS subscription
 * @param stripe Stripe instance
 * @param productName Name of the subscription product
 * @param unitAmount Amount in cents (e.g., 1000 = $10.00)
 * @param currency Currency code (e.g., 'usd')
 * @param interval Billing interval ('month' or 'year')
 * @return Created product with price
 */
export async function createSubscriptionProduct(
    stripe: Stripe,
    productName: string,
    unitAmount: number,
    currency: string = "usd",
    interval: "month" | "year" = "month"
) {
  try {
    const product = await stripe.products.create({
      name: productName,
      default_price_data: {
        unit_amount: unitAmount,
        currency: currency,
        recurring: {interval: interval},
      },
      expand: ["default_price"],
    });

    console.log(`Created product: ${product.id} with price: ${product.default_price}`);
    return product;
  } catch (error) {
    console.error("Error creating subscription product:", error);
    throw error;
  }
}

/**
 * Create a SetupIntent to attach payment method from connected account's balance
 * @param stripe Stripe instance
 * @param connectedAccountId Connected account ID
 * @return SetupIntent
 */
export async function createBalanceSetupIntent(
    stripe: Stripe,
    connectedAccountId: string
) {
  try {
    const setupIntent = await stripe.setupIntents.create({
      payment_method_types: ["stripe_balance"],
      confirm: true,
      customer_account: connectedAccountId,
      usage: "off_session",
      payment_method_data: {
        type: "stripe_balance",
      },
    } as any); // Type assertion needed for preview API

    console.log(`Created SetupIntent: ${setupIntent.id} for account: ${connectedAccountId}`);
    return setupIntent;
  } catch (error) {
    console.error("Error creating balance SetupIntent:", error);
    throw error;
  }
}

/**
 * Create a subscription for connected account using Stripe balance
 * @param stripe Stripe instance
 * @param connectedAccountId Connected account ID
 * @param paymentMethodId Payment method ID from SetupIntent
 * @param priceId Price ID of the subscription
 * @param quantity Quantity (default 1)
 * @return Created subscription
 */
export async function createConnectedAccountSubscription(
    stripe: Stripe,
    connectedAccountId: string,
    paymentMethodId: string,
    priceId: string,
    quantity: number = 1
) {
  try {
    const subscription = await stripe.subscriptions.create({
      customer_account: connectedAccountId,
      default_payment_method: paymentMethodId,
      items: [
        {
          price: priceId,
          quantity: quantity,
        },
      ],
      payment_settings: {
        payment_method_types: ["stripe_balance"],
      },
    } as any); // Type assertion needed for preview API

    console.log(`Created subscription: ${subscription.id} for account: ${connectedAccountId}`);
    return subscription;
  } catch (error) {
    console.error("Error creating subscription:", error);
    throw error;
  }
}

/**
 * Create an embedded Checkout Session for connected account subscription
 * @param stripe Stripe instance
 * @param connectedAccountId Connected account ID
 * @param priceId Price ID of the subscription
 * @param returnUrl Return URL after checkout
 * @return Checkout Session
 */
export async function createEmbeddedCheckoutSession(
    stripe: Stripe,
    connectedAccountId: string,
    priceId: string,
    returnUrl: string
) {
  try {
    const session = await stripe.checkout.sessions.create({
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: "subscription",
      ui_mode: "embedded",
      return_url: `${returnUrl}?session_id={CHECKOUT_SESSION_ID}`,
      customer_account: connectedAccountId,
    } as any); // Type assertion needed for preview API

    console.log(`Created Checkout Session: ${session.id} for account: ${connectedAccountId}`);
    return session;
  } catch (error) {
    console.error("Error creating embedded checkout session:", error);
    throw error;
  }
}

/**
 * Retrieve Checkout Session status
 * @param stripe Stripe instance
 * @param sessionId Checkout Session ID
 * @return Session with customer details
 */
export async function getCheckoutSessionStatus(
    stripe: Stripe,
    sessionId: string
) {
  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    let customerEmail = "";
    if (session.customer) {
      const customer = await stripe.customers.retrieve(session.customer as string);
      if (!customer.deleted) {
        customerEmail = (customer as Stripe.Customer).email || "";
      }
    }

    return {
      status: session.status,
      payment_status: session.payment_status,
      customer_email: customerEmail,
    };
  } catch (error) {
    console.error("Error retrieving session status:", error);
    throw error;
  }
}

/**
 * Handle failed subscription payment by switching to manual payouts
 * @param stripe Stripe instance
 * @param connectedAccountId Connected account ID
 * @param db Firestore database instance
 */
export async function handlePaymentFailure(
    stripe: Stripe,
    connectedAccountId: string,
    db: admin.firestore.Firestore
) {
  try {
    // Store original payout schedule
    const account = await stripe.accounts.retrieve(connectedAccountId);
    const originalSchedule = account.settings?.payouts?.schedule;

    // Store in Firestore for later restoration
    await db.collection("connected_accounts").doc(connectedAccountId).set({
      originalPayoutSchedule: originalSchedule,
      paymentFailedAt: admin.firestore.FieldValue.serverTimestamp(),
    }, {merge: true});

    // Switch to manual payouts
    await stripe.accounts.update(connectedAccountId, {
      settings: {
        payouts: {
          schedule: {
            interval: "manual",
          },
        },
      },
    });

    console.log(`Switched account ${connectedAccountId} to manual payouts`);
  } catch (error) {
    console.error("Error handling payment failure:", error);
    throw error;
  }
}

/**
 * Retry failed invoice payment from Stripe balance
 * @param stripe Stripe instance
 * @param invoiceId Invoice ID to retry
 * @param connectedAccountId Connected account ID
 * @return Payment result
 */
export async function retryInvoicePayment(
    stripe: Stripe,
    invoiceId: string,
    connectedAccountId: string
) {
  try {
    // Check available balance
    const balance = await stripe.balance.retrieve({
      stripeAccount: connectedAccountId,
    });

    const availableAmount = balance.available.reduce((sum, bal) => sum + bal.amount, 0);

    // Get invoice
    const invoice = await stripe.invoices.retrieve(invoiceId);

    if (availableAmount >= (invoice.amount_due || 0)) {
      // Sufficient balance, retry payment
      const paidInvoice = await stripe.invoices.pay(invoiceId);
      console.log(`Successfully retried payment for invoice: ${invoiceId}`);
      return {success: true, invoice: paidInvoice};
    } else {
      console.log(`Insufficient balance for invoice: ${invoiceId}. Need: ${invoice.amount_due}, Have: ${availableAmount}`);
      return {success: false, reason: "insufficient_balance", needed: invoice.amount_due, available: availableAmount};
    }
  } catch (error) {
    console.error("Error retrying invoice payment:", error);
    throw error;
  }
}

/**
 * Restore original payout schedule after successful payment
 * @param stripe Stripe instance
 * @param connectedAccountId Connected account ID
 * @param db Firestore database instance
 */
export async function restorePayoutSchedule(
    stripe: Stripe,
    connectedAccountId: string,
    db: admin.firestore.Firestore
) {
  try {
    // Get original schedule from Firestore
    const docRef = await db.collection("connected_accounts").doc(connectedAccountId).get();
    const originalSchedule = docRef.data()?.originalPayoutSchedule;

    if (originalSchedule) {
      await stripe.accounts.update(connectedAccountId, {
        settings: {
          payouts: {
            schedule: originalSchedule,
          },
        },
      });

      // Clear the stored schedule
      await db.collection("connected_accounts").doc(connectedAccountId).update({
        originalPayoutSchedule: admin.firestore.FieldValue.delete(),
        paymentRestoredAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      console.log(`Restored payout schedule for account ${connectedAccountId}`);
    }
  } catch (error) {
    console.error("Error restoring payout schedule:", error);
    throw error;
  }
}

/**
 * Set minimum balance for connected account to prevent insufficient funds
 * @param stripe Stripe instance
 * @param connectedAccountId Connected account ID
 * @param minimumAmount Minimum amount in cents
 * @param currency Currency code
 */
export async function setMinimumBalance(
    stripe: Stripe,
    connectedAccountId: string,
    minimumAmount: number,
    currency: string = "usd"
) {
  try {
    await stripe.accounts.update(connectedAccountId, {
      settings: {
        payouts: {
          statement_descriptor: "Minimum balance set",
        },
      },
    });

    console.log(`Set minimum balance of ${minimumAmount} ${currency} for account ${connectedAccountId}`);
  } catch (error) {
    console.error("Error setting minimum balance:", error);
    throw error;
  }
}
