import React from 'react';
import { Search, Camera, Check, AlertTriangle, Package } from 'lucide-react';

export default function EquipmentMockup() {
    return (
        <div className="w-full bg-marketing-surface border border-marketing-border rounded-xl overflow-hidden shadow-2xl flex flex-col aspect-[16/10] text-left font-sans select-none">
            {/* Header */}
            <div className="h-14 border-b border-marketing-border bg-marketing-surface flex items-center justify-between px-6">
                <div className="flex items-center gap-4">
                    <h3 className="font-bold text-marketing-text-primary">Equipment Inventory</h3>
                    <div className="flex gap-2">
                        {['All', 'Cameras', 'Lenses', 'Lighting', 'Audio'].map((tab, i) => (
                            <button key={tab} className={`px-3 py-1 rounded-md text-xs font-medium ${i === 0 ? 'bg-marketing-primary/10 text-marketing-primary' : 'text-marketing-text-secondary hover:bg-marketing-background'}`}>
                                {tab}
                            </button>
                        ))}
                    </div>
                </div>
                <button className="bg-marketing-primary text-white px-3 py-1.5 rounded-md text-sm font-medium">
                    + Add Item
                </button>
            </div>

            {/* Body */}
            <div className="flex-1 bg-marketing-background p-6 overflow-hidden">
                <div className="bg-marketing-surface border border-marketing-border rounded-lg overflow-hidden">
                    {/* Table Header */}
                    <div className="grid grid-cols-12 gap-4 p-3 border-b border-marketing-border text-xs font-medium text-marketing-text-secondary uppercase tracking-wide">
                        <div className="col-span-4">Item</div>
                        <div className="col-span-2">Serial #</div>
                        <div className="col-span-2">Status</div>
                        <div className="col-span-2">Location</div>
                        <div className="col-span-2">Condition</div>
                    </div>

                    {/* Table Rows */}
                    {[
                        { name: 'Sony FX6', category: 'Camera', serial: 'SN-4821903', status: 'Available', location: 'Office', condition: 'Excellent' },
                        { name: 'Canon 24-70mm f/2.8', category: 'Lens', serial: 'SN-7293847', status: 'Checked Out', location: 'Nike Shoot', condition: 'Good' },
                        { name: 'Aputure 600d Pro', category: 'Lighting', serial: 'SN-1928374', status: 'Available', location: 'Office', condition: 'Excellent' },
                        { name: 'Sennheiser MKH 416', category: 'Audio', serial: 'SN-5748392', status: 'Maintenance', location: 'Repair Shop', condition: 'Needs Repair' },
                        { name: 'DJI RS3 Pro', category: 'Gimbal', serial: 'SN-8473920', status: 'Available', location: 'Office', condition: 'Good' },
                    ].map((item, i) => (
                        <div key={i} className="grid grid-cols-12 gap-4 p-3 border-b border-marketing-border/50 hover:bg-marketing-background/50 transition-colors items-center">
                            <div className="col-span-4 flex items-center gap-3">
                                <div className="w-8 h-8 rounded bg-marketing-background border border-marketing-border flex items-center justify-center">
                                    <Camera size={14} className="text-marketing-text-secondary" />
                                </div>
                                <div>
                                    <div className="font-medium text-marketing-text-primary text-sm">{item.name}</div>
                                    <div className="text-xs text-marketing-text-secondary">{item.category}</div>
                                </div>
                            </div>
                            <div className="col-span-2 text-xs text-marketing-text-secondary font-mono">{item.serial}</div>
                            <div className="col-span-2">
                                <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${item.status === 'Available' ? 'bg-green-500/10 text-green-400' :
                                        item.status === 'Checked Out' ? 'bg-blue-500/10 text-blue-400' :
                                            'bg-orange-500/10 text-orange-400'
                                    }`}>
                                    {item.status}
                                </span>
                            </div>
                            <div className="col-span-2 text-xs text-marketing-text-secondary">{item.location}</div>
                            <div className="col-span-2 flex items-center gap-1 text-xs">
                                {item.condition === 'Excellent' && <Check size={12} className="text-green-400" />}
                                {item.condition === 'Needs Repair' && <AlertTriangle size={12} className="text-orange-400" />}
                                <span className="text-marketing-text-secondary">{item.condition}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
