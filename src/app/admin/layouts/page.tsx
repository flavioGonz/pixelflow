'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { Database, Plus, RefreshCw, Trash2, Copy, Eye, Layout as LayoutIcon, Search, Monitor, Smartphone, Edit2, X, Check, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { ViewToggler } from '@/components/admin/ViewToggler';
import { useRouter } from 'next/navigation';

let socket: Socket;

export default function LayoutsPage() {
    const router = useRouter();
    const [layouts, setLayouts] = useState<any[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
    const [isCreating, setIsCreating] = useState(false);
    const [newName, setNewName] = useState('');
    const [newOrientation, setNewOrientation] = useState<'landscape' | 'portrait'>('landscape');

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

    const handleCreateLayout = () => {
        if (!newName) return alert('El nombre es requerido');

        const newLayout = {
            name: newName,
            orientation: newOrientation,
            widgets: [],
            backgroundColor: '#000000'
        };

        socket.emit('save_layout', { screenId: null, layout: newLayout });
        setIsCreating(false);
        setNewName('');

        // Wait for creation and refetch
        setTimeout(() => {
            fetchLayouts();
        }, 1000);
    };

    const filtered = layouts.filter(l => l.name.toLowerCase().includes(searchTerm.toLowerCase()));

    return (
        <div className="flex-1 flex flex-col min-h-0 bg-[#050505] font-sans">
            <AdminHeader
                title="Galería de Diseños"
                subtitle="Lienzos digitales y composiciones"
                icon={<Database className="w-5 h-5 text-blue-500" />}
                actions={
                    <button
                        onClick={() => setIsCreating(true)}
                        className="bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-black uppercase px-6 py-2.5 rounded flex items-center gap-2 transition-all active:scale-95 shadow-lg shadow-blue-500/20 tracking-wider"
                    >
                        <Plus className="w-4 h-4" /> Nuevo Diseño
                    </button>
                }
            />

            <div className="flex-1 overflow-hidden flex flex-col">
                <div className="px-10 py-6 border-b border-white/5 bg-black/20 flex items-center justify-between gap-6">
                    <div className="relative group/search flex-1 max-w-xl">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-600 group-focus-within/search:text-blue-500 transition-colors" />
                        <input
                            type="text"
                            placeholder="BUSCAR EN LA BIBLIOTECA..."
                            className="w-full bg-[#0a0a0a] border border-white/10 rounded py-3 pl-12 pr-6 text-[10px] font-black uppercase tracking-widest outline-none focus:border-blue-500/50 transition-all text-neutral-300"
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
                                    className="bg-[#0a0a0a] border border-white/5 rounded overflow-hidden group hover:border-blue-500/30 transition-all shadow-2xl relative flex flex-col"
                                >
                                    <div className="aspect-[16/9] bg-black relative group/preview overflow-hidden">
                                        {/* Thumbnail Placeholder with Orientation */}
                                        <div className="absolute inset-0 flex flex-col items-center justify-center opacity-10 transition-all group-hover/preview:opacity-30 group-hover/preview:scale-110 duration-700">
                                            {l.orientation === 'portrait' ? <Smartphone className="w-16 h-16" /> : <Monitor className="w-20 h-20" />}
                                            <span className="text-[8px] font-black uppercase tracking-[0.4em] mt-4 italic">{l.orientation}</span>
                                        </div>

                                        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-60" />

                                        <div className="absolute top-3 right-3 flex gap-1.5 translate-y-2 opacity-0 group-hover/preview:translate-y-0 group-hover/preview:opacity-100 transition-all duration-300">
                                            <button
                                                onClick={() => handleDuplicate(l)}
                                                className="w-8 h-8 rounded bg-black/80 backdrop-blur-md border border-white/10 flex items-center justify-center text-blue-400 hover:bg-blue-600 hover:text-white transition-all shadow-xl"
                                                title="Duplicar"
                                            >
                                                <Copy className="w-3.5 h-3.5" />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(l._id)}
                                                className="w-8 h-8 rounded bg-black/80 backdrop-blur-md border border-white/10 flex items-center justify-center text-red-500 hover:bg-red-500 hover:text-white transition-all shadow-xl"
                                                title="Eliminar"
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                        </div>

                                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/preview:opacity-100 transition-opacity backdrop-blur-[2px] bg-blue-600/5">
                                            <Link href={`/admin?id=${l._id}`}>
                                                <button className="bg-blue-600 text-white font-black uppercase text-[10px] tracking-widest px-8 py-3 rounded shadow-2xl transform translate-y-4 group-hover/preview:translate-y-0 transition-all hover:bg-blue-500">
                                                    Abrir Editor
                                                </button>
                                            </Link>
                                        </div>
                                    </div>

                                    <div className="p-6 border-t border-white/5">
                                        <h3 className="text-sm font-black text-white uppercase italic tracking-tighter mb-2.5 truncate">{l.name}</h3>
                                        <div className="flex items-center gap-4">
                                            <div className="flex items-center gap-2">
                                                <div className="w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
                                                <span className="text-[9px] font-black text-neutral-600 uppercase tracking-widest">{l.widgets?.length || 0} Objetos</span>
                                            </div>
                                            <div className="h-3 w-[1px] bg-white/10" />
                                            <span className="text-[9px] font-black text-neutral-700 uppercase tracking-widest">{new Date(l.updatedAt).toLocaleDateString()}</span>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    ) : (
                        <div className="bg-[#0a0a0a] border border-white/5 rounded overflow-hidden shadow-2xl">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-white/5 bg-white/[0.02] text-[9px] font-black uppercase tracking-[0.2em] text-neutral-500">
                                        <th className="p-5 pl-8">Composición</th>
                                        <th className="p-5">Formato</th>
                                        <th className="p-5 text-center">Elementos</th>
                                        <th className="p-5">Modificado</th>
                                        <th className="p-5 pr-8 text-right">Controles</th>
                                    </tr>
                                </thead>
                                <tbody className="text-xs font-medium text-neutral-300">
                                    {filtered.map((l) => (
                                        <tr key={l._id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors group">
                                            <td className="p-5 pl-8">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-7 bg-black rounded border border-white/10 flex items-center justify-center group-hover:border-blue-500/40 transition-colors">
                                                        {l.orientation === 'portrait' ? <Smartphone className="w-3 h-3 text-neutral-700" /> : <Monitor className="w-3.5 h-3.5 text-neutral-700" />}
                                                    </div>
                                                    <span className="font-black text-white uppercase italic tracking-tight text-sm">{l.name}</span>
                                                </div>
                                            </td>
                                            <td className="p-5">
                                                <span className={`px-2 py-0.5 rounded-sm text-[8px] font-black uppercase tracking-widest border ${l.orientation === 'landscape' ? 'bg-indigo-500/5 text-indigo-400 border-indigo-500/20' : 'bg-purple-500/5 text-purple-400 border-purple-500/20'}`}>
                                                    {l.orientation === 'landscape' ? 'Horizontal (16:9)' : 'Vertical (9:16)'}
                                                </span>
                                            </td>
                                            <td className="p-5 text-center font-black text-[10px] text-neutral-500">
                                                {l.widgets?.length || 0}
                                            </td>
                                            <td className="p-5">
                                                <div className="flex flex-col">
                                                    <span className="text-[10px] text-white font-bold">{new Date(l.updatedAt).toLocaleDateString()}</span>
                                                    <span className="text-[8px] text-neutral-600 uppercase tracking-widest">Hace {Math.floor((Date.now() - new Date(l.updatedAt).getTime()) / (1000 * 60 * 60 * 24))} días</span>
                                                </div>
                                            </td>
                                            <td className="p-5 pr-8 text-right">
                                                <div className="flex items-center justify-end gap-2 opacity-60 group-hover:opacity-100 transition-opacity">
                                                    <Link href={`/admin?id=${l._id}`}>
                                                        <button className="p-2.5 hover:bg-blue-600/10 rounded text-neutral-400 hover:text-blue-500 transition-all border border-transparent hover:border-blue-500/20">
                                                            <Edit2 className="w-4 h-4" />
                                                        </button>
                                                    </Link>
                                                    <button onClick={() => handleDuplicate(l)} className="p-2.5 hover:bg-white/10 rounded text-neutral-400 hover:text-white transition-all border border-transparent hover:border-white/10">
                                                        <Copy className="w-4 h-4" />
                                                    </button>
                                                    <button onClick={() => handleDelete(l._id)} className="p-2.5 hover:bg-red-500/10 rounded text-neutral-400 hover:text-red-500 transition-all border border-transparent hover:border-red-500/20">
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {/* Create Design Modal */}
            <AnimatePresence>
                {isCreating && (
                    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/95 backdrop-blur-xl p-4">
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0, y: 30 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.95, opacity: 0, y: 30 }}
                            className="bg-[#0f0f0f] border border-white/10 rounded-md w-full max-w-lg shadow-2xl relative overflow-hidden"
                        >
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-600 to-indigo-600" />

                            <div className="p-8 pb-4 flex justify-between items-center border-b border-white/5 bg-[#0a0a0a]">
                                <div>
                                    <h2 className="text-xl font-black text-white uppercase italic tracking-tighter">Nuevo Lienzo</h2>
                                    <p className="text-[9px] text-neutral-500 font-bold uppercase tracking-widest mt-1">Configuración del proyecto</p>
                                </div>
                                <button onClick={() => setIsCreating(false)} className="p-2 hover:bg-white/5 rounded text-neutral-500 hover:text-white transition-colors">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="p-8 space-y-8">
                                <div className="space-y-3">
                                    <label className="text-[9px] font-black text-neutral-500 uppercase tracking-widest ml-1">Nombre del Diseño</label>
                                    <input
                                        autoFocus
                                        value={newName}
                                        onChange={(e) => setNewName(e.target.value)}
                                        className="w-full bg-[#0a0a0a] border border-white/10 rounded px-5 py-4 text-white font-black text-sm outline-none focus:border-blue-500/50 transition-all uppercase placeholder:text-neutral-800 focus:bg-blue-500/5 italic"
                                        placeholder="EJ: MENU PRINCIPAL RESTAURANTE"
                                    />
                                </div>

                                <div className="space-y-3">
                                    <label className="text-[9px] font-black text-neutral-500 uppercase tracking-widest ml-1">Orientación de Pantalla</label>
                                    <div className="grid grid-cols-2 gap-4">
                                        <button
                                            onClick={() => setNewOrientation('landscape')}
                                            className={`p-6 rounded border flex flex-col items-center gap-4 transition-all ${newOrientation === 'landscape' ? 'bg-blue-600/10 border-blue-600 text-blue-500' : 'bg-[#0a0a0a] border-white/5 text-neutral-600 hover:border-white/10'}`}
                                        >
                                            <Monitor className="w-10 h-10" />
                                            <span className="text-[10px] font-black uppercase tracking-widest italic">Horizontal</span>
                                        </button>
                                        <button
                                            onClick={() => setNewOrientation('portrait')}
                                            className={`p-6 rounded border flex flex-col items-center gap-4 transition-all ${newOrientation === 'portrait' ? 'bg-blue-600/10 border-blue-600 text-blue-500' : 'bg-[#0a0a0a] border-white/5 text-neutral-600 hover:border-white/10'}`}
                                        >
                                            <Smartphone className="w-10 h-10" />
                                            <span className="text-[10px] font-black uppercase tracking-widest italic">Vertical</span>
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div className="p-8 bg-[#0a0a0a] border-t border-white/5 flex gap-3">
                                <button onClick={() => setIsCreating(false)} className="flex-1 py-4 rounded text-neutral-600 font-bold uppercase tracking-widest text-[10px] hover:bg-white/5 hover:text-white transition-all">Cancelar</button>
                                <button
                                    onClick={handleCreateLayout}
                                    className="flex-[2] py-4 rounded bg-blue-600 text-white font-black uppercase tracking-widest text-[10px] shadow-lg shadow-blue-600/20 hover:bg-blue-500 active:scale-95 transition-all flex items-center justify-center gap-2"
                                >
                                    <Check className="w-4 h-4" /> Crear Composición
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
