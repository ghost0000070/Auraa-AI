import { useQuery } from '@tanstack/react-query';
import { db } from '@/firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { useAuth } from '@/hooks/useAuth';

interface AgentMetric {
  id: string;
  [key: string]: string | number | boolean | object;
}

async function fetchAgentMetrics(userId: string | undefined): Promise<AgentMetric[]> {
  if (!userId) return [];
  
  try {
      const q = query(
          collection(db, 'agent_metrics'), 
          where('user_id', '==', userId)
      );
      const querySnapshot = await getDocs(q);
      const metrics: AgentMetric[] = [];
      querySnapshot.forEach((doc) => {
        metrics.push({ id: doc.id, ...doc.data() });
      });
      return metrics;
  } catch (error) {
      console.error("Error fetching agent metrics:", error);
      return [];
  }
}

export function useAgentMetrics() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['agentMetrics', user?.uid],
    queryFn: () => fetchAgentMetrics(user?.uid),
    enabled: !!user,
    refetchInterval: 60000, // Refresh every minute
  });
}
