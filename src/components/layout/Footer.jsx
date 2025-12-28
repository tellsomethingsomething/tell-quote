import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Check, Loader2 } from 'lucide-react';

export default function Footer() {
    const [email, setEmail] = useState('');
    const [status, setStatus] = useState('idle'); // idle, loading, success, error
    const [errorMessage, setErrorMessage] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Basic validation
        if (!email || !email.includes('@')) {
            setStatus('error');
            setErrorMessage('Please enter a valid email');
            return;
        }

        setStatus('loading');

        // Simulate API call - replace with actual newsletter service
        try {
            await new Promise(resolve => setTimeout(resolve, 800));
            setStatus('success');
            setEmail('');
            // Reset after 3 seconds
            setTimeout(() => setStatus('idle'), 3000);
        } catch {
            setStatus('error');
            setErrorMessage('Something went wrong. Try again.');
        }
    };

    return (
        <footer className="bg-marketing-surface border-t border-marketing-border pt-16 pb-8">
            <div className="container mx-auto px-6 md:px-12">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-12 mb-16">

                    {/* Brand Column */}
                    <div className="lg:col-span-2">
                        <Link to="/" className="flex items-center gap-2 mb-6">
                            <div className="w-8 h-8 bg-gradient-to-br from-marketing-accent to-marketing-primary rounded-[10px] flex items-center justify-center text-white font-bold text-lg">
                                P
                            </div>
                            <span className="text-xl font-bold text-marketing-text-primary tracking-tight">
                                Production<span className="text-marketing-primary">OS</span>
                            </span>
                        </Link>
                        <p className="text-marketing-text-secondary mb-8 max-w-sm">
                            The operating system for production companies. Quotes, projects, crew, and finances in one unified platform.
                        </p>
                    </div>

                    {/* Links Columns */}
                    <div>
                        <h4 className="font-semibold text-marketing-text-primary mb-6">Features</h4>
                        <ul className="space-y-4 text-sm text-marketing-text-secondary">
                            <li><Link to="/features/quoting" className="hover:text-marketing-primary transition-colors">Quoting & Proposals</Link></li>
                            <li><Link to="/features/projects" className="hover:text-marketing-primary transition-colors">Project Management</Link></li>
                            <li><Link to="/features/financials" className="hover:text-marketing-primary transition-colors">Finance & Invoicing</Link></li>
                            <li><Link to="/features/crew" className="hover:text-marketing-primary transition-colors">Crew Network</Link></li>
                            <li><Link to="/features/equipment" className="hover:text-marketing-primary transition-colors">Equipment Tracking</Link></li>
                            <li><Link to="/features/call-sheets" className="hover:text-marketing-primary transition-colors">Call Sheets</Link></li>
                            <li><Link to="/features/deliverables" className="hover:text-marketing-primary transition-colors">Deliverables</Link></li>
                            <li><Link to="/features/crm" className="hover:text-marketing-primary transition-colors">CRM</Link></li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="font-semibold text-marketing-text-primary mb-6">Use Cases</h4>
                        <ul className="space-y-4 text-sm text-marketing-text-secondary">
                            <li><Link to="/use-cases/video-production" className="hover:text-marketing-primary transition-colors">Video Production</Link></li>
                            <li><Link to="/use-cases/event-production" className="hover:text-marketing-primary transition-colors">Event Production</Link></li>
                            <li><Link to="/use-cases/photography" className="hover:text-marketing-primary transition-colors">Photography</Link></li>
                            <li><Link to="/use-cases/live-streaming" className="hover:text-marketing-primary transition-colors">Live Streaming</Link></li>
                            <li><Link to="/use-cases/corporate-video" className="hover:text-marketing-primary transition-colors">Corporate Video</Link></li>
                            <li><Link to="/use-cases/post-production" className="hover:text-marketing-primary transition-colors">Post Production</Link></li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="font-semibold text-marketing-text-primary mb-6">Resources</h4>
                        <ul className="space-y-4 text-sm text-marketing-text-secondary">
                            <li><Link to="/resources/blog" className="hover:text-marketing-primary transition-colors">Blog</Link></li>
                            <li><Link to="/help" className="hover:text-marketing-primary transition-colors">Help Center</Link></li>
                            <li><Link to="/company/about" className="hover:text-marketing-primary transition-colors">About Us</Link></li>
                            <li><Link to="/company/contact" className="hover:text-marketing-primary transition-colors">Contact</Link></li>
                        </ul>

                        <h4 className="font-semibold text-marketing-text-primary mb-4 mt-8">Compare</h4>
                        <ul className="space-y-3 text-sm text-marketing-text-secondary">
                            <li><Link to="/resources/blog/productionos-vs-rentman" className="hover:text-marketing-primary transition-colors">vs Rentman</Link></li>
                            <li><Link to="/resources/blog/productionos-vs-currentrms" className="hover:text-marketing-primary transition-colors">vs Current RMS</Link></li>
                            <li><Link to="/resources/blog/productionos-vs-studiobinder" className="hover:text-marketing-primary transition-colors">vs StudioBinder</Link></li>
                            <li><Link to="/resources/blog/productionos-vs-monday" className="hover:text-marketing-primary transition-colors">vs Monday.com</Link></li>
                        </ul>
                    </div>

                    {/* Newsletter / Legal */}
                    <div>
                        <h4 className="font-semibold text-marketing-text-primary mb-6">Stay Updated</h4>
                        <p className="text-xs text-marketing-text-secondary mb-4">Product updates and production tips. No spam.</p>

                        <form onSubmit={handleSubmit} className="space-y-2">
                            <div className="flex items-center gap-2">
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => {
                                        setEmail(e.target.value);
                                        if (status === 'error') setStatus('idle');
                                    }}
                                    placeholder="Email"
                                    disabled={status === 'loading' || status === 'success'}
                                    className="bg-marketing-background border border-marketing-border rounded-lg px-3 py-2 text-sm text-marketing-text-primary w-full focus:outline-none focus:border-marketing-primary transition-colors disabled:opacity-50"
                                />
                                <button
                                    type="submit"
                                    disabled={status === 'loading' || status === 'success'}
                                    className="bg-marketing-primary text-white rounded-lg px-3 py-2 hover:bg-marketing-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center min-w-[40px]"
                                >
                                    {status === 'loading' ? (
                                        <Loader2 size={16} className="animate-spin" />
                                    ) : status === 'success' ? (
                                        <Check size={16} />
                                    ) : (
                                        <ArrowRight size={16} />
                                    )}
                                </button>
                            </div>
                            {status === 'error' && (
                                <p className="text-red-400 text-xs">{errorMessage}</p>
                            )}
                            {status === 'success' && (
                                <p className="text-green-400 text-xs">Thanks! You're subscribed.</p>
                            )}
                        </form>

                        <div className="mt-8">
                            <h4 className="font-semibold text-marketing-text-primary mb-4">Legal</h4>
                            <ul className="space-y-2 text-sm text-marketing-text-secondary">
                                <li><Link to="/legal/terms" className="hover:text-marketing-primary transition-colors">Terms of Service</Link></li>
                                <li><Link to="/legal/privacy" className="hover:text-marketing-primary transition-colors">Privacy Policy</Link></li>
                                <li><Link to="/legal/gdpr" className="hover:text-marketing-primary transition-colors">GDPR</Link></li>
                            </ul>
                        </div>
                    </div>

                </div>

                {/* Bottom Bar */}
                <div className="border-t border-marketing-border pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
                    <p className="text-marketing-text-secondary text-sm">
                        © 2025 ProductionOS. All rights reserved.
                    </p>
                    <p className="text-marketing-text-secondary text-sm flex items-center gap-1">
                        Made for production companies, by production people.
                    </p>
                </div>
            </div>
        </footer>
    );
}
