'use client';

import * as React from 'react';
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { motion } from 'framer-motion';
import Type from 'lucide-react/dist/esm/icons/type';
import Video from 'lucide-react/dist/esm/icons/video';
import GalleryHorizontal from 'lucide-react/dist/esm/icons/gallery-horizontal';
import UtensilsCrossed from 'lucide-react/dist/esm/icons/utensils-crossed';
import CalendarDays from 'lucide-react/dist/esm/icons/calendar-days';
import Clock from 'lucide-react/dist/esm/icons/clock';
import QrCode from 'lucide-react/dist/esm/icons/qr-code';
import Menu from 'lucide-react/dist/esm/icons/menu';
import Cloud from 'lucide-react/dist/esm/icons/cloud';
import Square from 'lucide-react/dist/esm/icons/square';
import Megaphone from 'lucide-react/dist/esm/icons/megaphone';
import Instagram from 'lucide-react/dist/esm/icons/instagram';
import Timer from 'lucide-react/dist/esm/icons/timer';
import PlaneTakeoff from 'lucide-react/dist/esm/icons/plane-takeoff';
import Music from 'lucide-react/dist/esm/icons/music';
import ListOrdered from 'lucide-react/dist/esm/icons/list-ordered';
import Sparkles from 'lucide-react/dist/esm/icons/sparkles';

export interface WidgetTypeDescriptor {
    type: string;
    label: string;
    desc: string;
    icon: React.ElementType;
}

export const WIDGET_LIBRARY: WidgetTypeDescriptor[] = [
    { type: 'TEXT',           label: 'Texto',        desc: 'Títulos y párrafos dinámicos',         icon: Type },
    { type: 'VIDEO',          label: 'Video',        desc: 'Fondos animados o clips',              icon: Video },
    { type: 'SLIDER',         label: 'Galería',      desc: 'Carrusel de fotos/videos',             icon: GalleryHorizontal },
    { type: 'PRODUCT_LIST',   label: 'Carta',        desc: 'Menú de productos con precios',        icon: UtensilsCrossed },
    { type: 'PRICE_LIST',     label: 'Precios',      desc: 'Lista de precios',                     icon: ListOrdered },
    { type: 'ACTIVITIES',     label: 'Agenda',       desc: 'Eventos del día',                      icon: CalendarDays },
    { type: 'DATE_TIME',      label: 'Reloj',        desc: 'Fecha y hora digital',                 icon: Clock },
    { type: 'COUNTDOWN',      label: 'Countdown',    desc: 'Cuenta regresiva',                     icon: Timer },
    { type: 'QR_CODE',        label: 'QR',           desc: 'Código QR escaneable',                 icon: QrCode },
    { type: 'CATEGORY_NAV',   label: 'Navegación',   desc: 'Menú táctil principal',                icon: Menu },
    { type: 'NAV_BUTTON',     label: 'Botón',        desc: 'Botón de navegación',                  icon: Square },
    { type: 'WEATHER',        label: 'Clima',        desc: 'Pronóstico en tiempo real',            icon: Cloud },
    { type: 'TICKER',         label: 'Ticker',       desc: 'Cinta de noticias',                    icon: Megaphone },
    { type: 'SOCIAL_FEED',    label: 'Social',       desc: 'Feed Instagram / reseñas',             icon: Instagram },
    { type: 'FLIGHT_BOARD',   label: 'Vuelos',       desc: 'Salidas / llegadas',                   icon: PlaneTakeoff },
    { type: 'MUSIC_PLAYER',   label: 'Música',       desc: 'Player visualizer',                    icon: Music },
    { type: 'ATMOSPHERE',     label: 'Atmósfera',    desc: 'Fondo decorativo / ambiente',          icon: Sparkles },
];

interface WidgetPaletteProps {
    onAdd: (type: string) => void;
    variant?: 'floating' | 'inline';
}

export const WidgetPalette: React.FC<WidgetPaletteProps> = ({ onAdd, variant = 'floating' }) => {
    const handleDragStart = (e: React.DragEvent<HTMLSpanElement>, type: string) => {
        e.dataTransfer.setData('application/x-pixelflow-widget', type);
        e.dataTransfer.setData('text/plain', 'widget:' + type);
        e.dataTransfer.effectAllowed = 'copy';
    };

    const isFloating = variant === 'floating';

    return (
        <TooltipProvider>
            <div
                className={
                    isFloating
                        ? 'fixed left-[76px] top-1/2 -translate-y-1/2 z-30 flex flex-col items-stretch gap-1 p-1.5 rounded-lg border bg-popover text-popover-foreground shadow-lg backdrop-blur-xl max-h-[min(80vh,640px)]'
                        : 'w-14 shrink-0 border-r bg-card flex flex-col'
                }
                style={isFloating ? { background: 'color-mix(in srgb, var(--popover) 92%, transparent)' } : undefined}
            >
                <div className="px-2 pt-1 pb-1.5 text-center shrink-0">
                    <div className="text-[8px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
                        Widgets
                    </div>
                    <div className="text-[8px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
                        Library
                    </div>
                </div>

                <Separator />

                <ScrollArea className="flex-1 min-h-0">
                    <div className="flex flex-col items-stretch gap-1 py-1">
                        {WIDGET_LIBRARY.map(({ type, label, desc, icon: Icon }) => (
                            <Tooltip key={type}>
                                <TooltipTrigger
                                    onClick={() => onAdd(type)}
                                    aria-label={'Agregar ' + label}
                                    className="size-9 grid place-items-center rounded-md text-muted-foreground hover:text-foreground hover:bg-accent cursor-grab active:cursor-grabbing transition-colors"
                                >
                                    <motion.span
                                        whileHover={{ scale: 1.08 }}
                                        whileTap={{ scale: 0.92 }}
                                        draggable
                                        onDragStart={(e) => handleDragStart(e as any, type)}
                                        className="grid place-items-center size-full"
                                    >
                                        <Icon className="size-4 pointer-events-none" strokeWidth={1.75} />
                                    </motion.span>
                                </TooltipTrigger>
                                <TooltipContent side="right" sideOffset={8} className="max-w-[200px]">
                                    <div className="flex flex-col gap-0.5">
                                        <span className="font-semibold text-[12px]">{label}</span>
                                        <span className="text-[11px] text-muted-foreground">{desc}</span>
                                        <span className="text-[10px] text-muted-foreground/70 mt-1">
                                            Click o arrastrar al lienzo
                                        </span>
                                    </div>
                                </TooltipContent>
                            </Tooltip>
                        ))}
                    </div>
                </ScrollArea>
            </div>
        </TooltipProvider>
    );
};
