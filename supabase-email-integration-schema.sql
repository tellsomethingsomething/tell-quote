-- Email Integration Schema for ProductionOS CRM
-- Supports Google Gmail integration with contact/client linking

-- ============================================================
-- GOOGLE INTEGRATION CONNECTIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS google_connections (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid NOT NULL, -- Links to auth.users or user_profiles

    -- OAuth Tokens (encrypted in production)
    access_token text,
    refresh_token text,
    token_expires_at timestamp with time zone,

    -- Google Account Info
    google_email text NOT NULL,
    google_user_id text,
    google_name text,
    google_picture text,

    -- Scopes granted
    scopes text[] DEFAULT '{}',

    -- Sync settings
    sync_enabled boolean DEFAULT true,
    last_sync_at timestamp with time zone,
    sync_from_date date, -- Only sync emails after this date

    -- Status
    status text DEFAULT 'active' CHECK (status IN ('active', 'disconnected', 'error', 'reauth_required')),
    error_message text,

    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,

    UNIQUE(user_id, google_email)
);

-- ============================================================
-- EMAIL THREADS
-- ============================================================
CREATE TABLE IF NOT EXISTS email_threads (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,

    -- Google IDs
    google_thread_id text UNIQUE NOT NULL,
    google_history_id text,

    -- Thread metadata
    subject text,
    snippet text, -- Preview text

    -- Participants (denormalized for fast queries)
    participants jsonb DEFAULT '[]', -- [{email, name}]

    -- Linked entities
    client_id uuid, -- Link to clients table
    contact_id uuid, -- Link to contacts table
    project_id uuid, -- Link to projects table
    opportunity_id uuid, -- Link to opportunities table

    -- Counts
    message_count int DEFAULT 0,
    unread_count int DEFAULT 0,
    attachment_count int DEFAULT 0,

    -- Flags
    is_starred boolean DEFAULT false,
    is_important boolean DEFAULT false,
    is_archived boolean DEFAULT false,
    is_trash boolean DEFAULT false,
    is_spam boolean DEFAULT false,

    -- Labels
    labels text[] DEFAULT '{}',

    -- Dates
    last_message_at timestamp with time zone,
    first_message_at timestamp with time zone,

    -- Ownership
    user_id uuid NOT NULL, -- Which user synced this
    connection_id uuid REFERENCES google_connections(id) ON DELETE CASCADE,

    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ============================================================
-- EMAIL MESSAGES
-- ============================================================
CREATE TABLE IF NOT EXISTS email_messages (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    thread_id uuid REFERENCES email_threads(id) ON DELETE CASCADE NOT NULL,

    -- Google IDs
    google_message_id text UNIQUE NOT NULL,

    -- Sender
    from_email text NOT NULL,
    from_name text,

    -- Recipients
    to_emails jsonb DEFAULT '[]', -- [{email, name}]
    cc_emails jsonb DEFAULT '[]',
    bcc_emails jsonb DEFAULT '[]',
    reply_to text,

    -- Content
    subject text,
    body_text text, -- Plain text version
    body_html text, -- HTML version
    snippet text, -- Preview

    -- Headers
    message_id_header text, -- RFC 2822 Message-ID
    in_reply_to text,
    references_header text,

    -- Flags
    is_read boolean DEFAULT false,
    is_starred boolean DEFAULT false,
    is_draft boolean DEFAULT false,
    is_sent boolean DEFAULT false, -- True if we sent it

    -- Labels
    labels text[] DEFAULT '{}',

    -- Dates
    internal_date timestamp with time zone, -- Gmail internal date
    sent_at timestamp with time zone,
    received_at timestamp with time zone,

    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ============================================================
-- EMAIL ATTACHMENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS email_attachments (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    message_id uuid REFERENCES email_messages(id) ON DELETE CASCADE NOT NULL,

    -- Google attachment info
    google_attachment_id text,

    -- File info
    filename text NOT NULL,
    mime_type text,
    size_bytes bigint,

    -- Storage (if downloaded)
    storage_path text,
    storage_url text,
    is_downloaded boolean DEFAULT false,

    -- Content ID for inline images
    content_id text,
    is_inline boolean DEFAULT false,

    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ============================================================
-- EMAIL DRAFTS (for composing)
-- ============================================================
CREATE TABLE IF NOT EXISTS email_drafts (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid NOT NULL,
    connection_id uuid REFERENCES google_connections(id) ON DELETE CASCADE,

    -- Google draft ID (if saved to Gmail)
    google_draft_id text,
    google_message_id text,

    -- Reply context
    in_reply_to_message_id uuid REFERENCES email_messages(id) ON DELETE SET NULL,
    thread_id uuid REFERENCES email_threads(id) ON DELETE SET NULL,

    -- Recipients
    to_emails jsonb DEFAULT '[]',
    cc_emails jsonb DEFAULT '[]',
    bcc_emails jsonb DEFAULT '[]',

    -- Content
    subject text,
    body_html text,
    body_text text,

    -- Attachments (pending upload)
    attachments jsonb DEFAULT '[]', -- [{filename, size, mimeType, localPath}]

    -- Linked entities
    client_id uuid,
    contact_id uuid,
    project_id uuid,
    opportunity_id uuid,
    quote_id uuid,

    -- Status
    status text DEFAULT 'draft' CHECK (status IN ('draft', 'sending', 'sent', 'failed')),
    error_message text,
    sent_at timestamp with time zone,

    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ============================================================
-- EMAIL-ENTITY LINKS (many-to-many)
-- ============================================================
CREATE TABLE IF NOT EXISTS email_entity_links (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,

    -- Email reference
    thread_id uuid REFERENCES email_threads(id) ON DELETE CASCADE,
    message_id uuid REFERENCES email_messages(id) ON DELETE CASCADE,

    -- Entity reference (one of these will be set)
    entity_type text NOT NULL CHECK (entity_type IN ('client', 'contact', 'project', 'opportunity', 'quote', 'invoice', 'contract', 'purchase_order')),
    entity_id uuid NOT NULL,

    -- Link metadata
    link_type text DEFAULT 'manual' CHECK (link_type IN ('auto', 'manual')), -- How it was linked
    linked_by uuid, -- User who created manual link
    confidence_score numeric(3,2), -- For auto-links (0.00 to 1.00)

    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,

    -- Ensure we link to either thread or message, not both
    CHECK ((thread_id IS NOT NULL AND message_id IS NULL) OR (thread_id IS NULL AND message_id IS NOT NULL))
);

-- ============================================================
-- EMAIL SYNC QUEUE
-- ============================================================
CREATE TABLE IF NOT EXISTS email_sync_queue (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    connection_id uuid REFERENCES google_connections(id) ON DELETE CASCADE NOT NULL,

    -- Sync type
    sync_type text NOT NULL CHECK (sync_type IN ('full', 'incremental', 'thread', 'message')),

    -- Target (for specific syncs)
    google_thread_id text,
    google_message_id text,

    -- Status
    status text DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    priority int DEFAULT 0, -- Higher = more urgent

    -- Tracking
    attempts int DEFAULT 0,
    max_attempts int DEFAULT 3,
    last_attempt_at timestamp with time zone,
    error_message text,

    -- Result
    messages_synced int DEFAULT 0,
    threads_synced int DEFAULT 0,
    completed_at timestamp with time zone,

    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_google_connections_user ON google_connections(user_id);
CREATE INDEX IF NOT EXISTS idx_google_connections_email ON google_connections(google_email);

CREATE INDEX IF NOT EXISTS idx_email_threads_user ON email_threads(user_id);
CREATE INDEX IF NOT EXISTS idx_email_threads_client ON email_threads(client_id);
CREATE INDEX IF NOT EXISTS idx_email_threads_contact ON email_threads(contact_id);
CREATE INDEX IF NOT EXISTS idx_email_threads_project ON email_threads(project_id);
CREATE INDEX IF NOT EXISTS idx_email_threads_last_message ON email_threads(last_message_at DESC);
CREATE INDEX IF NOT EXISTS idx_email_threads_google_thread ON email_threads(google_thread_id);

CREATE INDEX IF NOT EXISTS idx_email_messages_thread ON email_messages(thread_id);
CREATE INDEX IF NOT EXISTS idx_email_messages_google_id ON email_messages(google_message_id);
CREATE INDEX IF NOT EXISTS idx_email_messages_from ON email_messages(from_email);
CREATE INDEX IF NOT EXISTS idx_email_messages_date ON email_messages(sent_at DESC);

CREATE INDEX IF NOT EXISTS idx_email_attachments_message ON email_attachments(message_id);

CREATE INDEX IF NOT EXISTS idx_email_drafts_user ON email_drafts(user_id);
CREATE INDEX IF NOT EXISTS idx_email_drafts_thread ON email_drafts(thread_id);

CREATE INDEX IF NOT EXISTS idx_email_entity_links_thread ON email_entity_links(thread_id);
CREATE INDEX IF NOT EXISTS idx_email_entity_links_message ON email_entity_links(message_id);
CREATE INDEX IF NOT EXISTS idx_email_entity_links_entity ON email_entity_links(entity_type, entity_id);

CREATE INDEX IF NOT EXISTS idx_email_sync_queue_connection ON email_sync_queue(connection_id);
CREATE INDEX IF NOT EXISTS idx_email_sync_queue_status ON email_sync_queue(status, priority DESC);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
ALTER TABLE google_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_drafts ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_entity_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_sync_queue ENABLE ROW LEVEL SECURITY;

-- Policies (internal tool - allow all for authenticated)
DROP POLICY IF EXISTS "Allow all google_connections" ON google_connections;
CREATE POLICY "Allow all google_connections" ON google_connections FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all email_threads" ON email_threads;
CREATE POLICY "Allow all email_threads" ON email_threads FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all email_messages" ON email_messages;
CREATE POLICY "Allow all email_messages" ON email_messages FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all email_attachments" ON email_attachments;
CREATE POLICY "Allow all email_attachments" ON email_attachments FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all email_drafts" ON email_drafts;
CREATE POLICY "Allow all email_drafts" ON email_drafts FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all email_entity_links" ON email_entity_links;
CREATE POLICY "Allow all email_entity_links" ON email_entity_links FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all email_sync_queue" ON email_sync_queue;
CREATE POLICY "Allow all email_sync_queue" ON email_sync_queue FOR ALL USING (true) WITH CHECK (true);

-- ============================================================
-- UPDATE TRIGGERS
-- ============================================================
CREATE OR REPLACE FUNCTION update_email_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_google_connections_updated_at ON google_connections;
CREATE TRIGGER update_google_connections_updated_at
    BEFORE UPDATE ON google_connections
    FOR EACH ROW
    EXECUTE FUNCTION update_email_updated_at();

DROP TRIGGER IF EXISTS update_email_threads_updated_at ON email_threads;
CREATE TRIGGER update_email_threads_updated_at
    BEFORE UPDATE ON email_threads
    FOR EACH ROW
    EXECUTE FUNCTION update_email_updated_at();

DROP TRIGGER IF EXISTS update_email_drafts_updated_at ON email_drafts;
CREATE TRIGGER update_email_drafts_updated_at
    BEFORE UPDATE ON email_drafts
    FOR EACH ROW
    EXECUTE FUNCTION update_email_updated_at();

-- ============================================================
-- HELPER FUNCTIONS
-- ============================================================

-- Function to auto-link emails to contacts based on email address
CREATE OR REPLACE FUNCTION auto_link_email_to_contacts()
RETURNS TRIGGER AS $$
BEGIN
    -- Try to find matching contacts for participants
    INSERT INTO email_entity_links (thread_id, entity_type, entity_id, link_type, confidence_score)
    SELECT
        NEW.id,
        'contact',
        c.id,
        'auto',
        1.00
    FROM contacts c
    WHERE c.email = ANY(
        SELECT jsonb_array_elements_text(NEW.participants::jsonb -> 'email')
    )
    ON CONFLICT DO NOTHING;

    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to auto-link on thread creation (disabled by default - enable when contacts table exists)
-- CREATE TRIGGER auto_link_email_thread
--     AFTER INSERT ON email_threads
--     FOR EACH ROW
--     EXECUTE FUNCTION auto_link_email_to_contacts();
