// Email Tracking Click Edge Function
// Logs email link clicks and redirects to the original URL

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Detect device type from user agent
function getDeviceType(userAgent: string): string {
  const ua = userAgent.toLowerCase()
  if (/mobile|android|iphone|ipad|tablet/.test(ua)) {
    return /tablet|ipad/.test(ua) ? 'tablet' : 'mobile'
  }
  return 'desktop'
}

Deno.serve(async (req) => {
  try {
    const url = new URL(req.url)
    const trackingId = url.searchParams.get('tid')
    const targetUrl = url.searchParams.get('url')

    // If no target URL, return an error
    if (!targetUrl) {
      return new Response('Missing URL parameter', { status: 400 })
    }

    // Decode the target URL
    let decodedUrl: string
    try {
      decodedUrl = decodeURIComponent(targetUrl)
    } catch {
      return new Response('Invalid URL', { status: 400 })
    }

    // Validate the URL
    try {
      new URL(decodedUrl)
    } catch {
      return new Response('Invalid URL format', { status: 400 })
    }

    // If we have a tracking ID, log the click
    if (trackingId) {
      // Create Supabase client with service role (for writing)
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!
      const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
      const supabase = createClient(supabaseUrl, supabaseServiceKey)

      // Get request metadata
      const userAgent = req.headers.get('user-agent') || ''
      const forwardedFor = req.headers.get('x-forwarded-for')
      const realIp = req.headers.get('x-real-ip')
      const ipAddress = forwardedFor?.split(',')[0]?.trim() || realIp || null

      // Look up the message by tracking ID
      const { data: message, error: messageError } = await supabase
        .from('email_messages')
        .select('id, recipient_email')
        .eq('tracking_id', trackingId)
        .single()

      if (!messageError && message) {
        // Record the click event
        const { error: insertError } = await supabase
          .from('email_tracking_events')
          .insert({
            message_id: message.id,
            tracking_id: trackingId,
            event_type: 'click',
            recipient_email: message.recipient_email,
            link_url: decodedUrl,
            user_agent: userAgent.substring(0, 500), // Truncate if too long
            ip_address: ipAddress,
            device_type: getDeviceType(userAgent),
            occurred_at: new Date().toISOString(),
          })

        if (insertError) {
          console.error('Failed to record click event:', insertError)
        }
      } else {
        console.error('Message not found for tracking ID:', trackingId)
      }
    }

    // Redirect to the target URL
    return new Response(null, {
      status: 302,
      headers: {
        'Location': decodedUrl,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    })

  } catch (error) {
    console.error('Error in click tracking:', error)

    // Try to redirect even if logging fails
    const url = new URL(req.url)
    const targetUrl = url.searchParams.get('url')
    if (targetUrl) {
      try {
        const decodedUrl = decodeURIComponent(targetUrl)
        return new Response(null, {
          status: 302,
          headers: { 'Location': decodedUrl },
        })
      } catch {
        // Fall through to error response
      }
    }

    return new Response('Error processing request', { status: 500 })
  }
})
