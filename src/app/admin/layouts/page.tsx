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

let socket: Socket;

export default function LayoutsPage() {
    const [layouts, setLayouts] = React.useState<any[]>([]);
    const [search, setSearch] = React.useState('');
    const [viewMode, setViewMode] = React.useState<'grid' | 'table'>('grid');
    const [isCreating, setIsCreating] = React.useState(false);
    const [newName, setNewName] = React.useState('');
    const [newOrientation, setNewOrientation] = React.useState<'landscape' | 'portrait'>('landscape');
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

    const handleDuplicate = (layout: any) => {
        const copy = { ...layout };
        delete copy._id;
        delete copy.__v;
        copy.name = layout.name + ' (Copia)';
        socket.emit('save_layout', { screenId: null, layout: copy });
        toast.success('Copia creada', { description: copy.name });
        setTimeout(fetchLayouts, 800);
    };

    const handleCreate = () => {
        if (!newName.trim()) { toast.error('El nombre es requerido'); return; }
        socket.emit('save_layout', {
            screenId: null,
            layout: { name: newName, orientation: newOrientation, widgets: [], backgroundColor: '#ffffff' },
        });
        toast.success('Diseño creado', { description: newName });
        setIsCreating(false);
        setNewName('');
        setTimeout(fetchLayouts, 800);
    };

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
                                            <div className="aspect-[16/9] bg-muted relative overflow-hidden">
                                                <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground/40 group-hover:text-primary/40 transition-colors">
                                                    {l.orientation === 'portrait'
                                                        ? <Smartphone className="size-14" strokeWidth={1.25} />
                                                        : <Monitor className="size-16" strokeWidth={1.25} />}
                                                    <span className="text-[10px] font-bold uppercase tracking-[0.14em] mt-2 opacity-70">
                                                        {l.orientation || 'landscape'}
                                                    </span>
                                                </div>
                                                <div className="absolute inset-0 bg-gradient-to-t from-card via-card/0 to-transparent opacity-0 group-hover:opacity-100 transition-opacity grid place-items-center">
                                                    <Link href={'/admin?id=' + l._id}>
                                                        <Button size="sm" className="shadow-lg">
                                                            <Edit3 className="size-3.5" /> Abrir editor
                                                        </Button>
                                                    </Link>
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
                                                    <Link href={'/admin?id=' + l._id}>
                                                        <Button size="sm" variant="ghost" className="size-8">
                                                            <Edit3 className="size-3.5" />
                                                        </Button>
                                                    </Link>
                                                    <Button size="sm" variant="ghost" className="size-8" onClick={() => handleDuplicate(l)}>
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
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => { setIsCreating(false); setNewName(''); }}>
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
