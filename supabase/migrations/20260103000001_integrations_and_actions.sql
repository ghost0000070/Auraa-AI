-- =====================================================
-- Additional Tables for Integrations and Agent Actions
-- Run after 20260103000000_complete_schema.sql
-- =====================================================

-- =====================================================
-- Integration Targets Table
-- Stores external service endpoints for integrations
-- =====================================================
CREATE TABLE IF NOT EXISTS public.integration_targets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  service_type VARCHAR(100) NOT NULL, -- 'slack', 'email', 'webhook', 'crm', etc.
  endpoint_url TEXT,
  auth_type VARCHAR(50) DEFAULT 'api_key', -- 'api_key', 'oauth', 'basic', 'bearer'
  is_active BOOLEAN DEFAULT true,
  config JSONB DEFAULT '{}'::jsonb, -- Additional configuration options
  last_used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.integration_targets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own integration targets" ON public.integration_targets;
CREATE POLICY "Users can view own integration targets" ON public.integration_targets
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own integration targets" ON public.integration_targets;
CREATE POLICY "Users can insert own integration targets" ON public.integration_targets
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own integration targets" ON public.integration_targets;
CREATE POLICY "Users can update own integration targets" ON public.integration_targets
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own integration targets" ON public.integration_targets;
CREATE POLICY "Users can delete own integration targets" ON public.integration_targets
  FOR DELETE USING (auth.uid() = user_id);

-- =====================================================
-- Integration Credentials Table
-- Stores encrypted API credentials for integrations
-- =====================================================
CREATE TABLE IF NOT EXISTS public.integration_credentials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  integration_target_id UUID REFERENCES public.integration_targets(id) ON DELETE CASCADE,
  credential_type VARCHAR(100) NOT NULL, -- 'api_key', 'oauth_token', 'password', etc.
  encrypted_value JSONB NOT NULL, -- Stores EncryptedEnvelope structure
  expires_at TIMESTAMPTZ,
  is_valid BOOLEAN DEFAULT true,
  last_validated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.integration_credentials ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own credentials" ON public.integration_credentials;
CREATE POLICY "Users can view own credentials" ON public.integration_credentials
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own credentials" ON public.integration_credentials;
CREATE POLICY "Users can insert own credentials" ON public.integration_credentials
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own credentials" ON public.integration_credentials;
CREATE POLICY "Users can update own credentials" ON public.integration_credentials
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own credentials" ON public.integration_credentials;
CREATE POLICY "Users can delete own credentials" ON public.integration_credentials
  FOR DELETE USING (auth.uid() = user_id);

-- =====================================================
-- Agent Actions Table
-- Registry of available actions agents can perform
-- =====================================================
CREATE TABLE IF NOT EXISTS public.agent_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL UNIQUE,
  display_name VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(100), -- 'communication', 'data', 'automation', 'integration'
  action_type VARCHAR(100) NOT NULL, -- 'internal', 'external_api', 'webhook', 'email'
  required_params JSONB DEFAULT '[]'::jsonb, -- Array of required parameter definitions
  optional_params JSONB DEFAULT '[]'::jsonb, -- Array of optional parameter definitions
  output_schema JSONB DEFAULT '{}'::jsonb, -- Expected output structure
  requires_credential BOOLEAN DEFAULT false,
  required_subscription_tier VARCHAR(50) DEFAULT 'free', -- 'free', 'pro', 'enterprise'
  is_active BOOLEAN DEFAULT true,
  usage_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.agent_actions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read access for agent actions" ON public.agent_actions;
CREATE POLICY "Public read access for agent actions" ON public.agent_actions
  FOR SELECT USING (true);

-- =====================================================
-- Agent Action Logs Table
-- Tracks execution of agent actions for audit and debugging
-- =====================================================
CREATE TABLE IF NOT EXISTS public.agent_action_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  deployed_employee_id UUID,
  action_id UUID REFERENCES public.agent_actions(id) ON DELETE SET NULL,
  action_name VARCHAR(255) NOT NULL,
  input_params JSONB,
  output_result JSONB,
  status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'running', 'success', 'failed'
  error_message TEXT,
  execution_time_ms INTEGER,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.agent_action_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own action logs" ON public.agent_action_logs;
CREATE POLICY "Users can view own action logs" ON public.agent_action_logs
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own action logs" ON public.agent_action_logs;
CREATE POLICY "Users can insert own action logs" ON public.agent_action_logs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- =====================================================
-- Agent Task Queue Table
-- Queue for pending agent tasks (used by agent-run function)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.agent_task_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  deployed_employee_id UUID,
  action_name VARCHAR(255) NOT NULL,
  priority INTEGER DEFAULT 5, -- 1 = highest, 10 = lowest
  payload JSONB NOT NULL,
  status VARCHAR(50) DEFAULT 'queued', -- 'queued', 'processing', 'completed', 'failed', 'canceled'
  attempts INTEGER DEFAULT 0,
  max_attempts INTEGER DEFAULT 3,
  scheduled_for TIMESTAMPTZ DEFAULT now(),
  locked_at TIMESTAMPTZ,
  locked_by VARCHAR(255),
  error_message TEXT,
  result JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.agent_task_queue ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own queued tasks" ON public.agent_task_queue;
CREATE POLICY "Users can view own queued tasks" ON public.agent_task_queue
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own queued tasks" ON public.agent_task_queue;
CREATE POLICY "Users can insert own queued tasks" ON public.agent_task_queue
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own queued tasks" ON public.agent_task_queue;
CREATE POLICY "Users can update own queued tasks" ON public.agent_task_queue
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own queued tasks" ON public.agent_task_queue;
CREATE POLICY "Users can delete own queued tasks" ON public.agent_task_queue
  FOR DELETE USING (auth.uid() = user_id);

-- =====================================================
-- Insert Default Agent Actions
-- =====================================================
INSERT INTO public.agent_actions (name, display_name, description, category, action_type, required_params, requires_credential, required_subscription_tier) VALUES
('send_email', 'Send Email', 'Send an email to a specified recipient', 'communication', 'email', 
 '[{"name": "to", "type": "email", "required": true}, {"name": "subject", "type": "string", "required": true}, {"name": "body", "type": "text", "required": true}]'::jsonb, 
 true, 'pro'),
('slack_message', 'Send Slack Message', 'Send a message to a Slack channel', 'communication', 'external_api',
 '[{"name": "channel", "type": "string", "required": true}, {"name": "message", "type": "text", "required": true}]'::jsonb,
 true, 'pro'),
('webhook_call', 'Call Webhook', 'Make an HTTP request to a webhook URL', 'integration', 'webhook',
 '[{"name": "url", "type": "url", "required": true}, {"name": "method", "type": "string", "required": false}, {"name": "body", "type": "json", "required": false}]'::jsonb,
 false, 'free'),
('analyze_data', 'Analyze Data', 'Perform AI-powered data analysis', 'data', 'internal',
 '[{"name": "data", "type": "json", "required": true}, {"name": "analysis_type", "type": "string", "required": true}]'::jsonb,
 false, 'free'),
('generate_content', 'Generate Content', 'Generate text content using AI', 'automation', 'internal',
 '[{"name": "prompt", "type": "text", "required": true}, {"name": "content_type", "type": "string", "required": true}]'::jsonb,
 false, 'free'),
('scrape_website', 'Scrape Website', 'Extract content from a website URL', 'data', 'internal',
 '[{"name": "url", "type": "url", "required": true}]'::jsonb,
 false, 'pro'),
('crm_update', 'Update CRM', 'Update a record in connected CRM', 'integration', 'external_api',
 '[{"name": "record_type", "type": "string", "required": true}, {"name": "record_id", "type": "string", "required": true}, {"name": "fields", "type": "json", "required": true}]'::jsonb,
 true, 'enterprise'),
('schedule_task', 'Schedule Task', 'Schedule a task for future execution', 'automation', 'internal',
 '[{"name": "task_name", "type": "string", "required": true}, {"name": "scheduled_time", "type": "datetime", "required": true}, {"name": "payload", "type": "json", "required": false}]'::jsonb,
 false, 'pro')
ON CONFLICT (name) DO NOTHING;

-- =====================================================
-- Create Indexes for Performance
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_integration_targets_user_id ON public.integration_targets(user_id);
CREATE INDEX IF NOT EXISTS idx_integration_targets_service_type ON public.integration_targets(service_type);
CREATE INDEX IF NOT EXISTS idx_integration_credentials_user_id ON public.integration_credentials(user_id);
CREATE INDEX IF NOT EXISTS idx_integration_credentials_target_id ON public.integration_credentials(integration_target_id);
CREATE INDEX IF NOT EXISTS idx_agent_actions_category ON public.agent_actions(category);
CREATE INDEX IF NOT EXISTS idx_agent_action_logs_user_id ON public.agent_action_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_agent_action_logs_status ON public.agent_action_logs(status);
CREATE INDEX IF NOT EXISTS idx_agent_task_queue_user_id ON public.agent_task_queue(user_id);
CREATE INDEX IF NOT EXISTS idx_agent_task_queue_status ON public.agent_task_queue(status);
CREATE INDEX IF NOT EXISTS idx_agent_task_queue_priority ON public.agent_task_queue(priority, scheduled_for);

-- =====================================================
-- Enable Realtime for queue table
-- =====================================================
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.agent_task_queue;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- =====================================================
-- Done!
-- =====================================================
SELECT 'Integration and agent action tables created successfully!' as result;
