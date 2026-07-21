'use client';

import React from 'react';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { User, Lock, Save, Mail, Shield, Key } from 'lucide-react';
import { motion } from 'framer-motion';

export default function ProfilePage() {
    return (
        <div className="flex-1 flex flex-col min-h-0 bg-[#050505] font-sans">
            <AdminHeader
                title="Mi Perfil"
                subtitle="Información de cuenta y seguridad"
                icon={<User className="w-5 h-5" />}
            />

            <div className="flex-1 overflow-y-auto p-10 custom-scrollbar">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                    className="max-w-3xl mx-auto space-y-8"
                >
                    {/* Profile Card */}
                    <div className="bg-[#0a0a0a] rounded-lg border border-white/5 overflow-hidden shadow-2xl relative group">
                        <div className="h-32 bg-gradient-to-r from-blue-900/20 to-purple-900/20 border-b border-white/5" />
                        <div className="px-8 pb-8 relative">
                            <div className="w-24 h-24 bg-black rounded-lg border border-white/10 absolute -top-12 flex items-center justify-center shadow-2xl group-hover:scale-105 transition-transform duration-500">
                                <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-indigo-600 rounded flex items-center justify-center">
                                    <span className="text-3xl font-black text-white italic">FG</span>
                                </div>
                            </div>

                            <div className="ml-32 pt-3 flex justify-between items-start">
                                <div>
                                    <h2 className="text-2xl font-black text-white uppercase italic tracking-tighter">Flavio Gonzalez</h2>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className="px-2 py-0.5 rounded bg-blue-500/10 border border-blue-500/20 text-blue-500 text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5">
                                            <Shield className="w-3 h-3" /> Administrador
                                        </span>
                                        <span className="text-[10px] text-neutral-500 font-mono tracking-wider ml-2">fgonzalez@pixelflow.com</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Change Password Section */}
                    <div className="bg-[#0a0a0a] p-8 rounded-lg border border-white/5 space-y-8 shadow-xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
                            <Key className="w-32 h-32" />
                        </div>

                        <div className="flex items-center gap-4 relative z-10">
                            <div className="p-3 bg-white/5 rounded-lg border border-white/5">
                                <Lock className="w-5 h-5 text-neutral-300" />
                            </div>
                            <div>
                                <h3 className="text-lg font-black text-white italic tracking-tighter uppercase leading-none">Seguridad</h3>
                                <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest mt-1.5">Actualizar contraseña de acceso</p>
                            </div>
                        </div>

                        <form onSubmit={async (e) => {
                            e.preventDefault();
                            const form = e.target as HTMLFormElement;
                            const currentPassword = (form.elements.namedItem('currentPassword') as HTMLInputElement).value;
                            const newPassword = (form.elements.namedItem('newPassword') as HTMLInputElement).value;

                            try {
                                const res = await fetch('/api/auth/change-password', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ currentPassword, newPassword })
                                });

                                if (res.ok) {
                                    alert('Contraseña actualizada correctamente');
                                    form.reset();
                                } else {
                                    const data = await res.json();
                                    alert(data.error || 'Error al actualizar la contraseña');
                                }
                            } catch (err) {
                                alert('Error de conexión');
                            }
                        }} className="space-y-6 relative z-10 max-w-xl">
                            <div className="space-y-4">
                                <div className="group">
                                    <label className="text-[9px] text-neutral-500 font-black uppercase tracking-widest ml-1 mb-2 block group-focus-within:text-blue-500 transition-colors">Contraseña Actual</label>
                                    <div className="relative">
                                        <input
                                            name="currentPassword"
                                            type="password"
                                            className="w-full bg-[#111] border border-white/10 rounded-lg px-4 py-3.5 text-xs font-bold text-white focus:border-blue-500/50 outline-none transition-all pl-10"
                                            placeholder="••••••••"
                                            required
                                        />
                                        <Lock className="w-4 h-4 text-neutral-600 absolute left-3 top-1/2 -translate-y-1/2" />
                                    </div>
                                </div>

                                <div className="group">
                                    <label className="text-[9px] text-neutral-500 font-black uppercase tracking-widest ml-1 mb-2 block group-focus-within:text-blue-500 transition-colors">Nueva Contraseña</label>
                                    <div className="relative">
                                        <input
                                            name="newPassword"
                                            type="password"
                                            className="w-full bg-[#111] border border-white/10 rounded-lg px-4 py-3.5 text-xs font-bold text-white focus:border-blue-500/50 outline-none transition-all pl-10"
                                            placeholder="Nueva contraseña segura"
                                            required
                                        />
                                        <Key className="w-4 h-4 text-neutral-600 absolute left-3 top-1/2 -translate-y-1/2" />
                                    </div>
                                </div>
                            </div>

                            <button
                                type="submit"
                                className="px-8 py-3.5 bg-white text-black hover:bg-neutral-200 rounded-lg text-[10px] font-black uppercase tracking-[0.2em] transition-all shadow-lg shadow-white/10 active:scale-95 flex items-center gap-2"
                            >
                                <Save className="w-4 h-4" /> Guardar Cambios
                            </button>
                        </form>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
