import React, { useState, useMemo } from 'react';
import { 
  Shield, ArrowLeft, ArrowRight, Lock, Unlock, Users, 
  Receipt, TrendingUp, Star, MessageSquare, CheckCircle2, 
  Clock, AlertCircle, Trash2, Edit3, ExternalLink, RefreshCw, 
  Search, Bug, Lightbulb, UserCheck, HelpCircle, Phone, Mail
} from 'lucide-react';
import { useMasarifi } from '../context/MasarifiContext';

export default function AdminScreen() {
  const { 
    t, isDark, isRTL, lang, setScreen,
    isAdminLoggedIn, verifyAdminPin, logoutAdmin,
    tickets, updateTicketStatus, deleteTicket,
    reviews, deleteReview,
    allUsersList, expenses, totalExpenses, totalIncome,
    showToast
  } = useMasarifi();

  const [activeTab, setActiveTab] = useState('tickets'); // 'stats' | 'tickets' | 'reviews' | 'users'
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState('');
  const [ticketFilter, setTicketFilter] = useState('all'); // 'all' | 'new' | 'in_progress' | 'resolved'
  const [ticketCatFilter, setTicketCatFilter] = useState('all');
  const [adminNotes, setAdminNotes] = useState({});
  const [userSearch, setUserSearch] = useState('');

  const BackArrow = isRTL ? ArrowRight : ArrowLeft;

  // Handle PIN unlock
  const handleUnlock = (e) => {
    e.preventDefault();
    const res = verifyAdminPin(pinInput);
    if (res.success) {
      setPinError('');
      setPinInput('');
      showToast('🔓 ' + t('admin.unlock'));
    } else {
      setPinError(t('admin.pinError'));
    }
  };

  // KPI Calculations
  const totalUsersCount = Math.max(allUsersList.length, 1);
  const totalTicketsCount = tickets.length;
  const openTicketsCount = tickets.filter(t => t.status !== 'resolved').length;
  const newTicketsCount = tickets.filter(t => t.status === 'new').length;

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

  // Filtered users
  const filteredUsers = useMemo(() => {
    if (!userSearch.trim()) return allUsersList;
    return allUsersList.filter(u => 
      u.name?.toLowerCase().includes(userSearch.toLowerCase())
    );
  }, [allUsersList, userSearch]);

  const handleUpdateStatus = async (ticketId, nextStatus) => {
    const note = adminNotes[ticketId] !== undefined ? adminNotes[ticketId] : null;
    const res = await updateTicketStatus(ticketId, nextStatus, note);
    if (res.success) {
      showToast('✅ Status updated');
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
      showToast('🗑️ Ticket deleted');
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

  // If Admin is NOT logged in, show PIN Authentication screen
  if (!isAdminLoggedIn) {
    return (
      <div 
        className={`min-h-screen flex flex-col items-center justify-center p-4 ${
          isDark ? 'bg-slate-950 text-slate-100' : 'bg-gradient-to-br from-slate-50 via-white to-emerald-50 text-slate-900'
        }`}
        dir={isRTL ? 'rtl' : 'ltr'}
      >
        <div className={`w-full max-w-sm rounded-3xl p-6 sm:p-8 shadow-2xl border text-center ${
          isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
        }`}>
          <div 
            className="w-16 h-16 rounded-3xl mx-auto mb-4 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20"
            style={{ background: 'linear-gradient(135deg, #059669, #10B981)' }}
          >
            <Shield size={32} />
          </div>

          <h1 className="text-xl font-extrabold mb-1">{t('admin.pinTitle')}</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">{t('admin.pinSubtitle')}</p>

          <form onSubmit={handleUnlock} className="space-y-4">
            <div>
              <input
                type="password"
                autoFocus
                value={pinInput}
                onChange={(e) => { setPinInput(e.target.value); setPinError(''); }}
                placeholder={t('admin.pinPlaceholder')}
                className={`w-full px-4 py-3.5 rounded-2xl text-center text-lg tracking-widest font-bold border outline-none transition-all ${
                  isDark 
                    ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-500 focus:border-emerald-500' 
                    : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 focus:border-emerald-400'
                }`}
              />
              {pinError && <p className="text-red-500 text-xs mt-2 font-medium">{pinError}</p>}
            </div>

            <button
              type="submit"
              className="w-full py-3.5 rounded-2xl font-bold text-white text-sm shadow-md transition-all active:scale-95 flex items-center justify-center gap-2"
              style={{ background: 'linear-gradient(135deg, #059669, #10B981)' }}
            >
              <Unlock size={17} />
              <span>{t('admin.unlock')}</span>
            </button>
          </form>

          <button
            onClick={() => setScreen('app')}
            className="mt-5 text-xs font-semibold text-slate-400 hover:text-emerald-500 transition-colors"
          >
            {t('admin.backToApp')}
          </button>
        </div>
      </div>
    );
  }

  // ── Admin Dashboard Main Screen ──
  return (
    <div 
      className={`min-h-screen pb-12 ${isDark ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'}`}
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      {/* Top Bar */}
      <div className={`sticky top-0 z-30 px-4 sm:px-6 py-4 flex items-center justify-between border-b backdrop-blur-md ${
        isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white/90 border-slate-200'
      }`}>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setScreen('app')}
            className={`p-2 rounded-xl transition-colors flex items-center gap-1.5 text-xs font-bold ${
              isDark ? 'bg-slate-800 hover:bg-slate-700 text-slate-200' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
            title={t('admin.backToApp')}
          >
            <BackArrow size={16} />
            <span className="hidden sm:inline">{t('admin.backToApp')}</span>
          </button>

          <div className="flex items-center gap-2">
            <div 
              className="w-9 h-9 rounded-xl flex items-center justify-center text-white shadow-sm"
              style={{ background: 'linear-gradient(135deg, #059669, #10B981)' }}
            >
              <Shield size={18} />
            </div>
            <div>
              <h1 className="font-extrabold text-sm sm:text-base leading-tight">
                {t('admin.title')}
              </h1>
              <span className="inline-flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live Control Center
              </span>
            </div>
          </div>
        </div>

        <button
          onClick={logoutAdmin}
          className={`px-3 py-2 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 ${
            isDark ? 'bg-red-950/40 border border-red-900 text-red-400 hover:bg-red-900/40' : 'bg-red-50 border border-red-200 text-red-600 hover:bg-red-100'
          }`}
        >
          <Lock size={14} />
          <span>{t('admin.logout')}</span>
        </button>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-6">
        {/* Tab Navigation */}
        <div className={`flex rounded-2xl p-1 mb-6 border ${
          isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
        }`}>
          {[
            { id: 'tickets', label: t('admin.tabTickets'), count: openTicketsCount },
            { id: 'stats', label: t('admin.tabStats') },
            { id: 'reviews', label: t('admin.tabReviews'), count: reviews.length },
            { id: 'users', label: t('admin.tabUsers'), count: totalUsersCount },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-1.5 ${
                activeTab === tab.id
                  ? 'bg-emerald-600 text-white shadow-md'
                  : isDark
                  ? 'text-slate-400 hover:text-white'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>{tab.label}</span>
              {tab.count !== undefined && tab.count > 0 && (
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-extrabold ${
                  activeTab === tab.id ? 'bg-white text-emerald-700' : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* ─── TAB 1: SUPPORT TICKETS ─── */}
        {activeTab === 'tickets' && (
          <div>
            {/* Filter controls */}
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                {[
                  { id: 'all', label: t('admin.filterAll') },
                  { id: 'new', label: t('admin.filterNew'), count: newTicketsCount },
                  { id: 'in_progress', label: t('admin.filterInProgress') },
                  { id: 'resolved', label: t('admin.filterResolved') },
                ].map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setTicketFilter(f.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      ticketFilter === f.id
                        ? 'bg-slate-800 text-white dark:bg-slate-100 dark:text-slate-900 shadow-sm'
                        : isDark
                        ? 'bg-slate-900 text-slate-400 border border-slate-800 hover:bg-slate-800'
                        : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {f.label} {f.count ? `(${f.count})` : ''}
                  </button>
                ))}
              </div>

              {/* Category Filter */}
              <div className="flex items-center gap-1">
                {['all', 'bug', 'suggestion', 'account'].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setTicketCatFilter(cat)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border ${
                      ticketCatFilter === cat
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
                        : isDark ? 'border-slate-800 text-slate-400' : 'border-slate-200 text-slate-500'
                    }`}
                  >
                    {cat === 'all' ? 'All Types' : t(`support.${cat}`)}
                  </button>
                ))}
              </div>
            </div>

            {/* Tickets list */}
            {filteredTickets.length === 0 ? (
              <div className={`p-10 rounded-3xl text-center border ${
                isDark ? 'bg-slate-900 border-slate-800 text-slate-400' : 'bg-white border-slate-200 text-slate-500'
              }`}>
                <CheckCircle2 size={36} className="mx-auto mb-2 text-emerald-500" />
                <p className="font-bold text-sm">{t('admin.noTickets')}</p>
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
                        isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                            {getCatIcon(ticket.category)}
                          </span>
                          <span className="font-extrabold text-sm sm:text-base">
                            {ticket.subject}
                          </span>
                          <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                            isNew 
                              ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border border-blue-200 dark:border-blue-900'
                              : isInProgress 
                              ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-200 dark:border-amber-900'
                              : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900'
                          }`}>
                            {isNew ? 'New / جديد' : isInProgress ? 'In Progress / قيد المتابعة' : 'Resolved / تم الحل'}
                          </span>
                        </div>

                        <button
                          onClick={() => handleDeleteTicket(ticket.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 transition-colors"
                          title={t('admin.deleteTicket')}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>

                      <p className={`text-xs sm:text-sm leading-relaxed mb-4 whitespace-pre-line ${
                        isDark ? 'text-slate-300' : 'text-slate-700'
                      }`}>
                        {ticket.message}
                      </p>

                      {/* Ticket Meta / User info */}
                      <div className={`p-3 rounded-2xl flex flex-wrap items-center justify-between gap-2 text-xs mb-4 ${
                        isDark ? 'bg-slate-800/60 text-slate-400' : 'bg-slate-50 text-slate-600'
                      }`}>
                        <div className="flex items-center gap-3">
                          <span className="font-bold text-slate-800 dark:text-slate-200">
                            👤 {ticket.userName}
                          </span>
                          <span>
                            🗓️ {new Date(ticket.createdAt).toLocaleDateString(lang === 'ar' ? 'ar-u-nu-latn' : 'fr-FR', {
                              day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
                            })}
                          </span>
                        </div>

                        {ticket.contact && (
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                              📞 {ticket.contact}
                            </span>
                            {ticket.contact.includes('@') ? (
                              <a
                                href={`mailto:${ticket.contact}?subject=Masarifi Support: ${encodeURIComponent(ticket.subject)}`}
                                className="px-2 py-0.5 rounded-lg bg-emerald-600 text-white font-bold flex items-center gap-1 hover:bg-emerald-700"
                              >
                                <Mail size={11} />
                                <span>Email</span>
                              </a>
                            ) : (
                              <a
                                href={`https://wa.me/${ticket.contact.replace(/[^0-9]/g, '')}`}
                                target="_blank"
                                rel="noreferrer"
                                className="px-2 py-0.5 rounded-lg bg-emerald-600 text-white font-bold flex items-center gap-1 hover:bg-emerald-700"
                              >
                                <ExternalLink size={11} />
                                <span>WhatsApp</span>
                              </a>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Admin Resolution Notes & Action buttons */}
                      <div className="pt-2 border-t border-inherit space-y-3">
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            placeholder={ticket.adminNotes || t('admin.adminNotes')}
                            value={adminNotes[ticket.id] !== undefined ? adminNotes[ticket.id] : (ticket.adminNotes || '')}
                            onChange={(e) => setAdminNotes({ ...adminNotes, [ticket.id]: e.target.value })}
                            className={`flex-1 px-3 py-2 rounded-xl text-xs border outline-none ${
                              isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-800'
                            }`}
                          />
                          <button
                            onClick={() => handleSaveNote(ticket.id)}
                            className="px-3 py-2 rounded-xl text-xs font-bold bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors"
                          >
                            {t('admin.saveNotes')}
                          </button>
                        </div>

                        <div className="flex items-center gap-2 justify-end">
                          {!isInProgress && (
                            <button
                              onClick={() => handleUpdateStatus(ticket.id, 'in_progress')}
                              className="px-3 py-1.5 rounded-xl text-xs font-bold bg-amber-500 text-white hover:bg-amber-600 transition-all active:scale-95"
                            >
                              {t('admin.markProgress')}
                            </button>
                          )}
                          {!isResolved && (
                            <button
                              onClick={() => handleUpdateStatus(ticket.id, 'resolved')}
                              className="px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-700 transition-all active:scale-95"
                            >
                              ✓ {t('admin.markResolved')}
                            </button>
                          )}
                          {isResolved && (
                            <button
                              onClick={() => handleUpdateStatus(ticket.id, 'in_progress')}
                              className="px-3 py-1.5 rounded-xl text-xs font-bold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                            >
                              Reopen
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

        {/* ─── TAB 2: PLATFORM STATISTICS ─── */}
        {activeTab === 'stats' && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
              <div className={`p-5 rounded-3xl border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
                <div className="w-10 h-10 rounded-2xl bg-blue-100 dark:bg-blue-950 flex items-center justify-center text-blue-600 mb-3">
                  <Users size={20} />
                </div>
                <p className="text-2xl sm:text-3xl font-extrabold tracking-tight">{totalUsersCount}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{t('admin.kpiUsers')}</p>
              </div>

              <div className={`p-5 rounded-3xl border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
                <div className="w-10 h-10 rounded-2xl bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center text-emerald-600 mb-3">
                  <TrendingUp size={20} />
                </div>
                <p className="text-2xl sm:text-3xl font-extrabold tracking-tight" dir="ltr">
                  {totalExpenses.toLocaleString('en-US')}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{t('admin.kpiVolume')} (MRU)</p>
              </div>

              <div className={`p-5 rounded-3xl border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
                <div className="w-10 h-10 rounded-2xl bg-amber-100 dark:bg-amber-950 flex items-center justify-center text-amber-500 mb-3">
                  <Star size={20} className="fill-amber-400" />
                </div>
                <p className="text-2xl sm:text-3xl font-extrabold tracking-tight">⭐ {avgRating}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{t('admin.kpiRating')} ({reviews.length})</p>
              </div>

              <div className={`p-5 rounded-3xl border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
                <div className="w-10 h-10 rounded-2xl bg-violet-100 dark:bg-violet-950 flex items-center justify-center text-violet-600 mb-3">
                  <MessageSquare size={20} />
                </div>
                <p className="text-2xl sm:text-3xl font-extrabold tracking-tight">{openTicketsCount}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{t('admin.kpiTickets')}</p>
              </div>
            </div>

            {/* Platform status card */}
            <div className={`p-6 rounded-3xl border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
              <h3 className="font-extrabold text-base mb-3 flex items-center gap-2">
                <span>🛡️ Platform Health</span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-between">
                  <span className="font-medium text-slate-600 dark:text-slate-400">Database Synchronization</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">Active (Supabase)</span>
                </div>
                <div className="p-3 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-between">
                  <span className="font-medium text-slate-600 dark:text-slate-400">AI Financial Advisor</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">Online (Groq LLM)</span>
                </div>
                <div className="p-3 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-between">
                  <span className="font-medium text-slate-600 dark:text-slate-400">Version</span>
                  <span className="font-bold">v2.3.0 True AI Edition</span>
                </div>
                <div className="p-3 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-between">
                  <span className="font-medium text-slate-600 dark:text-slate-400">Default Currency</span>
                  <span className="font-bold">Mauritanian Ouguiya (MRU)</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ─── TAB 3: REVIEWS MODERATION ─── */}
        {activeTab === 'reviews' && (
          <div className="space-y-4">
            {reviews.length === 0 ? (
              <div className={`p-10 rounded-3xl text-center border ${
                isDark ? 'bg-slate-900 border-slate-800 text-slate-400' : 'bg-white border-slate-200 text-slate-500'
              }`}>
                <Star size={36} className="mx-auto mb-2 text-amber-400" />
                <p className="font-bold text-sm">No community reviews yet</p>
              </div>
            ) : (
              reviews.map((r) => (
                <div 
                  key={r.id}
                  className={`p-5 rounded-3xl border flex items-start justify-between gap-4 ${
                    isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
                  }`}
                >
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center gap-2">
                      <div className="flex text-amber-400 text-xs">
                        {'★'.repeat(r.stars)}{'☆'.repeat(5 - r.stars)}
                      </div>
                      <span className="font-bold text-sm">{r.userName}</span>
                      <span className="text-[11px] text-slate-400">
                        {new Date(r.date).toLocaleDateString(lang === 'ar' ? 'ar-u-nu-latn' : 'fr-FR', {
                          day: 'numeric', month: 'short', year: 'numeric'
                        })}
                      </span>
                    </div>
                    <p className={`text-sm leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                      "{r.comment}"
                    </p>
                  </div>

                  <button
                    onClick={() => handleDeleteReview(r.id)}
                    className="p-2 rounded-xl text-slate-400 hover:text-red-500 transition-colors"
                    title="Delete Review"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))
            )}
          </div>
        )}

        {/* ─── TAB 4: USERS DIRECTORY ─── */}
        {activeTab === 'users' && (
          <div className="space-y-4">
            <div className="relative">
              <input
                type="text"
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                placeholder="Search registered users by name..."
                className={`w-full px-4 py-3 rounded-2xl text-sm border outline-none ${
                  isDark ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-800 shadow-sm'
                } ${isRTL ? 'pr-10' : 'pl-10'}`}
              />
              <Search 
                size={16} 
                className={`absolute top-1/2 -translate-y-1/2 ${isRTL ? 'right-3' : 'left-3'} text-slate-400`} 
              />
            </div>

            <div className={`rounded-3xl border overflow-hidden ${
              isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
            }`}>
              <div className="divide-y divide-inherit">
                {filteredUsers.map((u, i) => (
                  <div key={u.id || i} className="p-4 flex items-center justify-between gap-3 text-sm">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-bold flex items-center justify-center">
                        {u.name?.[0]?.toUpperCase() || 'U'}
                      </div>
                      <div>
                        <p className="font-bold text-slate-900 dark:text-white">{u.name}</p>
                        <p className="text-xs text-slate-400">
                          Joined: {new Date(u.createdAt || Date.now()).toLocaleDateString(lang === 'ar' ? 'ar-u-nu-latn' : 'fr-FR', {
                            day: 'numeric', month: 'short', year: 'numeric'
                          })}
                        </p>
                      </div>
                    </div>

                    <span className="px-2.5 py-1 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                      User Account
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
