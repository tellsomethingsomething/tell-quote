import * as Sentry from '@sentry/react';

const SENTRY_DSN = import.meta.env.VITE_SENTRY_DSN;

// Initialize Sentry error tracking
export function initErrorTracking() {
    if (!SENTRY_DSN) {
        console.log('Sentry DSN not configured - error tracking disabled');
        return;
    }

    Sentry.init({
        dsn: SENTRY_DSN,
        environment: import.meta.env.MODE,
        release: import.meta.env.VITE_APP_VERSION || '1.0.0',

        // Performance monitoring
        tracesSampleRate: import.meta.env.MODE === 'production' ? 0.1 : 1.0,

        // Session replay for debugging
        replaysSessionSampleRate: 0.1,
        replaysOnErrorSampleRate: 1.0,

        // Filter out common non-actionable errors
        ignoreErrors: [
            'ResizeObserver loop limit exceeded',
            'ResizeObserver loop completed with undelivered notifications',
            'Non-Error promise rejection captured',
            'Load failed',
            'NetworkError',
            'ChunkLoadError',
        ],

        // Sanitize sensitive data
        beforeSend(event) {
            // Remove any potential PII from error reports
            if (event.user) {
                delete event.user.email;
                delete event.user.ip_address;
            }
            return event;
        },

        // Set up integrations
        integrations: [
            Sentry.browserTracingIntegration(),
            Sentry.replayIntegration({
                maskAllText: true,
                blockAllMedia: true,
            }),
        ],
    });
}

// Capture an error with optional context
export function captureError(error, context = {}) {
    if (!SENTRY_DSN) {
        console.error('Error:', error, context);
        return;
    }

    Sentry.withScope((scope) => {
        if (context.tags) {
            Object.entries(context.tags).forEach(([key, value]) => {
                scope.setTag(key, value);
            });
        }
        if (context.extra) {
            Object.entries(context.extra).forEach(([key, value]) => {
                scope.setExtra(key, value);
            });
        }
        if (context.user) {
            scope.setUser({ id: context.user.id });
        }
        Sentry.captureException(error);
    });
}

// Capture a message with severity level
export function captureMessage(message, level = 'info', context = {}) {
    if (!SENTRY_DSN) {
        console.log(`[${level}] ${message}`, context);
        return;
    }

    Sentry.withScope((scope) => {
        scope.setLevel(level);
        if (context.tags) {
            Object.entries(context.tags).forEach(([key, value]) => {
                scope.setTag(key, value);
            });
        }
        Sentry.captureMessage(message);
    });
}

// Set user context for error tracking
export function setUserContext(user) {
    if (!SENTRY_DSN) return;

    Sentry.setUser(user ? { id: user.id } : null);
}

// Add breadcrumb for debugging
export function addBreadcrumb(message, category = 'user', data = {}) {
    if (!SENTRY_DSN) return;

    Sentry.addBreadcrumb({
        message,
        category,
        data,
        level: 'info',
    });
}

// Track performance of async operations
export function startTransaction(name, op = 'task') {
    if (!SENTRY_DSN) {
        return { finish: () => {} };
    }

    return Sentry.startInactiveSpan({
        name,
        op,
    });
}

export default {
    initErrorTracking,
    captureError,
    captureMessage,
    setUserContext,
    addBreadcrumb,
    startTransaction,
};
