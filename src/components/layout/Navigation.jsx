import React from 'react';

export default function Navigation({ activeTab, onTabChange }) {
    const tabs = [
        { id: 'dashboard', label: 'Dashboard' },
        { id: 'clients', label: 'Clients' },
        { id: 'rate-card', label: 'Rate Card' },
        { id: 'settings', label: 'Settings' }
    ];

    return (
        <div className="flex justify-center w-full">
            <div className="bg-[#111827] p-1 rounded-lg border border-gray-800 inline-flex">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => onTabChange(tab.id)}
                        className={`px-6 py-2 rounded-md text-sm font-medium transition-all duration-200 ${activeTab === tab.id
                                ? 'bg-gray-800 text-white shadow-sm'
                                : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/50'
                            }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>
        </div>
    );
}
