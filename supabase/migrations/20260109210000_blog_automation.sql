-- Blog Automation & Learning System
-- Adds tables for automated blog operations, content calendar, and learning metrics

-- Content Calendar for scheduled posts
CREATE TABLE IF NOT EXISTS blog_content_calendar (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  topic TEXT NOT NULL,
  category_id UUID REFERENCES blog_categories(id),
  keywords TEXT[] DEFAULT '{}',
  scheduled_date DATE NOT NULL,
  scheduled_time TIME DEFAULT '09:00:00',
  status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'generating', 'generated', 'published', 'failed', 'cancelled')),
  post_id UUID REFERENCES blog_posts(id),
  generation_prompt TEXT,
  notes TEXT,
  priority INTEGER DEFAULT 5 CHECK (priority >= 1 AND priority <= 10),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Blog Learning Metrics - tracks what content performs well
CREATE TABLE IF NOT EXISTS blog_learning_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES blog_posts(id) ON DELETE CASCADE,
  
  -- Engagement metrics
  views_24h INTEGER DEFAULT 0,
  views_7d INTEGER DEFAULT 0,
  views_30d INTEGER DEFAULT 0,
  likes_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  shares_count INTEGER DEFAULT 0,
  avg_read_time_seconds INTEGER DEFAULT 0,
  bounce_rate DECIMAL(5,2) DEFAULT 0,
  
  -- Content analysis
  word_count INTEGER DEFAULT 0,
  reading_level TEXT,
  sentiment_score DECIMAL(3,2) DEFAULT 0, -- -1 to 1
  
  -- Performance scores (calculated)
  engagement_score DECIMAL(5,2) DEFAULT 0,
  virality_score DECIMAL(5,2) DEFAULT 0,
  quality_score DECIMAL(5,2) DEFAULT 0,
  
  -- Learning flags
  is_top_performer BOOLEAN DEFAULT FALSE,
  learned_patterns JSONB DEFAULT '{}',
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Topic Performance - tracks which topics perform best
CREATE TABLE IF NOT EXISTS blog_topic_performance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  topic TEXT NOT NULL UNIQUE,
  category_id UUID REFERENCES blog_categories(id),
  
  -- Aggregate metrics
  total_posts INTEGER DEFAULT 0,
  total_views INTEGER DEFAULT 0,
  total_likes INTEGER DEFAULT 0,
  total_comments INTEGER DEFAULT 0,
  avg_engagement_score DECIMAL(5,2) DEFAULT 0,
  
  -- Trend data
  trending_score DECIMAL(5,2) DEFAULT 0,
  last_posted_at TIMESTAMPTZ,
  recommended_frequency_days INTEGER DEFAULT 30,
  
  -- Learning
  successful_keywords TEXT[] DEFAULT '{}',
  successful_titles TEXT[] DEFAULT '{}',
  optimal_length INTEGER,
  best_posting_time TIME,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Automation Runs - logs all automated actions
CREATE TABLE IF NOT EXISTS blog_automation_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_type TEXT NOT NULL CHECK (run_type IN ('idea_generation', 'post_generation', 'auto_reply', 'auto_moderation', 'seo_optimization', 'learning_update', 'scheduled_publish')),
  status TEXT DEFAULT 'running' CHECK (status IN ('running', 'completed', 'failed', 'partial')),
  
  -- What was processed
  items_processed INTEGER DEFAULT 0,
  items_succeeded INTEGER DEFAULT 0,
  items_failed INTEGER DEFAULT 0,
  
  -- Details
  input_data JSONB DEFAULT '{}',
  output_data JSONB DEFAULT '{}',
  error_message TEXT,
  
  -- Timing
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  duration_ms INTEGER
);

-- Generated Ideas Queue - AI-generated ideas waiting for review/use
CREATE TABLE IF NOT EXISTS blog_idea_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  topic TEXT NOT NULL,
  category_id UUID REFERENCES blog_categories(id),
  
  -- Idea details
  brief_description TEXT,
  outline TEXT[] DEFAULT '{}',
  target_keywords TEXT[] DEFAULT '{}',
  estimated_engagement TEXT,
  
  -- Scoring
  relevance_score DECIMAL(5,2) DEFAULT 0,
  trend_score DECIMAL(5,2) DEFAULT 0,
  priority_score DECIMAL(5,2) DEFAULT 0,
  
  -- Status
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'scheduled', 'rejected', 'used')),
  used_in_post_id UUID REFERENCES blog_posts(id),
  
  -- Source
  inspiration_source TEXT, -- 'trend', 'learning', 'product_update', 'user_request', 'competitor', 'ai_creative'
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ
);

-- Auto-reply Templates - learned successful reply patterns
CREATE TABLE IF NOT EXISTS blog_reply_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  comment_type TEXT NOT NULL CHECK (comment_type IN ('question', 'praise', 'criticism', 'suggestion', 'spam', 'general')),
  
  -- Template
  template_pattern TEXT NOT NULL,
  example_replies TEXT[] DEFAULT '{}',
  
  -- Performance
  times_used INTEGER DEFAULT 0,
  avg_satisfaction_score DECIMAL(3,2) DEFAULT 0,
  
  -- Learning
  is_active BOOLEAN DEFAULT TRUE,
  learned_from_post_ids UUID[] DEFAULT '{}',
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Automation Settings (extends existing blog_settings)
ALTER TABLE blog_settings 
  ADD COLUMN IF NOT EXISTS auto_generate_ideas BOOLEAN DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS idea_generation_frequency TEXT DEFAULT 'weekly',
  ADD COLUMN IF NOT EXISTS auto_schedule_posts BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS posts_per_week INTEGER DEFAULT 2,
  ADD COLUMN IF NOT EXISTS preferred_posting_days TEXT[] DEFAULT ARRAY['tuesday', 'thursday'],
  ADD COLUMN IF NOT EXISTS preferred_posting_time TIME DEFAULT '09:00:00',
  ADD COLUMN IF NOT EXISTS learning_enabled BOOLEAN DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS learning_update_frequency TEXT DEFAULT 'daily',
  ADD COLUMN IF NOT EXISTS auto_seo_optimization BOOLEAN DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS content_focus_areas TEXT[] DEFAULT ARRAY['ai-employees', 'automation', 'productivity'];

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_content_calendar_scheduled ON blog_content_calendar(scheduled_date, status);
CREATE INDEX IF NOT EXISTS idx_learning_metrics_post ON blog_learning_metrics(post_id);
CREATE INDEX IF NOT EXISTS idx_learning_metrics_scores ON blog_learning_metrics(engagement_score DESC);
CREATE INDEX IF NOT EXISTS idx_topic_performance_trending ON blog_topic_performance(trending_score DESC);
CREATE INDEX IF NOT EXISTS idx_automation_runs_type ON blog_automation_runs(run_type, started_at DESC);
CREATE INDEX IF NOT EXISTS idx_idea_queue_status ON blog_idea_queue(status, priority_score DESC);

-- RLS Policies
ALTER TABLE blog_content_calendar ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_learning_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_topic_performance ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_automation_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_idea_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_reply_templates ENABLE ROW LEVEL SECURITY;

-- Public read for some tables
CREATE POLICY "Public read topic performance" ON blog_topic_performance FOR SELECT USING (true);

-- Authenticated access for management
CREATE POLICY "Authenticated manage content calendar" ON blog_content_calendar FOR ALL USING (true);
CREATE POLICY "Authenticated manage learning metrics" ON blog_learning_metrics FOR ALL USING (true);
CREATE POLICY "Authenticated manage automation runs" ON blog_automation_runs FOR ALL USING (true);
CREATE POLICY "Authenticated manage idea queue" ON blog_idea_queue FOR ALL USING (true);
CREATE POLICY "Authenticated manage reply templates" ON blog_reply_templates FOR ALL USING (true);

-- Function to update learning metrics from post performance
CREATE OR REPLACE FUNCTION update_learning_metrics()
RETURNS TRIGGER AS $$
BEGIN
  -- Update or insert learning metrics when post stats change
  INSERT INTO blog_learning_metrics (post_id, views_24h, likes_count, comments_count)
  VALUES (NEW.id, NEW.view_count, NEW.like_count, NEW.comment_count)
  ON CONFLICT (post_id) DO UPDATE SET
    views_24h = EXCLUDED.views_24h,
    likes_count = EXCLUDED.likes_count,
    comments_count = EXCLUDED.comments_count,
    updated_at = NOW();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update learning metrics
DROP TRIGGER IF EXISTS trigger_update_learning_metrics ON blog_posts;
CREATE TRIGGER trigger_update_learning_metrics
  AFTER UPDATE OF view_count, like_count, comment_count ON blog_posts
  FOR EACH ROW
  EXECUTE FUNCTION update_learning_metrics();

-- Function to calculate engagement score
CREATE OR REPLACE FUNCTION calculate_engagement_score(
  p_views INTEGER,
  p_likes INTEGER,
  p_comments INTEGER,
  p_shares INTEGER DEFAULT 0
)
RETURNS DECIMAL AS $$
DECLARE
  score DECIMAL;
BEGIN
  -- Weighted engagement formula
  -- Comments worth most (5x), then shares (3x), then likes (2x), views (1x)
  IF p_views = 0 THEN
    RETURN 0;
  END IF;
  
  score := (
    (p_comments * 5.0) +
    (p_shares * 3.0) +
    (p_likes * 2.0) +
    (p_views * 0.1)
  ) / GREATEST(p_views, 1) * 100;
  
  RETURN LEAST(score, 100.0); -- Cap at 100
END;
$$ LANGUAGE plpgsql;
