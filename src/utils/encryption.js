/**
 * Client-side encryption utility for sensitive data in localStorage
 *
 * SECURITY IMPLEMENTATION:
 * - Uses AES-GCM (256-bit) for authenticated encryption
 * - PBKDF2 with 100,000 iterations for key derivation
 * - Random 12-byte IV per encryption operation
 * - Device fingerprint + salt for key material
 *
 * IMPORTANT NOTES:
 * - Client-side encryption is defense-in-depth, not absolute security
 * - Best practice: Move API keys to a backend proxy
 * - Keys are derived from device characteristics (semi-unique per device)
 */

import logger from './logger';

// Encryption configuration constants
const PBKDF2_ITERATIONS = 100000;
const AES_KEY_LENGTH = 256;
const IV_LENGTH = 12; // 96 bits for GCM
const SALT_PREFIX = 'productionos-v3-'; // Base salt prefix (user ID appended)
const VERSION_PREFIX = 'v3:'; // Version prefix for user-specific encryption
const LEGACY_VERSION_PREFIX = 'v2:'; // Legacy prefix for migration

// Cache for user ID to avoid repeated localStorage reads
let cachedUserId = null;

/**
 * Get user-specific salt for key derivation
 * SECURITY: Uses user ID to ensure encryption is unique per user
 * @returns {string} User-specific salt
 */
function getUserSalt() {
    // Try to get user ID from multiple sources
    if (!cachedUserId) {
        try {
            // Check localStorage for auth state
            const authState = localStorage.getItem('productionos-auth');
            if (authState) {
                const parsed = JSON.parse(authState);
                cachedUserId = parsed?.state?.userId || parsed?.state?.user?.id;
            }

            // Fallback: Check Supabase auth storage
            if (!cachedUserId) {
                const supabaseAuth = localStorage.getItem('sb-xprvufuzdmyniaplmpwf-auth-token');
                if (supabaseAuth) {
                    const parsed = JSON.parse(supabaseAuth);
                    cachedUserId = parsed?.user?.id;
                }
            }
        } catch (e) {
            logger.debug('Could not get user ID for salt');
        }
    }

    // Use user ID if available, otherwise use device-only salt (less secure but functional)
    return SALT_PREFIX + (cachedUserId || 'device-fallback');
}

/**
 * Clear cached user ID (call on logout)
 */
export function clearEncryptionCache() {
    cachedUserId = null;
}

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
        // SECURITY: Add user-specific component
        cachedUserId || '',
    ].join('|');

    return entropy;
}

/**
 * Derive an AES-GCM key using PBKDF2
 * SECURITY: Uses user-specific salt for unique key derivation per user
 * @param {string} passphrase - The passphrase to derive key from
 * @param {string} salt - Optional salt override (for legacy decryption)
 * @returns {Promise<CryptoKey>} AES-GCM CryptoKey
 */
async function deriveAESKey(passphrase, salt = null) {
    const encoder = new TextEncoder();

    // Import passphrase as key material
    const keyMaterial = await window.crypto.subtle.importKey(
        'raw',
        encoder.encode(passphrase),
        'PBKDF2',
        false,
        ['deriveBits', 'deriveKey']
    );

    // Use user-specific salt for better security
    const effectiveSalt = salt || getUserSalt();

    // Derive AES-GCM key using PBKDF2
    return await window.crypto.subtle.deriveKey(
        {
            name: 'PBKDF2',
            salt: encoder.encode(effectiveSalt),
            iterations: PBKDF2_ITERATIONS,
            hash: 'SHA-256',
        },
        keyMaterial,
        { name: 'AES-GCM', length: AES_KEY_LENGTH },
        false,
        ['encrypt', 'decrypt']
    );
}

/**
 * Legacy XOR key derivation for backward compatibility
 * @deprecated Will be removed after migration period
 */
async function deriveLegacyKey(passphrase) {
    const encoder = new TextEncoder();
    const data = encoder.encode(passphrase);

    if (window.crypto && window.crypto.subtle) {
        try {
            const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
            return Array.from(new Uint8Array(hashBuffer));
        } catch (e) {
            logger.warn('SubtleCrypto unavailable for legacy key');
        }
    }

    // Fallback: Simple hash function
    const hash = [];
    for (let i = 0; i < 32; i++) {
        let h = 0;
        for (let j = 0; j < passphrase.length; j++) {
            h = ((h << 5) - h) + passphrase.charCodeAt(j) + i;
            h = h & h;
        }
        hash.push(Math.abs(h) % 256);
    }
    return hash;
}

/**
 * Legacy XOR decryption for backward compatibility
 * @deprecated Will be removed after migration period
 */
async function decryptLegacyXOR(encryptedData) {
    const deviceKey = getDeviceKey();
    const keyBytes = await deriveLegacyKey(deviceKey);

    const encrypted = new Uint8Array(
        atob(encryptedData).split('').map(c => c.charCodeAt(0))
    );

    const decrypted = new Uint8Array(encrypted.length);
    for (let i = 0; i < encrypted.length; i++) {
        decrypted[i] = encrypted[i] ^ keyBytes[i % keyBytes.length];
    }

    const decoder = new TextDecoder();
    return decoder.decode(decrypted);
}

/**
 * Encrypt sensitive data for localStorage storage using AES-GCM
 * @param {string} data - Plain text data to encrypt
 * @returns {Promise<string>} Base64 encoded encrypted data with version prefix
 */
export async function encryptData(data) {
    if (!data) return '';

    try {
        // Check for Web Crypto API support
        if (!window.crypto || !window.crypto.subtle) {
            logger.error('Web Crypto API not available');
            return data;
        }

        const deviceKey = getDeviceKey();
        const key = await deriveAESKey(deviceKey);

        // Generate random IV
        const iv = window.crypto.getRandomValues(new Uint8Array(IV_LENGTH));

        // Encrypt the data
        const encoder = new TextEncoder();
        const encryptedBuffer = await window.crypto.subtle.encrypt(
            { name: 'AES-GCM', iv },
            key,
            encoder.encode(data)
        );

        // Combine IV + ciphertext
        const combined = new Uint8Array(iv.length + encryptedBuffer.byteLength);
        combined.set(iv);
        combined.set(new Uint8Array(encryptedBuffer), iv.length);

        // Convert to base64 with version prefix
        const base64 = btoa(String.fromCharCode(...combined));
        return VERSION_PREFIX + base64;
    } catch (e) {
        logger.error('Encryption failed:', e);
        return data; // Fallback to unencrypted
    }
}

/**
 * Decrypt data from localStorage
 * Supports v3 (user-specific salt), v2 (static salt), and legacy XOR format
 * @param {string} encryptedData - Base64 encoded encrypted data
 * @returns {Promise<string>} Decrypted plain text
 */
export async function decryptData(encryptedData) {
    if (!encryptedData) return '';

    try {
        // Check for Web Crypto API support
        if (!window.crypto || !window.crypto.subtle) {
            logger.error('Web Crypto API not available');
            return encryptedData;
        }

        // Check format version and decrypt accordingly
        if (encryptedData.startsWith(VERSION_PREFIX)) {
            // New v3 format with user-specific salt
            const base64Data = encryptedData.slice(VERSION_PREFIX.length);
            return await decryptAESGCM(base64Data);
        } else if (encryptedData.startsWith(LEGACY_VERSION_PREFIX)) {
            // Legacy v2 format with static salt - decrypt and re-encrypt with new format
            const base64Data = encryptedData.slice(LEGACY_VERSION_PREFIX.length);
            try {
                const decrypted = await decryptAESGCM(base64Data, 'productionos-v2');
                logger.debug('Decrypted legacy v2 data - will re-encrypt on next save');
                return decrypted;
            } catch (v2Error) {
                logger.debug('v2 decryption failed, trying as plain text');
            }
        } else {
            // Legacy XOR format - attempt migration
            try {
                const decrypted = await decryptLegacyXOR(encryptedData);
                // Validate decryption produced readable text
                if (decrypted && /^[\x20-\x7E\s]+$/.test(decrypted)) {
                    logger.debug('Decrypted legacy XOR data successfully');
                    return decrypted;
                }
            } catch (legacyError) {
                logger.debug('Legacy decryption failed, trying as plain text');
            }
        }
        // If all decryption fails, return as-is (might be unencrypted)
        return encryptedData;
    } catch (e) {
        logger.error('Decryption failed:', e);
        return encryptedData; // Fallback to returning as-is
    }
}

/**
 * Decrypt AES-GCM encrypted data
 * @param {string} base64Data - Base64 encoded IV + ciphertext
 * @param {string} legacySalt - Optional legacy salt for v2 format migration
 * @returns {Promise<string>} Decrypted plain text
 */
async function decryptAESGCM(base64Data, legacySalt = null) {
    const deviceKey = getDeviceKey();
    const key = await deriveAESKey(deviceKey, legacySalt);

    // Decode from base64
    const combined = new Uint8Array(
        atob(base64Data).split('').map(c => c.charCodeAt(0))
    );

    // Extract IV and ciphertext
    const iv = combined.slice(0, IV_LENGTH);
    const ciphertext = combined.slice(IV_LENGTH);

    // Decrypt
    const decryptedBuffer = await window.crypto.subtle.decrypt(
        { name: 'AES-GCM', iv },
        key,
        ciphertext
    );

    const decoder = new TextDecoder();
    return decoder.decode(decryptedBuffer);
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
    logger.warn(
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
    logger.debug('[SECURITY]', timestamp, event, details);

    // In production, you would send this to a logging service
    // Example: sendToLoggingService({ timestamp, event, details });
}
