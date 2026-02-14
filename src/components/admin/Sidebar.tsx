'use client';


import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    ShoppingBag, RefreshCw, Database, Smartphone, Network,
    Calendar, Settings2, Layout as LayoutIcon, LogOut
} from 'lucide-react';
import { motion } from 'framer-motion';

export const AdminSidebar = () => {
    const pathname = usePathname();

    const menuItems = [
        { icon: LayoutIcon, label: 'Editor', href: '/admin', id: 'editor' },
        { icon: ShoppingBag, label: 'Productos', href: '/admin/products', id: 'products' },
        { icon: RefreshCw, label: 'Actividades', href: '/admin/activities', id: 'activities' },
        { icon: Calendar, label: 'Cronograma', href: '/admin/schedules', id: 'schedules' },
        { icon: Database, label: 'Diseños', href: '/admin/layouts', id: 'layouts' },
        { icon: Smartphone, label: 'Pantallas', href: '/admin/screens', id: 'screens' },
        { icon: Network, label: 'Mapa', href: '/admin/flow', id: 'flow' },
    ];

    return (
        <aside className="w-16 bg-[#0a0a0a] border-r border-white/5 flex flex-col items-center py-8 gap-6 z-50 sticky top-0 h-screen custom-scrollbar">
            <div className="mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center font-bold text-white text-xs">
                    PF
                </div>
            </div>

            {menuItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                    <Link key={item.id} href={item.href}>
                        <button
                            className={`p-3 rounded-xl transition-all relative group ${isActive ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-neutral-500 hover:text-white hover:bg-white/5'}`}
                            title={item.label}
                        >
                            <item.icon className="w-5 h-5" />
                            {!isActive && (
                                <div className="absolute left-full ml-4 px-2 py-1 bg-black text-white text-[10px] font-bold rounded opacity-0 group-hover:opacity-100 whitespace-nowrap pointer-events-none transition-opacity z-50">
                                    {item.label}
                                </div>
                            )}
                        </button>
                    </Link>
                );
            })}

            <div className="mt-auto flex flex-col gap-6">
                <Link href="/admin/settings">
                    <button
                        className={`p-3 rounded-xl transition-all group relative ${pathname === '/admin/settings' ? 'bg-blue-600 text-white' : 'text-neutral-500 hover:text-white hover:bg-white/5'}`}
                        title="Configuración"
                    >
                        <Settings2 className="w-5 h-5" />
                        <div className="absolute left-full ml-4 px-2 py-1 bg-black text-white text-[10px] font-bold rounded opacity-0 group-hover:opacity-100 whitespace-nowrap pointer-events-none transition-opacity z-50">
                            Configuración
                        </div>
                    </button>
                </Link>

                <button
                    onClick={async () => {
                        await fetch('/api/auth/logout', { method: 'POST' });
                        window.location.href = '/login';
                    }}
                    className="p-3 rounded-xl text-red-500/50 hover:text-red-500 hover:bg-red-500/5 transition-all group relative"
                    title="Cerrar Sesión"
                >
                    <LogOut className="w-5 h-5" />
                    <div className="absolute left-full ml-4 px-2 py-1 bg-black text-white text-[10px] font-bold rounded opacity-0 group-hover:opacity-100 whitespace-nowrap pointer-events-none transition-opacity z-50">
                        Cerrar Sesión
                    </div>
                </button>
            </div>
        </aside>
    );
};
