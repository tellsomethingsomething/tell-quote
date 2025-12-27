import React from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { Calendar, Clock, ArrowRight, User } from 'lucide-react';
import Layout from '../../components/layout/Layout';

const blogPosts = [
    {
        id: 1,
        slug: "how-to-price-production-services-2025",
        title: "How to Price Your Production Services in 2025",
        excerpt: "A comprehensive guide to setting competitive rates while maintaining healthy margins in the evolving production landscape.",
        category: "Business",
        author: "ProductionOS Team",
        date: "Dec 20, 2025",
        readTime: "8 min read",
        image: "https://images.unsplash.com/photo-1553877522-43269d4ea984?w=800&h=450&fit=crop",
    },
    {
        id: 2,
        slug: "complete-guide-production-call-sheets",
        title: "The Complete Guide to Production Call Sheets",
        excerpt: "Learn how to create call sheets that keep your crew informed, your clients happy, and your shoots running smoothly.",
        category: "Operations",
        author: "ProductionOS Team",
        date: "Dec 15, 2025",
        readTime: "6 min read",
        image: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&h=450&fit=crop",
    },
    {
        id: 3,
        slug: "managing-crew-rates-multiple-regions",
        title: "Managing Crew Rates Across Multiple Regions",
        excerpt: "Strategies for handling different day rates, currencies, and labor laws when working internationally.",
        category: "Finance",
        author: "ProductionOS Team",
        date: "Dec 10, 2025",
        readTime: "5 min read",
        image: "https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&h=450&fit=crop",
    },
    {
        id: 4,
        slug: "streamlining-client-communication",
        title: "Streamlining Client Communication in Production",
        excerpt: "Best practices for keeping clients in the loop without overwhelming your inbox or your team.",
        category: "Client Relations",
        author: "ProductionOS Team",
        date: "Dec 5, 2025",
        readTime: "7 min read",
        image: "https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=800&h=450&fit=crop",
    },
    {
        id: 5,
        slug: "equipment-tracking-chaos-to-control",
        title: "Equipment Tracking: From Chaos to Control",
        excerpt: "How modern production companies are using digital tools to manage kit, reduce losses, and improve utilization.",
        category: "Operations",
        author: "ProductionOS Team",
        date: "Nov 28, 2025",
        readTime: "6 min read",
        image: "https://images.unsplash.com/photo-1478720568477-152d9b164e26?w=800&h=450&fit=crop",
    },
    {
        id: 6,
        slug: "building-sustainable-freelance-crew-network",
        title: "Building a Sustainable Freelance Crew Network",
        excerpt: "Tips for creating and maintaining relationships with reliable freelancers in a competitive market.",
        category: "HR",
        author: "ProductionOS Team",
        date: "Nov 20, 2025",
        readTime: "9 min read",
        image: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&h=450&fit=crop",
    },
];

export default function BlogPage() {
    return (
        <Layout>
            <Helmet>
                <title>Blog - ProductionOS | Production Industry Insights</title>
                <meta name="description" content="Expert insights, tips, and best practices for video production companies. Learn about pricing, operations, crew management, and more." />
            </Helmet>

            {/* Hero */}
            <section className="pt-32 pb-16 bg-marketing-background">
                <div className="container mx-auto px-6 text-center">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                    >
                        <span className="inline-block py-1 px-3 rounded-full bg-marketing-surface border border-marketing-border text-marketing-text-secondary text-xs font-medium mb-6 uppercase tracking-widest">
                            Blog
                        </span>
                        <h1 className="text-4xl md:text-6xl font-bold mb-6 text-white">
                            Production Industry Insights
                        </h1>
                        <p className="text-xl text-marketing-text-secondary max-w-2xl mx-auto">
                            Expert tips, best practices, and industry trends for modern production companies.
                        </p>
                    </motion.div>
                </div>
            </section>

            {/* Blog Grid */}
            <section className="py-16 bg-marketing-background">
                <div className="container mx-auto px-6">
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
                        {blogPosts.map((post, index) => (
                            <motion.div
                                key={post.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                            >
                                <Link
                                    to={`/resources/blog/${post.slug}`}
                                    className="group block bg-marketing-surface border border-marketing-border rounded-2xl overflow-hidden hover:border-marketing-primary/30 transition-all hover:-translate-y-1"
                                >
                                    <div className="aspect-video overflow-hidden">
                                        <img
                                            src={post.image}
                                            alt={post.title}
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                        />
                                    </div>
                                    <div className="p-6">
                                        <span className="inline-block px-3 py-1 text-xs font-medium text-marketing-primary bg-marketing-primary/10 rounded-full mb-4">
                                            {post.category}
                                        </span>
                                        <h2 className="text-xl font-bold text-white mb-3 group-hover:text-marketing-primary transition-colors">
                                            {post.title}
                                        </h2>
                                        <p className="text-marketing-text-secondary mb-4 line-clamp-2">
                                            {post.excerpt}
                                        </p>
                                        <div className="flex items-center justify-between text-sm text-marketing-text-secondary">
                                            <div className="flex items-center gap-4">
                                                <span className="flex items-center gap-1">
                                                    <Calendar size={14} />
                                                    {post.date}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <Clock size={14} />
                                                    {post.readTime}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </Link>
                            </motion.div>
                        ))}
                    </div>

                    {/* Coming Soon Note */}
                    <div className="mt-16 text-center">
                        <p className="text-marketing-text-secondary">
                            More articles coming soon. Subscribe to our newsletter for updates.
                        </p>
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className="py-20 bg-marketing-surface border-t border-marketing-border">
                <div className="container mx-auto px-6 text-center">
                    <h2 className="text-3xl font-bold text-white mb-4">Ready to streamline your production workflow?</h2>
                    <p className="text-marketing-text-secondary mb-8 max-w-xl mx-auto">
                        Join hundreds of production companies using ProductionOS to manage their operations.
                    </p>
                    <Link
                        to="/auth/signup"
                        className="inline-flex items-center gap-2 px-8 py-4 bg-marketing-primary text-white font-bold rounded-xl hover:bg-marketing-primary/90 transition-all"
                    >
                        Start Free Trial <ArrowRight size={18} />
                    </Link>
                </div>
            </section>
        </Layout>
    );
}
