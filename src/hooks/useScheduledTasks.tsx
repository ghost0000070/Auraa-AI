import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/supabase';
import { useAuth } from './useAuth';

export interface ScheduledTask {
  id: string;
  user_id: string;
  employee_id: string;
  name: string;
  action: string;
  parameters: Record<string, unknown>;
  cron_expression: string;
  is_active: boolean;
  last_run_at: string | null;
  next_run_at: string | null;
  created_at: string;
}

export function useScheduledTasks() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<ScheduledTask[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchTasks = useCallback(async () => {
    if (!user) {
      setTasks([]);
      setIsLoading(false);
      return;
    }

    try {
      const { data, error: fetchError } = await supabase
        .from('scheduled_tasks')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      setTasks(data || []);
    } catch (err) {
      console.error('Error fetching scheduled tasks:', err);
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  const createTask = useCallback(async (task: Omit<ScheduledTask, 'id' | 'user_id' | 'last_run_at' | 'next_run_at' | 'created_at'>) => {
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('scheduled_tasks')
      .insert({
        ...task,
        user_id: user.id,
      })
      .select()
      .single();

    if (error) throw error;

    setTasks(prev => [data, ...prev]);
    return data;
  }, [user]);

  const updateTask = useCallback(async (id: string, updates: Partial<ScheduledTask>) => {
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('scheduled_tasks')
      .update(updates)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) throw error;

    setTasks(prev => prev.map(t => (t.id === id ? data : t)));
    return data;
  }, [user]);

  const deleteTask = useCallback(async (id: string) => {
    if (!user) throw new Error('Not authenticated');

    const { error } = await supabase
      .from('scheduled_tasks')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) throw error;

    setTasks(prev => prev.filter(t => t.id !== id));
  }, [user]);

  const toggleTask = useCallback(async (id: string, isActive: boolean) => {
    return updateTask(id, { is_active: isActive });
  }, [updateTask]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  return {
    tasks,
    isLoading,
    error,
    createTask,
    updateTask,
    deleteTask,
    toggleTask,
    refetch: fetchTasks,
  };
}
