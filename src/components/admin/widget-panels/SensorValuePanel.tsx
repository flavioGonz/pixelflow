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
    allSensors: any[];
}

export const SensorValuePanel: React.FC<Props> = ({ selectedWidget, updateSelectedWidgetData, savedLayouts, allSensors }) => {
    return (

                                                    <div className="space-y-3">

                                                        {/* Fila superior: Sensor + Etiqueta */}
                                                        <div className="rounded-lg border bg-card p-4 space-y-3">
                                                            <div className="flex items-center justify-between">
                                                                <h4 className="text-[13px] font-bold flex items-center gap-2">
                                                                    <span className="size-6 rounded grid place-items-center bg-emerald-500/10 text-emerald-500"><Radio className="size-3.5" /></span>
                                                                    Fuente de datos
                                                                </h4>
                                                                <a href="/admin/sensors" target="_blank" rel="noreferrer" className="text-[11px] text-primary hover:underline flex items-center gap-1">
                                                                    Gestionar sensores <ExternalLink className="size-3" />
                                                                </a>
                                                            </div>
                                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                                                <div className="space-y-1">
                                                                    <Label className="text-[11px] text-muted-foreground">Sensor a mostrar</Label>
                                                                    <Select value={selectedWidget.data.sensorId || 'NONE'} onValueChange={(v) => v && updateSelectedWidgetData({ sensorId: v === 'NONE' ? '' : v })}>
                                                                        <SelectTrigger className="h-9 text-xs"><SelectValue placeholder="Elegí un sensor..." /></SelectTrigger>
                                                                        <SelectContent>
                                                                            <SelectItem value="NONE"><span className="text-muted-foreground">Sin sensor</span></SelectItem>
                                                                            {(allSensors || []).map((s: any) => (
                                                                                <SelectItem key={s._id} value={s._id}>
                                                                                    <span className="flex items-center gap-2">
                                                                                        <span className={'size-1.5 rounded-full ' + (s.isOnline ? 'bg-emerald-500' : 'bg-muted-foreground/40')} />
                                                                                        <span className="font-medium">{s.name}</span>
                                                                                        <span className="text-[10px] text-muted-foreground">{s.kind}</span>
                                                                                    </span>
                                                                                </SelectItem>
                                                                            ))}
                                                                        </SelectContent>
                                                                    </Select>
                                                                </div>
                                                                <div className="space-y-1">
                                                                    <Label className="text-[11px] text-muted-foreground">Etiqueta visible</Label>
                                                                    <Input value={selectedWidget.data.label || ''} onChange={(e) => updateSelectedWidgetData({ label: e.target.value })} placeholder="Ej: Piscina 1 · Temperatura" className="h-9 text-xs" />
                                                                </div>
                                                                <div className="space-y-1">
                                                                    <Label className="text-[11px] text-muted-foreground">Unidad (override)</Label>
                                                                    <Input value={selectedWidget.data.unitOverride || ''} onChange={(e) => updateSelectedWidgetData({ unitOverride: e.target.value })} placeholder="°C, %, W, ..." className="h-9 text-xs font-mono" />
                                                                </div>
                                                                <div className="space-y-1">
                                                                    <Label className="text-[11px] text-muted-foreground">Decimales</Label>
                                                                    <Input type="number" min={0} max={4} value={selectedWidget.data.precision ?? 1} onChange={(e) => updateSelectedWidgetData({ precision: parseInt(e.target.value) })} className="h-9 text-xs font-mono" />
                                                                </div>
                                                            </div>
                                                            <div className="grid grid-cols-3 gap-2 pt-2 border-t">
                                                                <div className="flex items-center justify-between rounded-md border bg-background px-2.5 h-9">
                                                                    <Label className="text-[11px]">Mostrar etiqueta</Label>
                                                                    <Switch checked={selectedWidget.data.showLabel !== false} onCheckedChange={(v) => updateSelectedWidgetData({ showLabel: v })} />
                                                                </div>
                                                                <div className="flex items-center justify-between rounded-md border bg-background px-2.5 h-9">
                                                                    <Label className="text-[11px]">Mostrar unidad</Label>
                                                                    <Switch checked={selectedWidget.data.showUnit !== false} onCheckedChange={(v) => updateSelectedWidgetData({ showUnit: v })} />
                                                                </div>
                                                                <div className="flex items-center justify-between rounded-md border bg-background px-2.5 h-9">
                                                                    <Label className="text-[11px]">Mostrar icono</Label>
                                                                    <Switch checked={selectedWidget.data.showIcon !== false} onCheckedChange={(v) => updateSelectedWidgetData({ showIcon: v })} />
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* 3 columnas: Estilo visual | Tipografía y color | Umbrales y animaciones */}
                                                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">

                                                            {/* COL 1 · ESTILO VISUAL */}
                                                            <div className="rounded-lg border bg-card p-3 space-y-2.5">
                                                                <div className="flex items-center gap-1.5">
                                                                    <span className="size-5 rounded grid place-items-center bg-fuchsia-500/10 text-fuchsia-500"><Sparkles className="size-3" /></span>
                                                                    <Label className="text-[12px] font-bold">Estilo visual</Label>
                                                                </div>
                                                                <div className="grid grid-cols-2 gap-1.5 max-h-[380px] overflow-y-auto custom-scrollbar pr-1">
                                                                    {[
                                                                        { v: 'card',    name: 'Card',    desc: 'Glass + gradient' },
                                                                        { v: 'minimal', name: 'Minimal', desc: 'Solo número' },
                                                                        { v: 'circle',  name: 'Circle',  desc: 'Anillo con borde' },
                                                                        { v: 'strip',   name: 'Strip',   desc: 'Tira horizontal' },
                                                                        { v: 'gauge',   name: 'Gauge',   desc: 'Semicírculo' },
                                                                        { v: 'led',     name: 'LED',     desc: 'Display 7-seg' },
                                                                        { v: 'big',     name: 'Big',     desc: 'Solo cifra XL' },
                                                                        { v: 'chip',    name: 'Chip',    desc: 'Píldora compacta' },
                                                                        { v: 'neon',    name: 'Neon',    desc: 'Glow tubular' },
                                                                        { v: 'meter',   name: 'Meter',   desc: 'Barra + rango' },
                                                                    ].map(t => {
                                                                        const active = (selectedWidget.data.theme || 'card') === t.v;
                                                                        return (
                                                                            <button key={t.v} onClick={() => updateSelectedWidgetData({ theme: t.v })}
                                                                                className={'group rounded-md border p-1.5 text-left transition-all ' + (active ? 'border-primary bg-primary/5 ring-1 ring-primary/30' : 'border-border bg-background hover:border-primary/40')}
                                                                            >
                                                                                <div className="h-7 mb-1 rounded flex items-center justify-center text-[9px] font-black tabular-nums" style={{ background: (selectedWidget.data.color || '#3b82f6') + '22', color: selectedWidget.data.color || '#3b82f6' }}>
                                                                                    {t.v === 'chip' ? '≡' : t.v === 'gauge' ? '◐' : t.v === 'meter' ? '▬▬' : t.v === 'circle' ? '◯' : '23.4'}
                                                                                </div>
                                                                                <div className="text-[10px] font-semibold truncate flex items-center gap-1">{t.name}{active && <span className="text-primary text-[10px] font-bold">✓</span>}</div>
                                                                                <div className="text-[9px] text-muted-foreground truncate leading-tight">{t.desc}</div>
                                                                            </button>
                                                                        );
                                                                    })}
                                                                </div>
                                                            </div>

                                                            {/* COL 2 · TIPOGRAFÍA Y COLOR */}
                                                            <div className="rounded-lg border bg-card p-3 space-y-2.5">
                                                                <div className="flex items-center gap-1.5">
                                                                    <span className="size-5 rounded grid place-items-center bg-sky-500/10 text-sky-500"><Type className="size-3" /></span>
                                                                    <Label className="text-[12px] font-bold">Tipografía y color</Label>
                                                                </div>
                                                                <div className="space-y-1">
                                                                    <Label className="text-[11px] text-muted-foreground">Icono</Label>
                                                                    <Select value={selectedWidget.data.icon || 'Thermometer'} onValueChange={(v) => v && updateSelectedWidgetData({ icon: v })}>
                                                                        <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                                                                        <SelectContent>
                                                                            <SelectItem value="Thermometer">🌡️ Termómetro</SelectItem>
                                                                            <SelectItem value="Droplets">💧 Gotas (humedad)</SelectItem>
                                                                            <SelectItem value="Zap">⚡ Rayo (energía)</SelectItem>
                                                                            <SelectItem value="Radio">📡 Radio</SelectItem>
                                                                            <SelectItem value="Wind">💨 Viento</SelectItem>
                                                                            <SelectItem value="Waves">🌊 Piscina</SelectItem>
                                                                            <SelectItem value="Sun">☀ Sol</SelectItem>
                                                                            <SelectItem value="Cloud">☁ Nube</SelectItem>
                                                                            <SelectItem value="Flame">🔥 Llama</SelectItem>
                                                                            <SelectItem value="Gauge">📊 Gauge</SelectItem>
                                                                        </SelectContent>
                                                                    </Select>
                                                                </div>
                                                                <div className="space-y-1">
                                                                    <Label className="text-[11px] text-muted-foreground">Fuente</Label>
                                                                    <Select value={selectedWidget.data.fontFamily || 'sans'} onValueChange={(v) => v && updateSelectedWidgetData({ fontFamily: v })}>
                                                                        <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                                                                        <SelectContent>
                                                                            <SelectItem value="sans">Sans (moderna)</SelectItem>
                                                                            <SelectItem value="mono">Mono (técnica)</SelectItem>
                                                                            <SelectItem value="display">Display (serif)</SelectItem>
                                                                        </SelectContent>
                                                                    </Select>
                                                                </div>
                                                                <div className="space-y-1">
                                                                    <Label className="text-[11px] text-muted-foreground">Color acento</Label>
                                                                    <div className="h-9 flex items-center gap-2 rounded-md border bg-background px-2">
                                                                        <input type="color" value={selectedWidget.data.color || '#3b82f6'} onChange={(e) => updateSelectedWidgetData({ color: e.target.value })} className="size-6 rounded cursor-pointer border-0 bg-transparent shrink-0" />
                                                                        <span className="font-mono text-[10px] text-muted-foreground truncate">{(selectedWidget.data.color || '#3b82f6').toUpperCase()}</span>
                                                                    </div>
                                                                </div>
                                                                <div className="rounded-md border border-dashed bg-muted/30 p-2 space-y-2">
                                                                    <div className="flex items-center justify-between">
                                                                        <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Tamaños</Label>
                                                                        <span className="text-[9px] text-muted-foreground">0 = auto</span>
                                                                    </div>
                                                                    <div className="grid grid-cols-2 gap-2">
                                                                        <div className="space-y-1">
                                                                            <Label className="text-[11px] text-muted-foreground">Escala global ×</Label>
                                                                            <Input type="number" min={0.2} max={4} step={0.1} value={selectedWidget.data.contentScale ?? 1} onChange={(e) => updateSelectedWidgetData({ contentScale: parseFloat(e.target.value) || 1 })} placeholder="1.0" className="h-9 text-xs font-mono" />
                                                                        </div>
                                                                        <div className="space-y-1">
                                                                            <Label className="text-[11px] text-muted-foreground">Icono (px)</Label>
                                                                            <Input type="number" min={0} max={400} value={selectedWidget.data.iconSize ?? 0} onChange={(e) => updateSelectedWidgetData({ iconSize: parseInt(e.target.value) || 0 })} placeholder="auto" className="h-9 text-xs font-mono" />
                                                                        </div>
                                                                        <div className="space-y-1">
                                                                            <Label className="text-[11px] text-muted-foreground">Valor (px)</Label>
                                                                            <Input type="number" min={0} max={400} value={selectedWidget.data.valueFontSize ?? 0} onChange={(e) => updateSelectedWidgetData({ valueFontSize: parseInt(e.target.value) || 0 })} placeholder="auto" className="h-9 text-xs font-mono" />
                                                                        </div>
                                                                        <div className="space-y-1">
                                                                            <Label className="text-[11px] text-muted-foreground">Etiqueta (px)</Label>
                                                                            <Input type="number" min={0} max={200} value={selectedWidget.data.labelFontSize ?? 0} onChange={(e) => updateSelectedWidgetData({ labelFontSize: parseInt(e.target.value) || 0 })} placeholder="auto" className="h-9 text-xs font-mono" />
                                                                        </div>
                                                                        <div className="space-y-1 col-span-2">
                                                                            <Label className="text-[11px] text-muted-foreground">Unidad (px)</Label>
                                                                            <Input type="number" min={0} max={200} value={selectedWidget.data.unitFontSize ?? 0} onChange={(e) => updateSelectedWidgetData({ unitFontSize: parseInt(e.target.value) || 0 })} placeholder="auto" className="h-9 text-xs font-mono" />
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            {/* COL 3 · UMBRALES Y ANIMACIONES */}
                                                            <div className="rounded-lg border bg-card p-3 space-y-2.5">
                                                                <div className="flex items-center gap-1.5">
                                                                    <span className="size-5 rounded grid place-items-center bg-amber-500/10 text-amber-500"><AlertCircle className="size-3" /></span>
                                                                    <Label className="text-[12px] font-bold">Umbrales y efectos</Label>
                                                                </div>
                                                                {(selectedWidget.data.theme === 'gauge' || selectedWidget.data.theme === 'meter') && (
                                                                    <div className="grid grid-cols-2 gap-2">
                                                                        <div className="space-y-1">
                                                                            <Label className="text-[11px] text-muted-foreground">Mín</Label>
                                                                            <Input type="number" value={selectedWidget.data.min ?? 0} onChange={(e) => updateSelectedWidgetData({ min: parseFloat(e.target.value) })} className="h-9 text-xs font-mono" />
                                                                        </div>
                                                                        <div className="space-y-1">
                                                                            <Label className="text-[11px] text-muted-foreground">Máx</Label>
                                                                            <Input type="number" value={selectedWidget.data.max ?? 100} onChange={(e) => updateSelectedWidgetData({ max: parseFloat(e.target.value) })} className="h-9 text-xs font-mono" />
                                                                        </div>
                                                                    </div>
                                                                )}
                                                                <div className="grid grid-cols-2 gap-2 pt-1 border-t">
                                                                    <div className="space-y-1">
                                                                        <Label className="text-[11px] text-muted-foreground">Umbral bajo</Label>
                                                                        <Input type="number" value={selectedWidget.data.lowThreshold ?? ''} onChange={(e) => updateSelectedWidgetData({ lowThreshold: e.target.value === '' ? null : parseFloat(e.target.value) })} className="h-9 text-xs font-mono" placeholder="—" />
                                                                    </div>
                                                                    <div className="space-y-1">
                                                                        <Label className="text-[11px] text-muted-foreground">Color bajo</Label>
                                                                        <div className="h-9 flex items-center gap-2 rounded-md border bg-background px-2">
                                                                            <input type="color" value={selectedWidget.data.lowColor || '#3b82f6'} onChange={(e) => updateSelectedWidgetData({ lowColor: e.target.value })} className="size-6 rounded cursor-pointer border-0 bg-transparent shrink-0" />
                                                                        </div>
                                                                    </div>
                                                                    <div className="space-y-1">
                                                                        <Label className="text-[11px] text-muted-foreground">Umbral alto</Label>
                                                                        <Input type="number" value={selectedWidget.data.highThreshold ?? ''} onChange={(e) => updateSelectedWidgetData({ highThreshold: e.target.value === '' ? null : parseFloat(e.target.value) })} className="h-9 text-xs font-mono" placeholder="—" />
                                                                    </div>
                                                                    <div className="space-y-1">
                                                                        <Label className="text-[11px] text-muted-foreground">Color alto</Label>
                                                                        <div className="h-9 flex items-center gap-2 rounded-md border bg-background px-2">
                                                                            <input type="color" value={selectedWidget.data.highColor || '#ef4444'} onChange={(e) => updateSelectedWidgetData({ highColor: e.target.value })} className="size-6 rounded cursor-pointer border-0 bg-transparent shrink-0" />
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                                <div className="flex items-center justify-between rounded-md border bg-background px-2.5 h-9">
                                                                    <Label className="text-[11px]">Pulso si online</Label>
                                                                    <Switch checked={!!selectedWidget.data.pulseWhenOnline} onCheckedChange={(v) => updateSelectedWidgetData({ pulseWhenOnline: v })} />
                                                                </div>
                                                                <div className="flex items-center justify-between rounded-md border bg-background px-2.5 h-9">
                                                                    <Label className="text-[11px]">Blink al cambiar</Label>
                                                                    <Switch checked={!!selectedWidget.data.blinkOnChange} onCheckedChange={(v) => updateSelectedWidgetData({ blinkOnChange: v })} />
                                                                </div>
                                                            </div>

                                                        </div>
                                                    </div>
    );
};

export default SensorValuePanel;
