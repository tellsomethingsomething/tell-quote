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
    CYCLING: 'Cycling',
};

export const SPORTS_CONFIG = {
    [SPORTS.FOOTBALL]: { icon: '⚽', color: 'bg-green-500/20 text-green-400 border-green-500/30' },
    [SPORTS.FUTSAL]: { icon: '🥅', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
    [SPORTS.HANDBALL]: { icon: '🤾', color: 'bg-orange-500/20 text-orange-400 border-orange-500/30' },
    [SPORTS.VOLLEYBALL]: { icon: '🏐', color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' },
    [SPORTS.BASKETBALL]: { icon: '🏀', color: 'bg-red-500/20 text-red-400 border-red-500/30' },
    [SPORTS.CYCLING]: { icon: '🚴', color: 'bg-purple-500/20 text-purple-400 border-purple-500/30' },
};

// Regions we cover
export const TARGET_REGIONS = {
    SEA: ['Malaysia', 'Singapore', 'Indonesia', 'Thailand', 'Vietnam', 'Philippines', 'Myanmar', 'Cambodia', 'Laos', 'Brunei'],
    GCC: ['Saudi Arabia', 'UAE', 'Qatar', 'Kuwait', 'Bahrain', 'Oman'],
    Levant: ['Jordan', 'Lebanon', 'Iraq', 'Syria'],
    'Central Asia': ['Kazakhstan', 'Uzbekistan', 'Turkmenistan', 'Tajikistan', 'Kyrgyzstan', 'Afghanistan'],
};

// Research prompt for AI assistant
export const RESEARCH_PROMPT = `**Sports Event Research Assistant**

You are a market research assistant for Tell Productions, a sports production company specialising in broadcast graphics and stadium visuals.

**Your task:** Identify upcoming sporting events that represent production opportunities.

**Geographic scope:**
- GCC (UAE, Saudi, Kuwait, Qatar, Bahrain, Oman)
- Levant (Jordan, Lebanon, Iraq, Syria)
- Central Asia (Kazakhstan, Uzbekistan, Kyrgyzstan, Tajikistan, Turkmenistan, Afghanistan)
- Southeast Asia (Malaysia, Thailand, Indonesia, Singapore, Vietnam, Philippines, Cambodia, Laos, Brunei)

**Sports:** Football, Volleyball, Basketball, Futsal, Handball, Cycling

**Event types to find:**
- Multi-sport events (Asian Games, SEA Games, Islamic Solidarity Games, GCC Games, etc.)
- International tournaments and championships
- Federation-organised tournaments (AFC, AFF, AVC, FIBA Asia, etc.)
- Regional tournaments and cups
- Youth tournaments (U17, U19, U21, U23)
- Cup finals
- Exhibition matches and friendlies
- New/inaugural events

**Exclude:** Regular domestic league fixtures

**For each event, provide:**
- Event name and dates
- Host city/venue
- Organising body/federation
- Key decision makers (names, titles, contact details where available)
- Current production partner (if known)
- Opportunity assessment

**Reference sources:**
- Our existing quotes and opportunities data
- Federation websites and announcements
- Sports news and calendars
- Your own market analysis

Present findings in a table format, prioritised by date and opportunity size.`;

// Key upcoming events (tournaments, championships - NOT leagues)
// These are events 1-2 years out that represent real opportunities
const KEY_EVENTS = [
    // 2025 Events
    { sport: SPORTS.FOOTBALL, event_name: 'FIFA Club World Cup 2025', organization: 'FIFA', country: 'USA', region: 'Other', event_type: 'tournament', tier: 'international', start_date: '2025-06-15', end_date: '2025-07-13', venue: 'Multiple US cities', notes: 'New expanded 32-team format. Asian clubs participating.' },
    { sport: SPORTS.FOOTBALL, event_name: 'SEA Games 2025', organization: 'SEAGF', country: 'Thailand', region: 'SEA', event_type: 'multi-sport', tier: 'international', start_date: '2025-12-09', end_date: '2025-12-20', venue: 'Bangkok, Chonburi', notes: '33rd SEA Games. Football, volleyball, basketball, futsal, handball.' },

    // 2026 Events
    { sport: SPORTS.FOOTBALL, event_name: 'AFC U-23 Asian Cup 2026', organization: 'AFC', country: 'Saudi Arabia', region: 'GCC', event_type: 'tournament', tier: 'international', start_date: '2026-01-07', end_date: '2026-01-25', venue: 'Jeddah', notes: 'Olympic qualifier pathway' },
    { sport: SPORTS.HANDBALL, event_name: 'Asian Men\'s Handball Championship 2026', organization: 'Asian Handball Federation', country: 'Kuwait', region: 'GCC', event_type: 'tournament', tier: 'international', start_date: '2026-01-15', end_date: '2026-01-29', venue: 'Sabah Al-Salem, Kuwait', notes: 'Qualifies top 4 for 2027 World Championship' },
    { sport: SPORTS.FUTSAL, event_name: 'AFC Futsal Asian Cup 2026', organization: 'AFC', country: 'Indonesia', region: 'SEA', event_type: 'tournament', tier: 'international', start_date: '2026-01-27', end_date: '2026-02-08', venue: 'TBD Indonesia', notes: 'Indonesia hosting for 2nd time' },
    { sport: SPORTS.BASKETBALL, event_name: 'FIBA 3x3 Asia Cup 2026', organization: 'FIBA', country: 'Singapore', region: 'SEA', event_type: 'tournament', tier: 'international', start_date: '2026-04-01', end_date: '2026-04-05', venue: 'Singapore Sports Hub', notes: 'Part of 3 FIBA events in Singapore 2026-27' },
    { sport: SPORTS.FOOTBALL, event_name: 'ASEAN Hyundai Cup 2026', organization: 'ASEAN Football Federation', country: 'Regional', region: 'SEA', event_type: 'tournament', tier: 'international', start_date: '2026-07-24', end_date: '2026-08-26', venue: 'Multiple venues across ASEAN', notes: '30th Anniversary edition. Draw: Jan 15, 2026 Jakarta.' },
    { sport: SPORTS.FOOTBALL, event_name: 'Asian Games 2026', organization: 'OCA', country: 'Japan', region: 'Other', event_type: 'multi-sport', tier: 'international', start_date: '2026-09-19', end_date: '2026-10-04', venue: 'Aichi-Nagoya', notes: '41 sports, 53 venues. Football, basketball, handball, volleyball included.' },

    // 2027 Events
    { sport: SPORTS.FOOTBALL, event_name: 'AFC Asian Cup 2027', organization: 'AFC', country: 'Saudi Arabia', region: 'GCC', event_type: 'tournament', tier: 'international', start_date: '2027-01-01', end_date: '2027-02-01', venue: 'Multiple venues Saudi Arabia', notes: 'First time Saudi hosts. 24 teams. Major opportunity.' },
    { sport: SPORTS.BASKETBALL, event_name: 'FIBA Asia Cup 2027', organization: 'FIBA', country: 'Qatar', region: 'GCC', event_type: 'tournament', tier: 'international', start_date: '2027-08-01', end_date: '2027-08-15', venue: 'Doha', notes: 'Top Asian basketball championship' },
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
        event_name: event.eventName || event.event_name,
        organization: event.organization,
        country: event.country,
        region: event.region,
        start_date: event.startDate || event.start_date || null,
        end_date: event.endDate || event.end_date || null,
        venue: event.venue,
        event_type: event.eventType || event.event_type,
        tier: event.tier,
        broadcast_status: event.broadcastStatus || event.broadcast_status,
        estimated_value: event.estimatedValue || event.estimated_value || null,
        currency: event.currency || 'USD',
        source_url: event.sourceUrl || event.source_url,
        notes: event.notes,
        contacts: event.contacts || [],
        converted_to_opportunity_id: event.convertedToOpportunityId || null,
        research_status: event.researchStatus || event.research_status || 'new',
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
                    .order('start_date', { ascending: true });

                if (error) throw error;

                if (data && data.length > 0) {
                    set({ events: data.map(fromDbFormat), loading: false });
                } else {
                    // Seed with key events if table is empty
                    await get().seedKeyEvents();
                }
            } catch (e) {
                console.error('Failed to load sports events:', e);
                set({ loading: false, error: e.message });
            }
        },

        // Seed the database with key upcoming events
        seedKeyEvents: async () => {
            if (!isSupabaseConfigured()) return;

            try {
                const eventsToInsert = KEY_EVENTS.map(e => toDbFormat(e));

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

        // Update event
        updateEvent: async (eventId, updates) => {
            if (!isSupabaseConfigured()) return;

            try {
                const { error } = await supabase
                    .from('sports_events')
                    .update({ ...toDbFormat(updates), updated_at: new Date().toISOString() })
                    .eq('id', eventId);

                if (error) throw error;

                set((state) => ({
                    events: state.events.map(e =>
                        e.id === eventId ? { ...e, ...updates } : e
                    ),
                }));
            } catch (e) {
                console.error('Failed to update event:', e);
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

        // Get events filtered by date range (future only, 1-2 years out)
        getUpcomingEvents: () => {
            const events = get().events;
            const now = new Date();
            const twoYearsOut = new Date();
            twoYearsOut.setFullYear(twoYearsOut.getFullYear() + 2);

            return events.filter(e => {
                if (!e.startDate) return true; // Include events without dates
                const eventDate = new Date(e.startDate);
                return eventDate >= now && eventDate <= twoYearsOut;
            }).sort((a, b) => {
                if (!a.startDate) return 1;
                if (!b.startDate) return -1;
                return new Date(a.startDate) - new Date(b.startDate);
            });
        },

        // Get events grouped by country
        getEventsByCountry: () => {
            const events = get().getUpcomingEvents();
            const grouped = {};
            events.forEach(e => {
                const country = e.country || 'Unknown';
                if (!grouped[country]) grouped[country] = [];
                grouped[country].push(e);
            });
            return grouped;
        },

        // Get events grouped by sport
        getEventsBySport: () => {
            const events = get().getUpcomingEvents();
            const grouped = {};
            events.forEach(e => {
                const sport = e.sport || 'Unknown';
                if (!grouped[sport]) grouped[sport] = [];
                grouped[sport].push(e);
            });
            return grouped;
        },

        // Get events grouped by region
        getEventsByRegion: () => {
            const events = get().getUpcomingEvents();
            const grouped = {};
            events.forEach(e => {
                const region = e.region || 'Other';
                if (!grouped[region]) grouped[region] = [];
                grouped[region].push(e);
            });
            return grouped;
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
            const upcoming = get().getUpcomingEvents();
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
                upcoming: upcoming.length,
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
