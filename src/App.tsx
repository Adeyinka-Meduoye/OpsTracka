import React, { useState, useEffect } from 'react';
import { Project, StaffEntry, ActiveTab, User } from './types';
import {
  getStoredProjects,
  saveProjects,
  getStoredEntries,
  saveEntries,
  getStoredUsers,
  saveUsers,
  resetToDemoData,
} from './utils/storage';
import {
  fetchProjectsFromFirestore,
  saveProjectToFirestore,
  deleteProjectFromFirestore,
  fetchEntriesFromFirestore,
  saveEntryToFirestore,
  deleteEntryFromFirestore,
  fetchUsersFromFirestore,
  saveUserToFirestore,
  deleteUserFromFirestore,
} from './utils/firestoreSync';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { ProjectsView } from './components/ProjectsView';
import { DailyEntryView } from './components/DailyEntryView';
import { DashboardView } from './components/DashboardView';
import { WhatsAppReportView } from './components/WhatsAppReportView';
import { LoginView } from './components/LoginView';
import { UserManagementView } from './components/UserManagementView';
import { AboutModal } from './components/AboutModal';
import { PwaBanner } from './components/PwaBanner';

export default function App() {
  const [projects, setProjects] = useState<Project[]>(getStoredProjects());
  const [entries, setEntries] = useState<StaffEntry[]>(getStoredEntries());
  const [users, setUsers] = useState<User[]>(getStoredUsers());

  // Current logged in user (null by default requiring login)
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  const [activeTab, setActiveTab] = useState<ActiveTab>('daily-entry');
  const [selectedProjectIdForEntry, setSelectedProjectIdForEntry] = useState<string | undefined>(
    projects[0]?.id
  );

  // Theme: Dark by default
  const [darkMode, setDarkMode] = useState<boolean>(true);

  // Sync status with Firestore
  const [syncStatus, setSyncStatus] = useState<'synced' | 'offline'>('synced');

  // About Modal state
  const [isAboutOpen, setIsAboutOpen] = useState<boolean>(false);

  // Sync with Firestore on mount (with 30-minute TTL caching to drastically reduce Firestore read quota)
  useEffect(() => {
    const loadCloudData = async () => {
      const lastSync = localStorage.getItem('opstrack_last_sync_time');
      const now = Date.now();
      const CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes cache TTL

      if (lastSync && now - parseInt(lastSync, 10) < CACHE_TTL_MS) {
        // Skip Firestore reads to drastically reduce read quota usage
        setSyncStatus('synced');
        return;
      }

      try {
        const cloudProjects = await fetchProjectsFromFirestore();
        if (cloudProjects && cloudProjects.length > 0) {
          setProjects(cloudProjects);
          saveProjects(cloudProjects);
        }
        const cloudEntries = await fetchEntriesFromFirestore();
        if (cloudEntries && cloudEntries.length > 0) {
          setEntries(cloudEntries);
          saveEntries(cloudEntries);
        }
        const cloudUsers = await fetchUsersFromFirestore();
        if (cloudUsers && cloudUsers.length > 0) {
          const localUsers = getStoredUsers();
          const existingUsernames = new Set(cloudUsers.map((u) => u.username.toLowerCase()));
          const merged = [...cloudUsers];
          for (const u of localUsers) {
            if (!existingUsernames.has(u.username.toLowerCase())) {
              merged.push(u);
            }
          }
          setUsers(merged);
          saveUsers(merged);
        }
        localStorage.setItem('opstrack_last_sync_time', Date.now().toString());
        setSyncStatus('synced');
      } catch (e) {
        setSyncStatus('offline');
      }
    };
    loadCloudData();
  }, []);

  const handleSaveProject = async (updatedProj: Project) => {
    const exists = projects.some((p) => p.id === updatedProj.id);
    let newProjects: Project[];
    if (exists) {
      newProjects = projects.map((p) => (p.id === updatedProj.id ? updatedProj : p));
    } else {
      newProjects = [...projects, updatedProj];
    }
    setProjects(newProjects);
    saveProjects(newProjects);
    try {
      await saveProjectToFirestore(updatedProj);
      setSyncStatus('synced');
    } catch (e) {
      setSyncStatus('offline');
    }
  };

  const handleDeleteProject = async (projectId: string) => {
    const newProjects = projects.filter((p) => p.id !== projectId);
    setProjects(newProjects);
    saveProjects(newProjects);
    try {
      await deleteProjectFromFirestore(projectId);
      setSyncStatus('synced');
    } catch (e) {
      setSyncStatus('offline');
    }

    const newEntries = entries.filter((e) => e.projectId !== projectId);
    setEntries(newEntries);
    saveEntries(newEntries);
  };

  const handleAddEntry = async (newEntry: StaffEntry) => {
    const newEntries = [newEntry, ...entries];
    setEntries(newEntries);
    saveEntries(newEntries);
    try {
      await saveEntryToFirestore(newEntry);
      setSyncStatus('synced');
    } catch (e) {
      setSyncStatus('offline');
    }
  };

  const handleUpdateEntry = async (updatedEntry: StaffEntry) => {
    const newEntries = entries.map((e) => (e.id === updatedEntry.id ? updatedEntry : e));
    setEntries(newEntries);
    saveEntries(newEntries);
    try {
      await saveEntryToFirestore(updatedEntry);
      setSyncStatus('synced');
    } catch (e) {
      setSyncStatus('offline');
    }
  };

  const handleDeleteEntry = async (entryId: string) => {
    const newEntries = entries.filter((e) => e.id !== entryId);
    setEntries(newEntries);
    saveEntries(newEntries);
    try {
      await deleteEntryFromFirestore(entryId);
      setSyncStatus('synced');
    } catch (e) {
      setSyncStatus('offline');
    }
  };

  const handleSaveUser = async (newUser: User) => {
    const exists = users.some((u) => u.id === newUser.id);
    let newUsers: User[];
    if (exists) {
      newUsers = users.map((u) => (u.id === newUser.id ? newUser : u));
    } else {
      newUsers = [...users, newUser];
    }
    setUsers(newUsers);
    saveUsers(newUsers);
    try {
      await saveUserToFirestore(newUser);
      setSyncStatus('synced');
    } catch (e) {
      setSyncStatus('offline');
    }
  };

  const handleDeleteUser = async (userId: string) => {
    const newUsers = users.filter((u) => u.id !== userId);
    setUsers(newUsers);
    saveUsers(newUsers);
    try {
      await deleteUserFromFirestore(userId);
      setSyncStatus('synced');
    } catch (e) {
      setSyncStatus('offline');
    }
  };

  const handleResetData = () => {
    resetToDemoData();
    setProjects(getStoredProjects());
    setEntries(getStoredEntries());
    setUsers(getStoredUsers());
  };

  const handleNavigateToEntryWithProject = (projectId: string) => {
    setSelectedProjectIdForEntry(projectId);
    setActiveTab('daily-entry');
  };

  // If not logged in, show Login View
  if (!currentUser) {
    return (
      <>
        <LoginView
          users={users}
          onLogin={(user) => {
            setCurrentUser(user);
            setActiveTab('daily-entry');
          }}
          darkMode={darkMode}
        />
        <PwaBanner />
      </>
    );
  }

  return (
    <div
      className={`min-h-screen flex flex-col font-sans antialiased selection:bg-emerald-500 selection:text-white transition-colors duration-200 ${
        darkMode ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'
      }`}
    >
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onResetData={handleResetData}
        darkMode={darkMode}
        setDarkMode={setDarkMode}
        currentUser={currentUser}
        onLogout={() => setCurrentUser(null)}
        syncStatus={syncStatus}
      />

      <main className="flex-grow transition-all duration-200">
        {activeTab === 'daily-entry' && (
          <DailyEntryView
            projects={projects}
            entries={entries}
            onAddEntry={handleAddEntry}
            onDeleteEntry={handleDeleteEntry}
            onUpdateEntry={handleUpdateEntry}
            initialSelectedProjectId={selectedProjectIdForEntry}
            onNavigateToWhatsApp={() => setActiveTab('whatsapp-report')}
            currentUser={currentUser}
            darkMode={darkMode}
          />
        )}

        {activeTab === 'projects' && currentUser.role === 'super_admin' && (
          <ProjectsView
            projects={projects}
            onSaveProject={handleSaveProject}
            onDeleteProject={handleDeleteProject}
            onSelectProjectForEntry={handleNavigateToEntryWithProject}
            darkMode={darkMode}
          />
        )}

        {activeTab === 'dashboard' && (
          <DashboardView projects={projects} entries={entries} users={users} currentUser={currentUser} darkMode={darkMode} />
        )}

        {activeTab === 'whatsapp-report' && (
          <WhatsAppReportView projects={projects} entries={entries} currentUser={currentUser} darkMode={darkMode} />
        )}

        {activeTab === 'user-management' && currentUser.role === 'super_admin' && (
          <UserManagementView
            users={users}
            onSaveUser={handleSaveUser}
            onDeleteUser={handleDeleteUser}
            darkMode={darkMode}
          />
        )}
      </main>

      <Footer darkMode={darkMode} onOpenAbout={() => setIsAboutOpen(true)} />

      <AboutModal isOpen={isAboutOpen} onClose={() => setIsAboutOpen(false)} darkMode={darkMode} />

      <PwaBanner />
    </div>
  );
};
