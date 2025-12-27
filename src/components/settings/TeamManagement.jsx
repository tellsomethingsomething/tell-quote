import React, { useState } from 'react';
import {
    Users, UserPlus, Mail, Crown, Shield, Eye, Trash2, MoreVertical,
    Copy, Check, Clock, Send, X, AlertCircle, Loader2
} from 'lucide-react';
import { useOrganizationStore, ORG_ROLES } from '../../store/organizationStore';

// Tab permissions available
const TAB_PERMISSIONS = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'quotes', label: 'Quotes' },
    { id: 'clients', label: 'Clients' },
    { id: 'opportunities', label: 'Opportunities' },
    { id: 'tasks', label: 'Tasks' },
    { id: 'calendar', label: 'Calendar' },
    { id: 'rate-card', label: 'Rate Card' },
    { id: 'invoices', label: 'Invoices' },
    { id: 'projects', label: 'Projects' },
    { id: 'crew', label: 'Crew' },
    { id: 'kit', label: 'Equipment' },
];

export default function TeamManagement() {
    const {
        organization,
        members,
        invitations,
        membersLoading,
        invitationsLoading,
        createInvitation,
        cancelInvitation,
        resendInvitation,
        updateMemberRole,
        removeMember,
        canManageMembers,
        isOwner,
        hasFeatureAccess,
        getSubscriptionLimits,
        error,
        clearError,
    } = useOrganizationStore();

    const [showInviteModal, setShowInviteModal] = useState(false);
    const [inviteEmail, setInviteEmail] = useState('');
    const [inviteRole, setInviteRole] = useState('member');
    const [invitePermissions, setInvitePermissions] = useState([]);
    const [isInviting, setIsInviting] = useState(false);
    const [inviteSuccess, setInviteSuccess] = useState(null);
    const [copiedToken, setCopiedToken] = useState(null);
    const [memberMenu, setMemberMenu] = useState(null);

    const limits = getSubscriptionLimits();
    const canAddUser = hasFeatureAccess('add_user');

    const handleInvite = async () => {
        if (!inviteEmail.trim()) return;

        setIsInviting(true);
        const result = await createInvitation(inviteEmail.trim(), inviteRole, invitePermissions);
        setIsInviting(false);

        if (result) {
            setInviteSuccess(result);
            setInviteEmail('');
            setInviteRole('member');
            setInvitePermissions([]);
        }
    };

    const copyInviteLink = (token) => {
        const link = `${window.location.origin}/invite/${token}`;
        navigator.clipboard.writeText(link);
        setCopiedToken(token);
        setTimeout(() => setCopiedToken(null), 2000);
    };

    const togglePermission = (permId) => {
        setInvitePermissions(prev =>
            prev.includes(permId)
                ? prev.filter(p => p !== permId)
                : [...prev, permId]
        );
    };

    const getRoleIcon = (role) => {
        switch (role) {
            case 'owner': return <Crown className="w-4 h-4 text-yellow-500" />;
            case 'admin': return <Shield className="w-4 h-4 text-blue-500" />;
            case 'viewer': return <Eye className="w-4 h-4 text-gray-500" />;
            default: return <Users className="w-4 h-4 text-gray-400" />;
        }
    };

    if (!organization) {
        return (
            <div className="text-center py-12 text-gray-500">
                No organization loaded
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* Error Display */}
            {error && (
                <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400">
                    <AlertCircle className="w-4 h-4" />
                    <span>{error}</span>
                    <button onClick={clearError} className="ml-auto">
                        <X className="w-4 h-4" />
                    </button>
                </div>
            )}

            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-medium text-white">Team Members</h3>
                    <p className="text-sm text-gray-500">
                        {members.length} of {limits.users === -1 ? 'unlimited' : limits.users} seats used
                    </p>
                </div>

                {canManageMembers() && (
                    <button
                        onClick={() => setShowInviteModal(true)}
                        disabled={!canAddUser}
                        className="btn-primary flex items-center gap-2 disabled:opacity-50"
                    >
                        <UserPlus className="w-4 h-4" />
                        Invite Member
                    </button>
                )}
            </div>

            {/* Upgrade Notice */}
            {!canAddUser && (
                <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                    <p className="text-amber-400 text-sm">
                        You've reached the member limit for your plan.
                        <button className="ml-2 underline hover:no-underline">
                            Upgrade to add more members
                        </button>
                    </p>
                </div>
            )}

            {/* Members List */}
            <div className="bg-dark-card border border-dark-border rounded-lg overflow-hidden">
                {membersLoading ? (
                    <div className="flex items-center justify-center py-12">
                        <Loader2 className="w-6 h-6 animate-spin text-gray-500" />
                    </div>
                ) : members.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                        No team members yet
                    </div>
                ) : (
                    <table className="w-full">
                        <thead className="bg-dark-bg">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Member</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Joined</th>
                                <th className="px-4 py-3"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-dark-border">
                            {members.map(member => (
                                <tr key={member.id} className="hover:bg-dark-bg/50">
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-brand-primary/20 flex items-center justify-center text-brand-primary font-medium">
                                                {member.name?.charAt(0)?.toUpperCase() || '?'}
                                            </div>
                                            <div>
                                                <div className="text-sm text-white">{member.name}</div>
                                                <div className="text-xs text-gray-500">{member.email}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-2">
                                            {getRoleIcon(member.role)}
                                            <span className="text-sm text-gray-300 capitalize">{member.role}</span>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className={`px-2 py-1 text-xs rounded-full ${
                                            member.status === 'active'
                                                ? 'bg-green-500/10 text-green-400'
                                                : member.status === 'pending'
                                                    ? 'bg-amber-500/10 text-amber-400'
                                                    : 'bg-gray-500/10 text-gray-400'
                                        }`}>
                                            {member.status}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-sm text-gray-500">
                                        {new Date(member.createdAt).toLocaleDateString()}
                                    </td>
                                    <td className="px-4 py-3">
                                        {canManageMembers() && member.role !== 'owner' && (
                                            <div className="relative">
                                                <button
                                                    onClick={() => setMemberMenu(memberMenu === member.id ? null : member.id)}
                                                    className="p-1 hover:bg-dark-border rounded"
                                                >
                                                    <MoreVertical className="w-4 h-4 text-gray-500" />
                                                </button>

                                                {memberMenu === member.id && (
                                                    <div className="absolute right-0 mt-1 w-48 bg-dark-card border border-dark-border rounded-lg shadow-lg z-10">
                                                        {isOwner() && member.role !== 'admin' && (
                                                            <button
                                                                onClick={() => {
                                                                    updateMemberRole(member.id, 'admin');
                                                                    setMemberMenu(null);
                                                                }}
                                                                className="w-full px-4 py-2 text-left text-sm text-gray-300 hover:bg-dark-border flex items-center gap-2"
                                                            >
                                                                <Shield className="w-4 h-4" />
                                                                Make Admin
                                                            </button>
                                                        )}
                                                        {member.role === 'admin' && (
                                                            <button
                                                                onClick={() => {
                                                                    updateMemberRole(member.id, 'member');
                                                                    setMemberMenu(null);
                                                                }}
                                                                className="w-full px-4 py-2 text-left text-sm text-gray-300 hover:bg-dark-border flex items-center gap-2"
                                                            >
                                                                <Users className="w-4 h-4" />
                                                                Remove Admin
                                                            </button>
                                                        )}
                                                        <button
                                                            onClick={() => {
                                                                if (confirm(`Remove ${member.name} from the organization?`)) {
                                                                    removeMember(member.id);
                                                                }
                                                                setMemberMenu(null);
                                                            }}
                                                            className="w-full px-4 py-2 text-left text-sm text-red-400 hover:bg-dark-border flex items-center gap-2"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                            Remove
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Pending Invitations */}
            {canManageMembers() && invitations.length > 0 && (
                <div>
                    <h4 className="text-sm font-medium text-gray-400 mb-3 flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        Pending Invitations ({invitations.length})
                    </h4>
                    <div className="bg-dark-card border border-dark-border rounded-lg divide-y divide-dark-border">
                        {invitations.map(invite => (
                            <div key={invite.id} className="px-4 py-3 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <Mail className="w-4 h-4 text-gray-500" />
                                    <div>
                                        <div className="text-sm text-white">{invite.email}</div>
                                        <div className="text-xs text-gray-500">
                                            Expires {new Date(invite.expires_at).toLocaleDateString()}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => copyInviteLink(invite.token)}
                                        className="p-2 hover:bg-dark-border rounded text-gray-400 hover:text-white"
                                        title="Copy invite link"
                                    >
                                        {copiedToken === invite.token ? (
                                            <Check className="w-4 h-4 text-green-500" />
                                        ) : (
                                            <Copy className="w-4 h-4" />
                                        )}
                                    </button>
                                    <button
                                        onClick={() => resendInvitation(invite.id)}
                                        className="p-2 hover:bg-dark-border rounded text-gray-400 hover:text-white"
                                        title="Resend invitation"
                                    >
                                        <Send className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => cancelInvitation(invite.id)}
                                        className="p-2 hover:bg-dark-border rounded text-gray-400 hover:text-red-400"
                                        title="Cancel invitation"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Invite Modal */}
            {showInviteModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-dark-card border border-dark-border rounded-xl w-full max-w-md p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-medium text-white">Invite Team Member</h3>
                            <button
                                onClick={() => {
                                    setShowInviteModal(false);
                                    setInviteSuccess(null);
                                }}
                                className="text-gray-500 hover:text-white"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {inviteSuccess ? (
                            <div className="text-center py-4">
                                <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Check className="w-6 h-6 text-green-500" />
                                </div>
                                <p className="text-white mb-2">Invitation Created!</p>
                                <p className="text-sm text-gray-400 mb-4">
                                    Share this link with {inviteSuccess.email}:
                                </p>
                                <div className="flex items-center gap-2 bg-dark-bg rounded-lg p-2">
                                    <input
                                        type="text"
                                        readOnly
                                        value={`${window.location.origin}/invite/${inviteSuccess.token}`}
                                        className="bg-transparent text-sm text-gray-300 flex-1 outline-none"
                                    />
                                    <button
                                        onClick={() => copyInviteLink(inviteSuccess.token)}
                                        className="p-2 hover:bg-dark-border rounded"
                                    >
                                        {copiedToken === inviteSuccess.token ? (
                                            <Check className="w-4 h-4 text-green-500" />
                                        ) : (
                                            <Copy className="w-4 h-4 text-gray-400" />
                                        )}
                                    </button>
                                </div>
                                <button
                                    onClick={() => {
                                        setShowInviteModal(false);
                                        setInviteSuccess(null);
                                    }}
                                    className="btn-primary mt-6 w-full"
                                >
                                    Done
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm text-gray-400 mb-1">Email Address</label>
                                    <input
                                        type="email"
                                        value={inviteEmail}
                                        onChange={(e) => setInviteEmail(e.target.value)}
                                        placeholder="colleague@company.com"
                                        className="input w-full"
                                        autoFocus
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm text-gray-400 mb-1">Role</label>
                                    <select
                                        value={inviteRole}
                                        onChange={(e) => setInviteRole(e.target.value)}
                                        className="input w-full"
                                    >
                                        {Object.entries(ORG_ROLES).map(([key, value]) => (
                                            key !== 'owner' && (
                                                <option key={key} value={key}>
                                                    {value.label} - {value.description}
                                                </option>
                                            )
                                        ))}
                                    </select>
                                </div>

                                {inviteRole === 'member' && (
                                    <div>
                                        <label className="block text-sm text-gray-400 mb-2">Permissions</label>
                                        <div className="grid grid-cols-2 gap-2">
                                            {TAB_PERMISSIONS.map(perm => (
                                                <label
                                                    key={perm.id}
                                                    className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer"
                                                >
                                                    <input
                                                        type="checkbox"
                                                        checked={invitePermissions.includes(perm.id)}
                                                        onChange={() => togglePermission(perm.id)}
                                                        className="rounded border-dark-border"
                                                    />
                                                    {perm.label}
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <div className="flex gap-3 pt-4">
                                    <button
                                        onClick={() => setShowInviteModal(false)}
                                        className="btn-secondary flex-1"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleInvite}
                                        disabled={!inviteEmail.trim() || isInviting}
                                        className="btn-primary flex-1 flex items-center justify-center gap-2"
                                    >
                                        {isInviting ? (
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                        ) : (
                                            <>
                                                <UserPlus className="w-4 h-4" />
                                                Send Invite
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
