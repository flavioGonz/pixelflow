'use client';

import React from 'react';
import { motion, TargetAndTransition } from 'framer-motion';
import { ArrowLeft, Home, ChevronRight, Zap, Play, Info } from 'lucide-react';
import { usePlayerStore } from '@/store/usePlayerStore';
import { io } from 'socket.io-client';

type ButtonTemplate = 'GLASS' | 'NEON' | 'MINIMAL' | '3D' | 'GRADIENT' | 'CIRCULAR';

interface NavButtonWidgetProps {
    data: {
        label: string;
        type: 'BACK' | 'HOME' | 'LINK';
        targetLayoutId?: string;
        icon?: string;
        color?: string;
        template?: ButtonTemplate;
    };
}

const iconMap: Record<string, any> = {
    ArrowLeft, Home, ChevronRight, Zap, Play, Info
};

const NavButtonWidget: React.FC<NavButtonWidgetProps> = ({ data }) => {
    const { popFromHistory, screenId } = usePlayerStore();
    const Icon = iconMap[data.icon || 'ArrowLeft'] || ArrowLeft;
    const template = data.template || 'GLASS';
    const accentColor = data.color || '#3b82f6';

    const handleAction = () => {
        const socket = io();
        if (data.type === 'BACK') {
            const prevId = popFromHistory();
            if (prevId && screenId) {
                socket.emit('request_layout', { screenId, layoutId: prevId });
            }
        } else if (data.type === 'HOME' || data.type === 'LINK') {
            if (data.targetLayoutId && screenId) {
                socket.emit('request_layout', { screenId, layoutId: data.targetLayoutId });
            }
        }
    };

    // Fast and snappy interactions
    const tapAnimation: TargetAndTransition = {
        scale: 0.9,
        transition: { type: 'spring', stiffness: 600, damping: 20 }
    };

    const renderButton = () => {
        switch (template) {
            case 'CIRCULAR':
                return (
                    <div className="flex flex-col items-center justify-center gap-3 w-full h-full">
                        <motion.button
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            whileHover={{ scale: 1.15, rotate: -5 }}
                            whileTap={tapAnimation}
                            onClick={handleAction}
                            className="relative w-14 h-14 md:w-24 md:h-24 rounded-full flex items-center justify-center transition-all group z-10"
                            style={{
                                backgroundColor: accentColor,
                                boxShadow: `0 15px 35px ${accentColor}66`
                            }}
                        >
                            {/* Inner Pulsing Ring */}
                            <motion.div
                                animate={{ scale: [1, 1.4, 1], opacity: [0.3, 0, 0.3] }}
                                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                                className="absolute inset-0 rounded-full border-2"
                                style={{ borderColor: accentColor }}
                            />

                            {/* Secondary Outer Ring */}
                            <motion.div
                                animate={{ scale: [1.2, 1.6, 1.2], opacity: [0.1, 0, 0.1] }}
                                transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
                                className="absolute inset-0 rounded-full border border-white/30"
                            />

                            <Icon className="w-6 h-6 md:w-10 md:h-10 text-black drop-shadow-md transition-transform group-hover:-translate-x-1" />
                        </motion.button>

                        {data.label && (
                            <motion.span
                                initial={{ y: 5, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                className="text-[9px] md:text-[11px] font-black uppercase tracking-[0.4em] italic text-white/50 group-hover:text-white"
                            >
                                {data.label}
                            </motion.span>
                        )}
                    </div>
                );

            case 'NEON':
                return (
                    <motion.button
                        whileHover={{ scale: 1.03, boxShadow: `0 0 25px ${accentColor}44` }}
                        whileTap={tapAnimation}
                        onClick={handleAction}
                        className="w-full h-full rounded-lg border-2 flex items-center justify-center gap-3 px-6 transition-all relative overflow-hidden group font-sans"
                        style={{
                            borderColor: accentColor,
                            backgroundColor: `${accentColor}11`,
                            boxShadow: `0 0 10px ${accentColor}22`
                        }}
                    >
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite] pointer-events-none" />
                        <Icon className="w-5 h-5 drop-shadow-[0_0_8px_currentColor]" style={{ color: accentColor }} />
                        <span className="text-xs font-black uppercase tracking-[0.2em] italic text-white drop-shadow-md">
                            {data.label || 'BOTÓN'}
                        </span>
                    </motion.button>
                );

            case 'MINIMAL':
                return (
                    <motion.button
                        whileHover={{ opacity: 0.7, x: 5 }}
                        whileTap={tapAnimation}
                        onClick={handleAction}
                        className="w-full h-full flex items-center justify-between gap-4 px-2 border-b border-white/10 transition-all font-sans"
                    >
                        <span className="text-[11px] font-black uppercase tracking-[0.3em] text-white/50 group-hover:text-white">
                            {data.label || 'BOTÓN'}
                        </span>
                        <Icon className="w-4 h-4 text-white/20 group-hover:text-white" />
                    </motion.button>
                );

            case '3D':
                return (
                    <motion.button
                        whileHover={{ y: -2 }}
                        whileTap={{ y: 2, scale: 0.98 }}
                        onClick={handleAction}
                        className="w-full h-full rounded-xl border-2 border-b-8 flex items-center justify-center gap-3 active:border-b-2 transition-all font-sans"
                        style={{
                            backgroundColor: accentColor,
                            borderColor: `${accentColor}cc`,
                            color: '#fff'
                        }}
                    >
                        <Icon className="w-5 h-5 text-white" />
                        <span className="text-sm font-black uppercase tracking-tight italic">
                            {data.label || 'BOTÓN'}
                        </span>
                    </motion.button>
                );

            case 'GRADIENT':
                return (
                    <motion.button
                        whileHover={{ scale: 1.05, filter: 'brightness(1.1)' }}
                        whileTap={tapAnimation}
                        onClick={handleAction}
                        className="w-full h-full rounded-2xl flex items-center justify-center gap-3 px-6 shadow-2xl transition-all font-sans"
                        style={{
                            background: `linear-gradient(135deg, ${accentColor}, #000)`,
                        }}
                    >
                        <div className="p-2 rounded-full bg-white/20 backdrop-blur-md">
                            <Icon className="w-4 h-4 text-white" />
                        </div>
                        <span className="text-xs font-black uppercase tracking-widest text-white italic">
                            {data.label || 'BOTÓN'}
                        </span>
                    </motion.button>
                );

            case 'GLASS':
            default:
                return (
                    <motion.button
                        whileHover={{ backgroundColor: 'rgba(255,255,255,0.1)', scale: 1.02 }}
                        whileTap={tapAnimation}
                        onClick={handleAction}
                        className="w-full h-full rounded-xl border border-white/10 backdrop-blur-md flex items-center justify-center gap-3 px-6 transition-all group font-sans"
                        style={{ backgroundColor: 'rgba(255,255,255,0.05)' }}
                    >
                        <Icon
                            className="w-5 h-5 transition-transform group-hover:-translate-x-1"
                            style={{ color: accentColor }}
                        />
                        <span className="text-[10px] md:text-sm font-black uppercase tracking-widest text-white italic drop-shadow-lg">
                            {data.label || 'BOTÓN'}
                        </span>
                    </motion.button>
                );
        }
    };

    return (
        <div className="w-full h-full bg-transparent overflow-hidden">
            <style jsx>{`
                @keyframes shimmer {
                    from { transform: translateX(-100%); }
                    to { transform: translateX(100%); }
                }
            `}</style>
            {renderButton()}
        </div>
    );
};

export default NavButtonWidget;
