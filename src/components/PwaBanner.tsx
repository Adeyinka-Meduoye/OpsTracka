import React, { useEffect, useState } from 'react';
import { RefreshCw, X, Smartphone, Monitor, CheckCircle2 } from 'lucide-react';

export const PwaBanner: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Check if already installed in standalone mode
    const standalone = window.matchMedia('(display-mode: standalone)').matches || (navigator as any).standalone;
    setIsStandalone(!!standalone);

    // Show install banner after a short delay only if not standalone
    if (!standalone) {
      const timer = setTimeout(() => {
        setShowInstallBanner(true);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      if (!isStandalone) {
        setShowInstallBanner(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // ALWAYS register Service Worker & check for updates (even if standalone, so installed PWAs receive update prompts!)
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').then((reg) => {
        // Check for updates on load & periodic updates
        reg.update();

        // Check if there is already a waiting worker (an update ready to install)
        if (reg.waiting) {
          setUpdateAvailable(true);
        }

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

      // Listen for controller change (automatic reload when user clicks update)
      let refreshing = false;
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (!refreshing) {
          refreshing = true;
          window.location.reload();
        }
      });
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, [isStandalone]);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      try {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
          setShowInstallBanner(false);
        }
        setDeferredPrompt(null);
      } catch (err) {
        console.log('Install prompt error:', err);
      }
    } else {
      // If deferredPrompt is not yet captured by browser event, try to trigger native prompt or dispatch event
      if ((window as any).BeforeInstallPromptEvent) {
        console.log('Waiting for install prompt event...');
      } else {
        // Try to trigger browser installation if available
        console.log('Install prompt not yet ready.');
      }
    }
  };

  const handleUpdateClick = () => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistration().then((reg) => {
        if (reg && reg.waiting) {
          reg.waiting.postMessage({ type: 'SKIP_WAITING' });
        }
        window.location.reload();
      });
    } else {
      window.location.reload();
    }
  };

  // If update is available, ALWAYS show banner (even on standalone devices). If standalone and no update, return null.
  if (isStandalone && !updateAvailable) return null;
  if (!updateAvailable && !showInstallBanner) return null;

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
        {!updateAvailable && (
          <button
            onClick={() => setShowInstallBanner(false)}
            className="text-slate-400 hover:text-white p-1 rounded-lg"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};

