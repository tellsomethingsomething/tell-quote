import { useQuoteStore } from '../../store/quoteStore';
import { useSettingsStore } from '../../store/settingsStore';
import { CURRENCIES } from '../../data/currencies';

const PROJECT_TYPES = [
    { value: 'broadcast', label: 'Broadcast' },
    { value: 'streaming', label: 'Streaming' },
    { value: 'graphics', label: 'Graphics' },
    { value: 'sports_presentation', label: 'Sports Presentation' },
    { value: 'technical_consultancy', label: 'Technical Management & Consultancy' },
    { value: 'other', label: 'Other' },
];

export default function ProjectDetails({ onGoToSettings }) {
    const { quote, setProjectDetails, setPreparedBy, setQuoteDate, setValidityDays, setRegion } = useQuoteStore();
    const { settings } = useSettingsStore();
    const { project } = quote;
    const users = settings.users || [];

    const handleChange = (field, value) => {
        setProjectDetails({ [field]: value });
    };

    return (
        <div className="card">
            <h3 className="text-sm font-semibold text-gray-300 mb-3 flex items-center gap-2">
                <svg className="w-4 h-4 text-accent-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
                </svg>
                Project Details
            </h3>

            <div className="space-y-5">
                {/* Prepared By */}
                <div>
                    <label className="label">Prepared By</label>
                    <div className="flex gap-2">
                        <select
                            value={quote.preparedBy || 'default'}
                            onChange={(e) => setPreparedBy(e.target.value)}
                            className="input flex-1"
                        >
                            <option value="default" disabled>Select User</option>
                            {users.map(user => (
                                <option key={user.id} value={user.id}>
                                    {user.name}
                                </option>
                            ))}
                        </select>
                        <button
                            className="btn-ghost px-2"
                            title="Manage Users in Settings"
                            onClick={onGoToSettings}
                        >
                            <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                        </button>
                    </div>
                </div>

            </div>

            <div className="grid grid-cols-2 gap-5">
                <div>
                    <label className="label">Quote Date</label>
                    <input
                        type="date"
                        value={quote.quoteDate}
                        onChange={(e) => setQuoteDate(e.target.value)}
                        className="input"
                    />
                </div>
                <div>
                    <label className="label">Valid Until</label>
                    <div className="flex gap-2">
                        <select
                            value={quote.validityDays}
                            onChange={(e) => setValidityDays(e.target.value)}
                            className="input flex-1"
                        >
                            <option value="7">7 Days</option>
                            <option value="14">14 Days</option>
                            <option value="30">30 Days</option>
                            <option value="60">60 Days</option>
                            <option value="90">90 Days</option>
                        </select>
                        <div className="flex items-center justify-center px-3 bg-dark-bg/50 border border-dark-border rounded-lg text-sm text-gray-400 min-w-[100px]">
                            {(() => {
                                if (!quote.quoteDate) return '-';
                                const date = new Date(quote.quoteDate);
                                date.setDate(date.getDate() + (parseInt(quote.validityDays) || 30));
                                return date.toLocaleDateString();
                            })()}
                        </div>
                    </div>
                </div>
            </div>

            <div>
                <label className="label">Project Title</label>
                <input
                    type="text"
                    value={project.title}
                    onChange={(e) => handleChange('title', e.target.value)}
                    placeholder="e.g. Shopee Cup Semi-Final"
                    className="input"
                />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                    <label className="label">Project Type</label>
                    <select
                        value={project.type}
                        onChange={(e) => handleChange('type', e.target.value)}
                        className="input"
                    >
                        {PROJECT_TYPES.map(type => (
                            <option key={type.value} value={type.value}>
                                {type.label}
                            </option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className="label">Region (Rates)</label>
                    <select
                        value={quote.region || 'SEA'}
                        onChange={(e) => setRegion(e.target.value)}
                        className="input"
                    >
                        <option value="MALAYSIA">Malaysia</option>
                        <option value="SEA">South East Asia</option>
                        <option value="GULF">Gulf States</option>
                        <option value="CENTRAL_ASIA">Central Asia</option>
                    </select>
                </div>

                <div>
                    <label className="label">Currency</label>
                    <select
                        value={quote.currency || 'USD'}
                        onChange={(e) => {
                            useQuoteStore.getState().setCurrency(e.target.value);
                        }}
                        className="input"
                    >
                        {Object.values(CURRENCIES).map(c => (
                            <option key={c.code} value={c.code}>
                                {c.symbol} {c.code} - {c.name}
                            </option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className="label">Venue</label>
                    <input
                        type="text"
                        value={project.venue}
                        onChange={(e) => handleChange('venue', e.target.value)}
                        placeholder="e.g. Jalan Besar Stadium"
                        className="input"
                    />
                </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
                <div>
                    <label className="label">Start Date</label>
                    <input
                        type="date"
                        value={project.startDate}
                        onChange={(e) => handleChange('startDate', e.target.value)}
                        className="input"
                    />
                </div>

                <div>
                    <label className="label">End Date</label>
                    <input
                        type="date"
                        value={project.endDate}
                        onChange={(e) => handleChange('endDate', e.target.value)}
                        className="input"
                    />
                </div>
            </div>

            <div>
                <label className="label">Description</label>
                <textarea
                    value={project.description}
                    onChange={(e) => handleChange('description', e.target.value)}
                    placeholder="Brief project description..."
                    rows={2}
                    className="input resize-none"
                />
            </div>
        </div>
    );
}
