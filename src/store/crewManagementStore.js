/**
 * Crew Management Store
 *
 * Consolidated store combining:
 * - crewStore (crew member database)
 * - crewBookingStore (crew bookings/assignments)
 *
 * This file provides a unified interface while maintaining backward compatibility
 * through re-exports of the original stores.
 *
 * MIGRATION GUIDE:
 * Old: import { useCrewStore } from './crewStore'
 * New: import { useCrewStore } from './crewManagementStore'
 *
 * Or use the unified hook:
 * import { useCrewManagement } from './crewManagementStore'
 */

// Re-export all original stores for backward compatibility
export {
    useCrewStore,
    CREW_DEPARTMENTS,
    AVAILABILITY_STATUS,
} from './crewStore';

export {
    useCrewBookingStore,
    CREW_BOOKING_STATUSES,
    calculateBookingCost,
} from './crewBookingStore';

/**
 * Unified crew management hook
 * Provides access to all crew management functionality
 */
export function useCrewManagement() {
    // Dynamic imports to avoid circular dependencies
    const { useCrewStore } = require('./crewStore');
    const { useCrewBookingStore } = require('./crewBookingStore');

    const crewStore = useCrewStore();
    const bookingStore = useCrewBookingStore();

    return {
        // Crew members
        crew: crewStore.crew,
        loadCrew: crewStore.initialize,
        addCrew: crewStore.addCrew,
        updateCrew: crewStore.updateCrew,
        deleteCrew: crewStore.deleteCrew,
        toggleFavorite: crewStore.toggleFavorite,
        updateAvailability: crewStore.updateAvailability,
        searchCrew: crewStore.searchCrew,
        filterByDepartment: crewStore.filterByDepartment,
        filterByAvailability: crewStore.filterByAvailability,
        getCrewById: crewStore.getCrewById,
        getFavorites: crewStore.getFavorites,
        getCrewStats: crewStore.getStats,

        // Crew bookings
        bookings: bookingStore.bookings,
        loadBookings: bookingStore.initialize,
        createBooking: bookingStore.createBooking,
        createFromCrew: bookingStore.createFromCrew,
        syncFromCallSheet: bookingStore.syncFromCallSheet,
        updateBooking: bookingStore.updateBooking,
        updateBookingStatus: bookingStore.updateStatus,
        markAsPaid: bookingStore.markAsPaid,
        deleteBooking: bookingStore.deleteBooking,
        deleteByCallSheet: bookingStore.deleteByCallSheet,
        getBookingById: bookingStore.getBookingById,
        getBookingsByProject: bookingStore.getBookingsByProject,
        getBookingsByCrew: bookingStore.getBookingsByCrew,
        getBookingsByCallSheet: bookingStore.getBookingsByCallSheet,
        getProjectCrewCosts: bookingStore.getProjectCrewCosts,
        getBookingStats: bookingStore.getStats,
        checkCrewAvailability: bookingStore.getCrewAvailability,

        // Combined operations
        getCrewWithBookings: (crewId) => {
            const member = crewStore.getCrewById(crewId);
            const memberBookings = bookingStore.getBookingsByCrew(crewId);
            return member ? { ...member, bookings: memberBookings } : null;
        },

        getAvailableCrew: (startDate, endDate) => {
            return crewStore.crew.filter(member => {
                if (member.availabilityStatus === 'unavailable') return false;
                const { isAvailable } = bookingStore.getCrewAvailability(member.id, startDate, endDate);
                return isAvailable;
            });
        },

        // Loading states
        loading: crewStore.loading || bookingStore.loading,
        errors: {
            crew: crewStore.error,
            booking: bookingStore.error,
        },

        // Initialize all
        initializeAll: async () => {
            await Promise.all([
                crewStore.initialize(),
                bookingStore.initialize(),
            ]);
        },

        // Cleanup all
        cleanupAll: () => {
            crewStore.cleanup();
            bookingStore.cleanup();
        },
    };
}
