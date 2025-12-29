import { useState, createElement, useCallback } from 'react';
import { useSettingsStore } from '../../store/settingsStore';
import { usePDFWatermark } from '../../hooks/useSubscription';

// Sample quote data for preview
const getSampleQuote = (settings) => ({
    quoteNumber: 'QT-2024-001',
    createdAt: new Date().toISOString(),
    validityDays: 30,
    currency: 'USD',
    client: {
        company: 'Acme Corporation',
        contact: 'John Smith',
        email: 'john@acme.com',
        phone: '+1 555 123 4567',
    },
    project: {
        title: 'Corporate Event Production',
        venue: 'Grand Ballroom, Hilton Hotel',
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
        type: 'Event',
    },
    preparedBy: settings.users?.[0]?.id,
    sections: {
        productionTeam: {
            id: 'productionTeam',
            name: 'Production Team',
            color: '#3B82F6',
            subsections: {
                'Camera': [
                    { id: '1', name: 'Camera Operator', quantity: 2, days: 3, cost: 400, charge: 600 },
                    { id: '2', name: 'Camera Assistant', quantity: 1, days: 3, cost: 250, charge: 400 },
                ],
                'Audio': [
                    { id: '3', name: 'Audio Engineer', quantity: 1, days: 3, cost: 450, charge: 650 },
                ],
            },
        },
        productionEquipment: {
            id: 'productionEquipment',
            name: 'Production Equipment',
            color: '#10B981',
            subsections: {
                'Camera Package': [
                    { id: '4', name: 'Sony FX6 Camera Kit', quantity: 2, days: 3, cost: 300, charge: 500 },
                ],
                'Audio Package': [
                    { id: '5', name: 'Wireless Mic System', quantity: 4, days: 3, cost: 50, charge: 100 },
                ],
            },
        },
    },
    sectionOrder: ['productionTeam', 'productionEquipment'],
    fees: {
        managementFee: 10,
        commissionFee: 0,
        discount: 0,
        distributeFees: false,
    },
});

const COLOR_PRESETS = [
    { name: 'Professional Navy', primary: '#1e1b4b', accent: '#8B5CF6', line: '#1e1b4b' },
    { name: 'Modern Blue', primary: '#1E40AF', accent: '#3B82F6', line: '#1E40AF' },
    { name: 'Corporate Gray', primary: '#374151', accent: '#6B7280', line: '#374151' },
    { name: 'Elegant Purple', primary: '#5B21B6', accent: '#8B5CF6', line: '#5B21B6' },
    { name: 'Classic Green', primary: '#065F46', accent: '#10B981', line: '#065F46' },
];

export default function InvoiceDesigner() {
    const { settings, setPdfOptions } = useSettingsStore();
    const pdfOptions = settings.pdfOptions || {};
    const [generatingPreview, setGeneratingPreview] = useState(false);
    const [activeSection, setActiveSection] = useState('colors');
    const { shouldWatermark } = usePDFWatermark();

    const handleColorChange = (key, value) => {
        setPdfOptions({ [key]: value });
    };

    const applyPreset = (preset) => {
        setPdfOptions({
            primaryColor: preset.primary,
            accentColor: preset.accent,
            lineColor: preset.line,
        });
    };

    // Dynamic import for PDF library to avoid 1.5MB bundle on initial load
    const handlePreviewPDF = useCallback(async () => {
        setGeneratingPreview(true);
        try {
            // Lazy load PDF dependencies only when needed
            const [{ pdf }, { default: CleanPDF }] = await Promise.all([
                import('@react-pdf/renderer'),
                import('../pdf/CleanPDF')
            ]);

            const sampleQuote = getSampleQuote(settings);
            const blob = await pdf(
                createElement(CleanPDF, { quote: sampleQuote, currency: 'USD', showWatermark: shouldWatermark })
            ).toBlob();

            const url = URL.createObjectURL(blob);
            window.open(url, '_blank');
            setTimeout(() => URL.revokeObjectURL(url), 5000);
        } catch (e) {
            console.error('Failed to generate preview:', e);
            alert('Failed to generate preview. Check console for details.');
        } finally {
            setGeneratingPreview(false);
        }
    }, [settings, shouldWatermark]);

    return (
        <div className="flex flex-col h-full bg-dark-bg">
            {/* Header */}
            <div className="bg-dark-card border-b border-dark-border p-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-lg font-bold text-gray-100">PDF Styling</h3>
                        <p className="text-sm text-gray-500 mt-1">Customize colors and fonts for your quote PDFs</p>
                    </div>
                    <button
                        onClick={handlePreviewPDF}
                        disabled={generatingPreview}
                        className="btn-primary flex items-center gap-2"
                    >
                        {generatingPreview ? (
                            <>
                                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Generating...
                            </>
                        ) : (
                            <>
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                                Preview PDF
                            </>
                        )}
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 overflow-hidden flex">
                {/* Sidebar Tabs */}
                <div className="w-36 bg-dark-card border-r border-dark-border p-2 flex flex-col gap-1">
                    {[
                        { id: 'colors', label: 'Colors', icon: '🎨' },
                        { id: 'fonts', label: 'Fonts', icon: '✏️' },
                        { id: 'display', label: 'Display', icon: '👁️' },
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveSection(tab.id)}
                            className={`w-full text-left px-3 py-2.5 rounded-lg text-sm flex items-center gap-2 transition-colors ${
                                activeSection === tab.id
                                    ? 'bg-accent-primary/20 text-accent-primary'
                                    : 'text-gray-400 hover:bg-white/5 hover:text-gray-200'
                            }`}
                        >
                            <span>{tab.icon}</span>
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Settings Panel */}
                <div className="flex-1 overflow-y-auto p-6">
                    <div className="max-w-xl">
                        {/* Colors Section */}
                        {activeSection === 'colors' && (
                            <div className="space-y-6">
                                <div>
                                    <h4 className="text-sm font-semibold text-gray-200 mb-4">Color Presets</h4>
                                    <div className="grid grid-cols-2 gap-2">
                                        {COLOR_PRESETS.map((preset, idx) => (
                                            <button
                                                key={idx}
                                                onClick={() => applyPreset(preset)}
                                                className="p-3 rounded-lg border border-dark-border hover:border-gray-600 transition-all group text-left"
                                            >
                                                <div className="flex items-center gap-2 mb-2">
                                                    <div
                                                        className="w-5 h-5 rounded"
                                                        style={{ backgroundColor: preset.primary }}
                                                    />
                                                    <div
                                                        className="w-5 h-5 rounded"
                                                        style={{ backgroundColor: preset.accent }}
                                                    />
                                                </div>
                                                <span className="text-xs text-gray-400 group-hover:text-gray-300">
                                                    {preset.name}
                                                </span>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="border-t border-dark-border pt-6">
                                    <h4 className="text-sm font-semibold text-gray-200 mb-4">Custom Colors</h4>
                                    <div className="space-y-4">
                                        <ColorPicker
                                            label="Primary Color (Headers, titles)"
                                            value={pdfOptions.primaryColor || '#1e1b4b'}
                                            onChange={(v) => handleColorChange('primaryColor', v)}
                                        />
                                        <ColorPicker
                                            label="Accent Color (Labels)"
                                            value={pdfOptions.accentColor || '#8B5CF6'}
                                            onChange={(v) => handleColorChange('accentColor', v)}
                                        />
                                        <ColorPicker
                                            label="Line Color (All lines & borders)"
                                            value={pdfOptions.lineColor || '#1e1b4b'}
                                            onChange={(v) => handleColorChange('lineColor', v)}
                                        />
                                        <ColorPicker
                                            label="Text Color (Body text)"
                                            value={pdfOptions.textColor || '#374151'}
                                            onChange={(v) => handleColorChange('textColor', v)}
                                        />
                                        <ColorPicker
                                            label="Muted Color (Secondary text)"
                                            value={pdfOptions.mutedColor || '#6B7280'}
                                            onChange={(v) => handleColorChange('mutedColor', v)}
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Fonts Section */}
                        {activeSection === 'fonts' && (
                            <div className="space-y-6">
                                <div>
                                    <label className="label">Font Family</label>
                                    <select
                                        value={pdfOptions.fontFamily || 'Helvetica'}
                                        onChange={(e) => handleColorChange('fontFamily', e.target.value)}
                                        className="input w-full"
                                    >
                                        <option value="Helvetica">Helvetica (Clean, Modern)</option>
                                        <option value="Times-Roman">Times Roman (Classic)</option>
                                        <option value="Courier">Courier (Monospace)</option>
                                    </select>
                                    <p className="text-xs text-gray-500 mt-2">
                                        Note: PDF fonts are limited to these built-in options for compatibility.
                                    </p>
                                </div>

                                <div>
                                    <label className="label">Base Font Size</label>
                                    <div className="flex items-center gap-4">
                                        <input
                                            type="range"
                                            min="8"
                                            max="12"
                                            value={pdfOptions.baseFontSize || 10}
                                            onChange={(e) => handleColorChange('baseFontSize', parseInt(e.target.value))}
                                            className="flex-1 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-accent-primary"
                                        />
                                        <span className="text-sm text-gray-300 font-mono w-8">
                                            {pdfOptions.baseFontSize || 10}pt
                                        </span>
                                    </div>
                                    <p className="text-xs text-gray-500 mt-2">
                                        Controls the body text size. Headers scale proportionally.
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Display Section */}
                        {activeSection === 'display' && (
                            <div className="space-y-4">
                                <p className="text-sm text-gray-400 mb-4">
                                    Choose what information to show on your PDF quotes.
                                </p>
                                {[
                                    { key: 'showLogo', label: 'Company Logo' },
                                    { key: 'showCompanyAddress', label: 'Company Address' },
                                    { key: 'showCompanyPhone', label: 'Company Phone' },
                                    { key: 'showCompanyEmail', label: 'Company Email' },
                                    { key: 'showTaxNumber', label: 'Tax Number' },
                                    { key: 'showBankDetails', label: 'Bank Details' },
                                ].map(({ key, label }) => (
                                    <label key={key} className="flex items-center gap-3 p-3 rounded-lg bg-dark-card border border-dark-border hover:border-gray-600 cursor-pointer transition-colors">
                                        <input
                                            type="checkbox"
                                            checked={pdfOptions[key] !== false}
                                            onChange={(e) => handleColorChange(key, e.target.checked)}
                                            className="w-5 h-5 rounded bg-dark-bg border-dark-border text-accent-primary focus:ring-accent-primary"
                                        />
                                        <span className="text-gray-300">{label}</span>
                                    </label>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Preview Panel */}
                <div className="w-80 bg-dark-card border-l border-dark-border p-4 overflow-y-auto">
                    <h4 className="text-sm font-semibold text-gray-200 mb-4">Color Preview</h4>
                    <div className="space-y-4">
                        {/* Mini Preview Card */}
                        <div
                            className="rounded-lg overflow-hidden border border-dark-border"
                            style={{ backgroundColor: pdfOptions.backgroundColor || '#FFFFFF' }}
                        >
                            <div
                                className="p-3"
                                style={{ backgroundColor: pdfOptions.primaryColor || '#1e1b4b' }}
                            >
                                <div className="text-white text-xs font-bold">QUOTE</div>
                            </div>
                            <div className="p-3 space-y-2">
                                <div
                                    className="text-sm font-bold"
                                    style={{ color: pdfOptions.primaryColor || '#1e1b4b' }}
                                >
                                    Project Title
                                </div>
                                <div
                                    className="text-xs"
                                    style={{ color: pdfOptions.textColor || '#374151' }}
                                >
                                    Body text appears in this color
                                </div>
                                <div
                                    className="text-xs"
                                    style={{ color: pdfOptions.mutedColor || '#6B7280' }}
                                >
                                    Secondary info in muted color
                                </div>
                                <div
                                    className="text-sm font-bold mt-3 pt-2 border-t"
                                    style={{
                                        color: pdfOptions.accentColor || '#8B5CF6',
                                        borderColor: (pdfOptions.accentColor || '#8B5CF6') + '30'
                                    }}
                                >
                                    Total: $1,234.00
                                </div>
                            </div>
                        </div>

                        <p className="text-xs text-gray-500">
                            Click "Preview PDF" to see how your quote will look with these colors.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

function ColorPicker({ label, value, onChange }) {
    return (
        <div>
            <label className="label">{label}</label>
            <div className="flex items-center gap-3">
                <input
                    type="color"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    className="w-12 h-10 rounded cursor-pointer bg-transparent border border-dark-border"
                />
                <input
                    type="text"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder="#000000"
                    className="input flex-1 font-mono text-sm"
                />
            </div>
        </div>
    );
}
