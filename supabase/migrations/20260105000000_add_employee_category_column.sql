-- Migration: Add employee_category column to deployment_requests table
-- This column was missing from the production schema

ALTER TABLE public.deployment_requests 
ADD COLUMN IF NOT EXISTS employee_category VARCHAR(100);

-- Add comment for documentation
COMMENT ON COLUMN public.deployment_requests.employee_category IS 'Category of the AI employee being deployed (e.g., Marketing, Sales, Support)';
