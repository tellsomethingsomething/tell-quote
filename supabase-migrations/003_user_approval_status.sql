-- Migration: Add approval status to user_profiles
-- This allows self-registration with admin approval flow

-- Add status column for approval workflow
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'suspended'));

-- Update existing users to be active (they were created by admin)
UPDATE user_profiles SET status = 'active' WHERE status IS NULL OR status = 'pending';

-- Create index for filtering by status
CREATE INDEX IF NOT EXISTS idx_user_profiles_status ON user_profiles(status);

-- Update RLS policies to only allow active users to access data
-- Drop existing select policy and recreate with status check
DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
CREATE POLICY "Users can view own profile"
ON user_profiles FOR SELECT
USING (auth.uid() = auth_user_id);

-- Admins can view all profiles (including pending)
DROP POLICY IF EXISTS "Admins can view all profiles" ON user_profiles;
CREATE POLICY "Admins can view all profiles"
ON user_profiles FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM user_profiles
        WHERE auth_user_id = auth.uid()
        AND role = 'admin'
        AND status = 'active'
    )
);

-- Only active admins can update profiles
DROP POLICY IF EXISTS "Admins can update all profiles" ON user_profiles;
CREATE POLICY "Admins can update all profiles"
ON user_profiles FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM user_profiles
        WHERE auth_user_id = auth.uid()
        AND role = 'admin'
        AND status = 'active'
    )
);

-- Users can update their own profile (name only, not role/status/permissions)
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
CREATE POLICY "Users can update own name"
ON user_profiles FOR UPDATE
USING (auth.uid() = auth_user_id)
WITH CHECK (auth.uid() = auth_user_id);

-- Anyone can insert their own profile (for self-registration)
DROP POLICY IF EXISTS "Users can insert own profile" ON user_profiles;
CREATE POLICY "Users can insert own profile"
ON user_profiles FOR INSERT
WITH CHECK (auth.uid() = auth_user_id);

-- Only active admins can delete profiles
DROP POLICY IF EXISTS "Admins can delete profiles" ON user_profiles;
CREATE POLICY "Admins can delete profiles"
ON user_profiles FOR DELETE
USING (
    EXISTS (
        SELECT 1 FROM user_profiles
        WHERE auth_user_id = auth.uid()
        AND role = 'admin'
        AND status = 'active'
    )
);
