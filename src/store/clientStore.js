import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

const CLIENTS_STORAGE_KEY = 'tell_clients';
const SAVED_QUOTES_KEY = 'tell_saved_quotes';

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
        console.error('Failed to save clients locally:', e);
    }
}

function saveSavedQuotesLocal(quotes) {
    try {
        localStorage.setItem(SAVED_QUOTES_KEY, JSON.stringify(quotes));
    } catch (e) {
        console.error('Failed to save quotes locally:', e);
    }
}

function generateId() {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
}

export const useClientStore = create(
    subscribeWithSelector((set, get) => ({
        clients: loadClientsLocal(),
        savedQuotes: loadSavedQuotesLocal(),
        loading: false,

        // Initialize - load from Supabase (or localStorage fallback)
        initialize: async () => {
            // If Supabase not configured, just use localStorage data
            if (!isSupabaseConfigured()) {
                set({ loading: false });
                return;
            }

            set({ loading: true });
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
                const clients = (clientsData || []).map(c => ({
                    id: c.id,
                    company: c.company,
                    contact: c.contact,
                    email: c.email,
                    phone: c.phone,
                    address: c.address,
                    notes: c.notes,
                    tags: c.tags || [],
                    contacts: c.contacts || [],
                    createdAt: c.created_at,
                    updatedAt: c.updated_at,
                }));

                const savedQuotes = (quotesData || []).map(q => {
                    // Match quote to client by company name
                    const clientCompany = q.client?.company?.toLowerCase();
                    const matchedClient = clientCompany
                        ? clients.find(c => c.company?.toLowerCase() === clientCompany)
                        : null;

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
                        clientId: matchedClient?.id || null,
                        project: q.project || {},
                        sections: q.sections || {},
                        fees: q.fees || {},
                        proposal: q.proposal || {},
                        createdAt: q.created_at,
                        updatedAt: q.updated_at,
                    };
                });

                saveClientsLocal(clients);
                saveSavedQuotesLocal(savedQuotes);
                set({ clients, savedQuotes, loading: false });
            } catch (e) {
                console.error('Failed to load from DB:', e);
                set({ loading: false });
            }
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
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
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

            // Save to Supabase if configured
            if (isSupabaseConfigured()) {
                try {
                    const { data, error } = await supabase
                        .from('clients')
                        .insert({
                            company: newClient.company,
                            contact: newClient.contact,
                            email: newClient.email,
                            phone: newClient.phone,
                            address: newClient.address,
                            notes: newClient.notes,
                            tags: newClient.tags,
                            contacts: newClient.contacts,
                        })
                        .select()
                        .single();

                    if (error) throw error;
                    newClient.id = data.id;
                } catch (e) {
                    console.error('Failed to save client to DB:', e);
                }
            }

            set(state => {
                const clients = [...state.clients, newClient];
                saveClientsLocal(clients);
                return { clients };
            });

            return newClient;
        },

        updateClient: async (clientId, updates) => {
            set(state => {
                const clients = state.clients.map(client =>
                    client.id === clientId
                        ? { ...client, ...updates, updatedAt: new Date().toISOString() }
                        : client
                );
                saveClientsLocal(clients);
                return { clients };
            });

            // Save to Supabase if configured
            if (isSupabaseConfigured()) {
                try {
                    await supabase
                        .from('clients')
                        .update({
                            company: updates.company,
                            contact: updates.contact,
                            email: updates.email,
                            phone: updates.phone,
                            address: updates.address,
                            notes: updates.notes,
                            tags: updates.tags,
                            contacts: updates.contacts,
                        })
                        .eq('id', clientId);
                } catch (e) {
                    console.error('Failed to update client in DB:', e);
                }
            }
        },

        deleteClient: async (clientId) => {
            set(state => {
                const clients = state.clients.filter(c => c.id !== clientId);
                const savedQuotes = state.savedQuotes.filter(q => q.clientId !== clientId);
                saveClientsLocal(clients);
                saveSavedQuotesLocal(savedQuotes);
                return { clients, savedQuotes };
            });

            // Delete from Supabase if configured
            if (isSupabaseConfigured()) {
                try {
                    await supabase.from('clients').delete().eq('id', clientId);
                } catch (e) {
                    console.error('Failed to delete client from DB:', e);
                }
            }
        },

        getClient: (clientId) => {
            return get().clients.find(c => c.id === clientId);
        },

        getOrCreateClient: (clientData) => {
            const { clients } = get();
            const existing = clients.find(
                c => c.company.toLowerCase() === clientData.company?.toLowerCase()
            );
            if (existing) return existing;
            return get().addClient(clientData);
        },

        // =====================
        // CONTACT OPERATIONS
        // =====================

        addContact: (clientId, contact) => {
            set(state => {
                const clients = state.clients.map(client => {
                    if (client.id !== clientId) return client;

                    const newContact = {
                        id: generateId(),
                        ...contact,
                        isPrimary: contact.isPrimary || false,
                    };

                    const contacts = contact.isPrimary
                        ? client.contacts?.map(c => ({ ...c, isPrimary: false })) || []
                        : client.contacts || [];

                    return {
                        ...client,
                        contacts: [...contacts, newContact],
                        updatedAt: new Date().toISOString()
                    };
                });
                saveClientsLocal(clients);

                // Update in DB if configured
                if (isSupabaseConfigured()) {
                    const updatedClient = clients.find(c => c.id === clientId);
                    if (updatedClient) {
                        supabase
                            .from('clients')
                            .update({ contacts: updatedClient.contacts })
                            .eq('id', clientId)
                            .catch(e => console.error('Failed to sync contact to DB:', e));
                    }
                }

                return { clients };
            });
        },

        updateContact: (clientId, contactId, updates) => {
            set(state => {
                const clients = state.clients.map(client => {
                    if (client.id !== clientId) return client;

                    let contacts = client.contacts || [];
                    if (updates.isPrimary) {
                        contacts = contacts.map(c => ({ ...c, isPrimary: false }));
                    }
                    contacts = contacts.map(c =>
                        c.id === contactId ? { ...c, ...updates } : c
                    );

                    return {
                        ...client,
                        contacts,
                        updatedAt: new Date().toISOString()
                    };
                });
                saveClientsLocal(clients);

                // Update in DB if configured
                if (isSupabaseConfigured()) {
                    const updatedClient = clients.find(c => c.id === clientId);
                    if (updatedClient) {
                        supabase
                            .from('clients')
                            .update({ contacts: updatedClient.contacts })
                            .eq('id', clientId)
                            .catch(e => console.error('Failed to sync contact update to DB:', e));
                    }
                }

                return { clients };
            });
        },

        deleteContact: (clientId, contactId) => {
            set(state => {
                const clients = state.clients.map(client => {
                    if (client.id !== clientId) return client;

                    return {
                        ...client,
                        contacts: (client.contacts || []).filter(c => c.id !== contactId),
                        updatedAt: new Date().toISOString()
                    };
                });
                saveClientsLocal(clients);

                // Update in DB if configured
                if (isSupabaseConfigured()) {
                    const updatedClient = clients.find(c => c.id === clientId);
                    if (updatedClient) {
                        supabase
                            .from('clients')
                            .update({ contacts: updatedClient.contacts })
                            .eq('id', clientId)
                            .catch(e => console.error('Failed to sync contact deletion to DB:', e));
                    }
                }

                return { clients };
            });
        },

        // =====================
        // QUOTE OPERATIONS
        // =====================

        saveQuote: async (quote, clientId = null) => {
            const { getOrCreateClient } = get();

            let finalClientId = clientId;
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
            };

            // Save to Supabase
            try {
                const dbQuote = {
                    quote_number: savedQuote.quoteNumber,
                    quote_date: savedQuote.quoteDate,
                    validity_days: savedQuote.validityDays,
                    status: savedQuote.status,
                    currency: savedQuote.currency,
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

                if (existing) {
                    await supabase
                        .from('quotes')
                        .update(dbQuote)
                        .eq('id', existing.id);
                    savedQuote.id = existing.id;
                } else {
                    const { data, error } = await supabase
                        .from('quotes')
                        .insert(dbQuote)
                        .select()
                        .single();
                    if (!error && data) {
                        savedQuote.id = data.id;
                    }
                }
            } catch (e) {
                console.error('Failed to save quote to DB:', e);
            }

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
            set(state => {
                const savedQuotes = state.savedQuotes.filter(q => q.id !== quoteId);
                saveSavedQuotesLocal(savedQuotes);
                return { savedQuotes };
            });

            if (isSupabaseConfigured()) {
                try {
                    await supabase.from('quotes').delete().eq('id', quoteId);
                } catch (e) {
                    console.error('Failed to delete quote from DB:', e);
                }
            }
        },

        updateQuoteStatus: async (quoteId, status, note = '', lostReason = null, lostReasonNotes = '') => {
            set(state => {
                const savedQuotes = state.savedQuotes.map(q => {
                    if (q.id !== quoteId) return q;

                    // Add to status history
                    const statusHistory = [
                        ...(q.statusHistory || []),
                        {
                            status,
                            timestamp: new Date().toISOString(),
                            userId: 'default', // TODO: Get from auth context
                            note,
                        }
                    ];

                    return {
                        ...q,
                        status,
                        statusHistory,
                        lostReason: lostReason || q.lostReason,
                        lostReasonNotes: lostReasonNotes || q.lostReasonNotes,
                        updatedAt: new Date().toISOString()
                    };
                });
                saveSavedQuotesLocal(savedQuotes);
                return { savedQuotes };
            });

            if (isSupabaseConfigured()) {
                try {
                    const quote = get().savedQuotes.find(q => q.id === quoteId);
                    await supabase
                        .from('quotes')
                        .update({
                            status,
                            // Store enhanced fields in project JSONB or create new columns
                            project: {
                                ...(quote?.project || {}),
                                _statusHistory: quote?.statusHistory,
                                _lostReason: quote?.lostReason,
                                _lostReasonNotes: quote?.lostReasonNotes,
                                _nextFollowUpDate: quote?.nextFollowUpDate,
                                _internalNotes: quote?.internalNotes,
                            }
                        })
                        .eq('id', quoteId);
                } catch (e) {
                    console.error('Failed to update quote status in DB:', e);
                }
            }
        },

        updateQuote: async (quoteId, updates) => {
            set(state => {
                const savedQuotes = state.savedQuotes.map(q =>
                    q.id === quoteId
                        ? { ...q, ...updates, updatedAt: new Date().toISOString() }
                        : q
                );
                saveSavedQuotesLocal(savedQuotes);
                return { savedQuotes };
            });

            try {
                const dbUpdates = {};
                if (updates.status) dbUpdates.status = updates.status;
                if (updates.client) dbUpdates.client = updates.client;
                if (updates.project) dbUpdates.project = updates.project;
                if (updates.sections) dbUpdates.sections = updates.sections;
                if (updates.fees) dbUpdates.fees = updates.fees;

                if (Object.keys(dbUpdates).length > 0) {
                    await supabase
                        .from('quotes')
                        .update(dbUpdates)
                        .eq('id', quoteId);
                }
            } catch (e) {
                console.error('Failed to update quote in DB:', e);
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

                set({
                    clients: data.clients,
                    savedQuotes: data.savedQuotes,
                });

                saveClientsLocal(data.clients);
                saveSavedQuotesLocal(data.savedQuotes);

                return { success: true, clientCount: data.clients.length, quoteCount: data.savedQuotes.length };
            } catch (e) {
                console.error('Failed to import data:', e);
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
