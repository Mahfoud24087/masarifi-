import React, { useState } from 'react';
import { Eye, EyeOff, TrendingDown, ArrowLeft, ArrowRight, Info, Shield } from 'lucide-react';
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
      result = await signUp(form.name.trim(), form.password);
      if (result && !result.success && result.error === 'nameExists')
        setErrors({ name: t('auth.errors.nameExists') });
    } else {
      result = await signIn(form.name.trim(), form.password);
      if (result && !result.success)
        setErrors({ password: t('auth.errors.invalidCredentials') });
    }
    setLoading(false);
  };

  const BackArrow = isRTL ? ArrowRight : ArrowLeft;

  const inputClass = `w-full px-4 py-3.5 rounded-2xl text-sm outline-none transition-all border ${
    isDark
      ? 'bg-slate-700 border-slate-600 text-slate-100 placeholder-slate-500 focus:border-emerald-500'
      : 'bg-slate-50 border-slate-200 text-slate-800 placeholder-slate-400 focus:border-emerald-400 focus:bg-white'
  }`;
  const labelClass = `block text-xs font-semibold mb-1.5 ${isDark ? 'text-slate-300' : 'text-slate-600'}`;

  const switchScreen = (s) => {
    setScreen(s);
    setErrors({});
    setForm({ name: '', password: '', confirmPassword: '' });
  };

  return (
    <div
      className={`min-h-screen flex flex-col ${isDark ? 'bg-slate-900 text-slate-100' : 'bg-gradient-to-br from-slate-50 to-emerald-50 text-slate-900'}`}
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      {/* Top Bar */}
      <div className="px-5 pt-6 flex items-center justify-between">
        <button
          onClick={() => setScreen('landing')}
          className={`flex items-center gap-2 text-sm font-medium px-3 py-2 rounded-xl transition-colors ${
            isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-500 hover:text-slate-800'
          }`}
          id="masarifi-back-btn"
        >
          <BackArrow size={18} />
          {t('auth.backToLanding')}
        </button>

        <button
          onClick={() => setShowAbout(true)}
          className={`flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-xl transition-colors ${
            isDark ? 'text-slate-400 hover:text-slate-200 bg-slate-800/60' : 'text-slate-500 hover:text-slate-800 bg-white shadow-sm border border-slate-100'
          }`}
        >
          <Info size={14} className="text-emerald-500" />
          <span>{lang === 'ar' ? 'حول التطبيق' : lang === 'fr' ? 'À propos' : 'About'}</span>
        </button>
      </div>

      {/* Hero Icon */}
      <div className="px-6 pt-6 pb-8 text-center">
        <div
          className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center shadow-lg shadow-emerald-200 dark:shadow-emerald-950/40"
          style={{ background: 'linear-gradient(135deg, #059669, #10B981)' }}
        >
          <TrendingDown size={30} className="text-white" />
        </div>
        <h1 className={`text-2xl font-extrabold mb-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>
          {isSignUp ? t('auth.createAccount') : t('auth.loginAccount')}
        </h1>
        <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{t('appName')}</p>
      </div>

      {/* Form Card */}
      <div className={`mx-4 rounded-3xl p-6 flex-1 max-w-md md:mx-auto w-full ${isDark ? 'bg-slate-800' : 'bg-white shadow-md border border-slate-100'}`}>
        {/* Tab switcher */}
        <div className={`flex mb-6 rounded-2xl p-1 ${isDark ? 'bg-slate-700' : 'bg-slate-100'}`}>
          {[
            { label: t('auth.signIn'), s: 'auth-signin' },
            { label: t('auth.signUp'), s: 'auth-signup' },
          ].map((tab) => (
            <button
              key={tab.s}
              onClick={() => switchScreen(tab.s)}
              className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                screen === tab.s
                  ? 'bg-white text-emerald-700 shadow-sm dark:bg-slate-800 dark:text-emerald-400'
                  : isDark
                  ? 'text-slate-400'
                  : 'text-slate-500'
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
          {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
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
              className={`absolute top-1/2 -translate-y-1/2 ${isRTL ? 'left-3' : 'right-3'} text-slate-400`}
            >
              {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
        </div>

        {/* Confirm password on Sign Up */}
        {isSignUp && (
          <div className="mb-6">
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
                className={`absolute top-1/2 -translate-y-1/2 ${isRTL ? 'left-3' : 'right-3'} text-slate-400`}
              >
                {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {errors.confirmPassword && <p className="text-red-500 text-xs mt-1">{errors.confirmPassword}</p>}
          </div>
        )}

        <button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full py-4 rounded-2xl font-bold text-white text-base transition-all active:scale-95 disabled:opacity-70 mt-2"
          style={{ background: 'linear-gradient(135deg, #059669, #10B981)' }}
          id="masarifi-auth-submit"
        >
          {loading ? t('common.loading') : isSignUp ? t('auth.createAccount') : t('auth.loginAccount')}
        </button>

        <p className={`text-center text-sm mt-4 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
          {isSignUp ? t('auth.hasAccount') : t('auth.noAccount')}{' '}
          <button
            onClick={() => switchScreen(isSignUp ? 'auth-signin' : 'auth-signup')}
            className="text-emerald-600 font-semibold hover:underline"
            id="masarifi-auth-switch"
          >
            {isSignUp ? t('auth.loginAccount') : t('auth.createAccount')}
          </button>
        </p>
      </div>

      {/* Discreet Admin Entry */}
      <div className="flex items-center justify-center pb-6">
        <button
          onClick={() => setScreen('admin')}
          className="flex items-center gap-1.5 text-xs text-slate-400/60 hover:text-emerald-500 transition-colors px-3 py-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/50"
          id="masarifi-admin-login-entry"
          title={t('admin.pinTitle')}
        >
          <Shield size={13} />
          <span className="text-[11px] font-medium">{t('admin.pinTitle')}</span>
        </button>
      </div>

      {/* About Modal */}
      <AboutModal isOpen={showAbout} onClose={() => setShowAbout(false)} />
    </div>
  );
}
