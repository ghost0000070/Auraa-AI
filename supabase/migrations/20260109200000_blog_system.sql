-- ============================================================================
-- Blog System for Auraa AI
-- Complete blog with AI agent integration for automated content management
-- ============================================================================

-- Blog posts table
CREATE TABLE IF NOT EXISTS blog_posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    excerpt TEXT,
    content TEXT NOT NULL,
    cover_image TEXT,
    author_name TEXT DEFAULT 'Auraa AI',
    author_avatar TEXT,
    category TEXT NOT NULL DEFAULT 'general',
    tags TEXT[] DEFAULT '{}',
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
    is_ai_generated BOOLEAN DEFAULT false,
    ai_agent_id TEXT, -- Which AI agent created/manages this post
    view_count INTEGER DEFAULT 0,
    like_count INTEGER DEFAULT 0,
    comment_count INTEGER DEFAULT 0,
    seo_title TEXT,
    seo_description TEXT,
    seo_keywords TEXT[],
    reading_time_minutes INTEGER DEFAULT 5,
    published_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Blog comments table
CREATE TABLE IF NOT EXISTS blog_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID NOT NULL REFERENCES blog_posts(id) ON DELETE CASCADE,
    parent_id UUID REFERENCES blog_comments(id) ON DELETE CASCADE, -- For nested replies
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    guest_name TEXT, -- For guest commenters
    guest_email TEXT, -- For guest commenters (not displayed)
    content TEXT NOT NULL,
    is_ai_reply BOOLEAN DEFAULT false,
    ai_agent_id TEXT, -- Which AI agent replied
    is_approved BOOLEAN DEFAULT true,
    is_flagged BOOLEAN DEFAULT false,
    like_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Blog post likes (to track unique likes)
CREATE TABLE IF NOT EXISTS blog_post_likes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID NOT NULL REFERENCES blog_posts(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    guest_fingerprint TEXT, -- For anonymous likes
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(post_id, user_id),
    UNIQUE(post_id, guest_fingerprint)
);

-- Blog comment likes
CREATE TABLE IF NOT EXISTS blog_comment_likes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    comment_id UUID NOT NULL REFERENCES blog_comments(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    guest_fingerprint TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(comment_id, user_id),
    UNIQUE(comment_id, guest_fingerprint)
);

-- Blog categories for organization
CREATE TABLE IF NOT EXISTS blog_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT UNIQUE NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT,
    icon TEXT,
    color TEXT DEFAULT '#8B5CF6',
    post_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- AI blog agent actions log
CREATE TABLE IF NOT EXISTS blog_agent_actions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    action_type TEXT NOT NULL CHECK (action_type IN (
        'create_post', 'update_post', 'publish_post', 'archive_post',
        'reply_comment', 'moderate_comment', 'generate_content',
        'seo_optimize', 'schedule_post', 'analyze_engagement'
    )),
    target_id UUID, -- post_id or comment_id
    target_type TEXT CHECK (target_type IN ('post', 'comment')),
    ai_agent_id TEXT,
    input_prompt TEXT,
    output_result TEXT,
    status TEXT DEFAULT 'completed' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Blog settings (singleton for admin config)
CREATE TABLE IF NOT EXISTS blog_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ai_auto_reply_enabled BOOLEAN DEFAULT true,
    ai_moderation_enabled BOOLEAN DEFAULT true,
    ai_content_generation_enabled BOOLEAN DEFAULT true,
    default_ai_agent_id TEXT DEFAULT 'blog-agent',
    require_comment_approval BOOLEAN DEFAULT false,
    allow_guest_comments BOOLEAN DEFAULT true,
    posts_per_page INTEGER DEFAULT 10,
    featured_post_ids UUID[] DEFAULT '{}',
    social_share_enabled BOOLEAN DEFAULT true,
    newsletter_cta_enabled BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Insert default blog settings
INSERT INTO blog_settings (id) VALUES (gen_random_uuid()) ON CONFLICT DO NOTHING;

-- Insert default categories
INSERT INTO blog_categories (name, slug, description, icon, color) VALUES
    ('AI Employees', 'ai-employees', 'Learn about deploying and managing AI employees', 'bot', '#8B5CF6'),
    ('Automation', 'automation', 'Workflow automation tips and strategies', 'zap', '#10B981'),
    ('Business Growth', 'business-growth', 'Scale your business with AI', 'trending-up', '#F59E0B'),
    ('Product Updates', 'product-updates', 'Latest features and improvements', 'sparkles', '#3B82F6'),
    ('Case Studies', 'case-studies', 'Success stories from our users', 'trophy', '#EC4899'),
    ('Tutorials', 'tutorials', 'Step-by-step guides', 'book-open', '#06B6D4'),
    ('Industry News', 'industry-news', 'AI and automation industry updates', 'newspaper', '#6366F1'),
    ('Company', 'company', 'News and updates from Auraa AI', 'building', '#84CC16')
ON CONFLICT (slug) DO NOTHING;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_blog_posts_slug ON blog_posts(slug);
CREATE INDEX IF NOT EXISTS idx_blog_posts_status ON blog_posts(status);
CREATE INDEX IF NOT EXISTS idx_blog_posts_category ON blog_posts(category);
CREATE INDEX IF NOT EXISTS idx_blog_posts_published_at ON blog_posts(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_blog_posts_created_at ON blog_posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_blog_comments_post_id ON blog_comments(post_id);
CREATE INDEX IF NOT EXISTS idx_blog_comments_parent_id ON blog_comments(parent_id);
CREATE INDEX IF NOT EXISTS idx_blog_comments_created_at ON blog_comments(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_blog_agent_actions_created_at ON blog_agent_actions(created_at DESC);

-- RLS Policies

-- Blog posts: Anyone can read published posts, only admins/AI can write
ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read published blog posts"
    ON blog_posts FOR SELECT
    USING (status = 'published');

CREATE POLICY "Service role can manage all blog posts"
    ON blog_posts FOR ALL
    USING (auth.jwt() ->> 'role' = 'service_role');

-- Blog comments: Anyone can read approved comments, authenticated users can create
ALTER TABLE blog_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read approved comments"
    ON blog_comments FOR SELECT
    USING (is_approved = true);

CREATE POLICY "Authenticated users can create comments"
    ON blog_comments FOR INSERT
    WITH CHECK (
        auth.uid() IS NOT NULL 
        OR (guest_name IS NOT NULL AND guest_email IS NOT NULL)
    );

CREATE POLICY "Users can update own comments"
    ON blog_comments FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage all comments"
    ON blog_comments FOR ALL
    USING (auth.jwt() ->> 'role' = 'service_role');

-- Blog post likes: Anyone can like
ALTER TABLE blog_post_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read likes"
    ON blog_post_likes FOR SELECT
    USING (true);

CREATE POLICY "Anyone can like posts"
    ON blog_post_likes FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Users can remove own likes"
    ON blog_post_likes FOR DELETE
    USING (auth.uid() = user_id);

-- Blog comment likes
ALTER TABLE blog_comment_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read comment likes"
    ON blog_comment_likes FOR SELECT
    USING (true);

CREATE POLICY "Anyone can like comments"
    ON blog_comment_likes FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Users can remove own comment likes"
    ON blog_comment_likes FOR DELETE
    USING (auth.uid() = user_id);

-- Blog categories: Public read
ALTER TABLE blog_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read categories"
    ON blog_categories FOR SELECT
    USING (true);

CREATE POLICY "Service role can manage categories"
    ON blog_categories FOR ALL
    USING (auth.jwt() ->> 'role' = 'service_role');

-- Blog agent actions: Service role only
ALTER TABLE blog_agent_actions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role can manage agent actions"
    ON blog_agent_actions FOR ALL
    USING (auth.jwt() ->> 'role' = 'service_role');

-- Blog settings: Service role only
ALTER TABLE blog_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role can manage settings"
    ON blog_settings FOR ALL
    USING (auth.jwt() ->> 'role' = 'service_role');

-- Functions for updating counts

-- Update post comment count
CREATE OR REPLACE FUNCTION update_post_comment_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE blog_posts SET comment_count = comment_count + 1, updated_at = now()
        WHERE id = NEW.post_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE blog_posts SET comment_count = GREATEST(0, comment_count - 1), updated_at = now()
        WHERE id = OLD.post_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_update_post_comment_count
AFTER INSERT OR DELETE ON blog_comments
FOR EACH ROW EXECUTE FUNCTION update_post_comment_count();

-- Update post like count
CREATE OR REPLACE FUNCTION update_post_like_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE blog_posts SET like_count = like_count + 1, updated_at = now()
        WHERE id = NEW.post_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE blog_posts SET like_count = GREATEST(0, like_count - 1), updated_at = now()
        WHERE id = OLD.post_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_update_post_like_count
AFTER INSERT OR DELETE ON blog_post_likes
FOR EACH ROW EXECUTE FUNCTION update_post_like_count();

-- Update comment like count
CREATE OR REPLACE FUNCTION update_comment_like_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE blog_comments SET like_count = like_count + 1, updated_at = now()
        WHERE id = NEW.comment_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE blog_comments SET like_count = GREATEST(0, like_count - 1), updated_at = now()
        WHERE id = OLD.comment_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_update_comment_like_count
AFTER INSERT OR DELETE ON blog_comment_likes
FOR EACH ROW EXECUTE FUNCTION update_comment_like_count();

-- Update category post count
CREATE OR REPLACE FUNCTION update_category_post_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' AND NEW.status = 'published' THEN
        UPDATE blog_categories SET post_count = post_count + 1
        WHERE slug = NEW.category;
    ELSIF TG_OP = 'DELETE' AND OLD.status = 'published' THEN
        UPDATE blog_categories SET post_count = GREATEST(0, post_count - 1)
        WHERE slug = OLD.category;
    ELSIF TG_OP = 'UPDATE' THEN
        -- Handle status changes
        IF OLD.status != 'published' AND NEW.status = 'published' THEN
            UPDATE blog_categories SET post_count = post_count + 1
            WHERE slug = NEW.category;
        ELSIF OLD.status = 'published' AND NEW.status != 'published' THEN
            UPDATE blog_categories SET post_count = GREATEST(0, post_count - 1)
            WHERE slug = OLD.category;
        END IF;
        -- Handle category changes
        IF OLD.category != NEW.category AND NEW.status = 'published' THEN
            UPDATE blog_categories SET post_count = GREATEST(0, post_count - 1)
            WHERE slug = OLD.category;
            UPDATE blog_categories SET post_count = post_count + 1
            WHERE slug = NEW.category;
        END IF;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_update_category_post_count
AFTER INSERT OR UPDATE OR DELETE ON blog_posts
FOR EACH ROW EXECUTE FUNCTION update_category_post_count();

-- Function to increment view count (called from frontend)
CREATE OR REPLACE FUNCTION increment_post_view(post_slug TEXT)
RETURNS void AS $$
BEGIN
    UPDATE blog_posts SET view_count = view_count + 1
    WHERE slug = post_slug AND status = 'published';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute to anon users
GRANT EXECUTE ON FUNCTION increment_post_view(TEXT) TO anon, authenticated;

-- Enable realtime for comments (for live updates)
ALTER PUBLICATION supabase_realtime ADD TABLE blog_comments;
