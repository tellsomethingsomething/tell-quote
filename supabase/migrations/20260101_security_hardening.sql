-- Security Hardening Migration
-- Date: 2026-01-01
-- Addresses security audit findings

-- =============================================
-- 1. Add RLS to missing tables
-- =============================================

-- Enable RLS on webhook_events table
ALTER TABLE IF EXISTS webhook_events ENABLE ROW LEVEL SECURITY;

-- Webhook events should only be accessible by the organization they belong to
CREATE POLICY IF NOT EXISTS "webhook_events_org_access" ON webhook_events
    FOR ALL USING (
        organization_id IN (
            SELECT om.organization_id
            FROM organization_members om
            WHERE om.user_id = auth.uid() AND om.status = 'active'
        )
    );

-- Enable RLS on billing_invoices table
ALTER TABLE IF EXISTS billing_invoices ENABLE ROW LEVEL SECURITY;

-- Billing invoices should only be accessible by the organization they belong to
CREATE POLICY IF NOT EXISTS "billing_invoices_org_access" ON billing_invoices
    FOR ALL USING (
        organization_id IN (
            SELECT om.organization_id
            FROM organization_members om
            WHERE om.user_id = auth.uid() AND om.status = 'active'
        )
    );

-- Enable RLS on token_purchases table
ALTER TABLE IF EXISTS token_purchases ENABLE ROW LEVEL SECURITY;

-- Token purchases should only be accessible by the organization they belong to
CREATE POLICY IF NOT EXISTS "token_purchases_org_access" ON token_purchases
    FOR ALL USING (
        organization_id IN (
            SELECT om.organization_id
            FROM organization_members om
            WHERE om.user_id = auth.uid() AND om.status = 'active'
        )
    );

-- Enable RLS on audit_logs table (read-only for users)
ALTER TABLE IF EXISTS audit_logs ENABLE ROW LEVEL SECURITY;

-- Audit logs are read-only and accessible by organization members
CREATE POLICY IF NOT EXISTS "audit_logs_org_read" ON audit_logs
    FOR SELECT USING (
        organization_id IN (
            SELECT om.organization_id
            FROM organization_members om
            WHERE om.user_id = auth.uid() AND om.status = 'active'
        )
    );

-- =============================================
-- 2. Add organization_id to activities table if missing
-- =============================================

-- Check and add organization_id column to activities table
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'activities' AND column_name = 'organization_id'
    ) THEN
        ALTER TABLE activities ADD COLUMN organization_id UUID REFERENCES organizations(id);
        CREATE INDEX IF NOT EXISTS idx_activities_org ON activities(organization_id);
    END IF;
END $$;

-- Enable RLS on activities table
ALTER TABLE IF EXISTS activities ENABLE ROW LEVEL SECURITY;

-- Activities should only be accessible by the organization they belong to
CREATE POLICY IF NOT EXISTS "activities_org_access" ON activities
    FOR ALL USING (
        organization_id IN (
            SELECT om.organization_id
            FROM organization_members om
            WHERE om.user_id = auth.uid() AND om.status = 'active'
        )
    );

-- =============================================
-- 3. Add organization_id to invoices table if missing
-- =============================================

-- Check and add organization_id column to invoices table
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'invoices' AND column_name = 'organization_id'
    ) THEN
        ALTER TABLE invoices ADD COLUMN organization_id UUID REFERENCES organizations(id);
        CREATE INDEX IF NOT EXISTS idx_invoices_org ON invoices(organization_id);
    END IF;
END $$;

-- Enable RLS on invoices table
ALTER TABLE IF EXISTS invoices ENABLE ROW LEVEL SECURITY;

-- Invoices should only be accessible by the organization they belong to
CREATE POLICY IF NOT EXISTS "invoices_org_access" ON invoices
    FOR ALL USING (
        organization_id IN (
            SELECT om.organization_id
            FROM organization_members om
            WHERE om.user_id = auth.uid() AND om.status = 'active'
        )
    );

-- =============================================
-- 4. Encrypt OAuth tokens at rest
-- Note: This creates a helper function for token encryption
-- The actual encryption key should be stored in Vault
-- =============================================

-- Create extension for encryption if not exists
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Add encrypted token columns to google_connections
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'google_connections' AND column_name = 'access_token_encrypted'
    ) THEN
        -- Add encrypted columns
        ALTER TABLE google_connections
            ADD COLUMN access_token_encrypted BYTEA,
            ADD COLUMN refresh_token_encrypted BYTEA;

        -- Note: Migration of existing tokens should be done via a secure process
        -- that has access to the encryption key in Supabase Vault
        COMMENT ON COLUMN google_connections.access_token_encrypted IS
            'Encrypted OAuth access token - use Vault for decryption';
        COMMENT ON COLUMN google_connections.refresh_token_encrypted IS
            'Encrypted OAuth refresh token - use Vault for decryption';
    END IF;
END $$;

-- Add encrypted token columns to microsoft_connections
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'microsoft_connections' AND column_name = 'access_token_encrypted'
    ) THEN
        ALTER TABLE microsoft_connections
            ADD COLUMN access_token_encrypted BYTEA,
            ADD COLUMN refresh_token_encrypted BYTEA;

        COMMENT ON COLUMN microsoft_connections.access_token_encrypted IS
            'Encrypted OAuth access token - use Vault for decryption';
        COMMENT ON COLUMN microsoft_connections.refresh_token_encrypted IS
            'Encrypted OAuth refresh token - use Vault for decryption';
    END IF;
END $$;

-- =============================================
-- 5. Create helper function for organization membership check
-- Optimized version using (SELECT auth.uid()) pattern
-- =============================================

CREATE OR REPLACE FUNCTION public.user_belongs_to_org(org_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = ''
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.organization_members
        WHERE organization_id = org_id
        AND user_id = (SELECT auth.uid())
        AND status = 'active'
    );
$$;

COMMENT ON FUNCTION public.user_belongs_to_org IS
    'Check if current user belongs to the specified organization';

-- =============================================
-- 6. Add rate limiting table for API endpoints
-- =============================================

CREATE TABLE IF NOT EXISTS rate_limits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key TEXT NOT NULL,
    count INTEGER DEFAULT 0,
    window_start TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(key)
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_rate_limits_key ON rate_limits(key);

-- Enable RLS (only service role can access)
ALTER TABLE rate_limits ENABLE ROW LEVEL SECURITY;

-- Function to check rate limit
CREATE OR REPLACE FUNCTION check_rate_limit(
    rate_key TEXT,
    max_requests INTEGER DEFAULT 100,
    window_seconds INTEGER DEFAULT 60
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    current_count INTEGER;
    window_start TIMESTAMPTZ;
BEGIN
    -- Get or create rate limit record
    INSERT INTO public.rate_limits (key, count, window_start)
    VALUES (rate_key, 1, NOW())
    ON CONFLICT (key) DO UPDATE SET
        count = CASE
            WHEN rate_limits.window_start < NOW() - (window_seconds || ' seconds')::INTERVAL
            THEN 1
            ELSE rate_limits.count + 1
        END,
        window_start = CASE
            WHEN rate_limits.window_start < NOW() - (window_seconds || ' seconds')::INTERVAL
            THEN NOW()
            ELSE rate_limits.window_start
        END
    RETURNING count, rate_limits.window_start INTO current_count, window_start;

    -- Check if over limit
    RETURN current_count <= max_requests;
END;
$$;

COMMENT ON FUNCTION check_rate_limit IS
    'Check if a rate limit has been exceeded. Returns TRUE if allowed, FALSE if rate limited.';

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION check_rate_limit TO authenticated;

-- =============================================
-- 7. Security audit log for sensitive operations
-- =============================================

CREATE TABLE IF NOT EXISTS security_audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type TEXT NOT NULL,
    user_id UUID,
    organization_id UUID,
    ip_address INET,
    user_agent TEXT,
    details JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for querying
CREATE INDEX IF NOT EXISTS idx_security_audit_event_type ON security_audit_log(event_type);
CREATE INDEX IF NOT EXISTS idx_security_audit_user ON security_audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_security_audit_org ON security_audit_log(organization_id);
CREATE INDEX IF NOT EXISTS idx_security_audit_created ON security_audit_log(created_at);

-- Enable RLS (only service role can access)
ALTER TABLE security_audit_log ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE security_audit_log IS
    'Audit log for security-sensitive operations. Only accessible via service role.';
