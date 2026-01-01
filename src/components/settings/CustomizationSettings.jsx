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
    );
}
