'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import RefreshCw from 'lucide-react/dist/esm/icons/refresh-cw';
import Plus from 'lucide-react/dist/esm/icons/plus';
import Search from 'lucide-react/dist/esm/icons/search';
import Trash2 from 'lucide-react/dist/esm/icons/trash-2';
import Edit3 from 'lucide-react/dist/esm/icons/edit-3';
import Calendar from 'lucide-react/dist/esm/icons/calendar';
import Clock from 'lucide-react/dist/esm/icons/clock';
import Repeat from 'lucide-react/dist/esm/icons/repeat';
import MoreHorizontal from 'lucide-react/dist/esm/icons/more-horizontal';
import ImageIcon from 'lucide-react/dist/esm/icons/image';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { ViewToggler } from '@/components/admin/ViewToggler';
import { ImageUpload } from '@/components/builder/ImageUpload';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
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
import { ActivityCalendar } from '@/components/admin/ActivityCalendar';
import Info from 'lucide-react/dist/esm/icons/info';
import Sparkles from 'lucide-react/dist/esm/icons/sparkles';

const DAYS_OF_WEEK = [
    { value: 'TODOS', label: 'Todos los días' },
    { value: 'LUNES', label: 'Lunes' },
    { value: 'MARTES', label: 'Martes' },
    { value: 'MIERCOLES', label: 'Miércoles' },
    { value: 'JUEVES', label: 'Jueves' },
    { value: 'VIERNES', label: 'Viernes' },
    { value: 'SABADO', label: 'Sábado' },
    { value: 'DOMINGO', label: 'Domingo' },
];

interface Activity {
    _id?: string;
    title: string;
    desc?: string;
    time?: string;
    day?: string;
    category?: string;
    photo?: string;
    isWeekly?: boolean;
}

export default function ActivitiesPage() {
    const [activities, setActivities] = React.useState<any[]>([]);
    const [search, setSearch] = React.useState('');
    const [viewMode, setViewMode] = React.useState<'grid' | 'table' | 'calendar'>('table');
    const [editing, setEditing] = React.useState<Activity | null>(null);
    const [creating, setCreating] = React.useState(false);
    const [toDelete, setToDelete] = React.useState<any>(null);

    React.useEffect(() => { fetchData(); }, []);

    const fetchData = async () => {
        try {
            const res = await fetch('/api/activities');
            setActivities(await res.json());
        } catch (e) { console.error(e); }
    };

    const handleSave = async (a: Activity) => {
        const isNew = !a._id;
        try {
            const res = await fetch(isNew ? '/api/activities' : '/api/activities/' + a._id, {
                method: isNew ? 'POST' : 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(a),
            });
            if (res.ok) {
                toast.success(isNew ? 'Actividad creada' : 'Actividad actualizada', { description: a.title });
                fetchData();
                setEditing(null);
                setCreating(false);
            } else {
                toast.error('No se pudo guardar');
            }
        } catch (e) { toast.error('Error de red'); }
    };

    const handleDelete = async () => {
        if (!toDelete) return;
        try {
            const res = await fetch('/api/activities/' + toDelete._id, { method: 'DELETE' });
            if (res.ok) {
                toast.success('Actividad eliminada', { description: toDelete.title });
                fetchData();
            }
        } finally { setToDelete(null); }
    };

    const filtered = activities.filter((a) =>
        a.title?.toLowerCase().includes(search.toLowerCase())
        || a.category?.toLowerCase().includes(search.toLowerCase())
    );

    const target: Activity | null = editing || (creating ? { title: '', day: 'TODOS' } : null);

    return (
        <div className="flex-1 flex flex-col min-h-0 bg-background text-foreground">
            <AdminHeader
                title="Actividades"
                subtitle="Cronograma de eventos del hotel"
                icon={<RefreshCw size={20} strokeWidth={1.75} />}
                actions={
                    <Button size="sm" onClick={() => setCreating(true)}>
                        <Plus className="size-4" /> Nueva actividad
                    </Button>
                }
            />

            <div className="flex-1 overflow-hidden flex flex-col">
                <div className="px-6 py-3 border-b bg-card/30 flex items-center justify-between gap-4">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
                        <Input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Buscar actividad o categoría…"
                            className="h-9 pl-8"
                        />
                    </div>
                    <ViewToggler viewMode={viewMode} setViewMode={setViewMode} modes={['calendar', 'table', 'grid']} />
                </div>


                <div className="flex-1 overflow-y-auto p-6">
                    {filtered.length === 0 ? (
                        <div className="grid place-items-center py-24 rounded-lg border border-dashed text-muted-foreground">
                            <div className="text-center">
                                <RefreshCw className="size-8 mx-auto mb-3 opacity-50" />
                                <p className="text-[13px] font-medium mb-3">
                                    {search ? 'Sin coincidencias' : 'Aún no tenés actividades'}
                                </p>
                                {!search && (
                                    <Button size="sm" variant="outline" onClick={() => setCreating(true)}>
                                        <Plus className="size-3.5" /> Crear primera actividad
                                    </Button>
                                )}
                            </div>
                        </div>
                    ) : viewMode === 'calendar' ? (
                        <ActivityCalendar
                            activities={filtered}
                            onCreate={(preset) => {
                                setEditing({ title: '', day: preset.day || 'TODOS', time: preset.time || '', isWeekly: preset.isWeekly ?? true } as any);
                                setCreating(true);
                            }}
                            onEdit={(a) => setEditing(a)}
                        />
                    ) : viewMode === 'grid' ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                            <AnimatePresence>
                                {filtered.map((a) => (
                                    <motion.div
                                        key={a._id}
                                        layout
                                        initial={{ opacity: 0, y: 8 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -8 }}
                                    >
                                        <Card className="overflow-hidden group hover:border-primary/40 transition-colors py-0 gap-0">
                                            <div className="aspect-video bg-muted relative overflow-hidden">
                                                {a.photo ? (
                                                    <img src={a.photo} alt={a.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                                ) : (
                                                    <div className="w-full h-full grid place-items-center text-muted-foreground/40">
                                                        <Calendar className="size-10" />
                                                    </div>
                                                )}
                                                <div className="absolute top-2 left-2 flex gap-1">
                                                    {a.category && (
                                                        <Badge variant="default" className="text-[10px] backdrop-blur-sm">
                                                            {a.category}
                                                        </Badge>
                                                    )}
                                                    {a.isWeekly && (
                                                        <Badge variant="secondary" className="text-[10px] backdrop-blur-sm gap-1">
                                                            <Repeat className="size-2.5" /> Semanal
                                                        </Badge>
                                                    )}
                                                </div>
                                            </div>
                                            <CardContent className="p-4 space-y-3">
                                                <div className="flex items-start justify-between gap-2">
                                                    <h3 className="font-heading text-[14px] font-semibold tracking-tight truncate flex-1">
                                                        {a.title}
                                                    </h3>
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger className="size-7 grid place-items-center rounded-md hover:bg-accent text-muted-foreground hover:text-foreground shrink-0">
                                                            <MoreHorizontal className="size-3.5" />
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end">
                                                            <DropdownMenuItem onClick={() => setEditing(a)}>
                                                                <Edit3 className="size-3.5 mr-2" /> Editar
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem
                                                                onClick={() => setToDelete(a)}
                                                                className="text-destructive focus:text-destructive"
                                                            >
                                                                <Trash2 className="size-3.5 mr-2" /> Eliminar
                                                            </DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </div>

                                                <div className="grid grid-cols-2 gap-2 text-[11px]">
                                                    <div className="flex items-center gap-1.5 text-muted-foreground">
                                                        <Calendar className="size-3 text-primary" />
                                                        <span className="truncate">{a.day || 'Todos'}</span>
                                                    </div>
                                                    <div className="flex items-center gap-1.5 text-muted-foreground">
                                                        <Clock className="size-3 text-primary" />
                                                        <span className="truncate">{a.time || '—'}</span>
                                                    </div>
                                                </div>

                                                {a.desc && (
                                                    <p className="text-[11px] text-muted-foreground line-clamp-2 pt-2 border-t">
                                                        {a.desc}
                                                    </p>
                                                )}
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
                                        <TableHead className="w-16">Foto</TableHead>
                                        <TableHead>Actividad</TableHead>
                                        <TableHead>Cuándo</TableHead>
                                        <TableHead>Categoria</TableHead>
                                        <TableHead className="text-right">Acciones</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filtered.map((a) => (
                                        <TableRow key={a._id} className="group">
                                            <TableCell>
                                                <div className="size-10 rounded-md overflow-hidden bg-muted border">
                                                    {a.photo
                                                        ? <img src={a.photo} className="w-full h-full object-cover" />
                                                        : <div className="w-full h-full grid place-items-center text-muted-foreground"><Calendar className="size-4" /></div>}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="font-medium truncate">{a.title}</div>
                                                <div className="text-[11px] text-muted-foreground truncate max-w-[280px]">
                                                    {a.desc}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-col text-[12px]">
                                                    <span className="flex items-center gap-1.5">
                                                        <Clock className="size-3 text-primary" />
                                                        {a.time || '—'}
                                                    </span>
                                                    <span className="flex items-center gap-1.5 text-muted-foreground mt-0.5">
                                                        <Calendar className="size-3" />
                                                        {a.day || 'Todos'}
                                                    </span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex gap-1 items-center">
                                                    <Badge variant="outline" className="text-[10px]">
                                                        {a.category || 'General'}
                                                    </Badge>
                                                    {a.isWeekly && (
                                                        <Badge variant="secondary" className="text-[10px] gap-1">
                                                            <Repeat className="size-2.5" />
                                                        </Badge>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex justify-end gap-1 opacity-70 group-hover:opacity-100">
                                                    <Button size="sm" variant="ghost" className="size-8" onClick={() => setEditing(a)}>
                                                        <Edit3 className="size-3.5" />
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        className="size-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                                                        onClick={() => setToDelete(a)}
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

            <Dialog open={!!target} onOpenChange={(o) => { if (!o) { setEditing(null); setCreating(false); } }}>
                <DialogContent className="sm:max-w-[560px] max-h-[90vh] overflow-y-auto">
                    {target && (
                        <ActivityForm
                            initial={target}
                            isNew={creating}
                            onCancel={() => { setEditing(null); setCreating(false); }}
                            onSave={handleSave}
                        />
                    )}
                </DialogContent>
            </Dialog>

            <AlertDialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>¿Eliminar actividad?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Se eliminará permanentemente <b>{toDelete?.title}</b> del cronograma.
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

interface ActivityFormProps {
    initial: Activity;
    isNew: boolean;
    onSave: (a: Activity) => void;
    onCancel: () => void;
}

function ActivityForm({ initial, isNew, onSave, onCancel }: ActivityFormProps) {
    const [title, setTitle] = React.useState(initial.title || '');
    const [desc, setDesc] = React.useState(initial.desc || '');
    const [time, setTime] = React.useState(initial.time || '');
    const [day, setDay] = React.useState(initial.day || 'TODOS');
    const [category, setCategory] = React.useState(initial.category || '');
    const [photo, setPhoto] = React.useState(initial.photo || '');
    const [isWeekly, setIsWeekly] = React.useState(initial.isWeekly ?? false);

    const submit = () => {
        if (!title.trim()) { toast.error('El título es requerido'); return; }
        onSave({ ...initial, title, desc, time, day, category, photo, isWeekly });
    };

    return (
        <>
            <DialogHeader>
                <DialogTitle className="font-heading flex items-center gap-2">
                    <span className="size-8 rounded-md grid place-items-center bg-primary/10 text-primary">
                        <Calendar className="size-4" />
                    </span>
                    {isNew ? 'Nueva actividad' : 'Editar actividad'}
                </DialogTitle>
                <DialogDescription>Detalles del evento del cronograma.</DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2">
                <div className="space-y-1.5">
                    <Label htmlFor="a-title">Título <span className="text-destructive">*</span></Label>
                    <Input id="a-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ej. Clase de yoga" />
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                        <Label>Día de la semana</Label>
                        <Select value={day} onValueChange={(v) => setDay(v || 'TODOS')}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {DAYS_OF_WEEK.map((d) => (
                                    <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-1.5">
                        <Label htmlFor="a-time">Horario</Label>
                        <div className="relative">
                            <Clock className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
                            <Input
                                id="a-time"
                                value={time}
                                onChange={(e) => setTime(e.target.value)}
                                placeholder="HH:mm - HH:mm"
                                className="pl-8"
                            />
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                        <Label htmlFor="a-cat">Categoría</Label>
                        <Input id="a-cat" value={category} onChange={(e) => setCategory(e.target.value)} placeholder="Ej. Bienestar" />
                    </div>
                    <div className="flex items-end justify-between rounded-md border bg-card px-3 py-2">
                        <div className="flex flex-col">
                            <Label htmlFor="a-weekly" className="text-[12px] cursor-pointer">Repetir semanalmente</Label>
                            <span className="text-[10px] text-muted-foreground">Actividad recurrente</span>
                        </div>
                        <Switch id="a-weekly" checked={isWeekly} onCheckedChange={setIsWeekly} />
                    </div>
                </div>

                <div className="space-y-1.5">
                    <Label htmlFor="a-desc">Descripción</Label>
                    <Textarea id="a-desc" value={desc} onChange={(e) => setDesc(e.target.value)} className="h-24 resize-none" placeholder="Detalles adicionales..." />
                </div>

                <div className="space-y-1.5">
                    <Label>Imagen representativa</Label>
                    <div className="rounded-md border bg-card p-3 flex gap-3 items-center">
                        <div className="size-20 rounded-md overflow-hidden bg-muted border grid place-items-center shrink-0">
                            {photo
                                ? <img src={photo} className="w-full h-full object-cover" />
                                : <ImageIcon className="size-7 text-muted-foreground/50" />}
                        </div>
                        <div className="flex-1">
                            <ImageUpload compact label="Seleccionar imagen" onUploadSuccess={(url) => setPhoto(url)} />
                            <p className="text-[11px] text-muted-foreground mt-1.5">JPG, PNG o WEBP. Recomendado 16:9.</p>
                        </div>
                    </div>
                </div>
            </div>

            <DialogFooter>
                <Button variant="outline" onClick={onCancel}>Cancelar</Button>
                <Button onClick={submit}>{isNew ? 'Crear actividad' : 'Guardar cambios'}</Button>
            </DialogFooter>
        </>
    );
}
