import { Project, StaffEntry, User } from '../types';
import { INITIAL_PROJECTS, INITIAL_ENTRIES } from '../data/mockData';

const PROJECTS_KEY = 'opstrack_projects_v1';
const ENTRIES_KEY = 'opstrack_entries_v1';
const USERS_KEY = 'opstrack_users_v1';

const INITIAL_USERS: User[] = [
  {
    id: 'usr-1',
    name: 'Super Administrator',
    username: 'superadmin',
    password: 'admin123',
    role: 'super_admin',
    createdAt: '2026-01-01',
  },
  {
    id: 'usr-2',
    name: 'Amina Bello',
    username: 'amina',
    password: 'password123',
    role: 'staff',
    createdAt: '2026-02-01',
  },
  {
    id: 'usr-3',
    name: 'Chidi Okafor',
    username: 'chidi',
    password: 'password123',
    role: 'staff',
    createdAt: '2026-02-01',
  },
  {
    id: 'usr-4',
    name: 'Adeyinka Meduoye',
    username: 'medus',
    password: 'password123',
    role: 'staff',
    createdAt: '2026-02-15',
  },
];

export const getStoredProjects = (): Project[] => {
  try {
    const data = localStorage.getItem(PROJECTS_KEY);
    if (data) {
      const parsed = JSON.parse(data);
      const uniqueMap = new Map<string, Project>();
      for (const p of parsed) {
        if (p && p.id) uniqueMap.set(p.id, p);
      }
      return Array.from(uniqueMap.values());
    }
  } catch (e) {
    console.error('Failed to load projects from storage', e);
  }
  localStorage.setItem(PROJECTS_KEY, JSON.stringify(INITIAL_PROJECTS));
  return INITIAL_PROJECTS;
};

export const saveProjects = (projects: Project[]) => {
  const uniqueMap = new Map<string, Project>();
  for (const p of projects) {
    if (p && p.id) uniqueMap.set(p.id, p);
  }
  localStorage.setItem(PROJECTS_KEY, JSON.stringify(Array.from(uniqueMap.values())));
};

export const getStoredEntries = (): StaffEntry[] => {
  try {
    const data = localStorage.getItem(ENTRIES_KEY);
    if (data) {
      const parsed = JSON.parse(data);
      const uniqueMap = new Map<string, StaffEntry>();
      for (const e of parsed) {
        if (e && e.id) uniqueMap.set(e.id, e);
      }
      return Array.from(uniqueMap.values());
    }
  } catch (e) {
    console.error('Failed to load entries from storage', e);
  }
  localStorage.setItem(ENTRIES_KEY, JSON.stringify(INITIAL_ENTRIES));
  return INITIAL_ENTRIES;
};

export const saveEntries = (entries: StaffEntry[]) => {
  const uniqueMap = new Map<string, StaffEntry>();
  for (const e of entries) {
    if (e && e.id) uniqueMap.set(e.id, e);
  }
  localStorage.setItem(ENTRIES_KEY, JSON.stringify(Array.from(uniqueMap.values())));
};

export const getStoredUsers = (): User[] => {
  try {
    const data = localStorage.getItem(USERS_KEY);
    if (data) {
      const parsed: User[] = JSON.parse(data);
      const uniqueMap = new Map<string, User>();
      for (const u of parsed) {
        if (u && u.id && u.username) {
          uniqueMap.set(u.id, u);
        }
      }
      for (const defUser of INITIAL_USERS) {
        const existingByUsername = Array.from(uniqueMap.values()).some(
          (u) => u.username.toLowerCase() === defUser.username.toLowerCase()
        );
        if (!existingByUsername && !uniqueMap.has(defUser.id)) {
          uniqueMap.set(defUser.id, defUser);
        }
      }
      return Array.from(uniqueMap.values());
    }
  } catch (e) {
    console.error('Failed to load users from storage', e);
  }
  localStorage.setItem(USERS_KEY, JSON.stringify(INITIAL_USERS));
  return INITIAL_USERS;
};

export const saveUsers = (users: User[]) => {
  const uniqueMap = new Map<string, User>();
  for (const u of users) {
    if (u && u.id && u.username) {
      uniqueMap.set(u.id, u);
    }
  }
  localStorage.setItem(USERS_KEY, JSON.stringify(Array.from(uniqueMap.values())));
};

export const resetToDemoData = () => {
  localStorage.setItem(PROJECTS_KEY, JSON.stringify(INITIAL_PROJECTS));
  localStorage.setItem(ENTRIES_KEY, JSON.stringify(INITIAL_ENTRIES));
  localStorage.setItem(USERS_KEY, JSON.stringify(INITIAL_USERS));
};
