'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import LayoutIcon from 'lucide-react/dist/esm/icons/layout';
import ShoppingBag from 'lucide-react/dist/esm/icons/shopping-bag';
import RefreshCw from 'lucide-react/dist/esm/icons/refresh-cw';
import Calendar from 'lucide-react/dist/esm/icons/calendar';
import Database from 'lucide-react/dist/esm/icons/database';
import Smartphone from 'lucide-react/dist/esm/icons/smartphone';
import Network from 'lucide-react/dist/esm/icons/network';
import Settings2 from 'lucide-react/dist/esm/icons/settings-2';
import LogOut from 'lucide-react/dist/esm/icons/log-out';
import ChevronsLeft from 'lucide-react/dist/esm/icons/chevrons-left';
import ChevronsRight from 'lucide-react/dist/esm/icons/chevrons-right';

interface AdminSidebarProps {
    expanded: boolean;
    onToggle: () => void;
}

interface MenuItem {
    icon: React.ElementType;
    label: string;
    href: string;
    id: string;
    section?: 'main' | 'content';
}

const menuItems: MenuItem[] = [
    { icon: LayoutIcon, label: 'Studio', href: '/admin', id: 'editor', section: 'main' },
    { icon: Smartphone, label: 'Pantallas', href: '/admin/screens', id: 'screens', section: 'main' },
    { icon: Calendar, label: 'Cronograma', href: '/admin/schedules', id: 'schedules', section: 'main' },
    { icon: Network, label: 'Mapa', href: '/admin/flow', id: 'flow', section: 'main' },
    { icon: Database, label: 'Diseños', href: '/admin/layouts', id: 'layouts', section: 'content' },
    { icon: ShoppingBag, label: 'Productos', href: '/admin/products', id: 'products', section: 'content' },
    { icon: RefreshCw, label: 'Actividades', href: '/admin/activities', id: 'activities', section: 'content' },
];

interface SidebarItemProps {
    item: MenuItem;
    expanded: boolean;
    active: boolean;
}

const SidebarItem: React.FC<SidebarItemProps> = ({ item, expanded, active }) => {
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

export const AdminSidebar: React.FC<AdminSidebarProps> = ({ expanded, onToggle }) => {
    const pathname = usePathname();
    const mainItems = menuItems.filter((m) => m.section === 'main');
    const contentItems = menuItems.filter((m) => m.section === 'content');

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
            <nav className={"flex-1 overflow-y-auto custom-scrollbar " + (expanded ? 'px-2 pt-3' : 'px-2 pt-2') + ' pb-4'}>
                <SectionLabel expanded={expanded}>Operación</SectionLabel>
                <div className="flex flex-col gap-0.5">
                    {mainItems.map((item) => (
                        <SidebarItem key={item.id} item={item} expanded={expanded} active={pathname === item.href} />
                    ))}
                </div>

                <div className={"mt-4 " + (expanded ? '' : 'border-t pt-2')}>
                    <SectionLabel expanded={expanded}>Contenido</SectionLabel>
                    <div className="flex flex-col gap-0.5">
                        {contentItems.map((item) => (
                            <SidebarItem key={item.id} item={item} expanded={expanded} active={pathname === item.href} />
                        ))}
                    </div>
                </div>
            </nav>

            {/* Footer */}
            <div className="border-t flex flex-col gap-0.5 py-2">
                <div className={expanded ? 'px-2' : 'px-2'}>
                    <SidebarItem
                        item={{ icon: Settings2, label: 'Configuración', href: '/admin/settings', id: 'settings' }}
                        expanded={expanded}
                        active={pathname === '/admin/settings'}
                    />
                </div>

                <div className={expanded ? 'px-2' : 'px-2'}>
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

                <div className={expanded ? 'px-2 pt-1' : 'px-2 pt-1'}>
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

const SectionLabel: React.FC<{ children: React.ReactNode; expanded: boolean }> = ({ children, expanded }) => {
    if (!expanded) return <div className="h-1" />;
    return (
        <div className="px-3 pt-2 pb-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
            {children}
        </div>
    );
};
