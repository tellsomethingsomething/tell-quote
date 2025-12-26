import { useState, useMemo, useEffect } from 'react';
import { useExpenseStore, EXPENSE_CATEGORIES } from '../store/expenseStore';
import { useProjectStore } from '../store/projectStore';
import { useClientStore } from '../store/clientStore';
import { formatCurrency } from '../utils/currency';

// Format date helper
const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
};

// Stats card component
function StatsCard({ label, value, subValue, icon, color }) {
    return (
        <div className="bg-dark-card border border-dark-border rounded-lg p-4">
            <div className="flex items-center justify-between">
                <div>
                    <div className="text-sm text-gray-400">{label}</div>
                    <div className={`text-2xl font-bold ${color}`}>{value}</div>
                    {subValue && <div className="text-xs text-gray-500 mt-1">{subValue}</div>}
                </div>
                <div className={`p-3 rounded-lg ${color.replace('text-', 'bg-').replace('400', '500/10')}`}>
                    {icon}
                </div>
            </div>
        </div>
    );
}

// Expense row component
function ExpenseRow({ expense, onEdit, onDelete, projects, clients }) {
    const project = projects.find(p => p.id === expense.projectId);
    const client = clients.find(c => c.id === expense.clientId);

    return (
        <tr className="border-b border-dark-border hover:bg-dark-card/50 transition-colors">
            <td className="px-4 py-3 text-gray-400">
                {formatDate(expense.date)}
            </td>
            <td className="px-4 py-3">
                <span className="px-2 py-1 rounded bg-dark-bg text-xs text-gray-300">
                    {expense.category}
                </span>
            </td>
            <td className="px-4 py-3 text-gray-200">
                {expense.description || '-'}
            </td>
            <td className="px-4 py-3 text-gray-400 text-sm">
                {project?.name || client?.name || '-'}
            </td>
            <td className="px-4 py-3 text-gray-400 text-sm">
                {expense.vendor || '-'}
            </td>
            <td className="px-4 py-3 text-right font-medium text-gray-200">
                {formatCurrency(expense.amount, expense.currency)}
            </td>
            <td className="px-4 py-3">
                {expense.isBillable && (
                    <span className="px-2 py-0.5 rounded bg-green-500/10 text-green-400 text-xs">
                        Billable
                    </span>
                )}
            </td>
            <td className="px-4 py-3">
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => onEdit(expense)}
                        className="p-1 text-gray-400 hover:text-gray-200"
                        title="Edit"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                    </button>
                    <button
                        onClick={() => onDelete(expense.id)}
                        className="p-1 text-gray-400 hover:text-red-400"
                        title="Delete"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                    </button>
                </div>
            </td>
        </tr>
    );
}

// Expense form modal
function ExpenseFormModal({ isOpen, onClose, expense, onSave, projects, clients }) {
    const [formData, setFormData] = useState({
        category: '',
        description: '',
        amount: '',
        currency: 'USD',
        date: new Date().toISOString().split('T')[0],
        projectId: '',
        clientId: '',
        vendor: '',
        isBillable: false,
        notes: '',
    });

    useEffect(() => {
        if (expense) {
            setFormData({
                category: expense.category || '',
                description: expense.description || '',
                amount: expense.amount?.toString() || '',
                currency: expense.currency || 'USD',
                date: expense.date || new Date().toISOString().split('T')[0],
                projectId: expense.projectId || '',
                clientId: expense.clientId || '',
                vendor: expense.vendor || '',
                isBillable: expense.isBillable || false,
                notes: expense.notes || '',
            });
        } else {
            setFormData({
                category: '',
                description: '',
                amount: '',
                currency: 'USD',
                date: new Date().toISOString().split('T')[0],
                projectId: '',
                clientId: '',
                vendor: '',
                isBillable: false,
                notes: '',
            });
        }
    }, [expense, isOpen]);

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave({
            ...formData,
            amount: parseFloat(formData.amount) || 0,
            projectId: formData.projectId || null,
            clientId: formData.clientId || null,
        });
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-dark-card border border-dark-border rounded-xl w-full max-w-lg">
                <div className="flex items-center justify-between p-6 border-b border-dark-border">
                    <h2 className="text-xl font-semibold text-gray-200">
                        {expense ? 'Edit Expense' : 'Add Expense'}
                    </h2>
                    <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-200">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm text-gray-400 mb-1">Category *</label>
                            <select
                                value={formData.category}
                                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                required
                                className="w-full bg-dark-bg border border-dark-border rounded-lg px-3 py-2 text-gray-200"
                            >
                                <option value="">Select category...</option>
                                {EXPENSE_CATEGORIES.map(cat => (
                                    <option key={cat} value={cat}>{cat}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm text-gray-400 mb-1">Date *</label>
                            <input
                                type="date"
                                value={formData.date}
                                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                required
                                className="w-full bg-dark-bg border border-dark-border rounded-lg px-3 py-2 text-gray-200"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm text-gray-400 mb-1">Description</label>
                        <input
                            type="text"
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            placeholder="What was this expense for?"
                            className="w-full bg-dark-bg border border-dark-border rounded-lg px-3 py-2 text-gray-200"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm text-gray-400 mb-1">Amount *</label>
                            <input
                                type="number"
                                step="0.01"
                                value={formData.amount}
                                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                                required
                                placeholder="0.00"
                                className="w-full bg-dark-bg border border-dark-border rounded-lg px-3 py-2 text-gray-200"
                            />
                        </div>
                        <div>
                            <label className="block text-sm text-gray-400 mb-1">Currency</label>
                            <select
                                value={formData.currency}
                                onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                                className="w-full bg-dark-bg border border-dark-border rounded-lg px-3 py-2 text-gray-200"
                            >
                                <option value="USD">USD</option>
                                <option value="EUR">EUR</option>
                                <option value="GBP">GBP</option>
                                <option value="MYR">MYR</option>
                                <option value="SGD">SGD</option>
                                <option value="AED">AED</option>
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm text-gray-400 mb-1">Project</label>
                            <select
                                value={formData.projectId}
                                onChange={(e) => setFormData({ ...formData, projectId: e.target.value })}
                                className="w-full bg-dark-bg border border-dark-border rounded-lg px-3 py-2 text-gray-200"
                            >
                                <option value="">No project</option>
                                {projects.map(proj => (
                                    <option key={proj.id} value={proj.id}>{proj.name}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm text-gray-400 mb-1">Client</label>
                            <select
                                value={formData.clientId}
                                onChange={(e) => setFormData({ ...formData, clientId: e.target.value })}
                                className="w-full bg-dark-bg border border-dark-border rounded-lg px-3 py-2 text-gray-200"
                            >
                                <option value="">No client</option>
                                {clients.map(client => (
                                    <option key={client.id} value={client.id}>{client.name || client.company}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm text-gray-400 mb-1">Vendor</label>
                        <input
                            type="text"
                            value={formData.vendor}
                            onChange={(e) => setFormData({ ...formData, vendor: e.target.value })}
                            placeholder="Who did you pay?"
                            className="w-full bg-dark-bg border border-dark-border rounded-lg px-3 py-2 text-gray-200"
                        />
                    </div>

                    <div className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            id="isBillable"
                            checked={formData.isBillable}
                            onChange={(e) => setFormData({ ...formData, isBillable: e.target.checked })}
                            className="w-4 h-4 rounded border-dark-border bg-dark-bg text-accent-primary"
                        />
                        <label htmlFor="isBillable" className="text-sm text-gray-300">
                            Billable to client
                        </label>
                    </div>

                    <div>
                        <label className="block text-sm text-gray-400 mb-1">Notes</label>
                        <textarea
                            value={formData.notes}
                            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                            rows={2}
                            placeholder="Additional notes..."
                            className="w-full bg-dark-bg border border-dark-border rounded-lg px-3 py-2 text-gray-200 resize-none"
                        />
                    </div>

                    <div className="flex gap-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2 bg-dark-bg border border-dark-border text-gray-300 rounded-lg hover:bg-dark-border transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="flex-1 px-4 py-2 bg-accent-primary text-white rounded-lg hover:bg-accent-primary/90 transition-colors"
                        >
                            {expense ? 'Save Changes' : 'Add Expense'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// Main ExpensesPage component
export default function ExpensesPage() {
    const { expenses, loading, getStats, createExpense, updateExpense, deleteExpense, initialize } = useExpenseStore();
    const { projects } = useProjectStore();
    const { clients } = useClientStore();

    const [showFormModal, setShowFormModal] = useState(false);
    const [editingExpense, setEditingExpense] = useState(null);
    const [filterCategory, setFilterCategory] = useState('all');
    const [filterProject, setFilterProject] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');

    // Initialize on mount
    useEffect(() => {
        initialize();
    }, [initialize]);

    // Get stats
    const stats = useMemo(() => getStats(), [expenses, getStats]);

    // Filter expenses
    const filteredExpenses = useMemo(() => {
        let result = expenses;

        // Category filter
        if (filterCategory !== 'all') {
            result = result.filter(exp => exp.category === filterCategory);
        }

        // Project filter
        if (filterProject !== 'all') {
            result = result.filter(exp => exp.projectId === filterProject);
        }

        // Search filter
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            result = result.filter(exp =>
                exp.description?.toLowerCase().includes(query) ||
                exp.vendor?.toLowerCase().includes(query) ||
                exp.category?.toLowerCase().includes(query)
            );
        }

        return result;
    }, [expenses, filterCategory, filterProject, searchQuery]);

    const handleSave = async (data) => {
        if (editingExpense) {
            await updateExpense(editingExpense.id, data);
        } else {
            await createExpense(data);
        }
        setShowFormModal(false);
        setEditingExpense(null);
    };

    const handleEdit = (expense) => {
        setEditingExpense(expense);
        setShowFormModal(true);
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this expense?')) {
            await deleteExpense(id);
        }
    };

    const handleAddNew = () => {
        setEditingExpense(null);
        setShowFormModal(true);
    };

    return (
        <div className="p-6 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-100">Expenses</h1>
                    <p className="text-gray-400 text-sm mt-1">Track project costs and spending</p>
                </div>
                <button
                    onClick={handleAddNew}
                    className="px-4 py-2 bg-accent-primary text-white rounded-lg hover:bg-accent-primary/90 transition-colors flex items-center gap-2"
                >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Add Expense
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <StatsCard
                    label="Total Expenses"
                    value={formatCurrency(stats.total, 'USD', 0)}
                    subValue={`${stats.count} expenses`}
                    color="text-red-400"
                    icon={<svg className="w-6 h-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" /></svg>}
                />
                <StatsCard
                    label="This Month"
                    value={formatCurrency(stats.thisMonth, 'USD', 0)}
                    subValue={`${stats.thisMonthCount} expenses`}
                    color="text-orange-400"
                    icon={<svg className="w-6 h-6 text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>}
                />
                <StatsCard
                    label="Billable"
                    value={formatCurrency(stats.billable, 'USD', 0)}
                    subValue="Can invoice"
                    color="text-green-400"
                    icon={<svg className="w-6 h-6 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                />
                <StatsCard
                    label="Categories"
                    value={Object.values(stats.byCategory).filter(v => v > 0).length}
                    subValue="With expenses"
                    color="text-blue-400"
                    icon={<svg className="w-6 h-6 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" /></svg>}
                />
            </div>

            {/* Filters */}
            <div className="flex items-center gap-4 mb-4 flex-wrap">
                <div className="relative flex-1 max-w-xs">
                    <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <input
                        type="text"
                        placeholder="Search expenses..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-dark-bg border border-dark-border rounded-lg text-gray-200 placeholder-gray-500 focus:outline-none focus:border-accent-primary"
                    />
                </div>
                <select
                    value={filterCategory}
                    onChange={(e) => setFilterCategory(e.target.value)}
                    className="bg-dark-bg border border-dark-border rounded-lg px-3 py-2 text-gray-200"
                >
                    <option value="all">All Categories</option>
                    {EXPENSE_CATEGORIES.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                    ))}
                </select>
                <select
                    value={filterProject}
                    onChange={(e) => setFilterProject(e.target.value)}
                    className="bg-dark-bg border border-dark-border rounded-lg px-3 py-2 text-gray-200"
                >
                    <option value="all">All Projects</option>
                    {projects.map(proj => (
                        <option key={proj.id} value={proj.id}>{proj.name}</option>
                    ))}
                </select>
            </div>

            {/* Expenses table */}
            <div className="bg-dark-card border border-dark-border rounded-xl overflow-hidden">
                {loading ? (
                    <div className="p-8 text-center text-gray-400">Loading expenses...</div>
                ) : filteredExpenses.length === 0 ? (
                    <div className="p-8 text-center">
                        <svg className="w-12 h-12 mx-auto text-gray-600 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                        <div className="text-gray-400 mb-2">No expenses found</div>
                        <button
                            onClick={handleAddNew}
                            className="text-accent-primary hover:underline"
                        >
                            Add your first expense
                        </button>
                    </div>
                ) : (
                    <table className="w-full">
                        <thead>
                            <tr className="bg-dark-bg/50 border-b border-dark-border">
                                <th className="text-left px-4 py-3 text-xs text-gray-400 font-medium uppercase">Date</th>
                                <th className="text-left px-4 py-3 text-xs text-gray-400 font-medium uppercase">Category</th>
                                <th className="text-left px-4 py-3 text-xs text-gray-400 font-medium uppercase">Description</th>
                                <th className="text-left px-4 py-3 text-xs text-gray-400 font-medium uppercase">Project/Client</th>
                                <th className="text-left px-4 py-3 text-xs text-gray-400 font-medium uppercase">Vendor</th>
                                <th className="text-right px-4 py-3 text-xs text-gray-400 font-medium uppercase">Amount</th>
                                <th className="w-20"></th>
                                <th className="w-20"></th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredExpenses.map(expense => (
                                <ExpenseRow
                                    key={expense.id}
                                    expense={expense}
                                    onEdit={handleEdit}
                                    onDelete={handleDelete}
                                    projects={projects}
                                    clients={clients}
                                />
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Form modal */}
            <ExpenseFormModal
                isOpen={showFormModal}
                onClose={() => { setShowFormModal(false); setEditingExpense(null); }}
                expense={editingExpense}
                onSave={handleSave}
                projects={projects}
                clients={clients}
            />
        </div>
    );
}
