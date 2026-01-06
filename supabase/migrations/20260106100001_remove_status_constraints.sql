-- =====================================================
-- Remove Status CHECK Constraints
-- Error 23514 indicates CHECK constraint violations
-- Drop any constraints that restrict status values
-- =====================================================

-- Drop any CHECK constraints on deployment_requests.status
DO $$
DECLARE
    constraint_name TEXT;
BEGIN
    FOR constraint_name IN
        SELECT conname FROM pg_constraint 
        WHERE conrelid = 'public.deployment_requests'::regclass
        AND contype = 'c'
    LOOP
        EXECUTE 'ALTER TABLE public.deployment_requests DROP CONSTRAINT IF EXISTS ' || quote_ident(constraint_name);
        RAISE NOTICE 'Dropped constraint: %', constraint_name;
    END LOOP;
END $$;

-- Drop any CHECK constraints on deployed_employees.status
DO $$
DECLARE
    constraint_name TEXT;
BEGIN
    FOR constraint_name IN
        SELECT conname FROM pg_constraint 
        WHERE conrelid = 'public.deployed_employees'::regclass
        AND contype = 'c'
    LOOP
        EXECUTE 'ALTER TABLE public.deployed_employees DROP CONSTRAINT IF EXISTS ' || quote_ident(constraint_name);
        RAISE NOTICE 'Dropped constraint: %', constraint_name;
    END LOOP;
END $$;

-- Drop any CHECK constraints on agent_tasks.status
DO $$
DECLARE
    constraint_name TEXT;
BEGIN
    FOR constraint_name IN
        SELECT conname FROM pg_constraint 
        WHERE conrelid = 'public.agent_tasks'::regclass
        AND contype = 'c'
    LOOP
        EXECUTE 'ALTER TABLE public.agent_tasks DROP CONSTRAINT IF EXISTS ' || quote_ident(constraint_name);
        RAISE NOTICE 'Dropped constraint: %', constraint_name;
    END LOOP;
END $$;
