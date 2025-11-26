import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, query, where, orderBy, doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/firebase';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { toast } from "sonner";
import { formatDistanceToNow } from 'date-fns';
import { 
  Activity, Code, ChevronDown, ChevronUp, AlertCircle, ArrowRight, CheckCircle, Clock, TrendingUp, MessageSquare, Loader2 
} from 'lucide-react';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Button } from '@/components/ui/button';
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface AgentTask {
  id: string;
  action: string;
  status: 'success' | 'running' | 'queued' | 'error';
  parameters: { url?: string; [key: string]: unknown; };
  result?: unknown;
  error?: string;
  finished_at?: { seconds: number; nanoseconds: number; };
  createdAt: { seconds: number; nanoseconds: number; };
}

interface Communication {
  id: string;
  sender_employee: string;
  recipient_employee: string;
  content: string;
  is_read: boolean;
  created_at?: { seconds: number; nanoseconds: number; };
}

interface Metric {
  id: string;
  name: string;
  value: number;
  timestamp: { seconds: number; nanoseconds: number; };
}

interface Employee {
  id: string;
  name: string;
  role: string;
  status: 'active' | 'idle' | 'offline';
  avatar?: string;
  currentTask?: string;
}

const AITeamDashboard: React.FC = () => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<AgentTask[]>([]);
  const [communications, setCommunications] = useState<Communication[]>([]);
  const [metrics, setMetrics] = useState<Metric[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [expandedTask, setExpandedTask] = useState<string | null>(null);
  const [loading, setLoading] = useState<Record<string, boolean>>({
    tasks: true, comms: true, metrics: true, employees: true
  });

  const handleLoading = (section: string, status: boolean) => {
    setLoading(prev => ({...prev, [section]: status}));
  }
  
  const allDataLoaded = Object.values(loading).every(v => !v);

  useEffect(() => {
    if (user) {
      const collections = [
        { name: 'agent_tasks', stateSetter: setTasks, orderByField: 'createdAt' },
        { name: 'ai_team_communications', stateSetter: setCommunications, orderByField: 'created_at' },
        { name: 'agent_metrics', stateSetter: setMetrics, orderByField: 'timestamp' },
        { name: 'aiEmployees', stateSetter: setEmployees, isUserScoped: true },
      ];

      const unsubscribes = collections.map(({ name, stateSetter, orderByField, isUserScoped }) => {
        handleLoading(name, true);
        const userField = isUserScoped ? 'userId' : 'owner_user';
        
        let q = query(
          collection(db, name),
          where(userField, '==', user.uid)
        );

        if(orderByField) {
            q = query(q, orderBy(orderByField, 'desc'));
        }

        return onSnapshot(q, async (snapshot) => {
          const data = await Promise.all(snapshot.docs.map(async (docSnapshot) => {
            const item = { id: docSnapshot.id, ...docSnapshot.data() };
            if (name === 'ai_team_communications' && !item.is_read) {
              await handleNewCommunication(item as Communication, docSnapshot.ref);
            }
            return item;
          }));
          stateSetter(data as never);
          handleLoading(name, false);
        }, (error) => {
          console.error(`Error fetching ${name}: `, error);
          toast.error(`Failed to fetch ${name.replace(/_/g, ' ')}.`);
          handleLoading(name, false);
        });
      });

      return () => unsubscribes.forEach(unsub => unsub());
    }
  }, [user]);

  async function handleNewCommunication(comm: Communication, ref: unknown) {
      let senderName = comm.sender_employee;
      if(senderName && senderName !== 'System' && senderName !== 'User') {
          try {
              const employeeDoc = await getDoc(doc(db, 'aiEmployees', senderName));
              if (employeeDoc.exists()) {
                  senderName = employeeDoc.data().name || senderName;
              }
          } catch(e) {
              console.error(`Error fetching employee name for ${senderName}:`, e);
          }
      }
      toast(`New Message from ${senderName}`, { description: comm.content });
      await updateDoc(ref, { is_read: true });
  }

  // Render helpers and constants
  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      success: 'bg-green-500', active: 'bg-green-500',
      running: 'bg-blue-500', idle: 'bg-blue-500',
      queued: 'bg-yellow-500',
      error: 'bg-red-500', offline: 'bg-red-500',
      default: 'bg-gray-500'
    }
    return colors[status] || colors.default;
  };
  
  const getIconForAction = (action: string) => {
    const icons: Record<string, React.ReactNode> = {
      'scrape_dashboard': <Activity className="h-5 w-5 mr-2" />,
      'login_and_scrape': <Activity className="h-5 w-5 mr-2" />
    }
    return icons[action] || <Code className="h-5 w-5 mr-2" />;
  }

  const toggleExpand = (taskId: string) => {
    setExpandedTask(expandedTask === taskId ? null : taskId);
  };

  const taskStatusCounts = tasks.reduce((acc, task) => {
    acc[task.status] = (acc[task.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const totalTasks = tasks.length;

  if (!allDataLoaded) {
      return (
          <div className="flex justify-center items-center min-h-[400px]">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="ml-2">Loading dashboard data...</p>
          </div>
      );
  }

  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Team Overview</CardTitle>
          <CardDescription>Current status of your AI workforce</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {loading.employees ? <p>Loading employees...</p> : employees.length === 0 ? (
                 <div className="col-span-2 text-center text-gray-500 py-8">
                    No employees found. Deploy an agent to see them here.
                 </div>
            ) : (
                employees.map(employee => (
                    <div key={employee.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center space-x-3">
                            <Avatar>
                                <AvatarImage src={employee.avatar} />
                                <AvatarFallback>{employee.name.substring(0,2).toUpperCase()}</AvatarFallback>
                            </Avatar>
                            <div>
                                <p className="font-semibold">{employee.name}</p>
                                <p className="text-xs text-gray-500">{employee.role}</p>
                            </div>
                        </div>
                        <div className="flex flex-col items-end">
                            <Badge className={`${getStatusColor(employee.status)} text-white mb-1`}>
                                {employee.status}
                            </Badge>
                            {employee.currentTask && (
                                <span className="text-xs text-gray-500 truncate max-w-[150px]">
                                    {employee.currentTask}
                                </span>
                            )}
                        </div>
                    </div>
                ))
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
            <CardTitle>Task Distribution</CardTitle>
        </CardHeader>
        <CardContent>
            {loading.tasks ? <p>Loading tasks...</p> : totalTasks === 0 ? <p className='text-center text-gray-500'>No tasks yet.</p> : (
                <div className="space-y-4">
                    <div className="flex justify-between items-center text-sm">
                        <span className="flex items-center"><CheckCircle className="w-4 h-4 mr-2 text-green-500"/> Success</span>
                        <span>{taskStatusCounts['success'] || 0}</span>
                    </div>
                    <Progress value={(taskStatusCounts['success'] || 0) / totalTasks * 100} className="h-2" />
                    
                    <div className="flex justify-between items-center text-sm">
                        <span className="flex items-center"><Activity className="w-4 h-4 mr-2 text-blue-500"/> Running</span>
                        <span>{taskStatusCounts['running'] || 0}</span>
                    </div>
                    <Progress value={(taskStatusCounts['running'] || 0) / totalTasks * 100} className="h-2" />

                    <div className="flex justify-between items-center text-sm">
                        <span className="flex items-center"><Clock className="w-4 h-4 mr-2 text-yellow-500"/> Queued</span>
                        <span>{taskStatusCounts['queued'] || 0}</span>
                    </div>
                    <Progress value={(taskStatusCounts['queued'] || 0) / totalTasks * 100} className="h-2" />

                    <div className="flex justify-between items-center text-sm">
                        <span className="flex items-center"><AlertCircle className="w-4 h-4 mr-2 text-red-500"/> Failed</span>
                        <span>{taskStatusCounts['error'] || 0}</span>
                    </div>
                    <Progress value={(taskStatusCounts['error'] || 0) / totalTasks * 100} className="h-2" />
                </div>
            )}
        </CardContent>
      </Card>
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>AI Agent Tasks</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 max-h-[600px] overflow-y-auto">
            {loading.tasks ? <p>Loading tasks...</p> : tasks.length === 0 ? (
                 <div className="text-center text-gray-500 py-8">No tasks recorded yet.</div>
            ) : (
                tasks.map((task) => (
                <Collapsible key={task.id} open={expandedTask === task.id} onOpenChange={() => toggleExpand(task.id)}>
                    <Card className="w-full">
                        <CollapsibleTrigger asChild>
                            <div className="flex justify-between items-center p-4 cursor-pointer hover:bg-gray-50 transition-colors">
                                <div className="flex items-center">
                                    {getIconForAction(task.action)}
                                    <span className="font-semibold">{task.action?.replace(/_/g, ' ')}</span>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <span className="text-xs text-gray-400 hidden sm:inline-block">
                                        {task.createdAt ? new Date(task.createdAt.seconds * 1000).toLocaleString() : ''}
                                    </span>
                                    <Badge className={`${getStatusColor(task.status)} text-white`}>{task.status}</Badge>
                                    <Button variant="ghost" size="sm" className="p-0 w-8 h-8">
                                    {expandedTask === task.id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                                    </Button>
                                </div>
                            </div>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                            <div className="p-4 border-t bg-gray-50/50">
                                <p className="mb-2"><strong>ID:</strong> <span className="text-xs font-mono">{task.id}</span></p>
                                {task.parameters?.url && <p className="mb-2"><strong>Target:</strong> <a href={task.parameters.url} target="_blank" rel="noreferrer" className="text-blue-500 hover:underline">{task.parameters.url}</a></p>}
                                
                                {task.result && (
                                    <div className="mt-2">
                                        <strong>Result:</strong>
                                        <pre className="mt-1 p-2 bg-gray-900 text-gray-100 rounded text-xs overflow-auto max-h-60">
                                            {JSON.stringify(task.result, null, 2)}
                                        </pre>
                                    </div>
                                )}
                                
                                {task.error && (
                                    <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
                                        <strong>Error:</strong> {task.error}
                                    </div>
                                )}
                                
                                <p className="text-xs text-gray-500 mt-2 text-right">
                                    Finished: {task.finished_at ? new Date(task.finished_at.seconds * 1000).toLocaleString() : 'N/A'}
                                </p>
                            </div>
                        </CollapsibleContent>
                    </Card>
                </Collapsible>
                ))
            )}
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Team Communications</CardTitle>
          <CardDescription>Real-time agent interactions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
            {loading.comms ? <p>Loading communications...</p> : communications.length === 0 ? (
                <div className="text-center text-gray-500 py-8 flex flex-col items-center">
                    <MessageSquare className="w-8 h-8 mb-2 opacity-20"/>
                    <p>No communications yet.</p>
                </div>
            ) : (
                communications.map((comm) => (
                <div key={comm.id} className="p-3 bg-white border rounded-lg shadow-sm">
                    <div className="flex justify-between items-start mb-1">
                    <div className="flex items-center space-x-1">
                        <span className="font-bold text-xs text-primary">
                            {comm.sender_employee === 'User' ? 'You' : comm.sender_employee} 
                        </span>
                        <ArrowRight className="w-3 h-3 text-gray-400"/>
                        <span className="font-bold text-xs text-primary">
                            {comm.recipient_employee === 'User' ? 'You' : comm.recipient_employee}
                        </span>
                    </div>
                    <span className="text-[10px] text-gray-400 whitespace-nowrap ml-2">
                        {comm.created_at ? formatDistanceToNow(new Date(comm.created_at.seconds * 1000), { addSuffix: true }) : ''}
                    </span>
                    </div>
                    <p className="text-sm text-gray-700 leading-snug">{comm.content}</p>
                </div>
                ))
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="lg:col-span-3">
        <CardHeader>
          <CardTitle>Performance Metrics</CardTitle>
        </CardHeader>
        <CardContent>
           <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              {loading.metrics ? <p>Loading metrics...</p> : metrics.length === 0 ? (
                  <div className="col-span-4 text-center text-gray-500 py-4">No metrics available.</div>
              ) : (
                  metrics.slice(0, 4).map(metric => (
                    <Card key={metric.id}>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium truncate" title={metric.name}>{metric.name}</CardTitle>
                            {metric.name.toLowerCase().includes('failed') || metric.name.toLowerCase().includes('error') ? <AlertCircle className="h-4 w-4 text-red-500"/> : <TrendingUp className="h-4 w-4 text-green-500"/>}
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{metric.value}</div>
                            <p className="text-xs text-muted-foreground">
                                {metric.timestamp ? new Date(metric.timestamp.seconds * 1000).toLocaleDateString() : ''}
                            </p>
                        </CardContent>
                    </Card>
                  ))
              )}
           </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AITeamDashboard;
