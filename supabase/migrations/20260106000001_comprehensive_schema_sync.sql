-- =====================================================
-- Comprehensive Schema Sync Migration
-- Fixes all mismatches between frontend/edge functions and database
-- Run: January 6, 2026
-- =====================================================

-- =====================================================
-- 1. Fix deployed_employees Table
-- Edge function tries to insert: template_id, category, deployment_plan
-- These columns are missing from the production schema
-- =====================================================

-- Add template_id column (stores the string ID from frontend templates like "marketing-pro")
ALTER TABLE public.deployed_employees 
ADD COLUMN IF NOT EXISTS template_id VARCHAR(100);

-- Add category column for the AI employee category
ALTER TABLE public.deployed_employees 
ADD COLUMN IF NOT EXISTS category VARCHAR(100);

-- Add deployment_plan column for AI-generated deployment plans
ALTER TABLE public.deployed_employees 
ADD COLUMN IF NOT EXISTS deployment_plan TEXT;

-- Make employee_id nullable since we're transitioning to template_id
-- First drop the NOT NULL constraint if it exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'deployed_employees' 
    AND column_name = 'employee_id'
    AND is_nullable = 'NO'
  ) THEN
    ALTER TABLE public.deployed_employees 
    ALTER COLUMN employee_id DROP NOT NULL;
  END IF;
END $$;

-- Set a default for employee_id for existing records
ALTER TABLE public.deployed_employees 
ALTER COLUMN employee_id SET DEFAULT gen_random_uuid();

COMMENT ON COLUMN public.deployed_employees.template_id IS 'The string ID from frontend AI employee templates (e.g., marketing-pro)';
COMMENT ON COLUMN public.deployed_employees.category IS 'Category of the AI employee (e.g., Marketing, Sales, Support)';
COMMENT ON COLUMN public.deployed_employees.deployment_plan IS 'AI-generated deployment plan for this employee';

-- =====================================================
-- 2. Fix deployment_requests Table  
-- Frontend passes template_id (string) but employee_id is required as UUID
-- =====================================================

-- Make employee_id nullable since frontend uses template_id
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'deployment_requests' 
    AND column_name = 'employee_id'
    AND is_nullable = 'NO'
  ) THEN
    ALTER TABLE public.deployment_requests 
    ALTER COLUMN employee_id DROP NOT NULL;
  END IF;
END $$;

-- Add template_id column for the string template ID from frontend
ALTER TABLE public.deployment_requests 
ADD COLUMN IF NOT EXISTS template_id VARCHAR(100);

-- Add completed_at column for when deployment completes
ALTER TABLE public.deployment_requests 
ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;

-- Add deployed_employee_id to link to the created deployed_employee
ALTER TABLE public.deployment_requests 
ADD COLUMN IF NOT EXISTS deployed_employee_id UUID REFERENCES public.deployed_employees(id);

-- Add error_message column for failed deployments
ALTER TABLE public.deployment_requests 
ADD COLUMN IF NOT EXISTS error_message TEXT;

-- Add updated_at column
ALTER TABLE public.deployment_requests 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

COMMENT ON COLUMN public.deployment_requests.template_id IS 'The string ID from frontend AI employee templates';
COMMENT ON COLUMN public.deployment_requests.deployed_employee_id IS 'Reference to the deployed employee after successful deployment';

-- =====================================================
-- 3. Fix business_profiles Table
-- Frontend uses target_audience, website_url but DB has different column names
-- =====================================================

-- Add target_audience column
ALTER TABLE public.business_profiles 
ADD COLUMN IF NOT EXISTS target_audience TEXT;

-- Add website_url column (alternative to 'website')
ALTER TABLE public.business_profiles 
ADD COLUMN IF NOT EXISTS website_url TEXT;

COMMENT ON COLUMN public.business_profiles.target_audience IS 'Description of the target audience for the business';
COMMENT ON COLUMN public.business_profiles.website_url IS 'Full URL of the business website';

-- =====================================================
-- 4. Fix agent_tasks Table
-- Edge function inserts task_type and deployed_employee_id
-- =====================================================

-- Add task_type column
ALTER TABLE public.agent_tasks 
ADD COLUMN IF NOT EXISTS task_type VARCHAR(100);

-- Add deployed_employee_id column
ALTER TABLE public.agent_tasks 
ADD COLUMN IF NOT EXISTS deployed_employee_id UUID REFERENCES public.deployed_employees(id);

-- Backfill action from task_type if action is null
UPDATE public.agent_tasks 
SET action = task_type 
WHERE action IS NULL AND task_type IS NOT NULL;

COMMENT ON COLUMN public.agent_tasks.task_type IS 'Type of task (initialization, automation, etc.)';
COMMENT ON COLUMN public.agent_tasks.deployed_employee_id IS 'Reference to the deployed employee executing this task';

-- =====================================================
-- 5. Add indexes for new columns
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_deployed_employees_template_id 
  ON public.deployed_employees(template_id);

CREATE INDEX IF NOT EXISTS idx_deployed_employees_category 
  ON public.deployed_employees(category);

CREATE INDEX IF NOT EXISTS idx_deployment_requests_template_id 
  ON public.deployment_requests(template_id);

CREATE INDEX IF NOT EXISTS idx_agent_tasks_deployed_employee 
  ON public.agent_tasks(deployed_employee_id);

CREATE INDEX IF NOT EXISTS idx_agent_tasks_task_type 
  ON public.agent_tasks(task_type);

-- =====================================================
-- 6. Update RLS policies if needed
-- =====================================================

-- Ensure deployed_employees has proper RLS
ALTER TABLE public.deployed_employees ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own deployed employees" ON public.deployed_employees;
CREATE POLICY "Users can view own deployed employees" ON public.deployed_employees
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own deployed employees" ON public.deployed_employees;
CREATE POLICY "Users can insert own deployed employees" ON public.deployed_employees
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own deployed employees" ON public.deployed_employees;
CREATE POLICY "Users can update own deployed employees" ON public.deployed_employees
  FOR UPDATE USING (auth.uid() = user_id);

-- Service role bypass for edge functions
DROP POLICY IF EXISTS "Service role full access to deployed_employees" ON public.deployed_employees;
CREATE POLICY "Service role full access to deployed_employees" ON public.deployed_employees
  FOR ALL USING (auth.role() = 'service_role');

-- =====================================================
-- 7. Create updated_at trigger for deployment_requests
-- =====================================================

CREATE OR REPLACE FUNCTION public.update_deployment_requests_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_deployment_requests_updated_at ON public.deployment_requests;
CREATE TRIGGER update_deployment_requests_updated_at
  BEFORE UPDATE ON public.deployment_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.update_deployment_requests_updated_at();
