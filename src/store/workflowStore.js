import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { supabase } from '../lib/supabase';

// Workflow trigger types
export const TRIGGER_TYPES = {
    quote_sent: { id: 'quote_sent', label: 'Quote Sent', icon: '📤', category: 'quote' },
    quote_expiring: { id: 'quote_expiring', label: 'Quote Expiring', icon: '⏰', category: 'quote' },
    quote_accepted: { id: 'quote_accepted', label: 'Quote Accepted', icon: '✅', category: 'quote' },
    quote_rejected: { id: 'quote_rejected', label: 'Quote Rejected', icon: '❌', category: 'quote' },
    opportunity_created: { id: 'opportunity_created', label: 'Opportunity Created', icon: '🎯', category: 'opportunity' },
    opportunity_stage_change: { id: 'opportunity_stage_change', label: 'Stage Changed', icon: '📊', category: 'opportunity' },
    opportunity_won: { id: 'opportunity_won', label: 'Opportunity Won', icon: '🏆', category: 'opportunity' },
    opportunity_lost: { id: 'opportunity_lost', label: 'Opportunity Lost', icon: '😢', category: 'opportunity' },
    no_activity: { id: 'no_activity', label: 'No Activity', icon: '💤', category: 'engagement' },
    contact_added: { id: 'contact_added', label: 'Contact Added', icon: '👤', category: 'contact' },
    email_opened: { id: 'email_opened', label: 'Email Opened', icon: '👁️', category: 'email' },
    email_clicked: { id: 'email_clicked', label: 'Link Clicked', icon: '🔗', category: 'email' },
    task_overdue: { id: 'task_overdue', label: 'Task Overdue', icon: '⚠️', category: 'task' },
    meeting_scheduled: { id: 'meeting_scheduled', label: 'Meeting Scheduled', icon: '📅', category: 'calendar' },
};

// Action types
export const ACTION_TYPES = {
    create_task: { id: 'create_task', label: 'Create Task', icon: '✅', color: 'text-green-400' },
    send_email: { id: 'send_email', label: 'Send Email', icon: '📧', color: 'text-blue-400' },
    update_status: { id: 'update_status', label: 'Update Status', icon: '🔄', color: 'text-amber-400' },
    notify_user: { id: 'notify_user', label: 'Notify User', icon: '🔔', color: 'text-purple-400' },
    log_activity: { id: 'log_activity', label: 'Log Activity', icon: '📝', color: 'text-purple-400' },
    assign_to: { id: 'assign_to', label: 'Assign To', icon: '👤', color: 'text-indigo-400' },
    add_tag: { id: 'add_tag', label: 'Add Tag', icon: '🏷️', color: 'text-pink-400' },
};

// Condition operators
export const OPERATORS = {
    '=': { label: 'equals', symbol: '=' },
    '!=': { label: 'not equals', symbol: '≠' },
    '>': { label: 'greater than', symbol: '>' },
    '>=': { label: 'greater than or equal', symbol: '≥' },
    '<': { label: 'less than', symbol: '<' },
    '<=': { label: 'less than or equal', symbol: '≤' },
    contains: { label: 'contains', symbol: '∋' },
    not_contains: { label: 'does not contain', symbol: '∌' },
};

// Condition fields for filtering
export const CONDITION_FIELDS = {
    opportunity_value: { label: 'Opportunity Value', type: 'number' },
    opportunity_probability: { label: 'Probability %', type: 'number' },
    opportunity_stage: { label: 'Pipeline Stage', type: 'text' },
    days_since_activity: { label: 'Days Since Activity', type: 'number' },
    contact_count: { label: 'Number of Contacts', type: 'number' },
    has_decision_maker: { label: 'Has Decision Maker', type: 'boolean' },
    has_quote: { label: 'Has Quote', type: 'boolean' },
    quote_value: { label: 'Quote Value', type: 'number' },
    client_name: { label: 'Client Name', type: 'text' },
    lead_score: { label: 'Lead Score', type: 'number' },
    tags: { label: 'Tags', type: 'array' },
};

export const useWorkflowStore = create(
    subscribeWithSelector((set, get) => ({
        // Data
        workflows: [],
        executions: [],
        selectedWorkflow: null,

        // UI state
        isLoading: false,
        isSaving: false,
        error: null,

        // ============================================================
        // INITIALIZATION
        // ============================================================

        initialize: async () => {
            await get().loadWorkflows();
        },

        // ============================================================
        // WORKFLOW CRUD
        // ============================================================

        loadWorkflows: async () => {
            set({ isLoading: true, error: null });

            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) throw new Error('Not authenticated');

                const { data, error } = await supabase
                    .from('workflow_rules')
                    .select('*')
                    .eq('user_id', user.id)
                    .order('created_at', { ascending: false });

                if (error) throw error;

                set({ workflows: data || [], isLoading: false });
            } catch (error) {
                console.error('Failed to load workflows:', error);
                set({ isLoading: false, error: error.message });
            }
        },

        createWorkflow: async (workflowData) => {
            set({ isSaving: true, error: null });

            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) throw new Error('Not authenticated');

                const { data, error } = await supabase
                    .from('workflow_rules')
                    .insert({
                        user_id: user.id,
                        name: workflowData.name,
                        description: workflowData.description,
                        is_active: workflowData.is_active ?? true,
                        trigger_type: workflowData.trigger_type,
                        trigger_config: workflowData.trigger_config || {},
                        conditions: workflowData.conditions || [],
                        actions: workflowData.actions || [],
                        max_executions_per_entity: workflowData.max_executions_per_entity,
                        cooldown_hours: workflowData.cooldown_hours || 0,
                    })
                    .select()
                    .single();

                if (error) throw error;

                set({
                    workflows: [data, ...get().workflows],
                    isSaving: false,
                });

                return { success: true, workflow: data };
            } catch (error) {
                console.error('Failed to create workflow:', error);
                set({ isSaving: false, error: error.message });
                return { success: false, error: error.message };
            }
        },

        updateWorkflow: async (workflowId, updates) => {
            set({ isSaving: true, error: null });

            try {
                const { data, error } = await supabase
                    .from('workflow_rules')
                    .update(updates)
                    .eq('id', workflowId)
                    .select()
                    .single();

                if (error) throw error;

                set({
                    workflows: get().workflows.map(w => w.id === workflowId ? data : w),
                    selectedWorkflow: get().selectedWorkflow?.id === workflowId ? data : get().selectedWorkflow,
                    isSaving: false,
                });

                return { success: true, workflow: data };
            } catch (error) {
                console.error('Failed to update workflow:', error);
                set({ isSaving: false, error: error.message });
                return { success: false, error: error.message };
            }
        },

        deleteWorkflow: async (workflowId) => {
            try {
                const { error } = await supabase
                    .from('workflow_rules')
                    .delete()
                    .eq('id', workflowId);

                if (error) throw error;

                set({
                    workflows: get().workflows.filter(w => w.id !== workflowId),
                    selectedWorkflow: get().selectedWorkflow?.id === workflowId ? null : get().selectedWorkflow,
                });

                return { success: true };
            } catch (error) {
                console.error('Failed to delete workflow:', error);
                return { success: false, error: error.message };
            }
        },

        toggleWorkflow: async (workflowId) => {
            const workflow = get().workflows.find(w => w.id === workflowId);
            if (!workflow) return { success: false, error: 'Workflow not found' };

            return get().updateWorkflow(workflowId, { is_active: !workflow.is_active });
        },

        // ============================================================
        // WORKFLOW EXECUTION
        // ============================================================

        // Evaluate workflows for a given trigger
        evaluateTrigger: async (triggerType, entity, context = {}) => {
            try {
                const { workflows } = get();

                // Find active workflows matching this trigger
                const matchingWorkflows = workflows.filter(w =>
                    w.is_active && w.trigger_type === triggerType
                );

                const results = [];

                for (const workflow of matchingWorkflows) {
                    // Check trigger config (e.g., days_before for quote_expiring)
                    if (!checkTriggerConfig(workflow.trigger_config, context)) {
                        continue;
                    }

                    // Check conditions
                    if (!evaluateConditions(workflow.conditions, entity, context)) {
                        continue;
                    }

                    // Check cooldown and max executions
                    const canExecute = await get().canExecuteWorkflow(workflow.id, entity.id);
                    if (!canExecute) {
                        continue;
                    }

                    // Execute actions
                    const result = await get().executeWorkflow(workflow, entity, context);
                    results.push({ workflowId: workflow.id, ...result });
                }

                return results;
            } catch (error) {
                console.error('Failed to evaluate trigger:', error);
                return [];
            }
        },

        canExecuteWorkflow: async (workflowId, entityId) => {
            try {
                const workflow = get().workflows.find(w => w.id === workflowId);
                if (!workflow) return false;

                // Check max executions per entity
                if (workflow.max_executions_per_entity) {
                    const { count } = await supabase
                        .from('workflow_executions')
                        .select('*', { count: 'exact', head: true })
                        .eq('rule_id', workflowId)
                        .eq('entity_id', entityId)
                        .eq('status', 'completed');

                    if (count >= workflow.max_executions_per_entity) return false;
                }

                // Check cooldown
                if (workflow.cooldown_hours > 0) {
                    const cooldownTime = new Date();
                    cooldownTime.setHours(cooldownTime.getHours() - workflow.cooldown_hours);

                    const { data } = await supabase
                        .from('workflow_executions')
                        .select('*')
                        .eq('rule_id', workflowId)
                        .eq('entity_id', entityId)
                        .gte('started_at', cooldownTime.toISOString())
                        .limit(1);

                    if (data && data.length > 0) return false;
                }

                return true;
            } catch (error) {
                console.error('Error checking execution eligibility:', error);
                return false;
            }
        },

        executeWorkflow: async (workflow, entity, context) => {
            try {
                // Create execution record
                const { data: execution, error: execError } = await supabase
                    .from('workflow_executions')
                    .insert({
                        rule_id: workflow.id,
                        entity_type: context.entityType || 'unknown',
                        entity_id: entity.id,
                        status: 'running',
                    })
                    .select()
                    .single();

                if (execError) throw execError;

                const actionResults = [];

                // Execute each action
                for (const action of workflow.actions) {
                    try {
                        const result = await executeAction(action, entity, context);
                        actionResults.push({ action: action.type, success: true, result });
                    } catch (actionError) {
                        actionResults.push({ action: action.type, success: false, error: actionError.message });
                    }
                }

                // Update execution record
                const success = actionResults.every(r => r.success);
                await supabase
                    .from('workflow_executions')
                    .update({
                        status: success ? 'completed' : 'failed',
                        result: { actions: actionResults },
                        completed_at: new Date().toISOString(),
                    })
                    .eq('id', execution.id);

                // Update workflow stats
                await supabase
                    .from('workflow_rules')
                    .update({
                        execution_count: (workflow.execution_count || 0) + 1,
                        last_executed_at: new Date().toISOString(),
                    })
                    .eq('id', workflow.id);

                return { success, actions: actionResults };
            } catch (error) {
                console.error('Failed to execute workflow:', error);
                return { success: false, error: error.message };
            }
        },

        // Load execution history
        loadExecutions: async (workflowId = null, limit = 50) => {
            try {
                let query = supabase
                    .from('workflow_executions')
                    .select('*, workflow_rules(name)')
                    .order('started_at', { ascending: false })
                    .limit(limit);

                if (workflowId) {
                    query = query.eq('rule_id', workflowId);
                }

                const { data, error } = await query;

                if (error) throw error;

                set({ executions: data || [] });
                return data || [];
            } catch (error) {
                console.error('Failed to load executions:', error);
                return [];
            }
        },

        // ============================================================
        // SELECTION
        // ============================================================

        setSelectedWorkflow: (workflow) => {
            set({ selectedWorkflow: workflow });
        },

        // ============================================================
        // CLEANUP
        // ============================================================

        reset: () => {
            set({
                workflows: [],
                executions: [],
                selectedWorkflow: null,
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

function checkTriggerConfig(config, context) {
    if (!config || Object.keys(config).length === 0) return true;

    // Check days_before for expiring triggers
    if (config.days_before !== undefined && context.daysUntilExpiry !== undefined) {
        if (context.daysUntilExpiry > config.days_before) return false;
    }

    // Check days_after for no_activity triggers
    if (config.days_after !== undefined && context.daysSinceActivity !== undefined) {
        if (context.daysSinceActivity < config.days_after) return false;
    }

    // Check status
    if (config.status && context.status !== config.status) return false;

    // Check stage
    if (config.stage && context.stage !== config.stage) return false;

    return true;
}

function evaluateConditions(conditions, entity, context) {
    if (!conditions || conditions.length === 0) return true;

    return conditions.every(condition => {
        const value = entity[condition.field] ?? context[condition.field];
        const targetValue = condition.value;

        switch (condition.operator) {
            case '=':
            case '==':
                return value === targetValue;
            case '!=':
                return value !== targetValue;
            case '>':
                return value > targetValue;
            case '>=':
                return value >= targetValue;
            case '<':
                return value < targetValue;
            case '<=':
                return value <= targetValue;
            case 'contains':
                return String(value).toLowerCase().includes(String(targetValue).toLowerCase());
            case 'not_contains':
                return !String(value).toLowerCase().includes(String(targetValue).toLowerCase());
            default:
                return true;
        }
    });
}

async function executeAction(action, entity, context) {
    const config = action.config || {};

    switch (action.type) {
        case 'create_task':
            return await createTask(entity, config, context);
        case 'send_email':
            return await sendEmail(entity, config, context);
        case 'update_status':
            return await updateEntityStatus(entity, config, context);
        case 'notify_user':
            return await notifyUser(entity, config, context);
        case 'log_activity':
            return await logActivity(entity, config, context);
        default:
            throw new Error(`Unknown action type: ${action.type}`);
    }
}

async function createTask(entity, config, context) {
    const { data, error } = await supabase
        .from('activities')
        .insert({
            user_id: context.userId,
            activity_type: 'task',
            subject: config.subject || 'Follow-up task',
            notes: config.notes || '',
            status: 'pending',
            due_date: config.due_days
                ? new Date(Date.now() + config.due_days * 24 * 60 * 60 * 1000).toISOString()
                : null,
            client_id: entity.client_id || entity.clientId,
            opportunity_id: entity.id,
        })
        .select()
        .single();

    if (error) throw error;
    return { taskId: data.id };
}

async function sendEmail(entity, config, context) {
    // This would integrate with the email system
    // For now, just log that an email should be sent
    console.log('Send email action:', config);
    return { queued: true };
}

async function updateEntityStatus(entity, config, context) {
    const table = context.entityType === 'quote' ? 'quotes' :
                  context.entityType === 'opportunity' ? 'opportunities' :
                  null;

    if (!table) throw new Error('Unknown entity type for status update');

    const { error } = await supabase
        .from(table)
        .update({ status: config.status })
        .eq('id', entity.id);

    if (error) throw error;
    return { newStatus: config.status };
}

async function notifyUser(entity, config, context) {
    // This would integrate with a notification system
    console.log('Notify user action:', config);
    return { notified: true };
}

async function logActivity(entity, config, context) {
    const { data, error } = await supabase
        .from('activities')
        .insert({
            user_id: context.userId,
            activity_type: config.activity_type || 'note',
            subject: config.subject || 'Automated activity',
            notes: config.notes || '',
            client_id: entity.client_id || entity.clientId,
            opportunity_id: entity.id,
        })
        .select()
        .single();

    if (error) throw error;
    return { activityId: data.id };
}

export default useWorkflowStore;
