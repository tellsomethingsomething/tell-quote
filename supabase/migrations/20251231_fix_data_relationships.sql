-- ============================================================
-- DATA RELATIONSHIP FIXES MIGRATION
-- Run: 2024-12-31
-- Purpose: Fix broken foreign keys, create missing tables,
--          consolidate duplicates, add missing indexes
-- ============================================================

-- Enable UUID extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- PART 1: CREATE MISSING TABLES
-- ============================================================

-- 1.1 Projects table (referenced by 8+ tables)
CREATE TABLE IF NOT EXISTS projects (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
    opportunity_id UUID REFERENCES opportunities(id) ON DELETE SET NULL,
    quote_id UUID REFERENCES quotes(id) ON DELETE SET NULL,
    status TEXT DEFAULT 'active' CHECK (status IN ('draft', 'active', 'on_hold', 'completed', 'cancelled')),
    start_date DATE,
    end_date DATE,
    budget NUMERIC(12,2),
    currency TEXT DEFAULT 'USD',
    project_type TEXT,
    region TEXT,
    country TEXT,
    venue TEXT,
    notes TEXT,
    metadata JSONB DEFAULT '{}',
    organization_id UUID,
    user_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 1.2 Activities table (referenced by calendar_events)
CREATE TABLE IF NOT EXISTS activities (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    activity_type TEXT NOT NULL CHECK (activity_type IN ('call', 'meeting', 'email', 'task', 'note', 'follow_up', 'other')),
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
    priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    due_date TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    -- Related entities
    client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
    contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
    opportunity_id UUID REFERENCES opportunities(id) ON DELETE SET NULL,
    project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
    quote_id UUID REFERENCES quotes(id) ON DELETE SET NULL,
    -- Assignment
    assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    -- Multi-tenancy
    organization_id UUID,
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 1.3 Email Messages table (referenced by email_tracking_events)
CREATE TABLE IF NOT EXISTS email_messages (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    thread_id UUID,
    message_id TEXT, -- Gmail message ID
    subject TEXT,
    body_text TEXT,
    body_html TEXT,
    from_address TEXT,
    to_addresses TEXT[],
    cc_addresses TEXT[],
    bcc_addresses TEXT[],
    sent_at TIMESTAMP WITH TIME ZONE,
    received_at TIMESTAMP WITH TIME ZONE,
    is_outbound BOOLEAN DEFAULT false,
    is_read BOOLEAN DEFAULT false,
    is_starred BOOLEAN DEFAULT false,
    labels TEXT[],
    -- Related entities
    contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
    client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
    opportunity_id UUID REFERENCES opportunities(id) ON DELETE SET NULL,
    -- Multi-tenancy
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    organization_id UUID,
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 1.4 Equipment table (referenced by subscriptionGuard)
CREATE TABLE IF NOT EXISTS equipment (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    category TEXT,
    description TEXT,
    serial_number TEXT,
    quantity INTEGER DEFAULT 1,
    day_rate NUMERIC(12,2) DEFAULT 0,
    purchase_price NUMERIC(12,2),
    purchase_date DATE,
    condition TEXT DEFAULT 'good' CHECK (condition IN ('excellent', 'good', 'fair', 'poor', 'needs_repair')),
    status TEXT DEFAULT 'available' CHECK (status IN ('available', 'in_use', 'maintenance', 'retired')),
    location TEXT,
    notes TEXT,
    source TEXT,
    metadata JSONB DEFAULT '{}',
    organization_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ============================================================
-- PART 2: FIX TASK BOARD FK REFERENCES (users → auth.users)
-- ============================================================

-- Drop existing constraints that reference non-existent 'users' table
DO $$
BEGIN
    -- task_boards
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints
               WHERE constraint_name = 'task_boards_created_by_fkey'
               AND table_name = 'task_boards') THEN
        ALTER TABLE task_boards DROP CONSTRAINT task_boards_created_by_fkey;
    END IF;

    -- task_cards
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints
               WHERE constraint_name = 'task_cards_created_by_fkey'
               AND table_name = 'task_cards') THEN
        ALTER TABLE task_cards DROP CONSTRAINT task_cards_created_by_fkey;
    END IF;

    -- task_comments
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints
               WHERE constraint_name = 'task_comments_user_id_fkey'
               AND table_name = 'task_comments') THEN
        ALTER TABLE task_comments DROP CONSTRAINT task_comments_user_id_fkey;
    END IF;

    -- task_card_assignees
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints
               WHERE constraint_name = 'task_card_assignees_user_id_fkey'
               AND table_name = 'task_card_assignees') THEN
        ALTER TABLE task_card_assignees DROP CONSTRAINT task_card_assignees_user_id_fkey;
    END IF;

    -- task_checklist_items
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints
               WHERE constraint_name = 'task_checklist_items_assigned_to_fkey'
               AND table_name = 'task_checklist_items') THEN
        ALTER TABLE task_checklist_items DROP CONSTRAINT task_checklist_items_assigned_to_fkey;
    END IF;

    -- task_attachments
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints
               WHERE constraint_name = 'task_attachments_uploaded_by_fkey'
               AND table_name = 'task_attachments') THEN
        ALTER TABLE task_attachments DROP CONSTRAINT task_attachments_uploaded_by_fkey;
    END IF;

    -- task_activity
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints
               WHERE constraint_name = 'task_activity_user_id_fkey'
               AND table_name = 'task_activity') THEN
        ALTER TABLE task_activity DROP CONSTRAINT task_activity_user_id_fkey;
    END IF;
END $$;

-- Add correct FK constraints to auth.users
DO $$
BEGIN
    -- Only add if table exists and column exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'task_boards')
       AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'task_boards' AND column_name = 'created_by') THEN
        ALTER TABLE task_boards ADD CONSTRAINT task_boards_created_by_fkey
            FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'task_cards')
       AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'task_cards' AND column_name = 'created_by') THEN
        ALTER TABLE task_cards ADD CONSTRAINT task_cards_created_by_fkey
            FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'task_comments')
       AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'task_comments' AND column_name = 'user_id') THEN
        ALTER TABLE task_comments ADD CONSTRAINT task_comments_user_id_fkey
            FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'task_card_assignees')
       AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'task_card_assignees' AND column_name = 'user_id') THEN
        ALTER TABLE task_card_assignees ADD CONSTRAINT task_card_assignees_user_id_fkey
            FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'task_checklist_items')
       AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'task_checklist_items' AND column_name = 'assigned_to') THEN
        ALTER TABLE task_checklist_items ADD CONSTRAINT task_checklist_items_assigned_to_fkey
            FOREIGN KEY (assigned_to) REFERENCES auth.users(id) ON DELETE SET NULL;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'task_attachments')
       AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'task_attachments' AND column_name = 'uploaded_by') THEN
        ALTER TABLE task_attachments ADD CONSTRAINT task_attachments_uploaded_by_fkey
            FOREIGN KEY (uploaded_by) REFERENCES auth.users(id) ON DELETE SET NULL;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'task_activity')
       AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'task_activity' AND column_name = 'user_id') THEN
        ALTER TABLE task_activity ADD CONSTRAINT task_activity_user_id_fkey
            FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL;
    END IF;
END $$;

-- ============================================================
-- PART 3: ADD PROJECT_ID FK CONSTRAINTS
-- ============================================================

DO $$
BEGIN
    -- crew_bookings.project_id
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'crew_bookings')
       AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'crew_bookings' AND column_name = 'project_id')
       AND NOT EXISTS (SELECT 1 FROM information_schema.table_constraints
                       WHERE constraint_name = 'crew_bookings_project_id_fkey' AND table_name = 'crew_bookings') THEN
        ALTER TABLE crew_bookings ADD CONSTRAINT crew_bookings_project_id_fkey
            FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL;
    END IF;

    -- invoices.project_id
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'invoices')
       AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'invoices' AND column_name = 'project_id')
       AND NOT EXISTS (SELECT 1 FROM information_schema.table_constraints
                       WHERE constraint_name = 'invoices_project_id_fkey' AND table_name = 'invoices') THEN
        ALTER TABLE invoices ADD CONSTRAINT invoices_project_id_fkey
            FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL;
    END IF;

    -- expenses.project_id
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'expenses')
       AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'expenses' AND column_name = 'project_id')
       AND NOT EXISTS (SELECT 1 FROM information_schema.table_constraints
                       WHERE constraint_name = 'expenses_project_id_fkey' AND table_name = 'expenses') THEN
        ALTER TABLE expenses ADD CONSTRAINT expenses_project_id_fkey
            FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL;
    END IF;

    -- call_sheets.project_id
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'call_sheets')
       AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'call_sheets' AND column_name = 'project_id')
       AND NOT EXISTS (SELECT 1 FROM information_schema.table_constraints
                       WHERE constraint_name = 'call_sheets_project_id_fkey' AND table_name = 'call_sheets') THEN
        ALTER TABLE call_sheets ADD CONSTRAINT call_sheets_project_id_fkey
            FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL;
    END IF;

    -- task_cards.project_id
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'task_cards')
       AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'task_cards' AND column_name = 'project_id')
       AND NOT EXISTS (SELECT 1 FROM information_schema.table_constraints
                       WHERE constraint_name = 'task_cards_project_id_fkey' AND table_name = 'task_cards') THEN
        ALTER TABLE task_cards ADD CONSTRAINT task_cards_project_id_fkey
            FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL;
    END IF;
END $$;

-- ============================================================
-- PART 4: FIX GOOGLE_TOKENS.USER_ID TYPE (text → uuid)
-- ============================================================

-- Note: This requires data migration if there's existing data
-- Only run if the column is currently text type
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'google_tokens'
        AND column_name = 'user_id'
        AND data_type = 'text'
    ) THEN
        -- Create temp column
        ALTER TABLE google_tokens ADD COLUMN user_id_new UUID;

        -- Migrate data (assuming user_id was stored as UUID string)
        UPDATE google_tokens SET user_id_new = user_id::uuid WHERE user_id IS NOT NULL AND user_id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';

        -- Drop old column and rename
        ALTER TABLE google_tokens DROP COLUMN user_id;
        ALTER TABLE google_tokens RENAME COLUMN user_id_new TO user_id;

        -- Add NOT NULL constraint
        ALTER TABLE google_tokens ALTER COLUMN user_id SET NOT NULL;

        -- Add FK constraint
        ALTER TABLE google_tokens ADD CONSTRAINT google_tokens_user_id_fkey
            FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

        -- Recreate index
        CREATE INDEX IF NOT EXISTS google_tokens_user_id_idx ON google_tokens(user_id);
    END IF;
END $$;

-- ============================================================
-- PART 5: ADD MISSING INDEXES ON FOREIGN KEYS
-- ============================================================

-- Projects indexes
CREATE INDEX IF NOT EXISTS projects_client_id_idx ON projects(client_id);
CREATE INDEX IF NOT EXISTS projects_opportunity_id_idx ON projects(opportunity_id);
CREATE INDEX IF NOT EXISTS projects_quote_id_idx ON projects(quote_id);
CREATE INDEX IF NOT EXISTS projects_organization_id_idx ON projects(organization_id);
CREATE INDEX IF NOT EXISTS projects_status_idx ON projects(status);

-- Activities indexes
CREATE INDEX IF NOT EXISTS activities_client_id_idx ON activities(client_id);
CREATE INDEX IF NOT EXISTS activities_contact_id_idx ON activities(contact_id);
CREATE INDEX IF NOT EXISTS activities_opportunity_id_idx ON activities(opportunity_id);
CREATE INDEX IF NOT EXISTS activities_project_id_idx ON activities(project_id);
CREATE INDEX IF NOT EXISTS activities_assigned_to_idx ON activities(assigned_to);
CREATE INDEX IF NOT EXISTS activities_organization_id_idx ON activities(organization_id);
CREATE INDEX IF NOT EXISTS activities_due_date_idx ON activities(due_date);

-- Email messages indexes
CREATE INDEX IF NOT EXISTS email_messages_thread_id_idx ON email_messages(thread_id);
CREATE INDEX IF NOT EXISTS email_messages_contact_id_idx ON email_messages(contact_id);
CREATE INDEX IF NOT EXISTS email_messages_client_id_idx ON email_messages(client_id);
CREATE INDEX IF NOT EXISTS email_messages_opportunity_id_idx ON email_messages(opportunity_id);
CREATE INDEX IF NOT EXISTS email_messages_user_id_idx ON email_messages(user_id);
CREATE INDEX IF NOT EXISTS email_messages_organization_id_idx ON email_messages(organization_id);

-- Equipment indexes
CREATE INDEX IF NOT EXISTS equipment_organization_id_idx ON equipment(organization_id);
CREATE INDEX IF NOT EXISTS equipment_category_idx ON equipment(category);
CREATE INDEX IF NOT EXISTS equipment_status_idx ON equipment(status);

-- Opportunities - add missing index
CREATE INDEX IF NOT EXISTS opportunities_converted_to_quote_id_idx ON opportunities(converted_to_quote_id);

-- Contacts - company_id index (for research schema contacts)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contacts' AND column_name = 'company_id') THEN
        CREATE INDEX IF NOT EXISTS contacts_company_id_idx ON contacts(company_id);
    END IF;
END $$;

-- Call sheet related indexes
CREATE INDEX IF NOT EXISTS call_sheet_crew_crew_id_idx ON call_sheet_crew(crew_id) WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'call_sheet_crew');
CREATE INDEX IF NOT EXISTS call_sheet_flights_crew_id_idx ON call_sheet_flights(crew_id) WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'call_sheet_flights');

-- Knowledge relationships indexes (if table exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'knowledge_relationships') THEN
        CREATE INDEX IF NOT EXISTS knowledge_relationships_fragment_a_idx ON knowledge_relationships(fragment_a);
        CREATE INDEX IF NOT EXISTS knowledge_relationships_fragment_b_idx ON knowledge_relationships(fragment_b);
    END IF;
END $$;

-- Workflow executions indexes (if table exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'workflow_executions') THEN
        CREATE INDEX IF NOT EXISTS workflow_executions_rule_id_idx ON workflow_executions(rule_id);
        CREATE INDEX IF NOT EXISTS workflow_executions_entity_id_idx ON workflow_executions(entity_id);
    END IF;
END $$;

-- Email sequence enrollments index (if table exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'email_sequence_enrollments') THEN
        CREATE INDEX IF NOT EXISTS email_sequence_enrollments_sequence_id_idx ON email_sequence_enrollments(sequence_id);
    END IF;
END $$;

-- ============================================================
-- PART 6: FIX CALENDAR_EVENTS ACTIVITY_ID FK
-- ============================================================

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'calendar_events')
       AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'calendar_events' AND column_name = 'activity_id')
       AND NOT EXISTS (SELECT 1 FROM information_schema.table_constraints
                       WHERE constraint_name = 'calendar_events_activity_id_fkey' AND table_name = 'calendar_events') THEN
        ALTER TABLE calendar_events ADD CONSTRAINT calendar_events_activity_id_fkey
            FOREIGN KEY (activity_id) REFERENCES activities(id) ON DELETE SET NULL;
        CREATE INDEX IF NOT EXISTS calendar_events_activity_id_idx ON calendar_events(activity_id);
    END IF;
END $$;

-- ============================================================
-- PART 7: FIX EMAIL_TRACKING_EVENTS MESSAGE_ID FK
-- ============================================================

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'email_tracking_events')
       AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'email_tracking_events' AND column_name = 'message_id') THEN
        -- Drop existing constraint if it references wrong table
        IF EXISTS (SELECT 1 FROM information_schema.table_constraints
                   WHERE constraint_name = 'email_tracking_events_message_id_fkey' AND table_name = 'email_tracking_events') THEN
            ALTER TABLE email_tracking_events DROP CONSTRAINT email_tracking_events_message_id_fkey;
        END IF;

        -- Add correct FK constraint
        ALTER TABLE email_tracking_events ADD CONSTRAINT email_tracking_events_message_id_fkey
            FOREIGN KEY (message_id) REFERENCES email_messages(id) ON DELETE CASCADE;
    END IF;
END $$;

-- ============================================================
-- PART 8: ENABLE RLS AND ADD POLICIES FOR NEW TABLES
-- ============================================================

ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE equipment ENABLE ROW LEVEL SECURITY;

-- Projects policies
CREATE POLICY "Users can view org projects" ON projects
    FOR SELECT USING (
        organization_id IS NULL OR
        organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid())
    );

CREATE POLICY "Users can manage org projects" ON projects
    FOR ALL USING (
        organization_id IS NULL OR
        organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid())
    );

-- Activities policies
CREATE POLICY "Users can view org activities" ON activities
    FOR SELECT USING (
        organization_id IS NULL OR
        organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid())
    );

CREATE POLICY "Users can manage org activities" ON activities
    FOR ALL USING (
        organization_id IS NULL OR
        organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid())
    );

-- Email messages policies
CREATE POLICY "Users can view own emails" ON email_messages
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can manage own emails" ON email_messages
    FOR ALL USING (user_id = auth.uid());

-- Equipment policies
CREATE POLICY "Users can view org equipment" ON equipment
    FOR SELECT USING (
        organization_id IS NULL OR
        organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid())
    );

CREATE POLICY "Users can manage org equipment" ON equipment
    FOR ALL USING (
        organization_id IS NULL OR
        organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid())
    );

-- ============================================================
-- PART 9: ADD UPDATED_AT TRIGGERS FOR NEW TABLES
-- ============================================================

CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_activities_updated_at BEFORE UPDATE ON activities
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_email_messages_updated_at BEFORE UPDATE ON email_messages
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_equipment_updated_at BEFORE UPDATE ON equipment
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- PART 10: CREATE VIEW FOR CREW (unifies crew/crew_contacts)
-- ============================================================

-- Create a view that provides consistent access regardless of table name
CREATE OR REPLACE VIEW crew_unified AS
SELECT
    id,
    COALESCE(name, first_name || ' ' || last_name) as name,
    email,
    phone,
    role,
    department,
    day_rate,
    status,
    notes,
    organization_id,
    created_at,
    updated_at
FROM crew
WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'crew')
UNION ALL
SELECT
    id,
    name,
    email,
    phone,
    role,
    department,
    day_rate,
    status,
    notes,
    organization_id,
    created_at,
    updated_at
FROM crew_contacts
WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'crew_contacts')
  AND NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'crew');

-- ============================================================
-- MIGRATION COMPLETE
-- ============================================================

COMMENT ON TABLE projects IS 'Projects table - created by fix_data_relationships migration';
COMMENT ON TABLE activities IS 'Activities table for CRM - created by fix_data_relationships migration';
COMMENT ON TABLE email_messages IS 'Email messages table - created by fix_data_relationships migration';
COMMENT ON TABLE equipment IS 'Equipment inventory table - created by fix_data_relationships migration';
