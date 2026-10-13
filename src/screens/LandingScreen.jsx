import React, { useState } from 'react';
import { Globe, Moon, Sun, TrendingDown, Shield, BarChart2, Star, MessageSquare } from 'lucide-react';
import { useMasarifi } from '../context/MasarifiContext';
import InstallPrompt from '../components/InstallPrompt';

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

  const features = [
    { icon: TrendingDown, title: t('landing.feature1Title'), desc: t('landing.feature1Desc'), color: 'text-emerald-500', bg: 'bg-emerald-50' },
    { icon: BarChart2,    title: t('landing.feature2Title'), desc: t('landing.feature2Desc'), color: 'text-blue-500',    bg: 'bg-blue-50'    },
    { icon: Shield,       title: t('landing.feature3Title'), desc: t('landing.feature3Desc'), color: 'text-violet-500', bg: 'bg-violet-50'  },
  ];

  return (
    <div
      className={`min-h-screen overflow-y-auto ${isDark ? 'bg-slate-900' : 'bg-gradient-to-br from-slate-50 via-white to-emerald-50'}`}
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      {/* Top bar */}
      <div className="flex items-center justify-between px-5 pt-6 pb-2">
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
                      ? 'bg-emerald-100 text-emerald-700 font-semibold'
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
          className="w-20 h-20 rounded-3xl mx-auto mb-5 flex items-center justify-center shadow-lg shadow-emerald-200"
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
            className="w-full py-4 rounded-2xl font-bold text-white text-base shadow-lg shadow-emerald-200 transition-all active:scale-95 hover:scale-[1.02]"
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
            <div className="w-14 h-14 rounded-full bg-amber-50 flex items-center justify-center mx-auto mb-3">
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
      <InstallPrompt />
    </div>
  );
}
