import React from 'react';
import { X, CheckCircle2 } from 'lucide-react';

interface AboutModalProps {
  isOpen: boolean;
  onClose: () => void;
  darkMode?: boolean;
}

export const AboutModal: React.FC<AboutModalProps> = ({ isOpen, onClose, darkMode = true }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className={`${darkMode ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900 shadow-2xl'} border rounded-3xl max-w-xl w-full p-8 relative max-h-[90vh] overflow-y-auto`}>
        <button
          onClick={onClose}
          className={`absolute top-5 right-5 p-2 rounded-xl ${darkMode ? 'text-slate-400 hover:text-white bg-slate-800' : 'text-slate-600 hover:text-slate-900 bg-slate-100'}`}
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center space-x-4 mb-6">
          <div className="w-14 h-14 rounded-2xl overflow-hidden border border-emerald-500/30 shadow-lg shadow-emerald-500/20 shrink-0">
            <img src="/logo.jpg" alt="OpsTracka Logo" className="w-full h-full object-cover" />
          </div>
          <div>
            <h3 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>About OpsTracka</h3>
            <span className="text-xs text-emerald-400 font-semibold">Enterprise Archival & Digitization Operations System</span>
          </div>
        </div>

        <div className="space-y-4 text-sm leading-relaxed">
          <p className={darkMode ? 'text-slate-300' : 'text-slate-700'}>
            <strong className="text-emerald-400">OpsTracka</strong> is a production-ready enterprise platform engineered specifically for tracking physical archive digitization workflows (sorting, scanning, indexing, and repackaging boxes, files, and pages).
          </p>

          <div className={`p-4 rounded-2xl border space-y-2.5 ${darkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
            <h4 className={`text-xs font-bold uppercase tracking-wider ${darkMode ? 'text-slate-200' : 'text-slate-800'}`}>Core Capabilities & Architecture</h4>
            <ul className={`space-y-2 text-xs ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
              <li className="flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span><strong>Role-Based Access Control (RBAC):</strong> Secure Super Admin and Staff Operator permissions with confidential personal logging.</span>
              </li>
              <li className="flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span><strong>Dynamic Operations Workflow:</strong> Fully customizable stage definitions per project with modal CRUD controls.</span>
              </li>
              <li className="flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span><strong>Advanced Analytics & Print Reports:</strong> Real-time charts, CSV exports, and browser print-ready summaries.</span>
              </li>
              <li className="flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span><strong>WhatsApp Summary Integration:</strong> Instant report generation for executive group updates (+2348166771210).</span>
              </li>
            </ul>
          </div>

          <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
            Developed by <span className="font-bold text-emerald-400">Clartech AI Studio</span>. Designed for maximum reliability with dual Firestore cloud synchronization and local storage offline fallback.
          </p>
        </div>

        <div className="mt-8 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm shadow transition-colors"
          >
            Got It
          </button>
        </div>
      </div>
    </div>
  );
};
