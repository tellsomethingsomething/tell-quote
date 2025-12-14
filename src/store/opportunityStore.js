import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

const OPPORTUNITIES_STORAGE_KEY = 'tell_opportunities';
const SYNC_QUEUE_KEY = 'tell_opportunities_sync_queue';

// Regions and countries
export const REGIONS = {
    GCC: ['Saudi Arabia', 'UAE', 'Qatar', 'Kuwait', 'Bahrain', 'Oman'],
    'Central Asia': ['Kazakhstan', 'Uzbekistan', 'Turkmenistan', 'Tajikistan', 'Kyrgyzstan', 'Afghanistan'],
    SEA: ['Malaysia', 'Singapore', 'Indonesia', 'Thailand', 'Vietnam', 'Philippines', 'Myanmar', 'Cambodia', 'Laos', 'Brunei'],
};

export const ALL_COUNTRIES = [...REGIONS.GCC, ...REGIONS['Central Asia'], ...REGIONS.SEA];

export const getRegionForCountry = (country) => {
    if (REGIONS.GCC.includes(country)) return 'GCC';
    if (REGIONS['Central Asia'].includes(country)) return 'Central Asia';
    if (REGIONS.SEA.includes(country)) return 'SEA';
    return 'Other';
};

// Load from localStorage (fallback/cache)
function loadOpportunitiesLocal() {
    try {
        const saved = localStorage.getItem(OPPORTUNITIES_STORAGE_KEY);
        return saved ? JSON.parse(saved) : [];
    } catch (e) {
        return [];
    }
}

function saveOpportunitiesLocal(opportunities) {
    try {
        localStorage.setItem(OPPORTUNITIES_STORAGE_KEY, JSON.stringify(opportunities));
    } catch (e) {
        console.error('Failed to save opportunities locally:', e);
    }
}

// Sync queue for failed operations
function loadSyncQueue() {
    try {
        const saved = localStorage.getItem(SYNC_QUEUE_KEY);
        return saved ? JSON.parse(saved) : [];
    } catch (e) {
        return [];
    }
}

function saveSyncQueue(queue) {
    try {
        localStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(queue));
    } catch (e) {
        console.error('Failed to save sync queue:', e);
    }
}

function generateId() {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
}

// Convert local opportunity to DB format
function toDbFormat(opp) {
    return {
        id: opp.id.includes('-') && opp.id.length > 30 ? undefined : opp.id, // Only use UUID ids
        title: opp.title,
        client_id: opp.clientId,
        client: opp.client,
        region: opp.region,
        country: opp.country,
        status: opp.status,
        value: opp.value,
        currency: opp.currency,
        probability: opp.probability,
        source: opp.source,
        competitors: opp.competitors,
        contacts: opp.contacts,
        account_owner_id: opp.accountOwnerId,
        brief: opp.brief,
        notes: opp.notes,
        next_action: opp.nextAction,
        next_action_date: opp.nextActionDate,
        expected_close_date: opp.expectedCloseDate,
        converted_to_quote_id: opp.convertedToQuoteId,
    };
}

// Convert DB opportunity to local format
function fromDbFormat(o) {
    return {
        id: o.id,
        title: o.title,
        clientId: o.client_id,
        client: o.client || {},
        region: o.region,
        country: o.country,
        status: o.status || 'active',
        value: o.value,
        currency: o.currency || 'USD',
        probability: o.probability || 50,
        source: o.source || '',
        competitors: o.competitors || [],
        contacts: o.contacts || [],
        accountOwnerId: o.account_owner_id || null,
        brief: o.brief || '',
        notes: o.notes || '',
        nextAction: o.next_action || '',
        nextActionDate: o.next_action_date,
        expectedCloseDate: o.expected_close_date,
        convertedToQuoteId: o.converted_to_quote_id,
        createdAt: o.created_at,
        updatedAt: o.updated_at,
        _synced: true, // Mark as synced from DB
    };
}

export const useOpportunityStore = create(
    subscribeWithSelector((set, get) => ({
        opportunities: loadOpportunitiesLocal(),
        loading: false,
        syncStatus: 'idle', // 'idle' | 'syncing' | 'error' | 'success'
        syncError: null,
        pendingSyncCount: loadSyncQueue().length,

        // Initialize - load from Supabase (or localStorage fallback)
        initialize: async () => {
            if (!isSupabaseConfigured()) {
                set({ loading: false, syncStatus: 'idle' });
                return;
            }

            set({ loading: true, syncStatus: 'syncing' });
            try {
                const { data, error } = await supabase
                    .from('opportunities')
                    .select('*')
                    .order('created_at', { ascending: false });

                if (error) throw error;

                const dbOpportunities = (data || []).map(fromDbFormat);

                // Merge with localStorage - DB is source of truth, but keep unsynced local items
                const localOpps = loadOpportunitiesLocal();
                const unsyncedLocal = localOpps.filter(local =>
                    !local._synced && !dbOpportunities.find(db => db.id === local.id)
                );

                // If there are unsynced local opportunities, sync them now
                if (unsyncedLocal.length > 0) {
                    console.log(`Found ${unsyncedLocal.length} unsynced local opportunities, syncing...`);
                    for (const opp of unsyncedLocal) {
                        try {
                            const { data: inserted, error: insertError } = await supabase
                                .from('opportunities')
                                .insert(toDbFormat(opp))
                                .select()
                                .single();

                            if (!insertError && inserted) {
                                // Update local with DB id
                                const syncedOpp = fromDbFormat(inserted);
                                dbOpportunities.unshift(syncedOpp);
                            }
                        } catch (e) {
                            console.error('Failed to sync local opportunity:', e);
                        }
                    }
                }

                saveOpportunitiesLocal(dbOpportunities);
                set({
                    opportunities: dbOpportunities,
                    loading: false,
                    syncStatus: 'success',
                    syncError: null
                });

                // Process any pending sync queue
                await get().processSyncQueue();

            } catch (e) {
                console.error('Failed to load opportunities from DB:', e);
                set({
                    loading: false,
                    syncStatus: 'error',
                    syncError: e.message
                });
            }
        },

        // Process pending sync operations
        processSyncQueue: async () => {
            if (!isSupabaseConfigured()) return;

            const queue = loadSyncQueue();
            if (queue.length === 0) return;

            const newQueue = [];
            for (const item of queue) {
                try {
                    if (item.action === 'insert') {
                        const { error } = await supabase
                            .from('opportunities')
                            .insert(item.data);
                        if (error) throw error;
                    } else if (item.action === 'update') {
                        const { error } = await supabase
                            .from('opportunities')
                            .update(item.data)
                            .eq('id', item.id);
                        if (error) throw error;
                    } else if (item.action === 'delete') {
                        const { error } = await supabase
                            .from('opportunities')
                            .delete()
                            .eq('id', item.id);
                        if (error) throw error;
                    }
                } catch (e) {
                    console.error('Sync queue item failed:', e);
                    // Keep in queue for retry
                    newQueue.push({ ...item, retries: (item.retries || 0) + 1, lastError: e.message });
                }
            }

            saveSyncQueue(newQueue);
            set({ pendingSyncCount: newQueue.length });
        },

        // Add to sync queue for retry
        addToSyncQueue: (action, id, data) => {
            const queue = loadSyncQueue();
            queue.push({ action, id, data, timestamp: Date.now() });
            saveSyncQueue(queue);
            set({ pendingSyncCount: queue.length });
        },

        // Manual sync all local data to Supabase
        syncAllToSupabase: async () => {
            if (!isSupabaseConfigured()) {
                return { success: false, error: 'Supabase not configured' };
            }

            set({ syncStatus: 'syncing' });
            const localOpps = get().opportunities;
            let synced = 0;
            let errors = 0;

            for (const opp of localOpps) {
                try {
                    // Try upsert - insert or update based on id
                    const dbData = toDbFormat(opp);

                    // Check if exists in DB
                    const { data: existing } = await supabase
                        .from('opportunities')
                        .select('id')
                        .eq('id', opp.id)
                        .single();

                    if (existing) {
                        // Update
                        const { error } = await supabase
                            .from('opportunities')
                            .update(dbData)
                            .eq('id', opp.id);
                        if (error) throw error;
                    } else {
                        // Insert
                        const { data: inserted, error } = await supabase
                            .from('opportunities')
                            .insert(dbData)
                            .select()
                            .single();
                        if (error) throw error;

                        // Update local id if different
                        if (inserted && inserted.id !== opp.id) {
                            const opps = get().opportunities.map(o =>
                                o.id === opp.id ? { ...o, id: inserted.id, _synced: true } : o
                            );
                            set({ opportunities: opps });
                            saveOpportunitiesLocal(opps);
                        }
                    }
                    synced++;
                } catch (e) {
                    console.error('Failed to sync opportunity:', opp.title, e);
                    errors++;
                }
            }

            // Mark all as synced
            const syncedOpps = get().opportunities.map(o => ({ ...o, _synced: true }));
            set({
                opportunities: syncedOpps,
                syncStatus: errors > 0 ? 'error' : 'success',
                syncError: errors > 0 ? `${errors} items failed to sync` : null
            });
            saveOpportunitiesLocal(syncedOpps);

            return { success: errors === 0, synced, errors };
        },

        // Add new opportunity
        addOpportunity: async (opportunityData) => {
            const newOpportunity = {
                id: generateId(),
                title: opportunityData.title || '',
                clientId: opportunityData.clientId || null,
                client: opportunityData.client || {},
                region: opportunityData.region || getRegionForCountry(opportunityData.country),
                country: opportunityData.country || '',
                status: opportunityData.status || 'active',
                value: opportunityData.value || 0,
                currency: opportunityData.currency || 'USD',
                probability: opportunityData.probability || 50,
                source: opportunityData.source || '',
                competitors: opportunityData.competitors || [],
                contacts: opportunityData.contacts || [],
                accountOwnerId: opportunityData.accountOwnerId || null,
                brief: opportunityData.brief || '',
                notes: opportunityData.notes || '',
                nextAction: opportunityData.nextAction || '',
                nextActionDate: opportunityData.nextActionDate || null,
                expectedCloseDate: opportunityData.expectedCloseDate || null,
                convertedToQuoteId: null,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                _synced: false,
            };

            // Save locally first (optimistic)
            set(state => {
                const opportunities = [newOpportunity, ...state.opportunities];
                saveOpportunitiesLocal(opportunities);
                return { opportunities };
            });

            // Sync to Supabase
            if (isSupabaseConfigured()) {
                try {
                    const { data, error } = await supabase
                        .from('opportunities')
                        .insert(toDbFormat(newOpportunity))
                        .select()
                        .single();

                    if (error) throw error;

                    // Update with server ID and mark as synced
                    if (data) {
                        set(state => {
                            const opportunities = state.opportunities.map(o =>
                                o.id === newOpportunity.id
                                    ? { ...o, id: data.id, _synced: true }
                                    : o
                            );
                            saveOpportunitiesLocal(opportunities);
                            return { opportunities, syncStatus: 'success', syncError: null };
                        });
                        newOpportunity.id = data.id;
                    }
                } catch (e) {
                    console.error('Failed to save opportunity to DB:', e);
                    // Add to sync queue for retry
                    get().addToSyncQueue('insert', newOpportunity.id, toDbFormat(newOpportunity));
                    set({ syncStatus: 'error', syncError: `Failed to sync: ${e.message}` });
                }
            }

            return newOpportunity;
        },

        // Update opportunity
        updateOpportunity: async (opportunityId, updates) => {
            // Auto-set region based on country if country changed
            if (updates.country && !updates.region) {
                updates.region = getRegionForCountry(updates.country);
            }

            // Update locally first
            set(state => {
                const opportunities = state.opportunities.map(opp =>
                    opp.id === opportunityId
                        ? { ...opp, ...updates, updatedAt: new Date().toISOString(), _synced: false }
                        : opp
                );
                saveOpportunitiesLocal(opportunities);
                return { opportunities };
            });

            // Sync to Supabase
            if (isSupabaseConfigured()) {
                try {
                    const dbUpdates = {};
                    if (updates.title !== undefined) dbUpdates.title = updates.title;
                    if (updates.clientId !== undefined) dbUpdates.client_id = updates.clientId;
                    if (updates.client !== undefined) dbUpdates.client = updates.client;
                    if (updates.region !== undefined) dbUpdates.region = updates.region;
                    if (updates.country !== undefined) dbUpdates.country = updates.country;
                    if (updates.status !== undefined) dbUpdates.status = updates.status;
                    if (updates.value !== undefined) dbUpdates.value = updates.value;
                    if (updates.currency !== undefined) dbUpdates.currency = updates.currency;
                    if (updates.probability !== undefined) dbUpdates.probability = updates.probability;
                    if (updates.source !== undefined) dbUpdates.source = updates.source;
                    if (updates.competitors !== undefined) dbUpdates.competitors = updates.competitors;
                    if (updates.contacts !== undefined) dbUpdates.contacts = updates.contacts;
                    if (updates.accountOwnerId !== undefined) dbUpdates.account_owner_id = updates.accountOwnerId;
                    if (updates.brief !== undefined) dbUpdates.brief = updates.brief;
                    if (updates.notes !== undefined) dbUpdates.notes = updates.notes;
                    if (updates.nextAction !== undefined) dbUpdates.next_action = updates.nextAction;
                    if (updates.nextActionDate !== undefined) dbUpdates.next_action_date = updates.nextActionDate;
                    if (updates.expectedCloseDate !== undefined) dbUpdates.expected_close_date = updates.expectedCloseDate;
                    if (updates.convertedToQuoteId !== undefined) dbUpdates.converted_to_quote_id = updates.convertedToQuoteId;

                    if (Object.keys(dbUpdates).length > 0) {
                        const { error } = await supabase
                            .from('opportunities')
                            .update(dbUpdates)
                            .eq('id', opportunityId);

                        if (error) throw error;

                        // Mark as synced
                        set(state => {
                            const opportunities = state.opportunities.map(opp =>
                                opp.id === opportunityId ? { ...opp, _synced: true } : opp
                            );
                            saveOpportunitiesLocal(opportunities);
                            return { opportunities, syncStatus: 'success', syncError: null };
                        });
                    }
                } catch (e) {
                    console.error('Failed to update opportunity in DB:', e);
                    get().addToSyncQueue('update', opportunityId, updates);
                    set({ syncStatus: 'error', syncError: `Failed to sync update: ${e.message}` });
                }
            }
        },

        // Delete opportunity
        deleteOpportunity: async (opportunityId) => {
            // Delete locally first
            set(state => {
                const opportunities = state.opportunities.filter(o => o.id !== opportunityId);
                saveOpportunitiesLocal(opportunities);
                return { opportunities };
            });

            // Sync to Supabase
            if (isSupabaseConfigured()) {
                try {
                    const { error } = await supabase
                        .from('opportunities')
                        .delete()
                        .eq('id', opportunityId);

                    if (error) throw error;
                    set({ syncStatus: 'success', syncError: null });
                } catch (e) {
                    console.error('Failed to delete opportunity from DB:', e);
                    get().addToSyncQueue('delete', opportunityId, null);
                    set({ syncStatus: 'error', syncError: `Failed to sync delete: ${e.message}` });
                }
            }
        },

        // Get single opportunity
        getOpportunity: (opportunityId) => {
            return get().opportunities.find(o => o.id === opportunityId);
        },

        // Get opportunities for a client
        getClientOpportunities: (clientId) => {
            return get().opportunities.filter(o => o.clientId === clientId);
        },

        // Get opportunities by country
        getOpportunitiesByCountry: (country) => {
            return get().opportunities.filter(o => o.country === country);
        },

        // Get opportunities by region
        getOpportunitiesByRegion: (region) => {
            return get().opportunities.filter(o => o.region === region);
        },

        // Get opportunities grouped by country
        getOpportunitiesGroupedByCountry: () => {
            const { opportunities } = get();
            const grouped = {};

            // Initialize all countries
            ALL_COUNTRIES.forEach(country => {
                grouped[country] = [];
            });
            grouped['Other'] = [];

            // Group opportunities
            opportunities.forEach(opp => {
                const country = opp.country || 'Other';
                if (grouped[country]) {
                    grouped[country].push(opp);
                } else {
                    grouped['Other'].push(opp);
                }
            });

            return grouped;
        },

        // Update status
        updateStatus: async (opportunityId, status) => {
            await get().updateOpportunity(opportunityId, { status });
        },

        // Add contact to opportunity
        addContact: (opportunityId, contact) => {
            const opportunity = get().getOpportunity(opportunityId);
            if (!opportunity) return;

            const newContact = {
                id: generateId(),
                name: contact.name || '',
                role: contact.role || '',
                email: contact.email || '',
                phone: contact.phone || '',
                isPrimary: contact.isPrimary || false,
            };

            let contacts = [...(opportunity.contacts || [])];
            if (newContact.isPrimary) {
                contacts = contacts.map(c => ({ ...c, isPrimary: false }));
            }
            contacts.push(newContact);

            get().updateOpportunity(opportunityId, { contacts });
        },

        // Update contact
        updateContact: (opportunityId, contactId, updates) => {
            const opportunity = get().getOpportunity(opportunityId);
            if (!opportunity) return;

            let contacts = [...(opportunity.contacts || [])];
            if (updates.isPrimary) {
                contacts = contacts.map(c => ({ ...c, isPrimary: false }));
            }
            contacts = contacts.map(c =>
                c.id === contactId ? { ...c, ...updates } : c
            );

            get().updateOpportunity(opportunityId, { contacts });
        },

        // Delete contact
        deleteContact: (opportunityId, contactId) => {
            const opportunity = get().getOpportunity(opportunityId);
            if (!opportunity) return;

            const contacts = (opportunity.contacts || []).filter(c => c.id !== contactId);
            get().updateOpportunity(opportunityId, { contacts });
        },

        // Pipeline stats
        getPipelineStats: () => {
            const { opportunities } = get();
            const active = opportunities.filter(o => o.status === 'active');

            const totalValue = active.reduce((sum, o) => sum + (o.value || 0), 0);
            const weightedValue = active.reduce((sum, o) => {
                const prob = (o.probability || 0) / 100;
                return sum + (o.value || 0) * prob;
            }, 0);

            const byCountry = {};
            active.forEach(o => {
                const country = o.country || 'Other';
                if (!byCountry[country]) {
                    byCountry[country] = { count: 0, value: 0 };
                }
                byCountry[country].count++;
                byCountry[country].value += o.value || 0;
            });

            const byRegion = {};
            active.forEach(o => {
                const region = o.region || 'Other';
                if (!byRegion[region]) {
                    byRegion[region] = { count: 0, value: 0 };
                }
                byRegion[region].count++;
                byRegion[region].value += o.value || 0;
            });

            return {
                totalCount: active.length,
                totalValue,
                weightedValue,
                byCountry,
                byRegion,
                wonCount: opportunities.filter(o => o.status === 'won').length,
                lostCount: opportunities.filter(o => o.status === 'lost').length,
            };
        },

        // Get upcoming actions (next 7 days)
        getUpcomingActions: () => {
            const { opportunities } = get();
            const now = new Date();
            const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

            return opportunities
                .filter(o => {
                    if (o.status !== 'active' || !o.nextActionDate) return false;
                    const actionDate = new Date(o.nextActionDate);
                    return actionDate >= now && actionDate <= weekFromNow;
                })
                .sort((a, b) => new Date(a.nextActionDate) - new Date(b.nextActionDate));
        },

        // Get unsynced count
        getUnsyncedCount: () => {
            return get().opportunities.filter(o => !o._synced).length;
        },

        // Clear sync error
        clearSyncError: () => {
            set({ syncError: null, syncStatus: 'idle' });
        },
    }))
);
