// Gmail Send Edge Function
// Sends emails via Gmail API

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { encode as base64Encode } from 'https://deno.land/std@0.194.0/encoding/base64.ts'
import { getCorsHeaders, handleCorsPrelight } from '../_shared/cors.ts'

async function refreshAccessToken(
  refreshToken: string,
  clientId: string,
  clientSecret: string
): Promise<{ access_token: string; expires_in: number }> {
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      refresh_token: refreshToken,
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: 'refresh_token',
    }),
  })

  if (!response.ok) {
    throw new Error('Failed to refresh access token')
  }

  return response.json()
}

/**
 * Create a MIME message for Gmail API
 */
function createMimeMessage(
  to: string[],
  cc: string[],
  bcc: string[],
  subject: string,
  body: string,
  fromEmail: string,
  replyToMessageId?: string,
  isHtml: boolean = false,
  attachments?: { name: string; type: string; data: string }[]
): string {
  const boundary = '----=_Part_' + Math.random().toString(36).substring(2)

  let message = ''
  message += `From: ${fromEmail}\r\n`
  message += `To: ${to.join(', ')}\r\n`
  if (cc.length > 0) {
    message += `Cc: ${cc.join(', ')}\r\n`
  }
  if (bcc.length > 0) {
    message += `Bcc: ${bcc.join(', ')}\r\n`
  }
  message += `Subject: ${subject}\r\n`

  // Add In-Reply-To and References headers for threading
  if (replyToMessageId) {
    message += `In-Reply-To: ${replyToMessageId}\r\n`
    message += `References: ${replyToMessageId}\r\n`
  }

  message += 'MIME-Version: 1.0\r\n'

  if (attachments && attachments.length > 0) {
    message += `Content-Type: multipart/mixed; boundary="${boundary}"\r\n\r\n`

    // Body part
    message += `--${boundary}\r\n`
    if (isHtml) {
      message += 'Content-Type: text/html; charset="UTF-8"\r\n'
    } else {
      message += 'Content-Type: text/plain; charset="UTF-8"\r\n'
    }
    message += 'Content-Transfer-Encoding: 7bit\r\n\r\n'
    message += body + '\r\n\r\n'

    // Attachment parts
    for (const attachment of attachments) {
      message += `--${boundary}\r\n`
      message += `Content-Type: ${attachment.type}; name="${attachment.name}"\r\n`
      message += 'Content-Transfer-Encoding: base64\r\n'
      message += `Content-Disposition: attachment; filename="${attachment.name}"\r\n\r\n`
      message += attachment.data + '\r\n'
    }

    message += `--${boundary}--`
  } else {
    if (isHtml) {
      message += 'Content-Type: text/html; charset="UTF-8"\r\n\r\n'
    } else {
      message += 'Content-Type: text/plain; charset="UTF-8"\r\n\r\n'
    }
    message += body
  }

  return message
}

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req)

  if (req.method === 'OPTIONS') {
    return handleCorsPrelight(req)
  }

  try {
    const {
      connectionId,
      to,
      cc = [],
      bcc = [],
      subject,
      body,
      isHtml = false,
      threadId,
      replyToMessageId,
      attachments,
      saveDraft = false
    } = await req.json()

    if (!connectionId || !to || to.length === 0 || !subject || !body) {
      return new Response(
        JSON.stringify({ error: 'connectionId, to, subject, and body are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const GOOGLE_CLIENT_ID = Deno.env.get('GOOGLE_CLIENT_ID')
    const GOOGLE_CLIENT_SECRET = Deno.env.get('GOOGLE_CLIENT_SECRET')
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
      throw new Error('Google OAuth credentials not configured')
    }

    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('Authorization header required')
    }

    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!)

    // Verify user
    const { data: { user }, error: userError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    )

    if (userError || !user) {
      throw new Error('Invalid user token')
    }

    // Get connection
    const { data: connection, error: connError } = await supabase
      .from('google_connections')
      .select('*')
      .eq('id', connectionId)
      .eq('user_id', user.id)
      .single()

    if (connError || !connection) {
      throw new Error('Connection not found')
    }

    // Check if token needs refresh
    let accessToken = connection.access_token
    const tokenExpiry = new Date(connection.token_expires_at)
    const now = new Date()

    if (tokenExpiry <= now) {
      const tokens = await refreshAccessToken(
        connection.refresh_token,
        GOOGLE_CLIENT_ID,
        GOOGLE_CLIENT_SECRET
      )

      accessToken = tokens.access_token
      const newExpiry = new Date()
      newExpiry.setSeconds(newExpiry.getSeconds() + tokens.expires_in)

      await supabase
        .from('google_connections')
        .update({
          access_token: accessToken,
          token_expires_at: newExpiry.toISOString(),
        })
        .eq('id', connectionId)
    }

    // Create MIME message
    const mimeMessage = createMimeMessage(
      Array.isArray(to) ? to : [to],
      cc,
      bcc,
      subject,
      body,
      connection.google_email,
      replyToMessageId,
      isHtml,
      attachments
    )

    // Encode to base64url
    const encodedMessage = base64Encode(new TextEncoder().encode(mimeMessage))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '')

    let endpoint = 'https://gmail.googleapis.com/gmail/v1/users/me/messages/send'
    let requestBody: any = { raw: encodedMessage }

    if (saveDraft) {
      endpoint = 'https://gmail.googleapis.com/gmail/v1/users/me/drafts'
      requestBody = { message: { raw: encodedMessage } }
    }

    // Add threadId if replying
    if (threadId && !saveDraft) {
      requestBody.threadId = threadId
    }

    // Send via Gmail API
    const sendResponse = await fetch(endpoint, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    })

    if (!sendResponse.ok) {
      const errorData = await sendResponse.json()
      return new Response(
        JSON.stringify({ error: errorData.error?.message || 'Failed to send email' }),
        { status: sendResponse.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const sendData = await sendResponse.json()

    // If sent (not draft), store the message locally
    if (!saveDraft && sendData.id) {
      // Fetch the sent message details
      const msgResponse = await fetch(
        `https://gmail.googleapis.com/gmail/v1/users/me/messages/${sendData.id}?format=metadata`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      )

      if (msgResponse.ok) {
        const msgData = await msgResponse.json()

        // Get or create thread in our database
        let threadRecord
        if (threadId) {
          const { data } = await supabase
            .from('email_threads')
            .select('id')
            .eq('google_thread_id', sendData.threadId || threadId)
            .single()
          threadRecord = data
        }

        // Store the sent message
        await supabase.from('email_messages').insert({
          google_message_id: sendData.id,
          thread_id: threadRecord?.id,
          connection_id: connectionId,
          user_id: user.id,
          from_address: connection.google_email,
          to_addresses: Array.isArray(to) ? to : [to],
          cc_addresses: cc,
          bcc_addresses: bcc,
          subject,
          body_text: isHtml ? '' : body,
          body_html: isHtml ? body : '',
          snippet: body.substring(0, 200),
          labels: ['SENT'],
          is_sent: true,
          sent_at: new Date().toISOString(),
        })
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        messageId: saveDraft ? sendData.message?.id : sendData.id,
        threadId: saveDraft ? sendData.message?.threadId : sendData.threadId,
        draftId: saveDraft ? sendData.id : undefined,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Gmail send error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
