import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { userId, clientEmails, since } = await req.json()

    if (!userId) {
      return new Response(
        JSON.stringify({ error: 'userId is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!clientEmails || clientEmails.length === 0) {
      return new Response(
        JSON.stringify({ emails: [] }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // Get access token
    const { data: tokenRecord, error: tokenError } = await supabase
      .from('google_tokens')
      .select('access_token, expires_at')
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

    // Build Gmail search query
    // Search for emails from/to any of the client emails
    const emailQuery = clientEmails
      .map((email: string) => `from:${email} OR to:${email}`)
      .join(' OR ')

    // Add date filter if provided
    let query = `(${emailQuery})`
    if (since) {
      const sinceDate = new Date(since)
      const afterDate = `${sinceDate.getFullYear()}/${sinceDate.getMonth() + 1}/${sinceDate.getDate()}`
      query += ` after:${afterDate}`
    }

    // Fetch emails from Gmail API
    const searchUrl = new URL('https://gmail.googleapis.com/gmail/v1/users/me/messages')
    searchUrl.searchParams.set('q', query)
    searchUrl.searchParams.set('maxResults', '50')

    const searchResponse = await fetch(searchUrl.toString(), {
      headers: { Authorization: `Bearer ${tokenRecord.access_token}` },
    })

    if (!searchResponse.ok) {
      const errorData = await searchResponse.json()
      return new Response(
        JSON.stringify({ error: errorData.error?.message || 'Gmail API error' }),
        { status: searchResponse.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const searchData = await searchResponse.json()
    const messageIds = searchData.messages?.map((m: { id: string }) => m.id) || []

    if (messageIds.length === 0) {
      return new Response(
        JSON.stringify({ emails: [] }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Fetch message details (batch)
    const emails = await Promise.all(
      messageIds.slice(0, 20).map(async (id: string) => {
        const msgResponse = await fetch(
          `https://gmail.googleapis.com/gmail/v1/users/me/messages/${id}?format=metadata&metadataHeaders=From&metadataHeaders=To&metadataHeaders=Subject&metadataHeaders=Date`,
          { headers: { Authorization: `Bearer ${tokenRecord.access_token}` } }
        )

        if (!msgResponse.ok) return null

        const msgData = await msgResponse.json()
        const headers = msgData.payload?.headers || []

        const getHeader = (name: string) =>
          headers.find((h: { name: string; value: string }) => h.name.toLowerCase() === name.toLowerCase())?.value

        const from = getHeader('From') || ''
        const to = getHeader('To') || ''
        const subject = getHeader('Subject') || '(No subject)'
        const date = getHeader('Date')

        // Determine if this is incoming or outgoing
        const fromEmail = from.match(/<(.+?)>/)?.[1] || from
        const direction = clientEmails.some((e: string) => fromEmail.toLowerCase().includes(e.toLowerCase()))
          ? 'incoming'
          : 'outgoing'

        // Match to a client
        const matchedClient = clientEmails.find((e: string) =>
          from.toLowerCase().includes(e.toLowerCase()) ||
          to.toLowerCase().includes(e.toLowerCase())
        )

        return {
          id: msgData.id,
          threadId: msgData.threadId,
          subject,
          snippet: msgData.snippet,
          from: fromEmail,
          to: to.match(/<(.+?)>/)?.[1] || to,
          date: date ? new Date(date).toISOString() : new Date().toISOString(),
          direction,
          matchedEmail: matchedClient,
        }
      })
    )

    const validEmails = emails.filter(Boolean)

    return new Response(
      JSON.stringify({ emails: validEmails }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
