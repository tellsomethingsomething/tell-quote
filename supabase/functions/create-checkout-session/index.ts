// Follow Supabase Edge Functions setup: https://supabase.com/docs/guides/functions
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';
import Stripe from 'https://esm.sh/stripe@13.10.0?target=deno';

import { getCorsHeaders, handleCorsPrelight } from '../_shared/cors.ts';

// SECURITY: CORS headers are now dynamically generated based on request origin
// See _shared/cors.ts for allowed origins configuration

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, {
    apiVersion: '2023-10-16',
    httpClient: Stripe.createFetchHttpClient(),
});

serve(async (req: Request) => {
    const corsHeaders = getCorsHeaders(req);

    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        return handleCorsPrelight(req);
    }

    try {
        // Verify auth token
        const authHeader = req.headers.get('Authorization');
        if (!authHeader) {
            throw new Error('Missing authorization header');
        }

        const supabase = createClient(
            Deno.env.get('SUPABASE_URL')!,
            Deno.env.get('SUPABASE_ANON_KEY')!,
            { global: { headers: { Authorization: authHeader } } }
        );

        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            throw new Error('Not authenticated');
        }

        const { priceId, organizationId, successUrl, cancelUrl, mode = 'subscription', tier = 'tier1', currency = 'USD' } = await req.json();

        if (!priceId || !organizationId) {
            throw new Error('Missing required parameters');
        }

        // Define allowed countries per pricing tier (for card country validation)
        const TIER_COUNTRIES: Record<string, string[]> = {
            tier1: ['US', 'GB', 'DE', 'FR', 'IT', 'ES', 'NL', 'BE', 'AT', 'IE', 'FI', 'PT',
                    'AU', 'CA', 'JP', 'CH', 'NO', 'DK', 'SE', 'LU', 'IS'],
            tier2: ['SG', 'AE', 'IL', 'KR', 'NZ', 'HK', 'QA', 'KW', 'BH', 'OM', 'SA'],
            tier3: ['MY', 'TH', 'MX', 'BR', 'PL', 'CZ', 'HU', 'TW', 'CL', 'AR', 'CR', 'PA', 'UY'],
            tier4: ['IN', 'ID', 'PH', 'VN', 'ZA', 'CO', 'PE', 'UA', 'RO', 'BG', 'RS', 'HR', 'SK', 'LV', 'LT', 'EE'],
            tier5: ['PK', 'BD', 'NG', 'KE', 'EG', 'ET', 'GH', 'TZ', 'UG', 'ZW', 'ZM', 'MW', 'NP', 'MM', 'KH', 'LA'],
        };

        // Validate mode
        if (mode !== 'subscription' && mode !== 'payment') {
            throw new Error('Invalid mode. Must be "subscription" or "payment"');
        }

        // Get or create Stripe customer
        const supabaseAdmin = createClient(
            Deno.env.get('SUPABASE_URL')!,
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
        );

        const { data: org } = await supabaseAdmin
            .from('organizations')
            .select('stripe_customer_id, name')
            .eq('id', organizationId)
            .single();

        let customerId = org?.stripe_customer_id;

        if (!customerId) {
            // Create new Stripe customer
            const customer = await stripe.customers.create({
                email: user.email,
                name: org?.name || user.email,
                metadata: {
                    organizationId,
                    userId: user.id,
                },
            });

            customerId = customer.id;

            // Save customer ID to organization
            await supabaseAdmin
                .from('organizations')
                .update({ stripe_customer_id: customerId })
                .eq('id', organizationId);
        }

        // Get allowed countries for this tier (used for Stripe Radar rules)
        const allowedCountries = TIER_COUNTRIES[tier] || TIER_COUNTRIES.tier1;

        // Build checkout session options
        const sessionOptions: any = {
            customer: customerId,
            mode,
            payment_method_types: ['card'],
            line_items: [
                {
                    price: priceId,
                    quantity: 1,
                },
            ],
            success_url: successUrl,
            cancel_url: cancelUrl,
            metadata: {
                organizationId,
                userId: user.id,
                pricing_tier: tier,
                pricing_currency: currency,
                allowed_countries: allowedCountries.join(','),
            },
            allow_promotion_codes: true,
        };

        // Add subscription_data with tier info for subscription mode
        if (mode === 'subscription') {
            sessionOptions.subscription_data = {
                metadata: {
                    organizationId,
                    userId: user.id,
                    pricing_tier: tier,
                    pricing_currency: currency,
                    allowed_countries: allowedCountries.join(','),
                },
            };
        }

        // Add payment_intent_data for card country validation
        // This metadata can be used by Stripe Radar rules or webhook validation
        if (tier !== 'tier1') {
            sessionOptions.payment_intent_data = {
                metadata: {
                    pricing_tier: tier,
                    allowed_countries: allowedCountries.join(','),
                    requires_country_validation: 'true',
                },
            };
        }

        // Create checkout session
        const session = await stripe.checkout.sessions.create(sessionOptions);

        return new Response(
            JSON.stringify({ url: session.url }),
            {
                status: 200,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
        );
    } catch (error) {
        console.error('Error creating checkout session:', error);
        return new Response(
            JSON.stringify({ error: error.message }),
            {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
        );
    }
});
