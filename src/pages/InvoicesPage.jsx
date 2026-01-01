import { useState, useMemo, useEffect } from 'react';
import { useInvoiceStore, INVOICE_STATUSES, PAYMENT_METHODS } from '../store/invoiceStore';
import { useClientStore } from '../store/clientStore';
import { formatCurrency, convertCurrency } from '../utils/currency';
import { useDisplayCurrency } from '../hooks/useDisplayCurrency';

// Format date helper
const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
};

// Status badge component
function StatusBadge({ status }) {
    const statusConfig = INVOICE_STATUSES[status] || INVOICE_STATUSES.draft;
    return (
        <span className={`text-xs px-2 py-1 rounded border ${statusConfig.color}`}>
            {statusConfig.label}
        </span>
    );
}

// Invoice row component
function InvoiceRow({ invoice, onSelect, onUpdateStatus, onDelete, clients }) {
    const [showActions, setShowActions] = useState(false);
    const client = clients.find(c => c.id === invoice.clientId);

    const isOverdue = invoice.status !== 'paid' && invoice.status !== 'cancelled' &&
        invoice.dueDate && new Date(invoice.dueDate) < new Date();

    return (
        <tr
            className="border-b border-dark-border hover:bg-dark-card/50 cursor-pointer transition-colors"
            onClick={() => onSelect(invoice.id)}
        >
            <td className="px-4 py-3">
                <span className="font-mono text-sm text-accent-primary">{invoice.invoiceNumber}</span>
            </td>
            <td className="px-4 py-3">
                <div className="text-gray-200">{client?.company || invoice.clientName || 'Unknown'}</div>
                {invoice.quoteNumber && (
                    <div className="text-xs text-gray-500">Quote: {invoice.quoteNumber}</div>
                )}
            </td>
            <td className="px-4 py-3">
                <StatusBadge status={isOverdue && invoice.status === 'sent' ? 'overdue' : invoice.status} />
            </td>
            <td className="px-4 py-3 text-right font-medium text-gray-200">
                {formatCurrency(invoice.total, invoice.currency)}
            </td>
            <td className="px-4 py-3 text-gray-400">
                {formatDate(invoice.issueDate)}
            </td>
            <td className="px-4 py-3">
                <span className={isOverdue ? 'text-red-400' : 'text-gray-400'}>
                    {formatDate(invoice.dueDate)}
                </span>
            </td>
            <td className="px-4 py-3">
                <div className="relative">
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            setShowActions(!showActions);
                        }}
                        className="p-1 text-gray-400 hover:text-gray-200"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                        </svg>
                    </button>
                    {showActions && (
                        <div
                            className="absolute right-0 top-8 w-40 bg-dark-card border border-dark-border rounded-lg shadow-xl z-10"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {invoice.status === 'draft' && (
                                <button
                                    onClick={() => { onUpdateStatus(invoice.id, 'sent'); setShowActions(false); }}
                                    className="w-full px-3 py-2 text-left text-sm text-gray-300 hover:bg-dark-bg flex items-center gap-2"
                                >
                                    <svg className="w-4 h-4 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                    </svg>
                                    Mark as Sent
                                </button>
                            )}
                            {(invoice.status === 'sent' || invoice.status === 'overdue') && (
                                <button
                                    onClick={() => { onUpdateStatus(invoice.id, 'paid'); setShowActions(false); }}
                                    className="w-full px-3 py-2 text-left text-sm text-gray-300 hover:bg-dark-bg flex items-center gap-2"
                                >
                                    <svg className="w-4 h-4 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    Mark as Paid
                                </button>
                            )}
                            <button
                                onClick={() => { onDelete(invoice.id); setShowActions(false); }}
                                className="w-full px-3 py-2 text-left text-sm text-red-400 hover:bg-dark-bg flex items-center gap-2"
                            >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                                Delete
                            </button>
                        </div>
                    )}
                </div>
            </td>
        </tr>
    );
}

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

// Create invoice modal
function CreateInvoiceModal({ isOpen, onClose, onCreateFromQuote, quotes, clients }) {
    const [selectedQuoteId, setSelectedQuoteId] = useState('');
    const [selectedClientId, setSelectedClientId] = useState('');

    // Filter quotes that are Won and don't have an invoice yet
    const availableQuotes = quotes.filter(q =>
        q.status === 'won' || q.status === 'Won' || q.status === 'accepted'
    );

    const selectedQuote = availableQuotes.find(q => q.id === selectedQuoteId);
    const selectedClient = selectedQuote
        ? clients.find(c => c.id === selectedQuote.clientId)
        : clients.find(c => c.id === selectedClientId);

    const handleCreate = () => {
        if (selectedQuote) {
            onCreateFromQuote(selectedQuote, selectedClient);
            onClose();
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-dark-card border border-dark-border rounded-xl w-full max-w-md p-4 sm:p-6 max-h-[90vh] overflow-y-auto">
                <h2 className="text-xl font-semibold text-gray-200 mb-4">Create Invoice</h2>

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm text-gray-400 mb-2">From Won Quote</label>
                        <select
                            value={selectedQuoteId}
                            onChange={(e) => setSelectedQuoteId(e.target.value)}
                            className="w-full bg-dark-bg border border-dark-border rounded-lg px-3 py-2 text-gray-200"
                        >
                            <option value="">Select a quote...</option>
                            {availableQuotes.map(quote => {
                                const client = clients.find(c => c.id === quote.clientId);
                                return (
                                    <option key={quote.id} value={quote.id}>
                                        {quote.quote_number || quote.quoteNumber} - {client?.company || 'Unknown'} ({formatCurrency(quote.grandTotal || quote.total, quote.currency)})
                                    </option>
                                );
                            })}
                        </select>
                    </div>

                    {selectedQuote && (
                        <div className="bg-dark-bg rounded-lg p-3 border border-dark-border">
                            <div className="text-sm text-gray-400">Quote Details</div>
                            <div className="text-gray-200 font-medium">{selectedClient?.company || 'Unknown Client'}</div>
                            <div className="text-accent-primary font-semibold">
                                {formatCurrency(selectedQuote.grandTotal || selectedQuote.total, selectedQuote.currency)}
                            </div>
                        </div>
                    )}
                </div>

                <div className="flex gap-3 mt-6">
                    <button
                        onClick={onClose}
                        className="flex-1 px-4 py-2 bg-dark-bg border border-dark-border text-gray-300 rounded-lg hover:bg-dark-border transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleCreate}
                        disabled={!selectedQuote}
                        className="flex-1 px-4 py-2 bg-accent-primary text-white rounded-lg hover:bg-accent-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Create Invoice
                    </button>
                </div>
            </div>
        </div>
    );
}

// Record payment modal
function RecordPaymentModal({ invoice, isOpen, onClose, onRecordPayment }) {
    const [amount, setAmount] = useState('');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [method, setMethod] = useState('bank_transfer');
    const [reference, setReference] = useState('');
    const [notes, setNotes] = useState('');
    const [loading, setLoading] = useState(false);

    const balance = (invoice?.total || 0) - (invoice?.paidAmount || 0);

    const handleSubmit = async () => {
        if (!amount || parseFloat(amount) <= 0) return;

        setLoading(true);
        await onRecordPayment(invoice.id, {
            amount: parseFloat(amount),
            date,
            method,
            reference,
            notes,
        });
        setLoading(false);
        onClose();

        // Reset form
        setAmount('');
        setReference('');
        setNotes('');
    };

    if (!isOpen || !invoice) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-dark-card border border-dark-border rounded-xl w-full max-w-md p-4 sm:p-6 max-h-[90vh] overflow-y-auto">
                <h2 className="text-xl font-semibold text-gray-200 mb-4">Record Payment</h2>

                <div className="bg-dark-bg rounded-lg p-3 border border-dark-border mb-4">
                    <div className="flex justify-between items-center">
                        <span className="text-gray-400">Invoice Total:</span>
                        <span className="text-gray-200 font-medium">{formatCurrency(invoice.total, invoice.currency)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-gray-400">Paid:</span>
                        <span className="text-green-400">{formatCurrency(invoice.paidAmount || 0, invoice.currency)}</span>
                    </div>
                    <div className="flex justify-between items-center pt-2 border-t border-dark-border mt-2">
                        <span className="text-gray-300 font-medium">Balance Due:</span>
                        <span className="text-amber-400 font-semibold">{formatCurrency(balance, invoice.currency)}</span>
                    </div>
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm text-gray-400 mb-2">Payment Amount *</label>
                        <input
                            type="number"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            className="w-full bg-dark-bg border border-dark-border rounded-lg px-3 py-2 text-gray-200"
                            placeholder={`Max: ${formatCurrency(balance, invoice.currency)}`}
                            step="0.01"
                            max={balance}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm text-gray-400 mb-2">Date</label>
                            <input
                                type="date"
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                                className="w-full bg-dark-bg border border-dark-border rounded-lg px-3 py-2 text-gray-200"
                            />
                        </div>
                        <div>
                            <label className="block text-sm text-gray-400 mb-2">Method</label>
                            <select
                                value={method}
                                onChange={(e) => setMethod(e.target.value)}
                                className="w-full bg-dark-bg border border-dark-border rounded-lg px-3 py-2 text-gray-200"
                            >
                                {Object.entries(PAYMENT_METHODS).map(([key, val]) => (
                                    <option key={key} value={key}>{val.label}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm text-gray-400 mb-2">Reference #</label>
                        <input
                            type="text"
                            value={reference}
                            onChange={(e) => setReference(e.target.value)}
                            className="w-full bg-dark-bg border border-dark-border rounded-lg px-3 py-2 text-gray-200"
                            placeholder="e.g., Check #, Transaction ID"
                        />
                    </div>

                    <div>
                        <label className="block text-sm text-gray-400 mb-2">Notes</label>
                        <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            className="w-full bg-dark-bg border border-dark-border rounded-lg px-3 py-2 text-gray-200 resize-none"
                            rows={2}
                            placeholder="Optional notes"
                        />
                    </div>
                </div>

                <div className="flex gap-3 mt-6">
                    <button
                        onClick={onClose}
                        className="flex-1 px-4 py-2 bg-dark-bg border border-dark-border text-gray-300 rounded-lg hover:bg-dark-border transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={!amount || parseFloat(amount) <= 0 || loading}
                        className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {loading ? 'Saving...' : 'Record Payment'}
                    </button>
                </div>
            </div>
        </div>
    );
}

// Invoice detail modal
function InvoiceDetailModal({ invoice, onClose, onUpdateStatus, onRecordPayment, clients }) {
    if (!invoice) return null;

    const client = clients.find(c => c.id === invoice.clientId);
    const balance = (invoice.total || 0) - (invoice.paidAmount || 0);

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-dark-card border border-dark-border rounded-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-dark-border">
                    <div>
                        <h2 className="text-xl font-semibold text-gray-200">Invoice {invoice.invoiceNumber}</h2>
                        <div className="text-sm text-gray-400 mt-1">
                            {client?.company || invoice.clientName || 'Unknown Client'}
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <StatusBadge status={invoice.status} />
                        <button
                            onClick={onClose}
                            className="p-2 text-gray-400 hover:text-gray-200"
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                    {/* Dates row */}
                    <div className="grid grid-cols-3 gap-4">
                        <div>
                            <div className="text-xs text-gray-500 uppercase">Issue Date</div>
                            <div className="text-gray-200">{formatDate(invoice.issueDate)}</div>
                        </div>
                        <div>
                            <div className="text-xs text-gray-500 uppercase">Due Date</div>
                            <div className="text-gray-200">{formatDate(invoice.dueDate)}</div>
                        </div>
                        {invoice.paidDate && (
                            <div>
                                <div className="text-xs text-gray-500 uppercase">Paid Date</div>
                                <div className="text-green-400">{formatDate(invoice.paidDate)}</div>
                            </div>
                        )}
                    </div>

                    {/* Line items */}
                    <div>
                        <div className="text-sm font-medium text-gray-300 mb-3">Line Items</div>
                        <div className="bg-dark-bg rounded-lg border border-dark-border overflow-hidden">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="bg-dark-card/50">
                                        <th className="text-left px-4 py-2 text-gray-400 font-medium">Description</th>
                                        <th className="text-right px-4 py-2 text-gray-400 font-medium w-20">Qty</th>
                                        <th className="text-right px-4 py-2 text-gray-400 font-medium w-20">Days</th>
                                        <th className="text-right px-4 py-2 text-gray-400 font-medium w-24">Rate</th>
                                        <th className="text-right px-4 py-2 text-gray-400 font-medium w-28">Total</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {invoice.lineItems?.map((item, idx) => (
                                        <tr key={idx} className="border-t border-dark-border">
                                            <td className="px-4 py-2 text-gray-200">{item.description}</td>
                                            <td className="px-4 py-2 text-right text-gray-400">{item.quantity}</td>
                                            <td className="px-4 py-2 text-right text-gray-400">{item.days}</td>
                                            <td className="px-4 py-2 text-right text-gray-400">
                                                {formatCurrency(item.rate, invoice.currency)}
                                            </td>
                                            <td className="px-4 py-2 text-right text-gray-200">
                                                {formatCurrency(item.total, invoice.currency)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Totals */}
                    <div className="flex justify-end">
                        <div className="w-72 space-y-2">
                            <div className="flex justify-between text-gray-400">
                                <span>Subtotal</span>
                                <span>{formatCurrency(invoice.subtotal, invoice.currency)}</span>
                            </div>
                            {invoice.taxRate > 0 && (
                                <div className="flex justify-between text-gray-400">
                                    <span>Tax ({invoice.taxRate}%)</span>
                                    <span>{formatCurrency(invoice.taxAmount, invoice.currency)}</span>
                                </div>
                            )}
                            <div className="flex justify-between text-lg font-semibold text-gray-200 pt-2 border-t border-dark-border">
                                <span>Total</span>
                                <span>{formatCurrency(invoice.total, invoice.currency)}</span>
                            </div>
                            {(invoice.paidAmount > 0 || invoice.status === 'partial') && (
                                <>
                                    <div className="flex justify-between text-green-400">
                                        <span>Paid</span>
                                        <span>-{formatCurrency(invoice.paidAmount || 0, invoice.currency)}</span>
                                    </div>
                                    <div className="flex justify-between text-amber-400 font-semibold pt-2 border-t border-dark-border">
                                        <span>Balance Due</span>
                                        <span>{formatCurrency(balance, invoice.currency)}</span>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Payment History */}
                    {invoice.payments && invoice.payments.length > 0 && (
                        <div>
                            <div className="text-sm font-medium text-gray-300 mb-3">Payment History</div>
                            <div className="bg-dark-bg rounded-lg border border-dark-border overflow-hidden">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="bg-dark-card/50">
                                            <th className="text-left px-4 py-2 text-gray-400 font-medium">Date</th>
                                            <th className="text-left px-4 py-2 text-gray-400 font-medium">Method</th>
                                            <th className="text-left px-4 py-2 text-gray-400 font-medium">Reference</th>
                                            <th className="text-right px-4 py-2 text-gray-400 font-medium">Amount</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {invoice.payments.map((payment, idx) => (
                                            <tr key={payment.id || idx} className="border-t border-dark-border">
                                                <td className="px-4 py-2 text-gray-200">{formatDate(payment.date)}</td>
                                                <td className="px-4 py-2 text-gray-400">
                                                    {PAYMENT_METHODS[payment.method]?.label || payment.method}
                                                </td>
                                                <td className="px-4 py-2 text-gray-400">{payment.reference || '-'}</td>
                                                <td className="px-4 py-2 text-right text-green-400">
                                                    {formatCurrency(payment.amount, invoice.currency)}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* Notes */}
                    {invoice.notes && (
                        <div>
                            <div className="text-sm font-medium text-gray-300 mb-2">Notes</div>
                            <div className="text-sm text-gray-400 bg-dark-bg rounded-lg p-3 border border-dark-border whitespace-pre-wrap">
                                {invoice.notes}
                            </div>
                        </div>
                    )}
                </div>

                {/* Actions */}
                <div className="flex gap-3 p-6 border-t border-dark-border bg-dark-bg/50">
                    {invoice.status === 'draft' && (
                        <button
                            onClick={() => onUpdateStatus(invoice.id, 'sent')}
                            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2"
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                            Mark as Sent
                        </button>
                    )}
                    {['sent', 'partial', 'overdue'].includes(invoice.status) && balance > 0 && (
                        <button
                            onClick={() => onRecordPayment(invoice)}
                            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Record Payment
                        </button>
                    )}
                    {(invoice.status === 'sent' || invoice.status === 'overdue') && (
                        <button
                            onClick={() => onUpdateStatus(invoice.id, 'paid')}
                            className="px-4 py-2 bg-dark-bg border border-green-500/50 text-green-400 rounded-lg hover:bg-green-500/10 transition-colors flex items-center gap-2"
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Mark Fully Paid
                        </button>
                    )}
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-dark-bg border border-dark-border text-gray-300 rounded-lg hover:bg-dark-border transition-colors ml-auto"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}

// Main InvoicesPage component
export default function InvoicesPage() {
    const { invoices, loading, getStats, updateStatus, deleteInvoice, createFromQuote, recordPayment, initialize } = useInvoiceStore();
    const { clients, savedQuotes } = useClientStore();
    const quotes = savedQuotes || [];

    // Use global display currency from settings
    const { currency: displayCurrency, rates } = useDisplayCurrency();

    const [showCreateModal, setShowCreateModal] = useState(false);
    const [selectedInvoiceId, setSelectedInvoiceId] = useState(null);
    const [filterStatus, setFilterStatus] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [paymentInvoice, setPaymentInvoice] = useState(null);

    // Initialize on mount
    useEffect(() => {
        initialize();
    }, [initialize]);

    // Get stats
    const stats = useMemo(() => getStats(), [invoices, getStats]);

    // Filter invoices
    const filteredInvoices = useMemo(() => {
        let result = invoices;

        // Status filter
        if (filterStatus !== 'all') {
            if (filterStatus === 'overdue') {
                const now = new Date();
                result = result.filter(inv =>
                    inv.status !== 'paid' && inv.status !== 'cancelled' &&
                    inv.dueDate && new Date(inv.dueDate) < now
                );
            } else {
                result = result.filter(inv => inv.status === filterStatus);
            }
        }

        // Search filter
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            result = result.filter(inv =>
                inv.invoiceNumber?.toLowerCase().includes(query) ||
                inv.clientName?.toLowerCase().includes(query) ||
                inv.quoteNumber?.toLowerCase().includes(query)
            );
        }

        return result;
    }, [invoices, filterStatus, searchQuery]);

    const selectedInvoice = invoices.find(inv => inv.id === selectedInvoiceId);

    const handleCreateFromQuote = async (quote, client) => {
        const invoice = await createFromQuote(quote, client);
        if (invoice) {
            setSelectedInvoiceId(invoice.id);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this invoice?')) {
            await deleteInvoice(id);
        }
    };

    const handleRecordPayment = (invoice) => {
        setPaymentInvoice(invoice);
        setShowPaymentModal(true);
    };

    return (
        <div className="p-6 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-100">Invoices</h1>
                    <p className="text-gray-400 text-sm mt-1">Manage invoices and track payments</p>
                </div>
                <button
                    onClick={() => setShowCreateModal(true)}
                    className="px-4 py-2 bg-accent-primary text-white rounded-lg hover:bg-accent-primary/90 transition-colors flex items-center gap-2"
                >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Create Invoice
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <StatsCard
                    label="Total Revenue"
                    value={formatCurrency(stats.totalRevenue, displayCurrency, 0)}
                    subValue={`${stats.paid} paid invoices`}
                    color="text-green-400"
                    icon={<svg className="w-6 h-6 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                />
                <StatsCard
                    label="Outstanding"
                    value={formatCurrency(stats.totalOutstanding, displayCurrency, 0)}
                    subValue={`${stats.sent} awaiting payment`}
                    color="text-blue-400"
                    icon={<svg className="w-6 h-6 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                />
                <StatsCard
                    label="Overdue"
                    value={stats.overdue}
                    subValue="Need follow-up"
                    color="text-red-400"
                    icon={<svg className="w-6 h-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>}
                />
                <StatsCard
                    label="Draft"
                    value={stats.draft}
                    subValue="Ready to send"
                    color="text-gray-400"
                    icon={<svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>}
                />
            </div>

            {/* Filters */}
            <div className="flex items-center gap-4 mb-4">
                <div className="relative flex-1 max-w-xs">
                    <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <input
                        type="text"
                        placeholder="Search invoices..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-dark-bg border border-dark-border rounded-lg text-gray-200 placeholder-gray-500 focus:outline-none focus:border-accent-primary"
                    />
                </div>
                <div className="flex flex-wrap gap-2">
                    {['all', 'draft', 'sent', 'paid', 'overdue'].map(status => (
                        <button
                            key={status}
                            onClick={() => setFilterStatus(status)}
                            className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                                filterStatus === status
                                    ? 'bg-accent-primary text-white'
                                    : 'bg-dark-bg border border-dark-border text-gray-400 hover:text-gray-200'
                            }`}
                        >
                            {status.charAt(0).toUpperCase() + status.slice(1)}
                        </button>
                    ))}
                </div>
            </div>

            {/* Invoice table */}
            <div className="bg-dark-card border border-dark-border rounded-xl overflow-hidden">
                {loading ? (
                    <div className="p-8 text-center text-gray-400">Loading invoices...</div>
                ) : filteredInvoices.length === 0 ? (
                    <div className="p-8 text-center">
                        <svg className="w-12 h-12 mx-auto text-gray-600 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <div className="text-gray-400 mb-2">No invoices found</div>
                        <button
                            onClick={() => setShowCreateModal(true)}
                            className="text-accent-primary hover:underline"
                        >
                            Create your first invoice
                        </button>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                    <table className="w-full min-w-[700px]">
                        <thead>
                            <tr className="bg-dark-bg/50 border-b border-dark-border">
                                <th className="text-left px-4 py-3 text-xs text-gray-400 font-medium uppercase">Invoice #</th>
                                <th className="text-left px-4 py-3 text-xs text-gray-400 font-medium uppercase">Client</th>
                                <th className="text-left px-4 py-3 text-xs text-gray-400 font-medium uppercase">Status</th>
                                <th className="text-right px-4 py-3 text-xs text-gray-400 font-medium uppercase">Amount</th>
                                <th className="text-left px-4 py-3 text-xs text-gray-400 font-medium uppercase">Issued</th>
                                <th className="text-left px-4 py-3 text-xs text-gray-400 font-medium uppercase">Due</th>
                                <th className="w-10"></th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredInvoices.map(invoice => (
                                <InvoiceRow
                                    key={invoice.id}
                                    invoice={invoice}
                                    onSelect={setSelectedInvoiceId}
                                    onUpdateStatus={updateStatus}
                                    onDelete={handleDelete}
                                    clients={clients}
                                />
                            ))}
                        </tbody>
                    </table>
                    </div>
                )}
            </div>

            {/* Create invoice modal */}
            <CreateInvoiceModal
                isOpen={showCreateModal}
                onClose={() => setShowCreateModal(false)}
                onCreateFromQuote={handleCreateFromQuote}
                quotes={quotes}
                clients={clients}
            />

            {/* Invoice detail modal */}
            <InvoiceDetailModal
                invoice={selectedInvoice}
                onClose={() => setSelectedInvoiceId(null)}
                onUpdateStatus={(id, status) => {
                    updateStatus(id, status);
                }}
                onRecordPayment={handleRecordPayment}
                clients={clients}
            />

            {/* Record payment modal */}
            <RecordPaymentModal
                invoice={paymentInvoice}
                isOpen={showPaymentModal}
                onClose={() => {
                    setShowPaymentModal(false);
                    setPaymentInvoice(null);
                }}
                onRecordPayment={recordPayment}
            />
        </div>
    );
}
