import React, { useState, useEffect } from 'react';
import { supabase } from '@/supabase';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { aiEmployeeTemplates } from '@/lib/ai-employee-templates';
import { TemplateIcon } from '@/components/TemplateIcon';
import { 
  Users, 
  Loader2, 
  Plus, 
  MessageSquare, 
  Clock,
  Trash2
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface DeployedEmployee {
  id: string;
  name: string;
  category: string;
  status: 'active' | 'idle' | 'offline';
  template_id: string;
  created_at: string;
  last_active_at?: string;
  tasks_completed?: number;
}

export const MyEmployeesPanel: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [employees, setEmployees] = useState<DeployedEmployee[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    
    const fetchEmployees = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('deployed_employees')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });
        
        if (error) throw error;
        setEmployees(data || []);
      } catch (err) {
        console.error('Error fetching employees:', err);
        toast.error('Failed to load your employees');
      } finally {
        setLoading(false);
      }
    };

    fetchEmployees();

    // Subscribe to real-time updates
    const channel = supabase
      .channel('my-employees')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'deployed_employees',
        filter: `user_id=eq.${user.id}`
      }, (payload) => {
        if (payload.eventType === 'INSERT') {
          setEmployees(prev => [payload.new as DeployedEmployee, ...prev]);
        } else if (payload.eventType === 'UPDATE') {
          setEmployees(prev => prev.map(e => 
            e.id === payload.new.id ? payload.new as DeployedEmployee : e
          ));
        } else if (payload.eventType === 'DELETE') {
          setEmployees(prev => prev.filter(e => e.id !== payload.old.id));
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const handleRemoveEmployee = async (employeeId: string, employeeName: string) => {
    setActionLoading(employeeId);
    try {
      const { error } = await supabase
        .from('deployed_employees')
        .delete()
        .eq('id', employeeId)
        .eq('user_id', user?.id);
      
      if (error) throw error;
      
      toast.success(`${employeeName} has been removed from your team`);
    } catch (err) {
      console.error('Error removing employee:', err);
      toast.error('Failed to remove employee');
    } finally {
      setActionLoading(null);
    }
  };

  const getTemplateInfo = (templateId: string) => {
    return aiEmployeeTemplates.find(t => t.id === templateId);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500';
      case 'idle': return 'bg-yellow-500';
      case 'offline': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active': return <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Active</Badge>;
      case 'idle': return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">Idle</Badge>;
      case 'offline': return <Badge className="bg-gray-500/20 text-gray-400 border-gray-500/30">Offline</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (employees.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Users className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Employees Yet</h3>
          <p className="text-muted-foreground text-center mb-6 max-w-md">
            You haven't hired any AI employees yet. Visit the Marketplace to browse and deploy your first AI team member.
          </p>
          <Button onClick={() => navigate('/marketplace')}>
            <Plus className="w-4 h-4 mr-2" />
            Browse Marketplace
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">My Employees</h2>
          <p className="text-muted-foreground">
            {employees.length} employee{employees.length !== 1 ? 's' : ''} on your team
          </p>
        </div>
        <Button onClick={() => navigate('/marketplace')}>
          <Plus className="w-4 h-4 mr-2" />
          Hire More
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {employees.map((employee) => {
          const template = getTemplateInfo(employee.template_id);
          
          return (
            <Card key={employee.id} className="relative overflow-hidden hover:shadow-lg transition-shadow">
              <div className={`absolute top-0 left-0 right-0 h-1 ${getStatusColor(employee.status)}`} />
              
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-10 h-10 rounded-full flex items-center justify-center text-white"
                      style={{ backgroundColor: template?.color || '#6366f1' }}
                    >
                      {template ? (
                        <TemplateIcon icon={template.icon} className="w-5 h-5" />
                      ) : (
                        <Users className="w-5 h-5" />
                      )}
                    </div>
                    <div>
                      <CardTitle className="text-base">{employee.name}</CardTitle>
                      <CardDescription className="text-xs">
                        {template?.role || employee.category}
                      </CardDescription>
                    </div>
                  </div>
                  {getStatusBadge(employee.status)}
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {template && (
                  <div className="flex flex-wrap gap-1">
                    {template.skills.slice(0, 3).map((skill, idx) => (
                      <Badge key={idx} variant="secondary" className="text-xs">
                        {skill}
                      </Badge>
                    ))}
                    {template.skills.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{template.skills.length - 3} more
                      </Badge>
                    )}
                  </div>
                )}
                
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>Hired {formatDistanceToNow(new Date(employee.created_at), { addSuffix: true })}</span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1"
                    onClick={() => navigate(`/ai-employees/${employee.id}`)}
                  >
                    <MessageSquare className="w-3 h-3 mr-1" />
                    Chat
                  </Button>
                  
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        disabled={actionLoading === employee.id}
                      >
                        {actionLoading === employee.id ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <Trash2 className="w-3 h-3" />
                        )}
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Remove {employee.name}?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will remove this AI employee from your team. You can hire them again from the Marketplace at any time.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleRemoveEmployee(employee.id, employee.name)}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Remove
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default MyEmployeesPanel;
