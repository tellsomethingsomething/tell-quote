import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { fetchLiveRates } from '../utils/currency';
import { useSettingsStore } from './settingsStore';

// Invoice statuses
export const INVOICE_STATUSES = {
    draft: { label: 'Draft', color: 'text-gray-400 bg-gray-500/10 border-gray-500/20' },
    sent: { label: 'Sent', color: 'text-blue-400 bg-blue-500/10 border-blue-500/20' },
    partial: { label: 'Partial', color: 'text-amber-400 bg-amber-500/10 border-amber-500/20' },
    paid: { label: 'Paid', color: 'text-green-400 bg-green-500/10 border-green-500/20' },
    overdue: { label: 'Overdue', color: 'text-red-400 bg-red-500/10 border-red-500/20' },
    cancelled: { label: 'Cancelled', color: 'text-gray-500 bg-gray-600/10 border-gray-600/20' },
};

// Payment methods
export const PAYMENT_METHODS = {
    bank_transfer: { label: 'Bank Transfer', icon: 'building-2' },
    card: { label: 'Card', icon: 'credit-card' },
    cash: { label: 'Cash', icon: 'banknote' },
    check: { label: 'Check', icon: 'file-text' },
    other: { label: 'Other', icon: 'circle-dot' },
};

// Generate invoice number with configurable prefix from settings
function generateInvoiceNumber(existingInvoices) {
    const settings = useSettingsStore.getState().settings;
    const invoicePrefix = settings?.quoteDefaults?.invoicePrefix || 'INV';
    const year = new Date().getFullYear();
    const prefix = `${invoicePrefix}-${year}-`;

    const existingNumbers = existingInvoices
        .map(inv => inv.invoiceNumber)
        .filter(num => num?.startsWith(prefix))
        .map(num => parseInt(num.replace(prefix, ''), 10))
        .filter(n => !isNaN(n));

    const maxNum = existingNumbers.length > 0 ? Math.max(...existingNumbers) : 0;
    return `${prefix}${String(maxNum + 1).padStart(4, '0')}`;
}

// Convert DB invoice to local format
function fromDbFormat(inv) {
    return {
        id: inv.id,
        invoiceNumber: inv.invoice_number,
        quoteId: inv.quote_id,
        clientId: inv.client_id,
        projectId: inv.project_id,
        status: inv.status || 'draft',
        subtotal: parseFloat(inv.subtotal) || 0,
        taxRate: parseFloat(inv.tax_rate) || 0,
        taxAmount: parseFloat(inv.tax_amount) || 0,
        total: parseFloat(inv.total) || 0,
        currency: inv.currency || 'USD',
        issueDate: inv.issue_date,
        dueDate: inv.due_date,
        paidDate: inv.paid_date,
        // Payment tracking
        paidAmount: parseFloat(inv.paid_amount) || 0,
        payments: inv.payments || [],
        lineItems: inv.line_items || [],
        notes: inv.notes || '',
        clientName: inv.client_name || '',
        clientEmail: inv.client_email || '',
        clientAddress: inv.client_address || '',
        quoteNumber: inv.quote_number || '',
        // Exchange rates locked at invoice creation - prices never change
        lockedExchangeRates: inv.locked_exchange_rates || null,
        createdAt: inv.created_at,
        updatedAt: inv.updated_at,
    };
}

// Convert local invoice to DB format
function toDbFormat(inv) {
    return {
        invoice_number: inv.invoiceNumber,
        quote_id: inv.quoteId || null,
        client_id: inv.clientId || null,
        project_id: inv.projectId || null,
        status: inv.status || 'draft',
        subtotal: inv.subtotal || 0,
        tax_rate: inv.taxRate || 0,
        tax_amount: inv.taxAmount || 0,
        total: inv.total || 0,
        currency: inv.currency || 'USD',
        issue_date: inv.issueDate || null,
        due_date: inv.dueDate || null,
        paid_date: inv.paidDate || null,
        // Payment tracking
        paid_amount: inv.paidAmount || 0,
        payments: inv.payments || [],
        line_items: inv.lineItems || [],
        notes: inv.notes || '',
        client_name: inv.clientName || '',
        client_email: inv.clientEmail || '',
        client_address: inv.clientAddress || '',
        quote_number: inv.quoteNumber || '',
        // Exchange rates locked at invoice creation
        locked_exchange_rates: inv.lockedExchangeRates || null,
    };
}

export const useInvoiceStore = create(
    subscribeWithSelector((set, get) => ({
        invoices: [],
        loading: false,
        error: null,
        realtimeSubscription: null,

        // Initialize - load from Supabase and subscribe to realtime
        initialize: async () => {
            if (!isSupabaseConfigured()) {
                set({ loading: false, error: 'Supabase not configured' });
                return;
            }

            set({ loading: true, error: null });

            try {
                // Fetch all invoices
                const { data, error } = await supabase
                    .from('invoices')
                    .select('*')
                    .order('created_at', { ascending: false });

                if (error) throw error;

                const invoices = (data || []).map(fromDbFormat);
                set({ invoices, loading: false });

                // Subscribe to realtime updates
                const subscription = supabase
                    .channel('invoices-changes')
                    .on('postgres_changes', { event: '*', schema: 'public', table: 'invoices' }, (payload) => {
                        const { eventType, new: newRecord, old: oldRecord } = payload;
                        const state = get();

                        if (eventType === 'INSERT') {
                            const newInvoice = fromDbFormat(newRecord);
                            if (!state.invoices.find(i => i.id === newInvoice.id)) {
                                set({ invoices: [newInvoice, ...state.invoices] });
                            }
                        } else if (eventType === 'UPDATE') {
                            const updatedInvoice = fromDbFormat(newRecord);
                            set({
                                invoices: state.invoices.map(i =>
                                    i.id === updatedInvoice.id ? updatedInvoice : i
                                ),
                            });
                        } else if (eventType === 'DELETE') {
                            set({
                                invoices: state.invoices.filter(i => i.id !== oldRecord.id),
                            });
                        }
                    })
                    .subscribe();

                set({ realtimeSubscription: subscription });
            } catch (error) {
                console.error('Failed to initialize invoices:', error);
                set({ error: error.message, loading: false });
            }
        },

        // Create new invoice
        createInvoice: async (invoiceData) => {
            if (!isSupabaseConfigured()) {
                console.error('Supabase not configured');
                return null;
            }

            try {
                const state = get();
                const invoiceNumber = invoiceData.invoiceNumber || generateInvoiceNumber(state.invoices);

                // Lock exchange rates at invoice creation time
                // CRITICAL: These rates will be used for all calculations on this invoice
                let lockedExchangeRates = invoiceData.lockedExchangeRates;
                if (!lockedExchangeRates) {
                    const { rates } = await fetchLiveRates();
                    lockedExchangeRates = {
                        rates,
                        lockedAt: new Date().toISOString(),
                        baseCurrency: 'USD',
                    };
                }

                const newInvoice = {
                    ...invoiceData,
                    invoiceNumber,
                    status: invoiceData.status || 'draft',
                    issueDate: invoiceData.issueDate || new Date().toISOString().split('T')[0],
                    lockedExchangeRates,
                };

                const { data, error } = await supabase
                    .from('invoices')
                    .insert(toDbFormat(newInvoice))
                    .select()
                    .single();

                if (error) throw error;

                const created = fromDbFormat(data);
                set({ invoices: [created, ...state.invoices] });
                return created;
            } catch (error) {
                console.error('Failed to create invoice:', error);
                return null;
            }
        },

        // Create invoice from quote
        createFromQuote: async (quote, client) => {
            if (!quote) return null;

            const lineItems = [];

            // Extract line items from quote sections
            if (quote.sections) {
                Object.entries(quote.sections).forEach(([sectionName, section]) => {
                    if (section.subsections) {
                        Object.entries(section.subsections).forEach(([subsectionName, subsection]) => {
                            if (subsection.items) {
                                subsection.items.forEach(item => {
                                    if (item.description && (item.charge > 0 || item.total > 0)) {
                                        lineItems.push({
                                            description: item.description,
                                            quantity: item.quantity || 1,
                                            days: item.days || 1,
                                            rate: item.charge || item.cost || 0,
                                            total: item.total || (item.quantity * item.days * (item.charge || item.cost || 0)),
                                            section: sectionName,
                                            subsection: subsectionName,
                                        });
                                    }
                                });
                            }
                        });
                    }
                });
            }

            // Calculate totals
            const subtotal = lineItems.reduce((sum, item) => sum + (item.total || 0), 0);
            const taxRate = quote.taxRate || 0;
            const taxAmount = subtotal * (taxRate / 100);
            const total = subtotal + taxAmount;

            // Calculate due date (30 days from now by default)
            const dueDate = new Date();
            dueDate.setDate(dueDate.getDate() + 30);

            const invoiceData = {
                quoteId: quote.id,
                quoteNumber: quote.quote_number || quote.quoteNumber || '',
                clientId: quote.clientId || client?.id,
                clientName: client?.company || quote.clientName || '',
                clientEmail: client?.email || quote.clientEmail || '',
                clientAddress: client?.address || quote.clientAddress || '',
                projectId: quote.projectId || null,
                currency: quote.currency || 'USD',
                lineItems,
                subtotal,
                taxRate,
                taxAmount,
                total,
                dueDate: dueDate.toISOString().split('T')[0],
                notes: quote.terms || '',
            };

            return get().createInvoice(invoiceData);
        },

        // Update invoice
        updateInvoice: async (id, updates) => {
            if (!isSupabaseConfigured()) return false;

            try {
                const { error } = await supabase
                    .from('invoices')
                    .update(toDbFormat(updates))
                    .eq('id', id);

                if (error) throw error;

                set({
                    invoices: get().invoices.map(inv =>
                        inv.id === id ? { ...inv, ...updates } : inv
                    ),
                });
                return true;
            } catch (error) {
                console.error('Failed to update invoice:', error);
                return false;
            }
        },

        // Update invoice status
        updateStatus: async (id, status) => {
            const updates = { status };

            // Set paid date if marking as paid
            if (status === 'paid') {
                updates.paidDate = new Date().toISOString().split('T')[0];
            }

            return get().updateInvoice(id, updates);
        },

        // Record a payment against an invoice
        recordPayment: async (id, paymentData) => {
            const invoice = get().getInvoiceById(id);
            if (!invoice) return false;

            const payment = {
                id: crypto.randomUUID(),
                amount: parseFloat(paymentData.amount) || 0,
                date: paymentData.date || new Date().toISOString().split('T')[0],
                method: paymentData.method || 'bank_transfer', // bank_transfer, card, cash, check, other
                reference: paymentData.reference || '',
                notes: paymentData.notes || '',
                recordedAt: new Date().toISOString(),
            };

            // Calculate new paid amount
            const payments = [...(invoice.payments || []), payment];
            const paidAmount = payments.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);

            // Determine new status based on payment
            let status = invoice.status;
            let paidDate = invoice.paidDate;

            if (paidAmount >= invoice.total) {
                status = 'paid';
                paidDate = payment.date;
            } else if (paidAmount > 0) {
                status = 'partial';
            }

            const updates = {
                payments,
                paidAmount,
                status,
                paidDate,
            };

            return get().updateInvoice(id, updates);
        },

        // Get remaining balance on an invoice
        getBalance: (id) => {
            const invoice = get().getInvoiceById(id);
            if (!invoice) return 0;
            return (invoice.total || 0) - (invoice.paidAmount || 0);
        },

        // Delete invoice
        deleteInvoice: async (id) => {
            if (!isSupabaseConfigured()) return false;

            try {
                const { error } = await supabase
                    .from('invoices')
                    .delete()
                    .eq('id', id);

                if (error) throw error;

                set({ invoices: get().invoices.filter(inv => inv.id !== id) });
                return true;
            } catch (error) {
                console.error('Failed to delete invoice:', error);
                return false;
            }
        },

        // Get invoice by ID
        getInvoiceById: (id) => {
            return get().invoices.find(inv => inv.id === id);
        },

        // Get invoices by client
        getInvoicesByClient: (clientId) => {
            return get().invoices.filter(inv => inv.clientId === clientId);
        },

        // Get invoices by project
        getInvoicesByProject: (projectId) => {
            return get().invoices.filter(inv => inv.projectId === projectId);
        },

        // Get invoice stats
        getStats: () => {
            const invoices = get().invoices;
            const now = new Date();

            return {
                total: invoices.length,
                draft: invoices.filter(i => i.status === 'draft').length,
                sent: invoices.filter(i => i.status === 'sent').length,
                paid: invoices.filter(i => i.status === 'paid').length,
                overdue: invoices.filter(i => {
                    if (i.status === 'paid' || i.status === 'cancelled') return false;
                    return i.dueDate && new Date(i.dueDate) < now;
                }).length,
                totalRevenue: invoices
                    .filter(i => i.status === 'paid')
                    .reduce((sum, i) => sum + (i.total || 0), 0),
                totalOutstanding: invoices
                    .filter(i => i.status === 'sent')
                    .reduce((sum, i) => sum + (i.total || 0), 0),
            };
        },

        // Cleanup
        cleanup: () => {
            const sub = get().realtimeSubscription;
            if (sub) {
                supabase.removeChannel(sub);
            }
            set({ realtimeSubscription: null });
        },
    }))
);
