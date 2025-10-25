import { useEffect, useState } from 'react';
import { db } from '@/firebase';
import { collection, query, onSnapshot, orderBy, limit, Timestamp } from 'firebase/firestore';

export interface AgentTaskEvent {
  ts: Timestamp;
  level: string;
  id: string;
  task_id: string;
  timestamp: Timestamp;
  type: string;
  message: string;
  metadata: Record<string, unknown>;
}

export interface AgentTask {
  id: string;
  status: string;
  action: string;
  created_at: Timestamp;
  result: Record<string, unknown> | null;
  error: string | null;
  target_id: string;
  owner_user: string;
  parameters: Record<string, unknown>;
  scheduled_for: string;
  started_at: Timestamp | null;
  finished_at: Timestamp | null;
  attempt_count: number;
  max_attempts: number;
  next_run_at: Timestamp | null;
}

export function useAgentRealtime() {
  const [tasks, setTasks] = useState<AgentTask[]>([]);
  const [events, setEvents] = useState<Record<string, AgentTaskEvent[]>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);

    const tasksQuery = query(collection(db, 'agent_tasks'), orderBy('created_at', 'desc'), limit(100));
    const unsubscribeTasks = onSnapshot(tasksQuery, (snapshot) => {
      const fetchedTasks: AgentTask[] = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      } as AgentTask));
      setTasks(fetchedTasks);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching agent tasks:", error);
      setLoading(false);
    });

    const eventsQuery = query(collection(db, 'agent_task_events'), orderBy('timestamp', 'desc'), limit(500));
    const unsubscribeEvents = onSnapshot(eventsQuery, (snapshot) => {
      const grouped: Record<string, AgentTaskEvent[]> = {};
      snapshot.docs.forEach(doc => {
        const event = { id: doc.id, ...doc.data() } as AgentTaskEvent;
        (grouped[event.task_id] ||= []).push(event);
      });

      Object.keys(grouped).forEach(taskId => {
        grouped[taskId].sort((a, b) => a.timestamp.toMillis() - b.timestamp.toMillis());
      });

      setEvents(grouped);
    }, (error) => {
      console.error("Error fetching agent task events:", error);
    });

    return () => {
      unsubscribeTasks();
      unsubscribeEvents();
    };
  }, []);

  return { tasks, events, loading };
}
