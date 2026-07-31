/**
 * PixelFlow SyncEngine — Solución C (offline-first hardcore)
 *
 * - Bootstrap: descarga TODO el manifest (layouts + medios) al arrancar el player.
 * - IDB: persist layouts localmente (idb-keyval usa IndexedDB, ~2KB).
 * - Cache Storage: los medios se pre-cachean via SW mediante postMessage.
 * - Deltas: al recibir socket 'layout_delta', actualiza IDB + re-cachea medios nuevos.
 *
 * API pública:
 *   bootstrapSync({onProgress, force}) → { layouts, media, deltaMs, fromCache }
 *   getCachedLayouts() → Layout[]
 *   getCachedLayout(id) → Layout | null
 *   applyDelta(layout) → void
 *   lastSyncTimestamp() → ms
 *   subscribeSyncStatus(cb) → unsubscribe
 */

export type LayoutJSON = any;

type SyncStatus = {
    state: 'idle' | 'bootstrapping' | 'ready' | 'syncing-delta' | 'error';
    total: number;
    done: number;
    currentAction?: string;
    lastSyncTs?: number;
    error?: string;
};

const DB_NAME = 'pixelflow';
const STORE_LAYOUTS = 'layouts';
const STORE_META = 'meta';
const META_KEY_LAST_SYNC = 'lastSyncTs';
const META_KEY_MANIFEST_HASH = 'manifestHash';

// ---- Minimal IDB wrapper (sin dependencias externas) ----
let _dbPromise: Promise<IDBDatabase> | null = null;
function openDB(): Promise<IDBDatabase> {
    if (_dbPromise) return _dbPromise;
    _dbPromise = new Promise((resolve, reject) => {
        const req = indexedDB.open(DB_NAME, 1);
        req.onupgradeneeded = () => {
            const db = req.result;
            if (!db.objectStoreNames.contains(STORE_LAYOUTS)) db.createObjectStore(STORE_LAYOUTS, { keyPath: '_id' });
            if (!db.objectStoreNames.contains(STORE_META)) db.createObjectStore(STORE_META);
        };
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
    });
    return _dbPromise;
}

async function idbGet<T = any>(store: string, key: string): Promise<T | undefined> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(store, 'readonly');
        const req = tx.objectStore(store).get(key);
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
    });
}
async function idbPut(store: string, value: any, key?: string): Promise<void> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(store, 'readwrite');
        const req = key !== undefined ? tx.objectStore(store).put(value, key) : tx.objectStore(store).put(value);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
    });
}
async function idbGetAll<T = any>(store: string): Promise<T[]> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(store, 'readonly');
        const req = tx.objectStore(store).getAll();
        req.onsuccess = () => resolve(req.result || []);
        req.onerror = () => reject(req.error);
    });
}
async function idbDelete(store: string, key: string): Promise<void> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(store, 'readwrite');
        const req = tx.objectStore(store).delete(key);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
    });
}

// ---- Status pub/sub ----
const _statusListeners = new Set<(s: SyncStatus) => void>();
let _currentStatus: SyncStatus = { state: 'idle', total: 0, done: 0 };

function setStatus(patch: Partial<SyncStatus>) {
    _currentStatus = { ..._currentStatus, ...patch };
    _statusListeners.forEach((l) => { try { l(_currentStatus); } catch (_e) {} })
}

export function subscribeSyncStatus(cb: (s: SyncStatus) => void): () => void {
    _statusListeners.add(cb);
    cb(_currentStatus);
    return () => { _statusListeners.delete(cb); };
}

export function getSyncStatus(): SyncStatus { return _currentStatus; }

// ---- Public API ----

export async function getCachedLayouts(): Promise<LayoutJSON[]> {
    try { return await idbGetAll<LayoutJSON>(STORE_LAYOUTS); }
    catch { return []; }
}

export async function getCachedLayout(id: string): Promise<LayoutJSON | null> {
    try {
        const l = await idbGet<LayoutJSON>(STORE_LAYOUTS, id);
        return l || null;
    } catch { return null; }
}

export async function lastSyncTimestamp(): Promise<number> {
    try { return (await idbGet<number>(STORE_META, META_KEY_LAST_SYNC)) || 0; }
    catch { return 0; }
}

/**
 * Aplica un layout individual al IDB (delta).
 * Devuelve las URLs nuevas de medios que aparecieron para pre-cachear.
 */
export async function applyDelta(layout: LayoutJSON): Promise<string[]> {
    if (!layout?._id) return [];
    const prev = await getCachedLayout(layout._id);
    await idbPut(STORE_LAYOUTS, layout);
    const newUrls = extractMediaUrls(layout);
    const oldUrls = new Set(prev ? extractMediaUrls(prev) : []);
    const added = newUrls.filter(u => !oldUrls.has(u));
    if (added.length > 0) prefetchToCache(added);
    return added;
}

export async function removeCachedLayout(id: string): Promise<void> {
    try { await idbDelete(STORE_LAYOUTS, id); } catch (_e) {}
}

/**
 * Bootstrap sincronizado: descarga manifest + todos los medios.
 * Idempotente. Si ya hay caché reciente (<10 min), sólo hace delta.
 */
export async function bootstrapSync(opts: { force?: boolean } = {}): Promise<{ layouts: number; media: number; deltaMs: number; fromCache: boolean }> {
    const t0 = Date.now();
    const lastTs = await lastSyncTimestamp();
    const shouldFull = opts.force || !lastTs || (Date.now() - lastTs) > 10 * 60 * 1000;

    setStatus({ state: 'bootstrapping', total: 0, done: 0, currentAction: 'Consultando servidor…' });

    try {
        if (shouldFull) {
            const r = await fetch('/api/sync/manifest', { cache: 'no-cache' });
            if (!r.ok) throw new Error('manifest fetch failed: ' + r.status);
            const manifest = await r.json();
            const layouts: LayoutJSON[] = manifest.layouts || [];
            const mediaUrls: string[] = manifest.mediaUrls || [];

            setStatus({ total: layouts.length + mediaUrls.length, done: 0, currentAction: 'Guardando interfaces…' });

            // Save layouts en IDB
            for (let i = 0; i < layouts.length; i++) {
                await idbPut(STORE_LAYOUTS, layouts[i]);
                if (i % 5 === 0) setStatus({ done: i + 1, currentAction: `Interface ${i + 1}/${layouts.length}` });
            }

            // Pre-cachear medios via SW (batches para no bombardear)
            setStatus({ done: layouts.length, currentAction: `Pre-cargando medios (0/${mediaUrls.length})…` });
            let mediaDone = 0;
            const batchSize = 5;
            for (let i = 0; i < mediaUrls.length; i += batchSize) {
                const batch = mediaUrls.slice(i, i + batchSize);
                await prefetchBatch(batch);
                mediaDone += batch.length;
                setStatus({ done: layouts.length + mediaDone, currentAction: `Pre-cargando medios (${mediaDone}/${mediaUrls.length})…` });
            }

            await idbPut(STORE_META, manifest.serverTime, META_KEY_LAST_SYNC);
            setStatus({ state: 'ready', done: layouts.length + mediaUrls.length, lastSyncTs: manifest.serverTime, currentAction: undefined });
            return { layouts: layouts.length, media: mediaUrls.length, deltaMs: Date.now() - t0, fromCache: false };
        } else {
            // Delta sync — solo pedir cambios
            setStatus({ currentAction: 'Verificando cambios…' });
            const r = await fetch('/api/sync/since?ts=' + lastTs, { cache: 'no-cache' });
            if (!r.ok) throw new Error('delta fetch failed');
            const delta = await r.json();
            const changed: LayoutJSON[] = delta.layouts || [];
            for (const l of changed) await applyDelta(l);
            await idbPut(STORE_META, delta.serverTime, META_KEY_LAST_SYNC);
            setStatus({ state: 'ready', done: changed.length, lastSyncTs: delta.serverTime, currentAction: undefined });
            return { layouts: changed.length, media: 0, deltaMs: Date.now() - t0, fromCache: true };
        }
    } catch (e: any) {
        console.error('[syncEngine] bootstrapSync err:', e);
        setStatus({ state: 'error', error: e.message });
        // Fallback: si hay algo en IDB, continuar sin sync
        const cached = await getCachedLayouts();
        if (cached.length > 0) return { layouts: cached.length, media: 0, deltaMs: Date.now() - t0, fromCache: true };
        throw e;
    }
}

/**
 * Fuerza al SW a cachear una lista de URLs (esperando confirmación).
 */
async function prefetchBatch(urls: string[]): Promise<void> {
    if (!urls.length) return;
    // Vía Service Worker si está activo
    if (navigator.serviceWorker?.controller) {
        return new Promise((resolve) => {
            const timeout = setTimeout(() => resolve(), 30000); // 30s timeout safety
            const ch = new MessageChannel();
            ch.port1.onmessage = () => { clearTimeout(timeout); resolve(); };
            navigator.serviceWorker.controller!.postMessage({ type: 'PREFETCH_MEDIA', urls }, [ch.port2]);
        });
    }
    // Fallback: fetch directo, dejar que el browser cache lo maneje
    await Promise.all(urls.map(u => fetch(u, { cache: 'default' }).catch(() => null)));
}

/**
 * Prefetch fire-and-forget (no espera).
 */
function prefetchToCache(urls: string[]): void {
    prefetchBatch(urls).catch(() => {});
}

/**
 * Extrae todas las URLs de /uploads/ presentes en un layout.
 */
function extractMediaUrls(layout: any): string[] {
    const set = new Set<string>();
    const push = (u: any) => {
        if (typeof u !== 'string') return;
        const idx = u.indexOf('/uploads/');
        if (idx < 0) return;
        set.add(u.substring(idx));
    };
    push(layout?.backgroundImage);
    push(layout?.backgroundVideo);
    for (const w of (layout?.widgets || [])) {
        const d = w?.data || {};
        push(d.url); push(d.imageUrl); push(d.videoUrl); push(d.src); push(d.poster);
        if (Array.isArray(d.images)) d.images.forEach(push);
        if (Array.isArray(d.items)) d.items.forEach((it: any) => { push(it?.imageUrl); push(it?.iconUrl); push(it?.url); });
        if (Array.isArray(d.products)) d.products.forEach((p: any) => { push(p?.imageUrl); push(p?.photoUrl); });
    }
    return Array.from(set);
}
