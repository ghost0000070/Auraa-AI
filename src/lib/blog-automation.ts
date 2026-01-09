/**
 * Blog Automation Engine
 * Handles automatic blog generation, learning, and content scheduling
 */

import { supabase } from '@/supabase';
import { blogAgent, blogService } from './blog-engine';
import type { 
  BlogPost, 
  BlogComment,
  BlogIdeaQueue, 
  BlogContentCalendar, 
  BlogTopicPerformance,
  BlogAutomationRun,
  BlogSettingsExtended,
  ContentIdea,
  LearningInsight
} from '@/types/blog';
import { AI_MODELS } from '@/config/constants';
import { AURAA_PRODUCT_KNOWLEDGE, CONTENT_STRATEGY } from '@/config/blog-agent-config';

// ============================================================================
// Blog Automation Service
// ============================================================================

class BlogAutomationService {
  private isRunning = false;
  private intervals: ReturnType<typeof setInterval>[] = [];

  /**
   * Start the automation service
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      console.log('[BlogAutomation] Already running');
      return;
    }

    console.log('[BlogAutomation] Starting automation service...');
    this.isRunning = true;

    // Load settings
    const settings = await this.getSettings();
    if (!settings) {
      console.error('[BlogAutomation] Failed to load settings');
      return;
    }

    // Set up scheduled tasks based on settings
    if (settings.auto_generate_ideas) {
      this.scheduleIdeaGeneration(settings.idea_generation_frequency);
    }

    if (settings.auto_schedule_posts) {
      this.schedulePostGeneration(settings);
    }

    if (settings.learning_enabled) {
      this.scheduleLearningUpdate(settings.learning_update_frequency);
    }

    // Set up realtime listeners for auto-reply and moderation
    if (settings.ai_auto_reply_enabled) {
      this.setupAutoReplyListener();
    }

    if (settings.ai_moderation_enabled) {
      this.setupAutoModerationListener();
    }

    console.log('[BlogAutomation] Service started successfully');
  }

  /**
   * Stop the automation service
   */
  stop(): void {
    console.log('[BlogAutomation] Stopping automation service...');
    this.intervals.forEach(interval => clearInterval(interval));
    this.intervals = [];
    this.isRunning = false;
  }

  /**
   * Get automation settings
   */
  private async getSettings(): Promise<BlogSettingsExtended | null> {
    const { data, error } = await supabase
      .from('blog_settings')
      .select('*')
      .single();

    if (error) {
      console.error('[BlogAutomation] Error loading settings:', error);
      return null;
    }

    return data as BlogSettingsExtended;
  }

  // ============================================================================
  // Idea Generation
  // ============================================================================

  /**
   * Schedule automatic idea generation
   */
  private scheduleIdeaGeneration(frequency: string): void {
    const intervalMs = this.frequencyToMs(frequency);
    
    // Run immediately on start
    this.generateIdeas();

    const interval = setInterval(() => {
      this.generateIdeas();
    }, intervalMs);

    this.intervals.push(interval);
    console.log(`[BlogAutomation] Idea generation scheduled: ${frequency}`);
  }

  /**
   * Generate new blog post ideas using AI
   */
  async generateIdeas(count: number = 5): Promise<ContentIdea[]> {
    const runId = await this.startAutomationRun('idea_generation', { count });

    try {
      // Get current performance data for context
      const topPerformers = await this.getTopPerformingTopics();
      const recentPosts = await blogService.getPosts({ limit: 10 });
      const existingIdeas = await this.getPendingIdeas();

      // Build context for AI
      const context = this.buildIdeaGenerationContext(topPerformers, recentPosts.posts, existingIdeas);

      // Call AI to generate ideas
      const ideas = await this.callAIForIdeas(context, count);

      // Store ideas in queue
      for (const idea of ideas) {
        await this.saveIdea(idea);
      }

      await this.completeAutomationRun(runId, 'completed', {
        items_processed: count,
        items_succeeded: ideas.length,
        output_data: { ideas }
      });

      return ideas;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      await this.completeAutomationRun(runId, 'failed', {
        error_message: errorMessage
      });
      throw error;
    }
  }

  private buildIdeaGenerationContext(
    topPerformers: BlogTopicPerformance[],
    recentPosts: BlogPost[],
    existingIdeas: BlogIdeaQueue[]
  ): string {
    const productInfo = JSON.stringify(AURAA_PRODUCT_KNOWLEDGE, null, 2);
    const strategy = JSON.stringify(CONTENT_STRATEGY, null, 2);
    
    const topTopics = topPerformers.slice(0, 5).map(t => 
      `- ${t.topic}: ${t.avg_engagement_score.toFixed(1)} engagement, ${t.total_views} views`
    ).join('\n');

    const recent = recentPosts.slice(0, 5).map(p => 
      `- "${p.title}" (${p.category})`
    ).join('\n');

    const pending = existingIdeas.slice(0, 5).map(i => 
      `- "${i.title}"`
    ).join('\n');

    return `
# Auraa AI Product Knowledge
${productInfo}

# Content Strategy
${strategy}

# Top Performing Topics (for learning)
${topTopics || 'No data yet'}

# Recent Posts (avoid duplicates)
${recent || 'No posts yet'}

# Pending Ideas (avoid duplicates)
${pending || 'No pending ideas'}
`;
  }

  private async callAIForIdeas(context: string, count: number): Promise<ContentIdea[]> {
    const prompt = `
Based on the Auraa AI product knowledge and content strategy provided, generate ${count} unique blog post ideas.

Consider:
1. Topics that would attract our target audience (small business owners, entrepreneurs, productivity enthusiasts)
2. Keywords that will rank well for AI automation and productivity
3. Content that showcases Auraa AI's capabilities
4. Mix of educational, promotional, and thought leadership content

For each idea, provide:
- title: Compelling, SEO-friendly title
- topic: Main topic/theme
- category: One of our blog categories
- keywords: 3-5 target keywords
- outline: 4-6 main sections
- estimatedEngagement: 'low', 'medium', 'high', or 'viral'
- source: 'ai_creative' or 'product_update' or 'trend'
- reasoning: Why this idea would perform well

Respond with valid JSON array only:
[
  {
    "title": "...",
    "topic": "...",
    "category": "...",
    "keywords": ["...", "..."],
    "outline": ["...", "..."],
    "estimatedEngagement": "high",
    "source": "ai_creative",
    "reasoning": "..."
  }
]
`;

    const response = await this.callBlogAI(prompt, context);
    
    // Parse JSON from response
    const jsonMatch = response.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      throw new Error('Failed to parse ideas from AI response');
    }

    return JSON.parse(jsonMatch[0]) as ContentIdea[];
  }

  private async saveIdea(idea: ContentIdea): Promise<void> {
    // Find category ID
    const { data: category } = await supabase
      .from('blog_categories')
      .select('id')
      .eq('slug', idea.category.toLowerCase().replace(/\s+/g, '-'))
      .single();

    await supabase.from('blog_idea_queue').insert({
      title: idea.title,
      topic: idea.topic,
      category_id: category?.id || null,
      brief_description: idea.reasoning,
      outline: idea.outline,
      target_keywords: idea.keywords,
      estimated_engagement: idea.estimatedEngagement,
      relevance_score: this.engagementToScore(idea.estimatedEngagement),
      trend_score: idea.source === 'trend' ? 8.0 : 5.0,
      priority_score: this.engagementToScore(idea.estimatedEngagement),
      inspiration_source: idea.source,
      status: 'pending'
    });
  }

  private engagementToScore(engagement: string): number {
    switch (engagement) {
      case 'viral': return 10.0;
      case 'high': return 8.0;
      case 'medium': return 5.0;
      case 'low': return 3.0;
      default: return 5.0;
    }
  }

  // ============================================================================
  // Post Generation & Scheduling
  // ============================================================================

  /**
   * Schedule automatic post generation
   */
  private schedulePostGeneration(settings: BlogSettingsExtended): void {
    // Check every hour if we need to generate/publish posts
    const interval = setInterval(async () => {
      await this.checkAndGenerateScheduledPosts(settings);
    }, 60 * 60 * 1000); // Every hour

    this.intervals.push(interval);
    console.log('[BlogAutomation] Post generation scheduled');
  }

  /**
   * Check content calendar and generate posts as needed
   */
  async checkAndGenerateScheduledPosts(settings: BlogSettingsExtended): Promise<void> {
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const currentHour = now.getHours();

    // Get scheduled items for today that haven't been processed
    const { data: scheduled } = await supabase
      .from('blog_content_calendar')
      .select('*')
      .eq('scheduled_date', today)
      .eq('status', 'scheduled')
      .order('priority', { ascending: false });

    if (!scheduled || scheduled.length === 0) {
      // Check if we need to auto-schedule from idea queue
      await this.autoScheduleFromIdeas(settings);
      return;
    }

    for (const item of scheduled) {
      const scheduledHour = parseInt(item.scheduled_time.split(':')[0]);
      
      if (currentHour >= scheduledHour) {
        await this.generateAndPublishPost(item as BlogContentCalendar);
      }
    }
  }

  /**
   * Auto-schedule posts from the idea queue
   */
  private async autoScheduleFromIdeas(settings: BlogSettingsExtended): Promise<void> {
    // Check how many posts we have scheduled this week
    const startOfWeek = new Date();
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(endOfWeek.getDate() + 7);

    const { count } = await supabase
      .from('blog_content_calendar')
      .select('*', { count: 'exact', head: true })
      .gte('scheduled_date', startOfWeek.toISOString().split('T')[0])
      .lte('scheduled_date', endOfWeek.toISOString().split('T')[0])
      .neq('status', 'cancelled');

    const scheduledCount = count || 0;
    const neededPosts = settings.posts_per_week - scheduledCount;

    if (neededPosts <= 0) return;

    // Get top ideas from queue
    const { data: ideas } = await supabase
      .from('blog_idea_queue')
      .select('*')
      .eq('status', 'pending')
      .order('priority_score', { ascending: false })
      .limit(neededPosts);

    if (!ideas || ideas.length === 0) return;

    // Schedule each idea
    for (let i = 0; i < ideas.length; i++) {
      const idea = ideas[i] as BlogIdeaQueue;
      const scheduledDate = this.getNextScheduleDate(settings.preferred_posting_days, i);

      await supabase.from('blog_content_calendar').insert({
        title: idea.title,
        topic: idea.topic,
        category_id: idea.category_id,
        keywords: idea.target_keywords,
        scheduled_date: scheduledDate,
        scheduled_time: settings.preferred_posting_time,
        generation_prompt: idea.brief_description,
        priority: Math.round(idea.priority_score)
      });

      // Mark idea as scheduled
      await supabase
        .from('blog_idea_queue')
        .update({ status: 'scheduled' })
        .eq('id', idea.id);
    }
  }

  private getNextScheduleDate(preferredDays: string[], offset: number): string {
    const dayMap: Record<string, number> = {
      'sunday': 0, 'monday': 1, 'tuesday': 2, 'wednesday': 3,
      'thursday': 4, 'friday': 5, 'saturday': 6
    };

    const today = new Date();
    const targetDayIndex = offset % preferredDays.length;
    const targetDayName = preferredDays[targetDayIndex]?.toLowerCase() || 'tuesday';
    const targetDay = dayMap[targetDayName] ?? 2;

    let daysUntilTarget = targetDay - today.getDay();
    if (daysUntilTarget <= 0) daysUntilTarget += 7;
    daysUntilTarget += Math.floor(offset / preferredDays.length) * 7;

    const scheduledDate = new Date(today);
    scheduledDate.setDate(today.getDate() + daysUntilTarget);

    return scheduledDate.toISOString().split('T')[0];
  }

  /**
   * Generate and publish a scheduled post
   */
  async generateAndPublishPost(calendar: BlogContentCalendar): Promise<BlogPost | null> {
    const runId = await this.startAutomationRun('post_generation', { 
      calendar_id: calendar.id,
      title: calendar.title 
    });

    try {
      // Update status to generating
      await supabase
        .from('blog_content_calendar')
        .update({ status: 'generating' })
        .eq('id', calendar.id);

      // Get category info
      let categorySlug = 'ai-employees';
      if (calendar.category_id) {
        const { data: category } = await supabase
          .from('blog_categories')
          .select('slug')
          .eq('id', calendar.category_id)
          .single();
        if (category) categorySlug = category.slug;
      }

      // Generate the post using blog agent
      const result = await blogAgent.generatePost(calendar.topic, {
        category: categorySlug,
        keywords: calendar.keywords,
        tone: 'professional',
        length: 'long'
      });

      if (!result.success || !result.post) {
        throw new Error(result.error || 'Failed to generate post');
      }

      // Use the generated title or calendar title
      const post = result.post;
      post.title = calendar.title || post.title;

      // Create the post
      const createResult = await blogAgent.createPost({
        title: post.title as string,
        content: post.content as string,
        excerpt: post.excerpt as string,
        category: categorySlug,
        tags: post.tags as string[] || [],
        status: 'published',
        seo_title: post.seo_title as string,
        seo_description: post.seo_description as string,
        seo_keywords: calendar.keywords
      });

      if (!createResult.success || !createResult.post) {
        throw new Error(createResult.error || 'Failed to create post');
      }

      const createdPost = createResult.post;

      // Update calendar entry
      await supabase
        .from('blog_content_calendar')
        .update({ 
          status: 'published',
          post_id: createdPost.id 
        })
        .eq('id', calendar.id);

      await this.completeAutomationRun(runId, 'completed', {
        items_processed: 1,
        items_succeeded: 1,
        output_data: { post_id: createdPost.id }
      });

      return createdPost;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      await supabase
        .from('blog_content_calendar')
        .update({ status: 'failed' })
        .eq('id', calendar.id);

      await this.completeAutomationRun(runId, 'failed', {
        error_message: errorMessage
      });

      return null;
    }
  }

  // ============================================================================
  // Auto-Reply System
  // ============================================================================

  /**
   * Set up realtime listener for new comments
   */
  private setupAutoReplyListener(): void {
    supabase
      .channel('blog-comments-auto-reply')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'blog_comments'
        },
        async (payload) => {
          const comment = payload.new as BlogComment;
          
          // Don't reply to AI comments
          if (comment.is_ai_reply) return;
          
          // Don't reply to replies (only top-level comments)
          if (comment.parent_id) return;

          // Auto-reply after a short delay
          setTimeout(async () => {
            await this.autoReplyToComment(comment);
          }, 5000); // 5 second delay to seem more natural
        }
      )
      .subscribe();

    console.log('[BlogAutomation] Auto-reply listener active');
  }

  /**
   * Automatically reply to a comment
   */
  async autoReplyToComment(comment: BlogComment): Promise<void> {
    const runId = await this.startAutomationRun('auto_reply', {
      comment_id: comment.id,
      post_id: comment.post_id
    });

    try {
      const result = await blogAgent.replyToComment(comment.id, comment.post_id);

      await this.completeAutomationRun(runId, result.success ? 'completed' : 'failed', {
        items_processed: 1,
        items_succeeded: result.success ? 1 : 0,
        error_message: result.error
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      await this.completeAutomationRun(runId, 'failed', {
        error_message: errorMessage
      });
    }
  }

  // ============================================================================
  // Auto-Moderation System
  // ============================================================================

  /**
   * Set up realtime listener for comment moderation
   */
  private setupAutoModerationListener(): void {
    supabase
      .channel('blog-comments-auto-moderate')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'blog_comments'
        },
        async (payload) => {
          const comment = payload.new as BlogComment;
          
          // Don't moderate AI comments
          if (comment.is_ai_reply) return;
          
          // Already approved
          if (comment.is_approved) return;

          await this.autoModerateComment(comment);
        }
      )
      .subscribe();

    console.log('[BlogAutomation] Auto-moderation listener active');
  }

  /**
   * Automatically moderate a comment
   */
  async autoModerateComment(comment: BlogComment): Promise<void> {
    const runId = await this.startAutomationRun('auto_moderation', {
      comment_id: comment.id
    });

    try {
      const result = await blogAgent.moderateComment(comment.id);

      await this.completeAutomationRun(runId, result.success ? 'completed' : 'failed', {
        items_processed: 1,
        items_succeeded: result.success ? 1 : 0,
        output_data: { action: result.action },
        error_message: result.error
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      await this.completeAutomationRun(runId, 'failed', {
        error_message: errorMessage
      });
    }
  }

  // ============================================================================
  // Learning System
  // ============================================================================

  /**
   * Schedule learning updates
   */
  private scheduleLearningUpdate(frequency: string): void {
    const intervalMs = this.frequencyToMs(frequency);
    
    const interval = setInterval(() => {
      this.updateLearning();
    }, intervalMs);

    this.intervals.push(interval);
    console.log(`[BlogAutomation] Learning updates scheduled: ${frequency}`);
  }

  /**
   * Update learning metrics and patterns
   */
  async updateLearning(): Promise<LearningInsight[]> {
    const runId = await this.startAutomationRun('learning_update', {});

    try {
      const insights: LearningInsight[] = [];

      // Update topic performance
      await this.updateTopicPerformance();

      // Identify top performers
      await this.identifyTopPerformers();

      // Extract patterns from successful content
      const patterns = await this.extractSuccessPatterns();
      insights.push(...patterns);

      // Update engagement scores
      await this.updateEngagementScores();

      await this.completeAutomationRun(runId, 'completed', {
        items_processed: insights.length,
        items_succeeded: insights.length,
        output_data: { insights }
      });

      return insights;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      await this.completeAutomationRun(runId, 'failed', {
        error_message: errorMessage
      });
      return [];
    }
  }

  private async updateTopicPerformance(): Promise<void> {
    // Aggregate post metrics by topic/category
    const { data: posts } = await supabase
      .from('blog_posts')
      .select('category, view_count, like_count, comment_count')
      .eq('status', 'published');

    if (!posts) return;

    const topicStats: Record<string, {
      total_posts: number;
      total_views: number;
      total_likes: number;
      total_comments: number;
    }> = {};

    for (const post of posts) {
      const topic = post.category;
      if (!topicStats[topic]) {
        topicStats[topic] = { total_posts: 0, total_views: 0, total_likes: 0, total_comments: 0 };
      }
      topicStats[topic].total_posts++;
      topicStats[topic].total_views += post.view_count || 0;
      topicStats[topic].total_likes += post.like_count || 0;
      topicStats[topic].total_comments += post.comment_count || 0;
    }

    // Upsert topic performance
    for (const [topic, stats] of Object.entries(topicStats)) {
      const avgEngagement = stats.total_posts > 0
        ? ((stats.total_likes * 2 + stats.total_comments * 5) / stats.total_views) * 100
        : 0;

      await supabase
        .from('blog_topic_performance')
        .upsert({
          topic,
          ...stats,
          avg_engagement_score: Math.min(avgEngagement, 100),
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'topic'
        });
    }
  }

  private async identifyTopPerformers(): Promise<void> {
    // Get posts with their metrics
    const { data: metrics } = await supabase
      .from('blog_learning_metrics')
      .select('*, post:blog_posts(*)')
      .order('engagement_score', { ascending: false })
      .limit(10);

    if (!metrics) return;

    // Mark top 10% as top performers
    const { data: allMetrics } = await supabase
      .from('blog_learning_metrics')
      .select('id, engagement_score');

    if (!allMetrics || allMetrics.length === 0) return;

    const threshold = allMetrics.length >= 10
      ? allMetrics[Math.floor(allMetrics.length * 0.1)].engagement_score
      : 0;

    await supabase
      .from('blog_learning_metrics')
      .update({ is_top_performer: true })
      .gte('engagement_score', threshold);

    await supabase
      .from('blog_learning_metrics')
      .update({ is_top_performer: false })
      .lt('engagement_score', threshold);
  }

  private async extractSuccessPatterns(): Promise<LearningInsight[]> {
    const insights: LearningInsight[] = [];

    // Get top performing posts
    const { data: topPosts } = await supabase
      .from('blog_posts')
      .select('*')
      .eq('status', 'published')
      .order('view_count', { ascending: false })
      .limit(20);

    if (!topPosts || topPosts.length < 5) return insights;

    // Analyze title patterns
    const titles = topPosts.map(p => p.title);
    const avgTitleLength = titles.reduce((sum, t) => sum + t.length, 0) / titles.length;
    
    insights.push({
      type: 'format',
      insight: `Top performing posts have titles around ${Math.round(avgTitleLength)} characters`,
      confidence: 0.7,
      dataPoints: topPosts.length,
      recommendation: `Aim for titles between ${Math.round(avgTitleLength * 0.8)} and ${Math.round(avgTitleLength * 1.2)} characters`
    });

    // Analyze content length
    const avgLength = topPosts.reduce((sum, p) => sum + (p.content?.length || 0), 0) / topPosts.length;
    const avgWords = Math.round(avgLength / 5); // Rough word estimate

    insights.push({
      type: 'length',
      insight: `Top performing posts average ${avgWords} words`,
      confidence: 0.6,
      dataPoints: topPosts.length,
      recommendation: `Aim for posts between ${Math.round(avgWords * 0.8)} and ${Math.round(avgWords * 1.2)} words`
    });

    // Analyze categories
    const categoryCounts: Record<string, number> = {};
    topPosts.forEach(p => {
      categoryCounts[p.category] = (categoryCounts[p.category] || 0) + 1;
    });

    const topCategory = Object.entries(categoryCounts)
      .sort((a, b) => b[1] - a[1])[0];

    if (topCategory) {
      insights.push({
        type: 'topic',
        insight: `"${topCategory[0]}" is the best performing category with ${topCategory[1]} top posts`,
        confidence: 0.8,
        dataPoints: topCategory[1],
        recommendation: `Consider creating more content in the "${topCategory[0]}" category`
      });
    }

    return insights;
  }

  private async updateEngagementScores(): Promise<void> {
    // Get all metrics that need updating
    const { data: metrics } = await supabase
      .from('blog_learning_metrics')
      .select('id, views_24h, likes_count, comments_count, shares_count');

    if (!metrics) return;

    for (const metric of metrics) {
      const engagementScore = this.calculateEngagementScore(
        metric.views_24h || 0,
        metric.likes_count || 0,
        metric.comments_count || 0,
        metric.shares_count || 0
      );

      await supabase
        .from('blog_learning_metrics')
        .update({ 
          engagement_score: engagementScore,
          updated_at: new Date().toISOString()
        })
        .eq('id', metric.id);
    }
  }

  private calculateEngagementScore(views: number, likes: number, comments: number, shares: number): number {
    if (views === 0) return 0;
    const score = ((comments * 5) + (shares * 3) + (likes * 2) + (views * 0.1)) / Math.max(views, 1) * 100;
    return Math.min(score, 100);
  }

  // ============================================================================
  // Helper Methods
  // ============================================================================

  private async getTopPerformingTopics(): Promise<BlogTopicPerformance[]> {
    const { data } = await supabase
      .from('blog_topic_performance')
      .select('*')
      .order('avg_engagement_score', { ascending: false })
      .limit(10);

    return (data as BlogTopicPerformance[]) || [];
  }

  private async getPendingIdeas(): Promise<BlogIdeaQueue[]> {
    const { data } = await supabase
      .from('blog_idea_queue')
      .select('*')
      .eq('status', 'pending')
      .order('priority_score', { ascending: false })
      .limit(20);

    return (data as BlogIdeaQueue[]) || [];
  }

  private frequencyToMs(frequency: string): number {
    switch (frequency) {
      case 'hourly': return 60 * 60 * 1000;
      case 'daily': return 24 * 60 * 60 * 1000;
      case 'weekly': return 7 * 24 * 60 * 60 * 1000;
      case 'biweekly': return 14 * 24 * 60 * 60 * 1000;
      case 'monthly': return 30 * 24 * 60 * 60 * 1000;
      default: return 24 * 60 * 60 * 1000; // Default to daily
    }
  }

  private async startAutomationRun(
    runType: BlogAutomationRun['run_type'],
    inputData: Record<string, unknown>
  ): Promise<string> {
    const { data, error } = await supabase
      .from('blog_automation_runs')
      .insert({
        run_type: runType,
        status: 'running',
        input_data: inputData
      })
      .select('id')
      .single();

    if (error) throw error;
    return data.id;
  }

  private async completeAutomationRun(
    runId: string,
    status: BlogAutomationRun['status'],
    data: Partial<BlogAutomationRun>
  ): Promise<void> {
    const startTime = await supabase
      .from('blog_automation_runs')
      .select('started_at')
      .eq('id', runId)
      .single();

    const duration = startTime.data
      ? Date.now() - new Date(startTime.data.started_at).getTime()
      : 0;

    await supabase
      .from('blog_automation_runs')
      .update({
        status,
        ...data,
        completed_at: new Date().toISOString(),
        duration_ms: duration
      })
      .eq('id', runId);
  }

  private async callBlogAI(prompt: string, context: string): Promise<string> {
    // Use Puter.js for AI calls
    if (typeof window === 'undefined') {
      throw new Error('Blog AI requires browser environment');
    }

    const puter = (window as unknown as { puter?: { ai?: { chat?: (prompt: string, options: { model: string }) => Promise<unknown> } } }).puter;
    if (!puter?.ai?.chat) {
      throw new Error('Puter.js not available');
    }

    const fullPrompt = `${context}\n\n---\n\n${prompt}`;
    const response = await puter.ai.chat(fullPrompt, { model: AI_MODELS.STANDARD });

    const resp = response as { message?: { content?: Array<{ text?: string }> }; text?: string; content?: string } | string;

    if (typeof resp === 'string') return resp;
    if (resp.message?.content?.[0]?.text) return resp.message.content[0].text;
    if (resp.text) return resp.text;
    if (resp.content) return resp.content;

    throw new Error('Empty response from AI');
  }

  // ============================================================================
  // Manual Triggers (for Admin UI)
  // ============================================================================

  /**
   * Manually trigger idea generation
   */
  async triggerIdeaGeneration(count: number = 5): Promise<ContentIdea[]> {
    return this.generateIdeas(count);
  }

  /**
   * Manually trigger learning update
   */
  async triggerLearningUpdate(): Promise<LearningInsight[]> {
    return this.updateLearning();
  }

  /**
   * Get automation status
   */
  getStatus(): { isRunning: boolean; activeIntervals: number } {
    return {
      isRunning: this.isRunning,
      activeIntervals: this.intervals.length
    };
  }

  /**
   * Get recent automation runs
   */
  async getRecentRuns(limit: number = 20): Promise<BlogAutomationRun[]> {
    const { data } = await supabase
      .from('blog_automation_runs')
      .select('*')
      .order('started_at', { ascending: false })
      .limit(limit);

    return (data as BlogAutomationRun[]) || [];
  }

  /**
   * Get learning insights
   */
  async getLearningInsights(): Promise<LearningInsight[]> {
    return this.extractSuccessPatterns();
  }
}

// Export singleton instance
export const blogAutomation = new BlogAutomationService();
