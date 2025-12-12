import { useState, useEffect } from 'react';
import { useQuoteStore } from '../../store/quoteStore';
import { useClientStore } from '../../store/clientStore';

export default function ClientDetails() {
    const { quote, setClientDetails } = useQuoteStore();
    const { clients } = useClientStore();
    const { client } = quote;
    const [showDropdown, setShowDropdown] = useState(false);

    // Filter clients based on input
    const filteredClients = client.company
        ? clients.filter(c => c?.company?.toLowerCase()?.includes(client.company.toLowerCase()))
        : clients;

    // Handle escape key to close dropdown
    useEffect(() => {
        const handleEscape = (e) => {
            if (e.key === 'Escape' && showDropdown) {
                setShowDropdown(false);
            }
        };
        window.addEventListener('keydown', handleEscape);
        return () => window.removeEventListener('keydown', handleEscape);
    }, [showDropdown]);

    const handleChange = (field, value) => {
        setClientDetails({ [field]: value });
    };

    const handleSelectClient = (selectedClient) => {
        setClientDetails({
            company: selectedClient.company,
            contact: selectedClient.contact,
            email: selectedClient.email,
            phone: selectedClient.phone,
        });
        setShowDropdown(false);
    };

    // Find full client data to access contacts
    const clientData = clients.find(c =>
        c?.company?.toLowerCase() === client?.company?.toLowerCase()
    );

    const handleSelectContact = (contactId) => {
        if (!clientData) return;

        const contact = clientData.contacts?.find(c => c.id === contactId);
        if (contact) {
            setClientDetails({
                contactId: contact.id,
                contact: contact.name,
                role: contact.role || '',
                email: contact.email,
                phone: contact.phone,
            });
        }
    };

    return (
        <div className="card">
            <h3 className="text-sm font-semibold text-gray-300 mb-3 flex items-center gap-2">
                <svg className="w-4 h-4 text-accent-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                Client Details
            </h3>

            <div className="space-y-5">
                {/* Company Name with Client Selector */}
                <div className="relative">
                    <label className="label">Company Name</label>
                    <input
                        type="text"
                        value={client.company}
                        onChange={(e) => handleChange('company', e.target.value)}
                        onFocus={() => setShowDropdown(true)}
                        placeholder="Type to search or add new client..."
                        className="input"
                    />

                    {/* Client Dropdown */}
                    {showDropdown && filteredClients.length > 0 && (
                        <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-dark-card border border-dark-border rounded-lg shadow-xl max-h-64 overflow-y-auto dropdown-menu">
                            {filteredClients.map((c, index) => (
                                <button
                                    key={c.id}
                                    onClick={() => handleSelectClient(c)}
                                    className={`w-full px-3 py-2.5 text-left hover:bg-accent-primary/10 transition-colors flex items-center gap-3 ${index !== filteredClients.length - 1 ? 'border-b border-dark-border/50' : ''}`}
                                >
                                    <div className="w-8 h-8 rounded-md bg-gray-800 flex items-center justify-center text-xs font-bold text-gray-400 shrink-0">
                                        {c.company.substring(0, 2).toUpperCase()}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm text-gray-200 font-medium truncate">{c.company}</p>
                                        {c.contact && (
                                            <p className="text-xs text-gray-500 truncate">{c.contact}</p>
                                        )}
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Click outside to close */}
                    {showDropdown && (
                        <div
                            className="fixed inset-0 z-40"
                            onClick={() => setShowDropdown(false)}
                        />
                    )}
                </div>

                <div>
                    <label className="label">Contact Person</label>
                    {clientData && clientData.contacts?.length > 0 ? (
                        <div className="flex gap-2">
                            <select
                                value={client.contactId || ''}
                                onChange={(e) => handleSelectContact(e.target.value)}
                                className="input flex-1"
                            >
                                <option value="">Select Contact...</option>
                                {clientData.contacts.map(c => (
                                    <option key={c.id} value={c.id}>
                                        {c.name} {c.isPrimary ? '(Primary)' : ''} - {c.role || 'No Role'}
                                    </option>
                                ))}
                            </select>
                            <input
                                type="text"
                                value={client.contact}
                                onChange={(e) => handleChange('contact', e.target.value)}
                                placeholder="Or type name..."
                                className="input w-1/3"
                            />
                        </div>
                    ) : (
                        <input
                            type="text"
                            value={client.contact}
                            onChange={(e) => handleChange('contact', e.target.value)}
                            placeholder="e.g. Ahmad Rahman"
                            className="input"
                        />
                    )}
                </div>

                <div>
                    <label className="label">Role <span className="text-gray-600 font-normal">(internal only)</span></label>
                    <input
                        type="text"
                        value={client.role || ''}
                        onChange={(e) => handleChange('role', e.target.value)}
                        placeholder="e.g. Marketing Director"
                        className="input"
                    />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                        <label className="label">Email</label>
                        <input
                            type="email"
                            value={client.email}
                            onChange={(e) => handleChange('email', e.target.value)}
                            placeholder="email@company.com"
                            className="input"
                        />
                    </div>

                    <div>
                        <label className="label">Phone</label>
                        <input
                            type="tel"
                            value={client.phone}
                            onChange={(e) => handleChange('phone', e.target.value)}
                            placeholder="+65 9123 4567"
                            className="input"
                        />
                    </div>
                </div>

                <div>
                    <label className="label">Notes <span className="text-gray-600 font-normal">(internal only)</span></label>
                    <textarea
                        value={client.notes || ''}
                        onChange={(e) => handleChange('notes', e.target.value)}
                        placeholder="Notes about this contact..."
                        rows={2}
                        className="input resize-none text-sm"
                    />
                </div>
            </div>
        </div>
    );
}
