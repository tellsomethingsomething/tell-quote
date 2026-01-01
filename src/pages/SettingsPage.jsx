import { useState, useEffect, useRef } from 'react';
import { useSettingsStore, CURRENCIES, DEFAULT_TAX_RULES } from '../store/settingsStore';
import { useAuthStore } from '../store/authStore';
import IntegrationsSettings from '../components/settings/IntegrationsSettings';
import InvoiceDesigner from '../components/invoiceDesigner/InvoiceDesigner';
import TeamManagement from '../components/settings/TeamManagement';
import PrivacySettings from '../components/settings/PrivacySettings';
import BillingSettings from '../components/settings/BillingSettings';
import AIUsageDashboard from '../components/settings/AIUsageDashboard';
import UsersManagement from '../components/settings/UsersManagement';
import { useSubscription } from '../hooks/useSubscription';
import { FEATURES } from '../services/subscriptionGuard';
import UpgradePrompt from '../components/billing/UpgradePrompt';

const TABS = [
    { id: 'company', label: 'Company' },
    { id: 'tax', label: 'Tax & Legal' },
    { id: 'bank', label: 'Bank Details' },
    { id: 'users', label: 'Users' },
    { id: 'team', label: 'Team' },
    { id: 'billing', label: 'Billing' },
    { id: 'integrations', label: 'Integrations' },
    { id: 'quote', label: 'Quote Defaults' },
    { id: 'terms', label: 'Terms & Conditions' },
    { id: 'customize', label: 'Customization' },
    { id: 'pdf', label: 'PDF Options' },
    { id: 'invoice', label: 'Quote Templates' },
    { id: 'ai', label: 'AI & Tokens' },
    { id: 'activity', label: 'Activity Log' },
    { id: 'privacy', label: 'Privacy & Data' },
];

export default function SettingsPage() {
    const {
        settings,
        setCompanyInfo,
        setTaxInfo,
        setTaxConfig,
        setBankDetails,
        setQuoteDefaults,
        setPdfOptions,
        setAiSettings,
        setDisplayCurrency,
        addUser,
        updateUser,
        deleteUser,
        addProjectType,
        updateProjectType,
        deleteProjectType,
        moveProjectType,
        addRegion,
        updateRegion,
        deleteRegion,
        moveRegion,
        setPreferredCurrencies,
        clearActivityLog,
        exportActivityLog,
    } = useSettingsStore();

    // Initialize tab from URL query param for deep linking (e.g., /settings?tab=billing)
    const getInitialTab = () => {
        const params = new URLSearchParams(window.location.search);
        const tabParam = params.get('tab');
        const validTabs = TABS.map(t => t.id);
        return tabParam && validTabs.includes(tabParam) ? tabParam : 'company';
    };

    const [activeTab, setActiveTabState] = useState(getInitialTab);

    // Update URL when tab changes (for deep linking support)
    const setActiveTab = (tab) => {
        setActiveTabState(tab);
        const url = new URL(window.location.href);
        if (tab === 'company') {
            url.searchParams.delete('tab');
        } else {
            url.searchParams.set('tab', tab);
        }
        window.history.replaceState(null, '', url.toString());
    };
    const [showAddUser, setShowAddUser] = useState(false);
    const [newUser, setNewUser] = useState({ name: '', email: '' });
    const [newProjectType, setNewProjectType] = useState('');
    const [newRegion, setNewRegion] = useState({ label: '', currency: 'USD' });
    const [expandedRegions, setExpandedRegions] = useState({});
    const [newCountry, setNewCountry] = useState({});
    const [showSaved, setShowSaved] = useState(false);
    const saveTimeoutRef = useRef(null);
    const [showBrandingUpgrade, setShowBrandingUpgrade] = useState(false);

    // Subscription hooks for feature gating
    const { canCreate, planId } = useSubscription();
    const canCustomBrand = canCreate?.(FEATURES.CUSTOM_BRANDING) ?? true;

    // Show saved indicator
    const triggerSaved = () => {
        setShowSaved(true);
        if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
        saveTimeoutRef.current = setTimeout(() => setShowSaved(false), 2000);
    };

    // Cleanup timeout on unmount
    useEffect(() => {
        return () => {
            if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
        };
    }, []);

    // Wrapped setters that show saved indicator
    const saveCompanyInfo = (data) => { setCompanyInfo(data); triggerSaved(); };
    const saveTaxInfo = (data) => { setTaxInfo(data); triggerSaved(); };
    const saveBankDetails = (data) => { setBankDetails(data); triggerSaved(); };
    const saveQuoteDefaults = (data) => { setQuoteDefaults(data); triggerSaved(); };
    const savePdfOptions = (data) => { setPdfOptions(data); triggerSaved(); };
    const saveAiSettings = (data) => { setAiSettings(data); triggerSaved(); };
    const saveUser = (id, data) => { updateUser(id, data); triggerSaved(); };

    const handleAddUser = () => {
        if (newUser.name.trim()) {
            addUser(newUser);
            setNewUser({ name: '', email: '' });
            setShowAddUser(false);
        }
    };

    return (
        <div className="h-[calc(100vh-60px)] flex flex-col md:flex-row">
            {/* Mobile Header with Dropdown */}
            <div className="md:hidden bg-dark-card border-b border-dark-border p-3">
                <div className="flex items-center justify-between mb-3">
                    <h2 className="text-lg font-bold text-gray-100">Settings</h2>
                    {showSaved && (
                        <span className="text-xs text-green-400 flex items-center gap-1">
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            Saved
                        </span>
                    )}
                </div>
                {/* Horizontal scrolling tabs on mobile */}
                <div className="flex gap-1 overflow-x-auto pb-2 -mx-3 px-3">
                    {TABS.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex-shrink-0 px-3 py-2 rounded-lg text-sm transition-colors min-h-[40px] ${activeTab === tab.id
                                    ? 'bg-accent-primary/20 text-accent-primary'
                                    : 'text-gray-400 hover:bg-white/5 hover:text-gray-200'
                                }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Desktop Sidebar */}
            <div className="hidden md:block w-48 bg-dark-card border-r border-dark-border p-4 flex-shrink-0">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-bold text-gray-100">Settings</h2>
                    {showSaved && (
                        <span className="text-xs text-green-400 flex items-center gap-1">
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            Saved
                        </span>
                    )}
                </div>

                <nav className="space-y-1">
                    {TABS.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors min-h-[44px] ${activeTab === tab.id
                                    ? 'bg-accent-primary/20 text-accent-primary'
                                    : 'text-gray-400 hover:bg-white/5 hover:text-gray-200'
                                }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </nav>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 md:p-6">
                {/* Company Tab */}
                {activeTab === 'company' && (
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
                                            triggerSaved();
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
                    </div>
                )}

                {/* Tax & Legal Tab */}
                {activeTab === 'tax' && (
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
                )}

                {/* Bank Details Tab */}
                {activeTab === 'bank' && (
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
                )}

                {/* Users Tab */}
                {activeTab === 'users' && (
                    <UsersManagement />
                )}

                {/* Integrations Tab */}
                {activeTab === 'integrations' && (
                    <IntegrationsSettings />
                )}

                {/* Quote Defaults Tab */}
                {activeTab === 'quote' && (
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
                )}

                {/* Terms & Conditions Tab */}
                {activeTab === 'terms' && (
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
                )}

                {/* Customization Tab */}
                {activeTab === 'customize' && (
                    <div className="max-w-2xl">
                        <h3 className="text-xl font-bold text-gray-100 mb-6">Customization</h3>

                        {/* Project Types */}
                        <div className="mb-8">
                            <h4 className="text-sm font-semibold text-gray-300 mb-4">Project Types</h4>
                            <div className="space-y-2 mb-4">
                                {(settings.projectTypes || []).map((type, index) => (
                                    <div key={type.id} className="flex items-center gap-2 p-2 bg-dark-bg/50 rounded group">
                                        <div className="flex flex-col gap-0.5">
                                            <button
                                                onClick={() => { moveProjectType(type.id, 'up'); triggerSaved(); }}
                                                disabled={index === 0}
                                                className="text-gray-600 hover:text-gray-300 disabled:opacity-30"
                                            >
                                                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                                                </svg>
                                            </button>
                                            <button
                                                onClick={() => { moveProjectType(type.id, 'down'); triggerSaved(); }}
                                                disabled={index === settings.projectTypes.length - 1}
                                                className="text-gray-600 hover:text-gray-300 disabled:opacity-30"
                                            >
                                                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                                </svg>
                                            </button>
                                        </div>
                                        <input
                                            type="text"
                                            value={type.label}
                                            onChange={(e) => { updateProjectType(type.id, e.target.value); triggerSaved(); }}
                                            className="flex-1 bg-transparent text-sm text-gray-300 focus:bg-dark-bg rounded px-2 py-1 border border-transparent focus:border-dark-border"
                                        />
                                        <button
                                            onClick={() => {
                                                if (confirm(`Delete "${type.label}"?`)) {
                                                    deleteProjectType(type.id);
                                                    triggerSaved();
                                                }
                                            }}
                                            className="p-1 text-gray-600 hover:text-red-400 opacity-0 group-hover:opacity-100"
                                        >
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                            </svg>
                                        </button>
                                    </div>
                                ))}
                            </div>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={newProjectType}
                                    onChange={(e) => setNewProjectType(e.target.value)}
                                    placeholder="New project type..."
                                    className="input flex-1"
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && newProjectType.trim()) {
                                            addProjectType(newProjectType.trim());
                                            setNewProjectType('');
                                            triggerSaved();
                                        }
                                    }}
                                />
                                <button
                                    onClick={() => {
                                        if (newProjectType.trim()) {
                                            addProjectType(newProjectType.trim());
                                            setNewProjectType('');
                                            triggerSaved();
                                        }
                                    }}
                                    className="btn-primary"
                                >
                                    Add
                                </button>
                            </div>
                        </div>

                        {/* Regions */}
                        <div>
                            <h4 className="text-sm font-semibold text-gray-300 mb-2">Regions</h4>
                            <p className="text-xs text-gray-500 mb-4">Define geographic regions with their currencies and countries for opportunities and quoting.</p>
                            <div className="space-y-3 mb-4">
                                {(settings.regions || []).map((region, index) => (
                                    <div key={region.id} className="bg-dark-bg/50 rounded-lg border border-dark-border overflow-hidden">
                                        {/* Region Header */}
                                        <div className="flex items-center gap-2 p-3">
                                            <div className="flex flex-col gap-0.5">
                                                <button
                                                    onClick={() => { moveRegion(region.id, 'up'); triggerSaved(); }}
                                                    disabled={index === 0}
                                                    className="text-gray-600 hover:text-gray-300 disabled:opacity-30"
                                                >
                                                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                                                    </svg>
                                                </button>
                                                <button
                                                    onClick={() => { moveRegion(region.id, 'down'); triggerSaved(); }}
                                                    disabled={index === settings.regions.length - 1}
                                                    className="text-gray-600 hover:text-gray-300 disabled:opacity-30"
                                                >
                                                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                                    </svg>
                                                </button>
                                            </div>
                                            <button
                                                onClick={() => setExpandedRegions(prev => ({ ...prev, [region.id]: !prev[region.id] }))}
                                                className="p-1 text-gray-500 hover:text-gray-300"
                                            >
                                                <svg className={`w-4 h-4 transform transition-transform ${expandedRegions[region.id] ? 'rotate-90' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                                </svg>
                                            </button>
                                            <input
                                                type="text"
                                                value={region.label}
                                                onChange={(e) => { updateRegion(region.id, { label: e.target.value }); triggerSaved(); }}
                                                className="flex-1 bg-transparent text-sm text-gray-300 focus:bg-dark-bg rounded px-2 py-1 border border-transparent focus:border-dark-border font-medium"
                                            />
                                            <select
                                                value={region.currency}
                                                onChange={(e) => { updateRegion(region.id, { currency: e.target.value }); triggerSaved(); }}
                                                className="input w-28 text-sm"
                                            >
                                                {CURRENCIES.map(c => (
                                                    <option key={c.code} value={c.code}>{c.code}</option>
                                                ))}
                                            </select>
                                            <span className="text-xs text-gray-500 w-20 text-right">
                                                {(region.countries || []).length} countries
                                            </span>
                                            <button
                                                onClick={() => {
                                                    if (confirm(`Delete "${region.label}"?`)) {
                                                        deleteRegion(region.id);
                                                        triggerSaved();
                                                    }
                                                }}
                                                className="p-1 text-gray-600 hover:text-red-400"
                                            >
                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                </svg>
                                            </button>
                                        </div>
                                        {/* Countries List (Expandable) */}
                                        {expandedRegions[region.id] && (
                                            <div className="border-t border-dark-border p-3 bg-dark-bg/30">
                                                <div className="flex flex-wrap gap-2 mb-3">
                                                    {(region.countries || []).map((country, cIdx) => (
                                                        <span key={cIdx} className="inline-flex items-center gap-1 px-2 py-1 bg-dark-card rounded text-xs text-gray-300">
                                                            {country}
                                                            <button
                                                                onClick={() => {
                                                                    const updated = region.countries.filter((_, i) => i !== cIdx);
                                                                    updateRegion(region.id, { countries: updated });
                                                                    triggerSaved();
                                                                }}
                                                                className="text-gray-500 hover:text-red-400"
                                                            >
                                                                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                                </svg>
                                                            </button>
                                                        </span>
                                                    ))}
                                                    {(region.countries || []).length === 0 && (
                                                        <span className="text-xs text-gray-500 italic">No countries added</span>
                                                    )}
                                                </div>
                                                <div className="flex gap-2">
                                                    <input
                                                        type="text"
                                                        value={newCountry[region.id] || ''}
                                                        onChange={(e) => setNewCountry(prev => ({ ...prev, [region.id]: e.target.value }))}
                                                        placeholder="Add country..."
                                                        className="input flex-1 text-sm"
                                                        onKeyDown={(e) => {
                                                            if (e.key === 'Enter' && newCountry[region.id]?.trim()) {
                                                                const updated = [...(region.countries || []), newCountry[region.id].trim()];
                                                                updateRegion(region.id, { countries: updated });
                                                                setNewCountry(prev => ({ ...prev, [region.id]: '' }));
                                                                triggerSaved();
                                                            }
                                                        }}
                                                    />
                                                    <button
                                                        onClick={() => {
                                                            if (newCountry[region.id]?.trim()) {
                                                                const updated = [...(region.countries || []), newCountry[region.id].trim()];
                                                                updateRegion(region.id, { countries: updated });
                                                                setNewCountry(prev => ({ ...prev, [region.id]: '' }));
                                                                triggerSaved();
                                                            }
                                                        }}
                                                        className="btn-secondary text-sm"
                                                    >
                                                        Add
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={newRegion.label}
                                    onChange={(e) => setNewRegion({ ...newRegion, label: e.target.value })}
                                    placeholder="New region name..."
                                    className="input flex-1"
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && newRegion.label.trim()) {
                                            addRegion(newRegion.label.trim(), newRegion.currency, []);
                                            setNewRegion({ label: '', currency: 'USD' });
                                            triggerSaved();
                                        }
                                    }}
                                />
                                <select
                                    value={newRegion.currency}
                                    onChange={(e) => setNewRegion({ ...newRegion, currency: e.target.value })}
                                    className="input w-28"
                                >
                                    {CURRENCIES.map(c => (
                                        <option key={c.code} value={c.code}>{c.code}</option>
                                    ))}
                                </select>
                                <button
                                    onClick={() => {
                                        if (newRegion.label.trim()) {
                                            addRegion(newRegion.label.trim(), newRegion.currency, []);
                                            setNewRegion({ label: '', currency: 'USD' });
                                            triggerSaved();
                                        }
                                    }}
                                    className="btn-primary"
                                >
                                    Add
                                </button>
                            </div>
                        </div>

                        {/* Preferred Currencies */}
                        <div className="mt-8">
                            <h4 className="text-sm font-semibold text-gray-300 mb-2">Preferred Currencies</h4>
                            <p className="text-xs text-gray-500 mb-4">
                                Select the currencies you commonly use. These will appear first in currency dropdowns throughout the app.
                                Exchange rates update automatically in real-time.
                            </p>
                            <div className="flex flex-wrap gap-2 mb-4">
                                {(settings.preferredCurrencies || []).map((code) => {
                                    const currency = CURRENCIES.find(c => c.code === code);
                                    return (
                                        <span key={code} className="inline-flex items-center gap-2 px-3 py-2 bg-accent-primary/10 border border-accent-primary/30 rounded-lg text-sm text-gray-200">
                                            <span className="font-medium">{code}</span>
                                            <span className="text-gray-400 text-xs">{currency?.name}</span>
                                            <button
                                                onClick={() => {
                                                    const updated = settings.preferredCurrencies.filter(c => c !== code);
                                                    setPreferredCurrencies(updated);
                                                    triggerSaved();
                                                }}
                                                className="text-gray-500 hover:text-red-400 ml-1"
                                            >
                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                </svg>
                                            </button>
                                        </span>
                                    );
                                })}
                                {(settings.preferredCurrencies || []).length === 0 && (
                                    <span className="text-xs text-gray-500 italic">No preferred currencies selected</span>
                                )}
                            </div>
                            <div className="flex gap-2">
                                <select
                                    value=""
                                    onChange={(e) => {
                                        if (e.target.value && !(settings.preferredCurrencies || []).includes(e.target.value)) {
                                            const updated = [...(settings.preferredCurrencies || []), e.target.value];
                                            setPreferredCurrencies(updated);
                                            triggerSaved();
                                        }
                                    }}
                                    className="input flex-1"
                                >
                                    <option value="">Add currency...</option>
                                    {CURRENCIES
                                        .filter(c => !(settings.preferredCurrencies || []).includes(c.code))
                                        .map(c => (
                                            <option key={c.code} value={c.code}>{c.code} - {c.name}</option>
                                        ))
                                    }
                                </select>
                            </div>
                            <p className="text-xs text-amber-400/70 mt-3">
                                Note: Exchange rates are locked when quotes, invoices, and POs are created to ensure prices never change.
                            </p>
                        </div>

                        {/* Company OKRs */}
                        <div className="mt-8">
                            <h4 className="text-sm font-semibold text-gray-300 mb-2">Company OKRs</h4>
                            <p className="text-xs text-gray-500 mb-4">
                                Define your company objectives to guide research priorities. These will be used to prioritize sports events and opportunities.
                            </p>
                            <div className="space-y-4">
                                {(settings.okrs || []).map((okr, index) => (
                                    <div key={okr.id} className="p-4 bg-dark-bg/50 rounded-lg border border-dark-border">
                                        <div className="flex items-center gap-2 mb-3">
                                            <span className="w-6 h-6 rounded-full bg-accent-primary/20 text-accent-primary text-xs font-bold flex items-center justify-center">
                                                {index + 1}
                                            </span>
                                            <span className="text-xs text-gray-500 uppercase tracking-wide">OKR {index + 1}</span>
                                        </div>
                                        <div className="space-y-3">
                                            <div>
                                                <label className="label text-xs">Objective</label>
                                                <input
                                                    type="text"
                                                    value={okr.objective}
                                                    onChange={(e) => {
                                                        useSettingsStore.getState().updateOkr(okr.id, { objective: e.target.value });
                                                        triggerSaved();
                                                    }}
                                                    className="input text-sm"
                                                    placeholder="e.g., Expand into GCC market"
                                                />
                                            </div>
                                            <div>
                                                <label className="label text-xs">Key Result</label>
                                                <textarea
                                                    value={okr.keyResult}
                                                    onChange={(e) => {
                                                        useSettingsStore.getState().updateOkr(okr.id, { keyResult: e.target.value });
                                                        triggerSaved();
                                                    }}
                                                    className="input text-sm resize-none"
                                                    rows={2}
                                                    placeholder="e.g., Win 3 major sports broadcast contracts by end of 2025"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* PDF Options Tab */}
                {activeTab === 'pdf' && (
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
                )}

                {/* Invoice Design Tab */}
                {activeTab === 'invoice' && (
                    <div className="h-full -m-4 md:-m-6">
                        <InvoiceDesigner />
                    </div>
                )}

                {/* AI Features Tab */}
                {activeTab === 'ai' && (
                    <div className="max-w-4xl">
                        {/* AI Usage Dashboard */}
                        <AIUsageDashboard />

                        {/* Legacy API Keys Section (for custom integrations) */}
                        <div className="mt-8 pt-8 border-t border-dark-border">
                            <h3 className="text-lg font-semibold text-gray-100 mb-2">Custom API Keys (Optional)</h3>
                            <p className="text-sm text-gray-500 mb-6">
                                Use your own API keys for unlimited access without token limits.
                            </p>

                            <div className="space-y-6 max-w-2xl">
                                <div className="p-4 bg-dark-bg rounded-lg border border-dark-border">
                                    <h4 className="text-sm font-semibold text-gray-300 mb-3">Anthropic API Key (Claude)</h4>
                                    <p className="text-xs text-gray-500 mb-3">
                                        For AI proposal text generation. Get your key from{' '}
                                        <a href="https://console.anthropic.com" target="_blank" rel="noopener noreferrer" className="text-accent-primary hover:underline">
                                            console.anthropic.com
                                        </a>
                                    </p>
                                    <input
                                        type="password"
                                        value={settings.aiSettings?.anthropicKey || ''}
                                        onChange={(e) => saveAiSettings({ anthropicKey: e.target.value })}
                                        className="input w-full font-mono text-sm"
                                        placeholder="sk-ant-api..."
                                    />
                                </div>

                                <div className="p-4 bg-dark-bg rounded-lg border border-dark-border">
                                    <h4 className="text-sm font-semibold text-gray-300 mb-3">OpenAI API Key (DALL-E)</h4>
                                    <p className="text-xs text-gray-500 mb-3">
                                        For AI cover page image generation. Get your key from{' '}
                                        <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className="text-accent-primary hover:underline">
                                            platform.openai.com
                                        </a>
                                    </p>
                                    <input
                                        type="password"
                                        value={settings.aiSettings?.openaiKey || ''}
                                        onChange={(e) => saveAiSettings({ openaiKey: e.target.value })}
                                        className="input w-full font-mono text-sm"
                                        placeholder="sk-..."
                                    />
                                </div>

                                <p className="text-xs text-gray-600">
                                    Your API keys are stored securely and encrypted. Using your own keys bypasses token limits.
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Activity Log Tab */}
                {activeTab === 'activity' && (
                    <div className="max-w-4xl">
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h3 className="text-xl font-bold text-gray-100 mb-2">Activity Log</h3>
                                <p className="text-sm text-gray-500">
                                    Track all changes made to quotes across your team.
                                </p>
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={exportActivityLog}
                                    className="btn-ghost text-sm flex items-center gap-2"
                                >
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                    </svg>
                                    Export CSV
                                </button>
                                <button
                                    onClick={() => {
                                        if (confirm('Are you sure you want to clear all activity logs?')) {
                                            clearActivityLog();
                                        }
                                    }}
                                    className="btn-ghost text-sm text-red-400 hover:text-red-300"
                                >
                                    Clear All
                                </button>
                            </div>
                        </div>

                        <div className="bg-dark-card border border-dark-border rounded-lg overflow-hidden">
                            {(!settings.activityLog || settings.activityLog.length === 0) ? (
                                <div className="p-8 text-center text-gray-500">
                                    <svg className="w-12 h-12 mx-auto mb-3 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <p className="text-sm">No activity recorded yet</p>
                                    <p className="text-xs text-gray-600 mt-1">Changes to quotes will appear here</p>
                                </div>
                            ) : (
                                <div className="divide-y divide-dark-border max-h-[600px] overflow-y-auto">
                                    {settings.activityLog.map((log) => {
                                        const date = new Date(log.timestamp);
                                        const actionColors = {
                                            lock: 'text-amber-400 bg-amber-500/10',
                                            unlock: 'text-green-400 bg-green-500/10',
                                            create: 'text-blue-400 bg-blue-500/10',
                                            update: 'text-gray-400 bg-gray-500/10',
                                            delete: 'text-red-400 bg-red-500/10',
                                            status_change: 'text-purple-400 bg-purple-500/10',
                                        };
                                        const colorClass = actionColors[log.action] || 'text-gray-400 bg-gray-500/10';

                                        return (
                                            <div key={log.id} className="p-4 hover:bg-dark-bg/30 transition-colors">
                                                <div className="flex items-start gap-3">
                                                    <div className={`px-2 py-1 rounded text-xs font-medium ${colorClass}`}>
                                                        {log.action?.replace('_', ' ').toUpperCase()}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm text-gray-200">
                                                            {log.description || `${log.action} on ${log.field || 'quote'}`}
                                                        </p>
                                                        <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                                                            {log.quoteNumber && (
                                                                <span className="font-mono text-accent-primary">#{log.quoteNumber}</span>
                                                            )}
                                                            <span>{log.userName || log.userId || 'System'}</span>
                                                            <span>{date.toLocaleDateString('en-GB', {
                                                                day: 'numeric',
                                                                month: 'short',
                                                                year: 'numeric',
                                                                hour: '2-digit',
                                                                minute: '2-digit'
                                                            })}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        <p className="text-xs text-gray-600 mt-4">
                            Activity log stores up to 1,000 entries. Older entries are automatically removed.
                        </p>
                    </div>
                )}

                {/* Team Tab */}
                {activeTab === 'team' && (
                    <TeamManagement />
                )}

                {/* Billing Tab */}
                {activeTab === 'billing' && (
                    <div className="max-w-4xl">
                        <h3 className="text-xl font-bold text-gray-100 mb-6">Billing & Subscription</h3>
                        <BillingSettings />
                    </div>
                )}

                {/* Privacy & Data Tab */}
                {activeTab === 'privacy' && (
                    <div className="max-w-2xl">
                        <h3 className="text-xl font-bold text-gray-100 mb-6">Privacy & Data</h3>
                        <PrivacySettings />
                    </div>
                )}
            </div>

            {/* Branding Upgrade Prompt */}
            <UpgradePrompt
                isOpen={showBrandingUpgrade}
                onClose={() => setShowBrandingUpgrade(false)}
                feature="custom_branding"
                currentPlan={planId || 'free'}
                message="Upgrade to add your company logo to quotes, proposals, and invoices for a professional branded experience."
                onUpgrade={(selectedPlan) => {
                    setShowBrandingUpgrade(false);
                    setActiveTab('billing');
                }}
            />
        </div>
    );
}
