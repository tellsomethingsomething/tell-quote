import { create } from 'zustand';
import { supabase, isSupabaseConfigured, shouldUseSupabaseAuth } from '../lib/supabase';
import { logSecurityEvent, encryptData, decryptData } from '../utils/encryption';
import { trackConversion, Events, trackEvent } from '../services/analyticsService';
import { setUserContext } from '../services/errorTrackingService';
import { isAdminRole, hasPermission as checkRolePermission, getEffectiveRoleLevel } from '../types/roles';
import logger from '../utils/logger';

const AUTH_KEY = 'tell_auth_session';
const AUTH_KEY_ENCRYPTED = 'tell_auth_session_enc';
const RATE_LIMIT_KEY = 'tell_auth_attempts';
const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes
const SESSION_DURATION = 24 * 60 * 60 * 1000; // 24 hours

// Backward compatibility: Support old password-based auth if Supabase not configured
// SECURITY: Password must be set via environment variable - no hardcoded fallback
const FALLBACK_PASSWORD = import.meta.env.VITE_APP_PASSWORD || null;

/**
 * Load authentication session from localStorage (async, encrypted)
 * Handles migration from plaintext to encrypted storage
 */
async function loadAuthSessionAsync() {
    try {
        // First check for encrypted session
        const encrypted = localStorage.getItem(AUTH_KEY_ENCRYPTED);
        if (encrypted) {
            const decrypted = await decryptData(encrypted);
            if (decrypted) {
                const session = JSON.parse(decrypted);

                // Check if session has expired
                if (session.expiresAt && new Date(session.expiresAt) < new Date()) {
                    localStorage.removeItem(AUTH_KEY_ENCRYPTED);
                    logSecurityEvent('session_expired', { email: session.email });
                    return null;
                }

                return session;
            }
        }

        // Migrate from old plaintext storage (backward compatibility)
        const saved = localStorage.getItem(AUTH_KEY);
        if (saved) {
            try {
                const session = JSON.parse(saved);

                // Check if session has expired
                if (session.expiresAt && new Date(session.expiresAt) < new Date()) {
                    localStorage.removeItem(AUTH_KEY);
                    logSecurityEvent('session_expired', { email: session.email });
                    return null;
                }

                // Migrate to encrypted storage
                await saveAuthSessionAsync(session);
                localStorage.removeItem(AUTH_KEY); // Remove old plaintext
                logSecurityEvent('session_migrated_to_encrypted', { email: session.email });

                return session;
            } catch (parseError) {
                logger.error('Failed to parse old session:', parseError);
                localStorage.removeItem(AUTH_KEY);
            }
        }

        return null;
    } catch (e) {
        logger.error('Failed to load auth session:', e);
        return null;
    }
}

/**
 * Synchronous load for initial state (returns null, actual load happens in initialize)
 */
function loadAuthSessionSync() {
    // Check for encrypted session marker only
    return localStorage.getItem(AUTH_KEY_ENCRYPTED) || localStorage.getItem(AUTH_KEY) ? 'pending' : null;
}

/**
 * Save authentication session to localStorage (async, encrypted)
 */
async function saveAuthSessionAsync(session) {
    try {
        if (session) {
            const encrypted = await encryptData(JSON.stringify(session));
            localStorage.setItem(AUTH_KEY_ENCRYPTED, encrypted);
            // Remove old plaintext if exists
            localStorage.removeItem(AUTH_KEY);
            logSecurityEvent('session_created', {
                email: session.email,
                expiresAt: session.expiresAt,
                encrypted: true
            });
        } else {
            localStorage.removeItem(AUTH_KEY_ENCRYPTED);
            localStorage.removeItem(AUTH_KEY);
        }
    } catch (e) {
        logger.error('Failed to save auth session:', e);
    }
}

// Alias for backward compatibility in store
const saveAuthSession = saveAuthSessionAsync;

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
        logger.error('Failed to save rate limit data:', e);
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

/**
 * Fetch user profile from user_profiles table
 */
async function fetchUserProfile(authUserId) {
    if (!isSupabaseConfigured()) return null;

    try {
        const { data, error } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('auth_user_id', authUserId)
            .single();

        if (error) {
            logger.error('Failed to fetch user profile:', error);
            return null;
        }

        return {
            id: data.id,
            authUserId: data.auth_user_id,
            name: data.name,
            email: data.email,
            role: data.role,
            status: data.status || 'active',
            tabPermissions: data.tab_permissions || [],
        };
    } catch (e) {
        logger.error('Failed to fetch user profile:', e);
        return null;
    }
}

export const useAuthStore = create((set, get) => ({
    // Initial state - check if session exists but don't load yet (async happens in initialize)
    isAuthenticated: !!loadAuthSessionSync(),
    user: null, // Will be loaded in initialize()
    isSessionLoading: !!loadAuthSessionSync(), // True if session needs to be loaded
    error: null,
    isLoading: false,
    rateLimited: false,
    lockoutTimeRemaining: 0,
    needsOnboarding: false,

    /**
     * Initialize auth session - loads encrypted session and sets up Supabase listeners
     */
    initialize: async () => {
        // First, load the encrypted session from localStorage
        const savedSession = await loadAuthSessionAsync();
        if (savedSession) {
            set({
                isAuthenticated: true,
                user: savedSession,
                isSessionLoading: false
            });
        } else {
            set({
                isAuthenticated: false,
                user: null,
                isSessionLoading: false
            });
        }

        if (!isSupabaseConfigured()) {
            // Fallback mode: password-based auth
            return;
        }

        try {
            // Check for existing Supabase session
            const { data: { session } } = await supabase.auth.getSession();

            if (session) {
                // Fetch user profile
                const profile = await fetchUserProfile(session.user.id);

                const authSession = {
                    email: session.user.email,
                    userId: session.user.id,
                    expiresAt: new Date(Date.now() + SESSION_DURATION).toISOString(),
                    provider: 'supabase',
                    profile: profile,
                    emailVerified: !!session.user.email_confirmed_at,
                };

                saveAuthSession(authSession);
                set({
                    isAuthenticated: true,
                    user: authSession,
                    error: null
                });

                logSecurityEvent('session_restored', { email: session.user.email, emailVerified: authSession.emailVerified });
            }

            // Listen for auth changes
            supabase.auth.onAuthStateChange(async (event, session) => {
                if (event === 'SIGNED_IN' && session) {
                    // If logged in via Google, save the Gmail connection
                    if (session.user.app_metadata?.provider === 'google' && session.provider_token) {
                        try {
                            await supabase.from('google_connections').upsert({
                                user_id: session.user.id,
                                google_email: session.user.email,
                                google_user_id: session.user.user_metadata?.sub,
                                google_name: session.user.user_metadata?.full_name || session.user.user_metadata?.name,
                                google_picture: session.user.user_metadata?.avatar_url,
                                access_token: session.provider_token,
                                refresh_token: session.provider_refresh_token,
                                token_expires_at: new Date(Date.now() + 3600 * 1000).toISOString(), // 1 hour
                                status: 'active',
                                sync_enabled: true,
                            }, { onConflict: 'user_id,google_email' });
                        } catch (e) {
                            logger.error('Failed to save Google connection:', e);
                        }
                    }

                    // Fetch user profile
                    let profile = await fetchUserProfile(session.user.id);

                    // If no profile exists (new OAuth user), create pending profile
                    if (!profile) {
                        const name = session.user.user_metadata?.full_name ||
                            session.user.user_metadata?.name ||
                            session.user.email?.split('@')[0] ||
                            'User';

                        const { data: newProfile, error: createError } = await supabase
                            .from('user_profiles')
                            .insert({
                                auth_user_id: session.user.id,
                                name: name,
                                email: session.user.email,
                                role: 'owner',
                                status: 'active',
                                tab_permissions: ['dashboard', 'quotes', 'clients', 'projects', 'crew', 'equipment', 'rate-card', 'settings'],
                            })
                            .select()
                            .single();

                        if (!createError && newProfile) {
                            profile = {
                                id: newProfile.id,
                                authUserId: newProfile.auth_user_id,
                                name: newProfile.name,
                                email: newProfile.email,
                                role: newProfile.role,
                                status: newProfile.status,
                                tabPermissions: newProfile.tab_permissions || [],
                            };
                            logSecurityEvent('signup_completed_oauth', { email: session.user.email });
                        }
                    }

                    if (profile?.status === 'suspended') {
                        await supabase.auth.signOut();
                        saveAuthSession(null);
                        set({
                            isAuthenticated: false,
                            user: null,
                            error: 'Your account has been suspended. Please contact an administrator.',
                            isLoading: false
                        });
                        return;
                    }

                    const authSession = {
                        email: session.user.email,
                        userId: session.user.id,
                        expiresAt: new Date(Date.now() + SESSION_DURATION).toISOString(),
                        provider: 'supabase',
                        profile: profile,
                        emailVerified: !!session.user.email_confirmed_at,
                    };

                    saveAuthSession(authSession);
                    set({
                        isAuthenticated: true,
                        user: authSession,
                        error: null,
                        isLoading: false
                    });

                    // Check if user needs onboarding (no organization)
                    setTimeout(() => get().checkNeedsOnboarding(), 100);
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
            logger.error('Failed to initialize Supabase auth:', e);
        }
    },

    /**
     * Signup with Supabase Auth (creates active user, requires email verification)
     */
    signup: async (name, email, password) => {
        set({ isLoading: true, error: null });

        try {
            // 1. Create auth user (Supabase will send verification email if enabled)
            const { data, error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        name: name,
                    },
                },
            });

            if (error) {
                set({
                    error: error.message || 'Signup failed',
                    isLoading: false
                });
                return false;
            }

            if (data.user) {
                // 2. Create user profile with active status (ready to use after email verification)
                const { error: profileError } = await supabase
                    .from('user_profiles')
                    .insert({
                        auth_user_id: data.user.id,
                        name: name,
                        email: email,
                        role: 'owner',
                        status: 'active',
                        tab_permissions: ['dashboard', 'quotes', 'clients', 'projects', 'crew', 'equipment', 'rate-card', 'settings'],
                    });

                if (profileError) {
                    logger.error('Failed to create user profile:', profileError);
                }

                set({ isLoading: false });
                logSecurityEvent('signup_completed', { email });

                // Track signup
                trackConversion(Events.SIGNUP_COMPLETED);

                // Return whether email confirmation is needed
                // If identities is empty, email confirmation is required
                return {
                    success: true,
                    needsEmailConfirmation: !data.session
                };
            }

            return false;
        } catch (e) {
            logger.error('Signup error:', e);
            set({
                error: 'An error occurred during signup',
                isLoading: false
            });
            return false;
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
                // Fetch user profile
                const profile = await fetchUserProfile(data.user.id);

                // Check if user account is suspended
                if (profile?.status === 'suspended') {
                    await supabase.auth.signOut();
                    set({
                        error: 'Your account has been suspended. Please contact support.',
                        isLoading: false
                    });
                    return false;
                }

                recordLoginAttempt(true);

                const authSession = {
                    email: data.user.email,
                    userId: data.user.id,
                    expiresAt: new Date(Date.now() + SESSION_DURATION).toISOString(),
                    provider: 'supabase',
                    profile: profile,
                    emailVerified: !!data.user.email_confirmed_at,
                };

                saveAuthSession(authSession);
                set({
                    isAuthenticated: true,
                    user: authSession,
                    error: null,
                    isLoading: false,
                });

                // Set user context for error tracking
                setUserContext({ id: data.user.id });
                trackEvent('Login', { provider: 'email', emailVerified: authSession.emailVerified });

                // Check if user needs onboarding (no organization)
                setTimeout(() => get().checkNeedsOnboarding(), 100);

                return true;
            }

            return false;
        } catch (e) {
            logger.error('Supabase login error:', e);
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
        // SECURITY: Require VITE_APP_PASSWORD to be set
        if (!FALLBACK_PASSWORD) {
            set({
                error: 'Password authentication not configured. Please set VITE_APP_PASSWORD environment variable or use Supabase Auth.',
                isLoading: false
            });
            return false;
        }

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

            logger.warn('⚠️ Using deprecated password-based auth. Please migrate to Supabase Auth.');
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
     * Login with Google OAuth
     */
    loginWithGoogle: async () => {
        if (!isSupabaseConfigured()) {
            set({ error: 'Google login requires Supabase configuration' });
            return false;
        }

        set({ isLoading: true, error: null });

        try {
            const { data, error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: window.location.origin,
                    queryParams: {
                        access_type: 'offline',
                        prompt: 'consent',
                    },
                    scopes: 'email profile https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/gmail.send https://www.googleapis.com/auth/gmail.modify',
                },
            });

            if (error) {
                set({
                    error: error.message || 'Google login failed',
                    isLoading: false
                });
                return false;
            }

            // The user will be redirected to Google for authentication
            // After successful auth, they'll be redirected back and
            // the onAuthStateChange listener will handle the session
            return true;
        } catch (e) {
            logger.error('Google login error:', e);
            set({
                error: 'An error occurred during Google login',
                isLoading: false
            });
            return false;
        }
    },

    /**
     * Request password reset email
     */
    resetPassword: async (email) => {
        if (!isSupabaseConfigured()) {
            return { success: false, error: 'Password reset requires Supabase configuration' };
        }

        set({ isLoading: true, error: null });

        try {
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${window.location.origin}/reset-password`,
            });

            if (error) {
                set({ isLoading: false });
                return { success: false, error: error.message };
            }

            logSecurityEvent('password_reset_requested', { email });
            set({ isLoading: false });
            return { success: true };
        } catch (e) {
            logger.error('Password reset error:', e);
            set({ isLoading: false });
            return { success: false, error: 'An error occurred. Please try again.' };
        }
    },

    /**
     * Update password (after clicking reset link)
     */
    updatePassword: async (newPassword) => {
        if (!isSupabaseConfigured()) {
            return { success: false, error: 'Password update requires Supabase configuration' };
        }

        set({ isLoading: true, error: null });

        try {
            const { error } = await supabase.auth.updateUser({
                password: newPassword,
            });

            if (error) {
                set({ isLoading: false });
                return { success: false, error: error.message };
            }

            logSecurityEvent('password_updated');
            set({ isLoading: false });
            return { success: true };
        } catch (e) {
            logger.error('Password update error:', e);
            set({ isLoading: false });
            return { success: false, error: 'An error occurred. Please try again.' };
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
                logger.error('Supabase logout error:', e);
            }
        }

        await saveAuthSession(null);
        set({
            isAuthenticated: false,
            user: null,
            error: null
        });

        // Broadcast logout to other tabs
        get().broadcastLogout();

        logSecurityEvent('logout');
    },

    /**
     * Check if session is still valid (async)
     */
    validateSession: async () => {
        const session = await loadAuthSessionAsync();

        if (!session) {
            set({ isAuthenticated: false, user: null });
            return false;
        }

        if (session.expiresAt && new Date(session.expiresAt) < new Date()) {
            await saveAuthSession(null);
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
     * Extend session (refresh expiration) - async
     */
    extendSession: async () => {
        const { user } = get();
        if (!user) return;

        const extended = {
            ...user,
            expiresAt: new Date(Date.now() + SESSION_DURATION).toISOString(),
        };

        await saveAuthSession(extended);
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
        return shouldUseSupabaseAuth();
    },

    /**
     * Check if current user has permission to access a tab
     * Checks organization role first, then falls back to profile role
     */
    hasPermission: (tabId) => {
        const { user } = get();

        // No user = no access
        if (!user) return false;

        // Fallback for password auth mode (no profiles)
        if (user.provider === 'password') return true;

        // Get organization role (from organizationStore or cached in session)
        const orgRole = user.organizationRole || null;
        const profileRole = user.profile?.role || null;

        // Admin-level roles have access to everything
        if (isAdminRole(orgRole, profileRole)) return true;

        // Check tab permissions from profile
        return user.profile?.tabPermissions?.includes(tabId) ?? false;
    },

    /**
     * Check if current user is admin
     * Checks organization role first, then profile role
     */
    isAdmin: () => {
        const { user } = get();

        // Password mode = admin access
        if (user?.provider === 'password') return true;

        // No user = not admin
        if (!user) return false;

        // Get organization role and profile role
        const orgRole = user.organizationRole || null;
        const profileRole = user.profile?.role || null;

        // Check using centralized role system
        return isAdminRole(orgRole, profileRole);
    },

    /**
     * Get the user's organization role
     */
    getOrganizationRole: () => {
        const { user } = get();
        return user?.organizationRole || null;
    },

    /**
     * Get the effective role level (higher = more permissions)
     */
    getRoleLevel: () => {
        const { user } = get();
        if (!user) return 0;
        if (user.provider === 'password') return 100; // Max level for password mode

        return getEffectiveRoleLevel(user.organizationRole, user.profile?.role);
    },

    /**
     * Get current user profile
     */
    getCurrentUserProfile: () => {
        const { user } = get();
        return user?.profile || null;
    },

    /**
     * Refresh user profile from database
     */
    refreshProfile: async () => {
        const { user } = get();
        if (!user?.userId || user.provider === 'password') return;

        const profile = await fetchUserProfile(user.userId);
        if (profile) {
            const updatedUser = { ...user, profile };
            saveAuthSession(updatedUser);
            set({ user: updatedUser });
        }
    },

    /**
     * Check if user needs onboarding (no organization membership)
     */
    checkNeedsOnboarding: async () => {
        const { user } = get();
        if (!user?.userId || user.provider === 'password') {
            set({ needsOnboarding: false });
            return false;
        }

        try {
            // Check if user has any organization membership
            const { data, error } = await supabase
                .from('organization_members')
                .select('id')
                .eq('user_id', user.userId)
                .limit(1);

            if (error) {
                logger.error('Failed to check organization membership:', error);
                return false;
            }

            const needsOnboarding = !data || data.length === 0;
            set({ needsOnboarding });
            return needsOnboarding;
        } catch (e) {
            logger.error('Error checking onboarding status:', e);
            return false;
        }
    },

    /**
     * Onboard user with a new organization
     * Calls the onboard-organization edge function
     */
    onboardOrganization: async (organizationName, userName) => {
        const { user } = get();
        if (!user?.userId) {
            return { success: false, error: 'Not authenticated' };
        }

        set({ isLoading: true, error: null });

        try {
            // Get current session for auth token
            const { data: { session } } = await supabase.auth.getSession();
            if (!session?.access_token) {
                set({ isLoading: false });
                return { success: false, error: 'No valid session' };
            }

            // Call the onboard-organization edge function
            const response = await fetch(
                `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/onboard-organization`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${session.access_token}`,
                        'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
                    },
                    body: JSON.stringify({
                        organizationName,
                        userName: userName || user.profile?.name || user.email?.split('@')[0],
                    }),
                }
            );

            const result = await response.json();

            if (!response.ok) {
                set({ isLoading: false });
                return { success: false, error: result.error || 'Onboarding failed' };
            }

            // Refresh the user profile to get updated organization info
            const profile = await fetchUserProfile(user.userId);
            if (profile) {
                const updatedUser = { ...user, profile };
                saveAuthSession(updatedUser);
                set({
                    user: updatedUser,
                    needsOnboarding: false,
                    isLoading: false
                });
            } else {
                set({ needsOnboarding: false, isLoading: false });
            }

            logSecurityEvent('organization_onboarded', {
                organizationName,
                organizationId: result.organization?.id
            });

            return {
                success: true,
                organization: result.organization,
                profile: result.profile
            };
        } catch (e) {
            logger.error('Onboarding error:', e);
            set({
                error: 'An error occurred during onboarding',
                isLoading: false
            });
            return { success: false, error: e.message };
        }
    },

    /**
     * Clear the needs onboarding flag
     */
    setNeedsOnboarding: (value) => {
        set({ needsOnboarding: value });
    },

    /**
     * Check if user's email is verified
     */
    isEmailVerified: () => {
        const { user } = get();
        if (!user) return false;
        if (user.provider === 'password') return true; // Skip for legacy auth
        return user.emailVerified === true;
    },

    /**
     * Broadcast logout to other tabs
     */
    broadcastLogout: () => {
        if (typeof BroadcastChannel !== 'undefined') {
            const channel = new BroadcastChannel('auth_channel');
            channel.postMessage({ type: 'LOGOUT' });
            channel.close();
        }
    },

    /**
     * Broadcast session update to other tabs
     */
    broadcastSessionUpdate: (session) => {
        if (typeof BroadcastChannel !== 'undefined') {
            const channel = new BroadcastChannel('auth_channel');
            channel.postMessage({ type: 'SESSION_UPDATE', session });
            channel.close();
        }
    },
}));

// Auto-initialize auth on page load
if (typeof window !== 'undefined') {
    // Initialize auth session (loads encrypted session)
    useAuthStore.getState().initialize();

    // Auto-extend session on meaningful user activity (not just mouse move)
    let activityTimeout;
    let lastExtension = Date.now();
    const MIN_EXTENSION_INTERVAL = 5 * 60 * 1000; // 5 minutes between extensions

    const extendOnActivity = () => {
        clearTimeout(activityTimeout);
        activityTimeout = setTimeout(async () => {
            const now = Date.now();
            // Only extend if enough time has passed and user is authenticated
            if (useAuthStore.getState().isAuthenticated && (now - lastExtension) > MIN_EXTENSION_INTERVAL) {
                await useAuthStore.getState().extendSession();
                lastExtension = now;
            }
        }, 60000); // Extend after 1 minute of activity
    };

    // Only extend on meaningful interactions, not mouse movement
    window.addEventListener('click', extendOnActivity);
    window.addEventListener('keydown', extendOnActivity);
    window.addEventListener('submit', extendOnActivity);

    // Cross-tab session synchronization using BroadcastChannel
    if (typeof BroadcastChannel !== 'undefined') {
        const authChannel = new BroadcastChannel('auth_channel');

        authChannel.onmessage = async (event) => {
            const { type, session } = event.data;

            switch (type) {
                case 'LOGOUT':
                    // Another tab logged out - sync this tab
                    await saveAuthSessionAsync(null);
                    useAuthStore.setState({
                        isAuthenticated: false,
                        user: null,
                        error: null,
                    });
                    logSecurityEvent('cross_tab_logout');
                    break;

                case 'SESSION_UPDATE':
                    // Another tab updated the session - refresh our state
                    if (session) {
                        useAuthStore.setState({
                            isAuthenticated: true,
                            user: session,
                        });
                        logSecurityEvent('cross_tab_session_sync');
                    }
                    break;
            }
        };

        // Clean up on page unload
        window.addEventListener('beforeunload', () => {
            authChannel.close();
        });
    }
}
