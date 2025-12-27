import React from 'react';
import { Helmet } from 'react-helmet-async';
import Layout from '../../components/layout/Layout';

export default function PrivacyPage() {
    return (
        <Layout>
            <Helmet>
                <title>Privacy Policy - ProductionOS</title>
                <meta name="description" content="ProductionOS Privacy Policy. Learn how we collect, use, and protect your personal information." />
            </Helmet>

            <div className="pt-32 pb-20 container mx-auto px-6 md:px-12 max-w-4xl">
                <h1 className="text-4xl font-bold mb-4">Privacy Policy</h1>
                <p className="text-marketing-text-secondary mb-12">Last updated: December 27, 2025</p>

                <div className="prose prose-invert prose-lg max-w-none space-y-8">
                    <section>
                        <h2 className="text-2xl font-bold mb-4 text-marketing-text-primary">1. Introduction</h2>
                        <p className="text-marketing-text-secondary leading-relaxed">
                            ProductionOS ("we", "our", or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our cloud-based production management platform ("Service"). Please read this policy carefully.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold mb-4 text-marketing-text-primary">2. Information We Collect</h2>

                        <h3 className="text-xl font-semibold mb-3 text-marketing-text-primary">2.1 Information You Provide</h3>
                        <ul className="list-disc pl-6 text-marketing-text-secondary space-y-2 mb-4">
                            <li><strong>Account Information:</strong> Name, email address, password, company name, job title</li>
                            <li><strong>Billing Information:</strong> Payment card details (processed securely via Stripe), billing address</li>
                            <li><strong>Business Data:</strong> Client information, project details, quotes, invoices, crew information, equipment records, and other data you enter into the Service</li>
                            <li><strong>Communications:</strong> Emails, support tickets, and feedback you send to us</li>
                        </ul>

                        <h3 className="text-xl font-semibold mb-3 text-marketing-text-primary">2.2 Information Collected Automatically</h3>
                        <ul className="list-disc pl-6 text-marketing-text-secondary space-y-2 mb-4">
                            <li><strong>Usage Data:</strong> Features used, actions taken, time spent, pages visited</li>
                            <li><strong>Device Information:</strong> Browser type, operating system, device type, IP address</li>
                            <li><strong>Cookies:</strong> Session cookies, preference cookies, and analytics cookies (see Section 7)</li>
                        </ul>

                        <h3 className="text-xl font-semibold mb-3 text-marketing-text-primary">2.3 Third-Party Integrations</h3>
                        <p className="text-marketing-text-secondary leading-relaxed">
                            If you connect third-party services (e.g., Google Calendar, accounting software), we may receive information from those services as authorized by you.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold mb-4 text-marketing-text-primary">3. How We Use Your Information</h2>
                        <p className="text-marketing-text-secondary leading-relaxed mb-4">We use the information we collect to:</p>
                        <ul className="list-disc pl-6 text-marketing-text-secondary space-y-2">
                            <li>Provide, maintain, and improve the Service</li>
                            <li>Process transactions and send related information</li>
                            <li>Send administrative notifications, updates, and security alerts</li>
                            <li>Respond to your comments, questions, and support requests</li>
                            <li>Analyze usage patterns to improve user experience</li>
                            <li>Detect, prevent, and address technical issues and security threats</li>
                            <li>Comply with legal obligations</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold mb-4 text-marketing-text-primary">4. Data Sharing and Disclosure</h2>
                        <p className="text-marketing-text-secondary leading-relaxed mb-4">We do not sell your personal information. We may share your information in the following circumstances:</p>
                        <ul className="list-disc pl-6 text-marketing-text-secondary space-y-2">
                            <li><strong>Service Providers:</strong> With trusted third-party vendors who assist us in operating the Service (e.g., payment processing, hosting, analytics)</li>
                            <li><strong>Legal Requirements:</strong> When required by law or to protect our rights and safety</li>
                            <li><strong>Business Transfers:</strong> In connection with a merger, acquisition, or sale of assets</li>
                            <li><strong>With Your Consent:</strong> When you have given us explicit permission</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold mb-4 text-marketing-text-primary">5. Data Security</h2>
                        <p className="text-marketing-text-secondary leading-relaxed mb-4">
                            We implement industry-standard security measures to protect your data, including:
                        </p>
                        <ul className="list-disc pl-6 text-marketing-text-secondary space-y-2">
                            <li>Encryption of data in transit (TLS 1.3) and at rest (AES-256)</li>
                            <li>Secure authentication with bcrypt password hashing</li>
                            <li>Regular security audits and vulnerability assessments</li>
                            <li>Access controls and role-based permissions</li>
                            <li>Secure data centers with SOC 2 compliance (via Supabase/AWS)</li>
                        </ul>
                        <p className="text-marketing-text-secondary leading-relaxed mt-4">
                            While we strive to protect your information, no method of transmission over the internet is 100% secure. We cannot guarantee absolute security.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold mb-4 text-marketing-text-primary">6. Data Retention</h2>
                        <p className="text-marketing-text-secondary leading-relaxed">
                            We retain your information for as long as your account is active or as needed to provide services. After account termination, we retain Your Data for 30 days before permanent deletion. We may retain certain information as required by law or for legitimate business purposes.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold mb-4 text-marketing-text-primary">7. Cookies and Tracking</h2>
                        <p className="text-marketing-text-secondary leading-relaxed mb-4">We use the following types of cookies:</p>
                        <ul className="list-disc pl-6 text-marketing-text-secondary space-y-2">
                            <li><strong>Essential Cookies:</strong> Required for the Service to function (authentication, security)</li>
                            <li><strong>Preference Cookies:</strong> Remember your settings and preferences</li>
                            <li><strong>Analytics Cookies:</strong> Help us understand how you use the Service</li>
                        </ul>
                        <p className="text-marketing-text-secondary leading-relaxed mt-4">
                            You can manage cookie preferences through your browser settings. Disabling certain cookies may affect Service functionality.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold mb-4 text-marketing-text-primary">8. Your Rights</h2>
                        <p className="text-marketing-text-secondary leading-relaxed mb-4">Depending on your location, you may have the following rights:</p>
                        <ul className="list-disc pl-6 text-marketing-text-secondary space-y-2">
                            <li><strong>Access:</strong> Request a copy of your personal data</li>
                            <li><strong>Rectification:</strong> Correct inaccurate or incomplete data</li>
                            <li><strong>Erasure:</strong> Request deletion of your personal data</li>
                            <li><strong>Portability:</strong> Export your data in a machine-readable format</li>
                            <li><strong>Restriction:</strong> Limit how we process your data</li>
                            <li><strong>Objection:</strong> Object to certain types of processing</li>
                            <li><strong>Withdraw Consent:</strong> Where processing is based on consent</li>
                        </ul>
                        <p className="text-marketing-text-secondary leading-relaxed mt-4">
                            To exercise these rights, contact us at <a href="mailto:privacy@productionos.com" className="text-marketing-primary hover:underline">privacy@productionos.com</a> or use the data export feature in Settings.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold mb-4 text-marketing-text-primary">9. International Data Transfers</h2>
                        <p className="text-marketing-text-secondary leading-relaxed">
                            Your information may be transferred to and processed in countries other than your country of residence. We ensure appropriate safeguards are in place for such transfers in accordance with applicable data protection laws, including Standard Contractual Clauses where required.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold mb-4 text-marketing-text-primary">10. Children's Privacy</h2>
                        <p className="text-marketing-text-secondary leading-relaxed">
                            The Service is not intended for individuals under the age of 18. We do not knowingly collect personal information from children. If you believe we have collected information from a child, please contact us immediately.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold mb-4 text-marketing-text-primary">11. Changes to This Policy</h2>
                        <p className="text-marketing-text-secondary leading-relaxed">
                            We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new policy on this page and updating the "Last updated" date. For material changes, we will provide additional notice via email or through the Service.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold mb-4 text-marketing-text-primary">12. Contact Us</h2>
                        <p className="text-marketing-text-secondary leading-relaxed">
                            If you have questions about this Privacy Policy or our privacy practices, please contact us at:
                        </p>
                        <div className="mt-4 p-4 bg-marketing-surface border border-marketing-border rounded-lg">
                            <p className="text-marketing-text-secondary">
                                <strong className="text-marketing-text-primary">Email:</strong> <a href="mailto:privacy@productionos.com" className="text-marketing-primary hover:underline">privacy@productionos.com</a><br />
                                <strong className="text-marketing-text-primary">Data Protection Officer:</strong> <a href="mailto:dpo@productionos.com" className="text-marketing-primary hover:underline">dpo@productionos.com</a>
                            </p>
                        </div>
                    </section>
                </div>
            </div>
        </Layout>
    );
}
