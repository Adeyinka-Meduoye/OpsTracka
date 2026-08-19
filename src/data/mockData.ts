import { Project, StaffEntry } from '../types';

export const INITIAL_PROJECTS: Project[] = [
  {
    id: 'proj-1',
    name: 'Scanning Operations',
    client: 'National Archives & Records',
    description: 'Core document digitization workflow: Sorting -> Scanning -> Repackaging',
    createdAt: '2026-01-10',
    operations: [
      { id: 'op-sort', name: 'Sorting', description: 'Remove staples, separate documents and arrange/mark pages in correct order.', order: 1 },
      { id: 'op-scan', name: 'Scanning', description: 'Scan the documents and convert them into high-quality PDFs.', order: 2 },
      { id: 'op-repack', name: 'Repackaging', description: 'Put physical documents back together in correct order and return to storage.', order: 3 },
    ],
  },
  {
    id: 'proj-2',
    name: 'First Bank Vouchers',
    client: 'First Bank PLC',
    description: 'Branch voucher archiving and digital indexing project',
    createdAt: '2026-02-01',
    operations: [
      { id: 'fb-sort', name: 'Sorting', description: 'Sort branch vouchers by date and branch code.', order: 1 },
      { id: 'fb-slot', name: 'Slotting Vouchers', description: 'Slot vouchers into batch folders.', order: 2 },
      { id: 'fb-capture', name: 'Data Capture', description: 'Capture key metadata into indexing software.', order: 3 },
      { id: 'fb-box', name: 'Boxing', description: 'Box sorted and indexed vouchers securely.', order: 4 },
      { id: 'fb-index', name: 'Digital Indexing', description: 'Final QA and digital index validation.', order: 5 },
    ],
  },
];

const getTodayString = () => {
  const d = new Date();
  return d.toISOString().split('T')[0];
};

const getYesterdayString = () => {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().split('T')[0];
};

const today = getTodayString();
const yesterday = getYesterdayString();

export const INITIAL_ENTRIES: StaffEntry[] = [
  // Scanning Operations - Yesterday
  {
    id: 'ent-1',
    projectId: 'proj-1',
    operationId: 'op-sort',
    date: yesterday,
    staffName: 'Amina Bello',
    boxes: 2,
    files: 40,
    pages: 800,
    notes: 'Completed branch A financial records',
    createdAt: `${yesterday}T09:30:00Z`,
  },
  {
    id: 'ent-2',
    projectId: 'proj-1',
    operationId: 'op-sort',
    date: yesterday,
    staffName: 'Chidi Okafor',
    boxes: 3,
    files: 60,
    pages: 1200,
    notes: 'Handled legal correspondence batch',
    createdAt: `${yesterday}T10:15:00Z`,
  },
  {
    id: 'ent-3',
    projectId: 'proj-1',
    operationId: 'op-sort',
    date: yesterday,
    staffName: 'Oluwaseun Ade',
    boxes: 1,
    files: 20,
    pages: 400,
    notes: 'Partial batch after audit',
    createdAt: `${yesterday}T11:00:00Z`,
  },
  {
    id: 'ent-4',
    projectId: 'proj-1',
    operationId: 'op-scan',
    date: yesterday,
    staffName: 'Emmanuel Paul',
    boxes: 4,
    files: 80,
    pages: 1600,
    notes: 'High speed scanner #2 operations',
    createdAt: `${yesterday}T12:00:00Z`,
  },
  {
    id: 'ent-5',
    projectId: 'proj-1',
    operationId: 'op-scan',
    date: yesterday,
    staffName: 'Fatima Garba',
    boxes: 2,
    files: 40,
    pages: 800,
    notes: 'Flatbed scanner for fragile docs',
    createdAt: `${yesterday}T13:30:00Z`,
  },
  {
    id: 'ent-6',
    projectId: 'proj-1',
    operationId: 'op-repack',
    date: yesterday,
    staffName: 'Ibrahim Musa',
    boxes: 5,
    files: 100,
    pages: 2000,
    notes: 'Secured in acid-free archival boxes',
    createdAt: `${yesterday}T15:00:00Z`,
  },

  // Scanning Operations - Today
  {
    id: 'ent-7',
    projectId: 'proj-1',
    operationId: 'op-sort',
    date: today,
    staffName: 'Amina Bello',
    boxes: 3,
    files: 45,
    pages: 950,
    notes: 'Morning shift batch 1',
    createdAt: `${today}T08:45:00Z`,
  },
  {
    id: 'ent-8',
    projectId: 'proj-1',
    operationId: 'op-sort',
    date: today,
    staffName: 'Chidi Okafor',
    boxes: 2,
    files: 35,
    pages: 700,
    notes: 'Morning shift batch 2',
    createdAt: `${today}T09:10:00Z`,
  },
  {
    id: 'ent-9',
    projectId: 'proj-1',
    operationId: 'op-scan',
    date: today,
    staffName: 'Emmanuel Paul',
    boxes: 3,
    files: 50,
    pages: 1100,
    notes: 'Processed sorted batches from Amina & Chidi',
    createdAt: `${today}T11:20:00Z`,
  },

  // First Bank Vouchers - Today
  {
    id: 'ent-10',
    projectId: 'proj-2',
    operationId: 'fb-sort',
    date: today,
    staffName: 'Grace Ekanem',
    boxes: 4,
    files: 80,
    pages: 1600,
    notes: 'Ikeja Branch Q1 Vouchers',
    createdAt: `${today}T09:00:00Z`,
  },
  {
    id: 'ent-11',
    projectId: 'proj-2',
    operationId: 'fb-slot',
    date: today,
    staffName: 'Kelechi Udo',
    boxes: 3,
    files: 60,
    pages: 1200,
    notes: 'Slotting into binder folders',
    createdAt: `${today}T10:30:00Z`,
  },
  {
    id: 'ent-12',
    projectId: 'proj-2',
    operationId: 'fb-capture',
    date: today,
    staffName: 'Blessing Okon',
    boxes: 2,
    files: 40,
    pages: 800,
    notes: 'Data entry station 1',
    createdAt: `${today}T11:45:00Z`,
  },
];
