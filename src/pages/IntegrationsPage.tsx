import React, { useState } from 'react';
import AddWebsiteIntegration from '@/components/integrations/AddWebsiteIntegration';
import { WebsiteIntegrations } from '@/components/integrations/WebsiteIntegrations';
import { useAgentTasks } from '@/hooks/useAgentTasks';
import { useAgentRealtime } from '@/hooks/useAgentRealtime';
import { AgentMetricsDashboard } from '@/components/integrations/AgentMetricsDashboard';
import PuterIntegration from "@/components/PuterIntegration";
import { useAuth } from '@/hooks/useAuth';
import { Header } from '@/components/Header';

export default function IntegrationsPage() {
  const { user } = useAuth();
  const { tasks } = useAgentTasks();
  const { tasks: rtTasks, events } = useAgentRealtime();
  const [selectedTask, setSelectedTask] = useState<string | null>(null);

  return (
    <>
      <Header />
      <div className="container mx-auto py-6 space-y-8 pt-24">
        <h1 className="text-3xl font-bold mb-6">Integrations</h1>
        <AgentMetricsDashboard />
      <PuterFirebaseIntegration />
      {user && (
        <div className="grid md:grid-cols-3 gap-6">
          <div className="md:col-span-1">
            <AddWebsiteIntegration userId={user.id} onIntegrationAdded={() => { /* could trigger reload via context if needed */ }} />
          </div>
          <div className="md:col-span-2">
            <WebsiteIntegrations />
          </div>
        </div>
      )}
      <div>
        <h3 className="font-semibold text-sm mb-2">Recent Agent Tasks (Live)</h3>
        <div className="space-y-1 max-h-64 overflow-auto border rounded p-2 bg-card">
          {rtTasks.map(t => (
            <button key={t.id} onClick={()=>setSelectedTask(t.id)} className={`text-xs flex justify-between w-full text-left ${selectedTask===t.id?'bg-accent/40':''}`}>
              <span className="truncate max-w-[60%]">{t.action}</span>
              <span className="uppercase tracking-wide">{t.status}</span>
            </button>
          ))}
          {!rtTasks.length && <div className="text-xs text-muted-foreground">No tasks.</div>}
        </div>
        {selectedTask && (
          <div className="mt-4 border rounded bg-card p-2 max-h-72 overflow-auto">
            <h4 className="font-medium text-xs mb-2">Events</h4>
            {(events[selectedTask] || []).map(ev => (
              <div key={ev.id} className="text-[11px] flex gap-2">
                <span className="text-muted-foreground">{ev.timestamp?.toDate().toLocaleTimeString()}</span>
                <span className={`uppercase ${ev.level==='error'?'text-red-500':ev.level==='warn'?'text-yellow-500':'text-muted-foreground'}`}>{ev.level}</span>
                <span>{ev.message}</span>
              </div>
            ))}
            {!events[selectedTask]?.length && <div className="text-[11px] text-muted-foreground">No events yet.</div>}
          </div>
        )}
      </div>
      <div>
        <h3 className="font-semibold text-sm mb-2">Recent Agent Tasks</h3>
        <div className="space-y-1 max-h-64 overflow-auto border rounded p-2 bg-card">
          {tasks.map(t => (
            <div key={t.id} className="text-xs flex justify-between">
              <span className="truncate max-w-[60%]">{t.action}</span>
              <span className="uppercase tracking-wide">{t.status}</span>
            </div>
          ))}
          {!tasks.length && <div className="text-xs text-muted-foreground">No tasks.</div>}
        </div>
      </div>
      </div>
    </>
  );
}
