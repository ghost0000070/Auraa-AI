-- Fix RLS policies for autonomous_loop_runs
-- This table needs to be readable by authenticated users for the client-side lazy loop trigger
-- and writable for tracking loop runs

-- Enable RLS
ALTER TABLE public.autonomous_loop_runs ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to READ (they need to check when last run happened)
DROP POLICY IF EXISTS "Authenticated users can read loop runs" ON public.autonomous_loop_runs;
CREATE POLICY "Authenticated users can read loop runs" 
ON public.autonomous_loop_runs 
FOR SELECT 
TO authenticated
USING (true);

-- Allow all authenticated users to INSERT (they trigger runs from client)
DROP POLICY IF EXISTS "Authenticated users can create loop runs" ON public.autonomous_loop_runs;
CREATE POLICY "Authenticated users can create loop runs" 
ON public.autonomous_loop_runs 
FOR INSERT 
TO authenticated
WITH CHECK (true);

-- Allow all authenticated users to UPDATE (they update run status after completion)
DROP POLICY IF EXISTS "Authenticated users can update loop runs" ON public.autonomous_loop_runs;
CREATE POLICY "Authenticated users can update loop runs" 
ON public.autonomous_loop_runs 
FOR UPDATE 
TO authenticated
USING (true);

-- Service role has full access
DROP POLICY IF EXISTS "Service role full access" ON public.autonomous_loop_runs;
CREATE POLICY "Service role full access" 
ON public.autonomous_loop_runs 
USING (auth.role() = 'service_role');

-- Grant usage
GRANT SELECT, INSERT, UPDATE ON public.autonomous_loop_runs TO authenticated;

COMMENT ON TABLE public.autonomous_loop_runs IS 'Tracks autonomous employee loop executions. Readable by all authenticated users for lazy trigger coordination.';
