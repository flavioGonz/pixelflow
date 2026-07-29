'use client';

import { motion, HTMLMotionProps } from 'framer-motion';
import { forwardRef, ReactNode } from 'react';

/**
 * iOS-style tactile button.
 * - Scale down to 0.96 on press (iOS spring)
 * - No hover-only states
 * - Min 48px hit area
 * - Optional haptic feedback (vibration) on capable devices
 */
interface TouchButtonProps extends Omit<HTMLMotionProps<'button'>, 'children'> {
    children: ReactNode;
    haptic?: boolean;
}

export const TouchButton = forwardRef<HTMLButtonElement, TouchButtonProps>(
    ({ children, haptic = true, onClick, className, style, ...rest }, ref) => {
        const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
            if (haptic && typeof navigator !== 'undefined' && 'vibrate' in navigator) {
                try { (navigator as any).vibrate?.(6); } catch { /* ignore */ }
            }
            onClick?.(e as any);
        };
        return (
            <motion.button
                ref={ref}
                whileTap={{ scale: 0.96 }}
                transition={{ type: 'spring', stiffness: 500, damping: 30, mass: 0.6 }}
                onClick={handleClick}
                className={className}
                style={{ minHeight: 48, WebkitTapHighlightColor: 'transparent', ...style }}
                {...rest}
            >
                {children}
            </motion.button>
        );
    }
);
TouchButton.displayName = 'TouchButton';
