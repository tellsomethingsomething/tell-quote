import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import logger from '../utils/logger';

// Task types for commercial activities
export const TASK_TYPES = {
    RESEARCH: 'research',
    OUTREACH: 'outreach',
    PROPOSAL: 'proposal',
    FOLLOW_UP: 'follow_up',
    MEETING: 'meeting',
    CONTRACT: 'contract',
};

export const TASK_TYPE_CONFIG = {
    [TASK_TYPES.RESEARCH]: { label: 'Research', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30', icon: '🔍' },
    [TASK_TYPES.OUTREACH]: { label: 'Outreach', color: 'bg-purple-500/20 text-purple-400 border-purple-500/30', icon: '📧' },
    [TASK_TYPES.PROPOSAL]: { label: 'Proposal', color: 'bg-green-500/20 text-green-400 border-green-500/30', icon: '📄' },
    [TASK_TYPES.FOLLOW_UP]: { label: 'Follow Up', color: 'bg-amber-500/20 text-amber-400 border-amber-500/30', icon: '🔄' },
    [TASK_TYPES.MEETING]: { label: 'Meeting', color: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30', icon: '📅' },
    [TASK_TYPES.CONTRACT]: { label: 'Contract', color: 'bg-red-500/20 text-red-400 border-red-500/30', icon: '✍️' },
};

export const TASK_STATUS = {
    PENDING: 'pending',
    IN_PROGRESS: 'in_progress',
    COMPLETED: 'completed',
    CANCELLED: 'cancelled',
};

export const TASK_STATUS_CONFIG = {
    [TASK_STATUS.PENDING]: { label: 'Pending', color: 'bg-gray-500/20 text-gray-400' },
    [TASK_STATUS.IN_PROGRESS]: { label: 'In Progress', color: 'bg-blue-500/20 text-blue-400' },
    [TASK_STATUS.COMPLETED]: { label: 'Completed', color: 'bg-green-500/20 text-green-400' },
    [TASK_STATUS.CANCELLED]: { label: 'Cancelled', color: 'bg-red-500/20 text-red-400' },
};

function fromDbFormat(record) {
    return {
        id: record.id,
        title: record.title,
        description: record.description,
        taskType: record.task_type,
        status: record.status,
        priority: record.priority || 'medium',
        startDate: record.start_date,
        dueDate: record.due_date,
        completedDate: record.completed_date,
        opportunityId: record.opportunity_id,
        eventId: record.event_id,
        assignedTo: record.assigned_to,
        comments: record.comments || [],
        createdAt: record.created_at,
        updatedAt: record.updated_at,
    };
}

function toDbFormat(task) {
    return {
        title: task.title,
        description: task.description,
        task_type: task.taskType,
        status: task.status,
        priority: task.priority || 'medium',
        start_date: task.startDate || null,
        due_date: task.dueDate || null,
        completed_date: task.completedDate || null,
        opportunity_id: task.opportunityId || null,
        event_id: task.eventId || null,
        assigned_to: task.assignedTo || null,
        comments: task.comments || [],
    };
}

export const useCommercialTasksStore = create(
    subscribeWithSelector((set, get) => ({
        tasks: [],
        loading: false,
        error: null,

        initialize: async () => {
            if (!isSupabaseConfigured()) {
                set({ loading: false, error: 'Supabase not configured' });
                return;
            }

            set({ loading: true, error: null });

            try {
                const { data, error } = await supabase
                    .from('commercial_tasks')
                    .select('*')
                    .order('due_date', { ascending: true });

                if (error) throw error;

                set({ tasks: (data || []).map(fromDbFormat), loading: false });
            } catch (e) {
                logger.error('Failed to load commercial tasks:', e);
                set({ loading: false, error: e.message });
            }
        },

        // Add a new task
        addTask: async (taskData) => {
            if (!isSupabaseConfigured()) return null;

            try {
                const newTask = {
                    title: taskData.title || '',
                    description: taskData.description || '',
                    taskType: taskData.taskType || TASK_TYPES.RESEARCH,
                    status: taskData.status || TASK_STATUS.PENDING,
                    priority: taskData.priority || 'medium',
                    startDate: taskData.startDate || new Date().toISOString().split('T')[0],
                    dueDate: taskData.dueDate || null,
                    completedDate: null,
                    opportunityId: taskData.opportunityId || null,
                    eventId: taskData.eventId || null,
                    assignedTo: taskData.assignedTo || null,
                    comments: [],
                };

                const { data, error } = await supabase
                    .from('commercial_tasks')
                    .insert(toDbFormat(newTask))
                    .select()
                    .single();

                if (error) throw error;

                const task = fromDbFormat(data);
                set((state) => ({
                    tasks: [task, ...state.tasks],
                }));

                return task;
            } catch (e) {
                logger.error('Failed to add task:', e);
                return null;
            }
        },

        // Update task
        updateTask: async (taskId, updates) => {
            if (!isSupabaseConfigured()) return;

            try {
                const dbUpdates = {};
                if (updates.title !== undefined) dbUpdates.title = updates.title;
                if (updates.description !== undefined) dbUpdates.description = updates.description;
                if (updates.taskType !== undefined) dbUpdates.task_type = updates.taskType;
                if (updates.status !== undefined) dbUpdates.status = updates.status;
                if (updates.priority !== undefined) dbUpdates.priority = updates.priority;
                if (updates.startDate !== undefined) dbUpdates.start_date = updates.startDate;
                if (updates.dueDate !== undefined) dbUpdates.due_date = updates.dueDate;
                if (updates.completedDate !== undefined) dbUpdates.completed_date = updates.completedDate;
                if (updates.opportunityId !== undefined) dbUpdates.opportunity_id = updates.opportunityId;
                if (updates.eventId !== undefined) dbUpdates.event_id = updates.eventId;
                if (updates.assignedTo !== undefined) dbUpdates.assigned_to = updates.assignedTo;
                if (updates.comments !== undefined) dbUpdates.comments = updates.comments;

                const { error } = await supabase
                    .from('commercial_tasks')
                    .update({ ...dbUpdates, updated_at: new Date().toISOString() })
                    .eq('id', taskId);

                if (error) throw error;

                set((state) => ({
                    tasks: state.tasks.map(t =>
                        t.id === taskId ? { ...t, ...updates, updatedAt: new Date().toISOString() } : t
                    ),
                }));
            } catch (e) {
                logger.error('Failed to update task:', e);
            }
        },

        // Delete task
        deleteTask: async (taskId) => {
            if (!isSupabaseConfigured()) return;

            try {
                const { error } = await supabase
                    .from('commercial_tasks')
                    .delete()
                    .eq('id', taskId);

                if (error) throw error;

                set((state) => ({
                    tasks: state.tasks.filter(t => t.id !== taskId),
                }));
            } catch (e) {
                logger.error('Failed to delete task:', e);
            }
        },

        // Add comment to task
        addComment: async (taskId, comment) => {
            const task = get().tasks.find(t => t.id === taskId);
            if (!task) return;

            const newComment = {
                id: crypto.randomUUID(),
                text: comment,
                createdAt: new Date().toISOString(),
            };

            const updatedComments = [...(task.comments || []), newComment];
            await get().updateTask(taskId, { comments: updatedComments });
        },

        // Update task status
        updateStatus: async (taskId, status) => {
            const updates = { status };
            if (status === TASK_STATUS.COMPLETED) {
                updates.completedDate = new Date().toISOString().split('T')[0];
            }
            await get().updateTask(taskId, updates);
        },

        // Update task dates (for Gantt chart drag)
        updateDates: async (taskId, startDate, dueDate) => {
            await get().updateTask(taskId, { startDate, dueDate });
        },

        // Get tasks by opportunity
        getTasksByOpportunity: (opportunityId) => {
            return get().tasks.filter(t => t.opportunityId === opportunityId);
        },

        // Get tasks by event
        getTasksByEvent: (eventId) => {
            return get().tasks.filter(t => t.eventId === eventId);
        },

        // Get tasks for Gantt chart (with date range)
        getTasksForGantt: () => {
            return get().tasks.filter(t => t.startDate || t.dueDate);
        },

        // Get upcoming tasks (next 7 days)
        getUpcomingTasks: () => {
            const now = new Date();
            const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

            return get().tasks.filter(t => {
                if (t.status === TASK_STATUS.COMPLETED || t.status === TASK_STATUS.CANCELLED) return false;
                if (!t.dueDate) return false;
                const dueDate = new Date(t.dueDate);
                return dueDate >= now && dueDate <= weekFromNow;
            }).sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
        },

        // Get overdue tasks
        getOverdueTasks: () => {
            const now = new Date();
            return get().tasks.filter(t => {
                if (t.status === TASK_STATUS.COMPLETED || t.status === TASK_STATUS.CANCELLED) return false;
                if (!t.dueDate) return false;
                return new Date(t.dueDate) < now;
            });
        },

        // Get stats
        getStats: () => {
            const tasks = get().tasks;
            const byStatus = {};
            const byType = {};

            tasks.forEach(t => {
                byStatus[t.status] = (byStatus[t.status] || 0) + 1;
                byType[t.taskType] = (byType[t.taskType] || 0) + 1;
            });

            return {
                total: tasks.length,
                pending: byStatus[TASK_STATUS.PENDING] || 0,
                inProgress: byStatus[TASK_STATUS.IN_PROGRESS] || 0,
                completed: byStatus[TASK_STATUS.COMPLETED] || 0,
                cancelled: byStatus[TASK_STATUS.CANCELLED] || 0,
                overdue: get().getOverdueTasks().length,
                byType,
            };
        },

        // Create task from sports event
        createFromEvent: async (event, taskType = TASK_TYPES.RESEARCH) => {
            return await get().addTask({
                title: `Research: ${event.eventName}`,
                description: `${event.organization || ''} - ${event.country || ''}\n${event.notes || ''}`,
                taskType,
                startDate: new Date().toISOString().split('T')[0],
                dueDate: event.startDate ? new Date(new Date(event.startDate).getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] : null,
                eventId: event.id,
            });
        },
    }))
);
