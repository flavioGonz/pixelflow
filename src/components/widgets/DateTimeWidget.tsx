'use client';
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

interface DateTimeWidgetProps {
    data: {
        color?: string;
        format?: '12' | '24';
        showDate?: boolean;
        showSeconds?: boolean;
        style?: 'minimal' | 'card' | 'neon' | 'ios' | 'retro' | 'elegant';
    };
}

const DateTimeWidget: React.FC<DateTimeWidgetProps> = ({ data = {} }) => {
    const [date, setDate] = useState<Date | null>(null);

    useEffect(() => {
        setDate(new Date());
        const timer = setInterval(() => setDate(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    if (!date) return null; // Avoid hydration mismatch

    const safeData = data || {};
    const format = safeData.format || '24';
    const textColor = safeData.color || '#ffffff';
    const showSeconds = safeData.showSeconds !== false;
    const showDate = safeData.showDate !== false;
    const style = safeData.style || 'minimal';

    // Time logic
    const hours = format === '12' ? (date.getHours() % 12 || 12) : date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const seconds = date.getSeconds().toString().padStart(2, '0');
    const ampm = date.getHours() >= 12 ? 'PM' : 'AM';

    // Date logic
    const dayName = new Intl.DateTimeFormat('es-ES', { weekday: 'long' }).format(date);
    const dayNameUpper = dayName.charAt(0).toUpperCase() + dayName.slice(1);
    const dateNum = date.getDate();
    const monthName = new Intl.DateTimeFormat('es-ES', { month: 'long' }).format(date);
    const monthUpper = monthName.charAt(0).toUpperCase() + monthName.slice(1);

    if (style === 'card') {
        return (
            <div className="w-full h-full flex items-center justify-center bg-transparent">
                <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-6 rounded-2xl flex flex-col items-center gap-2 shadow-2xl">
                    <span className="text-xs font-black uppercase tracking-[0.3em] text-white/60">{dayNameUpper}</span>
                    <div className="flex items-baseline gap-2 leading-none" style={{ color: textColor }}>
                        <span className="text-6xl font-black tracking-tighter">{hours}:{minutes}</span>
                        {showSeconds && <span className="text-2xl font-bold opacity-60">:{seconds}</span>}
                        {format === '12' && <span className="text-xl font-bold opacity-60 ml-1">{ampm}</span>}
                    </div>
                    {showDate && (
                        <div className="h-[1px] w-full bg-white/10 my-2" />
                    )}
                    {showDate && (
                        <span className="text-sm font-bold uppercase tracking-widest text-white/80">{dateNum} DE {monthUpper}</span>
                    )}
                </div>
            </div>
        );
    }

    if (style === 'neon') {
        return (
            <div className="w-full h-full flex flex-col items-center justify-center bg-transparent">
                <div className="relative group">
                    <div className="absolute -inset-4 bg-blue-500/20 blur-xl rounded-full opacity-50 group-hover:opacity-100 transition-opacity animate-pulse" style={{ backgroundColor: `${textColor}44` }} />
                    <div className="flex items-baseline gap-2 relative z-10" style={{ color: textColor, textShadow: `0 0 20px ${textColor}` }}>
                        <span className="text-7xl font-black tracking-tighter italic">{hours}:{minutes}</span>
                        {showSeconds && <span className="text-3xl font-bold opacity-80">:{seconds}</span>}
                    </div>
                </div>
                {showDate && (
                    <span className="mt-4 text-sm font-black uppercase tracking-[0.5em] text-white/50 relative z-10">{dayNameUpper}, {dateNum} {monthUpper}</span>
                )}
            </div>
        );
    }

    if (style === 'ios') {
        return (
            <div className="w-full h-full flex items-center justify-center bg-transparent">
                <div className="bg-white/5 backdrop-blur-3xl border border-white/10 p-10 rounded-[2.5rem] flex flex-col items-center gap-1 shadow-2xl relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-tr from-white/5 to-transparent pointer-events-none" />
                    <span className="text-xs font-medium uppercase tracking-[0.2em] text-white/50 mb-2">{dayNameUpper}</span>
                    <div className="flex items-baseline gap-1 leading-none" style={{ color: textColor }}>
                        <span className="text-7xl font-thin tracking-tighter drop-shadow-lg">{hours}:{minutes}</span>
                        {showSeconds && <span className="text-3xl font-light opacity-60">:{seconds}</span>}
                    </div>
                    {showDate && (
                        <span className="text-sm font-medium text-white/70 mt-3">{dateNum} {monthUpper}</span>
                    )}
                </div>
            </div>
        );
    }

    if (style === 'retro') {
        return (
            <div className="w-full h-full flex items-center justify-center bg-transparent">
                <div className="border-2 border-white/10 p-8 rounded-xl bg-white/5 backdrop-blur-md shadow-2xl relative overflow-hidden">
                    <div className="absolute inset-0 pointer-events-none opacity-10" style={{ backgroundImage: 'linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.25) 50%), linear-gradient(90deg, rgba(255, 0, 0, 0.06), rgba(0, 255, 0, 0.02), rgba(0, 0, 255, 0.06))', backgroundSize: '100% 2px, 3px 100%' }} />
                    <div style={{ fontFamily: 'monospace', color: textColor === '#ffffff' ? '#10b981' : textColor }} className="flex flex-col items-center">
                        <span className="text-6xl font-black tracking-widest drop-shadow-[0_0_10px_rgba(16,185,129,0.5)]">{hours}:{minutes}{showSeconds && `:${seconds}`}</span>
                        {showDate && <span className="text-sm mt-4 uppercase tracking-[0.5em] opacity-60">{dateNum}-{monthUpper}</span>}
                    </div>
                </div>
            </div>
        );
    }

    if (style === 'elegant') {
        return (
            <div className="w-full h-full flex flex-col items-center justify-center p-8 bg-transparent">
                <div className="flex flex-col items-center relative">
                    <div className="absolute -top-10 left-1/2 -translate-x-1/2 text-[10rem] font-serif opacity-5 select-none pointer-events-none" style={{ color: textColor }}>&</div>
                    <span className="text-xl font-serif italic tracking-widest mb-4 opacity-70" style={{ color: textColor }}>{dayNameUpper}</span>
                    <div className="flex items-baseline gap-4 border-y border-white/20 py-6 px-12" style={{ color: textColor }}>
                        <span className="text-8xl font-serif">{hours}</span>
                        <span className="text-4xl font-serif italic opacity-50">.</span>
                        <span className="text-8xl font-serif">{minutes}</span>
                    </div>
                    {showDate && (
                        <span className="text-xs font-black uppercase tracking-[0.4em] mt-6 opacity-40">{dateNum} . {monthUpper}</span>
                    )}
                </div>
            </div>
        );
    }

    // Minimal (Default)
    return (
        <div className="w-full h-full flex flex-col items-center justify-center p-4 bg-transparent">
            <div className="flex flex-col items-center text-center">
                <span className="text-8xl font-black tracking-tighter leading-none" style={{ color: textColor }}>
                    {hours}:{minutes}
                    {showSeconds && <span className="text-4xl opacity-50">:{seconds}</span>}
                </span>
                {showDate && (
                    <span className="text-lg font-bold uppercase tracking-[0.2em] mt-2 opacity-60" style={{ color: textColor }}>
                        {dayNameUpper} {dateNum}
                    </span>
                )}
            </div>
        </div>
    );
};

export default DateTimeWidget;
