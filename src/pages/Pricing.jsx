import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, HelpCircle, X } from 'lucide-react';
import Layout from '../components/layout/Layout';
import { plans, pricingFaqs, comparisonTable } from '../data/pricing';

export default function Pricing() {
    const [billingCycle, setBillingCycle] = useState('monthly'); // 'monthly' | 'annual'

    return (
        <Layout>
            <Helmet>
                <title>Pricing - ProductionOS</title>
                <meta name="description" content="Simple pricing for production companies. Solo, Team, and Agency plans. Start your free trial today." />
            </Helmet>

            {/* Header */}
            <section className="pt-24 md:pt-32 pb-8 md:pb-12 text-center container mx-auto px-4 md:px-6">
                <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold mb-4 md:mb-6">Pricing that makes sense.</h1>
                <p className="text-lg md:text-xl text-marketing-text-secondary max-w-2xl mx-auto mb-8 md:mb-12">
                    All plans include unlimited projects and quotes. Pay for users, not usage.
                </p>

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
                                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-marketing-primary text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-lg">
                                    Most Popular
                                </div>
                            )}
                            <h3 className="text-xl font-bold mb-2">{plan.name}</h3>
                            <p className="text-marketing-text-secondary text-sm mb-6 h-10">{plan.description}</p>

                            <div className="mb-8">
                                <AnimatePresence mode="wait">
                                    <motion.div
                                        key={billingCycle}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                                        className="flex items-baseline gap-1"
                                    >
                                        <span className="text-4xl font-bold">${billingCycle === 'monthly' ? plan.price : plan.priceAnnual}</span>
                                        <span className="text-marketing-text-secondary">/mo</span>
                                    </motion.div>
                                </AnimatePresence>
                                <div className="text-xs text-marketing-text-secondary mt-1">
                                    {billingCycle === 'annual' ? `Billed $${plan.priceAnnual * 12} yearly` : 'Billed monthly'}
                                </div>
                            </div>

                            <Link
                                to="/auth/signup"
                                className={`w-full py-3 rounded-xl font-bold text-center mb-8 transition-colors ${plan.popular ? 'bg-marketing-primary text-white hover:bg-marketing-primary/90' : 'bg-marketing-text-primary text-marketing-background hover:bg-white'}`}
                            >
                                {plan.cta}
                            </Link>

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
                    {['5-day free trial', 'No credit card required', 'Cancel anytime', '14-day money-back', 'Data export', 'Bank-level security', 'Regular updates', '99.9% uptime'].map(item => (
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
                                    <th className="p-4 border-b border-marketing-border text-marketing-text-primary font-bold text-lg w-1/4">Solo</th>
                                    <th className="p-4 border-b border-marketing-border text-marketing-primary font-bold text-lg w-1/4 bg-marketing-primary/5 rounded-t-xl">Team</th>
                                    <th className="p-4 border-b border-marketing-border text-marketing-text-primary font-bold text-lg w-1/4">Agency</th>
                                </tr>
                            </thead>
                            <tbody>
                                {comparisonTable.map((row, i) => (
                                    <tr key={i} className="border-b border-marketing-border/50 hover:bg-marketing-background/50">
                                        <td className="p-4 font-medium text-marketing-text-primary">{row.feature}</td>
                                        <td className="p-4 text-marketing-text-secondary">
                                            {row.solo === true ? <Check className="text-marketing-success" size={20} /> : row.solo === false ? <span className="opacity-20">-</span> : row.solo}
                                        </td>
                                        <td className="p-4 bg-marketing-primary/5 text-marketing-text-primary font-medium">
                                            {row.team === true ? <Check className="text-marketing-success" size={20} /> : row.team === false ? <span className="opacity-20">-</span> : row.team}
                                        </td>
                                        <td className="p-4 text-marketing-text-secondary">
                                            {row.agency === true ? <Check className="text-marketing-success" size={20} /> : row.agency === false ? <span className="opacity-20">-</span> : row.agency}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </section>

            {/* FAQ */}
            <section className="py-20 container mx-auto px-6 md:px-12 max-w-4xl">
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
                <Link to="/auth/signup" className="inline-block px-8 py-4 bg-marketing-primary text-white font-bold rounded-xl hover:bg-marketing-primary/90 transition-colors">
                    Start free trial
                </Link>
                <p className="mt-4 text-sm text-marketing-text-secondary">5 days free · No credit card required</p>
            </section>
        </Layout>
    );
}
