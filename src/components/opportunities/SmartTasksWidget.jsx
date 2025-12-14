import { useState, useMemo } from 'react';
import { useDealContextStore } from '../../store/dealContextStore';
import { useActivityStore } from '../../store/activityStore';
import { useClientStore } from '../../store/clientStore';

const PRIORITY_COLORS = {
    high: 'bg-red-500/20 text-red-400 border-red-500/30',
    medium: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    low: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
};

const STAGE_LABELS = {
    new_opportunity: 'New Lead',
    discovery: 'Discovery',
    proposal: 'Proposal',
    follow_up: 'Follow Up',
    negotiation: 'Negotiation',
    at_risk: 'At Risk',
    closing: 'Closing',
};

export default function SmartTasksWidget({ opportunity }) {
    const { getSmartTasks, completeTask, skipTask, addSuggestedTask, getContext } = useDealContextStore();
    const { activities } = useActivityStore();
    const { savedQuotes } = useClientStore();

    const [expandedTask, setExpandedTask] = useState(null);
    const [showCompleted, setShowCompleted] = useState(false);

    // Get smart task suggestions
    const suggestedTasks = useMemo(() => {
        return getSmartTasks(opportunity, activities, savedQuotes);
    }, [opportunity, activities, savedQuotes, getSmartTasks]);

    // Get context for completed tasks display
    const context = getContext(opportunity?.id);
    const completedTasks = context?.completedTasks || [];
    const recentCompleted = completedTasks.slice(-5).reverse();

    if (!opportunity || opportunity.status === 'won' || opportunity.status === 'lost') {
        return null;
    }

    const handleComplete = (task) => {
        // First add to suggested if not already tracked
        const existingTask = context.suggestedTasks.find(t => t.id === task.id);
        if (!existingTask) {
            addSuggestedTask(opportunity.id, task);
        }
        // Then mark complete
        setTimeout(() => completeTask(opportunity.id, task.id), 100);
        setExpandedTask(null);
    };

    const handleSkip = (task, reason = '') => {
        const existingTask = context.suggestedTasks.find(t => t.id === task.id);
        if (!existingTask) {
            addSuggestedTask(opportunity.id, task);
        }
        setTimeout(() => skipTask(opportunity.id, task.id, reason), 100);
        setExpandedTask(null);
    };

    const currentStage = suggestedTasks[0]?.stage;

    return (
        <div className="bg-dark-card border border-dark-border rounded-xl p-4">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                        <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                        </svg>
                    </div>
                    <div>
                        <h3 className="text-sm font-semibold text-white">Suggested Next Steps</h3>
                        {currentStage && (
                            <span className="text-xs text-gray-500">
                                Stage: {STAGE_LABELS[currentStage] || currentStage}
                            </span>
                        )}
                    </div>
                </div>
                {recentCompleted.length > 0 && (
                    <button
                        onClick={() => setShowCompleted(!showCompleted)}
                        className="text-xs text-gray-500 hover:text-gray-300"
                    >
                        {showCompleted ? 'Hide' : 'Show'} completed ({recentCompleted.length})
                    </button>
                )}
            </div>

            {/* Task List */}
            {suggestedTasks.length === 0 ? (
                <div className="text-center py-6 text-gray-500 text-sm">
                    <svg className="w-8 h-8 mx-auto mb-2 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p>All caught up! No pending tasks.</p>
                    <p className="text-xs text-gray-600 mt-1">Tasks will appear as the deal progresses</p>
                </div>
            ) : (
                <div className="space-y-2">
                    {suggestedTasks.map((task, index) => (
                        <div
                            key={task.id}
                            className={`border rounded-lg transition-all ${
                                expandedTask === task.id
                                    ? 'border-purple-500/50 bg-purple-500/5'
                                    : 'border-dark-border hover:border-gray-600'
                            }`}
                        >
                            <button
                                onClick={() => setExpandedTask(expandedTask === task.id ? null : task.id)}
                                className="w-full p-3 text-left"
                            >
                                <div className="flex items-start gap-3">
                                    <div className={`mt-0.5 px-1.5 py-0.5 text-[10px] font-bold rounded border ${PRIORITY_COLORS[task.priority]}`}>
                                        {index + 1}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h4 className="text-sm font-medium text-gray-200">{task.title}</h4>
                                        <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">
                                            {task.description}
                                        </p>
                                    </div>
                                    <svg
                                        className={`w-4 h-4 text-gray-500 transition-transform ${expandedTask === task.id ? 'rotate-180' : ''}`}
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                    >
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                </div>
                            </button>

                            {/* Expanded View */}
                            {expandedTask === task.id && (
                                <div className="px-3 pb-3 pt-1 border-t border-dark-border">
                                    <p className="text-xs text-gray-400 mb-3">{task.description}</p>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => handleComplete(task)}
                                            className="flex-1 py-2 text-xs font-medium bg-green-500/20 text-green-400 rounded-lg hover:bg-green-500/30 transition-colors flex items-center justify-center gap-1"
                                        >
                                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                            </svg>
                                            Done
                                        </button>
                                        <button
                                            onClick={() => handleSkip(task, 'not relevant')}
                                            className="py-2 px-3 text-xs text-gray-500 hover:text-gray-300 hover:bg-white/5 rounded-lg transition-colors"
                                        >
                                            Skip
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Completed Tasks (collapsible) */}
            {showCompleted && recentCompleted.length > 0 && (
                <div className="mt-4 pt-4 border-t border-dark-border">
                    <h4 className="text-xs font-medium text-gray-500 mb-2">Recently Completed</h4>
                    <div className="space-y-1">
                        {recentCompleted.map((task, i) => (
                            <div key={i} className="flex items-center gap-2 text-xs text-gray-500">
                                <svg className="w-3.5 h-3.5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                <span className="line-through">{task.title}</span>
                                <span className="text-gray-600">
                                    {new Date(task.completedAt).toLocaleDateString()}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Footer tip */}
            <div className="mt-4 pt-3 border-t border-dark-border flex items-center gap-2 text-xs text-gray-600">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Tasks adapt based on deal stage and your completion patterns</span>
            </div>
        </div>
    );
}
