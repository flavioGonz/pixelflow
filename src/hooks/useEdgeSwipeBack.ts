'use client';

import { useEffect, useRef } from 'react';

interface Options {
    /** Called when the user completes an edge-swipe back gesture. */
    onBack: () => void;
    /** How wide (in px) the left-edge activation strip is. Default 40. */
    edgeWidth?: number;
    /** How far right the user must drag to trigger the back. Default 100. */
    threshold?: number;
    /** Enable/disable the gesture. */
    enabled?: boolean;
}

/**
 * iOS-style edge-swipe back gesture.
 * Attaches passive touch listeners to `window` and only reacts when:
 *  - The touch STARTED within the left edge strip (0 .. edgeWidth px).
 *  - The user then dragged right past `threshold`, with dominant X movement.
 * On release past threshold, fires `onBack()`.
 *
 * The hook does not visually translate anything — it purely detects the gesture.
 * The AnimatePresence in the player handles the direction-aware transition after
 * the back action is dispatched.
 */
export function useEdgeSwipeBack({ onBack, edgeWidth = 40, threshold = 100, enabled = true }: Options) {
    const stateRef = useRef<{ x0: number; y0: number; active: boolean } | null>(null);

    useEffect(() => {
        if (!enabled) return;
        if (typeof window === 'undefined') return;

        const onStart = (e: TouchEvent) => {
            const t = e.touches[0];
            if (!t) return;
            if (t.clientX <= edgeWidth) {
                stateRef.current = { x0: t.clientX, y0: t.clientY, active: true };
            } else {
                stateRef.current = null;
            }
        };
        const onMove = (e: TouchEvent) => {
            const st = stateRef.current;
            if (!st || !st.active) return;
            const t = e.touches[0];
            if (!t) return;
            const dx = t.clientX - st.x0;
            const dy = t.clientY - st.y0;
            // If vertical dominates → cancel (probably a scroll)
            if (Math.abs(dy) > Math.abs(dx) && Math.abs(dy) > 12) {
                stateRef.current = null;
            }
        };
        const onEnd = (e: TouchEvent) => {
            const st = stateRef.current;
            stateRef.current = null;
            if (!st || !st.active) return;
            const t = e.changedTouches[0];
            if (!t) return;
            const dx = t.clientX - st.x0;
            if (dx >= threshold) {
                try {
                    if ('vibrate' in navigator) (navigator as any).vibrate?.(12);
                } catch { /* ignore */ }
                onBack();
            }
        };

        window.addEventListener('touchstart', onStart, { passive: true });
        window.addEventListener('touchmove', onMove, { passive: true });
        window.addEventListener('touchend', onEnd, { passive: true });
        window.addEventListener('touchcancel', onEnd, { passive: true });
        return () => {
            window.removeEventListener('touchstart', onStart);
            window.removeEventListener('touchmove', onMove);
            window.removeEventListener('touchend', onEnd);
            window.removeEventListener('touchcancel', onEnd);
        };
    }, [onBack, edgeWidth, threshold, enabled]);
}
