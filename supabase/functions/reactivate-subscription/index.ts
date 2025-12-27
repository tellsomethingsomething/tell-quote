// Supabase Edge Function: Reactivate Subscription
// Reactivates a subscription that was set to cancel at period end
// Only works for subscriptions that haven't actually been canceled yet

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

        const { subscriptionId } = await req.json();

        if (!subscriptionId) {
            throw new Error('Missing required parameter: subscriptionId');
        }

        // Get admin client for database operations
        const supabaseAdmin = createClient(
            Deno.env.get('SUPABASE_URL')!,
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
        );

        // Verify user has permission to reactivate this subscription
        const { data: subscription, error: subError } = await supabaseAdmin
            .from('subscriptions')
            .select('organization_id, stripe_subscription_id, status')
            .eq('stripe_subscription_id', subscriptionId)
            .single();

        if (subError || !subscription) {
            throw new Error('Subscription not found');
        }

        // Check if user is owner/admin of the organization
        const { data: member } = await supabaseAdmin
            .from('organization_members')
            .select('role')
            .eq('organization_id', subscription.organization_id)
            .eq('user_id', user.id)
            .single();

        if (!member || !['owner', 'admin'].includes(member.role)) {
            throw new Error('Only organization owners or admins can reactivate subscriptions');
        }

        // Check current Stripe subscription status
        const stripeSubscription = await stripe.subscriptions.retrieve(subscriptionId);

        // Can only reactivate if:
        // 1. Subscription is still active and set to cancel at period end
        // 2. Or subscription is in a reactivatable state
        if (stripeSubscription.status === 'canceled') {
            throw new Error('This subscription has already been fully canceled. Please start a new subscription.');
        }

        if (!stripeSubscription.cancel_at_period_end && stripeSubscription.status === 'active') {
            throw new Error('This subscription is already active and not pending cancellation.');
        }

        // Reactivate the subscription (remove cancel_at_period_end)
        const reactivatedSubscription = await stripe.subscriptions.update(subscriptionId, {
            cancel_at_period_end: false,
            metadata: {
                reactivated_by: user.id,
                reactivated_at: new Date().toISOString(),
            },
        });

        // Update local subscription record
        await supabaseAdmin
            .from('subscriptions')
            .update({
                cancel_at_period_end: false,
                canceled_at: null,
                status: reactivatedSubscription.status,
            })
            .eq('stripe_subscription_id', subscriptionId);

        // Update organization status
        await supabaseAdmin
            .from('organizations')
            .update({
                subscription_status: reactivatedSubscription.status,
            })
            .eq('id', subscription.organization_id);

        // Log the reactivation
        await supabaseAdmin.from('audit_logs').insert({
            organization_id: subscription.organization_id,
            user_id: user.id,
            action: 'subscription_reactivated',
            entity_type: 'subscription',
            entity_id: subscriptionId,
            details: {
                status: reactivatedSubscription.status,
                current_period_end: new Date(reactivatedSubscription.current_period_end * 1000).toISOString(),
            },
        });

        return new Response(
            JSON.stringify({
                success: true,
                status: reactivatedSubscription.status,
                currentPeriodEnd: new Date(reactivatedSubscription.current_period_end * 1000).toISOString(),
            }),
            {
                status: 200,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
        );
    } catch (error) {
        console.error('Error reactivating subscription:', error);
        return new Response(
            JSON.stringify({ error: error.message }),
            {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
        );
    }
});
