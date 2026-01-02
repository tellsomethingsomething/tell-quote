import React, { useState, useMemo, useEffect } from 'react';
import { shallow } from 'zustand/shallow';
import { useOpportunityStore } from '../../store/opportunityStore';
import { useTimelineStore, EVENT_TYPES, EVENT_CONFIGS } from '../../store/timelineStore';
import { formatCurrency } from '../../utils/currency';

// Status colors for Gantt bars
const STATUS_COLORS = {
    active: { bg: 'bg-blue-500', border: 'border-blue-600' },
    proposal: { bg: 'bg-purple-500', border: 'border-purple-600' },
    negotiation: { bg: 'bg-amber-500', border: 'border-amber-600' },
    won: { bg: 'bg-green-500', border: 'border-green-600' },
    lost: { bg: 'bg-red-500', border: 'border-red-600' },
    dormant: { bg: 'bg-gray-500', border: 'border-gray-600' },
};

// Generate month labels for the timeline header
function getMonthLabels(startDate, endDate) {
    const labels = [];
    const current = new Date(startDate);
    current.setDate(1);

    while (current <= endDate) {
        labels.push({
            key: `${current.getFullYear()}-${current.getMonth()}`,
            label: current.toLocaleDateString('en-GB', { month: 'short', year: '2-digit' }),
            date: new Date(current),
        });
        current.setMonth(current.getMonth() + 1);
    }

    return labels;
}

// Calculate position and width for an opportunity bar
function calculateBarPosition(opp, startDate, endDate, totalDays) {
    const oppStart = opp.createdAt ? new Date(opp.createdAt) : startDate;
    const oppEnd = opp.expectedCloseDate ? new Date(opp.expectedCloseDate) : endDate;

    // Clamp to visible range
    const visibleStart = Math.max(oppStart.getTime(), startDate.getTime());
    const visibleEnd = Math.min(oppEnd.getTime(), endDate.getTime());

    const daysSinceStart = (visibleStart - startDate.getTime()) / (1000 * 60 * 60 * 24);
    const durationDays = Math.max((visibleEnd - visibleStart) / (1000 * 60 * 60 * 24), 14); // Min 14 days for visibility

    const left = (daysSinceStart / totalDays) * 100;
    const width = (durationDays / totalDays) * 100;

    return { left: `${Math.max(0, left)}%`, width: `${Math.min(100 - left, width)}%` };
}

// Draggable Opportunity bar component
function OpportunityBar({ opp, style, onClick, onDragEnd, startDate, totalDays, containerWidth }) {
    const colors = STATUS_COLORS[opp.status] || STATUS_COLORS.active;
    const probability = opp.probability || 50;
    const [isDragging, setIsDragging] = React.useState(null); // null, 'move', 'left', 'right'
    const [dragOffset, setDragOffset] = React.useState({ left: 0, width: 0 });
    const barRef = React.useRef(null);

    const handleMouseDown = (e, type) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(type);

        const startX = e.clientX;
        const initialStyle = { ...style };

        const handleMouseMove = (moveEvent) => {
            const deltaX = moveEvent.clientX - startX;
            const deltaPercent = (deltaX / containerWidth) * 100;
            const deltaDays = (deltaX / containerWidth) * totalDays;

            if (type === 'move') {
                setDragOffset({ left: deltaPercent, width: 0 });
            } else if (type === 'left') {
                setDragOffset({ left: deltaPercent, width: -deltaPercent });
            } else if (type === 'right') {
                setDragOffset({ left: 0, width: deltaPercent });
            }
        };

        const handleMouseUp = (upEvent) => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);

            const deltaX = upEvent.clientX - startX;
            const deltaDays = Math.round((deltaX / containerWidth) * totalDays);

            if (Math.abs(deltaDays) > 0) {
                const oppStart = opp.createdAt ? new Date(opp.createdAt) : new Date();
                const oppEnd = opp.expectedCloseDate ? new Date(opp.expectedCloseDate) : new Date();

                let newStart = oppStart;
                let newEnd = oppEnd;

                if (type === 'move') {
                    newStart = new Date(oppStart.getTime() + deltaDays * 24 * 60 * 60 * 1000);
                    newEnd = new Date(oppEnd.getTime() + deltaDays * 24 * 60 * 60 * 1000);
                } else if (type === 'left') {
                    newStart = new Date(oppStart.getTime() + deltaDays * 24 * 60 * 60 * 1000);
                } else if (type === 'right') {
                    newEnd = new Date(oppEnd.getTime() + deltaDays * 24 * 60 * 60 * 1000);
                }

                // Ensure start is before end
                if (newStart < newEnd) {
                    onDragEnd?.(opp.id, {
                        createdAt: newStart.toISOString(),
                        expectedCloseDate: newEnd.toISOString(),
                    });
                }
            }

            setIsDragging(null);
            setDragOffset({ left: 0, width: 0 });
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
    };

    const currentStyle = {
        ...style,
        left: `calc(${style.left} + ${dragOffset.left}%)`,
        width: `calc(${style.width} + ${dragOffset.width}%)`,
        opacity: opp.status === 'lost' ? 0.4 : (probability / 100) * 0.5 + 0.5,
        zIndex: isDragging ? 20 : undefined,
    };

    return (
        <div
            ref={barRef}
            className={`absolute h-8 rounded cursor-grab transition-opacity ${isDragging ? 'cursor-grabbing' : ''} ${colors.bg} ${colors.border} border shadow-sm group`}
            style={currentStyle}
            onClick={() => !isDragging && onClick(opp)}
            onMouseDown={(e) => handleMouseDown(e, 'move')}
            title={`${opp.title} - ${opp.status} (${probability}%) - Drag to move, drag edges to resize`}
        >
            {/* Left resize handle */}
            <div
                className="absolute left-0 top-0 bottom-0 w-2 cursor-ew-resize opacity-0 group-hover:opacity-100 hover:bg-white/30 rounded-l transition-opacity"
                onMouseDown={(e) => handleMouseDown(e, 'left')}
            />

            <div className="px-3 py-1 truncate text-xs text-white font-medium select-none">
                {opp.title}
            </div>

            {/* Right resize handle */}
            <div
                className="absolute right-0 top-0 bottom-0 w-2 cursor-ew-resize opacity-0 group-hover:opacity-100 hover:bg-white/30 rounded-r transition-opacity"
                onMouseDown={(e) => handleMouseDown(e, 'right')}
            />
        </div>
    );
}

// Today marker
function TodayMarker({ startDate, totalDays }) {
    const today = new Date();
    const daysSinceStart = (today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24);
    const left = (daysSinceStart / totalDays) * 100;

    if (left < 0 || left > 100) return null;

    return (
        <div
            className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-20"
            style={{ left: `${left}%` }}
        >
            <div className="absolute -top-1 -left-1 w-2 h-2 rounded-full bg-red-500" />
            <div className="absolute -bottom-5 -left-4 text-[9px] text-red-400 whitespace-nowrap">Today</div>
        </div>
    );
}

// Research event marker component
function ResearchMarker({ event, startDate, totalDays, onClick }) {
    const eventDate = new Date(event.timestamp);
    const daysSinceStart = (eventDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24);
    const left = (daysSinceStart / totalDays) * 100;

    if (left < 0 || left > 100) return null;

    const config = EVENT_CONFIGS[event.type] || EVENT_CONFIGS[EVENT_TYPES.RESEARCH_FINDING];

    return (
        <div
            className={`absolute top-1 w-3 h-3 rounded-full cursor-pointer transition-transform hover:scale-150 z-10 ${config.bgColor} border ${config.borderColor}`}
            style={{ left: `${left}%` }}
            onClick={() => onClick?.(event)}
            title={`${config.label}: ${event.title}`}
        >
            <div className="absolute -top-6 left-1/2 -translate-x-1/2 hidden group-hover:block whitespace-nowrap bg-dark-card px-2 py-1 rounded text-xs shadow-lg">
                {event.title}
            </div>
        </div>
    );
}

// Main component
export default function OpportunityTimeline({ opportunities: externalOpps, onSelectOpportunity }) {
    const storeOpps = useOpportunityStore(state => state.opportunities, shallow);
    const updateOpportunity = useOpportunityStore(state => state.updateOpportunity);
    const opportunities = externalOpps || storeOpps;

    // Timeline store for research events
    const { events: timelineEvents, initialize: initTimeline } = useTimelineStore(
        state => ({ events: state.events, initialize: state.initialize }),
        shallow
    );

    const [timeRange, setTimeRange] = useState('6m'); // 3m, 6m, 12m, all
    const [groupBy, setGroupBy] = useState('status'); // status, region, country
    const [selectedOpp, setSelectedOpp] = useState(null);
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [showResearch, setShowResearch] = useState(true);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [timelineWidth, setTimelineWidth] = useState(800);
    const containerRef = React.useRef(null);
    const timelineContainerRef = React.useRef(null);

    // Track timeline width for drag calculations
    useEffect(() => {
        const updateWidth = () => {
            if (timelineContainerRef.current) {
                setTimelineWidth(timelineContainerRef.current.offsetWidth);
            }
        };
        updateWidth();
        window.addEventListener('resize', updateWidth);
        return () => window.removeEventListener('resize', updateWidth);
    }, []);

    // Handle drag end - update opportunity dates
    const handleDragEnd = async (oppId, updates) => {
        await updateOpportunity(oppId, updates);
    };

    // Initialize timeline events
    useEffect(() => {
        initTimeline();
    }, [initTimeline]);

    // Toggle fullscreen
    const toggleFullscreen = () => {
        if (!document.fullscreenElement) {
            containerRef.current?.requestFullscreen();
            setIsFullscreen(true);
        } else {
            document.exitFullscreen();
            setIsFullscreen(false);
        }
    };

    // Listen for fullscreen changes
    React.useEffect(() => {
        const handleFullscreenChange = () => {
            setIsFullscreen(!!document.fullscreenElement);
        };
        document.addEventListener('fullscreenchange', handleFullscreenChange);
        return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
    }, []);

    // Calculate date range
    const { startDate, endDate, totalDays } = useMemo(() => {
        const now = new Date();
        let start, end;

        switch (timeRange) {
            case '3m':
                start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
                end = new Date(now.getFullYear(), now.getMonth() + 2, 0);
                break;
            case '6m':
                start = new Date(now.getFullYear(), now.getMonth() - 2, 1);
                end = new Date(now.getFullYear(), now.getMonth() + 4, 0);
                break;
            case '12m':
                start = new Date(now.getFullYear(), now.getMonth() - 3, 1);
                end = new Date(now.getFullYear(), now.getMonth() + 9, 0);
                break;
            case 'all':
            default:
                // Find min/max from data
                const dates = opportunities
                    .filter(o => o.createdAt || o.expectedCloseDate)
                    .flatMap(o => [
                        o.createdAt ? new Date(o.createdAt) : null,
                        o.expectedCloseDate ? new Date(o.expectedCloseDate) : null,
                    ])
                    .filter(Boolean);

                if (dates.length === 0) {
                    start = new Date(now.getFullYear(), now.getMonth() - 2, 1);
                    end = new Date(now.getFullYear(), now.getMonth() + 4, 0);
                } else {
                    start = new Date(Math.min(...dates.map(d => d.getTime())));
                    end = new Date(Math.max(...dates.map(d => d.getTime())));
                    start.setMonth(start.getMonth() - 1);
                    end.setMonth(end.getMonth() + 1);
                }
        }

        start.setDate(1);
        end.setDate(28);

        return {
            startDate: start,
            endDate: end,
            totalDays: Math.max(1, (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)),
        };
    }, [timeRange, opportunities]);

    const monthLabels = useMemo(() => getMonthLabels(startDate, endDate), [startDate, endDate]);

    // Group opportunities
    const groupedOpps = useMemo(() => {
        const groups = {};

        opportunities.forEach(opp => {
            let key;
            switch (groupBy) {
                case 'region':
                    key = opp.region || 'Other';
                    break;
                case 'country':
                    key = opp.country || 'Unknown';
                    break;
                case 'status':
                default:
                    key = opp.status || 'active';
            }

            if (!groups[key]) {
                groups[key] = [];
            }
            groups[key].push(opp);
        });

        // Sort groups
        const sortOrder = groupBy === 'status'
            ? ['active', 'proposal', 'negotiation', 'won', 'lost', 'dormant']
            : Object.keys(groups).sort();

        return sortOrder
            .filter(key => groups[key])
            .map(key => ({
                key,
                label: key.charAt(0).toUpperCase() + key.slice(1),
                opportunities: groups[key].sort((a, b) =>
                    new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime()
                ),
            }));
    }, [opportunities, groupBy]);

    // Summary stats
    const stats = useMemo(() => {
        const active = opportunities.filter(o => ['active', 'proposal', 'negotiation'].includes(o.status));
        const totalValue = active.reduce((sum, o) => sum + (o.value || 0), 0);
        const weightedValue = active.reduce((sum, o) => sum + ((o.value || 0) * (o.probability || 50) / 100), 0);

        return {
            total: opportunities.length,
            active: active.length,
            totalValue,
            weightedValue,
        };
    }, [opportunities]);

    const handleSelectOpp = (opp) => {
        setSelectedOpp(opp);
        if (onSelectOpportunity) {
            // Pass the opportunity ID for navigation
            onSelectOpportunity(opp.id);
        }
    };

    if (opportunities.length === 0) {
        return (
            <div className="card p-8 text-center">
                <svg className="w-12 h-12 mx-auto text-gray-600 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <p className="text-gray-400">No opportunities to display</p>
            </div>
        );
    }

    return (
        <div
            ref={containerRef}
            className={`space-y-4 ${isFullscreen ? 'bg-dark-bg p-6 overflow-auto h-screen' : ''}`}
        >
            {/* Header Controls */}
            <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    {/* Time Range */}
                    <div className="flex items-center gap-1 bg-dark-card rounded-lg p-1">
                        {['3m', '6m', '12m', 'all'].map(range => (
                            <button
                                key={range}
                                onClick={() => setTimeRange(range)}
                                className={`px-3 py-1 text-xs rounded-md transition-colors ${timeRange === range
                                    ? 'bg-accent-primary/20 text-accent-primary'
                                    : 'text-gray-400 hover:text-gray-200'
                                    }`}
                            >
                                {range === 'all' ? 'All' : range.toUpperCase()}
                            </button>
                        ))}
                    </div>

                    {/* Group By */}
                    <select
                        value={groupBy}
                        onChange={(e) => setGroupBy(e.target.value)}
                        className="input-sm bg-dark-card"
                    >
                        <option value="status">Group by Status</option>
                        <option value="region">Group by Region</option>
                        <option value="country">Group by Country</option>
                    </select>

                    {/* Research Toggle */}
                    <button
                        onClick={() => setShowResearch(!showResearch)}
                        className={`px-3 py-1.5 text-xs rounded-lg flex items-center gap-1.5 transition-colors ${
                            showResearch
                                ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                                : 'bg-dark-card text-gray-400 hover:text-gray-200'
                        }`}
                        title="Toggle research events"
                    >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        Research
                        {showResearch && timelineEvents.length > 0 && (
                            <span className="bg-blue-500/30 px-1.5 rounded text-[10px]">{timelineEvents.length}</span>
                        )}
                    </button>
                </div>

                {/* Stats */}
                <div className="flex items-center gap-6 text-sm">
                    <div>
                        <span className="text-gray-500">Active: </span>
                        <span className="text-gray-200 font-medium">{stats.active}</span>
                    </div>
                    <div>
                        <span className="text-gray-500">Pipeline: </span>
                        <span className="text-emerald-400 font-medium">{formatCurrency(stats.totalValue, 'USD')}</span>
                    </div>
                    <div>
                        <span className="text-gray-500">Weighted: </span>
                        <span className="text-amber-400 font-medium">{formatCurrency(stats.weightedValue, 'USD')}</span>
                    </div>

                    {/* Fullscreen Toggle */}
                    <button
                        onClick={toggleFullscreen}
                        className="p-2 rounded-lg bg-dark-card hover:bg-dark-border transition-colors text-gray-400 hover:text-gray-200"
                        title={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
                    >
                        {isFullscreen ? (
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 9L4 4m0 0v4m0-4h4m6 10l5 5m0 0v-4m0 4h-4M9 15l-5 5m0 0h4m-4 0v-4m10-6l5-5m0 0h-4m4 0v4" />
                            </svg>
                        ) : (
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                            </svg>
                        )}
                    </button>
                </div>
            </div>

            {/* Gantt Chart */}
            <div className="card overflow-hidden">
                {/* Month Headers */}
                <div className="flex border-b border-dark-border bg-dark-bg/50">
                    <div className="w-48 flex-shrink-0 p-2 border-r border-dark-border">
                        <span className="text-xs font-medium text-gray-400">Opportunity</span>
                    </div>
                    <div className="flex-1 flex">
                        {monthLabels.map(month => (
                            <div
                                key={month.key}
                                className="flex-1 p-2 text-center text-xs text-gray-400 border-r border-dark-border/50 last:border-0"
                                style={{ minWidth: '60px' }}
                            >
                                {month.label}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Grouped Rows */}
                {groupedOpps.map(group => (
                    <div key={group.key}>
                        {/* Group Header */}
                        <div className="flex bg-dark-bg/30 border-b border-dark-border">
                            <div className="w-48 flex-shrink-0 p-2 border-r border-dark-border">
                                <span className="text-xs font-semibold text-gray-300 uppercase">{group.label}</span>
                                <span className="text-xs text-gray-500 ml-2">({group.opportunities.length})</span>
                            </div>
                            <div className="flex-1" />
                        </div>

                        {/* Opportunity Rows */}
                        {group.opportunities.map(opp => {
                            const barStyle = calculateBarPosition(opp, startDate, endDate, totalDays);

                            // Filter research events related to this opportunity
                            const oppEvents = showResearch
                                ? timelineEvents.filter(e =>
                                    e.opportunityId === opp.id ||
                                    e.metadata?.opportunityId === opp.id ||
                                    // Also show events matching client or country
                                    (e.metadata?.country && e.metadata.country === opp.country) ||
                                    (e.metadata?.clientId && e.metadata.clientId === opp.clientId)
                                )
                                : [];

                            return (
                                <div
                                    key={opp.id}
                                    className={`flex border-b border-dark-border/50 hover:bg-white/5 ${selectedOpp?.id === opp.id ? 'bg-accent-primary/10' : ''
                                        }`}
                                >
                                    {/* Label */}
                                    <div className="w-48 flex-shrink-0 p-2 border-r border-dark-border">
                                        <div
                                            className="text-sm text-gray-200 truncate cursor-pointer hover:text-accent-primary"
                                            onClick={() => handleSelectOpp(opp)}
                                            title={opp.title}
                                        >
                                            {opp.title}
                                        </div>
                                        <div className="text-[10px] text-gray-500 flex items-center gap-2">
                                            <span>{opp.country || opp.region}</span>
                                            {opp.value && (
                                                <span className="text-emerald-400">
                                                    {formatCurrency(opp.value, opp.currency || 'USD')}
                                                </span>
                                            )}
                                            {oppEvents.length > 0 && (
                                                <span className="text-blue-400 flex items-center gap-0.5">
                                                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                                    </svg>
                                                    {oppEvents.length}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Timeline Bar */}
                                    <div ref={timelineContainerRef} className="flex-1 relative h-12 py-2 group">
                                        {/* Month grid lines */}
                                        <div className="absolute inset-0 flex">
                                            {monthLabels.map(month => (
                                                <div
                                                    key={month.key}
                                                    className="flex-1 border-r border-dark-border/20 last:border-0"
                                                />
                                            ))}
                                        </div>

                                        {/* Today marker */}
                                        <TodayMarker startDate={startDate} totalDays={totalDays} />

                                        {/* Research event markers */}
                                        {oppEvents.map(event => (
                                            <ResearchMarker
                                                key={event.id}
                                                event={event}
                                                startDate={startDate}
                                                totalDays={totalDays}
                                                onClick={(e) => setSelectedEvent(e)}
                                            />
                                        ))}

                                        {/* Opportunity bar */}
                                        <OpportunityBar
                                            opp={opp}
                                            style={barStyle}
                                            onClick={handleSelectOpp}
                                            onDragEnd={handleDragEnd}
                                            startDate={startDate}
                                            totalDays={totalDays}
                                            containerWidth={timelineWidth}
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ))}
            </div>

            {/* Legend */}
            <div className="flex flex-wrap items-center gap-4 text-xs">
                <span className="text-gray-500">Status:</span>
                {Object.entries(STATUS_COLORS).map(([status, colors]) => (
                    <div key={status} className="flex items-center gap-1">
                        <div className={`w-3 h-3 rounded ${colors.bg}`} />
                        <span className="text-gray-400 capitalize">{status}</span>
                    </div>
                ))}
            </div>

            {/* Selected Opportunity Detail */}
            {selectedOpp && (
                <div className="card p-4">
                    <div className="flex items-start justify-between mb-3">
                        <div>
                            <h3 className="font-semibold text-gray-100">{selectedOpp.title}</h3>
                            <div className="text-sm text-gray-400">
                                {selectedOpp.country || selectedOpp.region}
                                {selectedOpp.client?.company && ` - ${selectedOpp.client.company}`}
                            </div>
                        </div>
                        <button
                            onClick={() => setSelectedOpp(null)}
                            className="text-gray-500 hover:text-gray-300"
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                            <label className="text-xs text-gray-500">Status</label>
                            <p className="capitalize text-gray-200">{selectedOpp.status}</p>
                        </div>
                        <div>
                            <label className="text-xs text-gray-500">Value</label>
                            <p className="text-emerald-400">
                                {formatCurrency(selectedOpp.value || 0, selectedOpp.currency || 'USD')}
                            </p>
                        </div>
                        <div>
                            <label className="text-xs text-gray-500">Probability</label>
                            <p className="text-gray-200">{selectedOpp.probability || 50}%</p>
                        </div>
                        <div>
                            <label className="text-xs text-gray-500">Expected Close</label>
                            <p className="text-gray-200">
                                {selectedOpp.expectedCloseDate
                                    ? new Date(selectedOpp.expectedCloseDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
                                    : '-'
                                }
                            </p>
                        </div>
                    </div>

                    {selectedOpp.brief && (
                        <div className="mt-3">
                            <label className="text-xs text-gray-500">Brief</label>
                            <p className="text-sm text-gray-300">{selectedOpp.brief}</p>
                        </div>
                    )}

                    {selectedOpp.nextAction && (
                        <div className="mt-3 p-2 bg-amber-500/10 border border-amber-500/20 rounded">
                            <label className="text-xs text-amber-400">Next Action</label>
                            <p className="text-sm text-gray-200">{selectedOpp.nextAction}</p>
                            {selectedOpp.nextActionDate && (
                                <p className="text-xs text-amber-400 mt-1">
                                    Due: {new Date(selectedOpp.nextActionDate).toLocaleDateString('en-GB')}
                                </p>
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* Selected Research Event Detail */}
            {selectedEvent && (
                <div className="card p-4 border-l-4 border-blue-500">
                    <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                            <div className={`w-3 h-3 rounded-full ${EVENT_CONFIGS[selectedEvent.type]?.bgColor || 'bg-blue-500'}`} />
                            <div>
                                <h3 className="font-semibold text-gray-100">{selectedEvent.title}</h3>
                                <div className="text-sm text-gray-400">
                                    {EVENT_CONFIGS[selectedEvent.type]?.label || 'Research Event'}
                                    {' • '}
                                    {new Date(selectedEvent.timestamp).toLocaleDateString('en-GB', {
                                        day: 'numeric',
                                        month: 'short',
                                        year: 'numeric'
                                    })}
                                </div>
                            </div>
                        </div>
                        <button
                            onClick={() => setSelectedEvent(null)}
                            className="text-gray-500 hover:text-gray-300"
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    {selectedEvent.description && (
                        <p className="text-sm text-gray-300 mb-3">{selectedEvent.description}</p>
                    )}

                    {selectedEvent.metadata && (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            {selectedEvent.metadata.source && (
                                <div>
                                    <label className="text-xs text-gray-500">Source</label>
                                    <p className="text-gray-200">{selectedEvent.metadata.source}</p>
                                </div>
                            )}
                            {selectedEvent.metadata.country && (
                                <div>
                                    <label className="text-xs text-gray-500">Country</label>
                                    <p className="text-gray-200">{selectedEvent.metadata.country}</p>
                                </div>
                            )}
                            {selectedEvent.metadata.url && (
                                <div className="col-span-2">
                                    <label className="text-xs text-gray-500">URL</label>
                                    <a
                                        href={selectedEvent.metadata.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-blue-400 hover:underline truncate block"
                                    >
                                        {selectedEvent.metadata.url}
                                    </a>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
