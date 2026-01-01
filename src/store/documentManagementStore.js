/**
 * Document Management Store
 *
 * Consolidated store combining:
 * - contractStore (contract management)
 * - documentStore (general document management)
 *
 * MIGRATION GUIDE:
 * Old: import { useContractStore } from './contractStore'
 * New: import { useContractStore } from './documentManagementStore'
 */

// Re-export all original stores for backward compatibility
export { useContractStore } from './contractStore';
export { useDocumentStore } from './documentStore';

/**
 * Unified document management hook
 */
export function useDocumentManagement() {
    const { useContractStore } = require('./contractStore');
    const { useDocumentStore } = require('./documentStore');

    const contractStore = useContractStore();
    const documentStore = useDocumentStore();

    return {
        // Contracts
        contracts: contractStore.contracts,
        loadContracts: contractStore.initialize,
        addContract: contractStore.addContract,
        updateContract: contractStore.updateContract,
        deleteContract: contractStore.deleteContract,
        getContractById: contractStore.getContractById,
        getContractsByProject: contractStore.getContractsByProject,
        getContractsByClient: contractStore.getContractsByClient,

        // Documents
        documents: documentStore.documents,
        loadDocuments: documentStore.initialize,
        addDocument: documentStore.addDocument,
        updateDocument: documentStore.updateDocument,
        deleteDocument: documentStore.deleteDocument,
        getDocumentById: documentStore.getDocumentById,
        getDocumentsByProject: documentStore.getDocumentsByProject,
        searchDocuments: documentStore.searchDocuments,

        // Loading states
        loading: contractStore.loading || documentStore.loading,
        errors: {
            contract: contractStore.error,
            document: documentStore.error,
        },

        // Initialize all
        initializeAll: async () => {
            await Promise.all([
                contractStore.initialize(),
                documentStore.initialize(),
            ]);
        },
    };
}
