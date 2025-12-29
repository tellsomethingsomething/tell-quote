import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { supabase } from '../lib/supabase';
import logger from '../utils/logger';

// Template categories
export const TEMPLATE_CATEGORIES = {
    quote_followup: { id: 'quote_followup', label: 'Quote Follow-up', icon: '📋', color: 'bg-blue-500/10 text-blue-400' },
    intro: { id: 'intro', label: 'Introduction', icon: '👋', color: 'bg-green-500/10 text-green-400' },
    proposal: { id: 'proposal', label: 'Proposal', icon: '📝', color: 'bg-purple-500/10 text-purple-400' },
    thank_you: { id: 'thank_you', label: 'Thank You', icon: '🙏', color: 'bg-amber-500/10 text-amber-400' },
    meeting_request: { id: 'meeting_request', label: 'Meeting Request', icon: '📅', color: 'bg-purple-500/10 text-purple-400' },
    check_in: { id: 'check_in', label: 'Check-in', icon: '💬', color: 'bg-indigo-500/10 text-indigo-400' },
    custom: { id: 'custom', label: 'Custom', icon: '✨', color: 'bg-gray-500/10 text-gray-400' },
};

// Default template variables available for substitution
export const DEFAULT_VARIABLES = [
    { name: 'clientName', label: 'Client Name', default: '' },
    { name: 'contactName', label: 'Contact Name', default: '' },
    { name: 'contactFirstName', label: 'Contact First Name', default: '' },
    { name: 'companyName', label: 'Company Name', default: '' },
    { name: 'projectName', label: 'Project Name', default: '' },
    { name: 'quoteAmount', label: 'Quote Amount', default: '' },
    { name: 'quoteNumber', label: 'Quote Number', default: '' },
    { name: 'quoteDueDate', label: 'Quote Due Date', default: '' },
    { name: 'senderName', label: 'Sender Name', default: '' },
    { name: 'senderEmail', label: 'Sender Email', default: '' },
    { name: 'senderPhone', label: 'Sender Phone', default: '' },
    { name: 'senderTitle', label: 'Sender Title', default: '' },
    { name: 'todayDate', label: 'Today\'s Date', default: '' },
];

// Helper to apply template variables
export const applyTemplateVariables = (text, context = {}) => {
    if (!text) return '';

    let result = text;

    // Apply context values
    Object.entries(context).forEach(([key, value]) => {
        const regex = new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, 'gi');
        result = result.replace(regex, value || '');
    });

    // Clean up any remaining unmatched variables
    result = result.replace(/\{\{\s*\w+\s*\}\}/g, '');

    return result;
};

// Helper to extract variables from template text
export const extractVariables = (text) => {
    if (!text) return [];
    const matches = text.match(/\{\{\s*(\w+)\s*\}\}/g) || [];
    const uniqueVars = [...new Set(matches.map(m => m.replace(/\{\{\s*|\s*\}\}/g, '')))];
    return uniqueVars;
};

export const useEmailTemplateStore = create(
    subscribeWithSelector((set, get) => ({
        // Data
        templates: [],
        selectedTemplate: null,

        // UI state
        isLoading: false,
        isSaving: false,
        error: null,

        // Filters
        categoryFilter: null,
        searchQuery: '',
        showSharedOnly: false,

        // ============================================================
        // INITIALIZATION
        // ============================================================

        initialize: async () => {
            await get().loadTemplates();
        },

        // ============================================================
        // TEMPLATE CRUD
        // ============================================================

        loadTemplates: async () => {
            set({ isLoading: true, error: null });

            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) throw new Error('Not authenticated');

                const { data, error } = await supabase
                    .from('email_templates')
                    .select('*')
                    .or(`user_id.eq.${user.id},is_shared.eq.true`)
                    .order('use_count', { ascending: false });

                if (error) throw error;

                set({ templates: data || [], isLoading: false });
            } catch (error) {
                logger.error('Failed to load templates:', error);
                set({ isLoading: false, error: error.message });
            }
        },

        getTemplate: async (templateId) => {
            try {
                const { data, error } = await supabase
                    .from('email_templates')
                    .select('*')
                    .eq('id', templateId)
                    .single();

                if (error) throw error;

                return data;
            } catch (error) {
                logger.error('Failed to get template:', error);
                return null;
            }
        },

        createTemplate: async (templateData) => {
            set({ isSaving: true, error: null });

            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) throw new Error('Not authenticated');

                // Extract variables from content
                const subjectVars = extractVariables(templateData.subject);
                const bodyVars = extractVariables(templateData.body_html || templateData.body_text);
                const allVars = [...new Set([...subjectVars, ...bodyVars])];

                // Map to variable objects
                const variables = allVars.map(name => {
                    const defaultVar = DEFAULT_VARIABLES.find(v => v.name === name);
                    return {
                        name,
                        label: defaultVar?.label || name,
                        default: defaultVar?.default || '',
                    };
                });

                const { data, error } = await supabase
                    .from('email_templates')
                    .insert({
                        user_id: user.id,
                        name: templateData.name,
                        subject: templateData.subject,
                        body_html: templateData.body_html,
                        body_text: templateData.body_text,
                        category: templateData.category || 'custom',
                        variables,
                        is_shared: templateData.is_shared || false,
                    })
                    .select()
                    .single();

                if (error) throw error;

                set({
                    templates: [data, ...get().templates],
                    isSaving: false,
                });

                return { success: true, template: data };
            } catch (error) {
                logger.error('Failed to create template:', error);
                set({ isSaving: false, error: error.message });
                return { success: false, error: error.message };
            }
        },

        updateTemplate: async (templateId, updates) => {
            set({ isSaving: true, error: null });

            try {
                // Re-extract variables if content changed
                if (updates.subject || updates.body_html || updates.body_text) {
                    const existing = get().templates.find(t => t.id === templateId);
                    const subject = updates.subject ?? existing?.subject ?? '';
                    const body = updates.body_html ?? updates.body_text ?? existing?.body_html ?? existing?.body_text ?? '';

                    const subjectVars = extractVariables(subject);
                    const bodyVars = extractVariables(body);
                    const allVars = [...new Set([...subjectVars, ...bodyVars])];

                    updates.variables = allVars.map(name => {
                        const defaultVar = DEFAULT_VARIABLES.find(v => v.name === name);
                        return {
                            name,
                            label: defaultVar?.label || name,
                            default: defaultVar?.default || '',
                        };
                    });
                }

                const { data, error } = await supabase
                    .from('email_templates')
                    .update(updates)
                    .eq('id', templateId)
                    .select()
                    .single();

                if (error) throw error;

                set({
                    templates: get().templates.map(t => t.id === templateId ? data : t),
                    selectedTemplate: get().selectedTemplate?.id === templateId ? data : get().selectedTemplate,
                    isSaving: false,
                });

                return { success: true, template: data };
            } catch (error) {
                logger.error('Failed to update template:', error);
                set({ isSaving: false, error: error.message });
                return { success: false, error: error.message };
            }
        },

        deleteTemplate: async (templateId) => {
            try {
                const { error } = await supabase
                    .from('email_templates')
                    .delete()
                    .eq('id', templateId);

                if (error) throw error;

                set({
                    templates: get().templates.filter(t => t.id !== templateId),
                    selectedTemplate: get().selectedTemplate?.id === templateId ? null : get().selectedTemplate,
                });

                return { success: true };
            } catch (error) {
                logger.error('Failed to delete template:', error);
                return { success: false, error: error.message };
            }
        },

        duplicateTemplate: async (templateId, newName) => {
            const template = get().templates.find(t => t.id === templateId);
            if (!template) return { success: false, error: 'Template not found' };

            return get().createTemplate({
                name: newName || `${template.name} (Copy)`,
                subject: template.subject,
                body_html: template.body_html,
                body_text: template.body_text,
                category: template.category,
                is_shared: false, // Duplicates are always private initially
            });
        },

        // ============================================================
        // TEMPLATE USAGE
        // ============================================================

        // Apply a template with context data
        applyTemplate: async (templateId, context = {}) => {
            const template = await get().getTemplate(templateId);
            if (!template) return null;

            // Increment use count
            await supabase
                .from('email_templates')
                .update({
                    use_count: template.use_count + 1,
                    last_used_at: new Date().toISOString(),
                })
                .eq('id', templateId);

            // Update local state
            set({
                templates: get().templates.map(t =>
                    t.id === templateId
                        ? { ...t, use_count: t.use_count + 1, last_used_at: new Date().toISOString() }
                        : t
                ),
            });

            // Apply variables
            return {
                subject: applyTemplateVariables(template.subject, context),
                body_html: applyTemplateVariables(template.body_html, context),
                body_text: applyTemplateVariables(template.body_text, context),
                template,
            };
        },

        // Get popular templates
        getPopularTemplates: (limit = 5) => {
            return [...get().templates]
                .sort((a, b) => b.use_count - a.use_count)
                .slice(0, limit);
        },

        // Get templates by category
        getTemplatesByCategory: (category) => {
            return get().templates.filter(t => t.category === category);
        },

        // Get recent templates
        getRecentTemplates: (limit = 5) => {
            return [...get().templates]
                .filter(t => t.last_used_at)
                .sort((a, b) => new Date(b.last_used_at) - new Date(a.last_used_at))
                .slice(0, limit);
        },

        // ============================================================
        // FILTERS & SELECTION
        // ============================================================

        setSelectedTemplate: (template) => {
            set({ selectedTemplate: template });
        },

        setCategoryFilter: (category) => {
            set({ categoryFilter: category });
        },

        setSearchQuery: (query) => {
            set({ searchQuery: query });
        },

        setShowSharedOnly: (value) => {
            set({ showSharedOnly: value });
        },

        // Get filtered templates
        getFilteredTemplates: () => {
            const { templates, categoryFilter, searchQuery, showSharedOnly } = get();

            return templates.filter(template => {
                // Category filter
                if (categoryFilter && template.category !== categoryFilter) return false;

                // Shared filter
                if (showSharedOnly && !template.is_shared) return false;

                // Search filter
                if (searchQuery) {
                    const search = searchQuery.toLowerCase();
                    const nameMatch = template.name?.toLowerCase().includes(search);
                    const subjectMatch = template.subject?.toLowerCase().includes(search);
                    const bodyMatch = template.body_text?.toLowerCase().includes(search) ||
                                     template.body_html?.toLowerCase().includes(search);
                    if (!nameMatch && !subjectMatch && !bodyMatch) return false;
                }

                return true;
            });
        },

        // ============================================================
        // CLEANUP
        // ============================================================

        reset: () => {
            set({
                templates: [],
                selectedTemplate: null,
                isLoading: false,
                isSaving: false,
                error: null,
                categoryFilter: null,
                searchQuery: '',
                showSharedOnly: false,
            });
        },
    }))
);

export default useEmailTemplateStore;
