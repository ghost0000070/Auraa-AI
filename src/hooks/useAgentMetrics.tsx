import { useState, useEffect } from 'react';
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

  useEffect(() => {
    const fetchMetrics = async () => {
      if (!user) {
        setData(null);
        setIsLoading(false);
        return;
      }

      try {
        // Try to fetch from metrics collection first
        const metricsQuery = query(
          collection(db, 'agent_metrics'),
          where('userId', '==', user.uid)
        );
        
        const metricsSnapshot = await getDocs(metricsQuery);
        
        if (!metricsSnapshot.empty) {
          const metricsDoc = metricsSnapshot.docs[0].data();
          setData(metricsDoc as AgentMetrics);
        } else {
          // Calculate metrics from agent_tasks collection
          const tasksQuery = query(
            collection(db, 'agent_tasks'),
            where('userId', '==', user.uid)
          );
          
          const tasksSnapshot = await getDocs(tasksQuery);
          const tasks = tasksSnapshot.docs.map(doc => doc.data());
          
          const totalTasks = tasks.length;
          const completedTasks = tasks.filter(t => t.status === 'completed').length;
          const failedTasks = tasks.filter(t => t.status === 'failed').length;
          const pendingTasks = tasks.filter(t => t.status === 'pending').length;
          const successRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
          
          setData({
            totalTasks,
            completedTasks,
            failedTasks,
            pendingTasks,
            successRate,
          });
        }
        
        setIsLoading(false);
      } catch (err) {
        console.error('Error fetching agent metrics:', err);
        setError(err as Error);
        setIsLoading(false);
        
        // Set default values on error
        setData({
          totalTasks: 0,
          completedTasks: 0,
          failedTasks: 0,
          pendingTasks: 0,
          successRate: 0,
        });
      }
    };

    fetchMetrics();
  }, [user]);

  return { data, isLoading, error };
}
