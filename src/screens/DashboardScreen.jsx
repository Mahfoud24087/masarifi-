import React, { useState, useMemo } from 'react';
import { useMasarifi } from '../context/MasarifiContext';
import CategoryBadge from '../components/CategoryBadge';
import EmptyState from '../components/EmptyState';
import BankLauncherWidget from '../components/BankLauncherWidget';
import WisdomBanner from '../components/WisdomBanner';
import { EXPENSE_CATEGORIES, getCategoryById } from '../models/categories';
import { ChevronDown, ChevronLeft, ChevronRight, Search, X, TrendingUp, TrendingDown, Minus, RefreshCw, Sparkles } from 'lucide-react';
import AIAdvisorModal from '../components/AIAdvisorModal';

function StatPill({ label, value, color = 'text-slate-700', isDark }) {
  return (
    <div className={`flex-1 rounded-2xl p-3 text-center ${isDark ? 'bg-slate-800' : 'bg-white border border-slate-100'}`}>
      <p className={`text-xs font-semibold truncate ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{label}</p>
      <p className={`text-sm font-extrabold mt-0.5 ${color}`} dir="ltr">{value}</p>
    </div>
  );
}

function BudgetBar({ catId, spent, budget, t, isDark }) {
  if (!budget) return null;
  const pct = Math.min((spent / budget) * 100, 100);
  const actualPct = Math.round((spent / budget) * 100);
  const over = spent > budget;
  const warn = spent >= budget * 0.8;
  const cat  = getCategoryById(catId);
  return (
    <div className={`px-4 py-2.5 rounded-2xl mb-2 transition-all ${
      over
        ? (isDark ? 'bg-red-950/40 border border-red-500/40' : 'bg-red-50/80 border border-red-200')
        : warn
          ? (isDark ? 'bg-amber-950/40 border border-amber-500/40' : 'bg-amber-50/80 border border-amber-200')
          : (isDark ? 'bg-slate-800' : 'bg-white border border-slate-100 shadow-sm')
    }`}>
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-1.5">
          <span className={`text-xs font-semibold ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{t(`categories.${catId}`)}</span>
          {over ? (
            <span className="text-[10px] font-black px-1.5 py-0.2 rounded-md bg-red-500 text-white">
              {actualPct}%
            </span>
          ) : warn ? (
            <span className="text-[10px] font-black px-1.5 py-0.2 rounded-md bg-amber-500 text-white">
              {actualPct}%
            </span>
          ) : null}
        </div>
        <span className={`text-xs font-bold ${over ? 'text-red-500' : warn ? 'text-amber-500' : 'text-emerald-600'}`} dir="ltr">
          {spent.toLocaleString('en-US')} / {budget.toLocaleString('en-US')} {t('common.currency')}
        </span>
      </div>
      <div className={`w-full h-1.5 rounded-full overflow-hidden ${isDark ? 'bg-slate-700' : 'bg-slate-100'}`}>
        <div className="h-1.5 rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, background: over ? '#EF4444' : warn ? '#F59E0B' : (cat?.color || '#10B981') }} />
      </div>
      {over ? (
        <p className="text-red-500 text-[10px] mt-1 font-semibold flex items-center gap-1">
          <span>🚨</span> {t('dashboard.overBudget')}
        </p>
      ) : warn ? (
        <p className="text-amber-500 text-[10px] mt-1 font-semibold flex items-center gap-1">
          <span>⚠️</span> {t('dashboard.budgetWarning80')}
        </p>
      ) : null}
    </div>
  );
}

export default function DashboardScreen() {
  const {
    t, isDark, isRTL, lang, user, expenses,
    totalExpenses, totalIncome, netBalance,
    lastMonthTotal,
    viewMonth, goToPrevMonth, goToNextMonth, isCurrentMonth,
    setShowExpenseForm, setEditingExpense,
    setConfirmDialog, deleteExpense, showToast,
    getBudget, budgets,
  } = useMasarifi();

  const [filterCat, setFilterCat]   = useState('all');
  const [filterType, setFilterType] = useState('all'); // all|expense|income
  const [showFilter, setShowFilter] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch]   = useState(false);
  const [showAIAdvisor, setShowAIAdvisor] = useState(false);

  const months = t('months');
  const monthLabel = Array.isArray(months) && months[viewMonth.month]
    ? `${months[viewMonth.month]} ${viewMonth.year}`
    : `${viewMonth.month + 1}/${viewMonth.year}`;

  // Filter & search
  const filtered = useMemo(() => {
    let list = expenses;
    if (filterCat !== 'all') list = list.filter(e => e.category === filterCat);
    if (filterType !== 'all') list = list.filter(e => (e.type || 'expense') === filterType);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(e => e.title.toLowerCase().includes(q) || (e.notes || '').toLowerCase().includes(q));
    }
    return list;
  }, [expenses, filterCat, filterType, searchQuery]);

  // Quick stats
  const expenseOnly = useMemo(() => expenses.filter(e => (e.type || 'expense') === 'expense'), [expenses]);
  const avgDaily = useMemo(() => {
    const days = new Date().getDate();
    return expenseOnly.length ? Math.round(totalExpenses / days) : 0;
  }, [totalExpenses, expenseOnly]);
  const largestExpense = useMemo(() => expenseOnly.length ? Math.max(...expenseOnly.map(e => e.amount)) : 0, [expenseOnly]);

  // vs last month
  const diffPct = lastMonthTotal > 0 ? Math.round(((totalExpenses - lastMonthTotal) / lastMonthTotal) * 100) : null;

  // Budgets that have value
  const activeBudgets = useMemo(() => {
    const spendPerCat = {};
    expenseOnly.forEach(e => { spendPerCat[e.category] = (spendPerCat[e.category] || 0) + e.amount; });
    return EXPENSE_CATEGORIES
      .map(cat => ({ catId: cat.id, spent: spendPerCat[cat.id] || 0, budget: getBudget(cat.id) }))
      .filter(b => b.budget > 0);
  }, [expenseOnly, getBudget, budgets]);

  // Grouped by date
  const grouped = useMemo(() => {
    return filtered.reduce((acc, exp) => {
      if (!acc[exp.date]) acc[exp.date] = [];
      acc[exp.date].push(exp);
      return acc;
    }, {});
  }, [filtered]);

  const todayStr     = new Date().toISOString().split('T')[0];
  const yesterdayStr = new Date(Date.now() - 86400000).toISOString().split('T')[0];
  const getDateLabel = (d) => {
    if (d === todayStr && isCurrentMonth)     return t('dashboard.today');
    if (d === yesterdayStr && isCurrentMonth) return t('dashboard.yesterday');
    return new Date(d).toLocaleDateString(lang === 'ar' ? 'ar-u-nu-latn' : lang === 'fr' ? 'fr-FR' : 'en-US', { weekday: 'long', day: 'numeric', month: 'long' });
  };

  const handleEdit   = (exp) => { setEditingExpense(exp); setShowExpenseForm(true); };
  const handleDelete = (exp) => setConfirmDialog({
    title: t('dashboard.deleteExpense'), message: t('dashboard.deleteConfirm'),
    onConfirm: () => { deleteExpense(exp.id); showToast('🗑️ Deleted'); },
  });

  const firstName = user?.name?.split(' ')[0] || '';
  const PrevArrow = isRTL ? ChevronRight : ChevronLeft;
  const NextArrow = isRTL ? ChevronLeft  : ChevronRight;

  const fmt = (n) => n.toLocaleString('en-US', { maximumFractionDigits: 0 });

  return (
    <div className={`pb-2 ${isDark ? 'bg-slate-900' : 'bg-slate-50'} min-h-full`}>
      {/* ─── Header ─── */}
      <div className="px-4 pt-6 pb-3" dir={isRTL ? 'rtl' : 'ltr'}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{t('dashboard.hello')}</p>
            <h1 className={`text-xl font-extrabold ${isDark ? 'text-slate-100' : 'text-slate-800'}`}>{firstName} 👋</h1>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowAIAdvisor(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-full font-bold text-xs text-white shadow-md shadow-emerald-500/20 transition-all active:scale-95 hover:scale-105"
              style={{ background: 'linear-gradient(135deg, #059669, #10B981)' }}
              id="masarifi-ai-advisor-btn"
            >
              <Sparkles size={14} className="animate-spin-slow" />
              <span>{lang === 'ar' ? 'مستشارك' : lang === 'fr' ? 'IA' : 'AI Advisor'}</span>
            </button>
            <button onClick={() => setShowSearch(!showSearch)}
              className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${isDark ? 'bg-slate-800 text-slate-300' : 'bg-white text-slate-600 border border-slate-100 shadow-sm'}`}
              id="masarifi-search-btn">
              <Search size={18} />
            </button>
            <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold shadow"
              style={{ background: 'linear-gradient(135deg,#059669,#10B981)' }}>
              {user?.name?.[0]?.toUpperCase() || 'M'}
            </div>
          </div>
        </div>

        {/* Search bar */}
        {showSearch && (
          <div className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl mb-3 border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
            <Search size={16} className="text-slate-400 flex-shrink-0" />
            <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
              placeholder={t('dashboard.search')} autoFocus
              className={`flex-1 bg-transparent text-sm outline-none ${isDark ? 'text-slate-100 placeholder-slate-500' : 'text-slate-800 placeholder-slate-400'}`}
              id="masarifi-search-input" />
            {searchQuery && <button onClick={() => setSearchQuery('')}><X size={14} className="text-slate-400" /></button>}
          </div>
        )}

        {/* Month navigator */}
        <div className={`flex items-center justify-between px-4 py-3 rounded-2xl mb-4 ${isDark ? 'bg-slate-800' : 'bg-white border border-slate-100 shadow-sm'}`}>
          <button onClick={goToPrevMonth} className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors" id="masarifi-prev-month">
            <PrevArrow size={18} className={isDark ? 'text-slate-300' : 'text-slate-500'} />
          </button>
          <span className={`text-sm font-bold ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>{monthLabel}</span>
          <button onClick={goToNextMonth} disabled={isCurrentMonth}
            className={`p-1.5 rounded-xl transition-colors ${isCurrentMonth ? 'opacity-30' : 'hover:bg-slate-100 dark:hover:bg-slate-700'}`}
            id="masarifi-next-month">
            <NextArrow size={18} className={isDark ? 'text-slate-300' : 'text-slate-500'} />
          </button>
        </div>

        {/* Net balance + income/expense cards */}
        <div className="rounded-3xl overflow-hidden mb-3 shadow-lg shadow-emerald-100/50"
          style={{ background: 'linear-gradient(135deg,#059669,#10B981 60%,#14B8A6)' }}>
          <div className="p-5">
            <p className="text-emerald-100 text-xs font-semibold uppercase tracking-wider mb-1">{t('dashboard.net')}</p>
            <p className="text-white text-4xl font-extrabold" dir="ltr">
              {netBalance >= 0 ? '+' : ''}{fmt(netBalance)}
              <span className="text-lg font-semibold text-emerald-200 ms-2">{t('common.currency')}</span>
            </p>
            {diffPct !== null && (
              <div className="flex items-center gap-1 mt-2">
                {diffPct > 0 ? <TrendingUp size={13} className="text-red-300" /> : diffPct < 0 ? <TrendingDown size={13} className="text-emerald-200" /> : <Minus size={13} className="text-white/60" />}
                <span className={`text-xs font-semibold ${diffPct > 0 ? 'text-red-300' : diffPct < 0 ? 'text-emerald-200' : 'text-white/60'}`}>
                  {diffPct > 0 ? '+' : ''}{diffPct}% {t('summary.vsLastMonth')}
                </span>
              </div>
            )}
          </div>
          <div className="flex divide-x divide-white/20 border-t border-white/20">
            <div className="flex-1 px-5 py-3">
              <p className="text-emerald-100 text-[10px] font-semibold uppercase">{t('dashboard.income')}</p>
              <p className="text-white font-bold text-sm" dir="ltr">+{fmt(totalIncome)} {t('common.currency')}</p>
            </div>
            <div className="flex-1 px-5 py-3">
              <p className="text-emerald-100 text-[10px] font-semibold uppercase">{t('dashboard.balance')}</p>
              <p className="text-white font-bold text-sm" dir="ltr">-{fmt(totalExpenses)} {t('common.currency')}</p>
            </div>
          </div>
        </div>

        {/* Quick stats row */}
        <div className="flex gap-2 mb-4" dir={isRTL ? 'rtl' : 'ltr'}>
          <StatPill label={t('dashboard.avgDaily')} value={`${fmt(avgDaily)} ${t('common.currency')}`} isDark={isDark} />
          <StatPill label={t('dashboard.largest')} value={`${fmt(largestExpense)} ${t('common.currency')}`} isDark={isDark} />
          <StatPill label={t('dashboard.totalTx')} value={expenses.length.toString()} isDark={isDark} />
        </div>

        {/* Motivational Wisdom Card (Exclusive to Anonyme) */}
        <WisdomBanner />

        {/* Bankily / Masrvi / Sedad Fast Launcher Widget (Beta: only visible for Anonyme) */}
        <BankLauncherWidget />

        {/* Budget progress bars */}
        {activeBudgets.length > 0 && (
          <div className="mb-4" dir={isRTL ? 'rtl' : 'ltr'}>
            {activeBudgets.map(b => (
              <BudgetBar key={b.catId} {...b} t={t} isDark={isDark} />
            ))}
          </div>
        )}
      </div>

      {/* ─── Transactions list ─── */}
      <div className="px-4" dir={isRTL ? 'rtl' : 'ltr'}>
        {/* Filter row */}
        <div className="flex items-center justify-between mb-3">
          <h2 className={`text-sm font-bold ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>{t('dashboard.recentExpenses')}</h2>
          <div className="flex items-center gap-2">
            {/* Type filter */}
            <div className={`flex rounded-xl p-0.5 text-xs ${isDark ? 'bg-slate-800' : 'bg-white border border-slate-100'}`}>
              {['all','expense','income'].map(tp => (
                <button key={tp} onClick={() => setFilterType(tp)}
                  className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${filterType === tp ? (tp === 'income' ? 'bg-emerald-500 text-white' : tp === 'expense' ? 'bg-red-500 text-white' : 'bg-slate-600 text-white') : isDark ? 'text-slate-400' : 'text-slate-500'}`}
                  id={`masarifi-filter-type-${tp}`}>
                  {tp === 'all' ? t('dashboard.all') : tp === 'income' ? t('common.income') : t('common.expense')}
                </button>
              ))}
            </div>
            {/* Category filter */}
            <div className="relative">
              <button onClick={() => setShowFilter(!showFilter)}
                className={`flex items-center gap-1 text-xs font-semibold px-3 py-2 rounded-xl transition-colors ${isDark ? 'bg-slate-800 text-slate-300' : 'bg-white text-slate-600 border border-slate-100'}`}
                id="masarifi-cat-filter-btn">
                {filterCat === 'all' ? t('dashboard.filter') : t(`categories.${filterCat}`)}
                <ChevronDown size={13} style={{ transform: showFilter ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
              </button>
              {showFilter && (
                <div className={`absolute top-10 ${isRTL ? 'left-0' : 'right-0'} z-50 rounded-2xl shadow-xl p-2 min-w-[160px] border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100'}`}>
                  <button onClick={() => { setFilterCat('all'); setShowFilter(false); }}
                    className={`w-full text-start px-4 py-2.5 rounded-xl text-sm transition-colors ${filterCat === 'all' ? 'bg-emerald-100 text-emerald-700 font-semibold' : isDark ? 'text-slate-300 hover:bg-slate-700' : 'text-slate-700 hover:bg-slate-50'}`}>
                    {t('dashboard.all')}
                  </button>
                  {EXPENSE_CATEGORIES.map(cat => {
                    const Icon = cat.icon;
                    return (
                      <button key={cat.id} onClick={() => { setFilterCat(cat.id); setShowFilter(false); }}
                        className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm transition-colors ${filterCat === cat.id ? `${cat.bg} ${cat.text} font-semibold` : isDark ? 'text-slate-300 hover:bg-slate-700' : 'text-slate-700 hover:bg-slate-50'}`}>
                        <Icon size={14} />{t(`categories.${cat.id}`)}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* List */}
        {filtered.length === 0 ? (
          <EmptyState icon={searchQuery ? '🔍' : '💸'} title={searchQuery ? t('dashboard.noSearchResults') : t('dashboard.noExpenses')} description={searchQuery ? '' : t('dashboard.noExpensesDesc')} />
        ) : (
          Object.entries(grouped)
            .sort(([a], [b]) => new Date(b) - new Date(a))
            .map(([date, exps]) => (
              <div key={date} className="mb-3">
                <div className="flex items-center gap-3 mb-1.5">
                  <p className={`text-[11px] font-bold capitalize ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{getDateLabel(date)}</p>
                  <div className={`flex-1 h-px ${isDark ? 'bg-slate-800' : 'bg-slate-100'}`} />
                  <p className={`text-[11px] font-bold ${isDark ? 'text-slate-400' : 'text-slate-500'}`} dir="ltr">
                    {fmt(exps.reduce((s, e) => s + (e.type === 'income' ? 0 : e.amount), 0))} {t('common.currency')}
                  </p>
                </div>
                {exps.map(exp => (
                  <TransactionRow key={exp.id} expense={exp} onEdit={handleEdit} onDelete={handleDelete} t={t} isDark={isDark} isRTL={isRTL} lang={lang} fmt={fmt} />
                ))}
              </div>
            ))
        )}
        <div className="h-4" />
      </div>

      {/* AI Advisor Modal */}
      <AIAdvisorModal isOpen={showAIAdvisor} onClose={() => setShowAIAdvisor(false)} />
    </div>
  );
}

function TransactionRow({ expense, onEdit, onDelete, t, isDark, isRTL, lang, fmt }) {
  const isIncome   = expense.type === 'income';
  const cat        = getCategoryById(expense.category);
  const Icon       = cat.icon;
  const dateLabel  = new Date(expense.date).toLocaleDateString(lang === 'ar' ? 'ar-u-nu-latn' : lang === 'fr' ? 'fr-FR' : 'en-US', { day: 'numeric', month: 'short' });

  return (
    <div className={`flex items-center gap-3 p-3.5 rounded-2xl mb-1.5 border transition-all hover:shadow-sm ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100 shadow-sm'}`}>
      <div className={`w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 ${cat.bg} ${cat.text}`}>
        <Icon size={17} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <p className={`font-semibold text-sm truncate ${isDark ? 'text-slate-100' : 'text-slate-800'}`}>{expense.title}</p>
          {expense.recurring && <RefreshCw size={11} className="text-emerald-500 flex-shrink-0" title="Recurring" />}
        </div>
        <p className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{t(`categories.${expense.category}`)} · {dateLabel}</p>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <p className={`font-bold text-sm ${isIncome ? 'text-emerald-500' : 'text-red-500'}`} dir="ltr">
          {isIncome ? '+' : '-'}{fmt(expense.amount)}
        </p>
        <div className="flex gap-1">
          <button onClick={() => onEdit(expense)} className={`p-1.5 rounded-lg transition-colors ${isDark ? 'text-slate-500 hover:text-emerald-400 hover:bg-slate-700' : 'text-slate-400 hover:text-emerald-600 hover:bg-emerald-50'}`} id={`masarifi-edit-${expense.id}`}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          </button>
          <button onClick={() => onDelete(expense)} className={`p-1.5 rounded-lg transition-colors ${isDark ? 'text-slate-500 hover:text-red-400 hover:bg-slate-700' : 'text-slate-400 hover:text-red-600 hover:bg-red-50'}`} id={`masarifi-delete-${expense.id}`}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
          </button>
        </div>
      </div>
    </div>
  );
}
