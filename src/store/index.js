/**
 * Store Index - Centralized exports for all Zustand stores
 *
 * STORE CONSOLIDATION PLAN (39 → 17 stores):
 *
 * CONSOLIDATED STORES:
 * 1. resourceManagementStore - kitStore + kitBookingStore + resourceStore
 * 2. opportunityStore (unified) - opportunityStore + dealContextStore + leadScoringStore
 * 3. documentStore (unified) - contractStore + documentStore
 * 4. workflowStore (unified) - taskBoardStore + workflowStore + commercialTasksStore
 * 5. emailStore (unified) - emailStore + emailSequenceStore + emailTemplateStore
 * 6. financeStore - invoiceTemplateStore + expenseStore + purchaseOrderStore + invoiceStore
 * 7. knowledgeStore (unified) - knowledgeStore + sopStore + sportsResearchStore
 * 8. authStore (unified) - authStore + userStore + aiUsageStore
 * 9. projectStore (unified) - projectStore + deliverablesStore + timelineStore
 *
 * STANDALONE STORES (no consolidation needed):
 * 10. quoteStore - core quote editing
 * 11. clientStore - client management
 * 12. rateCardStore - pricing cards
 * 13. settingsStore - app settings
 * 14. organizationStore - multi-tenancy
 * 15. calendarStore - calendar integration
 * 16. callSheetStore - call sheet management
 * 17. activityStore - activity logging
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

// Crew management
export { useCrewStore } from './crewStore';
export { useCrewBookingStore } from './crewBookingStore';

// Opportunities/CRM
export {
    useOpportunityStore,
    PIPELINE_STAGES,
    PIPELINE_STAGE_ORDER,
    REGIONS,
    ALL_COUNTRIES,
    getRegionForCountry,
} from './opportunityStore';
export { useDealContextStore } from './dealContextStore';
export { useLeadScoringStore } from './leadScoringStore';

// Documents
export { useContractStore } from './contractStore';
export { useDocumentStore } from './documentStore';

// Workflow/Tasks
export { useTaskBoardStore } from './taskBoardStore';
export { useWorkflowStore } from './workflowStore';
export { useCommercialTasksStore } from './commercialTasksStore';

// Email
export {
    useEmailStore,
    EMAIL_PROVIDERS,
    LABEL_COLORS,
} from './emailStore';
export { useEmailSequenceStore } from './emailSequenceStore';
export { useEmailTemplateStore } from './emailTemplateStore';

// Finance
export { useInvoiceStore } from './invoiceStore';
export { useInvoiceTemplateStore } from './invoiceTemplateStore';
export { useExpenseStore } from './expenseStore';
export { usePurchaseOrderStore } from './purchaseOrderStore';

// Knowledge
export { useKnowledgeStore } from './knowledgeStore';
export { useSopStore } from './sopStore';
export { useSportsResearchStore } from './sportsResearchStore';

// Auth/User
export { useAuthStore } from './authStore';
export { useUserStore } from './userStore';
export { useAiUsageStore } from './aiUsageStore';

// Project
export { useProjectStore } from './projectStore';
export { useDeliverablesStore } from './deliverablesStore';
export { useTimelineStore } from './timelineStore';
