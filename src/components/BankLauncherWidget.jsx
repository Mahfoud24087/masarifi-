import { useState, useRef, useEffect, useCallback } from 'react';
import { useMasarifi } from '../context/MasarifiContext';
import { ArrowUpRight, X, Check } from 'lucide-react';

/* ------------------------------------------------------------------ */
/* Banks                                                               */
/* Classes are written out in full so Tailwind can detect them.        */
/* ------------------------------------------------------------------ */
const playStoreUrl = (pkg) =>
  `https://play.google.com/store/apps/details?id=${pkg}`;

// 3 Mauritanian Banks configuration
export const MAURITANIAN_BANKS = [
  {
    id: 'bankily',
    name: 'Bankily',
    nameAr: 'بنكيلي',
    pkg: 'mr.bpm.digitalbanking.consumer',
    iosScheme: 'bankily://',
    iosUrl: 'https://www.bankily.mr',
    appStoreUrl: 'https://apps.apple.com/app/bankily/id1460115201',
    color: 'from-emerald-500 to-emerald-700',
    bgLight: 'bg-emerald-50',
    bgDark: 'bg-emerald-950/40',
    border: 'border-emerald-500/30',
    textLight: 'text-emerald-700',
    textDark: 'text-emerald-300',
  },
  {
    id: 'masrvi',
    name: 'Masrvi',
    nameAr: 'مصرفي',
    pkg: 'com.tagpay.mwallet.masrvi',
    iosScheme: 'masrvi://',
    iosUrl: 'https://masrvi.mr',
    appStoreUrl: 'https://apps.apple.com/app/id1540766096',
    color: 'from-rose-500 to-red-700',
    bgLight: 'bg-rose-50',
    bgDark: 'bg-rose-950/40',
    border: 'border-rose-500/30',
    textLight: 'text-rose-700',
    textDark: 'text-rose-300',
  },
  {
    id: 'sedad',
    name: 'Sedad',
    nameAr: 'السداد',
    pkg: 'mr.digi.sedad',
    iosScheme: 'sedad://',
    iosUrl: 'https://web.sedad.sbs',
    appStoreUrl: 'https://apps.apple.com/app/id1613951511',
    color: 'from-indigo-500 to-blue-700',
    bgLight: 'bg-blue-50',
    bgDark: 'bg-blue-950/40',
    border: 'border-blue-500/30',
    textLight: 'text-blue-700',
    textDark: 'text-blue-300',
  },
];

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */
const isAndroid = () =>
  typeof navigator !== 'undefined' && /android/i.test(navigator.userAgent);

const isIOS = () =>
  typeof navigator !== 'undefined' && /iphone|ipad|ipod/i.test(navigator.userAgent);

/**
 * Android: launcher intent opens the installed app directly by package name.
 * Falls back to Play Store if the app is not installed.
 */
function buildIntentUrl(bank) {
  const fallback = encodeURIComponent(playStoreUrl(bank.pkg));
  return (
    'intent://#Intent;' +
    'action=android.intent.action.MAIN;' +
    'category=android.intent.category.LAUNCHER;' +
    `package=${bank.pkg};` +
    `S.browser_fallback_url=${fallback};` +
    'end'
  );
}

/**
 * iOS Clean & Safe Launcher:
 * Uses clean App Store direct links in a new tab.
 * Zero Safari "invalid address" alerts.
 * Shows "OPEN" button directly if installed, or "GET" if not installed.
 */
function openOnIOS(bank) {
  const targetUrl = bank.appStoreUrl || `https://apps.apple.com/app/id${bank.id === 'bankily' ? '1460115201' : bank.id === 'sedad' ? '1613951511' : '1540766096'}`;
  window.open(targetUrl, '_blank', 'noopener,noreferrer');
}

const TEXT = {
  title: { ar: 'فتح وتسجيل مباشر', fr: 'Accès direct', en: '1-Tap Pay' },
  header: { ar: 'البنوك والمحافظ', fr: 'Banques & Portefeuilles', en: 'Bank & Wallets' },
  reminder: {
    ar: (n) => `أهلاً بعودتك من ${n}! 👋 هل أرسلت أو دفعت أموالاً للتو؟`,
    fr: (n) => `De retour de ${n} ! Avez-vous envoyé de l'argent ?`,
    en: (n) => `Back from ${n}! Did you send or spend money?`,
  },
  log: { ar: 'نعم، سجّل المصروف', fr: 'Oui, enregistrer', en: 'Yes, Log It' },
  dismiss: { ar: 'لا', fr: 'Non', en: 'No' },
};

/* ------------------------------------------------------------------ */
/* Component                                                           */
/* ------------------------------------------------------------------ */
export default function BankLauncherWidget() {
  const { user, isDark, isRTL, lang, setShowExpenseForm, setEditingExpense } = useMasarifi();

  const pendingBankRef = useRef(null);
  const [reminderBank, setReminderBank] = useState(null);

  // Beta testers: only these accounts can see the widget
  // Anonyme    → Android tester
  // Zeinbou khairy → iOS tester
  const BETA_TESTERS = ['anonyme', 'zeinbou khairy'];
  const isBetaTester = BETA_TESTERS.includes(user?.name?.trim().toLowerCase());

  // Only remember which bank was tapped. Do NOT preventDefault or window.open —
  // that would break the intent navigation.
  const handleBankClick = useCallback((bank) => {
    pendingBankRef.current = bank;
  }, []);

  // When the user comes back to Masarifi, show the expense reminder.
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === 'visible' && pendingBankRef.current) {
        setReminderBank(pendingBankRef.current);
        pendingBankRef.current = null;
      }
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, []);

  if (!isBetaTester) return null;

  const t = (key, ...args) => {
    const v = TEXT[key]?.[lang] ?? TEXT[key]?.en;
    return typeof v === 'function' ? v(...args) : v;
  };

  const bankName = (b) => (lang === 'ar' ? b.nameAr : b.name);

  // When user confirms they made a payment, open a NEW expense form (not edit).
  // We must set editingExpense to null first so the form calls addExpense (not updateExpense).
  // We then use sessionStorage to pass pre-fill hints that the form reads on mount.
  const handleLogExpense = (bank) => {
    // Clear any existing editing state so the form goes into "add new" mode
    setEditingExpense(null);
    // Store pre-fill data so ExpenseFormSheet can pick it up via sessionStorage
    sessionStorage.setItem(
      'masarifi_prefill_expense',
      JSON.stringify({
        title: `${bank.name} Transfer`,
        amount: '',
        category: 'other',
        date: new Date().toISOString().split('T')[0],
        notes: `Via ${bank.name}`,
        type: 'expense',
      })
    );
    setShowExpenseForm(true);
    setReminderBank(null);
  };

  return (
    <div className="mb-4" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* ── Expense Reminder (shown after returning from bank app) ── */}
      {reminderBank && (
        <div
          role="status"
          className={`p-4 rounded-3xl mb-3 border shadow-lg backdrop-blur-md ${
            isDark
              ? 'bg-slate-800/95 border-emerald-500/40 text-white'
              : 'bg-emerald-50/95 border-emerald-300 text-slate-800'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              ⚡ {t('title')}
            </span>
            <button onClick={() => setReminderBank(null)} className="text-slate-400 hover:text-slate-600 p-1">
              <X size={15} />
            </button>
          </div>
          <p className="text-sm font-bold leading-snug">
            {t('reminder', bankName(reminderBank))}
          </p>
          <div className="flex items-center gap-2 mt-3">
            <button
              onClick={() => handleLogExpense(reminderBank)}
              className="flex-1 py-2.5 px-3 rounded-2xl text-xs font-extrabold text-white bg-gradient-to-r from-emerald-600 to-teal-600 shadow-md transition-all active:scale-95 flex items-center justify-center gap-1.5"
            >
              <Check size={14} />
              <span>{t('log')}</span>
            </button>
            <button
              onClick={() => setReminderBank(null)}
              className={`py-2.5 px-3 rounded-2xl text-xs font-semibold ${
                isDark ? 'bg-slate-700 text-slate-300' : 'bg-white border text-slate-600'
              }`}
            >
              {t('dismiss')}
            </button>
          </div>
        </div>
      )}

      {/* ── 3-Bank Launcher Section ── */}
      <div
        className={`rounded-3xl border p-4 ${
          isDark
            ? 'bg-slate-800/60 border-slate-700 text-slate-100'
            : 'bg-white border-slate-200 text-slate-900'
        }`}
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold">{t('header')}</span>
            <span className="text-[10px] font-black px-1.5 py-0.5 rounded-md bg-amber-500/20 text-amber-400">
              BETA
            </span>
          </div>
          <span className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            {t('title')}
          </span>
        </div>

        {/*
          Android: launcher intent opens the installed app directly
                   (falls back to the Play Store if not installed).
          Other:   opens the Play Store page in a new tab.
        */}
        <div className="grid grid-cols-3 gap-2">
          {MAURITANIAN_BANKS.map((b) => {
            const android = isAndroid();
            const ios = isIOS();

            // iOS: custom scheme opens native app; we handle fallback via JS (not href)
            if (ios) {
              return (
                <button
                  key={b.id}
                  type="button"
                  onClick={() => {
                    handleBankClick(b);
                    openOnIOS(b);
                  }}
                  className={`flex flex-col items-center justify-center p-3 rounded-2xl border transition-all active:scale-95 hover:shadow-md ${
                    isDark ? `${b.bgDark} ${b.border}` : `${b.bgLight} ${b.border}`
                  }`}
                >
                  <div className={`w-8 h-8 rounded-xl bg-gradient-to-br ${b.color} text-white flex items-center justify-center mb-1.5 shadow-sm`}>
                    <ArrowUpRight size={16} strokeWidth={2.5} />
                  </div>
                  <span className={`text-xs font-black ${isDark ? b.textDark : b.textLight}`}>
                    {bankName(b)}
                  </span>
                </button>
              );
            }

            // Android: intent:// href on a real <a> tag — Chrome opens native app directly
            // Other (desktop): opens Play Store in new tab
            return (
              <a
                key={b.id}
                href={android ? buildIntentUrl(b) : playStoreUrl(b.pkg)}
                {...(!android && { target: '_blank', rel: 'noopener noreferrer' })}
                onClick={() => handleBankClick(b)}
                className={`flex flex-col items-center justify-center p-3 rounded-2xl border transition-all active:scale-95 hover:shadow-md no-underline ${
                  isDark ? `${b.bgDark} ${b.border}` : `${b.bgLight} ${b.border}`
                }`}
              >
                <div className={`w-8 h-8 rounded-xl bg-gradient-to-br ${b.color} text-white flex items-center justify-center mb-1.5 shadow-sm`}>
                  <ArrowUpRight size={16} strokeWidth={2.5} />
                </div>
                <span className={`text-xs font-black ${isDark ? b.textDark : b.textLight}`}>
                  {bankName(b)}
                </span>
              </a>
            );
          })}
        </div>
      </div>
    </div>
  );
}
