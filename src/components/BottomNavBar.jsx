import React from 'react';
import { useMasarifi } from '../context/MasarifiContext';
import { Home, BarChart3, Settings, Plus } from 'lucide-react';

export default function BottomNavBar() {
  const {
    activeTab,
    setActiveTab,
    setShowExpenseForm,
    setEditingExpense,
    t,
    isDark,
    isRTL,
  } = useMasarifi();

  const handleOpenAddForm = () => {
    setEditingExpense(null);
    setShowExpenseForm(true);
  };

  const navButton = (key, Icon, label) => {
    const isActive = activeTab === key;
    return (
      <button
        key={key}
        type="button"
        onClick={() => setActiveTab(key)}
        className={`flex flex-col items-center justify-center py-1 px-3 transition-colors duration-150 ${
          isActive
            ? 'text-emerald-600 dark:text-emerald-400'
            : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
        }`}
      >
        <Icon size={22} strokeWidth={isActive ? 2.5 : 2} />
        <span className={`text-[10px] mt-0.5 leading-tight ${isActive ? 'font-bold' : 'font-medium'}`}>
          {label}
        </span>
        <span
          className={`w-1.5 h-1.5 rounded-full mt-1 transition-all duration-200 ${
            isActive ? 'bg-emerald-500 scale-100' : 'bg-transparent scale-0'
          }`}
        />
      </button>
    );
  };

  return (
    <div
      dir={isRTL ? 'rtl' : 'ltr'}
      className={`fixed bottom-0 inset-x-0 z-40 border-t backdrop-blur-lg transition-colors duration-200 ${
        isDark
          ? 'bg-slate-900/95 border-slate-800 text-slate-200'
          : 'bg-white/95 border-slate-100 text-slate-800 shadow-[0_-4px_20px_rgba(0,0,0,0.03)]'
      }`}
    >
      <div className="flex items-center justify-between w-full max-w-md mx-auto h-16 px-4 relative">
        {/* Start section: Home & Summary */}
        <div className="flex items-center justify-around flex-1">
          {navButton('home', Home, t('nav.home'))}
          {navButton('summary', BarChart3, t('nav.summary'))}
        </div>

        {/* Elevated Center FAB (+) */}
        <div className="flex flex-col items-center justify-center px-2 -translate-y-5">
          <button
            type="button"
            onClick={handleOpenAddForm}
            className="w-13 h-13 sm:w-14 sm:h-14 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white shadow-lg shadow-emerald-500/35 border-4 border-white dark:border-slate-900 flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95"
            aria-label={t('common.add')}
          >
            <Plus size={26} strokeWidth={2.5} />
          </button>
        </div>

        {/* End section: Settings */}
        <div className="flex items-center justify-center flex-1">
          {navButton('settings', Settings, t('nav.settings'))}
        </div>
      </div>
    </div>
  );
}
