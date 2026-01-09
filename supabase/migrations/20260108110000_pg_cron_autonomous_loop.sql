-- Autonomous Loop Scheduling Options
-- 
-- OPTION 1: Use Supabase pg_cron (requires Pro plan)
-- OPTION 2: Use external cron service (free) - cron-job.org
-- OPTION 3: Vercel daily cron (free tier) as backup
--
-- This migration sets up the infrastructure for any of these options.

-- Create a table to track cron executions (for monitoring)
CREATE TABLE IF NOT EXISTS autonomous_loop_runs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trigger_source TEXT NOT NULL, -- 'pg_cron', 'vercel_cron', 'external_cron', 'manual'
    started_at TIMESTAMPTZ DEFAULT now(),
    completed_at TIMESTAMPTZ,
    employees_processed INTEGER DEFAULT 0,
    actions_taken INTEGER DEFAULT 0,
    errors TEXT[],
    status TEXT DEFAULT 'running' -- 'running', 'completed', 'failed'
);

-- Index for efficient queries
CREATE INDEX IF NOT EXISTS idx_loop_runs_started ON autonomous_loop_runs(started_at DESC);

-- Grant access
GRANT SELECT ON autonomous_loop_runs TO authenticated;

-- Function to check if a loop is already running (prevent overlaps)
CREATE OR REPLACE FUNCTION is_loop_running()
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM autonomous_loop_runs 
        WHERE status = 'running' 
        AND started_at > NOW() - INTERVAL '10 minutes'
    );
END;
$$;

-- Function to start a loop run
CREATE OR REPLACE FUNCTION start_loop_run(p_trigger_source TEXT)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    run_id UUID;
BEGIN
    -- Check if already running
    IF is_loop_running() THEN
        RETURN NULL;
    END IF;
    
    INSERT INTO autonomous_loop_runs (trigger_source)
    VALUES (p_trigger_source)
    RETURNING id INTO run_id;
    
    RETURN run_id;
END;
$$;

-- Function to complete a loop run
CREATE OR REPLACE FUNCTION complete_loop_run(
    p_run_id UUID,
    p_employees_processed INTEGER,
    p_actions_taken INTEGER,
    p_errors TEXT[] DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE autonomous_loop_runs
    SET 
        completed_at = NOW(),
        employees_processed = p_employees_processed,
        actions_taken = p_actions_taken,
        errors = p_errors,
        status = CASE WHEN p_errors IS NOT NULL AND array_length(p_errors, 1) > 0 THEN 'failed' ELSE 'completed' END
    WHERE id = p_run_id;
END;
$$;

-- View for dashboard to show loop status
CREATE OR REPLACE VIEW autonomous_loop_status AS
SELECT 
    (SELECT COUNT(*) FROM autonomous_loop_runs WHERE started_at > NOW() - INTERVAL '24 hours') AS runs_24h,
    (SELECT COUNT(*) FROM autonomous_loop_runs WHERE status = 'completed' AND started_at > NOW() - INTERVAL '24 hours') AS successful_runs_24h,
    (SELECT SUM(employees_processed) FROM autonomous_loop_runs WHERE started_at > NOW() - INTERVAL '24 hours') AS employees_processed_24h,
    (SELECT SUM(actions_taken) FROM autonomous_loop_runs WHERE started_at > NOW() - INTERVAL '24 hours') AS actions_taken_24h,
    (SELECT started_at FROM autonomous_loop_runs ORDER BY started_at DESC LIMIT 1) AS last_run_at,
    (SELECT status FROM autonomous_loop_runs ORDER BY started_at DESC LIMIT 1) AS last_run_status,
    is_loop_running() AS is_currently_running;

GRANT SELECT ON autonomous_loop_status TO authenticated;

COMMENT ON TABLE autonomous_loop_runs IS 'Tracks autonomous employee loop executions for monitoring';
COMMENT ON VIEW autonomous_loop_status IS 'Dashboard-friendly view of autonomous loop health';

