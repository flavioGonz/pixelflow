'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import User from 'lucide-react/dist/esm/icons/user';
import Settings from 'lucide-react/dist/esm/icons/settings';
import LogOut from 'lucide-react/dist/esm/icons/log-out';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

export function UserMenu() {
    const router = useRouter();

    const handleLogout = async () => {
        try {
            await fetch('/api/auth/logout', { method: 'POST' });
            router.push('/login');
        } catch (error) {
            console.error('Logout failed', error);
        }
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger
                aria-label="Menú de usuario"
                title="Menú de usuario"
                className="rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 hover:opacity-90 transition-opacity cursor-pointer"
            >
                <Avatar className="size-8">
                    <AvatarFallback className="bg-primary text-primary-foreground text-[12px] font-bold">
                        A
                    </AvatarFallback>
                </Avatar>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="flex flex-col gap-0.5">
                    <span className="text-[13px] font-semibold">Admin User</span>
                    <span className="text-[11px] font-normal text-muted-foreground truncate">admin@pixelflow.com</span>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />

                <DropdownMenuItem onClick={() => router.push('/admin/profile')} className="cursor-pointer">
                    <User className="size-4" />
                    <span>Perfil</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push('/admin/settings')} className="cursor-pointer">
                    <Settings className="size-4" />
                    <span>Configuración</span>
                </DropdownMenuItem>

                <DropdownMenuSeparator />

                <DropdownMenuItem
                    onClick={handleLogout}
                    className="text-destructive focus:text-destructive cursor-pointer"
                >
                    <LogOut className="size-4" />
                    <span>Cerrar sesión</span>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
