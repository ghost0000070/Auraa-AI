# Edge Functions Deployment Guide

This guide covers deploying Supabase Edge Functions for Auraa-AI.

## Prerequisites

1. Install Supabase CLI:
```bash
npm install -g supabase
```

2. Login to Supabase:
```bash
supabase login
```

3. Link your project:
```bash
supabase link --project-ref your-project-ref
```

## Available Edge Functions

| Function | Description | Required Secrets |
|----------|-------------|------------------|
| `agent-run` | Executes agent tasks | None |
| `deploy-ai-employee` | Handles AI employee deployment | None |
| `generate-puter-script` | Generates Puter automation scripts | `OPENAI_API_KEY` (optional) |
| `integration-public-key` | Returns RSA public key for encryption | `INTEGRATION_RSA_PUBLIC_KEY` (optional) |
| `polar-webhook` | Handles Polar.sh payment webhooks | `POLAR_WEBHOOK_SECRET` |
| `polar-subscription-handler` | Manages subscriptions via Polar API | `POLAR_ACCESS_TOKEN` |
| `scrape-website` | Scrapes website content | None |
| `send-notification-email` | Sends email notifications | `EMAIL_SERVICE`, `EMAIL_API_KEY`, etc. |

## Setting Up Secrets

Before deploying, set the required secrets:

```bash
# Polar.sh Configuration
supabase secrets set POLAR_WEBHOOK_SECRET="your_webhook_secret"
supabase secrets set POLAR_ACCESS_TOKEN="your_access_token"
supabase secrets set POLAR_ORGANIZATION_ID="your_org_id"
supabase secrets set POLAR_PRO_PRODUCT_ID="your_pro_product_id"
supabase secrets set POLAR_ENTERPRISE_PRODUCT_ID="your_enterprise_product_id"

# RSA Encryption Keys (for secure credential storage)
supabase secrets set INTEGRATION_RSA_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----
...your private key...
-----END PRIVATE KEY-----"

supabase secrets set INTEGRATION_RSA_PUBLIC_KEY="-----BEGIN PUBLIC KEY-----
...your public key...
-----END PUBLIC KEY-----"

# Email Configuration (using Resend)
supabase secrets set EMAIL_SERVICE="resend"
supabase secrets set EMAIL_API_KEY="re_xxxxx"
supabase secrets set EMAIL_FROM_ADDRESS="noreply@yourdomain.com"
supabase secrets set EMAIL_FROM_NAME="Auraa AI"

# Optional: OpenAI for AI features
supabase secrets set OPENAI_API_KEY="sk-xxxxx"
```

## Generating RSA Key Pair

For secure integration credential storage:

```bash
# Generate private key
openssl genrsa -out private.pem 2048

# Extract public key
openssl rsa -in private.pem -pubout -out public.pem

# View keys (copy these to secrets)
cat private.pem
cat public.pem
```

## Deploying Functions

### Deploy All Functions

```bash
# Deploy all functions at once
supabase functions deploy
```

### Deploy Individual Functions

```bash
# Core agent functions
supabase functions deploy agent-run
supabase functions deploy deploy-ai-employee

# Integration functions
supabase functions deploy integration-public-key
supabase functions deploy scrape-website
supabase functions deploy generate-puter-script

# Payment/Subscription functions
supabase functions deploy polar-webhook
supabase functions deploy polar-subscription-handler

# Notification functions
supabase functions deploy send-notification-email
```

## Webhook Configuration

### Polar.sh Webhook

1. Go to your Polar.sh dashboard
2. Navigate to Settings → Webhooks
3. Add a new webhook:
   - **URL:** `https://your-project.supabase.co/functions/v1/polar-webhook`
   - **Events:** Select all subscription and order events
   - **Secret:** Use the same value as `POLAR_WEBHOOK_SECRET`

### Webhook Events Handled

The `polar-webhook` function handles these events:
- `checkout.created` - Checkout initiated
- `checkout.updated` - Checkout updated
- `order.created` - Payment successful
- `subscription.created` - New subscription
- `subscription.updated` - Subscription changed
- `subscription.canceled` - Subscription canceled

## Testing Functions

### Test Locally

```bash
# Start local Supabase
supabase start

# Serve functions locally
supabase functions serve

# In another terminal, call the function
curl -X POST http://localhost:54321/functions/v1/function-name \
  -H "Authorization: Bearer your-anon-key" \
  -H "Content-Type: application/json" \
  -d '{"test": "data"}'
```

### Test in Production

```bash
# Get your project URL and anon key from Supabase dashboard
curl -X POST https://your-project.supabase.co/functions/v1/send-notification-email \
  -H "Authorization: Bearer your-anon-key" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user-uuid",
    "type": "welcome",
    "data": {}
  }'
```

## Monitoring & Debugging

### View Function Logs

```bash
# View logs for a specific function
supabase functions logs polar-webhook

# Follow logs in real-time
supabase functions logs polar-webhook --follow
```

### Check Function Status

In Supabase Dashboard:
1. Go to Edge Functions
2. View deployment status, invocations, and errors
3. Check the logs for detailed debugging

## Common Issues

### 1. CORS Errors
All functions include CORS headers. If you still get CORS errors, ensure:
- Your frontend origin is allowed
- OPTIONS requests are handled

### 2. Authentication Failures
- Ensure you're passing the `Authorization` header with a valid JWT
- Check that the user has the required permissions

### 3. Webhook Signature Verification
- Ensure `POLAR_WEBHOOK_SECRET` matches your Polar dashboard
- Check that the raw body is used for verification (not parsed JSON)

### 4. Email Not Sending
- Verify `EMAIL_API_KEY` is correct
- Check the email service dashboard for delivery status
- Review function logs for error messages

## Security Best Practices

1. **Never commit secrets** - Use `supabase secrets set` for all sensitive values
2. **Validate all inputs** - All functions validate incoming data
3. **Use RLS** - Database queries respect Row Level Security
4. **Verify webhooks** - All webhook handlers verify signatures
5. **Rate limiting** - Consider adding rate limiting for public endpoints

## Updating Functions

When you modify a function:

```bash
# Redeploy the specific function
supabase functions deploy function-name

# Or redeploy all
supabase functions deploy
```

## Rollback

If a deployment causes issues:

1. Go to Supabase Dashboard → Edge Functions
2. Find the function
3. View deployment history
4. Rollback to a previous version if needed
