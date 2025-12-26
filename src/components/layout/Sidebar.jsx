import { useState, useMemo, useEffect } from 'react';
import { useAuthStore } from '../../store/authStore';
import { useSettingsStore } from '../../store/settingsStore';

// Grouped navigation structure
const NAV_CATEGORIES = [
    {
        id: 'top',
        type: 'standalone',
        items: [
            { id: 'dashboard', label: 'Dashboard', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
        ]
    },
    {
        id: 'business',
        label: 'Business',
        icon: 'M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z',
        items: [
            { id: 'quotes', label: 'Quotes', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
            { id: 'clients', label: 'Clients', icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z' },
            { id: 'opportunities', label: 'Opportunities', icon: 'M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z' },
            { id: 'email', label: 'Email', icon: 'M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z' },
            { id: 'tasks', label: 'Tasks', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4' },
            { id: 'calendar', label: 'Calendar', icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' },
            { id: 'sequences', label: 'Sequences', icon: 'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10' },
            { id: 'workflows', label: 'Workflows', icon: 'M13 10V3L4 14h7v7l9-11h-7z' },
        ]
    },
    {
        id: 'finance',
        label: 'Finance',
        icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
        items: [
            { id: 'invoices', label: 'Invoices', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
            { id: 'purchase-orders', label: 'Purchase Orders', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01' },
            { id: 'contracts', label: 'Contracts', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2zM15 3v4a1 1 0 001 1h4' },
        ]
    },
    {
        id: 'operations',
        label: 'Operations',
        icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z',
        items: [
            { id: 'projects', label: 'Projects', icon: 'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10' },
            { id: 'analytics', label: 'Call Sheets', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2' },
            { id: 'kit', label: 'Kit', icon: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4' },
            { id: 'kit-bookings', label: 'Kit Bookings', icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' },
            { id: 'crew', label: 'Crew', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z' },
            { id: 'resources', label: 'Resources', icon: 'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10' },
            { id: 'rate-card', label: 'Rates', icon: 'M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z' },
            { id: 'contacts', label: 'Contacts', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z' },
        ]
    },
    {
        id: 'knowledge',
        label: 'Company Knowledge',
        icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253',
        items: [
            { id: 'sop', label: 'SOP', icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253' },
            { id: 'knowledge', label: 'Research', icon: 'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z' },
        ]
    },
];

export default function Sidebar({
    activeTab,
    onTabChange,
    onGoToFS,
    collapsed,
    onToggleCollapse
}) {
    const hasPermission = useAuthStore(state => state.hasPermission);
    const { logout, user } = useAuthStore();
    const { settings, setTheme } = useSettingsStore();
    const [showUserMenu, setShowUserMenu] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);
    const [expandedCategories, setExpandedCategories] = useState(() => {
        const saved = localStorage.getItem('sidebar-expanded-categories');
        return saved ? JSON.parse(saved) : { business: true, finance: true, operations: true, knowledge: true };
    });

    // Detect mobile viewport
    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 1024);
        };
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    // Save expanded state to localStorage
    useEffect(() => {
        localStorage.setItem('sidebar-expanded-categories', JSON.stringify(expandedCategories));
    }, [expandedCategories]);

    // Close mobile menu when navigating
    const handleNavClick = (tab) => {
        if (isMobile) {
            setMobileOpen(false);
        }
        onTabChange(tab);
    };

    const toggleCategory = (categoryId) => {
        setExpandedCategories(prev => ({
            ...prev,
            [categoryId]: !prev[categoryId]
        }));
    };

    const isDark = settings.theme !== 'light';
    const userName = user?.profile?.name || user?.email?.split('@')[0] || 'User';
    const userRole = user?.profile?.role === 'admin' ? 'Admin' : 'User';
    const userInitials = userName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'U';

    // Filter categories and items based on permissions
    const filteredCategories = useMemo(() => {
        return NAV_CATEGORIES.map(category => ({
            ...category,
            items: category.items.filter(item => hasPermission(item.id))
        })).filter(category => category.items.length > 0);
    }, [hasPermission]);

    // Check if any item in a category is active
    const isCategoryActive = (category) => {
        return category.items.some(item => item.id === activeTab);
    };

    // Mobile: use mobileOpen state, Desktop: use collapsed prop
    const isOpen = isMobile ? mobileOpen : !collapsed;

    // Theme-aware class helpers
    const sidebarBg = isDark ? 'bg-dark-bg' : 'bg-white';
    const borderColor = isDark ? 'border-dark-border' : 'border-gray-200';
    const textPrimary = isDark ? 'text-gray-200' : 'text-gray-900';
    const textSecondary = isDark ? 'text-gray-400' : 'text-gray-600';
    const textMuted = isDark ? 'text-gray-500' : 'text-gray-500';
    const hoverBg = isDark ? 'hover:bg-white/5' : 'hover:bg-gray-100';
    const hoverText = isDark ? 'hover:text-gray-200' : 'hover:text-gray-900';

    return (
        <>
            {/* Mobile hamburger button - always visible on mobile */}
            {isMobile && !mobileOpen && (
                <button
                    onClick={() => setMobileOpen(true)}
                    className={`fixed top-4 left-4 z-50 w-12 h-12 rounded-xl ${isDark ? 'bg-dark-card border-dark-border text-gray-400 hover:text-white hover:bg-dark-border' : 'bg-white border-gray-200 text-gray-600 hover:text-gray-900 hover:bg-gray-100'} border flex items-center justify-center transition-colors shadow-lg`}
                    aria-label="Open menu"
                >
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                </button>
            )}

            {/* Mobile overlay */}
            {isMobile && mobileOpen && (
                <div
                    className="fixed inset-0 bg-black/60 z-40 backdrop-blur-sm"
                    onClick={() => setMobileOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside
                className={`fixed lg:relative z-50 h-screen ${sidebarBg} border-r ${borderColor} flex flex-col transition-all duration-300 ease-in-out ${
                    isMobile
                        ? mobileOpen ? 'w-72 translate-x-0' : 'w-72 -translate-x-full'
                        : collapsed ? 'w-16' : 'w-64'
                }`}
            >
                {/* Logo & Toggle */}
                <div className={`h-16 border-b ${borderColor} flex items-center ${!isOpen && !isMobile ? 'justify-center px-2' : 'justify-between px-4'}`}>
                    {(isOpen || isMobile) && (
                        <button
                            onClick={() => handleNavClick('dashboard')}
                            className="flex items-center hover:opacity-80 transition-opacity"
                        >
                            <img src="/tell-logo.svg" alt="Tell" className="h-7" />
                        </button>
                    )}
                    {isMobile ? (
                        <button
                            onClick={() => setMobileOpen(false)}
                            className={`w-10 h-10 rounded-lg ${hoverBg} flex items-center justify-center ${textSecondary} ${hoverText} transition-colors`}
                            title="Close menu"
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    ) : (
                        <button
                            onClick={onToggleCollapse}
                            className={`w-10 h-10 rounded-lg ${hoverBg} flex items-center justify-center ${textSecondary} ${hoverText} transition-colors`}
                            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                        >
                            <svg className={`w-5 h-5 transition-transform ${collapsed ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                            </svg>
                        </button>
                    )}
                </div>

                {/* Navigation */}
                <nav className="flex-1 overflow-y-auto py-4 px-2">
                    <div className="space-y-2">
                        {filteredCategories.map((category) => {
                            // Standalone items (like Dashboard)
                            if (category.type === 'standalone') {
                                return category.items.map(item => {
                                    const isActive = activeTab === item.id;
                                    return (
                                        <button
                                            key={item.id}
                                            onClick={() => handleNavClick(item.id)}
                                            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 ${
                                                isActive
                                                    ? 'bg-accent-primary/20 text-accent-primary'
                                                    : `${textSecondary} ${hoverText} ${hoverBg}`
                                            }`}
                                            title={!isOpen && !isMobile ? item.label : undefined}
                                        >
                                            <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={item.icon} />
                                            </svg>
                                            {(isOpen || isMobile) && (
                                                <span className="text-sm font-medium truncate">{item.label}</span>
                                            )}
                                        </button>
                                    );
                                });
                            }

                            // Collapsible categories
                            const isExpanded = expandedCategories[category.id];
                            const categoryActive = isCategoryActive(category);

                            return (
                                <div key={category.id} className="space-y-1">
                                    {/* Category Header */}
                                    <button
                                        onClick={() => (isOpen || isMobile) && toggleCategory(category.id)}
                                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 ${
                                            categoryActive
                                                ? 'text-accent-primary'
                                                : `${textMuted} ${isDark ? 'hover:text-gray-300' : 'hover:text-gray-700'}`
                                        } ${!isOpen && !isMobile ? 'justify-center' : ''}`}
                                        title={!isOpen && !isMobile ? category.label : undefined}
                                    >
                                        <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={category.icon} />
                                        </svg>
                                        {(isOpen || isMobile) && (
                                            <>
                                                <span className="text-xs font-semibold uppercase tracking-wider flex-1 text-left">{category.label}</span>
                                                <svg
                                                    className={`w-4 h-4 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
                                                    fill="none"
                                                    viewBox="0 0 24 24"
                                                    stroke="currentColor"
                                                >
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                                </svg>
                                            </>
                                        )}
                                    </button>

                                    {/* Category Items */}
                                    {(isExpanded || (!isOpen && !isMobile)) && (
                                        <div className={`space-y-1 ${(isOpen || isMobile) ? 'pl-3' : ''}`}>
                                            {category.items.map(item => {
                                                const isActive = activeTab === item.id;
                                                return (
                                                    <button
                                                        key={item.id}
                                                        onClick={() => handleNavClick(item.id)}
                                                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 ${
                                                            isActive
                                                                ? 'bg-accent-primary/20 text-accent-primary'
                                                                : `${textSecondary} ${hoverText} ${hoverBg}`
                                                        }`}
                                                        title={!isOpen && !isMobile ? item.label : undefined}
                                                    >
                                                        <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={item.icon} />
                                                        </svg>
                                                        {(isOpen || isMobile) && (
                                                            <span className="text-sm font-medium truncate">{item.label}</span>
                                                        )}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </nav>

                {/* Bottom Section */}
                <div className={`border-t ${borderColor} p-2 space-y-1`}>
                    {/* Full Screen Analytics */}
                    <button
                        onClick={() => { if (isMobile) setMobileOpen(false); onGoToFS(); }}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg ${isDark ? 'text-teal-400 hover:bg-teal-500/10' : 'text-teal-600 hover:bg-teal-50'} transition-colors ${!isOpen && !isMobile ? 'justify-center' : ''}`}
                        title="Full Screen Analytics"
                    >
                        <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                        {(isOpen || isMobile) && <span className="text-sm font-medium">Full Screen</span>}
                    </button>

                    {/* Theme Toggle */}
                    <button
                        onClick={() => setTheme(isDark ? 'light' : 'dark')}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg ${textSecondary} ${hoverText} ${hoverBg} transition-colors ${!isOpen && !isMobile ? 'justify-center' : ''}`}
                        title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
                    >
                        {isDark ? (
                            <svg className="w-5 h-5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                            </svg>
                        ) : (
                            <svg className="w-5 h-5 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                            </svg>
                        )}
                        {(isOpen || isMobile) && <span className="text-sm font-medium">{isDark ? 'Light Mode' : 'Dark Mode'}</span>}
                    </button>

                    {/* Settings */}
                    <button
                        onClick={() => handleNavClick('settings')}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                            activeTab === 'settings'
                                ? 'bg-accent-primary/20 text-accent-primary'
                                : `${textSecondary} ${hoverText} ${hoverBg}`
                        } ${!isOpen && !isMobile ? 'justify-center' : ''}`}
                        title="Settings"
                    >
                        <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        {(isOpen || isMobile) && <span className="text-sm font-medium">Settings</span>}
                    </button>

                    {/* User Menu */}
                    <div className="relative">
                        <button
                            onClick={() => setShowUserMenu(!showUserMenu)}
                            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg ${textSecondary} ${hoverText} ${hoverBg} transition-colors ${!isOpen && !isMobile ? 'justify-center' : ''}`}
                        >
                            <div className={`w-8 h-8 rounded-full ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-gray-100 border-gray-300'} border flex items-center justify-center text-xs shrink-0`}>
                                {userInitials}
                            </div>
                            {(isOpen || isMobile) && (
                                <div className="flex-1 text-left min-w-0">
                                    <p className={`text-sm font-medium ${textPrimary} truncate`}>{userName}</p>
                                    <p className={`text-xs ${textMuted}`}>{userRole}</p>
                                </div>
                            )}
                        </button>

                        {/* User Dropdown */}
                        {showUserMenu && (
                            <>
                                <div className="fixed inset-0 z-40" onClick={() => setShowUserMenu(false)} />
                                <div className={`absolute z-50 ${isDark ? 'bg-[#1a1f2e] border-dark-border' : 'bg-white border-gray-200'} border rounded-lg shadow-2xl overflow-hidden ${
                                    !isOpen && !isMobile ? 'left-full ml-2 bottom-0 w-48' : 'left-0 bottom-full mb-2 w-full'
                                }`}>
                                    <button
                                        onClick={() => {
                                            setShowUserMenu(false);
                                            if (isMobile) setMobileOpen(false);
                                            logout();
                                        }}
                                        className={`w-full px-4 py-3 text-left text-sm ${isDark ? 'text-gray-400 hover:bg-red-500/10' : 'text-gray-600 hover:bg-red-50'} hover:text-red-500 transition-colors flex items-center gap-2`}
                                    >
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                        </svg>
                                        Sign Out
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </aside>
        </>
    );
}
