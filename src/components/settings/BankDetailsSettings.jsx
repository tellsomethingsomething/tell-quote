import { useSettingsStore, CURRENCIES } from '../../store/settingsStore';

export default function BankDetailsSettings({ onSave }) {
    const {
        settings,
        setBankDetails,
    } = useSettingsStore();

    const saveBankDetails = (data) => {
        setBankDetails(data);
        onSave?.();
    };

    return (
        <div className="max-w-2xl">
            <h3 className="text-xl font-bold text-gray-100 mb-6">Bank Details</h3>
            <p className="text-sm text-gray-500 mb-6">
                These details will appear on your invoices. Fill in the fields relevant to your country.
            </p>
            <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="label">Bank Name</label>
                        <input
                            type="text"
                            value={settings.bankDetails.bankName}
                            onChange={(e) => saveBankDetails({ bankName: e.target.value })}
                            className="input"
                            placeholder="e.g. Maybank, HSBC, Barclays"
                        />
                    </div>
                    <div>
                        <label className="label">Default Currency</label>
                        <select
                            value={settings.bankDetails.currency}
                            onChange={(e) => saveBankDetails({ currency: e.target.value })}
                            className="input"
                        >
                            {CURRENCIES.map(c => (
                                <option key={c.code} value={c.code}>{c.code} - {c.name}</option>
                            ))}
                        </select>
                    </div>
                </div>
                <div>
                    <label className="label">Bank Address</label>
                    <textarea
                        value={settings.bankDetails.bankAddress || ''}
                        onChange={(e) => saveBankDetails({ bankAddress: e.target.value })}
                        className="input resize-none"
                        rows={2}
                        placeholder="Bank branch address"
                    />
                </div>
                <div>
                    <label className="label">Account Name</label>
                    <input
                        type="text"
                        value={settings.bankDetails.accountName}
                        onChange={(e) => saveBankDetails({ accountName: e.target.value })}
                        className="input"
                        placeholder="Account holder name (as it appears on the account)"
                    />
                </div>

                <div className="border-t border-dark-border pt-4 mt-4">
                    <h4 className="text-sm font-semibold text-gray-300 mb-3">Account Numbers</h4>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="label">Account Number</label>
                            <input
                                type="text"
                                value={settings.bankDetails.accountNumber}
                                onChange={(e) => saveBankDetails({ accountNumber: e.target.value })}
                                className="input"
                                placeholder="1234567890"
                            />
                        </div>
                        <div>
                            <label className="label">Sort Code <span className="text-gray-500">(UK)</span></label>
                            <input
                                type="text"
                                value={settings.bankDetails.sortCode || ''}
                                onChange={(e) => saveBankDetails({ sortCode: e.target.value })}
                                className="input"
                                placeholder="12-34-56"
                            />
                        </div>
                        <div>
                            <label className="label">IBAN <span className="text-gray-500">(International)</span></label>
                            <input
                                type="text"
                                value={settings.bankDetails.iban || ''}
                                onChange={(e) => saveBankDetails({ iban: e.target.value })}
                                className="input"
                                placeholder="GB82 WEST 1234 5698 7654 32"
                            />
                        </div>
                        <div>
                            <label className="label">SWIFT/BIC Code</label>
                            <input
                                type="text"
                                value={settings.bankDetails.swiftCode}
                                onChange={(e) => saveBankDetails({ swiftCode: e.target.value })}
                                className="input"
                                placeholder="MBBEMYKL"
                            />
                        </div>
                        <div>
                            <label className="label">Routing Number <span className="text-gray-500">(US)</span></label>
                            <input
                                type="text"
                                value={settings.bankDetails.routingNumber || ''}
                                onChange={(e) => saveBankDetails({ routingNumber: e.target.value })}
                                className="input"
                                placeholder="123456789"
                            />
                        </div>
                        <div>
                            <label className="label">Branch Code</label>
                            <input
                                type="text"
                                value={settings.bankDetails.branchCode || ''}
                                onChange={(e) => saveBankDetails({ branchCode: e.target.value })}
                                className="input"
                                placeholder="Branch code"
                            />
                        </div>
                        <div>
                            <label className="label">BSB Number <span className="text-gray-500">(AU)</span></label>
                            <input
                                type="text"
                                value={settings.bankDetails.bsbNumber || ''}
                                onChange={(e) => saveBankDetails({ bsbNumber: e.target.value })}
                                className="input"
                                placeholder="123-456"
                            />
                        </div>
                    </div>
                </div>

                <div className="border-t border-dark-border pt-4 mt-4">
                    <label className="label">Additional Payment Instructions</label>
                    <textarea
                        value={settings.bankDetails.additionalInfo || ''}
                        onChange={(e) => saveBankDetails({ additionalInfo: e.target.value })}
                        className="input resize-none"
                        rows={3}
                        placeholder="Any additional payment instructions, reference requirements, or alternative payment methods..."
                    />
                </div>
            </div>
        </div>
    );
}
