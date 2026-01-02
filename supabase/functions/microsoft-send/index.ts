// Microsoft Send Email Edge Function
// Sends emails via Microsoft Graph API
// SECURITY: Includes proper CORS and encrypted token storage

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { getCorsHeaders, handleCorsPrelight } from '../_shared/cors.ts'

async function refreshAccessToken(
  refreshToken: string,
  clientId: string,
  clientSecret: string
): Promise<{ access_token: string; expires_in: number; refresh_token?: string }> {
  const response = await fetch('https://login.microsoftonline.com/common/oauth2/v2.0/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  })

  if (!response.ok) {
    throw new Error('Failed to refresh Microsoft access token')
  }

  return response.json()
}

function formatRecipient(email: string) {
  // Handle "Name <email@domain.com>" format
  const match = email.match(/^(.+?)\s*<(.+?)>$/)
  if (match) {
    return {
      emailAddress: {
        name: match[1].trim(),
        address: match[2].trim(),
      },
    }
  }
  return {
    emailAddress: {
      address: email.trim(),
    },
  }
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
      conversationId,
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

    const MICROSOFT_CLIENT_ID = Deno.env.get('MICROSOFT_CLIENT_ID')
    const MICROSOFT_CLIENT_SECRET = Deno.env.get('MICROSOFT_CLIENT_SECRET')
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    if (!MICROSOFT_CLIENT_ID || !MICROSOFT_CLIENT_SECRET) {
      throw new Error('Microsoft OAuth credentials not configured')
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

    // SECURITY: Get Microsoft connection with decrypted tokens via view
    const { data: connection, error: connError } = await supabase
      .from('microsoft_connections_decrypted')
      .select('*')
      .eq('id', connectionId)
      .eq('user_id', user.id)
      .single()

    if (connError || !connection) {
      throw new Error('Microsoft connection not found')
    }

    // Check if token needs refresh
    let accessToken = connection.access_token
    const tokenExpiry = new Date(connection.token_expires_at)
    const now = new Date()

    if (tokenExpiry <= now) {
      const tokens = await refreshAccessToken(
        connection.refresh_token,
        MICROSOFT_CLIENT_ID,
        MICROSOFT_CLIENT_SECRET
      )

      accessToken = tokens.access_token
      const newExpiry = new Date()
      newExpiry.setSeconds(newExpiry.getSeconds() + tokens.expires_in)

      // SECURITY: Store encrypted tokens only
      const { data: encryptedAccess } = await supabase.rpc('encrypt_token', {
        token_text: accessToken
      })

      const updateData: any = {
        access_token_encrypted: encryptedAccess,
        token_expires_at: newExpiry.toISOString(),
      }
      if (tokens.refresh_token) {
        const { data: encryptedRefresh } = await supabase.rpc('encrypt_token', {
          token_text: tokens.refresh_token
        })
        updateData.refresh_token_encrypted = encryptedRefresh
      }

      await supabase
        .from('microsoft_connections')
        .update(updateData)
        .eq('id', connectionId)
    }

    // Build message object for Microsoft Graph
    const toRecipients = (Array.isArray(to) ? to : [to]).map(formatRecipient)
    const ccRecipients = cc.map(formatRecipient)
    const bccRecipients = bcc.map(formatRecipient)

    const message: any = {
      subject,
      body: {
        contentType: isHtml ? 'HTML' : 'Text',
        content: body,
      },
      toRecipients,
    }

    if (ccRecipients.length > 0) {
      message.ccRecipients = ccRecipients
    }

    if (bccRecipients.length > 0) {
      message.bccRecipients = bccRecipients
    }

    // Handle reply - set conversation ID
    if (conversationId) {
      message.conversationId = conversationId
    }

    // Handle attachments
    if (attachments && attachments.length > 0) {
      message.attachments = attachments.map((att: { name: string; type: string; data: string }) => ({
        '@odata.type': '#microsoft.graph.fileAttachment',
        name: att.name,
        contentType: att.type,
        contentBytes: att.data, // Already base64 encoded
      }))
    }

    let endpoint: string
    let requestBody: any

    if (saveDraft) {
      // Create draft
      endpoint = 'https://graph.microsoft.com/v1.0/me/messages'
      requestBody = message
    } else {
      // Send email
      endpoint = 'https://graph.microsoft.com/v1.0/me/sendMail'
      requestBody = { message, saveToSentItems: true }
    }

    // Make request to Microsoft Graph
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

    let responseData: any = {}

    if (saveDraft) {
      // Draft was created, get the response
      responseData = await sendResponse.json()
    }

    // If sent (not draft), store the message locally
    if (!saveDraft) {
      // Fetch the sent message from Sent Items
      // Note: There's a delay, so we create a basic record
      await supabase.from('email_messages').insert({
        provider: 'microsoft',
        provider_message_id: `sent_${Date.now()}`, // Temporary ID
        thread_id: null, // Will be linked later during sync
        from_email: connection.microsoft_email,
        from_name: connection.microsoft_name,
        to_emails: toRecipients.map(r => ({
          email: r.emailAddress.address,
          name: r.emailAddress.name || r.emailAddress.address,
        })),
        cc_emails: ccRecipients.map(r => ({
          email: r.emailAddress.address,
          name: r.emailAddress.name || r.emailAddress.address,
        })),
        bcc_emails: bccRecipients.map(r => ({
          email: r.emailAddress.address,
          name: r.emailAddress.name || r.emailAddress.address,
        })),
        subject,
        body_text: isHtml ? '' : body,
        body_html: isHtml ? body : '',
        snippet: body.substring(0, 200),
        labels: ['SENT'],
        is_sent: true,
        sent_at: new Date().toISOString(),
      })
    }

    return new Response(
      JSON.stringify({
        success: true,
        messageId: saveDraft ? responseData.id : null,
        conversationId: saveDraft ? responseData.conversationId : conversationId,
        draftId: saveDraft ? responseData.id : undefined,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Microsoft send error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
