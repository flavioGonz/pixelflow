'use client';

import { useEffect, useRef, useState, RefObject } from 'react';

/**
 * Observes an element's rendered size (px) via ResizeObserver.
 * Returns [ref to attach, width, height, baseSide = min(w,h)].
 *
 * Use in widgets to derive font sizes / spacing from the widget's actual
 * pixel dimensions in the player canvas, instead of using vh/vw (which
 * depend on the browser viewport, not the widget container).
 */
export function useContainerSize<T extends HTMLElement>(): [RefObject<T | null>, number, number, number] {
    const ref = useRef<T | null>(null);
    const [size, setSize] = useState<{ w: number; h: number }>({ w: 0, h: 0 });
    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        const ro = new ResizeObserver((entries) => {
            for (const e of entries) {
                const cr = e.contentRect;
                setSize({ w: cr.width, h: cr.height });
            }
        });
        ro.observe(el);
        return () => ro.disconnect();
    }, []);
    const baseSide = Math.max(60, Math.min(size.w || 200, size.h || 200));
    return [ref, size.w, size.h, baseSide];
}
