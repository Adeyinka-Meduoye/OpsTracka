import React, { useEffect, useState } from 'react';
import { RefreshCw, X, Smartphone } from 'lucide-react';

// Global listener for beforeinstallprompt so we never miss it before React mounts
if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e: Event) => {
    e.preventDefault();
    (window as any).__deferredPrompt = e;
  });
}

export const PwaBanner: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(
    typeof window !== 'undefined' ? (window as any).__deferredPrompt : null
  );
  const [showInstallBanner, setShowInstallBanner] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return sessionStorage.getItem('pwa_install_dismissed') !== 'true';
  });
  const [updateAvailable, setUpdateAvailable] = useState<boolean>(false);
  const [isStandalone, setIsStandalone] = useState<boolean>(false);

  useEffect(() => {
    // Check if already installed in standalone mode
    const standalone = window.matchMedia('(display-mode: standalone)').matches || (navigator as any).standalone;
    setIsStandalone(!!standalone);

    // Show install banner if not standalone and not dismissed this session
    if (!standalone && sessionStorage.getItem('pwa_install_dismissed') !== 'true') {
      const timer = setTimeout(() => {
        setShowInstallBanner(true);
      }, 800);
      return () => clearTimeout(timer);
    }
  }, []);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      (window as any).__deferredPrompt = e;
      if (!isStandalone && sessionStorage.getItem('pwa_install_dismissed') !== 'true') {
        setShowInstallBanner(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    if ((window as any).__deferredPrompt) {
      setDeferredPrompt((window as any).__deferredPrompt);
    }

    // Register Service Worker & robust update checks for installed PWA devices
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').then((reg) => {
        reg.update().catch(() => {});

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

        // Periodically check for updates every 10 minutes
        const updateInterval = setInterval(() => {
          reg.update().catch(() => {});
        }, 10 * 60 * 1000);

        return () => clearInterval(updateInterval);
      }).catch((err) => {
        console.log('SW registration failed: ', err);
      });

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
          sessionStorage.setItem('pwa_install_dismissed', 'true');
        }
        setDeferredPrompt(null);
        (window as any).__deferredPrompt = null;
      } catch (err) {
        console.log('Install prompt error:', err);
      }
    } else {
      // Check if iOS / Safari where beforeinstallprompt is not supported
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
      if (isIOS) {
        alert("To install OpsTracka on iOS Safari:\n\n1. Tap the Share button at the bottom of your screen.\n2. Scroll down and select 'Add to Home Screen'.");
      } else {
        alert("To install OpsTracka on your browser:\n\nClick the install icon in your address bar or browser menu (⋮ / •••) and select 'Install OpsTracka'.");
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

  const handleDismissInstall = () => {
    setShowInstallBanner(false);
    sessionStorage.setItem('pwa_install_dismissed', 'true');
  };

  // If update is available, ALWAYS show banner regardless of standalone status or session dismissal.
  // If already installed and no update, return null.
  if (isStandalone && !updateAvailable) return null;
  if (!updateAvailable && (!showInstallBanner || sessionStorage.getItem('pwa_install_dismissed') === 'true')) return null;

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
            Update App
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
            onClick={handleDismissInstall}
            className="text-slate-400 hover:text-white p-1 rounded-lg"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};
