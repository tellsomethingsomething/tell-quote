// Send GDPR-related emails (account deletion confirmation, data export ready)
// Uses Resend for email delivery

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { getCorsHeaders, handleCorsPrelight } from '../_shared/cors.ts'

interface GdprEmailRequest {
  type: 'deletion_confirmation' | 'data_export_ready'
  email: string
  confirmUrl?: string
  deletionDate?: string
  token?: string
  downloadUrl?: string
}

function generateDeletionConfirmationEmail(data: {
  confirmUrl: string
  deletionDate: string
}): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Confirm Account Deletion - ProductionOS</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f4f4f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
    <tr>
      <td>
        <!-- Header -->
        <table width="100%" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, #DC2626 0%, #991B1B 100%); border-radius: 12px 12px 0 0; padding: 32px;">
          <tr>
            <td align="center">
              <div style="width: 48px; height: 48px; background-color: rgba(255,255,255,0.2); border-radius: 12px; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 16px;">
                <span style="font-size: 24px; font-weight: bold; color: white;">P</span>
              </div>
              <h1 style="color: white; font-size: 24px; margin: 0; font-weight: 600;">Account Deletion Request</h1>
            </td>
          </tr>
        </table>

        <!-- Content -->
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: white; padding: 40px 32px; border-radius: 0 0 12px 12px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
          <tr>
            <td>
              <h2 style="color: #18181b; font-size: 20px; margin: 0 0 16px 0; font-weight: 600;">
                Please Confirm Your Account Deletion
              </h2>

              <p style="color: #52525b; font-size: 16px; line-height: 24px; margin: 0 0 24px 0;">
                We received a request to delete your ProductionOS account. If you made this request, please click the button below to confirm.
              </p>

              <div style="background-color: #FEF2F2; border: 1px solid #FECACA; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
                <p style="color: #991B1B; font-size: 14px; margin: 0; font-weight: 500;">
                  <strong>Important:</strong> Your account and all associated data will be permanently deleted on <strong>${data.deletionDate}</strong>. This action cannot be undone.
                </p>
              </div>

              <p style="color: #52525b; font-size: 16px; line-height: 24px; margin: 0 0 32px 0;">
                You have 30 days to cancel this request. After that, all your data including quotes, clients, projects, and settings will be permanently removed.
              </p>

              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <a href="${data.confirmUrl}"
                       style="display: inline-block; background-color: #DC2626; color: white; font-size: 16px; font-weight: 600; text-decoration: none; padding: 14px 32px; border-radius: 8px; box-shadow: 0 4px 6px -1px rgba(220, 38, 38, 0.3);">
                      Confirm Account Deletion
                    </a>
                  </td>
                </tr>
              </table>

              <p style="color: #71717a; font-size: 14px; line-height: 20px; margin: 32px 0 0 0; text-align: center;">
                If you did not request this deletion, please ignore this email or contact support immediately. Your account will remain active.
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
                <a href="https://productionos.io/legal/gdpr" style="color: #71717a; text-decoration: underline;">GDPR</a>
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

function generateDataExportReadyEmail(data: { downloadUrl: string }): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your Data Export is Ready - ProductionOS</title>
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
              <h1 style="color: white; font-size: 24px; margin: 0; font-weight: 600;">Your Data Export is Ready</h1>
            </td>
          </tr>
        </table>

        <!-- Content -->
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: white; padding: 40px 32px; border-radius: 0 0 12px 12px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
          <tr>
            <td>
              <p style="color: #52525b; font-size: 16px; line-height: 24px; margin: 0 0 24px 0;">
                Your requested data export from ProductionOS is ready for download. The export includes all your personal data in JSON format.
              </p>

              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <a href="${data.downloadUrl}"
                       style="display: inline-block; background-color: #0F8B8D; color: white; font-size: 16px; font-weight: 600; text-decoration: none; padding: 14px 32px; border-radius: 8px; box-shadow: 0 4px 6px -1px rgba(15, 139, 141, 0.3);">
                      Download Your Data
                    </a>
                  </td>
                </tr>
              </table>

              <p style="color: #71717a; font-size: 14px; line-height: 20px; margin: 32px 0 0 0; text-align: center;">
                This download link will expire in 24 hours. If you did not request this export, please contact support.
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
  const corsHeaders = getCorsHeaders(req)

  if (req.method === 'OPTIONS') {
    return handleCorsPrelight(req)
  }

  try {
    const requestData = await req.json() as GdprEmailRequest
    const { type, email } = requestData

    if (!type || !email) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: type, email' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

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

    // Security: Only allow sending to the authenticated user's email
    if (user.email !== email) {
      return new Response(
        JSON.stringify({ error: 'Can only send GDPR emails to your own email address' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    let emailHtml: string
    let subject: string

    switch (type) {
      case 'deletion_confirmation':
        if (!requestData.confirmUrl || !requestData.deletionDate) {
          return new Response(
            JSON.stringify({ error: 'Missing confirmUrl or deletionDate for deletion confirmation' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }
        emailHtml = generateDeletionConfirmationEmail({
          confirmUrl: requestData.confirmUrl,
          deletionDate: requestData.deletionDate,
        })
        subject = 'Confirm Your Account Deletion Request - ProductionOS'
        break

      case 'data_export_ready':
        if (!requestData.downloadUrl) {
          return new Response(
            JSON.stringify({ error: 'Missing downloadUrl for data export' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }
        emailHtml = generateDataExportReadyEmail({
          downloadUrl: requestData.downloadUrl,
        })
        subject = 'Your Data Export is Ready - ProductionOS'
        break

      default:
        return new Response(
          JSON.stringify({ error: `Invalid email type: ${type}` }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }

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
        subject,
        html: emailHtml,
        tags: [
          { name: 'type', value: `gdpr_${type}` },
          { name: 'user_id', value: user.id },
        ],
      }),
    })

    if (!resendResponse.ok) {
      const errorData = await resendResponse.json()
      console.error('Resend error:', errorData)

      return new Response(
        JSON.stringify({ error: 'Failed to send GDPR email' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const resendData = await resendResponse.json()

    return new Response(
      JSON.stringify({
        success: true,
        emailId: resendData.id,
        message: `GDPR ${type} email sent to ${email}`
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Send GDPR email error:', error)
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
