-- Run this SQL in your Supabase SQL Editor: https://app.supabase.com/project/iupgzyloawweklvbyjlx/sql

-- =====================================================
-- AI Employee Templates Table
-- =====================================================
CREATE TABLE IF NOT EXISTS public.ai_employee_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  role VARCHAR(255),
  skills JSONB DEFAULT '[]'::jsonb,
  avatar_url TEXT,
  category VARCHAR(100),
  is_featured BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.ai_employee_templates ENABLE ROW LEVEL SECURITY;

-- Allow read access to everyone
CREATE POLICY "Allow public read access" ON public.ai_employee_templates
  FOR SELECT USING (true);

-- =====================================================
-- Website Integrations Table  
-- =====================================================
CREATE TABLE IF NOT EXISTS public.website_integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  url TEXT NOT NULL,
  status VARCHAR(50) DEFAULT 'pending',
  scrape_data JSONB,
  ai_employee_id UUID REFERENCES public.ai_employees(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.website_integrations ENABLE ROW LEVEL SECURITY;

-- Users can only see their own integrations
CREATE POLICY "Users can view own integrations" ON public.website_integrations
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own integrations" ON public.website_integrations
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own integrations" ON public.website_integrations
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own integrations" ON public.website_integrations
  FOR DELETE USING (auth.uid() = user_id);

-- =====================================================
-- Agent Tasks Table
-- =====================================================
CREATE TABLE IF NOT EXISTS public.agent_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  ai_employee_id UUID REFERENCES public.ai_employees(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  status VARCHAR(50) DEFAULT 'pending',
  priority VARCHAR(20) DEFAULT 'medium',
  result JSONB,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.agent_tasks ENABLE ROW LEVEL SECURITY;

-- Users can only see their own tasks
CREATE POLICY "Users can view own tasks" ON public.agent_tasks
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own tasks" ON public.agent_tasks
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own tasks" ON public.agent_tasks
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own tasks" ON public.agent_tasks
  FOR DELETE USING (auth.uid() = user_id);

-- =====================================================
-- Add sample AI Employee Templates
-- =====================================================
INSERT INTO public.ai_employee_templates (name, description, role, skills, category, is_featured) VALUES
('Milli', 'Expert sales manager for lead generation and deal closing', 'Sales Manager', '["Cold Calls", "Email Campaigns", "Deal Closing", "Client Pitches"]', 'sales', true),
('Cassie', 'Customer support specialist for ticket resolution and live chat', 'Customer Support Specialist', '["Ticket Resolution", "Live Chat", "Brand Voice", "Customer Retention"]', 'support', true),
('Dexter', 'Data analyst for insights and forecasting', 'Data Analyst', '["Data Analysis", "Forecasting", "Business Insights", "Performance Tracking"]', 'analytics', true),
('Content Creator', 'Content specialist for blogs and social media', 'Content Creator', '["Blog Posts", "Social Content", "Storytelling", "Audience Engagement"]', 'marketing', true)
ON CONFLICT DO NOTHING;

-- =====================================================
-- Done!
-- =====================================================
SELECT 'All tables created successfully!' as result;
