import { useState, useMemo, useEffect } from 'react';
import { useProjectStore, PROJECT_STATUSES } from '../store/projectStore';
import { useClientStore } from '../store/clientStore';
import { formatCurrency } from '../utils/currency';

// Format date helper
const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
};

// Format date short
const formatDateShort = (dateStr) => {
    if (!dateStr) return null;
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
};

// Status badge component
function StatusBadge({ status }) {
    const statusInfo = PROJECT_STATUSES[status] || { label: status, color: 'gray' };

    const colorClasses = {
        gray: 'text-gray-400 bg-gray-500/10 border-gray-500/20',
        blue: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
        yellow: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20',
        green: 'text-green-400 bg-green-500/10 border-green-500/20',
        purple: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
        red: 'text-red-400 bg-red-500/10 border-red-500/20',
    };

    return (
        <span className={`text-xs px-2 py-0.5 rounded border ${colorClasses[statusInfo.color] || colorClasses.gray}`}>
            {statusInfo.label}
        </span>
    );
}

// Project card component
function ProjectCard({ project, onSelect }) {
    const budgetUsed = project.budgetTotal > 0
        ? Math.round((project.actualsTotal / project.budgetTotal) * 100)
        : 0;

    return (
        <div
            onClick={() => onSelect(project.id)}
            className="bg-dark-card border border-dark-border rounded-lg p-4 hover:border-accent-primary/50 cursor-pointer transition-all"
        >
            {/* Header */}
            <div className="flex items-start justify-between gap-3 mb-3">
                <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs text-gray-500 font-mono">{project.projectCode}</span>
                        <StatusBadge status={project.status} />
                    </div>
                    <h3 className="font-semibold text-gray-100 truncate">{project.name}</h3>
                    {project.client?.company && (
                        <p className="text-sm text-gray-400 truncate">{project.client.company}</p>
                    )}
                </div>
                <div className="text-right shrink-0">
                    <div className="font-semibold text-gray-200">
                        {formatCurrency(project.budgetTotal, project.currency, 0)}
                    </div>
                    <div className="text-xs text-gray-500">Budget</div>
                </div>
            </div>

            {/* Date range */}
            {(project.startDate || project.endDate) && (
                <div className="flex items-center gap-2 text-sm text-gray-400 mb-3">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span>
                        {formatDateShort(project.startDate)}
                        {project.endDate && ` — ${formatDateShort(project.endDate)}`}
                    </span>
                </div>
            )}

            {/* Budget progress */}
            {project.budgetTotal > 0 && (
                <div className="mt-3">
                    <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-gray-500">Spend vs Budget</span>
                        <span className={budgetUsed > 100 ? 'text-red-400' : 'text-gray-400'}>
                            {formatCurrency(project.actualsTotal, project.currency, 0)} ({budgetUsed}%)
                        </span>
                    </div>
                    <div className="h-1.5 bg-dark-bg rounded-full overflow-hidden">
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

            {/* Footer with tags and location */}
            <div className="flex items-center gap-2 mt-3 text-xs text-gray-500">
                {project.country && (
                    <span className="flex items-center gap-1">
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        {project.country}
                    </span>
                )}
                {project.projectManagerName && (
                    <span className="flex items-center gap-1">
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        {project.projectManagerName}
                    </span>
                )}
            </div>
        </div>
    );
}

// New project modal
function NewProjectModal({ isOpen, onClose, onSave, clients }) {
    const [formData, setFormData] = useState({
        name: '',
        clientId: '',
        description: '',
        startDate: '',
        endDate: '',
        currency: 'USD',
        budgetTotal: '',
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!formData.name.trim()) return;

        onSave({
            ...formData,
            budgetTotal: parseFloat(formData.budgetTotal) || 0,
            client: clients.find(c => c.id === formData.clientId) || {},
        });

        setFormData({
            name: '',
            clientId: '',
            description: '',
            startDate: '',
            endDate: '',
            currency: 'USD',
            budgetTotal: '',
        });
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-[#1a1f2e] border border-dark-border rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between p-4 border-b border-dark-border">
                    <h2 className="text-lg font-semibold text-gray-100">New Project</h2>
                    <button
                        onClick={onClose}
                        className="btn-icon"
                        aria-label="Close"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-4 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">
                            Project Name *
                        </label>
                        <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="input w-full"
                            placeholder="e.g., FIFA World Cup 2026 Coverage"
                            autoFocus
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">
                            Client
                        </label>
                        <select
                            value={formData.clientId}
                            onChange={(e) => setFormData({ ...formData, clientId: e.target.value })}
                            className="input w-full"
                        >
                            <option value="">Select client...</option>
                            {clients.map(client => (
                                <option key={client.id} value={client.id}>
                                    {client.company}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">
                            Description
                        </label>
                        <textarea
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            className="input w-full"
                            rows={3}
                            placeholder="Brief project description..."
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1">
                                Start Date
                            </label>
                            <input
                                type="date"
                                value={formData.startDate}
                                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                                className="input w-full"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1">
                                End Date
                            </label>
                            <input
                                type="date"
                                value={formData.endDate}
                                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                                className="input w-full"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1">
                                Currency
                            </label>
                            <select
                                value={formData.currency}
                                onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                                className="input w-full"
                            >
                                <option value="USD">USD</option>
                                <option value="MYR">MYR</option>
                                <option value="SGD">SGD</option>
                                <option value="EUR">EUR</option>
                                <option value="GBP">GBP</option>
                                <option value="AED">AED</option>
                                <option value="SAR">SAR</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1">
                                Budget
                            </label>
                            <input
                                type="number"
                                value={formData.budgetTotal}
                                onChange={(e) => setFormData({ ...formData, budgetTotal: e.target.value })}
                                className="input w-full"
                                placeholder="0"
                                min="0"
                                step="1000"
                            />
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="btn-secondary"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="btn-primary"
                        >
                            Create Project
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default function ProjectsPage({ onSelectProject }) {
    const { projects, loading, error, initialize, addProject, getProjectStats } = useProjectStore();
    const { clients, initialize: initClients } = useClientStore();
    const [statusFilter, setStatusFilter] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [showNewModal, setShowNewModal] = useState(false);
    const [viewMode, setViewMode] = useState('grid'); // grid or list

    // Initialize on mount
    useEffect(() => {
        initialize();
        initClients();
    }, [initialize, initClients]);

    // Filter projects
    const filteredProjects = useMemo(() => {
        let result = [...projects];

        // Status filter
        if (statusFilter !== 'all') {
            result = result.filter(p => p.status === statusFilter);
        }

        // Search filter
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            result = result.filter(p =>
                p.name?.toLowerCase().includes(query) ||
                p.projectCode?.toLowerCase().includes(query) ||
                p.client?.company?.toLowerCase().includes(query) ||
                p.description?.toLowerCase().includes(query)
            );
        }

        return result;
    }, [projects, statusFilter, searchQuery]);

    // Stats
    const stats = useMemo(() => getProjectStats(), [projects, getProjectStats]);

    // Handle create project
    const handleCreateProject = async (projectData) => {
        const project = await addProject(projectData);
        if (project) {
            setShowNewModal(false);
            if (onSelectProject) {
                onSelectProject(project.id);
            }
        }
    };

    if (loading && projects.length === 0) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent-primary"></div>
            </div>
        );
    }

    return (
        <div className="p-6 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-100">Projects</h1>
                    <p className="text-gray-400 text-sm mt-1">
                        {stats.activeCount} active project{stats.activeCount !== 1 ? 's' : ''}
                        {stats.totalBudget > 0 && (
                            <span className="ml-2">
                                • {formatCurrency(stats.totalBudget, 'USD', 0)} total budget
                            </span>
                        )}
                    </p>
                </div>
                <button
                    onClick={() => setShowNewModal(true)}
                    className="btn-primary flex items-center gap-2"
                >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    New Project
                </button>
            </div>

            {/* Stats cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
                {Object.entries(PROJECT_STATUSES).map(([key, { label, color }]) => {
                    const count = stats.byStatus[key] || 0;
                    const isActive = statusFilter === key;

                    return (
                        <button
                            key={key}
                            onClick={() => setStatusFilter(isActive ? 'all' : key)}
                            className={`p-3 rounded-lg border transition-all text-left ${
                                isActive
                                    ? 'border-accent-primary bg-accent-primary/10'
                                    : 'border-dark-border bg-dark-card hover:border-gray-600'
                            }`}
                        >
                            <div className="text-2xl font-bold text-gray-100">{count}</div>
                            <div className="text-xs text-gray-400">{label}</div>
                        </button>
                    );
                })}
            </div>

            {/* Search and filters */}
            <div className="flex flex-col sm:flex-row gap-3 mb-6">
                <div className="relative flex-1">
                    <svg
                        className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        aria-hidden="true"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <input
                        type="text"
                        placeholder="Search projects..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="input w-full pl-10"
                    />
                </div>

                <div className="flex items-center gap-2">
                    {statusFilter !== 'all' && (
                        <button
                            onClick={() => setStatusFilter('all')}
                            className="text-sm text-gray-400 hover:text-gray-200 flex items-center gap-1"
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                            Clear filter
                        </button>
                    )}

                    <div className="flex border border-dark-border rounded-lg overflow-hidden">
                        <button
                            onClick={() => setViewMode('grid')}
                            className={`p-2 ${viewMode === 'grid' ? 'bg-dark-border text-gray-200' : 'text-gray-500 hover:text-gray-300'}`}
                            title="Grid view"
                            aria-label="Grid view"
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                            </svg>
                        </button>
                        <button
                            onClick={() => setViewMode('list')}
                            className={`p-2 ${viewMode === 'list' ? 'bg-dark-border text-gray-200' : 'text-gray-500 hover:text-gray-300'}`}
                            title="List view"
                            aria-label="List view"
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                            </svg>
                        </button>
                    </div>
                </div>
            </div>

            {/* Error message */}
            {error && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-lg mb-6">
                    {error}
                </div>
            )}

            {/* Projects grid/list */}
            {filteredProjects.length === 0 ? (
                <div className="text-center py-12">
                    <svg className="w-16 h-16 mx-auto text-gray-600 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <h3 className="text-lg font-medium text-gray-300 mb-1">No projects found</h3>
                    <p className="text-gray-500 mb-4">
                        {searchQuery || statusFilter !== 'all'
                            ? 'Try adjusting your filters'
                            : 'Create your first project to get started'}
                    </p>
                    {!searchQuery && statusFilter === 'all' && (
                        <button
                            onClick={() => setShowNewModal(true)}
                            className="btn-primary"
                        >
                            Create Project
                        </button>
                    )}
                </div>
            ) : viewMode === 'grid' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredProjects.map(project => (
                        <ProjectCard
                            key={project.id}
                            project={project}
                            onSelect={onSelectProject}
                        />
                    ))}
                </div>
            ) : (
                <div className="bg-dark-card border border-dark-border rounded-lg overflow-hidden">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-dark-border text-left">
                                <th className="p-3 text-xs font-medium text-gray-500 uppercase">Project</th>
                                <th className="p-3 text-xs font-medium text-gray-500 uppercase">Client</th>
                                <th className="p-3 text-xs font-medium text-gray-500 uppercase">Status</th>
                                <th className="p-3 text-xs font-medium text-gray-500 uppercase">Dates</th>
                                <th className="p-3 text-xs font-medium text-gray-500 uppercase text-right">Budget</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredProjects.map(project => (
                                <tr
                                    key={project.id}
                                    onClick={() => onSelectProject(project.id)}
                                    className="border-b border-dark-border last:border-0 hover:bg-dark-bg/50 cursor-pointer"
                                >
                                    <td className="p-3">
                                        <div className="text-xs text-gray-500 font-mono">{project.projectCode}</div>
                                        <div className="font-medium text-gray-200">{project.name}</div>
                                    </td>
                                    <td className="p-3 text-gray-400">
                                        {project.client?.company || '—'}
                                    </td>
                                    <td className="p-3">
                                        <StatusBadge status={project.status} />
                                    </td>
                                    <td className="p-3 text-sm text-gray-400">
                                        {project.startDate ? formatDateShort(project.startDate) : '—'}
                                        {project.endDate && ` — ${formatDateShort(project.endDate)}`}
                                    </td>
                                    <td className="p-3 text-right font-medium text-gray-200">
                                        {formatCurrency(project.budgetTotal, project.currency, 0)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* New project modal */}
            <NewProjectModal
                isOpen={showNewModal}
                onClose={() => setShowNewModal(false)}
                onSave={handleCreateProject}
                clients={clients}
            />
        </div>
    );
}
