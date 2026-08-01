'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Upload from 'lucide-react/dist/esm/icons/upload';
import Trash2 from 'lucide-react/dist/esm/icons/trash-2';
import Search from 'lucide-react/dist/esm/icons/search';
import ImageIcon from 'lucide-react/dist/esm/icons/image';
import Video from 'lucide-react/dist/esm/icons/video';
import Copy from 'lucide-react/dist/esm/icons/copy';
import Check from 'lucide-react/dist/esm/icons/check';
import FileWarning from 'lucide-react/dist/esm/icons/file-warning';
import Link2 from 'lucide-react/dist/esm/icons/link-2';
import ChevronLeft from 'lucide-react/dist/esm/icons/chevron-left';
import ChevronRight from 'lucide-react/dist/esm/icons/chevron-right';
import AlertTriangle from 'lucide-react/dist/esm/icons/alert-triangle';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import {
    listMedia, deleteMedia, uploadMedia, fetchUsage,
    sizeWarning, warnForFile, fmtBytes, fmtDate,
    MediaItem, UsageMap,
} from '@/lib/mediaHelpers';

type Filter = 'all' | 'image' | 'video';
const PAGE_SIZE = 48;

export interface MediaLibraryProps {
    onSelect?: (item: MediaItem) => void;
    lockType?: 'image' | 'video';
}

export const MediaLibrary: React.FC<MediaLibraryProps> = ({ onSelect, lockType }) => {
    const [items, setItems] = useState<MediaItem[]>([]);
    const [total, setTotal] = useState(0);
    const [totalPages, setTotalPages] = useState(1);
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<Filter>(lockType || 'all');
    const [q, setQ] = useState('');
    const [uploading, setUploading] = useState(false);
    const [pending, setPending] = useState<File | null>(null);
    const [copiedName, setCopiedName] = useState<string | null>(null);
    const [toDelete, setToDelete] = useState<MediaItem | null>(null);
    const [usage, setUsage] = useState<UsageMap>({});

    const refresh = useCallback(async () => {
        setLoading(true);
        try {
            const [pageData, usageData] = await Promise.all([
                listMedia({ page, pageSize: PAGE_SIZE, type: lockType || filter, q }),
                fetchUsage(),
            ]);
            setItems(pageData.items);
            setTotal(pageData.total);
            setTotalPages(pageData.totalPages);
            setUsage(usageData);
        } catch (e: any) {
            toast.error('No se pudo cargar la biblioteca', { description: e.message });
        } finally { setLoading(false); }
    }, [page, filter, q, lockType]);

    useEffect(() => { refresh(); }, [refresh]);

    // Debounce búsqueda
    useEffect(() => {
        const t = setTimeout(() => { if (page !== 1) setPage(1); }, 300);
        return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [q, filter]);

    const onPickFile = (e: React.ChangeEvent<HTMLInputElement>) => {
        const f = e.target.files?.[0];
        if (!f) return;
        setPending(f);
        e.target.value = '';
    };

    const confirmUpload = async () => {
        if (!pending) return;
        setUploading(true);
        try {
            const item = await uploadMedia(pending);
            toast.success('Archivo subido', { description: item.filename });
            setPending(null);
            setPage(1);
            await refresh();
        } catch (e: any) {
            toast.error('Falló el upload', { description: e.message });
        } finally { setUploading(false); }
    };

    const executeDelete = async () => {
        if (!toDelete) return;
        const it = toDelete;
        setToDelete(null);
        try {
            await deleteMedia(it.filename);
            toast.success('Eliminado', { description: it.filename });
            setItems((prev) => prev.filter((x) => x.filename !== it.filename));
            setUsage((prev) => { const next = { ...prev }; delete next[it.url]; return next; });
        } catch (e: any) {
            toast.error('No se pudo eliminar', { description: e.message });
        }
    };

    const handleCopy = async (item: MediaItem) => {
        const full = window.location.origin + item.url;
        try {
            await navigator.clipboard.writeText(full);
            setCopiedName(item.filename);
            setTimeout(() => setCopiedName((c) => (c === item.filename ? null : c)), 1500);
        } catch { toast.error('No se pudo copiar'); }
    };

    const stats = {
        imgs: 0, vids: 0, mb: 0,
    };
    items.forEach(i => { if (i.type === 'image') stats.imgs++; if (i.type === 'video') stats.vids++; stats.mb += i.size / 1024 / 1024; });

    return (
        <div className="w-full h-full flex flex-col min-h-0">
            {/* Top toolbar */}
            <div className="flex items-center gap-2 flex-wrap p-3 border-b bg-muted/30">
                <label className="inline-flex relative">
                    <Button variant="default" size="sm" className="gap-1.5 pointer-events-none">
                        <Upload className="size-3.5" /> Subir archivo
                    </Button>
                    <input type="file" accept="image/*,video/*" onChange={onPickFile} className="absolute inset-0 opacity-0 cursor-pointer" />
                </label>

                {!lockType && (
                    <div className="flex items-center gap-1 bg-background border rounded-md p-0.5 h-8">
                        {(['all', 'image', 'video'] as Filter[]).map((f) => (
                            <button key={f} onClick={() => setFilter(f)} className={'px-2.5 h-7 rounded text-[11px] font-bold uppercase tracking-wider ' + (filter === f ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground')}>
                                {f === 'all' ? 'Todo' : f === 'image' ? 'Imágenes' : 'Videos'}
                            </button>
                        ))}
                    </div>
                )}

                <div className="flex items-center gap-1.5 relative flex-1 min-w-[200px] max-w-xs">
                    <Search className="size-3.5 text-muted-foreground absolute left-2 pointer-events-none" />
                    <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar por nombre…" className="h-8 pl-7 text-[12px]" />
                </div>

                <div className="ml-auto text-[10px] text-muted-foreground font-mono">
                    {total} archivos · página {page}/{totalPages}
                </div>
            </div>

            {/* Pending upload */}
            <AnimatePresence>
                {pending && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="border-b overflow-hidden">
                        <PendingUploadCard file={pending} onCancel={() => setPending(null)} onConfirm={confirmUpload} uploading={uploading} />
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Grid */}
            <div className="flex-1 overflow-y-auto p-3">
                {loading ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                        {Array.from({ length: 12 }).map((_, i) => (<div key={i} className="aspect-video bg-muted animate-pulse rounded-md" />))}
                    </div>
                ) : items.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                        <ImageIcon className="size-8 mx-auto mb-2 opacity-40" />
                        <div className="text-[13px]">Sin archivos {q ? 'que coincidan' : 'todavía'}.</div>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                        {items.map((item) => (
                            <MediaCard
                                key={item.filename}
                                item={item}
                                usage={usage[item.url] || []}
                                onSelect={onSelect}
                                onPreview={(it) => window.open(it.url, '_blank', 'noopener,noreferrer')}
                                onDelete={setToDelete}
                                onCopy={handleCopy}
                                copied={copiedName === item.filename}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* Pagination bar */}
            {totalPages > 1 && (
                <div className="border-t p-2 flex items-center justify-center gap-2 bg-muted/20">
                    <Button variant="ghost" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1 || loading} className="gap-1"><ChevronLeft className="size-3.5" /> Anterior</Button>
                    <div className="flex items-center gap-1 text-[12px]">
                        {getPageNumbers(page, totalPages).map((n, i) => n === '…' ? (
                            <span key={i} className="px-2 text-muted-foreground">…</span>
                        ) : (
                            <button key={i} onClick={() => setPage(Number(n))} disabled={loading} className={'size-7 rounded text-[11px] font-bold ' + (n === page ? 'bg-primary text-primary-foreground' : 'hover:bg-muted')}>{n}</button>
                        ))}
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages || loading} className="gap-1">Siguiente <ChevronRight className="size-3.5" /></Button>
                </div>
            )}

            {/* Preview modal */}
            {preview && <PreviewModal item={preview} usage={usage[preview.url] || []} onClose={() => setPreview(null)} onCopy={handleCopy} copied={copiedName === preview.filename} onDelete={(it) => { setPreview(null); setToDelete(it); }} />}

            {/* Delete confirmation modal */}
            <AlertDialog open={!!toDelete} onOpenChange={(o) => { if (!o) setToDelete(null); }}>
                <AlertDialogContent className="max-w-md">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2">
                            <AlertTriangle className="size-5 text-amber-500" />
                            ¿Eliminar este archivo?
                        </AlertDialogTitle>
                        <div className="text-[13px] text-muted-foreground">
                            <div>
                                {toDelete && (
                                    <div className="space-y-3 mt-2">
                                        <div className="flex gap-3 items-center p-2 rounded border bg-muted/40">
                                            {toDelete.type === 'image' ? (
                                                <img src={toDelete.url} alt="" className="size-16 rounded object-cover shrink-0" />
                                            ) : (
                                                <div className="size-16 rounded bg-black/70 grid place-items-center shrink-0"><Video className="size-6 text-white/80" /></div>
                                            )}
                                            <div className="min-w-0 flex-1">
                                                <div className="text-[13px] font-mono truncate">{toDelete.filename}</div>
                                                <div className="text-[11px] text-muted-foreground">{fmtBytes(toDelete.size)}</div>
                                            </div>
                                        </div>
                                        {(usage[toDelete.url] || []).length > 0 ? (
                                            <div className="rounded-md border border-amber-500/40 bg-amber-500/5 p-2.5 text-[12px]">
                                                <div className="font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1.5 mb-1"><Link2 className="size-3.5" /> Está en uso en {usage[toDelete.url].length} interface{usage[toDelete.url].length > 1 ? 's' : ''}</div>
                                                <ul className="text-[11px] text-muted-foreground space-y-0.5 max-h-32 overflow-y-auto pl-4 list-disc">
                                                    {usage[toDelete.url].map((l) => <li key={l._id}>{l.name}</li>)}
                                                </ul>
                                                <div className="text-[11px] text-amber-600 dark:text-amber-400 mt-2">Al borrarlo, esas interfaces mostrarán espacios en blanco donde aparecía.</div>
                                            </div>
                                        ) : (
                                            <div className="rounded-md border border-emerald-500/40 bg-emerald-500/5 p-2.5 text-[12px] text-emerald-700 dark:text-emerald-400">
                                                ✓ No está asociado a ninguna interface. Se puede borrar sin romper nada.
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={executeDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Borrar de todas formas</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
};

function getPageNumbers(current: number, total: number): (number | '…')[] {
    if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
    if (current <= 4) return [1, 2, 3, 4, 5, '…', total];
    if (current >= total - 3) return [1, '…', total - 4, total - 3, total - 2, total - 1, total];
    return [1, '…', current - 1, current, current + 1, '…', total];
}

const PendingUploadCard: React.FC<{ file: File; uploading: boolean; onCancel: () => void; onConfirm: () => void }> = ({ file, uploading, onCancel, onConfirm }) => {
    const warn = warnForFile(file);
    const badgeBg = warn.level === 'good' ? 'bg-emerald-500/10 border-emerald-500/40' :
                    warn.level === 'ok'   ? 'bg-muted border' :
                    warn.level === 'warn' ? 'bg-amber-500/10 border-amber-500/40' :
                                            'bg-red-500/10 border-red-500/40';
    return (
        <div className={"flex items-center gap-3 p-3 border-b " + badgeBg}>
            <FileWarning className={"size-5 shrink-0 " + warn.color} />
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-[13px] truncate">{file.name}</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-background border">{fmtBytes(file.size)}</span>
                    <span className={"text-[10px] font-bold uppercase tracking-widest " + warn.color}>{warn.label}</span>
                </div>
                <div className="text-[11px] text-muted-foreground mt-0.5">{warn.hint}</div>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
                <Button variant="ghost" size="sm" onClick={onCancel} disabled={uploading}>Cancelar</Button>
                <Button size="sm" onClick={onConfirm} disabled={uploading} className="gap-1.5">
                    {uploading ? 'Subiendo…' : (<><Upload className="size-3.5" /> Confirmar subida</>)}
                </Button>
            </div>
        </div>
    );
};

const MediaCard: React.FC<{
    item: MediaItem;
    usage: Array<{ _id: string; name: string }>;
    onSelect?: (i: MediaItem) => void;
    onPreview?: (i: MediaItem) => void;
    onDelete: (i: MediaItem) => void;
    onCopy: (i: MediaItem) => void;
    copied: boolean;
}> = ({ item, usage, onSelect, onPreview, onDelete, onCopy, copied }) => {
    const warn = sizeWarning(item.size, item.type === 'video' ? 'video' : 'image');
    return (
        <motion.div layout initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="rounded-md border bg-card overflow-hidden group flex flex-col">
            {/* Preview */}
            <div className="aspect-video bg-black/60 relative overflow-hidden cursor-pointer" onClick={() => onPreview && !onSelect && onPreview(item)}>
                {item.type === 'image' ? (
                    <img src={item.url} alt={item.filename} loading="lazy" decoding="async" className="w-full h-full object-cover" />
                ) : item.type === 'video' ? (
                    <>
                        {/* Poster liviano: solo el primer frame via metadata (barato). Sin autoplay ni preload agresivo. */}
                        <video src={item.url} className="w-full h-full object-cover" muted playsInline preload="none" />
                        <div className="absolute inset-0 bg-black/40 grid place-items-center">
                            <Video className="size-8 text-white/90 drop-shadow-lg" />
                        </div>
                    </>
                ) : (
                    <div className="w-full h-full grid place-items-center text-muted-foreground text-[10px]">otro</div>
                )}
                {(warn.level === 'warn' || warn.level === 'bad') && (
                    <div className={"absolute top-1 left-1 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-widest " + (warn.level === 'bad' ? 'bg-red-500 text-white' : 'bg-amber-500 text-white')}>
                        {warn.label}
                    </div>
                )}
                <div className="absolute top-1 right-1 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase bg-black/70 text-white">{item.type}</div>
            </div>

            {/* Info */}
            <div className="p-2 flex-1 flex flex-col gap-1">
                <div className="text-[11px] font-mono truncate" title={item.filename}>{item.filename}</div>
                <div className="text-[10px] text-muted-foreground flex items-center gap-2 flex-wrap">
                    <span>{fmtBytes(item.size)}</span>
                    {item.width && item.height && (<><span>·</span><span>{item.width}×{item.height}</span></>)}
                    <span>·</span><span>{fmtDate(item.mtime)}</span>
                </div>
                {/* Usage badge */}
                {usage.length > 0 ? (
                    <div className="text-[10px] flex items-center gap-1 mt-0.5 text-primary" title={usage.map(l => l.name).join(', ')}>
                        <Link2 className="size-3" />
                        <span className="truncate">Usado en {usage.length} interface{usage.length > 1 ? 's' : ''}</span>
                    </div>
                ) : (
                    <div className="text-[10px] text-muted-foreground mt-0.5 opacity-70">Sin usar</div>
                )}
            </div>

            {/* Actions */}
            <div className="border-t p-1.5 flex items-center gap-1">
                {onSelect ? (
                    <Button size="sm" className="flex-1 h-7 text-[11px]" onClick={() => onSelect(item)}>Elegir</Button>
                ) : (
                    <Button variant="outline" size="sm" className="flex-1 h-7 text-[11px]" onClick={() => onPreview && onPreview(item)}>👁 Ver</Button>
                )}
                <Button variant="ghost" size="icon" className="size-7" onClick={() => onCopy(item)} title="Copiar URL">
                    {copied ? <Check className="size-3 text-emerald-500" /> : <Copy className="size-3" />}
                </Button>
                <Button variant="ghost" size="icon" className="size-7 text-destructive hover:bg-destructive/10" onClick={() => onDelete(item)} title="Borrar">
                    <Trash2 className="size-3" />
                </Button>
            </div>
        </motion.div>
    );
};


export default MediaLibrary;
