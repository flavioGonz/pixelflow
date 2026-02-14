'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import User from 'lucide-react/dist/esm/icons/user';
import Settings from 'lucide-react/dist/esm/icons/settings';
import LogOut from 'lucide-react/dist/esm/icons/log-out';
import ChevronDown from 'lucide-react/dist/esm/icons/chevron-down';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export function UserMenu() {
    const [isOpen, setIsOpen] = useState(false);
    const router = useRouter();

    const handleLogout = async () => {
        try {
            await fetch('/api/auth/logout', { method: 'POST' });
            router.push('/login');
        } catch (error) {
            console.error('Logout failed', error);
        }
    };

    return (
        <div className="relative z-50">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-full pl-2 pr-4 py-1.5 hover:bg-white/10 transition-colors cursor-pointer group"
            >
                <div className="w-7 h-7 bg-blue-600 rounded-full flex items-center justify-center text-[10px] font-bold text-white uppercase shadow-lg shadow-blue-500/20 group-hover:scale-105 transition-transform">
                    A
                </div>
                <div className="flex flex-col items-start">
                    <span className="text-[9px] font-black uppercase tracking-widest text-neutral-400 group-hover:text-white transition-colors">Administrador</span>
                </div>
                <ChevronDown className={`w-3 h-3 text-neutral-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            <AnimatePresence>
                {isOpen && (
                    <>
                        <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
                        <motion.div
                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                            className="absolute right-0 top-full mt-2 w-56 bg-[#0a0a0a] border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-50 flex flex-col p-1"
                        >
                            <div className="px-4 py-3 border-b border-white/5">
                                <p className="text-white font-bold text-xs">Admin User</p>
                                <p className="text-[10px] text-neutral-500 truncate">admin@pixelflow.com</p>
                            </div>

                            <div className="p-1 space-y-0.5">
                                <Link href="/admin/profile">
                                    <button className="w-full text-left flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-white/5 text-[10px] font-bold text-neutral-400 hover:text-white transition-colors uppercase tracking-wider">
                                        <User className="w-3.5 h-3.5" /> Perfil
                                    </button>
                                </Link>
                                <Link href="/admin/settings">
                                    <button className="w-full text-left flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-white/5 text-[10px] font-bold text-neutral-400 hover:text-white transition-colors uppercase tracking-wider">
                                        <Settings className="w-3.5 h-3.5" /> Configuración
                                    </button>
                                </Link>
                            </div>

                            <div className="h-[1px] bg-white/5 my-1" />

                            <div className="p-1">
                                <button
                                    onClick={handleLogout}
                                    className="w-full text-left flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-red-500/10 text-[10px] font-bold text-red-500 transition-colors uppercase tracking-wider"
                                >
                                    <LogOut className="w-3.5 h-3.5" /> Cerrar Sesión
                                </button>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}
