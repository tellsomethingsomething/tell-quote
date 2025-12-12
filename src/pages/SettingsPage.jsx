import { useState, useEffect, useRef } from 'react';
import { useSettingsStore } from '../store/settingsStore';

const TABS = [
    { id: 'company', label: 'Company' },
    { id: 'tax', label: 'Tax & Legal' },
    { id: 'bank', label: 'Bank Details' },
    { id: 'users', label: 'Users' },
    { id: 'quote', label: 'Quote Defaults' },
    { id: 'terms', label: 'Terms & Conditions' },
    { id: 'customize', label: 'Customization' },
    { id: 'pdf', label: 'PDF Options' },
    { id: 'ai', label: 'AI Features' },
];

export default function SettingsPage({ onBack }) {
    const {
        settings,
        setCompanyInfo,
        setTaxInfo,
        setBankDetails,
        setQuoteDefaults,
        setPdfOptions,
        setAiSettings,
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
    } = useSettingsStore();

    const [activeTab, setActiveTab] = useState('company');
    const [showAddUser, setShowAddUser] = useState(false);
    const [newUser, setNewUser] = useState({ name: '', email: '' });
    const [newProjectType, setNewProjectType] = useState('');
    const [newRegion, setNewRegion] = useState({ label: '', currency: 'USD' });
    const [showSaved, setShowSaved] = useState(false);
    const saveTimeoutRef = useRef(null);

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
        <div className="h-[calc(100vh-60px)] flex">
            {/* Sidebar */}
            <div className="w-48 bg-dark-card border-r border-dark-border p-4">
                <button
                    onClick={onBack}
                    className="flex items-center gap-2 text-gray-400 hover:text-gray-200 text-sm mb-6"
                >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    Back
                </button>

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
                            className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${activeTab === tab.id
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
            <div className="flex-1 overflow-y-auto p-6">
                {/* Company Tab */}
                {activeTab === 'company' && (
                    <div className="max-w-2xl">
                        <h3 className="text-xl font-bold text-gray-100 mb-6">Company Information</h3>
                        <div className="space-y-4">
                            {/* Logo Upload */}
                            <div>
                                <label className="label">Company Logo</label>
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
                                        placeholder="+60 3 1234 5678"
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
                    </div>
                )}

                {/* Tax & Legal Tab */}
                {activeTab === 'tax' && (
                    <div className="max-w-2xl">
                        <h3 className="text-xl font-bold text-gray-100 mb-6">Tax & Legal Information</h3>
                        <div className="space-y-4">
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
                            <div>
                                <label className="label">Licenses / Certifications</label>
                                <textarea
                                    value={settings.taxInfo.licenses}
                                    onChange={(e) => saveTaxInfo({ licenses: e.target.value })}
                                    className="input resize-none"
                                    rows={3}
                                    placeholder="List any relevant licenses or certifications"
                                />
                            </div>
                        </div>
                    </div>
                )}

                {/* Bank Details Tab */}
                {activeTab === 'bank' && (
                    <div className="max-w-2xl">
                        <h3 className="text-xl font-bold text-gray-100 mb-6">Bank Details</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="label">Bank Name</label>
                                <input
                                    type="text"
                                    value={settings.bankDetails.bankName}
                                    onChange={(e) => saveBankDetails({ bankName: e.target.value })}
                                    className="input"
                                    placeholder="e.g. Maybank"
                                />
                            </div>
                            <div>
                                <label className="label">Account Name</label>
                                <input
                                    type="text"
                                    value={settings.bankDetails.accountName}
                                    onChange={(e) => saveBankDetails({ accountName: e.target.value })}
                                    className="input"
                                    placeholder="Account holder name"
                                />
                            </div>
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
                                    <label className="label">SWIFT Code</label>
                                    <input
                                        type="text"
                                        value={settings.bankDetails.swiftCode}
                                        onChange={(e) => saveBankDetails({ swiftCode: e.target.value })}
                                        className="input"
                                        placeholder="MBBEMYKL"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Users Tab */}
                {activeTab === 'users' && (
                    <div className="max-w-2xl">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xl font-bold text-gray-100">Team Members</h3>
                            <button onClick={() => setShowAddUser(true)} className="btn-primary text-sm">
                                + Add User
                            </button>
                        </div>

                        {/* Add User Form */}
                        {showAddUser && (
                            <div className="card mb-4">
                                <h4 className="text-sm font-medium text-gray-300 mb-3">New Team Member</h4>
                                <div className="grid grid-cols-2 gap-4 mb-4">
                                    <input
                                        type="text"
                                        value={newUser.name}
                                        onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                                        className="input"
                                        placeholder="Name"
                                        autoFocus
                                    />
                                    <input
                                        type="email"
                                        value={newUser.email}
                                        onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                                        className="input"
                                        placeholder="Email"
                                    />
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={handleAddUser} className="btn-primary text-sm">Add</button>
                                    <button onClick={() => setShowAddUser(false)} className="btn-ghost text-sm">Cancel</button>
                                </div>
                            </div>
                        )}

                        {/* Users List */}
                        <div className="space-y-2">
                            {settings.users.map(user => (
                                <div key={user.id} className="card flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-accent-primary to-accent-secondary flex items-center justify-center">
                                            <span className="text-white font-bold text-sm">
                                                {user.name.substring(0, 2).toUpperCase()}
                                            </span>
                                        </div>
                                        <div>
                                            <input
                                                type="text"
                                                value={user.name}
                                                onChange={(e) => saveUser(user.id, { name: e.target.value })}
                                                className="bg-transparent text-gray-200 font-medium focus:bg-dark-bg rounded px-1 -ml-1"
                                            />
                                            <input
                                                type="email"
                                                value={user.email}
                                                onChange={(e) => saveUser(user.id, { email: e.target.value })}
                                                className="bg-transparent text-xs text-gray-500 block focus:bg-dark-bg rounded px-1 -ml-1 mt-1"
                                                placeholder="email@company.com"
                                            />
                                        </div>
                                    </div>
                                    {settings.users.length > 1 && (
                                        <button
                                            onClick={() => {
                                                if (confirm('Delete this user?')) deleteUser(user.id);
                                            }}
                                            className="p-2 text-gray-600 hover:text-red-400"
                                        >
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                            </svg>
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Quote Defaults Tab */}
                {activeTab === 'quote' && (
                    <div className="max-w-2xl">
                        <h3 className="text-xl font-bold text-gray-100 mb-6">Quote Defaults</h3>
                        <div className="space-y-4">
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
                            <h4 className="text-sm font-semibold text-gray-300 mb-4">Regions</h4>
                            <div className="space-y-2 mb-4">
                                {(settings.regions || []).map((region, index) => (
                                    <div key={region.id} className="flex items-center gap-2 p-2 bg-dark-bg/50 rounded group">
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
                                        <input
                                            type="text"
                                            value={region.label}
                                            onChange={(e) => { updateRegion(region.id, { label: e.target.value }); triggerSaved(); }}
                                            className="flex-1 bg-transparent text-sm text-gray-300 focus:bg-dark-bg rounded px-2 py-1 border border-transparent focus:border-dark-border"
                                        />
                                        <select
                                            value={region.currency}
                                            onChange={(e) => { updateRegion(region.id, { currency: e.target.value }); triggerSaved(); }}
                                            className="input w-24 text-sm"
                                        >
                                            <option value="USD">USD</option>
                                            <option value="MYR">MYR</option>
                                            <option value="SGD">SGD</option>
                                            <option value="GBP">GBP</option>
                                            <option value="AED">AED</option>
                                            <option value="SAR">SAR</option>
                                            <option value="QAR">QAR</option>
                                            <option value="KWD">KWD</option>
                                            <option value="THB">THB</option>
                                            <option value="IDR">IDR</option>
                                        </select>
                                        <button
                                            onClick={() => {
                                                if (confirm(`Delete "${region.label}"?`)) {
                                                    deleteRegion(region.id);
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
                                    value={newRegion.label}
                                    onChange={(e) => setNewRegion({ ...newRegion, label: e.target.value })}
                                    placeholder="New region name..."
                                    className="input flex-1"
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && newRegion.label.trim()) {
                                            addRegion(newRegion.label.trim(), newRegion.currency);
                                            setNewRegion({ label: '', currency: 'USD' });
                                            triggerSaved();
                                        }
                                    }}
                                />
                                <select
                                    value={newRegion.currency}
                                    onChange={(e) => setNewRegion({ ...newRegion, currency: e.target.value })}
                                    className="input w-24"
                                >
                                    <option value="USD">USD</option>
                                    <option value="MYR">MYR</option>
                                    <option value="SGD">SGD</option>
                                    <option value="GBP">GBP</option>
                                    <option value="AED">AED</option>
                                </select>
                                <button
                                    onClick={() => {
                                        if (newRegion.label.trim()) {
                                            addRegion(newRegion.label.trim(), newRegion.currency);
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

                {/* AI Features Tab */}
                {activeTab === 'ai' && (
                    <div className="max-w-2xl">
                        <h3 className="text-xl font-bold text-gray-100 mb-2">AI Features</h3>
                        <p className="text-sm text-gray-500 mb-6">
                            Enable AI-powered features like proposal generation and cover page images.
                        </p>

                        <div className="space-y-6">
                            <div className="p-4 bg-dark-bg rounded-lg border border-dark-border">
                                <h4 className="text-sm font-semibold text-gray-300 mb-3">Anthropic API Key</h4>
                                <p className="text-xs text-gray-500 mb-3">
                                    Required for AI proposal generation. Get your API key from{' '}
                                    <a href="https://console.anthropic.com" target="_blank" rel="noopener noreferrer" className="text-accent-primary hover:underline">
                                        console.anthropic.com
                                    </a>
                                </p>
                                <input
                                    type="password"
                                    value={settings.aiSettings?.apiKey || ''}
                                    onChange={(e) => saveAiSettings({ apiKey: e.target.value })}
                                    className="input w-full font-mono text-sm"
                                    placeholder="sk-ant-api..."
                                />
                            </div>

                            <div className="p-4 bg-accent-primary/10 border border-accent-primary/20 rounded-lg">
                                <h4 className="text-sm font-semibold text-accent-primary mb-2">AI Features Available</h4>
                                <ul className="text-sm text-gray-400 space-y-1">
                                    <li>• Generate professional proposals from quote data</li>
                                    <li>• AI-powered cover page background images (coming soon)</li>
                                    <li>• Smart line item suggestions (coming soon)</li>
                                </ul>
                            </div>

                            <p className="text-xs text-gray-600">
                                Your API key is stored locally and never sent to our servers.
                                AI requests are made directly from your browser to Anthropic's API.
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
