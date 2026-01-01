import { useState, useEffect } from 'react';
import { collection, query, where, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from './useAuth';

interface AgentTask {
  id: string;
  action: string;
  status: string;
  createdAt: Date;
  userId: string;
}

interface AgentEvent {
  id: string;
  type: string;
  message: string;
  timestamp: Date;
}

export function useAgentRealtime() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<AgentTask[]>([]);
  const [events, setEvents] = useState<AgentEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setTasks([]);
      setEvents([]);
      setLoading(false);
      return;
    }

    // Listen to real-time task updates
    const tasksQuery = query(
      collection(db, 'agent_tasks'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc'),
      limit(20)
    );

    const unsubscribeTasks = onSnapshot(tasksQuery, (snapshot) => {
      const taskList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
      })) as AgentTask[];
      setTasks(taskList);
      setLoading(false);
    });

    // Listen to real-time events (if collection exists)
    const eventsQuery = query(
      collection(db, 'agent_events'),
      where('userId', '==', user.uid),
      orderBy('timestamp', 'desc'),
      limit(10)
    );

    const unsubscribeEvents = onSnapshot(
      eventsQuery,
      (snapshot) => {
        const eventList = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          timestamp: doc.data().timestamp?.toDate() || new Date(),
        })) as AgentEvent[];
        setEvents(eventList);
      },
      (err) => {
        // Events collection may not exist yet, that's okay
        console.log('Agent events not available:', err);
      }
    );

    return () => {
      unsubscribeTasks();
      unsubscribeEvents();
    };
  }, [user]);

  return { tasks, events, loading };
}
