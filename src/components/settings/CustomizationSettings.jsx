import { useState } from 'react';
import { useSettingsStore, CURRENCIES } from '../../store/settingsStore';

export default function CustomizationSettings({ onSave }) {
    const {
        settings,
        addProjectType,
        updateProjectType,
        deleteProjectType,
        moveProjectType,
        addRegion,
        updateRegion,
        deleteRegion,
        moveRegion,
        setPreferredCurrencies,
    } = useSettingsStore();

    const [newProjectType, setNewProjectType] = useState('');
    const [newRegion, setNewRegion] = useState({ label: '', currency: 'USD' });
    const [expandedRegions, setExpandedRegions] = useState({});
    const [newCountry, setNewCountry] = useState({});

    const triggerSaved = () => {
        onSave?.();
    };

    return (
        <div className="max-w-2xl space-y-8">
            <div>
                <h3 className="text-xl font-bold text-gray-100 mb-2">Customization</h3>
                <p className="text-sm text-gray-500">Configure project types, regions, and currency preferences for your organization.</p>
            </div>

            {/* Project Types */}
            <div className="card">
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-lg bg-violet-500/20 flex items-center justify-center">
                        <svg className="w-5 h-5 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A2 2 0 013 12V7a4 4 0 014-4z" />
                        </svg>
                    </div>
                    <div>
                        <h4 className="text-sm font-semibold text-gray-200">Project Types</h4>
                        <p className="text-xs text-gray-500">Categories for organizing your projects and quotes</p>
                    </div>
                </div>

                <div className="space-y-2 mb-4">
                    {(settings.projectTypes || []).map((type, index) => (
                        <div
                            key={type.id}
                            className="flex items-center gap-3 p-3 bg-dark-bg rounded-lg border border-dark-border hover:border-gray-700 transition-colors group"
                        >
                            {/* Drag Handle */}
                            <div className="flex flex-col gap-0.5 cursor-grab active:cursor-grabbing">
                                <button
                                    onClick={() => { moveProjectType(type.id, 'up'); triggerSaved(); }}
                                    disabled={index === 0}
                                    className="p-1 text-gray-600 hover:text-gray-300 hover:bg-white/5 rounded disabled:opacity-30 disabled:cursor-not-allowed"
                                    title="Move up"
                                >
                                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                                    </svg>
                                </button>
                                <button
                                    onClick={() => { moveProjectType(type.id, 'down'); triggerSaved(); }}
                                    disabled={index === settings.projectTypes.length - 1}
                                    className="p-1 text-gray-600 hover:text-gray-300 hover:bg-white/5 rounded disabled:opacity-30 disabled:cursor-not-allowed"
                                    title="Move down"
                                >
                                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                </button>
                            </div>

                            {/* Type Badge */}
                            <div className="w-2 h-2 rounded-full bg-violet-500/50"></div>

                            {/* Editable Name */}
                            <input
                                type="text"
                                value={type.label}
                                onChange={(e) => { updateProjectType(type.id, e.target.value); triggerSaved(); }}
                                className="flex-1 bg-transparent text-sm text-gray-200 focus:bg-dark-card rounded px-2 py-1.5 border border-transparent focus:border-violet-500/30 focus:outline-none font-medium"
                            />

                            {/* Delete Button */}
                            <button
                                onClick={() => {
                                    if (confirm(`Delete "${type.label}"?`)) {
                                        deleteProjectType(type.id);
                                        triggerSaved();
                                    }
                                }}
                                className="p-2 text-gray-600 hover:text-red-400 hover:bg-red-500/10 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                                title="Delete"
                            >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                            </button>
                        </div>
                    ))}

                    {(settings.projectTypes || []).length === 0 && (
                        <div className="text-center py-6 text-gray-500 text-sm">
                            No project types defined. Add your first one below.
                        </div>
                    )}
                </div>

                {/* Add New */}
                <div className="flex gap-2 pt-3 border-t border-dark-border">
                    <input
                        type="text"
                        value={newProjectType}
                        onChange={(e) => setNewProjectType(e.target.value)}
                        placeholder="Add new project type..."
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
                        disabled={!newProjectType.trim()}
                        className="btn-primary disabled:opacity-50"
                    >
                        <svg className="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Add
                    </button>
                </div>
            </div>

            {/* Regions */}
            <div className="card">
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-lg bg-cyan-500/20 flex items-center justify-center">
                        <svg className="w-5 h-5 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <div>
                        <h4 className="text-sm font-semibold text-gray-200">Regions</h4>
                        <p className="text-xs text-gray-500">Geographic regions with currencies for opportunities and rate cards</p>
                    </div>
                </div>

                <div className="space-y-3 mb-4">
                    {(settings.regions || []).map((region, index) => (
                        <div key={region.id} className="bg-dark-bg rounded-lg border border-dark-border overflow-hidden hover:border-gray-700 transition-colors">
                            {/* Region Header */}
                            <div className="flex items-center gap-3 p-3">
                                {/* Reorder Controls */}
                                <div className="flex flex-col gap-0.5">
                                    <button
                                        onClick={() => { moveRegion(region.id, 'up'); triggerSaved(); }}
                                        disabled={index === 0}
                                        className="p-1 text-gray-600 hover:text-gray-300 hover:bg-white/5 rounded disabled:opacity-30 disabled:cursor-not-allowed"
                                        title="Move up"
                                    >
                                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                                        </svg>
                                    </button>
                                    <button
                                        onClick={() => { moveRegion(region.id, 'down'); triggerSaved(); }}
                                        disabled={index === settings.regions.length - 1}
                                        className="p-1 text-gray-600 hover:text-gray-300 hover:bg-white/5 rounded disabled:opacity-30 disabled:cursor-not-allowed"
                                        title="Move down"
                                    >
                                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </button>
                                </div>

                                {/* Expand Toggle */}
                                <button
                                    onClick={() => setExpandedRegions(prev => ({ ...prev, [region.id]: !prev[region.id] }))}
                                    className="p-1.5 text-gray-500 hover:text-gray-300 hover:bg-white/5 rounded-lg transition-colors"
                                    title={expandedRegions[region.id] ? "Collapse" : "Expand to manage countries"}
                                >
                                    <svg className={`w-4 h-4 transform transition-transform ${expandedRegions[region.id] ? 'rotate-90' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                    </svg>
                                </button>

                                {/* Region Name */}
                                <input
                                    type="text"
                                    value={region.label}
                                    onChange={(e) => { updateRegion(region.id, { label: e.target.value }); triggerSaved(); }}
                                    className="flex-1 bg-transparent text-sm text-gray-200 focus:bg-dark-card rounded px-2 py-1.5 border border-transparent focus:border-cyan-500/30 focus:outline-none font-medium min-w-0"
                                />

                                {/* Currency Selector */}
                                <select
                                    value={region.currency}
                                    onChange={(e) => { updateRegion(region.id, { currency: e.target.value }); triggerSaved(); }}
                                    className="input-sm w-24 text-sm font-medium"
                                >
                                    {CURRENCIES.map(c => (
                                        <option key={c.code} value={c.code}>{c.code}</option>
                                    ))}
                                </select>

                                {/* Country Count Badge */}
                                <div className="flex items-center gap-1.5 px-2.5 py-1 bg-dark-card rounded-full text-xs text-gray-400">
                                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                    </svg>
                                    {(region.countries || []).length}
                                </div>

                                {/* Delete */}
                                <button
                                    onClick={() => {
                                        if (confirm(`Delete "${region.label}" region?`)) {
                                            deleteRegion(region.id);
                                            triggerSaved();
                                        }
                                    }}
                                    className="p-2 text-gray-600 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                                    title="Delete region"
                                >
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                </button>
                            </div>

                            {/* Countries List (Expandable) */}
                            {expandedRegions[region.id] && (
                                <div className="border-t border-dark-border p-4 bg-dark-card/50">
                                    <p className="text-xs text-gray-500 mb-3">Countries in this region:</p>
                                    <div className="flex flex-wrap gap-2 mb-4">
                                        {(region.countries || []).map((country, cIdx) => (
                                            <span key={cIdx} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-dark-bg rounded-lg text-sm text-gray-300 border border-dark-border group/country">
                                                {country}
                                                <button
                                                    onClick={() => {
                                                        const updated = region.countries.filter((_, i) => i !== cIdx);
                                                        updateRegion(region.id, { countries: updated });
                                                        triggerSaved();
                                                    }}
                                                    className="text-gray-500 hover:text-red-400 transition-colors"
                                                    title="Remove country"
                                                >
                                                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                    </svg>
                                                </button>
                                            </span>
                                        ))}
                                        {(region.countries || []).length === 0 && (
                                            <span className="text-sm text-gray-500 italic py-2">No countries added yet</span>
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
                                            disabled={!newCountry[region.id]?.trim()}
                                            className="btn-secondary text-sm disabled:opacity-50"
                                        >
                                            Add
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}

                    {(settings.regions || []).length === 0 && (
                        <div className="text-center py-6 text-gray-500 text-sm">
                            No regions defined. Add your first one below.
                        </div>
                    )}
                </div>

                {/* Add New Region */}
                <div className="flex gap-2 pt-3 border-t border-dark-border">
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
                        className="input w-24"
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
                        disabled={!newRegion.label.trim()}
                        className="btn-primary disabled:opacity-50"
                    >
                        <svg className="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Add
                    </button>
                </div>
            </div>

            {/* Preferred Currencies */}
            <div className="card">
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center">
                        <svg className="w-5 h-5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <div>
                        <h4 className="text-sm font-semibold text-gray-200">Preferred Currencies</h4>
                        <p className="text-xs text-gray-500">Quick-access currencies for dropdowns across the app</p>
                    </div>
                </div>

                <div className="flex flex-wrap gap-2 mb-4">
                    {(settings.preferredCurrencies || []).map((code) => {
                        const currency = CURRENCIES.find(c => c.code === code);
                        return (
                            <div
                                key={code}
                                className="inline-flex items-center gap-2 px-3 py-2 bg-amber-500/10 border border-amber-500/20 rounded-lg group hover:border-amber-500/40 transition-colors"
                            >
                                <span className="text-sm font-semibold text-amber-400">{code}</span>
                                <span className="text-xs text-gray-400">{currency?.name}</span>
                                <button
                                    onClick={() => {
                                        const updated = settings.preferredCurrencies.filter(c => c !== code);
                                        setPreferredCurrencies(updated);
                                        triggerSaved();
                                    }}
                                    className="p-0.5 text-gray-500 hover:text-red-400 transition-colors"
                                    title="Remove"
                                >
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                        );
                    })}
                    {(settings.preferredCurrencies || []).length === 0 && (
                        <span className="text-sm text-gray-500 italic py-2">No preferred currencies selected</span>
                    )}
                </div>

                <div className="pt-3 border-t border-dark-border">
                    <select
                        value=""
                        onChange={(e) => {
                            if (e.target.value && !(settings.preferredCurrencies || []).includes(e.target.value)) {
                                const updated = [...(settings.preferredCurrencies || []), e.target.value];
                                setPreferredCurrencies(updated);
                                triggerSaved();
                            }
                        }}
                        className="input w-full"
                    >
                        <option value="">Add currency to quick access...</option>
                        {CURRENCIES
                            .filter(c => !(settings.preferredCurrencies || []).includes(c.code))
                            .map(c => (
                                <option key={c.code} value={c.code}>{c.code} - {c.name}</option>
                            ))
                        }
                    </select>
                </div>

                <div className="mt-4 p-3 bg-amber-500/5 rounded-lg border border-amber-500/10">
                    <p className="text-xs text-amber-400/80 flex items-start gap-2">
                        <svg className="w-4 h-4 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Exchange rates update automatically every hour. Rates are locked when quotes, invoices, and POs are created to ensure prices remain consistent.
                    </p>
                </div>
            </div>

        </div>
    );
}
