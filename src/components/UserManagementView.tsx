import React, { useState } from 'react';
import { User } from '../types';
import { Users, Plus, Trash2, Edit, Eye, EyeOff, X, ShieldCheck, Key, Copy, Check } from 'lucide-react';
import { ConfirmationModal } from './ConfirmationModal';

interface UserManagementViewProps {
  users: User[];
  onSaveUser: (user: User) => void;
  onDeleteUser: (userId: string) => void;
  darkMode?: boolean;
}

export const UserManagementView: React.FC<UserManagementViewProps> = ({
  users,
  onSaveUser,
  onDeleteUser,
  darkMode = true,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'super_admin' | 'staff'>('staff');

  // Per-user password visibility state in table
  const [visiblePasswords, setVisiblePasswords] = useState<{ [id: string]: boolean }>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const [pendingAction, setPendingAction] = useState<{
    type: 'create' | 'update' | 'delete' | 'view';
    title: string;
    message: string;
    isDanger?: boolean;
    data?: any;
  } | null>(null);

  const [viewingUser, setViewingUser] = useState<User | null>(null);

  const generateStrongPassword = () => {
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const numbers = '0123456789';
    const symbols = '!@#$%^&*';
    const all = uppercase + lowercase + numbers + symbols;

    let pwd = '';
    // Ensure at least one of each
    pwd += uppercase.charAt(Math.floor(Math.random() * uppercase.length));
    pwd += lowercase.charAt(Math.floor(Math.random() * lowercase.length));
    pwd += numbers.charAt(Math.floor(Math.random() * numbers.length));
    pwd += symbols.charAt(Math.floor(Math.random() * symbols.length));

    for (let i = 4; i < 12; i++) {
      pwd += all.charAt(Math.floor(Math.random() * all.length));
    }
    // Shuffle
    pwd = pwd.split('').sort(() => 0.5 - Math.random()).join('');
    setPassword(pwd);
  };

  const handleOpenCreate = () => {
    setEditingUser(null);
    setName('');
    setUsername('');
    generateStrongPassword();
    setRole('staff');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (u: User) => {
    setEditingUser(u);
    setName(u.name);
    setUsername(u.username);
    setPassword(u.password || '');
    setRole(u.role);
    setIsModalOpen(true);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !username.trim() || !password.trim()) return;

    const userData: User = {
      id: editingUser ? editingUser.id : `usr-${Date.now()}`,
      name: name.trim(),
      username: username.trim().toLowerCase(),
      password: password.trim(),
      role,
      createdAt: editingUser ? editingUser.createdAt : new Date().toISOString().split('T')[0],
    };

    setPendingAction({
      type: editingUser ? 'update' : 'create',
      title: editingUser ? 'Confirm User Update' : 'Confirm User Creation',
      message: `Are you sure you want to ${editingUser ? 'update login details for' : 'create user account for'} ${userData.name} (@${userData.username})?`,
      data: userData,
    });
  };

  const executeConfirmedAction = () => {
    if (!pendingAction) return;

    if (pendingAction.type === 'create' || pendingAction.type === 'update') {
      onSaveUser(pendingAction.data);
      setIsModalOpen(false);
      setEditingUser(null);
    } else if (pendingAction.type === 'delete') {
      onDeleteUser(pendingAction.data);
    }
    setPendingAction(null);
  };

  const togglePasswordVisibility = (id: string) => {
    setVisiblePasswords((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const copyPasswordToClipboard = (id: string, pwd: string) => {
    navigator.clipboard.writeText(pwd);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className={`flex flex-col md:flex-row justify-between items-start md:items-center gap-4 ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'} border rounded-3xl p-6`}>
        <div>
          <h1 className={`text-2xl font-bold flex items-center ${darkMode ? 'text-white' : 'text-slate-900'}`}>
            <Users className="w-7 h-7 text-emerald-400 mr-3" />
            User Access & RBAC Management
          </h1>
          <p className={`text-sm mt-1 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
            Super Admin control: Auto-generate secure credentials, copy passwords, toggle visibility, and manage staff access.
          </p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium px-4 py-2.5 rounded-xl shadow transition-colors flex items-center space-x-2 text-sm shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Create User Account</span>
        </button>
      </div>

      {/* Users Table */}
      <div className={`${darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900 shadow-sm'} border rounded-3xl p-6 overflow-hidden`}>
        <h3 className={`text-lg font-bold mb-4 flex items-center ${darkMode ? 'text-white' : 'text-slate-900'}`}>
          <ShieldCheck className="w-5 h-5 text-emerald-400 mr-2" />
          Registered System Users ({users.length})
        </h3>

        <div className="overflow-x-auto">
          <table className={`w-full text-left text-sm ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
            <thead className={`uppercase text-xs border-b ${darkMode ? 'bg-slate-950 text-slate-400 border-slate-800' : 'bg-slate-100 text-slate-700 border-slate-200'}`}>
              <tr>
                <th className="px-4 py-3">Full Name</th>
                <th className="px-4 py-3">Username (Login ID)</th>
                <th className="px-4 py-3">Password Credentials</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Created</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${darkMode ? 'divide-slate-800/60' : 'divide-slate-200'}`}>
              {users.map((u) => {
                const isVisible = visiblePasswords[u.id];
                const isCopied = copiedId === u.id;
                return (
                  <tr key={u.id} className={darkMode ? 'hover:bg-slate-800/40 transition-colors' : 'hover:bg-slate-50 transition-colors'}>
                    <td className={`px-4 py-3.5 font-semibold ${darkMode ? 'text-white' : 'text-slate-900'}`}>{u.name}</td>
                    <td className="px-4 py-3.5 font-mono text-emerald-400">@{u.username}</td>
                    <td className="px-4 py-3.5 font-mono">
                      <div className="flex items-center space-x-2">
                        <span className={darkMode ? 'text-slate-300' : 'text-slate-800'}>
                          {isVisible ? u.password : '••••••••••••'}
                        </span>
                        <button
                          onClick={() => togglePasswordVisibility(u.id)}
                          className={`p-1 rounded-lg transition-colors ${darkMode ? 'text-slate-400 hover:text-white hover:bg-slate-800' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'}`}
                          title={isVisible ? 'Hide Password' : 'Show Password'}
                        >
                          {isVisible ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                        <button
                          onClick={() => copyPasswordToClipboard(u.id, u.password)}
                          className={`p-1 rounded-lg transition-colors ${darkMode ? 'text-slate-400 hover:text-emerald-400 hover:bg-slate-800' : 'text-slate-600 hover:text-emerald-600 hover:bg-slate-100'}`}
                          title="Copy Password"
                        >
                          {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <span
                        className={`text-xs px-2.5 py-1 rounded-full font-semibold border ${
                          u.role === 'super_admin'
                            ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                            : 'bg-blue-500/20 text-blue-300 border-blue-500/30'
                        }`}
                      >
                        {u.role === 'super_admin' ? 'Super Admin' : 'Staff Operator'}
                      </span>
                    </td>
                    <td className={`px-4 py-3.5 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>{u.createdAt}</td>
                    <td className="px-4 py-3.5 text-right space-x-1">
                      <button
                        onClick={() => setViewingUser(u)}
                        className={`p-1.5 rounded-lg transition-colors ${darkMode ? 'text-slate-400 hover:text-white hover:bg-slate-800' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'}`}
                        title="View Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleOpenEdit(u)}
                        className={`p-1.5 rounded-lg transition-colors ${darkMode ? 'text-slate-400 hover:text-amber-400 hover:bg-slate-800' : 'text-slate-600 hover:text-amber-600 hover:bg-slate-100'}`}
                        title="Edit User Credentials"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      {u.username !== 'superadmin' && (
                        <button
                          onClick={() =>
                            setPendingAction({
                              type: 'delete',
                              title: 'Confirm User Deletion',
                              message: `Are you sure you want to delete user account for ${u.name}?`,
                              isDanger: true,
                              data: u.id,
                            })
                          }
                          className={`p-1.5 rounded-lg transition-colors ${darkMode ? 'text-slate-400 hover:text-rose-400 hover:bg-slate-800' : 'text-slate-600 hover:text-rose-600 hover:bg-slate-100'}`}
                          title="Delete User"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create / Edit User Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className={`${darkMode ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900 shadow-2xl'} border rounded-3xl max-w-md w-full p-8 relative`}>
            <button
              onClick={() => setIsModalOpen(false)}
              className={`absolute top-5 right-5 p-2 rounded-xl ${darkMode ? 'text-slate-400 hover:text-white bg-slate-800' : 'text-slate-600 hover:text-slate-900 bg-slate-100'}`}
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className={`text-xl font-bold mb-4 ${darkMode ? 'text-white' : 'text-slate-900'}`}>
              {editingUser ? 'Edit User Credentials' : 'Create User & Generate Password'}
            </h3>

            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div>
                <label className={`block text-xs font-semibold uppercase mb-1 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>Full Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Ibrahim Musa"
                  className={`w-full border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 ${darkMode ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-100 border-slate-300 text-slate-900'}`}
                />
              </div>

              <div>
                <label className={`block text-xs font-semibold uppercase mb-1 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>Username (Login ID)</label>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g. ibrahim"
                  className={`w-full border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 ${darkMode ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-100 border-slate-300 text-slate-900'}`}
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className={`block text-xs font-semibold uppercase ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>Password</label>
                  <button
                    type="button"
                    onClick={generateStrongPassword}
                    className="text-xs text-emerald-400 hover:underline font-semibold flex items-center space-x-1"
                  >
                    <Key className="w-3 h-3 mr-1" />
                    <span>Auto-Generate Strong Password</span>
                  </button>
                </div>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="e.g. pass1234"
                    className={`w-full border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono ${darkMode ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-100 border-slate-300 text-slate-900'}`}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(password);
                      alert('Password copied to clipboard!');
                    }}
                    className={`absolute right-3.5 top-3.5 p-1 rounded-lg ${darkMode ? 'text-slate-400 hover:text-emerald-400' : 'text-slate-600 hover:text-emerald-600'}`}
                    title="Copy Password"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div>
                <label className={`block text-xs font-semibold uppercase mb-1 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>Role / Access Level</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as any)}
                  className={`w-full border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 ${darkMode ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-100 border-slate-300 text-slate-900'}`}
                >
                  <option value="staff" className={darkMode ? 'bg-slate-900 text-white' : 'bg-white text-slate-900'}>Staff / Data Entry Operator</option>
                  <option value="super_admin" className={darkMode ? 'bg-slate-900 text-white' : 'bg-white text-slate-900'}>Super Administrator</option>
                </select>
              </div>

              <div className="pt-4 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className={`px-5 py-2.5 rounded-xl border text-sm font-medium ${darkMode ? 'border-slate-700 text-slate-300 hover:bg-slate-800' : 'border-slate-300 text-slate-700 hover:bg-slate-100'}`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold shadow"
                >
                  {editingUser ? 'Save Changes' : 'Create User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View User Details Modal */}
      {viewingUser && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className={`${darkMode ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900 shadow-2xl'} border rounded-3xl max-w-md w-full p-8 relative`}>
            <button
              onClick={() => setViewingUser(null)}
              className={`absolute top-5 right-5 p-2 rounded-xl ${darkMode ? 'text-slate-400 hover:text-white bg-slate-800' : 'text-slate-600 hover:text-slate-900 bg-slate-100'}`}
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className={`text-xl font-bold mb-4 ${darkMode ? 'text-white' : 'text-slate-900'}`}>User Account Details</h3>
            <div className={`space-y-3 p-4 rounded-2xl border text-sm ${darkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
              <div className="flex justify-between">
                <span className={darkMode ? 'text-slate-400' : 'text-slate-600'}>Name:</span>
                <span className={`font-semibold ${darkMode ? 'text-white' : 'text-slate-900'}`}>{viewingUser.name}</span>
              </div>
              <div className="flex justify-between">
                <span className={darkMode ? 'text-slate-400' : 'text-slate-600'}>Username:</span>
                <span className="font-mono text-emerald-400">@{viewingUser.username}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className={darkMode ? 'text-slate-400' : 'text-slate-600'}>Password:</span>
                <div className="flex items-center space-x-2">
                  <span className={`font-mono ${darkMode ? 'text-slate-300' : 'text-slate-800'}`}>
                    {viewingUser.password}
                  </span>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(viewingUser.password);
                      alert('Password copied to clipboard!');
                    }}
                    className="p-1 text-emerald-400 hover:text-emerald-300"
                    title="Copy Password"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              <div className="flex justify-between">
                <span className={darkMode ? 'text-slate-400' : 'text-slate-600'}>Role:</span>
                <span className={`font-semibold ${darkMode ? 'text-white' : 'text-slate-900'}`}>{viewingUser.role}</span>
              </div>
            </div>
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setViewingUser(null)}
                className={`px-6 py-2 rounded-xl text-sm ${darkMode ? 'bg-slate-800 hover:bg-slate-700 text-white' : 'bg-slate-200 hover:bg-slate-300 text-slate-800'}`}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={!!pendingAction}
        title={pendingAction?.title || ''}
        message={pendingAction?.message || ''}
        confirmText={pendingAction?.type === 'delete' ? 'Delete' : 'Confirm'}
        isDanger={pendingAction?.isDanger}
        onConfirm={executeConfirmedAction}
        onCancel={() => setPendingAction(null)}
        darkMode={darkMode}
      />
    </div>
  );
};
