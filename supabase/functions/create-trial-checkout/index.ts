// Supabase Edge Function: Create Trial Checkout Session
// Creates a Stripe checkout session with a 5-day (120-hour) trial period
// Card is captured but not charged until trial ends

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

        const {
            priceId,
            organizationId,
            customerEmail,
            trialPeriodDays = 5, // 120 hours = 5 days
            successUrl,
            cancelUrl
        } = await req.json();

        if (!priceId || !organizationId) {
            throw new Error('Missing required parameters: priceId and organizationId');
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

        // Create or retrieve Stripe customer
        if (!customerId) {
            const customer = await stripe.customers.create({
                email: customerEmail || user.email,
                name: org?.name || customerEmail || user.email,
                metadata: {
                    organizationId,
                    userId: user.id,
                    source: 'trial_signup',
                },
            });

            customerId = customer.id;

            // Save customer ID to organization
            await supabaseAdmin
                .from('organizations')
                .update({
                    stripe_customer_id: customerId,
                    subscription_status: 'trialing',
                })
                .eq('id', organizationId);
        }

        // Calculate trial end time (5 days from now)
        const trialEnd = new Date();
        trialEnd.setDate(trialEnd.getDate() + trialPeriodDays);

        // Create checkout session with trial
        const session = await stripe.checkout.sessions.create({
            customer: customerId,
            mode: 'subscription',
            payment_method_types: ['card'],
            line_items: [
                {
                    price: priceId,
                    quantity: 1,
                },
            ],
            success_url: successUrl || `${req.headers.get('origin')}/?onboarding=complete&session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: cancelUrl || `${req.headers.get('origin')}/?onboarding=billing`,
            metadata: {
                organizationId,
                userId: user.id,
                trialSignup: 'true',
            },
            subscription_data: {
                trial_period_days: trialPeriodDays,
                metadata: {
                    organizationId,
                    userId: user.id,
                    trialSignup: 'true',
                },
            },
            // Collect payment method but don't charge yet
            payment_method_collection: 'always',
            // Allow promo codes during trial signup
            allow_promotion_codes: true,
            // Custom text for trial
            custom_text: {
                submit: {
                    message: `Start your ${trialPeriodDays}-day free trial. You won't be charged until the trial ends.`,
                },
            },
            // Consent for future charges after trial
            consent_collection: {
                terms_of_service: 'required',
            },
        });

        // Update organization with trial end date
        await supabaseAdmin
            .from('organizations')
            .update({
                trial_ends_at: trialEnd.toISOString(),
                subscription_status: 'trialing',
            })
            .eq('id', organizationId);

        return new Response(
            JSON.stringify({
                url: session.url,
                sessionId: session.id,
                trialEndsAt: trialEnd.toISOString(),
            }),
            {
                status: 200,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
        );
    } catch (error) {
        console.error('Error creating trial checkout session:', error);
        return new Response(
            JSON.stringify({ error: error.message }),
            {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
        );
    }
});
