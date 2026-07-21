/**
 * Stable hash-based color assignment for layouts.
 * Same layoutId always returns the same color from a curated, accessible palette.
 */

// Palette tuned for both light and dark backgrounds (mid-saturation, no neon)
const PALETTE = [
    { bg: '#6366f1', fg: '#ffffff', label: 'Indigo' },     // Primary brand
    { bg: '#10b981', fg: '#ffffff', label: 'Emerald' },
    { bg: '#f59e0b', fg: '#1f1500', label: 'Amber' },
    { bg: '#ef4444', fg: '#ffffff', label: 'Red' },
    { bg: '#8b5cf6', fg: '#ffffff', label: 'Violet' },
    { bg: '#ec4899', fg: '#ffffff', label: 'Pink' },
    { bg: '#06b6d4', fg: '#ffffff', label: 'Cyan' },
    { bg: '#84cc16', fg: '#1a2300', label: 'Lime' },
    { bg: '#f97316', fg: '#ffffff', label: 'Orange' },
    { bg: '#14b8a6', fg: '#ffffff', label: 'Teal' },
    { bg: '#a855f7', fg: '#ffffff', label: 'Purple' },
    { bg: '#0ea5e9', fg: '#ffffff', label: 'Sky' },
];

function djb2(str: string): number {
    let hash = 5381;
    for (let i = 0; i < str.length; i++) {
        hash = ((hash << 5) + hash) + str.charCodeAt(i);
        hash = hash & hash; // 32-bit
    }
    return Math.abs(hash);
}

export interface LayoutColor {
    bg: string;
    fg: string;
    label: string;
}

export function colorForLayout(layoutId?: string | null): LayoutColor {
    if (!layoutId) return PALETTE[0];
    return PALETTE[djb2(layoutId) % PALETTE.length];
}
