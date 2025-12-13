import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import {
    encryptData,
    decryptData,
    encryptFields,
    decryptFields,
    showSecurityWarning,
    validateApiKeyFormat,
    logSecurityEvent
} from '../utils/encryption';

const SETTINGS_KEY = 'tell_settings';
const SENSITIVE_FIELDS = ['anthropicKey', 'openaiKey'];
const BANK_SENSITIVE_FIELDS = ['accountNumber', 'swiftCode'];

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
        // PDF Colors
        primaryColor: '#143642',    // Headers, section titles
        accentColor: '#0F8B8D',     // Accent elements
        lineColor: '#143642',       // All lines and borders
        textColor: '#374151',       // Body text
        mutedColor: '#6B7280',      // Secondary text
        backgroundColor: '#FFFFFF', // Page background
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
    // Opportunities page preferences (synced across devices)
    opsPreferences: {
        expandedCountries: {}, // { countryName: boolean }
        hiddenCountries: {},   // { countryName: boolean }
        dashboardCurrency: 'USD',
    },
    // Dashboard page preferences
    dashboardPreferences: {
        currency: 'USD',
        collapsedColumns: {},  // { statusId: boolean }
        pipelineMinimized: false,
    },
    // Quotes page preferences
    quotesPreferences: {
        displayCurrency: 'USD',
        sortBy: 'updatedAt',
        sortDir: 'desc',
    },
    // Clients page preferences
    clientsPreferences: {
        currency: 'USD',
    },
};

// Load from localStorage (fallback) with decryption
async function loadSettingsLocal() {
    try {
        const saved = localStorage.getItem(SETTINGS_KEY);
        if (saved) {
            const parsed = JSON.parse(saved);
            const merged = mergeSettings(parsed);

            // Decrypt sensitive fields
            if (merged.aiSettings) {
                merged.aiSettings = await decryptFields(merged.aiSettings, SENSITIVE_FIELDS);
            }

            if (merged.bankDetails) {
                merged.bankDetails = await decryptFields(merged.bankDetails, BANK_SENSITIVE_FIELDS);
            }

            return merged;
        }
        return defaultSettings;
    } catch (e) {
        console.error('Failed to load settings:', e);
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
        opsPreferences: { ...defaultSettings.opsPreferences, ...parsed.opsPreferences },
        dashboardPreferences: { ...defaultSettings.dashboardPreferences, ...parsed.dashboardPreferences },
        quotesPreferences: { ...defaultSettings.quotesPreferences, ...parsed.quotesPreferences },
        clientsPreferences: { ...defaultSettings.clientsPreferences, ...parsed.clientsPreferences },
        users: parsed.users || defaultSettings.users,
        projectTypes: parsed.projectTypes || defaultSettings.projectTypes,
        regions: parsed.regions || defaultSettings.regions,
    };
}

// Save to localStorage (cache) with encryption
async function saveSettingsLocal(settings) {
    try {
        // Clone settings to avoid mutating state
        const toSave = JSON.parse(JSON.stringify(settings));

        // Encrypt sensitive fields before saving
        if (toSave.aiSettings) {
            toSave.aiSettings = await encryptFields(toSave.aiSettings, SENSITIVE_FIELDS);
        }

        if (toSave.bankDetails) {
            toSave.bankDetails = await encryptFields(toSave.bankDetails, BANK_SENSITIVE_FIELDS);
        }

        localStorage.setItem(SETTINGS_KEY, JSON.stringify(toSave));
        logSecurityEvent('settings_saved', { encrypted: true });
    } catch (e) {
        console.error('Failed to save settings locally:', e);
    }
}

// Database ID for settings (single row)
let settingsDbId = null;

// Save to Supabase
async function saveSettingsToDb(settings) {
    if (!isSupabaseConfigured()) return;

    try {
        // Encrypt AI settings before saving to DB
        const aiSettingsToSave = await encryptFields(
            settings.aiSettings || {},
            SENSITIVE_FIELDS
        );

        if (settingsDbId) {
            await supabase
                .from('settings')
                .update({
                    company: settings.company,
                    quote_defaults: settings.quoteDefaults,
                    terms_and_conditions: settings.quoteDefaults?.termsAndConditions || '',
                    users: settings.users,
                    ai_settings: aiSettingsToSave,
                    ops_preferences: settings.opsPreferences,
                    dashboard_preferences: settings.dashboardPreferences,
                    quotes_preferences: settings.quotesPreferences,
                    clients_preferences: settings.clientsPreferences,
                })
                .eq('id', settingsDbId);

            logSecurityEvent('settings_synced_to_db', { encrypted: true });
        }
    } catch (e) {
        console.error('Failed to save settings to DB:', e);
    }
}

// Initialize with async load
let initialSettings = defaultSettings;
loadSettingsLocal().then(loaded => {
    initialSettings = loaded;
    useSettingsStore.setState({ settings: loaded, loading: false });
});

export const useSettingsStore = create(
    subscribeWithSelector((set, get) => ({
        settings: initialSettings,
        loading: true,

        // Initialize - load from Supabase (or localStorage fallback)
        initialize: async () => {
            // If Supabase not configured, just use localStorage data
            if (!isSupabaseConfigured()) {
                const localSettings = await loadSettingsLocal();
                set({ settings: localSettings, loading: false });
                return;
            }

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

                    // Decrypt AI settings from DB
                    const aiSettings = data.ai_settings
                        ? await decryptFields(data.ai_settings, SENSITIVE_FIELDS)
                        : defaultSettings.aiSettings;

                    const dbSettings = {
                        ...await loadSettingsLocal(),
                        company: data.company || defaultSettings.company,
                        quoteDefaults: {
                            ...defaultSettings.quoteDefaults,
                            ...data.quote_defaults,
                            termsAndConditions: data.terms_and_conditions || defaultSettings.quoteDefaults.termsAndConditions,
                        },
                        users: data.users || defaultSettings.users,
                        aiSettings,
                        opsPreferences: data.ops_preferences || defaultSettings.opsPreferences,
                        dashboardPreferences: data.dashboard_preferences || defaultSettings.dashboardPreferences,
                        quotesPreferences: data.quotes_preferences || defaultSettings.quotesPreferences,
                        clientsPreferences: data.clients_preferences || defaultSettings.clientsPreferences,
                    };

                    const merged = mergeSettings(dbSettings);
                    await saveSettingsLocal(merged);
                    set({ settings: merged, loading: false });
                } else {
                    const localSettings = await loadSettingsLocal();
                    set({ settings: localSettings, loading: false });
                }
            } catch (e) {
                console.error('Failed to load settings from DB:', e);
                const localSettings = await loadSettingsLocal();
                set({ settings: localSettings, loading: false });
            }
        },

        // Update company info
        setCompanyInfo: async (company) => {
            const state = get();
            const updated = {
                ...state.settings,
                company: { ...state.settings.company, ...company },
            };
            await saveSettingsLocal(updated);
            saveSettingsToDb(updated);
            set({ settings: updated });
        },

        // Update tax info
        setTaxInfo: async (taxInfo) => {
            const state = get();
            const updated = {
                ...state.settings,
                taxInfo: { ...state.settings.taxInfo, ...taxInfo },
            };
            await saveSettingsLocal(updated);
            set({ settings: updated });
        },

        // Update bank details (encrypted)
        setBankDetails: async (bankDetails) => {
            const state = get();
            const updated = {
                ...state.settings,
                bankDetails: { ...state.settings.bankDetails, ...bankDetails },
            };
            await saveSettingsLocal(updated);
            set({ settings: updated });

            logSecurityEvent('bank_details_updated', { encrypted: true });
        },

        // Update quote defaults
        setQuoteDefaults: async (quoteDefaults) => {
            const state = get();
            const updated = {
                ...state.settings,
                quoteDefaults: { ...state.settings.quoteDefaults, ...quoteDefaults },
            };
            await saveSettingsLocal(updated);
            saveSettingsToDb(updated);
            set({ settings: updated });
        },

        // Update PDF options
        setPdfOptions: async (pdfOptions) => {
            const state = get();
            const updated = {
                ...state.settings,
                pdfOptions: { ...state.settings.pdfOptions, ...pdfOptions },
            };
            await saveSettingsLocal(updated);
            set({ settings: updated });
        },

        // Update ops preferences (synced to Supabase for multi-device)
        setOpsPreferences: async (opsPreferences) => {
            const state = get();
            const updated = {
                ...state.settings,
                opsPreferences: { ...state.settings.opsPreferences, ...opsPreferences },
            };
            await saveSettingsLocal(updated);
            saveSettingsToDb(updated);
            set({ settings: updated });
        },

        // Update dashboard preferences (synced to Supabase for multi-device)
        setDashboardPreferences: async (dashboardPreferences) => {
            const state = get();
            const updated = {
                ...state.settings,
                dashboardPreferences: { ...state.settings.dashboardPreferences, ...dashboardPreferences },
            };
            await saveSettingsLocal(updated);
            saveSettingsToDb(updated);
            set({ settings: updated });
        },

        // Update quotes preferences (synced to Supabase for multi-device)
        setQuotesPreferences: async (quotesPreferences) => {
            const state = get();
            const updated = {
                ...state.settings,
                quotesPreferences: { ...state.settings.quotesPreferences, ...quotesPreferences },
            };
            await saveSettingsLocal(updated);
            saveSettingsToDb(updated);
            set({ settings: updated });
        },

        // Update clients preferences (synced to Supabase for multi-device)
        setClientsPreferences: async (clientsPreferences) => {
            const state = get();
            const updated = {
                ...state.settings,
                clientsPreferences: { ...state.settings.clientsPreferences, ...clientsPreferences },
            };
            await saveSettingsLocal(updated);
            saveSettingsToDb(updated);
            set({ settings: updated });
        },

        // Update AI settings (encrypted)
        setAiSettings: async (aiSettings) => {
            const state = get();

            // Validate API key formats and show warnings
            if (aiSettings.anthropicKey && !validateApiKeyFormat(aiSettings.anthropicKey, 'sk-ant-')) {
                showSecurityWarning('Invalid Anthropic API key format. Expected format: sk-ant-...');
            }

            if (aiSettings.openaiKey && !validateApiKeyFormat(aiSettings.openaiKey, 'sk-')) {
                showSecurityWarning('Invalid OpenAI API key format. Expected format: sk-...');
            }

            // Warn about client-side API keys
            if (aiSettings.anthropicKey || aiSettings.openaiKey) {
                showSecurityWarning(
                    'API keys are stored in browser localStorage (encrypted). ' +
                    'For production use, implement a backend proxy to keep keys secure on the server.'
                );
            }

            const updated = {
                ...state.settings,
                aiSettings: { ...state.settings.aiSettings, ...aiSettings },
            };

            await saveSettingsLocal(updated);
            saveSettingsToDb(updated);
            set({ settings: updated });

            logSecurityEvent('api_keys_updated', {
                hasAnthropicKey: !!aiSettings.anthropicKey,
                hasOpenaiKey: !!aiSettings.openaiKey,
                encrypted: true
            });
        },

        // Add user
        addUser: async (user) => {
            const state = get();
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
            await saveSettingsLocal(updated);
            saveSettingsToDb(updated);
            set({ settings: updated });
        },

        // Update user
        updateUser: async (userId, updates) => {
            const state = get();
            const updated = {
                ...state.settings,
                users: state.settings.users.map(u =>
                    u.id === userId ? { ...u, ...updates } : u
                ),
            };
            await saveSettingsLocal(updated);
            saveSettingsToDb(updated);
            set({ settings: updated });
        },

        // Delete user
        deleteUser: async (userId) => {
            const state = get();
            const updated = {
                ...state.settings,
                users: state.settings.users.filter(u => u.id !== userId),
            };
            await saveSettingsLocal(updated);
            saveSettingsToDb(updated);
            set({ settings: updated });
        },

        // Get user by ID
        getUser: (userId) => {
            return get().settings.users.find(u => u.id === userId);
        },

        // Project Types
        addProjectType: async (label) => {
            const state = get();
            const id = label.toLowerCase().replace(/\s+/g, '_') + '_' + Math.random().toString(36).substring(2, 7);
            const updated = {
                ...state.settings,
                projectTypes: [...state.settings.projectTypes, { id, label }],
            };
            await saveSettingsLocal(updated);
            set({ settings: updated });
        },

        updateProjectType: async (id, label) => {
            const state = get();
            const updated = {
                ...state.settings,
                projectTypes: state.settings.projectTypes.map(pt =>
                    pt.id === id ? { ...pt, label } : pt
                ),
            };
            await saveSettingsLocal(updated);
            set({ settings: updated });
        },

        deleteProjectType: async (id) => {
            const state = get();
            const updated = {
                ...state.settings,
                projectTypes: state.settings.projectTypes.filter(pt => pt.id !== id),
            };
            await saveSettingsLocal(updated);
            set({ settings: updated });
        },

        moveProjectType: async (id, direction) => {
            const state = get();
            const types = [...state.settings.projectTypes];
            const index = types.findIndex(t => t.id === id);
            if (index === -1) return;

            const newIndex = direction === 'up' ? index - 1 : index + 1;
            if (newIndex < 0 || newIndex >= types.length) return;

            [types[index], types[newIndex]] = [types[newIndex], types[index]];
            const updated = { ...state.settings, projectTypes: types };
            await saveSettingsLocal(updated);
            set({ settings: updated });
        },

        // Regions
        addRegion: async (label, currency = 'USD') => {
            const state = get();
            const id = label.toUpperCase().replace(/\s+/g, '_');
            const updated = {
                ...state.settings,
                regions: [...state.settings.regions, { id, label, currency }],
            };
            await saveSettingsLocal(updated);
            set({ settings: updated });
        },

        updateRegion: async (id, updates) => {
            const state = get();
            const updated = {
                ...state.settings,
                regions: state.settings.regions.map(r =>
                    r.id === id ? { ...r, ...updates } : r
                ),
            };
            await saveSettingsLocal(updated);
            set({ settings: updated });
        },

        deleteRegion: async (id) => {
            const state = get();
            const updated = {
                ...state.settings,
                regions: state.settings.regions.filter(r => r.id !== id),
            };
            await saveSettingsLocal(updated);
            set({ settings: updated });
        },

        moveRegion: async (id, direction) => {
            const state = get();
            const regions = [...state.settings.regions];
            const index = regions.findIndex(r => r.id === id);
            if (index === -1) return;

            const newIndex = direction === 'up' ? index - 1 : index + 1;
            if (newIndex < 0 || newIndex >= regions.length) return;

            [regions[index], regions[newIndex]] = [regions[newIndex], regions[index]];
            const updated = { ...state.settings, regions };
            await saveSettingsLocal(updated);
            set({ settings: updated });
        },

        // Export settings
        exportSettings: async () => {
            const { settings } = get();

            // Create a sanitized export (remove encrypted keys for security)
            const sanitized = {
                ...settings,
                aiSettings: {
                    anthropicKey: settings.aiSettings.anthropicKey ? '***REDACTED***' : '',
                    openaiKey: settings.aiSettings.openaiKey ? '***REDACTED***' : '',
                },
                bankDetails: {
                    ...settings.bankDetails,
                    accountNumber: settings.bankDetails.accountNumber ? '***REDACTED***' : '',
                    swiftCode: settings.bankDetails.swiftCode ? '***REDACTED***' : '',
                }
            };

            const blob = new Blob([JSON.stringify(sanitized, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `settings-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);

            logSecurityEvent('settings_exported', { sanitized: true });
        },

        // Reset to defaults
        resetSettings: async () => {
            set({ settings: defaultSettings });
            await saveSettingsLocal(defaultSettings);
        },
    }))
);
