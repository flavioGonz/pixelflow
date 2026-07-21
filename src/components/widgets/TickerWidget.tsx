'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Megaphone } from 'lucide-react';

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
    const text = data.text || 'BIENVENIDOS A ALTOS DEL ARAPEY CLUB DE GOLF & HOTEL TERMAL • DISFRUTE DE NUESTRAS PISCINAS TERMALES • HAPPY HOUR EN EL BAR DE 18:00 A 20:00 • ';
    const speed = data.speed || 30;
    const bgColor = data.bgColor || 'rgba(0,0,0,0.8)';
    const textColor = data.textColor || '#ffffff';
    const fontSize = data.fontSize || '1.5rem';

    return (
        <div
            className="w-full h-full flex items-center overflow-hidden backdrop-blur-md border-y border-white/10"
            style={{ backgroundColor: bgColor }}
        >
            {data.showIcon !== false && (
                <div className="flex-shrink-0 px-6 h-full flex items-center bg-blue-600 text-white z-10 shadow-[20px_0_40px_rgba(0,0,0,0.5)]">
                    <Megaphone className="w-8 h-8 animate-bounce" />
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
