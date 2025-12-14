import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

const ACTIVITY_STORAGE_KEY = 'tell_activity_logs';
const SYNC_QUEUE_KEY = 'tell_activity_sync_queue';

// Sync queue functions
function loadSyncQueue() {
    try {
        const saved = localStorage.getItem(SYNC_QUEUE_KEY);
        return saved ? JSON.parse(saved) : [];
    } catch (e) {
        return [];
    }
}

function saveSyncQueue(queue) {
    try {
        localStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(queue));
    } catch (e) {
        console.error('Failed to save sync queue:', e);
    }
}

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

function generateId() {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
}

// Activity type configurations
export const ACTIVITY_TYPES = {
    call: { label: 'Call', icon: 'phone', color: 'text-green-400', bgColor: 'bg-green-400/10' },
    email: { label: 'Email', icon: 'mail', color: 'text-blue-400', bgColor: 'bg-blue-400/10' },
    meeting: { label: 'Meeting', icon: 'users', color: 'text-purple-400', bgColor: 'bg-purple-400/10' },
    note: { label: 'Note', icon: 'file-text', color: 'text-gray-400', bgColor: 'bg-gray-400/10' },
    task: { label: 'Task', icon: 'check-square', color: 'text-amber-400', bgColor: 'bg-amber-400/10' },
    quote_sent: { label: 'Quote Sent', icon: 'send', color: 'text-cyan-400', bgColor: 'bg-cyan-400/10' },
    quote_won: { label: 'Quote Won', icon: 'trophy', color: 'text-emerald-400', bgColor: 'bg-emerald-400/10' },
    quote_lost: { label: 'Quote Lost', icon: 'x-circle', color: 'text-red-400', bgColor: 'bg-red-400/10' },
    follow_up: { label: 'Follow-up', icon: 'clock', color: 'text-orange-400', bgColor: 'bg-orange-400/10' },
    other: { label: 'Other', icon: 'more-horizontal', color: 'text-gray-400', bgColor: 'bg-gray-400/10' },
};

export const useActivityStore = create(
    subscribeWithSelector((set, get) => ({
        activities: loadActivitiesLocal(),
        loading: false,
        syncStatus: 'idle', // 'idle' | 'syncing' | 'error' | 'success'
        syncError: null,
        pendingSyncCount: loadSyncQueue().length,

        clearSyncError: () => {
            set({ syncError: null, syncStatus: 'idle' });
        },

        getUnsyncedCount: () => {
            const queue = loadSyncQueue();
            const unsyncedActivities = get().activities.filter(a => a._synced === false);
            return queue.length + unsyncedActivities.length;
        },

        addToSyncQueue: (action, id, data) => {
            const queue = loadSyncQueue();
            queue.push({ action, id, data, timestamp: Date.now() });
            saveSyncQueue(queue);
            set({ pendingSyncCount: queue.length });
        },

        processSyncQueue: async () => {
            if (!isSupabaseConfigured()) return;

            const queue = loadSyncQueue();
            if (queue.length === 0) return;

            set({ syncStatus: 'syncing' });
            const newQueue = [];

            for (const item of queue) {
                try {
                    if (item.action === 'create') {
                        const { error } = await supabase
                            .from('activity_logs')
                            .insert(item.data);
                        if (error) throw error;
                    } else if (item.action === 'update') {
                        const { error } = await supabase
                            .from('activity_logs')
                            .update(item.data)
                            .eq('id', item.id);
                        if (error) throw error;
                    } else if (item.action === 'delete') {
                        const { error } = await supabase
                            .from('activity_logs')
                            .delete()
                            .eq('id', item.id);
                        if (error) throw error;
                    }
                } catch (error) {
                    console.error(`Failed to process sync queue item:`, error);
                    newQueue.push(item);
                }
            }

            saveSyncQueue(newQueue);
            set({
                syncStatus: newQueue.length > 0 ? 'error' : 'success',
                syncError: newQueue.length > 0 ? `${newQueue.length} items failed to sync` : null,
                pendingSyncCount: newQueue.length
            });
        },

        syncAllToSupabase: async () => {
            const { processSyncQueue } = get();
            await processSyncQueue();
        },

        // Initialize - load from Supabase
        initialize: async () => {
            if (!isSupabaseConfigured()) {
                set({ loading: false, syncStatus: 'idle' });
                return;
            }

            set({ loading: true, syncStatus: 'syncing' });
            try {
                const { data, error } = await supabase
                    .from('activity_logs')
                    .select('*')
                    .order('activity_date', { ascending: false })
                    .limit(500);

                if (error) throw error;

                const activities = (data || []).map(a => ({
                    id: a.id,
                    clientId: a.client_id,
                    contactId: a.contact_id,
                    opportunityId: a.opportunity_id,
                    quoteId: a.quote_id,
                    type: a.type,
                    title: a.title,
                    description: a.description,
                    loggedBy: a.logged_by,
                    loggedByName: a.logged_by_name,
                    activityDate: a.activity_date,
                    followUpDate: a.follow_up_date,
                    followUpCompleted: a.follow_up_completed,
                    createdAt: a.created_at,
                    _synced: true,
                }));

                set({ activities, loading: false, syncStatus: 'success', syncError: null });
                saveActivitiesLocal(activities);

                // Process any pending sync queue items
                const queue = loadSyncQueue();
                if (queue.length > 0) {
                    get().processSyncQueue();
                }
            } catch (error) {
                console.error('Failed to load activities:', error);
                set({ loading: false, syncStatus: 'error', syncError: error.message });
            }
        },

        // Get activities for a specific client
        getClientActivities: (clientId) => {
            return get().activities.filter(a => a.clientId === clientId);
        },

        // Get activities for a specific opportunity
        getOpportunityActivities: (opportunityId) => {
            return get().activities.filter(a => a.opportunityId === opportunityId);
        },

        // Get activities for a specific contact
        getContactActivities: (clientId, contactId) => {
            return get().activities.filter(a => a.clientId === clientId && a.contactId === contactId);
        },

        // Get upcoming follow-ups
        getUpcomingFollowUps: (days = 7) => {
            const now = new Date();
            const futureDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

            return get().activities.filter(a =>
                a.followUpDate &&
                !a.followUpCompleted &&
                new Date(a.followUpDate) <= futureDate
            ).sort((a, b) => new Date(a.followUpDate) - new Date(b.followUpDate));
        },

        // Get overdue follow-ups
        getOverdueFollowUps: () => {
            const now = new Date();
            return get().activities.filter(a =>
                a.followUpDate &&
                !a.followUpCompleted &&
                new Date(a.followUpDate) < now
            ).sort((a, b) => new Date(a.followUpDate) - new Date(b.followUpDate));
        },

        // Add new activity
        addActivity: async (activityData) => {
            const { activities, addToSyncQueue } = get();
            const newActivity = {
                id: generateId(),
                ...activityData,
                activityDate: activityData.activityDate || new Date().toISOString(),
                createdAt: new Date().toISOString(),
                _synced: false,
            };

            // Optimistic update
            const updated = [newActivity, ...activities];
            set({ activities: updated });
            saveActivitiesLocal(updated);

            // Sync to Supabase
            if (isSupabaseConfigured()) {
                const dbData = {
                    client_id: newActivity.clientId,
                    contact_id: newActivity.contactId,
                    opportunity_id: newActivity.opportunityId,
                    quote_id: newActivity.quoteId,
                    type: newActivity.type,
                    title: newActivity.title,
                    description: newActivity.description,
                    logged_by: newActivity.loggedBy,
                    logged_by_name: newActivity.loggedByName,
                    activity_date: newActivity.activityDate,
                    follow_up_date: newActivity.followUpDate,
                    follow_up_completed: newActivity.followUpCompleted || false,
                };

                try {
                    const { data, error } = await supabase
                        .from('activity_logs')
                        .insert(dbData)
                        .select()
                        .single();

                    if (error) throw error;

                    // Update with server ID and mark as synced
                    if (data) {
                        const serverActivity = {
                            ...newActivity,
                            id: data.id,
                            _synced: true,
                        };
                        const syncedActivities = get().activities.map(a =>
                            a.id === newActivity.id ? serverActivity : a
                        );
                        set({ activities: syncedActivities, syncStatus: 'success', syncError: null });
                        saveActivitiesLocal(syncedActivities);
                    }
                } catch (error) {
                    console.error('Failed to sync activity to Supabase:', error);
                    addToSyncQueue('create', newActivity.id, dbData);
                    set({ syncStatus: 'error', syncError: error.message });
                }
            }

            return newActivity;
        },

        // Update activity
        updateActivity: async (id, updates) => {
            const { activities, addToSyncQueue } = get();
            const updated = activities.map(a =>
                a.id === id ? { ...a, ...updates, _synced: false } : a
            );

            set({ activities: updated });
            saveActivitiesLocal(updated);

            if (isSupabaseConfigured()) {
                const dbUpdates = {};
                if (updates.title !== undefined) dbUpdates.title = updates.title;
                if (updates.description !== undefined) dbUpdates.description = updates.description;
                if (updates.type !== undefined) dbUpdates.type = updates.type;
                if (updates.activityDate !== undefined) dbUpdates.activity_date = updates.activityDate;
                if (updates.followUpDate !== undefined) dbUpdates.follow_up_date = updates.followUpDate;
                if (updates.followUpCompleted !== undefined) dbUpdates.follow_up_completed = updates.followUpCompleted;

                try {
                    const { error } = await supabase
                        .from('activity_logs')
                        .update(dbUpdates)
                        .eq('id', id);

                    if (error) throw error;

                    // Mark as synced
                    const syncedActivities = get().activities.map(a =>
                        a.id === id ? { ...a, _synced: true } : a
                    );
                    set({ activities: syncedActivities, syncStatus: 'success', syncError: null });
                    saveActivitiesLocal(syncedActivities);
                } catch (error) {
                    console.error('Failed to update activity:', error);
                    addToSyncQueue('update', id, dbUpdates);
                    set({ syncStatus: 'error', syncError: error.message });
                }
            }
        },

        // Mark follow-up as completed
        completeFollowUp: async (id) => {
            await get().updateActivity(id, { followUpCompleted: true });
        },

        // Delete activity
        deleteActivity: async (id) => {
            const { activities, addToSyncQueue } = get();
            const updated = activities.filter(a => a.id !== id);

            set({ activities: updated });
            saveActivitiesLocal(updated);

            if (isSupabaseConfigured()) {
                try {
                    const { error } = await supabase
                        .from('activity_logs')
                        .delete()
                        .eq('id', id);

                    if (error) throw error;
                    set({ syncStatus: 'success', syncError: null });
                } catch (error) {
                    console.error('Failed to delete activity:', error);
                    addToSyncQueue('delete', id, null);
                    set({ syncStatus: 'error', syncError: error.message });
                }
            }
        },
    }))
);

// Subscribe to save to localStorage on changes
useActivityStore.subscribe(
    (state) => state.activities,
    (activities) => saveActivitiesLocal(activities)
);
