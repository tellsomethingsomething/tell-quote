import { useContactStore, CONTACT_ROLES, getRoleInfo } from '../../store/contactStore';

export default function ContactCard({
    contact,
    onEdit,
    onDelete,
    onSelect,
    compact = false,
    showClient = false,
    clientName = ''
}) {
    const { getFullName, getInitials } = useContactStore();
    const roleInfo = getRoleInfo(contact.role);
    const fullName = getFullName(contact);
    const initials = getInitials(contact);

    if (compact) {
        return (
            <div
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-dark-card/50 cursor-pointer transition-colors group"
                onClick={() => onSelect?.(contact)}
            >
                {/* Avatar */}
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium ${roleInfo.color} bg-white/10`}>
                    {initials}
                </div>

                <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-200 truncate">{fullName}</p>
                    {contact.jobTitle && (
                        <p className="text-xs text-gray-500 truncate">{contact.jobTitle}</p>
                    )}
                </div>

                {contact.isPrimary && (
                    <span className="text-xs px-1.5 py-0.5 rounded bg-brand-teal/20 text-brand-teal">
                        Primary
                    </span>
                )}
            </div>
        );
    }

    return (
        <div className="card hover:border-white/10 transition-colors group">
            <div className="flex items-start gap-4">
                {/* Avatar */}
                <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-medium ${roleInfo.color} bg-white/10 flex-shrink-0`}>
                    {initials}
                </div>

                <div className="flex-1 min-w-0">
                    {/* Header */}
                    <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-base font-medium text-gray-200">{fullName}</h3>
                        {contact.isPrimary && (
                            <span className="text-xs px-1.5 py-0.5 rounded bg-brand-teal/20 text-brand-teal">
                                Primary
                            </span>
                        )}
                        {contact.role && (
                            <span className={`text-xs px-1.5 py-0.5 rounded ${roleInfo.color} bg-white/5`}>
                                {roleInfo.label}
                            </span>
                        )}
                    </div>

                    {/* Job info */}
                    {(contact.jobTitle || contact.department) && (
                        <p className="text-sm text-gray-400 mt-0.5">
                            {contact.jobTitle}
                            {contact.jobTitle && contact.department && ' - '}
                            {contact.department}
                        </p>
                    )}

                    {/* Client name if showing */}
                    {showClient && clientName && (
                        <p className="text-xs text-gray-500 mt-0.5">{clientName}</p>
                    )}

                    {/* Contact details */}
                    <div className="flex flex-wrap gap-3 mt-2 text-sm">
                        {contact.email && (
                            <a
                                href={`mailto:${contact.email}`}
                                className="flex items-center gap-1.5 text-gray-400 hover:text-brand-teal transition-colors"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                </svg>
                                <span className="truncate max-w-[180px]">{contact.email}</span>
                            </a>
                        )}
                        {contact.phone && (
                            <a
                                href={`tel:${contact.phone}`}
                                className="flex items-center gap-1.5 text-gray-400 hover:text-brand-teal transition-colors"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                </svg>
                                <span>{contact.phone}</span>
                            </a>
                        )}
                        {contact.mobile && contact.mobile !== contact.phone && (
                            <a
                                href={`tel:${contact.mobile}`}
                                className="flex items-center gap-1.5 text-gray-400 hover:text-brand-teal transition-colors"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                </svg>
                                <span>{contact.mobile}</span>
                            </a>
                        )}
                        {contact.linkedinUrl && (
                            <a
                                href={contact.linkedinUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1.5 text-gray-400 hover:text-blue-400 transition-colors"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                                </svg>
                                <span>LinkedIn</span>
                            </a>
                        )}
                    </div>

                    {/* Tags */}
                    {contact.tags && contact.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                            {contact.tags.map((tag, i) => (
                                <span key={i} className="text-xs px-1.5 py-0.5 rounded bg-dark-border text-gray-400">
                                    {tag}
                                </span>
                            ))}
                        </div>
                    )}

                    {/* Last contacted */}
                    {contact.lastContactedAt && (
                        <p className="text-xs text-gray-600 mt-2">
                            Last contacted: {new Date(contact.lastContactedAt).toLocaleDateString()}
                        </p>
                    )}
                </div>

                {/* Actions */}
                <div className="flex items-start gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {onEdit && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onEdit(contact);
                            }}
                            className="p-1.5 text-gray-500 hover:text-gray-300 hover:bg-white/5 rounded transition-colors"
                            title="Edit"
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                            </svg>
                        </button>
                    )}
                    {onDelete && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                if (window.confirm(`Delete ${fullName}?`)) {
                                    onDelete(contact.id);
                                }
                            }}
                            className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-red-400/10 rounded transition-colors"
                            title="Delete"
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                        </button>
                    )}
                </div>
            </div>

            {/* Notes preview */}
            {contact.notes && (
                <div className="mt-3 pt-3 border-t border-dark-border">
                    <p className="text-xs text-gray-500 line-clamp-2">{contact.notes}</p>
                </div>
            )}
        </div>
    );
}
