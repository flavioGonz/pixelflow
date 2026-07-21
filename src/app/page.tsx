'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Layout, Monitor, ArrowRight, Zap, Smartphone, Globe } from 'lucide-react';

export default function LandingPage() {
    return (
        <div className="min-h-screen bg-neutral-950 text-white flex flex-col items-center justify-center p-6 selection:bg-blue-500/30">
            {/* Background Glow */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-[25%] -left-[10%] w-[50%] h-[50%] bg-blue-600/10 blur-[120px] rounded-full" />
                <div className="absolute -bottom-[25%] -right-[10%] w-[50%] h-[50%] bg-emerald-600/10 blur-[120px] rounded-full" />
            </div>

            <main className="relative z-10 max-w-4xl w-full text-center space-y-12">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                    className="space-y-4"
                >
                    <div className="flex justify-center mb-6">
                        <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-blue-400 rounded-xl flex items-center justify-center shadow-2xl shadow-blue-600/40 rotate-12">
                            <Zap className="w-10 h-10 text-white fill-white" />
                        </div>
                    </div>
                    <h1 className="text-6xl md:text-8xl font-black tracking-tighter uppercase">
                        Pixel<span className="text-blue-500 italic">Flow</span>
                    </h1>
                    <p className="text-neutral-400 text-lg md:text-xl font-medium max-w-2xl mx-auto leading-relaxed">
                        Plataforma interactiva de menú digital. Diseña una vez, despliega en todas tus pantallas en tiempo real.
                    </p>
                </motion.div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-8">
                    {/* Card Admin */}
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 }}
                    >
                        <Link
                            href="/admin"
                            className="group block p-8 bg-neutral-900/50 border border-white/5 rounded-2xl hover:border-blue-500/50 transition-all hover:bg-neutral-900/80 text-left relative overflow-hidden"
                        >
                            <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform">
                                <Layout className="w-32 h-32" />
                            </div>
                            <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center mb-6 border border-blue-500/20 group-hover:bg-blue-500 group-hover:text-white transition-colors text-blue-400">
                                <Layout className="w-6 h-6" />
                            </div>
                            <h2 className="text-2xl font-bold mb-2">Director</h2>
                            <p className="text-neutral-500 text-sm mb-6 leading-relaxed">
                                Diseña layouts, gestiona widgets y publica contenido en tus pantallas al instante.
                            </p>
                            <div className="flex items-center gap-2 text-blue-500 font-bold text-xs uppercase tracking-widest">
                                Ir al Panel de Control <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                            </div>
                        </Link>
                    </motion.div>

                    {/* Card Player */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3 }}
                    >
                        <Link
                            href="/player/pantalla-1"
                            className="group block p-8 bg-neutral-900/50 border border-white/5 rounded-2xl hover:border-emerald-500/50 transition-all hover:bg-neutral-900/80 text-left relative overflow-hidden"
                        >
                            <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform">
                                <Monitor className="w-32 h-32" />
                            </div>
                            <div className="w-12 h-12 bg-emerald-500/10 rounded-xl flex items-center justify-center mb-6 border border-emerald-500/20 group-hover:bg-emerald-500 group-hover:text-white transition-colors text-emerald-400">
                                <Monitor className="w-6 h-6" />
                            </div>
                            <h2 className="text-2xl font-bold mb-2">Reproductor</h2>
                            <p className="text-neutral-500 text-sm mb-6 leading-relaxed">
                                Abre la vista de señalización digital para 'pantalla-1'. Soporta táctil y cambios de orientación.
                            </p>
                            <div className="flex items-center gap-2 text-emerald-500 font-bold text-xs uppercase tracking-widest">
                                Ver Pantalla <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                            </div>
                        </Link>
                    </motion.div>
                </div>

                <motion.footer
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="flex flex-wrap justify-center gap-8 pt-12 text-neutral-600 text-[10px] font-black uppercase tracking-[0.2em]"
                >
                    <div className="flex items-center gap-2"><Globe className="w-3 h-3" /> Real-time Sync</div>
                    <div className="flex items-center gap-2"><Smartphone className="w-3 h-3" /> Portrait Support</div>
                    <div className="flex items-center gap-2"><Zap className="w-3 h-3" /> Zero Reloads</div>
                </motion.footer>
            </main>
        </div>
    );
}
