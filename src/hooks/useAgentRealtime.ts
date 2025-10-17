import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface AgentTaskEvent {
  ts: string | number | Date;
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

  const loadInitial = useCallback(async () => {
    setLoading(true);
    const { data: tData } = await supabase.from('agent_tasks').select('*').order('created_at', { ascending: false }).limit(100);
    setTasks(tData as AgentTask[] || []);
    if (tData?.length) {
      const taskIds = tData.map(t=>t.id);
      const { data: eData } = await supabase.from('agent_task_events').select('*').in('task_id', taskIds).order('id', { ascending: true });
      const grouped: Record<string, AgentTaskEvent[]> = {};
      (eData || []).forEach(ev => { (grouped[ev.task_id] ||= []).push(ev as AgentTaskEvent); });
      setEvents(grouped);
    }
    setLoading(false);
  }, []);

  useEffect(() => { loadInitial(); }, [loadInitial]);

  useEffect(() => {
    const channel = supabase.channel('agent_changes')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'agent_tasks' }, payload => {
        setTasks(prev => [payload.new as AgentTask, ...prev]);
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'agent_tasks' }, payload => {
        setTasks(prev => {
          const copy = [...prev];
          const idx = copy.findIndex(t => t.id === payload.new.id);
          if (idx !== -1) {
            copy[idx] = payload.new as AgentTask;
          }
          return copy;
        });
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'agent_tasks' }, payload => {
        setTasks(prev => prev.filter(t => t.id !== (payload.old as { id: string }).id));
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'agent_task_events' }, payload => {
        setEvents(prev => {
          const taskId = payload.new.task_id as string;
          const arr = prev[taskId] ? [...prev[taskId], payload.new as AgentTaskEvent] : [payload.new as AgentTaskEvent];
          return { ...prev, [taskId]: arr };
        });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  return { tasks, events, loading };
}
