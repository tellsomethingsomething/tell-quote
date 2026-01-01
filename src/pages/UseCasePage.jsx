import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import SEOHead, { createBreadcrumbSchema } from '../components/common/SEOHead';
import { Check, ArrowRight, Quote } from 'lucide-react';
import Layout from '../components/layout/Layout';
import MotionScreenGrab from '../components/ui/MotionScreenGrab';
import { useCases } from '../data/use_cases';
import { features } from '../data/features';
import DashboardMockup from '../components/mockups/DashboardMockup';
import KanbanMockup from '../components/mockups/KanbanMockup';
import QuoteBuilderMockup from '../components/mockups/QuoteBuilderMockup';
import CrewMockup from '../components/mockups/CrewMockup';
import EquipmentMockup from '../components/mockups/EquipmentMockup';
import FinanceMockup from '../components/mockups/FinanceMockup';
import CallSheetMockup from '../components/mockups/CallSheetMockup';

// Map use case IDs to their mockup components
const getMockupForUseCase = (useCaseId) => {
    switch (useCaseId) {
        case 'video-production': return <DashboardMockup />;
        case 'event-production': return <KanbanMockup />;
        case 'photography': return <QuoteBuilderMockup />;
        case 'live-streaming': return <CrewMockup />;
        case 'post-production': return <KanbanMockup />;
        case 'corporate-video': return <FinanceMockup />;
        default: return <DashboardMockup />;
    }
};

export default function UseCasePage() {
    const { useCaseId } = useParams();
    const data = useCases[useCaseId];

    if (!data) { // Handle not found 
        return <Layout><div className="pt-32 text-center">Not Found</div></Layout>;
    }

    // Find relevant features info
    const relevantFeatures = data.features.map(id => features.find(f => f.id === id)).filter(Boolean);

    return (
        <Layout>
            <SEOHead
                title={data.seoTitle}
                description={data.seoDesc}
                path={`/use-cases/${useCaseId}`}
                structuredData={createBreadcrumbSchema([
                    { name: 'Home', url: 'https://www.productionos.io/' },
                    { name: 'Use Cases', url: 'https://www.productionos.io/use-cases' },
                    { name: useCaseId.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '), url: `https://www.productionos.io/use-cases/${useCaseId}` }
                ])}
            />

            {/* Hero */}
            <section className="pt-24 md:pt-32 pb-12 md:pb-16 container mx-auto px-4 md:px-12 relative">
                {/* Background Blob */}
                <div className="absolute top-0 right-0 w-3/4 h-full -z-10 bg-marketing-primary/5 blur-[120px] rounded-full pointer-events-none" />

                <div className="grid lg:grid-cols-2 gap-6 lg:gap-12 items-center">
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                    >
                        <div className="inline-block px-3 py-1 rounded-full bg-marketing-accent/10 text-marketing-accent text-xs sm:text-sm font-medium mb-4 md:mb-6 uppercase tracking-wider">
                            Use Case: {useCaseId.replace('-', ' ')}
                        </div>
                        <h1 className="text-2xl sm:text-3xl md:text-5xl lg:text-6xl font-bold mb-4 md:mb-6 leading-tight">
                            {data.title}
                        </h1>
                        <p className="text-base sm:text-lg md:text-xl text-marketing-text-secondary mb-4 md:mb-6">
                            {data.subtitle}
                        </p>
                        <p className="text-marketing-text-secondary/80 mb-6 md:mb-8 leading-relaxed text-sm md:text-base">
                            {data.intro}
                        </p>
                        <Link to="/auth/signup" className="inline-flex items-center gap-2 px-5 md:px-6 py-2.5 md:py-3 bg-marketing-text-primary text-marketing-background font-bold rounded-lg hover:bg-white transition-colors text-sm md:text-base">
                            Start free trial <ArrowRight size={16} className="md:w-[18px] md:h-[18px]" />
                        </Link>
                    </motion.div>

                    <div className="relative p-2 md:p-6">
                        <motion.div
                            initial={{ x: 20, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            transition={{ duration: 0.8, delay: 0.2 }}
                            className="w-full overflow-hidden rounded-xl"
                        >
                            {getMockupForUseCase(useCaseId)}
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* Pain Points */}
            <section className="py-12 md:py-20 bg-marketing-surface border-y border-marketing-border">
                <div className="container mx-auto px-4 md:px-12">
                    <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-8">
                        {data.painPoints.map((point, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.1 }}
                                className="bg-marketing-background border border-marketing-border p-8 rounded-xl"
                            >
                                <div className="w-10 h-10 bg-red-500/10 text-red-400 rounded-lg flex items-center justify-center mb-4">
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                                </div>
                                <h4 className="font-bold text-lg mb-2">{point.title}</h4>
                                <p className="text-marketing-text-secondary text-sm leading-relaxed">{point.desc}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Key Features */}
            <section className="py-12 md:py-20">
                <div className="container mx-auto px-4 md:px-12">
                    <h2 className="text-2xl md:text-3xl font-bold text-center mb-8 md:mb-16">Platform Features for {useCaseId.replace('-', ' ')}</h2>
                    <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
                        {relevantFeatures.map((feature, i) => (
                            <Link
                                key={feature.id}
                                to={feature.path}
                                className="bg-marketing-surface border border-marketing-border p-4 md:p-6 rounded-xl hover:border-marketing-primary/50 transition-colors group"
                            >
                                <feature.icon className="text-marketing-primary mb-3 md:mb-4 group-hover:scale-110 transition-transform" size={24} />
                                <h3 className="text-sm md:text-lg font-bold mb-1 md:mb-2">{feature.headline}</h3>
                                <p className="text-xs md:text-sm text-marketing-text-secondary line-clamp-2 md:line-clamp-none">{feature.description}</p>
                            </Link>
                        ))}
                    </div>
                </div>
            </section>

            {/* Testimonial */}
            {data.testimonial && (
                <section className="py-12 md:py-20 container mx-auto px-4 md:px-12">
                    <div className="bg-gradient-to-br from-marketing-surface to-marketing-background border border-marketing-border p-6 md:p-12 rounded-2xl md:rounded-3xl text-center max-w-4xl mx-auto">
                        <Quote className="text-marketing-primary mx-auto mb-4 md:mb-8" size={32} />
                        <p className="text-lg sm:text-2xl md:text-3xl font-medium leading-relaxed mb-4 md:mb-8">"{data.testimonial.quote}"</p>
                        <div>
                            <div className="font-bold text-base md:text-lg">{data.testimonial.author}</div>
                            <div className="text-marketing-text-secondary text-sm md:text-base">{data.testimonial.company}</div>
                        </div>
                    </div>
                </section>
            )}

            {/* CTA */}
            <section className="py-12 md:py-20 text-center bg-marketing-primary/5 border-t border-marketing-border">
                <div className="container mx-auto px-4 md:px-12">
                    <h2 className="text-2xl sm:text-3xl md:text-5xl font-bold mb-6 md:mb-8">Ready to transform your business?</h2>
                    <Link to="/auth/signup" className="inline-block px-6 md:px-8 py-3 md:py-4 bg-marketing-primary text-white font-bold rounded-xl hover:bg-marketing-primary/90 transition-colors text-sm md:text-base">
                        Start free trial
                    </Link>
                </div>
            </section>
        </Layout>
    );
}
