import { useState, useEffect } from 'react';
import { useCrewStore, CREW_DEPARTMENTS, AVAILABILITY_STATUS } from '../store/crewStore';

// Tab Button Component
function TabButton({ active, onClick, children }) {
    return (
        <button
            onClick={onClick}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                active
                    ? 'bg-accent-primary/20 text-accent-primary'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
        >
            {children}
        </button>
    );
}

// Field Group Component
function FieldGroup({ label, children }) {
    return (
        <div>
            <label className="block text-sm text-gray-400 mb-1">{label}</label>
            {children}
        </div>
    );
}

// Input Field Component
function InputField({ value, onChange, type = 'text', placeholder = '', disabled = false }) {
    return (
        <input
            type={type}
            value={value || ''}
            onChange={onChange}
            placeholder={placeholder}
            disabled={disabled}
            className="w-full px-3 py-2 bg-dark-bg border border-dark-border rounded-lg text-white placeholder-gray-500 focus:border-accent-primary focus:outline-none disabled:opacity-50"
        />
    );
}

// Textarea Component
function TextAreaField({ value, onChange, placeholder = '', rows = 3 }) {
    return (
        <textarea
            value={value || ''}
            onChange={onChange}
            placeholder={placeholder}
            rows={rows}
            className="w-full px-3 py-2 bg-dark-bg border border-dark-border rounded-lg text-white placeholder-gray-500 focus:border-accent-primary focus:outline-none resize-none"
        />
    );
}

// Skills/Tags Editor Component
function TagsEditor({ value, onChange, placeholder = 'Add item...' }) {
    const [inputValue, setInputValue] = useState('');

    const handleAdd = () => {
        if (inputValue.trim() && !value.includes(inputValue.trim())) {
            onChange([...value, inputValue.trim()]);
            setInputValue('');
        }
    };

    const handleRemove = (item) => {
        onChange(value.filter(v => v !== item));
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleAdd();
        }
    };

    return (
        <div className="space-y-2">
            <div className="flex gap-2">
                <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={placeholder}
                    className="flex-1 px-3 py-2 bg-dark-bg border border-dark-border rounded-lg text-white placeholder-gray-500 focus:border-accent-primary focus:outline-none"
                />
                <button
                    type="button"
                    onClick={handleAdd}
                    className="px-3 py-2 bg-accent-primary/20 text-accent-primary rounded-lg hover:bg-accent-primary/30 transition-colors"
                >
                    Add
                </button>
            </div>
            {value.length > 0 && (
                <div className="flex flex-wrap gap-2">
                    {value.map((item, i) => (
                        <span
                            key={i}
                            className="inline-flex items-center gap-1 px-2 py-1 bg-gray-800 rounded-lg text-sm text-gray-300"
                        >
                            {item}
                            <button
                                type="button"
                                onClick={() => handleRemove(item)}
                                className="text-gray-500 hover:text-red-400"
                            >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </span>
                    ))}
                </div>
            )}
        </div>
    );
}

// Star Rating Component
function StarRating({ value, onChange }) {
    return (
        <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
                <button
                    key={star}
                    type="button"
                    onClick={() => onChange(star)}
                    className="p-1 transition-colors"
                >
                    <svg
                        className={`w-6 h-6 ${star <= value ? 'text-yellow-400' : 'text-gray-600'}`}
                        fill={star <= value ? 'currentColor' : 'none'}
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                    </svg>
                </button>
            ))}
            {value > 0 && (
                <button
                    type="button"
                    onClick={() => onChange(0)}
                    className="ml-2 text-xs text-gray-500 hover:text-red-400"
                >
                    Clear
                </button>
            )}
        </div>
    );
}

export default function CrewDetailPage({ crewId, onBack }) {
    const { getCrewById, updateCrew, deleteCrew, toggleFavorite } = useCrewStore();
    const [activeTab, setActiveTab] = useState('profile');
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState(null);
    const [hasChanges, setHasChanges] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    // Load crew member data
    useEffect(() => {
        const member = getCrewById(crewId);
        if (member) {
            setForm({ ...member });
        }
    }, [crewId, getCrewById]);

    // Track changes
    useEffect(() => {
        if (form) {
            const member = getCrewById(crewId);
            setHasChanges(JSON.stringify(form) !== JSON.stringify(member));
        }
    }, [form, crewId, getCrewById]);

    const handleSave = async () => {
        if (!form) return;
        setSaving(true);
        try {
            await updateCrew(crewId, form);
            setHasChanges(false);
        } catch (err) {
            console.error('Failed to save:', err);
            alert('Failed to save changes');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        try {
            await deleteCrew(crewId);
            onBack();
        } catch (err) {
            console.error('Failed to delete:', err);
            alert('Failed to delete crew member');
        }
    };

    const updateField = (field, value) => {
        setForm(prev => ({ ...prev, [field]: value }));
    };

    if (!form) {
        return (
            <div className="p-4 lg:p-6">
                <p className="text-gray-400">Loading...</p>
            </div>
        );
    }

    const deptColor = CREW_DEPARTMENTS[form.department]?.color || '#6B7280';
    const availStatus = AVAILABILITY_STATUS[form.availabilityStatus] || AVAILABILITY_STATUS.available;

    return (
        <div className="p-4 lg:p-6 max-w-5xl mx-auto">
            {/* Header */}
            <div className="flex items-center gap-4 mb-6">
                <button
                    onClick={onBack}
                    className="p-2 text-gray-400 hover:text-white transition-colors"
                >
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                </button>
                <div className="flex items-center gap-4 flex-1">
                    {/* Avatar */}
                    <div
                        className="w-16 h-16 rounded-full flex items-center justify-center text-white font-bold text-2xl shrink-0"
                        style={{ backgroundColor: deptColor }}
                    >
                        {form.firstName[0]}{form.lastName[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 flex-wrap">
                            <h1 className="text-2xl font-bold text-white">
                                {form.firstName} {form.lastName}
                            </h1>
                            <button
                                onClick={() => toggleFavorite(crewId)}
                                className={`p-1.5 rounded-lg transition-colors ${
                                    form.isFavorite
                                        ? 'text-yellow-400 bg-yellow-400/10'
                                        : 'text-gray-500 hover:text-yellow-400 hover:bg-yellow-400/10'
                                }`}
                            >
                                <svg className="w-5 h-5" fill={form.isFavorite ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                                </svg>
                            </button>
                        </div>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                            <span
                                className="px-2 py-0.5 rounded-full text-xs font-medium"
                                style={{ backgroundColor: `${deptColor}20`, color: deptColor }}
                            >
                                {CREW_DEPARTMENTS[form.department]?.label || 'Other'}
                            </span>
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium bg-${availStatus.color}-500/20 text-${availStatus.color}-400`}>
                                {availStatus.label}
                            </span>
                            {form.roleTitle && (
                                <span className="text-sm text-gray-400">{form.roleTitle}</span>
                            )}
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                    {hasChanges && (
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="px-4 py-2 bg-accent-primary text-white rounded-lg font-medium hover:bg-accent-primary/90 transition-colors disabled:opacity-50"
                        >
                            {saving ? 'Saving...' : 'Save Changes'}
                        </button>
                    )}
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
                <TabButton active={activeTab === 'profile'} onClick={() => setActiveTab('profile')}>
                    Profile
                </TabButton>
                <TabButton active={activeTab === 'rates'} onClick={() => setActiveTab('rates')}>
                    Rates & Equipment
                </TabButton>
                <TabButton active={activeTab === 'portfolio'} onClick={() => setActiveTab('portfolio')}>
                    Portfolio
                </TabButton>
                <TabButton active={activeTab === 'notes'} onClick={() => setActiveTab('notes')}>
                    Notes & Tags
                </TabButton>
            </div>

            {/* Profile Tab */}
            {activeTab === 'profile' && (
                <div className="space-y-6">
                    {/* Basic Info */}
                    <div className="bg-dark-card border border-dark-border rounded-xl p-6">
                        <h2 className="text-lg font-semibold text-white mb-4">Basic Information</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FieldGroup label="First Name *">
                                <InputField
                                    value={form.firstName}
                                    onChange={(e) => updateField('firstName', e.target.value)}
                                />
                            </FieldGroup>
                            <FieldGroup label="Last Name *">
                                <InputField
                                    value={form.lastName}
                                    onChange={(e) => updateField('lastName', e.target.value)}
                                />
                            </FieldGroup>
                            <FieldGroup label="Nickname">
                                <InputField
                                    value={form.nickname}
                                    onChange={(e) => updateField('nickname', e.target.value)}
                                    placeholder="Optional"
                                />
                            </FieldGroup>
                            <FieldGroup label="Department">
                                <select
                                    value={form.department || ''}
                                    onChange={(e) => updateField('department', e.target.value)}
                                    className="w-full px-3 py-2 bg-dark-bg border border-dark-border rounded-lg text-white focus:border-accent-primary focus:outline-none"
                                >
                                    <option value="">Select department</option>
                                    {Object.entries(CREW_DEPARTMENTS).map(([id, dept]) => (
                                        <option key={id} value={id}>{dept.label}</option>
                                    ))}
                                </select>
                            </FieldGroup>
                            <FieldGroup label="Role / Title">
                                <InputField
                                    value={form.roleTitle}
                                    onChange={(e) => updateField('roleTitle', e.target.value)}
                                    placeholder="e.g., Director of Photography"
                                />
                            </FieldGroup>
                            <FieldGroup label="Experience (Years)">
                                <InputField
                                    type="number"
                                    value={form.experienceYears}
                                    onChange={(e) => updateField('experienceYears', parseInt(e.target.value) || 0)}
                                />
                            </FieldGroup>
                        </div>
                    </div>

                    {/* Contact Info */}
                    <div className="bg-dark-card border border-dark-border rounded-xl p-6">
                        <h2 className="text-lg font-semibold text-white mb-4">Contact Information</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FieldGroup label="Email">
                                <InputField
                                    type="email"
                                    value={form.email}
                                    onChange={(e) => updateField('email', e.target.value)}
                                />
                            </FieldGroup>
                            <FieldGroup label="Phone (Primary)">
                                <InputField
                                    type="tel"
                                    value={form.phone}
                                    onChange={(e) => updateField('phone', e.target.value)}
                                />
                            </FieldGroup>
                            <FieldGroup label="Phone (Secondary)">
                                <InputField
                                    type="tel"
                                    value={form.phoneSecondary}
                                    onChange={(e) => updateField('phoneSecondary', e.target.value)}
                                />
                            </FieldGroup>
                        </div>
                    </div>

                    {/* Location */}
                    <div className="bg-dark-card border border-dark-border rounded-xl p-6">
                        <h2 className="text-lg font-semibold text-white mb-4">Location</h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <FieldGroup label="City">
                                <InputField
                                    value={form.city}
                                    onChange={(e) => updateField('city', e.target.value)}
                                />
                            </FieldGroup>
                            <FieldGroup label="Country">
                                <InputField
                                    value={form.country}
                                    onChange={(e) => updateField('country', e.target.value)}
                                />
                            </FieldGroup>
                            <FieldGroup label="Timezone">
                                <InputField
                                    value={form.timezone}
                                    onChange={(e) => updateField('timezone', e.target.value)}
                                    placeholder="e.g., Asia/Singapore"
                                />
                            </FieldGroup>
                        </div>
                    </div>

                    {/* Availability */}
                    <div className="bg-dark-card border border-dark-border rounded-xl p-6">
                        <h2 className="text-lg font-semibold text-white mb-4">Availability</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FieldGroup label="Status">
                                <select
                                    value={form.availabilityStatus || 'available'}
                                    onChange={(e) => updateField('availabilityStatus', e.target.value)}
                                    className="w-full px-3 py-2 bg-dark-bg border border-dark-border rounded-lg text-white focus:border-accent-primary focus:outline-none"
                                >
                                    {Object.entries(AVAILABILITY_STATUS).map(([id, status]) => (
                                        <option key={id} value={id}>{status.label}</option>
                                    ))}
                                </select>
                            </FieldGroup>
                            <FieldGroup label="Availability Notes">
                                <InputField
                                    value={form.availabilityNotes}
                                    onChange={(e) => updateField('availabilityNotes', e.target.value)}
                                    placeholder="e.g., Available from January"
                                />
                            </FieldGroup>
                        </div>
                    </div>

                    {/* Emergency Contact */}
                    <div className="bg-dark-card border border-dark-border rounded-xl p-6">
                        <h2 className="text-lg font-semibold text-white mb-4">Emergency Contact</h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <FieldGroup label="Name">
                                <InputField
                                    value={form.emergencyContactName}
                                    onChange={(e) => updateField('emergencyContactName', e.target.value)}
                                />
                            </FieldGroup>
                            <FieldGroup label="Phone">
                                <InputField
                                    type="tel"
                                    value={form.emergencyContactPhone}
                                    onChange={(e) => updateField('emergencyContactPhone', e.target.value)}
                                />
                            </FieldGroup>
                            <FieldGroup label="Relationship">
                                <InputField
                                    value={form.emergencyContactRelation}
                                    onChange={(e) => updateField('emergencyContactRelation', e.target.value)}
                                    placeholder="e.g., Spouse, Parent"
                                />
                            </FieldGroup>
                        </div>
                    </div>
                </div>
            )}

            {/* Rates & Equipment Tab */}
            {activeTab === 'rates' && (
                <div className="space-y-6">
                    {/* Rates */}
                    <div className="bg-dark-card border border-dark-border rounded-xl p-6">
                        <h2 className="text-lg font-semibold text-white mb-4">Rates</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            <FieldGroup label="Currency">
                                <select
                                    value={form.currency || 'USD'}
                                    onChange={(e) => updateField('currency', e.target.value)}
                                    className="w-full px-3 py-2 bg-dark-bg border border-dark-border rounded-lg text-white focus:border-accent-primary focus:outline-none"
                                >
                                    <option value="USD">USD</option>
                                    <option value="EUR">EUR</option>
                                    <option value="GBP">GBP</option>
                                    <option value="SGD">SGD</option>
                                    <option value="MYR">MYR</option>
                                    <option value="THB">THB</option>
                                    <option value="AED">AED</option>
                                    <option value="IDR">IDR</option>
                                    <option value="PHP">PHP</option>
                                    <option value="VND">VND</option>
                                </select>
                            </FieldGroup>
                            <FieldGroup label="Day Rate">
                                <InputField
                                    type="number"
                                    value={form.dayRate}
                                    onChange={(e) => updateField('dayRate', parseFloat(e.target.value) || 0)}
                                />
                            </FieldGroup>
                            <FieldGroup label="Half Day Rate">
                                <InputField
                                    type="number"
                                    value={form.halfDayRate}
                                    onChange={(e) => updateField('halfDayRate', parseFloat(e.target.value) || 0)}
                                />
                            </FieldGroup>
                            <FieldGroup label="Hourly Rate">
                                <InputField
                                    type="number"
                                    value={form.hourlyRate}
                                    onChange={(e) => updateField('hourlyRate', parseFloat(e.target.value) || 0)}
                                />
                            </FieldGroup>
                            <FieldGroup label="Overtime Rate">
                                <InputField
                                    type="number"
                                    value={form.overtimeRate}
                                    onChange={(e) => updateField('overtimeRate', parseFloat(e.target.value) || 0)}
                                />
                            </FieldGroup>
                        </div>
                        <div className="mt-4">
                            <FieldGroup label="Rate Notes">
                                <TextAreaField
                                    value={form.rateNotes}
                                    onChange={(e) => updateField('rateNotes', e.target.value)}
                                    placeholder="e.g., Rate includes kit, overtime after 10 hours"
                                />
                            </FieldGroup>
                        </div>
                    </div>

                    {/* Skills */}
                    <div className="bg-dark-card border border-dark-border rounded-xl p-6">
                        <h2 className="text-lg font-semibold text-white mb-4">Skills & Specialties</h2>
                        <TagsEditor
                            value={form.skills || []}
                            onChange={(skills) => updateField('skills', skills)}
                            placeholder="Add skill..."
                        />
                    </div>

                    {/* Equipment */}
                    <div className="bg-dark-card border border-dark-border rounded-xl p-6">
                        <h2 className="text-lg font-semibold text-white mb-4">Equipment</h2>
                        <div className="space-y-4">
                            <label className="flex items-center gap-3 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={form.ownsEquipment || false}
                                    onChange={(e) => updateField('ownsEquipment', e.target.checked)}
                                    className="w-5 h-5 rounded border-gray-600 bg-dark-bg text-accent-primary focus:ring-accent-primary focus:ring-offset-0"
                                />
                                <span className="text-white">Owns equipment (kit included in rate)</span>
                            </label>
                            {form.ownsEquipment && (
                                <>
                                    <FieldGroup label="Equipment List">
                                        <TagsEditor
                                            value={form.equipmentList || []}
                                            onChange={(list) => updateField('equipmentList', list)}
                                            placeholder="Add equipment item..."
                                        />
                                    </FieldGroup>
                                    <FieldGroup label="Equipment Notes">
                                        <TextAreaField
                                            value={form.equipmentNotes}
                                            onChange={(e) => updateField('equipmentNotes', e.target.value)}
                                            placeholder="Additional details about equipment..."
                                        />
                                    </FieldGroup>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Portfolio Tab */}
            {activeTab === 'portfolio' && (
                <div className="space-y-6">
                    {/* Links */}
                    <div className="bg-dark-card border border-dark-border rounded-xl p-6">
                        <h2 className="text-lg font-semibold text-white mb-4">Online Presence</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FieldGroup label="Website">
                                <InputField
                                    type="url"
                                    value={form.website}
                                    onChange={(e) => updateField('website', e.target.value)}
                                    placeholder="https://"
                                />
                            </FieldGroup>
                            <FieldGroup label="IMDb">
                                <InputField
                                    type="url"
                                    value={form.imdbLink}
                                    onChange={(e) => updateField('imdbLink', e.target.value)}
                                    placeholder="https://imdb.com/name/..."
                                />
                            </FieldGroup>
                            <FieldGroup label="LinkedIn">
                                <InputField
                                    type="url"
                                    value={form.linkedinLink}
                                    onChange={(e) => updateField('linkedinLink', e.target.value)}
                                    placeholder="https://linkedin.com/in/..."
                                />
                            </FieldGroup>
                            <FieldGroup label="Instagram">
                                <InputField
                                    type="url"
                                    value={form.instagramLink}
                                    onChange={(e) => updateField('instagramLink', e.target.value)}
                                    placeholder="https://instagram.com/..."
                                />
                            </FieldGroup>
                            <FieldGroup label="Showreel">
                                <InputField
                                    type="url"
                                    value={form.showreelLink}
                                    onChange={(e) => updateField('showreelLink', e.target.value)}
                                    placeholder="https://vimeo.com/... or YouTube link"
                                />
                            </FieldGroup>
                            <FieldGroup label="Resume/CV URL">
                                <InputField
                                    type="url"
                                    value={form.resumeUrl}
                                    onChange={(e) => updateField('resumeUrl', e.target.value)}
                                    placeholder="https://..."
                                />
                            </FieldGroup>
                        </div>
                    </div>

                    {/* Quick Links */}
                    {(form.website || form.imdbLink || form.linkedinLink || form.instagramLink || form.showreelLink) && (
                        <div className="bg-dark-card border border-dark-border rounded-xl p-6">
                            <h2 className="text-lg font-semibold text-white mb-4">Quick Links</h2>
                            <div className="flex flex-wrap gap-3">
                                {form.website && (
                                    <a
                                        href={form.website}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-white transition-colors"
                                    >
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                                        </svg>
                                        Website
                                    </a>
                                )}
                                {form.imdbLink && (
                                    <a
                                        href={form.imdbLink}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-600 hover:bg-yellow-500 rounded-lg text-black font-medium transition-colors"
                                    >
                                        IMDb
                                    </a>
                                )}
                                {form.linkedinLink && (
                                    <a
                                        href={form.linkedinLink}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-white transition-colors"
                                    >
                                        LinkedIn
                                    </a>
                                )}
                                {form.instagramLink && (
                                    <a
                                        href={form.instagramLink}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-400 hover:to-pink-400 rounded-lg text-white transition-colors"
                                    >
                                        Instagram
                                    </a>
                                )}
                                {form.showreelLink && (
                                    <a
                                        href={form.showreelLink}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-500 rounded-lg text-white transition-colors"
                                    >
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        Showreel
                                    </a>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Notes & Tags Tab */}
            {activeTab === 'notes' && (
                <div className="space-y-6">
                    {/* Rating */}
                    <div className="bg-dark-card border border-dark-border rounded-xl p-6">
                        <h2 className="text-lg font-semibold text-white mb-4">Internal Rating</h2>
                        <StarRating
                            value={form.rating || 0}
                            onChange={(rating) => updateField('rating', rating)}
                        />
                    </div>

                    {/* Notes */}
                    <div className="bg-dark-card border border-dark-border rounded-xl p-6">
                        <h2 className="text-lg font-semibold text-white mb-4">Internal Notes</h2>
                        <TextAreaField
                            value={form.notes}
                            onChange={(e) => updateField('notes', e.target.value)}
                            placeholder="Private notes about this crew member..."
                            rows={6}
                        />
                    </div>

                    {/* Tags */}
                    <div className="bg-dark-card border border-dark-border rounded-xl p-6">
                        <h2 className="text-lg font-semibold text-white mb-4">Tags</h2>
                        <TagsEditor
                            value={form.tags || []}
                            onChange={(tags) => updateField('tags', tags)}
                            placeholder="Add tag..."
                        />
                    </div>

                    {/* Stats */}
                    <div className="bg-dark-card border border-dark-border rounded-xl p-6">
                        <h2 className="text-lg font-semibold text-white mb-4">Statistics</h2>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div>
                                <p className="text-2xl font-bold text-white">{form.totalProjects || 0}</p>
                                <p className="text-sm text-gray-400">Projects</p>
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-accent-primary">
                                    {form.currency} {(form.totalEarned || 0).toLocaleString()}
                                </p>
                                <p className="text-sm text-gray-400">Total Earned</p>
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-yellow-400">{form.avgProjectRating || 0}</p>
                                <p className="text-sm text-gray-400">Avg. Project Rating</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-400">
                                    Added: {form.createdAt ? new Date(form.createdAt).toLocaleDateString() : 'N/A'}
                                </p>
                                <p className="text-sm text-gray-400">
                                    Updated: {form.updatedAt ? new Date(form.updatedAt).toLocaleDateString() : 'N/A'}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Danger Zone */}
                    <div className="bg-red-900/10 border border-red-900/30 rounded-xl p-6">
                        <h2 className="text-lg font-semibold text-red-400 mb-4">Danger Zone</h2>
                        <p className="text-sm text-gray-400 mb-4">
                            Archiving this crew member will remove them from the active list. This action can be undone later.
                        </p>
                        {showDeleteConfirm ? (
                            <div className="flex items-center gap-3">
                                <span className="text-sm text-gray-400">Are you sure?</span>
                                <button
                                    onClick={handleDelete}
                                    className="px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-500 transition-colors"
                                >
                                    Yes, Archive
                                </button>
                                <button
                                    onClick={() => setShowDeleteConfirm(false)}
                                    className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
                                >
                                    Cancel
                                </button>
                            </div>
                        ) : (
                            <button
                                onClick={() => setShowDeleteConfirm(true)}
                                className="px-4 py-2 border border-red-600 text-red-400 rounded-lg font-medium hover:bg-red-600 hover:text-white transition-colors"
                            >
                                Archive Crew Member
                            </button>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
