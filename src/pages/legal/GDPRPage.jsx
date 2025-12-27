import React from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { Shield, Download, Trash2, Edit, Eye, Lock, Globe } from 'lucide-react';
import Layout from '../../components/layout/Layout';

export default function GDPRPage() {
    return (
        <Layout>
            <Helmet>
                <title>GDPR Compliance - ProductionOS</title>
                <meta name="description" content="ProductionOS GDPR compliance information. Learn about your data protection rights under the General Data Protection Regulation." />
            </Helmet>

            <div className="pt-32 pb-20 container mx-auto px-6 md:px-12 max-w-4xl">
                <h1 className="text-4xl font-bold mb-4">GDPR Compliance</h1>
                <p className="text-marketing-text-secondary mb-12">How ProductionOS complies with the General Data Protection Regulation</p>

                {/* Overview */}
                <div className="bg-marketing-surface border border-marketing-border rounded-xl p-8 mb-12">
                    <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-marketing-primary/10 rounded-lg flex items-center justify-center shrink-0">
                            <Shield className="text-marketing-primary" size={24} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold mb-2 text-marketing-text-primary">Our Commitment to GDPR</h2>
                            <p className="text-marketing-text-secondary leading-relaxed">
                                ProductionOS is committed to protecting your personal data and respecting your privacy rights under the General Data Protection Regulation (GDPR). We act as a data controller for account and billing data, and as a data processor for the business data you store within the platform.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Your Rights */}
                <section className="mb-12">
                    <h2 className="text-2xl font-bold mb-6 text-marketing-text-primary">Your GDPR Rights</h2>
                    <div className="grid md:grid-cols-2 gap-6">
                        {[
                            {
                                icon: Eye,
                                title: "Right to Access",
                                desc: "Request a copy of all personal data we hold about you. We will provide this within 30 days."
                            },
                            {
                                icon: Edit,
                                title: "Right to Rectification",
                                desc: "Correct any inaccurate or incomplete personal data. You can update most data directly in Settings."
                            },
                            {
                                icon: Trash2,
                                title: "Right to Erasure",
                                desc: "Request deletion of your personal data. We will delete your data within 30 days of account closure."
                            },
                            {
                                icon: Download,
                                title: "Right to Portability",
                                desc: "Export your data in a machine-readable format (JSON/CSV). Available in Settings > Data Export."
                            },
                            {
                                icon: Lock,
                                title: "Right to Restriction",
                                desc: "Limit how we process your data in certain circumstances while disputes are resolved."
                            },
                            {
                                icon: Globe,
                                title: "Right to Object",
                                desc: "Object to processing for direct marketing or based on legitimate interests."
                            }
                        ].map((right, i) => (
                            <div key={i} className="bg-marketing-surface border border-marketing-border rounded-lg p-6">
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="w-10 h-10 bg-marketing-primary/10 rounded-lg flex items-center justify-center">
                                        <right.icon className="text-marketing-primary" size={20} />
                                    </div>
                                    <h3 className="font-bold text-marketing-text-primary">{right.title}</h3>
                                </div>
                                <p className="text-marketing-text-secondary text-sm leading-relaxed">{right.desc}</p>
                            </div>
                        ))}
                    </div>
                </section>

                {/* How to Exercise Rights */}
                <section className="mb-12">
                    <h2 className="text-2xl font-bold mb-6 text-marketing-text-primary">How to Exercise Your Rights</h2>
                    <div className="bg-marketing-surface border border-marketing-border rounded-xl p-8">
                        <ol className="space-y-6">
                            <li className="flex gap-4">
                                <span className="w-8 h-8 bg-marketing-primary text-white rounded-full flex items-center justify-center font-bold shrink-0">1</span>
                                <div>
                                    <h3 className="font-bold mb-1 text-marketing-text-primary">Self-Service Options</h3>
                                    <p className="text-marketing-text-secondary text-sm">Many rights can be exercised directly in the app. Go to <strong>Settings &gt; Privacy & Data</strong> to export your data, update your information, or delete your account.</p>
                                </div>
                            </li>
                            <li className="flex gap-4">
                                <span className="w-8 h-8 bg-marketing-primary text-white rounded-full flex items-center justify-center font-bold shrink-0">2</span>
                                <div>
                                    <h3 className="font-bold mb-1 text-marketing-text-primary">Contact Our DPO</h3>
                                    <p className="text-marketing-text-secondary text-sm">For complex requests or questions, contact our Data Protection Officer at <a href="mailto:dpo@productionos.com" className="text-marketing-primary hover:underline">dpo@productionos.com</a>.</p>
                                </div>
                            </li>
                            <li className="flex gap-4">
                                <span className="w-8 h-8 bg-marketing-primary text-white rounded-full flex items-center justify-center font-bold shrink-0">3</span>
                                <div>
                                    <h3 className="font-bold mb-1 text-marketing-text-primary">Response Time</h3>
                                    <p className="text-marketing-text-secondary text-sm">We will respond to all GDPR requests within 30 days. Complex requests may take up to 60 days with prior notice.</p>
                                </div>
                            </li>
                        </ol>
                    </div>
                </section>

                {/* Data Processing */}
                <section className="mb-12">
                    <h2 className="text-2xl font-bold mb-6 text-marketing-text-primary">Lawful Basis for Processing</h2>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-marketing-surface">
                                    <th className="p-4 border-b border-marketing-border font-bold text-marketing-text-primary">Data Type</th>
                                    <th className="p-4 border-b border-marketing-border font-bold text-marketing-text-primary">Lawful Basis</th>
                                    <th className="p-4 border-b border-marketing-border font-bold text-marketing-text-primary">Purpose</th>
                                </tr>
                            </thead>
                            <tbody className="text-marketing-text-secondary">
                                <tr className="border-b border-marketing-border/50">
                                    <td className="p-4">Account data (name, email)</td>
                                    <td className="p-4">Contract</td>
                                    <td className="p-4">Account creation and management</td>
                                </tr>
                                <tr className="border-b border-marketing-border/50">
                                    <td className="p-4">Billing information</td>
                                    <td className="p-4">Contract / Legal</td>
                                    <td className="p-4">Payment processing, invoicing</td>
                                </tr>
                                <tr className="border-b border-marketing-border/50">
                                    <td className="p-4">Business data (projects, clients)</td>
                                    <td className="p-4">Contract</td>
                                    <td className="p-4">Providing the Service</td>
                                </tr>
                                <tr className="border-b border-marketing-border/50">
                                    <td className="p-4">Usage analytics</td>
                                    <td className="p-4">Legitimate Interest</td>
                                    <td className="p-4">Product improvement</td>
                                </tr>
                                <tr className="border-b border-marketing-border/50">
                                    <td className="p-4">Marketing communications</td>
                                    <td className="p-4">Consent</td>
                                    <td className="p-4">Product updates, newsletters</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </section>

                {/* Sub-processors */}
                <section className="mb-12">
                    <h2 className="text-2xl font-bold mb-6 text-marketing-text-primary">Sub-Processors</h2>
                    <p className="text-marketing-text-secondary mb-6">We use the following third-party service providers to process data on our behalf:</p>
                    <div className="space-y-4">
                        {[
                            { name: "Supabase (AWS)", location: "US/EU", purpose: "Database hosting and authentication" },
                            { name: "Stripe", location: "US", purpose: "Payment processing" },
                            { name: "Vercel", location: "US/EU", purpose: "Application hosting and CDN" },
                            { name: "Google Cloud", location: "EU", purpose: "Email integration (if connected)" }
                        ].map((processor, i) => (
                            <div key={i} className="flex items-center justify-between p-4 bg-marketing-surface border border-marketing-border rounded-lg">
                                <div>
                                    <span className="font-bold text-marketing-text-primary">{processor.name}</span>
                                    <span className="text-marketing-text-secondary text-sm ml-2">({processor.location})</span>
                                </div>
                                <span className="text-marketing-text-secondary text-sm">{processor.purpose}</span>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Data Transfers */}
                <section className="mb-12">
                    <h2 className="text-2xl font-bold mb-6 text-marketing-text-primary">International Data Transfers</h2>
                    <p className="text-marketing-text-secondary leading-relaxed mb-4">
                        When we transfer personal data outside the European Economic Area (EEA), we ensure appropriate safeguards are in place:
                    </p>
                    <ul className="list-disc pl-6 text-marketing-text-secondary space-y-2">
                        <li>Standard Contractual Clauses (SCCs) approved by the European Commission</li>
                        <li>Data Processing Agreements with all sub-processors</li>
                        <li>Technical measures including encryption in transit and at rest</li>
                        <li>Regular review of sub-processor compliance</li>
                    </ul>
                </section>

                {/* Contact */}
                <section className="bg-marketing-primary/5 border border-marketing-primary/20 rounded-xl p-8">
                    <h2 className="text-2xl font-bold mb-4 text-marketing-text-primary">Questions or Complaints?</h2>
                    <p className="text-marketing-text-secondary leading-relaxed mb-4">
                        If you have questions about GDPR compliance or wish to make a complaint, you can:
                    </p>
                    <ul className="list-disc pl-6 text-marketing-text-secondary space-y-2 mb-6">
                        <li>Contact our Data Protection Officer: <a href="mailto:dpo@productionos.com" className="text-marketing-primary hover:underline">dpo@productionos.com</a></li>
                        <li>Lodge a complaint with your local Data Protection Authority</li>
                    </ul>
                    <Link to="/legal/privacy" className="inline-block px-6 py-3 bg-marketing-primary text-white font-bold rounded-lg hover:bg-marketing-primary/90 transition-colors">
                        Read Full Privacy Policy
                    </Link>
                </section>
            </div>
        </Layout>
    );
}
