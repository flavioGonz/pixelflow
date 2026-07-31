'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import LayoutIcon from 'lucide-react/dist/esm/icons/layout';
import ShoppingBag from 'lucide-react/dist/esm/icons/shopping-bag';
import RefreshCw from 'lucide-react/dist/esm/icons/refresh-cw';
import Calendar from 'lucide-react/dist/esm/icons/calendar';
import Database from 'lucide-react/dist/esm/icons/database';
import ImageIcon from 'lucide-react/dist/esm/icons/image';
import Smartphone from 'lucide-react/dist/esm/icons/smartphone';
import Network from 'lucide-react/dist/esm/icons/network';
import Radio from 'lucide-react/dist/esm/icons/radio';
import Settings2 from 'lucide-react/dist/esm/icons/settings-2';
import LogOut from 'lucide-react/dist/esm/icons/log-out';
import ChevronsLeft from 'lucide-react/dist/esm/icons/chevrons-left';
import ChevronsRight from 'lucide-react/dist/esm/icons/chevrons-right';
import ChevronDown from 'lucide-react/dist/esm/icons/chevron-down';
import Moon from 'lucide-react/dist/esm/icons/moon';
import MenuIcon from 'lucide-react/dist/esm/icons/menu';

interface AdminSidebarProps {
    expanded: boolean;
    onToggle: () => void;
}

interface MenuItem {
    icon: React.ElementType;
    label: string;
    href: string;
    id: string;
}

interface Section {
    id: string;
    label: string;
    href?: string; // if present, section header is linkable
    items: MenuItem[];
}

const sections: Section[] = [
    {
        id: 'operacion',
        label: 'Operación',
        items: [
            { icon: LayoutIcon, label: 'Studio', href: '/admin', id: 'editor' },
            { icon: Smartphone, label: 'Pantallas', href: '/admin/screens', id: 'screens' },
            { icon: Calendar, label: 'Rutinas', href: '/admin/schedules', id: 'schedules' },
            { icon: Network, label: 'Mapa', href: '/admin/flow', id: 'flow' },
            { icon: Moon, label: 'Screensaver', href: '/admin/screensaver', id: 'screensaver' },
            { icon: MenuIcon, label: 'Menú principal', href: '/admin/bottomnav', id: 'bottomnav' },
        ],
    },
    {
        id: 'contenido',
        label: 'Contenido',
        href: '/admin/layouts',
        items: [
            { icon: Database, label: 'Interfaces', href: '/admin/layouts', id: 'layouts' },
            { icon: ImageIcon, label: 'Biblioteca', href: '/admin/media', id: 'media' },
            { icon: ShoppingBag, label: 'Productos', href: '/admin/products', id: 'products' },
            { icon: RefreshCw, label: 'Actividades', href: '/admin/activities', id: 'activities' },
            { icon: Radio, label: 'Sensores', href: '/admin/sensors', id: 'sensors' },
        ],
    },
];

const SidebarItem: React.FC<{ item: MenuItem; expanded: boolean; active: boolean }> = ({ item, expanded, active }) => {
    const Icon = item.icon;
    return (
        <Link href={item.href} className="block">
            <button
                data-active={active}
                className={"group relative w-full flex items-center gap-3 rounded-md transition-colors duration-200 " + (expanded ? 'h-9 px-3' : 'h-9 px-0 justify-center') + ' ' + (active ? 'text-primary' : 'text-muted-foreground hover:text-foreground hover:bg-accent')}
            >
                {active && (
                    <motion.span
                        layoutId="sidebar-active-bg"
                        className="absolute inset-0 rounded-md bg-primary/10"
                        transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                    />
                )}
                {active && (
                    <span aria-hidden className="absolute left-0 top-1.5 bottom-1.5 w-[3px] rounded-r-full bg-primary" />
                )}
                <Icon className="relative shrink-0" size={18} strokeWidth={1.75} />
                {expanded && (
                    <span className="relative text-[13px] font-medium tracking-tight whitespace-nowrap">
                        {item.label}
                    </span>
                )}
                {!expanded && (
                    <span
                        role="tooltip"
                        className="pointer-events-none absolute left-full ml-3 px-2.5 py-1 rounded-md text-[11px] font-medium tracking-tight whitespace-nowrap z-50 bg-popover text-popover-foreground border shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                        {item.label}
                    </span>
                )}
            </button>
        </Link>
    );
};

interface CollapsibleSectionProps {
    section: Section;
    expanded: boolean;
    open: boolean;
    onToggle: () => void;
    pathname: string;
}

const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({ section, expanded, open, onToggle, pathname }) => {
    // Section is "active" if any of its items match pathname
    const sectionActive = section.items.some((it) => pathname === it.href) || (section.href && pathname === section.href);
    if (!expanded) {
        // Collapsed sidebar: no headers, just show icons (as before)
        return (
            <div className="flex flex-col gap-0.5 pt-2">
                {section.items.map((item) => (
                    <SidebarItem key={item.id} item={item} expanded={false} active={pathname === item.href} />
                ))}
            </div>
        );
    }
    const HeaderContent = (
        <>
            <span className={"text-[10px] font-bold uppercase tracking-[0.18em] " + (sectionActive ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground')}>
                {section.label}
            </span>
            <motion.span
                animate={{ rotate: open ? 0 : -90 }}
                transition={{ duration: 0.2 }}
                className="ml-auto flex items-center text-muted-foreground group-hover:text-foreground"
            >
                <ChevronDown size={12} strokeWidth={2} />
            </motion.span>
        </>
    );
    return (
        <div className="pt-3">
            {section.href ? (
                <div className="flex items-stretch">
                    <Link href={section.href} className="flex-1 group flex items-center gap-2 px-3 py-1.5 rounded-md hover:bg-accent/50 transition-colors">
                        <span className={"text-[10px] font-bold uppercase tracking-[0.18em] " + (sectionActive ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground')}>
                            {section.label}
                        </span>
                    </Link>
                    <button
                        onClick={onToggle}
                        aria-label={open ? `Colapsar ${section.label}` : `Expandir ${section.label}`}
                        className="group px-2 py-1.5 rounded-md hover:bg-accent/50 transition-colors"
                    >
                        <motion.span
                            animate={{ rotate: open ? 0 : -90 }}
                            transition={{ duration: 0.2 }}
                            className="flex items-center text-muted-foreground group-hover:text-foreground"
                        >
                            <ChevronDown size={12} strokeWidth={2} />
                        </motion.span>
                    </button>
                </div>
            ) : (
                <button
                    onClick={onToggle}
                    aria-label={open ? `Colapsar ${section.label}` : `Expandir ${section.label}`}
                    className="group w-full flex items-center gap-2 px-3 py-1.5 rounded-md hover:bg-accent/50 transition-colors"
                >
                    {HeaderContent}
                </button>
            )}
            <AnimatePresence initial={false}>
                {open && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                        className="overflow-hidden"
                    >
                        <div className="flex flex-col gap-0.5 pt-1">
                            {section.items.map((item) => (
                                <SidebarItem key={item.id} item={item} expanded={true} active={pathname === item.href} />
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

const SECTIONS_STATE_KEY = 'pf:sidebar-sections-open';

export const AdminSidebar: React.FC<AdminSidebarProps> = ({ expanded, onToggle }) => {
    const pathname = usePathname();

    // Track open/closed state of each section
    const [openSections, setOpenSections] = useState<Record<string, boolean>>(() => ({ operacion: true, contenido: true }));

    useEffect(() => {
        try {
            const v = localStorage.getItem(SECTIONS_STATE_KEY);
            if (v) setOpenSections((prev) => ({ ...prev, ...JSON.parse(v) }));
        } catch { /* ignore */ }
    }, []);

    const toggleSection = (id: string) => {
        setOpenSections((prev) => {
            const next = { ...prev, [id]: !prev[id] };
            try { localStorage.setItem(SECTIONS_STATE_KEY, JSON.stringify(next)); } catch { /* ignore */ }
            return next;
        });
    };

    return (
        <motion.aside
            initial={false}
            animate={{ width: expanded ? 224 : 64 }}
            transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
            className="relative h-screen flex flex-col z-50 sticky top-0 border-r bg-card text-card-foreground"
        >
            {/* Brand */}
            <div className={"h-16 flex items-center " + (expanded ? 'px-4' : 'justify-center')}>
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-md flex items-center justify-center font-bold text-primary-foreground text-sm shrink-0 bg-primary shadow-sm">
                        PF
                    </div>
                    {expanded && (
                        <div className="overflow-hidden">
                            <div className="text-[14px] font-bold tracking-tight font-heading text-foreground">
                                PixelFlow
                            </div>
                            <div className="text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
                                Studio
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <div className="border-b" />

            {/* Sections */}
            <nav className={"flex-1 overflow-y-auto custom-scrollbar " + (expanded ? 'px-2 pt-1' : 'px-2 pt-2') + ' pb-4'}>
                {sections.map((section) => (
                    <CollapsibleSection
                        key={section.id}
                        section={section}
                        expanded={expanded}
                        open={openSections[section.id] !== false}
                        onToggle={() => toggleSection(section.id)}
                        pathname={pathname || ''}
                    />
                ))}
            </nav>

            {/* Footer */}
            <div className="border-t flex flex-col gap-0.5 py-2">
                <div className="px-2">
                    <SidebarItem
                        item={{ icon: Settings2, label: 'Configuración', href: '/admin/settings', id: 'settings' }}
                        expanded={expanded}
                        active={(pathname || '').startsWith('/admin/settings')}
                    />
                </div>

                <div className="px-2">
                    <button
                        onClick={async () => {
                            await fetch('/api/auth/logout', { method: 'POST' });
                            window.location.href = '/login';
                        }}
                        className={"group relative w-full flex items-center gap-3 rounded-md transition-colors duration-200 " + (expanded ? 'h-9 px-3' : 'h-9 px-0 justify-center') + ' text-muted-foreground hover:text-destructive hover:bg-destructive/10'}
                        title="Cerrar sesión"
                    >
                        <LogOut size={18} strokeWidth={1.75} />
                        {expanded && <span className="text-[13px] font-medium">Cerrar sesión</span>}
                        {!expanded && (
                            <span role="tooltip" className="pointer-events-none absolute left-full ml-3 px-2.5 py-1 rounded-md text-[11px] font-medium whitespace-nowrap z-50 bg-popover text-popover-foreground border shadow-md opacity-0 group-hover:opacity-100 transition-opacity">
                                Cerrar sesión
                            </span>
                        )}
                    </button>
                </div>

                <div className="px-2 pt-1">
                    <button
                        onClick={onToggle}
                        aria-label={expanded ? 'Colapsar menú' : 'Expandir menú'}
                        title={expanded ? 'Colapsar menú' : 'Expandir menú'}
                        className={"group relative w-full flex items-center gap-3 rounded-md transition-colors duration-200 " + (expanded ? 'h-8 px-3 justify-between' : 'h-8 px-0 justify-center') + ' text-muted-foreground hover:text-foreground hover:bg-accent'}
                    >
                        {expanded && (
                            <span className="text-[10px] font-medium uppercase tracking-[0.16em]">
                                Colapsar
                            </span>
                        )}
                        {expanded ? (
                            <ChevronsLeft size={16} strokeWidth={1.75} />
                        ) : (
                            <ChevronsRight size={16} strokeWidth={1.75} />
                        )}
                    </button>
                </div>
            </div>
        </motion.aside>
    );
};
