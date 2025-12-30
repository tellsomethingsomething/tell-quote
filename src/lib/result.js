/**
 * Result Pattern for Consistent Error Handling
 *
 * Standard pattern for services to return success/failure
 * without throwing exceptions for expected errors.
 *
 * Usage:
 *   import { Result, ErrorCodes } from '../lib/result';
 *
 *   // Success
 *   return Result.ok(data);
 *
 *   // Failure
 *   return Result.fail(ErrorCodes.NOT_FOUND, 'User not found');
 *
 *   // Checking results
 *   const result = await someService();
 *   if (result.isOk()) {
 *       console.log(result.value);
 *   } else {
 *       console.error(result.error.message);
 *   }
 */

/**
 * Standard error codes for the application
 */
export const ErrorCodes = {
    // General
    UNKNOWN: 'UNKNOWN',
    INVALID_INPUT: 'INVALID_INPUT',
    NOT_FOUND: 'NOT_FOUND',
    ALREADY_EXISTS: 'ALREADY_EXISTS',
    OPERATION_FAILED: 'OPERATION_FAILED',

    // Authentication
    NOT_AUTHENTICATED: 'NOT_AUTHENTICATED',
    NOT_AUTHORIZED: 'NOT_AUTHORIZED',
    SESSION_EXPIRED: 'SESSION_EXPIRED',
    INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
    RATE_LIMITED: 'RATE_LIMITED',

    // Organization
    NO_ORGANIZATION: 'NO_ORGANIZATION',
    INVALID_ORGANIZATION: 'INVALID_ORGANIZATION',
    MEMBER_NOT_FOUND: 'MEMBER_NOT_FOUND',

    // Billing
    SUBSCRIPTION_REQUIRED: 'SUBSCRIPTION_REQUIRED',
    PAYMENT_FAILED: 'PAYMENT_FAILED',
    LIMIT_EXCEEDED: 'LIMIT_EXCEEDED',

    // Database
    DATABASE_ERROR: 'DATABASE_ERROR',
    DATABASE_NOT_CONFIGURED: 'DATABASE_NOT_CONFIGURED',
    CONSTRAINT_VIOLATION: 'CONSTRAINT_VIOLATION',

    // Network
    NETWORK_ERROR: 'NETWORK_ERROR',
    TIMEOUT: 'TIMEOUT',
    SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',

    // Validation
    VALIDATION_ERROR: 'VALIDATION_ERROR',
    MISSING_REQUIRED_FIELD: 'MISSING_REQUIRED_FIELD',
    INVALID_FORMAT: 'INVALID_FORMAT',
};

/**
 * Error information structure
 */
class ResultError {
    constructor(code, message, details = null) {
        this.code = code;
        this.message = message;
        this.details = details;
        this.timestamp = new Date().toISOString();
    }

    /**
     * Convert to plain object for serialization
     */
    toJSON() {
        return {
            code: this.code,
            message: this.message,
            details: this.details,
            timestamp: this.timestamp,
        };
    }
}

/**
 * Result class implementing the Result pattern
 */
export class Result {
    constructor(isSuccess, value = null, error = null) {
        this._isSuccess = isSuccess;
        this._value = value;
        this._error = error;

        // Freeze to prevent modification
        Object.freeze(this);
    }

    /**
     * Check if the result is successful
     */
    isOk() {
        return this._isSuccess;
    }

    /**
     * Check if the result is a failure
     */
    isFail() {
        return !this._isSuccess;
    }

    /**
     * Get the success value
     * @throws Error if result is a failure
     */
    get value() {
        if (!this._isSuccess) {
            throw new Error(`Cannot get value of failed result: ${this._error?.message}`);
        }
        return this._value;
    }

    /**
     * Get the error information
     * @throws Error if result is successful
     */
    get error() {
        if (this._isSuccess) {
            throw new Error('Cannot get error of successful result');
        }
        return this._error;
    }

    /**
     * Get value or default if failed
     */
    valueOr(defaultValue) {
        return this._isSuccess ? this._value : defaultValue;
    }

    /**
     * Map the success value through a function
     * @param {Function} fn - Function to apply to value
     * @returns {Result}
     */
    map(fn) {
        if (this._isSuccess) {
            return Result.ok(fn(this._value));
        }
        return this;
    }

    /**
     * Chain with another Result-returning function
     * @param {Function} fn - Function returning Result
     * @returns {Result}
     */
    flatMap(fn) {
        if (this._isSuccess) {
            return fn(this._value);
        }
        return this;
    }

    /**
     * Execute callback if successful
     * @param {Function} fn - Callback function
     * @returns {Result} - Returns self for chaining
     */
    onOk(fn) {
        if (this._isSuccess) {
            fn(this._value);
        }
        return this;
    }

    /**
     * Execute callback if failed
     * @param {Function} fn - Callback function
     * @returns {Result} - Returns self for chaining
     */
    onFail(fn) {
        if (!this._isSuccess) {
            fn(this._error);
        }
        return this;
    }

    /**
     * Match pattern - execute different callbacks for success/failure
     * @param {Object} handlers - { ok: fn, fail: fn }
     * @returns {*} Result of the called handler
     */
    match({ ok, fail }) {
        if (this._isSuccess) {
            return ok(this._value);
        }
        return fail(this._error);
    }

    /**
     * Convert to plain object
     */
    toJSON() {
        if (this._isSuccess) {
            return { success: true, value: this._value };
        }
        return { success: false, error: this._error.toJSON() };
    }

    // Static factory methods

    /**
     * Create a successful result
     * @param {*} value - The success value
     */
    static ok(value = null) {
        return new Result(true, value, null);
    }

    /**
     * Create a failed result
     * @param {string} code - Error code from ErrorCodes
     * @param {string} message - Human-readable error message
     * @param {*} details - Additional error details
     */
    static fail(code, message, details = null) {
        return new Result(false, null, new ResultError(code, message, details));
    }

    /**
     * Create result from an exception
     * @param {Error} error - Caught exception
     * @param {string} code - Error code to use
     */
    static fromException(error, code = ErrorCodes.UNKNOWN) {
        return Result.fail(code, error.message, { stack: error.stack });
    }

    /**
     * Wrap an async function to return Result instead of throwing
     * @param {Function} fn - Async function to wrap
     * @param {string} errorCode - Error code if function throws
     */
    static async fromAsync(fn, errorCode = ErrorCodes.OPERATION_FAILED) {
        try {
            const value = await fn();
            return Result.ok(value);
        } catch (error) {
            return Result.fromException(error, errorCode);
        }
    }

    /**
     * Combine multiple Results - all must succeed
     * @param {Result[]} results - Array of Results
     * @returns {Result} - Ok with array of values, or first failure
     */
    static all(results) {
        const values = [];
        for (const result of results) {
            if (result.isFail()) {
                return result;
            }
            values.push(result.value);
        }
        return Result.ok(values);
    }

    /**
     * Convert legacy { success, error, data } pattern to Result
     * @param {Object} response - Legacy response object
     */
    static fromLegacy(response) {
        if (response.success || response.data !== undefined) {
            return Result.ok(response.data || response);
        }
        return Result.fail(
            ErrorCodes.OPERATION_FAILED,
            response.error || response.message || 'Operation failed'
        );
    }
}

export default Result;
