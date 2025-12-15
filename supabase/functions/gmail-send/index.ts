import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { encode as base64Encode } from 'https://deno.land/std@0.194.0/encoding/base64.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

/**
 * Create a MIME message for Gmail API
 */
function createMimeMessage(
  to: string,
  subject: string,
  body: string,
  fromEmail: string,
  attachment?: { name: string; type: string; data: string }
): string {
  const boundary = '----=_Part_' + Math.random().toString(36).substring(2)

  let message = ''
  message += `From: ${fromEmail}\r\n`
  message += `To: ${to}\r\n`
  message += `Subject: ${subject}\r\n`
  message += 'MIME-Version: 1.0\r\n'

  if (attachment) {
    message += `Content-Type: multipart/mixed; boundary="${boundary}"\r\n\r\n`

    // Body part
    message += `--${boundary}\r\n`
    message += 'Content-Type: text/plain; charset="UTF-8"\r\n'
    message += 'Content-Transfer-Encoding: 7bit\r\n\r\n'
    message += body + '\r\n\r\n'

    // Attachment part
    message += `--${boundary}\r\n`
    message += `Content-Type: ${attachment.type}; name="${attachment.name}"\r\n`
    message += 'Content-Transfer-Encoding: base64\r\n'
    message += `Content-Disposition: attachment; filename="${attachment.name}"\r\n\r\n`
    message += attachment.data + '\r\n'

    message += `--${boundary}--`
  } else {
    message += 'Content-Type: text/plain; charset="UTF-8"\r\n\r\n'
    message += body
  }

  return message
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { userId, to, subject, body, attachment } = await req.json()

    if (!userId || !to || !subject || !body) {
      return new Response(
        JSON.stringify({ error: 'userId, to, subject, and body are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // Get access token and email
    const { data: tokenRecord, error: tokenError } = await supabase
      .from('google_tokens')
      .select('access_token, email, expires_at')
      .eq('user_id', userId)
      .single()

    if (tokenError || !tokenRecord) {
      return new Response(
        JSON.stringify({ error: 'No Google connection found' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check if token is expired
    if (new Date(tokenRecord.expires_at) < new Date()) {
      return new Response(
        JSON.stringify({ error: 'Token expired, please refresh' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Create MIME message
    const mimeMessage = createMimeMessage(
      to,
      subject,
      body,
      tokenRecord.email,
      attachment
    )

    // Encode to base64url
    const encodedMessage = base64Encode(new TextEncoder().encode(mimeMessage))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '')

    // Send via Gmail API
    const sendResponse = await fetch(
      'https://gmail.googleapis.com/gmail/v1/users/me/messages/send',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${tokenRecord.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ raw: encodedMessage }),
      }
    )

    if (!sendResponse.ok) {
      const errorData = await sendResponse.json()
      return new Response(
        JSON.stringify({ error: errorData.error?.message || 'Failed to send email' }),
        { status: sendResponse.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const sendData = await sendResponse.json()

    return new Response(
      JSON.stringify({
        success: true,
        messageId: sendData.id,
        threadId: sendData.threadId,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
