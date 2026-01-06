-- =====================================================
-- Frontend/Backend Sync Fixes
-- Fixes NOT NULL constraints that cause edge function failures
-- =====================================================

-- =====================================================
-- 1. Fix website_integrations table
-- Make 'name' column nullable since frontend doesn't always provide it
-- Add 'last_scraped_at' column that frontend expects
-- =====================================================

-- Make name column nullable (frontend doesn't always provide it)
ALTER TABLE public.website_integrations 
ALTER COLUMN name DROP NOT NULL;

-- Set a default value for name
ALTER TABLE public.website_integrations 
ALTER COLUMN name SET DEFAULT 'Website Integration';

-- Add last_scraped_at column that frontend expects
ALTER TABLE public.website_integrations 
ADD COLUMN IF NOT EXISTS last_scraped_at TIMESTAMPTZ;

COMMENT ON COLUMN public.website_integrations.last_scraped_at IS 'Timestamp of the last successful scrape';

-- =====================================================
-- 2. Fix deployed_employees table
-- Make 'role' column have a default since edge function doesn't provide it
-- =====================================================

-- Set default for role column
ALTER TABLE public.deployed_employees 
ALTER COLUMN role SET DEFAULT 'AI Employee';

-- Make role nullable for flexibility
ALTER TABLE public.deployed_employees 
ALTER COLUMN role DROP NOT NULL;

-- =====================================================
-- 3. Fix agent_tasks table  
-- Make 'title' column have a default since edge function only provides description
-- =====================================================

-- Set default for title column
ALTER TABLE public.agent_tasks 
ALTER COLUMN title SET DEFAULT 'Task';

-- Make title nullable for flexibility
ALTER TABLE public.agent_tasks 
ALTER COLUMN title DROP NOT NULL;
