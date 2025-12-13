import { MODULE_TYPES } from '../../data/invoiceModules';
import { useInvoiceTemplateStore } from '../../store/invoiceTemplateStore';

export default function ModuleSidebar() {
    const { addModule, setDragging } = useInvoiceTemplateStore();

    const handleDragStart = (e, moduleType) => {
        e.dataTransfer.setData('moduleType', moduleType);
        e.dataTransfer.effectAllowed = 'copy';
        setDragging(true);
    };

    const handleDragEnd = () => {
        setDragging(false);
    };

    const handleClick = (moduleType) => {
        addModule(moduleType);
    };

    // Group modules by category
    const categories = {
        'Header & Info': ['companyInfo', 'clientInfo', 'invoiceHeader', 'projectInfo'],
        'Content': ['lineItems', 'totals', 'customText'],
        'Payment & Terms': ['bankDetails', 'paymentTerms', 'termsConditions', 'signature'],
        'Layout': ['divider', 'spacer', 'image', 'footer'],
    };

    return (
        <div className="p-3">
            <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                Available Modules
            </h4>
            <p className="text-xs text-gray-500 mb-4">
                Drag to canvas or click to add
            </p>

            {Object.entries(categories).map(([category, moduleIds]) => (
                <div key={category} className="mb-4">
                    <h5 className="text-xs font-medium text-gray-500 mb-2">{category}</h5>
                    <div className="space-y-1">
                        {moduleIds.map(moduleId => {
                            const module = MODULE_TYPES[moduleId];
                            if (!module) return null;

                            return (
                                <div
                                    key={moduleId}
                                    draggable
                                    onDragStart={(e) => handleDragStart(e, moduleId)}
                                    onDragEnd={handleDragEnd}
                                    onClick={() => handleClick(moduleId)}
                                    className="flex items-center gap-2 p-2 bg-dark-card border border-dark-border rounded-lg cursor-grab hover:border-accent-primary/50 hover:bg-accent-primary/5 transition-all active:cursor-grabbing group"
                                >
                                    <div className="w-8 h-8 flex items-center justify-center rounded bg-dark-bg text-gray-400 group-hover:text-accent-primary transition-colors">
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={module.icon} />
                                        </svg>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs font-medium text-gray-200 truncate">{module.name}</p>
                                    </div>
                                    <svg className="w-3 h-3 text-gray-600 group-hover:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                    </svg>
                                </div>
                            );
                        })}
                    </div>
                </div>
            ))}
        </div>
    );
}
