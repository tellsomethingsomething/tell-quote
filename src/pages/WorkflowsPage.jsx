import React, { useState, useEffect } from 'react';
import {
    Zap,
    Plus,
    Search,
    MoreVertical,
    Play,
    Pause,
    Trash2,
    Edit2,
    Copy,
    ArrowRight,
    Clock,
    CheckCircle,
    XCircle,
    Filter,
    Activity,
    TrendingUp,
} from 'lucide-react';
import { useWorkflowStore, TRIGGER_TYPES, ACTION_TYPES } from '../store/workflowStore';
import WorkflowEditor from '../components/crm/WorkflowEditor';

function WorkflowCard({ workflow, onEdit, onToggle, onDelete, onDuplicate }) {
    const [showMenu, setShowMenu] = useState(false);
    const triggerConfig = TRIGGER_TYPES[workflow.trigger_type];
    const actions = workflow.actions || [];

    const formatLastRun = (date) => {
        if (!date) return 'Never';
        const d = new Date(date);
        const now = new Date();
        const diff = now - d;
        if (diff < 60000) return 'Just now';
        if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
        if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
        return d.toLocaleDateString();
    };

    return (
        <div className={`bg-dark-card border rounded-lg p-4 transition-all ${
            workflow.is_active ? 'border-dark-border' : 'border-dark-border/50 opacity-60'
        }`}>
            <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        workflow.is_active ? 'bg-brand-primary/20' : 'bg-gray-700'
                    }`}>
                        <Zap className={`w-5 h-5 ${workflow.is_active ? 'text-brand-primary' : 'text-gray-500'}`} />
                    </div>
                    <div>
                        <h3 className="font-medium text-white">{workflow.name}</h3>
                        {workflow.description && (
                            <p className="text-xs text-gray-400 mt-0.5">{workflow.description}</p>
                        )}
                    </div>
                </div>

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
                                    onClick={() => { onEdit(workflow); setShowMenu(false); }}
                                    className="w-full px-3 py-2 text-left text-sm text-gray-300 hover:bg-dark-card flex items-center gap-2"
                                >
                                    <Edit2 className="w-4 h-4" />
                                    Edit
                                </button>
                                <button
                                    onClick={() => { onDuplicate(workflow); setShowMenu(false); }}
                                    className="w-full px-3 py-2 text-left text-sm text-gray-300 hover:bg-dark-card flex items-center gap-2"
                                >
                                    <Copy className="w-4 h-4" />
                                    Duplicate
                                </button>
                                <button
                                    onClick={() => { onToggle(workflow); setShowMenu(false); }}
                                    className="w-full px-3 py-2 text-left text-sm text-gray-300 hover:bg-dark-card flex items-center gap-2"
                                >
                                    {workflow.is_active ? (
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
                                    onClick={() => { onDelete(workflow); setShowMenu(false); }}
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

            {/* Trigger and Actions */}
            <div className="flex items-center gap-2 text-sm mb-3">
                <div className="flex items-center gap-1.5 px-2 py-1 bg-purple-500/20 text-purple-300 rounded">
                    <span>{triggerConfig?.icon || '⚡'}</span>
                    <span>{triggerConfig?.label || workflow.trigger_type}</span>
                </div>
                <ArrowRight className="w-4 h-4 text-gray-500" />
                <div className="flex items-center gap-1 flex-wrap">
                    {actions.slice(0, 3).map((action, i) => {
                        const actionConfig = ACTION_TYPES[action.type];
                        return (
                            <span
                                key={i}
                                className={`px-2 py-1 rounded text-xs ${actionConfig?.color || 'text-gray-400'} bg-dark-bg`}
                            >
                                {actionConfig?.icon || '•'} {actionConfig?.label || action.type}
                            </span>
                        );
                    })}
                    {actions.length > 3 && (
                        <span className="px-2 py-1 rounded text-xs text-gray-400 bg-dark-bg">
                            +{actions.length - 3} more
                        </span>
                    )}
                </div>
            </div>

            {/* Stats */}
            <div className="flex items-center justify-between text-xs text-gray-500 pt-3 border-t border-dark-border">
                <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1">
                        <Activity className="w-3 h-3" />
                        {workflow.execution_count || 0} runs
                    </span>
                    <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatLastRun(workflow.last_run_at)}
                    </span>
                </div>
                <div className={`flex items-center gap-1 px-2 py-0.5 rounded ${
                    workflow.is_active ? 'bg-green-500/20 text-green-400' : 'bg-gray-700 text-gray-400'
                }`}>
                    {workflow.is_active ? (
                        <>
                            <CheckCircle className="w-3 h-3" />
                            Active
                        </>
                    ) : (
                        <>
                            <XCircle className="w-3 h-3" />
                            Paused
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

function WorkflowStats({ workflows, executions }) {
    const activeCount = workflows.filter(w => w.is_active).length;
    const totalRuns = workflows.reduce((sum, w) => sum + (w.execution_count || 0), 0);
    const successfulRuns = executions.filter(e => e.status === 'completed').length;
    const successRate = totalRuns > 0 ? Math.round((successfulRuns / totalRuns) * 100) : 0;

    return (
        <div className="grid grid-cols-4 gap-4 mb-6">
            <div className="bg-dark-card border border-dark-border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-gray-400 text-sm">Total Workflows</span>
                    <Zap className="w-4 h-4 text-brand-primary" />
                </div>
                <p className="text-2xl font-semibold text-white">{workflows.length}</p>
            </div>

            <div className="bg-dark-card border border-dark-border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-gray-400 text-sm">Active</span>
                    <Play className="w-4 h-4 text-green-400" />
                </div>
                <p className="text-2xl font-semibold text-white">{activeCount}</p>
            </div>

            <div className="bg-dark-card border border-dark-border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-gray-400 text-sm">Total Runs</span>
                    <Activity className="w-4 h-4 text-purple-400" />
                </div>
                <p className="text-2xl font-semibold text-white">{totalRuns}</p>
            </div>

            <div className="bg-dark-card border border-dark-border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-gray-400 text-sm">Success Rate</span>
                    <TrendingUp className="w-4 h-4 text-amber-400" />
                </div>
                <p className="text-2xl font-semibold text-white">{successRate}%</p>
            </div>
        </div>
    );
}

export default function WorkflowsPage() {
    const {
        workflows,
        executions,
        isLoading,
        loadWorkflows,
        loadExecutions,
        updateWorkflow,
        deleteWorkflow,
        duplicateWorkflow,
    } = useWorkflowStore();

    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [filterTrigger, setFilterTrigger] = useState('all');
    const [showEditor, setShowEditor] = useState(false);
    const [editingWorkflow, setEditingWorkflow] = useState(null);
    const [deleteConfirm, setDeleteConfirm] = useState(null);

    useEffect(() => {
        loadWorkflows();
        loadExecutions();
    }, []);

    const filteredWorkflows = workflows.filter(workflow => {
        const matchesSearch = !searchQuery ||
            workflow.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            workflow.description?.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesStatus = filterStatus === 'all' ||
            (filterStatus === 'active' && workflow.is_active) ||
            (filterStatus === 'paused' && !workflow.is_active);

        const matchesTrigger = filterTrigger === 'all' ||
            workflow.trigger_type === filterTrigger;

        return matchesSearch && matchesStatus && matchesTrigger;
    });

    const handleEdit = (workflow) => {
        setEditingWorkflow(workflow);
        setShowEditor(true);
    };

    const handleToggle = async (workflow) => {
        await updateWorkflow(workflow.id, { is_active: !workflow.is_active });
    };

    const handleDelete = async (workflow) => {
        setDeleteConfirm(workflow);
    };

    const confirmDelete = async () => {
        if (deleteConfirm) {
            await deleteWorkflow(deleteConfirm.id);
            setDeleteConfirm(null);
        }
    };

    const handleDuplicate = async (workflow) => {
        await duplicateWorkflow(workflow.id);
    };

    const handleEditorClose = () => {
        setShowEditor(false);
        setEditingWorkflow(null);
    };

    const triggerOptions = Object.entries(TRIGGER_TYPES).map(([key, config]) => ({
        value: key,
        label: config.label,
        icon: config.icon,
    }));

    return (
        <div className="p-6 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-semibold text-white">Workflow Automation</h1>
                    <p className="text-gray-400 mt-1">Automate tasks based on triggers and conditions</p>
                </div>

                <button
                    onClick={() => { setEditingWorkflow(null); setShowEditor(true); }}
                    className="flex items-center gap-2 px-4 py-2 bg-brand-primary text-white rounded-lg hover:bg-brand-primary/90 transition-colors"
                >
                    <Plus className="w-4 h-4" />
                    New Workflow
                </button>
            </div>

            {/* Stats */}
            <WorkflowStats workflows={workflows} executions={executions} />

            {/* Filters */}
            <div className="flex items-center gap-4 mb-6">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search workflows..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-dark-card border border-dark-border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-brand-primary"
                    />
                </div>

                <div className="flex items-center gap-2">
                    <Filter className="w-4 h-4 text-gray-400" />
                    <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        className="px-3 py-2 bg-dark-card border border-dark-border rounded-lg text-gray-300 focus:outline-none focus:border-brand-primary"
                    >
                        <option value="all">All Status</option>
                        <option value="active">Active</option>
                        <option value="paused">Paused</option>
                    </select>

                    <select
                        value={filterTrigger}
                        onChange={(e) => setFilterTrigger(e.target.value)}
                        className="px-3 py-2 bg-dark-card border border-dark-border rounded-lg text-gray-300 focus:outline-none focus:border-brand-primary"
                    >
                        <option value="all">All Triggers</option>
                        {triggerOptions.map(opt => (
                            <option key={opt.value} value={opt.value}>
                                {opt.icon} {opt.label}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Workflows Grid */}
            {isLoading ? (
                <div className="flex items-center justify-center py-12">
                    <div className="animate-spin w-8 h-8 border-2 border-brand-primary border-t-transparent rounded-full" />
                </div>
            ) : filteredWorkflows.length === 0 ? (
                <div className="text-center py-12 bg-dark-card border border-dark-border rounded-lg">
                    <Zap className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-white mb-2">
                        {workflows.length === 0 ? 'No workflows yet' : 'No matching workflows'}
                    </h3>
                    <p className="text-gray-400 mb-4">
                        {workflows.length === 0
                            ? 'Create your first workflow to automate repetitive tasks'
                            : 'Try adjusting your search or filters'}
                    </p>
                    {workflows.length === 0 && (
                        <button
                            onClick={() => setShowEditor(true)}
                            className="px-4 py-2 bg-brand-primary text-white rounded-lg hover:bg-brand-primary/90 transition-colors"
                        >
                            Create Workflow
                        </button>
                    )}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredWorkflows.map(workflow => (
                        <WorkflowCard
                            key={workflow.id}
                            workflow={workflow}
                            onEdit={handleEdit}
                            onToggle={handleToggle}
                            onDelete={handleDelete}
                            onDuplicate={handleDuplicate}
                        />
                    ))}
                </div>
            )}

            {/* Workflow Editor Modal */}
            {showEditor && (
                <WorkflowEditor
                    workflow={editingWorkflow}
                    onClose={handleEditorClose}
                />
            )}

            {/* Delete Confirmation Modal */}
            {deleteConfirm && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-dark-card border border-dark-border rounded-lg p-6 max-w-md w-full">
                        <h3 className="text-lg font-semibold text-white mb-2">Delete Workflow</h3>
                        <p className="text-gray-400 mb-4">
                            Are you sure you want to delete "{deleteConfirm.name}"? This action cannot be undone.
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
