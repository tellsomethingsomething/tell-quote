import { useState, useEffect } from 'react';
import { useProjectStore, PROJECT_STATUSES } from '../store/projectStore';
import { useClientStore } from '../store/clientStore';
import { useOpportunityStore } from '../store/opportunityStore';
import {
    useDeliverablesStore,
    DELIVERABLE_TYPES,
    DELIVERABLE_STATUS,
    formatDeliverableDueDate,
} from '../store/deliverablesStore';
import { formatCurrency } from '../utils/currency';

// Format date helper
const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
};

// Status badge component
function StatusBadge({ status, size = 'normal' }) {
    const statusInfo = PROJECT_STATUSES[status] || { label: status, color: 'gray' };

    const colorClasses = {
        gray: 'text-gray-400 bg-gray-500/10 border-gray-500/20',
        blue: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
        yellow: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20',
        green: 'text-green-400 bg-green-500/10 border-green-500/20',
        purple: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
        red: 'text-red-400 bg-red-500/10 border-red-500/20',
    };

    const sizeClasses = size === 'large'
        ? 'text-sm px-3 py-1'
        : 'text-xs px-2 py-0.5';

    return (
        <span className={`${sizeClasses} rounded border ${colorClasses[statusInfo.color] || colorClasses.gray}`}>
            {statusInfo.label}
        </span>
    );
}

// Editable field component
function EditableField({ label, value, onChange, type = 'text', options = null, placeholder = '' }) {
    const [isEditing, setIsEditing] = useState(false);
    const [tempValue, setTempValue] = useState(value);

    const handleSave = () => {
        onChange(tempValue);
        setIsEditing(false);
    };

    const handleCancel = () => {
        setTempValue(value);
        setIsEditing(false);
    };

    if (isEditing) {
        return (
            <div className="flex items-center gap-2">
                {options ? (
                    <select
                        value={tempValue}
                        onChange={(e) => setTempValue(e.target.value)}
                        className="input flex-1"
                        autoFocus
                    >
                        {options.map(opt => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                    </select>
                ) : type === 'textarea' ? (
                    <textarea
                        value={tempValue}
                        onChange={(e) => setTempValue(e.target.value)}
                        className="input flex-1"
                        rows={3}
                        autoFocus
                    />
                ) : (
                    <input
                        type={type}
                        value={tempValue}
                        onChange={(e) => setTempValue(e.target.value)}
                        className="input flex-1"
                        autoFocus
                    />
                )}
                <button onClick={handleSave} className="btn-icon text-green-400" aria-label="Save">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                </button>
                <button onClick={handleCancel} className="btn-icon text-gray-400" aria-label="Cancel">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>
        );
    }

    return (
        <div
            onClick={() => setIsEditing(true)}
            className="cursor-pointer hover:bg-dark-bg/50 rounded px-2 py-1 -mx-2 group"
        >
            <span className={value ? 'text-gray-200' : 'text-gray-500 italic'}>
                {value || placeholder || 'Click to edit'}
            </span>
            <svg
                className="w-4 h-4 inline-block ml-2 text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
            >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
        </div>
    );
}

// Info card component
function InfoCard({ title, children, className = '' }) {
    return (
        <div className={`bg-dark-card border border-dark-border rounded-lg ${className}`}>
            <div className="px-4 py-3 border-b border-dark-border">
                <h3 className="font-medium text-gray-200">{title}</h3>
            </div>
            <div className="p-4">
                {children}
            </div>
        </div>
    );
}

// ============================================
// DELIVERABLES SECTION
// ============================================
function DeliverablesSection({ projectId, currency }) {
    const {
        loadProjectDeliverables,
        createDeliverable,
        updateDeliverable,
        deleteDeliverable,
        createFromTemplate,
        getProjectProgress,
    } = useDeliverablesStore();

    const [deliverables, setDeliverables] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [editingDeliverable, setEditingDeliverable] = useState(null);
    const [showTemplateMenu, setShowTemplateMenu] = useState(false);

    // Load deliverables on mount
    useEffect(() => {
        const load = async () => {
            setLoading(true);
            const data = await loadProjectDeliverables(projectId);
            setDeliverables(data);
            setLoading(false);
        };
        load();
    }, [projectId, loadProjectDeliverables]);

    const handleAdd = async (data) => {
        const newDeliverable = await createDeliverable({
            ...data,
            project_id: projectId,
        });
        setDeliverables([...deliverables, newDeliverable]);
        setShowAddModal(false);
    };

    const handleUpdate = async (id, updates) => {
        const updated = await updateDeliverable(id, updates);
        setDeliverables(deliverables.map(d => d.id === id ? updated : d));
        setEditingDeliverable(null);
    };

    const handleDelete = async (id) => {
        if (!confirm('Delete this deliverable?')) return;
        await deleteDeliverable(id);
        setDeliverables(deliverables.filter(d => d.id !== id));
    };

    const handleUseTemplate = async (templateType) => {
        setLoading(true);
        const created = await createFromTemplate(projectId, templateType);
        setDeliverables([...deliverables, ...created]);
        setShowTemplateMenu(false);
        setLoading(false);
    };

    // Group by status
    const grouped = deliverables.reduce((acc, d) => {
        if (!acc[d.status]) acc[d.status] = [];
        acc[d.status].push(d);
        return acc;
    }, {});

    const progress = {
        total: deliverables.length,
        completed: deliverables.filter(d => ['approved', 'delivered'].includes(d.status)).length,
        percent: deliverables.length > 0
            ? Math.round((deliverables.filter(d => ['approved', 'delivered'].includes(d.status)).length / deliverables.length) * 100)
            : 0,
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="w-8 h-8 border-2 border-accent-primary border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header with actions */}
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-medium text-gray-200">Project Deliverables</h3>
                    <p className="text-sm text-gray-500">
                        {progress.total} deliverables • {progress.completed} completed ({progress.percent}%)
                    </p>
                </div>
                <div className="flex gap-2">
                    <div className="relative">
                        <button
                            onClick={() => setShowTemplateMenu(!showTemplateMenu)}
                            className="px-3 py-2 text-sm bg-dark-bg border border-dark-border rounded-lg text-gray-300 hover:text-white hover:border-gray-500 transition-colors"
                        >
                            📋 Templates
                        </button>
                        {showTemplateMenu && (
                            <>
                                <div className="fixed inset-0 z-40" onClick={() => setShowTemplateMenu(false)} />
                                <div className="absolute right-0 mt-2 w-48 bg-dark-card border border-dark-border rounded-lg shadow-xl z-50">
                                    <button
                                        onClick={() => handleUseTemplate('commercial')}
                                        className="w-full px-4 py-2 text-left text-sm text-gray-300 hover:bg-dark-bg transition-colors"
                                    >
                                        🎬 Commercial
                                    </button>
                                    <button
                                        onClick={() => handleUseTemplate('corporate')}
                                        className="w-full px-4 py-2 text-left text-sm text-gray-300 hover:bg-dark-bg transition-colors"
                                    >
                                        🏢 Corporate
                                    </button>
                                    <button
                                        onClick={() => handleUseTemplate('social_campaign')}
                                        className="w-full px-4 py-2 text-left text-sm text-gray-300 hover:bg-dark-bg transition-colors"
                                    >
                                        📱 Social Campaign
                                    </button>
                                    <button
                                        onClick={() => handleUseTemplate('documentary')}
                                        className="w-full px-4 py-2 text-left text-sm text-gray-300 hover:bg-dark-bg transition-colors"
                                    >
                                        🎥 Documentary
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                    <button
                        onClick={() => setShowAddModal(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-accent-primary rounded-lg text-white hover:opacity-90 transition-opacity"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Add Deliverable
                    </button>
                </div>
            </div>

            {/* Progress bar */}
            {deliverables.length > 0 && (
                <div className="bg-dark-card border border-dark-border rounded-lg p-4">
                    <div className="flex items-center justify-between text-sm mb-2">
                        <span className="text-gray-400">Completion Progress</span>
                        <span className="text-gray-300">{progress.percent}%</span>
                    </div>
                    <div className="h-2 bg-dark-bg rounded-full overflow-hidden">
                        <div
                            className="h-full bg-green-500 rounded-full transition-all"
                            style={{ width: `${progress.percent}%` }}
                        />
                    </div>
                </div>
            )}

            {/* Empty state */}
            {deliverables.length === 0 && (
                <div className="bg-dark-card border border-dark-border rounded-lg p-8 text-center">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-dark-bg flex items-center justify-center">
                        <span className="text-3xl">🎬</span>
                    </div>
                    <h3 className="text-lg font-medium text-gray-200 mb-2">No deliverables yet</h3>
                    <p className="text-gray-500 text-sm mb-4">
                        Add deliverables to track project outputs or use a template
                    </p>
                    <div className="flex gap-2 justify-center">
                        <button
                            onClick={() => setShowTemplateMenu(true)}
                            className="px-4 py-2 bg-dark-bg border border-dark-border rounded-lg text-gray-300 hover:text-white transition-colors"
                        >
                            Use Template
                        </button>
                        <button
                            onClick={() => setShowAddModal(true)}
                            className="px-4 py-2 bg-accent-primary rounded-lg text-white hover:opacity-90 transition-opacity"
                        >
                            Add Deliverable
                        </button>
                    </div>
                </div>
            )}

            {/* Deliverables list */}
            {deliverables.length > 0 && (
                <div className="space-y-4">
                    {deliverables.map((deliverable) => {
                        const typeInfo = DELIVERABLE_TYPES[deliverable.type] || DELIVERABLE_TYPES.other;
                        const statusInfo = DELIVERABLE_STATUS[deliverable.status] || DELIVERABLE_STATUS.pending;
                        const dueInfo = formatDeliverableDueDate(deliverable.due_date);

                        return (
                            <div
                                key={deliverable.id}
                                className="bg-dark-card border border-dark-border rounded-lg p-4 hover:border-gray-600 transition-colors"
                            >
                                <div className="flex items-start gap-4">
                                    {/* Icon */}
                                    <div className="w-10 h-10 rounded-lg bg-dark-bg flex items-center justify-center text-xl">
                                        {typeInfo.icon}
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <h4 className="font-medium text-gray-200 truncate">
                                                {deliverable.name}
                                            </h4>
                                            <span
                                                className="px-2 py-0.5 rounded text-xs font-medium"
                                                style={{
                                                    backgroundColor: `${statusInfo.color}20`,
                                                    color: statusInfo.color
                                                }}
                                            >
                                                {statusInfo.label}
                                            </span>
                                        </div>
                                        <p className="text-sm text-gray-500 mb-2">{typeInfo.label}</p>

                                        {/* Specs */}
                                        <div className="flex flex-wrap gap-3 text-xs text-gray-500">
                                            {deliverable.resolution && (
                                                <span>📐 {deliverable.resolution}</span>
                                            )}
                                            {deliverable.duration && (
                                                <span>⏱️ {deliverable.duration}</span>
                                            )}
                                            {deliverable.current_version > 1 && (
                                                <span>📝 v{deliverable.current_version}</span>
                                            )}
                                            {dueInfo && (
                                                <span className={
                                                    dueInfo.status === 'overdue' ? 'text-red-400' :
                                                    dueInfo.status === 'due-today' ? 'text-yellow-400' :
                                                    dueInfo.status === 'due-soon' ? 'text-orange-400' : ''
                                                }>
                                                    📅 {dueInfo.text}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex items-center gap-1">
                                        <select
                                            value={deliverable.status}
                                            onChange={(e) => handleUpdate(deliverable.id, { status: e.target.value })}
                                            className="text-xs bg-dark-bg border border-dark-border rounded px-2 py-1 text-gray-300"
                                        >
                                            {Object.values(DELIVERABLE_STATUS).map((s) => (
                                                <option key={s.id} value={s.id}>{s.label}</option>
                                            ))}
                                        </select>
                                        <button
                                            onClick={() => setEditingDeliverable(deliverable)}
                                            className="p-2 text-gray-500 hover:text-gray-300 transition-colors"
                                            title="Edit"
                                        >
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                            </svg>
                                        </button>
                                        <button
                                            onClick={() => handleDelete(deliverable.id)}
                                            className="p-2 text-gray-500 hover:text-red-400 transition-colors"
                                            title="Delete"
                                        >
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                            </svg>
                                        </button>
                                    </div>
                                </div>

                                {/* Notes */}
                                {deliverable.description && (
                                    <p className="mt-3 text-sm text-gray-400 pl-14">
                                        {deliverable.description}
                                    </p>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Add/Edit Modal */}
            {(showAddModal || editingDeliverable) && (
                <DeliverableModal
                    deliverable={editingDeliverable}
                    onClose={() => {
                        setShowAddModal(false);
                        setEditingDeliverable(null);
                    }}
                    onSave={editingDeliverable
                        ? (data) => handleUpdate(editingDeliverable.id, data)
                        : handleAdd
                    }
                />
            )}
        </div>
    );
}

// Deliverable Modal
function DeliverableModal({ deliverable, onClose, onSave }) {
    const [formData, setFormData] = useState(deliverable || {
        name: '',
        type: 'video_master',
        description: '',
        status: 'pending',
        due_date: '',
        resolution: '',
        duration: '',
        format: '',
        notes: '',
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(formData);
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-dark-card rounded-xl w-full max-w-lg">
                <div className="flex items-center justify-between p-4 border-b border-dark-border">
                    <h3 className="text-lg font-medium text-gray-200">
                        {deliverable ? 'Edit Deliverable' : 'Add Deliverable'}
                    </h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-white">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-4 space-y-4">
                    <div>
                        <label className="block text-sm text-gray-400 mb-1">Name *</label>
                        <input
                            type="text"
                            required
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="w-full px-3 py-2 bg-dark-bg border border-dark-border rounded-lg text-white"
                            placeholder="e.g., Master Cut, Social 9:16"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm text-gray-400 mb-1">Type</label>
                            <select
                                value={formData.type}
                                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                                className="w-full px-3 py-2 bg-dark-bg border border-dark-border rounded-lg text-white"
                            >
                                {Object.values(DELIVERABLE_TYPES).map((t) => (
                                    <option key={t.id} value={t.id}>{t.icon} {t.label}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm text-gray-400 mb-1">Status</label>
                            <select
                                value={formData.status}
                                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                className="w-full px-3 py-2 bg-dark-bg border border-dark-border rounded-lg text-white"
                            >
                                {Object.values(DELIVERABLE_STATUS).map((s) => (
                                    <option key={s.id} value={s.id}>{s.label}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm text-gray-400 mb-1">Due Date</label>
                            <input
                                type="date"
                                value={formData.due_date?.split('T')[0] || ''}
                                onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                                className="w-full px-3 py-2 bg-dark-bg border border-dark-border rounded-lg text-white"
                            />
                        </div>
                        <div>
                            <label className="block text-sm text-gray-400 mb-1">Resolution</label>
                            <input
                                type="text"
                                value={formData.resolution}
                                onChange={(e) => setFormData({ ...formData, resolution: e.target.value })}
                                className="w-full px-3 py-2 bg-dark-bg border border-dark-border rounded-lg text-white"
                                placeholder="e.g., 1920x1080"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm text-gray-400 mb-1">Duration</label>
                            <input
                                type="text"
                                value={formData.duration}
                                onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                                className="w-full px-3 py-2 bg-dark-bg border border-dark-border rounded-lg text-white"
                                placeholder="e.g., 30s, 2:30"
                            />
                        </div>
                        <div>
                            <label className="block text-sm text-gray-400 mb-1">Format</label>
                            <input
                                type="text"
                                value={formData.format}
                                onChange={(e) => setFormData({ ...formData, format: e.target.value })}
                                className="w-full px-3 py-2 bg-dark-bg border border-dark-border rounded-lg text-white"
                                placeholder="e.g., MP4, ProRes"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm text-gray-400 mb-1">Description</label>
                        <textarea
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            rows={2}
                            className="w-full px-3 py-2 bg-dark-bg border border-dark-border rounded-lg text-white"
                            placeholder="Brief description or specs..."
                        />
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-dark-border">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-gray-400 hover:text-white"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-6 py-2 bg-accent-primary rounded-lg text-white hover:opacity-90"
                        >
                            {deliverable ? 'Save Changes' : 'Add Deliverable'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default function ProjectDetailPage({ projectId, onBack, onEditQuote }) {
    const { projects, getProject, updateProject, deleteProject } = useProjectStore();
    const { clients } = useClientStore();
    const { opportunities, getOpportunity } = useOpportunityStore();

    const project = getProject(projectId);
    const opportunity = project?.opportunityId ? getOpportunity(project.opportunityId) : null;

    const [activeTab, setActiveTab] = useState('overview');

    // Handle field update
    const handleUpdate = async (field, value) => {
        await updateProject(projectId, { [field]: value });
    };

    // Handle status change
    const handleStatusChange = async (newStatus) => {
        await updateProject(projectId, { status: newStatus });
    };

    // Handle delete
    const handleDelete = async () => {
        if (window.confirm('Are you sure you want to delete this project? This action cannot be undone.')) {
            await deleteProject(projectId);
            onBack();
        }
    };

    if (!project) {
        return (
            <div className="p-6 text-center">
                <p className="text-gray-400">Project not found</p>
                <button onClick={onBack} className="btn-secondary mt-4">
                    Back to Projects
                </button>
            </div>
        );
    }

    const budgetUsed = project.budgetTotal > 0
        ? Math.round((project.actualsTotal / project.budgetTotal) * 100)
        : 0;

    const tabs = [
        { id: 'overview', label: 'Overview' },
        { id: 'deliverables', label: 'Deliverables' },
        { id: 'budget', label: 'Budget' },
        { id: 'notes', label: 'Notes' },
    ];

    return (
        <div className="p-6 max-w-6xl mx-auto">
            {/* Header */}
            <div className="mb-6">
                <button
                    onClick={onBack}
                    className="flex items-center gap-2 text-gray-400 hover:text-gray-200 mb-4"
                >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    Back to Projects
                </button>

                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <span className="text-sm text-gray-500 font-mono bg-dark-bg px-2 py-1 rounded">
                                {project.projectCode}
                            </span>
                            <StatusBadge status={project.status} size="large" />
                        </div>
                        <h1 className="text-2xl font-bold text-gray-100">{project.name}</h1>
                        {project.client?.company && (
                            <p className="text-gray-400 mt-1">{project.client.company}</p>
                        )}
                    </div>

                    <div className="flex items-center gap-2">
                        {/* Status dropdown */}
                        <select
                            value={project.status}
                            onChange={(e) => handleStatusChange(e.target.value)}
                            className="input"
                        >
                            {Object.entries(PROJECT_STATUSES).map(([key, { label }]) => (
                                <option key={key} value={key}>{label}</option>
                            ))}
                        </select>

                        <button
                            onClick={handleDelete}
                            className="btn-icon text-red-400 hover:text-red-300"
                            title="Delete project"
                            aria-label="Delete project"
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                        </button>
                    </div>
                </div>
            </div>

            {/* Quick stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                <div className="bg-dark-card border border-dark-border rounded-lg p-4">
                    <div className="text-xs text-gray-500 uppercase mb-1">Budget</div>
                    <div className="text-xl font-bold text-gray-100">
                        {formatCurrency(project.budgetTotal, project.currency, 0)}
                    </div>
                </div>
                <div className="bg-dark-card border border-dark-border rounded-lg p-4">
                    <div className="text-xs text-gray-500 uppercase mb-1">Spent</div>
                    <div className="text-xl font-bold text-gray-100">
                        {formatCurrency(project.actualsTotal, project.currency, 0)}
                    </div>
                    <div className={`text-xs ${budgetUsed > 100 ? 'text-red-400' : 'text-gray-500'}`}>
                        {budgetUsed}% of budget
                    </div>
                </div>
                <div className="bg-dark-card border border-dark-border rounded-lg p-4">
                    <div className="text-xs text-gray-500 uppercase mb-1">Start Date</div>
                    <div className="text-xl font-bold text-gray-100">
                        {formatDate(project.startDate)}
                    </div>
                </div>
                <div className="bg-dark-card border border-dark-border rounded-lg p-4">
                    <div className="text-xs text-gray-500 uppercase mb-1">End Date</div>
                    <div className="text-xl font-bold text-gray-100">
                        {formatDate(project.endDate)}
                    </div>
                </div>
            </div>

            {/* Budget progress bar */}
            {project.budgetTotal > 0 && (
                <div className="bg-dark-card border border-dark-border rounded-lg p-4 mb-6">
                    <div className="flex items-center justify-between text-sm mb-2">
                        <span className="text-gray-400">Budget Progress</span>
                        <span className="text-gray-300">
                            {formatCurrency(project.budgetTotal - project.actualsTotal, project.currency, 0)} remaining
                        </span>
                    </div>
                    <div className="h-3 bg-dark-bg rounded-full overflow-hidden">
                        <div
                            className={`h-full rounded-full transition-all ${
                                budgetUsed > 100 ? 'bg-red-500' :
                                    budgetUsed > 80 ? 'bg-yellow-500' : 'bg-green-500'
                            }`}
                            style={{ width: `${Math.min(budgetUsed, 100)}%` }}
                        />
                    </div>
                </div>
            )}

            {/* Tabs */}
            <div className="border-b border-dark-border mb-6">
                <div className="flex gap-6">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
                                activeTab === tab.id
                                    ? 'text-accent-primary border-accent-primary'
                                    : 'text-gray-500 border-transparent hover:text-gray-300'
                            }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Tab content */}
            {activeTab === 'overview' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Project Details */}
                    <InfoCard title="Project Details">
                        <div className="space-y-4">
                            <div>
                                <label className="text-xs text-gray-500 uppercase block mb-1">Project Name</label>
                                <EditableField
                                    value={project.name}
                                    onChange={(v) => handleUpdate('name', v)}
                                />
                            </div>
                            <div>
                                <label className="text-xs text-gray-500 uppercase block mb-1">Description</label>
                                <EditableField
                                    value={project.description}
                                    onChange={(v) => handleUpdate('description', v)}
                                    type="textarea"
                                    placeholder="Add a description..."
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs text-gray-500 uppercase block mb-1">Start Date</label>
                                    <EditableField
                                        value={project.startDate}
                                        onChange={(v) => handleUpdate('startDate', v)}
                                        type="date"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs text-gray-500 uppercase block mb-1">End Date</label>
                                    <EditableField
                                        value={project.endDate}
                                        onChange={(v) => handleUpdate('endDate', v)}
                                        type="date"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="text-xs text-gray-500 uppercase block mb-1">Location</label>
                                <EditableField
                                    value={project.country}
                                    onChange={(v) => handleUpdate('country', v)}
                                    placeholder="Add location..."
                                />
                            </div>
                            <div>
                                <label className="text-xs text-gray-500 uppercase block mb-1">Project Manager</label>
                                <EditableField
                                    value={project.projectManagerName}
                                    onChange={(v) => handleUpdate('projectManagerName', v)}
                                    placeholder="Assign PM..."
                                />
                            </div>
                        </div>
                    </InfoCard>

                    {/* Client Details */}
                    <InfoCard title="Client">
                        <div className="space-y-4">
                            <div>
                                <label className="text-xs text-gray-500 uppercase block mb-1">Company</label>
                                <div className="text-gray-200">{project.client?.company || '—'}</div>
                            </div>
                            <div>
                                <label className="text-xs text-gray-500 uppercase block mb-1">Contact</label>
                                <div className="text-gray-200">{project.client?.contact || '—'}</div>
                            </div>
                            <div>
                                <label className="text-xs text-gray-500 uppercase block mb-1">Email</label>
                                <div className="text-gray-200">{project.client?.email || '—'}</div>
                            </div>
                            <div>
                                <label className="text-xs text-gray-500 uppercase block mb-1">Phone</label>
                                <div className="text-gray-200">{project.client?.phone || '—'}</div>
                            </div>
                        </div>
                    </InfoCard>

                    {/* Links */}
                    <InfoCard title="Linked Records">
                        <div className="space-y-3">
                            {opportunity && (
                                <div className="flex items-center justify-between p-3 bg-dark-bg rounded-lg">
                                    <div>
                                        <div className="text-xs text-gray-500 uppercase">Opportunity</div>
                                        <div className="text-gray-200">{opportunity.title}</div>
                                    </div>
                                    <span className="text-xs text-blue-400 bg-blue-500/10 px-2 py-1 rounded">
                                        {formatCurrency(opportunity.value, opportunity.currency, 0)}
                                    </span>
                                </div>
                            )}
                            {project.quoteId && (
                                <button
                                    onClick={() => onEditQuote && onEditQuote({ id: project.quoteId })}
                                    className="w-full flex items-center justify-between p-3 bg-dark-bg rounded-lg hover:bg-dark-border/50 transition-colors"
                                >
                                    <div className="text-left">
                                        <div className="text-xs text-gray-500 uppercase">Quote</div>
                                        <div className="text-gray-200">View linked quote</div>
                                    </div>
                                    <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                    </svg>
                                </button>
                            )}
                            {!opportunity && !project.quoteId && (
                                <p className="text-gray-500 text-sm">No linked records</p>
                            )}
                        </div>
                    </InfoCard>

                    {/* Timeline */}
                    <InfoCard title="Timeline">
                        <div className="space-y-3">
                            <div className="flex items-center gap-3">
                                <div className="w-2 h-2 rounded-full bg-gray-500"></div>
                                <div className="flex-1">
                                    <div className="text-sm text-gray-300">Created</div>
                                    <div className="text-xs text-gray-500">{formatDate(project.createdAt)}</div>
                                </div>
                            </div>
                            {project.confirmedAt && (
                                <div className="flex items-center gap-3">
                                    <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                                    <div className="flex-1">
                                        <div className="text-sm text-gray-300">Confirmed</div>
                                        <div className="text-xs text-gray-500">{formatDate(project.confirmedAt)}</div>
                                    </div>
                                </div>
                            )}
                            {project.startedAt && (
                                <div className="flex items-center gap-3">
                                    <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                                    <div className="flex-1">
                                        <div className="text-sm text-gray-300">Started</div>
                                        <div className="text-xs text-gray-500">{formatDate(project.startedAt)}</div>
                                    </div>
                                </div>
                            )}
                            {project.wrappedAt && (
                                <div className="flex items-center gap-3">
                                    <div className="w-2 h-2 rounded-full bg-green-500"></div>
                                    <div className="flex-1">
                                        <div className="text-sm text-gray-300">Wrapped</div>
                                        <div className="text-xs text-gray-500">{formatDate(project.wrappedAt)}</div>
                                    </div>
                                </div>
                            )}
                            {project.closedAt && (
                                <div className="flex items-center gap-3">
                                    <div className="w-2 h-2 rounded-full bg-purple-500"></div>
                                    <div className="flex-1">
                                        <div className="text-sm text-gray-300">Closed</div>
                                        <div className="text-xs text-gray-500">{formatDate(project.closedAt)}</div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </InfoCard>
                </div>
            )}

            {activeTab === 'deliverables' && (
                <DeliverablesSection projectId={projectId} currency={project.currency} />
            )}

            {activeTab === 'budget' && (
                <div className="space-y-6">
                    <InfoCard title="Budget Overview">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                            <div>
                                <label className="text-xs text-gray-500 uppercase block mb-1">Total Budget</label>
                                <EditableField
                                    value={String(project.budgetTotal)}
                                    onChange={(v) => handleUpdate('budgetTotal', parseFloat(v) || 0)}
                                    type="number"
                                />
                            </div>
                            <div>
                                <label className="text-xs text-gray-500 uppercase block mb-1">Actuals</label>
                                <EditableField
                                    value={String(project.actualsTotal)}
                                    onChange={(v) => handleUpdate('actualsTotal', parseFloat(v) || 0)}
                                    type="number"
                                />
                            </div>
                            <div>
                                <label className="text-xs text-gray-500 uppercase block mb-1">Currency</label>
                                <EditableField
                                    value={project.currency}
                                    onChange={(v) => handleUpdate('currency', v)}
                                    options={[
                                        { value: 'USD', label: 'USD' },
                                        { value: 'MYR', label: 'MYR' },
                                        { value: 'SGD', label: 'SGD' },
                                        { value: 'EUR', label: 'EUR' },
                                        { value: 'GBP', label: 'GBP' },
                                        { value: 'AED', label: 'AED' },
                                        { value: 'SAR', label: 'SAR' },
                                    ]}
                                />
                            </div>
                        </div>
                    </InfoCard>

                    <div className="bg-dark-card border border-dark-border rounded-lg p-6 text-center">
                        <svg className="w-12 h-12 mx-auto text-gray-600 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                        </svg>
                        <h3 className="text-gray-300 font-medium mb-1">Detailed Budget Tracking</h3>
                        <p className="text-gray-500 text-sm">
                            Coming soon: Track costs by category, compare actuals to budget lines, and forecast profitability.
                        </p>
                    </div>
                </div>
            )}

            {activeTab === 'notes' && (
                <InfoCard title="Project Notes">
                    <EditableField
                        value={project.notes}
                        onChange={(v) => handleUpdate('notes', v)}
                        type="textarea"
                        placeholder="Add project notes, key decisions, lessons learned..."
                    />
                </InfoCard>
            )}
        </div>
    );
}
