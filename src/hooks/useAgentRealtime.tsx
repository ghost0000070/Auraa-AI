import { useState, useEffect } from 'react';
import { supabase } from '@/supabase';
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

    // Fetch initial tasks
    const fetchTasks = async () => {
      const { data } = await supabase
        .from('agent_tasks')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);
      
      if (data) {
        setTasks(data.map(task => ({
          id: task.id,
          action: task.action,
          status: task.status,
          createdAt: new Date(task.created_at),
          userId: task.user_id
        })));
      }
      setLoading(false);
    };
    fetchTasks();

    // Subscribe to real-time task updates
    const tasksChannel = supabase
      .channel('agent_tasks_changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'agent_tasks', filter: `user_id=eq.${user.id}` },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const newTask = payload.new;
            setTasks(prev => [{
              id: newTask.id,
              action: newTask.action,
              status: newTask.status,
              createdAt: new Date(newTask.created_at),
              userId: newTask.user_id
            }, ...prev].slice(0, 20));
          } else if (payload.eventType === 'UPDATE') {
            const updatedTask = payload.new;
            setTasks(prev => prev.map(t => t.id === updatedTask.id ? {
              id: updatedTask.id,
              action: updatedTask.action,
              status: updatedTask.status,
              createdAt: new Date(updatedTask.created_at),
              userId: updatedTask.user_id
            } : t));
          } else if (payload.eventType === 'DELETE') {
            setTasks(prev => prev.filter(t => t.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    // Fetch initial events
    const fetchEvents = async () => {
      const { data } = await supabase
        .from('agent_events')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);
      
      if (data) {
        setEvents(data.map(event => ({
          id: event.id,
          type: event.type || event.event_type || 'unknown',
          message: event.message || (typeof event.payload === 'object' ? JSON.stringify(event.payload) : String(event.payload)) || '',
          timestamp: new Date(event.timestamp || event.created_at)
        })));
      }
    };
    fetchEvents();

    // Subscribe to real-time events
    const eventsChannel = supabase
      .channel('agent_events_changes')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'agent_events', filter: `user_id=eq.${user.id}` },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const newEvent = payload.new;
            setEvents(prev => [{
              id: newEvent.id,
              type: newEvent.type || newEvent.event_type || 'unknown',
              message: newEvent.message || (typeof newEvent.payload === 'object' ? JSON.stringify(newEvent.payload) : String(newEvent.payload)) || '',
              timestamp: new Date(newEvent.timestamp || newEvent.created_at)
            }, ...prev].slice(0, 10));
          }
        }
      )
      .subscribe();

    return () => {
      tasksChannel.unsubscribe();
      eventsChannel.unsubscribe();
    };
  }, [user]);

  return { tasks, events, loading };
}
