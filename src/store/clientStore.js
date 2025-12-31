import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { useActivityStore } from './activityStore';
import { trackConversion, Events } from '../services/analyticsService';
import { generateId } from '../utils/generateId';
import logger from '../utils/logger';

const CLIENTS_STORAGE_KEY = 'tell_clients';
const SAVED_QUOTES_KEY = 'tell_saved_quotes';
const SYNC_QUEUE_KEY = 'tell_clients_sync_queue';

// Load from localStorage (fallback/cache)
function loadClientsLocal() {
    try {
        const saved = localStorage.getItem(CLIENTS_STORAGE_KEY);
        return saved ? JSON.parse(saved) : [];
    } catch (e) {
        return [];
    }
}

function loadSavedQuotesLocal() {
    try {
        const saved = localStorage.getItem(SAVED_QUOTES_KEY);
        return saved ? JSON.parse(saved) : [];
    } catch (e) {
        return [];
    }
}

function saveClientsLocal(clients) {
    try {
        localStorage.setItem(CLIENTS_STORAGE_KEY, JSON.stringify(clients));
    } catch (e) {
        logger.error('Failed to save clients locally', e);
    }
}

function saveSavedQuotesLocal(quotes) {
    try {
        localStorage.setItem(SAVED_QUOTES_KEY, JSON.stringify(quotes));
    } catch (e) {
        logger.error('Failed to save quotes locally', e);
    }
}

// Sync queue for failed operations
function loadSyncQueue() {
    try {
        const saved = localStorage.getItem(SYNC_QUEUE_KEY);
        return saved ? JSON.parse(saved) : [];
    } catch (e) {
        return [];
    }
}

function saveSyncQueue(queue) {
    try {
        localStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(queue));
    } catch (e) {
        logger.error('Failed to save sync queue', e);
    }
}

// Using secure generateId from utils/generateId.js

// Migrate legacy contact fields to contacts[] array
// Includes error handling to prevent data corruption on migration failure
function migrateLegacyContacts(clients) {
    if (!clients || !Array.isArray(clients)) {
        logger.warn('migrateLegacyContacts: Invalid clients array');
        return { clients: clients || [], migratedCount: 0 };
    }

    let migratedCount = 0;
    const migratedClients = clients.map(client => {
        try {
            // Skip if already has contacts
            if (client.contacts && client.contacts.length > 0) {
                return client;
            }

            // Check for legacy contact data
            const hasLegacyContact = client.contact || client.email || client.phone;
            if (!hasLegacyContact) {
                return client;
            }

            // Create new contact from legacy fields
            const newContact = {
                id: generateId(),
                name: client.contact || 'Primary Contact',
                email: client.email || '',
                phone: client.phone || '',
                role: '',
                isPrimary: true,
                createdAt: new Date().toISOString(),
            };

            migratedCount++;
            return {
                ...client,
                contacts: [newContact],
                _contactsMigrated: true, // Flag to track migration
            };
        } catch (e) {
            // If migration fails for this client, return unmigrated to preserve data
            logger.error(`Failed to migrate client ${client.id || 'unknown'}:`, e);
            return client;
        }
    });

    if (migratedCount > 0) {
        logger.info(`Migrated ${migratedCount} client(s) from legacy contact format`);
    }

    return { clients: migratedClients, migratedCount };
}

export const useClientStore = create(
    subscribeWithSelector((set, get) => ({
        clients: loadClientsLocal(),
        savedQuotes: loadSavedQuotesLocal(),
        loading: false,
        syncStatus: 'idle', // 'idle' | 'syncing' | 'error' | 'success'
        syncError: null,
        pendingSyncCount: loadSyncQueue().length,

        // Initialize - load from Supabase (or localStorage fallback)
        initialize: async () => {
            if (!isSupabaseConfigured()) {
                set({ loading: false, syncStatus: 'idle' });
                return;
            }

            set({ loading: true, syncStatus: 'syncing' });
            try {
                // Load clients
                const { data: clientsData, error: clientsError } = await supabase
                    .from('clients')
                    .select('*')
                    .order('created_at', { ascending: false });

                if (clientsError) throw clientsError;

                // Load quotes
                const { data: quotesData, error: quotesError } = await supabase
                    .from('quotes')
                    .select('*')
                    .order('created_at', { ascending: false });

                if (quotesError) throw quotesError;

                // Map DB format to app format
                const dbClients = (clientsData || []).map(c => ({
                    id: c.id,
                    company: c.company,
                    contact: c.contact,
                    email: c.email,
                    phone: c.phone,
                    website: c.website,
                    location: c.location,
                    address: c.address,
                    region: c.region,
                    notes: c.notes,
                    tags: c.tags || [],
                    contacts: c.contacts || [],
                    paymentTerms: c.payment_terms,
                    preferredCurrency: c.preferred_currency,
                    industry: c.industry,
                    createdAt: c.created_at,
                    updatedAt: c.updated_at,
                    _synced: true,
                }));

                // Run legacy contact migration
                const { clients: migratedClients, migratedCount } = migrateLegacyContacts(dbClients);

                // If any clients were migrated, update them in Supabase
                if (migratedCount > 0) {
                    for (const client of migratedClients.filter(c => c._contactsMigrated)) {
                        try {
                            await supabase
                                .from('clients')
                                .update({ contacts: client.contacts })
                                .eq('id', client.id);
                            // Remove migration flag after successful sync
                            delete client._contactsMigrated;
                        } catch (e) {
                            logger.error('Failed to sync migrated contacts for client', e, { clientId: client.id });
                        }
                    }
                }

                const dbQuotes = (quotesData || []).map(q => {
                    // Match client by ID first, then fallback to company name
                    let matchedClient = null;
                    if (q.client?.clientId) {
                        matchedClient = migratedClients.find(c => c.id === q.client.clientId);
                    }
                    if (!matchedClient && q.client?.company) {
                        const clientCompany = q.client.company.toLowerCase();
                        matchedClient = migratedClients.find(c => c.company?.toLowerCase() === clientCompany);
                    }

                    return {
                        id: q.id,
                        quoteNumber: q.quote_number,
                        quoteDate: q.quote_date,
                        validityDays: q.validity_days,
                        status: q.status,
                        currency: q.currency,
                        region: q.region,
                        preparedBy: q.prepared_by,
                        client: q.client || {},
                        clientId: matchedClient?.id || q.client?.clientId || null,
                        project: q.project || {},
                        sections: q.sections || {},
                        fees: q.fees || {},
                        proposal: q.proposal || {},
                        createdAt: q.created_at,
                        updatedAt: q.updated_at,
                        _synced: true,
                    };
                });

                // Check for unsynced local data and sync it
                const localClients = loadClientsLocal();
                const localQuotes = loadSavedQuotesLocal();

                const unsyncedClients = localClients.filter(local =>
                    !local._synced && !migratedClients.find(db => db.id === local.id)
                );
                const unsyncedQuotes = localQuotes.filter(local =>
                    !local._synced && !dbQuotes.find(db => db.id === local.id || db.quoteNumber === local.quoteNumber)
                );

                // Sync unsynced clients
                for (const client of unsyncedClients) {
                    try {
                        const { data, error } = await supabase
                            .from('clients')
                            .insert({
                                company: client.company,
                                contact: client.contact,
                                email: client.email,
                                phone: client.phone,
                                website: client.website,
                                location: client.location,
                                address: client.address,
                                region: client.region,
                                notes: client.notes,
                                tags: client.tags,
                                contacts: client.contacts,
                                payment_terms: client.paymentTerms,
                                preferred_currency: client.preferredCurrency,
                                industry: client.industry,
                            })
                            .select()
                            .single();

                        if (!error && data) {
                            migratedClients.push({ ...client, id: data.id, _synced: true });
                        }
                    } catch (e) {
                        logger.error('Failed to sync local client', e);
                    }
                }

                // Sync unsynced quotes
                for (const quote of unsyncedQuotes) {
                    try {
                        const { data, error } = await supabase
                            .from('quotes')
                            .insert({
                                quote_number: quote.quoteNumber,
                                quote_date: quote.quoteDate,
                                validity_days: quote.validityDays,
                                status: quote.status,
                                currency: quote.currency,
                                region: quote.region,
                                prepared_by: quote.preparedBy,
                                client: quote.client,
                                project: quote.project,
                                sections: quote.sections,
                                fees: quote.fees,
                                proposal: quote.proposal,
                            })
                            .select()
                            .single();

                        if (!error && data) {
                            dbQuotes.push({ ...quote, id: data.id, _synced: true });
                        }
                    } catch (e) {
                        logger.error('Failed to sync local quote', e);
                    }
                }

                saveClientsLocal(migratedClients);
                saveSavedQuotesLocal(dbQuotes);
                set({
                    clients: migratedClients,
                    savedQuotes: dbQuotes,
                    loading: false,
                    syncStatus: 'success',
                    syncError: null
                });

                // Process retry queue
                await get().processSyncQueue();

            } catch (e) {
                logger.error('Failed to load from DB', e);
                set({ loading: false, syncStatus: 'error', syncError: e.message });
            }
        },

        // Process pending sync operations
        processSyncQueue: async () => {
            if (!isSupabaseConfigured()) return;

            const queue = loadSyncQueue();
            if (queue.length === 0) return;

            const newQueue = [];
            for (const item of queue) {
                try {
                    if (item.table === 'clients') {
                        if (item.action === 'insert') {
                            await supabase.from('clients').insert(item.data);
                        } else if (item.action === 'update') {
                            await supabase.from('clients').update(item.data).eq('id', item.id);
                        } else if (item.action === 'delete') {
                            await supabase.from('clients').delete().eq('id', item.id);
                        }
                    } else if (item.table === 'quotes') {
                        if (item.action === 'insert') {
                            await supabase.from('quotes').insert(item.data);
                        } else if (item.action === 'update') {
                            await supabase.from('quotes').update(item.data).eq('id', item.id);
                        } else if (item.action === 'delete') {
                            await supabase.from('quotes').delete().eq('id', item.id);
                        }
                    }
                } catch (e) {
                    logger.error('Sync queue item failed', e);
                    newQueue.push({ ...item, retries: (item.retries || 0) + 1, lastError: e.message });
                }
            }

            saveSyncQueue(newQueue);
            set({ pendingSyncCount: newQueue.length });
        },

        // Add to sync queue for retry
        addToSyncQueue: (table, action, id, data) => {
            const queue = loadSyncQueue();
            queue.push({ table, action, id, data, timestamp: Date.now() });
            saveSyncQueue(queue);
            set(state => ({ pendingSyncCount: state.pendingSyncCount + 1 }));
        },

        // Get unsynced counts
        getUnsyncedCount: () => {
            const clients = get().clients.filter(c => !c._synced).length;
            const quotes = get().savedQuotes.filter(q => !q._synced).length;
            return clients + quotes;
        },

        // Manual sync all
        syncAllToSupabase: async () => {
            if (!isSupabaseConfigured()) {
                return { success: false, error: 'Supabase not configured' };
            }

            set({ syncStatus: 'syncing' });
            let synced = 0;
            let errors = 0;

            // Sync clients
            for (const client of get().clients) {
                if (client._synced) continue;
                try {
                    const dbData = {
                        company: client.company,
                        contact: client.contact,
                        email: client.email,
                        phone: client.phone,
                        website: client.website,
                        location: client.location,
                        address: client.address,
                        region: client.region,
                        notes: client.notes,
                        tags: client.tags,
                        contacts: client.contacts,
                        payment_terms: client.paymentTerms,
                        preferred_currency: client.preferredCurrency,
                        industry: client.industry,
                    };

                    const { data: existing } = await supabase
                        .from('clients')
                        .select('id')
                        .eq('id', client.id)
                        .single();

                    if (existing) {
                        await supabase.from('clients').update(dbData).eq('id', client.id);
                    } else {
                        const { data } = await supabase.from('clients').insert(dbData).select().single();
                        if (data) {
                            set(state => ({
                                clients: state.clients.map(c =>
                                    c.id === client.id ? { ...c, id: data.id, _synced: true } : c
                                )
                            }));
                        }
                    }
                    synced++;
                } catch (e) {
                    logger.error('Failed to sync client', e);
                    errors++;
                }
            }

            // Sync quotes
            for (const quote of get().savedQuotes) {
                if (quote._synced) continue;
                try {
                    const dbData = {
                        quote_number: quote.quoteNumber,
                        quote_date: quote.quoteDate,
                        validity_days: quote.validityDays,
                        status: quote.status,
                        currency: quote.currency,
                        region: quote.region,
                        prepared_by: quote.preparedBy,
                        client: quote.client,
                        project: quote.project,
                        sections: quote.sections,
                        fees: quote.fees,
                        proposal: quote.proposal,
                    };

                    const { data: existing } = await supabase
                        .from('quotes')
                        .select('id')
                        .eq('quote_number', quote.quoteNumber)
                        .single();

                    if (existing) {
                        await supabase.from('quotes').update(dbData).eq('id', existing.id);
                    } else {
                        const { data } = await supabase.from('quotes').insert(dbData).select().single();
                        if (data) {
                            set(state => ({
                                savedQuotes: state.savedQuotes.map(q =>
                                    q.id === quote.id ? { ...q, id: data.id, _synced: true } : q
                                )
                            }));
                        }
                    }
                    synced++;
                } catch (e) {
                    logger.error('Failed to sync quote', e);
                    errors++;
                }
            }

            // Mark all as synced
            set(state => ({
                clients: state.clients.map(c => ({ ...c, _synced: true })),
                savedQuotes: state.savedQuotes.map(q => ({ ...q, _synced: true })),
                syncStatus: errors > 0 ? 'error' : 'success',
                syncError: errors > 0 ? `${errors} items failed to sync` : null
            }));

            saveClientsLocal(get().clients);
            saveSavedQuotesLocal(get().savedQuotes);

            return { success: errors === 0, synced, errors };
        },

        clearSyncError: () => {
            set({ syncError: null, syncStatus: 'idle' });
        },

        // =====================
        // CLIENT OPERATIONS
        // =====================

        addClient: async (clientData) => {
            const newClient = {
                id: generateId(),
                company: clientData.company || '',
                contact: clientData.contact || '',
                email: clientData.email || '',
                phone: clientData.phone || '',
                website: clientData.website || '',
                location: clientData.location || '',
                address: clientData.address || '',
                region: clientData.region || 'MALAYSIA',
                notes: clientData.notes || '',
                contacts: clientData.contacts || [],
                tags: clientData.tags || [],
                paymentTerms: clientData.paymentTerms || 'net30',
                preferredCurrency: clientData.preferredCurrency || 'USD',
                industry: clientData.industry || '',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                _synced: false,
            };

            // If legacy contact info, create primary contact
            if (!newClient.contacts.length && (newClient.contact || newClient.email)) {
                newClient.contacts.push({
                    id: generateId(),
                    name: newClient.contact,
                    email: newClient.email,
                    phone: newClient.phone,
                    role: 'Primary',
                    isPrimary: true,
                });
            }

            // Save locally first
            set(state => {
                const clients = [...state.clients, newClient];
                saveClientsLocal(clients);
                return { clients };
            });

            // Save to Supabase
            if (isSupabaseConfigured()) {
                try {
                    const { data, error } = await supabase
                        .from('clients')
                        .insert({
                            company: newClient.company,
                            contact: newClient.contact,
                            email: newClient.email,
                            phone: newClient.phone,
                            website: newClient.website,
                            location: newClient.location,
                            address: newClient.address,
                            region: newClient.region,
                            notes: newClient.notes,
                            tags: newClient.tags,
                            contacts: newClient.contacts,
                            payment_terms: newClient.paymentTerms,
                            preferred_currency: newClient.preferredCurrency,
                            industry: newClient.industry,
                        })
                        .select()
                        .single();

                    if (error) throw error;

                    // Update with server ID
                    set(state => {
                        const clients = state.clients.map(c =>
                            c.id === newClient.id ? { ...c, id: data.id, _synced: true } : c
                        );
                        saveClientsLocal(clients);
                        return { clients, syncStatus: 'success', syncError: null };
                    });
                    newClient.id = data.id;
                } catch (e) {
                    logger.error('Failed to save client to DB', e);
                    get().addToSyncQueue('clients', 'insert', newClient.id, {
                        company: newClient.company,
                        contact: newClient.contact,
                        email: newClient.email,
                        phone: newClient.phone,
                        website: newClient.website,
                        location: newClient.location,
                        address: newClient.address,
                        region: newClient.region,
                        notes: newClient.notes,
                        tags: newClient.tags,
                        contacts: newClient.contacts,
                    });
                    set({ syncStatus: 'error', syncError: `Failed to sync client: ${e.message}` });
                }
            }

            return newClient;
        },

        updateClient: async (clientId, updates) => {
            // Update locally first
            set(state => {
                const clients = state.clients.map(client =>
                    client.id === clientId
                        ? { ...client, ...updates, updatedAt: new Date().toISOString(), _synced: false }
                        : client
                );
                saveClientsLocal(clients);
                return { clients };
            });

            // Save to Supabase
            if (isSupabaseConfigured()) {
                try {
                    const dbUpdates = {};
                    if (updates.company !== undefined) dbUpdates.company = updates.company;
                    if (updates.contact !== undefined) dbUpdates.contact = updates.contact;
                    if (updates.email !== undefined) dbUpdates.email = updates.email;
                    if (updates.phone !== undefined) dbUpdates.phone = updates.phone;
                    if (updates.website !== undefined) dbUpdates.website = updates.website;
                    if (updates.location !== undefined) dbUpdates.location = updates.location;
                    if (updates.address !== undefined) dbUpdates.address = updates.address;
                    if (updates.region !== undefined) dbUpdates.region = updates.region;
                    if (updates.notes !== undefined) dbUpdates.notes = updates.notes;
                    if (updates.tags !== undefined) dbUpdates.tags = updates.tags;
                    if (updates.contacts !== undefined) dbUpdates.contacts = updates.contacts;
                    if (updates.paymentTerms !== undefined) dbUpdates.payment_terms = updates.paymentTerms;
                    if (updates.preferredCurrency !== undefined) dbUpdates.preferred_currency = updates.preferredCurrency;
                    if (updates.industry !== undefined) dbUpdates.industry = updates.industry;

                    const { error } = await supabase
                        .from('clients')
                        .update(dbUpdates)
                        .eq('id', clientId);

                    if (error) throw error;

                    // Mark as synced
                    set(state => {
                        const clients = state.clients.map(c =>
                            c.id === clientId ? { ...c, _synced: true } : c
                        );
                        saveClientsLocal(clients);
                        return { clients, syncStatus: 'success', syncError: null };
                    });
                } catch (e) {
                    logger.error('Failed to update client in DB', e);
                    get().addToSyncQueue('clients', 'update', clientId, updates);
                    set({ syncStatus: 'error', syncError: `Failed to sync update: ${e.message}` });
                }
            }
        },

        deleteClient: async (clientId) => {
            // Delete locally first
            set(state => {
                const clients = state.clients.filter(c => c.id !== clientId);
                const savedQuotes = state.savedQuotes.filter(q => q.clientId !== clientId);
                saveClientsLocal(clients);
                saveSavedQuotesLocal(savedQuotes);
                return { clients, savedQuotes };
            });

            // Delete from Supabase
            if (isSupabaseConfigured()) {
                try {
                    const { error } = await supabase.from('clients').delete().eq('id', clientId);
                    if (error) throw error;
                    set({ syncStatus: 'success', syncError: null });
                } catch (e) {
                    logger.error('Failed to delete client from DB', e);
                    get().addToSyncQueue('clients', 'delete', clientId, null);
                    set({ syncStatus: 'error', syncError: `Failed to sync delete: ${e.message}` });
                }
            }
        },

        getClient: (clientId) => {
            return get().clients.find(c => c.id === clientId);
        },

        // Calculate client health score based on activity, win rate, and engagement
        // Returns: { status: 'good' | 'warning' | 'at-risk', score: 0-100, factors: {} }
        getClientHealth: (clientId, activities = [], quotes = []) => {
            const client = get().clients.find(c => c.id === clientId);
            if (!client) return { status: 'at-risk', score: 0, factors: {} };

            // Get client's activities
            const clientActivities = activities.filter(a => a.clientId === clientId);
            const clientQuotes = quotes.filter(q => q.clientId === clientId);

            // Factor 1: Days since last activity (0-40 points)
            let activityScore = 0;
            let daysSinceActivity = null;
            if (clientActivities.length > 0) {
                const lastActivity = clientActivities.reduce((latest, a) => {
                    const date = new Date(a.activityDate || a.createdAt);
                    return date > latest ? date : latest;
                }, new Date(0));
                daysSinceActivity = Math.floor((Date.now() - lastActivity) / (1000 * 60 * 60 * 24));

                if (daysSinceActivity <= 7) activityScore = 40;
                else if (daysSinceActivity <= 14) activityScore = 35;
                else if (daysSinceActivity <= 30) activityScore = 25;
                else if (daysSinceActivity <= 60) activityScore = 15;
                else if (daysSinceActivity <= 90) activityScore = 5;
                else activityScore = 0;
            }

            // Factor 2: Win rate (0-30 points)
            let winRateScore = 0;
            let winRate = 0;
            const wonQuotes = clientQuotes.filter(q => q.status === 'won').length;
            const closedQuotes = clientQuotes.filter(q => ['won', 'dead', 'rejected', 'expired'].includes(q.status)).length;
            if (closedQuotes > 0) {
                winRate = Math.round((wonQuotes / closedQuotes) * 100);
                if (winRate >= 60) winRateScore = 30;
                else if (winRate >= 40) winRateScore = 20;
                else if (winRate >= 20) winRateScore = 10;
                else winRateScore = 5;
            } else if (clientQuotes.length > 0) {
                winRateScore = 15; // Has quotes but none closed yet
            }

            // Factor 3: Recent engagement - quotes in last 90 days (0-30 points)
            let engagementScore = 0;
            const ninetyDaysAgo = Date.now() - (90 * 24 * 60 * 60 * 1000);
            const recentQuotes = clientQuotes.filter(q => {
                const date = new Date(q.savedAt || q.createdAt);
                return date.getTime() > ninetyDaysAgo;
            }).length;

            if (recentQuotes >= 3) engagementScore = 30;
            else if (recentQuotes === 2) engagementScore = 25;
            else if (recentQuotes === 1) engagementScore = 15;
            else engagementScore = 0;

            // Calculate total score
            const totalScore = activityScore + winRateScore + engagementScore;

            // Determine status
            let status;
            if (totalScore >= 60) status = 'good';
            else if (totalScore >= 30) status = 'warning';
            else status = 'at-risk';

            return {
                status,
                score: totalScore,
                factors: {
                    daysSinceActivity,
                    activityScore,
                    winRate,
                    winRateScore,
                    recentQuotes,
                    engagementScore,
                }
            };
        },

        getOrCreateClient: async (clientData) => {
            const { clients } = get();
            // Check by ID first, then fallback to company name match
            const existing = clientData.clientId
                ? clients.find(c => c.id === clientData.clientId)
                : clients.find(c => c.company?.toLowerCase() === clientData.company?.toLowerCase());
            if (existing) return existing;
            return await get().addClient(clientData);
        },

        // =====================
        // CONTACT OPERATIONS
        // =====================

        addContact: async (clientId, contact) => {
            const client = get().clients.find(c => c.id === clientId);
            if (!client) return;

            const existingContacts = client.contacts || [];

            // First contact is always primary, or if explicitly set
            const shouldBePrimary = existingContacts.length === 0 || contact.isPrimary;

            const newContact = {
                id: generateId(),
                ...contact,
                isPrimary: shouldBePrimary,
            };

            // If new contact is primary, clear primary from others
            const contacts = shouldBePrimary
                ? existingContacts.map(c => ({ ...c, isPrimary: false }))
                : existingContacts;

            await get().updateClient(clientId, {
                contacts: [...contacts, newContact]
            });
        },

        updateContact: async (clientId, contactId, updates) => {
            const client = get().clients.find(c => c.id === clientId);
            if (!client) return;

            let contacts = [...(client.contacts || [])];
            if (updates.isPrimary) {
                contacts = contacts.map(c => ({ ...c, isPrimary: false }));
            }
            contacts = contacts.map(c =>
                c.id === contactId ? { ...c, ...updates } : c
            );

            await get().updateClient(clientId, { contacts });
        },

        deleteContact: async (clientId, contactId) => {
            const client = get().clients.find(c => c.id === clientId);
            if (!client) return;

            const deletedContact = (client.contacts || []).find(c => c.id === contactId);
            let contacts = (client.contacts || []).filter(c => c.id !== contactId);

            // If deleted contact was primary, assign primary to first remaining contact
            if (deletedContact?.isPrimary && contacts.length > 0) {
                contacts = contacts.map((c, index) => ({
                    ...c,
                    isPrimary: index === 0 // First contact becomes primary
                }));
            }

            await get().updateClient(clientId, { contacts });
        },

        // =====================
        // QUOTE OPERATIONS
        // =====================

        saveQuote: async (quote, clientId = null) => {
            const { getOrCreateClient } = get();

            // Priority: explicit clientId > quote.client.clientId > lookup by company
            let finalClientId = clientId || quote.client?.clientId;
            if (!finalClientId && quote.client?.company) {
                const client = await getOrCreateClient(quote.client);
                finalClientId = client.id;
            }

            const savedQuote = {
                ...quote,
                id: quote.id || generateId(),
                clientId: finalClientId,
                status: quote.status || 'draft',
                savedAt: new Date().toISOString(),
                _synced: false,
            };

            // Save locally first
            set(state => {
                const existingIndex = state.savedQuotes.findIndex(
                    q => q.quoteNumber === quote.quoteNumber
                );

                let savedQuotes;
                if (existingIndex >= 0) {
                    savedQuotes = [...state.savedQuotes];
                    savedQuotes[existingIndex] = savedQuote;
                } else {
                    savedQuotes = [...state.savedQuotes, savedQuote];
                }

                saveSavedQuotesLocal(savedQuotes);
                return { savedQuotes };
            });

            // Save to Supabase
            if (isSupabaseConfigured()) {
                try {
                    const dbQuote = {
                        quote_number: savedQuote.quoteNumber,
                        quote_date: savedQuote.quoteDate,
                        validity_days: savedQuote.validityDays,
                        status: savedQuote.status,
                        currency: savedQuote.currency,
                        region: savedQuote.region,
                        prepared_by: savedQuote.preparedBy,
                        client: savedQuote.client,
                        project: savedQuote.project,
                        sections: savedQuote.sections,
                        fees: savedQuote.fees,
                        proposal: savedQuote.proposal,
                    };

                    // Check if exists
                    const { data: existing } = await supabase
                        .from('quotes')
                        .select('id')
                        .eq('quote_number', savedQuote.quoteNumber)
                        .single();

                    let serverId = savedQuote.id;
                    if (existing) {
                        await supabase.from('quotes').update(dbQuote).eq('id', existing.id);
                        serverId = existing.id;
                    } else {
                        const { data, error } = await supabase
                            .from('quotes')
                            .insert(dbQuote)
                            .select()
                            .single();
                        if (error) throw error;
                        if (data) {
                            serverId = data.id;
                            // Track new quote creation
                            trackConversion(Events.QUOTE_CREATED);
                        }
                    }

                    // Mark as synced
                    set(state => {
                        const savedQuotes = state.savedQuotes.map(q =>
                            q.quoteNumber === savedQuote.quoteNumber
                                ? { ...q, id: serverId, _synced: true }
                                : q
                        );
                        saveSavedQuotesLocal(savedQuotes);
                        return { savedQuotes, syncStatus: 'success', syncError: null };
                    });
                    savedQuote.id = serverId;
                } catch (e) {
                    logger.error('Failed to save quote to DB', e);
                    get().addToSyncQueue('quotes', 'insert', savedQuote.id, {
                        quote_number: savedQuote.quoteNumber,
                        quote_date: savedQuote.quoteDate,
                        validity_days: savedQuote.validityDays,
                        status: savedQuote.status,
                        currency: savedQuote.currency,
                        region: savedQuote.region,
                        prepared_by: savedQuote.preparedBy,
                        client: savedQuote.client,
                        project: savedQuote.project,
                        sections: savedQuote.sections,
                        fees: savedQuote.fees,
                        proposal: savedQuote.proposal,
                    });
                    set({ syncStatus: 'error', syncError: `Failed to sync quote: ${e.message}` });
                }
            }

            return savedQuote;
        },

        getClientQuotes: (clientId) => {
            return get().savedQuotes.filter(q => q.clientId === clientId);
        },

        getQuote: (quoteId) => {
            return get().savedQuotes.find(q => q.id === quoteId);
        },

        getQuoteByNumber: (quoteNumber) => {
            return get().savedQuotes.find(q => q.quoteNumber === quoteNumber);
        },

        deleteQuote: async (quoteId) => {
            // Delete locally first
            set(state => {
                const savedQuotes = state.savedQuotes.filter(q => q.id !== quoteId);
                saveSavedQuotesLocal(savedQuotes);
                return { savedQuotes };
            });

            // Delete from Supabase
            if (isSupabaseConfigured()) {
                try {
                    const { error } = await supabase.from('quotes').delete().eq('id', quoteId);
                    if (error) throw error;
                    set({ syncStatus: 'success', syncError: null });
                } catch (e) {
                    logger.error('Failed to delete quote from DB', e);
                    get().addToSyncQueue('quotes', 'delete', quoteId, null);
                    set({ syncStatus: 'error', syncError: `Failed to sync delete: ${e.message}` });
                }
            }
        },

        updateQuoteStatus: async (quoteId, status, note = '', lostReason = null, lostReasonNotes = '') => {
            // Get quote info before update for activity logging
            const quote = get().savedQuotes.find(q => q.id === quoteId);
            const previousStatus = quote?.status;

            // Update locally first
            set(state => {
                const savedQuotes = state.savedQuotes.map(q => {
                    if (q.id !== quoteId) return q;

                    const statusHistory = [
                        ...(q.statusHistory || []),
                        {
                            status,
                            timestamp: new Date().toISOString(),
                            userId: 'default',
                            note,
                        }
                    ];

                    return {
                        ...q,
                        status,
                        statusHistory,
                        lostReason: lostReason || q.lostReason,
                        lostReasonNotes: lostReasonNotes || q.lostReasonNotes,
                        updatedAt: new Date().toISOString(),
                        _synced: false,
                    };
                });
                saveSavedQuotesLocal(savedQuotes);
                return { savedQuotes };
            });

            // Log activity for status change
            if (quote && previousStatus !== status) {
                const activityTypes = {
                    sent: 'quote_sent',
                    won: 'quote_won',
                    dead: 'quote_lost',
                };

                const activityTitles = {
                    sent: 'Quote Sent',
                    won: 'Quote Won',
                    dead: 'Quote Lost',
                    draft: 'Quote Drafted',
                };

                const activityType = activityTypes[status] || 'note';
                const title = activityTitles[status] || `Quote Status: ${status}`;

                // Build description
                let description = `Quote ${quote.quoteNumber || 'N/A'} marked as ${status}`;
                if (status === 'dead' && lostReason) {
                    description += `. Reason: ${lostReason}`;
                    if (lostReasonNotes) {
                        description += ` - ${lostReasonNotes}`;
                    }
                }
                if (note) {
                    description += `. Note: ${note}`;
                }

                // Find client ID from quote
                const clientId = quote.clientId || get().clients.find(c =>
                    c.company === quote.client?.company
                )?.id;

                useActivityStore.getState().addActivity({
                    clientId,
                    quoteId,
                    type: activityType,
                    title,
                    description,
                    loggedBy: 'system',
                    loggedByName: 'System',
                });
            }

            // Sync to Supabase
            if (isSupabaseConfigured()) {
                try {
                    const quote = get().savedQuotes.find(q => q.id === quoteId);
                    if (!quote?.quoteNumber) {
                        logger.warn('Cannot sync status update - quote not found or missing quoteNumber');
                        return;
                    }

                    // Use quote_number for lookup since local ID may differ from Supabase ID
                    const { error, count } = await supabase
                        .from('quotes')
                        .update({
                            status,
                            project: {
                                ...(quote?.project || {}),
                                _statusHistory: quote?.statusHistory,
                                _lostReason: quote?.lostReason,
                                _lostReasonNotes: quote?.lostReasonNotes,
                            }
                        })
                        .eq('quote_number', quote.quoteNumber);

                    if (error) throw error;

                    // Log if no rows were updated (for debugging)
                    if (count === 0) {
                        logger.warn(`Status update: No rows matched quote_number ${quote.quoteNumber}`);
                    }

                    // Mark as synced
                    set(state => {
                        const savedQuotes = state.savedQuotes.map(q =>
                            q.id === quoteId ? { ...q, _synced: true } : q
                        );
                        saveSavedQuotesLocal(savedQuotes);
                        return { savedQuotes, syncStatus: 'success', syncError: null };
                    });
                } catch (e) {
                    logger.error('Failed to update quote status in DB', e);
                    set({ syncStatus: 'error', syncError: `Failed to sync status: ${e.message}` });
                }
            }
        },

        updateQuote: async (quoteId, updates) => {
            // Update locally first
            set(state => {
                const savedQuotes = state.savedQuotes.map(q =>
                    q.id === quoteId
                        ? { ...q, ...updates, updatedAt: new Date().toISOString(), _synced: false }
                        : q
                );
                saveSavedQuotesLocal(savedQuotes);
                return { savedQuotes };
            });

            // Sync to Supabase
            if (isSupabaseConfigured()) {
                try {
                    const dbUpdates = {};
                    if (updates.status) dbUpdates.status = updates.status;
                    if (updates.client) dbUpdates.client = updates.client;
                    if (updates.project) dbUpdates.project = updates.project;
                    if (updates.sections) dbUpdates.sections = updates.sections;
                    if (updates.fees) dbUpdates.fees = updates.fees;

                    if (Object.keys(dbUpdates).length > 0) {
                        const { error } = await supabase
                            .from('quotes')
                            .update(dbUpdates)
                            .eq('id', quoteId);

                        if (error) throw error;

                        // Mark as synced
                        set(state => {
                            const savedQuotes = state.savedQuotes.map(q =>
                                q.id === quoteId ? { ...q, _synced: true } : q
                            );
                            saveSavedQuotesLocal(savedQuotes);
                            return { savedQuotes, syncStatus: 'success', syncError: null };
                        });
                    }
                } catch (e) {
                    logger.error('Failed to update quote in DB', e);
                    set({ syncStatus: 'error', syncError: `Failed to sync update: ${e.message}` });
                }
            }
        },

        // =====================
        // EXPORT/IMPORT
        // =====================

        exportData: () => {
            const { clients, savedQuotes } = get();
            const data = {
                version: 1,
                exportedAt: new Date().toISOString(),
                clients,
                savedQuotes,
            };

            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `tell-productions-backup-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        },

        importData: async (file) => {
            try {
                const text = await file.text();
                const data = JSON.parse(text);

                if (!data.clients || !data.savedQuotes) {
                    throw new Error('Invalid backup file format');
                }

                // Mark as unsynced so they get pushed to Supabase
                const clients = data.clients.map(c => ({ ...c, _synced: false }));
                const savedQuotes = data.savedQuotes.map(q => ({ ...q, _synced: false }));

                set({ clients, savedQuotes });
                saveClientsLocal(clients);
                saveSavedQuotesLocal(savedQuotes);

                // Trigger sync
                await get().syncAllToSupabase();

                return { success: true, clientCount: clients.length, quoteCount: savedQuotes.length };
            } catch (e) {
                logger.error('Failed to import data', e);
                return { success: false, error: e.message };
            }
        },

        // =====================
        // STATS
        // =====================

        getClientStats: (clientId) => {
            const quotes = get().savedQuotes.filter(q => q.clientId === clientId);
            if (!quotes.length) return null;

            const won = quotes.filter(q => q.status === 'won');
            const lost = quotes.filter(q => q.status === 'dead' || q.status === 'rejected');
            const closedDeals = won.length + lost.length;

            return {
                totalQuotes: quotes.length,
                wonCount: won.length,
                lostCount: lost.length,
                winRate: closedDeals > 0 ? Math.round((won.length / closedDeals) * 100) : 0,
            };
        },

        getStats: () => {
            const { clients, savedQuotes } = get();
            return {
                totalClients: clients.length,
                totalQuotes: savedQuotes.length,
                draftQuotes: savedQuotes.filter(q => q.status === 'draft').length,
                sentQuotes: savedQuotes.filter(q => q.status === 'sent').length,
                approvedQuotes: savedQuotes.filter(q => q.status === 'approved' || q.status === 'won').length,
            };
        },

        getFinancialStats: () => {
            const { savedQuotes } = get();
            let wonCount = 0;
            let lostCount = 0;
            let totalClosed = 0;

            savedQuotes.forEach(q => {
                if (q.status === 'won') {
                    wonCount++;
                    totalClosed++;
                } else if (q.status === 'dead' || q.status === 'rejected') {
                    lostCount++;
                    totalClosed++;
                }
            });

            return {
                winRate: totalClosed > 0 ? Math.round((wonCount / totalClosed) * 100) : 0,
                wonCount,
                lostCount,
            };
        },
    }))
);
