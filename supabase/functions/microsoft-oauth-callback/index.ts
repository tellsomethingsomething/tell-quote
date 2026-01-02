// Microsoft OAuth Callback Edge Function
// Handles OAuth callback from Microsoft Identity Platform
// SECURITY: Includes encrypted token storage

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { getCorsHeaders, handleCorsPrelight } from '../_shared/cors.ts'
import { checkRateLimit, rateLimitExceededResponse } from '../_shared/rateLimit.ts'

interface MicrosoftTokenResponse {
  access_token: string
  refresh_token: string
  expires_in: number
  token_type: string
  scope: string
}

interface MicrosoftUserInfo {
  id: string
  displayName: string
  mail: string
  userPrincipalName: string
}

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req)

  if (req.method === 'OPTIONS') {
    return handleCorsPrelight(req)
  }

  try {
    const url = new URL(req.url)
    const code = url.searchParams.get('code')
    const state = url.searchParams.get('state')
    const error = url.searchParams.get('error')
    const errorDescription = url.searchParams.get('error_description')

    // Handle OAuth errors
    if (error) {
      const redirectUrl = new URL(state || Deno.env.get('APP_URL') || 'https://productionos.io')
      redirectUrl.searchParams.set('error', error)
      redirectUrl.searchParams.set('error_description', errorDescription || '')
      return Response.redirect(redirectUrl.toString(), 302)
    }

    if (!code) {
      throw new Error('Authorization code is required')
    }

    const MICROSOFT_CLIENT_ID = Deno.env.get('MICROSOFT_CLIENT_ID')
    const MICROSOFT_CLIENT_SECRET = Deno.env.get('MICROSOFT_CLIENT_SECRET')
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    const APP_URL = state || Deno.env.get('APP_URL') || 'https://productionos.io'

    if (!MICROSOFT_CLIENT_ID || !MICROSOFT_CLIENT_SECRET) {
      throw new Error('Microsoft OAuth credentials not configured')
    }

    // Determine redirect URI based on environment
    const redirectUri = `${SUPABASE_URL}/functions/v1/microsoft-oauth-callback`

    // Exchange authorization code for tokens
    const tokenResponse = await fetch('https://login.microsoftonline.com/common/oauth2/v2.0/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: MICROSOFT_CLIENT_ID,
        client_secret: MICROSOFT_CLIENT_SECRET,
        code,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    })

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.json()
      throw new Error(errorData.error_description || 'Failed to exchange authorization code')
    }

    const tokens: MicrosoftTokenResponse = await tokenResponse.json()

    // Get user info from Microsoft Graph
    const userResponse = await fetch('https://graph.microsoft.com/v1.0/me', {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    })

    if (!userResponse.ok) {
      throw new Error('Failed to get user info from Microsoft')
    }

    const userInfo: MicrosoftUserInfo = await userResponse.json()

    // Get user's email (could be mail or userPrincipalName)
    const email = userInfo.mail || userInfo.userPrincipalName

    // Get user photo URL (optional)
    let photoUrl = null
    try {
      const photoResponse = await fetch('https://graph.microsoft.com/v1.0/me/photo/$value', {
        headers: { Authorization: `Bearer ${tokens.access_token}` },
      })
      if (photoResponse.ok) {
        // Photo exists, construct URL
        photoUrl = 'https://graph.microsoft.com/v1.0/me/photo/$value'
      }
    } catch {
      // No photo available, that's fine
    }

    // Initialize Supabase client with service role key
    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!)

    // Parse state to get user ID (format: "userId|redirectUrl")
    let userId: string | null = null
    let finalRedirectUrl = APP_URL

    if (state) {
      const [stateUserId, stateRedirectUrl] = state.split('|')
      userId = stateUserId || null
      finalRedirectUrl = stateRedirectUrl || APP_URL
    }

    // If no user ID in state, try to find user by email
    if (!userId) {
      const { data: user } = await supabase
        .from('user_profiles')
        .select('id')
        .eq('email', email)
        .single()

      userId = user?.id
    }

    if (!userId) {
      throw new Error('User ID not found. Please log in first.')
    }

    // Calculate token expiry
    const tokenExpiresAt = new Date()
    tokenExpiresAt.setSeconds(tokenExpiresAt.getSeconds() + tokens.expires_in)

    // Parse scopes
    const scopes = tokens.scope.split(' ')

    // SECURITY: Encrypt tokens before storage
    const { data: encryptedAccess } = await supabase.rpc('encrypt_token', {
      token_text: tokens.access_token
    })
    const { data: encryptedRefresh } = await supabase.rpc('encrypt_token', {
      token_text: tokens.refresh_token
    })

    // Upsert Microsoft connection with encrypted tokens only
    const { data: connection, error: upsertError } = await supabase
      .from('microsoft_connections')
      .upsert({
        user_id: userId,
        microsoft_email: email,
        microsoft_user_id: userInfo.id,
        microsoft_name: userInfo.displayName,
        microsoft_picture: photoUrl,
        // SECURITY: Only store encrypted tokens
        access_token_encrypted: encryptedAccess,
        refresh_token_encrypted: encryptedRefresh,
        token_expires_at: tokenExpiresAt.toISOString(),
        scopes,
        status: 'active',
        error_message: null,
        sync_enabled: true,
        sync_from_date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Last 30 days
      }, {
        onConflict: 'user_id,microsoft_email',
      })
      .select()
      .single()

    if (upsertError) {
      throw new Error(`Failed to save Microsoft connection: ${upsertError.message}`)
    }

    // Redirect back to app with success
    const redirectUrl = new URL(finalRedirectUrl)
    redirectUrl.searchParams.set('microsoft_connected', 'true')
    redirectUrl.searchParams.set('email', email)

    return Response.redirect(redirectUrl.toString(), 302)

  } catch (error) {
    console.error('Microsoft OAuth error:', error)

    // Redirect back with error
    const errorRedirectUrl = new URL(Deno.env.get('APP_URL') || 'https://productionos.io')
    errorRedirectUrl.searchParams.set('error', 'microsoft_oauth_failed')
    errorRedirectUrl.searchParams.set('error_description', error.message)

    return Response.redirect(errorRedirectUrl.toString(), 302)
  }
})
