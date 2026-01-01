import { useState, useMemo, useEffect } from 'react';
import { useProjectStore } from '../store/projectStore';
import { useInvoiceStore } from '../store/invoiceStore';
import { useExpenseStore } from '../store/expenseStore';
import { useCrewBookingStore } from '../store/crewBookingStore';
import { useClientStore } from '../store/clientStore';
import { formatCurrency, convertCurrency } from '../utils/currency';
import { useDisplayCurrency } from '../hooks/useDisplayCurrency';

// Format date helper
const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
};

// P&L Stats Card
function PLStatsCard({ label, value, isPositive, color, icon, subValue }) {
    return (
        <div className="bg-dark-card border border-dark-border rounded-lg p-4">
            <div className="flex items-center justify-between">
                <div>
                    <div className="text-sm text-gray-400">{label}</div>
                    <div className={`text-2xl font-bold ${color}`}>{value}</div>
                    {subValue && <div className="text-xs text-gray-500 mt-1">{subValue}</div>}
                </div>
                <div className={`p-3 rounded-lg ${color.replace('text-', 'bg-').replace('400', '500/10')}`}>
                    {icon}
                </div>
            </div>
        </div>
    );
}

// Project P&L Row - now includes crew costs
function ProjectPLRow({ project, invoices, expenses, crewBookings, clients, onSelect, displayCurrency }) {
    const client = clients.find(c => c.id === project.clientId);

    // Calculate revenue from paid invoices for this project
    const projectInvoices = invoices.filter(inv => inv.projectId === project.id);
    const paidInvoices = projectInvoices.filter(inv => inv.status === 'paid');
    const revenue = paidInvoices.reduce((sum, inv) => sum + (inv.total || 0), 0);
    const pendingRevenue = projectInvoices
        .filter(inv => inv.status === 'sent')
        .reduce((sum, inv) => sum + (inv.total || 0), 0);

    // Calculate expenses for this project (general expenses)
    const projectExpenses = expenses.filter(exp => exp.projectId === project.id);
    const expensesCost = projectExpenses.reduce((sum, exp) => sum + (exp.amount || 0), 0);

    // Calculate crew costs for this project
    const projectCrewBookings = crewBookings.filter(
        b => b.projectId === project.id && b.status !== 'cancelled'
    );
    const crewCost = projectCrewBookings.reduce((sum, b) => sum + (b.totalCost || 0), 0);

    // Total costs = expenses + crew
    const totalCosts = expensesCost + crewCost;

    // Calculate profit
    const profit = revenue - totalCosts;
    const margin = revenue > 0 ? (profit / revenue) * 100 : 0;

    const isPositive = profit >= 0;

    return (
        <tr
            className="border-b border-dark-border hover:bg-dark-card/50 cursor-pointer transition-colors"
            onClick={() => onSelect(project.id)}
        >
            <td className="px-4 py-3">
                <div className="font-medium text-gray-200">{project.name}</div>
                <div className="text-xs text-gray-500">{client?.company || project.clientName || 'Unknown'}</div>
            </td>
            <td className="px-4 py-3">
                <span className={`px-2 py-1 rounded text-xs ${
                    project.status === 'completed' ? 'bg-green-500/10 text-green-400' :
                    project.status === 'in-progress' ? 'bg-blue-500/10 text-blue-400' :
                    project.status === 'on-hold' ? 'bg-yellow-500/10 text-yellow-400' :
                    'bg-gray-500/10 text-gray-400'
                }`}>
                    {project.status || 'Planning'}
                </span>
            </td>
            <td className="px-4 py-3 text-right">
                <div className="text-green-400 font-medium">{formatCurrency(revenue, displayCurrency)}</div>
                {pendingRevenue > 0 && (
                    <div className="text-xs text-gray-500">+{formatCurrency(pendingRevenue, displayCurrency)} pending</div>
                )}
            </td>
            <td className="px-4 py-3 text-right">
                <div className="text-orange-400">{formatCurrency(crewCost, displayCurrency)}</div>
                <div className="text-xs text-gray-500">{projectCrewBookings.length} bookings</div>
            </td>
            <td className="px-4 py-3 text-right">
                <div className="text-red-400">{formatCurrency(expensesCost, displayCurrency)}</div>
                <div className="text-xs text-gray-500">{projectExpenses.length} expenses</div>
            </td>
            <td className="px-4 py-3 text-right">
                <div className={`font-semibold ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
                    {isPositive ? '+' : ''}{formatCurrency(profit, displayCurrency)}
                </div>
                {revenue > 0 && (
                    <div className={`text-xs ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
                        {margin.toFixed(1)}% margin
                    </div>
                )}
            </td>
        </tr>
    );
}

// Cost Category Breakdown - includes crew as a category
function CategoryBreakdown({ expenses, crewBookings, displayCurrency }) {
    const byCategory = useMemo(() => {
        const grouped = {};

        // Add crew costs as first category
        const crewTotal = crewBookings
            .filter(b => b.status !== 'cancelled')
            .reduce((sum, b) => sum + (b.totalCost || 0), 0);

        if (crewTotal > 0) {
            grouped['Crew'] = crewTotal;
        }

        // Add expense categories
        expenses.forEach(exp => {
            if (!grouped[exp.category]) {
                grouped[exp.category] = 0;
            }
            grouped[exp.category] += exp.amount || 0;
        });

        return Object.entries(grouped)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10);
    }, [expenses, crewBookings]);

    const total = byCategory.reduce((sum, [, amount]) => sum + amount, 0);

    if (byCategory.length === 0) {
        return (
            <div className="text-center text-gray-500 py-8">
                No costs to show
            </div>
        );
    }

    return (
        <div className="space-y-3">
            {byCategory.map(([category, amount]) => {
                const percentage = total > 0 ? (amount / total) * 100 : 0;
                const isCrew = category === 'Crew';
                return (
                    <div key={category}>
                        <div className="flex items-center justify-between text-sm mb-1">
                            <span className={`flex items-center gap-2 ${isCrew ? 'text-orange-300' : 'text-gray-300'}`}>
                                {isCrew && (
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                                    </svg>
                                )}
                                {category}
                            </span>
                            <span className="text-gray-400">{formatCurrency(amount, displayCurrency)}</span>
                        </div>
                        <div className="h-2 bg-dark-bg rounded-full overflow-hidden">
                            <div
                                className={`h-full rounded-full ${
                                    isCrew
                                        ? 'bg-gradient-to-r from-orange-500 to-yellow-500'
                                        : 'bg-gradient-to-r from-red-500 to-orange-500'
                                }`}
                                style={{ width: `${percentage}%` }}
                            />
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

// Monthly Trend Chart - includes crew costs
function MonthlyTrend({ invoices, expenses, crewBookings, displayCurrency }) {
    const months = useMemo(() => {
        const result = [];
        const now = new Date();

        for (let i = 5; i >= 0; i--) {
            const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
            const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);

            const monthRevenue = invoices
                .filter(inv => {
                    if (inv.status !== 'paid' || !inv.paidDate) return false;
                    const paidDate = new Date(inv.paidDate);
                    return paidDate >= monthStart && paidDate <= monthEnd;
                })
                .reduce((sum, inv) => sum + (inv.total || 0), 0);

            const monthExpenses = expenses
                .filter(exp => {
                    if (!exp.date) return false;
                    const expDate = new Date(exp.date);
                    return expDate >= monthStart && expDate <= monthEnd;
                })
                .reduce((sum, exp) => sum + (exp.amount || 0), 0);

            const monthCrewCosts = crewBookings
                .filter(b => {
                    if (b.status === 'cancelled' || !b.startDate) return false;
                    const bDate = new Date(b.startDate);
                    return bDate >= monthStart && bDate <= monthEnd;
                })
                .reduce((sum, b) => sum + (b.totalCost || 0), 0);

            const totalCosts = monthExpenses + monthCrewCosts;

            result.push({
                month: date.toLocaleDateString('en-GB', { month: 'short' }),
                revenue: monthRevenue,
                expenses: monthExpenses,
                crewCosts: monthCrewCosts,
                totalCosts,
                profit: monthRevenue - totalCosts,
            });
        }

        return result;
    }, [invoices, expenses, crewBookings]);

    const maxValue = Math.max(...months.map(m => Math.max(m.revenue, m.totalCosts)), 1);

    return (
        <div className="flex items-end justify-between gap-2 h-32">
            {months.map((month, idx) => (
                <div key={idx} className="flex-1 flex flex-col items-center gap-1">
                    <div className="w-full flex gap-0.5 items-end h-24">
                        <div
                            className="flex-1 bg-green-500/30 rounded-t"
                            style={{ height: `${(month.revenue / maxValue) * 100}%` }}
                            title={`Revenue: ${formatCurrency(month.revenue, displayCurrency)}`}
                        />
                        <div
                            className="flex-1 bg-orange-500/30 rounded-t"
                            style={{ height: `${(month.crewCosts / maxValue) * 100}%` }}
                            title={`Crew: ${formatCurrency(month.crewCosts, displayCurrency)}`}
                        />
                        <div
                            className="flex-1 bg-red-500/30 rounded-t"
                            style={{ height: `${(month.expenses / maxValue) * 100}%` }}
                            title={`Expenses: ${formatCurrency(month.expenses, displayCurrency)}`}
                        />
                    </div>
                    <div className="text-xs text-gray-500">{month.month}</div>
                </div>
            ))}
        </div>
    );
}

// Crew Cost Summary Card
function CrewCostSummary({ crewBookings, displayCurrency }) {
    const stats = useMemo(() => {
        const active = crewBookings.filter(b => b.status !== 'cancelled');
        return {
            totalCost: active.reduce((sum, b) => sum + (b.totalCost || 0), 0),
            bookingsCount: active.length,
            paidCount: active.filter(b => b.isPaid).length,
            unpaidCost: active.filter(b => !b.isPaid).reduce((sum, b) => sum + (b.totalCost || 0), 0),
        };
    }, [crewBookings]);

    return (
        <div className="bg-dark-card border border-dark-border rounded-xl p-6">
            <h3 className="text-lg font-medium text-gray-200 mb-4 flex items-center gap-2">
                <svg className="w-5 h-5 text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Crew Costs
            </h3>
            <div className="space-y-3">
                <div className="flex justify-between items-center">
                    <span className="text-gray-400">Total Bookings</span>
                    <span className="text-gray-200 font-medium">{stats.bookingsCount}</span>
                </div>
                <div className="flex justify-between items-center">
                    <span className="text-gray-400">Total Cost</span>
                    <span className="text-orange-400 font-semibold">{formatCurrency(stats.totalCost, displayCurrency)}</span>
                </div>
                <div className="flex justify-between items-center">
                    <span className="text-gray-400">Paid</span>
                    <span className="text-green-400">{stats.paidCount} / {stats.bookingsCount}</span>
                </div>
                {stats.unpaidCost > 0 && (
                    <div className="flex justify-between items-center pt-2 border-t border-dark-border">
                        <span className="text-gray-400">Unpaid</span>
                        <span className="text-yellow-400 font-medium">{formatCurrency(stats.unpaidCost, displayCurrency)}</span>
                    </div>
                )}
            </div>
        </div>
    );
}

// Main P&L Page
export default function ProfitLossPage({ onSelectProject }) {
    const { projects, initialize: initProjects } = useProjectStore();
    const { invoices, initialize: initInvoices } = useInvoiceStore();
    const { expenses, initialize: initExpenses } = useExpenseStore();
    const { bookings: crewBookings, initialize: initCrewBookings } = useCrewBookingStore();
    const { clients } = useClientStore();

    // Use global display currency from settings
    const { currency: displayCurrency, rates } = useDisplayCurrency();

    const [timeRange, setTimeRange] = useState('all');
    const [showOnlyActive, setShowOnlyActive] = useState(false);

    // Initialize stores
    useEffect(() => {
        initProjects();
        initInvoices();
        initExpenses();
        initCrewBookings();
    }, [initProjects, initInvoices, initExpenses, initCrewBookings]);

    // Calculate overall stats - now includes crew costs
    const stats = useMemo(() => {
        const totalRevenue = invoices
            .filter(inv => inv.status === 'paid')
            .reduce((sum, inv) => sum + (inv.total || 0), 0);

        const pendingRevenue = invoices
            .filter(inv => inv.status === 'sent')
            .reduce((sum, inv) => sum + (inv.total || 0), 0);

        const totalExpenses = expenses.reduce((sum, exp) => sum + (exp.amount || 0), 0);

        const totalCrewCosts = crewBookings
            .filter(b => b.status !== 'cancelled')
            .reduce((sum, b) => sum + (b.totalCost || 0), 0);

        const totalCosts = totalExpenses + totalCrewCosts;
        const profit = totalRevenue - totalCosts;
        const margin = totalRevenue > 0 ? (profit / totalRevenue) * 100 : 0;

        return {
            totalRevenue,
            pendingRevenue,
            totalExpenses,
            totalCrewCosts,
            totalCosts,
            profit,
            margin,
        };
    }, [invoices, expenses, crewBookings]);

    // Filter projects
    const filteredProjects = useMemo(() => {
        let result = projects;

        if (showOnlyActive) {
            result = result.filter(p => p.status === 'in-progress' || p.status === 'planning');
        }

        return result;
    }, [projects, showOnlyActive]);

    return (
        <div className="p-6 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-100">Profit & Loss</h1>
                    <p className="text-gray-400 text-sm mt-1">Financial overview by project</p>
                </div>
                <div className="flex items-center gap-3">
                    <label className="flex items-center gap-2 text-sm text-gray-400">
                        <input
                            type="checkbox"
                            checked={showOnlyActive}
                            onChange={(e) => setShowOnlyActive(e.target.checked)}
                            className="w-4 h-4 rounded border-dark-border bg-dark-bg text-accent-primary"
                        />
                        Active only
                    </label>
                </div>
            </div>

            {/* Stats - now 5 cards including crew costs */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
                <PLStatsCard
                    label="Revenue"
                    value={formatCurrency(stats.totalRevenue, displayCurrency, 0)}
                    subValue={stats.pendingRevenue > 0 ? `+${formatCurrency(stats.pendingRevenue, displayCurrency, 0)} pending` : null}
                    color="text-green-400"
                    icon={<svg className="w-6 h-6 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                />
                <PLStatsCard
                    label="Crew Costs"
                    value={formatCurrency(stats.totalCrewCosts, displayCurrency, 0)}
                    subValue={`${crewBookings.filter(b => b.status !== 'cancelled').length} bookings`}
                    color="text-orange-400"
                    icon={<svg className="w-6 h-6 text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>}
                />
                <PLStatsCard
                    label="Expenses"
                    value={formatCurrency(stats.totalExpenses, displayCurrency, 0)}
                    subValue={`${expenses.length} items`}
                    color="text-red-400"
                    icon={<svg className="w-6 h-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" /></svg>}
                />
                <PLStatsCard
                    label="Net Profit"
                    value={`${stats.profit >= 0 ? '+' : ''}${formatCurrency(stats.profit, displayCurrency, 0)}`}
                    subValue={stats.totalRevenue > 0 ? `${stats.margin.toFixed(1)}% margin` : null}
                    color={stats.profit >= 0 ? 'text-green-400' : 'text-red-400'}
                    icon={<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke={stats.profit >= 0 ? '#4ade80' : '#f87171'}><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>}
                />
                <PLStatsCard
                    label="Projects"
                    value={projects.filter(p => p.status === 'in-progress').length}
                    subValue={`${projects.length} total`}
                    color="text-blue-400"
                    icon={<svg className="w-6 h-6 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>}
                />
            </div>

            {/* Main content grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                {/* Trend Chart */}
                <div className="lg:col-span-2 bg-dark-card border border-dark-border rounded-xl p-6">
                    <h3 className="text-lg font-medium text-gray-200 mb-4">6-Month Trend</h3>
                    <MonthlyTrend invoices={invoices} expenses={expenses} crewBookings={crewBookings} displayCurrency={displayCurrency} />
                    <div className="flex items-center gap-4 mt-4 text-xs">
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 bg-green-500/50 rounded" />
                            <span className="text-gray-400">Revenue</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 bg-orange-500/50 rounded" />
                            <span className="text-gray-400">Crew</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 bg-red-500/50 rounded" />
                            <span className="text-gray-400">Expenses</span>
                        </div>
                    </div>
                </div>

                {/* Category Breakdown */}
                <div className="bg-dark-card border border-dark-border rounded-xl p-6">
                    <h3 className="text-lg font-medium text-gray-200 mb-4">Cost Breakdown</h3>
                    <CategoryBreakdown expenses={expenses} crewBookings={crewBookings} displayCurrency={displayCurrency} />
                </div>
            </div>

            {/* Project P&L Table - now with crew costs column */}
            <div className="bg-dark-card border border-dark-border rounded-xl overflow-hidden">
                <div className="px-6 py-4 border-b border-dark-border">
                    <h3 className="text-lg font-medium text-gray-200">P&L by Project</h3>
                </div>
                {filteredProjects.length === 0 ? (
                    <div className="p-8 text-center">
                        <svg className="w-12 h-12 mx-auto text-gray-600 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                        </svg>
                        <div className="text-gray-400 mb-2">No projects yet</div>
                        <div className="text-sm text-gray-500">Create projects to track P&L</div>
                    </div>
                ) : (
                    <table className="w-full">
                        <thead>
                            <tr className="bg-dark-bg/50 border-b border-dark-border">
                                <th className="text-left px-4 py-3 text-xs text-gray-400 font-medium uppercase">Project</th>
                                <th className="text-left px-4 py-3 text-xs text-gray-400 font-medium uppercase">Status</th>
                                <th className="text-right px-4 py-3 text-xs text-gray-400 font-medium uppercase">Revenue</th>
                                <th className="text-right px-4 py-3 text-xs text-gray-400 font-medium uppercase">Crew</th>
                                <th className="text-right px-4 py-3 text-xs text-gray-400 font-medium uppercase">Expenses</th>
                                <th className="text-right px-4 py-3 text-xs text-gray-400 font-medium uppercase">Profit</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredProjects.map(project => (
                                <ProjectPLRow
                                    key={project.id}
                                    project={project}
                                    invoices={invoices}
                                    expenses={expenses}
                                    crewBookings={crewBookings}
                                    clients={clients}
                                    onSelect={onSelectProject}
                                    displayCurrency={displayCurrency}
                                />
                            ))}
                        </tbody>
                        <tfoot className="bg-dark-bg/30 border-t border-dark-border">
                            <tr>
                                <td colSpan={2} className="px-4 py-3 text-sm font-medium text-gray-300">
                                    Total
                                </td>
                                <td className="px-4 py-3 text-right text-green-400 font-semibold">
                                    {formatCurrency(stats.totalRevenue, displayCurrency)}
                                </td>
                                <td className="px-4 py-3 text-right text-orange-400 font-semibold">
                                    {formatCurrency(stats.totalCrewCosts, displayCurrency)}
                                </td>
                                <td className="px-4 py-3 text-right text-red-400 font-semibold">
                                    {formatCurrency(stats.totalExpenses, displayCurrency)}
                                </td>
                                <td className={`px-4 py-3 text-right font-bold ${stats.profit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                    {stats.profit >= 0 ? '+' : ''}{formatCurrency(stats.profit, displayCurrency)}
                                </td>
                            </tr>
                        </tfoot>
                    </table>
                )}
            </div>
        </div>
    );
}
