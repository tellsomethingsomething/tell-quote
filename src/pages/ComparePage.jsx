import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import SEOHead, { createBreadcrumbSchema } from '../components/common/SEOHead';
import { Check, X } from 'lucide-react';
import Layout from '../components/layout/Layout';
import { comparisons } from '../data/comparisons';

export default function ComparePage() {
    const { competitorId } = useParams();
    const data = comparisons[competitorId];

    if (!data) {
        return <Layout><div className="pt-32 text-center">Not Found</div></Layout>;
    }

    return (
        <Layout>
            <SEOHead
                title={data.seoTitle}
                description={data.seoDesc}
                path={`/compare/${competitorId}`}
                structuredData={createBreadcrumbSchema([
                    { name: 'Home', url: 'https://www.productionos.io/' },
                    { name: 'Compare', url: 'https://www.productionos.io/compare' },
                    { name: `vs ${data.competitorName}`, url: `https://www.productionos.io/compare/${competitorId}` }
                ])}
            />

            {/* Hero */}
            <section className="pt-24 md:pt-32 pb-12 md:pb-20 container mx-auto px-4 md:px-12 text-center">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    <div className="inline-block px-3 py-1 rounded-full bg-marketing-primary/10 text-marketing-primary text-xs md:text-sm font-medium mb-4 md:mb-6 uppercase tracking-wider">
                        Comparison
                    </div>
                    <h1 className="text-2xl sm:text-4xl md:text-6xl font-bold mb-4 md:mb-6">
                        {data.title}
                    </h1>
                    <p className="text-base md:text-xl text-marketing-text-secondary max-w-3xl mx-auto mb-6 md:mb-8 leading-relaxed">
                        {data.intro}
                    </p>
                </motion.div>
            </section>

            {/* Comparison Table */}
            <section className="pb-12 md:pb-20 bg-marketing-background">
                <div className="container mx-auto px-4 md:px-12 max-w-5xl">
                    <p className="text-center text-marketing-text-secondary text-sm mb-4 md:hidden">← Swipe to compare →</p>
                    <div className="overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0">
                        <div className="bg-marketing-surface border border-marketing-border rounded-xl shadow-2xl min-w-[500px]">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr>
                                        <th className="p-3 md:p-6 border-b border-marketing-border text-marketing-text-secondary font-medium w-1/3 text-sm md:text-base whitespace-nowrap">Feature</th>
                                        <th className="p-3 md:p-6 border-b border-marketing-border text-marketing-primary font-bold text-sm md:text-xl w-1/3 bg-marketing-primary/5 whitespace-nowrap">ProductionOS</th>
                                        <th className="p-3 md:p-6 border-b border-marketing-border text-marketing-text-secondary font-bold text-sm md:text-xl w-1/3 whitespace-nowrap">{data.competitorName}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {data.table.map((row, i) => (
                                        <tr key={i} className="border-b border-marketing-border/50 hover:bg-marketing-background/50">
                                            <td className="p-3 md:p-4 px-3 md:px-6 font-medium text-marketing-text-primary text-sm md:text-base">{row.feature}</td>
                                            <td className="p-3 md:p-4 px-3 md:px-6 bg-marketing-primary/5 font-medium text-marketing-text-primary text-sm md:text-base">
                                                {row.us === '✓' ? <Check className="text-marketing-success" size={18} /> : row.us === '✗' ? <X className="text-red-400" size={18} /> : row.us}
                                            </td>
                                            <td className="p-3 md:p-4 px-3 md:px-6 text-marketing-text-secondary text-sm md:text-base">
                                                {row.them === '✓' ? <Check className="text-marketing-success" size={18} /> : row.them === '✗' ? <X className="text-marketing-text-secondary/50" size={18} /> : row.them}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </section>

            {/* Differentiators */}
            <section className="pb-12 md:pb-20 container mx-auto px-4 md:px-12">
                <h2 className="text-xl md:text-2xl font-bold text-center mb-8 md:mb-12">Why the difference matters</h2>
                <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-8">
                    {data.differentiators.map((diff, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.1 }}
                            className="bg-marketing-surface border border-marketing-border p-5 md:p-8 rounded-xl md:rounded-2xl"
                        >
                            <div className="w-10 h-10 md:w-12 md:h-12 bg-marketing-primary/10 rounded-full flex items-center justify-center text-marketing-primary mb-4 md:mb-6 text-lg md:text-xl font-bold">
                                {i + 1}
                            </div>
                            <h3 className="text-lg md:text-xl font-bold mb-2 md:mb-3">{diff.title}</h3>
                            <p className="text-sm md:text-base text-marketing-text-secondary leading-relaxed">{diff.desc}</p>
                        </motion.div>
                    ))}
                </div>
            </section>

            {/* When to use which */}
            <section className="py-12 md:py-20 container mx-auto px-4 md:px-12 bg-marketing-surface border-y border-marketing-border">
                <div className="grid md:grid-cols-2 gap-6 md:gap-12 max-w-5xl mx-auto">
                    <div className="bg-marketing-background border border-marketing-border p-5 md:p-8 rounded-xl md:rounded-2xl">
                        <h3 className="text-lg md:text-xl font-bold mb-4 md:mb-6 flex items-center gap-2">
                            When to use {data.competitorName}
                        </h3>
                        <ul className="space-y-3 md:space-y-4">
                            {data.whenToUseThem.map((point, i) => (
                                <li key={i} className="flex items-start gap-2 md:gap-3 text-sm md:text-base text-marketing-text-secondary">
                                    <Check size={16} className="mt-0.5 shrink-0" />
                                    <span>{point}</span>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div className="bg-gradient-to-br from-marketing-background to-marketing-primary/10 border border-marketing-primary/30 p-5 md:p-8 rounded-xl md:rounded-2xl shadow-lg shadow-marketing-primary/5 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-2 md:p-3 bg-marketing-primary text-white text-[10px] md:text-xs font-bold rounded-bl-xl">RECOMMENDED</div>
                        <h3 className="text-lg md:text-xl font-bold mb-4 md:mb-6 flex items-center gap-2 text-marketing-text-primary">
                            When to use ProductionOS
                        </h3>
                        <ul className="space-y-3 md:space-y-4">
                            {data.whenToUseUs.map((point, i) => (
                                <li key={i} className="flex items-start gap-2 md:gap-3 text-sm md:text-base text-marketing-text-primary">
                                    <Check size={16} className="mt-0.5 shrink-0 text-marketing-primary" />
                                    <span>{point}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className="py-12 md:py-20 text-center">
                <div className="container mx-auto px-4 md:px-12">
                    <h2 className="text-2xl md:text-3xl font-bold mb-6 md:mb-8">Stop settling. Start producing.</h2>
                    <Link to="/auth/signup" className="inline-block px-6 md:px-8 py-3 md:py-4 bg-marketing-primary text-white font-bold rounded-xl hover:bg-marketing-primary/90 transition-colors text-sm md:text-base">
                        Start free trial
                    </Link>
                </div>
            </section>
        </Layout>
    );
}
