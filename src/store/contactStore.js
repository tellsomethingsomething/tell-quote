import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

const CONTACTS_KEY = 'tell_contacts';
const COMPANIES_KEY = 'tell_companies';
const COMMUNICATIONS_KEY = 'tell_communications';

// Contact categories
export const CONTACT_CATEGORIES = [
    { id: 'client', label: 'Client', color: 'bg-blue-500' },
    { id: 'broadcaster', label: 'Broadcaster', color: 'bg-purple-500' },
    { id: 'venue', label: 'Venue', color: 'bg-green-500' },
    { id: 'crew', label: 'Crew/Freelancer', color: 'bg-orange-500' },
    { id: 'supplier', label: 'Supplier', color: 'bg-yellow-500' },
    { id: 'federation', label: 'Federation', color: 'bg-red-500' },
    { id: 'partner', label: 'Partner', color: 'bg-teal-500' },
    { id: 'other', label: 'Other', color: 'bg-gray-500' },
];

// Company categories
export const COMPANY_CATEGORIES = [
    { id: 'client', label: 'Client' },
    { id: 'broadcaster', label: 'Broadcaster' },
    { id: 'venue', label: 'Venue' },
    { id: 'supplier', label: 'Supplier' },
    { id: 'federation', label: 'Federation' },
    { id: 'partner', label: 'Partner' },
    { id: 'agency', label: 'Agency' },
    { id: 'crew_agency', label: 'Crew Agency' },
];

// Markets
export const MARKETS = [
    { id: 'Malaysia', label: 'Malaysia' },
    { id: 'Singapore', label: 'Singapore' },
    { id: 'Thailand', label: 'Thailand' },
    { id: 'Indonesia', label: 'Indonesia' },
    { id: 'Vietnam', label: 'Vietnam' },
    { id: 'Philippines', label: 'Philippines' },
    { id: 'Kuwait', label: 'Kuwait' },
    { id: 'Saudi Arabia', label: 'Saudi Arabia' },
    { id: 'UAE', label: 'UAE' },
    { id: 'Qatar', label: 'Qatar' },
    { id: 'UK', label: 'UK' },
    { id: 'Kazakhstan', label: 'Kazakhstan' },
    { id: 'Uzbekistan', label: 'Uzbekistan' },
];

// Communication types
export const COMMUNICATION_TYPES = [
    { id: 'email', label: 'Email', icon: 'M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z' },
    { id: 'call', label: 'Call', icon: 'M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z' },
    { id: 'meeting', label: 'Meeting', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z' },
    { id: 'whatsapp', label: 'WhatsApp', icon: 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z' },
    { id: 'note', label: 'Note', icon: 'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z' },
    { id: 'linkedin', label: 'LinkedIn', icon: 'M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-2-2 2 2 0 00-2 2v7h-4v-7a6 6 0 016-6zM2 9h4v12H2z' },
];

// Load from localStorage
function loadLocal(key, defaultValue = []) {
    try {
        const saved = localStorage.getItem(key);
        return saved ? JSON.parse(saved) : defaultValue;
    } catch (e) {
        console.error(`Failed to load ${key}:`, e);
        return defaultValue;
    }
}

// Save to localStorage
function saveLocal(key, data) {
    try {
        localStorage.setItem(key, JSON.stringify(data));
    } catch (e) {
        console.error(`Failed to save ${key}:`, e);
    }
}

export const useContactStore = create(
    subscribeWithSelector((set, get) => ({
        // State
        contacts: loadLocal(CONTACTS_KEY),
        companies: loadLocal(COMPANIES_KEY),
        communications: loadLocal(COMMUNICATIONS_KEY),
        loading: false,
        error: null,
        initialized: false,

        // Initialize - load from Supabase
        initialize: async () => {
            if (get().initialized) return;

            set({ loading: true, error: null });

            if (!isSupabaseConfigured()) {
                set({ loading: false, initialized: true });
                return;
            }

            try {
                // Load companies
                const { data: companiesData, error: companiesError } = await supabase
                    .from('companies')
                    .select('*')
                    .order('name');

                if (companiesError) throw companiesError;

                // Load contacts
                const { data: contactsData, error: contactsError } = await supabase
                    .from('contacts')
                    .select('*')
                    .order('name');

                if (contactsError) throw contactsError;

                // Load recent communications (last 100)
                const { data: commsData, error: commsError } = await supabase
                    .from('communications')
                    .select('*')
                    .order('occurred_at', { ascending: false })
                    .limit(100);

                if (commsError) throw commsError;

                const companies = companiesData || [];
                const contacts = contactsData || [];
                const communications = commsData || [];

                saveLocal(COMPANIES_KEY, companies);
                saveLocal(CONTACTS_KEY, contacts);
                saveLocal(COMMUNICATIONS_KEY, communications);

                set({
                    companies,
                    contacts,
                    communications,
                    loading: false,
                    initialized: true,
                });
            } catch (e) {
                console.error('Failed to initialize contacts:', e);
                set({ loading: false, error: e.message, initialized: true });
            }
        },

        // === COMPANIES ===

        addCompany: async (company) => {
            const newCompany = {
                id: `company_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                ...company,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            };

            set((state) => {
                const companies = [newCompany, ...state.companies];
                saveLocal(COMPANIES_KEY, companies);
                return { companies };
            });

            // Sync to Supabase
            if (isSupabaseConfigured()) {
                try {
                    const { data, error } = await supabase
                        .from('companies')
                        .insert([{ ...newCompany }])
                        .select()
                        .single();

                    if (error) throw error;

                    // Update with server-generated ID
                    set((state) => {
                        const companies = state.companies.map(c =>
                            c.id === newCompany.id ? { ...c, id: data.id } : c
                        );
                        saveLocal(COMPANIES_KEY, companies);
                        return { companies };
                    });

                    return data;
                } catch (e) {
                    console.error('Failed to sync company:', e);
                }
            }

            return newCompany;
        },

        updateCompany: async (id, updates) => {
            set((state) => {
                const companies = state.companies.map(c =>
                    c.id === id ? { ...c, ...updates, updated_at: new Date().toISOString() } : c
                );
                saveLocal(COMPANIES_KEY, companies);
                return { companies };
            });

            if (isSupabaseConfigured()) {
                try {
                    await supabase
                        .from('companies')
                        .update({ ...updates, updated_at: new Date().toISOString() })
                        .eq('id', id);
                } catch (e) {
                    console.error('Failed to update company:', e);
                }
            }
        },

        deleteCompany: async (id) => {
            set((state) => {
                const companies = state.companies.filter(c => c.id !== id);
                // Also unlink contacts
                const contacts = state.contacts.map(c =>
                    c.company_id === id ? { ...c, company_id: null } : c
                );
                saveLocal(COMPANIES_KEY, companies);
                saveLocal(CONTACTS_KEY, contacts);
                return { companies, contacts };
            });

            if (isSupabaseConfigured()) {
                try {
                    await supabase.from('companies').delete().eq('id', id);
                } catch (e) {
                    console.error('Failed to delete company:', e);
                }
            }
        },

        // === CONTACTS ===

        addContact: async (contact) => {
            const newContact = {
                id: `contact_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                markets: [],
                tags: [],
                projects: [],
                is_favorite: false,
                ...contact,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            };

            set((state) => {
                const contacts = [newContact, ...state.contacts];
                saveLocal(CONTACTS_KEY, contacts);
                return { contacts };
            });

            // Sync to Supabase
            if (isSupabaseConfigured()) {
                try {
                    const { data, error } = await supabase
                        .from('contacts')
                        .insert([{ ...newContact }])
                        .select()
                        .single();

                    if (error) throw error;

                    set((state) => {
                        const contacts = state.contacts.map(c =>
                            c.id === newContact.id ? { ...c, id: data.id } : c
                        );
                        saveLocal(CONTACTS_KEY, contacts);
                        return { contacts };
                    });

                    return data;
                } catch (e) {
                    console.error('Failed to sync contact:', e);
                }
            }

            return newContact;
        },

        updateContact: async (id, updates) => {
            set((state) => {
                const contacts = state.contacts.map(c =>
                    c.id === id ? { ...c, ...updates, updated_at: new Date().toISOString() } : c
                );
                saveLocal(CONTACTS_KEY, contacts);
                return { contacts };
            });

            if (isSupabaseConfigured()) {
                try {
                    await supabase
                        .from('contacts')
                        .update({ ...updates, updated_at: new Date().toISOString() })
                        .eq('id', id);
                } catch (e) {
                    console.error('Failed to update contact:', e);
                }
            }
        },

        deleteContact: async (id) => {
            set((state) => {
                const contacts = state.contacts.filter(c => c.id !== id);
                const communications = state.communications.filter(c => c.contact_id !== id);
                saveLocal(CONTACTS_KEY, contacts);
                saveLocal(COMMUNICATIONS_KEY, communications);
                return { contacts, communications };
            });

            if (isSupabaseConfigured()) {
                try {
                    await supabase.from('contacts').delete().eq('id', id);
                } catch (e) {
                    console.error('Failed to delete contact:', e);
                }
            }
        },

        toggleFavorite: async (id) => {
            const contact = get().contacts.find(c => c.id === id);
            if (contact) {
                await get().updateContact(id, { is_favorite: !contact.is_favorite });
            }
        },

        // === COMMUNICATIONS ===

        addCommunication: async (communication) => {
            const newComm = {
                id: `comm_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                action_items: [],
                needs_followup: false,
                ...communication,
                occurred_at: communication.occurred_at || new Date().toISOString(),
                created_at: new Date().toISOString(),
            };

            set((state) => {
                const communications = [newComm, ...state.communications];
                saveLocal(COMMUNICATIONS_KEY, communications);

                // Update last_contacted_at on contact
                let contacts = state.contacts;
                if (newComm.contact_id) {
                    contacts = state.contacts.map(c =>
                        c.id === newComm.contact_id
                            ? { ...c, last_contacted_at: newComm.occurred_at }
                            : c
                    );
                    saveLocal(CONTACTS_KEY, contacts);
                }

                return { communications, contacts };
            });

            // Sync to Supabase
            if (isSupabaseConfigured()) {
                try {
                    const { data, error } = await supabase
                        .from('communications')
                        .insert([{ ...newComm }])
                        .select()
                        .single();

                    if (error) throw error;

                    set((state) => {
                        const communications = state.communications.map(c =>
                            c.id === newComm.id ? { ...c, id: data.id } : c
                        );
                        saveLocal(COMMUNICATIONS_KEY, communications);
                        return { communications };
                    });

                    return data;
                } catch (e) {
                    console.error('Failed to sync communication:', e);
                }
            }

            return newComm;
        },

        updateCommunication: async (id, updates) => {
            set((state) => {
                const communications = state.communications.map(c =>
                    c.id === id ? { ...c, ...updates } : c
                );
                saveLocal(COMMUNICATIONS_KEY, communications);
                return { communications };
            });

            if (isSupabaseConfigured()) {
                try {
                    await supabase
                        .from('communications')
                        .update(updates)
                        .eq('id', id);
                } catch (e) {
                    console.error('Failed to update communication:', e);
                }
            }
        },

        deleteCommunication: async (id) => {
            set((state) => {
                const communications = state.communications.filter(c => c.id !== id);
                saveLocal(COMMUNICATIONS_KEY, communications);
                return { communications };
            });

            if (isSupabaseConfigured()) {
                try {
                    await supabase.from('communications').delete().eq('id', id);
                } catch (e) {
                    console.error('Failed to delete communication:', e);
                }
            }
        },

        // === QUERIES ===

        getContactById: (id) => {
            return get().contacts.find(c => c.id === id);
        },

        getCompanyById: (id) => {
            return get().companies.find(c => c.id === id);
        },

        getContactsByCompany: (companyId) => {
            return get().contacts.filter(c => c.company_id === companyId);
        },

        getCommunicationsForContact: (contactId) => {
            return get().communications
                .filter(c => c.contact_id === contactId)
                .sort((a, b) => new Date(b.occurred_at) - new Date(a.occurred_at));
        },

        getCommunicationsForCompany: (companyId) => {
            const contactIds = get().contacts
                .filter(c => c.company_id === companyId)
                .map(c => c.id);
            return get().communications
                .filter(c => contactIds.includes(c.contact_id) || c.company_id === companyId)
                .sort((a, b) => new Date(b.occurred_at) - new Date(a.occurred_at));
        },

        // Get contacts that haven't been contacted in X days
        getColdContacts: (days = 30) => {
            const cutoff = new Date();
            cutoff.setDate(cutoff.getDate() - days);

            return get().contacts.filter(c => {
                if (!c.last_contacted_at) return true;
                return new Date(c.last_contacted_at) < cutoff;
            });
        },

        // Get contacts with pending follow-ups
        getContactsNeedingFollowup: () => {
            const today = new Date().toISOString().split('T')[0];
            return get().contacts.filter(c => {
                if (!c.next_followup_date) return false;
                return c.next_followup_date <= today;
            });
        },

        // Search contacts
        searchContacts: (query) => {
            const q = query.toLowerCase();
            return get().contacts.filter(c =>
                c.name?.toLowerCase().includes(q) ||
                c.email?.toLowerCase().includes(q) ||
                c.role?.toLowerCase().includes(q) ||
                c.notes?.toLowerCase().includes(q) ||
                c.tags?.some(t => t.toLowerCase().includes(q)) ||
                c.projects?.some(p => p.toLowerCase().includes(q))
            );
        },

        // Get contact with company info
        getContactWithCompany: (contactId) => {
            const contact = get().contacts.find(c => c.id === contactId);
            if (!contact) return null;

            const company = contact.company_id
                ? get().companies.find(c => c.id === contact.company_id)
                : null;

            return { ...contact, company };
        },
    }))
);
