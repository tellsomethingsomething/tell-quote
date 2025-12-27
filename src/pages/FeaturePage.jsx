import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { Check, ArrowRight, Quote } from 'lucide-react';
import Layout from '../components/layout/Layout';
import MotionScreenGrab from '../components/ui/MotionScreenGrab';
import { featurePageData, features } from '../data/features';
import DashboardMockup from '../components/mockups/DashboardMockup';
import KanbanMockup from '../components/mockups/KanbanMockup';
import QuoteBuilderMockup from '../components/mockups/QuoteBuilderMockup';
import CrewMockup from '../components/mockups/CrewMockup';
import EquipmentMockup from '../components/mockups/EquipmentMockup';
import FinanceMockup from '../components/mockups/FinanceMockup';
import CallSheetMockup from '../components/mockups/CallSheetMockup';
import DeliverablesMockup from '../components/mockups/DeliverablesMockup';

// Map feature IDs to their mockup components
const getMockupForFeature = (featureId) => {
    switch (featureId) {
        case 'quoting': return <QuoteBuilderMockup />;
        case 'projects': return <KanbanMockup />;
        case 'crm': return <DashboardMockup />;
        case 'crew': return <CrewMockup />;
        case 'equipment': return <EquipmentMockup />;
        case 'financials': return <FinanceMockup />;
        case 'call-sheets': return <CallSheetMockup />;
        case 'deliverables': return <DeliverablesMockup />;
        default: return <DashboardMockup />;
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

                {/* Motion Mockup */}
                <div className="max-w-4xl mx-auto z-20 relative">
                    <motion.div
                        initial={{ y: 40, opacity: 0, rotateX: 20 }}
                        animate={{ y: 0, opacity: 1, rotateX: 0 }}
                        transition={{ duration: 1, delay: 0.2, ease: "easeOut" }}
                        style={{ perspective: 1000 }}
                        className="w-full overflow-hidden rounded-xl"
                    >
                        {getMockupForFeature(featureId)}
                    </motion.div>
                </div>
            </section>

            {/* Pain Point vs Solution */}
            <section className="py-20 bg-marketing-surface border-y border-marketing-border">
                <div className="container mx-auto px-6 md:px-12">
                    <div className="grid md:grid-cols-2 gap-12 max-w-5xl mx-auto">
                        <div className="bg-red-500/5 border border-red-500/10 p-8 rounded-2xl">
                            <h3 className="text-red-400 font-bold mb-4 flex items-center gap-2">
                                <XIcon /> The Old Way
                            </h3>
                            <p className="text-marketing-text-secondary leading-relaxed">"{data.painPoint}"</p>
                        </div>
                        <div className="bg-marketing-success/5 border border-marketing-success/10 p-8 rounded-2xl">
                            <h3 className="text-marketing-success font-bold mb-4 flex items-center gap-2">
                                <CheckIcon /> The ProductionOS Way
                            </h3>
                            <p className="text-marketing-text-secondary leading-relaxed">{data.solution}</p>
                        </div>
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

function CheckIcon() {
    return <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>;
}

function XIcon() {
    return <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>;
}
