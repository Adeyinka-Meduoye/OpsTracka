export interface Operation {
  id: string;
  name: string;
  description?: string;
  order: number;
}

export interface CustomField {
  id: string;
  label: string;
  type: 'text' | 'number';
  required?: boolean;
}

export interface Project {
  id: string;
  name: string;
  client: string;
  description: string;
  operations: Operation[];
  customFields?: CustomField[];
  createdAt: string;
}

export interface StaffEntry {
  id: string;
  projectId: string;
  operationId: string;
  date: string; // YYYY-MM-DD
  staffName: string;
  boxes: number;
  files: number;
  pages: number;
  notes?: string;
  customFieldValues?: Record<string, string | number>;
  createdAt: string;
}

export interface User {
  id: string;
  name: string;
  username: string;
  password?: string;
  role: 'super_admin' | 'staff';
  createdAt: string;
}

export type ActiveTab = 'projects' | 'daily-entry' | 'dashboard' | 'whatsapp-report' | 'user-management';
