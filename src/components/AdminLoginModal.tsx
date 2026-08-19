import React, { useState } from 'react';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithPopup, signOut } from 'firebase/auth';
import { auth, googleProvider } from '../lib/firebase';
import { Shield, Mail, Lock, LogOut, CheckCircle2, AlertCircle, X } from 'lucide-react';

interface AdminLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: any;
  onAdminAuthChange: (user: any) => void;
}

export const AdminLoginModal: React.FC<AdminLoginModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onAdminAuthChange,
}) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      let res;
      if (isSignUp) {
        res = await createUserWithEmailAndPassword(auth, email, password);
      } else {
        res = await signInWithEmailAndPassword(auth, email, password);
      }
      onAdminAuthChange(res.user);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    setError('');
    setLoading(true);
    try {
      const res = await signInWithPopup(auth, googleProvider);
      onAdminAuthChange(res.user);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Google sign-in failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      onAdminAuthChange(null);
      onClose();
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-8 shadow-2xl text-slate-100 relative">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-white p-2 rounded-xl bg-slate-800/50 hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto mb-3 shadow-lg shadow-emerald-500/10">
            <Shield className="w-7 h-7" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight">Firebase Admin Portal</h2>
          <p className="text-xs text-slate-400 mt-1">
            Authenticate to manage project settings and administrative operations.
          </p>
        </div>

        {currentUser ? (
          <div className="space-y-6 text-center">
            <div className="bg-slate-800/80 p-4 rounded-2xl border border-slate-700/60">
              <span className="text-xs text-emerald-400 font-semibold block mb-1">Currently Signed In As</span>
              <p className="text-sm font-bold text-white">{currentUser.email || currentUser.displayName}</p>
              <span className="inline-block mt-2 text-[10px] bg-emerald-500/20 text-emerald-300 px-2.5 py-0.5 rounded-full border border-emerald-500/30">
                Firestore Admin Authorized
              </span>
            </div>

            <button
              onClick={handleSignOut}
              className="w-full bg-rose-600 hover:bg-rose-700 text-white font-semibold py-3 px-4 rounded-xl shadow transition-colors flex items-center justify-center space-x-2 text-sm"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out Admin</span>
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {error && (
              <div className="bg-rose-500/10 border border-rose-500/30 text-rose-300 p-3 rounded-xl text-xs flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleEmailAuth} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                  Admin Email
                </label>
                <div className="relative">
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@project.com"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 pl-11"
                  />
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 pl-11"
                  />
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 px-4 rounded-xl shadow-lg shadow-emerald-600/20 transition-colors text-sm disabled:opacity-50"
              >
                {loading ? 'Processing...' : isSignUp ? 'Create Admin Account' : 'Admin Login'}
              </button>
            </form>

            <div className="relative flex py-2 items-center">
              <div className="flex-grow border-t border-slate-800"></div>
              <span className="flex-shrink mx-4 text-slate-500 text-xs">Or</span>
              <div className="flex-grow border-t border-slate-800"></div>
            </div>

            <button
              onClick={handleGoogleAuth}
              disabled={loading}
              className="w-full bg-slate-800 hover:bg-slate-700 text-white font-semibold py-3 px-4 rounded-xl border border-slate-700 transition-colors text-sm flex items-center justify-center space-x-2"
            >
              <span>🔑 Sign in with Google</span>
            </button>

            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => setIsSignUp(!isSignUp)}
                className="text-xs text-emerald-400 hover:text-emerald-300 font-medium"
              >
                {isSignUp ? 'Already have admin account? Log in' : 'Need an admin account? Register'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
