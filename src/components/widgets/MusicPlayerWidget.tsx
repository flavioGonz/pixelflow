'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Music, Play, SkipBack, SkipForward, Disc } from 'lucide-react';

interface MusicPlayerWidgetProps {
    data: {
        song?: string;
        artist?: string;
        cover?: string;
        accentColor?: string;
    };
}

const MusicPlayerWidget: React.FC<MusicPlayerWidgetProps> = ({ data }) => {
    const accentColor = data.accentColor || '#10b981';

    return (
        <div className="w-full h-full flex flex-col p-8 bg-black/40 backdrop-blur-2xl rounded-3xl border border-white/5 shadow-2xl relative overflow-hidden group">
            {/* Background Glow */}
            <div className="absolute top-0 right-0 w-64 h-64 blur-[100px] opacity-20 -mr-20 -mt-20 group-hover:opacity-40 transition-opacity" style={{ backgroundColor: accentColor }} />

            <div className="flex-1 flex flex-col md:flex-row gap-8 items-center justify-center">
                {/* Vinyl / Cover */}
                <div className="relative">
                    <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                        className="w-40 h-40 md:w-56 md:h-56 rounded-full bg-neutral-900 border-[12px] border-black shadow-2xl overflow-hidden relative"
                    >
                        <img
                            src={data.cover || 'https://images.unsplash.com/photo-1508700115892-45ecd0562c3e?q=80&w=400'}
                            className="w-full h-full object-cover opacity-60"
                        />
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-12 h-12 bg-black rounded-full border-4 border-neutral-800" />
                        </div>
                    </motion.div>
                    <motion.div
                        className="absolute -bottom-4 -right-4 w-16 h-16 bg-white/10 backdrop-blur-md rounded-2xl border border-white/10 flex items-center justify-center shadow-2xl"
                        whileHover={{ scale: 1.1 }}
                    >
                        <Disc className="w-8 h-8 text-white animate-pulse" />
                    </motion.div>
                </div>

                {/* Song Info */}
                <div className="flex-1 text-center md:text-left">
                    <h4 className="text-[10px] font-black uppercase tracking-[0.5em] text-neutral-500 mb-2">NOW PLAYING</h4>
                    <h2 className="text-3xl md:text-5xl font-black italic text-white uppercase tracking-tighter mb-2 leading-none">
                        {data.song || 'SUMMER CHILL MIX'}
                    </h2>
                    <p className="text-xl font-bold text-neutral-400 italic mb-8">
                        {data.artist || 'ALTO ARAPEY RADIO'}
                    </p>

                    {/* Visualizer bars */}
                    <div className="flex items-end gap-1.5 h-12 justify-center md:justify-start">
                        {[...Array(12)].map((_, i) => (
                            <motion.div
                                key={i}
                                animate={{ height: [12, Math.random() * 40 + 8, 12] }}
                                transition={{ duration: 0.5 + Math.random(), repeat: Infinity, ease: "easeInOut" }}
                                className="w-2 rounded-full"
                                style={{ backgroundColor: accentColor }}
                            />
                        ))}
                    </div>
                </div>
            </div>

            {/* Controls Mockup */}
            <div className="mt-8 pt-8 border-t border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-6 text-neutral-500">
                    <SkipBack className="w-6 h-6 hover:text-white cursor-pointer transition-colors" />
                    <div className="w-12 h-12 rounded-full bg-white text-black flex items-center justify-center hover:scale-105 transition-all">
                        <Play className="w-6 h-6 fill-black ml-1" />
                    </div>
                    <SkipForward className="w-6 h-6 hover:text-white cursor-pointer transition-colors" />
                </div>
                <div className="flex items-center gap-3 text-[10px] font-black text-neutral-600">
                    <Music className="w-4 h-4" />
                    <span className="tracking-[0.2em] italic uppercase">89.5 FM • LIVE</span>
                </div>
            </div>
        </div>
    );
};

export default MusicPlayerWidget;
