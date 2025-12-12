import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

const RATE_CARD_KEY = 'tell_rate_card';
const RATE_CARD_SECTIONS_KEY = 'tell_rate_card_sections';

// Default structure for regional pricing
const createEmptyPricing = () => ({
    MALAYSIA: { cost: 0, charge: 0 },
    SEA: { cost: 0, charge: 0 },
    GULF: { cost: 0, charge: 0 },
    CENTRAL_ASIA: { cost: 0, charge: 0 },
});

// Default sections
// Default sections
const DEFAULT_SECTIONS = [
    // Production Team
    { id: 'prod_production', name: 'Production (Team)' },
    { id: 'prod_technical', name: 'Technical Crew' },
    { id: 'prod_management', name: 'Production Management' },

    // Production Equipment
    { id: 'equip_video', name: 'Video Equipment' },
    { id: 'equip_audio', name: 'Audio Equipment' },
    { id: 'equip_cameras', name: 'Cameras' },
    { id: 'equip_graphics', name: 'Graphics Equipment' },
    { id: 'equip_vt', name: 'VT & Replay' },
    { id: 'equip_cabling', name: 'Cabling & Infrastructure' },
    { id: 'equip_other', name: 'Other Equipment' },

    // Core Services
    { id: 'creative', name: 'Creative Services' },
    { id: 'logistics', name: 'Logistics' },
    { id: 'expenses', name: 'Expenses' },
];

// Load functions
function loadRateCard() {
    try {
        const saved = localStorage.getItem(RATE_CARD_KEY);
        return saved ? JSON.parse(saved) : [];
    } catch (e) {
        console.error('Failed to load rate card:', e);
        return [];
    }
}

function loadSections() {
    try {
        const saved = localStorage.getItem(RATE_CARD_SECTIONS_KEY);
        return saved ? JSON.parse(saved) : DEFAULT_SECTIONS;
    } catch (e) {
        console.error('Failed to load sections:', e);
        return DEFAULT_SECTIONS;
    }
}

// Save functions
function saveRateCard(items) {
    try {
        localStorage.setItem(RATE_CARD_KEY, JSON.stringify(items));
    } catch (e) {
        console.error('Failed to save rate card:', e);
    }
}

function saveSections(sections) {
    try {
        localStorage.setItem(RATE_CARD_SECTIONS_KEY, JSON.stringify(sections));
    } catch (e) {
        console.error('Failed to save sections:', e);
    }
}

// Generate unique ID
function generateId() {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
}

export const useRateCardStore = create(
    subscribeWithSelector((set, get) => ({
        // State
        items: loadRateCard(),
        sections: loadSections(),

        // Initialize
        initialize: () => {
            set({
                items: loadRateCard(),
                sections: loadSections()
            });
        },

        // --- Sections Actions ---

        addSection: (name) => {
            const newSection = {
                id: name.toLowerCase().replace(/\s+/g, '_') + '_' + Math.random().toString(36).substring(2, 7),
                name
            };

            set(state => {
                const sections = [...state.sections, newSection];
                saveSections(sections);
                return { sections };
            });

            return newSection;
        },

        deleteSection: (sectionId) => {
            // Check if section has items
            const hasItems = get().items.some(item => item.section === sectionId);
            if (hasItems) {
                // Move items to 'other' or throw? Let's just warn or require empty
                // Ideally we should reassign items to 'other'
                set(state => {
                    const items = state.items.map(item =>
                        item.section === sectionId ? { ...item, section: 'other', updatedAt: new Date().toISOString() } : item
                    );
                    saveRateCard(items);
                    return { items };
                });
            }

            set(state => {
                const sections = state.sections.filter(s => s.id !== sectionId);
                saveSections(sections);
                return { sections };
            });
        },

        // --- Items Actions ---

        // Add new item
        addItem: (itemData) => {
            const newItem = {
                id: generateId(),
                name: itemData.name || '',
                description: itemData.description || '',
                section: itemData.section || 'other',
                unit: itemData.unit || 'day', // day, item, project
                pricing: itemData.pricing || createEmptyPricing(),
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            };

            set(state => {
                const items = [...state.items, newItem];
                saveRateCard(items);
                return { items };
            });

            return newItem;
        },

        // Update item
        updateItem: (itemId, updates) => {
            set(state => {
                const items = state.items.map(item =>
                    item.id === itemId
                        ? { ...item, ...updates, updatedAt: new Date().toISOString() }
                        : item
                );
                saveRateCard(items);
                return { items };
            });
        },

        // Update item pricing for a region
        updateItemPricing: (itemId, region, pricing) => {
            set(state => {
                const items = state.items.map(item => {
                    if (item.id !== itemId) return item;
                    return {
                        ...item,
                        pricing: {
                            ...item.pricing,
                            [region]: { ...item.pricing[region], ...pricing },
                        },
                        updatedAt: new Date().toISOString(),
                    };
                });
                saveRateCard(items);
                return { items };
            });
        },

        // Delete item
        deleteItem: (itemId) => {
            set(state => {
                const items = state.items.filter(item => item.id !== itemId);
                saveRateCard(items);
                return { items };
            });
        },

        // Get items by section
        getItemsBySection: (sectionId) => {
            return get().items.filter(item => item.section === sectionId);
        },

        // Search items
        searchItems: (query) => {
            const q = query.toLowerCase();
            return get().items.filter(item =>
                item.name.toLowerCase().includes(q) ||
                item.description.toLowerCase().includes(q)
            );
        },

        // Duplicate item
        duplicateItem: (itemId) => {
            const item = get().items.find(i => i.id === itemId);
            if (!item) return null;

            return get().addItem({
                ...item,
                name: `${item.name} (Copy)`,
            });
        },

        // Import items from JSON
        importItems: async (file) => {
            try {
                const text = await file.text();
                const data = JSON.parse(text);

                if (!Array.isArray(data)) {
                    throw new Error('Invalid format: expected array of items');
                }

                // Merge with existing items (skip duplicates by name)
                const existingNames = new Set(get().items.map(i => i.name.toLowerCase()));
                const newItems = data.filter(item =>
                    item.name && !existingNames.has(item.name.toLowerCase())
                ).map(item => ({
                    ...item,
                    id: generateId(),
                    pricing: item.pricing || createEmptyPricing(),
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                }));

                set(state => {
                    const items = [...state.items, ...newItems];
                    saveRateCard(items);
                    return { items };
                });

                return { success: true, imported: newItems.length };
            } catch (e) {
                console.error('Failed to import items:', e);
                return { success: false, error: e.message };
            }
        },

        // Export items to JSON
        exportItems: () => {
            const { items } = get();
            const blob = new Blob([JSON.stringify(items, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `rate-card-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        },

        // Export template CSV for importing new items
        exportTemplate: () => {
            const regions = ['MALAYSIA', 'SEA', 'GULF', 'CENTRAL_ASIA'];
            const { sections } = get();

            // Headers must match import format exactly
            const headers = ['id', 'section', 'name', 'description', 'unit'];
            regions.forEach(r => {
                headers.push(`${r}_cost`);
                headers.push(`${r}_charge`);
            });

            let csvContent = headers.join(',') + '\n';

            // Add example rows showing available sections
            const sectionIds = sections.map(s => s.id);

            // Example row 1 - with section example
            csvContent += `,${sectionIds[0] || 'other'},"Example Service Name","Service description goes here",day,100,150,120,180,150,225,130,195\n`;

            // Example row 2 - another section
            if (sectionIds[1]) {
                csvContent += `,${sectionIds[1]},"Another Service","Another description",day,200,300,240,360,300,450,260,390\n`;
            }

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

        // Export items to CSV (for backup)
        exportToCSV: () => {
            const { items } = get();
            const regions = ['MALAYSIA', 'SEA', 'GULF', 'CENTRAL_ASIA'];

            // Header
            const headers = ['id', 'section', 'name', 'description', 'unit'];
            regions.forEach(r => {
                headers.push(`${r}_cost`);
                headers.push(`${r}_charge`);
            });

            let csvContent = headers.join(',') + '\n';

            // Rows
            items.forEach(item => {
                const row = [
                    item.id,
                    item.section || '',
                    `"${(item.name || '').replace(/"/g, '""')}"`, // Escape quotes
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

        // Import items from CSV
        importFromCSV: async (file) => {
            try {
                const text = await file.text();
                const lines = text.split('\n');
                if (lines.length < 2) throw new Error('Invalid CSV format');

                const headers = lines[0].split(',').map(h => h.trim());
                const regions = ['MALAYSIA', 'SEA', 'GULF', 'CENTRAL_ASIA'];

                // Helper to find index
                const getIdx = (name) => headers.indexOf(name);

                const newItems = [];
                const updatedItems = [];

                // Parse rows
                for (let i = 1; i < lines.length; i++) {
                    const line = lines[i].trim();
                    if (!line) continue;

                    // Simple CSV parser that handles quoted strings
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

                    // Create item object
                    const item = {
                        id: values[getIdx('id')] || generateId(),
                        section: values[getIdx('section')] || 'other',
                        name: values[getIdx('name')] || '',
                        description: values[getIdx('description')] || '',
                        unit: values[getIdx('unit')] || 'day',
                        pricing: createEmptyPricing(),
                        createdAt: new Date().toISOString(),
                        updatedAt: new Date().toISOString()
                    };

                    // Parse pricing
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

                    // If ID exists in store, it's an update, otherwise new
                    const exists = get().items.some(existing => existing.id === item.id);
                    if (exists) {
                        updatedItems.push(item);
                    } else {
                        newItems.push(item);
                    }
                }

                set(state => {
                    let items = [...state.items];

                    // Apply updates
                    updatedItems.forEach(update => {
                        items = items.map(i => i.id === update.id ? update : i);
                    });

                    // Add new
                    items = [...items, ...newItems];

                    saveRateCard(items);
                    return { items };
                });

                return { success: true, count: newItems.length + updatedItems.length };
            } catch (e) {
                console.error('Failed to import CSV:', e);
                return { success: false, error: e.message };
            }
        },
    }))
);
