import React from 'react';
import { Search, MoreHorizontal, Star, MapPin, Phone, Mail } from 'lucide-react';
import { useCurrency } from '../../hooks/useCurrency';

export default function CrewMockup() {
    const { formatDayRate } = useCurrency();

    const crewMembers = [
        { name: 'James Chen', role: 'Director of Photography', rate: 1200, rating: 5, location: 'Los Angeles', available: true },
        { name: 'Maria Santos', role: 'Producer', rate: 950, rating: 5, location: 'New York', available: true },
        { name: 'Alex Kim', role: 'Gaffer', rate: 650, rating: 4, location: 'London', available: false },
        { name: 'Sarah Johnson', role: 'Sound Recordist', rate: 700, rating: 5, location: 'Sydney', available: true },
        { name: 'David Park', role: '1st AC', rate: 550, rating: 4, location: 'Vancouver', available: true },
        { name: 'Emma Wilson', role: 'Editor', rate: 600, rating: 5, location: 'Berlin', available: false },
    ];

    return (
        <div className="w-full bg-marketing-surface border border-marketing-border rounded-xl overflow-hidden shadow-2xl flex flex-col min-h-[280px] sm:min-h-0 sm:aspect-[16/10] text-left font-sans select-none">
            {/* Header */}
            <div className="h-10 sm:h-14 border-b border-marketing-border bg-marketing-surface flex items-center justify-between px-3 sm:px-6">
                <div className="flex items-center gap-2 sm:gap-4">
                    <h3 className="font-bold text-marketing-text-primary text-xs sm:text-base">Crew</h3>
                    <div className="hidden sm:flex h-8 bg-marketing-background/50 rounded-md border border-marketing-border w-48 items-center px-3 gap-2 text-marketing-text-secondary/50 text-xs">
                        <Search size={14} />
                        <span>Search crew...</span>
                    </div>
                </div>
                <button className="bg-marketing-primary text-white px-2 sm:px-3 py-1 sm:py-1.5 rounded-md text-[10px] sm:text-sm font-medium">
                    <span className="hidden sm:inline">+ Add Crew</span>
                    <span className="sm:hidden">+ Add</span>
                </button>
            </div>

            {/* Body */}
            <div className="flex-1 bg-marketing-background p-2 sm:p-6 overflow-hidden">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 sm:gap-4 h-full">
                    {crewMembers.map((crew, i) => (
                        <div key={i} className="bg-marketing-surface border border-marketing-border p-1.5 sm:p-4 rounded-lg hover:border-marketing-primary/50 transition-colors cursor-pointer group">
                            <div className="flex items-start justify-between mb-1 sm:mb-3">
                                <div className="flex items-center gap-1.5 sm:gap-3">
                                    <div className="w-6 h-6 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-marketing-primary to-marketing-accent flex items-center justify-center text-white font-bold text-[8px] sm:text-sm shrink-0">
                                        {crew.name.split(' ').map(n => n[0]).join('')}
                                    </div>
                                    <div className="min-w-0">
                                        <div className="font-bold text-marketing-text-primary text-[9px] sm:text-sm truncate">{crew.name.split(' ')[0]}</div>
                                        <div className="text-[7px] sm:text-xs text-marketing-text-secondary truncate">{crew.role.split(' ')[0]}</div>
                                    </div>
                                </div>
                                <span className={`hidden sm:inline-block text-[10px] px-2 py-0.5 rounded-full shrink-0 ${crew.available ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                                    {crew.available ? 'Available' : 'Booked'}
                                </span>
                                <span className={`sm:hidden w-1.5 h-1.5 rounded-full shrink-0 ${crew.available ? 'bg-green-400' : 'bg-red-400'}`} />
                            </div>
                            <div className="hidden sm:flex items-center gap-1 mb-2">
                                {[...Array(5)].map((_, j) => (
                                    <Star key={j} size={12} className={j < crew.rating ? 'text-yellow-400 fill-yellow-400' : 'text-marketing-border'} />
                                ))}
                            </div>
                            <div className="flex items-center justify-between text-[8px] sm:text-xs">
                                <span className="text-marketing-primary font-bold">{formatDayRate(crew.rate)}</span>
                                <span className="text-marketing-text-secondary hidden sm:flex items-center gap-1">
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
