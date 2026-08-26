import React, { useEffect, useState, useCallback, useRef } from 'react';
import { RefreshCw, X, Smartphone, Download, Sparkles } from 'lucide-react';

// Global window event listener to capture beforeinstallprompt before React mounts
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
  
  // Standalone detection across Android, iOS, Chrome, Edge, Safari
  const [isStandalone, setIsStandalone] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return (
      window.matchMedia('(display-mode: standalone)').matches ||
      window.matchMedia('(display-mode: fullscreen)').matches ||
      window.matchMedia('(display-mode: minimal-ui)').matches ||
      (navigator as any).standalone === true ||
      document.referrer.includes('android-app://')
    );
  });

  const [showInstallBanner, setShowInstallBanner] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return sessionStorage.getItem('opstracka_install_dismissed') !== 'true';
  });

  const [updateAvailable, setUpdateAvailable] = useState<boolean>(false);
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null);
  const [isUpdating, setIsUpdating] = useState<boolean>(false);
  const latestServerVersionRef = useRef<string | null>(null);

  // Monitor display-mode changes & app installed events
  useEffect(() => {
    const checkStandalone = () => {
      const standalone = (
        window.matchMedia('(display-mode: standalone)').matches ||
        window.matchMedia('(display-mode: fullscreen)').matches ||
        window.matchMedia('(display-mode: minimal-ui)').matches ||
        (navigator as any).standalone === true ||
        document.referrer.includes('android-app://')
      );
      setIsStandalone(!!standalone);
    };

    checkStandalone();

    const mq = window.matchMedia('(display-mode: standalone)');
    const handleMq = (e: MediaQueryListEvent) => {
      setIsStandalone(e.matches);
    };

    if (mq.addEventListener) {
      mq.addEventListener('change', handleMq);
    } else if ((mq as any).addListener) {
      (mq as any).addListener(handleMq);
    }

    const handleAppInstalled = () => {
      setIsStandalone(true);
      setShowInstallBanner(false);
      setDeferredPrompt(null);
      (window as any).__deferredPrompt = null;
    };

    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      if (mq.removeEventListener) {
        mq.removeEventListener('change', handleMq);
      } else if ((mq as any).removeListener) {
        (mq as any).removeListener(handleMq);
      }
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  // Listen for beforeinstallprompt
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

    if ((window as any).__deferredPrompt) {
      setDeferredPrompt((window as any).__deferredPrompt);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, [isStandalone]);

  // Version check function: compares server version.json against stored client version
  const checkVersionUpdate = useCallback(async () => {
    try {
      const res = await fetch(`/version.json?t=${Date.now()}`, {
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache', Pragma: 'no-cache' },
      });
      if (res.ok) {
        const data = await res.json();
        if (data && data.version) {
          const currentLocalVer = localStorage.getItem('opstracka_installed_version');
          latestServerVersionRef.current = data.version;

          if (!currentLocalVer) {
            // First time running version check: store it
            localStorage.setItem('opstracka_installed_version', data.version);
          } else if (currentLocalVer !== data.version) {
            // New version detected!
            setUpdateAvailable(true);
          }
        }
      }
    } catch {
      // Offline or network error - safe to ignore
    }
  }, []);

  // Service worker registration, active update checks & update detection
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Check version immediately
    checkVersionUpdate();

    if (!('serviceWorker' in navigator)) return;

    let updateInterval: any = null;

    navigator.serviceWorker
      .register('/sw.js', { updateViaCache: 'none' })
      .then((reg) => {
        // 1. Initial check for an existing waiting worker (ready to activate)
        if (reg.waiting) {
          setWaitingWorker(reg.waiting);
          setUpdateAvailable(true);
        }

        // 2. Check for newly arriving service worker updates
        reg.onupdatefound = () => {
          const installingWorker = reg.installing;
          if (installingWorker) {
            installingWorker.onstatechange = () => {
              if (installingWorker.state === 'installed') {
                if (navigator.serviceWorker.controller) {
                  // A new worker has installed and is waiting
                  setWaitingWorker(installingWorker);
                  setUpdateAvailable(true);
                }
              }
            };
          }
        };

        // 3. Proactive update check immediately on mount
        reg.update().catch(() => {});

        // 4. Periodic update checks every 30 seconds
        updateInterval = setInterval(() => {
          reg.update().catch(() => {});
          checkVersionUpdate();
        }, 30 * 1000);
      })
      .catch((err) => {
        console.warn('SW registration info:', err);
      });

    // Check updates whenever window is re-focused, tab becomes visible, or app returns from background
    const handleVisibilityOrFocus = () => {
      if (document.visibilityState === 'visible') {
        checkVersionUpdate();
        if ('serviceWorker' in navigator) {
          navigator.serviceWorker.getRegistration().then((reg) => {
            if (reg) {
              reg.update().catch(() => {});
              if (reg.waiting) {
                setWaitingWorker(reg.waiting);
                setUpdateAvailable(true);
              }
            }
          });
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityOrFocus);
    window.addEventListener('focus', handleVisibilityOrFocus);
    window.addEventListener('online', handleVisibilityOrFocus);

    // Controller change listener (triggered when SKIP_WAITING activates the new SW)
    let isReloading = false;
    const handleControllerChange = () => {
      if (!isReloading) {
        isReloading = true;
        window.location.reload();
      }
    };

    navigator.serviceWorker.addEventListener('controllerchange', handleControllerChange);

    return () => {
      if (updateInterval) clearInterval(updateInterval);
      document.removeEventListener('visibilitychange', handleVisibilityOrFocus);
      window.removeEventListener('focus', handleVisibilityOrFocus);
      window.removeEventListener('online', handleVisibilityOrFocus);
      navigator.serviceWorker.removeEventListener('controllerchange', handleControllerChange);
    };
  }, [checkVersionUpdate]);

  // Direct PWA Installation Click Handler
  const handleInstallClick = useCallback(async () => {
    const promptEvent = deferredPrompt || (window as any).__deferredPrompt;

    if (promptEvent) {
      try {
        promptEvent.prompt();
        const choiceResult = await promptEvent.userChoice;
        if (choiceResult && choiceResult.outcome === 'accepted') {
          setShowInstallBanner(false);
          setIsStandalone(true);
          sessionStorage.setItem('opstracka_install_dismissed', 'true');
        }
        setDeferredPrompt(null);
        (window as any).__deferredPrompt = null;
      } catch (err) {
        console.warn('Install prompt error:', err);
      }
    }
  }, [deferredPrompt]);

  // Direct PWA Update Click Handler: Instantly applies updates and refreshes the app
  const handleUpdateClick = useCallback(async () => {
    setIsUpdating(true);

    // Update stored version if we have server version
    if (latestServerVersionRef.current) {
      localStorage.setItem('opstracka_installed_version', latestServerVersionRef.current);
    }

    try {
      // 1. Send skip waiting to the waiting worker if present
      if (waitingWorker) {
        waitingWorker.postMessage({ type: 'SKIP_WAITING' });
      }

      // 2. Send skip waiting to all registrations
      if ('serviceWorker' in navigator) {
        const reg = await navigator.serviceWorker.getRegistration();
        if (reg?.waiting) {
          reg.waiting.postMessage({ type: 'SKIP_WAITING' });
        }
      }

      // 3. Clear all caches in cacheStorage to purge stale chunks
      if (typeof caches !== 'undefined') {
        const cacheKeys = await caches.keys();
        await Promise.all(cacheKeys.map((key) => caches.delete(key)));
      }
    } catch (e) {
      console.warn('Cache clearing info:', e);
    }

    // 4. Force reload to load fresh assets immediately
    setTimeout(() => {
      window.location.reload();
    }, 400);
  }, [waitingWorker]);

  const handleDismissInstall = () => {
    setShowInstallBanner(false);
    sessionStorage.setItem('opstracka_install_dismissed', 'true');
  };

  // Visibility logic:
  // 1. If an update is available -> ALWAYS show "Update App" with highest priority (both on installed PWAs and web).
  // 2. If no update is available, but device has NOT installed the PWA and banner not dismissed -> Show "Install App".
  // 3. If installed and up to date -> Render nothing.
  const shouldShowUpdate = updateAvailable;
  const shouldShowInstall = !isStandalone && !updateAvailable && showInstallBanner;

  if (!shouldShowUpdate && !shouldShowInstall) {
    return null;
  }

  return (
    <aside aria-label="Application Status Notification" className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-md z-50 animate-in fade-in slide-in-from-bottom-5 duration-200">
      <div className="bg-slate-900/95 backdrop-blur-md border border-slate-800 text-white p-4 rounded-3xl shadow-2xl flex items-center justify-between gap-3.5 ring-1 ring-emerald-500/20">
        {shouldShowUpdate ? (
          // Update App Prompt (for installed PWAs and browsers when new code is deployed)
          <div className="flex items-center space-x-3 min-w-0">
            <div className="w-11 h-11 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shrink-0 shadow-inner">
              <RefreshCw className={`w-5 h-5 ${isUpdating ? 'animate-spin' : ''}`} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center space-x-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                <h4 className="font-bold text-sm text-white tracking-tight truncate flex items-center gap-1.5">
                  Update App Available
                  <Sparkles className="w-3.5 h-3.5 text-amber-400 inline" />
                </h4>
              </div>
              <p className="text-xs text-slate-300 truncate mt-0.5">New features & codebase changes are ready.</p>
            </div>
          </div>
        ) : (
          // Install App Prompt (for devices where PWA is not yet installed)
          <div className="flex items-center space-x-3 min-w-0">
            <div className="w-11 h-11 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shrink-0 shadow-inner">
              <Download className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h4 className="font-bold text-sm text-white tracking-tight truncate">Install OpsTracka App</h4>
              <p className="text-xs text-slate-300 truncate mt-0.5">Install directly for quick offline shift logs.</p>
            </div>
          </div>
        )}

        <div className="flex items-center space-x-2 shrink-0">
          {shouldShowUpdate ? (
            <button
              type="button"
              onClick={handleUpdateClick}
              disabled={isUpdating}
              className="bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-bold px-4 py-2.5 rounded-2xl text-xs shadow-lg shadow-emerald-600/30 flex items-center space-x-1.5 transition-all cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isUpdating ? 'animate-spin' : ''}`} />
              <span>{isUpdating ? 'Updating...' : 'Update App'}</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={handleInstallClick}
              className="bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-bold px-4 py-2.5 rounded-2xl text-xs shadow-lg shadow-emerald-600/30 flex items-center space-x-1.5 transition-all cursor-pointer"
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>Install App</span>
            </button>
          )}

          {!shouldShowUpdate && (
            <button
              type="button"
              onClick={handleDismissInstall}
              className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-800 transition-colors"
              title="Dismiss Install Prompt"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </aside>
  );
};
