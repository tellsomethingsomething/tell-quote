import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const statusStages = [
    { id: 'pending', label: 'Pending', color: 'bg-gray-500' },
    { id: 'in-progress', label: 'In Progress', color: 'bg-blue-500' },
    { id: 'review', label: 'Review', color: 'bg-amber-500' },
    { id: 'delivered', label: 'Delivered', color: 'bg-green-500' },
];

const typeFilters = ['All', 'Video', 'Photo', 'Audio'];

const initialDeliverables = [
    { id: 1, name: 'Hero Video 60s', type: 'Video', status: 'review', version: 2, dueDate: '2024-03-20', isOverdue: false },
    { id: 2, name: 'Social Cuts (3x)', type: 'Video', status: 'in-progress', version: 1, dueDate: '2024-03-18', isOverdue: true },
    { id: 3, name: 'BTS Photos', type: 'Photo', status: 'delivered', version: 1, dueDate: '2024-03-15', isOverdue: false },
    { id: 4, name: 'Voice Over', type: 'Audio', status: 'pending', version: 0, dueDate: '2024-03-22', isOverdue: false },
    { id: 5, name: 'Thumbnails', type: 'Photo', status: 'review', version: 3, dueDate: '2024-03-19', isOverdue: false },
];

export default function DeliverablesDemo() {
    const [deliverables, setDeliverables] = useState(initialDeliverables);
    const [typeFilter, setTypeFilter] = useState('All');
    const [selectedDeliverable, setSelectedDeliverable] = useState(null);
    const [showVersionModal, setShowVersionModal] = useState(null);

    const filteredDeliverables = deliverables.filter(d =>
        typeFilter === 'All' || d.type === typeFilter
    );

    const handleStatusChange = (id, newStatus) => {
        setDeliverables(deliverables.map(d =>
            d.id === id ? { ...d, status: newStatus, isOverdue: false } : d
        ));
    };

    const handleAddVersion = (id) => {
        setDeliverables(deliverables.map(d =>
            d.id === id ? { ...d, version: d.version + 1, status: 'review' } : d
        ));
        setShowVersionModal(null);
    };

    const getTypeIcon = (type) => {
        switch (type) {
            case 'Video':
                return (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                );
            case 'Photo':
                return (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                );
            case 'Audio':
                return (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                    </svg>
                );
            default:
                return null;
        }
    };

    const getStatusColor = (status) => {
        return statusStages.find(s => s.id === status)?.color || 'bg-gray-500';
    };

    return (
        <div className="p-3 sm:p-6 space-y-3 sm:space-y-4 max-w-full overflow-hidden">
            {/* Header with Filter */}
            <div className="flex items-center justify-between gap-2">
                <h3 className="text-white font-semibold text-sm sm:text-base">Project Deliverables</h3>
                <div className="flex gap-1 overflow-x-auto flex-shrink-0">
                    {typeFilters.map(type => (
                        <button
                            key={type}
                            onClick={() => setTypeFilter(type)}
                            className={`min-h-[36px] sm:min-h-0 px-2 sm:px-2 py-1.5 sm:py-1 rounded text-xs font-medium transition-colors whitespace-nowrap ${typeFilter === type
                                    ? 'bg-indigo-600 text-white'
                                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                                }`}
                        >
                            {type}
                        </button>
                    ))}
                </div>
            </div>

            {/* Deliverables List */}
            <div className="space-y-2">
                <AnimatePresence mode="popLayout">
                    {filteredDeliverables.map((item) => (
                        <motion.div
                            key={item.id}
                            layout
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className={`bg-gray-800/50 border rounded-lg p-2 sm:p-3 ${item.isOverdue
                                    ? 'border-red-500/50'
                                    : 'border-gray-700/50'
                                }`}
                        >
                            <div className="flex items-start gap-2 sm:gap-3">
                                {/* Type Icon */}
                                <div className="text-gray-400 mt-0.5 flex-shrink-0">
                                    {getTypeIcon(item.type)}
                                </div>

                                {/* Content */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-1 sm:gap-2 mb-1 flex-wrap">
                                        <h4 className="text-white text-xs sm:text-sm font-medium truncate max-w-[120px] sm:max-w-none">{item.name}</h4>
                                        {item.version > 0 && (
                                            <span className="text-gray-500 text-[10px] sm:text-xs">v{item.version}</span>
                                        )}
                                        {item.isOverdue && (
                                            <span className="text-red-400 text-[10px] sm:text-xs font-medium">Overdue</span>
                                        )}
                                    </div>

                                    <div className="flex items-center gap-2 sm:gap-3 text-[10px] sm:text-xs flex-wrap">
                                        <span className="text-gray-500">Due: {item.dueDate}</span>

                                        {/* Status Dropdown */}
                                        <select
                                            value={item.status}
                                            onChange={(e) => handleStatusChange(item.id, e.target.value)}
                                            className={`min-h-[32px] sm:min-h-0 px-1 sm:px-2 py-0.5 rounded text-[10px] sm:text-xs font-medium bg-opacity-20 border-0 cursor-pointer focus:outline-none ${getStatusColor(item.status)} ${item.status === 'delivered' ? 'text-green-400' :
                                                    item.status === 'review' ? 'text-amber-400' :
                                                        item.status === 'in-progress' ? 'text-blue-400' :
                                                            'text-gray-400'
                                                }`}
                                            style={{ backgroundColor: 'transparent' }}
                                        >
                                            {statusStages.map(stage => (
                                                <option key={stage.id} value={stage.id} className="bg-gray-800">
                                                    {stage.label}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                {/* Add Version Button */}
                                <button
                                    onClick={() => setShowVersionModal(item)}
                                    className="min-w-[36px] min-h-[36px] sm:min-w-0 sm:min-h-0 text-gray-500 hover:text-indigo-400 transition-colors p-2 sm:p-1 flex items-center justify-center flex-shrink-0"
                                    title="Add version"
                                >
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                    </svg>
                                </button>
                            </div>

                            {/* Progress Bar */}
                            <div className="mt-2 h-1 bg-gray-700 rounded-full overflow-hidden">
                                <motion.div
                                    className={getStatusColor(item.status)}
                                    initial={{ width: 0 }}
                                    animate={{
                                        width: item.status === 'pending' ? '0%' :
                                            item.status === 'in-progress' ? '33%' :
                                                item.status === 'review' ? '66%' : '100%'
                                    }}
                                    transition={{ duration: 0.3 }}
                                />
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>

            {/* Summary Stats */}
            <div className="overflow-x-auto -mx-3 px-3 sm:mx-0 sm:px-0">
                <div className="grid grid-cols-4 gap-1 sm:gap-2 min-w-[280px] sm:min-w-0">
                    {statusStages.map(stage => {
                        const count = deliverables.filter(d => d.status === stage.id).length;
                        return (
                            <div
                                key={stage.id}
                                className="bg-gray-800/30 rounded-lg p-1.5 sm:p-2 text-center"
                            >
                                <p className="text-white font-bold text-base sm:text-lg">{count}</p>
                                <p className="text-gray-500 text-[10px] sm:text-xs truncate">{stage.label}</p>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Add Version Modal */}
            <AnimatePresence>
                {showVersionModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-black/60 flex items-center justify-center p-3 sm:p-4 z-20"
                        onClick={() => setShowVersionModal(null)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-gray-800 rounded-xl p-4 sm:p-5 max-w-sm w-full border border-gray-700"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <h3 className="text-white font-bold text-base sm:text-lg mb-2">Add New Version</h3>
                            <p className="text-gray-400 text-xs sm:text-sm mb-4">
                                Create v{showVersionModal.version + 1} of "{showVersionModal.name}"
                            </p>

                            <textarea
                                placeholder="Version notes (optional)..."
                                className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white text-sm placeholder-gray-500 focus:outline-none focus:border-indigo-500 resize-none h-20 mb-4"
                            />

                            <div className="flex gap-2">
                                <button
                                    onClick={() => setShowVersionModal(null)}
                                    className="flex-1 min-h-[44px] py-2 bg-gray-700 text-gray-300 rounded-lg text-sm"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={() => handleAddVersion(showVersionModal.id)}
                                    className="flex-1 min-h-[44px] py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm"
                                >
                                    Create v{showVersionModal.version + 1}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <p className="text-center text-gray-500 text-xs sm:text-sm">
                Change status or add versions
            </p>
        </div>
    );
}
