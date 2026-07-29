'use client';

import * as React from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Switch } from '@/components/ui/switch';
import { CategoryItemsEditor } from './CategoryItemsEditor';
import Maximize from 'lucide-react/dist/esm/icons/maximize';
import Palette from 'lucide-react/dist/esm/icons/palette';
import Grid3X3 from 'lucide-react/dist/esm/icons/grid-3x3';
import ImageIcon from 'lucide-react/dist/esm/icons/image';
import Type from 'lucide-react/dist/esm/icons/type';
import Info from 'lucide-react/dist/esm/icons/info';
import Sparkles from 'lucide-react/dist/esm/icons/sparkles';
import ChevronLeft from 'lucide-react/dist/esm/icons/chevron-left';
import Check from 'lucide-react/dist/esm/icons/check';

interface CategoryNavPanelProps {
    widget: any;
    onUpdateData: (patch: any) => void;
    onUpdatePos: (key: 'x' | 'y', v: number) => void;
    onUpdateSize: (key: 'w' | 'h', v: number) => void;
    onLayerUp: (id: string) => void;
    onLayerDown: (id: string) => void;
    onLayerFront: (id: string) => void;
    onLayerBack: (id: string) => void;
    savedLayouts: { _id: string; name: string }[];
}

// ==============================
// Templates catalog
// ==============================
type Template = {
    v: string; name: string; desc: string;
    // properties this template exposes in its detail view
    props: string[];
};

const TEMPLATES: Template[] = [
    { v: 'CARDS',        name: 'Cards',        desc: 'Fotos grandes con overlay',      props: ['accent','shape','border','gap','columns','rows','autoScroll','arrows','title'] },
    { v: 'FLOATING',     name: 'Burbujas',     desc: 'Iconos circulares flotantes',    props: ['accent','gap','columns','autoScroll','arrows','title'] },
    { v: 'GLAS_TILES',   name: 'Glass Tiles',  desc: 'Bloques traslúcidos modernos',   props: ['accent','shape','gap','columns','rows','autoScroll','arrows','title'] },
    { v: 'STRIPS',       name: 'Strips',       desc: 'Tiras horizontales',             props: ['accent','gap','autoScroll','title'] },
    { v: 'NEON_GLOW',    name: 'Neon Glow',    desc: 'Futurista con brillo',           props: ['accent','shape','gap','columns','autoScroll','arrows','title'] },
    { v: 'BRUTALIST',    name: 'Brutalist',    desc: 'Bordes duros retro',             props: ['accent','gap','columns','autoScroll','arrows','title'] },
    { v: 'HOLOGRAPHIC',  name: 'Holographic',  desc: 'Iridiscente animado',            props: ['gap','columns','autoScroll','arrows','title'] },
    { v: 'MAC_DOCK',     name: 'Mac Dock',     desc: 'Premium con magnificación',      props: ['gap','columns','autoScroll','arrows','title'] },
    { v: 'BENTO',        name: 'Bento Grid',   desc: 'Grilla asimétrica moderna',      props: ['accent','shape','gap','columns','rows','autoScroll','arrows','title'] },
    { v: 'NEON_PILLS',   name: 'Neon Pills',   desc: 'Pastillas cyber con glow',       props: ['accent','gap','columns','autoScroll','arrows','title'] },
    { v: 'GLOW_ORBS',    name: 'Glow Orbs',    desc: 'Círculos radiantes con halo',    props: ['accent','gap','columns','autoScroll','arrows','title'] },
    { v: 'MOSAIC',       name: 'Mosaic',       desc: 'Cuadrados coloridos con foto',   props: ['accent','shape','border','gap','columns','rows','autoScroll','title'] },
    { v: 'MINIMAL_LIST', name: 'Minimal List', desc: 'Lista vertical elegante',        props: ['accent','gap','autoScroll','title'] },
    { v: 'CIRCULAR_HUB', name: 'Circular Hub', desc: 'Discos glass compactos',         props: ['accent','border','gap','columns','autoScroll','arrows','title'] },
    { v: 'DOCK_TILES',   name: 'Dock Tiles',   desc: 'Baldosas suspendidas 3D',        props: ['accent','shape','gap','columns','rows','autoScroll','arrows','title'] },
    { v: 'RADIAL',           name: 'Radial',           desc: 'Discos con centro oscuro',         props: ['accent','gap','columns','autoScroll','arrows','title'] },
    { v: 'STACKED',          name: 'Stacked',          desc: 'Cards apiladas con perspectiva',    props: ['accent','shape','gap','columns','autoScroll','arrows','title'] },
    { v: 'WAVES',            name: 'Waves',            desc: 'Botones con curva animada',         props: ['accent','gap','columns','autoScroll','arrows','title'] },
    { v: 'RIBBON',           name: 'Ribbon',           desc: 'Cintas diagonales retro',           props: ['accent','gap','columns','autoScroll','title'] },
    { v: 'NEUMORPHIC',       name: 'Neumorphic',       desc: 'Suave con sombras profundas',       props: ['gap','columns','autoScroll','arrows','title'] },
    { v: 'GRADIENT_BUBBLES', name: 'Bubbles Gradient', desc: 'Burbujas con degradados ricos',     props: ['gap','columns','autoScroll','arrows','title'] },
    { v: 'TERMINAL',         name: 'Terminal',         desc: 'Consola/hacker estilo CRT',         props: ['accent','gap','columns','autoScroll','title'] },
];

// ==============================
// Mini SVG preview
// ==============================
const TemplatePreview: React.FC<{ variant: string; color: string }> = ({ variant, color }) => {
    const c = color || '#3b82f6';
    switch (variant) {
        case 'CARDS':        return <svg viewBox="0 0 60 32" className="w-full h-full"><rect x="2" y="4" width="16" height="24" rx="2" fill={c} opacity="0.85"/><rect x="22" y="4" width="16" height="24" rx="2" fill={c} opacity="0.6"/><rect x="42" y="4" width="16" height="24" rx="2" fill={c} opacity="0.4"/></svg>;
        case 'FLOATING':     return <svg viewBox="0 0 60 32" className="w-full h-full"><circle cx="12" cy="16" r="8" fill={c} opacity="0.85"/><circle cx="30" cy="16" r="8" fill={c} opacity="0.6"/><circle cx="48" cy="16" r="8" fill={c} opacity="0.4"/></svg>;
        case 'GLAS_TILES':   return <svg viewBox="0 0 60 32" className="w-full h-full"><rect x="2" y="4" width="16" height="24" rx="3" fill={c} opacity="0.3" stroke={c} strokeWidth="0.5"/><rect x="22" y="4" width="16" height="24" rx="3" fill={c} opacity="0.3" stroke={c} strokeWidth="0.5"/><rect x="42" y="4" width="16" height="24" rx="3" fill={c} opacity="0.3" stroke={c} strokeWidth="0.5"/></svg>;
        case 'STRIPS':       return <svg viewBox="0 0 60 32" className="w-full h-full"><rect x="2" y="4" width="56" height="6" rx="1" fill={c} opacity="0.85"/><rect x="2" y="14" width="56" height="6" rx="1" fill={c} opacity="0.6"/><rect x="2" y="24" width="56" height="4" rx="1" fill={c} opacity="0.4"/></svg>;
        case 'NEON_GLOW':    return <svg viewBox="0 0 60 32" className="w-full h-full"><rect x="2" y="4" width="16" height="24" rx="2" fill="none" stroke={c} strokeWidth="1.5" style={{ filter: `drop-shadow(0 0 2px ${c})` }}/><rect x="22" y="4" width="16" height="24" rx="2" fill="none" stroke={c} strokeWidth="1.5" style={{ filter: `drop-shadow(0 0 2px ${c})` }}/><rect x="42" y="4" width="16" height="24" rx="2" fill="none" stroke={c} strokeWidth="1.5" style={{ filter: `drop-shadow(0 0 2px ${c})` }}/></svg>;
        case 'BRUTALIST':    return <svg viewBox="0 0 60 32" className="w-full h-full"><rect x="2" y="4" width="16" height="24" fill={c} stroke="#000" strokeWidth="1.5"/><rect x="22" y="4" width="16" height="24" fill={c} stroke="#000" strokeWidth="1.5"/><rect x="42" y="4" width="16" height="24" fill={c} stroke="#000" strokeWidth="1.5"/></svg>;
        case 'HOLOGRAPHIC':  return <svg viewBox="0 0 60 32" className="w-full h-full"><defs><linearGradient id="holo" x1="0" x2="1"><stop offset="0" stopColor="#f43f5e"/><stop offset="0.5" stopColor="#8b5cf6"/><stop offset="1" stopColor="#06b6d4"/></linearGradient></defs><rect x="2" y="4" width="16" height="24" rx="3" fill="url(#holo)"/><rect x="22" y="4" width="16" height="24" rx="3" fill="url(#holo)" opacity="0.7"/><rect x="42" y="4" width="16" height="24" rx="3" fill="url(#holo)" opacity="0.5"/></svg>;
        case 'MAC_DOCK':     return <svg viewBox="0 0 60 32" className="w-full h-full"><rect x="2" y="8" width="56" height="16" rx="8" fill={c} opacity="0.15"/><circle cx="12" cy="16" r="5" fill={c} opacity="0.6"/><circle cx="24" cy="16" r="6" fill={c} opacity="0.8"/><circle cx="38" cy="16" r="7" fill={c}/><circle cx="52" cy="16" r="5" fill={c} opacity="0.5"/></svg>;
        case 'BENTO':        return <svg viewBox="0 0 60 32" className="w-full h-full"><rect x="2" y="4" width="24" height="24" rx="2" fill={c} opacity="0.85"/><rect x="30" y="4" width="12" height="11" rx="1" fill={c} opacity="0.7"/><rect x="46" y="4" width="12" height="11" rx="1" fill={c} opacity="0.7"/><rect x="30" y="17" width="28" height="11" rx="1" fill={c} opacity="0.5"/></svg>;
        case 'NEON_PILLS':   return <svg viewBox="0 0 60 32" className="w-full h-full"><rect x="4" y="10" width="16" height="12" rx="6" fill="none" stroke={c} strokeWidth="1.5"/><rect x="22" y="10" width="16" height="12" rx="6" fill="none" stroke="#e879f9" strokeWidth="1.5"/><rect x="40" y="10" width="16" height="12" rx="6" fill="none" stroke={c} strokeWidth="1.5"/></svg>;
        case 'GLOW_ORBS':    return <svg viewBox="0 0 60 32" className="w-full h-full"><defs><radialGradient id="orb"><stop offset="0" stopColor={c}/><stop offset="1" stopColor={c} stopOpacity="0"/></radialGradient></defs><circle cx="12" cy="16" r="12" fill="url(#orb)" opacity="0.4"/><circle cx="12" cy="16" r="6" fill={c}/><circle cx="30" cy="16" r="12" fill="url(#orb)" opacity="0.4"/><circle cx="30" cy="16" r="7" fill={c}/><circle cx="48" cy="16" r="12" fill="url(#orb)" opacity="0.4"/><circle cx="48" cy="16" r="6" fill={c}/></svg>;
        case 'MOSAIC':       return <svg viewBox="0 0 60 32" className="w-full h-full"><rect x="2" y="4" width="16" height="24" rx="3" fill="#f43f5e"/><rect x="22" y="4" width="16" height="24" rx="3" fill="#06b6d4"/><rect x="42" y="4" width="16" height="24" rx="3" fill="#8b5cf6"/></svg>;
        case 'MINIMAL_LIST': return <svg viewBox="0 0 60 32" className="w-full h-full"><line x1="4" y1="10" x2="56" y2="10" stroke={c} strokeWidth="0.5" opacity="0.4"/><line x1="4" y1="18" x2="56" y2="18" stroke={c} strokeWidth="0.5" opacity="0.4"/><line x1="4" y1="26" x2="56" y2="26" stroke={c} strokeWidth="0.5" opacity="0.4"/><rect x="6" y="6" width="10" height="2" rx="0.5" fill={c}/><rect x="6" y="14" width="14" height="2" rx="0.5" fill={c}/></svg>;
        case 'CIRCULAR_HUB': return <svg viewBox="0 0 60 32" className="w-full h-full"><circle cx="10" cy="16" r="9" fill={c} opacity="0.15" stroke={c} strokeWidth="1"/><circle cx="30" cy="16" r="9" fill={c} opacity="0.15" stroke={c} strokeWidth="1"/><circle cx="50" cy="16" r="9" fill={c} opacity="0.15" stroke={c} strokeWidth="1"/></svg>;
        case 'DOCK_TILES':   return <svg viewBox="0 0 60 32" className="w-full h-full"><rect x="4" y="4" width="14" height="20" rx="3" fill={c}/><rect x="23" y="4" width="14" height="20" rx="3" fill={c}/><rect x="42" y="4" width="14" height="20" rx="3" fill={c}/></svg>;
        case 'RADIAL':
            return (
                <svg viewBox="0 0 60 32" className="w-full h-full">
                    <defs><radialGradient id={"r"+variant}><stop offset="0" stopColor={c}/><stop offset="1" stopColor={c} stopOpacity="0.2"/></radialGradient></defs>
                    <circle cx="12" cy="16" r="10" fill={"url(#r"+variant+")"}/>
                    <circle cx="12" cy="16" r="5" fill="#000"/>
                    <circle cx="30" cy="16" r="10" fill={"url(#r"+variant+")"}/>
                    <circle cx="30" cy="16" r="5" fill="#000"/>
                    <circle cx="48" cy="16" r="10" fill={"url(#r"+variant+")"}/>
                    <circle cx="48" cy="16" r="5" fill="#000"/>
                </svg>
            );
        case 'STACKED':
            return (
                <svg viewBox="0 0 60 32" className="w-full h-full">
                    <rect x="2" y="9" width="16" height="16" rx="2" fill={c} opacity="0.3"/>
                    <rect x="2" y="6" width="16" height="16" rx="2" fill={c} opacity="0.6"/>
                    <rect x="2" y="4" width="16" height="16" rx="2" fill={c}/>
                    <rect x="22" y="9" width="16" height="16" rx="2" fill={c} opacity="0.3"/>
                    <rect x="22" y="6" width="16" height="16" rx="2" fill={c} opacity="0.6"/>
                    <rect x="22" y="4" width="16" height="16" rx="2" fill={c}/>
                    <rect x="42" y="9" width="16" height="16" rx="2" fill={c} opacity="0.3"/>
                    <rect x="42" y="6" width="16" height="16" rx="2" fill={c} opacity="0.6"/>
                    <rect x="42" y="4" width="16" height="16" rx="2" fill={c}/>
                </svg>
            );
        case 'WAVES':
            return (
                <svg viewBox="0 0 60 32" className="w-full h-full">
                    <path d="M2 4 L18 4 Q18 20 18 24 Q10 26 2 24 Z" fill={c} opacity="0.85"/>
                    <path d="M22 4 L38 4 Q38 20 38 24 Q30 26 22 24 Z" fill={c} opacity="0.65"/>
                    <path d="M42 4 L58 4 Q58 20 58 24 Q50 26 42 24 Z" fill={c} opacity="0.45"/>
                </svg>
            );
        case 'RIBBON':
            return (
                <svg viewBox="0 0 60 32" className="w-full h-full">
                    <rect x="0" y="10" width="60" height="12" fill={c} transform="skewY(-3)"/>
                    <rect x="0" y="12" width="60" height="8" fill="#fff" opacity="0.2" transform="skewY(-3)"/>
                </svg>
            );
        case 'NEUMORPHIC':
            return (
                <svg viewBox="0 0 60 32" className="w-full h-full">
                    <rect x="2" y="4" width="16" height="24" rx="6" fill="#2a2f3a"/>
                    <rect x="3" y="5" width="14" height="22" rx="5" fill="#1a1d23" opacity="0.7"/>
                    <rect x="22" y="4" width="16" height="24" rx="6" fill="#2a2f3a"/>
                    <rect x="23" y="5" width="14" height="22" rx="5" fill="#1a1d23" opacity="0.7"/>
                    <rect x="42" y="4" width="16" height="24" rx="6" fill="#2a2f3a"/>
                    <rect x="43" y="5" width="14" height="22" rx="5" fill="#1a1d23" opacity="0.7"/>
                </svg>
            );
        case 'GRADIENT_BUBBLES':
            return (
                <svg viewBox="0 0 60 32" className="w-full h-full">
                    <defs>
                        <linearGradient id="gb1" x1="0" x2="1" y1="0" y2="1"><stop offset="0" stopColor="#f43f5e"/><stop offset="1" stopColor="#f97316"/></linearGradient>
                        <linearGradient id="gb2" x1="0" x2="1" y1="0" y2="1"><stop offset="0" stopColor="#8b5cf6"/><stop offset="1" stopColor="#06b6d4"/></linearGradient>
                        <linearGradient id="gb3" x1="0" x2="1" y1="0" y2="1"><stop offset="0" stopColor="#10b981"/><stop offset="1" stopColor="#84cc16"/></linearGradient>
                    </defs>
                    <rect x="2"  y="4" width="16" height="24" rx="9" fill="url(#gb1)"/>
                    <rect x="22" y="4" width="16" height="24" rx="9" fill="url(#gb2)"/>
                    <rect x="42" y="4" width="16" height="24" rx="9" fill="url(#gb3)"/>
                </svg>
            );
        case 'TERMINAL':
            return (
                <svg viewBox="0 0 60 32" className="w-full h-full" style={{ background: '#0d1117' }}>
                    <rect x="2"  y="4" width="16" height="24" rx="1" fill="none" stroke={c} strokeWidth="0.5"/>
                    <text x="4" y="18" fontSize="5" fill={c} fontFamily="monospace">{'>'}_</text>
                    <rect x="22" y="4" width="16" height="24" rx="1" fill="none" stroke={c} strokeWidth="0.5"/>
                    <text x="24" y="18" fontSize="5" fill={c} fontFamily="monospace">{'>'}_</text>
                    <rect x="42" y="4" width="16" height="24" rx="1" fill="none" stroke={c} strokeWidth="0.5"/>
                    <text x="44" y="18" fontSize="5" fill={c} fontFamily="monospace">{'>'}_</text>
                </svg>
            );
        default: return null;
    }
};

// ==============================
// Small helper: color picker + hex chip
// ==============================
const ColorField: React.FC<{ label: string; value?: string; onChange: (v: string) => void; hint?: string }> = ({ label, value, onChange, hint }) => (
    <div className="space-y-1">
        <div className="flex items-center gap-1.5">
            <Label className="text-[11px] text-muted-foreground">{label}</Label>
            {hint && (
                <Tooltip>
                    <TooltipTrigger><Info className="size-3 text-muted-foreground/60 cursor-help" /></TooltipTrigger>
                    <TooltipContent side="top">{hint}</TooltipContent>
                </Tooltip>
            )}
        </div>
        <div className="h-9 flex items-center gap-2 rounded-md border bg-background px-2">
            <input type="color" value={value || '#3b82f6'} onChange={(e) => onChange(e.target.value)} className="size-6 rounded cursor-pointer border-0 bg-transparent shrink-0" />
            <span className="font-mono text-[10px] text-muted-foreground truncate">{value || '—'}</span>
        </div>
    </div>
);

// ==============================
// Main panel
// ==============================
export const CategoryNavPanel: React.FC<CategoryNavPanelProps> = ({
    widget, onUpdateData, savedLayouts,
}) => {
    const data = widget.data || {};
    const accent = data.accentColor || '#3b82f6';

    return (
        <TooltipProvider delay={200}>
            <Tabs defaultValue="cats" className="flex flex-col gap-3 w-full">
                <TabsList variant="line" className="w-full grid grid-cols-3 border-b rounded-none h-10">
                    <TabsTrigger value="cats" className="gap-1.5 text-[13px]"><ImageIcon className="size-3.5" /> Categorías</TabsTrigger>
                    <TabsTrigger value="style" className="gap-1.5 text-[13px]"><Palette className="size-3.5" /> Estética</TabsTrigger>
                    <TabsTrigger value="advanced" className="gap-1.5 text-[13px]"><Grid3X3 className="size-3.5" /> Avanzado</TabsTrigger>
                </TabsList>

                {/* =================== CATEGORÍAS =================== */}
                <TabsContent value="cats" className="space-y-3">
                    <CategoryItemsEditor
                        categories={data.categories || []}
                        onChange={(cats) => onUpdateData({ categories: cats })}
                        savedLayouts={savedLayouts}
                    />
                </TabsContent>

                {/* =================== ESTÉTICA (wizard) =================== */}
                <TabsContent value="style" className="space-y-3">
                    <AestheticWizard data={data} onUpdateData={onUpdateData} accent={accent} />
                </TabsContent>

                {/* =================== AVANZADO (columnas) =================== */}
                <TabsContent value="advanced" className="space-y-3">
                    <AdvancedTab data={data} onUpdateData={onUpdateData} widget={widget} />
                </TabsContent>
            </Tabs>
        </TooltipProvider>
    );
};

// ==============================
// Aesthetic wizard — grid → detail
// ==============================
const AestheticWizard: React.FC<{ data: any; onUpdateData: (p: any) => void; accent: string }> = ({ data, onUpdateData, accent }) => {
    const [detailMode, setDetailMode] = React.useState(!!data.template);
    const selectedTpl = TEMPLATES.find(t => t.v === (data.template || 'CARDS')) || TEMPLATES[0];

    // Grid picker mode
    if (!detailMode) {
        return (
            <div className="space-y-3">
                <div className="rounded-lg border bg-card p-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Palette className="size-4 text-primary" />
                        <div>
                            <div className="text-[13px] font-bold">Elegí la estética</div>
                            <div className="text-[11px] text-muted-foreground">Tap en una para ver sus opciones.</div>
                        </div>
                    </div>
                    <ColorField label="Color base" value={data.accentColor} onChange={(v) => onUpdateData({ accentColor: v })} />
                </div>
                <div className="grid grid-cols-3 gap-2">
                    {TEMPLATES.map(t => {
                        const active = data.template === t.v;
                        return (
                            <button
                                key={t.v}
                                onClick={() => { onUpdateData({ template: t.v }); setDetailMode(true); }}
                                className={'group text-left rounded-lg border p-2 transition-all hover:border-primary hover:shadow-md ' + (active ? 'border-primary bg-primary/5 ring-2 ring-primary/20' : 'bg-card')}
                            >
                                <div className="h-16 rounded-md bg-muted/50 grid place-items-center overflow-hidden mb-1.5">
                                    <TemplatePreview variant={t.v} color={accent} />
                                </div>
                                <div className="text-[11px] font-semibold truncate flex items-center gap-1">
                                    {t.name}
                                    {active && <Check className="size-3 text-primary shrink-0" />}
                                </div>
                                <div className="text-[9px] text-muted-foreground truncate">{t.desc}</div>
                            </button>
                        );
                    })}
                </div>
            </div>
        );
    }

    // Detail mode — properties for the selected template
    return (
        <div className="space-y-3">
            {/* Header con back + preview */}
            <div className="rounded-lg border bg-gradient-to-br from-primary/5 to-transparent p-3 flex items-center gap-3">
                <button
                    onClick={() => setDetailMode(false)}
                    className="size-9 rounded-md border bg-background hover:bg-accent grid place-items-center transition-colors shrink-0"
                    title="Elegir otra estética"
                >
                    <ChevronLeft className="size-4" />
                </button>
                <div className="size-12 rounded-md bg-muted/50 grid place-items-center overflow-hidden shrink-0">
                    <TemplatePreview variant={selectedTpl.v} color={accent} />
                </div>
                <div className="min-w-0 flex-1">
                    <div className="text-[13px] font-bold truncate">{selectedTpl.name}</div>
                    <div className="text-[11px] text-muted-foreground truncate">{selectedTpl.desc}</div>
                </div>
                <button
                    onClick={() => setDetailMode(false)}
                    className="h-8 px-3 rounded-md border bg-background text-[11px] font-medium hover:bg-accent transition-colors"
                >
                    Cambiar
                </button>
            </div>

            {/* Título del menú */}
            {selectedTpl.props.includes('title') && (
                <div className="rounded-lg border bg-card p-3 space-y-2.5">
                    <div className="flex items-center gap-1.5">
                        <Type className="size-3.5 text-primary" />
                        <Label className="text-[12px] font-bold">Título del menú</Label>
                    </div>
                    <Input
                        value={data.title || ''}
                        onChange={(e) => onUpdateData({ title: e.target.value })}
                        placeholder="Opcional — Ej: MENÚ DE OPCIONES"
                        className="h-9 text-sm"
                    />
                    {data.title && (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 pt-2 border-t">
                            <ColorField label="Color" value={data.titleColor || '#ffffff'} onChange={(v) => onUpdateData({ titleColor: v })} />
                            <div className="space-y-1">
                                <Label className="text-[11px] text-muted-foreground">Tamaño</Label>
                                <Select value={data.titleSize || 'lg'} onValueChange={(v) => v && onUpdateData({ titleSize: v })}>
                                    <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="sm">Chico</SelectItem>
                                        <SelectItem value="md">Mediano</SelectItem>
                                        <SelectItem value="lg">Grande</SelectItem>
                                        <SelectItem value="xl">XL</SelectItem>
                                        <SelectItem value="2xl">Enorme</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-1">
                                <Label className="text-[11px] text-muted-foreground">Alineación</Label>
                                <Select value={data.titleAlign || 'center'} onValueChange={(v) => v && onUpdateData({ titleAlign: v })}>
                                    <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="left">Izq.</SelectItem>
                                        <SelectItem value="center">Centro</SelectItem>
                                        <SelectItem value="right">Der.</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-1">
                                <Label className="text-[11px] text-muted-foreground">Sombra</Label>
                                <div className="h-9 flex items-center justify-center rounded-md border bg-background">
                                    <Switch checked={data.titleShadow !== false} onCheckedChange={(v) => onUpdateData({ titleShadow: v })} />
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Estilo específico de esta plantilla */}
            <div className="rounded-lg border bg-card p-3 space-y-2.5">
                <div className="flex items-center gap-1.5">
                    <Sparkles className="size-3.5 text-primary" />
                    <Label className="text-[12px] font-bold">Estilo de esta plantilla</Label>
                </div>

                <div className="grid grid-cols-2 gap-2">
                    {selectedTpl.props.includes('accent') && (
                        <ColorField label="Color acento" value={data.accentColor} onChange={(v) => onUpdateData({ accentColor: v })} hint="Se usa como color base de la plantilla" />
                    )}
                    {selectedTpl.props.includes('shape') && (
                        <div className="space-y-1">
                            <Label className="text-[11px] text-muted-foreground">Forma</Label>
                            <Select value={data.itemShape || 'rounded'} onValueChange={(v) => v && onUpdateData({ itemShape: v })}>
                                <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="square">Cuadrado</SelectItem>
                                    <SelectItem value="rounded">Redondeado</SelectItem>
                                    <SelectItem value="pill">Píldora</SelectItem>
                                    <SelectItem value="circle">Circular</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    )}
                </div>

                {selectedTpl.props.includes('border') && (
                    <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                            <Label className="text-[11px] text-muted-foreground">Grosor borde</Label>
                            <Select value={String(data.borderWidth ?? 0)} onValueChange={(v) => v != null && onUpdateData({ borderWidth: parseInt(v) })}>
                                <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="0">Sin borde</SelectItem>
                                    <SelectItem value="1">1 px</SelectItem>
                                    <SelectItem value="2">2 px</SelectItem>
                                    <SelectItem value="3">3 px</SelectItem>
                                    <SelectItem value="4">4 px</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        {(data.borderWidth ?? 0) > 0 && (
                            <ColorField label="Color borde" value={data.borderColor || '#ffffff'} onChange={(v) => onUpdateData({ borderColor: v })} />
                        )}
                    </div>
                )}
            </div>

            {/* Carrusel + flechas — en columnas compactas */}
            {(selectedTpl.props.includes('autoScroll') || selectedTpl.props.includes('arrows')) && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {selectedTpl.props.includes('autoScroll') && (
                        <div className="rounded-lg border bg-primary/5 p-3 space-y-2">
                            <div className="flex items-center justify-between">
                                <Label className="text-[12px] font-bold flex items-center gap-1.5">
                                    <Sparkles className="size-3.5 text-primary" /> Carrusel automático
                                </Label>
                                <Switch checked={!!data.autoScroll} onCheckedChange={(v) => onUpdateData({ autoScroll: v })} />
                            </div>
                            {data.autoScroll && (
                                <div className="space-y-2">
                                    {/* Mode selector */}
                                    <div className="grid grid-cols-2 gap-1 p-0.5 bg-background rounded-md border">
                                        <button
                                            onClick={() => onUpdateData({ scrollMode: 'step' })}
                                            className={'h-7 rounded text-[11px] font-semibold transition-colors ' + ((data.scrollMode || 'step') === 'step' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:bg-accent')}
                                        >
                                            Con pausas
                                        </button>
                                        <button
                                            onClick={() => onUpdateData({ scrollMode: 'continuous' })}
                                            className={'h-7 rounded text-[11px] font-semibold transition-colors ' + (data.scrollMode === 'continuous' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:bg-accent')}
                                        >
                                            Continuo
                                        </button>
                                    </div>
                                    {data.scrollMode === 'continuous' ? (
                                        <div className="space-y-1">
                                            <div className="flex justify-between">
                                                <Label className="text-[11px] text-muted-foreground">Velocidad</Label>
                                                <span className="text-[11px] font-mono text-primary">{data.scrollSpeed ?? 60} px/s</span>
                                            </div>
                                            <input type="range" min={10} max={200} step={5} value={data.scrollSpeed ?? 60} onChange={(e) => onUpdateData({ scrollSpeed: parseInt(e.target.value) })} className="w-full accent-primary" />
                                            <div className="text-[10px] text-muted-foreground flex justify-between"><span>Lento</span><span>Rápido</span></div>
                                        </div>
                                    ) : (
                                        <div className="space-y-1">
                                            <div className="flex justify-between">
                                                <Label className="text-[11px] text-muted-foreground">Pausa entre saltos</Label>
                                                <span className="text-[11px] font-mono text-primary">{(data.autoScrollDelay ?? 4000) / 1000}s</span>
                                            </div>
                                            <input type="range" min={1500} max={12000} step={500} value={data.autoScrollDelay ?? 4000} onChange={(e) => onUpdateData({ autoScrollDelay: parseInt(e.target.value) })} className="w-full accent-primary" />
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                    {selectedTpl.props.includes('arrows') && (
                        <div className="rounded-lg border bg-card p-3 space-y-2">
                            <div className="flex items-center justify-between">
                                <Label className="text-[12px] font-bold">Flechas de navegación</Label>
                                <Switch checked={data.showNavArrows !== false} onCheckedChange={(v) => onUpdateData({ showNavArrows: v })} />
                            </div>
                            {data.showNavArrows !== false && (
                                <div className="grid grid-cols-2 gap-2">
                                    <ColorField label="Color" value={data.navArrowColor || '#ffffff'} onChange={(v) => onUpdateData({ navArrowColor: v })} />
                                    <div className="space-y-1">
                                        <Label className="text-[11px] text-muted-foreground">Tamaño</Label>
                                        <Select value={data.navArrowSize || 'md'} onValueChange={(v) => v && onUpdateData({ navArrowSize: v })}>
                                            <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="sm">Chico</SelectItem>
                                                <SelectItem value="md">Medio</SelectItem>
                                                <SelectItem value="lg">Grande</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

// ==============================
// Advanced tab — grid, gap, widget name (in columns)
// ==============================
const AdvancedTab: React.FC<{ data: any; onUpdateData: (p: any) => void; widget: any }> = ({ data, onUpdateData }) => {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Grilla */}
            <div className="rounded-lg border bg-card p-3 space-y-2">
                <div className="flex items-center gap-1.5">
                    <Grid3X3 className="size-3.5 text-primary" />
                    <Label className="text-[12px] font-bold">Grilla del menú</Label>
                </div>
                <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                        <Label className="text-[11px] text-muted-foreground flex items-center gap-1">
                            Columnas
                            <Tooltip>
                                <TooltipTrigger><Info className="size-3 text-muted-foreground/60 cursor-help" /></TooltipTrigger>
                                <TooltipContent side="top">Cuántas categorías se muestran lado a lado</TooltipContent>
                            </Tooltip>
                        </Label>
                        <Select value={String(data.columns || 3)} onValueChange={(v) => v && onUpdateData({ columns: parseInt(v) })}>
                            <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                            <SelectContent>{[1,2,3,4,5,6].map(n => <SelectItem key={n} value={String(n)}>{n} col{n>1?'s':''}</SelectItem>)}</SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-1">
                        <Label className="text-[11px] text-muted-foreground flex items-center gap-1">
                            Filas
                            <Tooltip>
                                <TooltipTrigger><Info className="size-3 text-muted-foreground/60 cursor-help" /></TooltipTrigger>
                                <TooltipContent side="top">0 = auto, se ajusta al contenido</TooltipContent>
                            </Tooltip>
                        </Label>
                        <Select value={String(data.rows || 0)} onValueChange={(v) => v != null && onUpdateData({ rows: parseInt(v) })}>
                            <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="0">Auto</SelectItem>
                                {[1,2,3,4,5].map(n => <SelectItem key={n} value={String(n)}>{n} fila{n>1?'s':''}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                <div className="space-y-1 pt-2 border-t">
                    <div className="flex justify-between">
                        <Label className="text-[11px] text-muted-foreground">Separación</Label>
                        <span className="text-[11px] font-mono text-primary">{data.itemGap ?? 12}px</span>
                    </div>
                    <input type="range" min={0} max={60} step={2} value={data.itemGap ?? 12} onChange={(e) => onUpdateData({ itemGap: parseInt(e.target.value) })} className="w-full accent-primary" />
                </div>
            </div>

            {/* Layout mode + widget name */}
            <div className="rounded-lg border bg-card p-3 space-y-2">
                <div className="flex items-center gap-1.5">
                    <Maximize className="size-3.5 text-primary" />
                    <Label className="text-[12px] font-bold">Disposición</Label>
                </div>
                <div className="space-y-1">
                    <Label className="text-[11px] text-muted-foreground flex items-center gap-1">
                        Modo
                        <Tooltip>
                            <TooltipTrigger><Info className="size-3 text-muted-foreground/60 cursor-help" /></TooltipTrigger>
                            <TooltipContent side="top">Horizontal = carrusel; Grilla = filas × columnas</TooltipContent>
                        </Tooltip>
                    </Label>
                    <Select value={data.layout || 'HORIZONTAL'} onValueChange={(v) => v && onUpdateData({ layout: v })}>
                        <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="HORIZONTAL">Carrusel horizontal</SelectItem>
                            <SelectItem value="GRID">Grilla (rows × cols)</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-1">
                    <Label className="text-[11px] text-muted-foreground">Nombre interno</Label>
                    <Input value={data.widgetName || ''} onChange={(e) => onUpdateData({ widgetName: e.target.value })} placeholder="Ej: Menu principal spa" className="h-9 text-xs" />
                </div>
            </div>
        </div>
    );
};

export default CategoryNavPanel;
