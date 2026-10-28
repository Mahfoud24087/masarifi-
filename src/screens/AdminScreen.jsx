import React, { useState, useMemo, useEffect } from 'react';
import { 
  Shield, ArrowLeft, ArrowRight, Lock, Users, 
  TrendingUp, TrendingDown, Star, MessageSquare, CheckCircle2, 
  Clock, AlertCircle, Trash2, Edit3, ExternalLink, RefreshCw, 
  Search, Bug, Lightbulb, UserCheck, HelpCircle, Phone, Mail,
  Send, Sparkles, Activity, Check, Eye, EyeOff, Settings, Key, User,
  Flame, Award, ChevronLeft, ChevronRight, Zap, ArrowUpRight, ArrowDownRight
} from 'lucide-react';
import { useMasarifi } from '../context/MasarifiContext';

const formatCompactMRU = (amount = 0) => {
  const val = Number(amount) || 0;
  if (val >= 1_000_000) {
    const formatted = (val / 1_000_000).toFixed(1).replace(/\.0$/, '');
    return `${formatted}M`;
  }
  if (val >= 10_000) {
    const formatted = (val / 1_000).toFixed(1).replace(/\.0$/, '');
    return `${formatted}K`;
  }
  return val.toLocaleString('en-US');
};

export default function AdminScreen() {
  const { 
    t, isDark, isRTL, lang, setScreen,
    isAdminLoggedIn, logoutAdmin,
    adminAccount, updateAdminProfile,
    tickets, updateTicketStatus, deleteTicket,
    reviews, deleteReview,
    allUsersList, expenses, totalExpenses, totalIncome, platformStats,
    showToast
  } = useMasarifi();

  const [selectedUserDetail, setSelectedUserDetail] = useState(null);

  // Make admin full-width on PC desktop
  useEffect(() => {
    const rootEl = document.getElementById('root');
    if (rootEl) rootEl.classList.add('admin-view');
    return () => {
      if (rootEl) rootEl.classList.remove('admin-view');
    };
  }, []);

  const [activeTab, setActiveTab] = useState('tickets'); // 'tickets' | 'stats' | 'reviews' | 'users' | 'settings'
  const [ticketFilter, setTicketFilter] = useState('all'); // 'all' | 'new' | 'in_progress' | 'resolved'
  const [ticketCatFilter, setTicketCatFilter] = useState('all');
  const [adminNotes, setAdminNotes] = useState({});
  const [userSearch, setUserSearch] = useState('');
  const [userPage, setUserPage] = useState(1);
  const [userTxFilter, setUserTxFilter] = useState('all'); // 'all' | 'expenses' | 'income'
  const USERS_PER_PAGE = 8;

  // Admin Profile Settings State
  const [settingsForm, setSettingsForm] = useState({
    name: adminAccount?.name || 'Admin',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [settingsErrors, setSettingsErrors] = useState({});
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);

  const BackArrow = isRTL ? ArrowRight : ArrowLeft;

  // KPI Calculations
  const totalUsersCount = Math.max(allUsersList.length, 1);
  const totalTicketsCount = tickets.length;
  const openTicketsCount = tickets.filter(t => t.status !== 'resolved').length;
  const newTicketsCount = tickets.filter(t => t.status === 'new').length;
  const inProgressTicketsCount = tickets.filter(t => t.status === 'in_progress').length;
  const resolvedTicketsCount = tickets.filter(t => t.status === 'resolved').length;

  const resolutionRate = totalTicketsCount > 0 
    ? Math.round((resolvedTicketsCount / totalTicketsCount) * 100) 
    : 100;

  const avgRating = useMemo(() => {
    if (!reviews || reviews.length === 0) return '5.0';
    const sum = reviews.reduce((acc, r) => acc + (Number(r.stars) || 5), 0);
    return (sum / reviews.length).toFixed(1);
  }, [reviews]);

  // Filtered tickets
  const filteredTickets = useMemo(() => {
    return tickets.filter((ticket) => {
      const matchesStatus = ticketFilter === 'all' || ticket.status === ticketFilter;
      const matchesCat = ticketCatFilter === 'all' || ticket.category === ticketCatFilter;
      return matchesStatus && matchesCat;
    });
  }, [tickets, ticketFilter, ticketCatFilter]);

  // Sorted & Filtered users by activity (most transactions first)
  const sortedAndFilteredUsers = useMemo(() => {
    let list = [...allUsersList];
    // Sort primarily by expenseCount (most active first), then by creation date
    list.sort((a, b) => {
      const countA = (a.expenseCount || 0) + (a.incomeCount || 0);
      const countB = (b.expenseCount || 0) + (b.incomeCount || 0);
      if (countB !== countA) return countB - countA;
      return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
    });

    if (userSearch.trim()) {
      list = list.filter(u => u.name?.toLowerCase().includes(userSearch.toLowerCase()));
    }

    // Filter by transaction type
    if (userTxFilter === 'expenses') {
      list = list.filter(u => (u.expenseCount || 0) > 0);
    } else if (userTxFilter === 'income') {
      list = list.filter(u => (u.incomeCount || 0) > 0);
    }

    return list;
  }, [allUsersList, userSearch, userTxFilter]);

  // Top Most Active User (Leader)
  const topActiveUser = useMemo(() => {
    if (!allUsersList || allUsersList.length === 0) return null;
    const sorted = [...allUsersList].sort((a, b) => (b.expenseCount || 0) - (a.expenseCount || 0));
    return sorted[0]?.expenseCount > 0 ? sorted[0] : (sorted[0] || null);
  }, [allUsersList]);

  // Pagination calculations
  const totalUserPages = Math.ceil(sortedAndFilteredUsers.length / USERS_PER_PAGE) || 1;
  const paginatedUsers = useMemo(() => {
    const start = (userPage - 1) * USERS_PER_PAGE;
    return sortedAndFilteredUsers.slice(start, start + USERS_PER_PAGE);
  }, [sortedAndFilteredUsers, userPage]);

  // Reset page when search query or filter changes
  useEffect(() => {
    setUserPage(1);
  }, [userSearch, userTxFilter]);

  const handleUpdateStatus = async (ticketId, nextStatus) => {
    const note = adminNotes[ticketId] !== undefined ? adminNotes[ticketId] : null;
    const res = await updateTicketStatus(ticketId, nextStatus, note);
    if (res.success) {
      showToast(nextStatus === 'resolved' ? '✅ ' + t('admin.markResolved') : '✅ Status updated');
    }
  };

  const handleSaveNote = async (ticketId) => {
    const note = adminNotes[ticketId] || '';
    const res = await updateTicketStatus(ticketId, tickets.find(t => t.id === ticketId)?.status || 'in_progress', note);
    if (res.success) {
      showToast('💾 ' + t('admin.saveNotes'));
    }
  };

  const handleDeleteTicket = async (ticketId) => {
    if (window.confirm('Delete this support ticket?')) {
      await deleteTicket(ticketId);
      showToast('🗑️ ' + t('admin.deleteTicket'));
    }
  };

  const handleDeleteReview = async (reviewId) => {
    if (window.confirm('Delete this community review?')) {
      await deleteReview(reviewId);
      showToast('🗑️ Review deleted');
    }
  };

  const getCatIcon = (cat) => {
    switch (cat) {
      case 'bug': return <Bug size={14} className="text-red-500" />;
      case 'suggestion': return <Lightbulb size={14} className="text-amber-500" />;
      case 'account': return <UserCheck size={14} className="text-blue-500" />;
      default: return <HelpCircle size={14} className="text-emerald-500" />;
    }
  };

  const handleSaveAdminSettings = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!settingsForm.name.trim()) errs.name = t('auth.errors.required');
    if (!settingsForm.currentPassword) {
      errs.currentPassword = t('auth.errors.required');
    }

    if (settingsForm.newPassword) {
      if (settingsForm.newPassword.length < 4) {
        errs.newPassword = t('auth.errors.passwordShort');
      } else if (settingsForm.newPassword !== settingsForm.confirmPassword) {
        errs.confirmPassword = t('auth.errors.passwordMismatch');
      }
    }

    if (Object.keys(errs).length > 0) {
      setSettingsErrors(errs);
      return;
    }

    const updates = { 
      name: settingsForm.name.trim(),
      currentPassword: settingsForm.currentPassword 
    };
    if (settingsForm.newPassword) {
      updates.password = settingsForm.newPassword;
    }

    const res = await updateAdminProfile(updates);
    if (res && !res.success) {
      if (res.error === 'wrongPassword') {
        setSettingsErrors({ currentPassword: t('admin.adminWrongPassword') });
      } else {
        showToast('❌ ' + (res.error || 'Error'), 'error');
      }
      return;
    }

    setSettingsErrors({});
    setSettingsForm((prev) => ({
      ...prev,
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    }));
    showToast('✅ ' + t('admin.adminSettingsSaved'));
  };

  // ── 1. If not logged in as Admin, redirect to Sign In ──
  if (!isAdminLoggedIn) {
    return (
      <div 
        className={`min-h-screen flex flex-col items-center justify-center p-4 ${
          isDark ? 'bg-slate-950 text-slate-100' : 'bg-slate-900 text-white'
        }`}
        dir={isRTL ? 'rtl' : 'ltr'}
      >
        <div className="w-full max-w-sm rounded-3xl p-8 border border-slate-800 bg-slate-900/90 text-center">
          <div 
            className="w-16 h-16 rounded-3xl mx-auto mb-4 flex items-center justify-center text-white shadow-xl shadow-emerald-500/20"
            style={{ background: 'linear-gradient(135deg, #059669, #10B981)' }}
          >
            <Shield size={32} />
          </div>
          <h1 className="text-xl font-extrabold mb-2 text-white">{t('admin.title')}</h1>
          <p className="text-xs text-slate-400 mb-6">{t('admin.pinSubtitle')}</p>
          <button
            onClick={() => setScreen('auth-signin')}
            className="w-full py-3.5 rounded-2xl font-bold text-white text-sm shadow-lg shadow-emerald-500/30 transition-all active:scale-95"
            style={{ background: 'linear-gradient(135deg, #059669, #10B981)' }}
          >
            {t('auth.signIn')}
          </button>
        </div>
      </div>
    );
  }

  // ── 2. Admin Dashboard Main Screen ──
  return (
    <div 
      className={`min-h-screen pb-16 ${
        isDark ? 'bg-slate-950 text-slate-100' : 'bg-slate-900 text-slate-100'
      }`}
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      {/* Top Bar */}
      <header className="sticky top-0 z-30 px-4 sm:px-8 py-3.5 flex items-center justify-between border-b border-slate-800/80 bg-slate-900/90 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2.5">
            <div 
              className="w-9 h-9 rounded-xl flex items-center justify-center text-white shadow-lg shadow-emerald-500/20"
              style={{ background: 'linear-gradient(135deg, #059669, #10B981)' }}
            >
              <Shield size={18} />
            </div>
            <div>
              <h1 className="font-extrabold text-sm sm:text-base leading-tight text-white flex items-center gap-2">
                <span>{t('admin.title')}</span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  {adminAccount?.name || 'Admin'}
                </span>
              </h1>
              <div className="flex items-center gap-1.5 text-[11px] text-emerald-400 font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>{t('admin.liveSystem')}</span>
              </div>
            </div>
          </div>
        </div>

        <button
          onClick={logoutAdmin}
          className="px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 bg-red-950/40 border border-red-900 text-red-400 hover:bg-red-900/40 active:scale-95"
          id="masarifi-admin-logout-btn"
        >
          <Lock size={14} />
          <span>{t('admin.logout')}</span>
        </button>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-8 pt-6">
        {/* KPI Summary Cards */}
        {/* KPI Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4 mb-6">
          {/* Card 1: Users */}
          <div className="p-4 sm:p-5 rounded-3xl border border-slate-800 bg-slate-900/80 shadow-lg relative overflow-hidden group hover:border-blue-500/40 transition-all">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-400">{t('admin.kpiUsers')}</span>
              <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center border border-blue-500/20">
                <Users size={18} />
              </div>
            </div>
            <p className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight" dir="ltr">
              {totalUsersCount}
            </p>
            <div className="flex items-center gap-1 mt-2 text-[11px] text-blue-400 font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
              <span>{t('admin.activeUsers')}</span>
            </div>
          </div>

          {/* Card 2: Registered Expenses (All Platform Expenses) */}
          <div className="p-4 sm:p-5 rounded-3xl border border-slate-800 bg-slate-900/80 shadow-lg relative overflow-hidden group hover:border-red-500/40 transition-all">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-400">{t('admin.kpiExpenses') || (lang === 'ar' ? 'إجمالي المصروفات' : 'All Expenses')}</span>
              <div className="w-9 h-9 rounded-xl bg-red-500/10 text-red-400 flex items-center justify-center border border-red-500/20">
                <TrendingDown size={18} />
              </div>
            </div>
            <p className="text-2xl sm:text-3xl font-extrabold text-red-400 tracking-tight flex items-baseline gap-1.5" dir="ltr" title={`${(platformStats?.totalExpenseVolume || totalExpenses).toLocaleString('en-US')} MRU`}>
              <span>{formatCompactMRU(platformStats?.totalExpenseVolume || totalExpenses)}</span>
              <span className="text-xs sm:text-sm font-bold opacity-80">MRU</span>
            </p>
            <div className="flex items-center gap-1 mt-2 text-[11px] text-red-400 font-semibold flex-wrap">
              {platformStats?.totalExpenseTransactions > 0 && (
                <span className="text-slate-500 text-[10px]">
                  • {platformStats.totalExpenseTransactions} {lang === 'ar' ? 'عملية' : 'tx'}
                </span>
              )}
            </div>
          </div>

          {/* Card 3: Registered Income (All Platform Income) */}
          <div className="p-4 sm:p-5 rounded-3xl border border-slate-800 bg-slate-900/80 shadow-lg relative overflow-hidden group hover:border-emerald-500/40 transition-all">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-400">{t('admin.kpiIncome') || (lang === 'ar' ? 'إجمالي الدخل' : 'All Income')}</span>
              <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20">
                <TrendingUp size={18} />
              </div>
            </div>
            <p className="text-2xl sm:text-3xl font-extrabold text-emerald-400 tracking-tight flex items-baseline gap-1.5" dir="ltr" title={`${(platformStats?.totalIncomeVolume || totalIncome).toLocaleString('en-US')} MRU`}>
              <span>{formatCompactMRU(platformStats?.totalIncomeVolume || totalIncome)}</span>
              <span className="text-xs sm:text-sm font-bold opacity-80">MRU</span>
            </p>
            <div className="flex items-center gap-1 mt-2 text-[11px] text-emerald-400 font-semibold flex-wrap">
              {platformStats?.totalIncomeTransactions > 0 && (
                <span className="text-slate-500 text-[10px]">
                  • {platformStats.totalIncomeTransactions} {lang === 'ar' ? 'عملية' : 'tx'}
                </span>
              )}
            </div>
          </div>

          {/* Card 4: Tracked Volume (Global Total Tracked Volume) */}
          <div className="p-4 sm:p-5 rounded-3xl border border-slate-800 bg-slate-900/80 shadow-lg relative overflow-hidden group hover:border-purple-500/40 transition-all">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-400">{t('admin.kpiVolume')}</span>
              <div className="w-9 h-9 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center border border-purple-500/20">
                <Zap size={18} />
              </div>
            </div>
            <p className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-baseline gap-1.5" dir="ltr" title={`${(platformStats?.totalVolume || (totalExpenses + totalIncome)).toLocaleString('en-US')} MRU`}>
              <span>{formatCompactMRU(platformStats?.totalVolume || (totalExpenses + totalIncome))}</span>
              <span className="text-xs sm:text-sm font-bold opacity-80 text-purple-300">MRU</span>
            </p>
            <div className="flex items-center gap-1 mt-2 text-[11px] text-purple-400 font-semibold flex-wrap">
              {platformStats?.totalTransactions > 0 && (
                <span className="text-slate-500 text-[10px]">
                  • {platformStats.totalTransactions} {lang === 'ar' ? 'عملية كلية' : 'total tx'}
                </span>
              )}
            </div>
          </div>

          {/* Card 5: Resolution Rate */}
          <div className="p-4 sm:p-5 rounded-3xl border border-slate-800 bg-slate-900/80 shadow-lg relative overflow-hidden group hover:border-teal-500/40 transition-all">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-400">{t('admin.resolutionRate')}</span>
              <div className="w-9 h-9 rounded-xl bg-teal-500/10 text-teal-400 flex items-center justify-center border border-teal-500/20">
                <CheckCircle2 size={18} />
              </div>
            </div>
            <p className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight" dir="ltr">
              {resolutionRate}%
            </p>
            <div className="flex items-center gap-1 mt-2 text-[11px] text-teal-400 font-semibold">
              <span>{resolvedTicketsCount}/{totalTicketsCount} Solved</span>
            </div>
          </div>

          {/* Card 6: Community Rating */}
          <div className="p-4 sm:p-5 rounded-3xl border border-slate-800 bg-slate-900/80 shadow-lg relative overflow-hidden group hover:border-amber-500/40 transition-all">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-400">{t('admin.kpiRating')}</span>
              <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center border border-amber-500/20">
                <Star size={18} className="fill-amber-400" />
              </div>
            </div>
            <p className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight" dir="ltr">
              ⭐ {avgRating}
            </p>
            <div className="flex items-center gap-1 mt-2 text-[11px] text-amber-400 font-semibold">
              <span>{reviews.length} Community Reviews</span>
            </div>
          </div>
        </div>

        {/* Tab Navigation Ribbon */}
        <div className="flex rounded-2xl p-1.5 mb-6 border border-slate-800 bg-slate-900/90 shadow-md overflow-x-auto">
          {[
            { id: 'tickets', label: t('admin.tabTickets'), count: openTicketsCount, highlight: openTicketsCount > 0 },
            { id: 'stats', label: t('admin.tabStats') },
            { id: 'reviews', label: t('admin.tabReviews'), count: reviews.length },
            { id: 'users', label: t('admin.tabUsers'), count: totalUsersCount },
            { id: 'settings', label: t('admin.tabSettings') },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 min-w-[110px] py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-1.5 ${
                activeTab === tab.id
                  ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <span>{tab.label}</span>
              {tab.count !== undefined && tab.count > 0 && (
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-extrabold ${
                  activeTab === tab.id 
                    ? 'bg-white text-emerald-700' 
                    : tab.highlight
                    ? 'bg-amber-400 text-slate-900 font-black'
                    : 'bg-slate-800 text-slate-300'
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* ─── TAB 1: SUPPORT TICKETS WORKSPACE ─── */}
        {activeTab === 'tickets' && (
          <div>
            {/* Filter controls */}
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                {[
                  { id: 'all', label: t('admin.filterAll') },
                  { id: 'new', label: t('admin.filterNew'), count: newTicketsCount, color: 'text-blue-400' },
                  { id: 'in_progress', label: t('admin.filterInProgress'), count: inProgressTicketsCount, color: 'text-amber-400' },
                  { id: 'resolved', label: t('admin.filterResolved'), count: resolvedTicketsCount, color: 'text-emerald-400' },
                ].map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setTicketFilter(f.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                      ticketFilter === f.id
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'bg-slate-900 text-slate-400 border border-slate-800 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    <span>{f.label}</span>
                    {f.count !== undefined && (
                      <span className="text-[10px] opacity-80" dir="ltr">({f.count})</span>
                    )}
                  </button>
                ))}
              </div>

              {/* Category Filter */}
              <div className="flex items-center gap-1">
                {['all', 'bug', 'suggestion', 'account'].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setTicketCatFilter(cat)}
                    className={`px-2.5 py-1 rounded-xl text-[11px] font-semibold border transition-all ${
                      ticketCatFilter === cat
                        ? 'border-emerald-500 bg-emerald-950/60 text-emerald-300 font-bold'
                        : 'border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800/40'
                    }`}
                  >
                    {cat === 'all' ? 'All Types' : t(`support.${cat}`)}
                  </button>
                ))}
              </div>
            </div>

            {/* Tickets list */}
            {filteredTickets.length === 0 ? (
              <div className="p-12 rounded-3xl text-center border border-slate-800 bg-slate-900/60 text-slate-400">
                <CheckCircle2 size={40} className="mx-auto mb-3 text-emerald-400" />
                <p className="font-bold text-sm text-slate-300">{t('admin.noTickets')}</p>
                <p className="text-xs text-slate-500 mt-1">Inbox is all clear</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredTickets.map((ticket) => {
                  const isNew = ticket.status === 'new';
                  const isInProgress = ticket.status === 'in_progress';
                  const isResolved = ticket.status === 'resolved';

                  return (
                    <div 
                      key={ticket.id}
                      className={`p-5 rounded-3xl border transition-all ${
                        isResolved
                          ? 'bg-slate-900/60 border-slate-800/80 opacity-90'
                          : isNew
                          ? 'bg-slate-900 border-blue-500/30 shadow-lg shadow-blue-500/5'
                          : 'bg-slate-900 border-amber-500/30 shadow-lg shadow-amber-500/5'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="p-1.5 rounded-xl bg-slate-800 flex items-center justify-center border border-slate-700">
                            {getCatIcon(ticket.category)}
                          </span>
                          <span className="font-extrabold text-sm sm:text-base text-white">
                            {ticket.subject}
                          </span>
                          <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                            isNew 
                              ? 'bg-blue-950 text-blue-300 border border-blue-800'
                              : isInProgress 
                              ? 'bg-amber-950 text-amber-300 border border-amber-800'
                              : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                          }`}>
                            {isNew ? 'New / جديد' : isInProgress ? 'In Progress / قيد المتابعة' : 'Resolved / تم الحل'}
                          </span>
                        </div>

                        <button
                          onClick={() => handleDeleteTicket(ticket.id)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 transition-colors"
                          title={t('admin.deleteTicket')}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>

                      {/* User message block */}
                      <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800/80 mb-3 text-xs sm:text-sm text-slate-200 leading-relaxed whitespace-pre-line">
                        {ticket.message}
                      </div>

                      {/* Ticket Meta / User info & direct contact buttons */}
                      <div className="p-3 rounded-2xl flex flex-wrap items-center justify-between gap-2 text-xs mb-3 bg-slate-800/50 border border-slate-800 text-slate-300">
                        <div className="flex items-center gap-3">
                          <span className="font-bold text-white flex items-center gap-1.5">
                            <span className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-300 flex items-center justify-center text-[11px] font-black">
                              {ticket.userName?.[0]?.toUpperCase() || 'U'}
                            </span>
                            {ticket.userName}
                          </span>
                          <span className="text-slate-400" dir="ltr">
                            🗓️ {new Date(ticket.createdAt).toLocaleDateString(lang === 'ar' ? 'ar-u-nu-latn' : 'fr-FR', {
                              day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
                            })}
                          </span>
                        </div>

                        {ticket.contact && (
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-emerald-400" dir="ltr">
                              📞 {ticket.contact}
                            </span>
                            {ticket.contact.includes('@') ? (
                              <a
                                href={`mailto:${ticket.contact}?subject=Masarifi Support: ${encodeURIComponent(ticket.subject)}`}
                                className="px-2.5 py-1 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold flex items-center gap-1 text-[11px]"
                              >
                                <Mail size={12} />
                                <span>{t('admin.quickEmail')}</span>
                              </a>
                            ) : (
                              <a
                                href={`https://wa.me/${ticket.contact.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`السلام عليكم ${ticket.userName}، بخصوص طلب الدعم في تطبيق مصاريفي: ${ticket.subject}`)}`}
                                target="_blank"
                                rel="noreferrer"
                                className="px-2.5 py-1 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex items-center gap-1 text-[11px]"
                              >
                                <ExternalLink size={12} />
                                <span>{t('admin.quickWhatsApp')}</span>
                              </a>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Admin Resolution & Reply Section */}
                      <div className="pt-3 border-t border-slate-800 space-y-3">
                        <div>
                          <label className="block text-[11px] font-bold text-slate-400 mb-1.5">
                            💬 {t('admin.adminNotes')}
                          </label>
                          <textarea
                            rows={2}
                            placeholder={ticket.adminNotes || t('admin.adminNotes')}
                            value={adminNotes[ticket.id] !== undefined ? adminNotes[ticket.id] : (ticket.adminNotes || '')}
                            onChange={(e) => setAdminNotes({ ...adminNotes, [ticket.id]: e.target.value })}
                            className="w-full px-3.5 py-2.5 rounded-2xl text-xs border outline-none bg-slate-950 border-slate-700 text-white placeholder-slate-500 focus:border-emerald-500 resize-none"
                          />
                        </div>

                        <div className="flex items-center gap-2 justify-end flex-wrap">
                          <button
                            onClick={() => handleSaveNote(ticket.id)}
                            className="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
                          >
                            💾 {t('admin.saveNotes')}
                          </button>

                          {!isInProgress && !isResolved && (
                            <button
                              onClick={() => handleUpdateStatus(ticket.id, 'in_progress')}
                              className="px-3 py-1.5 rounded-xl text-xs font-bold bg-amber-600 text-white hover:bg-amber-500 transition-all active:scale-95 flex items-center gap-1"
                            >
                              <Clock size={12} />
                              <span>{t('admin.markProgress')}</span>
                            </button>
                          )}

                          {!isResolved ? (
                            <button
                              onClick={() => handleUpdateStatus(ticket.id, 'resolved')}
                              className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-500 shadow-md shadow-emerald-600/30 transition-all active:scale-95 flex items-center gap-1.5"
                            >
                              <CheckCircle2 size={13} />
                              <span>{t('admin.markResolved')}</span>
                            </button>
                          ) : (
                            <button
                              onClick={() => handleUpdateStatus(ticket.id, 'in_progress')}
                              className="px-3 py-1.5 rounded-xl text-xs font-bold text-slate-400 hover:text-white transition-colors"
                            >
                              {t('admin.reopen')}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ─── TAB 2: PLATFORM HEALTH & ANALYTICS ─── */}
        {activeTab === 'stats' && (
          <div className="space-y-6">
            <div className="p-6 rounded-3xl border border-slate-800 bg-slate-900 shadow-lg">
              <h3 className="font-extrabold text-base mb-4 flex items-center gap-2 text-white">
                <Activity size={18} className="text-emerald-400" />
                <span>{t('admin.systemHealth')}</span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                  <span className="font-medium text-slate-400">Database Engine</span>
                  <span className="font-bold text-emerald-400 flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    Supabase PostgreSQL Active
                  </span>
                </div>
                <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                  <span className="font-medium text-slate-400">AI Financial Advisor</span>
                  <span className="font-bold text-emerald-400 flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    Groq LLaMA 3.3 70B Online
                  </span>
                </div>
                <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                  <span className="font-medium text-slate-400">Application Version</span>
                  <span className="font-bold text-white">v2.3.0 Executive Edition</span>
                </div>
                <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                  <span className="font-medium text-slate-400">Base Currency</span>
                  <span className="font-bold text-white">Mauritanian Ouguiya (MRU)</span>
                </div>
              </div>
            </div>

            {/* Ticket Distribution Breakdown */}
            <div className="p-6 rounded-3xl border border-slate-800 bg-slate-900 shadow-lg">
              <h3 className="font-extrabold text-base mb-4 text-white">
                Support Category Breakdown
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                {['bug', 'suggestion', 'account', 'general'].map((c) => {
                  const count = tickets.filter(t => t.category === c).length;
                  return (
                    <div key={c} className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800">
                      <div className="mx-auto mb-1 flex items-center justify-center">
                        {getCatIcon(c)}
                      </div>
                      <p className="text-xl font-black text-white" dir="ltr">{count}</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">{t(`support.${c}`)}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ─── TAB 3: REVIEWS MODERATION ─── */}
        {activeTab === 'reviews' && (
          <div className="space-y-4">
            {reviews.length === 0 ? (
              <div className="p-12 rounded-3xl text-center border border-slate-800 bg-slate-900/60 text-slate-400">
                <Star size={40} className="mx-auto mb-2 text-amber-400" />
                <p className="font-bold text-sm text-slate-300">No community reviews yet</p>
              </div>
            ) : (
              reviews.map((r) => (
                <div 
                  key={r.id}
                  className="p-5 rounded-3xl border border-slate-800 bg-slate-900 flex items-start justify-between gap-4 shadow-md"
                >
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center gap-2">
                      <div className="flex text-amber-400 text-xs">
                        {'★'.repeat(r.stars)}{'☆'.repeat(5 - r.stars)}
                      </div>
                      <span className="font-bold text-sm text-white">{r.userName}</span>
                      <span className="text-[11px] text-slate-400" dir="ltr">
                        {new Date(r.date).toLocaleDateString(lang === 'ar' ? 'ar-u-nu-latn' : 'fr-FR', {
                          day: 'numeric', month: 'short', year: 'numeric'
                        })}
                      </span>
                    </div>
                    <p className="text-sm leading-relaxed text-slate-300">
                      "{r.comment}"
                    </p>
                  </div>

                  <button
                    onClick={() => handleDeleteReview(r.id)}
                    className="p-2 rounded-xl text-slate-400 hover:text-red-400 transition-colors"
                    title="Delete Review"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))
            )}
          </div>
        )}

        {/* ─── TAB 4: USERS DIRECTORY (With Leaderboard & Pagination) ─── */}
        {activeTab === 'users' && (
          <div className="space-y-5">
            {/* ── Top Most Active User Highlight Card ── */}
            {topActiveUser && (
              <div className="p-5 sm:p-6 rounded-3xl border border-amber-500/30 bg-gradient-to-r from-amber-950/40 via-slate-900 to-slate-900 shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
                  <div className="flex items-center gap-3.5">
                    <div className="w-13 h-13 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 text-slate-950 flex items-center justify-center font-black text-xl shadow-lg shadow-amber-500/30">
                      🏆
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-[11px] font-black uppercase tracking-wider text-amber-400 flex items-center gap-1">
                          <Flame size={13} className="text-amber-400" />
                          {lang === 'ar' ? 'المستخدم الأكثر نشاطاً في التطبيق' : 'Most Active User'}
                        </span>
                      </div>
                      <h4 className="text-lg font-black text-white flex items-center gap-2">
                        <span>{topActiveUser.name}</span>
                        <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30">
                          #1 Leader
                        </span>
                      </h4>
                      <p className="text-xs text-slate-400 mt-0.5" dir="ltr">
                        Member since {new Date(topActiveUser.createdAt || Date.now()).toLocaleDateString(lang === 'ar' ? 'ar-u-nu-latn' : 'fr-FR', {
                          day: 'numeric', month: 'short', year: 'numeric'
                        })}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 bg-slate-950/80 px-4 py-3 rounded-2xl border border-slate-800">
                    <div className="text-right">
                      <p className="text-xs text-slate-400">{lang === 'ar' ? 'إجمالي العمليات' : 'Total Transactions'}</p>
                      <p className="text-lg font-black text-emerald-400" dir="ltr">
                        {topActiveUser.expenseCount || 0} <span className="text-xs font-normal text-slate-400">tx</span>
                      </p>
                    </div>
                    <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                      <Zap size={18} />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ── Search Bar & Filter Summary ── */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="relative w-full sm:flex-1">
                <input
                  type="text"
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  placeholder={lang === 'ar' ? 'بحث عن مستخدم بالاسم...' : 'Search registered users by name...'}
                  className={`w-full px-4 py-3.5 rounded-2xl text-sm border border-slate-800 bg-slate-900 text-white outline-none focus:border-emerald-500 shadow-sm ${
                    isRTL ? 'pr-11' : 'pl-11'
                  }`}
                />
                <Search 
                  size={16} 
                  className={`absolute top-1/2 -translate-y-1/2 ${isRTL ? 'right-4' : 'left-4'} text-slate-400`} 
                />
              </div>

              <div className="text-xs text-slate-400 font-medium px-3 py-2 rounded-xl bg-slate-900/60 border border-slate-800 shrink-0">
                {lang === 'ar' ? 'إجمالي المسجلين:' : 'Total Users:'}{' '}
                <span className="font-bold text-white">{sortedAndFilteredUsers.length}</span>
              </div>
            </div>

            {/* ── Transaction Type Filter Tabs ── */}
            <div className="flex items-center gap-2 p-1 rounded-2xl bg-slate-900/80 border border-slate-800 w-full">
              {[
                { id: 'all', label: lang === 'ar' ? 'الكل' : 'All', icon: null },
                { id: 'expenses', label: lang === 'ar' ? 'المصروفات فقط' : 'Expenses Only', icon: <span className="text-red-400">↘</span> },
                { id: 'income', label: lang === 'ar' ? 'الدخل فقط' : 'Income Only', icon: <span className="text-emerald-400">↗</span> },
              ].map((f) => (
                <button
                  key={f.id}
                  onClick={() => setUserTxFilter(f.id)}
                  className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                    userTxFilter === f.id
                      ? f.id === 'expenses'
                        ? 'bg-red-600/80 text-white shadow-sm'
                        : f.id === 'income'
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'bg-slate-700 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {f.icon}
                  {f.label}
                </button>
              ))}
            </div>

            {/* ── Paginated Users List (Not showing all at once!) ── */}
            <div className="rounded-3xl border border-slate-800 bg-slate-900 shadow-md overflow-hidden">
              <div className="divide-y divide-slate-800">
                {paginatedUsers.length === 0 ? (
                  <div className="p-10 text-center text-slate-400 text-sm font-medium">
                    {lang === 'ar' ? 'لم يتم العثور على أي مستخدم مطابق' : 'No matching users found'}
                  </div>
                ) : (
                  paginatedUsers.map((u, i) => {
                    const globalIndex = (userPage - 1) * USERS_PER_PAGE + i;
                    const isTop1 = globalIndex === 0 && (u.expenseCount > 0);
                    return (
                      <div 
                        key={u.id || i} 
                        onClick={() => setSelectedUserDetail(u)}
                        className="p-4 flex items-center justify-between gap-3 text-sm hover:bg-slate-800/60 transition-colors cursor-pointer group"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-extrabold border transition-transform group-hover:scale-105 ${
                            isTop1 
                              ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-sm shadow-amber-500/20' 
                              : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                          }`}>
                            {isTop1 ? '🥇' : (u.name?.[0]?.toUpperCase() || 'U')}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-bold text-white group-hover:text-emerald-400 transition-colors">{u.name}</p>
                              {isTop1 && (
                                <span className="text-[10px] font-black px-1.5 py-0.2 rounded-md bg-amber-400/20 text-amber-300 border border-amber-400/30">
                                  Top Active
                                </span>
                              )}
                              {u.role === 'admin' && (
                                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-md bg-rose-500/20 text-rose-300 border border-rose-500/30">
                                  Admin
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-slate-400" dir="ltr">
                              Joined: {new Date(u.createdAt || Date.now()).toLocaleDateString(lang === 'ar' ? 'ar-u-nu-latn' : 'fr-FR', {
                                day: 'numeric', month: 'short', year: 'numeric'
                              })}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {/* Expense count */}
                          <div className="text-right px-2.5 py-1.5 rounded-xl bg-red-950/40 border border-red-900/40 group-hover:border-red-500/30 transition-colors">
                            <span className="text-xs font-black text-red-400" dir="ltr">
                              {u.expenseCount !== undefined ? u.expenseCount : 0}
                            </span>
                            <span className="text-[10px] text-slate-400 ml-1">
                              {lang === 'ar' ? 'مصروف' : 'exp'}
                            </span>
                          </div>
                          {/* Income count — only shown when available */}
                          {(u.incomeCount !== undefined) && (
                            <div className="text-right px-2.5 py-1.5 rounded-xl bg-emerald-950/40 border border-emerald-900/40 group-hover:border-emerald-500/30 transition-colors">
                              <span className="text-xs font-black text-emerald-400" dir="ltr">
                                {u.incomeCount || 0}
                              </span>
                              <span className="text-[10px] text-slate-400 ml-1">
                                {lang === 'ar' ? 'دخل' : 'inc'}
                              </span>
                            </div>
                          )}
                          <span className="text-slate-500 group-hover:text-slate-300 text-xs hidden sm:inline">
                            →
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* ── Pagination Bar: Controls showing users in pages ── */}
              {totalUserPages > 1 && (
                <div className="p-3.5 bg-slate-950/70 border-t border-slate-800 flex items-center justify-between text-xs">
                  <span className="text-slate-400 font-medium">
                    {lang === 'ar' 
                      ? `الصفحة ${userPage} من ${totalUserPages}` 
                      : `Page ${userPage} of ${totalUserPages}`}
                  </span>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      disabled={userPage <= 1}
                      onClick={() => setUserPage(p => Math.max(p - 1, 1))}
                      className={`p-2 rounded-xl border flex items-center gap-1 transition-all ${
                        userPage <= 1 
                          ? 'border-slate-800 text-slate-600 cursor-not-allowed' 
                          : 'border-slate-700 text-slate-300 hover:bg-slate-800 active:scale-95'
                      }`}
                    >
                      <ChevronLeft size={15} />
                      <span className="hidden sm:inline">{lang === 'ar' ? 'السابق' : 'Prev'}</span>
                    </button>

                    <div className="flex items-center gap-1">
                      {Array.from({ length: totalUserPages }, (_, idx) => idx + 1)
                        .filter(p => p === 1 || p === totalUserPages || Math.abs(p - userPage) <= 1)
                        .map((p, idx, arr) => (
                          <React.Fragment key={p}>
                            {idx > 0 && arr[idx - 1] !== p - 1 && (
                              <span className="text-slate-600 px-1">...</span>
                            )}
                            <button
                              type="button"
                              onClick={() => setUserPage(p)}
                              className={`w-7 h-7 rounded-xl font-bold transition-all ${
                                userPage === p 
                                  ? 'bg-emerald-600 text-white shadow-sm' 
                                  : 'text-slate-400 hover:bg-slate-800'
                              }`}
                            >
                              {p}
                            </button>
                          </React.Fragment>
                        ))}
                    </div>

                    <button
                      type="button"
                      disabled={userPage >= totalUserPages}
                      onClick={() => setUserPage(p => Math.min(p + 1, totalUserPages))}
                      className={`p-2 rounded-xl border flex items-center gap-1 transition-all ${
                        userPage >= totalUserPages 
                          ? 'border-slate-800 text-slate-600 cursor-not-allowed' 
                          : 'border-slate-700 text-slate-300 hover:bg-slate-800 active:scale-95'
                      }`}
                    >
                      <span className="hidden sm:inline">{lang === 'ar' ? 'التالي' : 'Next'}</span>
                      <ChevronRight size={15} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ─── TAB 5: ADMIN PROFILE & SECURITY SETTINGS ─── */}
        {activeTab === 'settings' && (
          <div className="max-w-xl mx-auto space-y-6">
            <div className="p-6 sm:p-7 rounded-3xl border border-slate-800 bg-slate-900 shadow-xl">
              <div className="flex items-center gap-3 mb-6">
                <div 
                  className="w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-emerald-500/20"
                  style={{ background: 'linear-gradient(135deg, #059669, #10B981)' }}
                >
                  <Settings size={22} />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-white">
                    {t('admin.adminProfileTitle')}
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {t('admin.adminProfileSubtitle')}
                  </p>
                </div>
              </div>

              <form onSubmit={handleSaveAdminSettings} className="space-y-4">
                {/* Admin Username */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center gap-1.5">
                    <User size={14} className="text-emerald-400" />
                    <span>{t('admin.adminNameLabel')}</span>
                  </label>
                  <input
                    type="text"
                    value={settingsForm.name}
                    onChange={(e) => setSettingsForm({ ...settingsForm, name: e.target.value })}
                    className="w-full px-4 py-3 rounded-2xl text-sm border border-slate-700 bg-slate-950 text-white outline-none focus:border-emerald-500 transition-all"
                  />
                  {settingsErrors.name && (
                    <p className="text-red-400 text-xs mt-1">{settingsErrors.name}</p>
                  )}
                </div>

                {/* Current Admin Password */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center gap-1.5">
                    <Key size={14} className="text-amber-400" />
                    <span>{t('admin.adminPasswordLabel')}</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showCurrentPass ? 'text' : 'password'}
                      value={settingsForm.currentPassword}
                      onChange={(e) => setSettingsForm({ ...settingsForm, currentPassword: e.target.value })}
                      placeholder="••••••••"
                      className={`w-full px-4 py-3 rounded-2xl text-sm border border-slate-700 bg-slate-950 text-white outline-none focus:border-emerald-500 transition-all ${
                        isRTL ? 'pl-11' : 'pr-11'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPass(!showCurrentPass)}
                      className={`absolute top-1/2 -translate-y-1/2 ${isRTL ? 'left-3' : 'right-3'} text-slate-400 hover:text-white p-1`}
                    >
                      {showCurrentPass ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {settingsErrors.currentPassword && (
                    <p className="text-red-400 text-xs mt-1">{settingsErrors.currentPassword}</p>
                  )}
                </div>

                {/* New Admin Password (Optional) */}
                <div className="pt-2 border-t border-slate-800">
                  <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center gap-1.5">
                    <Lock size={14} className="text-emerald-400" />
                    <span>{t('admin.adminNewPasswordLabel')}</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showNewPass ? 'text' : 'password'}
                      value={settingsForm.newPassword}
                      onChange={(e) => setSettingsForm({ ...settingsForm, newPassword: e.target.value })}
                      placeholder="••••••••"
                      className={`w-full px-4 py-3 rounded-2xl text-sm border border-slate-700 bg-slate-950 text-white outline-none focus:border-emerald-500 transition-all ${
                        isRTL ? 'pl-11' : 'pr-11'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPass(!showNewPass)}
                      className={`absolute top-1/2 -translate-y-1/2 ${isRTL ? 'left-3' : 'right-3'} text-slate-400 hover:text-white p-1`}
                    >
                      {showNewPass ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {settingsErrors.newPassword && (
                    <p className="text-red-400 text-xs mt-1">{settingsErrors.newPassword}</p>
                  )}
                </div>

                {/* Confirm New Password */}
                {settingsForm.newPassword && (
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1.5">
                      {t('admin.adminConfirmPasswordLabel')}
                    </label>
                    <input
                      type="password"
                      value={settingsForm.confirmPassword}
                      onChange={(e) => setSettingsForm({ ...settingsForm, confirmPassword: e.target.value })}
                      placeholder="••••••••"
                      className="w-full px-4 py-3 rounded-2xl text-sm border border-slate-700 bg-slate-950 text-white outline-none focus:border-emerald-500 transition-all"
                    />
                    {settingsErrors.confirmPassword && (
                      <p className="text-red-400 text-xs mt-1">{settingsErrors.confirmPassword}</p>
                    )}
                  </div>
                )}

                <div className="pt-4">
                  <button
                    type="submit"
                    className="w-full py-3.5 rounded-2xl font-bold text-white text-sm shadow-lg shadow-emerald-500/30 transition-all active:scale-95 flex items-center justify-center gap-2"
                    style={{ background: 'linear-gradient(135deg, #059669, #10B981)' }}
                  >
                    <Check size={17} />
                    <span>{t('admin.saveAdminSettings')}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>

      {/* ─── USER DETAIL MODAL (Shows exact transactions count and profile info) ─── */}
      {selectedUserDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div 
            className="w-full max-w-md rounded-3xl border border-slate-800 bg-slate-900 shadow-2xl p-6 text-white relative animate-scale-up"
            dir={isRTL ? 'rtl' : 'ltr'}
          >
            {/* Close button */}
            <button
              onClick={() => setSelectedUserDetail(null)}
              className="absolute top-5 right-5 text-slate-400 hover:text-white p-1 rounded-xl hover:bg-slate-800 transition-colors"
            >
              ✕
            </button>

            {/* Header info */}
            <div className="flex items-center gap-3.5 mb-6">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-700 text-white flex items-center justify-center text-xl font-black shadow-lg shadow-emerald-500/20">
                {selectedUserDetail.name?.[0]?.toUpperCase() || 'U'}
              </div>
              <div>
                <h3 className="text-lg font-black flex items-center gap-2">
                  <span>{selectedUserDetail.name}</span>
                  {selectedUserDetail.role === 'admin' ? (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30">
                      Admin
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      Active User
                    </span>
                  )}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5" dir="ltr">
                  User ID: {selectedUserDetail.id?.slice(0, 16)}...
                </p>
              </div>
            </div>

            {/* Metrics cards */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="p-4 rounded-2xl bg-slate-950 border border-red-900/30">
                <span className="text-xs text-slate-400 block mb-1 flex items-center gap-1">
                  <span className="text-red-400 text-base">↘</span>
                  {lang === 'ar' ? 'المصروفات' : 'Expenses'}
                </span>
                <span className="text-2xl font-black text-red-400" dir="ltr">
                  {selectedUserDetail.expenseCount || 0}
                </span>
                <span className="text-[11px] text-slate-500 block mt-0.5">
                  {lang === 'ar' ? 'عملية مصروف' : 'transactions'}
                </span>
                {selectedUserDetail.expenseTotal > 0 && (
                  <span className="text-xs font-bold text-red-300 mt-1 block" dir="ltr">
                    {selectedUserDetail.expenseTotal.toLocaleString()} MRU
                  </span>
                )}
              </div>

              <div className="p-4 rounded-2xl bg-slate-950 border border-emerald-900/30">
                <span className="text-xs text-slate-400 block mb-1 flex items-center gap-1">
                  <span className="text-emerald-400 text-base">↗</span>
                  {lang === 'ar' ? 'الدخل' : 'Income'}
                </span>
                <span className="text-2xl font-black text-emerald-400" dir="ltr">
                  {selectedUserDetail.incomeCount || 0}
                </span>
                <span className="text-[11px] text-slate-500 block mt-0.5">
                  {lang === 'ar' ? 'عملية دخل' : 'transactions'}
                </span>
                {selectedUserDetail.incomeTotal > 0 && (
                  <span className="text-xs font-bold text-emerald-300 mt-1 block" dir="ltr">
                    {selectedUserDetail.incomeTotal.toLocaleString()} MRU
                  </span>
                )}
              </div>
            </div>

            {/* Total & Join Date */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800">
                <span className="text-xs text-slate-400 block mb-1">
                  {lang === 'ar' ? 'إجمالي المعاملات' : 'Total Transactions'}
                </span>
                <span className="text-2xl font-black text-white" dir="ltr">
                  {(selectedUserDetail.expenseCount || 0) + (selectedUserDetail.incomeCount || 0) || selectedUserDetail.expenseCount || 0}
                </span>
                <span className="text-[11px] text-slate-500 block mt-0.5">
                  {lang === 'ar' ? 'مدخلات مسجلة' : 'Logged entries'}
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800">
                <span className="text-xs text-slate-400 block mb-1">
                  {lang === 'ar' ? 'تاريخ الانضمام' : 'Join Date'}
                </span>
                <span className="text-sm font-bold text-slate-200 block mt-1" dir="ltr">
                  {new Date(selectedUserDetail.createdAt || Date.now()).toLocaleDateString(lang === 'ar' ? 'ar-u-nu-latn' : 'fr-FR', {
                    day: 'numeric', month: 'short', year: 'numeric'
                  })}
                </span>
                <span className="text-[11px] text-slate-500 block mt-1">
                  {lang === 'ar' ? 'حساب موثق' : 'Verified Profile'}
                </span>
              </div>
            </div>

            {/* Action button */}
            <button
              onClick={() => setSelectedUserDetail(null)}
              className="w-full py-3 rounded-2xl font-bold text-sm bg-slate-800 hover:bg-slate-700 text-white transition-all active:scale-95"
            >
              {lang === 'ar' ? 'إغلاق' : 'Close'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
