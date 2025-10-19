
import { useEffect, useState } from 'react';
import { db } from '@/firebase'; // Assuming you have a firebase config file
import { collection, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '@/hooks/useAuth';
import { functions } from '@/firebase'; // Assuming you have a firebase config file
import { httpsCallable } from 'firebase/functions';

// Note: You'll need to define the shape of your data in Firestore.
// This is an example based on the Supabase types.
interface Target {
  id: string;
  name: string;
  base_url: string;
  auth_type: string;
  created_at: any;
}

interface AgentTask {
  id: string;
  target_id: string;
  status: 'queued' | 'running' | 'completed' | 'failed' | 'cancelled';
  created_at: any;
}

export function FirebaseWebsiteIntegrations() {
  const { user } = useAuth();
  const [targets, setTargets] = useState<Target[]>([]);
  const [tasks, setTasks] = useState<AgentTask[]>([]);
  const [loading, setLoading] = useState(false);
  const [runningId, setRunningId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    if (!user) {
      setLoading(false);
      return;
    }
    try {
      const targetsCollection = collection(db, 'integration_targets');
      const targetsSnapshot = await getDocs(targetsCollection);
      const targetsData = targetsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Target));
      setTargets(targetsData.sort((a, b) => b.created_at.toMillis() - a.created_at.toMillis()));

      // You would also fetch tasks associated with these targets
      // For simplicity, this is not shown here, but you would use a similar pattern to fetch tasks
      // and update the `tasks` state.

    } catch (error) {
      console.error("Error loading integration targets: ", error);
      setMessage("Failed to load integration targets.");
    }
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, [user]);

  async function runAction(target: Target, action: string) {
    if (!user) return;
    setRunningId(target.id);
    setMessage(null);
    try {
      const agentRun = httpsCallable(functions, 'agent-run');
      const result = await agentRun({
        target_id: target.id,
        action: action,
      });
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
      const agentCancel = httpsCallable(functions, 'agent-cancel');
      await agentCancel({ task_id: taskId });
      setMessage('Cancellation request sent.');
    } catch (e: any) {
      setMessage(`Error: ${e.message}`);
    }
  }

  const getLatestTaskForTarget = (targetId: string): AgentTask | undefined => {
    return tasks
      .filter(t => t.target_id === targetId)
      .sort((a, b) => b.created_at.toMillis() - a.created_at.toMillis())[0];
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
