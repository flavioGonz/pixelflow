'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Sun from 'lucide-react/dist/esm/icons/sun';
import Moon from 'lucide-react/dist/esm/icons/moon';
import Monitor from 'lucide-react/dist/esm/icons/monitor';
import { Button } from '@/components/ui/button';
import { useTheme } from './ThemeProvider';

interface ThemeToggleProps {
    variant?: 'icon' | 'segmented';
    className?: string;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ variant = 'icon', className = '' }) => {
    const { theme, mode, setMode, toggle } = useTheme();

    if (variant === 'segmented') {
        const items: { value: 'light' | 'system' | 'dark'; icon: React.ElementType; label: string }[] = [
            { value: 'light', icon: Sun, label: 'Light' },
            { value: 'system', icon: Monitor, label: 'System' },
            { value: 'dark', icon: Moon, label: 'Dark' },
        ];
        return (
            <div
                role="radiogroup"
                aria-label="Tema"
                className={'inline-flex items-center gap-0.5 p-1 rounded-md border bg-card ' + className}
            >
                {items.map(({ value, icon: Icon, label }) => {
                    const active = mode === value;
                    return (
                        <button
                            key={value}
                            role="radio"
                            aria-checked={active}
                            aria-label={label}
                            onClick={() => setMode(value)}
                            className={'relative h-7 w-7 grid place-items-center rounded-sm text-[13px] transition-colors ' + (active ? 'text-primary-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-accent')}
                        >
                            {active && (
                                <motion.span
                                    layoutId="theme-toggle-active"
                                    className="absolute inset-0 rounded-sm bg-primary"
                                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                                />
                            )}
                            <Icon className="relative z-10" size={14} strokeWidth={2} />
                        </button>
                    );
                })}
            </div>
        );
    }

    return (
        <Button
            variant="ghost"
            size="icon"
            aria-label={'Cambiar a tema ' + (theme === 'dark' ? 'claro' : 'oscuro')}
            title={'Cambiar a tema ' + (theme === 'dark' ? 'claro' : 'oscuro')}
            onClick={toggle}
            className={'relative ' + className}
        >
            <AnimatePresence mode="wait" initial={false}>
                {theme === 'dark' ? (
                    <motion.span
                        key="moon"
                        initial={{ opacity: 0, rotate: -90, scale: 0.6 }}
                        animate={{ opacity: 1, rotate: 0, scale: 1 }}
                        exit={{ opacity: 0, rotate: 90, scale: 0.6 }}
                        transition={{ duration: 0.18 }}
                        className="absolute inset-0 grid place-items-center"
                    >
                        <Moon size={18} strokeWidth={1.75} />
                    </motion.span>
                ) : (
                    <motion.span
                        key="sun"
                        initial={{ opacity: 0, rotate: 90, scale: 0.6 }}
                        animate={{ opacity: 1, rotate: 0, scale: 1 }}
                        exit={{ opacity: 0, rotate: -90, scale: 0.6 }}
                        transition={{ duration: 0.18 }}
                        className="absolute inset-0 grid place-items-center"
                    >
                        <Sun size={18} strokeWidth={1.75} />
                    </motion.span>
                )}
            </AnimatePresence>
        </Button>
    );
};
