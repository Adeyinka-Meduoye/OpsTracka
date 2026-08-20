import React, { useState, useEffect } from 'react';
import { Project, StaffEntry, User } from '../types';
import { Plus, Trash2, Edit, Eye, FileSpreadsheet, Package, FileText, BookOpen, ArrowRight, X, Search } from 'lucide-react';
import { exportEntriesToCSV } from '../utils/exportCsv';
import { ConfirmationModal } from './ConfirmationModal';
import { motion, AnimatePresence } from 'motion/react';

interface DailyEntryViewProps {
  projects: Project[];
  entries: StaffEntry[];
  onAddEntry: (entry: StaffEntry) => void;
  onDeleteEntry: (entryId: string) => void;
  onUpdateEntry: (entry: StaffEntry) => void;
  initialSelectedProjectId?: string;
  onNavigateToWhatsApp: () => void;
  currentUser: User | null;
  darkMode?: boolean;
}

export const DailyEntryView: React.FC<DailyEntryViewProps> = ({
  projects,
  entries,
  onAddEntry,
  onDeleteEntry,
  onUpdateEntry,
  initialSelectedProjectId,
  onNavigateToWhatsApp,
  currentUser,
  darkMode = true,
}) => {
  const [selectedProjectId, setSelectedProjectId] = useState<string>(
    initialSelectedProjectId || projects[0]?.id || ''
  );

  const currentProject = projects.find((p) => p.id === selectedProjectId) || projects[0];
  const operations = currentProject?.operations || [];

  const [operationId, setOperationId] = useState<string>(operations[0]?.id || '');
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  
  // Staff / Team Member name is now UNLOCKED and fully editable for self or subordinates
  const [staffName, setStaffName] = useState<string>(currentUser?.name || '');

  const [boxes, setBoxes] = useState<string>('');
  const [files, setFiles] = useState<string>('');
  const [pages, setPages] = useState<string>('');
  const [notes, setNotes] = useState<string>('');

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [editingEntryId, setEditingEntryId] = useState<string | null>(null);

  const autoSaveKey = `opstrack_draft_${selectedProjectId}_${currentUser?.username || 'user'}`;

  useEffect(() => {
    if (operations.length > 0 && !operations.some((o) => o.id === operationId)) {
      setOperationId(operations[0].id);
    }
    const savedDraft = localStorage.getItem(autoSaveKey);
    if (savedDraft) {
      try {
        const draft = JSON.parse(savedDraft);
        if (draft.boxes !== undefined) setBoxes(draft.boxes);
        if (draft.files !== undefined) setFiles(draft.files);
        if (draft.pages !== undefined) setPages(draft.pages);
        if (draft.notes !== undefined) setNotes(draft.notes);
        if (draft.staffName !== undefined) setStaffName(draft.staffName);
      } catch (e) {}
    }
  }, [selectedProjectId]);

  useEffect(() => {
    const draft = { staffName, boxes, files, pages, notes };
    localStorage.setItem(autoSaveKey, JSON.stringify(draft));
  }, [staffName, boxes, files, pages, notes, autoSaveKey]);

  const [pendingAction, setPendingAction] = useState<{
    type: 'create' | 'update' | 'delete' | 'view';
    title: string;
    message: string;
    isDanger?: boolean;
    data?: any;
  } | null>(null);

  const [viewingEntry, setViewingEntry] = useState<StaffEntry | null>(null);

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalStaffName = staffName.trim() || currentUser?.name || 'Team Lead';
    if (!finalStaffName || !boxes || !files || !pages) return;

    const entryData: StaffEntry = {
      id: editingEntryId ? editingEntryId : `entry-${Date.now()}`,
      projectId: selectedProjectId,
      operationId,
      date,
      staffName: finalStaffName,
      boxes: parseInt(boxes) || 0,
      files: parseInt(files) || 0,
      pages: parseInt(pages) || 0,
      notes: notes.trim(),
      createdAt: new Date().toISOString(),
    };

    setPendingAction({
      type: editingEntryId ? 'update' : 'create',
      title: editingEntryId ? 'Confirm Entry Update' : 'Confirm Daily Entry Submission',
      message: `Are you sure you want to ${editingEntryId ? 'update' : 'submit'} this record for ${finalStaffName} (${boxes} boxes, ${files} files, ${pages} pages)?`,
      data: entryData,
    });
  };

  const executeConfirmedAction = () => {
    if (!pendingAction) return;

    if (pendingAction.type === 'create') {
      onAddEntry(pendingAction.data);
      localStorage.removeItem(autoSaveKey);
      setBoxes('');
      setFiles('');
      setPages('');
      setNotes('');
    } else if (pendingAction.type === 'update') {
      onUpdateEntry(pendingAction.data);
      setEditingEntryId(null);
      setBoxes('');
      setFiles('');
      setPages('');
      setNotes('');
    } else if (pendingAction.type === 'delete') {
      onDeleteEntry(pendingAction.data);
    }
    setPendingAction(null);
  };

  const handleEditClick = (ent: StaffEntry) => {
    setEditingEntryId(ent.id);
    setSelectedProjectId(ent.projectId);
    setOperationId(ent.operationId);
    setDate(ent.date);
    setStaffName(ent.staffName);
    setBoxes(ent.boxes.toString());
    setFiles(ent.files.toString());
    setPages(ent.pages.toString());
    setNotes(ent.notes || '');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const projectEntries = entries.filter((e) => {
    if (e.projectId !== selectedProjectId) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchesStaff = e.staffName.toLowerCase().includes(q);
      const matchesNotes = (e.notes || '').toLowerCase().includes(q);
      const matchesDate = e.date.toLowerCase().includes(q);
      if (!matchesStaff && !matchesNotes && !matchesDate) return false;
    }
    return true;
  });

  const totalBoxes = projectEntries.reduce((a, b) => a + b.boxes, 0);
  const totalFiles = projectEntries.reduce((a, b) => a + b.files, 0);
  const totalPages = projectEntries.reduce((a, b) => a + b.pages, 0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div className={`flex flex-col md:flex-row justify-between items-start md:items-center gap-4 ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'} border rounded-3xl p-6`}>
        <div>
          <h1 className={`text-2xl font-bold flex items-center ${darkMode ? 'text-white' : 'text-slate-900'}`}>
            <Package className="w-7 h-7 text-emerald-400 mr-3" />
            Digitization Daily Operations & Team Lead Log
          </h1>
          <p className={`text-sm mt-1 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
            {currentUser?.role === 'staff'
              ? 'Team Lead Mode: Freely record operational throughput and submissions for yourself or your team subordinates.'
              : `Welcome ${currentUser?.name} (Super Admin): Recording operational boxes, files, and pages.`}
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => exportEntriesToCSV(projectEntries, projects, `${currentProject?.name}_entries.csv`)}
            className={`font-medium px-4 py-2.5 rounded-xl transition-colors flex items-center space-x-2 text-sm border ${darkMode ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700' : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300'}`}
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-500" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={onNavigateToWhatsApp}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium px-4 py-2.5 rounded-xl shadow transition-colors flex items-center space-x-2 text-sm"
          >
            <span>WhatsApp Report</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className={`${darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900 shadow-sm'} border rounded-3xl p-6 flex items-center space-x-4`}>
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
            <Package className="w-6 h-6" />
          </div>
          <div>
            <span className={`text-xs font-semibold uppercase tracking-wider ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>Total Boxes</span>
            <h3 className={`text-2xl font-bold mt-1 ${darkMode ? 'text-white' : 'text-slate-900'}`}>{totalBoxes}</h3>
          </div>
        </div>

        <div className={`${darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900 shadow-sm'} border rounded-3xl p-6 flex items-center space-x-4`}>
          <div className="w-12 h-12 rounded-2xl bg-blue-500/20 text-blue-400 border border-blue-500/30 flex items-center justify-center">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <span className={`text-xs font-semibold uppercase tracking-wider ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>Total Files</span>
            <h3 className={`text-2xl font-bold mt-1 ${darkMode ? 'text-white' : 'text-slate-900'}`}>{totalFiles}</h3>
          </div>
        </div>

        <div className={`${darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900 shadow-sm'} border rounded-3xl p-6 flex items-center space-x-4`}>
          <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <span className={`text-xs font-semibold uppercase tracking-wider ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>Total Pages Scanned</span>
            <h3 className={`text-2xl font-bold mt-1 ${darkMode ? 'text-white' : 'text-slate-900'}`}>{totalPages.toLocaleString()}</h3>
          </div>
        </div>
      </div>

      {/* Entry Form */}
      <div className={`${darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900 shadow-sm'} border rounded-3xl p-6 md:p-8`}>
        <div className="flex justify-between items-center mb-6">
          <h3 className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>
            {editingEntryId ? 'Edit Daily Shift Record' : 'Record New Daily Shift Output'}
          </h3>
          {editingEntryId && (
            <button
              onClick={() => {
                setEditingEntryId(null);
                setBoxes('');
                setFiles('');
                setPages('');
                setNotes('');
              }}
              className="text-xs text-rose-400 hover:underline"
            >
              Cancel Edit
            </button>
          )}
        </div>

        <form onSubmit={handleFormSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div>
            <label className={`block text-xs font-semibold uppercase tracking-wider mb-2 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>Project</label>
            <select
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className={`w-full border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 ${darkMode ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-100 border-slate-300 text-slate-900'}`}
            >
              {projects.map((p) => (
                <option key={p.id} value={p.id} className={darkMode ? 'bg-slate-900 text-white' : 'bg-white text-slate-900'}>
                  {p.name} ({p.client})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className={`block text-xs font-semibold uppercase tracking-wider mb-2 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>Operation Stage</label>
            <select
              value={operationId}
              onChange={(e) => setOperationId(e.target.value)}
              className={`w-full border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 ${darkMode ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-100 border-slate-300 text-slate-900'}`}
            >
              {operations.map((op) => (
                <option key={op.id} value={op.id} className={darkMode ? 'bg-slate-900 text-white' : 'bg-white text-slate-900'}>
                  {op.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className={`block text-xs font-semibold uppercase tracking-wider mb-2 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>Date</label>
            <input
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className={`w-full border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 ${darkMode ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-100 border-slate-300 text-slate-900'}`}
            />
          </div>

          <div>
            <label className={`block text-xs font-semibold uppercase tracking-wider mb-2 flex items-center justify-between ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
              <span>Staff / Team Member Name (Editable)</span>
              <span className="text-[10px] text-emerald-400 font-medium">Type any name freely</span>
            </label>
            <input
              type="text"
              required
              value={staffName}
              onChange={(e) => setStaffName(e.target.value)}
              placeholder="Enter staff or subordinate name"
              className={`w-full border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 ${darkMode ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-100 border-slate-300 text-slate-900'}`}
            />
          </div>

          <div>
            <label className={`block text-xs font-semibold uppercase tracking-wider mb-2 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>Number of Boxes</label>
            <input
              type="number"
              min="0"
              required
              value={boxes}
              onChange={(e) => setBoxes(e.target.value)}
              placeholder="e.g. 5"
              className={`w-full border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 ${darkMode ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-100 border-slate-300 text-slate-900'}`}
            />
          </div>

          <div>
            <label className={`block text-xs font-semibold uppercase tracking-wider mb-2 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>Number of Files</label>
            <input
              type="number"
              min="0"
              required
              value={files}
              onChange={(e) => setFiles(e.target.value)}
              placeholder="e.g. 100"
              className={`w-full border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 ${darkMode ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-100 border-slate-300 text-slate-900'}`}
            />
          </div>

          <div>
            <label className={`block text-xs font-semibold uppercase tracking-wider mb-2 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>Number of Pages</label>
            <input
              type="number"
              min="0"
              required
              value={pages}
              onChange={(e) => setPages(e.target.value)}
              placeholder="e.g. 1000"
              className={`w-full border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 ${darkMode ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-100 border-slate-300 text-slate-900'}`}
            />
          </div>

          <div className="md:col-span-2">
            <label className={`block text-xs font-semibold uppercase tracking-wider mb-2 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>Notes / Remarks</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Optional remarks e.g. all documents stapled and indexed"
              className={`w-full border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 ${darkMode ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-100 border-slate-300 text-slate-900'}`}
            />
          </div>

          <div className="flex items-end">
            <button
              type="submit"
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3.5 px-6 rounded-xl shadow-lg transition-colors text-sm"
            >
              {editingEntryId ? 'Save Changes' : 'Submit Daily Entry'}
            </button>
          </div>
        </form>
      </div>

      {/* Entries Table with Framer Motion entrance animations */}
      <div className={`${darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900 shadow-sm'} border rounded-3xl p-6 space-y-4`}>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <h3 className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>
            Recorded Logs for {currentProject?.name} ({projectEntries.length})
          </h3>

          {/* Search Input for Record Management */}
          <div className="relative w-full md:w-72">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by staff, notes, or date..."
              className={`w-full border rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 pl-10 ${darkMode ? 'bg-slate-950 border-slate-800 text-white placeholder-slate-500' : 'bg-slate-100 border-slate-300 text-slate-900 placeholder-slate-400'}`}
            />
            <Search className={`w-4 h-4 absolute left-3 top-3 ${darkMode ? 'text-slate-500' : 'text-slate-400'}`} />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className={`w-full text-left text-sm ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
            <thead className={`uppercase text-xs border-b ${darkMode ? 'bg-slate-950 text-slate-400 border-slate-800' : 'bg-slate-100 text-slate-700 border-slate-200'}`}>
              <tr>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Operation</th>
                <th className="px-4 py-3">Staff</th>
                <th className="px-4 py-3">Boxes</th>
                <th className="px-4 py-3">Files</th>
                <th className="px-4 py-3">Pages</th>
                <th className="px-4 py-3">Notes</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${darkMode ? 'divide-slate-800/60' : 'divide-slate-200'}`}>
              {projectEntries.length === 0 ? (
                <tr>
                  <td colSpan={8} className={`text-center py-8 ${darkMode ? 'text-slate-500' : 'text-slate-500'}`}>
                    {searchQuery ? 'No entries match your search query.' : 'No entries recorded yet for this project.'}
                  </td>
                </tr>
              ) : (
                <AnimatePresence>
                  {projectEntries.map((ent, idx) => {
                    const op = operations.find((o) => o.id === ent.operationId);
                    return (
                      <motion.tr
                        key={ent.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2, delay: idx * 0.02 }}
                        className={darkMode ? 'hover:bg-slate-800/45 transition-colors' : 'hover:bg-slate-50 transition-colors'}
                      >
                        <td className={`px-4 py-3.5 whitespace-nowrap ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>{ent.date}</td>
                        <td className="px-4 py-3.5 font-semibold text-emerald-500">{op?.name || 'Operation'}</td>
                        <td className={`px-4 py-3.5 font-medium ${darkMode ? 'text-white' : 'text-slate-900'}`}>{ent.staffName}</td>
                        <td className="px-4 py-3.5">{ent.boxes}</td>
                        <td className="px-4 py-3.5">{ent.files}</td>
                        <td className={`px-4 py-3.5 font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>{ent.pages.toLocaleString()}</td>
                        <td className={`px-4 py-3.5 truncate max-w-xs ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>{ent.notes || '—'}</td>
                        <td className="px-4 py-3.5 text-right space-x-1">
                          <button
                            onClick={() => setViewingEntry(ent)}
                            className={`p-1.5 rounded-lg transition-colors ${darkMode ? 'text-slate-400 hover:text-white hover:bg-slate-800' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'}`}
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleEditClick(ent)}
                            className={`p-1.5 rounded-lg transition-colors ${darkMode ? 'text-slate-400 hover:text-amber-400 hover:bg-slate-800' : 'text-slate-600 hover:text-amber-600 hover:bg-slate-100'}`}
                            title="Edit Entry"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() =>
                              setPendingAction({
                                type: 'delete',
                                title: 'Confirm Deletion',
                                message: `Are you sure you want to delete this log entry by ${ent.staffName}?`,
                                isDanger: true,
                                data: ent.id,
                              })
                            }
                            className={`p-1.5 rounded-lg transition-colors ${darkMode ? 'text-slate-400 hover:text-rose-400 hover:bg-slate-800' : 'text-slate-600 hover:text-rose-600 hover:bg-slate-100'}`}
                            title="Delete Entry"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </motion.tr>
                    );
                  })}
                </AnimatePresence>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* View Entry Details Modal */}
      {viewingEntry && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className={`${darkMode ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900 shadow-2xl'} border rounded-3xl max-w-md w-full p-8 relative`}>
            <button
              onClick={() => setViewingEntry(null)}
              className={`absolute top-5 right-5 p-2 rounded-xl ${darkMode ? 'text-slate-400 hover:text-white bg-slate-800' : 'text-slate-600 hover:text-slate-900 bg-slate-100'}`}
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className={`text-xl font-bold mb-4 ${darkMode ? 'text-white' : 'text-slate-900'}`}>Shift Entry Details</h3>
            <div className={`space-y-3 p-4 rounded-2xl border text-sm ${darkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
              <div className="flex justify-between">
                <span className={darkMode ? 'text-slate-400' : 'text-slate-600'}>Date:</span>
                <span className={`font-semibold ${darkMode ? 'text-white' : 'text-slate-900'}`}>{viewingEntry.date}</span>
              </div>
              <div className="flex justify-between">
                <span className={darkMode ? 'text-slate-400' : 'text-slate-600'}>Staff Name:</span>
                <span className={`font-semibold ${darkMode ? 'text-white' : 'text-slate-900'}`}>{viewingEntry.staffName}</span>
              </div>
              <div className="flex justify-between">
                <span className={darkMode ? 'text-slate-400' : 'text-slate-600'}>Boxes:</span>
                <span className="font-semibold text-emerald-500">{viewingEntry.boxes}</span>
              </div>
              <div className="flex justify-between">
                <span className={darkMode ? 'text-slate-400' : 'text-slate-600'}>Files:</span>
                <span className="font-semibold text-emerald-500">{viewingEntry.files}</span>
              </div>
              <div className="flex justify-between">
                <span className={darkMode ? 'text-slate-400' : 'text-slate-600'}>Pages:</span>
                <span className="font-semibold text-emerald-500">{viewingEntry.pages.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className={darkMode ? 'text-slate-400' : 'text-slate-600'}>Notes:</span>
                <span className={darkMode ? 'text-slate-300' : 'text-slate-800'}>{viewingEntry.notes || 'None'}</span>
              </div>
            </div>
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setViewingEntry(null)}
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
