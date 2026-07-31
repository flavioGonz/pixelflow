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
import Trash2 from 'lucide-react/dist/esm/icons/trash-2';
import LayoutIcon from 'lucide-react/dist/esm/icons/layout';
import Signal from 'lucide-react/dist/esm/icons/signal';
import Wifi from 'lucide-react/dist/esm/icons/wifi';
import WifiOff from 'lucide-react/dist/esm/icons/wifi-off';
import ShieldCheck from 'lucide-react/dist/esm/icons/shield-check';
import Activity from 'lucide-react/dist/esm/icons/activity';
import Circle from 'lucide-react/dist/esm/icons/circle';
import Search from 'lucide-react/dist/esm/icons/search';
import LayoutGrid from 'lucide-react/dist/esm/icons/layout-grid';
import List from 'lucide-react/dist/esm/icons/list';
import Zap from 'lucide-react/dist/esm/icons/zap';
import RotateCw from 'lucide-react/dist/esm/icons/rotate-cw';
import MoreVertical from 'lucide-react/dist/esm/icons/more-vertical';
import Cpu from 'lucide-react/dist/esm/icons/cpu';

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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
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
    userAgent?: string;
    ipAddress?: string;
    idleTimeoutMs?: number;
}

interface Layout { _id: string; name: string; }


// Extract browser + version + OS from userAgent string. Lightweight — no external lib.
function parseUA(ua?: string): { browser: string; version: string; os: string } {
    if (!ua) return { browser: '—', version: '', os: '' };
    let browser = 'Unknown', version = '';
    // Order matters (Edge/Opera pretend to be Chrome)
    if (/Edg\/([\d.]+)/.test(ua))         { browser = 'Edge';    version = ua.match(/Edg\/([\d.]+)/)![1]; }
    else if (/OPR\/([\d.]+)/.test(ua))    { browser = 'Opera';   version = ua.match(/OPR\/([\d.]+)/)![1]; }
    else if (/Firefox\/([\d.]+)/.test(ua)){ browser = 'Firefox'; version = ua.match(/Firefox\/([\d.]+)/)![1]; }
    else if (/Chrome\/([\d.]+)/.test(ua)) { browser = 'Chrome';  version = ua.match(/Chrome\/([\d.]+)/)![1]; }
    else if (/Version\/([\d.]+).*Safari/.test(ua)) { browser = 'Safari'; version = ua.match(/Version\/([\d.]+)/)![1]; }
    else if (/Safari\/([\d.]+)/.test(ua)) { browser = 'Safari';  version = ua.match(/Safari\/([\d.]+)/)![1]; }
    let os = '';
    if (/Windows NT ([\d.]+)/.test(ua)) os = 'Windows';
    else if (/Mac OS X/.test(ua))        os = 'macOS';
    else if (/Android/.test(ua))         os = 'Android';
    else if (/iPhone|iPad/.test(ua))     os = 'iOS';
    else if (/Linux/.test(ua))           os = 'Linux';
    return { browser, version: version.split('.')[0], os };
}

const BROWSER_ICON: Record<string, string> = {
    Chrome:  '🌐',
    Firefox: '🦊',
    Safari:  '🧭',
    Edge:    '🔷',
    Opera:   '🎭',
    Unknown: '❓',
};

const ONLINE_THRESHOLD_MS = 45000; // Fase A: permite 3-4 heartbeats fallidos antes de marcar offline
type StatusFilter = 'all' | 'online' | 'offline' | 'pending';

export default function ScreensPage() {
    const [screens, setScreens] = useState<ScreenRow[]>([]);
    const [layouts, setLayouts] = useState<Layout[]>([]);
    const [loading, setLoading] = useState(true);
    const [connected, setConnected] = useState(false);
    const [viewMode, setViewMode] = useState<'grid' | 'table' | 'calendar'>('table');
    const [filter, setFilter] = useState<StatusFilter>('online');
    const [search, setSearch] = useState('');
    const [, setTick] = useState(0);
    const [revokeId, setRevokeId] = useState<string | null>(null);
    const [toDelete, setToDelete] = useState<ScreenRow | null>(null);

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
        socket.on('remote_command_reply', (data: any) => {
            if (data?.action === 'health_check') {
                setHealthResult((prev: any) => (prev && prev.screenId === data.screenId ? { ...prev, loading: false, result: data.result } : prev));
            }
        });
        return () => { socket.disconnect(); };
    }, [fetchData]);

    const handleDelete = () => {
        if (!toDelete) return;
        socket.emit('delete_screen', toDelete.screenId);
        toast.success('Pantalla eliminada', { description: toDelete.name || toDelete.screenId });
        setToDelete(null);
    };

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
    // Fase C: Comandos remotos
    const [healthResult, setHealthResult] = useState<any>(null);
    const [forceLayoutFor, setForceLayoutFor] = useState<{ screenId: string; name: string } | null>(null);
    const sendRemote = useCallback((screenId: string, action: string, payload?: any) => {
        socket.emit('remote_command', { screenId, action, payload });
    }, []);
    const cmdSoftRefresh = (s: ScreenRow) => { sendRemote(s.screenId, 'soft_refresh'); toast.success('Refresh enviado', { description: s.name || s.screenId }); };
    const cmdHardReload  = (s: ScreenRow) => { sendRemote(s.screenId, 'hard_reload'); toast.success('Reload enviado', { description: s.name || s.screenId }); };
    const cmdHealth      = (s: ScreenRow) => {
        setHealthResult({ screenId: s.screenId, name: s.name || s.screenId, loading: true });
        sendRemote(s.screenId, 'health_check');
    };
    const cmdForceLayout = (s: ScreenRow, layoutId: string) => {
        sendRemote(s.screenId, 'force_layout', { layoutId });
        const ln = layouts.find(l => l._id === layoutId)?.name || layoutId;
        toast.success('Interface forzada', { description: `${s.name || s.screenId} → ${ln}` });
        setForceLayoutFor(null);
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

    const handleUpdateIdleTimeout = async (screenId: string, seconds: number) => {
        try {
            const secs = Math.max(3, Math.min(600, seconds || 20));
            const res = await fetch('/api/screens/' + screenId + '/idle-timeout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ idleTimeoutMs: secs * 1000 })
            });
            if (!res.ok) throw new Error('save failed');
            setScreens(prev => prev.map(s => s.screenId === screenId ? { ...s, idleTimeoutMs: secs * 1000 } : s));
        } catch (e) {
            console.error('idle timeout update failed', e);
        }
    };
    return (
        <TooltipProvider delay={200}><div className="flex-1 flex flex-col min-h-0 bg-background text-foreground">
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
                {/* Filter tabs + search + view */}
                <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b">
                    <div className="px-6 lg:px-10 py-3 flex flex-wrap items-center gap-3">
                        <Tabs value={filter} onValueChange={(v) => setFilter(v as StatusFilter)}>
                            <TabsList variant="line" className="h-9 bg-transparent border-b-0 p-0">
                                <TabsTrigger value="online" className="gap-1.5 px-3 h-9 text-[12px] data-[state=active]:text-emerald-500">
                                    <span className="size-1.5 rounded-full bg-emerald-500 pf-pulse-dot" />
                                    Online
                                    <Badge variant="secondary" className="h-4 px-1 text-[10px] font-mono tabular-nums bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                                        {screens.filter(s => Date.now() - new Date(s.lastSeen).getTime() < ONLINE_THRESHOLD_MS).length}
                                    </Badge>
                                </TabsTrigger>
                                <TabsTrigger value="offline" className="gap-1.5 px-3 h-9 text-[12px]">
                                    <WifiOff className="size-3 text-rose-500" /> Offline
                                    <Badge variant="secondary" className="h-4 px-1 text-[10px] font-mono tabular-nums">
                                        {screens.filter(s => s.isAuthorized && Date.now() - new Date(s.lastSeen).getTime() >= ONLINE_THRESHOLD_MS).length}
                                    </Badge>
                                </TabsTrigger>
                                <TabsTrigger value="pending" className="gap-1.5 px-3 h-9 text-[12px]">
                                    <ShieldAlert className="size-3 text-amber-500" /> Pendientes
                                    <Badge variant="secondary" className="h-4 px-1 text-[10px] font-mono tabular-nums bg-amber-500/10 text-amber-600 dark:text-amber-400">
                                        {screens.filter(s => !s.isAuthorized).length}
                                    </Badge>
                                </TabsTrigger>
                                <TabsTrigger value="all" className="gap-1.5 px-3 h-9 text-[12px] text-muted-foreground">
                                    <Circle className="size-3" /> Todos
                                    <Badge variant="outline" className="h-4 px-1 text-[10px] font-mono tabular-nums">{screens.length}</Badge>
                                </TabsTrigger>
                            </TabsList>
                        </Tabs>

                        <div className="relative flex-1 min-w-[200px] max-w-md">
                            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar por nombre o ID..." className="pl-8 h-9" />
                        </div>

                        <div className="ml-auto flex items-center gap-2">
                            <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                                <span className={"size-1.5 rounded-full " + (connected ? "bg-emerald-500 pf-pulse-dot" : "bg-rose-500")} />
                                {connected ? 'Conectado' : 'Reconectando…'}
                            </div>
                            <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as 'grid' | 'table' | 'calendar')}>
                                <TabsList>
                                    <TabsTrigger value="table" className="gap-1.5"><List className="size-3.5" /> Tabla</TabsTrigger>
                                    <TabsTrigger value="grid" className="gap-1.5"><LayoutGrid className="size-3.5" /> Grilla</TabsTrigger>
                                </TabsList>
                            </Tabs>
                        </div>
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
                                        <TableHead>
                                            <Tooltip><TooltipTrigger><span className="cursor-help">Terminal</span></TooltipTrigger><TooltipContent>Nombre y ID único del dispositivo</TooltipContent></Tooltip>
                                        </TableHead>
                                        <TableHead className="w-[110px]">
                                            <Tooltip><TooltipTrigger><span className="cursor-help">Estado</span></TooltipTrigger><TooltipContent>Online si envió heartbeat en los últimos 15 s</TooltipContent></Tooltip>
                                        </TableHead>
                                        <TableHead className="w-[150px]">
                                            <Tooltip><TooltipTrigger><span className="cursor-help">Navegador</span></TooltipTrigger><TooltipContent>Browser detectado desde el User-Agent</TooltipContent></Tooltip>
                                        </TableHead>
                                        <TableHead className="w-[130px]">
                                            <Tooltip><TooltipTrigger><span className="cursor-help">IP</span></TooltipTrigger><TooltipContent>Dirección IP desde donde se conectó por última vez</TooltipContent></Tooltip>
                                        </TableHead>
                                        <TableHead className="w-[140px]">
                                            <Tooltip><TooltipTrigger><span className="cursor-help">Resolución</span></TooltipTrigger><TooltipContent>Viewport reportado por el player</TooltipContent></Tooltip>
                                        </TableHead>
                                        <TableHead className="w-[240px]">Diseño por defecto</TableHead>
                                        <TableHead className="w-[120px]">Timeout</TableHead>
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
                                                    {(() => {
                                                        const ua = parseUA(s.userAgent);
                                                        return (
                                                            <Tooltip>
                                                                <TooltipTrigger>
                                                                    <div className="flex items-center gap-1.5 cursor-help">
                                                                        <span className="text-base leading-none">{BROWSER_ICON[ua.browser] || BROWSER_ICON.Unknown}</span>
                                                                        <div className="min-w-0">
                                                                            <div className="text-[12px] font-medium leading-tight truncate">{ua.browser}{ua.version && ' ' + ua.version}</div>
                                                                            {ua.os && <div className="text-[10px] text-muted-foreground leading-tight">{ua.os}</div>}
                                                                        </div>
                                                                    </div>
                                                                </TooltipTrigger>
                                                                <TooltipContent className="max-w-md break-all"><span className="font-mono text-[10px]">{s.userAgent || '(sin User-Agent)'}</span></TooltipContent>
                                                            </Tooltip>
                                                        );
                                                    })()}
                                                </TableCell>
                                                <TableCell>
                                                    {s.ipAddress ? (
                                                        <Tooltip>
                                                            <TooltipTrigger>
                                                                <span className="font-mono text-[11px] tabular-nums cursor-help">{s.ipAddress.replace(/^::ffff:/, '').replace(/^::1$/, 'localhost')}</span>
                                                            </TooltipTrigger>
                                                            <TooltipContent>Última IP desde la que se conectó el player</TooltipContent>
                                                        </Tooltip>
                                                    ) : (
                                                        <span className="text-[12px] text-muted-foreground">—</span>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    {s.viewport ? (
                                                        <span className="font-mono text-[12px] tabular-nums">{s.viewport.width}×{s.viewport.height}</span>
                                                    ) : (
                                                        <span className="text-[12px] text-muted-foreground">—</span>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    {(() => {
                                                        const assigned = layouts.find(l => l._id === s.lastLayoutId);
                                                        return (
                                                            <Select value={s.lastLayoutId || 'NONE'} onValueChange={(v) => handleAssignLayout(s.screenId, (!v || v === 'NONE') ? '' : v)}>
                                                                <SelectTrigger className="h-8">
                                                                    <span className="truncate text-[12px]">
                                                                        {assigned ? assigned.name : <span className="text-muted-foreground">— Ninguno —</span>}
                                                                    </span>
                                                                </SelectTrigger>
                                                                <SelectContent>
                                                                    <SelectItem value="NONE"><span className="text-muted-foreground">— Ninguno —</span></SelectItem>
                                                                    {layouts.map((l) => (<SelectItem key={l._id} value={l._id}>{l.name}</SelectItem>))}
                                                                </SelectContent>
                                                            </Select>
                                                        );
                                                    })()}
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-1">
                                                        <Input
                                                            type="number"
                                                            min={3}
                                                            max={600}
                                                            value={Math.round((s.idleTimeoutMs || 20000) / 1000)}
                                                            onChange={(e) => handleUpdateIdleTimeout(s.screenId, parseInt(e.target.value) || 20)}
                                                            className="h-8 w-16 text-xs font-mono"
                                                            title="Tiempo (seg) antes de volver al diseño por defecto"
                                                        />
                                                        <span className="text-[11px] text-muted-foreground">s</span>
                                                    </div>
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
                                                            <Button variant="ghost" size="icon" className="size-8 text-muted-foreground hover:text-destructive" onClick={() => setRevokeId(s.screenId)} title="Revocar autorizacion">
                                                                <Power className="size-4" />
                                                            </Button>
                                                        ) : (
                                                            <Button variant="default" size="sm" className="h-8" onClick={() => handleAuthorize(s.screenId, true)}>
                                                                <Shield className="size-3.5" /> Autorizar
                                                            </Button>
                                                        )}
                                                        <DropdownMenu>
                                                            <DropdownMenuTrigger
                                                                className="inline-flex items-center justify-center size-8 rounded-md text-muted-foreground hover:text-primary hover:bg-accent transition-colors focus:outline-none focus:ring-2 focus:ring-primary/40"
                                                                title="Comandos remotos"
                                                                aria-label="Comandos remotos"
                                                            >
                                                                <Zap className="size-4" />
                                                            </DropdownMenuTrigger>
                                                            <DropdownMenuContent align="end" className="w-56">
                                                                <DropdownMenuLabel className="text-[10px] uppercase tracking-widest text-muted-foreground">Comandos remotos</DropdownMenuLabel>
                                                                <DropdownMenuSeparator />
                                                                <DropdownMenuItem onClick={() => cmdSoftRefresh(s)} disabled={!isOnline}>
                                                                    <RefreshCw className="size-3.5 mr-2" /> Refresh suave
                                                                </DropdownMenuItem>
                                                                <DropdownMenuItem onClick={() => cmdHardReload(s)} disabled={!isOnline}>
                                                                    <RotateCw className="size-3.5 mr-2" /> Reload completo
                                                                </DropdownMenuItem>
                                                                <DropdownMenuItem onClick={() => setForceLayoutFor({ screenId: s.screenId, name: s.name || s.screenId })} disabled={!isOnline}>
                                                                    <LayoutIcon className="size-3.5 mr-2" /> Forzar interface…
                                                                </DropdownMenuItem>
                                                                <DropdownMenuSeparator />
                                                                <DropdownMenuItem onClick={() => cmdHealth(s)} disabled={!isOnline}>
                                                                    <Activity className="size-3.5 mr-2" /> Health check
                                                                </DropdownMenuItem>
                                                            </DropdownMenuContent>
                                                        </DropdownMenu>
                                                        <Button variant="ghost" size="icon" className="size-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10" onClick={() => setToDelete(s)} title="Eliminar pantalla">
                                                            <Trash2 className="size-4" />
                                                        </Button>
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

            <AlertDialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Eliminar pantalla?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Se eliminara <b>{toDelete?.name || toDelete?.screenId}</b> del sistema. Si estaba conectada, se desconectara y quedara sin autorizar. Esta accion no borra los diseños asociados.
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

            {/* Fase C: Health check */}
            <Dialog open={!!healthResult} onOpenChange={(o) => { if (!o) setHealthResult(null); }}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Cpu className="size-5 text-primary" /> Health check — {healthResult?.name || ''}
                        </DialogTitle>
                    </DialogHeader>
                    {healthResult?.loading ? (
                        <div className="py-8 text-center text-sm text-muted-foreground flex flex-col items-center gap-2">
                            <RefreshCw className="size-5 animate-spin" />
                            Esperando respuesta del player…
                            <span className="text-[10px]">Si no responde en 5s, es probable que esté colgado o sin red.</span>
                        </div>
                    ) : healthResult?.result ? (
                        <div className="space-y-2 text-[12px]">
                            <div className="grid grid-cols-2 gap-2">
                                <Stat label="Build ID"    value={healthResult.result.version} mono />
                                <Stat label="Uptime"      value={fmtMs(healthResult.result.uptimeMs)} />
                                <Stat label="Viewport"    value={`${healthResult.result.viewport?.w}×${healthResult.result.viewport?.h}`} mono />
                                <Stat label="Orientación" value={healthResult.result.viewport?.orientation} />
                                <Stat label="Layout"      value={healthResult.result.layoutName || '—'} />
                                <Stat label="Online SO"   value={healthResult.result.online ? '✅ sí' : '❌ no'} />
                                {healthResult.result.memory && (<>
                                    <Stat label="RAM JS"     value={`${healthResult.result.memory.usedMB}MB`} />
                                    <Stat label="RAM límite" value={`${healthResult.result.memory.limitMB}MB`} />
                                </>)}
                            </div>
                            <div className="text-[10px] uppercase tracking-widest text-muted-foreground mt-3 mb-1">Últimos errores JS ({healthResult.result.errors?.length || 0})</div>
                            {(!healthResult.result.errors || healthResult.result.errors.length === 0) ? (
                                <div className="text-[11px] text-emerald-500">✓ Sin errores</div>
                            ) : (
                                <ul className="space-y-1 max-h-40 overflow-y-auto">
                                    {healthResult.result.errors.map((e: any, i: number) => (
                                        <li key={i} className="text-[10px] font-mono bg-destructive/5 border border-destructive/20 rounded px-2 py-1">
                                            <span className="text-destructive">{e.msg}</span>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    ) : null}
                </DialogContent>
            </Dialog>

            {/* Fase C: Force Layout */}
            <Dialog open={!!forceLayoutFor} onOpenChange={(o) => { if (!o) setForceLayoutFor(null); }}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Forzar interface en {forceLayoutFor?.name || ''}</DialogTitle>
                    </DialogHeader>
                    <div className="grid grid-cols-1 gap-1.5 max-h-80 overflow-y-auto">
                        {layouts.map((l) => (
                            <button
                                key={l._id}
                                onClick={() => forceLayoutFor && cmdForceLayout({ screenId: forceLayoutFor.screenId } as any, l._id)}
                                className="text-left px-3 py-2 rounded border hover:bg-accent hover:border-primary/50 transition-colors flex items-center gap-2 text-[13px]"
                            >
                                <LayoutIcon className="size-4 text-muted-foreground" />
                                <span className="flex-1 truncate">{l.name}</span>
                            </button>
                        ))}
                        {layouts.length === 0 && (
                            <div className="text-center text-[12px] text-muted-foreground py-4">No hay interfaces guardadas.</div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    </TooltipProvider>);
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

const StatPill: React.FC<{ icon: React.ReactNode; label: string; value: number; tint: 'muted' | 'emerald' | 'amber' | 'rose' }> = ({ icon, label, value, tint }) => {
    const styles: Record<string, string> = {
        muted:   'border-border bg-card text-muted-foreground',
        emerald: 'border-emerald-500/25 bg-emerald-500/5 text-emerald-700 dark:text-emerald-400',
        amber:   'border-amber-500/25 bg-amber-500/5 text-amber-700 dark:text-amber-400',
        rose:    'border-rose-500/25 bg-rose-500/5 text-rose-700 dark:text-rose-400',
    };
    return (
        <div className={'rounded-lg border px-3.5 py-2.5 flex items-center gap-2.5 transition-colors ' + styles[tint]}>
            <span className="shrink-0 opacity-80">{icon}</span>
            <div className="flex flex-col min-w-0">
                <span className="text-[10px] uppercase tracking-[0.14em] font-semibold opacity-70 truncate">{label}</span>
                <span className="font-mono text-lg font-bold tabular-nums leading-none">{value}</span>
            </div>


        </div>
    );
};

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


const Stat: React.FC<{ label: string; value: React.ReactNode; mono?: boolean }> = ({ label, value, mono }) => (
    <div className="rounded border bg-muted/30 px-2 py-1.5">
        <div className="text-[9px] uppercase tracking-widest text-muted-foreground">{label}</div>
        <div className={"text-[12px] font-semibold " + (mono ? 'font-mono truncate' : '')}>{value}</div>
    </div>
);

const fmtMs = (ms: number) => {
    if (!ms || ms < 0) return '—';
    const s = Math.floor(ms / 1000);
    if (s < 60) return s + 's';
    const m = Math.floor(s / 60);
    if (m < 60) return m + 'm ' + (s % 60) + 's';
    const h = Math.floor(m / 60);
    return h + 'h ' + (m % 60) + 'm';
};
