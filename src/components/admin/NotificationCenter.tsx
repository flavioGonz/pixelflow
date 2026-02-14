'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Info, AlertTriangle, CheckCircle, X } from 'lucide-react';

const mockNotifications = [
    { id: 1, type: 'info', title: 'Bienvenido', message: 'Bienvenido al panel de administración de PixelFlow.', time: 'Hace 5min' },
    { id: 2, type: 'warning', title: 'Actualización Pendiente', message: 'Hay una nueva versión del sistema disponible.', time: 'Hace 1h' },
    { id: 3, type: 'success', title: 'Pantalla Sincronizada', message: 'La pantalla "Lobby Main" se ha conectado correctamente.', time: 'Hace 2h' },
];

export function NotificationCenter() {
    const [isOpen, setIsOpen] = useState(false);
    const [notifications, setNotifications] = useState(mockNotifications);

    const getIcon = (type: string) => {
        switch (type) {
            case 'info': return <Info className="w-4 h-4 text-blue-500" />;
            case 'warning': return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
            case 'success': return <CheckCircle className="w-4 h-4 text-emerald-500" />;
            default: return <Info className="w-4 h-4 text-neutral-500" />;
        }
    };

    const handleClear = (id: number) => {
        setNotifications(prev => prev.filter(n => n.id !== id));
    };

    return (
        <div className="relative z-40">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-10 h-10 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center hover:bg-white/10 transition-all active:scale-95 relative"
            >
                <Bell className={`w-5 h-5 text-neutral-400 ${notifications.length > 0 ? 'animate-pulse text-white' : ''}`} />
                {notifications.length > 0 && (
                    <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border border-black shadow-lg shadow-red-500/50" />
                )}
            </button>

            <AnimatePresence>
                {isOpen && (
                    <>
                        <div className="fixed inset-0 z-30" onClick={() => setIsOpen(false)} />
                        <motion.div
                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                            className="absolute right-0 top-full mt-2 w-80 bg-[#0a0a0a] border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-40 flex flex-col"
                        >
                            <div className="px-5 py-4 border-b border-white/5 flex items-center justify-between bg-white/5">
                                <h3 className="text-[10px] font-black uppercase tracking-widest text-white flex items-center gap-2">
                                    <Bell className="w-3 h-3 text-blue-500" /> Notificaciones ({notifications.length})
                                </h3>
                                {notifications.length > 0 && (
                                    <button
                                        onClick={() => setNotifications([])}
                                        className="text-[9px] font-bold text-neutral-500 hover:text-red-500 uppercase tracking-wide transition-colors"
                                    >
                                        Limpiar Todo
                                    </button>
                                )}
                            </div>

                            <div className="max-h-80 overflow-y-auto custom-scrollbar p-2 space-y-1">
                                {notifications.length > 0 ? (
                                    notifications.map((n) => (
                                        <div key={n.id} className="relative group bg-white/[0.02] hover:bg-white/5 border border-white/5 hover:border-white/10 rounded-xl p-3 transition-all flex gap-3">
                                            <div className="mt-1 flex-shrink-0 w-8 h-8 bg-black rounded-lg flex items-center justify-center border border-white/5 shadow-inner">
                                                {getIcon(n.type)}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between mb-0.5">
                                                    <h4 className="text-[11px] font-black text-white uppercase tracking-tight truncate">{n.title}</h4>
                                                    <span className="text-[9px] font-bold text-neutral-600 truncate ml-2">{n.time}</span>
                                                </div>
                                                <p className="text-[10px] text-neutral-400 font-medium leading-relaxed line-clamp-2">{n.message}</p>
                                            </div>
                                            <button
                                                onClick={() => handleClear(n.id)}
                                                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 p-1 hover:bg-red-500/20 rounded text-neutral-500 hover:text-red-500 transition-all"
                                            >
                                                <X className="w-3 h-3" />
                                            </button>
                                        </div>
                                    ))
                                ) : (
                                    <div className="py-10 flex flex-col items-center justify-center text-neutral-600">
                                        <Bell className="w-8 h-8 mb-3 opacity-20" />
                                        <p className="text-[10px] font-black uppercase tracking-widest text-center">No hay notificaciones nuevas</p>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}
