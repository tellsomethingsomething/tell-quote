-- =====================================================
-- ORGANIZATION-BASED ROW LEVEL SECURITY (RLS) POLICIES
-- ProductionOS - Multi-Tenant SaaS Security
-- Created: 2025-12-27
-- =====================================================
--
-- This migration implements proper organization-based RLS
-- to prevent cross-tenant data access.
--
-- SECURITY MODEL:
-- - Users can only access data from organizations they belong to
-- - Organization membership is checked via organization_members table
-- - Service role bypasses RLS for backend operations
-- =====================================================

-- =====================================================
-- STEP 1: Helper function to get user's organizations
-- =====================================================

-- Note: Using public schema since auth schema requires elevated permissions
CREATE OR REPLACE FUNCTION public.user_organizations()
RETURNS SETOF uuid AS $$
  SELECT organization_id
  FROM organization_members
  WHERE user_id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- =====================================================
-- STEP 2: Drop all existing permissive policies
-- =====================================================

-- Quotes
DROP POLICY IF EXISTS "Allow all quotes" ON quotes;
DROP POLICY IF EXISTS "Users can view own quotes" ON quotes;
DROP POLICY IF EXISTS "Users can insert own quotes" ON quotes;
DROP POLICY IF EXISTS "Users can update own quotes" ON quotes;
DROP POLICY IF EXISTS "Users can delete own quotes" ON quotes;

-- Clients
DROP POLICY IF EXISTS "Allow all clients" ON clients;
DROP POLICY IF EXISTS "Users can view own clients" ON clients;
DROP POLICY IF EXISTS "Users can insert own clients" ON clients;
DROP POLICY IF EXISTS "Users can update own clients" ON clients;
DROP POLICY IF EXISTS "Users can delete own clients" ON clients;

-- Projects
DROP POLICY IF EXISTS "Allow all projects" ON projects;
DROP POLICY IF EXISTS "Users can view own projects" ON projects;
DROP POLICY IF EXISTS "Users can insert own projects" ON projects;
DROP POLICY IF EXISTS "Users can update own projects" ON projects;
DROP POLICY IF EXISTS "Users can delete own projects" ON projects;

-- Opportunities
DROP POLICY IF EXISTS "Allow all opportunities" ON opportunities;
DROP POLICY IF EXISTS "Users can view own opportunities" ON opportunities;
DROP POLICY IF EXISTS "Users can insert own opportunities" ON opportunities;
DROP POLICY IF EXISTS "Users can update own opportunities" ON opportunities;
DROP POLICY IF EXISTS "Users can delete own opportunities" ON opportunities;

-- Rate cards
DROP POLICY IF EXISTS "Allow all rate_cards" ON rate_cards;
DROP POLICY IF EXISTS "Users can view own rate_cards" ON rate_cards;
DROP POLICY IF EXISTS "Users can insert own rate_cards" ON rate_cards;
DROP POLICY IF EXISTS "Users can update own rate_cards" ON rate_cards;
DROP POLICY IF EXISTS "Users can delete own rate_cards" ON rate_cards;

-- Settings
DROP POLICY IF EXISTS "Allow all settings" ON settings;
DROP POLICY IF EXISTS "Users can view own settings" ON settings;
DROP POLICY IF EXISTS "Users can insert own settings" ON settings;
DROP POLICY IF EXISTS "Users can update own settings" ON settings;
DROP POLICY IF EXISTS "Users can delete own settings" ON settings;

-- Activities
DROP POLICY IF EXISTS "Allow all activities" ON activities;

-- Invoices
DROP POLICY IF EXISTS "Allow all invoices" ON invoices;

-- Crew (table doesn't exist - skipped)
-- DROP POLICY IF EXISTS "Allow all crew" ON crew;

-- Equipment (table doesn't exist - skipped)
-- DROP POLICY IF EXISTS "Allow all equipment" ON equipment;

-- Templates (table doesn't exist - skipped)
-- DROP POLICY IF EXISTS "Allow all templates" ON templates;

-- =====================================================
-- STEP 3: Enable RLS on all organization-scoped tables
-- =====================================================

ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE rate_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE activities ENABLE ROW LEVEL SECURITY; (no organization_id column)
-- ALTER TABLE invoices ENABLE ROW LEVEL SECURITY; (no organization_id column)
-- ALTER TABLE crew ENABLE ROW LEVEL SECURITY; (table doesn't exist)
-- ALTER TABLE equipment ENABLE ROW LEVEL SECURITY; (table doesn't exist)
-- ALTER TABLE templates ENABLE ROW LEVEL SECURITY; (table doesn't exist)

-- =====================================================
-- STEP 4: Create organization-based policies
-- =====================================================

-- ========== QUOTES ==========
CREATE POLICY "org_quotes_select" ON quotes FOR SELECT
USING (organization_id IN (SELECT public.user_organizations()));

CREATE POLICY "org_quotes_insert" ON quotes FOR INSERT
WITH CHECK (organization_id IN (SELECT public.user_organizations()));

CREATE POLICY "org_quotes_update" ON quotes FOR UPDATE
USING (organization_id IN (SELECT public.user_organizations()))
WITH CHECK (organization_id IN (SELECT public.user_organizations()));

CREATE POLICY "org_quotes_delete" ON quotes FOR DELETE
USING (organization_id IN (SELECT public.user_organizations()));

-- ========== CLIENTS ==========
CREATE POLICY "org_clients_select" ON clients FOR SELECT
USING (organization_id IN (SELECT public.user_organizations()));

CREATE POLICY "org_clients_insert" ON clients FOR INSERT
WITH CHECK (organization_id IN (SELECT public.user_organizations()));

CREATE POLICY "org_clients_update" ON clients FOR UPDATE
USING (organization_id IN (SELECT public.user_organizations()))
WITH CHECK (organization_id IN (SELECT public.user_organizations()));

CREATE POLICY "org_clients_delete" ON clients FOR DELETE
USING (organization_id IN (SELECT public.user_organizations()));

-- ========== PROJECTS ==========
CREATE POLICY "org_projects_select" ON projects FOR SELECT
USING (organization_id IN (SELECT public.user_organizations()));

CREATE POLICY "org_projects_insert" ON projects FOR INSERT
WITH CHECK (organization_id IN (SELECT public.user_organizations()));

CREATE POLICY "org_projects_update" ON projects FOR UPDATE
USING (organization_id IN (SELECT public.user_organizations()))
WITH CHECK (organization_id IN (SELECT public.user_organizations()));

CREATE POLICY "org_projects_delete" ON projects FOR DELETE
USING (organization_id IN (SELECT public.user_organizations()));

-- ========== OPPORTUNITIES ==========
CREATE POLICY "org_opportunities_select" ON opportunities FOR SELECT
USING (organization_id IN (SELECT public.user_organizations()));

CREATE POLICY "org_opportunities_insert" ON opportunities FOR INSERT
WITH CHECK (organization_id IN (SELECT public.user_organizations()));

CREATE POLICY "org_opportunities_update" ON opportunities FOR UPDATE
USING (organization_id IN (SELECT public.user_organizations()))
WITH CHECK (organization_id IN (SELECT public.user_organizations()));

CREATE POLICY "org_opportunities_delete" ON opportunities FOR DELETE
USING (organization_id IN (SELECT public.user_organizations()));

-- ========== RATE CARDS ==========
CREATE POLICY "org_rate_cards_select" ON rate_cards FOR SELECT
USING (organization_id IN (SELECT public.user_organizations()));

CREATE POLICY "org_rate_cards_insert" ON rate_cards FOR INSERT
WITH CHECK (organization_id IN (SELECT public.user_organizations()));

CREATE POLICY "org_rate_cards_update" ON rate_cards FOR UPDATE
USING (organization_id IN (SELECT public.user_organizations()))
WITH CHECK (organization_id IN (SELECT public.user_organizations()));

CREATE POLICY "org_rate_cards_delete" ON rate_cards FOR DELETE
USING (organization_id IN (SELECT public.user_organizations()));

-- ========== SETTINGS ==========
CREATE POLICY "org_settings_select" ON settings FOR SELECT
USING (organization_id IN (SELECT public.user_organizations()));

CREATE POLICY "org_settings_insert" ON settings FOR INSERT
WITH CHECK (organization_id IN (SELECT public.user_organizations()));

CREATE POLICY "org_settings_update" ON settings FOR UPDATE
USING (organization_id IN (SELECT public.user_organizations()))
WITH CHECK (organization_id IN (SELECT public.user_organizations()));

CREATE POLICY "org_settings_delete" ON settings FOR DELETE
USING (organization_id IN (SELECT public.user_organizations()));

-- ========== ACTIVITIES (no organization_id column - skipped) ==========
-- CREATE POLICY "org_activities_select" ON activities FOR SELECT
-- USING (organization_id IN (SELECT public.user_organizations()));
-- CREATE POLICY "org_activities_insert" ON activities FOR INSERT
-- WITH CHECK (organization_id IN (SELECT public.user_organizations()));
-- CREATE POLICY "org_activities_update" ON activities FOR UPDATE
-- USING (organization_id IN (SELECT public.user_organizations()))
-- WITH CHECK (organization_id IN (SELECT public.user_organizations()));
-- CREATE POLICY "org_activities_delete" ON activities FOR DELETE
-- USING (organization_id IN (SELECT public.user_organizations()));

-- ========== INVOICES (no organization_id column - skipped) ==========
-- CREATE POLICY "org_invoices_select" ON invoices FOR SELECT
-- USING (organization_id IN (SELECT public.user_organizations()));
-- CREATE POLICY "org_invoices_insert" ON invoices FOR INSERT
-- WITH CHECK (organization_id IN (SELECT public.user_organizations()));
-- CREATE POLICY "org_invoices_update" ON invoices FOR UPDATE
-- USING (organization_id IN (SELECT public.user_organizations()))
-- WITH CHECK (organization_id IN (SELECT public.user_organizations()));
-- CREATE POLICY "org_invoices_delete" ON invoices FOR DELETE
-- USING (organization_id IN (SELECT public.user_organizations()));

-- ========== CREW (table doesn't exist - skipped) ==========
-- CREATE POLICY "org_crew_select" ON crew FOR SELECT
-- USING (organization_id IN (SELECT public.user_organizations()));
-- CREATE POLICY "org_crew_insert" ON crew FOR INSERT
-- WITH CHECK (organization_id IN (SELECT public.user_organizations()));
-- CREATE POLICY "org_crew_update" ON crew FOR UPDATE
-- USING (organization_id IN (SELECT public.user_organizations()))
-- WITH CHECK (organization_id IN (SELECT public.user_organizations()));
-- CREATE POLICY "org_crew_delete" ON crew FOR DELETE
-- USING (organization_id IN (SELECT public.user_organizations()));

-- ========== EQUIPMENT (table doesn't exist - skipped) ==========
-- CREATE POLICY "org_equipment_select" ON equipment FOR SELECT
-- USING (organization_id IN (SELECT public.user_organizations()));
-- CREATE POLICY "org_equipment_insert" ON equipment FOR INSERT
-- WITH CHECK (organization_id IN (SELECT public.user_organizations()));
-- CREATE POLICY "org_equipment_update" ON equipment FOR UPDATE
-- USING (organization_id IN (SELECT public.user_organizations()))
-- WITH CHECK (organization_id IN (SELECT public.user_organizations()));
-- CREATE POLICY "org_equipment_delete" ON equipment FOR DELETE
-- USING (organization_id IN (SELECT public.user_organizations()));

-- ========== TEMPLATES (table doesn't exist - skipped) ==========
-- CREATE POLICY "org_templates_select" ON templates FOR SELECT
-- USING (organization_id IN (SELECT public.user_organizations()));
-- CREATE POLICY "org_templates_insert" ON templates FOR INSERT
-- WITH CHECK (organization_id IN (SELECT public.user_organizations()));
-- CREATE POLICY "org_templates_update" ON templates FOR UPDATE
-- USING (organization_id IN (SELECT public.user_organizations()))
-- WITH CHECK (organization_id IN (SELECT public.user_organizations()));
-- CREATE POLICY "org_templates_delete" ON templates FOR DELETE
-- USING (organization_id IN (SELECT public.user_organizations()));

-- =====================================================
-- STEP 5: Organization management tables (special rules)
-- =====================================================

-- Organization members - users can see members of their orgs
ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "org_members_select" ON organization_members;
CREATE POLICY "org_members_select" ON organization_members FOR SELECT
USING (organization_id IN (SELECT public.user_organizations()));

-- Only org admins/owners can manage members
DROP POLICY IF EXISTS "org_members_insert" ON organization_members;
CREATE POLICY "org_members_insert" ON organization_members FOR INSERT
WITH CHECK (
  organization_id IN (
    SELECT organization_id FROM organization_members
    WHERE user_id = auth.uid() AND role IN ('owner', 'admin')   )
);

DROP POLICY IF EXISTS "org_members_update" ON organization_members;
CREATE POLICY "org_members_update" ON organization_members FOR UPDATE
USING (
  organization_id IN (
    SELECT organization_id FROM organization_members
    WHERE user_id = auth.uid() AND role IN ('owner', 'admin')   )
);

DROP POLICY IF EXISTS "org_members_delete" ON organization_members;
CREATE POLICY "org_members_delete" ON organization_members FOR DELETE
USING (
  organization_id IN (
    SELECT organization_id FROM organization_members
    WHERE user_id = auth.uid() AND role IN ('owner', 'admin')   )
);

-- =====================================================
-- STEP 6: User invitations - special handling
-- =====================================================

ALTER TABLE user_invitations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "org_invitations_select" ON user_invitations;
CREATE POLICY "org_invitations_select" ON user_invitations FOR SELECT
USING (organization_id IN (SELECT public.user_organizations()));

DROP POLICY IF EXISTS "org_invitations_insert" ON user_invitations;
CREATE POLICY "org_invitations_insert" ON user_invitations FOR INSERT
WITH CHECK (
  organization_id IN (
    SELECT organization_id FROM organization_members
    WHERE user_id = auth.uid() AND role IN ('owner', 'admin')   )
);

DROP POLICY IF EXISTS "org_invitations_delete" ON user_invitations;
CREATE POLICY "org_invitations_delete" ON user_invitations FOR DELETE
USING (
  organization_id IN (
    SELECT organization_id FROM organization_members
    WHERE user_id = auth.uid() AND role IN ('owner', 'admin')   )
);

-- =====================================================
-- STEP 7: Subscriptions - org-level access
-- =====================================================

ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "org_subscriptions_select" ON subscriptions;
CREATE POLICY "org_subscriptions_select" ON subscriptions FOR SELECT
USING (organization_id IN (SELECT public.user_organizations()));

-- Only service role can modify subscriptions (Stripe webhooks)
DROP POLICY IF EXISTS "org_subscriptions_insert" ON subscriptions;
DROP POLICY IF EXISTS "org_subscriptions_update" ON subscriptions;

-- =====================================================
-- STEP 8: Google/Email connections - user-level
-- =====================================================

ALTER TABLE google_connections ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "user_google_connections" ON google_connections;
CREATE POLICY "user_google_connections_select" ON google_connections FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "user_google_connections_insert" ON google_connections FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY "user_google_connections_update" ON google_connections FOR UPDATE
USING (user_id = auth.uid());

CREATE POLICY "user_google_connections_delete" ON google_connections FOR DELETE
USING (user_id = auth.uid());

-- =====================================================
-- STEP 9: User profiles - public read, own write
-- =====================================================

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Users can see profiles of members in their orgs
DROP POLICY IF EXISTS "profiles_select" ON user_profiles;
CREATE POLICY "profiles_select" ON user_profiles FOR SELECT
USING (
  id = auth.uid()
  OR id IN (
    SELECT user_id FROM organization_members
    WHERE organization_id IN (SELECT public.user_organizations())
  )
);

-- Users can only update their own profile
DROP POLICY IF EXISTS "profiles_update" ON user_profiles;
CREATE POLICY "profiles_update" ON user_profiles FOR UPDATE
USING (id = auth.uid());

-- =====================================================
-- VERIFICATION QUERY (run after migration)
-- =====================================================
-- SELECT schemaname, tablename, policyname, permissive, cmd
-- FROM pg_policies WHERE schemaname = 'public'
-- ORDER BY tablename, cmd;
