'use client';

import React, { useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePathname } from 'next/navigation';
import { usePlayerStore } from '@/store/usePlayerStore';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Navigation, Pagination, FreeMode } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import 'swiper/css/autoplay';
import * as Icons from 'lucide-react';

// ==================================================================================
// CategoryNavWidget — rewritten (v3, jul 2026).
// Guiding principles:
//   - Every prop from `data` is applied INLINE per rendered element.
//   - Zero CSS specificity gymnastics. If a prop should override Tailwind, we ban
//     that Tailwind color/font class from the template entirely.
//   - Templates are pure functions of (cat, style) — no shared className strings
//     that leak colors.
//   - Swiper autoplay + arrows configurable via inline options and CSS variables.
// ==================================================================================

interface CategoryItem {
    id?: string;
    label: string;
    icon?: string;
    photo?: string;
    photoUrl?: string;
    active?: boolean;
    visible?: boolean;
    action?: 'GO_TO' | 'BACK' | 'HOME' | 'RELOAD' | 'NONE';
    targetLayoutId?: string;
    textColor?: string;
    textSize?: 'sm' | 'md' | 'lg' | 'xl';
    iconSize?: 'sm' | 'md' | 'lg';
    overlay?: number;
}

type NavTemplate =
    | 'CARDS' | 'FLOATING' | 'GLAS_TILES' | 'STRIPS'
    | 'NEON_GLOW' | 'BRUTALIST' | 'HOLOGRAPHIC' | 'MAC_DOCK' | 'BENTO'
    | 'NEON_PILLS' | 'GLOW_ORBS' | 'MOSAIC' | 'MINIMAL_LIST'
    | 'CIRCULAR_HUB' | 'DOCK_TILES'
    | 'RADIAL' | 'STACKED' | 'WAVES' | 'RIBBON'
    | 'NEUMORPHIC' | 'GRADIENT_BUBBLES' | 'TERMINAL';

interface CategoryNavWidgetProps {
    data: {
        title?: string;
        titleColor?: string;
        titleSize?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
        titleAlign?: 'left' | 'center' | 'right';
        titleShadow?: boolean;

        template?: NavTemplate;
        accentColor?: string;
        categories?: CategoryItem[];
        layout?: 'HORIZONTAL' | 'VERTICAL' | 'GRID';
        columns?: number;
        rows?: number;
        itemGap?: number;
        itemShape?: 'square' | 'rounded' | 'pill' | 'circle';
        borderWidth?: number;
        borderColor?: string;

        autoScroll?: boolean;
        autoScrollDelay?: number;
        scrollMode?: 'step' | 'continuous';
        scrollSpeed?: number;   // px/segundo aproximado, para el modo continuo

        showNavArrows?: boolean;
        navArrowColor?: string;
        navArrowSize?: 'sm' | 'md' | 'lg';
    };
}

const TITLE_SIZE: Record<string, string> = {
    sm: '1.1rem', md: '1.5rem', lg: '2rem', xl: '2.75rem', '2xl': '3.5rem',
};
const TEXT_SIZE: Record<string, string> = { sm: '0.85em', md: '1em', lg: '1.35em', xl: '1.7em' };
const ICON_SIZE: Record<string, string> = { sm: '1.2em', md: '1.6em', lg: '2.2em' };
const SHAPE_RADIUS: Record<string, string> = { square: '0', rounded: '1rem', pill: '9999px', circle: '50%' };
const ARROW_SIZE: Record<string, string> = { sm: '22px', md: '32px', lg: '44px' };

/** Label that guarantees inline color/size wins with !important via ref. */
const CatLabel: React.FC<{ cat: CategoryItem; className?: string }> = ({ cat, className }) => {
    const ref = useRef<HTMLSpanElement>(null);
    useEffect(() => {
        const el = ref.current; if (!el) return;
        if (cat.textColor) {
            el.style.setProperty('color', cat.textColor, 'important');
            el.style.setProperty('-webkit-text-fill-color', cat.textColor, 'important');
        } else { el.style.removeProperty('color'); el.style.removeProperty('-webkit-text-fill-color'); }
        if (cat.textSize) el.style.setProperty('font-size', TEXT_SIZE[cat.textSize] || '1em', 'important');
        else el.style.removeProperty('font-size');
    }, [cat.textColor, cat.textSize]);
    return (
        <span
            ref={ref}
            className={'pf-cn-label ' + (className || '')}
            style={{ textShadow: '0 1px 3px rgba(0,0,0,0.45)' }}
        >
            {cat.label}
        </span>
    );
};

/** Compute per-item base style: border, radius, overlay */
function itemStyle(itemShape: string, borderWidth: number, borderColor: string): React.CSSProperties {
    const s: React.CSSProperties = { borderRadius: SHAPE_RADIUS[itemShape] || '1rem' };
    if (borderWidth > 0) s.border = `${borderWidth}px solid ${borderColor}`;
    return s;
}

/** Photo helper */
const catPhoto = (c: CategoryItem) => c.photo || c.photoUrl;

/** Renders a category button per template. */
function TemplateBtn({ cat, template, accent, onTap, itemShape, borderWidth, borderColor }: {
    cat: CategoryItem; template: NavTemplate; accent: string;
    onTap: (c: CategoryItem) => void;
    itemShape: string; borderWidth: number; borderColor: string;
}) {
    const base = itemStyle(itemShape, borderWidth, borderColor);
    const bg = catPhoto(cat);
    const bgLayer = bg ? (
        <div className="absolute inset-0 z-0" style={{ background: `url(${bg}) center/cover no-repeat`, filter: 'brightness(0.7)' }} />
    ) : null;
    const overlay = (cat.overlay ?? 0) > 0 ? (
        <div className="absolute inset-0 z-[1] pointer-events-none" style={{ background: `rgba(0,0,0,${(cat.overlay || 0) / 100})` }} />
    ) : null;

    // Base tap-friendly button, min 48x48 for touch
    const commonProps = {
        onClick: () => onTap(cat),
        className: 'pf-cn-btn relative w-full min-h-14 flex items-center justify-center overflow-hidden active:scale-[0.97] transition-transform',
        style: { ...base, cursor: 'pointer' as const },
    };

    switch (template) {
        case 'CARDS':
            return (
                <button {...commonProps} style={{ ...commonProps.style, minHeight: '160px', boxShadow: '0 10px 30px rgba(0,0,0,0.35)' }}>
                    {bgLayer}
                    {overlay}
                    <CatLabel cat={cat} className="relative z-[2] font-black uppercase tracking-tight text-2xl" />
                </button>
            );
        case 'GLAS_TILES':
            return (
                <button {...commonProps} style={{ ...commonProps.style, minHeight: '140px', background: 'rgba(255,255,255,0.08)', backdropFilter: 'blur(12px)', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.15)' }}>
                    {bgLayer && <div className="absolute inset-0 z-0 opacity-30" style={{ background: `url(${bg}) center/cover no-repeat` }} />}
                    {overlay}
                    <CatLabel cat={cat} className="relative z-[2] font-bold uppercase text-xl" />
                </button>
            );
        case 'FLOATING':
            return (
                <button {...commonProps} style={{ ...commonProps.style, borderRadius: '9999px', minHeight: '128px', background: bg ? undefined : accent + '22' }}>
                    {bgLayer && <div className="absolute inset-0 rounded-full" style={{ background: `url(${bg}) center/cover no-repeat` }} />}
                    {overlay}
                    <CatLabel cat={cat} className="relative z-[2] font-bold text-lg" />
                </button>
            );
        case 'STRIPS':
            return (
                <button {...commonProps} style={{ ...commonProps.style, minHeight: '64px', background: bg ? undefined : accent + '18', borderLeft: `4px solid ${accent}` }}>
                    {bgLayer}
                    {overlay}
                    <CatLabel cat={cat} className="relative z-[2] font-black uppercase text-xl w-full text-left pl-4" />
                </button>
            );
        case 'NEON_GLOW':
            return (
                <button {...commonProps} style={{ ...commonProps.style, minHeight: '140px', background: '#0a0a0a', border: `2px solid ${accent}`, boxShadow: `0 0 24px ${accent}80, inset 0 0 12px ${accent}40` }}>
                    {bgLayer && <div className="absolute inset-0 opacity-30" style={{ background: `url(${bg}) center/cover no-repeat` }} />}
                    {overlay}
                    <CatLabel cat={cat} className="relative z-[2] font-black uppercase text-xl" />
                </button>
            );
        case 'BRUTALIST':
            return (
                <button {...commonProps} style={{ ...commonProps.style, minHeight: '128px', background: accent, border: '4px solid #000', borderRadius: 0, boxShadow: '8px 8px 0 #000' }}>
                    {bgLayer}
                    {overlay}
                    <CatLabel cat={cat} className="relative z-[2] font-black uppercase italic text-2xl" />
                </button>
            );
        case 'HOLOGRAPHIC':
            return (
                <button {...commonProps} style={{ ...commonProps.style, minHeight: '150px', background: 'linear-gradient(135deg, #f43f5e, #8b5cf6, #06b6d4)', backgroundSize: '200% 200%' }}>
                    {bgLayer && <div className="absolute inset-0 opacity-40 mix-blend-overlay" style={{ background: `url(${bg}) center/cover no-repeat` }} />}
                    {overlay}
                    <CatLabel cat={cat} className="relative z-[2] font-black uppercase text-2xl" />
                </button>
            );
        case 'MAC_DOCK':
            return (
                <button {...commonProps} style={{ ...commonProps.style, minHeight: '128px', borderRadius: '1.5rem', background: 'rgba(255,255,255,0.08)', backdropFilter: 'blur(20px)' }}>
                    {bgLayer && <div className="absolute inset-0 rounded-3xl overflow-hidden" style={{ background: `url(${bg}) center/cover no-repeat` }} />}
                    {overlay}
                    <CatLabel cat={cat} className="relative z-[2] font-bold text-lg" />
                </button>
            );
        case 'BENTO':
            return (
                <button {...commonProps} style={{ ...commonProps.style, minHeight: '160px', background: accent + '15', borderRadius: '1.5rem' }}>
                    {bgLayer}
                    {overlay}
                    <CatLabel cat={cat} className="relative z-[2] font-black uppercase text-2xl" />
                </button>
            );
        case 'NEON_PILLS':
            return (
                <button {...commonProps} style={{ ...commonProps.style, minHeight: '64px', borderRadius: 9999, background: '#0a0a0a', border: `2px solid ${accent}`, boxShadow: `0 0 18px ${accent}90` }}>
                    {bgLayer && <div className="absolute inset-0 rounded-full opacity-20" style={{ background: `url(${bg}) center/cover no-repeat` }} />}
                    {overlay}
                    <CatLabel cat={cat} className="relative z-[2] font-bold uppercase text-lg tracking-widest" />
                </button>
            );
        case 'GLOW_ORBS':
            return (
                <button {...commonProps} style={{ ...commonProps.style, minHeight: '128px', borderRadius: 9999, background: `radial-gradient(circle at center, ${accent}, ${accent}44 60%, transparent)` }}>
                    {bgLayer && <div className="absolute inset-0 rounded-full opacity-40" style={{ background: `url(${bg}) center/cover no-repeat` }} />}
                    {overlay}
                    <CatLabel cat={cat} className="relative z-[2] font-black text-xl" />
                </button>
            );
        case 'MOSAIC':
            return (
                <button {...commonProps} style={{ ...commonProps.style, minHeight: '128px', background: bg ? undefined : accent, borderRadius: '0.5rem' }}>
                    {bgLayer}
                    {overlay || <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />}
                    <CatLabel cat={cat} className="relative z-[2] font-black uppercase text-xl self-end w-full text-left pl-4 pb-3" />
                </button>
            );
        case 'MINIMAL_LIST':
            return (
                <button {...commonProps} style={{ ...commonProps.style, minHeight: '56px', background: 'transparent', border: 'none', borderBottom: `1px solid ${accent}55`, borderRadius: 0 }}>
                    {overlay}
                    <div className="relative z-[2] flex items-center justify-between w-full px-3">
                        <CatLabel cat={cat} className="font-bold uppercase tracking-wider text-lg" />
                        <span style={{ color: accent, fontSize: '1.5em' }}>→</span>
                    </div>
                </button>
            );
        case 'CIRCULAR_HUB':
            return (
                <button {...commonProps} style={{ ...commonProps.style, minHeight: '128px', borderRadius: 9999, background: bg ? undefined : accent + '22', border: `3px solid ${accent}` }}>
                    {bgLayer && <div className="absolute inset-0 rounded-full" style={{ background: `url(${bg}) center/cover no-repeat` }} />}
                    {overlay}
                    <CatLabel cat={cat} className="relative z-[2] font-black text-xl" />
                </button>
            );
        case 'DOCK_TILES':
            return (
                <button {...commonProps} style={{ ...commonProps.style, minHeight: '128px', borderRadius: '1.5rem', background: `linear-gradient(180deg, ${accent}, ${accent}88)`, boxShadow: `0 10px 20px ${accent}55` }}>
                    {bgLayer && <div className="absolute inset-0 rounded-3xl opacity-40" style={{ background: `url(${bg}) center/cover no-repeat` }} />}
                    {overlay}
                    <CatLabel cat={cat} className="relative z-[2] font-black uppercase text-xl" />
                </button>
            );
        case 'RADIAL':
            return (
                <button {...commonProps} style={{ ...commonProps.style, minHeight: '128px', borderRadius: 9999, background: `conic-gradient(from 0deg, ${accent}, ${accent}88, ${accent}, ${accent}88)` }}>
                    {bgLayer && <div className="absolute inset-0 rounded-full opacity-40" style={{ background: `url(${bg}) center/cover no-repeat` }} />}
                    {overlay}
                    <div className="absolute inset-2 rounded-full bg-black/50 backdrop-blur-sm grid place-items-center z-[2]">
                        <CatLabel cat={cat} className="font-black uppercase text-lg tracking-wide" />
                    </div>
                </button>
            );
        case 'STACKED':
            return (
                <button {...commonProps} style={{ ...commonProps.style, minHeight: '140px', borderRadius: '1rem', background: bg ? undefined : accent + '25', boxShadow: `0 6px 0 ${accent}88, 0 12px 0 ${accent}44, 0 18px 30px rgba(0,0,0,0.4)` }}>
                    {bgLayer}
                    {overlay}
                    <CatLabel cat={cat} className="relative z-[2] font-black uppercase text-2xl tracking-tight" />
                </button>
            );
        case 'WAVES':
            return (
                <button {...commonProps} style={{ ...commonProps.style, minHeight: '128px', borderRadius: '2rem 0 2rem 0', background: `linear-gradient(135deg, ${accent}, ${accent}66 60%, transparent)`, border: `2px solid ${accent}55` }}>
                    {bgLayer && <div className="absolute inset-0 opacity-40" style={{ background: `url(${bg}) center/cover no-repeat`, borderRadius: 'inherit' }} />}
                    {overlay}
                    <svg className="absolute inset-x-0 bottom-0 z-[1] opacity-40" viewBox="0 0 100 20" preserveAspectRatio="none" style={{ height: '30%' }}>
                        <path d="M0 10 Q 25 0 50 10 T 100 10 L 100 20 L 0 20 Z" fill={accent} />
                    </svg>
                    <CatLabel cat={cat} className="relative z-[2] font-black uppercase text-xl" />
                </button>
            );
        case 'RIBBON':
            return (
                <button {...commonProps} style={{ ...commonProps.style, minHeight: '120px', background: 'transparent', borderRadius: 0 }}>
                    {bgLayer && <div className="absolute inset-0 opacity-30" style={{ background: `url(${bg}) center/cover no-repeat` }} />}
                    <div
                        className="absolute inset-x-[-8%] top-1/2 -translate-y-1/2 z-[1] py-4"
                        style={{
                            background: `linear-gradient(90deg, ${accent} 0%, ${accent}dd 100%)`,
                            transform: 'translateY(-50%) skewY(-3deg)',
                            boxShadow: `0 8px 20px ${accent}66`,
                        }}
                    />
                    {overlay}
                    <CatLabel cat={cat} className="relative z-[2] font-black italic uppercase text-2xl tracking-widest" />
                </button>
            );
        case 'NEUMORPHIC':
            return (
                <button {...commonProps} style={{ ...commonProps.style, minHeight: '128px', borderRadius: '1.75rem', background: '#1a1d23', boxShadow: 'inset 4px 4px 12px #0a0c10, inset -4px -4px 12px #262a32, 8px 8px 20px rgba(0,0,0,0.4)' }}>
                    {bgLayer && <div className="absolute inset-0 opacity-40" style={{ background: `url(${bg}) center/cover no-repeat`, borderRadius: 'inherit' }} />}
                    {overlay}
                    <CatLabel cat={cat} className="relative z-[2] font-bold uppercase text-lg tracking-widest" />
                </button>
            );
        case 'GRADIENT_BUBBLES':
            {
                const grads = [
                    'linear-gradient(135deg, #f43f5e, #f97316)',
                    'linear-gradient(135deg, #8b5cf6, #06b6d4)',
                    'linear-gradient(135deg, #10b981, #84cc16)',
                    'linear-gradient(135deg, #f59e0b, #ef4444)',
                    'linear-gradient(135deg, #3b82f6, #a855f7)',
                    'linear-gradient(135deg, #14b8a6, #22d3ee)',
                ];
                const idx = (cat.id || '').length % grads.length;
                return (
                    <button {...commonProps} style={{ ...commonProps.style, minHeight: '140px', borderRadius: '9999px 1rem 9999px 1rem', background: grads[idx], boxShadow: '0 12px 32px rgba(0,0,0,0.35)' }}>
                        {bgLayer && <div className="absolute inset-0 mix-blend-overlay" style={{ background: `url(${bg}) center/cover no-repeat`, borderRadius: 'inherit' }} />}
                        {overlay}
                        <CatLabel cat={cat} className="relative z-[2] font-black uppercase text-2xl tracking-tight" />
                    </button>
                );
            }
        case 'TERMINAL':
            return (
                <button {...commonProps} style={{ ...commonProps.style, minHeight: '120px', borderRadius: '0.25rem', background: '#0d1117', border: `1px solid ${accent}`, boxShadow: `inset 0 0 60px ${accent}22, 0 0 20px ${accent}44`, fontFamily: '"Courier New", monospace' }}>
                    {bgLayer && <div className="absolute inset-0 opacity-20" style={{ background: `url(${bg}) center/cover no-repeat` }} />}
                    <div className="absolute top-1 left-2 z-[2] text-[10px] font-mono opacity-70" style={{ color: accent }}>
                        {'>'} exec
                    </div>
                    {overlay}
                    <CatLabel cat={cat} className="relative z-[2] font-mono uppercase text-xl tracking-wider" />
                </button>
            );
        default:
            return (
                <button {...commonProps} style={{ ...commonProps.style, minHeight: '128px', background: bg ? undefined : accent + '22' }}>
                    {bgLayer}
                    {overlay}
                    <CatLabel cat={cat} className="relative z-[2] font-bold text-xl" />
                </button>
            );
    }
}

const CategoryNavWidget: React.FC<CategoryNavWidgetProps> = ({ data }) => {
    const template = (data.template || 'CARDS') as NavTemplate;
    const accent = data.accentColor || '#3b82f6';
    const columns = Math.max(1, data.columns || 3);
    const rows = data.rows ?? 0;
    const itemGap = data.itemGap ?? 12;
    const itemShape = data.itemShape || 'rounded';
    const borderWidth = data.borderWidth ?? 0;
    const borderColor = data.borderColor || '#ffffff';
    const autoScroll = !!data.autoScroll;
    const autoScrollDelay = data.autoScrollDelay ?? 4000;
    const scrollMode = data.scrollMode || 'step';
    const scrollSpeed = data.scrollSpeed ?? 60; // px/s target
    const showNavArrows = data.showNavArrows !== false;
    const navArrowColor = data.navArrowColor || '#ffffff';
    const navArrowSize = data.navArrowSize || 'md';
    const layout = data.layout || 'HORIZONTAL';

    const { screenId } = usePlayerStore();
    const pathname = usePathname();
    const isAdmin = !!pathname?.includes('/admin');

    // Emit navigation via socket-window bridge (compatible with player pf-nav listener)
    const onTap = (cat: CategoryItem) => {
        if (isAdmin) return; // admin/preview no navega
        const action = cat.action || (cat.targetLayoutId ? 'GO_TO' : 'NONE');
        if (action === 'NONE') return;
        window.dispatchEvent(new CustomEvent('pf-nav', { detail: { action, targetLayoutId: cat.targetLayoutId } }));
    };

    const [gridRotateOffset, setGridRotateOffset] = React.useState(0);
    React.useEffect(() => {
        if (!autoScroll || layout !== 'GRID' || isAdmin) return;
        const iv = setInterval(() => {
            setGridRotateOffset((n) => n + Math.max(1, columns));
        }, autoScrollDelay);
        return () => clearInterval(iv);
    }, [autoScroll, layout, autoScrollDelay, columns, isAdmin]);

    const items = useMemo(
        () => (data.categories || []).filter((c) => c.active !== false && c.visible !== false),
        [data.categories]
    );

    // Container class for arrows via CSS vars — Swiper reads --swiper-navigation-color and --swiper-navigation-size
    const containerVars: React.CSSProperties = {
        // @ts-ignore
        '--swiper-navigation-color': navArrowColor,
        // @ts-ignore
        '--swiper-navigation-size': ARROW_SIZE[navArrowSize] || '32px',
        '--pf-gap': itemGap + 'px',
    } as React.CSSProperties;

    // Title
    const titleEl = (data.title) ? (
        <div
            className="w-full mb-3 px-2"
            style={{
                color: data.titleColor || '#ffffff',
                WebkitTextFillColor: data.titleColor || '#ffffff',
                fontSize: TITLE_SIZE[data.titleSize || 'lg'] || TITLE_SIZE.lg,
                textAlign: (data.titleAlign || 'center') as any,
                fontWeight: 800,
                letterSpacing: '0.05em',
                textShadow: data.titleShadow !== false ? '0 2px 12px rgba(0,0,0,0.55)' : undefined,
                lineHeight: 1.1,
            }}
        >
            {data.title}
        </div>
    ) : null;

    if (items.length === 0) {
        return (
            <div className="w-full h-full grid place-items-center rounded-xl border-2 border-dashed border-white/20 bg-black/20 text-white/60 text-sm font-medium p-4 text-center">
                Agregá categorías en el editor del widget para ver el menú.
            </div>
        );
    }

    const renderCarousel = () => {
        // Duplicate items until we have enough for smooth loop when autoplay is on.
        // Swiper loop needs at least (slidesPerView * 2) slides to rotate cleanly.
        let displayItems = items;
        if (autoScroll && items.length > 0) {
            const needed = Math.max(columns * 3, columns + 2);
            if (items.length < needed) {
                displayItems = [];
                let i = 0;
                while (displayItems.length < needed) {
                    displayItems.push(items[i % items.length]);
                    i++;
                }
            }
        }
        return (
            <Swiper
                key={`sw-${autoScroll ? '1' : '0'}-${autoScrollDelay}-${columns}-${items.length}-${scrollMode}-${scrollSpeed}`}
                modules={[Autoplay, Navigation, Pagination, FreeMode]}
                spaceBetween={itemGap}
                slidesPerView={columns}
                navigation={showNavArrows}
                autoplay={autoScroll ? (scrollMode === 'continuous'
                    ? { delay: 1, disableOnInteraction: false, pauseOnMouseEnter: false, waitForTransition: false, reverseDirection: false }
                    : { delay: autoScrollDelay, disableOnInteraction: false, pauseOnMouseEnter: false, waitForTransition: true }) : false}
                speed={autoScroll && scrollMode === 'continuous' ? Math.max(1500, 100000 / Math.max(10, scrollSpeed)) : 700}
                freeMode={autoScroll && scrollMode === 'continuous' ? { enabled: true, momentum: false } : false}
                loop={autoScroll}
                loopAdditionalSlides={columns}
                allowTouchMove={!isAdmin}
                className="w-full h-full pf-nav-swiper"
            >
                {displayItems.map((cat, i) => (
                    <SwiperSlide key={`${cat.id || 'x'}-${i}`} data-cat-id={cat.id || i}>
                        <TemplateBtn cat={cat} template={template} accent={accent} onTap={onTap} itemShape={itemShape} borderWidth={borderWidth} borderColor={borderColor} />
                    </SwiperSlide>
                ))}
            </Swiper>
        );
    };

    const renderGrid = () => {
        // If autoScroll and grid, rotate the items array to give a carousel-like effect
        let displayItems = items;
        if (autoScroll && items.length > 0 && layout === 'GRID' && !isAdmin) {
            const shift = gridRotateOffset % items.length;
            displayItems = [...items.slice(shift), ...items.slice(0, shift)];
        }
        return (
        <div
            className="w-full h-full"
            style={{
                display: 'grid',
                gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
                gridTemplateRows: rows > 0 ? `repeat(${rows}, minmax(0, 1fr))` : undefined,
                gap: itemGap + 'px',
                alignContent: 'start',
            }}
        >
            <AnimatePresence>
                {displayItems.map((cat, i) => (
                    <motion.div
                        key={cat.id || i}
                        data-cat-id={cat.id || i}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: isAdmin ? 0 : i * 0.03, duration: 0.25 }}
                        className="w-full"
                    >
                        <TemplateBtn cat={cat} template={template} accent={accent} onTap={onTap} itemShape={itemShape} borderWidth={borderWidth} borderColor={borderColor} />
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>
    );};

    return (
        <div
            className={'pf-cat-nav ' + (isAdmin ? 'pf-cat-nav-admin ' : '') + 'w-full h-full flex flex-col p-3 md:p-5 overflow-hidden'}
            style={containerVars}
        >
            {titleEl}
            <div className="flex-1 min-h-0 relative">
                {layout === 'HORIZONTAL' ? renderCarousel() : renderGrid()}
            </div>

            {/* Custom scoped styles for admin — hide arrows when in the studio canvas */}
            <style jsx global>{`
                .pf-cat-nav-admin .swiper-button-next,
                .pf-cat-nav-admin .swiper-button-prev { display: none !important; }
                .pf-cat-nav .swiper-button-next,
                .pf-cat-nav .swiper-button-prev {
                    color: var(--swiper-navigation-color) !important;
                    text-shadow: 0 2px 8px rgba(0,0,0,0.55);
                }
                .pf-cat-nav .swiper-slide { height: auto; }
            `}</style>
        </div>
    );
};

export default CategoryNavWidget;
