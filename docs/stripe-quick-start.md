# Stripe Subscription Quick Start Guide

## Prerequisites

- Firebase project with Cloud Functions enabled
- Stripe account with API keys
- Node.js and npm installed

## Step-by-Step Setup

### 1. Configure Stripe Secrets

```bash
firebase functions:secrets:set STRIPE_SECRET_KEY
# Enter your Stripe secret key when prompted

firebase functions:secrets:set STRIPE_WEBHOOK_SECRET
# Enter your webhook signing secret when prompted
```

### 2. Deploy Functions

```bash
cd functions
npm install
npm run build
firebase deploy --only functions
```

### 3. Create a Subscription Product

After deployment, create your first subscription product:

```bash
curl -X POST https://YOUR_REGION-YOUR_PROJECT.cloudfunctions.net/createSubscriptionProductEndpoint \
  -H "Content-Type: application/json" \
  -d '{
    "productName": "Auraa AI Monthly Subscription",
    "unitAmount": 2999,
    "currency": "usd",
    "interval": "month"
  }'
```

**Save the `priceId` from the response!**

### 4. Configure Client Files

Update `public/checkout-embedded.html`:

```javascript
// Line 45-50
const CONFIG = {
  apiBaseUrl: 'https://us-central1-your-project.cloudfunctions.net',
  connectedAccountId: 'acct_1234567890', // Your connected account ID
  priceId: 'price_1234567890', // From step 3
  returnUrl: window.location.origin + '/checkout-return.html'
};

// Line 57
const stripe = Stripe('pk_test_your_publishable_key');
```

Update `public/checkout-return.html`:

```javascript
// Line 76
const API_BASE_URL = 'https://us-central1-your-project.cloudfunctions.net';
```

### 5. Set Up Webhook

1. Go to [Stripe dashboard webhooks](https://dashboard.stripe.com/webhooks)
2. Click "Add endpoint"
3. Enter URL: `https://YOUR_REGION-YOUR_PROJECT.cloudfunctions.net/stripeWebhook`
4. Select events:
   - `invoice.payment_failed`
   - `invoice.payment_succeeded`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `checkout.session.completed`
   - `checkout.session.expired`
5. Copy the signing secret
6. Update the secret: `firebase functions:secrets:set STRIPE_WEBHOOK_SECRET`

### 6. Test the Integration

```bash
# Deploy the public pages
firebase deploy --only hosting

# Open in browser
open https://www.auraa-ai.com/checkout-embedded.html
```

Use Stripe test card: `4242 4242 4242 4242` with any future expiry date and any CVC.

## Common Commands

### Create Product

```bash
curl -X POST https://YOUR_FUNCTIONS_URL/createSubscriptionProductEndpoint \
  -H "Content-Type: application/json" \
  -d '{"productName":"Plan Name","unitAmount":1000,"currency":"usd","interval":"month"}'
```

### Create Subscription (Direct)

```bash
curl -X POST https://YOUR_FUNCTIONS_URL/createSubscriptionEndpoint \
  -H "Content-Type: application/json" \
  -d '{"connectedAccountId":"acct_xxx","priceId":"price_xxx"}'
```

### Retry Failed Payment

```bash
curl -X POST https://YOUR_FUNCTIONS_URL/retryInvoicePaymentEndpoint \
  -H "Content-Type: application/json" \
  -d '{"invoiceId":"in_xxx","connectedAccountId":"acct_xxx"}'
```

## Testing Scenarios

### Test Successful Payment

1. Navigate to `/checkout-embedded.html`
2. Use card: `4242 4242 4242 4242`
3. Complete checkout
4. Verify redirect to success page

### Test Failed Payment

1. Use card: `4000 0000 0000 0341` (declined card)
2. Check webhook receives `invoice.payment_failed`
3. Verify Firestore has failure record

### Test Insufficient Balance

1. Create connected account with low balance
2. Attempt subscription creation
3. Verify error handling

## Monitoring

### Check Function Logs

```bash
firebase functions:log
```

### Check Stripe Dashboard

- View payments: <https://dashboard.stripe.com/payments>
- View subscriptions: <https://dashboard.stripe.com/subscriptions>
- View webhooks: <https://dashboard.stripe.com/webhooks>

### Check Firestore

Collections to monitor:

- `connected_account_subscriptions`
- `subscription_payment_failures`
- `subscription_payments`
- `checkout_sessions`

## Troubleshooting

### Functions not deploying

```bash
# Check for errors
npm run build

# Deploy with verbose logging
firebase deploy --only functions --debug
```

### Webhook not working

```bash
# Test locally with Stripe CLI
stripe listen --forward-to localhost:5001/YOUR_PROJECT/us-central1/stripeWebhook
stripe trigger invoice.payment_failed
```

### CORS errors

Check that your client domain is included in the function's CORS configuration. The endpoints already have `Access-Control-Allow-Origin: *` set.

## Next Steps

1. ✅ Test thoroughly in test mode
2. ✅ Set up monitoring and alerts
3. ✅ Configure Firestore security rules
4. ✅ Switch to live API keys for production
5. ✅ Update webhook URL to production function
6. ✅ Remove `*` from CORS and specify your domain

## Support Resources

- Full documentation: `docs/stripe-subscriptions-integration.md`
- Stripe API docs: <https://stripe.com/docs/api>
- Firebase docs: <https://firebase.google.com/docs/functions>
