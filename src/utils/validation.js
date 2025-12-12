// Form validation utilities

/**
 * Validates that a value is not empty (after trimming whitespace)
 */
export function validateRequired(value, fieldName = 'This field') {
    const trimmed = (value || '').toString().trim();
    if (!trimmed) {
        return { valid: false, error: `${fieldName} is required` };
    }
    return { valid: true, error: null };
}

/**
 * Validates email format
 */
export function validateEmail(value, required = false) {
    if (!value || !value.trim()) {
        return required
            ? { valid: false, error: 'Email is required' }
            : { valid: true, error: null };
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value.trim())) {
        return { valid: false, error: 'Please enter a valid email address' };
    }
    return { valid: true, error: null };
}

/**
 * Validates phone number (basic format check)
 */
export function validatePhone(value, required = false) {
    if (!value || !value.trim()) {
        return required
            ? { valid: false, error: 'Phone number is required' }
            : { valid: true, error: null };
    }

    // Allow digits, spaces, dashes, parentheses, and plus sign
    const phoneRegex = /^[\d\s\-\+\(\)]+$/;
    const digitsOnly = value.replace(/\D/g, '');

    if (!phoneRegex.test(value)) {
        return { valid: false, error: 'Phone number contains invalid characters' };
    }

    if (digitsOnly.length < 7) {
        return { valid: false, error: 'Phone number is too short' };
    }

    if (digitsOnly.length > 15) {
        return { valid: false, error: 'Phone number is too long' };
    }

    return { valid: true, error: null };
}

/**
 * Validates URL format
 */
export function validateUrl(value, required = false) {
    if (!value || !value.trim()) {
        return required
            ? { valid: false, error: 'URL is required' }
            : { valid: true, error: null };
    }

    // Add protocol if missing
    let urlToTest = value.trim();
    if (!urlToTest.startsWith('http://') && !urlToTest.startsWith('https://')) {
        urlToTest = 'https://' + urlToTest;
    }

    try {
        new URL(urlToTest);
        return { valid: true, error: null };
    } catch {
        return { valid: false, error: 'Please enter a valid URL' };
    }
}

/**
 * Validates a number is within range
 */
export function validateNumber(value, options = {}) {
    const { min, max, required = false, fieldName = 'Value' } = options;

    if (value === '' || value === null || value === undefined) {
        return required
            ? { valid: false, error: `${fieldName} is required` }
            : { valid: true, error: null };
    }

    const num = parseFloat(value);

    if (isNaN(num)) {
        return { valid: false, error: `${fieldName} must be a valid number` };
    }

    if (min !== undefined && num < min) {
        return { valid: false, error: `${fieldName} must be at least ${min}` };
    }

    if (max !== undefined && num > max) {
        return { valid: false, error: `${fieldName} must be at most ${max}` };
    }

    return { valid: true, error: null };
}

/**
 * Validates minimum length
 */
export function validateMinLength(value, minLength, fieldName = 'This field') {
    const trimmed = (value || '').toString().trim();
    if (trimmed.length < minLength) {
        return {
            valid: false,
            error: `${fieldName} must be at least ${minLength} characters`
        };
    }
    return { valid: true, error: null };
}

/**
 * Validates maximum length
 */
export function validateMaxLength(value, maxLength, fieldName = 'This field') {
    const str = (value || '').toString();
    if (str.length > maxLength) {
        return {
            valid: false,
            error: `${fieldName} must be at most ${maxLength} characters`
        };
    }
    return { valid: true, error: null };
}

/**
 * Validates a form object against a schema
 * @param {Object} data - The form data to validate
 * @param {Object} schema - Validation rules { fieldName: { required, email, phone, url, min, max, minLength, maxLength } }
 * @returns {Object} { isValid, errors }
 */
export function validateForm(data, schema) {
    const errors = {};
    let isValid = true;

    for (const [field, rules] of Object.entries(schema)) {
        const value = data[field];
        const fieldLabel = rules.label || field;

        // Required check
        if (rules.required) {
            const result = validateRequired(value, fieldLabel);
            if (!result.valid) {
                errors[field] = result.error;
                isValid = false;
                continue; // Skip other validations if required fails
            }
        }

        // Skip other validations if value is empty and not required
        if (!value && !rules.required) continue;

        // Email validation
        if (rules.email) {
            const result = validateEmail(value, rules.required);
            if (!result.valid) {
                errors[field] = result.error;
                isValid = false;
                continue;
            }
        }

        // Phone validation
        if (rules.phone) {
            const result = validatePhone(value, rules.required);
            if (!result.valid) {
                errors[field] = result.error;
                isValid = false;
                continue;
            }
        }

        // URL validation
        if (rules.url) {
            const result = validateUrl(value, rules.required);
            if (!result.valid) {
                errors[field] = result.error;
                isValid = false;
                continue;
            }
        }

        // Number validation
        if (rules.number || rules.min !== undefined || rules.max !== undefined) {
            const result = validateNumber(value, {
                min: rules.min,
                max: rules.max,
                required: rules.required,
                fieldName: fieldLabel
            });
            if (!result.valid) {
                errors[field] = result.error;
                isValid = false;
                continue;
            }
        }

        // Min length
        if (rules.minLength) {
            const result = validateMinLength(value, rules.minLength, fieldLabel);
            if (!result.valid) {
                errors[field] = result.error;
                isValid = false;
                continue;
            }
        }

        // Max length
        if (rules.maxLength) {
            const result = validateMaxLength(value, rules.maxLength, fieldLabel);
            if (!result.valid) {
                errors[field] = result.error;
                isValid = false;
                continue;
            }
        }
    }

    return { isValid, errors };
}

/**
 * Sanitizes a string by trimming and removing dangerous characters
 */
export function sanitizeString(value) {
    if (!value || typeof value !== 'string') return '';
    return value.trim();
}

/**
 * Sanitizes a number input
 */
export function sanitizeNumber(value, defaultValue = 0) {
    const num = parseFloat(value);
    return isNaN(num) ? defaultValue : num;
}
