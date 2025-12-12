import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { supabase } from '../lib/supabase';

const SETTINGS_KEY = 'tell_settings';

// Default settings
const defaultSettings = {
    company: {
        name: 'Tell Productions Sdn Bhd',
        address: '',
        city: '',
        country: 'Malaysia',
        phone: '',
        email: '',
        website: '',
        logo: null,
    },
    taxInfo: {
        taxNumber: '',
        registrationNumber: '',
        licenses: '',
    },
    bankDetails: {
        bankName: '',
        accountName: '',
        accountNumber: '',
        swiftCode: '',
        currency: 'MYR',
    },
    quoteDefaults: {
        validityDays: 30,
        paymentTerms: '50% deposit on confirmation, balance on completion',
        termsAndConditions: `• This quote is valid for 30 days from the date of issue.
• 50% deposit required upon confirmation.
• Final payment due within 14 days of project completion.
• Any additional requirements may incur extra charges.
• Cancellation within 7 days of project start may incur fees.`,
    },
    users: [
        { id: 'default', name: 'Tom', email: '', role: 'admin' }
    ],
    pdfOptions: {
        showCompanyAddress: true,
        showCompanyPhone: true,
        showCompanyEmail: true,
        showTaxNumber: false,
        showBankDetails: false,
        showLogo: true,
    },
    aiSettings: {
        anthropicKey: '',
        openaiKey: '',
    },
    projectTypes: [
        { id: 'broadcast', label: 'Broadcast' },
        { id: 'streaming', label: 'Streaming' },
        { id: 'graphics', label: 'Graphics' },
        { id: 'sports_presentation', label: 'Sports Presentation' },
        { id: 'technical_consultancy', label: 'Technical Management & Consultancy' },
        { id: 'other', label: 'Other' },
    ],
    regions: [
        { id: 'MALAYSIA', label: 'Malaysia', currency: 'MYR' },
        { id: 'SEA', label: 'South East Asia', currency: 'USD' },
        { id: 'GULF', label: 'Gulf States', currency: 'USD' },
        { id: 'CENTRAL_ASIA', label: 'Central Asia', currency: 'USD' },
    ],
};

// Load from localStorage (fallback)
function loadSettingsLocal() {
    try {
        const saved = localStorage.getItem(SETTINGS_KEY);
        if (saved) {
            const parsed = JSON.parse(saved);
            return mergeSettings(parsed);
        }
        return defaultSettings;
    } catch (e) {
        return defaultSettings;
    }
}

// Merge with defaults
function mergeSettings(parsed) {
    return {
        ...defaultSettings,
        ...parsed,
        company: { ...defaultSettings.company, ...parsed.company },
        taxInfo: { ...defaultSettings.taxInfo, ...parsed.taxInfo },
        bankDetails: { ...defaultSettings.bankDetails, ...parsed.bankDetails },
        quoteDefaults: { ...defaultSettings.quoteDefaults, ...parsed.quoteDefaults },
        pdfOptions: { ...defaultSettings.pdfOptions, ...parsed.pdfOptions },
        aiSettings: { ...defaultSettings.aiSettings, ...parsed.aiSettings },
        users: parsed.users || defaultSettings.users,
        projectTypes: parsed.projectTypes || defaultSettings.projectTypes,
        regions: parsed.regions || defaultSettings.regions,
    };
}

// Save to localStorage (cache)
function saveSettingsLocal(settings) {
    try {
        localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    } catch (e) {
        console.error('Failed to save settings locally:', e);
    }
}

// Database ID for settings (single row)
let settingsDbId = null;

// Save to Supabase
async function saveSettingsToDb(settings) {
    try {
        if (settingsDbId) {
            await supabase
                .from('settings')
                .update({
                    company: settings.company,
                    quote_defaults: settings.quoteDefaults,
                    terms_and_conditions: settings.quoteDefaults?.termsAndConditions || '',
                    users: settings.users,
                    ai_settings: settings.aiSettings,
                })
                .eq('id', settingsDbId);
        }
    } catch (e) {
        console.error('Failed to save settings to DB:', e);
    }
}

export const useSettingsStore = create(
    subscribeWithSelector((set, get) => ({
        settings: loadSettingsLocal(),
        loading: false,

        // Initialize - load from Supabase
        initialize: async () => {
            set({ loading: true });
            try {
                const { data, error } = await supabase
                    .from('settings')
                    .select('*')
                    .limit(1)
                    .single();

                if (error) throw error;

                if (data) {
                    settingsDbId = data.id;
                    const dbSettings = {
                        ...loadSettingsLocal(),
                        company: data.company || defaultSettings.company,
                        quoteDefaults: {
                            ...defaultSettings.quoteDefaults,
                            ...data.quote_defaults,
                            termsAndConditions: data.terms_and_conditions || defaultSettings.quoteDefaults.termsAndConditions,
                        },
                        users: data.users || defaultSettings.users,
                        aiSettings: data.ai_settings || defaultSettings.aiSettings,
                    };
                    const merged = mergeSettings(dbSettings);
                    saveSettingsLocal(merged);
                    set({ settings: merged, loading: false });
                } else {
                    set({ loading: false });
                }
            } catch (e) {
                console.error('Failed to load settings from DB:', e);
                set({ loading: false });
            }
        },

        // Update company info
        setCompanyInfo: (company) => {
            set(state => {
                const updated = {
                    ...state.settings,
                    company: { ...state.settings.company, ...company },
                };
                saveSettingsLocal(updated);
                saveSettingsToDb(updated);
                return { settings: updated };
            });
        },

        // Update tax info
        setTaxInfo: (taxInfo) => {
            set(state => {
                const updated = {
                    ...state.settings,
                    taxInfo: { ...state.settings.taxInfo, ...taxInfo },
                };
                saveSettingsLocal(updated);
                return { settings: updated };
            });
        },

        // Update bank details
        setBankDetails: (bankDetails) => {
            set(state => {
                const updated = {
                    ...state.settings,
                    bankDetails: { ...state.settings.bankDetails, ...bankDetails },
                };
                saveSettingsLocal(updated);
                return { settings: updated };
            });
        },

        // Update quote defaults
        setQuoteDefaults: (quoteDefaults) => {
            set(state => {
                const updated = {
                    ...state.settings,
                    quoteDefaults: { ...state.settings.quoteDefaults, ...quoteDefaults },
                };
                saveSettingsLocal(updated);
                saveSettingsToDb(updated);
                return { settings: updated };
            });
        },

        // Update PDF options
        setPdfOptions: (pdfOptions) => {
            set(state => {
                const updated = {
                    ...state.settings,
                    pdfOptions: { ...state.settings.pdfOptions, ...pdfOptions },
                };
                saveSettingsLocal(updated);
                return { settings: updated };
            });
        },

        // Update AI settings
        setAiSettings: (aiSettings) => {
            set(state => {
                const updated = {
                    ...state.settings,
                    aiSettings: { ...state.settings.aiSettings, ...aiSettings },
                };
                saveSettingsLocal(updated);
                saveSettingsToDb(updated);
                return { settings: updated };
            });
        },

        // Add user
        addUser: (user) => {
            set(state => {
                const newUser = {
                    id: `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
                    name: user.name || '',
                    email: user.email || '',
                    role: user.role || 'user',
                };
                const updated = {
                    ...state.settings,
                    users: [...state.settings.users, newUser],
                };
                saveSettingsLocal(updated);
                saveSettingsToDb(updated);
                return { settings: updated };
            });
        },

        // Update user
        updateUser: (userId, updates) => {
            set(state => {
                const updated = {
                    ...state.settings,
                    users: state.settings.users.map(u =>
                        u.id === userId ? { ...u, ...updates } : u
                    ),
                };
                saveSettingsLocal(updated);
                saveSettingsToDb(updated);
                return { settings: updated };
            });
        },

        // Delete user
        deleteUser: (userId) => {
            set(state => {
                const updated = {
                    ...state.settings,
                    users: state.settings.users.filter(u => u.id !== userId),
                };
                saveSettingsLocal(updated);
                saveSettingsToDb(updated);
                return { settings: updated };
            });
        },

        // Get user by ID
        getUser: (userId) => {
            return get().settings.users.find(u => u.id === userId);
        },

        // Project Types
        addProjectType: (label) => {
            set(state => {
                const id = label.toLowerCase().replace(/\s+/g, '_') + '_' + Math.random().toString(36).substring(2, 7);
                const updated = {
                    ...state.settings,
                    projectTypes: [...state.settings.projectTypes, { id, label }],
                };
                saveSettingsLocal(updated);
                return { settings: updated };
            });
        },

        updateProjectType: (id, label) => {
            set(state => {
                const updated = {
                    ...state.settings,
                    projectTypes: state.settings.projectTypes.map(pt =>
                        pt.id === id ? { ...pt, label } : pt
                    ),
                };
                saveSettingsLocal(updated);
                return { settings: updated };
            });
        },

        deleteProjectType: (id) => {
            set(state => {
                const updated = {
                    ...state.settings,
                    projectTypes: state.settings.projectTypes.filter(pt => pt.id !== id),
                };
                saveSettingsLocal(updated);
                return { settings: updated };
            });
        },

        moveProjectType: (id, direction) => {
            set(state => {
                const types = [...state.settings.projectTypes];
                const index = types.findIndex(t => t.id === id);
                if (index === -1) return state;
                const newIndex = direction === 'up' ? index - 1 : index + 1;
                if (newIndex < 0 || newIndex >= types.length) return state;
                [types[index], types[newIndex]] = [types[newIndex], types[index]];
                const updated = { ...state.settings, projectTypes: types };
                saveSettingsLocal(updated);
                return { settings: updated };
            });
        },

        // Regions
        addRegion: (label, currency = 'USD') => {
            set(state => {
                const id = label.toUpperCase().replace(/\s+/g, '_');
                const updated = {
                    ...state.settings,
                    regions: [...state.settings.regions, { id, label, currency }],
                };
                saveSettingsLocal(updated);
                return { settings: updated };
            });
        },

        updateRegion: (id, updates) => {
            set(state => {
                const updated = {
                    ...state.settings,
                    regions: state.settings.regions.map(r =>
                        r.id === id ? { ...r, ...updates } : r
                    ),
                };
                saveSettingsLocal(updated);
                return { settings: updated };
            });
        },

        deleteRegion: (id) => {
            set(state => {
                const updated = {
                    ...state.settings,
                    regions: state.settings.regions.filter(r => r.id !== id),
                };
                saveSettingsLocal(updated);
                return { settings: updated };
            });
        },

        moveRegion: (id, direction) => {
            set(state => {
                const regions = [...state.settings.regions];
                const index = regions.findIndex(r => r.id === id);
                if (index === -1) return state;
                const newIndex = direction === 'up' ? index - 1 : index + 1;
                if (newIndex < 0 || newIndex >= regions.length) return state;
                [regions[index], regions[newIndex]] = [regions[newIndex], regions[index]];
                const updated = { ...state.settings, regions };
                saveSettingsLocal(updated);
                return { settings: updated };
            });
        },

        // Export settings
        exportSettings: () => {
            const { settings } = get();
            const blob = new Blob([JSON.stringify(settings, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `settings-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        },

        // Reset to defaults
        resetSettings: () => {
            set({ settings: defaultSettings });
            saveSettingsLocal(defaultSettings);
        },
    }))
);
