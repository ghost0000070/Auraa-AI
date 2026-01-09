-- Cleanup test data: Remove orphaned records
-- Order matters due to FK constraints

-- First, clean up agent_tasks referencing employees we'll delete
DELETE FROM public.agent_tasks
WHERE deployed_employee_id IN (
    SELECT id FROM public.deployed_employees
    WHERE user_id NOT IN (SELECT user_id FROM public.business_profiles)
);

-- Clean up deployment_requests referencing employees we'll delete
UPDATE public.deployment_requests
SET deployed_employee_id = NULL
WHERE deployed_employee_id IN (
    SELECT id FROM public.deployed_employees
    WHERE user_id NOT IN (SELECT user_id FROM public.business_profiles)
);

-- Delete any orphaned autonomous_actions records (has CASCADE but explicit is safer)
DELETE FROM public.autonomous_actions
WHERE employee_id IN (
    SELECT id FROM public.deployed_employees
    WHERE user_id NOT IN (SELECT user_id FROM public.business_profiles)
);

-- Delete any orphaned business_insights records  
DELETE FROM public.business_insights
WHERE employee_id IN (
    SELECT id FROM public.deployed_employees
    WHERE user_id NOT IN (SELECT user_id FROM public.business_profiles)
);

-- Delete any orphaned employee_memory records
DELETE FROM public.employee_memory
WHERE employee_id IN (
    SELECT id FROM public.deployed_employees
    WHERE user_id NOT IN (SELECT user_id FROM public.business_profiles)
);

-- Now delete deployed_employees where user doesn't have a business profile
DELETE FROM public.deployed_employees
WHERE user_id NOT IN (
    SELECT user_id FROM public.business_profiles
);

-- Delete old autonomous_loop_runs (keep last 10)
DELETE FROM public.autonomous_loop_runs
WHERE id NOT IN (
    SELECT id FROM public.autonomous_loop_runs
    ORDER BY started_at DESC
    LIMIT 10
);
