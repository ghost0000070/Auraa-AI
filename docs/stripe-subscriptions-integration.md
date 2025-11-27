# Stripe SaaS Subscription Integration for Connected Accounts

This implementation allows you to charge SaaS subscription fees directly to your connected accounts using Stripe Billing.

## Features

- ✅ Create recurring subscription products and prices
- ✅ Embedded Checkout for seamless payment experience
- ✅ Charge subscriptions from connected account Stripe balances
- ✅ Automatic payment retry logic for failed payments
- ✅ Webhook handling for subscription lifecycle events
- ✅ Minimum balance configuration to prevent insufficient funds
- ✅ Manual payout management during payment failures

## Setup Instructions

### 1. Install Dependencies

Already completed - Stripe v18.0.0 is installed in the `functions` directory.

### 2. Configure Stripe API Keys

Set up the following secrets in your Firebase project:

```bash
firebase functions:secrets:set STRIPE_SECRET_KEY
firebase functions:secrets:set STRIPE_WEBHOOK_SECRET
```

You'll need:

- **STRIPE_SECRET_KEY**: Your Stripe secret key (starts with `sk_test_` or `sk_live_`)
- **STRIPE_WEBHOOK_SECRET**: Webhook signing secret (starts with `whsec_`)

### 3. Update Stripe API Version

The integration uses Stripe API version `2025-11-17.clover`. Update in `functions/src/utils/stripe.ts`:

```typescript
export const stripe = new Stripe(
  stripeSecretKey.value(),
  {
    apiVersion: "2025-11-17.clover",
    typescript: true
  }
);
```

### 4. Deploy Firebase Functions

Deploy the new endpoints:

```bash
cd functions
npm run build
firebase deploy --only functions
```

## Available Endpoints

### 1. Create Subscription Product

**POST** `/createSubscriptionProductEndpoint`

Creates a product with recurring pricing.

**Request Body:**

```json
{
  "productName": "Connected Account Subscription",
  "unitAmount": 1000,
  "currency": "usd",
  "interval": "month"
}
```

**Response:**

```json
{
  "success": true,
  "product": {
    "id": "prod_xxxxxxxxxx",
    "name": "Connected Account Subscription",
    "priceId": "price_xxxxxxxxxx"
  }
}
```

### 2. Create Embedded Checkout Session

**POST** `/createCheckoutSessionEndpoint`

Creates a checkout session for embedded checkout UI.

**Request Body:**

```json
{
  "connectedAccountId": "acct_xxxxxxxxxx",
  "priceId": "price_xxxxxxxxxx",
  "returnUrl": "https://yourdomain.com/checkout-return.html"
}
```

**Response:**

```json
{
  "success": true,
  "clientSecret": "cs_test_xxxxxxxxxx",
  "sessionId": "cs_test_xxxxxxxxxx"
}
```

### 3. Get Session Status

**GET** `/sessionStatusEndpoint?session_id=cs_test_xxxxxxxxxx`

Retrieves the status of a checkout session.

**Response:**

```json
{
  "status": "complete",
  "payment_status": "paid",
  "customer_email": "customer@example.com"
}
```

### 4. Create Subscription (Direct)

**POST** `/createSubscriptionEndpoint`

Creates a subscription directly using SetupIntent with Stripe balance payment.

**Request Body:**

```json
{
  "connectedAccountId": "acct_xxxxxxxxxx",
  "priceId": "price_xxxxxxxxxx",
  "quantity": 1
}
```

**Response:**

```json
{
  "success": true,
  "subscription": {
    "id": "sub_xxxxxxxxxx",
    "status": "active",
    "current_period_end": 1234567890
  }
}
```

### 5. Retry Failed Invoice Payment

**POST** `/retryInvoicePaymentEndpoint`

Manually retries a failed invoice payment.

**Request Body:**

```json
{
  "invoiceId": "in_xxxxxxxxxx",
  "connectedAccountId": "acct_xxxxxxxxxx"
}
```

**Response:**

```json
{
  "success": true,
  "invoice": { ... }
}
```

### 6. Set Minimum Balance

**POST** `/setMinimumBalanceEndpoint`

Sets a minimum balance threshold for a connected account.

**Request Body:**

```json
{
  "connectedAccountId": "acct_xxxxxxxxxx",
  "minimumAmount": 2000,
  "currency": "usd"
}
```

## Webhook Integration

### Configure Webhook Endpoint

1. Go to [Stripe Dashboard > Webhooks](https://dashboard.stripe.com/webhooks)
2. Add endpoint: `https://YOUR_REGION-YOUR_PROJECT.cloudfunctions.net/stripeWebhook`
3. Select events to listen for:
   - `invoice.payment_failed`
   - `invoice.payment_succeeded`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `checkout.session.completed`
   - `checkout.session.expired`

4. Copy the webhook signing secret and set it:

   ```bash
   firebase functions:secrets:set STRIPE_WEBHOOK_SECRET
   ```

### Handled Webhook Events

- **invoice.payment_failed**: Switches account to manual payouts, logs failure
- **invoice.payment_succeeded**: Restores payout schedule, logs payment
- **customer.subscription.created**: Records subscription in Firestore
- **customer.subscription.updated**: Updates subscription status
- **customer.subscription.deleted**: Marks subscription as canceled
- **checkout.session.completed**: Records successful checkout
- **checkout.session.expired**: Marks session as expired

## Client-Side Integration

### Embedded Checkout

1. **Update Configuration** in `public/checkout-embedded.html`:

   ```javascript
   const CONFIG = {
     apiBaseUrl: 'https://YOUR_REGION-YOUR_PROJECT.cloudfunctions.net',
     connectedAccountId: 'acct_xxxxxxxxxx', // Connected account to charge
     priceId: 'price_xxxxxxxxxx', // Subscription price ID
     returnUrl: window.location.origin + '/checkout-return.html'
   };
   ```

1. **Add Your Publishable Key**:

   ```javascript
   const stripe = Stripe('pk_test_xxxxxxxxxx'); // Replace with your key
   ```

1. **Host the Pages**:

```javascript
const CONFIG = {
  apiBaseUrl: 'https://YOUR_REGION-YOUR_PROJECT.cloudfunctions.net',
  connectedAccountId: 'acct_xxxxxxxxxx', // Connected account to charge
  priceId: 'price_xxxxxxxxxx', // Subscription price ID
  returnUrl: window.location.origin + '/checkout-return.html'
};
```

1. **Add Your Publishable Key**:

```javascript
const stripe = Stripe('pk_test_xxxxxxxxxx'); // Replace with your key
```

1. **Host the Pages**:
   - `checkout-embedded.html` - Main checkout page
   - `checkout-return.html` - Return page after payment

### Return Page

The `checkout-return.html` page automatically:

- Retrieves the checkout session status
- Displays success or error message
- Redirects to dashboard on success

## Payment Failure Handling

### Automatic Retry Logic

The system automatically handles payment failures:

1. When payment fails, the webhook handler:
   - Logs the failure in Firestore
   - Switches account to manual payouts
   - Schedules automatic retries (if enabled in Stripe Dashboard)

2. Automatic retry schedule:
   - First retry: 24 hours after failure
   - Second retry: Following Sunday

### Manual Retry

Use the scheduled function or call the endpoint:

```bash
curl -X POST https://YOUR_REGION-YOUR_PROJECT.cloudfunctions.net/retryInvoicePaymentEndpoint \
  -H "Content-Type: application/json" \
  -d '{
    "invoiceId": "in_xxxxxxxxxx",
    "connectedAccountId": "acct_xxxxxxxxxx"
  }'
```

### Scheduled Retry Function

The `retryFailedPaymentsScheduled` endpoint can be called periodically to retry all failed payments.

Set up a Cloud Scheduler job:

```bash
gcloud scheduler jobs create http retry-failed-payments \
  --schedule="0 2 * * *" \
  --uri="https://YOUR_REGION-YOUR_PROJECT.cloudfunctions.net/retryFailedPaymentsScheduled" \
  --http-method=POST
```

## Firestore Collections

The integration creates and manages these collections:

### `connected_accounts`

Stores connected account payout schedule information.

### `subscription_payment_failures`

Logs failed payment attempts.

### `subscription_payments`

Records successful payments.

### `connected_account_subscriptions`

Tracks all active subscriptions.

### `checkout_sessions`

Stores checkout session data.

## Connected Account Requirements

Connected accounts must meet these requirements:

- ✅ Have both `merchant` and `customer` configurations
- ✅ Have active `card_payments` capability in merchant configuration
- ✅ Have sufficient available balance for Stripe balance payments

## Best Practices

### 1. Coordinate Payout Schedules

Align payout schedules with subscription billing to avoid balance issues.

### 2. Set Minimum Balances

Configure minimum balances to prevent automatic payouts from depleting funds:

```javascript
await setMinimumBalance(stripe, connectedAccountId, 2000, 'usd');
```

### 3. Monitor Failed Payments

Set up alerts for the `invoice.payment_failed` webhook event.

### 4. Test in Test Mode

Always test the integration with Stripe test keys before going live:

- Test connected accounts: `acct_test_xxxxxxxxxx`
- Test prices: `price_test_xxxxxxxxxx`

### 5. Handle Edge Cases

- Insufficient balance scenarios
- Webhook retry logic
- Network timeout handling

## Testing

### Create Test Product

```bash
curl -X POST https://YOUR_REGION-YOUR_PROJECT.cloudfunctions.net/createSubscriptionProductEndpoint \
  -H "Content-Type: application/json" \
  -d '{
    "productName": "Test Subscription",
    "unitAmount": 1000,
    "currency": "usd",
    "interval": "month"
  }'
```

### Test Embedded Checkout

1. Open `http://localhost:5000/checkout-embedded.html` (or your deployed URL)
2. Use [Stripe test cards](https://stripe.com/docs/testing)
3. Complete the checkout flow
4. Verify redirect to return page

### Test Webhook Events

Use Stripe CLI to forward webhooks locally:

```bash
stripe listen --forward-to localhost:5001/YOUR_PROJECT/us-central1/stripeWebhook
stripe trigger invoice.payment_failed
```

## Troubleshooting

### Common Issues

#### 1. Webhook signature verification failed

- Ensure `STRIPE_WEBHOOK_SECRET` is correctly set
- Check that rawBody is used (not parsed body)

#### 2. Insufficient balance errors

- Verify connected account has sufficient available balance
- Check if payouts depleted the balance
- Implement minimum balance settings

#### 3. SetupIntent fails

- Confirm connected account has required configurations
- Verify `card_payments` capability is active

#### 4. CORS errors

- CORS headers are already set in endpoints
- Check if client URL matches allowed origins

## API Version Compatibility

This integration uses Stripe API version `2025-11-17.clover` which includes:

- Connected account customer features
- Stripe balance payment method
- Enhanced subscription billing

## Security Considerations

- ✅ All secret keys stored in Firebase Secrets
- ✅ Webhook signature verification enabled
- ✅ CORS configured for endpoints
- ✅ Firestore security rules recommended
- ✅ No sensitive data in client-side code

## Next Steps

1. Set up Firestore security rules for the collections
2. Implement customer-facing subscription management UI
3. Add email notifications for payment events
4. Configure automatic retry schedules in Stripe Dashboard
5. Set up monitoring and alerting for failed payments
6. Test thoroughly before production deployment

## Support

For issues or questions:

- [Stripe Documentation](https://stripe.com/docs/billing/subscriptions/connect)
- [Firebase Support](https://firebase.google.com/support)
- Check Stripe Dashboard logs for payment issues
- Review Cloud Functions logs in Firebase Console
