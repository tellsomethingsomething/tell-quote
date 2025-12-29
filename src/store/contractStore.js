import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

// Contract statuses
export const CONTRACT_STATUSES = {
    draft: { label: 'Draft', color: 'text-gray-400 bg-gray-500/10 border-gray-500/20' },
    pending_review: { label: 'Pending Review', color: 'text-amber-400 bg-amber-500/10 border-amber-500/20' },
    sent: { label: 'Sent', color: 'text-blue-400 bg-blue-500/10 border-blue-500/20' },
    signed: { label: 'Signed', color: 'text-green-400 bg-green-500/10 border-green-500/20' },
    active: { label: 'Active', color: 'text-purple-400 bg-purple-500/10 border-purple-500/20' },
    completed: { label: 'Completed', color: 'text-purple-400 bg-purple-500/10 border-purple-500/20' },
    cancelled: { label: 'Cancelled', color: 'text-gray-500 bg-gray-600/10 border-gray-600/20' },
    expired: { label: 'Expired', color: 'text-red-400 bg-red-500/10 border-red-500/20' },
};

// Contract types
export const CONTRACT_TYPES = {
    crew: { label: 'Crew Agreement', icon: 'users' },
    client: { label: 'Client Agreement', icon: 'briefcase' },
    vendor: { label: 'Vendor Agreement', icon: 'truck' },
    nda: { label: 'NDA', icon: 'shield' },
    location: { label: 'Location Release', icon: 'map-pin' },
    talent: { label: 'Talent Release', icon: 'user' },
    licensing: { label: 'Licensing/Rights', icon: 'file-text' },
    other: { label: 'Other', icon: 'file' },
};

// Generate contract reference
function generateContractRef(existingContracts) {
    const year = new Date().getFullYear();
    const prefix = `CTR-${year}-`;

    const existingNumbers = existingContracts
        .map(c => c.contractRef)
        .filter(ref => ref?.startsWith(prefix))
        .map(ref => parseInt(ref.replace(prefix, ''), 10))
        .filter(n => !isNaN(n));

    const maxNum = existingNumbers.length > 0 ? Math.max(...existingNumbers) : 0;
    return `${prefix}${String(maxNum + 1).padStart(4, '0')}`;
}

// Convert DB contract to local format
function fromDbFormat(contract) {
    return {
        id: contract.id,
        contractRef: contract.contract_ref,
        title: contract.title || '',
        contractType: contract.contract_type || 'other',
        status: contract.status || 'draft',
        projectId: contract.project_id,
        clientId: contract.client_id,
        crewId: contract.crew_id,
        vendorId: contract.vendor_id,
        // Party info
        partyName: contract.party_name || '',
        partyEmail: contract.party_email || '',
        partyPhone: contract.party_phone || '',
        partyAddress: contract.party_address || '',
        partyCompany: contract.party_company || '',
        // Dates
        startDate: contract.start_date,
        endDate: contract.end_date,
        signedDate: contract.signed_date,
        expiresAt: contract.expires_at,
        // Financial
        value: parseFloat(contract.value) || 0,
        currency: contract.currency || 'USD',
        paymentTerms: contract.payment_terms || '',
        // Content
        description: contract.description || '',
        terms: contract.terms || '',
        specialClauses: contract.special_clauses || [],
        // Documents
        documentUrl: contract.document_url || '',
        signedDocumentUrl: contract.signed_document_url || '',
        attachments: contract.attachments || [],
        // Metadata
        tags: contract.tags || [],
        notes: contract.notes || '',
        internalNotes: contract.internal_notes || '',
        createdBy: contract.created_by,
        createdAt: contract.created_at,
        updatedAt: contract.updated_at,
    };
}

// Convert local contract to DB format
function toDbFormat(contract) {
    return {
        contract_ref: contract.contractRef,
        title: contract.title || '',
        contract_type: contract.contractType || 'other',
        status: contract.status || 'draft',
        project_id: contract.projectId || null,
        client_id: contract.clientId || null,
        crew_id: contract.crewId || null,
        vendor_id: contract.vendorId || null,
        party_name: contract.partyName || '',
        party_email: contract.partyEmail || '',
        party_phone: contract.partyPhone || '',
        party_address: contract.partyAddress || '',
        party_company: contract.partyCompany || '',
        start_date: contract.startDate || null,
        end_date: contract.endDate || null,
        signed_date: contract.signedDate || null,
        expires_at: contract.expiresAt || null,
        value: contract.value || 0,
        currency: contract.currency || 'USD',
        payment_terms: contract.paymentTerms || '',
        description: contract.description || '',
        terms: contract.terms || '',
        special_clauses: contract.specialClauses || [],
        document_url: contract.documentUrl || '',
        signed_document_url: contract.signedDocumentUrl || '',
        attachments: contract.attachments || [],
        tags: contract.tags || [],
        notes: contract.notes || '',
        internal_notes: contract.internalNotes || '',
        created_by: contract.createdBy || null,
    };
}

export const useContractStore = create(
    subscribeWithSelector((set, get) => ({
        contracts: [],
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
                // Fetch all contracts
                const { data, error } = await supabase
                    .from('contracts')
                    .select('*')
                    .order('created_at', { ascending: false });

                if (error) throw error;

                const contracts = (data || []).map(fromDbFormat);
                set({ contracts, loading: false });

                // Subscribe to realtime updates
                const subscription = supabase
                    .channel('contracts-changes')
                    .on('postgres_changes', { event: '*', schema: 'public', table: 'contracts' }, (payload) => {
                        const { eventType, new: newRecord, old: oldRecord } = payload;
                        const state = get();

                        if (eventType === 'INSERT') {
                            const newContract = fromDbFormat(newRecord);
                            if (!state.contracts.find(c => c.id === newContract.id)) {
                                set({ contracts: [newContract, ...state.contracts] });
                            }
                        } else if (eventType === 'UPDATE') {
                            const updatedContract = fromDbFormat(newRecord);
                            set({
                                contracts: state.contracts.map(c =>
                                    c.id === updatedContract.id ? updatedContract : c
                                ),
                            });
                        } else if (eventType === 'DELETE') {
                            set({
                                contracts: state.contracts.filter(c => c.id !== oldRecord.id),
                            });
                        }
                    })
                    .subscribe();

                set({ realtimeSubscription: subscription });
            } catch (error) {
                console.error('Failed to initialize contracts:', error);
                set({ error: error.message, loading: false });
            }
        },

        // Create new contract
        createContract: async (contractData) => {
            if (!isSupabaseConfigured()) {
                console.error('Supabase not configured');
                return null;
            }

            try {
                const state = get();
                const contractRef = contractData.contractRef || generateContractRef(state.contracts);

                const newContract = {
                    ...contractData,
                    contractRef,
                    status: contractData.status || 'draft',
                };

                const { data, error } = await supabase
                    .from('contracts')
                    .insert(toDbFormat(newContract))
                    .select()
                    .single();

                if (error) throw error;

                const created = fromDbFormat(data);
                set({ contracts: [created, ...state.contracts] });
                return created;
            } catch (error) {
                console.error('Failed to create contract:', error);
                return null;
            }
        },

        // Update contract
        updateContract: async (id, updates) => {
            if (!isSupabaseConfigured()) return false;

            try {
                const { error } = await supabase
                    .from('contracts')
                    .update(toDbFormat(updates))
                    .eq('id', id);

                if (error) throw error;

                set({
                    contracts: get().contracts.map(c =>
                        c.id === id ? { ...c, ...updates } : c
                    ),
                });
                return true;
            } catch (error) {
                console.error('Failed to update contract:', error);
                return false;
            }
        },

        // Update contract status
        updateStatus: async (id, status) => {
            const updates = { status };

            // Set signed date if marking as signed
            if (status === 'signed') {
                updates.signedDate = new Date().toISOString().split('T')[0];
            }

            return get().updateContract(id, updates);
        },

        // Delete contract
        deleteContract: async (id) => {
            if (!isSupabaseConfigured()) return false;

            try {
                const { error } = await supabase
                    .from('contracts')
                    .delete()
                    .eq('id', id);

                if (error) throw error;

                set({ contracts: get().contracts.filter(c => c.id !== id) });
                return true;
            } catch (error) {
                console.error('Failed to delete contract:', error);
                return false;
            }
        },

        // Get contract by ID
        getContractById: (id) => {
            return get().contracts.find(c => c.id === id);
        },

        // Get contracts by project
        getContractsByProject: (projectId) => {
            return get().contracts.filter(c => c.projectId === projectId);
        },

        // Get contracts by client
        getContractsByClient: (clientId) => {
            return get().contracts.filter(c => c.clientId === clientId);
        },

        // Get contracts by crew member
        getContractsByCrew: (crewId) => {
            return get().contracts.filter(c => c.crewId === crewId);
        },

        // Get expiring contracts (within n days)
        getExpiringContracts: (days = 30) => {
            const now = new Date();
            const threshold = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

            return get().contracts.filter(c => {
                if (!c.expiresAt || c.status === 'cancelled' || c.status === 'expired') return false;
                const expiryDate = new Date(c.expiresAt);
                return expiryDate > now && expiryDate <= threshold;
            });
        },

        // Get contract stats
        getStats: () => {
            const contracts = get().contracts;
            const now = new Date();

            return {
                total: contracts.length,
                draft: contracts.filter(c => c.status === 'draft').length,
                pending: contracts.filter(c => c.status === 'pending_review' || c.status === 'sent').length,
                signed: contracts.filter(c => c.status === 'signed').length,
                active: contracts.filter(c => c.status === 'active').length,
                completed: contracts.filter(c => c.status === 'completed').length,
                expiringSoon: get().getExpiringContracts(30).length,
                totalValue: contracts
                    .filter(c => ['signed', 'active'].includes(c.status))
                    .reduce((sum, c) => sum + (c.value || 0), 0),
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
