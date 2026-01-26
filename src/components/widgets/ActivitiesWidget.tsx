'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Clock, ChevronRight, Sparkles, MapPin, Loader2 } from 'lucide-react';

interface ActivityItem {
    category: string;
    time: string;
    title: string;
    desc?: string;
    photo?: string;
}

interface ActivitiesWidgetProps {
    data: {
        title: string;
        items: ActivityItem[];
        sectionToShow?: string; // New: Specific category to show
    };
}

const ActivitiesWidget: React.FC<ActivitiesWidgetProps> = ({ data }) => {
    // Filter by specific section if selected
    const filteredItems = data.items?.filter(item => {
        if (data.sectionToShow && data.sectionToShow !== 'ALL') {
            return item.category === data.sectionToShow;
        }
        return true;
    }) || [];

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.08 }
        }
    };

    const itemVariants = {
        hidden: { y: 20, opacity: 0, scale: 0.98 },
        visible: {
            y: 0,
            opacity: 1,
            scale: 1,
            transition: { type: 'spring', stiffness: 200, damping: 25 }
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="w-full h-full text-white p-6 md:p-10 flex flex-col overflow-hidden relative bg-transparent font-sans"
        >
            {/* Minimal Background Pattern */}
            <div className="absolute inset-0 opacity-[0.02] pointer-events-none"
                style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '30px 30px' }} />

            {/* Elegant Header */}
            <header className="flex flex-col items-center mb-10 md:mb-16 relative z-10 text-center">
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="flex items-center gap-4 text-emerald-500/60 mb-3"
                >
                    <div className="w-10 h-[1px] bg-emerald-500/20" />
                    <Sparkles className="w-4 h-4" />
                    <span className="text-[9px] font-black uppercase tracking-[0.6em] italic">Agenda del Día</span>
                    <div className="w-10 h-[1px] bg-emerald-500/20" />
                </motion.div>

                <h2 className="text-4xl md:text-7xl font-black italic tracking-tighter uppercase leading-none drop-shadow-2xl">
                    {data.title || (data.sectionToShow && data.sectionToShow !== 'ALL' ? data.sectionToShow : 'Cronograma')}
                </h2>
            </header>

            <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="flex-1 overflow-y-auto custom-scrollbar-hidden flex flex-col gap-6 md:gap-8 pr-2 relative z-10 pb-20"
            >
                <AnimatePresence mode="popLayout">
                    {filteredItems.map((item, idx) => (
                        <motion.div
                            key={`${item.title}-${idx}`}
                            variants={itemVariants}
                            whileHover={{ x: 5 }}
                            className="group flex gap-6 md:gap-10 border-b border-white/[0.05] pb-6 md:pb-8 last:border-0 items-center"
                        >
                            {/* Time Pillar */}
                            <div className="flex flex-col items-center justify-start min-w-[80px] md:min-w-[120px]">
                                <span className="text-3xl md:text-5xl font-black text-emerald-400 italic font-mono leading-none tracking-tighter drop-shadow-lg">
                                    {item.time?.split(' ')[0] || '00:00'}
                                </span>
                                <span className="text-[8px] md:text-[10px] font-black text-neutral-500 uppercase tracking-widest mt-1">
                                    {item.time?.split(' ')[1] || 'HRS'}
                                </span>
                            </div>

                            {/* Main Content */}
                            <div className="flex-1 space-y-2">
                                <div className="flex items-center gap-3">
                                    <span className="text-[7px] md:text-[9px] font-black px-2 py-0.5 bg-emerald-500/10 text-emerald-400 rounded border border-emerald-500/20 uppercase tracking-[0.2em] italic">
                                        {item.category}
                                    </span>
                                    <div className="h-[1px] flex-1 bg-white/[0.05]" />
                                </div>
                                <h3 className="text-xl md:text-3xl font-black text-neutral-100 uppercase tracking-tighter group-hover:text-emerald-400 transition-colors leading-tight">
                                    {item.title}
                                </h3>
                                <p className="text-neutral-500 text-xs md:text-sm italic font-medium leading-relaxed max-w-xl line-clamp-2 md:line-clamp-none">
                                    {item.desc || 'Actividad programada para su disfrute y relax.'}
                                </p>
                            </div>

                            {/* Preview Image (Hide on small layouts if needed) */}
                            <div className="hidden sm:block w-32 h-20 md:w-56 md:h-36 rounded-xl overflow-hidden border border-white/10 relative bg-neutral-900 group-hover:border-emerald-500/30 transition-all duration-500 shadow-2xl">
                                <img
                                    src={item.photo || `https://images.unsplash.com/photo-1540575467063-178a50c2df87?q=80&w=400`}
                                    className="w-full h-full object-cover transition-all duration-700 group-hover:scale-105"
                                    alt={item.title}
                                />
                                <div className="absolute inset-0 bg-emerald-900/10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>

                {filteredItems.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-20 opacity-20">
                        <Calendar className="w-16 h-16 mb-4 text-emerald-500" />
                        <p className="text-[10px] font-black uppercase tracking-[0.5em]">No hay eventos activos</p>
                    </div>
                )}
            </motion.div>


        </motion.div >
    );
};

export default ActivitiesWidget;
