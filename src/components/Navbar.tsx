import React, { useState } from 'react';
import { ActiveTab, User } from '../types';
import { Sun, Moon, LogOut, Menu, X, ChevronDown, Cloud, WifiOff } from 'lucide-react';
import { ConfirmationModal } from './ConfirmationModal';

interface NavbarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  onResetData: () => void;
  darkMode: boolean;
  setDarkMode: (val: boolean) => void;
  currentUser: User | null;
  onLogout: () => void;
  syncStatus?: 'synced' | 'offline';
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  onResetData,
  darkMode,
  setDarkMode,
  currentUser,
  onLogout,
  syncStatus = 'synced',
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);

  const handleTabClick = (tab: ActiveTab) => {
    setActiveTab(tab);
    setMobileMenuOpen(false);
    setProfileDropdownOpen(false);
  };

  const isSuperAdmin = currentUser?.role === 'super_admin';

  return (
    <>
      <header className={`${darkMode ? 'bg-slate-950 text-slate-100 border-slate-800' : 'bg-white text-slate-900 border-slate-200'} border-b sticky top-0 z-40 transition-colors shadow-xs backdrop-blur-md bg-opacity-95 no-print`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-18">
            {/* Logo & Brand */}
            <div className="flex items-center space-x-3 cursor-pointer" onClick={() => handleTabClick('daily-entry')}>
              <div className="w-11 h-11 rounded-2xl overflow-hidden border border-emerald-500/30 shadow-lg shadow-emerald-500/20 shrink-0">
                <img src="/logo.jpg" alt="OpsTracka Logo" className="w-full h-full object-cover" />
              </div>
              <div>
                <span className="font-bold text-lg tracking-tight block">OpsTracka</span>
                <span className="text-[10px] text-emerald-400 font-semibold tracking-wider uppercase block">
                  {isSuperAdmin ? 'Super Admin Portal' : 'Team Lead Portal'}
                </span>
              </div>
            </div>

            {/* Desktop Navigation (Clean, spacious, uncrowded) */}
            <nav className="hidden lg:flex items-center space-x-1.5 bg-slate-900/60 p-1.5 rounded-2xl border border-slate-800/80">
              <button
                onClick={() => handleTabClick('daily-entry')}
                className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                  activeTab === 'daily-entry'
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                Daily Entries
              </button>

              {isSuperAdmin && (
                <button
                  onClick={() => handleTabClick('projects')}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                    activeTab === 'projects'
                      ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  Projects
                </button>
              )}

              <button
                onClick={() => handleTabClick('dashboard')}
                className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                  activeTab === 'dashboard'
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                Dashboard
              </button>

              <button
                onClick={() => handleTabClick('whatsapp-report')}
                className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                  activeTab === 'whatsapp-report'
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                Reports
              </button>

              {isSuperAdmin && (
                <button
                  onClick={() => handleTabClick('user-management')}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                    activeTab === 'user-management'
                      ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  User Accounts
                </button>
              )}
            </nav>

            {/* Right Actions: Sync Status, Theme Toggle & User Profile Dropdown */}
            <div className="flex items-center space-x-3">
              {/* Firestore Sync Status Indicator */}
              <div
                className={`hidden md:flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-[11px] font-semibold border ${
                  syncStatus === 'synced'
                    ? darkMode
                      ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-400'
                      : 'bg-emerald-50 border-emerald-200 text-emerald-700'
                    : darkMode
                    ? 'bg-amber-950/40 border-amber-800/60 text-amber-400'
                    : 'bg-amber-50 border-amber-200 text-amber-700'
                }`}
                title={syncStatus === 'synced' ? 'Connected to Firestore Cloud Backend' : 'Running in Local Storage Offline Mode'}
              >
                {syncStatus === 'synced' ? (
                  <>
                    <Cloud className="w-3.5 h-3.5 animate-pulse" />
                    <span>Cloud Synced</span>
                  </>
                ) : (
                  <>
                    <WifiOff className="w-3.5 h-3.5" />
                    <span>Offline Mode</span>
                  </>
                )}
              </div>

              {/* Theme Toggle */}
              <button
                onClick={() => setDarkMode(!darkMode)}
                className={`p-2.5 rounded-xl border transition-colors ${
                  darkMode
                    ? 'bg-slate-900 border-slate-800 text-amber-400 hover:bg-slate-800'
                    : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'
                }`}
                title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              >
                {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>

              {/* User Profile Pill / Menu */}
              {currentUser && (
                <div className="relative">
                  <button
                    onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                    className="hidden sm:flex items-center space-x-3 bg-slate-900 hover:bg-slate-800/80 border border-slate-800 px-3.5 py-2 rounded-2xl text-xs transition-all text-white"
                  >
                    <div className="w-7 h-7 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 flex items-center justify-center font-bold text-xs">
                      {currentUser.name.charAt(0)}
                    </div>
                    <div className="text-left">
                      <span className="font-bold text-white block leading-tight">{currentUser.name}</span>
                      <span className="text-[10px] text-slate-400 block">{isSuperAdmin ? 'Super Admin' : 'Team Lead'}</span>
                    </div>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400 ml-1" />
                  </button>

                  {/* Profile Dropdown Menu */}
                  {profileDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-56 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl py-2 z-50 text-xs text-white">
                      <div className="px-4 py-2 border-b border-slate-800">
                        <span className="text-slate-400 block">Signed in as</span>
                        <span className="font-bold text-white truncate block">@{currentUser.username}</span>
                      </div>
                      <button
                        onClick={() => {
                          setProfileDropdownOpen(false);
                          setLogoutConfirmOpen(true);
                        }}
                        className="w-full text-left px-4 py-2.5 text-rose-400 hover:bg-rose-500/10 flex items-center space-x-2 transition-colors font-medium"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Logout Button (Direct for mobile) */}
              <button
                onClick={() => setLogoutConfirmOpen(true)}
                className="sm:hidden bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 p-2.5 rounded-xl text-xs font-semibold transition-colors flex items-center justify-center"
                title="Logout"
              >
                <LogOut className="w-4 h-4" />
              </button>

              {/* Hamburger Menu Toggle for Mobile & Tablet (< 1024px) */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-200 hover:bg-slate-800 transition-colors"
                title="Toggle Menu"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile & Tablet Hamburger Drawer (< 1024px) */}
        {mobileMenuOpen && (
          <div className="lg:hidden bg-slate-950 border-t border-slate-800 px-4 py-6 space-y-3 shadow-2xl">
            {currentUser && (
              <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-2xl flex items-center justify-between text-xs mb-4 text-white">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 flex items-center justify-center font-bold">
                    {currentUser.name.charAt(0)}
                  </div>
                  <div>
                    <span className="font-bold text-white block">{currentUser.name}</span>
                    <span className="text-[10px] text-emerald-400">@{currentUser.username} ({isSuperAdmin ? 'Admin' : 'Team Lead'})</span>
                  </div>
                </div>
              </div>
            )}

            <button
              onClick={() => handleTabClick('daily-entry')}
              className={`w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                activeTab === 'daily-entry' ? 'bg-emerald-600 text-white font-bold' : 'text-slate-300 hover:bg-slate-900'
              }`}
            >
              Daily Entries
            </button>

            {isSuperAdmin && (
              <button
                onClick={() => handleTabClick('projects')}
                className={`w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                  activeTab === 'projects' ? 'bg-emerald-600 text-white font-bold' : 'text-slate-300 hover:bg-slate-900'
                }`}
              >
                Projects & Operations
              </button>
            )}

            <button
              onClick={() => handleTabClick('dashboard')}
              className={`w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                activeTab === 'dashboard' ? 'bg-emerald-600 text-white font-bold' : 'text-slate-300 hover:bg-slate-900'
              }`}
            >
              Management Dashboard
            </button>

            <button
              onClick={() => handleTabClick('whatsapp-report')}
              className={`w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                activeTab === 'whatsapp-report' ? 'bg-emerald-600 text-white font-bold' : 'text-slate-300 hover:bg-slate-900'
              }`}
            >
              WhatsApp Reports
            </button>

            {isSuperAdmin && (
              <button
                onClick={() => handleTabClick('user-management')}
                className={`w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                  activeTab === 'user-management' ? 'bg-emerald-600 text-white font-bold' : 'text-slate-300 hover:bg-slate-900'
                }`}
              >
                User Accounts
              </button>
            )}

            <div className="pt-4 border-t border-slate-800">
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  setLogoutConfirmOpen(true);
                }}
                className="w-full bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 px-4 py-3 rounded-xl text-sm font-semibold transition-colors flex items-center justify-center space-x-2"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        )}
      </header>

      {/* Logout Confirmation Modal */}
      <ConfirmationModal
        isOpen={logoutConfirmOpen}
        title="Confirm Sign Out"
        message={`Are you sure you want to sign out, ${currentUser?.name || ''}?`}
        confirmText="Yes, Sign Out"
        cancelText="Cancel"
        isDanger={true}
        onConfirm={() => {
          setLogoutConfirmOpen(false);
          onLogout();
        }}
        onCancel={() => setLogoutConfirmOpen(false)}
      />
    </>
  );
};
