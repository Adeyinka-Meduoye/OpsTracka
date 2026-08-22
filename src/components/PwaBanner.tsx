import React, { useEffect, useState } from 'react';
import { RefreshCw, X, Smartphone, Share } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
}

export const PwaBanner: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);

  const [showInstallBanner, setShowInstallBanner] = useState(false);
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [showIOSInstructions, setShowIOSInstructions] = useState(false);

  // =========================================================
  // CHECK INSTALLATION STATUS
  // =========================================================

  useEffect(() => {
    const checkStandalone = () => {
      const standalone =
        window.matchMedia('(display-mode: standalone)').matches ||
        (navigator as any).standalone === true;

      setIsStandalone(standalone);

      return standalone;
    };

    const standalone = checkStandalone();

    // Already installed → don't show install banner
    if (standalone) {
      setShowInstallBanner(false);
      return;
    }

    // Not installed → show custom install banner
    const timer = setTimeout(() => {
      setShowInstallBanner(true);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  // =========================================================
  // INSTALL PROMPT + SERVICE WORKER
  // =========================================================

  useEffect(() => {
    // -------------------------------------------------------
    // Native browser installation prompt
    // -------------------------------------------------------

    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();

      const installEvent = event as BeforeInstallPromptEvent;

      setDeferredPrompt(installEvent);

      // Store globally in case another component needs it
      (window as any).__deferredPrompt = installEvent;

      const standalone =
        window.matchMedia('(display-mode: standalone)').matches ||
        (navigator as any).standalone === true;

      if (!standalone) {
        setShowInstallBanner(true);
      }
    };

    window.addEventListener(
      'beforeinstallprompt',
      handleBeforeInstallPrompt
    );

    // Check if prompt was captured before this component mounted
    const existingPrompt = (window as any).__deferredPrompt;

    if (existingPrompt) {
      setDeferredPrompt(existingPrompt);
    }

    // =======================================================
    // SERVICE WORKER
    // =======================================================

    let updateInterval: ReturnType<typeof setInterval> | null = null;

    const registerServiceWorker = async () => {
      if (!('serviceWorker' in navigator)) {
        console.log('[PWA] Service Worker is not supported.');
        return;
      }

      try {
        const registration = await navigator.serviceWorker.register(
          '/sw.js'
        );

        console.log(
          '[PWA] Service Worker registered:',
          registration.scope
        );

        // ---------------------------------------------------
        // Check immediately for updates
        // ---------------------------------------------------

        await registration.update();

        // ---------------------------------------------------
        // Check if an update is already waiting
        // ---------------------------------------------------

        if (registration.waiting) {
          console.log('[PWA] Update already waiting.');
          setUpdateAvailable(true);
        }

        // ---------------------------------------------------
        // Detect newly installed Service Worker
        // ---------------------------------------------------

        registration.addEventListener('updatefound', () => {
          const installingWorker = registration.installing;

          if (!installingWorker) {
            return;
          }

          console.log('[PWA] New Service Worker found.');

          installingWorker.addEventListener('statechange', () => {
            console.log(
              '[PWA] Service Worker state:',
              installingWorker.state
            );

            if (
              installingWorker.state === 'installed' &&
              navigator.serviceWorker.controller
            ) {
              console.log('[PWA] New app update available.');

              setUpdateAvailable(true);
            }
          });
        });

        // ---------------------------------------------------
        // Periodic update check
        // ---------------------------------------------------

        updateInterval = setInterval(() => {
          registration.update().catch(() => {});
        }, 15 * 60 * 1000);
      } catch (error) {
        console.error(
          '[PWA] Service Worker registration failed:',
          error
        );
      }
    };

    registerServiceWorker();

    // =======================================================
    // CHECK FOR UPDATE WHEN APP RETURNS TO FOREGROUND
    // =======================================================

    const handleVisibilityChange = () => {
      if (document.visibilityState !== 'visible') {
        return;
      }

      navigator.serviceWorker
        ?.getRegistration()
        .then((registration) => {
          if (!registration) {
            return;
          }

          registration.update().catch(() => {});

          if (registration.waiting) {
            console.log(
              '[PWA] Waiting Service Worker detected.'
            );

            setUpdateAvailable(true);
          }
        });
    };

    document.addEventListener(
      'visibilitychange',
      handleVisibilityChange
    );

    // =======================================================
    // RELOAD AFTER SERVICE WORKER ACTIVATION
    // =======================================================

    let refreshing = false;

    const handleControllerChange = () => {
      if (refreshing) {
        return;
      }

      refreshing = true;

      console.log(
        '[PWA] New Service Worker activated. Reloading app...'
      );

      window.location.reload();
    };

    navigator.serviceWorker?.addEventListener(
      'controllerchange',
      handleControllerChange
    );

    // =======================================================
    // CLEANUP
    // =======================================================

    return () => {
      window.removeEventListener(
        'beforeinstallprompt',
        handleBeforeInstallPrompt
      );

      document.removeEventListener(
        'visibilitychange',
        handleVisibilityChange
      );

      navigator.serviceWorker?.removeEventListener(
        'controllerchange',
        handleControllerChange
      );

      if (updateInterval) {
        clearInterval(updateInterval);
      }
    };
  }, []);

  // =========================================================
  // DEVICE DETECTION
  // =========================================================

  const isIOS =
    /iPad|iPhone|iPod/.test(navigator.userAgent) &&
    !(window as any).MSStream;

  // =========================================================
  // INSTALL APP
  // =========================================================

  const handleInstallClick = async () => {
    const promptEvent =
      deferredPrompt || (window as any).__deferredPrompt;

    // -------------------------------------------------------
    // Chrome / Edge / supported browsers
    // -------------------------------------------------------

    if (promptEvent) {
      try {
        await promptEvent.prompt();

        const { outcome } = await promptEvent.userChoice;

        console.log('[PWA] Installation result:', outcome);

        if (outcome === 'accepted') {
          setShowInstallBanner(false);
        }

        setDeferredPrompt(null);
        (window as any).__deferredPrompt = null;
      } catch (error) {
        console.error(
          '[PWA] Installation prompt failed:',
          error
        );
      }

      return;
    }

    // -------------------------------------------------------
    // iOS Safari
    // -------------------------------------------------------

    if (isIOS) {
      setShowIOSInstructions(true);
      return;
    }

    // -------------------------------------------------------
    // Browsers without beforeinstallprompt
    // -------------------------------------------------------

    alert(
      'To install OpsTracka, open your browser menu and select "Install App" or "Add to Home Screen".'
    );
  };

  // =========================================================
  // UPDATE APP
  // =========================================================

  const handleUpdateClick = async () => {
    if (!('serviceWorker' in navigator)) {
      window.location.reload();
      return;
    }

    try {
      const registration =
        await navigator.serviceWorker.getRegistration();

      if (registration?.waiting) {
        console.log(
          '[PWA] Activating waiting Service Worker...'
        );

        registration.waiting.postMessage({
          type: 'SKIP_WAITING',
        });

        // The controllerchange event above will reload
        // the application automatically.

        return;
      }

      // -----------------------------------------------------
      // Fallback: force an update check
      // -----------------------------------------------------

      console.log(
        '[PWA] No waiting worker found. Checking for update...'
      );

      await registration?.update();

      window.location.reload();
    } catch (error) {
      console.error('[PWA] Update failed:', error);

      window.location.reload();
    }
  };

  // =========================================================
  // NOTHING TO SHOW
  // =========================================================

  // Installed app + no update
  if (isStandalone && !updateAvailable) {
    return null;
  }

  // Neither install nor update banner is active
  if (!showInstallBanner && !updateAvailable) {
    return null;
  }

  // =========================================================
  // RENDER
  // =========================================================

  return (
    <>
      {/* =====================================================
          MAIN PWA BANNER
      ====================================================== */}

      <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:max-w-md z-50 bg-slate-900 border border-slate-800 text-white p-4 rounded-2xl shadow-2xl flex items-center justify-between gap-4 animate-bounce-in">

        {/* ===================================================
            UPDATE BANNER
        ==================================================== */}

        {updateAvailable ? (
          <>
            <div className="flex items-center space-x-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shrink-0">
                <RefreshCw className="w-5 h-5" />
              </div>

              <div className="min-w-0">
                <h4 className="font-bold text-sm">
                  Update OpsTracka
                </h4>

                <p className="text-xs text-slate-400">
                  A new version of OpsTracka is available.
                </p>
              </div>
            </div>

            <button
              onClick={handleUpdateClick}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-4 py-2 rounded-xl text-xs shadow transition-colors shrink-0"
            >
              Update App
            </button>
          </>
        ) : (

          /* =================================================
             INSTALL BANNER
          ================================================== */

          <>
            <div className="flex items-center space-x-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shrink-0">
                <Smartphone className="w-5 h-5" />
              </div>

              <div className="min-w-0">
                <h4 className="font-bold text-sm">
                  Install OpsTracka
                </h4>

                <p className="text-xs text-slate-400">
                  Install the app for faster access and offline support.
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2 shrink-0">
              <button
                onClick={handleInstallClick}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-4 py-2 rounded-xl text-xs shadow transition-colors"
              >
                Install App
              </button>

              <button
                onClick={() => setShowInstallBanner(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
                aria-label="Close install banner"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </>
        )}
      </div>

      {/* =====================================================
          IOS INSTALLATION INSTRUCTIONS
      ====================================================== */}

      {showIOSInstructions && (
        <div className="fixed inset-0 z-[60] bg-black/60 flex items-end sm:items-center justify-center p-4">
          <div className="w-full max-w-md bg-slate-900 text-white rounded-2xl p-6 shadow-2xl border border-slate-800">

            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="font-bold text-lg">
                  Install OpsTracka
                </h3>

                <p className="text-sm text-slate-400">
                  Add OpsTracka to your iPhone or iPad.
                </p>
              </div>

              <button
                onClick={() => setShowIOSInstructions(false)}
                className="text-slate-400 hover:text-white"
                aria-label="Close instructions"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-sm text-slate-300">

              <div className="flex gap-3">
                <span className="font-bold text-emerald-400">
                  1.
                </span>

                <p>
                  Tap the{' '}
                  <Share className="inline w-4 h-4" />{' '}
                  <strong>Share</strong> button in Safari.
                </p>
              </div>

              <div className="flex gap-3">
                <span className="font-bold text-emerald-400">
                  2.
                </span>

                <p>
                  Scroll down and select{' '}
                  <strong>Add to Home Screen</strong>.
                </p>
              </div>

              <div className="flex gap-3">
                <span className="font-bold text-emerald-400">
                  3.
                </span>

                <p>
                  Tap <strong>Add</strong>.
                </p>
              </div>

            </div>

            <button
              onClick={() => setShowIOSInstructions(false)}
              className="w-full mt-6 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 rounded-xl"
            >
              Got It
            </button>
          </div>
        </div>
      )}
    </>
  );
};