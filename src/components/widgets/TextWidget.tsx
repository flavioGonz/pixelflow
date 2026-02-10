'use client';

import React from 'react';
import { motion, Variants } from 'framer-motion';

interface TextWidgetProps {
    data: {
        content: string;
        fontSize?: string;
        fontWeight?: string;
        color?: string;
        textAlign?: 'left' | 'center' | 'right';
        style?: 'minimal' | 'gradient' | 'glass' | 'typewriter';
        gradientFrom?: string;
        gradientTo?: string;
    };
}

const TextWidget: React.FC<TextWidgetProps> = ({ data }) => {
    const style = data.style || 'minimal';
    const textAlign = data.textAlign || 'center';

    // Base container styles
    const containerClasses = `w-full h-full p-4 flex flex-col justify-center ${textAlign === 'center' ? 'items-center' : textAlign === 'right' ? 'items-end' : 'items-start'}`;

    // Animation variants
    const fadeIn: Variants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] } }
    };

    if (style === 'gradient') {
        const fromColor = data.gradientFrom || '#3b82f6';
        const toColor = data.gradientTo || '#8b5cf6';

        return (
            <motion.div
                initial="hidden"
                animate="visible"
                variants={fadeIn}
                className={containerClasses}
                style={{
                    fontSize: data.fontSize || '2rem',
                    fontWeight: data.fontWeight || '900',
                    textAlign: textAlign,
                }}
            >
                <div
                    className="rich-text-container bg-clip-text text-transparent"
                    style={{ backgroundImage: `linear-gradient(135deg, ${fromColor}, ${toColor})` }}
                    dangerouslySetInnerHTML={{ __html: data.content }}
                />
                <style jsx global>{`
                    .rich-text-container h1, .rich-text-container h2, .rich-text-container p, .rich-text-container li {
                        background-clip: text;
                        -webkit-background-clip: text;
                        color: transparent;
                        background-image: inherit;
                    }
                `}</style>
            </motion.div>
        );
    }

    if (style === 'glass') {
        return (
            <motion.div
                initial="hidden"
                animate="visible"
                variants={fadeIn}
                className="w-full h-full p-8 flex flex-col justify-center items-center"
            >
                <div
                    className="bg-white/10 backdrop-blur-md border border-white/20 p-8 rounded-2xl shadow-2xl"
                    style={{
                        fontSize: data.fontSize || '1.5rem',
                        fontWeight: data.fontWeight || '500',
                        textAlign: textAlign,
                        color: data.color || '#fff'
                    }}
                >
                    <div
                        className="rich-text-container"
                        dangerouslySetInnerHTML={{ __html: data.content }}
                    />
                </div>
            </motion.div>
        );
    }

    if (style === 'typewriter') {
        return (
            <div className={containerClasses} style={{
                fontSize: data.fontSize || '2rem',
                fontWeight: data.fontWeight || '700',
                color: data.color || '#fff',
                fontFamily: 'monospace'
            }}>
                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: '100%' }}
                    transition={{ duration: 3, ease: "linear", repeat: Infinity, repeatDelay: 5 }}
                    className="overflow-hidden whitespace-nowrap border-r-4 border-white/50 pr-2"
                >
                    <div dangerouslySetInnerHTML={{ __html: data.content.replace(/<[^>]*>?/gm, '') }} /> {/* Strip tags for typewriter safety usually */}
                </motion.div>
                {/* Typewriter raw HTML is hard, using stripped text approximation or simple container reveal */}
            </div>
        );
    }

    // Minimal
    return (
        <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeIn}
            className={containerClasses}
            style={{
                fontSize: data.fontSize || '2rem',
                fontWeight: data.fontWeight || '700',
                color: data.color || '#ffffff',
                textAlign: textAlign,
            }}
        >
            <div
                className="rich-text-container"
                dangerouslySetInnerHTML={{ __html: data.content }}
            />
            <style jsx global>{`
        .rich-text-container h1 { font-size: 1.5em; margin-bottom: 0.5em; font-weight: 800; }
        .rich-text-container h2 { font-size: 1.2em; margin-bottom: 0.4em; font-weight: 700; }
        .rich-text-container p { margin-bottom: 0.5em; }
        .rich-text-container ul { list-style-type: disc; padding-left: 1.5em; }
        .rich-text-container ol { list-style-type: decimal; padding-left: 1.5em; }
      `}</style>
        </motion.div>
    );
};

export default TextWidget;
