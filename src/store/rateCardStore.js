import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { SEED_ITEMS } from '../data/rateCardSeed';

const RATE_CARD_KEY = 'tell_rate_card';
const RATE_CARD_SECTIONS_KEY = 'tell_rate_card_sections';

// Default structure for regional pricing (legacy)
const createEmptyPricing = () => ({
    MALAYSIA: { cost: 0, charge: 0 },
    SEA: { cost: 0, charge: 0 },
    GULF: { cost: 0, charge: 0 },
    CENTRAL_ASIA: { cost: 0, charge: 0 },
});

// New structure for per-region, per-field currency pricing
// Example: { GULF: { cost: { amount: 500, baseCurrency: 'GBP' }, charge: { amount: 750, baseCurrency: 'USD' } } }
const createEmptyCurrencyPricing = () => ({});

// Default sections - synced with Quote subsections
const DEFAULT_SECTIONS = [
    // Production Team subsections
    { id: 'prod_production', name: 'Production', group: 'Production Team' },
    { id: 'prod_technical', name: 'Technical Crew', group: 'Production Team' },
    { id: 'prod_management', name: 'Production Management', group: 'Production Team' },
    // Production Equipment subsections
    { id: 'equip_video', name: 'Video', group: 'Production Equipment' },
    { id: 'equip_audio', name: 'Audio', group: 'Production Equipment' },
    { id: 'equip_cameras', name: 'Cameras', group: 'Production Equipment' },
    { id: 'equip_graphics', name: 'Graphics', group: 'Production Equipment' },
    { id: 'equip_vt', name: 'VT', group: 'Production Equipment' },
    { id: 'equip_cabling', name: 'Cabling', group: 'Production Equipment' },
    { id: 'equip_other', name: 'Other Equipment', group: 'Production Equipment' },
    // Flat sections
    { id: 'creative', name: 'Creative', group: 'Creative' },
    { id: 'logistics', name: 'Logistics', group: 'Logistics' },
    { id: 'expenses', name: 'Expenses', group: 'Expenses' },
];

// Load from localStorage (cache/fallback)
function loadRateCardLocal() {
    try {
        const saved = localStorage.getItem(RATE_CARD_KEY);
        return saved ? JSON.parse(saved) : [];
    } catch (e) {
        return [];
    }
}

function loadSectionsLocal() {
    try {
        const saved = localStorage.getItem(RATE_CARD_SECTIONS_KEY);
        return saved ? JSON.parse(saved) : DEFAULT_SECTIONS;
    } catch (e) {
        return DEFAULT_SECTIONS;
    }
}

function saveRateCardLocal(items) {
    try {
        localStorage.setItem(RATE_CARD_KEY, JSON.stringify(items));
    } catch (e) {
        console.error('Failed to save rate card locally:', e);
    }
}

function saveSectionsLocal(sections) {
    try {
        localStorage.setItem(RATE_CARD_SECTIONS_KEY, JSON.stringify(sections));
    } catch (e) {
        console.error('Failed to save sections locally:', e);
    }
}

function generateId() {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
}

export const useRateCardStore = create(
    subscribeWithSelector((set, get) => ({
        items: loadRateCardLocal(),
        sections: loadSectionsLocal(),
        loading: false,

        // Initialize - load from Supabase (or localStorage fallback)
        initialize: async () => {
            // If Supabase not configured, just use localStorage data
            if (!isSupabaseConfigured()) {
                set({ loading: false });
                return;
            }

            set({ loading: true });
            try {
                // Load rate card items
                const { data: itemsData, error: itemsError } = await supabase
                    .from('rate_cards')
                    .select('*')
                    .order('created_at', { ascending: true });

                if (itemsError) throw itemsError;

                // Load sections
                const { data: sectionsData, error: sectionsError } = await supabase
                    .from('rate_card_sections')
                    .select('*')
                    .order('sort_order', { ascending: true });

                if (sectionsError) throw sectionsError;

                // Map DB format to app format
                const items = (itemsData || []).map(item => ({
                    id: item.id,
                    name: item.name,
                    description: item.description || '',
                    section: item.section,
                    unit: item.unit || 'day',
                    pricing: item.pricing || createEmptyPricing(),
                    currencyPricing: item.currency_pricing || createEmptyCurrencyPricing(),
                    createdAt: item.created_at,
                    updatedAt: item.updated_at,
                }));

                // Use sections from DB or defaults
                const sections = sectionsData && sectionsData.length > 0
                    ? sectionsData.map(s => ({ id: s.id, name: s.name, group: s.group_name || 'Other' }))
                    : DEFAULT_SECTIONS;

                // If no sections in DB, seed them
                if (!sectionsData || sectionsData.length === 0) {
                    for (let i = 0; i < DEFAULT_SECTIONS.length; i++) {
                        const s = DEFAULT_SECTIONS[i];
                        await supabase.from('rate_card_sections').upsert({
                            id: s.id,
                            name: s.name,
                            sort_order: i,
                            group_name: s.group,
                        });
                    }
                }

                saveRateCardLocal(items);
                saveSectionsLocal(sections);
                set({ items, sections, loading: false });
            } catch (e) {
                console.error('Failed to load rate card from DB:', e);
                set({ loading: false });
            }
        },

        // --- Sections Actions ---

        addSection: async (name) => {
            const newSection = {
                id: name.toLowerCase().replace(/\s+/g, '_') + '_' + Math.random().toString(36).substring(2, 7),
                name
            };

            set(state => {
                const sections = [...state.sections, newSection];
                saveSectionsLocal(sections);
                return { sections };
            });

            // Save to Supabase if configured
            if (isSupabaseConfigured()) {
                try {
                    await supabase.from('rate_card_sections').insert({
                        id: newSection.id,
                        name: newSection.name,
                        sort_order: get().sections.length,
                    });
                } catch (e) {
                    console.error('Failed to save section to DB:', e);
                }
            }

            return newSection;
        },

        deleteSection: async (sectionId) => {
            // Move items to 'extras' section
            const hasItems = get().items.some(item => item.section === sectionId);
            if (hasItems) {
                set(state => {
                    const items = state.items.map(item =>
                        item.section === sectionId
                            ? { ...item, section: 'extras', updatedAt: new Date().toISOString() }
                            : item
                    );
                    saveRateCardLocal(items);

                    // Update items in DB if configured
                    if (isSupabaseConfigured()) {
                        items.filter(i => i.section === 'extras').forEach(item => {
                            supabase.from('rate_cards').update({ section: 'extras' }).eq('id', item.id);
                        });
                    }

                    return { items };
                });
            }

            set(state => {
                const sections = state.sections.filter(s => s.id !== sectionId);
                saveSectionsLocal(sections);
                return { sections };
            });

            // Delete from Supabase if configured
            if (isSupabaseConfigured()) {
                try {
                    await supabase.from('rate_card_sections').delete().eq('id', sectionId);
                } catch (e) {
                    console.error('Failed to delete section from DB:', e);
                }
            }
        },

        renameSection: async (sectionId, newName) => {
            set(state => {
                const sections = state.sections.map(s =>
                    s.id === sectionId ? { ...s, name: newName } : s
                );
                saveSectionsLocal(sections);
                return { sections };
            });

            // Update in Supabase if configured
            if (isSupabaseConfigured()) {
                try {
                    await supabase.from('rate_card_sections').update({ name: newName }).eq('id', sectionId);
                } catch (e) {
                    console.error('Failed to rename section in DB:', e);
                }
            }
        },

        moveSection: async (sectionId, direction) => {
            set(state => {
                const sections = [...state.sections];
                const index = sections.findIndex(s => s.id === sectionId);
                if (index === -1) return state;

                const newIndex = direction === 'up' ? index - 1 : index + 1;
                if (newIndex < 0 || newIndex >= sections.length) return state;

                [sections[index], sections[newIndex]] = [sections[newIndex], sections[index]];
                saveSectionsLocal(sections);

                // Update sort_order in DB if configured
                if (isSupabaseConfigured()) {
                    sections.forEach((s, i) => {
                        supabase.from('rate_card_sections').update({ sort_order: i }).eq('id', s.id);
                    });
                }

                return { sections };
            });
        },

        // --- Items Actions ---

        addItem: async (itemData) => {
            const newItem = {
                id: generateId(),
                name: itemData.name || '',
                description: itemData.description || '',
                section: itemData.section || 'extras',
                unit: itemData.unit || 'day',
                pricing: itemData.pricing || createEmptyPricing(),
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            };

            // Save to Supabase first to get UUID (if configured)
            if (isSupabaseConfigured()) {
                try {
                    const { data, error } = await supabase
                        .from('rate_cards')
                        .insert({
                            name: newItem.name,
                            description: newItem.description,
                            section: newItem.section,
                            unit: newItem.unit,
                            pricing: newItem.pricing,
                        })
                        .select()
                        .single();

                    if (error) throw error;
                    newItem.id = data.id;
                } catch (e) {
                    console.error('Failed to save item to DB:', e);
                }
            }

            set(state => {
                const items = [...state.items, newItem];
                saveRateCardLocal(items);
                return { items };
            });

            return newItem;
        },

        updateItem: async (itemId, updates) => {
            set(state => {
                const items = state.items.map(item =>
                    item.id === itemId
                        ? { ...item, ...updates, updatedAt: new Date().toISOString() }
                        : item
                );
                saveRateCardLocal(items);
                return { items };
            });

            // Update in Supabase if configured
            if (isSupabaseConfigured()) {
                try {
                    const dbUpdates = {};
                    if (updates.name !== undefined) dbUpdates.name = updates.name;
                    if (updates.description !== undefined) dbUpdates.description = updates.description;
                    if (updates.section !== undefined) dbUpdates.section = updates.section;
                    if (updates.unit !== undefined) dbUpdates.unit = updates.unit;
                    if (updates.pricing !== undefined) dbUpdates.pricing = updates.pricing;

                    if (Object.keys(dbUpdates).length > 0) {
                        await supabase.from('rate_cards').update(dbUpdates).eq('id', itemId);
                    }
                } catch (e) {
                    console.error('Failed to update item in DB:', e);
                }
            }
        },

        updateItemPricing: async (itemId, region, pricing) => {
            let updatedItem = null;

            set(state => {
                const items = state.items.map(item => {
                    if (item.id !== itemId) return item;
                    updatedItem = {
                        ...item,
                        pricing: {
                            ...item.pricing,
                            [region]: { ...item.pricing[region], ...pricing },
                        },
                        updatedAt: new Date().toISOString(),
                    };
                    return updatedItem;
                });
                saveRateCardLocal(items);
                return { items };
            });

            // Update in Supabase if configured
            if (isSupabaseConfigured() && updatedItem) {
                try {
                    await supabase
                        .from('rate_cards')
                        .update({ pricing: updatedItem.pricing })
                        .eq('id', itemId);
                } catch (e) {
                    console.error('Failed to update pricing in DB:', e);
                }
            }
        },

        // Update per-region, per-field currency pricing
        updateItemCurrencyPricing: async (itemId, regionId, field, amount, currency) => {
            let updatedItem = null;

            set(state => {
                const items = state.items.map(item => {
                    if (item.id !== itemId) return item;

                    const currentRegionPricing = item.currencyPricing?.[regionId] || {};

                    updatedItem = {
                        ...item,
                        currencyPricing: {
                            ...(item.currencyPricing || {}),
                            [regionId]: {
                                ...currentRegionPricing,
                                [field]: { amount: parseFloat(amount) || 0, baseCurrency: currency },
                            },
                        },
                        updatedAt: new Date().toISOString(),
                    };
                    return updatedItem;
                });
                saveRateCardLocal(items);
                return { items };
            });

            // Update in Supabase if configured
            if (isSupabaseConfigured() && updatedItem) {
                try {
                    await supabase
                        .from('rate_cards')
                        .update({ currency_pricing: updatedItem.currencyPricing })
                        .eq('id', itemId);
                } catch (e) {
                    console.error('Failed to update currency pricing in DB:', e);
                }
            }
        },

        deleteItem: async (itemId) => {
            set(state => {
                const items = state.items.filter(item => item.id !== itemId);
                saveRateCardLocal(items);
                return { items };
            });

            // Delete from Supabase if configured
            if (isSupabaseConfigured()) {
                try {
                    await supabase.from('rate_cards').delete().eq('id', itemId);
                } catch (e) {
                    console.error('Failed to delete item from DB:', e);
                }
            }
        },

        getItemsBySection: (sectionId) => {
            return get().items.filter(item => item.section === sectionId);
        },

        searchItems: (query) => {
            const q = query.toLowerCase();
            return get().items.filter(item =>
                item.name.toLowerCase().includes(q) ||
                item.description.toLowerCase().includes(q)
            );
        },

        duplicateItem: (itemId) => {
            const item = get().items.find(i => i.id === itemId);
            if (!item) return null;

            return get().addItem({
                ...item,
                name: `${item.name} (Copy)`,
            });
        },

        // Seed rate card with default items
        seedRateCard: async () => {
            const existingNames = new Set(get().items.map(i => i.name.toLowerCase()));
            const newItems = SEED_ITEMS
                .filter(item => !existingNames.has(item.name.toLowerCase()))
                .map(item => ({
                    ...item,
                    id: generateId(),
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                }));

            if (newItems.length === 0) {
                return { success: true, added: 0, message: 'All items already exist' };
            }

            // Save to Supabase if configured
            if (isSupabaseConfigured()) {
                try {
                    const dbItems = newItems.map(item => ({
                        name: item.name,
                        description: item.description,
                        section: item.section,
                        unit: item.unit,
                        pricing: item.pricing,
                    }));

                    const { data, error } = await supabase
                        .from('rate_cards')
                        .insert(dbItems)
                        .select();

                    if (error) throw error;

                    // Update IDs from DB
                    if (data) {
                        data.forEach((dbItem, i) => {
                            if (newItems[i]) newItems[i].id = dbItem.id;
                        });
                    }
                } catch (e) {
                    console.error('Failed to seed rate card to DB:', e);
                }
            }

            set(state => {
                const items = [...state.items, ...newItems];
                saveRateCardLocal(items);
                return { items };
            });

            // Reset sections to defaults
            set({ sections: DEFAULT_SECTIONS });
            saveSectionsLocal(DEFAULT_SECTIONS);

            return { success: true, added: newItems.length };
        },

        // Reset sections to sync with Quote subsections
        resetSectionsToDefaults: async () => {
            // Sync to Supabase if configured
            if (isSupabaseConfigured()) {
                try {
                    // Delete all existing sections from DB
                    await supabase.from('rate_card_sections').delete().neq('id', '');

                    // Insert new defaults
                    for (let i = 0; i < DEFAULT_SECTIONS.length; i++) {
                        const s = DEFAULT_SECTIONS[i];
                        await supabase.from('rate_card_sections').upsert({
                            id: s.id,
                            name: s.name,
                            sort_order: i,
                            group_name: s.group,
                        });
                    }
                } catch (e) {
                    console.error('Failed to reset sections in DB:', e);
                }
            }

            set({ sections: DEFAULT_SECTIONS });
            saveSectionsLocal(DEFAULT_SECTIONS);

            return { success: true };
        },

        // Import from CSV
        importFromCSV: async (file) => {
            try {
                const text = await file.text();
                const lines = text.split('\n');
                if (lines.length < 2) throw new Error('Invalid CSV format');

                const headers = lines[0].split(',').map(h => h.trim());
                const regions = ['MALAYSIA', 'SEA', 'GULF', 'CENTRAL_ASIA'];
                const getIdx = (name) => headers.indexOf(name);

                const newItems = [];
                const updatedItems = [];

                for (let i = 1; i < lines.length; i++) {
                    const line = lines[i].trim();
                    if (!line || line.startsWith('#')) continue;

                    // Parse CSV with quotes
                    const values = [];
                    let inQuote = false;
                    let currentVal = '';

                    for (let j = 0; j < line.length; j++) {
                        const char = line[j];
                        if (char === '"') {
                            if (inQuote && line[j + 1] === '"') {
                                currentVal += '"';
                                j++;
                            } else {
                                inQuote = !inQuote;
                            }
                        } else if (char === ',' && !inQuote) {
                            values.push(currentVal);
                            currentVal = '';
                        } else {
                            currentVal += char;
                        }
                    }
                    values.push(currentVal);

                    const item = {
                        id: values[getIdx('id')] || generateId(),
                        section: values[getIdx('section')] || 'extras',
                        name: values[getIdx('name')] || '',
                        description: values[getIdx('description')] || '',
                        unit: values[getIdx('unit')] || 'day',
                        pricing: createEmptyPricing(),
                        createdAt: new Date().toISOString(),
                        updatedAt: new Date().toISOString()
                    };

                    regions.forEach(r => {
                        const costIdx = getIdx(`${r}_cost`);
                        const chargeIdx = getIdx(`${r}_charge`);
                        if (costIdx !== -1 && chargeIdx !== -1) {
                            item.pricing[r] = {
                                cost: parseFloat(values[costIdx]) || 0,
                                charge: parseFloat(values[chargeIdx]) || 0
                            };
                        }
                    });

                    const exists = get().items.some(existing => existing.id === item.id);
                    if (exists) {
                        updatedItems.push(item);
                    } else {
                        newItems.push(item);
                    }
                }

                // Save to Supabase if configured
                if (isSupabaseConfigured()) {
                    // Save new items
                    if (newItems.length > 0) {
                        const dbItems = newItems.map(item => ({
                            name: item.name,
                            description: item.description,
                            section: item.section,
                            unit: item.unit,
                            pricing: item.pricing,
                        }));

                        const { data } = await supabase.from('rate_cards').insert(dbItems).select();
                        if (data) {
                            data.forEach((dbItem, i) => {
                                if (newItems[i]) newItems[i].id = dbItem.id;
                            });
                        }
                    }

                    // Update existing items
                    for (const item of updatedItems) {
                        await supabase.from('rate_cards').update({
                            name: item.name,
                            description: item.description,
                            section: item.section,
                            unit: item.unit,
                            pricing: item.pricing,
                        }).eq('id', item.id);
                    }
                }

                set(state => {
                    let items = [...state.items];
                    updatedItems.forEach(update => {
                        items = items.map(i => i.id === update.id ? update : i);
                    });
                    items = [...items, ...newItems];
                    saveRateCardLocal(items);
                    return { items };
                });

                return { success: true, count: newItems.length + updatedItems.length };
            } catch (e) {
                console.error('Failed to import CSV:', e);
                return { success: false, error: e.message };
            }
        },

        // Export to CSV
        exportToCSV: () => {
            const { items } = get();
            const regions = ['MALAYSIA', 'SEA', 'GULF', 'CENTRAL_ASIA'];

            const headers = ['id', 'section', 'name', 'description', 'unit'];
            regions.forEach(r => {
                headers.push(`${r}_cost`);
                headers.push(`${r}_charge`);
            });

            let csvContent = headers.join(',') + '\n';

            items.forEach(item => {
                const row = [
                    item.id,
                    item.section || '',
                    `"${(item.name || '').replace(/"/g, '""')}"`,
                    `"${(item.description || '').replace(/"/g, '""')}"`,
                    item.unit || 'day'
                ];

                regions.forEach(r => {
                    const price = item.pricing?.[r] || { cost: 0, charge: 0 };
                    row.push(price.cost || 0);
                    row.push(price.charge || 0);
                });

                csvContent += row.join(',') + '\n';
            });

            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `rate-card-${new Date().toISOString().split('T')[0]}.csv`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        },

        // Export template
        exportTemplate: () => {
            const regions = ['MALAYSIA', 'SEA', 'GULF', 'CENTRAL_ASIA'];
            const { sections } = get();

            const headers = ['id', 'section', 'name', 'description', 'unit'];
            regions.forEach(r => {
                headers.push(`${r}_cost`);
                headers.push(`${r}_charge`);
            });

            let csvContent = headers.join(',') + '\n';
            csvContent += '# INSTRUCTIONS: Fill in your services below. Delete example rows before importing.\n';
            csvContent += '# Leave "id" empty for new items. Unit options: day, item, project\n';
            csvContent += `# Available sections: ${sections.map(s => s.id + ' (' + s.name + ')').join(', ')}\n`;
            csvContent += '#\n';

            sections.slice(0, 3).forEach((section, idx) => {
                const baseCost = 100 + (idx * 50);
                const baseCharge = baseCost * 1.5;
                csvContent += `,${section.id},"Example ${section.name} Item","Description here",day,${baseCost},${baseCharge},${baseCost * 1.2},${baseCharge * 1.2},${baseCost * 1.5},${baseCharge * 1.5},${baseCost * 1.3},${baseCharge * 1.3}\n`;
            });

            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `rate-card-template.csv`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        },
    }))
);
