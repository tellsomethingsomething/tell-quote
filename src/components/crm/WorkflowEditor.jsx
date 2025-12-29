import React, { useState, useEffect } from 'react';
import {
    X,
    Plus,
    Trash2,
    ChevronDown,
    ChevronUp,
    GripVertical,
    Zap,
    Filter,
    ArrowRight,
    Save,
    AlertCircle,
} from 'lucide-react';
import { useWorkflowStore, TRIGGER_TYPES, ACTION_TYPES, OPERATORS, CONDITION_FIELDS } from '../../store/workflowStore';

function TriggerSelector({ value, onChange }) {
    const [isOpen, setIsOpen] = useState(false);
    const selectedTrigger = TRIGGER_TYPES[value];

    const categories = {};
    Object.entries(TRIGGER_TYPES).forEach(([key, config]) => {
        if (!categories[config.category]) {
            categories[config.category] = [];
        }
        categories[config.category].push({ key, ...config });
    });

    const categoryLabels = {
        quote: 'Quote Events',
        opportunity: 'Opportunity Events',
        activity: 'Activity Events',
        engagement: 'Engagement Events',
    };

    return (
        <div className="relative">
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between px-4 py-3 bg-dark-bg border border-dark-border rounded-lg text-white hover:border-gray-600 transition-colors"
            >
                <div className="flex items-center gap-3">
                    <span className="text-xl">{selectedTrigger?.icon || '⚡'}</span>
                    <span>{selectedTrigger?.label || 'Select a trigger'}</span>
                </div>
                <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
                <>
                    <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
                    <div className="absolute top-full left-0 right-0 mt-2 bg-dark-nav border border-dark-border rounded-lg shadow-xl z-20 max-h-80 overflow-y-auto">
                        {Object.entries(categories).map(([category, triggers]) => (
                            <div key={category}>
                                <div className="px-4 py-2 text-xs font-medium text-gray-500 uppercase tracking-wide bg-dark-bg">
                                    {categoryLabels[category] || category}
                                </div>
                                {triggers.map(trigger => (
                                    <button
                                        key={trigger.key}
                                        type="button"
                                        onClick={() => { onChange(trigger.key); setIsOpen(false); }}
                                        className={`w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-dark-card transition-colors ${
                                            value === trigger.key ? 'bg-brand-primary/10 text-brand-primary' : 'text-gray-300'
                                        }`}
                                    >
                                        <span className="text-lg">{trigger.icon}</span>
                                        <span>{trigger.label}</span>
                                    </button>
                                ))}
                            </div>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
}

function ConditionRow({ condition, index, onChange, onRemove }) {
    const handleChange = (field, value) => {
        onChange({ ...condition, [field]: value });
    };

    return (
        <div className="flex items-center gap-2 p-3 bg-dark-bg rounded-lg">
            <GripVertical className="w-4 h-4 text-gray-600 cursor-move" />

            <select
                value={condition.field || ''}
                onChange={(e) => handleChange('field', e.target.value)}
                className="flex-1 px-3 py-2 bg-dark-card border border-dark-border rounded text-gray-300 text-sm focus:outline-none focus:border-brand-primary"
            >
                <option value="">Select field...</option>
                {Object.entries(CONDITION_FIELDS).map(([key, config]) => (
                    <option key={key} value={key}>{config.label}</option>
                ))}
            </select>

            <select
                value={condition.operator || ''}
                onChange={(e) => handleChange('operator', e.target.value)}
                className="w-32 px-3 py-2 bg-dark-card border border-dark-border rounded text-gray-300 text-sm focus:outline-none focus:border-brand-primary"
            >
                <option value="">Operator</option>
                {Object.entries(OPERATORS).map(([key, config]) => (
                    <option key={key} value={key}>{config.label}</option>
                ))}
            </select>

            <input
                type="text"
                value={condition.value || ''}
                onChange={(e) => handleChange('value', e.target.value)}
                placeholder="Value"
                className="w-32 px-3 py-2 bg-dark-card border border-dark-border rounded text-gray-300 text-sm focus:outline-none focus:border-brand-primary"
            />

            <button
                type="button"
                onClick={onRemove}
                className="p-1.5 text-gray-500 hover:text-red-400 transition-colors"
            >
                <Trash2 className="w-4 h-4" />
            </button>
        </div>
    );
}

function ActionRow({ action, index, onChange, onRemove, onMoveUp, onMoveDown, isFirst, isLast }) {
    const [isExpanded, setIsExpanded] = useState(true);
    const actionConfig = ACTION_TYPES[action.type];

    const handleChange = (field, value) => {
        onChange({ ...action, [field]: value });
    };

    const handleConfigChange = (key, value) => {
        onChange({
            ...action,
            config: { ...action.config, [key]: value },
        });
    };

    const renderConfigFields = () => {
        switch (action.type) {
            case 'create_task':
                return (
                    <div className="space-y-3 mt-3">
                        <input
                            type="text"
                            value={action.config?.title || ''}
                            onChange={(e) => handleConfigChange('title', e.target.value)}
                            placeholder="Task title"
                            className="w-full px-3 py-2 bg-dark-card border border-dark-border rounded text-gray-300 text-sm focus:outline-none focus:border-brand-primary"
                        />
                        <textarea
                            value={action.config?.description || ''}
                            onChange={(e) => handleConfigChange('description', e.target.value)}
                            placeholder="Task description"
                            rows={2}
                            className="w-full px-3 py-2 bg-dark-card border border-dark-border rounded text-gray-300 text-sm focus:outline-none focus:border-brand-primary resize-none"
                        />
                        <div className="flex gap-3">
                            <select
                                value={action.config?.priority || 'medium'}
                                onChange={(e) => handleConfigChange('priority', e.target.value)}
                                className="flex-1 px-3 py-2 bg-dark-card border border-dark-border rounded text-gray-300 text-sm focus:outline-none focus:border-brand-primary"
                            >
                                <option value="low">Low Priority</option>
                                <option value="medium">Medium Priority</option>
                                <option value="high">High Priority</option>
                            </select>
                            <input
                                type="number"
                                value={action.config?.dueDays || 7}
                                onChange={(e) => handleConfigChange('dueDays', parseInt(e.target.value))}
                                min={1}
                                className="w-24 px-3 py-2 bg-dark-card border border-dark-border rounded text-gray-300 text-sm focus:outline-none focus:border-brand-primary"
                            />
                            <span className="text-gray-500 text-sm self-center">days</span>
                        </div>
                    </div>
                );

            case 'send_email':
                return (
                    <div className="space-y-3 mt-3">
                        <select
                            value={action.config?.templateId || ''}
                            onChange={(e) => handleConfigChange('templateId', e.target.value)}
                            className="w-full px-3 py-2 bg-dark-card border border-dark-border rounded text-gray-300 text-sm focus:outline-none focus:border-brand-primary"
                        >
                            <option value="">Select email template...</option>
                            <option value="followup">Follow-up Email</option>
                            <option value="reminder">Reminder Email</option>
                            <option value="thank_you">Thank You Email</option>
                        </select>
                        <div className="text-xs text-gray-500">
                            Email will be sent to the primary contact on the opportunity
                        </div>
                    </div>
                );

            case 'update_status':
                return (
                    <div className="mt-3">
                        <select
                            value={action.config?.newStatus || ''}
                            onChange={(e) => handleConfigChange('newStatus', e.target.value)}
                            className="w-full px-3 py-2 bg-dark-card border border-dark-border rounded text-gray-300 text-sm focus:outline-none focus:border-brand-primary"
                        >
                            <option value="">Select new status...</option>
                            <option value="active">Active</option>
                            <option value="qualified">Qualified</option>
                            <option value="proposal">Proposal</option>
                            <option value="negotiation">Negotiation</option>
                            <option value="won">Won</option>
                            <option value="lost">Lost</option>
                        </select>
                    </div>
                );

            case 'notify_user':
                return (
                    <div className="space-y-3 mt-3">
                        <input
                            type="text"
                            value={action.config?.title || ''}
                            onChange={(e) => handleConfigChange('title', e.target.value)}
                            placeholder="Notification title"
                            className="w-full px-3 py-2 bg-dark-card border border-dark-border rounded text-gray-300 text-sm focus:outline-none focus:border-brand-primary"
                        />
                        <textarea
                            value={action.config?.message || ''}
                            onChange={(e) => handleConfigChange('message', e.target.value)}
                            placeholder="Notification message"
                            rows={2}
                            className="w-full px-3 py-2 bg-dark-card border border-dark-border rounded text-gray-300 text-sm focus:outline-none focus:border-brand-primary resize-none"
                        />
                    </div>
                );

            case 'log_activity':
                return (
                    <div className="space-y-3 mt-3">
                        <select
                            value={action.config?.activityType || 'note'}
                            onChange={(e) => handleConfigChange('activityType', e.target.value)}
                            className="w-full px-3 py-2 bg-dark-card border border-dark-border rounded text-gray-300 text-sm focus:outline-none focus:border-brand-primary"
                        >
                            <option value="note">Note</option>
                            <option value="call">Call</option>
                            <option value="email">Email</option>
                            <option value="meeting">Meeting</option>
                        </select>
                        <textarea
                            value={action.config?.notes || ''}
                            onChange={(e) => handleConfigChange('notes', e.target.value)}
                            placeholder="Activity notes"
                            rows={2}
                            className="w-full px-3 py-2 bg-dark-card border border-dark-border rounded text-gray-300 text-sm focus:outline-none focus:border-brand-primary resize-none"
                        />
                    </div>
                );

            case 'add_tag':
                return (
                    <div className="mt-3">
                        <input
                            type="text"
                            value={action.config?.tag || ''}
                            onChange={(e) => handleConfigChange('tag', e.target.value)}
                            placeholder="Tag name"
                            className="w-full px-3 py-2 bg-dark-card border border-dark-border rounded text-gray-300 text-sm focus:outline-none focus:border-brand-primary"
                        />
                    </div>
                );

            default:
                return null;
        }
    };

    return (
        <div className="border border-dark-border rounded-lg overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-3 bg-dark-card">
                <GripVertical className="w-4 h-4 text-gray-600 cursor-move" />

                <div className="flex-1 flex items-center gap-2">
                    <span className={`text-lg ${actionConfig?.color || ''}`}>{actionConfig?.icon || '•'}</span>
                    <select
                        value={action.type || ''}
                        onChange={(e) => handleChange('type', e.target.value)}
                        className="flex-1 px-3 py-1.5 bg-dark-bg border border-dark-border rounded text-gray-300 text-sm focus:outline-none focus:border-brand-primary"
                    >
                        <option value="">Select action...</option>
                        {Object.entries(ACTION_TYPES).map(([key, config]) => (
                            <option key={key} value={key}>{config.icon} {config.label}</option>
                        ))}
                    </select>
                </div>

                <div className="flex items-center gap-1">
                    <button
                        type="button"
                        onClick={onMoveUp}
                        disabled={isFirst}
                        className="p-1 text-gray-500 hover:text-white disabled:opacity-30 transition-colors"
                    >
                        <ChevronUp className="w-4 h-4" />
                    </button>
                    <button
                        type="button"
                        onClick={onMoveDown}
                        disabled={isLast}
                        className="p-1 text-gray-500 hover:text-white disabled:opacity-30 transition-colors"
                    >
                        <ChevronDown className="w-4 h-4" />
                    </button>
                    <button
                        type="button"
                        onClick={() => setIsExpanded(!isExpanded)}
                        className="p-1 text-gray-500 hover:text-white transition-colors"
                    >
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                    <button
                        type="button"
                        onClick={onRemove}
                        className="p-1 text-gray-500 hover:text-red-400 transition-colors"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {isExpanded && action.type && (
                <div className="px-4 pb-4 bg-dark-card border-t border-dark-border">
                    {renderConfigFields()}
                </div>
            )}
        </div>
    );
}

export default function WorkflowEditor({ workflow, onClose }) {
    const { createWorkflow, updateWorkflow } = useWorkflowStore();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState(null);

    const [formData, setFormData] = useState({
        name: '',
        description: '',
        trigger_type: 'quote_sent',
        trigger_config: {},
        conditions: [],
        actions: [{ type: '', config: {} }],
        is_active: true,
    });

    useEffect(() => {
        if (workflow) {
            setFormData({
                name: workflow.name || '',
                description: workflow.description || '',
                trigger_type: workflow.trigger_type || 'quote_sent',
                trigger_config: workflow.trigger_config || {},
                conditions: workflow.conditions || [],
                actions: workflow.actions || [{ type: '', config: {} }],
                is_active: workflow.is_active !== false,
            });
        }
    }, [workflow]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);

        // Validation
        if (!formData.name.trim()) {
            setError('Workflow name is required');
            return;
        }

        if (!formData.actions.some(a => a.type)) {
            setError('At least one action is required');
            return;
        }

        setIsSubmitting(true);

        try {
            const result = workflow
                ? await updateWorkflow(workflow.id, formData)
                : await createWorkflow(formData);

            if (result.success) {
                onClose();
            } else {
                setError(result.error || 'Failed to save workflow');
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const addCondition = () => {
        setFormData(prev => ({
            ...prev,
            conditions: [...prev.conditions, { field: '', operator: '', value: '' }],
        }));
    };

    const updateCondition = (index, updated) => {
        setFormData(prev => ({
            ...prev,
            conditions: prev.conditions.map((c, i) => i === index ? updated : c),
        }));
    };

    const removeCondition = (index) => {
        setFormData(prev => ({
            ...prev,
            conditions: prev.conditions.filter((_, i) => i !== index),
        }));
    };

    const addAction = () => {
        setFormData(prev => ({
            ...prev,
            actions: [...prev.actions, { type: '', config: {} }],
        }));
    };

    const updateAction = (index, updated) => {
        setFormData(prev => ({
            ...prev,
            actions: prev.actions.map((a, i) => i === index ? updated : a),
        }));
    };

    const removeAction = (index) => {
        setFormData(prev => ({
            ...prev,
            actions: prev.actions.filter((_, i) => i !== index),
        }));
    };

    const moveAction = (index, direction) => {
        const newIndex = index + direction;
        if (newIndex < 0 || newIndex >= formData.actions.length) return;

        const newActions = [...formData.actions];
        [newActions[index], newActions[newIndex]] = [newActions[newIndex], newActions[index]];
        setFormData(prev => ({ ...prev, actions: newActions }));
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-start justify-center z-50 p-4 overflow-y-auto">
            <div className="bg-dark-card border border-dark-border rounded-lg w-full max-w-2xl my-8">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-dark-border">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-brand-primary/20 flex items-center justify-center">
                            <Zap className="w-5 h-5 text-brand-primary" />
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold text-white">
                                {workflow ? 'Edit Workflow' : 'Create Workflow'}
                            </h2>
                            <p className="text-sm text-gray-400">
                                Automate tasks when events occur
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-gray-400 hover:text-white transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {/* Error */}
                    {error && (
                        <div className="flex items-center gap-2 px-4 py-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400">
                            <AlertCircle className="w-5 h-5" />
                            <span>{error}</span>
                        </div>
                    )}

                    {/* Basic Info */}
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1">
                                Workflow Name *
                            </label>
                            <input
                                type="text"
                                value={formData.name}
                                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                placeholder="e.g., Follow up on sent quotes"
                                className="w-full px-4 py-2 bg-dark-bg border border-dark-border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-brand-primary"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1">
                                Description
                            </label>
                            <textarea
                                value={formData.description}
                                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                                placeholder="What does this workflow do?"
                                rows={2}
                                className="w-full px-4 py-2 bg-dark-bg border border-dark-border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-brand-primary resize-none"
                            />
                        </div>
                    </div>

                    {/* Trigger */}
                    <div>
                        <div className="flex items-center gap-2 mb-3">
                            <div className="w-6 h-6 rounded-full bg-purple-500/20 flex items-center justify-center">
                                <Zap className="w-3 h-3 text-purple-400" />
                            </div>
                            <label className="text-sm font-medium text-gray-300">
                                When this happens...
                            </label>
                        </div>
                        <TriggerSelector
                            value={formData.trigger_type}
                            onChange={(value) => setFormData(prev => ({ ...prev, trigger_type: value }))}
                        />
                    </div>

                    {/* Conditions */}
                    <div>
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded-full bg-amber-500/20 flex items-center justify-center">
                                    <Filter className="w-3 h-3 text-amber-400" />
                                </div>
                                <label className="text-sm font-medium text-gray-300">
                                    Only if these conditions match... (optional)
                                </label>
                            </div>
                            <button
                                type="button"
                                onClick={addCondition}
                                className="text-sm text-brand-primary hover:text-brand-primary/80 flex items-center gap-1"
                            >
                                <Plus className="w-4 h-4" />
                                Add Condition
                            </button>
                        </div>

                        {formData.conditions.length === 0 ? (
                            <div className="text-center py-4 text-gray-500 text-sm bg-dark-bg rounded-lg border border-dashed border-dark-border">
                                No conditions added. Workflow will run for all matching triggers.
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {formData.conditions.map((condition, index) => (
                                    <ConditionRow
                                        key={index}
                                        condition={condition}
                                        index={index}
                                        onChange={(updated) => updateCondition(index, updated)}
                                        onRemove={() => removeCondition(index)}
                                    />
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Actions */}
                    <div>
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center">
                                    <ArrowRight className="w-3 h-3 text-green-400" />
                                </div>
                                <label className="text-sm font-medium text-gray-300">
                                    Then do these actions...
                                </label>
                            </div>
                            <button
                                type="button"
                                onClick={addAction}
                                className="text-sm text-brand-primary hover:text-brand-primary/80 flex items-center gap-1"
                            >
                                <Plus className="w-4 h-4" />
                                Add Action
                            </button>
                        </div>

                        <div className="space-y-2">
                            {formData.actions.map((action, index) => (
                                <ActionRow
                                    key={index}
                                    action={action}
                                    index={index}
                                    onChange={(updated) => updateAction(index, updated)}
                                    onRemove={() => removeAction(index)}
                                    onMoveUp={() => moveAction(index, -1)}
                                    onMoveDown={() => moveAction(index, 1)}
                                    isFirst={index === 0}
                                    isLast={index === formData.actions.length - 1}
                                />
                            ))}
                        </div>
                    </div>

                    {/* Active Toggle */}
                    <div className="flex items-center justify-between py-3 px-4 bg-dark-bg rounded-lg">
                        <div>
                            <p className="text-sm font-medium text-white">Activate Workflow</p>
                            <p className="text-xs text-gray-500">Workflow will run automatically when triggered</p>
                        </div>
                        <button
                            type="button"
                            onClick={() => setFormData(prev => ({ ...prev, is_active: !prev.is_active }))}
                            className={`w-12 h-6 rounded-full transition-colors relative ${
                                formData.is_active ? 'bg-brand-primary' : 'bg-gray-700'
                            }`}
                        >
                            <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
                                formData.is_active ? 'translate-x-7' : 'translate-x-1'
                            }`} />
                        </button>
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end gap-3 pt-4 border-t border-dark-border">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="flex items-center gap-2 px-4 py-2 bg-brand-primary text-white rounded-lg hover:bg-brand-primary/90 transition-colors disabled:opacity-50"
                        >
                            {isSubmitting ? (
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <Save className="w-4 h-4" />
                            )}
                            {workflow ? 'Save Changes' : 'Create Workflow'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
