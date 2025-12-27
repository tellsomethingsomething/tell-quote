// Supabase Edge Function: Create Setup Intent
// Creates a Stripe SetupIntent to collect payment method without charging
// Used for embedded payment forms during trial signup

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';
import Stripe from 'https://esm.sh/stripe@13.10.0?target=deno';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, {
    apiVersion: '2023-10-16',
    httpClient: Stripe.createFetchHttpClient(),
});

serve(async (req: Request) => {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
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

        const { organizationId, customerEmail } = await req.json();

        if (!organizationId) {
            throw new Error('Missing required parameter: organizationId');
        }

        // Get admin client for database operations
        const supabaseAdmin = createClient(
            Deno.env.get('SUPABASE_URL')!,
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
        );

        // Get organization details
        const { data: org } = await supabaseAdmin
            .from('organizations')
            .select('stripe_customer_id, name')
            .eq('id', organizationId)
            .single();

        let customerId = org?.stripe_customer_id;

        // Create Stripe customer if doesn't exist
        if (!customerId) {
            const customer = await stripe.customers.create({
                email: customerEmail || user.email,
                name: org?.name || customerEmail || user.email,
                metadata: {
                    organizationId,
                    userId: user.id,
                    source: 'setup_intent',
                },
            });

            customerId = customer.id;

            // Save customer ID to organization
            await supabaseAdmin
                .from('organizations')
                .update({ stripe_customer_id: customerId })
                .eq('id', organizationId);
        }

        // Create SetupIntent for future payments
        const setupIntent = await stripe.setupIntents.create({
            customer: customerId,
            payment_method_types: ['card'],
            usage: 'off_session', // Allow charging later without customer present
            metadata: {
                organizationId,
                userId: user.id,
            },
        });

        return new Response(
            JSON.stringify({
                clientSecret: setupIntent.client_secret,
                customerId: customerId,
                setupIntentId: setupIntent.id,
            }),
            {
                status: 200,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
        );
    } catch (error) {
        console.error('Error creating setup intent:', error);
        return new Response(
            JSON.stringify({ error: error.message }),
            {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
        );
    }
});
