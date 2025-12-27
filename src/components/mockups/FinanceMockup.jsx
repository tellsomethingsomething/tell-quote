import React from 'react';
import { TrendingUp, TrendingDown, DollarSign, FileText, Receipt, MoreHorizontal } from 'lucide-react';
import { useCurrency } from '../../hooks/useCurrency';

export default function FinanceMockup() {
    const { formatPrice } = useCurrency();

    const stats = [
        { label: 'Revenue', value: 148500, change: '+18%', up: true, icon: DollarSign },
        { label: 'Expenses', value: 62300, change: '+5%', up: false, icon: Receipt },
        { label: 'Net Profit', value: 86200, change: '+24%', up: true, icon: TrendingUp },
        { label: 'Outstanding', value: 23400, change: '4 invoices', up: null, icon: FileText },
    ];

    const projects = [
        { name: 'Nike Fall Campaign', revenue: 45000, costs: 28000, profit: 17000, margin: 38 },
        { name: 'Spotify Sessions', revenue: 32000, costs: 18500, profit: 13500, margin: 42 },
        { name: 'TechCrunch Interview', revenue: 18500, costs: 12000, profit: 6500, margin: 35 },
        { name: 'Lexus TVC', revenue: 53000, costs: 35800, profit: 17200, margin: 32 },
    ];

    return (
        <div className="w-full bg-marketing-surface border border-marketing-border rounded-xl overflow-hidden shadow-2xl flex flex-col aspect-[16/10] text-left font-sans select-none">
            {/* Header */}
            <div className="h-14 border-b border-marketing-border bg-marketing-surface flex items-center justify-between px-6">
                <h3 className="font-bold text-marketing-text-primary">Financial Overview</h3>
                <div className="flex gap-2">
                    <button className="px-3 py-1.5 rounded-md text-xs font-medium bg-marketing-primary/10 text-marketing-primary">This Month</button>
                    <button className="px-3 py-1.5 rounded-md text-xs font-medium text-marketing-text-secondary hover:bg-marketing-background">Q4 2024</button>
                    <button className="px-3 py-1.5 rounded-md text-xs font-medium text-marketing-text-secondary hover:bg-marketing-background">YTD</button>
                </div>
            </div>

            {/* Body */}
            <div className="flex-1 bg-marketing-background p-6 overflow-hidden flex flex-col gap-4">
                {/* Stats Row */}
                <div className="grid grid-cols-4 gap-4">
                    {stats.map((stat, i) => (
                        <div key={i} className="bg-marketing-surface border border-marketing-border p-4 rounded-lg">
                            <div className="flex justify-between items-start mb-2">
                                <span className="text-xs text-marketing-text-secondary font-medium">{stat.label}</span>
                                <stat.icon size={14} className={stat.up === true ? 'text-green-400' : stat.up === false ? 'text-red-400' : 'text-marketing-text-secondary'} />
                            </div>
                            <div className="text-xl font-bold text-marketing-text-primary mb-1">{formatPrice(stat.value)}</div>
                            <div className={`text-xs font-medium ${stat.up === true ? 'text-green-400' : stat.up === false ? 'text-red-400' : 'text-marketing-text-secondary'}`}>
                                {stat.change}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Project P&L Table */}
                <div className="flex-1 bg-marketing-surface border border-marketing-border rounded-lg overflow-hidden">
                    <div className="flex items-center justify-between p-4 border-b border-marketing-border">
                        <h4 className="font-bold text-marketing-text-primary text-sm">Project P&L</h4>
                        <MoreHorizontal size={16} className="text-marketing-text-secondary" />
                    </div>
                    <div className="grid grid-cols-12 gap-4 p-3 border-b border-marketing-border text-xs font-medium text-marketing-text-secondary uppercase tracking-wide">
                        <div className="col-span-4">Project</div>
                        <div className="col-span-2 text-right">Revenue</div>
                        <div className="col-span-2 text-right">Costs</div>
                        <div className="col-span-2 text-right">Profit</div>
                        <div className="col-span-2 text-right">Margin</div>
                    </div>
                    {projects.map((project, i) => (
                        <div key={i} className="grid grid-cols-12 gap-4 p-3 border-b border-marketing-border/50 hover:bg-marketing-background/50 items-center text-sm">
                            <div className="col-span-4 font-medium text-marketing-text-primary">{project.name}</div>
                            <div className="col-span-2 text-right text-marketing-text-secondary">{formatPrice(project.revenue)}</div>
                            <div className="col-span-2 text-right text-red-400">{formatPrice(project.costs)}</div>
                            <div className="col-span-2 text-right text-green-400 font-medium">{formatPrice(project.profit)}</div>
                            <div className="col-span-2 text-right">
                                <span className="px-2 py-0.5 rounded bg-green-500/10 text-green-400 text-xs font-bold">{project.margin}%</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
