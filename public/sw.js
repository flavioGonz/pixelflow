/* PixelFlow Service Worker — Fase B: offline-first
 * v3 — reemplaza el kill-switch anterior (v2)
 *
 * Estrategias:
 *   /uploads/*                → cache-first (medios inmutables)
 *   /_next/static/*           → cache-first (chunks con hash)
 *   /_next/data/*             → stale-while-revalidate
 *   /api/layouts, /api/layouts/:id, /api/settings/screensaver → stale-while-revalidate
 *   /player/*                 → network-first con fallback a cache (HTML shell)
 *   otras /api/*              → network-only (no cache — datos vivos)
 *   resto                     → network-first
 */

const VERSION = "v7";
const CACHE_STATIC = 'pf-static-' + VERSION;
const CACHE_MEDIA  = 'pf-media-' + VERSION;
const CACHE_API    = 'pf-api-' + VERSION;
const CACHE_SHELL  = 'pf-shell-' + VERSION;
const KNOWN_CACHES = [CACHE_STATIC, CACHE_MEDIA, CACHE_API, CACHE_SHELL];

self.addEventListener('install', (event) => {
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil((async () => {
        const keys = await caches.keys();
        await Promise.all(keys.map((k) => (KNOWN_CACHES.includes(k) ? null : caches.delete(k))));
        await self.clients.claim();
        // Notificar clientes que hay SW nuevo activo
        const clients = await self.clients.matchAll({ type: 'window' });
        for (const c of clients) c.postMessage({ type: 'SW_READY', version: VERSION });
    })());
});

// Helpers
async function cacheFirst(request, cacheName) {
    const cache = await caches.open(cacheName);
    const cached = await cache.match(request);
    if (cached) return cached;
    try {
        const resp = await fetch(request);
        if (resp && resp.status === 200) cache.put(request, resp.clone());
        return resp;
    } catch (e) {
        return cached || Response.error();
    }
}

async function staleWhileRevalidate(request, cacheName) {
    const cache = await caches.open(cacheName);
    const cached = await cache.match(request);
    const netFetch = fetch(request).then((resp) => {
        if (resp && resp.status === 200) cache.put(request, resp.clone());
        return resp;
    }).catch(() => null);
    return cached || (await netFetch) || Response.error();
}

async function networkFirst(request, cacheName) {
    try {
        const resp = await fetch(request);
        if (resp && resp.status === 200 && cacheName) {
            const cache = await caches.open(cacheName);
            cache.put(request, resp.clone());
        }
        return resp;
    } catch (e) {
        if (cacheName) {
            const cache = await caches.open(cacheName);
            const cached = await cache.match(request);
            if (cached) return cached;
        }
        return Response.error();
    }
}

self.addEventListener('fetch', (event) => {
    const req = event.request;
    if (req.method !== 'GET') return; // Solo GET

    const url = new URL(req.url);
    // Solo mismo origen
    if (url.origin !== self.location.origin) return;

    // Sockets, streams, HMR — dejar pasar
    if (url.pathname.startsWith('/socket.io/')) return;
    if (url.pathname.startsWith('/_next/webpack-hmr')) return;
    if (url.pathname.startsWith('/api-docs')) return; // swagger UI

    // Medios inmutables → cache-first
    if (url.pathname.startsWith('/uploads/')) {
        event.respondWith(cacheFirst(req, CACHE_MEDIA));
        return;
    }
    // Chunks JS/CSS con hash → cache-first
    if (url.pathname.startsWith('/_next/static/')) {
        event.respondWith(cacheFirst(req, CACHE_STATIC));
        return;
    }
    // Data de Next (RSC) → SWR
    if (url.pathname.startsWith('/_next/data/')) {
        event.respondWith(staleWhileRevalidate(req, CACHE_STATIC));
        return;
    }
    // Endpoints que necesitamos offline → SWR
    if (
        url.pathname === '/api/layouts' ||
        url.pathname.startsWith('/api/layouts/') ||
        url.pathname === '/api/settings/screensaver'
    ) {
        event.respondWith(staleWhileRevalidate(req, CACHE_API));
        return;
    }
    // Otras APIs → network-only (no cachear datos vivos)
    if (url.pathname.startsWith('/api/')) return;

    // HTML del player → network-first con fallback cache
    if (url.pathname.startsWith('/player/')) {
        event.respondWith(networkFirst(req, CACHE_SHELL));
        return;
    }

    // Resto → default browser behavior
});

// Mensaje desde el cliente: prefetch masivo de layouts + medios
self.addEventListener('message', (event) => {
    const data = event.data || {};
    if (data.type === 'PREFETCH_MEDIA' && Array.isArray(data.urls)) {
        event.waitUntil((async () => {
            const cache = await caches.open(CACHE_MEDIA);
            await Promise.all(data.urls.map(async (u) => {
                try {
                    const already = await cache.match(u);
                    if (already) return;
                    const r = await fetch(u, { cache: 'no-cache' });
                    if (r && r.status === 200) cache.put(u, r.clone());
                } catch {}
            }));
            event.source && event.source.postMessage({ type: 'PREFETCH_MEDIA_DONE', count: data.urls.length });
        })());
    }
    if (data.type === 'SKIP_WAITING') self.skipWaiting();
});
