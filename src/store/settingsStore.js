import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

const SETTINGS_KEY = 'tell_settings';

// Default settings
const defaultSettings = {
    // Company details
    company: {
        name: '',
        address: '',
        city: '',
        country: 'Malaysia',
        phone: '',
        email: '',
        website: '',
        logo: null, // Base64 or URL
    },
    // Tax & Legal
    taxInfo: {
        taxNumber: '',
        registrationNumber: '',
        licenses: '',
    },
    // Bank details
    bankDetails: {
        bankName: '',
        accountName: '',
        accountNumber: '',
        swiftCode: '',
        currency: 'MYR',
    },
    // Quote defaults
    quoteDefaults: {
        validityDays: 30,
        paymentTerms: '50% deposit on confirmation, balance on completion',
        termsAndConditions: `• This quote is valid for 30 days from the date of issue.
• 50% deposit required upon confirmation.
• Final payment due within 14 days of project completion.
• Any additional requirements may incur extra charges.
• Cancellation within 7 days of project start may incur fees.`,
    },
    // Users/Salespeople
    users: [
        { id: 'default', name: 'Tom', email: '', role: 'admin' }
    ],
    // What to show on PDF
    pdfOptions: {
        showCompanyAddress: true,
        showCompanyPhone: true,
        showCompanyEmail: true,
        showTaxNumber: false,
        showBankDetails: false,
        showLogo: true,
    },
};

// Load settings from localStorage
function loadSettings() {
    try {
        const saved = localStorage.getItem(SETTINGS_KEY);
        if (saved) {
            const parsed = JSON.parse(saved);
            // Merge with defaults to ensure new fields are available
            return {
                ...defaultSettings,
                ...parsed,
                company: { ...defaultSettings.company, ...parsed.company },
                taxInfo: { ...defaultSettings.taxInfo, ...parsed.taxInfo },
                bankDetails: { ...defaultSettings.bankDetails, ...parsed.bankDetails },
                quoteDefaults: { ...defaultSettings.quoteDefaults, ...parsed.quoteDefaults },
                pdfOptions: { ...defaultSettings.pdfOptions, ...parsed.pdfOptions },
                users: parsed.users || defaultSettings.users,
            };
        }
        return defaultSettings;
    } catch (e) {
        console.error('Failed to load settings:', e);
        return defaultSettings;
    }
}

// Save settings to localStorage
function saveSettings(settings) {
    try {
        localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    } catch (e) {
        console.error('Failed to save settings:', e);
    }
}

export const useSettingsStore = create(
    subscribeWithSelector((set, get) => ({
        settings: loadSettings(),

        // Initialize
        initialize: () => {
            set({ settings: loadSettings() });
        },

        // Update company info
        setCompanyInfo: (company) => {
            set(state => {
                const updated = {
                    ...state.settings,
                    company: { ...state.settings.company, ...company },
                };
                saveSettings(updated);
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
                saveSettings(updated);
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
                saveSettings(updated);
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
                saveSettings(updated);
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
                saveSettings(updated);
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
                saveSettings(updated);
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
                saveSettings(updated);
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
                saveSettings(updated);
                return { settings: updated };
            });
        },

        // Get user by ID
        getUser: (userId) => {
            return get().settings.users.find(u => u.id === userId);
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
            saveSettings(defaultSettings);
        },
    }))
);
