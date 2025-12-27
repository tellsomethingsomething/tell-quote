import React from 'react';
import { MoreHorizontal, Plus, Calendar, MessageSquare, Paperclip } from 'lucide-react';

export default function KanbanMockup() {
    return (
        <div className="w-full bg-marketing-surface border border-marketing-border rounded-xl overflow-hidden shadow-2xl flex flex-col aspect-[16/10] text-left font-sans select-none">
            {/* Mock Header */}
            <div className="h-14 border-b border-marketing-border bg-marketing-surface flex items-center justify-between px-6">
                <div className="flex items-center gap-4">
                    <h3 className="font-bold text-marketing-text-primary">Production Schedule</h3>
                    <div className="flex -space-x-2">
                        {[1, 2, 3].map(i => (
                            <div key={i} className={`w-8 h-8 rounded-full border-2 border-marketing-surface bg-gray-${i * 100 + 400} flex items-center justify-center text-[10px] text-white font-bold bg-gradient-to-br from-indigo-500 to-purple-500`}>
                                {String.fromCharCode(64 + i)}
                            </div>
                        ))}
                        <div className="w-8 h-8 rounded-full border-2 border-marketing-surface bg-marketing-background flex items-center justify-center text-[10px] text-marketing-text-secondary font-bold">
                            +4
                        </div>
                    </div>
                </div>
                <div className="flex gap-2">
                    <button className="bg-marketing-primary/10 text-marketing-primary px-3 py-1.5 rounded-md text-sm font-medium hover:bg-marketing-primary/20 transition-colors">
                        Filter
                    </button>
                    <button className="bg-marketing-primary text-white px-3 py-1.5 rounded-md text-sm font-medium hover:bg-marketing-primary/90 transition-colors flex items-center gap-1.5">
                        <Plus size={14} /> New Project
                    </button>
                </div>
            </div>

            {/* Board Area */}
            <div className="flex-1 bg-marketing-background p-6 overflow-hidden">
                <div className="grid grid-cols-3 gap-6 h-full">
                    {/* Columns */}
                    {[
                        { title: 'Pre-Production', color: 'border-orange-400', count: 3 },
                        { title: 'In Production', color: 'border-blue-400', count: 2 },
                        { title: 'Post-Production', color: 'border-green-400', count: 4 },
                    ].map((col, i) => (
                        <div key={i} className="flex flex-col h-full min-h-0">
                            <div className={`flex items-center justify-between mb-4 pb-2 border-b-2 ${col.color}`}>
                                <h4 className="font-semibold text-marketing-text-primary text-sm flex items-center gap-2">
                                    {col.title} <span className="bg-marketing-surface px-1.5 py-0.5 rounded textxs text-marketing-text-secondary">{col.count}</span>
                                </h4>
                                <MoreHorizontal size={14} className="text-marketing-text-secondary" />
                            </div>

                            <div className="flex-1 space-y-3">
                                {[1, 2].map((card, j) => (
                                    <div key={j} className="bg-marketing-surface border border-marketing-border p-4 rounded-lg shadow-sm hover:border-marketing-primary/50 transition-colors cursor-pointer group">
                                        <div className="flex justify-between items-start mb-2">
                                            <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400 bg-blue-400/10 px-2 py-0.5 rounded-full"> Commercial</span>
                                            {j === 0 && <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" title="High Priority" />}
                                        </div>
                                        <h5 className="font-bold text-marketing-text-primary text-sm mb-3">
                                            {i === 0 ? (j === 0 ? 'Nike Summer Campaign' : 'Lexus TVC Spot') :
                                                i === 1 ? (j === 0 ? 'Spotify Live Event' : 'Docu-Series Ep 4') :
                                                    'Red Bull Social Cut'}
                                        </h5>

                                        <div className="flex items-center justify-between text-marketing-text-secondary text-xs mt-4">
                                            <div className="flex items-center gap-3">
                                                <span className="flex items-center gap-1"><Paperclip size={12} /> 2</span>
                                                <span className="flex items-center gap-1"><MessageSquare size={12} /> 5</span>
                                            </div>
                                            <div className="flex items-center gap-1 text-orange-400">
                                                <Calendar size={12} />
                                                <span>{12 + j + i * 2} Oct</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {/* Ghost Card at bottom of col 1 */}
                                {i === 0 && (
                                    <div className="border-2 border-dashed border-marketing-border rounded-lg p-4 flex items-center justify-center text-marketing-text-secondary/50 text-sm h-24">
                                        + Add Task
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
