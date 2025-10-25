import { useEffect, useState, useCallback } from 'react';
import { db, functions } from '@/firebase';
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';
import { useAuth } from '@/hooks/useAuth';
import { httpsCallable } from 'firebase/functions';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from "@/components/ui/sonner";
import { Loader2 } from 'lucide-react';

interface IntegrationTarget {
  id: string;
  name: string;
  base_url: string;
  auth_type: string;
  createdAt: any;
}

interface AgentTask {
  id: string;
  target_id: string;
  status: 'queued' | 'running' | 'completed' | 'failed' | 'cancelled';
  createdAt: any;
}

export function FirebaseWebsiteIntegrations() {
  const { user } = useAuth();
  const [targets, setTargets] = useState<IntegrationTarget[]>([]);
  const [tasks, setTasks] = useState<AgentTask[]>([]);
  const [loading, setLoading] = useState(false);
  const [runningId, setRunningId] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const targetsQuery = query(collection(db, 'integration_targets'), where('userId', '==', user.uid), orderBy('createdAt', 'desc'));
      const tasksQuery = query(collection(db, 'agent_tasks'), where('userId', '==', user.uid), orderBy('createdAt', 'desc'));
      
      const [targetsSnapshot, tasksSnapshot] = await Promise.all([getDocs(targetsQuery), getDocs(tasksQuery)]);
      
      const targetsData = targetsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as IntegrationTarget));
      const tasksData = tasksSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AgentTask));
      
      setTargets(targetsData);
      setTasks(tasksData);
      
    } catch (error) {
      console.error("Error loading integrations: ", error);
      toast.error("Error", { description: "Failed to load website integrations." });
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    load();
  }, [load]);

  async function runAction(target: IntegrationTarget, action: string) {
    if (!user) return;
    setRunningId(target.id);
    try {
      const agentRun = httpsCallable(functions, 'agentRun');
      await agentRun({ targetId: target.id, action });
      toast.info("Task Queued", { description: `Action "${action}" has been queued for ${target.name}.` });
    } catch (e) {
      toast.error("Error", { description: (e as Error).message });
    } finally {
      setRunningId(null);
    }
  }

  async function cancelTask(taskId: string) {
    try {
      const agentCancel = httpsCallable(functions, 'agentCancel');
      await agentCancel({ taskId });
      toast.info("Cancellation Sent", { description: "A request to cancel the task has been sent." });
    } catch (e) {
      toast.error("Error", { description: (e as Error).message });
    }
  }

  const getLatestTaskForTarget = (targetId: string): AgentTask | undefined => {
    return tasks.filter(t => t.target_id === targetId)[0];
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Website Integrations</h2>
        <Button onClick={load} variant="outline" size="sm" disabled={loading}>
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Refresh'}
        </Button>
      </div>
      <div className="space-y-3">
        {targets.map(t => {
          const latestTask = getLatestTaskForTarget(t.id);
          const isTaskActive = latestTask && ['queued', 'running'].includes(latestTask.status);

          return (
            <div key={t.id} className="border rounded-lg p-4 flex items-center justify-between bg-card">
              <div>
                <p className="font-semibold">{t.name}</p>
                <p className="text-sm text-muted-foreground">{t.base_url}</p>
                <div className="flex items-center gap-2 mt-2">
                    <Badge variant="secondary">{t.auth_type}</Badge>
                    {latestTask && <Badge variant={
                      latestTask.status === 'completed' ? 'default' :
                      latestTask.status === 'failed' ? 'destructive' : 'secondary'
                    }>{latestTask.status}</Badge>}
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => runAction(t, 'login_and_scrape')}
                  disabled={!!runningId || isTaskActive}
                  size="sm"
                >
                  {runningId === t.id ? <Loader2 className="w-4 h-4 animate-spin" /> : (isTaskActive ? 'Running...' : "Run Scrape")}
                </Button>
                {isTaskActive && latestTask && (
                  <Button onClick={() => cancelTask(latestTask.id)} variant="destructive" size="sm">
                    Cancel
                  </Button>
                )}
              </div>
            </div>
          );
        })}
        {!targets.length && !loading && (
          <p className="text-sm text-muted-foreground text-center py-4">No website integrations found.</p>
        )}
      </div>
    </div>
  );
}
