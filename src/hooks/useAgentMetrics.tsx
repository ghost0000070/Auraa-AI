import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/supabase';
import { useAuth } from './useAuth';

interface AgentMetrics {
  totalTasks: number;
  completedTasks: number;
  failedTasks: number;
  pendingTasks: number;
  successRate: number;
  avgResponseTime?: number;
}

export function useAgentMetrics() {
  const { user } = useAuth();
  const [data, setData] = useState<AgentMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchMetrics = useCallback(async () => {
    if (!user) {
      setData(null);
      setIsLoading(false);
      return;
    }

    try {
      // Try to fetch from agent_metrics table first
      const { data: metricsData, error: metricsError } = await supabase
        .from('agent_metrics')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (metricsData && !metricsError) {
        setData({
          totalTasks: metricsData.tasks_completed || 0,
          completedTasks: metricsData.tasks_completed || 0,
          failedTasks: 0,
          pendingTasks: 0,
          successRate: metricsData.success_rate || 0,
          avgResponseTime: metricsData.avg_completion_time || 0,
        });
      } else {
        // Calculate metrics from agent_tasks table
        const { data: tasks, error: tasksError } = await supabase
          .from('agent_tasks')
          .select('status, started_at, finished_at')
          .eq('user_id', user.id);

        if (tasksError) throw tasksError;

        const taskList = tasks || [];
        const totalTasks = taskList.length;
        const completedTasks = taskList.filter(t => t.status === 'completed').length;
        const failedTasks = taskList.filter(t => t.status === 'failed').length;
        const pendingTasks = taskList.filter(t => t.status === 'pending').length;
        const successRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

        // Calculate average response time for completed tasks
        const completedWithTime = taskList.filter(
          t => t.status === 'completed' && t.started_at && t.finished_at
        );
        let avgResponseTime = 0;
        if (completedWithTime.length > 0) {
          const totalTime = completedWithTime.reduce((sum, t) => {
            const start = new Date(t.started_at).getTime();
            const end = new Date(t.finished_at).getTime();
            return sum + (end - start);
          }, 0);
          avgResponseTime = totalTime / completedWithTime.length / 1000;
        }

        setData({
          totalTasks,
          completedTasks,
          failedTasks,
          pendingTasks,
          successRate,
          avgResponseTime,
        });
      }

      setIsLoading(false);
    } catch (err) {
      console.error('Error fetching agent metrics:', err);
      setError(err as Error);
      setIsLoading(false);

      setData({
        totalTasks: 0,
        completedTasks: 0,
        failedTasks: 0,
        pendingTasks: 0,
        successRate: 0,
      });
    }
  }, [user]);

  useEffect(() => {
    fetchMetrics();
  }, [fetchMetrics]);

  const refetch = useCallback(() => {
    setIsLoading(true);
    fetchMetrics();
  }, [fetchMetrics]);

  return { data, isLoading, error, refetch };
}
