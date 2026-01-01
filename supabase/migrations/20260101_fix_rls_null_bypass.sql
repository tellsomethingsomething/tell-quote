-- ============================================================
-- SECURITY FIX: Remove NULL organization_id bypass from RLS policies
-- This migration fixes the security vulnerability that allowed
-- users to access records with NULL organization_id
-- ============================================================

-- ============================================================
-- 1. AUDIT: Find records with NULL organization_id
-- Run this first to understand scope (commented out for safety)
-- ============================================================
-- SELECT 'quotes' as table_name, COUNT(*) FROM quotes WHERE organization_id IS NULL
-- UNION ALL SELECT 'clients', COUNT(*) FROM clients WHERE organization_id IS NULL
-- UNION ALL SELECT 'rate_cards', COUNT(*) FROM rate_cards WHERE organization_id IS NULL
-- UNION ALL SELECT 'settings', COUNT(*) FROM settings WHERE organization_id IS NULL
-- UNION ALL SELECT 'opportunities', COUNT(*) FROM opportunities WHERE organization_id IS NULL
-- UNION ALL SELECT 'rate_card_sections', COUNT(*) FROM rate_card_sections WHERE organization_id IS NULL;

-- ============================================================
-- 2. FIX RLS POLICIES - Remove NULL bypass for quotes
-- ============================================================
DROP POLICY IF EXISTS "Users can view org quotes" ON quotes;
CREATE POLICY "Users can view org quotes" ON quotes
    FOR SELECT USING (organization_id = get_user_organization_id());

DROP POLICY IF EXISTS "Users can insert org quotes" ON quotes;
CREATE POLICY "Users can insert org quotes" ON quotes
    FOR INSERT WITH CHECK (organization_id = get_user_organization_id());

DROP POLICY IF EXISTS "Users can update org quotes" ON quotes;
CREATE POLICY "Users can update org quotes" ON quotes
    FOR UPDATE USING (organization_id = get_user_organization_id());

DROP POLICY IF EXISTS "Users can delete org quotes" ON quotes;
CREATE POLICY "Users can delete org quotes" ON quotes
    FOR DELETE USING (organization_id = get_user_organization_id());

-- ============================================================
-- 3. FIX RLS POLICIES - Remove NULL bypass for clients
-- ============================================================
DROP POLICY IF EXISTS "Users can view org clients" ON clients;
CREATE POLICY "Users can view org clients" ON clients
    FOR SELECT USING (organization_id = get_user_organization_id());

DROP POLICY IF EXISTS "Users can insert org clients" ON clients;
CREATE POLICY "Users can insert org clients" ON clients
    FOR INSERT WITH CHECK (organization_id = get_user_organization_id());

DROP POLICY IF EXISTS "Users can update org clients" ON clients;
CREATE POLICY "Users can update org clients" ON clients
    FOR UPDATE USING (organization_id = get_user_organization_id());

DROP POLICY IF EXISTS "Users can delete org clients" ON clients;
CREATE POLICY "Users can delete org clients" ON clients
    FOR DELETE USING (organization_id = get_user_organization_id());

-- ============================================================
-- 4. FIX RLS POLICIES - Remove NULL bypass for rate_cards
-- ============================================================
DROP POLICY IF EXISTS "Users can view org rate_cards" ON rate_cards;
CREATE POLICY "Users can view org rate_cards" ON rate_cards
    FOR SELECT USING (organization_id = get_user_organization_id());

DROP POLICY IF EXISTS "Users can insert org rate_cards" ON rate_cards;
CREATE POLICY "Users can insert org rate_cards" ON rate_cards
    FOR INSERT WITH CHECK (organization_id = get_user_organization_id());

DROP POLICY IF EXISTS "Users can update org rate_cards" ON rate_cards;
CREATE POLICY "Users can update org rate_cards" ON rate_cards
    FOR UPDATE USING (organization_id = get_user_organization_id());

DROP POLICY IF EXISTS "Users can delete org rate_cards" ON rate_cards;
CREATE POLICY "Users can delete org rate_cards" ON rate_cards
    FOR DELETE USING (organization_id = get_user_organization_id());

-- ============================================================
-- 5. FIX RLS POLICIES - Remove NULL bypass for settings
-- ============================================================
DROP POLICY IF EXISTS "Users can view org settings" ON settings;
CREATE POLICY "Users can view org settings" ON settings
    FOR SELECT USING (organization_id = get_user_organization_id());

DROP POLICY IF EXISTS "Users can insert org settings" ON settings;
CREATE POLICY "Users can insert org settings" ON settings
    FOR INSERT WITH CHECK (organization_id = get_user_organization_id());

DROP POLICY IF EXISTS "Users can update org settings" ON settings;
CREATE POLICY "Users can update org settings" ON settings
    FOR UPDATE USING (organization_id = get_user_organization_id());

DROP POLICY IF EXISTS "Users can delete org settings" ON settings;
CREATE POLICY "Users can delete org settings" ON settings
    FOR DELETE USING (organization_id = get_user_organization_id());

-- ============================================================
-- 6. FIX RLS POLICIES - Remove NULL bypass for opportunities
-- ============================================================
DROP POLICY IF EXISTS "Users can view org opportunities" ON opportunities;
CREATE POLICY "Users can view org opportunities" ON opportunities
    FOR SELECT USING (organization_id = get_user_organization_id());

DROP POLICY IF EXISTS "Users can insert org opportunities" ON opportunities;
CREATE POLICY "Users can insert org opportunities" ON opportunities
    FOR INSERT WITH CHECK (organization_id = get_user_organization_id());

DROP POLICY IF EXISTS "Users can update org opportunities" ON opportunities;
CREATE POLICY "Users can update org opportunities" ON opportunities
    FOR UPDATE USING (organization_id = get_user_organization_id());

DROP POLICY IF EXISTS "Users can delete org opportunities" ON opportunities;
CREATE POLICY "Users can delete org opportunities" ON opportunities
    FOR DELETE USING (organization_id = get_user_organization_id());

-- ============================================================
-- 7. FIX RLS POLICIES - Remove NULL bypass for rate_card_sections
-- ============================================================
DROP POLICY IF EXISTS "Users can view org rate_card_sections" ON rate_card_sections;
CREATE POLICY "Users can view org rate_card_sections" ON rate_card_sections
    FOR SELECT USING (organization_id = get_user_organization_id());

DROP POLICY IF EXISTS "Users can insert org rate_card_sections" ON rate_card_sections;
CREATE POLICY "Users can insert org rate_card_sections" ON rate_card_sections
    FOR INSERT WITH CHECK (organization_id = get_user_organization_id());

DROP POLICY IF EXISTS "Users can update org rate_card_sections" ON rate_card_sections;
CREATE POLICY "Users can update org rate_card_sections" ON rate_card_sections
    FOR UPDATE USING (organization_id = get_user_organization_id());

DROP POLICY IF EXISTS "Users can delete org rate_card_sections" ON rate_card_sections;
CREATE POLICY "Users can delete org rate_card_sections" ON rate_card_sections
    FOR DELETE USING (organization_id = get_user_organization_id());

-- ============================================================
-- 8. ADD NOT NULL CONSTRAINTS (after data migration)
-- NOTE: Only run these after ensuring no NULL organization_id records exist
-- ============================================================
-- ALTER TABLE quotes ALTER COLUMN organization_id SET NOT NULL;
-- ALTER TABLE clients ALTER COLUMN organization_id SET NOT NULL;
-- ALTER TABLE rate_cards ALTER COLUMN organization_id SET NOT NULL;
-- ALTER TABLE settings ALTER COLUMN organization_id SET NOT NULL;
-- ALTER TABLE opportunities ALTER COLUMN organization_id SET NOT NULL;
-- ALTER TABLE rate_card_sections ALTER COLUMN organization_id SET NOT NULL;

-- ============================================================
-- SECURITY NOTE:
-- Before running this migration:
-- 1. Run the audit query above to identify orphaned records
-- 2. Either delete orphaned records or assign them to a valid organization
-- 3. After migration, optionally add NOT NULL constraints
-- ============================================================
