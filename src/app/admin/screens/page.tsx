'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { io, Socket } from 'socket.io-client';
import { motion, AnimatePresence } from 'framer-motion';
import Smartphone from 'lucide-react/dist/esm/icons/smartphone';
import Monitor from 'lucide-react/dist/esm/icons/monitor';
import RefreshCw from 'lucide-react/dist/esm/icons/refresh-cw';
import Shield from 'lucide-react/dist/esm/icons/shield';
import ShieldAlert from 'lucide-react/dist/esm/icons/shield-alert';
import Edit2 from 'lucide-react/dist/esm/icons/edit-2';
import LinkIcon from 'lucide-react/dist/esm/icons/link';
import Power from 'lucide-react/dist/esm/icons/power';
import LayoutIcon from 'lucide-react/dist/esm/icons/layout';
import Signal from 'lucide-react/dist/esm/icons/signal';
import Search from 'lucide-react/dist/esm/icons/search';
import LayoutGrid from 'lucide-react/dist/esm/icons/layout-grid';
import List from 'lucide-react/dist/esm/icons/list';

import { AdminHeader } from '@/components/admin/AdminHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Toaster } from '@/components/ui/sonner';
import { copyToClipboard } from '@/lib/clipboard';
import { toast } from 'sonner';

let socket: Socket;

interface ScreenRow {
    screenId: string;
    name?: string;
    isAuthorized: boolean;
    lastSeen: string;
    lastLayoutId?: string;
    viewport?: { width: number; height: number; orientation?: string };
}

interface Layout { _id: string; name: string; }

const ONLINE_THRESHOLD_MS = 15000;
type StatusFilter = 'all' | 'online' | 'offline' | 'pending';

export default function ScreensPage() {
    const [screens, setScreens] = useState<ScreenRow[]>([]);
    const [layouts, setLayouts] = useState<Layout[]>([]);
    const [loading, setLoading] = useState(true);
    const [connected, setConnected] = useState(false);
    const [viewMode, setViewMode] = useState<'grid' | 'table'>('table');
    const [filter, setFilter] = useState<StatusFilter>('all');
    const [search, setSearch] = useState('');
    const [, setTick] = useState(0);
    const [revokeId, setRevokeId] = useState<string | null>(null);

    useEffect(() => {
        const id = setInterval(() => setTick((n) => n + 1), 5000);
        return () => clearInterval(id);
    }, []);

    const fetchData = useCallback(() => {
        if (socket) {
            socket.emit('get_screens');
            socket.emit('get_layouts');
        }
    }, []);

    useEffect(() => {
        socket = io();
        socket.on('connect', () => {
            setConnected(true);
            setLoading(false);
            fetchData();
        });
        socket.on('disconnect', () => setConnected(false));
        socket.on('screens_list', (data: ScreenRow[]) => setScreens(data));
        socket.on('layouts_list', (data: Layout[]) => setLayouts(data));
        return () => { socket.disconnect(); };
    }, [fetchData]);

    const handleAuthorize = (screenId: string, status: boolean) => {
        socket.emit('authorize_screen', { screenId, isAuthorized: status });
        toast.success(status ? 'Terminal autorizado' : 'Terminal revocado');
    };
    const handleRename = (screenId: string) => {
        const name = prompt('Nuevo nombre para la pantalla:');
        if (name) socket.emit('rename_screen', { screenId, name });
    };
    const handleAssignLayout = (screenId: string, layoutId: string) => {
        socket.emit('assign_layout_to_screen', { screenId, layoutId });
    };
    const copyPlayerUrl = async (screenId: string) => {
        const url = window.location.origin + '/player/' + screenId;
        const ok = await copyToClipboard(url);
        if (ok) toast.success('URL copiada', { description: url });
        else toast.error('No se pudo copiar', { description: url });
    };

    const filteredScreens = useMemo(() => {
        const now = Date.now();
        return screens
            .filter((s) => {
                const isOnline = now - new Date(s.lastSeen).getTime() < ONLINE_THRESHOLD_MS;
                if (filter === 'online' && !isOnline) return false;
                if (filter === 'offline' && isOnline) return false;
                if (filter === 'pending' && s.isAuthorized) return false;
                if (search && !((s.name || s.screenId).toLowerCase().includes(search.toLowerCase()))) return false;
                return true;
            })
            .sort((a, b) => {
                if (!a.isAuthorized && b.isAuthorized) return -1;
                if (a.isAuthorized && !b.isAuthorized) return 1;
                const aOnline = now - new Date(a.lastSeen).getTime() < ONLINE_THRESHOLD_MS;
                const bOnline = now - new Date(b.lastSeen).getTime() < ONLINE_THRESHOLD_MS;
                if (aOnline !== bOnline) return aOnline ? 1 : -1;
                return (a.name || a.screenId).localeCompare(b.name || b.screenId);
            });
    }, [screens, filter, search]);

    return (
        <div className="flex-1 flex flex-col min-h-0 bg-background text-foreground">
            <AdminHeader
                title="Monitoreo de Pantallas"
                subtitle="Terminales y puntos de emisión"
                icon={<Signal size={20} strokeWidth={1.75} />}
                actions={
                    <Button variant="outline" size="icon" className="size-8" onClick={fetchData} title="Refrescar">
                        <RefreshCw className="size-3.5" />
                    </Button>
                }
            />

            <div className="flex-1 overflow-y-auto custom-scrollbar">
                <div className="px-6 lg:px-10 pt-6 pb-4 flex flex-wrap items-center gap-3">
                    <Tabs value={filter} onValueChange={(v) => setFilter(v as StatusFilter)}>
                        <TabsList>
                            <TabsTrigger value="all">Todos</TabsTrigger>
                            <TabsTrigger value="online">Online</TabsTrigger>
                            <TabsTrigger value="pending">Pendientes</TabsTrigger>
                            <TabsTrigger value="offline">Offline</TabsTrigger>
                        </TabsList>
                    </Tabs>

                    <div className="relative flex-1 min-w-[200px] max-w-md">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                        <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar pantalla…" className="pl-9 h-9" />
                    </div>

                    <div className="ml-auto">
                        <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as 'grid' | 'table')}>
                            <TabsList>
                                <TabsTrigger value="table" className="gap-1.5"><List className="size-3.5" /> Tabla</TabsTrigger>
                                <TabsTrigger value="grid" className="gap-1.5"><LayoutGrid className="size-3.5" /> Grilla</TabsTrigger>
                            </TabsList>
                        </Tabs>
                    </div>
                </div>

                {filteredScreens.length === 0 && !loading && (
                    <EmptyState
                        total={screens.length}
                        title={screens.length === 0 ? 'Esperando conexiones' : 'Sin resultados'}
                        description={screens.length === 0 ? 'Abrí la URL del player en cualquier dispositivo para autorizarlo.' : 'Probá con otro filtro.'}
                    />
                )}

                {filteredScreens.length > 0 && viewMode === 'table' && (
                    <div className="px-6 lg:px-10 pb-10">
                        <div className="rounded-md border bg-card overflow-hidden">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Terminal</TableHead>
                                        <TableHead className="w-[120px]">Estado</TableHead>
                                        <TableHead className="w-[140px]">Resolución</TableHead>
                                        <TableHead className="w-[240px]">Diseño asignado</TableHead>
                                        <TableHead className="w-[160px]">Autorización</TableHead>
                                        <TableHead className="w-[140px] text-right">Acciones</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredScreens.map((s) => {
                                        const isOnline = Date.now() - new Date(s.lastSeen).getTime() < ONLINE_THRESHOLD_MS;
                                        return (
                                            <TableRow key={s.screenId}>
                                                <TableCell>
                                                    <div className="flex flex-col">
                                                        <div className="flex items-center gap-2">
                                                            <span className="font-medium text-foreground">{s.name || 'Sin nombre'}</span>
                                                            <button onClick={() => handleRename(s.screenId)} className="text-muted-foreground hover:text-foreground" title="Renombrar">
                                                                <Edit2 className="size-3" />
                                                            </button>
                                                        </div>
                                                        <span className="font-mono text-[11px] tracking-wider text-muted-foreground mt-0.5">{s.screenId}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell><StatusBadge online={isOnline} /></TableCell>
                                                <TableCell>
                                                    {s.viewport ? (
                                                        <span className="font-mono text-[12px] tabular-nums">{s.viewport.width}×{s.viewport.height}</span>
                                                    ) : (
                                                        <span className="text-[12px] text-muted-foreground">—</span>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    <Select value={s.lastLayoutId || ''} onValueChange={(v) => handleAssignLayout(s.screenId, v || '')}>
                                                        <SelectTrigger className="h-8">
                                                            <SelectValue placeholder="— Ninguno —" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {layouts.map((l) => (<SelectItem key={l._id} value={l._id}>{l.name}</SelectItem>))}
                                                        </SelectContent>
                                                    </Select>
                                                </TableCell>
                                                <TableCell>
                                                    {s.isAuthorized ? (
                                                        <Badge variant="secondary" className="gap-1.5"><Shield className="size-3" />Autorizado</Badge>
                                                    ) : (
                                                        <Badge variant="outline" className="gap-1.5 border-amber-500/40 text-amber-600 dark:text-amber-400"><ShieldAlert className="size-3" />Pendiente</Badge>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex justify-end gap-1">
                                                        {s.isAuthorized ? (
                                                            <Button variant="ghost" size="icon" className="size-8 text-muted-foreground hover:text-destructive" onClick={() => setRevokeId(s.screenId)} title="Revocar">
                                                                <Power className="size-4" />
                                                            </Button>
                                                        ) : (
                                                            <Button variant="default" size="sm" className="h-8" onClick={() => handleAuthorize(s.screenId, true)}>
                                                                <Shield className="size-3.5" /> Autorizar
                                                            </Button>
                                                        )}
                                                        <Button variant="ghost" size="icon" className="size-8" onClick={() => copyPlayerUrl(s.screenId)} title="Copiar URL">
                                                            <LinkIcon className="size-4" />
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        </div>
                    </div>
                )}

                {filteredScreens.length > 0 && viewMode === 'grid' && (
                    <div className="px-6 lg:px-10 pb-10 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
                        <AnimatePresence mode="popLayout">
                            {filteredScreens.map((s) => {
                                const isOnline = Date.now() - new Date(s.lastSeen).getTime() < ONLINE_THRESHOLD_MS;
                                return (
                                    <motion.div
                                        key={s.screenId}
                                        layout
                                        initial={{ opacity: 0, y: 8 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.96 }}
                                        className={'rounded-md border bg-card overflow-hidden flex flex-col ' + (!s.isAuthorized ? 'border-amber-500/50' : '')}
                                    >
                                        <div className="p-4 space-y-3">
                                            <div className="flex items-start justify-between gap-2">
                                                <div className="flex items-center gap-2 min-w-0">
                                                    <Monitor className={'size-4 shrink-0 ' + (isOnline ? 'text-emerald-500' : 'text-muted-foreground')} />
                                                    <div className="min-w-0">
                                                        <div className="flex items-center gap-1.5">
                                                            <span className="font-heading text-[14px] font-semibold tracking-tight truncate">{s.name || 'Sin nombre'}</span>
                                                            <button onClick={() => handleRename(s.screenId)} className="text-muted-foreground hover:text-foreground"><Edit2 className="size-3" /></button>
                                                        </div>
                                                        <p className="font-mono text-[10px] text-muted-foreground truncate">{s.screenId}</p>
                                                    </div>
                                                </div>
                                                <div className="flex flex-col items-end gap-1">
                                                    <StatusBadge online={isOnline} />
                                                    {!s.isAuthorized && (
                                                        <Badge variant="outline" className="gap-1.5 border-amber-500/40 text-amber-600 dark:text-amber-400"><ShieldAlert className="size-3" />Pendiente</Badge>
                                                    )}
                                                </div>
                                            </div>
                                            {s.viewport && (
                                                <p className="text-[11px] text-muted-foreground">Resolución: <span className="font-mono text-foreground">{s.viewport.width}×{s.viewport.height}</span></p>
                                            )}
                                            <div className="space-y-1">
                                                <label className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground flex items-center gap-1.5"><LayoutIcon className="size-3" /> Diseño</label>
                                                <Select value={s.lastLayoutId || ''} onValueChange={(v) => handleAssignLayout(s.screenId, v || '')}>
                                                    <SelectTrigger className="h-8"><SelectValue placeholder="— Ninguno —" /></SelectTrigger>
                                                    <SelectContent>{layouts.map((l) => (<SelectItem key={l._id} value={l._id}>{l.name}</SelectItem>))}</SelectContent>
                                                </Select>
                                            </div>
                                        </div>
                                        <div className="mt-auto px-4 py-3 border-t flex items-center gap-2">
                                            {s.isAuthorized ? (
                                                <Button variant="outline" size="sm" className="flex-1 text-destructive hover:text-destructive" onClick={() => setRevokeId(s.screenId)}><Power className="size-3.5" /> Revocar</Button>
                                            ) : (
                                                <Button size="sm" className="flex-1" onClick={() => handleAuthorize(s.screenId, true)}><Shield className="size-3.5" /> Autorizar</Button>
                                            )}
                                            <Button variant="outline" size="icon" className="size-8" onClick={() => copyPlayerUrl(s.screenId)} title="Copiar URL"><LinkIcon className="size-3.5" /></Button>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </AnimatePresence>
                    </div>
                )}
            </div>

            <AnimatePresence>
                {!connected && !loading && (
                    <motion.div
                        initial={{ y: 40, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: 40, opacity: 0 }}
                        className="px-6 lg:px-10 py-3 border-t flex items-center gap-3 text-[13px] bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300"
                    >
                        <RefreshCw size={14} className="animate-spin" />
                        <span>Reconectando con el servidor de tiempo real…</span>
                    </motion.div>
                )}
            </AnimatePresence>

            <AlertDialog open={!!revokeId} onOpenChange={(o) => !o && setRevokeId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>¿Revocar autorización?</AlertDialogTitle>
                        <AlertDialogDescription>La pantalla quedará desconectada y dejará de recibir contenido hasta autorizarla nuevamente.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction className="bg-destructive text-white hover:bg-destructive/90" onClick={() => { if (revokeId) handleAuthorize(revokeId, false); setRevokeId(null); }}>
                            Revocar
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <Toaster />
        </div>
    );
}

const StatusBadge: React.FC<{ online: boolean }> = ({ online }) => (
    online ? (
        <Badge variant="outline" className="gap-1.5 border-emerald-500/40 text-emerald-600 dark:text-emerald-400">
            <span className="size-1.5 rounded-full bg-emerald-500 pf-pulse-dot" />
            Online
        </Badge>
    ) : (
        <Badge variant="outline" className="gap-1.5 text-muted-foreground">
            <span className="size-1.5 rounded-full bg-muted-foreground/60" />
            Offline
        </Badge>
    )
);

const EmptyState: React.FC<{ total: number; title: string; description: string }> = ({ total, title, description }) => (
    <div className="px-6 lg:px-10 pb-10">
        <div className="rounded-md border bg-card py-20 flex flex-col items-center justify-center text-center">
            <div className="size-12 rounded-md grid place-items-center mb-4 bg-primary/10 text-primary">
                <Smartphone className="size-5" />
            </div>
            <h3 className="font-heading text-[15px] font-bold mb-1">{title}</h3>
            <p className="text-[13px] text-muted-foreground max-w-md">{description}</p>
            {total === 0 && (
                <code className="font-mono text-[11px] mt-4 px-3 py-1.5 rounded bg-muted text-primary">
                    http://host:puerto/player/ID_UNICO
                </code>
            )}
        </div>
    </div>
);
