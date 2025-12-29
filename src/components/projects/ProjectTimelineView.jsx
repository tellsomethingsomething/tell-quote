import { useState, useMemo } from 'react';
import {
    startOfMonth,
    endOfMonth,
    eachDayOfInterval,
    format,
    addMonths,
    subMonths,
    isWithinInterval,
    differenceInDays,
    startOfDay,
    min,
    max,
    isSameMonth,
} from 'date-fns';
import { PROJECT_STATUSES } from '../../store/projectStore';
import { formatCurrency } from '../../utils/currency';

// Get status color for bars
const getStatusBarColor = (status) => {
    const colors = {
        draft: 'bg-gray-500',
        confirmed: 'bg-blue-500',
        in_progress: 'bg-yellow-500',
        wrapped: 'bg-green-500',
        closed: 'bg-purple-500',
        cancelled: 'bg-red-500/50',
        archived: 'bg-gray-600',
    };
    return colors[status] || 'bg-gray-500';
};

export default function ProjectTimelineView({ projects, onSelectProject }) {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [monthsToShow] = useState(3);

    // Get date range for display
    const dateRange = useMemo(() => {
        const start = startOfMonth(currentDate);
        const end = endOfMonth(addMonths(currentDate, monthsToShow - 1));
        return { start, end };
    }, [currentDate, monthsToShow]);

    // Get all days in range
    const days = useMemo(() => {
        return eachDayOfInterval({ start: dateRange.start, end: dateRange.end });
    }, [dateRange]);

    // Group days by month for headers
    const months = useMemo(() => {
        const result = [];
        let currentMonth = null;
        days.forEach(day => {
            const monthKey = format(day, 'yyyy-MM');
            if (monthKey !== currentMonth) {
                currentMonth = monthKey;
                result.push({
                    key: monthKey,
                    label: format(day, 'MMMM yyyy'),
                    days: days.filter(d => format(d, 'yyyy-MM') === monthKey),
                });
            }
        });
        return result;
    }, [days]);

    // Filter projects that have dates and overlap with our range
    const timelineProjects = useMemo(() => {
        return projects
            .filter(p => p.startDate || p.endDate)
            .filter(p => p.status !== 'archived')
            .filter(p => {
                const projectStart = p.startDate ? new Date(p.startDate) : null;
                const projectEnd = p.endDate ? new Date(p.endDate) : null;

                // Check if project overlaps with our date range
                if (projectStart && projectEnd) {
                    return !(projectEnd < dateRange.start || projectStart > dateRange.end);
                }
                if (projectStart) {
                    return projectStart <= dateRange.end;
                }
                if (projectEnd) {
                    return projectEnd >= dateRange.start;
                }
                return false;
            })
            .sort((a, b) => {
                const aStart = a.startDate ? new Date(a.startDate) : new Date();
                const bStart = b.startDate ? new Date(b.startDate) : new Date();
                return aStart - bStart;
            });
    }, [projects, dateRange]);

    // Calculate bar position and width
    const getBarStyle = (project) => {
        const projectStart = project.startDate
            ? max([new Date(project.startDate), dateRange.start])
            : dateRange.start;
        const projectEnd = project.endDate
            ? min([new Date(project.endDate), dateRange.end])
            : dateRange.end;

        const totalDays = differenceInDays(dateRange.end, dateRange.start) + 1;
        const startOffset = differenceInDays(projectStart, dateRange.start);
        const duration = differenceInDays(projectEnd, projectStart) + 1;

        const left = (startOffset / totalDays) * 100;
        const width = (duration / totalDays) * 100;

        return {
            left: `${Math.max(0, left)}%`,
            width: `${Math.min(100 - left, width)}%`,
        };
    };

    const handlePrevPeriod = () => {
        setCurrentDate(prev => subMonths(prev, 1));
    };

    const handleNextPeriod = () => {
        setCurrentDate(prev => addMonths(prev, 1));
    };

    const handleToday = () => {
        setCurrentDate(new Date());
    };

    // Check if a day is today
    const isToday = (day) => {
        return format(day, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');
    };

    // Check if a day is a weekend
    const isWeekend = (day) => {
        const dayNum = day.getDay();
        return dayNum === 0 || dayNum === 6;
    };

    return (
        <div className="bg-dark-card border border-dark-border rounded-lg overflow-hidden">
            {/* Header with navigation */}
            <div className="flex items-center justify-between p-4 border-b border-dark-border">
                <div className="flex items-center gap-4">
                    <h3 className="font-medium text-gray-200">Project Timeline</h3>
                    <span className="text-sm text-gray-500">
                        {timelineProjects.length} project{timelineProjects.length !== 1 ? 's' : ''} with dates
                    </span>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={handlePrevPeriod}
                        className="p-2 text-gray-400 hover:text-white hover:bg-dark-bg rounded transition-colors"
                        title="Previous month"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                    </button>
                    <button
                        onClick={handleToday}
                        className="px-3 py-1 text-sm text-gray-300 hover:text-white bg-dark-bg rounded transition-colors"
                    >
                        Today
                    </button>
                    <button
                        onClick={handleNextPeriod}
                        className="p-2 text-gray-400 hover:text-white hover:bg-dark-bg rounded transition-colors"
                        title="Next month"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                    </button>
                </div>
            </div>

            {/* Timeline content */}
            <div className="overflow-x-auto">
                <div className="min-w-[800px]">
                    {/* Month headers */}
                    <div className="flex border-b border-dark-border">
                        <div className="w-64 shrink-0 px-4 py-2 bg-dark-bg border-r border-dark-border">
                            <span className="text-xs font-medium text-gray-500 uppercase">Project</span>
                        </div>
                        <div className="flex-1 flex">
                            {months.map(month => (
                                <div
                                    key={month.key}
                                    className="flex-1 px-2 py-2 text-center text-sm font-medium text-gray-300 bg-dark-bg border-r border-dark-border last:border-r-0"
                                    style={{ minWidth: `${(month.days.length / days.length) * 100}%` }}
                                >
                                    {month.label}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Day markers */}
                    <div className="flex border-b border-dark-border">
                        <div className="w-64 shrink-0 px-4 py-1 bg-dark-bg/50 border-r border-dark-border" />
                        <div className="flex-1 flex">
                            {days.map((day, i) => (
                                <div
                                    key={i}
                                    className={`flex-1 py-1 text-center text-xs border-r border-dark-border/50 last:border-r-0 ${
                                        isToday(day) ? 'bg-accent-primary/20 text-accent-primary font-medium' :
                                        isWeekend(day) ? 'bg-dark-bg/30 text-gray-600' : 'text-gray-500'
                                    }`}
                                    style={{ minWidth: '20px' }}
                                >
                                    {day.getDate() === 1 || i === 0 || isToday(day) ? format(day, 'd') : ''}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Projects */}
                    {timelineProjects.length === 0 ? (
                        <div className="p-8 text-center text-gray-500">
                            No projects with dates in this period
                        </div>
                    ) : (
                        timelineProjects.map(project => (
                            <div
                                key={project.id}
                                className="flex border-b border-dark-border last:border-b-0 hover:bg-dark-bg/30 transition-colors cursor-pointer"
                                onClick={() => onSelectProject(project.id)}
                            >
                                {/* Project info */}
                                <div className="w-64 shrink-0 px-4 py-3 border-r border-dark-border">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="text-xs text-gray-500 font-mono">
                                            {project.projectCode}
                                        </span>
                                        <span className={`text-xs px-1.5 py-0.5 rounded ${
                                            getStatusBarColor(project.status).replace('bg-', 'bg-').replace('500', '500/20')
                                        } ${getStatusBarColor(project.status).replace('bg-', 'text-').replace('500', '400')}`}>
                                            {PROJECT_STATUSES[project.status]?.label || project.status}
                                        </span>
                                    </div>
                                    <div className="font-medium text-gray-200 truncate text-sm">
                                        {project.name}
                                    </div>
                                    {project.client?.company && (
                                        <div className="text-xs text-gray-500 truncate">
                                            {project.client.company}
                                        </div>
                                    )}
                                </div>

                                {/* Timeline bar */}
                                <div className="flex-1 relative py-3 px-2">
                                    <div
                                        className={`absolute top-1/2 -translate-y-1/2 h-6 rounded ${getStatusBarColor(project.status)} opacity-80 hover:opacity-100 transition-opacity`}
                                        style={getBarStyle(project)}
                                        title={`${format(new Date(project.startDate || dateRange.start), 'MMM d')} - ${format(new Date(project.endDate || dateRange.end), 'MMM d')}`}
                                    >
                                        {/* Show project name inside bar if wide enough */}
                                        <div className="h-full flex items-center px-2 overflow-hidden">
                                            <span className="text-xs text-white font-medium truncate">
                                                {project.name}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Today line */}
                                    {days.some(d => isToday(d)) && (
                                        <div
                                            className="absolute top-0 bottom-0 w-0.5 bg-accent-primary z-10"
                                            style={{
                                                left: `${(differenceInDays(new Date(), dateRange.start) / days.length) * 100}%`
                                            }}
                                        />
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Legend */}
            <div className="flex items-center gap-4 p-3 border-t border-dark-border bg-dark-bg/50">
                <span className="text-xs text-gray-500">Status:</span>
                {Object.entries(PROJECT_STATUSES)
                    .filter(([key, val]) => !val.hidden)
                    .map(([key, { label, color }]) => (
                    <div key={key} className="flex items-center gap-1.5">
                        <div className={`w-3 h-3 rounded ${getStatusBarColor(key)}`} />
                        <span className="text-xs text-gray-400">{label}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}
