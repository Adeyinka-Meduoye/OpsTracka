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
      return JSON.parse(data);
    }
  } catch (e) {
    console.error('Failed to load projects from storage', e);
  }
  localStorage.setItem(PROJECTS_KEY, JSON.stringify(INITIAL_PROJECTS));
  return INITIAL_PROJECTS;
};

export const saveProjects = (projects: Project[]) => {
  localStorage.setItem(PROJECTS_KEY, JSON.stringify(projects));
};

export const getStoredEntries = (): StaffEntry[] => {
  try {
    const data = localStorage.getItem(ENTRIES_KEY);
    if (data) {
      return JSON.parse(data);
    }
  } catch (e) {
    console.error('Failed to load entries from storage', e);
  }
  localStorage.setItem(ENTRIES_KEY, JSON.stringify(INITIAL_ENTRIES));
  return INITIAL_ENTRIES;
};

export const saveEntries = (entries: StaffEntry[]) => {
  localStorage.setItem(ENTRIES_KEY, JSON.stringify(entries));
};

export const getStoredUsers = (): User[] => {
  try {
    const data = localStorage.getItem(USERS_KEY);
    if (data) {
      const parsed: User[] = JSON.parse(data);
      const existingUsernames = new Set(parsed.map((u) => u.username.toLowerCase()));
      const merged = [...parsed];
      for (const defUser of INITIAL_USERS) {
        if (!existingUsernames.has(defUser.username.toLowerCase())) {
          merged.push(defUser);
        }
      }
      return merged;
    }
  } catch (e) {
    console.error('Failed to load users from storage', e);
  }
  localStorage.setItem(USERS_KEY, JSON.stringify(INITIAL_USERS));
  return INITIAL_USERS;
};

export const saveUsers = (users: User[]) => {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
};

export const resetToDemoData = () => {
  localStorage.setItem(PROJECTS_KEY, JSON.stringify(INITIAL_PROJECTS));
  localStorage.setItem(ENTRIES_KEY, JSON.stringify(INITIAL_ENTRIES));
  localStorage.setItem(USERS_KEY, JSON.stringify(INITIAL_USERS));
};
