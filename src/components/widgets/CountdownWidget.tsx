'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, Calendar, Bell, ChevronRight } from 'lucide-react';

interface CountdownWidgetProps {
    data: {
        targetDate?: string;
        title?: string;
        subtitle?: string;
        accentColor?: string;
    };
}

const CountdownWidget: React.FC<CountdownWidgetProps> = ({ data }) => {
    const targetDate = useMemo(() => data.targetDate || new Date(Date.now() + 86400000 * 2.5).toISOString(), [data.targetDate]);
    const [timeLeft, setTimeLeft] = useState<{ d: number; h: number; m: number; s: number }>({ d: 0, h: 0, m: 0, s: 0 });
    const accentColor = data.accentColor || '#3b82f6';

    useEffect(() => {
        const calculate = () => {
            const t = new Date(targetDate).getTime();
            const difference = isNaN(t) ? 0 : t - Date.now();
            if (difference > 0) {
                setTimeLeft({
                    d: Math.floor(difference / (1000 * 60 * 60 * 24)),
                    h: Math.floor((difference / (1000 * 60 * 60)) % 24),
                    m: Math.floor((difference / 1000 / 60) % 60),
                    s: Math.floor((difference / 1000) % 60),
                });
            } else {
                setTimeLeft({ d: 0, h: 0, m: 0, s: 0 });
            }
        };

        const timer = setInterval(calculate, 1000);
        calculate();
        return () => clearInterval(timer);
    }, [targetDate]);

    const FlipCard = ({ val, label }: { val: number; label: string }) => {
        const digits = val.toString().padStart(2, '0').split('');

        return (
            <div className="flex flex-col items-center gap-3">
                <div className="flex gap-1.5 md:gap-3">
                    {digits.map((digit, idx) => (
                        <div key={idx} className="relative group">
                            {/* Card Container */}
                            <div className="relative w-12 h-20 md:w-20 md:h-32 bg-neutral-900 rounded-lg md:rounded-2xl overflow-hidden border border-white/5 shadow-[0_20px_50px_rgba(0,0,0,0.5)] flex items-center justify-center">
                                {/* Top Half Shadow */}
                                <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-white/5 to-transparent pointer-events-none" />

                                {/* Center Divider */}
                                <div className="absolute top-1/2 left-0 w-full h-[1px] bg-black/60 z-20" />

                                <AnimatePresence mode="popLayout" initial={false}>
                                    <motion.span
                                        key={digit}
                                        initial={{ y: 20, opacity: 0, rotateX: -90 }}
                                        animate={{ y: 0, opacity: 1, rotateX: 0 }}
                                        exit={{ y: -20, opacity: 0, rotateX: 90 }}
                                        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                                        className="text-4xl md:text-7xl font-black italic tracking-tighter text-white tabular-nums z-10"
                                    >
                                        {digit}
                                    </motion.span>
                                </AnimatePresence>

                                {/* Side Grooves */}
                                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-3 md:w-2 md:h-5 bg-black rounded-r-full opacity-50" />
                                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1.5 h-3 md:w-2 md:h-5 bg-black rounded-l-full opacity-50" />
                            </div>
                        </div>
                    ))}
                </div>
                <span className="text-[10px] md:text-xs font-black uppercase tracking-[0.3em] text-neutral-500 italic">
                    {label}
                </span>
            </div>
        );
    };

    return (
        <div className="w-full h-full flex flex-col items-center justify-center p-6 md:p-12 text-center bg-black rounded-[2.5rem] border border-white/10 shadow-2xl overflow-hidden relative group font-sans">

            {/* Mesh Gradient Background */}
            <div className="absolute inset-0 opacity-40 pointer-events-none">
                <motion.div
                    animate={{
                        scale: [1, 1.2, 1],
                        rotate: [0, 90, 0],
                        x: [0, 50, 0],
                        y: [0, -30, 0]
                    }}
                    transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                    className="absolute -top-1/2 -left-1/2 w-full h-full blur-[120px] rounded-full"
                    style={{ backgroundColor: accentColor }}
                />
                <motion.div
                    animate={{
                        scale: [1.2, 1, 1.2],
                        rotate: [0, -90, 0],
                        x: [0, -50, 0],
                        y: [0, 30, 0]
                    }}
                    transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
                    className="absolute -bottom-1/2 -right-1/2 w-full h-full blur-[120px] rounded-full opacity-60"
                    style={{ backgroundColor: '#ffffff20' }}
                />
            </div>

            {/* Pattern Overlay */}
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '30px 30px' }} />

            <div className="relative z-10 w-full flex flex-col items-center max-w-4xl">

                {/* Header Badge */}
                <motion.div
                    initial={{ y: -20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="flex items-center gap-3 px-6 py-2 rounded-full border border-white/10 bg-white/5 backdrop-blur-md mb-8 shadow-2xl"
                >
                    <Bell className="w-4 h-4 text-white animate-bounce" style={{ color: accentColor }} />
                    <span className="text-[10px] md:text-xs font-black uppercase tracking-[0.4em] text-white/80 italic">
                        {data.title || 'SAVE THE DATE'}
                    </span>
                </motion.div>

                {/* Main Title Section */}
                <div className="mb-12 md:mb-16 space-y-2">
                    <motion.h2
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="text-4xl md:text-8xl font-black italic tracking-tighter text-white uppercase leading-[0.85] drop-shadow-[0_10px_30px_rgba(0,0,0,0.5)]"
                    >
                        {data.subtitle || 'CENA DE GALA'}
                    </motion.h2>
                    <div className="flex items-center justify-center gap-4 text-white/30 uppercase text-[9px] md:text-[11px] font-bold tracking-[0.5em] italic">
                        <span className="w-12 md:w-20 h-[1px] bg-white/10" />
                        EVENTO EXCLUSIVO
                        <span className="w-12 md:w-20 h-[1px] bg-white/10" />
                    </div>
                </div>

                {/* The Counter */}
                <div className="flex items-center justify-center gap-4 md:gap-14 bg-black/40 p-6 md:p-10 rounded-[2rem] md:rounded-[3.5rem] border border-white/5 backdrop-blur-2xl shadow-inner group/counter hover:border-white/10 transition-colors duration-500">
                    <FlipCard val={timeLeft.d} label="Días" />
                    <div className="flex flex-col gap-4 opacity-20">
                        <div className="w-1 h-1 md:w-2 md:h-2 rounded-full bg-white" />
                        <div className="w-1 h-1 md:w-2 md:h-2 rounded-full bg-white" />
                    </div>
                    <FlipCard val={timeLeft.h} label="Horas" />
                    <div className="flex flex-col gap-4 opacity-20 hidden md:flex">
                        <div className="w-1 h-1 md:w-2 md:h-2 rounded-full bg-white" />
                        <div className="w-1 h-1 md:w-2 md:h-2 rounded-full bg-white" />
                    </div>
                    <FlipCard val={timeLeft.m} label="Min" />
                    <div className="flex flex-col gap-4 opacity-20 hidden sm:flex">
                        <div className="w-1 h-1 md:w-2 md:h-2 rounded-full bg-white" />
                        <div className="w-1 h-1 md:w-2 md:h-2 rounded-full bg-white" />
                    </div>
                    <FlipCard val={timeLeft.s} label="Seg" />
                </div>

                {/* Footer Info */}
                <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="mt-12 md:mt-16 flex items-center gap-8 md:gap-16"
                >
                    <div className="flex items-center gap-3 group/info cursor-pointer">
                        <div className="w-10 h-10 md:w-12 md:h-12 bg-white/5 rounded-xl border border-white/10 flex items-center justify-center group-hover/info:bg-white group-hover/info:text-black transition-all">
                            <Calendar className="w-5 h-5 md:w-6 md:h-6" />
                        </div>
                        <div className="text-left">
                            <p className="text-[10px] text-neutral-500 font-black uppercase tracking-widest italic leading-none mb-1">PROGRAMADO</p>
                            <p className="text-sm md:text-lg font-black italic text-white leading-none">CADA SEMANA</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 group/info cursor-pointer">
                        <div className="w-10 h-10 md:w-12 md:h-12 bg-white/5 rounded-xl border border-white/10 flex items-center justify-center group-hover/info:bg-white group-hover/info:text-black transition-all">
                            <Clock className="w-5 h-5 md:w-6 md:h-6" />
                        </div>
                        <div className="text-left">
                            <p className="text-[10px] text-neutral-500 font-black uppercase tracking-widest italic leading-none mb-1">HORARIO</p>
                            <p className="text-sm md:text-lg font-black italic text-white leading-none">21:30 HS</p>
                        </div>
                    </div>
                </motion.div>
            </div>

            {/* Accent Glowing Border */}
            <div className="absolute inset-0 border border-white/5 group-hover:border-white/10 transition-colors pointer-events-none rounded-[2.5rem]" />
            <div className="absolute bottom-0 left-0 h-1.5 opacity-50" style={{ backgroundColor: accentColor, width: '100%', filter: 'blur(5px)' }} />

            {/* Corner Decorative Elements */}
            <div className="absolute top-8 left-8 p-4 border-t-2 border-l-2 opacity-20 rounded-tl-xl" style={{ borderColor: accentColor }} />
            <div className="absolute bottom-8 right-8 p-4 border-b-2 border-r-2 opacity-20 rounded-br-xl" style={{ borderColor: accentColor }} />
        </div>
    );
};

export default CountdownWidget;
