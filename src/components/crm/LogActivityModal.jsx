import { useState, useEffect } from 'react';
import { useActivityStore, ACTIVITY_TYPES, CALL_OUTCOMES, MEETING_TYPES, TASK_PRIORITIES } from '../../store/activityStore';
import { useContactStore } from '../../store/contactStore';
import logger from '../../utils/logger';

export default function LogActivityModal({
    isOpen,
    onClose,
    clientId,
    contactId = null,
    opportunityId = null,
    quoteId = null,
    contacts = [], // For contact selector
}) {
    const { addActivity, logCall, logMeeting, addNote, createTask } = useActivityStore();
    const { getFullName } = useContactStore();

    const [form, setForm] = useState({
        activityType: 'note',
        subject: '',
        description: '',
        contactId: contactId || '',
        activityDate: new Date().toISOString().slice(0, 16), // datetime-local format
        // Call specific
        callOutcome: '',
        callDirection: 'outbound',
        // Meeting specific
        meetingType: 'video',
        meetingLocation: '',
        // Task specific
        dueDate: '',
        priority: 'medium',
        // Duration
        durationMinutes: '',
    });

    const [saving, setSaving] = useState(false);

    // Reset form when modal opens
    useEffect(() => {
        if (isOpen) {
            setForm({
                activityType: 'note',
                subject: '',
                description: '',
                contactId: contactId || '',
                activityDate: new Date().toISOString().slice(0, 16),
                callOutcome: '',
                callDirection: 'outbound',
                meetingType: 'video',
                meetingLocation: '',
                dueDate: '',
                priority: 'medium',
                durationMinutes: '',
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
        if (!form.subject.trim()) return;

        setSaving(true);
        try {
            const baseData = {
                clientId,
                contactId: form.contactId || null,
                opportunityId,
                quoteId,
                subject: form.subject.trim(),
                description: form.description.trim() || null,
                activityDate: new Date(form.activityDate).toISOString(),
                durationMinutes: form.durationMinutes ? parseInt(form.durationMinutes) : null,
            };

            if (form.activityType === 'call') {
                await logCall({
                    ...baseData,
                    callOutcome: form.callOutcome || null,
                    callDirection: form.callDirection,
                });
            } else if (form.activityType === 'meeting') {
                await logMeeting({
                    ...baseData,
                    meetingType: form.meetingType,
                    meetingLocation: form.meetingLocation || null,
                });
            } else if (form.activityType === 'task') {
                await createTask({
                    ...baseData,
                    dueDate: form.dueDate ? new Date(form.dueDate).toISOString() : null,
                    priority: form.priority,
                });
            } else {
                await addNote(baseData);
            }
            onClose();
        } catch (error) {
            logger.error('Failed to log activity:', error);
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
            default: return 'Add details...';
        }
    };

    return (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/75 backdrop-blur-md modal-backdrop p-4">
            <div className="bg-[#1a1f2e] border border-dark-border rounded-xl p-6 w-full max-w-lg shadow-2xl modal-content relative max-h-[90vh] overflow-y-auto">
                {/* Close button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 btn-icon text-gray-500 hover:text-white"
                    aria-label="Close modal"
                >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
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
                                        onClick={() => setForm({ ...form, activityType: type })}
                                        className={`p-3 rounded-lg border transition-all text-center ${
                                            form.activityType === type
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

                    {/* Subject */}
                    <div>
                        <label className="label label-required">Subject</label>
                        <input
                            type="text"
                            required
                            autoFocus
                            value={form.subject}
                            onChange={(e) => setForm({ ...form, subject: e.target.value })}
                            className="input w-full"
                            placeholder={`${ACTIVITY_TYPES[form.activityType]?.label || 'Activity'} with client...`}
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
                            placeholder={getPlaceholder(form.activityType)}
                        />
                    </div>

                    {/* Call-specific fields */}
                    {form.activityType === 'call' && (
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="label">Call Direction</label>
                                <select
                                    value={form.callDirection}
                                    onChange={(e) => setForm({ ...form, callDirection: e.target.value })}
                                    className="input w-full"
                                >
                                    <option value="outbound">Outbound</option>
                                    <option value="inbound">Inbound</option>
                                </select>
                            </div>
                            <div>
                                <label className="label">Outcome</label>
                                <select
                                    value={form.callOutcome}
                                    onChange={(e) => setForm({ ...form, callOutcome: e.target.value })}
                                    className="input w-full"
                                >
                                    <option value="">Select outcome...</option>
                                    {CALL_OUTCOMES.map(outcome => (
                                        <option key={outcome.id} value={outcome.id}>{outcome.label}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    )}

                    {/* Meeting-specific fields */}
                    {form.activityType === 'meeting' && (
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="label">Meeting Type</label>
                                <select
                                    value={form.meetingType}
                                    onChange={(e) => setForm({ ...form, meetingType: e.target.value })}
                                    className="input w-full"
                                >
                                    {MEETING_TYPES.map(type => (
                                        <option key={type.id} value={type.id}>{type.label}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="label">Location</label>
                                <input
                                    type="text"
                                    value={form.meetingLocation}
                                    onChange={(e) => setForm({ ...form, meetingLocation: e.target.value })}
                                    className="input w-full"
                                    placeholder="Office, Zoom link, etc."
                                />
                            </div>
                        </div>
                    )}

                    {/* Task-specific fields */}
                    {form.activityType === 'task' && (
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="label">Due Date</label>
                                <input
                                    type="datetime-local"
                                    value={form.dueDate}
                                    onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                                    className="input w-full"
                                />
                            </div>
                            <div>
                                <label className="label">Priority</label>
                                <select
                                    value={form.priority}
                                    onChange={(e) => setForm({ ...form, priority: e.target.value })}
                                    className="input w-full"
                                >
                                    {TASK_PRIORITIES.map(p => (
                                        <option key={p.id} value={p.id}>{p.label}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    )}

                    {/* Duration (for calls and meetings) */}
                    {(form.activityType === 'call' || form.activityType === 'meeting') && (
                        <div>
                            <label className="label">Duration (minutes)</label>
                            <input
                                type="number"
                                value={form.durationMinutes}
                                onChange={(e) => setForm({ ...form, durationMinutes: e.target.value })}
                                className="input w-full"
                                placeholder="e.g. 30"
                                min="1"
                            />
                        </div>
                    )}

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
                            disabled={saving || !form.subject.trim()}
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
