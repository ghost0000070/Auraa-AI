import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface AgentTask {
  id: string;
  status: string;
  action: string;
  created_at: string;
  result: Record<string, unknown> | null;
  error: string | null;
}

export function useAgentTasks(limit = 50) {
  const [tasks, setTasks] = useState<AgentTask[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('agent_tasks')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);
    if (!error) setTasks(data as AgentTask[] || []);
    setLoading(false);
  }, [limit]);

  useEffect(() => { load(); }, [load]);

  return { tasks, loading, reload: load };
}
