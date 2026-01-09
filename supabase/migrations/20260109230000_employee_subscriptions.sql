-- Add per-employee subscription tracking
-- Migration: Employee-based subscriptions instead of tier-based

-- Add subscription fields to deployed_employees table
ALTER TABLE public.deployed_employees 
ADD COLUMN IF NOT EXISTS subscription_status VARCHAR(50) DEFAULT 'trial',
ADD COLUMN IF NOT EXISTS subscription_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS polar_product_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS subscription_ends_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS monthly_cost DECIMAL(10,2);

-- Index for subscription lookups
CREATE INDEX IF NOT EXISTS idx_deployed_employees_subscription 
ON public.deployed_employees(user_id, subscription_status);

CREATE INDEX IF NOT EXISTS idx_deployed_employees_polar_sub
ON public.deployed_employees(subscription_id) WHERE subscription_id IS NOT NULL;

-- Create employee_subscriptions table for detailed tracking
CREATE TABLE IF NOT EXISTS public.employee_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  deployed_employee_id UUID REFERENCES public.deployed_employees(id) ON DELETE CASCADE,
  employee_template_id VARCHAR(100) NOT NULL,
  polar_subscription_id VARCHAR(255) UNIQUE,
  polar_product_id VARCHAR(255) NOT NULL,
  polar_customer_id VARCHAR(255),
  status VARCHAR(50) NOT NULL, -- 'active', 'canceled', 'past_due', 'trialing', 'paused'
  monthly_price DECIMAL(10,2) NOT NULL,
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  trial_ends_at TIMESTAMPTZ,
  canceled_at TIMESTAMPTZ,
  cancel_reason TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.employee_subscriptions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "Users can view own employee subscriptions" ON public.employee_subscriptions;
CREATE POLICY "Users can view own employee subscriptions" 
ON public.employee_subscriptions
FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own employee subscriptions" ON public.employee_subscriptions;
CREATE POLICY "Users can insert own employee subscriptions" 
ON public.employee_subscriptions
FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own employee subscriptions" ON public.employee_subscriptions;
CREATE POLICY "Users can update own employee subscriptions" 
ON public.employee_subscriptions
FOR UPDATE USING (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_employee_subscriptions_user 
ON public.employee_subscriptions(user_id);

CREATE INDEX IF NOT EXISTS idx_employee_subscriptions_status 
ON public.employee_subscriptions(user_id, status);

CREATE INDEX IF NOT EXISTS idx_employee_subscriptions_polar_id
ON public.employee_subscriptions(polar_subscription_id) WHERE polar_subscription_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_employee_subscriptions_template
ON public.employee_subscriptions(user_id, employee_template_id);

-- Add comment explaining the migration
COMMENT ON TABLE public.employee_subscriptions IS 
'Tracks individual AI employee subscriptions. Each employee is billed monthly via Polar.sh';

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_employee_subscriptions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS employee_subscriptions_updated_at ON public.employee_subscriptions;
CREATE TRIGGER employee_subscriptions_updated_at
  BEFORE UPDATE ON public.employee_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_employee_subscriptions_updated_at();

-- Migration note: Old tier-based subscriptions (pro/enterprise) are being phased out
-- Users will now subscribe to individual AI employees at their specific monthly rates
