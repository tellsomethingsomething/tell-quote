import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import FinancialDemo from './demos/FinancialDemo';
import DataSyncDemo from './demos/DataSyncDemo';
import CRMDemo from './demos/CRMDemo';

const tabs = [
    {
        id: 'financial',
        label: 'Financial Visibility',
        shortLabel: 'Profit',
        description: 'See your profit from the first quote',
        icon: (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
        ),
        component: FinancialDemo
    },
    {
        id: 'sync',
        label: 'Complete Data Sync',
        shortLabel: 'Sync',
        description: 'Quotes sync to projects automatically',
        icon: (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
        ),
        component: DataSyncDemo
    },
    {
        id: 'crm',
        label: 'Built-in CRM',
        shortLabel: 'CRM',
        description: 'Manage clients while you work',
        icon: (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
        ),
        component: CRMDemo
    }
];

export default function InteractiveDemo() {
    const [activeTab, setActiveTab] = useState('financial');

    const ActiveComponent = tabs.find(t => t.id === activeTab)?.component || FinancialDemo;

    return (
        <div className="w-full max-w-5xl mx-auto">
            {/* Demo Window */}
            <div className="bg-gray-900 rounded-xl border border-gray-800 shadow-2xl overflow-hidden">
                {/* Window Chrome */}
                <div className="bg-gray-800/80 px-4 py-3 flex items-center justify-between border-b border-gray-700/50">
                    <div className="flex items-center gap-2">
                        <div className="flex gap-1.5">
                            <div className="w-3 h-3 rounded-full bg-red-500/80" />
                            <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                            <div className="w-3 h-3 rounded-full bg-green-500/80" />
                        </div>
                        <span className="text-gray-500 text-xs ml-2 hidden sm:inline">ProductionOS</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-500 text-xs">
                        <span className="hidden sm:inline">Interactive Demo</span>
                        <span className="px-2 py-0.5 bg-indigo-500/20 text-indigo-400 rounded text-xs">
                            Live
                        </span>
                    </div>
                </div>

                {/* Tab Bar */}
                <div className="bg-gray-800/50 px-2 sm:px-4 py-2 border-b border-gray-700/50">
                    <div className="flex gap-1 sm:gap-2">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`relative flex-1 sm:flex-none px-3 sm:px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                                    activeTab === tab.id
                                        ? 'bg-indigo-600 text-white'
                                        : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
                                }`}
                            >
                                <span className={activeTab === tab.id ? 'text-white' : 'text-gray-500'}>
                                    {tab.icon}
                                </span>
                                <span className="hidden sm:inline">{tab.label}</span>
                                <span className="sm:hidden">{tab.shortLabel}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Tab Description */}
                <div className="px-4 sm:px-6 py-3 bg-gray-800/30 border-b border-gray-700/30">
                    <AnimatePresence mode="wait">
                        {tabs.map((tab) =>
                            tab.id === activeTab && (
                                <motion.p
                                    key={tab.id}
                                    initial={{ opacity: 0, y: -5 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: 5 }}
                                    className="text-gray-400 text-sm text-center"
                                >
                                    {tab.description}
                                </motion.p>
                            )
                        )}
                    </AnimatePresence>
                </div>

                {/* Demo Content */}
                <div className="min-h-[400px] sm:min-h-[450px]">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={activeTab}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.2 }}
                        >
                            <ActiveComponent />
                        </motion.div>
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
}
