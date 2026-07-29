'use client';

import React from 'react';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import { TouchPopover } from '@/components/touch';
import { Music, Play, Pause, Disc, Volume2 } from 'lucide-react';

interface MusicPlayerWidgetProps {
    data: {
        provider?: 'SPOTIFY_LIVE' | 'SPOTIFY' | 'VINYL' | 'MINIMAL';
        spotifyEmbedUrl?: string;
        compact?: boolean;
        showControls?: boolean;
        autoplay?: boolean;
        song?: string;
        artist?: string;
        cover?: string;
        accentColor?: string;
        theme?: 'card' | 'minimal' | 'hero';
        refreshMs?: number;
        persistent?: boolean;
        floatPosition?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
    };
}

function toSpotifyEmbed(input?: string): string | null {
    if (!input) return null;
    let u = input.trim();
    if (u.startsWith('spotify:')) {
        const parts = u.split(':');
        if (parts.length >= 3) return 'https://open.spotify.com/embed/' + parts[1] + '/' + parts[2] + '?utm_source=generator&theme=0';
    }
    if (u.includes('open.spotify.com/') && !u.includes('/embed/')) {
        u = u.replace('open.spotify.com/', 'open.spotify.com/embed/');
    }
    if (!u.includes('utm_source')) u += (u.includes('?') ? '&' : '?') + 'utm_source=generator&theme=0&autoplay=1';
    return u;
}

const MusicPlayerWidget: React.FC<MusicPlayerWidgetProps> = ({ data }) => {
    const accent = data.accentColor || '#1db954';
    const provider = data.provider || (data.spotifyEmbedUrl ? 'SPOTIFY' : 'VINYL');

    // Mode 1: SPOTIFY_LIVE — Now Playing de la cuenta conectada
    if (provider === 'SPOTIFY_LIVE') {
        return <SpotifyNowPlaying accent={accent} refreshMs={data.refreshMs || 5000} theme={data.theme || 'card'} />;
    }

    // Mode 2: SPOTIFY embed (playlist estática)
    if (provider === 'SPOTIFY') {
        const embed = toSpotifyEmbed(data.spotifyEmbedUrl);
        if (embed) {
            return (
                <div className="w-full h-full rounded-2xl overflow-hidden shadow-2xl bg-black/30 flex flex-col">
                    <iframe
                        src={embed}
                        allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                        loading="lazy"
                        className="w-full h-full border-0"
                        style={{ minHeight: data.compact ? 152 : 352 }}
                    />
                </div>
            );
        }
    }

    // Mode 3: VINYL fallback (existing)
    return (
        <div className="w-full h-full flex flex-col p-8 bg-black/40 backdrop-blur-2xl rounded-3xl border border-white/5 shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-64 h-64 blur-[100px] opacity-20 -mr-20 -mt-20" style={{ backgroundColor: accent }} />
            <div className="flex-1 flex flex-col md:flex-row gap-8 items-center justify-center">
                <div className="relative">
                    <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
                        className="w-40 h-40 md:w-56 md:h-56 rounded-full bg-neutral-900 border-[12px] border-black shadow-2xl overflow-hidden relative"
                    >
                        <img src={data.cover || 'https://images.unsplash.com/photo-1508700115892-45ecd0562c3e?q=80&w=400'} className="w-full h-full object-cover opacity-60" alt="" />
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-12 h-12 bg-black rounded-full border-4 border-neutral-800" />
                        </div>
                    </motion.div>
                </div>
                <div className="flex-1 text-center md:text-left">
                    <h4 className="text-[10px] font-black uppercase tracking-[0.5em] text-neutral-500 mb-2">NOW PLAYING</h4>
                    <h2 className="text-3xl md:text-5xl font-black italic text-white uppercase tracking-tighter mb-2 leading-none">{data.song || 'CHILL MIX'}</h2>
                    <p className="text-xl font-bold text-neutral-400 italic mb-8">{data.artist || 'ALTOS DEL ARAPEY'}</p>
                </div>
            </div>
        </div>
    );
};

// Now Playing live from Spotify OAuth account
const SpotifyNowPlaying: React.FC<{ accent: string; refreshMs: number; theme: string }> = ({ accent, refreshMs, theme }) => {
    const containerRef = React.useRef<HTMLDivElement>(null);
    const [isCompact, setIsCompact] = React.useState(false);
    React.useEffect(() => {
        const el = containerRef.current; if (!el) return;
        const ro = new ResizeObserver((entries) => {
            for (const e of entries) setIsCompact(e.contentRect.height < 130);
        });
        ro.observe(el);
        return () => ro.disconnect();
    }, []);
    const [state, setState] = React.useState<any>({ loading: true });

    React.useEffect(() => {
        let alive = true;
        const load = async () => {
            try {
                const r = await fetch('/api/spotify/current');
                const d = await r.json();
                if (alive) setState(d);
            } catch (e: any) {
                if (alive) setState({ ok: false, error: e.message });
            }
        };
        load();
        const iv = setInterval(load, Math.max(2000, refreshMs));
        return () => { alive = false; clearInterval(iv); };
    }, [refreshMs]);

    if (state.loading) return <div className="w-full h-full grid place-items-center text-white/60"><Disc className="animate-spin size-8" /></div>;
    if (!state.ok) return (
        <div className="w-full h-full grid place-items-center rounded-xl border border-white/10 bg-black/30 text-center p-6">
            <div>
                <Music className="mx-auto size-8 text-white/40 mb-2" />
                <div className="text-white/70 text-sm font-semibold">Spotify no conectado</div>
                <div className="text-white/40 text-xs mt-1">Configurá en /admin/settings/spotify</div>
            </div>
        </div>
    );

    if (!state.playing) return (
        <div className="w-full h-full grid place-items-center rounded-xl bg-black/40 backdrop-blur-md p-6">
            <div className="text-center">
                <Pause className="mx-auto size-8 mb-2" style={{ color: accent }} />
                <div className="text-white font-semibold text-lg">Pausado</div>
                <div className="text-white/50 text-xs mt-1">Nada sonando ahora</div>
            </div>
        </div>
    );

    const pct = state.durationMs ? (state.progressMs / state.durationMs) * 100 : 0;

    const [expanded, setExpanded] = React.useState(false);
    const handleDragEnd = React.useCallback((_: any, info: PanInfo) => {
        if (isCompact && (info.offset.y < -60 || info.velocity.y < -400)) {
            try { if (typeof navigator !== 'undefined' && 'vibrate' in navigator) (navigator as any).vibrate?.(12); } catch {}
            setExpanded(true);
        }
    }, [isCompact]);

    return (
        <>
        <motion.div
            ref={containerRef}
            className="w-full h-full flex flex-col rounded-2xl overflow-hidden shadow-2xl relative"
            drag={isCompact ? 'y' : false}
            dragConstraints={{ top: -20, bottom: 0 }}
            dragElastic={{ top: 0.35, bottom: 0 }}
            onDragEnd={handleDragEnd}
            style={{ touchAction: isCompact ? 'pan-y' : undefined }}
        >
            {state.cover && (
                <div className="absolute inset-0" style={{ background: `url(${state.cover}) center/cover no-repeat`, filter: 'blur(30px) brightness(0.4)' }} />
            )}
            <div className={"relative flex-1 flex items-center gap-3 bg-black/40 backdrop-blur-sm " + (isCompact ? 'p-2.5' : 'p-5')}>
                <AnimatePresence mode="wait">
                    <motion.img
                        key={state.cover}
                        src={state.cover || 'https://placehold.co/200x200/1db954/fff?text=♪'}
                        alt=""
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0 }}
                        className="rounded-lg shadow-xl aspect-square object-cover"
                        style={{ width: isCompact ? 60 : 'min(35%, 200px)', height: isCompact ? 60 : 'auto', boxShadow: `0 0 40px ${accent}88` }}
                    />
                </AnimatePresence>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.3em] font-black" style={{ color: accent }}>
                        <span className="size-1.5 rounded-full animate-pulse" style={{ background: accent }} />
                        Now Playing
                    </div>
                    <AnimatePresence mode="wait">
                        <motion.div key={state.track} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}>
                            <h2 className={"text-white font-black leading-tight tracking-tight truncate mt-1 " + (isCompact ? 'text-sm' : 'text-2xl md:text-4xl')}>{state.track}</h2>
                            <p className={"text-white/70 font-semibold truncate mt-0.5 " + (isCompact ? 'text-[11px]' : 'text-base md:text-xl mt-1')}>{state.artists}</p>
                            {state.album && !isCompact && <p className="text-white/40 text-[11px] md:text-sm truncate mt-1 italic">de {state.album}</p>}
                        </motion.div>
                    </AnimatePresence>
                    {state.durationMs > 0 && (
                        <div className={isCompact ? 'mt-1.5 space-y-0.5' : 'mt-4 space-y-1'}>
                            <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                                <motion.div
                                    className="h-full rounded-full"
                                    style={{ background: accent }}
                                    animate={{ width: pct + '%' }}
                                    transition={{ duration: 0.25, ease: 'linear' }}
                                />
                            </div>
                            <div className="flex justify-between text-[10px] text-white/50 font-mono tabular-nums">
                                <span>{fmt(state.progressMs)}</span>
                                <span>{fmt(state.durationMs)}</span>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </motion.div>
        <TouchPopover open={expanded} onClose={() => setExpanded(false)}>
            <div className="w-[min(92vw,520px)]" style={{ padding: 0 }}>
                <div className="relative rounded-2xl overflow-hidden">
                    {state.cover && (
                        <div className="absolute inset-0" style={{ background: `url(${state.cover}) center/cover no-repeat`, filter: 'blur(30px) brightness(0.4)' }} />
                    )}
                    <div className="relative p-5 bg-black/40 backdrop-blur-sm">
                        <img
                            src={state.cover || 'https://placehold.co/400x400/1db954/fff?text=%E2%99%AA'}
                            alt=""
                            className="w-full aspect-square object-cover rounded-xl shadow-2xl"
                            style={{ boxShadow: `0 0 60px ${accent}88` }}
                        />
                        <div className="mt-5">
                            <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.3em] font-black" style={{ color: accent }}>
                                <span className="size-1.5 rounded-full animate-pulse" style={{ background: accent }} />
                                Now Playing
                            </div>
                            <h2 className="text-white font-black leading-tight tracking-tight mt-2 text-2xl md:text-3xl">{state.track}</h2>
                            <p className="text-white/70 font-semibold mt-1 text-base">{state.artists}</p>
                            {state.album && <p className="text-white/40 text-sm mt-1 italic">de {state.album}</p>}
                            {state.durationMs > 0 && (
                                <div className="mt-4 space-y-1">
                                    <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                                        <div className="h-full rounded-full" style={{ background: accent, width: pct + '%' }} />
                                    </div>
                                    <div className="flex justify-between text-[11px] text-white/50 font-mono tabular-nums">
                                        <span>{fmt(state.progressMs)}</span>
                                        <span>{fmt(state.durationMs)}</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </TouchPopover>
        </>
    );
};

function fmt(ms: number) {
    const s = Math.floor(ms / 1000);
    const m = Math.floor(s / 60);
    return m + ':' + String(s % 60).padStart(2, '0');
}

export default MusicPlayerWidget;
