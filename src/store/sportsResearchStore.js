import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

// Sports we track
export const SPORTS = {
    FOOTBALL: 'Football',
    FUTSAL: 'Futsal',
    HANDBALL: 'Handball',
    VOLLEYBALL: 'Volleyball',
    BASKETBALL: 'Basketball',
};

export const SPORTS_CONFIG = {
    [SPORTS.FOOTBALL]: { icon: '⚽', color: 'bg-green-500/20 text-green-400 border-green-500/30' },
    [SPORTS.FUTSAL]: { icon: '🥅', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
    [SPORTS.HANDBALL]: { icon: '🤾', color: 'bg-orange-500/20 text-orange-400 border-orange-500/30' },
    [SPORTS.VOLLEYBALL]: { icon: '🏐', color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' },
    [SPORTS.BASKETBALL]: { icon: '🏀', color: 'bg-red-500/20 text-red-400 border-red-500/30' },
};

// Regions we cover
export const TARGET_REGIONS = {
    SEA: ['Malaysia', 'Singapore', 'Indonesia', 'Thailand', 'Vietnam', 'Philippines', 'Myanmar', 'Cambodia', 'Laos', 'Brunei'],
    Gulf: ['Saudi Arabia', 'UAE', 'Qatar', 'Kuwait', 'Bahrain', 'Oman'],
    Levant: ['Jordan', 'Lebanon', 'Syria', 'Palestine', 'Iraq'],
    'Central Asia': ['Kazakhstan', 'Uzbekistan', 'Turkmenistan', 'Tajikistan', 'Kyrgyzstan'],
    Afghanistan: ['Afghanistan'],
};

// Known major events/leagues per sport and region (seed data)
const KNOWN_EVENTS = [
    // SEA Football
    { sport: SPORTS.FOOTBALL, event_name: 'Malaysian Super League', organization: 'Football Malaysia', country: 'Malaysia', region: 'SEA', event_type: 'league', tier: 'national' },
    { sport: SPORTS.FOOTBALL, event_name: 'AFF Championship', organization: 'ASEAN Football Federation', country: 'Regional', region: 'SEA', event_type: 'tournament', tier: 'international' },
    { sport: SPORTS.FOOTBALL, event_name: 'Thai League 1', organization: 'Thai League', country: 'Thailand', region: 'SEA', event_type: 'league', tier: 'national' },
    { sport: SPORTS.FOOTBALL, event_name: 'Liga 1 Indonesia', organization: 'PSSI', country: 'Indonesia', region: 'SEA', event_type: 'league', tier: 'national' },
    { sport: SPORTS.FOOTBALL, event_name: 'V.League 1', organization: 'VFF', country: 'Vietnam', region: 'SEA', event_type: 'league', tier: 'national' },
    { sport: SPORTS.FOOTBALL, event_name: 'Singapore Premier League', organization: 'FAS', country: 'Singapore', region: 'SEA', event_type: 'league', tier: 'national' },

    // Gulf Football
    { sport: SPORTS.FOOTBALL, event_name: 'Saudi Pro League', organization: 'SAFF', country: 'Saudi Arabia', region: 'Gulf', event_type: 'league', tier: 'national' },
    { sport: SPORTS.FOOTBALL, event_name: 'UAE Pro League', organization: 'UAE FA', country: 'UAE', region: 'Gulf', event_type: 'league', tier: 'national' },
    { sport: SPORTS.FOOTBALL, event_name: 'Qatar Stars League', organization: 'QFA', country: 'Qatar', region: 'Gulf', event_type: 'league', tier: 'national' },
    { sport: SPORTS.FOOTBALL, event_name: 'Kuwait Premier League', organization: 'KFA', country: 'Kuwait', region: 'Gulf', event_type: 'league', tier: 'national' },
    { sport: SPORTS.FOOTBALL, event_name: 'Bahrain Premier League', organization: 'BFA', country: 'Bahrain', region: 'Gulf', event_type: 'league', tier: 'national' },
    { sport: SPORTS.FOOTBALL, event_name: 'Oman Professional League', organization: 'OFA', country: 'Oman', region: 'Gulf', event_type: 'league', tier: 'national' },
    { sport: SPORTS.FOOTBALL, event_name: 'Gulf Cup of Nations', organization: 'Gulf Football Federation', country: 'Regional', region: 'Gulf', event_type: 'tournament', tier: 'international' },

    // Levant Football
    { sport: SPORTS.FOOTBALL, event_name: 'Jordan Pro League', organization: 'JFA', country: 'Jordan', region: 'Levant', event_type: 'league', tier: 'national' },
    { sport: SPORTS.FOOTBALL, event_name: 'Lebanese Premier League', organization: 'LFA', country: 'Lebanon', region: 'Levant', event_type: 'league', tier: 'national' },
    { sport: SPORTS.FOOTBALL, event_name: 'Iraqi Premier League', organization: 'IFA', country: 'Iraq', region: 'Levant', event_type: 'league', tier: 'national' },
    { sport: SPORTS.FOOTBALL, event_name: 'West Bank Premier League', organization: 'PFA', country: 'Palestine', region: 'Levant', event_type: 'league', tier: 'national' },

    // Central Asia Football
    { sport: SPORTS.FOOTBALL, event_name: 'Kazakhstan Premier League', organization: 'KFF', country: 'Kazakhstan', region: 'Central Asia', event_type: 'league', tier: 'national' },
    { sport: SPORTS.FOOTBALL, event_name: 'Uzbekistan Super League', organization: 'UFA', country: 'Uzbekistan', region: 'Central Asia', event_type: 'league', tier: 'national' },
    { sport: SPORTS.FOOTBALL, event_name: 'Turkmenistan Higher League', organization: 'FFT', country: 'Turkmenistan', region: 'Central Asia', event_type: 'league', tier: 'national' },
    { sport: SPORTS.FOOTBALL, event_name: 'Tajikistan Higher League', organization: 'TFF', country: 'Tajikistan', region: 'Central Asia', event_type: 'league', tier: 'national' },
    { sport: SPORTS.FOOTBALL, event_name: 'Kyrgyzstan Premier League', organization: 'KFU', country: 'Kyrgyzstan', region: 'Central Asia', event_type: 'league', tier: 'national' },

    // Afghanistan Football
    { sport: SPORTS.FOOTBALL, event_name: 'Afghan Premier League', organization: 'AFF', country: 'Afghanistan', region: 'Afghanistan', event_type: 'league', tier: 'national' },

    // Futsal
    { sport: SPORTS.FUTSAL, event_name: 'AFF Futsal Championship', organization: 'ASEAN Football Federation', country: 'Regional', region: 'SEA', event_type: 'tournament', tier: 'international' },
    { sport: SPORTS.FUTSAL, event_name: 'Malaysia Futsal League', organization: 'Football Malaysia', country: 'Malaysia', region: 'SEA', event_type: 'league', tier: 'national' },
    { sport: SPORTS.FUTSAL, event_name: 'Thai Futsal League', organization: 'Thai FA', country: 'Thailand', region: 'SEA', event_type: 'league', tier: 'national' },
    { sport: SPORTS.FUTSAL, event_name: 'AFC Futsal Asian Cup', organization: 'AFC', country: 'Regional', region: 'Gulf', event_type: 'tournament', tier: 'international' },

    // Handball
    { sport: SPORTS.HANDBALL, event_name: 'Asian Handball Championship', organization: 'AHF', country: 'Regional', region: 'SEA', event_type: 'tournament', tier: 'international' },
    { sport: SPORTS.HANDBALL, event_name: 'Gulf Handball Championship', organization: 'GHF', country: 'Regional', region: 'Gulf', event_type: 'tournament', tier: 'international' },
    { sport: SPORTS.HANDBALL, event_name: 'Saudi Handball League', organization: 'SAHF', country: 'Saudi Arabia', region: 'Gulf', event_type: 'league', tier: 'national' },
    { sport: SPORTS.HANDBALL, event_name: 'Kuwait Handball League', organization: 'KHF', country: 'Kuwait', region: 'Gulf', event_type: 'league', tier: 'national' },

    // Volleyball
    { sport: SPORTS.VOLLEYBALL, event_name: 'AVC Cup', organization: 'Asian Volleyball Confederation', country: 'Regional', region: 'SEA', event_type: 'tournament', tier: 'international' },
    { sport: SPORTS.VOLLEYBALL, event_name: 'Thai Volleyball League', organization: 'TVA', country: 'Thailand', region: 'SEA', event_type: 'league', tier: 'national' },
    { sport: SPORTS.VOLLEYBALL, event_name: 'Indonesia Proliga', organization: 'PBVSI', country: 'Indonesia', region: 'SEA', event_type: 'league', tier: 'national' },
    { sport: SPORTS.VOLLEYBALL, event_name: 'Gulf Volleyball Championship', organization: 'GVF', country: 'Regional', region: 'Gulf', event_type: 'tournament', tier: 'international' },

    // Basketball
    { sport: SPORTS.BASKETBALL, event_name: 'ASEAN Basketball League', organization: 'ABL', country: 'Regional', region: 'SEA', event_type: 'league', tier: 'international' },
    { sport: SPORTS.BASKETBALL, event_name: 'Philippines Basketball Association', organization: 'PBA', country: 'Philippines', region: 'SEA', event_type: 'league', tier: 'national' },
    { sport: SPORTS.BASKETBALL, event_name: 'Malaysia Basketball League', organization: 'MABA', country: 'Malaysia', region: 'SEA', event_type: 'league', tier: 'national' },
    { sport: SPORTS.BASKETBALL, event_name: 'Thai Basketball League', organization: 'TBL', country: 'Thailand', region: 'SEA', event_type: 'league', tier: 'national' },
    { sport: SPORTS.BASKETBALL, event_name: 'FIBA Asia Cup', organization: 'FIBA Asia', country: 'Regional', region: 'Gulf', event_type: 'tournament', tier: 'international' },
];

// Convert DB format
function fromDbFormat(record) {
    return {
        id: record.id,
        sport: record.sport,
        eventName: record.event_name,
        organization: record.organization,
        country: record.country,
        region: record.region,
        startDate: record.start_date,
        endDate: record.end_date,
        venue: record.venue,
        eventType: record.event_type,
        tier: record.tier,
        broadcastStatus: record.broadcast_status,
        estimatedValue: record.estimated_value,
        currency: record.currency || 'USD',
        sourceUrl: record.source_url,
        notes: record.notes,
        contacts: record.contacts || [],
        convertedToOpportunityId: record.converted_to_opportunity_id,
        researchStatus: record.research_status,
        discoveredAt: record.discovered_at,
        updatedAt: record.updated_at,
    };
}

function toDbFormat(event) {
    return {
        sport: event.sport,
        event_name: event.eventName,
        organization: event.organization,
        country: event.country,
        region: event.region,
        start_date: event.startDate || null,
        end_date: event.endDate || null,
        venue: event.venue,
        event_type: event.eventType,
        tier: event.tier,
        broadcast_status: event.broadcastStatus,
        estimated_value: event.estimatedValue || null,
        currency: event.currency || 'USD',
        source_url: event.sourceUrl,
        notes: event.notes,
        contacts: event.contacts || [],
        converted_to_opportunity_id: event.convertedToOpportunityId || null,
        research_status: event.researchStatus || 'new',
    };
}

export const useSportsResearchStore = create(
    subscribeWithSelector((set, get) => ({
        events: [],
        loading: false,
        error: null,
        lastResearchDate: null,

        // Initialize and load events
        initialize: async () => {
            if (!isSupabaseConfigured()) {
                set({ loading: false, error: 'Supabase not configured' });
                return;
            }

            set({ loading: true, error: null });

            try {
                const { data, error } = await supabase
                    .from('sports_events')
                    .select('*')
                    .order('discovered_at', { ascending: false });

                if (error) throw error;

                if (data && data.length > 0) {
                    set({ events: data.map(fromDbFormat), loading: false });
                } else {
                    // Seed with known events if table is empty
                    await get().seedKnownEvents();
                }
            } catch (e) {
                console.error('Failed to load sports events:', e);
                set({ loading: false, error: e.message });
            }
        },

        // Seed the database with known events
        seedKnownEvents: async () => {
            if (!isSupabaseConfigured()) return;

            try {
                const eventsToInsert = KNOWN_EVENTS.map(e => ({
                    ...toDbFormat({
                        ...e,
                        eventName: e.event_name,
                        eventType: e.event_type,
                        researchStatus: 'new',
                    }),
                    event_name: e.event_name,
                    event_type: e.event_type,
                }));

                const { data, error } = await supabase
                    .from('sports_events')
                    .insert(eventsToInsert)
                    .select();

                if (error) throw error;

                set({
                    events: data ? data.map(fromDbFormat) : [],
                    loading: false,
                    lastResearchDate: new Date().toISOString(),
                });
            } catch (e) {
                console.error('Failed to seed events:', e);
                set({ loading: false, error: e.message });
            }
        },

        // Add a discovered event
        addEvent: async (eventData) => {
            if (!isSupabaseConfigured()) return null;

            try {
                const { data, error } = await supabase
                    .from('sports_events')
                    .insert(toDbFormat(eventData))
                    .select()
                    .single();

                if (error) throw error;

                const newEvent = fromDbFormat(data);
                set((state) => ({
                    events: [newEvent, ...state.events],
                }));

                return newEvent;
            } catch (e) {
                console.error('Failed to add event:', e);
                return null;
            }
        },

        // Update event status
        updateEventStatus: async (eventId, status) => {
            if (!isSupabaseConfigured()) return;

            try {
                const { error } = await supabase
                    .from('sports_events')
                    .update({ research_status: status, updated_at: new Date().toISOString() })
                    .eq('id', eventId);

                if (error) throw error;

                set((state) => ({
                    events: state.events.map(e =>
                        e.id === eventId ? { ...e, researchStatus: status } : e
                    ),
                }));
            } catch (e) {
                console.error('Failed to update event status:', e);
            }
        },

        // Convert event to opportunity
        convertToOpportunity: async (eventId, opportunityId) => {
            if (!isSupabaseConfigured()) return;

            try {
                const { error } = await supabase
                    .from('sports_events')
                    .update({
                        research_status: 'converted',
                        converted_to_opportunity_id: opportunityId,
                        updated_at: new Date().toISOString(),
                    })
                    .eq('id', eventId);

                if (error) throw error;

                set((state) => ({
                    events: state.events.map(e =>
                        e.id === eventId
                            ? { ...e, researchStatus: 'converted', convertedToOpportunityId: opportunityId }
                            : e
                    ),
                }));
            } catch (e) {
                console.error('Failed to convert event:', e);
            }
        },

        // Get events by sport
        getEventsBySport: (sport) => {
            return get().events.filter(e => e.sport === sport);
        },

        // Get events by region
        getEventsByRegion: (region) => {
            return get().events.filter(e => e.region === region);
        },

        // Get events by status
        getEventsByStatus: (status) => {
            return get().events.filter(e => e.researchStatus === status);
        },

        // Get new events (not reviewed)
        getNewEvents: () => {
            return get().events.filter(e => e.researchStatus === 'new');
        },

        // Get stats
        getStats: () => {
            const events = get().events;
            const bySport = {};
            const byRegion = {};
            const byStatus = {};

            events.forEach(e => {
                bySport[e.sport] = (bySport[e.sport] || 0) + 1;
                byRegion[e.region] = (byRegion[e.region] || 0) + 1;
                byStatus[e.researchStatus] = (byStatus[e.researchStatus] || 0) + 1;
            });

            return {
                total: events.length,
                new: byStatus['new'] || 0,
                reviewed: byStatus['reviewed'] || 0,
                converted: byStatus['converted'] || 0,
                dismissed: byStatus['dismissed'] || 0,
                bySport,
                byRegion,
            };
        },

        // Dismiss event
        dismissEvent: async (eventId) => {
            await get().updateEventStatus(eventId, 'dismissed');
        },

        // Mark as reviewed
        markReviewed: async (eventId) => {
            await get().updateEventStatus(eventId, 'reviewed');
        },
    }))
);
