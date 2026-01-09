# Per-Employee Monthly Subscription Setup Guide

## Overview
This guide walks you through transitioning from tier-based pricing (Pro/Enterprise) to per-employee monthly subscriptions in Polar.sh.

---

## Part 1: Polar.sh Setup (Payment Provider Configuration)

### Step 1: Access Your Polar Dashboard
1. Go to https://polar.sh/dashboard
2. Sign in with your Polar account
3. Navigate to your organization: **Auraa AI** (or your org name)

### Step 2: Create Employee Subscription Products

You currently have 8 AI employees defined in `src/config/constants.ts`. Each needs a Polar product:

#### Products to Create:

1. **Marketing Pro** - $99/month
   - Navigate to: Products → Create New Product
   - Name: `Marketing Pro AI Employee`
   - Description: `Analyzes campaigns, writes copy, optimizes funnels`
   - Type: **Subscription**
   - Billing Interval: **Monthly**
   - Price: **$99 USD**
   - Click **Create Product**
   - **Copy the Product ID** (format: `prod_xxxxxxxxxxxxx`)

2. **Sales Sidekick** - $129/month
   - Name: `Sales Sidekick AI Employee`
   - Description: `Automates outreach, surfaces hot leads, drafts follow-ups`
   - Type: **Subscription**
   - Billing Interval: **Monthly**
   - Price: **$129 USD**
   - **Copy the Product ID**

3. **Support Sentinel** - $79/month
   - Name: `Support Sentinel AI Employee`
   - Description: `24/7 customer support automation`
   - Type: **Subscription**
   - Billing Interval: **Monthly**
   - Price: **$79 USD**
   - **Copy the Product ID**

4. **Business Analyst** - $149/month
   - Name: `Business Analyst AI Employee`
   - Description: `Advanced data analysis and insights`
   - Type: **Subscription**
   - Billing Interval: **Monthly**
   - Price: **$149 USD**
   - **Copy the Product ID**

5. **Dev Companion** - $119/month
   - Name: `Dev Companion AI Employee`
   - Description: `Code reviews, documentation, debugging assistance`
   - Type: **Subscription**
   - Billing Interval: **Monthly**
   - Price: **$119 USD**
   - **Copy the Product ID**

6. **Operations Orchestrator** - $99/month
   - Name: `Operations Orchestrator AI Employee`
   - Description: `Workflow automation and process optimization`
   - Type: **Subscription**
   - Billing Interval: **Monthly**
   - Price: **$99 USD**
   - **Copy the Product ID**

7. **Security Analyst** - $159/month
   - Name: `Security Analyst AI Employee`
   - Description: `Security monitoring and threat analysis`
   - Type: **Subscription**
   - Billing Interval: **Monthly**
   - Price: **$159 USD**
   - **Copy the Product ID**

8. **AI Team Orchestrator** - $179/month
   - Name: `AI Team Orchestrator AI Employee`
   - Description: `Coordinates multiple AI employees for complex workflows`
   - Type: **Subscription**
   - Billing Interval: **Monthly**
   - Price: **$179 USD**
   - **Copy the Product ID**

### Step 3: Update Environment Variables

After creating all products, update your Supabase Edge Functions secrets:

```bash
# Run these commands from your project root
cd /home/ghost/VS_code_Projects/Auraa-AI

# Set each product ID (replace xxx with actual IDs from Polar)
supabase secrets set POLAR_MARKETING_PRO_ID=prod_xxxxxxxxxxxxx
supabase secrets set POLAR_SALES_SIDEKICK_ID=prod_xxxxxxxxxxxxx
supabase secrets set POLAR_SUPPORT_SENTINEL_ID=prod_xxxxxxxxxxxxx
supabase secrets set POLAR_BUSINESS_ANALYST_ID=prod_xxxxxxxxxxxxx
supabase secrets set POLAR_DEV_COMPANION_ID=prod_xxxxxxxxxxxxx
supabase secrets set POLAR_OPERATIONS_ID=prod_xxxxxxxxxxxxx
supabase secrets set POLAR_SECURITY_ANALYST_ID=prod_xxxxxxxxxxxxx
supabase secrets set POLAR_TEAM_ORCHESTRATOR_ID=prod_xxxxxxxxxxxxx
```

### Step 4: Verify Webhook Setup

Make sure your Polar webhook is configured:
1. In Polar Dashboard → Settings → Webhooks
2. Webhook URL should be: `https://iupgzyloawweklvbyjlx.supabase.co/functions/v1/polar-webhook`
3. Events to subscribe to:
   - `checkout.created`
   - `checkout.updated`
   - `order.created`
   - `subscription.created`
   - `subscription.updated`
   - `subscription.canceled`

---

## Part 2: Code Updates (Already Configured!)

Good news: Your codebase already has the infrastructure for per-employee subscriptions!

### What's Already Working:

1. **Employee Products Defined** (`src/config/constants.ts`):
   ```typescript
   export const EMPLOYEE_POLAR_PRODUCTS: Record<string, string> = {
     'marketing-pro': 'de3ed2d2-27f3-4573-834f-7290784ab0ab',
     'sales-sidekick': 'bfb616c0-d573-41fc-9421-bc1872672e78',
     // ... etc
   }
   ```

2. **Employee Prices** (`src/config/constants.ts`):
   ```typescript
   export const EMPLOYEE_PRICES: Record<string, number> = {
     'marketing-pro': 99,
     'sales-sidekick': 129,
     // ... etc
   }
   ```

3. **Database Schema** (`deployed_employees` table):
   - Already tracks which employees each user has deployed
   - Has `user_id`, `template_id`, `status` fields
   - Supports per-employee subscription tracking

### What Needs to Change:

The main update is removing the old tier-based system. Here's what to update:

---

## Part 3: Required Code Changes

### Change 1: Update `constants.ts` Product IDs

Replace the placeholder IDs with your actual Polar product IDs:

**File:** `src/config/constants.ts`

```typescript
// Update this section with your actual Product IDs from Polar
export const EMPLOYEE_POLAR_PRODUCTS: Record<string, string> = {
  'marketing-pro': 'prod_REPLACE_WITH_ACTUAL_ID',        // $99/mo
  'sales-sidekick': 'prod_REPLACE_WITH_ACTUAL_ID',       // $129/mo
  'support-sentinel': 'prod_REPLACE_WITH_ACTUAL_ID',     // $79/mo
  'business-analyst': 'prod_REPLACE_WITH_ACTUAL_ID',     // $149/mo
  'dev-companion': 'prod_REPLACE_WITH_ACTUAL_ID',        // $119/mo
  'operations-orchestrator': 'prod_REPLACE_WITH_ACTUAL_ID', // $99/mo
  'security-analyst': 'prod_REPLACE_WITH_ACTUAL_ID',     // $159/mo
  'ai-team-orchestrator': 'prod_REPLACE_WITH_ACTUAL_ID', // $179/mo
};
```

### Change 2: Add Database Migration for Employee Subscriptions

Create a new migration to track per-employee subscriptions:

**File:** `supabase/migrations/YYYYMMDDHHMMSS_employee_subscriptions.sql`

```sql
-- Add subscription tracking to deployed_employees table
ALTER TABLE public.deployed_employees 
ADD COLUMN IF NOT EXISTS subscription_status VARCHAR(50) DEFAULT 'trial',
ADD COLUMN IF NOT EXISTS subscription_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS polar_product_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS subscription_ends_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS monthly_cost DECIMAL(10,2);

-- Index for subscription lookups
CREATE INDEX IF NOT EXISTS idx_deployed_employees_subscription 
ON public.deployed_employees(user_id, subscription_status);

-- Add table for employee subscription events
CREATE TABLE IF NOT EXISTS public.employee_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  deployed_employee_id UUID REFERENCES public.deployed_employees(id) ON DELETE CASCADE,
  employee_template_id VARCHAR(100) NOT NULL,
  polar_subscription_id VARCHAR(255) UNIQUE,
  polar_product_id VARCHAR(255) NOT NULL,
  status VARCHAR(50) NOT NULL, -- 'active', 'canceled', 'past_due', 'trialing'
  monthly_price DECIMAL(10,2) NOT NULL,
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  canceled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.employee_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own employee subscriptions" 
ON public.employee_subscriptions
FOR SELECT USING (auth.uid() = user_id);

CREATE INDEX idx_employee_subscriptions_user 
ON public.employee_subscriptions(user_id);

CREATE INDEX idx_employee_subscriptions_status 
ON public.employee_subscriptions(user_id, status);
```

### Change 3: Update Polar Webhook Handler

**File:** `supabase/functions/polar-webhook/index.ts`

Add employee subscription handling (around line 80):

```typescript
// Add to the switch statement in polar-webhook
case 'subscription.created':
case 'subscription.updated': {
  const subscription = data.attributes
  const productId = subscription.product_id
  
  // Check if this is an employee subscription
  const employeeTemplate = Object.entries(EMPLOYEE_POLAR_PRODUCTS)
    .find(([_, id]) => id === productId)?.[0]
  
  if (employeeTemplate) {
    // Handle employee subscription
    const { data: user } = await supabase
      .from('users')
      .select('id')
      .eq('polar_customer_id', subscription.customer_id)
      .single()
    
    if (user) {
      await supabase.from('employee_subscriptions').upsert({
        user_id: user.id,
        employee_template_id: employeeTemplate,
        polar_subscription_id: subscription.id,
        polar_product_id: productId,
        status: subscription.status,
        monthly_price: EMPLOYEE_PRICES[employeeTemplate],
        current_period_start: subscription.current_period_start,
        current_period_end: subscription.current_period_end,
        updated_at: new Date().toISOString()
      })
    }
  }
  break
}
```

---

## Part 4: Migration Strategy

### Option A: Hard Cutover (Recommended for New Platform)
1. Deprecate old Pro/Enterprise tiers immediately
2. All new users subscribe per-employee only
3. Existing tier users: grandfather them OR migrate them

### Option B: Dual Pricing (Transition Period)
1. Keep old tiers for existing customers
2. New customers only see per-employee pricing
3. Sunset old tiers after 90 days

### Recommended: Option A (Clean Break)

**Steps:**
1. Update all Product IDs in `constants.ts`
2. Run the database migration
3. Update homepage/pricing page to show employee marketplace
4. Remove old tier subscription buttons
5. Deploy to production

---

## Part 5: Testing Checklist

Before going live, test:

- [ ] Can browse employee marketplace
- [ ] Can click "Subscribe" on an employee
- [ ] Polar checkout opens with correct price
- [ ] After payment, webhook fires and updates database
- [ ] Employee shows as "active" in user's dashboard
- [ ] Can cancel subscription via Polar portal
- [ ] Webhook processes cancellation
- [ ] Employee shows as "canceled" in UI

---

## Part 6: Update Vercel Environment Variables

If using Vercel for frontend, update these:

```bash
vercel env add VITE_POLAR_ACCESS_TOKEN
# Paste your Polar access token

# Remove old product IDs (no longer needed)
vercel env rm VITE_POLAR_PRO_PRODUCT_ID
vercel env rm VITE_POLAR_ENTERPRISE_PRODUCT_ID
```

---

## Summary

**In Polar:**
1. Create 8 products (one per employee)
2. Copy each Product ID
3. Configure webhook endpoint

**In Supabase:**
1. Set secrets for all 8 product IDs
2. Run new migration for employee_subscriptions table

**In Code:**
1. Update `EMPLOYEE_POLAR_PRODUCTS` with real IDs
2. Remove old Pro/Enterprise tier logic
3. Update pricing page to show employee cards

**Deploy:**
1. Build: `npm run build`
2. Deploy to Vercel: `vercel deploy --prod`
3. Test a subscription end-to-end

---

## Questions?

- Polar docs: https://docs.polar.sh
- Supabase docs: https://supabase.com/docs
- This codebase already has most infrastructure ready!
