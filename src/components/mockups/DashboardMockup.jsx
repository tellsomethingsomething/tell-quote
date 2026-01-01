import React from 'react';
import { motion } from 'framer-motion';
import {
    Search,
    Bell,
    TrendingUp,
    Users,
    Calendar,
    MoreHorizontal,
    CheckCircle2,
    Clock,
    DollarSign
} from 'lucide-react';
import { useCurrency } from '../../hooks/useCurrency';

export default function DashboardMockup() {
    const { formatPrice, formatPriceShort } = useCurrency();

    const stats = [
        { label: 'Revenue (Oct)', value: 124500, change: '+12%', icon: DollarSign, color: 'text-green-400' },
        { label: 'Active Projects', value: 14, change: '+3', icon: ClapperboardIcon, color: 'text-purple-400', isCount: true },
        { label: 'Pending Quotes', value: 8, change: 45000, icon: FileTextIcon, color: 'text-orange-400', isCount: true },
    ];

    return (
        <div className="w-full bg-marketing-surface border border-marketing-border rounded-xl overflow-hidden shadow-2xl flex flex-col min-h-[300px] sm:min-h-[400px] text-left font-sans select-none">
            {/* Mock Header */}
            <div className="h-10 sm:h-14 border-b border-marketing-border bg-marketing-surface flex items-center justify-between px-3 sm:px-6">
                <div className="flex items-center gap-2 sm:gap-4">
                    <div className="flex gap-1 sm:gap-1.5">
                        <div className="w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-red-400 opacity-80" />
                        <div className="w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-yellow-400 opacity-80" />
                        <div className="w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-green-400 opacity-80" />
                    </div>
                    <div className="hidden sm:flex h-8 bg-marketing-background/50 rounded-md border border-marketing-border w-full max-w-[200px] items-center px-3 gap-2 text-marketing-text-secondary/50 text-xs">
                        <Search size={14} />
                        <span>Search projects...</span>
                    </div>
                </div>
                <div className="flex items-center gap-2 sm:gap-4 text-marketing-text-secondary">
                    <Bell size={14} className="sm:w-[18px] sm:h-[18px]" />
                    <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-gradient-to-tr from-marketing-primary to-marketing-accent p-[1px]">
                        <div className="w-full h-full rounded-full bg-marketing-surface flex items-center justify-center">
                            <span className="text-[10px] sm:text-xs font-bold text-marketing-text-primary">JD</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Mock Body */}
            <div className="flex-1 bg-marketing-background p-2 sm:p-4 flex flex-col gap-2 sm:gap-4">

                {/* Stats Row */}
                <div className="grid grid-cols-3 gap-1.5 sm:gap-3">
                    {stats.map((stat, i) => (
                        <div key={i} className="bg-marketing-surface border border-marketing-border p-1.5 sm:p-3 rounded-lg">
                            <div className="flex justify-between items-start mb-0.5 sm:mb-1">
                                <span className="text-[8px] sm:text-[10px] text-marketing-text-secondary font-medium uppercase tracking-wide truncate">{stat.label}</span>
                                <stat.icon size={10} className={`${stat.color} sm:w-[14px] sm:h-[14px] shrink-0`} />
                            </div>
                            <div className="flex items-end gap-1 sm:gap-2">
                                <span className="text-sm sm:text-lg font-bold text-marketing-text-primary truncate">
                                    {stat.isCount ? stat.value : formatPrice(stat.value)}
                                </span>
                                <span className="text-[8px] sm:text-[10px] text-green-400 mb-0.5 font-medium hidden sm:inline">
                                    {typeof stat.change === 'number' ? formatPriceShort(stat.change) : stat.change}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Main Content Grid */}
                <div className="flex-1 bg-marketing-surface border border-marketing-border rounded-lg p-2 sm:p-4 flex flex-col">
                    <div className="flex justify-between items-center mb-2 sm:mb-3">
                        <h4 className="font-bold text-marketing-text-primary text-xs sm:text-sm">Recent Activity</h4>
                        <MoreHorizontal size={12} className="text-marketing-text-secondary sm:w-4 sm:h-4" />
                    </div>
                    <div className="space-y-1.5 sm:space-y-2 flex-1">
                        {[
                            { title: 'Nike Commercial', titleFull: 'Nike Commercial - Fall Campaign', status: 'Quote Approved', time: '2h', user: 'Sarah M.', type: 'success' },
                            { title: 'TechCrunch Series', titleFull: 'TechCrunch Interview Series', status: 'Crew Booked', time: '4h', user: 'Mike R.', type: 'info' },
                            { title: 'Spotify Session', titleFull: 'Spotify Live Session', status: 'Invoice Overdue', time: '1d', user: 'System', type: 'warning' },
                        ].map((item, i) => (
                            <div key={i} className="flex items-center justify-between py-1.5 sm:py-2 px-2 sm:px-3 rounded-md bg-marketing-background/30 border border-marketing-border/30">
                                <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                                    <div className={`w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full shrink-0 ${item.type === 'success' ? 'bg-green-400' : item.type === 'warning' ? 'bg-red-400' : 'bg-blue-400'}`} />
                                    <div className="min-w-0">
                                        <div className="text-[10px] sm:text-xs font-medium text-marketing-text-primary truncate">
                                            <span className="sm:hidden">{item.title}</span>
                                            <span className="hidden sm:inline">{item.titleFull}</span>
                                        </div>
                                        <div className="text-[8px] sm:text-[10px] text-marketing-text-secondary truncate">{item.status}</div>
                                    </div>
                                </div>
                                <span className="text-[8px] sm:text-[10px] text-marketing-text-secondary/70 shrink-0 ml-1">{item.time}</span>
                            </div>
                        ))}
                    </div>
                    {/* Faux Chart Area */}
                    <div className="pt-2 sm:pt-3 mt-auto border-t border-marketing-border/50">
                        <div className="flex items-center justify-between mb-1 sm:mb-2">
                            <span className="text-[8px] sm:text-[10px] text-marketing-text-secondary">Revenue Trend</span>
                            <span className="text-[8px] sm:text-[10px] text-green-400">+18%</span>
                        </div>
                        <div className="flex items-end gap-0.5 sm:gap-1 h-6 sm:h-10">
                            {[40, 65, 45, 80, 55, 70, 90, 60, 75, 50, 85, 95].map((h, i) => (
                                <div key={i} className="flex-1 bg-marketing-primary/80 rounded-t-sm" style={{ height: `${h}%` }} />
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function ClapperboardIcon(props) {
    return <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.2 6 3 11l-.9-2.4c-.3-1.1.3-2.2 1.3-2.5l13.5-4c1.1-.3 2.2.3 2.5 1.3Z" /><path d="m6.2 5.3 3.1 3.9" /><path d="m12.4 3.4 3.1 4" /><path d="M3 11h18v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z" /></svg>
}

function FileTextIcon(props) {
    return <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" /><path d="M14 2v4a2 2 0 0 0 2 2h4" /><path d="M10 9H8" /><path d="M16 13H8" /><path d="M16 17H8" /></svg>
}
