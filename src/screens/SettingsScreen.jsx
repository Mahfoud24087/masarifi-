import React, { useState } from 'react';
import { Sun, Moon, Globe, User, Lock, LogOut, Info, ChevronRight, ChevronLeft, Check, Download, Target, Star } from 'lucide-react';
import { useMasarifi } from '../context/MasarifiContext';
import { EXPENSE_CATEGORIES } from '../models/categories';

const LANGS = [
  { code: 'ar', label: 'العربية', flag: '🇲🇷' },
  { code: 'fr', label: 'Français', flag: '🇫🇷' },
  { code: 'en', label: 'English', flag: '🇬🇧' },
];

function EditProfileForm({ onClose }) {
  const { t, isDark, user, updateProfile, showToast } = useMasarifi();
  const [name, setName] = useState(user?.name || '');
  const [error, setError] = useState('');
  const handleSave = () => {
    if (!name.trim()) { setError(t('auth.errors.required')); return; }
    const r = updateProfile({ name: name.trim() });
    if (r.success) { showToast('✅ ' + t('settings.profileUpdated')); onClose(); }
  };
  const inp = `w-full px-4 py-3 rounded-2xl text-sm outline-none border ${isDark ? 'bg-slate-700 border-slate-600 text-slate-100 focus:border-emerald-500' : 'bg-slate-50 border-slate-200 text-slate-800 focus:border-emerald-400'}`;
  return (
    <div className="space-y-3 pt-2">
      <div>
        <label className={`block text-xs font-semibold mb-1.5 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{t('settings.name')}</label>
        <input type="text" className={inp} value={name} onChange={e => setName(e.target.value)} id="masarifi-profile-name" />
        {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
      </div>
      <div className="flex gap-3">
        <button onClick={onClose} className={`flex-1 py-3 rounded-2xl text-sm font-semibold ${isDark ? 'bg-slate-700 text-slate-200' : 'bg-slate-100 text-slate-700'}`}>{t('settings.cancel')}</button>
        <button onClick={handleSave} className="flex-1 py-3 rounded-2xl text-sm font-semibold text-white" style={{ background: 'linear-gradient(135deg,#059669,#10B981)' }} id="masarifi-save-profile">{t('settings.save')}</button>
      </div>
    </div>
  );
}

function ChangePasswordForm({ onClose }) {
  const { t, isDark, changePassword, showToast } = useMasarifi();
  const [form, setForm] = useState({ current: '', newPass: '', confirm: '' });
  const [errors, setErrors] = useState({});
  const handleSave = () => {
    const e = {};
    if (!form.current) e.current = t('auth.errors.required');
    if (!form.newPass) e.newPass = t('auth.errors.required');
    else if (form.newPass.length < 6) e.newPass = t('auth.errors.passwordShort');
    if (form.newPass !== form.confirm) e.confirm = t('auth.errors.passwordMismatch');
    setErrors(e);
    if (Object.keys(e).length > 0) return;
    const r = changePassword(form.current, form.newPass);
    if (r.success) { showToast('✅ ' + t('settings.passwordChanged')); onClose(); }
    else setErrors({ current: t('settings.wrongPassword') });
  };
  const inp = `w-full px-4 py-3 rounded-2xl text-sm outline-none border ${isDark ? 'bg-slate-700 border-slate-600 text-slate-100 focus:border-emerald-500' : 'bg-slate-50 border-slate-200 text-slate-800 focus:border-emerald-400'}`;
  return (
    <div className="space-y-3 pt-2">
      {[{ label: t('settings.currentPassword'), key: 'current' }, { label: t('settings.newPassword'), key: 'newPass' }, { label: t('settings.confirmNewPassword'), key: 'confirm' }].map(({ label, key }) => (
        <div key={key}>
          <label className={`block text-xs font-semibold mb-1.5 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{label}</label>
          <input type="password" className={inp} value={form[key]} onChange={e => setForm({ ...form, [key]: e.target.value })} id={`masarifi-pw-${key}`} />
          {errors[key] && <p className="text-red-500 text-xs mt-1">{errors[key]}</p>}
        </div>
      ))}
      <div className="flex gap-3 pt-1">
        <button onClick={onClose} className={`flex-1 py-3 rounded-2xl text-sm font-semibold ${isDark ? 'bg-slate-700 text-slate-200' : 'bg-slate-100 text-slate-700'}`}>{t('settings.cancel')}</button>
        <button onClick={handleSave} className="flex-1 py-3 rounded-2xl text-sm font-semibold text-white" style={{ background: 'linear-gradient(135deg,#059669,#10B981)' }} id="masarifi-save-password">{t('settings.save')}</button>
      </div>
    </div>
  );
}

function BudgetsSection({ isDark, t, isRTL }) {
  const { getBudget, saveBudget } = useMasarifi();
  const [localBudgets, setLocalBudgets] = useState(() =>
    EXPENSE_CATEGORIES.reduce((acc, cat) => ({ ...acc, [cat.id]: String(getBudget(cat.id) || '') }), {})
  );
  const [saved, setSaved] = useState(false);
  const handleSave = () => {
    EXPENSE_CATEGORIES.forEach(cat => { if (localBudgets[cat.id] !== '') saveBudget(cat.id, parseFloat(localBudgets[cat.id]) || 0); });
    setSaved(true); setTimeout(() => setSaved(false), 2000);
  };
  const inp = `w-28 px-3 py-2 rounded-xl text-sm outline-none border text-end ${isDark ? 'bg-slate-700 border-slate-600 text-slate-100 focus:border-emerald-500' : 'bg-slate-50 border-slate-200 text-slate-800 focus:border-emerald-400'}`;
  return (
    <div className="pt-2 space-y-2" dir={isRTL ? 'rtl' : 'ltr'}>
      {EXPENSE_CATEGORIES.map(cat => {
        const Icon = cat.icon;
        return (
          <div key={cat.id} className={`flex items-center justify-between px-2 py-1.5 rounded-2xl ${isDark ? 'bg-slate-700' : 'bg-slate-50'}`}>
            <div className="flex items-center gap-2">
              <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${cat.bg} ${cat.text}`}><Icon size={13} /></div>
              <span className={`text-xs font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>{t(`categories.${cat.id}`)}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <input type="number" dir="ltr" value={localBudgets[cat.id]} onChange={e => setLocalBudgets(p => ({ ...p, [cat.id]: e.target.value }))}
                placeholder="0" className={inp} id={`masarifi-budget-${cat.id}`} />
              <span className={`text-[10px] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{t('common.currency')}</span>
            </div>
          </div>
        );
      })}
      <button onClick={handleSave} className="w-full py-3 mt-2 rounded-2xl text-sm font-bold text-white transition-all active:scale-95"
        style={{ background: saved ? '#10B981' : 'linear-gradient(135deg,#059669,#10B981)' }} id="masarifi-save-budgets">
        {saved ? '✅ Saved!' : t('budget.save')}
      </button>
    </div>
  );
}

export default function SettingsScreen() {
  const { t, isDark, isRTL, lang, setLang, toggleTheme, user, signOut, setConfirmDialog, expenses, exportToCSV, showToast, totalExpenses, setShowReviewModal, userReview } = useMasarifi();
  const [expanded, setExpanded] = useState(null);
  const toggle = s => setExpanded(expanded === s ? null : s);
  const Arrow = isRTL ? ChevronLeft : ChevronRight;

  const cardBg  = isDark ? 'bg-slate-800' : 'bg-white shadow-sm border border-slate-100';
  const textPri = isDark ? 'text-slate-100' : 'text-slate-800';
  const textSec = isDark ? 'text-slate-400' : 'text-slate-500';
  const divider = `border-b ${isDark ? 'border-slate-700' : 'border-slate-100'}`;

  const handleExport = () => {
    exportToCSV();
    showToast('📥 ' + t('settings.exportSuccess'));
  };

  const Row = ({ icon: Icon, label, value, onClick, iconBg = 'bg-emerald-100', iconColor = 'text-emerald-600', danger = false }) => (
    <button onClick={onClick} className={`w-full flex items-center gap-3 py-3.5 ${divider} last:border-b-0 transition-colors hover:opacity-75 active:opacity-50`}>
      <div className={`w-9 h-9 rounded-xl ${iconBg} flex items-center justify-center flex-shrink-0`}><Icon size={17} className={iconColor} /></div>
      <div className="flex-1 text-start">
        <p className={`text-sm font-medium ${danger ? 'text-red-500' : textPri}`}>{label}</p>
        {value && <p className={`text-xs ${textSec} mt-0.5`}>{value}</p>}
      </div>
      <Arrow size={15} className={textSec} />
    </button>
  );

  return (
    <div className="px-4 pt-6" dir={isRTL ? 'rtl' : 'ltr'}>
      <h1 className={`text-xl font-extrabold mb-5 ${textPri}`}>{t('settings.title')}</h1>

      {/* Profile card */}
      <div className={`rounded-3xl p-5 mb-4 ${cardBg}`}>
        <div className="flex items-center gap-4 mb-4">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-white font-bold text-xl shadow"
            style={{ background: 'linear-gradient(135deg,#059669,#10B981)' }}>
            {user?.name?.[0]?.toUpperCase() || 'M'}
          </div>
          <div className="flex-1 min-w-0">
            <p className={`font-bold text-base truncate ${textPri}`}>{user?.name}</p>
            <p className={`text-xs ${textSec} mt-0.5`}>
              {t('settings.memberSince')} {new Date(user?.createdAt || Date.now()).toLocaleDateString(lang === 'ar' ? 'ar-MR' : 'fr-FR', { month: 'long', year: 'numeric' })}
            </p>
          </div>
        </div>
        <div className={`rounded-2xl p-3 flex items-center justify-between ${isDark ? 'bg-slate-700' : 'bg-emerald-50'}`}>
          <p className={`text-xs font-semibold ${isDark ? 'text-slate-300' : 'text-emerald-700'}`}>{t('settings.totalExpenses')}</p>
          <p className={`text-sm font-bold ${isDark ? 'text-emerald-400' : 'text-emerald-700'}`} dir="ltr">
            {totalExpenses.toLocaleString()} {t('common.currency')}
          </p>
        </div>
      </div>

      {/* Account section */}
      <div className={`rounded-3xl p-5 mb-4 ${cardBg}`}>
        <p className={`text-[10px] font-bold uppercase tracking-widest mb-3 ${textSec}`}>{t('settings.profile')}</p>
        <Row icon={User} label={t('settings.editProfile')} value={user?.name} onClick={() => toggle('profile')} />
        {expanded === 'profile' && <EditProfileForm onClose={() => setExpanded(null)} />}
        <Row icon={Lock} label={t('settings.changePassword')} onClick={() => toggle('password')} iconBg="bg-blue-100" iconColor="text-blue-600" />
        {expanded === 'password' && <ChangePasswordForm onClose={() => setExpanded(null)} />}
      </div>

      {/* Budgets */}
      <div className={`rounded-3xl p-5 mb-4 ${cardBg}`}>
        <p className={`text-[10px] font-bold uppercase tracking-widest mb-3 ${textSec}`}>{t('settings.budgets')}</p>
        <Row icon={Target} label={t('budget.perCategory')} value={t('budget.monthlyBudget')} onClick={() => toggle('budgets')} iconBg="bg-amber-100" iconColor="text-amber-600" />
        {expanded === 'budgets' && <BudgetsSection isDark={isDark} t={t} isRTL={isRTL} />}
      </div>

      {/* Preferences */}
      <div className={`rounded-3xl p-5 mb-4 ${cardBg}`}>
        <p className={`text-[10px] font-bold uppercase tracking-widest mb-3 ${textSec}`}>Préférences</p>

        {/* Theme */}
        <div className={`flex items-center gap-3 py-3.5 ${divider}`}>
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${isDark ? 'bg-amber-100' : 'bg-slate-100'}`}>
            {isDark ? <Moon size={17} className="text-amber-600" /> : <Sun size={17} className="text-slate-600" />}
          </div>
          <div className="flex-1">
            <p className={`text-sm font-medium ${textPri}`}>{t('settings.theme')}</p>
            <p className={`text-xs ${textSec}`}>{isDark ? t('settings.darkMode') : t('settings.lightMode')}</p>
          </div>
          <button onClick={toggleTheme} className={`relative w-11 h-6 rounded-full transition-colors ${isDark ? 'bg-emerald-500' : 'bg-slate-200'}`} id="masarifi-theme-toggle">
            <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${isDark ? (isRTL ? 'left-0.5' : 'right-0.5') : (isRTL ? 'right-0.5' : 'left-0.5')}`} />
          </button>
        </div>

        {/* Language grid */}
        <div className="py-3.5">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-9 h-9 rounded-xl bg-violet-100 flex items-center justify-center"><Globe size={17} className="text-violet-600" /></div>
            <p className={`text-sm font-medium flex-1 ${textPri}`}>{t('settings.language')}</p>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {LANGS.map(l => (
              <button key={l.code} onClick={() => setLang(l.code)}
                className={`flex flex-col items-center gap-1 py-2.5 rounded-2xl border-2 text-sm transition-all ${lang === l.code ? 'border-emerald-500 bg-emerald-50 text-emerald-700 font-semibold' : isDark ? 'border-slate-700 text-slate-300' : 'border-slate-100 text-slate-600'}`}
                id={`masarifi-lang-${l.code}`}>
                <span className="text-xl">{l.flag}</span>
                <span className="text-xs">{l.label}</span>
                {lang === l.code && <Check size={11} className="text-emerald-600" />}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Data */}
      <div className={`rounded-3xl p-5 mb-4 ${cardBg}`}>
        <p className={`text-[10px] font-bold uppercase tracking-widest mb-3 ${textSec}`}>{t('settings.exportData')}</p>
        <button onClick={handleExport}
          className={`w-full flex items-center gap-3 py-3.5 rounded-2xl transition-colors hover:opacity-75`} id="masarifi-export-csv">
          <div className="w-9 h-9 rounded-xl bg-teal-100 flex items-center justify-center"><Download size={17} className="text-teal-600" /></div>
          <div className="flex-1 text-start">
            <p className={`text-sm font-medium ${textPri}`}>{t('settings.exportCSV')}</p>
            <p className={`text-xs ${textSec}`}>{expenses.length} transactions</p>
          </div>
          <Arrow size={15} className={textSec} />
        </button>
      </div>

      {/* About & Developer */}
      <div className={`rounded-3xl p-5 mb-4 ${cardBg}`}>
        <p className={`text-[10px] font-bold uppercase tracking-widest mb-3 ${textSec}`}>{t('settings.about')}</p>
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-white shadow-md shadow-emerald-500/20">
            <Info size={19} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <p className={`text-base font-extrabold ${textPri}`}>{t('appName')}</p>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                SupNum 2026
              </span>
            </div>
            <p className={`text-xs ${textSec} font-semibold mt-0.5`}>{t('settings.developerTitle')}</p>
          </div>
        </div>
        <p className={`text-xs ${textSec} leading-relaxed bg-slate-50 dark:bg-slate-900/60 p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800`}>
          {t('settings.appDescription')}
        </p>
      </div>

      {/* Rate the App */}
      <div className={`rounded-3xl p-5 mb-4 ${cardBg}`}>
        <p className={`text-[10px] font-bold uppercase tracking-widest mb-3 ${textSec}`}>{t('review.sectionTitle')}</p>
        <button
          onClick={() => setShowReviewModal(true)}
          className="w-full flex items-center gap-3 py-3.5 transition-colors hover:opacity-75"
          id="masarifi-rate-app"
        >
          <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center">
            <Star size={17} className="text-amber-500 fill-amber-400" />
          </div>
          <div className="flex-1 text-start">
            <p className={`text-sm font-medium ${textPri}`}>{userReview ? t('review.editTitle') : t('review.title')}</p>
            {userReview ? (
              <div className="flex items-center gap-1 mt-0.5">
                {[1,2,3,4,5].map(s => (
                  <Star key={s} size={11} className={s <= userReview.stars ? 'text-amber-400 fill-amber-400' : 'text-slate-300'} />
                ))}
                <span className={`text-xs ml-1 ${textSec}`}>{userReview.comment.slice(0,30)}{userReview.comment.length > 30 ? '…' : ''}</span>
              </div>
            ) : (
              <p className={`text-xs ${textSec}`}>{t('review.subtitle')}</p>
            )}
          </div>
          <Arrow size={15} className={textSec} />
        </button>
      </div>

      {/* Sign out */}
      <div className={`rounded-3xl overflow-hidden mb-8 ${cardBg}`}>
        <button onClick={() => setConfirmDialog({ title: t('settings.signOut'), message: t('settings.signOutConfirm'), onConfirm: signOut })}
          className="w-full flex items-center gap-3 px-5 py-4 transition-colors hover:bg-red-50"
          id="masarifi-signout">
          <div className="w-9 h-9 rounded-xl bg-red-100 flex items-center justify-center"><LogOut size={17} className="text-red-500" /></div>
          <span className="text-sm font-semibold text-red-500">{t('settings.signOut')}</span>
        </button>
      </div>
    </div>
  );
}
