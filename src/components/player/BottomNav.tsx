'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import * as Icons from 'lucide-react';

export type BottomNavItem = {
    id?: string;
    icon?: string;
    label?: string;
    action?: 'GO_TO' | 'BACK' | 'HOME' | 'OPEN_SUBMENU';
    layoutId?: string;
    color?: string;
    children?: BottomNavItem[];
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
    defaultLayoutId?: string;
    /** absolute posiciona relativo al contenedor (para preview). fixed = pantalla (default player). */
    positionMode?: 'fixed' | 'absolute';
}

/**
 * BottomNav con navegación jerárquica (sub-menús).
 * Cuando un item tiene children[], al tocarlo la barra hace slide iOS mostrando los sub-items,
 * con un botón "← Atrás" al inicio para volver al nivel anterior.
 */
export const BottomNav: React.FC<BottomNavProps> = ({ config, currentLayoutId, defaultLayoutId, positionMode = 'fixed' }) => {
    // Stack de navegación: cada elemento es una lista de items (nivel actual).
    const [stack, setStack] = React.useState<BottomNavItem[][]>([]);
    const [direction, setDirection] = React.useState<'push' | 'pop'>('push');

    // Al cambiar el config, resetear al root
    React.useEffect(() => {
        setStack([]);
        setDirection('push');
    }, [config?.items]);

    if (!config?.enabled) return null;
    const isAwayFromHome = !!(defaultLayoutId && currentLayoutId && currentLayoutId !== defaultLayoutId);
    const rawItems = (config.items || []).map((it) => {
        // Si estamos fuera del home, mutar action=HOME → action=BACK (label 'Atrás', ícono ChevronLeft)
        if (isAwayFromHome && it && it.action === 'HOME') {
            return { ...it, _isMutatedBack: true, action: 'BACK' as any, label: 'Atrás', icon: 'ChevronLeft' };
        }
        return it;
    });
    const rootItems = rawItems.filter(it => it && (
        it.action === 'BACK' || it.action === 'HOME' ||
        (it.action === 'GO_TO' && it.layoutId) ||
        (it.children && it.children.length > 0)
    ));
    if (rootItems.length === 0) return null;

    const currentItems = stack.length > 0 ? stack[stack.length - 1] : rootItems;
    const isSubmenu = stack.length > 0;

    const accent = config.accentColor || '#0ea5e9';
    const showLabels = config.showLabels !== false;
    const theme = config.theme || 'glass';

    const themeClass = theme === 'solid-dark'
        ? 'bg-black/90 text-white border-white/10'
        : theme === 'solid-light'
            ? 'bg-white/95 text-slate-900 border-black/10'
            : 'bg-white/40 text-slate-900 backdrop-blur-3xl backdrop-saturate-200 border-white/40 shadow-slate-900/25';

    const enterSubmenu = (item: BottomNavItem) => {
        if (!item.children || item.children.length === 0) return;
        setDirection('push');
        setStack(prev => [...prev, item.children!]);
    };

    const goBack = () => {
        setDirection('pop');
        setStack(prev => prev.slice(0, -1));
    };

    const handleTap = (item: BottomNavItem) => {
        if (item.children && item.children.length > 0) {
            enterSubmenu(item);
            return;
        }
        if (typeof window === 'undefined') return;
        window.dispatchEvent(new CustomEvent('pf-nav', {
            detail: {
                action: item.action || 'GO_TO',
                targetLayoutId: item.layoutId,
            },
        }));
    };

    const resolveIcon = (name?: string): React.ComponentType<{ className?: string }> => {
        if (!name) return (Icons as any).Circle;
        return (Icons as any)[name] || (Icons as any)[capitalize(name)] || (Icons as any).Circle;
    };

    const positionClass = positionMode === 'absolute'
        ? 'absolute left-1/2 -translate-x-1/2 bottom-3'
        : 'fixed left-1/2 -translate-x-1/2 bottom-4';

    const renderItem = (item: BottomNavItem, key: string | number) => {
        const iconIsUrl = !!(item.icon && (item.icon.startsWith('/uploads/') || item.icon.startsWith('http') || item.icon.startsWith('data:')));
        const Icon = iconIsUrl ? null : resolveIcon(item.icon);
        const isActive = item.action === 'GO_TO' && !!item.layoutId && item.layoutId === currentLayoutId;
        const isSpecial = item.action === 'BACK' || item.action === 'HOME';
        const hasChildren = !!(item.children && item.children.length > 0);
        const itemColor = item.color || (isActive ? accent : undefined);
        return (
            <motion.button
                key={key}
                whileTap={{ scale: 0.88 }}
                whileHover={{ y: -2 }}
                transition={{ type: 'spring', stiffness: 600, damping: 20 }}
                onClick={() => handleTap(item)}
                className={
                    'relative flex flex-col items-center justify-center gap-0.5 rounded-xl transition-colors shrink-0 ' +
                    (showLabels ? 'min-w-[70px] px-3 py-2' : 'size-14') +
                    (isActive ? ' bg-slate-900/15' : ' hover:bg-slate-900/10 active:bg-slate-900/20')
                }
                style={{ scrollSnapAlign: 'center', color: itemColor }}
            >
                {iconIsUrl ? (
                    <img src={item.icon} alt="" className={showLabels ? 'size-6 object-contain' : 'size-7 object-contain'} draggable={false} />
                ) : Icon ? (
                    <Icon className={showLabels ? 'size-6' : 'size-7'} />
                ) : null}
                {showLabels && item.label && (
                    <span className={'text-[10px] font-bold uppercase tracking-wider truncate max-w-[90px] ' + (theme === 'glass' || theme === 'solid-light' ? '' : 'text-white/95')}>
                        {item.label}
                    </span>
                )}
                {(isSpecial || hasChildren) && (
                    <span className='absolute top-0.5 right-1 text-[8px] uppercase font-black tracking-widest opacity-40'>
                        {hasChildren ? '›' : item.action === 'BACK' ? '←' : '⌂'}
                    </span>
                )}
            </motion.button>
        );
    };

    return (
        <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.15, duration: 0.4, ease: [0.32, 0.72, 0, 1] }}
            className={positionClass + ' z-[200] pointer-events-auto pf-bottomnav'}
            style={{ maxWidth: 'calc(100% - 24px)' }}
        >
            <div
                className={'relative flex items-center gap-1 px-2 py-1.5 rounded-2xl border overflow-hidden ' + themeClass}
                style={{
                    boxShadow: '0 20px 60px -10px rgba(0,0,0,0.6), 0 8px 24px -8px rgba(0,0,0,0.4)',
                    minHeight: 68,
                }}
            >
                {/* Botón atrás (aparece solo si estás en submenu) */}
                <AnimatePresence>
                    {isSubmenu && (
                        <motion.button
                            key="back"
                            initial={{ x: -30, opacity: 0, scale: 0.8 }}
                            animate={{ x: 0, opacity: 1, scale: 1 }}
                            exit={{ x: -30, opacity: 0, scale: 0.8 }}
                            transition={{ duration: 0.2, ease: [0.32, 0.72, 0, 1] }}
                            onClick={goBack}
                            className="shrink-0 flex flex-col items-center justify-center gap-0.5 min-w-[54px] h-14 rounded-xl hover:bg-white/10 active:bg-white/20 mr-1 border-r border-white/10 pr-2"
                            aria-label="Atrás"
                        >
                            <ChevronLeftIcon />
                            {showLabels && (
                                <span className={'text-[9px] font-bold uppercase tracking-widest ' + (theme === 'glass' || theme === 'solid-light' ? '' : 'text-white/70')}>Atrás</span>
                            )}
                        </motion.button>
                    )}
                </AnimatePresence>

                {/* Items del nivel actual con transición slide iOS */}
                <div className="flex-1 overflow-x-auto overflow-y-hidden pf-bottomnav-scroll" style={{ WebkitOverflowScrolling: 'touch', scrollBehavior: 'smooth', scrollSnapType: 'x proximity' }}>
                    <AnimatePresence mode="wait" custom={direction}>
                        <motion.div
                            key={stack.length}
                            custom={direction}
                            variants={{
                                enter: (dir: 'push' | 'pop') => ({ x: dir === 'pop' ? '-40%' : '40%', opacity: 0 }),
                                center: { x: 0, opacity: 1 },
                                exit: (dir: 'push' | 'pop') => ({ x: dir === 'pop' ? '40%' : '-40%', opacity: 0 }),
                            }}
                            initial="enter"
                            animate="center"
                            exit="exit"
                            transition={{ duration: 0.28, ease: [0.32, 0.72, 0, 1] }}
                            className="flex items-center gap-1"
                        >
                            {currentItems.map((item, i) => renderItem(item, item.id || i))}
                        </motion.div>
                    </AnimatePresence>
                </div>
            </div>
        </motion.div>
    );
};

const ChevronLeftIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M15 18l-6-6 6-6" />
    </svg>
);

function capitalize(s: string): string { return s ? s.charAt(0).toUpperCase() + s.slice(1) : s; }

export default BottomNav;
