import { useState } from 'react';
import { useSettingsStore, CURRENCIES } from '../../store/settingsStore';
import { useSubscription } from '../../hooks/useSubscription';
import { FEATURES } from '../../services/subscriptionGuard';
import UpgradePrompt from '../billing/UpgradePrompt';

export default function CompanySettings({ onSave }) {
    const {
        settings,
        setCompanyInfo,
        setDisplayCurrency,
    } = useSettingsStore();

    const [showBrandingUpgrade, setShowBrandingUpgrade] = useState(false);

    // Subscription hooks for feature gating
    const { canCreate, planId } = useSubscription();
    const canCustomBrand = canCreate?.(FEATURES.CUSTOM_BRANDING) ?? true;

    const saveCompanyInfo = (data) => {
        setCompanyInfo(data);
        onSave?.();
    };

    return (
        <div className="max-w-2xl">
            <h3 className="text-xl font-bold text-gray-100 mb-6">Company Information</h3>
            <div className="space-y-4">
                {/* Logo Upload - Requires paid plan */}
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <label className="label mb-0">Company Logo</label>
                        {!canCustomBrand && (
                            <span className="text-xs bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded-full">
                                Paid Feature
                            </span>
                        )}
                    </div>
                    {canCustomBrand ? (
                        <>
                            <div className="flex items-center gap-4">
                                <div className="w-32 h-16 bg-dark-card border border-dark-border rounded-lg flex items-center justify-center overflow-hidden">
                                    {settings.company.logo ? (
                                        <img
                                            src={settings.company.logo}
                                            alt="Company logo"
                                            className="max-w-full max-h-full object-contain"
                                        />
                                    ) : (
                                        <span className="text-gray-500 text-xs">No logo</span>
                                    )}
                                </div>
                                <div className="flex flex-col gap-2">
                                    <label className="btn-secondary text-sm cursor-pointer">
                                        Upload Logo
                                        <input
                                            type="file"
                                            accept="image/*"
                                            className="hidden"
                                            onChange={(e) => {
                                                const file = e.target.files?.[0];
                                                if (file) {
                                                    const reader = new FileReader();
                                                    reader.onload = (event) => {
                                                        saveCompanyInfo({ logo: event.target.result });
                                                    };
                                                    reader.readAsDataURL(file);
                                                }
                                            }}
                                        />
                                    </label>
                                    {settings.company.logo && (
                                        <button
                                            onClick={() => saveCompanyInfo({ logo: null })}
                                            className="text-xs text-red-400 hover:text-red-300"
                                        >
                                            Remove
                                        </button>
                                    )}
                                </div>
                            </div>
                            <p className="text-xs text-gray-500 mt-1">Recommended: PNG or SVG, max 200x100px</p>
                        </>
                    ) : (
                        <div className="bg-dark-bg/50 border border-dark-border rounded-lg p-4">
                            <div className="flex items-start gap-4">
                                <div className="w-32 h-16 bg-dark-card border border-dashed border-gray-600 rounded-lg flex items-center justify-center">
                                    <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                </div>
                                <div className="flex-1">
                                    <p className="text-sm text-gray-300 mb-2">
                                        Add your company logo to quotes, proposals, and invoices.
                                    </p>
                                    <button
                                        onClick={() => setShowBrandingUpgrade(true)}
                                        className="text-sm text-brand-primary hover:text-brand-primary/80 font-medium"
                                    >
                                        Upgrade to unlock custom branding →
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
                <div>
                    <label className="label">Company Name</label>
                    <input
                        type="text"
                        value={settings.company.name}
                        onChange={(e) => saveCompanyInfo({ name: e.target.value })}
                        className="input"
                        placeholder="Your Company Name"
                    />
                </div>
                <div>
                    <label className="label">Address</label>
                    <textarea
                        value={settings.company.address}
                        onChange={(e) => saveCompanyInfo({ address: e.target.value })}
                        className="input resize-none"
                        rows={2}
                        placeholder="Street address"
                    />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="label">City</label>
                        <input
                            type="text"
                            value={settings.company.city}
                            onChange={(e) => saveCompanyInfo({ city: e.target.value })}
                            className="input"
                            placeholder="City"
                        />
                    </div>
                    <div>
                        <label className="label">Country</label>
                        <input
                            type="text"
                            value={settings.company.country}
                            onChange={(e) => saveCompanyInfo({ country: e.target.value })}
                            className="input"
                            placeholder="Country"
                        />
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="label">Phone</label>
                        <input
                            type="tel"
                            value={settings.company.phone}
                            onChange={(e) => saveCompanyInfo({ phone: e.target.value })}
                            className="input"
                            placeholder="+1 555 123 4567"
                        />
                    </div>
                    <div>
                        <label className="label">Email</label>
                        <input
                            type="email"
                            value={settings.company.email}
                            onChange={(e) => saveCompanyInfo({ email: e.target.value })}
                            className="input"
                            placeholder="info@company.com"
                        />
                    </div>
                </div>
                <div>
                    <label className="label">Website</label>
                    <input
                        type="url"
                        value={settings.company.website}
                        onChange={(e) => saveCompanyInfo({ website: e.target.value })}
                        className="input"
                        placeholder="https://www.company.com"
                    />
                </div>
            </div>

            {/* Display Preferences */}
            <div className="mt-8 pt-6 border-t border-dark-border">
                <h4 className="text-lg font-semibold text-gray-200 mb-4">Display Preferences</h4>
                <div className="space-y-4">
                    <div>
                        <label className="label">Display Currency</label>
                        <p className="text-xs text-gray-500 mb-2">
                            All amounts across the app will be converted and displayed in this currency.
                        </p>
                        <select
                            value={settings.displayCurrency || 'USD'}
                            onChange={(e) => {
                                setDisplayCurrency(e.target.value);
                                onSave?.();
                            }}
                            className="input w-48"
                        >
                            {/* Preferred currencies first */}
                            <optgroup label="Preferred">
                                {(settings.preferredCurrencies || ['USD', 'EUR', 'GBP']).map(code => {
                                    const curr = CURRENCIES.find(c => c.code === code);
                                    return curr ? (
                                        <option key={code} value={code}>{curr.code} - {curr.name}</option>
                                    ) : null;
                                })}
                            </optgroup>
                            {/* All currencies */}
                            <optgroup label="All Currencies">
                                {CURRENCIES.filter(c => !(settings.preferredCurrencies || []).includes(c.code)).map(c => (
                                    <option key={c.code} value={c.code}>{c.code} - {c.name}</option>
                                ))}
                            </optgroup>
                        </select>
                    </div>
                </div>
            </div>

            {/* Branding Upgrade Prompt */}
            <UpgradePrompt
                isOpen={showBrandingUpgrade}
                onClose={() => setShowBrandingUpgrade(false)}
                feature="custom_branding"
                currentPlan={planId || 'free'}
                message="Upgrade to add your company logo to quotes, proposals, and invoices for a professional branded experience."
                onUpgrade={() => {
                    setShowBrandingUpgrade(false);
                }}
            />
        </div>
    );
}
