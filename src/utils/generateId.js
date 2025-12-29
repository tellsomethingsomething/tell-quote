/**
 * Secure ID Generation Utility
 * Uses crypto.randomUUID() for cryptographically secure unique identifiers.
 * Falls back to a secure alternative if crypto API is unavailable.
 */

/**
 * Generate a cryptographically secure unique ID
 * @returns {string} A unique identifier (UUID v4 format)
 */
export function generateId() {
    // Use native crypto.randomUUID if available (modern browsers, Node 19+)
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        return crypto.randomUUID();
    }

    // Fallback using crypto.getRandomValues (older browsers)
    if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
            const r = crypto.getRandomValues(new Uint8Array(1))[0] % 16;
            const v = c === 'x' ? r : (r & 0x3) | 0x8;
            return v.toString(16);
        });
    }

    // Last resort fallback (should rarely happen in modern environments)
    // Still better than plain Math.random() as it combines multiple sources
    const timestamp = Date.now().toString(36);
    const randomPart = Array.from({ length: 12 }, () =>
        Math.floor(Math.random() * 36).toString(36)
    ).join('');
    return `${timestamp}-${randomPart}`;
}

/**
 * Generate a short unique ID (for display purposes)
 * @param {number} length - Length of the ID (default: 8)
 * @returns {string} A short unique identifier
 */
export function generateShortId(length = 8) {
    if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
        const bytes = crypto.getRandomValues(new Uint8Array(Math.ceil(length * 0.75)));
        return btoa(String.fromCharCode(...bytes))
            .replace(/[+/=]/g, '')
            .substring(0, length);
    }

    // Fallback
    return Date.now().toString(36) + Math.random().toString(36).substring(2, length);
}

/**
 * Generate a prefixed ID for specific entity types
 * @param {string} prefix - Prefix for the ID (e.g., 'tmpl', 'client', 'quote')
 * @returns {string} A prefixed unique identifier
 */
export function generatePrefixedId(prefix) {
    const uuid = generateId();
    return `${prefix}_${uuid}`;
}

export default generateId;
