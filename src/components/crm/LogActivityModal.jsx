import { useState, useEffect } from 'react';
import { useActivityStore, ACTIVITY_TYPES } from '../../store/activityStore';
import { useAuthStore } from '../../store/authStore';

export default function LogActivityModal({
    isOpen,
    onClose,
    clientId,
    contactId = null,
    opportunityId = null,
    quoteId = null,
    contacts = [], // For contact selector
}) {
    const { addActivity } = useActivityStore();
    const { user } = useAuthStore();

    const [form, setForm] = useState({
        type: 'note',
        title: '',
        description: '',
        contactId: contactId || '',
        activityDate: new Date().toISOString().slice(0, 16), // datetime-local format
        hasFollowUp: false,
        followUpDate: '',
    });

    const [saving, setSaving] = useState(false);

    // Reset form when modal opens
    useEffect(() => {
        if (isOpen) {
            setForm({
                type: 'note',
                title: '',
                description: '',
                contactId: contactId || '',
                activityDate: new Date().toISOString().slice(0, 16),
                hasFollowUp: false,
                followUpDate: '',
            });
        }
    }, [isOpen, contactId]);

    // Handle escape key
    useEffect(() => {
        const handleEscape = (e) => {
            if (e.key === 'Escape' && isOpen) {
                onClose();
            }
        };
        window.addEventListener('keydown', handleEscape);
        return () => window.removeEventListener('keydown', handleEscape);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.title.trim()) return;

        setSaving(true);
        try {
            await addActivity({
                clientId,
                contactId: form.contactId || null,
                opportunityId,
                quoteId,
                type: form.type,
                title: form.title.trim(),
                description: form.description.trim() || null,
                activityDate: new Date(form.activityDate).toISOString(),
                followUpDate: form.hasFollowUp && form.followUpDate
                    ? new Date(form.followUpDate).toISOString()
                    : null,
                loggedBy: user?.profile?.id,
                loggedByName: user?.profile?.name || user?.email,
            });
            onClose();
        } catch (error) {
            console.error('Failed to log activity:', error);
        } finally {
            setSaving(false);
        }
    };

    // Quick templates based on type
    const getPlaceholder = (type) => {
        switch (type) {
            case 'call': return 'e.g. Discussed project timeline...';
            case 'email': return 'e.g. Sent proposal follow-up...';
            case 'meeting': return 'e.g. Kick-off meeting at their office...';
            case 'note': return 'e.g. Important context about this client...';
            case 'task': return 'e.g. Prepare revised quote...';
            case 'follow_up': return 'e.g. Check in on proposal status...';
            default: return 'Add details...';
        }
    };

    return (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/75 backdrop-blur-md modal-backdrop p-4">
            <div className="bg-dark-card border border-dark-border rounded-xl p-6 w-full max-w-lg shadow-2xl modal-content relative max-h-[90vh] overflow-y-auto">
                {/* Close button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-1 text-gray-500 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
                >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>

                <h2 className="text-xl font-bold text-gray-100 mb-1">Log Activity</h2>
                <p className="text-sm text-gray-500 mb-6">Record an interaction or note</p>

                <form onSubmit={handleSubmit} className="space-y-5">
                    {/* Activity Type */}
                    <div>
                        <label className="label">Activity Type</label>
                        <div className="grid grid-cols-5 gap-2">
                            {['call', 'email', 'meeting', 'note', 'task'].map((type) => {
                                const config = ACTIVITY_TYPES[type];
                                return (
                                    <button
                                        key={type}
                                        type="button"
                                        onClick={() => setForm({ ...form, type })}
                                        className={`p-3 rounded-lg border transition-all text-center ${
                                            form.type === type
                                                ? `${config.bgColor} ${config.color} border-current`
                                                : 'border-dark-border text-gray-400 hover:border-gray-600'
                                        }`}
                                    >
                                        <span className="text-xs font-medium">{config.label}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Title */}
                    <div>
                        <label className="label label-required">Title</label>
                        <input
                            type="text"
                            required
                            value={form.title}
                            onChange={(e) => setForm({ ...form, title: e.target.value })}
                            className="input w-full"
                            placeholder={`${ACTIVITY_TYPES[form.type].label} with client...`}
                        />
                    </div>

                    {/* Contact selector (if contacts provided) */}
                    {contacts.length > 0 && (
                        <div>
                            <label className="label">Related Contact</label>
                            <select
                                value={form.contactId}
                                onChange={(e) => setForm({ ...form, contactId: e.target.value })}
                                className="input w-full"
                            >
                                <option value="">-- General (no specific contact) --</option>
                                {contacts.map((contact) => (
                                    <option key={contact.id} value={contact.id}>
                                        {contact.name} {contact.role ? `(${contact.role})` : ''}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}

                    {/* Date/Time */}
                    <div>
                        <label className="label">Date & Time</label>
                        <input
                            type="datetime-local"
                            value={form.activityDate}
                            onChange={(e) => setForm({ ...form, activityDate: e.target.value })}
                            className="input w-full"
                        />
                    </div>

                    {/* Description */}
                    <div>
                        <label className="label">Notes / Details</label>
                        <textarea
                            value={form.description}
                            onChange={(e) => setForm({ ...form, description: e.target.value })}
                            className="input w-full min-h-[100px] resize-none"
                            placeholder={getPlaceholder(form.type)}
                        />
                    </div>

                    {/* Follow-up */}
                    <div className="border-t border-dark-border pt-4">
                        <label className="flex items-center gap-3 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={form.hasFollowUp}
                                onChange={(e) => setForm({ ...form, hasFollowUp: e.target.checked })}
                                className="w-4 h-4 rounded border-gray-600 bg-dark-bg text-accent-primary focus:ring-accent-primary"
                            />
                            <span className="text-sm text-gray-300">Set a follow-up reminder</span>
                        </label>

                        {form.hasFollowUp && (
                            <div className="mt-3">
                                <label className="label">Follow-up Date</label>
                                <input
                                    type="datetime-local"
                                    value={form.followUpDate}
                                    onChange={(e) => setForm({ ...form, followUpDate: e.target.value })}
                                    className="input w-full"
                                    min={new Date().toISOString().slice(0, 16)}
                                />
                                <p className="text-xs text-gray-500 mt-1">You'll see this in your follow-up list</p>
                            </div>
                        )}
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="btn-ghost px-4 py-2"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={saving || !form.title.trim()}
                            className="btn-primary px-4 py-2"
                        >
                            {saving ? 'Saving...' : 'Log Activity'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
