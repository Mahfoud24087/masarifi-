import React from 'react';
import { X, TrendingDown, ShieldCheck, Heart, Sparkles, CheckCircle2 } from 'lucide-react';
import { useMasarifi } from '../context/MasarifiContext';

export default function AboutModal({ isOpen, onClose }) {
  const { t, isDark, isRTL, lang } = useMasarifi();

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      dir={isRTL ? 'rtl' : 'ltr'}
      onClick={onClose}
    >
      <div
        className={`relative w-full max-w-sm rounded-3xl p-6 shadow-2xl border transition-all ${
          isDark 
            ? 'bg-slate-900 border-slate-800 text-slate-100' 
            : 'bg-white border-slate-200 text-slate-900'
        }`}
        style={{ animation: 'scaleUp 0.2s ease-out' }}
        onClick={(e) => e.stopPropagation()}
      >
        <style>{`
          @keyframes scaleUp {
            from { transform: scale(0.95); opacity: 0; }
            to { transform: scale(1); opacity: 1; }
          }
        `}</style>

        {/* Close Button */}
        <button
          onClick={onClose}
          className={`absolute top-4 ${isRTL ? 'left-4' : 'right-4'} p-2 rounded-xl transition-colors ${
            isDark ? 'hover:bg-slate-800 text-slate-400 hover:text-white' : 'hover:bg-slate-100 text-slate-500'
          }`}
          title={lang === 'ar' ? 'إغلاق' : 'Close'}
        >
          <X size={18} />
        </button>

        {/* App Icon & Title */}
        <div className="text-center mb-5">
          <div
            className="w-16 h-16 rounded-2xl mx-auto mb-3 flex items-center justify-center shadow-lg shadow-emerald-500/20 text-white"
            style={{ background: 'linear-gradient(135deg, #059669, #10B981)' }}
          >
            <TrendingDown size={32} strokeWidth={2.2} />
          </div>
          <h2 className="text-xl font-extrabold tracking-tight">
            {t('appName')}
          </h2>
          <p className="text-xs text-emerald-600 dark:text-emerald-400 font-bold mt-0.5">
            {t('appTagline')}
          </p>
        </div>

        {/* App Purpose Description (100% about the app, no personal names) */}
        <div className={`p-4 rounded-2xl mb-4 text-xs leading-relaxed border ${
          isDark ? 'bg-slate-800/80 border-slate-700/80 text-slate-300' : 'bg-slate-50 border-slate-200/80 text-slate-700'
        }`}>
          <p className="mb-3 font-medium">
            {lang === 'ar' 
              ? 'تطبيق "مصاريفي" هو أداة مالية عصرية ومستقلة، صُممت لمساعدة أفراد المجتمع على تتبع مصاريفهم ودخلهم اليومي بالأوقية (MRU) وإدارة ميزانياتهم الشهرية بوعي ووضوح وبكل سهولة.'
              : lang === 'fr'
              ? 'Masarifi est une application financière moderne et indépendante, conçue pour vous aider à suivre vos dépenses et revenus quotidiens en Ouguiya (MRU) et à gérer vos budgets mensuels en toute simplicité.'
              : 'Masarifi is a modern personal finance app designed to help you track daily expenses and income in Ouguiya (MRU) and manage monthly budgets with complete clarity and ease.'}
          </p>

          <div className="space-y-1.5 pt-2 border-t border-inherit">
            <div className="flex items-center gap-2 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 size={13} />
              <span>{lang === 'ar' ? 'تتبع فوري للمصاريف والدخل بالأوقية' : 'Instant expense & income tracking in MRU'}</span>
            </div>
            <div className="flex items-center gap-2 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 size={13} />
              <span>{lang === 'ar' ? 'ميزانيات شهرية ورسوم بيانية واضحة' : 'Monthly budgets & visual analytics'}</span>
            </div>
            <div className="flex items-center gap-2 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 size={13} />
              <span>{lang === 'ar' ? 'مزامنة سحابية آمنة لحسابك' : 'Secure cloud synchronization'}</span>
            </div>
          </div>
        </div>

        {/* Badges */}
        <div className="grid grid-cols-2 gap-2 mb-4 text-xs font-semibold">
          <div className={`p-2.5 rounded-xl flex items-center justify-center gap-1.5 border text-center ${
            isDark ? 'bg-slate-800/40 border-slate-700 text-slate-300' : 'bg-emerald-50/50 border-emerald-100 text-emerald-800'
          }`}>
            <ShieldCheck size={15} className="text-emerald-500" />
            <span className="text-[11px]">{lang === 'ar' ? 'أمان وسرية تامة' : '100% Private'}</span>
          </div>
          <div className={`p-2.5 rounded-xl flex items-center justify-center gap-1.5 border text-center ${
            isDark ? 'bg-slate-800/40 border-slate-700 text-slate-300' : 'bg-blue-50/50 border-blue-100 text-blue-800'
          }`}>
            <Heart size={15} className="text-rose-500" />
            <span className="text-[11px]">{lang === 'ar' ? 'بدون إعلانات' : 'Zero Ads'}</span>
          </div>
        </div>

        {/* Version */}
        <p className="text-[11px] text-center text-slate-400 mb-4">
          Masarifi v2.3.0
        </p>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="w-full py-3 rounded-2xl font-bold text-xs text-white shadow-lg shadow-emerald-500/20 transition-all active:scale-95"
          style={{ background: 'linear-gradient(135deg, #059669, #10B981)' }}
        >
          {lang === 'ar' ? 'إغلاق' : 'Close'}
        </button>
      </div>
    </div>
  );
}
