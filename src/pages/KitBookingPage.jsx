import { useState, useMemo, useEffect } from 'react';
import { useKitBookingStore, BOOKING_STATUS, BOOKING_STATUS_CONFIG } from '../store/kitBookingStore';
import { useKitStore } from '../store/kitStore';
import { useProjectStore } from '../store/projectStore';

// Simple Calendar Component
function BookingCalendar({ bookings, onDateClick, selectedDate }) {
    const [currentMonth, setCurrentMonth] = useState(new Date());

    const getDaysInMonth = (date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const daysInMonth = lastDay.getDate();
        const startingDayOfWeek = firstDay.getDay();

        const days = [];

        // Add empty cells for days before the first day of the month
        for (let i = 0; i < startingDayOfWeek; i++) {
            days.push(null);
        }

        // Add days of the month
        for (let day = 1; day <= daysInMonth; day++) {
            days.push(new Date(year, month, day));
        }

        return days;
    };

    const days = getDaysInMonth(currentMonth);
    const today = new Date().toISOString().split('T')[0];

    const getBookingsForDate = (date) => {
        if (!date) return [];
        const dateStr = date.toISOString().split('T')[0];
        return bookings.filter(b =>
            b.startDate <= dateStr && b.endDate >= dateStr &&
            b.status !== BOOKING_STATUS.CANCELLED
        );
    };

    const prevMonth = () => {
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
    };

    const nextMonth = () => {
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
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
                <h3 className="text-lg font-semibold text-white">{monthName}</h3>
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
                        return <div key={`empty-${i}`} className="h-24 border-r border-b border-dark-border last:border-r-0 bg-dark-bg/50" />;
                    }

                    const dateStr = date.toISOString().split('T')[0];
                    const dayBookings = getBookingsForDate(date);
                    const isToday = dateStr === today;
                    const isSelected = dateStr === selectedDate;

                    return (
                        <div
                            key={dateStr}
                            onClick={() => onDateClick(dateStr)}
                            className={`h-24 border-r border-b border-dark-border last:border-r-0 p-1 cursor-pointer transition-colors hover:bg-white/5 ${
                                isSelected ? 'bg-accent-primary/10' : ''
                            }`}
                        >
                            <div className={`text-sm font-medium mb-1 ${
                                isToday
                                    ? 'text-accent-primary'
                                    : date.getDay() === 0 || date.getDay() === 6
                                        ? 'text-gray-500'
                                        : 'text-gray-300'
                            }`}>
                                {date.getDate()}
                            </div>
                            <div className="space-y-0.5 overflow-hidden">
                                {dayBookings.slice(0, 3).map((booking, idx) => (
                                    <div
                                        key={booking.id}
                                        className="text-xs px-1 py-0.5 rounded truncate"
                                        style={{
                                            backgroundColor: booking.categoryColor ? `${booking.categoryColor}30` : '#3B82F630',
                                            color: booking.categoryColor || '#3B82F6',
                                        }}
                                        title={`${booking.kitCode || booking.kitName} - ${booking.projectName || booking.purpose || 'No project'}`}
                                    >
                                        {booking.kitCode || booking.kitName?.substring(0, 10)}
                                    </div>
                                ))}
                                {dayBookings.length > 3 && (
                                    <div className="text-xs text-gray-500 px-1">
                                        +{dayBookings.length - 3} more
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

// Booking Card Component
function BookingCard({ booking, onEdit, onStatusChange }) {
    const statusConfig = BOOKING_STATUS_CONFIG[booking.status] || BOOKING_STATUS_CONFIG.pending;

    return (
        <div className="bg-dark-card border border-dark-border rounded-xl p-4 hover:border-gray-600 transition-all">
            <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                    {/* Kit Info */}
                    <div className="flex items-center gap-2 mb-2">
                        <span
                            className="px-2 py-0.5 rounded text-xs font-medium"
                            style={{
                                backgroundColor: booking.categoryColor ? `${booking.categoryColor}20` : '#3B82F620',
                                color: booking.categoryColor || '#3B82F6',
                            }}
                        >
                            {booking.kitCode || 'KIT'}
                        </span>
                        <h3 className="font-semibold text-white truncate">
                            {booking.kitName || 'Unknown Item'}
                        </h3>
                    </div>

                    {/* Date Range */}
                    <div className="flex items-center gap-2 text-sm text-gray-400 mb-2">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span>
                            {new Date(booking.startDate).toLocaleDateString()} - {new Date(booking.endDate).toLocaleDateString()}
                        </span>
                        <span className="text-gray-600">({booking.totalDays || 1} days)</span>
                    </div>

                    {/* Project/Purpose */}
                    {(booking.projectName || booking.purpose) && (
                        <div className="flex items-center gap-2 text-sm text-gray-400">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                            </svg>
                            <span>{booking.projectName || booking.purpose}</span>
                        </div>
                    )}
                </div>

                {/* Status & Actions */}
                <div className="flex flex-col items-end gap-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusConfig.bgClass} ${statusConfig.textClass}`}>
                        {booking.displayStatus || statusConfig.label}
                    </span>
                    {booking.daysOverdue > 0 && (
                        <span className="text-xs text-red-400">
                            {booking.daysOverdue} days overdue
                        </span>
                    )}
                </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2 mt-4 pt-3 border-t border-dark-border">
                {booking.status === BOOKING_STATUS.PENDING && (
                    <>
                        <button
                            onClick={() => onStatusChange(booking.id, BOOKING_STATUS.CONFIRMED)}
                            className="px-3 py-1.5 text-xs font-medium bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-colors"
                        >
                            Confirm
                        </button>
                        <button
                            onClick={() => onStatusChange(booking.id, BOOKING_STATUS.CANCELLED)}
                            className="px-3 py-1.5 text-xs font-medium text-gray-400 hover:text-red-400 transition-colors"
                        >
                            Cancel
                        </button>
                    </>
                )}
                {booking.status === BOOKING_STATUS.CONFIRMED && (
                    <button
                        onClick={() => onStatusChange(booking.id, BOOKING_STATUS.CHECKED_OUT)}
                        className="px-3 py-1.5 text-xs font-medium bg-green-500/20 text-green-400 rounded-lg hover:bg-green-500/30 transition-colors"
                    >
                        Check Out
                    </button>
                )}
                {booking.status === BOOKING_STATUS.CHECKED_OUT && (
                    <button
                        onClick={() => onStatusChange(booking.id, BOOKING_STATUS.RETURNED)}
                        className="px-3 py-1.5 text-xs font-medium bg-gray-500/20 text-gray-300 rounded-lg hover:bg-gray-500/30 transition-colors"
                    >
                        Mark Returned
                    </button>
                )}
                <button
                    onClick={() => onEdit(booking)}
                    className="px-3 py-1.5 text-xs font-medium text-gray-400 hover:text-white transition-colors ml-auto"
                >
                    Edit
                </button>
            </div>
        </div>
    );
}

// New Booking Modal
function NewBookingModal({ isOpen, onClose, initialDate, kitItems, projects }) {
    const createBooking = useKitBookingStore(state => state.createBooking);
    const checkAvailability = useKitBookingStore(state => state.checkAvailability);
    const [saving, setSaving] = useState(false);
    const [availability, setAvailability] = useState(null);
    const [form, setForm] = useState({
        kitItemId: '',
        quantity: 1,
        startDate: initialDate || new Date().toISOString().split('T')[0],
        endDate: initialDate || new Date().toISOString().split('T')[0],
        projectId: '',
        purpose: '',
        notes: '',
    });

    // Check availability when kit/dates change
    useEffect(() => {
        const checkAvail = async () => {
            if (form.kitItemId && form.startDate && form.endDate) {
                const result = await checkAvailability(
                    form.kitItemId,
                    form.startDate,
                    form.endDate,
                    form.quantity
                );
                setAvailability(result);
            } else {
                setAvailability(null);
            }
        };
        checkAvail();
    }, [form.kitItemId, form.startDate, form.endDate, form.quantity, checkAvailability]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.kitItemId || !form.startDate || !form.endDate) return;

        setSaving(true);
        try {
            await createBooking(form);
            onClose(true);
        } catch (err) {
            console.error('Failed to create booking:', err);
            alert('Failed to create booking');
        } finally {
            setSaving(false);
        }
    };

    if (!isOpen) return null;

    const selectedKit = kitItems.find(k => k.id === form.kitItemId);

    return (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
            <div className="bg-[#1a1f2e] border border-dark-border rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
                <div className="p-6 border-b border-dark-border">
                    <h2 className="text-xl font-bold text-white">New Kit Booking</h2>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {/* Kit Selection */}
                    <div>
                        <label className="block text-sm text-gray-400 mb-1">Equipment *</label>
                        <select
                            value={form.kitItemId}
                            onChange={(e) => setForm({ ...form, kitItemId: e.target.value })}
                            className="w-full px-3 py-2 bg-dark-bg border border-dark-border rounded-lg text-white focus:border-accent-primary focus:outline-none"
                            required
                        >
                            <option value="">Select equipment...</option>
                            {kitItems.filter(k => k.status === 'available' || k.status === 'on_job').map(kit => (
                                <option key={kit.id} value={kit.id}>
                                    {kit.kitId} - {kit.name} ({kit.categoryName})
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Quantity */}
                    {selectedKit && selectedKit.quantity > 1 && (
                        <div>
                            <label className="block text-sm text-gray-400 mb-1">
                                Quantity (max: {selectedKit.quantityAvailable || selectedKit.quantity})
                            </label>
                            <input
                                type="number"
                                min="1"
                                max={selectedKit.quantityAvailable || selectedKit.quantity}
                                value={form.quantity}
                                onChange={(e) => setForm({ ...form, quantity: parseInt(e.target.value) || 1 })}
                                className="w-full px-3 py-2 bg-dark-bg border border-dark-border rounded-lg text-white focus:border-accent-primary focus:outline-none"
                            />
                        </div>
                    )}

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
                            <label className="block text-sm text-gray-400 mb-1">End Date *</label>
                            <input
                                type="date"
                                value={form.endDate}
                                min={form.startDate}
                                onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                                className="w-full px-3 py-2 bg-dark-bg border border-dark-border rounded-lg text-white focus:border-accent-primary focus:outline-none"
                                required
                            />
                        </div>
                    </div>

                    {/* Availability Check */}
                    {availability && (
                        <div className={`p-3 rounded-lg ${availability.isAvailable ? 'bg-green-500/10 border border-green-500/30' : 'bg-red-500/10 border border-red-500/30'}`}>
                            {availability.isAvailable ? (
                                <p className="text-sm text-green-400">
                                    Available ({availability.availableQuantity} units)
                                </p>
                            ) : (
                                <div>
                                    <p className="text-sm text-red-400 mb-2">
                                        Not available for selected dates
                                    </p>
                                    {availability.conflicts?.length > 0 && (
                                        <p className="text-xs text-gray-400">
                                            Conflicts with {availability.conflicts.length} existing booking(s)
                                        </p>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Project */}
                    <div>
                        <label className="block text-sm text-gray-400 mb-1">Project</label>
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

                    {/* Purpose (if no project) */}
                    {!form.projectId && (
                        <div>
                            <label className="block text-sm text-gray-400 mb-1">Purpose</label>
                            <input
                                type="text"
                                value={form.purpose}
                                onChange={(e) => setForm({ ...form, purpose: e.target.value })}
                                placeholder="e.g., Maintenance, Testing, Personal use"
                                className="w-full px-3 py-2 bg-dark-bg border border-dark-border rounded-lg text-white placeholder-gray-500 focus:border-accent-primary focus:outline-none"
                            />
                        </div>
                    )}

                    {/* Notes */}
                    <div>
                        <label className="block text-sm text-gray-400 mb-1">Notes</label>
                        <textarea
                            value={form.notes}
                            onChange={(e) => setForm({ ...form, notes: e.target.value })}
                            rows={2}
                            placeholder="Any special requirements or notes..."
                            className="w-full px-3 py-2 bg-dark-bg border border-dark-border rounded-lg text-white placeholder-gray-500 focus:border-accent-primary focus:outline-none resize-none"
                        />
                    </div>

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
                            disabled={saving || !form.kitItemId || (availability && !availability.isAvailable)}
                            className="px-6 py-2 bg-accent-primary text-white rounded-lg font-medium hover:bg-accent-primary/90 transition-colors disabled:opacity-50"
                        >
                            {saving ? 'Creating...' : 'Create Booking'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default function KitBookingPage() {
    const { bookings, loading, getUpcoming, getOverdue, getPendingApproval, updateBooking, getStats } = useKitBookingStore();
    const { items: kitItems } = useKitStore();
    const { projects } = useProjectStore();

    const [viewMode, setViewMode] = useState('calendar'); // 'calendar' | 'list'
    const [selectedDate, setSelectedDate] = useState(null);
    const [showNewModal, setShowNewModal] = useState(false);
    const [statusFilter, setStatusFilter] = useState('all');

    const stats = getStats();
    const upcoming = getUpcoming();
    const overdue = getOverdue();
    const pendingApproval = getPendingApproval();

    // Filter bookings for list view
    const filteredBookings = useMemo(() => {
        if (statusFilter === 'all') return bookings;
        if (statusFilter === 'upcoming') return upcoming;
        if (statusFilter === 'overdue') return overdue;
        if (statusFilter === 'pending') return pendingApproval;
        return bookings.filter(b => b.status === statusFilter);
    }, [bookings, statusFilter, upcoming, overdue, pendingApproval]);

    // Bookings for selected date
    const selectedDateBookings = useMemo(() => {
        if (!selectedDate) return [];
        return bookings.filter(b =>
            b.startDate <= selectedDate && b.endDate >= selectedDate &&
            b.status !== BOOKING_STATUS.CANCELLED
        );
    }, [bookings, selectedDate]);

    const handleStatusChange = async (bookingId, newStatus) => {
        try {
            await updateBooking(bookingId, { status: newStatus });
        } catch (err) {
            console.error('Failed to update status:', err);
            alert('Failed to update booking status');
        }
    };

    const handleEditBooking = (booking) => {
        // For now, just log - could open an edit modal
        console.log('Edit booking:', booking);
    };

    return (
        <div className="p-4 lg:p-6 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-white">Kit Bookings</h1>
                    <p className="text-gray-400 text-sm">Schedule and track equipment usage</p>
                </div>
                <button
                    onClick={() => setShowNewModal(true)}
                    className="px-4 py-2 bg-accent-primary text-white rounded-lg font-medium hover:bg-accent-primary/90 transition-colors flex items-center gap-2"
                >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    New Booking
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-4 mb-6">
                <div className="bg-dark-card border border-dark-border rounded-xl p-4">
                    <p className="text-2xl font-bold text-white">{stats.active}</p>
                    <p className="text-sm text-gray-400">Active</p>
                </div>
                <div className="bg-dark-card border border-dark-border rounded-xl p-4">
                    <p className="text-2xl font-bold text-amber-400">{stats.pending}</p>
                    <p className="text-sm text-gray-400">Pending</p>
                </div>
                <div className="bg-dark-card border border-dark-border rounded-xl p-4">
                    <p className="text-2xl font-bold text-green-400">{stats.checkedOut}</p>
                    <p className="text-sm text-gray-400">Checked Out</p>
                </div>
                <div className="bg-dark-card border border-dark-border rounded-xl p-4">
                    <p className="text-2xl font-bold text-red-400">{stats.overdue}</p>
                    <p className="text-sm text-gray-400">Overdue</p>
                </div>
                <div className="bg-dark-card border border-dark-border rounded-xl p-4">
                    <p className="text-2xl font-bold text-blue-400">{stats.upcomingWeek}</p>
                    <p className="text-sm text-gray-400">This Week</p>
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
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="px-3 py-2 bg-dark-card border border-dark-border rounded-lg text-white focus:border-accent-primary focus:outline-none"
                    >
                        <option value="all">All Bookings</option>
                        <option value="upcoming">Upcoming</option>
                        <option value="pending">Pending Approval</option>
                        <option value="overdue">Overdue</option>
                        <option value={BOOKING_STATUS.CONFIRMED}>Confirmed</option>
                        <option value={BOOKING_STATUS.CHECKED_OUT}>Checked Out</option>
                        <option value={BOOKING_STATUS.RETURNED}>Returned</option>
                        <option value={BOOKING_STATUS.CANCELLED}>Cancelled</option>
                    </select>
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
                        <BookingCalendar
                            bookings={bookings}
                            onDateClick={setSelectedDate}
                            selectedDate={selectedDate}
                        />
                    </div>

                    {/* Selected Date Bookings */}
                    <div>
                        <h3 className="text-lg font-semibold text-white mb-4">
                            {selectedDate
                                ? `Bookings for ${new Date(selectedDate).toLocaleDateString()}`
                                : 'Select a date to view bookings'}
                        </h3>
                        <div className="space-y-4">
                            {selectedDateBookings.length > 0 ? (
                                selectedDateBookings.map(booking => (
                                    <BookingCard
                                        key={booking.id}
                                        booking={booking}
                                        onEdit={handleEditBooking}
                                        onStatusChange={handleStatusChange}
                                    />
                                ))
                            ) : selectedDate ? (
                                <div className="text-center py-8 text-gray-500">
                                    <p>No bookings for this date</p>
                                    <button
                                        onClick={() => setShowNewModal(true)}
                                        className="mt-2 text-accent-primary hover:text-accent-primary/80"
                                    >
                                        Create booking
                                    </button>
                                </div>
                            ) : (
                                <div className="text-center py-8 text-gray-500">
                                    <p>Click on a date to view bookings</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* List View */}
            {!loading && viewMode === 'list' && (
                <div className="space-y-4">
                    {filteredBookings.length > 0 ? (
                        filteredBookings.map(booking => (
                            <BookingCard
                                key={booking.id}
                                booking={booking}
                                onEdit={handleEditBooking}
                                onStatusChange={handleStatusChange}
                            />
                        ))
                    ) : (
                        <div className="text-center py-12 text-gray-500">
                            <svg className="w-16 h-16 mx-auto mb-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <h3 className="text-lg font-medium text-white mb-2">No bookings found</h3>
                            <p className="mb-4">Create your first equipment booking to get started</p>
                            <button
                                onClick={() => setShowNewModal(true)}
                                className="px-4 py-2 bg-accent-primary text-white rounded-lg font-medium hover:bg-accent-primary/90 transition-colors"
                            >
                                New Booking
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* New Booking Modal */}
            <NewBookingModal
                isOpen={showNewModal}
                onClose={(success) => {
                    setShowNewModal(false);
                    if (success) setSelectedDate(null);
                }}
                initialDate={selectedDate}
                kitItems={kitItems}
                projects={projects}
            />
        </div>
    );
}
