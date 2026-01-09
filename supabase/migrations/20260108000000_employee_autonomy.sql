-- Employee Memory: Stores context, past actions, learned patterns for autonomous decision-making
-- This enables employees to learn the business and make smarter decisions over time

-- Employee memory for continuity and learning
CREATE TABLE IF NOT EXISTS employee_memory (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    employee_id UUID NOT NULL REFERENCES ai_employees(id) ON DELETE CASCADE,
    template_id TEXT NOT NULL,
    
    -- Memory types: 'action', 'insight', 'research', 'decision', 'delegation', 'learning'
    memory_type TEXT NOT NULL DEFAULT 'action',
    
    -- What the employee did or learned
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    
    -- Structured data for the memory (action parameters, research findings, etc.)
    metadata JSONB DEFAULT '{}',
    
    -- For tracking ongoing multi-step work
    is_ongoing BOOLEAN DEFAULT false,
    parent_memory_id UUID REFERENCES employee_memory(id),
    
    -- Quality/outcome tracking
    outcome TEXT, -- 'success', 'partial', 'failed', 'pending'
    outcome_notes TEXT,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_employee_memory_user ON employee_memory(user_id);
CREATE INDEX IF NOT EXISTS idx_employee_memory_employee ON employee_memory(employee_id);
CREATE INDEX IF NOT EXISTS idx_employee_memory_template ON employee_memory(template_id);
CREATE INDEX IF NOT EXISTS idx_employee_memory_type ON employee_memory(memory_type);
CREATE INDEX IF NOT EXISTS idx_employee_memory_ongoing ON employee_memory(is_ongoing) WHERE is_ongoing = true;
CREATE INDEX IF NOT EXISTS idx_employee_memory_created ON employee_memory(created_at DESC);

-- RLS policies
ALTER TABLE employee_memory ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their employee memories"
    ON employee_memory FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert employee memories"
    ON employee_memory FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their employee memories"
    ON employee_memory FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their employee memories"
    ON employee_memory FOR DELETE
    USING (auth.uid() = user_id);

-- Business insights table: Stores what employees have learned about the business
CREATE TABLE IF NOT EXISTS business_insights (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    employee_id UUID REFERENCES ai_employees(id) ON DELETE SET NULL,
    template_id TEXT,
    
    -- Insight categorization
    category TEXT NOT NULL, -- 'market', 'competitor', 'customer', 'product', 'operations', 'strategy'
    title TEXT NOT NULL,
    insight TEXT NOT NULL,
    
    -- Confidence and source
    confidence_score NUMERIC(3,2) DEFAULT 0.7, -- 0.0 to 1.0
    source TEXT, -- Where the insight came from
    
    -- Actionability
    is_actionable BOOLEAN DEFAULT true,
    recommended_action TEXT,
    action_taken BOOLEAN DEFAULT false,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    expires_at TIMESTAMPTZ -- Some insights may become stale
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_business_insights_user ON business_insights(user_id);
CREATE INDEX IF NOT EXISTS idx_business_insights_category ON business_insights(category);
CREATE INDEX IF NOT EXISTS idx_business_insights_actionable ON business_insights(is_actionable) WHERE is_actionable = true;

-- RLS
ALTER TABLE business_insights ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their business insights"
    ON business_insights FOR ALL
    USING (auth.uid() = user_id);

-- Autonomous action queue: What employees have decided to do
CREATE TABLE IF NOT EXISTS autonomous_actions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    employee_id UUID NOT NULL REFERENCES ai_employees(id) ON DELETE CASCADE,
    template_id TEXT NOT NULL,
    
    -- What the employee decided to do
    action_type TEXT NOT NULL, -- 'research', 'create_content', 'analyze', 'recommend', 'delegate'
    action_title TEXT NOT NULL,
    action_description TEXT NOT NULL,
    action_parameters JSONB DEFAULT '{}',
    
    -- Priority and status
    priority INTEGER DEFAULT 5, -- 1-10, higher = more urgent
    status TEXT DEFAULT 'pending', -- 'pending', 'in_progress', 'completed', 'failed', 'cancelled'
    
    -- Execution tracking
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    result TEXT,
    result_data JSONB,
    error_message TEXT,
    
    -- For multi-step actions
    depends_on UUID REFERENCES autonomous_actions(id),
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_autonomous_actions_user ON autonomous_actions(user_id);
CREATE INDEX IF NOT EXISTS idx_autonomous_actions_employee ON autonomous_actions(employee_id);
CREATE INDEX IF NOT EXISTS idx_autonomous_actions_status ON autonomous_actions(status);
CREATE INDEX IF NOT EXISTS idx_autonomous_actions_pending ON autonomous_actions(status, priority DESC) 
    WHERE status = 'pending';

-- RLS
ALTER TABLE autonomous_actions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their autonomous actions"
    ON autonomous_actions FOR ALL
    USING (auth.uid() = user_id);

-- Function to get employee's recent context
CREATE OR REPLACE FUNCTION get_employee_context(
    p_employee_id UUID,
    p_limit INTEGER DEFAULT 20
)
RETURNS TABLE (
    memory_type TEXT,
    title TEXT,
    content TEXT,
    created_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        em.memory_type,
        em.title,
        em.content,
        em.created_at
    FROM employee_memory em
    WHERE em.employee_id = p_employee_id
    ORDER BY em.created_at DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get business insights for decision-making
CREATE OR REPLACE FUNCTION get_business_context(
    p_user_id UUID
)
RETURNS TABLE (
    category TEXT,
    title TEXT,
    insight TEXT,
    recommended_action TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        bi.category,
        bi.title,
        bi.insight,
        bi.recommended_action
    FROM business_insights bi
    WHERE bi.user_id = p_user_id
      AND (bi.expires_at IS NULL OR bi.expires_at > now())
      AND bi.is_actionable = true
    ORDER BY bi.created_at DESC
    LIMIT 50;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
