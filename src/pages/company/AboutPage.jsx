import React from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { Target, Heart, Zap, Globe, ArrowRight, CheckCircle } from 'lucide-react';
import Layout from '../../components/layout/Layout';

const values = [
    {
        icon: Target,
        title: "Built for Production",
        description: "We understand the unique challenges of production because we've lived them. Every feature is designed with real workflows in mind."
    },
    {
        icon: Zap,
        title: "Speed & Efficiency",
        description: "Time is money in production. Our platform is built to save you hours every week on admin so you can focus on creating."
    },
    {
        icon: Heart,
        title: "Customer-Obsessed",
        description: "Your success is our success. We actively listen to feedback and continuously improve based on what our users need."
    },
    {
        icon: Globe,
        title: "Global Reach",
        description: "Production is international. We support multiple currencies, languages, and regional requirements out of the box."
    }
];

const milestones = [
    { year: "2023", event: "ProductionOS founded with a mission to modernize production workflows" },
    { year: "2024", event: "Launched CRM, quoting, and project management features" },
    { year: "2025", event: "Expanded to include crew management, equipment tracking, and financials" },
];

export default function AboutPage() {
    return (
        <Layout>
            <Helmet>
                <title>About Us - ProductionOS | Our Story & Mission</title>
                <meta name="description" content="Learn about ProductionOS - the operating system for modern production companies. Discover our mission to streamline production workflows worldwide." />
            </Helmet>

            {/* Hero */}
            <section className="pt-32 pb-20 bg-marketing-background">
                <div className="container mx-auto px-6">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        className="max-w-4xl mx-auto text-center"
                    >
                        <span className="inline-block py-1 px-3 rounded-full bg-marketing-surface border border-marketing-border text-marketing-text-secondary text-xs font-medium mb-6 uppercase tracking-widest">
                            About Us
                        </span>
                        <h1 className="text-4xl md:text-6xl font-bold mb-6 text-white">
                            Built by production people, for production people
                        </h1>
                        <p className="text-xl text-marketing-text-secondary">
                            We're on a mission to give every production company the tools they need to operate like the industry's best.
                        </p>
                    </motion.div>
                </div>
            </section>

            {/* Story Section */}
            <section className="py-20 bg-marketing-surface border-y border-marketing-border">
                <div className="container mx-auto px-6">
                    <div className="max-w-4xl mx-auto">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                        >
                            <h2 className="text-3xl font-bold text-white mb-8">Our Story</h2>
                            <div className="prose prose-lg prose-invert">
                                <p className="text-marketing-text-secondary text-lg leading-relaxed mb-6">
                                    ProductionOS was born from frustration. After years of working in production, we saw talented teams held back by fragmented tools - spreadsheets for quotes, separate apps for project management, WhatsApp for crew coordination, and manual tracking for finances.
                                </p>
                                <p className="text-marketing-text-secondary text-lg leading-relaxed mb-6">
                                    We knew there had to be a better way. So we built it.
                                </p>
                                <p className="text-marketing-text-secondary text-lg leading-relaxed">
                                    Today, ProductionOS is the operating system that connects every part of your production business - from first client contact to final invoice. We're proud to help production companies around the world save time, reduce errors, and focus on what they do best: creating amazing content.
                                </p>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* Values */}
            <section className="py-20 bg-marketing-background">
                <div className="container mx-auto px-6">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Our Values</h2>
                        <p className="text-marketing-text-secondary max-w-2xl mx-auto">
                            These principles guide everything we build.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto">
                        {values.map((value, index) => (
                            <motion.div
                                key={value.title}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: index * 0.1 }}
                                className="p-6 bg-marketing-surface border border-marketing-border rounded-2xl"
                            >
                                <div className="w-12 h-12 rounded-xl bg-marketing-primary/10 flex items-center justify-center mb-4">
                                    <value.icon className="w-6 h-6 text-marketing-primary" />
                                </div>
                                <h3 className="text-xl font-bold text-white mb-2">{value.title}</h3>
                                <p className="text-marketing-text-secondary">{value.description}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Timeline */}
            <section className="py-20 bg-marketing-surface border-y border-marketing-border">
                <div className="container mx-auto px-6">
                    <div className="max-w-3xl mx-auto">
                        <h2 className="text-3xl font-bold text-white mb-12 text-center">Our Journey</h2>
                        <div className="space-y-8">
                            {milestones.map((milestone, index) => (
                                <motion.div
                                    key={milestone.year}
                                    initial={{ opacity: 0, x: -20 }}
                                    whileInView={{ opacity: 1, x: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: index * 0.1 }}
                                    className="flex gap-6"
                                >
                                    <div className="flex-shrink-0">
                                        <span className="inline-flex items-center justify-center w-20 h-10 bg-marketing-primary text-white font-bold rounded-lg">
                                            {milestone.year}
                                        </span>
                                    </div>
                                    <div className="flex items-center">
                                        <p className="text-marketing-text-primary text-lg">{milestone.event}</p>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className="py-20 bg-marketing-background">
                <div className="container mx-auto px-6 text-center">
                    <h2 className="text-3xl font-bold text-white mb-4">Ready to join us?</h2>
                    <p className="text-marketing-text-secondary mb-8 max-w-xl mx-auto">
                        Start your free trial today and see why production companies love ProductionOS.
                    </p>
                    <div className="flex flex-col md:flex-row items-center justify-center gap-4">
                        <Link
                            to="/auth/signup"
                            className="inline-flex items-center gap-2 px-8 py-4 bg-marketing-primary text-white font-bold rounded-xl hover:bg-marketing-primary/90 transition-all"
                        >
                            Start Free Trial <ArrowRight size={18} />
                        </Link>
                        <Link
                            to="/company/contact"
                            className="inline-flex items-center gap-2 px-8 py-4 bg-marketing-surface border border-marketing-border text-white font-bold rounded-xl hover:bg-marketing-border/50 transition-all"
                        >
                            Contact Us
                        </Link>
                    </div>
                </div>
            </section>
        </Layout>
    );
}
