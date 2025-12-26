import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { DollarSign, Clock, TrendingUp } from 'lucide-react';

export default function ROICalculator() {
    const [projectsPerMonth, setProjectsPerMonth] = useState(5);
    const [avgBudget, setAvgBudget] = useState(15000);
    const [adminHoursPerProject, setAdminHoursPerProject] = useState(10);

    // Calculation Logic
    // Assumption: ProductionOS saves ~40% of admin time
    const timeSavedPerProject = adminHoursPerProject * 0.4;
    const totalHoursSaved = Math.round(timeSavedPerProject * projectsPerMonth * 12);

    // Assumption: $100/hr internal cost for producer/admin time
    const moneySavedAdmin = totalHoursSaved * 100;

    // Assumption: Helps win 10% more quotes due to speed/professionalism
    const increasedRevenue = (avgBudget * projectsPerMonth * 12) * 0.10;

    const totalImpact = moneySavedAdmin + increasedRevenue;

    return (
        <div className="w-full max-w-5xl mx-auto bg-marketing-surface border border-marketing-border rounded-2xl p-8 md:p-12 shadow-2xl">
            <div className="text-center mb-12">
                <h3 className="text-2xl md:text-3xl font-bold mb-4">Calculate Your ROI</h3>
                <p className="text-marketing-text-secondary">See how much time and money ProductionOS can save your studio.</p>
            </div>

            <div className="grid md:grid-cols-2 gap-16">
                {/* Inputs */}
                <div className="space-y-8">
                    <div>
                        <div className="flex justify-between mb-2">
                            <label className="text-sm font-bold text-marketing-text-primary">Projects per Month</label>
                            <span className="text-marketing-primary font-mono">{projectsPerMonth}</span>
                        </div>
                        <input
                            type="range" min="1" max="50" step="1"
                            value={projectsPerMonth} onChange={(e) => setProjectsPerMonth(Number(e.target.value))}
                            className="w-full h-2 bg-marketing-border rounded-lg appearance-none cursor-pointer accent-marketing-primary"
                        />
                    </div>

                    <div>
                        <div className="flex justify-between mb-2">
                            <label className="text-sm font-bold text-marketing-text-primary">Average Project Budget</label>
                            <span className="text-marketing-primary font-mono">${avgBudget.toLocaleString()}</span>
                        </div>
                        <input
                            type="range" min="1000" max="100000" step="1000"
                            value={avgBudget} onChange={(e) => setAvgBudget(Number(e.target.value))}
                            className="w-full h-2 bg-marketing-border rounded-lg appearance-none cursor-pointer accent-marketing-primary"
                        />
                    </div>

                    <div>
                        <div className="flex justify-between mb-2">
                            <label className="text-sm font-bold text-marketing-text-primary">Admin Hours per Project</label>
                            <span className="text-marketing-primary font-mono">{adminHoursPerProject} hrs</span>
                        </div>
                        <input
                            type="range" min="2" max="50" step="1"
                            value={adminHoursPerProject} onChange={(e) => setAdminHoursPerProject(Number(e.target.value))}
                            className="w-full h-2 bg-marketing-border rounded-lg appearance-none cursor-pointer accent-marketing-primary"
                        />
                        <p className="text-xs text-marketing-text-secondary mt-2">Quoting, scheduling, invoicing, reconciling.</p>
                    </div>
                </div>

                {/* Outputs */}
                <div className="bg-marketing-background rounded-xl p-8 border border-marketing-border flex flex-col justify-center space-y-8 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-marketing-success/10 rounded-full blur-3xl -mr-10 -mt-10" />

                    <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-2 text-marketing-text-secondary">
                            <Clock size={16} />
                            <span className="text-sm uppercase tracking-wider font-medium">Time Reclaimed (Yearly)</span>
                        </div>
                        <div className="text-4xl font-bold text-white font-mono">{totalHoursSaved.toLocaleString()} <span className="text-lg text-marketing-text-secondary font-sans font-normal">hours</span></div>
                    </div>

                    <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-2 text-marketing-text-secondary">
                            <TrendingUp size={16} />
                            <span className="text-sm uppercase tracking-wider font-medium">Est. Revenue Increase</span>
                        </div>
                        <div className="text-4xl font-bold text-marketing-success font-mono">+${increasedRevenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
                        <p className="text-xs text-marketing-text-secondary mt-1">Based on winning 10% more bids through speed & presentation.</p>
                    </div>

                    <div className="pt-6 border-t border-marketing-border">
                        <div className="flex items-center justify-between">
                            <span className="font-bold text-marketing-primary">Total Annual Value</span>
                            <span className="text-2xl font-bold text-white">${totalImpact.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
