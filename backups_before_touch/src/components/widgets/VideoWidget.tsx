'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface VideoWidgetProps {
    data: {
        url: string;
        muted?: boolean;
        autoplay?: boolean;
        loop?: boolean;
    };
}

const VideoWidget: React.FC<VideoWidgetProps> = ({ data }) => {
    const getYoutubeId = (url: string) => {
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
        const match = url.match(regExp);
        return (match && match[2].length === 11) ? match[2] : null;
    };

    const youtubeId = getYoutubeId(data.url);

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="w-full h-full flex items-center justify-center overflow-hidden"
        >
            {youtubeId ? (
                <iframe
                    className="w-full h-full"
                    src={`https://www.youtube.com/embed/${youtubeId}?autoplay=1&mute=1&loop=1&playlist=${youtubeId}&controls=0&modestbranding=1`}
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                />
            ) : (
                <video
                    src={data.url}
                    muted={data.muted !== false}
                    autoPlay={data.autoplay !== false}
                    loop={data.loop !== false}
                    playsInline
                    className="w-full h-full object-cover"
                />
            )}
        </motion.div>
    );
};

export default VideoWidget;
