-- =====================================================
-- Schema Sync Fixes - Aligning Frontend and Backend
-- Run after all previous migrations
-- Addresses issues identified during frontend-backend audit
-- =====================================================

-- =====================================================
-- Fix user_analytics Table
-- Frontend expects event_type, page_path, event_data columns
-- =====================================================
ALTER TABLE public.user_analytics 
  ADD COLUMN IF NOT EXISTS event_type VARCHAR(100),
  ADD COLUMN IF NOT EXISTS page_path TEXT,
  ADD COLUMN IF NOT EXISTS event_data JSONB DEFAULT '{}'::jsonb;

-- Add index for event-based queries
CREATE INDEX IF NOT EXISTS idx_user_analytics_event_type 
  ON public.user_analytics(user_id, event_type, created_at DESC);

-- =====================================================
-- Fix business_profiles Table
-- Frontend expects brand_voice, business_data, is_default, is_active columns
-- =====================================================
ALTER TABLE public.business_profiles 
  ADD COLUMN IF NOT EXISTS brand_voice VARCHAR(100),
  ADD COLUMN IF NOT EXISTS business_data JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS is_default BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- =====================================================
-- Fix deployment_requests Table
-- Frontend expects business_name column
-- =====================================================
ALTER TABLE public.deployment_requests 
  ADD COLUMN IF NOT EXISTS business_name VARCHAR(255);

-- =====================================================
-- Fix agent_events Table
-- Frontend expects type, message, timestamp columns
-- Schema has event_type, payload, created_at
-- Add aliases/views or add the expected columns
-- =====================================================
ALTER TABLE public.agent_events 
  ADD COLUMN IF NOT EXISTS type VARCHAR(100),
  ADD COLUMN IF NOT EXISTS message TEXT,
  ADD COLUMN IF NOT EXISTS timestamp TIMESTAMPTZ DEFAULT now();

-- Backfill type from event_type if null
UPDATE public.agent_events 
SET type = event_type 
WHERE type IS NULL AND event_type IS NOT NULL;

-- Backfill timestamp from created_at if null
UPDATE public.agent_events 
SET timestamp = created_at 
WHERE timestamp IS NULL AND created_at IS NOT NULL;

-- Add index for timestamp-based queries
CREATE INDEX IF NOT EXISTS idx_agent_events_user_timestamp 
  ON public.agent_events(user_id, timestamp DESC);

-- =====================================================
-- Create increment_attempts RPC function
-- Used by agent-run edge function
-- =====================================================
CREATE OR REPLACE FUNCTION increment_attempts(row_id UUID)
RETURNS INTEGER AS $$
DECLARE
  new_attempts INTEGER;
BEGIN
  UPDATE public.agent_task_queue 
  SET attempts = attempts + 1 
  WHERE id = row_id 
  RETURNING attempts INTO new_attempts;
  RETURN COALESCE(new_attempts, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- Fix agent_tasks Table
-- Frontend expects 'action' column, schema has 'task_type'
-- =====================================================
ALTER TABLE public.agent_tasks 
  ADD COLUMN IF NOT EXISTS action VARCHAR(255);

-- Backfill action from task_type if it exists and action is null
-- Using DO block to check if column exists first
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'agent_tasks' 
    AND column_name = 'task_type'
  ) THEN
    UPDATE public.agent_tasks 
    SET action = task_type 
    WHERE action IS NULL AND task_type IS NOT NULL;
  END IF;
END $$;

-- =====================================================
-- Add missing index for action column
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_agent_tasks_action 
  ON public.agent_tasks(action);

-- =====================================================
-- Ensure ai_employees has template_key for string-based lookups
-- (Frontend templates use string IDs like 'marketing-pro')
-- =====================================================
ALTER TABLE public.ai_employees 
  ADD COLUMN IF NOT EXISTS template_key VARCHAR(100);

-- Add unique index for template_key lookups
CREATE UNIQUE INDEX IF NOT EXISTS idx_ai_employees_template_key 
  ON public.ai_employees(template_key) WHERE template_key IS NOT NULL;

-- =====================================================
-- Done!
-- =====================================================
SELECT 'Schema sync fixes applied successfully!' as result;
