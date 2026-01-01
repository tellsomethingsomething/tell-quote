import { useSettingsStore } from '../../store/settingsStore';

export default function QuoteDefaultsSettings({ onSave }) {
    const {
        settings,
        setQuoteDefaults,
    } = useSettingsStore();

    const saveQuoteDefaults = (data) => {
        setQuoteDefaults(data);
        onSave?.();
    };

    return (
        <div className="max-w-2xl">
            <h3 className="text-xl font-bold text-gray-100 mb-6">Quote Defaults</h3>
            <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="label">Quote Number Prefix</label>
                        <input
                            type="text"
                            value={settings.quoteDefaults?.quotePrefix || 'QT'}
                            onChange={(e) => saveQuoteDefaults({ quotePrefix: e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 5) })}
                            className="input w-32"
                            placeholder="QT"
                            maxLength={5}
                        />
                        <p className="text-xs text-gray-500 mt-1">e.g., QT-2025-1234</p>
                    </div>
                    <div>
                        <label className="label">Invoice Number Prefix</label>
                        <input
                            type="text"
                            value={settings.quoteDefaults?.invoicePrefix || 'INV'}
                            onChange={(e) => saveQuoteDefaults({ invoicePrefix: e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 5) })}
                            className="input w-32"
                            placeholder="INV"
                            maxLength={5}
                        />
                        <p className="text-xs text-gray-500 mt-1">e.g., INV-2025-1234</p>
                    </div>
                </div>
                <div>
                    <label className="label">Default Validity (Days)</label>
                    <input
                        type="number"
                        value={settings.quoteDefaults.validityDays}
                        onChange={(e) => saveQuoteDefaults({ validityDays: parseInt(e.target.value) || 30 })}
                        className="input w-32"
                        min="1"
                        max="365"
                    />
                </div>
                <div>
                    <label className="label">Payment Terms</label>
                    <input
                        type="text"
                        value={settings.quoteDefaults.paymentTerms}
                        onChange={(e) => saveQuoteDefaults({ paymentTerms: e.target.value })}
                        className="input"
                        placeholder="e.g. 50% deposit on confirmation"
                    />
                </div>
            </div>
        </div>
    );
}
