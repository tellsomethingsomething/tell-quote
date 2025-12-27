import React from 'react';
import { Check, Clock, AlertCircle, FileVideo, Image, Music, MoreHorizontal, ChevronRight } from 'lucide-react';

export default function DeliverablesMockup() {
    return (
        <div className="w-full bg-marketing-surface border border-marketing-border rounded-xl overflow-hidden shadow-2xl flex flex-col aspect-[16/10] text-left font-sans select-none">
            {/* Header */}
            <div className="h-14 border-b border-marketing-border bg-marketing-surface flex items-center justify-between px-6">
                <div className="flex items-center gap-4">
                    <h3 className="font-bold text-marketing-text-primary">Nike Fall Campaign</h3>
                    <span className="text-xs text-marketing-text-secondary">12 deliverables</span>
                </div>
                <div className="flex items-center gap-3">
                    <span className="text-xs text-marketing-text-secondary">8 delivered</span>
                    <div className="w-32 h-2 bg-marketing-background rounded-full overflow-hidden">
                        <div className="w-2/3 h-full bg-green-400 rounded-full" />
                    </div>
                </div>
            </div>

            {/* Body */}
            <div className="flex-1 bg-marketing-background p-6 overflow-hidden">
                <div className="bg-marketing-surface border border-marketing-border rounded-lg overflow-hidden h-full">
                    {/* Table Header */}
                    <div className="grid grid-cols-12 gap-4 p-3 border-b border-marketing-border text-xs font-medium text-marketing-text-secondary uppercase tracking-wide">
                        <div className="col-span-4">Deliverable</div>
                        <div className="col-span-2">Type</div>
                        <div className="col-span-2">Status</div>
                        <div className="col-span-2">Version</div>
                        <div className="col-span-2">Due Date</div>
                    </div>

                    {/* Table Rows */}
                    {[
                        { name: 'Hero Video (16:9)', type: 'Video', icon: FileVideo, status: 'Delivered', version: 'v3 Final', due: 'Dec 15', color: 'green' },
                        { name: 'Social Cut (1:1)', type: 'Video', icon: FileVideo, status: 'Delivered', version: 'v2', due: 'Dec 16', color: 'green' },
                        { name: 'Social Cut (9:16)', type: 'Video', icon: FileVideo, status: 'In Review', version: 'v1', due: 'Dec 18', color: 'blue' },
                        { name: 'BTS Video', type: 'Video', icon: FileVideo, status: 'In Progress', version: 'v1', due: 'Dec 20', color: 'yellow' },
                        { name: 'Hero Stills (5)', type: 'Photo', icon: Image, status: 'Delivered', version: 'Final', due: 'Dec 15', color: 'green' },
                        { name: 'Product Shots (10)', type: 'Photo', icon: Image, status: 'Overdue', version: 'v1', due: 'Dec 14', color: 'red' },
                        { name: 'Music License', type: 'Audio', icon: Music, status: 'Pending', version: '-', due: 'Dec 22', color: 'gray' },
                    ].map((item, i) => (
                        <div key={i} className="grid grid-cols-12 gap-4 p-3 border-b border-marketing-border/50 hover:bg-marketing-background/50 transition-colors items-center">
                            <div className="col-span-4 flex items-center gap-3">
                                <div className="w-8 h-8 rounded bg-marketing-background border border-marketing-border flex items-center justify-center">
                                    <item.icon size={14} className="text-marketing-text-secondary" />
                                </div>
                                <span className="font-medium text-marketing-text-primary text-sm">{item.name}</span>
                            </div>
                            <div className="col-span-2 text-xs text-marketing-text-secondary">{item.type}</div>
                            <div className="col-span-2">
                                <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${item.color === 'green' ? 'bg-green-500/10 text-green-400' :
                                        item.color === 'blue' ? 'bg-blue-500/10 text-blue-400' :
                                            item.color === 'yellow' ? 'bg-yellow-500/10 text-yellow-400' :
                                                item.color === 'red' ? 'bg-red-500/10 text-red-400' :
                                                    'bg-marketing-border/50 text-marketing-text-secondary'
                                    }`}>
                                    {item.status}
                                </span>
                            </div>
                            <div className="col-span-2 text-xs text-marketing-text-secondary font-medium">{item.version}</div>
                            <div className="col-span-2 flex items-center gap-2 text-xs">
                                {item.color === 'red' && <AlertCircle size={12} className="text-red-400" />}
                                <span className={item.color === 'red' ? 'text-red-400 font-medium' : 'text-marketing-text-secondary'}>{item.due}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
