import React, { useState, useEffect } from 'react';
import { Download, X, Share, PlusSquare } from 'lucide-react';
import { useMasarifi } from '../context/MasarifiContext';

export default function InstallPrompt() {
  const { isDark, isRTL, lang } = useMasarifi();
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSModal, setShowIOSModal] = useState(false);

  useEffect(() => {
    // Detect iOS / Apple devices (iPhone, iPad, iPod)
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isAppleDevice = /iphone|ipad|ipod/.test(userAgent);
    const isStandalone = window.navigator.standalone === true || window.matchMedia('(display-mode: standalone)').matches;

    if (isAppleDevice && !isStandalone) {
      setIsIOS(true);
      if (!sessionStorage.getItem('masarifi_install_dismissed')) {
        setShowPrompt(true);
      }
    }

    const handleBeforeInstall = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      // Android: ALWAYS show the install banner — no sessionStorage suppression
      setShowPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
  }, []);

  const handleInstallClick = async () => {
    if (isIOS) {
      setShowIOSModal(true);
      return;
    }
    if (!deferredPrompt) return;
    deferredPrompt.prompt(); // Direct 1-click native install — no instructions for Android
    const { outcome } = await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    setShowPrompt(false); // Hide after user responds (accepted or declined)
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    if (isIOS) {
      // Only suppress iOS prompt per session (user sees instructions, fair to not repeat)
      sessionStorage.setItem('masarifi_install_dismissed', 'true');
    }
    // Android: do NOT write to sessionStorage → banner reappears every visit
  };

  const text = {
    ar: { 
      title: 'ثبّت مصاريفي على هاتفك', 
      desc: 'تطبيق أصلي سريع يعمل بدون إنترنت على جميع الأجهزة', 
      install: 'تثبيت الآن',
      iosTitle: 'تثبيت مصاريفي على آيفون (iOS)',
      iosStep1: 'عند فتح الموقع، ابحث عن زر المشاركة (Share 📤) واضغط عليه.',
      iosStep2: 'ستظهر لك خيارات، اضغط على «إضافة إلى الشاشة الرئيسية» (Add to Home Screen ➕).',
      iosStep3: 'اضغط على حفظ/إضافة وسيتم تحميل التطبيق وتثبيته مباشرة على شاشتك!',
      gotIt: 'حسناً، فهمت'
    },
    fr: { 
      title: "Installer Masarifi", 
      desc: "Appli mobile rapide et fluide sur tous vos appareils", 
      install: 'Installer',
      iosTitle: 'Installer sur iPhone (iOS)',
      iosStep1: "Quand vous ouvrez le site, appuyez sur l'option Partager (Share 📤).",
      iosStep2: "Touchez ensuite l'option « Sur l'écran d'accueil » (Add to Home Screen ➕).",
      iosStep3: "Appuyez sur Enregistrer/Ajouter et l'application sera téléchargée sur votre écran !",
      gotIt: 'Compris'
    },
    en: { 
      title: 'Install Masarifi App', 
      desc: 'Fast, standalone app experience on Android and iPhone', 
      install: 'Install Now',
      iosTitle: 'Install on iPhone (iOS)',
      iosStep1: 'When you open the site, find the Share option (📤) and click on it.',
      iosStep2: 'Click on "Add to Home Screen" option (➕).',
      iosStep3: 'Click Save/Add and it will be downloaded and added to your home screen!',
      gotIt: 'Got It'
    },
  }[lang] || { 
    title: 'ثبّت مصاريفي على هاتفك', 
    desc: 'تطبيق أصلي سريع يعمل بدون إنترنت', 
    install: 'تثبيت الآن',
    iosTitle: 'تثبيت مصاريفي على آيفون',
    iosStep1: 'عند فتح الموقع، اضغط على خيار المشاركة (📤).',
    iosStep2: 'اضغط على خيار «إضافة إلى الشاشة الرئيسية» (➕).',
    iosStep3: 'اضغط على حفظ وسيتم تحميل وتثبيت التطبيق على هاتفك.',
    gotIt: 'حسناً'
  };

  return (
    <>
      {showPrompt && (
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
                onClick={handleInstallClick}
                className="px-3.5 py-2 rounded-xl text-xs font-bold text-white shadow-sm transition-all active:scale-95 flex items-center gap-1.5"
                style={{ background: 'linear-gradient(135deg, #059669, #10B981)' }}
              >
                <Download size={14} />
                <span>{text.install}</span>
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
      )}

      {/* iOS Safari Installation Guide Modal */}
      {showIOSModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
          dir={isRTL ? 'rtl' : 'ltr'}
          onClick={() => setShowIOSModal(false)}
        >
          <div
            className={`w-full max-w-sm rounded-3xl p-6 border shadow-2xl ${
              isDark ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-100 text-slate-900'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-14 h-14 rounded-2xl mx-auto mb-3 flex items-center justify-center bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg">
              <Download size={26} />
            </div>

            <h3 className="font-extrabold text-base text-center mb-1">
              {text.iosTitle}
            </h3>
            <p className="text-xs text-center text-slate-400 mb-5">
              Apple iOS Safari
            </p>

            <div className="space-y-3.5 text-xs font-semibold mb-6">
              <div className="flex items-start gap-3 p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/40">
                <div className="w-7 h-7 rounded-xl bg-emerald-500 text-white flex items-center justify-center flex-shrink-0">
                  <Share size={15} />
                </div>
                <p className="flex-1 text-slate-800 dark:text-slate-200 leading-relaxed">
                  {text.iosStep1}
                </p>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/40">
                <div className="w-7 h-7 rounded-xl bg-blue-500 text-white flex items-center justify-center flex-shrink-0">
                  <PlusSquare size={15} />
                </div>
                <p className="flex-1 text-slate-800 dark:text-slate-200 leading-relaxed">
                  {text.iosStep2}
                </p>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-2xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800/40">
                <div className="w-7 h-7 rounded-xl bg-purple-500 text-white flex items-center justify-center flex-shrink-0">
                  ✓
                </div>
                <p className="flex-1 text-slate-800 dark:text-slate-200 leading-relaxed">
                  {text.iosStep3}
                </p>
              </div>
            </div>

            <button
              onClick={() => {
                setShowIOSModal(false);
                handleDismiss();
              }}
              className="w-full py-3.5 rounded-2xl font-bold text-xs text-white shadow-lg transition-all active:scale-95"
              style={{ background: 'linear-gradient(135deg, #059669, #10B981)' }}
            >
              {text.gotIt}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
