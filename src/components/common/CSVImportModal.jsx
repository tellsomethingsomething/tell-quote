/**
 * CSV Import Modal
 * Reusable component for importing CSV data into the system
 */

import { useState, useRef, useCallback } from 'react';
import { X, Upload, Download, FileText, AlertCircle, CheckCircle, Loader2, ArrowRight, RefreshCw } from 'lucide-react';
import {
    processImportFile,
    mapHeaders,
    validateImportData,
    downloadTemplate,
    importClients,
    importCrew,
    importEquipment,
    IMPORT_SCHEMAS,
} from '../../services/dataImportService';
import { useOrgContext } from '../../hooks/useOrgContext';
import { useAuthStore } from '../../store/authStore';

const DATA_TYPE_CONFIG = {
    clients: {
        label: 'Clients',
        description: 'Import your client and company data',
        icon: '🏢',
        importFn: importClients,
    },
    crew: {
        label: 'Crew',
        description: 'Import your crew members and contacts',
        icon: '👥',
        importFn: importCrew,
    },
    equipment: {
        label: 'Equipment',
        description: 'Import your equipment and gear inventory',
        icon: '🎬',
        importFn: importEquipment,
    },
};

export default function CSVImportModal({ isOpen, onClose, dataType = 'clients', onImportComplete }) {
    const { organizationId } = useOrgContext();
    const { user } = useAuthStore();
    const fileInputRef = useRef(null);

    const [step, setStep] = useState('upload'); // 'upload' | 'preview' | 'mapping' | 'importing' | 'complete'
    const [file, setFile] = useState(null);
    const [parsedData, setParsedData] = useState(null);
    const [mapping, setMapping] = useState(null);
    const [validationResult, setValidationResult] = useState(null);
    const [importResult, setImportResult] = useState(null);
    const [error, setError] = useState(null);
    const [isProcessing, setIsProcessing] = useState(false);

    const config = DATA_TYPE_CONFIG[dataType];
    const schema = IMPORT_SCHEMAS[dataType];

    const resetState = useCallback(() => {
        setStep('upload');
        setFile(null);
        setParsedData(null);
        setMapping(null);
        setValidationResult(null);
        setImportResult(null);
        setError(null);
        setIsProcessing(false);
    }, []);

    const handleClose = () => {
        resetState();
        onClose();
    };

    const handleFileSelect = async (e) => {
        const selectedFile = e.target.files?.[0];
        if (!selectedFile) return;

        setFile(selectedFile);
        setError(null);
        setIsProcessing(true);

        try {
            const result = await processImportFile(selectedFile);
            setParsedData(result);

            // Auto-map headers
            const headerMapping = mapHeaders(result.headers, dataType);
            setMapping(headerMapping);

            // Validate data
            const validation = validateImportData(result.rows, headerMapping.mapping, dataType);
            setValidationResult(validation);

            setStep('preview');
        } catch (err) {
            setError(err.message || 'Failed to process file');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleMappingChange = (originalHeader, newField) => {
        if (!mapping) return;

        const newMapping = { ...mapping.mapping };

        // Remove any existing mapping to this field
        Object.keys(newMapping).forEach(key => {
            if (newMapping[key] === newField && key !== originalHeader) {
                delete newMapping[key];
            }
        });

        if (newField === '') {
            delete newMapping[originalHeader];
        } else {
            newMapping[originalHeader] = newField;
        }

        const newUnmapped = parsedData.headers.filter(h => !newMapping[h]);
        setMapping({ mapping: newMapping, unmapped: newUnmapped });

        // Re-validate with new mapping
        const validation = validateImportData(parsedData.rows, newMapping, dataType);
        setValidationResult(validation);
    };

    const handleImport = async () => {
        if (!organizationId || !user?.userId) {
            setError('Please log in to import data');
            return;
        }

        if (!validationResult?.valid?.length) {
            setError('No valid records to import');
            return;
        }

        setStep('importing');
        setIsProcessing(true);
        setError(null);

        try {
            const result = await config.importFn(validationResult.valid, organizationId, user.userId);

            if (result.success) {
                setImportResult(result);
                setStep('complete');
                onImportComplete?.(result);
            } else {
                setError(result.error || 'Import failed');
                setStep('preview');
            }
        } catch (err) {
            setError(err.message || 'Import failed');
            setStep('preview');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleDownloadTemplate = () => {
        downloadTemplate(dataType);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
            <div className="bg-dark-card border border-dark-border rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-dark-border">
                    <div className="flex items-center gap-3">
                        <span className="text-2xl">{config.icon}</span>
                        <div>
                            <h2 className="text-lg font-semibold text-white">Import {config.label}</h2>
                            <p className="text-sm text-gray-400">{config.description}</p>
                        </div>
                    </div>
                    <button
                        onClick={handleClose}
                        className="p-2 text-gray-400 hover:text-white hover:bg-dark-border rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    {error && (
                        <div className="mb-4 flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400">
                            <AlertCircle className="w-4 h-4 flex-shrink-0" />
                            <span>{error}</span>
                        </div>
                    )}

                    {/* Step 1: Upload */}
                    {step === 'upload' && (
                        <div className="space-y-6">
                            <div
                                onClick={() => fileInputRef.current?.click()}
                                className="border-2 border-dashed border-dark-border rounded-xl p-8 text-center hover:border-brand-primary/50 hover:bg-brand-primary/5 cursor-pointer transition-colors"
                            >
                                <Upload className="w-12 h-12 text-gray-500 mx-auto mb-4" />
                                <p className="text-white font-medium mb-2">
                                    {isProcessing ? 'Processing...' : 'Click to upload CSV file'}
                                </p>
                                <p className="text-gray-500 text-sm">
                                    or drag and drop your file here
                                </p>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept=".csv,.txt"
                                    onChange={handleFileSelect}
                                    className="hidden"
                                />
                            </div>

                            <div className="flex items-center gap-4">
                                <div className="flex-1 h-px bg-dark-border"></div>
                                <span className="text-gray-500 text-sm">or</span>
                                <div className="flex-1 h-px bg-dark-border"></div>
                            </div>

                            <button
                                onClick={handleDownloadTemplate}
                                className="w-full flex items-center justify-center gap-2 p-3 border border-dark-border rounded-lg hover:border-brand-primary/50 hover:bg-brand-primary/5 transition-colors text-gray-300"
                            >
                                <Download className="w-4 h-4" />
                                Download Template
                            </button>

                            <div className="bg-dark-bg border border-dark-border rounded-lg p-4">
                                <h3 className="font-medium text-white mb-2">Expected Columns</h3>
                                <div className="grid grid-cols-2 gap-2 text-sm">
                                    <div>
                                        <p className="text-green-400 mb-1">Required:</p>
                                        <ul className="text-gray-400 space-y-1">
                                            {schema.required.map(field => (
                                                <li key={field}>• {field}</li>
                                            ))}
                                        </ul>
                                    </div>
                                    <div>
                                        <p className="text-gray-400 mb-1">Optional:</p>
                                        <ul className="text-gray-500 space-y-1">
                                            {schema.optional.slice(0, 4).map(field => (
                                                <li key={field}>• {field}</li>
                                            ))}
                                            {schema.optional.length > 4 && (
                                                <li>• +{schema.optional.length - 4} more</li>
                                            )}
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Step 2: Preview & Mapping */}
                    {step === 'preview' && parsedData && (
                        <div className="space-y-6">
                            <div className="flex items-center gap-3 p-3 bg-dark-bg rounded-lg">
                                <FileText className="w-5 h-5 text-brand-primary" />
                                <div className="flex-1">
                                    <p className="text-white text-sm font-medium">{file?.name}</p>
                                    <p className="text-gray-500 text-xs">
                                        {parsedData.rows.length} rows, {parsedData.headers.length} columns
                                    </p>
                                </div>
                                <button
                                    onClick={resetState}
                                    className="p-2 text-gray-400 hover:text-white transition-colors"
                                    title="Change file"
                                >
                                    <RefreshCw className="w-4 h-4" />
                                </button>
                            </div>

                            {/* Column Mapping */}
                            <div>
                                <h3 className="font-medium text-white mb-3">Column Mapping</h3>
                                <div className="space-y-2 max-h-48 overflow-y-auto">
                                    {parsedData.headers.map(header => (
                                        <div key={header} className="flex items-center gap-3">
                                            <span className="text-gray-400 text-sm w-32 truncate" title={header}>
                                                {header}
                                            </span>
                                            <ArrowRight className="w-4 h-4 text-gray-600 flex-shrink-0" />
                                            <select
                                                value={mapping?.mapping[header] || ''}
                                                onChange={(e) => handleMappingChange(header, e.target.value)}
                                                className="input-sm text-sm flex-1"
                                            >
                                                <option value="">— Skip this column —</option>
                                                {[...schema.required, ...schema.optional].map(field => (
                                                    <option key={field} value={field}>
                                                        {field} {schema.required.includes(field) ? '*' : ''}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Validation Summary */}
                            {validationResult && (
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
                                        <div className="flex items-center gap-2 text-green-400 mb-1">
                                            <CheckCircle className="w-4 h-4" />
                                            <span className="font-medium">Valid Records</span>
                                        </div>
                                        <p className="text-2xl font-bold text-white">{validationResult.valid.length}</p>
                                    </div>
                                    <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
                                        <div className="flex items-center gap-2 text-red-400 mb-1">
                                            <AlertCircle className="w-4 h-4" />
                                            <span className="font-medium">Invalid Records</span>
                                        </div>
                                        <p className="text-2xl font-bold text-white">{validationResult.invalid.length}</p>
                                    </div>
                                </div>
                            )}

                            {/* Validation Errors */}
                            {validationResult?.errors?.length > 0 && (
                                <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 max-h-32 overflow-y-auto">
                                    <p className="text-red-400 text-sm font-medium mb-2">Issues found:</p>
                                    <ul className="text-red-300 text-xs space-y-1">
                                        {validationResult.errors.slice(0, 5).map((err, i) => (
                                            <li key={i}>{err}</li>
                                        ))}
                                        {validationResult.errors.length > 5 && (
                                            <li>...and {validationResult.errors.length - 5} more issues</li>
                                        )}
                                    </ul>
                                </div>
                            )}

                            {/* Data Preview */}
                            <div>
                                <h3 className="font-medium text-white mb-3">Preview (first 5 rows)</h3>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="border-b border-dark-border">
                                                {parsedData.headers.slice(0, 5).map(header => (
                                                    <th key={header} className="px-3 py-2 text-left text-gray-400 font-medium">
                                                        {mapping?.mapping[header] || header}
                                                    </th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {parsedData.rows.slice(0, 5).map((row, i) => (
                                                <tr key={i} className="border-b border-dark-border/50">
                                                    {parsedData.headers.slice(0, 5).map(header => (
                                                        <td key={header} className="px-3 py-2 text-gray-300 truncate max-w-[150px]">
                                                            {row[header] || '-'}
                                                        </td>
                                                    ))}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Step 3: Importing */}
                    {step === 'importing' && (
                        <div className="text-center py-12">
                            <Loader2 className="w-12 h-12 text-brand-primary animate-spin mx-auto mb-4" />
                            <p className="text-white font-medium mb-2">Importing {validationResult?.valid?.length || 0} records...</p>
                            <p className="text-gray-500 text-sm">This may take a moment</p>
                        </div>
                    )}

                    {/* Step 4: Complete */}
                    {step === 'complete' && importResult && (
                        <div className="text-center py-8">
                            <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                                <CheckCircle className="w-8 h-8 text-green-400" />
                            </div>
                            <h3 className="text-xl font-semibold text-white mb-2">Import Complete!</h3>
                            <p className="text-gray-400 mb-6">
                                Successfully imported {importResult.imported} {config.label.toLowerCase()}
                            </p>
                            <div className="flex justify-center gap-3">
                                <button onClick={resetState} className="btn-secondary">
                                    Import More
                                </button>
                                <button onClick={handleClose} className="btn-primary">
                                    Done
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                {(step === 'preview') && (
                    <div className="px-6 py-4 border-t border-dark-border flex justify-end gap-3">
                        <button onClick={handleClose} className="btn-secondary">
                            Cancel
                        </button>
                        <button
                            onClick={handleImport}
                            disabled={!validationResult?.valid?.length || isProcessing}
                            className="btn-primary flex items-center gap-2"
                        >
                            {isProcessing ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Processing...
                                </>
                            ) : (
                                <>
                                    <Upload className="w-4 h-4" />
                                    Import {validationResult?.valid?.length || 0} Records
                                </>
                            )}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
