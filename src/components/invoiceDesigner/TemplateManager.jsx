import { useInvoiceTemplateStore } from '../../store/invoiceTemplateStore';
import { useRef } from 'react';

export default function TemplateManager({ onClose }) {
    const {
        templates,
        activeTemplateId,
        setActiveTemplate,
        createTemplate,
        deleteTemplate,
        duplicateTemplate,
        setDefaultTemplate,
        exportTemplate,
        importTemplate,
    } = useInvoiceTemplateStore();

    const importInputRef = useRef(null);

    const handleImport = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const result = importTemplate(event.target?.result);
            if (result.success) {
                alert(`Template "${result.template.name}" imported successfully!`);
            } else {
                alert(`Import failed: ${result.error}`);
            }
        };
        reader.readAsText(file);
        e.target.value = '';
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4">
            <div className="bg-dark-card border border-dark-border rounded-xl w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-dark-border">
                    <h3 className="text-lg font-semibold text-gray-100">Manage Templates</h3>
                    <button
                        onClick={onClose}
                        className="p-2 text-gray-400 hover:text-white rounded-lg hover:bg-white/10"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 p-4 border-b border-dark-border">
                    <button
                        onClick={() => createTemplate('New Template')}
                        className="btn-primary btn-sm"
                    >
                        + New Template
                    </button>
                    <input
                        ref={importInputRef}
                        type="file"
                        accept=".json"
                        onChange={handleImport}
                        className="hidden"
                    />
                    <button
                        onClick={() => importInputRef.current?.click()}
                        className="btn-ghost btn-sm"
                    >
                        Import JSON
                    </button>
                </div>

                {/* Template List */}
                <div className="flex-1 overflow-y-auto p-4">
                    <div className="space-y-2">
                        {templates.map(template => (
                            <div
                                key={template.id}
                                className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${
                                    activeTemplateId === template.id
                                        ? 'border-accent-primary bg-accent-primary/10'
                                        : 'border-dark-border hover:border-gray-600'
                                }`}
                            >
                                <div
                                    className="flex-1 cursor-pointer"
                                    onClick={() => setActiveTemplate(template.id)}
                                >
                                    <div className="flex items-center gap-2">
                                        <span className="font-medium text-gray-100">{template.name}</span>
                                        {template.isDefault && (
                                            <span className="px-2 py-0.5 text-xs bg-accent-primary/20 text-accent-primary rounded">
                                                Default
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-xs text-gray-500 mt-1">
                                        {template.layout?.length || 0} modules •
                                        Last updated: {new Date(template.updatedAt).toLocaleDateString()}
                                    </p>
                                </div>

                                <div className="flex items-center gap-1">
                                    {!template.isDefault && (
                                        <button
                                            onClick={() => setDefaultTemplate(template.id)}
                                            className="p-2 text-gray-400 hover:text-accent-primary rounded"
                                            title="Set as default"
                                        >
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                                            </svg>
                                        </button>
                                    )}
                                    <button
                                        onClick={() => duplicateTemplate(template.id)}
                                        className="p-2 text-gray-400 hover:text-white rounded"
                                        title="Duplicate"
                                    >
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                        </svg>
                                    </button>
                                    <button
                                        onClick={() => exportTemplate(template.id)}
                                        className="p-2 text-gray-400 hover:text-white rounded"
                                        title="Export"
                                    >
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                        </svg>
                                    </button>
                                    {templates.length > 1 && (
                                        <button
                                            onClick={() => {
                                                if (confirm(`Delete "${template.name}"?`)) {
                                                    deleteTemplate(template.id);
                                                }
                                            }}
                                            className="p-2 text-gray-400 hover:text-red-400 rounded"
                                            title="Delete"
                                        >
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                            </svg>
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-dark-border">
                    <button onClick={onClose} className="btn-primary w-full">
                        Done
                    </button>
                </div>
            </div>
        </div>
    );
}
