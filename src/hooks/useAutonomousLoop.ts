import { useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/supabase';

const LOOP_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes
const EDGE_FUNCTION_URL = 'https://iupgzyloawweklvbyjlx.supabase.co/functions/v1/autonomous-loop';

/**
 * Hook that triggers the autonomous employee loop when needed.
 * 
 * Instead of relying on external cron services, this uses "lazy evaluation":
 * - When any user visits the dashboard, check when the loop last ran
 * - If it's been more than 5 minutes, trigger it
 * - This ensures the loop runs when users are active (when it matters most)
 * 
 * Benefits:
 * - No external services needed
 * - Saves resources when no users are active
 * - Users always see fresh data when they visit
 */
export function useAutonomousLoop() {
  const hasTriggeredRef = useRef(false);

  const triggerLoop = useCallback(async () => {
    // Don't trigger more than once per component mount
    if (hasTriggeredRef.current) return;
    
    try {
      // Check when the loop last ran
      const { data: lastRun } = await supabase
        .from('autonomous_loop_runs')
        .select('started_at')
        .order('started_at', { ascending: false })
        .limit(1)
        .single();

      const lastRunTime = lastRun?.started_at ? new Date(lastRun.started_at).getTime() : 0;
      const timeSinceLastRun = Date.now() - lastRunTime;

      // If it's been more than 5 minutes, trigger the loop
      if (timeSinceLastRun > LOOP_INTERVAL_MS) {
        console.log('🔄 Triggering autonomous loop (last run:', 
          lastRun?.started_at ? `${Math.round(timeSinceLastRun / 60000)}m ago` : 'never',
          ')');
        
        hasTriggeredRef.current = true;

        // Record that we're starting a run
        const { data: runRecord } = await supabase
          .from('autonomous_loop_runs')
          .insert({ trigger_source: 'client_lazy' })
          .select('id')
          .single();

        // Call the edge function (fire and forget)
        fetch(EDGE_FUNCTION_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            trigger: 'client_lazy',
            run_id: runRecord?.id 
          }),
        }).then(async (res) => {
          const result = await res.json();
          console.log('✅ Autonomous loop completed:', result.processed, 'employees processed');
          
          // Update the run record
          if (runRecord?.id) {
            await supabase
              .from('autonomous_loop_runs')
              .update({
                completed_at: new Date().toISOString(),
                employees_processed: result.processed || 0,
                status: result.success ? 'completed' : 'failed',
              })
              .eq('id', runRecord.id);
          }
        }).catch((err) => {
          console.error('❌ Autonomous loop error:', err);
        });
      } else {
        console.log('⏭️ Autonomous loop recently ran, skipping');
      }
    } catch (error) {
      console.error('Error checking autonomous loop status:', error);
    }
  }, []);

  useEffect(() => {
    // Trigger check when component mounts (user visits dashboard)
    triggerLoop();
  }, [triggerLoop]);
}

/**
 * Alternative: Interval-based loop for users who keep the dashboard open
 * This keeps the loop running every 5 minutes while the user is active
 */
export function useAutonomousLoopInterval() {
  const triggerLoop = useCallback(async () => {
    try {
      const response = await fetch(EDGE_FUNCTION_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trigger: 'client_interval' }),
      });
      const result = await response.json();
      console.log('🔄 Autonomous loop:', result.processed, 'employees processed');
    } catch (error) {
      console.error('Autonomous loop error:', error);
    }
  }, []);

  useEffect(() => {
    // Initial trigger
    triggerLoop();

    // Set up interval for users who keep dashboard open
    const interval = setInterval(triggerLoop, LOOP_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [triggerLoop]);
}
