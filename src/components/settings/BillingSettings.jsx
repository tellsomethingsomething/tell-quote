import React, { useState, useEffect } from 'react';
import {
    CreditCard, Check, AlertCircle, Loader2, ExternalLink,
    Crown, Zap, Building2, Users, FileText, Calendar, ArrowRight,
    XCircle, RefreshCw, AlertTriangle, X, MessageSquare
} from 'lucide-react';
import { useOrganizationStore } from '../../store/organizationStore';
import {
    PLANS,
    createCheckoutSession,
    createPortalSession,
    getSubscriptionStatus,
    getUsageStats,
    checkPlanLimits,
    formatPrice,
    getInvoiceHistory,
    cancelSubscription,
    reactivateSubscription,
} from '../../services/billingService';
import logger from '../../utils/logger';

// Cancellation reasons
const CANCELLATION_REASONS = [
    { id: 'too_expensive', label: 'Too expensive' },
    { id: 'not_using', label: 'Not using it enough' },
    { id: 'missing_features', label: 'Missing features I need' },
    { id: 'switching_competitor', label: 'Switching to a competitor' },
    { id: 'project_ended', label: 'Project/business ended' },
    { id: 'other', label: 'Other reason' },
];

export default function BillingSettings() {
    const { organization, subscription, loadSubscription } = useOrganizationStore();
    const [loading, setLoading] = useState(true);
    const [usage, setUsage] = useState(null);
    const [limits, setLimits] = useState(null);
    const [invoices, setInvoices] = useState([]);
    const [billingCycle, setBillingCycle] = useState('monthly');
    const [processingPlan, setProcessingPlan] = useState(null);
    const [error, setError] = useState(null);

    // Cancellation state
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [cancelReason, setCancelReason] = useState('');
    const [cancelFeedback, setCancelFeedback] = useState('');
    const [cancelStep, setCancelStep] = useState(1);
    const [isCanceling, setIsCanceling] = useState(false);
    const [isReactivating, setIsReactivating] = useState(false);

    useEffect(() => {
        loadData();
    }, [organization?.id]);

    const loadData = async () => {
        if (!organization?.id) return;

        setLoading(true);
        try {
            const [usageData, limitsData, invoiceData] = await Promise.all([
                getUsageStats(organization.id),
                checkPlanLimits(organization.id, subscription?.plan || 'free'),
                getInvoiceHistory(organization.id),
            ]);

            setUsage(usageData);
            setLimits(limitsData);
            setInvoices(invoiceData);
        } catch (err) {
            logger.error('Error loading billing data:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleUpgrade = async (planId) => {
        if (processingPlan) return;

        setProcessingPlan(planId);
        setError(null);

        try {
            const { url } = await createCheckoutSession(planId, billingCycle);
            if (url) {
                window.location.href = url;
            }
        } catch (err) {
            setError(err.message || 'Failed to start checkout');
            setProcessingPlan(null);
        }
    };

    const handleManageBilling = async () => {
        setError(null);
        try {
            const { url } = await createPortalSession();
            if (url) {
                window.location.href = url;
            }
        } catch (err) {
            setError(err.message || 'Failed to open billing portal');
        }
    };

    const openCancelModal = () => {
        setCancelStep(1);
        setCancelReason('');
        setCancelFeedback('');
        setShowCancelModal(true);
    };

    const closeCancelModal = () => {
        setShowCancelModal(false);
        setCancelStep(1);
        setCancelReason('');
        setCancelFeedback('');
    };

    const handleCancelSubscription = async () => {
        if (!subscription?.stripe_subscription_id) return;

        setIsCanceling(true);
        setError(null);

        try {
            await cancelSubscription(subscription.stripe_subscription_id);
            // Reload subscription data
            await loadSubscription(organization.id);
            closeCancelModal();
        } catch (err) {
            setError(err.message || 'Failed to cancel subscription');
        } finally {
            setIsCanceling(false);
        }
    };

    const handleReactivateSubscription = async () => {
        if (!subscription?.stripe_subscription_id) return;

        setIsReactivating(true);
        setError(null);

        try {
            await reactivateSubscription(subscription.stripe_subscription_id);
            // Reload subscription data
            await loadSubscription(organization.id);
        } catch (err) {
            setError(err.message || 'Failed to reactivate subscription');
        } finally {
            setIsReactivating(false);
        }
    };

    const currentPlan = PLANS[subscription?.plan] || PLANS.free;
    const isFreePlan = !subscription || subscription.plan === 'free';

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* Error Display */}
            {error && (
                <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400">
                    <AlertCircle className="w-4 h-4" />
                    <span>{error}</span>
                </div>
            )}

            {/* Plan Limit Warnings */}
            {limits?.warnings?.length > 0 && (
                <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                    <div className="flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                        <div>
                            <h4 className="text-amber-400 font-medium">Plan Limits</h4>
                            <ul className="mt-1 space-y-1">
                                {limits.warnings.map((warning, i) => (
                                    <li key={i} className="text-sm text-amber-400/80">{warning}</li>
                                ))}
                            </ul>
                            <button
                                onClick={() => document.getElementById('plans-section')?.scrollIntoView({ behavior: 'smooth' })}
                                className="mt-2 text-sm text-amber-400 hover:text-amber-300 flex items-center gap-1"
                            >
                                Upgrade your plan <ArrowRight className="w-3 h-3" />
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Current Subscription */}
            <div>
                <h3 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
                    <CreditCard className="w-5 h-5" />
                    Current Subscription
                </h3>

                <div className="bg-dark-card border border-dark-border rounded-lg p-6">
                    <div className="flex items-start justify-between">
                        <div>
                            <div className="flex items-center gap-2">
                                <h4 className="text-xl font-semibold text-white">{currentPlan.name}</h4>
                                {currentPlan.popular && (
                                    <span className="px-2 py-0.5 bg-brand-primary/20 text-brand-primary text-xs rounded-full">
                                        Popular
                                    </span>
                                )}
                            </div>
                            <p className="text-gray-500 mt-1">{currentPlan.description}</p>

                            {subscription && subscription.status !== 'active' && (
                                <div className="mt-2">
                                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                                        subscription.status === 'trialing' ? 'bg-blue-500/20 text-blue-400' :
                                        subscription.status === 'past_due' ? 'bg-red-500/20 text-red-400' :
                                        subscription.status === 'canceled' ? 'bg-gray-500/20 text-gray-400' :
                                        'bg-gray-500/20 text-gray-400'
                                    }`}>
                                        {subscription.status === 'trialing' ? 'Trial' :
                                         subscription.status === 'past_due' ? 'Past Due' :
                                         subscription.status === 'canceled' ? 'Canceled' :
                                         subscription.status}
                                    </span>
                                </div>
                            )}

                            {subscription?.current_period_end && (
                                <p className="text-sm text-gray-500 mt-2">
                                    {subscription.cancel_at_period_end
                                        ? `Cancels on ${new Date(subscription.current_period_end).toLocaleDateString()}`
                                        : `Renews on ${new Date(subscription.current_period_end).toLocaleDateString()}`}
                                </p>
                            )}
                        </div>

                        <div className="text-right">
                            <div className="text-2xl font-bold text-white">
                                {formatPrice(currentPlan.pricing?.USD?.monthly || 0)}
                                <span className="text-sm text-gray-500 font-normal">/mo</span>
                            </div>
                            {!isFreePlan && (
                                <div className="mt-2 space-y-1">
                                    <button
                                        onClick={handleManageBilling}
                                        className="text-sm text-brand-primary hover:text-brand-primary/80 flex items-center gap-1 ml-auto"
                                    >
                                        Manage billing <ExternalLink className="w-3 h-3" />
                                    </button>
                                    {subscription?.cancel_at_period_end ? (
                                        <button
                                            onClick={handleReactivateSubscription}
                                            disabled={isReactivating}
                                            className="text-sm text-green-400 hover:text-green-300 flex items-center gap-1 ml-auto"
                                        >
                                            {isReactivating ? (
                                                <Loader2 className="w-3 h-3 animate-spin" />
                                            ) : (
                                                <RefreshCw className="w-3 h-3" />
                                            )}
                                            Reactivate subscription
                                        </button>
                                    ) : (
                                        <button
                                            onClick={openCancelModal}
                                            className="text-sm text-gray-500 hover:text-red-400 flex items-center gap-1 ml-auto"
                                        >
                                            Cancel subscription
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Cancellation Warning Banner */}
                    {subscription?.cancel_at_period_end && (
                        <div className="mt-4 p-4 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                            <div className="flex items-start gap-3">
                                <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0" />
                                <div className="flex-1">
                                    <h4 className="font-medium text-amber-400">Subscription Canceling</h4>
                                    <p className="text-sm text-amber-400/80 mt-1">
                                        Your subscription will end on {new Date(subscription.current_period_end).toLocaleDateString()}.
                                        You'll lose access to {currentPlan.name} features after this date.
                                    </p>
                                    <button
                                        onClick={handleReactivateSubscription}
                                        disabled={isReactivating}
                                        className="mt-2 px-4 py-1.5 bg-amber-500 hover:bg-amber-400 text-black text-sm font-medium rounded flex items-center gap-2"
                                    >
                                        {isReactivating ? (
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                        ) : (
                                            <RefreshCw className="w-4 h-4" />
                                        )}
                                        Keep My Subscription
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Usage Stats */}
                    {usage && (
                        <div className="mt-6 pt-6 border-t border-dark-border grid grid-cols-3 gap-6">
                            <div>
                                <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
                                    <FileText className="w-4 h-4" />
                                    Quotes This Month
                                </div>
                                <div className="text-xl font-semibold text-white">
                                    {usage.quotesThisMonth}
                                    {currentPlan.limits.quotesPerMonth !== -1 && (
                                        <span className="text-gray-500 text-sm font-normal">
                                            /{currentPlan.limits.quotesPerMonth}
                                        </span>
                                    )}
                                </div>
                            </div>
                            <div>
                                <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
                                    <Building2 className="w-4 h-4" />
                                    Clients
                                </div>
                                <div className="text-xl font-semibold text-white">
                                    {usage.clientCount}
                                    {currentPlan.limits.clients !== -1 && (
                                        <span className="text-gray-500 text-sm font-normal">
                                            /{currentPlan.limits.clients}
                                        </span>
                                    )}
                                </div>
                            </div>
                            <div>
                                <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
                                    <Users className="w-4 h-4" />
                                    Team Members
                                </div>
                                <div className="text-xl font-semibold text-white">
                                    {usage.teamMemberCount}
                                    {currentPlan.limits.teamMembers !== -1 && (
                                        <span className="text-gray-500 text-sm font-normal">
                                            /{currentPlan.limits.teamMembers}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Plans Section */}
            <div id="plans-section">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium text-white flex items-center gap-2">
                        <Crown className="w-5 h-5" />
                        Available Plans
                    </h3>

                    {/* Billing Cycle Toggle */}
                    <div className="flex items-center gap-2 bg-dark-card border border-dark-border rounded-lg p-1">
                        <button
                            onClick={() => setBillingCycle('monthly')}
                            className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                                billingCycle === 'monthly'
                                    ? 'bg-brand-primary text-white'
                                    : 'text-gray-400 hover:text-white'
                            }`}
                        >
                            Monthly
                        </button>
                        <button
                            onClick={() => setBillingCycle('yearly')}
                            className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
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

                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {Object.values(PLANS).map((plan) => {
                        const isCurrentPlan = currentPlan.id === plan.id;
                        const monthlyPrice = plan.pricing?.USD?.monthly || 0;
                        const annualPrice = plan.pricing?.USD?.annual || 0;
                        const price = billingCycle === 'yearly' ? annualPrice / 12 : monthlyPrice;

                        return (
                            <div
                                key={plan.id}
                                className={`relative bg-dark-card border rounded-lg p-5 ${
                                    plan.popular
                                        ? 'border-brand-primary ring-1 ring-brand-primary'
                                        : 'border-dark-border'
                                }`}
                            >
                                {plan.popular && (
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
                                        {formatPrice(price)}
                                    </span>
                                    <span className="text-gray-500">/mo</span>
                                    {billingCycle === 'yearly' && (
                                        <p className="text-xs text-gray-500 mt-1">
                                            Billed {formatPrice(annualPrice)} yearly
                                        </p>
                                    )}
                                </div>

                                <ul className="mt-4 space-y-2">
                                    {plan.features.map((feature, i) => (
                                        <li key={i} className="flex items-start gap-2 text-sm text-gray-300">
                                            <Check className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                                            {feature}
                                        </li>
                                    ))}
                                </ul>

                                <div className="mt-6">
                                    {isCurrentPlan ? (
                                        <button
                                            disabled
                                            className="w-full px-4 py-2 bg-gray-700 text-gray-400 rounded-lg text-sm font-medium cursor-not-allowed"
                                        >
                                            Current Plan
                                        </button>
                                    ) : plan.id === 'free' ? (
                                        <button
                                            disabled
                                            className="w-full px-4 py-2 bg-gray-700 text-gray-400 rounded-lg text-sm font-medium cursor-not-allowed"
                                        >
                                            Free Forever
                                        </button>
                                    ) : (
                                        <button
                                            onClick={() => handleUpgrade(plan.id)}
                                            disabled={processingPlan === plan.id}
                                            className={`w-full px-4 py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-2 ${
                                                plan.popular
                                                    ? 'bg-brand-primary hover:bg-brand-primary/90 text-white'
                                                    : 'bg-dark-bg hover:bg-dark-nav text-white border border-dark-border'
                                            }`}
                                        >
                                            {processingPlan === plan.id ? (
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                            ) : (
                                                <Zap className="w-4 h-4" />
                                            )}
                                            {processingPlan === plan.id ? 'Processing...' : 'Upgrade'}
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Invoice History */}
            {invoices.length > 0 && (
                <div>
                    <h3 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
                        <Calendar className="w-5 h-5" />
                        Invoice History
                    </h3>

                    <div className="bg-dark-card border border-dark-border rounded-lg overflow-x-auto">
                        <table className="w-full min-w-[500px]">
                            <thead>
                                <tr className="border-b border-dark-border">
                                    <th className="text-left px-4 py-3 text-sm font-medium text-gray-400">Date</th>
                                    <th className="text-left px-4 py-3 text-sm font-medium text-gray-400">Description</th>
                                    <th className="text-left px-4 py-3 text-sm font-medium text-gray-400">Amount</th>
                                    <th className="text-left px-4 py-3 text-sm font-medium text-gray-400">Status</th>
                                    <th className="text-right px-4 py-3 text-sm font-medium text-gray-400"></th>
                                </tr>
                            </thead>
                            <tbody>
                                {invoices.map((invoice) => (
                                    <tr key={invoice.id} className="border-b border-dark-border last:border-0">
                                        <td className="px-4 py-3 text-sm text-gray-300">
                                            {new Date(invoice.created_at).toLocaleDateString()}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-white">
                                            {invoice.description || 'Subscription'}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-white">
                                            {formatPrice(invoice.amount / 100, invoice.currency)}
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                                                invoice.status === 'paid'
                                                    ? 'bg-green-500/20 text-green-400'
                                                    : invoice.status === 'open'
                                                    ? 'bg-amber-500/20 text-amber-400'
                                                    : 'bg-gray-500/20 text-gray-400'
                                            }`}>
                                                {invoice.status}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            {invoice.invoice_pdf && (
                                                <a
                                                    href={invoice.invoice_pdf}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-sm text-brand-primary hover:text-brand-primary/80"
                                                >
                                                    Download
                                                </a>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Help Text */}
            <div className="text-sm text-gray-500 space-y-1">
                <p>
                    All prices are in USD. Payments are processed securely by Stripe.
                </p>
                <p>
                    Need a custom plan? <a href="mailto:sales@productionos.io" className="text-brand-primary hover:underline">Contact our sales team</a>
                </p>
            </div>

            {/* Cancellation Modal */}
            {showCancelModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-dark-card border border-dark-border rounded-lg w-full max-w-md mx-4 overflow-hidden">
                        {/* Header */}
                        <div className="flex items-center justify-between p-4 border-b border-dark-border">
                            <h3 className="text-lg font-semibold text-white">
                                {cancelStep === 1 && 'Why are you canceling?'}
                                {cancelStep === 2 && 'Any additional feedback?'}
                                {cancelStep === 3 && 'Confirm Cancellation'}
                            </h3>
                            <button
                                onClick={closeCancelModal}
                                className="text-gray-400 hover:text-white"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="p-4">
                            {/* Step 1: Select Reason */}
                            {cancelStep === 1 && (
                                <div className="space-y-3">
                                    <p className="text-sm text-gray-400 mb-4">
                                        We're sorry to see you go. Please let us know why you're canceling so we can improve.
                                    </p>
                                    {CANCELLATION_REASONS.map((reason) => (
                                        <label
                                            key={reason.id}
                                            className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                                                cancelReason === reason.id
                                                    ? 'border-brand-primary bg-brand-primary/10'
                                                    : 'border-dark-border hover:border-gray-600'
                                            }`}
                                        >
                                            <input
                                                type="radio"
                                                name="cancelReason"
                                                value={reason.id}
                                                checked={cancelReason === reason.id}
                                                onChange={(e) => setCancelReason(e.target.value)}
                                                className="sr-only"
                                            />
                                            <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                                                cancelReason === reason.id
                                                    ? 'border-brand-primary'
                                                    : 'border-gray-500'
                                            }`}>
                                                {cancelReason === reason.id && (
                                                    <div className="w-2 h-2 rounded-full bg-brand-primary" />
                                                )}
                                            </div>
                                            <span className="text-white">{reason.label}</span>
                                        </label>
                                    ))}
                                </div>
                            )}

                            {/* Step 2: Additional Feedback */}
                            {cancelStep === 2 && (
                                <div className="space-y-4">
                                    <p className="text-sm text-gray-400">
                                        Is there anything else you'd like to share? Your feedback helps us improve.
                                    </p>
                                    <textarea
                                        value={cancelFeedback}
                                        onChange={(e) => setCancelFeedback(e.target.value)}
                                        placeholder="Tell us more (optional)..."
                                        rows={4}
                                        className="w-full bg-dark-bg border border-dark-border rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-primary"
                                    />
                                    <div className="flex items-center gap-2 text-sm text-gray-400">
                                        <MessageSquare className="w-4 h-4" />
                                        Your feedback is confidential and helps us improve
                                    </div>
                                </div>
                            )}

                            {/* Step 3: Confirmation */}
                            {cancelStep === 3 && (
                                <div className="space-y-4">
                                    <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
                                        <div className="flex items-start gap-3">
                                            <XCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                                            <div>
                                                <h4 className="font-medium text-red-400">
                                                    Are you sure you want to cancel?
                                                </h4>
                                                <p className="text-sm text-red-400/80 mt-1">
                                                    You'll lose access to these features:
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    <ul className="space-y-2 text-sm">
                                        {currentPlan.features.slice(0, 5).map((feature, i) => (
                                            <li key={i} className="flex items-center gap-2 text-gray-400">
                                                <XCircle className="w-4 h-4 text-red-500" />
                                                {feature}
                                            </li>
                                        ))}
                                    </ul>

                                    <div className="p-3 bg-dark-bg rounded-lg text-sm">
                                        <p className="text-gray-400">
                                            Your subscription will remain active until{' '}
                                            <span className="text-white font-medium">
                                                {subscription?.current_period_end
                                                    ? new Date(subscription.current_period_end).toLocaleDateString()
                                                    : 'the end of your billing period'}
                                            </span>
                                            . After that, you'll be moved to the Free plan.
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="flex items-center justify-between p-4 border-t border-dark-border bg-dark-bg/50">
                            {cancelStep > 1 ? (
                                <button
                                    onClick={() => setCancelStep(cancelStep - 1)}
                                    className="px-4 py-2 text-gray-400 hover:text-white text-sm"
                                >
                                    Back
                                </button>
                            ) : (
                                <button
                                    onClick={closeCancelModal}
                                    className="px-4 py-2 text-gray-400 hover:text-white text-sm"
                                >
                                    Never mind
                                </button>
                            )}

                            {cancelStep < 3 ? (
                                <button
                                    onClick={() => setCancelStep(cancelStep + 1)}
                                    disabled={cancelStep === 1 && !cancelReason}
                                    className="px-4 py-2 bg-brand-primary hover:bg-brand-primary/90 text-white text-sm font-medium rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Continue
                                </button>
                            ) : (
                                <button
                                    onClick={handleCancelSubscription}
                                    disabled={isCanceling}
                                    className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white text-sm font-medium rounded-lg flex items-center gap-2"
                                >
                                    {isCanceling ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <XCircle className="w-4 h-4" />
                                    )}
                                    {isCanceling ? 'Canceling...' : 'Cancel Subscription'}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
