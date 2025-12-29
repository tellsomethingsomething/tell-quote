// Process Email Sequences Edge Function
// Scheduled via Supabase Cron to process due email sequence enrollments

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface Enrollment {
    id: string
    sequence_id: string
    contact_id: string | null
    contact_email: string
    contact_name: string
    current_step: number
    status: string
    next_send_at: string
    metadata: Record<string, unknown>
    sequence: {
        id: string
        name: string
        status: string
        settings: {
            sendOnWeekends?: boolean
            sendTime?: string
            timezone?: string
            stopOnReply?: boolean
            stopOnMeeting?: boolean
        }
        steps: Step[]
        user_id: string
    }
}

interface Step {
    id: string
    step_order: number
    name: string
    subject: string
    body: string
    template_id: string | null
    trigger_type: string
    trigger_value: number
    is_active: boolean
}

async function sendViaResend(
    apiKey: string,
    to: string,
    from: string,
    subject: string,
    html: string,
    tags: { name: string; value: string }[]
): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
        const response = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                from,
                to: [to],
                subject,
                html,
                tags,
            }),
        })

        if (!response.ok) {
            const errorData = await response.json()
            return { success: false, error: errorData.message || 'Failed to send' }
        }

        const data = await response.json()
        return { success: true, messageId: data.id }
    } catch (error) {
        return { success: false, error: error.message }
    }
}

function applyVariables(text: string, context: Record<string, string>): string {
    if (!text) return ''
    let result = text
    Object.entries(context).forEach(([key, value]) => {
        const regex = new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, 'gi')
        result = result.replace(regex, value || '')
    })
    return result
}

function generateEmailHtml(body: string, contactName: string, unsubscribeUrl: string): string {
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f4f4f5;">
    <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
        <tr>
            <td>
                <table width="100%" cellpadding="0" cellspacing="0" style="background-color: white; padding: 32px; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
                    <tr>
                        <td>
                            <div style="color: #18181b; font-size: 16px; line-height: 24px;">
                                ${body.replace(/\n/g, '<br>')}
                            </div>
                        </td>
                    </tr>
                </table>
                <table width="100%" cellpadding="0" cellspacing="0" style="padding: 24px;">
                    <tr>
                        <td align="center">
                            <p style="color: #a1a1aa; font-size: 12px; margin: 0;">
                                <a href="${unsubscribeUrl}" style="color: #71717a; text-decoration: underline;">Unsubscribe</a>
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
`
}

function calculateNextSend(step: Step, settings: Enrollment['sequence']['settings']): Date {
    const now = new Date()

    let nextDate: Date
    switch (step.trigger_type) {
        case 'delay_days':
            nextDate = new Date(now)
            nextDate.setDate(nextDate.getDate() + (step.trigger_value || 1))
            break
        case 'delay_hours':
            nextDate = new Date(now)
            nextDate.setHours(nextDate.getHours() + (step.trigger_value || 1))
            return nextDate // Don't adjust for business hours
        default:
            nextDate = new Date(now)
            nextDate.setDate(nextDate.getDate() + 1)
    }

    // Set to preferred send time
    const [hours, minutes] = (settings.sendTime || '09:00').split(':').map(Number)
    nextDate.setHours(hours, minutes, 0, 0)

    // Skip weekends if not allowed
    if (!settings.sendOnWeekends) {
        while (nextDate.getDay() === 0 || nextDate.getDay() === 6) {
            nextDate.setDate(nextDate.getDate() + 1)
        }
    }

    return nextDate
}

Deno.serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
        const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
        const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
        const APP_URL = Deno.env.get('APP_URL') || 'https://productionos.io'

        if (!RESEND_API_KEY) {
            return new Response(
                JSON.stringify({ error: 'Email service not configured' }),
                { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
        const now = new Date()

        // Get enrollments that are due to send
        const { data: enrollments, error: fetchError } = await supabase
            .from('email_sequence_enrollments')
            .select(`
                *,
                sequence:email_sequences(
                    *,
                    steps:email_sequence_steps(*)
                )
            `)
            .eq('status', 'active')
            .lte('next_send_at', now.toISOString())
            .limit(50) // Process in batches

        if (fetchError) {
            throw fetchError
        }

        const results = {
            processed: 0,
            sent: 0,
            completed: 0,
            failed: 0,
            errors: [] as string[],
        }

        for (const enrollment of enrollments || []) {
            try {
                results.processed++

                // Skip if sequence is not active
                if (enrollment.sequence?.status !== 'active') {
                    continue
                }

                // Find current step
                const currentStep = enrollment.sequence.steps?.find(
                    (s: Step) => s.step_order === enrollment.current_step && s.is_active
                )

                if (!currentStep) {
                    // No more steps, mark as completed
                    await supabase
                        .from('email_sequence_enrollments')
                        .update({
                            status: 'completed',
                            completed_at: now.toISOString(),
                        })
                        .eq('id', enrollment.id)
                    results.completed++
                    continue
                }

                // Get user's organization for sender info
                const { data: userProfile } = await supabase
                    .from('user_profiles')
                    .select('name, organization_id')
                    .eq('id', enrollment.sequence.user_id)
                    .single()

                const { data: org } = await supabase
                    .from('organizations')
                    .select('name')
                    .eq('id', userProfile?.organization_id)
                    .single()

                // Prepare email content
                const context: Record<string, string> = {
                    contactName: enrollment.contact_name || '',
                    contactFirstName: enrollment.contact_name?.split(' ')[0] || '',
                    contactEmail: enrollment.contact_email,
                    senderName: userProfile?.name || 'Your Team',
                    organizationName: org?.name || 'ProductionOS',
                }

                const subject = applyVariables(currentStep.subject, context)
                const body = applyVariables(currentStep.body, context)

                // Generate unsubscribe URL
                const unsubscribeToken = btoa(`${enrollment.id}:${enrollment.contact_email}`)
                const unsubscribeUrl = `${APP_URL}/unsubscribe?token=${unsubscribeToken}`

                // Send the email
                const html = generateEmailHtml(body, enrollment.contact_name, unsubscribeUrl)
                const fromEmail = `${org?.name || 'ProductionOS'} <noreply@productionos.io>`

                const sendResult = await sendViaResend(
                    RESEND_API_KEY,
                    enrollment.contact_email,
                    fromEmail,
                    subject,
                    html,
                    [
                        { name: 'type', value: 'sequence' },
                        { name: 'sequence_id', value: enrollment.sequence_id },
                        { name: 'step_id', value: currentStep.id },
                        { name: 'enrollment_id', value: enrollment.id },
                    ]
                )

                if (sendResult.success) {
                    results.sent++

                    // Record the send
                    await supabase.from('email_sequence_sends').insert({
                        enrollment_id: enrollment.id,
                        step_id: currentStep.id,
                        sent_at: now.toISOString(),
                        message_id: sendResult.messageId,
                        status: 'sent',
                    })

                    // Find next step
                    const nextStep = enrollment.sequence.steps?.find(
                        (s: Step) => s.step_order === enrollment.current_step + 1 && s.is_active
                    )

                    if (nextStep) {
                        const nextSendAt = calculateNextSend(nextStep, enrollment.sequence.settings)
                        await supabase
                            .from('email_sequence_enrollments')
                            .update({
                                current_step: enrollment.current_step + 1,
                                next_send_at: nextSendAt.toISOString(),
                            })
                            .eq('id', enrollment.id)
                    } else {
                        // Sequence complete
                        await supabase
                            .from('email_sequence_enrollments')
                            .update({
                                status: 'completed',
                                completed_at: now.toISOString(),
                            })
                            .eq('id', enrollment.id)
                        results.completed++
                    }
                } else {
                    results.failed++
                    results.errors.push(`${enrollment.contact_email}: ${sendResult.error}`)

                    // Record failed send
                    await supabase.from('email_sequence_sends').insert({
                        enrollment_id: enrollment.id,
                        step_id: currentStep.id,
                        sent_at: now.toISOString(),
                        status: 'failed',
                        error: sendResult.error,
                    })
                }
            } catch (error) {
                results.failed++
                results.errors.push(`Enrollment ${enrollment.id}: ${error.message}`)
            }
        }

        // Log the processing results
        console.log('Email sequence processing results:', results)

        return new Response(
            JSON.stringify({
                success: true,
                results,
            }),
            { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    } catch (error) {
        console.error('Process email sequences error:', error)
        return new Response(
            JSON.stringify({ error: error.message || 'Internal server error' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }
})
