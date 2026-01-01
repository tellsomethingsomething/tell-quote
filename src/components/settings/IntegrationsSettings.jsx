/**
 * IntegrationsSettings Component
 *
 * Manages email and calendar integrations for the settings page.
 * Supports Google and Microsoft OAuth connections.
 */
import { useEffect } from 'react';
import { useEmailStore } from '../../store/emailStore';
import { useCalendarStore } from '../../store/calendarStore';

export default function IntegrationsSettings() {
    // Email connections
    const {
        connections: emailConnections,
        activeConnection,
        isConnecting: emailConnecting,
        connectionError: emailError,
        connectGoogle: connectEmailGoogle,
        connectMicrosoft: connectEmailMicrosoft,
        disconnectAccount,
        initialize: initializeEmail,
    } = useEmailStore();

    // Calendar connections
    const {
        msSyncStatus,
        googleSyncStatus,
        isSyncing: calendarSyncing,
        connectMicrosoft: connectCalendarMicrosoft,
        disconnectMicrosoft: disconnectCalendarMicrosoft,
        syncFromMicrosoft,
        connectGoogle: connectCalendarGoogle,
        disconnectGoogle: disconnectCalendarGoogle,
        syncFromGoogle,
        initialize: initializeCalendar,
    } = useCalendarStore();

    useEffect(() => {
        initializeEmail();
        initializeCalendar();
    }, []);

    const activeEmailConnections = emailConnections?.filter(c => c.status === 'active') || [];

    return (
        <div className="max-w-2xl">
            <h3 className="text-xl font-bold text-gray-100 mb-2">Integrations</h3>
            <p className="text-sm text-gray-500 mb-6">
                Connect your email and calendar accounts for syncing.
            </p>

            {/* Email Connections */}
            <div className="mb-8">
                <h4 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    Email Accounts
                </h4>

                {emailError && (
                    <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 mb-4 text-red-400 text-sm">
                        {emailError}
                    </div>
                )}

                {/* Connected Email Accounts */}
                {activeEmailConnections.length > 0 && (
                    <div className="space-y-2 mb-4">
                        {activeEmailConnections.map(conn => (
                            <div key={conn.id} className="flex items-center justify-between p-3 bg-dark-card border border-dark-border rounded-lg">
                                <div className="flex items-center gap-3">
                                    {conn.provider === 'microsoft' ? (
                                        <div className="w-8 h-8 rounded flex items-center justify-center bg-[#0078D4]/20">
                                            <svg className="w-5 h-5" viewBox="0 0 21 21">
                                                <rect x="1" y="1" width="9" height="9" fill="#f25022"/>
                                                <rect x="1" y="11" width="9" height="9" fill="#00a4ef"/>
                                                <rect x="11" y="1" width="9" height="9" fill="#7fba00"/>
                                                <rect x="11" y="11" width="9" height="9" fill="#ffb900"/>
                                            </svg>
                                        </div>
                                    ) : (
                                        <div className="w-8 h-8 rounded flex items-center justify-center bg-red-500/20">
                                            <svg className="w-5 h-5" viewBox="0 0 24 24">
                                                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                                                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                                                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                                                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                                            </svg>
                                        </div>
                                    )}
                                    <div>
                                        <p className="text-sm font-medium text-white">{conn.email}</p>
                                        <div className="flex items-center gap-1 text-xs text-green-400">
                                            <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
                                            Connected
                                        </div>
                                    </div>
                                </div>
                                <button
                                    onClick={() => disconnectAccount(conn.id)}
                                    className="text-sm text-red-400 hover:text-red-300"
                                >
                                    Disconnect
                                </button>
                            </div>
                        ))}
                    </div>
                )}

                {/* Add Email Account Buttons */}
                <div className="flex gap-3">
                    <button
                        onClick={connectEmailGoogle}
                        disabled={emailConnecting}
                        className="flex items-center gap-2 px-4 py-2.5 bg-white text-gray-900 rounded-lg hover:bg-gray-100 transition-colors font-medium"
                    >
                        <svg className="w-5 h-5" viewBox="0 0 24 24">
                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                        </svg>
                        {emailConnecting ? 'Connecting...' : 'Add Gmail'}
                    </button>
                    <button
                        onClick={connectEmailMicrosoft}
                        disabled={emailConnecting}
                        className="flex items-center gap-2 px-4 py-2.5 bg-[#0078D4] text-white rounded-lg hover:bg-[#106EBE] transition-colors font-medium"
                    >
                        <svg className="w-5 h-5" viewBox="0 0 21 21">
                            <rect x="1" y="1" width="9" height="9" fill="#f25022"/>
                            <rect x="1" y="11" width="9" height="9" fill="#00a4ef"/>
                            <rect x="11" y="1" width="9" height="9" fill="#7fba00"/>
                            <rect x="11" y="11" width="9" height="9" fill="#ffb900"/>
                        </svg>
                        {emailConnecting ? 'Connecting...' : 'Add Outlook'}
                    </button>
                </div>
            </div>

            {/* Calendar Connections */}
            <div>
                <h4 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    Calendar Sync
                </h4>

                <div className="space-y-3">
                    {/* Google Calendar */}
                    <div className="p-4 bg-dark-card border border-dark-border rounded-lg">
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded flex items-center justify-center bg-red-500/20">
                                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                                    </svg>
                                </div>
                                <div>
                                    <p className="font-medium text-white">Google Calendar</p>
                                    <p className={`text-xs ${googleSyncStatus === 'connected' ? 'text-green-400' : 'text-gray-500'}`}>
                                        {googleSyncStatus === 'connected' ? 'Connected' : 'Not connected'}
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            {googleSyncStatus === 'connected' ? (
                                <>
                                    <button
                                        onClick={syncFromGoogle}
                                        disabled={calendarSyncing}
                                        className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-dark-bg border border-dark-border rounded-lg text-white hover:bg-dark-nav transition-colors"
                                    >
                                        {calendarSyncing ? 'Syncing...' : 'Sync Now'}
                                    </button>
                                    <button
                                        onClick={disconnectCalendarGoogle}
                                        className="px-3 py-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                                    >
                                        Disconnect
                                    </button>
                                </>
                            ) : (
                                <button
                                    onClick={connectCalendarGoogle}
                                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-white text-gray-900 rounded-lg hover:bg-gray-100 transition-colors"
                                >
                                    Connect Google Calendar
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Microsoft Calendar */}
                    <div className="p-4 bg-dark-card border border-dark-border rounded-lg">
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded flex items-center justify-center bg-[#0078D4]/20">
                                    <svg className="w-5 h-5" viewBox="0 0 21 21">
                                        <rect x="1" y="1" width="9" height="9" fill="#f25022"/>
                                        <rect x="1" y="11" width="9" height="9" fill="#00a4ef"/>
                                        <rect x="11" y="1" width="9" height="9" fill="#7fba00"/>
                                        <rect x="11" y="11" width="9" height="9" fill="#ffb900"/>
                                    </svg>
                                </div>
                                <div>
                                    <p className="font-medium text-white">Microsoft Calendar</p>
                                    <p className={`text-xs ${msSyncStatus === 'connected' ? 'text-green-400' : 'text-gray-500'}`}>
                                        {msSyncStatus === 'connected' ? 'Connected' : 'Not connected'}
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            {msSyncStatus === 'connected' ? (
                                <>
                                    <button
                                        onClick={syncFromMicrosoft}
                                        disabled={calendarSyncing}
                                        className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-dark-bg border border-dark-border rounded-lg text-white hover:bg-dark-nav transition-colors"
                                    >
                                        {calendarSyncing ? 'Syncing...' : 'Sync Now'}
                                    </button>
                                    <button
                                        onClick={disconnectCalendarMicrosoft}
                                        className="px-3 py-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                                    >
                                        Disconnect
                                    </button>
                                </>
                            ) : (
                                <button
                                    onClick={connectCalendarMicrosoft}
                                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-[#0078D4] text-white rounded-lg hover:bg-[#106EBE] transition-colors"
                                >
                                    Connect Microsoft Calendar
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
