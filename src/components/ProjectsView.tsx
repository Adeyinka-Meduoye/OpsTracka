import React, { useState } from 'react';
import { Project, Operation, CustomField } from '../types';
import { Plus, Trash2, Edit, Eye, FolderKanban, ArrowRight, X, Check, Sliders } from 'lucide-react';
import { ConfirmationModal } from './ConfirmationModal';

interface ProjectsViewProps {
  projects: Project[];
  onSaveProject: (project: Project) => void;
  onDeleteProject: (projectId: string) => void;
  onSelectProjectForEntry: (projectId: string) => void;
  darkMode?: boolean;
}

export const ProjectsView: React.FC<ProjectsViewProps> = ({
  projects,
  onSaveProject,
  onDeleteProject,
  onSelectProjectForEntry,
  darkMode = true,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);

  const [name, setName] = useState('');
  const [client, setClient] = useState('');
  const [description, setDescription] = useState('');

  const [operations, setOperations] = useState<Operation[]>([
    { id: 'op-1', name: 'Sorting', description: 'Remove staples, separate documents and arrange/mark pages.', order: 1 },
    { id: 'op-2', name: 'Scanning', description: 'Scan the documents and convert them into PDFs.', order: 2 },
    { id: 'op-3', name: 'Repackaging', description: 'Put physical documents back together in correct order and return to storage.', order: 3 },
  ]);

  const [customFields, setCustomFields] = useState<CustomField[]>([]);

  // Operation Modal State
  const [isOperationModalOpen, setIsOperationModalOpen] = useState(false);
  const [editingOperation, setEditingOperation] = useState<Operation | null>(null);
  const [opModalName, setOpModalName] = useState('');
  const [opModalDesc, setOpModalDesc] = useState('');

  // Custom Field Modal State (CMS)
  const [isCustomFieldModalOpen, setIsCustomFieldModalOpen] = useState(false);
  const [editingCustomField, setEditingCustomField] = useState<CustomField | null>(null);
  const [cfLabel, setCfLabel] = useState('');
  const [cfType, setCfType] = useState<'text' | 'number'>('text');
  const [cfRequired, setCfRequired] = useState(false);

  const [pendingAction, setPendingAction] = useState<{
    type: 'create' | 'update' | 'delete' | 'delete_operation' | 'delete_custom_field' | 'view';
    title: string;
    message: string;
    isDanger?: boolean;
    data?: any;
  } | null>(null);

  const [viewingProject, setViewingProject] = useState<Project | null>(null);

  const handleOpenCreate = () => {
    setEditingProject(null);
    setName('');
    setClient('');
    setDescription('');
    setOperations([
      { id: 'op-1', name: 'Sorting', description: 'Remove staples, separate documents and arrange/mark pages.', order: 1 },
      { id: 'op-2', name: 'Scanning', description: 'Scan the documents and convert them into PDFs.', order: 2 },
      { id: 'op-3', name: 'Repackaging', description: 'Put physical documents back together in correct order and return to storage.', order: 3 },
    ]);
    setCustomFields([]);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (proj: Project) => {
    setEditingProject(proj);
    setName(proj.name || '');
    setClient(proj.client || '');
    setDescription(proj.description || '');
    setOperations(proj.operations || []);
    setCustomFields(proj.customFields || []);
    setIsModalOpen(true);
  };

  const handleOpenAddOperationModal = () => {
    setEditingOperation(null);
    setOpModalName('');
    setOpModalDesc('');
    setIsOperationModalOpen(true);
  };

  const handleOpenEditOperationModal = (op: Operation) => {
    setEditingOperation(op);
    setOpModalName(op.name);
    setOpModalDesc(op.description || '');
    setIsOperationModalOpen(true);
  };

  const handleSaveOperationModal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!opModalName.trim()) return;

    if (editingOperation) {
      setOperations(
        operations.map((o) =>
          o.id === editingOperation.id
            ? { ...o, name: opModalName.trim(), description: opModalDesc.trim() }
            : o
        )
      );
    } else {
      const newOp: Operation = {
        id: `op-${Date.now()}`,
        name: opModalName.trim(),
        description: opModalDesc.trim() || 'Standard digitization operation stage',
        order: operations.length + 1,
      };
      setOperations([...operations, newOp]);
    }
    setIsOperationModalOpen(false);
  };

  const handleOpenAddCustomField = () => {
    setEditingCustomField(null);
    setCfLabel('');
    setCfType('text');
    setCfRequired(false);
    setIsCustomFieldModalOpen(true);
  };

  const handleOpenEditCustomField = (cf: CustomField) => {
    setEditingCustomField(cf);
    setCfLabel(cf.label);
    setCfType(cf.type);
    setCfRequired(!!cf.required);
    setIsCustomFieldModalOpen(true);
  };

  const handleSaveCustomField = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cfLabel.trim()) return;

    if (editingCustomField) {
      setCustomFields(
        customFields.map((f) =>
          f.id === editingCustomField.id
            ? { ...f, label: cfLabel.trim(), type: cfType, required: cfRequired }
            : f
        )
      );
    } else {
      const newField: CustomField = {
        id: `cf-${Date.now()}`,
        label: cfLabel.trim(),
        type: cfType,
        required: cfRequired,
      };
      setCustomFields([...customFields, newField]);
    }
    setIsCustomFieldModalOpen(false);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !client.trim() || operations.length === 0) return;

    const proj: Project = {
      id: editingProject ? editingProject.id : `proj-${Date.now()}`,
      name: name.trim(),
      client: client.trim(),
      description: description.trim(),
      operations,
      customFields,
      createdAt: editingProject ? editingProject.createdAt : new Date().toISOString().split('T')[0],
    };

    setPendingAction({
      type: editingProject ? 'update' : 'create',
      title: editingProject ? 'Confirm Project Update' : 'Confirm Project Creation',
      message: `Are you sure you want to ${editingProject ? 'update' : 'create'} the digitization project "${proj.name}" with ${operations.length} operations and ${customFields.length} custom CMS fields?`,
      data: proj,
    });
  };

  const executeConfirmedAction = () => {
    if (!pendingAction) return;

    if (pendingAction.type === 'create' || pendingAction.type === 'update') {
      onSaveProject(pendingAction.data);
      setIsModalOpen(false);
    } else if (pendingAction.type === 'delete') {
      onDeleteProject(pendingAction.data);
    } else if (pendingAction.type === 'view') {
      // just confirmation modal dismissal
    }
    setPendingAction(null);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div className={`flex flex-col md:flex-row justify-between items-start md:items-center gap-4 ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'} border rounded-3xl p-6`}>
        <div>
          <h1 className={`text-2xl font-bold flex items-center ${darkMode ? 'text-white' : 'text-slate-900'}`}>
            <FolderKanban className="w-7 h-7 text-emerald-400 mr-3" />
            Digitization Projects & Operations Workflow
          </h1>
          <p className={`text-sm mt-1 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
            Super Admin control: Create projects and customize operational stages (sorting, scanning, indexing, repackaging, etc.) via dedicated modals.
          </p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium px-4 py-2.5 rounded-xl shadow transition-colors flex items-center space-x-2 text-sm"
        >
          <Plus className="w-4 h-4" />
          <span>New Project</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {projects.map((proj) => (
          <div
            key={proj.id}
            className={`${darkMode ? 'bg-slate-900 border-slate-800 text-white hover:border-slate-700' : 'bg-white border-slate-200 text-slate-900 shadow-sm hover:border-slate-300'} border rounded-3xl p-6 transition-all flex flex-col justify-between`}
          >
            <div>
              <div className="flex justify-between items-start mb-3">
                <span className="text-xs bg-emerald-500/20 text-emerald-400 font-semibold px-3 py-1 rounded-full border border-emerald-500/30">
                  {proj.client}
                </span>
                <div className="flex items-center space-x-1">
                  <button
                    onClick={() => {
                      setViewingProject(proj);
                      setPendingAction({
                        type: 'view',
                        title: 'Project Details',
                        message: `Viewing operations and configuration for "${proj.name}".`,
                        data: proj,
                      });
                    }}
                    className={`p-2 rounded-xl transition-colors ${darkMode ? 'text-slate-400 hover:text-white hover:bg-slate-800' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'}`}
                    title="View Details"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleOpenEdit(proj)}
                    className={`p-2 rounded-xl transition-colors ${darkMode ? 'text-slate-400 hover:text-amber-400 hover:bg-slate-800' : 'text-slate-600 hover:text-amber-600 hover:bg-slate-100'}`}
                    title="Edit Project & Operations"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() =>
                      setPendingAction({
                        type: 'delete',
                        title: 'Confirm Project Deletion',
                        message: `Are you sure you want to delete project "${proj.name}" and all associated daily entries? This action cannot be undone.`,
                        isDanger: true,
                        data: proj.id,
                      })
                    }
                    className={`p-2 rounded-xl transition-colors ${darkMode ? 'text-slate-400 hover:text-rose-400 hover:bg-slate-800' : 'text-slate-600 hover:text-rose-600 hover:bg-slate-100'}`}
                    title="Delete Project"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <h3 className={`text-lg font-bold mb-2 ${darkMode ? 'text-white' : 'text-slate-900'}`}>{proj.name}</h3>
              <p className={`text-xs line-clamp-2 mb-4 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>{proj.description}</p>

              <div className={`space-y-1.5 mb-6 p-3.5 rounded-2xl border ${darkMode ? 'bg-slate-950 border-slate-800/80 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700'}`}>
                <span className={`text-[10px] font-bold uppercase tracking-wider block mb-1 ${darkMode ? 'text-slate-500' : 'text-slate-500'}`}>
                  Custom Operations Workflow ({proj.operations?.length || 0})
                </span>
                {proj.operations?.map((op, idx) => (
                  <div key={op.id} className="text-xs flex items-center justify-between">
                    <span className={darkMode ? 'text-slate-300' : 'text-slate-800 font-medium'}>
                      {idx + 1}. {op.name}
                    </span>
                    <span className={`text-[10px] ${darkMode ? 'text-slate-500' : 'text-slate-500'}`}>Configured</span>
                  </div>
                ))}

                {proj.customFields && proj.customFields.length > 0 && (
                  <div className="pt-2 mt-2 border-t border-slate-800/60">
                    <span className="text-[10px] font-bold uppercase tracking-wider block mb-1 text-emerald-400">
                      CMS Custom Fields ({proj.customFields.length})
                    </span>
                    {proj.customFields.map((cf) => (
                      <div key={cf.id} className="text-[11px] flex items-center justify-between text-slate-400">
                        <span>• {cf.label}</span>
                        <span className="font-mono text-[9px] bg-slate-900 px-1.5 py-0.5 rounded">{cf.type}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <button
              onClick={() => onSelectProjectForEntry(proj.id)}
              className={`w-full font-semibold py-3 px-4 rounded-xl transition-colors text-xs flex items-center justify-center space-x-2 border ${darkMode ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700' : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300'}`}
            >
              <span>Log Entries for Project</span>
              <ArrowRight className="w-4 h-4 text-emerald-500" />
            </button>
          </div>
        ))}
      </div>

      {/* Create / Edit Project & Operations Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className={`${darkMode ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900 shadow-2xl'} border rounded-3xl max-w-2xl w-full p-8 relative max-h-[90vh] overflow-y-auto`}>
            <button
              onClick={() => setIsModalOpen(false)}
              className={`absolute top-5 right-5 p-2 rounded-xl ${darkMode ? 'text-slate-400 hover:text-white bg-slate-800' : 'text-slate-600 hover:text-slate-900 bg-slate-100'}`}
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className={`text-xl font-bold mb-4 ${darkMode ? 'text-white' : 'text-slate-900'}`}>
              {editingProject ? 'Edit Project & Operations Workflow' : 'Create Project & Operations Workflow'}
            </h3>

            <form onSubmit={handleFormSubmit} className="space-y-5">
              <div>
                <label className={`block text-xs font-semibold uppercase mb-1 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>Project Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Ministry of Land Archival Digitization"
                  className={`w-full border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 ${darkMode ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-100 border-slate-300 text-slate-900'}`}
                />
              </div>

              <div>
                <label className={`block text-xs font-semibold uppercase mb-1 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>Client Name / Department</label>
                <input
                  type="text"
                  required
                  value={client}
                  onChange={(e) => setClient(e.target.value)}
                  placeholder="e.g. Federal Ministry of Lands"
                  className={`w-full border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 ${darkMode ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-100 border-slate-300 text-slate-900'}`}
                />
              </div>

              <div>
                <label className={`block text-xs font-semibold uppercase mb-1 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>Description</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Brief project scope description..."
                  className={`w-full border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none ${darkMode ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-100 border-slate-300 text-slate-900'}`}
                />
              </div>

              {/* Operations Manager Section with Modal Trigger */}
              <div className="space-y-3 pt-2">
                <div className="flex justify-between items-center">
                  <label className={`text-xs font-bold uppercase tracking-wider ${darkMode ? 'text-slate-300' : 'text-slate-800'}`}>
                    Project Operations Workflow ({operations.length})
                  </label>
                  <button
                    type="button"
                    onClick={handleOpenAddOperationModal}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-3 py-1.5 rounded-xl flex items-center space-x-1 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Operation via Modal</span>
                  </button>
                </div>

                <div className={`p-4 rounded-2xl border space-y-3 ${darkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                  {operations.map((op, idx) => (
                    <div key={op.id} className={`p-3 rounded-xl border flex justify-between items-center ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                      <div className="space-y-0.5">
                        <span className="text-xs font-bold text-emerald-400">
                          {idx + 1}. {op.name}
                        </span>
                        <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>{op.description}</p>
                      </div>
                      <div className="flex items-center space-x-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleOpenEditOperationModal(op)}
                          className={`p-1.5 rounded-lg text-xs transition-colors ${darkMode ? 'text-slate-400 hover:text-amber-400 hover:bg-slate-800' : 'text-slate-600 hover:text-amber-600 hover:bg-slate-100'}`}
                          title="Update Operation"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        {operations.length > 1 && (
                          <button
                            type="button"
                            onClick={() => {
                              setPendingAction({
                                type: 'delete_operation',
                                title: 'Confirm Operation Deletion',
                                message: `Are you sure you want to remove operation "${op.name}" from this project?`,
                                isDanger: true,
                                data: op.id,
                              });
                            }}
                            className={`p-1.5 rounded-lg text-xs transition-colors ${darkMode ? 'text-slate-400 hover:text-rose-400 hover:bg-slate-800' : 'text-slate-600 hover:text-rose-600 hover:bg-slate-100'}`}
                            title="Delete Operation"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Custom Management System (CMS) - Additional Project Fields */}
              <div className="space-y-3 pt-4 border-t border-slate-800">
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-2">
                    <Sliders className="w-4 h-4 text-emerald-400" />
                    <label className={`text-xs font-bold uppercase tracking-wider ${darkMode ? 'text-slate-300' : 'text-slate-800'}`}>
                      Custom Management System (CMS) Fields ({customFields.length})
                    </label>
                  </div>
                  <button
                    type="button"
                    onClick={handleOpenAddCustomField}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-3 py-1.5 rounded-xl flex items-center space-x-1 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Custom Field</span>
                  </button>
                </div>
                <p className={`text-[11px] ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                  Add custom input fields (e.g. "Client Number", "Batch ID") that will automatically appear in the Daily Shift Output form for this project.
                </p>

                {customFields.length > 0 ? (
                  <div className={`p-4 rounded-2xl border space-y-3 ${darkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                    {customFields.map((cf) => (
                      <div key={cf.id} className={`p-3 rounded-xl border flex justify-between items-center ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                        <div className="space-y-0.5">
                          <div className="flex items-center space-x-2">
                            <span className="text-xs font-bold text-emerald-400">{cf.label}</span>
                            <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded uppercase font-mono">{cf.type}</span>
                            {cf.required && <span className="text-[10px] bg-rose-500/20 text-rose-400 px-2 py-0.5 rounded font-semibold">Required</span>}
                          </div>
                        </div>
                        <div className="flex items-center space-x-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleOpenEditCustomField(cf)}
                            className={`p-1.5 rounded-lg text-xs transition-colors ${darkMode ? 'text-slate-400 hover:text-amber-400 hover:bg-slate-800' : 'text-slate-600 hover:text-amber-600 hover:bg-slate-100'}`}
                            title="Edit Field"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setPendingAction({
                                type: 'delete_custom_field',
                                title: 'Confirm Custom Field Deletion',
                                message: `Are you sure you want to delete the custom field "${cf.label}" (${cf.type})?`,
                                isDanger: true,
                                data: cf.id,
                              });
                            }}
                            className={`p-1.5 rounded-lg text-xs transition-colors ${darkMode ? 'text-slate-400 hover:text-rose-400 hover:bg-slate-800' : 'text-slate-600 hover:text-rose-600 hover:bg-slate-100'}`}
                            title="Delete Field"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className={`p-4 rounded-2xl border text-center text-xs ${darkMode ? 'bg-slate-950/50 border-slate-800/50 text-slate-500' : 'bg-slate-50 border-slate-200 text-slate-400'}`}>
                    No custom CMS fields added yet. Click "Add Custom Field" to add extra inputs.
                  </div>
                )}
              </div>

              <div className="pt-4 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className={`px-5 py-2.5 rounded-xl border text-sm font-medium ${darkMode ? 'border-slate-700 text-slate-300 hover:bg-slate-800' : 'border-slate-300 text-slate-700 hover:bg-slate-100'}`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold shadow"
                >
                  {editingProject ? 'Save Changes' : 'Confirm & Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Operation Add / Update Modal Popup */}
      {isOperationModalOpen && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className={`${darkMode ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900 shadow-2xl'} border rounded-3xl max-w-md w-full p-8 relative`}>
            <button
              onClick={() => setIsOperationModalOpen(false)}
              className={`absolute top-5 right-5 p-2 rounded-xl ${darkMode ? 'text-slate-400 hover:text-white bg-slate-800' : 'text-slate-600 hover:text-slate-900 bg-slate-100'}`}
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className={`text-xl font-bold mb-4 ${darkMode ? 'text-white' : 'text-slate-900'}`}>
              {editingOperation ? 'Update Operation Stage' : 'Add New Operation Stage'}
            </h3>

            <form onSubmit={handleSaveOperationModal} className="space-y-4">
              <div>
                <label className={`block text-xs font-semibold uppercase mb-1 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>Operation Name</label>
                <input
                  type="text"
                  required
                  value={opModalName}
                  onChange={(e) => setOpModalName(e.target.value)}
                  placeholder="e.g. Quality Control Inspection"
                  className={`w-full border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 ${darkMode ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-100 border-slate-300 text-slate-900'}`}
                />
              </div>

              <div>
                <label className={`block text-xs font-semibold uppercase mb-1 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>Description</label>
                <textarea
                  rows={2}
                  value={opModalDesc}
                  onChange={(e) => setOpModalDesc(e.target.value)}
                  placeholder="Brief description of this operation..."
                  className={`w-full border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none ${darkMode ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-100 border-slate-300 text-slate-900'}`}
                />
              </div>

              <div className="pt-4 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsOperationModalOpen(false)}
                  className={`px-5 py-2.5 rounded-xl border text-sm font-medium ${darkMode ? 'border-slate-700 text-slate-300 hover:bg-slate-800' : 'border-slate-300 text-slate-700 hover:bg-slate-100'}`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold shadow"
                >
                  {editingOperation ? 'Save Operation' : 'Add Operation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Custom Field Add / Update Modal Popup */}
      {isCustomFieldModalOpen && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className={`${darkMode ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900 shadow-2xl'} border rounded-3xl max-w-md w-full p-8 relative`}>
            <button
              onClick={() => setIsCustomFieldModalOpen(false)}
              className={`absolute top-5 right-5 p-2 rounded-xl ${darkMode ? 'text-slate-400 hover:text-white bg-slate-800' : 'text-slate-600 hover:text-slate-900 bg-slate-100'}`}
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className={`text-xl font-bold mb-4 ${darkMode ? 'text-white' : 'text-slate-900'}`}>
              {editingCustomField ? 'Edit Custom CMS Field' : 'Add Custom CMS Field'}
            </h3>

            <form onSubmit={handleSaveCustomField} className="space-y-4">
              <div>
                <label className={`block text-xs font-semibold uppercase mb-1 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>Field Label / Name</label>
                <input
                  type="text"
                  required
                  value={cfLabel}
                  onChange={(e) => setCfLabel(e.target.value)}
                  placeholder="e.g. Client Number or Batch ID"
                  className={`w-full border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 ${darkMode ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-100 border-slate-300 text-slate-900'}`}
                />
              </div>

              <div>
                <label className={`block text-xs font-semibold uppercase mb-1 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>Field Input Type</label>
                <select
                  value={cfType}
                  onChange={(e) => setCfType(e.target.value as 'text' | 'number')}
                  className={`w-full border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 ${darkMode ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-100 border-slate-300 text-slate-900'}`}
                >
                  <option value="text">Text (Alphanumeric)</option>
                  <option value="number">Number</option>
                </select>
              </div>

              <div className="flex items-center space-x-3 pt-2">
                <input
                  type="checkbox"
                  id="cfRequiredCheckbox"
                  checked={cfRequired}
                  onChange={(e) => setCfRequired(e.target.checked)}
                  className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 bg-slate-950 border-slate-800"
                />
                <label htmlFor="cfRequiredCheckbox" className={`text-xs font-medium cursor-pointer ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                  Make this field required in Daily Shift Output form
                </label>
              </div>

              <div className="pt-4 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsCustomFieldModalOpen(false)}
                  className={`px-5 py-2.5 rounded-xl border text-sm font-medium ${darkMode ? 'border-slate-700 text-slate-300 hover:bg-slate-800' : 'border-slate-300 text-slate-700 hover:bg-slate-100'}`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold shadow"
                >
                  {editingCustomField ? 'Save Field' : 'Add Field'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Project Details Modal */}
      {viewingProject && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className={`${darkMode ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900 shadow-2xl'} border rounded-3xl max-w-lg w-full p-8 relative max-h-[90vh] overflow-y-auto`}>
            <button
              onClick={() => setViewingProject(null)}
              className={`absolute top-5 right-5 p-2 rounded-xl ${darkMode ? 'text-slate-400 hover:text-white bg-slate-800' : 'text-slate-600 hover:text-slate-900 bg-slate-100'}`}
            >
              <X className="w-5 h-5" />
            </button>
            <span className="text-xs bg-emerald-500/20 text-emerald-400 font-semibold px-3 py-1 rounded-full border border-emerald-500/30">
              {viewingProject.client}
            </span>
            <h3 className={`text-2xl font-bold mt-3 mb-2 ${darkMode ? 'text-white' : 'text-slate-900'}`}>{viewingProject.name}</h3>
            <p className={`text-sm mb-6 ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>{viewingProject.description}</p>

            <div className={`space-y-3 p-4 rounded-2xl border mb-6 ${darkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
              <h4 className={`text-xs font-bold uppercase tracking-wider ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>Configured Operations & Workflow</h4>
              {viewingProject.operations?.map((op, idx) => (
                <div key={op.id} className={`text-xs border-b pb-2 last:border-none ${darkMode ? 'text-slate-300 border-slate-800/60' : 'text-slate-700 border-slate-200'}`}>
                  <div className="font-semibold text-emerald-500">
                    {idx + 1}. {op.name}
                  </div>
                  <div className={`mt-0.5 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>{op.description}</div>
                </div>
              ))}
            </div>

            {viewingProject.customFields && viewingProject.customFields.length > 0 && (
              <div className={`space-y-3 p-4 rounded-2xl border mb-6 ${darkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                <h4 className={`text-xs font-bold uppercase tracking-wider text-emerald-400`}>Custom Management System (CMS) Fields</h4>
                {viewingProject.customFields.map((cf) => (
                  <div key={cf.id} className={`text-xs flex items-center justify-between border-b pb-2 last:border-none ${darkMode ? 'text-slate-300 border-slate-800/60' : 'text-slate-700 border-slate-200'}`}>
                    <span className="font-medium">{cf.label}</span>
                    <div className="flex items-center space-x-2">
                      <span className="font-mono text-[10px] bg-slate-800 px-2 py-0.5 rounded text-slate-300 uppercase">{cf.type}</span>
                      {cf.required && <span className="text-[10px] bg-rose-500/20 text-rose-400 px-2 py-0.5 rounded font-semibold">Required</span>}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="flex justify-end">
              <button
                onClick={() => setViewingProject(null)}
                className={`px-6 py-2.5 rounded-xl text-sm font-medium ${darkMode ? 'bg-slate-800 hover:bg-slate-700 text-white' : 'bg-slate-200 hover:bg-slate-300 text-slate-800'}`}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={!!pendingAction && pendingAction.type !== 'view'}
        title={pendingAction?.title || ''}
        message={pendingAction?.message || ''}
        confirmText={pendingAction?.type?.startsWith('delete') ? 'Delete' : 'Confirm'}
        isDanger={pendingAction?.isDanger}
        onConfirm={() => {
          if (pendingAction?.type === 'delete_custom_field') {
            setCustomFields(customFields.filter((f) => f.id !== pendingAction.data));
            setPendingAction(null);
          } else if (pendingAction?.type === 'delete_operation') {
            setOperations(operations.filter((o) => o.id !== pendingAction.data));
            setPendingAction(null);
          } else {
            executeConfirmedAction();
          }
        }}
        onCancel={() => setPendingAction(null)}
        darkMode={darkMode}
      />
    </div>
  );
};
