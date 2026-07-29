'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Megaphone } from 'lucide-react';
import { useContainerSize } from '@/hooks/useContainerSize';

interface TickerWidgetProps {
    data: {
        text?: string;
        speed?: number;
        bgColor?: string;
        textColor?: string;
        fontSize?: string;
        showIcon?: boolean;
    };
}

const TickerWidget: React.FC<TickerWidgetProps> = ({ data }) => {
    const [wrapRef, , h] = useContainerSize<HTMLDivElement>();
    const text = data.text || 'BIENVENIDOS A ALTOS DEL ARAPEY CLUB DE GOLF & HOTEL TERMAL • DISFRUTE DE NUESTRAS PISCINAS TERMALES • HAPPY HOUR EN EL BAR DE 18:00 A 20:00 • ';
    const speed = data.speed || 30;
    const bgColor = data.bgColor || 'rgba(0,0,0,0.8)';
    const textColor = data.textColor || '#ffffff';
    // Auto-scale font from container height when user hasn't set it explicitly.
    const autoFontPx = Math.max(14, (h || 60) * 0.5);
    const fontSize = data.fontSize && data.fontSize.trim().length > 0 ? data.fontSize : (autoFontPx + 'px');
    const iconSize = Math.max(18, (h || 60) * 0.55);

    return (
        <div
            ref={wrapRef}
            className="w-full h-full flex items-center overflow-hidden backdrop-blur-md border-y border-white/10"
            style={{ backgroundColor: bgColor }}
        >
            {data.showIcon !== false && (
                <div className="flex-shrink-0 px-6 h-full flex items-center bg-blue-600 text-white z-10 shadow-[20px_0_40px_rgba(0,0,0,0.5)]">
                    <Megaphone className="animate-bounce" style={{ width: iconSize, height: iconSize }} />
                </div>
            )}

            <div className="relative flex whitespace-nowrap items-center h-full">
                <motion.div
                    animate={{ x: [0, -1000] }}
                    transition={{
                        x: {
                            repeat: Infinity,
                            repeatType: "loop",
                            duration: speed,
                            ease: "linear",
                        },
                    }}
                    className="flex items-center gap-10 pr-10"
                >
                    <span
                        className="font-black italic uppercase tracking-tighter"
                        style={{ color: textColor, fontSize }}
                    >
                        {text} {text} {text}
                    </span>
                </motion.div>
                <motion.div
                    animate={{ x: [0, -1000] }}
                    transition={{
                        x: {
                            repeat: Infinity,
                            repeatType: "loop",
                            duration: speed,
                            ease: "linear",
                        },
                    }}
                    className="flex items-center gap-10 pr-10"
                >
                    <span
                        className="font-black italic uppercase tracking-tighter"
                        style={{ color: textColor, fontSize }}
                    >
                        {text} {text} {text}
                    </span>
                </motion.div>
            </div>
        </div>
    );
};

export default TickerWidget;
