import { useState } from 'react';
import { useInvoiceTemplateStore } from '../../store/invoiceTemplateStore';
import { MODULE_TYPES, WIDTH_OPTIONS } from '../../data/invoiceModules';

export default function DesignerCanvas({ template }) {
    const {
        selectedModuleId,
        selectModule,
        addModule,
        removeModule,
        moveModule,
        duplicateModule,
        updateModuleWidth,
        reorderModules,
        isDragging,
        setDragging,
    } = useInvoiceTemplateStore();

    const [dropIndex, setDropIndex] = useState(-1);
    const [draggedIndex, setDraggedIndex] = useState(-1);

    const handleDragOver = (e, index) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'copy';
        setDropIndex(index);
    };

    const handleDragLeave = () => {
        setDropIndex(-1);
    };

    const handleDrop = (e, index) => {
        e.preventDefault();
        const moduleType = e.dataTransfer.getData('moduleType');
        const fromIndex = e.dataTransfer.getData('fromIndex');

        if (moduleType && !fromIndex) {
            // Adding new module from sidebar
            addModule(moduleType, index);
        } else if (fromIndex !== '') {
            // Reordering existing module
            const from = parseInt(fromIndex);
            if (from !== index && from !== index - 1) {
                reorderModules(from, index > from ? index - 1 : index);
            }
        }

        setDropIndex(-1);
        setDraggedIndex(-1);
        setDragging(false);
    };

    const handleModuleDragStart = (e, index) => {
        e.dataTransfer.setData('fromIndex', index.toString());
        e.dataTransfer.effectAllowed = 'move';
        setDraggedIndex(index);
        setDragging(true);
    };

    const handleModuleDragEnd = () => {
        setDraggedIndex(-1);
        setDragging(false);
    };

    if (!template) {
        return (
            <div className="flex items-center justify-center h-full text-gray-500">
                No template selected
            </div>
        );
    }

    const { layout } = template;

    // Group modules into rows based on width
    const rows = [];
    let currentRow = [];
    let currentRowWidth = 0;

    layout.forEach((module, index) => {
        const widthValue = WIDTH_OPTIONS.find(w => w.id === module.width)?.value || '100%';
        const widthPercent = parseFloat(widthValue);

        if (currentRowWidth + widthPercent > 100 || module.width === 'full') {
            if (currentRow.length > 0) {
                rows.push(currentRow);
            }
            currentRow = [{ ...module, originalIndex: index }];
            currentRowWidth = widthPercent;

            if (module.width === 'full') {
                rows.push(currentRow);
                currentRow = [];
                currentRowWidth = 0;
            }
        } else {
            currentRow.push({ ...module, originalIndex: index });
            currentRowWidth += widthPercent;
        }
    });

    if (currentRow.length > 0) {
        rows.push(currentRow);
    }

    return (
        <div className="max-w-[800px] mx-auto">
            {/* Page Preview Container */}
            <div
                className="bg-white rounded-lg shadow-xl overflow-hidden"
                style={{
                    minHeight: '600px',
                    padding: `${template.pageSettings?.margins?.top || 40}px ${template.pageSettings?.margins?.right || 40}px`,
                }}
            >
                {/* Drop zone at start */}
                <div
                    onDragOver={(e) => handleDragOver(e, 0)}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, 0)}
                    className={`h-4 -mx-2 transition-all rounded ${
                        dropIndex === 0
                            ? 'bg-accent-primary/30 h-12 border-2 border-dashed border-accent-primary'
                            : isDragging ? 'bg-gray-100 h-8' : ''
                    }`}
                />

                {/* Module Rows */}
                {rows.map((row, rowIndex) => (
                    <div key={rowIndex} className="flex gap-4 mb-2">
                        {row.map((module) => {
                            const moduleType = MODULE_TYPES[module.type];
                            const isSelected = selectedModuleId === module.id;
                            const widthClass = {
                                'full': 'w-full',
                                'half': 'w-1/2',
                                'third': 'w-1/3',
                                'two-thirds': 'w-2/3',
                                'quarter': 'w-1/4',
                            }[module.width] || 'w-full';

                            return (
                                <div
                                    key={module.id}
                                    draggable
                                    onDragStart={(e) => handleModuleDragStart(e, module.originalIndex)}
                                    onDragEnd={handleModuleDragEnd}
                                    onClick={() => selectModule(module.id)}
                                    className={`${widthClass} flex-shrink-0`}
                                >
                                    <div
                                        className={`relative p-3 rounded border-2 transition-all cursor-pointer group ${
                                            isSelected
                                                ? 'border-accent-primary bg-accent-primary/5'
                                                : 'border-transparent hover:border-gray-300 bg-gray-50'
                                        } ${draggedIndex === module.originalIndex ? 'opacity-50' : ''}`}
                                    >
                                        {/* Module Header */}
                                        <div className="flex items-center justify-between mb-2">
                                            <div className="flex items-center gap-2">
                                                <div className="w-6 h-6 rounded bg-gray-200 flex items-center justify-center">
                                                    <svg className="w-3 h-3 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={moduleType?.icon || ''} />
                                                    </svg>
                                                </div>
                                                <span className="text-xs font-medium text-gray-600">
                                                    {moduleType?.name || module.type}
                                                </span>
                                            </div>

                                            {/* Actions */}
                                            <div className={`flex items-center gap-1 ${isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'} transition-opacity`}>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); moveModule(module.id, 'up'); }}
                                                    className="p-1 hover:bg-gray-200 rounded"
                                                    title="Move up"
                                                >
                                                    <svg className="w-3 h-3 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                                                    </svg>
                                                </button>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); moveModule(module.id, 'down'); }}
                                                    className="p-1 hover:bg-gray-200 rounded"
                                                    title="Move down"
                                                >
                                                    <svg className="w-3 h-3 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                                    </svg>
                                                </button>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); duplicateModule(module.id); }}
                                                    className="p-1 hover:bg-gray-200 rounded"
                                                    title="Duplicate"
                                                >
                                                    <svg className="w-3 h-3 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                                    </svg>
                                                </button>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); removeModule(module.id); }}
                                                    className="p-1 hover:bg-red-100 rounded"
                                                    title="Delete"
                                                >
                                                    <svg className="w-3 h-3 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                    </svg>
                                                </button>
                                            </div>
                                        </div>

                                        {/* Module Preview */}
                                        <ModulePreview module={module} template={template} />

                                        {/* Width Selector */}
                                        {isSelected && (
                                            <div className="mt-2 pt-2 border-t border-gray-200">
                                                <div className="flex items-center gap-1">
                                                    <span className="text-[10px] text-gray-400 mr-1">Width:</span>
                                                    {WIDTH_OPTIONS.map(opt => (
                                                        <button
                                                            key={opt.id}
                                                            onClick={(e) => { e.stopPropagation(); updateModuleWidth(module.id, opt.id); }}
                                                            className={`px-2 py-0.5 text-[10px] rounded transition-colors ${
                                                                module.width === opt.id
                                                                    ? 'bg-accent-primary text-white'
                                                                    : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                                                            }`}
                                                        >
                                                            {opt.id === 'full' ? '100%' : opt.id === 'half' ? '50%' : opt.id === 'third' ? '33%' : opt.id === 'two-thirds' ? '66%' : '25%'}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Drop zone after each module */}
                                    <div
                                        onDragOver={(e) => handleDragOver(e, module.originalIndex + 1)}
                                        onDragLeave={handleDragLeave}
                                        onDrop={(e) => handleDrop(e, module.originalIndex + 1)}
                                        className={`h-2 transition-all rounded ${
                                            dropIndex === module.originalIndex + 1
                                                ? 'bg-accent-primary/30 h-8 border-2 border-dashed border-accent-primary my-2'
                                                : isDragging ? 'h-4' : ''
                                        }`}
                                    />
                                </div>
                            );
                        })}
                    </div>
                ))}

                {/* Empty State */}
                {layout.length === 0 && (
                    <div
                        onDragOver={(e) => handleDragOver(e, 0)}
                        onDragLeave={handleDragLeave}
                        onDrop={(e) => handleDrop(e, 0)}
                        className="flex flex-col items-center justify-center h-64 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50"
                    >
                        <svg className="w-12 h-12 text-gray-400 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <p className="text-gray-500 text-sm">Drag modules here to build your invoice</p>
                    </div>
                )}
            </div>
        </div>
    );
}

// Simple preview renderer for canvas
function ModulePreview({ module, template }) {
    const config = module.config || {};

    const previewStyles = {
        companyInfo: (
            <div className="space-y-1">
                {config.showLogo && <div className="w-16 h-8 bg-gray-300 rounded" />}
                {config.showName && <div className="h-3 w-24 bg-gray-300 rounded" />}
                {config.showAddress && <div className="h-2 w-32 bg-gray-200 rounded" />}
            </div>
        ),
        clientInfo: (
            <div className="space-y-1">
                <div className="text-[10px] text-gray-400 uppercase">{config.label || 'Bill To'}</div>
                <div className="h-3 w-20 bg-gray-300 rounded" />
                <div className="h-2 w-24 bg-gray-200 rounded" />
            </div>
        ),
        invoiceHeader: (
            <div className={`text-${config.alignment || 'right'}`}>
                <div className="text-lg font-bold" style={{ color: config.titleColor || '#8B5CF6' }}>
                    {config.title || 'INVOICE'}
                </div>
                <div className="h-2 w-20 bg-gray-200 rounded mt-1 ml-auto" />
            </div>
        ),
        projectInfo: (
            <div
                className="p-2 rounded"
                style={{ backgroundColor: config.backgroundColor || '#F8FAFC' }}
            >
                <div className="h-3 w-32 bg-gray-300 rounded mb-1" />
                <div className="h-2 w-24 bg-gray-200 rounded" />
            </div>
        ),
        lineItems: (
            <div className="space-y-1">
                <div
                    className="h-4 rounded flex items-center px-2"
                    style={{ backgroundColor: config.headerBackground || '#8B5CF6' }}
                >
                    <div className="h-1.5 w-12 bg-white/50 rounded" />
                </div>
                <div className="h-3 bg-gray-100 rounded" />
                <div className="h-3 rounded" style={{ backgroundColor: config.alternateRowColor || '#F8FAFC' }} />
                <div className="h-3 bg-gray-100 rounded" />
            </div>
        ),
        totals: (
            <div className="space-y-1 text-right">
                <div className="h-2 w-20 bg-gray-200 rounded ml-auto" />
                <div className="h-2 w-24 bg-gray-200 rounded ml-auto" />
                <div
                    className="h-4 rounded mt-1"
                    style={{ backgroundColor: config.totalBackground || '#8B5CF6' }}
                />
            </div>
        ),
        paymentTerms: (
            <div className="space-y-1">
                <div className="text-[10px]" style={{ color: config.labelColor || '#8B5CF6' }}>
                    {config.label || 'Payment Terms'}
                </div>
                <div className="h-2 w-full bg-gray-200 rounded" />
                <div className="h-2 w-3/4 bg-gray-200 rounded" />
            </div>
        ),
        bankDetails: (
            <div className="space-y-1">
                <div className="text-[10px]" style={{ color: config.labelColor || '#8B5CF6' }}>
                    {config.label || 'Bank Details'}
                </div>
                <div className="h-2 w-28 bg-gray-200 rounded" />
                <div className="h-2 w-24 bg-gray-200 rounded" />
            </div>
        ),
        termsConditions: (
            <div className="space-y-1">
                <div className="text-[10px]" style={{ color: config.labelColor || '#8B5CF6' }}>
                    {config.label || 'Terms & Conditions'}
                </div>
                <div className="h-1.5 w-full bg-gray-200 rounded" />
                <div className="h-1.5 w-full bg-gray-200 rounded" />
                <div className="h-1.5 w-3/4 bg-gray-200 rounded" />
            </div>
        ),
        signature: (
            <div className="flex gap-8">
                <div className="flex-1 space-y-1">
                    <div className="text-[10px] text-gray-400">{config.preparedByLabel || 'Prepared By'}</div>
                    <div className="h-0.5 w-full bg-gray-300 mt-4" />
                </div>
                {config.showAcceptedBy && (
                    <div className="flex-1 space-y-1">
                        <div className="text-[10px] text-gray-400">{config.acceptedByLabel || 'Accepted By'}</div>
                        <div className="h-0.5 w-full bg-gray-300 mt-4" />
                    </div>
                )}
            </div>
        ),
        customText: (
            <div
                className="p-1 rounded text-xs"
                style={{
                    backgroundColor: config.backgroundColor !== 'transparent' ? config.backgroundColor : undefined,
                    textAlign: config.alignment || 'left',
                    color: config.textColor || '#374151',
                }}
            >
                {(config.text || 'Custom text...').substring(0, 50)}...
            </div>
        ),
        divider: (
            <div
                className="w-full"
                style={{
                    height: config.thickness || 1,
                    backgroundColor: config.color || '#E5E7EB',
                    marginTop: config.marginTop || 10,
                    marginBottom: config.marginBottom || 10,
                    borderStyle: config.style === 'dashed' ? 'dashed' : config.style === 'dotted' ? 'dotted' : 'solid',
                }}
            />
        ),
        spacer: (
            <div
                className="w-full bg-gray-100/50 rounded border border-dashed border-gray-300 flex items-center justify-center"
                style={{ height: config.height || 20 }}
            >
                <span className="text-[8px] text-gray-400">{config.height || 20}px</span>
            </div>
        ),
        image: (
            <div className="flex items-center justify-center p-2 bg-gray-100 rounded">
                <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
            </div>
        ),
        footer: (
            <div
                className="flex justify-center text-[9px]"
                style={{ color: config.textColor || '#9CA3AF' }}
            >
                Page 1 of 1 | Invoice #QT-0001
            </div>
        ),
    };

    return previewStyles[module.type] || (
        <div className="text-xs text-gray-400 italic">Preview not available</div>
    );
}
