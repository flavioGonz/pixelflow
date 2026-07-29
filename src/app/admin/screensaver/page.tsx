'use client';

import React, { useEffect, useState } from 'react';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ImageUpload } from '@/components/builder/ImageUpload';
import { toast } from 'sonner';
import Moon from 'lucide-react/dist/esm/icons/moon';
import ImageIcon from 'lucide-react/dist/esm/icons/image';
import Video from 'lucide-react/dist/esm/icons/video';
import Trash2 from 'lucide-react/dist/esm/icons/trash-2';
import LayoutIcon from 'lucide-react/dist/esm/icons/layout';
import Clock from 'lucide-react/dist/esm/icons/clock';
import ListOrdered from 'lucide-react/dist/esm/icons/list-ordered';
import ChevronUp from 'lucide-react/dist/esm/icons/chevron-up';
import ChevronDown from 'lucide-react/dist/esm/icons/chevron-down';
import X from 'lucide-react/dist/esm/icons/x';

interface MediaItem { type: 'image' | 'video'; url: string; durationMs?: number }
interface ScreensaverConfig {
    enabled?: boolean;
    idleMs?: number;
    rotateMs?: number;
    layoutIds?: string[];
    layoutDurationsMs?: Record<string, number>;
    mediaItems?: MediaItem[];
}

export default function ScreensaverPage() {
    const [cfg, setCfg] = useState<ScreensaverConfig>({ enabled: false, idleMs: 30000, rotateMs: 10000, layoutIds: [], layoutDurationsMs: {}, mediaItems: [] });
    const [layouts, setLayouts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        Promise.all([
            fetch('/api/settings/screensaver').then((r) => r.json()).catch(() => ({})),
            fetch('/api/layouts').then((r) => r.json()).catch(() => []),
        ]).then(([cfgData, layoutsData]) => {
            setCfg({
                enabled: !!cfgData.enabled,
                idleMs: cfgData.idleMs || 30000,
                rotateMs: cfgData.rotateMs || 10000,
                layoutIds: cfgData.layoutIds || [],
                layoutDurationsMs: cfgData.layoutDurationsMs || {},
                mediaItems: cfgData.mediaItems || [],
            });
            setLayouts(Array.isArray(layoutsData) ? layoutsData : []);
            setLoading(false);
        });
    }, []);

    const patch = async (delta: Partial<ScreensaverConfig>) => {
        const merged = { ...cfg, ...delta };
        setCfg(merged);
        try {
            await fetch('/api/settings/screensaver', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(delta),
            });
        } catch (e: any) {
            toast.error('No se pudo guardar: ' + (e?.message || 'error'));
        }
    };

    // Layout is available (not in the ordered list yet)
    const availableLayouts = layouts.filter((l) => !(cfg.layoutIds || []).includes(l._id));
    const orderedLayouts = (cfg.layoutIds || []).map((id) => layouts.find((l) => l._id === id)).filter(Boolean);

    const addLayout = (id: string) => {
        const next = [...(cfg.layoutIds || []), id];
        patch({ layoutIds: next });
    };
    const removeLayout = (id: string) => {
        const next = (cfg.layoutIds || []).filter((x) => x !== id);
        const { [id]: _removed, ...restDur } = (cfg.layoutDurationsMs || {}) as any;
        patch({ layoutIds: next, layoutDurationsMs: restDur });
    };
    const moveLayout = (id: string, dir: -1 | 1) => {
        const list = [...(cfg.layoutIds || [])];
        const i = list.indexOf(id);
        const j = i + dir;
        if (i < 0 || j < 0 || j >= list.length) return;
        [list[i], list[j]] = [list[j], list[i]];
        patch({ layoutIds: list });
    };
    const setLayoutDurationSec = (id: string, seconds: number) => {
        const ms = Math.max(2, Math.min(300, seconds || 0)) * 1000;
        const next = { ...(cfg.layoutDurationsMs || {}), [id]: ms };
        patch({ layoutDurationsMs: next });
    };
    const clearLayoutDuration = (id: string) => {
        const { [id]: _removed, ...rest } = (cfg.layoutDurationsMs || {}) as any;
        patch({ layoutDurationsMs: rest });
    };

    const addMedia = (type: 'image' | 'video', url: string) => {
        const items = [...(cfg.mediaItems || []), { type, url, durationMs: 8000 }];
        patch({ mediaItems: items });
        toast.success(type === 'image' ? 'Foto agregada' : 'Video agregado');
    };
    const removeMedia = (i: number) => {
        const items = (cfg.mediaItems || []).filter((_, idx) => idx !== i);
        patch({ mediaItems: items });
    };

    if (loading) return <div className="flex-1 grid place-items-center text-muted-foreground text-sm">Cargando…</div>;

    const globalRotateSec = Math.round((cfg.rotateMs || 10000) / 1000);

    return (
        <div className="flex-1 flex flex-col min-h-0 bg-background text-foreground">
            <AdminHeader
                title="Screensaver"
                subtitle="Rotación global cuando ningún tótem está siendo tocado"
                icon={<Moon size={20} strokeWidth={1.75} />}
            />

            <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {/* Master toggle + timings */}
                <div className="rounded-lg border bg-card p-5 flex items-start gap-4">
                    <div className="size-12 rounded-lg bg-primary/10 grid place-items-center text-primary shrink-0">
                        <Moon className="size-5" />
                    </div>
                    <div className="flex-1 space-y-3">
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <div className="text-sm font-bold">Screensaver universal</div>
                                <p className="text-[11px] text-muted-foreground max-w-xl mt-0.5">Se aplica a TODAS las pantallas por igual. Cuando ningún tótem recibe interacciones por el tiempo indicado, entra en modo screensaver rotando entre las interfaces y medias que elijas. Cualquier toque lo cancela.</p>
                            </div>
                            <Switch checked={!!cfg.enabled} onCheckedChange={(v) => patch({ enabled: v })} />
                        </div>
                        <div className="grid grid-cols-2 gap-3 pt-2">
                            <div>
                                <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1"><Clock className="size-3" /> Idle (seg)</Label>
                                <Input type="number" min={5} max={3600} value={Math.round((cfg.idleMs || 30000) / 1000)} onChange={(e) => patch({ idleMs: Math.max(5000, (parseInt(e.target.value) || 30) * 1000) })} className="h-9 mt-1 font-mono text-sm" />
                                <p className="text-[10px] text-muted-foreground mt-1">Segundos sin toque para entrar en screensaver</p>
                            </div>
                            <div>
                                <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1"><Clock className="size-3" /> Rotación default (seg)</Label>
                                <Input type="number" min={3} max={120} value={globalRotateSec} onChange={(e) => patch({ rotateMs: Math.max(3000, (parseInt(e.target.value) || 10) * 1000) })} className="h-9 mt-1 font-mono text-sm" />
                                <p className="text-[10px] text-muted-foreground mt-1">Se usa cuando un item no tiene duración propia</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 3 columns: Available | Ordered | Media */}
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
                    {/* Column 1 · Available layouts */}
                    <div className="rounded-lg border bg-card overflow-hidden flex flex-col">
                        <div className="flex items-center gap-2 px-4 py-3 border-b bg-gradient-to-br from-sky-500/[0.05] to-transparent">
                            <div className="size-8 rounded-md bg-sky-500/10 grid place-items-center text-sky-500"><LayoutIcon className="size-4" /></div>
                            <div>
                                <h3 className="text-[13px] font-bold leading-none">Interfaces disponibles</h3>
                                <p className="text-[10px] text-muted-foreground mt-0.5">Click para agregar al orden →</p>
                            </div>
                            <span className="ml-auto text-[10px] font-mono text-muted-foreground">{availableLayouts.length}</span>
                        </div>
                        <div className="p-3 space-y-1 max-h-[500px] overflow-y-auto custom-scrollbar">
                            {availableLayouts.length === 0 && (
                                <p className="text-[12px] text-muted-foreground px-2 py-6 text-center italic">Todas las interfaces están en el orden. Sacá alguna →</p>
                            )}
                            {availableLayouts.map((l) => (
                                <button
                                    key={l._id}
                                    onClick={() => addLayout(l._id)}
                                    className="flex items-center gap-3 px-2.5 py-2 rounded-md w-full text-left transition-colors hover:bg-accent group"
                                >
                                    <span className="size-6 rounded-md bg-muted grid place-items-center text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-colors text-[14px] font-bold">+</span>
                                    <span className="text-[13px] font-medium flex-1 truncate">{l.name}</span>
                                    <span className="text-[10px] text-muted-foreground font-mono">{l.orientation === 'portrait' ? 'V' : 'H'} · {l.widgets?.length || 0}w</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Column 2 · Ordered rotation */}
                    <div className="rounded-lg border bg-card overflow-hidden flex flex-col">
                        <div className="flex items-center gap-2 px-4 py-3 border-b bg-gradient-to-br from-primary/[0.06] to-transparent">
                            <div className="size-8 rounded-md bg-primary/10 grid place-items-center text-primary"><ListOrdered className="size-4" /></div>
                            <div>
                                <h3 className="text-[13px] font-bold leading-none">Orden de rotación</h3>
                                <p className="text-[10px] text-muted-foreground mt-0.5">Reordená ↑ ↓ · duración por item</p>
                            </div>
                            <span className="ml-auto text-[10px] font-mono text-primary font-bold">{orderedLayouts.length}</span>
                        </div>
                        <div className="p-3 space-y-2 max-h-[500px] overflow-y-auto custom-scrollbar">
                            {orderedLayouts.length === 0 && (
                                <p className="text-[12px] text-muted-foreground px-2 py-6 text-center italic">Aún no hay interfaces en el orden. Sumalas desde la izquierda.</p>
                            )}
                            {orderedLayouts.map((l, idx) => {
                                const durMs = (cfg.layoutDurationsMs || {})[l._id];
                                const durSec = durMs ? Math.round(durMs / 1000) : 0; // 0 = usar default global
                                return (
                                    <div key={l._id} className="rounded-md border bg-background p-2 space-y-2">
                                        <div className="flex items-center gap-2">
                                            <span className="size-6 rounded-full bg-primary/10 text-primary text-[10px] font-bold grid place-items-center shrink-0">{idx + 1}</span>
                                            <span className="text-[13px] font-medium flex-1 truncate">{l.name}</span>
                                            <div className="flex items-center gap-0.5">
                                                <button onClick={() => moveLayout(l._id, -1)} disabled={idx === 0} className="size-7 rounded-md hover:bg-accent text-muted-foreground disabled:opacity-30 disabled:cursor-not-allowed grid place-items-center"><ChevronUp className="size-3.5" /></button>
                                                <button onClick={() => moveLayout(l._id, 1)} disabled={idx === orderedLayouts.length - 1} className="size-7 rounded-md hover:bg-accent text-muted-foreground disabled:opacity-30 disabled:cursor-not-allowed grid place-items-center"><ChevronDown className="size-3.5" /></button>
                                                <button onClick={() => removeLayout(l._id)} className="size-7 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive grid place-items-center" title="Sacar del orden"><X className="size-3.5" /></button>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 pl-8">
                                            <Clock className="size-3 text-muted-foreground shrink-0" />
                                            <Input
                                                type="number"
                                                min={0}
                                                max={300}
                                                value={durSec}
                                                placeholder={String(globalRotateSec)}
                                                onChange={(e) => {
                                                    const v = parseInt(e.target.value) || 0;
                                                    if (v <= 0) clearLayoutDuration(l._id);
                                                    else setLayoutDurationSec(l._id, v);
                                                }}
                                                className="h-7 w-20 text-xs font-mono"
                                            />
                                            <span className="text-[10px] text-muted-foreground">seg · {durMs ? 'personalizado' : `usa default (${globalRotateSec}s)`}</span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Column 3 · Media */}
                    <div className="rounded-lg border bg-card overflow-hidden flex flex-col">
                        <div className="flex items-center gap-2 px-4 py-3 border-b bg-gradient-to-br from-violet-500/[0.05] to-transparent">
                            <div className="size-8 rounded-md bg-violet-500/10 grid place-items-center text-violet-500"><ImageIcon className="size-4" /></div>
                            <div>
                                <h3 className="text-[13px] font-bold leading-none">Fotos y videos slide</h3>
                                <p className="text-[10px] text-muted-foreground mt-0.5">Se rotan junto con las interfaces</p>
                            </div>
                            <span className="ml-auto text-[10px] font-mono text-muted-foreground">{(cfg.mediaItems || []).length} items</span>
                        </div>
                        <div className="p-4 space-y-3">
                            <div className="grid grid-cols-2 gap-2">
                                <ImageUpload label="Subir foto" onUploadSuccess={(url) => addMedia('image', url)} />
                                <ImageUpload label="Subir video" onUploadSuccess={(url) => addMedia('video', url)} />
                            </div>
                            <div className="grid grid-cols-3 gap-2 max-h-[350px] overflow-y-auto custom-scrollbar">
                                {(cfg.mediaItems || []).length === 0 && (
                                    <p className="col-span-3 text-[12px] text-muted-foreground px-2 py-6 text-center italic">Sin media aún. Subí fotos o videos.</p>
                                )}
                                {(cfg.mediaItems || []).map((m, i) => (
                                    <div key={i} className="relative aspect-square rounded-md overflow-hidden border bg-black/20 group">
                                        {m.type === 'video' ? (
                                            <video src={m.url} className="w-full h-full object-cover" muted loop />
                                        ) : (
                                            <img src={m.url} className="w-full h-full object-cover" alt="" />
                                        )}
                                        <span className="absolute top-1 left-1 text-[9px] font-bold px-1.5 py-0.5 rounded bg-black/60 text-white flex items-center gap-1">
                                            {m.type === 'video' ? <Video className="size-2.5" /> : <ImageIcon className="size-2.5" />}
                                            {m.type === 'video' ? 'VIDEO' : 'FOTO'}
                                        </span>
                                        <button
                                            onClick={() => removeMedia(i)}
                                            className="absolute -top-1.5 -right-1.5 size-6 rounded-full bg-destructive text-destructive-foreground opacity-0 group-hover:opacity-100 transition-opacity grid place-items-center"
                                            title="Eliminar"
                                        >
                                            <Trash2 className="size-3" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="rounded-md border border-primary/20 bg-primary/5 p-3 text-[11px] text-muted-foreground">
                    <strong className="text-foreground">Cómo funciona:</strong> el player rota entre <strong className="text-foreground">{(cfg.layoutIds || []).length + (cfg.mediaItems || []).length}</strong> elementos en el orden de la columna del medio. Cada interface puede tener su propia duración (0 = usa default <span className="font-mono text-primary">{globalRotateSec}s</span>). Se activa después de <span className="font-mono text-primary">{Math.round((cfg.idleMs || 30000) / 1000)}s</span> sin interacción. Cualquier toque restaura la interface activa.
                </div>
            </div>
        </div>
    );
}
