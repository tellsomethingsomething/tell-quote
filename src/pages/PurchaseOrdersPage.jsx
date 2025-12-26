import { useState, useMemo } from 'react';
import { usePurchaseOrderStore, PO_STATUSES, PO_CATEGORIES } from '../store/purchaseOrderStore';
import { useProjectStore } from '../store/projectStore';
import { formatCurrency } from '../utils/currency';

export default function PurchaseOrdersPage() {
    const { purchaseOrders, loading, createPurchaseOrder, updatePurchaseOrder, deletePurchaseOrder, updateStatus } = usePurchaseOrderStore();
    const { projects } = useProjectStore();
    const [showModal, setShowModal] = useState(false);
    const [editingPO, setEditingPO] = useState(null);
    const [filterStatus, setFilterStatus] = useState('all');
    const [filterCategory, setFilterCategory] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');

    // Form state
    const [formData, setFormData] = useState({
        vendorName: '',
        vendorEmail: '',
        vendorPhone: '',
        vendorAddress: '',
        projectId: '',
        category: 'other',
        description: '',
        deliveryDate: '',
        deliveryLocation: '',
        paymentTerms: 'Net 30',
        currency: 'USD',
        notes: '',
        lineItems: [{ description: '', quantity: 1, unitPrice: 0, total: 0 }],
    });

    // Filter and search POs
    const filteredPOs = useMemo(() => {
        return purchaseOrders.filter(po => {
            if (filterStatus !== 'all' && po.status !== filterStatus) return false;
            if (filterCategory !== 'all' && po.category !== filterCategory) return false;
            if (searchQuery) {
                const query = searchQuery.toLowerCase();
                return (
                    po.poNumber?.toLowerCase().includes(query) ||
                    po.vendorName?.toLowerCase().includes(query) ||
                    po.description?.toLowerCase().includes(query)
                );
            }
            return true;
        });
    }, [purchaseOrders, filterStatus, filterCategory, searchQuery]);

    // Stats
    const stats = useMemo(() => {
        const all = purchaseOrders;
        return {
            total: all.length,
            draft: all.filter(p => p.status === 'draft').length,
            pending: all.filter(p => p.status === 'pending').length,
            approved: all.filter(p => p.status === 'approved').length,
            totalValue: all.filter(p => p.status !== 'cancelled').reduce((sum, p) => sum + (p.total || 0), 0),
        };
    }, [purchaseOrders]);

    const resetForm = () => {
        setFormData({
            vendorName: '',
            vendorEmail: '',
            vendorPhone: '',
            vendorAddress: '',
            projectId: '',
            category: 'other',
            description: '',
            deliveryDate: '',
            deliveryLocation: '',
            paymentTerms: 'Net 30',
            currency: 'USD',
            notes: '',
            lineItems: [{ description: '', quantity: 1, unitPrice: 0, total: 0 }],
        });
        setEditingPO(null);
    };

    const handleEdit = (po) => {
        setEditingPO(po);
        setFormData({
            vendorName: po.vendorName || '',
            vendorEmail: po.vendorEmail || '',
            vendorPhone: po.vendorPhone || '',
            vendorAddress: po.vendorAddress || '',
            projectId: po.projectId || '',
            category: po.category || 'other',
            description: po.description || '',
            deliveryDate: po.deliveryDate || '',
            deliveryLocation: po.deliveryLocation || '',
            paymentTerms: po.paymentTerms || 'Net 30',
            currency: po.currency || 'USD',
            notes: po.notes || '',
            lineItems: po.lineItems?.length > 0 ? po.lineItems : [{ description: '', quantity: 1, unitPrice: 0, total: 0 }],
        });
        setShowModal(true);
    };

    const handleAddLineItem = () => {
        setFormData(prev => ({
            ...prev,
            lineItems: [...prev.lineItems, { description: '', quantity: 1, unitPrice: 0, total: 0 }],
        }));
    };

    const handleRemoveLineItem = (index) => {
        setFormData(prev => ({
            ...prev,
            lineItems: prev.lineItems.filter((_, i) => i !== index),
        }));
    };

    const handleLineItemChange = (index, field, value) => {
        setFormData(prev => {
            const newItems = [...prev.lineItems];
            newItems[index] = { ...newItems[index], [field]: value };
            // Recalculate total
            if (field === 'quantity' || field === 'unitPrice') {
                newItems[index].total = (parseFloat(newItems[index].quantity) || 0) * (parseFloat(newItems[index].unitPrice) || 0);
            }
            return { ...prev, lineItems: newItems };
        });
    };

    const calculateTotals = () => {
        const subtotal = formData.lineItems.reduce((sum, item) => sum + (parseFloat(item.total) || 0), 0);
        return { subtotal, taxAmount: 0, total: subtotal };
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const totals = calculateTotals();

        const poData = {
            ...formData,
            subtotal: totals.subtotal,
            taxAmount: totals.taxAmount,
            total: totals.total,
        };

        if (editingPO) {
            await updatePurchaseOrder(editingPO.id, poData);
        } else {
            await createPurchaseOrder(poData);
        }

        setShowModal(false);
        resetForm();
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this purchase order?')) {
            await deletePurchaseOrder(id);
        }
    };

    const getProjectName = (projectId) => {
        const project = projects.find(p => p.id === projectId);
        return project?.name || 'No Project';
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
                    <h1 className="text-xl font-semibold text-gray-100">Purchase Orders</h1>
                    <p className="text-sm text-gray-400 mt-1">Manage vendor purchase orders</p>
                </div>
                <button
                    onClick={() => { resetForm(); setShowModal(true); }}
                    className="btn-primary flex items-center gap-2"
                >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    New PO
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
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
                    <p className="text-xs text-gray-500 uppercase">Approved</p>
                    <p className="text-lg font-semibold text-blue-400">{stats.approved}</p>
                </div>
                <div className="card p-3">
                    <p className="text-xs text-gray-500 uppercase">Total Value</p>
                    <p className="text-lg font-semibold text-green-400">{formatCurrency(stats.totalValue, 'USD', 0)}</p>
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-3 mb-4">
                <input
                    type="text"
                    placeholder="Search POs..."
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
                    {Object.entries(PO_STATUSES).map(([key, { label }]) => (
                        <option key={key} value={key}>{label}</option>
                    ))}
                </select>
                <select
                    value={filterCategory}
                    onChange={(e) => setFilterCategory(e.target.value)}
                    className="input w-full sm:w-40"
                >
                    <option value="all">All Categories</option>
                    {Object.entries(PO_CATEGORIES).map(([key, { label }]) => (
                        <option key={key} value={key}>{label}</option>
                    ))}
                </select>
            </div>

            {/* PO List */}
            <div className="space-y-3">
                {filteredPOs.length === 0 ? (
                    <div className="card p-8 text-center">
                        <p className="text-gray-400">No purchase orders found</p>
                    </div>
                ) : (
                    filteredPOs.map(po => (
                        <div key={po.id} className="card p-4 hover:border-white/10 transition-colors">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="text-xs font-mono text-gray-500">{po.poNumber}</span>
                                        <span className={`text-xs px-2 py-0.5 rounded border ${PO_STATUSES[po.status]?.color || 'text-gray-400'}`}>
                                            {PO_STATUSES[po.status]?.label || po.status}
                                        </span>
                                        <span className="text-xs text-gray-600">{PO_CATEGORIES[po.category]?.label}</span>
                                    </div>
                                    <p className="font-medium text-gray-100 truncate">{po.vendorName}</p>
                                    {po.description && (
                                        <p className="text-sm text-gray-400 truncate">{po.description}</p>
                                    )}
                                    {po.projectId && (
                                        <p className="text-xs text-gray-500 mt-1">{getProjectName(po.projectId)}</p>
                                    )}
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="text-right">
                                        <p className="text-lg font-semibold text-gray-100">{formatCurrency(po.total, po.currency)}</p>
                                        {po.deliveryDate && (
                                            <p className="text-xs text-gray-500">Delivery: {new Date(po.deliveryDate).toLocaleDateString()}</p>
                                        )}
                                    </div>
                                    <div className="flex gap-1">
                                        <button
                                            onClick={() => handleEdit(po)}
                                            className="p-2 text-gray-400 hover:text-white transition-colors"
                                            title="Edit"
                                        >
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                            </svg>
                                        </button>
                                        <button
                                            onClick={() => handleDelete(po.id)}
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
                                {editingPO ? 'Edit Purchase Order' : 'New Purchase Order'}
                            </h2>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                {/* Vendor Info */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="label label-required">Vendor Name</label>
                                        <input
                                            type="text"
                                            value={formData.vendorName}
                                            onChange={(e) => setFormData(prev => ({ ...prev, vendorName: e.target.value }))}
                                            className="input"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="label">Vendor Email</label>
                                        <input
                                            type="email"
                                            value={formData.vendorEmail}
                                            onChange={(e) => setFormData(prev => ({ ...prev, vendorEmail: e.target.value }))}
                                            className="input"
                                        />
                                    </div>
                                </div>

                                {/* Category and Project */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="label">Category</label>
                                        <select
                                            value={formData.category}
                                            onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                                            className="input"
                                        >
                                            {Object.entries(PO_CATEGORIES).map(([key, { label }]) => (
                                                <option key={key} value={key}>{label}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="label">Project</label>
                                        <select
                                            value={formData.projectId}
                                            onChange={(e) => setFormData(prev => ({ ...prev, projectId: e.target.value }))}
                                            className="input"
                                        >
                                            <option value="">No Project</option>
                                            {projects.map(p => (
                                                <option key={p.id} value={p.id}>{p.name}</option>
                                            ))}
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
                                        rows={2}
                                    />
                                </div>

                                {/* Line Items */}
                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <label className="label">Line Items</label>
                                        <button
                                            type="button"
                                            onClick={handleAddLineItem}
                                            className="text-xs text-accent-primary hover:text-accent-primary/80"
                                        >
                                            + Add Item
                                        </button>
                                    </div>
                                    <div className="space-y-2">
                                        {formData.lineItems.map((item, index) => (
                                            <div key={index} className="flex gap-2 items-start">
                                                <input
                                                    type="text"
                                                    placeholder="Description"
                                                    value={item.description}
                                                    onChange={(e) => handleLineItemChange(index, 'description', e.target.value)}
                                                    className="input flex-1"
                                                />
                                                <input
                                                    type="number"
                                                    placeholder="Qty"
                                                    value={item.quantity}
                                                    onChange={(e) => handleLineItemChange(index, 'quantity', e.target.value)}
                                                    className="input w-20"
                                                    min="0"
                                                />
                                                <input
                                                    type="number"
                                                    placeholder="Price"
                                                    value={item.unitPrice}
                                                    onChange={(e) => handleLineItemChange(index, 'unitPrice', e.target.value)}
                                                    className="input w-24"
                                                    min="0"
                                                    step="0.01"
                                                />
                                                <span className="input w-24 bg-dark-bg text-right">
                                                    {formatCurrency(item.total || 0, formData.currency)}
                                                </span>
                                                {formData.lineItems.length > 1 && (
                                                    <button
                                                        type="button"
                                                        onClick={() => handleRemoveLineItem(index)}
                                                        className="p-2 text-gray-400 hover:text-red-400"
                                                    >
                                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                        </svg>
                                                    </button>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                    <div className="text-right mt-2 text-sm">
                                        <span className="text-gray-400">Total: </span>
                                        <span className="font-semibold text-gray-100">
                                            {formatCurrency(calculateTotals().total, formData.currency)}
                                        </span>
                                    </div>
                                </div>

                                {/* Delivery */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="label">Delivery Date</label>
                                        <input
                                            type="date"
                                            value={formData.deliveryDate}
                                            onChange={(e) => setFormData(prev => ({ ...prev, deliveryDate: e.target.value }))}
                                            className="input"
                                        />
                                    </div>
                                    <div>
                                        <label className="label">Delivery Location</label>
                                        <input
                                            type="text"
                                            value={formData.deliveryLocation}
                                            onChange={(e) => setFormData(prev => ({ ...prev, deliveryLocation: e.target.value }))}
                                            className="input"
                                        />
                                    </div>
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
                                        {editingPO ? 'Update PO' : 'Create PO'}
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
