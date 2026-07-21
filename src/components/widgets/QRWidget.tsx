'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { QrCode, Smartphone, ExternalLink } from 'lucide-react';

interface QRWidgetProps {
    data: {
        title: string;
        url: string;
        subtitle?: string;
        bgColor?: string;
        qrColor?: string;
    };
}

const QRWidget: React.FC<QRWidgetProps> = ({ data }) => {
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(data.url || 'https://pixelflow.app')}&bgcolor=${(data.bgColor || 'ffffff').replace('#', '')}&color=${(data.qrColor || '000000').replace('#', '')}&margin=2`;

    return (
        <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            whileTap={{ scale: 0.95 }}
            className="w-full h-full p-4 flex flex-col items-center justify-center gap-4 group cursor-pointer select-none"
        >
            <div className="flex flex-col items-center gap-1 text-center">
                <div className="bg-blue-600 p-2 rounded-xl mb-2 shadow-lg shadow-blue-500/20 group-hover:scale-110 transition-transform">
                    <QrCode className="w-6 h-6 text-white" />
                </div>
                <h2 className="text-xl font-black uppercase tracking-tighter text-white">
                    {data.title || 'ESCANEAME'}
                </h2>
                <p className="text-[10px] text-blue-400 font-bold uppercase tracking-widest leading-tight">
                    {data.subtitle || 'Ver menú en tu móvil'}
                </p>
            </div>

            <div className="relative p-3 bg-white rounded-xl shadow-2xl transition-all duration-500 group-hover:rotate-3 group-hover:scale-105">
                <div className="w-32 h-32 md:w-40 md:h-40 overflow-hidden rounded-lg">
                    <img
                        src={qrUrl}
                        alt="QR Code"
                        className="w-full h-full object-contain"
                    />
                </div>
                {/* Decorative dots for a "tech" feel */}
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full border-2 border-white animate-pulse" />
                <div className="absolute -bottom-1 -left-1 w-3 h-3 bg-blue-500 rounded-full border-2 border-white animate-pulse" />
            </div>

            <div className="flex items-center gap-2 bg-white/5 px-4 py-2 rounded-full border border-white/5 opacity-60 group-hover:opacity-100 transition-opacity">
                <Smartphone className="w-3 h-3 text-neutral-400" />
                <span className="text-[9px] font-bold text-neutral-400 uppercase tracking-widest">Abre tu cámara</span>
            </div>

            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <ExternalLink className="w-4 h-4 text-white/20" />
            </div>
        </motion.div>
    );
};

export default QRWidget;
