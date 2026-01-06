-- Drop the foreign key constraint on employee_id that's blocking inserts
ALTER TABLE public.deployed_employees 
DROP CONSTRAINT IF EXISTS deployed_employees_employee_id_fkey;

-- Make employee_id nullable if it's not already
ALTER TABLE public.deployed_employees 
ALTER COLUMN employee_id DROP NOT NULL;

-- Set default to NULL for employee_id
ALTER TABLE public.deployed_employees 
ALTER COLUMN employee_id SET DEFAULT NULL;
