import React, { useEffect, useState } from 'react';
import { RefreshCw, X, Smartphone } from 'lucide-react';

export const PwaBanner: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Check if already installed
    const standalone = window.matchMedia('(display-mode: standalone)').matches || (navigator as any).standalone;
    setIsStandalone(!!standalone);

    if (standalone) {
      return;
    }

    // Show install banner after a short delay so it pops up reliably
    const timer = setTimeout(() => {
      setShowInstallBanner(true);
    }, 1500);

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallBanner(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Register Service Worker & check for updates
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').then((reg) => {
        reg.onupdatefound = () => {
          const installingWorker = reg.installing;
          if (installingWorker) {
            installingWorker.onstatechange = () => {
              if (installingWorker.state === 'installed') {
                if (navigator.serviceWorker.controller) {
                  setUpdateAvailable(true);
                }
              }
            };
          }
        };
      }).catch((err) => {
        console.log('SW registration failed: ', err);
      });
    }

    return () => {
      clearTimeout(timer);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setShowInstallBanner(false);
      }
      setDeferredPrompt(null);
    } else {
      alert('To install OpsTracka on your device:\n\n• On Chrome / Edge / Android: Tap the browser menu (3 dots) and select "Install app" or "Add to Home screen".\n• On Safari (iOS): Tap the Share button at the bottom and select "Add to Home Screen".');
    }
  };

  const handleUpdateClick = () => {
    window.location.reload();
  };

  if (isStandalone || (!showInstallBanner && !updateAvailable)) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:max-w-md z-50 bg-slate-900 border border-slate-800 text-white p-4 rounded-2xl shadow-2xl flex items-center justify-between gap-4 animate-bounce-in">
      {updateAvailable ? (
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shrink-0">
            <RefreshCw className="w-5 h-5 animate-spin" />
          </div>
          <div>
            <h4 className="font-bold text-sm">App Update Available</h4>
            <p className="text-xs text-slate-400">A new version of OpsTracka is ready.</p>
          </div>
        </div>
      ) : (
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shrink-0">
            <Smartphone className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-bold text-sm">Install OpsTracka App</h4>
            <p className="text-xs text-slate-400">Install PWA for fast offline access & daily reports.</p>
          </div>
        </div>
      )}

      <div className="flex items-center space-x-2 shrink-0">
        {updateAvailable ? (
          <button
            onClick={handleUpdateClick}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-4 py-2 rounded-xl text-xs shadow transition-colors"
          >
            Update Now
          </button>
        ) : (
          <button
            onClick={handleInstallClick}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-4 py-2 rounded-xl text-xs shadow transition-colors"
          >
            Install App
          </button>
        )}
        <button
          onClick={() => {
            setShowInstallBanner(false);
            setUpdateAvailable(false);
          }}
          className="text-slate-400 hover:text-white p-1 rounded-lg"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
