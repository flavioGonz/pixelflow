'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { Smartphone, Monitor, RefreshCw, Zap, Shield, ShieldAlert, Edit2, Link as LinkIcon, Trash2, Power, Clock, Layout as LayoutIcon, Signal, Wifi, WifiOff } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ViewToggler } from '@/components/admin/ViewToggler';

let socket: Socket;

export default function ScreensPage() {
    const [screens, setScreens] = useState<any[]>([]);
    const [layouts, setLayouts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState<'grid' | 'table'>('table');

    const fetchData = useCallback(() => {
        if (socket) {
            socket.emit('get_screens');
            socket.emit('get_layouts');
        }
    }, []);

    useEffect(() => {
        socket = io();
        socket.on('connect', () => {
            setLoading(false);
            fetchData();
        });
        socket.on('screens_list', (data) => setScreens(data));
        socket.on('layouts_list', (data) => setLayouts(data));

        return () => { socket.disconnect(); };
    }, [fetchData]);

    const handleAuthorize = (screenId: string, status: boolean) => {
        socket.emit('authorize_screen', { screenId, isAuthorized: status });
    };

    const handleRename = (screenId: string) => {
        const name = prompt('Nuevo nombre para la pantalla:');
        if (name) socket.emit('rename_screen', { screenId, name });
    };

    const handleAssignLayout = (screenId: string, layoutId: string) => {
        socket.emit('assign_layout_to_screen', { screenId, layoutId });
    };

    return (
        <div className="flex-1 flex flex-col min-h-0 bg-[#050505] font-sans">
            <AdminHeader
                title="Gestión de Pantallas"
                subtitle="Monitoreo y autorización"
                icon={<Smartphone className="w-5 h-5" />}
                actions={
                    <div className="flex items-center gap-4">
                        <button onClick={fetchData} className="w-10 h-10 bg-[#0a0a0a] rounded-lg flex items-center justify-center text-neutral-500 hover:text-white transition-all border border-white/5 hover:border-white/20 active:scale-95 shadow-lg">
                            <RefreshCw className="w-4 h-4" />
                        </button>
                    </div>
                }
            />

            <div className="flex-1 overflow-hidden flex flex-col">
                <div className="px-10 py-8 border-b border-white/5 bg-black/20 flex justify-between items-center">
                    <div className="flex gap-4">
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/5 border border-emerald-500/10 rounded-lg">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">{screens.filter(s => Date.now() - new Date(s.lastSeen).getTime() < 15000).length} Online</span>
                        </div>
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 border border-white/5 rounded-lg">
                            <div className="w-1.5 h-1.5 rounded-full bg-neutral-500" />
                            <span className="text-[9px] font-black text-neutral-500 uppercase tracking-widest">{screens.length} Total</span>
                        </div>
                    </div>
                    <ViewToggler viewMode={viewMode} setViewMode={setViewMode} />
                </div>

                <div className="flex-1 overflow-y-auto p-10 custom-scrollbar">
                    {viewMode === 'grid' ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                            {screens.map((s) => {
                                const isOnline = Date.now() - new Date(s.lastSeen).getTime() < 15000;
                                const activeLayout = layouts.find(l => l._id === s.lastLayoutId);

                                return (
                                    <motion.div
                                        layout
                                        key={s.screenId}
                                        className={`bg-[#0a0a0a] border rounded-lg overflow-hidden group transition-all shadow-xl flex flex-col relative ${s.isAuthorized ? 'border-white/5 hover:border-blue-500/30' : 'border-yellow-500/20 bg-yellow-500/[0.02]'}`}
                                    >
                                        <div className="p-6 space-y-6">
                                            <div className="flex justify-between items-start">
                                                <div className={`w-14 h-14 rounded-lg flex items-center justify-center shadow-inner border ${isOnline ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' : 'bg-[#111] border-white/5 text-neutral-700'}`}>
                                                    <Monitor className="w-6 h-6" />
                                                </div>
                                                <div className="flex flex-col items-end gap-2">
                                                    {isOnline ? (
                                                        <span className="px-2 py-1 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 rounded text-[8px] font-black uppercase tracking-widest flex items-center gap-1.5">
                                                            <Wifi className="w-3 h-3" /> ONLINE
                                                        </span>
                                                    ) : (
                                                        <span className="px-2 py-1 bg-white/5 text-neutral-600 border border-white/5 rounded text-[8px] font-black uppercase tracking-widest flex items-center gap-1.5">
                                                            <WifiOff className="w-3 h-3" /> OFFLINE
                                                        </span>
                                                    )}
                                                    {!s.isAuthorized && (
                                                        <span className="px-2 py-1 bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 rounded text-[8px] font-black uppercase tracking-widest flex items-center gap-1.5 animate-pulse">
                                                            <ShieldAlert className="w-3 h-3" /> NO AUTORIZADO
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            <div>
                                                <div className="flex items-center gap-2 mb-1 group/edit">
                                                    <h3 className="text-lg font-black text-white uppercase italic tracking-tighter truncate">{s.name || 'Sin Nombre'}</h3>
                                                    <button onClick={() => handleRename(s.screenId)} className="text-neutral-600 hover:text-white transition-colors opacity-0 group-hover/edit:opacity-100">
                                                        <Edit2 className="w-3 h-3" />
                                                    </button>
                                                </div>
                                                <p className="text-[9px] text-neutral-600 font-mono font-bold tracking-widest bg-white/5 px-2 py-1 rounded w-fit">{s.screenId}</p>
                                            </div>

                                            <div className="space-y-2">
                                                <label className="text-[8px] font-black text-neutral-500 uppercase tracking-[0.2em] ml-1 flex items-center gap-1">
                                                    Diseño Asignado
                                                </label>
                                                <div className="relative group/select">
                                                    <select
                                                        className="w-full bg-[#111] border border-white/10 rounded-lg px-3 py-2.5 text-[10px] font-black text-blue-400 outline-none focus:border-blue-500/50 appearance-none cursor-pointer transition-colors focus:bg-blue-500/5 hover:border-white/20"
                                                        value={s.lastLayoutId || ''}
                                                        onChange={(e) => handleAssignLayout(s.screenId, e.target.value)}
                                                    >
                                                        <option value="" className="bg-[#0a0a0a]">SIN DISEÑO</option>
                                                        {layouts.map(l => (
                                                            <option key={l._id} value={l._id} className="bg-[#0a0a0a] text-white">
                                                                {l.name.toUpperCase()}
                                                            </option>
                                                        ))}
                                                    </select>
                                                    <LayoutIcon className="w-3.5 h-3.5 text-neutral-600 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none group-hover/select:text-blue-500 transition-colors" />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="mt-auto px-6 py-4 bg-[#080808] border-t border-white/5 flex gap-3">
                                            {s.isAuthorized ? (
                                                <button
                                                    onClick={() => handleAuthorize(s.screenId, false)}
                                                    className="flex-1 py-2.5 rounded-lg bg-red-900/10 text-red-500 hover:bg-red-500/20 hover:text-red-400 border border-transparent hover:border-red-500/20 transition-all text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-2"
                                                >
                                                    <Power className="w-3.5 h-3.5" /> Revocar
                                                </button>
                                            ) : (
                                                <button
                                                    onClick={() => handleAuthorize(s.screenId, true)}
                                                    className="flex-1 py-2.5 rounded-lg bg-emerald-600 text-white shadow-lg shadow-emerald-500/20 hover:bg-emerald-500 hover:scale-[1.02] active:scale-95 transition-all text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-2"
                                                >
                                                    <Shield className="w-3.5 h-3.5" /> Autorizar
                                                </button>
                                            )}
                                            <button
                                                onClick={() => {
                                                    const url = `${window.location.origin}/player/${s.screenId}`;
                                                    navigator.clipboard.writeText(url);
                                                    alert('URL copiada al portapapeles');
                                                }}
                                                className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center text-neutral-500 hover:bg-white/10 hover:text-white transition-all border border-white/5"
                                                title="Copiar URL Player"
                                            >
                                                <LinkIcon className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="bg-[#0a0a0a] border border-white/5 rounded-lg overflow-hidden shadow-2xl">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-white/5 bg-white/[0.02] text-[9px] font-black uppercase tracking-[0.2em] text-neutral-500">
                                        <th className="p-6 pl-8">Terminal ID</th>
                                        <th className="p-6">Estado</th>
                                        <th className="p-6">Diseño Actual</th>
                                        <th className="p-6">Autorización</th>
                                        <th className="p-6 pr-8 text-right">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody className="text-xs font-medium text-neutral-300">
                                    {screens.map((s) => {
                                        const isOnline = Date.now() - new Date(s.lastSeen).getTime() < 15000;
                                        return (
                                            <tr key={s.screenId} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors group">
                                                <td className="p-5 pl-8">
                                                    <div className="flex flex-col">
                                                        <div className="flex items-center gap-2">
                                                            <Monitor className="w-3.5 h-3.5 text-neutral-600" />
                                                            <span className="font-black text-white uppercase italic tracking-tight text-sm">{s.name || 'Sin Nombre'}</span>
                                                            <button onClick={() => handleRename(s.screenId)} className="text-neutral-600 hover:text-white transition-colors opacity-0 group-hover:opacity-100">
                                                                <Edit2 className="w-3 h-3" />
                                                            </button>
                                                        </div>
                                                        <span className="text-[9px] text-neutral-600 font-mono tracking-wider ml-6">{s.screenId}</span>
                                                    </div>
                                                </td>
                                                <td className="p-5">
                                                    {isOnline ? (
                                                        <span className="px-2 py-1 bg-emerald-500/10 text-emerald-500 border border-emerald-500/10 rounded text-[8px] font-black uppercase tracking-widest flex items-center gap-1.5 w-fit">
                                                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> ONLINE
                                                        </span>
                                                    ) : (
                                                        <span className="px-2 py-1 bg-white/5 text-neutral-600 border border-white/5 rounded text-[8px] font-black uppercase tracking-widest w-fit">OFFLINE</span>
                                                    )}
                                                </td>
                                                <td className="p-5">
                                                    <div className="relative group/select max-w-[200px]">
                                                        <select
                                                            className="w-full bg-[#111] border border-white/10 rounded-lg px-3 py-2 text-[9px] font-bold text-blue-400 outline-none focus:border-blue-500/50 appearance-none cursor-pointer transition-colors focus:bg-blue-500/5 hover:border-white/20"
                                                            value={s.lastLayoutId || ''}
                                                            onChange={(e) => handleAssignLayout(s.screenId, e.target.value)}
                                                        >
                                                            <option value="" className="bg-[#0a0a0a]">(Sin Diseño)</option>
                                                            {layouts.map(l => (
                                                                <option key={l._id} value={l._id} className="bg-[#0a0a0a] text-white">
                                                                    {l.name}
                                                                </option>
                                                            ))}
                                                        </select>
                                                        <LayoutIcon className="w-3 h-3 text-neutral-600 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                                                    </div>
                                                </td>
                                                <td className="p-5">
                                                    {s.isAuthorized ? (
                                                        <span className="text-emerald-500 text-[9px] font-black uppercase tracking-widest flex items-center gap-1">
                                                            <Shield className="w-3 h-3" /> Autorizado
                                                        </span>
                                                    ) : (
                                                        <span className="text-yellow-500 text-[9px] font-black uppercase tracking-widest flex items-center gap-1 animate-pulse">
                                                            <ShieldAlert className="w-3 h-3" /> Pendiente
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="p-5 pr-8 text-right flex justify-end gap-2">
                                                    {s.isAuthorized ? (
                                                        <button onClick={() => handleAuthorize(s.screenId, false)} className="p-2 hover:bg-red-500/10 rounded-lg text-neutral-400 hover:text-red-500 transition-colors" title="Revocar">
                                                            <Power className="w-4 h-4" />
                                                        </button>
                                                    ) : (
                                                        <button onClick={() => handleAuthorize(s.screenId, true)} className="p-2 hover:bg-emerald-500/10 rounded-lg text-neutral-400 hover:text-emerald-500 transition-colors" title="Autorizar">
                                                            <Shield className="w-4 h-4" />
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={() => {
                                                            const url = `${window.location.origin}/player/${s.screenId}`;
                                                            navigator.clipboard.writeText(url);
                                                            alert('URL copiada');
                                                        }}
                                                        className="p-2 hover:bg-white/10 rounded-lg text-neutral-400 hover:text-white transition-colors"
                                                        title="Copiar Link"
                                                    >
                                                        <LinkIcon className="w-4 h-4" />
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {screens.length === 0 && !loading && (
                        <div className="col-span-full py-32 flex flex-col items-center justify-center text-neutral-600 border border-white/5 rounded-lg bg-white/[0.01]">
                            <Smartphone className="w-12 h-12 mb-4 opacity-10" />
                            <h3 className="text-[10px] font-black uppercase tracking-[0.3em]">Esperando conexiones...</h3>
                            <p className="text-[9px] font-bold uppercase tracking-widest mt-2 max-w-xs text-center leading-relaxed opacity-50">Abre la URL del player en cualquier dispositivo</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
