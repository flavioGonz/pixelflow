'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { ReactNode } from 'react';

export type PageDirection = 'push' | 'pop' | 'none';

interface PageTransitionProps {
    pageKey: string | number;
    direction?: PageDirection;
    children: ReactNode;
    duration?: number;
}

// iOS spring easing: cubic-bezier(0.32, 0.72, 0, 1)
const iosEase = [0.32, 0.72, 0, 1] as const;

/**
 * iOS-style page transition.
 *
 * - push: new page slides in from the right, old page parallax-slides left ~30% with slight opacity dim.
 * - pop:  reverse — new slides in from the left, old slides out to the right.
 * - none: fade only.
 *
 * Use inside a positioned container. The child must be keyed by pageKey.
 */
export function PageTransition({ pageKey, direction = 'push', children, duration = 0.35 }: PageTransitionProps) {
    const enterFromX = direction === 'push' ? '100%' : direction === 'pop' ? '-30%' : 0;
    const exitToX = direction === 'push' ? '-30%' : direction === 'pop' ? '100%' : 0;
    const enterOpacity = direction === 'none' ? 0 : 1;
    const exitOpacity = direction === 'none' ? 0 : (direction === 'push' ? 0.7 : 1);

    return (
        <div style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden' }}>
            <AnimatePresence initial={false} mode="sync">
                <motion.div
                    key={pageKey}
                    initial={{ x: enterFromX, opacity: enterOpacity }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: exitToX, opacity: exitOpacity }}
                    transition={{ duration, ease: iosEase }}
                    style={{ position: 'absolute', inset: 0, willChange: 'transform, opacity' }}
                >
                    {children}
                </motion.div>
            </AnimatePresence>
        </div>
    );
}
