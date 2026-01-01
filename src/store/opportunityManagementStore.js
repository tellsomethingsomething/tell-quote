/**
 * Opportunity Management Store
 *
 * Consolidated store combining:
 * - opportunityStore (core opportunity/deal management)
 * - dealContextStore (smart tasks and context tracking)
 * - leadScoringStore (lead scoring and rules)
 *
 * This file provides a unified interface while maintaining backward compatibility
 * through re-exports of the original stores.
 *
 * MIGRATION GUIDE:
 * Old: import { useOpportunityStore } from './opportunityStore'
 * New: import { useOpportunityStore } from './opportunityManagementStore'
 *
 * Or use the unified hook:
 * import { useOpportunityManagement } from './opportunityManagementStore'
 */

// Re-export all original stores for backward compatibility
export {
    useOpportunityStore,
    PIPELINE_STAGES,
    PIPELINE_STAGE_ORDER,
    REGIONS,
    ALL_COUNTRIES,
    getRegionForCountry,
} from './opportunityStore';

export {
    useDealContextStore,
} from './dealContextStore';

export {
    useLeadScoringStore,
    SCORE_THRESHOLDS,
    SCORE_CATEGORIES,
    DEFAULT_SCORING_RULES,
    getScoreCategory,
} from './leadScoringStore';

/**
 * Unified opportunity management hook
 * Provides access to all opportunity management functionality
 */
export function useOpportunityManagement() {
    // Dynamic imports to avoid circular dependencies
    const { useOpportunityStore } = require('./opportunityStore');
    const { useDealContextStore } = require('./dealContextStore');
    const { useLeadScoringStore, getScoreCategory } = require('./leadScoringStore');

    const opportunityStore = useOpportunityStore();
    const dealContextStore = useDealContextStore();
    const leadScoringStore = useLeadScoringStore();

    return {
        // Core opportunities
        opportunities: opportunityStore.opportunities,
        loadOpportunities: opportunityStore.initialize,
        addOpportunity: opportunityStore.addOpportunity,
        updateOpportunity: opportunityStore.updateOpportunity,
        deleteOpportunity: opportunityStore.deleteOpportunity,
        updateStage: opportunityStore.updateStage,
        getOpportunityById: opportunityStore.getOpportunityById,
        getOpportunitiesByStage: opportunityStore.getOpportunitiesByStage,
        getOpportunitiesByClient: opportunityStore.getOpportunitiesByClient,
        getPipelineStats: opportunityStore.getStats,
        searchOpportunities: opportunityStore.searchOpportunities,

        // Deal context & smart tasks
        contexts: dealContextStore.contexts,
        getContext: dealContextStore.getContext,
        updateContext: dealContextStore.updateContext,
        getSmartTasks: dealContextStore.getSmartTasks,
        completeTask: dealContextStore.completeTask,
        skipTask: dealContextStore.skipTask,
        addMilestone: dealContextStore.addMilestone,
        addSuggestedTask: dealContextStore.addSuggestedTask,
        getTaskEffectiveness: dealContextStore.getTaskEffectiveness,

        // Lead scoring
        scoringRules: leadScoringStore.scoringRules,
        loadScoringRules: leadScoringStore.loadScoringRules,
        calculateScore: leadScoringStore.calculateScore,
        recalculateAllScores: leadScoringStore.recalculateAllScores,
        createScoringRule: leadScoringStore.createRule,
        updateScoringRule: leadScoringStore.updateRule,
        deleteScoringRule: leadScoringStore.deleteRule,

        // Combined operations
        getOpportunityWithContext: (opportunityId) => {
            const opportunity = opportunityStore.getOpportunityById(opportunityId);
            const context = dealContextStore.getContext(opportunityId);
            return opportunity ? { ...opportunity, context } : null;
        },

        getOpportunityScoreCategory: (opportunity) => {
            if (!opportunity) return null;
            const score = opportunity.leadScore || opportunity.lead_score || 0;
            return getScoreCategory(score);
        },

        getHotOpportunities: () => {
            return opportunityStore.opportunities.filter(opp => {
                const score = opp.leadScore || opp.lead_score || 0;
                return getScoreCategory(score) === 'hot';
            });
        },

        getWarmOpportunities: () => {
            return opportunityStore.opportunities.filter(opp => {
                const score = opp.leadScore || opp.lead_score || 0;
                return getScoreCategory(score) === 'warm';
            });
        },

        getColdOpportunities: () => {
            return opportunityStore.opportunities.filter(opp => {
                const score = opp.leadScore || opp.lead_score || 0;
                return getScoreCategory(score) === 'cold';
            });
        },

        // Loading states
        loading: opportunityStore.loading || dealContextStore.loading || leadScoringStore.isLoading,
        errors: {
            opportunity: opportunityStore.error,
            dealContext: null, // dealContextStore doesn't have error state
            leadScoring: leadScoringStore.error,
        },

        // Initialize all
        initializeAll: async () => {
            await Promise.all([
                opportunityStore.initialize(),
                dealContextStore.initialize(),
                leadScoringStore.initialize(),
            ]);
        },
    };
}
