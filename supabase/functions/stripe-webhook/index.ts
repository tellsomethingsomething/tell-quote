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

// Log webhook event to database for tracking and idempotency
async function logWebhookEvent(
    supabase: any,
    eventId: string,
    eventType: string,
    status: 'pending' | 'processing' | 'completed' | 'failed' | 'skipped',
    payload?: any,
    organizationId?: string,
    errorMessage?: string
) {
    try {
        const { error } = await supabase.from('webhook_events').upsert({
            stripe_event_id: eventId,
            event_type: eventType,
            status,
            payload: status === 'pending' ? payload : undefined, // Only store payload on initial insert
            organization_id: organizationId,
            error_message: errorMessage,
            processed_at: status === 'completed' || status === 'failed' ? new Date().toISOString() : null,
        }, {
            onConflict: 'stripe_event_id',
        });

        if (error) {
            console.error('Failed to log webhook event:', error);
        }
    } catch (err) {
        console.error('Error logging webhook event:', err);
    }
}

// Check if event has already been processed (idempotency)
async function isEventProcessed(supabase: any, eventId: string): Promise<boolean> {
    try {
        const { data, error } = await supabase
            .from('webhook_events')
            .select('status')
            .eq('stripe_event_id', eventId)
            .single();

        if (error && error.code !== 'PGRST116') { // PGRST116 = not found
            console.error('Error checking event status:', error);
            return false;
        }

        // Skip if already completed
        if (data?.status === 'completed') {
            console.log(`Event ${eventId} already processed, skipping`);
            return true;
        }

        return false;
    } catch (err) {
        console.error('Error checking event processed:', err);
        return false;
    }
}

serve(async (req: Request) => {
    const signature = req.headers.get('stripe-signature');
    const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');

    const body = await req.text();
    console.log('Webhook received. Body length:', body.length);
    console.log('Has signature:', !!signature, 'Has secret:', !!webhookSecret);

    let event: Stripe.Event;

    // Try signature verification first
    if (signature && webhookSecret) {
        try {
            event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
            console.log('Signature verified successfully. Event type:', event.type);
        } catch (err) {
            console.error('Signature verification failed:', err.message);
            console.error('Secret starts with:', webhookSecret.substring(0, 10));
            console.error('Signature starts with:', signature.substring(0, 30));

            // DEVELOPMENT ONLY: Parse event anyway for testing
            // Remove this fallback in production!
            const isDevelopment = Deno.env.get('ENVIRONMENT') !== 'production';
            if (isDevelopment) {
                console.warn('⚠️ BYPASSING signature verification (development mode)');
                try {
                    event = JSON.parse(body) as Stripe.Event;
                    console.log('Parsed event without verification. Type:', event.type);
                } catch (parseErr) {
                    return new Response('Invalid JSON', { status: 400 });
                }
            } else {
                return new Response('Webhook signature verification failed', { status: 400 });
            }
        }
    } else {
        // No signature or secret - check if this is development
        const isDevelopment = Deno.env.get('ENVIRONMENT') !== 'production';
        if (!isDevelopment && signature) {
            console.error('Missing webhook secret in production!');
            return new Response('Webhook configuration error', { status: 500 });
        }

        // Parse directly (for testing only)
        console.warn('⚠️ No signature verification (missing signature or secret)');
        try {
            event = JSON.parse(body) as Stripe.Event;
            console.log('Parsed event type:', event.type);
        } catch (parseErr) {
            return new Response('Invalid JSON', { status: 400 });
        }
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Idempotency check - skip if already processed
    const alreadyProcessed = await isEventProcessed(supabase, event.id);
    if (alreadyProcessed) {
        await logWebhookEvent(supabase, event.id, event.type, 'skipped');
        return new Response(JSON.stringify({ received: true, skipped: true }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        });
    }

    // Log event as pending (store payload for potential replay)
    await logWebhookEvent(supabase, event.id, event.type, 'pending', event.data.object);

    try {
        // Update status to processing
        await logWebhookEvent(supabase, event.id, event.type, 'processing');

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

            case 'charge.succeeded': {
                const charge = event.data.object as Stripe.Charge;
                await handleCardCountryValidation(charge);
                break;
            }

            default:
                console.log(`Unhandled event type: ${event.type}`);
        }

        // Log successful processing
        await logWebhookEvent(supabase, event.id, event.type, 'completed');

        return new Response(JSON.stringify({ received: true }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        });
    } catch (err) {
        console.error('Error processing webhook:', err);

        // Log failed processing with error message
        await logWebhookEvent(supabase, event.id, event.type, 'failed', undefined, undefined, err.message);

        // Increment retry count via RPC or raw SQL
        try {
            await supabase.rpc('increment_webhook_retry_count', {
                p_stripe_event_id: event.id
            });
        } catch (updateErr) {
            console.error('Error incrementing retry count:', updateErr);
        }

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

    // Check if this is a one-time payment (token pack) or subscription
    if (session.mode === 'payment') {
        // One-time payment - likely a token pack
        await handleTokenPackPurchase(supabase, session, organizationId);
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

async function handleTokenPackPurchase(supabase: any, session: Stripe.Checkout.Session, organizationId: string) {
    // Get line items to determine which token pack was purchased
    const lineItems = session.line_items?.data || [];

    for (const item of lineItems) {
        const priceId = item.price?.id;
        if (!priceId) continue;

        const tokensToAdd = getTokensFromPriceId(priceId);
        if (!tokensToAdd) continue;

        // Get current token balance
        const { data: org, error: orgError } = await supabase
            .from('organizations')
            .select('id, ai_tokens_purchased, ai_tokens_used')
            .eq('id', organizationId)
            .single();

        if (orgError || !org) {
            console.error('Error fetching organization for token purchase:', orgError);
            continue;
        }

        const currentPurchased = org.ai_tokens_purchased || 0;
        const newTotal = currentPurchased + tokensToAdd;

        // Update organization with new token balance
        const { error: updateError } = await supabase
            .from('organizations')
            .update({
                ai_tokens_purchased: newTotal,
                stripe_customer_id: session.customer,
            })
            .eq('id', organizationId);

        if (updateError) {
            console.error('Error updating token balance:', updateError);
            continue;
        }

        // Record the token purchase
        await supabase.from('token_purchases').insert({
            organization_id: organizationId,
            stripe_session_id: session.id,
            stripe_payment_intent: session.payment_intent,
            tokens_purchased: tokensToAdd,
            price_id: priceId,
            amount_paid: item.amount_total,
            currency: session.currency,
            created_at: new Date().toISOString(),
        });

        // Log the purchase for analytics
        await supabase.from('audit_logs').insert({
            organization_id: organizationId,
            user_id: session.metadata?.userId,
            action: 'tokens_purchased',
            entity_type: 'token_pack',
            entity_id: session.id,
            details: {
                tokens: tokensToAdd,
                price_id: priceId,
                amount: item.amount_total,
                currency: session.currency,
                new_balance: newTotal,
            },
        });

        console.log(`Added ${tokensToAdd} tokens to org ${organizationId}. New total: ${newTotal}`);
    }
}

// Monthly AI token allocations by plan
const PLAN_TOKEN_ALLOCATIONS: Record<string, number> = {
    'free': 0,
    'individual': 10000,
    'team': 50000,
};

async function handleSubscriptionChange(supabase: any, subscription: Stripe.Subscription) {
    const customerId = subscription.customer as string;

    // Find organization by Stripe customer ID
    const { data: org, error: orgError } = await supabase
        .from('organizations')
        .select('id, subscription_status, subscription_tier, ai_tokens_monthly_reset_at')
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

    // Check if this is a new billing period (for monthly token reset)
    const periodStart = new Date(subscription.current_period_start * 1000);
    const lastReset = org.ai_tokens_monthly_reset_at ? new Date(org.ai_tokens_monthly_reset_at) : null;
    const isNewPeriod = !lastReset || periodStart > lastReset;

    // Upsert subscription record
    const subscriptionData = {
        id: subscription.id,
        organization_id: org.id,
        stripe_subscription_id: subscription.id,
        stripe_customer_id: customerId,
        status: subscription.status,
        plan_id: planId,
        current_period_start: periodStart.toISOString(),
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

    // Reset monthly AI tokens on new billing period
    if (isNewPeriod && subscription.status === 'active') {
        const monthlyAllocation = PLAN_TOKEN_ALLOCATIONS[planId] || 0;
        orgUpdate.ai_tokens_monthly = monthlyAllocation;
        orgUpdate.ai_tokens_used_this_month = 0;
        orgUpdate.ai_tokens_monthly_reset_at = periodStart.toISOString();

        console.log(`Reset monthly tokens for org ${org.id}: ${monthlyAllocation} tokens (${planId} plan)`);
    }

    // Clear trial end date if trial has ended and subscription is active
    if (trialConverted) {
        orgUpdate.trial_ends_at = null;

        // Also allocate initial monthly tokens on trial conversion
        const monthlyAllocation = PLAN_TOKEN_ALLOCATIONS[planId] || 0;
        orgUpdate.ai_tokens_monthly = monthlyAllocation;
        orgUpdate.ai_tokens_used_this_month = 0;
        orgUpdate.ai_tokens_monthly_reset_at = new Date().toISOString();

        // Log trial conversion
        await supabase.from('audit_logs').insert({
            organization_id: org.id,
            action: 'trial_converted',
            entity_type: 'subscription',
            entity_id: subscription.id,
            details: {
                plan: planId,
                converted_at: new Date().toISOString(),
                tokens_allocated: monthlyAllocation,
            },
        });

        console.log(`Trial converted to paid for org ${org.id}: ${planId} with ${monthlyAllocation} tokens`);
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

// Stripe Price ID to Plan ID mapping
const PRICE_TO_PLAN: Record<string, string> = {
    // ===== LIVE MODE - TIER 1 (Full Price) =====
    // Individual Plan - USD
    'price_1Sj1XBLE30d1czmdCbD6Kg9V': 'individual', // Monthly
    'price_1Sj1XCLE30d1czmdi2UKwktG': 'individual', // Annual
    // Individual Plan - GBP
    'price_1Sj1XDLE30d1czmdWHrCT59f': 'individual', // Monthly
    'price_1Sj1XDLE30d1czmdGv9wtuLD': 'individual', // Annual
    // Individual Plan - EUR
    'price_1Sj1XELE30d1czmdO2Vz955B': 'individual', // Monthly
    'price_1Sj1XFLE30d1czmdwwDRbACg': 'individual', // Annual
    // Team Plan - USD
    'price_1Sj1XYLE30d1czmdzldBwYTB': 'team', // Monthly
    'price_1Sj1XYLE30d1czmdLUNjPxbg': 'team', // Annual
    // Team Plan - GBP
    'price_1Sj1XZLE30d1czmd2oBHlWtC': 'team', // Monthly
    'price_1Sj1XaLE30d1czmd5DsbtbFN': 'team', // Annual
    // Team Plan - EUR
    'price_1Sj1XaLE30d1czmdIAxyupGE': 'team', // Monthly
    'price_1Sj1XbLE30d1czmdkSIGXZCQ': 'team', // Annual

    // ===== LIVE MODE - TIER 2 ($20/$40) =====
    'price_1SjNHrLE30d1czmdygjzgQnx': 'individual', // Monthly $20
    'price_1SjNHsLE30d1czmdt7CLsthn': 'individual', // Annual $200
    'price_1SjNHsLE30d1czmdlucbT5dM': 'team', // Monthly $40
    'price_1SjNHtLE30d1czmd2XpDrr9A': 'team', // Annual $400

    // ===== LIVE MODE - TIER 3 ($12/$25) =====
    'price_1SjNI7LE30d1czmdIH20zKQX': 'individual', // Monthly $12
    'price_1SjNI7LE30d1czmdVdUlflim': 'individual', // Annual $120
    'price_1SjNI8LE30d1czmdyDAtpFGr': 'team', // Monthly $25
    'price_1SjNI9LE30d1czmdCGR4PY2g': 'team', // Annual $250

    // ===== LIVE MODE - TIER 4 ($8/$16) =====
    'price_1SjNIOLE30d1czmdgPMhfo4o': 'individual', // Monthly $8
    'price_1SjNIPLE30d1czmdEj0zT9Yc': 'individual', // Annual $80
    'price_1SjNIQLE30d1czmdO25rUJdT': 'team', // Monthly $16
    'price_1SjNIRLE30d1czmdZlEwEJPz': 'team', // Annual $160

    // ===== LIVE MODE - TIER 5 ($6/$12) =====
    'price_1SjNIgLE30d1czmdDrZE1lmT': 'individual', // Monthly $6
    'price_1SjNIhLE30d1czmdYwsZBuUF': 'individual', // Annual $60
    'price_1SjNIiLE30d1czmdutSGH32M': 'team', // Monthly $12
    'price_1SjNIjLE30d1czmdCFzkxKxm': 'team', // Annual $120

    // ===== LIVE MODE - LOCAL CURRENCIES =====
    // MYR (Malaysia)
    'price_1SjNIxLE30d1czmdcKoycTK1': 'individual', // Monthly RM55
    'price_1SjNIyLE30d1czmdrebRMoH4': 'individual', // Annual RM550
    'price_1SjNIzLE30d1czmdJRROuWyT': 'team', // Monthly RM115
    'price_1SjNJ0LE30d1czmdvFRXym7X': 'team', // Annual RM1150
    // SGD (Singapore)
    'price_1SjNJBLE30d1czmdq8v4Wr1h': 'individual', // Monthly S$27
    'price_1SjNJBLE30d1czmdQM1TijWE': 'individual', // Annual S$270
    'price_1SjNJCLE30d1czmdrLYsLdyL': 'team', // Monthly S$54
    'price_1SjNJDLE30d1czmdMchkOLWs': 'team', // Annual S$540
    // THB (Thailand)
    'price_1SjNJTLE30d1czmdEgcglf1j': 'individual', // Monthly ฿420
    'price_1SjNJTLE30d1czmdey99KeIQ': 'individual', // Annual ฿4200
    'price_1SjNJVLE30d1czmdhOHatiLI': 'team', // Monthly ฿880
    'price_1SjNJVLE30d1czmdzPIjf6Kg': 'team', // Annual ฿8800
    // INR (India)
    'price_1SjNJWLE30d1czmdeNnougdH': 'individual', // Monthly ₹650
    'price_1SjNJXLE30d1czmd5tY7qpoQ': 'individual', // Annual ₹6500
    'price_1SjNJYLE30d1czmdwLDQDwPk': 'team', // Monthly ₹1300
    'price_1SjNJZLE30d1czmdE9MZjJru': 'team', // Annual ₹13000
    // AUD (Australia)
    'price_1SjNJtLE30d1czmdNoD6M5kV': 'individual', // Monthly A$36
    'price_1SjNJuLE30d1czmdUrR8uR8j': 'individual', // Annual A$342
    'price_1SjNJvLE30d1czmdymGDP9F8': 'team', // Monthly A$74
    'price_1SjNJvLE30d1czmdnA2E091P': 'team', // Annual A$702
    // PHP (Philippines)
    'price_1SjNJwLE30d1czmdZkPFhsA4': 'individual', // Monthly ₱450
    'price_1SjNJxLE30d1czmd6NADrl3B': 'individual', // Annual ₱4500
    'price_1SjNJyLE30d1czmdsWjFnldX': 'team', // Monthly ₱900
    'price_1SjNJyLE30d1czmdqi56eo4e': 'team', // Annual ₱9000
    // IDR (Indonesia)
    'price_1SjNK8LE30d1czmdyXLirLGO': 'individual', // Monthly Rp125000
    'price_1SjNK9LE30d1czmd9wRWUFK4': 'individual', // Annual Rp1250000
    'price_1SjNKALE30d1czmdT6a49lls': 'team', // Monthly Rp250000
    'price_1SjNKBLE30d1czmdZA0FFcUg': 'team', // Annual Rp2500000

    // ===== TEST MODE =====
    // Individual Plan - USD
    'price_1Sj2Y4LE30d1czmdNFSZ2TOH': 'individual', // Monthly $24
    'price_1Sj2Y5LE30d1czmdTb3GqNrr': 'individual', // Annual $228
    // Individual Plan - GBP
    'price_1Sj2Y6LE30d1czmdZ7U9fbjf': 'individual', // Monthly £19
    'price_1Sj2Y7LE30d1czmd16o5FTvp': 'individual', // Annual £180
    // Individual Plan - EUR
    'price_1Sj2Y8LE30d1czmd97QfUxC0': 'individual', // Monthly €22
    'price_1Sj2Y9LE30d1czmdNn46kL5B': 'individual', // Annual €216
    // Team Plan - USD
    'price_1Sj2YdLE30d1czmdNopdqYTj': 'team', // Monthly $49
    'price_1Sj2YdLE30d1czmdSzOW3rrY': 'team', // Annual $468
    // Team Plan - GBP
    'price_1Sj2YeLE30d1czmdaci4C18S': 'team', // Monthly £39
    'price_1Sj2YfLE30d1czmdKINVzc7y': 'team', // Annual £372
    // Team Plan - EUR
    'price_1Sj2YgLE30d1czmd3XWoxg8g': 'team', // Monthly €45
    'price_1Sj2YhLE30d1czmdRrlAeRxh': 'team', // Annual €432
};

// Token Pack Price ID to Token Amount mapping
const PRICE_TO_TOKENS: Record<string, number> = {
    // ===== LIVE MODE =====
    // 5K Token Pack
    'price_1Sj1XxLE30d1czmdEEBt5q8O': 5000,  // USD
    'price_1Sj1XyLE30d1czmdkFf9mcs2': 5000,  // GBP
    'price_1Sj1XzLE30d1czmdbvVUUb1M': 5000,  // EUR
    // 25K Token Pack
    'price_1Sj1XzLE30d1czmdAvrfublS': 25000, // USD
    'price_1Sj1Y0LE30d1czmdoZhyNiq2': 25000, // GBP
    'price_1Sj1Y1LE30d1czmdHuHTtYZM': 25000, // EUR
    // 100K Token Pack
    'price_1Sj1Y1LE30d1czmd79RiK6eB': 100000, // USD
    'price_1Sj1Y2LE30d1czmdMwBDZQ0w': 100000, // GBP
    'price_1Sj1Y3LE30d1czmdqngP2zV7': 100000, // EUR

    // ===== TEST MODE =====
    // 5K Token Pack ($5, £4, €5)
    'price_1Sj2Z7LE30d1czmdb4ulGv3e': 5000,  // USD
    'price_1Sj2Z8LE30d1czmdstOAIod4': 5000,  // GBP
    'price_1Sj2Z9LE30d1czmd5QSHe1fM': 5000,  // EUR
    // 25K Token Pack ($20, £16, €18)
    'price_1Sj2ZALE30d1czmd7O5yIKye': 25000, // USD
    'price_1Sj2ZBLE30d1czmd4tBU4Dz5': 25000, // GBP
    'price_1Sj2ZCLE30d1czmdckdVSYfI': 25000, // EUR
    // 100K Token Pack ($60, £48, €55)
    'price_1Sj2ZDLE30d1czmddEVuI7VR': 100000, // USD
    'price_1Sj2ZELE30d1czmdCWDVUD6J': 100000, // GBP
    'price_1Sj2ZFLE30d1czmdkIE1DSvc': 100000, // EUR
};

function getPlanIdFromPriceId(priceId: string): string {
    return PRICE_TO_PLAN[priceId] || 'free';
}

function getTokensFromPriceId(priceId: string): number | null {
    return PRICE_TO_TOKENS[priceId] || null;
}

function isTokenPackPurchase(priceId: string): boolean {
    return priceId in PRICE_TO_TOKENS;
}

// Validate card country matches pricing tier
async function handleCardCountryValidation(charge: Stripe.Charge) {
    const metadata = charge.metadata || {};

    // Only validate if explicitly required (non-tier1 purchases)
    if (metadata.requires_country_validation !== 'true') {
        return;
    }

    const allowedCountriesStr = metadata.allowed_countries;
    if (!allowedCountriesStr) {
        console.log('No allowed_countries in metadata, skipping validation');
        return;
    }

    // Get card country from payment method
    const cardCountry = charge.payment_method_details?.card?.country;
    if (!cardCountry) {
        console.log('No card country available, skipping validation');
        return;
    }

    const allowedCountries = allowedCountriesStr.split(',');

    if (!allowedCountries.includes(cardCountry)) {
        console.log(`Card country ${cardCountry} not in allowed list for tier: ${metadata.pricing_tier}`);
        console.log(`Allowed countries: ${allowedCountriesStr}`);

        // Refund the charge - card country mismatch
        try {
            await stripe.refunds.create({
                charge: charge.id,
                reason: 'fraudulent', // This is the closest reason for geographic mismatch
                metadata: {
                    reason: 'card_country_mismatch',
                    card_country: cardCountry,
                    pricing_tier: metadata.pricing_tier,
                    allowed_countries: allowedCountriesStr,
                },
            });

            console.log(`Refunded charge ${charge.id} due to card country mismatch`);

            // Note: The customer will see the refund and may need to repurchase
            // at their correct regional pricing
        } catch (refundError) {
            console.error('Failed to refund charge:', refundError);
        }
    } else {
        console.log(`Card country ${cardCountry} validated for tier ${metadata.pricing_tier}`);
    }
}
