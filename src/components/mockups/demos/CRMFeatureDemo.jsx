import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCurrency } from '../../../hooks/useCurrency';

const pipelineStages = [
    { id: 'lead', label: 'Lead', color: 'bg-gray-500' },
    { id: 'qualified', label: 'Qualified', color: 'bg-blue-500' },
    { id: 'proposal', label: 'Proposal', color: 'bg-amber-500' },
    { id: 'won', label: 'Won', color: 'bg-green-500' },
];

const initialDeals = [
    { id: 1, company: 'Nike Marketing', value: 45000, stage: 'proposal', lastContact: 'Today', contacts: 3 },
    { id: 2, company: 'Spotify', value: 28000, stage: 'qualified', lastContact: '3 days ago', contacts: 2 },
    { id: 3, company: 'Adobe', value: 18000, stage: 'lead', lastContact: '1 week ago', contacts: 1 },
];

export default function CRMFeatureDemo() {
    const { formatPrice, formatPriceShort } = useCurrency();
    const [deals, setDeals] = useState(initialDeals);
    const [dragging, setDragging] = useState(null);
    const [hoveredStage, setHoveredStage] = useState(null);
    const [selectedDeal, setSelectedDeal] = useState(null);
    const [showWinConfetti, setShowWinConfetti] = useState(false);
    const [activities, setActivities] = useState([
        { id: 1, type: 'call', note: 'Discussed Q1 campaign budget', time: '2 hours ago' },
        { id: 2, type: 'email', note: 'Sent revised proposal', time: 'Yesterday' },
        { id: 3, type: 'meeting', note: 'Initial discovery call', time: '3 days ago' },
    ]);

    const handleDragStart = (e, deal) => {
        setDragging(deal);
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleDragEnd = () => {
        setDragging(null);
        setHoveredStage(null);
    };

    const handleDragOver = (e, stageId) => {
        e.preventDefault();
        setHoveredStage(stageId);
    };

    const handleDrop = (e, stageId) => {
        e.preventDefault();
        if (dragging) {
            const wasWon = stageId === 'won' && dragging.stage !== 'won';
            setDeals(deals.map(d =>
                d.id === dragging.id ? { ...d, stage: stageId } : d
            ));

            if (wasWon) {
                setShowWinConfetti(true);
                setTimeout(() => setShowWinConfetti(false), 2000);
            }
        }
        setDragging(null);
        setHoveredStage(null);
    };

    const handleLogActivity = (type) => {
        const notes = {
            call: 'Followed up on proposal',
            email: 'Sent contract for review',
            meeting: 'Presentation meeting scheduled',
        };
        setActivities([
            { id: Date.now(), type, note: notes[type], time: 'Just now' },
            ...activities
        ]);
    };

    const getStageValue = (stageId) => {
        return deals.filter(d => d.stage === stageId).reduce((sum, d) => sum + d.value, 0);
    };

    return (
        <div className="p-3 sm:p-6 space-y-3 sm:space-y-4 max-w-full overflow-hidden">
            {/* Win Confetti */}
            <AnimatePresence>
                {showWinConfetti && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 flex items-center justify-center z-30 pointer-events-none"
                    >
                        <div className="text-center">
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: [0, 1.2, 1] }}
                                className="text-4xl sm:text-6xl mb-2"
                            >
                                🎉
                            </motion.div>
                            <p className="text-green-400 font-bold text-lg sm:text-xl">Deal Won!</p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Pipeline Header */}
            <div className="flex items-center justify-between gap-2">
                <h3 className="text-white font-semibold text-sm sm:text-base">Sales Pipeline</h3>
                <span className="text-gray-500 text-xs hidden sm:inline">Drag deals between stages</span>
                <span className="text-gray-500 text-xs sm:hidden">Tap to move</span>
            </div>

            {/* Pipeline Columns - Horizontal scroll on mobile */}
            <div className="overflow-x-auto -mx-3 px-3 sm:mx-0 sm:px-0 pb-2">
                <div className="grid grid-cols-4 gap-2 min-w-[480px] sm:min-w-0 min-h-[180px] sm:min-h-[200px]">
                    {pipelineStages.map((stage) => {
                        const stageDeals = deals.filter(d => d.stage === stage.id);
                        const isHovered = hoveredStage === stage.id;

                        return (
                            <div
                                key={stage.id}
                                onDragOver={(e) => handleDragOver(e, stage.id)}
                                onDrop={(e) => handleDrop(e, stage.id)}
                                className={`flex flex-col rounded-lg transition-colors ${isHovered
                                        ? 'bg-indigo-500/10 border-2 border-indigo-500/50'
                                        : 'bg-gray-800/30 border border-gray-700/50'
                                    }`}
                            >
                                {/* Column Header */}
                                <div className="p-2 border-b border-gray-700/50">
                                    <div className="flex items-center gap-1 mb-1">
                                        <div className={`w-2 h-2 rounded-full ${stage.color}`} />
                                        <span className="text-gray-300 text-xs font-medium">{stage.label}</span>
                                    </div>
                                    <p className="text-gray-500 text-xs">{formatPriceShort(getStageValue(stage.id))}</p>
                                </div>

                                {/* Cards */}
                                <div className="flex-1 p-1.5 space-y-1.5 overflow-auto">
                                    <AnimatePresence>
                                        {stageDeals.map((deal) => (
                                            <motion.div
                                                key={deal.id}
                                                layout
                                                initial={{ opacity: 0, scale: 0.9 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                exit={{ opacity: 0, scale: 0.9 }}
                                                draggable
                                                onDragStart={(e) => handleDragStart(e, deal)}
                                                onDragEnd={handleDragEnd}
                                                onClick={() => setSelectedDeal(deal)}
                                                className={`bg-gray-800 rounded p-2 cursor-grab active:cursor-grabbing border border-gray-700/50 hover:border-indigo-500/50 transition-colors min-h-[44px] ${dragging?.id === deal.id ? 'opacity-50' : ''
                                                    }`}
                                            >
                                                <h4 className="text-white text-xs font-medium truncate">{deal.company}</h4>
                                                <p className="text-indigo-400 text-xs font-bold">{formatPriceShort(deal.value)}</p>
                                            </motion.div>
                                        ))}
                                    </AnimatePresence>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Activity Section */}
            <div className="bg-gray-800/50 rounded-lg border border-gray-700/50">
                <div className="px-3 sm:px-4 py-2 border-b border-gray-700/50 flex items-center justify-between gap-2">
                    <h4 className="text-white font-medium text-xs sm:text-sm">Recent Activity</h4>
                    <div className="flex gap-1">
                        {[
                            { type: 'call', icon: '📞', label: 'Call' },
                            { type: 'email', icon: '✉️', label: 'Email' },
                            { type: 'meeting', icon: '📅', label: 'Meeting' },
                        ].map(action => (
                            <button
                                key={action.type}
                                onClick={() => handleLogActivity(action.type)}
                                className="min-w-[44px] min-h-[44px] sm:min-w-[36px] sm:min-h-[36px] px-3 py-2 bg-gray-700/50 hover:bg-gray-700 rounded-lg text-sm text-gray-300 transition-colors flex items-center justify-center"
                                title={`Log ${action.label}`}
                            >
                                {action.icon}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="divide-y divide-gray-700/30 max-h-[100px] sm:max-h-[120px] overflow-auto">
                    <AnimatePresence>
                        {activities.slice(0, 4).map((activity) => (
                            <motion.div
                                key={activity.id}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="px-3 sm:px-4 py-2 flex items-center gap-2 sm:gap-3"
                            >
                                <span className="text-sm flex-shrink-0">
                                    {activity.type === 'call' ? '📞' : activity.type === 'email' ? '✉️' : '📅'}
                                </span>
                                <div className="flex-1 min-w-0">
                                    <p className="text-white text-xs sm:text-sm truncate">{activity.note}</p>
                                    <p className="text-gray-500 text-xs">{activity.time}</p>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            </div>

            {/* Deal Detail Modal */}
            <AnimatePresence>
                {selectedDeal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-black/60 flex items-center justify-center p-3 sm:p-4 z-20"
                        onClick={() => setSelectedDeal(null)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-gray-800 rounded-xl p-4 sm:p-5 max-w-sm w-full border border-gray-700"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="flex items-start justify-between gap-3 mb-4">
                                <div className="min-w-0 flex-1 text-left">
                                    <h3 className="text-white font-bold text-base sm:text-lg truncate">{selectedDeal.company}</h3>
                                    <span className={`text-xs px-2 py-0.5 rounded ${pipelineStages.find(s => s.id === selectedDeal.stage)?.color} bg-opacity-20 text-white`}>
                                        {pipelineStages.find(s => s.id === selectedDeal.stage)?.label}
                                    </span>
                                </div>
                                <button
                                    onClick={() => setSelectedDeal(null)}
                                    className="min-w-[44px] min-h-[44px] flex items-center justify-center text-gray-500 hover:text-white hover:bg-gray-700/50 rounded-lg transition-colors flex-shrink-0"
                                >
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>

                            <div className="space-y-3">
                                <div className="flex justify-between">
                                    <span className="text-gray-400 text-sm">Deal Value</span>
                                    <span className="text-indigo-400 font-bold">{formatPrice(selectedDeal.value)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-400 text-sm">Last Contact</span>
                                    <span className="text-white text-sm">{selectedDeal.lastContact}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-400 text-sm">Contacts</span>
                                    <span className="text-white text-sm">{selectedDeal.contacts} people</span>
                                </div>
                            </div>

                            <button
                                disabled
                                className="w-full mt-4 min-h-[44px] py-2 bg-gray-700 text-gray-400 rounded-lg text-sm cursor-not-allowed"
                            >
                                View Full Deal
                            </button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <p className="text-center text-gray-500 text-xs sm:text-sm">
                Drag deals to move stages, click to log activity
            </p>
        </div>
    );
}
