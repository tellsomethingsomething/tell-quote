import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import {
    ArrowRight,
    Play,
    Check,
    Menu,
    X,
    Zap,
    Layout,
    Globe,
    Shield,
    Smartphone,
    ChevronRight
} from 'lucide-react';

export default function LandingPage({ onLogin }) {
    const [scrolled, setScrolled] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [activeFeature, setActiveFeature] = useState(0);

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 50);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const features = [
        { title: "Crew & Logistics", desc: "Automated booking, rates, and call sheets.", icon: <UsersIcon /> },
        { title: "Asset Tracking", desc: "Real-time kit availability and maintenance.", icon: <BoxIcon /> },
        { title: "Financials", desc: "Live margin analysis and budget tracking.", icon: <ChartIcon /> },
        { title: "Documents", desc: "Generate PDFs, schedules, and agreements.", icon: <FileIcon /> },
    ];

    return (
        <div className="min-h-screen bg-[#050507] text-white selection:bg-[#FF3366] selection:text-white font-sans overflow-x-hidden">
            <Helmet>
                <title>ProductionOS - Production Management Software for Creative Teams</title>
                <meta name="description" content="Streamline your production workflow with ProductionOS. Manage quotes, crews, equipment, and projects in one place. Built for video, film, and live event production companies." />
                <meta name="keywords" content="production management, video production software, film production, crew management, quote software, production company, event production" />

                {/* Open Graph / Facebook */}
                <meta property="og:type" content="website" />
                <meta property="og:url" content="https://productionos.com/" />
                <meta property="og:title" content="ProductionOS - Production Management Software" />
                <meta property="og:description" content="Streamline your production workflow. Manage quotes, crews, equipment, and projects in one place." />
                <meta property="og:image" content="https://productionos.com/og-image.png" />

                {/* Twitter */}
                <meta name="twitter:card" content="summary_large_image" />
                <meta name="twitter:url" content="https://productionos.com/" />
                <meta name="twitter:title" content="ProductionOS - Production Management Software" />
                <meta name="twitter:description" content="Streamline your production workflow. Manage quotes, crews, equipment, and projects in one place." />
                <meta name="twitter:image" content="https://productionos.com/og-image.png" />

                {/* Additional SEO */}
                <link rel="canonical" href="https://productionos.com/" />
                <meta name="robots" content="index, follow" />
                <meta name="author" content="ProductionOS" />
            </Helmet>

            {/* Dynamic Background */}
            <div className="fixed inset-0 z-0 pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-purple-900/10 blur-[120px]" />
                <div className="absolute top-[20%] right-[-10%] w-[30%] h-[50%] rounded-full bg-blue-900/10 blur-[120px]" />
                <div className="absolute bottom-[-10%] left-[20%] w-[50%] h-[30%] rounded-full bg-[#FF3366]/5 blur-[120px]" />
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150 mix-blend-overlay" />
            </div>

            {/* Navigation */}
            <nav className={`fixed top-0 w-full z-50 transition-all duration-500 border-b border-white/[0.05] ${scrolled ? 'bg-[#050507]/80 backdrop-blur-xl py-4' : 'bg-transparent py-6'}`}>
                <div className="container mx-auto px-6 md:px-12 flex items-center justify-between">
                    <div className="flex items-center gap-3 group cursor-pointer">
                        <img src="/productionos-logo.svg" alt="ProductionOS" className="h-8 group-hover:opacity-80 transition-opacity" />
                    </div>

                    <div className="hidden md:flex items-center gap-8">
                        {['Product', 'Solutions', 'Pricing', 'Company'].map((item) => (
                            <a key={item} href={`#${item.toLowerCase()}`} className="text-sm font-medium text-white/60 hover:text-white transition-colors">
                                {item}
                            </a>
                        ))}
                    </div>

                    <div className="hidden md:flex items-center gap-4">
                        <button onClick={onLogin} className="text-sm font-medium text-white hover:text-[#FF3366] transition-colors">
                            Log in
                        </button>
                        <button onClick={onLogin} className="group relative px-6 py-2.5 bg-white text-black text-sm font-bold rounded-lg overflow-hidden transition-all hover:scale-105 active:scale-95">
                            <span className="relative z-10">Start Trial</span>
                            <div className="absolute inset-0 bg-gradient-to-r from-[#FF3366] to-[#FF85A1] opacity-0 group-hover:opacity-10 transition-opacity" />
                        </button>
                    </div>

                    <button className="md:hidden text-white" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
                        {mobileMenuOpen ? <X /> : <Menu />}
                    </button>
                </div>
            </nav>

            {/* Mobile Menu Drawer */}
            {mobileMenuOpen && (
                <div className="fixed inset-0 z-40 md:hidden">
                    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)} />
                    <div className="fixed top-0 right-0 w-full max-w-sm h-full bg-[#0A0A0F] border-l border-white/10 p-6 pt-20">
                        <button
                            className="absolute top-6 right-6 text-white/60 hover:text-white"
                            onClick={() => setMobileMenuOpen(false)}
                        >
                            <X size={24} />
                        </button>
                        <nav className="flex flex-col gap-6">
                            {['Product', 'Solutions', 'Pricing', 'Company'].map((item) => (
                                <a
                                    key={item}
                                    href={`#${item.toLowerCase()}`}
                                    className="text-lg font-medium text-white/80 hover:text-white transition-colors"
                                    onClick={() => setMobileMenuOpen(false)}
                                >
                                    {item}
                                </a>
                            ))}
                            <hr className="border-white/10 my-4" />
                            <button
                                onClick={() => { setMobileMenuOpen(false); onLogin(); }}
                                className="text-left text-lg font-medium text-white/80 hover:text-white transition-colors"
                            >
                                Log in
                            </button>
                            <button
                                onClick={() => { setMobileMenuOpen(false); onLogin(); }}
                                className="px-6 py-3 bg-[#7C3AED] hover:bg-[#6D28D9] text-white font-semibold rounded-xl transition-all text-center"
                            >
                                Start Free Trial
                            </button>
                        </nav>
                    </div>
                </div>
            )}

            <main className="relative z-10 pt-32 pb-20 md:pt-48">

                {/* Hero Section */}
                <section className="container mx-auto px-6 md:px-12 mb-32">
                    <div className="max-w-4xl mx-auto text-center mb-16">
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-white/10 bg-white/5 backdrop-blur-sm mb-8 animate-fade-in-up">
                            <span className="flex h-2 w-2 rounded-full bg-[#00F0FF] shadow-[0_0_10px_#00F0FF]"></span>
                            <span className="text-xs font-medium tracking-wide uppercase text-white/80">Reimagining Production Management</span>
                        </div>

                        <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tighter leading-[1.1] mb-8 bg-clip-text text-transparent bg-gradient-to-b from-white via-white to-white/60">
                            Chaos, <br className="hidden md:block" />
                            <span className="text-white">Coordinate</span><span className="text-[#FF3366]">d.</span>
                        </h1>

                        <p className="text-lg md:text-xl text-white/50 max-w-2xl mx-auto leading-relaxed mb-12 font-light">
                            The unified operating system for elite production companies.
                            Manage crew, kit, finance, and logistics in one interface designed for the modern producer.
                        </p>

                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                            <button onClick={onLogin} className="w-full sm:w-auto px-8 py-4 bg-[#FF3366] hover:bg-[#E62E5C] text-white font-semibold rounded-xl transition-all shadow-[0_0_30px_-5px_rgba(255,51,102,0.4)] hover:shadow-[0_0_40px_-5px_rgba(255,51,102,0.6)] hover:-translate-y-1">
                                Get Started Free
                            </button>
                            <button className="w-full sm:w-auto px-8 py-4 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-medium rounded-xl backdrop-blur-sm transition-all flex items-center justify-center gap-2 group">
                                <Play size={16} className="fill-current group-hover:scale-110 transition-transform" />
                                Watch Reel
                            </button>
                        </div>
                    </div>

                    {/* Abstract Interface Preview */}
                    <div className="relative mx-auto max-w-6xl aspect-[16/9] md:aspect-[21/9] rounded-2xl border border-white/10 bg-[#0A0A0F] shadow-2xl overflow-hidden group">
                        <div className="absolute inset-0 bg-gradient-to-b from-[#FF3366]/5 to-transparent opacity-50" />

                        {/* UI Mockup Construction */}
                        <div className="absolute inset-0 p-4 md:p-8 flex gap-6">
                            {/* Sidebar */}
                            <div className="hidden md:flex flex-col w-64 gap-6">
                                <div className="h-8 w-32 bg-white/10 rounded-lg animate-pulse" />
                                <div className="space-y-3">
                                    {[1, 2, 3, 4, 5].map(i => (
                                        <div key={i} className="flex items-center gap-3 p-3 rounded-lg hover:bg-white/5 transition-colors border border-transparent hover:border-white/5">
                                            <div className="w-5 h-5 rounded bg-white/10" />
                                            <div className="h-2 w-20 bg-white/10 rounded-full" />
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Main Content */}
                            <div className="flex-1 flex flex-col gap-6">
                                {/* Header */}
                                <div className="flex justify-between items-center">
                                    <div className="h-8 w-48 bg-white/10 rounded-lg" />
                                    <div className="flex gap-3">
                                        <div className="w-8 h-8 rounded-full bg-white/10" />
                                        <div className="w-8 h-8 rounded-full bg-[#FF3366]" />
                                    </div>
                                </div>

                                {/* Dashboard Grid */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-full">
                                    <div className="col-span-2 bg-gradient-to-br from-white/5 to-transparent rounded-xl border border-white/5 p-6 relative overflow-hidden">
                                        <div className="absolute top-0 right-0 p-4 opacity-20">
                                            <Zap className="text-white w-24 h-24" />
                                        </div>
                                        <div className="h-full flex flex-col justify-end">
                                            <h3 className="text-2xl font-bold mb-2">Production Alpha</h3>
                                            <div className="flex items-center gap-4 text-sm text-white/60">
                                                <span>Aug 24 - Sep 02</span>
                                                <span className="px-2 py-0.5 rounded-full bg-green-500/20 text-green-400 border border-green-500/20">On Track</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="bg-white/5 rounded-xl border border-white/5 p-6 flex flex-col justify-between">
                                        <div className="flex justify-between items-start">
                                            <span className="text-white/40 text-sm">Budget</span>
                                            <span className="text-green-400 text-xs">+12%</span>
                                        </div>
                                        <div className="text-3xl font-mono text-white">$24,500</div>
                                    </div>
                                    <div className="col-span-3 h-32 bg-white/5 rounded-xl border border-white/5 p-6 flex items-center gap-8 overflow-hidden">
                                        {[1, 2, 3, 4].map(i => (
                                            <div key={i} className="flex-1 space-y-3 opacity-50">
                                                <div className="h-2 w-full bg-white/10 rounded-full" />
                                                <div className="h-2 w-2/3 bg-white/10 rounded-full" />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Overlay Gradient */}
                        <div className="absolute inset-0 bg-gradient-to-t from-[#050507] via-transparent to-transparent pointer-events-none" />
                    </div>
                </section>

                {/* Bento Grid Features */}
                <section id="features" className="container mx-auto px-6 md:px-12 py-32">
                    <div className="flex flex-col md:flex-row justify-between items-end mb-20 gap-8">
                        <div className="max-w-xl">
                            <h2 className="text-4xl md:text-5xl font-bold mb-6">Engineered for <br /><span className="text-[#FF3366]">Performance</span></h2>
                            <p className="text-white/50 text-lg">
                                Generic tools slow you down. ProductionOS accelerates every workflow with specialized tools designed for the industry's unique demands.
                            </p>
                        </div>
                        <a href="#" className="hidden md:flex items-center gap-2 text-white hover:text-[#FF3366] transition-colors group">
                            View all features <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                        </a>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 grid-rows-2 gap-6 h-auto md:h-[800px]">
                        {/* Main Feature - Large */}
                        <div className="col-span-1 md:col-span-2 row-span-2 rounded-3xl bg-[#0F1016] border border-white/5 p-8 md:p-12 relative overflow-hidden group hover:border-white/10 transition-colors">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-[#FF3366]/10 blur-[80px] rounded-full group-hover:bg-[#FF3366]/20 transition-all duration-700" />

                            <div className="relative z-10 h-full flex flex-col justify-between">
                                <div>
                                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#FF3366] to-[#C02050] flex items-center justify-center text-white mb-8 shadow-lg shadow-[#FF3366]/20">
                                        <UsersIcon />
                                    </div>
                                    <h3 className="text-3xl font-bold mb-4">Command Center</h3>
                                    <p className="text-white/50 text-lg leading-relaxed max-w-md">
                                        Your central hub for ops. Drag-and-drop scheduling, instant availability checking, and automated conflict resolution.
                                    </p>
                                </div>

                                {/* Micro-UI */}
                                <div className="mt-12 bg-[#1A1C25] rounded-xl p-4 border border-white/5 shadow-2xl skew-y-1 group-hover:skew-y-0 transition-transform duration-500">
                                    <div className="flex items-center gap-4 mb-4 pb-4 border-b border-white/5">
                                        <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400">JD</div>
                                        <div>
                                            <div className="font-medium">John Director</div>
                                            <div className="text-xs text-white/40">Director of Photography</div>
                                        </div>
                                        <div className="ml-auto px-3 py-1 bg-green-500/10 text-green-400 text-xs rounded-full border border-green-500/20">Confirmed</div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-400">SA</div>
                                        <div>
                                            <div className="font-medium">Sarah Audio</div>
                                            <div className="text-xs text-white/40">Sound Recordist</div>
                                        </div>
                                        <div className="ml-auto px-3 py-1 bg-yellow-500/10 text-yellow-400 text-xs rounded-full border border-yellow-500/20">Pending</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Secondary Feature 1 */}
                        <div className="col-span-1 md:col-span-1 row-span-1 rounded-3xl bg-[#0F1016] border border-white/5 p-8 relative overflow-hidden group hover:border-white/10 transition-colors">
                            <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center text-white mb-6 border border-white/5">
                                <BoxIcon size={20} />
                            </div>
                            <h3 className="text-xl font-bold mb-2">Smart Kit Lists</h3>
                            <p className="text-white/50 text-sm">
                                Scan in. Scan out. Never lose a lens cap again.
                            </p>
                        </div>

                        {/* Secondary Feature 2 */}
                        <div className="col-span-1 md:col-span-1 row-span-1 rounded-3xl bg-[#0F1016] border border-white/5 p-8 relative overflow-hidden group hover:border-white/10 transition-colors">
                            <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center text-white mb-6 border border-white/5">
                                <ChartIcon size={20} />
                            </div>
                            <h3 className="text-xl font-bold mb-2">Live Margins</h3>
                            <p className="text-white/50 text-sm">
                                See profitability before you send the quote.
                            </p>
                        </div>

                        {/* Wide Feature */}
                        <div className="col-span-1 md:col-span-2 row-span-1 rounded-3xl bg-[#0F1016] border border-white/5 p-8 relative overflow-hidden group hover:border-white/10 transition-colors flex flex-col md:flex-row gap-8 items-center">
                            <div className="flex-1">
                                <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center text-white mb-6 border border-white/5">
                                    <FileIcon size={20} />
                                </div>
                                <h3 className="text-xl font-bold mb-2">Instant Paperwork</h3>
                                <p className="text-white/50 text-sm max-w-xs">
                                    Generate industry-standard call sheets and RAMS with one click.
                                </p>
                            </div>
                            <div className="flex-1 w-full bg-white/5 rounded-lg p-4 border border-white/5 skew-x-2 group-hover:skew-x-0 transition-transform">
                                <div className="h-2 w-1/2 bg-white/20 rounded mb-3" />
                                <div className="h-2 w-3/4 bg-white/10 rounded mb-2" />
                                <div className="h-2 w-full bg-white/10 rounded mb-2" />
                                <div className="h-2 w-2/3 bg-white/10 rounded" />
                            </div>
                        </div>

                    </div>
                </section>

                {/* How It Works */}
                <section id="solutions" className="container mx-auto px-6 md:px-12 py-32 relative">
                    <div className="text-center mb-20">
                        <h2 className="text-4xl md:text-5xl font-bold mb-6">From request to <span className="text-[#FF3366]">wrap</span></h2>
                        <p className="text-white/50 text-lg">Three steps to professionalize your production operations.</p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-12 relative z-10">
                        {/* Connecting Line */}
                        <div className="hidden md:block absolute top-12 left-[16%] right-[16%] h-px bg-gradient-to-r from-transparent via-[#FF3366]/50 to-transparent -z-10" />

                        <div className="relative group">
                            <div className="w-24 h-24 mx-auto bg-[#0F1016] border border-white/10 rounded-2xl flex items-center justify-center text-3xl font-bold mb-8 group-hover:border-[#FF3366]/50 group-hover:shadow-[0_0_30px_-10px_#FF3366] transition-all duration-500">
                                1
                            </div>
                            <h3 className="text-xl font-bold text-center mb-4">Centralize</h3>
                            <p className="text-white/50 text-center leading-relaxed">
                                Import your crew database, equipment list, and client details. We create a single source of truth for your entire business.
                            </p>
                        </div>

                        <div className="relative group">
                            <div className="w-24 h-24 mx-auto bg-[#0F1016] border border-white/10 rounded-2xl flex items-center justify-center text-3xl font-bold mb-8 group-hover:border-[#FF3366]/50 group-hover:shadow-[0_0_30px_-10px_#FF3366] transition-all duration-500">
                                2
                            </div>
                            <h3 className="text-xl font-bold text-center mb-4">Schedule</h3>
                            <p className="text-white/50 text-center leading-relaxed">
                                Build projects with drag-and-drop ease. Check availability instantly and send automated booking requests to crew.
                            </p>
                        </div>

                        <div className="relative group">
                            <div className="w-24 h-24 mx-auto bg-[#0F1016] border border-white/10 rounded-2xl flex items-center justify-center text-3xl font-bold mb-8 group-hover:border-[#FF3366]/50 group-hover:shadow-[0_0_30px_-10px_#FF3366] transition-all duration-500">
                                3
                            </div>
                            <h3 className="text-xl font-bold text-center mb-4">Execute</h3>
                            <p className="text-white/50 text-center leading-relaxed">
                                Generate call sheets, track expenses in real-time, and manage actuals against budget as the production unfolds.
                            </p>
                        </div>
                    </div>
                </section>

                {/* Social Proof / Trust */}
                <section className="py-20 border-y border-white/5 bg-white/[0.02]">
                    <div className="container mx-auto px-6 text-center">
                        <p className="text-sm font-medium text-white/40 uppercase tracking-widest mb-12">Trusted by modern production teams</p>
                        <div className="flex flex-wrap justify-center gap-12 md:gap-24 opacity-40 grayscale">
                            {['VANGUARD', 'ELEVATE', 'NORTHERN', 'STUDIOLAB', 'KINETIC'].map((logo, i) => (
                                <div key={i} className="text-xl font-black font-mono tracking-tighter">{logo}</div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* CTA / Footer */}
                <section id="pricing" className="py-32 container mx-auto px-6 relative">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-3xl h-[400px] bg-gradient-to-r from-[#FF3366]/20 to-purple-600/20 blur-[100px] rounded-full pointer-events-none" />

                    <div className="relative z-10 bg-[#0F1016] rounded-3xl border border-white/10 p-12 md:p-24 text-center overflow-hidden">

                        <div className="relative z-10">
                            <h2 className="text-4xl md:text-6xl font-bold mb-8">Ready to upgrade?</h2>
                            <p className="text-lg md:text-xl text-white/50 mb-12 max-w-xl mx-auto">
                                Join the platform building the future of production. Start your free trial today.
                            </p>

                            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                                <button onClick={onLogin} className="w-full sm:w-auto px-8 py-4 bg-white text-black font-bold rounded-xl hover:bg-white/90 transition-colors shadow-lg hover:scale-105 transform duration-200">
                                    Start Free Trial
                                </button>
                                <button onClick={onLogin} className="w-full sm:w-auto px-8 py-4 bg-transparent border border-white/20 text-white font-medium rounded-xl hover:bg-white/5 transition-colors">
                                    Book a Demo
                                </button>
                            </div>
                        </div>

                        {/* Decoration */}
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#FF3366] to-transparent opacity-50" />
                    </div>

                    <footer className="mt-32 border-t border-white/10 pt-12 flex flex-col md:flex-row justify-between items-center gap-8 text-white/40 text-sm">
                        <div className="flex items-center gap-2">
                            <img src="/productionos-logo.svg" alt="ProductionOS" className="h-6 opacity-60" />
                        </div>
                        <div className="flex gap-8">
                            <a href="#" className="hover:text-white transition-colors">Privacy</a>
                            <a href="#" className="hover:text-white transition-colors">Terms</a>
                            <a href="#" className="hover:text-white transition-colors">Security</a>
                        </div>
                        <div>
                            &copy; 2025 ProductionOS
                        </div>
                    </footer>
                </section>

            </main>
        </div>
    );
}

// Icons
const UsersIcon = ({ size = 24 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
);

const BoxIcon = ({ size = 24 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
        <polyline points="3.29 7 12 12 20.71 7" />
        <line x1="12" y1="22" x2="12" y2="12" />
    </svg>
);

const ChartIcon = ({ size = 24 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="20" x2="12" y2="10" />
        <line x1="18" y1="20" x2="18" y2="4" />
        <line x1="6" y1="20" x2="6" y2="16" />
    </svg>
);

const FileIcon = ({ size = 24 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
        <polyline points="10 9 9 9 8 9" />
    </svg>
);
