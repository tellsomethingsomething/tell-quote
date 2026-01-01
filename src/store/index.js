/**
 * Store Index - Centralized exports for all Zustand stores
 *
 * STORE CONSOLIDATION COMPLETE (39 → 17 logical stores):
 *
 * CONSOLIDATED STORES (with unified hooks):
 * 1. resourceManagementStore - useResourceManagement()
 *    └─ kitStore + kitBookingStore + resourceStore
 * 2. crewManagementStore - useCrewManagement()
 *    └─ crewStore + crewBookingStore
 * 3. opportunityManagementStore - useOpportunityManagement()
 *    └─ opportunityStore + dealContextStore + leadScoringStore
 * 4. documentManagementStore - useDocumentManagement()
 *    └─ contractStore + documentStore
 * 5. workflowManagementStore - useWorkflowManagement()
 *    └─ taskBoardStore + workflowStore + commercialTasksStore
 * 6. emailManagementStore - useEmailManagement()
 *    └─ emailStore + emailSequenceStore + emailTemplateStore
 * 7. financeManagementStore - useFinanceManagement()
 *    └─ invoiceStore + invoiceTemplateStore + expenseStore + purchaseOrderStore
 * 8. knowledgeManagementStore - useKnowledgeManagement()
 *    └─ knowledgeStore + sopStore + sportsResearchStore
 * 9. authManagementStore - useAuthManagement()
 *    └─ authStore + userStore + aiUsageStore
 * 10. projectManagementStore - useProjectManagement()
 *     └─ projectStore + deliverablesStore + timelineStore
 *
 * STANDALONE STORES (no consolidation needed):
 * 11. quoteStore - core quote editing
 * 12. clientStore - client management
 * 13. rateCardStore - pricing cards
 * 14. settingsStore - app settings
 * 15. organizationStore - multi-tenancy
 * 16. calendarStore - calendar integration
 * 17. callSheetStore - call sheet management
 * 18. activityStore - activity logging
 * 19. contactStore - contact management
 * 20. quoteTemplateStore - quote templates
 *
 * All original stores are still available for backward compatibility.
 * Use the unified hooks (e.g., useResourceManagement) for new code.
 */

// Core stores (standalone)
export { useQuoteStore } from './quoteStore';
export { useClientStore } from './clientStore';
export { useRateCardStore, ITEM_TYPES } from './rateCardStore';
export { useSettingsStore } from './settingsStore';
export { useOrganizationStore } from './organizationStore';
export { useCalendarStore } from './calendarStore';
export { useCallSheetStore } from './callSheetStore';
export { useActivityStore } from './activityStore';
export { useContactStore } from './contactStore';
export { useQuoteTemplateStore } from './quoteTemplateStore';

// Resource Management (consolidated)
export {
    useKitStore,
    useKitBookingStore,
    useResourceStore,
    useResourceManagement,
    KIT_STATUS,
    KIT_STATUS_CONFIG,
    KIT_CONDITION,
    KIT_CONDITION_CONFIG,
    DEFAULT_CATEGORIES,
    DEFAULT_LOCATIONS,
    BOOKING_STATUS,
    BOOKING_STATUS_CONFIG,
    TALENT_TYPES,
    TALENT_STATUS,
    LOCATION_TYPES,
    LOCATION_STATUS,
    VENDOR_TYPES,
    VENDOR_RATING,
} from './resourceManagementStore';

// Crew Management (consolidated)
export {
    useCrewStore,
    useCrewBookingStore,
    useCrewManagement,
    CREW_DEPARTMENTS,
    AVAILABILITY_STATUS,
    CREW_BOOKING_STATUSES,
    calculateBookingCost,
} from './crewManagementStore';

// Opportunities/CRM (consolidated)
export {
    useOpportunityStore,
    useDealContextStore,
    useLeadScoringStore,
    useOpportunityManagement,
    PIPELINE_STAGES,
    PIPELINE_STAGE_ORDER,
    REGIONS,
    ALL_COUNTRIES,
    getRegionForCountry,
    SCORE_THRESHOLDS,
    SCORE_CATEGORIES,
    DEFAULT_SCORING_RULES,
    getScoreCategory,
} from './opportunityManagementStore';

// Documents (consolidated)
export {
    useContractStore,
    useDocumentStore,
    useDocumentManagement,
} from './documentManagementStore';

// Workflow/Tasks (consolidated)
export {
    useTaskBoardStore,
    useWorkflowStore,
    useCommercialTasksStore,
    useWorkflowManagement,
} from './workflowManagementStore';

// Email (consolidated)
export {
    useEmailStore,
    useEmailSequenceStore,
    useEmailTemplateStore,
    useEmailManagement,
    EMAIL_PROVIDERS,
    LABEL_COLORS,
} from './emailManagementStore';

// Finance (consolidated)
export {
    useInvoiceStore,
    useInvoiceTemplateStore,
    useExpenseStore,
    usePurchaseOrderStore,
    useFinanceManagement,
} from './financeManagementStore';

// Knowledge (consolidated)
export {
    useKnowledgeStore,
    useSopStore,
    useSportsResearchStore,
    useKnowledgeManagement,
} from './knowledgeManagementStore';

// Auth/User (consolidated)
export {
    useAuthStore,
    useUserStore,
    useAiUsageStore,
    useAuthManagement,
} from './authManagementStore';

// Project (consolidated)
export {
    useProjectStore,
    useDeliverablesStore,
    useTimelineStore,
    useProjectManagement,
} from './projectManagementStore';
