/**
 * Blog Automation Worker
 * Runs as a background process to handle scheduled blog tasks
 * 
 * Run with: npx tsx scripts/blogWorker.ts
 */

import { createClient } from '@supabase/supabase-js';

// Configuration
const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const PUTER_API_URL = 'https://api.puter.com/ai/chat';

// AI Model
const AI_MODEL = 'claude-sonnet-4-5';

// Initialize Supabase client with service role
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Validate environment
if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('Missing required environment variables:');
  console.error('  SUPABASE_URL');
  console.error('  SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

interface BlogSettings {
  id: string;
  ai_auto_reply_enabled: boolean;
  ai_moderation_enabled: boolean;
  ai_content_generation_enabled: boolean;
  auto_generate_ideas: boolean;
  idea_generation_frequency: string;
  auto_schedule_posts: boolean;
  posts_per_week: number;
  preferred_posting_days: string[];
  preferred_posting_time: string;
  learning_enabled: boolean;
  learning_update_frequency: string;
  auto_seo_optimization: boolean;
  content_focus_areas: string[];
}

interface ContentCalendarItem {
  id: string;
  title: string;
  topic: string;
  category_id: string | null;
  keywords: string[];
  scheduled_date: string;
  scheduled_time: string;
  status: string;
  generation_prompt: string | null;
  priority: number;
}

interface BlogPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  content: string;
  category: string;
  tags: string[];
  status: string;
  view_count: number;
  like_count: number;
  comment_count: number;
}

interface BlogComment {
  id: string;
  post_id: string;
  parent_id: string | null;
  content: string;
  is_ai_reply: boolean;
  is_approved: boolean;
  is_flagged: boolean;
  guest_name: string | null;
  created_at: string;
}

interface BlogIdea {
  id: string;
  title: string;
  topic: string;
  category_id: string | null;
  target_keywords: string[];
  outline: string[];
  priority_score: number;
  status: string;
}

// ============================================================================
// AI Calling (Server-side via fetch)
// ============================================================================

async function callAI(prompt: string, systemPrompt: string): Promise<string> {
  // Use Puter's API or fallback to edge function
  try {
    // Try calling our edge function which has Puter access
    const response = await fetch(`${SUPABASE_URL}/functions/v1/blog-agent`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        action: 'custom',
        prompt: `${systemPrompt}\n\n---\n\n${prompt}`,
        model: AI_MODEL
      })
    });

    if (!response.ok) {
      throw new Error(`Edge function error: ${response.status}`);
    }

    const data = await response.json();
    return data.content || data.result || '';
  } catch (error) {
    console.error('AI call failed:', error);
    throw error;
  }
}

// ============================================================================
// Automation Tasks
// ============================================================================

async function generateIdeas(count: number = 5): Promise<void> {
  console.log(`[BlogWorker] Generating ${count} content ideas...`);

  const runId = await startRun('idea_generation', { count });

  try {
    // Get context
    const { data: recentPosts } = await supabase
      .from('blog_posts')
      .select('title, category')
      .eq('status', 'published')
      .order('created_at', { ascending: false })
      .limit(10);

    const { data: existingIdeas } = await supabase
      .from('blog_idea_queue')
      .select('title')
      .eq('status', 'pending')
      .limit(10);

    const { data: topicPerf } = await supabase
      .from('blog_topic_performance')
      .select('topic, avg_engagement_score')
      .order('avg_engagement_score', { ascending: false })
      .limit(5);

    const context = `
# Auraa AI - Blog Content Ideation

Auraa AI is a SaaS platform for deploying autonomous AI "employees" that can perform tasks, automations, and workflows for users.

## Target Audience
- Small business owners
- Entrepreneurs
- Productivity enthusiasts
- Tech-savvy professionals

## Categories
- AI Employees, Productivity, Business Automation, Case Studies, Tech Insights, Future of Work, Tips & Tutorials, Product Updates

## Recent Posts (avoid duplicates)
${recentPosts?.map(p => `- ${p.title}`).join('\n') || 'None'}

## Existing Ideas (avoid duplicates)
${existingIdeas?.map(i => `- ${i.title}`).join('\n') || 'None'}

## Top Performing Topics
${topicPerf?.map(t => `- ${t.topic}: ${t.avg_engagement_score} engagement`).join('\n') || 'No data yet'}
`;

    const prompt = `Generate ${count} unique blog post ideas for Auraa AI.

For each idea, respond with valid JSON:
[
  {
    "title": "Compelling SEO title",
    "topic": "Main topic",
    "category": "ai-employees|productivity|automation|case-studies|tech-insights|future-of-work|tutorials|product-updates",
    "keywords": ["keyword1", "keyword2"],
    "outline": ["Section 1", "Section 2", "Section 3"],
    "engagement": "high|medium|low"
  }
]`;

    const response = await callAI(prompt, context);
    const jsonMatch = response.match(/\[[\s\S]*\]/);

    if (!jsonMatch) {
      throw new Error('Failed to parse ideas from AI');
    }

    const ideas = JSON.parse(jsonMatch[0]);
    let succeeded = 0;

    for (const idea of ideas) {
      const { data: category } = await supabase
        .from('blog_categories')
        .select('id')
        .eq('slug', idea.category)
        .single();

      const { error } = await supabase.from('blog_idea_queue').insert({
        title: idea.title,
        topic: idea.topic,
        category_id: category?.id || null,
        target_keywords: idea.keywords,
        outline: idea.outline,
        priority_score: idea.engagement === 'high' ? 8 : idea.engagement === 'medium' ? 5 : 3,
        status: 'pending',
        inspiration_source: 'ai_creative'
      });

      if (!error) succeeded++;
    }

    await completeRun(runId, 'completed', {
      items_processed: ideas.length,
      items_succeeded: succeeded
    });

    console.log(`[BlogWorker] Generated ${succeeded}/${ideas.length} ideas`);
  } catch (error) {
    console.error('[BlogWorker] Idea generation failed:', error);
    await completeRun(runId, 'failed', {
      error_message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

async function processScheduledPosts(settings: BlogSettings): Promise<void> {
  console.log('[BlogWorker] Checking scheduled posts...');

  const now = new Date();
  const today = now.toISOString().split('T')[0];
  const currentTime = now.toTimeString().split(' ')[0];

  // Get posts scheduled for today that are ready
  const { data: scheduled } = await supabase
    .from('blog_content_calendar')
    .select('*')
    .eq('scheduled_date', today)
    .eq('status', 'scheduled')
    .lte('scheduled_time', currentTime)
    .order('priority', { ascending: false });

  if (!scheduled || scheduled.length === 0) {
    console.log('[BlogWorker] No posts to process');
    
    // Check if we need to auto-schedule from idea queue
    if (settings.auto_schedule_posts) {
      await autoScheduleFromIdeas(settings);
    }
    return;
  }

  console.log(`[BlogWorker] Processing ${scheduled.length} scheduled posts`);

  for (const item of scheduled) {
    await generateAndPublishPost(item as ContentCalendarItem);
  }
}

async function autoScheduleFromIdeas(settings: BlogSettings): Promise<void> {
  // Calculate posts needed this week
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

  const neededPosts = settings.posts_per_week - (count || 0);
  if (neededPosts <= 0) return;

  console.log(`[BlogWorker] Auto-scheduling ${neededPosts} posts from idea queue`);

  const { data: ideas } = await supabase
    .from('blog_idea_queue')
    .select('*')
    .eq('status', 'pending')
    .order('priority_score', { ascending: false })
    .limit(neededPosts);

  if (!ideas || ideas.length === 0) {
    console.log('[BlogWorker] No pending ideas to schedule');
    return;
  }

  const dayMap: Record<string, number> = {
    'sunday': 0, 'monday': 1, 'tuesday': 2, 'wednesday': 3,
    'thursday': 4, 'friday': 5, 'saturday': 6
  };

  for (let i = 0; i < ideas.length; i++) {
    const idea = ideas[i] as BlogIdea;
    
    // Calculate next schedule date
    const targetDayIndex = i % settings.preferred_posting_days.length;
    const targetDayName = settings.preferred_posting_days[targetDayIndex]?.toLowerCase() || 'tuesday';
    const targetDay = dayMap[targetDayName] ?? 2;

    const today = new Date();
    let daysUntilTarget = targetDay - today.getDay();
    if (daysUntilTarget <= 0) daysUntilTarget += 7;
    daysUntilTarget += Math.floor(i / settings.preferred_posting_days.length) * 7;

    const scheduledDate = new Date(today);
    scheduledDate.setDate(today.getDate() + daysUntilTarget);

    await supabase.from('blog_content_calendar').insert({
      title: idea.title,
      topic: idea.topic,
      category_id: idea.category_id,
      keywords: idea.target_keywords,
      scheduled_date: scheduledDate.toISOString().split('T')[0],
      scheduled_time: settings.preferred_posting_time,
      priority: Math.round(idea.priority_score)
    });

    await supabase
      .from('blog_idea_queue')
      .update({ status: 'scheduled' })
      .eq('id', idea.id);
  }

  console.log(`[BlogWorker] Scheduled ${ideas.length} posts`);
}

async function generateAndPublishPost(calendar: ContentCalendarItem): Promise<void> {
  console.log(`[BlogWorker] Generating post: ${calendar.title}`);

  const runId = await startRun('post_generation', { 
    calendar_id: calendar.id,
    title: calendar.title 
  });

  try {
    // Update status
    await supabase
      .from('blog_content_calendar')
      .update({ status: 'generating' })
      .eq('id', calendar.id);

    // Get category
    let categorySlug = 'ai-employees';
    if (calendar.category_id) {
      const { data: category } = await supabase
        .from('blog_categories')
        .select('slug')
        .eq('id', calendar.category_id)
        .single();
      if (category) categorySlug = category.slug;
    }

    // Generate content via edge function
    const response = await fetch(`${SUPABASE_URL}/functions/v1/blog-agent`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        action: 'generate_post',
        topic: calendar.topic,
        category: categorySlug,
        keywords: calendar.keywords
      })
    });

    if (!response.ok) {
      throw new Error(`Failed to generate post: ${response.status}`);
    }

    const result = await response.json();

    if (!result.success || !result.post) {
      throw new Error(result.error || 'Failed to generate post');
    }

    // Create slug
    const slug = calendar.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      + '-' + Date.now().toString(36);

    // Insert post
    const { data: post, error } = await supabase
      .from('blog_posts')
      .insert({
        slug,
        title: calendar.title || result.post.title,
        excerpt: result.post.excerpt,
        content: result.post.content,
        category: categorySlug,
        tags: result.post.tags || [],
        status: 'published',
        is_ai_generated: true,
        ai_agent_id: 'blog-agent',
        author_name: 'Auraa AI',
        seo_title: result.post.seo_title,
        seo_description: result.post.seo_description,
        seo_keywords: calendar.keywords,
        reading_time_minutes: Math.ceil((result.post.content?.length || 0) / 1000),
        published_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;

    // Update calendar
    await supabase
      .from('blog_content_calendar')
      .update({ 
        status: 'published',
        post_id: post.id 
      })
      .eq('id', calendar.id);

    await completeRun(runId, 'completed', {
      items_processed: 1,
      items_succeeded: 1,
      output_data: { post_id: post.id }
    });

    console.log(`[BlogWorker] Published post: ${post.slug}`);
  } catch (error) {
    console.error(`[BlogWorker] Failed to generate post: ${calendar.title}`, error);

    await supabase
      .from('blog_content_calendar')
      .update({ status: 'failed' })
      .eq('id', calendar.id);

    await completeRun(runId, 'failed', {
      error_message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

async function processNewComments(settings: BlogSettings): Promise<void> {
  if (!settings.ai_auto_reply_enabled && !settings.ai_moderation_enabled) {
    return;
  }

  console.log('[BlogWorker] Processing new comments...');

  // Get recent comments that need processing
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
  
  const { data: comments } = await supabase
    .from('blog_comments')
    .select('*')
    .eq('is_ai_reply', false)
    .gte('created_at', fiveMinutesAgo)
    .order('created_at', { ascending: true });

  if (!comments || comments.length === 0) return;

  for (const comment of comments as BlogComment[]) {
    // Auto-moderate if enabled
    if (settings.ai_moderation_enabled && !comment.is_approved) {
      await autoModerateComment(comment);
    }

    // Auto-reply if enabled (only to top-level comments)
    if (settings.ai_auto_reply_enabled && !comment.parent_id) {
      await autoReplyToComment(comment);
    }
  }
}

async function autoModerateComment(comment: BlogComment): Promise<void> {
  console.log(`[BlogWorker] Moderating comment: ${comment.id}`);

  const runId = await startRun('auto_moderation', { comment_id: comment.id });

  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/blog-agent`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        action: 'moderate_comment',
        commentId: comment.id
      })
    });

    const result = await response.json();

    await completeRun(runId, result.success ? 'completed' : 'failed', {
      items_processed: 1,
      items_succeeded: result.success ? 1 : 0,
      output_data: { action: result.action }
    });
  } catch (error) {
    await completeRun(runId, 'failed', {
      error_message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

async function autoReplyToComment(comment: BlogComment): Promise<void> {
  // Check if already replied
  const { data: existingReply } = await supabase
    .from('blog_comments')
    .select('id')
    .eq('parent_id', comment.id)
    .eq('is_ai_reply', true)
    .single();

  if (existingReply) return;

  console.log(`[BlogWorker] Auto-replying to comment: ${comment.id}`);

  const runId = await startRun('auto_reply', { 
    comment_id: comment.id,
    post_id: comment.post_id 
  });

  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/blog-agent`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        action: 'reply_to_comment',
        commentId: comment.id,
        postId: comment.post_id
      })
    });

    const result = await response.json();

    await completeRun(runId, result.success ? 'completed' : 'failed', {
      items_processed: 1,
      items_succeeded: result.success ? 1 : 0
    });
  } catch (error) {
    await completeRun(runId, 'failed', {
      error_message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

async function updateLearningMetrics(): Promise<void> {
  console.log('[BlogWorker] Updating learning metrics...');

  const runId = await startRun('learning_update', {});

  try {
    // Update topic performance
    const { data: posts } = await supabase
      .from('blog_posts')
      .select('category, view_count, like_count, comment_count')
      .eq('status', 'published');

    if (posts) {
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

      for (const [topic, stats] of Object.entries(topicStats)) {
        const avgEngagement = stats.total_posts > 0
          ? ((stats.total_likes * 2 + stats.total_comments * 5) / Math.max(stats.total_views, 1)) * 100
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

    // Update learning metrics for posts
    const { data: allPosts } = await supabase
      .from('blog_posts')
      .select('id, view_count, like_count, comment_count, content')
      .eq('status', 'published');

    if (allPosts) {
      for (const post of allPosts) {
        const engagementScore = calculateEngagementScore(
          post.view_count || 0,
          post.like_count || 0,
          post.comment_count || 0
        );

        await supabase
          .from('blog_learning_metrics')
          .upsert({
            post_id: post.id,
            views_24h: post.view_count || 0,
            likes_count: post.like_count || 0,
            comments_count: post.comment_count || 0,
            word_count: Math.round((post.content?.length || 0) / 5),
            engagement_score: engagementScore,
            updated_at: new Date().toISOString()
          }, {
            onConflict: 'post_id'
          });
      }
    }

    await completeRun(runId, 'completed', {
      items_processed: posts?.length || 0,
      items_succeeded: posts?.length || 0
    });

    console.log('[BlogWorker] Learning metrics updated');
  } catch (error) {
    console.error('[BlogWorker] Learning update failed:', error);
    await completeRun(runId, 'failed', {
      error_message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

function calculateEngagementScore(views: number, likes: number, comments: number): number {
  if (views === 0) return 0;
  const score = ((comments * 5) + (likes * 2) + (views * 0.1)) / Math.max(views, 1) * 100;
  return Math.min(score, 100);
}

// ============================================================================
// Run Tracking
// ============================================================================

async function startRun(runType: string, inputData: Record<string, unknown>): Promise<string> {
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

async function completeRun(
  runId: string,
  status: string,
  data: Record<string, unknown>
): Promise<void> {
  const { data: startData } = await supabase
    .from('blog_automation_runs')
    .select('started_at')
    .eq('id', runId)
    .single();

  const duration = startData
    ? Date.now() - new Date(startData.started_at).getTime()
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

// ============================================================================
// Main Loop
// ============================================================================

async function getSettings(): Promise<BlogSettings | null> {
  const { data, error } = await supabase
    .from('blog_settings')
    .select('*')
    .single();

  if (error) {
    console.error('[BlogWorker] Failed to load settings:', error);
    return null;
  }

  return data as BlogSettings;
}

async function runCycle(): Promise<void> {
  console.log('\n[BlogWorker] Starting cycle at', new Date().toISOString());

  const settings = await getSettings();
  if (!settings) {
    console.error('[BlogWorker] No settings found, skipping cycle');
    return;
  }

  try {
    // Process scheduled posts
    if (settings.ai_content_generation_enabled) {
      await processScheduledPosts(settings);
    }

    // Process comments
    await processNewComments(settings);

    // Update learning (less frequently)
    if (settings.learning_enabled) {
      const now = new Date();
      if (now.getMinutes() === 0) { // Only on the hour
        await updateLearningMetrics();
      }
    }

    // Generate ideas (even less frequently)
    if (settings.auto_generate_ideas) {
      const now = new Date();
      // Run at midnight based on frequency
      if (now.getHours() === 0 && now.getMinutes() < 5) {
        const lastIdeaRun = await supabase
          .from('blog_automation_runs')
          .select('started_at')
          .eq('run_type', 'idea_generation')
          .order('started_at', { ascending: false })
          .limit(1)
          .single();

        const shouldGenerate = !lastIdeaRun.data || 
          shouldRunBasedOnFrequency(lastIdeaRun.data.started_at, settings.idea_generation_frequency);

        if (shouldGenerate) {
          await generateIdeas(5);
        }
      }
    }
  } catch (error) {
    console.error('[BlogWorker] Cycle error:', error);
  }

  console.log('[BlogWorker] Cycle complete');
}

function shouldRunBasedOnFrequency(lastRun: string, frequency: string): boolean {
  const lastRunDate = new Date(lastRun);
  const now = new Date();
  const diffHours = (now.getTime() - lastRunDate.getTime()) / (1000 * 60 * 60);

  switch (frequency) {
    case 'hourly': return diffHours >= 1;
    case 'daily': return diffHours >= 24;
    case 'weekly': return diffHours >= 168;
    case 'biweekly': return diffHours >= 336;
    case 'monthly': return diffHours >= 720;
    default: return diffHours >= 24;
  }
}

async function main(): Promise<void> {
  console.log('========================================');
  console.log('  Auraa AI Blog Automation Worker');
  console.log('========================================');
  console.log('Started at:', new Date().toISOString());
  console.log('Supabase URL:', SUPABASE_URL);
  console.log('');

  // Initial run
  await runCycle();

  // Run every 5 minutes
  const INTERVAL_MS = 5 * 60 * 1000;
  console.log(`[BlogWorker] Polling every ${INTERVAL_MS / 1000} seconds`);

  setInterval(runCycle, INTERVAL_MS);
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n[BlogWorker] Shutting down...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n[BlogWorker] Shutting down...');
  process.exit(0);
});

// Start
main().catch(console.error);
