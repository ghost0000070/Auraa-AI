-- Auraa AI Blog System Seed Data
-- Run after migrations to set up initial data

-- Insert default blog settings
INSERT INTO blog_settings (
  id,
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
) VALUES (
  gen_random_uuid(),
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
)
ON CONFLICT DO NOTHING;

-- Insert a sample blog post for testing
INSERT INTO blog_posts (
  slug,
  title,
  excerpt,
  content,
  category,
  tags,
  status,
  is_ai_generated,
  ai_agent_id,
  author_name,
  view_count,
  like_count,
  comment_count,
  seo_title,
  seo_description,
  reading_time_minutes,
  published_at
) VALUES (
  'welcome-to-auraa-ai-blog',
  'Welcome to the Auraa AI Blog: Your Guide to AI-Powered Automation',
  'Discover how Auraa AI is revolutionizing business automation with autonomous AI employees. Learn about our mission, our technology, and how we can help you work smarter.',
  E'# Welcome to the Auraa AI Blog\n\nWe''re thrilled to launch the official Auraa AI blog – your go-to resource for everything related to AI automation, productivity, and the future of work.\n\n## What is Auraa AI?\n\nAuraa AI is a cutting-edge platform that lets you deploy **autonomous AI employees** to handle your business tasks 24/7. Unlike traditional automation tools that require complex setup and coding, Auraa AI provides pre-trained AI agents that understand your needs and execute tasks intelligently.\n\n## What You''ll Find Here\n\nOn this blog, we''ll share:\n\n- **Tutorials & How-Tos**: Step-by-step guides to get the most out of your AI employees\n- **Productivity Tips**: Strategies to optimize your workflows with AI assistance\n- **Case Studies**: Real stories from businesses transforming with Auraa AI\n- **Product Updates**: The latest features and improvements\n- **Industry Insights**: Trends in AI, automation, and the future of work\n\n## Why AI Employees?\n\nThe future of work isn''t about replacing humans – it''s about augmenting human capabilities. AI employees handle the repetitive, time-consuming tasks so you can focus on what matters most: strategy, creativity, and growth.\n\nImagine having a team that:\n- Never sleeps\n- Never makes typos\n- Learns and improves over time\n- Scales instantly with your needs\n\nThat''s what Auraa AI delivers.\n\n## Get Started\n\nReady to deploy your first AI employee? [Visit our dashboard](/dashboard) to get started, or explore our [AI Employee templates](/marketplace) to see what''s possible.\n\nStay tuned for more content, and don''t forget to subscribe to our newsletter for the latest updates!\n\n---\n\n*The Auraa AI Team*',
  'product-updates',
  ARRAY['welcome', 'introduction', 'ai-employees', 'automation'],
  'published',
  true,
  'blog-agent',
  'Auraa AI',
  0,
  0,
  0,
  'Welcome to Auraa AI Blog - AI Automation & Productivity',
  'Discover the Auraa AI blog - your resource for AI automation, productivity tips, tutorials, and the future of work with autonomous AI employees.',
  5,
  NOW()
)
ON CONFLICT (slug) DO NOTHING;
