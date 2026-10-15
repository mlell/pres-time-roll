export function registerServiceWorker() {
    if (!('serviceWorker' in navigator)) {
        return false;
    }

    const protocol = window.location.protocol;
    if (protocol !== 'http:' && protocol !== 'https:') {
        return false;
    }

    try {
        navigator.serviceWorker.register('./sw.js', { scope: './' }).catch(() => {
            // Registration failures are intentionally swallowed so local desktop testing
            // without a deployed service worker does not break the app shell.
        });
        return true;
    } catch (error) {
        console.warn('Service worker registration failed:', error);
        return false;
    }
}
