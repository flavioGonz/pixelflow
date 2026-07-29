'use client';

import React from 'react';
import { motion, TargetAndTransition } from 'framer-motion';
import * as Icons from 'lucide-react';
import { usePlayerStore } from '@/store/usePlayerStore';

export type ButtonTemplate =
    | 'SOLID' | 'OUTLINE' | 'PILL' | 'GHOST' | 'ICON_ONLY' | 'HERO'
    | 'GLASS' | 'NEON' | 'MINIMAL' | '3D' | 'GRADIENT' | 'CIRCULAR'
    | 'RETRO' | 'SKEWED' | 'STAMP' | 'BEVEL' | 'GLOW' | 'EMBOSS' | 'CYBER';

interface NavButtonWidgetProps {
    data: {
        label?: string;
        action?: 'BACK' | 'HOME' | 'LINK' | 'GO_TO' | 'RELOAD' | 'NONE';
        type?: 'BACK' | 'HOME' | 'LINK';
        targetLayoutId?: string;
        icon?: string;
        iconPosition?: 'left' | 'right' | 'top' | 'none';
        color?: string;
        textColor?: string;
        template?: ButtonTemplate;
        variant?: string;
        // Sizing controls (from admin panel — now actually applied)
        fontSize?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
        fontWeight?: 'normal' | 'medium' | 'semibold' | 'bold' | 'black';
        borderRadius?: number;   // px
        shadow?: boolean;
        // Legacy support
    };
}

const FS_MAP: Record<string, string> = {
    xs: '0.75rem', sm: '0.875rem', md: '1rem', lg: '1.25rem', xl: '1.5rem', '2xl': '2rem',
};
const FW_MAP: Record<string, number> = {
    normal: 400, medium: 500, semibold: 600, bold: 700, black: 900,
};

const NavButtonWidget: React.FC<NavButtonWidgetProps> = ({ data }) => {
    const { popFromHistory, screenId } = usePlayerStore();
    const template = (data.template || data.variant || 'GLASS').toUpperCase() as ButtonTemplate;
    const accent = data.color || '#3b82f6';
    const iconName = data.icon || 'ArrowLeft';
    const AnyIcon = (Icons as any)[iconName] || Icons.ArrowLeft;
    const label = data.label || 'BOTON';
    const iconPos = data.iconPosition || 'left';
    const fontSize = FS_MAP[data.fontSize || 'md'];
    const fontWeight = FW_MAP[data.fontWeight || 'bold'];
    const radius = (data.borderRadius ?? 12) + 'px';
    const shadow = data.shadow !== false;

    // Contrast helper
    const contrast = (hex: string) => {
        try {
            const c = hex.replace('#', '');
            const r = parseInt(c.substring(0, 2), 16), g = parseInt(c.substring(2, 4), 16), b = parseInt(c.substring(4, 6), 16);
            return (r * 0.299 + g * 0.587 + b * 0.114) > 155 ? '#111' : '#fff';
        } catch { return '#fff'; }
    };
    const onColor = data.textColor || contrast(accent);

    const handleAction = async () => {
        const action = data.action || data.type || 'NONE';
        if (action === 'NONE') return;
        // Haptic feedback on capable devices (iOS/Android touchscreens)
        try { if (typeof navigator !== 'undefined' && 'vibrate' in navigator) (navigator as any).vibrate?.(8); } catch {}
        if (action === 'BACK') {
            const prev = popFromHistory();
            if (prev) window.dispatchEvent(new CustomEvent('pf-nav', { detail: { action: 'GO_TO', targetLayoutId: prev } }));
            else window.dispatchEvent(new CustomEvent('pf-nav', { detail: { action: 'BACK' } }));
        } else if (action === 'HOME') {
            window.dispatchEvent(new CustomEvent('pf-nav', { detail: { action: 'HOME' } }));
        } else if (action === 'RELOAD') {
            window.dispatchEvent(new CustomEvent('pf-nav', { detail: { action: 'RELOAD' } }));
        } else if (data.targetLayoutId) {
            window.dispatchEvent(new CustomEvent('pf-nav', { detail: { action: 'GO_TO', targetLayoutId: data.targetLayoutId } }));
        }
    };

    const tap: TargetAndTransition = { scale: 0.94, transition: { type: 'spring', stiffness: 500, damping: 22 } };

    // Base container that applies size/weight from data
    const base: React.CSSProperties = {
        borderRadius: radius,
        fontSize,
        fontWeight,
        cursor: 'pointer',
        letterSpacing: '0.04em',
    };

    // Compose inner (label + icon respecting iconPos)
    const IconEl = iconPos !== 'none' ? <AnyIcon style={{ width: '1.35em', height: '1.35em' }} /> : null;
    const inner = (
        iconPos === 'right' ? (<><span className="pf-btn-label">{label}</span>{IconEl}</>)
        : iconPos === 'top' ? (<div className="flex flex-col items-center gap-1.5">{IconEl}<span className="pf-btn-label">{label}</span></div>)
        : iconPos === 'none' ? (<span className="pf-btn-label">{label}</span>)
        : (<>{IconEl}<span className="pf-btn-label">{label}</span></>)
    );

    // Render templates — each APPLIES base (size/weight/radius) so admin controls are real.
    const renderBtn = () => {
        switch (template) {
            case 'SOLID':
                return <motion.button whileHover={{ scale: 1.02 }} whileTap={tap} onClick={handleAction}
                    className="w-full h-full min-h-14 flex items-center justify-center gap-3 px-6"
                    style={{ ...base, background: accent, color: onColor, boxShadow: shadow ? '0 6px 20px rgba(0,0,0,0.15)' : undefined }}>{inner}</motion.button>;

            case 'OUTLINE':
                return <motion.button whileHover={{ background: accent, color: onColor, scale: 1.02 }} whileTap={tap} onClick={handleAction}
                    className="w-full h-full min-h-14 border-2 flex items-center justify-center gap-3 px-6 transition-colors"
                    style={{ ...base, borderColor: accent, color: accent }}>{inner}</motion.button>;

            case 'PILL':
                return <motion.button whileHover={{ scale: 1.05 }} whileTap={tap} onClick={handleAction}
                    className="w-full h-full min-h-14 flex items-center justify-center gap-3 px-6"
                    style={{ ...base, borderRadius: 9999, background: accent, color: onColor, boxShadow: shadow ? '0 8px 20px rgba(0,0,0,0.2)' : undefined }}>{inner}</motion.button>;

            case 'GHOST':
                return <motion.button whileHover={{ background: accent + '22', scale: 1.02 }} whileTap={tap} onClick={handleAction}
                    className="w-full h-full min-h-14 flex items-center justify-center gap-3 px-6 transition-colors"
                    style={{ ...base, background: 'transparent', color: accent }}>{inner}</motion.button>;

            case 'ICON_ONLY':
                return <motion.button whileHover={{ scale: 1.1 }} whileTap={tap} onClick={handleAction}
                    className="w-full h-full aspect-square grid place-items-center mx-auto"
                    style={{ ...base, background: accent, color: onColor, maxWidth: '128px', boxShadow: shadow ? '0 10px 25px rgba(0,0,0,0.25)' : undefined }} title={label}>
                    <AnyIcon style={{ width: '2em', height: '2em' }} />
                </motion.button>;

            case 'HERO':
                return <motion.button whileHover={{ scale: 1.03, y: -2 }} whileTap={tap} onClick={handleAction}
                    className="w-full h-full min-h-16 flex items-center justify-between gap-4 px-8 relative overflow-hidden"
                    style={{ ...base, background: `linear-gradient(135deg, ${accent}, ${accent}cc)`, color: onColor, boxShadow: shadow ? `0 20px 40px -12px ${accent}88` : undefined }}>
                    <span style={{ fontStyle: 'italic', textTransform: 'uppercase' }} className="pf-btn-label">{label}</span>
                    <span className="rounded-full grid place-items-center bg-white/20 backdrop-blur-sm" style={{ width: '2.5em', height: '2.5em' }}>
                        <AnyIcon style={{ width: '1.3em', height: '1.3em' }} />
                    </span>
                </motion.button>;

            case 'CIRCULAR':
                return <div className="flex flex-col items-center justify-center gap-2 w-full h-full">
                    <motion.button whileHover={{ scale: 1.12 }} whileTap={tap} onClick={handleAction}
                        className="relative rounded-full flex items-center justify-center"
                        style={{ background: accent, boxShadow: shadow ? `0 15px 35px ${accent}66` : undefined, width: '4.5em', height: '4.5em' }}>
                        <motion.div animate={{ scale: [1, 1.4, 1], opacity: [0.3, 0, 0.3] }} transition={{ duration: 2, repeat: Infinity }}
                            className="absolute inset-0 rounded-full border-2" style={{ borderColor: accent }} />
                        <AnyIcon style={{ width: '1.8em', height: '1.8em', color: onColor }} />
                    </motion.button>
                    {label && <span className="uppercase tracking-widest opacity-70" style={{ fontSize: '0.75em', fontWeight }}>{label}</span>}
                </div>;

            case 'NEON':
                return <motion.button whileHover={{ scale: 1.03 }} whileTap={tap} onClick={handleAction}
                    className="w-full h-full min-h-14 border-2 flex items-center justify-center gap-3 px-6 relative overflow-hidden"
                    style={{ ...base, borderColor: accent, background: accent + '11', color: accent, boxShadow: `0 0 20px ${accent}55, inset 0 0 12px ${accent}22`, textTransform: 'uppercase' }}>
                    {inner}
                </motion.button>;

            case 'MINIMAL':
                return <motion.button whileHover={{ letterSpacing: '0.15em' }} whileTap={tap} onClick={handleAction}
                    className="w-full h-full min-h-12 flex items-center justify-center gap-3 border-b-2 border-transparent hover:border-current px-4"
                    style={{ ...base, background: 'transparent', color: accent, textTransform: 'uppercase' }}>{inner}</motion.button>;

            case '3D':
                return <motion.button whileHover={{ y: -2 }} whileTap={{ y: 2, scale: 0.97 }} onClick={handleAction}
                    className="w-full h-full min-h-14 flex items-center justify-center gap-3 px-6"
                    style={{ ...base, background: accent, color: onColor, boxShadow: `0 6px 0 ${accent}99, 0 10px 20px rgba(0,0,0,0.2)` }}>{inner}</motion.button>;

            case 'GRADIENT':
                return <motion.button whileHover={{ scale: 1.02 }} whileTap={tap} onClick={handleAction}
                    className="w-full h-full min-h-14 flex items-center justify-center gap-3 px-6"
                    style={{ ...base, background: `linear-gradient(135deg, ${accent}, #8b5cf6)`, color: '#fff', boxShadow: shadow ? `0 12px 30px -5px ${accent}66` : undefined }}>{inner}</motion.button>;

            // ============ NEW STYLES ============
            case 'RETRO':
                return <motion.button whileHover={{ scale: 1.02 }} whileTap={tap} onClick={handleAction}
                    className="w-full h-full min-h-14 flex items-center justify-center gap-3 px-6 border-4"
                    style={{ ...base, background: accent, color: onColor, borderColor: '#000', boxShadow: `6px 6px 0 #000`, fontFamily: '"Courier New", monospace', textTransform: 'uppercase' }}>{inner}</motion.button>;

            case 'SKEWED':
                return <motion.button whileHover={{ scale: 1.05 }} whileTap={tap} onClick={handleAction}
                    className="w-full h-full min-h-14 flex items-center justify-center gap-3 px-6"
                    style={{ ...base, background: accent, color: onColor, transform: 'skewX(-8deg)', boxShadow: shadow ? '0 8px 20px rgba(0,0,0,0.25)' : undefined }}>
                    <span style={{ transform: 'skewX(8deg)', display: 'inline-flex', alignItems: 'center', gap: '0.5em' }}>{inner}</span>
                </motion.button>;

            case 'STAMP':
                return <motion.button whileHover={{ scale: 1.05, rotate: -2 }} whileTap={tap} onClick={handleAction}
                    className="w-full h-full min-h-14 flex items-center justify-center gap-3 px-6 border-4 border-dashed"
                    style={{ ...base, background: 'transparent', color: accent, borderColor: accent, transform: 'rotate(-2deg)', textTransform: 'uppercase', fontStyle: 'italic' }}>{inner}</motion.button>;

            case 'BEVEL':
                return <motion.button whileHover={{ scale: 1.02 }} whileTap={tap} onClick={handleAction}
                    className="w-full h-full min-h-14 flex items-center justify-center gap-3 px-6"
                    style={{ ...base, background: `linear-gradient(180deg, ${accent}, ${accent}aa)`, color: onColor, boxShadow: `inset 0 2px 0 rgba(255,255,255,0.35), inset 0 -3px 0 rgba(0,0,0,0.25), 0 6px 14px rgba(0,0,0,0.25)` }}>{inner}</motion.button>;

            case 'GLOW':
                return <motion.button whileHover={{ scale: 1.05 }} whileTap={tap} onClick={handleAction}
                    className="w-full h-full min-h-14 flex items-center justify-center gap-3 px-6"
                    style={{ ...base, background: accent, color: onColor, boxShadow: `0 0 30px ${accent}, 0 0 60px ${accent}88, 0 0 90px ${accent}44` }}>{inner}</motion.button>;

            case 'EMBOSS':
                return <motion.button whileHover={{ scale: 1.02 }} whileTap={tap} onClick={handleAction}
                    className="w-full h-full min-h-14 flex items-center justify-center gap-3 px-6"
                    style={{ ...base, background: '#1a1d23', color: accent, boxShadow: 'inset 4px 4px 10px #0a0c10, inset -4px -4px 10px #2a2e37, 6px 6px 18px rgba(0,0,0,0.35)' }}>{inner}</motion.button>;

            case 'CYBER':
                return <motion.button whileHover={{ scale: 1.02 }} whileTap={tap} onClick={handleAction}
                    className="w-full h-full min-h-14 flex items-center justify-center gap-3 px-6"
                    style={{ ...base, background: '#0d1117', color: accent, border: `1px solid ${accent}`, boxShadow: `inset 0 0 40px ${accent}22, 0 0 20px ${accent}55`, fontFamily: '"Courier New", monospace', textTransform: 'uppercase', clipPath: 'polygon(0 0, calc(100% - 12px) 0, 100% 12px, 100% 100%, 12px 100%, 0 calc(100% - 12px))' }}>{inner}</motion.button>;

            case 'GLASS':
            default:
                return <motion.button whileHover={{ scale: 1.02 }} whileTap={tap} onClick={handleAction}
                    className="w-full h-full min-h-14 flex items-center justify-center gap-3 px-6 backdrop-blur-md border border-white/20"
                    style={{ ...base, background: accent + '44', color: '#fff', boxShadow: shadow ? `inset 0 1px 0 rgba(255,255,255,0.2), 0 8px 20px ${accent}33` : undefined }}>{inner}</motion.button>;
        }
    };

    return <div className="w-full h-full flex items-center justify-center">{renderBtn()}</div>;
};

export default NavButtonWidget;
