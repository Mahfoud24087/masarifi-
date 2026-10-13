import React from 'react';
import { useMasarifi } from '../context/MasarifiContext';
import BottomNavBar from '../components/BottomNavBar';
import ExpenseFormSheet from '../components/ExpenseFormSheet';
import ConfirmDialog from '../components/ConfirmDialog';
import ReviewModal from '../components/ReviewModal';
import DashboardScreen from './DashboardScreen';
import SummaryScreen from './SummaryScreen';
import SettingsScreen from './SettingsScreen';
import { CheckCircle, XCircle } from 'lucide-react';

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
      <div className="flex-1 overflow-y-auto pb-24">{renderTab()}</div>
      <BottomNavBar />
      <ExpenseFormSheet />
      <ConfirmDialog />
      <ReviewModal />
      <Toast />
    </div>
  );
}
