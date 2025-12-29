import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import logger from '../utils/logger';

// Regions and countries
export const REGIONS = {
    SEA: ['Malaysia', 'Singapore', 'Indonesia', 'Thailand', 'Vietnam', 'Philippines', 'Myanmar', 'Cambodia', 'Laos', 'Brunei'],
    GCC: ['Saudi Arabia', 'UAE', 'Qatar', 'Kuwait', 'Bahrain', 'Oman'],
    Levant: ['Jordan', 'Lebanon', 'Iraq', 'Syria'],
    'Central Asia': ['Kazakhstan', 'Uzbekistan', 'Turkmenistan', 'Tajikistan', 'Kyrgyzstan', 'Afghanistan'],
};

export const ALL_COUNTRIES = [...REGIONS.SEA, ...REGIONS.GCC, ...REGIONS.Levant, ...REGIONS['Central Asia']];

export const getRegionForCountry = (country) => {
    if (REGIONS.SEA.includes(country)) return 'SEA';
    if (REGIONS.GCC.includes(country)) return 'GCC';
    if (REGIONS.Levant.includes(country)) return 'Levant';
    if (REGIONS['Central Asia'].includes(country)) return 'Central Asia';
    return 'Other';
};

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
    };
}

// Convert local opportunity to DB format
function toDbFormat(opp) {
    return {
        title: opp.title,
        client_id: opp.clientId || null,
        client: opp.client || {},
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
        next_action_date: opp.nextActionDate || null,
        expected_close_date: opp.expectedCloseDate || null,
        converted_to_quote_id: opp.convertedToQuoteId || null,
    };
}

export const useOpportunityStore = create(
    subscribeWithSelector((set, get) => ({
        opportunities: [],
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
                // Fetch all opportunities
                const { data, error } = await supabase
                    .from('opportunities')
                    .select('*')
                    .order('created_at', { ascending: false });

                if (error) throw error;

                const opportunities = (data || []).map(fromDbFormat);
                set({ opportunities, loading: false, error: null });

                // Subscribe to realtime changes
                get().subscribeToRealtime();

            } catch (e) {
                logger.error('Failed to load opportunities:', e);
                set({ loading: false, error: e.message });
            }
        },

        // Subscribe to Supabase Realtime for live updates
        subscribeToRealtime: () => {
            if (!isSupabaseConfigured()) return;

            // Unsubscribe from existing subscription
            const existing = get().realtimeSubscription;
            if (existing) {
                supabase.removeChannel(existing);
            }

            const channel = supabase
                .channel('opportunities-realtime')
                .on(
                    'postgres_changes',
                    { event: '*', schema: 'public', table: 'opportunities' },
                    (payload) => {
                        const { eventType, new: newRecord, old: oldRecord } = payload;

                        set((state) => {
                            let opportunities = [...state.opportunities];

                            if (eventType === 'INSERT') {
                                // Add new opportunity if not already present
                                const exists = opportunities.find(o => o.id === newRecord.id);
                                if (!exists) {
                                    opportunities = [fromDbFormat(newRecord), ...opportunities];
                                }
                            } else if (eventType === 'UPDATE') {
                                // Update existing opportunity
                                opportunities = opportunities.map(o =>
                                    o.id === newRecord.id ? fromDbFormat(newRecord) : o
                                );
                            } else if (eventType === 'DELETE') {
                                // Remove deleted opportunity
                                opportunities = opportunities.filter(o => o.id !== oldRecord.id);
                            }

                            return { opportunities };
                        });
                    }
                )
                .subscribe();

            set({ realtimeSubscription: channel });
        },

        // Unsubscribe from realtime (cleanup)
        unsubscribe: () => {
            const channel = get().realtimeSubscription;
            if (channel) {
                supabase.removeChannel(channel);
                set({ realtimeSubscription: null });
            }
        },

        // Add new opportunity
        addOpportunity: async (opportunityData) => {
            if (!isSupabaseConfigured()) {
                set({ error: 'Supabase not configured' });
                return null;
            }

            try {
                const newOpp = {
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
                };

                const { data, error } = await supabase
                    .from('opportunities')
                    .insert(toDbFormat(newOpp))
                    .select()
                    .single();

                if (error) throw error;

                // Realtime will handle adding to state, but also add immediately for responsiveness
                const opportunity = fromDbFormat(data);
                set((state) => ({
                    opportunities: [opportunity, ...state.opportunities.filter(o => o.id !== opportunity.id)],
                    error: null,
                }));

                return opportunity;

            } catch (e) {
                logger.error('Failed to add opportunity:', e);
                set({ error: e.message });
                return null;
            }
        },

        // Update opportunity
        updateOpportunity: async (opportunityId, updates) => {
            if (!isSupabaseConfigured()) {
                set({ error: 'Supabase not configured' });
                return;
            }

            // Auto-set region based on country if country changed
            if (updates.country && !updates.region) {
                updates.region = getRegionForCountry(updates.country);
            }

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

                    // Optimistically update local state (realtime will confirm)
                    set((state) => ({
                        opportunities: state.opportunities.map(opp =>
                            opp.id === opportunityId
                                ? { ...opp, ...updates, updatedAt: new Date().toISOString() }
                                : opp
                        ),
                        error: null,
                    }));
                }

            } catch (e) {
                logger.error('Failed to update opportunity:', e);
                set({ error: e.message });
            }
        },

        // Delete opportunity
        deleteOpportunity: async (opportunityId) => {
            if (!isSupabaseConfigured()) {
                set({ error: 'Supabase not configured' });
                return;
            }

            try {
                const { error } = await supabase
                    .from('opportunities')
                    .delete()
                    .eq('id', opportunityId);

                if (error) throw error;

                // Optimistically remove from local state (realtime will confirm)
                set((state) => ({
                    opportunities: state.opportunities.filter(o => o.id !== opportunityId),
                    error: null,
                }));

            } catch (e) {
                logger.error('Failed to delete opportunity:', e);
                set({ error: e.message });
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
        addContact: async (opportunityId, contact) => {
            const opportunity = get().getOpportunity(opportunityId);
            if (!opportunity) return;

            const newContact = {
                id: crypto.randomUUID(),
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

            await get().updateOpportunity(opportunityId, { contacts });
        },

        // Update contact
        updateContact: async (opportunityId, contactId, updates) => {
            const opportunity = get().getOpportunity(opportunityId);
            if (!opportunity) return;

            let contacts = [...(opportunity.contacts || [])];
            if (updates.isPrimary) {
                contacts = contacts.map(c => ({ ...c, isPrimary: false }));
            }
            contacts = contacts.map(c =>
                c.id === contactId ? { ...c, ...updates } : c
            );

            await get().updateOpportunity(opportunityId, { contacts });
        },

        // Delete contact
        deleteContact: async (opportunityId, contactId) => {
            const opportunity = get().getOpportunity(opportunityId);
            if (!opportunity) return;

            const contacts = (opportunity.contacts || []).filter(c => c.id !== contactId);
            await get().updateOpportunity(opportunityId, { contacts });
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

        // Clear error
        clearError: () => {
            set({ error: null });
        },
    }))
);
