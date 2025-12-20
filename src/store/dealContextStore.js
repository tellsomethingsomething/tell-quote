import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

const DEAL_CONTEXT_KEY = 'tell_deal_context';
const TASK_PATTERNS_KEY = 'tell_task_patterns';

// Task templates organized by deal stage/status and situation
const TASK_TEMPLATES = {
    // New opportunities (just created or no activity)
    new_opportunity: [
        { id: 'research_client', title: 'Research client background', description: 'Review their website, recent news, and social media presence', priority: 'high' },
        { id: 'identify_stakeholders', title: 'Identify key stakeholders', description: 'Find decision makers and influencers in the organization', priority: 'high' },
        { id: 'schedule_discovery', title: 'Schedule discovery call', description: 'Book initial meeting to understand requirements', priority: 'high' },
    ],
    // After initial contact
    discovery: [
        { id: 'send_intro_email', title: 'Send introduction email', description: 'Brief company intro with relevant case studies', priority: 'high' },
        { id: 'prepare_questions', title: 'Prepare discovery questions', description: 'List questions about budget, timeline, requirements', priority: 'medium' },
        { id: 'check_competitors', title: 'Research competitors bidding', description: 'Identify who else might be pitching', priority: 'medium' },
    ],
    // Proposal stage
    proposal: [
        { id: 'draft_proposal', title: 'Draft initial proposal', description: 'Create proposal based on client requirements', priority: 'high' },
        { id: 'review_pricing', title: 'Review pricing strategy', description: 'Ensure competitive pricing with healthy margins', priority: 'high' },
        { id: 'internal_review', title: 'Get internal review', description: 'Have team review proposal before sending', priority: 'medium' },
    ],
    // Quote sent, awaiting response
    follow_up: [
        { id: 'follow_up_call', title: 'Follow-up call', description: 'Check in on proposal status and address questions', priority: 'high' },
        { id: 'send_reminder', title: 'Send gentle reminder', description: 'Follow up on pending proposal', priority: 'medium' },
        { id: 'add_value', title: 'Share relevant content', description: 'Send case study or article relevant to their needs', priority: 'low' },
    ],
    // Negotiation
    negotiation: [
        { id: 'prepare_alternatives', title: 'Prepare alternative options', description: 'Have backup pricing/scope options ready', priority: 'high' },
        { id: 'clarify_objections', title: 'Address objections', description: 'Document and respond to client concerns', priority: 'high' },
        { id: 'final_meeting', title: 'Schedule decision meeting', description: 'Book meeting to finalize terms', priority: 'medium' },
    ],
    // At risk (overdue actions, stalled deals)
    at_risk: [
        { id: 'executive_outreach', title: 'Executive-level outreach', description: 'Escalate to senior contact if available', priority: 'high' },
        { id: 'requalify', title: 'Re-qualify opportunity', description: 'Confirm deal is still viable and budget available', priority: 'high' },
        { id: 'offer_meeting', title: 'Offer in-person meeting', description: 'Suggest face-to-face to rebuild momentum', priority: 'medium' },
    ],
    // Close to expected close date
    closing: [
        { id: 'confirm_timeline', title: 'Confirm decision timeline', description: 'Verify when client will make final decision', priority: 'high' },
        { id: 'remove_blockers', title: 'Identify remaining blockers', description: 'Ask what is needed to move forward', priority: 'high' },
        { id: 'prep_contract', title: 'Prepare contract/agreement', description: 'Have paperwork ready for quick close', priority: 'medium' },
    ],
};

// Load from localStorage
function loadDealContextLocal() {
    try {
        const saved = localStorage.getItem(DEAL_CONTEXT_KEY);
        return saved ? JSON.parse(saved) : {};
    } catch (e) {
        return {};
    }
}

function saveDealContextLocal(contexts) {
    try {
        localStorage.setItem(DEAL_CONTEXT_KEY, JSON.stringify(contexts));
    } catch (e) {
        console.error('Failed to save deal context locally:', e);
    }
}

function loadTaskPatternsLocal() {
    try {
        const saved = localStorage.getItem(TASK_PATTERNS_KEY);
        return saved ? JSON.parse(saved) : { completedTasks: [], skippedTasks: [], effectiveness: {} };
    } catch (e) {
        return { completedTasks: [], skippedTasks: [], effectiveness: {} };
    }
}

function saveTaskPatternsLocal(patterns) {
    try {
        localStorage.setItem(TASK_PATTERNS_KEY, JSON.stringify(patterns));
    } catch (e) {
        console.error('Failed to save task patterns:', e);
    }
}

export const useDealContextStore = create(
    subscribeWithSelector((set, get) => ({
        // Context per opportunity: { [opportunityId]: { lastSuggestions, milestones, notes, etc } }
        contexts: loadDealContextLocal(),
        // Task patterns for learning
        taskPatterns: loadTaskPatternsLocal(),
        loading: false,

        // Get or create context for an opportunity
        getContext: (opportunityId) => {
            const contexts = get().contexts;
            if (!contexts[opportunityId]) {
                const newContext = {
                    opportunityId,
                    suggestedTasks: [],
                    completedTasks: [],
                    skippedTasks: [],
                    milestones: [],
                    lastInteraction: null,
                    notes: [],
                    createdAt: new Date().toISOString(),
                };
                set({ contexts: { ...contexts, [opportunityId]: newContext } });
                saveDealContextLocal({ ...contexts, [opportunityId]: newContext });
                return newContext;
            }
            return contexts[opportunityId];
        },

        // Update context for an opportunity
        updateContext: (opportunityId, updates) => {
            const contexts = get().contexts;
            const existing = contexts[opportunityId] || { opportunityId, createdAt: new Date().toISOString() };
            const updated = {
                ...existing,
                ...updates,
                updatedAt: new Date().toISOString(),
            };
            const newContexts = { ...contexts, [opportunityId]: updated };
            set({ contexts: newContexts });
            saveDealContextLocal(newContexts);
            // Sync to Supabase
            get().syncContextToSupabase(opportunityId, updated);
        },

        // Add a suggested task to context
        addSuggestedTask: (opportunityId, task) => {
            const context = get().getContext(opportunityId);
            const suggestedTasks = [
                ...context.suggestedTasks,
                {
                    ...task,
                    suggestedAt: new Date().toISOString(),
                    status: 'pending',
                },
            ];
            get().updateContext(opportunityId, { suggestedTasks });
        },

        // Mark a task as completed
        completeTask: (opportunityId, taskId, outcome = 'completed') => {
            const context = get().getContext(opportunityId);
            const task = context.suggestedTasks.find(t => t.id === taskId);

            if (task) {
                // Move to completed
                const suggestedTasks = context.suggestedTasks.filter(t => t.id !== taskId);
                const completedTasks = [
                    ...context.completedTasks,
                    { ...task, completedAt: new Date().toISOString(), outcome },
                ];
                get().updateContext(opportunityId, { suggestedTasks, completedTasks });

                // Track pattern
                get().trackTaskPattern(task.id, 'completed', opportunityId);
            }
        },

        // Skip/dismiss a task
        skipTask: (opportunityId, taskId, reason = '') => {
            const context = get().getContext(opportunityId);
            const task = context.suggestedTasks.find(t => t.id === taskId);

            if (task) {
                const suggestedTasks = context.suggestedTasks.filter(t => t.id !== taskId);
                const skippedTasks = [
                    ...context.skippedTasks,
                    { ...task, skippedAt: new Date().toISOString(), reason },
                ];
                get().updateContext(opportunityId, { suggestedTasks, skippedTasks });

                // Track pattern
                get().trackTaskPattern(task.id, 'skipped', opportunityId);
            }
        },

        // Add milestone (significant event)
        addMilestone: (opportunityId, milestone) => {
            const context = get().getContext(opportunityId);
            const milestones = [
                ...context.milestones,
                {
                    ...milestone,
                    timestamp: new Date().toISOString(),
                },
            ];
            get().updateContext(opportunityId, { milestones, lastInteraction: new Date().toISOString() });
        },

        // Track task patterns for learning
        trackTaskPattern: (taskTemplateId, action, opportunityId) => {
            const patterns = get().taskPatterns;
            const key = `${taskTemplateId}_${action}`;
            const effectiveness = {
                ...patterns.effectiveness,
                [key]: (patterns.effectiveness[key] || 0) + 1,
            };

            const newPatterns = {
                ...patterns,
                effectiveness,
                [action === 'completed' ? 'completedTasks' : 'skippedTasks']: [
                    ...patterns[action === 'completed' ? 'completedTasks' : 'skippedTasks'],
                    { taskTemplateId, opportunityId, timestamp: new Date().toISOString() },
                ].slice(-100), // Keep last 100
            };

            set({ taskPatterns: newPatterns });
            saveTaskPatternsLocal(newPatterns);
            // Sync to Supabase
            get().syncPatternsToSupabase(newPatterns);
        },

        // Get task effectiveness score (higher = more likely to be completed vs skipped)
        getTaskEffectiveness: (taskTemplateId) => {
            const patterns = get().taskPatterns;
            const completed = patterns.effectiveness[`${taskTemplateId}_completed`] || 0;
            const skipped = patterns.effectiveness[`${taskTemplateId}_skipped`] || 0;
            const total = completed + skipped;
            if (total === 0) return 0.5; // Neutral if no data
            return completed / total;
        },

        // Generate smart tasks based on opportunity state
        getSmartTasks: (opportunity, activities = [], quotes = []) => {
            if (!opportunity) return [];

            const context = get().getContext(opportunity.id);
            const now = new Date();
            const tasks = [];

            // Determine deal stage based on various signals
            const determineStage = () => {
                // Won or lost - no tasks
                if (opportunity.status === 'won' || opportunity.status === 'lost') {
                    return null;
                }

                // Check for linked quotes
                const linkedQuotes = quotes.filter(q =>
                    q.opportunityId === opportunity.id ||
                    q.client?.company === opportunity.client?.company
                );
                const hasSentQuote = linkedQuotes.some(q => q.status === 'sent');
                const hasDraftQuote = linkedQuotes.some(q => q.status === 'draft');

                // Calculate days since creation and last activity
                const createdAt = new Date(opportunity.createdAt || opportunity.created_at);
                const daysSinceCreation = Math.floor((now - createdAt) / (1000 * 60 * 60 * 24));

                const lastActivity = activities
                    .filter(a => a.opportunityId === opportunity.id || a.clientId === opportunity.clientId)
                    .sort((a, b) => new Date(b.activityDate) - new Date(a.activityDate))[0];
                const daysSinceActivity = lastActivity
                    ? Math.floor((now - new Date(lastActivity.activityDate)) / (1000 * 60 * 60 * 24))
                    : daysSinceCreation;

                // Check if overdue
                const nextActionDate = opportunity.nextActionDate ? new Date(opportunity.nextActionDate) : null;
                const isOverdue = nextActionDate && nextActionDate < now;

                // Check expected close date proximity
                const expectedClose = opportunity.expectedCloseDate ? new Date(opportunity.expectedCloseDate) : null;
                const daysToClose = expectedClose ? Math.floor((expectedClose - now) / (1000 * 60 * 60 * 24)) : null;

                // Determine stage
                if (isOverdue || daysSinceActivity > 14) {
                    return 'at_risk';
                }
                if (daysToClose !== null && daysToClose <= 7 && daysToClose >= 0) {
                    return 'closing';
                }
                if (hasSentQuote) {
                    return daysSinceActivity > 3 ? 'follow_up' : 'negotiation';
                }
                if (hasDraftQuote) {
                    return 'proposal';
                }
                if (daysSinceCreation <= 3 && !lastActivity) {
                    return 'new_opportunity';
                }
                return 'discovery';
            };

            const stage = determineStage();
            if (!stage) return [];

            // Get template tasks for this stage
            const templateTasks = TASK_TEMPLATES[stage] || [];

            // Filter out recently suggested tasks (last 7 days)
            const recentSuggestionIds = new Set(
                context.suggestedTasks
                    .filter(t => {
                        const suggestedAt = new Date(t.suggestedAt);
                        const daysSince = Math.floor((now - suggestedAt) / (1000 * 60 * 60 * 24));
                        return daysSince < 7;
                    })
                    .map(t => t.id)
            );

            // Filter out completed tasks (last 30 days)
            const recentCompletedIds = new Set(
                context.completedTasks
                    .filter(t => {
                        const completedAt = new Date(t.completedAt);
                        const daysSince = Math.floor((now - completedAt) / (1000 * 60 * 60 * 24));
                        return daysSince < 30;
                    })
                    .map(t => t.id)
            );

            // Score and filter tasks
            const scoredTasks = templateTasks
                .filter(t => !recentSuggestionIds.has(t.id) && !recentCompletedIds.has(t.id))
                .map(task => {
                    const effectiveness = get().getTaskEffectiveness(task.id);
                    const priorityScore = task.priority === 'high' ? 3 : task.priority === 'medium' ? 2 : 1;
                    const score = effectiveness * priorityScore;
                    return { ...task, score, stage };
                })
                .sort((a, b) => b.score - a.score);

            // Return top 3 tasks
            return scoredTasks.slice(0, 3);
        },

        // Clear context for an opportunity
        clearContext: (opportunityId) => {
            const contexts = get().contexts;
            const { [opportunityId]: removed, ...rest } = contexts;
            set({ contexts: rest });
            saveDealContextLocal(rest);
        },

        // Sync context to Supabase
        syncContextToSupabase: async (opportunityId, context) => {
            if (!isSupabaseConfigured()) return;

            try {
                const { error } = await supabase
                    .from('deal_contexts')
                    .upsert({
                        opportunity_id: opportunityId,
                        suggested_tasks: context.suggestedTasks || [],
                        completed_tasks: context.completedTasks || [],
                        skipped_tasks: context.skippedTasks || [],
                        milestones: context.milestones || [],
                        notes: context.notes || [],
                        last_interaction: context.lastInteraction,
                        updated_at: new Date().toISOString(),
                    }, { onConflict: 'opportunity_id' });

                if (error) console.error('Failed to sync deal context:', error);
            } catch (e) {
                console.error('Error syncing deal context:', e);
            }
        },

        // Sync task patterns to Supabase
        syncPatternsToSupabase: async (patterns) => {
            if (!isSupabaseConfigured()) return;

            try {
                // Get the single patterns row
                const { data: existing } = await supabase
                    .from('task_patterns')
                    .select('id')
                    .limit(1)
                    .single();

                if (existing) {
                    await supabase
                        .from('task_patterns')
                        .update({
                            completed_tasks: patterns.completedTasks || [],
                            skipped_tasks: patterns.skippedTasks || [],
                            effectiveness: patterns.effectiveness || {},
                            updated_at: new Date().toISOString(),
                        })
                        .eq('id', existing.id);
                }
            } catch (e) {
                console.error('Error syncing task patterns:', e);
            }
        },

        // Initialize - load from Supabase
        initialize: async () => {
            set({ loading: true });

            if (isSupabaseConfigured()) {
                try {
                    // Load deal contexts
                    const { data: contextsData, error: contextsError } = await supabase
                        .from('deal_contexts')
                        .select('*');

                    if (!contextsError && contextsData) {
                        const contexts = {};
                        contextsData.forEach(row => {
                            contexts[row.opportunity_id] = {
                                opportunityId: row.opportunity_id,
                                suggestedTasks: row.suggested_tasks || [],
                                completedTasks: row.completed_tasks || [],
                                skippedTasks: row.skipped_tasks || [],
                                milestones: row.milestones || [],
                                notes: row.notes || [],
                                lastInteraction: row.last_interaction,
                                createdAt: row.created_at,
                                updatedAt: row.updated_at,
                            };
                        });
                        set({ contexts });
                        saveDealContextLocal(contexts);
                    }

                    // Load task patterns
                    const { data: patternsData, error: patternsError } = await supabase
                        .from('task_patterns')
                        .select('*')
                        .limit(1)
                        .single();

                    if (!patternsError && patternsData) {
                        const taskPatterns = {
                            completedTasks: patternsData.completed_tasks || [],
                            skippedTasks: patternsData.skipped_tasks || [],
                            effectiveness: patternsData.effectiveness || {},
                        };
                        set({ taskPatterns });
                        saveTaskPatternsLocal(taskPatterns);
                    }
                } catch (e) {
                    console.error('Error loading from Supabase:', e);
                }
            }

            set({ loading: false });
        },
    }))
);

// Subscribe to save changes
useDealContextStore.subscribe(
    (state) => state.contexts,
    (contexts) => saveDealContextLocal(contexts)
);
