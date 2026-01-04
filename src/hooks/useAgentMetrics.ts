import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/supabase';
import { useAuth } from '@/hooks/useAuth';

interface AgentMetric {
  id: string;
  [key: string]: string | number | boolean | object;
}

async function fetchAgentMetrics(userId: string | undefined): Promise<AgentMetric[]> {
  if (!userId) return [];
  
  try {
    const { data, error } = await supabase
      .from('agent_metrics')
      .select('*')
      .eq('user_id', userId);

    if (error) throw error;
    return data as AgentMetric[];
  } catch (error) {
    console.error("Error fetching agent metrics:", error);
    return [];
  }
}

export function useAgentMetrics() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['agentMetrics', user?.id],
    queryFn: () => fetchAgentMetrics(user?.id),
    enabled: !!user,
    refetchInterval: 60000, // Refresh every minute
  });
}
