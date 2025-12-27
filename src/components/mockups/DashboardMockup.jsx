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

export default function DashboardMockup() {
    return (
        <div className="w-full bg-marketing-surface border border-marketing-border rounded-xl overflow-hidden shadow-2xl flex flex-col aspect-[16/10] text-left font-sans select-none">
            {/* Mock Header */}
            <div className="h-14 border-b border-marketing-border bg-marketing-surface flex items-center justify-between px-6">
                <div className="flex items-center gap-4 w-1/3">
                    <div className="flex gap-1.5">
                        <div className="w-3 h-3 rounded-full bg-red-400 opacity-80" />
                        <div className="w-3 h-3 rounded-full bg-yellow-400 opacity-80" />
                        <div className="w-3 h-3 rounded-full bg-green-400 opacity-80" />
                    </div>
                    <div className="h-8 bg-marketing-background/50 rounded-md border border-marketing-border w-full max-w-[200px] flex items-center px-3 gap-2 text-marketing-text-secondary/50 text-xs">
                        <Search size={14} />
                        <span>Search projects...</span>
                    </div>
                </div>
                <div className="flex items-center gap-4 text-marketing-text-secondary">
                    <Bell size={18} />
                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-marketing-primary to-marketing-accent p-[1px]">
                        <div className="w-full h-full rounded-full bg-marketing-surface flex items-center justify-center">
                            <span className="text-xs font-bold text-marketing-text-primary">JD</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Mock Body */}
            <div className="flex-1 bg-marketing-background p-6 overflow-hidden flex flex-col gap-6">

                {/* Stats Row */}
                <div className="grid grid-cols-3 gap-4">
                    {[
                        { label: 'Revenue (Oct)', value: '$124,500', change: '+12%', icon: DollarSign, color: 'text-green-400' },
                        { label: 'Active Projects', value: '14', change: '+3', icon: ClapperboardIcon, color: 'text-purple-400' },
                        { label: 'Pending Quotes', value: '8', change: '$45k', icon: FileTextIcon, color: 'text-orange-400' },
                    ].map((stat, i) => (
                        <div key={i} className="bg-marketing-surface border border-marketing-border p-4 rounded-lg">
                            <div className="flex justify-between items-start mb-2">
                                <span className="text-xs text-marketing-text-secondary font-medium uppercase tracking-wide">{stat.label}</span>
                                <stat.icon size={16} className={stat.color} />
                            </div>
                            <div className="flex items-end gap-2">
                                <span className="text-2xl font-bold text-marketing-text-primary">{stat.value}</span>
                                <span className="text-xs text-green-400 mb-1 font-medium">{stat.change}</span>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Main Content Grid */}
                <div className="flex-1 min-h-0 bg-marketing-surface border border-marketing-border rounded-lg p-5 flex flex-col overflow-hidden">
                    <div className="flex justify-between items-center mb-4">
                        <h4 className="font-bold text-marketing-text-primary text-sm">Recent Activity</h4>
                        <MoreHorizontal size={16} className="text-marketing-text-secondary" />
                    </div>
                    <div className="space-y-4 flex-1 min-h-0 overflow-hidden">
                        {[
                            { title: 'Nike Commercial - Fall Campaign', status: 'Quote Approved', time: '2h ago', user: 'Sarah M.', type: 'success' },
                            { title: 'TechCrunch Interview Series', status: 'Crew Booked', time: '4h ago', user: 'Mike R.', type: 'info' },
                            { title: 'Spotify Live Session', status: 'Invoice Overdue', time: '1d ago', user: 'System', type: 'warning' },
                        ].map((item, i) => (
                            <div key={i} className="flex items-center justify-between p-3 rounded-md hover:bg-marketing-background/50 transition-colors border border-transparent hover:border-marketing-border/50">
                                <div className="flex items-center gap-3">
                                    <div className={`w-2 h-2 rounded-full shrink-0 ${item.type === 'success' ? 'bg-green-400' : item.type === 'warning' ? 'bg-red-400' : 'bg-blue-400'}`} />
                                    <div>
                                        <div className="text-sm font-medium text-marketing-text-primary">{item.title}</div>
                                        <div className="text-xs text-marketing-text-secondary">{item.status} • {item.user}</div>
                                    </div>
                                </div>
                                <span className="text-xs text-marketing-text-secondary/70 shrink-0">{item.time}</span>
                            </div>
                        ))}
                    </div>
                    {/* Faux Chart Area */}
                    <div className="pt-4 border-t border-marketing-border/50 shrink-0">
                        <div className="flex items-end gap-1 h-12 opacity-50">
                            {[40, 65, 45, 80, 55, 70, 90, 60, 75, 50, 85, 95, 45, 65, 80, 60].map((h, i) => (
                                <div key={i} className="flex-1 bg-marketing-primary rounded-t-sm" style={{ height: `${h}%` }} />
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
