import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { generatePrefixedId } from '../utils/generateId';
import logger from '../utils/logger';

const TEMPLATES_KEY = 'tell_quote_templates';
const SYNC_QUEUE_KEY = 'tell_quote_templates_sync_queue';

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
        logger.error('Failed to save sync queue:', e);
    }
}

// Load from localStorage
function loadTemplatesLocal() {
    try {
        const saved = localStorage.getItem(TEMPLATES_KEY);
        return saved ? JSON.parse(saved) : [];
    } catch (e) {
        return [];
    }
}

function saveTemplatesLocal(templates) {
    try {
        localStorage.setItem(TEMPLATES_KEY, JSON.stringify(templates));
    } catch (e) {
        logger.error('Failed to save templates locally:', e);
    }
}

function generateTemplateId() {
    return generatePrefixedId('tmpl');
}

export const useQuoteTemplateStore = create(
    subscribeWithSelector((set, get) => ({
        templates: loadTemplatesLocal(),
        loading: false,
        syncStatus: 'idle', // 'idle' | 'syncing' | 'error' | 'success'
        syncError: null,
        pendingSyncCount: loadSyncQueue().length,

        clearSyncError: () => {
            set({ syncError: null, syncStatus: 'idle' });
        },

        getUnsyncedCount: () => {
            const queue = loadSyncQueue();
            const unsyncedTemplates = get().templates.filter(t => t._synced === false);
            return queue.length + unsyncedTemplates.length;
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
                            .from('quote_templates')
                            .insert(item.data);
                        if (error) throw error;
                    } else if (item.action === 'update') {
                        const { error } = await supabase
                            .from('quote_templates')
                            .update(item.data)
                            .eq('id', item.id);
                        if (error) throw error;
                    } else if (item.action === 'delete') {
                        const { error } = await supabase
                            .from('quote_templates')
                            .delete()
                            .eq('id', item.id);
                        if (error) throw error;
                    }
                } catch (error) {
                    logger.error(`Failed to process sync queue item:`, error);
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
                    .from('quote_templates')
                    .select('*')
                    .order('created_at', { ascending: false });

                if (error) throw error;

                const templates = (data || []).map(t => ({
                    id: t.id,
                    name: t.name,
                    description: t.description,
                    category: t.category,
                    sections: t.sections,
                    currency: t.currency,
                    region: t.region,
                    fees: t.fees,
                    projectDefaults: t.project_defaults,
                    createdAt: t.created_at,
                    updatedAt: t.updated_at,
                    usageCount: t.usage_count || 0,
                    _synced: true,
                }));

                set({ templates, loading: false, syncStatus: 'success', syncError: null });
                saveTemplatesLocal(templates);

                // Process any pending sync queue items
                const queue = loadSyncQueue();
                if (queue.length > 0) {
                    get().processSyncQueue();
                }
            } catch (error) {
                logger.error('Failed to load templates:', error);
                set({ loading: false, syncStatus: 'error', syncError: error.message });
            }
        },

        // Get template by ID
        getTemplate: (id) => {
            return get().templates.find(t => t.id === id);
        },

        // Get templates by category
        getTemplatesByCategory: (category) => {
            return get().templates.filter(t => t.category === category);
        },

        // Create template from current quote
        createTemplate: async (templateData) => {
            const { templates, addToSyncQueue } = get();
            const newTemplate = {
                id: generateTemplateId(),
                name: templateData.name,
                description: templateData.description || '',
                category: templateData.category || 'general',
                sections: templateData.sections,
                currency: templateData.currency || 'USD',
                region: templateData.region || 'SEA',
                fees: templateData.fees || { managementFee: 0, commissionFee: 0, discountPercent: 0 },
                projectDefaults: templateData.projectDefaults || {},
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                usageCount: 0,
                _synced: false,
            };

            // Optimistic update
            const updated = [newTemplate, ...templates];
            set({ templates: updated });
            saveTemplatesLocal(updated);

            // Sync to Supabase
            if (isSupabaseConfigured()) {
                const dbData = {
                    id: newTemplate.id,
                    name: newTemplate.name,
                    description: newTemplate.description,
                    category: newTemplate.category,
                    sections: newTemplate.sections,
                    currency: newTemplate.currency,
                    region: newTemplate.region,
                    fees: newTemplate.fees,
                    project_defaults: newTemplate.projectDefaults,
                    usage_count: 0,
                };

                try {
                    const { error } = await supabase
                        .from('quote_templates')
                        .insert(dbData);

                    if (error) throw error;

                    // Mark as synced
                    const syncedTemplates = get().templates.map(t =>
                        t.id === newTemplate.id ? { ...t, _synced: true } : t
                    );
                    set({ templates: syncedTemplates, syncStatus: 'success', syncError: null });
                    saveTemplatesLocal(syncedTemplates);
                } catch (error) {
                    logger.error('Failed to sync template:', error);
                    addToSyncQueue('create', newTemplate.id, dbData);
                    set({ syncStatus: 'error', syncError: error.message });
                }
            }

            return newTemplate;
        },

        // Update template
        updateTemplate: async (id, updates) => {
            const { templates, addToSyncQueue } = get();
            const updated = templates.map(t =>
                t.id === id ? { ...t, ...updates, updatedAt: new Date().toISOString(), _synced: false } : t
            );

            set({ templates: updated });
            saveTemplatesLocal(updated);

            if (isSupabaseConfigured()) {
                const dbUpdates = {
                    name: updates.name,
                    description: updates.description,
                    category: updates.category,
                    sections: updates.sections,
                    currency: updates.currency,
                    region: updates.region,
                    fees: updates.fees,
                    project_defaults: updates.projectDefaults,
                    updated_at: new Date().toISOString(),
                };

                // Remove undefined values
                Object.keys(dbUpdates).forEach(key => {
                    if (dbUpdates[key] === undefined) delete dbUpdates[key];
                });

                try {
                    const { error } = await supabase
                        .from('quote_templates')
                        .update(dbUpdates)
                        .eq('id', id);

                    if (error) throw error;

                    // Mark as synced
                    const syncedTemplates = get().templates.map(t =>
                        t.id === id ? { ...t, _synced: true } : t
                    );
                    set({ templates: syncedTemplates, syncStatus: 'success', syncError: null });
                    saveTemplatesLocal(syncedTemplates);
                } catch (error) {
                    logger.error('Failed to update template:', error);
                    addToSyncQueue('update', id, dbUpdates);
                    set({ syncStatus: 'error', syncError: error.message });
                }
            }
        },

        // Delete template
        deleteTemplate: async (id) => {
            const { templates, addToSyncQueue } = get();
            const updated = templates.filter(t => t.id !== id);

            set({ templates: updated });
            saveTemplatesLocal(updated);

            if (isSupabaseConfigured()) {
                try {
                    const { error } = await supabase
                        .from('quote_templates')
                        .delete()
                        .eq('id', id);

                    if (error) throw error;
                    set({ syncStatus: 'success', syncError: null });
                } catch (error) {
                    logger.error('Failed to delete template:', error);
                    addToSyncQueue('delete', id, null);
                    set({ syncStatus: 'error', syncError: error.message });
                }
            }
        },

        // Increment usage count when template is used
        incrementUsageCount: async (id) => {
            const { templates } = get();
            const template = templates.find(t => t.id === id);
            if (!template) return;

            const newCount = (template.usageCount || 0) + 1;
            const updated = templates.map(t =>
                t.id === id ? { ...t, usageCount: newCount } : t
            );

            set({ templates: updated });
            saveTemplatesLocal(updated);

            if (isSupabaseConfigured()) {
                try {
                    await supabase
                        .from('quote_templates')
                        .update({ usage_count: newCount })
                        .eq('id', id);
                } catch (error) {
                    logger.error('Failed to update usage count:', error);
                }
            }
        },
    }))
);

// Subscribe to save to localStorage on changes
useQuoteTemplateStore.subscribe(
    (state) => state.templates,
    (templates) => saveTemplatesLocal(templates)
);
