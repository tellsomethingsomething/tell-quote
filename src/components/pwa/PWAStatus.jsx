import { useState, useEffect } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { Wifi, WifiOff, RefreshCw, X, Download } from 'lucide-react';
import logger from '../../utils/logger';

export default function PWAStatus() {
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    const [showOfflineToast, setShowOfflineToast] = useState(false);
    const [showInstallPrompt, setShowInstallPrompt] = useState(false);
    const [deferredPrompt, setDeferredPrompt] = useState(null);

    // Register service worker with update prompt
    const {
        needRefresh: [needRefresh, setNeedRefresh],
        updateServiceWorker,
    } = useRegisterSW({
        onRegistered(r) {
            logger.debug('SW Registered:', r);
        },
        onRegisterError(error) {
            logger.debug('SW registration error', error);
        },
    });

    // Online/offline detection
    useEffect(() => {
        const handleOnline = () => {
            setIsOnline(true);
            setShowOfflineToast(false);
        };

        const handleOffline = () => {
            setIsOnline(false);
            setShowOfflineToast(true);
        };

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        // Show offline toast if starting offline
        if (!navigator.onLine) {
            setShowOfflineToast(true);
        }

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    // Install prompt handling
    useEffect(() => {
        const handleBeforeInstallPrompt = (e) => {
            e.preventDefault();
            setDeferredPrompt(e);
            // Only show if not already installed and not dismissed recently
            const dismissed = localStorage.getItem('pwa-install-dismissed');
            if (!dismissed || Date.now() - parseInt(dismissed) > 7 * 24 * 60 * 60 * 1000) {
                setShowInstallPrompt(true);
            }
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        };
    }, []);

    const handleInstall = async () => {
        if (!deferredPrompt) return;

        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;

        if (outcome === 'accepted') {
            logger.debug('User accepted install prompt');
        }

        setDeferredPrompt(null);
        setShowInstallPrompt(false);
    };

    const dismissInstallPrompt = () => {
        localStorage.setItem('pwa-install-dismissed', Date.now().toString());
        setShowInstallPrompt(false);
    };

    return (
        <>
            {/* Offline Toast */}
            {showOfflineToast && !isOnline && (
                <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-80 z-50 animate-slide-up">
                    <div className="bg-amber-500/90 backdrop-blur-sm text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-3">
                        <WifiOff className="w-5 h-5 flex-shrink-0" />
                        <div className="flex-1">
                            <p className="font-medium text-sm">You're offline</p>
                            <p className="text-xs text-amber-100">Changes will sync when you reconnect</p>
                        </div>
                        <button
                            onClick={() => setShowOfflineToast(false)}
                            className="p-1 hover:bg-white/20 rounded"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            )}

            {/* Back Online Toast */}
            {isOnline && showOfflineToast && (
                <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-80 z-50 animate-slide-up">
                    <div className="bg-emerald-500/90 backdrop-blur-sm text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-3">
                        <Wifi className="w-5 h-5 flex-shrink-0" />
                        <div className="flex-1">
                            <p className="font-medium text-sm">Back online</p>
                            <p className="text-xs text-emerald-100">Syncing your changes...</p>
                        </div>
                        <button
                            onClick={() => setShowOfflineToast(false)}
                            className="p-1 hover:bg-white/20 rounded"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            )}

            {/* Update Available Toast */}
            {needRefresh && (
                <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-80 z-50 animate-slide-up">
                    <div className="bg-blue-500/90 backdrop-blur-sm text-white px-4 py-3 rounded-lg shadow-lg">
                        <div className="flex items-center gap-3">
                            <RefreshCw className="w-5 h-5 flex-shrink-0" />
                            <div className="flex-1">
                                <p className="font-medium text-sm">Update available</p>
                                <p className="text-xs text-blue-100">A new version is ready</p>
                            </div>
                        </div>
                        <div className="flex gap-2 mt-3">
                            <button
                                onClick={() => updateServiceWorker(true)}
                                className="flex-1 bg-white text-blue-600 px-3 py-1.5 rounded text-sm font-medium hover:bg-blue-50 transition-colors"
                            >
                                Update now
                            </button>
                            <button
                                onClick={() => setNeedRefresh(false)}
                                className="px-3 py-1.5 rounded text-sm hover:bg-white/20 transition-colors"
                            >
                                Later
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Install Prompt */}
            {showInstallPrompt && deferredPrompt && (
                <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-80 z-50 animate-slide-up">
                    <div className="bg-dark-card border border-dark-border text-white px-4 py-3 rounded-lg shadow-lg">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-brand-navy to-brand-primary rounded-lg flex items-center justify-center">
                                <Download className="w-5 h-5" />
                            </div>
                            <div className="flex-1">
                                <p className="font-medium text-sm">Install ProductionOS</p>
                                <p className="text-xs text-gray-400">Add to home screen for quick access</p>
                            </div>
                        </div>
                        <div className="flex gap-2 mt-3">
                            <button
                                onClick={handleInstall}
                                className="flex-1 bg-brand-primary text-white px-3 py-1.5 rounded text-sm font-medium hover:bg-brand-primary/90 transition-colors"
                            >
                                Install
                            </button>
                            <button
                                onClick={dismissInstallPrompt}
                                className="px-3 py-1.5 rounded text-sm text-gray-400 hover:bg-dark-border transition-colors"
                            >
                                Not now
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Persistent offline indicator in header area */}
            {!isOnline && (
                <div className="fixed top-0 left-0 right-0 z-40 bg-amber-500 text-white text-center py-1 text-xs font-medium">
                    <WifiOff className="w-3 h-3 inline-block mr-1" />
                    Offline Mode - Changes saved locally
                </div>
            )}
        </>
    );
}
