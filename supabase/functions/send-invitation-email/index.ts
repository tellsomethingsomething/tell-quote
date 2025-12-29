// Send Invitation Email Edge Function
// Sends team invitation emails via Resend

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface InvitationEmailRequest {
  invitationId: string
  email: string
  organizationName: string
  inviterName: string
  role: string
  inviteToken: string
}

function generateInvitationEmailHtml(data: {
  organizationName: string
  inviterName: string
  role: string
  acceptUrl: string
}): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>You've been invited to ${data.organizationName}</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f4f4f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
    <tr>
      <td>
        <!-- Header -->
        <table width="100%" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, #0F8B8D 0%, #143642 100%); border-radius: 12px 12px 0 0; padding: 32px;">
          <tr>
            <td align="center">
              <div style="width: 48px; height: 48px; background-color: rgba(255,255,255,0.2); border-radius: 12px; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 16px;">
                <span style="font-size: 24px; font-weight: bold; color: white;">P</span>
              </div>
              <h1 style="color: white; font-size: 24px; margin: 0; font-weight: 600;">ProductionOS</h1>
            </td>
          </tr>
        </table>

        <!-- Content -->
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: white; padding: 40px 32px; border-radius: 0 0 12px 12px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
          <tr>
            <td>
              <h2 style="color: #18181b; font-size: 20px; margin: 0 0 16px 0; font-weight: 600;">
                You've been invited to join ${data.organizationName}
              </h2>

              <p style="color: #52525b; font-size: 16px; line-height: 24px; margin: 0 0 24px 0;">
                ${data.inviterName} has invited you to join their organization on ProductionOS as a <strong style="color: #18181b;">${data.role}</strong>.
              </p>

              <p style="color: #52525b; font-size: 16px; line-height: 24px; margin: 0 0 32px 0;">
                ProductionOS is a comprehensive platform for managing production workflows, including quoting, project management, crew scheduling, and financial reporting.
              </p>

              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <a href="${data.acceptUrl}"
                       style="display: inline-block; background-color: #0F8B8D; color: white; font-size: 16px; font-weight: 600; text-decoration: none; padding: 14px 32px; border-radius: 8px; box-shadow: 0 4px 6px -1px rgba(15, 139, 141, 0.3);">
                      Accept Invitation
                    </a>
                  </td>
                </tr>
              </table>

              <p style="color: #a1a1aa; font-size: 14px; line-height: 20px; margin: 32px 0 0 0; text-align: center;">
                This invitation will expire in 7 days. If you didn't expect this invitation, you can safely ignore this email.
              </p>
            </td>
          </tr>
        </table>

        <!-- Footer -->
        <table width="100%" cellpadding="0" cellspacing="0" style="padding: 24px;">
          <tr>
            <td align="center">
              <p style="color: #a1a1aa; font-size: 12px; margin: 0;">
                &copy; 2025 ProductionOS. All rights reserved.
              </p>
              <p style="color: #a1a1aa; font-size: 12px; margin: 8px 0 0 0;">
                <a href="https://productionos.io/legal/privacy" style="color: #71717a; text-decoration: underline;">Privacy Policy</a>
                &nbsp;|&nbsp;
                <a href="https://productionos.io/legal/terms" style="color: #71717a; text-decoration: underline;">Terms of Service</a>
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

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { invitationId, email, organizationName, inviterName, role, inviteToken } =
      await req.json() as InvitationEmailRequest

    if (!invitationId || !email || !organizationName || !inviterName || !inviteToken) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    const APP_URL = Deno.env.get('APP_URL') || 'https://productionos.io'

    if (!RESEND_API_KEY) {
      console.error('RESEND_API_KEY not configured')
      return new Response(
        JSON.stringify({ error: 'Email service not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Verify the request has valid auth
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authorization required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!)

    // Verify the user is authorized
    const { data: { user }, error: userError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    )

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid authorization' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Generate accept URL
    const acceptUrl = `${APP_URL}/accept-invitation?token=${inviteToken}`

    // Generate email HTML
    const emailHtml = generateInvitationEmailHtml({
      organizationName,
      inviterName,
      role: role.charAt(0).toUpperCase() + role.slice(1),
      acceptUrl,
    })

    // Send via Resend
    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'ProductionOS <noreply@productionos.io>',
        to: [email],
        subject: `You've been invited to join ${organizationName} on ProductionOS`,
        html: emailHtml,
        tags: [
          { name: 'type', value: 'invitation' },
          { name: 'invitation_id', value: invitationId },
        ],
      }),
    })

    if (!resendResponse.ok) {
      const errorData = await resendResponse.json()
      console.error('Resend error:', errorData)

      return new Response(
        JSON.stringify({ error: 'Failed to send invitation email' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const resendData = await resendResponse.json()

    // Update invitation record with email sent timestamp
    await supabase
      .from('user_invitations')
      .update({
        email_sent_at: new Date().toISOString(),
        resend_email_id: resendData.id,
      })
      .eq('id', invitationId)

    return new Response(
      JSON.stringify({
        success: true,
        emailId: resendData.id,
        message: `Invitation email sent to ${email}`
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Send invitation email error:', error)
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
