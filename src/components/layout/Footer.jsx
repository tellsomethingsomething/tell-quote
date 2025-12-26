import React from 'react';
import { Link } from 'react-router-dom';
import { Clapperboard, Twitter, Linkedin, Youtube, Mail, ArrowRight } from 'lucide-react';

export default function Footer() {
    return (
        <footer className="bg-marketing-surface border-t border-marketing-border pt-16 pb-8">
            <div className="container mx-auto px-6 md:px-12">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-12 mb-16">

                    {/* Brand Column */}
                    <div className="lg:col-span-2">
                        <Link to="/" className="flex items-center gap-2 mb-6">
                            <div className="w-8 h-8 bg-gradient-to-tr from-marketing-primary to-marketing-accent rounded-lg flex items-center justify-center text-white font-bold text-lg">
                                P
                            </div>
                            <span className="text-xl font-bold text-marketing-text-primary tracking-tight">
                                Production<span className="text-marketing-primary">OS</span>
                            </span>
                        </Link>
                        <p className="text-marketing-text-secondary mb-8 max-w-sm">
                            The operating system for production companies. Quotes, projects, crew, and finances in one unified platform.
                        </p>
                        <div className="flex gap-4">
                            <a href="#" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-marketing-text-secondary hover:bg-marketing-primary hover:text-white transition-all">
                                <Twitter size={18} />
                            </a>
                            <a href="#" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-marketing-text-secondary hover:bg-marketing-primary hover:text-white transition-all">
                                <Linkedin size={18} />
                            </a>
                            <a href="#" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-marketing-text-secondary hover:bg-marketing-primary hover:text-white transition-all">
                                <Youtube size={18} />
                            </a>
                        </div>
                    </div>

                    {/* Links Columns */}
                    <div>
                        <h4 className="font-semibold text-marketing-text-primary mb-6">Product</h4>
                        <ul className="space-y-4 text-sm text-marketing-text-secondary">
                            <li><Link to="/features/crm" className="hover:text-marketing-primary transition-colors">Sales & CRM</Link></li>
                            <li><Link to="/features/quoting" className="hover:text-marketing-primary transition-colors">Quoting</Link></li>
                            <li><Link to="/features/projects" className="hover:text-marketing-primary transition-colors">Project Management</Link></li>
                            <li><Link to="/features/crew" className="hover:text-marketing-primary transition-colors">Crew Network</Link></li>
                            <li><Link to="/features/finance" className="hover:text-marketing-primary transition-colors">Finance & Invoicing</Link></li>
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
                        </ul>
                    </div>

                    <div>
                        <h4 className="font-semibold text-marketing-text-primary mb-6">Resources</h4>
                        <ul className="space-y-4 text-sm text-marketing-text-secondary">
                            <li><Link to="/resources/blog" className="hover:text-marketing-primary transition-colors">Blog</Link></li>
                            <li><Link to="/resources/templates" className="hover:text-marketing-primary transition-colors">Templates</Link></li>
                            <li><Link to="/company/contact" className="hover:text-marketing-primary transition-colors">Help Center</Link></li>
                            <li><Link to="/company/about" className="hover:text-marketing-primary transition-colors">About Us</Link></li>
                        </ul>
                    </div>

                    {/* Newsletter / Legal */}
                    <div>
                        <h4 className="font-semibold text-marketing-text-primary mb-6">Stay Updated</h4>
                        <p className="text-xs text-marketing-text-secondary mb-4">Product updates and production tips. No spam.</p>
                        <div className="flex gap-2">
                            <input
                                type="email"
                                placeholder="Email"
                                className="bg-marketing-background border border-marketing-border rounded-lg px-3 py-2 text-sm text-marketing-text-primary w-full focus:outline-none focus:border-marketing-primary transition-colors"
                            />
                            <button className="bg-marketing-primary text-white rounded-lg px-3 py-2 hover:bg-marketing-primary/90 transition-colors">
                                <ArrowRight size={16} />
                            </button>
                        </div>

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
