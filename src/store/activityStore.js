import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

const ACTIVITY_STORAGE_KEY = 'tell_activities';

// Load from localStorage (fallback/cache)
function loadActivitiesLocal() {
    try {
        const saved = localStorage.getItem(ACTIVITY_STORAGE_KEY);
        return saved ? JSON.parse(saved) : [];
    } catch (e) {
        return [];
    }
}

function saveActivitiesLocal(activities) {
    try {
        localStorage.setItem(ACTIVITY_STORAGE_KEY, JSON.stringify(activities));
    } catch (e) {
        console.error('Failed to save activities locally:', e);
    }
}

// Activity type configurations
export const ACTIVITY_TYPES = {
    call: { label: 'Call', icon: 'phone', color: 'text-green-400', bgColor: 'bg-green-400/10' },
    email: { label: 'Email', icon: 'mail', color: 'text-blue-400', bgColor: 'bg-blue-400/10' },
    meeting: { label: 'Meeting', icon: 'users', color: 'text-purple-400', bgColor: 'bg-purple-400/10' },
    note: { label: 'Note', icon: 'file-text', color: 'text-gray-400', bgColor: 'bg-gray-400/10' },
    task: { label: 'Task', icon: 'check-square', color: 'text-amber-400', bgColor: 'bg-amber-400/10' },
    quote_sent: { label: 'Quote Sent', icon: 'send', color: 'text-cyan-400', bgColor: 'bg-cyan-400/10' },
    quote_viewed: { label: 'Quote Viewed', icon: 'eye', color: 'text-indigo-400', bgColor: 'bg-indigo-400/10' },
    quote_accepted: { label: 'Quote Won', icon: 'trophy', color: 'text-emerald-400', bgColor: 'bg-emerald-400/10' },
    quote_rejected: { label: 'Quote Lost', icon: 'x-circle', color: 'text-red-400', bgColor: 'bg-red-400/10' },
};

// Call outcomes
export const CALL_OUTCOMES = [
    { id: 'connected', label: 'Connected', color: 'text-green-400' },
    { id: 'voicemail', label: 'Left Voicemail', color: 'text-amber-400' },
    { id: 'no_answer', label: 'No Answer', color: 'text-gray-400' },
    { id: 'busy', label: 'Busy', color: 'text-orange-400' },
    { id: 'wrong_number', label: 'Wrong Number', color: 'text-red-400' },
];

// Meeting types
export const MEETING_TYPES = [
    { id: 'in_person', label: 'In Person', icon: 'users' },
    { id: 'video', label: 'Video Call', icon: 'video' },
    { id: 'phone', label: 'Phone Call', icon: 'phone' },
];

// Task priorities
export const TASK_PRIORITIES = [
    { id: 'low', label: 'Low', color: 'text-gray-400', bgColor: 'bg-gray-400/10' },
    { id: 'medium', label: 'Medium', color: 'text-blue-400', bgColor: 'bg-blue-400/10' },
    { id: 'high', label: 'High', color: 'text-orange-400', bgColor: 'bg-orange-400/10' },
    { id: 'urgent', label: 'Urgent', color: 'text-red-400', bgColor: 'bg-red-400/10' },
];

// Convert DB format to app format
function fromDbFormat(a) {
    return {
        id: a.id,
        contactId: a.contact_id,
        clientId: a.client_id,
        opportunityId: a.opportunity_id,
        quoteId: a.quote_id,
        activityType: a.activity_type,
        subject: a.subject,
        description: a.description,
        callOutcome: a.call_outcome,
        callDirection: a.call_direction,
        meetingType: a.meeting_type,
        meetingLocation: a.meeting_location,
        durationMinutes: a.duration_minutes,
        dueDate: a.due_date,
        isCompleted: a.is_completed,
        completedAt: a.completed_at,
        priority: a.priority,
        assignedTo: a.assigned_to,
        emailMessageId: a.email_message_id,
        activityDate: a.activity_date,
        createdAt: a.created_at,
        updatedAt: a.updated_at,
    };
}

// Convert app format to DB format
function toDbFormat(activity) {
    return {
        contact_id: activity.contactId || null,
        client_id: activity.clientId || null,
        opportunity_id: activity.opportunityId || null,
        quote_id: activity.quoteId || null,
        activity_type: activity.activityType,
        subject: activity.subject || null,
        description: activity.description || null,
        call_outcome: activity.callOutcome || null,
        call_direction: activity.callDirection || null,
        meeting_type: activity.meetingType || null,
        meeting_location: activity.meetingLocation || null,
        duration_minutes: activity.durationMinutes || null,
        due_date: activity.dueDate || null,
        is_completed: activity.isCompleted || false,
        completed_at: activity.completedAt || null,
        priority: activity.priority || null,
        assigned_to: activity.assignedTo || null,
        email_message_id: activity.emailMessageId || null,
        activity_date: activity.activityDate || new Date().toISOString(),
    };
}

export const useActivityStore = create(
    subscribeWithSelector((set, get) => ({
        activities: loadActivitiesLocal(),
        loading: false,
        error: null,
        initialized: false,

        // Initialize - load from Supabase
        initialize: async () => {
            if (get().initialized) return;

            set({ loading: true, error: null });

            if (!isSupabaseConfigured()) {
                set({ loading: false, initialized: true });
                return;
            }

            try {
                const { data, error } = await supabase
                    .from('activities')
                    .select('*')
                    .order('activity_date', { ascending: false })
                    .limit(500);

                if (error) throw error;

                const activities = (data || []).map(fromDbFormat);
                saveActivitiesLocal(activities);
                set({ activities, loading: false, initialized: true, error: null });
            } catch (e) {
                console.error('Failed to load activities:', e);
                set({ loading: false, error: e.message, initialized: true });
            }
        },

        // Get activities for a specific client
        getClientActivities: (clientId) => {
            return get().activities
                .filter(a => a.clientId === clientId)
                .sort((a, b) => new Date(b.activityDate) - new Date(a.activityDate));
        },

        // Get activities for a specific opportunity
        getOpportunityActivities: (opportunityId) => {
            return get().activities
                .filter(a => a.opportunityId === opportunityId)
                .sort((a, b) => new Date(b.activityDate) - new Date(a.activityDate));
        },

        // Get activities for a specific contact
        getContactActivities: (contactId) => {
            return get().activities
                .filter(a => a.contactId === contactId)
                .sort((a, b) => new Date(b.activityDate) - new Date(a.activityDate));
        },

        // Get upcoming tasks (due in next X days)
        getUpcomingTasks: (days = 7) => {
            const now = new Date();
            const futureDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

            return get().activities.filter(a =>
                a.activityType === 'task' &&
                !a.isCompleted &&
                a.dueDate &&
                new Date(a.dueDate) <= futureDate
            ).sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
        },

        // Get overdue tasks
        getOverdueTasks: () => {
            const now = new Date();
            return get().activities.filter(a =>
                a.activityType === 'task' &&
                !a.isCompleted &&
                a.dueDate &&
                new Date(a.dueDate) < now
            ).sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
        },

        // Get overdue follow-ups (any incomplete activity with overdue date)
        getOverdueFollowUps: () => {
            const now = new Date();
            return get().activities.filter(a =>
                !a.isCompleted &&
                a.dueDate &&
                new Date(a.dueDate) < now
            ).sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
        },

        // Get recent activities
        getRecentActivities: (limit = 20) => {
            return get().activities
                .slice(0, limit);
        },

        // Add new activity
        addActivity: async (activityData) => {
            if (!isSupabaseConfigured()) {
                set({ error: 'Supabase not configured' });
                return null;
            }

            try {
                const dbData = toDbFormat(activityData);

                const { data, error } = await supabase
                    .from('activities')
                    .insert(dbData)
                    .select()
                    .single();

                if (error) throw error;

                const newActivity = fromDbFormat(data);

                set(state => {
                    const activities = [newActivity, ...state.activities];
                    saveActivitiesLocal(activities);
                    return { activities, error: null };
                });

                return newActivity;
            } catch (e) {
                console.error('Failed to add activity:', e);
                set({ error: e.message });
                return null;
            }
        },

        // Log a call
        logCall: async (data) => {
            return get().addActivity({
                ...data,
                activityType: 'call',
            });
        },

        // Log a meeting
        logMeeting: async (data) => {
            return get().addActivity({
                ...data,
                activityType: 'meeting',
            });
        },

        // Log an email (can link to email_messages)
        logEmail: async (data) => {
            return get().addActivity({
                ...data,
                activityType: 'email',
            });
        },

        // Add a note
        addNote: async (data) => {
            return get().addActivity({
                ...data,
                activityType: 'note',
            });
        },

        // Create a task
        createTask: async (data) => {
            return get().addActivity({
                ...data,
                activityType: 'task',
                isCompleted: false,
            });
        },

        // Update activity
        updateActivity: async (id, updates) => {
            if (!isSupabaseConfigured()) {
                set({ error: 'Supabase not configured' });
                return false;
            }

            try {
                const dbUpdates = {};
                if (updates.subject !== undefined) dbUpdates.subject = updates.subject;
                if (updates.description !== undefined) dbUpdates.description = updates.description;
                if (updates.activityType !== undefined) dbUpdates.activity_type = updates.activityType;
                if (updates.activityDate !== undefined) dbUpdates.activity_date = updates.activityDate;
                if (updates.dueDate !== undefined) dbUpdates.due_date = updates.dueDate;
                if (updates.isCompleted !== undefined) dbUpdates.is_completed = updates.isCompleted;
                if (updates.completedAt !== undefined) dbUpdates.completed_at = updates.completedAt;
                if (updates.priority !== undefined) dbUpdates.priority = updates.priority;
                if (updates.callOutcome !== undefined) dbUpdates.call_outcome = updates.callOutcome;
                if (updates.callDirection !== undefined) dbUpdates.call_direction = updates.callDirection;
                if (updates.meetingType !== undefined) dbUpdates.meeting_type = updates.meetingType;
                if (updates.meetingLocation !== undefined) dbUpdates.meeting_location = updates.meetingLocation;
                if (updates.durationMinutes !== undefined) dbUpdates.duration_minutes = updates.durationMinutes;

                const { error } = await supabase
                    .from('activities')
                    .update(dbUpdates)
                    .eq('id', id);

                if (error) throw error;

                set(state => {
                    const activities = state.activities.map(a =>
                        a.id === id ? { ...a, ...updates, updatedAt: new Date().toISOString() } : a
                    );
                    saveActivitiesLocal(activities);
                    return { activities, error: null };
                });

                return true;
            } catch (e) {
                console.error('Failed to update activity:', e);
                set({ error: e.message });
                return false;
            }
        },

        // Complete a task
        completeTask: async (id) => {
            return get().updateActivity(id, {
                isCompleted: true,
                completedAt: new Date().toISOString(),
            });
        },

        // Reopen a task
        reopenTask: async (id) => {
            return get().updateActivity(id, {
                isCompleted: false,
                completedAt: null,
            });
        },

        // Delete activity
        deleteActivity: async (id) => {
            if (!isSupabaseConfigured()) {
                set({ error: 'Supabase not configured' });
                return false;
            }

            try {
                const { error } = await supabase
                    .from('activities')
                    .delete()
                    .eq('id', id);

                if (error) throw error;

                set(state => {
                    const activities = state.activities.filter(a => a.id !== id);
                    saveActivitiesLocal(activities);
                    return { activities, error: null };
                });

                return true;
            } catch (e) {
                console.error('Failed to delete activity:', e);
                set({ error: e.message });
                return false;
            }
        },

        // Clear error
        clearError: () => set({ error: null }),
    }))
);
