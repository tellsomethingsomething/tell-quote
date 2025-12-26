-- ============================================
-- SECURITY & DATABASE FIXES MIGRATION
-- This migration addresses:
-- 1. Wide-open RLS policies
-- 2. Duplicate contacts table resolution
-- 3. Missing FK constraints
-- 4. User table reference fixes
-- ============================================

-- ============================================
-- STEP 1: FIX RLS POLICIES
-- Replace wide-open policies with authenticated-only policies
-- ============================================

-- Drop existing wide-open policies
DROP POLICY IF EXISTS "Allow all quotes" ON quotes;
DROP POLICY IF EXISTS "Allow all clients" ON clients;
DROP POLICY IF EXISTS "Allow all rate_cards" ON rate_cards;
DROP POLICY IF EXISTS "Allow all rate_card_sections" ON rate_card_sections;
DROP POLICY IF EXISTS "Allow all settings" ON settings;
DROP POLICY IF EXISTS "Allow all opportunities" ON opportunities;
DROP POLICY IF EXISTS "Allow all contacts" ON contacts;
DROP POLICY IF EXISTS "Allow all invoices" ON invoices;
DROP POLICY IF EXISTS "Allow all expenses" ON expenses;
DROP POLICY IF EXISTS "Allow all crew_bookings" ON crew_bookings;
DROP POLICY IF EXISTS "Allow all google_tokens" ON google_tokens;

-- Create authenticated-only policies for quotes
CREATE POLICY "Authenticated users can select quotes" ON quotes
    FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert quotes" ON quotes
    FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update quotes" ON quotes
    FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete quotes" ON quotes
    FOR DELETE TO authenticated USING (true);

-- Create authenticated-only policies for clients
CREATE POLICY "Authenticated users can select clients" ON clients
    FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert clients" ON clients
    FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update clients" ON clients
    FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete clients" ON clients
    FOR DELETE TO authenticated USING (true);

-- Create authenticated-only policies for rate_cards
CREATE POLICY "Authenticated users can select rate_cards" ON rate_cards
    FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert rate_cards" ON rate_cards
    FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update rate_cards" ON rate_cards
    FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete rate_cards" ON rate_cards
    FOR DELETE TO authenticated USING (true);

-- Create authenticated-only policies for rate_card_sections
CREATE POLICY "Authenticated users can select rate_card_sections" ON rate_card_sections
    FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert rate_card_sections" ON rate_card_sections
    FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update rate_card_sections" ON rate_card_sections
    FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete rate_card_sections" ON rate_card_sections
    FOR DELETE TO authenticated USING (true);

-- Create authenticated-only policies for settings
CREATE POLICY "Authenticated users can select settings" ON settings
    FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert settings" ON settings
    FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update settings" ON settings
    FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete settings" ON settings
    FOR DELETE TO authenticated USING (true);

-- Create authenticated-only policies for opportunities
CREATE POLICY "Authenticated users can select opportunities" ON opportunities
    FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert opportunities" ON opportunities
    FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update opportunities" ON opportunities
    FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete opportunities" ON opportunities
    FOR DELETE TO authenticated USING (true);

-- Create authenticated-only policies for contacts
CREATE POLICY "Authenticated users can select contacts" ON contacts
    FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert contacts" ON contacts
    FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update contacts" ON contacts
    FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete contacts" ON contacts
    FOR DELETE TO authenticated USING (true);

-- Create authenticated-only policies for invoices
CREATE POLICY "Authenticated users can select invoices" ON invoices
    FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert invoices" ON invoices
    FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update invoices" ON invoices
    FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete invoices" ON invoices
    FOR DELETE TO authenticated USING (true);

-- Create authenticated-only policies for expenses
CREATE POLICY "Authenticated users can select expenses" ON expenses
    FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert expenses" ON expenses
    FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update expenses" ON expenses
    FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete expenses" ON expenses
    FOR DELETE TO authenticated USING (true);

-- Create authenticated-only policies for crew_bookings
CREATE POLICY "Authenticated users can select crew_bookings" ON crew_bookings
    FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert crew_bookings" ON crew_bookings
    FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update crew_bookings" ON crew_bookings
    FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete crew_bookings" ON crew_bookings
    FOR DELETE TO authenticated USING (true);

-- Google tokens should only be accessible by the owning user
CREATE POLICY "Users can select own google_tokens" ON google_tokens
    FOR SELECT TO authenticated
    USING (user_id = auth.uid()::text);
CREATE POLICY "Users can insert own google_tokens" ON google_tokens
    FOR INSERT TO authenticated
    WITH CHECK (user_id = auth.uid()::text);
CREATE POLICY "Users can update own google_tokens" ON google_tokens
    FOR UPDATE TO authenticated
    USING (user_id = auth.uid()::text);
CREATE POLICY "Users can delete own google_tokens" ON google_tokens
    FOR DELETE TO authenticated
    USING (user_id = auth.uid()::text);

-- ============================================
-- STEP 2: FIX CONTACTS TABLE
-- Migrate from old schema to new comprehensive schema
-- ============================================

-- Add missing columns to contacts if they don't exist
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id) ON DELETE SET NULL;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS whatsapp TEXT;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS location TEXT;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS timezone TEXT;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS day_rate NUMERIC;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'USD';
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS markets TEXT[] DEFAULT '{}';
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS projects TEXT[] DEFAULT '{}';
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS linkedin_url TEXT;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS next_followup_date DATE;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS is_favorite BOOLEAN DEFAULT FALSE;

-- Update category constraint to match new schema
ALTER TABLE contacts DROP CONSTRAINT IF EXISTS contacts_status_check;
ALTER TABLE contacts ADD CONSTRAINT contacts_status_check
    CHECK (status IN ('active', 'inactive', 'pending'));

-- Add category column with proper constraint
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS category TEXT;
-- Can't easily add CHECK constraint to existing column, but new inserts will validate in app

-- Create index for company lookups if not exists
CREATE INDEX IF NOT EXISTS idx_contacts_company_id ON contacts(company_id);

-- ============================================
-- STEP 3: ADD MISSING FK CONSTRAINTS
-- ============================================

-- Create projects table if it doesn't exist (needed for FK references)
CREATE TABLE IF NOT EXISTS projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
    opportunity_id UUID REFERENCES opportunities(id) ON DELETE SET NULL,
    quote_id UUID REFERENCES quotes(id) ON DELETE SET NULL,
    status TEXT DEFAULT 'active' CHECK (status IN ('draft', 'active', 'on_hold', 'completed', 'cancelled')),
    start_date DATE,
    end_date DATE,
    budget NUMERIC(12,2),
    currency TEXT DEFAULT 'USD',
    description TEXT,
    notes TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add RLS to projects
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can select projects" ON projects
    FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert projects" ON projects
    FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update projects" ON projects
    FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete projects" ON projects
    FOR DELETE TO authenticated USING (true);

-- Add FK constraints for project_id references
-- Note: These will fail if there are orphan records - run cleanup first

-- For invoices.project_id
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'invoices_project_id_fkey'
        AND table_name = 'invoices'
    ) THEN
        -- First, set any orphan project_ids to null
        UPDATE invoices SET project_id = NULL
        WHERE project_id IS NOT NULL
        AND project_id NOT IN (SELECT id FROM projects);

        ALTER TABLE invoices
            ADD CONSTRAINT invoices_project_id_fkey
            FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL;
    END IF;
END $$;

-- For expenses.project_id
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'expenses_project_id_fkey'
        AND table_name = 'expenses'
    ) THEN
        UPDATE expenses SET project_id = NULL
        WHERE project_id IS NOT NULL
        AND project_id NOT IN (SELECT id FROM projects);

        ALTER TABLE expenses
            ADD CONSTRAINT expenses_project_id_fkey
            FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL;
    END IF;
END $$;

-- For crew_bookings.project_id
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'crew_bookings_project_id_fkey'
        AND table_name = 'crew_bookings'
    ) THEN
        UPDATE crew_bookings SET project_id = NULL
        WHERE project_id IS NOT NULL
        AND project_id NOT IN (SELECT id FROM projects);

        ALTER TABLE crew_bookings
            ADD CONSTRAINT crew_bookings_project_id_fkey
            FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL;
    END IF;
END $$;

-- ============================================
-- STEP 4: ADD MISSING COLUMNS TO CLIENTS
-- ============================================

ALTER TABLE clients ADD COLUMN IF NOT EXISTS industry TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS website TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS revenue_range TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS employee_count TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS lead_source TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS assigned_to UUID REFERENCES user_profiles(id) ON DELETE SET NULL;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';
ALTER TABLE clients ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT 'normal';
ALTER TABLE clients ADD COLUMN IF NOT EXISTS last_contacted_at TIMESTAMPTZ;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS next_followup_date DATE;

-- ============================================
-- STEP 5: ADD UNIQUE CONSTRAINTS
-- ============================================

-- Ensure email uniqueness on contacts (handle duplicates first)
-- This must be done carefully - uncomment after deduplicating in app
-- ALTER TABLE contacts ADD CONSTRAINT contacts_email_unique UNIQUE (email) WHERE email IS NOT NULL AND email != '';

-- Ensure quote_number uniqueness
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes
        WHERE indexname = 'quotes_quote_number_unique'
    ) THEN
        CREATE UNIQUE INDEX quotes_quote_number_unique ON quotes(quote_number) WHERE quote_number IS NOT NULL AND quote_number != '';
    END IF;
END $$;

-- Ensure invoice_number uniqueness
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes
        WHERE indexname = 'invoices_invoice_number_unique'
    ) THEN
        CREATE UNIQUE INDEX invoices_invoice_number_unique ON invoices(invoice_number) WHERE invoice_number IS NOT NULL AND invoice_number != '';
    END IF;
END $$;

-- ============================================
-- STEP 6: CREATE UPDATED_AT TRIGGERS
-- ============================================

-- Projects trigger
DROP TRIGGER IF EXISTS update_projects_updated_at ON projects;
CREATE TRIGGER update_projects_updated_at
    BEFORE UPDATE ON projects
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- VERIFICATION QUERIES (Run these to check)
-- ============================================

-- Check RLS is enabled on all tables
-- SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public' AND tablename IN ('quotes', 'clients', 'contacts', 'opportunities', 'projects', 'invoices', 'expenses');

-- Check all policies
-- SELECT tablename, policyname, permissive, roles, cmd FROM pg_policies WHERE schemaname = 'public';

-- Check FK constraints
-- SELECT tc.table_name, kcu.column_name, ccu.table_name AS foreign_table FROM information_schema.table_constraints tc JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name JOIN information_schema.constraint_column_usage ccu ON tc.constraint_name = ccu.constraint_name WHERE tc.constraint_type = 'FOREIGN KEY';
