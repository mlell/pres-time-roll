const CACHE_VERSION = '__CACHE_VERSION__';
const APP_SHELL = ['./', './index.html', './manifest.webmanifest'];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_VERSION).then((cache) => cache.addAll(APP_SHELL)).then(() => self.skipWaiting())
    );
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames
                    .filter((cacheName) => cacheName !== CACHE_VERSION)
                    .map((cacheName) => caches.delete(cacheName))
            );
        }).then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', (event) => {
    if (event.request.method !== 'GET') {
        return;
    }

    const requestUrl = new URL(event.request.url);
    if (requestUrl.origin !== self.location.origin) {
        return;
    }

    const isNavigation = event.request.mode === 'navigate';

    event.respondWith(
        (async () => {
            if (isNavigation) {
                try {
                    const networkResponse = await fetch(event.request);
                    const cache = await caches.open(CACHE_VERSION);
                    cache.put(event.request, networkResponse.clone());
                    return networkResponse;
                } catch (error) {
                    const cachedFallback = await caches.match('./index.html') || await caches.match('./');
                    return cachedFallback || Response.error();
                }
            }

            const cached = await caches.match(event.request, { ignoreSearch: true });
            if (cached) {
                return cached;
            }

            try {
                const networkResponse = await fetch(event.request);
                const cache = await caches.open(CACHE_VERSION);
                cache.put(event.request, networkResponse.clone());
                return networkResponse;
            } catch (error) {
                return cached || Response.error();
            }
        })()
    );
});
