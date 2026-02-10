'use client';

import React, { useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePathname } from 'next/navigation';
import { ChevronLeft, ChevronRight, LayoutGrid, Circle, Command, Layers, Ghost, Target, Star, Compass } from 'lucide-react';
import { usePlayerStore } from '@/store/usePlayerStore';
import { io, Socket } from 'socket.io-client';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Autoplay, FreeMode } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';

let navSocket: Socket | null = null;

type NavLayout = 'HORIZONTAL' | 'VERTICAL';
type NavTemplate = 'CARDS' | 'FLOATING' | 'GLAS_TILES' | 'STRIPS' | 'NEON_GLOW' | 'BRUTALIST' | 'HOLOGRAPHIC' | 'MAC_DOCK' | 'BENTO';

interface CategoryItem {
    id: string;
    label: string;
    icon: string;
    photo?: string;
    active: boolean;
    targetLayoutId?: string;
    bucketColor?: string;
    overlayColor?: string;
    overlayOpacity?: number;
}

interface CategoryNavWidgetProps {
    data: {
        title?: string;
        categories: CategoryItem[];
        accentColor?: string;
        layout?: NavLayout;
        columns?: number;
        template?: NavTemplate; // Using template to match admin panel
    };
}

const CategoryNavWidget: React.FC<CategoryNavWidgetProps> = ({ data }) => {
    const { selectedCategory, setSelectedCategory, screenId } = usePlayerStore();
    const pathname = usePathname();
    const isAdmin = pathname?.includes('/admin');

    const layout = data.layout || 'HORIZONTAL';
    const template = data.template || 'CARDS';
    const accentColor = data.accentColor || '#f59e0b';
    const columns = data.columns || 3;
    const swiperRef = useRef<any>(null);

    useEffect(() => {
        if (!navSocket && !isAdmin) {
            navSocket = io();
        }
    }, [isAdmin]);

    const springConfig = isAdmin
        ? { type: 'tween' as const, duration: 0.2 }
        : { type: 'spring' as const, stiffness: 400, damping: 30, mass: 1 };

    const playClickSound = () => {
        try {
            // Short, subtle click sound (base64 encoded WAV)
            const clickSound = 'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=';
            // Real subtle click (using a tiny silent buffer just to trigger audio context if needed, but actually let's use a real short beep base64 if possible, or just rely on visual if we can't generate one. 
            // Better yet, let's use a standard "pop" sound base64.
            // This is a very short "pop" sound.
            const audioStr = 'data:audio/wav;base64,UklGRl9vT1BXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YU'; // This is incomplete/invalid.

            // Let's use a known working short Base64 click.
            const audio = new Audio('https://codeskulptor-demos.commondatastorage.googleapis.com/pang/pop.mp3');
            audio.volume = 0.3;
            audio.play().catch(e => console.warn("Audio play blocked", e));

            // Haptic feedback
            if (navigator.vibrate) {
                navigator.vibrate(15); // Short 15ms vibration
            }
        } catch (e) { console.error("Audio error", e) }
    };

    const handleCategoryClick = (cat: CategoryItem) => {
        playClickSound(); // Play sound on interaction
        if (isAdmin) {
            setSelectedCategory(cat.label);
            return;
        }

        if (cat.targetLayoutId && screenId) {
            if (!navSocket) navSocket = io();
            navSocket.emit('request_layout', {
                screenId: screenId,
                layoutId: cat.targetLayoutId
            });
        }
        setSelectedCategory(cat.label);
    };

    const renderButtonContent = (cat: CategoryItem, index: number) => {
        const isActive = selectedCategory === cat.label;

        const entryAnimation = {
            initial: { opacity: 0, scale: 0.8, y: 30 },
            animate: {
                opacity: 1,
                scale: 1,
                y: 0,
                transition: { ...springConfig, delay: isAdmin ? 0 : index * 0.05 }
            }
        };

        // Stronger tactile feel: Scale down more, move down slightly implies physical button press
        const tapEffect = {
            scale: 0.92,
            y: 4,
            filter: 'brightness(0.8)',
            transition: { duration: 0.1, ease: 'easeInOut' as const }
        };

        // --- TEMPLATES ---

        if (template === 'GLAS_TILES') {
            return (
                <motion.button
                    key={cat.id}
                    variants={entryAnimation}
                    initial="initial"
                    animate="animate"
                    whileTap={tapEffect}
                    onClick={() => handleCategoryClick(cat)}
                    className={`group relative w-full aspect-square rounded-3xl overflow-hidden border-2 transition-all duration-700 flex flex-col items-center justify-center p-6 backdrop-blur-3xl ${isActive ? 'bg-white/10 shadow-[0_0_40px_rgba(255,255,255,0.1)]' : 'bg-black/20 border-white/5'}`}
                    style={{ borderColor: isActive ? accentColor : 'rgba(255,255,255,0.05)' }}
                >
                    <div className="text-xl md:text-3xl font-black uppercase tracking-tighter italic text-center text-white drop-shadow-md z-10 transition-transform group-active:scale-95">
                        {cat.label}
                    </div>
                    {isActive && (
                        <motion.div
                            layoutId="active-glow"
                            className="absolute -inset-4 bg-white/5 blur-2xl rounded-full"
                        />
                    )}
                </motion.button>
            );
        }

        if (template === 'FLOATING') {
            return (
                <motion.button
                    key={cat.id}
                    variants={entryAnimation}
                    initial="initial"
                    animate="animate"
                    whileTap={tapEffect}
                    onClick={() => handleCategoryClick(cat)}
                    className="group flex flex-col items-center gap-4 transition-all"
                >
                    <div
                        className={`w-20 h-20 md:w-32 md:h-32 rounded-full flex items-center justify-center border-4 transition-all duration-500 shadow-2xl ${isActive ? 'scale-110 rotate-12' : 'scale-100 hover:scale-105'}`}
                        style={{
                            backgroundColor: isActive ? accentColor : 'rgba(255,255,255,0.05)',
                            borderColor: isActive ? 'white' : 'rgba(255,255,255,0.1)',
                            boxShadow: isActive ? `0 0 30px ${accentColor}88` : 'none'
                        }}
                    >
                        <span className={`text-3xl md:text-5xl transition-all ${isActive ? 'text-black' : 'text-white/40'}`}>
                            {index + 1}
                        </span>
                    </div>
                    <span className={`text-xs md:text-sm font-black uppercase tracking-[0.3em] italic text-center transition-opacity ${isActive ? 'opacity-100 text-white' : 'opacity-40 text-neutral-400'}`}>
                        {cat.label}
                    </span>
                </motion.button>
            );
        }

        if (template === 'STRIPS') {
            return (
                <motion.button
                    key={cat.id}
                    variants={entryAnimation}
                    initial="initial"
                    animate="animate"
                    whileTap={tapEffect}
                    onClick={() => handleCategoryClick(cat)}
                    className={`relative w-full h-24 md:h-32 rounded-2xl overflow-hidden flex items-center px-10 border-2 transition-all duration-500 ${isActive ? 'bg-white text-black' : 'bg-transparent border-white/10 text-white'}`}
                    style={{ borderColor: isActive ? accentColor : undefined }}
                >
                    <div className="flex-1 flex flex-col items-start">
                        <span className="text-2xl md:text-4xl font-black uppercase italic tracking-tighter leading-none">{cat.label}</span>
                        <span className={`text-[10px] font-bold tracking-[0.2em] mt-1 ${isActive ? 'text-black/50' : 'text-white/30'}`}>EXPLORAR SECCIÓN</span>
                    </div>
                    <ChevronRight className={`w-8 h-8 transition-transform ${isActive ? 'translate-x-0' : '-translate-x-4 opacity-0'}`} />
                </motion.button>
            );
        }

        if (template === 'NEON_GLOW') {
            return (
                <motion.button
                    key={cat.id}
                    variants={entryAnimation}
                    initial="initial"
                    animate="animate"
                    whileTap={tapEffect}
                    onClick={() => handleCategoryClick(cat)}
                    className={`group relative w-full aspect-[16/9] rounded-xl flex flex-col items-center justify-center border-2 transition-all duration-500 overflow-hidden ${isActive ? 'shadow-[0_0_30px_rgba(0,0,0,0.5)]' : 'bg-black/40 border-white/5'}`}
                    style={{
                        borderColor: isActive ? accentColor : undefined,
                        boxShadow: isActive ? `0 0 20px ${accentColor}66, inset 0 0 20px ${accentColor}33` : undefined
                    }}
                >
                    <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />
                    <span className={`text-xl md:text-3xl font-black uppercase italic tracking-widest drop-shadow-2xl transition-all ${isActive ? 'scale-110' : 'text-neutral-500'}`} style={{ color: isActive ? accentColor : undefined }}>
                        {cat.label}
                    </span>
                    {isActive && (
                        <motion.div
                            layoutId="neon-line"
                            className="absolute bottom-4 h-1 w-12 rounded-full"
                            style={{ backgroundColor: accentColor, boxShadow: `0 0 15px ${accentColor}` }}
                        />
                    )}
                </motion.button>
            );
        }

        if (template === 'BRUTALIST') {
            return (
                <motion.button
                    key={cat.id}
                    variants={entryAnimation}
                    initial="initial"
                    animate="animate"
                    whileTap={{ x: 4, y: 4 }}
                    onClick={() => handleCategoryClick(cat)}
                    className={`relative w-full aspect-video border-4 flex flex-col items-start justify-end p-6 transition-all ${isActive ? 'bg-white text-black -translate-x-2 -translate-y-2' : 'bg-neutral-900 border-neutral-700 text-neutral-500'}`}
                    style={{
                        borderColor: isActive ? 'white' : undefined,
                        boxShadow: isActive ? `8px 8px 0px ${accentColor}` : '0px 0px 0px transparent'
                    }}
                >
                    <span className="text-3xl md:text-5xl font-black uppercase italic leading-[0.8] mb-2">{cat.label}</span>
                    <div className="w-12 h-2 bg-current" />
                </motion.button>
            );
        }

        if (template === 'HOLOGRAPHIC') {
            return (
                <motion.button
                    key={cat.id}
                    variants={entryAnimation}
                    initial="initial"
                    animate="animate"
                    whileTap={tapEffect}
                    onClick={() => handleCategoryClick(cat)}
                    className={`relative w-full aspect-[4/3] rounded-[2rem] overflow-hidden flex flex-col items-center justify-center p-8 transition-all duration-700 border-2 ${isActive ? 'border-white/40' : 'border-white/5 bg-white/5'}`}
                >
                    <div className={`absolute inset-0 opacity-30 transition-opacity ${isActive ? 'opacity-100' : 'group-hover:opacity-50'}`}
                        style={{
                            background: isActive
                                ? `linear-gradient(135deg, ${accentColor}aa, #ff0080aa, #7000ffaa, #00eeffaa)`
                                : 'transparent',
                            filter: 'blur(30px)'
                        }}
                    />
                    <div className="relative z-10 text-center">
                        <span className={`text-2xl md:text-4xl font-black uppercase tracking-tighter italic block ${isActive ? 'text-white' : 'text-white/20'}`}>
                            {cat.label}
                        </span>
                        <div className={`mt-4 h-0.5 w-full bg-gradient-to-r from-transparent via-white/50 to-transparent transition-transform duration-1000 ${isActive ? 'scale-x-100' : 'scale-x-0'}`} />
                    </div>
                </motion.button>
            );
        }

        if (template === 'MAC_DOCK') {
            return (
                <motion.button
                    key={cat.id}
                    variants={entryAnimation}
                    initial="initial"
                    animate="animate"
                    whileHover={{ scale: 1.25, y: -20 }}
                    whileTap={tapEffect}
                    onClick={() => handleCategoryClick(cat)}
                    className="group relative flex flex-col items-center gap-2"
                >
                    <div className={`w-20 h-20 md:w-32 md:h-32 rounded-3xl flex items-center justify-center shadow-2xl transition-all duration-500 border-t border-white/20 ${isActive ? 'bg-white shadow-[0_20px_40px_rgba(0,0,0,0.3)]' : 'bg-neutral-800/80 backdrop-blur-md'}`}
                        style={{ backgroundColor: isActive ? accentColor : undefined }}
                    >
                        <span className={`text-4xl md:text-6xl ${isActive ? 'text-white' : 'text-white/30'}`}>
                            {cat.label.charAt(0).toUpperCase()}
                        </span>
                    </div>
                    <AnimatePresence>
                        {isActive && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0 }}
                                className="w-2 h-2 rounded-full bg-white shadow-[0_0_10px_white]"
                            />
                        )}
                    </AnimatePresence>
                    <div className="absolute -top-12 opacity-0 group-hover:opacity-100 transition-opacity bg-black/80 backdrop-blur-md px-4 py-2 rounded-xl border border-white/10 whitespace-nowrap pointer-events-none">
                        <span className="text-[10px] font-black uppercase tracking-widest text-white">{cat.label}</span>
                    </div>
                </motion.button>
            );
        }

        if (template === 'BENTO') {
            return (
                <motion.button
                    key={cat.id}
                    variants={entryAnimation}
                    initial="initial"
                    animate="animate"
                    whileTap={tapEffect}
                    onClick={() => handleCategoryClick(cat)}
                    className={`relative w-full h-full min-h-[160px] rounded-[1.5rem] p-6 flex flex-col justify-between transition-all duration-500 border-2 ${isActive ? 'bg-white text-black border-transparent shadow-2xl' : 'bg-[#111] border-white/5 text-white/40'}`}
                >
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isActive ? 'bg-black/5' : 'bg-white/5'}`}>
                        <Layers className={`w-5 h-5 ${isActive ? 'text-black' : 'text-neutral-600'}`} />
                    </div>
                    <div className="flex flex-col items-start gap-1">
                        <span className="text-[10px] font-black uppercase tracking-widest opacity-50">EXPLORAR</span>
                        <span className="text-xl md:text-3xl font-black uppercase italic tracking-tighter leading-none">{cat.label}</span>
                    </div>
                    {isActive && (
                        <div className="absolute top-6 right-6 w-3 h-3 rounded-full bg-blue-500 animate-pulse" style={{ backgroundColor: accentColor }} />
                    )}
                </motion.button>
            );
        }

        // --- DEFAULT: CARDS ---
        return (
            <motion.button
                key={cat.id}
                variants={entryAnimation}
                initial="initial"
                animate="animate"
                whileTap={tapEffect}
                onClick={() => handleCategoryClick(cat)}
                className={`group relative w-full ${layout === 'VERTICAL' ? 'min-h-[200px] h-full' : 'aspect-[4/5] md:aspect-[3/4]'} rounded-2xl overflow-hidden border-2 transition-all duration-700 flex flex-col justify-end p-6 md:p-10 shadow-2xl ${isActive ? 'shadow-[0_20px_60px_rgba(245,158,11,0.5)] z-10' : 'border-white/5'}`}
                style={{ borderColor: isActive ? accentColor : 'rgba(255,255,255,0.08)' }}
            >
                {cat.photo && (
                    <div className="absolute inset-0 overflow-hidden transform-gpu bg-neutral-900 border-2 border-transparent">
                        <motion.img
                            src={cat.photo}
                            className={`w-full h-full object-cover transition-opacity duration-[1.5s] ${isActive ? 'opacity-100' : 'opacity-70 group-hover:opacity-100'}`}
                            animate={{ scale: isActive ? 1.15 : 1 }}
                            transition={springConfig}
                            alt={cat.label}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/20 to-transparent" />
                    </div>
                )}

                <div className="relative z-10 flex flex-col items-center w-full pb-4">
                    <div className="flex flex-col items-center gap-2 w-full">
                        <span className="text-2xl md:text-5xl font-black uppercase tracking-tighter italic text-center text-white drop-shadow-[0_5px_15px_rgba(0,0,0,1)] leading-tight">
                            {cat.label}
                        </span>
                        <motion.div
                            initial={false}
                            animate={{ width: isActive ? '100%' : '0%' }}
                            transition={springConfig}
                            className="h-1.5 rounded-full"
                            style={{ backgroundColor: accentColor }}
                        />
                    </div>
                </div>

                {isActive && (
                    <motion.div
                        layoutId="active-frame"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="absolute inset-0 border-[8px] border-amber-500/30 pointer-events-none"
                    />
                )}
            </motion.button>
        );
    };

    const renderHeader = () => {
        if (!data.title) return null;
        return (
            <header className="mb-10 md:mb-16 text-center relative z-10 w-full px-12">
                <h2 className="text-4xl md:text-7xl font-black text-white italic tracking-tighter uppercase leading-[0.85] drop-shadow-2xl">
                    {data.title}
                </h2>
            </header>
        );
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className={`w-full h-full flex flex-col items-center p-2 md:p-4 overflow-hidden relative font-sans bg-transparent ${layout === 'VERTICAL' ? 'justify-start' : 'justify-center'}`}
        >
            {renderHeader()}

            <div className={`w-full h-full relative group ${layout === 'VERTICAL' ? 'overflow-y-auto custom-scrollbar-hidden' : 'flex-1 flex items-center'}`}>
                {layout === 'HORIZONTAL' ? (
                    <>
                        <motion.button
                            onClick={() => swiperRef.current?.slidePrev()}
                            className="absolute left-0 top-1/2 -translate-y-1/2 z-20 w-12 h-24 md:w-16 md:h-40 bg-white/5 hover:bg-white/10 border-r border-white/10 rounded-r-2xl flex items-center justify-center text-white/50 hover:text-white transition-all backdrop-blur-md shadow-2xl active:scale-95"
                        >
                            <ChevronLeft className="w-8 h-8 md:w-12 md:h-12" />
                        </motion.button>

                        <motion.button
                            onClick={() => swiperRef.current?.slideNext()}
                            className="absolute right-0 top-1/2 -translate-y-1/2 z-20 w-12 h-24 md:w-16 md:h-40 bg-white/5 hover:bg-white/10 border-l border-white/10 rounded-l-2xl flex items-center justify-center text-white/50 hover:text-white transition-all backdrop-blur-md shadow-2xl active:scale-95"
                        >
                            <ChevronRight className="w-8 h-8 md:w-12 md:h-12" />
                        </motion.button>

                        <Swiper
                            modules={[Navigation, Autoplay, FreeMode]}
                            onSwiper={(swiper) => (swiperRef.current = swiper)}
                            spaceBetween={template === 'MAC_DOCK' ? 40 : 20}
                            slidesPerView={template === 'MAC_DOCK' ? 4 : 1.5}
                            centeredSlides={template === 'MAC_DOCK'}
                            freeMode={true}
                            grabCursor={true}
                            breakpoints={{
                                640: { slidesPerView: template === 'MAC_DOCK' ? 5 : 2.5, spaceBetween: 25 },
                                1024: { slidesPerView: template === 'MAC_DOCK' ? 6 : 3.5, spaceBetween: 30 },
                                1440: { slidesPerView: template === 'MAC_DOCK' ? 8 : 4.5, spaceBetween: 35 }
                            }}
                            className="w-full !overflow-visible"
                        >
                            {data.categories?.map((cat, idx) => (
                                <SwiperSlide key={cat.id} className="h-auto pb-10">
                                    <AnimatePresence mode="popLayout" initial={false}>
                                        {renderButtonContent(cat, idx)}
                                    </AnimatePresence>
                                </SwiperSlide>
                            ))}
                        </Swiper>
                    </>
                ) : (
                    <div
                        className="grid gap-2 md:gap-4 w-full h-full content-start"
                        style={{
                            gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`
                        }}
                    >
                        <AnimatePresence mode="popLayout" initial={false}>
                            {data.categories?.map((cat, idx) => (
                                <div key={cat.id} className="w-full">
                                    {renderButtonContent(cat, idx)}
                                </div>
                            ))}
                        </AnimatePresence>
                    </div>
                )}
            </div>

            <style jsx global>{`
                .swiper-button-next, .swiper-button-prev {
                    display: none !important;
                }
            `}</style>
        </motion.div>
    );
};

export default CategoryNavWidget;
