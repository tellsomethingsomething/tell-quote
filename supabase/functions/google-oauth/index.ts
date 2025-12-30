// Google OAuth Edge Function
// Consolidated to use google_connections table (single source of truth)

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const GOOGLE_CLIENT_ID = Deno.env.get('GOOGLE_CLIENT_ID')!
const GOOGLE_CLIENT_SECRET = Deno.env.get('GOOGLE_CLIENT_SECRET')!
const GOOGLE_REDIRECT_URI = Deno.env.get('GOOGLE_REDIRECT_URI') || 'https://productionos.io/auth/google/callback'

const SCOPES = [
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/gmail.send',
  'https://www.googleapis.com/auth/calendar.events',
  'https://www.googleapis.com/auth/userinfo.email',
  'https://www.googleapis.com/auth/userinfo.profile',
]

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const url = new URL(req.url)
  const action = url.pathname.split('/').pop()

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // Generate OAuth URL
    if (action === 'auth-url') {
      const { userId } = await req.json()

      if (!userId) {
        return new Response(
          JSON.stringify({ error: 'userId is required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const state = btoa(JSON.stringify({ userId }))

      const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth')
      authUrl.searchParams.set('client_id', GOOGLE_CLIENT_ID)
      authUrl.searchParams.set('redirect_uri', GOOGLE_REDIRECT_URI)
      authUrl.searchParams.set('response_type', 'code')
      authUrl.searchParams.set('scope', SCOPES.join(' '))
      authUrl.searchParams.set('access_type', 'offline')
      authUrl.searchParams.set('prompt', 'consent')
      authUrl.searchParams.set('state', state)

      return new Response(
        JSON.stringify({ url: authUrl.toString() }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Exchange code for tokens
    if (action === 'callback') {
      const { code, state } = await req.json()

      if (!code || !state) {
        return new Response(
          JSON.stringify({ error: 'code and state are required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Decode state to get userId
      let userId: string
      try {
        const stateData = JSON.parse(atob(state))
        userId = stateData.userId
      } catch {
        return new Response(
          JSON.stringify({ error: 'Invalid state parameter' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Exchange code for tokens
      const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          code,
          client_id: GOOGLE_CLIENT_ID,
          client_secret: GOOGLE_CLIENT_SECRET,
          redirect_uri: GOOGLE_REDIRECT_URI,
          grant_type: 'authorization_code',
        }),
      })

      const tokenData = await tokenResponse.json()

      if (tokenData.error) {
        return new Response(
          JSON.stringify({ error: tokenData.error_description || tokenData.error }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Get user info from Google
      const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: { Authorization: `Bearer ${tokenData.access_token}` },
      })
      const userInfo = await userInfoResponse.json()

      // Calculate expiry time
      const expiresAt = new Date(Date.now() + tokenData.expires_in * 1000).toISOString()

      // Upsert connection in google_connections table (single source of truth)
      const { error: dbError } = await supabase
        .from('google_connections')
        .upsert({
          user_id: userId,
          google_email: userInfo.email,
          google_user_id: userInfo.id,
          google_name: userInfo.name || userInfo.email?.split('@')[0],
          google_picture: userInfo.picture,
          access_token: tokenData.access_token,
          refresh_token: tokenData.refresh_token,
          token_expires_at: expiresAt,
          scopes: SCOPES,
          status: 'active',
          sync_enabled: true,
          sync_from_date: new Date().toISOString().split('T')[0],
        }, {
          onConflict: 'user_id,google_email',
        })

      if (dbError) {
        console.error('Database error:', dbError)
        return new Response(
          JSON.stringify({ error: dbError.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      return new Response(
        JSON.stringify({
          success: true,
          email: userInfo.email,
          name: userInfo.name,
          expiresAt,
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Refresh access token
    if (action === 'refresh') {
      const { userId } = await req.json()

      if (!userId) {
        return new Response(
          JSON.stringify({ error: 'userId is required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Get current connection
      const { data: connection, error: fetchError } = await supabase
        .from('google_connections')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'active')
        .single()

      if (fetchError || !connection) {
        return new Response(
          JSON.stringify({ error: 'No active Google connection found for user' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Refresh the token
      const refreshResponse = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: GOOGLE_CLIENT_ID,
          client_secret: GOOGLE_CLIENT_SECRET,
          refresh_token: connection.refresh_token,
          grant_type: 'refresh_token',
        }),
      })

      const refreshData = await refreshResponse.json()

      if (refreshData.error) {
        // If refresh fails, mark connection as inactive
        if (refreshData.error === 'invalid_grant') {
          await supabase
            .from('google_connections')
            .update({ status: 'expired' })
            .eq('id', connection.id)
        }
        return new Response(
          JSON.stringify({ error: refreshData.error_description || refreshData.error }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Calculate new expiry
      const expiresAt = new Date(Date.now() + refreshData.expires_in * 1000).toISOString()

      // Update connection in database
      const { error: updateError } = await supabase
        .from('google_connections')
        .update({
          access_token: refreshData.access_token,
          token_expires_at: expiresAt,
        })
        .eq('id', connection.id)

      if (updateError) {
        return new Response(
          JSON.stringify({ error: updateError.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      return new Response(
        JSON.stringify({
          success: true,
          accessToken: refreshData.access_token,
          expiresAt,
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get connection status
    if (action === 'status') {
      const { userId } = await req.json()

      if (!userId) {
        return new Response(
          JSON.stringify({ error: 'userId is required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const { data: connection } = await supabase
        .from('google_connections')
        .select('google_email, google_name, google_picture, token_expires_at, scopes, status, sync_enabled')
        .eq('user_id', userId)
        .eq('status', 'active')
        .single()

      if (!connection) {
        return new Response(
          JSON.stringify({ connected: false }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      return new Response(
        JSON.stringify({
          connected: true,
          email: connection.google_email,
          name: connection.google_name,
          picture: connection.google_picture,
          expiresAt: connection.token_expires_at,
          scopes: connection.scopes,
          syncEnabled: connection.sync_enabled,
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Disconnect (revoke and delete connection)
    if (action === 'disconnect') {
      const { userId } = await req.json()

      if (!userId) {
        return new Response(
          JSON.stringify({ error: 'userId is required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Get connection to revoke
      const { data: connection } = await supabase
        .from('google_connections')
        .select('id, access_token')
        .eq('user_id', userId)
        .eq('status', 'active')
        .single()

      if (connection) {
        // Revoke token at Google
        try {
          await fetch(`https://oauth2.googleapis.com/revoke?token=${connection.access_token}`, {
            method: 'POST',
          })
        } catch (e) {
          console.error('Token revocation failed:', e)
        }

        // Mark as disconnected (soft delete)
        await supabase
          .from('google_connections')
          .update({ status: 'disconnected' })
          .eq('id', connection.id)
      }

      return new Response(
        JSON.stringify({ success: true }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ error: 'Unknown action' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Google OAuth error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
