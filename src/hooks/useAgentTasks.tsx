import { useState, useEffect } from 'react';
import { supabase } from '@/supabase';
import { useAuth } from './useAuth';

interface AgentTask {
  id: string;
  action: string;
  status: string;
  createdAt: Date;
  userId: string;
}

export function useAgentTasks() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<AgentTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!user) {
      setTasks([]);
      setLoading(false);
      return;
    }

    // Fetch initial tasks
    const fetchTasks = async () => {
      try {
        const { data, error: fetchError } = await supabase
          .from('agent_tasks')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(50);
        
        if (fetchError) throw fetchError;
        
        if (data) {
          setTasks(data.map(task => ({
            id: task.id,
            action: task.action,
            status: task.status,
            createdAt: new Date(task.created_at),
            userId: task.user_id
          })));
        }
        setLoading(false);
      } catch (err) {
        console.error('Error fetching agent tasks:', err);
        setError(err as Error);
        setLoading(false);
      }
    };
    fetchTasks();

    // Subscribe to real-time updates
    const channel = supabase
      .channel('agent_tasks_realtime')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'agent_tasks', filter: `user_id=eq.${user.id}` },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const newTask = payload.new;
            setTasks(prev => [{
              id: newTask.id,
              action: newTask.action,
              status: newTask.status,
              createdAt: new Date(newTask.created_at),
              userId: newTask.user_id
            }, ...prev].slice(0, 50));
          } else if (payload.eventType === 'UPDATE') {
            const updatedTask = payload.new;
            setTasks(prev => prev.map(t => t.id === updatedTask.id ? {
              id: updatedTask.id,
              action: updatedTask.action,
              status: updatedTask.status,
              createdAt: new Date(updatedTask.created_at),
              userId: updatedTask.user_id
            } : t));
          } else if (payload.eventType === 'DELETE') {
            setTasks(prev => prev.filter(t => t.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  return { tasks, loading, error };
}
