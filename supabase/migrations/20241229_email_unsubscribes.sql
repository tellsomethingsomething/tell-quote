-- Email Unsubscribes table - global unsubscribe list
CREATE TABLE IF NOT EXISTS email_unsubscribes (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    email text NOT NULL UNIQUE,
    unsubscribed_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    source text, -- 'sequence', 'manual', 'bounce', etc.
    source_id uuid, -- sequence_id or campaign_id
    reason text, -- optional reason provided by user
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Index for quick lookup
CREATE INDEX IF NOT EXISTS email_unsubscribes_email_idx ON email_unsubscribes(email);

-- RLS policies
ALTER TABLE email_unsubscribes ENABLE ROW LEVEL SECURITY;

-- Service role can manage unsubscribes
CREATE POLICY "Service role manages unsubscribes"
    ON email_unsubscribes FOR ALL
    USING (true)
    WITH CHECK (true);

-- Add error column to email_sequence_sends if not exists
ALTER TABLE email_sequence_sends
ADD COLUMN IF NOT EXISTS error text;

-- Add opened/clicked tracking columns if not exist
ALTER TABLE email_sequence_sends
ADD COLUMN IF NOT EXISTS opened_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS clicked_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS replied_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS bounced_at timestamp with time zone;

-- Function to check if email is unsubscribed
CREATE OR REPLACE FUNCTION is_email_unsubscribed(check_email text)
RETURNS boolean AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM email_unsubscribes
        WHERE email = check_email
    );
END;
$$ LANGUAGE plpgsql;

-- Grant permissions
GRANT SELECT ON email_unsubscribes TO authenticated;
GRANT ALL ON email_unsubscribes TO service_role;
GRANT EXECUTE ON FUNCTION is_email_unsubscribed TO service_role;
