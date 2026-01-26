'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, Plus, Trash2, Calendar as CalendarIcon, Check, ChevronRight, Layout as LayoutIcon } from 'lucide-react';

interface ScheduleEvent {
    dayOfWeek: number;
    startTime: string;
    endTime: string;
    layoutId: string;
}

interface Schedule {
    _id?: string;
    name: string;
    events: ScheduleEvent[];
}

interface ScheduleCanvasProps {
    schedule: Schedule | null;
    layouts: any[];
    onSave: (schedule: Schedule) => void;
}

const DAYS = ['DOMINGO', 'LUNES', 'MARTES', 'MIÉRCOLES', 'JUEVES', 'VIERNES', 'SÁBADO'];
const HOURS = Array.from({ length: 24 }, (_, i) => `${i.toString().padStart(2, '0')}:00`);

export const ScheduleCanvas: React.FC<ScheduleCanvasProps> = ({ schedule, layouts, onSave }) => {
    const [editingEvent, setEditingEvent] = useState<{ idx: number; event: ScheduleEvent } | null>(null);

    if (!schedule) {
        return (
            <div className="w-full h-full flex flex-col items-center justify-center text-neutral-600 gap-4">
                <CalendarIcon className="w-20 h-20 opacity-10" />
                <p className="text-[12px] font-black uppercase tracking-[0.4em] italic opacity-40">Selecciona o crea un calendario para comenzar</p>
            </div>
        );
    }

    const addEvent = (day: number) => {
        const newEvent: ScheduleEvent = {
            dayOfWeek: day,
            startTime: '09:00',
            endTime: '12:00',
            layoutId: layouts[0]?._id || ''
        };
        const updated = { ...schedule, events: [...(schedule.events || []), newEvent] };
        onSave(updated);
    };

    const removeEvent = (idx: number) => {
        const updated = { ...schedule, events: schedule.events.filter((_, i) => i !== idx) };
        onSave(updated);
    };

    const updateEvent = (idx: number, data: Partial<ScheduleEvent>) => {
        const newEvents = [...schedule.events];
        newEvents[idx] = { ...newEvents[idx], ...data };
        onSave({ ...schedule, events: newEvents });
    };

    return (
        <div className="w-full h-full flex flex-col gap-8 p-10 animate-in fade-in zoom-in-95 duration-500">
            <header className="flex justify-between items-end border-b border-white/5 pb-8">
                <div>
                    <span className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.4em] mb-2 block italic">Dashboard de Programación</span>
                    <h2 className="text-4xl font-black text-white italic uppercase tracking-tighter">{schedule.name}</h2>
                </div>
                <div className="flex gap-4">
                    <div className="bg-emerald-500/10 border border-emerald-500/20 px-6 py-3 rounded-xl flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Sincronización Activa</span>
                    </div>
                </div>
            </header>

            <div className="flex-1 grid grid-cols-7 gap-4 min-h-0 overflow-hidden">
                {DAYS.map((dayName, dayIdx) => (
                    <div key={dayIdx} className="flex flex-col gap-4 min-w-0">
                        <div className="flex items-center justify-between px-2">
                            <span className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">{dayName}</span>
                            <button
                                onClick={() => addEvent(dayIdx)}
                                className="w-6 h-6 rounded-md bg-white/5 hover:bg-emerald-500 hover:text-white flex items-center justify-center transition-all text-neutral-600"
                            >
                                <Plus className="w-3.5 h-3.5" />
                            </button>
                        </div>

                        <div className="flex-1 bg-black/40 rounded-2xl border border-white/5 p-3 space-y-3 overflow-y-auto custom-scrollbar relative">
                            {schedule.events?.filter(e => e.dayOfWeek === dayIdx).map((event, eIdx) => {
                                const originalIdx = schedule.events.indexOf(event);
                                const layout = layouts.find(l => l._id === event.layoutId);

                                return (
                                    <motion.div
                                        key={originalIdx}
                                        layoutId={`event-${originalIdx}`}
                                        className="bg-[#111] border border-white/10 p-4 rounded-xl shadow-2xl relative group/event hover:border-emerald-500/30 transition-all"
                                    >
                                        <div className="space-y-3">
                                            <div className="flex justify-between items-start">
                                                <div className="flex items-center gap-2 text-emerald-500">
                                                    <Clock className="w-3 h-3" />
                                                    <span className="text-[10px] font-black font-mono tracking-tighter">{event.startTime} - {event.endTime}</span>
                                                </div>
                                                <button
                                                    onClick={() => removeEvent(originalIdx)}
                                                    className="opacity-0 group-hover/event:opacity-100 p-1 text-red-500/40 hover:text-red-500 transition-all"
                                                >
                                                    <Trash2 className="w-3 h-3" />
                                                </button>
                                            </div>

                                            <div className="space-y-1">
                                                <label className="text-[7px] font-black text-neutral-600 uppercase tracking-widest block">Diseño Activo</label>
                                                <select
                                                    value={event.layoutId}
                                                    onChange={(e) => updateEvent(originalIdx, { layoutId: e.target.value })}
                                                    className="w-full bg-black/50 border border-white/5 rounded-md px-2 py-1.5 text-[10px] font-black text-white/80 outline-none focus:border-emerald-500/50 appearance-none italic uppercase"
                                                >
                                                    {layouts.map(l => (
                                                        <option key={l._id} value={l._id}>{l.name}</option>
                                                    ))}
                                                </select>
                                            </div>

                                            <div className="grid grid-cols-2 gap-2">
                                                <input
                                                    type="time"
                                                    value={event.startTime}
                                                    onChange={(e) => updateEvent(originalIdx, { startTime: e.target.value })}
                                                    className="bg-black/50 border border-white/5 rounded-md px-2 py-1 text-[9px] font-black text-neutral-400 outline-none"
                                                />
                                                <input
                                                    type="time"
                                                    value={event.endTime}
                                                    onChange={(e) => updateEvent(originalIdx, { endTime: e.target.value })}
                                                    className="bg-black/50 border border-white/5 rounded-md px-2 py-1 text-[9px] font-black text-neutral-400 outline-none"
                                                />
                                            </div>
                                        </div>

                                        {/* Activity Indicator */}
                                        <div className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-emerald-500/20 group-hover:bg-emerald-500 transition-colors" />
                                    </motion.div>
                                );
                            })}

                            {schedule.events?.filter(e => e.dayOfWeek === dayIdx).length === 0 && (
                                <div className="absolute inset-0 flex items-center justify-center opacity-10 pointer-events-none">
                                    <span className="text-[8px] font-black uppercase tracking-[0.2em] rotate-90">Disponible</span>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            <footer className="bg-black/60 backdrop-blur-xl border border-white/5 p-8 rounded-3xl flex items-center justify-between">
                <div className="flex items-center gap-6">
                    <div className="flex flex-col">
                        <span className="text-[8px] font-black text-neutral-500 uppercase tracking-[0.2em] mb-1">Resumen del Calendario</span>
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                                <span className="text-2xl font-black text-white italic">{schedule.events?.length || 0}</span>
                                <span className="text-[10px] font-black text-neutral-600 uppercase">Eventos</span>
                            </div>
                            <div className="w-[1px] h-8 bg-white/5" />
                            <div className="flex items-center gap-2 text-emerald-500">
                                <Check className="w-5 h-5" />
                                <span className="text-[10px] font-black uppercase tracking-widest">Listo para publicar</span>
                            </div>
                        </div>
                    </div>
                </div>

                <button
                    onClick={() => onSave(schedule)}
                    className="bg-emerald-500 border border-emerald-400 text-white px-10 py-4 rounded-xl font-black uppercase tracking-widest text-xs italic shadow-2xl shadow-emerald-500/20 hover:scale-105 active:scale-95 transition-all"
                >
                    Publicar Programación
                </button>
            </footer>
        </div>
    );
};
