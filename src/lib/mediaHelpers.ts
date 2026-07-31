/**
 * PixelFlow — utilidades de media (tamaños, warnings, helpers).
 */

export type MediaItem = {
    filename: string;
    url: string;
    size: number;
    mtime: number;
    type: 'image' | 'video' | 'other';
    width?: number;
    height?: number;
};

export type MediaPage = {
    items: MediaItem[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
};

export type UsageMap = Record<string, Array<{ _id: string; name: string }>>;

export type SizeWarning = {
    level: 'ok' | 'good' | 'warn' | 'bad';
    label: string;
    hint: string;
    color: string;
};

export function fmtBytes(bytes: number): string {
    if (!bytes || bytes < 0) return '—';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(0) + ' KB';
    if (bytes < 1024 * 1024 * 1024) return (bytes / 1024 / 1024).toFixed(1) + ' MB';
    return (bytes / 1024 / 1024 / 1024).toFixed(2) + ' GB';
}

export function fmtDate(ts: number): string {
    try {
        const d = new Date(ts);
        return d.toLocaleDateString('es-UY', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch { return ''; }
}

export function sizeWarning(sizeBytes: number, type: 'image' | 'video'): SizeWarning {
    const mb = sizeBytes / 1024 / 1024;
    if (type === 'image') {
        if (mb < 0.5) return { level: 'good', label: 'Óptimo',        hint: 'Peso ideal — carga instantánea.',                                     color: 'text-emerald-500' };
        if (mb < 2)   return { level: 'ok',   label: 'OK',            hint: 'Peso aceptable.',                                                       color: 'text-muted-foreground' };
        if (mb < 5)   return { level: 'warn', label: 'Pesado',        hint: 'Recomendado <2MB para carga fluida. Considerá bajar tamaño/calidad.',   color: 'text-amber-500' };
        return             { level: 'bad',  label: 'Muy pesado',    hint: '>5MB puede trabar players lentos. Usá 1920px lado mayor, JPEG 80-85%.',  color: 'text-red-500' };
    }
    if (mb < 5)  return { level: 'good', label: 'Óptimo',        hint: 'Peso ideal para bucle en kiosko.',                                        color: 'text-emerald-500' };
    if (mb < 20) return { level: 'ok',   label: 'OK',            hint: 'Peso aceptable para background.',                                          color: 'text-muted-foreground' };
    if (mb < 50) return { level: 'warn', label: 'Pesado',        hint: 'Recomendado <20MB. 1920x1080 H.264 CRF 24 ~2.5Mbps.',                       color: 'text-amber-500' };
    return           { level: 'bad',  label: 'Muy pesado',    hint: '>50MB tranca players y consume banda. Comprimí a 1080p H.264 <20MB antes de subir.', color: 'text-red-500' };
}

export function warnForFile(file: File): SizeWarning {
    const type: 'image' | 'video' = file.type.startsWith('video/') ? 'video' : 'image';
    return sizeWarning(file.size, type);
}

/** Lista paginada del server. */
export async function listMedia(params: { page?: number; pageSize?: number; type?: 'all' | 'image' | 'video'; q?: string } = {}): Promise<MediaPage> {
    const qs = new URLSearchParams();
    if (params.page)     qs.set('page', String(params.page));
    if (params.pageSize) qs.set('pageSize', String(params.pageSize));
    if (params.type)     qs.set('type', params.type);
    if (params.q)        qs.set('q', params.q);
    const r = await fetch('/api/uploads?' + qs.toString(), { cache: 'no-cache' });
    if (!r.ok) throw new Error('list failed');
    const data = await r.json();
    // Retrocompat: si el server viejo devolvía array
    if (Array.isArray(data)) {
        return { items: data, total: data.length, page: 1, pageSize: data.length, totalPages: 1 };
    }
    return data as MediaPage;
}

/** Mapa de uso: url → layouts que la usan. */
export async function fetchUsage(): Promise<UsageMap> {
    try {
        const r = await fetch('/api/uploads/usage', { cache: 'no-cache' });
        if (!r.ok) return {};
        return r.json();
    } catch { return {}; }
}

export async function deleteMedia(filename: string): Promise<void> {
    const r = await fetch('/api/uploads/' + encodeURIComponent(filename), { method: 'DELETE' });
    if (!r.ok) throw new Error('delete failed');
}

export async function uploadMedia(file: File): Promise<MediaItem> {
    const fd = new FormData();
    fd.append('image', file);
    const r = await fetch('/api/upload', { method: 'POST', body: fd });
    if (!r.ok) throw new Error('upload failed');
    const meta = await r.json();
    return {
        filename: meta.filename,
        url: meta.url,
        size: meta.size,
        mtime: Date.now(),
        type: (meta.mimeType || '').startsWith('video/') ? 'video' : 'image',
        width: meta.width,
        height: meta.height,
    };
}
