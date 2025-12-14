import { useState } from 'react';
import { useActivityStore, ACTIVITY_TYPES } from '../../store/activityStore';
import { formatDistanceToNow, format } from 'date-fns';

// Activity type icons as SVG paths
const ICONS = {
    phone: "M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z",
    mail: "M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z",
    users: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z",
    'file-text': "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z",
    'check-square': "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4",
    send: "M12 19l9 2-9-18-9 18 9-2zm0 0v-8",
    trophy: "M5 3h14M5 3a2 2 0 00-2 2v1c0 2.5 2 4 2 4s0 1.5-2 4v1a2 2 0 002 2h14a2 2 0 002-2v-1c-2-2.5-2-4-2-4s2-1.5 2-4V5a2 2 0 00-2-2M5 3h14M12 17v4m-4 0h8",
    'x-circle': "M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z",
    clock: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z",
    'more-horizontal': "M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z",
};

function ActivityIcon({ type, className = "" }) {
    const config = ACTIVITY_TYPES[type] || ACTIVITY_TYPES.other;
    const iconPath = ICONS[config.icon] || ICONS['more-horizontal'];

    return (
        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${config.bgColor} ${className}`}>
            <svg className={`w-4 h-4 ${config.color}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={iconPath} />
            </svg>
        </div>
    );
}

function formatActivityDate(dateStr) {
    const date = new Date(dateStr);
    const now = new Date();
    const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
        return `Today at ${format(date, 'h:mm a')}`;
    } else if (diffDays === 1) {
        return `Yesterday at ${format(date, 'h:mm a')}`;
    } else if (diffDays < 7) {
        return format(date, 'EEEE') + ` at ${format(date, 'h:mm a')}`;
    } else {
        return format(date, 'MMM d, yyyy');
    }
}

export default function ActivityTimeline({
    activities,
    onEdit,
    onDelete,
    onCompleteFollowUp,
    showClient = false,
    emptyMessage = "No activities yet",
    maxItems = 50,
}) {
    const [expandedId, setExpandedId] = useState(null);

    if (!activities || activities.length === 0) {
        return (
            <div className="text-center py-8 border-2 border-dashed border-dark-border/50 rounded-xl bg-dark-bg/30">
                <svg className="w-10 h-10 mx-auto mb-3 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-gray-500 text-sm">{emptyMessage}</p>
            </div>
        );
    }

    const displayActivities = activities.slice(0, maxItems);

    return (
        <div className="space-y-1">
            {displayActivities.map((activity, index) => {
                const config = ACTIVITY_TYPES[activity.type] || ACTIVITY_TYPES.other;
                const isExpanded = expandedId === activity.id;
                const isOverdue = activity.followUpDate &&
                    !activity.followUpCompleted &&
                    new Date(activity.followUpDate) < new Date();

                return (
                    <div
                        key={activity.id}
                        className={`relative pl-10 pb-4 ${index !== displayActivities.length - 1 ? 'border-l-2 border-dark-border ml-4' : 'ml-4'}`}
                    >
                        {/* Timeline dot */}
                        <div className="absolute left-0 -translate-x-1/2 top-0">
                            <ActivityIcon type={activity.type} />
                        </div>

                        {/* Activity card */}
                        <div
                            className={`card hover:border-white/10 transition-colors cursor-pointer ${isOverdue ? 'border-red-500/30 bg-red-500/5' : ''}`}
                            onClick={() => setExpandedId(isExpanded ? null : activity.id)}
                        >
                            <div className="flex items-start justify-between gap-3">
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <span className={`text-xs font-medium px-2 py-0.5 rounded ${config.bgColor} ${config.color}`}>
                                            {config.label}
                                        </span>
                                        <span className="text-xs text-gray-500">
                                            {formatActivityDate(activity.activityDate)}
                                        </span>
                                        {activity.followUpDate && !activity.followUpCompleted && (
                                            <span className={`text-xs px-2 py-0.5 rounded ${isOverdue ? 'bg-red-500/20 text-red-400' : 'bg-orange-500/20 text-orange-400'}`}>
                                                Follow-up: {format(new Date(activity.followUpDate), 'MMM d')}
                                            </span>
                                        )}
                                        {activity.followUpCompleted && (
                                            <span className="text-xs px-2 py-0.5 rounded bg-green-500/20 text-green-400">
                                                Completed
                                            </span>
                                        )}
                                    </div>
                                    <h4 className="text-sm font-medium text-gray-200 mt-1">{activity.title}</h4>
                                    {activity.description && !isExpanded && (
                                        <p className="text-xs text-gray-500 mt-1 line-clamp-1">{activity.description}</p>
                                    )}
                                </div>

                                {/* Action buttons */}
                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    {activity.followUpDate && !activity.followUpCompleted && onCompleteFollowUp && (
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onCompleteFollowUp(activity.id);
                                            }}
                                            className="p-1.5 text-gray-500 hover:text-green-400 hover:bg-green-400/10 rounded transition-colors"
                                            title="Mark follow-up complete"
                                        >
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                            </svg>
                                        </button>
                                    )}
                                    {onDelete && (
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                if (window.confirm('Delete this activity?')) {
                                                    onDelete(activity.id);
                                                }
                                            }}
                                            className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-red-400/10 rounded transition-colors"
                                            title="Delete"
                                        >
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                            </svg>
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Expanded details */}
                            {isExpanded && activity.description && (
                                <div className="mt-3 pt-3 border-t border-dark-border">
                                    <p className="text-sm text-gray-400 whitespace-pre-wrap">{activity.description}</p>
                                    {activity.loggedByName && (
                                        <p className="text-xs text-gray-600 mt-2">
                                            Logged by {activity.loggedByName}
                                        </p>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                );
            })}

            {activities.length > maxItems && (
                <div className="text-center pt-2">
                    <p className="text-xs text-gray-500">
                        Showing {maxItems} of {activities.length} activities
                    </p>
                </div>
            )}
        </div>
    );
}
