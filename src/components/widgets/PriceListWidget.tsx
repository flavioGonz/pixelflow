'use client';

import React from 'react';
import { useContainerSize } from '@/hooks/useContainerSize';
import { motion } from 'framer-motion';

interface PriceItem {
    name: string;
    price: string;
    description?: string;
    image?: string;
}

interface PriceListWidgetProps {
    data: {
        title: string;
        items: PriceItem[];
        // Style overrides
        theme?: 'default' | 'minimal' | 'elegant' | 'restaurant';
        fontFamily?: string;
        titleColor?: string;
        titleFontSize?: number;      // px
        itemNameColor?: string;
        itemNameFontSize?: number;   // px
        priceColor?: string;
        priceFontSize?: number;      // px
        descColor?: string;
        descFontSize?: number;       // px
        accentColor?: string;
        bgColor?: string;
        showDivider?: boolean;
        alignment?: 'left' | 'center' | 'right';
    };
}

const PriceListWidget: React.FC<PriceListWidgetProps> = ({ data }) => {
    const [wrapRef, , h] = useContainerSize<HTMLDivElement>();
    const heightScale = Math.max(0.5, Math.min(2.5, (h || 600) / 700));
    const accent = data.accentColor || '#f59e0b';
    const bg = data.bgColor || 'transparent';
    const theme = data.theme || 'default';
    const align = data.alignment || 'left';

    // Theme presets
    const isElegant = theme === 'elegant' || theme === 'restaurant';
    const themeFonts: Record<string, string> = {
        default:    'inherit',
        minimal:    'inherit',
        elegant:    'Georgia, "Times New Roman", serif',
        restaurant: 'Georgia, "Times New Roman", serif',
    };
    const fontFamily = data.fontFamily || themeFonts[theme] || 'inherit';

    return (
        <motion.div
            ref={wrapRef}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="w-full h-full p-6 overflow-y-auto custom-scrollbar"
            style={{ background: bg, color: data.itemNameColor || '#ffffff', fontFamily, textAlign: align as any }}
        >
            <h2
                className="pb-2 mb-6 uppercase tracking-tighter"
                style={{
                    fontSize: data.titleFontSize ? data.titleFontSize + 'px' : ((isElegant ? 36 : 30) * heightScale + 'px'),
                    fontWeight: 900,
                    color: data.titleColor || accent,
                    borderBottom: data.showDivider !== false ? '2px solid ' + accent : 'none',
                    textTransform: isElegant ? 'none' : 'uppercase',
                    fontStyle: theme === 'restaurant' ? 'italic' : 'normal',
                }}
            >
                {data.title}
            </h2>

            <div className={theme === 'minimal' ? 'space-y-3' : 'space-y-6'}>
                {(data.items || []).map((item, index) => (
                    <motion.div
                        key={index}
                        initial={{ x: -20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: index * 0.08, type: 'spring', stiffness: 200 }}
                        className="flex gap-4 items-center group p-3 rounded-xl border border-transparent hover:border-white/5 transition-all select-none"
                    >
                        {item.image && theme !== 'minimal' && (
                            <div className="w-16 h-16 rounded-lg overflow-hidden border border-white/10 flex-shrink-0 shadow-lg shadow-black/40">
                                <img src={item.image} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" alt={item.name} />
                            </div>
                        )}
                        <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-baseline gap-3 mb-1">
                                <div
                                    className="truncate"
                                    style={{
                                        fontSize: data.itemNameFontSize ? data.itemNameFontSize + 'px' : ((isElegant ? 24 : 20) * heightScale + 'px'),
                                        fontWeight: isElegant ? 700 : 900,
                                        color: data.itemNameColor || '#ffffff',
                                        letterSpacing: isElegant ? 'normal' : '-0.01em',
                                    }}
                                >
                                    {item.name}
                                </div>
                                {isElegant && (
                                    <div className="flex-1 border-b border-dotted opacity-40" style={{ borderColor: data.descColor || '#94a3b8' }} />
                                )}
                                <div
                                    className="tabular-nums shrink-0"
                                    style={{
                                        fontSize: data.priceFontSize ? data.priceFontSize + 'px' : (24 * heightScale + 'px'),
                                        fontWeight: 900,
                                        color: data.priceColor || accent,
                                        fontStyle: theme === 'restaurant' ? 'italic' : 'normal',
                                    }}
                                >
                                    {item.price}
                                </div>
                            </div>
                            {item.description && (
                                <div
                                    style={{
                                        fontSize: data.descFontSize ? data.descFontSize + 'px' : (12 * heightScale + 'px'),
                                        color: data.descColor || '#a1a1aa',
                                        lineHeight: 1.55,
                                        fontStyle: isElegant ? 'italic' : 'normal',
                                    }}
                                >
                                    {item.description}
                                </div>
                            )}
                        </div>
                    </motion.div>
                ))}
            </div>
        </motion.div>
    );
};

export default PriceListWidget;
