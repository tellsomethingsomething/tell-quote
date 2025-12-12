import { useState } from 'react';
import { useSettingsStore } from '../store/settingsStore';

const TABS = [
    { id: 'company', label: 'Company' },
    { id: 'tax', label: 'Tax & Legal' },
    { id: 'bank', label: 'Bank Details' },
    { id: 'users', label: 'Users' },
    { id: 'quote', label: 'Quote Defaults' },
    { id: 'pdf', label: 'PDF Options' },
];

export default function SettingsPage({ onBack }) {
    const {
        settings,
        setCompanyInfo,
        setTaxInfo,
        setBankDetails,
        setQuoteDefaults,
        setPdfOptions,
        addUser,
        updateUser,
        deleteUser,
    } = useSettingsStore();

    const [activeTab, setActiveTab] = useState('company');
    const [showAddUser, setShowAddUser] = useState(false);
    const [newUser, setNewUser] = useState({ name: '', email: '' });

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

                <h2 className="text-lg font-bold text-gray-100 mb-4">Settings</h2>

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
                                                            setCompanyInfo({ logo: event.target.result });
                                                        };
                                                        reader.readAsDataURL(file);
                                                    }
                                                }}
                                            />
                                        </label>
                                        {settings.company.logo && (
                                            <button
                                                onClick={() => setCompanyInfo({ logo: null })}
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
                                    onChange={(e) => setCompanyInfo({ name: e.target.value })}
                                    className="input"
                                    placeholder="Your Company Name"
                                />
                            </div>
                            <div>
                                <label className="label">Address</label>
                                <textarea
                                    value={settings.company.address}
                                    onChange={(e) => setCompanyInfo({ address: e.target.value })}
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
                                        onChange={(e) => setCompanyInfo({ city: e.target.value })}
                                        className="input"
                                        placeholder="City"
                                    />
                                </div>
                                <div>
                                    <label className="label">Country</label>
                                    <input
                                        type="text"
                                        value={settings.company.country}
                                        onChange={(e) => setCompanyInfo({ country: e.target.value })}
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
                                        onChange={(e) => setCompanyInfo({ phone: e.target.value })}
                                        className="input"
                                        placeholder="+60 3 1234 5678"
                                    />
                                </div>
                                <div>
                                    <label className="label">Email</label>
                                    <input
                                        type="email"
                                        value={settings.company.email}
                                        onChange={(e) => setCompanyInfo({ email: e.target.value })}
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
                                    onChange={(e) => setCompanyInfo({ website: e.target.value })}
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
                                    onChange={(e) => setTaxInfo({ taxNumber: e.target.value })}
                                    className="input"
                                    placeholder="e.g. GST-123456789"
                                />
                            </div>
                            <div>
                                <label className="label">Business Registration Number</label>
                                <input
                                    type="text"
                                    value={settings.taxInfo.registrationNumber}
                                    onChange={(e) => setTaxInfo({ registrationNumber: e.target.value })}
                                    className="input"
                                    placeholder="e.g. 123456-A"
                                />
                            </div>
                            <div>
                                <label className="label">Licenses / Certifications</label>
                                <textarea
                                    value={settings.taxInfo.licenses}
                                    onChange={(e) => setTaxInfo({ licenses: e.target.value })}
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
                                    onChange={(e) => setBankDetails({ bankName: e.target.value })}
                                    className="input"
                                    placeholder="e.g. Maybank"
                                />
                            </div>
                            <div>
                                <label className="label">Account Name</label>
                                <input
                                    type="text"
                                    value={settings.bankDetails.accountName}
                                    onChange={(e) => setBankDetails({ accountName: e.target.value })}
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
                                        onChange={(e) => setBankDetails({ accountNumber: e.target.value })}
                                        className="input"
                                        placeholder="1234567890"
                                    />
                                </div>
                                <div>
                                    <label className="label">SWIFT Code</label>
                                    <input
                                        type="text"
                                        value={settings.bankDetails.swiftCode}
                                        onChange={(e) => setBankDetails({ swiftCode: e.target.value })}
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
                                                onChange={(e) => updateUser(user.id, { name: e.target.value })}
                                                className="bg-transparent text-gray-200 font-medium focus:bg-dark-bg rounded px-1 -ml-1"
                                            />
                                            <input
                                                type="email"
                                                value={user.email}
                                                onChange={(e) => updateUser(user.id, { email: e.target.value })}
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
                                    onChange={(e) => setQuoteDefaults({ validityDays: parseInt(e.target.value) || 30 })}
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
                                    onChange={(e) => setQuoteDefaults({ paymentTerms: e.target.value })}
                                    className="input"
                                    placeholder="e.g. 50% deposit on confirmation"
                                />
                            </div>
                            <div>
                                <label className="label">Terms & Conditions</label>
                                <textarea
                                    value={settings.quoteDefaults.termsAndConditions}
                                    onChange={(e) => setQuoteDefaults({ termsAndConditions: e.target.value })}
                                    className="input resize-none font-mono text-sm"
                                    rows={8}
                                />
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
                                        onChange={(e) => setPdfOptions({ [key]: e.target.checked })}
                                        className="w-5 h-5 rounded bg-dark-bg border-dark-border text-accent-primary focus:ring-accent-primary"
                                    />
                                    <span className="text-gray-300">{label}</span>
                                </label>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
