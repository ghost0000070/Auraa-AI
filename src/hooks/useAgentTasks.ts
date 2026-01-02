import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/supabase';
import { useAuth } from '@/hooks/useAuth';

interface AgentTask {
  id: string;
  status: string;
  action: string;
  created_at: string;
  result: Record<string, unknown> | null;
  error: string | null;
}

export function useAgentTasks(limit = 50) {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<AgentTask[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('agent_tasks')
        .select('*')
        .eq('owner_user', user.id)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      setTasks(data as AgentTask[]);
    } catch (error) {
      console.error("Error loading agent tasks:", error);
    } finally {
      setLoading(false);
    }
  }, [user, limit]);

  useEffect(() => { 
      if (user) {
          load(); 
      }
  }, [load, user]);

  return { tasks, loading, reload: load };
}
