import React, { useState, useEffect } from 'react';
import { useMasarifi } from '../context/MasarifiContext';
import { Sparkles, ChevronLeft, ChevronRight, Target, ShieldCheck, HeartHandshake } from 'lucide-react';

const WISDOM_ITEMS = [
  {
    id: 'goals',
    icon: Target,
    color: 'from-amber-500 to-amber-600',
    title: {
      ar: 'أهدافك المستقبلية',
      fr: 'Vos Objectifs',
      en: 'Your Goals',
    },
    text: {
      ar: 'هل تسعى لادخار ثمن سيارة أو تأسيس مشروعك الخاص وتتساءل أين يذهب راتبك؟ تطبيق مصاريفي يرشدك لبلوغ أهدافك المالية دون أن تحرم نفسك من ضروريات الحياة.',
      fr: "Vous prévoyez d'acheter une voiture ou de lancer votre projet tout en vous demandant où s'évapore votre salaire ? Masarifi vous guide pour atteindre vos objectifs financiers sans vous priver du nécessaire.",
      en: 'Planning to save for a car or launch your own venture while wondering where your salary goes? Masarifi guides you toward your financial goals without depriving you of life\'s essentials.',
    },
  },
  {
    id: 'barakah',
    icon: ShieldCheck,
    color: 'from-emerald-500 to-teal-600',
    title: {
      ar: 'البركة في حُسن التدبير',
      fr: 'Sagesse & Droits',
      en: 'Mindful Management',
    },
    text: {
      ar: 'البركة تكمن في حُسن التدبير.. مصاريفي ليس لحساب صغائر النفقات، بل لصيانة حقوق الناس والتزاماتك وحفظ كل أوقية تستحقها حتى لا يضيع لك حق.',
      fr: "La bénédiction réside dans la bonne gestion. Masarifi n'est pas conçu pour scruter vos menus achats, mais pour préserver les droits de chacun et suivre chaque ouguiya qui vous revient.",
      en: 'True blessing lies in thoughtful management. Masarifi isn’t about scrutinizing petty expenses, but about honoring mutual obligations and protecting every Ouguiya you are owed.',
    },
  },
  {
    id: 'generosity',
    icon: HeartHandshake,
    color: 'from-blue-500 to-indigo-600',
    title: {
      ar: 'الكرم والاعتدال',
      fr: 'Générosité & Équilibre',
      en: 'Generosity & Balance',
    },
    text: {
      ar: 'عِش حياتك بكرم واعتدال، ولكن احرص على ألا يتلاشى دخلك دون أثر فتجد نفسك مضطراً للاستدانة في منتصف الشهر.',
      fr: 'Profitez de la vie avec générosité et modération, mais veillez à ce que vos revenus ne disparaissent pas subitement, vous contraignant à emprunter au milieu du mois.',
      en: 'Live generously and in moderation, but ensure your earnings do not vanish without a trace, forcing you into debt by mid-month.',
    },
  },
];

export default function WisdomBanner({ forceShow = false }) {
  const { user, isDark, isRTL, lang } = useMasarifi();
  const [index, setIndex] = useState(0);

  // Auto-rotate wisdom every 7 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % WISDOM_ITEMS.length);
    }, 7000);
    return () => clearInterval(timer);
  }, []);

  // When forceShow is true (e.g. Landing Page), show to all visitors.
  // When inside the app, show only for user account "Anonyme".
  const isAnonyme = user?.name?.trim().toLowerCase() === 'anonyme';
  if (!forceShow && !isAnonyme) return null;

  const currentItem = WISDOM_ITEMS[index];
  const IconComponent = currentItem.icon;

  const handleNext = () => {
    setIndex((prev) => (prev + 1) % WISDOM_ITEMS.length);
  };

  const handlePrev = () => {
    setIndex((prev) => (prev - 1 + WISDOM_ITEMS.length) % WISDOM_ITEMS.length);
  };

  const itemTitle = currentItem.title[lang] || currentItem.title.ar;
  const itemText = currentItem.text[lang] || currentItem.text.ar;

  return (
    <div
      className={`rounded-3xl border p-4 mb-4 transition-all shadow-sm relative overflow-hidden text-start ${
        isDark
          ? 'bg-slate-800/90 border-slate-700/80 text-white'
          : 'bg-white/95 border-emerald-100 text-slate-900 shadow-md shadow-emerald-500/5'
      }`}
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      {/* Decorative background glow */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none" />

      {/* Header bar */}
      <div className="flex items-center justify-between mb-2.5 relative z-10">
        <div className="flex items-center gap-2">
          <div
            className={`w-7 h-7 rounded-xl bg-gradient-to-br ${currentItem.color} text-white flex items-center justify-center shadow-sm`}
          >
            <IconComponent size={14} />
          </div>
          <span className="text-xs font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
            <Sparkles size={13} className="text-amber-500" />
            <span>{itemTitle}</span>
          </span>
        </div>

        {/* Step dots & Navigation arrows */}
        <div className="flex items-center gap-1.5">
          <div className="flex items-center gap-1 mr-1 ml-1">
            {WISDOM_ITEMS.map((_, i) => (
              <button
                key={i}
                onClick={() => setIndex(i)}
                className={`w-1.5 h-1.5 rounded-full transition-all ${
                  index === i
                    ? 'w-4 bg-emerald-500'
                    : isDark
                    ? 'bg-slate-600 hover:bg-slate-500'
                    : 'bg-slate-300 hover:bg-slate-400'
                }`}
                aria-label={`Go to slide ${i + 1}`}
              />
            ))}
          </div>

          <button
            onClick={isRTL ? handleNext : handlePrev}
            className={`p-1 rounded-lg transition-colors ${
              isDark ? 'hover:bg-slate-700 text-slate-400' : 'hover:bg-slate-100 text-slate-500'
            }`}
            title="Previous"
            aria-label="Previous insight"
          >
            <ChevronRight size={15} />
          </button>
          <button
            onClick={isRTL ? handlePrev : handleNext}
            className={`p-1 rounded-lg transition-colors ${
              isDark ? 'hover:bg-slate-700 text-slate-400' : 'hover:bg-slate-100 text-slate-500'
            }`}
            title="Next"
            aria-label="Next insight"
          >
            <ChevronLeft size={15} />
          </button>
        </div>
      </div>

      {/* Insight Text */}
      <p
        className={`text-xs sm:text-sm leading-relaxed font-medium transition-all ${
          isDark ? 'text-slate-200' : 'text-slate-700'
        }`}
      >
        "{itemText}"
      </p>
    </div>
  );
}
