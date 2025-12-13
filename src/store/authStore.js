import { create } from 'zustand';
import { supabase, isSupabaseConfigured, useSupabaseAuth } from '../lib/supabase';
import { logSecurityEvent } from '../utils/encryption';

const AUTH_KEY = 'tell_auth_session';
const RATE_LIMIT_KEY = 'tell_auth_attempts';
const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes
const SESSION_DURATION = 24 * 60 * 60 * 1000; // 24 hours

// Backward compatibility: Support old password-based auth if Supabase not configured
const FALLBACK_PASSWORD = import.meta.env.VITE_APP_PASSWORD || '';

/**
 * Load authentication session from localStorage
 */
function loadAuthSession() {
    try {
        const saved = localStorage.getItem(AUTH_KEY);
        if (!saved) return null;

        const session = JSON.parse(saved);

        // Check if session has expired
        if (session.expiresAt && new Date(session.expiresAt) < new Date()) {
            localStorage.removeItem(AUTH_KEY);
            logSecurityEvent('session_expired', { email: session.email });
            return null;
        }

        return session;
    } catch (e) {
        console.error('Failed to load auth session:', e);
        return null;
    }
}

/**
 * Save authentication session to localStorage
 */
function saveAuthSession(session) {
    try {
        if (session) {
            localStorage.setItem(AUTH_KEY, JSON.stringify(session));
            logSecurityEvent('session_created', {
                email: session.email,
                expiresAt: session.expiresAt
            });
        } else {
            localStorage.removeItem(AUTH_KEY);
        }
    } catch (e) {
        console.error('Failed to save auth session:', e);
    }
}

/**
 * Rate limiting for login attempts
 */
function getRateLimitData() {
    try {
        const saved = localStorage.getItem(RATE_LIMIT_KEY);
        if (!saved) return { attempts: 0, lockedUntil: null };

        return JSON.parse(saved);
    } catch {
        return { attempts: 0, lockedUntil: null };
    }
}

function saveRateLimitData(data) {
    try {
        localStorage.setItem(RATE_LIMIT_KEY, JSON.stringify(data));
    } catch (e) {
        console.error('Failed to save rate limit data:', e);
    }
}

function isRateLimited() {
    const data = getRateLimitData();

    if (data.lockedUntil && new Date(data.lockedUntil) > new Date()) {
        return true;
    }

    if (data.lockedUntil && new Date(data.lockedUntil) <= new Date()) {
        // Lockout period expired, reset
        saveRateLimitData({ attempts: 0, lockedUntil: null });
        return false;
    }

    return data.attempts >= MAX_LOGIN_ATTEMPTS;
}

function recordLoginAttempt(success) {
    const data = getRateLimitData();

    if (success) {
        // Reset on successful login
        saveRateLimitData({ attempts: 0, lockedUntil: null });
        logSecurityEvent('login_success');
    } else {
        // Increment failed attempts
        const newAttempts = data.attempts + 1;
        const newData = { attempts: newAttempts, lockedUntil: null };

        if (newAttempts >= MAX_LOGIN_ATTEMPTS) {
            newData.lockedUntil = new Date(Date.now() + LOCKOUT_DURATION).toISOString();
            logSecurityEvent('account_locked', {
                attempts: newAttempts,
                lockedUntil: newData.lockedUntil
            });
        } else {
            logSecurityEvent('login_failed', {
                attempts: newAttempts,
                remaining: MAX_LOGIN_ATTEMPTS - newAttempts
            });
        }

        saveRateLimitData(newData);
    }
}

function getRemainingLockoutTime() {
    const data = getRateLimitData();
    if (!data.lockedUntil) return 0;

    const remaining = new Date(data.lockedUntil) - new Date();
    return Math.max(0, Math.ceil(remaining / 1000)); // seconds
}

export const useAuthStore = create((set, get) => ({
    isAuthenticated: !!loadAuthSession(),
    user: loadAuthSession(),
    error: null,
    isLoading: false,
    rateLimited: false,
    lockoutTimeRemaining: 0,

    /**
     * Initialize Supabase auth session (if configured)
     */
    initialize: async () => {
        if (!isSupabaseConfigured()) {
            // Fallback mode: password-based auth
            return;
        }

        try {
            // Check for existing Supabase session
            const { data: { session } } = await supabase.auth.getSession();

            if (session) {
                const authSession = {
                    email: session.user.email,
                    userId: session.user.id,
                    expiresAt: new Date(Date.now() + SESSION_DURATION).toISOString(),
                    provider: 'supabase',
                };

                saveAuthSession(authSession);
                set({
                    isAuthenticated: true,
                    user: authSession,
                    error: null
                });

                logSecurityEvent('session_restored', { email: session.user.email });
            }

            // Listen for auth changes
            supabase.auth.onAuthStateChange((event, session) => {
                if (event === 'SIGNED_IN' && session) {
                    const authSession = {
                        email: session.user.email,
                        userId: session.user.id,
                        expiresAt: new Date(Date.now() + SESSION_DURATION).toISOString(),
                        provider: 'supabase',
                    };

                    saveAuthSession(authSession);
                    set({
                        isAuthenticated: true,
                        user: authSession,
                        error: null
                    });
                } else if (event === 'SIGNED_OUT') {
                    saveAuthSession(null);
                    set({
                        isAuthenticated: false,
                        user: null,
                        error: null
                    });
                }
            });
        } catch (e) {
            console.error('Failed to initialize Supabase auth:', e);
        }
    },

    /**
     * Login with Supabase Auth (email/password)
     */
    loginWithSupabase: async (email, password) => {
        // Check rate limiting
        if (isRateLimited()) {
            const remaining = getRemainingLockoutTime();
            set({
                error: `Too many failed attempts. Account locked for ${Math.ceil(remaining / 60)} minutes.`,
                rateLimited: true,
                lockoutTimeRemaining: remaining,
            });
            return false;
        }

        set({ isLoading: true, error: null });

        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (error) {
                recordLoginAttempt(false);
                set({
                    error: error.message || 'Login failed',
                    isLoading: false
                });
                return false;
            }

            if (data.session) {
                recordLoginAttempt(true);

                const authSession = {
                    email: data.user.email,
                    userId: data.user.id,
                    expiresAt: new Date(Date.now() + SESSION_DURATION).toISOString(),
                    provider: 'supabase',
                };

                saveAuthSession(authSession);
                set({
                    isAuthenticated: true,
                    user: authSession,
                    error: null,
                    isLoading: false,
                });

                return true;
            }

            return false;
        } catch (e) {
            console.error('Supabase login error:', e);
            recordLoginAttempt(false);
            set({
                error: 'An error occurred during login',
                isLoading: false
            });
            return false;
        }
    },

    /**
     * Fallback: Login with password (for non-Supabase setups)
     * DEPRECATED: Use Supabase Auth instead
     */
    loginWithPassword: async (password) => {
        // Check rate limiting
        if (isRateLimited()) {
            const remaining = getRemainingLockoutTime();
            set({
                error: `Too many failed attempts. Try again in ${Math.ceil(remaining / 60)} minutes.`,
                rateLimited: true,
                lockoutTimeRemaining: remaining,
            });
            return false;
        }

        set({ isLoading: true, error: null });

        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 300));

        if (password === FALLBACK_PASSWORD) {
            recordLoginAttempt(true);

            const authSession = {
                email: 'local@tellproductions.com',
                userId: 'local-user',
                expiresAt: new Date(Date.now() + SESSION_DURATION).toISOString(),
                provider: 'password',
            };

            saveAuthSession(authSession);
            set({
                isAuthenticated: true,
                user: authSession,
                error: null,
                isLoading: false,
            });

            console.warn('⚠️ Using deprecated password-based auth. Please migrate to Supabase Auth.');
            logSecurityEvent('fallback_login_success');

            return true;
        } else {
            recordLoginAttempt(false);
            set({
                error: 'Incorrect password',
                isLoading: false
            });
            return false;
        }
    },

    /**
     * Universal login method (auto-detects Supabase vs fallback)
     */
    login: async (emailOrPassword, password = null) => {
        if (isSupabaseConfigured() && password) {
            // Supabase mode: email + password
            return get().loginWithSupabase(emailOrPassword, password);
        } else {
            // Fallback mode: password only
            return get().loginWithPassword(emailOrPassword);
        }
    },

    /**
     * Logout
     */
    logout: async () => {
        if (isSupabaseConfigured()) {
            try {
                await supabase.auth.signOut();
            } catch (e) {
                console.error('Supabase logout error:', e);
            }
        }

        saveAuthSession(null);
        set({
            isAuthenticated: false,
            user: null,
            error: null
        });

        logSecurityEvent('logout');
    },

    /**
     * Check if session is still valid
     */
    validateSession: () => {
        const session = loadAuthSession();

        if (!session) {
            set({ isAuthenticated: false, user: null });
            return false;
        }

        if (session.expiresAt && new Date(session.expiresAt) < new Date()) {
            saveAuthSession(null);
            set({
                isAuthenticated: false,
                user: null,
                error: 'Session expired. Please login again.'
            });
            return false;
        }

        return true;
    },

    /**
     * Extend session (refresh expiration)
     */
    extendSession: () => {
        const session = loadAuthSession();
        if (!session) return;

        const extended = {
            ...session,
            expiresAt: new Date(Date.now() + SESSION_DURATION).toISOString(),
        };

        saveAuthSession(extended);
        set({ user: extended });
    },

    /**
     * Clear error message
     */
    clearError: () => {
        set({ error: null });
    },

    /**
     * Get remaining login attempts
     */
    getRemainingAttempts: () => {
        const data = getRateLimitData();
        return Math.max(0, MAX_LOGIN_ATTEMPTS - data.attempts);
    },

    /**
     * Check if using Supabase Auth or fallback
     * Returns false if VITE_APP_PASSWORD is set (password mode)
     */
    isSupabaseAuth: () => {
        return useSupabaseAuth();
    },
}));

// Auto-validate session on page load
if (typeof window !== 'undefined') {
    useAuthStore.getState().validateSession();

    // Auto-extend session on user activity
    let activityTimeout;
    const extendOnActivity = () => {
        clearTimeout(activityTimeout);
        activityTimeout = setTimeout(() => {
            if (useAuthStore.getState().isAuthenticated) {
                useAuthStore.getState().extendSession();
            }
        }, 60000); // Extend after 1 minute of activity
    };

    window.addEventListener('mousemove', extendOnActivity);
    window.addEventListener('keydown', extendOnActivity);
}
