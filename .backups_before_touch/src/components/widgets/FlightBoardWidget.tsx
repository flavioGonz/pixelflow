'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { PlaneTakeoff, PlaneLanding, Clock } from 'lucide-react';

interface Flight {
    id: string;
    flight: string;
    originDest: string;
    time: string;
    gate: string;
    status: 'ON TIME' | 'BOARDING' | 'DELAYED' | 'LANDED';
}

interface FlightBoardWidgetProps {
    data: {
        type?: 'DEPARTURES' | 'ARRIVALS';
        flights?: Flight[];
    };
}

const defaultFlights: Flight[] = [
    { id: '1', flight: 'LA 2410', originDest: 'SÃO PAULO (GRU)', time: '14:35', gate: 'B12', status: 'BOARDING' },
    { id: '2', flight: 'AR 1302', originDest: 'BUENOS AIRES (AEP)', time: '15:10', gate: 'A05', status: 'ON TIME' },
    { id: '3', flight: 'IB 6841', originDest: 'MADRID (MAD)', time: '16:45', gate: 'C22', status: 'ON TIME' },
    { id: '4', flight: 'G3 7650', originDest: 'RIO DE JANEIRO (GIG)', time: '17:20', gate: 'B02', status: 'DELAYED' },
    { id: '5', flight: 'AA 908', originDest: 'MIAMI (MIA)', time: '21:05', gate: 'E14', status: 'ON TIME' },
];

const FlightBoardWidget: React.FC<FlightBoardWidgetProps> = ({ data }) => {
    const flights = (data.flights && data.flights.length > 0) ? data.flights : defaultFlights;
    const type = data.type || 'DEPARTURES';

    return (
        <div className="w-full h-full bg-[#0a0a0a] rounded-3xl border border-white/5 overflow-hidden flex flex-col font-mono shadow-2xl">
            {/* Board Header */}
            <div className="bg-blue-600 p-6 flex items-center justify-between text-white border-b border-blue-500/50">
                <div className="flex items-center gap-4">
                    {type === 'DEPARTURES' ? <PlaneTakeoff className="w-8 h-8" /> : <PlaneLanding className="w-8 h-8" />}
                    <div>
                        <h2 className="text-2xl font-black italic uppercase tracking-tighter">
                            {type === 'DEPARTURES' ? 'SALIDAS / DEPARTURES' : 'LLEGADAS / ARRIVALS'}
                        </h2>
                        <p className="text-[10px] font-bold opacity-70 tracking-[0.3em]">INFORMACIÓN EN TIEMPO REAL</p>
                    </div>
                </div>
                <div className="flex items-center gap-3 bg-black/20 px-4 py-2 rounded-xl">
                    <Clock className="w-4 h-4" />
                    <span className="text-lg font-black italic">13:10</span>
                </div>
            </div>

            {/* Table Header */}
            <div className="grid grid-cols-12 gap-4 px-8 py-4 bg-white/5 text-neutral-500 text-[10px] font-black uppercase tracking-widest border-b border-white/5">
                <div className="col-span-2">Vuelo</div>
                <div className="col-span-4">Destino</div>
                <div className="col-span-2 text-center">Hora</div>
                <div className="col-span-2 text-center">Puerta</div>
                <div className="col-span-2 text-right">Estado</div>
            </div>

            {/* Flight Rows */}
            <div className="flex-1 overflow-hidden">
                {flights.map((f, idx) => (
                    <motion.div
                        key={f.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        className="grid grid-cols-12 gap-4 px-8 py-5 border-b border-white/5 hover:bg-white/[0.02] transition-colors items-center"
                    >
                        <div className="col-span-2 text-blue-400 font-black italic text-lg">{f.flight}</div>
                        <div className="col-span-4 text-white font-black text-lg truncate uppercase">{f.originDest}</div>
                        <div className="col-span-2 text-emerald-400 font-black text-center text-xl italic">{f.time}</div>
                        <div className="col-span-2 text-white font-black text-center text-lg">{f.gate}</div>
                        <div className="col-span-2 text-right">
                            <span className={`text-[10px] font-black px-3 py-1 rounded-full ${f.status === 'DELAYED' ? 'bg-red-500/20 text-red-500' :
                                f.status === 'BOARDING' ? 'bg-blue-500/20 text-blue-500 animate-pulse' :
                                    'bg-emerald-500/20 text-emerald-500'}`}>
                                {f.status}
                            </span>
                        </div>
                    </motion.div>
                ))}
            </div>

            <div className="p-4 bg-white/5 text-[9px] text-neutral-600 font-bold uppercase tracking-[0.5em] text-center">
                Consulte con su aerolínea para cambios de último momento
            </div>
        </div>
    );
};

export default FlightBoardWidget;
