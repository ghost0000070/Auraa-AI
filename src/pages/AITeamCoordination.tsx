import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  MessageSquare, 
  Users, 
  Send, 
  ArrowRight, 
  Clock, 
  CheckCircle,
  AlertTriangle,
  Info,
  Lightbulb,
  ArrowUpRight,
  Plus,
  Filter
} from 'lucide-react';
import { Header } from '@/components/Header';
import { Json } from '@/integrations/supabase/types';
import { JsonValue } from '@/types/json';

interface TeamCommunication {
  id: string;
  sender_employee: string;
  recipient_employee: string | null;
  message_type: string;
  subject: string | null;
  content: string;
  metadata: JsonValue | null; // Supabase JSON column
  is_read: boolean;
  created_at: string;
  user_id: string;
}

interface TeamExecution {
  id: string;
  workflow_id: string | null;
  status: string;
  current_step: number | null;
  created_at: string;
  updated_at: string;
  user_id: string;
  type: string | null;
}

const AITeamCoordination = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [communications, setCommunications] = useState<TeamCommunication[]>([]);
  const [executions, setExecutions] = useState<TeamExecution[]>([]);
  const [loading, setLoading] = useState(true);
  const [showMessageDialog, setShowMessageDialog] = useState(false);
  const [filter, setFilter] = useState('all');
  const [newMessage, setNewMessage] = useState({
    recipient_employee: '',
    message_type: 'update',
    subject: '',
    content: ''
  });

  const employeeTypes = [
    'Sales Manager',
    'Customer Support Specialist', 
    'Content Creator',
    'Data Analyst',
    'Marketing Specialist',
    'SEO Specialist',
    'Social Media Manager'
  ];

  const messageTypes = [
    { value: 'handoff', label: 'Task Handoff', icon: ArrowRight, color: 'blue' },
    { value: 'update', label: 'Status Update', icon: Info, color: 'green' },
    { value: 'request', label: 'Request', icon: MessageSquare, color: 'orange' },
    { value: 'insight', label: 'Insight', icon: Lightbulb, color: 'yellow' },
    { value: 'alert', label: 'Alert', icon: AlertTriangle, color: 'red' }
  ];

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    fetchData();
    
    // Set up real-time subscriptions
    const communicationsSubscription = supabase
      .channel('team-communications')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'ai_team_communications' }, 
        () => fetchData()
      )
      .subscribe();

    const executionsSubscription = supabase
      .channel('team-executions')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'ai_team_executions' }, 
        () => fetchData()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(communicationsSubscription);
      supabase.removeChannel(executionsSubscription);
    };
  }, [user, navigate]);

  const fetchData = async () => {
    try {
      console.log('🔄 Fetching team coordination data...');
      
      const [communicationsResponse, executionsResponse] = await Promise.all([
        supabase
          .from('ai_team_communications')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(50),
        supabase
          .from('ai_team_executions')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(20)
      ]);

      console.log('📊 Coordination data responses:', {
        communications: communicationsResponse.data?.length || 0,
        executions: executionsResponse.data?.length || 0
      });

      if (communicationsResponse.error) {
        console.error('❌ Communications fetch error:', communicationsResponse.error);
        throw communicationsResponse.error;
      }
      if (executionsResponse.error) {
        console.error('❌ Executions fetch error:', executionsResponse.error);
        throw executionsResponse.error;
      }

      // Cast data to our interface adjusting metadata which is Json from Supabase
      setCommunications((communicationsResponse.data as (TeamCommunication & { metadata: Json })[] | null)?.map(c => ({
        ...c,
        metadata: c.metadata as JsonValue | null
      })) || []);
      setExecutions(executionsResponse.data || []);
    } catch (error) {
      console.error('❌ Error fetching coordination data:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch team coordination data',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    try {
      if (!newMessage.content.trim()) {
        toast({
          title: 'Error',
          description: 'Please enter a message',
          variant: 'destructive'
        });
        return;
      }

      const { error } = await supabase
        .from('ai_team_communications')
        .insert({
          ...newMessage,
          sender_employee: 'User',
          user_id: user?.id,
          metadata: {}
        });

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Message sent successfully'
      });

      setNewMessage({
        recipient_employee: '',
        message_type: 'update',
        subject: '',
        content: ''
      });
      setShowMessageDialog(false);
      fetchData();
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: 'Error',
        description: 'Failed to send message',
        variant: 'destructive'
      });
    }
  };

  const markAsRead = async (messageId: string) => {
    try {
      const { error } = await supabase
        .from('ai_team_communications')
        .update({ is_read: true })
        .eq('id', messageId);

      if (error) throw error;
      fetchData();
    } catch (error) {
      console.error('Error marking message as read:', error);
    }
  };

  const getMessageTypeConfig = (type: string) => {
    return messageTypes.find(t => t.value === type) || messageTypes[0];
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'failed': return <AlertTriangle className="w-4 h-4 text-red-500" />;
      case 'paused': return <Clock className="w-4 h-4 text-yellow-500" />;
      default: return <Clock className="w-4 h-4 text-blue-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      running: 'default' as const,
      completed: 'secondary' as const,
      failed: 'destructive' as const,
      paused: 'outline' as const
    };
    return variants[status as keyof typeof variants] || 'default' as const;
  };

  const filteredCommunications = communications.filter(comm => {
    if (filter === 'all') return true;
    if (filter === 'unread') return !comm.is_read;
    return comm.message_type === filter;
  });

  const unreadCount = communications.filter(c => !c.is_read).length;

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="container mx-auto">
          <div className="text-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Loading team coordination...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto p-6 pt-24">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold mb-2">AI Team Coordination</h1>
              <p className="text-xl text-muted-foreground">
                Monitor team communications and workflow executions in real-time
              </p>
            </div>
            <div className="flex space-x-2">
              <Dialog open={showMessageDialog} onOpenChange={setShowMessageDialog}>
                <DialogTrigger asChild>
                  <Button className="bg-gradient text-white">
                    <Send className="w-4 h-4 mr-2" />
                    Send Message
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Send Team Message</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">Recipient AI Employee</label>
                        <select
                          value={newMessage.recipient_employee}
                          onChange={(e) => setNewMessage(prev => ({ ...prev, recipient_employee: e.target.value }))}
                          className="w-full p-2 border rounded-md"
                        >
                          <option value="">All Employees</option>
                          {employeeTypes.map(type => (
                            <option key={type} value={type}>{type}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">Message Type</label>
                        <select
                          value={newMessage.message_type}
                          onChange={(e) => setNewMessage(prev => ({ ...prev, message_type: e.target.value }))}
                          className="w-full p-2 border rounded-md"
                        >
                          {messageTypes.map(type => (
                            <option key={type.value} value={type.value}>{type.label}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Subject</label>
                      <Input
                        value={newMessage.subject}
                        onChange={(e) => setNewMessage(prev => ({ ...prev, subject: e.target.value }))}
                        placeholder="Message subject"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Message</label>
                      <Textarea
                        value={newMessage.content}
                        onChange={(e) => setNewMessage(prev => ({ ...prev, content: e.target.value }))}
                        placeholder="Enter your message"
                        rows={4}
                      />
                    </div>
                    <div className="flex justify-end space-x-2">
                      <Button variant="outline" onClick={() => setShowMessageDialog(false)}>
                        Cancel
                      </Button>
                      <Button onClick={sendMessage} disabled={!newMessage.content.trim()}>
                        <Send className="w-4 h-4 mr-2" />
                        Send
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Team Communications */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center">
                    <MessageSquare className="w-5 h-5 mr-2" />
                    Team Communications
                    {unreadCount > 0 && (
                      <Badge variant="destructive" className="ml-2">
                        {unreadCount} unread
                      </Badge>
                    )}
                  </CardTitle>
                  <div className="flex items-center space-x-2">
                    <Filter className="w-4 h-4 text-muted-foreground" />
                    <select
                      value={filter}
                      onChange={(e) => setFilter(e.target.value)}
                      className="text-sm border rounded-md px-2 py-1"
                    >
                      <option value="all">All Messages</option>
                      <option value="unread">Unread</option>
                      {messageTypes.map(type => (
                        <option key={type.value} value={type.value}>{type.label}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {filteredCommunications.map(comm => {
                    const typeConfig = getMessageTypeConfig(comm.message_type);
                    const IconComponent = typeConfig.icon;
                    
                    return (
                      <Card 
                        key={comm.id} 
                        className={`p-4 cursor-pointer transition-all ${!comm.is_read ? 'border-primary/50 bg-primary/5' : ''}`}
                        onClick={() => !comm.is_read && markAsRead(comm.id)}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center space-x-3">
                            <div className={`p-2 rounded-lg bg-${typeConfig.color}-100`}>
                              <IconComponent className={`w-4 h-4 text-${typeConfig.color}-600`} />
                            </div>
                            <div>
                              <div className="flex items-center space-x-2">
                                <span className="font-semibold text-sm">{comm.sender_employee}</span>
                                <ArrowRight className="w-3 h-3 text-muted-foreground" />
                                <span className="text-sm text-muted-foreground">
                                  {comm.recipient_employee || 'All Team'}
                                </span>
                              </div>
                              <Badge variant="outline" className="text-xs mt-1">
                                {typeConfig.label}
                              </Badge>
                            </div>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {new Date(comm.created_at).toLocaleTimeString()}
                          </div>
                        </div>
                        
                        {comm.subject && (
                          <h4 className="font-medium text-sm mb-1">{comm.subject}</h4>
                        )}
                        <p className="text-sm text-muted-foreground">{comm.content}</p>
                        
                        {!comm.is_read && (
                          <div className="mt-2 flex justify-end">
                            <Badge variant="destructive" className="text-xs">
                              New
                            </Badge>
                          </div>
                        )}
                      </Card>
                    );
                  })}

                  {filteredCommunications.length === 0 && (
                    <div className="text-center py-12 text-muted-foreground">
                      <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>No messages found for the selected filter.</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Active Workflow Executions */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Users className="w-5 h-5 mr-2" />
                  Active Workflows
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {executions.map(execution => (
                    <Card key={execution.id} className="p-3">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          {getStatusIcon(execution.status)}
                          <span className="text-sm font-medium">Workflow {execution.workflow_id?.slice(0, 8) || 'Unknown'}...</span>
                        </div>
                        <Badge variant={getStatusBadge(execution.status)}>
                          {execution.status}
                        </Badge>
                      </div>
                      
                      <div className="text-xs text-muted-foreground mb-2">
                        Step {execution.current_step}
                      </div>
                      
                      <div className="text-xs text-muted-foreground">
                        Started: {new Date(execution.created_at).toLocaleString()}
                      </div>
                      
                      <div className="text-xs text-muted-foreground">
                        Updated: {new Date(execution.updated_at).toLocaleString()}
                      </div>
                      
                      {execution.type && (
                        <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded text-xs text-blue-600">
                          Type: {execution.type}
                        </div>
                      )}
                    </Card>
                  ))}

                  {executions.length === 0 && (
                    <div className="text-center py-12 text-muted-foreground">
                      <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p className="text-sm">No active workflow executions.</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AITeamCoordination;