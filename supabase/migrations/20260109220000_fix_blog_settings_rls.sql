-- Fix RLS policy for blog_settings to allow initial insert
-- Run this migration to fix the settings table

-- Drop existing policy if it exists
DROP POLICY IF EXISTS "Allow authenticated users to manage settings" ON blog_settings;

-- Create a policy that allows insert when no settings exist
CREATE POLICY "Allow settings management" ON blog_settings
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Insert default settings if none exist
INSERT INTO blog_settings (
  ai_auto_reply_enabled,
  ai_moderation_enabled,
  ai_content_generation_enabled,
  default_ai_agent_id,
  require_comment_approval,
  allow_guest_comments,
  posts_per_page,
  featured_post_ids,
  social_share_enabled,
  newsletter_cta_enabled,
  auto_generate_ideas,
  idea_generation_frequency,
  auto_schedule_posts,
  posts_per_week,
  preferred_posting_days,
  preferred_posting_time,
  learning_enabled,
  learning_update_frequency,
  auto_seo_optimization,
  content_focus_areas
)
SELECT
  true,
  true,
  true,
  'blog-agent',
  false,
  true,
  10,
  '{}',
  true,
  true,
  true,
  'weekly',
  true,
  2,
  ARRAY['tuesday', 'thursday'],
  '09:00:00',
  true,
  'daily',
  true,
  ARRAY['ai-employees', 'automation', 'productivity']
WHERE NOT EXISTS (SELECT 1 FROM blog_settings LIMIT 1);
