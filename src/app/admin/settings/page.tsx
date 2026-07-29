'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Lock, Save, Monitor } from 'lucide-react';

export default function SettingsPage() {
    return (
        <div className="space-y-6">
            {/* Seguridad */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="rounded-xl border bg-card p-6 space-y-5">
                <div className="flex items-center gap-3">
                    <div className="size-11 rounded-xl grid place-items-center bg-blue-500/10 text-blue-500 ring-1 ring-blue-500/20">
                        <Lock className="size-5" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold tracking-tight">Seguridad</h3>
                        <p className="text-[12px] text-muted-foreground">Gestionar acceso y credenciales del panel.</p>
                    </div>
                </div>

                <form onSubmit={async (e) => {
                    e.preventDefault();
                    const form = e.currentTarget as HTMLFormElement;
                    const oldPassword = (form.elements.namedItem('oldPassword') as HTMLInputElement).value;
                    const newPassword = (form.elements.namedItem('newPassword') as HTMLInputElement).value;
                    const confirmPassword = (form.elements.namedItem('confirmPassword') as HTMLInputElement).value;
                    if (newPassword !== confirmPassword) { alert('Las contraseñas no coinciden'); return; }
                    try {
                        const res = await fetch('/api/auth/change-password', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ oldPassword, newPassword }),
                        });
                        const data = await res.json();
                        if (!res.ok) throw new Error(data.error || 'Error');
                        alert('Contraseña actualizada');
                        form.reset();
                    } catch (err: any) { alert(err.message); }
                }} className="space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                            <label className="text-[11px] font-semibold text-muted-foreground block mb-1">Contraseña actual</label>
                            <input type="password" name="oldPassword" required className="w-full h-10 px-3 rounded-md border bg-background text-sm" />
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                            <label className="text-[11px] font-semibold text-muted-foreground block mb-1">Nueva contraseña</label>
                            <input type="password" name="newPassword" required minLength={6} className="w-full h-10 px-3 rounded-md border bg-background text-sm" />
                        </div>
                        <div>
                            <label className="text-[11px] font-semibold text-muted-foreground block mb-1">Repetir</label>
                            <input type="password" name="confirmPassword" required minLength={6} className="w-full h-10 px-3 rounded-md border bg-background text-sm" />
                        </div>
                    </div>
                    <div className="pt-2 flex justify-end">
                        <button type="submit" className="h-9 px-4 rounded-md bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 flex items-center gap-2">
                            <Save className="size-4" /> Guardar cambios
                        </button>
                    </div>
                </form>
            </motion.div>

            {/* Info system */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="rounded-xl border bg-card p-6 space-y-3">
                <div className="flex items-center gap-3">
                    <div className="size-11 rounded-xl grid place-items-center bg-emerald-500/10 text-emerald-500 ring-1 ring-emerald-500/20">
                        <Monitor className="size-5" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold tracking-tight">Sistema</h3>
                        <p className="text-[12px] text-muted-foreground">Información general del despliegue.</p>
                    </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-[13px]">
                    <div className="rounded-md border bg-background px-3 py-2">
                        <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Versión</div>
                        <div className="font-mono font-semibold">PixelFlow 1.0</div>
                    </div>
                    <div className="rounded-md border bg-background px-3 py-2">
                        <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Entorno</div>
                        <div className="font-mono font-semibold">Producción</div>
                    </div>
                    <div className="rounded-md border bg-background px-3 py-2">
                        <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Node.js</div>
                        <div className="font-mono font-semibold">v22+</div>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
