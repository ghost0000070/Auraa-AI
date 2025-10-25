import { useEffect, useState, useCallback } from 'react';
import { db } from '@/firebase';
import { collection, query, orderBy, limit as firestoreLimit, getDocs } from 'firebase/firestore';

interface AgentTask {
  id: string;
  status: string;
  action: string;
  created_at: string;
  result: Record<string, unknown> | null;
  error: string | null;
}

export function useAgentTasks(limit = 50) {
  const [tasks, setTasks] = useState<AgentTask[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const tasksQuery = query(
        collection(db, 'agent_tasks'),
        orderBy('created_at', 'desc'),
        firestoreLimit(limit)
      );
      const querySnapshot = await getDocs(tasksQuery);
      const tasksData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AgentTask));
      setTasks(tasksData);
    } catch (error) {
      console.error("Error loading agent tasks:", error);
    } finally {
      setLoading(false);
    }
  }, [limit]);

  useEffect(() => { load(); }, [load]);

  return { tasks, loading, reload: load };
}
