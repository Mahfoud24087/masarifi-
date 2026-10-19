import React, { useState } from 'react';
import { 
  X, MessageSquare, Bug, Lightbulb, UserCheck, HelpCircle, 
  Send, CheckCircle2, Phone, AlertCircle, Clock, CheckCircle,
  Inbox, Sparkles
} from 'lucide-react';
import { useMasarifi } from '../context/MasarifiContext';

const CATEGORIES = [
  { id: 'bug', icon: Bug, color: 'text-red-500', bg: 'bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-800' },
  { id: 'suggestion', icon: Lightbulb, color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800' },
  { id: 'account', icon: UserCheck, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800' },
  { id: 'general', icon: HelpCircle, color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800' },
];

export default function ContactSupportModal() {
  const { 
    showSupportModal, setShowSupportModal, 
    addTicket, showToast, t, isDark, isRTL, user, lang,
    userTickets, userResolvedTickets, dismissTicketNotification
  } = useMasarifi();

  const [activeTab, setActiveTab] = useState(() => (userResolvedTickets?.length > 0 ? 'history' : 'new'));
  const [category, setCategory] = useState('bug');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [contact, setContact] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!showSupportModal) return null;

  const handleClose = () => {
    setShowSupportModal(false);
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!subject.trim() || !message.trim()) {
      setError(t('support.requiredFields'));
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await addTicket({
        category,
        subject: subject.trim(),
        message: message.trim(),
        contact: contact.trim(),
      });

      if (res && res.success) {
        showToast('✉️ ' + t('support.successToast'));
        setSubject('');
        setMessage('');
        setContact('');
        setActiveTab('history');
      }
    } catch (err) {
      setError('Error submitting ticket. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const inputClass = `w-full px-4 py-3 rounded-2xl text-sm border outline-none transition-all ${
    isDark 
      ? 'bg-slate-800 border-slate-700 text-slate-100 placeholder-slate-500 focus:border-emerald-500' 
      : 'bg-slate-50 border-slate-200 text-slate-800 placeholder-slate-400 focus:border-emerald-400 focus:bg-white'
  }`;

  const getCatIcon = (catId) => {
    switch (catId) {
      case 'bug': return <Bug size={14} className="text-red-500" />;
      case 'suggestion': return <Lightbulb size={14} className="text-amber-500" />;
      case 'account': return <UserCheck size={14} className="text-blue-500" />;
      default: return <HelpCircle size={14} className="text-emerald-500" />;
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4"
      dir={isRTL ? 'rtl' : 'ltr'}
      onClick={handleClose}
    >
      <div
        className={`relative w-full max-w-lg rounded-t-3xl sm:rounded-3xl p-5 sm:p-6 shadow-2xl border max-h-[90vh] overflow-y-auto transition-all ${
          isDark 
            ? 'bg-slate-900 border-slate-800 text-slate-100' 
            : 'bg-white border-slate-200 text-slate-900'
        }`}
        style={{ animation: 'slideUp 0.25s ease-out' }}
        onClick={(e) => e.stopPropagation()}
      >
        <style>{`@keyframes slideUp{from{transform:translateY(20px);opacity:0}to{transform:translateY(0);opacity:1}}`}</style>

        {/* Mobile handle indicator */}
        <div className="sm:hidden w-12 h-1 rounded-full bg-slate-300 dark:bg-slate-700 mx-auto mb-4" />

        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div 
              className="w-11 h-11 rounded-2xl flex items-center justify-center text-white shadow-md shadow-emerald-500/20"
              style={{ background: 'linear-gradient(135deg, #059669, #10B981)' }}
            >
              <MessageSquare size={22} />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-extrabold tracking-tight">
                {t('support.title')}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {t('support.subtitle')}
              </p>
            </div>
          </div>

          <button
            onClick={handleClose}
            className={`p-2 rounded-xl transition-colors ${
              isDark ? 'hover:bg-slate-800 text-slate-400 hover:text-white' : 'hover:bg-slate-100 text-slate-500'
            }`}
          >
            <X size={19} />
          </button>
        </div>

        {/* Tab navigation: New Request vs My History */}
        <div className={`flex rounded-2xl p-1 mb-5 border ${
          isDark ? 'bg-slate-800/80 border-slate-700' : 'bg-slate-100 border-slate-200'
        }`}>
          <button
            type="button"
            onClick={() => setActiveTab('new')}
            className={`flex-1 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'new'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'
            }`}
          >
            <span>{t('support.tabNew')}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('history')}
            className={`flex-1 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-1.5 relative ${
              activeTab === 'history'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'
            }`}
          >
            <span>{t('support.tabHistory')}</span>
            {userTickets?.length > 0 && (
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-extrabold ${
                activeTab === 'history' 
                  ? 'bg-white text-emerald-700' 
                  : 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300'
              }`}>
                {userTickets.length}
              </span>
            )}
            {userResolvedTickets?.length > 0 && (
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping absolute top-2 right-2" />
            )}
          </button>
        </div>

        {/* ─── TAB 1: NEW TICKET FORM ─── */}
        {activeTab === 'new' && (
          <div>
            {error && (
              <div className="mb-4 p-3 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/60 text-red-600 dark:text-red-400 text-xs flex items-center gap-2">
                <AlertCircle size={15} className="flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Category Chips */}
              <div>
                <label className="block text-xs font-semibold mb-2 text-slate-600 dark:text-slate-300">
                  {t('support.category')}
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {CATEGORIES.map((cat) => {
                    const Icon = cat.icon;
                    const isSelected = category === cat.id;
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setCategory(cat.id)}
                        className={`flex items-center gap-2 p-2.5 rounded-2xl border text-xs font-bold transition-all text-start ${
                          isSelected
                            ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 shadow-sm'
                            : isDark
                            ? 'border-slate-800 bg-slate-800/60 text-slate-400 hover:bg-slate-800'
                            : 'border-slate-200 bg-slate-50/80 text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        <Icon size={16} className={isSelected ? 'text-emerald-500' : cat.color} />
                        <span className="truncate">{t(`support.${cat.id}`)}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Subject */}
              <div>
                <label className="block text-xs font-semibold mb-1.5 text-slate-600 dark:text-slate-300">
                  {t('support.subject')}
                </label>
                <input
                  type="text"
                  required
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder={t('support.subjectPlaceholder')}
                  className={inputClass}
                />
              </div>

              {/* Message */}
              <div>
                <label className="block text-xs font-semibold mb-1.5 text-slate-600 dark:text-slate-300">
                  {t('support.message')}
                </label>
                <textarea
                  required
                  rows={4}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder={t('support.messagePlaceholder')}
                  className={`${inputClass} resize-none`}
                />
              </div>

              {/* Optional Contact info */}
              <div>
                <label className="block text-xs font-semibold mb-1.5 text-slate-600 dark:text-slate-300">
                  {t('support.contact')}
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={contact}
                    onChange={(e) => setContact(e.target.value)}
                    placeholder={t('support.contactPlaceholder')}
                    className={`${inputClass} ${isRTL ? 'pl-9' : 'pr-9'}`}
                  />
                  <Phone 
                    size={16} 
                    className={`absolute top-1/2 -translate-y-1/2 ${isRTL ? 'left-3' : 'right-3'} text-slate-400 pointer-events-none`} 
                  />
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  {user ? `👤 ${user.name}` : ''}
                </p>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-2xl font-bold text-white text-sm transition-all active:scale-95 disabled:opacity-60 shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2"
                style={{ background: 'linear-gradient(135deg, #059669, #10B981)' }}
              >
                {loading ? (
                  <span>{t('support.sending')}</span>
                ) : (
                  <>
                    <Send size={16} className={isRTL ? 'rotate-180' : ''} />
                    <span>{t('support.submit')}</span>
                  </>
                )}
              </button>
            </form>
          </div>
        )}

        {/* ─── TAB 2: MY TICKETS & ADMIN RESOLUTIONS ─── */}
        {activeTab === 'history' && (
          <div className="space-y-3">
            {(!userTickets || userTickets.length === 0) ? (
              <div className="p-8 text-center rounded-2xl border border-dashed border-slate-300 dark:border-slate-800">
                <Inbox size={34} className="mx-auto mb-2 text-slate-400" />
                <p className="text-xs font-bold text-slate-500 dark:text-slate-400">
                  {t('support.noHistory')}
                </p>
                <button
                  onClick={() => setActiveTab('new')}
                  className="mt-3 text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline"
                >
                  + {t('support.tabNew')}
                </button>
              </div>
            ) : (
              userTickets.map((tkt) => {
                const isResolved = tkt.status === 'resolved';
                const isInProgress = tkt.status === 'in_progress';
                const isNew = tkt.status === 'new';

                return (
                  <div
                    key={tkt.id}
                    className={`p-4 rounded-2xl border transition-all ${
                      isResolved
                        ? 'border-emerald-500/40 bg-emerald-500/5 dark:bg-emerald-950/20'
                        : isDark
                        ? 'bg-slate-800/60 border-slate-800'
                        : 'bg-white border-slate-200 shadow-sm'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="p-1 rounded-lg bg-slate-100 dark:bg-slate-800">
                          {getCatIcon(tkt.category)}
                        </span>
                        <h4 className="font-bold text-xs sm:text-sm">
                          {tkt.subject}
                        </h4>
                      </div>

                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1 ${
                        isResolved
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                          : isInProgress
                          ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                          : 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                      }`}>
                        {isResolved ? (
                          <>
                            <CheckCircle2 size={11} />
                            <span>{t('admin.filterResolved')}</span>
                          </>
                        ) : isInProgress ? (
                          <>
                            <Clock size={11} />
                            <span>{t('admin.filterInProgress')}</span>
                          </>
                        ) : (
                          <span>{t('admin.filterNew')}</span>
                        )}
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 dark:text-slate-300 mb-3 whitespace-pre-line leading-relaxed">
                      {tkt.message}
                    </p>

                    {/* Admin Response & Solution Highlight */}
                    {tkt.adminNotes ? (
                      <div className="p-3 rounded-xl bg-emerald-100/70 dark:bg-emerald-950/50 border border-emerald-300 dark:border-emerald-800/60 text-xs">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-extrabold text-emerald-800 dark:text-emerald-300 flex items-center gap-1">
                            <Sparkles size={13} className="text-emerald-500" />
                            {t('support.adminResponse')}
                          </span>
                          {isResolved && (
                            <button
                              onClick={() => {
                                dismissTicketNotification(tkt.id);
                                showToast('✓ ' + t('support.notificationDismiss'));
                              }}
                              className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 hover:underline px-2 py-0.5 rounded bg-white/60 dark:bg-black/30"
                            >
                              {t('support.notificationDismiss')}
                            </button>
                          )}
                        </div>
                        <p className="text-slate-800 dark:text-slate-200 leading-relaxed font-medium">
                          {tkt.adminNotes}
                        </p>
                      </div>
                    ) : (
                      <p className="text-[11px] text-slate-400 italic">
                        {t('support.pendingAdmin')}...
                      </p>
                    )}

                    <div className="mt-2 text-[10px] text-slate-400 text-end">
                      {new Date(tkt.createdAt).toLocaleDateString(lang === 'ar' ? 'ar-u-nu-latn' : 'fr-FR', {
                        day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
                      })}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>
    </div>
  );
}
