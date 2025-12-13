import { createClient } from '@supabase/supabase-js';

// Environment variables must be prefixed with VITE_ to be exposed to client
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Create client only if credentials are available
// Configure with enhanced security settings
export const supabase = supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey, {
        auth: {
            // Store session in localStorage (encrypted by Supabase)
            storage: window.localStorage,
            // Auto-refresh tokens
            autoRefreshToken: true,
            // Persist session across page reloads
            persistSession: true,
            // Detect session from URL (for magic links, OAuth)
            detectSessionInUrl: true,
            // Flow type for authentication
            flowType: 'pkce', // More secure than implicit flow
        },
        // Global headers for all requests
        global: {
            headers: {
                'x-application-name': 'tell-quote-tool',
            },
        },
        // Database settings
        db: {
            schema: 'public',
        },
        // Real-time settings (if needed in future)
        realtime: {
            params: {
                eventsPerSecond: 10,
            },
        },
    })
    : null;

// Helper to check if Supabase is configured (for data storage)
export const isSupabaseConfigured = () => !!supabase;

// Helper to check if Supabase AUTH should be used
// If VITE_APP_PASSWORD is set, use password auth instead of Supabase Auth
export const shouldUseSupabaseAuth = () => {
    const hasAppPassword = !!import.meta.env.VITE_APP_PASSWORD;
    // If password is configured, use password auth (not Supabase Auth)
    if (hasAppPassword) return false;
    // Otherwise, use Supabase Auth if Supabase is configured
    return isSupabaseConfigured();
};

/**
 * Helper to get current authenticated user
 */
export async function getCurrentUser() {
    if (!supabase) return null;

    try {
        const { data: { user }, error } = await supabase.auth.getUser();
        if (error) throw error;
        return user;
    } catch (error) {
        console.error('Error getting current user:', error);
        return null;
    }
}

/**
 * Helper to get current session
 */
export async function getCurrentSession() {
    if (!supabase) return null;

    try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) throw error;
        return session;
    } catch (error) {
        console.error('Error getting current session:', error);
        return null;
    }
}

/**
 * Set up Row Level Security context
 * This sets the user_id for RLS policies to use
 */
export async function setupRLSContext() {
    if (!supabase) return;

    try {
        const user = await getCurrentUser();
        if (!user) return;

        // Supabase automatically sets auth.uid() in RLS policies
        // No additional setup needed as the JWT contains user info
    } catch (error) {
        console.error('Error setting up RLS context:', error);
    }
}

/**
 * Sign out and clear all sessions
 */
export async function signOut() {
    if (!supabase) return;

    try {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
    } catch (error) {
        console.error('Error signing out:', error);
        throw error;
    }
}

/**
 * Check if user has admin role
 * This would need to be implemented based on your user management
 */
export async function isAdmin() {
    const user = await getCurrentUser();
    if (!user) return false;

    // For now, all authenticated users are admins (single-user tool)
    // In future, check user_metadata or a roles table
    return !!user;
}

/**
 * Create a new user account (requires admin privileges in Supabase)
 * This is for future multi-user support
 */
export async function createUserAccount(email, password, metadata = {}) {
    if (!supabase) {
        throw new Error('Supabase not configured');
    }

    try {
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    ...metadata,
                    created_at: new Date().toISOString(),
                },
            },
        });

        if (error) throw error;
        return data;
    } catch (error) {
        console.error('Error creating user account:', error);
        throw error;
    }
}

/**
 * Update user profile metadata
 */
export async function updateUserProfile(updates) {
    if (!supabase) {
        throw new Error('Supabase not configured');
    }

    try {
        const { data, error } = await supabase.auth.updateUser({
            data: updates,
        });

        if (error) throw error;
        return data;
    } catch (error) {
        console.error('Error updating user profile:', error);
        throw error;
    }
}

/**
 * Reset password (send reset email)
 */
export async function resetPassword(email) {
    if (!supabase) {
        throw new Error('Supabase not configured');
    }

    try {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/reset-password`,
        });

        if (error) throw error;
    } catch (error) {
        console.error('Error resetting password:', error);
        throw error;
    }
}

/**
 * Get database connection status
 */
export async function checkDatabaseConnection() {
    if (!supabase) return false;

    try {
        // Try a simple query to check connection
        const { error } = await supabase.from('settings').select('id').limit(1);
        return !error;
    } catch {
        return false;
    }
}
