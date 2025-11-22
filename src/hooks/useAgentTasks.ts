import { useEffect, useState, useCallback } from 'react';
import { db } from '@/firebase';
import { collection, query, orderBy, limit as firestoreLimit, getDocs, where } from 'firebase/firestore';
import { useAuth } from '@/hooks/useAuth';

interface AgentTask {
  id: string;
  status: string;
  action: string;
  created_at: string;
  result: Record<string, unknown> | null;
  error: string | null;
}

export function useAgentTasks(limit = 50) {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<AgentTask[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const tasksQuery = query(
        collection(db, 'agent_tasks'),
        where('owner_user', '==', user.uid), // Ensure we only get tasks for the current user
        orderBy('createdAt', 'desc'), // Note: Ensure your Firestore indexes support this composite query
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
  }, [user, limit]);

  useEffect(() => { 
      if (user) {
          load(); 
      }
  }, [load, user]);

  return { tasks, loading, reload: load };
}
