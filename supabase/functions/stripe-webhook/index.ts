// Follow Supabase Edge Functions setup: https://supabase.com/docs/guides/functions
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';
import Stripe from 'https://esm.sh/stripe@13.10.0?target=deno';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, {
    apiVersion: '2023-10-16',
    httpClient: Stripe.createFetchHttpClient(),
});

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

serve(async (req: Request) => {
    const signature = req.headers.get('stripe-signature');
    const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');

    if (!signature || !webhookSecret) {
        return new Response('Missing signature or webhook secret', { status: 400 });
    }

    const body = await req.text();

    let event: Stripe.Event;
    try {
        event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err) {
        console.error('Webhook signature verification failed:', err.message);
        return new Response(`Webhook Error: ${err.message}`, { status: 400 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    try {
        switch (event.type) {
            case 'checkout.session.completed': {
                const session = event.data.object as Stripe.Checkout.Session;
                await handleCheckoutComplete(supabase, session);
                break;
            }

            case 'customer.subscription.created':
            case 'customer.subscription.updated': {
                const subscription = event.data.object as Stripe.Subscription;
                await handleSubscriptionChange(supabase, subscription);
                break;
            }

            case 'customer.subscription.deleted': {
                const subscription = event.data.object as Stripe.Subscription;
                await handleSubscriptionDeleted(supabase, subscription);
                break;
            }

            case 'customer.subscription.trial_will_end': {
                // Triggered 3 days before trial ends (or less for short trials)
                const subscription = event.data.object as Stripe.Subscription;
                await handleTrialWillEnd(supabase, subscription);
                break;
            }

            case 'invoice.paid': {
                const invoice = event.data.object as Stripe.Invoice;
                await handleInvoicePaid(supabase, invoice);
                break;
            }

            case 'invoice.payment_failed': {
                const invoice = event.data.object as Stripe.Invoice;
                await handlePaymentFailed(supabase, invoice);
                break;
            }

            default:
                console.log(`Unhandled event type: ${event.type}`);
        }

        return new Response(JSON.stringify({ received: true }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        });
    } catch (err) {
        console.error('Error processing webhook:', err);
        return new Response(`Webhook handler error: ${err.message}`, { status: 500 });
    }
});

async function handleCheckoutComplete(supabase: any, session: Stripe.Checkout.Session) {
    const organizationId = session.metadata?.organizationId;
    const isTrialSignup = session.metadata?.trialSignup === 'true';

    if (!organizationId) {
        console.error('No organization ID in checkout session metadata');
        return;
    }

    // Calculate trial end if this is a trial signup
    const updateData: Record<string, any> = {
        stripe_customer_id: session.customer,
    };

    if (isTrialSignup) {
        // 48-hour trial
        const trialEnd = new Date();
        trialEnd.setHours(trialEnd.getHours() + 48);
        updateData.trial_ends_at = trialEnd.toISOString();
        updateData.subscription_status = 'trialing';
    }

    // Update organization with Stripe customer ID and trial info
    const { error } = await supabase
        .from('organizations')
        .update(updateData)
        .eq('id', organizationId);

    if (error) {
        console.error('Error updating organization:', error);
    }

    // Log the trial signup for analytics
    if (isTrialSignup) {
        await supabase.from('audit_logs').insert({
            organization_id: organizationId,
            user_id: session.metadata?.userId,
            action: 'trial_started',
            entity_type: 'subscription',
            entity_id: session.subscription,
            details: {
                plan: 'trial',
                checkout_session_id: session.id,
            },
        });
    }
}

async function handleSubscriptionChange(supabase: any, subscription: Stripe.Subscription) {
    const customerId = subscription.customer as string;

    // Find organization by Stripe customer ID
    const { data: org, error: orgError } = await supabase
        .from('organizations')
        .select('id, subscription_status')
        .eq('stripe_customer_id', customerId)
        .single();

    if (orgError || !org) {
        console.error('Organization not found for customer:', customerId);
        return;
    }

    // Determine plan from price ID
    const priceId = subscription.items.data[0]?.price.id;
    const planId = getPlanIdFromPriceId(priceId);

    // Detect trial → active conversion
    const wasTrialing = org.subscription_status === 'trialing';
    const isNowActive = subscription.status === 'active';
    const trialConverted = wasTrialing && isNowActive && !subscription.trial_end;

    // Upsert subscription record
    const subscriptionData = {
        id: subscription.id,
        organization_id: org.id,
        stripe_subscription_id: subscription.id,
        stripe_customer_id: customerId,
        status: subscription.status,
        plan_id: planId,
        current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
        current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
        cancel_at_period_end: subscription.cancel_at_period_end,
        canceled_at: subscription.canceled_at
            ? new Date(subscription.canceled_at * 1000).toISOString()
            : null,
        trial_end: subscription.trial_end
            ? new Date(subscription.trial_end * 1000).toISOString()
            : null,
    };

    const { error } = await supabase
        .from('subscriptions')
        .upsert(subscriptionData, { onConflict: 'stripe_subscription_id' });

    if (error) {
        console.error('Error upserting subscription:', error);
    }

    // Update organization subscription fields
    const orgUpdate: Record<string, any> = {
        subscription_tier: planId,
        subscription_status: subscription.status,
    };

    // Clear trial end date if trial has ended and subscription is active
    if (trialConverted) {
        orgUpdate.trial_ends_at = null;

        // Log trial conversion
        await supabase.from('audit_logs').insert({
            organization_id: org.id,
            action: 'trial_converted',
            entity_type: 'subscription',
            entity_id: subscription.id,
            details: {
                plan: planId,
                converted_at: new Date().toISOString(),
            },
        });

        console.log(`Trial converted to paid for org ${org.id}: ${planId}`);
    }

    // If still in trial, update trial end date
    if (subscription.status === 'trialing' && subscription.trial_end) {
        orgUpdate.trial_ends_at = new Date(subscription.trial_end * 1000).toISOString();
    }

    await supabase
        .from('organizations')
        .update(orgUpdate)
        .eq('id', org.id);
}

async function handleSubscriptionDeleted(supabase: any, subscription: Stripe.Subscription) {
    const { error } = await supabase
        .from('subscriptions')
        .update({ status: 'canceled' })
        .eq('stripe_subscription_id', subscription.id);

    if (error) {
        console.error('Error updating subscription status:', error);
    }

    // Update organization to free tier
    const customerId = subscription.customer as string;
    await supabase
        .from('organizations')
        .update({
            subscription_tier: 'free',
            subscription_status: 'canceled',
        })
        .eq('stripe_customer_id', customerId);
}

async function handleInvoicePaid(supabase: any, invoice: Stripe.Invoice) {
    const customerId = invoice.customer as string;

    // Find organization
    const { data: org } = await supabase
        .from('organizations')
        .select('id')
        .eq('stripe_customer_id', customerId)
        .single();

    if (!org) return;

    // Store invoice record
    const { error } = await supabase.from('billing_invoices').upsert({
        id: invoice.id,
        organization_id: org.id,
        stripe_invoice_id: invoice.id,
        amount: invoice.amount_paid,
        currency: invoice.currency,
        status: 'paid',
        description: invoice.lines.data[0]?.description || 'Subscription',
        invoice_pdf: invoice.invoice_pdf,
        created_at: new Date(invoice.created * 1000).toISOString(),
    }, { onConflict: 'stripe_invoice_id' });

    if (error) {
        console.error('Error storing invoice:', error);
    }
}

async function handlePaymentFailed(supabase: any, invoice: Stripe.Invoice) {
    const customerId = invoice.customer as string;

    // Update organization status
    await supabase
        .from('organizations')
        .update({ subscription_status: 'past_due' })
        .eq('stripe_customer_id', customerId);
}

async function handleTrialWillEnd(supabase: any, subscription: Stripe.Subscription) {
    const customerId = subscription.customer as string;

    // Find organization by Stripe customer ID
    const { data: org } = await supabase
        .from('organizations')
        .select('id, name')
        .eq('stripe_customer_id', customerId)
        .single();

    if (!org) {
        console.error('Organization not found for customer:', customerId);
        return;
    }

    // Calculate hours remaining
    const trialEnd = new Date(subscription.trial_end! * 1000);
    const now = new Date();
    const hoursRemaining = Math.ceil((trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60));

    // Log trial ending warning
    await supabase.from('audit_logs').insert({
        organization_id: org.id,
        action: 'trial_ending_soon',
        entity_type: 'subscription',
        entity_id: subscription.id,
        details: {
            hours_remaining: hoursRemaining,
            trial_ends_at: trialEnd.toISOString(),
        },
    });

    // Update organization to indicate trial is ending
    await supabase
        .from('organizations')
        .update({
            trial_ends_at: trialEnd.toISOString(),
            subscription_status: 'trialing',
        })
        .eq('id', org.id);

    // TODO: Trigger email notification to user about trial ending
    // This would typically call an email service or queue a notification
    console.log(`Trial ending soon for org ${org.id} (${org.name}): ${hoursRemaining} hours remaining`);
}

function getPlanIdFromPriceId(priceId: string): string {
    // Map Stripe price IDs to plan IDs
    const priceMap: Record<string, string> = {
        'price_starter_monthly': 'starter',
        'price_starter_yearly': 'starter',
        'price_professional_monthly': 'professional',
        'price_professional_yearly': 'professional',
        'price_enterprise_monthly': 'enterprise',
        'price_enterprise_yearly': 'enterprise',
    };

    return priceMap[priceId] || 'free';
}
