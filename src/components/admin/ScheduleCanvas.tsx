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
    type?: 'day' | 'week' | 'month';
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

    const getColumns = () => {
        if (schedule.type === 'day') return ['DIARIO'];
        if (schedule.type === 'month') return Array.from({ length: 31 }, (_, i) => `DÍA ${i + 1}`);
        return DAYS; // Default to week
    };

    const columns = getColumns();

    return (
        <div className="w-full h-full flex flex-col gap-8 p-10 animate-in fade-in zoom-in-95 duration-500">
            <header className="flex justify-between items-end border-b border-white/5 pb-8">
                <div>
                    <span className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.4em] mb-2 block italic">Dashboard de Programación</span>
                    <h2 className="text-4xl font-black text-white italic uppercase tracking-tighter">{schedule.name}</h2>
                </div>
                <div className="flex gap-4">
                </div>
            </header>

            {/* VIEW RENDERER */}
            <div className="flex-1 min-h-0 overflow-hidden bg-black/40 rounded-3xl border border-white/5 relative">
                {schedule.type === 'day' ? (
                    // --- DAY VIEW: Vertical Timeline ---
                    <div className="h-full overflow-y-auto custom-scrollbar p-8">
                        <div className="max-w-3xl mx-auto space-y-6">
                            {HOURS.map((hour, hIdx) => {
                                const activeEvent = schedule.events.find(e =>
                                    hour >= e.startTime && hour < e.endTime
                                );
                                const isStart = activeEvent && activeEvent.startTime.startsWith(hour.split(':')[0]);

                                return (
                                    <div key={hIdx} className="flex gap-6 group">
                                        <div className="w-20 text-right text-[10px] font-mono text-neutral-600 pt-2 group-hover:text-emerald-500 transition-colors">
                                            {hour}
                                        </div>
                                        <div className="flex-1 relative pb-6 border-l border-white/5 pl-6">
                                            <div className="absolute -left-[5px] top-3 w-2.5 h-2.5 rounded-full bg-[#111] border border-white/10 group-hover:border-emerald-500 group-hover:bg-emerald-500 transition-all" />

                                            {isStart && (
                                                <div className="bg-[#111] border border-emerald-500/30 rounded-xl p-4 shadow-2xl relative overflow-hidden group/card">
                                                    <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500" />
                                                    <div className="flex justify-between items-start mb-2">
                                                        <h4 className="text-lg font-black text-white italic uppercase tracking-tighter">
                                                            {layouts.find(l => l._id === activeEvent.layoutId)?.name || 'Layout Desconocido'}
                                                        </h4>
                                                        <div className="flex gap-2">
                                                            <button onClick={() => removeEvent(schedule.events.indexOf(activeEvent))} className="text-red-500/50 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                                                        </div>
                                                    </div>
                                                    <div className="flex gap-4 text-[10px] font-black uppercase text-neutral-500 tracking-widest">
                                                        <span><Clock className="w-3 h-3 inline mr-1" /> {activeEvent.startTime} - {activeEvent.endTime}</span>
                                                    </div>
                                                </div>
                                            )}

                                            {!activeEvent && (
                                                <button
                                                    onClick={() => {
                                                        const newEv = {
                                                            dayOfWeek: 0, // Not used for 'day' type effectively
                                                            startTime: hour,
                                                            endTime: `${(parseInt(hour) + 1).toString().padStart(2, '0')}:00`,
                                                            layoutId: layouts[0]?._id || ''
                                                        };
                                                        onSave({ ...schedule, events: [...schedule.events, newEv] });
                                                    }}
                                                    className="w-full h-12 border border-dashed border-white/5 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-emerald-500/10 hover:border-emerald-500/30"
                                                >
                                                    <Plus className="w-4 h-4 text-emerald-500" />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>

                ) : schedule.type === 'month' ? (
                    // --- MONTH VIEW: Calendar Grid ---
                    <div className="h-full overflow-y-auto custom-scrollbar p-6">
                        <div className="grid grid-cols-7 gap-px bg-white/5 border border-white/5 rounded-2xl overflow-hidden">
                            {['DOM', 'LUN', 'MAR', 'MIE', 'JUE', 'VIE', 'SAB'].map(d => (
                                <div key={d} className="bg-[#0a0a0a] p-4 text-center text-[10px] font-black text-neutral-500 uppercase tracking-widest">
                                    {d}
                                </div>
                            ))}

                            {Array.from({ length: 31 }, (_, i) => i + 1).map(day => {
                                const eventsForDay = schedule.events.filter(e => e.dayOfWeek === (day - 1));
                                return (
                                    <div key={day} className="bg-[#111] min-h-[120px] p-3 hover:bg-[#161616] transition-colors group relative flex flex-col gap-2">
                                        <div className="flex justify-between items-start">
                                            <span className="text-xl font-black text-white/20 italic group-hover:text-emerald-500/50 transition-colors">{day}</span>
                                            <button onClick={() => addEvent(day - 1)} className="opacity-0 group-hover:opacity-100 w-6 h-6 rounded bg-emerald-500/20 text-emerald-500 flex items-center justify-center hover:bg-emerald-500 hover:text-white transition-all"><Plus className="w-3 h-3" /></button>
                                        </div>

                                        <div className="flex-1 space-y-1 overflow-y-auto custom-scrollbar max-h-[100px]">
                                            {eventsForDay.map((ev, idx) => (
                                                <div key={idx} className="bg-black/40 border border-white/5 rounded px-2 py-1 text-[9px] group/ev hover:border-emerald-500/30 relative">
                                                    <div className="text-emerald-500 font-bold">{ev.startTime}</div>
                                                    <div className="truncate text-white/70">{layouts.find(l => l._id === ev.layoutId)?.name}</div>
                                                    <button onClick={() => updateEvent(schedule.events.indexOf(ev), { layoutId: layouts[1]?._id || ev.layoutId })} className="absolute top-1 right-1 opacity-0 group-hover/ev:opacity-100 text-neutral-500 hover:text-white"><LayoutIcon className="w-3 h-3" /></button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                ) : (
                    // --- WEEK VIEW: Columns (Default) ---
                    <div className="grid grid-cols-7 divide-x divide-white/5 h-full">
                        {columns.map((colName, colIdx) => (
                            <div key={colIdx} className="flex flex-col min-w-0 h-full group/col">
                                <div className="p-4 flex items-center justify-between border-b border-white/5 bg-white/[0.02]">
                                    <span className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">{colName}</span>
                                    <button
                                        onClick={() => addEvent(colIdx)}
                                        className="w-6 h-6 rounded-md bg-white/5 hover:bg-emerald-500 hover:text-white flex items-center justify-center transition-all text-neutral-600 opacity-0 group-hover/col:opacity-100"
                                    >
                                        <Plus className="w-3.5 h-3.5" />
                                    </button>
                                </div>

                                <div className="flex-1 p-3 space-y-3 overflow-y-auto custom-scrollbar relative">
                                    {schedule.events?.filter(e => e.dayOfWeek === colIdx).map((event, eIdx) => {
                                        const originalIdx = schedule.events.indexOf(event);
                                        const layout = layouts.find(l => l._id === event.layoutId);

                                        return (
                                            <motion.div
                                                key={originalIdx}
                                                layoutId={`event-${originalIdx}`}
                                                className="bg-[#111] border border-white/10 p-4 rounded-xl shadow-xl relative group/event hover:border-emerald-500/50 hover:bg-[#161616] transition-all"
                                            >
                                                <div className="space-y-3">
                                                    <div className="flex justify-between items-start">
                                                        <div className="flex items-center gap-2 text-emerald-500">
                                                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                                            <span className="text-[9px] font-black font-mono tracking-tighter">{event.startTime} - {event.endTime}</span>
                                                        </div>
                                                        <button onClick={() => removeEvent(originalIdx)} className="opacity-0 group-hover/event:opacity-100 p-1 text-red-500/30 hover:text-red-500 transition-all"><Trash2 className="w-3 h-3" /></button>
                                                    </div>

                                                    <div className="space-y-1.5">
                                                        <select
                                                            value={event.layoutId}
                                                            onChange={(e) => updateEvent(originalIdx, { layoutId: e.target.value })}
                                                            className="w-full bg-black/40 border border-white/5 rounded-lg px-2 py-2 text-[10px] font-bold text-white outline-none focus:border-emerald-500/50 appearance-none uppercase tracking-wide cursor-pointer hover:bg-black/60 transition-colors"
                                                        >
                                                            {layouts.map(l => (
                                                                <option key={l._id} value={l._id}>{l.name}</option>
                                                            ))}
                                                        </select>
                                                    </div>

                                                    <div className="flex gap-2">
                                                        <input type="time" value={event.startTime} onChange={(e) => updateEvent(originalIdx, { startTime: e.target.value })} className="w-1/2 bg-black/30 border border-white/5 rounded px-2 py-1 text-[9px] font-mono text-neutral-400 outline-none focus:text-emerald-500 transition-colors" />
                                                        <input type="time" value={event.endTime} onChange={(e) => updateEvent(originalIdx, { endTime: e.target.value })} className="w-1/2 bg-black/30 border border-white/5 rounded px-2 py-1 text-[9px] font-mono text-neutral-400 outline-none focus:text-emerald-500 transition-colors" />
                                                    </div>
                                                </div>
                                            </motion.div>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
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
