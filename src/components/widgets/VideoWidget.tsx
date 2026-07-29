'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface VideoWidgetProps {
    data: {
        url: string;
        // legacy lowercase support:
        autoplay?: boolean;
        // new camelCase from admin panel:
        autoPlay?: boolean;
        muted?: boolean;
        loop?: boolean;
        showControls?: boolean;
        fit?: 'cover' | 'contain' | 'fill';
        playbackRate?: number;
    };
}

const VideoWidget: React.FC<VideoWidgetProps> = ({ data }) => {
    const videoRef = React.useRef<HTMLVideoElement>(null);
    const getYoutubeId = (url: string) => {
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
        const match = url.match(regExp);
        return (match && match[2].length === 11) ? match[2] : null;
    };

    const youtubeId = getYoutubeId(data.url);
    const autoPlay = data.autoPlay ?? data.autoplay ?? true;
    const muted = data.muted ?? true;
    const loop = data.loop ?? true;
    const showControls = !!data.showControls;
    const fit = data.fit || 'cover';
    const playbackRate = data.playbackRate ?? 1;

    // Apply playbackRate when video loads or rate changes.
    React.useEffect(() => {
        const v = videoRef.current;
        if (v) v.playbackRate = playbackRate;
    }, [playbackRate, data.url]);

    const fitClass = fit === 'contain' ? 'object-contain' : fit === 'fill' ? 'object-fill' : 'object-cover';

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="w-full h-full flex items-center justify-center overflow-hidden"
        >
            {youtubeId ? (
                <iframe
                    className="w-full h-full"
                    src={`https://www.youtube.com/embed/${youtubeId}?autoplay=${autoPlay ? 1 : 0}&mute=${muted ? 1 : 0}&loop=${loop ? 1 : 0}&playlist=${youtubeId}&controls=${showControls ? 1 : 0}&modestbranding=1`}
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                />
            ) : (
                <video
                    ref={videoRef}
                    src={data.url}
                    muted={muted}
                    autoPlay={autoPlay}
                    loop={loop}
                    controls={showControls}
                    playsInline
                    className={"w-full h-full " + fitClass}
                />
            )}
        </motion.div>
    );
};

export default VideoWidget;
