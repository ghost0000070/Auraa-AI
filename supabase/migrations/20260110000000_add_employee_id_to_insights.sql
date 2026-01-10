-- Add employee_id to get_recent_business_insights function
CREATE OR REPLACE FUNCTION get_recent_business_insights(p_limit INTEGER DEFAULT 10)
RETURNS TABLE (
    id UUID,
    employee_id UUID,
    employee_name TEXT,
    category TEXT,
    title TEXT,
    insight TEXT,
    recommended_action TEXT,
    is_actionable BOOLEAN,
    created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT
        bi.id,
        bi.employee_id,
        de.name::TEXT AS employee_name,
        bi.category::TEXT,
        bi.title::TEXT,
        bi.insight::TEXT,
        bi.recommended_action::TEXT,
        bi.is_actionable,
        bi.created_at
    FROM business_insights bi
    JOIN deployed_employees de ON bi.employee_id = de.id
    WHERE bi.user_id = auth.uid()
    ORDER BY bi.created_at DESC
    LIMIT p_limit;
END;
$$;