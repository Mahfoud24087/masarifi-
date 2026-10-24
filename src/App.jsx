import React from 'react';
import { MasarifiProvider, useMasarifi } from './context/MasarifiContext';
import LandingScreen from './screens/LandingScreen';
import AuthScreen from './screens/AuthScreen';
import AppShell from './screens/AppShell';
import AdminScreen from './screens/AdminScreen';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(error, errorInfo) {
    console.error('Masarifi UI error caught:', error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6 text-center" dir="rtl">
          <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mb-4 text-xl font-bold">
            مصاريفي
          </div>
          <h2 className="text-base font-bold mb-2">حدث خطأ غير متوقع أثناء العرض</h2>
          <p className="text-xs text-slate-400 max-w-xs mb-5">
            يرجى النقر على الزر أدناه لتحديث الصفحة واستعادة العمل فوراً.
          </p>
          <button
            onClick={() => {
              this.setState({ hasError: false });
              window.location.reload();
            }}
            className="px-6 py-2.5 rounded-xl font-bold text-xs bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/20 active:scale-95 transition-all"
          >
            إعادة تحميل التطبيق
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

function MasarifiRouter() {
  const { screen } = useMasarifi();

  if (screen === 'admin')                          return <AdminScreen />;
  if (screen === 'app')                            return <AppShell />;
  if (screen === 'auth-signup' || screen === 'auth-signin') return <AuthScreen />;
  return <LandingScreen />;
}

export default function App() {
  return (
    <ErrorBoundary>
      <MasarifiProvider>
        <MasarifiRouter />
      </MasarifiProvider>
    </ErrorBoundary>
  );
}
