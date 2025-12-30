/**
 * Centralized Configuration
 *
 * All environment variables, feature flags, and constants
 * should be accessed through this module.
 *
 * Benefits:
 * - Single source of truth for configuration
 * - Type-safe access to env vars
 * - Default values in one place
 * - Easy to mock in tests
 */

// Environment detection
export const ENV = {
    isDev: import.meta.env.DEV,
    isProd: import.meta.env.PROD,
    mode: import.meta.env.MODE,
};

// Supabase configuration
export const SUPABASE_CONFIG = {
    url: import.meta.env.VITE_SUPABASE_URL || '',
    anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY || '',
    isConfigured: !!(import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY),
};

// Stripe configuration
export const STRIPE_CONFIG = {
    isTestMode: ENV.isDev || import.meta.env.VITE_STRIPE_TEST_MODE === 'true',
    publishableKey: import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '',
};

// Sentry configuration
export const SENTRY_CONFIG = {
    dsn: import.meta.env.VITE_SENTRY_DSN || '',
    release: import.meta.env.VITE_APP_VERSION || '1.0.0',
    environment: import.meta.env.MODE,
    isConfigured: !!import.meta.env.VITE_SENTRY_DSN,
};

// Feature flags
export const FEATURES = {
    enableAI: import.meta.env.VITE_ENABLE_AI !== 'false',
    enableOfflineMode: import.meta.env.VITE_ENABLE_OFFLINE === 'true',
    enableBetaFeatures: import.meta.env.VITE_ENABLE_BETA === 'true',
    enableDebugLogging: ENV.isDev || import.meta.env.VITE_DEBUG === 'true',
};

// Cache TTLs (in milliseconds)
export const CACHE_TTL = {
    exchangeRates: 60 * 60 * 1000,      // 1 hour
    pricingInfo: 30 * 60 * 1000,        // 30 minutes
    userSession: 24 * 60 * 60 * 1000,   // 24 hours
    authRefresh: 5 * 60 * 1000,         // 5 minutes
};

// Rate limits
export const RATE_LIMITS = {
    authAttempts: 5,                    // Max failed login attempts
    authLockoutMinutes: 15,             // Lockout duration
    apiCallsPerMinute: 60,              // API rate limit
    autoSaveIntervalMs: 30 * 1000,      // 30 seconds
};

// Session configuration
export const SESSION_CONFIG = {
    durationMs: 24 * 60 * 60 * 1000,    // 24 hours
    extendThresholdMs: 5 * 60 * 1000,   // Extend if less than 5 min left
    activityDebounceMs: 5 * 60 * 1000,  // Min interval between extensions
};

// Trial configuration
export const TRIAL_CONFIG = {
    durationHours: 120,                 // 5 days
    graceHours: 24,                     // Grace period after trial
    reminderHours: [24, 6, 1],          // Hours before expiry to remind
};

// Pagination defaults
export const PAGINATION = {
    defaultPageSize: 20,
    maxPageSize: 100,
    clientsPerPage: 25,
    quotesPerPage: 20,
    auditLogsPerPage: 50,
};

// File upload limits
export const UPLOAD_LIMITS = {
    maxFileSizeMB: 10,
    maxImageSizeMB: 5,
    allowedImageTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    allowedDocTypes: ['application/pdf', 'text/csv'],
};

// Validation rules
export const VALIDATION = {
    password: {
        minLength: 8,
        requireUppercase: true,
        requireLowercase: true,
        requireNumber: true,
        requireSpecial: true,
    },
    email: {
        maxLength: 254,
    },
    name: {
        minLength: 2,
        maxLength: 100,
    },
    organization: {
        nameMinLength: 2,
        nameMaxLength: 100,
        slugMinLength: 3,
        slugMaxLength: 50,
    },
};

// External API endpoints
export const API_ENDPOINTS = {
    exchangeRates: 'https://api.exchangerate-api.com/v4/latest/USD',
    ipGeolocation: 'https://ipapi.co/json/',
};

// Local storage keys
export const STORAGE_KEYS = {
    authSession: 'productionos_auth_session',
    authSessionEncrypted: 'productionos_auth_session_enc',
    exchangeRates: 'exchange_rates_cache',
    pricingCache: 'pricing_cache',
    themePreference: 'theme_preference',
    onboardingProgress: 'onboarding_progress',
    recentClients: 'recent_clients',
    draftQuote: 'draft_quote',
};

// Broadcast channel names (for cross-tab sync)
export const BROADCAST_CHANNELS = {
    auth: 'auth_channel',
    settings: 'settings_channel',
    quotes: 'quotes_channel',
};

// Default values
export const DEFAULTS = {
    currency: 'USD',
    region: 'GLOBAL',
    timezone: 'UTC',
    locale: 'en-US',
    quotePrefix: 'Q',
    invoicePrefix: 'INV',
    projectPrefix: 'P',
};

// Get all config (useful for debugging)
export function getConfig() {
    return {
        ENV,
        SUPABASE_CONFIG: {
            ...SUPABASE_CONFIG,
            anonKey: SUPABASE_CONFIG.anonKey ? '[REDACTED]' : '',
        },
        STRIPE_CONFIG,
        SENTRY_CONFIG: {
            ...SENTRY_CONFIG,
            dsn: SENTRY_CONFIG.dsn ? '[REDACTED]' : '',
        },
        FEATURES,
        CACHE_TTL,
        RATE_LIMITS,
        SESSION_CONFIG,
        TRIAL_CONFIG,
    };
}

export default {
    ENV,
    SUPABASE_CONFIG,
    STRIPE_CONFIG,
    SENTRY_CONFIG,
    FEATURES,
    CACHE_TTL,
    RATE_LIMITS,
    SESSION_CONFIG,
    TRIAL_CONFIG,
    PAGINATION,
    UPLOAD_LIMITS,
    VALIDATION,
    API_ENDPOINTS,
    STORAGE_KEYS,
    BROADCAST_CHANNELS,
    DEFAULTS,
    getConfig,
};
