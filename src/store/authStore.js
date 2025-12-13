import { create } from 'zustand';

const AUTH_KEY = 'tell_auth';

// Password from environment variable (set VITE_APP_PASSWORD in .env)
const APP_PASSWORD = import.meta.env.VITE_APP_PASSWORD || '';

function loadAuth() {
    try {
        const saved = localStorage.getItem(AUTH_KEY);
        return saved === 'authenticated';
    } catch {
        return false;
    }
}

function saveAuth(isAuthenticated) {
    try {
        if (isAuthenticated) {
            localStorage.setItem(AUTH_KEY, 'authenticated');
        } else {
            localStorage.removeItem(AUTH_KEY);
        }
    } catch (e) {
        console.error('Failed to save auth state:', e);
    }
}

export const useAuthStore = create((set) => ({
    isAuthenticated: loadAuth(),
    error: null,

    login: (password) => {
        if (password === APP_PASSWORD) {
            saveAuth(true);
            set({ isAuthenticated: true, error: null });
            return true;
        } else {
            set({ error: 'Incorrect password' });
            return false;
        }
    },

    logout: () => {
        saveAuth(false);
        set({ isAuthenticated: false, error: null });
    },

    clearError: () => {
        set({ error: null });
    },
}));
