import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, ChevronDown, Check } from 'lucide-react';
import Logo from '../Logo';
// motion/AnimatePresence removed - using CSS transitions for mobile menu

export default function Navbar() {
    const [isScrolled, setIsScrolled] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const location = useLocation();

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 20);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    useEffect(() => {
        setMobileMenuOpen(false);
    }, [location]);

    const features = [
        { name: 'CRM', path: '/features/crm' },
        { name: 'Quoting', path: '/features/quoting' },
        { name: 'Projects', path: '/features/projects' },
        { name: 'Crew Database', path: '/features/crew' },
        { name: 'Equipment', path: '/features/equipment' },
        { name: 'Financials', path: '/features/financials' },
        { name: 'Call Sheets', path: '/features/call-sheets' },
        { name: 'Deliverables', path: '/features/deliverables' },
    ];

    return (
        <nav
            className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled ? 'bg-marketing-background/80 backdrop-blur-md border-b border-marketing-border' : 'bg-transparent py-4'
                }`}
        >
            <div className="container mx-auto px-6 md:px-12">
                <div className="flex items-center justify-between h-16">
                    {/* Logo */}
                    <Link to="/" className="flex items-center gap-2 group hover:opacity-80 transition-opacity">
                        <Logo className="h-8" />
                    </Link>

                    {/* Desktop Navigation */}
                    <div className="hidden md:flex items-center gap-8">
                        <div className="relative group">
                            <button className="flex items-center gap-1 text-sm font-medium text-marketing-text-secondary hover:text-marketing-text-primary transition-colors py-2">
                                Features
                                <ChevronDown size={14} />
                            </button>

                            {/* Dropdown */}
                            <div className="absolute top-full left-0 pt-2 w-64 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 transform translate-y-2 group-hover:translate-y-0">
                                <div className="bg-marketing-surface border border-marketing-border rounded-xl shadow-xl p-2 overflow-hidden">
                                    {features.map((feature) => (
                                        <Link
                                            key={feature.path}
                                            to={feature.path}
                                            className="block px-4 py-2 text-sm text-marketing-text-secondary hover:text-marketing-text-primary hover:bg-white/5 rounded-lg transition-colors"
                                        >
                                            {feature.name}
                                        </Link>
                                    ))}
                                    <div className="h-px bg-marketing-border my-2" />
                                    <Link
                                        to="/features"
                                        className="block px-4 py-2 text-sm font-medium text-marketing-primary hover:bg-marketing-primary/10 rounded-lg transition-colors"
                                    >
                                        View All Features
                                    </Link>
                                </div>
                            </div>
                        </div>

                        <Link to="/pricing" className="text-sm font-medium text-marketing-text-secondary hover:text-marketing-text-primary transition-colors">
                            Pricing
                        </Link>
                        <Link to="/resources/blog" className="text-sm font-medium text-marketing-text-secondary hover:text-marketing-text-primary transition-colors">
                            Blog
                        </Link>
                    </div>

                    {/* CTA Buttons */}
                    <div className="hidden md:flex items-center gap-4">
                        <Link to="/auth/login" className="text-sm font-medium text-marketing-text-primary hover:text-marketing-primary transition-colors">
                            Log in
                        </Link>
                        <Link
                            to="/auth/signup"
                            className="px-5 py-2.5 bg-gradient-to-r from-marketing-accent to-marketing-primary text-white text-sm font-bold rounded-lg hover:shadow-glow transition-all active:scale-95 transform duration-200"
                        >
                            Start free trial
                        </Link>
                    </div>

                    {/* Mobile Menu Button */}
                    <button
                        type="button"
                        className="md:hidden text-marketing-text-primary p-2 relative z-50"
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        aria-label="Toggle menu"
                    >
                        {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                    </button>
                </div>
            </div>

            {/* Mobile Menu - Simplified without framer-motion */}
            <div
                className={`md:hidden bg-marketing-background border-b border-marketing-border overflow-hidden transition-all duration-300 ease-in-out ${
                    mobileMenuOpen ? 'max-h-[80vh] opacity-100' : 'max-h-0 opacity-0'
                }`}
            >
                <div className="container mx-auto px-6 py-6 space-y-6">
                    <div className="space-y-4">
                        <div className="text-xs font-semibold text-marketing-text-secondary uppercase tracking-wider mb-2">Features</div>
                        {features.map((feature) => (
                            <Link
                                key={feature.path}
                                to={feature.path}
                                className="block text-marketing-text-primary py-1"
                                onClick={() => setMobileMenuOpen(false)}
                            >
                                {feature.name}
                            </Link>
                        ))}
                    </div>

                    <div className="h-px bg-marketing-border" />

                    <div className="space-y-4">
                        <Link to="/pricing" className="block text-marketing-text-primary font-medium" onClick={() => setMobileMenuOpen(false)}>Pricing</Link>
                        <Link to="/resources/blog" className="block text-marketing-text-primary font-medium" onClick={() => setMobileMenuOpen(false)}>Blog</Link>
                    </div>

                    <div className="pt-4 flex flex-col gap-4">
                        <Link to="/auth/login" className="w-full py-3 text-center text-marketing-text-primary font-medium border border-marketing-border rounded-lg" onClick={() => setMobileMenuOpen(false)}>
                            Log in
                        </Link>
                        <Link to="/auth/signup" className="w-full py-3 text-center bg-marketing-primary text-white font-bold rounded-lg" onClick={() => setMobileMenuOpen(false)}>
                            Start free trial
                        </Link>
                    </div>
                </div>
            </div>
        </nav>
    );
}
