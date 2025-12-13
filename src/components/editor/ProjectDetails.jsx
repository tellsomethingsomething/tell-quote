import { useState } from 'react';
import { useQuoteStore } from '../../store/quoteStore';
import { useSettingsStore } from '../../store/settingsStore';
import { CURRENCIES } from '../../data/currencies';

export default function ProjectDetails({ onGoToSettings }) {
    const { quote, setProjectDetails, setPreparedBy, setQuoteDate, setValidityDays, setRegion, setNextFollowUpDate, setInternalNotes } = useQuoteStore();
    const [showActivityLog, setShowActivityLog] = useState(false);
    const { settings } = useSettingsStore();

    const projectTypes = settings.projectTypes || [];
    const regions = settings.regions || [];
    const { project } = quote;
    const users = settings.users || [];

    const handleChange = (field, value) => {
        setProjectDetails({ [field]: value });
    };

    return (
        <div className="card">
            <h3 className="text-sm font-semibold text-gray-300 mb-4 flex items-center gap-2">
                <svg className="w-4 h-4 text-accent-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
                </svg>
                Project Details
            </h3>

            <div className="space-y-6">
                {/* Prepared By */}
                <div>
                    <label className="label">Prepared By</label>
                    <div className="flex gap-2">
                        <select
                            value={quote.preparedBy || 'default'}
                            onChange={(e) => setPreparedBy(e.target.value)}
                            className="input flex-1"
                        >
                            <option value="default" disabled>Select User</option>
                            {users.map(user => (
                                <option key={user.id} value={user.id}>
                                    {user.name}
                                </option>
                            ))}
                        </select>
                        <button
                            className="btn-ghost px-2"
                            title="Manage Users in Settings"
                            onClick={onGoToSettings}
                        >
                            <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Quote Date & Validity */}
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="label">Quote Date</label>
                        <input
                            type="date"
                            value={quote.quoteDate}
                            onChange={(e) => setQuoteDate(e.target.value)}
                            className="input"
                        />
                    </div>
                    <div>
                        <label className="label">Valid Until</label>
                        <div className="flex gap-2">
                            <select
                                value={quote.validityDays}
                                onChange={(e) => setValidityDays(e.target.value)}
                                className="input flex-1"
                            >
                                <option value="7">7 Days</option>
                                <option value="14">14 Days</option>
                                <option value="30">30 Days</option>
                                <option value="60">60 Days</option>
                                <option value="90">90 Days</option>
                            </select>
                            <div className="flex items-center justify-center px-3 bg-dark-bg/50 border border-dark-border rounded-lg text-sm text-gray-400 min-w-[100px]">
                                {(() => {
                                    if (!quote.quoteDate) return '-';
                                    const date = new Date(quote.quoteDate);
                                    date.setDate(date.getDate() + (parseInt(quote.validityDays) || 30));
                                    return date.toLocaleDateString();
                                })()}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Project Title */}
                <div>
                    <label className="label">Project Title</label>
                    <input
                        type="text"
                        value={project.title}
                        onChange={(e) => handleChange('title', e.target.value)}
                        placeholder="e.g. Shopee Cup Semi-Final"
                        className="input"
                    />
                </div>

                {/* Project Type & Region */}
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="label">Project Type</label>
                        <select
                            value={project.type}
                            onChange={(e) => handleChange('type', e.target.value)}
                            className="input"
                        >
                            {projectTypes.map(type => (
                                <option key={type.id} value={type.id}>
                                    {type.label}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="label">Region (Rates)</label>
                        <select
                            value={quote.region || (regions[0]?.id || 'SEA')}
                            onChange={(e) => setRegion(e.target.value)}
                            className="input"
                        >
                            {regions.map(region => (
                                <option key={region.id} value={region.id}>
                                    {region.label}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Currency & Venue */}
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="label">Currency</label>
                        <select
                            value={quote.currency || 'USD'}
                            onChange={(e) => {
                                useQuoteStore.getState().setCurrency(e.target.value);
                            }}
                            className="input"
                        >
                            {Object.values(CURRENCIES).map(c => (
                                <option key={c.code} value={c.code}>
                                    {c.symbol} {c.code} - {c.name}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="label">Venue</label>
                        <input
                            type="text"
                            value={project.venue}
                            onChange={(e) => handleChange('venue', e.target.value)}
                            placeholder="e.g. Jalan Besar Stadium"
                            className="input"
                        />
                    </div>
                </div>

                {/* Start & End Dates */}
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="label">Start Date</label>
                        <input
                            type="date"
                            value={project.startDate}
                            onChange={(e) => {
                                const newStartDate = e.target.value;
                                handleChange('startDate', newStartDate);
                                // If end date is before new start date, update it
                                if (project.endDate && newStartDate > project.endDate) {
                                    handleChange('endDate', newStartDate);
                                }
                            }}
                            className="input"
                        />
                    </div>
                    <div>
                        <label className="label">End Date</label>
                        <input
                            type="date"
                            value={project.endDate}
                            onChange={(e) => handleChange('endDate', e.target.value)}
                            min={project.startDate || ''}
                            className="input"
                        />
                    </div>
                </div>

                {/* Description */}
                <div>
                    <label className="label">Description</label>
                    <textarea
                        value={project.description}
                        onChange={(e) => handleChange('description', e.target.value)}
                        placeholder="Brief project description..."
                        rows={2}
                        className="input resize-none"
                    />
                </div>

                {/* Follow-up Date */}
                <div>
                    <label className="label">
                        <span className="flex items-center gap-2">
                            <svg className="w-4 h-4 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                            </svg>
                            Follow-up Reminder
                        </span>
                    </label>
                    <input
                        type="date"
                        value={quote.nextFollowUpDate || ''}
                        onChange={(e) => setNextFollowUpDate(e.target.value || null)}
                        className="input"
                    />
                    <p className="form-helper">Set a reminder date to follow up on this quote</p>
                </div>

                {/* Internal Notes */}
                <div>
                    <label className="label">
                        <span className="flex items-center gap-2">
                            <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                            Internal Notes
                            <span className="text-xs text-gray-500 font-normal">(Not shown in PDF)</span>
                        </span>
                    </label>
                    <textarea
                        value={quote.internalNotes || ''}
                        onChange={(e) => setInternalNotes(e.target.value)}
                        placeholder="Team notes, context, reminders..."
                        rows={3}
                        className="input resize-none"
                    />
                    <p className="form-helper">Useful for handoff context between team members</p>
                </div>

                {/* Activity Log */}
                <div className="border-t border-dark-border pt-4">
                    <button
                        onClick={() => setShowActivityLog(!showActivityLog)}
                        className="w-full flex items-center justify-between text-sm text-gray-400 hover:text-gray-300 transition-colors"
                    >
                        <span className="flex items-center gap-2">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Activity Log
                            {quote.statusHistory?.length > 0 && (
                                <span className="text-xs bg-gray-700 px-1.5 py-0.5 rounded">
                                    {quote.statusHistory.length}
                                </span>
                            )}
                        </span>
                        <svg
                            className={`w-4 h-4 transition-transform ${showActivityLog ? 'rotate-180' : ''}`}
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                    </button>

                    {showActivityLog && (
                        <div className="mt-3 space-y-2 max-h-64 overflow-y-auto">
                            {(!quote.statusHistory || quote.statusHistory.length === 0) ? (
                                <p className="text-sm text-gray-500 italic">No activity recorded yet</p>
                            ) : (
                                [...quote.statusHistory].reverse().map((entry, idx) => {
                                    const user = users.find(u => u.id === entry.userId);
                                    const date = new Date(entry.timestamp);
                                    const statusColors = {
                                        draft: 'text-gray-400',
                                        sent: 'text-blue-400',
                                        under_review: 'text-amber-400',
                                        approved: 'text-emerald-400',
                                        won: 'text-green-400',
                                        rejected: 'text-red-400',
                                        expired: 'text-gray-500',
                                        dead: 'text-red-500',
                                    };

                                    return (
                                        <div
                                            key={idx}
                                            className="flex items-start gap-3 text-sm p-2 rounded bg-dark-bg/50"
                                        >
                                            <div className="w-2 h-2 rounded-full bg-gray-600 mt-1.5 shrink-0" />
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <span className="text-gray-300">Status changed to</span>
                                                    <span className={`font-semibold uppercase text-xs ${statusColors[entry.status] || 'text-gray-400'}`}>
                                                        {entry.status?.replace('_', ' ')}
                                                    </span>
                                                </div>
                                                {entry.note && (
                                                    <p className="text-gray-500 text-xs mt-1">"{entry.note}"</p>
                                                )}
                                                <div className="text-xs text-gray-600 mt-1">
                                                    {user?.name || 'System'} • {date.toLocaleDateString('en-GB', {
                                                        day: 'numeric',
                                                        month: 'short',
                                                        year: 'numeric',
                                                        hour: '2-digit',
                                                        minute: '2-digit'
                                                    })}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
