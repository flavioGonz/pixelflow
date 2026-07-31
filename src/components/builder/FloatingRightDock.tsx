'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import Monitor from 'lucide-react/dist/esm/icons/monitor';
import Smartphone from 'lucide-react/dist/esm/icons/smartphone';
import Settings2 from 'lucide-react/dist/esm/icons/settings-2';
import LayoutIcon from 'lucide-react/dist/esm/icons/layout';
import Eye from 'lucide-react/dist/esm/icons/eye';
import Zap from 'lucide-react/dist/esm/icons/zap';
import Save from 'lucide-react/dist/esm/icons/save';
import Link2 from 'lucide-react/dist/esm/icons/link-2';
import QrCode from 'lucide-react/dist/esm/icons/qr-code';
import Search from 'lucide-react/dist/esm/icons/search';
import RotateCcw from 'lucide-react/dist/esm/icons/rotate-ccw';
import RotateCw from 'lucide-react/dist/esm/icons/rotate-cw';

interface Screen { screenId: string; name?: string; lastSeen?: string; viewport?: { width: number; height: number } }
interface LayoutItem { _id: string; name: string }

interface FloatingRightDockProps {
    orientation: 'landscape' | 'portrait';
    onOrientationChange: (o: 'landscape' | 'portrait') => void;
    resolution: { width: number; height: number };
    onResolutionChange: (r: { width: number; height: number }) => void;
    selectedWidgetCount: number;
    totalWidgets: number;
    onOpenProperties: () => void;
    // ---- Top-bar controls (merged) ----
    layouts: LayoutItem[];
    activeLayoutId: string;
    onLayoutChange: (id: string) => void;
    layoutName: string;
    screens: Screen[];
    screenId: string;
    editingLayoutId?: string | null;
    onScreenChange: (id: string) => void;
    onPreview: () => void;
    onPublish: () => void;
    onSave?: () => void;
    isDirty?: boolean;
    lastSavedAt?: number | null;
    onCopyUrl: () => void;
    onUndo: () => void;
    onRedo: () => void;
    isEditing: boolean;
}

const PRESETS_LANDSCAPE = [
    { label: 'HD',        w: 1280, h: 720 },
    { label: 'Full HD',   w: 1920, h: 1080 },
    { label: 'QHD',       w: 2560, h: 1440 },
    { label: '4K UHD',    w: 3840, h: 2160 },
    { label: 'Ultra-wide',w: 3440, h: 1440 },
];

const PRESETS_PORTRAIT = [
    { label: 'Estándar hotel', w: 864,  h: 1528 },
    { label: 'HD',        w: 720,  h: 1280 },
    { label: 'Full HD',   w: 1080, h: 1920 },
    { label: 'QHD',       w: 1440, h: 2560 },
    { label: '4K UHD',    w: 2160, h: 3840 },
];

export const FloatingRightDock: React.FC<FloatingRightDockProps> = ({
    orientation,
    onOrientationChange,
    resolution,
    onResolutionChange,
    selectedWidgetCount,
    totalWidgets,
    onOpenProperties,
    layouts,
    activeLayoutId,
    onLayoutChange,
    layoutName,
    screens,
    screenId,
    editingLayoutId,
    onScreenChange,
    onPreview,
    onPublish,
    onSave,
    isDirty,
    lastSavedAt,
    onCopyUrl,
    onUndo,
    onRedo,
    isEditing,
}) => {
    const [layoutSearch, setLayoutSearch] = React.useState('');
    const [screenSearch, setScreenSearch] = React.useState('');
    const [screenLimit, setScreenLimit] = React.useState(8);
    const [showAllScreens, setShowAllScreens] = React.useState(false);
    const [qrOpen, setQrOpen] = React.useState(false);
    const [customW, setCustomW] = React.useState(String(resolution.width));
    const [customH, setCustomH] = React.useState(String(resolution.height));

    React.useEffect(() => {
        // resetScreenLimit when search changes
        setScreenLimit(screenSearch ? 999 : 8);
    }, [screenSearch]);
    React.useEffect(() => {
        setCustomW(String(resolution.width));
        setCustomH(String(resolution.height));
    }, [resolution.width, resolution.height]);

    const applyCustom = () => {
        const w = parseInt(customW) || resolution.width;
        const h = parseInt(customH) || resolution.height;
        onResolutionChange({ width: w, height: h });
    };

    const [qrMode, setQrMode] = React.useState<'player' | 'preview'>('player');
    const selectedScreen = screens.find((s) => s.screenId === screenId);
    const isOnline = !!(selectedScreen?.lastSeen && (Date.now() - new Date(selectedScreen.lastSeen).getTime() < 15000));

    return (
        <TooltipProvider>
            <div
                className="fixed right-3 top-1/2 -translate-y-1/2 z-30 flex flex-col items-stretch gap-1 p-1.5 rounded-lg border bg-popover text-popover-foreground shadow-lg backdrop-blur-xl max-h-[min(92vh,720px)]"
                style={{ background: 'color-mix(in srgb, var(--popover) 92%, transparent)' }}
            >
                {/* Layout selector */}
                <Popover>
                    <PopoverTrigger
                        aria-label="Diseno activo"
                        title={'Diseno: ' + (layoutName || 'Sin nombre')}
                        className="size-9 grid place-items-center rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                    >
                        <LayoutIcon className="size-4" />
                    </PopoverTrigger>
                    <PopoverContent side="left" align="start" className="w-72 p-2 max-h-[420px] overflow-hidden flex flex-col">
                        <div className="flex items-center justify-between px-1 pb-1.5">
                            <Label className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground flex items-center gap-1.5">
                                <LayoutIcon className="size-3" /> Interfaces
                            </Label>
                            <span className="text-[10px] text-muted-foreground font-mono">{layouts.length}</span>
                        </div>
                        <input
                            type="text"
                            placeholder="Buscar interface..."
                            value={layoutSearch}
                            onChange={(e) => setLayoutSearch(e.target.value)}
                            className="w-full h-8 rounded-md border bg-background px-2.5 text-[12px] mb-1.5 focus:outline-none focus:ring-2 focus:ring-primary/40"
                            autoFocus
                        />
                        {layouts.length === 0 && (
                            <div className="text-[11px] text-muted-foreground px-2 py-3 text-center">Aún no hay interfaces creadas</div>
                        )}
                        <div className="flex flex-col gap-0.5 overflow-y-auto custom-scrollbar flex-1 min-h-0">
                            {layouts
                                .filter(l => !layoutSearch || l.name.toLowerCase().includes(layoutSearch.toLowerCase()))
                                .map((l) => {
                                    const active = l._id === activeLayoutId;
                                    return (
                                        <button
                                            key={l._id}
                                            onClick={() => { onLayoutChange(l._id); setLayoutSearch(''); }}
                                            className={'text-left px-2.5 py-1.5 rounded-md text-[12px] transition-colors truncate ' + (
                                                active ? 'bg-primary text-primary-foreground font-semibold' : 'hover:bg-accent text-foreground'
                                            )}
                                        >
                                            {l.name}
                                        </button>
                                    );
                                })
                            }
                            {layouts.length > 0 && layouts.filter(l => !layoutSearch || l.name.toLowerCase().includes(layoutSearch.toLowerCase())).length === 0 && (
                                <div className="text-[11px] text-muted-foreground px-2 py-3 text-center italic">Sin coincidencias con "{layoutSearch}"</div>
                            )}
                        </div>
                    </PopoverContent>
                </Popover>

                {/* Screen selector */}
                <Popover>
                    <PopoverTrigger
                        aria-label="Monitor destino"
                        title={'Monitor: ' + (selectedScreen?.name || screenId)}
                        className="size-9 grid place-items-center rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors relative"
                    >
                        <Smartphone className="size-4" />
                        <span
                            className="absolute bottom-1 right-1 size-1.5 rounded-full"
                            style={{ background: isOnline ? '#10b981' : '#ef4444', boxShadow: isOnline ? '0 0 6px #10b981aa' : 'none' }}
                        />
                    </PopoverTrigger>
                    <PopoverContent side="left" align="start" className="w-80 p-2">
                        <div className="flex items-center justify-between px-1 pb-1.5">
                            <div className="flex items-center gap-2">
                                <Label className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
                                    Pantallas
                                </Label>
                                <button
                                    onClick={() => setShowAllScreens(v => !v)}
                                    className={'text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded transition-colors ' + (showAllScreens ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:text-foreground')}
                                    title={showAllScreens ? 'Mostrar solo online' : 'Ver también offline'}
                                >
                                    {showAllScreens ? 'Todas' : 'Solo online'}
                                </button>
                            </div>
                            <span className="text-[10px] text-muted-foreground">{(() => { const n = Date.now(); const online = screens.filter(x => x.lastSeen && n - new Date(x.lastSeen).getTime() < 15000).length; return online + ' online · ' + screens.length + ' totales'; })()}</span>
                        </div>

                        <div className="relative mb-2">
                            <Search className="absolute left-2 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none" />
                            <Input
                                autoFocus
                                value={screenSearch}
                                onChange={(e) => setScreenSearch(e.target.value)}
                                placeholder="Buscar por nombre o ID..."
                                className="h-8 pl-7 text-[12px]"
                            />
                        </div>

                        <div className="flex flex-col gap-0.5 max-h-[50vh] overflow-y-auto">
                            {(() => {
                                if (screens.length === 0) {
                                    return <div className="text-[11px] text-muted-foreground px-2 py-3">Sin pantallas registradas</div>;
                                }
                                const q = screenSearch.trim().toLowerCase();
                                const now = Date.now();
                                const filtered = screens
                                    .filter((s) => {
                                        const online = !!(s.lastSeen && now - new Date(s.lastSeen).getTime() < 15000);
                                        return (showAllScreens || online || s.screenId === screenId) &&
                                            (!q || (s.name || s.screenId).toLowerCase().includes(q) || s.screenId.toLowerCase().includes(q));
                                    })
                                    .sort((a, b) => {
                                        const aOnline = !!(a.lastSeen && now - new Date(a.lastSeen).getTime() < 15000);
                                        const bOnline = !!(b.lastSeen && now - new Date(b.lastSeen).getTime() < 15000);
                                        if (aOnline !== bOnline) return aOnline ? -1 : 1;
                                        if (a.screenId === screenId) return -1;
                                        if (b.screenId === screenId) return 1;
                                        return (a.name || a.screenId).localeCompare(b.name || b.screenId);
                                    });
                                const shown = filtered.slice(0, screenLimit);
                                const hiddenCount = filtered.length - shown.length;
                                return (
                                    <>
                                        {shown.length === 0 && (
                                            <div className="text-[11px] text-muted-foreground px-2 py-3 text-center">Sin coincidencias para "{screenSearch}"</div>
                                        )}
                                        {shown.map((s) => {
                                            const active = s.screenId === screenId;
                                            const res = s.viewport?.width ? s.viewport.width + 'x' + s.viewport.height : null;
                                            const online = !!(s.lastSeen && now - new Date(s.lastSeen).getTime() < 15000);
                                            return (
                                                <button
                                                    key={s.screenId}
                                                    onClick={() => { onScreenChange(s.screenId); setScreenSearch(''); }}
                                                    className={'flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-md text-[12px] transition-colors ' + (
                                                        active ? 'bg-primary text-primary-foreground' : 'hover:bg-accent text-foreground'
                                                    )}
                                                >
                                                    <span className="flex items-center gap-2 min-w-0">
                                                        <span className="size-1.5 rounded-full shrink-0" style={{ background: online ? '#10b981' : '#ef4444' }} />
                                                        <span className="truncate font-medium">{s.name || s.screenId}</span>
                                                    </span>
                                                    {res && <span className="text-[10px] font-mono opacity-80 shrink-0">{res}</span>}
                                                </button>
                                            );
                                        })}
                                        {hiddenCount > 0 && (
                                            <button
                                                onClick={() => setScreenLimit(999)}
                                                className="mt-1 text-[11px] text-primary hover:underline px-2.5 py-1.5 text-center"
                                            >
                                                Ver todas ({hiddenCount} mas)
                                            </button>
                                        )}
                                    </>
                                );
                            })()}
                        </div>
                    </PopoverContent>
                </Popover>

                {/* Copy URL */}
                <Tooltip>
                    <TooltipTrigger
                        onClick={onCopyUrl}
                        aria-label="Copiar URL"
                        className="size-9 grid place-items-center rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                    >
                        <Link2 className="size-4" />
                    </TooltipTrigger>
                    <TooltipContent side="left">Copiar URL del player</TooltipContent>
                </Tooltip>

                {/* Preview QR */}
                <Tooltip>
                    <TooltipTrigger
                        onClick={() => setQrOpen(true)}
                        aria-label="Ver en mi celu"
                        className="size-9 grid place-items-center rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                    >
                        <QrCode className="size-4" />
                    </TooltipTrigger>
                    <TooltipContent side="left">Ver en mi celu (QR)</TooltipContent>
                </Tooltip>

                <Separator />

                {/* Undo / Redo */}
                <Tooltip>
                    <TooltipTrigger
                        onClick={onUndo}
                        aria-label="Deshacer"
                        className="size-9 grid place-items-center rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                    >
                        <RotateCcw className="size-4" />
                    </TooltipTrigger>
                    <TooltipContent side="left">Deshacer (Ctrl+Z)</TooltipContent>
                </Tooltip>
                <Tooltip>
                    <TooltipTrigger
                        onClick={onRedo}
                        aria-label="Rehacer"
                        className="size-9 grid place-items-center rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                    >
                        <RotateCw className="size-4" />
                    </TooltipTrigger>
                    <TooltipContent side="left">Rehacer (Ctrl+Shift+Z)</TooltipContent>
                </Tooltip>

                <Separator />

                <Separator />

                {/* Open properties */}
                <Tooltip>
                    <TooltipTrigger
                        onClick={onOpenProperties}
                        aria-label="Propiedades"
                        className="size-9 grid place-items-center rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors relative"
                    >
                        <Settings2 className="size-4" />
                        {selectedWidgetCount > 0 && (
                            <span className="absolute -top-0.5 -right-0.5 size-3 rounded-full bg-primary text-primary-foreground text-[8px] font-bold grid place-items-center">
                                {selectedWidgetCount}
                            </span>
                        )}
                    </TooltipTrigger>
                    <TooltipContent side="left">
                        {selectedWidgetCount > 0 ? 'Propiedades del widget' : 'Propiedades del lienzo'}
                    </TooltipContent>
                </Tooltip>

                <Separator />

                {/* Save (with dirty indicator) */}
                <Tooltip>
                    <TooltipTrigger
                        onClick={onSave}
                        aria-label={'Guardar' + (isDirty ? ' (sin guardar)' : '')}
                        className={'size-9 grid place-items-center rounded-md transition-colors relative ' + (
                            isDirty
                                ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/40 hover:bg-amber-500/25'
                                : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                        )}
                    >
                        <Save className="size-4" />
                        {isDirty && (
                            <span className="absolute -top-0.5 -right-0.5 size-2 rounded-full bg-amber-500 animate-pulse" />
                        )}
                    </TooltipTrigger>
                    <TooltipContent side="left">
                        {isDirty ? 'Cambios sin guardar' : (lastSavedAt ? 'Guardado hace ' + Math.floor((Date.now() - lastSavedAt) / 1000) + 's' : 'Guardar')}
                    </TooltipContent>
                </Tooltip>

                {/* Preview / Publish */}
                <Tooltip>
                    <TooltipTrigger
                        onClick={onPreview}
                        aria-label="Vista previa"
                        className="size-9 grid place-items-center rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                    >
                        <Eye className="size-4" />
                    </TooltipTrigger>
                    <TooltipContent side="left">Vista previa</TooltipContent>
                </Tooltip>

                <Tooltip>
                    <TooltipTrigger
                        onClick={onPublish}
                        aria-label={isEditing ? 'Actualizar' : 'Publicar'}
                        className="size-9 grid place-items-center rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                    >
                        <Zap className="size-4" />
                    </TooltipTrigger>
                    <TooltipContent side="left">{isEditing ? 'Actualizar' : 'Publicar'}</TooltipContent>
                </Tooltip>
            </div>
        
            {/* PF-QR-MODAL fullscreen overlay */}
            {qrOpen && (() => {
                const canPreview = !!editingLayoutId;
                const effectiveMode = canPreview ? qrMode : 'player';
                const targetId = screenId || '';
                const url = typeof window === 'undefined' ? '' : (
                    effectiveMode === 'preview' && editingLayoutId
                        ? `${window.location.origin}/preview/${editingLayoutId}`
                        : `${window.location.origin}/player/${targetId}`
                );
                const qrSrc = `https://api.qrserver.com/v1/create-qr-code/?size=520x520&margin=3&data=${encodeURIComponent(url)}`;
                return (
                    <div
                        onClick={() => setQrOpen(false)}
                        className="fixed inset-0 z-[9999] grid place-items-center bg-black/70 backdrop-blur-md"
                    >
                        <div
                            onClick={(e) => e.stopPropagation()}
                            className="bg-card border rounded-2xl shadow-2xl p-6 max-w-sm w-[min(92vw,460px)]"
                        >
                            <div className="text-center space-y-3">
                                <h3 className="text-lg font-bold">Escaneá con tu celu</h3>
                                {canPreview && (
                                    <div className="flex gap-1 justify-center bg-muted rounded-md p-0.5 mx-auto w-fit">
                                        <button
                                            onClick={() => setQrMode('preview')}
                                            className={'px-3 h-8 rounded text-[10px] font-bold uppercase tracking-widest transition-colors ' + (effectiveMode === 'preview' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground')}
                                        >🎨 Esta interface</button>
                                        <button
                                            onClick={() => setQrMode('player')}
                                            className={'px-3 h-8 rounded text-[10px] font-bold uppercase tracking-widest transition-colors ' + (effectiveMode === 'player' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground')}
                                        >📺 Player pantalla</button>
                                    </div>
                                )}
                                <p className="text-[12px] text-muted-foreground">
                                    {effectiveMode === 'preview'
                                        ? 'Vista previa aislada de la interface que estás editando.'
                                        : `Vas a ver el player real de "${selectedScreen?.name || screenId || 'pantalla'}" como se muestra en el tótem, con touch.`}
                                </p>
                                <div className="rounded-xl bg-white p-3 inline-block">
                                    <img src={qrSrc} alt="QR" className="block w-64 h-64" />
                                </div>
                                <div className="rounded-md bg-muted px-3 py-2 text-[11px] font-mono text-muted-foreground break-all">{url || 'Elegí un monitor primero'}</div>
                                <div className="flex gap-2 justify-center">
                                    <button
                                        onClick={() => { onCopyUrl?.(); }}
                                        className="h-9 px-4 rounded-md border bg-background hover:bg-accent text-[12px] font-medium"
                                    >
                                        Copiar URL
                                    </button>
                                    <button
                                        onClick={() => setQrOpen(false)}
                                        className="h-9 px-4 rounded-md bg-primary text-primary-foreground text-[12px] font-medium hover:bg-primary/90"
                                    >
                                        Cerrar
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                );
            })()}
</TooltipProvider>
    );
};
