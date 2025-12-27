import React from 'react';
import { MapPin, Clock, Sun, Cloud, Phone, Mail, Download } from 'lucide-react';

export default function CallSheetMockup() {
    return (
        <div className="w-full bg-marketing-surface border border-marketing-border rounded-xl overflow-hidden shadow-2xl flex flex-col aspect-[16/10] text-left font-sans select-none">
            {/* Header */}
            <div className="h-16 border-b border-marketing-border bg-marketing-surface flex items-center justify-between px-6">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-green-500/10 text-green-500 border border-green-500/20">FINAL</span>
                        <span className="text-xs text-marketing-text-secondary">Call Sheet v3</span>
                    </div>
                    <h3 className="font-bold text-marketing-text-primary">Nike Summer Campaign - Day 1</h3>
                </div>
                <div className="flex gap-3">
                    <button className="w-9 h-9 flex items-center justify-center rounded-lg border border-marketing-border text-marketing-text-secondary hover:bg-marketing-background">
                        <Download size={18} />
                    </button>
                    <button className="bg-marketing-primary text-white px-4 py-2 rounded-lg text-sm font-bold">
                        Send to Crew
                    </button>
                </div>
            </div>

            {/* Body */}
            <div className="flex-1 bg-marketing-background p-6 overflow-hidden grid grid-cols-3 gap-4">
                {/* Left Column - Details */}
                <div className="space-y-4">
                    {/* Location */}
                    <div className="bg-marketing-surface border border-marketing-border p-4 rounded-lg">
                        <h4 className="font-bold text-marketing-text-primary text-sm mb-3 flex items-center gap-2">
                            <MapPin size={14} className="text-marketing-primary" /> Location
                        </h4>
                        <div className="text-sm text-marketing-text-primary mb-1">Griffith Observatory</div>
                        <div className="text-xs text-marketing-text-secondary mb-2">2800 E Observatory Rd, LA</div>
                        <div className="text-xs text-marketing-text-secondary">Parking: Lot B, enter via Vermont</div>
                    </div>

                    {/* Weather */}
                    <div className="bg-marketing-surface border border-marketing-border p-4 rounded-lg">
                        <h4 className="font-bold text-marketing-text-primary text-sm mb-3">Weather Forecast</h4>
                        <div className="flex items-center gap-4">
                            <Sun size={32} className="text-yellow-400" />
                            <div>
                                <div className="text-2xl font-bold text-marketing-text-primary">72°F</div>
                                <div className="text-xs text-marketing-text-secondary">Sunny, low wind</div>
                            </div>
                        </div>
                    </div>

                    {/* Emergency */}
                    <div className="bg-red-500/5 border border-red-500/10 p-4 rounded-lg">
                        <h4 className="font-bold text-red-400 text-sm mb-2">Nearest Hospital</h4>
                        <div className="text-xs text-marketing-text-secondary">Hollywood Presbyterian</div>
                        <div className="text-xs text-marketing-text-secondary">1300 N Vermont Ave (2.1 mi)</div>
                    </div>
                </div>

                {/* Middle & Right - Crew List */}
                <div className="col-span-2 bg-marketing-surface border border-marketing-border rounded-lg overflow-hidden">
                    <div className="p-4 border-b border-marketing-border">
                        <h4 className="font-bold text-marketing-text-primary text-sm">Crew Call Times</h4>
                    </div>
                    <div className="divide-y divide-marketing-border/50">
                        {[
                            { name: 'James Chen', role: 'Director of Photography', call: '6:00 AM', phone: '+1 555-0123' },
                            { name: 'Maria Santos', role: 'Producer', call: '5:30 AM', phone: '+1 555-0124' },
                            { name: 'Alex Kim', role: 'Gaffer', call: '6:30 AM', phone: '+1 555-0125' },
                            { name: 'Sarah Johnson', role: 'Sound Recordist', call: '6:30 AM', phone: '+1 555-0126' },
                            { name: 'David Park', role: '1st AC', call: '6:00 AM', phone: '+1 555-0127' },
                            { name: 'Emma Wilson', role: 'DIT', call: '7:00 AM', phone: '+1 555-0128' },
                        ].map((crew, i) => (
                            <div key={i} className="grid grid-cols-12 gap-4 p-3 items-center hover:bg-marketing-background/50">
                                <div className="col-span-4 flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-marketing-primary to-marketing-accent flex items-center justify-center text-white font-bold text-xs">
                                        {crew.name.split(' ').map(n => n[0]).join('')}
                                    </div>
                                    <div>
                                        <div className="font-medium text-marketing-text-primary text-sm">{crew.name}</div>
                                        <div className="text-xs text-marketing-text-secondary">{crew.role}</div>
                                    </div>
                                </div>
                                <div className="col-span-3 flex items-center gap-2 text-sm">
                                    <Clock size={12} className="text-marketing-primary" />
                                    <span className="font-bold text-marketing-text-primary">{crew.call}</span>
                                </div>
                                <div className="col-span-5 flex items-center gap-2 text-xs text-marketing-text-secondary">
                                    <Phone size={12} /> {crew.phone}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
