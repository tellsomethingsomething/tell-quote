import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import MotionScreenGrab from './MotionScreenGrab';
import { FileText, Clapperboard, DollarSign, Users } from 'lucide-react';
import DashboardMockup from '../mockups/DashboardMockup';
import KanbanMockup from '../mockups/KanbanMockup';
import QuoteBuilderMockup from '../mockups/QuoteBuilderMockup';
import FinanceMockup from '../mockups/FinanceMockup';

const tabs = [
    {
        id: 'quoting',
        label: 'Intelligent Quoting',
        icon: FileText,
        description: 'Build quotes in minutes. Drag-and-drop line items, apply markups, win more work.',
        image: '/assets/screenshots/quote_builder.png',
        color: 'text-marketing-primary',
        bg: 'bg-marketing-primary/10'
    },
    {
        id: 'production',
        label: 'Production Management',
        icon: Clapperboard,
        description: 'Visualize your pipeline. Track crew, equipment, and shoot dates on a unified board.',
        image: '/assets/screenshots/kanban.png',
        color: 'text-marketing-accent',
        bg: 'bg-marketing-accent/10'
    },
    {
        id: 'finance',
        label: 'Financial Analytics',
        icon: DollarSign,
        description: 'Real-time project profitability. Track revenue, expenses, and margins automatically.',
        image: '/assets/screenshots/finance.png',
        color: 'text-marketing-success',
        bg: 'bg-marketing-success/10'
    },
    {
        id: 'dashboard',
        label: 'Agency Dashboard',
        icon: Users,
        description: 'Your command center. Active projects, pending quotes, and team capacity at a glance.',
        image: '/assets/screenshots/dashboard.png',
        color: 'text-blue-400',
        bg: 'bg-blue-400/10'
    }
];

export default function FeatureTabs() {
    const [activeTab, setActiveTab] = useState(tabs[0]);

    return (
        <div className="w-full max-w-7xl mx-auto px-4">
            <div className="grid lg:grid-cols-12 gap-8 lg:gap-12 items-center">

                {/* Tabs Navigation (Left Side) */}
                <div className="lg:col-span-4 flex flex-col gap-3 md:gap-4">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab)}
                            className={`text-left p-4 md:p-6 rounded-xl border transition-all duration-300 group ${activeTab.id === tab.id
                                ? 'bg-marketing-surface border-marketing-primary/50 shadow-lg'
                                : 'bg-transparent border-transparent hover:bg-marketing-surface/50 hover:border-marketing-border'
                                }`}
                        >
                            <div className="flex items-center gap-3 md:gap-4 mb-2">
                                <div className={`p-2 rounded-lg ${activeTab.id === tab.id ? tab.bg : 'bg-marketing-surface border border-marketing-border'}`}>
                                    <tab.icon className={`w-5 h-5 md:w-6 md:h-6 ${activeTab.id === tab.id ? tab.color : 'text-marketing-text-secondary'}`} />
                                </div>
                                <h3 className={`font-bold text-base md:text-lg ${activeTab.id === tab.id ? 'text-white' : 'text-marketing-text-secondary group-hover:text-white'}`}>
                                    {tab.label}
                                </h3>
                            </div>
                            <p className={`text-sm pl-[2.75rem] md:pl-[3.5rem] leading-relaxed transition-colors ${activeTab.id === tab.id ? 'text-marketing-text-secondary' : 'text-marketing-text-secondary/50'
                                }`}>
                                {tab.description}
                            </p>
                        </button>
                    ))}
                </div>

                {/* Visual Display (Right Side) */}
                <div className="lg:col-span-8 relative min-h-[300px] md:min-h-[500px]">
                    {/* Background Glow */}
                    <div className={`absolute inset-0 blur-[100px] opacity-20 transition-colors duration-500 rounded-full ${activeTab.id === 'quoting' ? 'bg-marketing-primary' :
                        activeTab.id === 'production' ? 'bg-marketing-accent' :
                            activeTab.id === 'finance' ? 'bg-marketing-success' : 'bg-blue-500'
                        }`} />

                    <div className="relative z-10 w-full overflow-hidden rounded-xl">
                        <AnimatePresence mode='wait'>
                            <motion.div
                                key={activeTab.id}
                                initial={{ opacity: 0, y: 20, scale: 0.98 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: -20, scale: 0.98 }}
                                transition={{ duration: 0.3 }}
                            >
                                {activeTab.id === 'quoting' && <QuoteBuilderMockup />}
                                {activeTab.id === 'production' && <KanbanMockup />}
                                {activeTab.id === 'finance' && <FinanceMockup />}
                                {activeTab.id === 'dashboard' && <DashboardMockup />}
                            </motion.div>
                        </AnimatePresence>
                    </div>
                </div>
            </div>
        </div>
    );
}
