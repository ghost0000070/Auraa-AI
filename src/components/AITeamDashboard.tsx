import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, doc, getDoc, query, where, orderBy, updateDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/firebase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { toast } from "sonner";
import { 
  Activity, 
  Code, 
  ChevronDown,
  ChevronUp,
  AlertCircle
} from 'lucide-react';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Button } from '@/components/ui/button';

interface AgentTask {
  id: string;
  action: string;
  status: 'success' | 'running' | 'queued' | 'error';
  parameters: {
    url?: string;
    [key: string]: unknown;
  };
  result?: unknown;
  error?: string;
  finished_at?: Timestamp;
  createdAt: Timestamp;
}

interface Communication {
  id: string;
  sender_employee: string;
  recipient_employee: string;
  content: string;
  is_read: boolean;
  created_at?: Timestamp;
}

interface Metric {
  id: string;
  name: string;
  value: number;
  timestamp: Timestamp;
}

const AITeamDashboard = () => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<AgentTask[]>([]);
  const [communications, setCommunications] = useState<Communication[]>([]);
  const [metrics, setMetrics] = useState<Metric[]>([]);
  const [expandedTask, setExpandedTask] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      const tasksQuery = query(
        collection(db, 'agent_tasks'),
        where('owner_user', '==', user.uid),
        orderBy('createdAt', 'desc')
      );
      
      const commsQuery = query(
        collection(db, 'ai_team_communications'),
        where('user_id', '==', user.uid),
        orderBy('created_at', 'desc')
      );

      const metricsQuery = query(
        collection(db, 'agent_metrics'),
        where('user_id', '==', user.uid),
        orderBy('timestamp', 'desc')
      );

      const unsubscribeTasks = onSnapshot(tasksQuery, (snapshot) => {
        const tasksData = snapshot.docs.map(docSnapshot => ({ id: docSnapshot.id, ...docSnapshot.data() } as AgentTask));
        setTasks(tasksData);
      }, (error) => {
        console.error("Error fetching agent tasks: ", error);
        toast.error("Failed to fetch agent tasks.");
      });

      const unsubscribeComms = onSnapshot(commsQuery, async (snapshot) => {
        try {
          const commsData = await Promise.all(snapshot.docs.map(async (docSnapshot) => {
            const comm = { id: docSnapshot.id, ...docSnapshot.data() } as Communication;
            if (!comm.is_read && comm.recipient_employee === 'User') {
              let senderName = comm.sender_employee;
              if(senderName && senderName !== 'System') {
                  try {
                      const employeeDocRef = doc(db, 'aiEmployees', senderName);
                      const employeeDoc = await getDoc(employeeDocRef);
                      if (employeeDoc.exists()) {
                          const employeeData = employeeDoc.data() as { name?: string };
                          if (employeeData?.name) {
                            senderName = employeeData.name;
                          }
                      }
                  } catch(e) {
                      console.error(`Error fetching employee document for ${senderName}:`, e);
                      // Fallback to original sender name
                  }
              }

              toast(`New Message from ${senderName}`, {
                description: comm.content,
              });
              await updateDoc(docSnapshot.ref, { is_read: true });
            }
            return comm;
          }));
          setCommunications(commsData);
        } catch (error) {
          console.error("Error processing communications: ", error);
          toast.error("Failed to process team communications.");
        }
      }, (error) => {
        console.error("Error fetching team communications: ", error);
        toast.error("Failed to fetch team communications.");
      });

      const unsubscribeMetrics = onSnapshot(metricsQuery, (snapshot) => {
        const metricsData = snapshot.docs.map(docSnapshot => ({ id: docSnapshot.id, ...docSnapshot.data() } as Metric));
        setMetrics(metricsData);
      }, (error) => {
        console.error("Error fetching performance metrics: ", error);
        toast.error("Failed to fetch performance metrics.");
      });

      return () => {
        unsubscribeTasks();
        unsubscribeComms();
        unsubscribeMetrics();
      };
    }
  }, [user]);

  const getStatusColor = (status: AgentTask['status']) => {
    switch (status) {
      case 'success':
        return 'bg-green-500';
      case 'running':
        return 'bg-blue-500';
      case 'queued':
        return 'bg-yellow-500';
      case 'error':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };
  
  const getIconForAction = (action: string) => {
    switch(action) {
      case 'scrape_dashboard':
      case 'login_and_scrape':
        return <Activity className="h-5 w-5 mr-2" />;
      default:
        return <Code className="h-5 w-5 mr-2" />;
    }
  }

  const toggleExpand = (taskId: string) => {
    setExpandedTask(expandedTask === taskId ? null : taskId);
  };

  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>AI Agent Tasks</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 max-h-[600px] overflow-y-auto">
            {tasks.map((task) => (
              <Collapsible key={task.id} open={expandedTask === task.id} onOpenChange={() => toggleExpand(task.id)}>
                <Card className="w-full">
                  <CollapsibleTrigger asChild>
                    <div className="flex justify-between items-center p-4 cursor-pointer">
                      <div className="flex items-center">
                        {getIconForAction(task.action)}
                        <span className="font-semibold">{task.action?.replace(/_/g, ' ')}</span>
                      </div>
                      <div className="flex items-center">
                        <Badge className={`${getStatusColor(task.status)} text-white`}>{task.status}</Badge>
                        <Button variant="ghost" size="sm">
                          {expandedTask === task.id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="p-4 border-t">
                      <p><strong>URL:</strong> {task.parameters?.url}</p>
                      {task.result && <p><strong>Result:</strong> <pre className="whitespace-pre-wrap break-all max-h-60 overflow-auto">{JSON.stringify(task.result, null, 2)}</pre></p>}
                      {task.error && <p className="text-red-500"><strong>Error:</strong> {task.error}</p>}
                      <p className="text-sm text-gray-500 mt-2">
                        Last Run: {task.finished_at ? new Date(task.finished_at.seconds * 1000).toLocaleString() : 'N/A'}
                      </p>
                    </div>
                  </CollapsibleContent>
                </Card>
              </Collapsible>
            ))}
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Team Communications</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 max-h-[600px] overflow-y-auto">
            {communications.map((comm) => (
              <div key={comm.id} className="p-3 bg-gray-50 rounded-lg">
                <div className="flex justify-between">
                  <p className="font-bold text-sm">
                    {comm.sender_employee === 'User' ? 'You' : comm.sender_employee} 
                    <span className="font-normal"> to </span> 
                    {comm.recipient_employee === 'User' ? 'You' : comm.recipient_employee}
                  </p>
                  <span className="text-xs text-gray-500">
                    {comm.created_at ? new Date(comm.created_at.seconds * 1000).toLocaleTimeString() : ''}
                  </span>
                </div>
                <p className="text-sm mt-1">{comm.content}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="lg:col-span-3">
        <CardHeader>
          <CardTitle>Performance Metrics</CardTitle>
        </CardHeader>
        <CardContent>
           <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              {metrics.slice(0, 4).map(metric => (
                <Card key={metric.id}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">{metric.name}</CardTitle>
                        {metric.name === 'Tasks Failed' && metric.value > 0 ? <AlertCircle className="h-4 w-4 text-red-500"/> : <Activity className="h-4 w-4 text-muted-foreground"/>}
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{metric.value}</div>
                        <p className="text-xs text-muted-foreground">
                            {metric.timestamp ? new Date(metric.timestamp.seconds * 1000).toLocaleDateString() : ''}
                        </p>
                    </CardContent>
                </Card>
              ))}
           </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AITeamDashboard;
