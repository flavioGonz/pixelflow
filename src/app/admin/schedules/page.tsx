'use client';

import * as React from 'react';
import { io, Socket } from 'socket.io-client';
import { motion, AnimatePresence } from 'framer-motion';
import Calendar from 'lucide-react/dist/esm/icons/calendar';
import Plus from 'lucide-react/dist/esm/icons/plus';
import Search from 'lucide-react/dist/esm/icons/search';
import Trash2 from 'lucide-react/dist/esm/icons/trash-2';
import Sparkles from 'lucide-react/dist/esm/icons/sparkles';
import MoreHorizontal from 'lucide-react/dist/esm/icons/more-horizontal';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { ScheduleEditor } from '@/components/admin/schedules/ScheduleEditor';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Toaster } from '@/components/ui/sonner';
import { toast } from 'sonner';

let socket: Socket;

interface Schedule {
    _id: string;
    name: string;
    type?: 'day' | 'week' | 'month';
    events?: any[];
}

interface Layout {
    _id: string;
    name: string;
}

export default function SchedulesAdminPage() {
    const [allSchedules, setAllSchedules] = React.useState<Schedule[]>([]);
    const [savedLayouts, setSavedLayouts] = React.useState<Layout[]>([]);
    const [selectedScheduleId, setSelectedScheduleId] = React.useState<string | null>(null);
    const [showCreateModal, setShowCreateModal] = React.useState(false);
    const [newScheduleName, setNewScheduleName] = React.useState('');
    const [search, setSearch] = React.useState('');

    const fetchData = React.useCallback(() => {
        if (socket) {
            socket.emit('get_schedules');
            socket.emit('get_layouts');
        }
    }, []);

    React.useEffect(() => {
        socket = io();
        socket.on('connect', fetchData);
        socket.on('schedules_list', (s: Schedule[]) => setAllSchedules(s));
        socket.on('layouts_list', (l: Layout[]) => setSavedLayouts(l));
        return () => { socket.disconnect(); };
    }, [fetchData]);

    const activeSchedule = allSchedules.find((s) => s._id === selectedScheduleId);

    const filteredSchedules = React.useMemo(
        () =>
            allSchedules.filter((s) =>
                !search || s.name.toLowerCase().includes(search.toLowerCase())
            ),
        [allSchedules, search]
    );

    const createSchedule = () => {
        if (!newScheduleName.trim()) return;
        socket.emit('save_schedule', { name: newScheduleName, type: 'week', events: [] });
        toast.success('Rutina creada', { description: '"' + newScheduleName + '" se creó correctamente.' });
        setNewScheduleName('');
        setShowCreateModal(false);
    };

    const deleteSchedule = (id: string, name: string) => {
        if (!confirm('¿Eliminar la rutina "' + name + '"? Esta acción no se puede deshacer.')) return;
        socket.emit('delete_schedule', id);
        toast.success('Rutina eliminada');
        if (selectedScheduleId === id) setSelectedScheduleId(null);
    };

    const saveSchedule = (s: any) => {
        socket.emit('save_schedule', s);
    };

    return (
        <div className="flex-1 flex flex-col min-h-0 bg-background text-foreground">
            <AdminHeader
                title="Cronogramas"
                subtitle="Automatización de canales"
                icon={<Calendar size={20} strokeWidth={1.75} />}
                actions={
                    <Button onClick={() => setShowCreateModal(true)} size="sm">
                        <Plus className="size-4" />
                        Nueva rutina
                    </Button>
                }
            />

            <div className="flex flex-1 overflow-hidden">
                {/* Left list */}
                <aside className="w-[280px] shrink-0 border-r flex flex-col overflow-hidden bg-card">
                    <div className="p-4 border-b">
                        <div className="relative">
                            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
                            <Input
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Buscar rutina…"
                                className="h-9 pl-8"
                            />
                        </div>
                    </div>

                    <ScrollArea className="flex-1">
                        <div className="p-2 space-y-1">
                            <AnimatePresence>
                                {filteredSchedules.map((s) => {
                                    const active = selectedScheduleId === s._id;
                                    return (
                                        <motion.div
                                            key={s._id}
                                            layout
                                            initial={{ opacity: 0, x: -8 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: -8 }}
                                            className={
                                                'group relative rounded-md transition-colors ' +
                                                (active ? 'bg-accent' : 'hover:bg-accent/60')
                                            }
                                        >
                                            <button
                                                onClick={() => setSelectedScheduleId(s._id)}
                                                className="w-full text-left px-3 py-2.5 pr-9"
                                            >
                                                {active && (
                                                    <motion.span
                                                        layoutId="schedule-active-bar"
                                                        className="absolute left-0 top-2 bottom-2 w-[3px] rounded-r-full bg-primary"
                                                    />
                                                )}
                                                <div className="font-heading text-[13.5px] font-semibold tracking-tight truncate">
                                                    {s.name}
                                                </div>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <Badge variant="secondary" className="h-4 text-[10px] font-medium px-1.5">
                                                        {(s.events?.length ?? 0)} eventos
                                                    </Badge>
                                                    <span className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                                                        {s.type ?? 'week'}
                                                    </span>
                                                </div>
                                            </button>

                                            <DropdownMenu>
                                                <DropdownMenuTrigger
                                                    className="absolute top-1.5 right-1.5 size-7 grid place-items-center rounded-md text-muted-foreground hover:text-foreground hover:bg-background opacity-0 group-hover:opacity-100 data-[state=open]:opacity-100 transition-opacity"
                                                    onClick={(e) => e.stopPropagation()}
                                                >
                                                    <MoreHorizontal className="size-3.5" />
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem
                                                        onClick={() => deleteSchedule(s._id, s.name)}
                                                        className="text-destructive focus:text-destructive"
                                                    >
                                                        <Trash2 className="size-3.5 mr-2" />
                                                        Eliminar
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </motion.div>
                                    );
                                })}
                            </AnimatePresence>

                            {filteredSchedules.length === 0 && (
                                <div className="text-center py-12 px-3 rounded-md border border-dashed text-muted-foreground">
                                    <Calendar className="size-5 mx-auto mb-2 opacity-50" />
                                    <p className="text-xs mb-3">
                                        {search ? 'Sin coincidencias' : 'No hay rutinas creadas'}
                                    </p>
                                    {!search && (
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => setShowCreateModal(true)}
                                        >
                                            <Plus className="size-3.5" />
                                            Crear primera rutina
                                        </Button>
                                    )}
                                </div>
                            )}
                        </div>
                    </ScrollArea>

                    {/* Tip */}
                    <div className="p-3 border-t bg-muted/30">
                        <div className="flex items-start gap-2">
                            <Sparkles className="size-3.5 text-primary mt-0.5 shrink-0" />
                            <div>
                                <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-primary mb-0.5">
                                    Tip
                                </div>
                                <p className="text-[11px] leading-relaxed text-muted-foreground">
                                    Asigná un cronograma a cada pantalla en <em>Pantallas</em> para automatizar la publicación.
                                </p>
                            </div>
                        </div>
                    </div>
                </aside>

                {/* Editor area */}
                <main className="flex-1 overflow-hidden bg-background">
                    <AnimatePresence mode="wait">
                        {activeSchedule ? (
                            <motion.div
                                key={activeSchedule._id}
                                initial={{ opacity: 0, y: 6 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -6 }}
                                transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                                className="h-full flex flex-col"
                            >
                                <div className="flex-1 overflow-hidden">
                                    <ScheduleEditor
                                        schedule={activeSchedule as any}
                                        layouts={savedLayouts}
                                        onSave={saveSchedule}
                                    />
                                </div>
                            </motion.div>
                        ) : (
                            <motion.div
                                key="empty"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="h-full flex items-center justify-center px-8"
                            >
                                <div className="text-center max-w-md">
                                    <div className="size-14 rounded-2xl grid place-items-center mx-auto mb-4 bg-primary/10 text-primary">
                                        <Calendar size={24} strokeWidth={1.5} />
                                    </div>
                                    <h2 className="font-heading text-[20px] font-bold tracking-tight mb-1.5">
                                        Seleccioná una rutina
                                    </h2>
                                    <p className="text-[14px] leading-relaxed text-muted-foreground">
                                        Elegí una rutina del listado para editar sus eventos, o creá una nueva.
                                    </p>
                                    <Button
                                        onClick={() => setShowCreateModal(true)}
                                        className="mt-5"
                                    >
                                        <Plus className="size-4" />
                                        Nueva rutina
                                    </Button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </main>
            </div>

            {/* Create dialog */}
            <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
                <DialogContent className="sm:max-w-[420px]">
                    <DialogHeader>
                        <DialogTitle className="font-heading flex items-center gap-2">
                            <span className="size-9 rounded-lg grid place-items-center bg-primary/10 text-primary shrink-0">
                                <Calendar size={18} />
                            </span>
                            Nueva rutina
                        </DialogTitle>
                        <DialogDescription>
                            Asigná un nombre descriptivo para organizar tus automatizaciones.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-1.5 py-2">
                        <Label htmlFor="new-schedule-name">Nombre</Label>
                        <Input
                            id="new-schedule-name"
                            autoFocus
                            value={newScheduleName}
                            onChange={(e) => setNewScheduleName(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && createSchedule()}
                            placeholder="Ej. Mañanas spa, Menú de noche…"
                        />
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => { setShowCreateModal(false); setNewScheduleName(''); }}>
                            Cancelar
                        </Button>
                        <Button onClick={createSchedule} disabled={!newScheduleName.trim()}>
                            Crear rutina
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Toaster />
        </div>
    );
}
