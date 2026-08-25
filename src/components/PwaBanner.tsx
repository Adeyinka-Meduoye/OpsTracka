import React, { useEffect, useState, useCallback } from 'react';
import { RefreshCw, X, Smartphone, Download, Share, PlusSquare, CheckCircle2 } from 'lucide-react';

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
  const [showIosGuideModal, setShowIosGuideModal] = useState<boolean>(false);

  // Check and listen to display-mode changes
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

  // Service worker registration, update checks & update detection
  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;

    let updateInterval: any = null;

    navigator.serviceWorker
      .register('/sw.js', { updateViaCache: 'none' })
      .then((reg) => {
        // 1. Initial check for an existing waiting worker (ready to update)
        if (reg.waiting) {
          setWaitingWorker(reg.waiting);
          setUpdateAvailable(true);
        }

        // 2. Check for newly arriving service worker updates
        reg.onupdatefound = () => {
          const installingWorker = reg.installing;
          if (installingWorker) {
            installingWorker.onstatechange = () => {
              if (installingWorker.state === 'installed' && navigator.serviceWorker.controller) {
                setWaitingWorker(installingWorker);
                setUpdateAvailable(true);
              }
            };
          }
        };

        // 3. Proactive update check immediately on mount
        reg.update().catch(() => {});

        // 4. Periodic update checks every 60 seconds
        updateInterval = setInterval(() => {
          reg.update().catch(() => {});
        }, 60 * 1000);
      })
      .catch((err) => {
        console.warn('SW registration info:', err);
      });

    // Check updates when window is re-focused or tab becomes visible (common when opening PWA)
    const handleVisibilityOrFocus = () => {
      if (document.visibilityState === 'visible' && 'serviceWorker' in navigator) {
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
    };

    document.addEventListener('visibilitychange', handleVisibilityOrFocus);
    window.addEventListener('focus', handleVisibilityOrFocus);
    window.addEventListener('online', handleVisibilityOrFocus);

    // Controller change listener (triggered when SKIP_WAITING is invoked)
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
  }, []);

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
      return;
    }

    // Check if iOS Safari
    const isIOS =
      (/iPad|iPhone|iPod/.test(navigator.userAgent) ||
        (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)) &&
      !(window as any).MSStream;

    if (isIOS) {
      setShowIosGuideModal(true);
    } else {
      // Fallback for Chromium/Desktop when prompt was already triggered or browser menu is required
      setShowIosGuideModal(true);
    }
  }, [deferredPrompt]);

  // Direct PWA Update Click Handler
  const handleUpdateClick = useCallback(() => {
    setIsUpdating(true);

    if (waitingWorker) {
      waitingWorker.postMessage({ type: 'SKIP_WAITING' });
      // Fallback reload in case controllerchange event doesn't fire within 1.5s
      setTimeout(() => {
        window.location.reload();
      }, 1500);
      return;
    }

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistration().then((reg) => {
        if (reg && reg.waiting) {
          reg.waiting.postMessage({ type: 'SKIP_WAITING' });
          setTimeout(() => {
            window.location.reload();
          }, 1500);
        } else {
          // Clear caches and reload
          if (typeof caches !== 'undefined') {
            caches.keys().then((names) => Promise.all(names.map((n) => caches.delete(n)))).finally(() => {
              window.location.reload();
            });
          } else {
            window.location.reload();
          }
        }
      });
    } else {
      window.location.reload();
    }
  }, [waitingWorker]);

  const handleDismissInstall = () => {
    setShowInstallBanner(false);
    sessionStorage.setItem('opstracka_install_dismissed', 'true');
  };

  // Determine what to display:
  // 1. If an update is available -> ALWAYS show the "Update App" prompt (for both standalone & browser).
  // 2. If no update is available, but device is NOT installed (not standalone) and not dismissed -> Show "Install App" prompt.
  // 3. If installed and no update -> Render nothing.
  const shouldShowUpdate = updateAvailable;
  const shouldShowInstall = !isStandalone && !updateAvailable && showInstallBanner;

  if (!shouldShowUpdate && !shouldShowInstall && !showIosGuideModal) {
    return null;
  }

  return (
    <>
      {/* Primary Floating Action Prompt */}
      {(shouldShowUpdate || shouldShowInstall) && (
        <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-md z-50 animate-in fade-in slide-in-from-bottom-5 duration-200">
          <div className="bg-slate-900/95 backdrop-blur-md border border-slate-800 text-white p-4 rounded-3xl shadow-2xl flex items-center justify-between gap-3.5 ring-1 ring-emerald-500/20">
            {shouldShowUpdate ? (
              // Case B: Update App Prompt
              <div className="flex items-center space-x-3 min-w-0">
                <div className="w-11 h-11 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shrink-0 shadow-inner">
                  <RefreshCw className={`w-5 h-5 ${isUpdating ? 'animate-spin' : ''}`} />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center space-x-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                    <h4 className="font-bold text-sm text-white tracking-tight truncate">Update App Available</h4>
                  </div>
                  <p className="text-xs text-slate-300 truncate mt-0.5">New features & codebase changes are ready.</p>
                </div>
              </div>
            ) : (
              // Case A: Install App Prompt
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
        </div>
      )}

      {/* Direct Installation Guidance Modal (for iOS Safari or manual browser install) */}
      {showIosGuideModal && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 text-white rounded-3xl max-w-md w-full p-6 sm:p-8 relative shadow-2xl">
            <button
              onClick={() => setShowIosGuideModal(false)}
              className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-white bg-slate-800/80 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-3 mb-5">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shrink-0">
                <Smartphone className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Install OpsTracka</h3>
                <span className="text-xs text-emerald-400">Direct Home Screen Installation</span>
              </div>
            </div>

            <p className="text-xs text-slate-300 mb-5 leading-relaxed">
              Install OpsTracka on your device for one-tap access, fast offline shift logging, and full screen experience.
            </p>

            <div className="space-y-3.5 bg-slate-950/70 p-4 rounded-2xl border border-slate-800/80 text-xs">
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 rounded-lg bg-emerald-600/20 text-emerald-400 flex items-center justify-center shrink-0 font-bold text-[11px] mt-0.5">
                  1
                </div>
                <div>
                  <span className="font-semibold text-white block">Tap the Share Icon</span>
                  <span className="text-slate-400">
                    Tap the <Share className="w-3.5 h-3.5 inline text-emerald-400 mx-1" /> Share button in your browser toolbar (bottom on iOS Safari, or top menu in Chrome).
                  </span>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 rounded-lg bg-emerald-600/20 text-emerald-400 flex items-center justify-center shrink-0 font-bold text-[11px] mt-0.5">
                  2
                </div>
                <div>
                  <span className="font-semibold text-white block">Select "Add to Home Screen"</span>
                  <span className="text-slate-400">
                    Scroll down and tap <PlusSquare className="w-3.5 h-3.5 inline text-emerald-400 mx-1" /> <strong>Add to Home Screen</strong>.
                  </span>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 rounded-lg bg-emerald-600/20 text-emerald-400 flex items-center justify-center shrink-0 font-bold text-[11px] mt-0.5">
                  3
                </div>
                <div>
                  <span className="font-semibold text-white block">Confirm & Launch</span>
                  <span className="text-slate-400">
                    Tap <strong>Add</strong> in the top-right corner. OpsTracka will appear as an app on your home screen!
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={() => setShowIosGuideModal(false)}
                className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-lg transition-colors flex items-center justify-center space-x-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Got It</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
