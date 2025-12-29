import { useState, useMemo, useEffect } from 'react';
import { useCallSheetStore, CALL_SHEET_STATUS, CALL_SHEET_STATUS_CONFIG, DEPARTMENTS } from '../store/callSheetStore';
import { useProjectStore } from '../store/projectStore';
import { useFeatureGuard, FEATURES } from '../components/billing/FeatureGate';

// Calendar Component
function ShootCalendar({ callSheets, onDateClick, selectedDate, onSheetClick }) {
    const [currentMonth, setCurrentMonth] = useState(new Date());

    const getDaysInMonth = (date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const daysInMonth = lastDay.getDate();
        const startingDayOfWeek = firstDay.getDay();

        const days = [];
        for (let i = 0; i < startingDayOfWeek; i++) {
            days.push(null);
        }
        for (let day = 1; day <= daysInMonth; day++) {
            days.push(new Date(year, month, day));
        }
        return days;
    };

    const days = getDaysInMonth(currentMonth);
    const today = new Date().toISOString().split('T')[0];

    const getShootsForDate = (date) => {
        if (!date) return [];
        const dateStr = date.toISOString().split('T')[0];
        return callSheets.filter(cs =>
            cs.shootDate === dateStr &&
            cs.status !== CALL_SHEET_STATUS.CANCELLED
        );
    };

    const prevMonth = () => {
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
    };

    const nextMonth = () => {
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
    };

    const goToToday = () => {
        setCurrentMonth(new Date());
        onDateClick(today);
    };

    const monthName = currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' });

    return (
        <div className="bg-dark-card border border-dark-border rounded-xl overflow-hidden">
            {/* Calendar Header */}
            <div className="flex items-center justify-between p-4 border-b border-dark-border">
                <button
                    onClick={prevMonth}
                    className="p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                </button>
                <div className="flex items-center gap-3">
                    <h3 className="text-lg font-semibold text-white">{monthName}</h3>
                    <button
                        onClick={goToToday}
                        className="px-2 py-1 text-xs text-gray-400 hover:text-white border border-dark-border rounded transition-colors"
                    >
                        Today
                    </button>
                </div>
                <button
                    onClick={nextMonth}
                    className="p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                </button>
            </div>

            {/* Day Headers */}
            <div className="grid grid-cols-7 border-b border-dark-border">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                    <div key={day} className="p-2 text-center text-sm font-medium text-gray-500">
                        {day}
                    </div>
                ))}
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7">
                {days.map((date, i) => {
                    if (!date) {
                        return <div key={`empty-${i}`} className="h-28 border-r border-b border-dark-border last:border-r-0 bg-dark-bg/50" />;
                    }

                    const dateStr = date.toISOString().split('T')[0];
                    const shoots = getShootsForDate(date);
                    const isToday = dateStr === today;
                    const isSelected = dateStr === selectedDate;
                    const isPast = dateStr < today;

                    return (
                        <div
                            key={dateStr}
                            onClick={() => onDateClick(dateStr)}
                            className={`h-28 border-r border-b border-dark-border last:border-r-0 p-1.5 cursor-pointer transition-colors hover:bg-white/5 ${
                                isSelected ? 'bg-accent-primary/10 ring-1 ring-accent-primary/30' : ''
                            } ${isPast ? 'opacity-60' : ''}`}
                        >
                            <div className={`text-sm font-medium mb-1 flex items-center justify-between ${
                                isToday
                                    ? 'text-accent-primary'
                                    : date.getDay() === 0 || date.getDay() === 6
                                        ? 'text-gray-500'
                                        : 'text-gray-300'
                            }`}>
                                <span className={isToday ? 'w-6 h-6 bg-accent-primary text-white rounded-full flex items-center justify-center text-xs' : ''}>
                                    {date.getDate()}
                                </span>
                                {shoots.length > 0 && (
                                    <span className="text-xs text-gray-500">
                                        {shoots.length} shoot{shoots.length !== 1 ? 's' : ''}
                                    </span>
                                )}
                            </div>
                            <div className="space-y-0.5 overflow-hidden">
                                {shoots.slice(0, 2).map((sheet) => {
                                    const statusConfig = CALL_SHEET_STATUS_CONFIG[sheet.status];
                                    return (
                                        <div
                                            key={sheet.id}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onSheetClick(sheet.id);
                                            }}
                                            className={`text-xs px-1.5 py-0.5 rounded truncate cursor-pointer hover:opacity-80 ${statusConfig.bgClass} ${statusConfig.textClass}`}
                                            title={`${sheet.productionTitle || sheet.projectName || 'Untitled'} - Day ${sheet.dayNumber || '?'}`}
                                        >
                                            {sheet.productionTitle || sheet.projectName || 'Untitled'}
                                        </div>
                                    );
                                })}
                                {shoots.length > 2 && (
                                    <div className="text-xs text-gray-500 px-1">
                                        +{shoots.length - 2} more
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

// Call Sheet Card
function CallSheetCard({ sheet, onClick, onPublish, onDuplicate }) {
    const statusConfig = CALL_SHEET_STATUS_CONFIG[sheet.status] || CALL_SHEET_STATUS_CONFIG.draft;
    const shootDate = sheet.shootDate ? new Date(sheet.shootDate) : null;
    const isToday = sheet.shootDate === new Date().toISOString().split('T')[0];
    const isPast = shootDate && shootDate < new Date(new Date().setHours(0, 0, 0, 0));
    const isFuture = shootDate && shootDate >= new Date(new Date().setHours(0, 0, 0, 0));

    return (
        <div
            onClick={() => onClick(sheet.id)}
            className="bg-dark-card border border-dark-border rounded-xl p-4 hover:border-gray-600 transition-all cursor-pointer group"
        >
            <div className="flex items-start justify-between gap-4 mb-3">
                <div className="flex-1 min-w-0">
                    {/* Title & Day Number */}
                    <div className="flex items-center gap-2 mb-1">
                        {sheet.dayNumber && (
                            <span className="px-2 py-0.5 bg-gray-800 text-gray-300 rounded text-xs font-medium">
                                Day {sheet.dayNumber}{sheet.totalDays ? `/${sheet.totalDays}` : ''}
                            </span>
                        )}
                        <h3 className="font-semibold text-white truncate group-hover:text-accent-primary transition-colors">
                            {sheet.productionTitle || sheet.projectName || 'Untitled Call Sheet'}
                        </h3>
                    </div>

                    {/* Project/Episode */}
                    {sheet.episodeTitle && (
                        <p className="text-sm text-gray-400 truncate mb-2">
                            {sheet.episodeNumber && `Ep ${sheet.episodeNumber}: `}{sheet.episodeTitle}
                        </p>
                    )}
                </div>

                {/* Status Badge */}
                <span className={`px-2 py-1 rounded-full text-xs font-medium shrink-0 ${statusConfig.bgClass} ${statusConfig.textClass}`}>
                    {statusConfig.label}
                </span>
            </div>

            {/* Shoot Date & Time */}
            <div className="flex items-center gap-4 text-sm text-gray-400 mb-3">
                <div className="flex items-center gap-1.5">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span className={isToday ? 'text-green-400 font-medium' : isPast ? 'text-gray-500' : ''}>
                        {shootDate ? shootDate.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' }) : 'No date'}
                    </span>
                    {isToday && <span className="text-green-400">(Today)</span>}
                </div>
                {sheet.generalCallTime && (
                    <div className="flex items-center gap-1.5">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>Call: {sheet.generalCallTime}</span>
                    </div>
                )}
            </div>

            {/* Location */}
            {sheet.locationName && (
                <div className="flex items-center gap-1.5 text-sm text-gray-400 mb-3">
                    <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span className="truncate">{sheet.locationName}</span>
                </div>
            )}

            {/* Crew/Cast Count */}
            <div className="flex items-center gap-4 text-xs text-gray-500 mb-3">
                <div className="flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    <span>{sheet.crewCount || 0} crew</span>
                    {sheet.crewConfirmedCount > 0 && (
                        <span className="text-green-500">({sheet.crewConfirmedCount} confirmed)</span>
                    )}
                </div>
                {sheet.castCount > 0 && (
                    <div className="flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        <span>{sheet.castCount} cast</span>
                    </div>
                )}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 pt-3 border-t border-dark-border">
                {sheet.status === CALL_SHEET_STATUS.DRAFT && (
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onPublish(sheet.id);
                        }}
                        className="px-3 py-1.5 text-xs font-medium bg-green-500/20 text-green-400 rounded-lg hover:bg-green-500/30 transition-colors"
                    >
                        Publish
                    </button>
                )}
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onDuplicate(sheet.id);
                    }}
                    className="px-3 py-1.5 text-xs font-medium text-gray-400 hover:text-white transition-colors"
                >
                    Duplicate
                </button>
                <span className="ml-auto text-xs text-gray-600">
                    v{sheet.version || 1}
                </span>
            </div>
        </div>
    );
}

// Quick Create Modal
function QuickCreateModal({ isOpen, onClose, projects, onCreate }) {
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState({
        projectId: '',
        productionTitle: '',
        shootDate: new Date().toISOString().split('T')[0],
        dayNumber: 1,
        totalDays: 1,
        generalCallTime: '07:00',
        locationName: '',
    });

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.shootDate) return;

        setSaving(true);
        try {
            const newSheet = await onCreate(form);
            onClose(newSheet?.id);
        } catch (err) {
            console.error('Failed to create call sheet:', err);
            alert('Failed to create call sheet');
        } finally {
            setSaving(false);
        }
    };

    // Auto-fill production title from project
    useEffect(() => {
        if (form.projectId) {
            const project = projects.find(p => p.id === form.projectId);
            if (project && !form.productionTitle) {
                setForm(f => ({ ...f, productionTitle: project.name }));
            }
        }
    }, [form.projectId, projects]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
            <div className="bg-[#1a1f2e] border border-dark-border rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
                <div className="p-6 border-b border-dark-border">
                    <h2 className="text-xl font-bold text-white">New Call Sheet</h2>
                    <p className="text-sm text-gray-400 mt-1">Create a call sheet for a shoot day</p>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {/* Project */}
                    <div>
                        <label className="block text-sm text-gray-400 mb-1">Link to Project</label>
                        <select
                            value={form.projectId}
                            onChange={(e) => setForm({ ...form, projectId: e.target.value })}
                            className="w-full px-3 py-2 bg-dark-bg border border-dark-border rounded-lg text-white focus:border-accent-primary focus:outline-none"
                        >
                            <option value="">No project (standalone)</option>
                            {projects.filter(p => p.status !== 'completed' && p.status !== 'cancelled').map(project => (
                                <option key={project.id} value={project.id}>
                                    {project.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Production Title */}
                    <div>
                        <label className="block text-sm text-gray-400 mb-1">Production Title *</label>
                        <input
                            type="text"
                            value={form.productionTitle}
                            onChange={(e) => setForm({ ...form, productionTitle: e.target.value })}
                            placeholder="e.g., Brand Campaign 2024"
                            className="w-full px-3 py-2 bg-dark-bg border border-dark-border rounded-lg text-white placeholder-gray-500 focus:border-accent-primary focus:outline-none"
                            required
                        />
                    </div>

                    {/* Shoot Date */}
                    <div>
                        <label className="block text-sm text-gray-400 mb-1">Shoot Date *</label>
                        <input
                            type="date"
                            value={form.shootDate}
                            onChange={(e) => setForm({ ...form, shootDate: e.target.value })}
                            className="w-full px-3 py-2 bg-dark-bg border border-dark-border rounded-lg text-white focus:border-accent-primary focus:outline-none"
                            required
                        />
                    </div>

                    {/* Day Numbers */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm text-gray-400 mb-1">Day Number</label>
                            <input
                                type="number"
                                min="1"
                                value={form.dayNumber}
                                onChange={(e) => setForm({ ...form, dayNumber: parseInt(e.target.value) || 1 })}
                                className="w-full px-3 py-2 bg-dark-bg border border-dark-border rounded-lg text-white focus:border-accent-primary focus:outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-sm text-gray-400 mb-1">Total Days</label>
                            <input
                                type="number"
                                min="1"
                                value={form.totalDays}
                                onChange={(e) => setForm({ ...form, totalDays: parseInt(e.target.value) || 1 })}
                                className="w-full px-3 py-2 bg-dark-bg border border-dark-border rounded-lg text-white focus:border-accent-primary focus:outline-none"
                            />
                        </div>
                    </div>

                    {/* Call Time */}
                    <div>
                        <label className="block text-sm text-gray-400 mb-1">Crew Call Time</label>
                        <input
                            type="time"
                            value={form.generalCallTime}
                            onChange={(e) => setForm({ ...form, generalCallTime: e.target.value })}
                            className="w-full px-3 py-2 bg-dark-bg border border-dark-border rounded-lg text-white focus:border-accent-primary focus:outline-none"
                        />
                    </div>

                    {/* Location */}
                    <div>
                        <label className="block text-sm text-gray-400 mb-1">Location Name</label>
                        <input
                            type="text"
                            value={form.locationName}
                            onChange={(e) => setForm({ ...form, locationName: e.target.value })}
                            placeholder="e.g., Studio A, Pinewood"
                            className="w-full px-3 py-2 bg-dark-bg border border-dark-border rounded-lg text-white placeholder-gray-500 focus:border-accent-primary focus:outline-none"
                        />
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end gap-3 pt-4">
                        <button
                            type="button"
                            onClick={() => onClose(null)}
                            className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={saving || !form.shootDate || !form.productionTitle}
                            className="px-6 py-2 bg-accent-primary text-white rounded-lg font-medium hover:bg-accent-primary/90 transition-colors disabled:opacity-50"
                        >
                            {saving ? 'Creating...' : 'Create & Edit'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// Duplicate Modal
function DuplicateModal({ isOpen, onClose, sheet, onDuplicate }) {
    const [saving, setSaving] = useState(false);
    const [newDate, setNewDate] = useState('');
    const [newDayNumber, setNewDayNumber] = useState((sheet?.dayNumber || 0) + 1);

    useEffect(() => {
        if (sheet?.shootDate) {
            const date = new Date(sheet.shootDate);
            date.setDate(date.getDate() + 1);
            setNewDate(date.toISOString().split('T')[0]);
            setNewDayNumber((sheet.dayNumber || 0) + 1);
        }
    }, [sheet]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!newDate) return;

        setSaving(true);
        try {
            await onDuplicate(sheet.id, newDate, newDayNumber);
            onClose();
        } catch (err) {
            console.error('Failed to duplicate:', err);
            alert('Failed to duplicate call sheet');
        } finally {
            setSaving(false);
        }
    };

    if (!isOpen || !sheet) return null;

    return (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
            <div className="bg-[#1a1f2e] border border-dark-border rounded-2xl w-full max-w-md">
                <div className="p-6 border-b border-dark-border">
                    <h2 className="text-xl font-bold text-white">Duplicate Call Sheet</h2>
                    <p className="text-sm text-gray-400 mt-1">
                        Create a copy of "{sheet.productionTitle || sheet.projectName}" for the next shoot day
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm text-gray-400 mb-1">New Shoot Date *</label>
                        <input
                            type="date"
                            value={newDate}
                            onChange={(e) => setNewDate(e.target.value)}
                            className="w-full px-3 py-2 bg-dark-bg border border-dark-border rounded-lg text-white focus:border-accent-primary focus:outline-none"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm text-gray-400 mb-1">New Day Number</label>
                        <input
                            type="number"
                            min="1"
                            value={newDayNumber}
                            onChange={(e) => setNewDayNumber(parseInt(e.target.value) || 1)}
                            className="w-full px-3 py-2 bg-dark-bg border border-dark-border rounded-lg text-white focus:border-accent-primary focus:outline-none"
                        />
                    </div>

                    <p className="text-xs text-gray-500">
                        Crew and cast will be copied. Schedule items will be cleared.
                    </p>

                    <div className="flex justify-end gap-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={saving || !newDate}
                            className="px-6 py-2 bg-accent-primary text-white rounded-lg font-medium hover:bg-accent-primary/90 transition-colors disabled:opacity-50"
                        >
                            {saving ? 'Duplicating...' : 'Duplicate'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default function CallSheetPage({ onSelectCallSheet }) {
    const {
        callSheets,
        loading,
        getStats,
        getToday,
        getUpcoming,
        createCallSheet,
        publishCallSheet,
        duplicateCallSheet,
    } = useCallSheetStore();
    const { projects } = useProjectStore();

    const [viewMode, setViewMode] = useState('calendar');
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [duplicateSheet, setDuplicateSheet] = useState(null);
    const [statusFilter, setStatusFilter] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');

    // Feature gating for call sheet creation
    const { checkAndProceed, PromptComponent } = useFeatureGuard(FEATURES.CALL_SHEETS);

    const stats = getStats();
    const todaySheets = getToday();

    // Filter call sheets for list view
    const filteredSheets = useMemo(() => {
        let filtered = [...callSheets];

        // Status filter
        if (statusFilter === 'upcoming') {
            const today = new Date().toISOString().split('T')[0];
            filtered = filtered.filter(cs => cs.shootDate >= today && cs.status !== CALL_SHEET_STATUS.CANCELLED);
        } else if (statusFilter === 'past') {
            const today = new Date().toISOString().split('T')[0];
            filtered = filtered.filter(cs => cs.shootDate < today);
        } else if (statusFilter !== 'all') {
            filtered = filtered.filter(cs => cs.status === statusFilter);
        }

        // Search
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            filtered = filtered.filter(cs =>
                (cs.productionTitle || '').toLowerCase().includes(q) ||
                (cs.projectName || '').toLowerCase().includes(q) ||
                (cs.locationName || '').toLowerCase().includes(q) ||
                (cs.director || '').toLowerCase().includes(q)
            );
        }

        // Sort by date
        return filtered.sort((a, b) => new Date(b.shootDate) - new Date(a.shootDate));
    }, [callSheets, statusFilter, searchQuery]);

    // Sheets for selected date
    const selectedDateSheets = useMemo(() => {
        return callSheets.filter(cs =>
            cs.shootDate === selectedDate &&
            cs.status !== CALL_SHEET_STATUS.CANCELLED
        );
    }, [callSheets, selectedDate]);

    const handleSheetClick = (id) => {
        onSelectCallSheet(id);
    };

    const handleCreate = async (data) => {
        const newSheet = await createCallSheet(data);
        return newSheet;
    };

    const handlePublish = async (id) => {
        if (confirm('Publish this call sheet? Crew will be notified.')) {
            await publishCallSheet(id);
        }
    };

    const handleDuplicate = async (id, newDate, newDayNumber) => {
        await duplicateCallSheet(id, newDate, newDayNumber);
    };

    return (
        <div className="p-4 lg:p-6 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-white">Call Sheets</h1>
                    <p className="text-gray-400 text-sm">Manage shoot schedules and crew calls</p>
                </div>
                <button
                    onClick={() => checkAndProceed(() => setShowCreateModal(true))}
                    className="px-4 py-2 bg-accent-primary text-white rounded-lg font-medium hover:bg-accent-primary/90 transition-colors flex items-center gap-2"
                >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    New Call Sheet
                </button>
            </div>

            {/* Today's Shoots Alert */}
            {todaySheets.length > 0 && (
                <div className="mb-6 p-4 bg-green-500/10 border border-green-500/30 rounded-xl">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
                            <svg className="w-5 h-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                        </div>
                        <div>
                            <p className="text-green-400 font-medium">
                                {todaySheets.length} shoot{todaySheets.length !== 1 ? 's' : ''} today
                            </p>
                            <p className="text-sm text-gray-400">
                                {todaySheets.map(s => s.productionTitle || s.projectName).join(', ')}
                            </p>
                        </div>
                        <button
                            onClick={() => handleSheetClick(todaySheets[0].id)}
                            className="ml-auto px-3 py-1.5 bg-green-500/20 text-green-400 rounded-lg text-sm font-medium hover:bg-green-500/30 transition-colors"
                        >
                            View
                        </button>
                    </div>
                </div>
            )}

            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 mb-6">
                <div className="bg-dark-card border border-dark-border rounded-xl p-4">
                    <p className="text-2xl font-bold text-green-400">{stats.today}</p>
                    <p className="text-sm text-gray-400">Today</p>
                </div>
                <div className="bg-dark-card border border-dark-border rounded-xl p-4">
                    <p className="text-2xl font-bold text-blue-400">{stats.thisWeek}</p>
                    <p className="text-sm text-gray-400">This Week</p>
                </div>
                <div className="bg-dark-card border border-dark-border rounded-xl p-4">
                    <p className="text-2xl font-bold text-amber-400">{stats.drafts}</p>
                    <p className="text-sm text-gray-400">Drafts</p>
                </div>
                <div className="bg-dark-card border border-dark-border rounded-xl p-4">
                    <p className="text-2xl font-bold text-purple-400">{stats.upcoming}</p>
                    <p className="text-sm text-gray-400">Upcoming</p>
                </div>
                <div className="bg-dark-card border border-dark-border rounded-xl p-4">
                    <p className="text-2xl font-bold text-gray-400">{stats.total}</p>
                    <p className="text-sm text-gray-400">Total</p>
                </div>
            </div>

            {/* View Toggle & Filters */}
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <div className="flex bg-dark-card border border-dark-border rounded-lg overflow-hidden">
                    <button
                        onClick={() => setViewMode('calendar')}
                        className={`px-4 py-2 flex items-center gap-2 ${viewMode === 'calendar' ? 'bg-accent-primary/20 text-accent-primary' : 'text-gray-400 hover:text-white'}`}
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        Calendar
                    </button>
                    <button
                        onClick={() => setViewMode('list')}
                        className={`px-4 py-2 flex items-center gap-2 ${viewMode === 'list' ? 'bg-accent-primary/20 text-accent-primary' : 'text-gray-400 hover:text-white'}`}
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                        </svg>
                        List
                    </button>
                </div>

                {viewMode === 'list' && (
                    <>
                        <div className="relative flex-1 max-w-xs">
                            <svg className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search call sheets..."
                                className="w-full pl-10 pr-4 py-2 bg-dark-card border border-dark-border rounded-lg text-white placeholder-gray-500 focus:border-accent-primary focus:outline-none"
                            />
                        </div>

                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="px-3 py-2 bg-dark-card border border-dark-border rounded-lg text-white focus:border-accent-primary focus:outline-none"
                        >
                            <option value="all">All Status</option>
                            <option value="upcoming">Upcoming</option>
                            <option value="past">Past</option>
                            <option value={CALL_SHEET_STATUS.DRAFT}>Drafts</option>
                            <option value={CALL_SHEET_STATUS.PUBLISHED}>Published</option>
                            <option value={CALL_SHEET_STATUS.COMPLETED}>Completed</option>
                            <option value={CALL_SHEET_STATUS.CANCELLED}>Cancelled</option>
                        </select>
                    </>
                )}
            </div>

            {/* Loading */}
            {loading && (
                <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent-primary"></div>
                </div>
            )}

            {/* Calendar View */}
            {!loading && viewMode === 'calendar' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2">
                        <ShootCalendar
                            callSheets={callSheets}
                            onDateClick={setSelectedDate}
                            selectedDate={selectedDate}
                            onSheetClick={handleSheetClick}
                        />
                    </div>

                    {/* Selected Date Panel */}
                    <div>
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-white">
                                {new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-GB', {
                                    weekday: 'long',
                                    day: 'numeric',
                                    month: 'long'
                                })}
                            </h3>
                            <button
                                onClick={() => checkAndProceed(() => setShowCreateModal(true))}
                                className="p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                                title="Add call sheet for this date"
                            >
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                </svg>
                            </button>
                        </div>

                        <div className="space-y-4">
                            {selectedDateSheets.length > 0 ? (
                                selectedDateSheets.map(sheet => (
                                    <CallSheetCard
                                        key={sheet.id}
                                        sheet={sheet}
                                        onClick={handleSheetClick}
                                        onPublish={handlePublish}
                                        onDuplicate={(id) => setDuplicateSheet(callSheets.find(s => s.id === id))}
                                    />
                                ))
                            ) : (
                                <div className="text-center py-8 text-gray-500 bg-dark-card border border-dark-border rounded-xl">
                                    <svg className="w-12 h-12 mx-auto mb-3 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                    <p className="mb-2">No shoots scheduled</p>
                                    <button
                                        onClick={() => checkAndProceed(() => setShowCreateModal(true))}
                                        className="text-accent-primary hover:text-accent-primary/80 text-sm"
                                    >
                                        Create call sheet
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* List View */}
            {!loading && viewMode === 'list' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredSheets.length > 0 ? (
                        filteredSheets.map(sheet => (
                            <CallSheetCard
                                key={sheet.id}
                                sheet={sheet}
                                onClick={handleSheetClick}
                                onPublish={handlePublish}
                                onDuplicate={(id) => setDuplicateSheet(callSheets.find(s => s.id === id))}
                            />
                        ))
                    ) : (
                        <div className="col-span-full text-center py-12 text-gray-500">
                            <svg className="w-16 h-16 mx-auto mb-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            <h3 className="text-lg font-medium text-white mb-2">No call sheets found</h3>
                            <p className="mb-4">Create your first call sheet to get started</p>
                            <button
                                onClick={() => checkAndProceed(() => setShowCreateModal(true))}
                                className="px-4 py-2 bg-accent-primary text-white rounded-lg font-medium hover:bg-accent-primary/90 transition-colors"
                            >
                                New Call Sheet
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* Create Modal */}
            <QuickCreateModal
                isOpen={showCreateModal}
                onClose={(newId) => {
                    setShowCreateModal(false);
                    if (newId) {
                        onSelectCallSheet(newId);
                    }
                }}
                projects={projects}
                onCreate={handleCreate}
            />

            {/* Duplicate Modal */}
            <DuplicateModal
                isOpen={!!duplicateSheet}
                onClose={() => setDuplicateSheet(null)}
                sheet={duplicateSheet}
                onDuplicate={handleDuplicate}
            />

            {/* Feature gate upgrade prompt */}
            <PromptComponent />
        </div>
    );
}
