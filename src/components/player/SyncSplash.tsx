'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { subscribeSyncStatus } from '@/lib/syncEngine';

export const SyncSplash: React.FC<{ visible: boolean }> = ({ visible }) => {
    const [status, setStatus] = React.useState<any>({ state: 'idle', total: 0, done: 0 });
    React.useEffect(() => subscribeSyncStatus(setStatus), []);

    const pct = status.total > 0 ? Math.min(100, Math.round((status.done / status.total) * 100)) : 0;

    return (
        <AnimatePresence>
            {visible && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0, transition: { duration: 0.4 } }}
                    className="fixed inset-0 z-[999] flex flex-col items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white"
                >
                    {/* Título grande */}
                    <motion.div
                        initial={{ y: -20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.1 }}
                        className="text-center mb-10"
                    >
                        <h1 className="text-6xl md:text-7xl font-black tracking-tight bg-gradient-to-r from-sky-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                            PixelFlow
                        </h1>
                        <div className="mt-2 text-xs md:text-sm uppercase tracking-[0.4em] text-white/40 font-bold">
                            Sincronizando interfaces
                        </div>
                    </motion.div>

                    {/* Barra de progreso */}
                    <div className="w-[min(80vw,480px)]">
                        <div className="flex items-center justify-between text-[10px] uppercase tracking-widest text-white/50 font-bold mb-2">
                            <span>{status.currentAction || 'Preparando…'}</span>
                            <span className="font-mono">{status.done}/{status.total}</span>
                        </div>
                        <div className="h-2 rounded-full bg-white/10 overflow-hidden relative">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: pct + '%' }}
                                transition={{ duration: 0.3, ease: 'easeOut' }}
                                className="h-full bg-gradient-to-r from-sky-500 to-purple-500 rounded-full"
                            />
                            {/* Shimmer */}
                            <motion.div
                                animate={{ x: ['-100%', '100%'] }}
                                transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
                                className="absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                            />
                        </div>
                        <div className="text-center mt-4 text-[11px] text-white/40">
                            Guardando todo en tu dispositivo para trabajar sin depender de la red.
                        </div>
                    </div>

                    {/* Spinner iOS-style abajo */}
                    <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                        className="mt-10 w-6 h-6 border-2 border-white/20 border-t-white/80 rounded-full"
                    />
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default SyncSplash;
