-- =====================================================
-- Additional Indexes and Storage Buckets for Auraa-AI
-- Run after previous migrations
-- Addresses missing indexes and storage configuration
-- =====================================================

-- =====================================================
-- Additional Performance Indexes
-- These are critical for frequently queried columns
-- =====================================================

-- Agent action logs - frequently filtered by user and time
CREATE INDEX IF NOT EXISTS idx_agent_action_logs_user_created 
  ON public.agent_action_logs(user_id, created_at DESC);

-- Agent task queue - critical for processing queue lookups
CREATE INDEX IF NOT EXISTS idx_agent_task_queue_user_status_scheduled 
  ON public.agent_task_queue(user_id, status, scheduled_for);

-- Deployed employees - frequently filtered by status
CREATE INDEX IF NOT EXISTS idx_deployed_employees_user_status 
  ON public.deployed_employees(user_id, status);

-- AI team communications - for unread message queries
CREATE INDEX IF NOT EXISTS idx_ai_team_communications_user_read_created 
  ON public.ai_team_communications(user_id, is_read, created_at DESC);

-- Agent tasks - for task completion queries
CREATE INDEX IF NOT EXISTS idx_agent_tasks_user_created 
  ON public.agent_tasks(user_id, created_at DESC);

-- Only create if column exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'agent_tasks' AND column_name = 'deployed_employee_id') THEN
    CREATE INDEX IF NOT EXISTS idx_agent_tasks_deployed_employee ON public.agent_tasks(deployed_employee_id);
  END IF;
END $$;

-- Agent metrics - for time-series queries
CREATE INDEX IF NOT EXISTS idx_agent_metrics_user_timestamp 
  ON public.agent_metrics(user_id, timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_agent_metrics_deployed_employee 
  ON public.agent_metrics(deployed_employee_id);

-- Website integrations - for status and scraping queries
CREATE INDEX IF NOT EXISTS idx_website_integrations_user_status 
  ON public.website_integrations(user_id, status);

-- User powerups - for active powerup lookups
CREATE INDEX IF NOT EXISTS idx_user_powerups_user_active 
  ON public.user_powerups(user_id, is_active);

-- Business goals - for active goal queries
CREATE INDEX IF NOT EXISTS idx_business_goals_user_status 
  ON public.business_goals(user_id, status);

-- AI shared knowledge - for category-based searches
CREATE INDEX IF NOT EXISTS idx_ai_shared_knowledge_user_category 
  ON public.ai_shared_knowledge(user_id, category);

-- Integration targets - for active integrations
CREATE INDEX IF NOT EXISTS idx_integration_targets_user_active 
  ON public.integration_targets(user_id, is_active);

-- Puter script requests - for status tracking
CREATE INDEX IF NOT EXISTS idx_puter_script_requests_user_status 
  ON public.puter_script_requests(user_id, status);

-- AI team executions - for workflow tracking
CREATE INDEX IF NOT EXISTS idx_ai_team_executions_user_status 
  ON public.ai_team_executions(user_id, status);

-- Deployment requests - for pending request lookups
CREATE INDEX IF NOT EXISTS idx_deployment_requests_user_status 
  ON public.deployment_requests(user_id, status);

-- =====================================================
-- Add missing columns to user_powerups table
-- Frontend expects powerup_name column
-- =====================================================
ALTER TABLE public.user_powerups 
  ADD COLUMN IF NOT EXISTS powerup_name VARCHAR(255);

ALTER TABLE public.user_powerups 
  ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'active';

-- Add unique constraint for upsert operations
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'user_powerups_user_powerup_unique'
  ) THEN
    ALTER TABLE public.user_powerups 
      ADD CONSTRAINT user_powerups_user_powerup_unique 
      UNIQUE (user_id, powerup_id);
  END IF;
END $$;

-- =====================================================
-- Power-Ups Definition Table
-- Defines available power-ups in the system
-- =====================================================
CREATE TABLE IF NOT EXISTS public.power_up_definitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL UNIQUE,
  display_name VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(100),
  required_tier VARCHAR(50) DEFAULT 'pro', -- 'free', 'pro', 'enterprise'
  features JSONB DEFAULT '[]'::jsonb,
  is_active BOOLEAN DEFAULT true,
  icon VARCHAR(100),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.power_up_definitions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read access for power up definitions" ON public.power_up_definitions;
CREATE POLICY "Public read access for power up definitions" ON public.power_up_definitions
  FOR SELECT USING (true);

-- Insert default power-up definitions
INSERT INTO public.power_up_definitions (name, display_name, description, category, required_tier, icon) VALUES
('anomaly_detection', 'AI-Driven Anomaly Detection', 'Automatically detect anomalies in your data patterns using advanced machine learning.', 'analytics', 'pro', 'activity'),
('report_generation', 'Automated Report Generation', 'Generate comprehensive reports automatically based on your data.', 'automation', 'pro', 'file-text'),
('predictive_analytics', 'Predictive Analytics Module', 'Forecast future trends and outcomes with high accuracy using AI models.', 'analytics', 'enterprise', 'trending-up'),
('multi_language', 'Multi-Language Support', 'Enable your AI employees to communicate in multiple languages.', 'communication', 'pro', 'globe'),
('custom_integrations', 'Custom API Integrations', 'Connect your AI employees to any external API or service.', 'integration', 'enterprise', 'plug'),
('advanced_scheduling', 'Advanced Task Scheduling', 'Schedule tasks with complex recurrence patterns and dependencies.', 'automation', 'pro', 'calendar')
ON CONFLICT (name) DO NOTHING;

-- =====================================================
-- Email Notification Preferences Table
-- Stores user preferences for email notifications
-- =====================================================
CREATE TABLE IF NOT EXISTS public.notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  email_task_completed BOOLEAN DEFAULT true,
  email_daily_digest BOOLEAN DEFAULT true,
  email_weekly_summary BOOLEAN DEFAULT true,
  email_deployment_alerts BOOLEAN DEFAULT true,
  email_security_alerts BOOLEAN DEFAULT true,
  email_marketing BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own notification preferences" ON public.notification_preferences;
CREATE POLICY "Users can view own notification preferences" ON public.notification_preferences
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own notification preferences" ON public.notification_preferences;
CREATE POLICY "Users can insert own notification preferences" ON public.notification_preferences
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own notification preferences" ON public.notification_preferences;
CREATE POLICY "Users can update own notification preferences" ON public.notification_preferences
  FOR UPDATE USING (auth.uid() = user_id);

-- =====================================================
-- Notification Log Table
-- Tracks sent notifications for audit and rate limiting
-- =====================================================
CREATE TABLE IF NOT EXISTS public.notification_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  notification_type VARCHAR(100) NOT NULL,
  channel VARCHAR(50) NOT NULL, -- 'email', 'push', 'in_app'
  subject VARCHAR(500),
  status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'sent', 'failed', 'bounced'
  metadata JSONB DEFAULT '{}'::jsonb,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.notification_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own notification log" ON public.notification_log;
CREATE POLICY "Users can view own notification log" ON public.notification_log
  FOR SELECT USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_notification_log_user_type 
  ON public.notification_log(user_id, notification_type, created_at DESC);

-- =====================================================
-- Storage Buckets Configuration
-- Note: This needs to be run with service role or via Supabase Dashboard
-- These statements will create buckets if they don't exist
-- =====================================================

-- Create avatars bucket (public for profile images)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars', 
  'avatars', 
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

-- Create documents bucket (private for user documents)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'documents', 
  'documents', 
  false,
  52428800, -- 50MB limit
  ARRAY['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain', 'text/csv', 'application/json']
)
ON CONFLICT (id) DO UPDATE SET
  public = false,
  file_size_limit = 52428800;

-- Create exports bucket (private for generated exports)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'exports', 
  'exports', 
  false,
  104857600, -- 100MB limit
  ARRAY['application/pdf', 'text/csv', 'application/json', 'application/zip']
)
ON CONFLICT (id) DO UPDATE SET
  public = false,
  file_size_limit = 104857600;

-- Create knowledge-base bucket (private for AI knowledge documents)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'knowledge-base', 
  'knowledge-base', 
  false,
  52428800, -- 50MB limit
  ARRAY['application/pdf', 'text/plain', 'text/markdown', 'application/json']
)
ON CONFLICT (id) DO UPDATE SET
  public = false,
  file_size_limit = 52428800;

-- =====================================================
-- Storage Bucket RLS Policies
-- =====================================================

-- Avatars: Public read, authenticated user write for own files
DROP POLICY IF EXISTS "Avatar images are publicly accessible" ON storage.objects;
CREATE POLICY "Avatar images are publicly accessible" ON storage.objects
  FOR SELECT USING (bucket_id = 'avatars');

DROP POLICY IF EXISTS "Users can upload their own avatar" ON storage.objects;
CREATE POLICY "Users can upload their own avatar" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'avatars' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

DROP POLICY IF EXISTS "Users can update their own avatar" ON storage.objects;
CREATE POLICY "Users can update their own avatar" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'avatars' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

DROP POLICY IF EXISTS "Users can delete their own avatar" ON storage.objects;
CREATE POLICY "Users can delete their own avatar" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'avatars' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Documents: Authenticated user can manage own files
DROP POLICY IF EXISTS "Users can view own documents" ON storage.objects;
CREATE POLICY "Users can view own documents" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'documents' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

DROP POLICY IF EXISTS "Users can upload own documents" ON storage.objects;
CREATE POLICY "Users can upload own documents" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'documents' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

DROP POLICY IF EXISTS "Users can delete own documents" ON storage.objects;
CREATE POLICY "Users can delete own documents" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'documents' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Exports: Authenticated user can manage own exports
DROP POLICY IF EXISTS "Users can view own exports" ON storage.objects;
CREATE POLICY "Users can view own exports" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'exports' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

DROP POLICY IF EXISTS "Users can download own exports" ON storage.objects;
CREATE POLICY "Users can download own exports" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'exports' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

DROP POLICY IF EXISTS "Users can delete own exports" ON storage.objects;
CREATE POLICY "Users can delete own exports" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'exports' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Knowledge-base: Authenticated user can manage own knowledge files
DROP POLICY IF EXISTS "Users can view own knowledge base" ON storage.objects;
CREATE POLICY "Users can view own knowledge base" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'knowledge-base' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

DROP POLICY IF EXISTS "Users can upload to knowledge base" ON storage.objects;
CREATE POLICY "Users can upload to knowledge base" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'knowledge-base' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

DROP POLICY IF EXISTS "Users can delete from knowledge base" ON storage.objects;
CREATE POLICY "Users can delete from knowledge base" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'knowledge-base' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- =====================================================
-- Done!
-- =====================================================
SELECT 'Additional indexes and storage buckets created successfully!' as result;
