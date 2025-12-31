-- =====================================================
-- FIX: Sports Events RLS Policies
-- ProductionOS - Fix RLS error on sports_events table
-- =====================================================
-- The sports_events table has RLS enabled but no policies,
-- causing "new row violates row-level security policy" errors.
--
-- This script adds organization_id support and proper RLS policies.
-- =====================================================

-- Step 1: Add organization_id column if it doesn't exist
ALTER TABLE sports_events
ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE;

-- Step 2: Create index for performance
CREATE INDEX IF NOT EXISTS idx_sports_events_org ON sports_events(organization_id);

-- Step 3: Drop any existing policies
DROP POLICY IF EXISTS "Users can view own sports events" ON sports_events;
DROP POLICY IF EXISTS "Users can insert own sports events" ON sports_events;
DROP POLICY IF EXISTS "Users can update own sports events" ON sports_events;
DROP POLICY IF EXISTS "Users can delete own sports events" ON sports_events;
DROP POLICY IF EXISTS "org_sports_events_select" ON sports_events;
DROP POLICY IF EXISTS "org_sports_events_insert" ON sports_events;
DROP POLICY IF EXISTS "org_sports_events_update" ON sports_events;
DROP POLICY IF EXISTS "org_sports_events_delete" ON sports_events;

-- Step 4: Enable RLS
ALTER TABLE sports_events ENABLE ROW LEVEL SECURITY;

-- Step 5: Create organization-based RLS policies
-- SELECT: Users can view sports events in their organization (or events with no org - shared data)
CREATE POLICY "org_sports_events_select" ON sports_events
    FOR SELECT
    USING (
        organization_id IS NULL
        OR organization_id IN (
            SELECT organization_id FROM user_profiles WHERE id = auth.uid()
        )
    );

-- INSERT: Users can insert events for their organization
CREATE POLICY "org_sports_events_insert" ON sports_events
    FOR INSERT
    WITH CHECK (
        organization_id IS NULL
        OR organization_id IN (
            SELECT organization_id FROM user_profiles WHERE id = auth.uid()
        )
    );

-- UPDATE: Users can update events in their organization
CREATE POLICY "org_sports_events_update" ON sports_events
    FOR UPDATE
    USING (
        organization_id IS NULL
        OR organization_id IN (
            SELECT organization_id FROM user_profiles WHERE id = auth.uid()
        )
    );

-- DELETE: Users can delete events in their organization
CREATE POLICY "org_sports_events_delete" ON sports_events
    FOR DELETE
    USING (
        organization_id IS NULL
        OR organization_id IN (
            SELECT organization_id FROM user_profiles WHERE id = auth.uid()
        )
    );

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================
SELECT 'Sports Events RLS policies configured successfully!' as status;
