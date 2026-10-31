import React from 'react';
import { 
  Sparkles, 
  Sun, 
  Moon, 
  Database, 
  Plus
} from 'lucide-react';

export default function Navbar({ 
  darkMode, 
  setDarkMode, 
  onNewProposal, 
  onOpenSupabaseModal, 
  activeView 
}) {
  return (
    <header className="sticky top-0 z-40 w-full no-print">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 py-3">
        <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-md rounded-2xl px-4 sm:px-5 py-2.5 flex items-center justify-between border border-slate-200/80 dark:border-slate-800 shadow-sm transition">
          
          {/* Logo & Brand */}
          <div 
            onClick={onNewProposal}
            className="flex items-center gap-2.5 cursor-pointer group"
          >
            <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-sm shadow-indigo-600/30 group-hover:bg-indigo-500 transition">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-base sm:text-lg tracking-tight text-slate-900 dark:text-white">
                  Progen<span className="text-indigo-600 dark:text-indigo-400">AI</span>
                </span>
                <span className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-semibold rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                  Client Quotes
                </span>
              </div>
            </div>
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-2">
            
            {/* New Quote Shortcut */}
            {activeView === 'proposal' && (
              <button
                type="button"
                onClick={onNewProposal}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 transition shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>New Proposal</span>
              </button>
            )}

            {/* Saved Proposals Database trigger */}
            <button
              type="button"
              onClick={onOpenSupabaseModal}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-300 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 transition"
              title="Saved Proposals Database"
            >
              <Database className="w-3.5 h-3.5 text-indigo-500" />
              <span className="hidden sm:inline">Database</span>
            </button>

            {/* Dark / Light Mode Toggle */}
            <button
              type="button"
              onClick={() => setDarkMode(!darkMode)}
              className="p-2 rounded-xl text-slate-600 dark:text-slate-300 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 transition"
              title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {darkMode ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-slate-700" />
              )}
            </button>
          </div>

        </div>
      </div>
    </header>
  );
}
