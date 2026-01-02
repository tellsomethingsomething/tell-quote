-- ============================================================
-- SECURITY HARDENING: Remove Default Encryption Key Fallback
-- Critical security fix - encryption MUST fail if no key configured
-- ============================================================

-- ============================================================
-- 1. FIX ENCRYPT_TOKEN FUNCTION - Remove fallback key
-- ============================================================
CREATE OR REPLACE FUNCTION encrypt_token(token_text TEXT)
RETURNS BYTEA AS $$
DECLARE
    encryption_key TEXT;
BEGIN
    IF token_text IS NULL THEN
        RETURN NULL;
    END IF;

    -- Get encryption key from database settings
    encryption_key := current_setting('app.encryption_key', true);

    -- SECURITY: Fail if no encryption key configured
    -- This prevents accidental plaintext storage or weak encryption
    IF encryption_key IS NULL OR encryption_key = '' THEN
        RAISE EXCEPTION 'SECURITY ERROR: app.encryption_key is not configured. Set via ALTER DATABASE or Supabase Vault.';
    END IF;

    -- Validate key length (minimum 32 characters for security)
    IF LENGTH(encryption_key) < 32 THEN
        RAISE EXCEPTION 'SECURITY ERROR: app.encryption_key must be at least 32 characters';
    END IF;

    RETURN pgp_sym_encrypt(token_text, encryption_key);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- 2. FIX DECRYPT_TOKEN FUNCTION - Remove fallback key
-- ============================================================
CREATE OR REPLACE FUNCTION decrypt_token(encrypted_token BYTEA)
RETURNS TEXT AS $$
DECLARE
    encryption_key TEXT;
BEGIN
    IF encrypted_token IS NULL THEN
        RETURN NULL;
    END IF;

    encryption_key := current_setting('app.encryption_key', true);

    -- SECURITY: Fail if no encryption key configured
    IF encryption_key IS NULL OR encryption_key = '' THEN
        RAISE EXCEPTION 'SECURITY ERROR: app.encryption_key is not configured';
    END IF;

    RETURN pgp_sym_decrypt(encrypted_token, encryption_key);
EXCEPTION
    WHEN OTHERS THEN
        -- Log error but don't expose details
        RAISE WARNING 'Token decryption failed - check encryption key configuration';
        RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- 3. DROP PLAINTEXT TOKEN COLUMNS (After encryption migration)
-- These columns should no longer be used
-- ============================================================
-- First check if plaintext columns exist before dropping
DO $$
BEGIN
    -- Drop from google_connections if exists
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'google_connections'
        AND column_name = 'access_token'
    ) THEN
        ALTER TABLE google_connections DROP COLUMN IF EXISTS access_token;
        ALTER TABLE google_connections DROP COLUMN IF EXISTS refresh_token;
        RAISE NOTICE 'Dropped plaintext token columns from google_connections';
    END IF;

    -- Drop from microsoft_connections if exists
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'microsoft_connections'
        AND column_name = 'access_token'
    ) THEN
        ALTER TABLE microsoft_connections DROP COLUMN IF EXISTS access_token;
        ALTER TABLE microsoft_connections DROP COLUMN IF EXISTS refresh_token;
        RAISE NOTICE 'Dropped plaintext token columns from microsoft_connections';
    END IF;
END $$;

-- ============================================================
-- 4. ADD ORGANIZATION_ID TO ACTIVITIES TABLE (if missing)
-- Ensures proper multi-tenant isolation
-- ============================================================
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'activities'
        AND column_name = 'organization_id'
    ) THEN
        ALTER TABLE activities ADD COLUMN organization_id UUID REFERENCES organizations(id);

        -- Backfill from user's organization
        UPDATE activities a
        SET organization_id = up.organization_id
        FROM user_profiles up
        WHERE a.user_id = up.id
        AND a.organization_id IS NULL;

        -- Create RLS policy
        DROP POLICY IF EXISTS "activities_org_isolation" ON activities;
        CREATE POLICY "activities_org_isolation" ON activities
            FOR ALL
            USING (
                organization_id = (
                    SELECT organization_id FROM user_profiles WHERE id = auth.uid()
                )
            );

        RAISE NOTICE 'Added organization_id to activities table with RLS';
    END IF;
END $$;

-- ============================================================
-- 5. ADD ORGANIZATION_ID TO INVOICES TABLE (if missing)
-- ============================================================
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'invoices'
        AND column_name = 'organization_id'
    ) THEN
        ALTER TABLE invoices ADD COLUMN organization_id UUID REFERENCES organizations(id);

        -- Backfill from user's organization
        UPDATE invoices i
        SET organization_id = up.organization_id
        FROM user_profiles up
        WHERE i.user_id = up.id
        AND i.organization_id IS NULL;

        -- Create RLS policy
        DROP POLICY IF EXISTS "invoices_org_isolation" ON invoices;
        CREATE POLICY "invoices_org_isolation" ON invoices
            FOR ALL
            USING (
                organization_id = (
                    SELECT organization_id FROM user_profiles WHERE id = auth.uid()
                )
            );

        RAISE NOTICE 'Added organization_id to invoices table with RLS';
    END IF;
END $$;

-- ============================================================
-- 6. CREATE LOGIN RATE LIMITING FUNCTION
-- Server-side protection against brute force attacks
-- ============================================================
CREATE TABLE IF NOT EXISTS login_attempts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email TEXT NOT NULL,
    ip_address TEXT,
    success BOOLEAN DEFAULT FALSE,
    attempted_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_login_attempts_email ON login_attempts(email, attempted_at);
CREATE INDEX IF NOT EXISTS idx_login_attempts_ip ON login_attempts(ip_address, attempted_at);

-- Function to check login rate limit
CREATE OR REPLACE FUNCTION check_login_rate_limit(
    p_email TEXT,
    p_ip_address TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    failed_attempts_email INTEGER;
    failed_attempts_ip INTEGER;
    lockout_duration INTERVAL := INTERVAL '15 minutes';
    max_attempts INTEGER := 5;
    window_start TIMESTAMP WITH TIME ZONE;
BEGIN
    window_start := NOW() - lockout_duration;

    -- Count failed attempts by email
    SELECT COUNT(*) INTO failed_attempts_email
    FROM login_attempts
    WHERE email = p_email
    AND success = FALSE
    AND attempted_at > window_start;

    -- Count failed attempts by IP (if provided)
    IF p_ip_address IS NOT NULL THEN
        SELECT COUNT(*) INTO failed_attempts_ip
        FROM login_attempts
        WHERE ip_address = p_ip_address
        AND success = FALSE
        AND attempted_at > window_start;
    ELSE
        failed_attempts_ip := 0;
    END IF;

    -- Check if locked out
    IF failed_attempts_email >= max_attempts THEN
        RETURN jsonb_build_object(
            'allowed', FALSE,
            'reason', 'too_many_attempts_email',
            'remaining_attempts', 0,
            'lockout_until', (SELECT MAX(attempted_at) + lockout_duration FROM login_attempts WHERE email = p_email AND success = FALSE AND attempted_at > window_start)
        );
    END IF;

    IF failed_attempts_ip >= (max_attempts * 2) THEN
        RETURN jsonb_build_object(
            'allowed', FALSE,
            'reason', 'too_many_attempts_ip',
            'remaining_attempts', 0,
            'lockout_until', NOW() + lockout_duration
        );
    END IF;

    RETURN jsonb_build_object(
        'allowed', TRUE,
        'remaining_attempts', max_attempts - failed_attempts_email
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to record login attempt
CREATE OR REPLACE FUNCTION record_login_attempt(
    p_email TEXT,
    p_ip_address TEXT DEFAULT NULL,
    p_success BOOLEAN DEFAULT FALSE
)
RETURNS VOID AS $$
BEGIN
    INSERT INTO login_attempts (email, ip_address, success, attempted_at)
    VALUES (p_email, p_ip_address, p_success, NOW());

    -- Clean up old records (older than 24 hours)
    DELETE FROM login_attempts WHERE attempted_at < NOW() - INTERVAL '24 hours';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- SECURITY NOTES:
-- 1. Encryption key MUST be set before using encrypt_token:
--    ALTER DATABASE productionos SET app.encryption_key = 'your-secure-32-char-minimum-key';
-- 2. Run this migration in a transaction with rollback capability
-- 3. Test encryption/decryption after deploying
-- ============================================================
