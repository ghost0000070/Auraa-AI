-- Migration: Add employee_name column to deployment_requests table
-- This column was missing from the production schema
-- Error: Could not find the 'employee_name' column of 'deployment_requests' in the schema cache

-- Add the employee_name column if it doesn't exist
ALTER TABLE public.deployment_requests 
ADD COLUMN IF NOT EXISTS employee_name VARCHAR(255);

-- Set a default value for existing rows (if any)
UPDATE public.deployment_requests 
SET employee_name = 'Unknown Employee' 
WHERE employee_name IS NULL;

-- Now make it NOT NULL for future inserts
-- Note: We cannot use IF NOT EXISTS with constraints, so we check first
DO $$
BEGIN
  -- Check if the column is already NOT NULL
  IF EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'deployment_requests' 
    AND column_name = 'employee_name'
    AND is_nullable = 'YES'
  ) THEN
    ALTER TABLE public.deployment_requests 
    ALTER COLUMN employee_name SET NOT NULL;
  END IF;
END $$;

-- Add comment for documentation
COMMENT ON COLUMN public.deployment_requests.employee_name IS 'Name of the AI employee being deployed';
