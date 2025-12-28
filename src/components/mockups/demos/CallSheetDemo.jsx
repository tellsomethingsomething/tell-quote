import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const initialCallSheet = {
    project: 'Nike Spring Campaign',
    date: '2024-03-15',
    callTime: '07:00',
    location: 'Griffith Observatory',
    address: '2800 E Observatory Rd, Los Angeles, CA',
    crew: [
        { id: 1, role: 'Director', name: 'James Chen', call: '06:30' },
        { id: 2, role: 'DP', name: 'Sarah Miller', call: '07:00' },
        { id: 3, role: 'Gaffer', name: 'Mike Torres', call: '06:00' },
        { id: 4, role: 'Sound', name: 'Emma Wilson', call: '07:00' },
    ],
    weather: { temp: 68, conditions: 'Sunny', sunrise: '6:42am', sunset: '6:15pm' }
};

export default function CallSheetDemo() {
    const [callSheet, setCallSheet] = useState(initialCallSheet);
    const [editingCrew, setEditingCrew] = useState(null);
    const [showPreview, setShowPreview] = useState(false);

    const handleTimeChange = (crewId, newTime) => {
        setCallSheet({
            ...callSheet,
            crew: callSheet.crew.map(c =>
                c.id === crewId ? { ...c, call: newTime } : c
            )
        });
        setEditingCrew(null);
    };

    const handleGeneralCallChange = (newTime) => {
        setCallSheet({ ...callSheet, callTime: newTime });
    };

    return (
        <div className="p-3 sm:p-6 space-y-3 sm:space-y-4 max-w-full overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between gap-2">
                <div className="min-w-0 flex-1 text-left">
                    <h3 className="text-white font-semibold text-base sm:text-lg truncate">{callSheet.project}</h3>
                    <p className="text-gray-400 text-xs sm:text-sm">{callSheet.date}</p>
                </div>
                <button
                    onClick={() => setShowPreview(!showPreview)}
                    className={`min-h-[44px] min-w-[80px] px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex-shrink-0 ${showPreview
                            ? 'bg-indigo-600 text-white'
                            : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                        }`}
                >
                    {showPreview ? 'Edit' : 'Preview'}
                </button>
            </div>

            <AnimatePresence mode="wait">
                {showPreview ? (
                    /* PDF Preview */
                    <motion.div
                        key="preview"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="bg-white rounded-lg p-3 sm:p-4 text-gray-900 space-y-3 sm:space-y-4 min-h-[280px] sm:min-h-[320px]"
                    >
                        {/* Preview Header */}
                        <div className="border-b border-gray-200 pb-2 sm:pb-3">
                            <h2 className="text-lg sm:text-xl font-bold text-gray-900 truncate">{callSheet.project}</h2>
                            <p className="text-gray-600 text-xs sm:text-sm">Call Sheet - {callSheet.date}</p>
                        </div>

                        {/* Preview Details Grid */}
                        <div className="grid grid-cols-2 gap-3 sm:gap-4 text-xs sm:text-sm">
                            <div>
                                <span className="text-gray-500 text-[10px] sm:text-xs uppercase">General Call</span>
                                <p className="font-bold">{callSheet.callTime}</p>
                            </div>
                            <div>
                                <span className="text-gray-500 text-[10px] sm:text-xs uppercase">Weather</span>
                                <p className="font-bold">{callSheet.weather.temp}°F {callSheet.weather.conditions}</p>
                            </div>
                            <div className="col-span-2">
                                <span className="text-gray-500 text-[10px] sm:text-xs uppercase">Location</span>
                                <p className="font-bold text-sm truncate">{callSheet.location}</p>
                                <p className="text-gray-600 text-[10px] sm:text-xs truncate">{callSheet.address}</p>
                            </div>
                        </div>

                        {/* Preview Crew Table */}
                        <div className="overflow-x-auto -mx-3 px-3 sm:mx-0 sm:px-0">
                            <span className="text-gray-500 text-[10px] sm:text-xs uppercase">Crew</span>
                            <table className="w-full text-xs sm:text-sm mt-1 min-w-[280px]">
                                <thead>
                                    <tr className="border-b border-gray-200">
                                        <th className="text-left py-1 font-medium">Role</th>
                                        <th className="text-left py-1 font-medium">Name</th>
                                        <th className="text-right py-1 font-medium">Call</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {callSheet.crew.map(c => (
                                        <tr key={c.id} className="border-b border-gray-100">
                                            <td className="py-1">{c.role}</td>
                                            <td className="py-1 truncate max-w-[100px]">{c.name}</td>
                                            <td className="py-1 text-right font-bold">{c.call}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Sunrise/Sunset */}
                        <div className="flex justify-between text-[10px] sm:text-xs text-gray-500 pt-2 border-t border-gray-200">
                            <span>Sunrise: {callSheet.weather.sunrise}</span>
                            <span>Sunset: {callSheet.weather.sunset}</span>
                        </div>
                    </motion.div>
                ) : (
                    /* Edit Mode */
                    <motion.div
                        key="edit"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="space-y-4"
                    >
                        {/* General Info */}
                        <div className="grid grid-cols-2 gap-2 sm:gap-3">
                            <div className="bg-gray-800/50 rounded-lg p-2 sm:p-3 border border-gray-700/50">
                                <label className="text-gray-400 text-[10px] sm:text-xs uppercase block mb-1">General Call</label>
                                <input
                                    type="time"
                                    value={callSheet.callTime}
                                    onChange={(e) => handleGeneralCallChange(e.target.value)}
                                    className="bg-gray-900 border border-gray-700 rounded px-2 py-1 text-white text-base sm:text-lg font-bold w-full focus:outline-none focus:border-indigo-500 min-h-[44px]"
                                />
                            </div>
                            <div className="bg-gray-800/50 rounded-lg p-2 sm:p-3 border border-gray-700/50">
                                <label className="text-gray-400 text-[10px] sm:text-xs uppercase block mb-1">Weather</label>
                                <div className="flex items-center gap-2">
                                    <span className="text-xl sm:text-2xl">☀️</span>
                                    <div>
                                        <p className="text-white font-bold text-sm sm:text-base">{callSheet.weather.temp}°F</p>
                                        <p className="text-gray-400 text-[10px] sm:text-xs">{callSheet.weather.conditions}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Location */}
                        <div className="bg-gray-800/50 rounded-lg p-2 sm:p-3 border border-gray-700/50">
                            <label className="text-gray-400 text-[10px] sm:text-xs uppercase block mb-1">Location</label>
                            <p className="text-white font-medium text-sm sm:text-base truncate">{callSheet.location}</p>
                            <p className="text-gray-400 text-xs sm:text-sm truncate">{callSheet.address}</p>
                        </div>

                        {/* Crew Table */}
                        <div className="bg-gray-800/50 rounded-lg border border-gray-700/50 overflow-hidden">
                            <div className="px-3 sm:px-4 py-2 border-b border-gray-700/50">
                                <h4 className="text-white font-medium text-xs sm:text-sm">Crew Call Times</h4>
                            </div>
                            <div className="divide-y divide-gray-700/30">
                                {callSheet.crew.map((crew) => (
                                    <div
                                        key={crew.id}
                                        className="px-3 sm:px-4 py-2 flex items-center justify-between gap-2 hover:bg-gray-700/20 min-h-[44px]"
                                    >
                                        <div className="min-w-0 flex-1">
                                            <span className="text-white text-xs sm:text-sm truncate block">{crew.name}</span>
                                            <span className="text-gray-500 text-[10px] sm:text-xs">({crew.role})</span>
                                        </div>
                                        {editingCrew === crew.id ? (
                                            <input
                                                type="time"
                                                defaultValue={crew.call}
                                                onBlur={(e) => handleTimeChange(crew.id, e.target.value)}
                                                autoFocus
                                                className="bg-gray-900 border border-indigo-500 rounded px-2 py-1 text-white text-sm w-24 focus:outline-none min-h-[36px]"
                                            />
                                        ) : (
                                            <button
                                                onClick={() => setEditingCrew(crew.id)}
                                                className="min-h-[44px] min-w-[60px] text-indigo-400 font-bold text-sm hover:text-indigo-300 px-2 py-1 rounded hover:bg-indigo-500/10 flex-shrink-0"
                                            >
                                                {crew.call}
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Sunrise/Sunset */}
                        <div className="flex justify-between text-[10px] sm:text-xs text-gray-500 bg-gray-800/30 rounded-lg px-3 sm:px-4 py-2">
                            <span>🌅 Sunrise: {callSheet.weather.sunrise}</span>
                            <span>🌇 Sunset: {callSheet.weather.sunset}</span>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Export Button */}
            <div className="relative group">
                <button
                    disabled
                    className="w-full min-h-[48px] py-2 bg-gray-700 text-gray-400 font-medium rounded-lg flex items-center justify-center gap-2 cursor-not-allowed text-sm"
                >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <span className="hidden sm:inline">Export & Send to Crew</span>
                    <span className="sm:hidden">Export</span>
                </button>
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                    <span className="bg-gray-900 text-gray-300 text-xs px-3 py-1 rounded-full border border-gray-700">
                        Sign up to export call sheets
                    </span>
                </div>
            </div>

            <p className="text-center text-gray-500 text-xs sm:text-sm">
                Click times to edit, toggle Preview to see output
            </p>
        </div>
    );
}
