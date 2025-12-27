import React from 'react';
import { Search, MoreHorizontal, Star, MapPin, Phone, Mail } from 'lucide-react';

export default function CrewMockup() {
    return (
        <div className="w-full bg-marketing-surface border border-marketing-border rounded-xl overflow-hidden shadow-2xl flex flex-col aspect-[16/10] text-left font-sans select-none">
            {/* Header */}
            <div className="h-14 border-b border-marketing-border bg-marketing-surface flex items-center justify-between px-6">
                <div className="flex items-center gap-4">
                    <h3 className="font-bold text-marketing-text-primary">Crew Database</h3>
                    <div className="h-8 bg-marketing-background/50 rounded-md border border-marketing-border w-48 flex items-center px-3 gap-2 text-marketing-text-secondary/50 text-xs">
                        <Search size={14} />
                        <span>Search crew...</span>
                    </div>
                </div>
                <button className="bg-marketing-primary text-white px-3 py-1.5 rounded-md text-sm font-medium">
                    + Add Crew
                </button>
            </div>

            {/* Body */}
            <div className="flex-1 bg-marketing-background p-6 overflow-hidden">
                <div className="grid grid-cols-3 gap-4 h-full">
                    {[
                        { name: 'James Chen', role: 'Director of Photography', rate: '$1,200/day', rating: 5, location: 'Los Angeles', available: true },
                        { name: 'Maria Santos', role: 'Producer', rate: '$950/day', rating: 5, location: 'New York', available: true },
                        { name: 'Alex Kim', role: 'Gaffer', rate: '$650/day', rating: 4, location: 'London', available: false },
                        { name: 'Sarah Johnson', role: 'Sound Recordist', rate: '$700/day', rating: 5, location: 'Sydney', available: true },
                        { name: 'David Park', role: '1st AC', rate: '$550/day', rating: 4, location: 'Vancouver', available: true },
                        { name: 'Emma Wilson', role: 'Editor', rate: '$600/day', rating: 5, location: 'Berlin', available: false },
                    ].map((crew, i) => (
                        <div key={i} className="bg-marketing-surface border border-marketing-border p-4 rounded-lg hover:border-marketing-primary/50 transition-colors cursor-pointer group">
                            <div className="flex items-start justify-between mb-3">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-marketing-primary to-marketing-accent flex items-center justify-center text-white font-bold text-sm">
                                        {crew.name.split(' ').map(n => n[0]).join('')}
                                    </div>
                                    <div>
                                        <div className="font-bold text-marketing-text-primary text-sm">{crew.name}</div>
                                        <div className="text-xs text-marketing-text-secondary">{crew.role}</div>
                                    </div>
                                </div>
                                <span className={`text-[10px] px-2 py-0.5 rounded-full ${crew.available ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                                    {crew.available ? 'Available' : 'Booked'}
                                </span>
                            </div>
                            <div className="flex items-center gap-1 mb-2">
                                {[...Array(5)].map((_, j) => (
                                    <Star key={j} size={12} className={j < crew.rating ? 'text-yellow-400 fill-yellow-400' : 'text-marketing-border'} />
                                ))}
                            </div>
                            <div className="flex items-center justify-between text-xs">
                                <span className="text-marketing-primary font-bold">{crew.rate}</span>
                                <span className="text-marketing-text-secondary flex items-center gap-1">
                                    <MapPin size={10} /> {crew.location}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
