import React, { useMemo } from 'react';
import { useMasarifi } from '../context/MasarifiContext';
import { Wallet, TrendingDown } from 'lucide-react';

export default function BalanceCard() {
  const { expenses, t, isRTL } = useMasarifi();

  const now = new Date();
  const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  const monthlyExpenses = useMemo(() => {
    return expenses.filter((e) => e.date && e.date.startsWith(currentMonthKey));
  }, [expenses, currentMonthKey]);

  const monthlyTotal = useMemo(() => {
    return monthlyExpenses.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
  }, [monthlyExpenses]);

  const count = monthlyExpenses.length;

  return (
    <div
      dir={isRTL ? 'rtl' : 'ltr'}
      className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-600 via-emerald-500 to-teal-600 p-6 sm:p-7 text-white shadow-xl shadow-emerald-600/20"
    >
      {/* Decorative Circles */}
      <div className="absolute -top-12 -right-12 w-44 h-44 rounded-full bg-white/10 blur-xl pointer-events-none" />
      <div className="absolute -bottom-16 -left-12 w-52 h-52 rounded-full bg-emerald-300/20 blur-2xl pointer-events-none" />
      <div className="absolute top-1/3 right-1/4 w-28 h-28 rounded-full bg-white/5 pointer-events-none" />
      <div className="absolute bottom-3 right-8 w-16 h-16 rounded-full border border-white/10 pointer-events-none" />

      {/* Content */}
      <div className="relative z-10 flex flex-col gap-4">
        {/* Top Header Row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center flex-shrink-0 shadow-inner">
              <Wallet size={20} className="text-white" />
            </div>
            <div>
              <span className="text-xs uppercase tracking-wider text-emerald-100 font-medium block">
                {t('dashboard.balance')}
              </span>
              <span className="text-[11px] text-emerald-200/90 font-light">
                {t('dashboard.thisMonth')}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-xs font-medium text-emerald-50 border border-white/10">
            <TrendingDown size={14} />
            <span>
              {count} {t('dashboard.count')}
            </span>
          </div>
        </div>

        {/* Big Amount Row */}
        <div className="mt-1">
          <div className="flex items-baseline gap-2 flex-wrap">
            <span className="text-3xl sm:text-4xl font-extrabold tracking-tight">
              {monthlyTotal.toLocaleString()}
            </span>
            <span className="text-base sm:text-lg font-medium text-emerald-100">
              {t('common.currency')}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
