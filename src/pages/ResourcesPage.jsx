import { useState, useEffect } from 'react';
import {
    useResourceStore,
    TALENT_TYPES,
    TALENT_STATUS,
    LOCATION_TYPES,
    LOCATION_STATUS,
    VENDOR_TYPES,
    VENDOR_RATING,
} from '../store/resourceStore';

// ============================================
// ICONS
// ============================================
const UsersIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
    </svg>
);

const MapPinIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
);

const BuildingIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
    </svg>
);

const PlusIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
    </svg>
);

const SearchIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
);

const XIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
);

const StarIcon = ({ filled }) => (
    <svg className={`w-4 h-4 ${filled ? 'text-yellow-400 fill-current' : 'text-gray-500'}`} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
    </svg>
);

const TrashIcon = () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
);

const EditIcon = () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
    </svg>
);

// ============================================
// TALENT FORM MODAL
// ============================================
function TalentModal({ talent, onClose, onSave }) {
    const [formData, setFormData] = useState(talent || {
        name: '',
        type: 'actor',
        email: '',
        phone: '',
        agent_name: '',
        agent_email: '',
        day_rate: '',
        currency: 'USD',
        status: 'available',
        skills: [],
        languages: [],
        notes: '',
        social_instagram: '',
        follower_count: '',
    });
    const [skillInput, setSkillInput] = useState('');
    const [languageInput, setLanguageInput] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        await onSave({
            ...formData,
            day_rate: formData.day_rate ? parseFloat(formData.day_rate) : null,
            follower_count: formData.follower_count ? parseInt(formData.follower_count) : null,
        });
        onClose();
    };

    const addSkill = () => {
        if (skillInput.trim() && !formData.skills.includes(skillInput.trim())) {
            setFormData({ ...formData, skills: [...formData.skills, skillInput.trim()] });
            setSkillInput('');
        }
    };

    const addLanguage = () => {
        if (languageInput.trim() && !formData.languages.includes(languageInput.trim())) {
            setFormData({ ...formData, languages: [...formData.languages, languageInput.trim()] });
            setLanguageInput('');
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-dark-card rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between p-6 border-b border-dark-border">
                    <h2 className="text-xl font-semibold text-white">
                        {talent ? 'Edit Talent' : 'Add Talent'}
                    </h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white">
                        <XIcon />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {/* Basic Info */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2">
                            <label className="block text-sm text-gray-400 mb-1">Name *</label>
                            <input
                                type="text"
                                required
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                className="w-full px-3 py-2 bg-dark-bg border border-dark-border rounded-lg text-white"
                            />
                        </div>

                        <div>
                            <label className="block text-sm text-gray-400 mb-1">Type</label>
                            <select
                                value={formData.type}
                                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                                className="w-full px-3 py-2 bg-dark-bg border border-dark-border rounded-lg text-white"
                            >
                                {Object.values(TALENT_TYPES).map((t) => (
                                    <option key={t.id} value={t.id}>{t.icon} {t.label}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm text-gray-400 mb-1">Status</label>
                            <select
                                value={formData.status}
                                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                className="w-full px-3 py-2 bg-dark-bg border border-dark-border rounded-lg text-white"
                            >
                                {Object.values(TALENT_STATUS).map((s) => (
                                    <option key={s.id} value={s.id}>{s.label}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Contact */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm text-gray-400 mb-1">Email</label>
                            <input
                                type="email"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                className="w-full px-3 py-2 bg-dark-bg border border-dark-border rounded-lg text-white"
                            />
                        </div>
                        <div>
                            <label className="block text-sm text-gray-400 mb-1">Phone</label>
                            <input
                                type="tel"
                                value={formData.phone}
                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                className="w-full px-3 py-2 bg-dark-bg border border-dark-border rounded-lg text-white"
                            />
                        </div>
                    </div>

                    {/* Agent */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm text-gray-400 mb-1">Agent Name</label>
                            <input
                                type="text"
                                value={formData.agent_name}
                                onChange={(e) => setFormData({ ...formData, agent_name: e.target.value })}
                                className="w-full px-3 py-2 bg-dark-bg border border-dark-border rounded-lg text-white"
                            />
                        </div>
                        <div>
                            <label className="block text-sm text-gray-400 mb-1">Agent Email</label>
                            <input
                                type="email"
                                value={formData.agent_email}
                                onChange={(e) => setFormData({ ...formData, agent_email: e.target.value })}
                                className="w-full px-3 py-2 bg-dark-bg border border-dark-border rounded-lg text-white"
                            />
                        </div>
                    </div>

                    {/* Rates */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm text-gray-400 mb-1">Day Rate</label>
                            <input
                                type="number"
                                value={formData.day_rate}
                                onChange={(e) => setFormData({ ...formData, day_rate: e.target.value })}
                                className="w-full px-3 py-2 bg-dark-bg border border-dark-border rounded-lg text-white"
                            />
                        </div>
                        <div>
                            <label className="block text-sm text-gray-400 mb-1">Currency</label>
                            <select
                                value={formData.currency}
                                onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                                className="w-full px-3 py-2 bg-dark-bg border border-dark-border rounded-lg text-white"
                            >
                                <option value="USD">USD</option>
                                <option value="EUR">EUR</option>
                                <option value="GBP">GBP</option>
                                <option value="SGD">SGD</option>
                                <option value="MYR">MYR</option>
                                <option value="AED">AED</option>
                            </select>
                        </div>
                    </div>

                    {/* Skills */}
                    <div>
                        <label className="block text-sm text-gray-400 mb-1">Skills</label>
                        <div className="flex gap-2 mb-2">
                            <input
                                type="text"
                                value={skillInput}
                                onChange={(e) => setSkillInput(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill())}
                                placeholder="Add skill..."
                                className="flex-1 px-3 py-2 bg-dark-bg border border-dark-border rounded-lg text-white"
                            />
                            <button
                                type="button"
                                onClick={addSkill}
                                className="px-4 py-2 bg-brand-primary rounded-lg text-white hover:opacity-90"
                            >
                                Add
                            </button>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {formData.skills.map((skill, i) => (
                                <span key={i} className="px-2 py-1 bg-dark-bg rounded text-sm text-gray-300 flex items-center gap-1">
                                    {skill}
                                    <button
                                        type="button"
                                        onClick={() => setFormData({
                                            ...formData,
                                            skills: formData.skills.filter((_, idx) => idx !== i)
                                        })}
                                        className="text-gray-500 hover:text-red-400"
                                    >
                                        ×
                                    </button>
                                </span>
                            ))}
                        </div>
                    </div>

                    {/* Languages */}
                    <div>
                        <label className="block text-sm text-gray-400 mb-1">Languages</label>
                        <div className="flex gap-2 mb-2">
                            <input
                                type="text"
                                value={languageInput}
                                onChange={(e) => setLanguageInput(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addLanguage())}
                                placeholder="Add language..."
                                className="flex-1 px-3 py-2 bg-dark-bg border border-dark-border rounded-lg text-white"
                            />
                            <button
                                type="button"
                                onClick={addLanguage}
                                className="px-4 py-2 bg-brand-primary rounded-lg text-white hover:opacity-90"
                            >
                                Add
                            </button>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {formData.languages.map((lang, i) => (
                                <span key={i} className="px-2 py-1 bg-dark-bg rounded text-sm text-gray-300 flex items-center gap-1">
                                    {lang}
                                    <button
                                        type="button"
                                        onClick={() => setFormData({
                                            ...formData,
                                            languages: formData.languages.filter((_, idx) => idx !== i)
                                        })}
                                        className="text-gray-500 hover:text-red-400"
                                    >
                                        ×
                                    </button>
                                </span>
                            ))}
                        </div>
                    </div>

                    {/* Social */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm text-gray-400 mb-1">Instagram Handle</label>
                            <input
                                type="text"
                                value={formData.social_instagram}
                                onChange={(e) => setFormData({ ...formData, social_instagram: e.target.value })}
                                placeholder="@username"
                                className="w-full px-3 py-2 bg-dark-bg border border-dark-border rounded-lg text-white"
                            />
                        </div>
                        <div>
                            <label className="block text-sm text-gray-400 mb-1">Follower Count</label>
                            <input
                                type="number"
                                value={formData.follower_count}
                                onChange={(e) => setFormData({ ...formData, follower_count: e.target.value })}
                                className="w-full px-3 py-2 bg-dark-bg border border-dark-border rounded-lg text-white"
                            />
                        </div>
                    </div>

                    {/* Notes */}
                    <div>
                        <label className="block text-sm text-gray-400 mb-1">Notes</label>
                        <textarea
                            value={formData.notes}
                            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                            rows={3}
                            className="w-full px-3 py-2 bg-dark-bg border border-dark-border rounded-lg text-white"
                        />
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end gap-3 pt-4 border-t border-dark-border">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-gray-400 hover:text-white"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-6 py-2 bg-brand-primary rounded-lg text-white hover:opacity-90"
                        >
                            {talent ? 'Save Changes' : 'Add Talent'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// ============================================
// LOCATION FORM MODAL
// ============================================
function LocationModal({ location, onClose, onSave }) {
    const [formData, setFormData] = useState(location || {
        name: '',
        type: 'studio',
        address: '',
        city: '',
        country: '',
        contact_name: '',
        contact_email: '',
        contact_phone: '',
        day_rate: '',
        half_day_rate: '',
        currency: 'USD',
        status: 'available',
        permits_required: false,
        permit_notes: '',
        parking: '',
        power_available: true,
        wifi_available: true,
        max_crew_size: '',
        notes: '',
    });

    const handleSubmit = async (e) => {
        e.preventDefault();
        await onSave({
            ...formData,
            day_rate: formData.day_rate ? parseFloat(formData.day_rate) : null,
            half_day_rate: formData.half_day_rate ? parseFloat(formData.half_day_rate) : null,
            max_crew_size: formData.max_crew_size ? parseInt(formData.max_crew_size) : null,
        });
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-dark-card rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between p-6 border-b border-dark-border">
                    <h2 className="text-xl font-semibold text-white">
                        {location ? 'Edit Location' : 'Add Location'}
                    </h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white">
                        <XIcon />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {/* Basic Info */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2">
                            <label className="block text-sm text-gray-400 mb-1">Name *</label>
                            <input
                                type="text"
                                required
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                className="w-full px-3 py-2 bg-dark-bg border border-dark-border rounded-lg text-white"
                            />
                        </div>

                        <div>
                            <label className="block text-sm text-gray-400 mb-1">Type</label>
                            <select
                                value={formData.type}
                                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                                className="w-full px-3 py-2 bg-dark-bg border border-dark-border rounded-lg text-white"
                            >
                                {Object.values(LOCATION_TYPES).map((t) => (
                                    <option key={t.id} value={t.id}>{t.icon} {t.label}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm text-gray-400 mb-1">Status</label>
                            <select
                                value={formData.status}
                                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                className="w-full px-3 py-2 bg-dark-bg border border-dark-border rounded-lg text-white"
                            >
                                {Object.values(LOCATION_STATUS).map((s) => (
                                    <option key={s.id} value={s.id}>{s.label}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Address */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2">
                            <label className="block text-sm text-gray-400 mb-1">Address</label>
                            <input
                                type="text"
                                value={formData.address}
                                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                className="w-full px-3 py-2 bg-dark-bg border border-dark-border rounded-lg text-white"
                            />
                        </div>
                        <div>
                            <label className="block text-sm text-gray-400 mb-1">City</label>
                            <input
                                type="text"
                                value={formData.city}
                                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                                className="w-full px-3 py-2 bg-dark-bg border border-dark-border rounded-lg text-white"
                            />
                        </div>
                        <div>
                            <label className="block text-sm text-gray-400 mb-1">Country</label>
                            <input
                                type="text"
                                value={formData.country}
                                onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                                className="w-full px-3 py-2 bg-dark-bg border border-dark-border rounded-lg text-white"
                            />
                        </div>
                    </div>

                    {/* Contact */}
                    <div className="grid grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm text-gray-400 mb-1">Contact Name</label>
                            <input
                                type="text"
                                value={formData.contact_name}
                                onChange={(e) => setFormData({ ...formData, contact_name: e.target.value })}
                                className="w-full px-3 py-2 bg-dark-bg border border-dark-border rounded-lg text-white"
                            />
                        </div>
                        <div>
                            <label className="block text-sm text-gray-400 mb-1">Contact Email</label>
                            <input
                                type="email"
                                value={formData.contact_email}
                                onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
                                className="w-full px-3 py-2 bg-dark-bg border border-dark-border rounded-lg text-white"
                            />
                        </div>
                        <div>
                            <label className="block text-sm text-gray-400 mb-1">Contact Phone</label>
                            <input
                                type="tel"
                                value={formData.contact_phone}
                                onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
                                className="w-full px-3 py-2 bg-dark-bg border border-dark-border rounded-lg text-white"
                            />
                        </div>
                    </div>

                    {/* Rates */}
                    <div className="grid grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm text-gray-400 mb-1">Day Rate</label>
                            <input
                                type="number"
                                value={formData.day_rate}
                                onChange={(e) => setFormData({ ...formData, day_rate: e.target.value })}
                                className="w-full px-3 py-2 bg-dark-bg border border-dark-border rounded-lg text-white"
                            />
                        </div>
                        <div>
                            <label className="block text-sm text-gray-400 mb-1">Half Day Rate</label>
                            <input
                                type="number"
                                value={formData.half_day_rate}
                                onChange={(e) => setFormData({ ...formData, half_day_rate: e.target.value })}
                                className="w-full px-3 py-2 bg-dark-bg border border-dark-border rounded-lg text-white"
                            />
                        </div>
                        <div>
                            <label className="block text-sm text-gray-400 mb-1">Currency</label>
                            <select
                                value={formData.currency}
                                onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                                className="w-full px-3 py-2 bg-dark-bg border border-dark-border rounded-lg text-white"
                            >
                                <option value="USD">USD</option>
                                <option value="EUR">EUR</option>
                                <option value="GBP">GBP</option>
                                <option value="SGD">SGD</option>
                                <option value="MYR">MYR</option>
                                <option value="AED">AED</option>
                            </select>
                        </div>
                    </div>

                    {/* Facilities */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm text-gray-400 mb-1">Max Crew Size</label>
                            <input
                                type="number"
                                value={formData.max_crew_size}
                                onChange={(e) => setFormData({ ...formData, max_crew_size: e.target.value })}
                                className="w-full px-3 py-2 bg-dark-bg border border-dark-border rounded-lg text-white"
                            />
                        </div>
                        <div>
                            <label className="block text-sm text-gray-400 mb-1">Parking Info</label>
                            <input
                                type="text"
                                value={formData.parking}
                                onChange={(e) => setFormData({ ...formData, parking: e.target.value })}
                                placeholder="e.g., 5 spaces available"
                                className="w-full px-3 py-2 bg-dark-bg border border-dark-border rounded-lg text-white"
                            />
                        </div>
                    </div>

                    {/* Toggles */}
                    <div className="flex gap-6">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={formData.power_available}
                                onChange={(e) => setFormData({ ...formData, power_available: e.target.checked })}
                                className="w-4 h-4 rounded bg-dark-bg border-dark-border"
                            />
                            <span className="text-gray-300">Power Available</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={formData.wifi_available}
                                onChange={(e) => setFormData({ ...formData, wifi_available: e.target.checked })}
                                className="w-4 h-4 rounded bg-dark-bg border-dark-border"
                            />
                            <span className="text-gray-300">WiFi Available</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={formData.permits_required}
                                onChange={(e) => setFormData({ ...formData, permits_required: e.target.checked })}
                                className="w-4 h-4 rounded bg-dark-bg border-dark-border"
                            />
                            <span className="text-gray-300">Permits Required</span>
                        </label>
                    </div>

                    {formData.permits_required && (
                        <div>
                            <label className="block text-sm text-gray-400 mb-1">Permit Notes</label>
                            <textarea
                                value={formData.permit_notes}
                                onChange={(e) => setFormData({ ...formData, permit_notes: e.target.value })}
                                rows={2}
                                className="w-full px-3 py-2 bg-dark-bg border border-dark-border rounded-lg text-white"
                            />
                        </div>
                    )}

                    {/* Notes */}
                    <div>
                        <label className="block text-sm text-gray-400 mb-1">Notes</label>
                        <textarea
                            value={formData.notes}
                            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                            rows={3}
                            className="w-full px-3 py-2 bg-dark-bg border border-dark-border rounded-lg text-white"
                        />
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end gap-3 pt-4 border-t border-dark-border">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-gray-400 hover:text-white"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-6 py-2 bg-brand-primary rounded-lg text-white hover:opacity-90"
                        >
                            {location ? 'Save Changes' : 'Add Location'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// ============================================
// VENDOR FORM MODAL
// ============================================
function VendorModal({ vendor, onClose, onSave }) {
    const [formData, setFormData] = useState(vendor || {
        name: '',
        type: 'equipment_rental',
        company: '',
        email: '',
        phone: '',
        website: '',
        address: '',
        city: '',
        country: '',
        contact_name: '',
        rating: null,
        is_preferred: false,
        payment_terms: '',
        services: [],
        price_range: '',
        lead_time: '',
        notes: '',
    });
    const [serviceInput, setServiceInput] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        await onSave(formData);
        onClose();
    };

    const addService = () => {
        if (serviceInput.trim() && !formData.services.includes(serviceInput.trim())) {
            setFormData({ ...formData, services: [...formData.services, serviceInput.trim()] });
            setServiceInput('');
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-dark-card rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between p-6 border-b border-dark-border">
                    <h2 className="text-xl font-semibold text-white">
                        {vendor ? 'Edit Vendor' : 'Add Vendor'}
                    </h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white">
                        <XIcon />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {/* Basic Info */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm text-gray-400 mb-1">Name *</label>
                            <input
                                type="text"
                                required
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                className="w-full px-3 py-2 bg-dark-bg border border-dark-border rounded-lg text-white"
                            />
                        </div>
                        <div>
                            <label className="block text-sm text-gray-400 mb-1">Company</label>
                            <input
                                type="text"
                                value={formData.company}
                                onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                                className="w-full px-3 py-2 bg-dark-bg border border-dark-border rounded-lg text-white"
                            />
                        </div>

                        <div>
                            <label className="block text-sm text-gray-400 mb-1">Type</label>
                            <select
                                value={formData.type}
                                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                                className="w-full px-3 py-2 bg-dark-bg border border-dark-border rounded-lg text-white"
                            >
                                {Object.values(VENDOR_TYPES).map((t) => (
                                    <option key={t.id} value={t.id}>{t.icon} {t.label}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm text-gray-400 mb-1">Rating</label>
                            <div className="flex gap-1 py-2">
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <button
                                        key={star}
                                        type="button"
                                        onClick={() => setFormData({ ...formData, rating: star })}
                                        className="focus:outline-none"
                                    >
                                        <StarIcon filled={star <= (formData.rating || 0)} />
                                    </button>
                                ))}
                                {formData.rating && (
                                    <button
                                        type="button"
                                        onClick={() => setFormData({ ...formData, rating: null })}
                                        className="ml-2 text-xs text-gray-500 hover:text-gray-300"
                                    >
                                        Clear
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Contact */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm text-gray-400 mb-1">Email</label>
                            <input
                                type="email"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                className="w-full px-3 py-2 bg-dark-bg border border-dark-border rounded-lg text-white"
                            />
                        </div>
                        <div>
                            <label className="block text-sm text-gray-400 mb-1">Phone</label>
                            <input
                                type="tel"
                                value={formData.phone}
                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                className="w-full px-3 py-2 bg-dark-bg border border-dark-border rounded-lg text-white"
                            />
                        </div>
                        <div>
                            <label className="block text-sm text-gray-400 mb-1">Website</label>
                            <input
                                type="url"
                                value={formData.website}
                                onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                                className="w-full px-3 py-2 bg-dark-bg border border-dark-border rounded-lg text-white"
                            />
                        </div>
                        <div>
                            <label className="block text-sm text-gray-400 mb-1">Contact Person</label>
                            <input
                                type="text"
                                value={formData.contact_name}
                                onChange={(e) => setFormData({ ...formData, contact_name: e.target.value })}
                                className="w-full px-3 py-2 bg-dark-bg border border-dark-border rounded-lg text-white"
                            />
                        </div>
                    </div>

                    {/* Address */}
                    <div className="grid grid-cols-3 gap-4">
                        <div className="col-span-3">
                            <label className="block text-sm text-gray-400 mb-1">Address</label>
                            <input
                                type="text"
                                value={formData.address}
                                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                className="w-full px-3 py-2 bg-dark-bg border border-dark-border rounded-lg text-white"
                            />
                        </div>
                        <div>
                            <label className="block text-sm text-gray-400 mb-1">City</label>
                            <input
                                type="text"
                                value={formData.city}
                                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                                className="w-full px-3 py-2 bg-dark-bg border border-dark-border rounded-lg text-white"
                            />
                        </div>
                        <div>
                            <label className="block text-sm text-gray-400 mb-1">Country</label>
                            <input
                                type="text"
                                value={formData.country}
                                onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                                className="w-full px-3 py-2 bg-dark-bg border border-dark-border rounded-lg text-white"
                            />
                        </div>
                        <div>
                            <label className="block text-sm text-gray-400 mb-1">Lead Time</label>
                            <input
                                type="text"
                                value={formData.lead_time}
                                onChange={(e) => setFormData({ ...formData, lead_time: e.target.value })}
                                placeholder="e.g., 2-3 days"
                                className="w-full px-3 py-2 bg-dark-bg border border-dark-border rounded-lg text-white"
                            />
                        </div>
                    </div>

                    {/* Business */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm text-gray-400 mb-1">Payment Terms</label>
                            <input
                                type="text"
                                value={formData.payment_terms}
                                onChange={(e) => setFormData({ ...formData, payment_terms: e.target.value })}
                                placeholder="e.g., Net 30"
                                className="w-full px-3 py-2 bg-dark-bg border border-dark-border rounded-lg text-white"
                            />
                        </div>
                        <div>
                            <label className="block text-sm text-gray-400 mb-1">Price Range</label>
                            <select
                                value={formData.price_range}
                                onChange={(e) => setFormData({ ...formData, price_range: e.target.value })}
                                className="w-full px-3 py-2 bg-dark-bg border border-dark-border rounded-lg text-white"
                            >
                                <option value="">Select...</option>
                                <option value="budget">$ Budget</option>
                                <option value="mid">$$ Mid-Range</option>
                                <option value="premium">$$$ Premium</option>
                            </select>
                        </div>
                    </div>

                    {/* Preferred */}
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={formData.is_preferred}
                            onChange={(e) => setFormData({ ...formData, is_preferred: e.target.checked })}
                            className="w-4 h-4 rounded bg-dark-bg border-dark-border"
                        />
                        <span className="text-gray-300">Preferred Vendor</span>
                        <span className="text-xs text-gray-500">(shows gold star)</span>
                    </label>

                    {/* Services */}
                    <div>
                        <label className="block text-sm text-gray-400 mb-1">Services Offered</label>
                        <div className="flex gap-2 mb-2">
                            <input
                                type="text"
                                value={serviceInput}
                                onChange={(e) => setServiceInput(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addService())}
                                placeholder="Add service..."
                                className="flex-1 px-3 py-2 bg-dark-bg border border-dark-border rounded-lg text-white"
                            />
                            <button
                                type="button"
                                onClick={addService}
                                className="px-4 py-2 bg-brand-primary rounded-lg text-white hover:opacity-90"
                            >
                                Add
                            </button>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {formData.services.map((service, i) => (
                                <span key={i} className="px-2 py-1 bg-dark-bg rounded text-sm text-gray-300 flex items-center gap-1">
                                    {service}
                                    <button
                                        type="button"
                                        onClick={() => setFormData({
                                            ...formData,
                                            services: formData.services.filter((_, idx) => idx !== i)
                                        })}
                                        className="text-gray-500 hover:text-red-400"
                                    >
                                        ×
                                    </button>
                                </span>
                            ))}
                        </div>
                    </div>

                    {/* Notes */}
                    <div>
                        <label className="block text-sm text-gray-400 mb-1">Notes</label>
                        <textarea
                            value={formData.notes}
                            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                            rows={3}
                            className="w-full px-3 py-2 bg-dark-bg border border-dark-border rounded-lg text-white"
                        />
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end gap-3 pt-4 border-t border-dark-border">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-gray-400 hover:text-white"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-6 py-2 bg-brand-primary rounded-lg text-white hover:opacity-90"
                        >
                            {vendor ? 'Save Changes' : 'Add Vendor'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// ============================================
// MAIN PAGE
// ============================================
export default function ResourcesPage() {
    const [activeTab, setActiveTab] = useState('talent');
    const [searchQuery, setSearchQuery] = useState('');
    const [typeFilter, setTypeFilter] = useState('');
    const [showModal, setShowModal] = useState(null); // 'talent' | 'location' | 'vendor' | null
    const [editingItem, setEditingItem] = useState(null);

    const {
        talents,
        locations,
        vendors,
        loading,
        initialize,
        createTalent,
        updateTalent,
        deleteTalent,
        createLocation,
        updateLocation,
        deleteLocation,
        createVendor,
        updateVendor,
        deleteVendor,
        searchTalents,
        searchLocations,
        searchVendors,
    } = useResourceStore();

    useEffect(() => {
        initialize();
    }, [initialize]);

    const tabs = [
        { id: 'talent', label: 'Talent', icon: UsersIcon, count: talents.length },
        { id: 'locations', label: 'Locations', icon: MapPinIcon, count: locations.length },
        { id: 'vendors', label: 'Vendors', icon: BuildingIcon, count: vendors.length },
    ];

    // Get filtered data based on active tab
    const getFilteredData = () => {
        const filters = typeFilter ? { type: typeFilter } : {};
        switch (activeTab) {
            case 'talent':
                return searchTalents(searchQuery, filters);
            case 'locations':
                return searchLocations(searchQuery, filters);
            case 'vendors':
                return searchVendors(searchQuery, filters);
            default:
                return [];
        }
    };

    const filteredData = getFilteredData();

    const handleAdd = () => {
        setEditingItem(null);
        setShowModal(activeTab);
    };

    const handleEdit = (item) => {
        setEditingItem(item);
        setShowModal(activeTab);
    };

    const handleDelete = async (item) => {
        if (!confirm(`Delete "${item.name}"? This cannot be undone.`)) return;
        switch (activeTab) {
            case 'talent':
                await deleteTalent(item.id);
                break;
            case 'locations':
                await deleteLocation(item.id);
                break;
            case 'vendors':
                await deleteVendor(item.id);
                break;
        }
    };

    const handleSave = async (data) => {
        switch (showModal) {
            case 'talent':
                if (editingItem) {
                    await updateTalent(editingItem.id, data);
                } else {
                    await createTalent(data);
                }
                break;
            case 'locations':
                if (editingItem) {
                    await updateLocation(editingItem.id, data);
                } else {
                    await createLocation(data);
                }
                break;
            case 'vendors':
                if (editingItem) {
                    await updateVendor(editingItem.id, data);
                } else {
                    await createVendor(data);
                }
                break;
        }
    };

    const getTypeOptions = () => {
        switch (activeTab) {
            case 'talent':
                return TALENT_TYPES;
            case 'locations':
                return LOCATION_TYPES;
            case 'vendors':
                return VENDOR_TYPES;
            default:
                return {};
        }
    };

    return (
        <div className="p-6 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-white">Resources</h1>
                    <p className="text-gray-400">Manage your talent, locations, and vendors</p>
                </div>
                <button
                    onClick={handleAdd}
                    className="flex items-center gap-2 px-4 py-2 bg-brand-primary rounded-lg text-white hover:opacity-90 transition-opacity"
                >
                    <PlusIcon />
                    Add {activeTab === 'talent' ? 'Talent' : activeTab === 'locations' ? 'Location' : 'Vendor'}
                </button>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 mb-6 bg-dark-card rounded-lg p-1">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => {
                            setActiveTab(tab.id);
                            setSearchQuery('');
                            setTypeFilter('');
                        }}
                        className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors flex-1 ${
                            activeTab === tab.id
                                ? 'bg-brand-primary text-white'
                                : 'text-gray-400 hover:text-white hover:bg-dark-border'
                        }`}
                    >
                        <tab.icon />
                        <span>{tab.label}</span>
                        <span className={`ml-auto px-2 py-0.5 rounded text-xs ${
                            activeTab === tab.id ? 'bg-white/20' : 'bg-dark-border'
                        }`}>
                            {tab.count}
                        </span>
                    </button>
                ))}
            </div>

            {/* Filters */}
            <div className="flex gap-4 mb-6">
                <div className="relative flex-1">
                    <SearchIcon />
                    <input
                        type="text"
                        placeholder={`Search ${activeTab}...`}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-dark-card border border-dark-border rounded-lg text-white placeholder-gray-500"
                    />
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                        <SearchIcon />
                    </div>
                </div>
                <select
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value)}
                    className="px-4 py-2 bg-dark-card border border-dark-border rounded-lg text-white"
                >
                    <option value="">All Types</option>
                    {Object.values(getTypeOptions()).map((t) => (
                        <option key={t.id} value={t.id}>{t.icon} {t.label}</option>
                    ))}
                </select>
            </div>

            {/* Loading */}
            {loading && (
                <div className="flex items-center justify-center py-12">
                    <div className="w-8 h-8 border-2 border-brand-primary border-t-transparent rounded-full animate-spin" />
                </div>
            )}

            {/* Empty State */}
            {!loading && filteredData.length === 0 && (
                <div className="text-center py-12">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-dark-card flex items-center justify-center">
                        {activeTab === 'talent' && <UsersIcon />}
                        {activeTab === 'locations' && <MapPinIcon />}
                        {activeTab === 'vendors' && <BuildingIcon />}
                    </div>
                    <h3 className="text-lg font-medium text-white mb-2">
                        No {activeTab} found
                    </h3>
                    <p className="text-gray-400 mb-4">
                        {searchQuery || typeFilter
                            ? 'Try adjusting your filters'
                            : `Add your first ${activeTab === 'talent' ? 'talent' : activeTab === 'locations' ? 'location' : 'vendor'} to get started`
                        }
                    </p>
                    {!searchQuery && !typeFilter && (
                        <button
                            onClick={handleAdd}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-brand-primary rounded-lg text-white hover:opacity-90"
                        >
                            <PlusIcon />
                            Add {activeTab === 'talent' ? 'Talent' : activeTab === 'locations' ? 'Location' : 'Vendor'}
                        </button>
                    )}
                </div>
            )}

            {/* Talent Grid */}
            {!loading && activeTab === 'talent' && filteredData.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredData.map((talent) => (
                        <div
                            key={talent.id}
                            className="bg-dark-card rounded-lg p-4 border border-dark-border hover:border-brand-primary/50 transition-colors"
                        >
                            <div className="flex items-start gap-3">
                                <div className="w-12 h-12 rounded-full bg-dark-bg flex items-center justify-center text-2xl">
                                    {TALENT_TYPES[talent.type]?.icon || '🎭'}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-medium text-white truncate">{talent.name}</h3>
                                    <p className="text-sm text-gray-400">{TALENT_TYPES[talent.type]?.label}</p>
                                </div>
                                <span
                                    className="px-2 py-0.5 rounded text-xs font-medium"
                                    style={{
                                        backgroundColor: `${TALENT_STATUS[talent.status]?.color}20`,
                                        color: TALENT_STATUS[talent.status]?.color
                                    }}
                                >
                                    {TALENT_STATUS[talent.status]?.label}
                                </span>
                            </div>

                            {talent.skills?.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-3">
                                    {talent.skills.slice(0, 3).map((skill, i) => (
                                        <span key={i} className="px-2 py-0.5 bg-dark-bg rounded text-xs text-gray-400">
                                            {skill}
                                        </span>
                                    ))}
                                    {talent.skills.length > 3 && (
                                        <span className="px-2 py-0.5 text-xs text-gray-500">
                                            +{talent.skills.length - 3} more
                                        </span>
                                    )}
                                </div>
                            )}

                            {talent.day_rate && (
                                <p className="text-sm text-gray-400 mt-2">
                                    {talent.currency} {talent.day_rate.toLocaleString()}/day
                                </p>
                            )}

                            <div className="flex gap-2 mt-4 pt-3 border-t border-dark-border">
                                <button
                                    onClick={() => handleEdit(talent)}
                                    className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 text-sm text-gray-400 hover:text-white hover:bg-dark-bg rounded transition-colors"
                                >
                                    <EditIcon /> Edit
                                </button>
                                <button
                                    onClick={() => handleDelete(talent)}
                                    className="flex items-center justify-center gap-1 px-3 py-1.5 text-sm text-gray-400 hover:text-red-400 hover:bg-red-400/10 rounded transition-colors"
                                >
                                    <TrashIcon />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Locations Grid */}
            {!loading && activeTab === 'locations' && filteredData.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredData.map((location) => (
                        <div
                            key={location.id}
                            className="bg-dark-card rounded-lg p-4 border border-dark-border hover:border-brand-primary/50 transition-colors"
                        >
                            <div className="flex items-start gap-3">
                                <div className="w-12 h-12 rounded-lg bg-dark-bg flex items-center justify-center text-2xl">
                                    {LOCATION_TYPES[location.type]?.icon || '📍'}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-medium text-white truncate">{location.name}</h3>
                                    <p className="text-sm text-gray-400">{LOCATION_TYPES[location.type]?.label}</p>
                                </div>
                                <span
                                    className="px-2 py-0.5 rounded text-xs font-medium"
                                    style={{
                                        backgroundColor: `${LOCATION_STATUS[location.status]?.color}20`,
                                        color: LOCATION_STATUS[location.status]?.color
                                    }}
                                >
                                    {LOCATION_STATUS[location.status]?.label}
                                </span>
                            </div>

                            {(location.city || location.country) && (
                                <p className="text-sm text-gray-400 mt-2">
                                    {[location.city, location.country].filter(Boolean).join(', ')}
                                </p>
                            )}

                            <div className="flex gap-3 mt-3 text-xs text-gray-500">
                                {location.power_available && <span>⚡ Power</span>}
                                {location.wifi_available && <span>📶 WiFi</span>}
                                {location.permits_required && <span>📋 Permits</span>}
                                {location.max_crew_size && <span>👥 Max {location.max_crew_size}</span>}
                            </div>

                            {location.day_rate && (
                                <p className="text-sm text-gray-400 mt-2">
                                    {location.currency} {location.day_rate.toLocaleString()}/day
                                    {location.half_day_rate && ` • ${location.half_day_rate.toLocaleString()}/half`}
                                </p>
                            )}

                            <div className="flex gap-2 mt-4 pt-3 border-t border-dark-border">
                                <button
                                    onClick={() => handleEdit(location)}
                                    className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 text-sm text-gray-400 hover:text-white hover:bg-dark-bg rounded transition-colors"
                                >
                                    <EditIcon /> Edit
                                </button>
                                <button
                                    onClick={() => handleDelete(location)}
                                    className="flex items-center justify-center gap-1 px-3 py-1.5 text-sm text-gray-400 hover:text-red-400 hover:bg-red-400/10 rounded transition-colors"
                                >
                                    <TrashIcon />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Vendors Grid */}
            {!loading && activeTab === 'vendors' && filteredData.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredData.map((vendor) => (
                        <div
                            key={vendor.id}
                            className="bg-dark-card rounded-lg p-4 border border-dark-border hover:border-brand-primary/50 transition-colors"
                        >
                            <div className="flex items-start gap-3">
                                <div className="w-12 h-12 rounded-lg bg-dark-bg flex items-center justify-center text-2xl">
                                    {VENDOR_TYPES[vendor.type]?.icon || '📦'}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <h3 className="font-medium text-white truncate">{vendor.name}</h3>
                                        {vendor.is_preferred && (
                                            <span className="text-yellow-400" title="Preferred Vendor">⭐</span>
                                        )}
                                    </div>
                                    <p className="text-sm text-gray-400">{VENDOR_TYPES[vendor.type]?.label}</p>
                                </div>
                            </div>

                            {vendor.company && (
                                <p className="text-sm text-gray-300 mt-2">{vendor.company}</p>
                            )}

                            {vendor.rating && (
                                <div className="flex gap-0.5 mt-2">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <StarIcon key={star} filled={star <= vendor.rating} />
                                    ))}
                                </div>
                            )}

                            {vendor.services?.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-3">
                                    {vendor.services.slice(0, 3).map((service, i) => (
                                        <span key={i} className="px-2 py-0.5 bg-dark-bg rounded text-xs text-gray-400">
                                            {service}
                                        </span>
                                    ))}
                                    {vendor.services.length > 3 && (
                                        <span className="px-2 py-0.5 text-xs text-gray-500">
                                            +{vendor.services.length - 3} more
                                        </span>
                                    )}
                                </div>
                            )}

                            <div className="flex gap-2 mt-4 pt-3 border-t border-dark-border">
                                <button
                                    onClick={() => handleEdit(vendor)}
                                    className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 text-sm text-gray-400 hover:text-white hover:bg-dark-bg rounded transition-colors"
                                >
                                    <EditIcon /> Edit
                                </button>
                                <button
                                    onClick={() => handleDelete(vendor)}
                                    className="flex items-center justify-center gap-1 px-3 py-1.5 text-sm text-gray-400 hover:text-red-400 hover:bg-red-400/10 rounded transition-colors"
                                >
                                    <TrashIcon />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Modals */}
            {showModal === 'talent' && (
                <TalentModal
                    talent={editingItem}
                    onClose={() => {
                        setShowModal(null);
                        setEditingItem(null);
                    }}
                    onSave={handleSave}
                />
            )}

            {showModal === 'locations' && (
                <LocationModal
                    location={editingItem}
                    onClose={() => {
                        setShowModal(null);
                        setEditingItem(null);
                    }}
                    onSave={handleSave}
                />
            )}

            {showModal === 'vendors' && (
                <VendorModal
                    vendor={editingItem}
                    onClose={() => {
                        setShowModal(null);
                        setEditingItem(null);
                    }}
                    onSave={handleSave}
                />
            )}
        </div>
    );
}
