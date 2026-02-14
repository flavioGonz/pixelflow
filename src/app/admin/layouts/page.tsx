'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { Database, Plus, RefreshCw, Trash2, Copy, Eye, Layout as LayoutIcon, Search, Monitor, Smartphone, Edit2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { ViewToggler } from '@/components/admin/ViewToggler';

let socket: Socket;

export default function LayoutsPage() {
    const [layouts, setLayouts] = useState<any[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState<'grid' | 'table'>('table');

    const fetchLayouts = useCallback(() => {
        if (socket) {
            socket.emit('get_layouts');
        }
    }, []);

    useEffect(() => {
        socket = io();
        socket.on('connect', () => {
            setLoading(false);
            fetchLayouts();
        });
        socket.on('layouts_list', (data) => setLayouts(data));

        return () => { socket.disconnect(); };
    }, [fetchLayouts]);

    const handleDelete = (id: string) => {
        if (confirm('¿Seguro que deseas eliminar este diseño permanentemente?')) {
            socket.emit('delete_layout', id);
            setTimeout(fetchLayouts, 500);
        }
    };

    const handleDuplicate = (layout: any) => {
        if (confirm('¿Crear una copia de este diseño?')) {
            const newLayout = { ...layout };
            delete newLayout._id;
            delete newLayout.__v;
            newLayout.name = `${layout.name} (Copia)`;
            socket.emit('save_layout', { screenId: null, layout: newLayout });
            setTimeout(fetchLayouts, 800);
        }
    };

    const filtered = layouts.filter(l => l.name.toLowerCase().includes(searchTerm.toLowerCase()));

    return (
        <div className="flex-1 flex flex-col min-h-0 bg-[#050505]">
            <AdminHeader
                title="Diseños Guardados"
                subtitle="Biblioteca de lienzos y plantillas"
                icon={<Database className="w-5 h-5" />}
                actions={
                    <button className="bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-black uppercase px-6 py-3 rounded-xl flex items-center gap-2 transition-all active:scale-95 shadow-lg shadow-blue-500/20">
                        <Plus className="w-4 h-4" /> Nuevo Lienzo
                    </button>
                }
            />

            <div className="flex-1 overflow-hidden flex flex-col">
                <div className="px-10 py-6 border-b border-white/5 bg-black/20 flex items-center gap-6">
                    <div className="relative group/search flex-1 max-w-xl">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-600 group-focus-within/search:text-blue-500 transition-colors" />
                        <input
                            type="text"
                            placeholder="BUSCAR DISEÑOS..."
                            className="w-full bg-[#111] border border-white/10 rounded-xl py-3.5 pl-12 pr-6 text-[10px] font-black uppercase tracking-widest outline-none focus:border-blue-500/50 transition-all"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <ViewToggler viewMode={viewMode} setViewMode={setViewMode} />
                </div>

                <div className="flex-1 overflow-y-auto p-10 custom-scrollbar">
                    {viewMode === 'grid' ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                            {filtered.map((l) => (
                                <motion.div
                                    layout
                                    key={l._id}
                                    className="bg-[#111] border border-white/5 rounded-3xl overflow-hidden group hover:border-blue-500/30 transition-all shadow-2xl relative"
                                >
                                    <div className="aspect-[16/9] bg-black relative group/preview">
                                        {/* Thumbnail Placeholder with Orientation */}
                                        <div className="absolute inset-0 flex flex-col items-center justify-center opacity-20 transition-opacity group-hover/preview:opacity-40">
                                            {l.orientation === 'portrait' ? <Smartphone className="w-20 h-20" /> : <Monitor className="w-24 h-24" />}
                                            <span className="text-[10px] font-black uppercase tracking-[0.3em] mt-4">{l.orientation}</span>
                                        </div>

                                        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />

                                        <div className="absolute top-4 right-4 flex gap-2">
                                            <button
                                                onClick={() => handleDuplicate(l)}
                                                className="w-8 h-8 rounded-lg bg-black/60 backdrop-blur-md border border-white/10 flex items-center justify-center text-blue-400 hover:bg-blue-600 hover:text-white transition-all"
                                                title="Duplicar"
                                            >
                                                <Copy className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(l._id)}
                                                className="w-8 h-8 rounded-lg bg-black/60 backdrop-blur-md border border-white/10 flex items-center justify-center text-red-500 hover:bg-red-500 hover:text-white transition-all"
                                                title="Eliminar"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>

                                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/preview:opacity-100 transition-opacity backdrop-blur-[2px] bg-blue-600/5">
                                            <Link href={`/admin?id=${l._id}`}>
                                                <button className="bg-white text-blue-600 font-black uppercase text-[10px] tracking-widest px-8 py-3 rounded-full shadow-2xl transform translate-y-4 group-hover/preview:translate-y-0 transition-all">
                                                    Abrir en Editor
                                                </button>
                                            </Link>
                                        </div>
                                    </div>

                                    <div className="p-6">
                                        <h3 className="text-sm font-black text-white uppercase italic tracking-tighter mb-2 truncate">{l.name}</h3>
                                        <div className="flex items-center gap-4">
                                            <div className="flex items-center gap-1.5">
                                                <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                                                <span className="text-[9px] font-black text-neutral-500 uppercase tracking-widest">{l.widgets?.length || 0} Elementos</span>
                                            </div>
                                            <div className="h-3 w-[1px] bg-white/5" />
                                            <span className="text-[9px] font-black text-neutral-600 uppercase tracking-widest">{new Date(l.updatedAt).toLocaleDateString()}</span>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    ) : (
                        <div className="bg-[#111] border border-white/5 rounded-2xl overflow-hidden">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-white/5 bg-white/5 text-[9px] font-black uppercase tracking-[0.2em] text-neutral-400">
                                        <th className="p-4 pl-6">Nombre</th>
                                        <th className="p-4">Orientación</th>
                                        <th className="p-4">Resolución</th>
                                        <th className="p-4">Elementos</th>
                                        <th className="p-4">Creado</th>
                                        <th className="p-4">Modificado</th>
                                        <th className="p-4 pr-6 text-right">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody className="text-xs font-medium text-neutral-300">
                                    {filtered.map((l) => (
                                        <tr key={l._id} className="border-b border-white/5 hover:bg-white/5 transition-colors group">
                                            <td className="p-4 pl-6 font-bold text-white uppercase italic">{l.name}</td>
                                            <td className="p-4">
                                                <div className="flex items-center gap-2">
                                                    {l.orientation === 'portrait' ? <Smartphone className="w-4 h-4 text-blue-400" /> : <Monitor className="w-4 h-4 text-blue-400" />}
                                                    <span className="text-[10px] font-black uppercase text-neutral-500">{l.orientation}</span>
                                                </div>
                                            </td>
                                            <td className="p-4 font-mono text-neutral-500 text-[10px]">
                                                {l.orientation === 'portrait' ? '1080 x 1920' : '1920 x 1080'}
                                            </td>
                                            <td className="p-4">{l.widgets?.length || 0}</td>
                                            <td className="p-4 text-[10px] uppercase text-neutral-500">{new Date(l.createdAt || Date.now()).toLocaleDateString()}</td>
                                            <td className="p-4">
                                                <div className="flex flex-col">
                                                    <span className="text-[10px] text-white">{new Date(l.updatedAt).toLocaleDateString()}</span>
                                                    <span className="text-[9px] text-neutral-600 uppercase tracking-wider">Por: {l.modifiedBy || 'Admin'}</span>
                                                </div>
                                            </td>
                                            <td className="p-4 pr-6 text-right space-x-2 flex justify-end">
                                                <Link href={`/admin?id=${l._id}`}>
                                                    <button className="p-2 hover:bg-blue-600/20 rounded-lg transition-colors text-neutral-400 hover:text-blue-500" title="Editar">
                                                        <Edit2 className="w-4 h-4" />
                                                    </button>
                                                </Link>
                                                <button onClick={() => handleDuplicate(l)} className="p-2 hover:bg-white/10 rounded-lg transition-colors text-neutral-400 hover:text-white" title="Duplicar">
                                                    <Copy className="w-4 h-4" />
                                                </button>
                                                <button onClick={() => handleDelete(l._id)} className="p-2 hover:bg-red-500/20 rounded-lg transition-colors text-neutral-400 hover:text-red-500" title="Eliminar">
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
