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
import { CheckCircle, XCircle, X } from 'lucide-react';

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

function Toast() {
  const { toast } = useMasarifi();
  if (!toast) return null;
  const isSuccess = toast.type === 'success';
  return (
    <>
      <div
        className="fixed top-5 left-1/2 z-[9999] flex items-center gap-2 px-5 py-3 rounded-2xl shadow-xl text-white text-sm font-semibold"
        style={{
          transform: 'translateX(-50%)',
          background: isSuccess ? 'linear-gradient(135deg,#059669,#10B981)' : '#EF4444',
          animation: 'toastIn 0.3s ease-out',
          minWidth: '160px',
          justifyContent: 'center',
        }}
      >
        {isSuccess ? <CheckCircle size={18} /> : <XCircle size={18} />}
        {toast.message}
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
