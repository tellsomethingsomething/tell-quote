/**
 * Auth Management Store
 *
 * Consolidated store combining:
 * - authStore (authentication and session)
 * - userStore (user profiles and preferences)
 * - aiUsageStore (AI token usage tracking)
 *
 * MIGRATION GUIDE:
 * Old: import { useAuthStore } from './authStore'
 * New: import { useAuthStore } from './authManagementStore'
 */

// Re-export all original stores for backward compatibility
export { useAuthStore } from './authStore';
export { useUserStore } from './userStore';
export { useAiUsageStore } from './aiUsageStore';

/**
 * Unified auth management hook
 */
export function useAuthManagement() {
    const { useAuthStore } = require('./authStore');
    const { useUserStore } = require('./userStore');
    const { useAiUsageStore } = require('./aiUsageStore');

    const authStore = useAuthStore();
    const userStore = useUserStore();
    const aiUsageStore = useAiUsageStore();

    return {
        // Authentication
        user: authStore.user,
        session: authStore.session,
        isAuthenticated: authStore.isAuthenticated,
        signIn: authStore.signIn,
        signOut: authStore.signOut,
        signUp: authStore.signUp,
        resetPassword: authStore.resetPassword,
        updatePassword: authStore.updatePassword,

        // User profile
        profile: userStore.profile,
        loadProfile: userStore.initialize,
        updateProfile: userStore.updateProfile,
        updatePreferences: userStore.updatePreferences,
        getPreferences: userStore.getPreferences,

        // AI usage
        aiTokens: aiUsageStore.tokens,
        aiUsage: aiUsageStore.usage,
        loadAiUsage: aiUsageStore.initialize,
        trackAiUsage: aiUsageStore.trackUsage,
        getAiUsageStats: aiUsageStore.getStats,
        getRemainingTokens: aiUsageStore.getRemainingTokens,

        // Combined user info
        getCurrentUser: () => ({
            auth: authStore.user,
            profile: userStore.profile,
            aiTokens: aiUsageStore.getRemainingTokens?.() || 0,
        }),

        // Loading states
        loading: authStore.loading || userStore.loading || aiUsageStore.loading,
        errors: {
            auth: authStore.error,
            user: userStore.error,
            aiUsage: aiUsageStore.error,
        },

        // Initialize all (usually called after auth)
        initializeAll: async () => {
            await Promise.all([
                userStore.initialize(),
                aiUsageStore.initialize(),
            ]);
        },
    };
}
