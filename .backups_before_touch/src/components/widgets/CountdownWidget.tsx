'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

interface CountdownWidgetProps {
    data: {
        targetDate?: string;
        title?: string;
        subtitle?: string;
        accentColor?: string;
    };
}

const CountdownWidget: React.FC<CountdownWidgetProps> = ({ data }) => {
    const targetDate = data.targetDate || new Date(Date.now() + 86400000 * 2.5).toISOString();
    const [timeLeft, setTimeLeft] = useState<{ d: number; h: number; m: number; s: number }>({ d: 0, h: 0, m: 0, s: 0 });
    const accentColor = data.accentColor || '#3b82f6';

    useEffect(() => {
        const calculate = () => {
            const difference = +new Date(targetDate) - +new Date();
            if (difference > 0) {
                setTimeLeft({
                    d: Math.floor(difference / (1000 * 60 * 60 * 24)),
                    h: Math.floor((difference / (1000 * 60 * 60)) % 24),
                    m: Math.floor((difference / 1000 / 60) % 60),
                    s: Math.floor((difference / 1000) % 60),
                });
            }
        };

        const timer = setInterval(calculate, 1000);
        calculate();
        return () => clearInterval(timer);
    }, [targetDate]);

    const TimeUnit = ({ val, label }: { val: number; label: string }) => (
        <div className="flex flex-col items-center">
            <div className="relative group">
                <motion.div
                    key={val}
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="text-6xl md:text-8xl font-black italic tracking-tighter text-white tabular-nums"
                >
                    {val.toString().padStart(2, '0')}
                </motion.div>
                <div className="absolute -inset-2 bg-gradient-to-t from-white/10 to-transparent blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-neutral-500 mt-2">{label}</span>
        </div>
    );

    return (
        <div className="w-full h-full flex flex-col items-center justify-center p-8 text-center bg-black/40 backdrop-blur-xl rounded-3xl border border-white/5 shadow-2xl overflow-hidden relative group">
            {/* Animated Glow Back */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 blur-[120px] rounded-full opacity-20 transition-colors" style={{ backgroundColor: accentColor }} />

            <div className="relative z-10 w-full">
                <h3 className="text-sm md:text-base font-black uppercase tracking-[0.5em] text-neutral-400 mb-2">
                    {data.title || 'PRÓXIMO EVENTO'}
                </h3>
                <h2 className="text-2xl md:text-4xl font-black italic uppercase tracking-tighter text-white mb-10">
                    {data.subtitle || 'CENA DE GALA & SHOW'}
                </h2>

                <div className="flex items-center justify-center gap-6 md:gap-12">
                    <TimeUnit val={timeLeft.d} label="Días" />
                    <div className="h-16 w-[2px] bg-white/5 mt-[-20px]" />
                    <TimeUnit val={timeLeft.h} label="Horas" />
                    <div className="h-16 w-[2px] bg-white/5 mt-[-20px]" />
                    <TimeUnit val={timeLeft.m} label="Minutos" />
                    <div className="h-16 w-[2px] bg-white/5 mt-[-20px]" />
                    <TimeUnit val={timeLeft.s} label="Segundos" />
                </div>
            </div>

            <motion.div
                className="absolute bottom-0 left-0 h-1"
                animate={{ width: ['0%', '100%'] }}
                transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
                style={{ backgroundColor: accentColor }}
            />
        </div>
    );
};

export default CountdownWidget;
