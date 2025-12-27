import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react';
import QuoteBuilderMockup from '../mockups/QuoteBuilderMockup';
import KanbanMockup from '../mockups/KanbanMockup';
import FinanceMockup from '../mockups/FinanceMockup';
import DashboardMockup from '../mockups/DashboardMockup';
import CrewMockup from '../mockups/CrewMockup';
import EquipmentMockup from '../mockups/EquipmentMockup';
import CallSheetMockup from '../mockups/CallSheetMockup';
import DeliverablesMockup from '../mockups/DeliverablesMockup';

const features = [
    {
        id: 'quoting',
        title: 'Quote Builder',
        subtitle: 'Create quotes in minutes, not hours',
        description: 'Drag-and-drop line items, apply regional rate cards, calculate margins instantly. Send professional PDFs clients actually want to sign.',
        link: '/features/quoting',
        mockup: QuoteBuilderMockup
    },
    {
        id: 'projects',
        title: 'Project Tracking',
        subtitle: 'From quote to wrap, everything synced',
        description: 'When a quote is won, it becomes a project automatically. Crew, equipment, and budgets flow through without re-entering data.',
        link: '/features/projects',
        mockup: KanbanMockup
    },
    {
        id: 'financials',
        title: 'Financial Dashboard',
        subtitle: 'Know your margins before you wrap',
        description: 'Real-time P&L on every project. Track costs as they happen. No more end-of-project surprises.',
        link: '/features/financials',
        mockup: FinanceMockup
    },
    {
        id: 'crm',
        title: 'CRM & Pipeline',
        subtitle: 'Track every client relationship',
        description: 'Manage leads, track communications, and visualize your sales pipeline. See lifetime value and project history at a glance.',
        link: '/features/crm',
        mockup: DashboardMockup
    },
    {
        id: 'crew',
        title: 'Crew Network',
        subtitle: 'Your freelancer database, organized',
        description: 'Store day rates, skills, and availability. Search and book crew in seconds. No more spreadsheets or phone contacts.',
        link: '/features/crew',
        mockup: CrewMockup
    },
    {
        id: 'equipment',
        title: 'Equipment Tracking',
        subtitle: 'Know where every piece of gear is',
        description: 'Check-in/out tracking, kit management, and conflict detection. Never double-book a camera again.',
        link: '/features/equipment',
        mockup: EquipmentMockup
    },
    {
        id: 'call-sheets',
        title: 'Call Sheets',
        subtitle: 'Professional call sheets in seconds',
        description: 'Auto-populated from project data with crew contacts, locations, and schedules. Export and send with one click.',
        link: '/features/call-sheets',
        mockup: CallSheetMockup
    },
    {
        id: 'deliverables',
        title: 'Deliverables',
        subtitle: 'Track every asset to delivery',
        description: 'Version control, client approvals, and delivery tracking. Know exactly what\'s been delivered and when.',
        link: '/features/deliverables',
        mockup: DeliverablesMockup
    }
];

export default function FeatureShowcase() {
    const [activeIndex, setActiveIndex] = useState(0);
    const scrollRef = useRef(null);

    const scrollTo = (index) => {
        setActiveIndex(index);
    };

    const ActiveMockup = features[activeIndex].mockup;

    return (
        <div className="w-full max-w-6xl mx-auto">
            {/* Feature Selector - Horizontal Scroll */}
            <div className="relative mb-8">
                {/* Scroll Container */}
                <div
                    ref={scrollRef}
                    className="flex gap-3 overflow-x-auto pb-4 px-1 snap-x snap-mandatory scrollbar-hide"
                    style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                >
                    {features.map((feature, index) => (
                        <button
                            key={feature.id}
                            onClick={() => scrollTo(index)}
                            className={`flex-shrink-0 snap-start px-6 py-4 rounded-xl border transition-all duration-300 text-left min-w-[280px] sm:min-w-[320px] ${
                                activeIndex === index
                                    ? 'bg-marketing-surface border-marketing-primary/50 shadow-lg'
                                    : 'bg-transparent border-marketing-border hover:border-marketing-border/80 hover:bg-marketing-surface/30'
                            }`}
                        >
                            <div className="flex items-center gap-3 mb-2">
                                <div className={`w-2 h-2 rounded-full ${activeIndex === index ? 'bg-marketing-primary' : 'bg-marketing-border'}`} />
                                <span className={`font-semibold ${activeIndex === index ? 'text-marketing-text-primary' : 'text-marketing-text-secondary'}`}>
                                    {feature.title}
                                </span>
                            </div>
                            <p className={`text-sm ${activeIndex === index ? 'text-marketing-text-secondary' : 'text-marketing-text-secondary/60'}`}>
                                {feature.subtitle}
                            </p>
                        </button>
                    ))}
                </div>

                {/* Progress Dots (Mobile) */}
                <div className="flex justify-center gap-2 mt-4 sm:hidden">
                    {features.map((feature, index) => (
                        <button
                            key={index}
                            onClick={() => scrollTo(index)}
                            aria-label={`View ${feature.title}`}
                            className={`w-2 h-2 rounded-full transition-all focus:outline-none focus:ring-2 focus:ring-marketing-primary focus:ring-offset-1 focus:ring-offset-marketing-background ${
                                activeIndex === index ? 'bg-marketing-primary w-6' : 'bg-marketing-border'
                            }`}
                        />
                    ))}
                </div>
            </div>

            {/* Feature Content */}
            <div className="grid lg:grid-cols-5 gap-6 items-center">
                {/* Text Content */}
                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeIndex}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.3 }}
                        className="order-2 lg:order-1 lg:col-span-2 text-center lg:text-center bg-marketing-surface/50 rounded-xl p-6 border border-marketing-border"
                    >
                        <span className="inline-block px-3 py-1 rounded-full bg-marketing-surface border border-marketing-border text-marketing-text-secondary text-xs font-medium mb-3">
                            {features[activeIndex].title}
                        </span>
                        <h3 className="text-xl md:text-2xl font-bold text-white mb-3">
                            {features[activeIndex].subtitle}
                        </h3>
                        <p className="text-marketing-text-secondary text-sm mb-4 leading-relaxed">
                            {features[activeIndex].description}
                        </p>
                        <Link
                            to={features[activeIndex].link}
                            className="inline-flex items-center gap-2 text-marketing-primary hover:text-marketing-primary/80 text-sm font-medium transition-colors group"
                        >
                            Learn more
                            <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                        </Link>
                    </motion.div>
                </AnimatePresence>

                {/* Mockup */}
                <div className="order-1 lg:order-2 lg:col-span-3">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={activeIndex}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{ duration: 0.3 }}
                            className="rounded-xl overflow-hidden shadow-2xl"
                        >
                            <ActiveMockup />
                        </motion.div>
                    </AnimatePresence>
                </div>
            </div>

            {/* Navigation Arrows (Desktop) */}
            <div className="hidden sm:flex justify-center gap-4 mt-8">
                <button
                    onClick={() => scrollTo(activeIndex === 0 ? features.length - 1 : activeIndex - 1)}
                    aria-label="Previous feature"
                    className="p-3 rounded-full border transition-all focus:outline-none focus:ring-2 focus:ring-marketing-primary focus:ring-offset-2 focus:ring-offset-marketing-background border-marketing-border text-marketing-text-secondary hover:border-marketing-primary hover:text-marketing-text-primary"
                >
                    <ChevronLeft className="w-5 h-5" aria-hidden="true" />
                </button>
                <button
                    onClick={() => scrollTo(activeIndex === features.length - 1 ? 0 : activeIndex + 1)}
                    aria-label="Next feature"
                    className="p-3 rounded-full border transition-all focus:outline-none focus:ring-2 focus:ring-marketing-primary focus:ring-offset-2 focus:ring-offset-marketing-background border-marketing-border text-marketing-text-secondary hover:border-marketing-primary hover:text-marketing-text-primary"
                >
                    <ChevronRight className="w-5 h-5" aria-hidden="true" />
                </button>
            </div>
        </div>
    );
}
