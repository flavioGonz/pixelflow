'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { Settings2, Lock, Plug, User, Bell, Palette, Sliders } from 'lucide-react';

interface NavItem {
    href: string;
    label: string;
    description: string;
    icon: React.ElementType;
    match: (p: string) => boolean;
}

const NAV: NavItem[] = [
    {
        href: '/admin/settings',
        label: 'General',
        description: 'Seguridad, credenciales de acceso',
        icon: Lock,
        match: (p) => p === '/admin/settings' || p === '/admin/settings/',
    },
    {
        href: '/admin/settings/integrations',
        label: 'Integraciones',
        description: 'Spotify, eWeLink y otros conectores',
        icon: Plug,
        match: (p) => p.startsWith('/admin/settings/integrations') || p.startsWith('/admin/settings/spotify'),
    },
];

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname() || '';

    return (
        <div className="flex-1 flex flex-col min-h-0 bg-background">
            <AdminHeader
                title="Configuración"
                subtitle="Preferencias, seguridad e integraciones del sistema"
                icon={<Settings2 className="w-5 h-5" />}
            />

            <div className="flex-1 overflow-hidden flex">
                {/* Sidebar */}
                <aside className="w-64 shrink-0 border-r bg-card/50 backdrop-blur-sm overflow-y-auto custom-scrollbar hidden md:block">
                    <div className="p-4 space-y-1">
                        <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground px-3 pt-2 pb-2">
                            Ajustes
                        </div>
                        {NAV.map((item) => {
                            const Icon = item.icon;
                            const active = item.match(pathname);
                            return (
                                <Link key={item.href} href={item.href} className="block">
                                    <motion.div
                                        whileHover={{ x: 2 }}
                                        className={
                                            'group relative rounded-lg px-3 py-2.5 flex items-start gap-3 transition-colors ' +
                                            (active
                                                ? 'bg-primary/10 text-primary'
                                                : 'text-foreground/80 hover:bg-accent hover:text-foreground')
                                        }
                                    >
                                        {active && (
                                            <motion.div
                                                layoutId="settings-nav-active"
                                                className="absolute left-0 top-2 bottom-2 w-0.5 bg-primary rounded-full"
                                                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                                            />
                                        )}
                                        <div className={
                                            'size-8 rounded-md grid place-items-center shrink-0 transition-colors ' +
                                            (active
                                                ? 'bg-primary/15 text-primary'
                                                : 'bg-muted text-muted-foreground group-hover:bg-accent-foreground/5')
                                        }>
                                            <Icon className="size-4" strokeWidth={1.75} />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <div className="text-[13px] font-semibold truncate leading-tight">{item.label}</div>
                                            <div className="text-[11px] text-muted-foreground truncate leading-tight mt-0.5">{item.description}</div>
                                        </div>
                                    </motion.div>
                                </Link>
                            );
                        })}
                    </div>
                </aside>

                {/* Content */}
                <div className="flex-1 overflow-y-auto custom-scrollbar">
                    <div className="p-6 md:p-8 max-w-5xl mx-auto">
                        {children}
                    </div>
                </div>
            </div>
        </div>
    );
}
