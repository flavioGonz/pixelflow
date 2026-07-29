'use client';

import React from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Pagination, EffectFade, EffectCreative, EffectCube } from 'swiper/modules';
import { motion } from 'framer-motion';

// Swiper styles
import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/effect-fade';
import 'swiper/css/effect-creative';
import 'swiper/css/effect-cube';

interface SliderWidgetProps {
    data: {
        images: string[];
        // Legacy prop:
        interval?: number;
        // New from admin panel:
        autoplayMs?: number;
        effect?: 'slide' | 'fade' | 'zoom' | 'cube' | 'creative';
        fit?: 'cover' | 'contain';
        showDots?: boolean;
    };
}

const SliderWidget: React.FC<SliderWidgetProps> = ({ data }) => {
    const navAction = React.useCallback(() => {
        const action = (data as any).onTapAction || ((data as any).targetLayoutId ? 'GO_TO' : 'NONE');
        if (action === 'NONE') return;
        window.dispatchEvent(new CustomEvent('pf-nav', { detail: { action, targetLayoutId: (data as any).targetLayoutId } }));
    }, [(data as any).onTapAction, (data as any).targetLayoutId]);
    const isClickable = ((data as any).onTapAction && (data as any).onTapAction !== 'NONE') || !!(data as any).targetLayoutId;

    const autoplayDelay = data.autoplayMs ?? data.interval ?? 5000;
    const showDots = data.showDots !== false;
    const fit = data.fit || 'cover';
    const fitClass = fit === 'contain' ? 'object-contain' : 'object-cover';

    // Map effect name; "zoom" not native to swiper — treat as slide + custom scale motion.
    // "slide" is the default (undefined effect). Others map directly.
    const effect = data.effect === 'zoom' ? 'slide' : (data.effect || 'creative');
    const isZoom = data.effect === 'zoom';

    return (
        <motion.div
            onClick={navAction} initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] as any }}
            className="w-full h-full relative group overflow-hidden bg-transparent"
            style={{ backgroundColor: 'transparent', cursor: isClickable ? 'pointer' : undefined }}
        >
            <Swiper
                modules={[Autoplay, Pagination, EffectFade, EffectCreative, EffectCube]}
                effect={effect}
                speed={800}
                style={{ backgroundColor: 'transparent', cursor: isClickable ? 'pointer' : undefined }}
                creativeEffect={{
                    prev: { translate: ['-100%', 0, -1] },
                    next: { translate: ['100%', 0, 0] },
                }}
                autoplay={data.images && data.images.length > 1 && autoplayDelay > 0 ? {
                    delay: autoplayDelay,
                    disableOnInteraction: false,
                } : false}
                pagination={data.images && data.images.length > 1 && showDots ? {
                    clickable: true,
                    dynamicBullets: true,
                } : false}
                loop={data.images && data.images.length > 1}
                className="w-full h-full bg-transparent"
            >
                {data.images.map((url, index) => {
                    const getYoutubeId = (u: string) => {
                        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
                        const match = u.match(regExp);
                        return (match && match[2].length === 11) ? match[2] : null;
                    };
                    const youtubeId = getYoutubeId(url);
                    const isVideoFile = url.match(/\.(mp4|webm|ogg)$/) || url.includes('mixkit.co');

                    return (
                        <SwiperSlide
                            key={index}
                            className="overflow-hidden bg-transparent"
                            style={{ backgroundColor: 'transparent', cursor: isClickable ? 'pointer' : undefined }}
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
                                    autoPlay muted loop playsInline
                                    className={"w-full h-full bg-transparent " + fitClass}
                                />
                            ) : isZoom ? (
                                <motion.img
                                    src={url}
                                    alt={`Slide ${index}`}
                                    initial={{ scale: 1 }}
                                    animate={{ scale: 1.15 }}
                                    transition={{ duration: (autoplayDelay || 5000) / 1000, ease: 'linear' }}
                                    className={"w-full h-full bg-transparent " + fitClass}
                                    style={{ cursor: isClickable ? 'pointer' : undefined }}
                                />
                            ) : (
                                <img
                                    src={url}
                                    alt={`Slide ${index}`}
                                    className={"w-full h-full bg-transparent " + fitClass}
                                    style={{ cursor: isClickable ? 'pointer' : undefined }}
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
