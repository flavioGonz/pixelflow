'use client';

import React from 'react';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { Settings2, Lock, Save, Monitor } from 'lucide-react';
import { motion } from 'framer-motion';

export default function SettingsPage() {
    return (
        <div className="flex-1 flex flex-col min-h-0 bg-[#050505]">
            <AdminHeader
                title="Configuración"
                subtitle="Gestión de seguridad y sistema"
                icon={<Settings2 className="w-5 h-5" />}
            />

            <div className="flex-1 overflow-y-auto p-10 custom-scrollbar">
                <div className="max-w-4xl mx-auto space-y-8">
                    {/* Seguridad Section */}
                    <div className="bg-[#111] p-8 rounded-2xl border border-white/5 space-y-8 shadow-2xl">
                        <div className="flex items-center gap-4 mb-2">
                            <div className="p-3 bg-blue-500/10 rounded-xl">
                                <Lock className="w-6 h-6 text-blue-500" />
                            </div>
                            <div>
                                <h3 className="text-xl font-black text-white italic tracking-tighter uppercase leading-none">Seguridad</h3>
                                <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest mt-1">Gestionar acceso y credenciales</p>
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
                        }} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[9px] text-neutral-400 font-black uppercase tracking-widest ml-1">Contraseña Actual</label>
                                    <input
                                        name="currentPassword"
                                        type="password"
                                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3.5 text-xs font-bold text-white focus:border-blue-500/50 outline-none transition-all focus:bg-blue-900/10"
                                        placeholder="••••••••"
                                        required
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[9px] text-neutral-400 font-black uppercase tracking-widest ml-1">Nueva Contraseña</label>
                                    <input
                                        name="newPassword"
                                        type="password"
                                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3.5 text-xs font-bold text-white focus:border-blue-500/50 outline-none transition-all focus:bg-blue-900/10"
                                        placeholder="Nueva contraseña segura"
                                        required
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                className="w-full md:w-fit px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all shadow-lg shadow-blue-900/20 active:scale-95 flex items-center justify-center gap-2"
                            >
                                <Save className="w-4 h-4" /> Actualizar Credenciales
                            </button>
                        </form>
                    </div>

                    {/* Info Section */}
                    <div className="bg-[#111] p-8 rounded-2xl border border-white/5 flex items-center justify-between group hover:border-white/10 transition-all shadow-xl">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-neutral-800 rounded-xl">
                                <Monitor className="w-6 h-6 text-neutral-400" />
                            </div>
                            <div>
                                <h3 className="text-sm font-black text-white italic tracking-wider uppercase mb-1 leading-none">PixelFlow Core</h3>
                                <div className="flex gap-3 text-[9px] text-neutral-500 font-mono font-bold uppercase tracking-widest">
                                    <span>v2.0.0 PRO</span>
                                    <span className="text-neutral-700">|</span>
                                    <span>Build 2024.10</span>
                                </div>
                            </div>
                        </div>
                        <div className="px-4 py-2 bg-green-500/10 border border-green-500/20 rounded-full">
                            <span className="text-[9px] font-black text-green-500 uppercase tracking-wider flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                                Sistema Activo
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
