import { useQuery } from '@tanstack/react-query';
import { db } from '@/firebase';
import { collection, getDocs } from 'firebase/firestore';

interface AgentMetric {
  id: string;
  [key: string]: string | number | boolean | object;
}

async function fetchAgentMetrics(): Promise<AgentMetric[]> {
  const querySnapshot = await getDocs(collection(db, 'agent_metrics'));
  const metrics: AgentMetric[] = [];
  querySnapshot.forEach((doc) => {
    metrics.push({ id: doc.id, ...doc.data() });
  });
  return metrics;
}

export function useAgentMetrics() {
  return useQuery({
    queryKey: ['agentMetrics'],
    queryFn: fetchAgentMetrics,
    refetchInterval: 60000, // Refresh every minute
  });
}
