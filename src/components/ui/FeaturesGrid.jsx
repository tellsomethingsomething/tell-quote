import React from 'react';
import { Link } from 'react-router-dom';
import {
    Users,
    FileText,
    Clapperboard,
    Truck,
    Camera,
    FileSpreadsheet,
    DollarSign,
    ArrowRight
} from 'lucide-react';
import { BentoGrid, BentoGridItem } from './BentoGrid';

const features = [
    {
        title: "CRM & Sales",
        description: "Track leads, manage client relationships, and visualize your sales pipeline from prospect to project.",
        header: <div className="flex flex-1 w-full h-full min-h-[6rem] rounded-xl bg-gradient-to-br from-blue-500/10 to-blue-600/5 border border-blue-500/10 items-center justify-center group-hover:bg-blue-500/20 transition-colors"><Users className="w-10 h-10 text-blue-400" /></div>,
        link: "/features/crm"
    },
    {
        title: "Intelligent Quoting",
        description: "Build beautiful, itemized quotes in minutes. Drag-and-drop templates, regional rate cards, and digital signing.",
        header: <div className="flex flex-1 w-full h-full min-h-[6rem] rounded-xl bg-gradient-to-br from-marketing-primary/10 to-marketing-primary/5 border border-marketing-primary/10 items-center justify-center group-hover:bg-marketing-primary/20 transition-colors"><FileText className="w-10 h-10 text-marketing-primary" /></div>,
        link: "/features/quoting"
    },
    {
        title: "Project Management",
        description: "Kanban boards, Gantt charts, and status workflows built specifically for video and event production life-cycles.",
        header: <div className="flex flex-1 w-full h-full min-h-[6rem] rounded-xl bg-gradient-to-br from-purple-500/10 to-purple-600/5 border border-purple-500/10 items-center justify-center group-hover:bg-purple-500/20 transition-colors"><Clapperboard className="w-10 h-10 text-purple-400" /></div>,
        link: "/features/projects"
    },
    {
        title: "Crew Network",
        description: "Manage your database of freelancers. Track day rates, skills, location, and availability in one searchable place.",
        header: <div className="flex flex-1 w-full h-full min-h-[6rem] rounded-xl bg-gradient-to-br from-orange-500/10 to-orange-600/5 border border-orange-500/10 items-center justify-center group-hover:bg-orange-500/20 transition-colors"><Truck className="w-10 h-10 text-orange-400" /></div>,
        link: "/features/crew"
    },
    {
        title: "Equipment Tracking",
        description: "Know where every piece of gear is. Check-in/out, kits, maintenance schedules, and conflict detection.",
        header: <div className="flex flex-1 w-full h-full min-h-[6rem] rounded-xl bg-gradient-to-br from-red-500/10 to-red-600/5 border border-red-500/10 items-center justify-center group-hover:bg-red-500/20 transition-colors"><Camera className="w-10 h-10 text-red-400" /></div>,
        link: "/features/equipment"
    },
    {
        title: "Call Sheets",
        description: "Generate professional call sheets in one click. Weather auto-sync, map integration, and automated distribution.",
        header: <div className="flex flex-1 w-full h-full min-h-[6rem] rounded-xl bg-gradient-to-br from-purple-500/10 to-purple-600/5 border border-purple-500/10 items-center justify-center group-hover:bg-purple-500/20 transition-colors"><FileSpreadsheet className="w-10 h-10 text-purple-400" /></div>,
        link: "/features/call-sheets"
    },
    {
        title: "Financials & Invoicing",
        description: "Turn quotes into invoices instantly. Track expenses, POs, and real-time project P&L without spreadsheet headaches.",
        header: <div className="flex flex-1 w-full h-full min-h-[6rem] rounded-xl bg-gradient-to-br from-green-500/10 to-green-600/5 border border-green-500/10 items-center justify-center group-hover:bg-green-500/20 transition-colors"><DollarSign className="w-10 h-10 text-green-400" /></div>,
        link: "/features/financials"
    }
];

export default function FeaturesGrid() {
    return (
        <div className="py-10">
            <BentoGrid className="max-w-6xl mx-auto md:auto-rows-[18rem]">
                {features.map((item, i) => (
                    <Link to={item.link} key={i} className={i === 3 || i === 6 ? "md:col-span-2" : ""}>
                        <BentoGridItem
                            title={
                                <span className="flex items-center gap-2 group-hover:text-marketing-primary transition-colors">
                                    {item.title} <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                                </span>
                            }
                            description={item.description}
                            header={item.header}
                            className={i === 3 || i === 6 ? "md:col-span-2" : ""}
                        />
                    </Link>
                ))}
            </BentoGrid>
        </div>
    );
}

