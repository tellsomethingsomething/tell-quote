import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

// Knowledge fragment types
export const FRAGMENT_TYPES = {
    MARKET_INSIGHT: 'market_insight',
    PRICING_STRATEGY: 'pricing_strategy',
    CLIENT_PREFERENCE: 'client_preference',
    COMPETITOR_INTEL: 'competitor_intel',
    PROCESS_TIP: 'process_tip',
    REGIONAL_PATTERN: 'regional_pattern',
};

// Agent names
export const AGENTS = {
    RESEARCH: 'research',
    STRATEGY: 'strategy',
    LEADGEN: 'leadgen',
    FINANCE: 'finance',
};

// Convert DB format to local format
function fromDbFormat(record) {
    return {
        id: record.id,
        type: record.fragment_type,
        title: record.title,
        content: record.content,
        source: record.source,
        confidence: record.confidence,
        appliedToAgents: record.applied_to_agents || [],
        verified: record.verified,
        needsReview: record.needs_review,
        createdAt: record.created_at,
        updatedAt: record.updated_at,
        lastUsedAt: record.last_used_at,
        tags: record.tags || [],
        impactScore: record.impact_score,
        usageCount: record.usage_count,
        region: record.region,
        dealType: record.deal_type,
        expiresAt: record.expires_at,
        isPublic: record.is_public || false,
        organizationId: record.organization_id,
    };
}

// Convert local format to DB format
function toDbFormat(fragment) {
    return {
        fragment_type: fragment.type,
        title: fragment.title,
        content: fragment.content,
        source: fragment.source || 'human_input',
        confidence: fragment.confidence || 0.5,
        applied_to_agents: fragment.appliedToAgents || [],
        verified: fragment.verified || false,
        needs_review: fragment.needsReview || false,
        tags: fragment.tags || [],
        impact_score: fragment.impactScore || 0,
        usage_count: fragment.usageCount || 0,
        region: fragment.region || null,
        deal_type: fragment.dealType || null,
        expires_at: fragment.expiresAt || null,
        is_public: fragment.isPublic || false,
    };
}

// Convert learning from DB format
function learningFromDbFormat(record) {
    return {
        id: record.id,
        agentName: record.agent_name,
        learningType: record.learning_type,
        context: record.context,
        outcome: record.outcome,
        lesson: record.lesson,
        confidenceScore: record.confidence_score,
        usageCount: record.usage_count,
        impactScore: record.impact_score,
        createdAt: record.created_at,
        verified: record.verified,
        quoteId: record.quote_id,
        opportunityId: record.opportunity_id,
    };
}

export const useKnowledgeStore = create(
    subscribeWithSelector((set, get) => ({
        // State
        fragments: [],
        learnings: [],
        agentPrompts: {},
        loading: false,
        error: null,

        // Initialize - load from Supabase
        initialize: async () => {
            if (!isSupabaseConfigured()) {
                set({ loading: false, error: 'Supabase not configured' });
                return;
            }

            set({ loading: true, error: null });

            try {
                // Load knowledge fragments
                const { data: fragmentsData, error: fragmentsError } = await supabase
                    .from('knowledge_fragments')
                    .select('*')
                    .order('created_at', { ascending: false });

                if (fragmentsError) {
                    console.warn('Knowledge fragments table may not exist yet:', fragmentsError.message);
                }

                // Load agent learnings
                const { data: learningsData, error: learningsError } = await supabase
                    .from('agent_learnings')
                    .select('*')
                    .order('created_at', { ascending: false });

                if (learningsError) {
                    console.warn('Agent learnings table may not exist yet:', learningsError.message);
                }

                // Load active agent prompts
                const { data: promptsData, error: promptsError } = await supabase
                    .from('agent_prompts')
                    .select('*')
                    .eq('active', true);

                if (promptsError) {
                    console.warn('Agent prompts table may not exist yet:', promptsError.message);
                }

                const fragments = (fragmentsData || []).map(fromDbFormat);
                const learnings = (learningsData || []).map(learningFromDbFormat);

                // Convert prompts to map by agent name
                const agentPrompts = {};
                (promptsData || []).forEach(p => {
                    agentPrompts[p.agent_name] = {
                        version: p.prompt_version,
                        basePrompt: p.base_prompt,
                        learnedContext: p.learned_context,
                        performanceScore: p.performance_score,
                    };
                });

                set({
                    fragments,
                    learnings,
                    agentPrompts,
                    loading: false,
                    error: null
                });

            } catch (e) {
                console.error('Failed to load knowledge:', e);
                set({ loading: false, error: e.message });
            }
        },

        // Add a new knowledge fragment
        addFragment: async (fragmentData) => {
            if (!isSupabaseConfigured()) {
                set({ error: 'Supabase not configured' });
                return null;
            }

            try {
                const newFragment = {
                    type: fragmentData.type,
                    title: fragmentData.title || '',
                    content: fragmentData.content,
                    source: fragmentData.source || 'human_input',
                    confidence: fragmentData.confidence || 0.7,
                    appliedToAgents: fragmentData.appliedToAgents || Object.values(AGENTS),
                    verified: fragmentData.verified || false,
                    needsReview: false,
                    tags: fragmentData.tags || [],
                    region: fragmentData.region || null,
                    dealType: fragmentData.dealType || null,
                };

                const { data, error } = await supabase
                    .from('knowledge_fragments')
                    .insert(toDbFormat(newFragment))
                    .select()
                    .single();

                if (error) throw error;

                const fragment = fromDbFormat(data);
                set((state) => ({
                    fragments: [fragment, ...state.fragments],
                    error: null,
                }));

                return fragment;

            } catch (e) {
                console.error('Failed to add knowledge fragment:', e);
                set({ error: e.message });
                return null;
            }
        },

        // Update a knowledge fragment
        updateFragment: async (fragmentId, updates) => {
            if (!isSupabaseConfigured()) {
                set({ error: 'Supabase not configured' });
                return;
            }

            try {
                const dbUpdates = {};
                if (updates.type !== undefined) dbUpdates.fragment_type = updates.type;
                if (updates.title !== undefined) dbUpdates.title = updates.title;
                if (updates.content !== undefined) dbUpdates.content = updates.content;
                if (updates.confidence !== undefined) dbUpdates.confidence = updates.confidence;
                if (updates.verified !== undefined) dbUpdates.verified = updates.verified;
                if (updates.needsReview !== undefined) dbUpdates.needs_review = updates.needsReview;
                if (updates.tags !== undefined) dbUpdates.tags = updates.tags;
                if (updates.appliedToAgents !== undefined) dbUpdates.applied_to_agents = updates.appliedToAgents;
                if (updates.region !== undefined) dbUpdates.region = updates.region;
                if (updates.dealType !== undefined) dbUpdates.deal_type = updates.dealType;

                dbUpdates.updated_at = new Date().toISOString();

                const { error } = await supabase
                    .from('knowledge_fragments')
                    .update(dbUpdates)
                    .eq('id', fragmentId);

                if (error) throw error;

                set((state) => ({
                    fragments: state.fragments.map(f =>
                        f.id === fragmentId ? { ...f, ...updates, updatedAt: dbUpdates.updated_at } : f
                    ),
                    error: null,
                }));

            } catch (e) {
                console.error('Failed to update knowledge fragment:', e);
                set({ error: e.message });
            }
        },

        // Verify a knowledge fragment (human approval)
        verifyFragment: async (fragmentId) => {
            await get().updateFragment(fragmentId, { verified: true, needsReview: false });
        },

        // Reject a knowledge fragment
        rejectFragment: async (fragmentId) => {
            if (!isSupabaseConfigured()) return;

            try {
                const { error } = await supabase
                    .from('knowledge_fragments')
                    .delete()
                    .eq('id', fragmentId);

                if (error) throw error;

                set((state) => ({
                    fragments: state.fragments.filter(f => f.id !== fragmentId),
                    error: null,
                }));

            } catch (e) {
                console.error('Failed to delete knowledge fragment:', e);
                set({ error: e.message });
            }
        },

        // Delete a knowledge fragment
        deleteFragment: async (fragmentId) => {
            await get().rejectFragment(fragmentId);
        },

        // Add agent learning (from deal outcome)
        addLearning: async (learningData) => {
            if (!isSupabaseConfigured()) {
                set({ error: 'Supabase not configured' });
                return null;
            }

            try {
                const { data, error } = await supabase
                    .from('agent_learnings')
                    .insert({
                        agent_name: learningData.agentName,
                        learning_type: learningData.learningType,
                        context: learningData.context,
                        outcome: learningData.outcome,
                        lesson: learningData.lesson,
                        confidence_score: learningData.confidenceScore || 0.5,
                        verified: false,
                        quote_id: learningData.quoteId || null,
                        opportunity_id: learningData.opportunityId || null,
                    })
                    .select()
                    .single();

                if (error) throw error;

                const learning = learningFromDbFormat(data);
                set((state) => ({
                    learnings: [learning, ...state.learnings],
                    error: null,
                }));

                return learning;

            } catch (e) {
                console.error('Failed to add learning:', e);
                set({ error: e.message });
                return null;
            }
        },

        // Verify an agent learning
        verifyLearning: async (learningId) => {
            if (!isSupabaseConfigured()) return;

            try {
                const { error } = await supabase
                    .from('agent_learnings')
                    .update({ verified: true })
                    .eq('id', learningId);

                if (error) throw error;

                set((state) => ({
                    learnings: state.learnings.map(l =>
                        l.id === learningId ? { ...l, verified: true } : l
                    ),
                    error: null,
                }));

            } catch (e) {
                console.error('Failed to verify learning:', e);
                set({ error: e.message });
            }
        },

        // Get knowledge for a specific context (used when building agent prompts)
        getRelevantKnowledge: (context = {}) => {
            const { fragments } = get();
            const { region, dealType, tags = [], agentName } = context;

            return fragments
                .filter(f => {
                    // Must be verified
                    if (!f.verified) return false;

                    // Check if agent is in applied list
                    if (agentName && f.appliedToAgents.length > 0 && !f.appliedToAgents.includes(agentName)) {
                        return false;
                    }

                    // Check region match
                    if (region && f.region && f.region !== region) return false;

                    // Check deal type match
                    if (dealType && f.dealType && f.dealType !== dealType) return false;

                    // Check tag overlap
                    if (tags.length > 0 && f.tags.length > 0) {
                        const hasOverlap = tags.some(t => f.tags.includes(t));
                        if (!hasOverlap) return false;
                    }

                    return true;
                })
                .sort((a, b) => {
                    // Sort by impact score, then confidence
                    if (b.impactScore !== a.impactScore) return b.impactScore - a.impactScore;
                    return b.confidence - a.confidence;
                })
                .slice(0, 20); // Return top 20 relevant fragments
        },

        // Get learnings for a specific context
        getRelevantLearnings: (context = {}) => {
            const { learnings } = get();
            const { region, dealType, agentName } = context;

            return learnings
                .filter(l => {
                    // Must be verified and have reasonable confidence
                    if (!l.verified || l.confidenceScore < 0.5) return false;

                    // Check agent match
                    if (agentName && l.agentName !== agentName) return false;

                    // Check context match (loose matching)
                    if (l.context) {
                        if (region && l.context.country && l.context.country !== region && l.context.region !== region) {
                            return false;
                        }
                        if (dealType && l.context.deal_type && l.context.deal_type !== dealType) {
                            return false;
                        }
                    }

                    return true;
                })
                .sort((a, b) => b.confidenceScore - a.confidenceScore)
                .slice(0, 10);
        },

        // Get unverified items that need human review
        getPendingReview: () => {
            const { fragments, learnings } = get();

            const pendingFragments = fragments.filter(f => !f.verified || f.needsReview);
            const pendingLearnings = learnings.filter(l => !l.verified);

            return {
                fragments: pendingFragments,
                learnings: pendingLearnings,
                totalCount: pendingFragments.length + pendingLearnings.length,
            };
        },

        // Get stats for knowledge base
        getStats: () => {
            const { fragments, learnings } = get();

            const verifiedFragments = fragments.filter(f => f.verified);
            const byType = {};
            const byRegion = {};

            fragments.forEach(f => {
                byType[f.type] = (byType[f.type] || 0) + 1;
                if (f.region) {
                    byRegion[f.region] = (byRegion[f.region] || 0) + 1;
                }
            });

            return {
                totalFragments: fragments.length,
                verifiedFragments: verifiedFragments.length,
                pendingVerification: fragments.length - verifiedFragments.length,
                totalLearnings: learnings.length,
                verifiedLearnings: learnings.filter(l => l.verified).length,
                byType,
                byRegion,
                avgConfidence: verifiedFragments.length > 0
                    ? verifiedFragments.reduce((sum, f) => sum + f.confidence, 0) / verifiedFragments.length
                    : 0,
            };
        },

        // Build dynamic prompt for an agent
        buildAgentPrompt: async (agentName, taskContext = {}) => {
            const { agentPrompts } = get();
            const basePrompt = agentPrompts[agentName]?.basePrompt || '';

            const relevantKnowledge = get().getRelevantKnowledge({
                ...taskContext,
                agentName,
            });

            const relevantLearnings = get().getRelevantLearnings({
                ...taskContext,
                agentName,
            });

            // Assemble dynamic prompt
            let prompt = basePrompt;

            if (relevantKnowledge.length > 0) {
                prompt += '\n\nACCUMULATED KNOWLEDGE (verified by human):\n';
                prompt += relevantKnowledge.map(k =>
                    `- ${k.content} [confidence: ${(k.confidence * 100).toFixed(0)}%]`
                ).join('\n');
            }

            if (relevantLearnings.length > 0) {
                prompt += '\n\nLEARNINGS FROM PAST DEALS:\n';
                prompt += relevantLearnings.map(l =>
                    `- ${l.lesson} [from: ${l.learningType}, confidence: ${(l.confidenceScore * 100).toFixed(0)}%]`
                ).join('\n');
            }

            if (taskContext.currentTask) {
                prompt += `\n\nCURRENT TASK:\n${taskContext.currentTask}`;
            }

            return prompt;
        },

        // Clear error
        clearError: () => {
            set({ error: null });
        },
    }))
);
