'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface AtmosphereWidgetProps {
    data: {
        type?: 'SNOW' | 'SOLAR' | 'GOLD' | 'BUBBLES';
        intensity?: number;
    };
}

const AtmosphereWidget: React.FC<AtmosphereWidgetProps> = ({ data }) => {
    const type = data.type || 'GOLD';
    const intensity = data.intensity || 20;
    const particles = Array.from({ length: intensity });

    const getParticleConfig = (type: string) => {
        switch (type) {
            case 'SNOW':
                return {
                    color: '#fff',
                    size: [2, 6],
                    y: [0, 1000],
                    x: [0, 100],
                    duration: [10, 20]
                };
            case 'SOLAR':
                return {
                    color: '#fbbf24',
                    size: [50, 150],
                    y: [0, 100],
                    x: [0, 100],
                    duration: [15, 25]
                };
            case 'BUBBLES':
                return {
                    color: '#93c5fd',
                    size: [10, 30],
                    y: [1000, -100],
                    x: [0, 100],
                    duration: [5, 12]
                };
            case 'GOLD':
            default:
                return {
                    color: '#d4af37',
                    size: [4, 12],
                    y: [1000, -100],
                    x: [0, 100],
                    duration: [12, 25]
                };
        }
    };

    const config = getParticleConfig(type);

    return (
        <div className="w-full h-full relative overflow-hidden pointer-events-none">
            {particles.map((_, i) => (
                <motion.div
                    key={i}
                    initial={{
                        opacity: 0,
                        y: type === 'BUBBLES' || type === 'GOLD' ? '110%' : '-10%',
                        x: `${Math.random() * 100}%`,
                        scale: 0.5
                    }}
                    animate={{
                        opacity: [0, 0.4, 0],
                        y: type === 'BUBBLES' || type === 'GOLD' ? '-10%' : '110%',
                        x: [`${Math.random() * 100}%`, `${Math.random() * 100}%`],
                        scale: [0.5, 1.2, 0.5]
                    }}
                    transition={{
                        duration: Math.random() * (config.duration[1] - config.duration[0]) + config.duration[0],
                        repeat: Infinity,
                        delay: Math.random() * 20,
                        ease: "linear"
                    }}
                    className="absolute rounded-full blur-[1px]"
                    style={{
                        width: Math.random() * (config.size[1] - config.size[0]) + config.size[0],
                        height: Math.random() * (config.size[1] - config.size[0]) + config.size[0],
                        backgroundColor: config.color,
                        boxShadow: `0 0 20px ${config.color}`,
                    }}
                />
            ))}
        </div>
    );
};

export default AtmosphereWidget;
