'use client';

import * as React from 'react';
import { io, Socket } from 'socket.io-client';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import Database from 'lucide-react/dist/esm/icons/database';
import Plus from 'lucide-react/dist/esm/icons/plus';
import Trash2 from 'lucide-react/dist/esm/icons/trash-2';
import Copy from 'lucide-react/dist/esm/icons/copy';
import Search from 'lucide-react/dist/esm/icons/search';
import Monitor from 'lucide-react/dist/esm/icons/monitor';
import Smartphone from 'lucide-react/dist/esm/icons/smartphone';
import Edit3 from 'lucide-react/dist/esm/icons/edit-3';
import Eye from 'lucide-react/dist/esm/icons/eye';
import RotateCcw from 'lucide-react/dist/esm/icons/rotate-ccw';
import ExternalLink from 'lucide-react/dist/esm/icons/external-link';
import MoreHorizontal from 'lucide-react/dist/esm/icons/more-horizontal';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { ViewToggler } from '@/components/admin/ViewToggler';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
    Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
    AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Toaster } from '@/components/ui/sonner';
import { toast } from 'sonner';
import { StatPill, InfoTip } from '@/components/admin/StatPill';
import LayoutIcon from 'lucide-react/dist/esm/icons/layout';
import Sparkles from 'lucide-react/dist/esm/icons/sparkles';
import Info from 'lucide-react/dist/esm/icons/info';

let socket: Socket;

export default function LayoutsPage() {
    const [layouts, setLayouts] = React.useState<any[]>([]);
    const [search, setSearch] = React.useState('');
    const [viewMode, setViewMode] = React.useState<'grid' | 'table' | 'calendar'>('grid');
    const [isCreating, setIsCreating] = React.useState(false);
    const [newName, setNewName] = React.useState('');
    const [newOrientation, setNewOrientation] = React.useState<'landscape' | 'portrait'>('landscape');
    const [selectedTemplate, setSelectedTemplate] = React.useState<string>('blank');
    const [toDelete, setToDelete] = React.useState<any>(null);

    const fetchLayouts = React.useCallback(() => {
        if (socket) socket.emit('get_layouts');
    }, []);

    React.useEffect(() => {
        socket = io();
        socket.on('connect', fetchLayouts);
        socket.on('layouts_list', (data: any[]) => setLayouts(data));
        return () => { socket.disconnect(); };
    }, [fetchLayouts]);

    const handleDelete = () => {
        if (!toDelete) return;
        socket.emit('delete_layout', toDelete._id);
        toast.success('Diseño eliminado', { description: toDelete.name });
        setToDelete(null);
        setTimeout(fetchLayouts, 400);
    };

    const handleFlipOrientation = (layout: any) => {
        const flipped = { ...layout, orientation: layout.orientation === 'portrait' ? 'landscape' : 'portrait' };
        socket.emit('save_layout', { screenId: null, layout: flipped });
        toast.success('Orientacion cambiada a ' + (flipped.orientation === 'portrait' ? 'Vertical' : 'Horizontal'));
        setTimeout(fetchLayouts, 500);
    };

    const handleDuplicate = (layout: any) => {
        const suggested = layout.name + ' (Copia)';
        const newName = typeof window !== 'undefined' ? window.prompt('Nombre del nuevo diseño:', suggested) : suggested;
        if (!newName || !newName.trim()) return;
        const copy = { ...layout };
        delete copy._id;
        delete copy.__v;
        copy.name = newName.trim();
        socket.emit('save_layout', { screenId: null, layout: copy });
        toast.success('Copia creada', { description: copy.name });
        setTimeout(fetchLayouts, 800);
    };

    const handleCreate = () => {
        if (!newName.trim()) { toast.error('El nombre es requerido'); return; }
        const tpl = (typeof PF_TEMPLATES !== 'undefined' && PF_TEMPLATES[selectedTemplate]) || null;
        const widgets = tpl ? tpl.buildWidgets(newOrientation) : [];
        const bg = tpl?.bg || { backgroundColor: '#ffffff' };
        socket.emit('save_layout', {
            screenId: null,
            layout: { name: newName, orientation: newOrientation, widgets, ...bg },
        });
        toast.success('Diseño creado', { description: newName + (tpl && tpl.label !== 'En blanco' ? ' · desde template ' + tpl.label : '') });
        setIsCreating(false);
        setNewName('');
        setSelectedTemplate('blank');
        setTimeout(fetchLayouts, 800);
    };


    // PF_TEMPLATES — presets con widgets pre-configurados por caso de uso
    const PF_TEMPLATES: Record<string, { label: string; desc: string; icon: string; buildWidgets: (orient: 'landscape'|'portrait') => any[]; bg?: any }> = {
        blank: {
            label: 'En blanco',
            desc: 'Lienzo vacío, empezá desde cero',
            icon: '⬜',
            buildWidgets: () => [],
        },
        restaurantMenu: {
            label: 'Menú restaurant',
            desc: 'Carta con productos por categoría + título',
            icon: '🍽',
            bg: { backgroundColor: '#1a1a1a' },
            buildWidgets: () => [
                { id: 'w1', type: 'TEXT', x: 5, y: 4, w: 90, h: 12, zIndex: 2, data: { content: '<p style="text-align:center;font-weight:900">NUESTRA CARTA</p>', style: 'gradient', gradientFrom: '#f59e0b', gradientTo: '#d97706', fontSize: '3rem', textAlign: 'center' } },
                { id: 'w2', type: 'PRODUCT_LIST', x: 3, y: 20, w: 94, h: 74, zIndex: 1, data: { theme: 'restaurant', layout: 'carousel', cardsPerView: 3, autoplayMs: 5000, showPrice: true, showDescription: true, groupByCategory: true, showCategoryHeader: true } },
            ],
        },
        eventsAgenda: {
            label: 'Agenda de eventos',
            desc: 'Título + actividades de hoy + reloj',
            icon: '📅',
            bg: { backgroundColor: '#0f172a' },
            buildWidgets: () => [
                { id: 'w1', type: 'TEXT', x: 5, y: 3, w: 65, h: 10, zIndex: 2, data: { content: '<p style="font-weight:900">Actividades de Hoy</p>', style: 'gradient', gradientFrom: '#10b981', gradientTo: '#059669', fontSize: '2.5rem', textAlign: 'left' } },
                { id: 'w2', type: 'DATE_TIME', x: 72, y: 3, w: 25, h: 12, zIndex: 2, data: { style: 'card', format: '24', showDate: true, showSeconds: false, color: '#ffffff' } },
                { id: 'w3', type: 'ACTIVITIES', x: 3, y: 16, w: 94, h: 80, zIndex: 1, data: { title: '', sectionToShow: 'ALL' } },
            ],
        },
        poolInfo: {
            label: 'Info piscina',
            desc: 'Sensores de temperatura + fondo',
            icon: '🏊',
            bg: { backgroundColor: '#0369a1' },
            buildWidgets: () => [
                { id: 'w1', type: 'TEXT', x: 5, y: 5, w: 90, h: 15, zIndex: 2, data: { content: '<p style="text-align:center;font-weight:900">TEMPERATURAS</p>', style: 'gradient', gradientFrom: '#f59e0b', gradientTo: '#eab308', fontSize: '3rem', textAlign: 'center' } },
                { id: 'w2', type: 'SENSOR_VALUE', x: 5, y: 25, w: 30, h: 40, zIndex: 1, data: { theme: 'circle', color: '#eab308', label: 'Piscina 1', showIcon: true, icon: 'Thermometer' } },
                { id: 'w3', type: 'SENSOR_VALUE', x: 35, y: 25, w: 30, h: 40, zIndex: 1, data: { theme: 'circle', color: '#eab308', label: 'Piscina 2', showIcon: true, icon: 'Thermometer' } },
                { id: 'w4', type: 'SENSOR_VALUE', x: 65, y: 25, w: 30, h: 40, zIndex: 1, data: { theme: 'circle', color: '#eab308', label: 'Piscina 3', showIcon: true, icon: 'Thermometer' } },
            ],
        },
        welcome: {
            label: 'Bienvenida hotel',
            desc: 'Logo + saludo + clima + tickеr',
            icon: '👋',
            bg: { backgroundColor: '#111827' },
            buildWidgets: () => [
                { id: 'w1', type: 'IMAGE', x: 30, y: 8, w: 40, h: 20, zIndex: 2, data: { src: '/logo.png', fit: 'contain' } },
                { id: 'w2', type: 'TEXT', x: 5, y: 32, w: 90, h: 14, zIndex: 2, data: { content: '<p style="text-align:center;font-weight:900">Bienvenidos</p>', style: 'gradient', gradientFrom: '#3b82f6', gradientTo: '#8b5cf6', fontSize: '4rem', textAlign: 'center' } },
                { id: 'w3', type: 'WEATHER', x: 30, y: 48, w: 40, h: 36, zIndex: 1, data: { city: 'Colonia del Sacramento, UY', unit: 'celsius', showIcon: true, showForecast: false } },
                { id: 'w4', type: 'TICKER', x: 0, y: 88, w: 100, h: 12, zIndex: 3, data: { text: 'BIENVENIDOS · WI-FI GRATIS · SPA & PISCINA TERMAL', speed: 30, bgColor: 'rgba(0,0,0,0.85)', textColor: '#ffffff', showIcon: true } },
            ],
        },
        alerts: {
            label: 'Alerta urgente',
            desc: 'Mensaje grande centrado + color vibrante',
            icon: '⚠',
            bg: { backgroundColor: '#dc2626' },
            buildWidgets: () => [
                { id: 'w1', type: 'TEXT', x: 5, y: 30, w: 90, h: 40, zIndex: 1, data: { content: '<p style="text-align:center;font-weight:900">ATENCIÓN</p>', style: 'minimal', fontSize: '6rem', textAlign: 'center', color: '#ffffff' } },
            ],
        },
    };

    const originalHandleCreate = handleCreate;
    const filtered = layouts.filter((l) => l.name.toLowerCase().includes(search.toLowerCase()));

    return (
        <div className="flex-1 flex flex-col min-h-0 bg-background text-foreground">
            <AdminHeader
                title="Galería de diseños"
                subtitle="Lienzos y composiciones"
                icon={<Database size={20} strokeWidth={1.75} />}
                actions={
                    <Button onClick={() => setIsCreating(true)} size="sm">
                        <Plus className="size-4" /> Nuevo diseño
                    </Button>
                }
            />

            <div className="flex-1 overflow-hidden flex flex-col">
                {/* Filters bar */}
                <div className="px-6 py-3 border-b bg-card/30 flex items-center justify-between gap-4">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
                        <Input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Buscar diseño…"
                            className="h-9 pl-8"
                        />
                    </div>
                    <ViewToggler viewMode={viewMode} setViewMode={setViewMode} />
                </div>


                <div className="flex-1 overflow-y-auto p-6">
                    {filtered.length === 0 ? (
                        <div className="grid place-items-center py-24 rounded-lg border border-dashed text-muted-foreground">
                            <div className="text-center">
                                <Database className="size-8 mx-auto mb-3 opacity-50" />
                                <p className="text-[13px] font-medium mb-3">
                                    {search ? 'Sin coincidencias' : 'Aún no tenés diseños guardados'}
                                </p>
                                {!search && (
                                    <Button size="sm" variant="outline" onClick={() => setIsCreating(true)}>
                                        <Plus className="size-3.5" /> Crear primer diseño
                                    </Button>
                                )}
                            </div>
                        </div>
                    ) : viewMode === 'grid' ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                            <AnimatePresence>
                                {filtered.map((l) => (
                                    <motion.div
                                        key={l._id}
                                        layout
                                        initial={{ opacity: 0, y: 8 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -8 }}
                                    >
                                        <Card className="overflow-hidden group hover:border-primary/40 transition-colors py-0 gap-0">
                                            <div className="aspect-[16/9] bg-gradient-to-br from-muted to-muted/50 relative overflow-hidden">
                                                <ScreenShape orientation={l.orientation === 'portrait' ? 'portrait' : 'landscape'} widgetCount={l.widgets?.length || 0} />
                                                <div className="absolute inset-0 bg-gradient-to-t from-card via-card/0 to-transparent opacity-0 group-hover:opacity-100 transition-opacity grid place-items-center">
                                                    <div className="flex items-center gap-2">
                                                        <Link href={'/preview/' + l._id} target="_blank" rel="noopener noreferrer">
                                                            <Button size="sm" variant="secondary" className="shadow-lg">
                                                                <Eye className="size-3.5" /> Ver en vivo
                                                            </Button>
                                                        </Link>
                                                        <Link href={'/admin?id=' + l._id}>
                                                            <Button size="sm" className="shadow-lg">
                                                                <Edit3 className="size-3.5" /> Editar
                                                            </Button>
                                                        </Link>
                                                    </div>
                                                </div>
                                            </div>

                                            <CardContent className="p-4 flex items-start justify-between gap-2">
                                                <div className="min-w-0 flex-1">
                                                    <h3 className="font-heading text-[14px] font-semibold tracking-tight truncate">
                                                        {l.name}
                                                    </h3>
                                                    <div className="flex items-center gap-2 mt-1.5">
                                                        <Badge variant="secondary" className="text-[10px] h-4 px-1.5">
                                                            {(l.widgets?.length ?? 0)} widgets
                                                        </Badge>
                                                        <span className="text-[10px] text-muted-foreground">
                                                            {l.updatedAt ? new Date(l.updatedAt).toLocaleDateString() : '—'}
                                                        </span>
                                                    </div>
                                                </div>
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger className="size-7 grid place-items-center rounded-md hover:bg-accent text-muted-foreground hover:text-foreground">
                                                        <MoreHorizontal className="size-3.5" />
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuItem onClick={() => window.open('/preview/' + l._id, '_blank')}>
                                                            <ExternalLink className="size-3.5 mr-2" /> Ver en vivo
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => handleFlipOrientation(l)}>
                                                            <RotateCcw className="size-3.5 mr-2" />
                                                            {l.orientation === 'portrait' ? 'Cambiar a horizontal' : 'Cambiar a vertical'}
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => handleDuplicate(l)}>
                                                            <Copy className="size-3.5 mr-2" /> Duplicar
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem
                                                            onClick={() => setToDelete(l)}
                                                            className="text-destructive focus:text-destructive"
                                                        >
                                                            <Trash2 className="size-3.5 mr-2" /> Eliminar
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </CardContent>
                                        </Card>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </div>
                    ) : (
                        <div className="rounded-lg border bg-card overflow-hidden">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Diseño</TableHead>
                                        <TableHead>Formato</TableHead>
                                        <TableHead className="text-center">Widgets</TableHead>
                                        <TableHead>Modificado</TableHead>
                                        <TableHead className="text-right">Acciones</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filtered.map((l) => (
                                        <TableRow key={l._id} className="group">
                                            <TableCell>
                                                <div className="flex items-center gap-3 min-w-0">
                                                    <div className="size-9 rounded-md bg-muted border grid place-items-center text-muted-foreground shrink-0">
                                                        {l.orientation === 'portrait'
                                                            ? <Smartphone className="size-4" />
                                                            : <Monitor className="size-4" />}
                                                    </div>
                                                    <span className="font-medium truncate">{l.name}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className="text-[10px]">
                                                    {l.orientation === 'portrait' ? 'Vertical 9:16' : 'Horizontal 16:9'}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-center font-mono text-[12px] tabular-nums">
                                                {l.widgets?.length || 0}
                                            </TableCell>
                                            <TableCell className="text-[12px] text-muted-foreground">
                                                {l.updatedAt ? new Date(l.updatedAt).toLocaleDateString() : '—'}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex items-center justify-end gap-1 opacity-70 group-hover:opacity-100 transition-opacity">
                                                    <Link href={'/preview/' + l._id} target="_blank" rel="noopener noreferrer" title="Ver en vivo">
                                                        <Button size="sm" variant="ghost" className="size-8">
                                                            <Eye className="size-3.5" />
                                                        </Button>
                                                    </Link>
                                                    <Button size="sm" variant="ghost" className="size-8" onClick={() => handleFlipOrientation(l)} title={l.orientation === 'portrait' ? 'Cambiar a horizontal' : 'Cambiar a vertical'}>
                                                        <RotateCcw className="size-3.5" />
                                                    </Button>
                                                    <Link href={'/admin?id=' + l._id} title="Editar">
                                                        <Button size="sm" variant="ghost" className="size-8">
                                                            <Edit3 className="size-3.5" />
                                                        </Button>
                                                    </Link>
                                                    <Button size="sm" variant="ghost" className="size-8" onClick={() => handleDuplicate(l)} title="Duplicar">
                                                        <Copy className="size-3.5" />
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        className="size-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                                                        onClick={() => setToDelete(l)}
                                                    >
                                                        <Trash2 className="size-3.5" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </div>
            </div>

            {/* Create Dialog */}
            <Dialog open={isCreating} onOpenChange={setIsCreating}>
                <DialogContent className="sm:max-w-[480px]">
                    <DialogHeader>
                        <DialogTitle className="font-heading flex items-center gap-2">
                            <span className="size-8 rounded-md grid place-items-center bg-primary/10 text-primary">
                                <Plus className="size-4" />
                            </span>
                            Nuevo diseño
                        </DialogTitle>
                        <DialogDescription>
                            Definí el formato del lienzo y un nombre descriptivo.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-2">
                        <div className="space-y-1.5">
                            <Label htmlFor="layout-name">Nombre del diseño</Label>
                            <Input
                                id="layout-name"
                                autoFocus
                                value={newName}
                                onChange={(e) => setNewName(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                                placeholder="Ej. Menu principal restaurante"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <Label>Orientación</Label>
                            <div className="grid grid-cols-2 gap-2">
                                <button
                                    onClick={() => setNewOrientation('landscape')}
                                    className={'h-24 rounded-md border flex flex-col items-center justify-center gap-2 transition-colors ' + (
                                        newOrientation === 'landscape'
                                            ? 'bg-primary/10 border-primary text-primary'
                                            : 'bg-card hover:bg-accent border-border text-muted-foreground'
                                    )}
                                >
                                    <Monitor className="size-7" />
                                    <span className="text-[11px] font-semibold uppercase tracking-wide">Horizontal</span>
                                </button>
                                <button
                                    onClick={() => setNewOrientation('portrait')}
                                    className={'h-24 rounded-md border flex flex-col items-center justify-center gap-2 transition-colors ' + (
                                        newOrientation === 'portrait'
                                            ? 'bg-primary/10 border-primary text-primary'
                                            : 'bg-card hover:bg-accent border-border text-muted-foreground'
                                    )}
                                >
                                    <Smartphone className="size-7" />
                                    <span className="text-[11px] font-semibold uppercase tracking-wide">Vertical</span>
                                </button>
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <Label>Template inicial</Label>
                            <div className="grid grid-cols-3 gap-2 max-h-[280px] overflow-y-auto pr-1 custom-scrollbar">
                                {Object.entries(PF_TEMPLATES).map(([key, t]: any) => (
                                    <button
                                        key={key}
                                        onClick={() => setSelectedTemplate(key)}
                                        className={'p-3 rounded-md border text-left transition-all ' + (
                                            selectedTemplate === key
                                                ? 'bg-primary/10 border-primary ring-2 ring-primary/30 shadow-sm'
                                                : 'bg-card hover:bg-accent border-border'
                                        )}
                                    >
                                        <div className="text-2xl mb-1">{t.icon}</div>
                                        <div className="text-[11px] font-bold leading-tight truncate">{t.label}</div>
                                        <div className="text-[9px] text-muted-foreground leading-tight line-clamp-2 mt-0.5">{t.desc}</div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => { setIsCreating(false); setNewName(''); setSelectedTemplate('blank'); }}>
                            Cancelar
                        </Button>
                        <Button onClick={handleCreate} disabled={!newName.trim()}>
                            Crear diseño
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete confirmation */}
            <AlertDialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>¿Eliminar este diseño?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Se borrará permanentemente el diseño <b>{toDelete?.name}</b> y sus widgets.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                            Eliminar
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <Toaster />
        </div>
    );
}

interface ScreenShapeProps {
    orientation: 'landscape' | 'portrait';
    widgetCount: number;
}

const ScreenShape: React.FC<ScreenShapeProps> = ({ orientation, widgetCount }) => {
    const isPortrait = orientation === 'portrait';
    // Fake widget rectangles for visual "preview"
    const fake = Array.from({ length: Math.min(widgetCount, 6) }).map((_, i) => {
        const seed = i + 1;
        return {
            x: (seed * 13) % 60 + 10,
            y: (seed * 23) % 60 + 10,
            w: 20 + (seed % 3) * 8,
            h: 12 + (seed % 2) * 8,
        };
    });
    // Screen dimensions in the SVG viewBox
    const screenW = isPortrait ? 60 : 100;
    const screenH = isPortrait ? 100 : 60;
    return (
        <div className="absolute inset-0 flex items-center justify-center p-6 pointer-events-none">
            <svg viewBox={'0 0 ' + screenW + ' ' + (screenH + (isPortrait ? 8 : 6))} className="h-full w-auto max-w-[80%] text-muted-foreground/60 group-hover:text-primary/70 transition-colors" fill="none">
                {/* Bezel */}
                <rect x={0} y={0} width={screenW} height={screenH} rx={2} className="fill-background stroke-current" strokeWidth={0.8} />
                {/* Inner viewport */}
                <rect x={1.5} y={1.5} width={screenW - 3} height={screenH - 3} rx={1} className="fill-muted stroke-current" strokeWidth={0.3} strokeDasharray="1 1" />
                {/* Fake widgets */}
                {fake.map((f, i) => (
                    <rect
                        key={i}
                        x={2 + (f.x / 100) * (screenW - 4)}
                        y={2 + (f.y / 100) * (screenH - 4)}
                        width={(f.w / 100) * (screenW - 4)}
                        height={(f.h / 100) * (screenH - 4)}
                        rx={0.6}
                        className="fill-current opacity-30"
                    />
                ))}
                {isPortrait ? (
                    // Portrait "stand" (phone-style bottom)
                    <>
                        <rect x={screenW/2 - 6} y={screenH + 2} width={12} height={2} rx={0.5} className="fill-current opacity-40" />
                    </>
                ) : (
                    // Landscape stand
                    <>
                        <rect x={screenW/2 - 8} y={screenH + 1} width={16} height={2} rx={0.5} className="fill-current opacity-40" />
                        <rect x={screenW/2 - 14} y={screenH + 3} width={28} height={1.5} rx={0.5} className="fill-current opacity-30" />
                    </>
                )}
            </svg>
            <span className="absolute top-2 right-2 text-[9px] font-bold uppercase tracking-[0.14em] text-muted-foreground/60 bg-background/70 px-1.5 py-0.5 rounded-sm">
                {isPortrait ? 'Vertical' : 'Horizontal'}
            </span>
        </div>
    );
};
