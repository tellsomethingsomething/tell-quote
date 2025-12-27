import React, { useRef, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { motion, useScroll, useTransform, animate } from 'framer-motion';
import { Check, ArrowRight, Star, Youtube, LayoutDashboard, Calculator, Clapperboard, FileSpreadsheet, Users, Briefcase } from 'lucide-react';
import Layout from '../components/layout/Layout';
import MotionScreenGrab from '../components/ui/MotionScreenGrab';
import { AuroraBackground } from '../components/ui/AuroraBackground';
import { BentoGrid, BentoGridItem } from '../components/ui/BentoGrid';
import FeatureShowcase from '../components/ui/FeatureShowcase';
import InteractiveDemo from '../components/mockups/InteractiveDemo';
import { features } from '../data/features';
import { testimonials } from '../data/testimonials';
import { faqs } from '../data/faq';

export default function Home() {
    const { scrollYProgress } = useScroll();

    return (
        <Layout>
            <Helmet>
                <title>ProductionOS - The Profit Platform for Production Companies</title>
                <meta name="description" content="The first CRM built for production companies. Manage your company and see your real profit on every job. Quotes, kit, crew, and finances in one platform for video and event production." />
            </Helmet>

            {/* --- HERO SECTION --- */}
            <AuroraBackground>
                <section className="relative pt-32 pb-20 overflow-hidden text-center z-10 w-full">
                    <div className="container mx-auto px-6">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6 }}
                        >
                            <span className="inline-block py-1 px-3 rounded-full bg-marketing-surface border border-marketing-border text-marketing-text-secondary text-xs font-medium mb-8 uppercase tracking-widest">
                                Stop Leaving Money on the Table
                            </span>
                            <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-8 leading-tight text-white">
                                The first CRM built for <br className="hidden md:block" /> <span className="text-marketing-primary bg-clip-text text-transparent bg-gradient-to-r from-marketing-primary to-marketing-accent">Production companies</span>
                            </h1>
                            <p className="text-xl md:text-2xl text-marketing-text-secondary max-w-3xl mx-auto mb-12 leading-relaxed">
                                Manage your company and see your real profit on every job. Quotes, kit, crew, and finances in one platform for video and event production.
                            </p>

                            <div className="flex flex-col md:flex-row items-center justify-center gap-4 mb-16">
                                <Link to="/auth/signup" className="px-8 py-4 bg-marketing-primary text-white text-lg font-bold rounded-xl hover:bg-marketing-primary/90 transition-all shadow-lg hover:shadow-marketing-primary/25 hover:-translate-y-1 focus:outline-none focus:ring-2 focus:ring-marketing-primary focus:ring-offset-2 focus:ring-offset-marketing-background" aria-label="Start your free 5-day trial of ProductionOS">
                                    Start Free Trial
                                </Link>
                                <Link to="/pricing" className="px-8 py-4 bg-marketing-surface/50 border border-marketing-border text-marketing-text-primary text-lg font-bold rounded-xl hover:bg-marketing-border/50 transition-all backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-marketing-background">
                                    View Pricing
                                </Link>
                            </div>
                        </motion.div>

                        {/* Interactive Demo */}
                        <div className="max-w-5xl mx-auto relative z-20 -mb-20">
                            <motion.div
                                initial={{ y: 40, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }}
                            >
                                <InteractiveDemo />
                            </motion.div>
                        </div>
                    </div>
                </section>
            </AuroraBackground>

            {/* --- WHY PRODUCTIONOS SECTION --- */}
            <section className="pt-48 pb-24 bg-marketing-background">
                <div className="container mx-auto px-6">
                    <div className="text-center mb-20">
                        <h2 className="text-marketing-primary font-bold tracking-widest uppercase text-sm mb-3">WHY PRODUCTIONOS</h2>
                        <h3 className="text-3xl md:text-5xl font-bold mb-4">Finally know if you're <br />making money.</h3>
                        <p className="text-xl text-marketing-text-secondary max-w-2xl mx-auto">
                            Most production companies can't answer "are we profitable?" until it's too late. We fix that.
                        </p>
                    </div>

                    <BentoGrid className="max-w-6xl mx-auto">
                        {[
                            {
                                title: "Profit & Cost Visibility",
                                description: "See margins from the first quote. Track costs as they happen.",
                                header: <div className="flex flex-1 w-full h-full min-h-[6rem] rounded-xl bg-gradient-to-br from-green-500/10 to-green-600/5 border border-green-500/10 p-4 items-center justify-center"><Calculator className="w-12 h-12 text-green-400" /></div>,
                            },
                            {
                                title: "Full Project Management",
                                description: "Quotes convert to projects. Crew, kit, and budgets sync automatically.",
                                header: <div className="flex flex-1 w-full h-full min-h-[6rem] rounded-xl bg-gradient-to-br from-blue-500/10 to-blue-600/5 border border-blue-500/10 p-4 items-center justify-center"><Briefcase className="w-12 h-12 text-blue-400" /></div>,
                            },
                            {
                                title: "Built-in CRM",
                                description: "Manage clients and communications. See project history at a glance.",
                                header: <div className="flex flex-1 w-full h-full min-h-[6rem] rounded-xl bg-gradient-to-br from-purple-500/10 to-purple-600/5 border border-purple-500/10 p-4 items-center justify-center"><Users className="w-12 h-12 text-purple-400" /></div>,
                            },
                        ].map((item, i) => (
                            <BentoGridItem
                                key={i}
                                title={item.title}
                                description={item.description}
                                header={item.header}
                            />
                        ))}
                    </BentoGrid>
                </div>
            </section>

            {/* --- PLATFORM FEATURES --- */}
            <section className="py-24 bg-marketing-surface border-y border-marketing-border overflow-hidden">
                <div className="container mx-auto px-6">
                    <div className="text-center mb-12">
                        <h2 className="text-marketing-primary font-bold tracking-widest uppercase text-sm mb-3">THE PLATFORM</h2>
                        <h3 className="text-3xl md:text-5xl font-bold mb-6">Everything in one place.</h3>
                        <p className="text-xl text-marketing-text-secondary max-w-2xl mx-auto">
                            CRM, quoting, kit tracking, crew management, and financials. No more spreadsheet chaos.
                        </p>
                    </div>

                    <FeatureShowcase />
                </div>
            </section>

            {/* --- SOCIAL PROOF --- */}
            <section className="py-24 border-b border-marketing-border bg-marketing-background overflow-hidden">
                <div className="container mx-auto px-6">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-5xl font-bold mb-6">Trusted by the industry's best.</h2>
                        <p className="text-xl text-marketing-text-secondary">Join over 200 production companies scaling with ProductionOS.</p>
                    </div>
                </div>

                {/* Auto-scrolling testimonials marquee */}
                <div className="relative">
                    <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-marketing-background to-transparent z-10" aria-hidden="true" />
                    <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-marketing-background to-transparent z-10" aria-hidden="true" />

                    <motion.div
                        className="flex gap-6"
                        role="region"
                        aria-label="Customer testimonials"
                        animate={{
                            x: [0, -(testimonials.length * 424)] // 400px card width + 24px gap
                        }}
                        transition={{
                            x: {
                                duration: testimonials.length * 6, // 6 seconds per testimonial
                                repeat: Infinity,
                                ease: "linear"
                            }
                        }}
                    >
                        {/* Double the testimonials for seamless loop */}
                        {[...testimonials, ...testimonials].map((t, i) => (
                            <div
                                key={`${t.author}-${i}`}
                                className="flex-shrink-0 w-[400px] p-8 bg-marketing-surface/50 backdrop-blur-sm border border-marketing-border/50 rounded-3xl"
                            >
                                <div className="flex text-marketing-primary mb-6" role="img" aria-label="5 out of 5 stars">
                                    {[...Array(5)].map((_, j) => <Star key={j} size={18} fill="currentColor" className="opacity-80" aria-hidden="true" />)}
                                </div>
                                <p className="text-lg mb-8 leading-relaxed font-medium text-marketing-text-primary/90 line-clamp-3">"{t.quote}"</p>
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-marketing-primary to-marketing-accent flex items-center justify-center font-bold text-white text-lg shadow-lg">
                                        {t.author[0]}
                                    </div>
                                    <div>
                                        <div className="font-bold text-white">{t.author}</div>
                                        <div className="text-sm text-marketing-text-secondary">{t.role}, {t.company}</div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </motion.div>
                </div>
            </section>

            {/* --- CTA SECTION --- */}
            <AuroraBackground showRadialGradient={false}>
                <section className="py-32 relative text-center w-full z-10">
                    <div className="container mx-auto px-6">
                        <h2 className="text-4xl md:text-6xl font-bold mb-8 text-white">Ready to know your margins?</h2>
                        <p className="text-xl text-marketing-text-secondary mb-12 max-w-2xl mx-auto">
                            Stop guessing if jobs are profitable. Start your free trial and see your numbers clearly.
                        </p>
                        <div className="flex flex-col md:flex-row items-center justify-center gap-4">
                            <Link to="/auth/signup" className="px-10 py-5 bg-marketing-primary text-white text-xl font-bold rounded-xl hover:bg-marketing-primary/90 transition-all shadow-xl hover:shadow-2xl hover:-translate-y-1 focus:outline-none focus:ring-2 focus:ring-marketing-primary focus:ring-offset-2 focus:ring-offset-marketing-background">
                                Start Free Trial
                            </Link>
                            <Link to="/pricing" className="px-10 py-5 bg-transparent border border-white/20 text-white text-xl font-bold rounded-xl hover:bg-white/10 transition-all focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-marketing-background">
                                View Pricing
                            </Link>
                        </div>
                        <p className="mt-8 text-marketing-text-secondary text-sm opacity-70">
                            5-day free trial · Cancel anytime · Enterprise security
                        </p>
                    </div>
                </section>
            </AuroraBackground>
        </Layout>
    );
}
