import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { fetchLiveRates } from '../utils/currency';

// PO statuses
export const PO_STATUSES = {
    draft: { label: 'Draft', color: 'text-gray-400 bg-gray-500/10 border-gray-500/20' },
    pending: { label: 'Pending Approval', color: 'text-amber-400 bg-amber-500/10 border-amber-500/20' },
    approved: { label: 'Approved', color: 'text-blue-400 bg-blue-500/10 border-blue-500/20' },
    sent: { label: 'Sent to Vendor', color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20' },
    received: { label: 'Received', color: 'text-green-400 bg-green-500/10 border-green-500/20' },
    cancelled: { label: 'Cancelled', color: 'text-gray-500 bg-gray-600/10 border-gray-600/20' },
};

// PO categories
export const PO_CATEGORIES = {
    equipment: { label: 'Equipment Rental', icon: 'camera' },
    crew: { label: 'Crew/Freelance', icon: 'users' },
    venue: { label: 'Venue/Location', icon: 'building' },
    transport: { label: 'Transport/Logistics', icon: 'truck' },
    catering: { label: 'Catering', icon: 'utensils' },
    props: { label: 'Props/Set Design', icon: 'box' },
    post: { label: 'Post Production', icon: 'film' },
    other: { label: 'Other', icon: 'file' },
};

// Generate PO number
function generatePONumber(existingPOs) {
    const year = new Date().getFullYear();
    const prefix = `PO-${year}-`;

    const existingNumbers = existingPOs
        .map(po => po.poNumber)
        .filter(num => num?.startsWith(prefix))
        .map(num => parseInt(num.replace(prefix, ''), 10))
        .filter(n => !isNaN(n));

    const maxNum = existingNumbers.length > 0 ? Math.max(...existingNumbers) : 0;
    return `${prefix}${String(maxNum + 1).padStart(4, '0')}`;
}

// Convert DB PO to local format
function fromDbFormat(po) {
    return {
        id: po.id,
        poNumber: po.po_number,
        projectId: po.project_id,
        vendorId: po.vendor_id,
        vendorName: po.vendor_name || '',
        vendorEmail: po.vendor_email || '',
        vendorPhone: po.vendor_phone || '',
        vendorAddress: po.vendor_address || '',
        category: po.category || 'other',
        status: po.status || 'draft',
        description: po.description || '',
        lineItems: po.line_items || [],
        subtotal: parseFloat(po.subtotal) || 0,
        taxRate: parseFloat(po.tax_rate) || 0,
        taxAmount: parseFloat(po.tax_amount) || 0,
        total: parseFloat(po.total) || 0,
        currency: po.currency || 'USD',
        issueDate: po.issue_date,
        deliveryDate: po.delivery_date,
        deliveryLocation: po.delivery_location || '',
        paymentTerms: po.payment_terms || 'Net 30',
        notes: po.notes || '',
        internalNotes: po.internal_notes || '',
        attachments: po.attachments || [],
        approvedBy: po.approved_by,
        approvedAt: po.approved_at,
        // Exchange rates locked at PO creation - prices never change
        lockedExchangeRates: po.locked_exchange_rates || null,
        createdAt: po.created_at,
        updatedAt: po.updated_at,
    };
}

// Convert local PO to DB format
function toDbFormat(po) {
    return {
        po_number: po.poNumber,
        project_id: po.projectId || null,
        vendor_id: po.vendorId || null,
        vendor_name: po.vendorName || '',
        vendor_email: po.vendorEmail || '',
        vendor_phone: po.vendorPhone || '',
        vendor_address: po.vendorAddress || '',
        category: po.category || 'other',
        status: po.status || 'draft',
        description: po.description || '',
        line_items: po.lineItems || [],
        subtotal: po.subtotal || 0,
        tax_rate: po.taxRate || 0,
        tax_amount: po.taxAmount || 0,
        total: po.total || 0,
        currency: po.currency || 'USD',
        issue_date: po.issueDate || null,
        delivery_date: po.deliveryDate || null,
        delivery_location: po.deliveryLocation || '',
        payment_terms: po.paymentTerms || 'Net 30',
        notes: po.notes || '',
        internal_notes: po.internalNotes || '',
        attachments: po.attachments || [],
        approved_by: po.approvedBy || null,
        approved_at: po.approvedAt || null,
        // Exchange rates locked at PO creation
        locked_exchange_rates: po.lockedExchangeRates || null,
    };
}

export const usePurchaseOrderStore = create(
    subscribeWithSelector((set, get) => ({
        purchaseOrders: [],
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
                // Fetch all purchase orders
                const { data, error } = await supabase
                    .from('purchase_orders')
                    .select('*')
                    .order('created_at', { ascending: false });

                if (error) throw error;

                const purchaseOrders = (data || []).map(fromDbFormat);
                set({ purchaseOrders, loading: false });

                // Subscribe to realtime updates
                const subscription = supabase
                    .channel('purchase-orders-changes')
                    .on('postgres_changes', { event: '*', schema: 'public', table: 'purchase_orders' }, (payload) => {
                        const { eventType, new: newRecord, old: oldRecord } = payload;
                        const state = get();

                        if (eventType === 'INSERT') {
                            const newPO = fromDbFormat(newRecord);
                            if (!state.purchaseOrders.find(p => p.id === newPO.id)) {
                                set({ purchaseOrders: [newPO, ...state.purchaseOrders] });
                            }
                        } else if (eventType === 'UPDATE') {
                            const updatedPO = fromDbFormat(newRecord);
                            set({
                                purchaseOrders: state.purchaseOrders.map(p =>
                                    p.id === updatedPO.id ? updatedPO : p
                                ),
                            });
                        } else if (eventType === 'DELETE') {
                            set({
                                purchaseOrders: state.purchaseOrders.filter(p => p.id !== oldRecord.id),
                            });
                        }
                    })
                    .subscribe();

                set({ realtimeSubscription: subscription });
            } catch (error) {
                console.error('Failed to initialize purchase orders:', error);
                set({ error: error.message, loading: false });
            }
        },

        // Create new PO
        createPurchaseOrder: async (poData) => {
            if (!isSupabaseConfigured()) {
                console.error('Supabase not configured');
                return null;
            }

            try {
                const state = get();
                const poNumber = poData.poNumber || generatePONumber(state.purchaseOrders);

                // Lock exchange rates at PO creation time
                // CRITICAL: These rates will be used for all calculations on this PO
                let lockedExchangeRates = poData.lockedExchangeRates;
                if (!lockedExchangeRates) {
                    const { rates } = await fetchLiveRates();
                    lockedExchangeRates = {
                        rates,
                        lockedAt: new Date().toISOString(),
                        baseCurrency: 'USD',
                    };
                }

                const newPO = {
                    ...poData,
                    poNumber,
                    status: poData.status || 'draft',
                    issueDate: poData.issueDate || new Date().toISOString().split('T')[0],
                    lockedExchangeRates,
                };

                const { data, error } = await supabase
                    .from('purchase_orders')
                    .insert(toDbFormat(newPO))
                    .select()
                    .single();

                if (error) throw error;

                const created = fromDbFormat(data);
                set({ purchaseOrders: [created, ...state.purchaseOrders] });
                return created;
            } catch (error) {
                console.error('Failed to create purchase order:', error);
                return null;
            }
        },

        // Update PO
        updatePurchaseOrder: async (id, updates) => {
            if (!isSupabaseConfigured()) return false;

            try {
                const { error } = await supabase
                    .from('purchase_orders')
                    .update(toDbFormat(updates))
                    .eq('id', id);

                if (error) throw error;

                set({
                    purchaseOrders: get().purchaseOrders.map(po =>
                        po.id === id ? { ...po, ...updates } : po
                    ),
                });
                return true;
            } catch (error) {
                console.error('Failed to update purchase order:', error);
                return false;
            }
        },

        // Update PO status
        updateStatus: async (id, status) => {
            const updates = { status };

            // Set approval info if approving
            if (status === 'approved') {
                updates.approvedAt = new Date().toISOString();
            }

            return get().updatePurchaseOrder(id, updates);
        },

        // Delete PO
        deletePurchaseOrder: async (id) => {
            if (!isSupabaseConfigured()) return false;

            try {
                const { error } = await supabase
                    .from('purchase_orders')
                    .delete()
                    .eq('id', id);

                if (error) throw error;

                set({ purchaseOrders: get().purchaseOrders.filter(po => po.id !== id) });
                return true;
            } catch (error) {
                console.error('Failed to delete purchase order:', error);
                return false;
            }
        },

        // Get PO by ID
        getPurchaseOrderById: (id) => {
            return get().purchaseOrders.find(po => po.id === id);
        },

        // Get POs by project
        getPurchaseOrdersByProject: (projectId) => {
            return get().purchaseOrders.filter(po => po.projectId === projectId);
        },

        // Get POs by vendor
        getPurchaseOrdersByVendor: (vendorId) => {
            return get().purchaseOrders.filter(po => po.vendorId === vendorId);
        },

        // Get PO stats
        getStats: () => {
            const purchaseOrders = get().purchaseOrders;

            return {
                total: purchaseOrders.length,
                draft: purchaseOrders.filter(p => p.status === 'draft').length,
                pending: purchaseOrders.filter(p => p.status === 'pending').length,
                approved: purchaseOrders.filter(p => p.status === 'approved').length,
                sent: purchaseOrders.filter(p => p.status === 'sent').length,
                received: purchaseOrders.filter(p => p.status === 'received').length,
                totalValue: purchaseOrders
                    .filter(p => p.status !== 'cancelled')
                    .reduce((sum, p) => sum + (p.total || 0), 0),
                pendingValue: purchaseOrders
                    .filter(p => ['pending', 'approved', 'sent'].includes(p.status))
                    .reduce((sum, p) => sum + (p.total || 0), 0),
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
