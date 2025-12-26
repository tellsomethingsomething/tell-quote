// Email Tracking Pixel Edge Function
// Returns a 1x1 transparent GIF and logs email opens

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// 1x1 transparent GIF
const TRANSPARENT_GIF = new Uint8Array([
  0x47, 0x49, 0x46, 0x38, 0x39, 0x61, 0x01, 0x00, 0x01, 0x00,
  0x80, 0x00, 0x00, 0xff, 0xff, 0xff, 0x00, 0x00, 0x00, 0x21,
  0xf9, 0x04, 0x01, 0x00, 0x00, 0x00, 0x00, 0x2c, 0x00, 0x00,
  0x00, 0x00, 0x01, 0x00, 0x01, 0x00, 0x00, 0x02, 0x02, 0x44,
  0x01, 0x00, 0x3b
])

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

    if (!trackingId) {
      return new Response(TRANSPARENT_GIF, {
        headers: {
          'Content-Type': 'image/gif',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
        },
      })
    }

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

    if (messageError || !message) {
      console.error('Message not found for tracking ID:', trackingId)
      return new Response(TRANSPARENT_GIF, {
        headers: {
          'Content-Type': 'image/gif',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
        },
      })
    }

    // Record the tracking event
    const { error: insertError } = await supabase
      .from('email_tracking_events')
      .insert({
        message_id: message.id,
        tracking_id: trackingId,
        event_type: 'open',
        recipient_email: message.recipient_email,
        user_agent: userAgent.substring(0, 500), // Truncate if too long
        ip_address: ipAddress,
        device_type: getDeviceType(userAgent),
        occurred_at: new Date().toISOString(),
      })

    if (insertError) {
      console.error('Failed to record tracking event:', insertError)
    }

    // Return the transparent pixel
    return new Response(TRANSPARENT_GIF, {
      headers: {
        'Content-Type': 'image/gif',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    })

  } catch (error) {
    console.error('Error in tracking pixel:', error)
    // Always return the pixel even if logging fails
    return new Response(TRANSPARENT_GIF, {
      headers: {
        'Content-Type': 'image/gif',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    })
  }
})
