import { useState, useEffect, useRef } from 'react';
import { useSettingsStore } from '../store/settingsStore';
import IntegrationsSettings from '../components/settings/IntegrationsSettings';
import InvoiceDesigner from '../components/invoiceDesigner/InvoiceDesigner';
import TeamManagement from '../components/settings/TeamManagement';
import PrivacySettings from '../components/settings/PrivacySettings';
import BillingSettings from '../components/settings/BillingSettings';
import AIUsageDashboard from '../components/settings/AIUsageDashboard';
import UsersManagement from '../components/settings/UsersManagement';
import CustomizationSettings from '../components/settings/CustomizationSettings';
import CompanySettings from '../components/settings/CompanySettings';
import TaxLegalSettings from '../components/settings/TaxLegalSettings';
import BankDetailsSettings from '../components/settings/BankDetailsSettings';
import QuoteDefaultsSettings from '../components/settings/QuoteDefaultsSettings';
import TermsConditionsSettings from '../components/settings/TermsConditionsSettings';
import PDFOptionsSettings from '../components/settings/PDFOptionsSettings';
import ActivityLogSettings from '../components/settings/ActivityLogSettings';

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
    const { settings, setAiSettings } = useSettingsStore();

    // Initialize tab from URL query param for deep linking (e.g., /settings?tab=billing)
    const getInitialTab = () => {
        const params = new URLSearchParams(window.location.search);
        const tabParam = params.get('tab');
        const validTabs = TABS.map(t => t.id);
        return tabParam && validTabs.includes(tabParam) ? tabParam : 'company';
    };

    const [activeTab, setActiveTabState] = useState(getInitialTab);
    const [showSaved, setShowSaved] = useState(false);
    const saveTimeoutRef = useRef(null);

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

    const saveAiSettings = (data) => {
        setAiSettings(data);
        triggerSaved();
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
                {activeTab === 'company' && <CompanySettings onSave={triggerSaved} />}
                {activeTab === 'tax' && <TaxLegalSettings onSave={triggerSaved} />}
                {activeTab === 'bank' && <BankDetailsSettings onSave={triggerSaved} />}
                {activeTab === 'users' && <UsersManagement />}
                {activeTab === 'team' && <TeamManagement />}
                {activeTab === 'billing' && (
                    <div className="max-w-4xl">
                        <h3 className="text-xl font-bold text-gray-100 mb-6">Billing & Subscription</h3>
                        <BillingSettings />
                    </div>
                )}
                {activeTab === 'integrations' && <IntegrationsSettings />}
                {activeTab === 'quote' && <QuoteDefaultsSettings onSave={triggerSaved} />}
                {activeTab === 'terms' && <TermsConditionsSettings onSave={triggerSaved} />}
                {activeTab === 'customize' && <CustomizationSettings onSave={triggerSaved} />}
                {activeTab === 'pdf' && <PDFOptionsSettings onSave={triggerSaved} />}
                {activeTab === 'invoice' && (
                    <div className="h-full -m-4 md:-m-6">
                        <InvoiceDesigner />
                    </div>
                )}
                {activeTab === 'ai' && (
                    <div className="max-w-4xl">
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
                {activeTab === 'activity' && <ActivityLogSettings />}
                {activeTab === 'privacy' && (
                    <div className="max-w-2xl">
                        <h3 className="text-xl font-bold text-gray-100 mb-6">Privacy & Data</h3>
                        <PrivacySettings />
                    </div>
                )}
            </div>
        </div>
    );
}
