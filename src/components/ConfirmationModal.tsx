import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmationModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isDanger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  darkMode?: boolean;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  isDanger = false,
  onConfirm,
  onCancel,
  darkMode = true,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className={`${darkMode ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900 shadow-2xl'} border rounded-3xl max-w-md w-full p-6 md:p-8 relative animate-in fade-in zoom-in-95 duration-150`}>
        <button
          onClick={onCancel}
          className={`absolute top-5 right-5 p-2 rounded-xl transition-colors ${darkMode ? 'text-slate-400 hover:text-white bg-slate-800/50 hover:bg-slate-800' : 'text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200'}`}
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center space-x-3 mb-4">
          <div
            className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border ${
              isDanger
                ? 'bg-rose-500/20 border-rose-500/30 text-rose-400'
                : 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400'
            }`}
          >
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <h3 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>{title}</h3>
            <span className={`text-[11px] ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>Action Confirmation Required</span>
          </div>
        </div>

        <p className={`text-sm mb-6 leading-relaxed ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>{message}</p>

        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={onCancel}
            className={`px-5 py-2.5 rounded-xl border text-sm font-medium transition-colors ${darkMode ? 'border-slate-700 text-slate-300 hover:bg-slate-800' : 'border-slate-300 text-slate-700 hover:bg-slate-100'}`}
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`px-6 py-2.5 rounded-xl text-white text-sm font-semibold shadow transition-colors ${
              isDanger ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-600/20' : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20'
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};
