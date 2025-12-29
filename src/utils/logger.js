/**
 * Debug Logger Utility
 * Provides environment-aware logging that only outputs in development mode.
 * In production, errors are sent to Sentry for monitoring.
 */

import { captureError, captureMessage } from '../services/errorTrackingService';

const isDev = import.meta.env.DEV;

/**
 * Logger object with methods for different log levels.
 * In development: outputs to console
 * In production: errors go to Sentry, other levels are silenced
 */
const logger = {
    /**
     * Debug level - only in development
     */
    debug: (...args) => {
        if (isDev) {
            console.debug('[DEBUG]', ...args);
        }
    },

    /**
     * Info level - only in development
     */
    info: (...args) => {
        if (isDev) {
            console.info('[INFO]', ...args);
        }
    },

    /**
     * Warning level - development only, but could be configured
     */
    warn: (...args) => {
        if (isDev) {
            console.warn('[WARN]', ...args);
        }
    },

    /**
     * Error level - logs to console in dev, sends to Sentry in production
     */
    error: (message, error = null, context = {}) => {
        if (isDev) {
            console.error('[ERROR]', message, error, context);
        } else if (error) {
            // In production, send to Sentry
            captureError(error, {
                extra: { message, ...context },
            });
        } else {
            captureMessage(message, 'error');
        }
    },

    /**
     * Security events - always log in dev, send to monitoring in production
     */
    security: (event, details = {}) => {
        const timestamp = new Date().toISOString();
        if (isDev) {
            console.info('[SECURITY]', timestamp, event, details);
        } else {
            captureMessage(`[SECURITY] ${event}`, 'info');
        }
    },
};

export default logger;

/**
 * Named exports for convenience
 */
export const { debug, info, warn, error, security } = logger;
