import React, { useEffect } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export default function Toast({ message, type = 'info', onClose }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const icons = {
    success: <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />,
    error: <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />,
    info: <Info className="w-5 h-5 text-indigo-500 shrink-0" />
  };

  const borders = {
    success: 'border-emerald-500/30 bg-emerald-50/90 dark:bg-emerald-950/90 text-emerald-900 dark:text-emerald-100',
    error: 'border-rose-500/30 bg-rose-50/90 dark:bg-rose-950/90 text-rose-900 dark:text-rose-100',
    info: 'border-indigo-500/30 bg-indigo-50/90 dark:bg-indigo-950/90 text-indigo-900 dark:text-indigo-100'
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 max-w-md animate-bounce-in shadow-2xl rounded-2xl overflow-hidden">
      <div className={`p-4 border backdrop-blur-md flex items-center gap-3 ${borders[type] || borders.info}`}>
        {icons[type] || icons.info}
        <div className="flex-1 text-xs sm:text-sm font-medium">
          {message}
        </div>
        <button
          type="button"
          onClick={onClose}
          className="p-1 rounded-lg hover:bg-black/10 dark:hover:bg-white/10 transition"
        >
          <X className="w-4 h-4 opacity-70" />
        </button>
      </div>
    </div>
  );
}
