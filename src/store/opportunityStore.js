import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import logger from '../utils/logger';

// Sales pipeline stages
export const PIPELINE_STAGES = {
    lead: { id: 'lead', label: 'Lead', color: '#6B7280', order: 0 },
    qualified: { id: 'qualified', label: 'Qualified', color: '#3B82F6', order: 1 },
    proposal: { id: 'proposal', label: 'Proposal', color: '#8B5CF6', order: 2 },
    negotiation: { id: 'negotiation', label: 'Negotiation', color: '#F59E0B', order: 3 },
    won: { id: 'won', label: 'Closed Won', color: '#10B981', order: 4 },
    lost: { id: 'lost', label: 'Closed Lost', color: '#EF4444', order: 5 },
};

export const PIPELINE_STAGE_ORDER = ['lead', 'qualified', 'proposal', 'negotiation', 'won', 'lost'];

// Global regions and countries - comprehensive list for international SaaS
export const REGIONS = {
    // Americas
    'North America': ['United States', 'Canada', 'Mexico'],
    'Central America': ['Guatemala', 'Belize', 'El Salvador', 'Honduras', 'Nicaragua', 'Costa Rica', 'Panama'],
    'Caribbean': ['Cuba', 'Jamaica', 'Haiti', 'Dominican Republic', 'Puerto Rico', 'Trinidad and Tobago', 'Barbados', 'Bahamas'],
    'South America': ['Brazil', 'Argentina', 'Colombia', 'Peru', 'Venezuela', 'Chile', 'Ecuador', 'Bolivia', 'Paraguay', 'Uruguay', 'Guyana', 'Suriname'],
    // Europe
    'Western Europe': ['United Kingdom', 'Ireland', 'France', 'Germany', 'Netherlands', 'Belgium', 'Luxembourg', 'Switzerland', 'Austria', 'Liechtenstein'],
    'Southern Europe': ['Spain', 'Portugal', 'Italy', 'Greece', 'Malta', 'Cyprus', 'Andorra', 'San Marino', 'Monaco', 'Vatican City'],
    'Northern Europe': ['Sweden', 'Norway', 'Denmark', 'Finland', 'Iceland', 'Estonia', 'Latvia', 'Lithuania'],
    'Eastern Europe': ['Poland', 'Czech Republic', 'Slovakia', 'Hungary', 'Romania', 'Bulgaria', 'Ukraine', 'Belarus', 'Moldova', 'Russia'],
    'Balkans': ['Croatia', 'Slovenia', 'Serbia', 'Bosnia and Herzegovina', 'Montenegro', 'North Macedonia', 'Albania', 'Kosovo'],
    // Middle East
    'GCC': ['Saudi Arabia', 'UAE', 'Qatar', 'Kuwait', 'Bahrain', 'Oman'],
    'Levant': ['Jordan', 'Lebanon', 'Iraq', 'Syria', 'Israel', 'Palestine'],
    'Other Middle East': ['Turkey', 'Iran', 'Yemen'],
    // Asia
    'Central Asia': ['Kazakhstan', 'Uzbekistan', 'Turkmenistan', 'Tajikistan', 'Kyrgyzstan', 'Afghanistan', 'Mongolia'],
    'South Asia': ['India', 'Pakistan', 'Bangladesh', 'Sri Lanka', 'Nepal', 'Bhutan', 'Maldives'],
    'Southeast Asia': ['Malaysia', 'Singapore', 'Indonesia', 'Thailand', 'Vietnam', 'Philippines', 'Myanmar', 'Cambodia', 'Laos', 'Brunei', 'Timor-Leste'],
    'East Asia': ['China', 'Japan', 'South Korea', 'Taiwan', 'Hong Kong', 'Macau'],
    // Oceania
    'Oceania': ['Australia', 'New Zealand', 'Fiji', 'Papua New Guinea', 'Samoa', 'Tonga', 'Vanuatu', 'Solomon Islands'],
    // Africa
    'North Africa': ['Egypt', 'Morocco', 'Algeria', 'Tunisia', 'Libya', 'Sudan'],
    'West Africa': ['Nigeria', 'Ghana', 'Senegal', "Cote d'Ivoire", 'Mali', 'Burkina Faso', 'Niger', 'Guinea', 'Benin', 'Togo', 'Sierra Leone', 'Liberia', 'Mauritania', 'Gambia'],
    'East Africa': ['Kenya', 'Tanzania', 'Uganda', 'Ethiopia', 'Rwanda', 'Burundi', 'Somalia', 'Djibouti', 'Eritrea', 'South Sudan', 'Mauritius', 'Seychelles', 'Madagascar'],
    'Central Africa': ['DR Congo', 'Congo', 'Central African Republic', 'Cameroon', 'Chad', 'Gabon', 'Equatorial Guinea', 'Sao Tome and Principe', 'Angola'],
    'Southern Africa': ['South Africa', 'Zimbabwe', 'Zambia', 'Botswana', 'Namibia', 'Mozambique', 'Malawi', 'Eswatini', 'Lesotho'],
    // Caucasus
    'Caucasus': ['Georgia', 'Armenia', 'Azerbaijan'],
};

// Flattened list of all countries for dropdowns
export const ALL_COUNTRIES = Object.values(REGIONS).flat().sort();

export const getRegionForCountry = (country) => {
    for (const [region, countries] of Object.entries(REGIONS)) {
        if (countries.includes(country)) return region;
    }
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
        stage: o.stage || 'lead', // Pipeline stage
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
        stage: opp.stage || 'lead',
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
                    stage: opportunityData.stage || 'lead',
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

            // Stage transition validation - require certain fields for key stages
            if (updates.stage) {
                const opp = get().opportunities.find(o => o.id === opportunityId);
                const merged = { ...opp, ...updates };

                // Validate required fields for 'won' stage
                if (updates.stage === 'won') {
                    if (!merged.value || merged.value <= 0) {
                        set({ error: 'Cannot mark as won: Deal value is required' });
                        logger.warn('Opportunity stage validation failed: missing value for won stage');
                        return { success: false, error: 'Deal value is required to mark as won' };
                    }
                }

                // Auto-set probability based on stage
                if (updates.stage === 'won' && !updates.probability) {
                    updates.probability = 100;
                } else if (updates.stage === 'lost' && !updates.probability) {
                    updates.probability = 0;
                }
            }

            try {
                const dbUpdates = {};
                if (updates.title !== undefined) dbUpdates.title = updates.title;
                if (updates.clientId !== undefined) dbUpdates.client_id = updates.clientId;
                if (updates.client !== undefined) dbUpdates.client = updates.client;
                if (updates.region !== undefined) dbUpdates.region = updates.region;
                if (updates.country !== undefined) dbUpdates.country = updates.country;
                if (updates.status !== undefined) dbUpdates.status = updates.status;
                if (updates.stage !== undefined) dbUpdates.stage = updates.stage;
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

        // Update stage (pipeline) with validation
        updateStage: async (opportunityId, newStage) => {
            const opportunity = get().getOpportunity(opportunityId);
            if (!opportunity) {
                logger.error('Cannot update stage: opportunity not found', { opportunityId });
                return { success: false, error: 'Opportunity not found' };
            }

            const currentStage = opportunity.stage || 'lead';

            // Validate stage exists
            if (!PIPELINE_STAGES[newStage]) {
                logger.error('Invalid stage', { newStage });
                return { success: false, error: `Invalid stage: ${newStage}` };
            }

            // Terminal stages ('won' and 'lost') cannot be changed
            // Users must create a new opportunity if they want to reopen
            if (currentStage === 'won' || currentStage === 'lost') {
                logger.warn('Cannot change stage of closed opportunity', {
                    opportunityId,
                    currentStage,
                    attemptedStage: newStage
                });
                return {
                    success: false,
                    error: `Cannot change stage of a ${currentStage === 'won' ? 'won' : 'lost'} opportunity. Create a new opportunity instead.`
                };
            }

            // Auto-update status based on stage
            let updates = { stage: newStage };
            if (newStage === 'won') {
                updates.status = 'won';
            } else if (newStage === 'lost') {
                updates.status = 'lost';
            } else if (['lead', 'qualified', 'proposal', 'negotiation'].includes(newStage)) {
                updates.status = 'active';
            }

            await get().updateOpportunity(opportunityId, updates);
            return { success: true };
        },

        // Get opportunities grouped by stage
        getOpportunitiesGroupedByStage: () => {
            const { opportunities } = get();
            const grouped = {};

            // Initialize all stages
            PIPELINE_STAGE_ORDER.forEach(stageId => {
                grouped[stageId] = [];
            });

            // Group opportunities
            opportunities.forEach(opp => {
                const stage = opp.stage || 'lead';
                if (grouped[stage]) {
                    grouped[stage].push(opp);
                } else {
                    grouped['lead'].push(opp);
                }
            });

            return grouped;
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

        // Convert opportunity to quote data (for use with quoteStore)
        // Returns quote data object that can be loaded into quoteStore
        convertToQuoteData: (opportunityId) => {
            const opportunity = get().getOpportunity(opportunityId);
            if (!opportunity) return null;

            // Get primary contact from opportunity
            const primaryContact = opportunity.contacts?.find(c => c.isPrimary) || opportunity.contacts?.[0];

            return {
                // Client info
                client: {
                    company: opportunity.client?.company || opportunity.title || '',
                    contact: primaryContact?.name || '',
                    email: primaryContact?.email || '',
                    phone: primaryContact?.phone || '',
                    role: primaryContact?.role || '',
                    clientId: opportunity.clientId || null,
                },
                // Project info from opportunity
                project: {
                    title: opportunity.title || '',
                    description: opportunity.brief || '',
                    type: 'broadcast', // Default type
                },
                // Settings
                currency: opportunity.currency || 'USD',
                region: opportunity.region || '',
                // Link back to opportunity
                opportunityId: opportunity.id,
                // Copy value as initial estimate
                estimatedValue: opportunity.value || 0,
            };
        },

        // Mark opportunity as converted to quote
        markAsConvertedToQuote: async (opportunityId, quoteId) => {
            await get().updateOpportunity(opportunityId, {
                convertedToQuoteId: quoteId,
                stage: 'proposal', // Move to proposal stage
            });
        },
    }))
);
