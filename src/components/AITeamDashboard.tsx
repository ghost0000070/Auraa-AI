import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, doc, getDoc, query, where, orderBy, updateDoc, Timestamp, limit } from 'firebase/firestore';
import { db } from '@/firebase';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { toast } from "sonner";
import { 
  Activity, 
  Code, 
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Users,
  CheckCircle,
  Clock,
  TrendingUp,
  MessageSquare
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

interface Employee {
  id: string;
  name: string;
  role: string;
  status: 'active' | 'idle' | 'offline';
  avatar?: string;
  currentTask?: string;
}

const AITeamDashboard = () => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<AgentTask[]>([]);
  const [communications, setCommunications] = useState<Communication[]>([]);
  const [metrics, setMetrics] = useState<Metric[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
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

      const employeesQuery = query(
        collection(db, 'aiEmployees'), // Assuming this is the collection for employees
        where('userId', '==', user.uid)
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

      const unsubscribeEmployees = onSnapshot(employeesQuery, (snapshot) => {
        const employeesData = snapshot.docs.map(docSnapshot => ({ 
            id: docSnapshot.id, 
            ...docSnapshot.data(),
            // Mocking some data if not present in DB yet for visualization
            status: docSnapshot.data().status || 'idle',
            role: docSnapshot.data().role || 'AI Agent'
        } as Employee));
        setEmployees(employeesData);
      });

      return () => {
        unsubscribeTasks();
        unsubscribeComms();
        unsubscribeMetrics();
        unsubscribeEmployees();
      };
    }
  }, [user]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
      case 'active':
        return 'bg-green-500';
      case 'running':
      case 'idle':
        return 'bg-blue-500';
      case 'queued':
        return 'bg-yellow-500';
      case 'error':
      case 'offline':
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

  // Calculate stats for charts
  const taskStatusCounts = tasks.reduce((acc, task) => {
    acc[task.status] = (acc[task.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const totalTasks = tasks.length;

  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
      
      {/* Team Overview Section */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Team Overview</CardTitle>
          <CardDescription>Current status of your AI workforce</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {employees.length === 0 ? (
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

      {/* Task Distribution / Stats */}
      <Card>
        <CardHeader>
            <CardTitle>Task Distribution</CardTitle>
        </CardHeader>
        <CardContent>
            <div className="space-y-4">
                <div className="flex justify-between items-center text-sm">
                    <span className="flex items-center"><CheckCircle className="w-4 h-4 mr-2 text-green-500"/> Success</span>
                    <span>{taskStatusCounts['success'] || 0}</span>
                </div>
                <Progress value={totalTasks > 0 ? ((taskStatusCounts['success'] || 0) / totalTasks) * 100 : 0} className="h-2" />
                
                <div className="flex justify-between items-center text-sm">
                    <span className="flex items-center"><Activity className="w-4 h-4 mr-2 text-blue-500"/> Running</span>
                    <span>{taskStatusCounts['running'] || 0}</span>
                </div>
                 <Progress value={totalTasks > 0 ? ((taskStatusCounts['running'] || 0) / totalTasks) * 100 : 0} className="h-2" />

                <div className="flex justify-between items-center text-sm">
                    <span className="flex items-center"><Clock className="w-4 h-4 mr-2 text-yellow-500"/> Queued</span>
                    <span>{taskStatusCounts['queued'] || 0}</span>
                </div>
                 <Progress value={totalTasks > 0 ? ((taskStatusCounts['queued'] || 0) / totalTasks) * 100 : 0} className="h-2" />

                <div className="flex justify-between items-center text-sm">
                    <span className="flex items-center"><AlertCircle className="w-4 h-4 mr-2 text-red-500"/> Failed</span>
                    <span>{taskStatusCounts['error'] || 0}</span>
                </div>
                 <Progress value={totalTasks > 0 ? ((taskStatusCounts['error'] || 0) / totalTasks) * 100 : 0} className="h-2" />
            </div>
        </CardContent>
      </Card>

      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>AI Agent Tasks</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 max-h-[600px] overflow-y-auto">
            {tasks.length === 0 ? (
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
            {communications.length === 0 ? (
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
              {metrics.length === 0 ? (
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

// Helper for relative time if not imported
import { formatDistanceToNow } from 'date-fns';
import { ArrowRight } from 'lucide-react';

export default AITeamDashboard;
