'use client';

import * as React from 'react';
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { motion } from 'framer-motion';
import Type from 'lucide-react/dist/esm/icons/type';
import Video from 'lucide-react/dist/esm/icons/video';
import ImageIconLucide from 'lucide-react/dist/esm/icons/image';
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
import Table from 'lucide-react/dist/esm/icons/table';
import Thermometer from 'lucide-react/dist/esm/icons/thermometer';
import ChevronDown from 'lucide-react/dist/esm/icons/chevron-down';
import PenLine from 'lucide-react/dist/esm/icons/pen-line';
import Film from 'lucide-react/dist/esm/icons/film';
import LayoutGrid from 'lucide-react/dist/esm/icons/layout-grid';
import Database from 'lucide-react/dist/esm/icons/database';
import Radio from 'lucide-react/dist/esm/icons/radio';
import Wand2 from 'lucide-react/dist/esm/icons/wand-2';
import Wifi from 'lucide-react/dist/esm/icons/wifi';
import Smile from 'lucide-react/dist/esm/icons/smile';

export interface WidgetTypeDescriptor {
    type: string;
    label: string;
    desc: string;
    icon: React.ElementType;
}

interface WidgetGroup {
    id: string;
    label: string;
    icon: React.ElementType;
    color: string;
    items: WidgetTypeDescriptor[];
}

// All widget definitions kept as flat library for backward compat
export const WIDGET_LIBRARY: WidgetTypeDescriptor[] = [
    { type: 'TEXT',           label: 'Texto',        desc: 'Titulos y parrafos dinamicos',         icon: Type },
    { type: 'VIDEO',          label: 'Video',        desc: 'Fondos animados o clips',              icon: Video },
    { type: 'IMAGE',          label: 'Imagen',       desc: 'Foto estática, linkeable',             icon: ImageIconLucide },
    { type: 'SLIDER',         label: 'Galeria',      desc: 'Carrusel de fotos/videos',             icon: GalleryHorizontal },
    { type: 'PRODUCT_LIST',   label: 'Carta',        desc: 'Menu de productos con precios',        icon: UtensilsCrossed },
    { type: 'PRICE_LIST',     label: 'Precios',      desc: 'Lista de precios',                     icon: ListOrdered },
    { type: 'ACTIVITIES',     label: 'Agenda',       desc: 'Eventos del dia',                      icon: CalendarDays },
    { type: 'DATE_TIME',      label: 'Reloj',        desc: 'Fecha y hora digital',                 icon: Clock },
    { type: 'COUNTDOWN',      label: 'Countdown',    desc: 'Cuenta regresiva',                     icon: Timer },
    { type: 'QR_CODE',        label: 'QR',           desc: 'Codigo QR escaneable',                 icon: QrCode },
    { type: 'CATEGORY_NAV',   label: 'Navegacion',   desc: 'Menu tactil principal',                icon: Menu },
    { type: 'NAV_BUTTON',     label: 'Boton',        desc: 'Boton de navegacion',                  icon: Square },
    { type: 'WEATHER',        label: 'Clima',        desc: 'Pronostico en tiempo real',            icon: Cloud },
    { type: 'TICKER',         label: 'Ticker',       desc: 'Cinta de noticias',                    icon: Megaphone },
    { type: 'SOCIAL_FEED',    label: 'Social',       desc: 'Feed Instagram / resenas',             icon: Instagram },
    { type: 'FLIGHT_BOARD',   label: 'Vuelos',       desc: 'Salidas / llegadas',                   icon: PlaneTakeoff },
    { type: 'MUSIC_PLAYER',   label: 'Musica',       desc: 'Player visualizer',                    icon: Music },
    { type: 'DATA_TABLE',     label: 'Tabla',        desc: 'Tabla compacta tipo Excel',            icon: Table },
    { type: 'SENSOR_VALUE',   label: 'Sensor',       desc: 'Muestra la lectura de un sensor IoT',  icon: Thermometer },
    { type: 'ATMOSPHERE',     label: 'Atmosfera',    desc: 'Fondo decorativo / ambiente',          icon: Sparkles },
    { type: 'WIFI_INFO',      label: 'Wi-Fi',        desc: 'SSID + password + QR escaneable',      icon: Wifi },
    { type: 'FEEDBACK',       label: 'Feedback',     desc: '5 caritas para valorar experiencia',   icon: Smile },
];


const byType = (t: string) => WIDGET_LIBRARY.find(w => w.type === t)!;

const GROUPS: WidgetGroup[] = [
    {
        id: 'text', label: 'Texto y tiempo', icon: PenLine, color: 'sky',
        items: [ byType('TEXT'), byType('DATE_TIME'), byType('COUNTDOWN'), byType('TICKER') ],
    },
    {
        id: 'media', label: 'Multimedia', icon: Film, color: 'rose',
        items: [ byType('VIDEO'), byType('IMAGE'), byType('SLIDER'), byType('QR_CODE'), byType('MUSIC_PLAYER'), byType('SOCIAL_FEED') ],
    },
    {
        id: 'nav', label: 'Interactivo', icon: LayoutGrid, color: 'violet',
        items: [ byType('CATEGORY_NAV'), byType('NAV_BUTTON'), byType('WIFI_INFO'), byType('FEEDBACK') ],
    },
    {
        id: 'data', label: 'Datos', icon: Database, color: 'emerald',
        items: [ byType('PRODUCT_LIST'), byType('PRICE_LIST'), byType('ACTIVITIES'), byType('FLIGHT_BOARD'), byType('DATA_TABLE') ],
    },
    {
        id: 'iot', label: 'Sensores y clima', icon: Radio, color: 'amber',
        items: [ byType('SENSOR_VALUE'), byType('WEATHER') ],
    },
    {
        id: 'fx', label: 'Efectos', icon: Wand2, color: 'fuchsia',
        items: [ byType('ATMOSPHERE') ],
    },
];

const GROUP_COLORS: Record<string, string> = {
    sky:     'text-sky-500',
    rose:    'text-rose-500',
    violet:  'text-violet-500',
    emerald: 'text-emerald-500',
    amber:   'text-amber-500',
    fuchsia: 'text-fuchsia-500',
};

interface WidgetPaletteProps {
    onAdd: (type: string) => void;
    variant?: 'floating' | 'inline' | 'horizontal';
}

export const WidgetPalette: React.FC<WidgetPaletteProps> = ({ onAdd, variant = 'horizontal' }) => {
    const handleDragStart = (e: React.DragEvent<HTMLElement>, type: string) => {
        e.dataTransfer.setData('application/x-pixelflow-widget', type);
        e.dataTransfer.setData('text/plain', 'widget:' + type);
        e.dataTransfer.effectAllowed = 'copy';
    };

    if (variant === 'horizontal') {
        return (
            <TooltipProvider delay={200}>
                <div
                    className="fixed top-3 left-1/2 -translate-x-1/2 z-30 flex items-center gap-1 p-1.5 rounded-lg border bg-popover text-popover-foreground shadow-lg backdrop-blur-xl"
                    style={{ background: 'color-mix(in srgb, var(--popover) 92%, transparent)' }}
                >
                    {GROUPS.map((group) => {
                        const GIcon = group.icon;
                        return (
                            <Popover key={group.id}>
                                <PopoverTrigger
                                    aria-label={group.label}
                                    title={group.label}
                                    className="h-9 px-2.5 inline-flex items-center gap-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors group"
                                >
                                    <GIcon className={'size-4 ' + GROUP_COLORS[group.color]} strokeWidth={2} />
                                    <span className="text-[11px] font-semibold hidden md:inline">{group.label}</span>
                                    <ChevronDown className="size-3 opacity-50" />
                                </PopoverTrigger>
                                <PopoverContent side="bottom" align="start" className="w-64 p-2">
                                    <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground px-2 py-1 flex items-center gap-1.5">
                                        <GIcon className={'size-3 ' + GROUP_COLORS[group.color]} />
                                        {group.label}
                                    </div>
                                    <div className="space-y-0.5">
                                        {group.items.map(({ type, label, desc, icon: Icon }) => (
                                            <button
                                                key={type}
                                                onClick={() => onAdd(type)}
                                                draggable
                                                onDragStart={(e) => handleDragStart(e, type)}
                                                className="w-full flex items-start gap-2.5 px-2.5 py-2 rounded-md hover:bg-accent transition-colors cursor-grab active:cursor-grabbing text-left"
                                            >
                                                <span className={'size-8 shrink-0 rounded-md grid place-items-center border bg-background ' + GROUP_COLORS[group.color]}>
                                                    <Icon className="size-4" strokeWidth={1.75} />
                                                </span>
                                                <div className="min-w-0 flex-1">
                                                    <div className="text-[12px] font-semibold truncate">{label}</div>
                                                    <div className="text-[10px] text-muted-foreground truncate leading-tight">{desc}</div>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                    <div className="text-[9px] text-muted-foreground/70 px-2 pt-1 mt-1 border-t italic">
                                        Click para insertar · o arrastrá al lienzo
                                    </div>
                                </PopoverContent>
                            </Popover>
                        );
                    })}
                </div>
            </TooltipProvider>
        );
    }

    // Fallback: original inline/floating flat variant (kept for other callers)
    return (
        <div className={variant === 'floating'
            ? 'fixed left-[76px] top-1/2 -translate-y-1/2 z-30 flex flex-col items-stretch gap-1 p-1.5 rounded-lg border bg-popover text-popover-foreground shadow-lg backdrop-blur-xl max-h-[min(80vh,640px)]'
            : 'w-14 shrink-0 border-r bg-card flex flex-col'}>
            {WIDGET_LIBRARY.map(({ type, label, desc, icon: Icon }) => (
                <button
                    key={type}
                    onClick={() => onAdd(type)}
                    draggable
                    onDragStart={(e) => handleDragStart(e, type)}
                    title={label + ' — ' + desc}
                    className="size-9 grid place-items-center rounded-md text-muted-foreground hover:text-foreground hover:bg-accent cursor-grab active:cursor-grabbing transition-colors"
                >
                    <Icon className="size-4" strokeWidth={1.75} />
                </button>
            ))}
        </div>
    );
};
