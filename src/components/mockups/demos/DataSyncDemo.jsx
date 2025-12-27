import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCurrency } from '../../../hooks/useCurrency';

const demoData = {
    quote: {
        id: "Q-2401",
        title: "Nike Spring Campaign",
        client: "Nike Marketing",
        total: 15000,
        equipment: [
            { name: "Sony FX6", quantity: 2 },
            { name: "Aputure 600d", quantity: 4 },
            { name: "DJI RS3 Pro", quantity: 2 },
            { name: "Sennheiser MKH416", quantity: 2 }
        ],
        crew: [
            { role: "Director", name: "James Chen" },
            { role: "DP", name: "Sarah Miller" },
            { role: "Gaffer", name: "Tom Wilson" },
            { role: "Sound", name: "Alex Park" }
        ]
    }
};

export default function DataSyncDemo() {
    const { formatPrice } = useCurrency();
    const [stage, setStage] = useState('quote'); // quote, transitioning, project
    const [isAnimating, setIsAnimating] = useState(false);
    const timeoutRef = useRef(null);

    // Cleanup timeout on unmount to prevent memory leak
    useEffect(() => {
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, []);

    const handleWinQuote = () => {
        if (isAnimating) return;
        setIsAnimating(true);
        setStage('transitioning');

        timeoutRef.current = setTimeout(() => {
            setStage('project');
            setIsAnimating(false);
        }, 1500);
    };

    const handleReset = () => {
        setStage('quote');
    };

    return (
        <div className="p-4 sm:p-6 space-y-4">
            <AnimatePresence mode="wait">
                {stage === 'quote' && (
                    <motion.div
                        key="quote"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -20 }}
                        transition={{ duration: 0.3 }}
                        className="space-y-4"
                    >
                        {/* Quote Card */}
                        <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700/50">
                            <div className="flex items-start justify-between mb-4">
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="text-gray-500 text-sm">{demoData.quote.id}</span>
                                        <span className="px-2 py-0.5 bg-amber-500/20 text-amber-400 rounded text-xs">
                                            Sent
                                        </span>
                                    </div>
                                    <h3 className="text-white font-semibold text-lg">{demoData.quote.title}</h3>
                                    <p className="text-gray-400 text-sm">{demoData.quote.client}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-2xl font-bold text-white">
                                        {formatPrice(demoData.quote.total)}
                                    </p>
                                    <p className="text-gray-500 text-sm">Quote Value</p>
                                </div>
                            </div>

                            {/* Equipment Preview */}
                            <div className="mb-4">
                                <p className="text-gray-400 text-xs uppercase tracking-wide mb-2">Equipment Quoted</p>
                                <div className="flex flex-wrap gap-2">
                                    {demoData.quote.equipment.map((item) => (
                                        <span
                                            key={item.name}
                                            className="px-2 py-1 bg-gray-700/50 text-gray-300 rounded text-xs"
                                        >
                                            {item.name} x{item.quantity}
                                        </span>
                                    ))}
                                </div>
                            </div>

                            {/* Crew Preview */}
                            <div>
                                <p className="text-gray-400 text-xs uppercase tracking-wide mb-2">Crew Booked</p>
                                <div className="flex flex-wrap gap-2">
                                    {demoData.quote.crew.map((person) => (
                                        <span
                                            key={person.role}
                                            className="px-2 py-1 bg-gray-700/50 text-gray-300 rounded text-xs"
                                        >
                                            {person.role}: {person.name}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Win Quote Button */}
                        <motion.button
                            onClick={handleWinQuote}
                            className="w-full py-3 bg-green-600 hover:bg-green-500 text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Mark as Won
                        </motion.button>

                        <p className="text-center text-gray-500 text-sm">
                            Click to see how data syncs automatically
                        </p>
                    </motion.div>
                )}

                {stage === 'transitioning' && (
                    <motion.div
                        key="transitioning"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="flex flex-col items-center justify-center py-12 space-y-4"
                    >
                        <motion.div
                            className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full"
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        />
                        <motion.div className="text-center space-y-2">
                            <motion.p
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2 }}
                                className="text-white font-semibold"
                            >
                                Converting quote to project...
                            </motion.p>
                            <motion.div className="space-y-1">
                                {[
                                    "Creating project timeline",
                                    "Booking equipment",
                                    "Assigning crew",
                                    "Setting up budget tracker"
                                ].map((step, i) => (
                                    <motion.p
                                        key={step}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: 0.4 + i * 0.2 }}
                                        className="text-gray-400 text-sm flex items-center justify-center gap-2"
                                    >
                                        <svg className="w-4 h-4 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                        {step}
                                    </motion.p>
                                ))}
                            </motion.div>
                        </motion.div>
                    </motion.div>
                )}

                {stage === 'project' && (
                    <motion.div
                        key="project"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                        className="space-y-4"
                    >
                        {/* Project Card */}
                        <div className="bg-gray-800/50 rounded-lg p-4 border border-green-500/30">
                            <div className="flex items-start justify-between mb-4">
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="text-gray-500 text-sm">P-2401</span>
                                        <span className="px-2 py-0.5 bg-green-500/20 text-green-400 rounded text-xs">
                                            Active Project
                                        </span>
                                    </div>
                                    <h3 className="text-white font-semibold text-lg">{demoData.quote.title}</h3>
                                    <p className="text-gray-400 text-sm">{demoData.quote.client}</p>
                                </div>
                                <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ delay: 0.2, type: "spring" }}
                                    className="w-10 h-10 bg-green-500/20 rounded-full flex items-center justify-center"
                                >
                                    <svg className="w-6 h-6 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                </motion.div>
                            </div>

                            {/* Budget Tracker */}
                            <div className="bg-gray-900/50 rounded-lg p-3 mb-4">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-gray-400 text-sm">Budget vs Actuals</span>
                                    <span className="text-green-400 text-sm font-medium">On Track</span>
                                </div>
                                <div className="flex justify-between text-sm mb-2">
                                    <span className="text-gray-500">Spent: {formatPrice(0)}</span>
                                    <span className="text-white font-medium">Budget: {formatPrice(demoData.quote.total)}</span>
                                </div>
                                <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: "5%" }}
                                        transition={{ delay: 0.5, duration: 0.5 }}
                                        className="h-full bg-green-500 rounded-full"
                                    />
                                </div>
                            </div>

                            {/* Synced Data */}
                            <div className="grid grid-cols-2 gap-3">
                                <motion.div
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.3 }}
                                    className="bg-gray-700/30 rounded-lg p-3"
                                >
                                    <div className="flex items-center gap-2 mb-2">
                                        <svg className="w-4 h-4 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                        </svg>
                                        <span className="text-gray-400 text-xs">Equipment</span>
                                    </div>
                                    <p className="text-white font-semibold text-lg">{demoData.quote.equipment.length} items</p>
                                    <p className="text-green-400 text-xs">Auto-booked</p>
                                </motion.div>
                                <motion.div
                                    initial={{ opacity: 0, x: 10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.4 }}
                                    className="bg-gray-700/30 rounded-lg p-3"
                                >
                                    <div className="flex items-center gap-2 mb-2">
                                        <svg className="w-4 h-4 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                        </svg>
                                        <span className="text-gray-400 text-xs">Crew</span>
                                    </div>
                                    <p className="text-white font-semibold text-lg">{demoData.quote.crew.length} people</p>
                                    <p className="text-green-400 text-xs">Auto-assigned</p>
                                </motion.div>
                            </div>
                        </div>

                        {/* Reset Button */}
                        <button
                            onClick={handleReset}
                            className="w-full py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 text-sm rounded-lg transition-colors flex items-center justify-center gap-2"
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                            Try Again
                        </button>

                        <p className="text-center text-gray-500 text-sm">
                            Everything from your quote is now synced to the project
                        </p>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
