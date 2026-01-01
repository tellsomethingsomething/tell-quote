import { supabase, isSupabaseConfigured } from '../../../lib/supabase';
import { useCrewBookingStore } from '../../crewBookingStore';
import logger from '../../../utils/logger';
import { fromDbFormat, toDbFormat } from '../callSheetFormatters';
import { CALL_SHEET_STATUS } from '../callSheetConstants';

export const createCrudSlice = (set, get) => ({
    // Create new call sheet
    createCallSheet: async (data) => {
        if (!isSupabaseConfigured()) {
            throw new Error('Supabase not configured');
        }

        const dbData = toDbFormat(data);

        const { data: result, error } = await supabase
            .from('call_sheets')
            .insert(dbData)
            .select()
            .single();

        if (error) throw error;

        const newCallSheet = fromDbFormat(result);
        set((state) => ({
            callSheets: [...state.callSheets, newCallSheet].sort(
                (a, b) => new Date(a.shootDate) - new Date(b.shootDate)
            ),
        }));

        return newCallSheet;
    },

    // Update call sheet
    updateCallSheet: async (id, updates) => {
        if (!isSupabaseConfigured()) {
            throw new Error('Supabase not configured');
        }

        const dbUpdates = toDbFormat(updates);

        const { data, error } = await supabase
            .from('call_sheets')
            .update(dbUpdates)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        const updated = fromDbFormat(data);
        set((state) => ({
            callSheets: state.callSheets.map(cs => cs.id === id ? { ...cs, ...updated } : cs),
            currentCallSheet: state.currentCallSheet?.id === id ? { ...state.currentCallSheet, ...updated } : state.currentCallSheet,
        }));

        return updated;
    },

    // Delete call sheet
    deleteCallSheet: async (id) => {
        if (!isSupabaseConfigured()) {
            throw new Error('Supabase not configured');
        }

        // Delete associated crew bookings first (hidden P&L feature)
        try {
            const crewBookingStore = useCrewBookingStore.getState();
            await crewBookingStore.deleteByCallSheet(id);
        } catch (bookingError) {
            logger.warn('Failed to delete crew bookings for call sheet:', bookingError);
        }

        const { error } = await supabase
            .from('call_sheets')
            .delete()
            .eq('id', id);

        if (error) throw error;

        set((state) => ({
            callSheets: state.callSheets.filter(cs => cs.id !== id),
            currentCallSheet: state.currentCallSheet?.id === id ? null : state.currentCallSheet,
        }));
    },

    // Publish call sheet
    publishCallSheet: async (id, userId = null) => {
        return get().updateCallSheet(id, {
            status: CALL_SHEET_STATUS.PUBLISHED,
            publishedAt: new Date().toISOString(),
            publishedBy: userId,
        });
    },

    // Mark as completed
    completeCallSheet: async (id, actualWrap = null) => {
        return get().updateCallSheet(id, {
            status: CALL_SHEET_STATUS.COMPLETED,
            actualWrap,
        });
    },

    // Duplicate call sheet for next day
    duplicateCallSheet: async (id, newShootDate, newDayNumber = null) => {
        if (!isSupabaseConfigured()) {
            throw new Error('Supabase not configured');
        }

        try {
            const { data, error } = await supabase.rpc('duplicate_call_sheet', {
                p_call_sheet_id: id,
                p_new_shoot_date: newShootDate,
                p_new_day_number: newDayNumber,
            });

            if (error) throw error;

            // Reload call sheets
            await get().initialize();

            return data;
        } catch (e) {
            logger.error('Failed to duplicate call sheet:', e);
            throw e;
        }
    },
});
