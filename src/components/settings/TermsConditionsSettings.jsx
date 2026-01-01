import { useSettingsStore } from '../../store/settingsStore';

export default function TermsConditionsSettings({ onSave }) {
    const {
        settings,
        setQuoteDefaults,
    } = useSettingsStore();

    const saveQuoteDefaults = (data) => {
        setQuoteDefaults(data);
        onSave?.();
    };

    return (
        <div className="max-w-4xl">
            <h3 className="text-xl font-bold text-gray-100 mb-2">Terms & Conditions</h3>
            <p className="text-sm text-gray-500 mb-6">
                These terms will appear on a separate page in your PDF quotes. Use clear, concise language.
            </p>

            <div className="space-y-4">
                <div>
                    <label className="label">Full Terms & Conditions</label>
                    <textarea
                        value={settings.quoteDefaults.termsAndConditions}
                        onChange={(e) => saveQuoteDefaults({ termsAndConditions: e.target.value })}
                        className="input resize-none font-mono text-xs leading-relaxed"
                        rows={20}
                        placeholder="Enter your full terms and conditions here. These will be formatted into columns on the PDF."
                    />
                    <p className="text-xs text-gray-500 mt-2">
                        Tip: Use numbered sections (1. 2. 3.) or bullet points for clarity. The PDF will display these in a multi-column layout.
                    </p>
                </div>

                <div className="p-4 bg-dark-bg/50 rounded-lg">
                    <p className="text-sm text-gray-400">
                        When exporting a PDF, you'll have the option to include the Terms & Conditions as a second page.
                    </p>
                </div>
            </div>
        </div>
    );
}
