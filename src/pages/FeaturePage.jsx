import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { Check, ArrowRight, Quote } from 'lucide-react';
import Layout from '../components/layout/Layout';
import MotionScreenGrab from '../components/ui/MotionScreenGrab';
import { featurePageData, features } from '../data/features';
// Interactive Demos
import QuotingDemo from '../components/mockups/demos/QuotingDemo';
import ProjectsDemo from '../components/mockups/demos/ProjectsDemo';
import CRMFeatureDemo from '../components/mockups/demos/CRMFeatureDemo';
import CrewDemo from '../components/mockups/demos/CrewDemo';
import EquipmentDemo from '../components/mockups/demos/EquipmentDemo';
import FinancialsFeatureDemo from '../components/mockups/demos/FinancialsFeatureDemo';
import CallSheetDemo from '../components/mockups/demos/CallSheetDemo';
import DeliverablesDemo from '../components/mockups/demos/DeliverablesDemo';
import AIResearchDemo from '../components/mockups/demos/AIResearchDemo';
import EmailSequencesDemo from '../components/mockups/demos/EmailSequencesDemo';
import SOPsDemo from '../components/mockups/demos/SOPsDemo';

// Map feature IDs to their interactive demo components
const getDemoForFeature = (featureId) => {
    switch (featureId) {
        case 'quoting': return <QuotingDemo />;
        case 'projects': return <ProjectsDemo />;
        case 'crm': return <CRMFeatureDemo />;
        case 'crew': return <CrewDemo />;
        case 'equipment': return <EquipmentDemo />;
        case 'financials': return <FinancialsFeatureDemo />;
        case 'call-sheets': return <CallSheetDemo />;
        case 'deliverables': return <DeliverablesDemo />;
        case 'ai-research': return <AIResearchDemo />;
        case 'sops': return <SOPsDemo />;
        case 'email-sequences': return <EmailSequencesDemo />;
        default: return <QuotingDemo />;
    }
};

export default function FeaturePage() {
    const { featureId } = useParams();
    const data = featurePageData[featureId];

    if (!data) {
        return (
            <Layout>
                <div className="pt-32 pb-20 text-center">
                    <h1 className="text-4xl font-bold">Feature not found</h1>
                    <Link to="/" className="text-marketing-primary mt-4 inline-block">Go Home</Link>
                </div>
            </Layout>
        );
    }

    // Find related features info
    const relatedFeatures = data.related.map(id => features.find(f => f.id === id)).filter(Boolean);

    return (
        <Layout>
            <Helmet>
                <title>{data.seoTitle}</title>
                <meta name="description" content={data.seoDesc} />
            </Helmet>

            {/* Hero */}
            <section className="pt-32 pb-20 container mx-auto px-6 md:px-12 text-center relative overflow-hidden">
                {/* Background Blob */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-4xl -z-10 bg-marketing-primary/5 blur-[100px] rounded-full pointer-events-none" />

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    <div className="inline-block px-3 py-1 rounded-full bg-marketing-primary/10 text-marketing-primary text-sm font-medium mb-6 uppercase tracking-wider">
                        {featureId.replace('-', ' ')}
                    </div>
                    <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold mb-6 max-w-4xl mx-auto leading-tight">
                        {data.title}
                    </h1>
                    <p className="text-lg md:text-xl text-marketing-text-secondary max-w-2xl mx-auto mb-10">
                        {data.subtitle}
                    </p>
                    <div className="flex justify-center gap-4 mb-12 md:mb-16">
                        <Link to="/auth/signup" className="px-6 py-3 bg-marketing-primary text-white font-bold rounded-lg hover:bg-marketing-primary/90 transition-colors">
                            Start free trial
                        </Link>
                    </div>
                </motion.div>

                {/* Interactive Demo */}
                <div className="max-w-4xl mx-auto z-20 relative">
                    <motion.div
                        initial={{ y: 40, opacity: 0, rotateX: 20 }}
                        animate={{ y: 0, opacity: 1, rotateX: 0 }}
                        transition={{ duration: 1, delay: 0.2, ease: "easeOut" }}
                        style={{ perspective: 1000 }}
                        className="w-full overflow-hidden"
                    >
                        {/* Demo Window */}
                        <div className="bg-gray-900 rounded-xl border border-gray-800 shadow-2xl overflow-hidden">
                            {/* Window Chrome */}
                            <div className="bg-gray-800/80 px-4 py-3 flex items-center justify-between border-b border-gray-700/50">
                                <div className="flex items-center gap-2">
                                    <div className="flex gap-1.5">
                                        <div className="w-3 h-3 rounded-full bg-red-500/80" />
                                        <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                                        <div className="w-3 h-3 rounded-full bg-green-500/80" />
                                    </div>
                                    <span className="text-gray-500 text-xs ml-2 hidden sm:inline">ProductionOS</span>
                                </div>
                                <div className="flex items-center gap-2 text-gray-500 text-xs">
                                    <span className="hidden sm:inline">Interactive Demo</span>
                                    <span className="px-2 py-0.5 bg-indigo-500/20 text-indigo-400 rounded text-xs">
                                        Live
                                    </span>
                                </div>
                            </div>

                            {/* Demo Content */}
                            <div className="relative min-h-[400px] sm:min-h-[450px]">
                                {getDemoForFeature(featureId)}
                            </div>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* Pain Point vs Solution - Redesigned */}
            <section className="py-24 bg-gradient-to-b from-marketing-background via-marketing-surface to-marketing-background relative overflow-hidden">
                <div className="container mx-auto px-6 md:px-12 relative">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-center mb-16"
                    >
                        <h2 className="text-3xl md:text-4xl font-bold mb-4 bg-gradient-to-r from-white via-white to-gray-400 bg-clip-text text-transparent">
                            From Chaos to Clarity
                        </h2>
                        <p className="text-marketing-text-secondary text-lg max-w-2xl mx-auto">
                            See how ProductionOS transforms your workflow
                        </p>
                    </motion.div>

                    <div className="grid md:grid-cols-2 gap-8 lg:gap-12 max-w-6xl mx-auto items-stretch relative">

                        {/* Connecting Arrow - Desktop Only */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.8 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.5, duration: 0.6 }}
                            className="hidden lg:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10"
                        >
                            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-marketing-surface to-marketing-background border-2 border-cyan-500/30 flex items-center justify-center shadow-lg shadow-cyan-500/20">
                                <svg className="w-8 h-8 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                </svg>
                            </div>
                        </motion.div>

                        {/* The Old Way Card */}
                        <motion.div
                            initial={{ opacity: 0, x: -30 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.1, duration: 0.5 }}
                            className="relative group"
                        >
                            <div className="absolute -inset-1 bg-gradient-to-br from-amber-500/20 via-orange-500/15 to-red-500/10 rounded-2xl blur-xl opacity-50 group-hover:opacity-70 transition-all duration-500" />

                            <div className="relative h-full bg-gradient-to-br from-gray-900 to-gray-900/90 border border-amber-500/20 p-8 rounded-2xl">
                                {/* Header */}
                                <div className="flex items-start gap-4 mb-6">
                                    <div className="w-14 h-14 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center flex-shrink-0">
                                        <svg className="w-7 h-7 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                    </div>
                                    <div>
                                        <span className="inline-block px-2 py-0.5 rounded text-[10px] font-semibold text-amber-400 bg-amber-500/10 uppercase tracking-wider mb-1">Before</span>
                                        <h3 className="text-xl font-bold text-amber-400">The Old Way</h3>
                                    </div>
                                </div>

                                {/* Quote */}
                                <blockquote className="mb-6">
                                    <p className="text-gray-400 leading-relaxed text-base italic pl-4 border-l-2 border-amber-500/30">
                                        "{data.painPoint}"
                                    </p>
                                </blockquote>

                                {/* Pain points list */}
                                <div className="space-y-3 pt-6 border-t border-amber-500/10">
                                    <div className="flex items-center gap-3">
                                        <div className="w-5 h-5 rounded-full bg-amber-500/10 flex items-center justify-center flex-shrink-0">
                                            <svg className="w-3 h-3 text-amber-400/70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                        </div>
                                        <span className="text-sm text-gray-500 line-through decoration-amber-500/40">Hours of manual work</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="w-5 h-5 rounded-full bg-amber-500/10 flex items-center justify-center flex-shrink-0">
                                            <svg className="w-3 h-3 text-amber-400/70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                        </div>
                                        <span className="text-sm text-gray-500 line-through decoration-amber-500/40">Data scattered everywhere</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="w-5 h-5 rounded-full bg-amber-500/10 flex items-center justify-center flex-shrink-0">
                                            <svg className="w-3 h-3 text-amber-400/70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                        </div>
                                        <span className="text-sm text-gray-500 line-through decoration-amber-500/40">Costly mistakes</span>
                                    </div>
                                </div>
                            </div>
                        </motion.div>

                        {/* The ProductionOS Way Card */}
                        <motion.div
                            initial={{ opacity: 0, x: 30 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.3, duration: 0.5 }}
                            className="relative group"
                        >
                            <div className="absolute -inset-1 bg-gradient-to-br from-cyan-500/30 via-blue-500/20 to-cyan-500/20 rounded-2xl blur-xl opacity-60 group-hover:opacity-90 transition-all duration-500" />

                            <div className="relative h-full bg-gradient-to-br from-gray-900 via-cyan-950/20 to-gray-900 border border-cyan-500/30 p-8 rounded-2xl shadow-lg shadow-cyan-500/5">
                                {/* Header */}
                                <div className="flex items-start gap-4 mb-6">
                                    <div className="w-14 h-14 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center flex-shrink-0">
                                        <svg className="w-7 h-7 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                        </svg>
                                    </div>
                                    <div>
                                        <span className="inline-block px-2 py-0.5 rounded text-[10px] font-semibold text-cyan-400 bg-cyan-500/10 uppercase tracking-wider mb-1">With ProductionOS</span>
                                        <h3 className="text-xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">The Better Way</h3>
                                    </div>
                                </div>

                                {/* Solution */}
                                <p className="text-gray-200 leading-relaxed text-base mb-6 pl-4 border-l-2 border-cyan-500/40">
                                    {data.solution}
                                </p>

                                {/* Benefits list */}
                                <div className="space-y-3 pt-6 border-t border-cyan-500/20">
                                    <div className="flex items-center gap-3">
                                        <div className="w-5 h-5 rounded-full bg-cyan-500/20 flex items-center justify-center flex-shrink-0">
                                            <svg className="w-3 h-3 text-cyan-400" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                            </svg>
                                        </div>
                                        <span className="text-sm text-gray-300 font-medium">Automated in seconds</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="w-5 h-5 rounded-full bg-cyan-500/20 flex items-center justify-center flex-shrink-0">
                                            <svg className="w-3 h-3 text-cyan-400" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                            </svg>
                                        </div>
                                        <span className="text-sm text-gray-300 font-medium">Single source of truth</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="w-5 h-5 rounded-full bg-cyan-500/20 flex items-center justify-center flex-shrink-0">
                                            <svg className="w-3 h-3 text-cyan-400" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                            </svg>
                                        </div>
                                        <span className="text-sm text-gray-300 font-medium">Built-in accuracy</span>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* Benefits Grid */}
            <section className="py-20">
                <div className="container mx-auto px-6 md:px-12">
                    <h2 className="text-3xl font-bold text-center mb-16">Key Features</h2>
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {data.benefits.map((benefit, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.1 }}
                                className="p-6 bg-marketing-surface border border-marketing-border rounded-xl"
                            >
                                <div className="w-10 h-10 bg-marketing-primary/10 rounded-lg flex items-center justify-center text-marketing-primary mb-4">
                                    <Check size={20} />
                                </div>
                                <h3 className="text-xl font-bold mb-2">{benefit.title}</h3>
                                <p className="text-marketing-text-secondary">{benefit.desc}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Testimonial */}
            {data.testimonial && (
                <section className="py-16 container mx-auto px-6 text-center">
                    <div className="bg-gradient-to-br from-marketing-surface to-marketing-background border border-marketing-border p-10 rounded-2xl max-w-3xl mx-auto">
                        <Quote className="text-marketing-primary mx-auto mb-6" size={32} />
                        <p className="text-xl md:text-2xl font-medium leading-relaxed mb-6">"{data.testimonial.quote}"</p>
                        <div>
                            <div className="font-bold">{data.testimonial.author}</div>
                            <div className="text-marketing-text-secondary text-sm">{data.testimonial.company}</div>
                        </div>
                    </div>
                </section>
            )}

            {/* Related Features */}
            <section className="py-20 container mx-auto px-6 md:px-12 bg-marketing-surface border-t border-marketing-border">
                <h2 className="text-2xl font-bold mb-8 text-center">Related Features</h2>
                <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
                    {relatedFeatures.map((feature) => (
                        <Link key={feature.id} to={feature.path} className="block group">
                            <div className="p-6 border border-marketing-border rounded-xl bg-marketing-background hover:border-marketing-primary/50 transition-colors h-full">
                                <div className="flex items-center gap-3 mb-4">
                                    <feature.icon className="text-marketing-primary group-hover:scale-110 transition-transform" />
                                    <h3 className="font-bold text-lg">{feature.headline}</h3>
                                </div>
                                <p className="text-marketing-text-secondary text-sm">{feature.description}</p>
                            </div>
                        </Link>
                    ))}
                </div>
            </section>

            {/* CTA */}
            <section className="py-20 bg-marketing-primary/5 border-t border-marketing-border">
                <div className="container mx-auto px-6 md:px-12 text-center">
                    <h2 className="text-3xl md:text-4xl font-bold mb-6">Ready to upgrade your workflow?</h2>
                    <div className="flex justify-center gap-4">
                        <Link to="/auth/signup" className="px-8 py-4 bg-marketing-primary text-white font-bold rounded-xl hover:bg-marketing-primary/90 transition-colors">
                            Build your first quote for free
                        </Link>
                    </div>
                </div>
            </section>
        </Layout>
    );
}

function CheckIcon({ className }) {
    return <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>;
}

function XIcon({ className }) {
    return <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>;
}
