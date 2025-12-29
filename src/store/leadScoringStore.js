import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { supabase } from '../lib/supabase';
import logger from '../utils/logger';

// Score thresholds for categorization
export const SCORE_THRESHOLDS = {
    hot: 70,
    warm: 40,
    cold: 0,
};

// Get score category
export const getScoreCategory = (score) => {
    if (score >= SCORE_THRESHOLDS.hot) return 'hot';
    if (score >= SCORE_THRESHOLDS.warm) return 'warm';
    return 'cold';
};

// Category styling
export const SCORE_CATEGORIES = {
    hot: {
        label: 'Hot',
        color: 'text-red-400',
        bgColor: 'bg-red-500/20',
        borderColor: 'border-red-500/30',
        icon: '🔥',
    },
    warm: {
        label: 'Warm',
        color: 'text-amber-400',
        bgColor: 'bg-amber-500/20',
        borderColor: 'border-amber-500/30',
        icon: '☀️',
    },
    cold: {
        label: 'Cold',
        color: 'text-blue-400',
        bgColor: 'bg-blue-500/20',
        borderColor: 'border-blue-500/30',
        icon: '❄️',
    },
};

// Default scoring rules (match those in migration)
export const DEFAULT_SCORING_RULES = [
    { name: 'High Value Deal', category: 'fit', condition: { field: 'value', operator: '>=', value: 50000 }, points: 20 },
    { name: 'Medium Value Deal', category: 'fit', condition: { field: 'value', operator: '>=', value: 20000 }, points: 10 },
    { name: 'Has Primary Contact', category: 'fit', condition: { field: 'has_primary_contact', operator: '=', value: true }, points: 10 },
    { name: 'Decision Maker Engaged', category: 'fit', condition: { field: 'has_decision_maker', operator: '=', value: true }, points: 20 },
    { name: 'Recent Meeting', category: 'engagement', condition: { field: 'days_since_meeting', operator: '<=', value: 7 }, points: 15 },
    { name: 'Recent Call', category: 'engagement', condition: { field: 'days_since_call', operator: '<=', value: 7 }, points: 10 },
    { name: 'Quote Sent', category: 'behavior', condition: { field: 'has_quote_sent', operator: '=', value: true }, points: 25 },
    { name: 'Quote Viewed', category: 'behavior', condition: { field: 'has_quote_viewed', operator: '=', value: true }, points: 15 },
    { name: 'Stale Opportunity', category: 'engagement', condition: { field: 'days_since_activity', operator: '>=', value: 14 }, points: -15 },
    { name: 'Very Stale', category: 'engagement', condition: { field: 'days_since_activity', operator: '>=', value: 30 }, points: -25 },
];

export const useLeadScoringStore = create(
    subscribeWithSelector((set, get) => ({
        // Data
        scoringRules: [],
        isLoading: false,
        error: null,

        // ============================================================
        // INITIALIZATION
        // ============================================================

        initialize: async () => {
            await get().loadScoringRules();
        },

        // Load scoring rules from database
        loadScoringRules: async () => {
            set({ isLoading: true, error: null });

            try {
                const { data, error } = await supabase
                    .from('lead_scoring_rules')
                    .select('*')
                    .eq('is_active', true)
                    .order('priority', { ascending: false });

                if (error) throw error;

                set({ scoringRules: data || [], isLoading: false });
            } catch (error) {
                logger.error('Failed to load scoring rules:', error);
                // Fall back to default rules if database fails
                set({ scoringRules: DEFAULT_SCORING_RULES, isLoading: false, error: error.message });
            }
        },

        // ============================================================
        // SCORING CALCULATION
        // ============================================================

        // Calculate score for an opportunity based on its data and activities
        calculateScore: async (opportunityId) => {
            try {
                const { scoringRules } = get();

                // Fetch opportunity with related data
                const { data: opportunity, error: oppError } = await supabase
                    .from('opportunities')
                    .select('*')
                    .eq('id', opportunityId)
                    .single();

                if (oppError) throw oppError;

                // Fetch contacts for this opportunity
                const { data: contacts } = await supabase
                    .from('contacts')
                    .select('*')
                    .eq('opportunity_id', opportunityId);

                // Fetch activities for this opportunity
                const { data: activities } = await supabase
                    .from('activities')
                    .select('*')
                    .eq('opportunity_id', opportunityId)
                    .order('created_at', { ascending: false });

                // Fetch quotes linked to this opportunity
                const { data: quotes } = await supabase
                    .from('quotes')
                    .select('status, viewed_at, sent_at')
                    .eq('opportunity_id', opportunityId);

                // Build the scoring context
                const context = buildScoringContext(opportunity, contacts || [], activities || [], quotes || []);

                // Calculate score
                const { score, breakdown } = evaluateRules(scoringRules.length > 0 ? scoringRules : DEFAULT_SCORING_RULES, context);

                // Update the opportunity with new score
                const { error: updateError } = await supabase
                    .from('opportunities')
                    .update({
                        lead_score: score,
                        score_breakdown: breakdown,
                        score_updated_at: new Date().toISOString(),
                    })
                    .eq('id', opportunityId);

                if (updateError) throw updateError;

                return { score, breakdown };
            } catch (error) {
                logger.error('Failed to calculate score:', error);
                return { score: 0, breakdown: {} };
            }
        },

        // Recalculate scores for all active opportunities
        recalculateAllScores: async () => {
            try {
                const { data: opportunities } = await supabase
                    .from('opportunities')
                    .select('id')
                    .eq('status', 'active');

                if (!opportunities) return;

                const results = [];
                for (const opp of opportunities) {
                    const result = await get().calculateScore(opp.id);
                    results.push({ id: opp.id, ...result });
                }

                return results;
            } catch (error) {
                logger.error('Failed to recalculate all scores:', error);
                return [];
            }
        },

        // ============================================================
        // RULES MANAGEMENT
        // ============================================================

        createRule: async (ruleData) => {
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) throw new Error('Not authenticated');

                const { data, error } = await supabase
                    .from('lead_scoring_rules')
                    .insert({
                        user_id: user.id,
                        name: ruleData.name,
                        description: ruleData.description,
                        category: ruleData.category,
                        condition: ruleData.condition,
                        points: ruleData.points,
                        is_active: true,
                    })
                    .select()
                    .single();

                if (error) throw error;

                set({ scoringRules: [...get().scoringRules, data] });
                return { success: true, rule: data };
            } catch (error) {
                logger.error('Failed to create rule:', error);
                return { success: false, error: error.message };
            }
        },

        updateRule: async (ruleId, updates) => {
            try {
                const { data, error } = await supabase
                    .from('lead_scoring_rules')
                    .update(updates)
                    .eq('id', ruleId)
                    .select()
                    .single();

                if (error) throw error;

                set({
                    scoringRules: get().scoringRules.map(r => r.id === ruleId ? data : r),
                });
                return { success: true, rule: data };
            } catch (error) {
                logger.error('Failed to update rule:', error);
                return { success: false, error: error.message };
            }
        },

        deleteRule: async (ruleId) => {
            try {
                const { error } = await supabase
                    .from('lead_scoring_rules')
                    .delete()
                    .eq('id', ruleId);

                if (error) throw error;

                set({
                    scoringRules: get().scoringRules.filter(r => r.id !== ruleId),
                });
                return { success: true };
            } catch (error) {
                logger.error('Failed to delete rule:', error);
                return { success: false, error: error.message };
            }
        },

        // ============================================================
        // CLEANUP
        // ============================================================

        reset: () => {
            set({
                scoringRules: [],
                isLoading: false,
                error: null,
            });
        },
    }))
);

// ============================================================
// HELPER FUNCTIONS
// ============================================================

function buildScoringContext(opportunity, contacts, activities, quotes) {
    const now = new Date();

    // Calculate days since last activity
    let daysSinceActivity = 999;
    let daysSinceCall = 999;
    let daysSinceMeeting = 999;

    if (activities.length > 0) {
        const lastActivity = new Date(activities[0].created_at);
        daysSinceActivity = Math.floor((now - lastActivity) / (1000 * 60 * 60 * 24));

        const lastCall = activities.find(a => a.activity_type === 'call');
        if (lastCall) {
            daysSinceCall = Math.floor((now - new Date(lastCall.created_at)) / (1000 * 60 * 60 * 24));
        }

        const lastMeeting = activities.find(a => a.activity_type === 'meeting');
        if (lastMeeting) {
            daysSinceMeeting = Math.floor((now - new Date(lastMeeting.created_at)) / (1000 * 60 * 60 * 24));
        }
    }

    // Check contact roles
    const hasPrimaryContact = contacts.some(c => c.is_primary);
    const hasDecisionMaker = contacts.some(c => c.role === 'decision_maker');
    const hasChampion = contacts.some(c => c.role === 'champion');

    // Check quote status
    const hasQuoteSent = quotes.some(q => q.status === 'sent' || q.sent_at);
    const hasQuoteViewed = quotes.some(q => q.viewed_at);
    const hasQuoteAccepted = quotes.some(q => q.status === 'accepted' || q.status === 'won');

    return {
        value: opportunity.value || 0,
        probability: opportunity.probability || 50,
        days_since_activity: daysSinceActivity,
        days_since_call: daysSinceCall,
        days_since_meeting: daysSinceMeeting,
        has_primary_contact: hasPrimaryContact,
        has_decision_maker: hasDecisionMaker,
        has_champion: hasChampion,
        has_quote_sent: hasQuoteSent,
        has_quote_viewed: hasQuoteViewed,
        has_quote_accepted: hasQuoteAccepted,
        contact_count: contacts.length,
        activity_count: activities.length,
    };
}

function evaluateRules(rules, context) {
    let score = 0;
    const breakdown = {};

    for (const rule of rules) {
        if (evaluateCondition(rule.condition, context)) {
            score += rule.points;
            breakdown[rule.name] = rule.points;
        }
    }

    // Clamp score between 0 and 100
    score = Math.max(0, Math.min(100, score));

    return { score, breakdown };
}

function evaluateCondition(condition, context) {
    if (!condition || !condition.field) return false;

    const value = context[condition.field];
    const targetValue = condition.value;

    switch (condition.operator) {
        case '=':
        case '==':
            return value === targetValue;
        case '!=':
            return value !== targetValue;
        case '>':
            return value > targetValue;
        case '>=':
            return value >= targetValue;
        case '<':
            return value < targetValue;
        case '<=':
            return value <= targetValue;
        case 'contains':
            return Array.isArray(value) && value.includes(targetValue);
        case 'not_contains':
            return Array.isArray(value) && !value.includes(targetValue);
        default:
            return false;
    }
}

export default useLeadScoringStore;
