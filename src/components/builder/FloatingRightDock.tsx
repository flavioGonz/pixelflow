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
import Link2 from 'lucide-react/dist/esm/icons/link-2';
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
    onScreenChange: (id: string) => void;
    onPreview: () => void;
    onPublish: () => void;
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
    onScreenChange,
    onPreview,
    onPublish,
    onCopyUrl,
    onUndo,
    onRedo,
    isEditing,
}) => {
    const [customW, setCustomW] = React.useState(String(resolution.width));
    const [customH, setCustomH] = React.useState(String(resolution.height));

    React.useEffect(() => {
        setCustomW(String(resolution.width));
        setCustomH(String(resolution.height));
    }, [resolution.width, resolution.height]);

    const applyCustom = () => {
        const w = parseInt(customW) || resolution.width;
        const h = parseInt(customH) || resolution.height;
        onResolutionChange({ width: w, height: h });
    };

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
                    <PopoverContent side="left" align="start" className="w-64 p-2 max-h-[60vh] overflow-auto">
                        <Label className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground mb-1.5 block px-1">
                            Disenos guardados
                        </Label>
                        {layouts.length === 0 && (
                            <div className="text-[11px] text-muted-foreground px-2 py-3">Sin disenos guardados</div>
                        )}
                        <div className="flex flex-col gap-0.5">
                            {layouts.map((l) => {
                                const active = l._id === activeLayoutId;
                                return (
                                    <button
                                        key={l._id}
                                        onClick={() => onLayoutChange(l._id)}
                                        className={'text-left px-2.5 py-1.5 rounded-md text-[12px] transition-colors ' + (
                                            active ? 'bg-primary text-primary-foreground' : 'hover:bg-accent text-foreground'
                                        )}
                                    >
                                        {l.name}
                                    </button>
                                );
                            })}
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
                    <PopoverContent side="left" align="start" className="w-72 p-2 max-h-[60vh] overflow-auto">
                        <Label className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground mb-1.5 block px-1">
                            Pantallas
                        </Label>
                        <div className="flex flex-col gap-0.5">
                            {screens.length === 0 && (
                                <div className="text-[11px] text-muted-foreground px-2 py-3">Sin pantallas registradas</div>
                            )}
                            {screens.map((s) => {
                                const active = s.screenId === screenId;
                                const res = s.viewport?.width ? s.viewport.width + 'x' + s.viewport.height : null;
                                const online = !!(s.lastSeen && Date.now() - new Date(s.lastSeen).getTime() < 15000);
                                return (
                                    <button
                                        key={s.screenId}
                                        onClick={() => onScreenChange(s.screenId)}
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

                {/* Orientation + resolution — landscape */}
                <Popover>
                    <PopoverTrigger
                        aria-label="Horizontal"
                        title={'Horizontal' + (orientation === 'landscape' ? ' (' + resolution.width + 'x' + resolution.height + ')' : '')}
                        className={'size-9 grid place-items-center rounded-md transition-colors ' + (
                            orientation === 'landscape'
                                ? 'bg-primary text-primary-foreground'
                                : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                        )}
                    >
                        <Monitor className="size-4" />
                    </PopoverTrigger>
                    <PopoverContent side="left" align="center" className="w-72 p-3">
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <div>
                                    <div className="text-[11px] font-bold uppercase tracking-[0.14em]">Horizontal</div>
                                    <div className="text-[10px] text-muted-foreground">Landscape</div>
                                </div>
                                <Monitor className="size-4 text-primary" />
                            </div>

                            <Separator />

                            <div>
                                <Label className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground mb-1.5 block">
                                    Presets
                                </Label>
                                <div className="grid grid-cols-1 gap-1">
                                    {PRESETS_LANDSCAPE.map((preset) => {
                                        const active = orientation === 'landscape' && resolution.width === preset.w && resolution.height === preset.h;
                                        return (
                                            <button
                                                key={preset.label}
                                                onClick={() => { onOrientationChange('landscape'); onResolutionChange({ width: preset.w, height: preset.h }); }}
                                                className={'flex items-center justify-between px-2.5 py-1.5 rounded-md text-[12px] transition-colors ' + (
                                                    active
                                                        ? 'bg-primary text-primary-foreground'
                                                        : 'hover:bg-accent text-foreground'
                                                )}
                                            >
                                                <span className="font-medium">{preset.label}</span>
                                                <span className="font-mono text-[11px] opacity-80">
                                                    {preset.w}x{preset.h}
                                                </span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            <Separator />

                            <div>
                                <Label className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground mb-1.5 block">
                                    Personalizada
                                </Label>
                                <div className="flex items-center gap-1.5">
                                    <Input
                                        type="number"
                                        min={100}
                                        max={7680}
                                        value={customW}
                                        onChange={(e) => setCustomW(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && (onOrientationChange('landscape'), applyCustom())}
                                        className="h-8 text-[12px]"
                                        placeholder="Ancho"
                                    />
                                    <span className="text-muted-foreground text-[12px]">x</span>
                                    <Input
                                        type="number"
                                        min={100}
                                        max={7680}
                                        value={customH}
                                        onChange={(e) => setCustomH(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && (onOrientationChange('landscape'), applyCustom())}
                                        className="h-8 text-[12px]"
                                        placeholder="Alto"
                                    />
                                </div>
                                <Button onClick={() => { onOrientationChange('landscape'); applyCustom(); }} size="sm" className="w-full mt-2 h-7 text-[12px]">
                                    Aplicar
                                </Button>
                            </div>
                        </div>
                    </PopoverContent>
                </Popover>

                {/* Orientation + resolution — portrait */}
                <Popover>
                    <PopoverTrigger
                        aria-label="Vertical"
                        title={'Vertical' + (orientation === 'portrait' ? ' (' + resolution.width + 'x' + resolution.height + ')' : '')}
                        className={'size-9 grid place-items-center rounded-md transition-colors ' + (
                            orientation === 'portrait'
                                ? 'bg-primary text-primary-foreground'
                                : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                        )}
                    >
                        <Smartphone className="size-4" />
                    </PopoverTrigger>
                    <PopoverContent side="left" align="center" className="w-72 p-3">
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <div>
                                    <div className="text-[11px] font-bold uppercase tracking-[0.14em]">Vertical</div>
                                    <div className="text-[10px] text-muted-foreground">Portrait</div>
                                </div>
                                <Smartphone className="size-4 text-primary" />
                            </div>

                            <Separator />

                            <div>
                                <Label className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground mb-1.5 block">
                                    Presets
                                </Label>
                                <div className="grid grid-cols-1 gap-1">
                                    {PRESETS_PORTRAIT.map((preset) => {
                                        const active = orientation === 'portrait' && resolution.width === preset.w && resolution.height === preset.h;
                                        return (
                                            <button
                                                key={preset.label}
                                                onClick={() => { onOrientationChange('portrait'); onResolutionChange({ width: preset.w, height: preset.h }); }}
                                                className={'flex items-center justify-between px-2.5 py-1.5 rounded-md text-[12px] transition-colors ' + (
                                                    active
                                                        ? 'bg-primary text-primary-foreground'
                                                        : 'hover:bg-accent text-foreground'
                                                )}
                                            >
                                                <span className="font-medium">{preset.label}</span>
                                                <span className="font-mono text-[11px] opacity-80">
                                                    {preset.w}x{preset.h}
                                                </span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            <Separator />

                            <div>
                                <Label className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground mb-1.5 block">
                                    Personalizada
                                </Label>
                                <div className="flex items-center gap-1.5">
                                    <Input
                                        type="number"
                                        min={100}
                                        max={7680}
                                        value={customW}
                                        onChange={(e) => setCustomW(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && (onOrientationChange('portrait'), applyCustom())}
                                        className="h-8 text-[12px]"
                                        placeholder="Ancho"
                                    />
                                    <span className="text-muted-foreground text-[12px]">x</span>
                                    <Input
                                        type="number"
                                        min={100}
                                        max={7680}
                                        value={customH}
                                        onChange={(e) => setCustomH(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && (onOrientationChange('portrait'), applyCustom())}
                                        className="h-8 text-[12px]"
                                        placeholder="Alto"
                                    />
                                </div>
                                <Button onClick={() => { onOrientationChange('portrait'); applyCustom(); }} size="sm" className="w-full mt-2 h-7 text-[12px]">
                                    Aplicar
                                </Button>
                            </div>
                        </div>
                    </PopoverContent>
                </Popover>

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
        </TooltipProvider>
    );
};
