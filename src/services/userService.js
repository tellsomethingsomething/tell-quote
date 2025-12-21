import { supabase, isSupabaseConfigured } from '../lib/supabase';

/**
 * Fetch all user profiles (for admin user management)
 */
export async function fetchAllUsers() {
    if (!isSupabaseConfigured()) {
        console.warn('Supabase not configured, cannot fetch users');
        return [];
    }

    const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .order('created_at', { ascending: true });

    if (error) {
        console.error('Failed to fetch users:', error);
        throw error;
    }

    return data.map(user => ({
        id: user.id,
        authUserId: user.auth_user_id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status || 'active',
        tabPermissions: user.tab_permissions || [],
        createdAt: user.created_at,
        updatedAt: user.updated_at,
    }));
}

/**
 * Create a new user (calls Edge Function)
 */
export async function createUser({ email, password, name, role, tabPermissions }) {
    if (!isSupabaseConfigured()) {
        throw new Error('Supabase not configured');
    }

    const { data, error } = await supabase.functions.invoke('create-user', {
        body: { email, password, name, role, tabPermissions },
    });

    if (error) {
        console.error('Failed to create user:', error);
        throw new Error(error.message || 'Failed to create user');
    }

    if (data?.error) {
        throw new Error(data.error);
    }

    return data.user;
}

/**
 * Update a user profile
 */
export async function updateUserProfile(profileId, updates) {
    if (!isSupabaseConfigured()) {
        throw new Error('Supabase not configured');
    }

    // Map frontend field names to database column names
    const dbUpdates = {};
    if (updates.name !== undefined) dbUpdates.name = updates.name;
    if (updates.role !== undefined) dbUpdates.role = updates.role;
    if (updates.status !== undefined) dbUpdates.status = updates.status;
    if (updates.tabPermissions !== undefined) dbUpdates.tab_permissions = updates.tabPermissions;

    const { data, error } = await supabase
        .from('user_profiles')
        .update(dbUpdates)
        .eq('id', profileId)
        .select()
        .single();

    if (error) {
        console.error('Failed to update user:', error);
        throw error;
    }

    return {
        id: data.id,
        authUserId: data.auth_user_id,
        name: data.name,
        email: data.email,
        role: data.role,
        status: data.status || 'active',
        tabPermissions: data.tab_permissions || [],
    };
}

/**
 * Approve a pending user (set status to active)
 */
export async function approveUser(profileId, tabPermissions = DEFAULT_TAB_PERMISSIONS) {
    return updateUserProfile(profileId, {
        status: 'active',
        tabPermissions,
    });
}

/**
 * Reject/Suspend a user
 */
export async function suspendUser(profileId) {
    return updateUserProfile(profileId, {
        status: 'suspended',
    });
}

/**
 * Delete a user (calls Edge Function)
 */
export async function deleteUser(authUserId) {
    if (!isSupabaseConfigured()) {
        throw new Error('Supabase not configured');
    }

    const { data, error } = await supabase.functions.invoke('delete-user', {
        body: { authUserId },
    });

    if (error) {
        console.error('Failed to delete user:', error);
        throw new Error(error.message || 'Failed to delete user');
    }

    if (data?.error) {
        throw new Error(data.error);
    }

    return true;
}

/**
 * Change current user's password
 */
export async function changePassword(newPassword) {
    if (!isSupabaseConfigured()) {
        throw new Error('Supabase not configured');
    }

    const { error } = await supabase.auth.updateUser({
        password: newPassword,
    });

    if (error) {
        console.error('Failed to change password:', error);
        throw error;
    }

    return true;
}

/**
 * Send password reset email
 */
export async function sendPasswordReset(email) {
    if (!isSupabaseConfigured()) {
        throw new Error('Supabase not configured');
    }

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) {
        console.error('Failed to send password reset:', error);
        throw error;
    }

    return true;
}

/**
 * Generate a random password
 */
export function generateRandomPassword(length = 12) {
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < length; i++) {
        password += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    return password;
}

/**
 * Available tabs that can be assigned to users
 */
export const AVAILABLE_TABS = [
    { id: 'dashboard', label: 'Dashboard', description: 'Overview and analytics' },
    { id: 'quotes', label: 'Quotes', description: 'Quote management' },
    { id: 'clients', label: 'Clients', description: 'Client database' },
    { id: 'opportunities', label: 'Opportunities', description: 'Sales pipeline' },
    { id: 'tasks', label: 'Tasks', description: 'Commercial tasks' },
    { id: 'sop', label: 'SOP', description: 'Standard operating procedures' },
    { id: 'knowledge', label: 'Research', description: 'Knowledge base and research' },
    { id: 'kit', label: 'Kit', description: 'Equipment inventory' },
    { id: 'rate-card', label: 'Rate Card', description: 'Pricing rates' },
    { id: 'contacts', label: 'Contacts', description: 'Contact management' },
    { id: 'settings', label: 'Settings', description: 'System configuration (Admin only)' },
];

/**
 * Default tab permissions for new users
 */
export const DEFAULT_TAB_PERMISSIONS = ['dashboard', 'quotes', 'clients', 'opportunities', 'tasks'];
