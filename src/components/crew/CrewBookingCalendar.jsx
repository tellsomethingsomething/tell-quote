import { useState, useMemo, useEffect } from 'react';
import {
    format,
    startOfWeek,
    endOfWeek,
    startOfMonth,
    endOfMonth,
    eachDayOfInterval,
    addMonths,
    subMonths,
    addWeeks,
    subWeeks,
    isSameMonth,
    isSameDay,
    isWithinInterval,
    parseISO,
    differenceInDays,
} from 'date-fns';
import { useCrewBookingStore, CREW_BOOKING_STATUSES } from '../../store/crewBookingStore';
import { useCrewStore, CREW_DEPARTMENTS } from '../../store/crewStore';
import { useProjectStore } from '../../store/projectStore';

// Status colors for calendar bars
const STATUS_COLORS = {
    pending: 'bg-yellow-500/80 border-yellow-400',
    confirmed: 'bg-blue-500/80 border-blue-400',
    in_progress: 'bg-purple-500/80 border-purple-400',
    completed: 'bg-green-500/80 border-green-400',
    cancelled: 'bg-gray-600/60 border-gray-500 line-through opacity-50',
};

// Booking bar component
function BookingBar({ booking, dayWidth, startOffset, span, onClick }) {
    const statusColor = STATUS_COLORS[booking.status] || STATUS_COLORS.pending;

    return (
        <div
            onClick={(e) => {
                e.stopPropagation();
                onClick?.(booking);
            }}
            className={`absolute h-6 rounded-md border cursor-pointer transition-all hover:scale-[1.02] hover:z-10 ${statusColor} text-white text-xs font-medium flex items-center px-2 overflow-hidden whitespace-nowrap`}
            style={{
                left: `${startOffset * dayWidth}px`,
                width: `${Math.max(span * dayWidth - 4, dayWidth - 4)}px`,
                top: '2px',
            }}
            title={`${booking.crewName} - ${booking.crewRole}\n${booking.startDate} to ${booking.endDate}\nStatus: ${CREW_BOOKING_STATUSES[booking.status]?.label || booking.status}`}
        >
            <span className="truncate">
                {booking.crewName}
                {booking.crewRole && ` • ${booking.crewRole}`}
            </span>
        </div>
    );
}

// New booking modal
function NewBookingModal({ isOpen, onClose, selectedDate, crewMembers, projects }) {
    const createBooking = useCrewBookingStore(state => state.createBooking);
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState({
        crewId: '',
        projectId: '',
        startDate: selectedDate || '',
        endDate: selectedDate || '',
        days: 1,
        dayRate: 0,
        currency: 'USD',
        notes: '',
    });

    useEffect(() => {
        if (selectedDate) {
            setForm(f => ({ ...f, startDate: selectedDate, endDate: selectedDate }));
        }
    }, [selectedDate]);

    const selectedCrew = crewMembers.find(c => c.id === form.crewId);

    useEffect(() => {
        if (selectedCrew) {
            setForm(f => ({
                ...f,
                dayRate: selectedCrew.dayRate || 0,
                currency: selectedCrew.currency || 'USD',
            }));
        }
    }, [selectedCrew]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.crewId || !form.startDate) return;

        setSaving(true);
        try {
            const crew = crewMembers.find(c => c.id === form.crewId);
            await createBooking({
                crewId: form.crewId,
                crewName: crew ? `${crew.firstName} ${crew.lastName}` : '',
                crewRole: crew?.roleTitle || crew?.department || '',
                projectId: form.projectId || null,
                startDate: form.startDate,
                endDate: form.endDate || form.startDate,
                days: form.days,
                dayRate: parseFloat(form.dayRate) || 0,
                currency: form.currency,
                notes: form.notes,
                status: 'pending',
            });
            onClose(true);
        } catch (err) {
            console.error('Failed to create booking:', err);
        } finally {
            setSaving(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
            <div className="bg-[#1a1f2e] border border-dark-border rounded-2xl w-full max-w-lg">
                <div className="p-6 border-b border-dark-border">
                    <h2 className="text-xl font-bold text-white">Book Crew Member</h2>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {/* Crew Selection */}
                    <div>
                        <label className="block text-sm text-gray-400 mb-1">Crew Member *</label>
                        <select
                            value={form.crewId}
                            onChange={(e) => setForm({ ...form, crewId: e.target.value })}
                            className="w-full px-3 py-2 bg-dark-bg border border-dark-border rounded-lg text-white focus:border-accent-primary focus:outline-none"
                            required
                        >
                            <option value="">Select crew member</option>
                            {crewMembers.map(crew => (
                                <option key={crew.id} value={crew.id}>
                                    {crew.firstName} {crew.lastName} - {CREW_DEPARTMENTS[crew.department]?.label || 'Other'}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Project Selection */}
                    <div>
                        <label className="block text-sm text-gray-400 mb-1">Project (Optional)</label>
                        <select
                            value={form.projectId}
                            onChange={(e) => setForm({ ...form, projectId: e.target.value })}
                            className="w-full px-3 py-2 bg-dark-bg border border-dark-border rounded-lg text-white focus:border-accent-primary focus:outline-none"
                        >
                            <option value="">No project</option>
                            {projects.map(project => (
                                <option key={project.id} value={project.id}>
                                    {project.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Date Range */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm text-gray-400 mb-1">Start Date *</label>
                            <input
                                type="date"
                                value={form.startDate}
                                onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                                className="w-full px-3 py-2 bg-dark-bg border border-dark-border rounded-lg text-white focus:border-accent-primary focus:outline-none"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm text-gray-400 mb-1">End Date</label>
                            <input
                                type="date"
                                value={form.endDate}
                                onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                                min={form.startDate}
                                className="w-full px-3 py-2 bg-dark-bg border border-dark-border rounded-lg text-white focus:border-accent-primary focus:outline-none"
                            />
                        </div>
                    </div>

                    {/* Rate */}
                    <div className="grid grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm text-gray-400 mb-1">Days</label>
                            <input
                                type="number"
                                value={form.days}
                                onChange={(e) => setForm({ ...form, days: parseInt(e.target.value) || 1 })}
                                min="1"
                                className="w-full px-3 py-2 bg-dark-bg border border-dark-border rounded-lg text-white focus:border-accent-primary focus:outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-sm text-gray-400 mb-1">Day Rate</label>
                            <input
                                type="number"
                                value={form.dayRate}
                                onChange={(e) => setForm({ ...form, dayRate: e.target.value })}
                                className="w-full px-3 py-2 bg-dark-bg border border-dark-border rounded-lg text-white focus:border-accent-primary focus:outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-sm text-gray-400 mb-1">Currency</label>
                            <select
                                value={form.currency}
                                onChange={(e) => setForm({ ...form, currency: e.target.value })}
                                className="w-full px-3 py-2 bg-dark-bg border border-dark-border rounded-lg text-white focus:border-accent-primary focus:outline-none"
                            >
                                <option value="USD">USD</option>
                                <option value="EUR">EUR</option>
                                <option value="GBP">GBP</option>
                                <option value="SGD">SGD</option>
                                <option value="MYR">MYR</option>
                            </select>
                        </div>
                    </div>

                    {/* Notes */}
                    <div>
                        <label className="block text-sm text-gray-400 mb-1">Notes</label>
                        <textarea
                            value={form.notes}
                            onChange={(e) => setForm({ ...form, notes: e.target.value })}
                            rows={2}
                            className="w-full px-3 py-2 bg-dark-bg border border-dark-border rounded-lg text-white focus:border-accent-primary focus:outline-none resize-none"
                        />
                    </div>

                    {/* Total */}
                    {form.dayRate > 0 && (
                        <div className="bg-dark-bg rounded-lg p-3">
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-400">Total</span>
                                <span className="text-accent-primary font-semibold">
                                    {form.currency} {(form.dayRate * form.days).toLocaleString()}
                                </span>
                            </div>
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex justify-end gap-3 pt-4">
                        <button
                            type="button"
                            onClick={() => onClose(false)}
                            className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={saving || !form.crewId || !form.startDate}
                            className="px-6 py-2 bg-accent-primary text-white rounded-lg font-medium hover:bg-accent-primary/90 transition-colors disabled:opacity-50"
                        >
                            {saving ? 'Booking...' : 'Create Booking'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// Booking detail modal
function BookingDetailModal({ booking, isOpen, onClose, onUpdate, onDelete }) {
    const [status, setStatus] = useState(booking?.status || 'pending');
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (booking) setStatus(booking.status);
    }, [booking]);

    const handleStatusChange = async (newStatus) => {
        setSaving(true);
        await onUpdate(booking.id, { status: newStatus });
        setStatus(newStatus);
        setSaving(false);
    };

    const handleDelete = async () => {
        if (confirm('Delete this booking?')) {
            await onDelete(booking.id);
            onClose();
        }
    };

    if (!isOpen || !booking) return null;

    return (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
            <div className="bg-[#1a1f2e] border border-dark-border rounded-2xl w-full max-w-md">
                <div className="p-6 border-b border-dark-border flex justify-between items-start">
                    <div>
                        <h2 className="text-xl font-bold text-white">{booking.crewName}</h2>
                        <p className="text-sm text-gray-400">{booking.crewRole}</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1 text-gray-400 hover:text-white"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="p-6 space-y-4">
                    {/* Dates */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <p className="text-xs text-gray-500 uppercase mb-1">Start</p>
                            <p className="text-white">
                                {booking.startDate ? format(parseISO(booking.startDate), 'MMM d, yyyy') : '-'}
                            </p>
                        </div>
                        <div>
                            <p className="text-xs text-gray-500 uppercase mb-1">End</p>
                            <p className="text-white">
                                {booking.endDate ? format(parseISO(booking.endDate), 'MMM d, yyyy') : '-'}
                            </p>
                        </div>
                    </div>

                    {/* Rate & Cost */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <p className="text-xs text-gray-500 uppercase mb-1">Day Rate</p>
                            <p className="text-white">{booking.currency} {booking.dayRate.toLocaleString()}</p>
                        </div>
                        <div>
                            <p className="text-xs text-gray-500 uppercase mb-1">Total Cost</p>
                            <p className="text-accent-primary font-semibold">
                                {booking.currency} {booking.totalCost.toLocaleString()}
                            </p>
                        </div>
                    </div>

                    {/* PO Number */}
                    {booking.poNumber && (
                        <div>
                            <p className="text-xs text-gray-500 uppercase mb-1">PO Number</p>
                            <p className="text-white font-mono">{booking.poNumber}</p>
                        </div>
                    )}

                    {/* Status */}
                    <div>
                        <p className="text-xs text-gray-500 uppercase mb-2">Status</p>
                        <div className="flex flex-wrap gap-2">
                            {Object.entries(CREW_BOOKING_STATUSES).map(([key, { label }]) => (
                                <button
                                    key={key}
                                    onClick={() => handleStatusChange(key)}
                                    disabled={saving}
                                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                                        status === key
                                            ? STATUS_COLORS[key].replace('border-', 'ring-1 ring-').replace('/80', '').replace('/60', '')
                                            : 'bg-dark-bg text-gray-400 hover:text-white'
                                    }`}
                                >
                                    {label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Notes */}
                    {booking.notes && (
                        <div>
                            <p className="text-xs text-gray-500 uppercase mb-1">Notes</p>
                            <p className="text-gray-300 text-sm">{booking.notes}</p>
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex justify-between pt-4 border-t border-dark-border">
                        <button
                            onClick={handleDelete}
                            className="px-4 py-2 text-red-400 hover:text-red-300 transition-colors"
                        >
                            Delete
                        </button>
                        <button
                            onClick={onClose}
                            className="px-6 py-2 bg-accent-primary text-white rounded-lg font-medium hover:bg-accent-primary/90"
                        >
                            Close
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function CrewBookingCalendar() {
    const { bookings, loading, initialize, updateBooking, deleteBooking, getStats } = useCrewBookingStore();
    const { crew } = useCrewStore();
    const { projects } = useProjectStore();

    const [viewMode, setViewMode] = useState('month'); // 'week' or 'month'
    const [currentDate, setCurrentDate] = useState(new Date());
    const [crewFilter, setCrewFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [showNewModal, setShowNewModal] = useState(false);
    const [selectedDate, setSelectedDate] = useState(null);
    const [selectedBooking, setSelectedBooking] = useState(null);

    const stats = getStats();

    useEffect(() => {
        initialize();
    }, [initialize]);

    // Calculate calendar days
    const calendarDays = useMemo(() => {
        if (viewMode === 'week') {
            const start = startOfWeek(currentDate, { weekStartsOn: 1 });
            const end = endOfWeek(currentDate, { weekStartsOn: 1 });
            return eachDayOfInterval({ start, end });
        } else {
            const start = startOfWeek(startOfMonth(currentDate), { weekStartsOn: 1 });
            const end = endOfWeek(endOfMonth(currentDate), { weekStartsOn: 1 });
            return eachDayOfInterval({ start, end });
        }
    }, [currentDate, viewMode]);

    // Filter bookings
    const filteredBookings = useMemo(() => {
        return bookings.filter(b => {
            if (crewFilter && b.crewId !== crewFilter) return false;
            if (statusFilter && b.status !== statusFilter) return false;
            return true;
        });
    }, [bookings, crewFilter, statusFilter]);

    // Get bookings for a specific day
    const getBookingsForDay = (day) => {
        return filteredBookings.filter(b => {
            if (!b.startDate) return false;
            const start = parseISO(b.startDate);
            const end = b.endDate ? parseISO(b.endDate) : start;
            return isWithinInterval(day, { start, end }) || isSameDay(day, start) || isSameDay(day, end);
        });
    };

    // Navigation
    const goNext = () => {
        if (viewMode === 'week') {
            setCurrentDate(addWeeks(currentDate, 1));
        } else {
            setCurrentDate(addMonths(currentDate, 1));
        }
    };

    const goPrev = () => {
        if (viewMode === 'week') {
            setCurrentDate(subWeeks(currentDate, 1));
        } else {
            setCurrentDate(subMonths(currentDate, 1));
        }
    };

    const goToday = () => setCurrentDate(new Date());

    const handleDayClick = (day) => {
        setSelectedDate(format(day, 'yyyy-MM-dd'));
        setShowNewModal(true);
    };

    const dayWidth = viewMode === 'week' ? 120 : 40;

    return (
        <div className="h-full flex flex-col">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                    <h2 className="text-xl font-bold text-white">Crew Booking Calendar</h2>
                    <p className="text-gray-400 text-sm">
                        {stats.active} active bookings • {stats.thisMonth} this month
                    </p>
                </div>
                <button
                    onClick={() => {
                        setSelectedDate(format(new Date(), 'yyyy-MM-dd'));
                        setShowNewModal(true);
                    }}
                    className="px-4 py-2 bg-accent-primary text-white rounded-lg font-medium hover:bg-accent-primary/90 transition-colors flex items-center gap-2"
                >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    New Booking
                </button>
            </div>

            {/* Controls */}
            <div className="flex flex-wrap items-center gap-4 mb-4">
                {/* Navigation */}
                <div className="flex items-center gap-2">
                    <button
                        onClick={goPrev}
                        className="p-2 bg-dark-card border border-dark-border rounded-lg hover:bg-white/5"
                    >
                        <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                    </button>
                    <button
                        onClick={goToday}
                        className="px-3 py-2 bg-dark-card border border-dark-border rounded-lg text-sm text-gray-300 hover:bg-white/5"
                    >
                        Today
                    </button>
                    <button
                        onClick={goNext}
                        className="p-2 bg-dark-card border border-dark-border rounded-lg hover:bg-white/5"
                    >
                        <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                    </button>
                    <span className="text-lg font-semibold text-white ml-2">
                        {format(currentDate, viewMode === 'week' ? "'Week of' MMM d, yyyy" : 'MMMM yyyy')}
                    </span>
                </div>

                <div className="flex-1" />

                {/* View Toggle */}
                <div className="flex bg-dark-card border border-dark-border rounded-lg overflow-hidden">
                    <button
                        onClick={() => setViewMode('week')}
                        className={`px-3 py-2 text-sm ${viewMode === 'week' ? 'bg-accent-primary/20 text-accent-primary' : 'text-gray-400 hover:text-white'}`}
                    >
                        Week
                    </button>
                    <button
                        onClick={() => setViewMode('month')}
                        className={`px-3 py-2 text-sm ${viewMode === 'month' ? 'bg-accent-primary/20 text-accent-primary' : 'text-gray-400 hover:text-white'}`}
                    >
                        Month
                    </button>
                </div>

                {/* Crew Filter */}
                <select
                    value={crewFilter}
                    onChange={(e) => setCrewFilter(e.target.value)}
                    className="px-3 py-2 bg-dark-card border border-dark-border rounded-lg text-sm text-white focus:border-accent-primary focus:outline-none"
                >
                    <option value="">All Crew</option>
                    {crew.map(c => (
                        <option key={c.id} value={c.id}>{c.firstName} {c.lastName}</option>
                    ))}
                </select>

                {/* Status Filter */}
                <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-3 py-2 bg-dark-card border border-dark-border rounded-lg text-sm text-white focus:border-accent-primary focus:outline-none"
                >
                    <option value="">All Statuses</option>
                    {Object.entries(CREW_BOOKING_STATUSES).map(([key, { label }]) => (
                        <option key={key} value={key}>{label}</option>
                    ))}
                </select>
            </div>

            {/* Legend */}
            <div className="flex flex-wrap gap-4 mb-4">
                {Object.entries(CREW_BOOKING_STATUSES).map(([key, { label }]) => (
                    <div key={key} className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded ${STATUS_COLORS[key].split(' ')[0]}`} />
                        <span className="text-xs text-gray-400">{label}</span>
                    </div>
                ))}
            </div>

            {/* Calendar */}
            {loading ? (
                <div className="flex-1 flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent-primary" />
                </div>
            ) : (
                <div className="flex-1 bg-dark-card border border-dark-border rounded-xl overflow-hidden">
                    {/* Header Row */}
                    <div className="grid border-b border-dark-border bg-dark-bg"
                         style={{ gridTemplateColumns: `repeat(7, 1fr)` }}>
                        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
                            <div key={day} className="px-2 py-3 text-center text-xs font-medium text-gray-400 uppercase">
                                {day}
                            </div>
                        ))}
                    </div>

                    {/* Calendar Grid */}
                    <div className="grid overflow-y-auto"
                         style={{
                             gridTemplateColumns: 'repeat(7, 1fr)',
                             gridTemplateRows: viewMode === 'week' ? 'minmax(120px, 1fr)' : `repeat(${Math.ceil(calendarDays.length / 7)}, minmax(100px, 1fr))`,
                         }}>
                        {calendarDays.map((day, idx) => {
                            const dayBookings = getBookingsForDay(day);
                            const isToday = isSameDay(day, new Date());
                            const isCurrentMonth = isSameMonth(day, currentDate);

                            return (
                                <div
                                    key={idx}
                                    onClick={() => handleDayClick(day)}
                                    className={`relative border-b border-r border-dark-border p-1 cursor-pointer hover:bg-white/5 transition-colors min-h-[100px] ${
                                        !isCurrentMonth && viewMode === 'month' ? 'bg-dark-bg/50' : ''
                                    }`}
                                >
                                    {/* Day Number */}
                                    <div className={`text-right mb-1 ${
                                        isToday
                                            ? 'inline-flex items-center justify-center w-6 h-6 bg-accent-primary text-white rounded-full text-xs font-bold float-right'
                                            : isCurrentMonth || viewMode === 'week'
                                                ? 'text-gray-300 text-sm'
                                                : 'text-gray-600 text-sm'
                                    }`}>
                                        {format(day, 'd')}
                                    </div>

                                    {/* Bookings */}
                                    <div className="space-y-1 pt-1 clear-both">
                                        {dayBookings.slice(0, viewMode === 'week' ? 10 : 3).map((booking, i) => {
                                            const isStart = booking.startDate && isSameDay(parseISO(booking.startDate), day);
                                            const statusColor = STATUS_COLORS[booking.status] || STATUS_COLORS.pending;

                                            return (
                                                <div
                                                    key={booking.id}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setSelectedBooking(booking);
                                                    }}
                                                    className={`text-xs px-1.5 py-0.5 rounded cursor-pointer truncate ${statusColor}`}
                                                    title={`${booking.crewName} - ${booking.crewRole}`}
                                                >
                                                    {isStart && <span className="font-medium">{booking.crewName}</span>}
                                                    {!isStart && <span className="opacity-60">→</span>}
                                                </div>
                                            );
                                        })}
                                        {dayBookings.length > (viewMode === 'week' ? 10 : 3) && (
                                            <div className="text-xs text-gray-500 px-1">
                                                +{dayBookings.length - (viewMode === 'week' ? 10 : 3)} more
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Modals */}
            <NewBookingModal
                isOpen={showNewModal}
                onClose={(created) => {
                    setShowNewModal(false);
                    setSelectedDate(null);
                }}
                selectedDate={selectedDate}
                crewMembers={crew}
                projects={projects}
            />

            <BookingDetailModal
                booking={selectedBooking}
                isOpen={!!selectedBooking}
                onClose={() => setSelectedBooking(null)}
                onUpdate={updateBooking}
                onDelete={deleteBooking}
            />
        </div>
    );
}
