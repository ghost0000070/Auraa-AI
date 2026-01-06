-- =====================================================
-- Fix template_id Column Type
-- The base schema created template_id as UUID, but we need VARCHAR
-- to store string IDs like "marketing-pro", "sales-sidekick"
-- =====================================================

-- 1. Fix deployed_employees.template_id
-- First, drop the UUID column and add VARCHAR version
DO $$
BEGIN
  -- Check if template_id is UUID type
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'deployed_employees' 
    AND column_name = 'template_id'
    AND data_type = 'uuid'
  ) THEN
    -- Drop the UUID column
    ALTER TABLE public.deployed_employees DROP COLUMN template_id;
    -- Add as VARCHAR
    ALTER TABLE public.deployed_employees ADD COLUMN template_id VARCHAR(100);
  END IF;
END $$;

-- 2. Fix deployment_requests.template_id
DO $$
BEGIN
  -- Check if template_id is UUID type
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'deployment_requests' 
    AND column_name = 'template_id'
    AND data_type = 'uuid'
  ) THEN
    -- Drop the UUID column
    ALTER TABLE public.deployment_requests DROP COLUMN template_id;
    -- Add as VARCHAR
    ALTER TABLE public.deployment_requests ADD COLUMN template_id VARCHAR(100);
  END IF;
END $$;

-- Add comments
COMMENT ON COLUMN public.deployed_employees.template_id IS 'String ID from frontend templates (e.g., marketing-pro)';
COMMENT ON COLUMN public.deployment_requests.template_id IS 'String ID from frontend templates (e.g., marketing-pro)';
