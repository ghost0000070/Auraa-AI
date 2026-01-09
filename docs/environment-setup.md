# Environment Variables Setup Guide

This document provides comprehensive instructions for configuring environment variables across all platforms used by Auraa AI.

## Quick Reference

| Platform | Configuration Location |
|----------|----------------------|
| Local Development | `.env` file |
| VS Code | `.vscode/settings.json` (for extensions) |
| GitHub Actions | Repository Settings > Secrets and variables > Actions |
| Vercel | Project Settings > Environment Variables |
| Supabase Edge Functions | Project Settings > Edge Functions > Secrets |
| Resend | Dashboard > API Keys |

---

## 1. Local Development (.env)

Copy `.env.example` to `.env` and fill in your values.

### Required Variables

```bash
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Owner Configuration (admin access)
VITE_OWNER_EMAIL=your_email@example.com
VITE_OWNER_UID=your_supabase_user_id

# Polar.sh (subscriptions)
VITE_POLAR_ACCESS_TOKEN=polar_oat_xxx

# Agent Worker (server-side only)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### Optional Variables

```bash
VITE_ENABLE_ANALYTICS=true
VITE_API_RATE_LIMIT=100
VITE_SENTRY_DSN=your_sentry_dsn
VITE_SENTRY_ENVIRONMENT=production
```

---

## 2. GitHub Actions Secrets

Navigate to: **Repository > Settings > Secrets and variables > Actions > New repository secret**

### Required Secrets

| Secret Name | Description | Example |
|-------------|-------------|---------|
| `VITE_SUPABASE_URL` | Supabase project URL | `https://xxx.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | Supabase anon/public key | `eyJhbG...` |
| `VITE_OWNER_EMAIL` | Admin email | `admin@example.com` |
| `VITE_OWNER_UID` | Admin Supabase user ID | `uuid-string` |
| `VITE_POLAR_ACCESS_TOKEN` | Polar.sh API token | `polar_oat_xxx` |
| `VERCEL_TOKEN` | Vercel deployment token | `xxx` |
| `VERCEL_ORG_ID` | Vercel organization ID | `team_xxx` |
| `VERCEL_PROJECT_ID` | Vercel project ID | `prj_xxx` |

### How to Get These Values

1. **VITE_SUPABASE_URL & VITE_SUPABASE_ANON_KEY**
   - Supabase Dashboard > Settings > API > Project URL & anon/public key

2. **VITE_OWNER_UID**
   - Supabase Dashboard > Authentication > Users > Copy user ID

3. **VERCEL_TOKEN**
   - Vercel Dashboard > Settings > Tokens > Create

4. **VERCEL_ORG_ID & VERCEL_PROJECT_ID**
   - Run `vercel link` in project, or check `.vercel/project.json`

---

## 3. Vercel Environment Variables

Navigate to: **Vercel Dashboard > [Project] > Settings > Environment Variables**

### Required Variables

| Variable Name | Value Reference | Environments |
|---------------|-----------------|--------------|
| `supabase-url` | Your Supabase URL | Production, Preview |
| `supabase-anon-key` | Supabase anon key | Production, Preview |
| `polar-access-token` | Polar API token | Production, Preview |
| `owner-email` | Admin email | Production, Preview |
| `owner-uid` | Admin user ID | Production, Preview |

> **Note:** Vercel uses `@variable-name` syntax in `vercel.json`. Create variables without the `@` prefix in the dashboard.

---

## 4. Supabase Edge Function Secrets

Navigate to: **Supabase Dashboard > [Project] > Edge Functions > Manage Secrets**

### Required Secrets

| Secret Name | Description |
|-------------|-------------|
| `SUPABASE_URL` | Auto-provided |
| `SUPABASE_ANON_KEY` | Auto-provided |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key for full DB access |
| `POLAR_ACCESS_TOKEN` | Polar.sh API token |
| `POLAR_WEBHOOK_SECRET` | Polar webhook signature secret |
| `POLAR_PRO_PRODUCT_ID` | Pro tier product ID from Polar |
| `POLAR_ENTERPRISE_PRODUCT_ID` | Enterprise tier product ID from Polar |
| `POLAR_ORGANIZATION_ID` | Polar organization ID |
| `INTEGRATION_RSA_PUBLIC_KEY` | RSA public key for encryption |
| `INTEGRATION_RSA_PRIVATE_KEY` | RSA private key for decryption |
| `EMAIL_SERVICE` | Email provider: `resend`, `sendgrid`, or `smtp` |
| `EMAIL_API_KEY` | Email service API key |
| `EMAIL_FROM_ADDRESS` | Sender email address |
| `EMAIL_FROM_NAME` | Sender display name |

### Setting Secrets via CLI

```bash
# Set a single secret
supabase secrets set POLAR_ACCESS_TOKEN=polar_oat_xxx

# Set multiple secrets
supabase secrets set \
  POLAR_WEBHOOK_SECRET=xxx \
  POLAR_PRO_PRODUCT_ID=xxx \
  POLAR_ENTERPRISE_PRODUCT_ID=xxx

# Set multi-line secrets (RSA keys)
supabase secrets set INTEGRATION_RSA_PRIVATE_KEY="$(cat private.pem)"
```

---

## 5. Resend Configuration

Navigate to: **Resend Dashboard > API Keys**

### Setup Steps

1. **Create API Key**
   - Go to https://resend.com/api-keys
   - Click "Create API Key"
   - Name it (e.g., "Auraa AI Production")
   - Copy the key (starts with `re_`)

2. **Verify Domain** (recommended)
   - Go to https://resend.com/domains
   - Add your domain
   - Add the required DNS records
   - Wait for verification

3. **Configure in Supabase**
   ```bash
   supabase secrets set \
     EMAIL_SERVICE=resend \
     EMAIL_API_KEY=re_xxx \
     EMAIL_FROM_ADDRESS=noreply@yourdomain.com \
     EMAIL_FROM_NAME="Auraa AI"
   ```

---

## 6. RSA Key Generation

For integration credential encryption:

```bash
# Generate private key
openssl genrsa -out private.pem 2048

# Extract public key
openssl rsa -in private.pem -pubout -out public.pem

# View keys
cat private.pem
cat public.pem
```

**Important:** 
- Keep `private.pem` secure (only in Supabase secrets)
- `public.pem` can be in the edge function or secrets

---

## 7. Polar.sh Configuration

Navigate to: **Polar Dashboard > Settings**

### Setup Steps

1. **Get Access Token**
   - Settings > Personal Access Tokens > Create
   - Copy token (starts with `polar_oat_`)

2. **Get Organization ID**
   - Settings > Organization > Copy ID

3. **Get Product IDs**
   - Products > Select product > Copy ID from URL

4. **Configure Webhook**
   - Webhooks > Add Endpoint
   - URL: `https://your-project.supabase.co/functions/v1/polar-webhook`
   - Events: All subscription and order events
   - Copy the signing secret

---

## 8. Autonomous Employee Loop (Vercel Cron)

The platform includes an automated background loop that processes all active AI employees every 5 minutes. This runs automatically via Vercel Cron - no user setup required.

### How It Works

1. **Vercel Cron** triggers `/api/autonomous-loop` every 5 minutes
2. The API route calls the `autonomous-loop` Supabase Edge Function
3. The edge function processes all active employees in `deployed_employees` table
4. Each employee decides what to do based on their role and business context
5. Actions and insights are stored in `autonomous_actions` and `business_insights` tables

### Required Vercel Environment Variables

| Variable Name | Description |
|---------------|-------------|
| `SUPABASE_URL` | Your Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key for backend access |
| `CRON_SECRET` | (Optional) Secret to verify cron requests |

### Setup in Vercel Dashboard

1. Go to **Project Settings > Environment Variables**
2. Add `SUPABASE_SERVICE_ROLE_KEY` with your service role key
3. (Optional) Add `CRON_SECRET` for additional security

### Verifying the Loop

- Check Vercel Functions logs for `/api/autonomous-loop`
- Check Supabase Edge Function logs: `supabase functions logs autonomous-loop`
- View activity in Dashboard > Activity tab

---

## 9. Verification Checklist

After configuration, verify each platform:

### Local Development
```bash
npm run dev
# Check console for missing env errors
```

### GitHub Actions
```bash
# Trigger a workflow run and check logs
gh workflow run ci.yml
```

### Vercel
```bash
# Check deployment logs
vercel logs
```

### Supabase Edge Functions
```bash
# Check function logs
supabase functions logs agent-run
```

---

## Troubleshooting

### Common Issues

1. **"Missing Supabase environment variables"**
   - Check `.env` file exists and has correct values
   - Restart dev server after changes

2. **GitHub Actions failing**
   - Verify all secrets are set in repository settings
   - Check secret names match exactly (case-sensitive)

3. **Vercel build failing**
   - Check Environment Variables in project settings
   - Verify variable names match `vercel.json` references

4. **Edge functions not working**
   - Run `supabase secrets list` to verify secrets
   - Check function logs: `supabase functions logs <function-name>`

5. **Emails not sending**
   - Verify Resend API key is valid
   - Check domain is verified in Resend dashboard
   - Test with Resend's test endpoint first

6. **Autonomous loop not running**
   - Verify `SUPABASE_SERVICE_ROLE_KEY` is set in Vercel
   - Check Vercel Cron logs in dashboard
   - Ensure at least one employee is deployed with status='active'
   - Verify business profile exists for the user

7. **Employees not taking actions**
   - Check `business_profiles` table has a profile for the user
   - Verify `deployed_employees` has status='active'
   - Check `autonomous-loop` function logs for errors
