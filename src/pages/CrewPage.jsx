import { useState, useMemo } from 'react';
import { useCrewStore, CREW_DEPARTMENTS, AVAILABILITY_STATUS } from '../store/crewStore';

// Crew Card Component
function CrewCard({ member, onSelect, onToggleFavorite }) {
    const deptColor = CREW_DEPARTMENTS[member.department]?.color || '#6B7280';
    const availStatus = AVAILABILITY_STATUS[member.availabilityStatus] || AVAILABILITY_STATUS.available;

    return (
        <div
            onClick={() => onSelect(member.id)}
            className="bg-dark-card border border-dark-border rounded-xl p-4 hover:border-gray-600 transition-all cursor-pointer group"
        >
            {/* Header */}
            <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                    {/* Avatar */}
                    <div
                        className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg"
                        style={{ backgroundColor: deptColor }}
                    >
                        {member.firstName[0]}{member.lastName[0]}
                    </div>
                    <div>
                        <h3 className="font-semibold text-white group-hover:text-accent-primary transition-colors">
                            {member.firstName} {member.lastName}
                        </h3>
                        <p className="text-sm text-gray-400">{member.roleTitle || 'Freelancer'}</p>
                    </div>
                </div>
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onToggleFavorite(member.id);
                    }}
                    className={`p-1.5 rounded-lg transition-colors ${
                        member.isFavorite
                            ? 'text-yellow-400 bg-yellow-400/10'
                            : 'text-gray-500 hover:text-yellow-400 hover:bg-yellow-400/10'
                    }`}
                >
                    <svg className="w-5 h-5" fill={member.isFavorite ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                    </svg>
                </button>
            </div>

            {/* Department & Availability */}
            <div className="flex items-center gap-2 mb-3">
                <span
                    className="px-2 py-0.5 rounded-full text-xs font-medium"
                    style={{ backgroundColor: `${deptColor}20`, color: deptColor }}
                >
                    {CREW_DEPARTMENTS[member.department]?.label || 'Other'}
                </span>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium bg-${availStatus.color}-500/20 text-${availStatus.color}-400`}>
                    {availStatus.label}
                </span>
            </div>

            {/* Contact */}
            <div className="space-y-1 text-sm text-gray-400 mb-3">
                {member.email && (
                    <div className="flex items-center gap-2 truncate">
                        <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        <span className="truncate">{member.email}</span>
                    </div>
                )}
                {member.phone && (
                    <div className="flex items-center gap-2">
                        <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                        <span>{member.phone}</span>
                    </div>
                )}
                {member.city && (
                    <div className="flex items-center gap-2">
                        <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <span>{member.city}{member.country ? `, ${member.country}` : ''}</span>
                    </div>
                )}
            </div>

            {/* Rate & Rating */}
            <div className="flex items-center justify-between pt-3 border-t border-dark-border">
                <div>
                    {member.dayRate > 0 && (
                        <p className="text-sm">
                            <span className="text-accent-primary font-semibold">
                                {member.currency} {member.dayRate.toLocaleString()}
                            </span>
                            <span className="text-gray-500">/day</span>
                        </p>
                    )}
                </div>
                {member.rating > 0 && (
                    <div className="flex items-center gap-1">
                        <svg className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                        </svg>
                        <span className="text-sm text-gray-300">{member.rating.toFixed(1)}</span>
                    </div>
                )}
            </div>

            {/* Skills */}
            {member.skills.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-3">
                    {member.skills.slice(0, 3).map((skill, i) => (
                        <span key={i} className="px-2 py-0.5 bg-gray-800 rounded text-xs text-gray-400">
                            {skill}
                        </span>
                    ))}
                    {member.skills.length > 3 && (
                        <span className="px-2 py-0.5 text-xs text-gray-500">
                            +{member.skills.length - 3} more
                        </span>
                    )}
                </div>
            )}
        </div>
    );
}

// New Crew Modal
function NewCrewModal({ isOpen, onClose }) {
    const addCrew = useCrewStore(state => state.addCrew);
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        department: '',
        roleTitle: '',
        dayRate: '',
        currency: 'USD',
        city: '',
        country: '',
    });

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.firstName || !form.lastName) return;

        setSaving(true);
        try {
            await addCrew({
                ...form,
                dayRate: parseFloat(form.dayRate) || 0,
            });
            onClose(true);
            setForm({
                firstName: '',
                lastName: '',
                email: '',
                phone: '',
                department: '',
                roleTitle: '',
                dayRate: '',
                currency: 'USD',
                city: '',
                country: '',
            });
        } catch (err) {
            console.error('Failed to add crew:', err);
            alert('Failed to add crew member');
        } finally {
            setSaving(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
            <div className="bg-[#1a1f2e] border border-dark-border rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
                <div className="p-6 border-b border-dark-border">
                    <h2 className="text-xl font-bold text-white">Add Crew Member</h2>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {/* Name */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm text-gray-400 mb-1">First Name *</label>
                            <input
                                type="text"
                                value={form.firstName}
                                onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                                className="w-full px-3 py-2 bg-dark-bg border border-dark-border rounded-lg text-white focus:border-accent-primary focus:outline-none"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm text-gray-400 mb-1">Last Name *</label>
                            <input
                                type="text"
                                value={form.lastName}
                                onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                                className="w-full px-3 py-2 bg-dark-bg border border-dark-border rounded-lg text-white focus:border-accent-primary focus:outline-none"
                                required
                            />
                        </div>
                    </div>

                    {/* Contact */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm text-gray-400 mb-1">Email</label>
                            <input
                                type="email"
                                value={form.email}
                                onChange={(e) => setForm({ ...form, email: e.target.value })}
                                className="w-full px-3 py-2 bg-dark-bg border border-dark-border rounded-lg text-white focus:border-accent-primary focus:outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-sm text-gray-400 mb-1">Phone</label>
                            <input
                                type="tel"
                                value={form.phone}
                                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                                className="w-full px-3 py-2 bg-dark-bg border border-dark-border rounded-lg text-white focus:border-accent-primary focus:outline-none"
                            />
                        </div>
                    </div>

                    {/* Department & Role */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm text-gray-400 mb-1">Department</label>
                            <select
                                value={form.department}
                                onChange={(e) => setForm({ ...form, department: e.target.value })}
                                className="w-full px-3 py-2 bg-dark-bg border border-dark-border rounded-lg text-white focus:border-accent-primary focus:outline-none"
                            >
                                <option value="">Select department</option>
                                {Object.entries(CREW_DEPARTMENTS).map(([id, dept]) => (
                                    <option key={id} value={id}>{dept.label}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm text-gray-400 mb-1">Role / Title</label>
                            <input
                                type="text"
                                value={form.roleTitle}
                                onChange={(e) => setForm({ ...form, roleTitle: e.target.value })}
                                placeholder="e.g., Director of Photography"
                                className="w-full px-3 py-2 bg-dark-bg border border-dark-border rounded-lg text-white focus:border-accent-primary focus:outline-none"
                            />
                        </div>
                    </div>

                    {/* Rate */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm text-gray-400 mb-1">Day Rate</label>
                            <input
                                type="number"
                                value={form.dayRate}
                                onChange={(e) => setForm({ ...form, dayRate: e.target.value })}
                                placeholder="0"
                                className="w-full px-3 py-2 bg-dark-bg border border-dark-border rounded-lg text-white focus:border-accent-primary focus:outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-sm text-gray-400 mb-1">Currency</label>
                            <select
                                value={form.currency}
                                onChange={(e) => setForm({ ...form, currency: e.target.value })}
                                className="w-full px-3 py-2 bg-dark-bg border border-dark-border rounded-lg text-white focus:border-accent-primary focus:outline-none"
                            >
                                <option value="USD">USD</option>
                                <option value="EUR">EUR</option>
                                <option value="GBP">GBP</option>
                                <option value="SGD">SGD</option>
                                <option value="MYR">MYR</option>
                                <option value="THB">THB</option>
                                <option value="AED">AED</option>
                            </select>
                        </div>
                    </div>

                    {/* Location */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm text-gray-400 mb-1">City</label>
                            <input
                                type="text"
                                value={form.city}
                                onChange={(e) => setForm({ ...form, city: e.target.value })}
                                className="w-full px-3 py-2 bg-dark-bg border border-dark-border rounded-lg text-white focus:border-accent-primary focus:outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-sm text-gray-400 mb-1">Country</label>
                            <input
                                type="text"
                                value={form.country}
                                onChange={(e) => setForm({ ...form, country: e.target.value })}
                                className="w-full px-3 py-2 bg-dark-bg border border-dark-border rounded-lg text-white focus:border-accent-primary focus:outline-none"
                            />
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end gap-3 pt-4">
                        <button
                            type="button"
                            onClick={() => onClose(false)}
                            className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={saving || !form.firstName || !form.lastName}
                            className="px-6 py-2 bg-accent-primary text-white rounded-lg font-medium hover:bg-accent-primary/90 transition-colors disabled:opacity-50"
                        >
                            {saving ? 'Adding...' : 'Add Crew Member'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default function CrewPage({ onSelectCrew }) {
    const { crew, loading, toggleFavorite, getStats } = useCrewStore();
    const [search, setSearch] = useState('');
    const [departmentFilter, setDepartmentFilter] = useState('');
    const [availabilityFilter, setAvailabilityFilter] = useState('');
    const [viewMode, setViewMode] = useState('grid');
    const [showModal, setShowModal] = useState(false);
    const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);

    const stats = getStats();

    // Filter crew
    const filteredCrew = useMemo(() => {
        return crew.filter(member => {
            // Search
            if (search) {
                const q = search.toLowerCase();
                const matches =
                    member.firstName.toLowerCase().includes(q) ||
                    member.lastName.toLowerCase().includes(q) ||
                    member.email.toLowerCase().includes(q) ||
                    member.roleTitle.toLowerCase().includes(q) ||
                    member.skills.some(s => s.toLowerCase().includes(q));
                if (!matches) return false;
            }

            // Department filter
            if (departmentFilter && member.department !== departmentFilter) return false;

            // Availability filter
            if (availabilityFilter && member.availabilityStatus !== availabilityFilter) return false;

            // Favorites only
            if (showFavoritesOnly && !member.isFavorite) return false;

            return true;
        });
    }, [crew, search, departmentFilter, availabilityFilter, showFavoritesOnly]);

    return (
        <div className="p-4 lg:p-6 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-white">Crew & Freelancers</h1>
                    <p className="text-gray-400 text-sm">Manage your talent database</p>
                </div>
                <button
                    onClick={() => setShowModal(true)}
                    className="px-4 py-2 bg-accent-primary text-white rounded-lg font-medium hover:bg-accent-primary/90 transition-colors flex items-center gap-2"
                >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Add Crew
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                <div className="bg-dark-card border border-dark-border rounded-xl p-4">
                    <p className="text-2xl font-bold text-white">{stats.total}</p>
                    <p className="text-sm text-gray-400">Total Crew</p>
                </div>
                <div className="bg-dark-card border border-dark-border rounded-xl p-4">
                    <p className="text-2xl font-bold text-green-400">{stats.available}</p>
                    <p className="text-sm text-gray-400">Available</p>
                </div>
                <div className="bg-dark-card border border-dark-border rounded-xl p-4">
                    <p className="text-2xl font-bold text-yellow-400">{stats.favorites}</p>
                    <p className="text-sm text-gray-400">Favorites</p>
                </div>
                <div className="bg-dark-card border border-dark-border rounded-xl p-4">
                    <p className="text-2xl font-bold text-blue-400">{Object.keys(stats.byDepartment).length}</p>
                    <p className="text-sm text-gray-400">Departments</p>
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
                {/* Search */}
                <div className="flex-1 relative">
                    <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search by name, role, skills..."
                        className="w-full pl-10 pr-4 py-2 bg-dark-card border border-dark-border rounded-lg text-white placeholder-gray-500 focus:border-accent-primary focus:outline-none"
                    />
                </div>

                {/* Department Filter */}
                <select
                    value={departmentFilter}
                    onChange={(e) => setDepartmentFilter(e.target.value)}
                    className="px-3 py-2 bg-dark-card border border-dark-border rounded-lg text-white focus:border-accent-primary focus:outline-none"
                >
                    <option value="">All Departments</option>
                    {Object.entries(CREW_DEPARTMENTS).map(([id, dept]) => (
                        <option key={id} value={id}>{dept.label}</option>
                    ))}
                </select>

                {/* Availability Filter */}
                <select
                    value={availabilityFilter}
                    onChange={(e) => setAvailabilityFilter(e.target.value)}
                    className="px-3 py-2 bg-dark-card border border-dark-border rounded-lg text-white focus:border-accent-primary focus:outline-none"
                >
                    <option value="">All Availability</option>
                    {Object.entries(AVAILABILITY_STATUS).map(([id, status]) => (
                        <option key={id} value={id}>{status.label}</option>
                    ))}
                </select>

                {/* Favorites Toggle */}
                <button
                    onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
                    className={`px-3 py-2 rounded-lg border flex items-center gap-2 transition-colors ${
                        showFavoritesOnly
                            ? 'bg-yellow-400/20 border-yellow-400/30 text-yellow-400'
                            : 'bg-dark-card border-dark-border text-gray-400 hover:text-white'
                    }`}
                >
                    <svg className="w-5 h-5" fill={showFavoritesOnly ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                    </svg>
                    <span className="hidden sm:inline">Favorites</span>
                </button>

                {/* View Toggle */}
                <div className="flex bg-dark-card border border-dark-border rounded-lg overflow-hidden">
                    <button
                        onClick={() => setViewMode('grid')}
                        className={`p-2 ${viewMode === 'grid' ? 'bg-accent-primary/20 text-accent-primary' : 'text-gray-400 hover:text-white'}`}
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                        </svg>
                    </button>
                    <button
                        onClick={() => setViewMode('list')}
                        className={`p-2 ${viewMode === 'list' ? 'bg-accent-primary/20 text-accent-primary' : 'text-gray-400 hover:text-white'}`}
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                        </svg>
                    </button>
                </div>
            </div>

            {/* Loading */}
            {loading && (
                <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent-primary"></div>
                </div>
            )}

            {/* Empty State */}
            {!loading && filteredCrew.length === 0 && (
                <div className="text-center py-12">
                    <svg className="w-16 h-16 mx-auto text-gray-600 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    <h3 className="text-lg font-medium text-white mb-2">No crew members found</h3>
                    <p className="text-gray-400 mb-4">
                        {search || departmentFilter || availabilityFilter
                            ? 'Try adjusting your filters'
                            : 'Add your first crew member to get started'}
                    </p>
                    {!search && !departmentFilter && !availabilityFilter && (
                        <button
                            onClick={() => setShowModal(true)}
                            className="px-4 py-2 bg-accent-primary text-white rounded-lg font-medium hover:bg-accent-primary/90 transition-colors"
                        >
                            Add Crew Member
                        </button>
                    )}
                </div>
            )}

            {/* Grid View */}
            {!loading && filteredCrew.length > 0 && viewMode === 'grid' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredCrew.map(member => (
                        <CrewCard
                            key={member.id}
                            member={member}
                            onSelect={onSelectCrew}
                            onToggleFavorite={toggleFavorite}
                        />
                    ))}
                </div>
            )}

            {/* List View */}
            {!loading && filteredCrew.length > 0 && viewMode === 'list' && (
                <div className="bg-dark-card border border-dark-border rounded-xl overflow-hidden">
                    <table className="w-full">
                        <thead className="bg-dark-bg">
                            <tr className="text-left text-sm text-gray-400">
                                <th className="px-4 py-3 font-medium">Name</th>
                                <th className="px-4 py-3 font-medium hidden sm:table-cell">Department</th>
                                <th className="px-4 py-3 font-medium hidden md:table-cell">Role</th>
                                <th className="px-4 py-3 font-medium hidden lg:table-cell">Rate</th>
                                <th className="px-4 py-3 font-medium">Status</th>
                                <th className="px-4 py-3 font-medium w-10"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-dark-border">
                            {filteredCrew.map(member => {
                                const deptColor = CREW_DEPARTMENTS[member.department]?.color || '#6B7280';
                                const availStatus = AVAILABILITY_STATUS[member.availabilityStatus] || AVAILABILITY_STATUS.available;

                                return (
                                    <tr
                                        key={member.id}
                                        onClick={() => onSelectCrew(member.id)}
                                        className="hover:bg-white/5 cursor-pointer transition-colors"
                                    >
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-3">
                                                <div
                                                    className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium"
                                                    style={{ backgroundColor: deptColor }}
                                                >
                                                    {member.firstName[0]}{member.lastName[0]}
                                                </div>
                                                <div>
                                                    <p className="text-white font-medium">{member.firstName} {member.lastName}</p>
                                                    <p className="text-xs text-gray-500 sm:hidden">{CREW_DEPARTMENTS[member.department]?.label}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 hidden sm:table-cell">
                                            <span
                                                className="px-2 py-0.5 rounded-full text-xs font-medium"
                                                style={{ backgroundColor: `${deptColor}20`, color: deptColor }}
                                            >
                                                {CREW_DEPARTMENTS[member.department]?.label || 'Other'}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-gray-300 hidden md:table-cell">{member.roleTitle || '-'}</td>
                                        <td className="px-4 py-3 hidden lg:table-cell">
                                            {member.dayRate > 0 ? (
                                                <span className="text-accent-primary">{member.currency} {member.dayRate.toLocaleString()}</span>
                                            ) : '-'}
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium bg-${availStatus.color}-500/20 text-${availStatus.color}-400`}>
                                                {availStatus.label}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    toggleFavorite(member.id);
                                                }}
                                                className={`p-1 rounded ${member.isFavorite ? 'text-yellow-400' : 'text-gray-500 hover:text-yellow-400'}`}
                                            >
                                                <svg className="w-4 h-4" fill={member.isFavorite ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                                                </svg>
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}

            {/* New Crew Modal */}
            <NewCrewModal isOpen={showModal} onClose={() => setShowModal(false)} />
        </div>
    );
}
