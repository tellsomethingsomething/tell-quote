import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const demoClient = {
    name: "Nike Marketing",
    company: "Nike Inc.",
    email: "marketing@nike.com",
    phone: "+1 503 671 6453",
    contacts: [
        { name: "Sarah Johnson", role: "Marketing Director", avatar: "SJ" },
        { name: "Mike Chen", role: "Brand Manager", avatar: "MC" },
        { name: "Lisa Park", role: "Creative Lead", avatar: "LP" }
    ],
    stats: {
        projects: 5,
        totalValue: 124500,
        avgProjectSize: 24900,
        lastProject: "2 weeks ago"
    },
    activities: [
        { type: "call", date: "2 days ago", note: "Discussed Q1 campaign budget. They want 3 videos.", icon: "phone" },
        { type: "email", date: "1 week ago", note: "Sent revised quote for spring launch.", icon: "mail" },
        { type: "meeting", date: "2 weeks ago", note: "Kickoff meeting for winter campaign.", icon: "calendar" },
        { type: "note", date: "1 month ago", note: "Prefers morning calls. Decision maker is Sarah.", icon: "note" }
    ],
    quotes: [
        { id: "Q-2401", title: "Spring Campaign", value: 15000, status: "sent" },
        { id: "Q-2398", title: "Winter Launch", value: 28000, status: "won" },
        { id: "Q-2385", title: "Product Shoot", value: 12500, status: "won" }
    ]
};

const ActivityIcon = ({ type }) => {
    const icons = {
        phone: (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
        ),
        mail: (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
        ),
        calendar: (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
        ),
        note: (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
        )
    };
    return icons[type] || icons.note;
};

export default function CRMDemo() {
    const [activeTab, setActiveTab] = useState('overview');

    return (
        <div className="p-4 sm:p-6 space-y-4">
            {/* Client Header */}
            <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl flex items-center justify-center text-white font-bold text-lg shrink-0">
                    NK
                </div>
                <div className="flex-1 min-w-0">
                    <h3 className="text-white font-semibold text-lg truncate">{demoClient.name}</h3>
                    <p className="text-gray-400 text-sm">{demoClient.company}</p>
                    <div className="flex flex-wrap gap-2 mt-2">
                        <span className="text-xs text-gray-500 flex items-center gap-1">
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                            {demoClient.email}
                        </span>
                    </div>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                    { label: "Projects", value: demoClient.stats.projects, color: "text-white" },
                    { label: "Lifetime Value", value: `$${(demoClient.stats.totalValue / 1000).toFixed(0)}k`, color: "text-green-400" },
                    { label: "Avg Project", value: `$${(demoClient.stats.avgProjectSize / 1000).toFixed(0)}k`, color: "text-indigo-400" },
                    { label: "Last Project", value: demoClient.stats.lastProject, color: "text-gray-300" }
                ].map((stat, i) => (
                    <motion.div
                        key={stat.label}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="bg-gray-800/50 rounded-lg p-3 text-center"
                    >
                        <p className={`font-bold text-lg ${stat.color}`}>{stat.value}</p>
                        <p className="text-gray-500 text-xs">{stat.label}</p>
                    </motion.div>
                ))}
            </div>

            {/* Tab Navigation */}
            <div className="flex gap-1 bg-gray-800/30 p-1 rounded-lg">
                {['overview', 'activity', 'quotes'].map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`flex-1 py-2 px-3 text-sm rounded-md transition-colors capitalize ${activeTab === tab
                            ? 'bg-indigo-600 text-white'
                            : 'text-gray-400 hover:text-white'
                            }`}
                    >
                        {tab}
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            <AnimatePresence mode="wait">
                {activeTab === 'overview' && (
                    <motion.div
                        key="overview"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="space-y-4"
                    >
                        {/* Contacts */}
                        <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700/50">
                            <h4 className="text-gray-400 text-xs uppercase tracking-wide mb-3">Contacts</h4>
                            <div className="space-y-2">
                                {demoClient.contacts.map((contact) => (
                                    <div key={contact.name} className="flex items-center gap-3">
                                        <div className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center text-xs text-gray-300">
                                            {contact.avatar}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-white text-sm truncate">{contact.name}</p>
                                            <p className="text-gray-500 text-xs">{contact.role}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Quick Actions */}
                        <div className="grid grid-cols-3 gap-2">
                            {[
                                { label: "New Quote", icon: "📝" },
                                { label: "Send Email", icon: "✉️" },
                                { label: "Schedule", icon: "📅" }
                            ].map((action) => (
                                <button
                                    key={action.label}
                                    className="py-3 px-2 bg-gray-700/50 hover:bg-gray-700 rounded-lg text-center transition-colors cursor-not-allowed opacity-75"
                                    disabled
                                >
                                    <span className="block text-lg mb-1">{action.icon}</span>
                                    <span className="text-gray-400 text-xs">{action.label}</span>
                                </button>
                            ))}
                        </div>
                    </motion.div>
                )}

                {activeTab === 'activity' && (
                    <motion.div
                        key="activity"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="bg-gray-800/50 rounded-lg border border-gray-700/50 divide-y divide-gray-700/50"
                    >
                        {demoClient.activities.map((activity, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.1 }}
                                className="p-3 flex gap-3"
                            >
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${activity.type === 'call' ? 'bg-green-500/20 text-green-400' :
                                        activity.type === 'email' ? 'bg-blue-500/20 text-blue-400' :
                                            activity.type === 'meeting' ? 'bg-purple-500/20 text-purple-400' :
                                                'bg-gray-500/20 text-gray-400'
                                    }`}>
                                    <ActivityIcon type={activity.icon} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-white text-sm">{activity.note}</p>
                                    <p className="text-gray-500 text-xs mt-1">{activity.date}</p>
                                </div>
                            </motion.div>
                        ))}
                    </motion.div>
                )}

                {activeTab === 'quotes' && (
                    <motion.div
                        key="quotes"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="space-y-2"
                    >
                        {demoClient.quotes.map((quote, i) => (
                            <motion.div
                                key={quote.id}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.1 }}
                                className="bg-gray-800/50 rounded-lg p-3 border border-gray-700/50 flex items-center justify-between"
                            >
                                <div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-gray-500 text-xs">{quote.id}</span>
                                        <span className={`px-2 py-0.5 rounded text-xs ${quote.status === 'won'
                                                ? 'bg-green-500/20 text-green-400'
                                                : 'bg-amber-500/20 text-amber-400'
                                            }`}>
                                            {quote.status}
                                        </span>
                                    </div>
                                    <p className="text-white text-sm mt-1">{quote.title}</p>
                                </div>
                                <p className="text-white font-semibold">
                                    ${quote.value.toLocaleString()}
                                </p>
                            </motion.div>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
