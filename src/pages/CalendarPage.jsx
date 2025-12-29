import React, { useState, useEffect, useMemo } from 'react';
import {
    Calendar as CalendarIcon,
    ChevronLeft,
    ChevronRight,
    Plus,
    MoreVertical,
    Clock,
    MapPin,
    Users,
    Edit2,
    Trash2,
    RefreshCw,
    Link2,
    X,
    Save,
    AlertCircle,
    CheckCircle,
    Video,
} from 'lucide-react';
import {
    useCalendarStore,
    EVENT_TYPES,
    EVENT_STATUS,
    formatEventTime,
    formatEventDate,
    getEventDuration,
} from '../store/calendarStore';
import { useOpportunityStore } from '../store/opportunityStore';
import { useClientStore } from '../store/clientStore';

// Calendar Grid Component
function CalendarGrid({ currentDate, events, onDateSelect, selectedDate }) {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startPadding = firstDay.getDay();
    const totalDays = lastDay.getDate();

    const days = [];

    // Add padding for previous month
    for (let i = 0; i < startPadding; i++) {
        const prevDate = new Date(year, month, -startPadding + i + 1);
        days.push({ date: prevDate, isCurrentMonth: false });
    }

    // Add days of current month
    for (let i = 1; i <= totalDays; i++) {
        days.push({ date: new Date(year, month, i), isCurrentMonth: true });
    }

    // Add padding for next month
    const remaining = 42 - days.length;
    for (let i = 1; i <= remaining; i++) {
        days.push({ date: new Date(year, month + 1, i), isCurrentMonth: false });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const getEventsForDate = (date) => {
        const dateStr = date.toISOString().split('T')[0];
        return events.filter(e => {
            const eventDate = new Date(e.start_time).toISOString().split('T')[0];
            return eventDate === dateStr;
        });
    };

    return (
        <div className="grid grid-cols-7 gap-px bg-dark-border rounded-lg overflow-hidden">
            {/* Day headers */}
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="bg-dark-card p-2 text-center text-xs font-medium text-gray-400">
                    {day}
                </div>
            ))}

            {/* Days */}
            {days.map(({ date, isCurrentMonth }, index) => {
                const dayEvents = getEventsForDate(date);
                const isToday = date.getTime() === today.getTime();
                const isSelected = selectedDate &&
                    date.toISOString().split('T')[0] === selectedDate.toISOString().split('T')[0];

                return (
                    <button
                        key={index}
                        onClick={() => onDateSelect(date)}
                        className={`min-h-[100px] p-2 text-left transition-colors ${
                            isCurrentMonth ? 'bg-dark-card' : 'bg-dark-bg'
                        } ${isSelected ? 'ring-2 ring-brand-primary ring-inset' : ''} hover:bg-dark-nav`}
                    >
                        <div className={`text-sm font-medium mb-1 ${
                            isToday ? 'w-6 h-6 rounded-full bg-brand-primary text-white flex items-center justify-center' :
                            isCurrentMonth ? 'text-gray-300' : 'text-gray-600'
                        }`}>
                            {date.getDate()}
                        </div>

                        <div className="space-y-1">
                            {dayEvents.slice(0, 3).map(event => {
                                const typeConfig = EVENT_TYPES[event.event_type] || EVENT_TYPES.meeting;
                                return (
                                    <div
                                        key={event.id}
                                        className={`text-[10px] px-1 py-0.5 rounded truncate ${typeConfig.color} bg-dark-bg`}
                                        title={event.title}
                                    >
                                        {event.title}
                                    </div>
                                );
                            })}
                            {dayEvents.length > 3 && (
                                <div className="text-[10px] text-gray-500">
                                    +{dayEvents.length - 3} more
                                </div>
                            )}
                        </div>
                    </button>
                );
            })}
        </div>
    );
}

// Event Card Component
function EventCard({ event, onEdit, onDelete }) {
    const [showMenu, setShowMenu] = useState(false);
    const typeConfig = EVENT_TYPES[event.event_type] || EVENT_TYPES.meeting;
    const statusConfig = EVENT_STATUS[event.status] || EVENT_STATUS.confirmed;

    return (
        <div className={`p-3 rounded-lg border border-dark-border bg-dark-card hover:border-gray-600 transition-colors`}>
            <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                    <span className="text-lg">{typeConfig.icon}</span>
                    <div>
                        <h4 className="font-medium text-white">{event.title}</h4>
                        <p className={`text-xs ${statusConfig.color}`}>{statusConfig.label}</p>
                    </div>
                </div>

                <div className="relative">
                    <button
                        onClick={() => setShowMenu(!showMenu)}
                        className="p-1 text-gray-400 hover:text-white rounded transition-colors"
                    >
                        <MoreVertical className="w-4 h-4" />
                    </button>

                    {showMenu && (
                        <>
                            <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
                            <div className="absolute right-0 mt-1 w-32 bg-dark-nav border border-dark-border rounded-lg shadow-xl z-20 py-1">
                                <button
                                    onClick={() => { onEdit(event); setShowMenu(false); }}
                                    className="w-full px-3 py-2 text-left text-sm text-gray-300 hover:bg-dark-card flex items-center gap-2"
                                >
                                    <Edit2 className="w-4 h-4" />
                                    Edit
                                </button>
                                <button
                                    onClick={() => { onDelete(event); setShowMenu(false); }}
                                    className="w-full px-3 py-2 text-left text-sm text-red-400 hover:bg-dark-card flex items-center gap-2"
                                >
                                    <Trash2 className="w-4 h-4" />
                                    Delete
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>

            <div className="space-y-1.5 text-sm text-gray-400">
                <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    <span>{formatEventTime(event.start_time, event.end_time, event.all_day)}</span>
                    <span className="text-gray-600">({getEventDuration(event.start_time, event.end_time)})</span>
                </div>

                {event.location && (
                    <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4" />
                        <span>{event.location}</span>
                    </div>
                )}

                {event.attendees?.length > 0 && (
                    <div className="flex items-center gap-2">
                        <Users className="w-4 h-4" />
                        <span>{event.attendees.length} attendee{event.attendees.length !== 1 ? 's' : ''}</span>
                    </div>
                )}

                {event.metadata?.onlineMeetingUrl && (
                    <a
                        href={event.metadata.onlineMeetingUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-brand-primary hover:underline"
                    >
                        <Video className="w-4 h-4" />
                        Join meeting
                    </a>
                )}
            </div>
        </div>
    );
}

// Event Editor Modal
function EventEditor({ event, onClose, onSave }) {
    const { opportunities } = useOpportunityStore();
    const { clients } = useClientStore();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState(null);

    const [formData, setFormData] = useState({
        title: event?.title || '',
        description: event?.description || '',
        start_time: event?.start_time ? new Date(event.start_time).toISOString().slice(0, 16) : '',
        end_time: event?.end_time ? new Date(event.end_time).toISOString().slice(0, 16) : '',
        location: event?.location || '',
        event_type: event?.event_type || 'meeting',
        status: event?.status || 'confirmed',
        all_day: event?.all_day || false,
        opportunity_id: event?.opportunity_id || '',
        client_id: event?.client_id || '',
        reminder_minutes: event?.reminder_minutes || 15,
    });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);

        if (!formData.title.trim()) {
            setError('Title is required');
            return;
        }

        if (!formData.start_time || !formData.end_time) {
            setError('Start and end time are required');
            return;
        }

        setIsSubmitting(true);

        try {
            await onSave({
                ...formData,
                start_time: new Date(formData.start_time).toISOString(),
                end_time: new Date(formData.end_time).toISOString(),
                opportunity_id: formData.opportunity_id || null,
                client_id: formData.client_id || null,
            });
            onClose();
        } catch (err) {
            setError(err.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-dark-card border border-dark-border rounded-lg w-full max-w-lg">
                <div className="flex items-center justify-between px-6 py-4 border-b border-dark-border">
                    <h2 className="text-lg font-semibold text-white">
                        {event ? 'Edit Event' : 'New Event'}
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 text-gray-400 hover:text-white transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {error && (
                        <div className="flex items-center gap-2 px-4 py-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400">
                            <AlertCircle className="w-5 h-5" />
                            <span>{error}</span>
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Title *</label>
                        <input
                            type="text"
                            value={formData.title}
                            onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                            placeholder="Event title"
                            className="w-full px-4 py-2 bg-dark-bg border border-dark-border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-brand-primary"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1">Start *</label>
                            <input
                                type="datetime-local"
                                value={formData.start_time}
                                onChange={(e) => setFormData(prev => ({ ...prev, start_time: e.target.value }))}
                                className="w-full px-4 py-2 bg-dark-bg border border-dark-border rounded-lg text-white focus:outline-none focus:border-brand-primary"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1">End *</label>
                            <input
                                type="datetime-local"
                                value={formData.end_time}
                                onChange={(e) => setFormData(prev => ({ ...prev, end_time: e.target.value }))}
                                className="w-full px-4 py-2 bg-dark-bg border border-dark-border rounded-lg text-white focus:outline-none focus:border-brand-primary"
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            id="all_day"
                            checked={formData.all_day}
                            onChange={(e) => setFormData(prev => ({ ...prev, all_day: e.target.checked }))}
                            className="w-4 h-4 rounded border-dark-border bg-dark-bg text-brand-primary focus:ring-brand-primary"
                        />
                        <label htmlFor="all_day" className="text-sm text-gray-300">All day event</label>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1">Type</label>
                            <select
                                value={formData.event_type}
                                onChange={(e) => setFormData(prev => ({ ...prev, event_type: e.target.value }))}
                                className="w-full px-4 py-2 bg-dark-bg border border-dark-border rounded-lg text-white focus:outline-none focus:border-brand-primary"
                            >
                                {Object.entries(EVENT_TYPES).map(([key, config]) => (
                                    <option key={key} value={key}>{config.icon} {config.label}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1">Status</label>
                            <select
                                value={formData.status}
                                onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
                                className="w-full px-4 py-2 bg-dark-bg border border-dark-border rounded-lg text-white focus:outline-none focus:border-brand-primary"
                            >
                                {Object.entries(EVENT_STATUS).map(([key, config]) => (
                                    <option key={key} value={key}>{config.label}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Location</label>
                        <input
                            type="text"
                            value={formData.location}
                            onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                            placeholder="Event location or meeting link"
                            className="w-full px-4 py-2 bg-dark-bg border border-dark-border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-brand-primary"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Description</label>
                        <textarea
                            value={formData.description}
                            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                            placeholder="Event description"
                            rows={3}
                            className="w-full px-4 py-2 bg-dark-bg border border-dark-border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-brand-primary resize-none"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1">Link to Opportunity</label>
                            <select
                                value={formData.opportunity_id}
                                onChange={(e) => setFormData(prev => ({ ...prev, opportunity_id: e.target.value }))}
                                className="w-full px-4 py-2 bg-dark-bg border border-dark-border rounded-lg text-white focus:outline-none focus:border-brand-primary"
                            >
                                <option value="">None</option>
                                {opportunities.map(opp => (
                                    <option key={opp.id} value={opp.id}>{opp.name}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1">Link to Client</label>
                            <select
                                value={formData.client_id}
                                onChange={(e) => setFormData(prev => ({ ...prev, client_id: e.target.value }))}
                                className="w-full px-4 py-2 bg-dark-bg border border-dark-border rounded-lg text-white focus:outline-none focus:border-brand-primary"
                            >
                                <option value="">None</option>
                                {clients.map(client => (
                                    <option key={client.id} value={client.id}>{client.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-dark-border">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="flex items-center gap-2 px-4 py-2 bg-brand-primary text-white rounded-lg hover:bg-brand-primary/90 transition-colors disabled:opacity-50"
                        >
                            {isSubmitting ? (
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <Save className="w-4 h-4" />
                            )}
                            {event ? 'Save Changes' : 'Create Event'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// Microsoft Connection Panel
// Single provider connection card
function ProviderConnectionCard({ provider, status, lastSync, isSyncing, onConnect, onDisconnect, onSync }) {
    const formatLastSync = (date) => {
        if (!date) return 'Never';
        return new Date(date).toLocaleString();
    };

    const isConnected = status === 'connected';
    const isMicrosoft = provider === 'microsoft';

    return (
        <div className="bg-dark-card border border-dark-border rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        isMicrosoft ? 'bg-[#00A4EF]/20' : 'bg-[#4285F4]/20'
                    }`}>
                        {isMicrosoft ? (
                            <svg className="w-5 h-5" viewBox="0 0 23 23" fill="none">
                                <path d="M11 11H0V0h11v11z" fill="#F25022"/>
                                <path d="M23 11H12V0h11v11z" fill="#7FBA00"/>
                                <path d="M11 23H0V12h11v11z" fill="#00A4EF"/>
                                <path d="M23 23H12V12h11v11z" fill="#FFB900"/>
                            </svg>
                        ) : (
                            <svg className="w-5 h-5" viewBox="0 0 24 24">
                                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                            </svg>
                        )}
                    </div>
                    <div>
                        <h3 className="font-medium text-white">
                            {isMicrosoft ? 'Microsoft' : 'Google'} Calendar
                        </h3>
                        <p className="text-xs text-gray-400">
                            {status === 'connected' ? 'Connected' :
                             status === 'syncing' ? 'Syncing...' :
                             status === 'error' ? 'Connection error' :
                             'Not connected'}
                        </p>
                    </div>
                </div>

                {isConnected && (
                    <div className="flex items-center gap-1 px-2 py-1 bg-green-500/20 text-green-400 rounded text-xs">
                        <CheckCircle className="w-3 h-3" />
                        Connected
                    </div>
                )}
            </div>

            {isConnected && (
                <div className="text-xs text-gray-500 mb-3">
                    Last synced: {formatLastSync(lastSync)}
                </div>
            )}

            <div className="flex gap-2">
                {isConnected ? (
                    <>
                        <button
                            onClick={onSync}
                            disabled={isSyncing}
                            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-dark-bg border border-dark-border rounded-lg text-white hover:bg-dark-nav transition-colors disabled:opacity-50"
                        >
                            <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
                            {isSyncing ? 'Syncing...' : 'Sync Now'}
                        </button>
                        <button
                            onClick={onDisconnect}
                            className="px-3 py-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                        >
                            Disconnect
                        </button>
                    </>
                ) : (
                    <button
                        onClick={onConnect}
                        className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 text-white rounded-lg transition-colors ${
                            isMicrosoft ? 'bg-[#00A4EF] hover:bg-[#00A4EF]/90' : 'bg-[#4285F4] hover:bg-[#4285F4]/90'
                        }`}
                    >
                        <Link2 className="w-4 h-4" />
                        Connect {isMicrosoft ? 'Microsoft' : 'Google'} Calendar
                    </button>
                )}
            </div>
        </div>
    );
}

// Calendar Connections Panel - shows both Microsoft and Google
function CalendarConnectionsPanel() {
    const {
        msSyncStatus,
        googleSyncStatus,
        lastSyncAt,
        isSyncing,
        connectMicrosoft,
        disconnectMicrosoft,
        syncFromMicrosoft,
        connectGoogle,
        disconnectGoogle,
        syncFromGoogle,
    } = useCalendarStore();

    return (
        <div className="space-y-3">
            <h3 className="text-sm font-medium text-gray-400 px-1">Calendar Sync</h3>
            <ProviderConnectionCard
                provider="microsoft"
                status={msSyncStatus}
                lastSync={lastSyncAt}
                isSyncing={isSyncing}
                onConnect={connectMicrosoft}
                onDisconnect={disconnectMicrosoft}
                onSync={syncFromMicrosoft}
            />
            <ProviderConnectionCard
                provider="google"
                status={googleSyncStatus}
                lastSync={lastSyncAt}
                isSyncing={isSyncing}
                onConnect={connectGoogle}
                onDisconnect={disconnectGoogle}
                onSync={syncFromGoogle}
            />
        </div>
    );
}

// Main Calendar Page
export default function CalendarPage() {
    const {
        events,
        isLoading,
        selectedDate,
        viewMode,
        loadEvents,
        createEvent,
        updateEvent,
        deleteEvent,
        setSelectedDate,
        setViewMode,
        getEventsForDate,
        initialize,
    } = useCalendarStore();

    const [currentDate, setCurrentDate] = useState(new Date());
    const [showEditor, setShowEditor] = useState(false);
    const [editingEvent, setEditingEvent] = useState(null);
    const [deleteConfirm, setDeleteConfirm] = useState(null);

    useEffect(() => {
        initialize();
    }, []);

    const navigateMonth = (direction) => {
        setCurrentDate(prev => {
            const next = new Date(prev);
            next.setMonth(next.getMonth() + direction);
            return next;
        });
    };

    const goToToday = () => {
        const today = new Date();
        setCurrentDate(today);
        setSelectedDate(today);
    };

    const selectedDateEvents = useMemo(() => {
        if (!selectedDate) return [];
        return getEventsForDate(selectedDate);
    }, [selectedDate, events]);

    const handleEdit = (event) => {
        setEditingEvent(event);
        setShowEditor(true);
    };

    const handleDelete = (event) => {
        setDeleteConfirm(event);
    };

    const confirmDelete = async () => {
        if (deleteConfirm) {
            await deleteEvent(deleteConfirm.id);
            setDeleteConfirm(null);
        }
    };

    const handleSaveEvent = async (eventData) => {
        if (editingEvent) {
            await updateEvent(editingEvent.id, eventData);
        } else {
            await createEvent(eventData);
        }
    };

    const monthYear = currentDate.toLocaleDateString('en-US', {
        month: 'long',
        year: 'numeric',
    });

    return (
        <div className="p-6 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-semibold text-white">Calendar</h1>
                    <p className="text-gray-400 mt-1">Manage events and sync with Microsoft</p>
                </div>

                <button
                    onClick={() => { setEditingEvent(null); setShowEditor(true); }}
                    className="flex items-center gap-2 px-4 py-2 bg-brand-primary text-white rounded-lg hover:bg-brand-primary/90 transition-colors"
                >
                    <Plus className="w-4 h-4" />
                    New Event
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Main Calendar */}
                <div className="lg:col-span-3">
                    <div className="bg-dark-card border border-dark-border rounded-lg">
                        {/* Calendar Header */}
                        <div className="flex items-center justify-between p-4 border-b border-dark-border">
                            <div className="flex items-center gap-4">
                                <h2 className="text-lg font-semibold text-white">{monthYear}</h2>
                                <div className="flex items-center gap-1">
                                    <button
                                        onClick={() => navigateMonth(-1)}
                                        className="p-2 text-gray-400 hover:text-white rounded transition-colors"
                                    >
                                        <ChevronLeft className="w-5 h-5" />
                                    </button>
                                    <button
                                        onClick={() => navigateMonth(1)}
                                        className="p-2 text-gray-400 hover:text-white rounded transition-colors"
                                    >
                                        <ChevronRight className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <button
                                    onClick={goToToday}
                                    className="px-3 py-1.5 text-sm text-gray-300 hover:text-white border border-dark-border rounded-lg hover:bg-dark-nav transition-colors"
                                >
                                    Today
                                </button>

                                <div className="flex rounded-lg border border-dark-border overflow-hidden">
                                    {['month', 'week', 'day'].map(mode => (
                                        <button
                                            key={mode}
                                            onClick={() => setViewMode(mode)}
                                            className={`px-3 py-1.5 text-sm capitalize transition-colors ${
                                                viewMode === mode
                                                    ? 'bg-brand-primary text-white'
                                                    : 'text-gray-400 hover:text-white hover:bg-dark-nav'
                                            }`}
                                        >
                                            {mode}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Calendar Grid */}
                        <div className="p-4">
                            {isLoading ? (
                                <div className="flex items-center justify-center py-12">
                                    <div className="animate-spin w-8 h-8 border-2 border-brand-primary border-t-transparent rounded-full" />
                                </div>
                            ) : (
                                <CalendarGrid
                                    currentDate={currentDate}
                                    events={events}
                                    onDateSelect={setSelectedDate}
                                    selectedDate={selectedDate}
                                />
                            )}
                        </div>
                    </div>
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    {/* Calendar Connections - Microsoft & Google */}
                    <CalendarConnectionsPanel />

                    {/* Selected Date Events */}
                    <div className="bg-dark-card border border-dark-border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-medium text-white">
                                {selectedDate ? formatEventDate(selectedDate) : 'Select a date'}
                            </h3>
                            {selectedDate && (
                                <button
                                    onClick={() => { setEditingEvent(null); setShowEditor(true); }}
                                    className="p-1.5 text-gray-400 hover:text-brand-primary transition-colors"
                                    title="Add event"
                                >
                                    <Plus className="w-4 h-4" />
                                </button>
                            )}
                        </div>

                        {selectedDate ? (
                            selectedDateEvents.length > 0 ? (
                                <div className="space-y-3">
                                    {selectedDateEvents.map(event => (
                                        <EventCard
                                            key={event.id}
                                            event={event}
                                            onEdit={handleEdit}
                                            onDelete={handleDelete}
                                        />
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-6 text-gray-500">
                                    <CalendarIcon className="w-8 h-8 mx-auto mb-2" />
                                    <p className="text-sm">No events</p>
                                </div>
                            )
                        ) : (
                            <div className="text-center py-6 text-gray-500">
                                <CalendarIcon className="w-8 h-8 mx-auto mb-2" />
                                <p className="text-sm">Click on a date to view events</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Event Editor Modal */}
            {showEditor && (
                <EventEditor
                    event={editingEvent}
                    onClose={() => { setShowEditor(false); setEditingEvent(null); }}
                    onSave={handleSaveEvent}
                />
            )}

            {/* Delete Confirmation Modal */}
            {deleteConfirm && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-dark-card border border-dark-border rounded-lg p-6 max-w-md w-full">
                        <h3 className="text-lg font-semibold text-white mb-2">Delete Event</h3>
                        <p className="text-gray-400 mb-4">
                            Are you sure you want to delete "{deleteConfirm.title}"? This action cannot be undone.
                        </p>
                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => setDeleteConfirm(null)}
                                className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmDelete}
                                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
