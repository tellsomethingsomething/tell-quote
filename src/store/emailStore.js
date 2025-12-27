import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { supabase } from '../lib/supabase';

// Gmail API scopes needed for email access
const GOOGLE_SCOPES = [
    'https://www.googleapis.com/auth/gmail.readonly',
    'https://www.googleapis.com/auth/gmail.send',
    'https://www.googleapis.com/auth/gmail.compose',
    'https://www.googleapis.com/auth/gmail.modify',
    'https://www.googleapis.com/auth/userinfo.email',
    'https://www.googleapis.com/auth/userinfo.profile',
].join(' ');

// Microsoft Graph API scopes needed for email access
const MICROSOFT_SCOPES = [
    'openid',
    'profile',
    'email',
    'offline_access',
    'Mail.Read',
    'Mail.Send',
    'Mail.ReadWrite',
].join(' ');

// Email providers
export const EMAIL_PROVIDERS = {
    google: {
        id: 'google',
        name: 'Gmail',
        icon: 'https://www.google.com/favicon.ico',
        color: 'text-red-500',
        bgColor: 'bg-red-500/10',
    },
    microsoft: {
        id: 'microsoft',
        name: 'Outlook',
        icon: 'https://outlook.live.com/favicon.ico',
        color: 'text-blue-500',
        bgColor: 'bg-blue-500/10',
    },
};

// Email label colors
export const LABEL_COLORS = {
    INBOX: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    SENT: 'bg-green-500/10 text-green-400 border-green-500/20',
    DRAFT: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    STARRED: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
    IMPORTANT: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
    SPAM: 'bg-red-500/10 text-red-400 border-red-500/20',
    TRASH: 'bg-gray-500/10 text-gray-400 border-gray-500/20',
    UNREAD: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
};

// Thread status for display
export const THREAD_STATUS = {
    unread: { label: 'Unread', color: 'text-blue-400 bg-blue-500/10 border-blue-500/20' },
    read: { label: 'Read', color: 'text-gray-400 bg-gray-500/10 border-gray-500/20' },
    starred: { label: 'Starred', color: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20' },
    archived: { label: 'Archived', color: 'text-gray-500 bg-gray-600/10 border-gray-600/20' },
};

// Helper to format email date
export const formatEmailDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
        return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    } else if (diffDays === 1) {
        return 'Yesterday';
    } else if (diffDays < 7) {
        return date.toLocaleDateString('en-US', { weekday: 'short' });
    } else if (date.getFullYear() === now.getFullYear()) {
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } else {
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    }
};

// Helper to extract name from email
export const parseEmailAddress = (emailString) => {
    if (!emailString) return { email: '', name: '' };
    const match = emailString.match(/^(?:"?([^"]*)"?\s)?<?([^>]+)>?$/);
    if (match) {
        return {
            name: match[1] || match[2].split('@')[0],
            email: match[2],
        };
    }
    return { email: emailString, name: emailString.split('@')[0] };
};

export const useEmailStore = create(
    subscribeWithSelector((set, get) => ({
        // Connection state
        googleConnections: [],
        microsoftConnections: [],
        connections: [], // Combined list
        activeConnection: null,
        activeProvider: null, // 'google' or 'microsoft'
        isConnecting: false,
        connectionError: null,

        // Email data
        threads: [],
        selectedThread: null,
        messages: [], // Messages for selected thread
        drafts: [],

        // UI state
        isLoading: false,
        isSyncing: false,
        syncProgress: null,
        error: null,

        // Filters
        currentFolder: 'INBOX',
        searchQuery: '',
        filters: {
            unreadOnly: false,
            starredOnly: false,
            hasAttachments: false,
        },

        // Pagination
        page: 1,
        pageSize: 50,
        totalThreads: 0,
        hasMore: true,

        // Compose state
        isComposing: false,
        composeDraft: null,
        replyToMessage: null,

        // ============================================================
        // INITIALIZATION
        // ============================================================

        initialize: async () => {
            const { loadConnections, loadThreads } = get();
            await loadConnections();
            await loadThreads();
        },

        // ============================================================
        // GOOGLE CONNECTION MANAGEMENT
        // ============================================================

        loadConnections: async () => {
            try {
                // Load Google connections
                const { data: googleData, error: googleError } = await supabase
                    .from('google_connections')
                    .select('*')
                    .order('created_at', { ascending: false });

                if (googleError) console.error('Failed to load Google connections:', googleError);

                // Load Microsoft connections
                const { data: microsoftData, error: microsoftError } = await supabase
                    .from('microsoft_connections')
                    .select('*')
                    .order('created_at', { ascending: false });

                if (microsoftError) console.error('Failed to load Microsoft connections:', microsoftError);

                // Normalize connections with provider info
                const googleConnections = (googleData || []).map(c => ({
                    ...c,
                    provider: 'google',
                    email: c.google_email,
                    name: c.google_name,
                    picture: c.google_picture,
                }));

                const microsoftConnections = (microsoftData || []).map(c => ({
                    ...c,
                    provider: 'microsoft',
                    email: c.microsoft_email,
                    name: c.microsoft_name,
                    picture: c.microsoft_picture,
                }));

                // Combine and sort by created_at
                const allConnections = [...googleConnections, ...microsoftConnections]
                    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

                // Find first active connection
                const activeConn = allConnections.find(c => c.status === 'active');

                set({
                    googleConnections,
                    microsoftConnections,
                    connections: allConnections,
                    activeConnection: activeConn || null,
                    activeProvider: activeConn?.provider || null,
                });
            } catch (error) {
                console.error('Failed to load connections:', error);
                set({ connectionError: error.message });
            }
        },

        // Set active connection
        setActiveConnection: (connectionId) => {
            const { connections } = get();
            const connection = connections.find(c => c.id === connectionId);
            if (connection) {
                set({
                    activeConnection: connection,
                    activeProvider: connection.provider,
                });
                get().loadThreads();
            }
        },

        // Connect Google account using dedicated OAuth flow (doesn't replace session)
        connectGoogle: async () => {
            set({ isConnecting: true, connectionError: null });

            try {
                const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
                const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

                if (!GOOGLE_CLIENT_ID) {
                    throw new Error('Google Client ID not configured. Please add VITE_GOOGLE_CLIENT_ID to your environment.');
                }

                // Get current user for state verification
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) {
                    throw new Error('Please log in first');
                }

                // Build Google OAuth URL directly (bypasses Supabase auth replacement)
                const redirectUri = `${window.location.origin}/auth/google-callback`;
                const state = `${user.id}|${Date.now()}`; // Include user ID for verification

                // Store state in session for verification on callback
                sessionStorage.setItem('google_oauth_state', state);

                const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
                authUrl.searchParams.set('client_id', GOOGLE_CLIENT_ID);
                authUrl.searchParams.set('response_type', 'code');
                authUrl.searchParams.set('redirect_uri', redirectUri);
                authUrl.searchParams.set('scope', GOOGLE_SCOPES);
                authUrl.searchParams.set('access_type', 'offline');
                authUrl.searchParams.set('prompt', 'consent');
                authUrl.searchParams.set('state', state);

                // Redirect to Google login (doesn't log out current session)
                window.location.href = authUrl.toString();
            } catch (error) {
                console.error('Failed to initiate Google connection:', error);
                set({ isConnecting: false, connectionError: error.message });
            }
        },

        // Handle Google OAuth callback (called from callback page)
        handleGoogleCallback: async (code, state) => {
            set({ isConnecting: true, connectionError: null });

            try {
                // Verify state
                const savedState = sessionStorage.getItem('google_oauth_state');
                if (state !== savedState) {
                    throw new Error('Invalid OAuth state - please try again');
                }
                sessionStorage.removeItem('google_oauth_state');

                // Get current auth token
                const { data: { session } } = await supabase.auth.getSession();
                if (!session) {
                    throw new Error('Not authenticated');
                }

                // Exchange code for tokens via Edge Function
                const redirectUri = `${window.location.origin}/auth/google-callback`;
                const { data, error } = await supabase.functions.invoke('google-oauth-callback', {
                    body: { code, redirect_uri: redirectUri },
                });

                if (error) throw error;

                // Reload connections
                await get().loadConnections();
                set({ isConnecting: false });

                return { success: true, connection: data.connection };
            } catch (error) {
                console.error('Google OAuth callback failed:', error);
                set({ isConnecting: false, connectionError: error.message });
                return { success: false, error: error.message };
            }
        },

        // Disconnect Google account
        disconnectGoogle: async (connectionId) => {
            try {
                const { error } = await supabase
                    .from('google_connections')
                    .update({ status: 'disconnected' })
                    .eq('id', connectionId);

                if (error) throw error;

                await get().loadConnections();
                return { success: true };
            } catch (error) {
                console.error('Failed to disconnect Google:', error);
                return { success: false, error: error.message };
            }
        },

        // ============================================================
        // MICROSOFT CONNECTION MANAGEMENT
        // ============================================================

        // Connect Microsoft account
        connectMicrosoft: async () => {
            set({ isConnecting: true, connectionError: null });

            try {
                const MICROSOFT_CLIENT_ID = import.meta.env.VITE_MICROSOFT_CLIENT_ID;
                const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

                if (!MICROSOFT_CLIENT_ID) {
                    throw new Error('Microsoft Client ID not configured');
                }

                // Get current user ID for state parameter
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) {
                    throw new Error('Please log in first');
                }

                // Build Microsoft OAuth URL
                const redirectUri = `${SUPABASE_URL}/functions/v1/microsoft-oauth-callback`;
                const state = `${user.id}|${window.location.origin}`;

                const authUrl = new URL('https://login.microsoftonline.com/common/oauth2/v2.0/authorize');
                authUrl.searchParams.set('client_id', MICROSOFT_CLIENT_ID);
                authUrl.searchParams.set('response_type', 'code');
                authUrl.searchParams.set('redirect_uri', redirectUri);
                authUrl.searchParams.set('scope', MICROSOFT_SCOPES);
                authUrl.searchParams.set('state', state);
                authUrl.searchParams.set('prompt', 'consent');

                // Redirect to Microsoft login
                window.location.href = authUrl.toString();
            } catch (error) {
                console.error('Failed to initiate Microsoft connection:', error);
                set({ isConnecting: false, connectionError: error.message });
            }
        },

        // Disconnect Microsoft account
        disconnectMicrosoft: async (connectionId) => {
            try {
                const { error } = await supabase
                    .from('microsoft_connections')
                    .update({ status: 'disconnected' })
                    .eq('id', connectionId);

                if (error) throw error;

                await get().loadConnections();
                return { success: true };
            } catch (error) {
                console.error('Failed to disconnect Microsoft:', error);
                return { success: false, error: error.message };
            }
        },

        // Generic disconnect based on provider
        disconnectAccount: async (connectionId, provider) => {
            if (provider === 'google') {
                return get().disconnectGoogle(connectionId);
            } else if (provider === 'microsoft') {
                return get().disconnectMicrosoft(connectionId);
            }
            return { success: false, error: 'Unknown provider' };
        },

        // ============================================================
        // EMAIL THREAD MANAGEMENT
        // ============================================================

        loadThreads: async (options = {}) => {
            const { activeConnection, activeProvider, currentFolder, searchQuery, filters, page, pageSize } = get();

            if (!activeConnection) {
                set({ threads: [], totalThreads: 0 });
                return;
            }

            set({ isLoading: true, error: null });

            try {
                // Build query based on provider
                const connectionField = activeProvider === 'microsoft'
                    ? 'microsoft_connection_id'
                    : 'connection_id';

                let query = supabase
                    .from('email_threads')
                    .select('*', { count: 'exact' })
                    .eq(connectionField, activeConnection.id)
                    .eq('provider', activeProvider)
                    .order('last_message_at', { ascending: false });

                // Apply folder filter
                if (currentFolder === 'INBOX') {
                    query = query.eq('is_archived', false).eq('is_trash', false).eq('is_spam', false);
                } else if (currentFolder === 'SENT') {
                    query = query.contains('labels', ['SENT']);
                } else if (currentFolder === 'STARRED') {
                    query = query.eq('is_starred', true);
                } else if (currentFolder === 'ARCHIVED') {
                    query = query.eq('is_archived', true);
                } else if (currentFolder === 'TRASH') {
                    query = query.eq('is_trash', true);
                } else if (currentFolder === 'SPAM') {
                    query = query.eq('is_spam', true);
                }

                // Apply filters
                if (filters.unreadOnly) {
                    query = query.gt('unread_count', 0);
                }
                if (filters.starredOnly) {
                    query = query.eq('is_starred', true);
                }
                if (filters.hasAttachments) {
                    query = query.gt('attachment_count', 0);
                }

                // Apply search
                if (searchQuery) {
                    query = query.or(`subject.ilike.%${searchQuery}%,snippet.ilike.%${searchQuery}%`);
                }

                // Pagination
                const from = (page - 1) * pageSize;
                query = query.range(from, from + pageSize - 1);

                const { data, error, count } = await query;

                if (error) throw error;

                set({
                    threads: options.append ? [...get().threads, ...data] : data,
                    totalThreads: count || 0,
                    hasMore: data.length === pageSize,
                    isLoading: false,
                });
            } catch (error) {
                console.error('Failed to load threads:', error);
                set({ isLoading: false, error: error.message });
            }
        },

        selectThread: async (threadId) => {
            if (!threadId) {
                set({ selectedThread: null, messages: [] });
                return;
            }

            const thread = get().threads.find(t => t.id === threadId);
            set({ selectedThread: thread, isLoading: true });

            try {
                // Load messages for this thread
                const { data, error } = await supabase
                    .from('email_messages')
                    .select('*, email_attachments(*)')
                    .eq('thread_id', threadId)
                    .order('sent_at', { ascending: true });

                if (error) throw error;

                set({ messages: data || [], isLoading: false });

                // Mark as read if unread
                if (thread?.unread_count > 0) {
                    await get().markThreadAsRead(threadId);
                }
            } catch (error) {
                console.error('Failed to load messages:', error);
                set({ isLoading: false, error: error.message });
            }
        },

        // ============================================================
        // EMAIL ACTIONS
        // ============================================================

        markThreadAsRead: async (threadId) => {
            try {
                // Update thread
                await supabase
                    .from('email_threads')
                    .update({ unread_count: 0 })
                    .eq('id', threadId);

                // Update all messages in thread
                await supabase
                    .from('email_messages')
                    .update({ is_read: true })
                    .eq('thread_id', threadId);

                // Update local state
                set({
                    threads: get().threads.map(t =>
                        t.id === threadId ? { ...t, unread_count: 0 } : t
                    ),
                });

                // Sync with Gmail
                const thread = get().threads.find(t => t.id === threadId);
                if (thread?.google_thread_id) {
                    await supabase.functions.invoke('gmail-mark-read', {
                        body: { threadId: thread.google_thread_id },
                    });
                }
            } catch (error) {
                console.error('Failed to mark as read:', error);
            }
        },

        starThread: async (threadId, starred) => {
            try {
                await supabase
                    .from('email_threads')
                    .update({ is_starred: starred })
                    .eq('id', threadId);

                set({
                    threads: get().threads.map(t =>
                        t.id === threadId ? { ...t, is_starred: starred } : t
                    ),
                    selectedThread: get().selectedThread?.id === threadId
                        ? { ...get().selectedThread, is_starred: starred }
                        : get().selectedThread,
                });

                // Sync with Gmail
                const thread = get().threads.find(t => t.id === threadId);
                if (thread?.google_thread_id) {
                    await supabase.functions.invoke('gmail-star', {
                        body: { threadId: thread.google_thread_id, starred },
                    });
                }
            } catch (error) {
                console.error('Failed to star thread:', error);
            }
        },

        archiveThread: async (threadId) => {
            try {
                await supabase
                    .from('email_threads')
                    .update({ is_archived: true })
                    .eq('id', threadId);

                set({
                    threads: get().threads.filter(t => t.id !== threadId),
                    selectedThread: get().selectedThread?.id === threadId ? null : get().selectedThread,
                });

                // Sync with Gmail
                const thread = get().threads.find(t => t.id === threadId);
                if (thread?.google_thread_id) {
                    await supabase.functions.invoke('gmail-archive', {
                        body: { threadId: thread.google_thread_id },
                    });
                }
            } catch (error) {
                console.error('Failed to archive thread:', error);
            }
        },

        trashThread: async (threadId) => {
            try {
                await supabase
                    .from('email_threads')
                    .update({ is_trash: true })
                    .eq('id', threadId);

                set({
                    threads: get().threads.filter(t => t.id !== threadId),
                    selectedThread: get().selectedThread?.id === threadId ? null : get().selectedThread,
                });

                // Sync with Gmail
                const thread = get().threads.find(t => t.id === threadId);
                if (thread?.google_thread_id) {
                    await supabase.functions.invoke('gmail-trash', {
                        body: { threadId: thread.google_thread_id },
                    });
                }
            } catch (error) {
                console.error('Failed to trash thread:', error);
            }
        },

        // ============================================================
        // SYNC OPERATIONS
        // ============================================================

        syncEmails: async () => {
            const { activeConnection, activeProvider } = get();
            if (!activeConnection) return;

            set({ isSyncing: true, syncProgress: { status: 'starting', progress: 0 } });

            try {
                // Choose sync function based on provider
                const syncFunction = activeProvider === 'microsoft' ? 'microsoft-sync' : 'gmail-sync';
                const tableName = activeProvider === 'microsoft' ? 'microsoft_connections' : 'google_connections';

                const { data, error } = await supabase.functions.invoke(syncFunction, {
                    body: { connectionId: activeConnection.id },
                });

                if (error) throw error;

                set({ syncProgress: { status: 'completed', ...data } });

                // Reload threads
                await get().loadThreads();

                // Update last sync time
                await supabase
                    .from(tableName)
                    .update({ last_sync_at: new Date().toISOString() })
                    .eq('id', activeConnection.id);

                await get().loadConnections();
            } catch (error) {
                console.error('Sync failed:', error);
                set({ syncProgress: { status: 'failed', error: error.message } });
            } finally {
                set({ isSyncing: false });
            }
        },

        // ============================================================
        // COMPOSE & SEND
        // ============================================================

        openCompose: (options = {}) => {
            set({
                isComposing: true,
                composeDraft: {
                    to: options.to || [],
                    cc: [],
                    bcc: [],
                    subject: options.subject || '',
                    body: options.body || '',
                    attachments: [],
                    clientId: options.clientId || null,
                    contactId: options.contactId || null,
                    projectId: options.projectId || null,
                    quoteId: options.quoteId || null,
                },
                replyToMessage: options.replyTo || null,
            });
        },

        closeCompose: () => {
            set({
                isComposing: false,
                composeDraft: null,
                replyToMessage: null,
            });
        },

        updateDraft: (updates) => {
            set({
                composeDraft: { ...get().composeDraft, ...updates },
            });
        },

        sendEmail: async () => {
            const { composeDraft, replyToMessage, activeConnection, activeProvider, selectedThread } = get();

            if (!activeConnection) {
                return { success: false, error: 'No email account connected' };
            }

            try {
                // Choose send function based on provider
                const sendFunction = activeProvider === 'microsoft' ? 'microsoft-send' : 'gmail-send';

                // Build email data based on provider
                const emailData = {
                    connectionId: activeConnection.id,
                    to: composeDraft.to,
                    cc: composeDraft.cc,
                    bcc: composeDraft.bcc,
                    subject: composeDraft.subject,
                    body: composeDraft.body,
                    isHtml: composeDraft.isHtml || false,
                };

                // Add provider-specific fields
                if (activeProvider === 'microsoft') {
                    emailData.conversationId = selectedThread?.provider_thread_id;
                    emailData.replyToMessageId = replyToMessage?.provider_message_id;
                } else {
                    emailData.threadId = selectedThread?.google_thread_id || selectedThread?.provider_thread_id;
                    emailData.replyToMessageId = replyToMessage?.google_message_id || replyToMessage?.provider_message_id;
                }

                const { data, error } = await supabase.functions.invoke(sendFunction, {
                    body: emailData,
                });

                if (error) throw error;

                // Close compose and refresh
                get().closeCompose();
                await get().syncEmails();

                return { success: true, messageId: data.messageId };
            } catch (error) {
                console.error('Failed to send email:', error);
                return { success: false, error: error.message };
            }
        },

        // ============================================================
        // ENTITY LINKING
        // ============================================================

        linkThreadToEntity: async (threadId, entityType, entityId) => {
            try {
                const { error } = await supabase.from('email_entity_links').insert({
                    thread_id: threadId,
                    entity_type: entityType,
                    entity_id: entityId,
                    link_type: 'manual',
                });

                if (error) throw error;

                // Also update thread's direct link
                const updateField = `${entityType}_id`;
                await supabase
                    .from('email_threads')
                    .update({ [updateField]: entityId })
                    .eq('id', threadId);

                await get().loadThreads();
                return { success: true };
            } catch (error) {
                console.error('Failed to link thread:', error);
                return { success: false, error: error.message };
            }
        },

        unlinkThreadFromEntity: async (threadId, entityType, entityId) => {
            try {
                await supabase
                    .from('email_entity_links')
                    .delete()
                    .eq('thread_id', threadId)
                    .eq('entity_type', entityType)
                    .eq('entity_id', entityId);

                // Also clear thread's direct link
                const updateField = `${entityType}_id`;
                await supabase
                    .from('email_threads')
                    .update({ [updateField]: null })
                    .eq('id', threadId);

                await get().loadThreads();
                return { success: true };
            } catch (error) {
                console.error('Failed to unlink thread:', error);
                return { success: false, error: error.message };
            }
        },

        getThreadsForEntity: async (entityType, entityId) => {
            try {
                const { data, error } = await supabase
                    .from('email_entity_links')
                    .select('thread_id, email_threads(*)')
                    .eq('entity_type', entityType)
                    .eq('entity_id', entityId);

                if (error) throw error;

                return data.map(link => link.email_threads).filter(Boolean);
            } catch (error) {
                console.error('Failed to get entity threads:', error);
                return [];
            }
        },

        // ============================================================
        // FOLDER & FILTER MANAGEMENT
        // ============================================================

        setFolder: (folder) => {
            set({ currentFolder: folder, page: 1 });
            get().loadThreads();
        },

        setSearchQuery: (query) => {
            set({ searchQuery: query, page: 1 });
            get().loadThreads();
        },

        setFilters: (filters) => {
            set({ filters: { ...get().filters, ...filters }, page: 1 });
            get().loadThreads();
        },

        loadMore: () => {
            const { page, hasMore, isLoading } = get();
            if (!hasMore || isLoading) return;

            set({ page: page + 1 });
            get().loadThreads({ append: true });
        },

        // ============================================================
        // EMAIL TRACKING
        // ============================================================

        // Get tracking stats for a message
        getEmailTrackingStats: async (messageId) => {
            try {
                const { data, error } = await supabase
                    .from('email_messages')
                    .select('tracking_id, open_count, click_count, first_opened_at, last_opened_at')
                    .eq('id', messageId)
                    .single();

                if (error) throw error;

                return data;
            } catch (error) {
                console.error('Failed to get tracking stats:', error);
                return null;
            }
        },

        // Get tracking events for a message
        getTrackingEvents: async (messageId) => {
            try {
                const { data, error } = await supabase
                    .from('email_tracking_events')
                    .select('*')
                    .eq('message_id', messageId)
                    .order('occurred_at', { ascending: false });

                if (error) throw error;

                return data || [];
            } catch (error) {
                console.error('Failed to get tracking events:', error);
                return [];
            }
        },

        // Get tracking summary for a thread
        getThreadTrackingStats: async (threadId) => {
            try {
                const { data, error } = await supabase
                    .from('email_messages')
                    .select('id, tracking_id, open_count, click_count, first_opened_at, subject')
                    .eq('thread_id', threadId)
                    .gt('open_count', 0);

                if (error) throw error;

                const totalOpens = (data || []).reduce((sum, m) => sum + (m.open_count || 0), 0);
                const totalClicks = (data || []).reduce((sum, m) => sum + (m.click_count || 0), 0);
                const trackedMessages = data?.length || 0;

                return {
                    totalOpens,
                    totalClicks,
                    trackedMessages,
                    messages: data || [],
                };
            } catch (error) {
                console.error('Failed to get thread tracking stats:', error);
                return { totalOpens: 0, totalClicks: 0, trackedMessages: 0, messages: [] };
            }
        },

        // Subscribe to real-time tracking events
        subscribeToTrackingEvents: (messageId, callback) => {
            const channel = supabase
                .channel(`tracking-${messageId}`)
                .on(
                    'postgres_changes',
                    {
                        event: 'INSERT',
                        schema: 'public',
                        table: 'email_tracking_events',
                        filter: `message_id=eq.${messageId}`,
                    },
                    (payload) => {
                        callback(payload.new);
                    }
                )
                .subscribe();

            return () => {
                supabase.removeChannel(channel);
            };
        },

        // Generate tracking URL for a link
        generateTrackingUrl: (originalUrl, trackingId) => {
            const baseUrl = import.meta.env.VITE_SUPABASE_URL;
            const encodedUrl = encodeURIComponent(originalUrl);
            return `${baseUrl}/functions/v1/email-tracking-click?tid=${trackingId}&url=${encodedUrl}`;
        },

        // Generate tracking pixel HTML
        generateTrackingPixel: (trackingId) => {
            const baseUrl = import.meta.env.VITE_SUPABASE_URL;
            return `<img src="${baseUrl}/functions/v1/email-tracking-pixel?tid=${trackingId}" width="1" height="1" style="display:none;" alt="" />`;
        },

        // ============================================================
        // CLEANUP
        // ============================================================

        reset: () => {
            set({
                connections: [],
                activeConnection: null,
                threads: [],
                selectedThread: null,
                messages: [],
                drafts: [],
                isLoading: false,
                isSyncing: false,
                error: null,
                currentFolder: 'INBOX',
                searchQuery: '',
                filters: { unreadOnly: false, starredOnly: false, hasAttachments: false },
                page: 1,
                isComposing: false,
                composeDraft: null,
            });
        },
    }))
);

export default useEmailStore;
