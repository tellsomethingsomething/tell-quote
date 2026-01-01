/**
 * Finance Management Store
 *
 * Consolidated store combining:
 * - invoiceStore (invoice management)
 * - invoiceTemplateStore (invoice templates)
 * - expenseStore (expense tracking)
 * - purchaseOrderStore (purchase orders)
 *
 * MIGRATION GUIDE:
 * Old: import { useInvoiceStore } from './invoiceStore'
 * New: import { useInvoiceStore } from './financeManagementStore'
 */

// Re-export all original stores for backward compatibility
export { useInvoiceStore } from './invoiceStore';
export { useInvoiceTemplateStore } from './invoiceTemplateStore';
export { useExpenseStore } from './expenseStore';
export { usePurchaseOrderStore } from './purchaseOrderStore';

/**
 * Unified finance management hook
 */
export function useFinanceManagement() {
    const { useInvoiceStore } = require('./invoiceStore');
    const { useInvoiceTemplateStore } = require('./invoiceTemplateStore');
    const { useExpenseStore } = require('./expenseStore');
    const { usePurchaseOrderStore } = require('./purchaseOrderStore');

    const invoiceStore = useInvoiceStore();
    const templateStore = useInvoiceTemplateStore();
    const expenseStore = useExpenseStore();
    const poStore = usePurchaseOrderStore();

    return {
        // Invoices
        invoices: invoiceStore.invoices,
        loadInvoices: invoiceStore.initialize,
        createInvoice: invoiceStore.createInvoice,
        updateInvoice: invoiceStore.updateInvoice,
        deleteInvoice: invoiceStore.deleteInvoice,
        sendInvoice: invoiceStore.sendInvoice,
        markInvoicePaid: invoiceStore.markAsPaid,
        getInvoicesByProject: invoiceStore.getByProject,
        getInvoicesByClient: invoiceStore.getByClient,
        getInvoiceStats: invoiceStore.getStats,

        // Invoice templates
        invoiceTemplates: templateStore.templates,
        loadInvoiceTemplates: templateStore.initialize,
        createInvoiceTemplate: templateStore.createTemplate,
        updateInvoiceTemplate: templateStore.updateTemplate,
        deleteInvoiceTemplate: templateStore.deleteTemplate,

        // Expenses
        expenses: expenseStore.expenses,
        loadExpenses: expenseStore.initialize,
        createExpense: expenseStore.createExpense,
        updateExpense: expenseStore.updateExpense,
        deleteExpense: expenseStore.deleteExpense,
        getExpensesByProject: expenseStore.getByProject,
        getExpenseStats: expenseStore.getStats,

        // Purchase orders
        purchaseOrders: poStore.purchaseOrders,
        loadPurchaseOrders: poStore.initialize,
        createPurchaseOrder: poStore.createPurchaseOrder,
        updatePurchaseOrder: poStore.updatePurchaseOrder,
        deletePurchaseOrder: poStore.deletePurchaseOrder,
        approvePurchaseOrder: poStore.approve,
        getPurchaseOrdersByProject: poStore.getByProject,

        // Combined finance operations
        getProjectFinancials: (projectId) => {
            const projectInvoices = invoiceStore.getByProject?.(projectId) || [];
            const projectExpenses = expenseStore.getByProject?.(projectId) || [];
            const projectPOs = poStore.getByProject?.(projectId) || [];

            const totalInvoiced = projectInvoices.reduce((sum, inv) => sum + (inv.total || 0), 0);
            const totalPaid = projectInvoices.filter(inv => inv.status === 'paid').reduce((sum, inv) => sum + (inv.total || 0), 0);
            const totalExpenses = projectExpenses.reduce((sum, exp) => sum + (exp.amount || 0), 0);
            const totalPOs = projectPOs.reduce((sum, po) => sum + (po.total || 0), 0);

            return {
                invoiced: totalInvoiced,
                paid: totalPaid,
                outstanding: totalInvoiced - totalPaid,
                expenses: totalExpenses,
                purchaseOrders: totalPOs,
                profit: totalPaid - totalExpenses,
            };
        },

        // Loading states
        loading: invoiceStore.loading || templateStore.loading || expenseStore.loading || poStore.loading,
        errors: {
            invoice: invoiceStore.error,
            template: templateStore.error,
            expense: expenseStore.error,
            purchaseOrder: poStore.error,
        },

        // Initialize all
        initializeAll: async () => {
            await Promise.all([
                invoiceStore.initialize(),
                templateStore.initialize(),
                expenseStore.initialize(),
                poStore.initialize(),
            ]);
        },
    };
}
