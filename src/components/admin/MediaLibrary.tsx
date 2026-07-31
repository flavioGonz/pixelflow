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
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { listMedia, deleteMedia, uploadMedia, sizeWarning, warnForFile, fmtBytes, fmtDate, MediaItem } from '@/lib/mediaHelpers';

type Filter = 'all' | 'image' | 'video';

export interface MediaLibraryProps {
    /** Si presente, cada card tiene un botón "Elegir" que llama a este callback. */
    onSelect?: (item: MediaItem) => void;
    /** Filtro forzado por tipo (útil en picker). */
    lockType?: 'image' | 'video';
}

export const MediaLibrary: React.FC<MediaLibraryProps> = ({ onSelect, lockType }) => {
    const [items, setItems] = useState<MediaItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<Filter>(lockType || 'all');
    const [q, setQ] = useState('');
    const [uploading, setUploading] = useState(false);
    const [pending, setPending] = useState<File | null>(null);
    const [copiedName, setCopiedName] = useState<string | null>(null);

    const refresh = useCallback(async () => {
        setLoading(true);
        try {
            const list = await listMedia();
            setItems(list);
        } catch (e: any) {
            toast.error('No se pudo cargar la biblioteca', { description: e.message });
        } finally { setLoading(false); }
    }, []);

    useEffect(() => { refresh(); }, [refresh]);

    const onPickFile = (e: React.ChangeEvent<HTMLInputElement>) => {
        const f = e.target.files?.[0];
        if (!f) return;
        setPending(f);
        e.target.value = ''; // reset so same file re-triggers if user vuelve a elegir
    };

    const confirmUpload = async () => {
        if (!pending) return;
        setUploading(true);
        try {
            const item = await uploadMedia(pending);
            toast.success('Archivo subido', { description: item.filename });
            setPending(null);
            await refresh();
        } catch (e: any) {
            toast.error('Falló el upload', { description: e.message });
        } finally { setUploading(false); }
    };

    const handleDelete = async (item: MediaItem) => {
        if (!confirm(`¿Eliminar ${item.filename}? Esta acción es permanente.`)) return;
        try {
            await deleteMedia(item.filename);
            toast.success('Eliminado', { description: item.filename });
            setItems((prev) => prev.filter((x) => x.filename !== item.filename));
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
        } catch {
            toast.error('No se pudo copiar');
        }
    };

    const displayed = items.filter((it) => {
        if (lockType && it.type !== lockType) return false;
        if (filter !== 'all' && it.type !== filter) return false;
        if (q && !it.filename.toLowerCase().includes(q.toLowerCase())) return false;
        return true;
    });

    const totalMB = items.reduce((a, x) => a + x.size, 0) / 1024 / 1024;
    const imgs = items.filter(i => i.type === 'image').length;
    const vids = items.filter(i => i.type === 'video').length;

    return (
        <div className="w-full h-full flex flex-col min-h-0">
            {/* Top toolbar */}
            <div className="flex items-center gap-2 flex-wrap p-3 border-b bg-muted/30">
                <label className="inline-flex">
                    <Button variant="default" size="sm" className="gap-1.5 pointer-events-none">
                        <Upload className="size-3.5" /> Subir archivo
                    </Button>
                    <input type="file" accept="image/*,video/*" onChange={onPickFile} className="absolute w-px h-px opacity-0" />
                </label>

                {!lockType && (
                    <div className="flex items-center gap-1 bg-background border rounded-md p-0.5 h-8">
                        {(['all', 'image', 'video'] as Filter[]).map((f) => (
                            <button
                                key={f}
                                onClick={() => setFilter(f)}
                                className={'px-2.5 h-7 rounded text-[11px] font-bold uppercase tracking-wider ' + (filter === f ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground')}
                            >
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
                    {imgs} img · {vids} vid · {totalMB.toFixed(0)} MB
                </div>
            </div>

            {/* Pending file (warning + confirm) */}
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
                ) : displayed.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                        <ImageIcon className="size-8 mx-auto mb-2 opacity-40" />
                        <div className="text-[13px]">Sin archivos {q ? 'que coincidan' : 'todavía'}.</div>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                        {displayed.map((item) => (
                            <MediaCard
                                key={item.filename}
                                item={item}
                                onSelect={onSelect}
                                onDelete={handleDelete}
                                onCopy={handleCopy}
                                copied={copiedName === item.filename}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

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

const MediaCard: React.FC<{ item: MediaItem; onSelect?: (i: MediaItem) => void; onDelete: (i: MediaItem) => void; onCopy: (i: MediaItem) => void; copied: boolean }> = ({ item, onSelect, onDelete, onCopy, copied }) => {
    const warn = sizeWarning(item.size, item.type === 'video' ? 'video' : 'image');
    return (
        <motion.div layout initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="rounded-md border bg-card overflow-hidden group flex flex-col">
            {/* Preview */}
            <div className="aspect-video bg-black/60 relative overflow-hidden">
                {item.type === 'image' ? (
                    <img src={item.url} alt={item.filename} loading="lazy" className="w-full h-full object-cover" />
                ) : item.type === 'video' ? (
                    <>
                        <video src={item.url} className="w-full h-full object-cover" muted playsInline preload="metadata" />
                        <div className="absolute inset-0 bg-black/30 grid place-items-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <Video className="size-8 text-white/90 drop-shadow-lg" />
                        </div>
                    </>
                ) : (
                    <div className="w-full h-full grid place-items-center text-muted-foreground text-[10px]">otro</div>
                )}
                {/* Warning badge */}
                {(warn.level === 'warn' || warn.level === 'bad') && (
                    <div className={"absolute top-1 left-1 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-widest " + (warn.level === 'bad' ? 'bg-red-500 text-white' : 'bg-amber-500 text-white')}>
                        {warn.label}
                    </div>
                )}
                {/* Type badge */}
                <div className="absolute top-1 right-1 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase bg-black/70 text-white">
                    {item.type}
                </div>
            </div>

            {/* Info */}
            <div className="p-2 flex-1 flex flex-col gap-1">
                <div className="text-[11px] font-mono truncate" title={item.filename}>{item.filename}</div>
                <div className="text-[10px] text-muted-foreground flex items-center gap-2 flex-wrap">
                    <span>{fmtBytes(item.size)}</span>
                    {item.width && item.height && (<><span>·</span><span>{item.width}×{item.height}</span></>)}
                    <span>·</span><span>{fmtDate(item.mtime)}</span>
                </div>
            </div>

            {/* Actions */}
            <div className="border-t p-1.5 flex items-center gap-1">
                {onSelect && (
                    <Button size="sm" className="flex-1 h-7 text-[11px]" onClick={() => onSelect(item)}>Elegir</Button>
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
