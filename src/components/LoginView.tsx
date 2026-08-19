import React, { useState } from 'react';
import { User } from '../types';
import { Lock, ArrowRight, AlertCircle, Users, Eye, EyeOff } from 'lucide-react';

interface LoginViewProps {
  users: User[];
  onLogin: (user: User) => void;
  darkMode?: boolean;
}

export const LoginView: React.FC<LoginViewProps> = ({ users, onLogin, darkMode = true }) => {
  const [selectedUsername, setSelectedUsername] = useState(users[0]?.username || '');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const matchedUser = users.find(
      (u) => u.username.toLowerCase() === selectedUsername.trim().toLowerCase() && u.password === password
    );

    if (matchedUser) {
      onLogin(matchedUser);
    } else {
      setError('Incorrect password for the selected user account.');
    }
  };

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'} flex items-center justify-center p-4 transition-colors duration-200`}>
      <div className={`max-w-md w-full ${darkMode ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900 shadow-xl'} border rounded-3xl p-8`}>
        <div className="text-center mb-8">
          <div className="w-20 h-20 rounded-2xl overflow-hidden border border-emerald-500/30 mx-auto mb-4 shadow-xl shadow-emerald-500/20">
            <img src="/logo.jpg" alt="OpsTracka Logo" className="w-full h-full object-cover" />
          </div>
          <h1 className={`text-2xl font-bold tracking-tight ${darkMode ? 'text-white' : 'text-slate-900'}`}>OpsTracka Portal</h1>
          <p className={`text-xs mt-1 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
            Select your username and enter your password assigned by the Super Admin.
          </p>
        </div>

        {error && (
          <div className="bg-rose-500/10 border border-rose-500/30 text-rose-300 p-3.5 rounded-2xl text-xs flex items-center space-x-2.5 mb-6">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className={`block text-xs font-semibold uppercase tracking-wider mb-1.5 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
              Select User Account ({users.length} available)
            </label>
            <div className="relative">
              <select
                required
                value={selectedUsername}
                onChange={(e) => setSelectedUsername(e.target.value)}
                className={`w-full ${darkMode ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-100 border-slate-300 text-slate-900'} border rounded-2xl px-4 py-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 pl-11 appearance-none cursor-pointer`}
              >
                {users.map((u) => (
                  <option key={u.id} value={u.username} className={darkMode ? 'bg-slate-900 text-white' : 'bg-white text-slate-900'}>
                    {u.name} ({u.role === 'super_admin' ? 'Super Admin' : 'Staff'} - @{u.username})
                  </option>
                ))}
              </select>
              <Users className={`w-4 h-4 absolute left-3.5 top-4 pointer-events-none ${darkMode ? 'text-slate-500' : 'text-slate-400'}`} />
            </div>
          </div>

          <div>
            <label className={`block text-xs font-semibold uppercase tracking-wider mb-1.5 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className={`w-full ${darkMode ? 'bg-slate-950 border-slate-800 text-white placeholder-slate-600' : 'bg-slate-100 border-slate-300 text-slate-900 placeholder-slate-400'} border rounded-2xl px-4 py-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 pl-11 pr-11`}
              />
              <Lock className={`w-4 h-4 absolute left-3.5 top-4 ${darkMode ? 'text-slate-500' : 'text-slate-400'}`} />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className={`absolute right-3.5 top-3.5 p-0.5 rounded-lg ${darkMode ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'}`}
                title={showPassword ? 'Hide Password' : 'Show Password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-4 px-4 rounded-2xl shadow-lg shadow-emerald-600/20 transition-colors text-sm flex items-center justify-center space-x-2"
          >
            <span>Sign In to App</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
