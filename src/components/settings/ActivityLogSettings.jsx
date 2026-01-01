import { useSettingsStore } from '../../store/settingsStore';

export default function ActivityLogSettings() {
    const {
        settings,
        clearActivityLog,
        exportActivityLog,
    } = useSettingsStore();

    return (
        <div className="max-w-4xl">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h3 className="text-xl font-bold text-gray-100 mb-2">Activity Log</h3>
                    <p className="text-sm text-gray-500">
                        Track all changes made to quotes across your team.
                    </p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={exportActivityLog}
                        className="btn-ghost text-sm flex items-center gap-2"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        Export CSV
                    </button>
                    <button
                        onClick={() => {
                            if (confirm('Are you sure you want to clear all activity logs?')) {
                                clearActivityLog();
                            }
                        }}
                        className="btn-ghost text-sm text-red-400 hover:text-red-300"
                    >
                        Clear All
                    </button>
                </div>
            </div>

            <div className="bg-dark-card border border-dark-border rounded-lg overflow-hidden">
                {(!settings.activityLog || settings.activityLog.length === 0) ? (
                    <div className="p-8 text-center text-gray-500">
                        <svg className="w-12 h-12 mx-auto mb-3 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <p className="text-sm">No activity recorded yet</p>
                        <p className="text-xs text-gray-600 mt-1">Changes to quotes will appear here</p>
                    </div>
                ) : (
                    <div className="divide-y divide-dark-border max-h-[600px] overflow-y-auto">
                        {settings.activityLog.map((log) => {
                            const date = new Date(log.timestamp);
                            const actionColors = {
                                lock: 'text-amber-400 bg-amber-500/10',
                                unlock: 'text-green-400 bg-green-500/10',
                                create: 'text-blue-400 bg-blue-500/10',
                                update: 'text-gray-400 bg-gray-500/10',
                                delete: 'text-red-400 bg-red-500/10',
                                status_change: 'text-purple-400 bg-purple-500/10',
                            };
                            const colorClass = actionColors[log.action] || 'text-gray-400 bg-gray-500/10';

                            return (
                                <div key={log.id} className="p-4 hover:bg-dark-bg/30 transition-colors">
                                    <div className="flex items-start gap-3">
                                        <div className={`px-2 py-1 rounded text-xs font-medium ${colorClass}`}>
                                            {log.action?.replace('_', ' ').toUpperCase()}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm text-gray-200">
                                                {log.description || `${log.action} on ${log.field || 'quote'}`}
                                            </p>
                                            <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                                                {log.quoteNumber && (
                                                    <span className="font-mono text-accent-primary">#{log.quoteNumber}</span>
                                                )}
                                                <span>{log.userName || log.userId || 'System'}</span>
                                                <span>{date.toLocaleDateString('en-GB', {
                                                    day: 'numeric',
                                                    month: 'short',
                                                    year: 'numeric',
                                                    hour: '2-digit',
                                                    minute: '2-digit'
                                                })}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            <p className="text-xs text-gray-600 mt-4">
                Activity log stores up to 1,000 entries. Older entries are automatically removed.
            </p>
        </div>
    );
}
