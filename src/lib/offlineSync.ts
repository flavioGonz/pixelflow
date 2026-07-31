/**
 * PixelFlow — Fase B offline-first helper
 * Registra el SW, hace prefetch de todos los layouts + medios, expone estado.
 */

export type SyncStatus = 'idle' | 'syncing' | 'ready' | 'error';

let _swReady = false;
let _lastSync: number = 0;
let _prefetching = false;

export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return null;
    try {
        const reg = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
        // Auto-actualizar cuando hay SW nuevo
        reg.addEventListener('updatefound', () => {
            const nw = reg.installing;
            if (nw) nw.addEventListener('statechange', () => {
                if (nw.state === 'installed' && navigator.serviceWorker.controller) {
                    nw.postMessage({ type: 'SKIP_WAITING' });
                }
            });
        });
        navigator.serviceWorker.addEventListener('message', (ev) => {
            if (ev.data?.type === 'SW_READY') _swReady = true;
        });
        // Ya activo?
        if (navigator.serviceWorker.controller) _swReady = true;
        return reg;
    } catch (e) {
        console.warn('SW register failed:', e);
        return null;
    }
}

export function isSwReady(): boolean { return _swReady; }
export function lastSyncAt(): number { return _lastSync; }

/**
 * Extrae URLs de medios de un layout (widgets + fondo).
 */
function extractMediaUrls(layout: any): string[] {
    const urls = new Set<string>();
    const push = (u: any) => {
        if (typeof u !== 'string') return;
        if (!u) return;
        if (u.startsWith('/uploads/') || u.includes('/uploads/')) urls.add(u);
    };
    // Fondo del lienzo
    push(layout?.backgroundMedia?.url);
    push(layout?.backgroundImage);
    push(layout?.backgroundVideo);
    // Widgets
    const widgets = layout?.widgets || [];
    for (const w of widgets) {
        const d = w?.data || {};
        push(d.url);
        push(d.imageUrl);
        push(d.videoUrl);
        push(d.src);
        push(d.poster);
        if (Array.isArray(d.images)) d.images.forEach(push);
        if (Array.isArray(d.items)) {
            for (const it of d.items) {
                push(it?.imageUrl);
                push(it?.iconUrl);
                push(it?.url);
            }
        }
        if (Array.isArray(d.products)) {
            for (const p of d.products) push(p?.imageUrl || p?.photoUrl);
        }
    }
    return Array.from(urls);
}

/**
 * Prefetch de TODOS los layouts + medios. Se llama después del primer render exitoso.
 * Idempotente — no vuelve a correr si ya está en curso.
 */
export async function prefetchAllLayouts(): Promise<{ layouts: number; media: number }> {
    if (_prefetching) return { layouts: 0, media: 0 };
    if (typeof window === 'undefined') return { layouts: 0, media: 0 };
    _prefetching = true;
    try {
        const listRes = await fetch('/api/layouts', { cache: 'no-cache' });
        if (!listRes.ok) throw new Error('list fetch failed');
        const list: any[] = await listRes.json();
        const mediaUrls = new Set<string>();
        for (const meta of list) {
            const id = meta._id || meta.id;
            if (!id) continue;
            try {
                const r = await fetch('/api/layouts/' + id, { cache: 'no-cache' });
                if (r.ok) {
                    const layout = await r.json();
                    extractMediaUrls(layout).forEach((u) => mediaUrls.add(u));
                }
            } catch {}
        }
        // Pedir al SW que descargue todos los medios en background
        if (navigator.serviceWorker?.controller && mediaUrls.size > 0) {
            navigator.serviceWorker.controller.postMessage({
                type: 'PREFETCH_MEDIA',
                urls: Array.from(mediaUrls),
            });
        }
        _lastSync = Date.now();
        return { layouts: list.length, media: mediaUrls.size };
    } catch (e) {
        console.warn('prefetch layouts failed:', e);
        return { layouts: 0, media: 0 };
    } finally {
        _prefetching = false;
    }
}
