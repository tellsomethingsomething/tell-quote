import { useState, useEffect } from 'react';
import { CONTACT_ROLES } from '../../store/contactStore';

export default function ContactForm({
    contact = null,
    clientId,
    onSave,
    onCancel,
    isLoading = false
}) {
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        mobile: '',
        jobTitle: '',
        department: '',
        role: '',
        linkedinUrl: '',
        isPrimary: false,
        notes: '',
        tags: [],
    });
    const [tagInput, setTagInput] = useState('');

    useEffect(() => {
        if (contact) {
            setFormData({
                firstName: contact.firstName || '',
                lastName: contact.lastName || '',
                email: contact.email || '',
                phone: contact.phone || '',
                mobile: contact.mobile || '',
                jobTitle: contact.jobTitle || '',
                department: contact.department || '',
                role: contact.role || '',
                linkedinUrl: contact.linkedinUrl || '',
                isPrimary: contact.isPrimary || false,
                notes: contact.notes || '',
                tags: contact.tags || [],
            });
        }
    }, [contact]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleAddTag = () => {
        if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
            setFormData(prev => ({
                ...prev,
                tags: [...prev.tags, tagInput.trim()]
            }));
            setTagInput('');
        }
    };

    const handleRemoveTag = (tag) => {
        setFormData(prev => ({
            ...prev,
            tags: prev.tags.filter(t => t !== tag)
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave({
            ...formData,
            clientId,
        });
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name row */}
            <div className="grid grid-cols-2 gap-3">
                <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1">
                        First Name <span className="text-red-400">*</span>
                    </label>
                    <input
                        type="text"
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleChange}
                        required
                        className="input w-full"
                        placeholder="John"
                    />
                </div>
                <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1">
                        Last Name
                    </label>
                    <input
                        type="text"
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleChange}
                        className="input w-full"
                        placeholder="Doe"
                    />
                </div>
            </div>

            {/* Email */}
            <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">
                    Email
                </label>
                <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="input w-full"
                    placeholder="john.doe@company.com"
                />
            </div>

            {/* Phone numbers */}
            <div className="grid grid-cols-2 gap-3">
                <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1">
                        Phone
                    </label>
                    <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        className="input w-full"
                        placeholder="+1 234 567 890"
                    />
                </div>
                <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1">
                        Mobile
                    </label>
                    <input
                        type="tel"
                        name="mobile"
                        value={formData.mobile}
                        onChange={handleChange}
                        className="input w-full"
                        placeholder="+1 234 567 890"
                    />
                </div>
            </div>

            {/* Job info */}
            <div className="grid grid-cols-2 gap-3">
                <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1">
                        Job Title
                    </label>
                    <input
                        type="text"
                        name="jobTitle"
                        value={formData.jobTitle}
                        onChange={handleChange}
                        className="input w-full"
                        placeholder="Marketing Director"
                    />
                </div>
                <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1">
                        Department
                    </label>
                    <input
                        type="text"
                        name="department"
                        value={formData.department}
                        onChange={handleChange}
                        className="input w-full"
                        placeholder="Marketing"
                    />
                </div>
            </div>

            {/* Role in buying process */}
            <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">
                    Role in Buying Process
                </label>
                <select
                    name="role"
                    value={formData.role}
                    onChange={handleChange}
                    className="input w-full"
                >
                    <option value="">Select role...</option>
                    {CONTACT_ROLES.map(role => (
                        <option key={role.id} value={role.id}>
                            {role.label} - {role.description}
                        </option>
                    ))}
                </select>
            </div>

            {/* LinkedIn */}
            <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">
                    LinkedIn URL
                </label>
                <input
                    type="url"
                    name="linkedinUrl"
                    value={formData.linkedinUrl}
                    onChange={handleChange}
                    className="input w-full"
                    placeholder="https://linkedin.com/in/johndoe"
                />
            </div>

            {/* Primary contact toggle */}
            <div className="flex items-center gap-2">
                <input
                    type="checkbox"
                    id="isPrimary"
                    name="isPrimary"
                    checked={formData.isPrimary}
                    onChange={handleChange}
                    className="w-4 h-4 rounded border-dark-border bg-dark-bg text-brand-teal focus:ring-brand-teal focus:ring-offset-dark-bg"
                />
                <label htmlFor="isPrimary" className="text-sm text-gray-300">
                    Primary contact for this client
                </label>
            </div>

            {/* Tags */}
            <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">
                    Tags
                </label>
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={tagInput}
                        onChange={(e) => setTagInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                        className="input flex-1"
                        placeholder="Add tag..."
                    />
                    <button
                        type="button"
                        onClick={handleAddTag}
                        className="btn btn-secondary"
                    >
                        Add
                    </button>
                </div>
                {formData.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                        {formData.tags.map((tag, i) => (
                            <span
                                key={i}
                                className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded bg-dark-border text-gray-400"
                            >
                                {tag}
                                <button
                                    type="button"
                                    onClick={() => handleRemoveTag(tag)}
                                    className="hover:text-red-400"
                                >
                                    &times;
                                </button>
                            </span>
                        ))}
                    </div>
                )}
            </div>

            {/* Notes */}
            <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">
                    Notes
                </label>
                <textarea
                    name="notes"
                    value={formData.notes}
                    onChange={handleChange}
                    rows={3}
                    className="input w-full resize-none"
                    placeholder="Additional notes about this contact..."
                />
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-4 border-t border-dark-border">
                <button
                    type="button"
                    onClick={onCancel}
                    className="btn btn-secondary"
                    disabled={isLoading}
                >
                    Cancel
                </button>
                <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={isLoading || !formData.firstName.trim()}
                >
                    {isLoading ? 'Saving...' : (contact ? 'Update Contact' : 'Add Contact')}
                </button>
            </div>
        </form>
    );
}
