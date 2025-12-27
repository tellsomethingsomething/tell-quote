import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { Mail, MessageSquare, MapPin, Clock, Send, CheckCircle } from 'lucide-react';
import Layout from '../../components/layout/Layout';

const contactMethods = [
    {
        icon: Mail,
        title: "Email Support",
        description: "Get help from our support team",
        contact: "support@productionos.com",
        link: "mailto:support@productionos.com"
    },
    {
        icon: MessageSquare,
        title: "Sales Inquiries",
        description: "Learn about enterprise solutions",
        contact: "sales@productionos.com",
        link: "mailto:sales@productionos.com"
    },
    {
        icon: Clock,
        title: "Response Time",
        description: "We typically respond within",
        contact: "24 hours",
        link: null
    }
];

export default function ContactPage() {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        company: '',
        subject: 'general',
        message: ''
    });
    const [submitted, setSubmitted] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        // Simulate form submission
        await new Promise(resolve => setTimeout(resolve, 1000));

        setSubmitted(true);
        setLoading(false);
    };

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    return (
        <Layout>
            <Helmet>
                <title>Contact Us - ProductionOS | Get in Touch</title>
                <meta name="description" content="Contact the ProductionOS team for support, sales inquiries, or general questions. We're here to help you streamline your production workflow." />
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
                            Contact Us
                        </span>
                        <h1 className="text-4xl md:text-6xl font-bold mb-6 text-white">
                            We'd love to hear from you
                        </h1>
                        <p className="text-xl text-marketing-text-secondary max-w-2xl mx-auto">
                            Have questions about ProductionOS? Want to learn more about our enterprise solutions? We're here to help.
                        </p>
                    </motion.div>
                </div>
            </section>

            {/* Contact Methods */}
            <section className="py-12 bg-marketing-background">
                <div className="container mx-auto px-6">
                    <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
                        {contactMethods.map((method, index) => (
                            <motion.div
                                key={method.title}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                                className="p-6 bg-marketing-surface border border-marketing-border rounded-2xl text-center"
                            >
                                <div className="w-12 h-12 rounded-xl bg-marketing-primary/10 flex items-center justify-center mx-auto mb-4">
                                    <method.icon className="w-6 h-6 text-marketing-primary" />
                                </div>
                                <h3 className="text-lg font-bold text-white mb-2">{method.title}</h3>
                                <p className="text-marketing-text-secondary text-sm mb-2">{method.description}</p>
                                {method.link ? (
                                    <a href={method.link} className="text-marketing-primary font-medium hover:underline">
                                        {method.contact}
                                    </a>
                                ) : (
                                    <span className="text-marketing-primary font-medium">{method.contact}</span>
                                )}
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Contact Form */}
            <section className="py-16 bg-marketing-surface border-y border-marketing-border">
                <div className="container mx-auto px-6">
                    <div className="max-w-2xl mx-auto">
                        {submitted ? (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="text-center py-12"
                            >
                                <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-6">
                                    <CheckCircle className="w-8 h-8 text-green-500" />
                                </div>
                                <h2 className="text-2xl font-bold text-white mb-4">Message Sent!</h2>
                                <p className="text-marketing-text-secondary">
                                    Thank you for reaching out. We'll get back to you within 24 hours.
                                </p>
                            </motion.div>
                        ) : (
                            <>
                                <div className="text-center mb-12">
                                    <h2 className="text-3xl font-bold text-white mb-4">Send us a message</h2>
                                    <p className="text-marketing-text-secondary">
                                        Fill out the form below and we'll get back to you as soon as possible.
                                    </p>
                                </div>

                                <form onSubmit={handleSubmit} className="space-y-6">
                                    <div className="grid md:grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-sm font-medium text-white mb-2">
                                                Your Name *
                                            </label>
                                            <input
                                                type="text"
                                                name="name"
                                                value={formData.name}
                                                onChange={handleChange}
                                                required
                                                className="w-full px-4 py-3 bg-marketing-background border border-marketing-border rounded-xl text-white placeholder-marketing-text-secondary focus:outline-none focus:border-marketing-primary transition-colors"
                                                placeholder="John Smith"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-white mb-2">
                                                Email Address *
                                            </label>
                                            <input
                                                type="email"
                                                name="email"
                                                value={formData.email}
                                                onChange={handleChange}
                                                required
                                                className="w-full px-4 py-3 bg-marketing-background border border-marketing-border rounded-xl text-white placeholder-marketing-text-secondary focus:outline-none focus:border-marketing-primary transition-colors"
                                                placeholder="john@company.com"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-white mb-2">
                                            Company
                                        </label>
                                        <input
                                            type="text"
                                            name="company"
                                            value={formData.company}
                                            onChange={handleChange}
                                            className="w-full px-4 py-3 bg-marketing-background border border-marketing-border rounded-xl text-white placeholder-marketing-text-secondary focus:outline-none focus:border-marketing-primary transition-colors"
                                            placeholder="Your Production Company"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-white mb-2">
                                            Subject *
                                        </label>
                                        <select
                                            name="subject"
                                            value={formData.subject}
                                            onChange={handleChange}
                                            required
                                            className="w-full px-4 py-3 bg-marketing-background border border-marketing-border rounded-xl text-white focus:outline-none focus:border-marketing-primary transition-colors"
                                        >
                                            <option value="general">General Inquiry</option>
                                            <option value="support">Technical Support</option>
                                            <option value="sales">Sales & Pricing</option>
                                            <option value="enterprise">Enterprise Solutions</option>
                                            <option value="partnership">Partnership Opportunities</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-white mb-2">
                                            Message *
                                        </label>
                                        <textarea
                                            name="message"
                                            value={formData.message}
                                            onChange={handleChange}
                                            required
                                            rows={5}
                                            className="w-full px-4 py-3 bg-marketing-background border border-marketing-border rounded-xl text-white placeholder-marketing-text-secondary focus:outline-none focus:border-marketing-primary transition-colors resize-none"
                                            placeholder="How can we help you?"
                                        />
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="w-full py-4 bg-marketing-primary text-white font-bold rounded-xl hover:bg-marketing-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                    >
                                        {loading ? (
                                            <>
                                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                Sending...
                                            </>
                                        ) : (
                                            <>
                                                <Send size={18} />
                                                Send Message
                                            </>
                                        )}
                                    </button>
                                </form>
                            </>
                        )}
                    </div>
                </div>
            </section>

            {/* FAQ CTA */}
            <section className="py-16 bg-marketing-background">
                <div className="container mx-auto px-6 text-center">
                    <h2 className="text-2xl font-bold text-white mb-4">Looking for quick answers?</h2>
                    <p className="text-marketing-text-secondary mb-6">
                        Check out our help center for tutorials, documentation, and frequently asked questions.
                    </p>
                </div>
            </section>
        </Layout>
    );
}
