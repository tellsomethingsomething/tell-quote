import { useInvoiceTemplateStore } from '../../store/invoiceTemplateStore';
import { PAGE_SIZES } from '../../data/invoiceModules';
import { useSettingsStore } from '../../store/settingsStore';
import { useRef } from 'react';

export default function StylesPanel({ template }) {
    const { updatePageSettings, updateStyles, updateTemplate } = useInvoiceTemplateStore();
    const { settings, setCompanyInfo } = useSettingsStore();
    const logoInputRef = useRef(null);

    if (!template) return null;

    const { pageSettings, styles } = template;

    const handlePageSettingChange = (key, value) => {
        updatePageSettings({ [key]: value });
    };

    const handleMarginChange = (side, value) => {
        updatePageSettings({
            margins: {
                ...pageSettings.margins,
                [side]: parseInt(value) || 0,
            },
        });
    };

    const handleStyleChange = (key, value) => {
        updateStyles({ [key]: value });
    };

    const handleLogoUpload = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith('image/')) {
            alert('Please select an image file');
            return;
        }

        // Validate file size (max 2MB)
        if (file.size > 2 * 1024 * 1024) {
            alert('Image must be less than 2MB');
            return;
        }

        const reader = new FileReader();
        reader.onload = (event) => {
            const base64 = event.target?.result;
            if (base64) {
                setCompanyInfo({ logo: base64 });
            }
        };
        reader.readAsDataURL(file);
    };

    const handleRemoveLogo = () => {
        setCompanyInfo({ logo: null });
    };

    return (
        <div className="p-4 space-y-6">
            {/* Company Logo Upload */}
            <div>
                <h4 className="text-sm font-semibold text-gray-200 mb-3 flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    Company Logo
                </h4>
                <div className="space-y-3">
                    {settings.company?.logo ? (
                        <div className="relative">
                            <img
                                src={settings.company.logo}
                                alt="Company Logo"
                                className="max-h-20 rounded border border-dark-border bg-white p-2"
                            />
                            <button
                                onClick={handleRemoveLogo}
                                className="absolute -top-2 -right-2 p-1 bg-red-500 rounded-full text-white hover:bg-red-600"
                            >
                                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                    ) : (
                        <div className="text-xs text-gray-500">No logo uploaded</div>
                    )}
                    <input
                        ref={logoInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleLogoUpload}
                        className="hidden"
                    />
                    <button
                        onClick={() => logoInputRef.current?.click()}
                        className="btn-ghost btn-sm w-full"
                    >
                        {settings.company?.logo ? 'Change Logo' : 'Upload Logo'}
                    </button>
                    <p className="text-xs text-gray-500">PNG, JPG up to 2MB. Used in Company Info module.</p>
                </div>
            </div>

            {/* Template Name */}
            <div>
                <label className="label">Template Name</label>
                <input
                    type="text"
                    value={template.name}
                    onChange={(e) => updateTemplate(template.id, { name: e.target.value })}
                    className="input-sm w-full"
                />
            </div>

            {/* Page Settings */}
            <div>
                <h4 className="text-sm font-semibold text-gray-200 mb-3 flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Page Settings
                </h4>
                <div className="space-y-3">
                    <div>
                        <label className="label">Page Size</label>
                        <select
                            value={pageSettings.size}
                            onChange={(e) => handlePageSettingChange('size', e.target.value)}
                            className="input-sm w-full"
                        >
                            {PAGE_SIZES.map(size => (
                                <option key={size.id} value={size.id}>{size.label}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="label">Orientation</label>
                        <div className="flex gap-2">
                            <button
                                onClick={() => handlePageSettingChange('orientation', 'portrait')}
                                className={`flex-1 py-2 px-3 rounded text-sm transition-colors ${
                                    pageSettings.orientation === 'portrait'
                                        ? 'bg-accent-primary text-white'
                                        : 'bg-dark-card text-gray-400 hover:text-white'
                                }`}
                            >
                                Portrait
                            </button>
                            <button
                                onClick={() => handlePageSettingChange('orientation', 'landscape')}
                                className={`flex-1 py-2 px-3 rounded text-sm transition-colors ${
                                    pageSettings.orientation === 'landscape'
                                        ? 'bg-accent-primary text-white'
                                        : 'bg-dark-card text-gray-400 hover:text-white'
                                }`}
                            >
                                Landscape
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Margins */}
            <div>
                <h4 className="text-sm font-semibold text-gray-200 mb-3">Page Margins (px)</h4>
                <div className="grid grid-cols-2 gap-3">
                    {['top', 'right', 'bottom', 'left'].map(side => (
                        <div key={side}>
                            <label className="label capitalize">{side}</label>
                            <input
                                type="number"
                                min="0"
                                max="100"
                                value={pageSettings.margins?.[side] || 40}
                                onChange={(e) => handleMarginChange(side, e.target.value)}
                                className="input-sm w-full"
                            />
                        </div>
                    ))}
                </div>
            </div>

            {/* Global Styles */}
            <div>
                <h4 className="text-sm font-semibold text-gray-200 mb-3 flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                    </svg>
                    Colors
                </h4>
                <div className="space-y-3">
                    <ColorPicker
                        label="Primary Color"
                        value={styles.primaryColor}
                        onChange={(v) => handleStyleChange('primaryColor', v)}
                    />
                    <ColorPicker
                        label="Secondary Color"
                        value={styles.secondaryColor}
                        onChange={(v) => handleStyleChange('secondaryColor', v)}
                    />
                    <ColorPicker
                        label="Text Color"
                        value={styles.textColor}
                        onChange={(v) => handleStyleChange('textColor', v)}
                    />
                    <ColorPicker
                        label="Background Color"
                        value={styles.backgroundColor}
                        onChange={(v) => handleStyleChange('backgroundColor', v)}
                    />
                </div>
            </div>

            {/* Typography */}
            <div>
                <h4 className="text-sm font-semibold text-gray-200 mb-3">Typography</h4>
                <div className="space-y-3">
                    <div>
                        <label className="label">Font Family</label>
                        <select
                            value={styles.fontFamily}
                            onChange={(e) => handleStyleChange('fontFamily', e.target.value)}
                            className="input-sm w-full"
                        >
                            <option value="Helvetica">Helvetica</option>
                            <option value="Times-Roman">Times Roman</option>
                            <option value="Courier">Courier</option>
                        </select>
                    </div>
                    <div>
                        <label className="label">Base Font Size</label>
                        <div className="flex items-center gap-2">
                            <input
                                type="range"
                                min="8"
                                max="14"
                                value={styles.baseFontSize || 10}
                                onChange={(e) => handleStyleChange('baseFontSize', parseInt(e.target.value))}
                                className="flex-1 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-accent-primary"
                            />
                            <span className="text-sm text-gray-400 w-8">{styles.baseFontSize || 10}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function ColorPicker({ label, value, onChange }) {
    const presets = ['#6E44FF', '#143642', '#3B82F6', '#374151', '#6B7280', '#FFFFFF', '#000000'];

    return (
        <div>
            <label className="label">{label}</label>
            <div className="flex items-center gap-2">
                <input
                    type="color"
                    value={value || '#000000'}
                    onChange={(e) => onChange(e.target.value)}
                    className="w-8 h-8 rounded cursor-pointer bg-transparent border-0"
                />
                <input
                    type="text"
                    value={value || ''}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder="#000000"
                    className="input-sm flex-1 font-mono text-xs"
                />
                <div className="flex gap-0.5">
                    {presets.slice(0, 4).map(color => (
                        <button
                            key={color}
                            type="button"
                            onClick={() => onChange(color)}
                            className="w-4 h-4 rounded border border-dark-border"
                            style={{ backgroundColor: color }}
                            title={color}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
}
