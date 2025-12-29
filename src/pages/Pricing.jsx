import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, HelpCircle, X, Loader2, MapPin } from 'lucide-react';
import Layout from '../components/layout/Layout';
import TokenPacks from '../components/ui/TokenPacks';
import { plans, pricingFaqs, comparisonTable, currencyConfig } from '../data/pricing';
import { useAuthStore } from '../store/authStore';
import { createCheckoutSession, getRegionalStripePriceId } from '../services/billingService';
import { getPricingForUser, formatLocalPrice, PRICING_TIERS } from '../services/pppService';

export default function Pricing() {
    const [billingCycle, setBillingCycle] = useState('monthly'); // 'monthly' | 'annual'
    const [currency, setCurrency] = useState('USD');
    const [pricingInfo, setPricingInfo] = useState(null);
    const [loadingPricing, setLoadingPricing] = useState(true);
    const [loadingPlan, setLoadingPlan] = useState(null); // Track which plan is loading
    const [error, setError] = useState(null);

    const navigate = useNavigate();
    const { isAuthenticated } = useAuthStore();

    // Detect user's location and get regional pricing
    useEffect(() => {
        async function loadPricing() {
            try {
                const info = await getPricingForUser();
                setPricingInfo(info);
                setCurrency(info.currency);
            } catch (err) {
                console.error('Failed to load regional pricing:', err);
                // Fall back to USD
                setCurrency('USD');
            } finally {
                setLoadingPricing(false);
            }
        }
        loadPricing();
    }, []);

    // Get price for a plan based on regional pricing
    const getPrice = (plan, cycle) => {
        // Free plan is always free
        if (plan.id === 'free') return 0;

        // If we have regional pricing info, use it
        if (pricingInfo && pricingInfo.prices[plan.id]) {
            const pricing = pricingInfo.prices[plan.id];
            return cycle === 'monthly' ? pricing.monthly : pricing.annual;
        }

        // Fallback to plan's default pricing
        const pricing = plan.pricing[currency] || plan.pricing.USD;
        return cycle === 'monthly' ? pricing.monthly : pricing.annual;
    };

    // Format price display
    const formatPriceDisplay = (amount) => {
        if (amount === 0) return 'Free';
        return formatLocalPrice(amount, currency);
    };

    // Get discount percentage if applicable
    const getDiscountBadge = () => {
        if (!pricingInfo || pricingInfo.tier === 'tier1') return null;
        const tier = PRICING_TIERS[pricingInfo.tier];
        if (!tier) return null;

        // Calculate discount from tier1
        const tier1Price = PRICING_TIERS.tier1.individual.monthly;
        const tierPrice = tier.individual.monthly;
        const discount = Math.round((1 - tierPrice / tier1Price) * 100);

        return discount > 0 ? `${discount}% OFF` : null;
    };

    const handleSelectPlan = async (plan) => {
        setError(null);

        // Free plan - just go to signup
        if (plan.id === 'free') {
            navigate('/auth/signup');
            return;
        }

        // Paid plans
        if (isAuthenticated) {
            // User is logged in - go directly to Stripe checkout
            setLoadingPlan(plan.id);
            try {
                // Pass pricing info to get regional price
                const { url } = await createCheckoutSession(
                    plan.id,
                    billingCycle,
                    currency,
                    pricingInfo?.tier
                );
                if (url) {
                    window.location.href = url;
                } else {
                    throw new Error('No checkout URL returned');
                }
            } catch (err) {
                console.error('Checkout error:', err);
                setError('Unable to start checkout. Please try again.');
                setLoadingPlan(null);
            }
        } else {
            // User is not logged in - redirect to signup with plan selection
            const params = new URLSearchParams({
                plan: plan.id,
                cycle: billingCycle,
                currency: currency,
                tier: pricingInfo?.tier || 'tier1',
            });
            navigate(`/auth/signup?${params.toString()}`);
        }
    };

    return (
        <Layout>
            <Helmet>
                <title>Pricing - ProductionOS</title>
                <meta name="description" content="Simple pricing for production companies. Free, Individual, and Team plans. Start free today, upgrade when you're ready." />
            </Helmet>

            {/* Header */}
            <section className="pt-24 md:pt-32 pb-8 md:pb-12 text-center container mx-auto px-4 md:px-6">
                <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold mb-4 md:mb-6">Pricing that makes sense.</h1>
                <p className="text-lg md:text-xl text-marketing-text-secondary max-w-2xl mx-auto mb-8 md:mb-12">
                    All plans include unlimited projects and quotes. Pay for users, not usage.
                </p>

                {/* Regional Pricing Badge */}
                {pricingInfo && pricingInfo.tier !== 'tier1' && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-marketing-success/10 border border-marketing-success/30 text-marketing-success text-sm font-medium mb-8"
                    >
                        <MapPin size={16} />
                        <span>Regional pricing for {pricingInfo.countryCode}</span>
                        {getDiscountBadge() && (
                            <span className="bg-marketing-success text-white px-2 py-0.5 rounded text-xs font-bold">
                                {getDiscountBadge()}
                            </span>
                        )}
                    </motion.div>
                )}

                {/* Currency Selector */}
                <div className="flex items-center justify-center gap-2 mb-6">
                    <span className="text-sm text-marketing-text-secondary">Currency:</span>
                    <select
                        value={currency}
                        onChange={(e) => setCurrency(e.target.value)}
                        className="bg-marketing-surface border border-marketing-border rounded-lg px-3 py-1.5 text-sm text-marketing-text-primary focus:outline-none focus:ring-2 focus:ring-marketing-primary/50 cursor-pointer"
                    >
                        {Object.entries(currencyConfig).map(([code, config]) => (
                            <option key={code} value={code}>
                                {config.symbol} {code}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Toggle */}
                <div className="flex items-center justify-center gap-4 mb-16">
                    <span className={`text-sm font-medium ${billingCycle === 'monthly' ? 'text-marketing-text-primary' : 'text-marketing-text-secondary'}`}>Monthly</span>
                    <button
                        onClick={() => setBillingCycle(billingCycle === 'monthly' ? 'annual' : 'monthly')}
                        className="w-14 h-8 bg-marketing-surface border border-marketing-border rounded-full relative transition-colors focus:outline-none focus:ring-2 focus:ring-marketing-primary/50 cursor-pointer"
                    >
                        <motion.div
                            className="absolute top-1 left-1 w-6 h-6 bg-marketing-primary rounded-full shadow-lg"
                            animate={{ x: billingCycle === 'annual' ? 24 : 0 }}
                            transition={{ type: "spring", stiffness: 500, damping: 30 }}
                        />
                    </button>
                    <span className={`text-sm font-medium ${billingCycle === 'annual' ? 'text-marketing-text-primary' : 'text-marketing-text-secondary'}`}>
                        Annual <span className="text-marketing-success text-xs ml-1 font-bold">SAVE 20%</span>
                    </span>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="max-w-md mx-auto mb-8 p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm text-center">
                        {error}
                    </div>
                )}

                {/* Plans Grid */}
                <div className="grid md:grid-cols-3 gap-6 md:gap-8 max-w-6xl mx-auto relative z-10 px-2 md:px-0">
                    {plans.map((plan, i) => (
                        <motion.div
                            key={plan.name}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.1 }}
                            className={`relative bg-marketing-surface border ${plan.popular ? 'border-marketing-primary shadow-2xl shadow-marketing-primary/10 scale-105 z-10' : 'border-marketing-border'} rounded-2xl p-8 flex flex-col text-left`}
                        >
                            {plan.popular && (
                                <div className="absolute -top-3 inset-x-0 flex justify-center">
                                    <span className="bg-marketing-primary text-white text-xs font-bold px-4 py-1.5 rounded-full uppercase tracking-wider shadow-lg">
                                        Most Popular
                                    </span>
                                </div>
                            )}
                            <h3 className="text-xl font-bold mb-2">{plan.name}</h3>
                            <p className="text-marketing-text-secondary text-sm mb-6 h-10">{plan.description}</p>

                            <div className="mb-8">
                                <AnimatePresence mode="wait">
                                    <motion.div
                                        key={`${billingCycle}-${currency}`}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                                        className="flex items-baseline gap-1"
                                    >
                                        <span className="text-4xl font-bold">
                                            {billingCycle === 'annual' && getPrice(plan, 'annual') > 0
                                                ? formatPriceDisplay(Math.round(getPrice(plan, 'annual') / 12))
                                                : formatPriceDisplay(getPrice(plan, billingCycle))
                                            }
                                        </span>
                                        {getPrice(plan, billingCycle) > 0 && <span className="text-marketing-text-secondary">/mo</span>}
                                    </motion.div>
                                </AnimatePresence>
                                <div className="text-xs text-marketing-text-secondary mt-1">
                                    {getPrice(plan, billingCycle) === 0
                                        ? 'No credit card required'
                                        : billingCycle === 'annual'
                                            ? `Billed ${formatPriceDisplay(getPrice(plan, 'annual'))} yearly`
                                            : 'Billed monthly'
                                    }
                                </div>
                            </div>

                            <button
                                onClick={() => handleSelectPlan(plan)}
                                disabled={loadingPlan === plan.id}
                                className={`w-full py-3 rounded-xl font-bold text-center mb-8 transition-all disabled:opacity-70 disabled:cursor-wait ${plan.popular ? 'bg-gradient-to-r from-marketing-accent to-marketing-primary text-white hover:shadow-glow' : 'bg-marketing-text-primary text-marketing-background hover:bg-white hover:shadow-lg'}`}
                            >
                                {loadingPlan === plan.id ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <Loader2 size={18} className="animate-spin" />
                                        Loading...
                                    </span>
                                ) : (
                                    plan.cta
                                )}
                            </button>

                            <p className="text-xs font-bold text-marketing-text-secondary uppercase mb-4 tracking-wider">Includes:</p>
                            <div className="space-y-3 flex-1">
                                {plan.features.map((feature, idx) => (
                                    <div key={idx} className="flex items-start gap-3 text-sm text-marketing-text-secondary">
                                        <Check size={16} className="text-marketing-primary mt-0.5 shrink-0" />
                                        <span>{feature}</span>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    ))}
                </div>
            </section>

            {/* Includes Section */}
            <section className="py-12 md:py-16 text-center max-w-4xl mx-auto px-4 md:px-6">
                <h3 className="text-base md:text-lg font-bold mb-6 md:mb-8 uppercase tracking-widest text-marketing-text-secondary">Every plan includes</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6 text-xs md:text-sm">
                    {['No credit card for Free', 'Cancel anytime', 'Data export', 'Bank-level security', 'Regular updates', '99.9% uptime'].map(item => (
                        <div key={item} className="flex items-center justify-center gap-2 text-marketing-text-primary font-medium p-3 bg-marketing-surface border border-marketing-border rounded-lg">
                            <Check size={14} className="text-marketing-success" /> {item}
                        </div>
                    ))}
                </div>
            </section>

            {/* Comparison Table */}
            <section id="comparison" className="py-20 bg-marketing-surface border-y border-marketing-border">
                <div className="container mx-auto px-6 md:px-12 max-w-6xl">
                    <h2 className="text-3xl font-bold text-center mb-12">Feature Comparison</h2>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse min-w-[800px]">
                            <thead>
                                <tr>
                                    <th className="p-4 border-b border-marketing-border text-marketing-text-secondary font-medium w-1/4">Feature</th>
                                    <th className="p-4 border-b border-marketing-border text-marketing-text-primary font-bold text-lg w-1/4">Free</th>
                                    <th className="p-4 border-b border-marketing-border text-marketing-primary font-bold text-lg w-1/4 bg-marketing-primary/5 rounded-t-xl">Individual</th>
                                    <th className="p-4 border-b border-marketing-border text-marketing-text-primary font-bold text-lg w-1/4">Team</th>
                                </tr>
                            </thead>
                            <tbody>
                                {comparisonTable.map((row, i) => (
                                    <tr key={i} className="border-b border-marketing-border/50 hover:bg-marketing-background/50">
                                        <td className="p-4 font-medium text-marketing-text-primary">{row.feature}</td>
                                        <td className="p-4 text-marketing-text-secondary">
                                            {row.free === true ? <Check className="text-marketing-success" size={20} /> : row.free === false ? <span className="opacity-20">-</span> : row.free}
                                        </td>
                                        <td className="p-4 bg-marketing-primary/5 text-marketing-text-primary font-medium">
                                            {row.individual === true ? <Check className="text-marketing-success" size={20} /> : row.individual === false ? <span className="opacity-20">-</span> : row.individual}
                                        </td>
                                        <td className="p-4 text-marketing-text-secondary">
                                            {row.team === true ? <Check className="text-marketing-success" size={20} /> : row.team === false ? <span className="opacity-20">-</span> : row.team}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </section>

            {/* Token Packs */}
            <section className="py-20 container mx-auto px-6 md:px-12 max-w-5xl">
                <h2 className="text-3xl font-bold text-center mb-4">Need More AI Tokens?</h2>
                <p className="text-marketing-text-secondary text-center mb-12 max-w-2xl mx-auto">
                    Buy additional tokens anytime. Tokens are shared across your entire team and never expire.
                </p>
                <TokenPacks currency={currency} />
            </section>

            {/* FAQ */}
            <section className="py-20 container mx-auto px-6 md:px-12 max-w-4xl border-t border-marketing-border">
                <h2 className="text-3xl font-bold text-center mb-12">Frequently Asked Questions</h2>
                <div className="grid md:grid-cols-2 gap-8">
                    {pricingFaqs.map((faq, i) => (
                        <div key={i}>
                            <h3 className="font-bold mb-2 text-marketing-text-primary">{faq.q}</h3>
                            <p className="text-sm text-marketing-text-secondary leading-relaxed">{faq.a}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* Final CTA */}
            <section className="py-20 text-center border-t border-marketing-border">
                <h2 className="text-3xl font-bold mb-6">Ready to run your production business properly?</h2>
                <p className="text-marketing-text-secondary mb-8">Join 200+ production companies already using ProductionOS.</p>
                <Link to="/auth/signup" className="inline-block px-8 py-4 bg-gradient-to-r from-marketing-accent to-marketing-primary text-white font-bold rounded-xl hover:shadow-glow hover:-translate-y-1 transition-all">
                    Start free trial
                </Link>
                <p className="mt-4 text-sm text-marketing-text-secondary">No credit card required for Free plan</p>
            </section>
        </Layout>
    );
}
