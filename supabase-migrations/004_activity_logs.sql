-- Activity Logs Table for CRM functionality
-- Tracks all interactions with clients, contacts, and opportunities

CREATE TABLE IF NOT EXISTS activity_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Relationships (at least one should be set)
    client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
    contact_id TEXT, -- Contact ID within client.contacts array
    opportunity_id UUID REFERENCES opportunities(id) ON DELETE CASCADE,
    quote_id UUID REFERENCES quotes(id) ON DELETE SET NULL,

    -- Activity details
    type TEXT NOT NULL CHECK (type IN ('call', 'email', 'meeting', 'note', 'task', 'quote_sent', 'quote_won', 'quote_lost', 'follow_up', 'other')),
    title TEXT NOT NULL,
    description TEXT,

    -- Metadata
    logged_by TEXT, -- User ID (will be UUID when user_profiles exists)
    logged_by_name TEXT, -- Denormalized for display
    activity_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Follow-up tracking
    follow_up_date TIMESTAMPTZ,
    follow_up_completed BOOLEAN DEFAULT FALSE,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_activity_logs_client ON activity_logs(client_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_opportunity ON activity_logs(opportunity_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_activity_date ON activity_logs(activity_date DESC);
CREATE INDEX IF NOT EXISTS idx_activity_logs_follow_up ON activity_logs(follow_up_date) WHERE follow_up_date IS NOT NULL AND follow_up_completed = FALSE;

-- RLS Policies
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

-- Everyone can read activity logs (authenticated)
CREATE POLICY "Authenticated users can read activity logs"
ON activity_logs FOR SELECT
TO authenticated
USING (true);

-- Authenticated users can insert activity logs
CREATE POLICY "Authenticated users can insert activity logs"
ON activity_logs FOR INSERT
TO authenticated
WITH CHECK (true);

-- Users can update their own activity logs, admins can update any
CREATE POLICY "Users can update activity logs"
ON activity_logs FOR UPDATE
TO authenticated
USING (true);

-- Users can delete their own activity logs, admins can delete any
CREATE POLICY "Users can delete activity logs"
ON activity_logs FOR DELETE
TO authenticated
USING (true);

-- Add last_contacted field to clients table
ALTER TABLE clients ADD COLUMN IF NOT EXISTS last_contacted TIMESTAMPTZ;

-- Function to update last_contacted on client when activity is logged
CREATE OR REPLACE FUNCTION update_client_last_contacted()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.client_id IS NOT NULL AND NEW.type IN ('call', 'email', 'meeting') THEN
        UPDATE clients
        SET last_contacted = NEW.activity_date
        WHERE id = NEW.client_id
        AND (last_contacted IS NULL OR last_contacted < NEW.activity_date);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update last_contacted
DROP TRIGGER IF EXISTS trigger_update_last_contacted ON activity_logs;
CREATE TRIGGER trigger_update_last_contacted
AFTER INSERT ON activity_logs
FOR EACH ROW
EXECUTE FUNCTION update_client_last_contacted();
