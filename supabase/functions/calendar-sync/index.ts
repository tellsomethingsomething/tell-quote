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

  const url = new URL(req.url)
  const action = url.pathname.split('/').pop()

  try {
    const body = await req.json()
    const { userId } = body

    if (!userId) {
      return new Response(
        JSON.stringify({ error: 'userId is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // Get access token from google_connections (single source of truth)
    const { data: connection, error: connError } = await supabase
      .from('google_connections')
      .select('access_token, token_expires_at')
      .eq('user_id', userId)
      .eq('status', 'active')
      .single()

    if (connError || !connection) {
      return new Response(
        JSON.stringify({ error: 'No active Google connection found' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check if token is expired
    if (new Date(connection.token_expires_at) < new Date()) {
      return new Response(
        JSON.stringify({ error: 'Token expired, please refresh' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const accessToken = connection.access_token
    const calendarId = 'primary'

    // Create calendar event
    if (action === 'create') {
      const { event } = body

      if (!event?.title || !event?.startDate) {
        return new Response(
          JSON.stringify({ error: 'event.title and event.startDate are required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Build Google Calendar event
      const startDate = new Date(event.startDate)
      const endDate = event.endDate ? new Date(event.endDate) : new Date(startDate.getTime() + 60 * 60 * 1000) // Default 1 hour

      const calendarEvent = {
        summary: event.title,
        description: event.description || '',
        start: event.allDay
          ? { date: startDate.toISOString().split('T')[0] }
          : { dateTime: startDate.toISOString() },
        end: event.allDay
          ? { date: endDate.toISOString().split('T')[0] }
          : { dateTime: endDate.toISOString() },
        reminders: {
          useDefault: false,
          overrides: [
            { method: 'popup', minutes: 24 * 60 }, // 1 day before
            { method: 'popup', minutes: 60 }, // 1 hour before
          ],
        },
      }

      const createResponse = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(calendarEvent),
        }
      )

      if (!createResponse.ok) {
        const errorData = await createResponse.json()
        return new Response(
          JSON.stringify({ error: errorData.error?.message || 'Failed to create event' }),
          { status: createResponse.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const createdEvent = await createResponse.json()

      return new Response(
        JSON.stringify({
          success: true,
          eventId: createdEvent.id,
          htmlLink: createdEvent.htmlLink,
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Update calendar event
    if (action === 'update') {
      const { eventId, event } = body

      if (!eventId || !event) {
        return new Response(
          JSON.stringify({ error: 'eventId and event are required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const startDate = event.startDate ? new Date(event.startDate) : null
      const endDate = event.endDate ? new Date(event.endDate) : (startDate ? new Date(startDate.getTime() + 60 * 60 * 1000) : null)

      const updateData: Record<string, unknown> = {}
      if (event.title) updateData.summary = event.title
      if (event.description !== undefined) updateData.description = event.description
      if (startDate) {
        updateData.start = event.allDay
          ? { date: startDate.toISOString().split('T')[0] }
          : { dateTime: startDate.toISOString() }
      }
      if (endDate) {
        updateData.end = event.allDay
          ? { date: endDate.toISOString().split('T')[0] }
          : { dateTime: endDate.toISOString() }
      }

      const updateResponse = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events/${eventId}`,
        {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(updateData),
        }
      )

      if (!updateResponse.ok) {
        const errorData = await updateResponse.json()
        return new Response(
          JSON.stringify({ error: errorData.error?.message || 'Failed to update event' }),
          { status: updateResponse.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const updatedEvent = await updateResponse.json()

      return new Response(
        JSON.stringify({
          success: true,
          eventId: updatedEvent.id,
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Delete calendar event
    if (action === 'delete') {
      const { eventId } = body

      if (!eventId) {
        return new Response(
          JSON.stringify({ error: 'eventId is required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const deleteResponse = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events/${eventId}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      )

      if (!deleteResponse.ok && deleteResponse.status !== 410) {
        const errorData = await deleteResponse.json()
        return new Response(
          JSON.stringify({ error: errorData.error?.message || 'Failed to delete event' }),
          { status: deleteResponse.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
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
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
