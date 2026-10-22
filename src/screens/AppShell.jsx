import React from 'react';
import { useMasarifi } from '../context/MasarifiContext';
import BottomNavBar from '../components/BottomNavBar';
import ExpenseFormSheet from '../components/ExpenseFormSheet';
import ConfirmDialog from '../components/ConfirmDialog';
import ReviewModal from '../components/ReviewModal';
import ContactSupportModal from '../components/ContactSupportModal';
import InstallPrompt from '../components/InstallPrompt';
import DashboardScreen from './DashboardScreen';
import SummaryScreen from './SummaryScreen';
import SettingsScreen from './SettingsScreen';
import { CheckCircle, XCircle, AlertTriangle, AlertCircle, X } from 'lucide-react';

function SupportNotificationBanner() {
  const { userResolvedTickets, dismissTicketNotification, setShowSupportModal, t, isDark } = useMasarifi();
  if (!userResolvedTickets || userResolvedTickets.length === 0) return null;
  const ticket = userResolvedTickets[0];

  return (
    <div className="sticky top-2 z-40 px-4 mb-2">
      <div className={`p-4 rounded-2xl shadow-xl border flex items-start gap-3 backdrop-blur-md transition-all ${
        isDark 
          ? 'bg-slate-800/95 border-emerald-500/40 text-slate-100 shadow-emerald-950/40' 
          : 'bg-emerald-50/95 border-emerald-300 text-slate-900 shadow-emerald-100'
      }`}>
        <div className="w-9 h-9 rounded-xl bg-emerald-500 text-white flex items-center justify-center flex-shrink-0 shadow-md shadow-emerald-500/20">
          <CheckCircle size={18} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-1">
            <p className="text-xs font-extrabold text-emerald-700 dark:text-emerald-300">
              {t('support.notificationTitle')}
            </p>
            <button
              onClick={() => dismissTicketNotification(ticket.id)}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5"
              title={t('support.notificationDismiss')}
            >
              <X size={14} />
            </button>
          </div>
          <p className="text-xs font-semibold mt-0.5 truncate text-slate-800 dark:text-slate-100">
            "{ticket.subject}"
          </p>
          {ticket.adminNotes && (
            <div className="mt-1.5 p-2 rounded-xl text-[11px] bg-white/80 dark:bg-slate-900/80 border border-emerald-500/20 text-slate-700 dark:text-slate-300 leading-relaxed">
              <span className="font-bold text-emerald-600 dark:text-emerald-400">
                💬 {t('support.adminResponse')}:
              </span>{' '}
              {ticket.adminNotes}
            </div>
          )}
          <div className="flex items-center gap-3 mt-2">
            <button
              onClick={() => {
                setShowSupportModal(true);
                dismissTicketNotification(ticket.id);
              }}
              className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline"
            >
              {t('support.viewDetails')} →
            </button>
            <button
              onClick={() => dismissTicketNotification(ticket.id)}
              className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-700 px-2 py-0.5 rounded-lg bg-black/5 dark:bg-white/5"
            >
              {t('support.notificationDismiss')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function BudgetNotificationBanner() {
  const { budgetAlerts, dismissBudgetAlert, setActiveTab, t, isDark } = useMasarifi();
  if (!budgetAlerts || budgetAlerts.length === 0) return null;
  const alert = budgetAlerts[0];
  const isOver = alert.isOver;
  const remaining = Math.max(0, alert.budget - alert.spent);
  const exceeded = Math.max(0, alert.spent - alert.budget);
  const remainingPct = Math.max(0, 100 - alert.pct);

  return (
    <div className="sticky top-2 z-40 px-4 mb-2 animate-in fade-in slide-in-from-top-2 duration-300">
      <div className={`p-4 rounded-2xl shadow-xl border flex items-start gap-3 backdrop-blur-md transition-all ${
        isOver
          ? (isDark 
              ? 'bg-red-950 border-red-500 text-slate-100 shadow-red-950/50' 
              : 'bg-red-50 border-red-300 text-slate-900 shadow-red-100')
          : (isDark 
              ? 'bg-amber-950 border-amber-500 text-slate-100 shadow-amber-950/50' 
              : 'bg-amber-50 border-amber-300 text-slate-900 shadow-amber-100')
      }`}>
        <div className={`w-10 h-10 rounded-2xl text-white flex items-center justify-center flex-shrink-0 shadow-md ${
          isOver ? 'bg-red-500 shadow-red-500/25' : 'bg-amber-500 shadow-amber-500/25'
        }`}>
          {isOver ? <AlertCircle size={20} strokeWidth={2.5} /> : <AlertTriangle size={20} strokeWidth={2.5} />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-1">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full text-white ${
                isOver ? 'bg-red-600' : 'bg-amber-600'
              }`}>
                {isOver ? (t('budget.overLimitPill') || '100%+') : `${alert.pct}%`}
              </span>
              <p className={`text-xs font-black ${
                isOver ? 'text-red-700 dark:text-red-300' : 'text-amber-800 dark:text-amber-300'
              }`}>
                {isOver ? t('budget.warningOverTitle') : t('budget.warningTitle')}
              </p>
            </div>
            <button
              onClick={() => dismissBudgetAlert(alert.catId, alert.threshold)}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5 transition-colors"
              title={t('budget.dismissAlert')}
            >
              <X size={15} />
            </button>
          </div>

          {/* Structured Financial Breakdown Box */}
          <div className={`mt-2 p-2.5 rounded-xl border text-xs font-bold ${
            isOver
              ? (isDark ? 'bg-red-900/40 border-red-800 text-red-100' : 'bg-red-100 border-red-200 text-red-950')
              : (isDark ? 'bg-amber-900/40 border-amber-800 text-amber-100' : 'bg-amber-100 border-amber-200 text-amber-950')
          }`}>
            <div className="flex items-center justify-between">
              <span className="font-extrabold">{alert.categoryName}:</span>
              <span dir="ltr">
                {alert.spent.toLocaleString('en-US')} / {alert.budget.toLocaleString('en-US')} {t('common.currency')}
              </span>
            </div>
            <div className="flex items-center justify-between mt-1 pt-1 border-t border-inherit text-[11px]">
              <span className="font-semibold">
                {isOver ? (t('budget.amountExceeded') || 'Over Limit') : (t('budget.amountRemaining') || 'Remaining')}:
              </span>
              <span className="font-black text-xs" dir="ltr">
                {isOver 
                  ? `+${exceeded.toLocaleString('en-US')} ${t('common.currency')}`
                  : `${remaining.toLocaleString('en-US')} ${t('common.currency')} (${remainingPct}%)`
                }
              </span>
            </div>
          </div>

          {/* Clear Explanation */}
          <p className={`text-xs mt-2 font-medium leading-relaxed ${
            isOver ? 'text-red-900 dark:text-red-200' : 'text-amber-950 dark:text-amber-100'
          }`}>
            {isOver 
              ? t('budget.warningOverDesc', {
                  category: alert.categoryName,
                  exceeded: exceeded.toLocaleString('en-US'),
                  currency: t('common.currency'),
                })
              : t('budget.warningReachedDesc', {
                  category: alert.categoryName,
                  pct: alert.pct,
                  remaining: remaining.toLocaleString('en-US'),
                  remainingPct,
                  currency: t('common.currency'),
                })
            }
          </p>

          <p className={`text-[11px] mt-1 font-semibold ${
            isOver ? 'text-red-700 dark:text-red-300' : 'text-amber-800 dark:text-amber-300'
          }`}>
            💡 {t('budget.warningAdvice')}
          </p>

          <div className="flex items-center gap-3 mt-2.5">
            <button
              onClick={() => {
                setActiveTab('settings');
                dismissBudgetAlert(alert.catId, alert.threshold);
              }}
              className={`text-xs font-bold underline ${
                isOver ? 'text-red-700 dark:text-red-300' : 'text-amber-800 dark:text-amber-300'
              }`}
            >
              {t('budget.viewBudgets')} →
            </button>
            <button
              onClick={() => dismissBudgetAlert(alert.catId, alert.threshold)}
              className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-800 dark:hover:text-white px-2.5 py-1 rounded-lg bg-black/5 dark:bg-white/10"
            >
              {t('budget.dismissAlert')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Toast() {
  const { toast } = useMasarifi();
  if (!toast) return null;
  const isSuccess = toast.type === 'success';
  const isWarning = toast.type === 'warning';
  const bg = isSuccess
    ? 'linear-gradient(135deg,#059669,#10B981)'
    : isWarning
      ? 'linear-gradient(135deg,#D97706,#F59E0B)'
      : 'linear-gradient(135deg,#DC2626,#EF4444)';
  const Icon = isSuccess ? CheckCircle : isWarning ? AlertTriangle : AlertCircle;

  return (
    <>
      <div
        className="fixed top-5 left-1/2 z-[9999] flex items-center gap-2 px-5 py-3 rounded-2xl shadow-xl text-white text-sm font-semibold"
        style={{
          transform: 'translateX(-50%)',
          background: bg,
          animation: 'toastIn 0.3s ease-out',
          minWidth: '160px',
          maxWidth: '90vw',
          justifyContent: 'center',
          textAlign: 'center',
        }}
      >
        <Icon size={18} className="flex-shrink-0" />
        <span>{toast.message}</span>
      </div>
      <style>{`@keyframes toastIn{from{opacity:0;transform:translateX(-50%) translateY(-20px)}to{opacity:1;transform:translateX(-50%) translateY(0)}}`}</style>
    </>
  );
}

export default function AppShell() {
  const { activeTab, isDark, isRTL } = useMasarifi();

  const renderTab = () => {
    switch (activeTab) {
      case 'home':     return <DashboardScreen />;
      case 'summary':  return <SummaryScreen />;
      case 'settings': return <SettingsScreen />;
      default:         return <DashboardScreen />;
    }
  };

  return (
    <div className={`flex flex-col min-h-screen ${isDark ? 'bg-slate-900' : 'bg-slate-50'}`} dir={isRTL ? 'rtl' : 'ltr'}>
      <SupportNotificationBanner />
      <BudgetNotificationBanner />
      <div 
        className="flex-1 overflow-y-auto"
        style={{ paddingBottom: 'calc(5.5rem + env(safe-area-inset-bottom, 0px))' }}
      >
        {renderTab()}
      </div>
      <BottomNavBar />
      <ExpenseFormSheet />
      <ConfirmDialog />
      <ReviewModal />
      <ContactSupportModal />
      <InstallPrompt />
      <Toast />
    </div>
  );
}
