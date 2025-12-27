import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Clock, Check, Eye, MousePointer, Play, Pause, ChevronRight } from 'lucide-react';

const sequenceSteps = [
    {
        id: 1,
        name: 'Initial Follow-up',
        delay: 'Day 3',
        subject: 'Following up on our quote',
        status: 'sent',
        stats: { sent: 142, opened: 98, clicked: 34 }
    },
    {
        id: 2,
        name: 'Value Add',
        delay: 'Day 7',
        subject: 'Quick case study you might like',
        status: 'sent',
        stats: { sent: 89, opened: 52, clicked: 18 }
    },
    {
        id: 3,
        name: 'Final Check-in',
        delay: 'Day 14',
        subject: 'Any questions on our proposal?',
        status: 'active',
        stats: { sent: 45, opened: 28, clicked: 12 }
    },
];

const recentActivity = [
    { name: 'Sarah Chen', action: 'opened', email: 'Following up on our quote', time: '2m ago' },
    { name: 'Mike Roberts', action: 'clicked', email: 'Quick case study you might like', time: '15m ago' },
    { name: 'Emma Wilson', action: 'replied', email: 'Any questions on our proposal?', time: '1h ago' },
];

export default function EmailSequencesDemo() {
    const [activeStep, setActiveStep] = useState(null);
    const [isPlaying, setIsPlaying] = useState(true);
    const [showActivity, setShowActivity] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => setShowActivity(true), 1500);
        return () => clearTimeout(timer);
    }, []);

    return (
        <div className="p-3 sm:p-6 space-y-4 max-w-full overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center">
                        <Mail className="w-4 h-4 text-blue-400" />
                    </div>
                    <div>
                        <h3 className="text-white font-semibold text-sm sm:text-base">Quote Follow-up Sequence</h3>
                        <p className="text-gray-500 text-xs">3 steps • 14 day duration</p>
                    </div>
                </div>
                <button
                    onClick={() => setIsPlaying(!isPlaying)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors ${
                        isPlaying
                            ? 'bg-green-500/20 text-green-400'
                            : 'bg-gray-700 text-gray-400'
                    }`}
                >
                    {isPlaying ? <Play className="w-3 h-3" /> : <Pause className="w-3 h-3" />}
                    {isPlaying ? 'Active' : 'Paused'}
                </button>
            </div>

            {/* Sequence Steps */}
            <div className="space-y-2">
                {sequenceSteps.map((step, index) => (
                    <motion.div
                        key={step.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.15 }}
                        className={`p-3 rounded-lg border transition-all cursor-pointer ${
                            activeStep === step.id
                                ? 'border-blue-500/50 bg-blue-500/5'
                                : 'border-gray-700 bg-gray-800/50 hover:border-gray-600'
                        }`}
                        onClick={() => setActiveStep(activeStep === step.id ? null : step.id)}
                    >
                        <div className="flex items-center gap-3">
                            {/* Step Number */}
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                                step.status === 'sent'
                                    ? 'bg-green-500/20 text-green-400'
                                    : 'bg-blue-500/20 text-blue-400'
                            }`}>
                                {step.status === 'sent' ? (
                                    <Check className="w-4 h-4" />
                                ) : (
                                    <span className="text-sm font-bold">{step.id}</span>
                                )}
                            </div>

                            {/* Step Info */}
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                    <p className="text-white text-sm font-medium truncate">{step.name}</p>
                                    <span className="px-1.5 py-0.5 bg-gray-700 text-gray-400 rounded text-xs flex items-center gap-1">
                                        <Clock className="w-2.5 h-2.5" />
                                        {step.delay}
                                    </span>
                                </div>
                                <p className="text-gray-500 text-xs truncate mt-0.5">"{step.subject}"</p>
                            </div>

                            {/* Stats */}
                            <div className="hidden sm:flex items-center gap-3 text-xs">
                                <span className="text-gray-400 flex items-center gap-1">
                                    <Mail className="w-3 h-3" />
                                    {step.stats.sent}
                                </span>
                                <span className="text-blue-400 flex items-center gap-1">
                                    <Eye className="w-3 h-3" />
                                    {Math.round((step.stats.opened / step.stats.sent) * 100)}%
                                </span>
                                <span className="text-green-400 flex items-center gap-1">
                                    <MousePointer className="w-3 h-3" />
                                    {Math.round((step.stats.clicked / step.stats.sent) * 100)}%
                                </span>
                            </div>

                            <ChevronRight className={`w-4 h-4 text-gray-500 transition-transform ${
                                activeStep === step.id ? 'rotate-90' : ''
                            }`} />
                        </div>

                        {/* Expanded Stats */}
                        <AnimatePresence>
                            {activeStep === step.id && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="mt-3 pt-3 border-t border-gray-700"
                                >
                                    <div className="grid grid-cols-3 gap-2">
                                        <div className="text-center p-2 bg-gray-800 rounded">
                                            <div className="text-lg font-bold text-white">{step.stats.sent}</div>
                                            <div className="text-xs text-gray-500">Sent</div>
                                        </div>
                                        <div className="text-center p-2 bg-gray-800 rounded">
                                            <div className="text-lg font-bold text-blue-400">{step.stats.opened}</div>
                                            <div className="text-xs text-gray-500">Opened</div>
                                        </div>
                                        <div className="text-center p-2 bg-gray-800 rounded">
                                            <div className="text-lg font-bold text-green-400">{step.stats.clicked}</div>
                                            <div className="text-xs text-gray-500">Clicked</div>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>
                ))}
            </div>

            {/* Recent Activity */}
            <AnimatePresence>
                {showActivity && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="pt-3 border-t border-gray-700"
                    >
                        <h4 className="text-gray-400 text-xs font-medium mb-2">Recent Activity</h4>
                        <div className="space-y-1.5">
                            {recentActivity.map((activity, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: i * 0.1 }}
                                    className="flex items-center gap-2 text-xs"
                                >
                                    <span className={`w-1.5 h-1.5 rounded-full ${
                                        activity.action === 'replied' ? 'bg-green-400' :
                                        activity.action === 'clicked' ? 'bg-blue-400' : 'bg-gray-400'
                                    }`} />
                                    <span className="text-white font-medium">{activity.name}</span>
                                    <span className="text-gray-500">{activity.action}</span>
                                    <span className="text-gray-600 truncate flex-1">"{activity.email}"</span>
                                    <span className="text-gray-600">{activity.time}</span>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
