'use client';

import React from 'react';
import { motion } from 'framer-motion';
import * as Icons from 'lucide-react';

export type BottomNavItem = {
    icon?: string;
    label?: string;
    action?: 'GO_TO' | 'BACK' | 'HOME';
    layoutId?: string;
    color?: string;
};

export type BottomNavConfig = {
    enabled?: boolean;
    showLabels?: boolean;
    accentColor?: string;
    theme?: 'glass' | 'solid-dark' | 'solid-light';
    items?: BottomNavItem[];
};

interface BottomNavProps {
    config?: BottomNavConfig;
    currentLayoutId?: string;
}

/**
 * Barra flotante bottom-nav estilo iOS.
 * Se renderiza fixed bottom sobre el lienzo del player.
 * Cada item dispara pf-nav CustomEvent que el player captura.
 */
export const BottomNav: React.FC<BottomNavProps> = ({ config, currentLayoutId }) => {
    if (!config?.enabled) return null;
    const items = (config.items || []).filter(it => it && (it.action !== 'GO_TO' || it.layoutId));
    if (items.length === 0) return null;

    const accent = config.accentColor || '#0ea5e9';
    const showLabels = config.showLabels !== false;
    const theme = config.theme || 'glass';

    const themeClass = theme === 'solid-dark'
        ? 'bg-black/90 text-white border border-white/10'
        : theme === 'solid-light'
            ? 'bg-white/95 text-slate-900 border border-black/10 shadow-2xl'
            : 'bg-black/40 text-white backdrop-blur-xl border border-white/15 shadow-2xl';

    const handleTap = (item: BottomNavItem) => {
        if (typeof window === 'undefined') return;
        window.dispatchEvent(new CustomEvent('pf-nav', {
            detail: {
                action: item.action || 'GO_TO',
                targetLayoutId: item.layoutId,
            },
        }));
    };

    // Resolver ícono de lucide-react por nombre
    const resolveIcon = (name?: string) => {
        if (!name) return Icons.Circle;
        const fallback: any = (Icons as any)[name] || (Icons as any)[capitalize(name)] || Icons.Circle;
        return fallback;
    };

    return (
        <motion.div
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.35, ease: [0.32, 0.72, 0, 1] }}
            className="fixed left-1/2 -translate-x-1/2 bottom-4 z-[200] pointer-events-auto"
            style={{ maxWidth: '90vw' }}
        >
            <div className={"flex items-center gap-1 px-2 py-1.5 rounded-2xl " + themeClass} style={{ boxShadow: '0 12px 40px rgba(0,0,0,0.4)' }}>
                {items.map((item, i) => {
                    const Icon = resolveIcon(item.icon);
                    const isActive = item.action === 'GO_TO' && !!item.layoutId && item.layoutId === currentLayoutId;
                    const isBack = item.action === 'BACK';
                    const isHome = item.action === 'HOME';
                    const itemColor = item.color || (isActive ? accent : undefined);
                    return (
                        <motion.button
                            key={i}
                            whileTap={{ scale: 0.9 }}
                            whileHover={{ y: -2 }}
                            transition={{ type: 'spring', stiffness: 500, damping: 22 }}
                            onClick={() => handleTap(item)}
                            className={
                                "relative flex flex-col items-center justify-center gap-0.5 rounded-xl transition-all " +
                                (showLabels ? "min-w-[68px] px-3 py-2" : "size-14") +
                                (isActive ? " bg-white/15" : " hover:bg-white/10 active:bg-white/20")
                            }
                            style={itemColor ? { color: itemColor } : undefined}
                        >
                            <Icon className={showLabels ? "size-6" : "size-7"} />
                            {showLabels && item.label && (
                                <span className="text-[10px] font-bold uppercase tracking-wider truncate max-w-[80px]">
                                    {item.label}
                                </span>
                            )}
                            {(isBack || isHome) && (
                                <span className="absolute top-1 right-1 text-[8px] uppercase font-black tracking-widest opacity-40">{isBack ? '←' : '⌂'}</span>
                            )}
                        </motion.button>
                    );
                })}
            </div>
        </motion.div>
    );
};

function capitalize(s: string): string {
    return s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
}

export default BottomNav;
