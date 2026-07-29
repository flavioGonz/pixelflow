'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Music, Radio, ChevronRight, CheckCircle2, XCircle } from 'lucide-react';

interface IntegrationCard {
    href: string;
    name: string;
    tagline: string;
    icon: React.ElementType;
    color: string;
    connected?: boolean;
    status?: string;
}

export default function IntegrationsPage() {
    const [spotify, setSpotify] = React.useState<{ connected: boolean; userDisplayName?: string }>({ connected: false });
    const [ewelink, setEwelink] = React.useState<{ enabled: boolean; email?: string }>({ enabled: false });

    React.useEffect(() => {
        fetch('/api/spotify/settings').then(r => r.json()).then(setSpotify).catch(() => {});
        fetch('/api/ewelink/settings').then(r => r.json()).then(setEwelink).catch(() => {});
    }, []);

    const items: IntegrationCard[] = [
        {
            href: '/admin/settings/spotify',
            name: 'Spotify',
            tagline: 'Reproducir música en los widgets del player',
            icon: Music,
            color: 'emerald',
            connected: !!spotify.connected,
            status: spotify.connected ? (spotify.userDisplayName || 'Conectado') : 'Sin conectar',
        },
        {
            href: '/admin/settings/integrations/ewelink',
            name: 'eWeLink Sonoff',
            tagline: 'Traer lecturas de sensores IoT del hotel',
            icon: Radio,
            color: 'sky',
            connected: !!ewelink.enabled,
            status: ewelink.enabled ? (ewelink.email || 'Configurado') : 'Sin configurar',
        },
    ];

    return (
        <div className="space-y-4">
            <div>
                <h2 className="text-xl font-bold tracking-tight">Integraciones</h2>
                <p className="text-[13px] text-muted-foreground">Conectá servicios externos que los widgets pueden usar.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {items.map((item, idx) => {
                    const Icon = item.icon;
                    const colorMap: Record<string, string> = {
                        emerald: 'bg-emerald-500/10 text-emerald-500 ring-emerald-500/20',
                        sky: 'bg-sky-500/10 text-sky-500 ring-sky-500/20',
                    };
                    return (
                        <motion.div
                            key={item.href}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.05 }}
                        >
                            <Link href={item.href} className="block group">
                                <div className="rounded-xl border bg-card p-5 hover:border-primary/50 hover:shadow-lg transition-all">
                                    <div className="flex items-start gap-3">
                                        <div className={`size-12 rounded-xl grid place-items-center ring-1 shrink-0 ${colorMap[item.color]}`}>
                                            <Icon className="size-5" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <div className="font-bold tracking-tight truncate">{item.name}</div>
                                                {item.connected
                                                    ? <span className="inline-flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold uppercase tracking-wide"><CheckCircle2 className="size-3" /> ON</span>
                                                    : <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground font-semibold uppercase tracking-wide"><XCircle className="size-3" /> OFF</span>}
                                            </div>
                                            <div className="text-[12px] text-muted-foreground truncate">{item.tagline}</div>
                                            <div className="text-[11px] text-muted-foreground/80 mt-1 truncate">{item.status}</div>
                                        </div>
                                        <ChevronRight className="size-4 text-muted-foreground/40 group-hover:text-foreground transition-colors mt-1 shrink-0" />
                                    </div>
                                </div>
                            </Link>
                        </motion.div>
                    );
                })}
            </div>
        </div>
    );
}
