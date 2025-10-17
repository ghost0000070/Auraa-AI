import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useAgentRealtime } from '@/hooks/useAgentRealtime';
import { Database } from '@/integrations/supabase/types';

type Target = Database['public']['Tables']['integration_targets']['Row'];
type AgentTask = Database['public']['Tables']['agent_tasks']['Row'];

export function WebsiteIntegrations() {
  const { tasks } = useAgentRealtime();
  const { user } = useAuth();
  const [targets, setTargets] = useState<Target[]>([]);
  const [loading, setLoading] = useState(false);
  const [runningId, setRunningId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    const { data, error } = await supabase.from('integration_targets').select('*').order('created_at', { ascending: false });
    if (!error) setTargets(data || []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function runAction(target: Target, action: string) {
    if (!user) return;
    setRunningId(target.id);
    setMessage(null);
    try {
      const { data, error } = await supabase.functions.invoke('agent-run', {
        body: {
          target_id: target.id,
          action: action,
        }
      });
      if (error) throw error;
      setMessage(`Task queued for action: ${action}`);
    } catch (e: any) {
      setMessage(`Error: ${e.message}`);
    } finally {
      setRunningId(null);
    }
  }

  async function cancelTask(taskId: string) {
    setMessage(null);
    try {
      await supabase.functions.invoke('agent-cancel', { body: { task_id: taskId } });
      setMessage('Cancellation request sent.');
    } catch (e: any) {
      setMessage(`Error: ${e.message}`);
    }
  }

  const getLatestTaskForTarget = (targetId: string): AgentTask | undefined => {
    return tasks
      .filter(t => t.target_id === targetId)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold">Website Integrations</h2>
        <button onClick={load} className="btn btn-secondary btn-sm" disabled={loading}>
          {loading ? '...' : 'Refresh'}
        </button>
      </div>
      {message && <div className="text-xs text-muted-foreground">{message}</div>}
      <div className="space-y-2">
        {targets.map(t => {
          const latestTask = getLatestTaskForTarget(t.id);
          const isTaskActive = latestTask && ['queued', 'running'].includes(latestTask.status);

          return (
            <div key={t.id} className="border rounded p-3 flex items-center justify-between bg-card">
              <div className="flex flex-col">
                <span className="text-sm font-medium">{t.name}</span>
                <span className="text-xs text-muted-foreground truncate max-w-xs">{t.base_url}</span>
                <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] uppercase tracking-wide text-muted-foreground">{t.auth_type}</span>
                    {latestTask && (
                        <span className={`text-[10px] uppercase px-1.5 py-0.5 rounded-full font-semibold
                            ${latestTask.status === 'completed' ? 'bg-green-100 text-green-800' : ''}
                            ${latestTask.status === 'running' ? 'bg-blue-100 text-blue-800' : ''}
                            ${latestTask.status === 'queued' ? 'bg-yellow-100 text-yellow-800' : ''}
                            ${latestTask.status === 'failed' ? 'bg-red-100 text-red-800' : ''}
                            ${latestTask.status === 'cancelled' ? 'bg-gray-100 text-gray-800' : ''}
                        `}>
                            {latestTask.status}
                        </span>
                    )}
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => runAction(t, 'login_and_scrape')}
                  disabled={runningId === t.id || isTaskActive}
                  className="btn btn-primary btn-xs"
                >
                  {isTaskActive ? latestTask.status : "Run Login & Scrape"}
                </button>
                {isTaskActive && latestTask && (
                  <button
                    onClick={() => cancelTask(latestTask.id)}
                    className="btn btn-error btn-xs"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </div>
          );
        })}
        {!targets.length && !loading && (
          <div className="text-xs text-muted-foreground">No integrations yet.</div>
        )}
      </div>
    </div>
  );
}
