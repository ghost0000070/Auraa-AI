import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { 
  Calendar, 
  Clock, 
  Eye, 
  Heart, 
  MessageCircle,
  Share2,
  ArrowLeft,
  Send,
  Sparkles,
  Twitter,
  Facebook,
  Linkedin,
  Link as LinkIcon,
  ThumbsUp,
  Reply,
  Bot
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import { blogService } from '@/lib/blog-engine';
import { useAuth } from '@/hooks/useAuth';
import type { BlogPost, BlogComment } from '@/types/blog';

const BlogPostPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [post, setPost] = useState<BlogPost | null>(null);
  const [comments, setComments] = useState<BlogComment[]>([]);
  const [relatedPosts, setRelatedPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasLiked, setHasLiked] = useState(false);
  
  // Comment form state
  const [commentContent, setCommentContent] = useState('');
  const [guestName, setGuestName] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (slug) {
      loadPost();
    }
  }, [slug]);

  const loadPost = async () => {
    if (!slug) return;
    
    setLoading(true);
    try {
      // Load post
      const loadedPost = await blogService.getPostBySlug(slug);
      if (!loadedPost) {
        navigate('/blog');
        return;
      }
      setPost(loadedPost);
      
      // Load comments
      const loadedComments = await blogService.getComments(loadedPost.id);
      setComments(loadedComments);
      
      // Load related posts
      const related = await blogService.getRelatedPosts(loadedPost);
      setRelatedPosts(related);
      
      // Check if user has liked
      if (user) {
        const liked = await blogService.hasLikedPost(loadedPost.id, user.id);
        setHasLiked(liked);
      }
    } catch (error) {
      console.error('Error loading post:', error);
      toast.error('Failed to load post');
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async () => {
    if (!post) return;
    
    try {
      if (hasLiked && user) {
        await blogService.unlikePost(post.id, user.id);
        setHasLiked(false);
        setPost(prev => prev ? { ...prev, like_count: prev.like_count - 1 } : null);
      } else {
        await blogService.likePost(post.id, user?.id);
        setHasLiked(true);
        setPost(prev => prev ? { ...prev, like_count: prev.like_count + 1 } : null);
      }
    } catch (error) {
      console.error('Like error:', error);
    }
  };

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!post || !commentContent.trim()) return;
    
    if (!user && (!guestName.trim() || !guestEmail.trim())) {
      toast.error('Please enter your name and email');
      return;
    }
    
    setSubmitting(true);
    try {
      const newComment = await blogService.addComment(post.id, commentContent, {
        userId: user?.id,
        parentId: replyingTo || undefined,
        guestName: !user ? guestName : undefined,
        guestEmail: !user ? guestEmail : undefined,
      });
      
      if (newComment) {
        // Reload comments to get proper structure
        const loadedComments = await blogService.getComments(post.id);
        setComments(loadedComments);
        setPost(prev => prev ? { ...prev, comment_count: prev.comment_count + 1 } : null);
        setCommentContent('');
        setReplyingTo(null);
        toast.success('Comment posted!');
      }
    } catch (error) {
      console.error('Comment error:', error);
      toast.error('Failed to post comment');
    } finally {
      setSubmitting(false);
    }
  };

  const handleShare = (platform: string) => {
    if (!post) return;
    
    const url = window.location.href;
    const title = post.title;
    
    const shareUrls: Record<string, string> = {
      twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
      linkedin: `https://www.linkedin.com/shareArticle?mini=true&url=${encodeURIComponent(url)}&title=${encodeURIComponent(title)}`,
    };
    
    if (platform === 'copy') {
      navigator.clipboard.writeText(url);
      toast.success('Link copied to clipboard!');
    } else if (shareUrls[platform]) {
      window.open(shareUrls[platform], '_blank', 'width=600,height=400');
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Draft';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-500 border-t-transparent" />
      </div>
    );
  }

  if (!post) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900">
      {/* Header with back button */}
      <div className="sticky top-16 z-10 bg-slate-900/80 backdrop-blur-md border-b border-white/10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/blog" className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Back to Blog
          </Link>
          
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLike}
              className={hasLiked ? 'text-red-400' : 'text-gray-400'}
            >
              <Heart className={`w-4 h-4 mr-1 ${hasLiked ? 'fill-current' : ''}`} />
              {post.like_count}
            </Button>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="text-gray-400">
                  <Share2 className="w-4 h-4 mr-1" />
                  Share
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => handleShare('twitter')}>
                  <Twitter className="w-4 h-4 mr-2" /> Twitter
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleShare('facebook')}>
                  <Facebook className="w-4 h-4 mr-2" /> Facebook
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleShare('linkedin')}>
                  <Linkedin className="w-4 h-4 mr-2" /> LinkedIn
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleShare('copy')}>
                  <LinkIcon className="w-4 h-4 mr-2" /> Copy Link
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Cover Image */}
      {post.cover_image && (
        <div className="h-64 md:h-96 w-full overflow-hidden">
          <img 
            src={post.cover_image} 
            alt={post.title}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      {/* Main Content */}
      <article className="container mx-auto px-4 py-12">
        <div className="max-w-3xl mx-auto">
          {/* Post Header */}
          <header className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <Badge variant="outline" className="text-purple-400 border-purple-400">
                {post.category}
              </Badge>
              {post.is_ai_generated && (
                <Badge className="bg-purple-500/20 text-purple-300">
                  <Sparkles className="w-3 h-3 mr-1" />
                  AI Generated
                </Badge>
              )}
            </div>
            
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4">
              {post.title}
            </h1>
            
            {post.excerpt && (
              <p className="text-xl text-gray-400 mb-6">{post.excerpt}</p>
            )}
            
            {/* Author & Meta */}
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-3">
                <Avatar>
                  <AvatarImage src={post.author_avatar || undefined} />
                  <AvatarFallback className="bg-purple-600">
                    {post.author_name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium text-white">{post.author_name}</p>
                  <div className="flex items-center gap-3 text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {formatDate(post.published_at)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {post.reading_time_minutes} min read
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-4 text-sm text-gray-500">
                <span className="flex items-center gap-1">
                  <Eye className="w-4 h-4" />
                  {post.view_count} views
                </span>
                <span className="flex items-center gap-1">
                  <Heart className="w-4 h-4" />
                  {post.like_count} likes
                </span>
                <span className="flex items-center gap-1">
                  <MessageCircle className="w-4 h-4" />
                  {post.comment_count} comments
                </span>
              </div>
            </div>
          </header>

          <Separator className="my-8 bg-white/10" />

          {/* Post Content */}
          <div className="prose prose-invert prose-purple max-w-none">
            <ReactMarkdown
              components={{
                h1: ({ children }) => <h1 className="text-3xl font-bold text-white mt-8 mb-4">{children}</h1>,
                h2: ({ children }) => <h2 className="text-2xl font-bold text-white mt-6 mb-3">{children}</h2>,
                h3: ({ children }) => <h3 className="text-xl font-bold text-white mt-4 mb-2">{children}</h3>,
                p: ({ children }) => <p className="text-gray-300 mb-4 leading-relaxed">{children}</p>,
                ul: ({ children }) => <ul className="list-disc list-inside text-gray-300 mb-4 space-y-2">{children}</ul>,
                ol: ({ children }) => <ol className="list-decimal list-inside text-gray-300 mb-4 space-y-2">{children}</ol>,
                li: ({ children }) => <li className="text-gray-300">{children}</li>,
                a: ({ href, children }) => <a href={href} className="text-purple-400 hover:text-purple-300 underline" target="_blank" rel="noopener noreferrer">{children}</a>,
                blockquote: ({ children }) => <blockquote className="border-l-4 border-purple-500 pl-4 italic text-gray-400 my-4">{children}</blockquote>,
                code: ({ children }) => <code className="bg-white/10 px-2 py-0.5 rounded text-purple-300">{children}</code>,
                pre: ({ children }) => <pre className="bg-slate-800 p-4 rounded-lg overflow-x-auto my-4">{children}</pre>,
              }}
            >
              {post.content}
            </ReactMarkdown>
          </div>

          {/* Tags */}
          {post.tags && post.tags.length > 0 && (
            <div className="mt-8 flex items-center gap-2 flex-wrap">
              <span className="text-gray-500">Tags:</span>
              {post.tags.map(tag => (
                <Link 
                  key={tag} 
                  to={`/blog?tag=${tag}`}
                  className="px-3 py-1 bg-white/5 rounded-full text-sm text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
                >
                  #{tag}
                </Link>
              ))}
            </div>
          )}

          <Separator className="my-12 bg-white/10" />

          {/* Comments Section */}
          <section id="comments">
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
              <MessageCircle className="w-6 h-6" />
              Comments ({post.comment_count})
            </h2>

            {/* Comment Form */}
            <Card className="bg-white/5 border-white/10 mb-8">
              <CardContent className="pt-6">
                <form onSubmit={handleCommentSubmit}>
                  {!user && (
                    <div className="grid md:grid-cols-2 gap-4 mb-4">
                      <Input
                        placeholder="Your name"
                        value={guestName}
                        onChange={(e) => setGuestName(e.target.value)}
                        className="bg-white/5 border-white/10 text-white"
                      />
                      <Input
                        type="email"
                        placeholder="Your email (not shown publicly)"
                        value={guestEmail}
                        onChange={(e) => setGuestEmail(e.target.value)}
                        className="bg-white/5 border-white/10 text-white"
                      />
                    </div>
                  )}
                  
                  {replyingTo && (
                    <div className="mb-2 flex items-center gap-2 text-sm text-purple-400">
                      <Reply className="w-4 h-4" />
                      Replying to comment
                      <Button 
                        type="button" 
                        variant="ghost" 
                        size="sm"
                        onClick={() => setReplyingTo(null)}
                      >
                        Cancel
                      </Button>
                    </div>
                  )}
                  
                  <div className="flex gap-4">
                    <Textarea
                      placeholder={replyingTo ? "Write your reply..." : "Share your thoughts..."}
                      value={commentContent}
                      onChange={(e) => setCommentContent(e.target.value)}
                      className="bg-white/5 border-white/10 text-white flex-1 min-h-[100px]"
                    />
                  </div>
                  
                  <div className="flex justify-end mt-4">
                    <Button 
                      type="submit"
                      disabled={submitting || !commentContent.trim()}
                      className="bg-purple-600 hover:bg-purple-700"
                    >
                      {submitting ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                          Posting...
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4 mr-2" />
                          Post Comment
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>

            {/* Comments List */}
            <div className="space-y-6">
              {comments.length === 0 ? (
                <p className="text-center text-gray-500 py-8">
                  No comments yet. Be the first to share your thoughts!
                </p>
              ) : (
                comments.map(comment => (
                  <CommentCard 
                    key={comment.id}
                    comment={comment}
                    onReply={() => {
                      setReplyingTo(comment.id);
                      document.getElementById('comments')?.scrollIntoView({ behavior: 'smooth' });
                    }}
                    onLike={async () => {
                      await blogService.likeComment(comment.id, user?.id);
                      // Refresh comments
                      const loadedComments = await blogService.getComments(post.id);
                      setComments(loadedComments);
                    }}
                  />
                ))
              )}
            </div>
          </section>
        </div>

        {/* Related Posts Sidebar */}
        {relatedPosts.length > 0 && (
          <aside className="max-w-3xl mx-auto mt-16">
            <Separator className="mb-8 bg-white/10" />
            <h2 className="text-2xl font-bold text-white mb-6">Related Posts</h2>
            <div className="grid md:grid-cols-3 gap-6">
              {relatedPosts.map(relatedPost => (
                <Link 
                  key={relatedPost.id} 
                  to={`/blog/${relatedPost.slug}`}
                  className="group"
                >
                  <Card className="h-full bg-white/5 border-white/10 hover:border-purple-500/40 transition-all">
                    {relatedPost.cover_image && (
                      <div className="h-32 overflow-hidden">
                        <img 
                          src={relatedPost.cover_image}
                          alt={relatedPost.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                      </div>
                    )}
                    <CardContent className="p-4">
                      <h3 className="font-semibold text-white group-hover:text-purple-400 transition-colors line-clamp-2">
                        {relatedPost.title}
                      </h3>
                      <p className="text-sm text-gray-500 mt-2">
                        {relatedPost.reading_time_minutes} min read
                      </p>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </aside>
        )}
      </article>
    </div>
  );
};

// Comment Card Component
const CommentCard: React.FC<{
  comment: BlogComment;
  onReply: () => void;
  onLike: () => void;
}> = ({ comment, onReply, onLike }) => {
  const authorName = comment.guest_name || 'Anonymous';
  const isAI = comment.is_ai_reply;
  
  return (
    <div className="space-y-4">
      <Card className={`bg-white/5 border-white/10 ${isAI ? 'border-purple-500/30' : ''}`}>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Avatar className="h-8 w-8">
                <AvatarFallback className={isAI ? 'bg-purple-600' : 'bg-blue-600'}>
                  {isAI ? <Bot className="w-4 h-4" /> : authorName.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-white">{authorName}</span>
                  {isAI && (
                    <Badge className="bg-purple-500/20 text-purple-300 text-xs">
                      <Sparkles className="w-3 h-3 mr-1" />
                      AI
                    </Badge>
                  )}
                </div>
                <span className="text-xs text-gray-500">
                  {new Date(comment.created_at).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </span>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <p className="text-gray-300">{comment.content}</p>
          
          <div className="flex items-center gap-4 mt-4">
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-gray-500 hover:text-white"
              onClick={onLike}
            >
              <ThumbsUp className="w-4 h-4 mr-1" />
              {comment.like_count > 0 && comment.like_count}
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-gray-500 hover:text-white"
              onClick={onReply}
            >
              <Reply className="w-4 h-4 mr-1" />
              Reply
            </Button>
          </div>
        </CardContent>
      </Card>
      
      {/* Replies */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="ml-8 space-y-4 border-l-2 border-white/10 pl-4">
          {comment.replies.map(reply => (
            <CommentCard 
              key={reply.id}
              comment={reply}
              onReply={onReply}
              onLike={async () => {}}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default BlogPostPage;
