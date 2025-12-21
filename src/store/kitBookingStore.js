import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

// Booking status options
export const BOOKING_STATUS = {
    PENDING: 'pending',
    CONFIRMED: 'confirmed',
    CHECKED_OUT: 'checked_out',
    RETURNED: 'returned',
    CANCELLED: 'cancelled',
};

export const BOOKING_STATUS_CONFIG = {
    [BOOKING_STATUS.PENDING]: {
        label: 'Pending',
        color: 'amber',
        bgClass: 'bg-amber-500/20',
        textClass: 'text-amber-400',
    },
    [BOOKING_STATUS.CONFIRMED]: {
        label: 'Confirmed',
        color: 'blue',
        bgClass: 'bg-blue-500/20',
        textClass: 'text-blue-400',
    },
    [BOOKING_STATUS.CHECKED_OUT]: {
        label: 'Checked Out',
        color: 'green',
        bgClass: 'bg-green-500/20',
        textClass: 'text-green-400',
    },
    [BOOKING_STATUS.RETURNED]: {
        label: 'Returned',
        color: 'gray',
        bgClass: 'bg-gray-500/20',
        textClass: 'text-gray-400',
    },
    [BOOKING_STATUS.CANCELLED]: {
        label: 'Cancelled',
        color: 'red',
        bgClass: 'bg-red-500/20',
        textClass: 'text-red-400',
    },
};

// Convert DB format to local format
function fromDbFormat(record) {
    return {
        id: record.id,
        kitItemId: record.kit_item_id,
        quantity: record.quantity || 1,
        startDate: record.start_date,
        endDate: record.end_date,
        projectId: record.project_id,
        projectName: record.project_name || record.linked_project_name,
        purpose: record.purpose,
        status: record.status || 'pending',
        bookedBy: record.booked_by,
        bookedByName: record.booked_by_name,
        approvedBy: record.approved_by,
        collectionLocation: record.collection_location,
        returnLocation: record.return_location,
        checkedOutAt: record.checked_out_at,
        checkedOutBy: record.checked_out_by,
        returnedAt: record.returned_at,
        returnedTo: record.returned_to,
        returnCondition: record.return_condition,
        quotedRate: record.quoted_rate,
        quotedTotal: record.quoted_total,
        currency: record.currency || 'USD',
        notes: record.notes,
        internalNotes: record.internal_notes,
        createdAt: record.created_at,
        updatedAt: record.updated_at,
        // From extended view
        kitCode: record.kit_code,
        kitName: record.kit_name,
        categoryId: record.category_id,
        categoryName: record.category_name,
        categoryColor: record.category_color,
        manufacturer: record.manufacturer,
        model: record.model,
        kitLocation: record.kit_location,
        kitTotalQuantity: record.kit_total_quantity,
        dayRate: record.day_rate,
        rateCurrency: record.rate_currency,
        projectStatus: record.project_status,
        totalDays: record.total_days,
        displayStatus: record.display_status,
        daysOverdue: record.days_overdue,
    };
}

// Convert local format to DB format
function toDbFormat(booking) {
    const dbData = {};

    if (booking.kitItemId !== undefined) dbData.kit_item_id = booking.kitItemId;
    if (booking.quantity !== undefined) dbData.quantity = booking.quantity;
    if (booking.startDate !== undefined) dbData.start_date = booking.startDate;
    if (booking.endDate !== undefined) dbData.end_date = booking.endDate;
    if (booking.projectId !== undefined) dbData.project_id = booking.projectId;
    if (booking.projectName !== undefined) dbData.project_name = booking.projectName;
    if (booking.purpose !== undefined) dbData.purpose = booking.purpose;
    if (booking.status !== undefined) dbData.status = booking.status;
    if (booking.bookedBy !== undefined) dbData.booked_by = booking.bookedBy;
    if (booking.bookedByName !== undefined) dbData.booked_by_name = booking.bookedByName;
    if (booking.approvedBy !== undefined) dbData.approved_by = booking.approvedBy;
    if (booking.collectionLocation !== undefined) dbData.collection_location = booking.collectionLocation;
    if (booking.returnLocation !== undefined) dbData.return_location = booking.returnLocation;
    if (booking.checkedOutAt !== undefined) dbData.checked_out_at = booking.checkedOutAt;
    if (booking.checkedOutBy !== undefined) dbData.checked_out_by = booking.checkedOutBy;
    if (booking.returnedAt !== undefined) dbData.returned_at = booking.returnedAt;
    if (booking.returnedTo !== undefined) dbData.returned_to = booking.returnedTo;
    if (booking.returnCondition !== undefined) dbData.return_condition = booking.returnCondition;
    if (booking.quotedRate !== undefined) dbData.quoted_rate = booking.quotedRate;
    if (booking.quotedTotal !== undefined) dbData.quoted_total = booking.quotedTotal;
    if (booking.currency !== undefined) dbData.currency = booking.currency;
    if (booking.notes !== undefined) dbData.notes = booking.notes;
    if (booking.internalNotes !== undefined) dbData.internal_notes = booking.internalNotes;

    return dbData;
}

export const useKitBookingStore = create(
    subscribeWithSelector((set, get) => ({
        // State
        bookings: [],
        loading: false,
        error: null,
        realtimeSubscription: null,

        // Filters
        filters: {
            status: null,
            kitItemId: null,
            projectId: null,
            dateRange: null, // { start, end }
        },

        // Initialize - load from Supabase
        initialize: async () => {
            if (!isSupabaseConfigured()) {
                set({ loading: false, error: 'Supabase not configured' });
                return;
            }

            set({ loading: true, error: null });

            try {
                // Try extended view first, fallback to table
                let { data, error } = await supabase
                    .from('kit_bookings_extended')
                    .select('*')
                    .order('start_date', { ascending: true });

                // Fallback to regular table if view doesn't exist
                if (error && error.code === '42P01') {
                    const result = await supabase
                        .from('kit_bookings')
                        .select('*')
                        .order('start_date', { ascending: true });
                    data = result.data;
                    error = result.error;
                }

                if (error) throw error;

                const bookings = (data || []).map(fromDbFormat);
                set({ bookings, loading: false, error: null });

                // Subscribe to realtime
                get().subscribeToRealtime();

            } catch (e) {
                console.error('Failed to load kit bookings:', e);
                set({ loading: false, error: e.message });
            }
        },

        // Realtime subscription
        subscribeToRealtime: () => {
            if (!isSupabaseConfigured()) return;

            const existing = get().realtimeSubscription;
            if (existing) {
                supabase.removeChannel(existing);
            }

            const channel = supabase
                .channel('kit-bookings-realtime')
                .on(
                    'postgres_changes',
                    { event: '*', schema: 'public', table: 'kit_bookings' },
                    async (payload) => {
                        // Reload all bookings to get extended view data
                        await get().initialize();
                    }
                )
                .subscribe();

            set({ realtimeSubscription: channel });
        },

        // Create a new booking
        createBooking: async (bookingData) => {
            if (!isSupabaseConfigured()) {
                throw new Error('Supabase not configured');
            }

            const dbData = toDbFormat(bookingData);

            const { data, error } = await supabase
                .from('kit_bookings')
                .insert(dbData)
                .select()
                .single();

            if (error) throw error;

            const newBooking = fromDbFormat(data);
            set((state) => ({
                bookings: [...state.bookings, newBooking].sort((a, b) =>
                    new Date(a.startDate) - new Date(b.startDate)
                ),
            }));

            return newBooking;
        },

        // Update booking
        updateBooking: async (id, updates) => {
            if (!isSupabaseConfigured()) {
                throw new Error('Supabase not configured');
            }

            const dbUpdates = toDbFormat(updates);

            const { data, error } = await supabase
                .from('kit_bookings')
                .update(dbUpdates)
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;

            const updated = fromDbFormat(data);
            set((state) => ({
                bookings: state.bookings.map(b => b.id === id ? { ...b, ...updated } : b),
            }));

            return updated;
        },

        // Cancel booking
        cancelBooking: async (id) => {
            return get().updateBooking(id, { status: BOOKING_STATUS.CANCELLED });
        },

        // Confirm booking
        confirmBooking: async (id, approvedBy = null) => {
            return get().updateBooking(id, {
                status: BOOKING_STATUS.CONFIRMED,
                approvedBy,
            });
        },

        // Check out equipment
        checkOut: async (id, userId = null) => {
            return get().updateBooking(id, {
                status: BOOKING_STATUS.CHECKED_OUT,
                checkedOutAt: new Date().toISOString(),
                checkedOutBy: userId,
            });
        },

        // Return equipment
        returnEquipment: async (id, returnData = {}) => {
            return get().updateBooking(id, {
                status: BOOKING_STATUS.RETURNED,
                returnedAt: new Date().toISOString(),
                returnedTo: returnData.returnedTo,
                returnCondition: returnData.condition,
            });
        },

        // Delete booking (soft delete via cancel, or hard delete)
        deleteBooking: async (id, hardDelete = false) => {
            if (!isSupabaseConfigured()) {
                throw new Error('Supabase not configured');
            }

            if (hardDelete) {
                const { error } = await supabase
                    .from('kit_bookings')
                    .delete()
                    .eq('id', id);

                if (error) throw error;

                set((state) => ({
                    bookings: state.bookings.filter(b => b.id !== id),
                }));
            } else {
                await get().cancelBooking(id);
            }
        },

        // Check availability for a kit item
        checkAvailability: async (kitItemId, startDate, endDate, quantity = 1, excludeBookingId = null) => {
            if (!isSupabaseConfigured()) {
                return { isAvailable: false, availableQuantity: 0, conflicts: [] };
            }

            try {
                const { data, error } = await supabase.rpc('check_kit_availability', {
                    p_kit_item_id: kitItemId,
                    p_start_date: startDate,
                    p_end_date: endDate,
                    p_quantity: quantity,
                    p_exclude_booking_id: excludeBookingId,
                });

                if (error) throw error;

                const result = data?.[0] || { is_available: false, available_quantity: 0, conflicting_bookings: [] };
                return {
                    isAvailable: result.is_available,
                    availableQuantity: result.available_quantity,
                    conflicts: result.conflicting_bookings || [],
                };
            } catch (e) {
                console.error('Failed to check availability:', e);
                // Fallback: check locally
                const { bookings } = get();
                const conflicts = bookings.filter(b =>
                    b.kitItemId === kitItemId &&
                    b.status !== BOOKING_STATUS.CANCELLED &&
                    b.status !== BOOKING_STATUS.RETURNED &&
                    b.id !== excludeBookingId &&
                    new Date(b.startDate) <= new Date(endDate) &&
                    new Date(b.endDate) >= new Date(startDate)
                );
                return {
                    isAvailable: conflicts.length === 0,
                    availableQuantity: conflicts.length === 0 ? quantity : 0,
                    conflicts,
                };
            }
        },

        // Get bookings for a specific kit item
        getBookingsForKit: (kitItemId) => {
            const { bookings } = get();
            return bookings.filter(b => b.kitItemId === kitItemId);
        },

        // Get bookings for a specific project
        getBookingsForProject: (projectId) => {
            const { bookings } = get();
            return bookings.filter(b => b.projectId === projectId);
        },

        // Get upcoming bookings
        getUpcoming: () => {
            const { bookings } = get();
            const today = new Date().toISOString().split('T')[0];
            return bookings.filter(b =>
                b.status !== BOOKING_STATUS.CANCELLED &&
                b.status !== BOOKING_STATUS.RETURNED &&
                b.endDate >= today
            ).sort((a, b) => new Date(a.startDate) - new Date(b.startDate));
        },

        // Get overdue bookings
        getOverdue: () => {
            const { bookings } = get();
            const today = new Date().toISOString().split('T')[0];
            return bookings.filter(b =>
                b.status === BOOKING_STATUS.CHECKED_OUT &&
                b.endDate < today
            );
        },

        // Get bookings needing action (pending approval)
        getPendingApproval: () => {
            const { bookings } = get();
            return bookings.filter(b => b.status === BOOKING_STATUS.PENDING);
        },

        // Get bookings for date range (for calendar)
        getBookingsInRange: (startDate, endDate) => {
            const { bookings } = get();
            const start = new Date(startDate);
            const end = new Date(endDate);

            return bookings.filter(b => {
                const bStart = new Date(b.startDate);
                const bEnd = new Date(b.endDate);
                return bStart <= end && bEnd >= start &&
                    b.status !== BOOKING_STATUS.CANCELLED;
            });
        },

        // Get filtered bookings
        getFilteredBookings: () => {
            const { bookings, filters } = get();
            let filtered = [...bookings];

            if (filters.status) {
                filtered = filtered.filter(b => b.status === filters.status);
            }

            if (filters.kitItemId) {
                filtered = filtered.filter(b => b.kitItemId === filters.kitItemId);
            }

            if (filters.projectId) {
                filtered = filtered.filter(b => b.projectId === filters.projectId);
            }

            if (filters.dateRange?.start && filters.dateRange?.end) {
                filtered = filtered.filter(b =>
                    new Date(b.startDate) <= new Date(filters.dateRange.end) &&
                    new Date(b.endDate) >= new Date(filters.dateRange.start)
                );
            }

            return filtered;
        },

        // Set filters
        setFilters: (newFilters) => {
            set((state) => ({
                filters: { ...state.filters, ...newFilters },
            }));
        },

        // Clear filters
        clearFilters: () => {
            set({
                filters: {
                    status: null,
                    kitItemId: null,
                    projectId: null,
                    dateRange: null,
                },
            });
        },

        // Get stats
        getStats: () => {
            const { bookings } = get();
            const today = new Date().toISOString().split('T')[0];

            const active = bookings.filter(b =>
                b.status !== BOOKING_STATUS.CANCELLED &&
                b.status !== BOOKING_STATUS.RETURNED
            );

            const pending = bookings.filter(b => b.status === BOOKING_STATUS.PENDING);
            const checkedOut = bookings.filter(b => b.status === BOOKING_STATUS.CHECKED_OUT);
            const overdue = checkedOut.filter(b => b.endDate < today);

            const upcomingWeek = active.filter(b => {
                const start = new Date(b.startDate);
                const weekFromNow = new Date();
                weekFromNow.setDate(weekFromNow.getDate() + 7);
                return start >= new Date(today) && start <= weekFromNow;
            });

            return {
                total: bookings.length,
                active: active.length,
                pending: pending.length,
                checkedOut: checkedOut.length,
                overdue: overdue.length,
                upcomingWeek: upcomingWeek.length,
            };
        },

        // Cleanup
        cleanup: () => {
            const sub = get().realtimeSubscription;
            if (sub) {
                supabase.removeChannel(sub);
            }
            set({ realtimeSubscription: null });
        },
    }))
);
