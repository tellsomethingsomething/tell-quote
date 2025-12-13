import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

const OPPORTUNITIES_STORAGE_KEY = 'tell_opportunities';

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

function generateId() {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
}

export const useOpportunityStore = create(
    subscribeWithSelector((set, get) => ({
        opportunities: loadOpportunitiesLocal(),
        loading: false,

        // Initialize - load from Supabase (or localStorage fallback)
        initialize: async () => {
            if (!isSupabaseConfigured()) {
                set({ loading: false });
                return;
            }

            set({ loading: true });
            try {
                const { data, error } = await supabase
                    .from('opportunities')
                    .select('*')
                    .order('created_at', { ascending: false });

                if (error) throw error;

                const opportunities = (data || []).map(o => ({
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
                }));

                saveOpportunitiesLocal(opportunities);
                set({ opportunities, loading: false });
            } catch (e) {
                console.error('Failed to load opportunities from DB:', e);
                set({ loading: false });
            }
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
            };

            // Save to Supabase if configured
            if (isSupabaseConfigured()) {
                try {
                    const { data, error } = await supabase
                        .from('opportunities')
                        .insert({
                            title: newOpportunity.title,
                            client_id: newOpportunity.clientId,
                            client: newOpportunity.client,
                            region: newOpportunity.region,
                            country: newOpportunity.country,
                            status: newOpportunity.status,
                            value: newOpportunity.value,
                            currency: newOpportunity.currency,
                            probability: newOpportunity.probability,
                            source: newOpportunity.source,
                            competitors: newOpportunity.competitors,
                            contacts: newOpportunity.contacts,
                            account_owner_id: newOpportunity.accountOwnerId,
                            brief: newOpportunity.brief,
                            notes: newOpportunity.notes,
                            next_action: newOpportunity.nextAction,
                            next_action_date: newOpportunity.nextActionDate,
                            expected_close_date: newOpportunity.expectedCloseDate,
                        })
                        .select()
                        .single();

                    if (error) throw error;
                    newOpportunity.id = data.id;
                } catch (e) {
                    console.error('Failed to save opportunity to DB:', e);
                }
            }

            set(state => {
                const opportunities = [newOpportunity, ...state.opportunities];
                saveOpportunitiesLocal(opportunities);
                return { opportunities };
            });

            return newOpportunity;
        },

        // Update opportunity
        updateOpportunity: async (opportunityId, updates) => {
            // Auto-set region based on country if country changed
            if (updates.country && !updates.region) {
                updates.region = getRegionForCountry(updates.country);
            }

            set(state => {
                const opportunities = state.opportunities.map(opp =>
                    opp.id === opportunityId
                        ? { ...opp, ...updates, updatedAt: new Date().toISOString() }
                        : opp
                );
                saveOpportunitiesLocal(opportunities);
                return { opportunities };
            });

            // Save to Supabase if configured
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
                        await supabase
                            .from('opportunities')
                            .update(dbUpdates)
                            .eq('id', opportunityId);
                    }
                } catch (e) {
                    console.error('Failed to update opportunity in DB:', e);
                }
            }
        },

        // Delete opportunity
        deleteOpportunity: async (opportunityId) => {
            set(state => {
                const opportunities = state.opportunities.filter(o => o.id !== opportunityId);
                saveOpportunitiesLocal(opportunities);
                return { opportunities };
            });

            if (isSupabaseConfigured()) {
                try {
                    await supabase.from('opportunities').delete().eq('id', opportunityId);
                } catch (e) {
                    console.error('Failed to delete opportunity from DB:', e);
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
    }))
);
