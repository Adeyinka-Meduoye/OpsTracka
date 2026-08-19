import React, { useState } from 'react';
import { Project, StaffEntry, User } from '../types';
import { MessageSquare, Copy, Check, Send, Shield, Calendar } from 'lucide-react';

interface WhatsAppReportViewProps {
  projects: Project[];
  entries: StaffEntry[];
  currentUser: User | null;
  darkMode?: boolean;
}

export const WhatsAppReportView: React.FC<WhatsAppReportViewProps> = ({
  projects,
  entries,
  currentUser,
  darkMode = true,
}) => {
  const isStaff = currentUser?.role === 'staff';
  const [copied, setCopied] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<string>(projects[0]?.id || '');
  
  // Date picker for past reports (e.g. if staff forgot to send on a particular day)
  const today = new Date().toISOString().split('T')[0];
  const [reportDate, setReportDate] = useState<string>(today);

  const currentProject = projects.find((p) => p.id === selectedProjectId) || projects[0];

  const projectEntries = entries.filter((e) => {
    if (e.projectId !== selectedProjectId) return false;
    if (e.date !== reportDate) return false;
    if (isStaff) {
      return e.staffName.toLowerCase() === currentUser.name.toLowerCase();
    }
    return true;
  });

  const totalBoxes = projectEntries.reduce((a, b) => a + b.boxes, 0);
  const totalFiles = projectEntries.reduce((a, b) => a + b.files, 0);
  const totalPages = projectEntries.reduce((a, b) => a + b.pages, 0);

  const staffAttributionText = isStaff ? `*Operator:* ${currentUser?.name}\n` : `*Total Submissions:* ${projectEntries.length} operators\n`;

  const reportText = `📋 *DIGITIZATION DAILY OPERATIONS REPORT*
*Project:* ${currentProject?.name || 'Project'}
*Client:* ${currentProject?.client || 'Client'}
*Date:* ${reportDate}
${staffAttributionText}
📦 *Boxes Processed:* ${totalBoxes}
📁 *Files Sorted/Scanned:* ${totalFiles}
📄 *Pages Scanned:* ${totalPages.toLocaleString()}

*Summary Remarks:*
All operations for ${reportDate} completed with rigorous quality control and verification.

_Generated via OpsTracka Enterprise_`;

  const handleCopy = () => {
    navigator.clipboard.writeText(reportText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleWhatsAppSend = () => {
    const encoded = encodeURIComponent(reportText);
    window.open(`https://wa.me/2348166771210?text=${encoded}`, '_blank');
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div className={`flex flex-col md:flex-row justify-between items-start md:items-center gap-4 ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'} border rounded-3xl p-6`}>
        <div>
          <h1 className={`text-2xl font-bold flex items-center ${darkMode ? 'text-white' : 'text-slate-900'}`}>
            <MessageSquare className="w-7 h-7 text-emerald-400 mr-3" />
            WhatsApp Daily Summary Report Generator
          </h1>
          <p className={`text-sm mt-1 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
            Select any past date to retrieve and share daily operational metrics via WhatsApp (+2348166771210).
          </p>
        </div>
        {isStaff && (
          <span className="text-xs bg-emerald-500/20 text-emerald-400 px-3 py-1.5 rounded-xl border border-emerald-500/30 font-semibold flex items-center">
            <Shield className="w-3.5 h-3.5 mr-1.5" /> Confidential Mode
          </span>
        )}
      </div>

      <div className={`${darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900 shadow-sm'} border rounded-3xl p-6 md:p-8 space-y-6`}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <label className={`block text-xs font-semibold uppercase tracking-wider mb-2 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
              Select Project for Report
            </label>
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
            <label className={`block text-xs font-semibold uppercase tracking-wider mb-2 flex items-center ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
              <Calendar className="w-4 h-4 mr-1 text-emerald-400" />
              <span>Report Date (Pick Past Date if Needed)</span>
            </label>
            <input
              type="date"
              value={reportDate}
              onChange={(e) => setReportDate(e.target.value)}
              className={`w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 ${darkMode ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-100 border-slate-300 text-slate-900'}`}
            />
          </div>
        </div>

        <div>
          <label className={`block text-xs font-semibold uppercase tracking-wider mb-2 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
            Generated WhatsApp Message Preview ({projectEntries.length} records found for {reportDate})
          </label>
          <div className={`p-5 rounded-2xl border font-mono text-xs whitespace-pre-line leading-relaxed ${darkMode ? 'bg-slate-950 border-slate-800 text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-800'}`}>
            {reportText}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4">
          <button
            onClick={handleCopy}
            className={`font-semibold px-6 py-3 rounded-xl transition-colors flex items-center justify-center space-x-2 text-sm border ${darkMode ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700' : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300'}`}
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? 'Copied to Clipboard!' : 'Copy Report Text'}</span>
          </button>

          <button
            onClick={handleWhatsAppSend}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-6 py-3 rounded-xl shadow-lg transition-colors flex items-center justify-center space-x-2 text-sm"
          >
            <Send className="w-4 h-4" />
            <span>Send to WhatsApp (+2348166771210)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
