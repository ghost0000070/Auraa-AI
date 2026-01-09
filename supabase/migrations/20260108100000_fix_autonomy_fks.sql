-- Fix employee autonomy tables to reference deployed_employees instead of ai_employees
-- This migration updates the schema to work correctly with the deployed_employees table

-- Drop the old foreign key constraint if it exists and recreate with correct reference
DO $$ 
BEGIN
    -- employee_memory: Drop old FK if exists
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints 
               WHERE constraint_name = 'employee_memory_employee_id_fkey'
               AND table_name = 'employee_memory') THEN
        ALTER TABLE employee_memory DROP CONSTRAINT employee_memory_employee_id_fkey;
    END IF;
    
    -- Add new FK to deployed_employees (if table exists)
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'deployed_employees') THEN
        -- Try to add constraint, ignore if already exists with correct reference
        BEGIN
            ALTER TABLE employee_memory 
            ADD CONSTRAINT employee_memory_employee_id_fkey 
            FOREIGN KEY (employee_id) REFERENCES deployed_employees(id) ON DELETE CASCADE;
        EXCEPTION WHEN duplicate_object THEN
            NULL; -- Constraint already exists
        END;
    END IF;

    -- business_insights: Drop old FK if exists
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints 
               WHERE constraint_name = 'business_insights_employee_id_fkey'
               AND table_name = 'business_insights') THEN
        ALTER TABLE business_insights DROP CONSTRAINT business_insights_employee_id_fkey;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'deployed_employees') THEN
        BEGIN
            ALTER TABLE business_insights 
            ADD CONSTRAINT business_insights_employee_id_fkey 
            FOREIGN KEY (employee_id) REFERENCES deployed_employees(id) ON DELETE CASCADE;
        EXCEPTION WHEN duplicate_object THEN
            NULL;
        END;
    END IF;

    -- autonomous_actions: Drop old FK if exists
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints 
               WHERE constraint_name = 'autonomous_actions_employee_id_fkey'
               AND table_name = 'autonomous_actions') THEN
        ALTER TABLE autonomous_actions DROP CONSTRAINT autonomous_actions_employee_id_fkey;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'deployed_employees') THEN
        BEGIN
            ALTER TABLE autonomous_actions 
            ADD CONSTRAINT autonomous_actions_employee_id_fkey 
            FOREIGN KEY (employee_id) REFERENCES deployed_employees(id) ON DELETE CASCADE;
        EXCEPTION WHEN duplicate_object THEN
            NULL;
        END;
    END IF;
END $$;

-- Create a view for the dashboard to show employee activity
CREATE OR REPLACE VIEW employee_activity_summary AS
SELECT 
    de.id AS employee_id,
    de.user_id,
    de.name AS employee_name,
    de.category,
    de.status,
    (SELECT COUNT(*) FROM autonomous_actions aa WHERE aa.employee_id = de.id) AS total_actions,
    (SELECT COUNT(*) FROM autonomous_actions aa WHERE aa.employee_id = de.id AND aa.created_at > NOW() - INTERVAL '24 hours') AS actions_24h,
    (SELECT COUNT(*) FROM business_insights bi WHERE bi.employee_id = de.id) AS insights_generated,
    (SELECT MAX(created_at) FROM autonomous_actions aa WHERE aa.employee_id = de.id) AS last_action_at,
    (SELECT action_title FROM autonomous_actions aa WHERE aa.employee_id = de.id ORDER BY created_at DESC LIMIT 1) AS latest_action
FROM deployed_employees de
WHERE de.status = 'active';

-- Grant access to the view
GRANT SELECT ON employee_activity_summary TO authenticated;

-- Add RLS policy for the view (views inherit from base table policies)
COMMENT ON VIEW employee_activity_summary IS 'Summary of autonomous employee activity for dashboard display';

-- Create a function to get employee activity for a user
CREATE OR REPLACE FUNCTION get_my_employee_activity()
RETURNS TABLE (
    employee_id UUID,
    employee_name TEXT,
    category TEXT,
    total_actions BIGINT,
    actions_24h BIGINT,
    insights_generated BIGINT,
    last_action_at TIMESTAMPTZ,
    latest_action TEXT
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        eas.employee_id,
        eas.employee_name::TEXT,
        eas.category::TEXT,
        eas.total_actions,
        eas.actions_24h,
        eas.insights_generated,
        eas.last_action_at,
        eas.latest_action::TEXT
    FROM employee_activity_summary eas
    WHERE eas.user_id = auth.uid();
END;
$$;

-- Function to get recent insights for dashboard
CREATE OR REPLACE FUNCTION get_recent_business_insights(p_limit INTEGER DEFAULT 10)
RETURNS TABLE (
    id UUID,
    employee_name TEXT,
    category TEXT,
    title TEXT,
    insight TEXT,
    recommended_action TEXT,
    is_actionable BOOLEAN,
    created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        bi.id,
        de.name::TEXT AS employee_name,
        bi.category::TEXT,
        bi.title::TEXT,
        bi.insight::TEXT,
        bi.recommended_action::TEXT,
        bi.is_actionable,
        bi.created_at
    FROM business_insights bi
    JOIN deployed_employees de ON bi.employee_id = de.id
    WHERE bi.user_id = auth.uid()
    ORDER BY bi.created_at DESC
    LIMIT p_limit;
END;
$$;

-- Function to get recent autonomous actions for dashboard
CREATE OR REPLACE FUNCTION get_recent_autonomous_actions(p_limit INTEGER DEFAULT 20)
RETURNS TABLE (
    id UUID,
    employee_name TEXT,
    action_type TEXT,
    action_title TEXT,
    status TEXT,
    result TEXT,
    created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        aa.id,
        de.name::TEXT AS employee_name,
        aa.action_type::TEXT,
        aa.action_title::TEXT,
        aa.status::TEXT,
        LEFT(aa.result, 500)::TEXT AS result,
        aa.created_at
    FROM autonomous_actions aa
    JOIN deployed_employees de ON aa.employee_id = de.id
    WHERE aa.user_id = auth.uid()
    ORDER BY aa.created_at DESC
    LIMIT p_limit;
END;
$$;
