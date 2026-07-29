'use client';

import { AnimatePresence, motion, PanInfo } from 'framer-motion';
import { ReactNode, useCallback } from 'react';

interface BottomSheetProps {
    open: boolean;
    onClose: () => void;
    children: ReactNode;
    /** Height as CSS value. Defaults to auto up to 85vh. */
    maxHeight?: string;
    /** Show drag handle at top. */
    showHandle?: boolean;
    /** Close by tapping backdrop. */
    dismissOnBackdropTap?: boolean;
}

const iosEase = [0.32, 0.72, 0, 1] as const;
const DISMISS_VELOCITY = 500;
const DISMISS_OFFSET = 120;

/**
 * iOS-style bottom sheet.
 * - Slides up from bottom with spring
 * - Backdrop fades in with blur
 * - Drag down to dismiss (velocity or offset threshold)
 * - Rounded top corners, safe-area padding
 */
export function BottomSheet({
    open,
    onClose,
    children,
    maxHeight = '85vh',
    showHandle = true,
    dismissOnBackdropTap = true,
}: BottomSheetProps) {
    const handleDragEnd = useCallback((_: any, info: PanInfo) => {
        if (info.offset.y > DISMISS_OFFSET || info.velocity.y > DISMISS_VELOCITY) {
            onClose();
        }
    }, [onClose]);

    return (
        <AnimatePresence>
            {open && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0, backdropFilter: 'blur(0px)' }}
                        animate={{ opacity: 1, backdropFilter: 'blur(8px)' }}
                        exit={{ opacity: 0, backdropFilter: 'blur(0px)' }}
                        transition={{ duration: 0.25, ease: iosEase }}
                        onClick={dismissOnBackdropTap ? onClose : undefined}
                        style={{
                            position: 'fixed', inset: 0, zIndex: 60,
                            background: 'rgba(0,0,0,0.4)',
                            WebkitBackdropFilter: 'blur(8px)',
                        }}
                    />
                    {/* Sheet */}
                    <motion.div
                        drag="y"
                        dragConstraints={{ top: 0, bottom: 0 }}
                        dragElastic={{ top: 0, bottom: 0.5 }}
                        onDragEnd={handleDragEnd}
                        initial={{ y: '100%' }}
                        animate={{ y: 0 }}
                        exit={{ y: '100%' }}
                        transition={{ type: 'spring', stiffness: 380, damping: 34 }}
                        style={{
                            position: 'fixed', left: 0, right: 0, bottom: 0, zIndex: 61,
                            background: 'var(--background, #0a0a0a)',
                            borderTopLeftRadius: 20, borderTopRightRadius: 20,
                            maxHeight,
                            paddingBottom: 'env(safe-area-inset-bottom, 12px)',
                            boxShadow: '0 -8px 32px rgba(0,0,0,0.35)',
                            touchAction: 'none',
                            overflow: 'hidden',
                            display: 'flex', flexDirection: 'column',
                        }}
                    >
                        {showHandle && (
                            <div style={{ padding: '10px 0 6px', display: 'grid', placeItems: 'center' }}>
                                <div style={{ width: 44, height: 5, borderRadius: 999, background: 'rgba(255,255,255,0.25)' }} />
                            </div>
                        )}
                        <div style={{ overflowY: 'auto', flex: 1, WebkitOverflowScrolling: 'touch' }}>
                            {children}
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
