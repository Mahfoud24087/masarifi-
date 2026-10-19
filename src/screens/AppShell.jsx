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

  return (
    <div className="sticky top-2 z-40 px-4 mb-2 animate-in fade-in slide-in-from-top-2 duration-300">
      <div className={`p-4 rounded-2xl shadow-xl border flex items-start gap-3 backdrop-blur-md transition-all ${
        isOver
          ? (isDark 
              ? 'bg-red-950/95 border-red-500/50 text-red-100 shadow-red-950/50' 
              : 'bg-red-50/95 border-red-300 text-slate-900 shadow-red-100')
          : (isDark 
              ? 'bg-amber-950/95 border-amber-500/50 text-amber-100 shadow-amber-950/50' 
              : 'bg-amber-50/95 border-amber-300 text-slate-900 shadow-amber-100')
      }`}>
        <div className={`w-9 h-9 rounded-xl text-white flex items-center justify-center flex-shrink-0 shadow-md ${
          isOver ? 'bg-red-500 shadow-red-500/20' : 'bg-amber-500 shadow-amber-500/20'
        }`}>
          {isOver ? <AlertCircle size={18} /> : <AlertTriangle size={18} />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-1">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full text-white ${
                isOver ? 'bg-red-600' : 'bg-amber-600'
              }`}>
                {isOver ? '100%+' : `${alert.pct}%`}
              </span>
              <p className={`text-xs font-extrabold ${
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
              <X size={14} />
            </button>
          </div>
          <p className="text-xs font-semibold mt-1 text-slate-800 dark:text-slate-100 leading-relaxed">
            {isOver 
              ? t('budget.warningOverDesc', {
                  category: alert.categoryName,
                  spent: alert.spent.toLocaleString('en-US'),
                  budget: alert.budget.toLocaleString('en-US'),
                  currency: t('common.currency'),
                })
              : t('budget.warningReachedDesc', {
                  category: alert.categoryName,
                  pct: alert.pct,
                  spent: alert.spent.toLocaleString('en-US'),
                  budget: alert.budget.toLocaleString('en-US'),
                  currency: t('common.currency'),
                })
            }
          </p>
          <p className={`text-[11px] mt-1 ${isOver ? 'text-red-600 dark:text-red-300' : 'text-amber-700 dark:text-amber-300'}`}>
            💡 {t('budget.warningAdvice')}
          </p>
          <div className="flex items-center gap-3 mt-2.5">
            <button
              onClick={() => {
                setActiveTab('settings');
                dismissBudgetAlert(alert.catId, alert.threshold);
              }}
              className={`text-xs font-bold underline ${
                isOver ? 'text-red-600 dark:text-red-400' : 'text-amber-700 dark:text-amber-300'
              }`}
            >
              {t('budget.viewBudgets')} →
            </button>
            <button
              onClick={() => dismissBudgetAlert(alert.catId, alert.threshold)}
              className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 px-2 py-0.5 rounded-lg bg-black/5 dark:bg-white/5"
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
      <div className="flex-1 overflow-y-auto pb-24">{renderTab()}</div>
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
