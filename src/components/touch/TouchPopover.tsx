'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { ReactNode } from 'react';

interface TouchPopoverProps {
    open: boolean;
    onClose: () => void;
    children: ReactNode;
    /** Origin for scale-in animation (transform-origin CSS value). */
    origin?: string;
    /** Optional backdrop click to dismiss. */
    dismissOnBackdropTap?: boolean;
}

const iosEase = [0.32, 0.72, 0, 1] as const;

/**
 * iOS-style popover: backdrop blur + scale-in card centered on the screen.
 * Use for confirmations, contextual menus, or brief details.
 */
export function TouchPopover({ open, onClose, children, origin = 'center', dismissOnBackdropTap = true }: TouchPopoverProps) {
    return (
        <AnimatePresence>
            {open && (
                <>
                    <motion.div
                        initial={{ opacity: 0, backdropFilter: 'blur(0px)' }}
                        animate={{ opacity: 1, backdropFilter: 'blur(10px)' }}
                        exit={{ opacity: 0, backdropFilter: 'blur(0px)' }}
                        transition={{ duration: 0.2, ease: iosEase }}
                        onClick={dismissOnBackdropTap ? onClose : undefined}
                        style={{
                            position: 'fixed', inset: 0, zIndex: 70,
                            background: 'rgba(0,0,0,0.45)',
                            WebkitBackdropFilter: 'blur(10px)',
                            display: 'grid', placeItems: 'center',
                        }}
                    >
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{ duration: 0.22, ease: iosEase }}
                            onClick={(e) => e.stopPropagation()}
                            style={{
                                transformOrigin: origin,
                                background: 'var(--background, #0a0a0a)',
                                borderRadius: 20,
                                padding: 20,
                                minWidth: 280,
                                maxWidth: '90vw', maxHeight: '85vh',
                                overflow: 'auto',
                                boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
                            }}
                        >
                            {children}
                        </motion.div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
