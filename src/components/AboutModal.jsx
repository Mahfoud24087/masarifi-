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
        <div id="masarifi-about-modal" className="space-y-3 mb-4 text-xs leading-relaxed" style={{ textShadow: 'none' }}>
          
          {/* Card 1: The Everyday Problem */}
          <div className={`p-4 rounded-2xl border ${
            isDark ? 'bg-amber-950/40 border-amber-500/40 text-slate-100' : 'bg-amber-50/90 border-amber-200 text-slate-950'
          }`}>
            <div className="flex items-center gap-2 mb-1.5 font-black text-sm text-amber-800 dark:text-amber-300">
              <span className="text-base">❓</span>
              <span>
                {lang === 'ar' 
                  ? 'المشكلة اليومية الشائعة:' 
                  : lang === 'fr' 
                  ? 'Le problème quotidien :' 
                  : 'The Common Daily Struggle:'}
              </span>
            </div>
            <p className="text-sm font-extrabold text-slate-950 dark:text-white leading-snug">
              {lang === 'ar'
                ? '«هل شعرت يوماً أن أموالك تتلاشى وتضيع دون أن تعرف أين ذهبت؟»'
                : lang === 'fr'
                ? '« Avez-vous déjà eu l\'impression que votre argent s\'évapore sans savoir où il est passé ? »'
                : '"Have you ever felt like your money simply vanished without knowing where it went?"'}
            </p>
            <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 mt-2 leading-relaxed">
              {lang === 'ar'
                ? 'تستلم راتبك أو دخلك، وبعد أيام قليلة تتفاجأ بأن رصيدك قارب على الصفر، وتشعر بالحسرة والندم لأنك لا تدري أين أُنفقت، وهذا الأمر يتكرر معك شهراً بعد شهر.'
                : lang === 'fr'
                ? 'Vous touchez votre salaire, et quelques jours plus tard, votre portefeuille est vide. Vous êtes frustré car cette situation se répète inlassablement chaque mois.'
                : 'You receive your income, and just days later you find your wallet empty—feeling stressed and regretful because this happens month after month without knowing where it was spent.'}
            </p>
          </div>

          {/* Card 2: The Solution (How Masarifi Solves It) */}
          <div className={`p-4 rounded-2xl border ${
            isDark ? 'bg-emerald-950/40 border-emerald-500/40 text-slate-100' : 'bg-emerald-50/90 border-emerald-200 text-slate-950'
          }`}>
            <div className="flex items-center gap-2 mb-2 font-black text-sm text-emerald-800 dark:text-emerald-300">
              <Sparkles size={16} className="text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
              <span>
                {lang === 'ar' 
                  ? 'من هنا وُلدت فكرة مصاريفي:' 
                  : lang === 'fr' 
                  ? 'D\'où est née l\'idée de Masarifi :' 
                  : 'Where the Masarifi Idea Came From:'}
              </span>
            </div>
            <p className="text-xs font-bold text-slate-900 dark:text-slate-100 leading-relaxed mb-2.5">
              {lang === 'ar'
                ? 'صُمم مصاريفي ليساعدك على مراقبة كل أوقية (MRU) ومعرفة أين تذهب أموالك بالتفصيل:'
                : lang === 'fr'
                ? 'Masarifi a été créé pour surveiller chaque Ouguiya (MRU) et savoir où va votre argent en détail :'
                : 'Masarifi was crafted to help you watch your money and see exactly where it is going with complete details for each spending:'}
            </p>

            <ul className="space-y-2 text-xs font-bold text-slate-900 dark:text-slate-100">
              <li className="flex items-start gap-2">
                <span className="text-emerald-600 dark:text-emerald-400 font-black">✓</span>
                <span>
                  {lang === 'ar'
                    ? 'تسجيل فوري وتصنيف دقيق لكل مصروف (طعام، نقل، فواتير، مشتريات عفوية).'
                    : lang === 'fr'
                    ? 'Enregistrement instantané et catégorisation précise de chaque dépense (nourriture, transport, factures).'
                    : 'Instant tracking and categorization for every expense (food, transit, bills, daily leaks).'}
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-600 dark:text-amber-400 font-black">✓</span>
                <span>
                  {lang === 'ar'
                    ? 'تنبيهات فورية عند وصولك إلى 80% من ميزانية أي فئة لتفادي نفاد المال قبل نهاية الشهر.'
                    : lang === 'fr'
                    ? 'Alertes d\'avertissement automatiques dès 80% du budget pour éviter de vous retrouver à court.'
                    : 'Automatic early warning notifications as soon as you reach 80% of any category budget.'}
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-600 dark:text-emerald-400 font-black">✓</span>
                <span>
                  {lang === 'ar'
                    ? 'مستشار مالي ذكي بالذكاء الاصطناعي يقدم نصائح مخصصة لوقف النزيف المالي وزيادة ادخارك.'
                    : lang === 'fr'
                    ? 'Conseiller financier intelligent par IA avec des conseils concrets pour éliminer le gaspillage.'
                    : 'Smart AI financial advisor providing customized advice to stop leaks and grow your savings.'}
                </span>
              </li>
            </ul>
          </div>

          {/* Card 3: The Result */}
          <div className={`p-3 rounded-2xl border text-center font-bold text-xs ${
            isDark ? 'bg-slate-800 border-slate-700 text-emerald-400' : 'bg-emerald-100/70 border-emerald-300 text-emerald-950'
          }`}>
            <span>
              {lang === 'ar'
                ? '🎯 مع مصاريفي: وداعاً للحيرة وضياع المال.. تحكّم بميزانيتك براحة بال كاملة!'
                : lang === 'fr'
                ? '🎯 Avec Masarifi : Ne vous demandez plus où est parti votre argent. Reprenez le contrôle total !'
                : '🎯 With Masarifi: Never wonder where your money vanished again. Total financial control!'}
            </span>
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
