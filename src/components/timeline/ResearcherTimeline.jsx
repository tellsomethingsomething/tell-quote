import React, { useState, useMemo } from 'react';
import { useTimelineStore, EVENT_TYPES, EVENT_CONFIGS } from '../../store/timelineStore';

// Icon component for timeline events
function EventIcon({ type }) {
    const config = EVENT_CONFIGS[type] || EVENT_CONFIGS[EVENT_TYPES.RESEARCH_FINDING];

    const iconPaths = {
        search: 'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z',
        'trending-up': 'M13 7h8m0 0v8m0-8l-8 8-4-4-6 6',
        users: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z',
        lightbulb: 'M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z',
        trophy: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z',
        'x-circle': 'M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z',
        send: 'M12 19l9 2-9-18-9 18 9-2zm0 0v-8',
        'check-circle': 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
        'book-open': 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253',
        brain: 'M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z',
        'message-circle': 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z',
        cpu: 'M9 3v2m6-2v2M9 19v2m6-2v2M3 9h2m-2 6h2m14-6h2m-2 6h2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z',
    };

    return (
        <div className={`w-8 h-8 rounded-lg ${config.bgColor} flex items-center justify-center flex-shrink-0`}>
            <svg className={`w-4 h-4 ${config.color}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={iconPaths[config.icon] || iconPaths.search} />
            </svg>
        </div>
    );
}

// Individual timeline event card
function TimelineEventCard({ event, onExpand }) {
    const config = EVENT_CONFIGS[event.type] || EVENT_CONFIGS[EVENT_TYPES.RESEARCH_FINDING];
    const [expanded, setExpanded] = useState(false);

    const formattedDate = new Date(event.timestamp).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    });

    const formattedTime = new Date(event.timestamp).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
    });

    return (
        <div className={`relative pl-10 pb-6 group`}>
            {/* Timeline line */}
            <div className="absolute left-[15px] top-8 bottom-0 w-px bg-gray-700 group-last:hidden" />

            {/* Event icon */}
            <div className="absolute left-0 top-0">
                <EventIcon type={event.type} />
            </div>

            {/* Event content */}
            <div
                className={`card ${config.bgColor} ${config.borderColor} border hover:border-white/20 transition-all cursor-pointer`}
                onClick={() => setExpanded(!expanded)}
            >
                <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                            <span className={`text-[10px] font-medium ${config.color} uppercase tracking-wide`}>
                                {config.label}
                            </span>
                            {event.verified && (
                                <span className="text-[9px] bg-green-500/20 text-green-400 px-1.5 py-0.5 rounded">
                                    Verified
                                </span>
                            )}
                            {event.agentName && (
                                <span className="text-[9px] bg-gray-700/50 text-gray-400 px-1.5 py-0.5 rounded">
                                    {event.agentName}
                                </span>
                            )}
                        </div>
                        <h4 className="text-sm font-medium text-gray-200 truncate">{event.title}</h4>
                    </div>
                    <div className="text-right flex-shrink-0">
                        <p className="text-xs text-gray-500">{formattedDate}</p>
                        <p className="text-[10px] text-gray-600">{formattedTime}</p>
                    </div>
                </div>

                {/* Description (always visible, truncated) */}
                {event.description && (
                    <p className={`text-xs text-gray-400 ${expanded ? '' : 'line-clamp-2'}`}>
                        {event.description}
                    </p>
                )}

                {/* Tags */}
                {event.tags && event.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                        {event.tags.slice(0, expanded ? undefined : 3).map((tag, i) => (
                            <span key={i} className="text-[10px] bg-gray-800/50 text-gray-400 px-1.5 py-0.5 rounded">
                                {tag}
                            </span>
                        ))}
                        {!expanded && event.tags.length > 3 && (
                            <span className="text-[10px] text-gray-500">+{event.tags.length - 3} more</span>
                        )}
                    </div>
                )}

                {/* Expanded details */}
                {expanded && (
                    <div className="mt-3 pt-3 border-t border-gray-700/50 space-y-2">
                        {event.confidence !== undefined && (
                            <div className="flex items-center justify-between text-xs">
                                <span className="text-gray-500">Confidence</span>
                                <div className="flex items-center gap-2">
                                    <div className="w-20 h-1.5 bg-gray-700 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-gradient-to-r from-amber-500 to-green-500 rounded-full"
                                            style={{ width: `${(event.confidence || 0) * 100}%` }}
                                        />
                                    </div>
                                    <span className="text-gray-400">{((event.confidence || 0) * 100).toFixed(0)}%</span>
                                </div>
                            </div>
                        )}

                        {event.relevanceScore !== undefined && (
                            <div className="flex items-center justify-between text-xs">
                                <span className="text-gray-500">Relevance</span>
                                <span className="text-gray-400">{((event.relevanceScore || 0) * 100).toFixed(0)}%</span>
                            </div>
                        )}

                        {event.region && (
                            <div className="flex items-center justify-between text-xs">
                                <span className="text-gray-500">Region</span>
                                <span className="text-gray-400">{event.region}</span>
                            </div>
                        )}

                        {event.sourceUrls && event.sourceUrls.length > 0 && (
                            <div className="space-y-1">
                                <span className="text-xs text-gray-500">Sources</span>
                                {event.sourceUrls.map((url, i) => (
                                    <a
                                        key={i}
                                        href={url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="block text-xs text-blue-400 hover:text-blue-300 truncate"
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        {url}
                                    </a>
                                ))}
                            </div>
                        )}

                        {event.metadata?.recommendedAction && (
                            <div className="mt-2 p-2 bg-violet-500/10 rounded-lg">
                                <p className="text-[10px] text-violet-400 uppercase tracking-wide mb-1">Recommended Action</p>
                                <p className="text-xs text-gray-300">{event.metadata.recommendedAction}</p>
                            </div>
                        )}
                    </div>
                )}

                {/* Expand indicator */}
                <div className="flex justify-center mt-2">
                    <svg
                        className={`w-4 h-4 text-gray-500 transition-transform ${expanded ? 'rotate-180' : ''}`}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                </div>
            </div>
        </div>
    );
}

// Add Research Finding Form
function AddResearchForm({ onClose, onSubmit }) {
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        organization: '',
        country: '',
        region: '',
        opportunityType: 'streaming',
        urgency: 5,
        budgetRange: '',
        recommendedAction: '',
        sourceUrls: '',
        tags: '',
    });

    const handleSubmit = async (e) => {
        e.preventDefault();
        await onSubmit({
            ...formData,
            type: 'research_findings',
            sourceUrls: formData.sourceUrls.split('\n').filter(Boolean),
            tags: formData.tags.split(',').map(t => t.trim()).filter(Boolean),
        });
        onClose();
    };

    return (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/75 backdrop-blur-md p-4">
            <div className="bg-dark-card border border-dark-border rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
                <div className="sticky top-0 bg-dark-card border-b border-dark-border p-4 flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-100">Add Research Finding</h3>
                    <button onClick={onClose} className="p-2 text-gray-400 hover:text-white">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-4 space-y-4">
                    <div>
                        <label className="label label-required">Title</label>
                        <input
                            type="text"
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            className="input"
                            placeholder="e.g., Thai League Broadcast Tender"
                            required
                        />
                    </div>

                    <div>
                        <label className="label label-required">Description</label>
                        <textarea
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            className="input resize-none"
                            rows={3}
                            placeholder="Detailed description of the finding..."
                            required
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="label">Organization</label>
                            <input
                                type="text"
                                value={formData.organization}
                                onChange={(e) => setFormData({ ...formData, organization: e.target.value })}
                                className="input"
                                placeholder="e.g., Thai Football League"
                            />
                        </div>
                        <div>
                            <label className="label">Country</label>
                            <input
                                type="text"
                                value={formData.country}
                                onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                                className="input"
                                placeholder="e.g., Thailand"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="label">Region</label>
                            <select
                                value={formData.region}
                                onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                                className="input"
                            >
                                <option value="">Select region...</option>
                                <option value="SEA">SEA</option>
                                <option value="GCC">GCC</option>
                                <option value="Central Asia">Central Asia</option>
                                <option value="Europe">Europe</option>
                                <option value="Africa">Africa</option>
                            </select>
                        </div>
                        <div>
                            <label className="label">Opportunity Type</label>
                            <select
                                value={formData.opportunityType}
                                onChange={(e) => setFormData({ ...formData, opportunityType: e.target.value })}
                                className="input"
                            >
                                <option value="streaming">Streaming</option>
                                <option value="production">Production</option>
                                <option value="consultancy">Consultancy</option>
                                <option value="broadcast">Broadcast</option>
                                <option value="graphics">Graphics</option>
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="label">Urgency (1-10)</label>
                            <input
                                type="number"
                                min="1"
                                max="10"
                                value={formData.urgency}
                                onChange={(e) => setFormData({ ...formData, urgency: parseInt(e.target.value) })}
                                className="input"
                            />
                        </div>
                        <div>
                            <label className="label">Budget Range</label>
                            <input
                                type="text"
                                value={formData.budgetRange}
                                onChange={(e) => setFormData({ ...formData, budgetRange: e.target.value })}
                                className="input"
                                placeholder="e.g., $50k-100k"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="label">Recommended Action</label>
                        <textarea
                            value={formData.recommendedAction}
                            onChange={(e) => setFormData({ ...formData, recommendedAction: e.target.value })}
                            className="input resize-none"
                            rows={2}
                            placeholder="What should we do with this information?"
                        />
                    </div>

                    <div>
                        <label className="label">Source URLs (one per line)</label>
                        <textarea
                            value={formData.sourceUrls}
                            onChange={(e) => setFormData({ ...formData, sourceUrls: e.target.value })}
                            className="input resize-none font-mono text-xs"
                            rows={2}
                            placeholder="https://example.com/article"
                        />
                    </div>

                    <div>
                        <label className="label">Tags (comma-separated)</label>
                        <input
                            type="text"
                            value={formData.tags}
                            onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                            className="input"
                            placeholder="e.g., thailand, football, streaming"
                        />
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-dark-border">
                        <button type="button" onClick={onClose} className="btn-ghost">
                            Cancel
                        </button>
                        <button type="submit" className="btn-primary">
                            Add Finding
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// Main Timeline Component
export default function ResearcherTimeline() {
    const {
        events,
        loading,
        error,
        filters,
        setFilters,
        clearFilters,
        getFilteredEvents,
        getStats,
        addResearchFinding,
    } = useTimelineStore();

    const [showAddForm, setShowAddForm] = useState(false);
    const [selectedTypes, setSelectedTypes] = useState([]);

    const filteredEvents = useMemo(() => getFilteredEvents(), [events, filters]);
    const stats = useMemo(() => getStats(), [events]);

    // Group events by date
    const eventsByDate = useMemo(() => {
        const grouped = {};
        filteredEvents.forEach(event => {
            const date = new Date(event.timestamp).toISOString().split('T')[0];
            if (!grouped[date]) {
                grouped[date] = [];
            }
            grouped[date].push(event);
        });
        return grouped;
    }, [filteredEvents]);

    const dateKeys = Object.keys(eventsByDate).sort((a, b) => new Date(b) - new Date(a));

    const handleTypeToggle = (type) => {
        const newTypes = selectedTypes.includes(type)
            ? selectedTypes.filter(t => t !== type)
            : [...selectedTypes, type];
        setSelectedTypes(newTypes);
        setFilters({ types: newTypes });
    };

    const handleSearchChange = (e) => {
        setFilters({ searchQuery: e.target.value });
    };

    const formatDateHeader = (dateStr) => {
        const date = new Date(dateStr);
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        if (dateStr === today.toISOString().split('T')[0]) {
            return 'Today';
        } else if (dateStr === yesterday.toISOString().split('T')[0]) {
            return 'Yesterday';
        } else {
            return date.toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
                year: 'numeric',
            });
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-400"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-lg font-semibold text-gray-100">Research Timeline</h2>
                    <p className="text-sm text-gray-500">
                        {stats.total} events total, {stats.thisWeek} this week
                    </p>
                </div>
                <button
                    onClick={() => setShowAddForm(true)}
                    className="btn-primary flex items-center gap-2"
                >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Add Finding
                </button>
            </div>

            {/* Filters */}
            <div className="card bg-dark-card p-4 space-y-3">
                {/* Search */}
                <div className="relative">
                    <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <input
                        type="text"
                        value={filters.searchQuery}
                        onChange={handleSearchChange}
                        className="input pl-10"
                        placeholder="Search events..."
                    />
                </div>

                {/* Type filters */}
                <div className="flex flex-wrap gap-2">
                    {Object.entries(EVENT_CONFIGS).slice(0, 6).map(([type, config]) => (
                        <button
                            key={type}
                            onClick={() => handleTypeToggle(type)}
                            className={`text-xs px-2 py-1 rounded-lg border transition-colors ${
                                selectedTypes.includes(type)
                                    ? `${config.bgColor} ${config.borderColor} ${config.color}`
                                    : 'bg-gray-800/50 border-gray-700 text-gray-400 hover:border-gray-600'
                            }`}
                        >
                            {config.label}
                        </button>
                    ))}
                    {selectedTypes.length > 0 && (
                        <button
                            onClick={() => {
                                setSelectedTypes([]);
                                clearFilters();
                            }}
                            className="text-xs px-2 py-1 text-gray-500 hover:text-gray-300"
                        >
                            Clear
                        </button>
                    )}
                </div>
            </div>

            {/* Timeline */}
            {error && (
                <div className="card bg-red-500/10 border-red-500/30 p-4 text-sm text-red-400">
                    {error}
                </div>
            )}

            {dateKeys.length === 0 ? (
                <div className="card bg-dark-card text-center py-12">
                    <svg className="w-12 h-12 mx-auto text-gray-600 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <h3 className="text-gray-400 font-medium mb-2">No Research Events Yet</h3>
                    <p className="text-sm text-gray-500 mb-4">
                        Start adding research findings to build your intelligence timeline
                    </p>
                    <button
                        onClick={() => setShowAddForm(true)}
                        className="btn-primary"
                    >
                        Add First Finding
                    </button>
                </div>
            ) : (
                <div className="space-y-6">
                    {dateKeys.map((date) => (
                        <div key={date}>
                            <div className="flex items-center gap-3 mb-4">
                                <h3 className="text-sm font-medium text-gray-400">{formatDateHeader(date)}</h3>
                                <div className="flex-1 h-px bg-gray-800" />
                                <span className="text-xs text-gray-600">{eventsByDate[date].length} events</span>
                            </div>
                            <div className="space-y-0">
                                {eventsByDate[date].map((event) => (
                                    <TimelineEventCard key={event.id} event={event} />
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Add Form Modal */}
            {showAddForm && (
                <AddResearchForm
                    onClose={() => setShowAddForm(false)}
                    onSubmit={addResearchFinding}
                />
            )}
        </div>
    );
}
