import { collection, getDocs, doc, setDoc, deleteDoc, query } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Project, StaffEntry, User } from '../types';

const PROJECTS_COLLECTION = 'opstrack_projects';
const ENTRIES_COLLECTION = 'opstrack_entries';
const USERS_COLLECTION = 'opstrack_users';

// Fast fail timeout wrapper (2 seconds) to prevent 10s Firestore connection hanging / warning spam in offline or restricted environments
const withTimeout = async <T>(promise: Promise<T>, ms = 2000): Promise<T> => {
  let timeoutId: any;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error('Firestore timeout')), ms);
  });
  try {
    const result = await Promise.race([promise, timeoutPromise]);
    clearTimeout(timeoutId);
    return result;
  } catch (err) {
    clearTimeout(timeoutId);
    throw err;
  }
};

export const fetchProjectsFromFirestore = async (): Promise<Project[] | null> => {
  try {
    const q = query(collection(db, PROJECTS_COLLECTION));
    const snapshot = await withTimeout(getDocs(q), 2000);
    if (snapshot.empty) return null;
    const items: Project[] = [];
    snapshot.forEach((docSnap) => {
      items.push(docSnap.data() as Project);
    });
    return items;
  } catch (e) {
    return null;
  }
};

export const saveProjectToFirestore = async (project: Project) => {
  try {
    await withTimeout(setDoc(doc(db, PROJECTS_COLLECTION, project.id), project), 2000);
  } catch (e) {}
};

export const deleteProjectFromFirestore = async (projectId: string) => {
  try {
    await withTimeout(deleteDoc(doc(db, PROJECTS_COLLECTION, projectId)), 2000);
  } catch (e) {}
};

export const fetchEntriesFromFirestore = async (): Promise<StaffEntry[] | null> => {
  try {
    const q = query(collection(db, ENTRIES_COLLECTION));
    const snapshot = await withTimeout(getDocs(q), 2000);
    if (snapshot.empty) return null;
    const items: StaffEntry[] = [];
    snapshot.forEach((docSnap) => {
      items.push(docSnap.data() as StaffEntry);
    });
    return items;
  } catch (e) {
    return null;
  }
};

export const saveEntryToFirestore = async (entry: StaffEntry) => {
  try {
    await withTimeout(setDoc(doc(db, ENTRIES_COLLECTION, entry.id), entry), 2000);
  } catch (e) {}
};

export const deleteEntryFromFirestore = async (entryId: string) => {
  try {
    await withTimeout(deleteDoc(doc(db, ENTRIES_COLLECTION, entryId)), 2000);
  } catch (e) {}
};

export const fetchUsersFromFirestore = async (): Promise<User[] | null> => {
  try {
    const q = query(collection(db, USERS_COLLECTION));
    const snapshot = await withTimeout(getDocs(q), 2000);
    if (snapshot.empty) return null;
    const items: User[] = [];
    snapshot.forEach((docSnap) => {
      items.push(docSnap.data() as User);
    });
    return items;
  } catch (e) {
    return null;
  }
};

export const saveUserToFirestore = async (user: User) => {
  try {
    await withTimeout(setDoc(doc(db, USERS_COLLECTION, user.id), user), 2000);
  } catch (e) {}
};

export const deleteUserFromFirestore = async (userId: string) => {
  try {
    await withTimeout(deleteDoc(doc(db, USERS_COLLECTION, userId)), 2000);
  } catch (e) {}
};
