'use client';

import React, { useState, useEffect } from 'react';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { RefreshCw, Plus, Search, Trash2, Edit3, Image as ImageIcon, Check, X, Clock, Calendar } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ImageUpload } from '@/components/builder/ImageUpload';
import { ViewToggler } from '@/components/admin/ViewToggler';

export default function ActivitiesPage() {
    const [activities, setActivities] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [editingActivity, setEditingActivity] = useState<any>(null);
    const [isCreating, setIsCreating] = useState(false);
    const [viewMode, setViewMode] = useState<'grid' | 'table'>('table');

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const res = await fetch('/api/activities');
            const data = await res.json();
            setActivities(data);
        } catch (err) {
            console.error('Error fetching data:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (activity: any) => {
        const isNew = !activity._id;
        try {
            const res = await fetch(isNew ? '/api/activities' : `/api/activities/${activity._id}`, {
                method: isNew ? 'POST' : 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(activity)
            });
            if (res.ok) {
                fetchData();
                setEditingActivity(null);
                setIsCreating(false);
            }
        } catch (err) {
            console.error('Error saving:', err);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('¿Eliminar actividad?')) return;
        try {
            const res = await fetch(`/api/activities/${id}`, { method: 'DELETE' });
            if (res.ok) fetchData();
        } catch (err) {
            console.error('Error deleting:', err);
        }
    };

    const filtered = activities.filter(a =>
        a.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.category?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="flex-1 flex flex-col min-h-0 bg-[#050505] font-sans">
            <AdminHeader
                title="Gestión de Actividades"
                subtitle="CRONOGRAMA Y EVENTOS"
                icon={<RefreshCw className="w-5 h-5" />}
                actions={
                    <button
                        onClick={() => setIsCreating(true)}
                        className="bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-black uppercase px-6 py-2.5 rounded-lg flex items-center gap-2 transition-all active:scale-95 shadow-lg shadow-blue-500/20 tracking-wider"
                    >
                        <Plus className="w-4 h-4" /> Nueva Actividad
                    </button>
                }
            />

            <div className="flex-1 overflow-hidden flex flex-col">
                <div className="px-10 py-8 border-b border-white/5 bg-black/20 flex items-center gap-6">
                    <div className="relative group/search max-w-md flex-1">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-600 group-focus-within/search:text-blue-500 transition-colors" />
                        <input
                            type="text"
                            placeholder="BUSCAR ACTIVIDAD..."
                            className="w-full bg-[#0a0a0a] border border-white/10 rounded-lg py-3.5 pl-12 pr-4 text-[10px] font-black uppercase tracking-widest outline-none focus:border-blue-500/50 transition-all text-neutral-300 placeholder:text-neutral-700 focus:bg-blue-500/5"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <ViewToggler viewMode={viewMode} setViewMode={setViewMode} />
                </div>

                <div className="flex-1 overflow-y-auto p-10 custom-scrollbar">
                    {viewMode === 'grid' ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {filtered.map((activity) => (
                                <motion.div
                                    layout
                                    key={activity._id}
                                    className="bg-[#0a0a0a] border border-white/5 rounded-lg overflow-hidden group hover:border-blue-500/30 transition-all shadow-xl flex flex-col"
                                >
                                    <div className="h-48 relative overflow-hidden bg-black">
                                        {activity.photo ? (
                                            <img src={activity.photo} className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-all duration-700 group-hover:scale-105" alt={activity.title} />
                                        ) : (
                                            <div className="w-full h-full flex flex-col items-center justify-center bg-blue-900/5">
                                                <Calendar className="w-10 h-10 text-blue-500/20" />
                                            </div>
                                        )}
                                        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-transparent to-transparent" />

                                        <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity translate-y-2 group-hover:translate-y-0 duration-300">
                                            <button onClick={() => setEditingActivity(activity)} className="p-2 bg-black/80 backdrop-blur-md rounded-md text-white hover:bg-blue-600 border border-white/10 transition-all hover:scale-105">
                                                <Edit3 className="w-3.5 h-3.5" />
                                            </button>
                                            <button onClick={() => handleDelete(activity._id)} className="p-2 bg-black/80 backdrop-blur-md rounded-md text-red-500 hover:bg-red-500 hover:text-white border border-white/10 transition-all hover:scale-105">
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                        </div>

                                        <div className="absolute bottom-4 left-5 right-5">
                                            <span className="px-2.5 py-1 bg-blue-500/20 border border-blue-500/20 rounded text-[8px] font-black uppercase tracking-widest text-blue-400 mb-2 inline-block backdrop-blur-sm">
                                                {activity.category || 'GENERAL'}
                                            </span>
                                            <h3 className="text-lg font-black text-white uppercase italic tracking-tighter leading-none truncate drop-shadow-lg">{activity.title}</h3>
                                        </div>
                                    </div>
                                    <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                                        <div className="flex items-center gap-2.5 text-neutral-400 bg-white/5 p-2 rounded-lg border border-white/5">
                                            <Clock className="w-4 h-4 text-blue-500" />
                                            <span className="text-[10px] font-black uppercase tracking-wider">{activity.time || 'A definir'}</span>
                                        </div>
                                        <p className="text-[10px] text-neutral-500 font-medium uppercase leading-relaxed line-clamp-3">
                                            {activity.desc || 'Sin descripción.'}
                                        </p>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    ) : (
                        <div className="bg-[#0a0a0a] border border-white/5 rounded-lg overflow-hidden shadow-2xl">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-white/5 bg-white/[0.02] text-[9px] font-black uppercase tracking-[0.2em] text-neutral-500">
                                        <th className="p-6 pl-8 w-24">Media</th>
                                        <th className="p-6">Detalle Actividad</th>
                                        <th className="p-6">Horario</th>
                                        <th className="p-6">Categoría</th>
                                        <th className="p-6 pr-8 text-right">Controles</th>
                                    </tr>
                                </thead>
                                <tbody className="text-xs font-medium text-neutral-300">
                                    {filtered.map((activity) => (
                                        <tr key={activity._id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors group">
                                            <td className="p-5 pl-8">
                                                <div className="w-14 h-14 rounded-lg bg-black overflow-hidden border border-white/10 relative group-hover:border-white/20 transition-all shadow-lg">
                                                    {activity.photo ? <img src={activity.photo} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><Calendar className="w-5 h-5 text-neutral-700" /></div>}
                                                </div>
                                            </td>
                                            <td className="p-5">
                                                <div className="flex flex-col gap-1">
                                                    <span className="font-black text-white uppercase italic tracking-tight text-sm">{activity.title}</span>
                                                    <span className="text-[9px] text-neutral-600 uppercase max-w-[250px] truncate font-bold tracking-wide">{activity.desc || 'Sin descripción'}</span>
                                                </div>
                                            </td>
                                            <td className="p-5">
                                                <div className="flex items-center gap-2.5">
                                                    <div className="p-1.5 bg-blue-500/10 rounded text-blue-500">
                                                        <Clock className="w-3.5 h-3.5" />
                                                    </div>
                                                    <span className="text-[10px] font-black text-neutral-400 uppercase tracking-wider">{activity.time || '--:--'}</span>
                                                </div>
                                            </td>
                                            <td className="p-5">
                                                <span className="px-3 py-1 bg-blue-900/10 text-blue-400 border border-blue-500/10 text-[9px] font-black rounded uppercase tracking-wider shadow-sm">
                                                    {activity.category || 'General'}
                                                </span>
                                            </td>
                                            <td className="p-5 pr-8 text-right">
                                                <div className="flex items-center justify-end gap-2 opacity-60 group-hover:opacity-100 transition-opacity">
                                                    <button onClick={() => setEditingActivity(activity)} className="p-2.5 hover:bg-white/10 rounded-lg text-neutral-400 hover:text-white transition-all border border-transparent hover:border-white/10">
                                                        <Edit3 className="w-4 h-4" />
                                                    </button>
                                                    <button onClick={() => handleDelete(activity._id)} className="p-2.5 hover:bg-red-500/10 rounded-lg text-neutral-400 hover:text-red-500 transition-all border border-transparent hover:border-red-500/20">
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

                    {filtered.length === 0 && !loading && (
                        <div className="flex flex-col items-center justify-center py-32 text-neutral-700 border border-white/5 rounded-lg bg-white/[0.01]">
                            <RefreshCw className="w-12 h-12 mb-4 opacity-20" />
                            <p className="text-[10px] font-black uppercase tracking-[0.3em]">No hay actividades registradas</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Premium Modal */}
            <AnimatePresence>
                {(editingActivity || isCreating) && (
                    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/90 backdrop-blur-md p-4">
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.95, opacity: 0, y: 20 }}
                            transition={{ type: "spring", stiffness: 300, damping: 30 }}
                            className="bg-[#0f0f0f] border border-white/10 rounded-xl w-full max-w-2xl shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh]"
                        >
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600" />

                            <div className="p-8 pb-4 flex justify-between items-center bg-[#0a0a0a] border-b border-white/5">
                                <div>
                                    <h2 className="text-xl font-black text-white uppercase italic tracking-tighter">
                                        {isCreating ? 'Nueva Actividad' : 'Editar Actividad'}
                                    </h2>
                                    <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest mt-1">Detalles del evento</p>
                                </div>
                                <button onClick={() => { setEditingActivity(null); setIsCreating(false); }} className="p-2.5 hover:bg-white/5 rounded-lg text-neutral-500 hover:text-white transition-colors">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="p-8 overflow-y-auto custom-scrollbar space-y-8">
                                <div className="grid grid-cols-2 gap-8">
                                    <div className="col-span-2 space-y-3">
                                        <label className="text-[9px] font-black text-neutral-500 uppercase tracking-widest ml-1 flex items-center gap-2">
                                            Título de la actividad <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            id="a-title"
                                            className="w-full bg-[#0a0a0a] border border-white/10 rounded-lg px-5 py-4 text-white font-black text-sm outline-none focus:border-blue-500/50 transition-all uppercase placeholder:text-neutral-800 focus:bg-blue-500/5"
                                            placeholder="EJ: CLASE DE YOGA"
                                            defaultValue={editingActivity?.title || ''}
                                        />
                                    </div>

                                    <div className="space-y-3">
                                        <label className="text-[9px] font-black text-neutral-500 uppercase tracking-widest ml-1">Horario</label>
                                        <div className="relative group">
                                            <input
                                                id="a-time"
                                                className="w-full bg-[#0a0a0a] border border-white/10 rounded-lg px-5 py-4 pl-12 text-white font-bold text-xs outline-none focus:border-blue-500/50 transition-all uppercase placeholder:text-neutral-800 focus:bg-blue-500/5"
                                                placeholder="00:00 - 00:00"
                                                defaultValue={editingActivity?.time || ''}
                                            />
                                            <Clock className="w-4 h-4 text-neutral-600 absolute left-4 top-1/2 -translate-y-1/2 group-focus-within:text-blue-500 transition-colors" />
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <label className="text-[9px] font-black text-neutral-500 uppercase tracking-widest ml-1">Categoría</label>
                                        <input
                                            id="a-cat"
                                            className="w-full bg-[#0a0a0a] border border-white/10 rounded-lg px-5 py-4 text-white font-bold text-xs outline-none focus:border-blue-500/50 transition-all uppercase placeholder:text-neutral-800 focus:bg-blue-500/5"
                                            placeholder="EJ: BIENESTAR"
                                            defaultValue={editingActivity?.category || ''}
                                        />
                                    </div>

                                    <div className="col-span-2 space-y-3">
                                        <label className="text-[9px] font-black text-neutral-500 uppercase tracking-widest ml-1">Descripción</label>
                                        <textarea
                                            id="a-desc"
                                            className="w-full bg-[#0a0a0a] border border-white/10 rounded-lg px-5 py-4 text-white font-medium text-xs outline-none focus:border-blue-500/50 transition-all uppercase placeholder:text-neutral-800 resize-none h-32 custom-scrollbar focus:bg-blue-500/5"
                                            placeholder="DETALLES ADICIONALES DE LA ACTIVIDAD..."
                                            defaultValue={editingActivity?.desc || ''}
                                        />
                                    </div>

                                    <div className="col-span-2 space-y-3">
                                        <label className="text-[9px] font-black text-neutral-500 uppercase tracking-widest ml-1">Imagen Representativa</label>
                                        <div className="p-6 bg-[#0a0a0a] border border-white/10 rounded-lg flex gap-6 items-center">
                                            <div className="w-24 h-24 bg-[#111] border border-white/10 rounded-lg overflow-hidden flex-shrink-0 relative shadow-inner">
                                                <img
                                                    id="a-preview"
                                                    src={editingActivity?.photo || undefined}
                                                    className={`w-full h-full object-cover transition-opacity duration-300 ${editingActivity?.photo ? 'opacity-100' : 'opacity-0'}`}
                                                />
                                                <div className={`absolute inset-0 flex items-center justify-center pointer-events-none transition-opacity duration-300 ${editingActivity?.photo ? 'opacity-0' : 'opacity-100'}`} id="a-placeholder">
                                                    <ImageIcon className="w-8 h-8 text-neutral-700" />
                                                </div>
                                            </div>
                                            <div className="flex-1">
                                                <ImageUpload
                                                    compact
                                                    label="SELECCIONAR IMAGEN"
                                                    onUploadSuccess={(url) => {
                                                        const img = document.getElementById('a-preview') as HTMLImageElement;
                                                        const ph = document.getElementById('a-placeholder') as HTMLDivElement;
                                                        if (img) { img.src = url; img.classList.remove('opacity-0'); }
                                                        if (ph) ph.classList.add('opacity-0');
                                                        (document.getElementById('a-photo') as HTMLInputElement).value = url;
                                                    }}
                                                />
                                                <input type="hidden" id="a-photo" defaultValue={editingActivity?.photo || ''} />
                                                <p className="text-[8px] text-neutral-600 mt-3 font-medium uppercase tracking-wide leading-relaxed">Formatos: JPG, PNG, WEBP. Max 2MB.</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="p-6 border-t border-white/5 bg-[#0a0a0a] flex justify-end gap-3">
                                <button onClick={() => { setEditingActivity(null); setIsCreating(false); }} className="px-6 py-3 rounded-lg text-neutral-500 font-bold uppercase tracking-widest text-[10px] hover:bg-white/5 hover:text-white transition-all">Cancelar</button>
                                <button
                                    onClick={() => {
                                        const title = (document.getElementById('a-title') as HTMLInputElement).value;
                                        if (!title) { alert('El título es requerido'); return; }

                                        const a = {
                                            _id: editingActivity?._id,
                                            title,
                                            time: (document.getElementById('a-time') as HTMLInputElement).value,
                                            category: (document.getElementById('a-cat') as HTMLInputElement).value,
                                            desc: (document.getElementById('a-desc') as HTMLTextAreaElement).value,
                                            photo: (document.getElementById('a-photo') as HTMLInputElement).value,
                                        };
                                        handleSave(a);
                                    }}
                                    className="px-8 py-3 rounded-lg bg-blue-600 text-white font-black uppercase tracking-widest text-[10px] shadow-lg shadow-blue-600/20 hover:bg-blue-500 active:scale-95 transition-all flex items-center gap-2"
                                >
                                    <Check className="w-4 h-4" /> Guardar Cambios
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
