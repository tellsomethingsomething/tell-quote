import React, { useRef } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Check, ArrowRight, Star, Youtube, LayoutDashboard, Calculator, Clapperboard, FileSpreadsheet, Users, Briefcase } from 'lucide-react';
import Layout from '../components/layout/Layout';
import MotionScreenGrab from '../components/ui/MotionScreenGrab';
import { AuroraBackground } from '../components/ui/AuroraBackground';
import { BentoGrid, BentoGridItem } from '../components/ui/BentoGrid';
import FeatureTabs from '../components/ui/FeatureTabs';
import FeaturesGrid from '../components/ui/FeaturesGrid';
import ROICalculator from '../components/ui/ROICalculator';
import DashboardMockup from '../components/mockups/DashboardMockup';
import { features } from '../data/features';
import { testimonials } from '../data/testimonials';
import { faqs } from '../data/faq';

export default function Home() {
    const { scrollYProgress } = useScroll();

    return (
        <Layout>
            <Helmet>
                <title>ProductionOS - The Operating System for Modern Production</title>
                <meta name="description" content="Unify quotes, projects, crew, and finances. The enterprise-grade platform for video production companies, agencies, and event organizers." />
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
                                Streamline Your Workflow
                            </span>
                            <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-8 leading-tight text-white">
                                The first CRM built for <br className="hidden md:block" /> <span className="text-marketing-primary bg-clip-text text-transparent bg-gradient-to-r from-marketing-primary to-marketing-accent">Production companies</span>
                            </h1>
                            <p className="text-xl md:text-2xl text-marketing-text-secondary max-w-3xl mx-auto mb-12 leading-relaxed">
                                Quotes, projects, crew, kit, and finances unified in one platform built for video and event production.
                            </p>

                            <div className="flex flex-col md:flex-row items-center justify-center gap-4 mb-16">
                                <Link to="/auth/signup" className="px-8 py-4 bg-marketing-primary text-white text-lg font-bold rounded-xl hover:bg-marketing-primary/90 transition-all shadow-lg hover:shadow-marketing-primary/25 hover:-translate-y-1">
                                    Start Free Trial
                                </Link>
                                <Link to="/pricing" className="px-8 py-4 bg-marketing-surface/50 border border-marketing-border text-marketing-text-primary text-lg font-bold rounded-xl hover:bg-marketing-border/50 transition-all backdrop-blur-sm">
                                    View Pricing
                                </Link>
                            </div>
                        </motion.div>

                        {/* Hero Visual */}
                        <div className="max-w-4xl mx-auto relative z-20 -mb-20">
                            <motion.div
                                initial={{ y: 40, opacity: 0, rotateX: 20 }}
                                animate={{ y: 0, opacity: 1, rotateX: 0 }}
                                transition={{ duration: 1, delay: 0.2, ease: "easeOut" }}
                                style={{ perspective: 1000 }}
                            >
                                <DashboardMockup />
                            </motion.div>
                        </div>
                    </div>
                </section>
            </AuroraBackground>

            {/* --- CHALLENGE SECTION --- */}
            <section className="pt-48 pb-24 bg-marketing-background">
                <div className="container mx-auto px-6">
                    <div className="text-center mb-20">
                        <h2 className="text-marketing-primary font-bold tracking-widest uppercase text-sm mb-3">THE CHALLENGE</h2>
                        <h3 className="text-3xl md:text-5xl font-bold mb-4">Fragmented tools create <br />operational blindspots.</h3>
                        <p className="text-xl text-marketing-text-secondary max-w-2xl mx-auto">
                            Relying on disconnected spreadsheets, documents, and chat apps introduces risk, errors, and inefficiency into your business.
                        </p>
                    </div>

                    <BentoGrid className="max-w-6xl mx-auto">
                        {[
                            {
                                title: "Disconnected Quoting",
                                description: "Static PDF quotes don't sync with your project management, leading to scope creep and lost revenue.",
                                header: <div className="flex flex-1 w-full h-full min-h-[6rem] rounded-xl bg-gradient-to-br from-red-500/10 to-red-600/5 border border-red-500/10 p-4 items-center justify-center"><FileSpreadsheet className="w-12 h-12 text-red-400" /></div>,
                            },
                            {
                                title: "Resource Conflicts",
                                description: "Without a centralized calendar, double-booking crew and equipment becomes an expensive inevitability.",
                                header: <div className="flex flex-1 w-full h-full min-h-[6rem] rounded-xl bg-gradient-to-br from-orange-500/10 to-orange-600/5 border border-orange-500/10 p-4 items-center justify-center"><Users className="w-12 h-12 text-orange-400" /></div>,
                            },
                            {
                                title: "Financial Opacity",
                                description: "Waiting until the end of a project to calculate profitability prevents proactive decision making.",
                                header: <div className="flex flex-1 w-full h-full min-h-[6rem] rounded-xl bg-gradient-to-br from-yellow-500/10 to-yellow-600/5 border border-yellow-500/10 p-4 items-center justify-center"><Calculator className="w-12 h-12 text-yellow-400" /></div>,
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

            {/* --- SOLUTION WORKFLOW --- */}
            <section className="py-24 bg-marketing-surface border-y border-marketing-border overflow-hidden">
                <div className="container mx-auto px-6">
                    <div className="text-center mb-20">
                        <h2 className="text-marketing-primary font-bold tracking-widest uppercase text-sm mb-3">THE PLATFORM</h2>
                        <h3 className="text-3xl md:text-5xl font-bold mb-6">Everything you need to <br />run a modern production company.</h3>
                        <p className="text-xl text-marketing-text-secondary max-w-3xl mx-auto mb-12">
                            A complete suite of tools built specifically for the unique workflows of video production.
                        </p>

                        <FeaturesGrid />
                        <div className="mt-12"></div>
                        <FeatureTabs />
                    </div>
                </div>
            </section>

            {/* --- ROI CALCULATOR --- */}
            <section className="py-24 bg-marketing-background">
                <div className="container mx-auto px-6">
                    <ROICalculator />
                </div>
            </section>

            {/* --- SOCIAL PROOF --- */}
            <section className="py-24 border-b border-marketing-border bg-marketing-background">
                <div className="container mx-auto px-6">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-5xl font-bold mb-6">Trusted by the industry's best.</h2>
                        <p className="text-xl text-marketing-text-secondary">Join over 200 production companies scaling with ProductionOS.</p>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
                        {testimonials.slice(0, 3).map((t, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.1 }}
                                className="p-8 bg-marketing-surface/50 backdrop-blur-sm border border-marketing-border/50 rounded-3xl hover:border-marketing-primary/30 transition-all hover:shadow-2xl hover:shadow-marketing-primary/5 hover:-translate-y-1"
                            >
                                <div className="flex text-marketing-primary mb-6">
                                    {[...Array(5)].map((_, i) => <Star key={i} size={18} fill="currentColor" className="opacity-80" />)}
                                </div>
                                <p className="text-xl mb-8 leading-relaxed font-medium text-marketing-text-primary/90">"{t.quote}"</p>
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-marketing-primary to-marketing-accent flex items-center justify-center font-bold text-white text-lg shadow-lg">
                                        {t.author[0]}
                                    </div>
                                    <div>
                                        <div className="font-bold text-white">{t.author}</div>
                                        <div className="text-sm text-marketing-text-secondary">{t.role}, {t.company}</div>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* --- CTA SECTION --- */}
            <AuroraBackground showRadialGradient={false}>
                <section className="py-32 relative text-center w-full z-10">
                    <div className="container mx-auto px-6">
                        <h2 className="text-4xl md:text-6xl font-bold mb-8 text-white">Ready to professionalize your workflow?</h2>
                        <p className="text-xl text-marketing-text-secondary mb-12 max-w-2xl mx-auto">
                            Join the operating system used by the world's leading production teams. Start your free trial today.
                        </p>
                        <div className="flex flex-col md:flex-row items-center justify-center gap-4">
                            <Link to="/auth/signup" className="px-10 py-5 bg-marketing-primary text-white text-xl font-bold rounded-xl hover:bg-marketing-primary/90 transition-all shadow-xl hover:shadow-2xl hover:-translate-y-1">
                                Start Free Trial
                            </Link>
                            <Link to="/pricing" className="px-10 py-5 bg-transparent border border-white/20 text-white text-xl font-bold rounded-xl hover:bg-white/10 transition-all">
                                View Pricing
                            </Link>
                        </div>
                        <p className="mt-8 text-marketing-text-secondary text-sm opacity-70">
                            No credit card required for trial · Cancel anytime · Enterprise security
                        </p>
                    </div>
                </section>
            </AuroraBackground>
        </Layout>
    );
}
