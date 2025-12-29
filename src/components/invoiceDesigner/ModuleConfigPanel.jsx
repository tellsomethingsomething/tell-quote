import { useInvoiceTemplateStore } from '../../store/invoiceTemplateStore';
import { MODULE_TYPES } from '../../data/invoiceModules';

export default function ModuleConfigPanel() {
    const {
        selectedModuleId,
        getActiveTemplate,
        updateModuleConfig,
        removeModule,
        duplicateModule,
    } = useInvoiceTemplateStore();

    const template = getActiveTemplate();
    const selectedModule = template?.layout.find(m => m.id === selectedModuleId);
    const moduleType = selectedModule ? MODULE_TYPES[selectedModule.type] : null;

    if (!selectedModule || !moduleType) {
        return (
            <div className="p-4 text-center text-gray-500">
                <svg className="w-12 h-12 mx-auto mb-3 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
                </svg>
                <p className="text-sm">Select a module to configure</p>
                <p className="text-xs text-gray-600 mt-1">Click on any module in the canvas</p>
            </div>
        );
    }

    const handleConfigChange = (key, value) => {
        updateModuleConfig(selectedModuleId, { [key]: value });
    };

    return (
        <div className="p-4">
            {/* Module Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded bg-accent-primary/20 flex items-center justify-center">
                        <svg className="w-4 h-4 text-accent-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={moduleType.icon} />
                        </svg>
                    </div>
                    <div>
                        <h4 className="text-sm font-semibold text-gray-100">{moduleType.name}</h4>
                        <p className="text-xs text-gray-500">{moduleType.description}</p>
                    </div>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="flex gap-2 mb-4">
                <button
                    onClick={() => duplicateModule(selectedModuleId)}
                    className="btn-ghost btn-sm flex-1"
                >
                    Duplicate
                </button>
                <button
                    onClick={() => removeModule(selectedModuleId)}
                    className="btn-danger btn-sm flex-1"
                >
                    Delete
                </button>
            </div>

            {/* Config Form */}
            <div className="space-y-4">
                {Object.entries(moduleType.configSchema).map(([key, schema]) => (
                    <ConfigField
                        key={key}
                        fieldKey={key}
                        schema={schema}
                        value={selectedModule.config[key]}
                        onChange={(value) => handleConfigChange(key, value)}
                    />
                ))}
            </div>
        </div>
    );
}

function ConfigField({ fieldKey, schema, value, onChange }) {
    const actualValue = value !== undefined ? value : schema.default;

    switch (schema.type) {
        case 'boolean':
            return (
                <label className="flex items-center justify-between gap-3 cursor-pointer">
                    <span className="text-sm text-gray-300">{schema.label}</span>
                    <button
                        type="button"
                        onClick={() => onChange(!actualValue)}
                        className={`relative w-10 h-5 rounded-full transition-colors ${
                            actualValue ? 'bg-accent-primary' : 'bg-gray-700'
                        }`}
                    >
                        <div
                            className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                                actualValue ? 'translate-x-5' : 'translate-x-0.5'
                            }`}
                        />
                    </button>
                </label>
            );

        case 'text':
            return (
                <div>
                    <label className="label">{schema.label}</label>
                    <input
                        type="text"
                        value={actualValue || ''}
                        onChange={(e) => onChange(e.target.value)}
                        className="input-sm w-full"
                    />
                </div>
            );

        case 'textarea':
            return (
                <div>
                    <label className="label">{schema.label}</label>
                    <textarea
                        value={actualValue || ''}
                        onChange={(e) => onChange(e.target.value)}
                        rows={3}
                        className="input-sm w-full resize-none"
                    />
                </div>
            );

        case 'number':
            return (
                <div>
                    <label className="label">{schema.label}</label>
                    <div className="flex items-center gap-2">
                        <input
                            type="range"
                            min={schema.min || 0}
                            max={schema.max || 100}
                            value={actualValue || 0}
                            onChange={(e) => onChange(parseInt(e.target.value))}
                            className="flex-1 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-accent-primary"
                        />
                        <input
                            type="number"
                            min={schema.min || 0}
                            max={schema.max || 100}
                            value={actualValue || 0}
                            onChange={(e) => onChange(parseInt(e.target.value))}
                            className="input-sm w-16 text-center"
                        />
                    </div>
                </div>
            );

        case 'select':
            return (
                <div>
                    <label className="label">{schema.label}</label>
                    <select
                        value={actualValue || ''}
                        onChange={(e) => onChange(e.target.value)}
                        className="input-sm w-full"
                    >
                        {schema.options.map(opt => (
                            <option key={opt} value={opt}>
                                {opt.charAt(0).toUpperCase() + opt.slice(1)}
                            </option>
                        ))}
                    </select>
                </div>
            );

        case 'color':
            return (
                <div>
                    <label className="label">{schema.label}</label>
                    <div className="flex items-center gap-2">
                        <input
                            type="color"
                            value={actualValue || '#000000'}
                            onChange={(e) => onChange(e.target.value)}
                            className="w-10 h-10 rounded cursor-pointer bg-transparent border-0"
                        />
                        <input
                            type="text"
                            value={actualValue || ''}
                            onChange={(e) => onChange(e.target.value)}
                            placeholder="#000000"
                            className="input-sm flex-1 font-mono text-xs"
                        />
                        {/* Preset colors */}
                        <div className="flex gap-1">
                            {['#8B5CF6', '#1e1b4b', '#3B82F6', '#374151', '#FFFFFF'].map(color => (
                                <button
                                    key={color}
                                    type="button"
                                    onClick={() => onChange(color)}
                                    className="w-5 h-5 rounded border border-dark-border"
                                    style={{ backgroundColor: color }}
                                    title={color}
                                />
                            ))}
                        </div>
                    </div>
                </div>
            );

        default:
            return null;
    }
}
