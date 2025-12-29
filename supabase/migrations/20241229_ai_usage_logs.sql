-- AI Usage Logs table - tracks all AI token consumption
CREATE TABLE IF NOT EXISTS ai_usage_logs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    feature text NOT NULL, -- e.g., 'proposal', 'email', 'sop', 'commercial_tasks'
    prompt_tokens integer DEFAULT 0,
    completion_tokens integer DEFAULT 0,
    tokens_used integer NOT NULL,
    model text, -- e.g., 'claude-sonnet-4-20250514'
    request_id text, -- Anthropic request ID for debugging
    metadata jsonb DEFAULT '{}', -- Additional context (prompt preview, etc.)
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Indexes for efficient querying
CREATE INDEX IF NOT EXISTS ai_usage_logs_organization_id_idx ON ai_usage_logs(organization_id);
CREATE INDEX IF NOT EXISTS ai_usage_logs_user_id_idx ON ai_usage_logs(user_id);
CREATE INDEX IF NOT EXISTS ai_usage_logs_created_at_idx ON ai_usage_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS ai_usage_logs_feature_idx ON ai_usage_logs(feature);

-- RLS policies
ALTER TABLE ai_usage_logs ENABLE ROW LEVEL SECURITY;

-- Users can view their organization's usage logs
CREATE POLICY "Users can view org usage logs"
    ON ai_usage_logs FOR SELECT
    USING (
        organization_id IN (
            SELECT organization_id FROM organization_members
            WHERE user_id = auth.uid()
        )
    );

-- Only service role can insert (edge functions)
CREATE POLICY "Service role can insert usage logs"
    ON ai_usage_logs FOR INSERT
    WITH CHECK (true);

-- Grant permissions
GRANT SELECT ON ai_usage_logs TO authenticated;
GRANT INSERT ON ai_usage_logs TO service_role;

-- Function to log AI usage (called from edge functions)
CREATE OR REPLACE FUNCTION log_ai_usage(
    p_organization_id uuid,
    p_user_id uuid,
    p_feature text,
    p_tokens_used integer,
    p_prompt_tokens integer DEFAULT 0,
    p_completion_tokens integer DEFAULT 0,
    p_model text DEFAULT NULL,
    p_request_id text DEFAULT NULL,
    p_metadata jsonb DEFAULT '{}'
)
RETURNS uuid AS $$
DECLARE
    log_id uuid;
BEGIN
    INSERT INTO ai_usage_logs (
        organization_id,
        user_id,
        feature,
        tokens_used,
        prompt_tokens,
        completion_tokens,
        model,
        request_id,
        metadata
    ) VALUES (
        p_organization_id,
        p_user_id,
        p_feature,
        p_tokens_used,
        p_prompt_tokens,
        p_completion_tokens,
        p_model,
        p_request_id,
        p_metadata
    )
    RETURNING id INTO log_id;

    RETURN log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute to service role
GRANT EXECUTE ON FUNCTION log_ai_usage TO service_role;
