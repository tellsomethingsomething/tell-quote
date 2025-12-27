import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, TrendingUp, Building2, Briefcase, ExternalLink, Star, Clock } from 'lucide-react';

const opportunities = [
    {
        id: 1,
        type: 'Brand Activity',
        icon: Building2,
        title: 'Nike launches "Run London" campaign',
        source: 'Marketing Week',
        time: '2 hours ago',
        relevance: 'High',
        summary: 'Nike is launching a major running campaign in London with outdoor activations and athlete content.',
        tags: ['Sports', 'Brand Campaign'],
        color: 'text-green-400',
        bgColor: 'bg-green-500/10',
    },
    {
        id: 2,
        type: 'Agency Win',
        icon: Briefcase,
        title: 'Mother wins Adidas creative account',
        source: 'Campaign',
        time: '5 hours ago',
        relevance: 'High',
        summary: 'Mother London has been appointed as creative agency for Adidas UK. New production work expected.',
        tags: ['Sports', 'Agency Move'],
        color: 'text-blue-400',
        bgColor: 'bg-blue-500/10',
    },
    {
        id: 3,
        type: 'Industry News',
        icon: TrendingUp,
        title: 'F1 announces new broadcast partnership',
        source: 'SportsPro',
        time: '1 day ago',
        relevance: 'Medium',
        summary: 'Formula 1 expanding content production with new streaming partner. Seeking production companies.',
        tags: ['Sports', 'Broadcast'],
        color: 'text-purple-400',
        bgColor: 'bg-purple-500/10',
    },
];

export default function AIResearchDemo() {
    const [activeCard, setActiveCard] = useState(null);
    const [savedItems, setSavedItems] = useState([]);
    const [showTyping, setShowTyping] = useState(true);

    useEffect(() => {
        const timer = setTimeout(() => setShowTyping(false), 2000);
        return () => clearTimeout(timer);
    }, []);

    const toggleSave = (id) => {
        setSavedItems(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    return (
        <div className="p-3 sm:p-6 space-y-4 max-w-full overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-indigo-500/20 rounded-lg flex items-center justify-center">
                        <Sparkles className="w-4 h-4 text-indigo-400" />
                    </div>
                    <div>
                        <h3 className="text-white font-semibold text-sm sm:text-base">Morning Briefing</h3>
                        <p className="text-gray-500 text-xs">Based on your market: Sports, Fitness</p>
                    </div>
                </div>
                <span className="px-2 py-1 bg-green-500/20 text-green-400 rounded-full text-xs flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                    Live
                </span>
            </div>

            {/* AI Typing Indicator */}
            <AnimatePresence>
                {showTyping && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="flex items-center gap-2 text-gray-400 text-sm"
                    >
                        <div className="flex gap-1">
                            <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                            <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                            <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                        </div>
                        <span>Analyzing your market...</span>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Opportunities List */}
            <div className="space-y-2">
                <AnimatePresence>
                    {!showTyping && opportunities.map((opp, index) => (
                        <motion.div
                            key={opp.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.15 }}
                            className={`p-3 rounded-lg border transition-all cursor-pointer ${
                                activeCard === opp.id
                                    ? 'border-indigo-500/50 bg-indigo-500/5'
                                    : 'border-gray-700 bg-gray-800/50 hover:border-gray-600'
                            }`}
                            onClick={() => setActiveCard(activeCard === opp.id ? null : opp.id)}
                        >
                            {/* Card Header */}
                            <div className="flex items-start gap-2 sm:gap-3">
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${opp.bgColor}`}>
                                    <opp.icon className={`w-4 h-4 ${opp.color}`} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="min-w-0">
                                            <p className="text-white text-sm font-medium truncate">{opp.title}</p>
                                            <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
                                                <span>{opp.source}</span>
                                                <span>•</span>
                                                <Clock className="w-3 h-3" />
                                                <span>{opp.time}</span>
                                            </div>
                                        </div>
                                        <span className={`px-1.5 py-0.5 rounded text-xs flex-shrink-0 ${
                                            opp.relevance === 'High'
                                                ? 'bg-green-500/20 text-green-400'
                                                : 'bg-amber-500/20 text-amber-400'
                                        }`}>
                                            {opp.relevance}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Expanded Content */}
                            <AnimatePresence>
                                {activeCard === opp.id && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0 }}
                                        className="mt-3 pt-3 border-t border-gray-700"
                                    >
                                        <p className="text-gray-300 text-sm mb-3">{opp.summary}</p>
                                        <div className="flex items-center justify-between">
                                            <div className="flex gap-1.5">
                                                {opp.tags.map(tag => (
                                                    <span key={tag} className="px-2 py-0.5 bg-gray-700 text-gray-300 rounded text-xs">
                                                        {tag}
                                                    </span>
                                                ))}
                                            </div>
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); toggleSave(opp.id); }}
                                                    className={`p-1.5 rounded transition-colors ${
                                                        savedItems.includes(opp.id)
                                                            ? 'bg-amber-500/20 text-amber-400'
                                                            : 'bg-gray-700 text-gray-400 hover:text-white'
                                                    }`}
                                                >
                                                    <Star className={`w-3.5 h-3.5 ${savedItems.includes(opp.id) ? 'fill-current' : ''}`} />
                                                </button>
                                                <button className="p-1.5 rounded bg-gray-700 text-gray-400 hover:text-white transition-colors">
                                                    <ExternalLink className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>

            {/* Footer Stats */}
            {!showTyping && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.6 }}
                    className="flex items-center justify-between pt-2 border-t border-gray-700 text-xs text-gray-500"
                >
                    <span>3 opportunities found today</span>
                    <span className="text-indigo-400">View all →</span>
                </motion.div>
            )}
        </div>
    );
}
