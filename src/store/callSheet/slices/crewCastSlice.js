import { supabase, isSupabaseConfigured } from '../../../lib/supabase';
import { useCrewBookingStore } from '../../crewBookingStore';
import logger from '../../../utils/logger';
import { crewFromDbFormat, castFromDbFormat } from '../callSheetFormatters';

export const createCrewCastSlice = (set, get) => ({
    // Add crew member to call sheet
    addCrewMember: async (callSheetId, crewData) => {
        if (!isSupabaseConfigured()) {
            throw new Error('Supabase not configured');
        }

        const dbData = {
            call_sheet_id: callSheetId,
            crew_id: crewData.crewId,
            name: crewData.name,
            role_title: crewData.roleTitle,
            department: crewData.department,
            phone: crewData.phone,
            email: crewData.email,
            call_time: crewData.callTime,
            call_location: crewData.callLocation,
            transport_mode: crewData.transportMode,
            pickup_time: crewData.pickupTime,
            pickup_location: crewData.pickupLocation,
            notes: crewData.notes,
            sort_order: crewData.sortOrder || 0,
        };

        const { data, error } = await supabase
            .from('call_sheet_crew')
            .insert(dbData)
            .select()
            .single();

        if (error) throw error;

        const newCrew = crewFromDbFormat(data);
        set((state) => ({
            currentCrew: [...state.currentCrew, newCrew],
        }));

        // Auto-create crew booking for P&L tracking (hidden feature)
        try {
            const callSheet = get().currentCallSheet;
            if (callSheet) {
                const crewBookingStore = useCrewBookingStore.getState();
                await crewBookingStore.createBooking({
                    crewId: crewData.crewId || null,
                    projectId: callSheet.projectId || null,
                    callSheetId: callSheetId,
                    crewName: crewData.name || '',
                    crewRole: crewData.roleTitle || crewData.department || '',
                    dayRate: crewData.dayRate || 0,
                    days: 1, // Call sheet is typically 1 day
                    startDate: callSheet.shootDate,
                    endDate: callSheet.shootDate,
                    status: 'confirmed',
                    currency: crewData.currency || 'USD',
                });
            }
        } catch (bookingError) {
            // Don't fail the crew addition if booking creation fails
            logger.warn('Failed to create crew booking:', bookingError);
        }

        return newCrew;
    },

    // Update crew member
    updateCrewMember: async (id, updates) => {
        if (!isSupabaseConfigured()) {
            throw new Error('Supabase not configured');
        }

        const dbUpdates = {};
        if (updates.name !== undefined) dbUpdates.name = updates.name;
        if (updates.roleTitle !== undefined) dbUpdates.role_title = updates.roleTitle;
        if (updates.department !== undefined) dbUpdates.department = updates.department;
        if (updates.phone !== undefined) dbUpdates.phone = updates.phone;
        if (updates.email !== undefined) dbUpdates.email = updates.email;
        if (updates.callTime !== undefined) dbUpdates.call_time = updates.callTime;
        if (updates.callLocation !== undefined) dbUpdates.call_location = updates.callLocation;
        if (updates.transportMode !== undefined) dbUpdates.transport_mode = updates.transportMode;
        if (updates.pickupTime !== undefined) dbUpdates.pickup_time = updates.pickupTime;
        if (updates.pickupLocation !== undefined) dbUpdates.pickup_location = updates.pickupLocation;
        if (updates.notes !== undefined) dbUpdates.notes = updates.notes;
        if (updates.confirmed !== undefined) {
            dbUpdates.confirmed = updates.confirmed;
            dbUpdates.confirmed_at = updates.confirmed ? new Date().toISOString() : null;
        }
        if (updates.sortOrder !== undefined) dbUpdates.sort_order = updates.sortOrder;

        const { data, error } = await supabase
            .from('call_sheet_crew')
            .update(dbUpdates)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        const updated = crewFromDbFormat(data);
        set((state) => ({
            currentCrew: state.currentCrew.map(c => c.id === id ? { ...c, ...updated } : c),
        }));

        return updated;
    },

    // Remove crew member
    removeCrewMember: async (id) => {
        if (!isSupabaseConfigured()) {
            throw new Error('Supabase not configured');
        }

        // Get crew member details before deletion for booking cleanup
        const crewMember = get().currentCrew.find(c => c.id === id);
        const callSheet = get().currentCallSheet;

        const { error } = await supabase
            .from('call_sheet_crew')
            .delete()
            .eq('id', id);

        if (error) throw error;

        set((state) => ({
            currentCrew: state.currentCrew.filter(c => c.id !== id),
        }));

        // Delete associated crew booking (hidden P&L feature)
        if (crewMember && callSheet) {
            try {
                const crewBookingStore = useCrewBookingStore.getState();
                const bookings = crewBookingStore.getBookingsByCallSheet(callSheet.id);
                const matchingBooking = bookings.find(
                    b => b.crewId === crewMember.crewId || b.crewName === crewMember.name
                );
                if (matchingBooking) {
                    await crewBookingStore.deleteBooking(matchingBooking.id);
                }
            } catch (bookingError) {
                logger.warn('Failed to delete crew booking:', bookingError);
            }
        }
    },

    // Add cast member
    addCastMember: async (callSheetId, castData) => {
        if (!isSupabaseConfigured()) {
            throw new Error('Supabase not configured');
        }

        const dbData = {
            call_sheet_id: callSheetId,
            name: castData.name,
            character_name: castData.characterName,
            agent_contact: castData.agentContact,
            pickup_time: castData.pickupTime,
            pickup_location: castData.pickupLocation,
            makeup_call: castData.makeupCall,
            wardrobe_call: castData.wardrobeCall,
            on_set_call: castData.onSetCall,
            scenes: castData.scenes || [],
            wardrobe_notes: castData.wardrobeNotes,
            makeup_notes: castData.makeupNotes,
            notes: castData.notes,
            sort_order: castData.sortOrder || 0,
        };

        const { data, error } = await supabase
            .from('call_sheet_cast')
            .insert(dbData)
            .select()
            .single();

        if (error) throw error;

        const newCast = castFromDbFormat(data);
        set((state) => ({
            currentCast: [...state.currentCast, newCast],
        }));

        return newCast;
    },

    // Update cast member
    updateCastMember: async (id, updates) => {
        if (!isSupabaseConfigured()) {
            throw new Error('Supabase not configured');
        }

        const dbUpdates = {};
        if (updates.name !== undefined) dbUpdates.name = updates.name;
        if (updates.characterName !== undefined) dbUpdates.character_name = updates.characterName;
        if (updates.agentContact !== undefined) dbUpdates.agent_contact = updates.agentContact;
        if (updates.pickupTime !== undefined) dbUpdates.pickup_time = updates.pickupTime;
        if (updates.pickupLocation !== undefined) dbUpdates.pickup_location = updates.pickupLocation;
        if (updates.makeupCall !== undefined) dbUpdates.makeup_call = updates.makeupCall;
        if (updates.wardrobeCall !== undefined) dbUpdates.wardrobe_call = updates.wardrobeCall;
        if (updates.onSetCall !== undefined) dbUpdates.on_set_call = updates.onSetCall;
        if (updates.scenes !== undefined) dbUpdates.scenes = updates.scenes;
        if (updates.wardrobeNotes !== undefined) dbUpdates.wardrobe_notes = updates.wardrobeNotes;
        if (updates.makeupNotes !== undefined) dbUpdates.makeup_notes = updates.makeupNotes;
        if (updates.notes !== undefined) dbUpdates.notes = updates.notes;
        if (updates.confirmed !== undefined) {
            dbUpdates.confirmed = updates.confirmed;
            dbUpdates.confirmed_at = updates.confirmed ? new Date().toISOString() : null;
        }
        if (updates.sortOrder !== undefined) dbUpdates.sort_order = updates.sortOrder;

        const { data, error } = await supabase
            .from('call_sheet_cast')
            .update(dbUpdates)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        const updated = castFromDbFormat(data);
        set((state) => ({
            currentCast: state.currentCast.map(c => c.id === id ? { ...c, ...updated } : c),
        }));

        return updated;
    },

    // Remove cast member
    removeCastMember: async (id) => {
        if (!isSupabaseConfigured()) {
            throw new Error('Supabase not configured');
        }

        const { error } = await supabase
            .from('call_sheet_cast')
            .delete()
            .eq('id', id);

        if (error) throw error;

        set((state) => ({
            currentCast: state.currentCast.filter(c => c.id !== id),
        }));
    },
});
