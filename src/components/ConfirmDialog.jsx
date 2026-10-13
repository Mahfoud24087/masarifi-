import React from 'react';
import { useMasarifi } from '../context/MasarifiContext';
import { Trash2 } from 'lucide-react';

export default function ConfirmDialog() {
  const { confirmDialog, setConfirmDialog, t, isDark, isRTL } = useMasarifi();

  if (!confirmDialog) return null;

  const { title, message, onConfirm, onCancel } = confirmDialog;

  const handleCancel = () => {
    if (onCancel) onCancel();
    setConfirmDialog(null);
  };

  const handleConfirm = () => {
    if (onConfirm) onConfirm();
    setConfirmDialog(null);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm transition-opacity duration-200"
      dir={isRTL ? 'rtl' : 'ltr'}
      onClick={handleCancel}
    >
      <div
        className={`w-full max-w-sm rounded-3xl p-6 shadow-2xl transition-all transform duration-200 animate-in fade-in zoom-in-95 ${
          isDark
            ? 'bg-slate-800 text-slate-100 border border-slate-700'
            : 'bg-white text-slate-800 border border-slate-100'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3.5 mb-3.5">
          <div className="w-12 h-12 rounded-2xl bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400 flex items-center justify-center flex-shrink-0">
            <Trash2 size={22} strokeWidth={2} />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-bold truncate">
              {title || t('dashboard.deleteExpense')}
            </h3>
          </div>
        </div>

        <p className={`text-sm mb-6 leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
          {message || t('dashboard.deleteConfirm')}
        </p>

        <div className="flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={handleCancel}
            className={`px-4 py-2.5 rounded-xl font-medium text-sm transition-colors duration-150 ${
              isDark
                ? 'bg-slate-700 hover:bg-slate-600 text-slate-200'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            {t('common.cancel')}
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="px-5 py-2.5 rounded-xl font-medium text-sm text-white bg-red-600 hover:bg-red-700 shadow-md shadow-red-600/25 transition-all duration-150 hover:scale-[1.02] active:scale-[0.98]"
          >
            {t('common.delete')}
          </button>
        </div>
      </div>
    </div>
  );
}
