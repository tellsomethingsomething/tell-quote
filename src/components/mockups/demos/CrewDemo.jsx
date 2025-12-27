import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCurrency } from '../../../hooks/useCurrency';

const demoCrew = [
    { id: 1, name: 'James Chen', role: 'Director of Photography', rate: 1200, available: true, skills: ['Sony', 'RED', 'Drone'], location: 'Los Angeles', rating: 5 },
    { id: 2, name: 'Sarah Miller', role: 'Editor', rate: 650, available: true, skills: ['Premiere', 'DaVinci', 'After Effects'], location: 'New York', rating: 5 },
    { id: 3, name: 'Mike Torres', role: 'Gaffer', rate: 550, available: false, skills: ['LED', 'HMI', 'Grip'], location: 'London', rating: 4 },
    { id: 4, name: 'Emma Wilson', role: 'Sound Recordist', rate: 480, available: true, skills: ['Sennheiser', 'Boom', 'Lavs'], location: 'Sydney', rating: 5 },
    { id: 5, name: 'David Park', role: 'Director of Photography', rate: 950, available: true, skills: ['ARRI', 'Sony', 'Steadicam'], location: 'Vancouver', rating: 4 },
    { id: 6, name: 'Lisa Chen', role: 'Producer', rate: 800, available: false, skills: ['Budgeting', 'Scheduling', 'Client'], location: 'Singapore', rating: 5 },
];

const roleFilters = ['All', 'DP', 'Editor', 'Gaffer', 'Sound', 'Producer'];

export default function CrewDemo() {
    const { formatDayRate } = useCurrency();
    const [searchTerm, setSearchTerm] = useState('');
    const [roleFilter, setRoleFilter] = useState('All');
    const [showAvailableOnly, setShowAvailableOnly] = useState(false);
    const [selectedCrew, setSelectedCrew] = useState(null);

    const filteredCrew = useMemo(() => {
        return demoCrew.filter(crew => {
            // Search filter
            const matchesSearch = searchTerm === '' ||
                crew.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                crew.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
                crew.skills.some(s => s.toLowerCase().includes(searchTerm.toLowerCase()));

            // Role filter
            const matchesRole = roleFilter === 'All' ||
                (roleFilter === 'DP' && crew.role.includes('Photography')) ||
                crew.role.toLowerCase().includes(roleFilter.toLowerCase());

            // Availability filter
            const matchesAvailability = !showAvailableOnly || crew.available;

            return matchesSearch && matchesRole && matchesAvailability;
        });
    }, [searchTerm, roleFilter, showAvailableOnly]);

    return (
        <div className="p-3 sm:p-6 space-y-3 sm:space-y-4 max-w-full overflow-hidden">
            {/* Search and Filters */}
            <div className="space-y-2 sm:space-y-3">
                {/* Search Input */}
                <div className="relative">
                    <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <input
                        type="text"
                        placeholder="Search name, role, skill..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 sm:py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm placeholder-gray-500 focus:outline-none focus:border-indigo-500"
                    />
                </div>

                {/* Filters Row - Horizontal scroll on mobile */}
                <div className="flex items-center gap-2">
                    <div className="flex gap-1 overflow-x-auto -mx-3 px-3 sm:mx-0 sm:px-0 pb-1 sm:pb-0 flex-1">
                        {roleFilters.map(role => (
                            <button
                                key={role}
                                onClick={() => setRoleFilter(role)}
                                className={`min-h-[36px] sm:min-h-0 px-3 py-1.5 sm:py-1 rounded-full text-xs font-medium transition-colors whitespace-nowrap ${roleFilter === role
                                        ? 'bg-indigo-600 text-white'
                                        : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                                    }`}
                            >
                                {role}
                            </button>
                        ))}
                    </div>

                    {/* Available Toggle */}
                    <button
                        onClick={() => setShowAvailableOnly(!showAvailableOnly)}
                        className={`min-h-[36px] sm:min-h-0 flex items-center gap-2 px-3 py-1.5 sm:py-1 rounded-full text-xs font-medium transition-colors whitespace-nowrap flex-shrink-0 ${showAvailableOnly
                                ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                            }`}
                    >
                        <div className={`w-2 h-2 rounded-full ${showAvailableOnly ? 'bg-green-400' : 'bg-gray-500'}`} />
                        <span className="hidden sm:inline">Available</span>
                        <span className="sm:hidden">Avail</span>
                    </button>
                </div>
            </div>

            {/* Crew Grid */}
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3">
                <AnimatePresence mode="popLayout">
                    {filteredCrew.map((crew) => (
                        <motion.div
                            key={crew.id}
                            layout
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            onClick={() => setSelectedCrew(crew)}
                            className="bg-gray-800/50 border border-gray-700/50 rounded-lg p-2 sm:p-3 cursor-pointer hover:border-indigo-500/50 transition-colors min-h-[100px]"
                        >
                            <div className="flex items-start gap-2 sm:gap-3 mb-2">
                                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-xs sm:text-sm shrink-0">
                                    {crew.name.split(' ').map(n => n[0]).join('')}
                                </div>
                                <div className="min-w-0 flex-1">
                                    <h4 className="text-white text-xs sm:text-sm font-medium truncate">{crew.name}</h4>
                                    <p className="text-gray-500 text-[10px] sm:text-xs truncate">{crew.role}</p>
                                </div>
                            </div>

                            <div className="flex items-center justify-between">
                                <span className="text-indigo-400 text-xs sm:text-sm font-bold">{formatDayRate(crew.rate)}</span>
                                <span className={`text-[10px] px-1.5 sm:px-2 py-0.5 rounded-full ${crew.available
                                        ? 'bg-green-500/20 text-green-400'
                                        : 'bg-red-500/20 text-red-400'
                                    }`}>
                                    {crew.available ? 'Avail' : 'Busy'}
                                </span>
                            </div>

                            {/* Skills - hide on very small screens */}
                            <div className="hidden sm:flex flex-wrap gap-1 mt-2">
                                {crew.skills.slice(0, 2).map((skill) => (
                                    <span key={skill} className="text-[10px] px-1.5 py-0.5 bg-gray-700/50 text-gray-400 rounded">
                                        {skill}
                                    </span>
                                ))}
                                {crew.skills.length > 2 && (
                                    <span className="text-[10px] text-gray-500">+{crew.skills.length - 2}</span>
                                )}
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>

            {/* Empty State */}
            {filteredCrew.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                    <p className="text-sm">No crew match your search</p>
                    <button
                        onClick={() => { setSearchTerm(''); setRoleFilter('All'); setShowAvailableOnly(false); }}
                        className="text-indigo-400 text-sm mt-2 hover:underline"
                    >
                        Clear filters
                    </button>
                </div>
            )}

            {/* Crew Detail Modal */}
            <AnimatePresence>
                {selectedCrew && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-black/60 flex items-center justify-center p-3 sm:p-4 z-20"
                        onClick={() => setSelectedCrew(null)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-gray-800 rounded-xl p-4 sm:p-5 max-w-sm w-full border border-gray-700"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="flex items-start gap-3 sm:gap-4 mb-4">
                                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-base sm:text-lg flex-shrink-0">
                                    {selectedCrew.name.split(' ').map(n => n[0]).join('')}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className="text-white font-bold text-base sm:text-lg truncate">{selectedCrew.name}</h3>
                                    <p className="text-gray-400 text-sm truncate">{selectedCrew.role}</p>
                                    <div className="flex items-center gap-1 mt-1">
                                        {[...Array(5)].map((_, i) => (
                                            <svg
                                                key={i}
                                                className={`w-3 h-3 ${i < selectedCrew.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-600'}`}
                                                viewBox="0 0 24 24"
                                            >
                                                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                                            </svg>
                                        ))}
                                    </div>
                                </div>
                                <button
                                    onClick={() => setSelectedCrew(null)}
                                    className="min-w-[44px] min-h-[44px] flex items-center justify-center text-gray-500 hover:text-white hover:bg-gray-700/50 rounded-lg transition-colors flex-shrink-0"
                                >
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>

                            <div className="space-y-3">
                                <div className="flex justify-between">
                                    <span className="text-gray-400 text-sm">Day Rate</span>
                                    <span className="text-indigo-400 font-bold">{formatDayRate(selectedCrew.rate)}</span>
                                </div>

                                <div className="flex justify-between">
                                    <span className="text-gray-400 text-sm">Location</span>
                                    <span className="text-white text-sm">{selectedCrew.location}</span>
                                </div>

                                <div className="flex justify-between items-center">
                                    <span className="text-gray-400 text-sm">Status</span>
                                    <span className={`px-2 py-0.5 rounded text-xs ${selectedCrew.available
                                            ? 'bg-green-500/20 text-green-400'
                                            : 'bg-red-500/20 text-red-400'
                                        }`}>
                                        {selectedCrew.available ? 'Available' : 'Booked'}
                                    </span>
                                </div>

                                <div>
                                    <span className="text-gray-400 text-sm block mb-2">Skills</span>
                                    <div className="flex flex-wrap gap-1">
                                        {selectedCrew.skills.map((skill) => (
                                            <span key={skill} className="text-xs px-2 py-1 bg-gray-700/50 text-gray-300 rounded">
                                                {skill}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <button
                                disabled
                                className="w-full mt-4 min-h-[44px] py-2 bg-gray-700 text-gray-400 rounded-lg text-sm cursor-not-allowed"
                            >
                                Book for Project
                            </button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <p className="text-center text-gray-500 text-xs sm:text-sm">
                Search, filter, or click to view profiles
            </p>
        </div>
    );
}
