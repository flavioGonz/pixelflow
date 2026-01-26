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
        categoriesToShow?: string[]; // IDs of categories to display
    };
}

const FlagIcon = ({ currency }: { currency: string }) => {
    switch (currency) {
        case 'U$D':
            return <img src="https://flagcdn.com/us.svg" className="w-[1.2em] h-auto object-contain rounded-[2px]" alt="USA" />;
        case 'R$':
            return <img src="https://flagcdn.com/br.svg" className="w-[1.2em] h-auto object-contain rounded-[2px]" alt="Brazil" />;
        case 'AR$':
            return <img src="https://flagcdn.com/ar.svg" className="w-[1.2em] h-auto object-contain rounded-[2px]" alt="Argentina" />;
        default:
            return <img src="https://flagcdn.com/uy.svg" className="w-[1.2em] h-auto object-contain rounded-[2px]" alt="Uruguay" />;
    }
};

const ProductListWidget: React.FC<ProductListWidgetProps> = ({ data }) => {
    const [view, setView] = useState<'categories' | 'products'>('categories');
    const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');

    const displayedCategories = data.categories?.filter(c =>
        !data.categoriesToShow || data.categoriesToShow.length === 0 || data.categoriesToShow.includes(c.id)
    ) || [];

    const activeCategory = data.categories?.find(c => c.id === activeCategoryId);

    const filteredProducts = data.items?.filter(item => {
        const matchesCategory = activeCategoryId
            ? item.categoryIds?.includes(activeCategoryId)
            : true;

        // If we are in category view or haven't selected one, we still filter by what the widget allows
        const isAllowedByWidget = !data.categoriesToShow || data.categoriesToShow.length === 0 ||
            item.categoryIds?.some(id => data.categoriesToShow?.includes(id));

        const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.description?.toLowerCase().includes(searchQuery.toLowerCase());

        return matchesCategory && matchesSearch && isAllowedByWidget;
    }) || [];

    const cinematicEase = [0.16, 1, 0.3, 1];

    const containerVariants = {
        hidden: { opacity: 0, scale: 0.98 },
        visible: {
            opacity: 1,
            scale: 1,
            transition: {
                duration: 0.3,
                ease: cinematicEase,
                staggerChildren: 0.04
            }
        },
        exit: {
            opacity: 0,
            scale: 1.02,
            transition: { duration: 0.2, ease: cinematicEase }
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
                                <span className="text-[10px] font-black uppercase tracking-[0.4em] text-emerald-400 opacity-60 italic">CARTA DIGITAL PREMIUM</span>
                            </motion.div>
                            <motion.h2
                                variants={itemVariants}
                                className="text-4xl md:text-7xl font-black tracking-tighter uppercase leading-[0.9] italic"
                            >
                                {data.title || 'Menú'}
                            </motion.h2>
                        </header>

                        <div className="flex-1 overflow-y-auto custom-scrollbar-hidden flex flex-col items-start justify-center gap-2 md:gap-4 pb-32">
                            {displayedCategories.map((cat, idx) => (
                                <motion.button
                                    key={cat.id}
                                    variants={itemVariants}
                                    whileHover={{ x: 20 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => {
                                        setActiveCategoryId(cat.id);
                                        setView('products');
                                    }}
                                    className="group flex items-center gap-6 text-left"
                                >
                                    <span className="text-emerald-500/30 text-xl md:text-3xl font-mono font-black italic">0{idx + 1}</span>
                                    <h3 className="text-4xl md:text-8xl font-black uppercase tracking-tighter italic leading-none group-hover:text-emerald-400 transition-all duration-300">
                                        {cat.name}
                                    </h3>
                                    <ChevronRight className="w-8 h-8 md:w-16 md:h-16 text-emerald-500 opacity-0 group-hover:opacity-100 transition-all -translate-x-10 group-hover:translate-x-0" />
                                </motion.button>
                            ))}
                            {displayedCategories.length === 0 && (
                                <p className="text-white/20 uppercase font-black italic tracking-widest">No hay categorías seleccionadas</p>
                            )}
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
                                    className="flex items-center gap-3 px-5 py-2 rounded-lg bg-white/10 border border-white/10 text-[9px] font-black uppercase tracking-widest backdrop-blur-md hover:bg-white/20 transition-all"
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
                                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-12 pr-6 text-sm outline-none focus:border-emerald-500/50 transition-all backdrop-blur-md font-bold italic"
                                />
                            </motion.div>
                        </header>

                        <div className="flex-1 overflow-y-auto custom-scrollbar-hidden grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-10 pb-40">
                            {filteredProducts.map((product) => (
                                <motion.div
                                    key={product.id}
                                    variants={itemVariants}
                                    layout
                                    className="flex gap-4 md:gap-8 group/item relative p-6 md:p-8 rounded-xl md:rounded-3xl bg-black/20 border border-white/5 shadow-2xl backdrop-blur-sm"
                                >
                                    <div className="w-20 h-20 md:w-32 md:h-32 flex-shrink-0 relative">
                                        <div className="absolute inset-0 bg-emerald-500/10 blur-2xl opacity-0 group-hover/item:opacity-100 transition-opacity" />
                                        <img
                                            src={product.photo || 'https://via.placeholder.com/400'}
                                            alt={product.name}
                                            className="w-full h-full object-contain rounded-lg md:rounded-xl relative z-10 transition-transform duration-500 group-hover/item:scale-105"
                                        />
                                    </div>
                                    <div className="flex-1 flex flex-col justify-center gap-1 md:gap-2">
                                        <div className="flex justify-between items-start gap-4">
                                            <h3 className="text-xl md:text-3xl font-black uppercase tracking-tighter leading-tight group-hover/item:text-emerald-400 transition-colors italic">{product.name}</h3>
                                            <div className="flex flex-col items-end">
                                                <div className="flex items-center gap-3 bg-white/5 px-3 py-1.5 rounded-lg border border-white/10">
                                                    <FlagIcon currency={product.currency} />
                                                    <span className="text-2xl md:text-4xl font-black italic text-emerald-500 font-mono tracking-tighter">
                                                        <span className="text-[10px] md:text-sm not-italic opacity-40 mr-1">{product.currency === 'U$D' ? 'U$D' : product.currency === 'R$' ? 'R$' : product.currency === 'AR$' ? 'AR$' : '$'}</span>
                                                        {product.price}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        <p className="text-white/40 text-[10px] md:text-sm italic font-medium line-clamp-2 md:line-clamp-none leading-relaxed">
                                            {product.description || 'Descripción premium del producto.'}
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
