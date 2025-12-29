import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import logger from '../utils/logger';

const CONTACTS_KEY = 'tell_crm_contacts';

// Contact roles in buying process
export const CONTACT_ROLES = [
    { id: 'decision_maker', label: 'Decision Maker', color: 'bg-purple-500', description: 'Has authority to approve/reject' },
    { id: 'influencer', label: 'Influencer', color: 'bg-blue-500', description: 'Influences the decision' },
    { id: 'champion', label: 'Champion', color: 'bg-green-500', description: 'Advocates for your solution' },
    { id: 'blocker', label: 'Blocker', color: 'bg-red-500', description: 'May oppose or delay' },
    { id: 'end_user', label: 'End User', color: 'bg-amber-500', description: 'Will use the service' },
    { id: 'other', label: 'Other', color: 'bg-gray-500', description: 'Other role' },
];

// Helper to get role info
export const getRoleInfo = (roleId) => {
    return CONTACT_ROLES.find(r => r.id === roleId) || CONTACT_ROLES[CONTACT_ROLES.length - 1];
};

// Load from localStorage
function loadLocal(key, defaultValue = []) {
    try {
        const saved = localStorage.getItem(key);
        return saved ? JSON.parse(saved) : defaultValue;
    } catch (e) {
        logger.error(`Failed to load ${key}:`, e);
        return defaultValue;
    }
}

// Save to localStorage
function saveLocal(key, data) {
    try {
        localStorage.setItem(key, JSON.stringify(data));
    } catch (e) {
        logger.error(`Failed to save ${key}:`, e);
    }
}

// Convert DB format to app format
function fromDbFormat(c) {
    return {
        id: c.id,
        clientId: c.client_id,
        firstName: c.first_name,
        lastName: c.last_name,
        email: c.email,
        phone: c.phone,
        mobile: c.mobile,
        jobTitle: c.job_title,
        department: c.department,
        role: c.role,
        linkedinUrl: c.linkedin_url,
        isPrimary: c.is_primary,
        isActive: c.is_active,
        notes: c.notes,
        tags: c.tags || [],
        customFields: c.custom_fields || {},
        avatarUrl: c.avatar_url,
        createdAt: c.created_at,
        updatedAt: c.updated_at,
        lastContactedAt: c.last_contacted_at,
    };
}

// Convert app format to DB format
function toDbFormat(contact) {
    return {
        client_id: contact.clientId,
        first_name: contact.firstName,
        last_name: contact.lastName || null,
        email: contact.email || null,
        phone: contact.phone || null,
        mobile: contact.mobile || null,
        job_title: contact.jobTitle || null,
        department: contact.department || null,
        role: contact.role || null,
        linkedin_url: contact.linkedinUrl || null,
        is_primary: contact.isPrimary || false,
        is_active: contact.isActive !== false,
        notes: contact.notes || null,
        tags: contact.tags || [],
        custom_fields: contact.customFields || {},
        avatar_url: contact.avatarUrl || null,
    };
}

export const useContactStore = create(
    subscribeWithSelector((set, get) => ({
        contacts: loadLocal(CONTACTS_KEY),
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
                const { data, error } = await supabase
                    .from('contacts')
                    .select('*')
                    .order('created_at', { ascending: false });

                if (error) throw error;

                const contacts = (data || []).map(fromDbFormat);
                saveLocal(CONTACTS_KEY, contacts);
                set({ contacts, loading: false, initialized: true, error: null });
            } catch (e) {
                logger.error('Failed to initialize contacts:', e);
                set({ loading: false, error: e.message, initialized: true });
            }
        },

        // Get contacts for a specific client
        getClientContacts: (clientId) => {
            return get().contacts.filter(c => c.clientId === clientId);
        },

        // Get primary contact for a client
        getPrimaryContact: (clientId) => {
            return get().contacts.find(c => c.clientId === clientId && c.isPrimary);
        },

        // Get contact by ID
        getContactById: (id) => {
            return get().contacts.find(c => c.id === id);
        },

        // Get full name
        getFullName: (contact) => {
            if (!contact) return '';
            return `${contact.firstName || ''}${contact.lastName ? ' ' + contact.lastName : ''}`.trim() || 'Unknown';
        },

        // Get initials for avatar
        getInitials: (contact) => {
            if (!contact) return '?';
            const first = contact.firstName?.[0] || '';
            const last = contact.lastName?.[0] || '';
            return (first + last).toUpperCase() || '?';
        },

        // Search contacts
        searchContacts: (query) => {
            const q = query.toLowerCase();
            return get().contacts.filter(c => {
                const fullName = `${c.firstName || ''} ${c.lastName || ''}`.toLowerCase();
                return (
                    fullName.includes(q) ||
                    c.email?.toLowerCase().includes(q) ||
                    c.phone?.includes(q) ||
                    c.mobile?.includes(q) ||
                    c.jobTitle?.toLowerCase().includes(q) ||
                    c.department?.toLowerCase().includes(q) ||
                    c.tags?.some(t => t.toLowerCase().includes(q))
                );
            });
        },

        // Get contacts that need follow-up (not contacted in X days)
        getStaleContacts: (days = 30) => {
            const cutoff = new Date();
            cutoff.setDate(cutoff.getDate() - days);

            return get().contacts.filter(c => {
                if (!c.lastContactedAt) return true;
                return new Date(c.lastContactedAt) < cutoff;
            });
        },

        // Add a new contact
        addContact: async (contactData) => {
            if (!isSupabaseConfigured()) {
                set({ error: 'Supabase not configured' });
                return null;
            }

            try {
                const dbData = toDbFormat(contactData);

                // If this is marked as primary, clear others first
                if (contactData.isPrimary && contactData.clientId) {
                    await supabase
                        .from('contacts')
                        .update({ is_primary: false })
                        .eq('client_id', contactData.clientId);
                }

                const { data, error } = await supabase
                    .from('contacts')
                    .insert(dbData)
                    .select()
                    .single();

                if (error) throw error;

                const newContact = fromDbFormat(data);

                set(state => {
                    let contacts = state.contacts;
                    // Clear primary from others if new one is primary
                    if (newContact.isPrimary) {
                        contacts = contacts.map(c =>
                            c.clientId === newContact.clientId ? { ...c, isPrimary: false } : c
                        );
                    }
                    contacts = [newContact, ...contacts];
                    saveLocal(CONTACTS_KEY, contacts);
                    return { contacts, error: null };
                });

                return newContact;
            } catch (e) {
                logger.error('Failed to add contact:', e);
                set({ error: e.message });
                return null;
            }
        },

        // Update a contact
        updateContact: async (id, updates) => {
            if (!isSupabaseConfigured()) {
                set({ error: 'Supabase not configured' });
                return false;
            }

            try {
                const existingContact = get().contacts.find(c => c.id === id);
                if (!existingContact) throw new Error('Contact not found');

                const dbUpdates = {};
                if (updates.firstName !== undefined) dbUpdates.first_name = updates.firstName;
                if (updates.lastName !== undefined) dbUpdates.last_name = updates.lastName;
                if (updates.email !== undefined) dbUpdates.email = updates.email;
                if (updates.phone !== undefined) dbUpdates.phone = updates.phone;
                if (updates.mobile !== undefined) dbUpdates.mobile = updates.mobile;
                if (updates.jobTitle !== undefined) dbUpdates.job_title = updates.jobTitle;
                if (updates.department !== undefined) dbUpdates.department = updates.department;
                if (updates.role !== undefined) dbUpdates.role = updates.role;
                if (updates.linkedinUrl !== undefined) dbUpdates.linkedin_url = updates.linkedinUrl;
                if (updates.isPrimary !== undefined) dbUpdates.is_primary = updates.isPrimary;
                if (updates.isActive !== undefined) dbUpdates.is_active = updates.isActive;
                if (updates.notes !== undefined) dbUpdates.notes = updates.notes;
                if (updates.tags !== undefined) dbUpdates.tags = updates.tags;
                if (updates.customFields !== undefined) dbUpdates.custom_fields = updates.customFields;
                if (updates.avatarUrl !== undefined) dbUpdates.avatar_url = updates.avatarUrl;

                // If setting as primary, clear others first
                if (updates.isPrimary) {
                    await supabase
                        .from('contacts')
                        .update({ is_primary: false })
                        .eq('client_id', existingContact.clientId)
                        .neq('id', id);
                }

                const { error } = await supabase
                    .from('contacts')
                    .update(dbUpdates)
                    .eq('id', id);

                if (error) throw error;

                set(state => {
                    const contacts = state.contacts.map(c => {
                        if (c.id === id) {
                            return { ...c, ...updates, updatedAt: new Date().toISOString() };
                        }
                        // Clear primary from others if this one became primary
                        if (updates.isPrimary && c.clientId === existingContact.clientId) {
                            return { ...c, isPrimary: false };
                        }
                        return c;
                    });
                    saveLocal(CONTACTS_KEY, contacts);
                    return { contacts, error: null };
                });

                return true;
            } catch (e) {
                logger.error('Failed to update contact:', e);
                set({ error: e.message });
                return false;
            }
        },

        // Delete a contact
        deleteContact: async (id) => {
            if (!isSupabaseConfigured()) {
                set({ error: 'Supabase not configured' });
                return false;
            }

            try {
                const { error } = await supabase
                    .from('contacts')
                    .delete()
                    .eq('id', id);

                if (error) throw error;

                set(state => {
                    const contacts = state.contacts.filter(c => c.id !== id);
                    saveLocal(CONTACTS_KEY, contacts);
                    return { contacts, error: null };
                });

                return true;
            } catch (e) {
                logger.error('Failed to delete contact:', e);
                set({ error: e.message });
                return false;
            }
        },

        // Link contact to opportunity
        linkToOpportunity: async (contactId, opportunityId, role = null) => {
            if (!isSupabaseConfigured()) return false;

            try {
                const { error } = await supabase
                    .from('contact_opportunities')
                    .insert({
                        contact_id: contactId,
                        opportunity_id: opportunityId,
                        role,
                    });

                // Ignore unique constraint violations (already linked)
                if (error && error.code !== '23505') throw error;
                return true;
            } catch (e) {
                logger.error('Failed to link contact to opportunity:', e);
                return false;
            }
        },

        // Unlink contact from opportunity
        unlinkFromOpportunity: async (contactId, opportunityId) => {
            if (!isSupabaseConfigured()) return false;

            try {
                const { error } = await supabase
                    .from('contact_opportunities')
                    .delete()
                    .eq('contact_id', contactId)
                    .eq('opportunity_id', opportunityId);

                if (error) throw error;
                return true;
            } catch (e) {
                logger.error('Failed to unlink contact from opportunity:', e);
                return false;
            }
        },

        // Get contacts for an opportunity
        getOpportunityContacts: async (opportunityId) => {
            if (!isSupabaseConfigured()) return [];

            try {
                const { data, error } = await supabase
                    .from('contact_opportunities')
                    .select(`
                        role,
                        is_primary,
                        contacts (*)
                    `)
                    .eq('opportunity_id', opportunityId);

                if (error) throw error;

                return (data || []).map(item => ({
                    ...fromDbFormat(item.contacts),
                    opportunityRole: item.role,
                    isOpportunityPrimary: item.is_primary,
                }));
            } catch (e) {
                logger.error('Failed to get opportunity contacts:', e);
                return [];
            }
        },

        // Clear error
        clearError: () => set({ error: null }),
    }))
);
