import { useState, useMemo } from 'react';
import { useContactStore, CONTACT_ROLES } from '../../store/contactStore';
import ContactCard from './ContactCard';
import ContactForm from './ContactForm';

export default function ContactList({
    clientId,
    contacts = [],
    onContactSelect,
    compact = false,
    showAddButton = true,
}) {
    const { addContact, updateContact, deleteContact } = useContactStore();
    const [showForm, setShowForm] = useState(false);
    const [editingContact, setEditingContact] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [filter, setFilter] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');

    // Filter and search contacts
    const filteredContacts = useMemo(() => {
        let result = contacts;

        // Filter by role
        if (filter !== 'all') {
            if (filter === 'primary') {
                result = result.filter(c => c.isPrimary);
            } else {
                result = result.filter(c => c.role === filter);
            }
        }

        // Search
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            result = result.filter(c =>
                (c.firstName?.toLowerCase() || '').includes(query) ||
                (c.lastName?.toLowerCase() || '').includes(query) ||
                (c.email?.toLowerCase() || '').includes(query) ||
                (c.jobTitle?.toLowerCase() || '').includes(query)
            );
        }

        return result;
    }, [contacts, filter, searchQuery]);

    const handleSave = async (data) => {
        setIsLoading(true);
        try {
            if (editingContact) {
                await updateContact(editingContact.id, data);
            } else {
                await addContact(data);
            }
            setShowForm(false);
            setEditingContact(null);
        } catch (error) {
            console.error('Failed to save contact:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleEdit = (contact) => {
        setEditingContact(contact);
        setShowForm(true);
    };

    const handleDelete = async (contactId) => {
        await deleteContact(contactId);
    };

    const handleCancel = () => {
        setShowForm(false);
        setEditingContact(null);
    };

    // Compact list view
    if (compact) {
        return (
            <div className="space-y-1">
                {contacts.length === 0 ? (
                    <p className="text-sm text-gray-500 py-2">No contacts</p>
                ) : (
                    contacts.map(contact => (
                        <ContactCard
                            key={contact.id}
                            contact={contact}
                            compact
                            onSelect={onContactSelect}
                        />
                    ))
                )}
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 flex-1">
                    {/* Search */}
                    <div className="relative flex-1 max-w-xs">
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search contacts..."
                            className="input w-full pl-9"
                        />
                        <svg className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </div>

                    {/* Role filter */}
                    <select
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                        className="input"
                    >
                        <option value="all">All Contacts</option>
                        <option value="primary">Primary Only</option>
                        {CONTACT_ROLES.map(role => (
                            <option key={role.id} value={role.id}>{role.label}</option>
                        ))}
                    </select>
                </div>

                {showAddButton && !showForm && (
                    <button
                        onClick={() => setShowForm(true)}
                        className="btn btn-primary flex items-center gap-2"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Add Contact
                    </button>
                )}
            </div>

            {/* Add/Edit Form */}
            {showForm && (
                <div className="card">
                    <h3 className="text-lg font-medium text-gray-200 mb-4">
                        {editingContact ? 'Edit Contact' : 'Add New Contact'}
                    </h3>
                    <ContactForm
                        contact={editingContact}
                        clientId={clientId}
                        onSave={handleSave}
                        onCancel={handleCancel}
                        isLoading={isLoading}
                    />
                </div>
            )}

            {/* Contact list */}
            {filteredContacts.length === 0 ? (
                <div className="text-center py-12 border-2 border-dashed border-dark-border/50 rounded-xl bg-dark-bg/30">
                    <svg className="w-12 h-12 mx-auto mb-3 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    {searchQuery || filter !== 'all' ? (
                        <>
                            <p className="text-gray-500 text-sm">No contacts match your filters</p>
                            <button
                                onClick={() => { setSearchQuery(''); setFilter('all'); }}
                                className="text-brand-primary text-sm mt-2 hover:underline"
                            >
                                Clear filters
                            </button>
                        </>
                    ) : (
                        <>
                            <p className="text-gray-500 text-sm">No contacts yet</p>
                            {showAddButton && (
                                <button
                                    onClick={() => setShowForm(true)}
                                    className="text-brand-primary text-sm mt-2 hover:underline"
                                >
                                    Add your first contact
                                </button>
                            )}
                        </>
                    )}
                </div>
            ) : (
                <div className="grid gap-4 md:grid-cols-2">
                    {filteredContacts.map(contact => (
                        <ContactCard
                            key={contact.id}
                            contact={contact}
                            onEdit={handleEdit}
                            onDelete={handleDelete}
                            onSelect={onContactSelect}
                        />
                    ))}
                </div>
            )}

            {/* Count */}
            {contacts.length > 0 && (
                <p className="text-xs text-gray-600 text-right">
                    {filteredContacts.length === contacts.length
                        ? `${contacts.length} contact${contacts.length === 1 ? '' : 's'}`
                        : `${filteredContacts.length} of ${contacts.length} contacts`}
                </p>
            )}
        </div>
    );
}
