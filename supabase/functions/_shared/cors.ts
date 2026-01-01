/**
 * Shared CORS configuration for Supabase Edge Functions
 * SECURITY: Only allow specific origins instead of wildcard
 */

// Allowed origins for CORS
const ALLOWED_ORIGINS = [
    'https://productionos.io',
    'https://www.productionos.io',
    'https://tell-quote.vercel.app',
    // Add localhost for development
    'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:3000',
];

/**
 * Get CORS headers for a request
 * Returns appropriate Access-Control-Allow-Origin based on request origin
 */
export function getCorsHeaders(req: Request): Record<string, string> {
    const origin = req.headers.get('origin') || '';

    // Check if origin is allowed
    const isAllowed = ALLOWED_ORIGINS.includes(origin) ||
        // Allow Vercel preview deployments
        origin.endsWith('.vercel.app') ||
        // Allow Supabase Studio
        origin.includes('supabase.co');

    return {
        'Access-Control-Allow-Origin': isAllowed ? origin : ALLOWED_ORIGINS[0],
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Max-Age': '86400',
    };
}

/**
 * Handle CORS preflight request
 */
export function handleCorsPrelight(req: Request): Response {
    return new Response('ok', { headers: getCorsHeaders(req) });
}

/**
 * Legacy corsHeaders constant for backward compatibility
 * @deprecated Use getCorsHeaders(req) instead for proper origin validation
 */
export const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};
