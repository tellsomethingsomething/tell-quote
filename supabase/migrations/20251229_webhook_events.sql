-- ============================================================
-- WEBHOOK EVENTS TABLE
-- For logging and idempotency of Stripe webhook events
-- ============================================================

CREATE TABLE IF NOT EXISTS webhook_events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    stripe_event_id TEXT UNIQUE NOT NULL,
    event_type TEXT NOT NULL,
    organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,

    -- Processing status
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'skipped')),
    processed_at TIMESTAMPTZ,
    error_message TEXT,
    retry_count INTEGER DEFAULT 0,

    -- Event data (for debugging and replay)
    payload JSONB,

    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_webhook_events_stripe_id ON webhook_events(stripe_event_id);
CREATE INDEX IF NOT EXISTS idx_webhook_events_type ON webhook_events(event_type);
CREATE INDEX IF NOT EXISTS idx_webhook_events_status ON webhook_events(status);
CREATE INDEX IF NOT EXISTS idx_webhook_events_org ON webhook_events(organization_id);
CREATE INDEX IF NOT EXISTS idx_webhook_events_created ON webhook_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_webhook_events_failed ON webhook_events(status, retry_count) WHERE status = 'failed';

-- Enable RLS
ALTER TABLE webhook_events ENABLE ROW LEVEL SECURITY;

-- Only service role can access webhook events (not user-accessible)
DROP POLICY IF EXISTS "Service role only" ON webhook_events;
CREATE POLICY "Service role only" ON webhook_events
    FOR ALL USING (auth.role() = 'service_role');

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_webhook_events_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS webhook_events_updated_at ON webhook_events;
CREATE TRIGGER webhook_events_updated_at
    BEFORE UPDATE ON webhook_events
    FOR EACH ROW
    EXECUTE FUNCTION update_webhook_events_updated_at();

-- ============================================================
-- VIEWS FOR ADMIN MONITORING
-- ============================================================

-- Summary of webhook events by type and status (last 24 hours)
CREATE OR REPLACE VIEW webhook_event_summary AS
SELECT
    event_type,
    status,
    COUNT(*) as count,
    MAX(created_at) as latest_event
FROM webhook_events
WHERE created_at > NOW() - INTERVAL '24 hours'
GROUP BY event_type, status
ORDER BY count DESC;

-- Failed events that may need attention
CREATE OR REPLACE VIEW webhook_events_failed AS
SELECT
    id,
    stripe_event_id,
    event_type,
    organization_id,
    error_message,
    retry_count,
    created_at
FROM webhook_events
WHERE status = 'failed'
    AND retry_count < 3
    AND created_at > NOW() - INTERVAL '7 days'
ORDER BY created_at DESC;

-- ============================================================
-- HELPER FUNCTIONS
-- ============================================================

-- Increment retry count for a webhook event
CREATE OR REPLACE FUNCTION increment_webhook_retry_count(p_stripe_event_id TEXT)
RETURNS void AS $$
BEGIN
    UPDATE webhook_events
    SET retry_count = retry_count + 1,
        updated_at = NOW()
    WHERE stripe_event_id = p_stripe_event_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to service role
GRANT EXECUTE ON FUNCTION increment_webhook_retry_count(TEXT) TO service_role;
