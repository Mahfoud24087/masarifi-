import React, { useMemo } from 'react';
import { useMasarifi } from '../context/MasarifiContext';
import CategoryBadge from './CategoryBadge';
import { Pencil, Trash2 } from 'lucide-react';

export default function ExpenseTile({ expense, onEdit, onDelete }) {
  const { t, lang, isRTL, isDark } = useMasarifi();

  const formattedDate = useMemo(() => {
    if (!expense?.date) return '';
    try {
      const d = new Date(expense.date);
      const locale = lang === 'ar' ? 'ar-u-nu-latn' : lang === 'fr' ? 'fr-FR' : 'en-US';
      return d.toLocaleDateString(locale, {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return expense.date;
    }
  }, [expense?.date, lang]);

  const categoryLabel = t(`categories.${expense.category}`) || expense.category;
  const amountFormatted = Number(expense.amount || 0).toLocaleString('en-US');

  return (
    <div
      dir={isRTL ? 'rtl' : 'ltr'}
      className={`group flex items-center justify-between p-3.5 sm:p-4 rounded-2xl border transition-all duration-200 hover:shadow-md ${
        isDark
          ? 'bg-slate-800/90 hover:bg-slate-800 border-slate-700/60 text-slate-100'
          : 'bg-white hover:bg-slate-50/80 border-slate-100 text-slate-800 shadow-sm'
      }`}
    >
      {/* Left / Start: Badge & Title / Info */}
      <div className="flex items-center gap-3.5 min-w-0 flex-1">
        <CategoryBadge categoryId={expense.category} size="md" />

        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-sm sm:text-base truncate leading-snug">
            {expense.title}
          </h4>
          <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-500 dark:text-slate-400">
            <span className="font-medium text-emerald-600 dark:text-emerald-400">
              {categoryLabel}
            </span>
            <span>•</span>
            <span>{formattedDate}</span>
          </div>
        </div>
      </div>

      {/* Right / End: Amount & Actions */}
      <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
        <div className="text-end">
          <div className="font-bold text-sm sm:text-base text-red-500 dark:text-red-400">
            -{amountFormatted}
          </div>
          <div className="text-[11px] text-slate-400 dark:text-slate-500">
            {t('common.currency')}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onEdit && onEdit(expense)}
            title={t('common.edit')}
            className={`p-1.5 sm:p-2 rounded-xl transition-colors duration-150 ${
              isDark
                ? 'text-slate-400 hover:text-emerald-400 hover:bg-slate-700'
                : 'text-slate-400 hover:text-emerald-600 hover:bg-emerald-50'
            }`}
          >
            <Pencil size={15} strokeWidth={2} />
          </button>
          <button
            type="button"
            onClick={() => onDelete && onDelete(expense)}
            title={t('common.delete')}
            className={`p-1.5 sm:p-2 rounded-xl transition-colors duration-150 ${
              isDark
                ? 'text-slate-400 hover:text-red-400 hover:bg-slate-700'
                : 'text-slate-400 hover:text-red-600 hover:bg-red-50'
            }`}
          >
            <Trash2 size={15} strokeWidth={2} />
          </button>
        </div>
      </div>
    </div>
  );
}
