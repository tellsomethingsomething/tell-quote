import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

const CLIENTS_STORAGE_KEY = 'tell_clients';
const SAVED_QUOTES_KEY = 'tell_saved_quotes';

// Load clients from localStorage
function loadClients() {
    try {
        const saved = localStorage.getItem(CLIENTS_STORAGE_KEY);
        return saved ? JSON.parse(saved) : [];
    } catch (e) {
        console.error('Failed to load clients:', e);
        return [];
    }
}

// Save clients to localStorage
function saveClients(clients) {
    try {
        localStorage.setItem(CLIENTS_STORAGE_KEY, JSON.stringify(clients));
    } catch (e) {
        console.error('Failed to save clients:', e);
    }
}

// Load saved quotes from localStorage
function loadSavedQuotes() {
    try {
        const saved = localStorage.getItem(SAVED_QUOTES_KEY);
        return saved ? JSON.parse(saved) : [];
    } catch (e) {
        console.error('Failed to load saved quotes:', e);
        return [];
    }
}

// Save quotes to localStorage
function saveSavedQuotes(quotes) {
    try {
        localStorage.setItem(SAVED_QUOTES_KEY, JSON.stringify(quotes));
    } catch (e) {
        console.error('Failed to save quotes:', e);
    }
}

// Generate unique ID
function generateId() {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
}

export const useClientStore = create(
    subscribeWithSelector((set, get) => ({
        // Clients list
        clients: loadClients(),

        // Saved quotes
        savedQuotes: loadSavedQuotes(),

        // Initialize (call on app start)
        initialize: () => {
            set({
                clients: loadClients(),
                savedQuotes: loadSavedQuotes(),
            });
        },

        // =====================
        // CLIENT OPERATIONS
        // =====================

        // Add a new client
        addClient: (clientData) => {
            const newClient = {
                id: generateId(),
                company: clientData.company || '',
                contact: clientData.contact || '', // Primary contact name (legacy support)
                email: clientData.email || '', // Primary contact email (legacy support)
                phone: clientData.phone || '', // Primary contact phone (legacy support)
                website: clientData.website || '',
                location: clientData.location || '',
                address: clientData.address || '', // Company Registered Address
                region: clientData.region || 'MALAYSIA', // Charge Basis / Region
                notes: clientData.notes || '',
                contacts: clientData.contacts || [], // New contacts array
                tags: clientData.tags || [], // Client tags (e.g. VIP, Corporate, Event)
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            };

            // If legacy contact info is provided but no contacts array, create a primary contact
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

            set(state => {
                const clients = [...state.clients, newClient];
                saveClients(clients);
                return { clients };
            });

            return newClient;
        },

        // Update client
        updateClient: (clientId, updates) => {
            set(state => {
                const clients = state.clients.map(client =>
                    client.id === clientId
                        ? { ...client, ...updates, updatedAt: new Date().toISOString() }
                        : client
                );
                saveClients(clients);
                return { clients };
            });
        },

        // Delete client (and their quotes)
        deleteClient: (clientId) => {
            set(state => {
                const clients = state.clients.filter(c => c.id !== clientId);
                const savedQuotes = state.savedQuotes.filter(q => q.clientId !== clientId);
                saveClients(clients);
                saveSavedQuotes(savedQuotes);
                return { clients, savedQuotes };
            });
        },

        // Get client by ID
        getClient: (clientId) => {
            return get().clients.find(c => c.id === clientId);
        },

        // Get or create client from quote data
        getOrCreateClient: (clientData) => {
            const { clients } = get();

            // Try to find existing client by company name
            const existing = clients.find(
                c => c.company.toLowerCase() === clientData.company?.toLowerCase()
            );

            if (existing) {
                return existing;
            }

            // Create new client
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

                    // If new contact is primary, unmark others
                    const contacts = contact.isPrimary
                        ? client.contacts?.map(c => ({ ...c, isPrimary: false })) || []
                        : client.contacts || [];

                    return {
                        ...client,
                        contacts: [...contacts, newContact],
                        updatedAt: new Date().toISOString()
                    };
                });
                saveClients(clients);
                return { clients };
            });
        },

        updateContact: (clientId, contactId, updates) => {
            set(state => {
                const clients = state.clients.map(client => {
                    if (client.id !== clientId) return client;

                    let contacts = client.contacts || [];

                    // If setting as primary, unmark others
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
                saveClients(clients);
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
                saveClients(clients);
                return { clients };
            });
        },

        // =====================
        // QUOTE OPERATIONS
        // =====================

        // Save a quote (links to client)
        saveQuote: (quote, clientId = null) => {
            const { getOrCreateClient } = get();

            // If no clientId, create/get client from quote's client data
            let finalClientId = clientId;
            if (!finalClientId && quote.client?.company) {
                const client = getOrCreateClient(quote.client);
                finalClientId = client.id;
            }

            const savedQuote = {
                ...quote,
                id: quote.id || generateId(),
                clientId: finalClientId,
                status: quote.status || 'draft',
                savedAt: new Date().toISOString(),
            };

            set(state => {
                // Check if quote already exists (update) or is new (add)
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

                saveSavedQuotes(savedQuotes);
                return { savedQuotes };
            });

            return savedQuote;
        },

        // Get quotes for a client
        getClientQuotes: (clientId) => {
            return get().savedQuotes.filter(q => q.clientId === clientId);
        },

        // Get quote by ID
        getQuote: (quoteId) => {
            return get().savedQuotes.find(q => q.id === quoteId);
        },

        // Get quote by quote number
        getQuoteByNumber: (quoteNumber) => {
            return get().savedQuotes.find(q => q.quoteNumber === quoteNumber);
        },

        // Delete quote
        deleteQuote: (quoteId) => {
            set(state => {
                const savedQuotes = state.savedQuotes.filter(q => q.id !== quoteId);
                saveSavedQuotes(savedQuotes);
                return { savedQuotes };
            });
        },

        // Update quote status
        updateQuoteStatus: (quoteId, status) => {
            set(state => {
                const savedQuotes = state.savedQuotes.map(q =>
                    q.id === quoteId
                        ? { ...q, status, updatedAt: new Date().toISOString() }
                        : q
                );
                saveSavedQuotes(savedQuotes);
                return { savedQuotes };
            });
        },

        // =====================
        // EXPORT/IMPORT
        // =====================

        // Export all data as JSON
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

        // Import data from JSON
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

                saveClients(data.clients);
                saveSavedQuotes(data.savedQuotes);

                return { success: true, clientCount: data.clients.length, quoteCount: data.savedQuotes.length };
            } catch (e) {
                console.error('Failed to import data:', e);
                return { success: false, error: e.message };
            }
        },

        // =====================
        // STATS
        // =====================

        // Get extended stats for a specific client
        getClientStats: (clientId) => {
            const quotes = get().savedQuotes.filter(q => q.clientId === clientId);
            if (!quotes.length) return null;

            // We need to calculate values. Importing the helper or duplicating logic?
            // Since this is a store, avoiding circular dependency with utils is good, but duplicating calculation is risky.
            // Let's assume we can get basic totals from the quote object if we stored them, OR we import the calculator.
            // Check imports... we don't import calculator here.
            // Ideally quote object should store its 'grandTotal' when saved. 
            // Currently it saves the whole state. 'sections' are there.

            // Allow passing a calculate function or import it.
            // Ideally we modify saveQuote to compute and store the total value to avoid recalculating everywhere.
            // value: number

            // For now, let's just count.
            const won = quotes.filter(q => q.status === 'won');
            const lost = quotes.filter(q => q.status === 'dead' || q.status === 'rejected');

            return {
                totalQuotes: quotes.length,
                wonCount: won.length,
                lostCount: lost.length,
                winRate: quotes.length > 0 ? (won.length / quotes.length) * 100 : 0,
            };
        },

        // Get stats for dashboard
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

        // Get company-wide financial stats
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
