import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { DEFAULT_TEMPLATE, MODULE_TYPES, PRESET_TEMPLATES } from '../data/invoiceModules';

const STORAGE_KEY = 'tell_invoice_templates';
const TEMPLATES_VERSION = 4; // Increment this when adding new preset templates

// Generate unique IDs for preset templates
function generatePresetTemplates() {
    return PRESET_TEMPLATES.map((template, index) => ({
        ...template,
        id: template.id === 'default' ? 'default' : `preset-${template.id}`,
        layout: template.layout.map((mod, modIndex) => ({
            ...mod,
            id: `${template.id}-mod-${modIndex}`,
        })),
    }));
}

// Load from localStorage
function loadTemplates() {
    try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            const parsed = JSON.parse(saved);
            // Check version - if outdated, merge in new presets
            if (parsed.version !== TEMPLATES_VERSION) {
                const presets = generatePresetTemplates();
                const existingIds = new Set(parsed.templates.map(t => t.id));
                const newTemplates = presets.filter(p => !existingIds.has(p.id));
                return {
                    templates: [...parsed.templates, ...newTemplates],
                    activeTemplateId: parsed.activeTemplateId,
                    version: TEMPLATES_VERSION,
                };
            }
            // Ensure default template exists
            if (!parsed.templates?.length) {
                return { templates: generatePresetTemplates(), activeTemplateId: 'default', version: TEMPLATES_VERSION };
            }
            return parsed;
        }
    } catch (e) {
        console.error('Failed to load invoice templates:', e);
    }
    return { templates: generatePresetTemplates(), activeTemplateId: 'default', version: TEMPLATES_VERSION };
}

// Save to localStorage
function saveTemplates(data) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...data, version: TEMPLATES_VERSION }));
    } catch (e) {
        console.error('Failed to save invoice templates:', e);
    }
}

// Generate unique ID
function generateId() {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
}

export const useInvoiceTemplateStore = create(
    subscribeWithSelector((set, get) => {
        const initial = loadTemplates();

        return {
            templates: initial.templates,
            activeTemplateId: initial.activeTemplateId,
            selectedModuleId: null,
            isDragging: false,

            // Get active template
            getActiveTemplate: () => {
                const { templates, activeTemplateId } = get();
                return templates.find(t => t.id === activeTemplateId) || templates[0];
            },

            // Set active template
            setActiveTemplate: (templateId) => {
                set({ activeTemplateId: templateId, selectedModuleId: null });
                saveTemplates({ templates: get().templates, activeTemplateId: templateId });
            },

            // Create new template
            createTemplate: (name, copyFrom = null) => {
                const { templates } = get();
                const sourceTemplate = copyFrom
                    ? templates.find(t => t.id === copyFrom)
                    : DEFAULT_TEMPLATE;

                const newTemplate = {
                    ...JSON.parse(JSON.stringify(sourceTemplate)),
                    id: generateId(),
                    name: name || 'New Template',
                    isDefault: false,
                    createdAt: Date.now(),
                    updatedAt: Date.now(),
                };

                // Generate new IDs for all modules
                newTemplate.layout = newTemplate.layout.map(mod => ({
                    ...mod,
                    id: generateId(),
                }));

                const updated = [...templates, newTemplate];
                set({ templates: updated, activeTemplateId: newTemplate.id });
                saveTemplates({ templates: updated, activeTemplateId: newTemplate.id });
                return newTemplate;
            },

            // Update template
            updateTemplate: (templateId, updates) => {
                const { templates } = get();
                const updated = templates.map(t =>
                    t.id === templateId
                        ? { ...t, ...updates, updatedAt: Date.now() }
                        : t
                );
                set({ templates: updated });
                saveTemplates({ templates: updated, activeTemplateId: get().activeTemplateId });
            },

            // Delete template
            deleteTemplate: (templateId) => {
                const { templates, activeTemplateId } = get();
                if (templates.length <= 1) return; // Keep at least one template

                const updated = templates.filter(t => t.id !== templateId);
                const newActiveId = activeTemplateId === templateId
                    ? updated[0].id
                    : activeTemplateId;

                set({ templates: updated, activeTemplateId: newActiveId, selectedModuleId: null });
                saveTemplates({ templates: updated, activeTemplateId: newActiveId });
            },

            // Duplicate template
            duplicateTemplate: (templateId) => {
                const { templates } = get();
                const source = templates.find(t => t.id === templateId);
                if (!source) return;

                return get().createTemplate(`${source.name} (Copy)`, templateId);
            },

            // Set as default
            setDefaultTemplate: (templateId) => {
                const { templates } = get();
                const updated = templates.map(t => ({
                    ...t,
                    isDefault: t.id === templateId,
                }));
                set({ templates: updated });
                saveTemplates({ templates: updated, activeTemplateId: get().activeTemplateId });
            },

            // Update page settings
            updatePageSettings: (settings) => {
                const { templates, activeTemplateId } = get();
                const updated = templates.map(t =>
                    t.id === activeTemplateId
                        ? {
                            ...t,
                            pageSettings: { ...t.pageSettings, ...settings },
                            updatedAt: Date.now()
                        }
                        : t
                );
                set({ templates: updated });
                saveTemplates({ templates: updated, activeTemplateId });
            },

            // Update global styles
            updateStyles: (styles) => {
                const { templates, activeTemplateId } = get();
                const updated = templates.map(t =>
                    t.id === activeTemplateId
                        ? {
                            ...t,
                            styles: { ...t.styles, ...styles },
                            updatedAt: Date.now()
                        }
                        : t
                );
                set({ templates: updated });
                saveTemplates({ templates: updated, activeTemplateId });
            },

            // Select module
            selectModule: (moduleId) => {
                set({ selectedModuleId: moduleId });
            },

            // Add module to layout
            addModule: (moduleType, index = -1) => {
                const { templates, activeTemplateId } = get();
                const moduleDefinition = MODULE_TYPES[moduleType];
                if (!moduleDefinition) return;

                const newModule = {
                    id: generateId(),
                    type: moduleType,
                    width: moduleDefinition.defaultWidth,
                    config: Object.fromEntries(
                        Object.entries(moduleDefinition.configSchema).map(
                            ([key, schema]) => [key, schema.default]
                        )
                    ),
                };

                const updated = templates.map(t => {
                    if (t.id !== activeTemplateId) return t;

                    const layout = [...t.layout];
                    if (index >= 0 && index < layout.length) {
                        layout.splice(index, 0, newModule);
                    } else {
                        layout.push(newModule);
                    }

                    return { ...t, layout, updatedAt: Date.now() };
                });

                set({ templates: updated, selectedModuleId: newModule.id });
                saveTemplates({ templates: updated, activeTemplateId });
                return newModule;
            },

            // Remove module from layout
            removeModule: (moduleId) => {
                const { templates, activeTemplateId, selectedModuleId } = get();

                const updated = templates.map(t => {
                    if (t.id !== activeTemplateId) return t;
                    return {
                        ...t,
                        layout: t.layout.filter(m => m.id !== moduleId),
                        updatedAt: Date.now(),
                    };
                });

                set({
                    templates: updated,
                    selectedModuleId: selectedModuleId === moduleId ? null : selectedModuleId,
                });
                saveTemplates({ templates: updated, activeTemplateId });
            },

            // Update module config
            updateModuleConfig: (moduleId, config) => {
                const { templates, activeTemplateId } = get();

                const updated = templates.map(t => {
                    if (t.id !== activeTemplateId) return t;
                    return {
                        ...t,
                        layout: t.layout.map(m =>
                            m.id === moduleId
                                ? { ...m, config: { ...m.config, ...config } }
                                : m
                        ),
                        updatedAt: Date.now(),
                    };
                });

                set({ templates: updated });
                saveTemplates({ templates: updated, activeTemplateId });
            },

            // Update module width
            updateModuleWidth: (moduleId, width) => {
                const { templates, activeTemplateId } = get();

                const updated = templates.map(t => {
                    if (t.id !== activeTemplateId) return t;
                    return {
                        ...t,
                        layout: t.layout.map(m =>
                            m.id === moduleId ? { ...m, width } : m
                        ),
                        updatedAt: Date.now(),
                    };
                });

                set({ templates: updated });
                saveTemplates({ templates: updated, activeTemplateId });
            },

            // Reorder modules
            reorderModules: (fromIndex, toIndex) => {
                const { templates, activeTemplateId } = get();

                const updated = templates.map(t => {
                    if (t.id !== activeTemplateId) return t;

                    const layout = [...t.layout];
                    const [moved] = layout.splice(fromIndex, 1);
                    layout.splice(toIndex, 0, moved);

                    return { ...t, layout, updatedAt: Date.now() };
                });

                set({ templates: updated });
                saveTemplates({ templates: updated, activeTemplateId });
            },

            // Move module up/down
            moveModule: (moduleId, direction) => {
                const { templates, activeTemplateId } = get();
                const template = templates.find(t => t.id === activeTemplateId);
                if (!template) return;

                const index = template.layout.findIndex(m => m.id === moduleId);
                if (index === -1) return;

                const newIndex = direction === 'up' ? index - 1 : index + 1;
                if (newIndex < 0 || newIndex >= template.layout.length) return;

                get().reorderModules(index, newIndex);
            },

            // Duplicate module
            duplicateModule: (moduleId) => {
                const { templates, activeTemplateId } = get();
                const template = templates.find(t => t.id === activeTemplateId);
                if (!template) return;

                const moduleIndex = template.layout.findIndex(m => m.id === moduleId);
                const module = template.layout[moduleIndex];
                if (!module) return;

                const newModule = {
                    ...JSON.parse(JSON.stringify(module)),
                    id: generateId(),
                };

                const updated = templates.map(t => {
                    if (t.id !== activeTemplateId) return t;

                    const layout = [...t.layout];
                    layout.splice(moduleIndex + 1, 0, newModule);

                    return { ...t, layout, updatedAt: Date.now() };
                });

                set({ templates: updated, selectedModuleId: newModule.id });
                saveTemplates({ templates: updated, activeTemplateId });
            },

            // Set dragging state
            setDragging: (isDragging) => {
                set({ isDragging });
            },

            // Reset template to default
            resetTemplate: (templateId) => {
                const { templates, activeTemplateId } = get();

                const updated = templates.map(t => {
                    if (t.id !== templateId) return t;
                    return {
                        ...DEFAULT_TEMPLATE,
                        id: t.id,
                        name: t.name,
                        isDefault: t.isDefault,
                        createdAt: t.createdAt,
                        updatedAt: Date.now(),
                        layout: DEFAULT_TEMPLATE.layout.map(m => ({
                            ...m,
                            id: generateId(),
                        })),
                    };
                });

                set({ templates: updated, selectedModuleId: null });
                saveTemplates({ templates: updated, activeTemplateId });
            },

            // Export template as JSON
            exportTemplate: (templateId) => {
                const { templates } = get();
                const template = templates.find(t => t.id === templateId);
                if (!template) return;

                const blob = new Blob([JSON.stringify(template, null, 2)], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = `invoice-template-${template.name.replace(/\s+/g, '-').toLowerCase()}.json`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(url);
            },

            // Import template from JSON
            importTemplate: (jsonData) => {
                try {
                    const template = typeof jsonData === 'string' ? JSON.parse(jsonData) : jsonData;

                    // Validate structure
                    if (!template.layout || !Array.isArray(template.layout)) {
                        throw new Error('Invalid template structure');
                    }

                    const { templates } = get();
                    const newTemplate = {
                        ...template,
                        id: generateId(),
                        name: `${template.name} (Imported)`,
                        isDefault: false,
                        createdAt: Date.now(),
                        updatedAt: Date.now(),
                        layout: template.layout.map(m => ({
                            ...m,
                            id: generateId(),
                        })),
                    };

                    const updated = [...templates, newTemplate];
                    set({ templates: updated, activeTemplateId: newTemplate.id });
                    saveTemplates({ templates: updated, activeTemplateId: newTemplate.id });

                    return { success: true, template: newTemplate };
                } catch (e) {
                    return { success: false, error: e.message };
                }
            },
        };
    })
);
