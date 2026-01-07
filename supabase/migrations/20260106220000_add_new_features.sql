-- Migration: Add new tables for notifications, API keys, scheduled tasks, and audit logs
-- Run with: supabase db push

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'info' CHECK (type IN ('info', 'success', 'warning', 'error')),
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    link TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notifications" ON notifications
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications" ON notifications
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own notifications" ON notifications
    FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Service role can insert notifications" ON notifications
    FOR INSERT WITH CHECK (TRUE);

-- API Keys table
CREATE TABLE IF NOT EXISTS api_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    key_hash TEXT NOT NULL,
    key_prefix TEXT NOT NULL,
    scopes TEXT[] NOT NULL DEFAULT ARRAY['read'],
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    last_used_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_api_keys_user_id ON api_keys(user_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_key_hash ON api_keys(key_hash);

ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own API keys" ON api_keys
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own API keys" ON api_keys
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own API keys" ON api_keys
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own API keys" ON api_keys
    FOR DELETE USING (auth.uid() = user_id);

-- Scheduled Tasks table
CREATE TABLE IF NOT EXISTS scheduled_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    employee_id UUID REFERENCES deployed_employees(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    action TEXT NOT NULL,
    parameters JSONB DEFAULT '{}',
    cron_expression TEXT NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    last_run_at TIMESTAMPTZ,
    next_run_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_scheduled_tasks_user_id ON scheduled_tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_tasks_is_active ON scheduled_tasks(is_active);
CREATE INDEX IF NOT EXISTS idx_scheduled_tasks_next_run ON scheduled_tasks(next_run_at);

ALTER TABLE scheduled_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own scheduled tasks" ON scheduled_tasks
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own scheduled tasks" ON scheduled_tasks
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own scheduled tasks" ON scheduled_tasks
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own scheduled tasks" ON scheduled_tasks
    FOR DELETE USING (auth.uid() = user_id);

-- Audit Logs table
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    resource_type TEXT NOT NULL,
    resource_id TEXT,
    details JSONB DEFAULT '{}',
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);

ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Regular users can only see their own audit logs
CREATE POLICY "Users can view own audit logs" ON audit_logs
    FOR SELECT USING (auth.uid() = user_id);

-- Service role can insert audit logs
CREATE POLICY "Service role can insert audit logs" ON audit_logs
    FOR INSERT WITH CHECK (TRUE);

-- Add onboarding_completed column to users if not exists
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'onboarding_completed'
    ) THEN
        ALTER TABLE users ADD COLUMN onboarding_completed BOOLEAN DEFAULT FALSE;
    END IF;
END $$;

-- Add goals column to business_profiles if not exists
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'business_profiles' AND column_name = 'goals'
    ) THEN
        ALTER TABLE business_profiles ADD COLUMN goals TEXT[];
    END IF;
END $$;

-- Agent action logs table (if not exists)
CREATE TABLE IF NOT EXISTS agent_action_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    task_id UUID REFERENCES agent_tasks(id) ON DELETE CASCADE,
    employee_id UUID REFERENCES deployed_employees(id) ON DELETE SET NULL,
    action_type TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'started' CHECK (status IN ('started', 'running', 'completed', 'failed')),
    message TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_agent_action_logs_user_id ON agent_action_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_agent_action_logs_task_id ON agent_action_logs(task_id);
CREATE INDEX IF NOT EXISTS idx_agent_action_logs_created_at ON agent_action_logs(created_at DESC);

ALTER TABLE agent_action_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own action logs" ON agent_action_logs
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service role can insert action logs" ON agent_action_logs
    FOR INSERT WITH CHECK (TRUE);

-- Function to create notification on task completion
CREATE OR REPLACE FUNCTION notify_task_completion()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status IN ('completed', 'success', 'failed', 'error') AND 
       (OLD.status IS NULL OR OLD.status NOT IN ('completed', 'success', 'failed', 'error')) THEN
        INSERT INTO notifications (user_id, title, message, type, link)
        VALUES (
            NEW.user_id,
            CASE 
                WHEN NEW.status IN ('completed', 'success') THEN 'Task Completed'
                ELSE 'Task Failed'
            END,
            'Task ' || COALESCE(NEW.action, 'Unknown') || ' has ' || 
            CASE 
                WHEN NEW.status IN ('completed', 'success') THEN 'completed successfully'
                ELSE 'failed'
            END,
            CASE 
                WHEN NEW.status IN ('completed', 'success') THEN 'success'
                ELSE 'error'
            END,
            '/logs'
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for task notifications
DROP TRIGGER IF EXISTS task_completion_notify ON agent_tasks;
CREATE TRIGGER task_completion_notify
    AFTER UPDATE ON agent_tasks
    FOR EACH ROW
    EXECUTE FUNCTION notify_task_completion();
