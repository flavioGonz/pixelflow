'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import {
    Calendar, ArrowLeft, Plus, RefreshCw, Zap, Clock, Database,
    Smartphone, Search, Trash2, Layout as LayoutIcon, ChevronRight
} from 'lucide-react';
import { ScheduleCanvas } from '@/components/admin/ScheduleCanvas';

let socket: Socket;

export default function SchedulesAdminPage() {
    const [isConnected, setIsConnected] = useState(false);
    const [allSchedules, setAllSchedules] = useState<any[]>([]);
    const [savedLayouts, setSavedLayouts] = useState<any[]>([]);
    const [selectedScheduleId, setSelectedScheduleId] = useState<string | null>(null);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newScheduleName, setNewScheduleName] = useState('');
    const [newScheduleType, setNewScheduleType] = useState<'day' | 'week' | 'month'>('week');

    const fetchData = useCallback(() => {
        if (socket) {
            socket.emit('get_schedules');
            socket.emit('get_layouts');
        }
    }, []);

    useEffect(() => {
        socket = io();
        socket.on('connect', () => {
            setIsConnected(true);
            fetchData();
        });
        socket.on('disconnect', () => setIsConnected(false));
        socket.on('schedules_list', (schedules) => setAllSchedules(schedules));
        socket.on('layouts_list', (layouts) => setSavedLayouts(layouts));

        return () => { socket.disconnect(); };
    }, [fetchData]);

    const activeSchedule = allSchedules.find(s => s._id === selectedScheduleId);

    return (
        <div className="h-screen bg-[#050505] text-neutral-100 flex flex-col font-sans selection:bg-emerald-500/30">
            {/* Professional Header */}
            <header className="h-20 border-b border-white/5 px-10 flex items-center justify-between bg-black/40 backdrop-blur-2xl sticky top-0 z-[100]">
                <div className="flex items-center gap-6">
                    <Link href="/admin">
                        <button className="flex items-center gap-2 px-4 py-2 rounded-md bg-white/10 text-white font-bold uppercase border border-white/5 shadow-lg active:scale-95 transition-transform text-xs">
                            <ArrowLeft className="w-4 h-4" /> Admin Panel
                        </button>
                    </Link>
                    <div className="h-8 w-[1px] bg-white/10" />
                    <div className="w-12 h-12 bg-gradient-to-br from-emerald-600 to-teal-700 rounded-md flex items-center justify-center shadow-2xl shadow-emerald-600/40 relative group">
                        <Calendar className="w-7 h-7 text-white group-hover:scale-110 transition-transform" />
                        <div className="absolute inset-0 bg-white/20 rounded-md opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <div>
                        <h1 className="text-xl font-black tracking-tighter uppercase flex items-center gap-2">
                            PixelFlow <span className="text-emerald-500">Scheduler</span>
                        </h1>
                        <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-[0.2em] mt-0.5">Automatización de Canales</p>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                </div>
            </header>

            <div className="flex flex-1 overflow-hidden">
                {/* Left Sidebar: List of Schedules */}
                <aside className="w-80 bg-[#080808] border-r border-white/5 flex flex-col overflow-hidden">
                    <div className="p-8 space-y-8 overflow-y-auto flex-1 custom-scrollbar">
                        <div className="flex justify-between items-center">
                            <h2 className="text-[10px] font-black text-neutral-500 uppercase tracking-widest flex items-center gap-2 leading-none">
                                <Calendar className="w-3 h-3 text-emerald-500" /> Listado de Rutinas
                            </h2>
                            <button
                                onClick={() => setShowCreateModal(true)}
                                className="w-10 h-10 bg-emerald-500 text-white rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20 hover:scale-110 active:scale-95 transition-all group/btn relative overflow-hidden"
                            >
                                <Plus className="w-5 h-5 relative z-10" />
                                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover/btn:translate-y-0 transition-transform" />
                            </button>
                        </div>

                        <div className="space-y-4">
                            {allSchedules.map(s => (
                                <motion.div
                                    key={s._id}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    onClick={() => setSelectedScheduleId(s._id)}
                                    className={`relative p-5 rounded-xl border cursor-pointer transition-all group ${selectedScheduleId === s._id ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-[#111] border-white/5 hover:border-white/10'}`}
                                >
                                    <div className="flex justify-between items-center mb-3">
                                        <span className={`text-[11px] font-black uppercase italic tracking-widest ${selectedScheduleId === s._id ? 'text-emerald-500' : 'text-white'}`}>{s.name}</span>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); if (confirm('¿Eliminar rutina?')) socket.emit('delete_schedule', s._id); }}
                                            className="opacity-0 group-hover:opacity-100 p-1.5 text-red-500/40 hover:text-red-500 transition-all"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="flex items-center gap-1.5">
                                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500/40" />
                                            <span className="text-[8px] font-black text-neutral-600 uppercase">{s.events?.length || 0} Eventos</span>
                                        </div>
                                    </div>
                                    {selectedScheduleId === s._id && (
                                        <motion.div layoutId="active-indicator" className="absolute -left-[1px] top-4 bottom-4 w-[3px] bg-emerald-500 rounded-r-full" />
                                    )}
                                </motion.div>
                            ))}

                            {allSchedules.length === 0 && (
                                <div className="text-center py-20 bg-white/[0.02] border border-dashed border-white/5 rounded-2xl opacity-40">
                                    <Zap className="w-8 h-8 text-neutral-500 mx-auto mb-4" />
                                    <p className="text-[8px] font-black text-neutral-500 uppercase tracking-widest leading-relaxed">No hay rutinas creadas<br />Crea una para automatizar tus pantallas</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Quick Tips */}
                    <div className="p-8 border-t border-white/5 bg-emerald-500/5">
                        <div className="flex items-center gap-3 mb-3">
                            <LayoutIcon className="w-4 h-4 text-emerald-500" />
                            <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Tip Pro</span>
                        </div>
                        <p className="text-[9px] text-neutral-500 leading-relaxed font-medium uppercase italic">
                            Asigna un calendario a cada pantalla en el panel de pantallas para que los cambios se apliquen solos.
                        </p>
                    </div>
                </aside>

                {/* Main Content Area */}
                <main className="flex-1 overflow-hidden bg-[#050505]">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={selectedScheduleId || 'none'}
                            initial={{ opacity: 0, scale: 0.98 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 1.02 }}
                            transition={{ duration: 0.4 }}
                            className="h-full"
                        >
                            <ScheduleCanvas
                                schedule={activeSchedule || null}
                                layouts={savedLayouts}
                                onSave={(s) => socket.emit('save_schedule', s)}
                            />
                        </motion.div>
                    </AnimatePresence>
                </main>
            </div>
            {/* Create New Schedule Modal */}
            <AnimatePresence>
                {showCreateModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-md p-4"
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 20 }}
                            className="bg-[#111] border border-white/10 p-8 rounded-[2rem] max-w-md w-full shadow-2xl relative overflow-hidden"
                        >
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 to-teal-600" />

                            <div className="flex flex-col items-center text-center gap-6 relative z-10">
                                <div className="w-20 h-20 bg-emerald-500/10 rounded-2xl flex items-center justify-center mb-2 border border-emerald-500/20">
                                    <Calendar className="w-10 h-10 text-emerald-500" />
                                </div>

                                <div>
                                    <h3 className="text-2xl font-black text-white uppercase italic tracking-tighter">Nueva Rutina</h3>
                                    <p className="text-sm text-neutral-500 leading-relaxed font-medium mt-1">
                                        Asigna un nombre descriptivo para organizar tus automatizaciones.
                                    </p>
                                </div>

                                <div className="w-full space-y-2">
                                    <label className="text-[10px] font-black text-neutral-600 uppercase tracking-widest block text-left ml-2">Nombre del Calendario</label>
                                    <input
                                        autoFocus
                                        type="text"
                                        value={newScheduleName}
                                        onChange={(e) => setNewScheduleName(e.target.value)}
                                        placeholder="Ej: Mañanas de Spa, Menú de Noche..."
                                        className="w-full bg-black/50 border border-white/5 rounded-2xl px-6 py-4 text-white font-bold italic outline-none focus:border-emerald-500/50 transition-all shadow-inner"
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' && newScheduleName.trim()) {
                                                socket.emit('save_schedule', { name: newScheduleName, type: newScheduleType, events: [] });
                                                setNewScheduleName('');
                                                setShowCreateModal(false);
                                            }
                                        }}
                                    />
                                </div>

                                <div className="w-full space-y-2">
                                    <label className="text-[10px] font-black text-neutral-600 uppercase tracking-widest block text-left ml-2">Tipo de Repetición</label>
                                    <div className="grid grid-cols-3 gap-3">
                                        <button onClick={() => setNewScheduleType('day')} className={`p-4 rounded-xl border flex flex-col items-center gap-2 transition-all ${newScheduleType === 'day' ? 'bg-emerald-500/10 border-emerald-500 text-emerald-500' : 'bg-black/50 border-white/5 text-neutral-500 hover:border-white/10'}`}>
                                            <Clock className="w-5 h-5" />
                                            <span className="text-[9px] font-black uppercase tracking-widest">Diario</span>
                                        </button>
                                        <button onClick={() => setNewScheduleType('week')} className={`p-4 rounded-xl border flex flex-col items-center gap-2 transition-all ${newScheduleType === 'week' ? 'bg-emerald-500/10 border-emerald-500 text-emerald-500' : 'bg-black/50 border-white/5 text-neutral-500 hover:border-white/10'}`}>
                                            <Calendar className="w-5 h-5" />
                                            <span className="text-[9px] font-black uppercase tracking-widest">Semanal</span>
                                        </button>
                                        <button onClick={() => setNewScheduleType('month')} className={`p-4 rounded-xl border flex flex-col items-center gap-2 transition-all ${newScheduleType === 'month' ? 'bg-emerald-500/10 border-emerald-500 text-emerald-500' : 'bg-black/50 border-white/5 text-neutral-500 hover:border-white/10'}`}>
                                            <Database className="w-5 h-5" />
                                            <span className="text-[9px] font-black uppercase tracking-widest">Mensual</span>
                                        </button>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4 w-full mt-4">
                                    <button
                                        onClick={() => {
                                            setShowCreateModal(false);
                                            setNewScheduleName('');
                                        }}
                                        className="py-4 rounded-xl bg-white/5 hover:bg-white/10 text-neutral-400 hover:text-white font-black uppercase tracking-widest text-[10px] transition-all"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        disabled={!newScheduleName.trim()}
                                        onClick={() => {
                                            socket.emit('save_schedule', { name: newScheduleName, type: newScheduleType, events: [] });
                                            setNewScheduleName('');
                                            setShowCreateModal(false);
                                        }}
                                        className="py-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black uppercase tracking-widest text-[10px] shadow-lg shadow-emerald-600/20 transition-all active:scale-95 disabled:opacity-30 disabled:pointer-events-none"
                                    >
                                        Crear Rutina
                                    </button>
                                </div>
                            </div>

                            {/* Decorative Background Glows */}
                            <div className="absolute -bottom-20 -right-20 w-40 h-40 bg-emerald-500/10 blur-[60px] rounded-full pointer-events-none" />
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
