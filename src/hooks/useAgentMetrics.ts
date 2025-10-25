import { useQuery } from '@tanstack/react-query';
import { db } from '@/firebase';
import { collection, getDocs } from 'firebase/firestore';

async function fetchAgentMetrics() {
  const querySnapshot = await getDocs(collection(db, 'agent_metrics'));
  const metrics: any[] = [];
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
