import React from 'react';
import { Helmet } from 'react-helmet-async';
import Layout from '../../components/layout/Layout';

export default function TermsPage() {
    return (
        <Layout>
            <Helmet>
                <title>Terms of Service - ProductionOS</title>
                <meta name="description" content="ProductionOS Terms of Service. Read our terms and conditions for using the ProductionOS platform." />
            </Helmet>

            <div className="pt-32 pb-20 container mx-auto px-6 md:px-12 max-w-4xl">
                <h1 className="text-4xl font-bold mb-4">Terms of Service</h1>
                <p className="text-marketing-text-secondary mb-12">Last updated: December 27, 2025</p>

                <div className="prose prose-invert prose-lg max-w-none space-y-8">
                    <section>
                        <h2 className="text-2xl font-bold mb-4 text-marketing-text-primary">1. Acceptance of Terms</h2>
                        <p className="text-marketing-text-secondary leading-relaxed">
                            By accessing or using ProductionOS ("Service"), you agree to be bound by these Terms of Service ("Terms"). If you do not agree to these Terms, you may not use the Service. These Terms apply to all users of the Service, including without limitation users who are browsers, vendors, customers, merchants, and/or contributors of content.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold mb-4 text-marketing-text-primary">2. Description of Service</h2>
                        <p className="text-marketing-text-secondary leading-relaxed">
                            ProductionOS is a cloud-based software platform that provides production management tools including but not limited to: quoting and proposal generation, project management, client relationship management, crew and resource scheduling, equipment tracking, financial reporting, and document generation.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold mb-4 text-marketing-text-primary">3. Account Registration</h2>
                        <p className="text-marketing-text-secondary leading-relaxed mb-4">
                            To use the Service, you must create an account. You agree to:
                        </p>
                        <ul className="list-disc pl-6 text-marketing-text-secondary space-y-2">
                            <li>Provide accurate, current, and complete information during registration</li>
                            <li>Maintain and promptly update your account information</li>
                            <li>Maintain the security of your password and account</li>
                            <li>Accept responsibility for all activities that occur under your account</li>
                            <li>Notify us immediately of any unauthorized use of your account</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold mb-4 text-marketing-text-primary">4. Subscription and Payment</h2>
                        <p className="text-marketing-text-secondary leading-relaxed mb-4">
                            <strong className="text-marketing-text-primary">4.1 Free Trial.</strong> We may offer a free trial period. At the end of the trial, your subscription will begin unless you cancel before the trial ends.
                        </p>
                        <p className="text-marketing-text-secondary leading-relaxed mb-4">
                            <strong className="text-marketing-text-primary">4.2 Subscription Plans.</strong> We offer various subscription plans with different features and pricing. Current pricing is available on our website.
                        </p>
                        <p className="text-marketing-text-secondary leading-relaxed mb-4">
                            <strong className="text-marketing-text-primary">4.3 Billing.</strong> Subscription fees are billed in advance on a monthly or annual basis depending on the plan selected. All fees are non-refundable except as expressly set forth herein.
                        </p>
                        <p className="text-marketing-text-secondary leading-relaxed">
                            <strong className="text-marketing-text-primary">4.4 Cancellation.</strong> You may cancel your subscription at any time. Upon cancellation, your access will continue until the end of your current billing period.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold mb-4 text-marketing-text-primary">5. Your Data</h2>
                        <p className="text-marketing-text-secondary leading-relaxed mb-4">
                            <strong className="text-marketing-text-primary">5.1 Ownership.</strong> You retain all rights to any data, content, or materials you submit to the Service ("Your Data"). We do not claim ownership of Your Data.
                        </p>
                        <p className="text-marketing-text-secondary leading-relaxed mb-4">
                            <strong className="text-marketing-text-primary">5.2 License.</strong> You grant us a limited license to use, store, and process Your Data solely to provide the Service to you.
                        </p>
                        <p className="text-marketing-text-secondary leading-relaxed">
                            <strong className="text-marketing-text-primary">5.3 Data Export.</strong> You may export Your Data at any time through the Service's export functionality. Upon account termination, we will retain Your Data for 30 days, after which it may be deleted.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold mb-4 text-marketing-text-primary">6. Acceptable Use</h2>
                        <p className="text-marketing-text-secondary leading-relaxed mb-4">You agree not to:</p>
                        <ul className="list-disc pl-6 text-marketing-text-secondary space-y-2">
                            <li>Use the Service for any illegal purpose or in violation of any laws</li>
                            <li>Attempt to gain unauthorized access to any systems or networks</li>
                            <li>Interfere with or disrupt the integrity or performance of the Service</li>
                            <li>Transmit any viruses, malware, or other malicious code</li>
                            <li>Use the Service to infringe on intellectual property rights of others</li>
                            <li>Resell or redistribute the Service without our written consent</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold mb-4 text-marketing-text-primary">7. Intellectual Property</h2>
                        <p className="text-marketing-text-secondary leading-relaxed">
                            The Service and its original content (excluding Your Data), features, and functionality are and will remain the exclusive property of ProductionOS and its licensors. The Service is protected by copyright, trademark, and other laws. Our trademarks and trade dress may not be used in connection with any product or service without our prior written consent.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold mb-4 text-marketing-text-primary">8. Limitation of Liability</h2>
                        <p className="text-marketing-text-secondary leading-relaxed">
                            TO THE MAXIMUM EXTENT PERMITTED BY LAW, PRODUCTIONOS SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS OR REVENUES, WHETHER INCURRED DIRECTLY OR INDIRECTLY, OR ANY LOSS OF DATA, USE, GOODWILL, OR OTHER INTANGIBLE LOSSES, RESULTING FROM (A) YOUR ACCESS TO OR USE OF OR INABILITY TO ACCESS OR USE THE SERVICE; (B) ANY CONDUCT OR CONTENT OF ANY THIRD PARTY ON THE SERVICE; (C) ANY CONTENT OBTAINED FROM THE SERVICE; OR (D) UNAUTHORIZED ACCESS, USE, OR ALTERATION OF YOUR TRANSMISSIONS OR CONTENT.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold mb-4 text-marketing-text-primary">9. Disclaimer of Warranties</h2>
                        <p className="text-marketing-text-secondary leading-relaxed">
                            THE SERVICE IS PROVIDED ON AN "AS IS" AND "AS AVAILABLE" BASIS, WITHOUT ANY WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, NON-INFRINGEMENT, OR COURSE OF PERFORMANCE.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold mb-4 text-marketing-text-primary">10. Indemnification</h2>
                        <p className="text-marketing-text-secondary leading-relaxed">
                            You agree to defend, indemnify, and hold harmless ProductionOS and its officers, directors, employees, contractors, agents, licensors, and suppliers from and against any claims, liabilities, damages, judgments, awards, losses, costs, expenses, or fees (including reasonable attorneys' fees) arising out of or relating to your violation of these Terms or your use of the Service.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold mb-4 text-marketing-text-primary">11. Changes to Terms</h2>
                        <p className="text-marketing-text-secondary leading-relaxed">
                            We reserve the right to modify or replace these Terms at any time. If a revision is material, we will provide at least 30 days' notice prior to any new terms taking effect. What constitutes a material change will be determined at our sole discretion. By continuing to access or use our Service after those revisions become effective, you agree to be bound by the revised terms.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold mb-4 text-marketing-text-primary">12. Governing Law</h2>
                        <p className="text-marketing-text-secondary leading-relaxed">
                            These Terms shall be governed and construed in accordance with the laws of the jurisdiction in which ProductionOS operates, without regard to its conflict of law provisions. Any disputes arising from these Terms or your use of the Service shall be resolved through binding arbitration in accordance with the applicable arbitration rules.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold mb-4 text-marketing-text-primary">13. Contact Us</h2>
                        <p className="text-marketing-text-secondary leading-relaxed">
                            If you have any questions about these Terms, please contact us at <a href="mailto:legal@productionos.com" className="text-marketing-primary hover:underline">legal@productionos.com</a>.
                        </p>
                    </section>
                </div>
            </div>
        </Layout>
    );
}
