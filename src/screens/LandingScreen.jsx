import React, { useState } from 'react';
import { 
  Globe, Moon, Sun, TrendingDown, Shield, BarChart2, Star, 
  MessageSquare, Info, ArrowUpRight, ArrowDownRight, Wallet, CheckCircle2 
} from 'lucide-react';
import { useMasarifi } from '../context/MasarifiContext';
import InstallPrompt from '../components/InstallPrompt';
import AboutModal from '../components/AboutModal';

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

  const features = [
    { 
      icon: TrendingDown, 
      title: t('landing.feature1Title'), 
      desc: lang === 'ar' ? 'سجل مصاريفك ودخلك اليومي بالأوقية (MRU) بلمسة واحدة وفي ثوانٍ معدودة.' : t('landing.feature1Desc'), 
      color: 'text-emerald-500', 
      bg: 'bg-emerald-50 dark:bg-emerald-950/40' 
    },
    { 
      icon: BarChart2,    
      title: t('landing.feature2Title'), 
      desc: lang === 'ar' ? 'رسوم ومخططات واضحة تبين لك بدقة أين تذهب أموالك مع ميزانيات شهرية منضبطة.' : t('landing.feature2Desc'), 
      color: 'text-blue-500',    
      bg: 'bg-blue-50 dark:bg-blue-950/40'    
    },
    { 
      icon: Shield,       
      title: t('landing.feature3Title'), 
      desc: lang === 'ar' ? 'مزامنة سحابية آمنة لحسابك، بدون إعلانات مزعجة، مع الحفاظ الكامل على سرية بياناتك.' : t('landing.feature3Desc'), 
      color: 'text-violet-500', 
      bg: 'bg-violet-50 dark:bg-violet-950/40'  
    },
  ];

  return (
    <div
      className={`min-h-screen overflow-y-auto ${isDark ? 'bg-slate-900 text-slate-100' : 'bg-gradient-to-br from-slate-50 via-white to-emerald-50 text-slate-900'}`}
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      {/* ─── Top Bar ─── */}
      <div className="flex items-center justify-between px-5 pt-6 pb-2 border-b border-inherit/40 max-w-lg mx-auto">
        {/* Brand */}
        <div className="flex items-center gap-2.5">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center text-white shadow-md shadow-emerald-500/20"
            style={{ background: 'linear-gradient(135deg, #059669, #10B981)' }}
          >
            <span className="font-extrabold text-base">م</span>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-base tracking-tight">{t('appName')}</span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                MRU
              </span>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5">
          {/* About Button */}
          <button
            onClick={() => setShowAbout(true)}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
              isDark 
                ? 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white border border-slate-700' 
                : 'bg-white text-slate-700 shadow-sm hover:bg-slate-50 border border-slate-200'
            }`}
            title={t('landing.aboutBtn')}
          >
            <Info size={14} className="text-emerald-500" />
            <span>{t('landing.aboutBtn')}</span>
          </button>

          {/* Language Selector */}
          <div className="relative">
            <button
              onClick={() => setShowLangPicker(!showLangPicker)}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium transition-colors ${
                isDark ? 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700'
                       : 'bg-white text-slate-700 shadow-sm hover:bg-slate-50 border border-slate-200'
              }`}
            >
              <span>{LANGS.find((l) => l.code === lang)?.flag}</span>
              <span className="hidden sm:inline">{LANGS.find((l) => l.code === lang)?.label}</span>
            </button>
            {showLangPicker && (
              <div className={`absolute top-10 ${isRTL ? 'right-0' : 'left-0'} z-50 rounded-2xl shadow-xl p-1.5 min-w-[140px] border ${
                isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200 shadow-lg'
              }`}>
                {LANGS.map((l) => (
                  <button
                    key={l.code}
                    onClick={() => { setLang(l.code); setShowLangPicker(false); }}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-colors ${
                      lang === l.code
                        ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-bold'
                        : isDark ? 'text-slate-300 hover:bg-slate-700' : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <span>{l.flag}</span>
                    <span>{l.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className={`w-8 h-8 rounded-xl flex items-center justify-center transition-colors ${
              isDark ? 'bg-slate-800 text-amber-400 hover:bg-slate-700 border border-slate-700'
                     : 'bg-white text-slate-600 shadow-sm hover:bg-slate-50 border border-slate-200'
            }`}
          >
            {isDark ? <Sun size={15} /> : <Moon size={15} />}
          </button>
        </div>
      </div>

      {/* ─── Hero Section ─── */}
      <div className="px-5 pt-8 pb-6 text-center max-w-md mx-auto">
        <h1 className={`text-2xl sm:text-3xl font-black leading-snug mb-3 tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
          {t('landing.hero')}
        </h1>
        <p className={`text-xs sm:text-sm leading-relaxed max-w-sm mx-auto mb-7 font-medium ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
          {t('landing.heroSub')}
        </p>

        {/* Realistic Authentic Fintech Preview Card (Handcrafted look) */}
        <div className={`p-4 sm:p-5 rounded-3xl mb-7 text-left border shadow-lg transition-all ${
          isDark 
            ? 'bg-gradient-to-br from-slate-800/90 via-slate-800 to-slate-900 border-slate-700 shadow-black/40' 
            : 'bg-gradient-to-br from-white via-emerald-50/20 to-white border-emerald-100/80 shadow-emerald-500/5'
        }`} dir="ltr">
          {/* Card Top */}
          <div className="flex items-center justify-between text-xs mb-3 text-slate-400 font-semibold">
            <span className="flex items-center gap-1.5">
              <Wallet size={14} className="text-emerald-500" />
              <span>Octubre • Mauritanie (MRU)</span>
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold border border-emerald-500/20">
              Active Sync
            </span>
          </div>

          {/* Balance */}
          <div className="mb-4">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              {lang === 'ar' ? 'الرصيد الصافي' : lang === 'fr' ? 'Solde Net' : 'Net Balance'}
            </p>
            <p className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white mt-0.5">
              +28,500 <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">MRU</span>
            </p>
          </div>

          {/* Split Stats */}
          <div className="grid grid-cols-2 gap-2 mb-3.5">
            <div className={`p-2.5 rounded-2xl border ${isDark ? 'bg-slate-900/60 border-slate-700/60' : 'bg-emerald-50/60 border-emerald-100'}`}>
              <div className="flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                <ArrowDownRight size={13} />
                <span>{lang === 'ar' ? 'الدخل' : 'Income'}</span>
              </div>
              <p className="text-sm font-black mt-0.5 text-slate-800 dark:text-slate-100">45,000 MRU</p>
            </div>

            <div className={`p-2.5 rounded-2xl border ${isDark ? 'bg-slate-900/60 border-slate-700/60' : 'bg-rose-50/60 border-rose-100'}`}>
              <div className="flex items-center gap-1 text-[11px] font-bold text-rose-500">
                <ArrowUpRight size={13} />
                <span>{lang === 'ar' ? 'المصاريف' : 'Expenses'}</span>
              </div>
              <p className="text-sm font-black mt-0.5 text-slate-800 dark:text-slate-100">16,500 MRU</p>
            </div>
          </div>

          {/* Realistic Transactions Preview Chips */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar text-[11px] font-semibold text-slate-600 dark:text-slate-300">
            <span className="px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-700/60 whitespace-nowrap">
              🍽️ {lang === 'ar' ? 'طعام' : 'Food'} - 450 MRU
            </span>
            <span className="px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-700/60 whitespace-nowrap">
              🚗 {lang === 'ar' ? 'نقل' : 'Transport'} - 150 MRU
            </span>
            <span className="px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-700/60 whitespace-nowrap">
              ⚡ {lang === 'ar' ? 'فواتير' : 'Bills'} - 2,800 MRU
            </span>
          </div>
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col gap-3 max-w-xs mx-auto">
          <button
            onClick={() => setScreen('auth-signup')}
            className="w-full py-3.5 rounded-2xl font-extrabold text-white text-sm sm:text-base shadow-lg shadow-emerald-500/25 transition-all active:scale-95 hover:shadow-xl hover:scale-[1.01]"
            style={{ background: 'linear-gradient(135deg, #059669, #10B981)' }}
            id="masarifi-get-started"
          >
            {t('landing.getStarted')}
          </button>
          <button
            onClick={() => setScreen('auth-signin')}
            className={`w-full py-3.5 rounded-2xl font-bold text-sm sm:text-base border-2 transition-all active:scale-95 hover:scale-[1.01] ${
              isDark ? 'border-slate-700 text-slate-200 hover:bg-slate-800'
                     : 'border-slate-200 text-slate-700 hover:bg-slate-50 shadow-sm'
            }`}
            id="masarifi-signin"
          >
            {t('landing.signIn')}
          </button>
        </div>
      </div>

      {/* ─── Core Features ─── */}
      <div className={`mx-4 rounded-3xl p-5 mb-8 max-w-md mx-auto ${
        isDark ? 'bg-slate-800/80 border border-slate-700/80' : 'bg-white shadow-sm border border-slate-200/80'
      }`}>
        <p className={`text-[11px] font-bold uppercase tracking-wider mb-4 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
          {lang === 'ar' ? 'مميزات صُممت لراحتك المالية' : lang === 'fr' ? 'Fonctionnalités Clés' : 'Key Features'}
        </p>

        {features.map((f, i) => {
          const Icon = f.icon;
          return (
            <div key={i} className={`flex items-start gap-3.5 ${i < features.length - 1 ? 'mb-4 pb-4 border-b border-inherit' : ''}`}>
              <div className={`w-10 h-10 rounded-2xl ${f.bg} flex items-center justify-center flex-shrink-0 mt-0.5`}>
                <Icon size={19} className={f.color} />
              </div>
              <div>
                <p className={`font-bold text-sm ${isDark ? 'text-slate-100' : 'text-slate-800'}`}>{f.title}</p>
                <p className={`text-xs mt-0.5 leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{f.desc}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* ─── User Reviews / Testimonials ─── */}
      <div className="px-4 mb-8 max-w-md mx-auto">
        <p className={`text-xs font-bold uppercase tracking-wider mb-3 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
          {t('landing.testimonials')}
        </p>

        {featuredReviews.length === 0 ? (
          <div className={`p-5 rounded-2xl text-center border ${
            isDark ? 'bg-slate-800/60 border-slate-700' : 'bg-white border-slate-200/80 shadow-sm'
          }`}>
            <div className="w-12 h-12 rounded-full bg-emerald-50 dark:bg-emerald-950/40 flex items-center justify-center mx-auto mb-2 text-emerald-500">
              <MessageSquare size={22} />
            </div>
            <p className={`text-xs font-bold mb-0.5 ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>{t('review.noReviews')}</p>
            <p className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{t('review.beFirst')}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {featuredReviews.map((item) => (
              <div
                key={item.id}
                className={`p-4 rounded-2xl border ${isDark ? 'bg-slate-800/80 border-slate-700' : 'bg-white border-slate-200/80 shadow-sm'}`}
              >
                <StarRow count={item.stars} />
                <p className={`text-xs leading-relaxed mt-2 mb-2 font-medium ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                  "{item.comment}"
                </p>
                <div className="flex items-center justify-between text-[11px]">
                  <p className={`font-bold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                    — {item.userName}
                  </p>
                  <p className={`${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                    {new Date(item.date).toLocaleDateString(lang === 'ar' ? 'ar' : lang === 'fr' ? 'fr-FR' : 'en-GB', {
                      day: 'numeric', month: 'short', year: 'numeric',
                    })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ─── Footer with About link ─── */}
      <div className="border-t border-inherit/40 px-5 py-6 text-center text-xs text-slate-400 max-w-md mx-auto">
        <p className="font-semibold mb-2 text-slate-500 dark:text-slate-400">
          {lang === 'ar' ? 'تطبيق مصاريفي — صُنع لخدمة المجتمع الموريتاني 🇲🇷' : 'Masarifi — Crafted for the Mauritanian Community 🇲🇷'}
        </p>
        <div className="flex items-center justify-center gap-3 font-medium">
          <button
            onClick={() => setShowAbout(true)}
            className="hover:text-emerald-500 underline underline-offset-2 transition-colors"
          >
            {t('landing.aboutBtn')}
          </button>
          <span>•</span>
          <span>v2.3.0</span>
          <span>•</span>
          <span className="text-emerald-600 dark:text-emerald-400 font-bold">Mahfoud Khayri</span>
        </div>
      </div>

      {/* About Modal */}
      <AboutModal isOpen={showAbout} onClose={() => setShowAbout(false)} />
      <InstallPrompt />
    </div>
  );
}
