import { useState, useEffect } from 'react';
import { useAuthStore } from '../../store/authStore';
import {
    fetchAllUsers,
    createUser,
    updateUserProfile,
    deleteUser as deleteDbUser,
    changePassword,
    generateRandomPassword,
    approveUser,
    suspendUser,
    AVAILABLE_TABS,
    DEFAULT_TAB_PERMISSIONS
} from '../../services/userService';

// Edit User Modal Component
function EditUserModal({ user, onClose, onSave, saving, togglePermission }) {
    const [editForm, setEditForm] = useState({
        name: user.name,
        role: user.role,
        tabPermissions: [...(user.tabPermissions || [])],
    });

    const handleSave = () => {
        onSave(user.id, {
            name: editForm.name,
            role: editForm.role,
            tab_permissions: editForm.tabPermissions,
        });
    };

    return (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
            <div className="bg-[#1a1f2e] border border-dark-border rounded-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
                <div className="p-4 border-b border-dark-border">
                    <h4 className="text-lg font-bold text-gray-100">Edit User</h4>
                </div>
                <div className="p-4 space-y-4">
                    <div>
                        <label className="label">Name</label>
                        <input
                            type="text"
                            value={editForm.name}
                            onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                            className="input w-full"
                        />
                    </div>
                    <div>
                        <label className="label">Role</label>
                        <select
                            value={editForm.role}
                            onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                            className="input w-full"
                        >
                            <option value="user">User</option>
                            <option value="admin">Administrator</option>
                        </select>
                    </div>
                    {editForm.role !== 'admin' && (
                        <div>
                            <label className="label">Tab Permissions</label>
                            <div className="space-y-2 p-3 bg-dark-bg rounded-lg max-h-48 overflow-y-auto">
                                {AVAILABLE_TABS.filter(t => t.id !== 'settings').map(tab => (
                                    <label key={tab.id} className="flex items-center gap-3 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={editForm.tabPermissions.includes(tab.id)}
                                            onChange={() => togglePermission(tab.id, editForm.tabPermissions, (perms) => setEditForm({ ...editForm, tabPermissions: perms }))}
                                            className="w-4 h-4 rounded bg-dark-card border-dark-border text-accent-primary focus:ring-accent-primary"
                                        />
                                        <div>
                                            <span className="text-sm text-gray-300">{tab.label}</span>
                                            <p className="text-xs text-gray-600">{tab.description}</p>
                                        </div>
                                    </label>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
                <div className="p-4 border-t border-dark-border flex justify-end gap-2">
                    <button onClick={onClose} className="btn-ghost">Cancel</button>
                    <button onClick={handleSave} disabled={saving} className="btn-primary">
                        {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>
            </div>
        </div>
    );
}

// User Management Component
export default function UsersManagement() {
    const { isAdmin, user: currentUser, refreshProfile } = useAuthStore();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(null);
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [saving, setSaving] = useState(false);

    const [newUser, setNewUser] = useState({
        name: '',
        email: '',
        password: '',
        role: 'user',
        tabPermissions: [...DEFAULT_TAB_PERMISSIONS],
    });

    const [passwordForm, setPasswordForm] = useState({
        newPassword: '',
        confirmPassword: '',
    });

    // Load users on mount
    useEffect(() => {
        loadUsers();
    }, []);

    const loadUsers = async () => {
        try {
            setLoading(true);
            const data = await fetchAllUsers();
            setUsers(data);
            setError(null);
        } catch (e) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateUser = async () => {
        if (!newUser.name || !newUser.email || !newUser.password) {
            setError('Name, email, and password are required');
            return;
        }

        try {
            setSaving(true);
            await createUser(newUser);
            await loadUsers();
            setShowCreateModal(false);
            setNewUser({
                name: '',
                email: '',
                password: '',
                role: 'user',
                tabPermissions: [...DEFAULT_TAB_PERMISSIONS],
            });
        } catch (e) {
            setError(e.message);
        } finally {
            setSaving(false);
        }
    };

    const handleUpdateUser = async (profileId, updates) => {
        try {
            setSaving(true);
            await updateUserProfile(profileId, updates);
            await loadUsers();
            setShowEditModal(null);
            // If updating own profile, refresh it
            if (profileId === currentUser?.profile?.id) {
                await refreshProfile();
            }
        } catch (e) {
            setError(e.message);
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteUser = async (authUserId) => {
        if (!confirm('Are you sure you want to delete this user? This cannot be undone.')) return;

        try {
            setSaving(true);
            await deleteDbUser(authUserId);
            await loadUsers();
        } catch (e) {
            setError(e.message);
        } finally {
            setSaving(false);
        }
    };

    const handleApproveUser = async (profileId) => {
        try {
            setSaving(true);
            await approveUser(profileId);
            await loadUsers();
        } catch (e) {
            setError(e.message);
        } finally {
            setSaving(false);
        }
    };

    const handleSuspendUser = async (profileId) => {
        if (!confirm('Are you sure you want to suspend this user?')) return;

        try {
            setSaving(true);
            await suspendUser(profileId);
            await loadUsers();
        } catch (e) {
            setError(e.message);
        } finally {
            setSaving(false);
        }
    };

    const handleChangePassword = async () => {
        if (passwordForm.newPassword !== passwordForm.confirmPassword) {
            setError('Passwords do not match');
            return;
        }
        if (passwordForm.newPassword.length < 6) {
            setError('Password must be at least 6 characters');
            return;
        }

        try {
            setSaving(true);
            await changePassword(passwordForm.newPassword);
            setShowPasswordModal(false);
            setPasswordForm({ newPassword: '', confirmPassword: '' });
            setError(null);
            alert('Password changed successfully');
        } catch (e) {
            setError(e.message);
        } finally {
            setSaving(false);
        }
    };

    const togglePermission = (tabId, userPermissions, setPermissions) => {
        if (userPermissions.includes(tabId)) {
            setPermissions(userPermissions.filter(t => t !== tabId));
        } else {
            setPermissions([...userPermissions, tabId]);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="animate-spin w-8 h-8 border-2 border-accent-primary border-t-transparent rounded-full"></div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h3 className="text-xl font-bold text-gray-100">User Management</h3>
                    <p className="text-sm text-gray-500 mt-1">Manage team access and permissions</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => setShowPasswordModal(true)}
                        className="btn-ghost text-sm"
                    >
                        Change My Password
                    </button>
                    {isAdmin() && (
                        <button
                            onClick={() => setShowCreateModal(true)}
                            className="btn-primary text-sm"
                        >
                            + Add User
                        </button>
                    )}
                </div>
            </div>

            {error && (
                <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm flex items-center gap-2">
                    <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    {error}
                    <button onClick={() => setError(null)} className="ml-auto text-red-400 hover:text-red-300">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
            )}

            {/* Pending Users Section */}
            {users.filter(u => u.status === 'pending').length > 0 && isAdmin() && (
                <div className="mb-6">
                    <div className="flex items-center gap-2 mb-3">
                        <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
                        <h4 className="text-sm font-semibold text-yellow-400">Pending Approval</h4>
                        <span className="text-xs text-gray-500">({users.filter(u => u.status === 'pending').length})</span>
                    </div>
                    <div className="space-y-2">
                        {users.filter(u => u.status === 'pending').map(user => {
                            const initials = user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
                            return (
                                <div key={user.id} className="card p-4 border-yellow-500/30 bg-yellow-500/5">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-white bg-gradient-to-br from-yellow-600 to-orange-600 opacity-60">
                                                {initials}
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <span className="font-medium text-gray-200">{user.name}</span>
                                                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-yellow-500/20 text-yellow-400 font-medium">PENDING</span>
                                                </div>
                                                <p className="text-sm text-gray-500">{user.email}</p>
                                                <p className="text-xs text-gray-600 mt-1">Requested access on {new Date(user.createdAt).toLocaleDateString()}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => handleApproveUser(user.id)}
                                                disabled={saving}
                                                className="px-3 py-1.5 text-sm bg-green-500/20 text-green-400 hover:bg-green-500/30 rounded-lg transition-colors"
                                            >
                                                Approve
                                            </button>
                                            <button
                                                onClick={() => handleDeleteUser(user.authUserId)}
                                                disabled={saving}
                                                className="px-3 py-1.5 text-sm bg-red-500/20 text-red-400 hover:bg-red-500/30 rounded-lg transition-colors"
                                            >
                                                Reject
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Active Users List */}
            <div className="space-y-3">
                <h4 className="text-sm font-semibold text-gray-400">Active Users</h4>
                {users.filter(u => u.status === 'active' || !u.status).map(user => {
                    const initials = user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
                    const isCurrentUser = user.id === currentUser?.profile?.id;
                    const permissionCount = user.tabPermissions?.length || 0;

                    return (
                        <div key={user.id} className="card p-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-white ${user.role === 'admin' ? 'bg-gradient-to-br from-amber-500 to-orange-600' : 'bg-gradient-to-br from-accent-primary to-accent-secondary'}`}>
                                        {initials}
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <span className="font-medium text-gray-200">{user.name}</span>
                                            {user.role === 'admin' && (
                                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 font-medium">ADMIN</span>
                                            )}
                                            {isCurrentUser && (
                                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-accent-primary/20 text-accent-primary font-medium">YOU</span>
                                            )}
                                        </div>
                                        <p className="text-sm text-gray-500">{user.email}</p>
                                        <div className="flex items-center gap-1 mt-1">
                                            <span className="text-xs text-gray-600">
                                                {user.role === 'admin' ? 'All tabs' : `${permissionCount} tab${permissionCount !== 1 ? 's' : ''}`}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {isAdmin() && (
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => setShowEditModal(user)}
                                            className="p-2 text-gray-500 hover:text-gray-300 hover:bg-white/5 rounded-lg transition-colors"
                                            title="Edit user"
                                        >
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                            </svg>
                                        </button>
                                        {!isCurrentUser && (
                                            <button
                                                onClick={() => handleDeleteUser(user.authUserId)}
                                                className="p-2 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                                                title="Delete user"
                                            >
                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                </svg>
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}

                {/* Suspended Users */}
                {users.filter(u => u.status === 'suspended').length > 0 && isAdmin() && (
                    <>
                        <h4 className="text-sm font-semibold text-gray-500 mt-6">Suspended Users</h4>
                        {users.filter(u => u.status === 'suspended').map(user => {
                            const initials = user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
                            return (
                                <div key={user.id} className="card p-4 opacity-60">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-white bg-gray-600">
                                                {initials}
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <span className="font-medium text-gray-400">{user.name}</span>
                                                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-500/20 text-red-400 font-medium">SUSPENDED</span>
                                                </div>
                                                <p className="text-sm text-gray-600">{user.email}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => handleApproveUser(user.id)}
                                                disabled={saving}
                                                className="px-3 py-1.5 text-sm bg-green-500/20 text-green-400 hover:bg-green-500/30 rounded-lg transition-colors"
                                            >
                                                Reactivate
                                            </button>
                                            <button
                                                onClick={() => handleDeleteUser(user.authUserId)}
                                                disabled={saving}
                                                className="p-2 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                                            >
                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                </svg>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </>
                )}

                {users.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                        <p>No users found</p>
                        <p className="text-sm text-gray-600 mt-1">Create your first user to get started</p>
                    </div>
                )}
            </div>

            {/* Create User Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
                    <div className="bg-[#1a1f2e] border border-dark-border rounded-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
                        <div className="p-4 border-b border-dark-border">
                            <h4 className="text-lg font-bold text-gray-100">Create New User</h4>
                        </div>
                        <div className="p-4 space-y-4">
                            <div>
                                <label className="label">Name *</label>
                                <input
                                    type="text"
                                    value={newUser.name}
                                    onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                                    className="input w-full"
                                    placeholder="Full name"
                                />
                            </div>
                            <div>
                                <label className="label">Email *</label>
                                <input
                                    type="email"
                                    value={newUser.email}
                                    onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                                    className="input w-full"
                                    placeholder="user@company.com"
                                />
                            </div>
                            <div>
                                <label className="label">Password *</label>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={newUser.password}
                                        onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                                        className="input flex-1"
                                        placeholder="Initial password"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setNewUser({ ...newUser, password: generateRandomPassword() })}
                                        className="btn-ghost text-sm"
                                    >
                                        Generate
                                    </button>
                                </div>
                            </div>
                            <div>
                                <label className="label">Role</label>
                                <select
                                    value={newUser.role}
                                    onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                                    className="input w-full"
                                >
                                    <option value="user">User</option>
                                    <option value="admin">Administrator</option>
                                </select>
                            </div>
                            {newUser.role !== 'admin' && (
                                <div>
                                    <label className="label">Tab Permissions</label>
                                    <div className="space-y-2 p-3 bg-dark-bg rounded-lg">
                                        {AVAILABLE_TABS.filter(t => t.id !== 'settings').map(tab => (
                                            <label key={tab.id} className="flex items-center gap-3 cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={newUser.tabPermissions.includes(tab.id)}
                                                    onChange={() => togglePermission(tab.id, newUser.tabPermissions, (perms) => setNewUser({ ...newUser, tabPermissions: perms }))}
                                                    className="w-4 h-4 rounded bg-dark-card border-dark-border text-accent-primary focus:ring-accent-primary"
                                                />
                                                <div>
                                                    <span className="text-sm text-gray-300">{tab.label}</span>
                                                    <p className="text-xs text-gray-600">{tab.description}</p>
                                                </div>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                        <div className="p-4 border-t border-dark-border flex justify-end gap-2">
                            <button onClick={() => setShowCreateModal(false)} className="btn-ghost">Cancel</button>
                            <button onClick={handleCreateUser} disabled={saving} className="btn-primary">
                                {saving ? 'Creating...' : 'Create User'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit User Modal */}
            {showEditModal && (
                <EditUserModal
                    user={showEditModal}
                    onClose={() => setShowEditModal(null)}
                    onSave={handleUpdateUser}
                    saving={saving}
                    togglePermission={togglePermission}
                />
            )}

            {/* Change Password Modal */}
            {showPasswordModal && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
                    <div className="bg-[#1a1f2e] border border-dark-border rounded-xl w-full max-w-sm">
                        <div className="p-4 border-b border-dark-border">
                            <h4 className="text-lg font-bold text-gray-100">Change Password</h4>
                        </div>
                        <div className="p-4 space-y-4">
                            <div>
                                <label className="label">New Password</label>
                                <input
                                    type="password"
                                    value={passwordForm.newPassword}
                                    onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                                    className="input w-full"
                                    placeholder="Enter new password"
                                />
                            </div>
                            <div>
                                <label className="label">Confirm Password</label>
                                <input
                                    type="password"
                                    value={passwordForm.confirmPassword}
                                    onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                                    className="input w-full"
                                    placeholder="Confirm new password"
                                />
                            </div>
                        </div>
                        <div className="p-4 border-t border-dark-border flex justify-end gap-2">
                            <button onClick={() => setShowPasswordModal(false)} className="btn-ghost">Cancel</button>
                            <button onClick={handleChangePassword} disabled={saving} className="btn-primary">
                                {saving ? 'Changing...' : 'Change Password'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
