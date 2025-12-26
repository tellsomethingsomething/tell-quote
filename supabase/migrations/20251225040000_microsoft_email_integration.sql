-- Microsoft Outlook/Office 365 Email Integration
-- Uses Microsoft Graph API for email access

-- ============================================================
-- MICROSOFT CONNECTIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS microsoft_connections (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid NOT NULL,

    -- OAuth Tokens
    access_token text,
    refresh_token text,
    token_expires_at timestamp with time zone,

    -- Microsoft Account Info
    microsoft_email text NOT NULL,
    microsoft_user_id text,
    microsoft_name text,
    microsoft_picture text,

    -- Scopes granted
    scopes text[] DEFAULT '{}',

    -- Sync settings
    sync_enabled boolean DEFAULT true,
    last_sync_at timestamp with time zone,
    sync_from_date date,

    -- Status
    status text DEFAULT 'active' CHECK (status IN ('active', 'disconnected', 'error', 'reauth_required')),
    error_message text,

    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,

    UNIQUE(user_id, microsoft_email)
);

-- ============================================================
-- ADD PROVIDER SUPPORT TO EMAIL TABLES
-- ============================================================

-- Add provider column to email_threads
ALTER TABLE email_threads ADD COLUMN IF NOT EXISTS provider text DEFAULT 'google' CHECK (provider IN ('google', 'microsoft'));
ALTER TABLE email_threads ADD COLUMN IF NOT EXISTS provider_thread_id text;
ALTER TABLE email_threads ADD COLUMN IF NOT EXISTS microsoft_connection_id uuid REFERENCES microsoft_connections(id) ON DELETE CASCADE;

-- Migrate existing google_thread_id to provider_thread_id
UPDATE email_threads SET provider_thread_id = google_thread_id WHERE provider_thread_id IS NULL AND google_thread_id IS NOT NULL;

-- Add provider column to email_messages
ALTER TABLE email_messages ADD COLUMN IF NOT EXISTS provider text DEFAULT 'google' CHECK (provider IN ('google', 'microsoft'));
ALTER TABLE email_messages ADD COLUMN IF NOT EXISTS provider_message_id text;

-- Migrate existing google_message_id to provider_message_id
UPDATE email_messages SET provider_message_id = google_message_id WHERE provider_message_id IS NULL AND google_message_id IS NOT NULL;

-- Add provider column to email_attachments
ALTER TABLE email_attachments ADD COLUMN IF NOT EXISTS provider text DEFAULT 'google' CHECK (provider IN ('google', 'microsoft'));
ALTER TABLE email_attachments ADD COLUMN IF NOT EXISTS provider_attachment_id text;

-- Migrate existing google_attachment_id
UPDATE email_attachments SET provider_attachment_id = google_attachment_id WHERE provider_attachment_id IS NULL AND google_attachment_id IS NOT NULL;

-- Add provider column to email_drafts
ALTER TABLE email_drafts ADD COLUMN IF NOT EXISTS provider text DEFAULT 'google' CHECK (provider IN ('google', 'microsoft'));
ALTER TABLE email_drafts ADD COLUMN IF NOT EXISTS microsoft_connection_id uuid REFERENCES microsoft_connections(id) ON DELETE CASCADE;
ALTER TABLE email_drafts ADD COLUMN IF NOT EXISTS provider_draft_id text;
ALTER TABLE email_drafts ADD COLUMN IF NOT EXISTS provider_message_id text;

-- ============================================================
-- INDEXES FOR MICROSOFT
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_microsoft_connections_user ON microsoft_connections(user_id);
CREATE INDEX IF NOT EXISTS idx_microsoft_connections_email ON microsoft_connections(microsoft_email);

CREATE INDEX IF NOT EXISTS idx_email_threads_provider ON email_threads(provider);
CREATE INDEX IF NOT EXISTS idx_email_threads_provider_thread ON email_threads(provider, provider_thread_id);
CREATE INDEX IF NOT EXISTS idx_email_threads_microsoft_connection ON email_threads(microsoft_connection_id);

CREATE INDEX IF NOT EXISTS idx_email_messages_provider ON email_messages(provider);
CREATE INDEX IF NOT EXISTS idx_email_messages_provider_message ON email_messages(provider, provider_message_id);

-- ============================================================
-- ROW LEVEL SECURITY FOR MICROSOFT
-- ============================================================
ALTER TABLE microsoft_connections ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all microsoft_connections" ON microsoft_connections;
CREATE POLICY "Allow all microsoft_connections" ON microsoft_connections FOR ALL USING (true) WITH CHECK (true);

-- ============================================================
-- UPDATE TRIGGER FOR MICROSOFT CONNECTIONS
-- ============================================================
DROP TRIGGER IF EXISTS update_microsoft_connections_updated_at ON microsoft_connections;
CREATE TRIGGER update_microsoft_connections_updated_at
    BEFORE UPDATE ON microsoft_connections
    FOR EACH ROW
    EXECUTE FUNCTION update_email_updated_at();

-- ============================================================
-- MICROSOFT SYNC QUEUE
-- ============================================================
ALTER TABLE email_sync_queue ADD COLUMN IF NOT EXISTS provider text DEFAULT 'google' CHECK (provider IN ('google', 'microsoft'));
ALTER TABLE email_sync_queue ADD COLUMN IF NOT EXISTS microsoft_connection_id uuid REFERENCES microsoft_connections(id) ON DELETE CASCADE;
ALTER TABLE email_sync_queue ADD COLUMN IF NOT EXISTS provider_thread_id text;
ALTER TABLE email_sync_queue ADD COLUMN IF NOT EXISTS provider_message_id text;
