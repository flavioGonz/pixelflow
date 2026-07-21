'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { ChevronDown } from 'lucide-react';
import LayoutIcon from 'lucide-react/dist/esm/icons/layout';
import Smartphone from 'lucide-react/dist/esm/icons/smartphone';
import Eye from 'lucide-react/dist/esm/icons/eye';
import Zap from 'lucide-react/dist/esm/icons/zap';
import Link2 from 'lucide-react/dist/esm/icons/link-2';
import RotateCcw from 'lucide-react/dist/esm/icons/rotate-ccw';
import RotateCw from 'lucide-react/dist/esm/icons/rotate-cw';

interface FloatingDockProps {
    /** Layouts */
    layouts: { _id: string; name: string }[];
    activeLayoutId: string;
    onLayoutChange: (id: string) => void;
    layoutName: string;
    /** Screens */
    screens: any[];
    screenId: string;
    onScreenChange: (id: string) => void;
    /** Actions */
    onPreview: () => void;
    onPublish: () => void;
    onCopyUrl: () => void;
    onUndo: () => void;
    onRedo: () => void;
    isEditing: boolean;
}

export const FloatingDock: React.FC<FloatingDockProps> = ({
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
    const selectedScreen = screens.find((s: any) => s.screenId === screenId);
    const isOnline = selectedScreen && (Date.now() - new Date(selectedScreen.lastSeen).getTime() < 15000);
    const resolution = selectedScreen?.viewport?.width
        ? selectedScreen.viewport.width + '×' + selectedScreen.viewport.height
        : null;

    return (
        <TooltipProvider>
            <div
                className="fixed top-3 left-1/2 -translate-x-1/2 z-30 inline-flex items-center gap-1 p-1.5 rounded-lg border bg-popover text-popover-foreground shadow-lg backdrop-blur-xl"
                style={{ background: 'color-mix(in srgb, var(--popover) 92%, transparent)' }}
            >
                {/* Layout selector */}
                <Tooltip>
                    <TooltipTrigger>
                        <div className="relative">
                            <LayoutIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none" />
                            <select
                                aria-label="Diseño activo"
                                className="appearance-none h-8 pl-8 pr-7 rounded-md text-[12px] font-medium bg-transparent border-0 outline-none focus-visible:ring-2 focus-visible:ring-ring/30 hover:bg-accent transition-colors cursor-pointer max-w-[180px]"
                                value={activeLayoutId}
                                onChange={(e) => onLayoutChange(e.target.value)}
                            >
                                <option value="">Diseño…</option>
                                {layouts.map((l) => (
                                    <option key={l._id} value={l._id}>{l.name}</option>
                                ))}
                            </select>
                            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 size-3 text-muted-foreground pointer-events-none" />
                        </div>
                    </TooltipTrigger>
                    <TooltipContent side="bottom">Diseño activo: <b>{layoutName}</b></TooltipContent>
                </Tooltip>

                <span className="h-5 w-px bg-border mx-0.5" />

                {/* Monitor selector */}
                <Tooltip>
                    <TooltipTrigger>
                        <div className="relative">
                            <Smartphone className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none" />
                            <div className="absolute left-7 top-1/2 -translate-y-1/2 size-1.5 rounded-full pointer-events-none"
                                 style={{ background: isOnline ? '#10b981' : '#ef4444', boxShadow: isOnline ? '0 0 6px #10b981aa' : 'none' }} />
                            <select
                                aria-label="Monitor destino"
                                className="appearance-none h-8 pl-12 pr-7 rounded-md text-[12px] font-medium bg-transparent border-0 outline-none focus-visible:ring-2 focus-visible:ring-ring/30 hover:bg-accent transition-colors cursor-pointer max-w-[220px]"
                                value={screenId}
                                onChange={(e) => onScreenChange(e.target.value)}
                            >
                                {screens.length === 0 ? (
                                    <option value="pantalla-1">Sin pantallas…</option>
                                ) : (
                                    screens.map((s: any) => {
                                        const res = s.viewport?.width ? ' · ' + s.viewport.width + '×' + s.viewport.height : '';
                                        return <option key={s.screenId} value={s.screenId}>{s.name || s.screenId}{res}</option>;
                                    })
                                )}
                            </select>
                            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 size-3 text-muted-foreground pointer-events-none" />
                        </div>
                    </TooltipTrigger>
                    <TooltipContent side="bottom">
                        Monitor destino{resolution ? ' · ' + resolution : ''}
                    </TooltipContent>
                </Tooltip>

                <Tooltip>
                    <TooltipTrigger>
                        <Button variant="ghost" size="icon" className="size-8" onClick={onCopyUrl}>
                            <Link2 className="size-3.5" />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom">Copiar URL del player</TooltipContent>
                </Tooltip>

                <span className="h-5 w-px bg-border mx-0.5" />

                {/* Undo / Redo */}
                <Tooltip>
                    <TooltipTrigger>
                        <Button variant="ghost" size="icon" className="size-8" onClick={onUndo}>
                            <RotateCcw className="size-3.5" />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom">Deshacer (⌘Z)</TooltipContent>
                </Tooltip>
                <Tooltip>
                    <TooltipTrigger>
                        <Button variant="ghost" size="icon" className="size-8" onClick={onRedo}>
                            <RotateCw className="size-3.5" />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom">Rehacer (⌘⇧Z)</TooltipContent>
                </Tooltip>

                <span className="h-5 w-px bg-border mx-0.5" />

                {/* Preview / Publish */}
                <Button variant="outline" size="sm" className="h-8" onClick={onPreview}>
                    <Eye className="size-3.5" />
                    Vista previa
                </Button>
                <Button size="sm" className="h-8" onClick={onPublish}>
                    <Zap className="size-3.5" />
                    {isEditing ? 'Actualizar' : 'Publicar'}
                </Button>
            </div>
        </TooltipProvider>
    );
};
