'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Toaster, toast } from 'sonner';
import * as Icons from 'lucide-react';
import Plus from 'lucide-react/dist/esm/icons/plus';
import Trash2 from 'lucide-react/dist/esm/icons/trash-2';
import ArrowUp from 'lucide-react/dist/esm/icons/arrow-up';
import ArrowDown from 'lucide-react/dist/esm/icons/arrow-down';
import Menu from 'lucide-react/dist/esm/icons/menu';
import { BottomNav, BottomNavConfig, BottomNavItem } from '@/components/player/BottomNav';

const strval = (v: any, def = ''): string => (typeof v === 'string' && v ? v : def);

const ICON_CHOICES = ['Home', 'Menu', 'Utensils', 'BedDouble', 'Waves', 'Coffee', 'ShoppingBag', 'MapPin', 'Info', 'Calendar', 'Phone', 'Wifi', 'Star', 'Heart', 'ArrowLeft', 'Music', 'Camera', 'Users', 'ChefHat', 'Trees', 'Sun', 'Umbrella', 'Sparkles', 'Gift'];

export default function BottomNavPage() {
    const [config, setConfig] = useState<BottomNavConfig>({ enabled: false, showLabels: true, accentColor: '#0ea5e9', theme: 'glass', items: [] });
    const [layouts, setLayouts] = useState<Array<{ _id: string; name: string }>>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [dirty, setDirty] = useState(false);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const [rc, rl] = await Promise.all([
                fetch('/api/settings/bottomnav').then(r => r.json()),
                fetch('/api/layouts').then(r => r.json()),
            ]);
            setConfig({ enabled: false, showLabels: true, accentColor: '#0ea5e9', theme: 'glass', items: [], ...rc });
            setLayouts(rl.map((l: any) => ({ _id: l._id, name: l.name })));
        } catch (e: any) {
            toast.error('Error cargando', { description: e.message });
        } finally { setLoading(false); }
    }, []);

    useEffect(() => { load(); }, [load]);

    const update = (patch: Partial<BottomNavConfig>) => {
        setConfig(prev => ({ ...prev, ...patch }));
        setDirty(true);
    };

    const updateItem = (idx: number, patch: Partial<BottomNavItem>) => {
        const next = [...(config.items || [])];
        next[idx] = { ...next[idx], ...patch };
        update({ items: next });
    };

    const addItem = () => update({ items: [...(config.items || []), { icon: 'Home', label: 'Nuevo', action: 'GO_TO', layoutId: '' }] });
    const removeItem = (idx: number) => update({ items: (config.items || []).filter((_, i) => i !== idx) });
    const moveItem = (idx: number, dir: -1 | 1) => {
        const items = [...(config.items || [])];
        const t = idx + dir;
        if (t < 0 || t >= items.length) return;
        [items[idx], items[t]] = [items[t], items[idx]];
        update({ items });
    };

    const save = async () => {
        setSaving(true);
        try {
            const r = await fetch('/api/settings/bottomnav', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(config),
            });
            if (!r.ok) throw new Error('save failed');
            const saved = await r.json();
            setConfig({ ...config, ...saved });
            setDirty(false);
            toast.success('Barra guardada');
        } catch (e: any) {
            toast.error('Error guardando', { description: e.message });
        } finally { setSaving(false); }
    };

    return (
        <div className="flex-1 flex flex-col min-h-0 bg-background text-foreground">
            <AdminHeader
                title="Barra de navegación"
                subtitle="Configurá una barra flotante global que aparece en todas las interfaces del player."
                icon={<Menu className="size-5" />}
                actions={
                    <Button onClick={save} disabled={!dirty || saving}>
                        {saving ? 'Guardando…' : dirty ? 'Guardar cambios' : 'Guardado'}
                    </Button>
                }
            />
            <div className="flex-1 overflow-y-auto p-6 lg:p-8">
                <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_360px] gap-6">
                    {/* Editor */}
                    <div className="space-y-6">
                        {/* Toggle general */}
                        <div className="rounded-lg border bg-card p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <div className="font-bold">Activar barra flotante</div>
                                    <div className="text-[12px] text-muted-foreground">Si está apagada, no aparece en el player.</div>
                                </div>
                                <Switch checked={!!config.enabled} onCheckedChange={(v) => update({ enabled: v })} />
                            </div>
                        </div>

                        {/* Apariencia */}
                        <div className="rounded-lg border bg-card p-4 space-y-3">
                            <h3 className="font-bold text-[14px]">Apariencia</h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                <div className="space-y-1.5">
                                    <Label className="text-[11px]">Tema</Label>
                                    <Select value={strval(config.theme, 'glass')} onValueChange={(v: string | null) => update({ theme: (v || 'glass') as any })}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="glass">Glass (blur)</SelectItem>
                                            <SelectItem value="solid-dark">Sólido oscuro</SelectItem>
                                            <SelectItem value="solid-light">Sólido claro</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-[11px]">Color de acento</Label>
                                    <div className="flex gap-2 items-center">
                                        <input type="color" value={config.accentColor || '#0ea5e9'} onChange={(e) => update({ accentColor: e.target.value })} className="size-10 rounded border cursor-pointer" />
                                        <Input value={config.accentColor || '#0ea5e9'} onChange={(e) => update({ accentColor: e.target.value })} className="h-9 font-mono text-[12px]" />
                                    </div>
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-[11px] flex items-center justify-between">
                                        Mostrar labels
                                        <Switch checked={config.showLabels !== false} onCheckedChange={(v) => update({ showLabels: v })} />
                                    </Label>
                                    <div className="text-[10px] text-muted-foreground">Textos debajo de cada ícono.</div>
                                </div>
                            </div>
                        </div>

                        {/* Items */}
                        <div className="rounded-lg border bg-card p-4 space-y-3">
                            <div className="flex items-center justify-between">
                                <h3 className="font-bold text-[14px]">Botones ({(config.items || []).length})</h3>
                                <Button size="sm" onClick={addItem} className="gap-1.5"><Plus className="size-3.5" /> Agregar botón</Button>
                            </div>
                            {(config.items || []).length === 0 ? (
                                <div className="text-center py-10 text-muted-foreground text-[13px]">
                                    Sin botones todavía. Agregá el primero para armar la barra.
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {config.items!.map((item, idx) => {
                                        const IconComp: any = (Icons as any)[item.icon || 'Circle'] || Icons.Circle;
                                        return (
                                            <div key={idx} className="grid grid-cols-[auto_100px_1fr_140px_140px_auto] gap-2 items-center p-2 rounded border bg-muted/30">
                                                <div className="size-10 rounded grid place-items-center bg-background border" style={{ color: item.color || undefined }}>
                                                    <IconComp className="size-5" />
                                                </div>
                                                <Select value={strval(item.icon, 'Home')} onValueChange={(v: string | null) => updateItem(idx, { icon: v || 'Home' })}>
                                                    <SelectTrigger className="h-9 text-[11px]"><SelectValue /></SelectTrigger>
                                                    <SelectContent className="max-h-60 overflow-y-auto">
                                                        {ICON_CHOICES.map(ic => <SelectItem key={ic} value={ic}>{ic}</SelectItem>)}
                                                    </SelectContent>
                                                </Select>
                                                <Input value={strval(item.label)} onChange={(e) => updateItem(idx, { label: e.target.value })} placeholder="Etiqueta" className="h-9 text-[12px]" />
                                                <Select value={strval(item.action, 'GO_TO')} onValueChange={(v: string | null) => updateItem(idx, { action: (v || 'GO_TO') as any })}>
                                                    <SelectTrigger className="h-9 text-[11px]"><SelectValue /></SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="GO_TO">Ir a interface</SelectItem>
                                                        <SelectItem value="BACK">← Atrás</SelectItem>
                                                        <SelectItem value="HOME">⌂ Inicio</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                                {item.action === 'GO_TO' ? (
                                                    <Select value={strval(item.layoutId)} onValueChange={(v: string | null) => updateItem(idx, { layoutId: v || '' })}>
                                                        <SelectTrigger className="h-9 text-[11px]"><SelectValue placeholder="— Elegí interface —" /></SelectTrigger>
                                                        <SelectContent className="max-h-60">{layouts.map(l => <SelectItem key={l._id} value={l._id}>{l.name}</SelectItem>)}</SelectContent>
                                                    </Select>
                                                ) : (
                                                    <div className="text-[11px] text-muted-foreground text-center">—</div>
                                                )}
                                                <div className="flex items-center gap-0.5">
                                                    <Button variant="ghost" size="icon" className="size-7" onClick={() => moveItem(idx, -1)} disabled={idx === 0}><ArrowUp className="size-3.5" /></Button>
                                                    <Button variant="ghost" size="icon" className="size-7" onClick={() => moveItem(idx, 1)} disabled={idx === (config.items!.length - 1)}><ArrowDown className="size-3.5" /></Button>
                                                    <Button variant="ghost" size="icon" className="size-7 text-destructive hover:bg-destructive/10" onClick={() => removeItem(idx)}><Trash2 className="size-3.5" /></Button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Preview */}
                    <div className="space-y-3 lg:sticky lg:top-4 lg:self-start">
                        <div className="text-[11px] uppercase tracking-widest text-muted-foreground font-bold">Vista previa</div>
                        <div className="relative aspect-[9/16] rounded-2xl border-4 border-slate-800 overflow-hidden bg-gradient-to-br from-slate-800 to-slate-950">
                            <div className="absolute inset-0 grid place-items-center text-white/40 text-[11px] p-4 text-center">
                                Contenido de la interface
                            </div>
                            <BottomNav config={config} />
                        </div>
                        <div className="text-[10px] text-muted-foreground text-center">
                            Aparecerá así en todas las interfaces del player si está activada.
                        </div>
                    </div>
                </div>
            </div>
            <Toaster />
        </div>
    );
}
