import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
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
            <Helmet>
                <title>{data.seoTitle}</title>
                <meta name="description" content={data.seoDesc} />
            </Helmet>

            {/* Hero */}
            <section className="pt-32 pb-20 container mx-auto px-6 md:px-12 text-center">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    <div className="inline-block px-3 py-1 rounded-full bg-marketing-primary/10 text-marketing-primary text-sm font-medium mb-6 uppercase tracking-wider">
                        Comparison
                    </div>
                    <h1 className="text-4xl md:text-6xl font-bold mb-6">
                        {data.title}
                    </h1>
                    <p className="text-xl text-marketing-text-secondary max-w-3xl mx-auto mb-8 leading-relaxed">
                        {data.intro}
                    </p>
                </motion.div>
            </section>

            {/* Comparison Table */}
            <section className="pb-20 bg-marketing-background">
                <div className="container mx-auto px-6 md:px-12 max-w-5xl">
                    <div className="overflow-x-auto bg-marketing-surface border border-marketing-border rounded-xl shadow-2xl">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr>
                                    <th className="p-6 border-b border-marketing-border text-marketing-text-secondary font-medium w-1/3">Feature</th>
                                    <th className="p-6 border-b border-marketing-border text-marketing-primary font-bold text-xl w-1/3 bg-marketing-primary/5">ProductionOS</th>
                                    <th className="p-6 border-b border-marketing-border text-marketing-text-secondary font-bold text-xl w-1/3">{data.competitorName}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.table.map((row, i) => (
                                    <tr key={i} className="border-b border-marketing-border/50 hover:bg-marketing-background/50">
                                        <td className="p-4 px-6 font-medium text-marketing-text-primary">{row.feature}</td>
                                        <td className="p-4 px-6 bg-marketing-primary/5 font-medium text-marketing-text-primary">
                                            {row.us === '✓' ? <Check className="text-marketing-success" /> : row.us === '✗' ? <X className="text-red-400" /> : row.us}
                                        </td>
                                        <td className="p-4 px-6 text-marketing-text-secondary">
                                            {row.them === '✓' ? <Check className="text-marketing-success" /> : row.them === '✗' ? <X className="text-marketing-text-secondary/50" /> : row.them}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </section>

            {/* Differentiators */}
            <section className="pb-20 container mx-auto px-6 md:px-12">
                <h2 className="text-2xl font-bold text-center mb-12">Why the difference matters</h2>
                <div className="grid md:grid-cols-3 gap-8">
                    {data.differentiators.map((diff, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.1 }}
                            className="bg-marketing-surface border border-marketing-border p-8 rounded-2xl"
                        >
                            <div className="w-12 h-12 bg-marketing-primary/10 rounded-full flex items-center justify-center text-marketing-primary mb-6 text-xl font-bold">
                                {i + 1}
                            </div>
                            <h3 className="text-xl font-bold mb-3">{diff.title}</h3>
                            <p className="text-marketing-text-secondary leading-relaxed">{diff.desc}</p>
                        </motion.div>
                    ))}
                </div>
            </section>

            {/* When to use which */}
            <section className="py-20 container mx-auto px-6 md:px-12 bg-marketing-surface border-y border-marketing-border">
                <div className="grid md:grid-cols-2 gap-12 max-w-5xl mx-auto">
                    <div className="bg-marketing-background border border-marketing-border p-8 rounded-2xl">
                        <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                            When to use {data.competitorName}
                        </h3>
                        <ul className="space-y-4">
                            {data.whenToUseThem.map((point, i) => (
                                <li key={i} className="flex items-start gap-3 text-marketing-text-secondary">
                                    <Check size={18} className="mt-1 shrink-0" />
                                    <span>{point}</span>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div className="bg-gradient-to-br from-marketing-background to-marketing-primary/10 border border-marketing-primary/30 p-8 rounded-2xl shadow-lg shadow-marketing-primary/5 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-3 bg-marketing-primary text-white text-xs font-bold rounded-bl-xl">RECOMMENDED</div>
                        <h3 className="text-xl font-bold mb-6 flex items-center gap-2 text-marketing-text-primary">
                            When to use ProductionOS
                        </h3>
                        <ul className="space-y-4">
                            {data.whenToUseUs.map((point, i) => (
                                <li key={i} className="flex items-start gap-3 text-marketing-text-primary">
                                    <Check size={18} className="mt-1 shrink-0 text-marketing-primary" />
                                    <span>{point}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className="py-20 text-center">
                <div className="container mx-auto px-6 md:px-12">
                    <h2 className="text-3xl font-bold mb-8">Stop settling. Start producing.</h2>
                    <Link to="/auth/signup" className="inline-block px-8 py-4 bg-marketing-primary text-white font-bold rounded-xl hover:bg-marketing-primary/90 transition-colors">
                        Start free trial
                    </Link>
                </div>
            </section>
        </Layout>
    );
}
