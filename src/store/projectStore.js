import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

// Project status options
export const PROJECT_STATUSES = {
    draft: { label: 'Draft', color: 'gray' },
    confirmed: { label: 'Confirmed', color: 'blue' },
    in_progress: { label: 'In Progress', color: 'yellow' },
    wrapped: { label: 'Wrapped', color: 'green' },
    closed: { label: 'Closed', color: 'purple' },
    cancelled: { label: 'Cancelled', color: 'red' },
};

// Convert DB project to local format
function fromDbFormat(p) {
    return {
        id: p.id,
        projectCode: p.project_code,
        name: p.name,
        opportunityId: p.opportunity_id,
        quoteId: p.quote_id,
        clientId: p.client_id,
        client: p.client || {},
        description: p.description || '',
        region: p.region || '',
        country: p.country || '',
        startDate: p.start_date,
        endDate: p.end_date,
        status: p.status || 'draft',
        currency: p.currency || 'USD',
        budgetTotal: p.budget_total || 0,
        budgetBreakdown: p.budget_breakdown || {},
        actualsTotal: p.actuals_total || 0,
        actualsBreakdown: p.actuals_breakdown || {},
        projectManagerId: p.project_manager_id,
        projectManagerName: p.project_manager_name || '',
        settings: p.settings || {},
        notes: p.notes || '',
        tags: p.tags || [],
        confirmedAt: p.confirmed_at,
        startedAt: p.started_at,
        wrappedAt: p.wrapped_at,
        closedAt: p.closed_at,
        createdAt: p.created_at,
        updatedAt: p.updated_at,
    };
}

// Convert local project to DB format
function toDbFormat(project) {
    return {
        project_code: project.projectCode,
        name: project.name,
        opportunity_id: project.opportunityId || null,
        quote_id: project.quoteId || null,
        client_id: project.clientId || null,
        client: project.client || {},
        description: project.description || '',
        region: project.region || '',
        country: project.country || '',
        start_date: project.startDate || null,
        end_date: project.endDate || null,
        status: project.status || 'draft',
        currency: project.currency || 'USD',
        budget_total: project.budgetTotal || 0,
        budget_breakdown: project.budgetBreakdown || {},
        actuals_total: project.actualsTotal || 0,
        actuals_breakdown: project.actualsBreakdown || {},
        project_manager_id: project.projectManagerId || null,
        project_manager_name: project.projectManagerName || '',
        settings: project.settings || {},
        notes: project.notes || '',
        tags: project.tags || [],
    };
}

export const useProjectStore = create(
    subscribeWithSelector((set, get) => ({
        projects: [],
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
                // Fetch all projects
                const { data, error } = await supabase
                    .from('projects')
                    .select('*')
                    .order('created_at', { ascending: false });

                if (error) throw error;

                const projects = (data || []).map(fromDbFormat);
                set({ projects, loading: false, error: null });

                // Subscribe to realtime changes
                get().subscribeToRealtime();

            } catch (e) {
                console.error('Failed to load projects:', e);
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
                .channel('projects-realtime')
                .on(
                    'postgres_changes',
                    { event: '*', schema: 'public', table: 'projects' },
                    (payload) => {
                        const { eventType, new: newRecord, old: oldRecord } = payload;

                        set((state) => {
                            let projects = [...state.projects];

                            if (eventType === 'INSERT') {
                                const exists = projects.find(p => p.id === newRecord.id);
                                if (!exists) {
                                    projects = [fromDbFormat(newRecord), ...projects];
                                }
                            } else if (eventType === 'UPDATE') {
                                projects = projects.map(p =>
                                    p.id === newRecord.id ? fromDbFormat(newRecord) : p
                                );
                            } else if (eventType === 'DELETE') {
                                projects = projects.filter(p => p.id !== oldRecord.id);
                            }

                            return { projects };
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

        // Generate next project code
        generateProjectCode: async () => {
            if (!isSupabaseConfigured()) return null;

            try {
                const { data, error } = await supabase.rpc('generate_project_code');
                if (error) throw error;
                return data;
            } catch (e) {
                // Fallback: generate locally
                const yearMonth = new Date().toISOString().slice(0, 7).replace('-', '');
                const projects = get().projects;
                const prefix = `PRJ-${yearMonth}-`;
                const existing = projects.filter(p => p.projectCode?.startsWith(prefix));
                const nextNum = existing.length + 1;
                return `${prefix}${String(nextNum).padStart(3, '0')}`;
            }
        },

        // Add new project
        addProject: async (projectData) => {
            if (!isSupabaseConfigured()) {
                set({ error: 'Supabase not configured' });
                return null;
            }

            try {
                // Generate project code if not provided
                let projectCode = projectData.projectCode;
                if (!projectCode) {
                    projectCode = await get().generateProjectCode();
                }

                const newProject = {
                    projectCode,
                    name: projectData.name || '',
                    opportunityId: projectData.opportunityId || null,
                    quoteId: projectData.quoteId || null,
                    clientId: projectData.clientId || null,
                    client: projectData.client || {},
                    description: projectData.description || '',
                    region: projectData.region || '',
                    country: projectData.country || '',
                    startDate: projectData.startDate || null,
                    endDate: projectData.endDate || null,
                    status: projectData.status || 'draft',
                    currency: projectData.currency || 'USD',
                    budgetTotal: projectData.budgetTotal || 0,
                    budgetBreakdown: projectData.budgetBreakdown || {},
                    projectManagerId: projectData.projectManagerId || null,
                    projectManagerName: projectData.projectManagerName || '',
                    settings: projectData.settings || {},
                    notes: projectData.notes || '',
                    tags: projectData.tags || [],
                };

                const { data, error } = await supabase
                    .from('projects')
                    .insert(toDbFormat(newProject))
                    .select()
                    .single();

                if (error) throw error;

                const project = fromDbFormat(data);
                set((state) => ({
                    projects: [project, ...state.projects.filter(p => p.id !== project.id)],
                    error: null,
                }));

                return project;

            } catch (e) {
                console.error('Failed to add project:', e);
                set({ error: e.message });
                return null;
            }
        },

        // Update project
        updateProject: async (projectId, updates) => {
            if (!isSupabaseConfigured()) {
                set({ error: 'Supabase not configured' });
                return;
            }

            try {
                const dbUpdates = {};

                // Map all possible fields
                if (updates.projectCode !== undefined) dbUpdates.project_code = updates.projectCode;
                if (updates.name !== undefined) dbUpdates.name = updates.name;
                if (updates.opportunityId !== undefined) dbUpdates.opportunity_id = updates.opportunityId;
                if (updates.quoteId !== undefined) dbUpdates.quote_id = updates.quoteId;
                if (updates.clientId !== undefined) dbUpdates.client_id = updates.clientId;
                if (updates.client !== undefined) dbUpdates.client = updates.client;
                if (updates.description !== undefined) dbUpdates.description = updates.description;
                if (updates.region !== undefined) dbUpdates.region = updates.region;
                if (updates.country !== undefined) dbUpdates.country = updates.country;
                if (updates.startDate !== undefined) dbUpdates.start_date = updates.startDate;
                if (updates.endDate !== undefined) dbUpdates.end_date = updates.endDate;
                if (updates.status !== undefined) dbUpdates.status = updates.status;
                if (updates.currency !== undefined) dbUpdates.currency = updates.currency;
                if (updates.budgetTotal !== undefined) dbUpdates.budget_total = updates.budgetTotal;
                if (updates.budgetBreakdown !== undefined) dbUpdates.budget_breakdown = updates.budgetBreakdown;
                if (updates.actualsTotal !== undefined) dbUpdates.actuals_total = updates.actualsTotal;
                if (updates.actualsBreakdown !== undefined) dbUpdates.actuals_breakdown = updates.actualsBreakdown;
                if (updates.projectManagerId !== undefined) dbUpdates.project_manager_id = updates.projectManagerId;
                if (updates.projectManagerName !== undefined) dbUpdates.project_manager_name = updates.projectManagerName;
                if (updates.settings !== undefined) dbUpdates.settings = updates.settings;
                if (updates.notes !== undefined) dbUpdates.notes = updates.notes;
                if (updates.tags !== undefined) dbUpdates.tags = updates.tags;

                // Status timestamp updates
                if (updates.status === 'confirmed' && !updates.confirmedAt) {
                    dbUpdates.confirmed_at = new Date().toISOString();
                }
                if (updates.status === 'in_progress' && !updates.startedAt) {
                    dbUpdates.started_at = new Date().toISOString();
                }
                if (updates.status === 'wrapped' && !updates.wrappedAt) {
                    dbUpdates.wrapped_at = new Date().toISOString();
                }
                if (updates.status === 'closed' && !updates.closedAt) {
                    dbUpdates.closed_at = new Date().toISOString();
                }

                if (Object.keys(dbUpdates).length > 0) {
                    const { error } = await supabase
                        .from('projects')
                        .update(dbUpdates)
                        .eq('id', projectId);

                    if (error) throw error;

                    // Optimistically update local state
                    set((state) => ({
                        projects: state.projects.map(p =>
                            p.id === projectId
                                ? { ...p, ...updates, updatedAt: new Date().toISOString() }
                                : p
                        ),
                        error: null,
                    }));
                }

            } catch (e) {
                console.error('Failed to update project:', e);
                set({ error: e.message });
            }
        },

        // Delete project
        deleteProject: async (projectId) => {
            if (!isSupabaseConfigured()) {
                set({ error: 'Supabase not configured' });
                return;
            }

            try {
                const { error } = await supabase
                    .from('projects')
                    .delete()
                    .eq('id', projectId);

                if (error) throw error;

                set((state) => ({
                    projects: state.projects.filter(p => p.id !== projectId),
                    error: null,
                }));

            } catch (e) {
                console.error('Failed to delete project:', e);
                set({ error: e.message });
            }
        },

        // Get single project
        getProject: (projectId) => {
            return get().projects.find(p => p.id === projectId);
        },

        // Get projects by status
        getProjectsByStatus: (status) => {
            return get().projects.filter(p => p.status === status);
        },

        // Get projects for a client
        getClientProjects: (clientId) => {
            return get().projects.filter(p => p.clientId === clientId);
        },

        // Get active projects (confirmed, in_progress)
        getActiveProjects: () => {
            return get().projects.filter(p =>
                p.status === 'confirmed' || p.status === 'in_progress'
            );
        },

        // Update status
        updateStatus: async (projectId, status) => {
            await get().updateProject(projectId, { status });
        },

        // Create project from quote
        createFromQuote: async (quote, opportunity = null) => {
            const projectData = {
                name: quote.project?.title || opportunity?.title || 'Untitled Project',
                opportunityId: opportunity?.id || null,
                quoteId: quote.id || null,
                clientId: quote.client?.clientId || opportunity?.clientId || null,
                client: {
                    company: quote.client?.company || opportunity?.client?.company || '',
                    contact: quote.client?.contact || '',
                    email: quote.client?.email || '',
                    phone: quote.client?.phone || '',
                },
                description: quote.project?.description || opportunity?.brief || '',
                region: quote.region || opportunity?.region || '',
                country: quote.project?.location || opportunity?.country || '',
                startDate: quote.project?.startDate || null,
                endDate: quote.project?.endDate || null,
                status: 'confirmed',
                currency: quote.currency || 'USD',
                budgetTotal: quote.totals?.grandTotal || opportunity?.value || 0,
                budgetBreakdown: quote.sections || {},
            };

            const project = await get().addProject(projectData);

            // Update quote with project reference
            if (project && quote.id) {
                try {
                    await supabase
                        .from('quotes')
                        .update({ project_id: project.id })
                        .eq('id', quote.id);
                } catch (e) {
                    console.error('Failed to link quote to project:', e);
                }
            }

            // Update opportunity with project reference
            if (project && opportunity?.id) {
                try {
                    await supabase
                        .from('opportunities')
                        .update({ converted_to_project_id: project.id })
                        .eq('id', opportunity.id);
                } catch (e) {
                    console.error('Failed to link opportunity to project:', e);
                }
            }

            return project;
        },

        // Get project stats
        getProjectStats: () => {
            const { projects } = get();

            const byStatus = {};
            Object.keys(PROJECT_STATUSES).forEach(status => {
                byStatus[status] = projects.filter(p => p.status === status).length;
            });

            const active = projects.filter(p =>
                p.status === 'confirmed' || p.status === 'in_progress'
            );

            const totalBudget = active.reduce((sum, p) => sum + (p.budgetTotal || 0), 0);
            const totalActuals = active.reduce((sum, p) => sum + (p.actualsTotal || 0), 0);

            return {
                total: projects.length,
                byStatus,
                activeCount: active.length,
                totalBudget,
                totalActuals,
                budgetRemaining: totalBudget - totalActuals,
            };
        },

        // Clear error
        clearError: () => {
            set({ error: null });
        },
    }))
);
