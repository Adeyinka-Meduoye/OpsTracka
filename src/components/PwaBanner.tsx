import React, { useEffect, useState } from 'react';
import { RefreshCw, X, Smartphone } from 'lucide-react';

export const PwaBanner: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(
    typeof window !== 'undefined' ? (window as any).__deferredPrompt : null
  );
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
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      (window as any).__deferredPrompt = e;
      if (!isStandalone) {
        setShowInstallBanner(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Check for global captured prompt if already fired
    if ((window as any).__deferredPrompt) {
      setDeferredPrompt((window as any).__deferredPrompt);
    }

    // Register Service Worker & robust update checks for installed PWA devices
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').then((reg) => {
        // Check for updates immediately
        reg.update().catch(() => {});

        // Check waiting worker on startup
        if (reg.waiting) {
          setUpdateAvailable(true);
        }

        reg.onupdatefound = () => {
          const installingWorker = reg.installing;
          if (installingWorker) {
            installingWorker.onstatechange = () => {
              if (installingWorker.state === 'installed' && navigator.serviceWorker.controller) {
                setUpdateAvailable(true);
              }
            };
          }
        };

        // Periodically check for updates every 15 minutes
        const updateInterval = setInterval(() => {
          reg.update().catch(() => {});
        }, 15 * 60 * 1000);

        return () => clearInterval(updateInterval);
      }).catch((err) => {
        console.log('SW registration failed: ', err);
      });

      // Also check for updates when app window comes back into focus
      const handleVisibilityChange = () => {
        if (document.visibilityState === 'visible' && 'serviceWorker' in navigator) {
          navigator.serviceWorker.getRegistration().then((reg) => {
            if (reg) {
              reg.update().catch(() => {});
              if (reg.waiting) {
                setUpdateAvailable(true);
              }
            }
          });
        }
      };

      document.addEventListener('visibilitychange', handleVisibilityChange);

      let refreshing = false;
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (!refreshing) {
          refreshing = true;
          window.location.reload();
        }
      });

      return () => {
        document.removeEventListener('visibilitychange', handleVisibilityChange);
      };
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, [isStandalone]);

  const handleInstallClick = async () => {
    const promptEvent = deferredPrompt || (window as any).__deferredPrompt;
    if (promptEvent) {
      try {
        promptEvent.prompt();
        const { outcome } = await promptEvent.userChoice;
        if (outcome === 'accepted') {
          setShowInstallBanner(false);
        }
        setDeferredPrompt(null);
        (window as any).__deferredPrompt = null;
      } catch (err) {
        console.log('Install prompt error:', err);
      }
    } else {
      // If prompt event not yet fired by browser, trigger browser installation prompt directly if possible or notify
      if ('serviceWorker' in navigator && (navigator as any).getInstalledRelatedApps) {
        try {
          const apps = await (navigator as any).getInstalledRelatedApps();
          if (apps.length > 0) {
            setShowInstallBanner(false);
            return;
          }
        } catch (e) {}
      }
      // Re-trigger service worker update check or dispatch custom event to encourage prompt
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.getRegistration().then((reg) => {
          if (reg) reg.update();
        });
      }
      // Notify user smoothly to use browser menu if deferredPrompt is not yet ready
      console.log('Install prompt is preparing. Please click again in a moment.');
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




