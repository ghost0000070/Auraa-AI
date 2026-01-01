# Prebuilt Stripe Checkout Integration - Quick Start

This guide shows you how to implement a redirect-based subscription flow using Stripe's prebuilt, hosted Checkout page.

## Overview

The prebuilt Checkout provides:

- ✅ Stripe-hosted payment page (PCI compliant)
- ✅ Automatic redirect flow
- ✅ Customer portal for subscription management
- ✅ Simpler implementation than embedded checkout
- ✅ Mobile-optimized payment experience

## Files Included

### Backend (Firebase Cloud Functions)

- `functions/src/stripe/checkout.ts` - Checkout and portal session handlers

### Frontend (HTML Pages)

- `public/subscribe.html` - Pricing/subscription page
- `public/success.html` - Success confirmation page
- `public/cancel.html` - Cancellation page

## Quick Setup

### 1. Create a Price with Lookup Key

In your Stripe Dashboard or via API, create a price with a lookup key:

```bash
curl https://api.stripe.com/v1/prices \
  -u YOUR_SECRET_KEY: \
  -d "unit_amount"=5000 \
  -d "currency"=usd \
  -d "recurring[interval]"=month \
  -d "product"=YOUR_PRODUCT_ID \
  -d "lookup_key"=auraa-pro-monthly
```

Or via Dashboard:

1. Go to Products
2. Create/edit a product
3. Add a price
4. Set "Lookup key" to `auraa-pro-monthly`

### 2. Deploy Functions

```bash
cd functions
npm run build
firebase deploy --only functions
```

This deploys:

- `createCheckoutSession` - Creates and redirects to Checkout
- `createPortalSession` - Creates customer portal session
- `checkoutSessionDetails` - Retrieves session info

### 3. Update Frontend URLs

In `public/subscribe.html`, update line 165:

```javascript
const FUNCTIONS_URL = 'https://us-central1-your-project.cloudfunctions.net';
```

In `public/success.html`, update line 135:

```javascript
const FUNCTIONS_URL = 'https://us-central1-your-project.cloudfunctions.net';
```

### 4. Deploy Frontend

```bash
firebase deploy --only hosting
```

### 5. Test

1. Navigate to `https://www.auraa-ai.com/subscribe.html`
2. Click "Subscribe Now"
3. Use test card: `4242 4242 4242 4242`
4. Complete checkout
5. Verify redirect to success page

## API Endpoints

### Create Checkout Session

**Endpoint**: `POST /createCheckoutSession`

**Request Body**:

```json
{
  "lookup_key": "auraa-pro-monthly"
}
```

or

```json
{
  "price_id": "price_xxxxxxxxxx"
}
```

**Response**: Redirects (303) to Stripe Checkout URL

### Create Portal Session

**Endpoint**: `POST /createPortalSession`

**Request Body**:

```json
{
  "session_id": "cs_test_xxxxxxxxxx"
}
```

**Response**: Redirects (303) to Customer Portal URL

### Get Session Details

**Endpoint**: `GET /checkoutSessionDetails?session_id=xxx`

**Response**:

```json
{
  "status": "complete",
  "customer_email": "customer@example.com",
  "subscription": { ... }
}
```

## User Flow

```text
1. User visits /subscribe.html
   ↓
2. Clicks "Subscribe Now"
   ↓
3. POST to /createCheckoutSession
   ↓
4. Redirects to Stripe-hosted Checkout
   ↓
5. User completes payment
   ↓
6. Redirects to /success.html?session_id=xxx
   ↓
7. Page fetches session details
   ↓
8. Shows confirmation & portal button
```

## Customization

### Change Product/Pricing

Update `public/subscribe.html`:

```html
<input type="hidden" name="lookup_key" value="your-lookup-key" />
```

Or use price_id directly:

```html
<input type="hidden" name="price_id" value="price_xxxxxxxxxx" />
```

### Customize Success URL

In `functions/src/stripe/checkout.ts`, modify:

```typescript
success_url: `${YOUR_DOMAIN}/success.html?session_id={CHECKOUT_SESSION_ID}`,
cancel_url: `${YOUR_DOMAIN}/cancel.html`,
```

### Add More Payment Methods

In Stripe Dashboard:

1. Go to Settings > Payment methods
2. Enable additional methods (Apple Pay, Google Pay, etc.)
3. Checkout automatically displays them

### Collect Billing Address

Already enabled in the code:

```typescript
billing_address_collection: "auto",
```

## Testing

### Test Cards

| Card Number | Description |
|-------------|-------------|
| `4242 4242 4242 4242` | Successful payment |
| `4000 0025 0000 3155` | Requires authentication |
| `4000 0000 0000 9995` | Declined |

Use any future expiry date and any 3-digit CVC.

### Local Testing

```bash
# Start local emulator
firebase emulators:start

# Update URLs in HTML to use localhost
# subscribe.html line 167:
form.action = 'http://localhost:5001/YOUR_PROJECT/us-central1/createCheckoutSession';

# success.html line 137:
apiBaseUrl = 'http://localhost:5001/YOUR_PROJECT/us-central1';
```

## Customer Portal

The customer portal allows users to:

- ✅ Update payment methods
- ✅ View invoices
- ✅ Cancel subscription
- ✅ Update billing info

Access from success page or implement a "Manage Subscription" button:

```html
<form action="/createPortalSession" method="POST">
  <input type="hidden" name="session_id" value="CHECKOUT_SESSION_ID" />
  <button type="submit">Manage Subscription</button>
</form>
```

## Webhook Integration

Use the same webhook handler from the embedded checkout integration:

```bash
# Set webhook URL in Stripe Dashboard
https://YOUR_REGION-YOUR_PROJECT.cloudfunctions.net/stripeWebhook

# Listen for these events:
- checkout.session.completed
- customer.subscription.created
- customer.subscription.updated
- customer.subscription.deleted
- invoice.payment_succeeded
- invoice.payment_failed
```

## Comparison: Prebuilt vs Embedded

| Feature | Prebuilt Checkout | Embedded Checkout |
|---------|-------------------|-------------------|
| Implementation | Simpler | More complex |
| Customization | Limited | Full control |
| Hosting | Stripe-hosted | Your domain |
| PCI Compliance | Automatic | Automatic |
| Mobile Support | Excellent | Excellent |
| Branding | Stripe defaults | Custom styles |

## Troubleshooting

### Checkout redirects to error page

- Verify price/lookup_key exists
- Check function logs for errors
- Ensure CORS is configured

### Success page doesn't load

- Check session_id in URL
- Verify checkoutSessionDetails endpoint
- Check browser console for errors

### Portal button doesn't work

- Ensure session_id is set correctly
- Verify customer exists in Stripe
- Check function deployment

## Production Checklist

- [ ] Create products with live prices
- [ ] Update lookup_keys in HTML
- [ ] Deploy functions to production
- [ ] Update function URLs in HTML
- [ ] Deploy hosting
- [ ] Test with live payment method
- [ ] Configure webhook endpoint
- [ ] Set up monitoring/alerts
- [ ] Test customer portal
- [ ] Verify email receipts

## Next Steps

1. Customize the pricing page design
2. Add multiple pricing tiers
3. Implement usage-based billing
4. Add promotion codes
5. Set up subscription trials
6. Configure dunning management
7. Add analytics tracking

## Support Resources

- [Stripe Checkout Docs](https://stripe.com/docs/payments/checkout)
- [Customer Portal Docs](https://stripe.com/docs/billing/subscriptions/integrating-customer-portal)
- [Test Cards](https://stripe.com/docs/testing)
- Main integration guide: `docs/stripe-subscriptions-integration.md`
