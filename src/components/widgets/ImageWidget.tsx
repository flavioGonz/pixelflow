'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface ImageWidgetProps {
    data: {
        src?: string;
        alt?: string;
        fit?: 'cover' | 'contain' | 'fill' | 'none';
        position?: 'center' | 'top' | 'bottom' | 'left' | 'right';
        borderRadius?: number;
        opacity?: number;
        rotate?: number;
        overlay?: string;      // color hex
        overlayOpacity?: number; // 0-1
        // Linkable — same as TEXT/SLIDER
        targetLayoutId?: string;
        onTapAction?: 'NONE' | 'GO_TO' | 'BACK' | 'HOME' | 'RELOAD';
        // caption
        caption?: string;
        captionPosition?: 'top' | 'bottom' | 'over';
        captionColor?: string;
        captionSize?: 'sm' | 'md' | 'lg' | 'xl';
        captionAlign?: 'left' | 'center' | 'right';
        captionBg?: string;
    };
}

const ImageWidget: React.FC<ImageWidgetProps> = ({ data }) => {
    const src = data.src || '';
    const fit = data.fit || 'cover';
    const opacity = data.opacity ?? 1;
    const rotate = data.rotate ?? 0;
    const radius = data.borderRadius ?? 12;

    const navAction = React.useCallback(() => {
        const action = data.onTapAction || (data.targetLayoutId ? 'GO_TO' : 'NONE');
        if (action === 'NONE') return;
        window.dispatchEvent(new CustomEvent('pf-nav', { detail: { action, targetLayoutId: data.targetLayoutId } }));
    }, [data.onTapAction, data.targetLayoutId]);

    const isClickable = (data.onTapAction && data.onTapAction !== 'NONE') || !!data.targetLayoutId;

    const capSizeMap: Record<string, string> = { sm: '0.875rem', md: '1.125rem', lg: '1.5rem', xl: '2.25rem' };
    const capSize = capSizeMap[data.captionSize || 'md'] || '1.125rem';

    if (!src) {
        return (
            <div className="w-full h-full grid place-items-center rounded-xl border-2 border-dashed border-white/20 bg-black/20 text-white/50 text-sm font-medium">
                Configura una URL de imagen
            </div>
        );
    }

    const captionEl = data.caption ? (
        <div
            style={{
                color: data.captionColor || '#ffffff',
                fontSize: capSize,
                textAlign: data.captionAlign || 'center',
                background: data.captionBg || 'transparent',
                padding: '0.5rem 0.75rem',
                fontWeight: 700,
                textShadow: '0 2px 8px rgba(0,0,0,0.5)',
            }}
        >
            {data.caption}
        </div>
    ) : null;

    return (
        <motion.div
            onClick={navAction}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className="w-full h-full flex flex-col relative overflow-hidden"
            style={{
                cursor: isClickable ? 'pointer' : undefined,
                borderRadius: radius,
                background: 'transparent',
            }}
        >
            {data.captionPosition === 'top' && captionEl}
            <div className="relative flex-1 overflow-hidden" style={{ borderRadius: radius }}>
                <img
                    src={src}
                    alt={data.alt || ''}
                    className="w-full h-full block"
                    style={{
                        objectFit: fit as any,
                        objectPosition: data.position || 'center',
                        opacity,
                        transform: rotate ? `rotate(${rotate}deg)` : undefined,
                    }}
                    onError={(e) => {
                        const el = e.currentTarget as HTMLImageElement;
                        el.style.display = 'none';
                    }}
                />
                {data.overlay && (data.overlayOpacity ?? 0) > 0 && (
                    <div
                        className="absolute inset-0 pointer-events-none"
                        style={{ background: data.overlay, opacity: data.overlayOpacity ?? 0.35 }}
                    />
                )}
                {data.captionPosition === 'over' && (
                    <div className="absolute inset-x-0 bottom-0 pointer-events-none">
                        {captionEl}
                    </div>
                )}
            </div>
            {data.captionPosition === 'bottom' && captionEl}
        </motion.div>
    );
};

export default ImageWidget;
