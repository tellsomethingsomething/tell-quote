import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

// Expense categories
export const EXPENSE_CATEGORIES = [
    'Travel',
    'Equipment Rental',
    'Crew Fees',
    'Catering',
    'Transport',
    'Accommodation',
    'Insurance',
    'Permits',
    'Props & Materials',
    'Post Production',
    'Marketing',
    'Office',
    'Software',
    'Other',
];

// Convert DB expense to local format
function fromDbFormat(exp) {
    return {
        id: exp.id,
        projectId: exp.project_id,
        clientId: exp.client_id,
        category: exp.category,
        description: exp.description || '',
        amount: parseFloat(exp.amount) || 0,
        currency: exp.currency || 'USD',
        date: exp.date,
        receiptUrl: exp.receipt_url || '',
        isBillable: exp.is_billable || false,
        vendor: exp.vendor || '',
        notes: exp.notes || '',
        createdAt: exp.created_at,
        updatedAt: exp.updated_at,
    };
}

// Convert local expense to DB format
function toDbFormat(exp) {
    return {
        project_id: exp.projectId || null,
        client_id: exp.clientId || null,
        category: exp.category,
        description: exp.description || '',
        amount: exp.amount || 0,
        currency: exp.currency || 'USD',
        date: exp.date,
        receipt_url: exp.receiptUrl || null,
        is_billable: exp.isBillable || false,
        vendor: exp.vendor || '',
        notes: exp.notes || '',
    };
}

export const useExpenseStore = create(
    subscribeWithSelector((set, get) => ({
        expenses: [],
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
                // Fetch all expenses
                const { data, error } = await supabase
                    .from('expenses')
                    .select('*')
                    .order('date', { ascending: false });

                if (error) throw error;

                const expenses = (data || []).map(fromDbFormat);
                set({ expenses, loading: false });

                // Subscribe to realtime updates
                const subscription = supabase
                    .channel('expenses-changes')
                    .on('postgres_changes', { event: '*', schema: 'public', table: 'expenses' }, (payload) => {
                        const { eventType, new: newRecord, old: oldRecord } = payload;
                        const state = get();

                        if (eventType === 'INSERT') {
                            const newExpense = fromDbFormat(newRecord);
                            if (!state.expenses.find(e => e.id === newExpense.id)) {
                                set({ expenses: [newExpense, ...state.expenses] });
                            }
                        } else if (eventType === 'UPDATE') {
                            const updatedExpense = fromDbFormat(newRecord);
                            set({
                                expenses: state.expenses.map(e =>
                                    e.id === updatedExpense.id ? updatedExpense : e
                                ),
                            });
                        } else if (eventType === 'DELETE') {
                            set({
                                expenses: state.expenses.filter(e => e.id !== oldRecord.id),
                            });
                        }
                    })
                    .subscribe();

                set({ realtimeSubscription: subscription });
            } catch (error) {
                console.error('Failed to initialize expenses:', error);
                set({ error: error.message, loading: false });
            }
        },

        // Create new expense
        createExpense: async (expenseData) => {
            if (!isSupabaseConfigured()) {
                console.error('Supabase not configured');
                return null;
            }

            try {
                const newExpense = {
                    ...expenseData,
                    date: expenseData.date || new Date().toISOString().split('T')[0],
                };

                const { data, error } = await supabase
                    .from('expenses')
                    .insert(toDbFormat(newExpense))
                    .select()
                    .single();

                if (error) throw error;

                const created = fromDbFormat(data);
                set({ expenses: [created, ...get().expenses] });
                return created;
            } catch (error) {
                console.error('Failed to create expense:', error);
                return null;
            }
        },

        // Update expense
        updateExpense: async (id, updates) => {
            if (!isSupabaseConfigured()) return false;

            try {
                const { error } = await supabase
                    .from('expenses')
                    .update(toDbFormat(updates))
                    .eq('id', id);

                if (error) throw error;

                set({
                    expenses: get().expenses.map(exp =>
                        exp.id === id ? { ...exp, ...updates } : exp
                    ),
                });
                return true;
            } catch (error) {
                console.error('Failed to update expense:', error);
                return false;
            }
        },

        // Delete expense
        deleteExpense: async (id) => {
            if (!isSupabaseConfigured()) return false;

            try {
                const { error } = await supabase
                    .from('expenses')
                    .delete()
                    .eq('id', id);

                if (error) throw error;

                set({ expenses: get().expenses.filter(exp => exp.id !== id) });
                return true;
            } catch (error) {
                console.error('Failed to delete expense:', error);
                return false;
            }
        },

        // Get expense by ID
        getExpenseById: (id) => {
            return get().expenses.find(exp => exp.id === id);
        },

        // Get expenses by project
        getExpensesByProject: (projectId) => {
            return get().expenses.filter(exp => exp.projectId === projectId);
        },

        // Get expenses by client
        getExpensesByClient: (clientId) => {
            return get().expenses.filter(exp => exp.clientId === clientId);
        },

        // Get expenses by category
        getExpensesByCategory: (category) => {
            return get().expenses.filter(exp => exp.category === category);
        },

        // Get total expenses for a project
        getProjectTotal: (projectId) => {
            return get().expenses
                .filter(exp => exp.projectId === projectId)
                .reduce((sum, exp) => sum + (exp.amount || 0), 0);
        },

        // Get expense stats
        getStats: () => {
            const expenses = get().expenses;
            const now = new Date();
            const thisMonth = now.getMonth();
            const thisYear = now.getFullYear();

            const thisMonthExpenses = expenses.filter(e => {
                const date = new Date(e.date);
                return date.getMonth() === thisMonth && date.getFullYear() === thisYear;
            });

            const byCategory = EXPENSE_CATEGORIES.reduce((acc, cat) => {
                acc[cat] = expenses
                    .filter(e => e.category === cat)
                    .reduce((sum, e) => sum + (e.amount || 0), 0);
                return acc;
            }, {});

            return {
                total: expenses.reduce((sum, e) => sum + (e.amount || 0), 0),
                thisMonth: thisMonthExpenses.reduce((sum, e) => sum + (e.amount || 0), 0),
                count: expenses.length,
                thisMonthCount: thisMonthExpenses.length,
                byCategory,
                billable: expenses.filter(e => e.isBillable).reduce((sum, e) => sum + (e.amount || 0), 0),
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
