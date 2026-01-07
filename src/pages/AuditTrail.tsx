import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/supabase';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Search, Filter, ArrowLeft, User, Clock, Activity, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow, format } from 'date-fns';

interface AuditLogEntry {
  id: string;
  user_id: string;
  action: string;
  resource_type: string;
  resource_id: string;
  details: Record<string, unknown>;
  ip_address: string;
  user_agent: string;
  created_at: string;
}

const AuditTrail: React.FC = () => {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [actionFilter, setActionFilter] = useState<string>('all');
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const pageSize = 50;

  const fetchLogs = async (reset = false) => {
    if (!user) return;

    setLoading(true);
    const offset = reset ? 0 : page * pageSize;

    try {
      let query = supabase
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .range(offset, offset + pageSize - 1);

      // Non-admins only see their own logs
      if (!isAdmin) {
        query = query.eq('user_id', user.id);
      }

      if (actionFilter !== 'all') {
        query = query.eq('action', actionFilter);
      }

      if (searchQuery.trim()) {
        query = query.or(`action.ilike.%${searchQuery}%,resource_type.ilike.%${searchQuery}%`);
      }

      const { data, error } = await query;

      if (error) throw error;

      if (reset) {
        setLogs(data || []);
        setPage(0);
      } else {
        setLogs(prev => [...prev, ...(data || [])]);
      }

      setHasMore((data?.length || 0) === pageSize);
    } catch (error) {
      console.error('Error fetching audit logs:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs(true);
  }, [user, actionFilter]);

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      fetchLogs(true);
    }, 300);
    return () => clearTimeout(delayDebounce);
  }, [searchQuery]);

  const getActionIcon = (action: string) => {
    if (action.includes('create') || action.includes('deploy')) {
      return <Activity className="w-4 h-4 text-green-500" />;
    }
    if (action.includes('delete') || action.includes('remove')) {
      return <Activity className="w-4 h-4 text-red-500" />;
    }
    if (action.includes('update') || action.includes('edit')) {
      return <Activity className="w-4 h-4 text-blue-500" />;
    }
    if (action.includes('login') || action.includes('auth')) {
      return <User className="w-4 h-4 text-yellow-500" />;
    }
    return <Activity className="w-4 h-4 text-muted-foreground" />;
  };

  const getActionColor = (action: string) => {
    if (action.includes('create') || action.includes('deploy')) {
      return 'bg-green-500/20 text-green-300 border-green-500/30';
    }
    if (action.includes('delete') || action.includes('remove')) {
      return 'bg-red-500/20 text-red-300 border-red-500/30';
    }
    if (action.includes('update') || action.includes('edit')) {
      return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
    }
    return 'bg-slate-500/20 text-slate-300 border-slate-500/30';
  };

  const actionTypes = [
    'all',
    'login',
    'logout',
    'create_employee',
    'delete_employee',
    'update_employee',
    'create_task',
    'api_key_created',
    'settings_updated',
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-950 text-white">
      <header className="border-b border-slate-700/50 bg-slate-900/70 backdrop-blur sticky top-0 z-10">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
              Audit Trail
            </h1>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8">
        {/* Filters */}
        <Card className="bg-slate-800/50 border-slate-700/50 mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search audit logs..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-slate-900/50 border-slate-700"
                />
              </div>
              <Select value={actionFilter} onValueChange={setActionFilter}>
                <SelectTrigger className="w-full md:w-48 bg-slate-900/50 border-slate-700">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Filter by action" />
                </SelectTrigger>
                <SelectContent>
                  {actionTypes.map((action) => (
                    <SelectItem key={action} value={action}>
                      {action === 'all' ? 'All Actions' : action.replace(/_/g, ' ')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Logs List */}
        <Card className="bg-slate-800/50 border-slate-700/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Activity Log
            </CardTitle>
            <CardDescription>
              Complete record of all actions and changes
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading && logs.length === 0 ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : logs.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <FileText className="w-12 h-12 mx-auto mb-4 opacity-20" />
                <p>No audit logs found</p>
              </div>
            ) : (
              <div className="space-y-3">
                {logs.map((log) => (
                  <div
                    key={log.id}
                    className="p-4 bg-slate-900/50 border border-slate-700/50 rounded-lg"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3 flex-1">
                        {getActionIcon(log.action)}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <Badge variant="outline" className={getActionColor(log.action)}>
                              {log.action.replace(/_/g, ' ')}
                            </Badge>
                            <span className="text-sm text-muted-foreground">
                              on <span className="text-white">{log.resource_type}</span>
                            </span>
                          </div>
                          {log.details && Object.keys(log.details).length > 0 && (
                            <div className="text-xs text-muted-foreground mt-1">
                              {Object.entries(log.details).map(([key, value]) => (
                                <span key={key} className="mr-3">
                                  {key}: <span className="text-white">{String(value)}</span>
                                </span>
                              ))}
                            </div>
                          )}
                          <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {format(new Date(log.created_at), 'MMM d, yyyy HH:mm:ss')}
                            </span>
                            {log.ip_address && (
                              <span>IP: {log.ip_address}</span>
                            )}
                          </div>
                        </div>
                      </div>
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {formatDistanceToNow(new Date(log.created_at), { addSuffix: true })}
                      </span>
                    </div>
                  </div>
                ))}

                {hasMore && (
                  <div className="text-center pt-4">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setPage(p => p + 1);
                        fetchLogs();
                      }}
                      disabled={loading}
                    >
                      {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                      Load More
                    </Button>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default AuditTrail;
