// Microsoft Email Sync Edge Function
// Fetches emails from Microsoft Graph API and stores in Supabase
// SECURITY: Includes proper CORS and encrypted token storage

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { getCorsHeaders, handleCorsPrelight } from '../_shared/cors.ts'

interface GraphMessage {
  id: string
  conversationId: string
  subject: string
  bodyPreview: string
  body: {
    contentType: string
    content: string
  }
  from: {
    emailAddress: {
      name: string
      address: string
    }
  }
  toRecipients: Array<{
    emailAddress: {
      name: string
      address: string
    }
  }>
  ccRecipients: Array<{
    emailAddress: {
      name: string
      address: string
    }
  }>
  bccRecipients: Array<{
    emailAddress: {
      name: string
      address: string
    }
  }>
  sentDateTime: string
  receivedDateTime: string
  hasAttachments: boolean
  isRead: boolean
  isDraft: boolean
  importance: string
  flag: {
    flagStatus: string
  }
  parentFolderId: string
}

interface GraphAttachment {
  id: string
  name: string
  contentType: string
  size: number
  isInline: boolean
  contentId?: string
}

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

function extractEmailAddress(recipient: { emailAddress: { name: string; address: string } }) {
  return {
    email: recipient.emailAddress.address,
    name: recipient.emailAddress.name || recipient.emailAddress.address,
  }
}

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req)

  if (req.method === 'OPTIONS') {
    return handleCorsPrelight(req)
  }

  try {
    const { connectionId, maxResults = 50, skipToken } = await req.json()

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

    // Build query for messages
    const syncDate = connection.sync_from_date || '2024-01-01'
    const filterDate = new Date(syncDate).toISOString()

    let messagesUrl = `https://graph.microsoft.com/v1.0/me/messages?$top=${maxResults}&$orderby=receivedDateTime desc&$filter=receivedDateTime ge ${filterDate}&$select=id,conversationId,subject,bodyPreview,body,from,toRecipients,ccRecipients,bccRecipients,sentDateTime,receivedDateTime,hasAttachments,isRead,isDraft,importance,flag,parentFolderId`

    if (skipToken) {
      messagesUrl = skipToken // Use the full skipToken URL
    }

    // Fetch messages from Microsoft Graph
    const messagesResponse = await fetch(messagesUrl, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })

    if (!messagesResponse.ok) {
      const error = await messagesResponse.text()
      throw new Error(`Failed to fetch messages: ${error}`)
    }

    const messagesData = await messagesResponse.json()
    const messages: GraphMessage[] = messagesData.value || []
    const nextSkipToken = messagesData['@odata.nextLink'] || null

    // Group messages by conversation
    const conversationMap = new Map<string, GraphMessage[]>()
    for (const msg of messages) {
      const conversationId = msg.conversationId
      if (!conversationMap.has(conversationId)) {
        conversationMap.set(conversationId, [])
      }
      conversationMap.get(conversationId)!.push(msg)
    }

    const syncedThreads: any[] = []
    const syncedMessages: any[] = []
    const allAttachments: any[] = []

    // Process each conversation as a thread
    for (const [conversationId, convMessages] of conversationMap) {
      // Sort messages by date
      convMessages.sort((a, b) => new Date(a.receivedDateTime).getTime() - new Date(b.receivedDateTime).getTime())

      const firstMessage = convMessages[0]
      const lastMessage = convMessages[convMessages.length - 1]

      // Extract participants
      const participants = new Set<string>()
      for (const msg of convMessages) {
        participants.add(JSON.stringify(extractEmailAddress(msg.from)))
        msg.toRecipients.forEach(r => participants.add(JSON.stringify(extractEmailAddress(r))))
        msg.ccRecipients.forEach(r => participants.add(JSON.stringify(extractEmailAddress(r))))
      }

      // Determine folder
      let folder = 'inbox'
      if (lastMessage.parentFolderId?.toLowerCase().includes('sent')) folder = 'sent'
      else if (lastMessage.parentFolderId?.toLowerCase().includes('deleted')) folder = 'trash'
      else if (lastMessage.parentFolderId?.toLowerCase().includes('drafts')) folder = 'drafts'

      const threadData = {
        provider: 'microsoft',
        provider_thread_id: conversationId,
        microsoft_connection_id: connectionId,
        user_id: user.id,
        subject: firstMessage.subject,
        snippet: lastMessage.bodyPreview,
        participants: Array.from(participants).map(p => JSON.parse(p)),
        message_count: convMessages.length,
        has_attachments: convMessages.some(m => m.hasAttachments),
        is_unread: convMessages.some(m => !m.isRead),
        is_starred: convMessages.some(m => m.flag?.flagStatus === 'flagged'),
        folder,
        labels: [],
        first_message_at: new Date(firstMessage.receivedDateTime).toISOString(),
        last_message_at: new Date(lastMessage.receivedDateTime).toISOString(),
      }

      // Upsert thread
      const { data: upsertedThread, error: threadError } = await supabase
        .from('email_threads')
        .upsert(threadData, { onConflict: 'provider,provider_thread_id' })
        .select()
        .single()

      if (threadError) {
        console.error('Thread upsert error:', threadError)
        continue
      }

      syncedThreads.push(upsertedThread)

      // Process messages
      for (const msg of convMessages) {
        const messageData = {
          provider: 'microsoft',
          provider_message_id: msg.id,
          thread_id: upsertedThread.id,
          from_email: msg.from.emailAddress.address,
          from_name: msg.from.emailAddress.name,
          to_emails: msg.toRecipients.map(extractEmailAddress),
          cc_emails: msg.ccRecipients.map(extractEmailAddress),
          bcc_emails: msg.bccRecipients?.map(extractEmailAddress) || [],
          subject: msg.subject,
          body_text: msg.body.contentType === 'text' ? msg.body.content : '',
          body_html: msg.body.contentType === 'html' ? msg.body.content : '',
          snippet: msg.bodyPreview,
          is_read: msg.isRead,
          is_starred: msg.flag?.flagStatus === 'flagged',
          is_draft: msg.isDraft,
          is_sent: msg.parentFolderId?.toLowerCase().includes('sent') || false,
          labels: [],
          internal_date: new Date(msg.receivedDateTime).toISOString(),
          sent_at: msg.sentDateTime ? new Date(msg.sentDateTime).toISOString() : null,
          received_at: new Date(msg.receivedDateTime).toISOString(),
        }

        const { data: upsertedMessage, error: msgError } = await supabase
          .from('email_messages')
          .upsert(messageData, { onConflict: 'provider,provider_message_id' })
          .select()
          .single()

        if (!msgError && upsertedMessage) {
          syncedMessages.push(upsertedMessage)

          // Fetch attachments if message has them
          if (msg.hasAttachments) {
            const attachmentsResponse = await fetch(
              `https://graph.microsoft.com/v1.0/me/messages/${msg.id}/attachments`,
              { headers: { Authorization: `Bearer ${accessToken}` } }
            )

            if (attachmentsResponse.ok) {
              const attachmentsData = await attachmentsResponse.json()
              const attachments: GraphAttachment[] = attachmentsData.value || []

              for (const att of attachments) {
                allAttachments.push({
                  provider: 'microsoft',
                  provider_attachment_id: att.id,
                  message_id: upsertedMessage.id,
                  filename: att.name,
                  mime_type: att.contentType,
                  size_bytes: att.size,
                  is_inline: att.isInline || false,
                  content_id: att.contentId,
                })
              }
            }
          }
        }
      }
    }

    // Batch insert attachments
    if (allAttachments.length > 0) {
      await supabase
        .from('email_attachments')
        .upsert(allAttachments, { onConflict: 'provider,provider_attachment_id' })
    }

    // Update last sync time
    await supabase
      .from('microsoft_connections')
      .update({ last_sync_at: new Date().toISOString() })
      .eq('id', connectionId)

    return new Response(
      JSON.stringify({
        success: true,
        threadsCount: syncedThreads.length,
        messagesCount: syncedMessages.length,
        attachmentsCount: allAttachments.length,
        nextSkipToken,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Microsoft sync error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
