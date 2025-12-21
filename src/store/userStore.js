import { create } from 'zustand';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

// All available tabs/permissions
export const ALL_TABS = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'quotes', label: 'Quotes' },
    { id: 'clients', label: 'Clients' },
    { id: 'opportunities', label: 'Opportunities' },
    { id: 'tasks', label: 'Tasks' },
    { id: 'sop', label: 'SOP' },
    { id: 'knowledge', label: 'Research' },
    { id: 'kit', label: 'Kit' },
    { id: 'rate-card', label: 'Rate Card' },
    { id: 'contacts', label: 'Contacts' },
];

export const useUserStore = create((set, get) => ({
    users: [],
    isLoading: false,
    error: null,

    /**
     * Fetch all user profiles (admin only)
     */
    fetchUsers: async () => {
        if (!isSupabaseConfigured()) return;

        set({ isLoading: true, error: null });

        try {
            const { data, error } = await supabase
                .from('user_profiles')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) {
                console.error('Failed to fetch users:', error);
                set({ error: error.message, isLoading: false });
                return;
            }

            const users = data.map(u => ({
                id: u.id,
                authUserId: u.auth_user_id,
                name: u.name,
                email: u.email,
                role: u.role,
                status: u.status || 'active',
                tabPermissions: u.tab_permissions || [],
                createdAt: u.created_at,
                updatedAt: u.updated_at,
            }));

            set({ users, isLoading: false });
        } catch (e) {
            console.error('Failed to fetch users:', e);
            set({ error: e.message, isLoading: false });
        }
    },

    /**
     * Approve a pending user
     */
    approveUser: async (userId, permissions = []) => {
        if (!isSupabaseConfigured()) return false;

        set({ isLoading: true, error: null });

        try {
            // Default permissions for approved users
            const defaultPermissions = permissions.length > 0 ? permissions : [
                'dashboard',
                'quotes',
                'clients',
                'opportunities',
                'tasks',
            ];

            const { error } = await supabase
                .from('user_profiles')
                .update({
                    status: 'active',
                    tab_permissions: defaultPermissions,
                })
                .eq('id', userId);

            if (error) {
                console.error('Failed to approve user:', error);
                set({ error: error.message, isLoading: false });
                return false;
            }

            // Refresh users list
            await get().fetchUsers();
            return true;
        } catch (e) {
            console.error('Failed to approve user:', e);
            set({ error: e.message, isLoading: false });
            return false;
        }
    },

    /**
     * Suspend a user
     */
    suspendUser: async (userId) => {
        if (!isSupabaseConfigured()) return false;

        set({ isLoading: true, error: null });

        try {
            const { error } = await supabase
                .from('user_profiles')
                .update({ status: 'suspended' })
                .eq('id', userId);

            if (error) {
                console.error('Failed to suspend user:', error);
                set({ error: error.message, isLoading: false });
                return false;
            }

            await get().fetchUsers();
            return true;
        } catch (e) {
            console.error('Failed to suspend user:', e);
            set({ error: e.message, isLoading: false });
            return false;
        }
    },

    /**
     * Reactivate a suspended user
     */
    reactivateUser: async (userId) => {
        if (!isSupabaseConfigured()) return false;

        set({ isLoading: true, error: null });

        try {
            const { error } = await supabase
                .from('user_profiles')
                .update({ status: 'active' })
                .eq('id', userId);

            if (error) {
                console.error('Failed to reactivate user:', error);
                set({ error: error.message, isLoading: false });
                return false;
            }

            await get().fetchUsers();
            return true;
        } catch (e) {
            console.error('Failed to reactivate user:', e);
            set({ error: e.message, isLoading: false });
            return false;
        }
    },

    /**
     * Update user permissions
     */
    updateUserPermissions: async (userId, permissions) => {
        if (!isSupabaseConfigured()) return false;

        set({ isLoading: true, error: null });

        try {
            const { error } = await supabase
                .from('user_profiles')
                .update({ tab_permissions: permissions })
                .eq('id', userId);

            if (error) {
                console.error('Failed to update permissions:', error);
                set({ error: error.message, isLoading: false });
                return false;
            }

            await get().fetchUsers();
            return true;
        } catch (e) {
            console.error('Failed to update permissions:', e);
            set({ error: e.message, isLoading: false });
            return false;
        }
    },

    /**
     * Update user role (admin/user)
     */
    updateUserRole: async (userId, role) => {
        if (!isSupabaseConfigured()) return false;

        set({ isLoading: true, error: null });

        try {
            const updates = { role };

            // If promoting to admin, grant all permissions
            if (role === 'admin') {
                updates.tab_permissions = ALL_TABS.map(t => t.id);
            }

            const { error } = await supabase
                .from('user_profiles')
                .update(updates)
                .eq('id', userId);

            if (error) {
                console.error('Failed to update role:', error);
                set({ error: error.message, isLoading: false });
                return false;
            }

            await get().fetchUsers();
            return true;
        } catch (e) {
            console.error('Failed to update role:', e);
            set({ error: e.message, isLoading: false });
            return false;
        }
    },

    /**
     * Delete a user profile (and optionally auth user)
     */
    deleteUser: async (userId) => {
        if (!isSupabaseConfigured()) return false;

        set({ isLoading: true, error: null });

        try {
            const { error } = await supabase
                .from('user_profiles')
                .delete()
                .eq('id', userId);

            if (error) {
                console.error('Failed to delete user:', error);
                set({ error: error.message, isLoading: false });
                return false;
            }

            await get().fetchUsers();
            return true;
        } catch (e) {
            console.error('Failed to delete user:', e);
            set({ error: e.message, isLoading: false });
            return false;
        }
    },

    /**
     * Get pending users count
     */
    getPendingCount: () => {
        return get().users.filter(u => u.status === 'pending').length;
    },

    /**
     * Clear error
     */
    clearError: () => {
        set({ error: null });
    },
}));
