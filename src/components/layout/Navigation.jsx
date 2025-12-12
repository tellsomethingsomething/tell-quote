import React from 'react';

export default function Navigation({ activeTab, onTabChange }) {
    const tabs = [
        { id: 'dashboard', label: 'Dashboard' },
        { id: 'quotes', label: 'Quotes' },
        { id: 'clients', label: 'Clients' },
        { id: 'rate-card', label: 'Rate Card' },
        { id: 'settings', label: 'Settings' }
    ];

    return (
        <nav className="flex justify-center w-full" aria-label="Main navigation">
            <div className="bg-gray-900/80 p-1 rounded-xl border border-gray-800/80 inline-flex gap-1">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => onTabChange(tab.id)}
                        className={`px-5 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                            activeTab === tab.id
                                ? 'bg-accent-primary/10 text-accent-primary'
                                : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'
                        }`}
                        aria-current={activeTab === tab.id ? 'page' : undefined}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>
        </nav>
    );
}
