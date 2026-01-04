-- =====================================================
-- Complete Database Schema for Auraa-AI
-- Run this SQL in your Supabase SQL Editor
-- Safe to run multiple times (uses DROP IF EXISTS)
-- =====================================================

-- =====================================================
-- Users Table (extends auth.users)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR(255),
  full_name VARCHAR(255),
  avatar_url TEXT,
  display_name VARCHAR(255),
  photo_url TEXT,
  is_active BOOLEAN DEFAULT false,
  role VARCHAR(50) DEFAULT 'user',
  subscription_tier VARCHAR(50),
  subscription_status VARCHAR(50),
  subscription_id VARCHAR(255),
  subscription_ends_at TIMESTAMPTZ,
  polar_customer_id VARCHAR(255),
  polar_order_id VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
CREATE POLICY "Users can view own profile" ON public.users
  FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON public.users;
CREATE POLICY "Users can insert own profile" ON public.users
  FOR INSERT WITH CHECK (auth.uid() = id);

-- =====================================================
-- AI Employees Table (Templates)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.ai_employees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  role VARCHAR(255),
  category VARCHAR(100),
  skills JSONB DEFAULT '[]'::jsonb,
  capabilities JSONB DEFAULT '[]'::jsonb,
  avatar TEXT,
  avatar_url TEXT,
  is_featured BOOLEAN DEFAULT false,
  status VARCHAR(50) DEFAULT 'available',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.ai_employees ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read access for ai_employees" ON public.ai_employees;
CREATE POLICY "Public read access for ai_employees" ON public.ai_employees
  FOR SELECT USING (true);

-- Add missing columns directly (PostgreSQL 11+)
ALTER TABLE public.ai_employees ADD COLUMN IF NOT EXISTS capabilities JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.ai_employees ADD COLUMN IF NOT EXISTS avatar TEXT;
ALTER TABLE public.ai_employees ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE public.ai_employees ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'available';
ALTER TABLE public.ai_employees ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT false;
ALTER TABLE public.ai_employees ADD COLUMN IF NOT EXISTS skills JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.ai_employees ADD COLUMN IF NOT EXISTS role VARCHAR(255);
ALTER TABLE public.ai_employees ADD COLUMN IF NOT EXISTS category VARCHAR(100);

-- =====================================================
-- Business Profiles Table
-- =====================================================
CREATE TABLE IF NOT EXISTS public.business_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  business_name VARCHAR(255),
  industry VARCHAR(100),
  company_size VARCHAR(50),
  website_url TEXT,
  description TEXT,
  target_audience TEXT,
  goals JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id)
);

ALTER TABLE public.business_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own business profile" ON public.business_profiles;
CREATE POLICY "Users can view own business profile" ON public.business_profiles
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own business profile" ON public.business_profiles;
CREATE POLICY "Users can insert own business profile" ON public.business_profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own business profile" ON public.business_profiles;
CREATE POLICY "Users can update own business profile" ON public.business_profiles
  FOR UPDATE USING (auth.uid() = user_id);

-- =====================================================
-- Deployment Requests Table
-- =====================================================
CREATE TABLE IF NOT EXISTS public.deployment_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  template_id UUID,
  employee_name VARCHAR(255) NOT NULL,
  employee_category VARCHAR(100),
  status VARCHAR(50) DEFAULT 'pending',
  deployed_employee_id UUID,
  error_message TEXT,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.deployment_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own deployment requests" ON public.deployment_requests;
CREATE POLICY "Users can view own deployment requests" ON public.deployment_requests
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own deployment requests" ON public.deployment_requests;
CREATE POLICY "Users can insert own deployment requests" ON public.deployment_requests
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own deployment requests" ON public.deployment_requests;
CREATE POLICY "Users can update own deployment requests" ON public.deployment_requests
  FOR UPDATE USING (auth.uid() = user_id);

-- =====================================================
-- Deployed Employees Table
-- =====================================================
CREATE TABLE IF NOT EXISTS public.deployed_employees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  template_id UUID,
  name VARCHAR(255) NOT NULL,
  category VARCHAR(100),
  status VARCHAR(50) DEFAULT 'active',
  configuration JSONB DEFAULT '{}'::jsonb,
  deployment_plan TEXT,
  avatar TEXT,
  current_task TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.deployed_employees ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own deployed employees" ON public.deployed_employees;
CREATE POLICY "Users can view own deployed employees" ON public.deployed_employees
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own deployed employees" ON public.deployed_employees;
CREATE POLICY "Users can insert own deployed employees" ON public.deployed_employees
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own deployed employees" ON public.deployed_employees;
CREATE POLICY "Users can update own deployed employees" ON public.deployed_employees
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own deployed employees" ON public.deployed_employees;
CREATE POLICY "Users can delete own deployed employees" ON public.deployed_employees
  FOR DELETE USING (auth.uid() = user_id);

-- =====================================================
-- Agent Tasks Table
-- =====================================================
CREATE TABLE IF NOT EXISTS public.agent_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  deployed_employee_id UUID,
  ai_employee_id UUID,
  task_type VARCHAR(100),
  action VARCHAR(255),
  title VARCHAR(255),
  description TEXT,
  status VARCHAR(50) DEFAULT 'pending',
  priority VARCHAR(20) DEFAULT 'medium',
  parameters JSONB,
  result JSONB,
  error TEXT,
  started_at TIMESTAMPTZ,
  finished_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.agent_tasks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own agent tasks" ON public.agent_tasks;
CREATE POLICY "Users can view own agent tasks" ON public.agent_tasks
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own agent tasks" ON public.agent_tasks;
CREATE POLICY "Users can insert own agent tasks" ON public.agent_tasks
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own agent tasks" ON public.agent_tasks;
CREATE POLICY "Users can update own agent tasks" ON public.agent_tasks
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own agent tasks" ON public.agent_tasks;
CREATE POLICY "Users can delete own agent tasks" ON public.agent_tasks
  FOR DELETE USING (auth.uid() = user_id);

-- =====================================================
-- Agent Metrics Table
-- =====================================================
CREATE TABLE IF NOT EXISTS public.agent_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  deployed_employee_id UUID,
  name VARCHAR(255),
  value NUMERIC,
  tasks_completed INTEGER DEFAULT 0,
  avg_completion_time NUMERIC DEFAULT 0,
  success_rate NUMERIC DEFAULT 100,
  timestamp TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.agent_metrics ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own agent metrics" ON public.agent_metrics;
CREATE POLICY "Users can view own agent metrics" ON public.agent_metrics
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own agent metrics" ON public.agent_metrics;
CREATE POLICY "Users can insert own agent metrics" ON public.agent_metrics
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own agent metrics" ON public.agent_metrics;
CREATE POLICY "Users can update own agent metrics" ON public.agent_metrics
  FOR UPDATE USING (auth.uid() = user_id);

-- =====================================================
-- Agent Events Table (for realtime updates)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.agent_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  task_id UUID,
  event_type VARCHAR(100),
  payload JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.agent_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own agent events" ON public.agent_events;
CREATE POLICY "Users can view own agent events" ON public.agent_events
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own agent events" ON public.agent_events;
CREATE POLICY "Users can insert own agent events" ON public.agent_events
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- =====================================================
-- Agent Task Events Table
-- =====================================================
CREATE TABLE IF NOT EXISTS public.agent_task_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  task_id UUID,
  event_type VARCHAR(100),
  data JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.agent_task_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own task events" ON public.agent_task_events;
CREATE POLICY "Users can view own task events" ON public.agent_task_events
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own task events" ON public.agent_task_events;
CREATE POLICY "Users can insert own task events" ON public.agent_task_events
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- =====================================================
-- AI Team Communications Table
-- =====================================================
CREATE TABLE IF NOT EXISTS public.ai_team_communications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  sender_employee VARCHAR(255),
  recipient_employee VARCHAR(255),
  content TEXT,
  message_type VARCHAR(50) DEFAULT 'message',
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.ai_team_communications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own team communications" ON public.ai_team_communications;
CREATE POLICY "Users can view own team communications" ON public.ai_team_communications
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own team communications" ON public.ai_team_communications;
CREATE POLICY "Users can insert own team communications" ON public.ai_team_communications
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own team communications" ON public.ai_team_communications;
CREATE POLICY "Users can update own team communications" ON public.ai_team_communications
  FOR UPDATE USING (auth.uid() = user_id);

-- =====================================================
-- AI Team Executions Table
-- =====================================================
CREATE TABLE IF NOT EXISTS public.ai_team_executions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  workflow_name VARCHAR(255),
  status VARCHAR(50) DEFAULT 'pending',
  steps JSONB DEFAULT '[]'::jsonb,
  results JSONB,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.ai_team_executions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own team executions" ON public.ai_team_executions;
CREATE POLICY "Users can view own team executions" ON public.ai_team_executions
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own team executions" ON public.ai_team_executions;
CREATE POLICY "Users can insert own team executions" ON public.ai_team_executions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own team executions" ON public.ai_team_executions;
CREATE POLICY "Users can update own team executions" ON public.ai_team_executions
  FOR UPDATE USING (auth.uid() = user_id);

-- =====================================================
-- Website Integrations Table
-- =====================================================
CREATE TABLE IF NOT EXISTS public.website_integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(255),
  url TEXT NOT NULL,
  status VARCHAR(50) DEFAULT 'pending',
  scraped_data JSONB,
  scrape_data JSONB,
  ai_summary TEXT,
  ai_employee_id UUID,
  last_scraped_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.website_integrations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own website integrations" ON public.website_integrations;
CREATE POLICY "Users can view own website integrations" ON public.website_integrations
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own website integrations" ON public.website_integrations;
CREATE POLICY "Users can insert own website integrations" ON public.website_integrations
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own website integrations" ON public.website_integrations;
CREATE POLICY "Users can update own website integrations" ON public.website_integrations
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own website integrations" ON public.website_integrations;
CREATE POLICY "Users can delete own website integrations" ON public.website_integrations
  FOR DELETE USING (auth.uid() = user_id);

-- =====================================================
-- User Analytics Table
-- =====================================================
CREATE TABLE IF NOT EXISTS public.user_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  tasks_completed INTEGER DEFAULT 0,
  active_employees INTEGER DEFAULT 0,
  cost_saved NUMERIC DEFAULT 0,
  data JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.user_analytics ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own analytics" ON public.user_analytics;
CREATE POLICY "Users can view own analytics" ON public.user_analytics
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own analytics" ON public.user_analytics;
CREATE POLICY "Users can insert own analytics" ON public.user_analytics
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own analytics" ON public.user_analytics;
CREATE POLICY "Users can update own analytics" ON public.user_analytics
  FOR UPDATE USING (auth.uid() = user_id);

-- =====================================================
-- User Power-ups Table
-- =====================================================
CREATE TABLE IF NOT EXISTS public.user_powerups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  powerup_id VARCHAR(100) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  activated_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.user_powerups ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own powerups" ON public.user_powerups;
CREATE POLICY "Users can view own powerups" ON public.user_powerups
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own powerups" ON public.user_powerups;
CREATE POLICY "Users can insert own powerups" ON public.user_powerups
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own powerups" ON public.user_powerups;
CREATE POLICY "Users can update own powerups" ON public.user_powerups
  FOR UPDATE USING (auth.uid() = user_id);

-- =====================================================
-- Business Goals Table
-- =====================================================
CREATE TABLE IF NOT EXISTS public.business_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  target_value NUMERIC,
  current_value NUMERIC DEFAULT 0,
  unit VARCHAR(50),
  status VARCHAR(50) DEFAULT 'active',
  due_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.business_goals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own business goals" ON public.business_goals;
CREATE POLICY "Users can view own business goals" ON public.business_goals
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own business goals" ON public.business_goals;
CREATE POLICY "Users can insert own business goals" ON public.business_goals
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own business goals" ON public.business_goals;
CREATE POLICY "Users can update own business goals" ON public.business_goals
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own business goals" ON public.business_goals;
CREATE POLICY "Users can delete own business goals" ON public.business_goals
  FOR DELETE USING (auth.uid() = user_id);

-- =====================================================
-- AI Shared Knowledge Table
-- =====================================================
CREATE TABLE IF NOT EXISTS public.ai_shared_knowledge (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  content TEXT,
  category VARCHAR(100),
  tags JSONB DEFAULT '[]'::jsonb,
  source VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.ai_shared_knowledge ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own shared knowledge" ON public.ai_shared_knowledge;
CREATE POLICY "Users can view own shared knowledge" ON public.ai_shared_knowledge
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own shared knowledge" ON public.ai_shared_knowledge;
CREATE POLICY "Users can insert own shared knowledge" ON public.ai_shared_knowledge
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own shared knowledge" ON public.ai_shared_knowledge;
CREATE POLICY "Users can update own shared knowledge" ON public.ai_shared_knowledge
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own shared knowledge" ON public.ai_shared_knowledge;
CREATE POLICY "Users can delete own shared knowledge" ON public.ai_shared_knowledge
  FOR DELETE USING (auth.uid() = user_id);

-- =====================================================
-- Platform Stats Table (public stats)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.platform_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stat_name VARCHAR(100) UNIQUE NOT NULL,
  stat_value VARCHAR(255),
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.platform_stats ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read access for platform stats" ON public.platform_stats;
CREATE POLICY "Public read access for platform stats" ON public.platform_stats
  FOR SELECT USING (true);

-- Insert default platform stats
INSERT INTO public.platform_stats (stat_name, stat_value, description) VALUES
('gmv_analyzed', '$32B+', 'Total GMV analyzed'),
('orders_processed', '44M+', 'Total orders processed'),
('customers_served', '19M+', 'Total customers served')
ON CONFLICT (stat_name) DO NOTHING;

-- =====================================================
-- Puter Script Requests Table
-- =====================================================
CREATE TABLE IF NOT EXISTS public.puter_script_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  prompt TEXT NOT NULL,
  generated_script TEXT,
  status VARCHAR(50) DEFAULT 'processing',
  puter_username VARCHAR(255),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.puter_script_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own puter requests" ON public.puter_script_requests;
CREATE POLICY "Users can view own puter requests" ON public.puter_script_requests
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own puter requests" ON public.puter_script_requests;
CREATE POLICY "Users can insert own puter requests" ON public.puter_script_requests
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own puter requests" ON public.puter_script_requests;
CREATE POLICY "Users can update own puter requests" ON public.puter_script_requests
  FOR UPDATE USING (auth.uid() = user_id);

-- =====================================================
-- AI Employee Templates Table (for backward compatibility)
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

ALTER TABLE public.ai_employee_templates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read access for templates" ON public.ai_employee_templates;
CREATE POLICY "Public read access for templates" ON public.ai_employee_templates
  FOR SELECT USING (true);

-- =====================================================
-- Insert Default AI Employees (handle both text[] and jsonb for skills)
-- =====================================================
DO $$
BEGIN
  -- Only insert if table is empty
  IF NOT EXISTS (SELECT 1 FROM public.ai_employees LIMIT 1) THEN
    -- Check if skills column is jsonb
    IF EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
        AND table_name = 'ai_employees' 
        AND column_name = 'skills' 
        AND data_type = 'jsonb'
    ) THEN
      INSERT INTO public.ai_employees (name, description, role, category, skills, capabilities, is_featured) VALUES
      ('Milli', 'Expert sales manager for lead generation and deal closing', 'Sales Manager', 'sales', 
       '["Cold Calls", "Email Campaigns", "Deal Closing", "Client Pitches"]'::jsonb,
       '["Lead Generation", "CRM Integration", "Sales Analytics"]'::jsonb, true),
      ('Cassie', 'Customer support specialist for ticket resolution and live chat', 'Customer Support Specialist', 'support',
       '["Ticket Resolution", "Live Chat", "Brand Voice", "Customer Retention"]'::jsonb,
       '["24/7 Support", "Multi-language", "Sentiment Analysis"]'::jsonb, true),
      ('Dexter', 'Data analyst for insights and forecasting', 'Data Analyst', 'analytics',
       '["Data Analysis", "Forecasting", "Business Insights", "Performance Tracking"]'::jsonb,
       '["Dashboard Creation", "Predictive Analytics", "Report Generation"]'::jsonb, true);
    ELSE
      -- Handle text[] type for skills
      INSERT INTO public.ai_employees (name, description, role, category, capabilities, is_featured) VALUES
      ('Milli', 'Expert sales manager for lead generation and deal closing', 'Sales Manager', 'sales', 
       '["Lead Generation", "CRM Integration", "Sales Analytics"]'::jsonb, true),
      ('Cassie', 'Customer support specialist for ticket resolution and live chat', 'Customer Support Specialist', 'support',
       '["24/7 Support", "Multi-language", "Sentiment Analysis"]'::jsonb, true),
      ('Dexter', 'Data analyst for insights and forecasting', 'Data Analyst', 'analytics',
       '["Dashboard Creation", "Predictive Analytics", "Report Generation"]'::jsonb, true);
    END IF;
  END IF;
END $$;

-- =====================================================
-- Enable Realtime for key tables (ignore errors if already enabled)
-- =====================================================
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.agent_tasks;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.agent_events;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.ai_team_communications;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.deployed_employees;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.agent_metrics;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- =====================================================
-- Create Indexes for Performance
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_agent_tasks_user_id ON public.agent_tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_agent_tasks_status ON public.agent_tasks(status);
CREATE INDEX IF NOT EXISTS idx_deployed_employees_user_id ON public.deployed_employees(user_id);
CREATE INDEX IF NOT EXISTS idx_deployment_requests_user_id ON public.deployment_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_team_communications_user_id ON public.ai_team_communications(user_id);
CREATE INDEX IF NOT EXISTS idx_agent_metrics_user_id ON public.agent_metrics(user_id);

-- =====================================================
-- Done!
-- =====================================================
SELECT 'All tables created successfully!' as result;
