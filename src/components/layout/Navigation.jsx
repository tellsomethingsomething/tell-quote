import React, { useMemo } from 'react';
import { useAuthStore } from '../../store/authStore';

export default function Navigation({ activeTab, onTabChange }) {
    const hasPermission = useAuthStore(state => state.hasPermission);

    const allTabs = [
        { id: 'dashboard', label: 'Dashboard', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
        { id: 'quotes', label: 'Quotes', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
        { id: 'clients', label: 'Clients', icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z' },
        { id: 'opportunities', label: 'Ops', icon: 'M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z' },
        { id: 'tasks', label: 'Tasks', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4' },
        { id: 'sop', label: 'SOP', icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253' },
        { id: 'knowledge', label: 'Research', icon: 'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z' },
        { id: 'kit', label: 'Kit', icon: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4' },
        { id: 'rate-card', label: 'Rates', icon: 'M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z' },
        { id: 'contacts', label: 'Contacts', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z' },
    ];

    // Filter tabs based on user permissions
    const tabs = useMemo(() => {
        return allTabs.filter(tab => hasPermission(tab.id));
    }, [hasPermission]);

    return (
        <nav className="flex justify-center w-full" aria-label="Main navigation">
            {/* Desktop Navigation */}
            <div className="hidden md:inline-flex bg-gray-900/80 p-1 rounded-xl border border-gray-800/80 gap-1">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => onTabChange(tab.id)}
                        className={`px-5 py-2 min-h-[44px] rounded-lg text-sm font-medium transition-all duration-200 ${activeTab === tab.id
                                ? 'bg-accent-primary/20 text-accent-primary border border-accent-primary/30'
                                : 'text-gray-400 hover:text-gray-200 hover:bg-white/5 border border-transparent'
                            }`}
                        aria-current={activeTab === tab.id ? 'page' : undefined}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Mobile Navigation - Icons with labels */}
            <div className="md:hidden inline-flex bg-gray-900/80 p-1 rounded-xl border border-gray-800/80 gap-0.5">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => onTabChange(tab.id)}
                        className={`px-2 py-1.5 min-w-[52px] min-h-[52px] rounded-lg transition-all duration-200 flex flex-col items-center justify-center gap-0.5 ${activeTab === tab.id
                                ? 'bg-accent-primary/20 text-accent-primary border border-accent-primary/30'
                                : 'text-gray-400 hover:text-gray-200 hover:bg-white/5 border border-transparent'
                            }`}
                        aria-current={activeTab === tab.id ? 'page' : undefined}
                        aria-label={tab.label}
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={tab.icon} />
                        </svg>
                        <span className="text-[9px] font-medium leading-none">{tab.label}</span>
                    </button>
                ))}
            </div>
        </nav>
    );
}
