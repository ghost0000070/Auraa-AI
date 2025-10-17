import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

async function fetchAgentMetrics() {
  const { data, error } = await supabase.from('agent_metrics').select('*');
  if (error) throw new Error(error.message);
  return data;
}

export function useAgentMetrics() {
  return useQuery({
    queryKey: ['agentMetrics'],
    queryFn: fetchAgentMetrics,
    refetchInterval: 60000, // Refresh every minute
  });
}
