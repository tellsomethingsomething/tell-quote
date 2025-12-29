import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

// Event types for the timeline
export const EVENT_TYPES = {
    RESEARCH_FINDING: 'research_finding',
    MARKET_INTEL: 'market_intel',
    COMPETITOR_UPDATE: 'competitor_update',
    OPPORTUNITY_CREATED: 'opportunity_created',
    OPPORTUNITY_WON: 'opportunity_won',
    OPPORTUNITY_LOST: 'opportunity_lost',
    QUOTE_SENT: 'quote_sent',
    QUOTE_WON: 'quote_won',
    QUOTE_LOST: 'quote_lost',
    KNOWLEDGE_ADDED: 'knowledge_added',
    LEARNING_CAPTURED: 'learning_captured',
    CLIENT_INTERACTION: 'client_interaction',
    AGENT_TASK: 'agent_task',
};

// Event type configurations for display
export const EVENT_CONFIGS = {
    [EVENT_TYPES.RESEARCH_FINDING]: {
        label: 'Research Finding',
        icon: 'search',
        color: 'text-blue-400',
        bgColor: 'bg-blue-500/10',
        borderColor: 'border-blue-500/30',
    },
    [EVENT_TYPES.MARKET_INTEL]: {
        label: 'Market Intelligence',
        icon: 'trending-up',
        color: 'text-cyan-400',
        bgColor: 'bg-cyan-500/10',
        borderColor: 'border-cyan-500/30',
    },
    [EVENT_TYPES.COMPETITOR_UPDATE]: {
        label: 'Competitor Update',
        icon: 'users',
        color: 'text-orange-400',
        bgColor: 'bg-orange-500/10',
        borderColor: 'border-orange-500/30',
    },
    [EVENT_TYPES.OPPORTUNITY_CREATED]: {
        label: 'New Opportunity',
        icon: 'lightbulb',
        color: 'text-violet-400',
        bgColor: 'bg-violet-500/10',
        borderColor: 'border-violet-500/30',
    },
    [EVENT_TYPES.OPPORTUNITY_WON]: {
        label: 'Opportunity Won',
        icon: 'trophy',
        color: 'text-green-400',
        bgColor: 'bg-green-500/10',
        borderColor: 'border-green-500/30',
    },
    [EVENT_TYPES.OPPORTUNITY_LOST]: {
        label: 'Opportunity Lost',
        icon: 'x-circle',
        color: 'text-red-400',
        bgColor: 'bg-red-500/10',
        borderColor: 'border-red-500/30',
    },
    [EVENT_TYPES.QUOTE_SENT]: {
        label: 'Quote Sent',
        icon: 'send',
        color: 'text-purple-400',
        bgColor: 'bg-purple-500/10',
        borderColor: 'border-purple-500/30',
    },
    [EVENT_TYPES.QUOTE_WON]: {
        label: 'Quote Won',
        icon: 'check-circle',
        color: 'text-emerald-400',
        bgColor: 'bg-emerald-500/10',
        borderColor: 'border-emerald-500/30',
    },
    [EVENT_TYPES.QUOTE_LOST]: {
        label: 'Quote Lost',
        icon: 'x-circle',
        color: 'text-red-400',
        bgColor: 'bg-red-500/10',
        borderColor: 'border-red-500/30',
    },
    [EVENT_TYPES.KNOWLEDGE_ADDED]: {
        label: 'Knowledge Added',
        icon: 'book-open',
        color: 'text-purple-400',
        bgColor: 'bg-purple-500/10',
        borderColor: 'border-purple-500/30',
    },
    [EVENT_TYPES.LEARNING_CAPTURED]: {
        label: 'Learning Captured',
        icon: 'brain',
        color: 'text-pink-400',
        bgColor: 'bg-pink-500/10',
        borderColor: 'border-pink-500/30',
    },
    [EVENT_TYPES.CLIENT_INTERACTION]: {
        label: 'Client Interaction',
        icon: 'message-circle',
        color: 'text-indigo-400',
        bgColor: 'bg-indigo-500/10',
        borderColor: 'border-indigo-500/30',
    },
    [EVENT_TYPES.AGENT_TASK]: {
        label: 'Agent Task',
        icon: 'cpu',
        color: 'text-amber-400',
        bgColor: 'bg-amber-500/10',
        borderColor: 'border-amber-500/30',
    },
};

// Convert agent_memory to timeline event
function memoryToEvent(memory) {
    let eventType = EVENT_TYPES.RESEARCH_FINDING;
    if (memory.memory_type === 'market_intelligence') {
        eventType = EVENT_TYPES.MARKET_INTEL;
    } else if (memory.memory_type === 'competitor_intel') {
        eventType = EVENT_TYPES.COMPETITOR_UPDATE;
    }

    return {
        id: `memory-${memory.id}`,
        type: eventType,
        title: memory.content?.title || memory.content?.summary || 'Research Finding',
        description: memory.content?.description || memory.content?.details || '',
        timestamp: memory.created_at,
        source: 'researcher',
        agentName: memory.agent_name,
        relevanceScore: memory.relevance_score,
        tags: memory.context_tags || [],
        sourceUrls: memory.source_urls || [],
        relatedOpportunityId: memory.related_opportunity_id,
        relatedClientId: memory.related_client_id,
        relatedQuoteId: memory.related_quote_id,
        metadata: memory.content,
    };
}

// Convert agent_task to timeline event
function taskToEvent(task) {
    return {
        id: `task-${task.id}`,
        type: EVENT_TYPES.AGENT_TASK,
        title: `${task.task_type.replace(/_/g, ' ')} - ${task.status}`,
        description: task.output_data?.summary || task.input_data?.description || '',
        timestamp: task.completed_at || task.started_at || task.created_at,
        source: 'agent',
        agentName: task.agent_name,
        status: task.status,
        relatedOpportunityId: task.related_opportunity_id,
        relatedClientId: task.related_client_id,
        relatedQuoteId: task.related_quote_id,
        metadata: {
            input: task.input_data,
            output: task.output_data,
            error: task.error_message,
        },
    };
}

// Convert knowledge fragment to timeline event
function fragmentToEvent(fragment) {
    return {
        id: `knowledge-${fragment.id}`,
        type: EVENT_TYPES.KNOWLEDGE_ADDED,
        title: fragment.title || 'Knowledge Fragment',
        description: fragment.content,
        timestamp: fragment.created_at,
        source: fragment.source,
        confidence: fragment.confidence,
        verified: fragment.verified,
        tags: fragment.tags || [],
        region: fragment.region,
        dealType: fragment.deal_type,
        fragmentType: fragment.fragment_type,
        metadata: fragment,
    };
}

// Convert learning to timeline event
function learningToEvent(learning) {
    return {
        id: `learning-${learning.id}`,
        type: EVENT_TYPES.LEARNING_CAPTURED,
        title: learning.lesson,
        description: learning.context ? JSON.stringify(learning.context) : '',
        timestamp: learning.created_at,
        source: 'deal_outcome',
        agentName: learning.agent_name,
        confidence: learning.confidence_score,
        verified: learning.verified,
        learningType: learning.learning_type,
        relatedQuoteId: learning.quote_id,
        relatedOpportunityId: learning.opportunity_id,
        metadata: {
            context: learning.context,
            outcome: learning.outcome,
        },
    };
}

export const useTimelineStore = create(
    subscribeWithSelector((set, get) => ({
        // State
        events: [],
        loading: false,
        error: null,
        filters: {
            types: [], // Empty means all types
            dateRange: null, // { start, end }
            agent: null,
            region: null,
            searchQuery: '',
        },

        // Initialize - load events from all sources
        initialize: async () => {
            if (!isSupabaseConfigured()) {
                set({ loading: false, error: 'Supabase not configured' });
                return;
            }

            set({ loading: true, error: null });

            try {
                const events = [];

                // Load agent memories (research findings)
                const { data: memories, error: memoriesError } = await supabase
                    .from('agent_memory')
                    .select('*')
                    .order('created_at', { ascending: false })
                    .limit(100);

                if (!memoriesError && memories) {
                    events.push(...memories.map(memoryToEvent));
                }

                // Load completed agent tasks
                const { data: tasks, error: tasksError } = await supabase
                    .from('agent_tasks')
                    .select('*')
                    .in('status', ['completed', 'failed'])
                    .order('completed_at', { ascending: false })
                    .limit(50);

                if (!tasksError && tasks) {
                    events.push(...tasks.map(taskToEvent));
                }

                // Load knowledge fragments
                const { data: fragments, error: fragmentsError } = await supabase
                    .from('knowledge_fragments')
                    .select('*')
                    .order('created_at', { ascending: false })
                    .limit(50);

                if (!fragmentsError && fragments) {
                    events.push(...fragments.map(fragmentToEvent));
                }

                // Load agent learnings
                const { data: learnings, error: learningsError } = await supabase
                    .from('agent_learnings')
                    .select('*')
                    .order('created_at', { ascending: false })
                    .limit(50);

                if (!learningsError && learnings) {
                    events.push(...learnings.map(learningToEvent));
                }

                // Sort all events by timestamp (most recent first)
                events.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

                set({ events, loading: false, error: null });
            } catch (e) {
                console.error('Failed to load timeline events:', e);
                set({ loading: false, error: e.message });
            }
        },

        // Add a research finding manually
        addResearchFinding: async (finding) => {
            if (!isSupabaseConfigured()) return null;

            try {
                const memoryData = {
                    agent_name: 'research',
                    memory_type: finding.type || 'research_findings',
                    content: {
                        title: finding.title,
                        description: finding.description,
                        summary: finding.summary,
                        organization: finding.organization,
                        country: finding.country,
                        region: finding.region,
                        opportunityType: finding.opportunityType,
                        urgency: finding.urgency,
                        budgetRange: finding.budgetRange,
                        contacts: finding.contacts,
                        recommendedAction: finding.recommendedAction,
                    },
                    context_tags: finding.tags || [],
                    relevance_score: finding.urgency ? finding.urgency / 10 : 0.5,
                    source_urls: finding.sourceUrls || [],
                    related_opportunity_id: finding.opportunityId || null,
                    related_client_id: finding.clientId || null,
                    expires_at: finding.expiresAt || null,
                };

                const { data, error } = await supabase
                    .from('agent_memory')
                    .insert(memoryData)
                    .select()
                    .single();

                if (error) throw error;

                const newEvent = memoryToEvent(data);
                set((state) => ({
                    events: [newEvent, ...state.events],
                }));

                return newEvent;
            } catch (e) {
                console.error('Failed to add research finding:', e);
                set({ error: e.message });
                return null;
            }
        },

        // Get filtered events
        getFilteredEvents: () => {
            const { events, filters } = get();
            let filtered = [...events];

            // Filter by types
            if (filters.types && filters.types.length > 0) {
                filtered = filtered.filter(e => filters.types.includes(e.type));
            }

            // Filter by date range
            if (filters.dateRange) {
                const { start, end } = filters.dateRange;
                filtered = filtered.filter(e => {
                    const eventDate = new Date(e.timestamp);
                    if (start && eventDate < new Date(start)) return false;
                    if (end && eventDate > new Date(end)) return false;
                    return true;
                });
            }

            // Filter by agent
            if (filters.agent) {
                filtered = filtered.filter(e => e.agentName === filters.agent);
            }

            // Filter by region
            if (filters.region) {
                filtered = filtered.filter(e =>
                    e.region === filters.region ||
                    e.tags?.includes(filters.region.toLowerCase())
                );
            }

            // Filter by search query
            if (filters.searchQuery) {
                const query = filters.searchQuery.toLowerCase();
                filtered = filtered.filter(e =>
                    e.title?.toLowerCase().includes(query) ||
                    e.description?.toLowerCase().includes(query) ||
                    e.tags?.some(t => t.toLowerCase().includes(query))
                );
            }

            return filtered;
        },

        // Get events grouped by date
        getEventsByDate: () => {
            const filtered = get().getFilteredEvents();
            const grouped = {};

            filtered.forEach(event => {
                const date = new Date(event.timestamp).toISOString().split('T')[0];
                if (!grouped[date]) {
                    grouped[date] = [];
                }
                grouped[date].push(event);
            });

            return grouped;
        },

        // Get recent events (last N days)
        getRecentEvents: (days = 7) => {
            const { events } = get();
            const cutoff = new Date();
            cutoff.setDate(cutoff.getDate() - days);

            return events.filter(e => new Date(e.timestamp) >= cutoff);
        },

        // Get events by type
        getEventsByType: (type) => {
            const { events } = get();
            return events.filter(e => e.type === type);
        },

        // Get research findings specifically
        getResearchFindings: () => {
            const { events } = get();
            return events.filter(e =>
                e.type === EVENT_TYPES.RESEARCH_FINDING ||
                e.type === EVENT_TYPES.MARKET_INTEL ||
                e.type === EVENT_TYPES.COMPETITOR_UPDATE
            );
        },

        // Get timeline stats
        getStats: () => {
            const { events } = get();
            const now = new Date();
            const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

            const thisWeek = events.filter(e => new Date(e.timestamp) >= weekAgo);
            const thisMonth = events.filter(e => new Date(e.timestamp) >= monthAgo);

            // Count by type
            const byType = {};
            events.forEach(e => {
                byType[e.type] = (byType[e.type] || 0) + 1;
            });

            // Count by agent
            const byAgent = {};
            events.forEach(e => {
                if (e.agentName) {
                    byAgent[e.agentName] = (byAgent[e.agentName] || 0) + 1;
                }
            });

            return {
                total: events.length,
                thisWeek: thisWeek.length,
                thisMonth: thisMonth.length,
                byType,
                byAgent,
            };
        },

        // Set filters
        setFilters: (newFilters) => {
            set((state) => ({
                filters: { ...state.filters, ...newFilters },
            }));
        },

        // Clear filters
        clearFilters: () => {
            set({
                filters: {
                    types: [],
                    dateRange: null,
                    agent: null,
                    region: null,
                    searchQuery: '',
                },
            });
        },

        // Clear error
        clearError: () => {
            set({ error: null });
        },

        // Convert a research event to an opportunity
        // Returns the created opportunity data to be used by opportunityStore.addOpportunity
        prepareOpportunityFromEvent: (event) => {
            const metadata = event.metadata || {};

            // Build opportunity data from research event
            const opportunityData = {
                title: metadata.title || event.title || 'New Opportunity',
                country: metadata.country || '',
                region: metadata.region || '',
                source: `Research: ${event.title}`,
                brief: metadata.description || event.description || '',
                notes: `Converted from research finding on ${new Date(event.timestamp).toLocaleDateString('en-GB')}.\n\n${metadata.summary || ''}\n\nRecommended Action: ${metadata.recommendedAction || 'Follow up'}`,
                value: metadata.budgetRange?.min || metadata.estimatedValue || 0,
                currency: metadata.currency || 'USD',
                probability: metadata.urgency ? Math.min(metadata.urgency * 10, 90) : 30,
                status: 'active',
                nextAction: metadata.recommendedAction || 'Initial contact',
                nextActionDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 1 week from now
                competitors: metadata.competitors || [],
                contacts: metadata.contacts || [],
                // Link back to the research event
                researchEventId: event.id,
            };

            // Add client info if available
            if (metadata.organization) {
                opportunityData.client = {
                    company: metadata.organization,
                    contact: metadata.contactName || '',
                    email: metadata.contactEmail || '',
                };
            }

            return opportunityData;
        },

        // Mark an event as converted to opportunity
        markEventAsConverted: async (eventId, opportunityId) => {
            // Update the original memory record if it exists
            if (eventId.startsWith('memory-')) {
                const memoryId = eventId.replace('memory-', '');
                try {
                    await supabase
                        .from('agent_memory')
                        .update({ related_opportunity_id: opportunityId })
                        .eq('id', memoryId);
                } catch (e) {
                    console.error('Failed to update memory with opportunity ID:', e);
                }
            }

            // Update local state to reflect the conversion
            set((state) => ({
                events: state.events.map(e =>
                    e.id === eventId
                        ? { ...e, relatedOpportunityId: opportunityId, convertedToOpportunity: true }
                        : e
                ),
            }));
        },
    }))
);
