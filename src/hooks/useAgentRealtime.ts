import { useEffect, useState } from 'react';
import { supabase } from '@/supabase';

export interface AgentTaskEvent {
  ts: string;
  level: string;
  id: string;
  task_id: string;
  timestamp: string;
  type: string;
  message: string;
  metadata: Record<string, unknown>;
}

export interface AgentTask {
  id: string;
  status: string;
  action: string;
  created_at: string;
  result: Record<string, unknown> | null;
  error: string | null;
  target_id: string;
  owner_user: string;
  parameters: Record<string, unknown>;
  scheduled_for: string;
  started_at: string | null;
  finished_at: string | null;
  attempt_count: number;
  max_attempts: number;
  next_run_at: string | null;
}

export function useAgentRealtime() {
  const [tasks, setTasks] = useState<AgentTask[]>([]);
  const [events, setEvents] = useState<Record<string, AgentTaskEvent[]>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);

    // Fetch initial tasks
    supabase
      .from('agent_tasks')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100)
      .then(({ data, error }) => {
        if (error) {
          console.error('Error fetching agent tasks:', error);
        } else if (data) {
          setTasks(data as AgentTask[]);
        }
        setLoading(false);
      });

    // Subscribe to realtime changes
    const channel = supabase
      .channel('agent_tasks_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'agent_tasks' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setTasks(prev => [payload.new as AgentTask, ...prev].slice(0, 100));
          } else if (payload.eventType === 'UPDATE') {
            setTasks(prev => prev.map(t => t.id === payload.new.id ? payload.new as AgentTask : t));
          } else if (payload.eventType === 'DELETE') {
            setTasks(prev => prev.filter(t => t.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (tasks.length === 0) {
      setEvents({});
      return;
    }

    const taskIds = tasks.map(t => t.id);

    // Fetch events for all tasks
    supabase
      .from('agent_task_events')
      .select('*')
      .in('task_id', taskIds)
      .order('timestamp', { ascending: true })
      .then(({ data, error }) => {
        if (error) {
          console.error('Error fetching agent task events:', error);
        } else if (data) {
          const grouped: Record<string, AgentTaskEvent[]> = {};
          data.forEach(event => {
            (grouped[event.task_id] ||= []).push(event as AgentTaskEvent);
          });
          setEvents(grouped);
        }
      });

    // Subscribe to realtime event changes
    const channel = supabase
      .channel('agent_task_events_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'agent_task_events', filter: `task_id=in.(${taskIds.join(',')})` },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setEvents(prev => ({
              ...prev,
              [payload.new.task_id]: [...(prev[payload.new.task_id] || []), payload.new as AgentTaskEvent]
            }));
          }
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [tasks]);


  return { tasks, events, loading };
}