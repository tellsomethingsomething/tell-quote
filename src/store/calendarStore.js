import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { supabase } from '../lib/supabase';

// API configurations
const GRAPH_API_BASE = 'https://graph.microsoft.com/v1.0';
const GOOGLE_API_BASE = 'https://www.googleapis.com/calendar/v3';

// Calendar providers
export const CALENDAR_PROVIDERS = {
    microsoft: {
        id: 'microsoft',
        label: 'Microsoft Calendar',
        icon: 'microsoft',
        color: '#00A4EF',
    },
    google: {
        id: 'google',
        label: 'Google Calendar',
        icon: 'google',
        color: '#4285F4',
    },
};

// Event status types
export const EVENT_STATUS = {
    tentative: { label: 'Tentative', color: 'text-yellow-400', bgColor: 'bg-yellow-500/20' },
    confirmed: { label: 'Confirmed', color: 'text-green-400', bgColor: 'bg-green-500/20' },
    cancelled: { label: 'Cancelled', color: 'text-red-400', bgColor: 'bg-red-500/20' },
};

// Event types for categorization
export const EVENT_TYPES = {
    meeting: { label: 'Meeting', icon: '📅', color: 'text-blue-400' },
    call: { label: 'Call', icon: '📞', color: 'text-green-400' },
    presentation: { label: 'Presentation', icon: '📊', color: 'text-purple-400' },
    deadline: { label: 'Deadline', icon: '⏰', color: 'text-red-400' },
    reminder: { label: 'Reminder', icon: '🔔', color: 'text-amber-400' },
    shoot: { label: 'Shoot', icon: '🎬', color: 'text-brand-teal' },
    travel: { label: 'Travel', icon: '✈️', color: 'text-indigo-400' },
};

export const useCalendarStore = create(
    subscribeWithSelector((set, get) => ({
        // Data
        events: [],
        syncStatus: null, // 'connected' | 'syncing' | 'error' | null
        lastSyncAt: null,
        selectedDate: new Date(),
        viewMode: 'month', // 'day' | 'week' | 'month'

        // Microsoft auth state
        msAccessToken: null,
        msRefreshToken: null,
        msTokenExpiry: null,
        msCalendarId: null,
        msSyncStatus: null,

        // Google auth state
        googleAccessToken: null,
        googleRefreshToken: null,
        googleTokenExpiry: null,
        googleCalendarId: null,
        googleSyncStatus: null,

        // UI state
        isLoading: false,
        isSyncing: false,
        error: null,

        // ============================================================
        // INITIALIZATION
        // ============================================================

        initialize: async () => {
            await get().loadEvents();
            await get().checkMicrosoftConnection();
            await get().checkGoogleConnection();
        },

        // ============================================================
        // LOCAL EVENTS (stored in Supabase)
        // ============================================================

        loadEvents: async (startDate, endDate) => {
            set({ isLoading: true, error: null });

            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) throw new Error('Not authenticated');

                let query = supabase
                    .from('calendar_events')
                    .select('*')
                    .eq('user_id', user.id)
                    .order('start_time', { ascending: true });

                // Apply date filters if provided
                if (startDate) {
                    query = query.gte('start_time', startDate.toISOString());
                }
                if (endDate) {
                    query = query.lte('start_time', endDate.toISOString());
                }

                const { data, error } = await query;

                if (error) throw error;

                set({ events: data || [], isLoading: false });
            } catch (error) {
                console.error('Failed to load events:', error);
                set({ isLoading: false, error: error.message });
            }
        },

        createEvent: async (eventData) => {
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) throw new Error('Not authenticated');

                const { data, error } = await supabase
                    .from('calendar_events')
                    .insert({
                        user_id: user.id,
                        title: eventData.title,
                        description: eventData.description,
                        start_time: eventData.start_time,
                        end_time: eventData.end_time,
                        location: eventData.location,
                        event_type: eventData.event_type || 'meeting',
                        status: eventData.status || 'confirmed',
                        all_day: eventData.all_day || false,
                        attendees: eventData.attendees || [],
                        opportunity_id: eventData.opportunity_id,
                        client_id: eventData.client_id,
                        reminder_minutes: eventData.reminder_minutes || 15,
                        recurrence: eventData.recurrence,
                        metadata: eventData.metadata || {},
                    })
                    .select()
                    .single();

                if (error) throw error;

                set({ events: [...get().events, data] });

                // Sync to Microsoft if connected
                if (get().msAccessToken) {
                    await get().syncEventToMicrosoft(data);
                }

                return { success: true, event: data };
            } catch (error) {
                console.error('Failed to create event:', error);
                return { success: false, error: error.message };
            }
        },

        updateEvent: async (eventId, updates) => {
            try {
                const { data, error } = await supabase
                    .from('calendar_events')
                    .update({
                        ...updates,
                        updated_at: new Date().toISOString(),
                    })
                    .eq('id', eventId)
                    .select()
                    .single();

                if (error) throw error;

                set({
                    events: get().events.map(e => e.id === eventId ? data : e),
                });

                // Sync to Microsoft if connected
                if (get().msAccessToken && data.external_id) {
                    await get().updateEventInMicrosoft(data);
                }

                return { success: true, event: data };
            } catch (error) {
                console.error('Failed to update event:', error);
                return { success: false, error: error.message };
            }
        },

        deleteEvent: async (eventId) => {
            try {
                const event = get().events.find(e => e.id === eventId);

                const { error } = await supabase
                    .from('calendar_events')
                    .delete()
                    .eq('id', eventId);

                if (error) throw error;

                set({
                    events: get().events.filter(e => e.id !== eventId),
                });

                // Delete from Microsoft if connected
                if (get().msAccessToken && event?.external_id) {
                    await get().deleteEventFromMicrosoft(event.external_id);
                }

                return { success: true };
            } catch (error) {
                console.error('Failed to delete event:', error);
                return { success: false, error: error.message };
            }
        },

        // ============================================================
        // MICROSOFT OAUTH & SYNC
        // ============================================================

        checkMicrosoftConnection: async () => {
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) return;

                // Load stored tokens from settings
                const { data } = await supabase
                    .from('settings')
                    .select('data')
                    .eq('user_id', user.id)
                    .eq('key', 'microsoft_calendar')
                    .single();

                if (data?.data?.accessToken) {
                    const tokenExpiry = new Date(data.data.tokenExpiry);

                    if (tokenExpiry > new Date()) {
                        set({
                            msAccessToken: data.data.accessToken,
                            msRefreshToken: data.data.refreshToken,
                            msTokenExpiry: data.data.tokenExpiry,
                            msCalendarId: data.data.calendarId,
                            syncStatus: 'connected',
                            lastSyncAt: data.data.lastSyncAt,
                        });
                    } else if (data.data.refreshToken) {
                        // Token expired, refresh it
                        await get().refreshMicrosoftToken(data.data.refreshToken);
                    }
                }
            } catch (error) {
                console.error('Failed to check Microsoft connection:', error);
            }
        },

        // Initiate Microsoft OAuth flow
        connectMicrosoft: async () => {
            const clientId = import.meta.env.VITE_MICROSOFT_CLIENT_ID;
            const redirectUri = `${window.location.origin}/auth/microsoft/callback`;
            const scopes = 'Calendars.ReadWrite offline_access User.Read';

            const authUrl = `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?` +
                `client_id=${clientId}` +
                `&response_type=code` +
                `&redirect_uri=${encodeURIComponent(redirectUri)}` +
                `&scope=${encodeURIComponent(scopes)}` +
                `&response_mode=query`;

            // Open in popup or redirect
            window.location.href = authUrl;
        },

        // Handle OAuth callback
        handleMicrosoftCallback: async (code) => {
            try {
                // Exchange code for tokens via edge function
                const response = await fetch(
                    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/microsoft-oauth`,
                    {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
                        },
                        body: JSON.stringify({
                            code,
                            redirectUri: `${window.location.origin}/auth/microsoft/callback`,
                        }),
                    }
                );

                if (!response.ok) {
                    throw new Error('Failed to exchange authorization code');
                }

                const tokens = await response.json();

                // Store tokens
                await get().storeMicrosoftTokens(tokens);

                // Trigger initial sync
                await get().syncFromMicrosoft();

                return { success: true };
            } catch (error) {
                console.error('Microsoft OAuth callback failed:', error);
                set({ error: error.message, syncStatus: 'error' });
                return { success: false, error: error.message };
            }
        },

        refreshMicrosoftToken: async (refreshToken) => {
            try {
                const response = await fetch(
                    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/microsoft-oauth`,
                    {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
                        },
                        body: JSON.stringify({
                            refreshToken,
                            grantType: 'refresh_token',
                        }),
                    }
                );

                if (!response.ok) {
                    throw new Error('Failed to refresh token');
                }

                const tokens = await response.json();
                await get().storeMicrosoftTokens(tokens);
            } catch (error) {
                console.error('Failed to refresh Microsoft token:', error);
                set({ syncStatus: 'error', error: 'Session expired. Please reconnect.' });
            }
        },

        storeMicrosoftTokens: async (tokens) => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const tokenData = {
                accessToken: tokens.access_token,
                refreshToken: tokens.refresh_token,
                tokenExpiry: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
                calendarId: tokens.calendarId || 'primary',
                lastSyncAt: new Date().toISOString(),
            };

            await supabase
                .from('settings')
                .upsert({
                    user_id: user.id,
                    key: 'microsoft_calendar',
                    data: tokenData,
                });

            set({
                msAccessToken: tokenData.accessToken,
                msRefreshToken: tokenData.refreshToken,
                msTokenExpiry: tokenData.tokenExpiry,
                msCalendarId: tokenData.calendarId,
                syncStatus: 'connected',
                lastSyncAt: tokenData.lastSyncAt,
            });
        },

        disconnectMicrosoft: async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            await supabase
                .from('settings')
                .delete()
                .eq('user_id', user.id)
                .eq('key', 'microsoft_calendar');

            set({
                msAccessToken: null,
                msRefreshToken: null,
                msTokenExpiry: null,
                msCalendarId: null,
                syncStatus: null,
            });
        },

        // Sync events from Microsoft Calendar
        syncFromMicrosoft: async () => {
            const { msAccessToken } = get();
            if (!msAccessToken) return;

            set({ isSyncing: true, syncStatus: 'syncing' });

            try {
                // Get events from the past 30 days to next 90 days
                const startDate = new Date();
                startDate.setDate(startDate.getDate() - 30);
                const endDate = new Date();
                endDate.setDate(endDate.getDate() + 90);

                const response = await fetch(
                    `${GRAPH_API_BASE}/me/calendar/events?` +
                    `$filter=start/dateTime ge '${startDate.toISOString()}' and start/dateTime le '${endDate.toISOString()}'` +
                    `&$orderby=start/dateTime` +
                    `&$top=100`,
                    {
                        headers: {
                            Authorization: `Bearer ${msAccessToken}`,
                        },
                    }
                );

                if (!response.ok) {
                    if (response.status === 401) {
                        await get().refreshMicrosoftToken(get().msRefreshToken);
                        return await get().syncFromMicrosoft();
                    }
                    throw new Error('Failed to fetch Microsoft events');
                }

                const data = await response.json();
                const msEvents = data.value || [];

                // Upsert events to our database
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) throw new Error('Not authenticated');

                for (const msEvent of msEvents) {
                    const eventData = {
                        user_id: user.id,
                        external_id: msEvent.id,
                        external_source: 'microsoft',
                        title: msEvent.subject,
                        description: msEvent.bodyPreview,
                        start_time: msEvent.start.dateTime + 'Z',
                        end_time: msEvent.end.dateTime + 'Z',
                        location: msEvent.location?.displayName,
                        all_day: msEvent.isAllDay,
                        status: msEvent.isCancelled ? 'cancelled' : 'confirmed',
                        attendees: msEvent.attendees?.map(a => ({
                            email: a.emailAddress.address,
                            name: a.emailAddress.name,
                            response: a.status?.response,
                        })) || [],
                        metadata: {
                            webLink: msEvent.webLink,
                            onlineMeetingUrl: msEvent.onlineMeeting?.joinUrl,
                        },
                    };

                    await supabase
                        .from('calendar_events')
                        .upsert(eventData, {
                            onConflict: 'external_id,external_source',
                        });
                }

                // Reload events
                await get().loadEvents();

                // Update last sync time
                const { data: { user: currentUser } } = await supabase.auth.getUser();
                if (currentUser) {
                    await supabase
                        .from('settings')
                        .update({
                            data: {
                                ...get().msAccessToken && { accessToken: get().msAccessToken },
                                ...get().msRefreshToken && { refreshToken: get().msRefreshToken },
                                ...get().msTokenExpiry && { tokenExpiry: get().msTokenExpiry },
                                calendarId: get().msCalendarId || 'primary',
                                lastSyncAt: new Date().toISOString(),
                            },
                        })
                        .eq('user_id', currentUser.id)
                        .eq('key', 'microsoft_calendar');
                }

                set({
                    isSyncing: false,
                    syncStatus: 'connected',
                    lastSyncAt: new Date().toISOString(),
                });

                return { success: true };
            } catch (error) {
                console.error('Failed to sync from Microsoft:', error);
                set({ isSyncing: false, syncStatus: 'error', error: error.message });
                return { success: false, error: error.message };
            }
        },

        // Sync a single event to Microsoft Calendar
        syncEventToMicrosoft: async (event) => {
            const { msAccessToken } = get();
            if (!msAccessToken) return;

            try {
                const msEvent = {
                    subject: event.title,
                    body: {
                        contentType: 'text',
                        content: event.description || '',
                    },
                    start: {
                        dateTime: event.start_time,
                        timeZone: 'UTC',
                    },
                    end: {
                        dateTime: event.end_time,
                        timeZone: 'UTC',
                    },
                    location: event.location ? { displayName: event.location } : undefined,
                    isAllDay: event.all_day,
                    attendees: event.attendees?.map(a => ({
                        emailAddress: {
                            address: a.email,
                            name: a.name,
                        },
                        type: 'required',
                    })),
                };

                const response = await fetch(`${GRAPH_API_BASE}/me/calendar/events`, {
                    method: 'POST',
                    headers: {
                        Authorization: `Bearer ${msAccessToken}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(msEvent),
                });

                if (!response.ok) {
                    throw new Error('Failed to create Microsoft event');
                }

                const created = await response.json();

                // Update our event with external ID
                await supabase
                    .from('calendar_events')
                    .update({
                        external_id: created.id,
                        external_source: 'microsoft',
                    })
                    .eq('id', event.id);

            } catch (error) {
                console.error('Failed to sync event to Microsoft:', error);
            }
        },

        updateEventInMicrosoft: async (event) => {
            const { msAccessToken } = get();
            if (!msAccessToken || !event.external_id) return;

            try {
                const msEvent = {
                    subject: event.title,
                    body: {
                        contentType: 'text',
                        content: event.description || '',
                    },
                    start: {
                        dateTime: event.start_time,
                        timeZone: 'UTC',
                    },
                    end: {
                        dateTime: event.end_time,
                        timeZone: 'UTC',
                    },
                    location: event.location ? { displayName: event.location } : undefined,
                    isAllDay: event.all_day,
                };

                await fetch(`${GRAPH_API_BASE}/me/calendar/events/${event.external_id}`, {
                    method: 'PATCH',
                    headers: {
                        Authorization: `Bearer ${msAccessToken}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(msEvent),
                });
            } catch (error) {
                console.error('Failed to update Microsoft event:', error);
            }
        },

        deleteEventFromMicrosoft: async (externalId) => {
            const { msAccessToken } = get();
            if (!msAccessToken) return;

            try {
                await fetch(`${GRAPH_API_BASE}/me/calendar/events/${externalId}`, {
                    method: 'DELETE',
                    headers: {
                        Authorization: `Bearer ${msAccessToken}`,
                    },
                });
            } catch (error) {
                console.error('Failed to delete Microsoft event:', error);
            }
        },

        // ============================================================
        // GOOGLE CALENDAR INTEGRATION
        // ============================================================

        checkGoogleConnection: async () => {
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) return;

                const { data } = await supabase
                    .from('settings')
                    .select('data')
                    .eq('user_id', user.id)
                    .eq('key', 'google_calendar')
                    .single();

                if (data?.data?.accessToken) {
                    const tokenExpiry = new Date(data.data.tokenExpiry);

                    if (tokenExpiry > new Date()) {
                        set({
                            googleAccessToken: data.data.accessToken,
                            googleRefreshToken: data.data.refreshToken,
                            googleTokenExpiry: data.data.tokenExpiry,
                            googleCalendarId: data.data.calendarId || 'primary',
                            googleSyncStatus: 'connected',
                        });
                    } else if (data.data.refreshToken) {
                        await get().refreshGoogleToken(data.data.refreshToken);
                    }
                }
            } catch (error) {
                console.error('Failed to check Google connection:', error);
            }
        },

        connectGoogle: async () => {
            const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
            const redirectUri = `${window.location.origin}/auth/google/callback`;
            const scopes = 'https://www.googleapis.com/auth/calendar';

            const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
                `client_id=${clientId}` +
                `&redirect_uri=${encodeURIComponent(redirectUri)}` +
                `&scope=${encodeURIComponent(scopes)}` +
                `&response_type=code` +
                `&access_type=offline` +
                `&prompt=consent`;

            window.location.href = authUrl;
        },

        handleGoogleCallback: async (code) => {
            try {
                const response = await fetch(
                    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/google-oauth`,
                    {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
                        },
                        body: JSON.stringify({
                            code,
                            redirectUri: `${window.location.origin}/auth/google/callback`,
                        }),
                    }
                );

                if (!response.ok) {
                    throw new Error('Failed to exchange authorization code');
                }

                const tokens = await response.json();
                await get().storeGoogleTokens(tokens);
                await get().syncFromGoogle();

                return { success: true };
            } catch (error) {
                console.error('Google OAuth callback failed:', error);
                set({ error: error.message, googleSyncStatus: 'error' });
                return { success: false, error: error.message };
            }
        },

        refreshGoogleToken: async (refreshToken) => {
            try {
                const response = await fetch(
                    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/google-oauth`,
                    {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
                        },
                        body: JSON.stringify({
                            refreshToken,
                            grantType: 'refresh_token',
                        }),
                    }
                );

                if (!response.ok) {
                    throw new Error('Failed to refresh Google token');
                }

                const tokens = await response.json();
                await get().storeGoogleTokens(tokens);
            } catch (error) {
                console.error('Failed to refresh Google token:', error);
                set({ googleSyncStatus: 'error', error: 'Session expired. Please reconnect.' });
            }
        },

        storeGoogleTokens: async (tokens) => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const tokenData = {
                accessToken: tokens.access_token,
                refreshToken: tokens.refresh_token,
                tokenExpiry: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
                calendarId: 'primary',
                lastSyncAt: new Date().toISOString(),
            };

            await supabase
                .from('settings')
                .upsert({
                    user_id: user.id,
                    key: 'google_calendar',
                    data: tokenData,
                });

            set({
                googleAccessToken: tokenData.accessToken,
                googleRefreshToken: tokenData.refreshToken,
                googleTokenExpiry: tokenData.tokenExpiry,
                googleCalendarId: tokenData.calendarId,
                googleSyncStatus: 'connected',
            });
        },

        disconnectGoogle: async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            await supabase
                .from('settings')
                .delete()
                .eq('user_id', user.id)
                .eq('key', 'google_calendar');

            set({
                googleAccessToken: null,
                googleRefreshToken: null,
                googleTokenExpiry: null,
                googleCalendarId: null,
                googleSyncStatus: null,
            });
        },

        syncFromGoogle: async () => {
            const { googleAccessToken, googleCalendarId } = get();
            if (!googleAccessToken) return;

            set({ isSyncing: true, googleSyncStatus: 'syncing' });

            try {
                const now = new Date();
                const startDate = new Date(now);
                startDate.setDate(startDate.getDate() - 30);
                const endDate = new Date(now);
                endDate.setDate(endDate.getDate() + 90);

                const response = await fetch(
                    `${GOOGLE_API_BASE}/calendars/${googleCalendarId}/events?` +
                    `timeMin=${startDate.toISOString()}` +
                    `&timeMax=${endDate.toISOString()}` +
                    `&maxResults=100` +
                    `&orderBy=startTime` +
                    `&singleEvents=true`,
                    {
                        headers: {
                            Authorization: `Bearer ${googleAccessToken}`,
                        },
                    }
                );

                if (!response.ok) {
                    if (response.status === 401) {
                        await get().refreshGoogleToken(get().googleRefreshToken);
                        return await get().syncFromGoogle();
                    }
                    throw new Error('Failed to fetch Google events');
                }

                const data = await response.json();
                const googleEvents = data.items || [];

                const { data: { user } } = await supabase.auth.getUser();
                if (!user) throw new Error('Not authenticated');

                for (const gEvent of googleEvents) {
                    const isAllDay = !!gEvent.start.date;
                    const eventData = {
                        user_id: user.id,
                        external_id: gEvent.id,
                        external_source: 'google',
                        title: gEvent.summary || '(No title)',
                        description: gEvent.description,
                        start_time: isAllDay
                            ? new Date(gEvent.start.date).toISOString()
                            : gEvent.start.dateTime,
                        end_time: isAllDay
                            ? new Date(gEvent.end.date).toISOString()
                            : gEvent.end.dateTime,
                        location: gEvent.location,
                        all_day: isAllDay,
                        status: gEvent.status === 'cancelled' ? 'cancelled' : 'confirmed',
                        attendees: gEvent.attendees?.map(a => ({
                            email: a.email,
                            name: a.displayName,
                            response: a.responseStatus,
                        })) || [],
                        metadata: {
                            webLink: gEvent.htmlLink,
                            onlineMeetingUrl: gEvent.hangoutLink,
                        },
                    };

                    await supabase
                        .from('calendar_events')
                        .upsert(eventData, {
                            onConflict: 'external_id,external_source',
                        });
                }

                await get().loadEvents();

                set({
                    isSyncing: false,
                    googleSyncStatus: 'connected',
                    lastSyncAt: new Date().toISOString(),
                });

                return { success: true };
            } catch (error) {
                console.error('Failed to sync from Google:', error);
                set({ isSyncing: false, googleSyncStatus: 'error', error: error.message });
                return { success: false, error: error.message };
            }
        },

        syncEventToGoogle: async (event) => {
            const { googleAccessToken, googleCalendarId } = get();
            if (!googleAccessToken) return;

            try {
                const gEvent = {
                    summary: event.title,
                    description: event.description || '',
                    start: event.all_day
                        ? { date: event.start_time.split('T')[0] }
                        : { dateTime: event.start_time, timeZone: 'UTC' },
                    end: event.all_day
                        ? { date: event.end_time.split('T')[0] }
                        : { dateTime: event.end_time, timeZone: 'UTC' },
                    location: event.location,
                    attendees: event.attendees?.map(a => ({
                        email: a.email,
                        displayName: a.name,
                    })),
                };

                const response = await fetch(
                    `${GOOGLE_API_BASE}/calendars/${googleCalendarId}/events`,
                    {
                        method: 'POST',
                        headers: {
                            Authorization: `Bearer ${googleAccessToken}`,
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify(gEvent),
                    }
                );

                if (!response.ok) {
                    throw new Error('Failed to create Google event');
                }

                const created = await response.json();

                await supabase
                    .from('calendar_events')
                    .update({
                        external_id: created.id,
                        external_source: 'google',
                    })
                    .eq('id', event.id);

            } catch (error) {
                console.error('Failed to sync event to Google:', error);
            }
        },

        updateEventInGoogle: async (event) => {
            const { googleAccessToken, googleCalendarId } = get();
            if (!googleAccessToken || !event.external_id) return;

            try {
                const gEvent = {
                    summary: event.title,
                    description: event.description || '',
                    start: event.all_day
                        ? { date: event.start_time.split('T')[0] }
                        : { dateTime: event.start_time, timeZone: 'UTC' },
                    end: event.all_day
                        ? { date: event.end_time.split('T')[0] }
                        : { dateTime: event.end_time, timeZone: 'UTC' },
                    location: event.location,
                };

                await fetch(
                    `${GOOGLE_API_BASE}/calendars/${googleCalendarId}/events/${event.external_id}`,
                    {
                        method: 'PUT',
                        headers: {
                            Authorization: `Bearer ${googleAccessToken}`,
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify(gEvent),
                    }
                );
            } catch (error) {
                console.error('Failed to update Google event:', error);
            }
        },

        deleteEventFromGoogle: async (externalId) => {
            const { googleAccessToken, googleCalendarId } = get();
            if (!googleAccessToken) return;

            try {
                await fetch(
                    `${GOOGLE_API_BASE}/calendars/${googleCalendarId}/events/${externalId}`,
                    {
                        method: 'DELETE',
                        headers: {
                            Authorization: `Bearer ${googleAccessToken}`,
                        },
                    }
                );
            } catch (error) {
                console.error('Failed to delete Google event:', error);
            }
        },

        // ============================================================
        // UI HELPERS
        // ============================================================

        setSelectedDate: (date) => {
            set({ selectedDate: date });
        },

        setViewMode: (mode) => {
            set({ viewMode: mode });
        },

        // Get events for a specific date
        getEventsForDate: (date) => {
            const { events } = get();
            const dateStr = date.toISOString().split('T')[0];

            return events.filter(event => {
                const eventDate = new Date(event.start_time).toISOString().split('T')[0];
                return eventDate === dateStr;
            });
        },

        // Get events for a date range
        getEventsForRange: (startDate, endDate) => {
            const { events } = get();
            const start = startDate.getTime();
            const end = endDate.getTime();

            return events.filter(event => {
                const eventTime = new Date(event.start_time).getTime();
                return eventTime >= start && eventTime <= end;
            });
        },

        // Get upcoming events
        getUpcomingEvents: (limit = 5) => {
            const { events } = get();
            const now = new Date();

            return events
                .filter(e => new Date(e.start_time) > now && e.status !== 'cancelled')
                .sort((a, b) => new Date(a.start_time) - new Date(b.start_time))
                .slice(0, limit);
        },

        // ============================================================
        // CLEANUP
        // ============================================================

        reset: () => {
            set({
                events: [],
                syncStatus: null,
                lastSyncAt: null,
                selectedDate: new Date(),
                viewMode: 'month',
                msAccessToken: null,
                msRefreshToken: null,
                msTokenExpiry: null,
                msCalendarId: null,
                isLoading: false,
                isSyncing: false,
                error: null,
            });
        },
    }))
);

// ============================================================
// HELPER FUNCTIONS
// ============================================================

export function formatEventTime(startTime, endTime, allDay) {
    const start = new Date(startTime);
    const end = new Date(endTime);

    if (allDay) {
        return 'All day';
    }

    const timeFormatter = new Intl.DateTimeFormat('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
    });

    return `${timeFormatter.format(start)} - ${timeFormatter.format(end)}`;
}

export function formatEventDate(date) {
    return new Intl.DateTimeFormat('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
    }).format(new Date(date));
}

export function getEventDuration(startTime, endTime) {
    const start = new Date(startTime);
    const end = new Date(endTime);
    const diffMs = end - start;
    const diffMins = Math.round(diffMs / 60000);

    if (diffMins < 60) return `${diffMins}m`;
    const hours = Math.floor(diffMins / 60);
    const mins = diffMins % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
}

export default useCalendarStore;
