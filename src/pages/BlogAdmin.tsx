import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Bot,
  Sparkles,
  FileText,
  MessageCircle,
  TrendingUp,
  Settings,
  Trash2,
  Eye,
  Archive,
  Send,
  RefreshCw,
  Lightbulb,
  Search,
  Wand2,
  CheckCircle,
  AlertCircle,
  BarChart3,
  PenTool,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
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
} from '@/components/ui/alert-dialog';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { blogService, blogAgent } from '@/lib/blog-engine';
import { supabase } from '@/supabase';
import { useAuth } from '@/hooks/useAuth';
import { OWNER_EMAIL } from '@/config/constants';
import type { BlogPost, BlogComment, BlogCategory, BlogAgentAction, BlogSettings } from '@/types/blog';

const BlogAdmin: React.FC = () => {
  const { user } = useAuth();
  const isOwner = user?.email === OWNER_EMAIL;
  
  // Data state
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [comments, setComments] = useState<BlogComment[]>([]);
  const [categories, setCategories] = useState<BlogCategory[]>([]);
  const [agentActions, setAgentActions] = useState<BlogAgentAction[]>([]);
  const [settings, setSettings] = useState<BlogSettings | null>(null);
  
  // UI state
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'published' | 'draft' | 'archived'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  // AI Generation state
  const [generatingPost, setGeneratingPost] = useState(false);
  const [generateTopic, setGenerateTopic] = useState('');
  const [generateCategory, setGenerateCategory] = useState('ai-employees');
  const [generatedPost, setGeneratedPost] = useState<Partial<BlogPost> | null>(null);
  const [showGenerateDialog, setShowGenerateDialog] = useState(false);
  
  // Ideas state
  const [ideas, setIdeas] = useState<Array<{
    title: string;
    category: string;
    target_keyword: string;
    estimated_engagement: string;
    brief_outline: string[];
  }>>([]);
  const [generatingIdeas, setGeneratingIdeas] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Load posts (all statuses for admin)
      const { data: allPosts } = await supabase
        .from('blog_posts')
        .select('*')
        .order('created_at', { ascending: false });
      setPosts(allPosts || []);
      
      // Load pending/flagged comments
      const { data: pendingComments } = await supabase
        .from('blog_comments')
        .select('*')
        .or('is_approved.eq.false,is_flagged.eq.true')
        .order('created_at', { ascending: false });
      setComments(pendingComments || []);
      
      // Load categories
      const cats = await blogService.getCategories();
      setCategories(cats);
      
      // Load recent agent actions
      const { data: actions } = await supabase
        .from('blog_agent_actions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);
      setAgentActions(actions || []);
      
      // Load settings
      const { data: settingsData } = await supabase
        .from('blog_settings')
        .select('*')
        .single();
      setSettings(settingsData);
      
    } catch (error) {
      console.error('Error loading admin data:', error);
      toast.error('Failed to load data');
    }
  };

  const handleGeneratePost = async () => {
    if (!generateTopic.trim()) {
      toast.error('Please enter a topic');
      return;
    }
    
    setGeneratingPost(true);
    try {
      const result = await blogAgent.generatePost(generateTopic, {
        category: generateCategory,
      });
      
      if (result.success && result.post) {
        setGeneratedPost(result.post);
        toast.success('Post generated! Review and publish below.');
      } else {
        toast.error(result.error || 'Failed to generate post');
      }
    } catch (error) {
      console.error('Generate error:', error);
      toast.error('Failed to generate post');
    } finally {
      setGeneratingPost(false);
    }
  };

  const handleSaveGeneratedPost = async (publish: boolean) => {
    if (!generatedPost) return;
    
    try {
      const result = await blogAgent.createPost({
        title: generatedPost.title!,
        content: generatedPost.content!,
        excerpt: generatedPost.excerpt || undefined,
        category: generatedPost.category || generateCategory,
        tags: generatedPost.tags,
        seo_title: generatedPost.seo_title || undefined,
        seo_description: generatedPost.seo_description || undefined,
        seo_keywords: generatedPost.seo_keywords || undefined,
        status: publish ? 'published' : 'draft',
      });
      
      if (result.success) {
        toast.success(publish ? 'Post published!' : 'Post saved as draft');
        setGeneratedPost(null);
        setGenerateTopic('');
        setShowGenerateDialog(false);
        loadData();
      } else {
        toast.error(result.error || 'Failed to save post');
      }
    } catch (error) {
      console.error('Save error:', error);
      toast.error('Failed to save post');
    }
  };

  const handleGenerateIdeas = async () => {
    setGeneratingIdeas(true);
    try {
      const result = await blogAgent.generateIdeas();
      if (result.success && result.ideas) {
        setIdeas(result.ideas);
        toast.success(`Generated ${result.ideas.length} post ideas!`);
      } else {
        toast.error(result.error || 'Failed to generate ideas');
      }
    } catch (error) {
      console.error('Ideas error:', error);
      toast.error('Failed to generate ideas');
    } finally {
      setGeneratingIdeas(false);
    }
  };

  const handlePublishPost = async (postId: string) => {
    const result = await blogAgent.publishPost(postId);
    if (result.success) {
      toast.success('Post published!');
      loadData();
    } else {
      toast.error(result.error || 'Failed to publish');
    }
  };

  const handleArchivePost = async (postId: string) => {
    const result = await blogAgent.archivePost(postId);
    if (result.success) {
      toast.success('Post archived');
      loadData();
    } else {
      toast.error(result.error || 'Failed to archive');
    }
  };

  const handleOptimizeSeo = async (postId: string) => {
    const toastId = toast.loading('Optimizing SEO...');
    try {
      const result = await blogAgent.optimizeSeo(postId);
      if (result.success) {
        toast.success('SEO optimized!', { id: toastId });
        loadData();
      } else {
        toast.error(result.error || 'Failed to optimize', { id: toastId });
      }
    } catch {
      toast.error('Failed to optimize SEO', { id: toastId });
    }
  };

  const handleModerateComment = async (commentId: string) => {
    const result = await blogAgent.moderateComment(commentId);
    if (result.success) {
      toast.success(`Comment ${result.action}`);
      loadData();
    } else {
      toast.error(result.error || 'Failed to moderate');
    }
  };

  const handleReplyToComment = async (commentId: string, postId: string) => {
    const toastId = toast.loading('Generating reply...');
    try {
      const result = await blogAgent.replyToComment(commentId, postId);
      if (result.success) {
        toast.success('Reply posted!', { id: toastId });
        loadData();
      } else {
        toast.error(result.error || 'Failed to reply', { id: toastId });
      }
    } catch {
      toast.error('Failed to generate reply', { id: toastId });
    }
  };

  const handleUpdateSettings = async (updates: Partial<BlogSettings>) => {
    if (!settings) return;
    
    const { error } = await supabase
      .from('blog_settings')
      .update(updates)
      .eq('id', settings.id);
    
    if (error) {
      toast.error('Failed to update settings');
    } else {
      setSettings({ ...settings, ...updates });
      toast.success('Settings updated');
    }
  };

  const filteredPosts = posts.filter(post => {
    if (selectedStatus !== 'all' && post.status !== selectedStatus) return false;
    if (searchQuery && !post.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const stats = {
    totalPosts: posts.length,
    published: posts.filter(p => p.status === 'published').length,
    drafts: posts.filter(p => p.status === 'draft').length,
    totalViews: posts.reduce((sum, p) => sum + p.view_count, 0),
    totalLikes: posts.reduce((sum, p) => sum + p.like_count, 0),
    totalComments: posts.reduce((sum, p) => sum + p.comment_count, 0),
    pendingComments: comments.filter(c => !c.is_approved).length,
    flaggedComments: comments.filter(c => c.is_flagged).length,
    aiGenerated: posts.filter(p => p.is_ai_generated).length,
  };

  if (!isOwner) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900 flex items-center justify-center">
        <Card className="bg-red-900/20 border-red-500/30 max-w-md">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">Access Denied</h2>
            <p className="text-gray-400">You don't have permission to access the Blog Admin panel.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900 py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <Bot className="w-8 h-8 text-purple-400" />
              Blog AI Agent
            </h1>
            <p className="text-gray-400 mt-1">
              AI-powered blog management for Auraa AI
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <Button 
              variant="outline"
              onClick={() => loadData()}
              className="border-white/20"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
            
            <Dialog open={showGenerateDialog} onOpenChange={setShowGenerateDialog}>
              <DialogTrigger asChild>
                <Button className="bg-purple-600 hover:bg-purple-700">
                  <Sparkles className="w-4 h-4 mr-2" />
                  Generate Post
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl bg-slate-900 border-white/10">
                <DialogHeader>
                  <DialogTitle className="text-white flex items-center gap-2">
                    <Wand2 className="w-5 h-5 text-purple-400" />
                    AI Post Generator
                  </DialogTitle>
                  <DialogDescription>
                    Let the AI agent create a blog post for you
                  </DialogDescription>
                </DialogHeader>
                
                {!generatedPost ? (
                  <div className="space-y-4">
                    <div>
                      <Label>Topic / Title Idea</Label>
                      <Input
                        placeholder="e.g., How AI employees can boost productivity by 10x"
                        value={generateTopic}
                        onChange={(e) => setGenerateTopic(e.target.value)}
                        className="bg-white/5 border-white/10 text-white mt-1"
                      />
                    </div>
                    
                    <div>
                      <Label>Category</Label>
                      <Select value={generateCategory} onValueChange={setGenerateCategory}>
                        <SelectTrigger className="bg-white/5 border-white/10 text-white mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map(cat => (
                            <SelectItem key={cat.slug} value={cat.slug}>
                              {cat.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <Button 
                      onClick={handleGeneratePost}
                      disabled={generatingPost}
                      className="w-full bg-purple-600 hover:bg-purple-700"
                    >
                      {generatingPost ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4 mr-2" />
                          Generate Post
                        </>
                      )}
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4 max-h-[60vh] overflow-y-auto">
                    <div>
                      <Label>Title</Label>
                      <Input
                        value={generatedPost.title}
                        onChange={(e) => setGeneratedPost({ ...generatedPost, title: e.target.value })}
                        className="bg-white/5 border-white/10 text-white mt-1"
                      />
                    </div>
                    
                    <div>
                      <Label>Excerpt</Label>
                      <Textarea
                        value={generatedPost.excerpt || ''}
                        onChange={(e) => setGeneratedPost({ ...generatedPost, excerpt: e.target.value })}
                        className="bg-white/5 border-white/10 text-white mt-1"
                        rows={2}
                      />
                    </div>
                    
                    <div>
                      <Label>Content (Markdown)</Label>
                      <Textarea
                        value={generatedPost.content}
                        onChange={(e) => setGeneratedPost({ ...generatedPost, content: e.target.value })}
                        className="bg-white/5 border-white/10 text-white mt-1 font-mono text-sm"
                        rows={15}
                      />
                    </div>
                    
                    <div>
                      <Label>Tags</Label>
                      <Input
                        value={generatedPost.tags?.join(', ') || ''}
                        onChange={(e) => setGeneratedPost({ 
                          ...generatedPost, 
                          tags: e.target.value.split(',').map(t => t.trim()).filter(Boolean) 
                        })}
                        placeholder="tag1, tag2, tag3"
                        className="bg-white/5 border-white/10 text-white mt-1"
                      />
                    </div>
                    
                    <DialogFooter className="gap-2">
                      <Button 
                        variant="outline"
                        onClick={() => setGeneratedPost(null)}
                      >
                        Discard
                      </Button>
                      <Button 
                        variant="outline"
                        onClick={() => handleSaveGeneratedPost(false)}
                      >
                        Save as Draft
                      </Button>
                      <Button 
                        className="bg-green-600 hover:bg-green-700"
                        onClick={() => handleSaveGeneratedPost(true)}
                      >
                        <Send className="w-4 h-4 mr-2" />
                        Publish Now
                      </Button>
                    </DialogFooter>
                  </div>
                )}
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-8">
          <Card className="bg-white/5 border-white/10">
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <FileText className="w-8 h-8 text-blue-400" />
                <span className="text-2xl font-bold text-white">{stats.totalPosts}</span>
              </div>
              <p className="text-sm text-gray-400 mt-2">Total Posts</p>
            </CardContent>
          </Card>
          
          <Card className="bg-white/5 border-white/10">
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <CheckCircle className="w-8 h-8 text-green-400" />
                <span className="text-2xl font-bold text-white">{stats.published}</span>
              </div>
              <p className="text-sm text-gray-400 mt-2">Published</p>
            </CardContent>
          </Card>
          
          <Card className="bg-white/5 border-white/10">
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <Eye className="w-8 h-8 text-cyan-400" />
                <span className="text-2xl font-bold text-white">{stats.totalViews.toLocaleString()}</span>
              </div>
              <p className="text-sm text-gray-400 mt-2">Total Views</p>
            </CardContent>
          </Card>
          
          <Card className="bg-white/5 border-white/10">
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <MessageCircle className="w-8 h-8 text-yellow-400" />
                <span className="text-2xl font-bold text-white">{stats.totalComments}</span>
              </div>
              <p className="text-sm text-gray-400 mt-2">Comments</p>
            </CardContent>
          </Card>
          
          <Card className="bg-white/5 border-white/10">
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <AlertCircle className="w-8 h-8 text-orange-400" />
                <span className="text-2xl font-bold text-white">{stats.pendingComments}</span>
              </div>
              <p className="text-sm text-gray-400 mt-2">Pending</p>
            </CardContent>
          </Card>
          
          <Card className="bg-white/5 border-white/10">
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <Sparkles className="w-8 h-8 text-purple-400" />
                <span className="text-2xl font-bold text-white">{stats.aiGenerated}</span>
              </div>
              <p className="text-sm text-gray-400 mt-2">AI Generated</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-white/5 border border-white/10 mb-6">
            <TabsTrigger value="dashboard" className="data-[state=active]:bg-purple-600">
              <BarChart3 className="w-4 h-4 mr-2" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="posts" className="data-[state=active]:bg-purple-600">
              <FileText className="w-4 h-4 mr-2" />
              Posts
            </TabsTrigger>
            <TabsTrigger value="comments" className="data-[state=active]:bg-purple-600">
              <MessageCircle className="w-4 h-4 mr-2" />
              Comments
              {stats.pendingComments > 0 && (
                <Badge className="ml-2 bg-orange-500">{stats.pendingComments}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="ideas" className="data-[state=active]:bg-purple-600">
              <Lightbulb className="w-4 h-4 mr-2" />
              Ideas
            </TabsTrigger>
            <TabsTrigger value="settings" className="data-[state=active]:bg-purple-600">
              <Settings className="w-4 h-4 mr-2" />
              Settings
            </TabsTrigger>
          </TabsList>

          {/* Dashboard Tab */}
          <TabsContent value="dashboard">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Recent Agent Actions */}
              <Card className="bg-white/5 border-white/10">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Bot className="w-5 h-5 text-purple-400" />
                    Recent AI Actions
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 max-h-96 overflow-y-auto">
                  {agentActions.length === 0 ? (
                    <p className="text-gray-500 text-center py-4">No actions yet</p>
                  ) : (
                    agentActions.slice(0, 10).map(action => (
                      <div 
                        key={action.id}
                        className="p-3 bg-white/5 rounded-lg flex items-center justify-between"
                      >
                        <div>
                          <Badge variant="outline" className="text-purple-400 border-purple-400 mb-1">
                            {action.action_type.replace(/_/g, ' ')}
                          </Badge>
                          <p className="text-sm text-gray-400">
                            {action.input_prompt?.substring(0, 50)}...
                          </p>
                        </div>
                        <div className="text-right">
                          <Badge className={action.status === 'completed' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}>
                            {action.status}
                          </Badge>
                          <p className="text-xs text-gray-500 mt-1">
                            {new Date(action.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card className="bg-white/5 border-white/10">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Wand2 className="w-5 h-5 text-purple-400" />
                    Quick AI Actions
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button 
                    className="w-full justify-start bg-white/5 hover:bg-white/10"
                    onClick={() => setShowGenerateDialog(true)}
                  >
                    <PenTool className="w-4 h-4 mr-2 text-purple-400" />
                    Generate New Post
                  </Button>
                  
                  <Button 
                    className="w-full justify-start bg-white/5 hover:bg-white/10"
                    onClick={handleGenerateIdeas}
                    disabled={generatingIdeas}
                  >
                    {generatingIdeas ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Lightbulb className="w-4 h-4 mr-2 text-yellow-400" />
                    )}
                    Generate Post Ideas
                  </Button>
                  
                  <Button 
                    className="w-full justify-start bg-white/5 hover:bg-white/10"
                    onClick={() => {
                      // Moderate all pending comments
                      comments.filter(c => !c.is_approved).forEach(c => handleModerateComment(c.id));
                    }}
                  >
                    <MessageCircle className="w-4 h-4 mr-2 text-blue-400" />
                    Moderate Pending Comments ({stats.pendingComments})
                  </Button>
                  
                  <Button 
                    className="w-full justify-start bg-white/5 hover:bg-white/10"
                    onClick={async () => {
                      // Reply to all unanswered comments
                      for (const comment of comments.filter(c => c.is_approved && !c.is_ai_reply)) {
                        await handleReplyToComment(comment.id, comment.post_id);
                      }
                    }}
                  >
                    <Send className="w-4 h-4 mr-2 text-green-400" />
                    Auto-Reply to Comments
                  </Button>
                </CardContent>
              </Card>

              {/* Top Performing Posts */}
              <Card className="bg-white/5 border-white/10 md:col-span-2">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-green-400" />
                    Top Performing Posts
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {posts
                      .filter(p => p.status === 'published')
                      .sort((a, b) => b.view_count - a.view_count)
                      .slice(0, 5)
                      .map((post, index) => (
                        <div 
                          key={post.id}
                          className="flex items-center justify-between p-3 bg-white/5 rounded-lg"
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-2xl font-bold text-gray-500">#{index + 1}</span>
                            <div>
                              <Link 
                                to={`/blog/${post.slug}`}
                                className="text-white hover:text-purple-400 font-medium"
                              >
                                {post.title}
                              </Link>
                              <p className="text-sm text-gray-500">{post.category}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-gray-400">
                            <span className="flex items-center gap-1">
                              <Eye className="w-4 h-4" />
                              {post.view_count}
                            </span>
                            <span className="flex items-center gap-1">
                              <MessageCircle className="w-4 h-4" />
                              {post.comment_count}
                            </span>
                          </div>
                        </div>
                      ))
                    }
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Posts Tab */}
          <TabsContent value="posts">
            <Card className="bg-white/5 border-white/10">
              <CardHeader>
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <CardTitle className="text-white">All Posts</CardTitle>
                  
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input
                        placeholder="Search posts..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9 bg-white/5 border-white/10 text-white w-64"
                      />
                    </div>
                    
                    <Select value={selectedStatus} onValueChange={(v: 'all' | 'published' | 'draft' | 'archived') => setSelectedStatus(v)}>
                      <SelectTrigger className="w-32 bg-white/5 border-white/10 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All</SelectItem>
                        <SelectItem value="published">Published</SelectItem>
                        <SelectItem value="draft">Drafts</SelectItem>
                        <SelectItem value="archived">Archived</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {filteredPosts.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">No posts found</p>
                  ) : (
                    filteredPosts.map(post => (
                      <div 
                        key={post.id}
                        className="flex items-center justify-between p-4 bg-white/5 rounded-lg"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge 
                              className={
                                post.status === 'published' ? 'bg-green-500/20 text-green-400' :
                                post.status === 'draft' ? 'bg-yellow-500/20 text-yellow-400' :
                                'bg-gray-500/20 text-gray-400'
                              }
                            >
                              {post.status}
                            </Badge>
                            {post.is_ai_generated && (
                              <Badge className="bg-purple-500/20 text-purple-400">
                                <Sparkles className="w-3 h-3 mr-1" />
                                AI
                              </Badge>
                            )}
                            <Badge variant="outline" className="text-gray-400">
                              {post.category}
                            </Badge>
                          </div>
                          <h3 className="text-white font-medium">{post.title}</h3>
                          <p className="text-sm text-gray-500">
                            {new Date(post.created_at).toLocaleDateString()} • 
                            {post.view_count} views • {post.comment_count} comments
                          </p>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          {post.status === 'draft' && (
                            <Button 
                              size="sm"
                              className="bg-green-600 hover:bg-green-700"
                              onClick={() => handlePublishPost(post.id)}
                            >
                              <Send className="w-4 h-4 mr-1" />
                              Publish
                            </Button>
                          )}
                          
                          <Button 
                            size="sm"
                            variant="outline"
                            onClick={() => handleOptimizeSeo(post.id)}
                          >
                            <TrendingUp className="w-4 h-4" />
                          </Button>
                          
                          <Link to={`/blog/${post.slug}`}>
                            <Button size="sm" variant="outline">
                              <Eye className="w-4 h-4" />
                            </Button>
                          </Link>
                          
                          {post.status !== 'archived' && (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button size="sm" variant="outline" className="text-red-400 border-red-400/50">
                                  <Archive className="w-4 h-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent className="bg-slate-900 border-white/10">
                                <AlertDialogHeader>
                                  <AlertDialogTitle className="text-white">Archive Post?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    This will hide the post from the blog. You can unarchive it later.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction 
                                    onClick={() => handleArchivePost(post.id)}
                                    className="bg-red-600"
                                  >
                                    Archive
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Comments Tab */}
          <TabsContent value="comments">
            <Card className="bg-white/5 border-white/10">
              <CardHeader>
                <CardTitle className="text-white">Pending & Flagged Comments</CardTitle>
                <CardDescription>Review and moderate comments requiring attention</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {comments.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">
                      <CheckCircle className="w-12 h-12 mx-auto mb-2 text-green-400" />
                      All caught up! No comments need attention.
                    </p>
                  ) : (
                    comments.map(comment => (
                      <Card key={comment.id} className="bg-white/5 border-white/10">
                        <CardContent className="pt-4">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <span className="font-medium text-white">
                                  {comment.guest_name || 'Anonymous'}
                                </span>
                                {!comment.is_approved && (
                                  <Badge className="bg-yellow-500/20 text-yellow-400">Pending</Badge>
                                )}
                                {comment.is_flagged && (
                                  <Badge className="bg-red-500/20 text-red-400">Flagged</Badge>
                                )}
                              </div>
                              <p className="text-gray-300">{comment.content}</p>
                              <p className="text-xs text-gray-500 mt-2">
                                {new Date(comment.created_at).toLocaleString()}
                              </p>
                            </div>
                            
                            <div className="flex items-center gap-2">
                              <Button 
                                size="sm"
                                variant="outline"
                                className="text-green-400 border-green-400/50"
                                onClick={async () => {
                                  await supabase
                                    .from('blog_comments')
                                    .update({ is_approved: true, is_flagged: false })
                                    .eq('id', comment.id);
                                  toast.success('Comment approved');
                                  loadData();
                                }}
                              >
                                <CheckCircle className="w-4 h-4" />
                              </Button>
                              
                              <Button 
                                size="sm"
                                variant="outline"
                                onClick={() => handleReplyToComment(comment.id, comment.post_id)}
                              >
                                <Send className="w-4 h-4" />
                              </Button>
                              
                              <Button 
                                size="sm"
                                variant="outline"
                                className="text-red-400 border-red-400/50"
                                onClick={async () => {
                                  await supabase
                                    .from('blog_comments')
                                    .delete()
                                    .eq('id', comment.id);
                                  toast.success('Comment deleted');
                                  loadData();
                                }}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Ideas Tab */}
          <TabsContent value="ideas">
            <Card className="bg-white/5 border-white/10">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-white flex items-center gap-2">
                      <Lightbulb className="w-5 h-5 text-yellow-400" />
                      AI-Generated Post Ideas
                    </CardTitle>
                    <CardDescription>Let AI suggest topics for your blog</CardDescription>
                  </div>
                  
                  <Button 
                    onClick={handleGenerateIdeas}
                    disabled={generatingIdeas}
                    className="bg-purple-600 hover:bg-purple-700"
                  >
                    {generatingIdeas ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 mr-2" />
                        Generate Ideas
                      </>
                    )}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-4">
                  {ideas.length === 0 ? (
                    <p className="text-gray-500 text-center py-8 col-span-2">
                      Click "Generate Ideas" to get AI-powered post suggestions
                    </p>
                  ) : (
                    ideas.map((idea, index) => (
                      <Card key={index} className="bg-white/5 border-white/10">
                        <CardContent className="pt-4">
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <Badge variant="outline" className="text-purple-400">
                              {idea.category}
                            </Badge>
                            <Badge 
                              className={
                                idea.estimated_engagement === 'high' ? 'bg-green-500/20 text-green-400' :
                                idea.estimated_engagement === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                                'bg-gray-500/20 text-gray-400'
                              }
                            >
                              {idea.estimated_engagement} engagement
                            </Badge>
                          </div>
                          
                          <h3 className="text-lg font-semibold text-white mb-2">{idea.title}</h3>
                          
                          <p className="text-sm text-gray-400 mb-3">
                            Keyword: <span className="text-purple-400">{idea.target_keyword}</span>
                          </p>
                          
                          <div className="text-sm text-gray-500 mb-4">
                            <p className="font-medium mb-1">Outline:</p>
                            <ul className="list-disc list-inside space-y-1">
                              {idea.brief_outline.slice(0, 3).map((point, i) => (
                                <li key={i}>{point}</li>
                              ))}
                            </ul>
                          </div>
                          
                          <Button 
                            size="sm"
                            className="w-full bg-purple-600 hover:bg-purple-700"
                            onClick={() => {
                              setGenerateTopic(idea.title);
                              setGenerateCategory(idea.category.toLowerCase().replace(/ /g, '-'));
                              setShowGenerateDialog(true);
                            }}
                          >
                            <PenTool className="w-4 h-4 mr-2" />
                            Write This Post
                          </Button>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings">
            <Card className="bg-white/5 border-white/10">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Settings className="w-5 h-5" />
                  Blog AI Settings
                </CardTitle>
                <CardDescription>Configure the AI agent's behavior</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {settings && (
                  <>
                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-white">Auto-Reply to Comments</Label>
                        <p className="text-sm text-gray-500">
                          AI will automatically reply to new comments
                        </p>
                      </div>
                      <Switch
                        checked={settings.ai_auto_reply_enabled}
                        onCheckedChange={(checked) => handleUpdateSettings({ ai_auto_reply_enabled: checked })}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-white">AI Content Moderation</Label>
                        <p className="text-sm text-gray-500">
                          Automatically moderate comments for spam and inappropriate content
                        </p>
                      </div>
                      <Switch
                        checked={settings.ai_moderation_enabled}
                        onCheckedChange={(checked) => handleUpdateSettings({ ai_moderation_enabled: checked })}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-white">AI Content Generation</Label>
                        <p className="text-sm text-gray-500">
                          Allow AI to generate blog posts
                        </p>
                      </div>
                      <Switch
                        checked={settings.ai_content_generation_enabled}
                        onCheckedChange={(checked) => handleUpdateSettings({ ai_content_generation_enabled: checked })}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-white">Require Comment Approval</Label>
                        <p className="text-sm text-gray-500">
                          New comments require manual approval before appearing
                        </p>
                      </div>
                      <Switch
                        checked={settings.require_comment_approval}
                        onCheckedChange={(checked) => handleUpdateSettings({ require_comment_approval: checked })}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-white">Allow Guest Comments</Label>
                        <p className="text-sm text-gray-500">
                          Allow non-logged-in users to comment
                        </p>
                      </div>
                      <Switch
                        checked={settings.allow_guest_comments}
                        onCheckedChange={(checked) => handleUpdateSettings({ allow_guest_comments: checked })}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-white">Social Share Buttons</Label>
                        <p className="text-sm text-gray-500">
                          Show share buttons on blog posts
                        </p>
                      </div>
                      <Switch
                        checked={settings.social_share_enabled}
                        onCheckedChange={(checked) => handleUpdateSettings({ social_share_enabled: checked })}
                      />
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default BlogAdmin;
