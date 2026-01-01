-- ============================================================
-- SECURITY: OAuth Token Encryption at Rest
-- This migration adds encrypted storage for OAuth tokens
-- ============================================================

-- ============================================================
-- 1. ENABLE PGCRYPTO EXTENSION
-- ============================================================
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ============================================================
-- 2. CREATE RATE LIMIT TRACKER TABLE
-- Used by Edge Functions for rate limiting
-- ============================================================
CREATE TABLE IF NOT EXISTS rate_limit_tracker (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    endpoint TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- Indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_rate_limit_user_endpoint ON rate_limit_tracker(user_id, endpoint);
CREATE INDEX IF NOT EXISTS idx_rate_limit_created ON rate_limit_tracker(created_at);

-- Enable RLS
ALTER TABLE rate_limit_tracker ENABLE ROW LEVEL SECURITY;

-- Allow edge functions to insert (service role bypasses RLS)
-- No user-facing policies needed - only service role accesses this

-- ============================================================
-- 3. ADD ENCRYPTED TOKEN COLUMNS TO GOOGLE CONNECTIONS
-- ============================================================
ALTER TABLE google_connections
    ADD COLUMN IF NOT EXISTS access_token_encrypted BYTEA,
    ADD COLUMN IF NOT EXISTS refresh_token_encrypted BYTEA;

-- ============================================================
-- 4. ADD ENCRYPTED TOKEN COLUMNS TO MICROSOFT CONNECTIONS
-- ============================================================
ALTER TABLE microsoft_connections
    ADD COLUMN IF NOT EXISTS access_token_encrypted BYTEA,
    ADD COLUMN IF NOT EXISTS refresh_token_encrypted BYTEA;

-- ============================================================
-- 5. CREATE ENCRYPTION HELPER FUNCTION
-- Uses pgp_sym_encrypt with key from app settings
-- Key must be set via: ALTER DATABASE your_db SET app.encryption_key = 'your-secret-key';
-- Or via Supabase Vault/Secrets
-- ============================================================
CREATE OR REPLACE FUNCTION encrypt_token(token_text TEXT)
RETURNS BYTEA AS $$
DECLARE
    encryption_key TEXT;
BEGIN
    -- Get encryption key from database settings or environment
    encryption_key := current_setting('app.encryption_key', true);

    IF encryption_key IS NULL OR encryption_key = '' THEN
        -- Fallback: Use a default key (NOT recommended for production)
        -- In production, always set app.encryption_key
        RAISE WARNING 'No encryption key set. Using fallback. Set app.encryption_key in production!';
        encryption_key := 'productionos-default-key-change-me';
    END IF;

    RETURN pgp_sym_encrypt(token_text, encryption_key);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- 6. CREATE DECRYPTION HELPER FUNCTION
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

    IF encryption_key IS NULL OR encryption_key = '' THEN
        encryption_key := 'productionos-default-key-change-me';
    END IF;

    RETURN pgp_sym_decrypt(encrypted_token, encryption_key);
EXCEPTION
    WHEN OTHERS THEN
        RAISE WARNING 'Token decryption failed: %', SQLERRM;
        RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- 7. MIGRATE EXISTING TOKENS (if any)
-- This encrypts existing plaintext tokens
-- ============================================================
-- Google tokens
UPDATE google_connections
SET
    access_token_encrypted = encrypt_token(access_token),
    refresh_token_encrypted = encrypt_token(refresh_token)
WHERE access_token IS NOT NULL
  AND access_token_encrypted IS NULL;

-- Microsoft tokens
UPDATE microsoft_connections
SET
    access_token_encrypted = encrypt_token(access_token),
    refresh_token_encrypted = encrypt_token(refresh_token)
WHERE access_token IS NOT NULL
  AND access_token_encrypted IS NULL;

-- ============================================================
-- 8. CREATE VIEWS FOR DECRYPTED ACCESS
-- Edge functions can use these views instead of raw tables
-- ============================================================
CREATE OR REPLACE VIEW google_connections_decrypted AS
SELECT
    id,
    user_id,
    organization_id,
    email,
    decrypt_token(access_token_encrypted) as access_token,
    decrypt_token(refresh_token_encrypted) as refresh_token,
    token_expires_at,
    scope,
    created_at,
    updated_at
FROM google_connections;

CREATE OR REPLACE VIEW microsoft_connections_decrypted AS
SELECT
    id,
    user_id,
    organization_id,
    email,
    decrypt_token(access_token_encrypted) as access_token,
    decrypt_token(refresh_token_encrypted) as refresh_token,
    token_expires_at,
    scope,
    created_at,
    updated_at
FROM microsoft_connections;

-- ============================================================
-- SECURITY NOTES:
-- 1. Set encryption key in production:
--    ALTER DATABASE productionos SET app.encryption_key = 'your-32-char-secure-key';
-- 2. Or use Supabase Vault for key management
-- 3. After verifying encryption works, optionally drop plaintext columns:
--    ALTER TABLE google_connections DROP COLUMN access_token, DROP COLUMN refresh_token;
--    ALTER TABLE microsoft_connections DROP COLUMN access_token, DROP COLUMN refresh_token;
-- ============================================================
