-- Seed data for testing AI employee deployment system

-- First, let's insert a test template
INSERT INTO public.ai_helper_templates (
  id,
  name,
  description,
  category,
  color_scheme,
  icon_name,
  prompt_template,
  capabilities,
  tier_requirement,
  deployment_eligibility,
  is_active,
  is_public
) VALUES (
  'ff909ea8-3721-4a3a-9dbb-313fd2b920f3',
  'Test AI Assistant',
  'A test AI assistant for development',
  'general',
  'blue',
  'zap',
  'You are a helpful AI assistant.',
  '["chat", "analysis"]'::jsonb,
  'basic',
  '{"min_tier": "Premium", "max_employees_per_tier": {"Basic": 1, "Premium": 3, "Enterprise": 10}, "requires_business_profile": true}'::jsonb,
  true,
  true
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  updated_at = now();

-- Insert more test data if needed
SELECT 'Seed data applied successfully' as result;