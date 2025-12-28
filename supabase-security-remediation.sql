-- =============================================================================
-- ProductionOS Supabase Security Remediation
-- Generated: 2025-12-28
-- Based on: audit.md findings
-- =============================================================================

-- IMPORTANT: These scripts should be run in the Supabase SQL Editor
-- Go to: https://supabase.com/dashboard/project/deitlnfumugxcbxqqivk/sql/new

-- =============================================================================
-- STEP 1: VERIFY RLS IS ENABLED ON ALL TABLES
-- =============================================================================

-- Check current RLS status for all public tables
SELECT
    schemaname,
    tablename,
    rowsecurity as "RLS Enabled"
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- =============================================================================
-- STEP 2: ENABLE RLS ON ALL PUBLIC TABLES (if not already enabled)
-- =============================================================================

-- This script enables RLS on ALL tables in the public schema
-- Tables that already have RLS enabled will not be affected

DO $$
DECLARE
    t text;
BEGIN
    FOR t IN
        SELECT tablename
        FROM pg_tables
        WHERE schemaname = 'public'
        AND rowsecurity = false
    LOOP
        EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
        RAISE NOTICE 'Enabled RLS on table: %', t;
    END LOOP;
END $$;

-- =============================================================================
-- STEP 3: VERIFY ALL TABLES HAVE RLS POLICIES
-- =============================================================================

-- List tables that have RLS enabled but NO policies (dangerous!)
SELECT
    t.tablename,
    CASE WHEN p.tablename IS NULL THEN '⚠️ NO POLICIES' ELSE '✓ Has policies' END as status
FROM pg_tables t
LEFT JOIN (
    SELECT DISTINCT tablename FROM pg_policies WHERE schemaname = 'public'
) p ON t.tablename = p.tablename
WHERE t.schemaname = 'public'
ORDER BY status DESC, t.tablename;

-- =============================================================================
-- STEP 4: VIEW ALL EXISTING RLS POLICIES
-- =============================================================================

SELECT
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual as "USING clause",
    with_check as "WITH CHECK clause"
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- =============================================================================
-- STEP 5: EXAMPLE POLICIES FOR MULTI-TENANT ISOLATION
-- =============================================================================

-- These are EXAMPLES - adjust based on your actual table structure
-- The key is ensuring all data access is filtered by organization_id

/*
-- Example: Projects table policy
CREATE POLICY "Users can only view their organization's projects"
ON projects FOR SELECT
USING (
    organization_id IN (
        SELECT organization_id
        FROM organization_members
        WHERE user_id = auth.uid()
    )
);

CREATE POLICY "Users can only insert into their organization"
ON projects FOR INSERT
WITH CHECK (
    organization_id IN (
        SELECT organization_id
        FROM organization_members
        WHERE user_id = auth.uid()
    )
);

CREATE POLICY "Users can only update their organization's projects"
ON projects FOR UPDATE
USING (
    organization_id IN (
        SELECT organization_id
        FROM organization_members
        WHERE user_id = auth.uid()
    )
);

CREATE POLICY "Users can only delete their organization's projects"
ON projects FOR DELETE
USING (
    organization_id IN (
        SELECT organization_id
        FROM organization_members
        WHERE user_id = auth.uid()
    )
);
*/

-- =============================================================================
-- STEP 6: TEST RLS AS ANONYMOUS USER
-- =============================================================================

-- Test that anonymous users cannot access data
-- Run these queries and verify they return EMPTY results

-- Test as anon user (should return nothing)
-- SELECT * FROM projects LIMIT 5;
-- SELECT * FROM clients LIMIT 5;
-- SELECT * FROM invoices LIMIT 5;

-- =============================================================================
-- CRITICAL: DISABLE OPENAPI SPEC EXPOSURE
-- =============================================================================

-- This cannot be done via SQL - it must be done in the Supabase Dashboard:
--
-- 1. Go to: https://supabase.com/dashboard/project/deitlnfumugxcbxqqivk/settings/api
-- 2. Find "Expose OpenAPI spec" toggle
-- 3. Set it to OFF
--
-- This prevents attackers from seeing your complete database schema including:
-- - All 88 table names
-- - All column definitions
-- - All RPC function signatures
--
-- Without this, attackers can map your entire database structure.

-- =============================================================================
-- VERIFICATION QUERIES
-- =============================================================================

-- After applying changes, run these to verify:

-- 1. Verify RLS is enabled on all tables (should show TRUE for all)
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
AND rowsecurity = false;
-- Expected: Empty result (no tables with RLS disabled)

-- 2. Check that critical tables have policies
SELECT tablename, COUNT(*) as policy_count
FROM pg_policies
WHERE schemaname = 'public'
AND tablename IN (
    'projects', 'clients', 'invoices', 'quotes',
    'organizations', 'organization_members', 'user_profiles',
    'billing_invoices', 'subscriptions', 'expenses'
)
GROUP BY tablename
ORDER BY policy_count;
-- Expected: Each table should have at least 1 policy

-- =============================================================================
-- NOTES
-- =============================================================================

-- 1. The anon key (eyJ...) is designed to be public - this is OK
-- 2. The real security comes from RLS policies
-- 3. Always test policies by:
--    a) Logging out and trying to access data
--    b) Logging in as a different org and trying to access other org's data
-- 4. Consider using Supabase's built-in advisors for security checks:
--    https://supabase.com/dashboard/project/deitlnfumugxcbxqqivk/advisors
