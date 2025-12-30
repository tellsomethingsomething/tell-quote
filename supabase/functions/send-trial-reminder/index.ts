/**
 * Send Trial Reminder Edge Function
 * Sends reminder emails to users whose trial is ending soon
 * Can be triggered by cron job or manually
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { generateTrialReminderEmail, generateTrialExpiredEmail } from '../_shared/email-templates.ts';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TrialOrg {
    id: string;
    name: string;
    trial_ends_at: string;
    owner_email: string;
    owner_name: string;
}

Deno.serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
        const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
        const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
        const APP_URL = Deno.env.get('APP_URL') || 'https://productionos.io';

        if (!RESEND_API_KEY) {
            console.error('RESEND_API_KEY not configured');
            return new Response(
                JSON.stringify({ error: 'Email service not configured' }),
                { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

        // Parse request body for optional parameters
        let reminderDays = [3, 1, 0]; // Days before expiry to send reminders
        let dryRun = false;

        try {
            const body = await req.json();
            if (body.reminderDays) reminderDays = body.reminderDays;
            if (body.dryRun) dryRun = body.dryRun;
        } catch {
            // No body or invalid JSON - use defaults
        }

        const now = new Date();
        const results: Array<{
            organizationId: string;
            email: string;
            daysRemaining: number;
            status: 'sent' | 'skipped' | 'error';
            error?: string;
        }> = [];

        // Find organizations with trials ending soon
        for (const days of reminderDays) {
            // Calculate the date range for this reminder
            const targetDate = new Date(now);
            targetDate.setDate(targetDate.getDate() + days);

            // Start of target day
            const startOfDay = new Date(targetDate);
            startOfDay.setHours(0, 0, 0, 0);

            // End of target day
            const endOfDay = new Date(targetDate);
            endOfDay.setHours(23, 59, 59, 999);

            // Find organizations whose trial ends on this day
            const { data: orgs, error: queryError } = await supabase
                .from('organizations')
                .select(`
                    id,
                    name,
                    trial_ends_at,
                    subscription_status
                `)
                .gte('trial_ends_at', startOfDay.toISOString())
                .lte('trial_ends_at', endOfDay.toISOString())
                .in('subscription_status', ['trialing', 'trial', null]);

            if (queryError) {
                console.error(`Query error for ${days} days:`, queryError);
                continue;
            }

            if (!orgs || orgs.length === 0) {
                console.log(`No organizations with trial ending in ${days} days`);
                continue;
            }

            console.log(`Found ${orgs.length} organizations with trial ending in ${days} days`);

            // Process each organization
            for (const org of orgs) {
                // Get the organization owner
                const { data: owner, error: ownerError } = await supabase
                    .from('organization_members')
                    .select(`
                        user_profiles!inner (
                            name,
                            email
                        )
                    `)
                    .eq('organization_id', org.id)
                    .eq('role', 'owner')
                    .single();

                if (ownerError || !owner) {
                    console.error(`Could not find owner for org ${org.id}:`, ownerError);
                    results.push({
                        organizationId: org.id,
                        email: 'unknown',
                        daysRemaining: days,
                        status: 'error',
                        error: 'Could not find organization owner',
                    });
                    continue;
                }

                const ownerProfile = (owner as any).user_profiles;
                const ownerEmail = ownerProfile?.email;
                const ownerName = ownerProfile?.name || 'there';

                if (!ownerEmail) {
                    console.error(`No email for owner of org ${org.id}`);
                    results.push({
                        organizationId: org.id,
                        email: 'no-email',
                        daysRemaining: days,
                        status: 'error',
                        error: 'Owner has no email address',
                    });
                    continue;
                }

                // Check if we already sent a reminder for this day
                const { data: existingReminder } = await supabase
                    .from('email_logs')
                    .select('id')
                    .eq('organization_id', org.id)
                    .eq('email_type', `trial_reminder_${days}d`)
                    .gte('created_at', startOfDay.toISOString())
                    .single();

                if (existingReminder) {
                    console.log(`Already sent ${days}d reminder to ${ownerEmail}`);
                    results.push({
                        organizationId: org.id,
                        email: ownerEmail,
                        daysRemaining: days,
                        status: 'skipped',
                    });
                    continue;
                }

                // Generate email content
                const upgradeUrl = `${APP_URL}/settings?tab=billing`;
                const isExpired = days === 0;

                const emailHtml = isExpired
                    ? generateTrialExpiredEmail({
                        userName: ownerName,
                        organizationName: org.name,
                        upgradeUrl,
                    })
                    : generateTrialReminderEmail({
                        userName: ownerName,
                        organizationName: org.name,
                        daysRemaining: days,
                        upgradeUrl,
                    });

                const subject = isExpired
                    ? `Your ProductionOS Trial Has Ended`
                    : days === 1
                        ? `Your ProductionOS Trial Ends Tomorrow!`
                        : `${days} Days Left in Your ProductionOS Trial`;

                if (dryRun) {
                    console.log(`[DRY RUN] Would send to ${ownerEmail}: ${subject}`);
                    results.push({
                        organizationId: org.id,
                        email: ownerEmail,
                        daysRemaining: days,
                        status: 'skipped',
                    });
                    continue;
                }

                // Send email via Resend
                try {
                    const resendResponse = await fetch('https://api.resend.com/emails', {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${RESEND_API_KEY}`,
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            from: 'ProductionOS <noreply@productionos.io>',
                            to: [ownerEmail],
                            subject: subject,
                            html: emailHtml,
                            tags: [
                                { name: 'type', value: isExpired ? 'trial_expired' : 'trial_reminder' },
                                { name: 'organization_id', value: org.id },
                                { name: 'days_remaining', value: String(days) },
                            ],
                        }),
                    });

                    if (!resendResponse.ok) {
                        const errorData = await resendResponse.json();
                        console.error('Resend error:', errorData);
                        results.push({
                            organizationId: org.id,
                            email: ownerEmail,
                            daysRemaining: days,
                            status: 'error',
                            error: errorData.message || 'Failed to send email',
                        });
                        continue;
                    }

                    const resendData = await resendResponse.json();

                    // Log the email send
                    await supabase.from('email_logs').insert({
                        organization_id: org.id,
                        recipient_email: ownerEmail,
                        email_type: `trial_reminder_${days}d`,
                        resend_email_id: resendData.id,
                        subject: subject,
                        status: 'sent',
                    });

                    console.log(`Sent ${days}d trial reminder to ${ownerEmail}`);
                    results.push({
                        organizationId: org.id,
                        email: ownerEmail,
                        daysRemaining: days,
                        status: 'sent',
                    });

                } catch (sendError) {
                    console.error(`Failed to send email to ${ownerEmail}:`, sendError);
                    results.push({
                        organizationId: org.id,
                        email: ownerEmail,
                        daysRemaining: days,
                        status: 'error',
                        error: sendError.message,
                    });
                }
            }
        }

        const sent = results.filter(r => r.status === 'sent').length;
        const skipped = results.filter(r => r.status === 'skipped').length;
        const errors = results.filter(r => r.status === 'error').length;

        return new Response(
            JSON.stringify({
                success: true,
                summary: { sent, skipped, errors },
                results,
            }),
            { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );

    } catch (error) {
        console.error('Trial reminder error:', error);
        return new Response(
            JSON.stringify({ error: error.message || 'Internal server error' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
});
