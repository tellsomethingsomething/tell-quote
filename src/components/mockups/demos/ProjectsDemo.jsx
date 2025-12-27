import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCurrency } from '../../../hooks/useCurrency';

const stages = [
    { id: 'confirmed', label: 'Confirmed', color: 'bg-blue-500' },
    { id: 'production', label: 'In Production', color: 'bg-amber-500' },
    { id: 'post', label: 'Post', color: 'bg-purple-500' },
    { id: 'wrapped', label: 'Wrapped', color: 'bg-green-500' },
];

const initialProjects = [
    { id: 1, title: 'Nike Campaign', client: 'Nike Marketing', budget: 25000, spent: 0, stage: 'confirmed', deliverables: 4 },
    { id: 2, title: 'Corporate Video', client: 'Acme Corp', budget: 12000, spent: 4800, stage: 'production', deliverables: 2 },
    { id: 3, title: 'Product Launch', client: 'TechStart', budget: 8500, spent: 8500, stage: 'post', deliverables: 3 },
];

export default function ProjectsDemo() {
    const { formatPrice, formatPriceShort } = useCurrency();
    const [projects, setProjects] = useState(initialProjects);
    const [dragging, setDragging] = useState(null);
    const [hoveredStage, setHoveredStage] = useState(null);
    const [selectedProject, setSelectedProject] = useState(null);

    const handleDragStart = (e, project) => {
        setDragging(project);
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
            setProjects(projects.map(p =>
                p.id === dragging.id ? { ...p, stage: stageId } : p
            ));
        }
        setDragging(null);
        setHoveredStage(null);
    };

    const getProgressPercent = (spent, budget) => {
        return Math.min(100, Math.round((spent / budget) * 100));
    };

    const getProgressColor = (percent) => {
        if (percent >= 90) return 'bg-red-500';
        if (percent >= 70) return 'bg-amber-500';
        return 'bg-green-500';
    };

    return (
        <div className="p-3 sm:p-6 max-w-full overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between mb-3 sm:mb-4 gap-2">
                <h3 className="text-white font-semibold text-sm sm:text-base">Project Pipeline</h3>
                <span className="text-gray-500 text-xs hidden sm:inline">Drag cards to move projects</span>
                <span className="text-gray-500 text-xs sm:hidden">Tap to view</span>
            </div>

            {/* Kanban Board - Horizontal scroll on mobile */}
            <div className="overflow-x-auto -mx-3 px-3 sm:mx-0 sm:px-0 pb-2">
                <div className="grid grid-cols-4 gap-2 sm:gap-3 min-w-[480px] sm:min-w-0 min-h-[280px] sm:min-h-[320px]">
                    {stages.map((stage) => {
                        const stageProjects = projects.filter(p => p.stage === stage.id);
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
                                    <div className="flex items-center gap-1 sm:gap-2">
                                        <div className={`w-2 h-2 rounded-full ${stage.color}`} />
                                        <span className="text-gray-300 text-xs font-medium truncate">
                                            {stage.label}
                                        </span>
                                        <span className="text-gray-500 text-xs ml-auto">
                                            {stageProjects.length}
                                        </span>
                                    </div>
                                </div>

                                {/* Cards */}
                                <div className="flex-1 p-1.5 sm:p-2 space-y-1.5 sm:space-y-2 overflow-auto">
                                    <AnimatePresence>
                                        {stageProjects.map((project) => (
                                            <motion.div
                                                key={project.id}
                                                layout
                                                initial={{ opacity: 0, scale: 0.9 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                exit={{ opacity: 0, scale: 0.9 }}
                                                draggable
                                                onDragStart={(e) => handleDragStart(e, project)}
                                                onDragEnd={handleDragEnd}
                                                onClick={() => setSelectedProject(project)}
                                                className={`bg-gray-800 rounded-lg p-2 cursor-grab active:cursor-grabbing border border-gray-700/50 hover:border-indigo-500/50 transition-colors min-h-[44px] ${dragging?.id === project.id ? 'opacity-50' : ''
                                                    }`}
                                            >
                                                <h4 className="text-white text-xs font-medium truncate mb-1">
                                                    {project.title}
                                                </h4>
                                                <p className="text-gray-500 text-[10px] truncate mb-2">
                                                    {project.client}
                                                </p>

                                                {/* Budget Bar */}
                                                <div className="space-y-1">
                                                    <div className="flex justify-between text-[10px] text-gray-400">
                                                        <span>{getProgressPercent(project.spent, project.budget)}%</span>
                                                        <span>{formatPriceShort(project.budget)}</span>
                                                    </div>
                                                    <div className="h-1.5 bg-gray-700 rounded-full overflow-hidden">
                                                        <motion.div
                                                            className={`h-full ${getProgressColor(getProgressPercent(project.spent, project.budget))} rounded-full`}
                                                            initial={{ width: 0 }}
                                                            animate={{ width: `${getProgressPercent(project.spent, project.budget)}%` }}
                                                            transition={{ duration: 0.5 }}
                                                        />
                                                    </div>
                                                </div>

                                                {/* Deliverables Badge */}
                                                <div className="mt-2 flex items-center gap-1">
                                                    <svg className="w-3 h-3 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                    </svg>
                                                    <span className="text-gray-500 text-[10px]">{project.deliverables}</span>
                                                </div>
                                            </motion.div>
                                        ))}
                                    </AnimatePresence>

                                    {stageProjects.length === 0 && (
                                        <div className="flex items-center justify-center h-16 sm:h-20 text-gray-600 text-xs">
                                            Drop here
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Project Detail Modal */}
            <AnimatePresence>
                {selectedProject && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-black/60 flex items-center justify-center p-3 sm:p-4 z-20"
                        onClick={() => setSelectedProject(null)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-gray-800 rounded-xl p-4 sm:p-5 max-w-sm w-full border border-gray-700"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="flex items-start justify-between gap-3 mb-4">
                                <div className="min-w-0 flex-1">
                                    <h3 className="text-white font-bold text-base sm:text-lg truncate">{selectedProject.title}</h3>
                                    <p className="text-gray-400 text-sm truncate">{selectedProject.client}</p>
                                </div>
                                <button
                                    onClick={() => setSelectedProject(null)}
                                    className="min-w-[44px] min-h-[44px] flex items-center justify-center text-gray-500 hover:text-white hover:bg-gray-700/50 rounded-lg transition-colors flex-shrink-0"
                                >
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>

                            <div className="space-y-4">
                                {/* Status */}
                                <div className="flex items-center gap-2">
                                    <span className="text-gray-400 text-sm">Status:</span>
                                    <span className={`px-2 py-0.5 rounded text-xs ${stages.find(s => s.id === selectedProject.stage)?.color} bg-opacity-20 text-white`}>
                                        {stages.find(s => s.id === selectedProject.stage)?.label}
                                    </span>
                                </div>

                                {/* Budget */}
                                <div>
                                    <div className="flex justify-between text-sm mb-1">
                                        <span className="text-gray-400">Budget</span>
                                        <span className="text-white">{formatPrice(selectedProject.budget)}</span>
                                    </div>
                                    <div className="flex justify-between text-sm mb-2">
                                        <span className="text-gray-400">Spent</span>
                                        <span className="text-gray-300">{formatPrice(selectedProject.spent)}</span>
                                    </div>
                                    <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full ${getProgressColor(getProgressPercent(selectedProject.spent, selectedProject.budget))} rounded-full`}
                                            style={{ width: `${getProgressPercent(selectedProject.spent, selectedProject.budget)}%` }}
                                        />
                                    </div>
                                </div>

                                {/* Deliverables */}
                                <div>
                                    <span className="text-gray-400 text-sm">Deliverables: </span>
                                    <span className="text-white text-sm">{selectedProject.deliverables} items</span>
                                </div>
                            </div>

                            <button
                                disabled
                                className="w-full mt-4 min-h-[44px] py-2 bg-gray-700 text-gray-400 rounded-lg text-sm cursor-not-allowed"
                            >
                                View Full Project
                            </button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <p className="text-center text-gray-500 text-xs sm:text-sm mt-3 sm:mt-4">
                Drag projects between stages or click for details
            </p>
        </div>
    );
}
