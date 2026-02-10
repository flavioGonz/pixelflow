'use client';

import React from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Pagination, EffectFade, EffectCreative } from 'swiper/modules';
import { motion } from 'framer-motion';

// Swiper styles
import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/effect-fade';
import 'swiper/css/effect-creative';

interface SliderWidgetProps {
    data: {
        images: string[];
        interval?: number;
        effect?: 'slide' | 'fade' | 'creative';
    };
}

const SliderWidget: React.FC<SliderWidgetProps> = ({ data }) => {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] as any }}
            className="w-full h-full relative group overflow-hidden bg-transparent"
            style={{ backgroundColor: 'transparent' }}
        >
            <Swiper
                modules={[Autoplay, Pagination, EffectFade, EffectCreative]}
                effect={data.effect || 'creative'}
                speed={800}
                style={{ backgroundColor: 'transparent' }}
                creativeEffect={{
                    prev: {
                        translate: ['-100%', 0, -1],
                    },
                    next: {
                        translate: ['100%', 0, 0],
                    },
                }}
                autoplay={data.images && data.images.length > 1 ? {
                    delay: data.interval || 5000,
                    disableOnInteraction: false,
                } : false}
                pagination={data.images && data.images.length > 1 ? {
                    clickable: true,
                    dynamicBullets: true
                } : false}
                loop={data.images && data.images.length > 1}
                className="w-full h-full bg-transparent"
            >
                {data.images.map((url, index) => {
                    const getYoutubeId = (url: string) => {
                        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
                        const match = url.match(regExp);
                        return (match && match[2].length === 11) ? match[2] : null;
                    };

                    const youtubeId = getYoutubeId(url);
                    const isVideoFile = url.match(/\.(mp4|webm|ogg)$/) || url.includes('mixkit.co');

                    return (
                        <SwiperSlide
                            key={index}
                            className="overflow-hidden bg-transparent"
                            style={{ backgroundColor: 'transparent' }}
                        >
                            {youtubeId ? (
                                <iframe
                                    className="w-full h-full"
                                    src={`https://www.youtube.com/embed/${youtubeId}?autoplay=1&mute=1&loop=1&playlist=${youtubeId}&controls=0&modestbranding=1&showinfo=0&rel=0`}
                                    frameBorder="0"
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                    allowFullScreen
                                />
                            ) : isVideoFile ? (
                                <video
                                    src={url}
                                    autoPlay
                                    muted
                                    loop
                                    playsInline
                                    className="w-full h-full object-cover bg-transparent"
                                />
                            ) : (
                                <img
                                    src={url}
                                    alt={`Slide ${index}`}
                                    className="w-full h-full object-contain bg-transparent"
                                    style={{ backgroundColor: 'transparent' }}
                                />
                            )}
                        </SwiperSlide>
                    );
                })}
            </Swiper>
        </motion.div>
    );
};

export default SliderWidget;
