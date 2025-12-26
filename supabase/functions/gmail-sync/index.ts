// Gmail Sync Edge Function
// Fetches emails from Gmail API and stores in Supabase

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface GmailMessage {
  id: string
  threadId: string
  labelIds: string[]
  snippet: string
  payload: {
    headers: { name: string; value: string }[]
    mimeType: string
    body?: { data?: string; size: number }
    parts?: any[]
  }
  internalDate: string
}

interface GmailThread {
  id: string
  messages: GmailMessage[]
}

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

function decodeBase64Url(data: string): string {
  const base64 = data.replace(/-/g, '+').replace(/_/g, '/')
  const padding = '='.repeat((4 - (base64.length % 4)) % 4)
  try {
    return atob(base64 + padding)
  } catch {
    return ''
  }
}

function getHeader(headers: { name: string; value: string }[], name: string): string {
  const header = headers.find(h => h.name.toLowerCase() === name.toLowerCase())
  return header?.value || ''
}

function extractEmailBody(payload: any): { text: string; html: string } {
  let text = ''
  let html = ''

  if (payload.body?.data) {
    const decoded = decodeBase64Url(payload.body.data)
    if (payload.mimeType === 'text/plain') {
      text = decoded
    } else if (payload.mimeType === 'text/html') {
      html = decoded
    }
  }

  if (payload.parts) {
    for (const part of payload.parts) {
      if (part.mimeType === 'text/plain' && part.body?.data) {
        text = decodeBase64Url(part.body.data)
      } else if (part.mimeType === 'text/html' && part.body?.data) {
        html = decodeBase64Url(part.body.data)
      } else if (part.parts) {
        const nested = extractEmailBody(part)
        if (nested.text) text = nested.text
        if (nested.html) html = nested.html
      }
    }
  }

  return { text, html }
}

function extractAttachments(payload: any, messageId: string): any[] {
  const attachments: any[] = []

  function processParts(parts: any[]) {
    for (const part of parts) {
      if (part.filename && part.body?.attachmentId) {
        attachments.push({
          filename: part.filename,
          mime_type: part.mimeType,
          size: part.body.size,
          attachment_id: part.body.attachmentId,
          message_id: messageId,
        })
      }
      if (part.parts) {
        processParts(part.parts)
      }
    }
  }

  if (payload.parts) {
    processParts(payload.parts)
  }

  return attachments
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { connectionId, maxResults = 50, pageToken } = await req.json()

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

    // Build query for threads list
    const syncDate = connection.sync_from_date || '2024-01-01'
    const query = `after:${syncDate}`

    const threadsUrl = new URL('https://gmail.googleapis.com/gmail/v1/users/me/threads')
    threadsUrl.searchParams.set('maxResults', maxResults.toString())
    threadsUrl.searchParams.set('q', query)
    if (pageToken) {
      threadsUrl.searchParams.set('pageToken', pageToken)
    }

    // Fetch threads list
    const threadsResponse = await fetch(threadsUrl.toString(), {
      headers: { Authorization: `Bearer ${accessToken}` },
    })

    if (!threadsResponse.ok) {
      const error = await threadsResponse.text()
      throw new Error(`Failed to fetch threads: ${error}`)
    }

    const threadsData = await threadsResponse.json()
    const threadIds = threadsData.threads || []

    const syncedThreads: any[] = []
    const syncedMessages: any[] = []
    const allAttachments: any[] = []

    // Fetch each thread's full details
    for (const threadItem of threadIds) {
      const threadResponse = await fetch(
        `https://gmail.googleapis.com/gmail/v1/users/me/threads/${threadItem.id}?format=full`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      )

      if (!threadResponse.ok) continue

      const thread: GmailThread = await threadResponse.json()
      const firstMessage = thread.messages[0]
      const lastMessage = thread.messages[thread.messages.length - 1]

      // Extract participants
      const participants = new Set<string>()
      for (const msg of thread.messages) {
        const from = getHeader(msg.payload.headers, 'From')
        const to = getHeader(msg.payload.headers, 'To')
        const cc = getHeader(msg.payload.headers, 'Cc')

        if (from) participants.add(from)
        to.split(',').forEach(p => p.trim() && participants.add(p.trim()))
        cc.split(',').forEach(p => p.trim() && participants.add(p.trim()))
      }

      // Determine folder based on labels
      let folder = 'inbox'
      const labels = lastMessage.labelIds || []
      if (labels.includes('SENT')) folder = 'sent'
      else if (labels.includes('TRASH')) folder = 'trash'
      else if (labels.includes('DRAFT')) folder = 'drafts'

      const threadData = {
        google_thread_id: thread.id,
        connection_id: connectionId,
        user_id: user.id,
        subject: getHeader(firstMessage.payload.headers, 'Subject'),
        snippet: lastMessage.snippet,
        participants: Array.from(participants),
        message_count: thread.messages.length,
        has_attachments: thread.messages.some(m =>
          m.payload.parts?.some(p => p.filename && p.body?.attachmentId)
        ),
        is_unread: labels.includes('UNREAD'),
        is_starred: labels.includes('STARRED'),
        folder,
        labels,
        first_message_at: new Date(parseInt(firstMessage.internalDate)).toISOString(),
        last_message_at: new Date(parseInt(lastMessage.internalDate)).toISOString(),
      }

      // Upsert thread
      const { data: upsertedThread, error: threadError } = await supabase
        .from('email_threads')
        .upsert(threadData, { onConflict: 'google_thread_id' })
        .select()
        .single()

      if (threadError) {
        console.error('Thread upsert error:', threadError)
        continue
      }

      syncedThreads.push(upsertedThread)

      // Process messages
      for (const msg of thread.messages) {
        const { text, html } = extractEmailBody(msg.payload)
        const attachments = extractAttachments(msg.payload, msg.id)

        const messageData = {
          google_message_id: msg.id,
          thread_id: upsertedThread.id,
          connection_id: connectionId,
          user_id: user.id,
          from_address: getHeader(msg.payload.headers, 'From'),
          to_addresses: getHeader(msg.payload.headers, 'To').split(',').map(s => s.trim()).filter(Boolean),
          cc_addresses: getHeader(msg.payload.headers, 'Cc').split(',').map(s => s.trim()).filter(Boolean),
          bcc_addresses: getHeader(msg.payload.headers, 'Bcc').split(',').map(s => s.trim()).filter(Boolean),
          subject: getHeader(msg.payload.headers, 'Subject'),
          body_text: text,
          body_html: html,
          snippet: msg.snippet,
          labels: msg.labelIds || [],
          is_sent: msg.labelIds?.includes('SENT') || false,
          sent_at: new Date(parseInt(msg.internalDate)).toISOString(),
        }

        const { data: upsertedMessage, error: msgError } = await supabase
          .from('email_messages')
          .upsert(messageData, { onConflict: 'google_message_id' })
          .select()
          .single()

        if (!msgError && upsertedMessage) {
          syncedMessages.push(upsertedMessage)

          // Store attachments
          for (const att of attachments) {
            allAttachments.push({
              message_id: upsertedMessage.id,
              google_attachment_id: att.attachment_id,
              filename: att.filename,
              mime_type: att.mime_type,
              size: att.size,
            })
          }
        }
      }
    }

    // Batch insert attachments
    if (allAttachments.length > 0) {
      await supabase
        .from('email_attachments')
        .upsert(allAttachments, { onConflict: 'google_attachment_id' })
    }

    // Update last sync time
    await supabase
      .from('google_connections')
      .update({ last_sync_at: new Date().toISOString() })
      .eq('id', connectionId)

    return new Response(
      JSON.stringify({
        success: true,
        threadsCount: syncedThreads.length,
        messagesCount: syncedMessages.length,
        attachmentsCount: allAttachments.length,
        nextPageToken: threadsData.nextPageToken,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Gmail sync error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
