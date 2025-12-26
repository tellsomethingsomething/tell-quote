import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

// Booking statuses
export const CREW_BOOKING_STATUSES = {
    pending: { label: 'Pending', color: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20' },
    confirmed: { label: 'Confirmed', color: 'text-blue-400 bg-blue-500/10 border-blue-500/20' },
    in_progress: { label: 'In Progress', color: 'text-purple-400 bg-purple-500/10 border-purple-500/20' },
    completed: { label: 'Completed', color: 'text-green-400 bg-green-500/10 border-green-500/20' },
    cancelled: { label: 'Cancelled', color: 'text-gray-500 bg-gray-600/10 border-gray-600/20' },
};

// Convert DB booking to local format
function fromDbFormat(booking) {
    return {
        id: booking.id,
        crewId: booking.crew_id,
        projectId: booking.project_id,
        callSheetId: booking.call_sheet_id,
        crewName: booking.crew_name || '',
        crewRole: booking.crew_role || '',
        startDate: booking.start_date,
        endDate: booking.end_date,
        dayRate: parseFloat(booking.day_rate) || 0,
        days: parseFloat(booking.days) || 1,
        overtimeHours: parseFloat(booking.overtime_hours) || 0,
        overtimeRate: parseFloat(booking.overtime_rate) || 0,
        totalCost: parseFloat(booking.total_cost) || 0,
        currency: booking.currency || 'USD',
        status: booking.status || 'pending',
        isPaid: booking.is_paid || false,
        paidDate: booking.paid_date,
        poNumber: booking.po_number || '',
        notes: booking.notes || '',
        createdAt: booking.created_at,
        updatedAt: booking.updated_at,
    };
}

// Convert local booking to DB format
function toDbFormat(booking) {
    return {
        crew_id: booking.crewId || null,
        project_id: booking.projectId || null,
        call_sheet_id: booking.callSheetId || null,
        crew_name: booking.crewName || '',
        crew_role: booking.crewRole || '',
        start_date: booking.startDate || null,
        end_date: booking.endDate || null,
        day_rate: booking.dayRate || 0,
        days: booking.days || 1,
        overtime_hours: booking.overtimeHours || 0,
        overtime_rate: booking.overtimeRate || 0,
        total_cost: booking.totalCost || 0,
        currency: booking.currency || 'USD',
        status: booking.status || 'pending',
        is_paid: booking.isPaid || false,
        paid_date: booking.paidDate || null,
        po_number: booking.poNumber || '',
        notes: booking.notes || '',
    };
}

// Calculate total cost for a booking
export function calculateBookingCost(booking) {
    const baseCost = (booking.dayRate || 0) * (booking.days || 1);
    const overtimeCost = (booking.overtimeHours || 0) * (booking.overtimeRate || 0);
    return baseCost + overtimeCost;
}

// Generate PO number
function generatePONumber(existingBookings) {
    const year = new Date().getFullYear();
    const prefix = `PO-${year}-`;

    const existingNumbers = existingBookings
        .map(b => b.poNumber)
        .filter(num => num?.startsWith(prefix))
        .map(num => parseInt(num.replace(prefix, ''), 10))
        .filter(n => !isNaN(n));

    const maxNum = existingNumbers.length > 0 ? Math.max(...existingNumbers) : 0;
    return `${prefix}${String(maxNum + 1).padStart(4, '0')}`;
}

export const useCrewBookingStore = create(
    subscribeWithSelector((set, get) => ({
        bookings: [],
        loading: false,
        error: null,
        realtimeSubscription: null,

        // Initialize - load from Supabase and subscribe to realtime
        initialize: async () => {
            if (!isSupabaseConfigured()) {
                set({ loading: false, error: 'Supabase not configured' });
                return;
            }

            set({ loading: true, error: null });

            try {
                // Fetch all crew bookings
                const { data, error } = await supabase
                    .from('crew_bookings')
                    .select('*')
                    .order('start_date', { ascending: false });

                if (error) throw error;

                const bookings = (data || []).map(fromDbFormat);
                set({ bookings, loading: false });

                // Subscribe to realtime updates
                const subscription = supabase
                    .channel('crew-bookings-changes')
                    .on('postgres_changes', { event: '*', schema: 'public', table: 'crew_bookings' }, (payload) => {
                        const { eventType, new: newRecord, old: oldRecord } = payload;
                        const state = get();

                        if (eventType === 'INSERT') {
                            const newBooking = fromDbFormat(newRecord);
                            if (!state.bookings.find(b => b.id === newBooking.id)) {
                                set({ bookings: [newBooking, ...state.bookings] });
                            }
                        } else if (eventType === 'UPDATE') {
                            const updatedBooking = fromDbFormat(newRecord);
                            set({
                                bookings: state.bookings.map(b =>
                                    b.id === updatedBooking.id ? updatedBooking : b
                                ),
                            });
                        } else if (eventType === 'DELETE') {
                            set({
                                bookings: state.bookings.filter(b => b.id !== oldRecord.id),
                            });
                        }
                    })
                    .subscribe();

                set({ realtimeSubscription: subscription });
            } catch (error) {
                console.error('Failed to initialize crew bookings:', error);
                set({ error: error.message, loading: false });
            }
        },

        // Create new crew booking
        createBooking: async (bookingData) => {
            if (!isSupabaseConfigured()) {
                console.error('Supabase not configured');
                return null;
            }

            try {
                const state = get();
                const poNumber = bookingData.poNumber || generatePONumber(state.bookings);
                const totalCost = calculateBookingCost(bookingData);

                const newBooking = {
                    ...bookingData,
                    poNumber,
                    totalCost,
                    status: bookingData.status || 'pending',
                };

                const { data, error } = await supabase
                    .from('crew_bookings')
                    .insert(toDbFormat(newBooking))
                    .select()
                    .single();

                if (error) throw error;

                const created = fromDbFormat(data);
                set({ bookings: [created, ...state.bookings] });
                return created;
            } catch (error) {
                console.error('Failed to create crew booking:', error);
                return null;
            }
        },

        // Create booking from crew member for a project
        createFromCrew: async (crew, projectId, dates = {}) => {
            const bookingData = {
                crewId: crew.id,
                projectId,
                crewName: crew.name,
                crewRole: crew.role || crew.department || '',
                dayRate: crew.dayRate || crew.rate || 0,
                currency: crew.currency || 'USD',
                startDate: dates.startDate || new Date().toISOString().split('T')[0],
                endDate: dates.endDate || dates.startDate || new Date().toISOString().split('T')[0],
                days: dates.days || 1,
            };

            return get().createBooking(bookingData);
        },

        // Sync bookings from call sheet
        syncFromCallSheet: async (callSheet, projectId) => {
            if (!callSheet?.crew || callSheet.crew.length === 0) return [];

            const state = get();
            const createdBookings = [];

            for (const crewMember of callSheet.crew) {
                // Check if booking already exists for this crew + call sheet
                const existing = state.bookings.find(
                    b => b.callSheetId === callSheet.id && b.crewId === crewMember.id
                );

                if (!existing) {
                    const booking = await get().createBooking({
                        crewId: crewMember.id,
                        projectId: projectId || callSheet.projectId,
                        callSheetId: callSheet.id,
                        crewName: crewMember.name,
                        crewRole: crewMember.role || crewMember.department || '',
                        dayRate: crewMember.dayRate || crewMember.rate || 0,
                        days: 1, // Call sheet is typically 1 day
                        startDate: callSheet.date || callSheet.shootDate,
                        endDate: callSheet.date || callSheet.shootDate,
                        status: 'confirmed',
                    });

                    if (booking) createdBookings.push(booking);
                }
            }

            return createdBookings;
        },

        // Update booking
        updateBooking: async (id, updates) => {
            if (!isSupabaseConfigured()) return false;

            try {
                // Recalculate total if rate/days changed
                if (updates.dayRate !== undefined || updates.days !== undefined ||
                    updates.overtimeHours !== undefined || updates.overtimeRate !== undefined) {
                    const existing = get().bookings.find(b => b.id === id);
                    const merged = { ...existing, ...updates };
                    updates.totalCost = calculateBookingCost(merged);
                }

                const { error } = await supabase
                    .from('crew_bookings')
                    .update(toDbFormat(updates))
                    .eq('id', id);

                if (error) throw error;

                set({
                    bookings: get().bookings.map(b =>
                        b.id === id ? { ...b, ...updates } : b
                    ),
                });
                return true;
            } catch (error) {
                console.error('Failed to update crew booking:', error);
                return false;
            }
        },

        // Update booking status
        updateStatus: async (id, status) => {
            const updates = { status };

            if (status === 'completed') {
                updates.endDate = updates.endDate || new Date().toISOString().split('T')[0];
            }

            return get().updateBooking(id, updates);
        },

        // Mark as paid
        markAsPaid: async (id) => {
            return get().updateBooking(id, {
                isPaid: true,
                paidDate: new Date().toISOString().split('T')[0],
            });
        },

        // Delete booking
        deleteBooking: async (id) => {
            if (!isSupabaseConfigured()) return false;

            try {
                const { error } = await supabase
                    .from('crew_bookings')
                    .delete()
                    .eq('id', id);

                if (error) throw error;

                set({ bookings: get().bookings.filter(b => b.id !== id) });
                return true;
            } catch (error) {
                console.error('Failed to delete crew booking:', error);
                return false;
            }
        },

        // Delete bookings by call sheet
        deleteByCallSheet: async (callSheetId) => {
            if (!isSupabaseConfigured()) return false;

            try {
                const { error } = await supabase
                    .from('crew_bookings')
                    .delete()
                    .eq('call_sheet_id', callSheetId);

                if (error) throw error;

                set({
                    bookings: get().bookings.filter(b => b.callSheetId !== callSheetId),
                });
                return true;
            } catch (error) {
                console.error('Failed to delete crew bookings by call sheet:', error);
                return false;
            }
        },

        // Get booking by ID
        getBookingById: (id) => {
            return get().bookings.find(b => b.id === id);
        },

        // Get bookings by project
        getBookingsByProject: (projectId) => {
            return get().bookings.filter(b => b.projectId === projectId);
        },

        // Get bookings by crew member
        getBookingsByCrew: (crewId) => {
            return get().bookings.filter(b => b.crewId === crewId);
        },

        // Get bookings by call sheet
        getBookingsByCallSheet: (callSheetId) => {
            return get().bookings.filter(b => b.callSheetId === callSheetId);
        },

        // Get project crew costs (for P&L)
        getProjectCrewCosts: (projectId) => {
            const projectBookings = get().bookings.filter(
                b => b.projectId === projectId && b.status !== 'cancelled'
            );

            return {
                totalCost: projectBookings.reduce((sum, b) => sum + (b.totalCost || 0), 0),
                paidCost: projectBookings
                    .filter(b => b.isPaid)
                    .reduce((sum, b) => sum + (b.totalCost || 0), 0),
                unpaidCost: projectBookings
                    .filter(b => !b.isPaid)
                    .reduce((sum, b) => sum + (b.totalCost || 0), 0),
                bookingsCount: projectBookings.length,
                confirmedCount: projectBookings.filter(b => b.status === 'confirmed').length,
                completedCount: projectBookings.filter(b => b.status === 'completed').length,
            };
        },

        // Get crew booking stats
        getStats: () => {
            const bookings = get().bookings;
            const now = new Date();
            const thisMonth = now.getMonth();
            const thisYear = now.getFullYear();

            const thisMonthBookings = bookings.filter(b => {
                if (!b.startDate) return false;
                const date = new Date(b.startDate);
                return date.getMonth() === thisMonth && date.getFullYear() === thisYear;
            });

            const activeBookings = bookings.filter(
                b => b.status === 'confirmed' || b.status === 'in_progress'
            );

            return {
                total: bookings.length,
                thisMonth: thisMonthBookings.length,
                active: activeBookings.length,
                pending: bookings.filter(b => b.status === 'pending').length,
                completed: bookings.filter(b => b.status === 'completed').length,
                totalCost: bookings
                    .filter(b => b.status !== 'cancelled')
                    .reduce((sum, b) => sum + (b.totalCost || 0), 0),
                thisMonthCost: thisMonthBookings
                    .filter(b => b.status !== 'cancelled')
                    .reduce((sum, b) => sum + (b.totalCost || 0), 0),
                unpaidTotal: bookings
                    .filter(b => !b.isPaid && b.status !== 'cancelled')
                    .reduce((sum, b) => sum + (b.totalCost || 0), 0),
            };
        },

        // Get crew availability for date range
        getCrewAvailability: (crewId, startDate, endDate) => {
            const bookings = get().bookings.filter(b => {
                if (b.crewId !== crewId || b.status === 'cancelled') return false;
                if (!b.startDate || !b.endDate) return false;

                const bStart = new Date(b.startDate);
                const bEnd = new Date(b.endDate);
                const start = new Date(startDate);
                const end = new Date(endDate);

                // Check for overlap
                return bStart <= end && bEnd >= start;
            });

            return {
                isAvailable: bookings.length === 0,
                conflictingBookings: bookings,
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
