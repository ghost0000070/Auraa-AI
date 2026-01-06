-- =====================================================
-- Employee Subscriptions Table
-- Tracks individual AI employee subscriptions per user
-- =====================================================

CREATE TABLE IF NOT EXISTS public.employee_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  employee_template_id VARCHAR(100) NOT NULL, -- e.g., "marketing-pro", "sales-sidekick"
  employee_name VARCHAR(255) NOT NULL,
  
  -- Subscription state
  status VARCHAR(50) DEFAULT 'active', -- 'active', 'canceled', 'past_due', 'trial'
  is_trial BOOLEAN DEFAULT true, -- True during intro period
  trial_ends_at TIMESTAMPTZ, -- When trial/intro period ends
  
  -- Polar subscription info
  polar_subscription_id VARCHAR(255), -- Individual employee subscription ID
  polar_product_id VARCHAR(255), -- Polar product ID for this employee
  polar_checkout_id VARCHAR(255), -- Checkout session that created this
  
  -- Pricing
  monthly_price INTEGER NOT NULL, -- Price in cents (e.g., 9900 = $99)
  
  -- Timestamps
  subscribed_at TIMESTAMPTZ DEFAULT now(),
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  canceled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  -- Unique constraint: one subscription per employee per user
  UNIQUE(user_id, employee_template_id)
);

-- Enable RLS
ALTER TABLE public.employee_subscriptions ENABLE ROW LEVEL SECURITY;

-- Policies
DROP POLICY IF EXISTS "Users can view own employee subscriptions" ON public.employee_subscriptions;
CREATE POLICY "Users can view own employee subscriptions" ON public.employee_subscriptions
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own employee subscriptions" ON public.employee_subscriptions;
CREATE POLICY "Users can insert own employee subscriptions" ON public.employee_subscriptions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Service role can manage all employee subscriptions" ON public.employee_subscriptions;
CREATE POLICY "Service role can manage all employee subscriptions" ON public.employee_subscriptions
  FOR ALL USING (true);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_employee_subscriptions_user_status 
  ON public.employee_subscriptions(user_id, status);

CREATE INDEX IF NOT EXISTS idx_employee_subscriptions_polar_sub 
  ON public.employee_subscriptions(polar_subscription_id);

-- Trigger for updated_at
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
  FOR EACH ROW EXECUTE FUNCTION update_employee_subscriptions_updated_at();

-- =====================================================
-- Update users table to track intro subscription
-- =====================================================
ALTER TABLE public.users 
  ADD COLUMN IF NOT EXISTS intro_subscription_started_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS intro_subscription_ends_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS intro_subscription_used BOOLEAN DEFAULT false;
