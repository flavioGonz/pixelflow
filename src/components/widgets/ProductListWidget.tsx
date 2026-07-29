'use client';

import React, { useState, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { TouchPopover } from '@/components/touch';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, FreeMode, Navigation, Pagination } from 'swiper/modules';
import { ShoppingBag } from 'lucide-react';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

interface Category {
    _id?: string;
    id?: string;
    name: string;
    photo?: string;
}

interface ProductItem {
    _id?: string;
    id?: string;
    name: string;
    price?: number;
    currency?: string;
    photo?: string;
    description?: string;
    available?: boolean;
    categoryIds?: string[];
}

interface ProductListWidgetProps {
    data: {
        title?: string;
        categories?: Category[];
        items?: ProductItem[];
        categoriesToShow?: string[];  // Filter by category IDs
        showPrice?: boolean;
        showDescription?: boolean;
        showCategoryHeader?: boolean;
        groupByCategory?: boolean;
        theme?: 'clean' | 'dark' | 'premium' | 'restaurant' | 'chalkboard';
        accentColor?: string;
        autoplayMs?: number;
        cardsPerView?: number;
    };
}

const themePresets: Record<string, { bg: string; card: string; text: string; sub: string; price: string; accent: string; catBg: string }> = {
    clean:   { bg: 'transparent',     card: 'rgba(255,255,255,0.90)', text: '#0f172a', sub: '#64748b', price: '#0ea5e9', accent: '#0ea5e9', catBg: 'rgba(255,255,255,0.7)' },
    dark:    { bg: 'transparent',     card: 'rgba(20,20,25,0.85)',    text: '#f1f5f9', sub: '#94a3b8', price: '#facc15', accent: '#facc15', catBg: 'rgba(0,0,0,0.5)' },
    premium: { bg: 'transparent',     card: 'linear-gradient(180deg, rgba(20,20,25,0.9), rgba(30,30,35,0.9))', text: '#f5f5f5', sub: '#a1a1aa', price: '#d4af37', accent: '#d4af37', catBg: 'rgba(0,0,0,0.6)' },
    restaurant:  { bg: 'transparent', card: 'linear-gradient(180deg, #faf6ef 0%, #f0e6d2 100%)', text: '#3d2817', sub: '#8b6f4d', price: '#a04a2a', accent: '#a04a2a', catBg: 'rgba(61,40,23,0.85)' },
    chalkboard:  { bg: 'transparent', card: '#1a1a1a', text: '#f5f5dc', sub: '#c4b998', price: '#e8c884', accent: '#e8c884', catBg: '#0f0f0f' },
};

const ProductCard: React.FC<{ p: ProductItem; showPrice: boolean; showDesc: boolean; theme: any; variant?: string }> = ({ p, showPrice, showDesc, theme, variant }) => {
    // Restaurant menu variant: horizontal layout with dotted separator, elegant typography
    if (variant === 'restaurant' || variant === 'chalkboard') {
        const isChalk = variant === 'chalkboard';
        return (
            <motion.article
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                className="rounded-lg overflow-hidden h-full flex items-start gap-3 p-4"
                style={{ background: theme.card, color: theme.text, borderBottom: '1px dashed ' + (theme.sub || '#94a3b8'), backdropFilter: 'blur(6px)' }}
            >
                {p.photo && (
                    <div className="size-16 md:size-20 rounded-md overflow-hidden bg-black/10 shrink-0">
                        <img src={p.photo} alt={p.name} className="w-full h-full object-cover" />
                    </div>
                )}
                <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-3">
                        <h3 className={"font-bold text-lg md:text-2xl leading-tight truncate " + (isChalk ? 'italic' : '')} style={{ color: theme.text, fontFamily: isChalk ? 'cursive, serif' : 'Georgia, "Times New Roman", serif' }}>
                            {p.name}
                        </h3>
                        <div className="flex-1 border-b border-dotted opacity-40" style={{ borderColor: theme.sub }} />
                        {showPrice && p.price != null && (
                            <span className="font-bold text-lg md:text-2xl tabular-nums" style={{ color: theme.price, fontFamily: isChalk ? 'cursive, serif' : 'Georgia, serif' }}>
                                {'$' + p.price}
                            </span>
                        )}
                    </div>
                    {showDesc && p.description && (
                        <p className="text-[12px] md:text-sm mt-1.5 italic leading-snug opacity-80" style={{ color: theme.sub, fontFamily: isChalk ? 'cursive, serif' : 'Georgia, serif' }}>
                            {p.description}
                        </p>
                    )}
                </div>
            </motion.article>
        );
    }
    return (
    <motion.article
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
        className="rounded-2xl overflow-hidden shadow-2xl h-full flex flex-col items-center text-center p-4"
        style={{ background: theme.card, color: theme.text, backdropFilter: 'blur(20px)' }}
    >
        {/* Image */}
        <div className="w-full aspect-square rounded-xl overflow-hidden bg-black/10 relative">
            {p.photo ? (
                <img src={p.photo} alt={p.name} className="w-full h-full object-cover" />
            ) : (
                <div className="w-full h-full grid place-items-center text-black/20">
                    <ShoppingBag className="size-16" />
                </div>
            )}
        </div>

        {/* Info */}
        <div className="pt-3 pb-1 flex-1 flex flex-col items-center w-full min-w-0">
            <h3 className="font-bold text-lg md:text-2xl leading-tight tracking-tight w-full truncate" style={{ color: theme.text }}>
                {p.name}
            </h3>
            {showDesc && p.description && (
                <p className="text-[11px] md:text-sm mt-1 line-clamp-2 opacity-70" style={{ color: theme.sub }}>
                    {p.description}
                </p>
            )}
        </div>

        {/* Price */}
        {showPrice && p.price != null && (
            <div className="pt-2 border-t border-current/10 w-full flex items-baseline justify-center gap-1">
                <span className="text-xs md:text-sm font-semibold opacity-70" style={{ color: theme.sub }}>{p.currency || '$'}</span>
                <span className="font-black text-2xl md:text-4xl tabular-nums" style={{ color: theme.price }}>{p.price}</span>
            </div>
        )}

        {p.available === false && (
            <span className="absolute top-3 right-3 bg-red-600 text-white text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded">
                Agotado
            </span>
        )}
    </motion.article>
);
};


const ProductLongPress: React.FC<{ product: ProductItem; onOpen: (p: ProductItem) => void; children: React.ReactNode }> = ({ product, onOpen, children }) => {
    const timer = useRef<any>(null);
    const startXY = useRef<{ x: number; y: number } | null>(null);
    const cancel = () => { if (timer.current) { clearTimeout(timer.current); timer.current = null; } };
    const onTouchStart = (e: React.TouchEvent) => {
        const t = e.touches[0];
        startXY.current = { x: t.clientX, y: t.clientY };
        cancel();
        timer.current = setTimeout(() => {
            try { if (typeof navigator !== 'undefined' && 'vibrate' in navigator) (navigator as any).vibrate?.(15); } catch {}
            onOpen(product);
        }, 500);
    };
    const onTouchMove = (e: React.TouchEvent) => {
        if (!startXY.current) return;
        const t = e.touches[0];
        if (Math.abs(t.clientX - startXY.current.x) > 8 || Math.abs(t.clientY - startXY.current.y) > 8) cancel();
    };
    const onTouchEnd = () => { cancel(); startXY.current = null; };
    return (
        <div onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd} onTouchCancel={onTouchEnd} style={{ WebkitUserSelect: 'none', userSelect: 'none', touchAction: 'pan-y', height: '100%' }}>
            {children}
        </div>
    );
};

const ProductDetailPopover: React.FC<{ product: ProductItem | null; theme: any; onClose: () => void }> = ({ product, theme, onClose }) => (
    <TouchPopover open={!!product} onClose={onClose}>
        {product && (
            <div style={{ color: theme.text }}>
                {product.photo && (
                    <div className="rounded-xl overflow-hidden aspect-[4/3] bg-black/10 mb-4">
                        <img src={product.photo} alt={product.name} className="w-full h-full object-cover" />
                    </div>
                )}
                <h3 className="font-black text-2xl md:text-3xl leading-tight mb-2" style={{ color: theme.text }}>{product.name}</h3>
                {product.description && (
                    <p className="text-sm md:text-base leading-relaxed mb-4 opacity-80" style={{ color: theme.sub }}>{product.description}</p>
                )}
                {product.price != null && (
                    <div className="pt-3 border-t border-current/10 flex items-baseline gap-2">
                        <span className="text-sm opacity-70" style={{ color: theme.sub }}>{product.currency || '$'}</span>
                        <span className="font-black text-4xl md:text-5xl tabular-nums" style={{ color: theme.price }}>{product.price}</span>
                    </div>
                )}
                <div className="pt-5 text-center">
                    <button
                        onClick={onClose}
                        className="px-6 py-3 rounded-full font-bold text-sm"
                        style={{ background: theme.accent, color: '#fff', minHeight: 48 }}
                    >
                        Cerrar
                    </button>
                </div>
            </div>
        )}
    </TouchPopover>
);

const CategoryStrip: React.FC<{ category: Category; products: ProductItem[]; showPrice: boolean; showDesc: boolean; theme: any; perView: number; autoplayMs: number; showCategoryHeader: boolean; themeName?: string; onOpenDetail?: (p: ProductItem) => void }> = ({
    category, products, showPrice, showDesc, theme, perView, autoplayMs, showCategoryHeader, themeName, onOpenDetail,
}) => (
    <div className="w-full flex flex-col gap-3 mb-6">
        {showCategoryHeader && (
            <div className="flex items-center gap-3 px-2">
                {category.photo && (
                    <div className="size-9 rounded-full overflow-hidden shrink-0 shadow" style={{ background: theme.catBg }}>
                        <img src={category.photo} alt={category.name} className="w-full h-full object-cover" />
                    </div>
                )}
                <h2 className="font-black text-xl md:text-3xl uppercase tracking-wide truncate" style={{ color: theme.text }}>
                    {category.name}
                </h2>
                <span className="text-[11px] font-mono opacity-60 ml-auto" style={{ color: theme.sub }}>{products.length}</span>
            </div>
        )}

        <Swiper
            modules={[Autoplay, FreeMode, Navigation, Pagination]}
            spaceBetween={16}
            slidesPerView={perView}
            freeMode
            grabCursor
            autoplay={autoplayMs > 0 ? { delay: autoplayMs, disableOnInteraction: false, pauseOnMouseEnter: true } : false}
            navigation
            className="w-full !pb-2"
            breakpoints={{
                640:  { slidesPerView: Math.min(perView, 2) },
                1024: { slidesPerView: perView },
            }}
        >
            {products.map((p) => (
                <SwiperSlide key={p._id || p.id} style={{ height: 'auto' }} className="!h-auto">
                    <ProductLongPress product={p} onOpen={(pp) => onOpenDetail?.(pp)}>
                        <ProductCard p={p} showPrice={showPrice} showDesc={showDesc} theme={theme} variant={themeName} />
                    </ProductLongPress>
                </SwiperSlide>
            ))}
        </Swiper>
    </div>
);

const ProductListWidget: React.FC<ProductListWidgetProps> = ({ data }) => {
    const [detailProduct, setDetailProduct] = useState<ProductItem | null>(null);
    const openDetail = useCallback((p: ProductItem) => setDetailProduct(p), []);
    const closeDetail = useCallback(() => setDetailProduct(null), []);

    const theme = themePresets[data.theme || 'clean'];
    const showPrice = data.showPrice !== false;
    const showDesc = data.showDescription === true;
    const showCategoryHeader = data.showCategoryHeader !== false;
    const perView = data.cardsPerView || 3;
    const autoplayMs = data.autoplayMs ?? 0;
    const groupByCategory = data.groupByCategory !== false;

    const cats = (data.categories || []);
    const items = (data.items || []).filter(p => p.available !== false);

    // Filter by categoriesToShow (or use all)
    const activeCatIds = new Set(data.categoriesToShow && data.categoriesToShow.length > 0
        ? data.categoriesToShow
        : cats.map(c => c._id || c.id).filter(Boolean) as string[]);

    // Items available for shown categories
    const visibleItems = items.filter(p =>
        !p.categoryIds || p.categoryIds.length === 0 || p.categoryIds.some(cid => activeCatIds.has(cid))
    );

    if (visibleItems.length === 0) {
        return (
            <div className="w-full h-full flex flex-col items-center justify-center gap-2 p-6 text-center" style={{ color: theme.text }}>
                {data.title && <h2 className="font-black text-2xl md:text-4xl uppercase tracking-tight opacity-90">{data.title}</h2>}
                <ShoppingBag className="size-10 opacity-40 mt-2" />
                <p className="text-sm opacity-60">Sin productos disponibles</p>
                {(!data.items || data.items.length === 0) && (
                    <p className="text-xs opacity-40 mt-1">Cargá productos en /admin/products</p>
                )}
            </div>
        );
    }

    return (
        <div className="w-full h-full flex flex-col overflow-hidden" style={{ background: theme.bg, color: theme.text }}>
            {/* Header */}
            {data.title && (
                <header className="px-4 py-3 flex items-baseline gap-3 shrink-0">
                    <h2 className="font-black text-2xl md:text-4xl uppercase tracking-tight leading-none">{data.title}</h2>
                    <span className="text-[11px] font-mono opacity-60 ml-auto">{visibleItems.length} items</span>
                </header>
            )}

            {/* Content */}
            <div className="flex-1 min-h-0 overflow-y-auto px-2 py-2">
                {groupByCategory ? (
                    Array.from(activeCatIds).map((cid) => {
                        const cat = cats.find(c => (c._id || c.id) === cid);
                        if (!cat) return null;
                        const catItems = visibleItems.filter(p => p.categoryIds?.includes(cid));
                        if (catItems.length === 0) return null;
                        return (
                            <CategoryStrip themeName={data.theme} onOpenDetail={openDetail}
                                key={cid}
                                category={cat}
                                products={catItems}
                                showPrice={showPrice}
                                showDesc={showDesc}
                                theme={theme}
                                perView={perView}
                                autoplayMs={autoplayMs}
                                showCategoryHeader={showCategoryHeader}
                            />
                        );
                    })
                ) : (
                    <CategoryStrip themeName={data.theme} onOpenDetail={openDetail}
                        category={{ name: '', photo: '' }}
                        products={visibleItems}
                        showPrice={showPrice}
                        showDesc={showDesc}
                        theme={theme}
                        perView={perView}
                        autoplayMs={autoplayMs}
                        showCategoryHeader={false}
                    />
                )}
            </div>
                    <ProductDetailPopover product={detailProduct} theme={theme} onClose={closeDetail} />
            </div>
    );
};

export default ProductListWidget;
