'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { Network, RefreshCw, Zap, Info } from 'lucide-react';
import { FlowMap } from '@/components/admin/FlowMap';

import { useRouter } from 'next/navigation';

let socket: Socket;

export default function FlowPage() {
    const router = useRouter();
    const [layouts, setLayouts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchLayouts = useCallback(() => {
        if (socket) {
            socket.emit('get_layouts');
        }
    }, []);

    useEffect(() => {
        socket = io();
        socket.on('connect', () => {
            setLoading(false);
            fetchLayouts();
        });
        socket.on('layouts_list', (data) => setLayouts(data));

        return () => { socket.disconnect(); };
    }, [fetchLayouts]);

    return (
        <div className="flex-1 flex flex-col min-h-0 bg-[#050505]">
            <AdminHeader
                title="Mapa de Navegación"
                subtitle="Visualización de flujos y conexiones"
                icon={<Network className="w-5 h-5" />}
                actions={
                    <div className="flex items-center gap-3 px-4 py-2 bg-blue-500/5 border border-blue-500/10 rounded-full">
                        <Info className="w-4 h-4 text-blue-500" />
                        <span className="text-[9px] font-black text-blue-500 uppercase tracking-widest">Arrastra los nodos para organizar el flujo</span>
                    </div>
                }
            />

            <div className="flex-1 overflow-hidden relative">
                <FlowMap
                    layouts={layouts}
                    onEditLayout={(l) => router.push(`/admin?id=${l._id}`)}
                />

                {/* Legend or Stats */}
                <div className="absolute bottom-8 left-10 p-6 bg-black/60 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl z-10 space-y-4">
                    <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.8)]" />
                        <span className="text-[10px] font-black text-white uppercase tracking-widest leading-none">Diseños Activos</span>
                        <span className="ml-auto text-[10px] font-mono text-blue-400 font-bold">{layouts.length}</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
                        <span className="text-[10px] font-black text-white uppercase tracking-widest leading-none">Interacciones</span>
                        <span className="ml-auto text-[10px] font-mono text-emerald-400 font-bold">42</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
