-- CRM Phase 1: Email Templates, Documents, Email Tracking, Lead Scoring
-- ============================================================

-- ============================================================
-- EMAIL TEMPLATES
-- ============================================================
CREATE TABLE IF NOT EXISTS email_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,

    -- Template content
    name VARCHAR(255) NOT NULL,
    subject TEXT,
    body_html TEXT,
    body_text TEXT,

    -- Categorization
    category VARCHAR(50) CHECK (category IN ('quote_followup', 'intro', 'proposal', 'thank_you', 'meeting_request', 'check_in', 'custom')),

    -- Template variables for substitution
    -- e.g., [{name: 'clientName', label: 'Client Name', default: ''}]
    variables JSONB DEFAULT '[]',

    -- Sharing
    is_shared BOOLEAN DEFAULT false,

    -- Analytics
    use_count INTEGER DEFAULT 0,
    last_used_at TIMESTAMPTZ,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Indexes for email_templates
CREATE INDEX IF NOT EXISTS idx_email_templates_user ON email_templates(user_id);
CREATE INDEX IF NOT EXISTS idx_email_templates_category ON email_templates(category);
CREATE INDEX IF NOT EXISTS idx_email_templates_shared ON email_templates(is_shared) WHERE is_shared = true;

-- RLS policies for email_templates
ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own templates and shared templates"
    ON email_templates FOR SELECT
    USING (auth.uid() = user_id OR is_shared = true);

CREATE POLICY "Users can create their own templates"
    ON email_templates FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own templates"
    ON email_templates FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own templates"
    ON email_templates FOR DELETE
    USING (auth.uid() = user_id);

-- ============================================================
-- DOCUMENTS (File attachments)
-- ============================================================
CREATE TABLE IF NOT EXISTS documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,

    -- File info
    filename VARCHAR(255) NOT NULL,
    file_type VARCHAR(100), -- MIME type
    file_size INTEGER, -- bytes
    storage_path TEXT NOT NULL, -- Supabase Storage path

    -- Entity links (can be linked to multiple entities)
    client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
    contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
    opportunity_id UUID REFERENCES opportunities(id) ON DELETE SET NULL,
    quote_id UUID, -- Quotes stored in JSONB, not FK

    -- Metadata
    description TEXT,
    tags JSONB DEFAULT '[]', -- ["contract", "proposal", "invoice"]

    -- Versioning
    version INTEGER DEFAULT 1,
    parent_document_id UUID REFERENCES documents(id) ON DELETE SET NULL,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Indexes for documents
CREATE INDEX IF NOT EXISTS idx_documents_user ON documents(user_id);
CREATE INDEX IF NOT EXISTS idx_documents_client ON documents(client_id);
CREATE INDEX IF NOT EXISTS idx_documents_contact ON documents(contact_id);
CREATE INDEX IF NOT EXISTS idx_documents_opportunity ON documents(opportunity_id);
CREATE INDEX IF NOT EXISTS idx_documents_quote ON documents(quote_id);

-- RLS policies for documents
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own documents"
    ON documents FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create documents"
    ON documents FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own documents"
    ON documents FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own documents"
    ON documents FOR DELETE
    USING (auth.uid() = user_id);

-- ============================================================
-- EMAIL TRACKING
-- ============================================================

-- Add tracking columns to email_messages if not exists
ALTER TABLE email_messages ADD COLUMN IF NOT EXISTS tracking_id UUID UNIQUE DEFAULT gen_random_uuid();
ALTER TABLE email_messages ADD COLUMN IF NOT EXISTS open_count INTEGER DEFAULT 0;
ALTER TABLE email_messages ADD COLUMN IF NOT EXISTS click_count INTEGER DEFAULT 0;
ALTER TABLE email_messages ADD COLUMN IF NOT EXISTS first_opened_at TIMESTAMPTZ;
ALTER TABLE email_messages ADD COLUMN IF NOT EXISTS last_opened_at TIMESTAMPTZ;

-- Email tracking events table
CREATE TABLE IF NOT EXISTS email_tracking_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message_id UUID REFERENCES email_messages(id) ON DELETE CASCADE NOT NULL,
    tracking_id UUID NOT NULL, -- The unique tracking ID from email_messages

    -- Event info
    event_type VARCHAR(20) NOT NULL CHECK (event_type IN ('open', 'click', 'bounce', 'unsubscribe', 'spam_report')),
    recipient_email VARCHAR(255),

    -- For click events
    link_url TEXT,
    link_text TEXT,

    -- Request info
    user_agent TEXT,
    ip_address INET,
    device_type VARCHAR(50), -- 'desktop', 'mobile', 'tablet'
    location JSONB, -- {city, country, region} from IP geolocation

    -- Timestamp
    occurred_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Indexes for email_tracking_events
CREATE INDEX IF NOT EXISTS idx_email_tracking_message ON email_tracking_events(message_id);
CREATE INDEX IF NOT EXISTS idx_email_tracking_tracking_id ON email_tracking_events(tracking_id);
CREATE INDEX IF NOT EXISTS idx_email_tracking_type ON email_tracking_events(event_type);
CREATE INDEX IF NOT EXISTS idx_email_tracking_occurred ON email_tracking_events(occurred_at);

-- RLS policies for email_tracking_events (read-only for users)
ALTER TABLE email_tracking_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view tracking for their messages"
    ON email_tracking_events FOR SELECT
    USING (
        message_id IN (
            SELECT id FROM email_messages
            WHERE user_id = auth.uid()
        )
    );

-- ============================================================
-- LEAD SCORING
-- ============================================================

-- Add lead scoring columns to opportunities
ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS lead_score INTEGER DEFAULT 0;
ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS score_breakdown JSONB DEFAULT '{}';
ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS score_updated_at TIMESTAMPTZ;

-- Lead scoring rules table
CREATE TABLE IF NOT EXISTS lead_scoring_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID, -- NULL = system default rules

    -- Rule definition
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(50) CHECK (category IN ('engagement', 'fit', 'behavior', 'demographic')),

    -- Condition (when to apply)
    -- e.g., {field: 'value', operator: '>=', value: 50000}
    condition JSONB NOT NULL,

    -- Points to add/subtract
    points INTEGER NOT NULL, -- Can be negative

    -- Active status
    is_active BOOLEAN DEFAULT true,

    -- Priority for ordering
    priority INTEGER DEFAULT 0,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Indexes for lead_scoring_rules
CREATE INDEX IF NOT EXISTS idx_lead_scoring_rules_user ON lead_scoring_rules(user_id);
CREATE INDEX IF NOT EXISTS idx_lead_scoring_rules_active ON lead_scoring_rules(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_lead_scoring_rules_category ON lead_scoring_rules(category);

-- RLS policies for lead_scoring_rules
ALTER TABLE lead_scoring_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view system rules and their own rules"
    ON lead_scoring_rules FOR SELECT
    USING (user_id IS NULL OR auth.uid() = user_id);

CREATE POLICY "Users can create their own rules"
    ON lead_scoring_rules FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own rules"
    ON lead_scoring_rules FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own rules"
    ON lead_scoring_rules FOR DELETE
    USING (auth.uid() = user_id);

-- Insert default lead scoring rules
INSERT INTO lead_scoring_rules (user_id, name, description, category, condition, points, priority) VALUES
    (NULL, 'High Value Deal', 'Opportunity value over $50,000', 'fit', '{"field": "value", "operator": ">=", "value": 50000}', 20, 10),
    (NULL, 'Medium Value Deal', 'Opportunity value over $20,000', 'fit', '{"field": "value", "operator": ">=", "value": 20000}', 10, 9),
    (NULL, 'Has Primary Contact', 'Primary contact identified', 'fit', '{"field": "has_primary_contact", "operator": "=", "value": true}', 10, 8),
    (NULL, 'Decision Maker Engaged', 'Decision maker contact exists', 'fit', '{"field": "has_decision_maker", "operator": "=", "value": true}', 20, 7),
    (NULL, 'Recent Meeting', 'Meeting in last 7 days', 'engagement', '{"field": "days_since_meeting", "operator": "<=", "value": 7}', 15, 6),
    (NULL, 'Recent Call', 'Call connected in last 7 days', 'engagement', '{"field": "days_since_call", "operator": "<=", "value": 7}', 10, 5),
    (NULL, 'Quote Sent', 'Quote has been sent', 'behavior', '{"field": "has_quote_sent", "operator": "=", "value": true}', 25, 4),
    (NULL, 'Quote Viewed', 'Quote was viewed', 'behavior', '{"field": "has_quote_viewed", "operator": "=", "value": true}', 15, 3),
    (NULL, 'Stale Opportunity', 'No activity in 14+ days', 'engagement', '{"field": "days_since_activity", "operator": ">=", "value": 14}', -15, 2),
    (NULL, 'Very Stale', 'No activity in 30+ days', 'engagement', '{"field": "days_since_activity", "operator": ">=", "value": 30}', -25, 1)
ON CONFLICT DO NOTHING;

-- ============================================================
-- WORKFLOW AUTOMATION (Basic structure)
-- ============================================================

CREATE TABLE IF NOT EXISTS workflow_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,

    -- Rule info
    name VARCHAR(255) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,

    -- Trigger configuration
    trigger_type VARCHAR(50) NOT NULL CHECK (trigger_type IN (
        'quote_sent', 'quote_expiring', 'quote_accepted', 'quote_rejected',
        'opportunity_created', 'opportunity_stage_change', 'opportunity_won', 'opportunity_lost',
        'no_activity', 'contact_added', 'email_opened', 'email_clicked',
        'task_overdue', 'meeting_scheduled'
    )),
    trigger_config JSONB DEFAULT '{}', -- e.g., {days_before: 7, stage: 'proposal'}

    -- Conditions to check
    conditions JSONB DEFAULT '[]', -- [{field: 'value', operator: '>', value: 10000}]

    -- Actions to take when triggered
    -- e.g., [{type: 'create_task', config: {subject: 'Follow up', due_days: 3}}]
    actions JSONB DEFAULT '[]',

    -- Execution limits
    max_executions_per_entity INTEGER, -- NULL = unlimited
    cooldown_hours INTEGER DEFAULT 0, -- Minimum hours between executions for same entity

    -- Stats
    execution_count INTEGER DEFAULT 0,
    last_executed_at TIMESTAMPTZ,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Workflow executions log
CREATE TABLE IF NOT EXISTS workflow_executions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rule_id UUID REFERENCES workflow_rules(id) ON DELETE CASCADE NOT NULL,

    -- What triggered this
    entity_type VARCHAR(50) NOT NULL, -- 'quote', 'opportunity', 'contact', etc.
    entity_id UUID NOT NULL,

    -- Execution status
    status VARCHAR(20) NOT NULL CHECK (status IN ('pending', 'running', 'completed', 'failed', 'skipped')),

    -- Results
    result JSONB DEFAULT '{}', -- Details of what was created/updated
    error_message TEXT,

    -- Timing
    started_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

-- Indexes for workflow tables
CREATE INDEX IF NOT EXISTS idx_workflow_rules_user ON workflow_rules(user_id);
CREATE INDEX IF NOT EXISTS idx_workflow_rules_active ON workflow_rules(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_workflow_rules_trigger ON workflow_rules(trigger_type);
CREATE INDEX IF NOT EXISTS idx_workflow_executions_rule ON workflow_executions(rule_id);
CREATE INDEX IF NOT EXISTS idx_workflow_executions_entity ON workflow_executions(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_workflow_executions_status ON workflow_executions(status);

-- RLS policies for workflow tables
ALTER TABLE workflow_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_executions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own workflow rules"
    ON workflow_rules FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create workflow rules"
    ON workflow_rules FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own workflow rules"
    ON workflow_rules FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own workflow rules"
    ON workflow_rules FOR DELETE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can view their workflow executions"
    ON workflow_executions FOR SELECT
    USING (
        rule_id IN (SELECT id FROM workflow_rules WHERE user_id = auth.uid())
    );

-- ============================================================
-- CALENDAR EVENTS
-- ============================================================

CREATE TABLE IF NOT EXISTS calendar_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,

    -- Provider info
    provider VARCHAR(20) NOT NULL CHECK (provider IN ('microsoft', 'google', 'local')),
    provider_event_id VARCHAR(255), -- External calendar ID
    provider_connection_id UUID, -- Reference to google_connections or microsoft_connections

    -- Event details
    title VARCHAR(255) NOT NULL,
    description TEXT,
    location TEXT,

    -- Timing
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    is_all_day BOOLEAN DEFAULT false,
    timezone VARCHAR(100),

    -- Recurrence
    recurrence_rule TEXT, -- iCal RRULE format
    recurrence_id UUID, -- For instances of recurring events

    -- Attendees
    -- e.g., [{email, name, response: 'accepted'|'declined'|'tentative'|'needsAction'}]
    attendees JSONB DEFAULT '[]',
    organizer JSONB, -- {email, name}

    -- CRM Links
    client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
    contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
    opportunity_id UUID REFERENCES opportunities(id) ON DELETE SET NULL,
    activity_id UUID REFERENCES activities(id) ON DELETE SET NULL,

    -- Status
    status VARCHAR(20) DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'tentative', 'cancelled')),

    -- Sync tracking
    last_synced_at TIMESTAMPTZ,
    is_deleted BOOLEAN DEFAULT false,
    sync_error TEXT,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Indexes for calendar_events
CREATE INDEX IF NOT EXISTS idx_calendar_events_user ON calendar_events(user_id);
CREATE INDEX IF NOT EXISTS idx_calendar_events_provider ON calendar_events(provider, provider_event_id);
CREATE INDEX IF NOT EXISTS idx_calendar_events_time ON calendar_events(start_time, end_time);
CREATE INDEX IF NOT EXISTS idx_calendar_events_client ON calendar_events(client_id);
CREATE INDEX IF NOT EXISTS idx_calendar_events_opportunity ON calendar_events(opportunity_id);

-- RLS policies for calendar_events
ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own calendar events"
    ON calendar_events FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create calendar events"
    ON calendar_events FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own calendar events"
    ON calendar_events FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own calendar events"
    ON calendar_events FOR DELETE
    USING (auth.uid() = user_id);

-- ============================================================
-- EMAIL SEQUENCES
-- ============================================================

CREATE TABLE IF NOT EXISTS email_sequences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,

    -- Sequence info
    name VARCHAR(255) NOT NULL,
    description TEXT,

    -- Settings
    is_active BOOLEAN DEFAULT true,
    send_on_weekends BOOLEAN DEFAULT false,
    send_time_start TIME DEFAULT '09:00:00', -- Send window start
    send_time_end TIME DEFAULT '17:00:00', -- Send window end
    timezone VARCHAR(100) DEFAULT 'UTC',

    -- Stats
    enrolled_count INTEGER DEFAULT 0,
    completed_count INTEGER DEFAULT 0,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS email_sequence_steps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sequence_id UUID REFERENCES email_sequences(id) ON DELETE CASCADE NOT NULL,

    -- Step order
    step_order INTEGER NOT NULL,

    -- Delay before sending
    delay_days INTEGER DEFAULT 0,
    delay_hours INTEGER DEFAULT 0,

    -- Email content (can use template or custom)
    template_id UUID REFERENCES email_templates(id) ON DELETE SET NULL,
    subject_override TEXT, -- Override template subject
    body_override TEXT, -- Override template body

    -- Skip conditions
    skip_if_replied BOOLEAN DEFAULT true,
    skip_if_opened BOOLEAN DEFAULT false,
    skip_if_clicked BOOLEAN DEFAULT false,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

    UNIQUE(sequence_id, step_order)
);

CREATE TABLE IF NOT EXISTS email_sequence_enrollments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sequence_id UUID REFERENCES email_sequences(id) ON DELETE CASCADE NOT NULL,
    contact_id UUID REFERENCES contacts(id) ON DELETE CASCADE NOT NULL,

    -- Progress
    current_step INTEGER DEFAULT 1,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed', 'stopped', 'replied', 'bounced')),

    -- Timing
    enrolled_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    next_send_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    stopped_at TIMESTAMPTZ,
    stopped_reason TEXT,

    -- Prevent duplicate enrollments
    UNIQUE(sequence_id, contact_id)
);

CREATE TABLE IF NOT EXISTS email_sequence_sends (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    enrollment_id UUID REFERENCES email_sequence_enrollments(id) ON DELETE CASCADE NOT NULL,
    step_id UUID REFERENCES email_sequence_steps(id) ON DELETE CASCADE NOT NULL,

    -- Link to actual sent email
    message_id UUID REFERENCES email_messages(id) ON DELETE SET NULL,

    -- Status
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'opened', 'clicked', 'replied', 'bounced', 'skipped')),
    skip_reason TEXT,

    -- Timing
    scheduled_at TIMESTAMPTZ,
    sent_at TIMESTAMPTZ,

    -- Engagement tracking
    opened_at TIMESTAMPTZ,
    clicked_at TIMESTAMPTZ,
    replied_at TIMESTAMPTZ
);

-- Indexes for email sequences
CREATE INDEX IF NOT EXISTS idx_email_sequences_user ON email_sequences(user_id);
CREATE INDEX IF NOT EXISTS idx_email_sequences_active ON email_sequences(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_sequence_steps_sequence ON email_sequence_steps(sequence_id);
CREATE INDEX IF NOT EXISTS idx_sequence_enrollments_sequence ON email_sequence_enrollments(sequence_id);
CREATE INDEX IF NOT EXISTS idx_sequence_enrollments_contact ON email_sequence_enrollments(contact_id);
CREATE INDEX IF NOT EXISTS idx_sequence_enrollments_status ON email_sequence_enrollments(status);
CREATE INDEX IF NOT EXISTS idx_sequence_enrollments_next_send ON email_sequence_enrollments(next_send_at) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_sequence_sends_enrollment ON email_sequence_sends(enrollment_id);
CREATE INDEX IF NOT EXISTS idx_sequence_sends_status ON email_sequence_sends(status);

-- RLS policies for email sequences
ALTER TABLE email_sequences ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_sequence_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_sequence_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_sequence_sends ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own sequences"
    ON email_sequences FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create sequences"
    ON email_sequences FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own sequences"
    ON email_sequences FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own sequences"
    ON email_sequences FOR DELETE
    USING (auth.uid() = user_id);

-- Steps inherit access from sequence
CREATE POLICY "Users can view steps of their sequences"
    ON email_sequence_steps FOR SELECT
    USING (sequence_id IN (SELECT id FROM email_sequences WHERE user_id = auth.uid()));

CREATE POLICY "Users can manage steps of their sequences"
    ON email_sequence_steps FOR ALL
    USING (sequence_id IN (SELECT id FROM email_sequences WHERE user_id = auth.uid()));

-- Enrollments inherit access from sequence
CREATE POLICY "Users can view enrollments of their sequences"
    ON email_sequence_enrollments FOR SELECT
    USING (sequence_id IN (SELECT id FROM email_sequences WHERE user_id = auth.uid()));

CREATE POLICY "Users can manage enrollments of their sequences"
    ON email_sequence_enrollments FOR ALL
    USING (sequence_id IN (SELECT id FROM email_sequences WHERE user_id = auth.uid()));

-- Sends inherit access from enrollment
CREATE POLICY "Users can view sends of their enrollments"
    ON email_sequence_sends FOR SELECT
    USING (enrollment_id IN (
        SELECT id FROM email_sequence_enrollments
        WHERE sequence_id IN (SELECT id FROM email_sequences WHERE user_id = auth.uid())
    ));

-- ============================================================
-- HELPER FUNCTIONS
-- ============================================================

-- Update timestamp trigger function (if not exists)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply update triggers
DROP TRIGGER IF EXISTS update_email_templates_updated_at ON email_templates;
CREATE TRIGGER update_email_templates_updated_at
    BEFORE UPDATE ON email_templates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_documents_updated_at ON documents;
CREATE TRIGGER update_documents_updated_at
    BEFORE UPDATE ON documents
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_workflow_rules_updated_at ON workflow_rules;
CREATE TRIGGER update_workflow_rules_updated_at
    BEFORE UPDATE ON workflow_rules
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_calendar_events_updated_at ON calendar_events;
CREATE TRIGGER update_calendar_events_updated_at
    BEFORE UPDATE ON calendar_events
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_email_sequences_updated_at ON email_sequences;
CREATE TRIGGER update_email_sequences_updated_at
    BEFORE UPDATE ON email_sequences
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_sequence_steps_updated_at ON email_sequence_steps;
CREATE TRIGGER update_sequence_steps_updated_at
    BEFORE UPDATE ON email_sequence_steps
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to update email tracking stats
CREATE OR REPLACE FUNCTION update_email_tracking_stats()
RETURNS TRIGGER AS $$
BEGIN
    -- Update the message's tracking counters
    IF NEW.event_type = 'open' THEN
        UPDATE email_messages SET
            open_count = open_count + 1,
            first_opened_at = COALESCE(first_opened_at, NEW.occurred_at),
            last_opened_at = NEW.occurred_at
        WHERE tracking_id = NEW.tracking_id;
    ELSIF NEW.event_type = 'click' THEN
        UPDATE email_messages SET
            click_count = click_count + 1
        WHERE tracking_id = NEW.tracking_id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_email_tracking_event ON email_tracking_events;
CREATE TRIGGER on_email_tracking_event
    AFTER INSERT ON email_tracking_events
    FOR EACH ROW EXECUTE FUNCTION update_email_tracking_stats();
