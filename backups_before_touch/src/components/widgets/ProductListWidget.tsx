'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag, ArrowLeft, Star, Award, Leaf, ChevronRight, Search } from 'lucide-react';
import { usePlayerStore } from '@/store/usePlayerStore';

interface Category {
    id: string;
    name: string;
    photo?: string;
    description?: string;
}

interface ProductItem {
    id: string;
    name: string;
    price: number;
    currency: string;
    photo: string;
    description?: string;
    isOffer?: boolean;
    categoryIds?: string[]; // Multiple categories
}

interface ProductListWidgetProps {
    data: {
        title: string;
        categories: Category[];
        items: ProductItem[];
    };
}

const ProductListWidget: React.FC<ProductListWidgetProps> = ({ data }) => {
    const [view, setView] = useState<'categories' | 'products'>('categories');
    const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');

    const activeCategory = data.categories?.find(c => c.id === activeCategoryId);

    const filteredProducts = data.items?.filter(item => {
        const matchesCategory = activeCategoryId
            ? item.categoryIds?.includes(activeCategoryId)
            : true;
        const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.description?.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesCategory && matchesSearch;
    }) || [];

    const cinematicEase = [0.16, 1, 0.3, 1];

    const containerVariants = {
        hidden: { opacity: 0, scale: 0.98 },
        visible: {
            opacity: 1,
            scale: 1,
            transition: {
                duration: 0.4, // Faster
                ease: cinematicEase,
                staggerChildren: 0.03 // Faster stagger
            }
        },
        exit: {
            opacity: 0,
            scale: 1.02,
            transition: { duration: 0.3, ease: cinematicEase }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 15, scale: 0.98 },
        visible: {
            opacity: 1,
            y: 0,
            scale: 1,
            transition: { type: 'spring', stiffness: 350, damping: 30 }
        }
    };

    return (
        <div className="w-full h-full p-6 md:p-12 flex flex-col gap-6 md:gap-14 overflow-hidden relative bg-transparent text-white font-sans">
            <AnimatePresence mode="wait">
                {view === 'categories' ? (
                    <motion.div
                        key="categories-view"
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        variants={containerVariants}
                        className="flex-1 flex flex-col gap-8 md:gap-16 relative z-10"
                    >
                        <header className="flex flex-col gap-2">
                            <motion.div variants={itemVariants} className="flex items-center gap-3">
                                <span className="text-[10px] font-black uppercase tracking-[0.4em] text-emerald-400 opacity-60">Carta Digital</span>
                            </motion.div>
                            <motion.h2
                                variants={itemVariants}
                                className="text-4xl md:text-7xl font-black tracking-tighter uppercase leading-[0.9] italic"
                            >
                                {data.title || 'Menú'}
                            </motion.h2>
                        </header>

                        <div className="flex-1 overflow-y-auto custom-scrollbar-hidden grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-10 pb-32">
                            {data.categories?.map((cat) => (
                                <motion.button
                                    key={cat.id}
                                    variants={itemVariants}
                                    whileHover={{ scale: 1.02, y: -5 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => {
                                        setActiveCategoryId(cat.id);
                                        setView('products');
                                    }}
                                    className="group relative h-40 md:h-64 rounded-xl md:rounded-2xl border border-white/10 hover:border-emerald-500/50 flex items-center justify-center transition-all duration-300 shadow-2xl bg-black/20 overflow-hidden"
                                >
                                    <div className="relative z-10 flex flex-col items-center justify-center p-4">
                                        <h3 className="text-xl md:text-4xl font-black uppercase tracking-tighter italic leading-none group-hover:text-emerald-400 transition-colors text-center">{cat.name}</h3>
                                        {cat.description && <p className="text-[10px] md:text-sm text-white/40 font-bold uppercase tracking-widest mt-2">{cat.description}</p>}
                                    </div>
                                </motion.button>
                            ))}
                        </div>
                    </motion.div>
                ) : (
                    <motion.div
                        key="products-view"
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        variants={containerVariants}
                        className="flex-1 flex flex-col gap-8 md:gap-12 relative z-10"
                    >
                        <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                            <div className="space-y-4">
                                <motion.button
                                    variants={itemVariants}
                                    onClick={() => setView('categories')}
                                    className="flex items-center gap-3 px-5 py-2 rounded-lg bg-white/10 border border-white/10 text-[9px] font-black uppercase tracking-widest backdrop-blur-md"
                                >
                                    <ArrowLeft className="w-3 h-3" /> volver
                                </motion.button>
                                <motion.h2
                                    variants={itemVariants}
                                    className="text-3xl md:text-6xl font-black tracking-tighter uppercase leading-none italic text-emerald-400"
                                >
                                    {activeCategory?.name}
                                </motion.h2>
                            </div>

                            <motion.div
                                variants={itemVariants}
                                className="relative w-full max-w-sm"
                            >
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                                <input
                                    type="text"
                                    placeholder="Buscar..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-12 pr-6 text-sm outline-none focus:border-emerald-500/50 transition-all backdrop-blur-md"
                                />
                            </motion.div>
                        </header>

                        <div className="flex-1 overflow-y-auto custom-scrollbar-hidden grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-10 pb-40">
                            {filteredProducts.map((product) => (
                                <motion.div
                                    key={product.id}
                                    variants={itemVariants}
                                    layout
                                    className="flex gap-4 md:gap-8 group/item relative p-5 md:p-7 rounded-xl md:rounded-2xl bg-transparent border border-white/10 shadow-2xl"
                                >
                                    <div className="w-20 h-20 md:w-32 md:h-32 flex-shrink-0 bg-transparent">
                                        <img
                                            src={product.photo || 'https://via.placeholder.com/400'}
                                            alt={product.name}
                                            className="w-full h-full object-contain rounded-lg md:rounded-xl"
                                        />
                                    </div>
                                    <div className="flex-1 flex flex-col justify-center gap-1 md:gap-2">
                                        <div className="flex justify-between items-start gap-4">
                                            <h3 className="text-lg md:text-xl font-black uppercase tracking-tighter leading-tight group-hover/item:text-emerald-400 transition-colors">{product.name}</h3>
                                            <div className="flex flex-col items-end">
                                                <span className="text-xl md:text-2xl font-black italic text-emerald-500 font-mono tracking-tighter">
                                                    <span className="text-[10px] not-italic opacity-30 mr-1">$</span>
                                                    {product.price}
                                                </span>
                                            </div>
                                        </div>
                                        <p className="text-white/40 text-[10px] md:text-xs italic font-medium line-clamp-2 md:line-clamp-none">
                                            {product.description || 'Descripción del producto.'}
                                        </p>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div >
    );
};

export default ProductListWidget;
