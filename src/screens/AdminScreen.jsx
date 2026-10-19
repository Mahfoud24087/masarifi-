import React, { useState, useMemo } from 'react';
import { 
  Shield, ArrowLeft, ArrowRight, Lock, Unlock, Users, 
  Receipt, TrendingUp, Star, MessageSquare, CheckCircle2, 
  Clock, AlertCircle, Trash2, Edit3, ExternalLink, RefreshCw, 
  Search, Bug, Lightbulb, UserCheck, HelpCircle, Phone, Mail,
  Send, Sparkles, Activity, Check, Eye, EyeOff
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

  const [activeTab, setActiveTab] = useState('tickets'); // 'tickets' | 'stats' | 'reviews' | 'users'
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState('');
  const [showPin, setShowPin] = useState(false);
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

  // ── 1. PIN Security Lock Screen ──
  if (!isAdminLoggedIn) {
    return (
      <div 
        className={`min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden ${
          isDark 
            ? 'bg-slate-950 text-slate-100' 
            : 'bg-gradient-to-br from-slate-900 via-slate-950 to-emerald-950 text-white'
        }`}
        dir={isRTL ? 'rtl' : 'ltr'}
      >
        {/* Ambient background glow rings */}
        <div className="absolute top-1/4 -left-20 w-80 h-80 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 -right-20 w-80 h-80 rounded-full bg-teal-500/10 blur-3xl pointer-events-none" />

        <div className="w-full max-w-sm rounded-3xl p-7 sm:p-9 shadow-2xl border border-slate-800 bg-slate-900/90 backdrop-blur-xl text-center relative z-10">
          <div 
            className="w-16 h-16 rounded-3xl mx-auto mb-4 flex items-center justify-center text-white shadow-xl shadow-emerald-500/20 border border-emerald-400/30"
            style={{ background: 'linear-gradient(135deg, #059669, #10B981)' }}
          >
            <Shield size={32} />
          </div>

          <h1 className="text-xl font-extrabold mb-1 text-white">{t('admin.pinTitle')}</h1>
          <p className="text-xs text-slate-400 mb-6">{t('admin.pinSubtitle')}</p>

          <form onSubmit={handleUnlock} className="space-y-4">
            <div className="relative">
              <input
                type={showPin ? 'text' : 'password'}
                autoFocus
                value={pinInput}
                onChange={(e) => { setPinInput(e.target.value); setPinError(''); }}
                placeholder={t('admin.pinPlaceholder')}
                className="w-full px-4 py-3.5 rounded-2xl text-center text-lg tracking-widest font-bold border outline-none transition-all bg-slate-800/90 border-slate-700 text-white placeholder-slate-500 focus:border-emerald-500 shadow-inner"
              />
              <button
                type="button"
                onClick={() => setShowPin(!showPin)}
                className={`absolute top-1/2 -translate-y-1/2 ${isRTL ? 'left-3' : 'right-3'} text-slate-400 hover:text-white p-1`}
              >
                {showPin ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            {pinError && (
              <div className="p-2.5 rounded-xl bg-red-950/60 border border-red-800 text-red-300 text-xs font-semibold flex items-center justify-center gap-1.5 animate-shake">
                <AlertCircle size={14} />
                <span>{pinError}</span>
              </div>
            )}

            <button
              type="submit"
              className="w-full py-3.5 rounded-2xl font-bold text-white text-sm shadow-lg shadow-emerald-500/30 transition-all active:scale-95 flex items-center justify-center gap-2"
              style={{ background: 'linear-gradient(135deg, #059669, #10B981)' }}
              id="masarifi-admin-unlock-btn"
            >
              <Unlock size={17} />
              <span>{t('admin.unlock')}</span>
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-slate-800/80 flex items-center justify-center">
            <button
              onClick={() => setScreen('auth-signin')}
              className="text-xs font-semibold text-slate-400 hover:text-emerald-400 transition-colors flex items-center gap-1.5"
            >
              <BackArrow size={14} />
              <span>{t('auth.signIn')} / {t('admin.backToApp')}</span>
            </button>
          </div>
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
          <button
            onClick={() => setScreen('app')}
            className="p-2.5 rounded-xl transition-all flex items-center gap-2 text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700"
            title={t('admin.backToApp')}
            id="masarifi-admin-back-btn"
          >
            <BackArrow size={16} />
            <span className="hidden sm:inline">{t('admin.backToApp')}</span>
          </button>

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
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
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

          {/* Card 2: Tracked Volume */}
          <div className="p-4 sm:p-5 rounded-3xl border border-slate-800 bg-slate-900/80 shadow-lg relative overflow-hidden group hover:border-emerald-500/40 transition-all">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-400">{t('admin.kpiVolume')}</span>
              <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20">
                <TrendingUp size={18} />
              </div>
            </div>
            <p className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight" dir="ltr">
              {totalExpenses.toLocaleString('en-US')}
            </p>
            <div className="flex items-center gap-1 mt-2 text-[11px] text-emerald-400 font-semibold">
              <span>MRU (Ouguiya)</span>
            </div>
          </div>

          {/* Card 3: Resolution Rate */}
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

          {/* Card 4: Community Rating */}
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
        <div className="flex rounded-2xl p-1.5 mb-6 border border-slate-800 bg-slate-900/90 shadow-md">
          {[
            { id: 'tickets', label: t('admin.tabTickets'), count: openTicketsCount, highlight: openTicketsCount > 0 },
            { id: 'stats', label: t('admin.tabStats') },
            { id: 'reviews', label: t('admin.tabReviews'), count: reviews.length },
            { id: 'users', label: t('admin.tabUsers'), count: totalUsersCount },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-1.5 ${
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

        {/* ─── TAB 4: USERS DIRECTORY ─── */}
        {activeTab === 'users' && (
          <div className="space-y-4">
            <div className="relative">
              <input
                type="text"
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                placeholder="Search registered users by name..."
                className={`w-full px-4 py-3.5 rounded-2xl text-sm border border-slate-800 bg-slate-900 text-white outline-none focus:border-emerald-500 shadow-sm ${
                  isRTL ? 'pr-11' : 'pl-11'
                }`}
              />
              <Search 
                size={16} 
                className={`absolute top-1/2 -translate-y-1/2 ${isRTL ? 'right-4' : 'left-4'} text-slate-400`} 
              />
            </div>

            <div className="rounded-3xl border border-slate-800 bg-slate-900 shadow-md overflow-hidden">
              <div className="divide-y divide-slate-800">
                {filteredUsers.map((u, i) => (
                  <div key={u.id || i} className="p-4 flex items-center justify-between gap-3 text-sm">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-300 font-extrabold flex items-center justify-center border border-emerald-500/30">
                        {u.name?.[0]?.toUpperCase() || 'U'}
                      </div>
                      <div>
                        <p className="font-bold text-white">{u.name}</p>
                        <p className="text-xs text-slate-400" dir="ltr">
                          Joined: {new Date(u.createdAt || Date.now()).toLocaleDateString(lang === 'ar' ? 'ar-u-nu-latn' : 'fr-FR', {
                            day: 'numeric', month: 'short', year: 'numeric'
                          })}
                        </p>
                      </div>
                    </div>

                    <span className="px-3 py-1 rounded-xl text-xs font-semibold bg-slate-800 text-emerald-400 border border-slate-700">
                      User Account
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
