import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { supabase } from '../lib/supabase';

// Sequence status
export const SEQUENCE_STATUS = {
    draft: { label: 'Draft', color: 'text-gray-400', bgColor: 'bg-gray-500/20' },
    active: { label: 'Active', color: 'text-green-400', bgColor: 'bg-green-500/20' },
    paused: { label: 'Paused', color: 'text-yellow-400', bgColor: 'bg-yellow-500/20' },
    archived: { label: 'Archived', color: 'text-red-400', bgColor: 'bg-red-500/20' },
};

// Enrollment status
export const ENROLLMENT_STATUS = {
    active: { label: 'Active', color: 'text-green-400', bgColor: 'bg-green-500/20' },
    completed: { label: 'Completed', color: 'text-blue-400', bgColor: 'bg-blue-500/20' },
    paused: { label: 'Paused', color: 'text-yellow-400', bgColor: 'bg-yellow-500/20' },
    bounced: { label: 'Bounced', color: 'text-red-400', bgColor: 'bg-red-500/20' },
    unsubscribed: { label: 'Unsubscribed', color: 'text-gray-400', bgColor: 'bg-gray-500/20' },
    replied: { label: 'Replied', color: 'text-purple-400', bgColor: 'bg-purple-500/20' },
};

// Step triggers
export const STEP_TRIGGERS = {
    delay_days: { label: 'Wait X days', icon: '⏰' },
    delay_hours: { label: 'Wait X hours', icon: '⏱️' },
    on_open: { label: 'When email opened', icon: '👁️' },
    on_click: { label: 'When link clicked', icon: '🔗' },
    on_reply: { label: 'When replied', icon: '↩️' },
    on_no_open: { label: 'If not opened after X days', icon: '❓' },
};

// Sequence categories
export const SEQUENCE_CATEGORIES = {
    sales: { label: 'Sales Outreach', icon: '💰', color: 'text-green-400' },
    followup: { label: 'Follow-up', icon: '📋', color: 'text-blue-400' },
    onboarding: { label: 'Onboarding', icon: '🎯', color: 'text-purple-400' },
    nurture: { label: 'Nurture', icon: '🌱', color: 'text-teal-400' },
    reengagement: { label: 'Re-engagement', icon: '🔄', color: 'text-amber-400' },
    event: { label: 'Event', icon: '📅', color: 'text-pink-400' },
};

export const useEmailSequenceStore = create(
    subscribeWithSelector((set, get) => ({
        // Data
        sequences: [],
        enrollments: [],
        selectedSequence: null,

        // UI state
        isLoading: false,
        isSaving: false,
        error: null,

        // ============================================================
        // INITIALIZATION
        // ============================================================

        initialize: async () => {
            await get().loadSequences();
        },

        // ============================================================
        // SEQUENCES CRUD
        // ============================================================

        loadSequences: async () => {
            set({ isLoading: true, error: null });

            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) throw new Error('Not authenticated');

                const { data, error } = await supabase
                    .from('email_sequences')
                    .select(`
                        *,
                        steps:email_sequence_steps(*)
                    `)
                    .eq('user_id', user.id)
                    .order('created_at', { ascending: false });

                if (error) throw error;

                set({ sequences: data || [], isLoading: false });
            } catch (error) {
                console.error('Failed to load sequences:', error);
                set({ isLoading: false, error: error.message });
            }
        },

        getSequence: async (sequenceId) => {
            try {
                const { data, error } = await supabase
                    .from('email_sequences')
                    .select(`
                        *,
                        steps:email_sequence_steps(*),
                        enrollments:email_sequence_enrollments(
                            *,
                            sends:email_sequence_sends(*)
                        )
                    `)
                    .eq('id', sequenceId)
                    .single();

                if (error) throw error;

                set({ selectedSequence: data });
                return { success: true, sequence: data };
            } catch (error) {
                console.error('Failed to get sequence:', error);
                return { success: false, error: error.message };
            }
        },

        createSequence: async (sequenceData) => {
            set({ isSaving: true, error: null });

            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) throw new Error('Not authenticated');

                const { data, error } = await supabase
                    .from('email_sequences')
                    .insert({
                        user_id: user.id,
                        name: sequenceData.name,
                        description: sequenceData.description,
                        category: sequenceData.category || 'sales',
                        status: 'draft',
                        settings: sequenceData.settings || {
                            sendOnWeekends: false,
                            sendTime: '09:00',
                            timezone: 'UTC',
                            stopOnReply: true,
                            stopOnMeeting: true,
                        },
                    })
                    .select()
                    .single();

                if (error) throw error;

                set({ sequences: [data, ...get().sequences], isSaving: false });
                return { success: true, sequence: data };
            } catch (error) {
                console.error('Failed to create sequence:', error);
                set({ isSaving: false, error: error.message });
                return { success: false, error: error.message };
            }
        },

        updateSequence: async (sequenceId, updates) => {
            set({ isSaving: true, error: null });

            try {
                const { data, error } = await supabase
                    .from('email_sequences')
                    .update({
                        ...updates,
                        updated_at: new Date().toISOString(),
                    })
                    .eq('id', sequenceId)
                    .select()
                    .single();

                if (error) throw error;

                set({
                    sequences: get().sequences.map(s => s.id === sequenceId ? { ...s, ...data } : s),
                    selectedSequence: get().selectedSequence?.id === sequenceId
                        ? { ...get().selectedSequence, ...data }
                        : get().selectedSequence,
                    isSaving: false,
                });

                return { success: true, sequence: data };
            } catch (error) {
                console.error('Failed to update sequence:', error);
                set({ isSaving: false, error: error.message });
                return { success: false, error: error.message };
            }
        },

        deleteSequence: async (sequenceId) => {
            try {
                const { error } = await supabase
                    .from('email_sequences')
                    .delete()
                    .eq('id', sequenceId);

                if (error) throw error;

                set({
                    sequences: get().sequences.filter(s => s.id !== sequenceId),
                    selectedSequence: get().selectedSequence?.id === sequenceId ? null : get().selectedSequence,
                });

                return { success: true };
            } catch (error) {
                console.error('Failed to delete sequence:', error);
                return { success: false, error: error.message };
            }
        },

        // Activate/pause sequence
        setSequenceStatus: async (sequenceId, status) => {
            return await get().updateSequence(sequenceId, { status });
        },

        // ============================================================
        // SEQUENCE STEPS
        // ============================================================

        addStep: async (sequenceId, stepData) => {
            try {
                // Get current step count for order
                const { data: existing } = await supabase
                    .from('email_sequence_steps')
                    .select('step_order')
                    .eq('sequence_id', sequenceId)
                    .order('step_order', { ascending: false })
                    .limit(1);

                const nextOrder = existing?.length ? existing[0].step_order + 1 : 1;

                const { data, error } = await supabase
                    .from('email_sequence_steps')
                    .insert({
                        sequence_id: sequenceId,
                        step_order: nextOrder,
                        name: stepData.name || `Step ${nextOrder}`,
                        subject: stepData.subject,
                        body: stepData.body,
                        template_id: stepData.template_id,
                        trigger_type: stepData.trigger_type || 'delay_days',
                        trigger_value: stepData.trigger_value || 1,
                        is_active: true,
                    })
                    .select()
                    .single();

                if (error) throw error;

                // Update local state
                if (get().selectedSequence?.id === sequenceId) {
                    set({
                        selectedSequence: {
                            ...get().selectedSequence,
                            steps: [...(get().selectedSequence.steps || []), data],
                        },
                    });
                }

                return { success: true, step: data };
            } catch (error) {
                console.error('Failed to add step:', error);
                return { success: false, error: error.message };
            }
        },

        updateStep: async (stepId, updates) => {
            try {
                const { data, error } = await supabase
                    .from('email_sequence_steps')
                    .update(updates)
                    .eq('id', stepId)
                    .select()
                    .single();

                if (error) throw error;

                // Update local state
                if (get().selectedSequence) {
                    set({
                        selectedSequence: {
                            ...get().selectedSequence,
                            steps: get().selectedSequence.steps?.map(s =>
                                s.id === stepId ? data : s
                            ),
                        },
                    });
                }

                return { success: true, step: data };
            } catch (error) {
                console.error('Failed to update step:', error);
                return { success: false, error: error.message };
            }
        },

        deleteStep: async (stepId) => {
            try {
                const { error } = await supabase
                    .from('email_sequence_steps')
                    .delete()
                    .eq('id', stepId);

                if (error) throw error;

                // Update local state
                if (get().selectedSequence) {
                    set({
                        selectedSequence: {
                            ...get().selectedSequence,
                            steps: get().selectedSequence.steps?.filter(s => s.id !== stepId),
                        },
                    });
                }

                return { success: true };
            } catch (error) {
                console.error('Failed to delete step:', error);
                return { success: false, error: error.message };
            }
        },

        reorderSteps: async (sequenceId, stepIds) => {
            try {
                // Update each step with new order
                for (let i = 0; i < stepIds.length; i++) {
                    await supabase
                        .from('email_sequence_steps')
                        .update({ step_order: i + 1 })
                        .eq('id', stepIds[i]);
                }

                // Reload the sequence
                await get().getSequence(sequenceId);

                return { success: true };
            } catch (error) {
                console.error('Failed to reorder steps:', error);
                return { success: false, error: error.message };
            }
        },

        // ============================================================
        // ENROLLMENTS
        // ============================================================

        loadEnrollments: async (sequenceId) => {
            try {
                const { data, error } = await supabase
                    .from('email_sequence_enrollments')
                    .select(`
                        *,
                        sends:email_sequence_sends(*)
                    `)
                    .eq('sequence_id', sequenceId)
                    .order('enrolled_at', { ascending: false });

                if (error) throw error;

                set({ enrollments: data || [] });
                return { success: true, enrollments: data };
            } catch (error) {
                console.error('Failed to load enrollments:', error);
                return { success: false, error: error.message };
            }
        },

        enrollContact: async (sequenceId, contactData) => {
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) throw new Error('Not authenticated');

                // Check if already enrolled
                const { data: existing } = await supabase
                    .from('email_sequence_enrollments')
                    .select('id')
                    .eq('sequence_id', sequenceId)
                    .eq('contact_email', contactData.email)
                    .eq('status', 'active')
                    .single();

                if (existing) {
                    return { success: false, error: 'Contact already enrolled in this sequence' };
                }

                const { data, error } = await supabase
                    .from('email_sequence_enrollments')
                    .insert({
                        sequence_id: sequenceId,
                        contact_id: contactData.contact_id,
                        contact_email: contactData.email,
                        contact_name: contactData.name,
                        opportunity_id: contactData.opportunity_id,
                        status: 'active',
                        current_step: 1,
                        enrolled_at: new Date().toISOString(),
                        next_send_at: calculateNextSend(new Date()),
                        metadata: contactData.metadata || {},
                    })
                    .select()
                    .single();

                if (error) throw error;

                set({ enrollments: [data, ...get().enrollments] });
                return { success: true, enrollment: data };
            } catch (error) {
                console.error('Failed to enroll contact:', error);
                return { success: false, error: error.message };
            }
        },

        unenrollContact: async (enrollmentId, reason = 'manual') => {
            try {
                const { data, error } = await supabase
                    .from('email_sequence_enrollments')
                    .update({
                        status: 'paused',
                        completed_at: new Date().toISOString(),
                        metadata: { unenrollReason: reason },
                    })
                    .eq('id', enrollmentId)
                    .select()
                    .single();

                if (error) throw error;

                set({
                    enrollments: get().enrollments.map(e =>
                        e.id === enrollmentId ? data : e
                    ),
                });

                return { success: true };
            } catch (error) {
                console.error('Failed to unenroll contact:', error);
                return { success: false, error: error.message };
            }
        },

        // Bulk enroll contacts from opportunity
        enrollOpportunityContacts: async (sequenceId, opportunityId) => {
            try {
                // Get contacts for opportunity
                const { data: contacts, error: contactError } = await supabase
                    .from('contacts')
                    .select('id, email, name')
                    .eq('opportunity_id', opportunityId);

                if (contactError) throw contactError;

                const results = [];
                for (const contact of contacts || []) {
                    if (contact.email) {
                        const result = await get().enrollContact(sequenceId, {
                            contact_id: contact.id,
                            email: contact.email,
                            name: contact.name,
                            opportunity_id: opportunityId,
                        });
                        results.push(result);
                    }
                }

                return {
                    success: true,
                    enrolled: results.filter(r => r.success).length,
                    failed: results.filter(r => !r.success).length,
                };
            } catch (error) {
                console.error('Failed to enroll opportunity contacts:', error);
                return { success: false, error: error.message };
            }
        },

        // ============================================================
        // SEQUENCE EXECUTION (called by background job)
        // ============================================================

        // This would typically be called by a Supabase Edge Function cron job
        processEnrollments: async () => {
            try {
                const now = new Date();

                // Get enrollments that are due
                const { data: dueEnrollments, error } = await supabase
                    .from('email_sequence_enrollments')
                    .select(`
                        *,
                        sequence:email_sequences(
                            *,
                            steps:email_sequence_steps(*)
                        )
                    `)
                    .eq('status', 'active')
                    .lte('next_send_at', now.toISOString())
                    .limit(50);

                if (error) throw error;

                for (const enrollment of dueEnrollments || []) {
                    await get().processEnrollment(enrollment);
                }

                return { success: true, processed: dueEnrollments?.length || 0 };
            } catch (error) {
                console.error('Failed to process enrollments:', error);
                return { success: false, error: error.message };
            }
        },

        processEnrollment: async (enrollment) => {
            try {
                const sequence = enrollment.sequence;
                const currentStep = sequence.steps?.find(
                    s => s.step_order === enrollment.current_step
                );

                if (!currentStep) {
                    // No more steps, mark as completed
                    await supabase
                        .from('email_sequence_enrollments')
                        .update({
                            status: 'completed',
                            completed_at: new Date().toISOString(),
                        })
                        .eq('id', enrollment.id);
                    return;
                }

                // Send the email (integrate with emailStore)
                const sendResult = await get().sendSequenceEmail(enrollment, currentStep);

                if (sendResult.success) {
                    // Record the send
                    await supabase.from('email_sequence_sends').insert({
                        enrollment_id: enrollment.id,
                        step_id: currentStep.id,
                        sent_at: new Date().toISOString(),
                        message_id: sendResult.messageId,
                        status: 'sent',
                    });

                    // Calculate next step timing
                    const nextStep = sequence.steps?.find(
                        s => s.step_order === enrollment.current_step + 1
                    );

                    if (nextStep) {
                        const nextSendAt = calculateNextSendFromStep(nextStep);
                        await supabase
                            .from('email_sequence_enrollments')
                            .update({
                                current_step: enrollment.current_step + 1,
                                next_send_at: nextSendAt.toISOString(),
                            })
                            .eq('id', enrollment.id);
                    } else {
                        // Sequence complete
                        await supabase
                            .from('email_sequence_enrollments')
                            .update({
                                status: 'completed',
                                completed_at: new Date().toISOString(),
                            })
                            .eq('id', enrollment.id);
                    }
                }
            } catch (error) {
                console.error('Failed to process enrollment:', error);
            }
        },

        sendSequenceEmail: async (enrollment, step) => {
            // This would integrate with the emailStore to send the actual email
            // For now, return a mock success
            try {
                // In real implementation, use emailStore.sendEmail()
                console.log(`Would send email to ${enrollment.contact_email}:`, step.subject);

                return {
                    success: true,
                    messageId: `seq-${Date.now()}`,
                };
            } catch (error) {
                return { success: false, error: error.message };
            }
        },

        // ============================================================
        // ANALYTICS
        // ============================================================

        getSequenceStats: async (sequenceId) => {
            try {
                const { data: enrollments } = await supabase
                    .from('email_sequence_enrollments')
                    .select('status')
                    .eq('sequence_id', sequenceId);

                const { data: sends } = await supabase
                    .from('email_sequence_sends')
                    .select('status, opened_at, clicked_at, replied_at')
                    .eq('enrollment_id', enrollments?.map(e => e.id) || []);

                const totalEnrolled = enrollments?.length || 0;
                const active = enrollments?.filter(e => e.status === 'active').length || 0;
                const completed = enrollments?.filter(e => e.status === 'completed').length || 0;
                const totalSent = sends?.length || 0;
                const opened = sends?.filter(s => s.opened_at).length || 0;
                const clicked = sends?.filter(s => s.clicked_at).length || 0;
                const replied = sends?.filter(s => s.replied_at).length || 0;

                return {
                    totalEnrolled,
                    active,
                    completed,
                    totalSent,
                    openRate: totalSent > 0 ? Math.round((opened / totalSent) * 100) : 0,
                    clickRate: opened > 0 ? Math.round((clicked / opened) * 100) : 0,
                    replyRate: totalSent > 0 ? Math.round((replied / totalSent) * 100) : 0,
                };
            } catch (error) {
                console.error('Failed to get sequence stats:', error);
                return null;
            }
        },

        // ============================================================
        // CLEANUP
        // ============================================================

        setSelectedSequence: (sequence) => {
            set({ selectedSequence: sequence });
        },

        reset: () => {
            set({
                sequences: [],
                enrollments: [],
                selectedSequence: null,
                isLoading: false,
                isSaving: false,
                error: null,
            });
        },
    }))
);

// ============================================================
// HELPER FUNCTIONS
// ============================================================

function calculateNextSend(fromDate) {
    // Default: next business day at 9 AM
    const next = new Date(fromDate);
    next.setHours(9, 0, 0, 0);

    if (next <= fromDate) {
        next.setDate(next.getDate() + 1);
    }

    // Skip weekends
    while (next.getDay() === 0 || next.getDay() === 6) {
        next.setDate(next.getDate() + 1);
    }

    return next;
}

function calculateNextSendFromStep(step) {
    const now = new Date();

    switch (step.trigger_type) {
        case 'delay_days':
            const daysLater = new Date(now);
            daysLater.setDate(daysLater.getDate() + (step.trigger_value || 1));
            return calculateNextSend(daysLater);

        case 'delay_hours':
            const hoursLater = new Date(now);
            hoursLater.setHours(hoursLater.getHours() + (step.trigger_value || 1));
            return hoursLater;

        default:
            return calculateNextSend(now);
    }
}

export function formatTrigger(triggerType, triggerValue) {
    switch (triggerType) {
        case 'delay_days':
            return `Wait ${triggerValue} day${triggerValue !== 1 ? 's' : ''}`;
        case 'delay_hours':
            return `Wait ${triggerValue} hour${triggerValue !== 1 ? 's' : ''}`;
        case 'on_open':
            return 'When email is opened';
        case 'on_click':
            return 'When link is clicked';
        case 'on_reply':
            return 'When replied';
        case 'on_no_open':
            return `If not opened after ${triggerValue} day${triggerValue !== 1 ? 's' : ''}`;
        default:
            return triggerType;
    }
}

export default useEmailSequenceStore;
