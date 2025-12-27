// Supabase Edge Function: Cancel Subscription
// Cancels a Stripe subscription at the end of the billing period
// (Doesn't immediately cancel - allows user to continue until period ends)

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

        const { subscriptionId, reason, feedback } = await req.json();

        if (!subscriptionId) {
            throw new Error('Missing required parameter: subscriptionId');
        }

        // Get admin client for database operations
        const supabaseAdmin = createClient(
            Deno.env.get('SUPABASE_URL')!,
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
        );

        // Verify user has permission to cancel this subscription
        const { data: subscription, error: subError } = await supabaseAdmin
            .from('subscriptions')
            .select('organization_id, stripe_subscription_id')
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
            throw new Error('Only organization owners or admins can cancel subscriptions');
        }

        // Cancel subscription at period end (not immediately)
        const canceledSubscription = await stripe.subscriptions.update(subscriptionId, {
            cancel_at_period_end: true,
            metadata: {
                canceled_by: user.id,
                canceled_at: new Date().toISOString(),
                cancel_reason: reason || 'not_specified',
            },
        });

        // Update local subscription record
        await supabaseAdmin
            .from('subscriptions')
            .update({
                cancel_at_period_end: true,
                canceled_at: new Date().toISOString(),
            })
            .eq('stripe_subscription_id', subscriptionId);

        // Log the cancellation in audit logs
        await supabaseAdmin.from('audit_logs').insert({
            organization_id: subscription.organization_id,
            user_id: user.id,
            action: 'subscription_canceled',
            entity_type: 'subscription',
            entity_id: subscriptionId,
            details: {
                reason,
                feedback,
                cancel_at: canceledSubscription.cancel_at
                    ? new Date(canceledSubscription.cancel_at * 1000).toISOString()
                    : null,
                current_period_end: new Date(canceledSubscription.current_period_end * 1000).toISOString(),
            },
        });

        // Store feedback if provided
        if (feedback) {
            await supabaseAdmin.from('cancellation_feedback').insert({
                organization_id: subscription.organization_id,
                user_id: user.id,
                subscription_id: subscriptionId,
                reason,
                feedback,
            }).catch(() => {
                // Table might not exist, that's ok
                console.log('Cancellation feedback table not found, skipping feedback storage');
            });
        }

        return new Response(
            JSON.stringify({
                success: true,
                cancelAt: canceledSubscription.cancel_at
                    ? new Date(canceledSubscription.cancel_at * 1000).toISOString()
                    : null,
                currentPeriodEnd: new Date(canceledSubscription.current_period_end * 1000).toISOString(),
            }),
            {
                status: 200,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
        );
    } catch (error) {
        console.error('Error canceling subscription:', error);
        return new Response(
            JSON.stringify({ error: error.message }),
            {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
        );
    }
});
