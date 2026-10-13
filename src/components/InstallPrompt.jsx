import React, { useState, useEffect } from 'react';
import { Download, X } from 'lucide-react';
import { useMasarifi } from '../context/MasarifiContext';

export default function InstallPrompt() {
  const { isDark, isRTL, lang } = useMasarifi();
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    const handleBeforeInstall = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      // Only show if not previously dismissed in this session
      if (!sessionStorage.getItem('masarifi_install_dismissed')) {
        setShowPrompt(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setShowPrompt(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    sessionStorage.setItem('masarifi_install_dismissed', 'true');
  };

  if (!showPrompt) return null;

  const text = {
    ar: { title: 'ثبّت مصاريفي على هاتفك', desc: 'استخدم التطبيق كبرنامج أصلي بدون إنترنت وبسرعة فائقة', install: 'تثبيت الآن' },
    fr: { title: "Installer Masarifi", desc: "Utilisez l'application comme une vraie appli mobile rapide", install: 'Installer' },
    en: { title: 'Install Masarifi App', desc: 'Use as a standalone app on your phone with instant access', install: 'Install Now' },
  }[lang] || { title: 'ثبّت مصاريفي على هاتفك', desc: 'استخدم التطبيق كبرنامج أصلي', install: 'تثبيت الآن' };

  return (
    <div
      className="fixed bottom-20 left-4 right-4 z-50 max-w-md mx-auto"
      dir={isRTL ? 'rtl' : 'ltr'}
      style={{ animation: 'slideUp 0.3s ease-out' }}
    >
      <div
        className={`p-4 rounded-3xl shadow-2xl border flex items-center gap-3.5 backdrop-blur-md ${
          isDark
            ? 'bg-slate-900/95 border-emerald-500/30 text-white'
            : 'bg-white/95 border-emerald-200 text-slate-800'
        }`}
      >
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center flex-shrink-0 shadow-md">
          <Download size={22} className="text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-extrabold text-sm leading-tight">{text.title}</p>
          <p className={`text-xs mt-0.5 leading-snug line-clamp-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            {text.desc}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleInstall}
            className="px-3.5 py-2 rounded-xl text-xs font-bold text-white shadow-sm transition-all active:scale-95"
            style={{ background: 'linear-gradient(135deg, #059669, #10B981)' }}
          >
            {text.install}
          </button>
          <button
            onClick={handleDismiss}
            className={`p-1.5 rounded-full ${isDark ? 'text-slate-400 hover:text-white' : 'text-slate-400 hover:text-slate-700'}`}
          >
            <X size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
