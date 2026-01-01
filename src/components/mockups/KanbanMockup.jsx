import React from 'react';
import { MoreHorizontal, Plus, Calendar, MessageSquare, Paperclip } from 'lucide-react';

export default function KanbanMockup() {
    return (
        <div className="w-full bg-marketing-surface border border-marketing-border rounded-xl overflow-hidden shadow-2xl flex flex-col min-h-[280px] sm:min-h-0 sm:aspect-[16/10] text-left font-sans select-none">
            {/* Mock Header */}
            <div className="h-10 sm:h-14 border-b border-marketing-border bg-marketing-surface flex items-center justify-between px-3 sm:px-6">
                <div className="flex items-center gap-2 sm:gap-4">
                    <h3 className="font-bold text-marketing-text-primary text-xs sm:text-base">Production Schedule</h3>
                    <div className="flex -space-x-1.5 sm:-space-x-2">
                        {[1, 2, 3].map(i => (
                            <div key={i} className={`w-5 h-5 sm:w-8 sm:h-8 rounded-full border-2 border-marketing-surface bg-gray-${i * 100 + 400} flex items-center justify-center text-[8px] sm:text-[10px] text-white font-bold bg-gradient-to-br from-indigo-500 to-purple-500`}>
                                {String.fromCharCode(64 + i)}
                            </div>
                        ))}
                        <div className="w-5 h-5 sm:w-8 sm:h-8 rounded-full border-2 border-marketing-surface bg-marketing-background flex items-center justify-center text-[8px] sm:text-[10px] text-marketing-text-secondary font-bold">
                            +4
                        </div>
                    </div>
                </div>
                <div className="flex gap-1 sm:gap-2">
                    <button className="hidden sm:block bg-marketing-primary/10 text-marketing-primary px-3 py-1.5 rounded-md text-sm font-medium hover:bg-marketing-primary/20 transition-colors">
                        Filter
                    </button>
                    <button className="bg-marketing-primary text-white px-2 sm:px-3 py-1 sm:py-1.5 rounded-md text-[10px] sm:text-sm font-medium hover:bg-marketing-primary/90 transition-colors flex items-center gap-1">
                        <Plus size={12} className="sm:w-[14px] sm:h-[14px]" /> <span className="hidden sm:inline">New Project</span><span className="sm:hidden">New</span>
                    </button>
                </div>
            </div>

            {/* Board Area */}
            <div className="flex-1 bg-marketing-background p-2 sm:p-6 overflow-hidden">
                <div className="grid grid-cols-3 gap-2 sm:gap-6 h-full">
                    {/* Columns */}
                    {[
                        { title: 'Pre-Production', shortTitle: 'Pre-Prod', color: 'border-orange-400', count: 3 },
                        { title: 'In Production', shortTitle: 'In Prod', color: 'border-blue-400', count: 2 },
                        { title: 'Post-Production', shortTitle: 'Post-Prod', color: 'border-green-400', count: 4 },
                    ].map((col, i) => (
                        <div key={i} className="flex flex-col h-full min-h-0">
                            <div className={`flex items-center justify-between mb-2 sm:mb-4 pb-1 sm:pb-2 border-b-2 ${col.color}`}>
                                <h4 className="font-semibold text-marketing-text-primary text-[10px] sm:text-sm flex items-center gap-1 sm:gap-2">
                                    <span className="hidden sm:inline">{col.title}</span>
                                    <span className="sm:hidden">{col.shortTitle}</span>
                                    <span className="bg-marketing-surface px-1 sm:px-1.5 py-0.5 rounded text-[8px] sm:text-xs text-marketing-text-secondary">{col.count}</span>
                                </h4>
                                <MoreHorizontal size={10} className="text-marketing-text-secondary sm:w-[14px] sm:h-[14px] hidden sm:block" />
                            </div>

                            <div className="flex-1 space-y-1.5 sm:space-y-3">
                                {[1, 2].map((card, j) => (
                                    <div key={j} className="bg-marketing-surface border border-marketing-border p-1.5 sm:p-4 rounded-lg shadow-sm">
                                        <div className="flex justify-between items-start mb-1 sm:mb-2">
                                            <span className="text-[7px] sm:text-[10px] font-bold uppercase tracking-wider text-blue-400 bg-blue-400/10 px-1 sm:px-2 py-0.5 rounded-full">Commercial</span>
                                            {j === 0 && <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-red-500" />}
                                        </div>
                                        <h5 className="font-bold text-marketing-text-primary text-[9px] sm:text-sm mb-1 sm:mb-3 truncate">
                                            {i === 0 ? (j === 0 ? 'Nike Campaign' : 'Lexus TVC') :
                                                i === 1 ? (j === 0 ? 'Spotify Event' : 'Docu-Series') :
                                                    'Red Bull Cut'}
                                        </h5>

                                        <div className="flex items-center justify-between text-marketing-text-secondary text-[8px] sm:text-xs mt-1 sm:mt-4">
                                            <div className="flex items-center gap-1.5 sm:gap-3">
                                                <span className="flex items-center gap-0.5"><Paperclip size={8} className="sm:w-3 sm:h-3" /> 2</span>
                                                <span className="flex items-center gap-0.5"><MessageSquare size={8} className="sm:w-3 sm:h-3" /> 5</span>
                                            </div>
                                            <div className="flex items-center gap-0.5 text-orange-400">
                                                <Calendar size={8} className="sm:w-3 sm:h-3" />
                                                <span>{12 + j + i * 2} Oct</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {/* Ghost Card - hidden on mobile */}
                                {i === 0 && (
                                    <div className="hidden sm:flex border-2 border-dashed border-marketing-border rounded-lg p-4 items-center justify-center text-marketing-text-secondary/50 text-sm h-24">
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
