/**
 * Centralized date formatting utilities for consistent date display across the app.
 * Uses the user's locale settings when available for internationalization.
 */

/**
 * Get the user's preferred locale from settings or browser
 * @returns {string} Locale string like 'en-US' or 'en-GB'
 */
function getLocale() {
    // Try to get from settings store (lazy import to avoid circular deps)
    try {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const { useSettingsStore } = require('../store/settingsStore');
        const locale = useSettingsStore.getState().settings?.locale;
        if (locale) return locale;
    } catch {
        // Settings store not available
    }

    // Fall back to browser locale
    return navigator?.language || 'en-US';
}

/**
 * Format a date string or Date object
 * @param {string|Date|null} dateInput - Date to format
 * @param {string} format - Format type: 'short', 'medium', 'long', 'iso', 'relative'
 * @returns {string|null} Formatted date string or null if invalid input
 */
export function formatDate(dateInput, format = 'short') {
    if (!dateInput) return null;

    const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;

    // Check for invalid date
    if (isNaN(date.getTime())) return null;

    const locale = getLocale();

    const formats = {
        // Short: "Jan 15" or "15 Jan" depending on locale
        short: { day: 'numeric', month: 'short' },
        // Medium: "Jan 15, 2024" or "15 Jan 2024"
        medium: { day: 'numeric', month: 'short', year: 'numeric' },
        // Long: "January 15, 2024" or "15 January 2024"
        long: { day: 'numeric', month: 'long', year: 'numeric' },
        // Full: "Monday, January 15, 2024"
        full: { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' },
        // ISO: "2024-01-15"
        iso: null, // Special handling below
        // Time: "2:30 PM" or "14:30"
        time: { hour: 'numeric', minute: '2-digit' },
        // DateTime: "Jan 15, 2024, 2:30 PM"
        datetime: { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' },
    };

    if (format === 'iso') {
        return date.toISOString().split('T')[0];
    }

    if (format === 'relative') {
        return formatRelativeDate(date);
    }

    const options = formats[format] || formats.short;
    return date.toLocaleDateString(locale, options);
}

/**
 * Format a date as relative time (e.g., "2 days ago", "in 3 hours")
 * @param {Date} date - Date to format
 * @returns {string} Relative time string
 */
export function formatRelativeDate(date) {
    const now = new Date();
    const diffMs = date - now;
    const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.round(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.round(diffMs / (1000 * 60));

    const locale = getLocale();

    // Use Intl.RelativeTimeFormat if available
    if (typeof Intl?.RelativeTimeFormat !== 'undefined') {
        const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });

        if (Math.abs(diffDays) >= 1) {
            return rtf.format(diffDays, 'day');
        }
        if (Math.abs(diffHours) >= 1) {
            return rtf.format(diffHours, 'hour');
        }
        return rtf.format(diffMinutes, 'minute');
    }

    // Fallback for older browsers
    if (diffDays > 0) return `in ${diffDays} day${diffDays !== 1 ? 's' : ''}`;
    if (diffDays < 0) return `${Math.abs(diffDays)} day${diffDays !== -1 ? 's' : ''} ago`;
    if (diffHours > 0) return `in ${diffHours} hour${diffHours !== 1 ? 's' : ''}`;
    if (diffHours < 0) return `${Math.abs(diffHours)} hour${diffHours !== -1 ? 's' : ''} ago`;
    if (diffMinutes > 0) return `in ${diffMinutes} minute${diffMinutes !== 1 ? 's' : ''}`;
    if (diffMinutes < 0) return `${Math.abs(diffMinutes)} minute${diffMinutes !== -1 ? 's' : ''} ago`;
    return 'just now';
}

/**
 * Format a date range
 * @param {string|Date} startDate - Start date
 * @param {string|Date} endDate - End date
 * @param {string} format - Format type
 * @returns {string} Formatted date range like "Jan 15 - 20, 2024"
 */
export function formatDateRange(startDate, endDate, format = 'medium') {
    const start = formatDate(startDate, format);
    const end = formatDate(endDate, format);

    if (!start || !end) return start || end || '';
    if (start === end) return start;

    return `${start} - ${end}`;
}

/**
 * Check if a date is in the past
 * @param {string|Date} dateInput - Date to check
 * @returns {boolean} True if date is in the past
 */
export function isPastDate(dateInput) {
    if (!dateInput) return false;
    const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
    return date < new Date();
}

/**
 * Check if a date is today
 * @param {string|Date} dateInput - Date to check
 * @returns {boolean} True if date is today
 */
export function isToday(dateInput) {
    if (!dateInput) return false;
    const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
    const today = new Date();
    return date.toDateString() === today.toDateString();
}

export default {
    formatDate,
    formatRelativeDate,
    formatDateRange,
    isPastDate,
    isToday,
};
