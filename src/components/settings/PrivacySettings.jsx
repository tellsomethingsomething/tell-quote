import React, { useState, useEffect } from 'react';
import {
    Download, Trash2, AlertTriangle, Shield, Clock,
    CheckCircle, Loader2, X, FileJson, Calendar
} from 'lucide-react';
import {
    requestDataExport,
    downloadExportAsJSON,
    requestAccountDeletion,
    cancelAccountDeletion,
    getPendingDeletionRequest,
} from '../../services/gdprService';

export default function PrivacySettings() {
    const [isExporting, setIsExporting] = useState(false);
    const [exportSuccess, setExportSuccess] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deleteReason, setDeleteReason] = useState('');
    const [isDeleting, setIsDeleting] = useState(false);
    const [pendingDeletion, setPendingDeletion] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        // Check for pending deletion request
        checkPendingDeletion();
    }, []);

    const checkPendingDeletion = async () => {
        const request = await getPendingDeletionRequest();
        setPendingDeletion(request);
    };

    const handleExport = async () => {
        setIsExporting(true);
        setError(null);

        try {
            const result = await requestDataExport();
            downloadExportAsJSON(result.data, `productionos-data-export-${new Date().toISOString().split('T')[0]}.json`);
            setExportSuccess(true);
            setTimeout(() => setExportSuccess(false), 3000);
        } catch (err) {
            setError(err.message || 'Failed to export data');
        } finally {
            setIsExporting(false);
        }
    };

    const handleDeleteRequest = async () => {
        setIsDeleting(true);
        setError(null);

        try {
            const result = await requestAccountDeletion(deleteReason);

            if (result.alreadyRequested) {
                setPendingDeletion(result.request);
            } else {
                setPendingDeletion(result.request);
            }

            setShowDeleteModal(false);
            setDeleteReason('');
        } catch (err) {
            setError(err.message || 'Failed to request account deletion');
        } finally {
            setIsDeleting(false);
        }
    };

    const handleCancelDeletion = async () => {
        try {
            await cancelAccountDeletion();
            setPendingDeletion(null);
        } catch (err) {
            setError(err.message || 'Failed to cancel deletion request');
        }
    };

    const daysUntilDeletion = pendingDeletion?.scheduled_deletion_at
        ? Math.ceil((new Date(pendingDeletion.scheduled_deletion_at) - new Date()) / (1000 * 60 * 60 * 24))
        : null;

    return (
        <div className="space-y-8">
            {/* Error Display */}
            {error && (
                <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400">
                    <AlertTriangle className="w-4 h-4" />
                    <span>{error}</span>
                    <button onClick={() => setError(null)} className="ml-auto">
                        <X className="w-4 h-4" />
                    </button>
                </div>
            )}

            {/* Pending Deletion Warning */}
            {pendingDeletion && (
                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
                    <div className="flex items-start gap-3">
                        <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                            <h4 className="text-red-400 font-medium">Account Deletion Scheduled</h4>
                            <p className="text-sm text-red-400/80 mt-1">
                                Your account is scheduled for deletion in <strong>{daysUntilDeletion} days</strong>
                                ({new Date(pendingDeletion.scheduled_deletion_at).toLocaleDateString()}).
                            </p>
                            <p className="text-sm text-red-400/80 mt-2">
                                All your data will be permanently deleted. This action cannot be undone.
                            </p>
                            <button
                                onClick={handleCancelDeletion}
                                className="mt-3 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg text-sm font-medium"
                            >
                                Cancel Deletion Request
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Data Privacy Section */}
            <div>
                <h3 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
                    <Shield className="w-5 h-5" />
                    Data Privacy
                </h3>

                <div className="bg-dark-card border border-dark-border rounded-lg divide-y divide-dark-border">
                    {/* Data Export */}
                    <div className="p-4">
                        <div className="flex items-start justify-between">
                            <div>
                                <h4 className="text-white font-medium flex items-center gap-2">
                                    <FileJson className="w-4 h-4 text-gray-500" />
                                    Export Your Data
                                </h4>
                                <p className="text-sm text-gray-500 mt-1">
                                    Download a copy of all your data in JSON format. This includes your
                                    quotes, clients, invoices, contacts, and settings.
                                </p>
                            </div>
                            <button
                                onClick={handleExport}
                                disabled={isExporting}
                                className="btn-secondary flex items-center gap-2 flex-shrink-0"
                            >
                                {isExporting ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : exportSuccess ? (
                                    <CheckCircle className="w-4 h-4 text-green-500" />
                                ) : (
                                    <Download className="w-4 h-4" />
                                )}
                                {isExporting ? 'Exporting...' : exportSuccess ? 'Downloaded!' : 'Export Data'}
                            </button>
                        </div>
                    </div>

                    {/* Data Retention */}
                    <div className="p-4">
                        <div className="flex items-start">
                            <div>
                                <h4 className="text-white font-medium flex items-center gap-2">
                                    <Clock className="w-4 h-4 text-gray-500" />
                                    Data Retention
                                </h4>
                                <p className="text-sm text-gray-500 mt-1">
                                    Your data is stored securely and retained as long as your account is active.
                                    Deleted quotes and invoices are kept for 30 days before permanent deletion.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Danger Zone */}
            <div>
                <h3 className="text-lg font-medium text-red-400 mb-4 flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5" />
                    Danger Zone
                </h3>

                <div className="bg-dark-card border border-red-500/30 rounded-lg p-4">
                    <div className="flex items-start justify-between">
                        <div>
                            <h4 className="text-white font-medium flex items-center gap-2">
                                <Trash2 className="w-4 h-4 text-red-500" />
                                Delete Account
                            </h4>
                            <p className="text-sm text-gray-500 mt-1">
                                Permanently delete your account and all associated data.
                                This action cannot be undone. You will have 30 days to cancel.
                            </p>
                        </div>
                        <button
                            onClick={() => setShowDeleteModal(true)}
                            disabled={!!pendingDeletion}
                            className="btn-secondary border-red-500/30 text-red-400 hover:bg-red-500/10 flex-shrink-0 disabled:opacity-50"
                        >
                            <Trash2 className="w-4 h-4 mr-2" />
                            {pendingDeletion ? 'Deletion Pending' : 'Delete Account'}
                        </button>
                    </div>
                </div>
            </div>

            {/* GDPR Information */}
            <div className="text-sm text-gray-500 space-y-2">
                <p>
                    <strong>Your Rights:</strong> Under GDPR, you have the right to access, rectify, erase,
                    and port your personal data. You can exercise these rights using the options above.
                </p>
                <p>
                    <strong>Data Processing:</strong> We process your data to provide our services.
                    For more information, see our Privacy Policy.
                </p>
            </div>

            {/* Delete Account Modal */}
            {showDeleteModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-dark-card border border-dark-border rounded-xl w-full max-w-md p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 bg-red-500/20 rounded-full flex items-center justify-center">
                                <AlertTriangle className="w-5 h-5 text-red-500" />
                            </div>
                            <div>
                                <h3 className="text-lg font-medium text-white">Delete Account</h3>
                                <p className="text-sm text-gray-500">This action cannot be undone</p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-sm text-red-400">
                                <p className="font-medium mb-1">Warning: This will permanently delete:</p>
                                <ul className="list-disc list-inside space-y-1 text-red-400/80">
                                    <li>Your account and profile</li>
                                    <li>All quotes, invoices, and contracts</li>
                                    <li>All clients and contacts</li>
                                    <li>All project data</li>
                                    <li>Organization membership</li>
                                </ul>
                            </div>

                            <div>
                                <label className="block text-sm text-gray-400 mb-1">
                                    Why are you leaving? (Optional)
                                </label>
                                <textarea
                                    value={deleteReason}
                                    onChange={(e) => setDeleteReason(e.target.value)}
                                    placeholder="Help us improve by sharing your feedback..."
                                    className="input w-full h-24 resize-none"
                                />
                            </div>

                            <div className="flex items-center gap-2 text-sm text-gray-500">
                                <Calendar className="w-4 h-4" />
                                <span>Your account will be deleted 30 days from confirmation</span>
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button
                                    onClick={() => setShowDeleteModal(false)}
                                    className="btn-secondary flex-1"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleDeleteRequest}
                                    disabled={isDeleting}
                                    className="flex-1 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium flex items-center justify-center gap-2"
                                >
                                    {isDeleting ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <Trash2 className="w-4 h-4" />
                                    )}
                                    Confirm Deletion
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
