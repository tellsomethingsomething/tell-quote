import { useSettingsStore, DEFAULT_TAX_RULES } from '../../store/settingsStore';

export default function TaxLegalSettings({ onSave }) {
    const {
        settings,
        setTaxInfo,
        setTaxConfig,
    } = useSettingsStore();

    const saveTaxInfo = (data) => {
        setTaxInfo(data);
        onSave?.();
    };

    return (
        <div className="max-w-3xl">
            <h3 className="text-xl font-bold text-gray-100 mb-6">Tax & Legal Information</h3>

            {/* Business Registration */}
            <div className="space-y-4 mb-8">
                <h4 className="text-sm font-semibold text-gray-300 border-b border-dark-border pb-2">Business Registration</h4>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="label">Tax Registration Number</label>
                        <input
                            type="text"
                            value={settings.taxInfo.taxNumber}
                            onChange={(e) => saveTaxInfo({ taxNumber: e.target.value })}
                            className="input"
                            placeholder="e.g. GST-123456789"
                        />
                    </div>
                    <div>
                        <label className="label">Business Registration Number</label>
                        <input
                            type="text"
                            value={settings.taxInfo.registrationNumber}
                            onChange={(e) => saveTaxInfo({ registrationNumber: e.target.value })}
                            className="input"
                            placeholder="e.g. 123456-A"
                        />
                    </div>
                </div>
                <div>
                    <label className="label">Licenses / Certifications</label>
                    <textarea
                        value={settings.taxInfo.licenses}
                        onChange={(e) => saveTaxInfo({ licenses: e.target.value })}
                        className="input resize-none"
                        rows={2}
                        placeholder="List any relevant licenses or certifications"
                    />
                </div>
            </div>

            {/* Tax Configuration for Invoicing */}
            <div className="space-y-4 mb-8">
                <h4 className="text-sm font-semibold text-gray-300 border-b border-dark-border pb-2">Tax Configuration</h4>
                <p className="text-xs text-gray-500">Configure how tax is calculated and displayed on invoices</p>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="label">Home Country</label>
                        <select
                            value={settings.taxConfig?.homeCountry || 'MY'}
                            onChange={(e) => setTaxConfig({ homeCountry: e.target.value })}
                            className="input"
                        >
                            {Object.entries(DEFAULT_TAX_RULES).map(([code, rule]) => (
                                <option key={code} value={code}>{rule.name}</option>
                            ))}
                        </select>
                    </div>
                    <div className="flex items-center pt-6">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={settings.taxConfig?.taxRegistered ?? true}
                                onChange={(e) => setTaxConfig({ taxRegistered: e.target.checked })}
                                className="w-4 h-4 rounded border-gray-600 bg-dark-bg text-accent-primary focus:ring-accent-primary"
                            />
                            <span className="text-sm text-gray-300">Registered for tax collection</span>
                        </label>
                    </div>
                </div>

                {settings.taxConfig?.taxRegistered && (
                    <>
                        <div className="grid grid-cols-3 gap-4">
                            <div>
                                <label className="label">Domestic Tax Name</label>
                                <input
                                    type="text"
                                    value={settings.taxConfig?.domesticTaxName || 'VAT'}
                                    onChange={(e) => setTaxConfig({ domesticTaxName: e.target.value })}
                                    className="input"
                                    placeholder="VAT, GST, SST, etc."
                                />
                            </div>
                            <div>
                                <label className="label">Domestic Tax Rate (%)</label>
                                <input
                                    type="number"
                                    value={settings.taxConfig?.domesticTaxRate || 0}
                                    onChange={(e) => setTaxConfig({ domesticTaxRate: parseFloat(e.target.value) || 0 })}
                                    className="input"
                                    min="0"
                                    max="100"
                                    step="0.1"
                                />
                            </div>
                            <div className="flex items-center pt-6">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={settings.taxConfig?.showTaxBreakdown ?? true}
                                        onChange={(e) => setTaxConfig({ showTaxBreakdown: e.target.checked })}
                                        className="w-4 h-4 rounded border-gray-600 bg-dark-bg text-accent-primary focus:ring-accent-primary"
                                    />
                                    <span className="text-sm text-gray-300">Show tax breakdown</span>
                                </label>
                            </div>
                        </div>

                        <div className="p-4 bg-dark-bg/50 rounded-lg border border-dark-border">
                            <h5 className="text-sm font-medium text-gray-300 mb-3">International Invoicing</h5>
                            <div className="space-y-3">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={settings.taxConfig?.applyTaxToInternational ?? false}
                                        onChange={(e) => setTaxConfig({ applyTaxToInternational: e.target.checked })}
                                        className="w-4 h-4 rounded border-gray-600 bg-dark-bg text-accent-primary focus:ring-accent-primary"
                                    />
                                    <span className="text-sm text-gray-300">Charge tax on international invoices</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={settings.taxConfig?.reverseChargeEnabled ?? true}
                                        onChange={(e) => setTaxConfig({ reverseChargeEnabled: e.target.checked })}
                                        className="w-4 h-4 rounded border-gray-600 bg-dark-bg text-accent-primary focus:ring-accent-primary"
                                    />
                                    <span className="text-sm text-gray-300">Enable reverse charge for EU B2B</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={settings.taxConfig?.requireClientTaxId ?? false}
                                        onChange={(e) => setTaxConfig({ requireClientTaxId: e.target.checked })}
                                        className="w-4 h-4 rounded border-gray-600 bg-dark-bg text-accent-primary focus:ring-accent-primary"
                                    />
                                    <span className="text-sm text-gray-300">Require client VAT/Tax ID for B2B invoices</span>
                                </label>
                            </div>
                        </div>
                    </>
                )}
            </div>

            {/* Invoice Wording */}
            <div className="space-y-4">
                <h4 className="text-sm font-semibold text-gray-300 border-b border-dark-border pb-2">Invoice Wording</h4>
                <p className="text-xs text-gray-500">Customize the text that appears on invoices for different tax scenarios</p>

                <div>
                    <label className="label">Reverse Charge Text</label>
                    <textarea
                        value={settings.taxConfig?.reverseChargeText || ''}
                        onChange={(e) => setTaxConfig({ reverseChargeText: e.target.value })}
                        className="input resize-none text-sm"
                        rows={2}
                        placeholder="Reverse charge: VAT to be accounted for by the recipient..."
                    />
                    <p className="text-xs text-gray-500 mt-1">Shown on B2B invoices to EU countries where reverse charge applies</p>
                </div>
                <div>
                    <label className="label">Export Services Text</label>
                    <textarea
                        value={settings.taxConfig?.exportServicesText || ''}
                        onChange={(e) => setTaxConfig({ exportServicesText: e.target.value })}
                        className="input resize-none text-sm"
                        rows={2}
                        placeholder="Export of services - zero rated for VAT purposes"
                    />
                    <p className="text-xs text-gray-500 mt-1">Shown on invoices to countries outside your tax jurisdiction</p>
                </div>
            </div>
        </div>
    );
}
