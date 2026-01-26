'use client';

import React, { useRef } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, MapPin, Sparkles } from 'lucide-react';
import { usePlayerStore } from '@/store/usePlayerStore';
import { io } from 'socket.io-client';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Autoplay, FreeMode } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';

type NavLayout = 'HORIZONTAL' | 'VERTICAL';
type ButtonStyle = 'CARDS' | 'GLASS' | 'MINIMAL';

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
        buttonStyle?: ButtonStyle;
    };
}

const CategoryNavWidget: React.FC<CategoryNavWidgetProps> = ({ data }) => {
    const { selectedCategory, setSelectedCategory, screenId } = usePlayerStore();
    const layout = data.layout || 'HORIZONTAL';
    const buttonStyle = data.buttonStyle || 'CARDS';
    const accentColor = data.accentColor || '#f59e0b';
    const columns = data.columns || 3;
    const swiperRef = useRef<any>(null);

    const handleCategoryClick = (cat: CategoryItem) => {
        if (cat.targetLayoutId && screenId) {
            const socket = io();
            socket.emit('request_layout', {
                screenId: screenId,
                layoutId: cat.targetLayoutId
            });
        }
        setSelectedCategory(cat.label);
    };

    const renderButton = (cat: CategoryItem) => {
        const isActive = selectedCategory === cat.label;

        if (buttonStyle === 'GLASS') {
            return (
                <motion.button
                    whileTap={{ scale: 0.96 }}
                    onClick={() => handleCategoryClick(cat)}
                    className={`group relative w-full aspect-[4/3] rounded-3xl overflow-hidden border-2 transition-all duration-700 flex flex-col items-center justify-center p-6 backdrop-blur-3xl ${isActive ? 'bg-white/10 shadow-[0_0_40px_rgba(255,255,255,0.1)]' : 'bg-black/20 border-white/5'}`}
                    style={{ borderColor: isActive ? accentColor : 'rgba(255,255,255,0.05)' }}
                >
                    <div className="text-3xl md:text-5xl font-black uppercase tracking-tighter italic text-center text-white drop-shadow-md z-10">
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

        if (buttonStyle === 'MINIMAL') {
            return (
                <motion.button
                    whileTap={{ scale: 0.96 }}
                    onClick={() => handleCategoryClick(cat)}
                    className={`group relative w-full py-6 md:py-10 px-8 rounded-full border-2 transition-all duration-500 flex items-center justify-center gap-4 ${isActive ? 'bg-white text-black' : 'bg-transparent border-white/20 text-white hover:border-white'}`}
                    style={{ borderColor: isActive ? accentColor : undefined }}
                >
                    <span className="text-xl md:text-4xl font-black uppercase tracking-[0.2em] italic">{cat.label}</span>
                    {isActive && <div className="w-2 h-2 rounded-full" style={{ backgroundColor: accentColor }} />}
                </motion.button>
            );
        }

        // DEFAULT: CARDS
        return (
            <motion.button
                whileTap={{ scale: 0.96 }}
                onClick={() => handleCategoryClick(cat)}
                className={`group relative w-full aspect-[4/5] md:aspect-[3/4] rounded-2xl overflow-hidden border-2 transition-all duration-700 flex flex-col justify-end p-6 md:p-10 shadow-2xl ${isActive ? 'shadow-[0_20px_60px_rgba(245,158,11,0.5)] z-10' : 'border-white/5'}`}
                style={{ borderColor: isActive ? accentColor : 'rgba(255,255,255,0.08)' }}
            >
                {cat.photo && (
                    <div className="absolute inset-0 overflow-hidden transform-gpu bg-neutral-900 border-2 border-transparent">
                        <img
                            src={cat.photo}
                            className={`w-full h-full object-cover transition-all duration-[1.5s] ease-out ${isActive ? 'scale-110' : 'scale-100 opacity-70 group-hover:opacity-100'}`}
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
                            className="h-1.5 rounded-full"
                            style={{ backgroundColor: accentColor }}
                        />
                    </div>
                </div>

                {isActive && (
                    <motion.div
                        layoutId="active-frame"
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
            className={`w-full h-full flex flex-col items-center p-6 md:p-12 overflow-hidden relative font-sans bg-transparent ${layout === 'VERTICAL' ? 'justify-start' : 'justify-center'}`}
        >
            {renderHeader()}

            <div className={`w-full relative group ${layout === 'VERTICAL' ? 'overflow-y-auto custom-scrollbar-hidden max-h-[85vh] px-4 pb-40' : 'px-6 md:px-16 flex-1 flex items-center'}`}>
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
                            spaceBetween={20}
                            slidesPerView={1.5}
                            centeredSlides={false}
                            freeMode={true}
                            grabCursor={true}
                            breakpoints={{
                                640: { slidesPerView: 2.5, spaceBetween: 25 },
                                1024: { slidesPerView: 3.5, spaceBetween: 30 },
                                1440: { slidesPerView: 4.5, spaceBetween: 35 }
                            }}
                            className="w-full !overflow-visible"
                        >
                            {data.categories?.map((cat) => (
                                <SwiperSlide key={cat.id} className="h-auto pb-10">
                                    {renderButton(cat)}
                                </SwiperSlide>
                            ))}
                        </Swiper>
                    </>
                ) : (
                    <div
                        className="grid gap-6 md:gap-10 w-full"
                        style={{
                            gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`
                        }}
                    >
                        {data.categories?.map((cat) => (
                            <div key={cat.id} className="w-full">
                                {renderButton(cat)}
                            </div>
                        ))}
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
