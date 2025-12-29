import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { useAuthStore } from './authStore';
import logger from '../utils/logger';

// Low token warning threshold
const LOW_TOKEN_THRESHOLD = 1000;

export const useAIUsageStore = create(
    subscribeWithSelector((set, get) => ({
        // Token balances
        tokensAvailable: 0,
        monthlyAllocation: 0,
        monthlyUsed: 0,
        purchasedTokens: 0,
        purchasedUsed: 0,
        monthlyResetAt: null,

        // Usage history
        usageHistory: [],

        // UI state
        loading: false,
        error: null,
        lastUpdated: null,

        // Computed: is low on tokens
        isLowOnTokens: () => {
            return get().tokensAvailable < LOW_TOKEN_THRESHOLD;
        },

        // Computed: percentage of monthly used
        monthlyUsagePercent: () => {
            const { monthlyAllocation, monthlyUsed } = get();
            if (!monthlyAllocation) return 0;
            return Math.min(100, Math.round((monthlyUsed / monthlyAllocation) * 100));
        },

        // Initialize - fetch current token balances
        initialize: async () => {
            if (!isSupabaseConfigured()) return;

            set({ loading: true, error: null });

            try {
                const user = useAuthStore.getState().user;
                if (!user?.id) {
                    set({ loading: false });
                    return;
                }

                // Get user's organization
                const { data: orgMember, error: memberError } = await supabase
                    .from('organization_members')
                    .select('organization_id')
                    .eq('user_id', user.id)
                    .single();

                if (memberError || !orgMember) {
                    set({ loading: false, error: 'No organization found' });
                    return;
                }

                const orgId = orgMember.organization_id;

                // Get organization token data
                const { data: org, error: orgError } = await supabase
                    .from('organizations')
                    .select('ai_tokens_monthly, ai_tokens_used_this_month, ai_tokens_monthly_reset_at, ai_tokens_purchased, ai_tokens_used')
                    .eq('id', orgId)
                    .single();

                if (orgError) throw orgError;

                // Get available tokens via RPC
                const { data: available } = await supabase
                    .rpc('get_available_ai_tokens', { org_id: orgId });

                // Get usage history
                const { data: history } = await supabase
                    .from('ai_usage_logs')
                    .select('*')
                    .eq('organization_id', orgId)
                    .order('created_at', { ascending: false })
                    .limit(50);

                set({
                    tokensAvailable: available || 0,
                    monthlyAllocation: org?.ai_tokens_monthly || 0,
                    monthlyUsed: org?.ai_tokens_used_this_month || 0,
                    purchasedTokens: org?.ai_tokens_purchased || 0,
                    purchasedUsed: org?.ai_tokens_used || 0,
                    monthlyResetAt: org?.ai_tokens_monthly_reset_at,
                    usageHistory: history || [],
                    loading: false,
                    lastUpdated: new Date().toISOString(),
                });
            } catch (error) {
                logger.error('Failed to initialize AI usage:', error);
                set({ error: error.message, loading: false });
            }
        },

        // Refresh token balance (call after AI operations)
        refreshBalance: async () => {
            const state = get();
            if (state.loading) return;

            try {
                const user = useAuthStore.getState().user;
                if (!user?.id) return;

                const { data: orgMember } = await supabase
                    .from('organization_members')
                    .select('organization_id')
                    .eq('user_id', user.id)
                    .single();

                if (!orgMember) return;

                const orgId = orgMember.organization_id;

                // Get updated organization data
                const { data: org } = await supabase
                    .from('organizations')
                    .select('ai_tokens_monthly, ai_tokens_used_this_month, ai_tokens_purchased, ai_tokens_used')
                    .eq('id', orgId)
                    .single();

                const { data: available } = await supabase
                    .rpc('get_available_ai_tokens', { org_id: orgId });

                set({
                    tokensAvailable: available || 0,
                    monthlyUsed: org?.ai_tokens_used_this_month || 0,
                    purchasedUsed: org?.ai_tokens_used || 0,
                    lastUpdated: new Date().toISOString(),
                });
            } catch (error) {
                logger.error('Failed to refresh balance:', error);
            }
        },

        // Update balance after AI call (optimistic + server confirm)
        updateAfterUsage: (tokensUsed, tokensRemaining) => {
            set({
                tokensAvailable: tokensRemaining,
                lastUpdated: new Date().toISOString(),
            });
            // Also refresh from server to get accurate breakdown
            get().refreshBalance();
        },

        // Get usage stats for dashboard
        getUsageStats: () => {
            const state = get();
            const history = state.usageHistory;

            // Calculate totals from history
            const today = new Date();
            const todayStart = new Date(today.setHours(0, 0, 0, 0));
            const weekStart = new Date(today);
            weekStart.setDate(weekStart.getDate() - 7);

            const todayUsage = history
                .filter(h => new Date(h.created_at) >= todayStart)
                .reduce((sum, h) => sum + (h.tokens_used || 0), 0);

            const weekUsage = history
                .filter(h => new Date(h.created_at) >= weekStart)
                .reduce((sum, h) => sum + (h.tokens_used || 0), 0);

            // Group by feature
            const byFeature = history.reduce((acc, h) => {
                const feature = h.feature || 'unknown';
                acc[feature] = (acc[feature] || 0) + (h.tokens_used || 0);
                return acc;
            }, {});

            return {
                tokensAvailable: state.tokensAvailable,
                monthlyAllocation: state.monthlyAllocation,
                monthlyUsed: state.monthlyUsed,
                monthlyRemaining: Math.max(0, state.monthlyAllocation - state.monthlyUsed),
                purchasedRemaining: Math.max(0, state.purchasedTokens - state.purchasedUsed),
                todayUsage,
                weekUsage,
                byFeature,
                isLow: state.tokensAvailable < LOW_TOKEN_THRESHOLD,
                monthlyResetAt: state.monthlyResetAt,
            };
        },

        // Calculate days until monthly reset
        getDaysUntilReset: () => {
            const { monthlyResetAt } = get();
            if (!monthlyResetAt) return null;

            const reset = new Date(monthlyResetAt);
            const now = new Date();
            const diff = reset - now;
            return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
        },

        // Reset store
        reset: () => {
            set({
                tokensAvailable: 0,
                monthlyAllocation: 0,
                monthlyUsed: 0,
                purchasedTokens: 0,
                purchasedUsed: 0,
                monthlyResetAt: null,
                usageHistory: [],
                loading: false,
                error: null,
                lastUpdated: null,
            });
        },
    }))
);
