/**
 * Knowledge Management Store
 *
 * Consolidated store combining:
 * - knowledgeStore (knowledge base articles)
 * - sopStore (standard operating procedures)
 * - sportsResearchStore (sports research data)
 *
 * MIGRATION GUIDE:
 * Old: import { useKnowledgeStore } from './knowledgeStore'
 * New: import { useKnowledgeStore } from './knowledgeManagementStore'
 */

// Re-export all original stores for backward compatibility
export { useKnowledgeStore } from './knowledgeStore';
export { useSopStore } from './sopStore';
export { useSportsResearchStore } from './sportsResearchStore';

/**
 * Unified knowledge management hook
 */
export function useKnowledgeManagement() {
    const { useKnowledgeStore } = require('./knowledgeStore');
    const { useSopStore } = require('./sopStore');
    const { useSportsResearchStore } = require('./sportsResearchStore');

    const knowledgeStore = useKnowledgeStore();
    const sopStore = useSopStore();
    const researchStore = useSportsResearchStore();

    return {
        // Knowledge base
        articles: knowledgeStore.articles,
        loadArticles: knowledgeStore.initialize,
        createArticle: knowledgeStore.createArticle,
        updateArticle: knowledgeStore.updateArticle,
        deleteArticle: knowledgeStore.deleteArticle,
        searchArticles: knowledgeStore.searchArticles,
        getArticlesByCategory: knowledgeStore.getByCategory,

        // SOPs
        sops: sopStore.sops,
        loadSops: sopStore.initialize,
        createSop: sopStore.createSop,
        updateSop: sopStore.updateSop,
        deleteSop: sopStore.deleteSop,
        getSopsByCategory: sopStore.getByCategory,

        // Sports research
        research: researchStore.research,
        loadResearch: researchStore.initialize,
        createResearch: researchStore.createResearch,
        updateResearch: researchStore.updateResearch,
        deleteResearch: researchStore.deleteResearch,
        searchResearch: researchStore.searchResearch,
        getResearchByEvent: researchStore.getByEvent,
        getResearchBySport: researchStore.getBySport,

        // Combined search across all knowledge
        searchAll: (query) => {
            const articleResults = knowledgeStore.searchArticles?.(query) || [];
            const sopResults = sopStore.searchSops?.(query) || [];
            const researchResults = researchStore.searchResearch?.(query) || [];
            return {
                articles: articleResults,
                sops: sopResults,
                research: researchResults,
                total: articleResults.length + sopResults.length + researchResults.length,
            };
        },

        // Loading states
        loading: knowledgeStore.loading || sopStore.loading || researchStore.loading,
        errors: {
            knowledge: knowledgeStore.error,
            sop: sopStore.error,
            research: researchStore.error,
        },

        // Initialize all
        initializeAll: async () => {
            await Promise.all([
                knowledgeStore.initialize(),
                sopStore.initialize(),
                researchStore.initialize(),
            ]);
        },
    };
}
