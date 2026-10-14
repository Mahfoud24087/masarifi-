import React from 'react';
import { X, Sparkles, GraduationCap, ShieldCheck, Heart, ExternalLink, Code2 } from 'lucide-react';
import { useMasarifi } from '../context/MasarifiContext';

export default function AboutModal({ isOpen, onClose }) {
  const { t, isDark, isRTL, lang } = useMasarifi();

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fadeIn"
      dir={isRTL ? 'rtl' : 'ltr'}
      onClick={onClose}
    >
      <div
        className={`relative w-full max-w-md rounded-3xl p-6 sm:p-7 shadow-2xl border transition-all ${
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
          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
        `}</style>

        {/* Close Button */}
        <button
          onClick={onClose}
          className={`absolute top-5 ${isRTL ? 'left-5' : 'right-5'} p-2 rounded-xl transition-colors ${
            isDark ? 'hover:bg-slate-800 text-slate-400 hover:text-white' : 'hover:bg-slate-100 text-slate-500'
          }`}
          title={lang === 'ar' ? 'إغلاق' : 'Close'}
        >
          <X size={19} />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3.5 mb-5">
          <div
            className="w-13 h-13 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-emerald-500/20 flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, #059669, #10B981)', width: '52px', height: '52px' }}
          >
            <span className="text-2xl font-black">م</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-extrabold tracking-tight">
                {t('landing.aboutTitle')}
              </h2>
            </div>
            <p className="text-xs text-emerald-600 dark:text-emerald-400 font-bold mt-0.5">
              {t('landing.aboutTagline')}
            </p>
          </div>
        </div>

        {/* Developer Story Card */}
        <div className={`p-4 rounded-2xl mb-4 text-xs sm:text-sm leading-relaxed border ${
          isDark ? 'bg-slate-800/80 border-slate-700/80 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700'
        }`}>
          <p className="mb-3 font-medium">
            {t('landing.aboutStory')}
          </p>

          <div className="pt-3 border-t border-inherit space-y-2">
            <div className="flex items-start gap-2.5">
              <div className="p-1 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 mt-0.5">
                <Code2 size={15} />
              </div>
              <div>
                <p className="text-[11px] text-slate-400 font-bold uppercase">{t('landing.aboutDevLabel')}</p>
                <p className="font-extrabold text-sm text-slate-900 dark:text-white">{t('landing.aboutDevName')}</p>
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <div className="p-1 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 mt-0.5">
                <GraduationCap size={15} />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">{t('landing.aboutDevInst')}</p>
                <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">{t('landing.aboutInitiative')}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Values Pills */}
        <div className="grid grid-cols-2 gap-2 mb-5 text-xs font-semibold">
          <div className={`p-2.5 rounded-xl flex items-center gap-2 border ${
            isDark ? 'bg-slate-800/40 border-slate-700 text-slate-300' : 'bg-emerald-50/50 border-emerald-100 text-emerald-800'
          }`}>
            <ShieldCheck size={16} className="text-emerald-500 flex-shrink-0" />
            <span className="truncate">{lang === 'ar' ? 'أمان وسرية تامة' : lang === 'fr' ? '100% Sécurisé' : '100% Private'}</span>
          </div>
          <div className={`p-2.5 rounded-xl flex items-center gap-2 border ${
            isDark ? 'bg-slate-800/40 border-slate-700 text-slate-300' : 'bg-blue-50/50 border-blue-100 text-blue-800'
          }`}>
            <Heart size={16} className="text-rose-500 flex-shrink-0" />
            <span className="truncate">{lang === 'ar' ? 'بدون إعلانات' : lang === 'fr' ? 'Sans Publicité' : 'Zero Ads'}</span>
          </div>
        </div>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="w-full py-3 rounded-2xl font-bold text-sm text-white shadow-lg shadow-emerald-500/20 transition-all active:scale-95"
          style={{ background: 'linear-gradient(135deg, #059669, #10B981)' }}
        >
          {lang === 'ar' ? 'فهمت، شكراً' : lang === 'fr' ? 'Compris, merci' : 'Got it, thank you'}
        </button>
      </div>
    </div>
  );
}
