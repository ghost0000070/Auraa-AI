// ============================================================================
// Blog AI Engine for Auraa AI
// Handles all AI-powered blog operations: content generation, replies, moderation
// ============================================================================

import { supabase } from '../supabase';
import type { 
  BlogPost, 
  BlogComment, 
  BlogCategory,
  BlogAgentAction,
  CreatePostRequest,
  BlogAgentCommandRequest,
  BlogAgentCommandResponse 
} from '../types/blog';
import { AI_MODELS } from '@/config/constants';

// ============================================================================
// BLOG SERVICE - Database Operations
// ============================================================================

export const blogService = {
  // --------------------------------------------------------------------------
  // Posts
  // --------------------------------------------------------------------------
  
  async getPosts(options: {
    category?: string;
    tag?: string;
    search?: string;
    page?: number;
    limit?: number;
    status?: 'published' | 'draft' | 'archived';
  } = {}): Promise<{ posts: BlogPost[]; total: number }> {
    const { category, tag, search, page = 1, limit = 10, status = 'published' } = options;
    
    let query = supabase
      .from('blog_posts')
      .select('*', { count: 'exact' })
      .eq('status', status)
      .order('published_at', { ascending: false, nullsFirst: false });
    
    if (category) {
      query = query.eq('category', category);
    }
    
    if (tag) {
      query = query.contains('tags', [tag]);
    }
    
    if (search) {
      query = query.or(`title.ilike.%${search}%,content.ilike.%${search}%,excerpt.ilike.%${search}%`);
    }
    
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);
    
    const { data, error, count } = await query;
    
    if (error) {
      console.error('Error fetching posts:', error);
      return { posts: [], total: 0 };
    }
    
    return { posts: data || [], total: count || 0 };
  },
  
  async getPostBySlug(slug: string): Promise<BlogPost | null> {
    const { data, error } = await supabase
      .from('blog_posts')
      .select('*')
      .eq('slug', slug)
      .single();
    
    if (error) {
      console.error('Error fetching post:', error);
      return null;
    }
    
    // Increment view count
    await supabase.rpc('increment_post_view', { post_slug: slug });
    
    return data;
  },
  
  async getRelatedPosts(post: BlogPost, limit = 3): Promise<BlogPost[]> {
    const { data } = await supabase
      .from('blog_posts')
      .select('*')
      .eq('status', 'published')
      .eq('category', post.category)
      .neq('id', post.id)
      .order('published_at', { ascending: false })
      .limit(limit);
    
    return data || [];
  },
  
  async getFeaturedPosts(limit = 5): Promise<BlogPost[]> {
    const { data } = await supabase
      .from('blog_posts')
      .select('*')
      .eq('status', 'published')
      .order('view_count', { ascending: false })
      .limit(limit);
    
    return data || [];
  },
  
  // --------------------------------------------------------------------------
  // Categories
  // --------------------------------------------------------------------------
  
  async getCategories(): Promise<BlogCategory[]> {
    const { data, error } = await supabase
      .from('blog_categories')
      .select('*')
      .order('post_count', { ascending: false });
    
    if (error) {
      console.error('Error fetching categories:', error);
      return [];
    }
    
    return data || [];
  },
  
  // --------------------------------------------------------------------------
  // Comments
  // --------------------------------------------------------------------------
  
  async getComments(postId: string): Promise<BlogComment[]> {
    const { data, error } = await supabase
      .from('blog_comments')
      .select('*')
      .eq('post_id', postId)
      .eq('is_approved', true)
      .order('created_at', { ascending: true });
    
    if (error) {
      console.error('Error fetching comments:', error);
      return [];
    }
    
    // Organize into threads (parent + replies)
    const topLevel = (data || []).filter(c => !c.parent_id);
    const replies = (data || []).filter(c => c.parent_id);
    
    return topLevel.map(comment => ({
      ...comment,
      replies: replies.filter(r => r.parent_id === comment.id),
    }));
  },
  
  async addComment(postId: string, content: string, options: {
    userId?: string;
    parentId?: string;
    guestName?: string;
    guestEmail?: string;
  } = {}): Promise<BlogComment | null> {
    const { userId, parentId, guestName, guestEmail } = options;
    
    const { data, error } = await supabase
      .from('blog_comments')
      .insert({
        post_id: postId,
        user_id: userId || null,
        parent_id: parentId || null,
        guest_name: guestName || null,
        guest_email: guestEmail || null,
        content,
        is_approved: true, // Auto-approve for now
      })
      .select()
      .single();
    
    if (error) {
      console.error('Error adding comment:', error);
      return null;
    }
    
    return data;
  },
  
  // --------------------------------------------------------------------------
  // Likes
  // --------------------------------------------------------------------------
  
  async likePost(postId: string, userId?: string): Promise<boolean> {
    const fingerprint = !userId ? `guest-${Date.now()}-${Math.random()}` : null;
    
    const { error } = await supabase
      .from('blog_post_likes')
      .insert({
        post_id: postId,
        user_id: userId || null,
        guest_fingerprint: fingerprint,
      });
    
    return !error;
  },
  
  async unlikePost(postId: string, userId: string): Promise<boolean> {
    const { error } = await supabase
      .from('blog_post_likes')
      .delete()
      .eq('post_id', postId)
      .eq('user_id', userId);
    
    return !error;
  },
  
  async hasLikedPost(postId: string, userId: string): Promise<boolean> {
    const { data } = await supabase
      .from('blog_post_likes')
      .select('id')
      .eq('post_id', postId)
      .eq('user_id', userId)
      .single();
    
    return !!data;
  },
  
  async likeComment(commentId: string, userId?: string): Promise<boolean> {
    const fingerprint = !userId ? `guest-${Date.now()}-${Math.random()}` : null;
    
    const { error } = await supabase
      .from('blog_comment_likes')
      .insert({
        comment_id: commentId,
        user_id: userId || null,
        guest_fingerprint: fingerprint,
      });
    
    return !error;
  },
};

// ============================================================================
// BLOG AI AGENT - AI-Powered Operations
// ============================================================================

// System prompts for different blog tasks
const BLOG_SYSTEM_PROMPTS = {
  generatePost: `You are the Auraa AI Blog Agent, an expert content creator for the Auraa AI platform.
Your role is to write engaging, informative blog posts about AI employees, automation, and business productivity.

Brand Voice: Confident, forward-thinking, practical, and approachable.
Topics: AI employees, business automation, workflow optimization, productivity, future of work.

Writing Guidelines:
- Use clear, jargon-free language
- Include practical examples and actionable insights
- Structure with compelling headlines and subheadings
- Aim for 800-1500 words
- Include a strong call-to-action

Return a JSON object with: title, slug, excerpt, content (in Markdown), category, tags[], seo_title, seo_description, seo_keywords[]`,

  replyComment: `You are the Auraa AI Blog Agent, responding to reader comments on the Auraa AI blog.

Guidelines:
- Be helpful, friendly, and professional
- Address the commenter by name if provided
- Provide valuable insights or clarification
- Keep responses concise (50-150 words)
- If they have questions, answer them or direct to resources
- Thank them for engaging

Return a JSON object with: reply (string), should_flag (boolean, true if comment needs human review), flag_reason (string if flagged)`,

  moderateComment: `You are the Auraa AI Content Moderator for the Auraa AI blog.

Review the comment for:
- Spam or promotional content
- Offensive or inappropriate language
- Off-topic content
- Bot-like patterns

Return a JSON object with: 
- is_approved (boolean)
- is_flagged (boolean)
- flag_reason (string, if flagged)
- suggested_action: "approve" | "flag" | "delete"`,

  generateIdeas: `You are the Auraa AI Content Strategist.

Generate blog post ideas for the Auraa AI platform based on:
- Current AI and automation trends
- Common user questions and pain points
- SEO opportunities
- Content gaps

Return a JSON object with: ideas[] where each idea has: title, category, target_keyword, estimated_engagement ("high" | "medium" | "low"), brief_outline[]`,

  optimizeSeo: `You are the Auraa AI SEO Specialist.

Optimize the provided blog post for search engines:
- Suggest improved title (60 chars max)
- Write meta description (155 chars max)
- Identify target keywords
- Suggest internal/external linking opportunities
- Check heading structure

Return a JSON object with: seo_title, seo_description, seo_keywords[], suggested_headings[], linking_opportunities[]`,
};

/**
 * Call the blog AI via Puter.js
 */
async function callBlogAI(
  prompt: string, 
  systemPrompt: string, 
  model: string = AI_MODELS.STANDARD
): Promise<string> {
  // Check if we're in browser with Puter available
  if (typeof window === 'undefined') {
    throw new Error('Blog AI requires browser environment');
  }
  
  const puter = (window as unknown as { puter?: { ai?: { chat?: (prompt: string, options: { model: string }) => Promise<unknown> } } }).puter;
  if (!puter?.ai?.chat) {
    throw new Error('Puter.js not available');
  }
  
  const fullPrompt = `${systemPrompt}\n\n---\n\nUser Request:\n${prompt}`;
  
  const response = await puter.ai.chat(fullPrompt, { model });
  
  // Extract content from response
  let content: string | undefined;
  
  // Type guard for response structure
  const resp = response as { message?: { content?: Array<{ text?: string }> }; text?: string; content?: string } | string;
  
  if (typeof resp === 'string') {
    content = resp;
  } else if (resp.message?.content?.[0]?.text) {
    content = resp.message.content[0].text;
  } else if (resp.text) {
    content = resp.text;
  } else if (resp.content) {
    content = resp.content;
  }
  
  if (!content) {
    throw new Error('Empty response from Blog AI');
  }
  
  return content;
}

/**
 * Log an AI agent action
 */
async function logAgentAction(
  actionType: BlogAgentAction['action_type'],
  targetId: string | null,
  targetType: 'post' | 'comment' | null,
  inputPrompt: string,
  outputResult: string,
  status: 'completed' | 'failed' = 'completed',
  metadata: Record<string, unknown> = {}
): Promise<void> {
  await supabase.from('blog_agent_actions').insert({
    action_type: actionType,
    target_id: targetId,
    target_type: targetType,
    ai_agent_id: 'blog-agent',
    input_prompt: inputPrompt,
    output_result: outputResult,
    status,
    metadata,
  });
}

/**
 * Generate URL-friendly slug from title
 */
function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .substring(0, 100);
}

/**
 * Calculate reading time from content
 */
function calculateReadingTime(content: string): number {
  const wordsPerMinute = 200;
  const wordCount = content.split(/\s+/).length;
  return Math.max(1, Math.ceil(wordCount / wordsPerMinute));
}

// Main Blog AI Agent
export const blogAgent = {
  /**
   * Generate a new blog post using AI
   */
  async generatePost(topic: string, options: {
    category?: string;
    keywords?: string[];
    tone?: string;
    length?: 'short' | 'medium' | 'long';
  } = {}): Promise<{ success: boolean; post?: Partial<BlogPost>; error?: string }> {
    try {
      const prompt = `Generate a blog post about: "${topic}"
      
Category: ${options.category || 'general'}
Target Keywords: ${options.keywords?.join(', ') || 'AI employees, automation'}
Tone: ${options.tone || 'professional yet approachable'}
Length: ${options.length || 'medium'} (${options.length === 'short' ? '500-800' : options.length === 'long' ? '1500-2000' : '800-1200'} words)`;

      const result = await callBlogAI(prompt, BLOG_SYSTEM_PROMPTS.generatePost, AI_MODELS.CREATIVE);
      
      // Parse JSON from result
      const jsonMatch = result.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('Invalid response format');
      }
      
      const postData = JSON.parse(jsonMatch[0]);
      
      // Create the post in database
      const post: Partial<BlogPost> = {
        title: postData.title,
        slug: postData.slug || generateSlug(postData.title),
        excerpt: postData.excerpt,
        content: postData.content,
        category: postData.category || options.category || 'general',
        tags: postData.tags || [],
        seo_title: postData.seo_title,
        seo_description: postData.seo_description,
        seo_keywords: postData.seo_keywords,
        reading_time_minutes: calculateReadingTime(postData.content),
        is_ai_generated: true,
        ai_agent_id: 'blog-agent',
        status: 'draft',
        author_name: 'Auraa AI',
      };
      
      // Log the action
      await logAgentAction('generate_content', null, 'post', prompt, JSON.stringify(post));
      
      return { success: true, post };
      
    } catch (error) {
      console.error('Blog AI generate post error:', error);
      await logAgentAction('generate_content', null, 'post', topic, String(error), 'failed');
      return { success: false, error: String(error) };
    }
  },
  
  /**
   * Reply to a comment using AI
   */
  async replyToComment(commentId: string, postId: string): Promise<{ success: boolean; reply?: string; error?: string }> {
    try {
      // Get the comment and post context
      const { data: comment } = await supabase
        .from('blog_comments')
        .select('*')
        .eq('id', commentId)
        .single();
      
      const { data: post } = await supabase
        .from('blog_posts')
        .select('title, category')
        .eq('id', postId)
        .single();
      
      if (!comment || !post) {
        throw new Error('Comment or post not found');
      }
      
      const prompt = `Post: "${post.title}" (Category: ${post.category})
      
Comment from ${comment.guest_name || 'a reader'}:
"${comment.content}"

Generate a thoughtful, helpful reply.`;

      const result = await callBlogAI(prompt, BLOG_SYSTEM_PROMPTS.replyComment, AI_MODELS.STANDARD);
      
      // Parse response
      const jsonMatch = result.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('Invalid response format');
      }
      
      const replyData = JSON.parse(jsonMatch[0]);
      
      // Post the reply
      const { error } = await supabase
        .from('blog_comments')
        .insert({
          post_id: postId,
          parent_id: commentId,
          content: replyData.reply,
          is_ai_reply: true,
          ai_agent_id: 'blog-agent',
          guest_name: 'Auraa AI',
          is_approved: true,
        })
        .select()
        .single();
      
      if (error) throw error;
      
      // Flag for human review if needed
      if (replyData.should_flag) {
        await supabase
          .from('blog_comments')
          .update({ is_flagged: true })
          .eq('id', commentId);
      }
      
      // Log the action
      await logAgentAction('reply_comment', commentId, 'comment', prompt, replyData.reply);
      
      return { success: true, reply: replyData.reply };
      
    } catch (error) {
      console.error('Blog AI reply error:', error);
      await logAgentAction('reply_comment', commentId, 'comment', '', String(error), 'failed');
      return { success: false, error: String(error) };
    }
  },
  
  /**
   * Moderate a comment using AI
   */
  async moderateComment(commentId: string): Promise<{ 
    success: boolean; 
    action?: 'approve' | 'flag' | 'delete';
    reason?: string;
    error?: string;
  }> {
    try {
      const { data: comment } = await supabase
        .from('blog_comments')
        .select('*')
        .eq('id', commentId)
        .single();
      
      if (!comment) {
        throw new Error('Comment not found');
      }
      
      const prompt = `Comment from ${comment.guest_name || 'Anonymous'}:
"${comment.content}"`;

      const result = await callBlogAI(prompt, BLOG_SYSTEM_PROMPTS.moderateComment, AI_MODELS.FAST);
      
      const jsonMatch = result.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('Invalid response format');
      }
      
      const moderation = JSON.parse(jsonMatch[0]);
      
      // Apply moderation action
      await supabase
        .from('blog_comments')
        .update({
          is_approved: moderation.is_approved,
          is_flagged: moderation.is_flagged,
        })
        .eq('id', commentId);
      
      // Log the action
      await logAgentAction('moderate_comment', commentId, 'comment', prompt, JSON.stringify(moderation));
      
      return { 
        success: true, 
        action: moderation.suggested_action,
        reason: moderation.flag_reason,
      };
      
    } catch (error) {
      console.error('Blog AI moderate error:', error);
      return { success: false, error: String(error) };
    }
  },
  
  /**
   * Generate blog post ideas
   */
  async generateIdeas(context?: string): Promise<{ 
    success: boolean; 
    ideas?: Array<{
      title: string;
      category: string;
      target_keyword: string;
      estimated_engagement: string;
      brief_outline: string[];
    }>;
    error?: string;
  }> {
    try {
      const prompt = context || 'Generate 5 blog post ideas for the Auraa AI platform, focusing on AI employees and business automation.';
      
      const result = await callBlogAI(prompt, BLOG_SYSTEM_PROMPTS.generateIdeas, AI_MODELS.CREATIVE);
      
      const jsonMatch = result.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('Invalid response format');
      }
      
      const data = JSON.parse(jsonMatch[0]);
      
      // Log the action
      await logAgentAction('generate_content', null, null, prompt, JSON.stringify(data));
      
      return { success: true, ideas: data.ideas };
      
    } catch (error) {
      console.error('Blog AI ideas error:', error);
      return { success: false, error: String(error) };
    }
  },
  
  /**
   * Optimize post SEO
   */
  async optimizeSeo(postId: string): Promise<{ 
    success: boolean; 
    optimizations?: {
      seo_title: string;
      seo_description: string;
      seo_keywords: string[];
    };
    error?: string;
  }> {
    try {
      const { data: post } = await supabase
        .from('blog_posts')
        .select('*')
        .eq('id', postId)
        .single();
      
      if (!post) {
        throw new Error('Post not found');
      }
      
      const prompt = `Post Title: ${post.title}
Category: ${post.category}
Current Tags: ${post.tags?.join(', ')}
Excerpt: ${post.excerpt}

Content (first 500 chars): ${post.content.substring(0, 500)}...`;

      const result = await callBlogAI(prompt, BLOG_SYSTEM_PROMPTS.optimizeSeo, AI_MODELS.STANDARD);
      
      const jsonMatch = result.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('Invalid response format');
      }
      
      const seoData = JSON.parse(jsonMatch[0]);
      
      // Update the post with SEO optimizations
      await supabase
        .from('blog_posts')
        .update({
          seo_title: seoData.seo_title,
          seo_description: seoData.seo_description,
          seo_keywords: seoData.seo_keywords,
        })
        .eq('id', postId);
      
      // Log the action
      await logAgentAction('seo_optimize', postId, 'post', prompt, JSON.stringify(seoData));
      
      return { 
        success: true, 
        optimizations: {
          seo_title: seoData.seo_title,
          seo_description: seoData.seo_description,
          seo_keywords: seoData.seo_keywords,
        },
      };
      
    } catch (error) {
      console.error('Blog AI SEO error:', error);
      return { success: false, error: String(error) };
    }
  },
  
  /**
   * Publish a post (from draft to published)
   */
  async publishPost(postId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('blog_posts')
        .update({
          status: 'published',
          published_at: new Date().toISOString(),
        })
        .eq('id', postId);
      
      if (error) throw error;
      
      await logAgentAction('publish_post', postId, 'post', 'Publish post', 'Published');
      
      return { success: true };
      
    } catch (error) {
      console.error('Publish error:', error);
      return { success: false, error: String(error) };
    }
  },
  
  /**
   * Create a post directly (for admin use)
   */
  async createPost(data: CreatePostRequest): Promise<{ success: boolean; post?: BlogPost; error?: string }> {
    try {
      const slug = generateSlug(data.title);
      
      const { data: post, error } = await supabase
        .from('blog_posts')
        .insert({
          ...data,
          slug,
          reading_time_minutes: calculateReadingTime(data.content),
          is_ai_generated: false,
          author_name: 'Auraa AI',
          published_at: data.status === 'published' ? new Date().toISOString() : null,
        })
        .select()
        .single();
      
      if (error) throw error;
      
      await logAgentAction('create_post', post.id, 'post', JSON.stringify(data), 'Post created');
      
      return { success: true, post };
      
    } catch (error) {
      console.error('Create post error:', error);
      return { success: false, error: String(error) };
    }
  },
  
  /**
   * Update an existing post
   */
  async updatePost(postId: string, updates: Partial<BlogPost>): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('blog_posts')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
          reading_time_minutes: updates.content ? calculateReadingTime(updates.content) : undefined,
        })
        .eq('id', postId);
      
      if (error) throw error;
      
      await logAgentAction('update_post', postId, 'post', JSON.stringify(updates), 'Post updated');
      
      return { success: true };
      
    } catch (error) {
      console.error('Update post error:', error);
      return { success: false, error: String(error) };
    }
  },
  
  /**
   * Archive a post
   */
  async archivePost(postId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('blog_posts')
        .update({ status: 'archived' })
        .eq('id', postId);
      
      if (error) throw error;
      
      await logAgentAction('archive_post', postId, 'post', 'Archive post', 'Archived');
      
      return { success: true };
      
    } catch (error) {
      console.error('Archive error:', error);
      return { success: false, error: String(error) };
    }
  },
  
  /**
   * Handle command from external source (edge function, etc.)
   */
  async handleCommand(command: BlogAgentCommandRequest): Promise<BlogAgentCommandResponse> {
    try {
      let result: unknown;
      const actionId = '';
      
      switch (command.command) {
        case 'generate_post': {
          const res = await this.generatePost(
            command.params.topic as string,
            command.params as { category?: string; keywords?: string[]; tone?: string; length?: 'short' | 'medium' | 'long' }
          );
          result = res.post;
          break;
        }
        case 'reply_to_comment': {
          const res = await this.replyToComment(
            command.params.commentId as string,
            command.params.postId as string
          );
          result = { reply: res.reply };
          break;
        }
        case 'moderate_comments': {
          const res = await this.moderateComment(command.params.commentId as string);
          result = res;
          break;
        }
        case 'optimize_seo': {
          const res = await this.optimizeSeo(command.params.postId as string);
          result = res.optimizations;
          break;
        }
        case 'generate_ideas': {
          const res = await this.generateIdeas(command.params.context as string);
          result = res.ideas;
          break;
        }
        case 'analyze_engagement': {
          // Get engagement metrics
          const { data } = await supabase
            .from('blog_posts')
            .select('title, view_count, like_count, comment_count')
            .eq('status', 'published')
            .order('view_count', { ascending: false })
            .limit(10);
          result = { top_posts: data };
          break;
        }
        default:
          throw new Error(`Unknown command: ${command.command}`);
      }
      
      return {
        success: true,
        action_id: actionId,
        result,
        message: `Command ${command.command} executed successfully`,
      };
      
    } catch (error) {
      return {
        success: false,
        action_id: '',
        result: null,
        message: String(error),
      };
    }
  },
};

// ============================================================================
// REALTIME SUBSCRIPTIONS
// ============================================================================

/**
 * Subscribe to new comments for auto-reply
 */
export function subscribeToNewComments(
  onNewComment: (comment: BlogComment) => void
): () => void {
  const channel = supabase
    .channel('blog-comments')
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'blog_comments',
      },
      (payload) => {
        onNewComment(payload.new as BlogComment);
      }
    )
    .subscribe();
  
  return () => {
    supabase.removeChannel(channel);
  };
}

/**
 * Auto-reply handler - call this to enable automatic AI replies
 */
export async function enableAutoReply(): Promise<() => void> {
  return subscribeToNewComments(async (comment) => {
    // Don't reply to AI comments
    if (comment.is_ai_reply) return;
    
    // Check settings
    const { data: settings } = await supabase
      .from('blog_settings')
      .select('ai_auto_reply_enabled')
      .single();
    
    if (!settings?.ai_auto_reply_enabled) return;
    
    // Generate reply
    await blogAgent.replyToComment(comment.id, comment.post_id);
  });
}

export default blogAgent;
