'use client';

import { useEffect } from 'react';
import { useParams } from 'next/navigation';
import { io, Socket } from 'socket.io-client';
import { usePlayerStore, LayoutJSON } from '@/store/usePlayerStore';
import { useScreenOrientation } from '@/hooks/useScreenOrientation';
import { useWindowSize } from '@/hooks/useWindowSize';
import { motion, AnimatePresence } from 'framer-motion';
import WidgetRenderer from '@/components/shared/WidgetRenderer';
import { ArrowLeft, Monitor } from 'lucide-react';
import Link from 'next/link';

let socket: Socket;

const Patterns = {
    dots: "radial-gradient(circle, currentColor 1px, transparent 1px)",
    grid: "linear-gradient(to right, currentColor 1px, transparent 1px), linear-gradient(to bottom, currentColor 1px, transparent 1px)",
    waves: "radial-gradient(circle at 100% 150%, transparent 24%, currentColor 25%, currentColor 28%, transparent 29%, transparent 36%, currentColor 36%, currentColor 40%, transparent 41%, transparent)",
    noise: "url('https://grainy-gradients.vercel.app/noise.svg')",
};

export default function PlayerPage() {
    const { id } = useParams();
    const orientation = useScreenOrientation();
    const { width, height } = useWindowSize();
    const { layout, setLayout, setConnected, isConnected, setScreenId, isAuthorized, setAuthorized, pushToHistory } = usePlayerStore();

    // 1. Initial Cache Load Effect
    useEffect(() => {
        if (!id) return;
        const cached = localStorage.getItem(`pixelflow_cache_${id}`);
        if (cached) {
            try {
                const parsed = JSON.parse(cached);
                // Only set if we don't have a layout yet
                setLayout(parsed);
                setAuthorized(true);
            } catch (e) {
                console.error("Cache error", e);
            }
        }
    }, [id]); // Only runs on mount or when ID changes

    // 2. Socket Connection Effect
    useEffect(() => {
        if (!id) return;

        socket = io();

        socket.on('connect', () => {
            console.log('Socket Connected');
            setConnected(true);
            setScreenId(id as string);
            socket.emit('register_screen', { screenId: id });
        });

        socket.on('connect_error', (err) => {
            console.error('Socket Connection Error:', err);
            setConnected(false);
        });

        socket.on('disconnect', (reason) => {
            console.log('Socket Disconnected:', reason);
            setConnected(false);
        });

        socket.on('update_layout', (newLayout) => {
            setLayout(newLayout);
            if (newLayout?._id) {
                pushToHistory(newLayout._id);
            }
            // Save to cache for offline use
            localStorage.setItem(`pixelflow_cache_${id}`, JSON.stringify(newLayout));
            setAuthorized(true);
        });

        socket.on('unauthorized', () => {
            setAuthorized(false);
            setLayout(null as any);
        });

        socket.on('refresh_layout', () => {
            window.location.reload();
        });

        return () => {
            if (socket) {
                socket.disconnect();
            }
        };
    }, [id, setConnected, setLayout, setScreenId, setAuthorized, pushToHistory]);

    const getYoutubeId = (url: string) => {
        if (!url) return null;
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
        const match = url.match(regExp);
        return (match && match[2].length === 11) ? match[2] : null;
    };

    const youtubeId = layout?.backgroundVideo ? getYoutubeId(layout.backgroundVideo) : null;

    // Calculate dynamic scaling
    const isPortrait = height > width;
    const layoutOrientation = layout?.orientation || 'landscape';

    // If screen is opposite of layout, we fit to width but allow some flexibility
    const baseW = layoutOrientation === 'portrait' ? 1080 : 1920;
    const baseH = layoutOrientation === 'portrait' ? 1920 : 1080;

    // We scale to fit the most restrictive dimension, but we center it properly
    const scale = Math.min(width / baseW, height / baseH);

    return (
        <main className={`relative w-full h-screen overflow-hidden bg-transparent text-white ${orientation}`}>
            {/* Minimalist Connection Indicator */}
            <div className="fixed top-6 right-6 z-[500] pointer-events-none">
                <div className="relative">
                    <motion.div
                        animate={{
                            scale: isConnected ? [1, 1.3, 1] : 1,
                            opacity: isConnected ? [1, 0.7, 1] : 1
                        }}
                        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                        className={`w-2 h-2 rounded-full ${isConnected ? 'bg-amber-500/80 shadow-[0_0_8px_rgba(245,158,11,0.4)]' : 'bg-red-500/80 shadow-[0_0_8px_rgba(239,68,68,0.4)]'}`}
                    />
                    {isConnected && (
                        <motion.div
                            animate={{ scale: [1, 2.5], opacity: [0.3, 0] }}
                            transition={{ duration: 2, repeat: Infinity, ease: "easeOut" }}
                            className="absolute inset-0 bg-amber-500 rounded-full"
                        />
                    )}
                </div>
            </div>

            {!isConnected && !layout && (
                <div className="absolute top-20 right-4 z-[200] flex items-center gap-2 px-3 py-1 bg-red-500/20 border border-red-500 rounded-full text-xs animate-pulse">
                    <div className="w-2 h-2 bg-red-500 rounded-full" />
                    Buscando Servidor...
                </div>
            )}

            <div className="fixed inset-0 pointer-events-none z-[100] opacity-[0.03] mix-blend-overlay bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />

            <AnimatePresence>
                {layout ? (
                    <motion.div
                        key={layout.id || layout._id}
                        initial={{ opacity: 0, scale: 1.05, filter: 'blur(20px)' }}
                        animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
                        exit={{ opacity: 0, scale: 0.95, filter: 'blur(20px)' }}
                        transition={{
                            duration: 0.7,
                            ease: [0.22, 1, 0.36, 1]
                        }}
                        className="absolute inset-0 w-full h-full"
                        style={{
                            backgroundColor: layout.backgroundColor || 'transparent',
                        }}
                    >
                        {/* Subtle Cinematic Flash */}
                        <motion.div
                            initial={{ opacity: 0.4 }}
                            animate={{ opacity: 0 }}
                            transition={{ duration: 0.5 }}
                            className="absolute inset-0 bg-white z-[300] pointer-events-none mix-blend-overlay"
                        />

                        {/* 1. Background Media Layer */}
                        <div className="absolute inset-0 z-0 overflow-hidden">
                            {youtubeId ? (
                                <div className="relative w-[300%] h-[300%] -top-[100%] -left-[100%] pointer-events-none">
                                    <iframe
                                        src={`https://www.youtube.com/embed/${youtubeId}?autoplay=1&mute=1&loop=1&playlist=${youtubeId}&controls=0&showinfo=0&rel=0&iv_load_policy=3&disablekb=1&modestbranding=1`}
                                        className="absolute inset-0 w-full h-full object-cover"
                                        allow="autoplay; encrypted-media"
                                        title="Background Video"
                                    />
                                </div>
                            ) : layout.backgroundVideo ? (
                                <video
                                    src={layout.backgroundVideo}
                                    className="absolute inset-0 w-full h-full object-cover"
                                    autoPlay
                                    muted
                                    loop
                                    playsInline
                                />
                            ) : layout.backgroundImage ? (
                                <motion.div
                                    initial={{ scale: 1.1 }}
                                    animate={{ scale: 1 }}
                                    transition={{ duration: 10, repeat: Infinity, repeatType: "mirror", ease: "linear" }}
                                    className="absolute inset-0 w-full h-full bg-cover bg-center"
                                    style={{ backgroundImage: `url(${layout.backgroundImage})` }}
                                />
                            ) : null}
                        </div>

                        {/* 2. Background Overlay Layer (Color Mask) */}
                        {layout.backgroundOverlayColor && (
                            <div
                                className="absolute inset-0 z-[1] transition-opacity duration-500"
                                style={{
                                    backgroundColor: layout.backgroundOverlayColor,
                                    opacity: layout.backgroundOverlayOpacity || 0.5
                                }}
                            />
                        )}

                        {/* 3. Animated Pattern Mask Layer */}
                        {layout.backgroundPattern && layout.backgroundPattern !== 'none' && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{
                                    opacity: layout.backgroundPatternOpacity || 0.2,
                                    scale: [1, 1.02, 1],
                                }}
                                transition={{
                                    opacity: { duration: 1 },
                                    scale: { duration: 20, repeat: Infinity, ease: "linear" }
                                }}
                                className="absolute inset-0 z-[2] pointer-events-none"
                                style={{
                                    backgroundImage: Patterns[layout.backgroundPattern as keyof typeof Patterns],
                                    backgroundSize: layout.backgroundPattern === 'noise' ? 'auto' : '40px 40px',
                                    color: layout.backgroundOverlayColor || '#fff',
                                    mixBlendMode: 'overlay'
                                }}
                            />
                        )}

                        {/* 4. Blur Layer */}
                        {layout.backgroundBlur ? (
                            <div
                                className="absolute inset-0 backdrop-blur-md pointer-events-none z-[5]"
                                style={{ backdropFilter: `blur(${layout.backgroundBlur}px)` }}
                            />
                        ) : null}

                        {/* 5. Widgets Layer - Scaled to fit while maintaining aspect ratio */}
                        <div className="absolute inset-0 z-10 flex items-center justify-center overflow-hidden pointer-events-none">
                            <motion.div
                                initial={false}
                                animate={{
                                    width: baseW,
                                    height: baseH,
                                    scale: scale
                                }}
                                transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                                className="relative pointer-events-auto flex-shrink-0"
                                style={{
                                    transformOrigin: 'center center',
                                }}
                            >
                                {layout.widgets.map((widget) => (
                                    <div
                                        key={widget.id}
                                        className="absolute overflow-hidden"
                                        style={{
                                            left: `${widget.x}%`,
                                            top: `${widget.y}%`,
                                            width: `${widget.w}%`,
                                            height: `${widget.h}%`,
                                            zIndex: widget.zIndex || 1,
                                        }}
                                    >
                                        <AnimatePresence mode="popLayout">
                                            <motion.div
                                                key={widget.id + (layout.id || layout._id)}
                                                initial={{ opacity: 0, y: 30, scale: 0.9, filter: 'blur(10px)' }}
                                                animate={{ opacity: 1, y: 0, scale: 1, filter: widget.blur ? `blur(${widget.blur}px)` : 'blur(0px)' }}
                                                exit={{ opacity: 0, scale: 1.1, filter: 'blur(20px)' }}
                                                transition={{
                                                    duration: 0.8,
                                                    ease: [0.16, 1, 0.3, 1],
                                                    delay: 0.1 + (layout.widgets.indexOf(widget) * 0.05)
                                                }}
                                                className="w-full h-full"
                                            >
                                                <WidgetRenderer widget={widget} />
                                            </motion.div>
                                        </AnimatePresence>
                                    </div>
                                ))}
                            </motion.div>
                        </div>

                        {/* Top Progress / Interaction Bar */}
                        <motion.div
                            initial={{ width: "0%" }}
                            animate={{ width: "100%" }}
                            transition={{ duration: 1.5, ease: "easeInOut" }}
                            className="absolute top-0 left-0 h-1 bg-amber-500/50 z-[400] shadow-[0_0_10px_rgba(245,158,11,0.5)]"
                        />
                    </motion.div>

                ) : (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex flex-col items-center justify-center w-full h-full bg-neutral-950"
                    >
                        <motion.div
                            animate={{
                                scale: [1, 1.05, 1],
                                opacity: [0.5, 1, 0.5]
                            }}
                            transition={{
                                duration: 3,
                                repeat: Infinity,
                                ease: "easeInOut"
                            }}
                            className="mb-8"
                        >
                            <img src="/logo-altos-blanco.png" alt="Logo" className="w-64 md:w-80 h-auto" />
                        </motion.div>

                        <div className="flex flex-col items-center gap-2">
                            <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin mb-2" />
                            {isAuthorized ? (
                                <p className="text-white/60 text-sm font-bold uppercase tracking-[0.3em]">Cargando...</p>
                            ) : (
                                <div className="text-center">
                                    <p className="text-red-500 text-sm font-bold uppercase tracking-[0.3em]">Acceso Restringido</p>
                                    <p className="text-white/40 text-[10px] uppercase mt-1">Esta pantalla no ha sido autorizada</p>
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </main >
    );
}
