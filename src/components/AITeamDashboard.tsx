import React, { useState, useEffect } from 'react';
import { supabase } from '@/supabase';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { toast } from "sonner";
import { formatDistanceToNow } from 'date-fns';
import { 
  Activity, Code, ChevronDown, ChevronUp, AlertCircle, ArrowRight, CheckCircle, Clock, TrendingUp, MessageSquare, Loader2, Rocket, Bot, Zap, XCircle, AlertTriangle
} from 'lucide-react';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Button } from '@/components/ui/button';
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useNavigate } from 'react-router-dom';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

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
  category: string;
  status: 'active' | 'idle' | 'offline';
  template_id?: string;
  created_at?: string;
}

interface DeploymentRequest {
  id: string;
  createdAt: Date;
  status: string;
  employeeName: string;
  employeeCategory?: string;
}

const AITeamDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tasks, setTasks] = useState<AgentTask[]>([]);
  const [communications, setCommunications] = useState<Communication[]>([]);
  const [metrics, setMetrics] = useState<Metric[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [requests, setRequests] = useState<DeploymentRequest[]>([]);
  const [expandedTask, setExpandedTask] = useState<string | null>(null);
  const [loading, setLoading] = useState<Record<string, boolean>>({
    tasks: true, comms: true, metrics: true, employees: true, requests: true
  });

  const handleLoading = (section: string, status: boolean) => {
    setLoading(prev => ({...prev, [section]: status}));
  }
  
  const allDataLoaded = Object.values(loading).every(v => !v);

  useEffect(() => {
    if (!user) return;

    const loadData = async () => {
      try {
        // Load tasks
        handleLoading('tasks', true);
        const { data: tasksData } = await supabase
          .from('agent_tasks')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });
        if (tasksData) setTasks(tasksData as any[]);
        handleLoading('tasks', false);

        // Load communications
        handleLoading('comms', true);
        const { data: commsData } = await supabase
          .from('ai_team_communications')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });
        if (commsData) {
          setCommunications(commsData as any[]);
          // Handle unread messages
          const unreadComms = commsData.filter((c: any) => !c.is_read);
          for (const comm of unreadComms) {
            toast(`New Message from ${comm.sender_employee}`, { description: comm.content });
          }
          // Mark as read
          if (unreadComms.length > 0) {
            await supabase
              .from('ai_team_communications')
              .update({ is_read: true })
              .in('id', unreadComms.map((c: any) => c.id));
          }
        }
        handleLoading('comms', false);

        // Load metrics
        handleLoading('metrics', true);
        const { data: metricsData } = await supabase
          .from('agent_metrics')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });
        if (metricsData) setMetrics(metricsData as any[]);
        handleLoading('metrics', false);

        // Load deployed employees (not ai_employees which is templates)
        handleLoading('employees', true);
        const { data: employeesData, error: employeesError } = await supabase
          .from('deployed_employees')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });
        
        if (employeesError) {
          console.error('Error loading employees:', employeesError);
        }
        if (employeesData) setEmployees(employeesData as any[]);
        handleLoading('employees', false);

        // Load deployment requests
        handleLoading('requests', true);
        const { data: requestsData } = await supabase
          .from('deployment_requests')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(10);
        
        if (requestsData) {
          setRequests(requestsData.map((r: any) => ({
            id: r.id,
            createdAt: new Date(r.created_at),
            status: r.status,
            employeeName: r.employee_name,
            employeeCategory: r.employee_category
          })));
        }
        handleLoading('requests', false);

      } catch (error) {
        console.error('Error loading dashboard data:', error);
        Object.keys(loading).forEach(key => handleLoading(key, false));
      }
    };

    loadData();

    // Subscribe to real-time updates
    const tasksChannel = supabase
      .channel('tasks_rt')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'agent_tasks', filter: `user_id=eq.${user.id}` },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setTasks(prev => [payload.new as any, ...prev]);
          } else if (payload.eventType === 'UPDATE') {
            setTasks(prev => prev.map(t => t.id === payload.new.id ? payload.new as any : t));
          } else if (payload.eventType === 'DELETE') {
            setTasks(prev => prev.filter(t => t.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    const commsChannel = supabase
      .channel('comms_rt')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'ai_team_communications', filter: `user_id=eq.${user.id}` },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const newComm = payload.new as any;
            setCommunications(prev => [newComm, ...prev]);
            if (!newComm.is_read) {
              toast(`New Message from ${newComm.sender_employee}`, { description: newComm.content });
              supabase.from('ai_team_communications')
                .update({ is_read: true })
                .eq('id', newComm.id)
                .then(({ error }) => {
                  if (error) console.error('Failed to mark message as read:', error);
                });
            }
          } else if (payload.eventType === 'UPDATE') {
            setCommunications(prev => prev.map(c => c.id === payload.new.id ? payload.new as any : c));
          }
        }
      )
      .subscribe();

    const metricsChannel = supabase
      .channel('metrics_rt')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'agent_metrics', filter: `user_id=eq.${user.id}` },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setMetrics(prev => [payload.new as any, ...prev]);
          }
        }
      )
      .subscribe();

    const employeesChannel = supabase
      .channel('employees_rt')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'deployed_employees', filter: `user_id=eq.${user.id}` },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setEmployees(prev => [payload.new as any, ...prev]);
          } else if (payload.eventType === 'UPDATE') {
            setEmployees(prev => prev.map(e => e.id === payload.new.id ? payload.new as any : e));
          } else if (payload.eventType === 'DELETE') {
            setEmployees(prev => prev.filter(e => e.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    const requestsChannel = supabase
      .channel('requests_rt')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'deployment_requests', filter: `user_id=eq.${user.id}` },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const newReq = payload.new as any;
            setRequests(prev => [{
              id: newReq.id,
              createdAt: new Date(newReq.created_at),
              status: newReq.status,
              employeeName: newReq.employee_name,
              employeeCategory: newReq.employee_category
            }, ...prev.slice(0, 9)]);
          } else if (payload.eventType === 'UPDATE') {
            setRequests(prev => prev.map(r => 
              r.id === payload.new.id 
                ? {
                    id: payload.new.id,
                    createdAt: new Date(payload.new.created_at),
                    status: payload.new.status,
                    employeeName: payload.new.employee_name,
                    employeeCategory: payload.new.employee_category
                  }
                : r
            ));
          }
        }
      )
      .subscribe();

    return () => {
      tasksChannel.unsubscribe();
      commsChannel.unsubscribe();
      metricsChannel.unsubscribe();
      employeesChannel.unsubscribe();
      requestsChannel.unsubscribe();
    };
  }, [user]);

  // Render helpers and constants
  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      success: 'bg-green-500', active: 'bg-green-500',
      running: 'bg-blue-500', idle: 'bg-blue-500',
      queued: 'bg-yellow-500',
      error: 'bg-red-500', offline: 'bg-red-500',
      default: 'bg-muted-foreground'
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

  const getRequestStatusUi = (status: string) => {
    const ui: Record<string, { icon: React.ReactElement, color: string }> = {
      pending: { icon: <Clock className="w-4 h-4 text-amber-500" />, color: 'bg-amber-500/20 text-amber-300 border-amber-500/30' },
      completed: { icon: <CheckCircle className="w-4 h-4 text-green-500" />, color: 'bg-green-500/20 text-green-300 border-green-500/30' },
      active: { icon: <Zap className="w-4 h-4 text-green-500" />, color: 'bg-green-500/20 text-green-300 border-green-500/30' },
      failed: { icon: <XCircle className="w-4 h-4 text-red-500" />, color: 'bg-red-500/20 text-red-300 border-red-500/30' },
      inactive: { icon: <XCircle className="w-4 h-4 text-red-500" />, color: 'bg-red-500/20 text-red-300 border-red-500/30' }
    };
    return ui[status] || { icon: <AlertTriangle className="w-4 h-4 text-muted-foreground" />, color: 'bg-muted/20 text-muted-foreground border-muted' };
  };

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
          <CardDescription>Your deployed AI workforce</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {loading.employees ? <p>Loading employees...</p> : employees.length === 0 ? (
                 <div className="col-span-2 flex flex-col items-center justify-center py-12">
                    <div className="bg-slate-700/30 p-4 rounded-full mb-4">
                      <Bot className="h-12 w-12 text-slate-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-white mb-2">No AI Employees Deployed Yet</h3>
                    <p className="text-muted-foreground text-center max-w-md mb-4">
                      Deploy your first AI employee to start automating tasks and boosting productivity.
                    </p>
                    <Button onClick={() => navigate('/marketplace')} className="gap-2">
                      <Rocket className="h-4 w-4" />
                      Deploy Your First AI Employee
                    </Button>
                 </div>
            ) : (
                employees.map(employee => (
                    <div 
                      key={employee.id} 
                      className="flex items-center justify-between p-3 border rounded-lg cursor-pointer hover:bg-slate-800/50 transition-colors"
                      onClick={() => navigate(`/ai-employee/${employee.id}`)}
                    >
                        <div className="flex items-center space-x-3">
                            <Avatar>
                                <AvatarFallback className="bg-primary/20 text-primary">{employee.name?.substring(0,2).toUpperCase() || 'AI'}</AvatarFallback>
                            </Avatar>
                            <div>
                                <p className="font-semibold">{employee.name}</p>
                                <p className="text-xs text-muted-foreground">{employee.category}</p>
                            </div>
                        </div>
                        <div className="flex flex-col items-end">
                            <Badge className={`${getStatusColor(employee.status)} text-white mb-1`}>
                                {employee.status}
                            </Badge>
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
            {loading.tasks ? <p>Loading tasks...</p> : totalTasks === 0 ? <p className='text-center text-muted-foreground'>No tasks yet.</p> : (
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
                 <div className="text-center text-muted-foreground py-8">No tasks recorded yet.</div>
            ) : (
                tasks.map((task) => (
                <Collapsible key={task.id} open={expandedTask === task.id} onOpenChange={() => toggleExpand(task.id)}>
                    <Card className="w-full">
                        <CollapsibleTrigger asChild>
                            <div className="flex justify-between items-center p-4 cursor-pointer hover:bg-secondary/50 transition-colors">
                                <div className="flex items-center">
                                    {getIconForAction(task.action)}
                                    <span className="font-semibold">{task.action?.replace(/_/g, ' ')}</span>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <span className="text-xs text-muted-foreground hidden sm:inline-block">
                                        {task.createdAt ? new Date(task.createdAt).toLocaleString() : (task.created_at ? new Date(task.created_at).toLocaleString() : '')}
                                    </span>
                                    <Badge className={`${getStatusColor(task.status)} text-white`}>{task.status}</Badge>
                                    <Button variant="ghost" size="sm" className="p-0 w-8 h-8">
                                    {expandedTask === task.id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                                    </Button>
                                </div>
                            </div>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                            <div className="p-4 border-t border-border bg-secondary/30">
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
                                    <div className="mt-2 p-2 bg-destructive/10 border border-destructive/30 rounded text-destructive text-sm">
                                        <strong>Error:</strong> {task.error}
                                    </div>
                                )}
                                
                                <p className="text-xs text-muted-foreground mt-2 text-right">
                                    Finished: {task.finished_at ? new Date(task.finished_at).toLocaleString() : 'N/A'}
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
                <div className="text-center text-muted-foreground py-8 flex flex-col items-center">
                    <MessageSquare className="w-8 h-8 mb-2 opacity-20"/>
                    <p>No communications yet.</p>
                </div>
            ) : (
                communications.map((comm) => (
                <div key={comm.id} className="p-3 bg-card border border-border rounded-lg shadow-sm">
                    <div className="flex justify-between items-start mb-1">
                    <div className="flex items-center space-x-1">
                        <span className="font-bold text-xs text-primary">
                            {comm.sender_employee === 'User' ? 'You' : comm.sender_employee} 
                        </span>
                        <ArrowRight className="w-3 h-3 text-muted-foreground"/>
                        <span className="font-bold text-xs text-primary">
                            {comm.recipient_employee === 'User' ? 'You' : comm.recipient_employee}
                        </span>
                    </div>
                    <span className="text-[10px] text-muted-foreground whitespace-nowrap ml-2">
                        {comm.created_at ? formatDistanceToNow(new Date(comm.created_at), { addSuffix: true }) : ''}
                    </span>
                    </div>
                    <p className="text-sm text-foreground leading-snug">{comm.content}</p>
                </div>
                ))
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Recent Deployment Requests</CardTitle>
          <CardDescription>Latest deployment activity</CardDescription>
        </CardHeader>
        <CardContent>
          {loading.requests ? <p>Loading requests...</p> : requests.length === 0 ? (
            <div className="text-center text-muted-foreground py-8 flex flex-col items-center">
              <Rocket className="w-8 h-8 mb-2 opacity-20"/>
              <p>No deployment requests yet.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee Name</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Requested</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {requests.map((request) => {
                  const { icon, color } = getRequestStatusUi(request.status);
                  return (
                    <TableRow key={request.id}>
                      <TableCell className="font-medium">{request.employeeName}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`flex items-center gap-1 w-fit ${color}`}>
                          {icon}
                          <span className="capitalize">{request.status}</span>
                        </Badge>
                      </TableCell>
                      <TableCell>{formatDistanceToNow(request.createdAt, { addSuffix: true })}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card className="lg:col-span-3">
        <CardHeader>
          <CardTitle>Performance Metrics</CardTitle>
        </CardHeader>
        <CardContent>
           <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              {loading.metrics ? <p>Loading metrics...</p> : metrics.length === 0 ? (
                  <div className="col-span-4 text-center text-muted-foreground py-4">No metrics available.</div>
              ) : (
                  metrics.slice(0, 4).map(metric => (
                    <Card key={metric.id}>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium truncate" title={metric.name || 'Metric'}>{metric.name || 'Metric'}</CardTitle>
                            {(metric.name || '').toLowerCase().includes('failed') || (metric.name || '').toLowerCase().includes('error') ? <AlertCircle className="h-4 w-4 text-red-500"/> : <TrendingUp className="h-4 w-4 text-green-500"/>}
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{metric.value}</div>
                            <p className="text-xs text-muted-foreground">
                                {metric.timestamp ? new Date(metric.timestamp).toLocaleDateString() : ''}
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
