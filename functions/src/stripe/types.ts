/**
 * Type definitions for Stripe SaaS subscription integration
 */

export interface SubscriptionProduct {
  productName: string;
  unitAmount: number;
  currency: string;
  interval: "month" | "year";
}

export interface CheckoutSessionRequest {
  connectedAccountId: string;
  priceId: string;
  returnUrl: string;
}

export interface CheckoutSessionResponse {
  success: boolean;
  clientSecret: string;
  sessionId: string;
}

export interface SessionStatusResponse {
  status: "open" | "complete" | "expired";
  payment_status?: "paid" | "unpaid" | "no_payment_required";
  customer_email: string;
}

export interface CreateSubscriptionRequest {
  connectedAccountId: string;
  priceId: string;
  quantity?: number;
}

export interface CreateSubscriptionResponse {
  success: boolean;
  subscription: {
    id: string;
    status: string;
    current_period_end: number;
  };
}

export interface RetryInvoiceRequest {
  invoiceId: string;
  connectedAccountId: string;
}

export interface RetryInvoiceResponse {
  success: boolean;
  invoice?: any;
  reason?: string;
  needed?: number;
  available?: number;
}

export interface MinimumBalanceRequest {
  connectedAccountId: string;
  minimumAmount: number;
  currency?: string;
}

export interface SubscriptionPaymentFailure {
  invoiceId: string;
  connectedAccountId: string;
  amount: number;
  currency: string;
  attemptCount: number;
  failedAt: FirebaseFirestore.Timestamp;
  subscriptionId: string;
  status: "failed" | "succeeded" | "retried_successfully";
  retriedAt?: FirebaseFirestore.Timestamp;
  succeededAt?: FirebaseFirestore.Timestamp;
}

export interface SubscriptionPayment {
  invoiceId: string;
  connectedAccountId: string;
  amount: number;
  currency: string;
  subscriptionId: string;
  paidAt: FirebaseFirestore.Timestamp;
}

export interface ConnectedAccountSubscription {
  subscriptionId: string;
  connectedAccountId: string;
  status: string;
  currentPeriodStart: number;
  currentPeriodEnd: number;
  createdAt: FirebaseFirestore.Timestamp;
  updatedAt?: FirebaseFirestore.Timestamp;
  canceledAt?: FirebaseFirestore.Timestamp;
  items: SubscriptionItem[];
}

export interface SubscriptionItem {
  id: string;
  priceId: string;
  quantity: number;
}

export interface CheckoutSession {
  sessionId: string;
  connectedAccountId: string;
  status: string;
  paymentStatus: string;
  subscriptionId: string;
  completedAt?: FirebaseFirestore.Timestamp;
  expiredAt?: FirebaseFirestore.Timestamp;
}

export interface ConnectedAccountData {
  originalPayoutSchedule?: any;
  paymentFailedAt?: FirebaseFirestore.Timestamp;
  paymentRestoredAt?: FirebaseFirestore.Timestamp;
}

/**
 * Webhook event types
 */
export type StripeWebhookEvent =
  | "invoice.payment_failed"
  | "invoice.payment_succeeded"
  | "customer.subscription.created"
  | "customer.subscription.updated"
  | "customer.subscription.deleted"
  | "checkout.session.completed"
  | "checkout.session.expired";

/**
 * API Error response
 */
export interface ApiErrorResponse {
  error: string;
  message?: string;
  code?: string;
}

/**
 * API Success response
 */
export interface ApiSuccessResponse<T = any> {
  success: true;
  data?: T;
  message?: string;
}
