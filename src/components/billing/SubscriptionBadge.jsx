/**
 * Subscription Status Badge
 * Shows trial/subscription status in the app header
 */
import React, { useState, useEffect } from 'react';
import { Clock, AlertTriangle, CreditCard, Zap } from 'lucide-react';
import { useOrganizationStore } from '../../store/organizationStore';
import { checkSubscriptionAccess, ACCESS_LEVELS } from '../../services/subscriptionGuard';

export default function SubscriptionBadge({ onUpgrade }) {
    const { organization } = useOrganizationStore();
    const [status, setStatus] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (organization?.id) {
            loadStatus();
        }
    }, [organization?.id]);

    const loadStatus = async () => {
        try {
            const result = await checkSubscriptionAccess(organization.id);
            setStatus(result);
        } catch (err) {
            console.error('Failed to check subscription:', err);
        } finally {
            setLoading(false);
        }
    };

    if (loading || !status) {
        return null;
    }

    // Don't show badge for active subscriptions (not trial)
    if (status.access === ACCESS_LEVELS.FULL && !status.isTrial && !status.cancelAtPeriodEnd) {
        return null;
    }

    // Trial badge
    if (status.isTrial) {
        const isUrgent = status.hoursRemaining && status.hoursRemaining <= 24;

        return (
            <button
                onClick={onUpgrade}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    isUrgent
                        ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30 hover:bg-amber-500/30'
                        : 'bg-green-500/20 text-green-400 border border-green-500/30 hover:bg-green-500/30'
                }`}
                title={`Trial ${status.daysRemaining ? `ends in ${status.daysRemaining} days` : 'active'}`}
            >
                <Clock className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">
                    {isUrgent
                        ? `${status.hoursRemaining}h left`
                        : status.daysRemaining
                        ? `${status.daysRemaining}d trial`
                        : 'Trial'
                    }
                </span>
                <Zap className="w-3 h-3 hidden sm:block" />
            </button>
        );
    }

    // Cancellation pending badge
    if (status.cancelAtPeriodEnd) {
        return (
            <button
                onClick={onUpgrade}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-amber-500/20 text-amber-400 border border-amber-500/30 hover:bg-amber-500/30 transition-all"
                title={`Subscription ends ${status.daysRemaining ? `in ${status.daysRemaining} days` : 'soon'}`}
            >
                <AlertTriangle className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Ending</span>
            </button>
        );
    }

    // Warning/Past due badge
    if (status.access === ACCESS_LEVELS.WARNING) {
        return (
            <button
                onClick={onUpgrade}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30 transition-all animate-pulse"
                title="Payment required"
            >
                <CreditCard className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Update Payment</span>
            </button>
        );
    }

    // Grace period badge
    if (status.access === ACCESS_LEVELS.GRACE) {
        return (
            <button
                onClick={onUpgrade}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30 transition-all animate-pulse"
                title={`Grace period: ${status.hoursRemaining}h remaining`}
            >
                <AlertTriangle className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{status.hoursRemaining}h left</span>
            </button>
        );
    }

    return null;
}
