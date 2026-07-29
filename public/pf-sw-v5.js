// PixelFlow PWA Service Worker v5 — nuclear cleanup + shell-only
const CACHE_NAME = 'pixelflow-v5-clean';

const SHELL_ASSETS = [
    '/manifest.json',
    '/icons/icon-192x192.png',
    '/icons/icon-512x512.png',
    '/logo-altos-blanco.png'
];

self.addEventListener('install', (event) => {
    console.log('[SW] Installing', CACHE_NAME);
    self.skipWaiting();
    event.waitUntil((async () => {
        // Nuclear cleanup: purge EVERY cache from any previous SW version.
        const keys = await caches.keys();
        await Promise.all(keys.map((k) => caches.delete(k)));
        const cache = await caches.open(CACHE_NAME);
        try { await cache.addAll(SHELL_ASSETS); } catch (e) {}
    })());
});

self.addEventListener('activate', (event) => {
    console.log('[SW] Activating', CACHE_NAME);
    event.waitUntil((async () => {
        const keys = await caches.keys();
        await Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)));
        await self.clients.claim();
        // Tell every open tab to reload once so the new build's chunks are fetched fresh.
        const clients = await self.clients.matchAll({ type: 'window' });
        for (const client of clients) {
            try { client.postMessage({ type: 'PIXELFLOW_SW_UPDATED' }); } catch (e) {}
        }
    })());
});

self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);
    if (url.origin !== self.location.origin) return;

    // NEVER intercept these — always fresh from network.
    if (
        url.pathname.startsWith('/_next/') ||
        url.pathname.startsWith('/api/') ||
        url.pathname.startsWith('/socket.io/') ||
        url.pathname.startsWith('/uploads/')
    ) {
        return;
    }

    // Navigation requests (HTML): network-first with cache fallback for offline
    if (event.request.mode === 'navigate') {
        event.respondWith(
            fetch(event.request).catch(() => caches.match(event.request) || caches.match('/'))
        );
        return;
    }

    // App shell (icons, manifest, logo): cache-first
    if (url.pathname.startsWith('/icons/') || SHELL_ASSETS.some((a) => url.pathname === a)) {
        event.respondWith(
            caches.match(event.request).then((r) => r || fetch(event.request).then((nr) => {
                if (nr && nr.status === 200) {
                    const clone = nr.clone();
                    caches.open(CACHE_NAME).then((c) => c.put(event.request, clone));
                }
                return nr;
            }))
        );
        return;
    }

    // Everything else: passthrough
});

self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') self.skipWaiting();
});
