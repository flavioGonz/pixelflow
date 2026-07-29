'use client';

import React from 'react';
import { useContainerSize } from '@/hooks/useContainerSize';

/**
 * Auto-scaling wrapper. Measures its actual pixel size in the widget canvas
 * and applies `transform: scale(N)` to the children, so an interior "design"
 * of ~`reference` px looks correct at any widget size.
 *
 * By default the scale factor is `baseSide (min of w,h) / reference`, so the
 * content grows uniformly while preserving aspect. Pass `designWidth` /
 * `designHeight` to force the children into a fixed-size layout box that
 * ScaleFit will then scale to fit inside its parent.
 */
interface ScaleFitProps {
    children: React.ReactNode;
    /** Reference base side for the auto-scale calculation. */
    reference?: number;
    /** Optional fixed inner design size (px). Useful when children use w-full/h-full. */
    designWidth?: number;
    designHeight?: number;
    /** Extra className passed to the outer measuring div. */
    className?: string;
}

export const ScaleFit: React.FC<ScaleFitProps> = ({ children, reference = 320, designWidth, designHeight, className }) => {
    const [ref, w, h, baseSide] = useContainerSize<HTMLDivElement>();

    let scale = baseSide / reference;
    // If explicit design box, compute scale to *fit* it inside the measured container.
    if (designWidth && designHeight && w > 0 && h > 0) {
        scale = Math.min(w / designWidth, h / designHeight);
    }

    const innerStyle: React.CSSProperties = {
        transform: `scale(${scale})`,
        transformOrigin: 'center center',
    };
    if (designWidth) innerStyle.width = designWidth;
    if (designHeight) innerStyle.height = designHeight;

    return (
        <div ref={ref} className={"w-full h-full relative overflow-hidden " + (className || '')}>
            <div className="absolute inset-0 flex items-center justify-center">
                <div style={innerStyle}>
                    {children}
                </div>
            </div>
        </div>
    );
};
