'use client';

import { useEffect, useRef, useCallback, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import { io, Socket } from 'socket.io-client';
import { usePlayerStore, LayoutJSON } from '@/store/usePlayerStore';
import { useScreenOrientation } from '@/hooks/useScreenOrientation';
import { useWindowSize } from '@/hooks/useWindowSize';
import { motion, AnimatePresence } from 'framer-motion';
import { useEdgeSwipeBack } from '@/hooks/useEdgeSwipeBack';
import WidgetRenderer from '@/components/shared/WidgetRenderer';

// Layout-level transitions when changing interface. Chosen via layout.transition or master's transition.
const TRANSITION_VARIANTS: Record<string, { initial: any; animate: any; exit: any }> = {
    fade:      { initial: { opacity: 0 },                              animate: { opacity: 1 },              exit: { opacity: 0 } },
    slideUp:   { initial: { opacity: 0, y: 40 },                       animate: { opacity: 1, y: 0 },        exit: { opacity: 0, y: -40 } },
    slideDown: { initial: { opacity: 0, y: -40 },                      animate: { opacity: 1, y: 0 },        exit: { opacity: 0, y: 40 } },
    slideLeft: { initial: { opacity: 0, x: 40 },                       animate: { opacity: 1, x: 0 },        exit: { opacity: 0, x: -40 } },
    slideRight:{ initial: { opacity: 0, x: -40 },                      animate: { opacity: 1, x: 0 },        exit: { opacity: 0, x: 40 } },
    zoom:      { initial: { opacity: 0, scale: 0.85 },                 animate: { opacity: 1, scale: 1 },    exit: { opacity: 0, scale: 1.1 } },
    zoomOut:   { initial: { opacity: 0, scale: 1.2 },                  animate: { opacity: 1, scale: 1 },    exit: { opacity: 0, scale: 0.85 } },
    flip:      { initial: { opacity: 0, rotateY: 90 },                 animate: { opacity: 1, rotateY: 0 },  exit: { opacity: 0, rotateY: -90 } },
    blur:      { initial: { opacity: 0, filter: 'blur(20px)' },        animate: { opacity: 1, filter: 'blur(0px)' }, exit: { opacity: 0, filter: 'blur(20px)' } },
    dramatic:  { initial: { opacity: 0, y: 30, scale: 0.9, filter: 'blur(10px)' }, animate: { opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }, exit: { opacity: 0, scale: 1.1, filter: 'blur(20px)' } },
};
function getTransition(layout: any) {
    const key = layout?.transition || 'dramatic';
    return TRANSITION_VARIANTS[key] || TRANSITION_VARIANTS.dramatic;
}

const DEFAULT_IDLE_MS = 20000;
// Actual idle window updated from server 'screen_config' event
import { ArrowLeft, Monitor } from 'lucide-react';
import Link from 'next/link';

let socket: Socket;

const Patterns = {
    dots: "radial-gradient(circle, currentColor 1px, transparent 1px)",
    grid: "linear-gradient(to right, currentColor 1px, transparent 1px), linear-gradient(to bottom, currentColor 1px, transparent 1px)",
    waves: "radial-gradient(circle at 100% 150%, transparent 24%, currentColor 25%, currentColor 28%, transparent 29%, transparent 36%, currentColor 36%, currentColor 40%, transparent 41%, transparent)",
    noise: "url('https://grainy-gradients.vercel.app/noise.svg')",
};


// Fullscreen media overlay shown during screensaver rotation (image/video).
function ScreensaverMediaOverlay() {
    const [item, setItem] = useState<{type:'image'|'video';url:string}|null>(null);
    useEffect(() => {
        const handler = (ev: any) => setItem(ev?.detail || null);
        window.addEventListener('pf-screensaver-media', handler as any);
        return () => window.removeEventListener('pf-screensaver-media', handler as any);
    }, []);
    if (!item) return null;
    return (
        <div className="fixed inset-0 z-[9999] bg-black">
            {item.type === 'video' ? (
                <video src={item.url} className="w-full h-full object-contain" autoPlay muted loop playsInline />
            ) : (
                <img src={item.url} className="w-full h-full object-contain" alt="" />
            )}
        </div>
    );
}

export default function PlayerPage() {
    const { id } = useParams();
    const orientation = useScreenOrientation();
    const { width, height } = useWindowSize();
    const { layout, setLayout, setConnected, isConnected, setScreenId, isAuthorized, setAuthorized, pushToHistory, navDirection, setNavDirection } = usePlayerStore();

    // iOS-style edge swipe from left → BACK (goes to previous layout in history)
    useEdgeSwipeBack({
        enabled: true,
        onBack: () => {
            if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('pf-nav', { detail: { action: 'BACK' } }));
        },
    });

    // Kiosko mode: request fullscreen on first user gesture, prevent context menu,
    // prevent double-tap zoom, prevent selection. Applied always in /player.
    useEffect(() => {
        if (typeof window === 'undefined') return;
        const requestFullscreen = () => {
            try {
                const el = document.documentElement as any;
                if (!document.fullscreenElement) {
                    (el.requestFullscreen || el.webkitRequestFullscreen || el.mozRequestFullScreen || el.msRequestFullscreen)?.call(el);
                }
            } catch { /* ignore */ }
        };
        const onFirstGesture = () => {
            requestFullscreen();
            window.removeEventListener('pointerdown', onFirstGesture);
            window.removeEventListener('keydown', onFirstGesture);
        };
        window.addEventListener('pointerdown', onFirstGesture, { once: false, passive: true });
        window.addEventListener('keydown', onFirstGesture, { once: false });

        // Prevent context menu (long-press on mobile, right-click on desktop kiosks)
        const noContext = (e: Event) => { e.preventDefault(); };
        window.addEventListener('contextmenu', noContext);

        // Prevent iOS Safari pinch-zoom / double-tap zoom via passive:false gesturestart hack
        const noGesture = (e: Event) => { e.preventDefault(); };
        document.addEventListener('gesturestart', noGesture as any);
        document.addEventListener('gesturechange', noGesture as any);
        document.addEventListener('gestureend', noGesture as any);

        // Ensure viewport meta prevents zoom
        let meta = document.querySelector('meta[name="viewport"]') as HTMLMetaElement | null;
        if (!meta) {
            meta = document.createElement('meta');
            meta.name = 'viewport';
            document.head.appendChild(meta);
        }
        const prevViewport = meta.content;
        meta.content = 'width=device-width, initial-scale=1, maximum-scale=1, minimum-scale=1, user-scalable=no, viewport-fit=cover';

        // Apple standalone / theme color meta
        const addMeta = (name: string, content: string) => {
            let m = document.querySelector(`meta[name="${name}"]`) as HTMLMetaElement | null;
            if (!m) { m = document.createElement('meta'); m.name = name; document.head.appendChild(m); }
            m.content = content;
            return m;
        };
        addMeta('apple-mobile-web-app-capable', 'yes');
        addMeta('mobile-web-app-capable', 'yes');
        addMeta('apple-mobile-web-app-status-bar-style', 'black-translucent');

        return () => {
            window.removeEventListener('pointerdown', onFirstGesture);
            window.removeEventListener('keydown', onFirstGesture);
            window.removeEventListener('contextmenu', noContext);
            document.removeEventListener('gesturestart', noGesture as any);
            document.removeEventListener('gesturechange', noGesture as any);
            document.removeEventListener('gestureend', noGesture as any);
            if (meta) meta.content = prevViewport;
        };
    }, []);

        const _defaultLayoutIdRef = useRef<string | null>(null);
    const _idleMsRef = useRef<number>(DEFAULT_IDLE_MS);
    const _idleTimerRef = useRef<any>(null);
    // Screensaver state
    const _screensaverEnabledRef = useRef<boolean>(false);
    const _screensaverRotateMsRef = useRef<number>(10000);
    const _screensaverLayoutsRef = useRef<string[]>([]);
    const _screensaverMediaItemsRef = useRef<{type:'image'|'video';url:string;durationMs?:number}[]>([]);
    const _screensaverLayoutDurationsRef = useRef<Record<string, number>>({});
    const _screensaverIdleMsRef = useRef<number>(30000);
    const _screensaverActiveRef = useRef<boolean>(false);
    const _screensaverIndexRef = useRef<number>(0);
    const _screensaverRotateTimerRef = useRef<any>(null);
    const _preScreensaverLayoutRef = useRef<string | null>(null);

    // Exit screensaver mode: stop rotation + return to the layout the user was on + clear media overlay
    const exitScreensaver = useCallback(() => {
        if (!_screensaverActiveRef.current) return;
        _screensaverActiveRef.current = false;
        if (_screensaverRotateTimerRef.current) { clearTimeout(_screensaverRotateTimerRef.current); clearInterval(_screensaverRotateTimerRef.current); _screensaverRotateTimerRef.current = null; }
        window.dispatchEvent(new CustomEvent('pf-screensaver-media', { detail: null }));
        const restore = _preScreensaverLayoutRef.current || _defaultLayoutIdRef.current;
        if (restore && socket && socket.connected && id) {
            socket.emit('request_layout', { screenId: id, layoutId: restore });
        }
        _preScreensaverLayoutRef.current = null;
    }, [id]);

    // Enter screensaver: memorize current layout + start rotating between screensaver items (layouts + media)
    const enterScreensaver = useCallback(() => {
        const layoutIds = _screensaverLayoutsRef.current || [];
        const media = _screensaverMediaItemsRef.current || [];
        const durations = _screensaverLayoutDurationsRef.current || {};
        const totalItems = layoutIds.length + media.length;
        if (totalItems === 0) return;
        const currentId = layout?._id || (layout as any)?.id;
        if (currentId && !layoutIds.includes(currentId)) {
            _preScreensaverLayoutRef.current = currentId;
        }
        _screensaverActiveRef.current = true;
        _screensaverIndexRef.current = 0;
        const globalRotate = Math.max(3000, _screensaverRotateMsRef.current);
        const showNext = () => {
            const idx = _screensaverIndexRef.current % totalItems;
            _screensaverIndexRef.current = idx + 1;
            let itemDurationMs = globalRotate;
            if (idx < layoutIds.length) {
                const layoutId = layoutIds[idx];
                if (socket && socket.connected && id) socket.emit('request_layout', { screenId: id, layoutId });
                window.dispatchEvent(new CustomEvent('pf-screensaver-media', { detail: null }));
                const per = durations[layoutId];
                if (typeof per === 'number' && per >= 2000) itemDurationMs = per;
            } else {
                const m = media[idx - layoutIds.length];
                window.dispatchEvent(new CustomEvent('pf-screensaver-media', { detail: m }));
                if (m && typeof m.durationMs === 'number' && m.durationMs >= 2000) itemDurationMs = m.durationMs;
            }
            // Schedule the next slide using this item's duration.
            if (_screensaverActiveRef.current) {
                _screensaverRotateTimerRef.current = setTimeout(showNext, itemDurationMs);
            }
        };
        showNext();
    }, [id, layout]);

    // Auto-return to default layout on N s of inactivity; if screensaver enabled, enter screensaver instead
    const resetIdleTimer = useCallback(() => {
        if (_idleTimerRef.current) clearTimeout(_idleTimerRef.current);
        // ANY user gesture also cancels an active screensaver.
        if (_screensaverActiveRef.current) exitScreensaver();
        const currentLayoutId = layout?._id || (layout as any)?.id;
        const defaultId = _defaultLayoutIdRef.current;
        _idleTimerRef.current = setTimeout(() => {
            // If screensaver is enabled and we have screensaver layouts → enter screensaver
            if (_screensaverEnabledRef.current && _screensaverLayoutsRef.current.length > 0) {
                enterScreensaver();
                return;
            }
            // Fallback: return to default layout if we're on a different one
            if (defaultId && currentLayoutId && currentLayoutId !== defaultId) {
                if (socket && socket.connected && id) {
                    socket.emit('request_layout', { screenId: id, layoutId: defaultId });
                }
            }
        }, _idleMsRef.current);
    }, [layout, id, enterScreensaver, exitScreensaver]);

    useEffect(() => {
        // Track any interaction to reset the idle timer
        const events: (keyof WindowEventMap)[] = ['pointerdown', 'touchstart', 'keydown'];
        const handler = () => resetIdleTimer();
        events.forEach((e) => window.addEventListener(e, handler, { passive: true }));
        resetIdleTimer();
        return () => {
            events.forEach((e) => window.removeEventListener(e, handler));
            if (_idleTimerRef.current) clearTimeout(_idleTimerRef.current);
            if (_screensaverRotateTimerRef.current) clearInterval(_screensaverRotateTimerRef.current);
        };
    }, [resetIdleTimer]);


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
            const vw = typeof window !== 'undefined' ? window.innerWidth : 0;
            const vh = typeof window !== 'undefined' ? window.innerHeight : 0;
            socket.emit('register_screen', {
                screenId: id,
                viewport: { width: vw, height: vh, orientation: vh > vw ? 'portrait' : 'landscape' },
                userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
            });
        });

        // Heartbeat every 10s so the server keeps the screen marked as online
        const heartbeatId = setInterval(() => {
            if (socket && socket.connected) {
                socket.emit('heartbeat');
            }
        }, 10000);

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
                // Capture the FIRST layout as the default. It's the layout the server pushes on
                // register_screen (screen's lastLayoutId). Subsequent nav_button/category_nav
                // interactions do NOT overwrite this — we'll auto-return here after idle.
                if (!_defaultLayoutIdRef.current) {
                    _defaultLayoutIdRef.current = newLayout._id;
                }
            }
            // Save to cache for offline use
            localStorage.setItem(`pixelflow_cache_${id}`, JSON.stringify(newLayout));
            setAuthorized(true);
        });

        socket.on('unauthorized', () => {
            setAuthorized(false);
            setLayout(null as any);
        });

        socket.on('screen_config', (cfg: any) => {
            if (cfg && typeof cfg.idleTimeoutMs === 'number' && cfg.idleTimeoutMs > 0) {
                _idleMsRef.current = cfg.idleTimeoutMs;
            }
            if (cfg) {
                _screensaverEnabledRef.current = !!cfg.screensaverEnabled;
                if (typeof cfg.screensaverRotateMs === 'number' && cfg.screensaverRotateMs > 2000) {
                    _screensaverRotateMsRef.current = cfg.screensaverRotateMs;
                }
            }
        });

        // Global screensaver config (broadcast by server on connect + on change)
        socket.on('screensaver_config', (cfg: any) => {
            if (!cfg) return;
            _screensaverEnabledRef.current = !!cfg.enabled;
            if (typeof cfg.idleMs === 'number' && cfg.idleMs >= 5000) {
                _screensaverIdleMsRef.current = cfg.idleMs;
                // The global idleMs overrides per-screen idleTimeoutMs when screensaver is enabled
                if (cfg.enabled) _idleMsRef.current = cfg.idleMs;
            }
            if (typeof cfg.rotateMs === 'number' && cfg.rotateMs >= 3000) {
                _screensaverRotateMsRef.current = cfg.rotateMs;
            }
            _screensaverLayoutsRef.current = Array.isArray(cfg.layoutIds) ? cfg.layoutIds : [];
            _screensaverMediaItemsRef.current = Array.isArray(cfg.mediaItems) ? cfg.mediaItems : [];
            _screensaverLayoutDurationsRef.current = (cfg.layoutDurationsMs && typeof cfg.layoutDurationsMs === 'object') ? cfg.layoutDurationsMs : {};
        });

        socket.on('refresh_layout', () => {
            window.location.reload();
        });

        // Cross-widget navigation (TEXT, SLIDER, buttons) → dispatch pf-nav → we handle here
        const onNav = (ev: any) => {
            const detail = ev?.detail || {};
            const action = detail.action;
            if (action === 'GO_TO' && detail.targetLayoutId) {
                setNavDirection('push');
                socket?.emit('request_layout', { screenId: id, layoutId: detail.targetLayoutId });
            } else if (action === 'HOME' && _defaultLayoutIdRef.current) {
                setNavDirection('pop');
                socket?.emit('request_layout', { screenId: id, layoutId: _defaultLayoutIdRef.current });
            } else if (action === 'BACK') {
                setNavDirection('pop');
                socket?.emit('request_previous_layout', { screenId: id });
            } else if (action === 'RELOAD') {
                if (typeof window !== 'undefined') window.location.reload();
            }
        };
        if (typeof window !== 'undefined') window.addEventListener('pf-nav', onNav);

        return () => {
            if (typeof window !== 'undefined') window.removeEventListener('pf-nav', onNav);
            clearInterval(heartbeatId);
            if (socket) {
                socket.disconnect();
            }
        };
    }, [id, setConnected, setLayout, setScreenId, setAuthorized, pushToHistory, setNavDirection]);

    // Report viewport changes (resize, orientation change) to the server
    useEffect(() => {
        if (!id) return;
        const report = () => {
            if (!socket || !socket.connected) return;
            const vw = window.innerWidth;
            const vh = window.innerHeight;
            socket.emit('register_screen', {
                screenId: id,
                viewport: { width: vw, height: vh, orientation: vh > vw ? 'portrait' : 'landscape' },
            });
        };
        const onResize = () => { report(); };
        window.addEventListener('resize', onResize);
        window.addEventListener('orientationchange', onResize);
        return () => {
            window.removeEventListener('resize', onResize);
            window.removeEventListener('orientationchange', onResize);
        };
    }, [id]);

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
        <main
            className={`relative w-full h-screen overflow-hidden bg-transparent text-white ${orientation}`}
            style={{
                userSelect: 'none',
                WebkitUserSelect: 'none',
                touchAction: 'manipulation',
                WebkitTapHighlightColor: 'transparent',
                WebkitTouchCallout: 'none',
            } as React.CSSProperties}
        >
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
                        initial={{ x: navDirection === 'pop' ? '-30%' : '100%', opacity: navDirection === 'pop' ? 0.6 : 1 }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ x: navDirection === 'pop' ? '100%' : '-30%', opacity: navDirection === 'pop' ? 1 : 0.6 }}
                        transition={{
                            duration: 0.24,
                            ease: [0.32, 0.72, 0, 1]
                        }}
                        className="absolute inset-0 w-full h-full"
                        style={{
                            backgroundColor: layout.backgroundColor || 'transparent',
                        }}
                    >
                        {/* iOS-style transition: no cinematic flash */}

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
                                transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                                className="relative pointer-events-auto flex-shrink-0"
                                style={{
                                    transformOrigin: 'center center',
                                }}
                            >
                                {layout.widgets.filter(w => !(w.data as any)?.persistent).map((widget) => (
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
                                                initial={getTransition(layout).initial}
                                                animate={{ ...getTransition(layout).animate, ...(widget.blur ? { filter: `blur(${widget.blur}px)` } : {}) }}
                                                exit={getTransition(layout).exit}
                                                transition={{
                                                    duration: (layout as any).transitionDuration ?? 0.7,
                                                    ease: [0.16, 1, 0.3, 1],
                                                    delay: 0.05 + (layout.widgets.indexOf(widget) * 0.04)
                                                }}
                                                className="w-full h-full"
                                            >
                                                <WidgetRenderer widget={widget} />
                                            </motion.div>
                                        </AnimatePresence>
                                    </div>
                                ))}
                            </motion.div>

                            <PersistentLayer layout={layout} />
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
                        key="not-authorized"
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 1.1, filter: 'blur(30px)' }}
                        transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                        className="relative flex flex-col items-center justify-center w-full h-full bg-gradient-to-br from-neutral-950 via-neutral-900 to-neutral-950 overflow-hidden"
                    >
                        {/* Subtle animated background */}
                        <div className="absolute inset-0 opacity-[0.04] pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 20% 30%, #3b82f6, transparent 40%), radial-gradient(circle at 80% 70%, #8b5cf6, transparent 40%)' }} />
                        <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 60, repeat: Infinity, ease: 'linear' }}
                            className="absolute inset-[-20%] opacity-[0.06] pointer-events-none"
                            style={{ backgroundImage: 'conic-gradient(from 0deg, transparent 60%, #ffffff33 70%, transparent 80%)' }}
                        />

                        {/* Logo */}
                        <motion.div
                            animate={{ scale: [1, 1.04, 1], opacity: [0.7, 1, 0.7] }}
                            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                            className="mb-10 relative z-10"
                        >
                            <img src="/logo-altos-blanco.png" alt="Logo" className="w-48 md:w-64 h-auto" onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} />
                        </motion.div>

                        {/* Content */}
                        <div className="relative z-10 flex flex-col items-center text-center px-6 max-w-xl">
                            {isAuthorized ? (
                                <>
                                    <div className="w-12 h-12 border-2 border-white/20 border-t-white rounded-full animate-spin mb-5" />
                                    <h1 className="text-white text-xl md:text-2xl font-black uppercase tracking-[0.3em] mb-2">Preparando el diseño</h1>
                                    <p className="text-white/50 text-sm">Esperando contenido del servidor…</p>
                                </>
                            ) : (
                                <>
                                    <motion.div
                                        initial={{ scale: 0.8, opacity: 0 }}
                                        animate={{ scale: 1, opacity: 1 }}
                                        transition={{ delay: 0.2, duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                                        className="size-20 rounded-full grid place-items-center mb-6 border-2 border-amber-500/40 bg-amber-500/10 backdrop-blur-sm"
                                    >
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-9 h-9 text-amber-400"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                                    </motion.div>
                                    <h1 className="text-white text-2xl md:text-3xl font-black uppercase tracking-[0.25em] mb-3">Pantalla sin autorizar</h1>
                                    <p className="text-white/60 text-sm md:text-base mb-6 leading-relaxed">
                                        Este dispositivo aún no fue registrado. Un administrador debe aprobarlo desde el panel de <b>Pantallas</b>.
                                    </p>

                                    {/* Screen ID pill — big and readable */}
                                    <div className="flex flex-col items-center gap-2 mb-6">
                                        <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-white/40">ID de pantalla</span>
                                        <div className="px-6 py-3 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm shadow-2xl">
                                            <code className="font-mono text-lg md:text-xl font-bold text-white tracking-wide select-all">{id}</code>
                                        </div>
                                    </div>

                                    {/* Device metadata */}
                                    <div className="grid grid-cols-2 gap-3 text-[11px] text-white/40 mt-4">
                                        {typeof window !== 'undefined' && (
                                            <>
                                                <div className="px-3 py-2 rounded-md bg-white/[0.02] border border-white/5">
                                                    <div className="text-[9px] uppercase tracking-widest text-white/30">Resolucion</div>
                                                    <div className="font-mono text-white/80 mt-0.5">{window.innerWidth}x{window.innerHeight}</div>
                                                </div>
                                                <div className="px-3 py-2 rounded-md bg-white/[0.02] border border-white/5">
                                                    <div className="text-[9px] uppercase tracking-widest text-white/30">Estado</div>
                                                    <div className="font-mono text-white/80 mt-0.5 flex items-center gap-1.5">
                                                        <span className={"size-1.5 rounded-full " + (isConnected ? "bg-emerald-400 animate-pulse" : "bg-rose-400")} />
                                                        {isConnected ? 'Conectada' : 'Reconectando…'}
                                                    </div>
                                                </div>
                                            </>
                                        )}
                                    </div>

                                    {/* Poll indicator */}
                                    <div className="mt-8 flex items-center gap-2 text-[11px] text-white/30">
                                        <div className="w-3 h-3 border border-white/30 border-t-white/70 rounded-full animate-spin" />
                                        <span className="uppercase tracking-widest">Esperando autorización</span>
                                    </div>
                                </>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </main >
    );
}


// PersistentLayer — keeps `persistent: true` widgets mounted across layout changes.
// Uses a module-scope Map to preserve widget instances by id across router updates.
const persistentInstances = new Map<string, any>();

function PersistentLayer({ layout }: { layout: any }) {
    const persistentWidgets = useMemo(
        () => (layout?.widgets || []).filter((w: any) => (w.data as any)?.persistent),
        [layout]
    );

    // Track which widget ids are currently in the layout
    const idsRef = useRef<Set<string>>(new Set());
    useEffect(() => {
        const currentIds: Set<string> = new Set(persistentWidgets.map((w: any) => String(w.id)));
        idsRef.current = currentIds;
        // Sync map: remove instances that are no longer in the current layout
        for (const id of Array.from(persistentInstances.keys())) {
            if (!currentIds.has(id)) persistentInstances.delete(id);
        }
        for (const w of persistentWidgets) {
            if (!persistentInstances.has(w.id)) persistentInstances.set(w.id, w);
        }
    }, [persistentWidgets]);

    if (persistentWidgets.length === 0) return null;

    return (
        <>
            {persistentWidgets.map((w: any) => {
                const pos = (w.data as any)?.floatPosition || 'bottom-right';
                const compact = (w.data as any)?.compact !== false;
                const [px, py] = pos.split('-'); // top|bottom + left|right
                const style: React.CSSProperties = {
                    position: 'fixed',
                    zIndex: 9999,
                    pointerEvents: 'auto',
                    ...(px === 'top' ? { top: 16 } : { bottom: 16 }),
                    ...(py === 'left' ? { left: 16 } : { right: 16 }),
                    width: compact ? 320 : 480,
                    height: compact ? 88 : 200,
                    borderRadius: 16,
                    overflow: 'hidden',
                    boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
                };
                return (
                    // Key uses only widget.id (not layout id) so the widget does NOT remount on layout change.
                    <div key={'persist-' + w.id} style={style}>
                        <WidgetRenderer widget={w} />
                    </div>
                );
            })}
        </>
    );
}
