/**
 * Rate Limiting Utility for Supabase Edge Functions
 * SECURITY: Prevents API abuse by limiting request frequency per user/endpoint
 */

import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';

export interface RateLimitConfig {
    limit: number;           // Maximum requests allowed
    windowMs: number;        // Time window in milliseconds
    endpoint: string;        // Endpoint identifier
}

export interface RateLimitResult {
    allowed: boolean;
    remaining: number;
    resetAt: Date;
    error?: string;
}

// Default rate limits per endpoint
export const RATE_LIMITS: Record<string, RateLimitConfig> = {
    'google-oauth-callback': { limit: 10, windowMs: 3600000, endpoint: 'google-oauth-callback' },
    'microsoft-oauth-callback': { limit: 10, windowMs: 3600000, endpoint: 'microsoft-oauth-callback' },
    'send-invitation-email': { limit: 20, windowMs: 3600000, endpoint: 'send-invitation-email' },
    'gmail-send': { limit: 50, windowMs: 3600000, endpoint: 'gmail-send' },
    'gmail-sync': { limit: 60, windowMs: 3600000, endpoint: 'gmail-sync' },
    'microsoft-send': { limit: 50, windowMs: 3600000, endpoint: 'microsoft-send' },
    'microsoft-sync': { limit: 60, windowMs: 3600000, endpoint: 'microsoft-sync' },
    'generate-commercial-tasks': { limit: 100, windowMs: 3600000, endpoint: 'generate-commercial-tasks' },
    'generate-sop': { limit: 50, windowMs: 3600000, endpoint: 'generate-sop' },
    'create-checkout-session': { limit: 10, windowMs: 3600000, endpoint: 'create-checkout-session' },
    'calendar-sync': { limit: 60, windowMs: 3600000, endpoint: 'calendar-sync' },
};

/**
 * Check if a request is within rate limits
 * Uses Supabase to track request counts with sliding window
 */
export async function checkRateLimit(
    supabase: SupabaseClient,
    userId: string,
    endpoint: string,
    customConfig?: Partial<RateLimitConfig>
): Promise<RateLimitResult> {
    const config = {
        ...RATE_LIMITS[endpoint] || { limit: 100, windowMs: 3600000, endpoint },
        ...customConfig,
    };

    const windowStart = new Date(Date.now() - config.windowMs);
    const resetAt = new Date(Date.now() + config.windowMs);

    try {
        // Count requests in current window
        const { count, error: countError } = await supabase
            .from('rate_limit_tracker')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', userId)
            .eq('endpoint', endpoint)
            .gte('created_at', windowStart.toISOString());

        if (countError) {
            console.error('Rate limit check error:', countError);
            // SECURITY: Fail open for rate limiting to avoid blocking legitimate users
            // But log for monitoring
            return { allowed: true, remaining: config.limit, resetAt };
        }

        const currentCount = count || 0;
        const remaining = Math.max(0, config.limit - currentCount);

        if (currentCount >= config.limit) {
            return {
                allowed: false,
                remaining: 0,
                resetAt,
                error: `Rate limit exceeded. Try again after ${resetAt.toISOString()}`,
            };
        }

        // Log this request
        await supabase.from('rate_limit_tracker').insert({
            user_id: userId,
            endpoint,
            created_at: new Date().toISOString(),
        });

        return { allowed: true, remaining: remaining - 1, resetAt };

    } catch (error) {
        console.error('Rate limit error:', error);
        // SECURITY: Fail open but log
        return { allowed: true, remaining: config.limit, resetAt };
    }
}

/**
 * Create rate limit response headers
 */
export function rateLimitHeaders(result: RateLimitResult): Record<string, string> {
    return {
        'X-RateLimit-Remaining': result.remaining.toString(),
        'X-RateLimit-Reset': result.resetAt.toISOString(),
    };
}

/**
 * Create a 429 Too Many Requests response
 */
export function rateLimitExceededResponse(result: RateLimitResult, corsHeaders: Record<string, string> = {}): Response {
    return new Response(
        JSON.stringify({
            error: 'Too Many Requests',
            message: result.error,
            retryAfter: result.resetAt.toISOString(),
        }),
        {
            status: 429,
            headers: {
                ...corsHeaders,
                'Content-Type': 'application/json',
                ...rateLimitHeaders(result),
                'Retry-After': Math.ceil((result.resetAt.getTime() - Date.now()) / 1000).toString(),
            },
        }
    );
}

/**
 * Clean up old rate limit records (run periodically)
 */
export async function cleanupRateLimitRecords(
    supabase: SupabaseClient,
    olderThanHours: number = 24
): Promise<number> {
    const cutoff = new Date(Date.now() - olderThanHours * 60 * 60 * 1000);

    const { count, error } = await supabase
        .from('rate_limit_tracker')
        .delete()
        .lt('created_at', cutoff.toISOString());

    if (error) {
        console.error('Rate limit cleanup error:', error);
        return 0;
    }

    return count || 0;
}
