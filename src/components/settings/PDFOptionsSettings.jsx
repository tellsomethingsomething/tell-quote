import { useSettingsStore } from '../../store/settingsStore';

export default function PDFOptionsSettings({ onSave }) {
    const {
        settings,
        setPdfOptions,
    } = useSettingsStore();

    const savePdfOptions = (data) => {
        setPdfOptions(data);
        onSave?.();
    };

    return (
        <div className="max-w-2xl">
            <h3 className="text-xl font-bold text-gray-100 mb-6">PDF Display Options</h3>
            <p className="text-sm text-gray-500 mb-6">Choose what information to show on exported PDF quotes.</p>
            <div className="space-y-3">
                {[
                    { key: 'showLogo', label: 'Show Company Logo' },
                    { key: 'showCompanyAddress', label: 'Show Company Address' },
                    { key: 'showCompanyPhone', label: 'Show Company Phone' },
                    { key: 'showCompanyEmail', label: 'Show Company Email' },
                    { key: 'showTaxNumber', label: 'Show Tax Number' },
                    { key: 'showBankDetails', label: 'Show Bank Details' },
                ].map(({ key, label }) => (
                    <label key={key} className="flex items-center gap-3 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={settings.pdfOptions[key]}
                            onChange={(e) => savePdfOptions({ [key]: e.target.checked })}
                            className="w-5 h-5 rounded bg-dark-bg border-dark-border text-accent-primary focus:ring-accent-primary"
                        />
                        <span className="text-gray-300">{label}</span>
                    </label>
                ))}
            </div>
        </div>
    );
}
