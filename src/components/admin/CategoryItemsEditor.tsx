'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Plus from 'lucide-react/dist/esm/icons/plus';
import Trash2 from 'lucide-react/dist/esm/icons/trash-2';
import ChevronDown from 'lucide-react/dist/esm/icons/chevron-down';
import GripVertical from 'lucide-react/dist/esm/icons/grip-vertical';
import Eye from 'lucide-react/dist/esm/icons/eye';
import EyeOff from 'lucide-react/dist/esm/icons/eye-off';
import ImageIcon from 'lucide-react/dist/esm/icons/image';
import ArrowUp from 'lucide-react/dist/esm/icons/arrow-up';
import ArrowDown from 'lucide-react/dist/esm/icons/arrow-down';
import ArrowLeft from 'lucide-react/dist/esm/icons/arrow-left';
import Home from 'lucide-react/dist/esm/icons/home';
import ExternalLink from 'lucide-react/dist/esm/icons/external-link';
import RefreshCw from 'lucide-react/dist/esm/icons/refresh-cw';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ImageUpload } from '@/components/builder/ImageUpload';

type CatAction = 'GO_TO' | 'BACK' | 'HOME' | 'RELOAD' | 'NONE';

interface CategoryItem {
    id: string;
    label: string;
    icon?: string;
    photo?: string;
    active?: boolean;
    action?: CatAction;
    targetLayoutId?: string;
    overlayColor?: string;
    overlayOpacity?: number;
    textColor?: string;
    textSize?: 'sm' | 'md' | 'lg' | 'xl';
    iconSize?: 'sm' | 'md' | 'lg';
}

interface LayoutOption { _id: string; name: string; }

interface CategoryItemsEditorProps {
    categories: CategoryItem[];
    onChange: (cats: CategoryItem[]) => void;
    savedLayouts: LayoutOption[];
}

const ICONS = ['Utensils', 'Coffee', 'Home', 'Star', 'Users', 'Music', 'Camera', 'Sparkles', 'Zap', 'Heart', 'Gift', 'ShoppingBag'];

const ACTION_LABELS: Record<CatAction, { label: string; icon: React.ElementType; hint: string }> = {
    GO_TO:  { label: 'Ir a interface',      icon: ExternalLink, hint: 'Cambia el player al layout seleccionado' },
    BACK:   { label: 'Volver atrás',        icon: ArrowLeft,    hint: 'Vuelve al layout anterior en el historial' },
    HOME:   { label: 'Ir al inicio',        icon: Home,         hint: 'Vuelve al layout raíz asignado a la pantalla' },
    RELOAD: { label: 'Recargar interface',  icon: RefreshCw,    hint: 'Refresca el layout actual' },
    NONE:   { label: 'Sin acción',          icon: EyeOff,       hint: 'El botón se ve pero no responde al touch' },
};

export const CategoryItemsEditor: React.FC<CategoryItemsEditorProps> = ({ categories, onChange, savedLayouts }) => {
    const [expandedId, setExpandedId] = React.useState<string | null>(categories.length === 1 ? categories[0].id : null);

    const update = (idx: number, patch: Partial<CategoryItem>) => {
        const next = [...categories];
        next[idx] = { ...next[idx], ...patch };
        onChange(next);
    };
    const remove = (idx: number) => onChange(categories.filter((_, i) => i !== idx));
    const move = (idx: number, dir: -1 | 1) => {
        const target = idx + dir;
        if (target < 0 || target >= categories.length) return;
        const next = [...categories];
        [next[idx], next[target]] = [next[target], next[idx]];
        onChange(next);
    };
    const add = () => {
        const newCat: CategoryItem = { id: 'cat-' + Date.now(), label: 'NUEVA SECCION', icon: 'Utensils', active: true, action: 'GO_TO' };
        onChange([...categories, newCat]);
        setExpandedId(newCat.id);
    };

    return (
        <TooltipProvider>
            <div className="space-y-3">
                <div className="flex items-center justify-between">
                    <div className="min-w-0">
                        <h4 className="text-[13px] font-bold flex items-center gap-1.5">
                            <ImageIcon className="size-3.5 text-primary" /> Categorías del menú
                            <Badge variant="secondary" className="text-[11px] h-5 px-2">{categories.length}</Badge>
                        </h4>
                        <p className="text-[12px] text-muted-foreground mt-0.5">
                            Cada categoría es un botón táctil. Click para expandir y editar.
                        </p>
                    </div>
                    <Button size="sm" onClick={add} className="shrink-0">
                        <Plus className="size-4" /> Categoría
                    </Button>
                </div>

                {categories.length === 0 && (
                    <div className="text-center py-10 rounded-md border border-dashed text-muted-foreground">
                        <ImageIcon className="size-7 mx-auto mb-2 opacity-50" />
                        <p className="text-[13px] font-medium mb-2">Sin categorías aún</p>
                        <Button size="sm" variant="outline" onClick={add}><Plus className="size-3.5" /> Crear primera</Button>
                    </div>
                )}

                <div className="space-y-1.5">
                    <AnimatePresence initial={false}>
                        {categories.map((cat, idx) => {
                            const isExpanded = expandedId === cat.id;
                            const linkedLayout = savedLayouts.find((l) => l._id === cat.targetLayoutId);
                            const action = (cat.action || (cat.targetLayoutId ? 'GO_TO' : 'NONE')) as CatAction;
                            const ActionIcon = ACTION_LABELS[action].icon;
                            return (
                                <motion.div key={cat.id} layout initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.2 }}
                                    className="rounded-md border bg-background overflow-hidden">
                                    <div onClick={() => setExpandedId(isExpanded ? null : cat.id)}
                                        className={'flex items-center gap-2 px-3 py-2 cursor-pointer transition-colors ' + (isExpanded ? 'bg-primary/5 border-b' : 'hover:bg-accent/50')}>
                                        <GripVertical className="size-4 text-muted-foreground/50 shrink-0" />
                                        <div className="size-10 rounded-md overflow-hidden bg-muted border shrink-0">
                                            {cat.photo ? <img src={cat.photo} className="w-full h-full object-cover" />
                                                : <div className="w-full h-full grid place-items-center text-muted-foreground/40"><ImageIcon className="size-4" /></div>}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <div className="text-[14px] font-semibold truncate">{cat.label || <span className="text-muted-foreground">Sin nombre</span>}</div>
                                            <div className="flex items-center gap-1.5 mt-0.5">
                                                <Badge variant="secondary" className="text-[10px] h-4 px-1.5 gap-1">
                                                    <ActionIcon className="size-2.5" />
                                                    {ACTION_LABELS[action].label}
                                                </Badge>
                                                {action === 'GO_TO' && linkedLayout && (
                                                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/8 text-primary/80 font-medium truncate max-w-[140px]" title={linkedLayout.name}>{linkedLayout.name}</span>
                                                )}
                                                {cat.active === false && (
                                                    <Badge variant="outline" className="text-[10px] h-4 px-1.5 gap-0.5 border-amber-500/50 bg-amber-500/10 text-amber-700 dark:text-amber-400 font-semibold uppercase tracking-wide"><EyeOff className="size-2.5" /> Oculto</Badge>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-0.5">
                                            <Tooltip><TooltipTrigger onClick={(e) => { e.stopPropagation(); move(idx, -1); }} disabled={idx === 0} className="size-7 grid place-items-center rounded hover:bg-accent disabled:opacity-30 text-muted-foreground"><ArrowUp className="size-3.5" /></TooltipTrigger><TooltipContent>Subir</TooltipContent></Tooltip>
                                            <Tooltip><TooltipTrigger onClick={(e) => { e.stopPropagation(); move(idx, 1); }} disabled={idx === categories.length - 1} className="size-7 grid place-items-center rounded hover:bg-accent disabled:opacity-30 text-muted-foreground"><ArrowDown className="size-3.5" /></TooltipTrigger><TooltipContent>Bajar</TooltipContent></Tooltip>
                                            <Tooltip><TooltipTrigger onClick={(e) => { e.stopPropagation(); if (confirm('Eliminar "' + (cat.label || 'esta categoría') + '"?')) remove(idx); }} className="size-7 grid place-items-center rounded hover:bg-destructive/15 hover:text-destructive text-muted-foreground"><Trash2 className="size-3.5" /></TooltipTrigger><TooltipContent>Eliminar</TooltipContent></Tooltip>
                                            <ChevronDown className={'size-4 text-muted-foreground transition-transform ' + (isExpanded ? 'rotate-180' : '')} />
                                        </div>
                                    </div>

                                    <AnimatePresence>
                                        {isExpanded && (
                                            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.2 }}>
                                                <div className="p-4 bg-gradient-to-b from-muted/30 to-transparent">
                                                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">

                                                        {/* Col 1 — CONTENIDO */}
                                                        <div className="rounded-lg border bg-background/50 p-3 space-y-2">
                                                            <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/80">Contenido</div>
                                                            <div className="flex flex-col items-center gap-2">
                                                                <div className="w-full aspect-square max-w-[130px] rounded-md border bg-muted overflow-hidden grid place-items-center">
                                                                    {cat.photo ? <img src={cat.photo} className="w-full h-full object-cover" /> : <ImageIcon className="size-8 text-muted-foreground/40" />}
                                                                </div>
                                                                <div className="flex items-center gap-1.5 w-full max-w-[130px]">
                                                                    <ImageUpload compact label={cat.photo ? 'Cambiar' : 'Subir'} onUploadSuccess={(url) => update(idx, { photo: url })} />
                                                                    {cat.photo && (<Button size="sm" variant="ghost" className="h-6 px-2 text-[10px] text-muted-foreground shrink-0" onClick={() => update(idx, { photo: '' })}>Quitar</Button>)}
                                                                </div>
                                                            </div>
                                                            <div className="space-y-1">
                                                                <Label htmlFor={'cat-label-' + cat.id} className="text-[11px] text-muted-foreground">Nombre visible</Label>
                                                                <Input id={'cat-label-' + cat.id} value={cat.label} onChange={(e) => update(idx, { label: e.target.value })} placeholder="Ej: GASTRONOMÍA" className="h-9 text-[12px] font-semibold" />
                                                            </div>
                                                            <div className="space-y-1">
                                                                <Label className="text-[11px] text-muted-foreground">Icono</Label>
                                                                <Select value={cat.icon || 'Utensils'} onValueChange={(v) => v && update(idx, { icon: v })}>
                                                                    <SelectTrigger className="h-9 text-[12px]"><SelectValue /></SelectTrigger>
                                                                    <SelectContent>{ICONS.map((i) => <SelectItem key={i} value={i}>{i}</SelectItem>)}</SelectContent>
                                                                </Select>
                                                            </div>
                                                        </div>

                                                        {/* Col 2 — ACCIÓN */}
                                                        <div className="rounded-lg border bg-background/50 p-3 space-y-2">
                                                            <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/80">Acción</div>
                                                            <div className="space-y-1">
                                                                <Label className="text-[11px] text-muted-foreground flex items-center gap-1.5">
                                                                    <ActionIcon className="size-3.5 text-primary" /> Al tocar
                                                                </Label>
                                                                <Select value={action} onValueChange={(v) => v && update(idx, { action: v as CatAction, targetLayoutId: v === 'GO_TO' ? cat.targetLayoutId : '' })}>
                                                                    <SelectTrigger className="h-9 text-[12px]"><SelectValue /></SelectTrigger>
                                                                    <SelectContent>
                                                                        {(Object.keys(ACTION_LABELS) as CatAction[]).map((k) => {
                                                                            const A = ACTION_LABELS[k].icon;
                                                                            return (
                                                                                <SelectItem key={k} value={k}>
                                                                                    <span className="flex items-center gap-2">
                                                                                        <A className="size-3.5" />
                                                                                        {ACTION_LABELS[k].label}
                                                                                    </span>
                                                                                </SelectItem>
                                                                            );
                                                                        })}
                                                                    </SelectContent>
                                                                </Select>
                                                                <p className="text-[10px] text-muted-foreground italic leading-tight">{ACTION_LABELS[action].hint}</p>
                                                            </div>
                                                            {action === 'GO_TO' && (
                                                                <div className="space-y-1 pt-2 border-t">
                                                                    <Label className="text-[11px] text-muted-foreground">Interface de destino</Label>
                                                                    <Select value={cat.targetLayoutId || 'NONE'} onValueChange={(v) => update(idx, { targetLayoutId: (!v || v === 'NONE') ? '' : v })}>
                                                                        <SelectTrigger className="h-9 text-[12px]"><SelectValue placeholder="Elegí un layout..." /></SelectTrigger>
                                                                        <SelectContent>
                                                                            <SelectItem value="NONE"><span className="text-muted-foreground">Sin destino</span></SelectItem>
                                                                            {savedLayouts.map((l) => (<SelectItem key={l._id} value={l._id}>{l.name}</SelectItem>))}
                                                                        </SelectContent>
                                                                    </Select>
                                                                </div>
                                                            )}
                                                        </div>

                                                        {/* Col 3 — VISIBILIDAD Y ESTILO */}
                                                        <div className="rounded-lg border bg-background/50 p-3 space-y-2">
                                                            <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/80">Visibilidad y estilo</div>
                                                            <div className="flex items-center justify-between rounded-md border bg-background px-2.5 h-9">
                                                                <Label className="text-[11px] flex items-center gap-1.5 cursor-pointer">
                                                                    {cat.active !== false ? <Eye className="size-3.5 text-emerald-500" /> : <EyeOff className="size-3.5 text-muted-foreground" />}
                                                                    Visible en menú
                                                                </Label>
                                                                <Switch checked={cat.active !== false} onCheckedChange={(v) => update(idx, { active: v })} />
                                                            </div>
                                                            <div className="rounded-md border bg-background p-2 space-y-1">
                                                                <div className="flex items-center justify-between">
                                                                    <Label className="text-[11px]">Overlay</Label>
                                                                    <span className="text-[10px] font-mono text-muted-foreground">{Math.round((cat.overlayOpacity ?? 0.35) * 100)}%</span>
                                                                </div>
                                                                <div className="flex items-center gap-2">
                                                                    <input type="color" value={cat.overlayColor || '#000000'} onChange={(e) => update(idx, { overlayColor: e.target.value })} className="size-5 rounded cursor-pointer border-0 bg-transparent shrink-0" />
                                                                    <input type="range" min={0} max={1} step={0.05} value={cat.overlayOpacity ?? 0.35} onChange={(e) => update(idx, { overlayOpacity: parseFloat(e.target.value) })} className="flex-1 accent-primary min-w-0" />
                                                                </div>
                                                            </div>
                                                            <div className="space-y-1">
                                                                <Label className="text-[11px] text-muted-foreground">Color texto</Label>
                                                                <div className="h-9 flex items-center gap-2 rounded-md border bg-background px-2">
                                                                    <input type="color" value={cat.textColor || '#ffffff'} onChange={(e) => update(idx, { textColor: e.target.value })} className="size-6 rounded cursor-pointer border-0 bg-transparent shrink-0" />
                                                                    <span className="font-mono text-[10px] text-muted-foreground truncate">{cat.textColor || '#ffffff'}</span>
                                                                </div>
                                                            </div>
                                                            <div className="grid grid-cols-2 gap-2">
                                                                <div className="space-y-1">
                                                                    <Label className="text-[11px] text-muted-foreground">Tam. texto</Label>
                                                                    <Select value={cat.textSize || 'md'} onValueChange={(v) => v && update(idx, { textSize: v as any })}>
                                                                        <SelectTrigger className="h-9 text-[12px]"><SelectValue /></SelectTrigger>
                                                                        <SelectContent>
                                                                            <SelectItem value="sm">Chico</SelectItem>
                                                                            <SelectItem value="md">Medio</SelectItem>
                                                                            <SelectItem value="lg">Grande</SelectItem>
                                                                            <SelectItem value="xl">Extra grande</SelectItem>
                                                                        </SelectContent>
                                                                    </Select>
                                                                </div>
                                                                <div className="space-y-1">
                                                                    <Label className="text-[11px] text-muted-foreground">Tam. icono</Label>
                                                                    <Select value={cat.iconSize || 'md'} onValueChange={(v) => v && update(idx, { iconSize: v as any })}>
                                                                        <SelectTrigger className="h-9 text-[12px]"><SelectValue /></SelectTrigger>
                                                                        <SelectContent>
                                                                            <SelectItem value="sm">Chico</SelectItem>
                                                                            <SelectItem value="md">Medio</SelectItem>
                                                                            <SelectItem value="lg">Grande</SelectItem>
                                                                        </SelectContent>
                                                                    </Select>
                                                                </div>
                                                            </div>
                                                        </div>

                                                    </div>
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </motion.div>
                            );
                        })}
                    </AnimatePresence>
                </div>
            </div>
        </TooltipProvider>
    );
};
