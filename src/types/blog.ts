// ============================================================================
// Blog System Types for Auraa AI
// ============================================================================

export interface BlogPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  content: string;
  cover_image: string | null;
  author_name: string;
  author_avatar: string | null;
  category: string;
  tags: string[];
  status: 'draft' | 'published' | 'archived';
  is_ai_generated: boolean;
  ai_agent_id: string | null;
  view_count: number;
  like_count: number;
  comment_count: number;
  seo_title: string | null;
  seo_description: string | null;
  seo_keywords: string[] | null;
  reading_time_minutes: number;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface BlogComment {
  id: string;
  post_id: string;
  parent_id: string | null;
  user_id: string | null;
  guest_name: string | null;
  guest_email: string | null;
  content: string;
  is_ai_reply: boolean;
  ai_agent_id: string | null;
  is_approved: boolean;
  is_flagged: boolean;
  like_count: number;
  created_at: string;
  updated_at: string;
  // Joined fields
  replies?: BlogComment[];
  user?: {
    email: string;
    user_metadata?: {
      full_name?: string;
      avatar_url?: string;
    };
  };
}

export interface BlogCategory {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  color: string;
  post_count: number;
  created_at: string;
}

export interface BlogPostLike {
  id: string;
  post_id: string;
  user_id: string | null;
  guest_fingerprint: string | null;
  created_at: string;
}

export interface BlogCommentLike {
  id: string;
  comment_id: string;
  user_id: string | null;
  guest_fingerprint: string | null;
  created_at: string;
}

export interface BlogAgentAction {
  id: string;
  action_type: 
    | 'create_post'
    | 'update_post'
    | 'publish_post'
    | 'archive_post'
    | 'reply_comment'
    | 'moderate_comment'
    | 'generate_content'
    | 'seo_optimize'
    | 'schedule_post'
    | 'analyze_engagement';
  target_id: string | null;
  target_type: 'post' | 'comment' | null;
  ai_agent_id: string | null;
  input_prompt: string | null;
  output_result: string | null;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface BlogSettings {
  id: string;
  ai_auto_reply_enabled: boolean;
  ai_moderation_enabled: boolean;
  ai_content_generation_enabled: boolean;
  default_ai_agent_id: string;
  require_comment_approval: boolean;
  allow_guest_comments: boolean;
  posts_per_page: number;
  featured_post_ids: string[];
  social_share_enabled: boolean;
  newsletter_cta_enabled: boolean;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// Blog AI Agent Types
// ============================================================================

export interface BlogAgentConfig {
  id: string;
  name: string;
  description: string;
  capabilities: BlogAgentCapability[];
  personality: string;
  writingStyle: string;
  topics: string[];
  autoActions: BlogAgentAutoAction[];
}

export type BlogAgentCapability =
  | 'write_posts'
  | 'reply_comments'
  | 'moderate_content'
  | 'seo_optimize'
  | 'schedule_content'
  | 'analyze_engagement'
  | 'generate_ideas';

export interface BlogAgentAutoAction {
  trigger: 'new_comment' | 'low_engagement' | 'scheduled' | 'trending_topic';
  action: BlogAgentAction['action_type'];
  enabled: boolean;
  config?: Record<string, unknown>;
}

// ============================================================================
// API Request/Response Types
// ============================================================================

export interface CreatePostRequest {
  title: string;
  content: string;
  excerpt?: string;
  category: string;
  tags?: string[];
  cover_image?: string;
  status?: 'draft' | 'published';
  seo_title?: string;
  seo_description?: string;
  seo_keywords?: string[];
}

export interface UpdatePostRequest extends Partial<CreatePostRequest> {
  id: string;
}

export interface CreateCommentRequest {
  post_id: string;
  content: string;
  parent_id?: string;
  guest_name?: string;
  guest_email?: string;
}

export interface BlogAgentCommandRequest {
  command: 
    | 'generate_post'
    | 'reply_to_comment'
    | 'moderate_comments'
    | 'optimize_seo'
    | 'analyze_engagement'
    | 'generate_ideas';
  params: Record<string, unknown>;
}

export interface BlogAgentCommandResponse {
  success: boolean;
  action_id: string;
  result: unknown;
  message: string;
}

// ============================================================================
// Blog Page Props
// ============================================================================

export interface BlogPageProps {
  posts: BlogPost[];
  categories: BlogCategory[];
  currentCategory?: string;
  currentTag?: string;
  searchQuery?: string;
  page: number;
  totalPages: number;
}

export interface BlogPostPageProps {
  post: BlogPost;
  comments: BlogComment[];
  relatedPosts: BlogPost[];
  hasLiked: boolean;
}

// ============================================================================
// Blog Automation Types
// ============================================================================

export interface BlogContentCalendar {
  id: string;
  title: string;
  topic: string;
  category_id: string | null;
  keywords: string[];
  scheduled_date: string;
  scheduled_time: string;
  status: 'scheduled' | 'generating' | 'generated' | 'published' | 'failed' | 'cancelled';
  post_id: string | null;
  generation_prompt: string | null;
  notes: string | null;
  priority: number;
  created_at: string;
  updated_at: string;
  // Joined
  category?: BlogCategory;
  post?: BlogPost;
}

export interface BlogLearningMetrics {
  id: string;
  post_id: string;
  views_24h: number;
  views_7d: number;
  views_30d: number;
  likes_count: number;
  comments_count: number;
  shares_count: number;
  avg_read_time_seconds: number;
  bounce_rate: number;
  word_count: number;
  reading_level: string | null;
  sentiment_score: number;
  engagement_score: number;
  virality_score: number;
  quality_score: number;
  is_top_performer: boolean;
  learned_patterns: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  // Joined
  post?: BlogPost;
}

export interface BlogTopicPerformance {
  id: string;
  topic: string;
  category_id: string | null;
  total_posts: number;
  total_views: number;
  total_likes: number;
  total_comments: number;
  avg_engagement_score: number;
  trending_score: number;
  last_posted_at: string | null;
  recommended_frequency_days: number;
  successful_keywords: string[];
  successful_titles: string[];
  optimal_length: number | null;
  best_posting_time: string | null;
  created_at: string;
  updated_at: string;
  // Joined
  category?: BlogCategory;
}

export interface BlogAutomationRun {
  id: string;
  run_type: 'idea_generation' | 'post_generation' | 'auto_reply' | 'auto_moderation' | 'seo_optimization' | 'learning_update' | 'scheduled_publish';
  status: 'running' | 'completed' | 'failed' | 'partial';
  items_processed: number;
  items_succeeded: number;
  items_failed: number;
  input_data: Record<string, unknown>;
  output_data: Record<string, unknown>;
  error_message: string | null;
  started_at: string;
  completed_at: string | null;
  duration_ms: number | null;
}

export interface BlogIdeaQueue {
  id: string;
  title: string;
  topic: string;
  category_id: string | null;
  brief_description: string | null;
  outline: string[];
  target_keywords: string[];
  estimated_engagement: string | null;
  relevance_score: number;
  trend_score: number;
  priority_score: number;
  status: 'pending' | 'approved' | 'scheduled' | 'rejected' | 'used';
  used_in_post_id: string | null;
  inspiration_source: 'trend' | 'learning' | 'product_update' | 'user_request' | 'competitor' | 'ai_creative' | null;
  created_at: string;
  reviewed_at: string | null;
  // Joined
  category?: BlogCategory;
}

export interface BlogReplyTemplate {
  id: string;
  comment_type: 'question' | 'praise' | 'criticism' | 'suggestion' | 'spam' | 'general';
  template_pattern: string;
  example_replies: string[];
  times_used: number;
  avg_satisfaction_score: number;
  is_active: boolean;
  learned_from_post_ids: string[];
  created_at: string;
  updated_at: string;
}

// Extended BlogSettings with automation fields
export interface BlogSettingsExtended extends BlogSettings {
  auto_generate_ideas: boolean;
  idea_generation_frequency: 'daily' | 'weekly' | 'biweekly' | 'monthly';
  auto_schedule_posts: boolean;
  posts_per_week: number;
  preferred_posting_days: string[];
  preferred_posting_time: string;
  learning_enabled: boolean;
  learning_update_frequency: 'hourly' | 'daily' | 'weekly';
  auto_seo_optimization: boolean;
  content_focus_areas: string[];
}

// ============================================================================
// Automation Action Types
// ============================================================================

export interface AutomationSchedule {
  type: 'idea_generation' | 'post_generation' | 'learning_update' | 'content_review';
  frequency: 'hourly' | 'daily' | 'weekly' | 'monthly';
  lastRun: string | null;
  nextRun: string;
  enabled: boolean;
}

export interface LearningInsight {
  type: 'topic' | 'keyword' | 'format' | 'timing' | 'length';
  insight: string;
  confidence: number;
  dataPoints: number;
  recommendation: string;
}

export interface ContentIdea {
  title: string;
  topic: string;
  category: string;
  keywords: string[];
  outline: string[];
  estimatedEngagement: 'low' | 'medium' | 'high' | 'viral';
  source: BlogIdeaQueue['inspiration_source'];
  reasoning: string;
}
