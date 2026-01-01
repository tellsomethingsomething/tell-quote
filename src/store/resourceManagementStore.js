/**
 * Resource Management Store
 *
 * Consolidated store combining:
 * - kitStore (equipment inventory)
 * - kitBookingStore (equipment bookings)
 * - resourceStore (talents, locations, vendors)
 *
 * This file provides a unified interface while maintaining backward compatibility
 * through re-exports of the original stores.
 *
 * MIGRATION GUIDE:
 * Old: import { useKitStore } from './kitStore'
 * New: import { useKitStore } from './resourceManagementStore'
 *
 * Or use the unified hook:
 * import { useResourceManagement } from './resourceManagementStore'
 */

// Re-export all original stores for backward compatibility
export {
    useKitStore,
    KIT_STATUS,
    KIT_STATUS_CONFIG,
    KIT_CONDITION,
    KIT_CONDITION_CONFIG,
    DEFAULT_CATEGORIES,
    DEFAULT_LOCATIONS,
} from './kitStore';

export {
    useKitBookingStore,
    BOOKING_STATUS,
    BOOKING_STATUS_CONFIG,
} from './kitBookingStore';

export {
    useResourceStore,
    TALENT_TYPES,
    TALENT_STATUS,
    LOCATION_TYPES,
    LOCATION_STATUS,
    VENDOR_TYPES,
    VENDOR_RATING,
} from './resourceStore';

/**
 * Unified resource management hook
 * Provides access to all resource management functionality
 */
export function useResourceManagement() {
    // Dynamic imports to avoid circular dependencies
    const { useKitStore } = require('./kitStore');
    const { useKitBookingStore } = require('./kitBookingStore');
    const { useResourceStore } = require('./resourceStore');

    const kitStore = useKitStore();
    const bookingStore = useKitBookingStore();
    const resourceStore = useResourceStore();

    return {
        // Kit equipment
        kits: kitStore.items,
        kitCategories: kitStore.categories,
        kitLocations: kitStore.locations,
        loadKits: kitStore.initialize,
        addKit: kitStore.addItem,
        updateKit: kitStore.updateItem,
        deleteKit: kitStore.deleteItem,
        getKitStats: kitStore.getStats,

        // Kit bookings
        bookings: bookingStore.bookings,
        loadBookings: bookingStore.initialize,
        createBooking: bookingStore.createBooking,
        updateBooking: bookingStore.updateBooking,
        cancelBooking: bookingStore.cancelBooking,
        checkAvailability: bookingStore.checkAvailability,
        getUpcomingBookings: bookingStore.getUpcoming,
        getOverdueBookings: bookingStore.getOverdue,
        getBookingStats: bookingStore.getStats,

        // Production resources (talents, locations, vendors)
        talents: resourceStore.talents,
        locations: resourceStore.locations,
        vendors: resourceStore.vendors,
        loadTalents: resourceStore.loadTalents,
        loadLocations: resourceStore.loadLocations,
        loadVendors: resourceStore.loadVendors,
        createTalent: resourceStore.createTalent,
        updateTalent: resourceStore.updateTalent,
        deleteTalent: resourceStore.deleteTalent,
        createLocation: resourceStore.createLocation,
        updateLocation: resourceStore.updateLocation,
        deleteLocation: resourceStore.deleteLocation,
        createVendor: resourceStore.createVendor,
        updateVendor: resourceStore.updateVendor,
        deleteVendor: resourceStore.deleteVendor,
        searchTalents: resourceStore.searchTalents,
        searchLocations: resourceStore.searchLocations,
        searchVendors: resourceStore.searchVendors,

        // Loading states
        loading: kitStore.loading || bookingStore.loading || resourceStore.loading,
        errors: {
            kit: kitStore.error,
            booking: bookingStore.error,
            resource: resourceStore.error,
        },

        // Initialize all resources
        initializeAll: async () => {
            await Promise.all([
                kitStore.initialize(),
                bookingStore.initialize(),
                resourceStore.initialize(),
            ]);
        },
    };
}
