import React, { useState } from 'react';
import {
    AlertTriangle, CreditCard, Clock, RefreshCw, LogOut,
    Zap, Check, ArrowRight, Loader2, Mail
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useOrganizationStore } from '../store/organizationStore';
import { PLANS, createCheckoutSession, reactivateSubscription } from '../services/billingService';

export default function SubscriptionExpiredPage({
    type = 'expired', // 'expired', 'trial_expired', 'past_due', 'grace'
    message,
    hoursRemaining,
    subscription,
    onRetry,
}) {
    const { logout } = useAuthStore();
    const { organization } = useOrganizationStore();
    const [loading, setLoading] = useState(false);
    const [selectedPlan, setSelectedPlan] = useState('professional');
    const [billingCycle, setBillingCycle] = useState('monthly');
    const [error, setError] = useState(null);

    const handleSubscribe = async (planId) => {
        setLoading(true);
        setError(null);

        try {
            const { url } = await createCheckoutSession(planId, billingCycle);
            if (url) {
                window.location.href = url;
            }
        } catch (err) {
            setError(err.message || 'Failed to start checkout');
            setLoading(false);
        }
    };

    const handleReactivate = async () => {
        if (!subscription?.stripe_subscription_id) return;

        setLoading(true);
        setError(null);

        try {
            await reactivateSubscription(subscription.stripe_subscription_id);
            // Refresh to check subscription status
            if (onRetry) {
                onRetry();
            } else {
                window.location.reload();
            }
        } catch (err) {
            setError(err.message || 'Failed to reactivate subscription');
            setLoading(false);
        }
    };

    const getHeaderContent = () => {
        switch (type) {
            case 'trial_expired':
                return {
                    icon: <Clock className="w-16 h-16 text-amber-500" />,
                    title: 'Your Trial Has Ended',
                    description: 'Your 5-day trial has expired. Subscribe now to continue using all features.',
                };
            case 'past_due':
                return {
                    icon: <AlertTriangle className="w-16 h-16 text-red-500" />,
                    title: 'Payment Past Due',
                    description: 'We were unable to process your payment. Please update your payment method to continue.',
                };
            case 'grace':
                return {
                    icon: <Clock className="w-16 h-16 text-amber-500" />,
                    title: 'Subscription Ending Soon',
                    description: `You have ${hoursRemaining} hours remaining to resubscribe and keep your data.`,
                };
            default:
                return {
                    icon: <AlertTriangle className="w-16 h-16 text-red-500" />,
                    title: 'Subscription Expired',
                    description: message || 'Your subscription has expired. Please resubscribe to continue.',
                };
        }
    };

    const header = getHeaderContent();

    // Plans to display (exclude free for expired users)
    const availablePlans = Object.values(PLANS).filter(p => p.id !== 'free');

    return (
        <div className="min-h-screen bg-dark-bg flex items-center justify-center p-4">
            <div className="max-w-4xl w-full">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="flex justify-center mb-4">
                        {header.icon}
                    </div>
                    <h1 className="text-3xl font-bold text-white mb-2">
                        {header.title}
                    </h1>
                    <p className="text-gray-400 text-lg max-w-md mx-auto">
                        {header.description}
                    </p>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-center text-red-400">
                        {error}
                    </div>
                )}

                {/* Grace Period Warning */}
                {type === 'grace' && hoursRemaining && (
                    <div className="mb-6 p-4 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                        <div className="flex items-center justify-center gap-3">
                            <Clock className="w-5 h-5 text-amber-500" />
                            <span className="text-amber-400 font-medium">
                                {hoursRemaining} hours remaining in grace period
                            </span>
                        </div>
                        <p className="text-center text-sm text-amber-400/80 mt-2">
                            After this period, your account will be locked and data may be deleted.
                        </p>
                    </div>
                )}

                {/* Reactivate Option (for canceled subscriptions) */}
                {subscription?.cancel_at_period_end && (
                    <div className="mb-6 p-6 bg-dark-card border border-dark-border rounded-lg text-center">
                        <h3 className="text-lg font-semibold text-white mb-2">
                            Want to keep your subscription?
                        </h3>
                        <p className="text-gray-400 mb-4">
                            Your {subscription.plan_id} plan is still active until the end of your billing period.
                        </p>
                        <button
                            onClick={handleReactivate}
                            disabled={loading}
                            className="px-6 py-3 bg-green-600 hover:bg-green-500 text-white font-medium rounded-lg flex items-center gap-2 mx-auto"
                        >
                            {loading ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                <RefreshCw className="w-5 h-5" />
                            )}
                            Reactivate My Subscription
                        </button>
                    </div>
                )}

                {/* Billing Cycle Toggle */}
                <div className="flex justify-center mb-6">
                    <div className="flex items-center gap-2 bg-dark-card border border-dark-border rounded-lg p-1">
                        <button
                            onClick={() => setBillingCycle('monthly')}
                            className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
                                billingCycle === 'monthly'
                                    ? 'bg-brand-primary text-white'
                                    : 'text-gray-400 hover:text-white'
                            }`}
                        >
                            Monthly
                        </button>
                        <button
                            onClick={() => setBillingCycle('yearly')}
                            className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
                                billingCycle === 'yearly'
                                    ? 'bg-brand-primary text-white'
                                    : 'text-gray-400 hover:text-white'
                            }`}
                        >
                            Yearly
                            <span className="ml-1 text-xs text-green-400">Save 17%</span>
                        </button>
                    </div>
                </div>

                {/* Plans */}
                <div className="grid md:grid-cols-3 gap-4 mb-8">
                    {availablePlans.map((plan) => {
                        const price = billingCycle === 'yearly' ? plan.priceYearly / 12 : plan.priceMonthly;
                        const isPopular = plan.popular;
                        const isSelected = selectedPlan === plan.id;

                        return (
                            <div
                                key={plan.id}
                                onClick={() => setSelectedPlan(plan.id)}
                                className={`relative bg-dark-card border rounded-lg p-5 cursor-pointer transition-all ${
                                    isSelected
                                        ? 'border-brand-primary ring-2 ring-brand-primary'
                                        : isPopular
                                        ? 'border-brand-primary/50'
                                        : 'border-dark-border hover:border-gray-600'
                                }`}
                            >
                                {isPopular && (
                                    <div className="absolute -top-3 inset-x-0 flex justify-center">
                                        <span className="px-3 py-0.5 bg-brand-primary text-white text-xs font-medium rounded-full">
                                            Most Popular
                                        </span>
                                    </div>
                                )}

                                <h4 className="text-lg font-semibold text-white">{plan.name}</h4>
                                <p className="text-sm text-gray-500 mt-1">{plan.description}</p>

                                <div className="mt-4">
                                    <span className="text-3xl font-bold text-white">
                                        ${price}
                                    </span>
                                    <span className="text-gray-500">/mo</span>
                                    {billingCycle === 'yearly' && (
                                        <p className="text-xs text-gray-500 mt-1">
                                            Billed ${plan.priceYearly} yearly
                                        </p>
                                    )}
                                </div>

                                <ul className="mt-4 space-y-2">
                                    {plan.features.slice(0, 4).map((feature, i) => (
                                        <li key={i} className="flex items-start gap-2 text-sm text-gray-300">
                                            <Check className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                                            {feature}
                                        </li>
                                    ))}
                                </ul>

                                {isSelected && (
                                    <div className="absolute top-3 right-3">
                                        <div className="w-6 h-6 bg-brand-primary rounded-full flex items-center justify-center">
                                            <Check className="w-4 h-4 text-white" />
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* Subscribe Button */}
                <div className="text-center space-y-4">
                    <button
                        onClick={() => handleSubscribe(selectedPlan)}
                        disabled={loading}
                        className="px-8 py-4 bg-brand-primary hover:bg-brand-primary/90 text-white font-semibold rounded-lg flex items-center gap-3 mx-auto text-lg"
                    >
                        {loading ? (
                            <Loader2 className="w-6 h-6 animate-spin" />
                        ) : (
                            <CreditCard className="w-6 h-6" />
                        )}
                        {loading ? 'Processing...' : `Subscribe to ${PLANS[selectedPlan]?.name}`}
                        {!loading && <ArrowRight className="w-5 h-5" />}
                    </button>

                    <p className="text-sm text-gray-500">
                        Secure payment powered by Stripe. Cancel anytime.
                    </p>
                </div>

                {/* Footer Actions */}
                <div className="mt-8 pt-6 border-t border-dark-border flex items-center justify-between">
                    <button
                        onClick={logout}
                        className="text-gray-400 hover:text-white flex items-center gap-2 text-sm"
                    >
                        <LogOut className="w-4 h-4" />
                        Sign out
                    </button>

                    <div className="flex items-center gap-4 text-sm text-gray-500">
                        <a
                            href="mailto:support@productionos.io"
                            className="hover:text-white flex items-center gap-1"
                        >
                            <Mail className="w-4 h-4" />
                            Contact Support
                        </a>
                        {onRetry && (
                            <button
                                onClick={onRetry}
                                className="hover:text-white flex items-center gap-1"
                            >
                                <RefreshCw className="w-4 h-4" />
                                Retry
                            </button>
                        )}
                    </div>
                </div>

                {/* Organization Info */}
                {organization && (
                    <div className="mt-4 text-center text-xs text-gray-600">
                        {organization.name}
                    </div>
                )}
            </div>
        </div>
    );
}
