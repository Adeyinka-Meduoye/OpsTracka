import React from 'react';
import { Info, Sparkles } from 'lucide-react';

interface FooterProps {
  darkMode: boolean;
  onOpenAbout: () => void;
}

export const Footer: React.FC<FooterProps> = ({ darkMode, onOpenAbout }) => {
  return (
    <footer className={`${darkMode ? 'bg-slate-950 text-slate-400 border-slate-900' : 'bg-slate-50 text-slate-600 border-slate-200'} border-t py-6 px-4 sm:px-6 lg:px-8 mt-auto no-print`}>
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between text-xs gap-4 text-center md:text-left">
        <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
          <span className="font-bold tracking-tight text-emerald-500">OpsTracka</span>
          <span className="hidden sm:inline">·</span>
          <span className="w-full sm:w-auto">Digital Operations & WhatsApp Daily Reporting System</span>
          <span className="hidden sm:inline">·</span>
          <button
            onClick={onOpenAbout}
            className="text-emerald-400 hover:text-emerald-300 font-semibold inline-flex items-center space-x-1 transition-colors underline"
          >
            <Info className="w-3.5 h-3.5" />
            <span>About OpsTracka</span>
          </button>
        </div>

        <div className="flex items-center justify-center space-x-1 font-medium">
          <span>Developed by</span>
          <a
            href="https://www.clartech.xyz"
            target="_blank"
            rel="noopener noreferrer"
            className="text-emerald-400 hover:text-emerald-300 font-bold underline transition-colors inline-flex items-center space-x-1"
          >
            <span>Clartech AI Studio</span>
          </a>
        </div>
      </div>
    </footer>
  );
};
