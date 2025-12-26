import React, { useState } from 'react';
import { TrendingUp, TrendingDown, Flame, Sun, Snowflake, Info, RefreshCw } from 'lucide-react';
import { getScoreCategory, SCORE_CATEGORIES, useLeadScoringStore } from '../../store/leadScoringStore';

// Compact badge version
export function LeadScoreBadge({ score, size = 'sm', showLabel = true }) {
    const category = getScoreCategory(score);
    const config = SCORE_CATEGORIES[category];

    const sizeClasses = {
        xs: 'text-[10px] px-1.5 py-0.5',
        sm: 'text-xs px-2 py-0.5',
        md: 'text-sm px-2.5 py-1',
        lg: 'text-base px-3 py-1.5',
    };

    const iconSizes = {
        xs: 'w-2.5 h-2.5',
        sm: 'w-3 h-3',
        md: 'w-4 h-4',
        lg: 'w-5 h-5',
    };

    const Icon = category === 'hot' ? Flame : category === 'warm' ? Sun : Snowflake;

    return (
        <div className={`inline-flex items-center gap-1 rounded-full ${config.bgColor} ${config.color} ${sizeClasses[size]} font-medium`}>
            <Icon className={iconSizes[size]} />
            {showLabel && <span>{score}</span>}
        </div>
    );
}

// Detailed score card with breakdown
export function LeadScoreCard({ score, breakdown = {}, opportunityId, onRefresh }) {
    const [showBreakdown, setShowBreakdown] = useState(false);
    const [isRecalculating, setIsRecalculating] = useState(false);
    const { calculateScore } = useLeadScoringStore();

    const category = getScoreCategory(score);
    const config = SCORE_CATEGORIES[category];

    const handleRecalculate = async () => {
        if (!opportunityId) return;
        setIsRecalculating(true);
        await calculateScore(opportunityId);
        onRefresh?.();
        setIsRecalculating(false);
    };

    // Group breakdown by positive/negative
    const positiveFactors = Object.entries(breakdown).filter(([_, points]) => points > 0);
    const negativeFactors = Object.entries(breakdown).filter(([_, points]) => points < 0);

    return (
        <div className={`rounded-lg border ${config.borderColor} ${config.bgColor} p-3`}>
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${config.bgColor}`}>
                        <span className="text-lg">{config.icon}</span>
                    </div>
                    <div>
                        <p className={`font-semibold ${config.color}`}>{config.label} Lead</p>
                        <p className="text-xs text-gray-500">Score: {score}/100</p>
                    </div>
                </div>

                <div className="flex items-center gap-1">
                    <button
                        onClick={handleRecalculate}
                        disabled={isRecalculating}
                        className="p-1.5 text-gray-400 hover:text-white rounded transition-colors"
                        title="Recalculate score"
                    >
                        <RefreshCw className={`w-4 h-4 ${isRecalculating ? 'animate-spin' : ''}`} />
                    </button>
                    <button
                        onClick={() => setShowBreakdown(!showBreakdown)}
                        className="p-1.5 text-gray-400 hover:text-white rounded transition-colors"
                        title="Show breakdown"
                    >
                        <Info className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Score bar */}
            <div className="h-2 bg-dark-border rounded-full overflow-hidden mb-2">
                <div
                    className={`h-full transition-all duration-500 ${
                        category === 'hot' ? 'bg-gradient-to-r from-red-500 to-orange-400' :
                        category === 'warm' ? 'bg-gradient-to-r from-amber-500 to-yellow-400' :
                        'bg-gradient-to-r from-blue-500 to-cyan-400'
                    }`}
                    style={{ width: `${score}%` }}
                />
            </div>

            {/* Breakdown */}
            {showBreakdown && Object.keys(breakdown).length > 0 && (
                <div className="mt-3 pt-3 border-t border-dark-border space-y-2">
                    {positiveFactors.length > 0 && (
                        <div>
                            <p className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                                <TrendingUp className="w-3 h-3 text-green-400" />
                                Positive factors
                            </p>
                            <div className="space-y-1">
                                {positiveFactors.map(([name, points]) => (
                                    <div key={name} className="flex justify-between text-xs">
                                        <span className="text-gray-300">{name}</span>
                                        <span className="text-green-400">+{points}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {negativeFactors.length > 0 && (
                        <div>
                            <p className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                                <TrendingDown className="w-3 h-3 text-red-400" />
                                Negative factors
                            </p>
                            <div className="space-y-1">
                                {negativeFactors.map(([name, points]) => (
                                    <div key={name} className="flex justify-between text-xs">
                                        <span className="text-gray-300">{name}</span>
                                        <span className="text-red-400">{points}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

// Inline score indicator with tooltip
export function LeadScoreIndicator({ score, size = 'sm' }) {
    const [showTooltip, setShowTooltip] = useState(false);
    const category = getScoreCategory(score);
    const config = SCORE_CATEGORIES[category];

    const sizeClasses = {
        xs: 'w-4 h-4 text-[8px]',
        sm: 'w-5 h-5 text-[10px]',
        md: 'w-6 h-6 text-xs',
        lg: 'w-8 h-8 text-sm',
    };

    return (
        <div className="relative inline-block">
            <div
                className={`${sizeClasses[size]} rounded-full flex items-center justify-center ${config.bgColor} ${config.color} font-bold cursor-help`}
                onMouseEnter={() => setShowTooltip(true)}
                onMouseLeave={() => setShowTooltip(false)}
            >
                {score}
            </div>

            {showTooltip && (
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50">
                    <div className={`px-2 py-1 rounded text-xs whitespace-nowrap ${config.bgColor} ${config.color} border ${config.borderColor}`}>
                        {config.icon} {config.label} Lead
                    </div>
                </div>
            )}
        </div>
    );
}

export default LeadScoreBadge;
