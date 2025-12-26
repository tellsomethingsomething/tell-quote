import { useState, useEffect, useCallback } from 'react';
import { pdf } from '@react-pdf/renderer';
import { useCallSheetStore, CALL_SHEET_STATUS, CALL_SHEET_STATUS_CONFIG, DEPARTMENTS } from '../store/callSheetStore';
import { useCrewStore } from '../store/crewStore';
import { useProjectStore } from '../store/projectStore';
import { useSettingsStore } from '../store/settingsStore';
import CallSheetPDF from '../components/pdf/CallSheetPDF';

// Available modular sections that users can enable/disable
const AVAILABLE_SECTIONS = [
    { id: 'production', label: 'Production Info', description: 'Title, company, episode details', default: true },
    { id: 'shoot', label: 'Shoot Details', description: 'Date, day number, call times', default: true },
    { id: 'personnel', label: 'Key Personnel', description: 'Director, producer, PM', default: true },
    { id: 'crew', label: 'Crew List', description: 'Full crew with contacts', default: true },
    { id: 'cast', label: 'Cast / Talent', description: 'Cast list with call times', default: false },
    { id: 'schedule', label: 'Schedule', description: 'Running order / timeline', default: true },
    { id: 'location', label: 'Location', description: 'Venue, address, parking', default: true },
    { id: 'weather', label: 'Weather', description: 'Forecast and conditions', default: false },
    { id: 'catering', label: 'Catering', description: 'Meals, times, dietary', default: false },
    { id: 'safety', label: 'Health & Safety', description: 'Hospital, emergency contacts', default: false },
    { id: 'transport', label: 'Transport', description: 'Travel arrangements', default: false },
    { id: 'wardrobe', label: 'Wardrobe', description: 'Dress code, costume notes', default: false },
    { id: 'notes', label: 'Important Notes', description: 'Critical information', default: true },
];

// Tab Components
const TABS = [
    { id: 'overview', label: 'Overview', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
    { id: 'crew', label: 'Crew', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z' },
    { id: 'cast', label: 'Cast', icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' },
    { id: 'schedule', label: 'Schedule', icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' },
    { id: 'travel', label: 'Travel', icon: 'M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
    { id: 'logistics', label: 'Logistics', icon: 'M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z' },
    { id: 'technical', label: 'Technical', icon: 'M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z' },
    { id: 'contacts', label: 'Contacts', icon: 'M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z' },
    { id: 'location', label: 'Location', icon: 'M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z' },
    { id: 'safety', label: 'Safety', icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z' },
    { id: 'notes', label: 'Notes', icon: 'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z' },
    { id: 'settings', label: 'Sections', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z' },
];

// Transport types for transfers
const TRANSPORT_TYPES = [
    { value: 'minibus', label: 'Minibus' },
    { value: 'car', label: 'Car' },
    { value: 'van', label: 'Van' },
    { value: 'coach', label: 'Coach' },
    { value: 'taxi', label: 'Taxi' },
    { value: 'other', label: 'Other' },
];

// Emergency contact types
const EMERGENCY_CONTACT_TYPES = [
    { value: 'hospital', label: 'Hospital' },
    { value: 'police', label: 'Police' },
    { value: 'fire', label: 'Fire' },
    { value: 'ambulance', label: 'Ambulance' },
    { value: 'security', label: 'Security' },
    { value: 'production_emergency', label: 'Production Emergency' },
    { value: 'venue_emergency', label: 'Venue Emergency' },
    { value: 'hotel_emergency', label: 'Hotel Emergency' },
    { value: 'embassy', label: 'Embassy' },
    { value: 'insurance', label: 'Insurance' },
    { value: 'local_fixer', label: 'Local Fixer' },
    { value: 'other', label: 'Other' },
];

// Vendor types
const VENDOR_TYPES = [
    { value: 'ob', label: 'OB / Outside Broadcast' },
    { value: 'lighting', label: 'Lighting' },
    { value: 'satellite', label: 'Satellite / Uplink' },
    { value: 'catering', label: 'Catering' },
    { value: 'transport', label: 'Transport' },
    { value: 'security', label: 'Security' },
    { value: 'audio', label: 'Audio' },
    { value: 'graphics', label: 'Graphics / VT' },
    { value: 'comms', label: 'Communications' },
    { value: 'generator', label: 'Generator / Power' },
    { value: 'other', label: 'Other' },
];

// Form Input Component
function FormInput({ label, value, onChange, type = 'text', placeholder, className = '', ...props }) {
    return (
        <div className={className}>
            <label className="block text-sm text-gray-400 mb-1">{label}</label>
            <input
                type={type}
                value={value || ''}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                className="w-full px-3 py-2 bg-dark-bg border border-dark-border rounded-lg text-white placeholder-gray-500 focus:border-accent-primary focus:outline-none"
                {...props}
            />
        </div>
    );
}

function FormTextarea({ label, value, onChange, rows = 3, placeholder, className = '' }) {
    return (
        <div className={className}>
            <label className="block text-sm text-gray-400 mb-1">{label}</label>
            <textarea
                value={value || ''}
                onChange={(e) => onChange(e.target.value)}
                rows={rows}
                placeholder={placeholder}
                className="w-full px-3 py-2 bg-dark-bg border border-dark-border rounded-lg text-white placeholder-gray-500 focus:border-accent-primary focus:outline-none resize-none"
            />
        </div>
    );
}

function FormSelect({ label, value, onChange, options, placeholder, className = '' }) {
    return (
        <div className={className}>
            <label className="block text-sm text-gray-400 mb-1">{label}</label>
            <select
                value={value || ''}
                onChange={(e) => onChange(e.target.value)}
                className="w-full px-3 py-2 bg-dark-bg border border-dark-border rounded-lg text-white focus:border-accent-primary focus:outline-none"
            >
                {placeholder && <option value="">{placeholder}</option>}
                {options.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
            </select>
        </div>
    );
}

// Section Header
function SectionHeader({ title, children }) {
    return (
        <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">{title}</h3>
            {children}
        </div>
    );
}

// Collapsible Section Component
function CollapsibleSection({ id, title, enabled, children, onToggle }) {
    const [isOpen, setIsOpen] = useState(true);

    if (!enabled) return null;

    return (
        <div className="bg-dark-card border border-dark-border rounded-xl overflow-hidden">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full px-6 py-4 flex items-center justify-between hover:bg-white/5 transition-colors"
            >
                <h3 className="text-lg font-semibold text-white">{title}</h3>
                <svg
                    className={`w-5 h-5 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </button>
            {isOpen && (
                <div className="px-6 pb-6 pt-2 border-t border-dark-border">
                    {children}
                </div>
            )}
        </div>
    );
}

// Get default enabled sections
function getDefaultSections() {
    return AVAILABLE_SECTIONS.reduce((acc, section) => {
        acc[section.id] = section.default;
        return acc;
    }, {});
}

// Sections Settings Tab
function SectionsSettingsTab({ enabledSections, onToggleSection }) {
    return (
        <div className="space-y-6">
            <div className="bg-dark-card border border-dark-border rounded-xl p-6">
                <SectionHeader title="Configure Call Sheet Sections" />
                <p className="text-gray-400 text-sm mb-6">
                    Choose which sections to include in this call sheet. Disabled sections won't appear in the editor or PDF export.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {AVAILABLE_SECTIONS.map(section => {
                        const isEnabled = enabledSections[section.id] ?? section.default;
                        return (
                            <label
                                key={section.id}
                                className={`flex items-start gap-3 p-4 rounded-xl cursor-pointer transition-all ${
                                    isEnabled
                                        ? 'bg-accent-primary/10 border-2 border-accent-primary/30'
                                        : 'bg-dark-bg border-2 border-dark-border hover:border-gray-600'
                                }`}
                            >
                                <input
                                    type="checkbox"
                                    checked={isEnabled}
                                    onChange={() => onToggleSection(section.id)}
                                    className="mt-1 w-4 h-4 rounded border-gray-600 bg-dark-bg text-accent-primary focus:ring-accent-primary"
                                />
                                <div>
                                    <p className="font-medium text-white">{section.label}</p>
                                    <p className="text-sm text-gray-400">{section.description}</p>
                                </div>
                            </label>
                        );
                    })}
                </div>

                <div className="flex gap-3 mt-6 pt-6 border-t border-dark-border">
                    <button
                        onClick={() => {
                            AVAILABLE_SECTIONS.forEach(s => {
                                if (!enabledSections[s.id]) onToggleSection(s.id);
                            });
                        }}
                        className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors"
                    >
                        Enable All
                    </button>
                    <button
                        onClick={() => {
                            AVAILABLE_SECTIONS.forEach(s => {
                                if (enabledSections[s.id] && !['production', 'shoot', 'crew'].includes(s.id)) {
                                    onToggleSection(s.id);
                                }
                            });
                        }}
                        className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors"
                    >
                        Minimal (Essentials Only)
                    </button>
                </div>
            </div>

            {/* Quick Presets */}
            <div className="bg-dark-card border border-dark-border rounded-xl p-6">
                <SectionHeader title="Quick Presets" />
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <button
                        onClick={() => {
                            const preset = { production: true, shoot: true, personnel: true, crew: true, schedule: true, location: true, notes: true };
                            Object.keys(preset).forEach(k => {
                                if (enabledSections[k] !== preset[k]) onToggleSection(k);
                            });
                        }}
                        className="p-4 rounded-xl bg-dark-bg border border-dark-border hover:border-gray-600 text-left transition-colors"
                    >
                        <p className="font-medium text-white">Simple Shoot</p>
                        <p className="text-sm text-gray-400">Basic info, crew, schedule, location</p>
                    </button>
                    <button
                        onClick={() => {
                            const preset = { production: true, shoot: true, personnel: true, crew: true, cast: true, schedule: true, location: true, weather: true, catering: true, wardrobe: true, notes: true };
                            AVAILABLE_SECTIONS.forEach(s => {
                                const shouldEnable = !!preset[s.id];
                                if (enabledSections[s.id] !== shouldEnable) onToggleSection(s.id);
                            });
                        }}
                        className="p-4 rounded-xl bg-dark-bg border border-dark-border hover:border-gray-600 text-left transition-colors"
                    >
                        <p className="font-medium text-white">Full Production</p>
                        <p className="text-sm text-gray-400">Everything except safety/transport</p>
                    </button>
                    <button
                        onClick={() => {
                            AVAILABLE_SECTIONS.forEach(s => {
                                if (!enabledSections[s.id]) onToggleSection(s.id);
                            });
                        }}
                        className="p-4 rounded-xl bg-dark-bg border border-dark-border hover:border-gray-600 text-left transition-colors"
                    >
                        <p className="font-medium text-white">Everything</p>
                        <p className="text-sm text-gray-400">All available sections</p>
                    </button>
                </div>
            </div>
        </div>
    );
}

// Overview Tab (modular)
function OverviewTab({ sheet, onUpdate, enabledSections }) {
    const sections = enabledSections || getDefaultSections();

    return (
        <div className="space-y-6">
            {/* Production Info */}
            <CollapsibleSection id="production" title="Production Information" enabled={sections.production}>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <FormInput
                        label="Production Title"
                        value={sheet.productionTitle}
                        onChange={(v) => onUpdate({ productionTitle: v })}
                        placeholder="e.g., Brand Campaign 2024"
                        className="lg:col-span-2"
                    />
                    <FormInput
                        label="Production Company"
                        value={sheet.productionCompany}
                        onChange={(v) => onUpdate({ productionCompany: v })}
                        placeholder="e.g., Tell Productions"
                    />
                    <FormInput
                        label="Episode Title"
                        value={sheet.episodeTitle}
                        onChange={(v) => onUpdate({ episodeTitle: v })}
                        placeholder="e.g., The Launch"
                    />
                    <FormInput
                        label="Episode Number"
                        value={sheet.episodeNumber}
                        onChange={(v) => onUpdate({ episodeNumber: v })}
                        placeholder="e.g., 1"
                    />
                </div>
            </CollapsibleSection>

            {/* Shoot Details */}
            <CollapsibleSection id="shoot" title="Shoot Details" enabled={sections.shoot}>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <FormInput
                        label="Shoot Date"
                        type="date"
                        value={sheet.shootDate}
                        onChange={(v) => onUpdate({ shootDate: v })}
                    />
                    <div className="grid grid-cols-2 gap-2">
                        <FormInput
                            label="Day"
                            type="number"
                            min="1"
                            value={sheet.dayNumber}
                            onChange={(v) => onUpdate({ dayNumber: parseInt(v) || null })}
                        />
                        <FormInput
                            label="of Total"
                            type="number"
                            min="1"
                            value={sheet.totalDays}
                            onChange={(v) => onUpdate({ totalDays: parseInt(v) || null })}
                        />
                    </div>
                    <FormInput
                        label="Crew Call Time"
                        type="time"
                        value={sheet.generalCallTime}
                        onChange={(v) => onUpdate({ generalCallTime: v })}
                    />
                    <FormInput
                        label="First Shot / TX Time"
                        type="time"
                        value={sheet.firstShotTime}
                        onChange={(v) => onUpdate({ firstShotTime: v })}
                    />
                    <FormInput
                        label="Estimated Wrap"
                        type="time"
                        value={sheet.estimatedWrap}
                        onChange={(v) => onUpdate({ estimatedWrap: v })}
                    />
                    {sheet.status === CALL_SHEET_STATUS.COMPLETED && (
                        <FormInput
                            label="Actual Wrap"
                            type="time"
                            value={sheet.actualWrap}
                            onChange={(v) => onUpdate({ actualWrap: v })}
                        />
                    )}
                </div>
            </CollapsibleSection>

            {/* Key Personnel */}
            <CollapsibleSection id="personnel" title="Key Personnel" enabled={sections.personnel}>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormInput
                        label="Director"
                        value={sheet.director}
                        onChange={(v) => onUpdate({ director: v })}
                        placeholder="Director name"
                    />
                    <FormInput
                        label="Producer"
                        value={sheet.producer}
                        onChange={(v) => onUpdate({ producer: v })}
                        placeholder="Producer name"
                    />
                    <FormInput
                        label="Production Manager"
                        value={sheet.productionManager}
                        onChange={(v) => onUpdate({ productionManager: v })}
                        placeholder="PM name"
                    />
                </div>
            </CollapsibleSection>

            {/* Weather */}
            <CollapsibleSection id="weather" title="Weather Forecast" enabled={sections.weather}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormInput
                        label="Weather Forecast"
                        value={sheet.weatherForecast}
                        onChange={(v) => onUpdate({ weatherForecast: v })}
                        placeholder="e.g., Sunny, 22°C, Light wind"
                    />
                    <FormTextarea
                        label="Weather Notes"
                        value={sheet.weatherNotes}
                        onChange={(v) => onUpdate({ weatherNotes: v })}
                        rows={2}
                        placeholder="Any weather-related notes or precautions"
                    />
                </div>
            </CollapsibleSection>

            {/* Catering */}
            <CollapsibleSection id="catering" title="Catering" enabled={sections.catering}>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <FormInput
                        label="Breakfast Time"
                        type="time"
                        value={sheet.breakfastTime}
                        onChange={(v) => onUpdate({ breakfastTime: v })}
                    />
                    <FormInput
                        label="Breakfast Location"
                        value={sheet.breakfastLocation}
                        onChange={(v) => onUpdate({ breakfastLocation: v })}
                        placeholder="e.g., Base Camp"
                        className="lg:col-span-2"
                    />
                    <FormInput
                        label="Lunch Time"
                        type="time"
                        value={sheet.lunchTime}
                        onChange={(v) => onUpdate({ lunchTime: v })}
                    />
                    <FormInput
                        label="Lunch Location"
                        value={sheet.lunchLocation}
                        onChange={(v) => onUpdate({ lunchLocation: v })}
                        placeholder="e.g., Craft Services Tent"
                        className="lg:col-span-2"
                    />
                    <FormInput
                        label="Catering Company"
                        value={sheet.cateringCompany}
                        onChange={(v) => onUpdate({ cateringCompany: v })}
                        placeholder="Catering provider"
                    />
                    <FormInput
                        label="Catering Contact"
                        value={sheet.cateringContact}
                        onChange={(v) => onUpdate({ cateringContact: v })}
                        placeholder="Contact number"
                    />
                    <FormTextarea
                        label="Dietary Notes"
                        value={sheet.dietaryNotes}
                        onChange={(v) => onUpdate({ dietaryNotes: v })}
                        rows={2}
                        placeholder="Allergies, vegetarian options, etc."
                    />
                </div>
            </CollapsibleSection>

            {/* Transport */}
            <CollapsibleSection id="transport" title="Transport" enabled={sections.transport}>
                <FormTextarea
                    label="Transport Notes"
                    value={sheet.transportNotes}
                    onChange={(v) => onUpdate({ transportNotes: v })}
                    rows={4}
                    placeholder="Travel arrangements, pickup times, unit moves..."
                />
            </CollapsibleSection>

            {/* Wardrobe */}
            <CollapsibleSection id="wardrobe" title="Wardrobe" enabled={sections.wardrobe}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormTextarea
                        label="Wardrobe / Dress Code"
                        value={sheet.wardrobeNotes}
                        onChange={(v) => onUpdate({ wardrobeNotes: v })}
                        rows={3}
                        placeholder="Dress code, costume notes, blacks required..."
                    />
                    <FormTextarea
                        label="Hair & Makeup Notes"
                        value={sheet.makeupNotes}
                        onChange={(v) => onUpdate({ makeupNotes: v })}
                        rows={3}
                        placeholder="H&MU requirements, natural look, etc."
                    />
                </div>
            </CollapsibleSection>

            {/* Important Notes */}
            <CollapsibleSection id="notes" title="Important Notes" enabled={sections.notes}>
                <FormTextarea
                    label="Important Notes (shown prominently on call sheet)"
                    value={sheet.importantNotes}
                    onChange={(v) => onUpdate({ importantNotes: v })}
                    rows={5}
                    placeholder="Any critical information for the crew - this will be displayed prominently..."
                />
            </CollapsibleSection>

            {/* No sections enabled message */}
            {!Object.values(sections).some(v => v) && (
                <div className="text-center py-12 text-gray-500">
                    <p>No sections enabled. Go to the Sections tab to configure which sections to include.</p>
                </div>
            )}
        </div>
    );
}

// Crew Tab
function CrewTab({ crew, onAddCrew, onUpdateCrew, onRemoveCrew, callSheetId }) {
    const [showAddModal, setShowAddModal] = useState(false);
    const { members: allCrew } = useCrewStore();

    // Group crew by department
    const crewByDepartment = crew.reduce((acc, member) => {
        const dept = member.department || 'other';
        if (!acc[dept]) acc[dept] = [];
        acc[dept].push(member);
        return acc;
    }, {});

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-semibold text-white">Crew List</h3>
                    <p className="text-sm text-gray-400">{crew.length} crew members</p>
                </div>
                <button
                    onClick={() => setShowAddModal(true)}
                    className="px-4 py-2 bg-accent-primary text-white rounded-lg font-medium hover:bg-accent-primary/90 transition-colors flex items-center gap-2"
                >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Add Crew
                </button>
            </div>

            {/* Crew by Department */}
            {DEPARTMENTS.map(dept => {
                const deptCrew = crewByDepartment[dept.id] || [];
                if (deptCrew.length === 0) return null;

                return (
                    <div key={dept.id} className="bg-dark-card border border-dark-border rounded-xl overflow-hidden">
                        <div
                            className="px-4 py-3 border-b border-dark-border flex items-center gap-3"
                            style={{ backgroundColor: `${dept.color}15` }}
                        >
                            <div
                                className="w-3 h-3 rounded-full"
                                style={{ backgroundColor: dept.color }}
                            />
                            <h4 className="font-medium text-white">{dept.name}</h4>
                            <span className="text-sm text-gray-400">({deptCrew.length})</span>
                        </div>
                        <div className="divide-y divide-dark-border">
                            {deptCrew.map(member => (
                                <div key={member.id} className="px-4 py-3 flex items-center gap-4">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <p className="font-medium text-white">{member.name}</p>
                                            {member.confirmed && (
                                                <span className="px-1.5 py-0.5 bg-green-500/20 text-green-400 text-xs rounded">
                                                    Confirmed
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-sm text-gray-400">{member.roleTitle}</p>
                                    </div>
                                    <div className="text-sm text-gray-400">
                                        {member.callTime && (
                                            <span className="mr-4">Call: {member.callTime}</span>
                                        )}
                                        {member.phone && (
                                            <span>{member.phone}</span>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {!member.confirmed && (
                                            <button
                                                onClick={() => onUpdateCrew(member.id, { confirmed: true })}
                                                className="p-1.5 text-gray-400 hover:text-green-400 transition-colors"
                                                title="Confirm"
                                            >
                                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                </svg>
                                            </button>
                                        )}
                                        <button
                                            onClick={() => onRemoveCrew(member.id)}
                                            className="p-1.5 text-gray-400 hover:text-red-400 transition-colors"
                                            title="Remove"
                                        >
                                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                            </svg>
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                );
            })}

            {/* Other/Unassigned */}
            {crewByDepartment['other']?.length > 0 && (
                <div className="bg-dark-card border border-dark-border rounded-xl overflow-hidden">
                    <div className="px-4 py-3 border-b border-dark-border bg-gray-800/50">
                        <h4 className="font-medium text-white">Other</h4>
                    </div>
                    <div className="divide-y divide-dark-border">
                        {crewByDepartment['other'].map(member => (
                            <div key={member.id} className="px-4 py-3 flex items-center gap-4">
                                <div className="flex-1 min-w-0">
                                    <p className="font-medium text-white">{member.name}</p>
                                    <p className="text-sm text-gray-400">{member.roleTitle}</p>
                                </div>
                                <button
                                    onClick={() => onRemoveCrew(member.id)}
                                    className="p-1.5 text-gray-400 hover:text-red-400 transition-colors"
                                >
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Empty State */}
            {crew.length === 0 && (
                <div className="text-center py-12 bg-dark-card border border-dark-border rounded-xl">
                    <svg className="w-16 h-16 mx-auto mb-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <h3 className="text-lg font-medium text-white mb-2">No crew added</h3>
                    <p className="text-gray-400 mb-4">Add crew members to this call sheet</p>
                    <button
                        onClick={() => setShowAddModal(true)}
                        className="px-4 py-2 bg-accent-primary text-white rounded-lg font-medium hover:bg-accent-primary/90 transition-colors"
                    >
                        Add Crew
                    </button>
                </div>
            )}

            {/* Add Crew Modal */}
            {showAddModal && (
                <AddCrewModal
                    isOpen={showAddModal}
                    onClose={() => setShowAddModal(false)}
                    allCrew={allCrew}
                    existingCrew={crew}
                    onAdd={onAddCrew}
                    callSheetId={callSheetId}
                />
            )}
        </div>
    );
}

// Add Crew Modal
function AddCrewModal({ isOpen, onClose, allCrew, existingCrew, onAdd, callSheetId }) {
    const [mode, setMode] = useState('database'); // 'database' | 'manual'
    const [selectedCrew, setSelectedCrew] = useState([]);
    const [manualForm, setManualForm] = useState({
        name: '',
        roleTitle: '',
        department: '',
        phone: '',
        email: '',
        callTime: '',
    });
    const [saving, setSaving] = useState(false);

    const existingIds = existingCrew.map(c => c.crewId).filter(Boolean);
    const availableCrew = allCrew.filter(c => !existingIds.includes(c.id));

    const handleAddFromDatabase = async () => {
        if (selectedCrew.length === 0) return;
        setSaving(true);
        try {
            for (const crewMember of selectedCrew) {
                await onAdd(callSheetId, {
                    crewId: crewMember.id,
                    name: `${crewMember.firstName} ${crewMember.lastName}`.trim(),
                    roleTitle: crewMember.primaryRole,
                    department: crewMember.department,
                    phone: crewMember.phone,
                    email: crewMember.email,
                });
            }
            onClose();
        } catch (e) {
            console.error('Failed to add crew:', e);
        } finally {
            setSaving(false);
        }
    };

    const handleAddManual = async () => {
        if (!manualForm.name) return;
        setSaving(true);
        try {
            await onAdd(callSheetId, manualForm);
            onClose();
        } catch (e) {
            console.error('Failed to add crew:', e);
        } finally {
            setSaving(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
            <div className="bg-[#1a1f2e] border border-dark-border rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
                <div className="p-6 border-b border-dark-border">
                    <h2 className="text-xl font-bold text-white">Add Crew Member</h2>
                    <div className="flex gap-2 mt-4">
                        <button
                            onClick={() => setMode('database')}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                mode === 'database'
                                    ? 'bg-accent-primary/20 text-accent-primary'
                                    : 'text-gray-400 hover:text-white'
                            }`}
                        >
                            From Database
                        </button>
                        <button
                            onClick={() => setMode('manual')}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                mode === 'manual'
                                    ? 'bg-accent-primary/20 text-accent-primary'
                                    : 'text-gray-400 hover:text-white'
                            }`}
                        >
                            Manual Entry
                        </button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-6">
                    {mode === 'database' ? (
                        <div className="space-y-2">
                            {availableCrew.length > 0 ? (
                                availableCrew.map(member => (
                                    <label
                                        key={member.id}
                                        className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                                            selectedCrew.includes(member)
                                                ? 'bg-accent-primary/20 border border-accent-primary/30'
                                                : 'bg-dark-bg border border-dark-border hover:border-gray-600'
                                        }`}
                                    >
                                        <input
                                            type="checkbox"
                                            checked={selectedCrew.includes(member)}
                                            onChange={(e) => {
                                                if (e.target.checked) {
                                                    setSelectedCrew([...selectedCrew, member]);
                                                } else {
                                                    setSelectedCrew(selectedCrew.filter(c => c.id !== member.id));
                                                }
                                            }}
                                            className="w-4 h-4 rounded border-gray-600 bg-dark-bg text-accent-primary focus:ring-accent-primary"
                                        />
                                        <div className="flex-1">
                                            <p className="font-medium text-white">
                                                {member.firstName} {member.lastName}
                                            </p>
                                            <p className="text-sm text-gray-400">
                                                {member.primaryRole} - {member.department}
                                            </p>
                                        </div>
                                        <span className="text-sm text-gray-500">{member.phone}</span>
                                    </label>
                                ))
                            ) : (
                                <p className="text-center text-gray-500 py-8">
                                    No crew members available or all have been added
                                </p>
                            )}
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <FormInput
                                label="Name *"
                                value={manualForm.name}
                                onChange={(v) => setManualForm({ ...manualForm, name: v })}
                                placeholder="Full name"
                            />
                            <FormInput
                                label="Role"
                                value={manualForm.roleTitle}
                                onChange={(v) => setManualForm({ ...manualForm, roleTitle: v })}
                                placeholder="e.g., Camera Operator"
                            />
                            <FormSelect
                                label="Department"
                                value={manualForm.department}
                                onChange={(v) => setManualForm({ ...manualForm, department: v })}
                                options={DEPARTMENTS.map(d => ({ value: d.id, label: d.name }))}
                                placeholder="Select department"
                            />
                            <div className="grid grid-cols-2 gap-4">
                                <FormInput
                                    label="Phone"
                                    value={manualForm.phone}
                                    onChange={(v) => setManualForm({ ...manualForm, phone: v })}
                                    placeholder="Mobile number"
                                />
                                <FormInput
                                    label="Email"
                                    type="email"
                                    value={manualForm.email}
                                    onChange={(v) => setManualForm({ ...manualForm, email: v })}
                                    placeholder="Email address"
                                />
                            </div>
                            <FormInput
                                label="Call Time"
                                type="time"
                                value={manualForm.callTime}
                                onChange={(v) => setManualForm({ ...manualForm, callTime: v })}
                            />
                        </div>
                    )}
                </div>

                <div className="p-6 border-t border-dark-border flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={mode === 'database' ? handleAddFromDatabase : handleAddManual}
                        disabled={saving || (mode === 'database' ? selectedCrew.length === 0 : !manualForm.name)}
                        className="px-6 py-2 bg-accent-primary text-white rounded-lg font-medium hover:bg-accent-primary/90 transition-colors disabled:opacity-50"
                    >
                        {saving ? 'Adding...' : `Add ${mode === 'database' ? selectedCrew.length : ''} Crew`}
                    </button>
                </div>
            </div>
        </div>
    );
}

// Cast Tab
function CastTab({ cast, onAddCast, onUpdateCast, onRemoveCast, callSheetId }) {
    const [showAddModal, setShowAddModal] = useState(false);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-semibold text-white">Cast / Talent</h3>
                    <p className="text-sm text-gray-400">{cast.length} talent</p>
                </div>
                <button
                    onClick={() => setShowAddModal(true)}
                    className="px-4 py-2 bg-accent-primary text-white rounded-lg font-medium hover:bg-accent-primary/90 transition-colors flex items-center gap-2"
                >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Add Talent
                </button>
            </div>

            {cast.length > 0 ? (
                <div className="bg-dark-card border border-dark-border rounded-xl overflow-hidden">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-dark-border bg-dark-bg/50">
                                <th className="text-left px-4 py-3 text-sm font-medium text-gray-400">Name</th>
                                <th className="text-left px-4 py-3 text-sm font-medium text-gray-400">Character</th>
                                <th className="text-left px-4 py-3 text-sm font-medium text-gray-400">Pickup</th>
                                <th className="text-left px-4 py-3 text-sm font-medium text-gray-400">Makeup</th>
                                <th className="text-left px-4 py-3 text-sm font-medium text-gray-400">Wardrobe</th>
                                <th className="text-left px-4 py-3 text-sm font-medium text-gray-400">On Set</th>
                                <th className="text-left px-4 py-3 text-sm font-medium text-gray-400">Status</th>
                                <th className="px-4 py-3"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-dark-border">
                            {cast.map(member => (
                                <tr key={member.id} className="hover:bg-white/5">
                                    <td className="px-4 py-3">
                                        <p className="font-medium text-white">{member.name}</p>
                                    </td>
                                    <td className="px-4 py-3 text-gray-400">{member.characterName || '-'}</td>
                                    <td className="px-4 py-3 text-gray-400">{member.pickupTime || '-'}</td>
                                    <td className="px-4 py-3 text-gray-400">{member.makeupCall || '-'}</td>
                                    <td className="px-4 py-3 text-gray-400">{member.wardrobeCall || '-'}</td>
                                    <td className="px-4 py-3 text-gray-400">{member.onSetCall || '-'}</td>
                                    <td className="px-4 py-3">
                                        {member.confirmed ? (
                                            <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded-full">
                                                Confirmed
                                            </span>
                                        ) : (
                                            <span className="px-2 py-1 bg-amber-500/20 text-amber-400 text-xs rounded-full">
                                                Pending
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-4 py-3">
                                        <button
                                            onClick={() => onRemoveCast(member.id)}
                                            className="p-1.5 text-gray-400 hover:text-red-400 transition-colors"
                                        >
                                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                            </svg>
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div className="text-center py-12 bg-dark-card border border-dark-border rounded-xl">
                    <svg className="w-16 h-16 mx-auto mb-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <h3 className="text-lg font-medium text-white mb-2">No cast added</h3>
                    <p className="text-gray-400 mb-4">Add cast and talent to this call sheet</p>
                    <button
                        onClick={() => setShowAddModal(true)}
                        className="px-4 py-2 bg-accent-primary text-white rounded-lg font-medium hover:bg-accent-primary/90 transition-colors"
                    >
                        Add Talent
                    </button>
                </div>
            )}

            {/* Add Cast Modal would go here */}
        </div>
    );
}

// Schedule Tab
function ScheduleTab({ sheet, onUpdate }) {
    const schedule = sheet.schedule || [];
    const [newItem, setNewItem] = useState({ time: '', activity: '' });

    const addScheduleItem = () => {
        if (!newItem.time || !newItem.activity) return;
        const updated = [...schedule, { ...newItem, id: Date.now() }].sort((a, b) => a.time.localeCompare(b.time));
        onUpdate({ schedule: updated });
        setNewItem({ time: '', activity: '' });
    };

    const removeScheduleItem = (id) => {
        onUpdate({ schedule: schedule.filter(item => item.id !== id) });
    };

    return (
        <div className="space-y-6">
            <div className="bg-dark-card border border-dark-border rounded-xl p-6">
                <SectionHeader title="Day Schedule / Running Order" />

                {/* Add New Item */}
                <div className="flex gap-4 mb-6">
                    <input
                        type="time"
                        value={newItem.time}
                        onChange={(e) => setNewItem({ ...newItem, time: e.target.value })}
                        className="px-3 py-2 bg-dark-bg border border-dark-border rounded-lg text-white focus:border-accent-primary focus:outline-none"
                    />
                    <input
                        type="text"
                        value={newItem.activity}
                        onChange={(e) => setNewItem({ ...newItem, activity: e.target.value })}
                        placeholder="Activity / Event"
                        className="flex-1 px-3 py-2 bg-dark-bg border border-dark-border rounded-lg text-white placeholder-gray-500 focus:border-accent-primary focus:outline-none"
                    />
                    <button
                        onClick={addScheduleItem}
                        disabled={!newItem.time || !newItem.activity}
                        className="px-4 py-2 bg-accent-primary text-white rounded-lg font-medium hover:bg-accent-primary/90 transition-colors disabled:opacity-50"
                    >
                        Add
                    </button>
                </div>

                {/* Schedule List */}
                {schedule.length > 0 ? (
                    <div className="space-y-2">
                        {schedule.map((item, idx) => (
                            <div
                                key={item.id || idx}
                                className="flex items-center gap-4 p-3 bg-dark-bg rounded-lg group"
                            >
                                <span className="text-lg font-mono font-semibold text-accent-primary w-16">
                                    {item.time}
                                </span>
                                <span className="flex-1 text-white">{item.activity}</span>
                                <button
                                    onClick={() => removeScheduleItem(item.id)}
                                    className="p-1.5 text-gray-500 opacity-0 group-hover:opacity-100 hover:text-red-400 transition-all"
                                >
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-center text-gray-500 py-8">No schedule items yet. Add times and activities above.</p>
                )}
            </div>
        </div>
    );
}

// Location Tab
function LocationTab({ sheet, onUpdate }) {
    return (
        <div className="space-y-6">
            {/* Main Location */}
            <div className="bg-dark-card border border-dark-border rounded-xl p-6">
                <SectionHeader title="Main Location" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormInput
                        label="Location Name"
                        value={sheet.locationName}
                        onChange={(v) => onUpdate({ locationName: v })}
                        placeholder="e.g., Studio A, Pinewood"
                        className="md:col-span-2"
                    />
                    <FormInput
                        label="Address"
                        value={sheet.locationAddress}
                        onChange={(v) => onUpdate({ locationAddress: v })}
                        placeholder="Full street address"
                        className="md:col-span-2"
                    />
                    <FormInput
                        label="City"
                        value={sheet.locationCity}
                        onChange={(v) => onUpdate({ locationCity: v })}
                        placeholder="City"
                    />
                    <FormInput
                        label="Country"
                        value={sheet.locationCountry}
                        onChange={(v) => onUpdate({ locationCountry: v })}
                        placeholder="Country"
                    />
                    <FormInput
                        label="GPS Coordinates / What3Words"
                        value={sheet.locationCoordinates}
                        onChange={(v) => onUpdate({ locationCoordinates: v })}
                        placeholder="e.g., 51.5074,-0.1278 or ///filled.count.soap"
                        className="md:col-span-2"
                    />
                </div>
            </div>

            {/* Location Contact */}
            <div className="bg-dark-card border border-dark-border rounded-xl p-6">
                <SectionHeader title="Location Contact" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormInput
                        label="Contact Name"
                        value={sheet.locationContactName}
                        onChange={(v) => onUpdate({ locationContactName: v })}
                        placeholder="On-site contact"
                    />
                    <FormInput
                        label="Contact Phone"
                        value={sheet.locationContactPhone}
                        onChange={(v) => onUpdate({ locationContactPhone: v })}
                        placeholder="Phone number"
                    />
                    <FormTextarea
                        label="Location Notes"
                        value={sheet.locationNotes}
                        onChange={(v) => onUpdate({ locationNotes: v })}
                        rows={3}
                        placeholder="Access instructions, security protocols, etc."
                        className="md:col-span-2"
                    />
                </div>
            </div>

            {/* Parking & Base Camp */}
            <div className="bg-dark-card border border-dark-border rounded-xl p-6">
                <SectionHeader title="Parking & Base Camp" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormTextarea
                        label="Parking Information"
                        value={sheet.parkingInfo}
                        onChange={(v) => onUpdate({ parkingInfo: v })}
                        rows={3}
                        placeholder="Where to park, permits needed, load-in access"
                    />
                    <FormTextarea
                        label="Base Camp Location"
                        value={sheet.baseCampLocation}
                        onChange={(v) => onUpdate({ baseCampLocation: v })}
                        rows={3}
                        placeholder="Unit base / facilities location"
                    />
                </div>
            </div>

            {/* Map URL */}
            <div className="bg-dark-card border border-dark-border rounded-xl p-6">
                <SectionHeader title="Map" />
                <FormInput
                    label="Map URL (Google Maps, etc.)"
                    value={sheet.mapUrl}
                    onChange={(v) => onUpdate({ mapUrl: v })}
                    placeholder="https://maps.google.com/..."
                />
                {sheet.mapUrl && (
                    <div className="mt-4">
                        <a
                            href={sheet.mapUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-accent-primary hover:underline text-sm"
                        >
                            Open map in new tab
                        </a>
                    </div>
                )}
            </div>
        </div>
    );
}

// Safety Tab
function SafetyTab({ sheet, onUpdate }) {
    return (
        <div className="space-y-6">
            {/* Nearest Hospital */}
            <div className="bg-dark-card border border-dark-border rounded-xl p-6">
                <SectionHeader title="Nearest Hospital / Emergency Services" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormInput
                        label="Hospital Name"
                        value={sheet.hospitalName}
                        onChange={(v) => onUpdate({ hospitalName: v })}
                        placeholder="Nearest A&E"
                    />
                    <FormInput
                        label="Hospital Phone"
                        value={sheet.hospitalPhone}
                        onChange={(v) => onUpdate({ hospitalPhone: v })}
                        placeholder="Hospital contact"
                    />
                    <FormInput
                        label="Hospital Address"
                        value={sheet.hospitalAddress}
                        onChange={(v) => onUpdate({ hospitalAddress: v })}
                        placeholder="Full address"
                        className="md:col-span-2"
                    />
                    <FormInput
                        label="Distance / Travel Time"
                        value={sheet.hospitalDistance}
                        onChange={(v) => onUpdate({ hospitalDistance: v })}
                        placeholder="e.g., 5 miles / 10 mins"
                    />
                </div>
            </div>

            {/* Emergency Contacts */}
            <div className="bg-dark-card border border-dark-border rounded-xl p-6">
                <SectionHeader title="Emergency Contacts" />
                <FormTextarea
                    label="Emergency Contacts"
                    value={Array.isArray(sheet.emergencyContacts) ? sheet.emergencyContacts.join('\n') : sheet.emergencyContacts}
                    onChange={(v) => onUpdate({ emergencyContacts: v.split('\n').filter(Boolean) })}
                    rows={4}
                    placeholder="One contact per line, e.g.:&#10;First Aider: John Smith - 07700 900000&#10;Security: Jane Doe - 07700 900001"
                />
            </div>

            {/* Safety Notes */}
            <div className="bg-dark-card border border-dark-border rounded-xl p-6">
                <SectionHeader title="Health & Safety Notes" />
                <FormTextarea
                    label="Safety Notes"
                    value={sheet.safetyNotes}
                    onChange={(v) => onUpdate({ safetyNotes: v })}
                    rows={6}
                    placeholder="Key risks, PPE required, first aider on site, fire assembly point, any H&S considerations..."
                />
            </div>
        </div>
    );
}

// Notes Tab
function NotesTab({ sheet, onUpdate }) {
    return (
        <div className="space-y-6">
            <div className="bg-dark-card border border-dark-border rounded-xl p-6">
                <SectionHeader title="Important Notes" />
                <FormTextarea
                    label="Important Notes (shown prominently)"
                    value={sheet.importantNotes}
                    onChange={(v) => onUpdate({ importantNotes: v })}
                    rows={5}
                    placeholder="Any critical information for the crew..."
                />
            </div>

            <div className="bg-dark-card border border-dark-border rounded-xl p-6">
                <SectionHeader title="Department Notes" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormTextarea
                        label="Wardrobe Notes"
                        value={sheet.wardrobeNotes}
                        onChange={(v) => onUpdate({ wardrobeNotes: v })}
                        rows={3}
                        placeholder="Dress code, costume notes..."
                    />
                    <FormTextarea
                        label="Hair & Makeup Notes"
                        value={sheet.makeupNotes}
                        onChange={(v) => onUpdate({ makeupNotes: v })}
                        rows={3}
                        placeholder="H&MU requirements..."
                    />
                    <FormTextarea
                        label="Transport Notes"
                        value={sheet.transportNotes}
                        onChange={(v) => onUpdate({ transportNotes: v })}
                        rows={3}
                        placeholder="Transport arrangements, pickup times..."
                    />
                    <FormTextarea
                        label="Equipment Notes"
                        value={sheet.equipmentNotes}
                        onChange={(v) => onUpdate({ equipmentNotes: v })}
                        rows={3}
                        placeholder="Special equipment, kit requirements..."
                    />
                </div>
            </div>
        </div>
    );
}

// Travel Tab (Flights & Transfers)
function TravelTab({ flights, transfers, onAddFlight, onUpdateFlight, onRemoveFlight, onAddTransfer, onUpdateTransfer, onRemoveTransfer, callSheetId, crew }) {
    const [showAddFlight, setShowAddFlight] = useState(false);
    const [showAddTransfer, setShowAddTransfer] = useState(false);
    const [newFlight, setNewFlight] = useState({ crewName: '', flightType: 'outbound', departureDate: '', departureTime: '', departureAirport: '', arrivalAirport: '', flightNumber: '', airline: '' });
    const [newTransfer, setNewTransfer] = useState({ transferDate: '', transferTime: '', pickupLocation: '', dropoffLocation: '', transportType: 'minibus' });

    const handleAddFlight = async () => {
        if (!newFlight.crewName || !newFlight.departureDate) return;
        await onAddFlight(callSheetId, newFlight);
        setNewFlight({ crewName: '', flightType: 'outbound', departureDate: '', departureTime: '', departureAirport: '', arrivalAirport: '', flightNumber: '', airline: '' });
        setShowAddFlight(false);
    };

    const handleAddTransfer = async () => {
        if (!newTransfer.transferDate || !newTransfer.pickupLocation) return;
        await onAddTransfer(callSheetId, newTransfer);
        setNewTransfer({ transferDate: '', transferTime: '', pickupLocation: '', dropoffLocation: '', transportType: 'minibus' });
        setShowAddTransfer(false);
    };

    // Group flights by type
    const outboundFlights = flights.filter(f => f.flightType === 'outbound');
    const returnFlights = flights.filter(f => f.flightType === 'return');

    return (
        <div className="space-y-6">
            {/* Flights Section */}
            <div className="bg-dark-card border border-dark-border rounded-xl overflow-hidden">
                <div className="px-6 py-4 border-b border-dark-border flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-white">Flights</h3>
                    <button onClick={() => setShowAddFlight(!showAddFlight)} className="px-3 py-1.5 bg-accent-primary text-white rounded-lg text-sm font-medium hover:bg-accent-primary/90">
                        + Add Flight
                    </button>
                </div>

                {showAddFlight && (
                    <div className="px-6 py-4 bg-dark-bg/50 border-b border-dark-border">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            <FormInput label="Crew Member" value={newFlight.crewName} onChange={(v) => setNewFlight({...newFlight, crewName: v})} placeholder="Name" />
                            <FormSelect label="Type" value={newFlight.flightType} onChange={(v) => setNewFlight({...newFlight, flightType: v})} options={[{value:'outbound',label:'Outbound'},{value:'return',label:'Return'},{value:'internal',label:'Internal'}]} />
                            <FormInput label="Date" type="date" value={newFlight.departureDate} onChange={(v) => setNewFlight({...newFlight, departureDate: v})} />
                            <FormInput label="Time" type="time" value={newFlight.departureTime} onChange={(v) => setNewFlight({...newFlight, departureTime: v})} />
                            <FormInput label="From Airport" value={newFlight.departureAirport} onChange={(v) => setNewFlight({...newFlight, departureAirport: v})} placeholder="LHR" />
                            <FormInput label="To Airport" value={newFlight.arrivalAirport} onChange={(v) => setNewFlight({...newFlight, arrivalAirport: v})} placeholder="NRT" />
                            <FormInput label="Flight #" value={newFlight.flightNumber} onChange={(v) => setNewFlight({...newFlight, flightNumber: v})} placeholder="BA007" />
                            <FormInput label="Airline" value={newFlight.airline} onChange={(v) => setNewFlight({...newFlight, airline: v})} placeholder="British Airways" />
                        </div>
                        <div className="flex justify-end gap-2 mt-3">
                            <button onClick={() => setShowAddFlight(false)} className="px-3 py-1.5 text-gray-400 hover:text-white text-sm">Cancel</button>
                            <button onClick={handleAddFlight} className="px-4 py-1.5 bg-accent-primary text-white rounded-lg text-sm font-medium">Add</button>
                        </div>
                    </div>
                )}

                <div className="divide-y divide-dark-border">
                    {flights.length === 0 ? (
                        <p className="px-6 py-8 text-center text-gray-500">No flights added yet</p>
                    ) : (
                        flights.map(flight => (
                            <div key={flight.id} className="px-6 py-3 flex items-center gap-4">
                                <span className={`px-2 py-0.5 rounded text-xs font-medium ${flight.flightType === 'outbound' ? 'bg-blue-500/20 text-blue-400' : flight.flightType === 'return' ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'}`}>
                                    {flight.flightType}
                                </span>
                                <div className="flex-1 min-w-0">
                                    <p className="font-medium text-white">{flight.crewName}</p>
                                    <p className="text-sm text-gray-400">{flight.flightNumber} {flight.airline} - {flight.departureAirport} → {flight.arrivalAirport}</p>
                                </div>
                                <div className="text-sm text-gray-400">
                                    {flight.departureDate && new Date(flight.departureDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                                    {flight.departureTime && ` ${flight.departureTime}`}
                                </div>
                                <button onClick={() => onRemoveFlight(flight.id)} className="p-1.5 text-gray-400 hover:text-red-400">
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                </button>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Transfers Section */}
            <div className="bg-dark-card border border-dark-border rounded-xl overflow-hidden">
                <div className="px-6 py-4 border-b border-dark-border flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-white">Transfers</h3>
                    <button onClick={() => setShowAddTransfer(!showAddTransfer)} className="px-3 py-1.5 bg-accent-primary text-white rounded-lg text-sm font-medium hover:bg-accent-primary/90">
                        + Add Transfer
                    </button>
                </div>

                {showAddTransfer && (
                    <div className="px-6 py-4 bg-dark-bg/50 border-b border-dark-border">
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                            <FormInput label="Date" type="date" value={newTransfer.transferDate} onChange={(v) => setNewTransfer({...newTransfer, transferDate: v})} />
                            <FormInput label="Time" type="time" value={newTransfer.transferTime} onChange={(v) => setNewTransfer({...newTransfer, transferTime: v})} />
                            <FormSelect label="Type" value={newTransfer.transportType} onChange={(v) => setNewTransfer({...newTransfer, transportType: v})} options={TRANSPORT_TYPES} />
                            <FormInput label="Pickup Location" value={newTransfer.pickupLocation} onChange={(v) => setNewTransfer({...newTransfer, pickupLocation: v})} placeholder="Hotel Lobby" className="md:col-span-2" />
                            <FormInput label="Drop-off Location" value={newTransfer.dropoffLocation} onChange={(v) => setNewTransfer({...newTransfer, dropoffLocation: v})} placeholder="Venue" className="md:col-span-2" />
                        </div>
                        <div className="flex justify-end gap-2 mt-3">
                            <button onClick={() => setShowAddTransfer(false)} className="px-3 py-1.5 text-gray-400 hover:text-white text-sm">Cancel</button>
                            <button onClick={handleAddTransfer} className="px-4 py-1.5 bg-accent-primary text-white rounded-lg text-sm font-medium">Add</button>
                        </div>
                    </div>
                )}

                <div className="divide-y divide-dark-border">
                    {transfers.length === 0 ? (
                        <p className="px-6 py-8 text-center text-gray-500">No transfers added yet</p>
                    ) : (
                        transfers.map(transfer => (
                            <div key={transfer.id} className="px-6 py-3 flex items-center gap-4">
                                <span className="px-2 py-0.5 rounded text-xs font-medium bg-purple-500/20 text-purple-400">{transfer.transportType}</span>
                                <div className="flex-1 min-w-0">
                                    <p className="font-medium text-white">{transfer.pickupLocation} → {transfer.dropoffLocation}</p>
                                    {transfer.driverName && <p className="text-sm text-gray-400">Driver: {transfer.driverName} {transfer.driverPhone}</p>}
                                </div>
                                <div className="text-sm text-gray-400">
                                    {transfer.transferDate && new Date(transfer.transferDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                                    {transfer.transferTime && ` ${transfer.transferTime}`}
                                </div>
                                <button onClick={() => onRemoveTransfer(transfer.id)} className="p-1.5 text-gray-400 hover:text-red-400">
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                </button>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}

// Logistics Tab (Accommodation & Vehicles)
function LogisticsTab({ accommodation, vehicles, roomAssignments, onAddAccommodation, onRemoveAccommodation, onAddVehicle, onRemoveVehicle, callSheetId }) {
    const [showAddHotel, setShowAddHotel] = useState(false);
    const [showAddVehicle, setShowAddVehicle] = useState(false);
    const [newHotel, setNewHotel] = useState({ hotelName: '', hotelAddress: '', hotelPhone: '', bookingReference: '' });
    const [newVehicle, setNewVehicle] = useState({ vehicleType: 'OB Van', vehicleName: '', company: '', driverName: '', driverPhone: '' });

    const handleAddHotel = async () => {
        if (!newHotel.hotelName) return;
        await onAddAccommodation(callSheetId, newHotel);
        setNewHotel({ hotelName: '', hotelAddress: '', hotelPhone: '', bookingReference: '' });
        setShowAddHotel(false);
    };

    const handleAddVehicle = async () => {
        if (!newVehicle.vehicleType) return;
        await onAddVehicle(callSheetId, newVehicle);
        setNewVehicle({ vehicleType: 'OB Van', vehicleName: '', company: '', driverName: '', driverPhone: '' });
        setShowAddVehicle(false);
    };

    return (
        <div className="space-y-6">
            {/* Accommodation */}
            <div className="bg-dark-card border border-dark-border rounded-xl overflow-hidden">
                <div className="px-6 py-4 border-b border-dark-border flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-white">Accommodation</h3>
                    <button onClick={() => setShowAddHotel(!showAddHotel)} className="px-3 py-1.5 bg-accent-primary text-white rounded-lg text-sm font-medium hover:bg-accent-primary/90">
                        + Add Hotel
                    </button>
                </div>

                {showAddHotel && (
                    <div className="px-6 py-4 bg-dark-bg/50 border-b border-dark-border">
                        <div className="grid grid-cols-2 gap-3">
                            <FormInput label="Hotel Name" value={newHotel.hotelName} onChange={(v) => setNewHotel({...newHotel, hotelName: v})} placeholder="Hotel name" className="col-span-2" />
                            <FormInput label="Address" value={newHotel.hotelAddress} onChange={(v) => setNewHotel({...newHotel, hotelAddress: v})} placeholder="Full address" className="col-span-2" />
                            <FormInput label="Phone" value={newHotel.hotelPhone} onChange={(v) => setNewHotel({...newHotel, hotelPhone: v})} placeholder="+1 234 567 8900" />
                            <FormInput label="Booking Ref" value={newHotel.bookingReference} onChange={(v) => setNewHotel({...newHotel, bookingReference: v})} placeholder="ABC123" />
                        </div>
                        <div className="flex justify-end gap-2 mt-3">
                            <button onClick={() => setShowAddHotel(false)} className="px-3 py-1.5 text-gray-400 hover:text-white text-sm">Cancel</button>
                            <button onClick={handleAddHotel} className="px-4 py-1.5 bg-accent-primary text-white rounded-lg text-sm font-medium">Add</button>
                        </div>
                    </div>
                )}

                <div className="divide-y divide-dark-border">
                    {accommodation.length === 0 ? (
                        <p className="px-6 py-8 text-center text-gray-500">No accommodation added yet</p>
                    ) : (
                        accommodation.map(hotel => (
                            <div key={hotel.id} className="px-6 py-4">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <p className="font-semibold text-white text-lg">{hotel.hotelName}</p>
                                        <p className="text-sm text-gray-400">{hotel.hotelAddress}</p>
                                        <div className="flex gap-4 mt-2 text-sm">
                                            {hotel.hotelPhone && <span className="text-gray-400">Tel: {hotel.hotelPhone}</span>}
                                            {hotel.bookingReference && <span className="text-accent-primary">Ref: {hotel.bookingReference}</span>}
                                        </div>
                                    </div>
                                    <button onClick={() => onRemoveAccommodation(hotel.id)} className="p-1.5 text-gray-400 hover:text-red-400">
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Vehicles */}
            <div className="bg-dark-card border border-dark-border rounded-xl overflow-hidden">
                <div className="px-6 py-4 border-b border-dark-border flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-white">Vehicles & Equipment</h3>
                    <button onClick={() => setShowAddVehicle(!showAddVehicle)} className="px-3 py-1.5 bg-accent-primary text-white rounded-lg text-sm font-medium hover:bg-accent-primary/90">
                        + Add Vehicle
                    </button>
                </div>

                {showAddVehicle && (
                    <div className="px-6 py-4 bg-dark-bg/50 border-b border-dark-border">
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                            <FormInput label="Vehicle Type" value={newVehicle.vehicleType} onChange={(v) => setNewVehicle({...newVehicle, vehicleType: v})} placeholder="OB Van, Equipment Truck..." />
                            <FormInput label="Vehicle Name/ID" value={newVehicle.vehicleName} onChange={(v) => setNewVehicle({...newVehicle, vehicleName: v})} placeholder="Unit 1" />
                            <FormInput label="Company" value={newVehicle.company} onChange={(v) => setNewVehicle({...newVehicle, company: v})} placeholder="Provider" />
                            <FormInput label="Driver Name" value={newVehicle.driverName} onChange={(v) => setNewVehicle({...newVehicle, driverName: v})} />
                            <FormInput label="Driver Phone" value={newVehicle.driverPhone} onChange={(v) => setNewVehicle({...newVehicle, driverPhone: v})} />
                        </div>
                        <div className="flex justify-end gap-2 mt-3">
                            <button onClick={() => setShowAddVehicle(false)} className="px-3 py-1.5 text-gray-400 hover:text-white text-sm">Cancel</button>
                            <button onClick={handleAddVehicle} className="px-4 py-1.5 bg-accent-primary text-white rounded-lg text-sm font-medium">Add</button>
                        </div>
                    </div>
                )}

                <div className="divide-y divide-dark-border">
                    {vehicles.length === 0 ? (
                        <p className="px-6 py-8 text-center text-gray-500">No vehicles added yet</p>
                    ) : (
                        vehicles.map(vehicle => (
                            <div key={vehicle.id} className="px-6 py-3 flex items-center gap-4">
                                <span className="px-2 py-0.5 rounded text-xs font-medium bg-orange-500/20 text-orange-400">{vehicle.vehicleType}</span>
                                <div className="flex-1 min-w-0">
                                    <p className="font-medium text-white">{vehicle.vehicleName || vehicle.vehicleType}</p>
                                    <p className="text-sm text-gray-400">{vehicle.company} {vehicle.driverName && `- ${vehicle.driverName}`}</p>
                                </div>
                                {vehicle.driverPhone && <span className="text-sm text-gray-400">{vehicle.driverPhone}</span>}
                                <button onClick={() => onRemoveVehicle(vehicle.id)} className="p-1.5 text-gray-400 hover:text-red-400">
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                </button>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}

// Technical Tab
function TechnicalTab({ technical, onSaveTechnical, callSheetId }) {
    const [localTech, setLocalTech] = useState(technical || {
        cameraPositions: [],
        radioChannels: [],
        commsSetup: '',
        powerRequirements: '',
        uplinkInfo: '',
        notes: '',
    });

    const handleSave = async () => {
        await onSaveTechnical(callSheetId, localTech);
    };

    // Auto-save on change (debounced effect would be better, but simple for now)
    useEffect(() => {
        if (technical) {
            setLocalTech(technical);
        }
    }, [technical]);

    return (
        <div className="space-y-6">
            <div className="bg-dark-card border border-dark-border rounded-xl p-6">
                <SectionHeader title="Camera Positions">
                    <button onClick={handleSave} className="px-3 py-1.5 bg-accent-primary text-white rounded-lg text-sm font-medium">Save</button>
                </SectionHeader>
                <FormTextarea
                    label="Camera Positions (one per line)"
                    value={Array.isArray(localTech.cameraPositions) ? localTech.cameraPositions.map(c => `${c.camera}: ${c.position} (${c.equipment})`).join('\n') : ''}
                    onChange={(v) => setLocalTech({...localTech, cameraPositions: v.split('\n').filter(Boolean).map((line, i) => ({camera: `Camera ${i+1}`, position: line, equipment: ''}))})}
                    rows={4}
                    placeholder="Camera 1: CENTRE (F800 + HJ22)&#10;Camera 2: LEFT WING (Sony PMW-500)"
                />
            </div>

            <div className="bg-dark-card border border-dark-border rounded-xl p-6">
                <SectionHeader title="Communications & Comms" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormTextarea
                        label="Comms Setup"
                        value={localTech.commsSetup || ''}
                        onChange={(v) => setLocalTech({...localTech, commsSetup: v})}
                        rows={3}
                        placeholder="Talkback system, radio channels..."
                    />
                    <FormTextarea
                        label="Radio Channels"
                        value={Array.isArray(localTech.radioChannels) ? localTech.radioChannels.join('\n') : ''}
                        onChange={(v) => setLocalTech({...localTech, radioChannels: v.split('\n').filter(Boolean)})}
                        rows={3}
                        placeholder="Ch 1: Production&#10;Ch 2: Camera&#10;Ch 3: Sound"
                    />
                </div>
            </div>

            <div className="bg-dark-card border border-dark-border rounded-xl p-6">
                <SectionHeader title="Power & Connectivity" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormTextarea
                        label="Power Requirements"
                        value={localTech.powerRequirements || ''}
                        onChange={(v) => setLocalTech({...localTech, powerRequirements: v})}
                        rows={3}
                        placeholder="Generator specs, power distribution..."
                    />
                    <FormTextarea
                        label="Uplink / Transmission"
                        value={localTech.uplinkInfo || ''}
                        onChange={(v) => setLocalTech({...localTech, uplinkInfo: v})}
                        rows={3}
                        placeholder="Satellite uplink, LiveU, fiber..."
                    />
                </div>
            </div>

            <div className="bg-dark-card border border-dark-border rounded-xl p-6">
                <SectionHeader title="Technical Notes" />
                <FormTextarea
                    label="Additional Technical Notes"
                    value={localTech.notes || ''}
                    onChange={(v) => setLocalTech({...localTech, notes: v})}
                    rows={5}
                    placeholder="Any other technical information..."
                />
            </div>
        </div>
    );
}

// Contacts Tab (Vendors & Emergency)
function ContactsTab({ vendors, emergencyContacts, onAddVendor, onRemoveVendor, onAddEmergencyContact, onRemoveEmergencyContact, callSheetId }) {
    const [showAddVendor, setShowAddVendor] = useState(false);
    const [showAddEmergency, setShowAddEmergency] = useState(false);
    const [newVendor, setNewVendor] = useState({ companyName: '', vendorType: '', contactName: '', contactPhone: '', contactEmail: '' });
    const [newEmergency, setNewEmergency] = useState({ contactType: 'hospital', name: '', phone: '', address: '', organization: '' });

    const handleAddVendor = async () => {
        if (!newVendor.companyName) return;
        await onAddVendor(callSheetId, newVendor);
        setNewVendor({ companyName: '', vendorType: '', contactName: '', contactPhone: '', contactEmail: '' });
        setShowAddVendor(false);
    };

    const handleAddEmergency = async () => {
        if (!newEmergency.name || !newEmergency.phone) return;
        await onAddEmergencyContact(callSheetId, newEmergency);
        setNewEmergency({ contactType: 'hospital', name: '', phone: '', address: '', organization: '' });
        setShowAddEmergency(false);
    };

    return (
        <div className="space-y-6">
            {/* Vendors */}
            <div className="bg-dark-card border border-dark-border rounded-xl overflow-hidden">
                <div className="px-6 py-4 border-b border-dark-border flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-white">Vendors & Suppliers</h3>
                    <button onClick={() => setShowAddVendor(!showAddVendor)} className="px-3 py-1.5 bg-accent-primary text-white rounded-lg text-sm font-medium hover:bg-accent-primary/90">
                        + Add Vendor
                    </button>
                </div>

                {showAddVendor && (
                    <div className="px-6 py-4 bg-dark-bg/50 border-b border-dark-border">
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                            <FormInput label="Company Name" value={newVendor.companyName} onChange={(v) => setNewVendor({...newVendor, companyName: v})} placeholder="Company" className="col-span-2" />
                            <FormSelect label="Type" value={newVendor.vendorType} onChange={(v) => setNewVendor({...newVendor, vendorType: v})} options={VENDOR_TYPES} placeholder="Select type" />
                            <FormInput label="Contact Name" value={newVendor.contactName} onChange={(v) => setNewVendor({...newVendor, contactName: v})} placeholder="John Smith" />
                            <FormInput label="Phone" value={newVendor.contactPhone} onChange={(v) => setNewVendor({...newVendor, contactPhone: v})} placeholder="+44 7700 900000" />
                            <FormInput label="Email" value={newVendor.contactEmail} onChange={(v) => setNewVendor({...newVendor, contactEmail: v})} placeholder="john@company.com" />
                        </div>
                        <div className="flex justify-end gap-2 mt-3">
                            <button onClick={() => setShowAddVendor(false)} className="px-3 py-1.5 text-gray-400 hover:text-white text-sm">Cancel</button>
                            <button onClick={handleAddVendor} className="px-4 py-1.5 bg-accent-primary text-white rounded-lg text-sm font-medium">Add</button>
                        </div>
                    </div>
                )}

                <div className="divide-y divide-dark-border">
                    {vendors.length === 0 ? (
                        <p className="px-6 py-8 text-center text-gray-500">No vendors added yet</p>
                    ) : (
                        vendors.map(vendor => (
                            <div key={vendor.id} className="px-6 py-3 flex items-center gap-4">
                                <span className="px-2 py-0.5 rounded text-xs font-medium bg-blue-500/20 text-blue-400">{vendor.vendorType || 'Vendor'}</span>
                                <div className="flex-1 min-w-0">
                                    <p className="font-medium text-white">{vendor.companyName}</p>
                                    <p className="text-sm text-gray-400">{vendor.contactName} {vendor.contactPhone && `- ${vendor.contactPhone}`}</p>
                                </div>
                                <button onClick={() => onRemoveVendor(vendor.id)} className="p-1.5 text-gray-400 hover:text-red-400">
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                </button>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Emergency Contacts */}
            <div className="bg-dark-card border border-dark-border rounded-xl overflow-hidden">
                <div className="px-6 py-4 border-b border-dark-border flex items-center justify-between bg-red-500/5">
                    <h3 className="text-lg font-semibold text-white">Emergency Contacts</h3>
                    <button onClick={() => setShowAddEmergency(!showAddEmergency)} className="px-3 py-1.5 bg-red-500 text-white rounded-lg text-sm font-medium hover:bg-red-600">
                        + Add Emergency
                    </button>
                </div>

                {showAddEmergency && (
                    <div className="px-6 py-4 bg-dark-bg/50 border-b border-dark-border">
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                            <FormSelect label="Type" value={newEmergency.contactType} onChange={(v) => setNewEmergency({...newEmergency, contactType: v})} options={EMERGENCY_CONTACT_TYPES} />
                            <FormInput label="Name" value={newEmergency.name} onChange={(v) => setNewEmergency({...newEmergency, name: v})} placeholder="Name / Title" />
                            <FormInput label="Organization" value={newEmergency.organization} onChange={(v) => setNewEmergency({...newEmergency, organization: v})} placeholder="Organization" />
                            <FormInput label="Phone" value={newEmergency.phone} onChange={(v) => setNewEmergency({...newEmergency, phone: v})} placeholder="+44 999" />
                            <FormInput label="Address" value={newEmergency.address} onChange={(v) => setNewEmergency({...newEmergency, address: v})} placeholder="Address" className="col-span-2" />
                        </div>
                        <div className="flex justify-end gap-2 mt-3">
                            <button onClick={() => setShowAddEmergency(false)} className="px-3 py-1.5 text-gray-400 hover:text-white text-sm">Cancel</button>
                            <button onClick={handleAddEmergency} className="px-4 py-1.5 bg-red-500 text-white rounded-lg text-sm font-medium">Add</button>
                        </div>
                    </div>
                )}

                <div className="divide-y divide-dark-border">
                    {emergencyContacts.length === 0 ? (
                        <p className="px-6 py-8 text-center text-gray-500">No emergency contacts added yet</p>
                    ) : (
                        emergencyContacts.map(contact => (
                            <div key={contact.id} className="px-6 py-3 flex items-center gap-4">
                                <span className="px-2 py-0.5 rounded text-xs font-medium bg-red-500/20 text-red-400">{contact.contactType}</span>
                                <div className="flex-1 min-w-0">
                                    <p className="font-medium text-white">{contact.name}</p>
                                    <p className="text-sm text-gray-400">{contact.organization} {contact.address && `- ${contact.address}`}</p>
                                </div>
                                <span className="text-sm font-medium text-white">{contact.phone}</span>
                                <button onClick={() => onRemoveEmergencyContact(contact.id)} className="p-1.5 text-gray-400 hover:text-red-400">
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                </button>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}

// Main Component
export default function CallSheetDetailPage({ callSheetId, onBack }) {
    const id = callSheetId;

    const {
        currentCallSheet: sheet,
        currentCrew: crew,
        currentCast: cast,
        // New enhanced state
        currentAccommodation: accommodation,
        currentRoomAssignments: roomAssignments,
        currentFlights: flights,
        currentTransfers: transfers,
        currentVehicles: vehicles,
        currentTechnical: technical,
        currentVendors: vendors,
        currentEmergencyContacts: emergencyContacts,
        // Methods
        loadCallSheet,
        updateCallSheet,
        publishCallSheet,
        deleteCallSheet,
        addCrewMember,
        updateCrewMember,
        removeCrewMember,
        addCastMember,
        updateCastMember,
        removeCastMember,
        clearCurrent,
        // New methods
        addAccommodation,
        removeAccommodation,
        addFlight,
        updateFlight,
        removeFlight,
        addTransfer,
        updateTransfer,
        removeTransfer,
        addVehicle,
        removeVehicle,
        saveTechnical,
        addVendor,
        removeVendor,
        addEmergencyContact,
        removeEmergencyContact,
    } = useCallSheetStore();

    const { settings } = useSettingsStore();

    const [activeTab, setActiveTab] = useState('overview');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [pendingChanges, setPendingChanges] = useState({});
    const [enabledSections, setEnabledSections] = useState(getDefaultSections());
    const [generatingPdf, setGeneratingPdf] = useState(false);

    // Load call sheet
    useEffect(() => {
        const load = async () => {
            setLoading(true);
            await loadCallSheet(id);
            setLoading(false);
        };
        load();
        return () => clearCurrent();
    }, [id, loadCallSheet, clearCurrent]);

    // Initialize enabled sections from sheet when loaded
    useEffect(() => {
        if (sheet?.enabledSections) {
            setEnabledSections(sheet.enabledSections);
        }
    }, [sheet?.enabledSections]);

    // Handle section toggle
    const handleToggleSection = (sectionId) => {
        const newSections = {
            ...enabledSections,
            [sectionId]: !enabledSections[sectionId]
        };
        setEnabledSections(newSections);
        handleUpdate({ enabledSections: newSections });
    };

    // Debounced save
    const saveChanges = useCallback(async (changes) => {
        if (Object.keys(changes).length === 0) return;
        setSaving(true);
        try {
            await updateCallSheet(id, changes);
            setPendingChanges({});
        } catch (e) {
            console.error('Failed to save:', e);
        } finally {
            setSaving(false);
        }
    }, [id, updateCallSheet]);

    // Auto-save after 1 second of no changes
    useEffect(() => {
        if (Object.keys(pendingChanges).length === 0) return;
        const timer = setTimeout(() => saveChanges(pendingChanges), 1000);
        return () => clearTimeout(timer);
    }, [pendingChanges, saveChanges]);

    const handleUpdate = (changes) => {
        setPendingChanges(prev => ({ ...prev, ...changes }));
    };

    const handlePublish = async () => {
        if (confirm('Publish this call sheet? Crew will be able to view it.')) {
            await publishCallSheet(id);
        }
    };

    const handleDelete = async () => {
        if (confirm('Delete this call sheet? This cannot be undone.')) {
            await deleteCallSheet(id);
            onBack();
        }
    };

    const handleExportPdf = async () => {
        setGeneratingPdf(true);
        try {
            const merged = { ...sheet, ...pendingChanges, enabledSections };
            const blob = await pdf(
                <CallSheetPDF
                    sheet={merged}
                    crew={crew}
                    cast={cast}
                    settings={settings}
                />
            ).toBlob();

            const filename = `call-sheet-day${merged.dayNumber || 1}-${merged.shootDate || 'draft'}.pdf`;
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        } catch (err) {
            console.error('Failed to generate PDF:', err);
            alert('Failed to generate PDF. Please try again.');
        } finally {
            setGeneratingPdf(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent-primary"></div>
            </div>
        );
    }

    if (!sheet) {
        return (
            <div className="p-6 text-center">
                <h2 className="text-xl font-bold text-white mb-2">Call Sheet Not Found</h2>
                <p className="text-gray-400 mb-4">This call sheet may have been deleted.</p>
                <button
                    onClick={onBack}
                    className="px-4 py-2 bg-accent-primary text-white rounded-lg"
                >
                    Back to Call Sheets
                </button>
            </div>
        );
    }

    const statusConfig = CALL_SHEET_STATUS_CONFIG[sheet.status] || CALL_SHEET_STATUS_CONFIG.draft;
    const merged = { ...sheet, ...pendingChanges };

    return (
        <div className="min-h-screen bg-dark-bg">
            {/* Header */}
            <div className="sticky top-0 z-20 bg-dark-bg border-b border-dark-border">
                <div className="max-w-7xl mx-auto px-4 lg:px-6 py-4">
                    <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-4 min-w-0">
                            <button
                                onClick={onBack}
                                className="p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                            >
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                </svg>
                            </button>
                            <div className="min-w-0">
                                <h1 className="text-xl font-bold text-white truncate">
                                    {merged.productionTitle || merged.projectName || 'Untitled Call Sheet'}
                                </h1>
                                <div className="flex items-center gap-2 text-sm text-gray-400">
                                    {merged.dayNumber && (
                                        <span>Day {merged.dayNumber}{merged.totalDays ? `/${merged.totalDays}` : ''}</span>
                                    )}
                                    {merged.shootDate && (
                                        <>
                                            <span>-</span>
                                            <span>{new Date(merged.shootDate).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}</span>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            {/* Saving indicator */}
                            {(saving || Object.keys(pendingChanges).length > 0) && (
                                <span className="text-sm text-gray-400">
                                    {saving ? 'Saving...' : 'Unsaved changes'}
                                </span>
                            )}

                            {/* Status Badge */}
                            <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusConfig.bgClass} ${statusConfig.textClass}`}>
                                {statusConfig.label}
                            </span>

                            {/* Actions */}
                            {/* PDF Export */}
                            <button
                                onClick={handleExportPdf}
                                disabled={generatingPdf}
                                className="px-4 py-2 bg-accent-primary/20 text-accent-primary rounded-lg font-medium hover:bg-accent-primary/30 transition-colors flex items-center gap-2 disabled:opacity-50"
                            >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                {generatingPdf ? 'Generating...' : 'Export PDF'}
                            </button>

                            {sheet.status === CALL_SHEET_STATUS.DRAFT && (
                                <button
                                    onClick={handlePublish}
                                    className="px-4 py-2 bg-green-500/20 text-green-400 rounded-lg font-medium hover:bg-green-500/30 transition-colors"
                                >
                                    Publish
                                </button>
                            )}
                            <button
                                onClick={handleDelete}
                                className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                                title="Delete call sheet"
                            >
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                            </button>
                        </div>
                    </div>

                    {/* Tabs */}
                    <div className="flex gap-1 mt-4 -mb-px overflow-x-auto">
                        {TABS.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-t-lg transition-colors whitespace-nowrap ${
                                    activeTab === tab.id
                                        ? 'bg-dark-card text-white border-t border-x border-dark-border'
                                        : 'text-gray-400 hover:text-white'
                                }`}
                            >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={tab.icon} />
                                </svg>
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-7xl mx-auto px-4 lg:px-6 py-6">
                {activeTab === 'overview' && (
                    <OverviewTab sheet={merged} onUpdate={handleUpdate} enabledSections={enabledSections} />
                )}
                {activeTab === 'crew' && (
                    <CrewTab
                        crew={crew}
                        onAddCrew={addCrewMember}
                        onUpdateCrew={updateCrewMember}
                        onRemoveCrew={removeCrewMember}
                        callSheetId={id}
                    />
                )}
                {activeTab === 'cast' && (
                    <CastTab
                        cast={cast}
                        onAddCast={addCastMember}
                        onUpdateCast={updateCastMember}
                        onRemoveCast={removeCastMember}
                        callSheetId={id}
                    />
                )}
                {activeTab === 'schedule' && (
                    <ScheduleTab sheet={merged} onUpdate={handleUpdate} />
                )}
                {activeTab === 'location' && (
                    <LocationTab sheet={merged} onUpdate={handleUpdate} />
                )}
                {activeTab === 'safety' && (
                    <SafetyTab sheet={merged} onUpdate={handleUpdate} />
                )}
                {activeTab === 'notes' && (
                    <NotesTab sheet={merged} onUpdate={handleUpdate} />
                )}
                {activeTab === 'travel' && (
                    <TravelTab
                        flights={flights}
                        transfers={transfers}
                        onAddFlight={addFlight}
                        onUpdateFlight={updateFlight}
                        onRemoveFlight={removeFlight}
                        onAddTransfer={addTransfer}
                        onUpdateTransfer={updateTransfer}
                        onRemoveTransfer={removeTransfer}
                        callSheetId={id}
                        crew={crew}
                    />
                )}
                {activeTab === 'logistics' && (
                    <LogisticsTab
                        accommodation={accommodation}
                        vehicles={vehicles}
                        roomAssignments={roomAssignments}
                        onAddAccommodation={addAccommodation}
                        onRemoveAccommodation={removeAccommodation}
                        onAddVehicle={addVehicle}
                        onRemoveVehicle={removeVehicle}
                        callSheetId={id}
                    />
                )}
                {activeTab === 'technical' && (
                    <TechnicalTab
                        technical={technical}
                        onSaveTechnical={saveTechnical}
                        callSheetId={id}
                    />
                )}
                {activeTab === 'contacts' && (
                    <ContactsTab
                        vendors={vendors}
                        emergencyContacts={emergencyContacts}
                        onAddVendor={addVendor}
                        onRemoveVendor={removeVendor}
                        onAddEmergencyContact={addEmergencyContact}
                        onRemoveEmergencyContact={removeEmergencyContact}
                        callSheetId={id}
                    />
                )}
                {activeTab === 'settings' && (
                    <SectionsSettingsTab
                        enabledSections={enabledSections}
                        onToggleSection={handleToggleSection}
                    />
                )}
            </div>
        </div>
    );
}
