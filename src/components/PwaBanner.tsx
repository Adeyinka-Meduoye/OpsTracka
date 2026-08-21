import React, { useEffect, useState } from 'react';
import { RefreshCw, X, Smartphone, Monitor, CheckCircle2, HelpCircle } from 'lucide-react';

export const PwaBanner: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [showInstallModal, setShowInstallModal] = useState(false);

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
        setShowInstallModal(true);
      }
    } else {
      // If deferredPrompt is not available (common on desktop Chrome/Edge/Safari), show the interactive Install Guide Modal
      setShowInstallModal(true);
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

  // If update is available, ALWAYS show banner. If standalone and no update, return null.
  if (isStandalone && !updateAvailable) return null;
  if (!updateAvailable && !showInstallBanner) return null;

  return (
    <>
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

      {/* Interactive Install Guide Modal for Desktop & Mobile */}
      {showInstallModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 text-slate-100 rounded-3xl max-w-lg w-full p-6 md:p-8 relative shadow-2xl space-y-6">
            <button
              onClick={() => setShowInstallModal(false)}
              className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-white bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
                <Monitor className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">How to Install OpsTracka</h3>
                <p className="text-xs text-slate-400">Follow these quick steps for your browser or device</p>
              </div>
            </div>

            <div className="space-y-4 text-sm text-slate-300">
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2">
                <h4 className="font-bold text-emerald-400 flex items-center text-xs uppercase tracking-wider">
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Desktop (Chrome, Edge, Brave on Windows/Mac)
                </h4>
                <ol className="list-decimal list-inside space-y-1 text-xs text-slate-300 pl-1">
                  <li>Look at the right side of your browser <strong>address bar / URL bar</strong>.</li>
                  <li>Click the <span className="bg-slate-800 px-2 py-0.5 rounded text-emerald-300 font-mono">Install</span> icon (🖥️ with an arrow or ⊕ sign), OR</li>
                  <li>Click the browser menu (<span className="font-bold">•••</span> or <span className="font-bold">⋮</span>) in the top-right corner.</li>
                  <li>Select <strong>"Install OpsTracka..."</strong> or <strong>"Save and share &gt; Install page as app"</strong>.</li>
                </ol>
              </div>

              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2">
                <h4 className="font-bold text-blue-400 flex items-center text-xs uppercase tracking-wider">
                  <Smartphone className="w-4 h-4 mr-2" />
                  Mobile & Tablet (Android & iOS)
                </h4>
                <ul className="list-disc list-inside space-y-1 text-xs text-slate-300 pl-1">
                  <li><strong>Android (Chrome):</strong> Tap the 3-dot menu and select <strong>"Install app"</strong> or <strong>"Add to Home screen"</strong>.</li>
                  <li><strong>iOS (Safari):</strong> Tap the <strong>Share</strong> button at the bottom of Safari, scroll down and tap <strong>"Add to Home Screen"</strong>.</li>
                </ul>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setShowInstallModal(false)}
                className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold shadow"
              >
                Got It
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

