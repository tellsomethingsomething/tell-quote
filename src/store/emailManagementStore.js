/**
 * Email Management Store
 *
 * Consolidated store combining:
 * - emailStore (email management and sync)
 * - emailSequenceStore (automated sequences)
 * - emailTemplateStore (email templates)
 *
 * MIGRATION GUIDE:
 * Old: import { useEmailStore } from './emailStore'
 * New: import { useEmailStore } from './emailManagementStore'
 */

// Re-export all original stores for backward compatibility
export {
    useEmailStore,
    EMAIL_PROVIDERS,
    LABEL_COLORS,
} from './emailStore';

export { useEmailSequenceStore } from './emailSequenceStore';
export { useEmailTemplateStore } from './emailTemplateStore';

/**
 * Unified email management hook
 */
export function useEmailManagement() {
    const { useEmailStore } = require('./emailStore');
    const { useEmailSequenceStore } = require('./emailSequenceStore');
    const { useEmailTemplateStore } = require('./emailTemplateStore');

    const emailStore = useEmailStore();
    const sequenceStore = useEmailSequenceStore();
    const templateStore = useEmailTemplateStore();

    return {
        // Core email
        emails: emailStore.emails,
        loadEmails: emailStore.initialize,
        sendEmail: emailStore.sendEmail,
        syncEmails: emailStore.syncEmails,
        markAsRead: emailStore.markAsRead,
        archiveEmail: emailStore.archiveEmail,
        getEmailsByThread: emailStore.getEmailsByThread,
        searchEmails: emailStore.searchEmails,

        // Sequences
        sequences: sequenceStore.sequences,
        loadSequences: sequenceStore.initialize,
        createSequence: sequenceStore.createSequence,
        updateSequence: sequenceStore.updateSequence,
        deleteSequence: sequenceStore.deleteSequence,
        startSequence: sequenceStore.startSequence,
        pauseSequence: sequenceStore.pauseSequence,
        getActiveSequences: sequenceStore.getActiveSequences,

        // Templates
        templates: templateStore.templates,
        loadTemplates: templateStore.initialize,
        createTemplate: templateStore.createTemplate,
        updateTemplate: templateStore.updateTemplate,
        deleteTemplate: templateStore.deleteTemplate,
        getTemplateById: templateStore.getTemplateById,
        renderTemplate: templateStore.renderTemplate,

        // Loading states
        loading: emailStore.loading || sequenceStore.loading || templateStore.loading,
        errors: {
            email: emailStore.error,
            sequence: sequenceStore.error,
            template: templateStore.error,
        },

        // Initialize all
        initializeAll: async () => {
            await Promise.all([
                emailStore.initialize(),
                sequenceStore.initialize(),
                templateStore.initialize(),
            ]);
        },
    };
}
