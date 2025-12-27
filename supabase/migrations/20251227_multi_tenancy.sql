-- ============================================================
-- Multi-Tenancy Migration for ProductionOS SaaS
-- This migration adds organization-based data isolation
-- ============================================================

-- ============================================================
-- 1. ORGANIZATIONS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS organizations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE, -- URL-safe identifier (e.g., "acme-productions")
    logo_url TEXT,

    -- Billing info (for Stripe integration later)
    stripe_customer_id TEXT,
    subscription_status TEXT DEFAULT 'trialing' CHECK (subscription_status IN ('trialing', 'active', 'past_due', 'canceled', 'unpaid')),
    subscription_plan TEXT DEFAULT 'free' CHECK (subscription_plan IN ('free', 'starter', 'professional', 'enterprise')),
    trial_ends_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '14 days'),

    -- Settings
    settings JSONB DEFAULT '{}',

    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_organizations_slug ON organizations(slug);
CREATE INDEX IF NOT EXISTS idx_organizations_stripe_customer ON organizations(stripe_customer_id);

-- Enable RLS
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;

-- Trigger for updated_at
DROP TRIGGER IF EXISTS update_organizations_updated_at ON organizations;
CREATE TRIGGER update_organizations_updated_at
    BEFORE UPDATE ON organizations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- 2. ORGANIZATION MEMBERS TABLE (links users to orgs)
-- ============================================================
CREATE TABLE IF NOT EXISTS organization_members (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member', 'viewer')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
    UNIQUE(organization_id, user_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_org_members_org ON organization_members(organization_id);
CREATE INDEX IF NOT EXISTS idx_org_members_user ON organization_members(user_id);

-- Enable RLS
ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;

-- Trigger for updated_at
DROP TRIGGER IF EXISTS update_organization_members_updated_at ON organization_members;
CREATE TRIGGER update_organization_members_updated_at
    BEFORE UPDATE ON organization_members
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- 3. USER INVITATIONS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS user_invitations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    role TEXT DEFAULT 'member' CHECK (role IN ('admin', 'member', 'viewer')),
    tab_permissions TEXT[] DEFAULT ARRAY[]::TEXT[],
    invited_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    token TEXT NOT NULL UNIQUE,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (NOW() + INTERVAL '7 days'),
    claimed_at TIMESTAMP WITH TIME ZONE,
    claimed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_invitations_org ON user_invitations(organization_id);
CREATE INDEX IF NOT EXISTS idx_invitations_email ON user_invitations(email);
CREATE INDEX IF NOT EXISTS idx_invitations_token ON user_invitations(token);

-- Enable RLS
ALTER TABLE user_invitations ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 4. AUDIT LOGS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    user_email TEXT,
    action TEXT NOT NULL, -- 'create', 'update', 'delete', 'export', 'login', etc.
    entity_type TEXT NOT NULL, -- 'quote', 'client', 'invoice', etc.
    entity_id UUID,
    entity_name TEXT, -- Human-readable name for the entity
    changes JSONB DEFAULT '{}', -- What changed (for updates)
    metadata JSONB DEFAULT '{}', -- Additional context
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- Indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_audit_logs_org ON audit_logs(organization_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON audit_logs(created_at DESC);

-- Enable RLS
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 5. ADD organization_id TO ALL EXISTING TABLES
-- ============================================================

-- Add organization_id column to user_profiles
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_user_profiles_org ON user_profiles(organization_id);

-- Add organization_id column to quotes
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_quotes_org ON quotes(organization_id);

-- Add organization_id column to clients
ALTER TABLE clients ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_clients_org ON clients(organization_id);

-- Add organization_id column to rate_cards
ALTER TABLE rate_cards ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_rate_cards_org ON rate_cards(organization_id);

-- Add organization_id column to rate_card_sections
ALTER TABLE rate_card_sections ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
-- Note: rate_card_sections uses TEXT as primary key, so index name differs
CREATE INDEX IF NOT EXISTS idx_rate_card_sections_org ON rate_card_sections(organization_id);

-- Add organization_id column to settings
ALTER TABLE settings ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_settings_org ON settings(organization_id);

-- Add organization_id column to opportunities
ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_opportunities_org ON opportunities(organization_id);

-- Add organization_id column to contacts (skipped - table may not exist)
-- ALTER TABLE contacts ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
-- CREATE INDEX IF NOT EXISTS idx_contacts_org ON contacts(organization_id);

-- Add organization_id column to invoices (skipped - table may not exist)
-- ALTER TABLE invoices ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
-- CREATE INDEX IF NOT EXISTS idx_invoices_org ON invoices(organization_id);

-- Add organization_id column to expenses (skipped - table may not exist)
-- ALTER TABLE expenses ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
-- CREATE INDEX IF NOT EXISTS idx_expenses_org ON expenses(organization_id);

-- Add organization_id column to crew_bookings (skipped - table may not exist)
-- ALTER TABLE crew_bookings ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
-- CREATE INDEX IF NOT EXISTS idx_crew_bookings_org ON crew_bookings(organization_id);

-- Add organization_id column to google_tokens (skipped - table may not exist)
-- ALTER TABLE google_tokens ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
-- CREATE INDEX IF NOT EXISTS idx_google_tokens_org ON google_tokens(organization_id);

-- Add to tables from other schema files (if they exist)
DO $$
BEGIN
    -- Projects
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'projects') THEN
        ALTER TABLE projects ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
        CREATE INDEX IF NOT EXISTS idx_projects_org ON projects(organization_id);
    END IF;

    -- Project Phases
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'project_phases') THEN
        ALTER TABLE project_phases ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
        CREATE INDEX IF NOT EXISTS idx_project_phases_org ON project_phases(organization_id);
    END IF;

    -- Purchase Orders
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'purchase_orders') THEN
        ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
        CREATE INDEX IF NOT EXISTS idx_purchase_orders_org ON purchase_orders(organization_id);
    END IF;

    -- Contracts
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'contracts') THEN
        ALTER TABLE contracts ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
        CREATE INDEX IF NOT EXISTS idx_contracts_org ON contracts(organization_id);
    END IF;

    -- Crew
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'crew') THEN
        ALTER TABLE crew ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
        CREATE INDEX IF NOT EXISTS idx_crew_org ON crew(organization_id);
    END IF;

    -- Crew Departments
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'crew_departments') THEN
        ALTER TABLE crew_departments ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
        CREATE INDEX IF NOT EXISTS idx_crew_departments_org ON crew_departments(organization_id);
    END IF;

    -- Crew Availability
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'crew_availability') THEN
        ALTER TABLE crew_availability ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
        CREATE INDEX IF NOT EXISTS idx_crew_availability_org ON crew_availability(organization_id);
    END IF;

    -- Crew Project History
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'crew_project_history') THEN
        ALTER TABLE crew_project_history ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
        CREATE INDEX IF NOT EXISTS idx_crew_project_history_org ON crew_project_history(organization_id);
    END IF;

    -- Kit Bookings
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'kit_bookings') THEN
        ALTER TABLE kit_bookings ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
        CREATE INDEX IF NOT EXISTS idx_kit_bookings_org ON kit_bookings(organization_id);
    END IF;

    -- Call Sheets
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'call_sheets') THEN
        ALTER TABLE call_sheets ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
        CREATE INDEX IF NOT EXISTS idx_call_sheets_org ON call_sheets(organization_id);
    END IF;

    -- Call Sheet Crew
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'call_sheet_crew') THEN
        ALTER TABLE call_sheet_crew ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
        CREATE INDEX IF NOT EXISTS idx_call_sheet_crew_org ON call_sheet_crew(organization_id);
    END IF;

    -- Call Sheet Templates
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'call_sheet_templates') THEN
        ALTER TABLE call_sheet_templates ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
        CREATE INDEX IF NOT EXISTS idx_call_sheet_templates_org ON call_sheet_templates(organization_id);
    END IF;

    -- Vendors
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'vendors') THEN
        ALTER TABLE vendors ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
        CREATE INDEX IF NOT EXISTS idx_vendors_org ON vendors(organization_id);
    END IF;

    -- Tasks
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'tasks') THEN
        ALTER TABLE tasks ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
        CREATE INDEX IF NOT EXISTS idx_tasks_org ON tasks(organization_id);
    END IF;

    -- SOPs
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'sops') THEN
        ALTER TABLE sops ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
        CREATE INDEX IF NOT EXISTS idx_sops_org ON sops(organization_id);
    END IF;

    -- Knowledge Base
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'knowledge_base') THEN
        ALTER TABLE knowledge_base ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
        CREATE INDEX IF NOT EXISTS idx_knowledge_base_org ON knowledge_base(organization_id);
    END IF;

    -- Email Threads
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'email_threads') THEN
        ALTER TABLE email_threads ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
        CREATE INDEX IF NOT EXISTS idx_email_threads_org ON email_threads(organization_id);
    END IF;

    -- Emails
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'emails') THEN
        ALTER TABLE emails ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
        CREATE INDEX IF NOT EXISTS idx_emails_org ON emails(organization_id);
    END IF;
END $$;

-- ============================================================
-- 6. HELPER FUNCTION TO GET USER'S CURRENT ORGANIZATION
-- ============================================================
CREATE OR REPLACE FUNCTION get_user_organization_id()
RETURNS UUID AS $$
DECLARE
    org_id UUID;
BEGIN
    -- Get the organization_id from user_profiles for the current user
    SELECT organization_id INTO org_id
    FROM user_profiles
    WHERE auth_user_id = auth.uid()
    LIMIT 1;

    RETURN org_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- 7. HELPER FUNCTION TO CHECK IF USER IS ORG ADMIN
-- ============================================================
CREATE OR REPLACE FUNCTION is_org_admin()
RETURNS BOOLEAN AS $$
DECLARE
    user_role TEXT;
BEGIN
    SELECT om.role INTO user_role
    FROM organization_members om
    WHERE om.user_id = auth.uid()
    AND om.organization_id = get_user_organization_id()
    LIMIT 1;

    RETURN user_role IN ('owner', 'admin');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- 8. RLS POLICIES FOR ORGANIZATIONS
-- ============================================================
DROP POLICY IF EXISTS "Users can view their organizations" ON organizations;
CREATE POLICY "Users can view their organizations" ON organizations
    FOR SELECT USING (
        id IN (
            SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Org admins can update their organization" ON organizations;
CREATE POLICY "Org admins can update their organization" ON organizations
    FOR UPDATE USING (
        id IN (
            SELECT organization_id FROM organization_members
            WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
        )
    );

-- ============================================================
-- 9. RLS POLICIES FOR ORGANIZATION MEMBERS
-- ============================================================
DROP POLICY IF EXISTS "Users can view members of their orgs" ON organization_members;
CREATE POLICY "Users can view members of their orgs" ON organization_members
    FOR SELECT USING (
        organization_id IN (
            SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Org admins can manage members" ON organization_members;
CREATE POLICY "Org admins can manage members" ON organization_members
    FOR ALL USING (
        organization_id IN (
            SELECT organization_id FROM organization_members
            WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
        )
    );

-- ============================================================
-- 10. RLS POLICIES FOR USER INVITATIONS
-- ============================================================
DROP POLICY IF EXISTS "Org admins can manage invitations" ON user_invitations;
CREATE POLICY "Org admins can manage invitations" ON user_invitations
    FOR ALL USING (
        organization_id IN (
            SELECT organization_id FROM organization_members
            WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
        )
    );

DROP POLICY IF EXISTS "Anyone can view invitation by token" ON user_invitations;
CREATE POLICY "Anyone can view invitation by token" ON user_invitations
    FOR SELECT USING (true); -- Token validation happens in application layer

-- ============================================================
-- 11. RLS POLICIES FOR AUDIT LOGS
-- ============================================================
DROP POLICY IF EXISTS "Org admins can view audit logs" ON audit_logs;
CREATE POLICY "Org admins can view audit logs" ON audit_logs
    FOR SELECT USING (
        organization_id = get_user_organization_id() AND is_org_admin()
    );

DROP POLICY IF EXISTS "System can insert audit logs" ON audit_logs;
CREATE POLICY "System can insert audit logs" ON audit_logs
    FOR INSERT WITH CHECK (true); -- Audit logs are inserted by the application

-- ============================================================
-- 12. UPDATE RLS POLICIES FOR DATA TABLES
-- These policies ensure users can only access their org's data
-- ============================================================

-- Drop old permissive policies and create org-scoped ones
-- Only include tables that exist and have organization_id column
DO $$
DECLARE
    table_name TEXT;
    tables TEXT[] := ARRAY[
        'quotes', 'clients', 'rate_cards', 'settings', 'opportunities'
    ];
BEGIN
    FOREACH table_name IN ARRAY tables
    LOOP
        -- Drop old "Allow all" policy
        EXECUTE format('DROP POLICY IF EXISTS "Allow all %s" ON %I', table_name, table_name);

        -- Create SELECT policy
        EXECUTE format('
            DROP POLICY IF EXISTS "Users can view org %s" ON %I;
            CREATE POLICY "Users can view org %s" ON %I
                FOR SELECT USING (organization_id = get_user_organization_id() OR organization_id IS NULL)
        ', table_name, table_name, table_name, table_name);

        -- Create INSERT policy
        EXECUTE format('
            DROP POLICY IF EXISTS "Users can insert org %s" ON %I;
            CREATE POLICY "Users can insert org %s" ON %I
                FOR INSERT WITH CHECK (organization_id = get_user_organization_id() OR organization_id IS NULL)
        ', table_name, table_name, table_name, table_name);

        -- Create UPDATE policy
        EXECUTE format('
            DROP POLICY IF EXISTS "Users can update org %s" ON %I;
            CREATE POLICY "Users can update org %s" ON %I
                FOR UPDATE USING (organization_id = get_user_organization_id() OR organization_id IS NULL)
        ', table_name, table_name, table_name, table_name);

        -- Create DELETE policy
        EXECUTE format('
            DROP POLICY IF EXISTS "Users can delete org %s" ON %I;
            CREATE POLICY "Users can delete org %s" ON %I
                FOR DELETE USING (organization_id = get_user_organization_id() OR organization_id IS NULL)
        ', table_name, table_name, table_name, table_name);
    END LOOP;
END $$;

-- Update rate_card_sections separately (has text primary key)
DROP POLICY IF EXISTS "Allow all rate_card_sections" ON rate_card_sections;
DROP POLICY IF EXISTS "Users can view org rate_card_sections" ON rate_card_sections;
CREATE POLICY "Users can view org rate_card_sections" ON rate_card_sections
    FOR SELECT USING (organization_id = get_user_organization_id() OR organization_id IS NULL);
DROP POLICY IF EXISTS "Users can insert org rate_card_sections" ON rate_card_sections;
CREATE POLICY "Users can insert org rate_card_sections" ON rate_card_sections
    FOR INSERT WITH CHECK (organization_id = get_user_organization_id() OR organization_id IS NULL);
DROP POLICY IF EXISTS "Users can update org rate_card_sections" ON rate_card_sections;
CREATE POLICY "Users can update org rate_card_sections" ON rate_card_sections
    FOR UPDATE USING (organization_id = get_user_organization_id() OR organization_id IS NULL);
DROP POLICY IF EXISTS "Users can delete org rate_card_sections" ON rate_card_sections;
CREATE POLICY "Users can delete org rate_card_sections" ON rate_card_sections
    FOR DELETE USING (organization_id = get_user_organization_id() OR organization_id IS NULL);

-- ============================================================
-- 13. SUBSCRIPTION TRACKING TABLE (for Stripe later)
-- ============================================================
CREATE TABLE IF NOT EXISTS subscriptions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    stripe_subscription_id TEXT UNIQUE,
    stripe_price_id TEXT,
    status TEXT DEFAULT 'trialing' CHECK (status IN ('trialing', 'active', 'past_due', 'canceled', 'unpaid', 'incomplete')),
    plan TEXT DEFAULT 'free' CHECK (plan IN ('free', 'starter', 'professional', 'enterprise')),
    quantity INTEGER DEFAULT 1, -- Number of seats
    current_period_start TIMESTAMP WITH TIME ZONE,
    current_period_end TIMESTAMP WITH TIME ZONE,
    cancel_at_period_end BOOLEAN DEFAULT FALSE,
    canceled_at TIMESTAMP WITH TIME ZONE,
    trial_start TIMESTAMP WITH TIME ZONE,
    trial_end TIMESTAMP WITH TIME ZONE,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_subscriptions_org ON subscriptions(organization_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe ON subscriptions(stripe_subscription_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);

-- Enable RLS
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for subscriptions
DROP POLICY IF EXISTS "Org admins can view subscriptions" ON subscriptions;
CREATE POLICY "Org admins can view subscriptions" ON subscriptions
    FOR SELECT USING (
        organization_id IN (
            SELECT organization_id FROM organization_members
            WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
        )
    );

-- Trigger for updated_at
DROP TRIGGER IF EXISTS update_subscriptions_updated_at ON subscriptions;
CREATE TRIGGER update_subscriptions_updated_at
    BEFORE UPDATE ON subscriptions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- 14. GDPR DATA EXPORT REQUESTS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS data_export_requests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'expired')),
    export_url TEXT, -- Signed URL to download the export
    expires_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_data_export_org ON data_export_requests(organization_id);
CREATE INDEX IF NOT EXISTS idx_data_export_user ON data_export_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_data_export_status ON data_export_requests(status);

-- Enable RLS
ALTER TABLE data_export_requests ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "Users can view their export requests" ON data_export_requests;
CREATE POLICY "Users can view their export requests" ON data_export_requests
    FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can request exports" ON data_export_requests;
CREATE POLICY "Users can request exports" ON data_export_requests
    FOR INSERT WITH CHECK (user_id = auth.uid());

-- ============================================================
-- 15. ACCOUNT DELETION REQUESTS TABLE (GDPR)
-- ============================================================
CREATE TABLE IF NOT EXISTS account_deletion_requests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
    reason TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'processing', 'completed', 'canceled')),
    confirmation_token TEXT UNIQUE,
    confirmed_at TIMESTAMP WITH TIME ZONE,
    scheduled_deletion_at TIMESTAMP WITH TIME ZONE, -- 30-day grace period
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_deletion_user ON account_deletion_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_deletion_status ON account_deletion_requests(status);
CREATE INDEX IF NOT EXISTS idx_deletion_token ON account_deletion_requests(confirmation_token);

-- Enable RLS
ALTER TABLE account_deletion_requests ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "Users can view their deletion requests" ON account_deletion_requests;
CREATE POLICY "Users can view their deletion requests" ON account_deletion_requests
    FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can request deletion" ON account_deletion_requests;
CREATE POLICY "Users can request deletion" ON account_deletion_requests
    FOR INSERT WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can cancel deletion" ON account_deletion_requests;
CREATE POLICY "Users can cancel deletion" ON account_deletion_requests
    FOR UPDATE USING (user_id = auth.uid() AND status IN ('pending', 'confirmed'));

-- ============================================================
-- 16. BILLING INVOICES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS billing_invoices (
    id TEXT PRIMARY KEY, -- Stripe invoice ID
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    stripe_invoice_id TEXT UNIQUE,
    amount INTEGER NOT NULL, -- Amount in cents
    currency TEXT DEFAULT 'usd',
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'open', 'paid', 'void', 'uncollectible')),
    description TEXT,
    invoice_pdf TEXT, -- URL to PDF
    hosted_invoice_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_billing_invoices_org ON billing_invoices(organization_id);
CREATE INDEX IF NOT EXISTS idx_billing_invoices_status ON billing_invoices(status);

-- Enable RLS
ALTER TABLE billing_invoices ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "Org admins can view invoices" ON billing_invoices;
CREATE POLICY "Org admins can view invoices" ON billing_invoices
    FOR SELECT USING (
        organization_id IN (
            SELECT organization_id FROM organization_members
            WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
        )
    );

-- ============================================================
-- 17. ONBOARDING PROGRESS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS onboarding_progress (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,

    -- Step completion tracking
    current_step TEXT DEFAULT 'company_setup',
    completed_steps TEXT[] DEFAULT ARRAY[]::TEXT[],

    -- Company Setup data
    company_type TEXT, -- video_production, event_production, photography, etc.
    primary_focus TEXT[], -- Up to 3 selections
    team_size TEXT, -- just_me, 2-5, 6-15, 16+

    -- Pain Points (for personalization)
    pain_points TEXT[], -- Up to 3 selections

    -- Company Profile (optional)
    company_logo_url TEXT,
    company_address TEXT,
    company_phone TEXT,
    company_website TEXT,
    payment_terms TEXT DEFAULT 'net_30',

    -- Team Invites sent
    team_invites_sent INTEGER DEFAULT 0,

    -- Import status
    clients_imported INTEGER DEFAULT 0,
    crew_imported INTEGER DEFAULT 0,
    equipment_imported INTEGER DEFAULT 0,

    -- Rate card setup
    rate_card_configured BOOLEAN DEFAULT FALSE,

    -- First action choice
    first_action TEXT, -- create_quote, add_project, explore_dashboard

    -- Completion tracking
    started_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
    completed_at TIMESTAMP WITH TIME ZONE,
    abandoned_at TIMESTAMP WITH TIME ZONE,
    last_step_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),

    -- Email sequence tracking
    emails_sent TEXT[] DEFAULT ARRAY[]::TEXT[],

    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_onboarding_user ON onboarding_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_onboarding_org ON onboarding_progress(organization_id);
CREATE INDEX IF NOT EXISTS idx_onboarding_step ON onboarding_progress(current_step);

-- Enable RLS
ALTER TABLE onboarding_progress ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "Users can view their onboarding" ON onboarding_progress;
CREATE POLICY "Users can view their onboarding" ON onboarding_progress
    FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update their onboarding" ON onboarding_progress;
CREATE POLICY "Users can update their onboarding" ON onboarding_progress
    FOR UPDATE USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can create their onboarding" ON onboarding_progress;
CREATE POLICY "Users can create their onboarding" ON onboarding_progress
    FOR INSERT WITH CHECK (user_id = auth.uid());

-- Trigger for updated_at
DROP TRIGGER IF EXISTS update_onboarding_progress_updated_at ON onboarding_progress;
CREATE TRIGGER update_onboarding_progress_updated_at
    BEFORE UPDATE ON onboarding_progress
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- 18. ONBOARDING CHECKLIST TABLE (for dashboard widget)
-- ============================================================
CREATE TABLE IF NOT EXISTS onboarding_checklist (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,

    -- Checklist items
    account_created BOOLEAN DEFAULT TRUE,
    company_profile_setup BOOLEAN DEFAULT FALSE,
    rates_configured BOOLEAN DEFAULT FALSE,
    first_quote_created BOOLEAN DEFAULT FALSE,
    first_client_added BOOLEAN DEFAULT FALSE,
    first_crew_added BOOLEAN DEFAULT FALSE,
    first_project_created BOOLEAN DEFAULT FALSE,

    -- Widget state
    dismissed BOOLEAN DEFAULT FALSE,
    minimized BOOLEAN DEFAULT FALSE,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,

    UNIQUE(user_id, organization_id)
);

-- Enable RLS
ALTER TABLE onboarding_checklist ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "Users can manage their checklist" ON onboarding_checklist;
CREATE POLICY "Users can manage their checklist" ON onboarding_checklist
    FOR ALL USING (user_id = auth.uid());

-- ============================================================
-- MIGRATION COMPLETE
-- ============================================================
-- Next steps:
-- 1. Create an organization for existing users
-- 2. Associate existing data with the organization
-- 3. Update application code to include organization_id in all queries
-- ============================================================
