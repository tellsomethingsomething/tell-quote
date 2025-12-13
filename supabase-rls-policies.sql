-- =====================================================
-- SUPABASE ROW LEVEL SECURITY (RLS) POLICIES
-- Quote Tool - Secure Multi-User Configuration
-- =====================================================
--
-- This file contains proper RLS policies to replace the wide-open
-- "allow all" policies in the original schema.
--
-- SETUP INSTRUCTIONS:
-- 1. Run this in Supabase SQL Editor AFTER running supabase-schema.sql
-- 2. Create user accounts via Supabase Auth Dashboard or API
-- 3. Update VITE_APP_PASSWORD -> use Supabase Auth instead
--
-- SECURITY MODEL:
-- - All tables require authentication (auth.uid() IS NOT NULL)
-- - Each row has user_id column linking to auth.users
-- - Users can only access their own data
-- - Future: Add shared access / team collaboration
-- =====================================================

-- =====================================================
-- STEP 1: Add user_id columns to all tables
-- =====================================================

-- Add user_id to quotes table
ALTER TABLE quotes
ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

-- Add user_id to clients table
ALTER TABLE clients
ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

-- Add user_id to rate_cards table
ALTER TABLE rate_cards
ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

-- Add user_id to rate_card_sections table
ALTER TABLE rate_card_sections
ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

-- Add user_id to settings table
ALTER TABLE settings
ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

-- Create opportunities table if not exists
CREATE TABLE IF NOT EXISTS opportunities (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    title text,
    client_id uuid REFERENCES clients(id) ON DELETE SET NULL,
    client jsonb DEFAULT '{}',
    region text,
    country text,
    status text DEFAULT 'active',
    value numeric DEFAULT 0,
    currency text DEFAULT 'USD',
    probability integer DEFAULT 50,
    source text,
    competitors text[] DEFAULT '{}',
    contacts jsonb DEFAULT '[]',
    account_owner_id text,
    brief text,
    notes text,
    next_action text,
    next_action_date date,
    expected_close_date date,
    converted_to_quote_id uuid REFERENCES quotes(id) ON DELETE SET NULL,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS on opportunities
ALTER TABLE opportunities ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- STEP 2: Create indexes for performance
-- =====================================================

CREATE INDEX IF NOT EXISTS quotes_user_id_idx ON quotes(user_id);
CREATE INDEX IF NOT EXISTS clients_user_id_idx ON clients(user_id);
CREATE INDEX IF NOT EXISTS rate_cards_user_id_idx ON rate_cards(user_id);
CREATE INDEX IF NOT EXISTS rate_card_sections_user_id_idx ON rate_card_sections(user_id);
CREATE INDEX IF NOT EXISTS settings_user_id_idx ON settings(user_id);
CREATE INDEX IF NOT EXISTS opportunities_user_id_idx ON opportunities(user_id);
CREATE INDEX IF NOT EXISTS opportunities_country_idx ON opportunities(country);
CREATE INDEX IF NOT EXISTS opportunities_status_idx ON opportunities(status);

-- =====================================================
-- STEP 3: Migrate existing data (SINGLE USER MIGRATION)
-- =====================================================
-- If you already have data, assign it to the first user
-- Replace 'YOUR_USER_ID_HERE' with actual user UUID from auth.users

-- Example migration (uncomment and update with real user ID):
/*
DO $$
DECLARE
    first_user_id uuid;
BEGIN
    -- Get the first user's ID (or create a user first)
    SELECT id INTO first_user_id FROM auth.users LIMIT 1;

    IF first_user_id IS NOT NULL THEN
        -- Migrate existing data to this user
        UPDATE quotes SET user_id = first_user_id WHERE user_id IS NULL;
        UPDATE clients SET user_id = first_user_id WHERE user_id IS NULL;
        UPDATE rate_cards SET user_id = first_user_id WHERE user_id IS NULL;
        UPDATE rate_card_sections SET user_id = first_user_id WHERE user_id IS NULL;
        UPDATE settings SET user_id = first_user_id WHERE user_id IS NULL;

        RAISE NOTICE 'Migrated existing data to user: %', first_user_id;
    ELSE
        RAISE NOTICE 'No users found. Create a user first via Supabase Auth.';
    END IF;
END $$;
*/

-- =====================================================
-- STEP 4: Drop old insecure policies
-- =====================================================

DROP POLICY IF EXISTS "Allow all quotes" ON quotes;
DROP POLICY IF EXISTS "Allow all clients" ON clients;
DROP POLICY IF EXISTS "Allow all rate_cards" ON rate_cards;
DROP POLICY IF EXISTS "Allow all rate_card_sections" ON rate_card_sections;
DROP POLICY IF EXISTS "Allow all settings" ON settings;

-- =====================================================
-- STEP 5: Create secure RLS policies
-- =====================================================

-- ========== QUOTES TABLE ==========

-- Users can view their own quotes
CREATE POLICY "Users can view own quotes"
ON quotes FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own quotes
CREATE POLICY "Users can insert own quotes"
ON quotes FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own quotes
CREATE POLICY "Users can update own quotes"
ON quotes FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Users can delete their own quotes
CREATE POLICY "Users can delete own quotes"
ON quotes FOR DELETE
USING (auth.uid() = user_id);

-- ========== CLIENTS TABLE ==========

-- Users can view their own clients
CREATE POLICY "Users can view own clients"
ON clients FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own clients
CREATE POLICY "Users can insert own clients"
ON clients FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own clients
CREATE POLICY "Users can update own clients"
ON clients FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Users can delete their own clients
CREATE POLICY "Users can delete own clients"
ON clients FOR DELETE
USING (auth.uid() = user_id);

-- ========== RATE CARDS TABLE ==========

-- Users can view their own rate cards
CREATE POLICY "Users can view own rate_cards"
ON rate_cards FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own rate cards
CREATE POLICY "Users can insert own rate_cards"
ON rate_cards FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own rate cards
CREATE POLICY "Users can update own rate_cards"
ON rate_cards FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Users can delete their own rate cards
CREATE POLICY "Users can delete own rate_cards"
ON rate_cards FOR DELETE
USING (auth.uid() = user_id);

-- ========== RATE CARD SECTIONS TABLE ==========

-- Users can view their own rate card sections
CREATE POLICY "Users can view own rate_card_sections"
ON rate_card_sections FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own rate card sections
CREATE POLICY "Users can insert own rate_card_sections"
ON rate_card_sections FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own rate card sections
CREATE POLICY "Users can update own rate_card_sections"
ON rate_card_sections FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Users can delete their own rate card sections
CREATE POLICY "Users can delete own rate_card_sections"
ON rate_card_sections FOR DELETE
USING (auth.uid() = user_id);

-- ========== SETTINGS TABLE ==========

-- Users can view their own settings
CREATE POLICY "Users can view own settings"
ON settings FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own settings
CREATE POLICY "Users can insert own settings"
ON settings FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own settings
CREATE POLICY "Users can update own settings"
ON settings FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Users can delete their own settings
CREATE POLICY "Users can delete own settings"
ON settings FOR DELETE
USING (auth.uid() = user_id);

-- ========== OPPORTUNITIES TABLE ==========

-- Users can view their own opportunities
CREATE POLICY "Users can view own opportunities"
ON opportunities FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own opportunities
CREATE POLICY "Users can insert own opportunities"
ON opportunities FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own opportunities
CREATE POLICY "Users can update own opportunities"
ON opportunities FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Users can delete their own opportunities
CREATE POLICY "Users can delete own opportunities"
ON opportunities FOR DELETE
USING (auth.uid() = user_id);

-- =====================================================
-- STEP 6: Helper Functions
-- =====================================================

-- Function to automatically set user_id on INSERT
CREATE OR REPLACE FUNCTION set_user_id()
RETURNS TRIGGER AS $$
BEGIN
    -- Only set user_id if not already set
    IF NEW.user_id IS NULL THEN
        NEW.user_id := auth.uid();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers to auto-set user_id
DROP TRIGGER IF EXISTS set_user_id_quotes ON quotes;
CREATE TRIGGER set_user_id_quotes
    BEFORE INSERT ON quotes
    FOR EACH ROW
    EXECUTE FUNCTION set_user_id();

DROP TRIGGER IF EXISTS set_user_id_clients ON clients;
CREATE TRIGGER set_user_id_clients
    BEFORE INSERT ON clients
    FOR EACH ROW
    EXECUTE FUNCTION set_user_id();

DROP TRIGGER IF EXISTS set_user_id_rate_cards ON rate_cards;
CREATE TRIGGER set_user_id_rate_cards
    BEFORE INSERT ON rate_cards
    FOR EACH ROW
    EXECUTE FUNCTION set_user_id();

DROP TRIGGER IF EXISTS set_user_id_rate_card_sections ON rate_card_sections;
CREATE TRIGGER set_user_id_rate_card_sections
    BEFORE INSERT ON rate_card_sections
    FOR EACH ROW
    EXECUTE FUNCTION set_user_id();

DROP TRIGGER IF EXISTS set_user_id_settings ON settings;
CREATE TRIGGER set_user_id_settings
    BEFORE INSERT ON settings
    FOR EACH ROW
    EXECUTE FUNCTION set_user_id();

DROP TRIGGER IF EXISTS set_user_id_opportunities ON opportunities;
CREATE TRIGGER set_user_id_opportunities
    BEFORE INSERT ON opportunities
    FOR EACH ROW
    EXECUTE FUNCTION set_user_id();

-- =====================================================
-- STEP 7: Future Multi-User Features (Optional)
-- =====================================================

-- Create a shared_access table for team collaboration
CREATE TABLE IF NOT EXISTS shared_access (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    resource_type text NOT NULL, -- 'quote', 'client', 'rate_card'
    resource_id uuid NOT NULL,
    owner_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    shared_with_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    permission text DEFAULT 'read', -- 'read', 'write', 'admin'
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(resource_type, resource_id, shared_with_id)
);

CREATE INDEX shared_access_owner_idx ON shared_access(owner_id);
CREATE INDEX shared_access_shared_with_idx ON shared_access(shared_with_id);
CREATE INDEX shared_access_resource_idx ON shared_access(resource_type, resource_id);

-- Example: Allow shared access to quotes
/*
CREATE POLICY "Users can view shared quotes"
ON quotes FOR SELECT
USING (
    auth.uid() = user_id
    OR
    EXISTS (
        SELECT 1 FROM shared_access
        WHERE resource_type = 'quote'
        AND resource_id = quotes.id
        AND shared_with_id = auth.uid()
    )
);
*/

-- =====================================================
-- STEP 8: Audit Log (Optional but Recommended)
-- =====================================================

CREATE TABLE IF NOT EXISTS audit_log (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    action text NOT NULL, -- 'INSERT', 'UPDATE', 'DELETE'
    table_name text NOT NULL,
    record_id uuid,
    old_data jsonb,
    new_data jsonb,
    ip_address inet,
    user_agent text,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX audit_log_user_id_idx ON audit_log(user_id);
CREATE INDEX audit_log_created_at_idx ON audit_log(created_at DESC);
CREATE INDEX audit_log_table_name_idx ON audit_log(table_name);

-- Enable RLS on audit log (users can only see their own logs)
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own audit logs"
ON audit_log FOR SELECT
USING (auth.uid() = user_id);

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Check that RLS is enabled on all tables
/*
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('quotes', 'clients', 'rate_cards', 'rate_card_sections', 'settings');
*/

-- List all policies
/*
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
*/

-- Count rows by user
/*
SELECT
    (SELECT COUNT(*) FROM quotes WHERE user_id = auth.uid()) as quotes,
    (SELECT COUNT(*) FROM clients WHERE user_id = auth.uid()) as clients,
    (SELECT COUNT(*) FROM rate_cards WHERE user_id = auth.uid()) as rate_cards;
*/

-- =====================================================
-- NOTES FOR DEVELOPERS
-- =====================================================
--
-- 1. CREATE USER ACCOUNTS:
--    - Via Supabase Dashboard: Authentication > Users > Add User
--    - Via API: Use createUserAccount() from src/lib/supabase.js
--    - First user should be created manually in Supabase dashboard
--
-- 2. MIGRATION FROM PASSWORD AUTH:
--    - Remove VITE_APP_PASSWORD from .env
--    - Create user account in Supabase with email/password
--    - Run migration script above to assign existing data
--    - Update LoginPage.jsx to use email/password fields
--
-- 3. TESTING RLS:
--    - Log in as different users
--    - Verify users can only see their own data
--    - Test that direct API calls respect RLS
--
-- 4. MONITORING:
--    - Enable audit_log to track all data changes
--    - Monitor failed auth attempts in Supabase logs
--    - Set up alerts for unusual activity
--
-- 5. BACKUP STRATEGY:
--    - Supabase automatically backs up your database
--    - Export settings regularly via app
--    - Keep local backups of critical data
--
-- =====================================================
