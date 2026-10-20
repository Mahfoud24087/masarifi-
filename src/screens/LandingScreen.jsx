import React, { useState, useEffect } from 'react';
import { Globe, Moon, Sun, TrendingDown, Shield, BarChart2, Star, MessageSquare, Sparkles, Info, Download, Smartphone } from 'lucide-react';
import { useMasarifi } from '../context/MasarifiContext';
import InstallPrompt from '../components/InstallPrompt';
import AboutModal from '../components/AboutModal';
import DeveloperContactBar from '../components/DeveloperContactBar';

const LANGS = [
  { code: 'ar', label: 'العربية', flag: '🇲🇷' },
  { code: 'fr', label: 'Français', flag: '🇫🇷' },
  { code: 'en', label: 'English', flag: '🇬🇧' },
];

function StarRow({ count }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          size={14}
          className={s <= count ? 'text-amber-400 fill-amber-400' : 'text-slate-400'}
        />
      ))}
    </div>
  );
}

export default function LandingScreen() {
  const { t, lang, setLang, isDark, toggleTheme, setScreen, isRTL, featuredReviews } = useMasarifi();
  const [showLangPicker, setShowLangPicker] = useState(false);
  const [showAbout, setShowAbout] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSModal, setShowIOSModal] = useState(false);

  useEffect(() => {
    const ua = window.navigator.userAgent.toLowerCase();
    const isApple = /iphone|ipad|ipod/.test(ua);
    if (isApple) setIsIOS(true);

    const handleBeforeInstall = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
  }, []);

  const handleDownloadApp = async () => {
    if (isIOS) {
      setShowIOSModal(true);
      return;
    }
    if (deferredPrompt) {
      // Android: direct 1-click native install, no instructions
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') setDeferredPrompt(null);
    }
    // If no deferredPrompt yet (browser hasn't fired event / already installed), do nothing
  };

  const features = [
    {
      icon: Sparkles,
      title: lang === 'ar' ? 'مستشار مالي ذكي بالذكاء الاصطناعي' : lang === 'fr' ? 'Conseiller Financier IA' : 'AI Financial Advisor',
      desc: lang === 'ar' ? 'يحلل مصاريفك ويعطيك خطة رقمية دقيقة لتوفير أموالك' : lang === 'fr' ? 'Analyse vos dépenses et vous donne des conseils concrets pour économiser' : 'Analyzes your spending and suggests personalized ways to save',
      color: 'text-amber-500',
      bg: 'bg-amber-50 dark:bg-amber-950/40',
    },
    { icon: TrendingDown, title: t('landing.feature1Title'), desc: t('landing.feature1Desc'), color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-950/40' },
    { icon: BarChart2,    title: t('landing.feature2Title'), desc: t('landing.feature2Desc'), color: 'text-blue-500',    bg: 'bg-blue-50 dark:bg-blue-950/40'    },
    { icon: Shield,       title: t('landing.feature3Title'), desc: t('landing.feature3Desc'), color: 'text-violet-500', bg: 'bg-violet-50 dark:bg-violet-950/40'  },
  ];

  return (
    <div
      className={`min-h-screen overflow-y-auto ${isDark ? 'bg-slate-900 text-slate-100' : 'bg-gradient-to-br from-slate-50 via-white to-emerald-50 text-slate-900'}`}
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      {/* Top bar */}
      <div className="flex items-center justify-between px-5 pt-6 pb-2">
        <div className="flex items-center gap-2">
          {/* Language Picker */}
          <div className="relative">
            <button
              onClick={() => setShowLangPicker(!showLangPicker)}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
                isDark ? 'bg-slate-800 text-slate-200 hover:bg-slate-700'
                       : 'bg-white text-slate-700 shadow-sm hover:bg-slate-50 border border-slate-100'
              }`}
              id="masarifi-lang-picker-btn"
            >
              <Globe size={15} />
              <span>{LANGS.find((l) => l.code === lang)?.flag}</span>
              <span>{LANGS.find((l) => l.code === lang)?.label}</span>
            </button>
            {showLangPicker && (
              <div className={`absolute top-12 ${isRTL ? 'right-0' : 'left-0'} z-50 rounded-2xl shadow-xl p-2 min-w-[160px] border ${
                isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100'
              }`}>
                {LANGS.map((l) => (
                  <button
                    key={l.code}
                    onClick={() => { setLang(l.code); setShowLangPicker(false); }}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm transition-colors ${
                      lang === l.code
                        ? 'bg-emerald-100 text-emerald-700 font-semibold dark:bg-emerald-900/40 dark:text-emerald-300'
                        : isDark ? 'text-slate-200 hover:bg-slate-700' : 'text-slate-700 hover:bg-slate-50'
                    }`}
                    id={`masarifi-lang-${l.code}`}
                  >
                    <span>{l.flag}</span><span>{l.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* About Button */}
          <button
            onClick={() => setShowAbout(true)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
              isDark ? 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
                     : 'bg-white text-slate-700 shadow-sm hover:bg-slate-50 border border-slate-100'
            }`}
          >
            <Info size={15} className="text-emerald-500" />
            <span>{lang === 'ar' ? 'حول التطبيق' : lang === 'fr' ? 'À propos' : 'About'}</span>
          </button>
        </div>

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
            isDark ? 'bg-slate-800 text-amber-400 hover:bg-slate-700'
                   : 'bg-white text-slate-600 shadow-sm hover:bg-slate-50 border border-slate-100'
          }`}
          id="masarifi-theme-toggle"
        >
          {isDark ? <Sun size={18} /> : <Moon size={18} />}
        </button>
      </div>

      {/* Hero */}
      <div className="px-6 pt-8 pb-8 text-center">
        <div
          className="w-20 h-20 rounded-3xl mx-auto mb-5 flex items-center justify-center shadow-lg shadow-emerald-200 dark:shadow-emerald-950/40"
          style={{ background: 'linear-gradient(135deg, #059669, #10B981)' }}
        >
          <TrendingDown size={38} className="text-white" strokeWidth={2} />
        </div>
        <h1 className={`text-4xl font-extrabold mb-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>
          {t('appName')}
        </h1>
        <p className={`text-sm mb-6 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{t('appTagline')}</p>
        <h2 className={`text-xl font-bold leading-snug mb-3 ${isDark ? 'text-slate-100' : 'text-slate-800'}`}>
          {t('landing.hero')}
        </h2>
        <p className={`text-sm leading-relaxed max-w-xs mx-auto mb-8 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
          {t('landing.heroSub')}
        </p>
        <div className="flex flex-col gap-3 max-w-xs mx-auto">
          <button
            onClick={() => setScreen('auth-signup')}
            className="w-full py-4 rounded-2xl font-bold text-white text-base shadow-lg shadow-emerald-200 dark:shadow-emerald-950/40 transition-all active:scale-95 hover:scale-[1.02]"
            style={{ background: 'linear-gradient(135deg, #059669, #10B981)' }}
            id="masarifi-get-started"
          >
            {t('landing.getStarted')}
          </button>
          <button
            onClick={() => setScreen('auth-signin')}
            className={`w-full py-4 rounded-2xl font-bold text-base border-2 transition-all active:scale-95 hover:scale-[1.02] ${
              isDark ? 'border-slate-600 text-slate-200 hover:bg-slate-800'
                     : 'border-emerald-200 text-emerald-700 hover:bg-emerald-50'
            }`}
            id="masarifi-signin"
          >
            {t('landing.signIn')}
          </button>

          {/* Prominent Download App Button for Android & iOS */}
          <button
            onClick={handleDownloadApp}
            className={`w-full py-3.5 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 border transition-all active:scale-95 hover:scale-[1.02] shadow-sm ${
              isDark 
                ? 'bg-slate-800/90 border-emerald-500/40 text-emerald-300 hover:bg-slate-800' 
                : 'bg-emerald-50 border-emerald-300 text-emerald-800 hover:bg-emerald-100/80'
            }`}
            id="masarifi-landing-download-btn"
          >
            <Download size={18} className="text-emerald-500" />
            <span>
              {lang === 'ar' ? 'تحميل وتثبيت التطبيق على الهاتف' : lang === 'fr' ? 'Télécharger l’application mobile' : 'Download Mobile App'}
            </span>
          </button>
        </div>
      </div>

      {/* Features */}
      <div className={`mx-4 rounded-3xl p-5 mb-6 ${isDark ? 'bg-slate-800' : 'bg-white shadow-sm border border-slate-100'}`}>
        {features.map((f, i) => {
          const Icon = f.icon;
          return (
            <div key={i} className={`flex items-start gap-4 ${i < features.length - 1 ? 'mb-4' : ''}`}>
              <div className={`w-11 h-11 rounded-2xl ${f.bg} flex items-center justify-center flex-shrink-0`}>
                <Icon size={20} className={f.color} />
              </div>
              <div>
                <p className={`font-bold text-sm ${isDark ? 'text-slate-100' : 'text-slate-800'}`}>{f.title}</p>
                <p className={`text-xs mt-0.5 leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{f.desc}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* User Reviews section */}
      <div className="px-4 mb-10">
        <p className={`text-xs font-semibold uppercase tracking-widest mb-3 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
          {t('landing.testimonials')}
        </p>

        {featuredReviews.length === 0 ? (
          /* Empty state – no reviews yet */
          <div className={`p-6 rounded-2xl text-center ${isDark ? 'bg-slate-800 border border-slate-700' : 'bg-white border border-slate-100 shadow-sm'}`}>
            <div className="w-14 h-14 rounded-full bg-amber-50 dark:bg-amber-950/40 flex items-center justify-center mx-auto mb-3">
              <MessageSquare size={26} className="text-amber-400" />
            </div>
            <p className={`text-sm font-semibold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{t('review.noReviews')}</p>
            <p className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{t('review.beFirst')}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {featuredReviews.map((item) => (
              <div
                key={item.id}
                className={`p-4 rounded-2xl ${isDark ? 'bg-slate-800 border border-slate-700' : 'bg-white border border-slate-100 shadow-sm'}`}
              >
                {/* Stars */}
                <StarRow count={item.stars} />
                {/* Comment */}
                <p className={`text-sm leading-relaxed mt-2 mb-2 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                  "{item.comment}"
                </p>
                {/* Name + date */}
                <div className="flex items-center justify-between">
                  <p className={`text-xs font-semibold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    — {item.userName}
                  </p>
                  <p className={`text-xs ${isDark ? 'text-slate-600' : 'text-slate-400'}`}>
                    {new Date(item.date).toLocaleDateString(lang === 'ar' ? 'ar-u-nu-latn' : lang === 'fr' ? 'fr-FR' : 'en-GB', {
                      day: 'numeric', month: 'short', year: 'numeric',
                    })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Developer Contact Bar (WhatsApp & Gmail) */}
      <div className="mb-6 px-4">
        <DeveloperContactBar />
      </div>

      {/* Footer */}
      <div className="pb-8 text-center text-xs text-slate-400">
        <button
          onClick={() => setShowAbout(true)}
          className="hover:text-emerald-500 font-medium transition-colors"
        >
          {lang === 'ar' ? 'حول تطبيق مصاريفي' : lang === 'fr' ? 'À propos de Masarifi' : 'About Masarifi'}
        </button>
        <p className="mt-1 text-[11px] text-slate-400/80">v2.3.0</p>
      </div>

      <AboutModal isOpen={showAbout} onClose={() => setShowAbout(false)} />
      <InstallPrompt />

      {/* iOS Installation Instructions Modal */}
      {showIOSModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
          dir={isRTL ? 'rtl' : 'ltr'}
          onClick={() => setShowIOSModal(false)}
        >
          <div
            className={`w-full max-w-sm rounded-3xl p-6 border shadow-2xl ${
              isDark ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-100 text-slate-900'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-14 h-14 rounded-2xl mx-auto mb-3 flex items-center justify-center bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg">
              <Download size={26} />
            </div>

            <h3 className="font-extrabold text-base text-center mb-1">
              {lang === 'ar' ? 'تثبيت مصاريفي على هاتفك' : lang === 'fr' ? 'Installer Masarifi sur votre mobile' : 'Install Masarifi on your device'}
            </h3>
            <p className="text-xs text-center text-slate-400 mb-5">
              {isIOS ? 'Apple iPhone (Safari)' : 'Android / Google Chrome'}
            </p>

            <div className="space-y-3 text-xs font-semibold mb-6">
              <div className="flex items-start gap-3 p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/40">
                <span className="w-6 h-6 rounded-xl bg-emerald-500 text-white flex items-center justify-center font-black text-xs flex-shrink-0">1</span>
                <p className="text-slate-800 dark:text-slate-200 leading-relaxed">
                  {lang === 'ar' 
                    ? 'في متصفح هاتفك (Safari أو Chrome)، اضغط على زر الخيارات أو المشاركة (📤 / ⋮).' 
                    : lang === 'fr' 
                    ? 'Dans votre navigateur (Safari ou Chrome), touchez le bouton Partager ou Menu (📤 / ⋮).' 
                    : 'In your browser (Safari or Chrome), tap Share or Menu (📤 / ⋮).'}
                </p>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/40">
                <span className="w-6 h-6 rounded-xl bg-blue-500 text-white flex items-center justify-center font-black text-xs flex-shrink-0">2</span>
                <p className="text-slate-800 dark:text-slate-200 leading-relaxed">
                  {lang === 'ar' 
                    ? 'اختر «إضافة إلى الشاشة الرئيسية» (Add to Home Screen ➕).' 
                    : lang === 'fr' 
                    ? 'Touchez « Sur l\'écran d\'accueil » ou « Installer l\'application » (➕).' 
                    : 'Select "Add to Home Screen" or "Install App" (➕).'}
                </p>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-2xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800/40">
                <span className="w-6 h-6 rounded-xl bg-purple-500 text-white flex items-center justify-center font-black text-xs flex-shrink-0">3</span>
                <p className="text-slate-800 dark:text-slate-200 leading-relaxed">
                  {lang === 'ar' 
                    ? 'اضغط على «إضافة»، وسيظهر تطبيق مصاريفي على شاشتك مباشرة!' 
                    : lang === 'fr' 
                    ? 'Touchez « Ajouter » : Masarifi est prêt sur votre écran d\'accueil !' 
                    : 'Tap "Add" : Masarifi is ready on your home screen!'}
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowIOSModal(false)}
              className="w-full py-3.5 rounded-2xl font-bold text-xs text-white shadow-lg transition-all active:scale-95"
              style={{ background: 'linear-gradient(135deg, #059669, #10B981)' }}
            >
              {lang === 'ar' ? 'حسناً، فهمت' : lang === 'fr' ? 'Compris' : 'Got It'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
