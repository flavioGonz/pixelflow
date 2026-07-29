'use client';

import * as React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { ImageUpload } from '@/components/builder/ImageUpload';
import {
    Radio, AlertCircle, ExternalLink, Sparkles, Type, Zap, Palette,
    Image as ImageIcon, ArrowLeft, Home, ChevronRight, Play, Info,
} from 'lucide-react';

interface Props {
    selectedWidget: any;
    updateSelectedWidgetData: (patch: any) => void;
    savedLayouts: any[];
    
}

export const NavButtonPanel: React.FC<Props> = ({ selectedWidget, updateSelectedWidgetData, savedLayouts }) => {
    return (

                                                    <div className="space-y-3">

                                                        {/* Fila superior: Contenido y acción (todo el ancho, 4 cols internas) */}
                                                        <div className="rounded-lg border bg-card p-4 space-y-3">
                                                            <div className="flex items-center justify-between">
                                                                <h4 className="text-[13px] font-bold flex items-center gap-2">
                                                                    <span className="size-6 rounded grid place-items-center bg-primary/10 text-primary"><Zap className="size-3.5" /></span>
                                                                    Contenido y acción
                                                                </h4>
                                                                <span className="text-[10px] text-muted-foreground font-mono uppercase tracking-wider">{selectedWidget.data.type || 'BACK'}</span>
                                                            </div>
                                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2">
                                                                <div className="space-y-1">
                                                                    <Label className="text-[11px] text-muted-foreground flex items-center gap-1"><Type className="size-3 text-primary/70" /> Texto</Label>
                                                                    <Input value={selectedWidget.data.label || ''} onChange={(e) => updateSelectedWidgetData({ label: e.target.value })} placeholder="Ej: VOLVER" className="h-9 text-sm font-semibold" />
                                                                </div>
                                                                <div className="space-y-1">
                                                                    <Label className="text-[11px] text-muted-foreground flex items-center gap-1"><Sparkles className="size-3 text-primary/70" /> Icono</Label>
                                                                    <Select value={selectedWidget.data.icon || 'ArrowLeft'} onValueChange={(v) => v && updateSelectedWidgetData({ icon: v })}>
                                                                        <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                                                                        <SelectContent>
                                                                            <SelectItem value="ArrowLeft">← Flecha atrás</SelectItem>
                                                                            <SelectItem value="ArrowRight">→ Flecha derecha</SelectItem>
                                                                            <SelectItem value="ArrowUp">↑ Flecha arriba</SelectItem>
                                                                            <SelectItem value="ArrowDown">↓ Flecha abajo</SelectItem>
                                                                            <SelectItem value="Home">⌂ Casita</SelectItem>
                                                                            <SelectItem value="ChevronRight">› Chevron derecha</SelectItem>
                                                                            <SelectItem value="ChevronLeft">‹ Chevron izquierda</SelectItem>
                                                                            <SelectItem value="Zap">⚡ Rayo</SelectItem>
                                                                            <SelectItem value="Play">▶ Play</SelectItem>
                                                                            <SelectItem value="Info">ℹ Info</SelectItem>
                                                                            <SelectItem value="Check">✓ Check</SelectItem>
                                                                            <SelectItem value="X">✕ X</SelectItem>
                                                                            <SelectItem value="Menu">☰ Menú</SelectItem>
                                                                            <SelectItem value="Settings">⚙ Settings</SelectItem>
                                                                            <SelectItem value="Star">★ Estrella</SelectItem>
                                                                            <SelectItem value="Heart">♥ Corazón</SelectItem>
                                                                            <SelectItem value="Phone">📞 Teléfono</SelectItem>
                                                                            <SelectItem value="Mail">✉ Mail</SelectItem>
                                                                            <SelectItem value="Search">🔍 Buscar</SelectItem>
                                                                        </SelectContent>
                                                                    </Select>
                                                                </div>
                                                                <div className="space-y-1">
                                                                    <Label className="text-[11px] text-muted-foreground flex items-center gap-1">Tipo de acción</Label>
                                                                    <Select value={selectedWidget.data.type || 'BACK'} onValueChange={(v) => v && updateSelectedWidgetData({ type: v })}>
                                                                        <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                                                                        <SelectContent>
                                                                            <SelectItem value="BACK">Volver atrás</SelectItem>
                                                                            <SelectItem value="HOME">Ir al inicio</SelectItem>
                                                                            <SelectItem value="LINK">Ir a diseño</SelectItem>
                                                                        </SelectContent>
                                                                    </Select>
                                                                </div>
                                                                <div className="space-y-1">
                                                                    <Label className="text-[11px] text-muted-foreground">Diseño destino</Label>
                                                                    {selectedWidget.data.type === 'LINK' || selectedWidget.data.type === 'HOME' ? (
                                                                        <Select value={selectedWidget.data.targetLayoutId || 'NONE'} onValueChange={(v) => updateSelectedWidgetData({ targetLayoutId: v === 'NONE' ? '' : v })}>
                                                                            <SelectTrigger className="h-9 text-xs"><SelectValue placeholder="Elegí un diseño..." /></SelectTrigger>
                                                                            <SelectContent>
                                                                                <SelectItem value="NONE"><span className="text-muted-foreground">Sin destino</span></SelectItem>
                                                                                {savedLayouts.map(l => (<SelectItem key={l._id} value={l._id}>{l.name}</SelectItem>))}
                                                                            </SelectContent>
                                                                        </Select>
                                                                    ) : (
                                                                        <div className="h-9 rounded-md border border-dashed bg-muted/30 grid place-items-center text-[10px] text-muted-foreground italic">N/A para "Volver atrás"</div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* 3 columnas: Estilo | Tipografía+Tamaño | Icono+Fondo */}
                                                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">

                                                            {/* COL 1 · ESTILO DEL BOTÓN */}
                                                            <div className="rounded-lg border bg-card p-3 space-y-2.5">
                                                                <div className="flex items-center justify-between">
                                                                    <h4 className="text-[12px] font-bold flex items-center gap-1.5">
                                                                        <span className="size-5 rounded grid place-items-center bg-fuchsia-500/10 text-fuchsia-500"><Sparkles className="size-3" /></span>
                                                                        Estilo del botón
                                                                    </h4>
                                                                    <span className="text-[10px] text-muted-foreground font-mono uppercase">{(selectedWidget.data.template || 'GLASS')}</span>
                                                                </div>
                                                                <div className="grid grid-cols-2 gap-1.5 max-h-[420px] overflow-y-auto custom-scrollbar pr-1">
                                                                    {[
                                                                        { v: 'SOLID',     name: 'Solid',     desc: 'Clásico lleno' },
                                                                        { v: 'OUTLINE',   name: 'Outline',   desc: 'Solo borde' },
                                                                        { v: 'PILL',      name: 'Pill',      desc: 'Redondeado' },
                                                                        { v: 'GHOST',     name: 'Ghost',     desc: 'Solo texto' },
                                                                        { v: 'ICON_ONLY', name: 'Icon',      desc: 'Solo icono' },
                                                                        { v: 'HERO',      name: 'Hero',      desc: 'Grande CTA' },
                                                                        { v: 'GLASS',     name: 'Glass',     desc: 'Cristal blur' },
                                                                        { v: 'CIRCULAR',  name: 'Circular',  desc: 'Circular' },
                                                                        { v: 'NEON',      name: 'Neon',      desc: 'Neon glow' },
                                                                        { v: 'MINIMAL',   name: 'Minimal',   desc: 'Underline' },
                                                                        { v: '3D',        name: '3D',        desc: 'Relieve' },
                                                                        { v: 'GRADIENT',  name: 'Gradient',  desc: 'Degradado' },
                                                                        { v: 'RETRO',     name: 'Retro',     desc: 'Border 8-bit' },
                                                                        { v: 'SKEWED',    name: 'Skewed',    desc: 'Inclinado' },
                                                                        { v: 'STAMP',     name: 'Stamp',     desc: 'Sello dashed' },
                                                                        { v: 'BEVEL',     name: 'Bevel',     desc: 'Biselado' },
                                                                        { v: 'GLOW',      name: 'Glow',      desc: 'Halo múltiple' },
                                                                        { v: 'EMBOSS',    name: 'Emboss',    desc: 'Neumorfismo' },
                                                                        { v: 'CYBER',     name: 'Cyber',     desc: 'Corte diagonal' },
                                                                    ].map((t) => {
                                                                        const active = (selectedWidget.data.template || 'GLASS') === t.v;
                                                                        return (
                                                                            <button
                                                                                key={t.v}
                                                                                onClick={() => updateSelectedWidgetData({ template: t.v })}
                                                                                className={'group rounded-md border p-1.5 text-left transition-all ' + (active ? 'border-primary bg-primary/5 ring-1 ring-primary/30 shadow-sm' : 'border-border bg-background hover:border-primary/40')}
                                                                            >
                                                                                <div className="h-7 mb-1 rounded flex items-center justify-center text-[9px] font-bold" style={{
                                                                                    background: (t.v === 'SOLID'||t.v==='PILL'||t.v==='3D'||t.v==='HERO'||t.v==='ICON_ONLY'||t.v==='CIRCULAR'||t.v==='GLASS'||t.v==='GRADIENT'||t.v==='RETRO'||t.v==='SKEWED'||t.v==='BEVEL'||t.v==='GLOW') ? (selectedWidget.data.color || '#3b82f6') : 'transparent',
                                                                                    borderRadius: t.v==='PILL'?'9999px':t.v==='CIRCULAR'||t.v==='ICON_ONLY'?'9999px':'4px',
                                                                                    border: (t.v==='OUTLINE'||t.v==='NEON'||t.v==='STAMP') ? '1.5px '+(t.v==='STAMP'?'dashed':'solid')+' '+(selectedWidget.data.color||'#3b82f6') : t.v==='RETRO'?'2px solid #000':undefined,
                                                                                    color: (t.v==='OUTLINE'||t.v==='NEON'||t.v==='GHOST'||t.v==='MINIMAL'||t.v==='STAMP'||t.v==='CYBER'||t.v==='EMBOSS') ? (selectedWidget.data.color||'#3b82f6') : '#fff',
                                                                                    boxShadow: t.v==='NEON'?'0 0 6px '+(selectedWidget.data.color||'#3b82f6')+'aa':t.v==='3D'?'0 3px 0 rgba(0,0,0,0.25)':t.v==='GLOW'?'0 0 12px '+(selectedWidget.data.color||'#3b82f6'):t.v==='RETRO'?'3px 3px 0 #000':undefined,
                                                                                    transform: t.v==='SKEWED'?'skewX(-8deg)':undefined,
                                                                                    fontFamily: t.v==='RETRO'||t.v==='CYBER'?'"Courier New",monospace':undefined,
                                                                                }}>
                                                                                    {t.v === 'ICON_ONLY' ? '✱' : 'Aa'}
                                                                                </div>
                                                                                <div className="text-[10px] font-semibold truncate flex items-center gap-1">{t.name}{active && <span className='text-primary text-[10px] font-bold'>✓</span>}</div>
                                                                                <div className="text-[9px] text-muted-foreground truncate leading-tight">{t.desc}</div>
                                                                            </button>
                                                                        );
                                                                    })}
                                                                </div>
                                                            </div>

                                                            {/* COL 2 · TIPOGRAFÍA Y TAMAÑO */}
                                                            <div className="rounded-lg border bg-card p-3 space-y-2.5">
                                                                <h4 className="text-[12px] font-bold flex items-center gap-1.5">
                                                                    <span className="size-5 rounded grid place-items-center bg-sky-500/10 text-sky-500"><Type className="size-3" /></span>
                                                                    Tipografía y tamaño
                                                                </h4>
                                                                <div className="space-y-1">
                                                                    <Label className="text-[11px] text-muted-foreground">Tamaño del texto</Label>
                                                                    <Select value={selectedWidget.data.fontSize || 'md'} onValueChange={(v) => v && updateSelectedWidgetData({ fontSize: v })}>
                                                                        <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                                                                        <SelectContent>
                                                                            <SelectItem value="xs">XS · 12px</SelectItem>
                                                                            <SelectItem value="sm">S · 14px</SelectItem>
                                                                            <SelectItem value="md">M · 16px</SelectItem>
                                                                            <SelectItem value="lg">L · 20px</SelectItem>
                                                                            <SelectItem value="xl">XL · 24px</SelectItem>
                                                                            <SelectItem value="2xl">2XL · 32px</SelectItem>
                                                                        </SelectContent>
                                                                    </Select>
                                                                </div>
                                                                <div className="space-y-1">
                                                                    <Label className="text-[11px] text-muted-foreground">Peso</Label>
                                                                    <Select value={selectedWidget.data.fontWeight || 'bold'} onValueChange={(v) => v && updateSelectedWidgetData({ fontWeight: v })}>
                                                                        <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                                                                        <SelectContent>
                                                                            <SelectItem value="normal">Normal</SelectItem>
                                                                            <SelectItem value="medium">Medium</SelectItem>
                                                                            <SelectItem value="semibold">Semi bold</SelectItem>
                                                                            <SelectItem value="bold">Bold</SelectItem>
                                                                            <SelectItem value="black">Extra bold</SelectItem>
                                                                        </SelectContent>
                                                                    </Select>
                                                                </div>
                                                                <div className="space-y-1">
                                                                    <Label className="text-[11px] text-muted-foreground">Posición del icono</Label>
                                                                    <Select value={selectedWidget.data.iconPosition || 'left'} onValueChange={(v) => v && updateSelectedWidgetData({ iconPosition: v })}>
                                                                        <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                                                                        <SelectContent>
                                                                            <SelectItem value="left">Izquierda del texto</SelectItem>
                                                                            <SelectItem value="right">Derecha del texto</SelectItem>
                                                                            <SelectItem value="top">Arriba (columna)</SelectItem>
                                                                            <SelectItem value="none">Sin icono</SelectItem>
                                                                        </SelectContent>
                                                                    </Select>
                                                                </div>
                                                                <div className="space-y-1">
                                                                    <div className="flex justify-between">
                                                                        <Label className="text-[11px] text-muted-foreground">Radio de borde</Label>
                                                                        <span className="text-[10px] font-mono text-primary">{selectedWidget.data.borderRadius ?? 12}px</span>
                                                                    </div>
                                                                    <input type="range" min={0} max={40} step={1} value={selectedWidget.data.borderRadius ?? 12} onChange={(e) => updateSelectedWidgetData({ borderRadius: parseInt(e.target.value) })} className="w-full accent-primary" />
                                                                </div>
                                                                <div className="flex items-center justify-between rounded-md border bg-background px-2.5 h-9">
                                                                    <Label className="text-[11px]">Sombra</Label>
                                                                    <Switch checked={selectedWidget.data.shadow !== false} onCheckedChange={(v) => updateSelectedWidgetData({ shadow: v })} />
                                                                </div>
                                                            </div>

                                                            {/* COL 3 · COLORES + ICONO PROPIO */}
                                                            <div className="rounded-lg border bg-card p-3 space-y-2.5">
                                                                <h4 className="text-[12px] font-bold flex items-center gap-1.5">
                                                                    <span className="size-5 rounded grid place-items-center bg-rose-500/10 text-rose-500"><Palette className="size-3" /></span>
                                                                    Colores e icono
                                                                </h4>
                                                                <div className="space-y-1">
                                                                    <Label className="text-[11px] text-muted-foreground">Color de acento</Label>
                                                                    <div className="h-9 flex items-center gap-2 rounded-md border bg-background px-2">
                                                                        <input type="color" value={selectedWidget.data.color || '#3b82f6'} onChange={(e) => updateSelectedWidgetData({ color: e.target.value })} className="size-6 rounded cursor-pointer border-0 bg-transparent shrink-0" />
                                                                        <span className="font-mono text-[10px] text-muted-foreground truncate">{(selectedWidget.data.color || '#3b82f6').toUpperCase()}</span>
                                                                    </div>
                                                                </div>
                                                                <div className="space-y-1">
                                                                    <Label className="text-[11px] text-muted-foreground">Color del texto (override)</Label>
                                                                    <div className="h-9 flex items-center gap-2 rounded-md border bg-background px-2">
                                                                        <input type="color" value={selectedWidget.data.textColor || '#ffffff'} onChange={(e) => updateSelectedWidgetData({ textColor: e.target.value })} className="size-6 rounded cursor-pointer border-0 bg-transparent shrink-0" />
                                                                        <span className="font-mono text-[10px] text-muted-foreground truncate flex-1">{(selectedWidget.data.textColor || 'auto').toUpperCase()}</span>
                                                                        <button onClick={() => updateSelectedWidgetData({ textColor: '' })} className="text-[10px] text-muted-foreground hover:text-destructive">×</button>
                                                                    </div>
                                                                </div>
                                                                <div className="pt-2 border-t space-y-1.5">
                                                                    <Label className="text-[11px] text-muted-foreground">Icono personalizado (imagen)</Label>
                                                                    <div className="flex items-start gap-2">
                                                                        <div className="size-14 rounded-md border bg-muted overflow-hidden grid place-items-center shrink-0">
                                                                            {selectedWidget.data.customIcon
                                                                                ? <img src={selectedWidget.data.customIcon} className="w-full h-full object-contain p-1" />
                                                                                : <ImageIcon className="size-5 text-muted-foreground/40" />}
                                                                        </div>
                                                                        <div className="flex-1 space-y-1 min-w-0">
                                                                            <ImageUpload compact label={selectedWidget.data.customIcon ? 'Cambiar' : 'Subir imagen'} onUploadSuccess={(url) => updateSelectedWidgetData({ customIcon: url })} />
                                                                            {selectedWidget.data.customIcon && (
                                                                                <Button size="sm" variant="ghost" className="h-6 w-full text-[10px] text-muted-foreground" onClick={() => updateSelectedWidgetData({ customIcon: '' })}>Quitar</Button>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                                <div className="pt-2 border-t space-y-1">
                                                                    <Label className="text-[11px] text-muted-foreground">Nombre interno</Label>
                                                                    <Input value={selectedWidget.data.widgetName || ''} onChange={(e) => updateSelectedWidgetData({ widgetName: e.target.value })} placeholder="Ej: Botón volver" className="h-9 text-xs" />
                                                                </div>
                                                            </div>

                                                        </div>
                                                    </div>
    );
};

export default NavButtonPanel;
