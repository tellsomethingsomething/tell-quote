import { useState, useMemo } from 'react';
import { useContractStore, CONTRACT_STATUSES, CONTRACT_TYPES } from '../store/contractStore';
import { useProjectStore } from '../store/projectStore';
import { useClientStore } from '../store/clientStore';
import { useCrewStore } from '../store/crewStore';
import { formatCurrency } from '../utils/currency';

export default function ContractsPage() {
    const { contracts, loading, createContract, updateContract, deleteContract, updateStatus, getExpiringContracts } = useContractStore();
    const { projects } = useProjectStore();
    const { clients } = useClientStore();
    const { crew } = useCrewStore();
    const [showModal, setShowModal] = useState(false);
    const [editingContract, setEditingContract] = useState(null);
    const [filterStatus, setFilterStatus] = useState('all');
    const [filterType, setFilterType] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');

    // Form state
    const [formData, setFormData] = useState({
        title: '',
        contractType: 'other',
        projectId: '',
        clientId: '',
        crewId: '',
        partyName: '',
        partyEmail: '',
        partyCompany: '',
        startDate: '',
        endDate: '',
        expiresAt: '',
        value: 0,
        currency: 'USD',
        description: '',
        notes: '',
    });

    // Filter and search contracts
    const filteredContracts = useMemo(() => {
        return contracts.filter(c => {
            if (filterStatus !== 'all' && c.status !== filterStatus) return false;
            if (filterType !== 'all' && c.contractType !== filterType) return false;
            if (searchQuery) {
                const query = searchQuery.toLowerCase();
                return (
                    c.contractRef?.toLowerCase().includes(query) ||
                    c.title?.toLowerCase().includes(query) ||
                    c.partyName?.toLowerCase().includes(query) ||
                    c.partyCompany?.toLowerCase().includes(query)
                );
            }
            return true;
        });
    }, [contracts, filterStatus, filterType, searchQuery]);

    // Expiring soon
    const expiringContracts = useMemo(() => getExpiringContracts(30), [contracts]);

    // Stats
    const stats = useMemo(() => {
        const all = contracts;
        return {
            total: all.length,
            draft: all.filter(c => c.status === 'draft').length,
            pending: all.filter(c => ['pending_review', 'sent'].includes(c.status)).length,
            active: all.filter(c => ['signed', 'active'].includes(c.status)).length,
            expiring: expiringContracts.length,
            totalValue: all.filter(c => ['signed', 'active'].includes(c.status)).reduce((sum, c) => sum + (c.value || 0), 0),
        };
    }, [contracts, expiringContracts]);

    const resetForm = () => {
        setFormData({
            title: '',
            contractType: 'other',
            projectId: '',
            clientId: '',
            crewId: '',
            partyName: '',
            partyEmail: '',
            partyCompany: '',
            startDate: '',
            endDate: '',
            expiresAt: '',
            value: 0,
            currency: 'USD',
            description: '',
            notes: '',
        });
        setEditingContract(null);
    };

    const handleEdit = (contract) => {
        setEditingContract(contract);
        setFormData({
            title: contract.title || '',
            contractType: contract.contractType || 'other',
            projectId: contract.projectId || '',
            clientId: contract.clientId || '',
            crewId: contract.crewId || '',
            partyName: contract.partyName || '',
            partyEmail: contract.partyEmail || '',
            partyCompany: contract.partyCompany || '',
            startDate: contract.startDate || '',
            endDate: contract.endDate || '',
            expiresAt: contract.expiresAt ? contract.expiresAt.split('T')[0] : '',
            value: contract.value || 0,
            currency: contract.currency || 'USD',
            description: contract.description || '',
            notes: contract.notes || '',
        });
        setShowModal(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const contractData = {
            ...formData,
            expiresAt: formData.expiresAt ? new Date(formData.expiresAt).toISOString() : null,
        };

        if (editingContract) {
            await updateContract(editingContract.id, contractData);
        } else {
            await createContract(contractData);
        }

        setShowModal(false);
        resetForm();
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this contract?')) {
            await deleteContract(id);
        }
    };

    const getProjectName = (projectId) => {
        const project = projects.find(p => p.id === projectId);
        return project?.name || '';
    };

    const getClientName = (clientId) => {
        const client = clients.find(c => c.id === clientId);
        return client?.company || '';
    };

    const getCrewName = (crewId) => {
        const member = crew.find(c => c.id === crewId);
        return member?.name || '';
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent-primary"></div>
            </div>
        );
    }

    return (
        <div className="p-4 sm:p-6 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-xl font-semibold text-gray-100">Contracts</h1>
                    <p className="text-sm text-gray-400 mt-1">Manage crew, vendor, and client agreements</p>
                </div>
                <button
                    onClick={() => { resetForm(); setShowModal(true); }}
                    className="btn-primary flex items-center gap-2"
                >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    New Contract
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-6 gap-3 mb-6">
                <div className="card p-3">
                    <p className="text-xs text-gray-500 uppercase">Total</p>
                    <p className="text-lg font-semibold text-gray-100">{stats.total}</p>
                </div>
                <div className="card p-3">
                    <p className="text-xs text-gray-500 uppercase">Draft</p>
                    <p className="text-lg font-semibold text-gray-400">{stats.draft}</p>
                </div>
                <div className="card p-3">
                    <p className="text-xs text-gray-500 uppercase">Pending</p>
                    <p className="text-lg font-semibold text-amber-400">{stats.pending}</p>
                </div>
                <div className="card p-3">
                    <p className="text-xs text-gray-500 uppercase">Active</p>
                    <p className="text-lg font-semibold text-green-400">{stats.active}</p>
                </div>
                <div className="card p-3">
                    <p className="text-xs text-gray-500 uppercase">Expiring</p>
                    <p className="text-lg font-semibold text-red-400">{stats.expiring}</p>
                </div>
                <div className="card p-3">
                    <p className="text-xs text-gray-500 uppercase">Value</p>
                    <p className="text-lg font-semibold text-teal-400">{formatCurrency(stats.totalValue, 'USD', 0)}</p>
                </div>
            </div>

            {/* Expiring Soon Alert */}
            {expiringContracts.length > 0 && (
                <div className="card bg-gradient-to-br from-red-900/20 to-red-950/10 border-red-800/30 p-4 mb-6">
                    <div className="flex items-center gap-2 mb-2">
                        <svg className="w-5 h-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        <span className="text-sm font-medium text-red-400">Contracts Expiring Soon</span>
                    </div>
                    <div className="space-y-1">
                        {expiringContracts.slice(0, 3).map(c => (
                            <div key={c.id} className="flex items-center justify-between text-sm">
                                <span className="text-gray-300">{c.title}</span>
                                <span className="text-gray-500">{new Date(c.expiresAt).toLocaleDateString()}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Filters */}
            <div className="flex flex-wrap gap-3 mb-4">
                <input
                    type="text"
                    placeholder="Search contracts..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="input w-full sm:w-64"
                />
                <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="input w-full sm:w-40"
                >
                    <option value="all">All Statuses</option>
                    {Object.entries(CONTRACT_STATUSES).map(([key, { label }]) => (
                        <option key={key} value={key}>{label}</option>
                    ))}
                </select>
                <select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                    className="input w-full sm:w-40"
                >
                    <option value="all">All Types</option>
                    {Object.entries(CONTRACT_TYPES).map(([key, { label }]) => (
                        <option key={key} value={key}>{label}</option>
                    ))}
                </select>
            </div>

            {/* Contracts List */}
            <div className="space-y-3">
                {filteredContracts.length === 0 ? (
                    <div className="card p-8 text-center">
                        <p className="text-gray-400">No contracts found</p>
                    </div>
                ) : (
                    filteredContracts.map(contract => (
                        <div key={contract.id} className="card p-4 hover:border-white/10 transition-colors">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="text-xs font-mono text-gray-500">{contract.contractRef}</span>
                                        <span className={`text-xs px-2 py-0.5 rounded border ${CONTRACT_STATUSES[contract.status]?.color || 'text-gray-400'}`}>
                                            {CONTRACT_STATUSES[contract.status]?.label || contract.status}
                                        </span>
                                        <span className="text-xs text-gray-600">{CONTRACT_TYPES[contract.contractType]?.label}</span>
                                    </div>
                                    <p className="font-medium text-gray-100 truncate">{contract.title}</p>
                                    <div className="flex flex-wrap gap-2 mt-1 text-xs text-gray-500">
                                        {contract.partyName && <span>{contract.partyName}</span>}
                                        {contract.partyCompany && <span>({contract.partyCompany})</span>}
                                        {contract.projectId && <span className="text-cyan-500">{getProjectName(contract.projectId)}</span>}
                                        {contract.clientId && <span className="text-blue-500">{getClientName(contract.clientId)}</span>}
                                        {contract.crewId && <span className="text-purple-500">{getCrewName(contract.crewId)}</span>}
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="text-right">
                                        {contract.value > 0 && (
                                            <p className="text-lg font-semibold text-gray-100">{formatCurrency(contract.value, contract.currency)}</p>
                                        )}
                                        {contract.startDate && contract.endDate && (
                                            <p className="text-xs text-gray-500">
                                                {new Date(contract.startDate).toLocaleDateString()} - {new Date(contract.endDate).toLocaleDateString()}
                                            </p>
                                        )}
                                    </div>
                                    <div className="flex gap-1">
                                        <button
                                            onClick={() => handleEdit(contract)}
                                            className="p-2 text-gray-400 hover:text-white transition-colors"
                                            title="Edit"
                                        >
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                            </svg>
                                        </button>
                                        <button
                                            onClick={() => handleDelete(contract.id)}
                                            className="p-2 text-gray-400 hover:text-red-400 transition-colors"
                                            title="Delete"
                                        >
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                            </svg>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/75 backdrop-blur-md flex items-center justify-center z-50 p-4">
                    <div className="bg-dark-card border border-dark-border rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        <div className="p-6">
                            <h2 className="text-lg font-semibold text-gray-100 mb-4">
                                {editingContract ? 'Edit Contract' : 'New Contract'}
                            </h2>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                {/* Title and Type */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="label label-required">Title</label>
                                        <input
                                            type="text"
                                            value={formData.title}
                                            onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                                            className="input"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="label">Type</label>
                                        <select
                                            value={formData.contractType}
                                            onChange={(e) => setFormData(prev => ({ ...prev, contractType: e.target.value }))}
                                            className="input"
                                        >
                                            {Object.entries(CONTRACT_TYPES).map(([key, { label }]) => (
                                                <option key={key} value={key}>{label}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                {/* Links */}
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                    <div>
                                        <label className="label">Project</label>
                                        <select
                                            value={formData.projectId}
                                            onChange={(e) => setFormData(prev => ({ ...prev, projectId: e.target.value }))}
                                            className="input"
                                        >
                                            <option value="">None</option>
                                            {projects.map(p => (
                                                <option key={p.id} value={p.id}>{p.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="label">Client</label>
                                        <select
                                            value={formData.clientId}
                                            onChange={(e) => setFormData(prev => ({ ...prev, clientId: e.target.value }))}
                                            className="input"
                                        >
                                            <option value="">None</option>
                                            {clients.map(c => (
                                                <option key={c.id} value={c.id}>{c.company}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="label">Crew Member</label>
                                        <select
                                            value={formData.crewId}
                                            onChange={(e) => setFormData(prev => ({ ...prev, crewId: e.target.value }))}
                                            className="input"
                                        >
                                            <option value="">None</option>
                                            {crew.map(c => (
                                                <option key={c.id} value={c.id}>{c.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                {/* Party Info */}
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                    <div>
                                        <label className="label">Party Name</label>
                                        <input
                                            type="text"
                                            value={formData.partyName}
                                            onChange={(e) => setFormData(prev => ({ ...prev, partyName: e.target.value }))}
                                            className="input"
                                        />
                                    </div>
                                    <div>
                                        <label className="label">Party Email</label>
                                        <input
                                            type="email"
                                            value={formData.partyEmail}
                                            onChange={(e) => setFormData(prev => ({ ...prev, partyEmail: e.target.value }))}
                                            className="input"
                                        />
                                    </div>
                                    <div>
                                        <label className="label">Party Company</label>
                                        <input
                                            type="text"
                                            value={formData.partyCompany}
                                            onChange={(e) => setFormData(prev => ({ ...prev, partyCompany: e.target.value }))}
                                            className="input"
                                        />
                                    </div>
                                </div>

                                {/* Dates */}
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                    <div>
                                        <label className="label">Start Date</label>
                                        <input
                                            type="date"
                                            value={formData.startDate}
                                            onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                                            className="input"
                                        />
                                    </div>
                                    <div>
                                        <label className="label">End Date</label>
                                        <input
                                            type="date"
                                            value={formData.endDate}
                                            onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
                                            className="input"
                                        />
                                    </div>
                                    <div>
                                        <label className="label">Expires At</label>
                                        <input
                                            type="date"
                                            value={formData.expiresAt}
                                            onChange={(e) => setFormData(prev => ({ ...prev, expiresAt: e.target.value }))}
                                            className="input"
                                        />
                                    </div>
                                </div>

                                {/* Value */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="label">Contract Value</label>
                                        <input
                                            type="number"
                                            value={formData.value}
                                            onChange={(e) => setFormData(prev => ({ ...prev, value: parseFloat(e.target.value) || 0 }))}
                                            className="input"
                                            min="0"
                                            step="0.01"
                                        />
                                    </div>
                                    <div>
                                        <label className="label">Currency</label>
                                        <select
                                            value={formData.currency}
                                            onChange={(e) => setFormData(prev => ({ ...prev, currency: e.target.value }))}
                                            className="input"
                                        >
                                            <option value="USD">USD</option>
                                            <option value="GBP">GBP</option>
                                            <option value="EUR">EUR</option>
                                            <option value="MYR">MYR</option>
                                            <option value="SGD">SGD</option>
                                        </select>
                                    </div>
                                </div>

                                {/* Description */}
                                <div>
                                    <label className="label">Description</label>
                                    <textarea
                                        value={formData.description}
                                        onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                                        className="input resize-none"
                                        rows={3}
                                    />
                                </div>

                                {/* Notes */}
                                <div>
                                    <label className="label">Notes</label>
                                    <textarea
                                        value={formData.notes}
                                        onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                                        className="input resize-none"
                                        rows={2}
                                    />
                                </div>

                                {/* Actions */}
                                <div className="flex justify-end gap-3 pt-4 border-t border-dark-border">
                                    <button
                                        type="button"
                                        onClick={() => { setShowModal(false); resetForm(); }}
                                        className="btn-ghost"
                                    >
                                        Cancel
                                    </button>
                                    <button type="submit" className="btn-primary">
                                        {editingContract ? 'Update Contract' : 'Create Contract'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
