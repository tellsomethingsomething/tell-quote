/**
 * Client-side encryption utility for sensitive data in localStorage
 *
 * IMPORTANT SECURITY NOTES:
 * - This provides obfuscation, NOT military-grade encryption
 * - Client-side encryption can always be reverse-engineered
 * - Best practice: Move API keys to a backend proxy
 * - This is a defense-in-depth measure, not a complete solution
 */

// Generate a device-specific key based on browser fingerprint
function getDeviceKey() {
    // Use browser/device characteristics as entropy
    const entropy = [
        navigator.userAgent,
        navigator.language,
        screen.colorDepth,
        screen.width,
        screen.height,
        new Date().getTimezoneOffset(),
    ].join('|');

    return entropy;
}

// Simple XOR cipher with key derivation
async function deriveKey(passphrase) {
    const encoder = new TextEncoder();
    const data = encoder.encode(passphrase);

    // Use SubtleCrypto if available (more secure)
    if (window.crypto && window.crypto.subtle) {
        try {
            const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
            return Array.from(new Uint8Array(hashBuffer));
        } catch (e) {
            console.warn('SubtleCrypto unavailable, using fallback');
        }
    }

    // Fallback: Simple hash function
    return simplHash(passphrase);
}

function simplHash(str) {
    const hash = [];
    for (let i = 0; i < 32; i++) {
        let h = 0;
        for (let j = 0; j < str.length; j++) {
            h = ((h << 5) - h) + str.charCodeAt(j) + i;
            h = h & h; // Convert to 32bit integer
        }
        hash.push(Math.abs(h) % 256);
    }
    return hash;
}

/**
 * Encrypt sensitive data for localStorage storage
 * @param {string} data - Plain text data to encrypt
 * @returns {Promise<string>} Base64 encoded encrypted data
 */
export async function encryptData(data) {
    if (!data) return '';

    try {
        const deviceKey = getDeviceKey();
        const keyBytes = await deriveKey(deviceKey);

        // Convert data to bytes
        const encoder = new TextEncoder();
        const dataBytes = encoder.encode(data);

        // XOR encryption
        const encrypted = new Uint8Array(dataBytes.length);
        for (let i = 0; i < dataBytes.length; i++) {
            encrypted[i] = dataBytes[i] ^ keyBytes[i % keyBytes.length];
        }

        // Convert to base64
        return btoa(String.fromCharCode(...encrypted));
    } catch (e) {
        console.error('Encryption failed:', e);
        return data; // Fallback to unencrypted
    }
}

/**
 * Decrypt data from localStorage
 * @param {string} encryptedData - Base64 encoded encrypted data
 * @returns {Promise<string>} Decrypted plain text
 */
export async function decryptData(encryptedData) {
    if (!encryptedData) return '';

    try {
        const deviceKey = getDeviceKey();
        const keyBytes = await deriveKey(deviceKey);

        // Decode from base64
        const encrypted = new Uint8Array(
            atob(encryptedData).split('').map(c => c.charCodeAt(0))
        );

        // XOR decryption (same as encryption)
        const decrypted = new Uint8Array(encrypted.length);
        for (let i = 0; i < encrypted.length; i++) {
            decrypted[i] = encrypted[i] ^ keyBytes[i % keyBytes.length];
        }

        // Convert back to string
        const decoder = new TextDecoder();
        return decoder.decode(decrypted);
    } catch (e) {
        console.error('Decryption failed:', e);
        return encryptedData; // Fallback to returning as-is
    }
}

/**
 * Encrypt an object's sensitive fields
 * @param {Object} obj - Object with sensitive data
 * @param {string[]} fields - Array of field names to encrypt
 * @returns {Promise<Object>} Object with encrypted fields
 */
export async function encryptFields(obj, fields) {
    const result = { ...obj };

    for (const field of fields) {
        if (result[field]) {
            result[field] = await encryptData(String(result[field]));
        }
    }

    return result;
}

/**
 * Decrypt an object's sensitive fields
 * @param {Object} obj - Object with encrypted data
 * @param {string[]} fields - Array of field names to decrypt
 * @returns {Promise<Object>} Object with decrypted fields
 */
export async function decryptFields(obj, fields) {
    const result = { ...obj };

    for (const field of fields) {
        if (result[field]) {
            result[field] = await decryptData(result[field]);
        }
    }

    return result;
}

/**
 * Check if data appears to be encrypted (base64 format)
 */
export function isEncrypted(data) {
    if (!data || typeof data !== 'string') return false;

    // Check if it's valid base64
    try {
        return btoa(atob(data)) === data;
    } catch {
        return false;
    }
}

/**
 * Securely wipe a string from memory (best effort)
 * Note: JavaScript doesn't provide true memory wiping
 */
export function secureWipe(str) {
    if (typeof str !== 'string') return;

    // Overwrite the string value (limited effectiveness in JS)
    try {
        str = '\0'.repeat(str.length);
    } catch (e) {
        // Strings are immutable in JS, this is best effort
    }
}

/**
 * Mask sensitive data for display (e.g., API keys)
 * @param {string} value - Value to mask
 * @param {number} visibleChars - Number of chars to show at start/end
 * @returns {string} Masked value
 */
export function maskSensitiveData(value, visibleChars = 4) {
    if (!value || value.length <= visibleChars * 2) return value;

    const start = value.substring(0, visibleChars);
    const end = value.substring(value.length - visibleChars);
    const masked = '*'.repeat(Math.min(value.length - visibleChars * 2, 20));

    return `${start}${masked}${end}`;
}

/**
 * Validate that an API key has a reasonable format
 */
export function validateApiKeyFormat(key, prefix = '') {
    if (!key) return false;

    // Basic validation: should be alphanumeric with possible dashes/underscores
    const isValidFormat = /^[a-zA-Z0-9_-]+$/.test(key);

    if (prefix && !key.startsWith(prefix)) {
        return false;
    }

    // Reasonable length check (most API keys are 20-100 chars)
    return isValidFormat && key.length >= 20 && key.length <= 200;
}

/**
 * Security warning for exposed keys
 */
export function showSecurityWarning(message) {
    console.warn(
        '%c⚠️ SECURITY WARNING ⚠️',
        'color: #ff6b6b; font-size: 16px; font-weight: bold;',
        '\n' + message
    );
}

/**
 * Log security event (for monitoring)
 */
export function logSecurityEvent(event, details = {}) {
    const timestamp = new Date().toISOString();
    console.info('[SECURITY]', timestamp, event, details);

    // In production, you would send this to a logging service
    // Example: sendToLoggingService({ timestamp, event, details });
}
