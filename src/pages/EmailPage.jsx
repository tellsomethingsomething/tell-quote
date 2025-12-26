import React, { useEffect, useState } from 'react';
import {
    Mail, Inbox, Send, Star, Archive, Trash2, AlertCircle,
    Search, RefreshCw, Plus, Filter, MoreVertical, Paperclip,
    ChevronLeft, ChevronDown, Reply, ReplyAll, Forward, ExternalLink, Link2,
    Check, X, Clock, User, Building2, FolderOpen, Tag, Settings
} from 'lucide-react';
import { useEmailStore, formatEmailDate, parseEmailAddress, THREAD_STATUS, EMAIL_PROVIDERS } from '../store/emailStore';
import { useClientStore } from '../store/clientStore';
import { useContactStore } from '../store/contactStore';
import { sanitizeEmailHtml } from '../utils/sanitize';

// Folder configuration
const FOLDERS = [
    { id: 'INBOX', label: 'Inbox', icon: Inbox },
    { id: 'SENT', label: 'Sent', icon: Send },
    { id: 'STARRED', label: 'Starred', icon: Star },
    { id: 'ARCHIVED', label: 'Archived', icon: Archive },
    { id: 'TRASH', label: 'Trash', icon: Trash2 },
];

export default function EmailPage() {
    const {
        connections, activeConnection, activeProvider, isConnecting, connectionError,
        threads, selectedThread, messages, isLoading, isSyncing, syncProgress,
        currentFolder, searchQuery, filters, error,
        isComposing, composeDraft,
        initialize, connectGoogle, connectMicrosoft, disconnectAccount,
        setActiveConnection, loadThreads, selectThread, syncEmails,
        setFolder, setSearchQuery, setFilters, loadMore,
        markThreadAsRead, starThread, archiveThread, trashThread,
        openCompose, closeCompose, updateDraft, sendEmail,
        linkThreadToEntity,
    } = useEmailStore();

    const [showAccountMenu, setShowAccountMenu] = useState(false);

    const { clients } = useClientStore();
    const { contacts } = useContactStore();

    const [showLinkModal, setShowLinkModal] = useState(false);
    const [linkingThread, setLinkingThread] = useState(null);

    useEffect(() => {
        initialize();

        // Check for Microsoft OAuth callback
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('microsoft_connected') === 'true') {
            // Clear the URL params
            window.history.replaceState({}, '', window.location.pathname);
            // Reload connections
            initialize();
        }
        if (urlParams.get('error') === 'microsoft_oauth_failed') {
            const errorDesc = urlParams.get('error_description') || 'Failed to connect Microsoft account';
            console.error('Microsoft OAuth error:', errorDesc);
            // Clear the URL params
            window.history.replaceState({}, '', window.location.pathname);
        }
    }, []);

    // No connection state - direct to Settings
    if (!activeConnection && !isConnecting) {
        return (
            <div className="h-full flex items-center justify-center">
                <div className="text-center max-w-md">
                    <div className="w-16 h-16 bg-dark-card rounded-full flex items-center justify-center mx-auto mb-4">
                        <Mail className="w-8 h-8 text-gray-400" />
                    </div>
                    <h2 className="text-xl font-semibold text-white mb-2">Connect Your Email</h2>
                    <p className="text-gray-400 mb-6">
                        Connect your email account in Settings to sync emails and link them to your clients and contacts.
                    </p>
                    <p className="text-sm text-gray-500">
                        Go to <span className="text-brand-primary font-medium">Settings → Integrations</span> to connect your Gmail or Outlook account.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="h-full flex">
            {/* Sidebar - Folders */}
            <div className="w-56 border-r border-dark-border flex flex-col">
                {/* Compose Button */}
                <div className="p-3">
                    <button
                        onClick={() => openCompose()}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-brand-primary text-white rounded-lg hover:bg-brand-primary/90 transition-colors"
                    >
                        <Plus className="w-4 h-4" />
                        Compose
                    </button>
                </div>

                {/* Folders */}
                <div className="flex-1 overflow-y-auto px-2">
                    {FOLDERS.map(folder => {
                        const Icon = folder.icon;
                        const isActive = currentFolder === folder.id;
                        const unreadCount = folder.id === 'INBOX'
                            ? threads.filter(t => t.unread_count > 0).length
                            : 0;

                        return (
                            <button
                                key={folder.id}
                                onClick={() => setFolder(folder.id)}
                                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm mb-1 transition-colors ${
                                    isActive
                                        ? 'bg-brand-primary/10 text-brand-primary'
                                        : 'text-gray-400 hover:bg-dark-card hover:text-white'
                                }`}
                            >
                                <Icon className="w-4 h-4" />
                                <span className="flex-1 text-left">{folder.label}</span>
                                {unreadCount > 0 && (
                                    <span className="text-xs bg-brand-primary/20 text-brand-primary px-1.5 py-0.5 rounded">
                                        {unreadCount}
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </div>

                {/* Connection Info */}
                <div className="p-3 border-t border-dark-border relative">
                    <button
                        onClick={() => setShowAccountMenu(!showAccountMenu)}
                        className="w-full flex items-center gap-2 text-left hover:bg-dark-card p-2 rounded-lg -m-2 transition-colors"
                    >
                        {/* Provider Icon */}
                        {activeProvider === 'microsoft' ? (
                            <div className="w-6 h-6 rounded flex items-center justify-center bg-[#0078D4]/20">
                                <svg className="w-4 h-4" viewBox="0 0 21 21">
                                    <rect x="1" y="1" width="9" height="9" fill="#f25022"/>
                                    <rect x="1" y="11" width="9" height="9" fill="#00a4ef"/>
                                    <rect x="11" y="1" width="9" height="9" fill="#7fba00"/>
                                    <rect x="11" y="11" width="9" height="9" fill="#ffb900"/>
                                </svg>
                            </div>
                        ) : (
                            <div className="w-6 h-6 rounded flex items-center justify-center bg-red-500/20">
                                <svg className="w-4 h-4" viewBox="0 0 24 24">
                                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                                </svg>
                            </div>
                        )}
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1">
                                <div className="w-2 h-2 rounded-full bg-green-500" />
                                <span className="text-xs text-gray-400 truncate">
                                    {activeConnection?.email}
                                </span>
                            </div>
                            {activeConnection?.last_sync_at && (
                                <p className="text-xs text-gray-600">
                                    Synced {formatEmailDate(activeConnection.last_sync_at)}
                                </p>
                            )}
                        </div>
                        <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${showAccountMenu ? 'rotate-180' : ''}`} />
                    </button>

                    {/* Account Menu Dropdown */}
                    {showAccountMenu && (
                        <div className="absolute bottom-full left-0 right-0 mb-1 bg-dark-card border border-dark-border rounded-lg shadow-xl overflow-hidden z-50">
                            {/* Connected Accounts */}
                            {connections.filter(c => c.status === 'active').map(conn => (
                                <button
                                    key={conn.id}
                                    onClick={() => {
                                        setActiveConnection(conn.id);
                                        setShowAccountMenu(false);
                                    }}
                                    className={`w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-dark-border/50 transition-colors ${
                                        activeConnection?.id === conn.id ? 'bg-brand-primary/10' : ''
                                    }`}
                                >
                                    {conn.provider === 'microsoft' ? (
                                        <svg className="w-4 h-4" viewBox="0 0 21 21">
                                            <rect x="1" y="1" width="9" height="9" fill="#f25022"/>
                                            <rect x="1" y="11" width="9" height="9" fill="#00a4ef"/>
                                            <rect x="11" y="1" width="9" height="9" fill="#7fba00"/>
                                            <rect x="11" y="11" width="9" height="9" fill="#ffb900"/>
                                        </svg>
                                    ) : (
                                        <svg className="w-4 h-4" viewBox="0 0 24 24">
                                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                                        </svg>
                                    )}
                                    <span className="text-sm text-gray-300 truncate flex-1">{conn.email}</span>
                                    {activeConnection?.id === conn.id && (
                                        <Check className="w-4 h-4 text-brand-primary" />
                                    )}
                                </button>
                            ))}

                            {/* Divider */}
                            <div className="border-t border-dark-border" />

                            {/* Add Account Options */}
                            <button
                                onClick={() => {
                                    connectGoogle();
                                    setShowAccountMenu(false);
                                }}
                                className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-dark-border/50 transition-colors text-gray-400 hover:text-white"
                            >
                                <Plus className="w-4 h-4" />
                                <span className="text-sm">Add Gmail account</span>
                            </button>
                            <button
                                onClick={() => {
                                    connectMicrosoft();
                                    setShowAccountMenu(false);
                                }}
                                className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-dark-border/50 transition-colors text-gray-400 hover:text-white"
                            >
                                <Plus className="w-4 h-4" />
                                <span className="text-sm">Add Outlook account</span>
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Thread List */}
            <div className="w-96 border-r border-dark-border flex flex-col">
                {/* Search & Actions */}
                <div className="p-3 border-b border-dark-border">
                    <div className="flex items-center gap-2">
                        <div className="flex-1 relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                            <input
                                type="text"
                                placeholder="Search emails..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-9 pr-3 py-2 bg-dark-card border border-dark-border rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-brand-primary"
                            />
                        </div>
                        <button
                            onClick={syncEmails}
                            disabled={isSyncing}
                            className={`p-2 rounded-lg hover:bg-dark-card transition-colors ${
                                isSyncing ? 'animate-spin text-brand-primary' : 'text-gray-400'
                            }`}
                            title="Sync emails"
                        >
                            <RefreshCw className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => setFilters({ unreadOnly: !filters.unreadOnly })}
                            className={`p-2 rounded-lg hover:bg-dark-card transition-colors ${
                                filters.unreadOnly ? 'text-brand-primary bg-brand-primary/10' : 'text-gray-400'
                            }`}
                            title="Show unread only"
                        >
                            <Filter className="w-4 h-4" />
                        </button>
                    </div>

                    {/* Sync Progress */}
                    {isSyncing && syncProgress && (
                        <div className="mt-2 text-xs text-gray-400">
                            {syncProgress.status === 'starting' && 'Starting sync...'}
                            {syncProgress.status === 'syncing' && `Syncing... ${syncProgress.progress || 0}%`}
                            {syncProgress.status === 'completed' && `Synced ${syncProgress.messagesAdded || 0} new emails`}
                        </div>
                    )}
                </div>

                {/* Thread List */}
                <div className="flex-1 overflow-y-auto">
                    {isLoading && threads.length === 0 ? (
                        <div className="flex items-center justify-center h-32">
                            <RefreshCw className="w-5 h-5 text-gray-400 animate-spin" />
                        </div>
                    ) : threads.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                            <Mail className="w-8 h-8 mx-auto mb-2 opacity-50" />
                            <p>No emails found</p>
                        </div>
                    ) : (
                        threads.map(thread => (
                            <ThreadRow
                                key={thread.id}
                                thread={thread}
                                isSelected={selectedThread?.id === thread.id}
                                onClick={() => selectThread(thread.id)}
                                onStar={() => starThread(thread.id, !thread.is_starred)}
                            />
                        ))
                    )}
                </div>
            </div>

            {/* Message View */}
            <div className="flex-1 flex flex-col bg-dark-bg">
                {selectedThread ? (
                    <ThreadView
                        thread={selectedThread}
                        messages={messages}
                        onArchive={() => archiveThread(selectedThread.id)}
                        onTrash={() => trashThread(selectedThread.id)}
                        onStar={() => starThread(selectedThread.id, !selectedThread.is_starred)}
                        onReply={() => openCompose({ replyTo: messages[messages.length - 1] })}
                        onLink={() => {
                            setLinkingThread(selectedThread);
                            setShowLinkModal(true);
                        }}
                        onClose={() => selectThread(null)}
                    />
                ) : (
                    <div className="flex-1 flex items-center justify-center text-gray-500">
                        <div className="text-center">
                            <Mail className="w-12 h-12 mx-auto mb-3 opacity-30" />
                            <p>Select an email to read</p>
                        </div>
                    </div>
                )}
            </div>

            {/* Compose Modal */}
            {isComposing && (
                <ComposeModal
                    draft={composeDraft}
                    onUpdate={updateDraft}
                    onSend={sendEmail}
                    onClose={closeCompose}
                />
            )}

            {/* Link Modal */}
            {showLinkModal && linkingThread && (
                <LinkModal
                    thread={linkingThread}
                    clients={clients}
                    contacts={contacts}
                    onLink={(entityType, entityId) => {
                        linkThreadToEntity(linkingThread.id, entityType, entityId);
                        setShowLinkModal(false);
                        setLinkingThread(null);
                    }}
                    onClose={() => {
                        setShowLinkModal(false);
                        setLinkingThread(null);
                    }}
                />
            )}
        </div>
    );
}

// Thread Row Component
function ThreadRow({ thread, isSelected, onClick, onStar }) {
    const sender = thread.participants?.[0] || {};
    const hasUnread = thread.unread_count > 0;

    return (
        <div
            onClick={onClick}
            className={`px-3 py-3 border-b border-dark-border cursor-pointer transition-colors ${
                isSelected
                    ? 'bg-brand-primary/10 border-l-2 border-l-brand-primary'
                    : 'hover:bg-dark-card'
            }`}
        >
            <div className="flex items-start gap-3">
                {/* Star */}
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onStar();
                    }}
                    className={`mt-0.5 ${
                        thread.is_starred ? 'text-yellow-400' : 'text-gray-600 hover:text-gray-400'
                    }`}
                >
                    <Star className="w-4 h-4" fill={thread.is_starred ? 'currentColor' : 'none'} />
                </button>

                {/* Content */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                        <span className={`text-sm truncate ${hasUnread ? 'font-semibold text-white' : 'text-gray-300'}`}>
                            {sender.name || sender.email || 'Unknown'}
                        </span>
                        {thread.attachment_count > 0 && (
                            <Paperclip className="w-3 h-3 text-gray-500 flex-shrink-0" />
                        )}
                        <span className="text-xs text-gray-500 ml-auto flex-shrink-0">
                            {formatEmailDate(thread.last_message_at)}
                        </span>
                    </div>
                    <p className={`text-sm truncate ${hasUnread ? 'text-white' : 'text-gray-400'}`}>
                        {thread.subject || '(no subject)'}
                    </p>
                    <p className="text-xs text-gray-500 truncate mt-0.5">
                        {thread.snippet}
                    </p>

                    {/* Linked entities */}
                    {(thread.client_id || thread.contact_id || thread.project_id) && (
                        <div className="flex items-center gap-2 mt-2">
                            {thread.client_id && (
                                <span className="inline-flex items-center gap-1 text-xs bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded">
                                    <Building2 className="w-3 h-3" />
                                    Client
                                </span>
                            )}
                            {thread.contact_id && (
                                <span className="inline-flex items-center gap-1 text-xs bg-green-500/10 text-green-400 px-2 py-0.5 rounded">
                                    <User className="w-3 h-3" />
                                    Contact
                                </span>
                            )}
                            {thread.project_id && (
                                <span className="inline-flex items-center gap-1 text-xs bg-purple-500/10 text-purple-400 px-2 py-0.5 rounded">
                                    <FolderOpen className="w-3 h-3" />
                                    Project
                                </span>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

// Thread View Component
function ThreadView({ thread, messages, onArchive, onTrash, onStar, onReply, onLink, onClose }) {
    return (
        <>
            {/* Header */}
            <div className="px-4 py-3 border-b border-dark-border flex items-center gap-3">
                <button
                    onClick={onClose}
                    className="p-1 rounded hover:bg-dark-card text-gray-400"
                >
                    <ChevronLeft className="w-5 h-5" />
                </button>

                <h2 className="flex-1 text-lg font-medium text-white truncate">
                    {thread.subject || '(no subject)'}
                </h2>

                <div className="flex items-center gap-1">
                    <button
                        onClick={onLink}
                        className="p-2 rounded-lg hover:bg-dark-card text-gray-400 hover:text-white"
                        title="Link to client/contact"
                    >
                        <Link2 className="w-4 h-4" />
                    </button>
                    <button
                        onClick={onStar}
                        className={`p-2 rounded-lg hover:bg-dark-card ${
                            thread.is_starred ? 'text-yellow-400' : 'text-gray-400 hover:text-white'
                        }`}
                        title={thread.is_starred ? 'Unstar' : 'Star'}
                    >
                        <Star className="w-4 h-4" fill={thread.is_starred ? 'currentColor' : 'none'} />
                    </button>
                    <button
                        onClick={onArchive}
                        className="p-2 rounded-lg hover:bg-dark-card text-gray-400 hover:text-white"
                        title="Archive"
                    >
                        <Archive className="w-4 h-4" />
                    </button>
                    <button
                        onClick={onTrash}
                        className="p-2 rounded-lg hover:bg-dark-card text-gray-400 hover:text-red-400"
                        title="Delete"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((message, index) => (
                    <MessageCard key={message.id} message={message} isLast={index === messages.length - 1} />
                ))}
            </div>

            {/* Reply Bar */}
            <div className="p-4 border-t border-dark-border">
                <button
                    onClick={onReply}
                    className="flex items-center gap-2 px-4 py-2 bg-dark-card border border-dark-border rounded-lg text-gray-300 hover:text-white hover:border-gray-600 transition-colors"
                >
                    <Reply className="w-4 h-4" />
                    Reply
                </button>
            </div>
        </>
    );
}

// Message Card Component
function MessageCard({ message, isLast }) {
    const [expanded, setExpanded] = useState(isLast);
    const sender = parseEmailAddress(message.from_email);

    return (
        <div className="bg-dark-card rounded-lg border border-dark-border overflow-hidden">
            {/* Header */}
            <div
                onClick={() => setExpanded(!expanded)}
                className="px-4 py-3 flex items-center gap-3 cursor-pointer hover:bg-dark-border/30"
            >
                <div className="w-10 h-10 rounded-full bg-brand-primary/20 flex items-center justify-center text-brand-primary font-medium">
                    {sender.name?.charAt(0) || sender.email?.charAt(0) || '?'}
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                        <span className="font-medium text-white">{sender.name}</span>
                        <span className="text-xs text-gray-500">&lt;{sender.email}&gt;</span>
                    </div>
                    <p className="text-xs text-gray-500">
                        to {message.to_emails?.map(t => t.name || t.email).join(', ') || 'unknown'}
                    </p>
                </div>
                <span className="text-xs text-gray-500">
                    {formatEmailDate(message.sent_at)}
                </span>
            </div>

            {/* Body */}
            {expanded && (
                <div className="px-4 pb-4">
                    {/* Attachments */}
                    {message.email_attachments?.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-3 pt-2 border-t border-dark-border">
                            {message.email_attachments.map(att => (
                                <div
                                    key={att.id}
                                    className="flex items-center gap-2 px-3 py-1.5 bg-dark-bg rounded text-sm text-gray-300"
                                >
                                    <Paperclip className="w-3 h-3" />
                                    <span className="truncate max-w-[150px]">{att.filename}</span>
                                    <span className="text-xs text-gray-500">
                                        {(att.size_bytes / 1024).toFixed(0)}KB
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Email Body */}
                    {message.body_html ? (
                        <div
                            className="prose prose-invert prose-sm max-w-none"
                            dangerouslySetInnerHTML={{ __html: sanitizeEmailHtml(message.body_html) }}
                        />
                    ) : (
                        <pre className="text-sm text-gray-300 whitespace-pre-wrap font-sans">
                            {message.body_text}
                        </pre>
                    )}
                </div>
            )}
        </div>
    );
}

// Compose Modal Component
function ComposeModal({ draft, onUpdate, onSend, onClose }) {
    const [sending, setSending] = useState(false);
    const [toInput, setToInput] = useState('');

    const handleSend = async () => {
        setSending(true);
        const result = await onSend();
        setSending(false);
        if (!result.success) {
            alert(result.error || 'Failed to send email');
        }
    };

    const addRecipient = (field) => {
        if (toInput.trim()) {
            onUpdate({ [field]: [...draft[field], { email: toInput.trim() }] });
            setToInput('');
        }
    };

    const removeRecipient = (field, index) => {
        onUpdate({ [field]: draft[field].filter((_, i) => i !== index) });
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-dark-card border border-dark-border rounded-lg w-full max-w-2xl max-h-[80vh] flex flex-col shadow-xl">
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-dark-border">
                    <h3 className="font-medium text-white">New Message</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-white">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Form */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {/* To */}
                    <div className="flex items-start gap-2">
                        <label className="w-16 text-sm text-gray-400 pt-2">To:</label>
                        <div className="flex-1">
                            <div className="flex flex-wrap gap-1 mb-1">
                                {draft.to.map((r, i) => (
                                    <span key={i} className="inline-flex items-center gap-1 px-2 py-1 bg-dark-bg rounded text-sm">
                                        {r.email}
                                        <button onClick={() => removeRecipient('to', i)} className="text-gray-500 hover:text-white">
                                            <X className="w-3 h-3" />
                                        </button>
                                    </span>
                                ))}
                            </div>
                            <input
                                type="email"
                                value={toInput}
                                onChange={(e) => setToInput(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addRecipient('to'))}
                                onBlur={() => addRecipient('to')}
                                placeholder="Add recipient..."
                                className="w-full px-3 py-2 bg-dark-bg border border-dark-border rounded text-white text-sm focus:outline-none focus:border-brand-primary"
                            />
                        </div>
                    </div>

                    {/* Subject */}
                    <div className="flex items-center gap-2">
                        <label className="w-16 text-sm text-gray-400">Subject:</label>
                        <input
                            type="text"
                            value={draft.subject}
                            onChange={(e) => onUpdate({ subject: e.target.value })}
                            placeholder="Subject"
                            className="flex-1 px-3 py-2 bg-dark-bg border border-dark-border rounded text-white text-sm focus:outline-none focus:border-brand-primary"
                        />
                    </div>

                    {/* Body */}
                    <textarea
                        value={draft.body}
                        onChange={(e) => onUpdate({ body: e.target.value })}
                        placeholder="Write your message..."
                        rows={12}
                        className="w-full px-3 py-2 bg-dark-bg border border-dark-border rounded text-white text-sm focus:outline-none focus:border-brand-primary resize-none"
                    />
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between px-4 py-3 border-t border-dark-border">
                    <div className="flex items-center gap-2">
                        <button className="p-2 text-gray-400 hover:text-white hover:bg-dark-bg rounded">
                            <Paperclip className="w-4 h-4" />
                        </button>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 text-gray-400 hover:text-white"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSend}
                            disabled={sending || draft.to.length === 0}
                            className="flex items-center gap-2 px-4 py-2 bg-brand-primary text-white rounded-lg hover:bg-brand-primary/90 disabled:opacity-50"
                        >
                            {sending ? (
                                <>
                                    <RefreshCw className="w-4 h-4 animate-spin" />
                                    Sending...
                                </>
                            ) : (
                                <>
                                    <Send className="w-4 h-4" />
                                    Send
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

// Link Modal Component
function LinkModal({ thread, clients, contacts, onLink, onClose }) {
    const [tab, setTab] = useState('clients');
    const [search, setSearch] = useState('');

    const filteredClients = clients.filter(c =>
        c.company?.toLowerCase().includes(search.toLowerCase()) ||
        c.contact?.toLowerCase().includes(search.toLowerCase())
    );

    const filteredContacts = contacts.filter(c =>
        c.name?.toLowerCase().includes(search.toLowerCase()) ||
        c.email?.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-dark-card border border-dark-border rounded-lg w-full max-w-md shadow-xl">
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-dark-border">
                    <h3 className="font-medium text-white">Link Email Thread</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-white">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-dark-border">
                    <button
                        onClick={() => setTab('clients')}
                        className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
                            tab === 'clients'
                                ? 'text-brand-primary border-b-2 border-brand-primary'
                                : 'text-gray-400 hover:text-white'
                        }`}
                    >
                        <Building2 className="w-4 h-4 inline mr-2" />
                        Clients
                    </button>
                    <button
                        onClick={() => setTab('contacts')}
                        className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
                            tab === 'contacts'
                                ? 'text-brand-primary border-b-2 border-brand-primary'
                                : 'text-gray-400 hover:text-white'
                        }`}
                    >
                        <User className="w-4 h-4 inline mr-2" />
                        Contacts
                    </button>
                </div>

                {/* Search */}
                <div className="p-3 border-b border-dark-border">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                        <input
                            type="text"
                            placeholder="Search..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-9 pr-3 py-2 bg-dark-bg border border-dark-border rounded text-sm text-white placeholder-gray-500 focus:outline-none focus:border-brand-primary"
                        />
                    </div>
                </div>

                {/* List */}
                <div className="max-h-64 overflow-y-auto">
                    {tab === 'clients' ? (
                        filteredClients.length === 0 ? (
                            <p className="text-center py-4 text-gray-500">No clients found</p>
                        ) : (
                            filteredClients.map(client => (
                                <button
                                    key={client.id}
                                    onClick={() => onLink('client', client.id)}
                                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-dark-bg text-left border-b border-dark-border"
                                >
                                    <div className="w-8 h-8 rounded bg-blue-500/20 flex items-center justify-center text-blue-400">
                                        <Building2 className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-white">{client.company}</p>
                                        <p className="text-xs text-gray-500">{client.contact}</p>
                                    </div>
                                </button>
                            ))
                        )
                    ) : (
                        filteredContacts.length === 0 ? (
                            <p className="text-center py-4 text-gray-500">No contacts found</p>
                        ) : (
                            filteredContacts.map(contact => (
                                <button
                                    key={contact.id}
                                    onClick={() => onLink('contact', contact.id)}
                                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-dark-bg text-left border-b border-dark-border"
                                >
                                    <div className="w-8 h-8 rounded bg-green-500/20 flex items-center justify-center text-green-400">
                                        <User className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-white">{contact.name}</p>
                                        <p className="text-xs text-gray-500">{contact.email}</p>
                                    </div>
                                </button>
                            ))
                        )
                    )}
                </div>
            </div>
        </div>
    );
}
