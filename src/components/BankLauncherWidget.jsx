import React, { useState, useEffect } from 'react';
import { useMasarifi } from '../context/MasarifiContext';
import { ExternalLink, Check, X, ArrowUpRight } from 'lucide-react';

// The 3 Mauritanian Digital Banks with correct intent schemes
export const MAURITANIAN_BANKS = [
  {
    id: 'bankily',
    name: 'Bankily',
    nameAr: 'بنكيلي',
    color: 'from-emerald-600 to-teal-700',
    border: 'border-emerald-500/30',
    bgLight: 'bg-emerald-50 text-emerald-800',
    bgDark: 'bg-emerald-950/40 text-emerald-300',
    androidPackage: 'mr.bpm.digitalbanking.consumer',
    scheme: 'bankily',
    iosScheme: 'bankily://',
    playStoreUrl: 'https://play.google.com/store/apps/details?id=mr.bpm.digitalbanking.consumer',
    appStoreUrl: 'https://apps.apple.com/app/bankily/id1451556637',
  },
  {
    id: 'masrvi',
    name: 'Masrvi',
    nameAr: 'مصرفي',
    color: 'from-rose-600 to-red-700',
    border: 'border-rose-500/30',
    bgLight: 'bg-rose-50 text-rose-800',
    bgDark: 'bg-rose-950/40 text-rose-300',
    androidPackage: 'com.tagpay.mwallet.masrvi',
    scheme: 'masrvi',
    iosScheme: 'masrvi://',
    playStoreUrl: 'https://play.google.com/store/apps/details?id=com.tagpay.mwallet.masrvi',
    appStoreUrl: 'https://apps.apple.com/app/masrvi/id1527783856',
  },
  {
    id: 'sedad',
    name: 'Sedad',
    nameAr: 'سداد',
    color: 'from-blue-600 to-indigo-700',
    border: 'border-blue-500/30',
    bgLight: 'bg-blue-50 text-blue-800',
    bgDark: 'bg-blue-950/40 text-blue-300',
    androidPackage: 'mr.digi.sedad',
    scheme: 'sedad',
    iosScheme: 'sedad://',
    playStoreUrl: 'https://play.google.com/store/apps/details?id=mr.digi.sedad',
    appStoreUrl: 'https://apps.apple.com/app/sedad/id1498177519',
  },
];

// Detect platform once
const isIOS = typeof navigator !== 'undefined' && /iphone|ipad|ipod/i.test(navigator.userAgent);

// Build the correct href for each bank button
function getBankHref(bank) {
  if (isIOS) {
    return bank.iosScheme;
  }
  // Android: Use the exact intent:// format with scheme + package
  // This tells Chrome: "open the app that registered this scheme + package"
  return `intent://#Intent;scheme=${bank.scheme};package=${bank.androidPackage};end;`;
}

export default function BankLauncherWidget() {
  const { user, isDark, isRTL, lang, setShowExpenseForm, setEditingExpense } = useMasarifi();
  const [lastLaunchedBank, setLastLaunchedBank] = useState(() => {
    return sessionStorage.getItem('masarifi_pending_bank_return') || null;
  });

  // Feature Flag: ONLY visible to user "Anonyme" for safe testing!
  const isBetaTester = user?.name?.trim().toLowerCase() === 'anonyme';

  // Listen for user returning to tab/app after opening bank
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        const pending = sessionStorage.getItem('masarifi_pending_bank_return');
        if (pending) {
          setLastLaunchedBank(pending);
        }
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  if (!isBetaTester) return null;

  // Record bank click (called via onClick on the <a> tag — runs before navigation)
  const handleBankClick = (bank) => {
    sessionStorage.setItem('masarifi_pending_bank_return', bank.id);
    setLastLaunchedBank(bank.id);
    // Don't preventDefault — let the <a> tag navigate to the intent:// URL naturally
  };

  const handleConfirmRecord = (bankId) => {
    const bank = MAURITANIAN_BANKS.find((b) => b.id === bankId);
    sessionStorage.removeItem('masarifi_pending_bank_return');
    setLastLaunchedBank(null);

    // Open expense form prefilled with bank note
    setEditingExpense({
      title: `${bank?.name || 'Bank'} Transfer`,
      amount: '',
      category: 'other',
      date: new Date().toISOString().split('T')[0],
      notes: `Via ${bank?.name || 'Bank'}`,
      type: 'expense',
    });
    setShowExpenseForm(true);
  };

  const handleDismissReminder = () => {
    sessionStorage.removeItem('masarifi_pending_bank_return');
    setLastLaunchedBank(null);
  };

  const activeBankObj = MAURITANIAN_BANKS.find((b) => b.id === lastLaunchedBank);

  return (
    <div className="mb-4" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* ── Return Reminder Card (Shown when returning from bank app) ── */}
      {lastLaunchedBank && activeBankObj && (
        <div
          className={`p-4 rounded-3xl mb-3 border shadow-lg backdrop-blur-md animate-bounce-once ${
            isDark
              ? 'bg-slate-800/95 border-emerald-500/40 text-white'
              : 'bg-emerald-50/95 border-emerald-300 text-slate-800'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              {lang === 'ar' ? '⚡ تسجيل فوري' : lang === 'fr' ? '⚡ Enregistrement Express' : '⚡ Quick Log'}
            </span>
            <button onClick={handleDismissReminder} className="text-slate-400 hover:text-slate-600 p-1">
              <X size={15} />
            </button>
          </div>
          <p className="text-sm font-bold leading-snug">
            {lang === 'ar'
              ? `أهلاً بعودتك من ${activeBankObj.nameAr}! 👋 هل أرسلت أو دفعت أموالاً للتو؟`
              : lang === 'fr'
              ? `De retour de ${activeBankObj.name} ! Avez-vous envoyé de l'argent ?`
              : `Back from ${activeBankObj.name}! Did you send or spend money?`}
          </p>
          <div className="flex items-center gap-2 mt-3">
            <button
              onClick={() => handleConfirmRecord(activeBankObj.id)}
              className="flex-1 py-2.5 px-3 rounded-2xl text-xs font-extrabold text-white bg-gradient-to-r from-emerald-600 to-teal-600 shadow-md transition-all active:scale-95 flex items-center justify-center gap-1.5"
            >
              <Check size={14} />
              <span>{lang === 'ar' ? 'نعم، سجّل المصروف الآن' : lang === 'fr' ? 'Oui, enregistrer' : 'Yes, Log It'}</span>
            </button>
            <button
              onClick={handleDismissReminder}
              className={`py-2.5 px-3 rounded-2xl text-xs font-semibold ${
                isDark ? 'bg-slate-700 text-slate-300' : 'bg-white border text-slate-600'
              }`}
            >
              {lang === 'ar' ? 'لا، مجرد تصفح' : lang === 'fr' ? 'Non' : 'No'}
            </button>
          </div>
        </div>
      )}

      {/* ── 3-Bank Launcher Section (Beta Badge) ── */}
      <div className={`p-4 rounded-3xl border ${isDark ? 'bg-slate-800/80 border-slate-700/60' : 'bg-white border-slate-100 shadow-sm'}`}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-1.5">
            <p className={`text-xs font-extrabold ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>
              {lang === 'ar' ? 'الدفع والمحافظ البنكية' : lang === 'fr' ? 'Paiement & Banques' : 'Bank & Wallets'}
            </p>
            <span className="text-[10px] font-black px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400">
              BETA
            </span>
          </div>
          <span className={`text-[11px] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
            {lang === 'ar' ? 'فتح وتسجيل مباشر' : lang === 'fr' ? 'Accès direct' : '1-Tap Pay'}
          </span>
        </div>

        {/* KEY FIX: Using <a> tags with intent:// href so Chrome treats it as a real user-gesture link */}
        <div className="grid grid-cols-3 gap-2">
          {MAURITANIAN_BANKS.map((b) => (
            <a
              key={b.id}
              href={getBankHref(b)}
              onClick={() => handleBankClick(b)}
              className={`flex flex-col items-center justify-center p-3 rounded-2xl border transition-all active:scale-95 hover:shadow-md no-underline ${
                isDark ? `${b.bgDark} ${b.border}` : `${b.bgLight} ${b.border}`
              }`}
            >
              <div className={`w-8 h-8 rounded-xl bg-gradient-to-br ${b.color} text-white flex items-center justify-center mb-1.5 shadow-sm`}>
                <ArrowUpRight size={16} strokeWidth={2.5} />
              </div>
              <span className="text-xs font-black">{lang === 'ar' ? b.nameAr : b.name}</span>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
