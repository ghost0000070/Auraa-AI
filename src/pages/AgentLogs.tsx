import React, { useState, useEffect } from 'react';
import { supabase } from '@/supabase';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Search, Filter, RefreshCw, FileText, AlertCircle, CheckCircle, Clock, ArrowLeft } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useNavigate } from 'react-router-dom';

interface ActionLog {
  id: string;
  task_id: string;
  employee_id: string;
  action_type: string;
  status: 'started' | 'completed' | 'failed' | 'running';
  message: string;
  metadata?: Record<string, unknown>;
  created_at: string;
}

const AgentLogs: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [logs, setLogs] = useState<ActionLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const pageSize = 50;

  const fetchLogs = async (reset = false) => {
    if (!user) return;

    setLoading(true);
    const offset = reset ? 0 : page * pageSize;

    try {
      let query = supabase
        .from('agent_action_logs')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .range(offset, offset + pageSize - 1);

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      if (searchQuery.trim()) {
        query = query.or(`message.ilike.%${searchQuery}%,action_type.ilike.%${searchQuery}%`);
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
      console.error('Error fetching logs:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs(true);
  }, [user, statusFilter]);

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      fetchLogs(true);
    }, 300);
    return () => clearTimeout(delayDebounce);
  }, [searchQuery]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'failed':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      case 'running':
        return <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />;
      default:
        return <Clock className="w-4 h-4 text-yellow-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500/20 text-green-300 border-green-500/30';
      case 'failed':
        return 'bg-red-500/20 text-red-300 border-red-500/30';
      case 'running':
        return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
      default:
        return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30';
    }
  };

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
              Agent Logs
            </h1>
          </div>
          <Button variant="outline" size="sm" onClick={() => fetchLogs(true)}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
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
                  placeholder="Search logs..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-slate-900/50 border-slate-700"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full md:w-48 bg-slate-900/50 border-slate-700">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="started">Started</SelectItem>
                  <SelectItem value="running">Running</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
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
              Action Logs
            </CardTitle>
            <CardDescription>
              Real-time logs from your AI employees
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
                <p>No logs found</p>
              </div>
            ) : (
              <div className="space-y-3">
                {logs.map((log) => (
                  <div
                    key={log.id}
                    className="p-4 bg-slate-900/50 border border-slate-700/50 rounded-lg hover:border-slate-600/50 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3 flex-1">
                        {getStatusIcon(log.status)}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-sm">
                              {log.action_type?.replace(/_/g, ' ')}
                            </span>
                            <Badge variant="outline" className={getStatusColor(log.status)}>
                              {log.status}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground truncate">
                            {log.message}
                          </p>
                          {log.metadata && Object.keys(log.metadata).length > 0 && (
                            <pre className="mt-2 p-2 bg-slate-950/50 rounded text-xs text-slate-400 overflow-auto max-h-24">
                              {JSON.stringify(log.metadata, null, 2)}
                            </pre>
                          )}
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

export default AgentLogs;
