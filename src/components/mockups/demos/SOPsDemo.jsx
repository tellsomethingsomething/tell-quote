import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const categories = [
    { id: 'production', label: 'Production', icon: '🎬', color: 'bg-indigo-500' },
    { id: 'technical', label: 'Technical', icon: '🔧', color: 'bg-blue-500' },
    { id: 'safety', label: 'Safety', icon: '⚠️', color: 'bg-amber-500' },
    { id: 'client', label: 'Client', icon: '🤝', color: 'bg-green-500' },
];

const initialSops = [
    {
        id: 1,
        title: 'Pre-Production Checklist',
        category: 'production',
        checklist: [
            { id: 1, text: 'Confirm shoot dates with client', completed: true },
            { id: 2, text: 'Book crew and send call sheets', completed: true },
            { id: 3, text: 'Reserve equipment from kit list', completed: false },
            { id: 4, text: 'Scout location and confirm permits', completed: false },
            { id: 5, text: 'Prepare shot list and storyboards', completed: false },
        ],
    },
    {
        id: 2,
        title: 'Camera Setup Protocol',
        category: 'technical',
        checklist: [
            { id: 1, text: 'Check all batteries are charged', completed: true },
            { id: 2, text: 'Format media cards', completed: true },
            { id: 3, text: 'Test wireless audio system', completed: true },
            { id: 4, text: 'White balance and exposure check', completed: false },
            { id: 5, text: 'Verify backup recording device', completed: false },
        ],
    },
    {
        id: 3,
        title: 'On-Set Safety Briefing',
        category: 'safety',
        checklist: [
            { id: 1, text: 'Locate fire exits and first aid kit', completed: true },
            { id: 2, text: 'Brief crew on safety protocols', completed: false },
            { id: 3, text: 'Check cable runs and trip hazards', completed: false },
            { id: 4, text: 'Confirm emergency contact numbers', completed: false },
        ],
    },
];

export default function SOPsDemo() {
    const [sops, setSops] = useState(initialSops);
    const [activeCategory, setActiveCategory] = useState('all');
    const [expandedSop, setExpandedSop] = useState(1);
    const [showAddItem, setShowAddItem] = useState(null);
    const [newItemText, setNewItemText] = useState('');

    const filteredSops = activeCategory === 'all'
        ? sops
        : sops.filter(s => s.category === activeCategory);

    const handleToggleItem = (sopId, itemId) => {
        setSops(sops.map(sop => {
            if (sop.id === sopId) {
                return {
                    ...sop,
                    checklist: sop.checklist.map(item =>
                        item.id === itemId ? { ...item, completed: !item.completed } : item
                    ),
                };
            }
            return sop;
        }));
    };

    const handleAddItem = (sopId) => {
        if (!newItemText.trim()) return;
        setSops(sops.map(sop => {
            if (sop.id === sopId) {
                return {
                    ...sop,
                    checklist: [
                        ...sop.checklist,
                        { id: Date.now(), text: newItemText, completed: false },
                    ],
                };
            }
            return sop;
        }));
        setNewItemText('');
        setShowAddItem(null);
    };

    const getProgress = (checklist) => {
        const completed = checklist.filter(i => i.completed).length;
        return Math.round((completed / checklist.length) * 100);
    };

    const getCategoryColor = (categoryId) => {
        return categories.find(c => c.id === categoryId)?.color || 'bg-gray-500';
    };

    return (
        <div className="p-3 sm:p-6 space-y-3 sm:space-y-4 max-w-full overflow-hidden">
            {/* Header with Categories */}
            <div className="flex items-center justify-between gap-2">
                <h3 className="text-white font-semibold text-sm sm:text-base">Standard Operating Procedures</h3>
                <div className="flex gap-1 overflow-x-auto flex-shrink-0">
                    <button
                        onClick={() => setActiveCategory('all')}
                        className={`min-h-[44px] sm:min-h-0 px-2 sm:px-3 py-1.5 sm:py-1 rounded text-xs font-medium transition-colors whitespace-nowrap ${
                            activeCategory === 'all'
                                ? 'bg-indigo-600 text-white'
                                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                        }`}
                    >
                        All
                    </button>
                    {categories.map(cat => (
                        <button
                            key={cat.id}
                            onClick={() => setActiveCategory(cat.id)}
                            className={`min-h-[44px] sm:min-h-0 px-2 sm:px-3 py-1.5 sm:py-1 rounded text-xs font-medium transition-colors whitespace-nowrap ${
                                activeCategory === cat.id
                                    ? 'bg-indigo-600 text-white'
                                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                            }`}
                        >
                            <span className="hidden sm:inline mr-1">{cat.icon}</span>
                            {cat.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* SOPs List */}
            <div className="space-y-2">
                <AnimatePresence mode="popLayout">
                    {filteredSops.map((sop) => {
                        const progress = getProgress(sop.checklist);
                        const isExpanded = expandedSop === sop.id;

                        return (
                            <motion.div
                                key={sop.id}
                                layout
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="bg-gray-800/50 border border-gray-700/50 rounded-lg overflow-hidden"
                            >
                                {/* SOP Header */}
                                <button
                                    onClick={() => setExpandedSop(isExpanded ? null : sop.id)}
                                    className="w-full p-3 flex items-center justify-between text-left hover:bg-gray-700/30 transition-colors"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`w-2 h-2 rounded-full ${getCategoryColor(sop.category)}`} />
                                        <span className="text-white font-medium text-sm">{sop.title}</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        {/* Progress */}
                                        <div className="flex items-center gap-2">
                                            <div className="w-16 h-1.5 bg-gray-700 rounded-full overflow-hidden">
                                                <motion.div
                                                    className={`h-full ${progress === 100 ? 'bg-green-500' : 'bg-indigo-500'}`}
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${progress}%` }}
                                                    transition={{ duration: 0.3 }}
                                                />
                                            </div>
                                            <span className="text-xs text-gray-400 w-8">{progress}%</span>
                                        </div>
                                        {/* Expand Icon */}
                                        <motion.svg
                                            animate={{ rotate: isExpanded ? 180 : 0 }}
                                            className="w-4 h-4 text-gray-400"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            stroke="currentColor"
                                        >
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                        </motion.svg>
                                    </div>
                                </button>

                                {/* Checklist Items */}
                                <AnimatePresence>
                                    {isExpanded && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: 'auto', opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            transition={{ duration: 0.2 }}
                                            className="border-t border-gray-700/50"
                                        >
                                            <div className="p-3 space-y-2">
                                                {sop.checklist.map((item, idx) => (
                                                    <motion.div
                                                        key={item.id}
                                                        initial={{ opacity: 0, x: -10 }}
                                                        animate={{ opacity: 1, x: 0 }}
                                                        transition={{ delay: idx * 0.05 }}
                                                        className="flex items-center gap-3"
                                                    >
                                                        <button
                                                            onClick={() => handleToggleItem(sop.id, item.id)}
                                                            className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                                                                item.completed
                                                                    ? 'bg-green-500 border-green-500'
                                                                    : 'border-gray-600 hover:border-gray-500'
                                                            }`}
                                                        >
                                                            {item.completed && (
                                                                <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                                                </svg>
                                                            )}
                                                        </button>
                                                        <span className={`text-sm ${item.completed ? 'text-gray-500 line-through' : 'text-gray-300'}`}>
                                                            {item.text}
                                                        </span>
                                                    </motion.div>
                                                ))}

                                                {/* Add Item Input */}
                                                {showAddItem === sop.id ? (
                                                    <motion.div
                                                        initial={{ opacity: 0, y: -5 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        className="flex items-center gap-2 mt-2"
                                                    >
                                                        <input
                                                            type="text"
                                                            value={newItemText}
                                                            onChange={(e) => setNewItemText(e.target.value)}
                                                            onKeyDown={(e) => e.key === 'Enter' && handleAddItem(sop.id)}
                                                            placeholder="Add new item..."
                                                            className="flex-1 bg-gray-700/50 border border-gray-600 rounded px-3 py-1.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500"
                                                            autoFocus
                                                        />
                                                        <button
                                                            onClick={() => handleAddItem(sop.id)}
                                                            className="px-3 py-1.5 bg-indigo-600 text-white rounded text-xs font-medium hover:bg-indigo-500"
                                                        >
                                                            Add
                                                        </button>
                                                        <button
                                                            onClick={() => { setShowAddItem(null); setNewItemText(''); }}
                                                            className="px-2 py-1.5 text-gray-400 hover:text-gray-300"
                                                        >
                                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                            </svg>
                                                        </button>
                                                    </motion.div>
                                                ) : (
                                                    <button
                                                        onClick={() => setShowAddItem(sop.id)}
                                                        className="flex items-center gap-2 text-indigo-400 text-xs hover:text-indigo-300 mt-2"
                                                    >
                                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                                        </svg>
                                                        Add checklist item
                                                    </button>
                                                )}
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </motion.div>
                        );
                    })}
                </AnimatePresence>
            </div>

            {/* AI Generate Hint */}
            <div className="bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border border-indigo-500/20 rounded-lg p-3 flex items-center gap-3">
                <div className="w-8 h-8 bg-indigo-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg className="w-4 h-4 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                </div>
                <div className="flex-1">
                    <p className="text-xs text-indigo-300">
                        <span className="font-medium">AI-Powered:</span> Generate SOPs from your past projects or industry best practices
                    </p>
                </div>
            </div>
        </div>
    );
}
