import React, { useState, useEffect, useCallback } from 'react';
import { AlertTriangle, Clock, X, Sparkles, Timer } from 'lucide-react';
import { getTrialStatus, getTrialMessage, TRIAL_STATUS } from '../../services/trialService';

// Format countdown time
function formatCountdown(hoursRemaining) {
    if (hoursRemaining <= 0) return { text: 'Expired', urgent: true };

    const days = Math.floor(hoursRemaining / 24);
    const hours = Math.floor(hoursRemaining % 24);
    const minutes = Math.floor((hoursRemaining % 1) * 60);

    if (days > 0) {
        return {
            text: `${days}d ${hours}h`,
            urgent: days < 1,
            days,
            hours
        };
    }
    if (hours > 0) {
        return {
            text: `${hours}h ${minutes}m`,
            urgent: hours < 6,
            hours,
            minutes
        };
    }
    return {
        text: `${minutes}m`,
        urgent: true,
        minutes
    };
}

export default function TrialBanner({ organizationId, onUpgrade }) {
    const [trialStatus, setTrialStatus] = useState(null);
    const [dismissed, setDismissed] = useState(false);
    const [loading, setLoading] = useState(true);
    const [countdown, setCountdown] = useState(null);

    const loadTrialStatus = useCallback(async () => {
        if (!organizationId) {
            setLoading(false);
            return;
        }

        const status = await getTrialStatus(organizationId);
        setTrialStatus(status);
        if (status?.hoursRemaining) {
            setCountdown(formatCountdown(status.hoursRemaining));
        }
        setLoading(false);
    }, [organizationId]);

    useEffect(() => {
        loadTrialStatus();
    }, [loadTrialStatus]);

    // Live countdown timer - update every minute when < 24 hours
    useEffect(() => {
        if (!trialStatus?.trialEndsAt || trialStatus.status === TRIAL_STATUS.CONVERTED) return;

        const updateCountdown = () => {
            const now = new Date();
            const endsAt = new Date(trialStatus.trialEndsAt);
            const hoursRemaining = (endsAt - now) / (1000 * 60 * 60);
            setCountdown(formatCountdown(hoursRemaining));
        };

        // Update immediately
        updateCountdown();

        // Update every minute if < 24 hours, every hour otherwise
        const interval = trialStatus.hoursRemaining < 24 ? 60000 : 3600000;
        const timer = setInterval(updateCountdown, interval);

        return () => clearInterval(timer);
    }, [trialStatus]);

    const handleDismiss = () => {
        setDismissed(true);
        // Remember dismissal for this session
        sessionStorage.setItem(`trial-banner-dismissed-${organizationId}`, 'true');
    };

    const handleUpgrade = () => {
        if (onUpgrade) {
            onUpgrade();
        }
    };

    // Check if previously dismissed this session
    useEffect(() => {
        const wasDismissed = sessionStorage.getItem(`trial-banner-dismissed-${organizationId}`);
        if (wasDismissed) {
            setDismissed(true);
        }
    }, [organizationId]);

    if (loading || !trialStatus) return null;

    // Don't show for converted users (they've upgraded)
    if (trialStatus.status === TRIAL_STATUS.CONVERTED) {
        return null;
    }

    const message = getTrialMessage(trialStatus);
    if (!message || dismissed) return null;

    // Determine urgency level
    const isUrgent = countdown?.urgent || trialStatus.status === TRIAL_STATUS.EXPIRING_SOON;
    const isCritical = trialStatus.hoursRemaining <= 6 || trialStatus.status === TRIAL_STATUS.EXPIRED;

    const bannerStyles = {
        success: 'bg-teal-500/20 border-teal-500/30 text-teal-200',
        warning: 'bg-amber-500/20 border-amber-500/30 text-amber-200',
        error: 'bg-red-500/20 border-red-500/30 text-red-200',
        info: 'bg-blue-500/20 border-blue-500/30 text-blue-200',
    };

    const iconStyles = {
        success: 'text-teal-400',
        warning: 'text-amber-400',
        error: 'text-red-400',
        info: 'text-blue-400',
    };

    const style = bannerStyles[message.type] || bannerStyles.info;
    const iconStyle = iconStyles[message.type] || iconStyles.info;

    return (
        <div className={`${style} border rounded-lg p-4 mb-4 ${isCritical ? 'animate-pulse' : ''}`}>
            <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 flex-1">
                    {/* Countdown Timer Badge */}
                    {countdown && trialStatus.status !== TRIAL_STATUS.EXPIRED && (
                        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg ${
                            isCritical
                                ? 'bg-red-500/30 text-red-300'
                                : isUrgent
                                    ? 'bg-amber-500/30 text-amber-300'
                                    : 'bg-white/10 text-white'
                        }`}>
                            <Timer className={`w-4 h-4 ${isCritical ? 'animate-pulse' : ''}`} />
                            <span className="font-mono font-bold text-lg tabular-nums">
                                {countdown.text}
                            </span>
                        </div>
                    )}

                    {message.type === 'error' ? (
                        <AlertTriangle className={`w-5 h-5 ${iconStyle} flex-shrink-0`} />
                    ) : (
                        <Clock className={`w-5 h-5 ${iconStyle} flex-shrink-0`} />
                    )}
                    <div>
                        <p className="font-medium">{message.title}</p>
                        <p className="text-sm opacity-80">{message.message}</p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    {message.showUpgrade && (
                        <button
                            onClick={handleUpgrade}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                                isCritical
                                    ? 'bg-red-500 text-white hover:bg-red-600 animate-pulse'
                                    : isUrgent
                                        ? 'bg-amber-500 text-white hover:bg-amber-600'
                                        : 'bg-brand-orange text-white hover:bg-brand-orange/90'
                            }`}
                        >
                            <Sparkles className="w-4 h-4" />
                            Upgrade Now
                        </button>
                    )}
                    {trialStatus.status !== TRIAL_STATUS.EXPIRED && (
                        <button
                            onClick={handleDismiss}
                            className="text-current opacity-60 hover:opacity-100 transition-opacity p-1"
                            title="Dismiss"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}

/**
 * Read-only mode overlay for blocked actions
 */
export function ReadOnlyOverlay({ onUpgrade }) {
    return (
        <div className="fixed inset-0 bg-dark-bg/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-dark-card border border-dark-border rounded-xl p-8 max-w-md text-center">
                <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-4">
                    <AlertTriangle className="w-8 h-8 text-red-400" />
                </div>
                <h2 className="text-xl font-bold text-white mb-2">Trial Expired</h2>
                <p className="text-gray-400 mb-6">
                    Your free trial has ended. Upgrade to a paid plan to continue creating
                    and editing quotes, projects, and clients.
                </p>
                <div className="space-y-3">
                    <button
                        onClick={onUpgrade}
                        className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-brand-orange text-white rounded-lg hover:bg-brand-orange/90 transition-colors font-medium"
                    >
                        <Sparkles className="w-5 h-5" />
                        Upgrade Now
                    </button>
                    <p className="text-sm text-gray-500">
                        You can still view and export your existing data.
                    </p>
                </div>
            </div>
        </div>
    );
}

/**
 * Inline read-only badge for buttons
 */
export function ReadOnlyBadge() {
    return (
        <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-500/20 text-red-400 rounded text-xs font-medium">
            <AlertTriangle className="w-3 h-3" />
            Trial Expired
        </span>
    );
}

/**
 * Hook to check if actions should be blocked
 */
export function useTrialGuard(organizationId) {
    const [trialStatus, setTrialStatus] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadStatus = async () => {
            if (!organizationId) {
                setLoading(false);
                return;
            }
            const status = await getTrialStatus(organizationId);
            setTrialStatus(status);
            setLoading(false);
        };
        loadStatus();
    }, [organizationId]);

    const isBlocked = trialStatus?.status === TRIAL_STATUS.EXPIRED;
    const isReadOnly = trialStatus?.isReadOnly || false;

    return {
        loading,
        trialStatus,
        isBlocked,
        isReadOnly,
        daysRemaining: trialStatus?.daysRemaining,
    };
}
