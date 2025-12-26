import React, { useState, useEffect } from 'react';
import {
    Mail,
    Plus,
    Search,
    MoreVertical,
    Play,
    Pause,
    Trash2,
    Edit2,
    Copy,
    Users,
    BarChart3,
    Clock,
    ArrowRight,
    ChevronDown,
    ChevronUp,
    X,
    Save,
    AlertCircle,
    CheckCircle,
    Eye,
    MousePointer,
    MessageSquare,
    Filter,
    Archive,
} from 'lucide-react';
import {
    useEmailSequenceStore,
    SEQUENCE_STATUS,
    SEQUENCE_CATEGORIES,
    STEP_TRIGGERS,
    formatTrigger,
} from '../store/emailSequenceStore';
import { useEmailTemplateStore } from '../store/emailTemplateStore';

// Sequence Card Component
function SequenceCard({ sequence, onEdit, onView, onToggle, onDelete, onDuplicate }) {
    const [showMenu, setShowMenu] = useState(false);
    const [stats, setStats] = useState(null);
    const { getSequenceStats } = useEmailSequenceStore();

    const statusConfig = SEQUENCE_STATUS[sequence.status] || SEQUENCE_STATUS.draft;
    const categoryConfig = SEQUENCE_CATEGORIES[sequence.category] || SEQUENCE_CATEGORIES.sales;

    useEffect(() => {
        getSequenceStats(sequence.id).then(setStats);
    }, [sequence.id]);

    return (
        <div className="bg-dark-card border border-dark-border rounded-lg p-4 hover:border-gray-600 transition-colors">
            <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${categoryConfig.color} bg-dark-bg`}>
                        <span className="text-xl">{categoryConfig.icon}</span>
                    </div>
                    <div>
                        <h3 className="font-medium text-white">{sequence.name}</h3>
                        <p className="text-xs text-gray-400">{categoryConfig.label}</p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 text-xs rounded ${statusConfig.bgColor} ${statusConfig.color}`}>
                        {statusConfig.label}
                    </span>

                    <div className="relative">
                        <button
                            onClick={() => setShowMenu(!showMenu)}
                            className="p-1.5 text-gray-400 hover:text-white rounded transition-colors"
                        >
                            <MoreVertical className="w-4 h-4" />
                        </button>

                        {showMenu && (
                            <>
                                <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
                                <div className="absolute right-0 mt-1 w-40 bg-dark-nav border border-dark-border rounded-lg shadow-xl z-20 py-1">
                                    <button
                                        onClick={() => { onView(sequence); setShowMenu(false); }}
                                        className="w-full px-3 py-2 text-left text-sm text-gray-300 hover:bg-dark-card flex items-center gap-2"
                                    >
                                        <Eye className="w-4 h-4" />
                                        View Details
                                    </button>
                                    <button
                                        onClick={() => { onEdit(sequence); setShowMenu(false); }}
                                        className="w-full px-3 py-2 text-left text-sm text-gray-300 hover:bg-dark-card flex items-center gap-2"
                                    >
                                        <Edit2 className="w-4 h-4" />
                                        Edit
                                    </button>
                                    <button
                                        onClick={() => { onDuplicate(sequence); setShowMenu(false); }}
                                        className="w-full px-3 py-2 text-left text-sm text-gray-300 hover:bg-dark-card flex items-center gap-2"
                                    >
                                        <Copy className="w-4 h-4" />
                                        Duplicate
                                    </button>
                                    <button
                                        onClick={() => { onToggle(sequence); setShowMenu(false); }}
                                        className="w-full px-3 py-2 text-left text-sm text-gray-300 hover:bg-dark-card flex items-center gap-2"
                                    >
                                        {sequence.status === 'active' ? (
                                            <>
                                                <Pause className="w-4 h-4" />
                                                Pause
                                            </>
                                        ) : (
                                            <>
                                                <Play className="w-4 h-4" />
                                                Activate
                                            </>
                                        )}
                                    </button>
                                    <hr className="my-1 border-dark-border" />
                                    <button
                                        onClick={() => { onDelete(sequence); setShowMenu(false); }}
                                        className="w-full px-3 py-2 text-left text-sm text-red-400 hover:bg-dark-card flex items-center gap-2"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                        Delete
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {sequence.description && (
                <p className="text-sm text-gray-400 mb-3">{sequence.description}</p>
            )}

            {/* Steps preview */}
            <div className="flex items-center gap-2 mb-3">
                <span className="text-xs text-gray-500">
                    {sequence.steps?.length || 0} step{sequence.steps?.length !== 1 ? 's' : ''}
                </span>
                <div className="flex-1 flex items-center gap-1 overflow-hidden">
                    {sequence.steps?.slice(0, 4).map((step, i) => (
                        <React.Fragment key={step.id}>
                            <div className="w-6 h-6 rounded bg-dark-bg flex items-center justify-center text-xs text-gray-400">
                                {i + 1}
                            </div>
                            {i < Math.min(sequence.steps.length - 1, 3) && (
                                <ArrowRight className="w-3 h-3 text-gray-600 flex-shrink-0" />
                            )}
                        </React.Fragment>
                    ))}
                    {sequence.steps?.length > 4 && (
                        <span className="text-xs text-gray-500">+{sequence.steps.length - 4}</span>
                    )}
                </div>
            </div>

            {/* Stats */}
            {stats && (
                <div className="flex items-center gap-4 pt-3 border-t border-dark-border text-xs">
                    <div className="flex items-center gap-1 text-gray-400">
                        <Users className="w-3 h-3" />
                        <span>{stats.totalEnrolled} enrolled</span>
                    </div>
                    <div className="flex items-center gap-1 text-green-400">
                        <Eye className="w-3 h-3" />
                        <span>{stats.openRate}% open</span>
                    </div>
                    <div className="flex items-center gap-1 text-blue-400">
                        <MousePointer className="w-3 h-3" />
                        <span>{stats.clickRate}% click</span>
                    </div>
                    <div className="flex items-center gap-1 text-purple-400">
                        <MessageSquare className="w-3 h-3" />
                        <span>{stats.replyRate}% reply</span>
                    </div>
                </div>
            )}
        </div>
    );
}

// Sequence Editor Modal
function SequenceEditor({ sequence, onClose }) {
    const { createSequence, updateSequence, addStep, updateStep, deleteStep } = useEmailSequenceStore();
    const { templates } = useEmailTemplateStore();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState('details');

    const [formData, setFormData] = useState({
        name: sequence?.name || '',
        description: sequence?.description || '',
        category: sequence?.category || 'sales',
        settings: sequence?.settings || {
            sendOnWeekends: false,
            sendTime: '09:00',
            timezone: 'UTC',
            stopOnReply: true,
            stopOnMeeting: true,
        },
    });

    const [steps, setSteps] = useState(sequence?.steps || []);
    const [editingStep, setEditingStep] = useState(null);

    const handleSaveSequence = async () => {
        setError(null);

        if (!formData.name.trim()) {
            setError('Sequence name is required');
            return;
        }

        setIsSubmitting(true);

        try {
            if (sequence) {
                await updateSequence(sequence.id, formData);
            } else {
                const result = await createSequence(formData);
                if (!result.success) throw new Error(result.error);
            }
            onClose();
        } catch (err) {
            setError(err.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleAddStep = () => {
        const newStep = {
            id: `temp-${Date.now()}`,
            step_order: steps.length + 1,
            name: `Step ${steps.length + 1}`,
            subject: '',
            body: '',
            trigger_type: 'delay_days',
            trigger_value: steps.length === 0 ? 0 : 1,
            is_active: true,
        };
        setSteps([...steps, newStep]);
        setEditingStep(newStep);
    };

    const handleSaveStep = async (stepData) => {
        if (sequence && !stepData.id.startsWith('temp-')) {
            await updateStep(stepData.id, stepData);
        } else if (sequence) {
            await addStep(sequence.id, stepData);
        }

        setSteps(steps.map(s => s.id === stepData.id ? stepData : s));
        setEditingStep(null);
    };

    const handleDeleteStep = async (stepId) => {
        if (sequence && !stepId.startsWith('temp-')) {
            await deleteStep(stepId);
        }
        setSteps(steps.filter(s => s.id !== stepId));
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-start justify-center z-50 p-4 overflow-y-auto">
            <div className="bg-dark-card border border-dark-border rounded-lg w-full max-w-3xl my-8">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-dark-border">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-brand-teal/20 flex items-center justify-center">
                            <Mail className="w-5 h-5 text-brand-teal" />
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold text-white">
                                {sequence ? 'Edit Sequence' : 'Create Sequence'}
                            </h2>
                            <p className="text-sm text-gray-400">
                                Build automated email campaigns
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

                {/* Tabs */}
                <div className="flex border-b border-dark-border">
                    <button
                        onClick={() => setActiveTab('details')}
                        className={`px-6 py-3 text-sm font-medium transition-colors ${
                            activeTab === 'details'
                                ? 'text-brand-teal border-b-2 border-brand-teal'
                                : 'text-gray-400 hover:text-white'
                        }`}
                    >
                        Details
                    </button>
                    <button
                        onClick={() => setActiveTab('steps')}
                        className={`px-6 py-3 text-sm font-medium transition-colors ${
                            activeTab === 'steps'
                                ? 'text-brand-teal border-b-2 border-brand-teal'
                                : 'text-gray-400 hover:text-white'
                        }`}
                    >
                        Steps ({steps.length})
                    </button>
                    <button
                        onClick={() => setActiveTab('settings')}
                        className={`px-6 py-3 text-sm font-medium transition-colors ${
                            activeTab === 'settings'
                                ? 'text-brand-teal border-b-2 border-brand-teal'
                                : 'text-gray-400 hover:text-white'
                        }`}
                    >
                        Settings
                    </button>
                </div>

                <div className="p-6">
                    {error && (
                        <div className="flex items-center gap-2 px-4 py-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 mb-4">
                            <AlertCircle className="w-5 h-5" />
                            <span>{error}</span>
                        </div>
                    )}

                    {/* Details Tab */}
                    {activeTab === 'details' && (
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">
                                    Sequence Name *
                                </label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                    placeholder="e.g., New Lead Follow-up"
                                    className="w-full px-4 py-2 bg-dark-bg border border-dark-border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-brand-teal"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">
                                    Description
                                </label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                                    placeholder="What is this sequence for?"
                                    rows={3}
                                    className="w-full px-4 py-2 bg-dark-bg border border-dark-border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-brand-teal resize-none"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">
                                    Category
                                </label>
                                <div className="grid grid-cols-3 gap-2">
                                    {Object.entries(SEQUENCE_CATEGORIES).map(([key, config]) => (
                                        <button
                                            key={key}
                                            type="button"
                                            onClick={() => setFormData(prev => ({ ...prev, category: key }))}
                                            className={`p-3 rounded-lg border text-left transition-colors ${
                                                formData.category === key
                                                    ? 'border-brand-teal bg-brand-teal/10'
                                                    : 'border-dark-border hover:border-gray-600'
                                            }`}
                                        >
                                            <span className="text-xl">{config.icon}</span>
                                            <p className={`text-sm mt-1 ${config.color}`}>{config.label}</p>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Steps Tab */}
                    {activeTab === 'steps' && (
                        <div className="space-y-4">
                            {steps.length === 0 ? (
                                <div className="text-center py-8 bg-dark-bg rounded-lg border border-dashed border-dark-border">
                                    <Mail className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                                    <h3 className="text-lg font-medium text-white mb-1">No steps yet</h3>
                                    <p className="text-gray-400 text-sm mb-4">
                                        Add steps to build your email sequence
                                    </p>
                                    <button
                                        onClick={handleAddStep}
                                        className="px-4 py-2 bg-brand-teal text-white rounded-lg hover:bg-brand-teal/90 transition-colors"
                                    >
                                        Add First Step
                                    </button>
                                </div>
                            ) : (
                                <>
                                    <div className="space-y-3">
                                        {steps.map((step, index) => (
                                            <div
                                                key={step.id}
                                                className="border border-dark-border rounded-lg overflow-hidden"
                                            >
                                                <div className="flex items-center gap-3 px-4 py-3 bg-dark-bg">
                                                    <div className="w-8 h-8 rounded-full bg-brand-teal/20 text-brand-teal flex items-center justify-center font-medium">
                                                        {index + 1}
                                                    </div>
                                                    <div className="flex-1">
                                                        <h4 className="font-medium text-white">{step.name}</h4>
                                                        <p className="text-xs text-gray-400">
                                                            {formatTrigger(step.trigger_type, step.trigger_value)}
                                                        </p>
                                                    </div>
                                                    <button
                                                        onClick={() => setEditingStep(step)}
                                                        className="p-1.5 text-gray-400 hover:text-white transition-colors"
                                                    >
                                                        <Edit2 className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteStep(step.id)}
                                                        className="p-1.5 text-gray-400 hover:text-red-400 transition-colors"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>

                                                {step.subject && (
                                                    <div className="px-4 py-2 border-t border-dark-border">
                                                        <p className="text-sm text-gray-300">
                                                            <span className="text-gray-500">Subject:</span> {step.subject}
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>

                                    <button
                                        onClick={handleAddStep}
                                        className="w-full px-4 py-3 border border-dashed border-dark-border rounded-lg text-gray-400 hover:text-white hover:border-gray-600 transition-colors flex items-center justify-center gap-2"
                                    >
                                        <Plus className="w-4 h-4" />
                                        Add Step
                                    </button>
                                </>
                            )}
                        </div>
                    )}

                    {/* Settings Tab */}
                    {activeTab === 'settings' && (
                        <div className="space-y-4">
                            <div className="flex items-center justify-between py-3">
                                <div>
                                    <p className="text-sm font-medium text-white">Send on weekends</p>
                                    <p className="text-xs text-gray-500">Allow emails to be sent on Saturday/Sunday</p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setFormData(prev => ({
                                        ...prev,
                                        settings: { ...prev.settings, sendOnWeekends: !prev.settings.sendOnWeekends }
                                    }))}
                                    className={`w-12 h-6 rounded-full transition-colors relative ${
                                        formData.settings.sendOnWeekends ? 'bg-brand-teal' : 'bg-gray-700'
                                    }`}
                                >
                                    <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
                                        formData.settings.sendOnWeekends ? 'translate-x-7' : 'translate-x-1'
                                    }`} />
                                </button>
                            </div>

                            <div className="flex items-center justify-between py-3">
                                <div>
                                    <p className="text-sm font-medium text-white">Stop on reply</p>
                                    <p className="text-xs text-gray-500">Stop sequence when contact replies</p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setFormData(prev => ({
                                        ...prev,
                                        settings: { ...prev.settings, stopOnReply: !prev.settings.stopOnReply }
                                    }))}
                                    className={`w-12 h-6 rounded-full transition-colors relative ${
                                        formData.settings.stopOnReply ? 'bg-brand-teal' : 'bg-gray-700'
                                    }`}
                                >
                                    <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
                                        formData.settings.stopOnReply ? 'translate-x-7' : 'translate-x-1'
                                    }`} />
                                </button>
                            </div>

                            <div className="flex items-center justify-between py-3">
                                <div>
                                    <p className="text-sm font-medium text-white">Stop on meeting</p>
                                    <p className="text-xs text-gray-500">Stop when a meeting is scheduled</p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setFormData(prev => ({
                                        ...prev,
                                        settings: { ...prev.settings, stopOnMeeting: !prev.settings.stopOnMeeting }
                                    }))}
                                    className={`w-12 h-6 rounded-full transition-colors relative ${
                                        formData.settings.stopOnMeeting ? 'bg-brand-teal' : 'bg-gray-700'
                                    }`}
                                >
                                    <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
                                        formData.settings.stopOnMeeting ? 'translate-x-7' : 'translate-x-1'
                                    }`} />
                                </button>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">
                                    Preferred send time
                                </label>
                                <input
                                    type="time"
                                    value={formData.settings.sendTime}
                                    onChange={(e) => setFormData(prev => ({
                                        ...prev,
                                        settings: { ...prev.settings, sendTime: e.target.value }
                                    }))}
                                    className="w-48 px-4 py-2 bg-dark-bg border border-dark-border rounded-lg text-white focus:outline-none focus:border-brand-teal"
                                />
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex justify-end gap-3 px-6 py-4 border-t border-dark-border">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSaveSequence}
                        disabled={isSubmitting}
                        className="flex items-center gap-2 px-4 py-2 bg-brand-teal text-white rounded-lg hover:bg-brand-teal/90 transition-colors disabled:opacity-50"
                    >
                        {isSubmitting ? (
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            <Save className="w-4 h-4" />
                        )}
                        {sequence ? 'Save Changes' : 'Create Sequence'}
                    </button>
                </div>

                {/* Step Editor Modal */}
                {editingStep && (
                    <StepEditor
                        step={editingStep}
                        templates={templates}
                        onSave={handleSaveStep}
                        onClose={() => setEditingStep(null)}
                    />
                )}
            </div>
        </div>
    );
}

// Step Editor Sub-modal
function StepEditor({ step, templates, onSave, onClose }) {
    const [formData, setFormData] = useState({
        ...step,
    });

    const handleSave = () => {
        onSave(formData);
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
            <div className="bg-dark-nav border border-dark-border rounded-lg w-full max-w-lg">
                <div className="flex items-center justify-between px-4 py-3 border-b border-dark-border">
                    <h3 className="font-medium text-white">Edit Step</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-white">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-4 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Step Name</label>
                        <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                            className="w-full px-3 py-2 bg-dark-bg border border-dark-border rounded-lg text-white focus:outline-none focus:border-brand-teal"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1">Trigger</label>
                            <select
                                value={formData.trigger_type}
                                onChange={(e) => setFormData(prev => ({ ...prev, trigger_type: e.target.value }))}
                                className="w-full px-3 py-2 bg-dark-bg border border-dark-border rounded-lg text-white focus:outline-none focus:border-brand-teal"
                            >
                                {Object.entries(STEP_TRIGGERS).map(([key, config]) => (
                                    <option key={key} value={key}>{config.icon} {config.label}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1">Value</label>
                            <input
                                type="number"
                                value={formData.trigger_value}
                                onChange={(e) => setFormData(prev => ({ ...prev, trigger_value: parseInt(e.target.value) || 0 }))}
                                min={0}
                                className="w-full px-3 py-2 bg-dark-bg border border-dark-border rounded-lg text-white focus:outline-none focus:border-brand-teal"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Template</label>
                        <select
                            value={formData.template_id || ''}
                            onChange={(e) => setFormData(prev => ({ ...prev, template_id: e.target.value || null }))}
                            className="w-full px-3 py-2 bg-dark-bg border border-dark-border rounded-lg text-white focus:outline-none focus:border-brand-teal"
                        >
                            <option value="">Custom email</option>
                            {templates?.map(t => (
                                <option key={t.id} value={t.id}>{t.name}</option>
                            ))}
                        </select>
                    </div>

                    {!formData.template_id && (
                        <>
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">Subject</label>
                                <input
                                    type="text"
                                    value={formData.subject || ''}
                                    onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
                                    placeholder="Email subject line"
                                    className="w-full px-3 py-2 bg-dark-bg border border-dark-border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-brand-teal"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">Body</label>
                                <textarea
                                    value={formData.body || ''}
                                    onChange={(e) => setFormData(prev => ({ ...prev, body: e.target.value }))}
                                    placeholder="Email body content"
                                    rows={6}
                                    className="w-full px-3 py-2 bg-dark-bg border border-dark-border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-brand-teal resize-none"
                                />
                            </div>
                        </>
                    )}
                </div>

                <div className="flex justify-end gap-3 px-4 py-3 border-t border-dark-border">
                    <button onClick={onClose} className="px-4 py-2 text-gray-400 hover:text-white">
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        className="px-4 py-2 bg-brand-teal text-white rounded-lg hover:bg-brand-teal/90"
                    >
                        Save Step
                    </button>
                </div>
            </div>
        </div>
    );
}

// Main Page
export default function EmailSequencesPage() {
    const {
        sequences,
        isLoading,
        loadSequences,
        setSequenceStatus,
        deleteSequence,
    } = useEmailSequenceStore();

    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [filterCategory, setFilterCategory] = useState('all');
    const [showEditor, setShowEditor] = useState(false);
    const [editingSequence, setEditingSequence] = useState(null);
    const [deleteConfirm, setDeleteConfirm] = useState(null);

    useEffect(() => {
        loadSequences();
    }, []);

    const filteredSequences = sequences.filter(seq => {
        const matchesSearch = !searchQuery ||
            seq.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            seq.description?.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesStatus = filterStatus === 'all' || seq.status === filterStatus;
        const matchesCategory = filterCategory === 'all' || seq.category === filterCategory;

        return matchesSearch && matchesStatus && matchesCategory;
    });

    const handleEdit = (sequence) => {
        setEditingSequence(sequence);
        setShowEditor(true);
    };

    const handleView = (sequence) => {
        setEditingSequence(sequence);
        setShowEditor(true);
    };

    const handleToggle = async (sequence) => {
        const newStatus = sequence.status === 'active' ? 'paused' : 'active';
        await setSequenceStatus(sequence.id, newStatus);
    };

    const handleDelete = (sequence) => {
        setDeleteConfirm(sequence);
    };

    const confirmDelete = async () => {
        if (deleteConfirm) {
            await deleteSequence(deleteConfirm.id);
            setDeleteConfirm(null);
        }
    };

    const handleDuplicate = async (sequence) => {
        // Create a duplicate
        setEditingSequence({
            ...sequence,
            id: null,
            name: `${sequence.name} (Copy)`,
            status: 'draft',
        });
        setShowEditor(true);
    };

    return (
        <div className="p-6 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-semibold text-white">Email Sequences</h1>
                    <p className="text-gray-400 mt-1">Automated multi-step email campaigns</p>
                </div>

                <button
                    onClick={() => { setEditingSequence(null); setShowEditor(true); }}
                    className="flex items-center gap-2 px-4 py-2 bg-brand-teal text-white rounded-lg hover:bg-brand-teal/90 transition-colors"
                >
                    <Plus className="w-4 h-4" />
                    New Sequence
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-4 gap-4 mb-6">
                <div className="bg-dark-card border border-dark-border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-gray-400 text-sm">Total Sequences</span>
                        <Mail className="w-4 h-4 text-brand-teal" />
                    </div>
                    <p className="text-2xl font-semibold text-white">{sequences.length}</p>
                </div>

                <div className="bg-dark-card border border-dark-border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-gray-400 text-sm">Active</span>
                        <Play className="w-4 h-4 text-green-400" />
                    </div>
                    <p className="text-2xl font-semibold text-white">
                        {sequences.filter(s => s.status === 'active').length}
                    </p>
                </div>

                <div className="bg-dark-card border border-dark-border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-gray-400 text-sm">Enrolled</span>
                        <Users className="w-4 h-4 text-blue-400" />
                    </div>
                    <p className="text-2xl font-semibold text-white">--</p>
                </div>

                <div className="bg-dark-card border border-dark-border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-gray-400 text-sm">Avg Open Rate</span>
                        <BarChart3 className="w-4 h-4 text-purple-400" />
                    </div>
                    <p className="text-2xl font-semibold text-white">--%</p>
                </div>
            </div>

            {/* Filters */}
            <div className="flex items-center gap-4 mb-6">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search sequences..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-dark-card border border-dark-border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-brand-teal"
                    />
                </div>

                <div className="flex items-center gap-2">
                    <Filter className="w-4 h-4 text-gray-400" />
                    <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        className="px-3 py-2 bg-dark-card border border-dark-border rounded-lg text-gray-300 focus:outline-none focus:border-brand-teal"
                    >
                        <option value="all">All Status</option>
                        {Object.entries(SEQUENCE_STATUS).map(([key, config]) => (
                            <option key={key} value={key}>{config.label}</option>
                        ))}
                    </select>

                    <select
                        value={filterCategory}
                        onChange={(e) => setFilterCategory(e.target.value)}
                        className="px-3 py-2 bg-dark-card border border-dark-border rounded-lg text-gray-300 focus:outline-none focus:border-brand-teal"
                    >
                        <option value="all">All Categories</option>
                        {Object.entries(SEQUENCE_CATEGORIES).map(([key, config]) => (
                            <option key={key} value={key}>{config.icon} {config.label}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Sequences Grid */}
            {isLoading ? (
                <div className="flex items-center justify-center py-12">
                    <div className="animate-spin w-8 h-8 border-2 border-brand-teal border-t-transparent rounded-full" />
                </div>
            ) : filteredSequences.length === 0 ? (
                <div className="text-center py-12 bg-dark-card border border-dark-border rounded-lg">
                    <Mail className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-white mb-2">
                        {sequences.length === 0 ? 'No sequences yet' : 'No matching sequences'}
                    </h3>
                    <p className="text-gray-400 mb-4">
                        {sequences.length === 0
                            ? 'Create your first email sequence to automate outreach'
                            : 'Try adjusting your search or filters'}
                    </p>
                    {sequences.length === 0 && (
                        <button
                            onClick={() => setShowEditor(true)}
                            className="px-4 py-2 bg-brand-teal text-white rounded-lg hover:bg-brand-teal/90 transition-colors"
                        >
                            Create Sequence
                        </button>
                    )}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredSequences.map(sequence => (
                        <SequenceCard
                            key={sequence.id}
                            sequence={sequence}
                            onEdit={handleEdit}
                            onView={handleView}
                            onToggle={handleToggle}
                            onDelete={handleDelete}
                            onDuplicate={handleDuplicate}
                        />
                    ))}
                </div>
            )}

            {/* Sequence Editor Modal */}
            {showEditor && (
                <SequenceEditor
                    sequence={editingSequence}
                    onClose={() => { setShowEditor(false); setEditingSequence(null); }}
                />
            )}

            {/* Delete Confirmation Modal */}
            {deleteConfirm && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-dark-card border border-dark-border rounded-lg p-6 max-w-md w-full">
                        <h3 className="text-lg font-semibold text-white mb-2">Delete Sequence</h3>
                        <p className="text-gray-400 mb-4">
                            Are you sure you want to delete "{deleteConfirm.name}"? All enrollments will be stopped.
                        </p>
                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => setDeleteConfirm(null)}
                                className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmDelete}
                                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
