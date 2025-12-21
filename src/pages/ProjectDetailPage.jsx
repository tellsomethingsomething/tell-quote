import { useState, useEffect } from 'react';
import { useProjectStore, PROJECT_STATUSES } from '../store/projectStore';
import { useClientStore } from '../store/clientStore';
import { useOpportunityStore } from '../store/opportunityStore';
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
