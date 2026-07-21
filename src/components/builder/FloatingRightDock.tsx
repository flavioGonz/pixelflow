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
import Image from 'lucide-react/dist/esm/icons/image';
import Layers from 'lucide-react/dist/esm/icons/layers';
import Maximize2 from 'lucide-react/dist/esm/icons/maximize-2';

interface FloatingRightDockProps {
    orientation: 'landscape' | 'portrait';
    onOrientationChange: (o: 'landscape' | 'portrait') => void;
    resolution: { width: number; height: number };
    onResolutionChange: (r: { width: number; height: number }) => void;
    selectedWidgetCount: number;
    totalWidgets: number;
    onOpenProperties: () => void;
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
}) => {
    const presets = orientation === 'landscape' ? PRESETS_LANDSCAPE : PRESETS_PORTRAIT;
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

    return (
        <TooltipProvider>
            <div
                className="fixed right-3 top-1/2 -translate-y-1/2 z-30 flex flex-col items-stretch gap-1 p-1.5 rounded-lg border bg-popover text-popover-foreground shadow-lg backdrop-blur-xl"
                style={{ background: 'color-mix(in srgb, var(--popover) 92%, transparent)' }}
            >
                <div className="px-2 pt-1 pb-1.5 text-center">
                    <div className="text-[8px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
                        Lienzo
                    </div>
                    <div className="text-[8px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
                        Maestro
                    </div>
                </div>

                <Separator />

                {/* Orientation toggle */}
                <Tooltip>
                    <TooltipTrigger
                        onClick={() => onOrientationChange('landscape')}
                        aria-label="Landscape"
                        className={'size-9 grid place-items-center rounded-md transition-colors ' + (
                            orientation === 'landscape'
                                ? 'bg-primary text-primary-foreground'
                                : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                        )}
                    >
                        <Monitor className="size-4" />
                    </TooltipTrigger>
                    <TooltipContent side="left">Horizontal</TooltipContent>
                </Tooltip>

                <Tooltip>
                    <TooltipTrigger
                        onClick={() => onOrientationChange('portrait')}
                        aria-label="Portrait"
                        className={'size-9 grid place-items-center rounded-md transition-colors ' + (
                            orientation === 'portrait'
                                ? 'bg-primary text-primary-foreground'
                                : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                        )}
                    >
                        <Smartphone className="size-4" />
                    </TooltipTrigger>
                    <TooltipContent side="left">Vertical</TooltipContent>
                </Tooltip>

                {/* Resolution popover */}
                <Popover>
                    <PopoverTrigger
                        aria-label="Resolución"
                        className="mx-0.5 px-1.5 py-1 rounded-sm bg-muted text-[10px] font-mono tabular-nums text-center text-foreground hover:bg-accent transition-colors flex items-center justify-center gap-1"
                    >
                        <Maximize2 className="size-2.5" />
                        {resolution.width}×{resolution.height}
                    </PopoverTrigger>
                    <PopoverContent side="left" align="center" className="w-72 p-3">
                        <div className="space-y-3">
                            <div>
                                <Label className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground mb-1.5 block">
                                    Presets
                                </Label>
                                <div className="grid grid-cols-1 gap-1">
                                    {presets.map((preset) => {
                                        const active = resolution.width === preset.w && resolution.height === preset.h;
                                        return (
                                            <button
                                                key={preset.label}
                                                onClick={() => onResolutionChange({ width: preset.w, height: preset.h })}
                                                className={'flex items-center justify-between px-2.5 py-1.5 rounded-md text-[12px] transition-colors ' + (
                                                    active
                                                        ? 'bg-primary text-primary-foreground'
                                                        : 'hover:bg-accent text-foreground'
                                                )}
                                            >
                                                <span className="font-medium">{preset.label}</span>
                                                <span className="font-mono text-[11px] opacity-80">
                                                    {preset.w}×{preset.h}
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
                                        onBlur={applyCustom}
                                        onKeyDown={(e) => e.key === 'Enter' && applyCustom()}
                                        className="h-8 text-[12px]"
                                        placeholder="Ancho"
                                    />
                                    <span className="text-muted-foreground text-[12px]">×</span>
                                    <Input
                                        type="number"
                                        min={100}
                                        max={7680}
                                        value={customH}
                                        onChange={(e) => setCustomH(e.target.value)}
                                        onBlur={applyCustom}
                                        onKeyDown={(e) => e.key === 'Enter' && applyCustom()}
                                        className="h-8 text-[12px]"
                                        placeholder="Alto"
                                    />
                                </div>
                                <Button onClick={applyCustom} size="sm" className="w-full mt-2 h-7 text-[12px]">
                                    Aplicar
                                </Button>
                            </div>
                        </div>
                    </PopoverContent>
                </Popover>

                <Separator className="my-1" />

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

                <Tooltip>
                    <TooltipTrigger
                        onClick={onOpenProperties}
                        aria-label="Fondo"
                        className="size-9 grid place-items-center rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                    >
                        <Image className="size-4" />
                    </TooltipTrigger>
                    <TooltipContent side="left">Fondo / imagen / video</TooltipContent>
                </Tooltip>

                <Tooltip>
                    <TooltipTrigger
                        onClick={onOpenProperties}
                        aria-label="Capas"
                        className="size-9 grid place-items-center rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors relative"
                    >
                        <Layers className="size-4" />
                        <span className="absolute -top-0.5 -right-0.5 min-w-3 h-3 px-0.5 rounded-full bg-muted-foreground text-background text-[8px] font-bold grid place-items-center">
                            {totalWidgets}
                        </span>
                    </TooltipTrigger>
                    <TooltipContent side="left">Capas ({totalWidgets})</TooltipContent>
                </Tooltip>
            </div>
        </TooltipProvider>
    );
};
