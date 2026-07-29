'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Calendar from 'lucide-react/dist/esm/icons/calendar';
import RefreshCw from 'lucide-react/dist/esm/icons/refresh-cw';

interface Tab {
    href: string;
    label: string;
    icon: React.ElementType;
}

const tabs: Tab[] = [
    { href: '/admin/schedules', label: 'Rutinas de pantalla', icon: Calendar },
    { href: '/admin/activities', label: 'Actividades del hotel', icon: RefreshCw },
];

export const ScheduleSubNav: React.FC = () => {
    const pathname = usePathname();
    return (
        <div className="px-6 pt-2 pb-3 border-b bg-card/40">
            <div className="inline-flex items-center gap-1 rounded-lg p-1 bg-muted">
                {tabs.map((t) => {
                    const Icon = t.icon;
                    const active = pathname === t.href;
                    return (
                        <Link
                            key={t.href}
                            href={t.href}
                            className={'inline-flex items-center gap-2 px-3.5 py-1.5 rounded-md text-[12px] font-medium transition-colors ' + (
                                active
                                    ? 'bg-background text-foreground shadow-sm'
                                    : 'text-muted-foreground hover:text-foreground hover:bg-background/50'
                            )}
                        >
                            <Icon className="size-3.5" />
                            {t.label}
                        </Link>
                    );
                })}
            </div>
        </div>
    );
};
