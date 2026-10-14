import React, { useState } from 'react';
import { Eye, EyeOff, TrendingDown, ArrowLeft, ArrowRight, Info, ShieldCheck } from 'lucide-react';
import { useMasarifi } from '../context/MasarifiContext';
import AboutModal from '../components/AboutModal';

export default function AuthScreen() {
  const { t, isDark, isRTL, signUp, signIn, screen, setScreen, lang } = useMasarifi();
  const isSignUp = screen === 'auth-signup';

  const [form, setForm] = useState({ name: '', password: '', confirmPassword: '' });
  const [errors, setErrors] = useState({});
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showAbout, setShowAbout] = useState(false);

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = t('auth.errors.required');
    if (!form.password) e.password = t('auth.errors.required');
    else if (form.password.length < 4) e.password = t('auth.errors.passwordShort');
    if (isSignUp && form.password !== form.confirmPassword) e.confirmPassword = t('auth.errors.passwordMismatch');
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setLoading(true);
    await new Promise((r) => setTimeout(r, 200));
    let result;
    if (isSignUp) {
      result = signUp(form.name.trim(), form.password);
      if (!result.success && result.error === 'nameExists') setErrors({ name: t('auth.errors.nameExists') });
    } else {
      result = signIn(form.name.trim(), form.password);
      if (!result.success) setErrors({ password: t('auth.errors.invalidCredentials') });
    }
    setLoading(false);
  };

  const BackArrow = isRTL ? ArrowRight : ArrowLeft;

  const inputClass = `w-full px-4 py-3.5 rounded-2xl text-sm outline-none transition-all border font-medium ${
    isDark
      ? 'bg-slate-800/90 border-slate-700 text-slate-100 placeholder-slate-500 focus:border-emerald-500'
      : 'bg-slate-50 border-slate-200 text-slate-800 placeholder-slate-400 focus:border-emerald-500 focus:bg-white'
  }`;
  const labelClass = `block text-xs font-bold mb-1.5 ${isDark ? 'text-slate-300' : 'text-slate-600'}`;

  const switchScreen = (s) => {
    setScreen(s);
    setErrors({});
    setForm({ name: '', password: '', confirmPassword: '' });
  };

  return (
    <div
      className={`min-h-screen flex flex-col ${isDark ? 'bg-slate-900 text-slate-100' : 'bg-gradient-to-br from-slate-50 via-white to-emerald-50 text-slate-900'}`}
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      {/* Top Header */}
      <div className="px-5 pt-6 pb-2 flex items-center justify-between max-w-md mx-auto w-full">
        <button
          onClick={() => setScreen('landing')}
          className={`flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-xl transition-colors ${
            isDark ? 'text-slate-400 hover:text-slate-200 bg-slate-800/60' : 'text-slate-600 hover:text-slate-900 bg-white shadow-sm border border-slate-200'
          }`}
          id="masarifi-back-btn"
        >
          <BackArrow size={16} />
          <span>{t('auth.backToLanding')}</span>
        </button>

        <button
          onClick={() => setShowAbout(true)}
          className={`flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-bold transition-colors ${
            isDark ? 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white border border-slate-700' : 'bg-white text-slate-700 shadow-sm hover:bg-slate-50 border border-slate-200'
          }`}
        >
          <Info size={14} className="text-emerald-500" />
          <span>{t('landing.aboutBtn')}</span>
        </button>
      </div>

      {/* Hero Icon & Title */}
      <div className="px-6 pt-5 pb-6 text-center max-w-md mx-auto w-full">
        <div
          className="w-14 h-14 rounded-2xl mx-auto mb-3 flex items-center justify-center shadow-lg shadow-emerald-500/20 text-white"
          style={{ background: 'linear-gradient(135deg, #059669, #10B981)' }}
        >
          <span className="font-extrabold text-2xl">م</span>
        </div>
        <h1 className={`text-2xl font-black mb-1 tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
          {isSignUp ? t('auth.createAccount') : t('auth.loginAccount')}
        </h1>
        <p className={`text-xs font-semibold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
          {lang === 'ar' ? 'أداة مالية صُممت للمجتمع الموريتاني' : 'Personal finance for Mauritania'}
        </p>
      </div>

      {/* Main Form Card */}
      <div className={`mx-4 rounded-3xl p-6 sm:p-7 flex-1 max-w-md md:mx-auto w-full border shadow-xl ${
        isDark ? 'bg-slate-800/90 border-slate-700/80' : 'bg-white border-slate-200 shadow-emerald-500/5'
      }`}>
        {/* Tab switcher */}
        <div className={`flex mb-6 rounded-2xl p-1 border ${isDark ? 'bg-slate-900/80 border-slate-700/80' : 'bg-slate-100 border-slate-200/60'}`}>
          {[
            { label: t('auth.signIn'), s: 'auth-signin' },
            { label: t('auth.signUp'), s: 'auth-signup' },
          ].map((tab) => (
            <button
              key={tab.s}
              onClick={() => switchScreen(tab.s)}
              className={`flex-1 py-2 rounded-xl text-xs font-extrabold transition-all ${
                screen === tab.s
                  ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20'
                  : isDark
                  ? 'text-slate-400 hover:text-slate-200'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
              id={`masarifi-tab-${tab.s}`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Username / Name field for both Sign In and Sign Up */}
        <div className="mb-4">
          <label className={labelClass}>{t('auth.name')}</label>
          <input
            type="text"
            className={inputClass}
            placeholder={t('auth.namePlaceholder')}
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            id="masarifi-auth-name"
          />
          {errors.name && <p className="text-red-500 text-xs mt-1 font-semibold">{errors.name}</p>}
        </div>

        {/* Password */}
        <div className="mb-4">
          <label className={labelClass}>{t('auth.password')}</label>
          <div className="relative">
            <input
              type={showPass ? 'text' : 'password'}
              className={`${inputClass} ${isRTL ? 'pl-10' : 'pr-10'}`}
              placeholder={t('auth.passwordPlaceholder')}
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              id="masarifi-auth-password"
            />
            <button
              type="button"
              onClick={() => setShowPass(!showPass)}
              className={`absolute top-1/2 -translate-y-1/2 ${isRTL ? 'left-3' : 'right-3'} text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1`}
            >
              {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          {errors.password && <p className="text-red-500 text-xs mt-1 font-semibold">{errors.password}</p>}
        </div>

        {/* Confirm password on Sign Up */}
        {isSignUp && (
          <div className="mb-5">
            <label className={labelClass}>{t('auth.confirmPassword')}</label>
            <div className="relative">
              <input
                type={showConfirm ? 'text' : 'password'}
                className={`${inputClass} ${isRTL ? 'pl-10' : 'pr-10'}`}
                placeholder={t('auth.confirmPasswordPlaceholder')}
                value={form.confirmPassword}
                onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                id="masarifi-auth-confirm-password"
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className={`absolute top-1/2 -translate-y-1/2 ${isRTL ? 'left-3' : 'right-3'} text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1`}
              >
                {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {errors.confirmPassword && <p className="text-red-500 text-xs mt-1 font-semibold">{errors.confirmPassword}</p>}
          </div>
        )}

        <button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full py-3.5 rounded-2xl font-extrabold text-white text-sm transition-all active:scale-95 disabled:opacity-70 shadow-lg shadow-emerald-500/25 mt-2"
          style={{ background: 'linear-gradient(135deg, #059669, #10B981)' }}
          id="masarifi-auth-submit"
        >
          {loading ? t('common.loading') : isSignUp ? t('auth.createAccount') : t('auth.loginAccount')}
        </button>

        <p className={`text-center text-xs mt-4 font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
          {isSignUp ? t('auth.hasAccount') : t('auth.noAccount')}{' '}
          <button
            onClick={() => switchScreen(isSignUp ? 'auth-signin' : 'auth-signup')}
            className="text-emerald-600 dark:text-emerald-400 font-bold hover:underline"
            id="masarifi-auth-switch"
          >
            {isSignUp ? t('auth.loginAccount') : t('auth.createAccount')}
          </button>
        </p>

        {/* Bottom About Link */}
        <div className="mt-6 pt-4 border-t border-inherit text-center text-xs text-slate-400">
          <button
            onClick={() => setShowAbout(true)}
            className="hover:text-emerald-500 underline underline-offset-2 transition-colors font-semibold"
          >
            {t('landing.aboutBtn')} • {lang === 'ar' ? 'عن المطور والتطبيق' : 'About Developer'}
          </button>
        </div>
      </div>

      <div className="h-6" />

      {/* About Modal */}
      <AboutModal isOpen={showAbout} onClose={() => setShowAbout(false)} />
    </div>
  );
}
