import React from 'react';
import { X, TrendingDown, ShieldCheck, Heart, Sparkles, CheckCircle2, HelpCircle, Compass, Target } from 'lucide-react';
import { useMasarifi } from '../context/MasarifiContext';
import DeveloperContactBar from './DeveloperContactBar';

export default function AboutModal({ isOpen, onClose }) {
  const { t, isDark, isRTL, lang } = useMasarifi();

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-3 sm:p-4"
      dir={isRTL ? 'rtl' : 'ltr'}
      onClick={onClose}
    >
      <div
        className={`relative w-full max-w-md rounded-3xl p-6 sm:p-7 border transition-all max-h-[92vh] overflow-y-auto ${
          isDark 
            ? 'bg-slate-900 border-slate-800 text-slate-100' 
            : 'bg-white border-slate-200 text-slate-900'
        }`}
        style={{ animation: 'scaleUp 0.2s ease-out', textShadow: 'none', filter: 'none' }}
        onClick={(e) => e.stopPropagation()}
      >
        <style>{`
          @keyframes scaleUp {
            from { transform: scale(0.98); opacity: 0; }
            to { transform: scale(1); opacity: 1; }
          }
          #masarifi-about-modal, #masarifi-about-modal * {
            text-shadow: none !important;
            box-shadow: none !important;
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
            className="w-16 h-16 rounded-2xl mx-auto mb-3 flex items-center justify-center text-white"
            style={{ background: 'linear-gradient(135deg, #059669, #10B981)' }}
          >
            <TrendingDown size={32} strokeWidth={2.2} />
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight">
            {t('appName')}
          </h2>
          <p className="text-xs text-emerald-700 dark:text-emerald-400 font-bold mt-0.5">
            {t('appTagline')}
          </p>
        </div>

        {/* Real Example & Problem It Solves */}
        <div id="masarifi-about-modal" className={`p-4 sm:p-5 rounded-2xl mb-4 text-xs leading-relaxed border ${
          isDark ? 'bg-slate-800 border-slate-700 text-slate-100' : 'bg-emerald-50 border-emerald-200 text-slate-900'
        }`} style={{ textShadow: 'none' }}>
          <div className="flex items-center gap-2 mb-2 font-extrabold text-sm text-emerald-800 dark:text-emerald-300">
            <HelpCircle size={16} className="text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
            <span style={{ textShadow: 'none' }}>
              {lang === 'ar' 
                ? 'لماذا وُجد تطبيق مصاريفي؟' 
                : lang === 'fr' 
                ? 'Pourquoi Masarifi a été créé ?' 
                : 'Why Masarifi was created?'}
            </span>
          </div>

          {lang === 'ar' ? (
            <div className="space-y-3 font-medium leading-relaxed text-slate-800 dark:text-slate-200" style={{ textShadow: 'none' }}>
              <p>
                <strong>«هل شعرت يوماً أن أموالك تتلاشى دون أن تدري أين ذهبت؟»</strong> تستلم راتبك أو دخلك، وبعد بضعة أيام تتفاجأ بأن رصيدك قد شارف على النفاد، وتشعر بالحسرة والحيرة لأنك لا تعرف بالضبط أين أُنفقت، وهذا الأمر يتكرر معك باستمرار كل شهر؟
              </p>
              <p>
                من هذا التساؤل المؤرق وُلدت فكرة <strong>«مصاريفي»</strong>!
              </p>
              <p>
                صُمم مصاريفي ليكون عينك الحارسة ومستشارك المالي اليومي؛ ليساعدك على مراقبة كل أوقية بدقة، ومعرفة أين تذهب أموالك بالتفصيل (طعام، نقل، فواتير، التزامات، أو مشتريات عفوية صغيرة تستنزف جيبك).
              </p>
              <p className="font-semibold text-emerald-900 dark:text-emerald-200 bg-emerald-100/60 dark:bg-slate-900 p-2.5 rounded-xl border border-emerald-300 dark:border-emerald-800">
                ✨ مع مصاريفي: لن تضيع أموالك في المجهول بعد اليوم. ستتحكم في ميزانيتك، وتوقف الهدر المالي، وتبني مدخراتك لمستقبلك براحة بال كاملة.
              </p>
            </div>
          ) : lang === 'fr' ? (
            <div className="space-y-3 font-medium leading-relaxed text-slate-800 dark:text-slate-200" style={{ textShadow: 'none' }}>
              <p>
                <strong>« Avez-vous déjà eu l'impression que votre argent s'évapore sans savoir où il est passé ? »</strong> Vous touchez votre salaire, et quelques jours plus tard, vous constatez avec frustration qu'il ne reste presque rien, une situation qui se répète inlassablement chaque mois ?
              </p>
              <p>
                C'est exactement de ce constat réel qu'est née l'idée de <strong>Masarifi</strong> !
              </p>
              <p>
                Masarifi est votre boussole financière quotidienne : il vous permet d'enregistrer et de catégoriser chaque dépense en Ouguiya (MRU), de comprendre vos habitudes financières, d'identifier les fuites d'argent cachées et de respecter vos budgets mensuels.
              </p>
              <p className="font-semibold text-emerald-900 dark:text-emerald-200 bg-emerald-100/60 dark:bg-slate-900 p-2.5 rounded-xl border border-emerald-300 dark:border-emerald-800">
                ✨ Avec Masarifi : Ne vous demandez plus où est parti votre argent. Reprenez le contrôle, éliminez le stress financier et construisez votre épargne en toute sérénité.
              </p>
            </div>
          ) : (
            <div className="space-y-3 font-medium leading-relaxed text-slate-800 dark:text-slate-200" style={{ textShadow: 'none' }}>
              <p>
                <strong>"Have you ever felt like your money simply vanished without knowing where it went?"</strong> You receive your income, and just days later you find your wallet empty—feeling stressed and regretful because this happens month after month?
              </p>
              <p>
                This universal financial struggle is exactly where the idea of <strong>Masarifi</strong> comes from!
              </p>
              <p>
                Masarifi was crafted to be your personal financial guardian: tracking every single Ouguiya (MRU), categorizing spending in real time (food, transit, bills, or little impulse leaks), and providing smart budgets with AI financial advice.
              </p>
              <p className="font-semibold text-emerald-900 dark:text-emerald-200 bg-emerald-100/60 dark:bg-slate-900 p-2.5 rounded-xl border border-emerald-300 dark:border-emerald-800">
                ✨ With Masarifi: You'll never wonder "where did my money go?" again. Gain total financial awareness, cut unnecessary losses, and grow your savings with absolute peace of mind.
              </p>
            </div>
          )}

          <div className="space-y-1.5 pt-3 mt-3 border-t border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-2 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">
              <CheckCircle2 size={13} />
              <span>{lang === 'ar' ? 'تتبع فوري للمصاريف والدخل بالأوقية (MRU)' : 'Instant expense & income tracking in MRU'}</span>
            </div>
            <div className="flex items-center gap-2 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">
              <CheckCircle2 size={13} />
              <span>{lang === 'ar' ? 'ميزانيات ذكية ورسوم بيانية دقيقة' : 'Smart budgets & visual analytics'}</span>
            </div>
            <div className="flex items-center gap-2 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">
              <CheckCircle2 size={13} />
              <span>{lang === 'ar' ? 'مستشار مالي بالذكاء الاصطناعي مخصص لك' : 'AI financial advisor tailored for you'}</span>
            </div>
          </div>
        </div>

        {/* Badges */}
        <div className="grid grid-cols-2 gap-2 mb-4 text-xs font-semibold">
          <div className={`p-2.5 rounded-xl flex items-center justify-center gap-1.5 border text-center ${
            isDark ? 'bg-slate-800 border-slate-700 text-slate-300' : 'bg-emerald-50 border-emerald-200 text-emerald-800'
          }`}>
            <ShieldCheck size={15} className="text-emerald-600" />
            <span className="text-[11px]">{lang === 'ar' ? 'أمان وسرية تامة' : '100% Private'}</span>
          </div>
          <div className={`p-2.5 rounded-xl flex items-center justify-center gap-1.5 border text-center ${
            isDark ? 'bg-slate-800 border-slate-700 text-slate-300' : 'bg-blue-50 border-blue-200 text-blue-800'
          }`}>
            <Heart size={15} className="text-rose-500" />
            <span className="text-[11px]">{lang === 'ar' ? 'بدون إعلانات' : 'Zero Ads'}</span>
          </div>
        </div>

        {/* Direct Contact Buttons (WhatsApp & Gmail Logos) */}
        <div className={`p-3 rounded-2xl mb-4 border ${
          isDark ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'
        }`}>
          <DeveloperContactBar />
        </div>

        {/* Version */}
        <p className="text-[11px] text-center text-slate-400 mb-4" dir="ltr">
          Masarifi v2.3.0
        </p>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="w-full py-3 rounded-2xl font-bold text-xs text-white transition-all active:scale-95"
          style={{ background: 'linear-gradient(135deg, #059669, #10B981)' }}
        >
          {lang === 'ar' ? 'إغلاق' : 'Close'}
        </button>
      </div>
    </div>
  );
}
