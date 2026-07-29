'use client';

import * as React from 'react';
import { useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { io } from 'socket.io-client';
import WidgetRenderer from '@/components/shared/WidgetRenderer';
import { Loader2, ArrowLeft, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { LayoutJSON, WidgetConfig } from '@/store/usePlayerStore';

const Patterns = {
    dots: 'radial-gradient(circle, currentColor 1px, transparent 1px)',
    grid: 'linear-gradient(to right, currentColor 1px, transparent 1px), linear-gradient(to bottom, currentColor 1px, transparent 1px)',
    waves: 'radial-gradient(circle at 100% 150%, transparent 24%, currentColor 25%, currentColor 28%, transparent 29%, transparent 36%, currentColor 36%, currentColor 40%, transparent 41%, transparent)',
    noise: "url('https://grainy-gradients.vercel.app/noise.svg')",
} as const;

function getYoutubeId(url: string) {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
}

export default function PreviewPage() {
    const { layoutId } = useParams<{ layoutId: string }>();
    const [layout, setLayout] = React.useState<LayoutJSON | null>(null);
    const [error, setError] = React.useState<string | null>(null);
    const [hideChrome, setHideChrome] = React.useState(false);

    React.useEffect(() => {
        if (!layoutId) return;
        const fetchLayout = () => {
            fetch('/api/layouts/' + layoutId + '?t=' + Date.now())
                .then(r => {
                    if (!r.ok) throw new Error('HTTP ' + r.status);
                    return r.json();
                })
                .then(setLayout)
                .catch(e => setError(e.message));
        };
        fetchLayout();

        // Live updates: connect socket, listen for layout changes.
        const socket = io();
        socket.on('layouts_list', (layouts: any[]) => {
            const fresh = layouts.find((l) => l._id === layoutId);
            if (fresh) setLayout(fresh);
        });
        socket.on('update_layout', (fresh: any) => {
            if (fresh && (fresh._id === layoutId || fresh.id === layoutId)) {
                setLayout(fresh);
            }
        });
        return () => { socket.disconnect(); };
    }, [layoutId]);

    // Handle pf-nav events (CATEGORY_NAV / NAV_BUTTON) so preview navigation works.
    React.useEffect(() => {
        const onNav = (ev: any) => {
            const detail = ev?.detail || {};
            const action = detail.action;
            if (action === 'GO_TO' && detail.targetLayoutId) {
                fetch('/api/layouts/' + detail.targetLayoutId + '?t=' + Date.now())
                    .then(r => r.ok ? r.json() : null)
                    .then((fresh: any) => { if (fresh) setLayout(fresh); })
                    .catch(() => {});
            } else if (action === 'RELOAD') {
                if (typeof window !== 'undefined') window.location.reload();
            }
            // HOME / BACK are not meaningful in preview single-layout mode.
        };
        window.addEventListener('pf-nav', onNav);
        return () => window.removeEventListener('pf-nav', onNav);
    }, []);

    // Auto-hide chrome after 3s of no mouse movement
    React.useEffect(() => {
        let timer: ReturnType<typeof setTimeout>;
        const reset = () => {
            setHideChrome(false);
            clearTimeout(timer);
            timer = setTimeout(() => setHideChrome(true), 3000);
        };
        reset();
        window.addEventListener('mousemove', reset);
        return () => {
            window.removeEventListener('mousemove', reset);
            clearTimeout(timer);
        };
    }, []);

    if (error) {
        return (
            <div className="fixed inset-0 grid place-items-center bg-background text-foreground">
                <div className="text-center max-w-md">
                    <div className="size-12 rounded-full bg-destructive/10 text-destructive grid place-items-center mx-auto mb-3">!</div>
                    <h1 className="font-heading text-lg font-bold mb-2">No se pudo cargar el diseño</h1>
                    <p className="text-sm text-muted-foreground mb-4">{error}</p>
                    <Link href="/admin/layouts">
                        <Button variant="outline" size="sm"><ArrowLeft className="size-3.5" /> Volver a Galería</Button>
                    </Link>
                </div>
            </div>
        );
    }

    if (!layout) {
        return (
            <div className="fixed inset-0 grid place-items-center bg-background text-muted-foreground">
                <div className="flex items-center gap-2 text-sm">
                    <Loader2 className="size-4 animate-spin" /> Cargando vista previa…
                </div>
            </div>
        );
    }

    const youtubeId = layout.backgroundVideo ? getYoutubeId(layout.backgroundVideo) : null;
    const pattern = (layout.backgroundPattern as string) || 'none';

    return (
        <div className="fixed inset-0 overflow-hidden bg-black" data-preview>
            {/* Backgrounds */}
            <div className="absolute inset-0" style={{ background: layout.backgroundColor || '#000' }} />
            {layout.backgroundImage && !layout.backgroundVideo && (
                <div
                    className="absolute inset-0 bg-cover bg-center"
                    style={{
                        backgroundImage: 'url(' + layout.backgroundImage + ')',
                        filter: 'blur(' + (layout.backgroundBlur || 0) + 'px)',
                    }}
                />
            )}
            {layout.backgroundVideo && (
                youtubeId ? (
                    <iframe
                        className="absolute inset-0 w-full h-full pointer-events-none"
                        src={'https://www.youtube.com/embed/' + youtubeId + '?autoplay=1&mute=1&loop=1&playlist=' + youtubeId + '&controls=0&modestbranding=1'}
                        allow="autoplay; encrypted-media"
                    />
                ) : (
                    <video
                        src={layout.backgroundVideo}
                        autoPlay muted loop playsInline
                        className="absolute inset-0 w-full h-full object-cover"
                        style={{ filter: 'blur(' + (layout.backgroundBlur || 0) + 'px)' }}
                    />
                )
            )}
            {/* Overlay color */}
            {(layout.backgroundOverlayOpacity ?? 0) > 0 && (
                <div className="absolute inset-0 pointer-events-none" style={{
                    background: layout.backgroundOverlayColor || '#000',
                    opacity: layout.backgroundOverlayOpacity ?? 0.5,
                }} />
            )}
            {/* Pattern */}
            {pattern !== 'none' && (Patterns as any)[pattern] && (
                <div className="absolute inset-0 pointer-events-none text-white" style={{
                    backgroundImage: (Patterns as any)[pattern] as string,
                    backgroundSize: pattern === 'dots' ? '30px 30px' : (pattern === 'grid' ? '40px 40px' : 'auto'),
                    opacity: layout.backgroundPatternOpacity ?? 0.2,
                }} />
            )}

            {/* Widgets — same positioning as the player */}
            {(layout.widgets || []).map((w: WidgetConfig) => (
                <div
                    key={w.id}
                    className="absolute"
                    style={{
                        left: (w.x || 0) + '%',
                        top: (w.y || 0) + '%',
                        width: (w.w || 100) + '%',
                        height: (w.h || 100) + '%',
                        zIndex: w.zIndex || 1,
                    }}
                >
                    <WidgetRenderer widget={w} />
                </div>
            ))}

            {/* Preview chrome — auto-hide */}
            <motion.div
                initial={false}
                animate={{ opacity: hideChrome ? 0 : 1, y: hideChrome ? -8 : 0 }}
                transition={{ duration: 0.25 }}
                className="fixed top-3 left-1/2 -translate-x-1/2 z-[999] flex items-center gap-2 px-3 py-2 rounded-full bg-black/70 text-white backdrop-blur-md shadow-2xl border border-white/10"
            >
                <Eye className="size-3.5 text-primary" />
                <span className="text-[11px] font-semibold uppercase tracking-widest">Preview</span>
                <span className="text-[11px] text-white/70 max-w-[240px] truncate">
                    {(layout as any).name || 'Sin nombre'}
                </span>
                <span className="mx-1 h-4 w-px bg-white/20" />
                <Link href={'/admin?id=' + layoutId}>
                    <button className="text-[11px] px-2 py-1 rounded-md bg-white/10 hover:bg-white/20 transition-colors">
                        Editar
                    </button>
                </Link>
                <Link href="/admin/layouts">
                    <button className="text-[11px] px-2 py-1 rounded-md bg-white/10 hover:bg-white/20 transition-colors flex items-center gap-1">
                        <ArrowLeft className="size-3" /> Galería
                    </button>
                </Link>
            </motion.div>
        </div>
    );
}
