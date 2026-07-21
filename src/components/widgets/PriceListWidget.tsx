'use client';

import React from 'react';
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
    };
}

const PriceListWidget: React.FC<PriceListWidgetProps> = ({ data }) => {
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="w-full h-full p-6 text-white overflow-y-auto custom-scrollbar"
        >
            <h2 className="text-3xl font-black border-b-2 border-amber-500 pb-2 mb-6 uppercase tracking-tighter">
                {data.title}
            </h2>
            <div className="space-y-6">
                {data.items.map((item, index) => (
                    <motion.div
                        key={index}
                        initial={{ x: -20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        whileTap={{ scale: 0.98, backgroundColor: 'rgba(255, 255, 255, 0.05)' }}
                        transition={{ delay: index * 0.1, type: 'spring', stiffness: 200 }}
                        className="flex gap-4 items-center group p-3 rounded-xl border border-transparent hover:border-white/5 transition-all cursor-pointer select-none"
                    >
                        {item.image && (
                            <div className="w-16 h-16 rounded-lg overflow-hidden border border-white/10 flex-shrink-0 shadow-lg shadow-black/40">
                                <img src={item.image} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                            </div>
                        )}
                        <div className="flex-1">
                            <div className="flex justify-between items-baseline mb-1">
                                <div className="font-black text-xl group-hover:text-amber-400 transition-colors uppercase tracking-tight">
                                    {item.name}
                                </div>
                                <div className="text-2xl font-black font-mono text-amber-500 italic">
                                    {item.price}
                                </div>
                            </div>
                            {item.description && (
                                <div className="text-xs text-neutral-400 leading-relaxed font-medium">
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
