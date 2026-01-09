-- Add Polar subscription tracking to user_powerups table
-- This allows us to link powerup subscriptions to Polar for billing

ALTER TABLE public.user_powerups 
  ADD COLUMN IF NOT EXISTS polar_subscription_id VARCHAR(255),
  ADD COLUMN IF NOT EXISTS polar_product_id VARCHAR(255),
  ADD COLUMN IF NOT EXISTS price_cents INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS billing_period VARCHAR(20) DEFAULT 'monthly';

-- Create index for faster lookups by polar subscription
CREATE INDEX IF NOT EXISTS idx_user_powerups_polar_sub 
  ON public.user_powerups(polar_subscription_id);

-- Add unique constraint for user + powerup combination
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'user_powerups_user_powerup_unique'
  ) THEN
    ALTER TABLE public.user_powerups 
      ADD CONSTRAINT user_powerups_user_powerup_unique UNIQUE (user_id, powerup_id);
  END IF;
END $$;
