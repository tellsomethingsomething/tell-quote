import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const initialEquipment = [
    { id: 1, name: 'Sony FX6', category: 'Camera', serial: 'FX6-2341', status: 'available', condition: 'Excellent' },
    { id: 2, name: 'Sony FX3', category: 'Camera', serial: 'FX3-1892', status: 'available', condition: 'Good' },
    { id: 3, name: 'Aputure 600d', category: 'Lighting', serial: 'AP-8821', status: 'checked-out', holder: 'Nike Campaign', condition: 'Excellent' },
    { id: 4, name: 'Aputure 300d II', category: 'Lighting', serial: 'AP-5543', status: 'available', condition: 'Good' },
    { id: 5, name: 'Sennheiser MKH416', category: 'Audio', serial: 'SN-1123', status: 'available', condition: 'Excellent' },
    { id: 6, name: 'Wireless Lav Kit', category: 'Audio', serial: 'WL-7721', status: 'checked-out', holder: 'Corporate Video', condition: 'Good' },
];

const projects = ['Nike Campaign', 'Corporate Video', 'Product Shoot'];
const categories = ['All', 'Camera', 'Lighting', 'Audio'];

export default function EquipmentDemo() {
    const [equipment, setEquipment] = useState(initialEquipment);
    const [categoryFilter, setCategoryFilter] = useState('All');
    const [showAvailableOnly, setShowAvailableOnly] = useState(false);
    const [checkoutModal, setCheckoutModal] = useState(null);
    const [selectedProject, setSelectedProject] = useState(projects[0]);
    const [showConflict, setShowConflict] = useState(false);

    const filteredEquipment = equipment.filter(item => {
        const matchesCategory = categoryFilter === 'All' || item.category === categoryFilter;
        const matchesAvailability = !showAvailableOnly || item.status === 'available';
        return matchesCategory && matchesAvailability;
    });

    const handleCheckout = (item) => {
        if (item.status === 'checked-out') {
            // Show conflict warning
            setShowConflict(item);
            setTimeout(() => setShowConflict(null), 2000);
            return;
        }
        setCheckoutModal(item);
    };

    const confirmCheckout = () => {
        setEquipment(equipment.map(item =>
            item.id === checkoutModal.id
                ? { ...item, status: 'checked-out', holder: selectedProject }
                : item
        ));
        setCheckoutModal(null);
    };

    const handleCheckin = (itemId) => {
        setEquipment(equipment.map(item =>
            item.id === itemId
                ? { ...item, status: 'available', holder: undefined }
                : item
        ));
    };

    const getCategoryIcon = (category) => {
        switch (category) {
            case 'Camera':
                return (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                );
            case 'Lighting':
                return (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                );
            case 'Audio':
                return (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                    </svg>
                );
            default:
                return null;
        }
    };

    return (
        <div className="p-3 sm:p-6 space-y-3 sm:space-y-4 max-w-full overflow-hidden">
            {/* Filters */}
            <div className="flex flex-wrap gap-2 items-center justify-between">
                <div className="flex gap-1 flex-wrap">
                    {categories.map(cat => (
                        <button
                            key={cat}
                            onClick={() => setCategoryFilter(cat)}
                            className={`min-h-[36px] sm:min-h-0 px-3 py-1.5 sm:py-1 rounded-full text-xs font-medium transition-colors ${categoryFilter === cat
                                    ? 'bg-indigo-600 text-white'
                                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                                }`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>

                <button
                    onClick={() => setShowAvailableOnly(!showAvailableOnly)}
                    className={`min-h-[36px] sm:min-h-0 flex items-center gap-2 px-3 py-1.5 sm:py-1 rounded-full text-xs font-medium transition-colors ${showAvailableOnly
                            ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                            : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                        }`}
                >
                    <div className={`w-2 h-2 rounded-full ${showAvailableOnly ? 'bg-green-400' : 'bg-gray-500'}`} />
                    <span className="hidden sm:inline">Available Only</span>
                    <span className="sm:hidden">Avail</span>
                </button>
            </div>

            {/* Equipment Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
                <AnimatePresence mode="popLayout">
                    {filteredEquipment.map((item) => (
                        <motion.div
                            key={item.id}
                            layout
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className={`bg-gray-800/50 border rounded-lg p-2 sm:p-3 ${showConflict?.id === item.id
                                    ? 'border-red-500 animate-pulse'
                                    : 'border-gray-700/50'
                                }`}
                        >
                            <div className="flex items-start justify-between mb-2">
                                <div className="flex items-center gap-1 sm:gap-2 text-gray-400">
                                    {getCategoryIcon(item.category)}
                                    <span className="text-[10px] sm:text-xs">{item.category}</span>
                                </div>
                                <span className={`text-[10px] px-1.5 sm:px-2 py-0.5 rounded-full ${item.status === 'available'
                                        ? 'bg-green-500/20 text-green-400'
                                        : 'bg-amber-500/20 text-amber-400'
                                    }`}>
                                    {item.status === 'available' ? 'Avail' : 'Out'}
                                </span>
                            </div>

                            <h4 className="text-white text-xs sm:text-sm font-medium mb-1 truncate">{item.name}</h4>
                            <p className="text-gray-500 text-[10px] sm:text-xs mb-2 truncate">SN: {item.serial}</p>

                            {item.holder && (
                                <p className="text-amber-400 text-[10px] sm:text-xs mb-2 truncate">
                                    → {item.holder}
                                </p>
                            )}

                            {/* Action Button */}
                            {item.status === 'available' ? (
                                <button
                                    onClick={() => handleCheckout(item)}
                                    className="w-full min-h-[36px] sm:min-h-0 py-1.5 sm:py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs rounded transition-colors"
                                >
                                    Check Out
                                </button>
                            ) : (
                                <button
                                    onClick={() => handleCheckin(item.id)}
                                    className="w-full min-h-[36px] sm:min-h-0 py-1.5 sm:py-1.5 bg-gray-700 hover:bg-gray-600 text-gray-300 text-xs rounded transition-colors"
                                >
                                    Check In
                                </button>
                            )}
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>

            {/* Conflict Warning Toast */}
            <AnimatePresence>
                {showConflict && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 20 }}
                        className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-red-500/90 text-white px-4 py-2 rounded-lg text-sm flex items-center gap-2"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        Already checked out to {showConflict.holder}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Checkout Modal */}
            <AnimatePresence>
                {checkoutModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-black/60 flex items-center justify-center p-3 sm:p-4 z-20"
                        onClick={() => setCheckoutModal(null)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-gray-800 rounded-xl p-4 sm:p-5 max-w-sm w-full border border-gray-700"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <h3 className="text-white font-bold text-base sm:text-lg mb-4">Check Out Equipment</h3>

                            <div className="bg-gray-900 rounded-lg p-3 mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="text-indigo-400">
                                        {getCategoryIcon(checkoutModal.category)}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="text-white font-medium text-sm sm:text-base truncate">{checkoutModal.name}</p>
                                        <p className="text-gray-500 text-xs">SN: {checkoutModal.serial}</p>
                                    </div>
                                </div>
                            </div>

                            <label className="block text-gray-400 text-sm mb-2">Assign to Project</label>
                            <select
                                value={selectedProject}
                                onChange={(e) => setSelectedProject(e.target.value)}
                                className="w-full min-h-[44px] px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white text-sm mb-4 focus:outline-none focus:border-indigo-500"
                            >
                                {projects.map(project => (
                                    <option key={project} value={project}>{project}</option>
                                ))}
                            </select>

                            <div className="flex gap-2">
                                <button
                                    onClick={() => setCheckoutModal(null)}
                                    className="flex-1 min-h-[44px] py-2 bg-gray-700 text-gray-300 rounded-lg text-sm"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={confirmCheckout}
                                    className="flex-1 min-h-[44px] py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm"
                                >
                                    Confirm
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <p className="text-center text-gray-500 text-xs sm:text-sm">
                Check out equipment to projects
            </p>
        </div>
    );
}
