'use client';

import React from 'react';
import { useContainerSize } from '@/hooks/useContainerSize';
import { motion } from 'framer-motion';

interface DataTableCol {
    key: string;
    label: string;
    align?: 'left' | 'right' | 'center';
    width?: string; // e.g. '80px' or '20%'
    isNumber?: boolean;
    isCurrency?: boolean;
}

interface DataTableWidgetProps {
    data: {
        title?: string;
        columns?: DataTableCol[];
        rows?: Record<string, any>[];
        density?: 'compact' | 'comfortable' | 'spacious';
        striped?: boolean;
        showHeader?: boolean;
        titleColor?: string;
        headerBg?: string;
        headerColor?: string;
        rowBg?: string;
        rowColor?: string;
        altRowBg?: string;
        borderColor?: string;
        fontFamily?: string;
        headerFontSize?: number;
        cellFontSize?: number;
        titleFontSize?: number;
        theme?: 'clean' | 'excel' | 'dark' | 'newspaper' | 'premium';
    };
}

const DEFAULT_COLS: DataTableCol[] = [
    { key: 'nombre', label: 'Item', align: 'left' },
    { key: 'cantidad', label: 'Cant.', align: 'right', width: '80px', isNumber: true },
    { key: 'precio', label: 'Precio', align: 'right', width: '110px', isCurrency: true },
];

const DEFAULT_ROWS = [
    { nombre: 'Café espresso', cantidad: 12, precio: 3.50 },
    { nombre: 'Cappuccino', cantidad: 8, precio: 4.20 },
    { nombre: 'Latte', cantidad: 6, precio: 4.80 },
    { nombre: 'Té chai', cantidad: 4, precio: 3.90 },
];

const themePresets: Record<string, Partial<DataTableWidgetProps['data']>> = {
    clean:     { headerBg: '#0f172a', headerColor: '#ffffff', rowBg: '#ffffff', rowColor: '#0f172a', altRowBg: '#f8fafc', borderColor: '#e2e8f0' },
    excel:     { headerBg: '#217346', headerColor: '#ffffff', rowBg: '#ffffff', rowColor: '#111827', altRowBg: '#f0f9f4', borderColor: '#d0e5db' },
    dark:      { headerBg: '#1e293b', headerColor: '#f1f5f9', rowBg: '#0f172a', rowColor: '#e2e8f0', altRowBg: '#1e293b', borderColor: '#334155' },
    newspaper: { headerBg: '#111', headerColor: '#fff', rowBg: '#fafaf7', rowColor: '#111', altRowBg: '#f0efe8', borderColor: '#333' },
    premium:   { headerBg: '#111', headerColor: '#facc15', rowBg: '#0a0a0a', rowColor: '#f1f5f9', altRowBg: '#151515', borderColor: '#facc1533' },
};

const DataTableWidget: React.FC<DataTableWidgetProps> = ({ data }) => {
    const theme = data.theme || 'clean';
    const [wrapRef, , h] = useContainerSize<HTMLDivElement>();
    const heightScale = Math.max(0.5, Math.min(2.5, (h || 400) / 500));
    const preset = themePresets[theme] || themePresets.clean;
    const cfg = { ...preset, ...data };

    const cols = (cfg.columns && cfg.columns.length > 0 ? cfg.columns : DEFAULT_COLS);
    const rows = (cfg.rows && cfg.rows.length > 0 ? cfg.rows : DEFAULT_ROWS);
    const density = cfg.density || 'compact';
    const showHeader = cfg.showHeader !== false;

    const padY = density === 'compact' ? 'py-1.5' : density === 'spacious' ? 'py-3' : 'py-2';
    const padX = density === 'compact' ? 'px-2' : density === 'spacious' ? 'px-4' : 'px-3';
    const fontSize = density === 'compact' ? 'text-[11px]' : density === 'spacious' ? 'text-base' : 'text-sm';

    return (
        <motion.div
            ref={wrapRef}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="w-full h-full flex flex-col overflow-hidden font-sans"
            style={{ background: cfg.rowBg, color: cfg.rowColor, fontFamily: cfg.fontFamily }}
        >
            {cfg.title && (
                <div className={'shrink-0 font-bold ' + padX + ' ' + padY + ' ' + (cfg.titleFontSize ? '' : (density === 'compact' ? 'text-sm' : 'text-lg')) + ' border-b'}
                     style={{ borderColor: cfg.borderColor, color: cfg.titleColor || cfg.rowColor, fontSize: cfg.titleFontSize ? cfg.titleFontSize + 'px' : (18 * heightScale + 'px') }}>
                    {cfg.title}
                </div>
            )}

            <div className="flex-1 overflow-auto">
                <table className={'w-full border-collapse ' + (cfg.cellFontSize ? '' : fontSize)} style={{ tableLayout: 'auto', fontSize: cfg.cellFontSize ? cfg.cellFontSize + 'px' : (13 * heightScale + 'px') }}>
                    {showHeader && (
                        <thead className="sticky top-0 z-10" style={{ background: cfg.headerBg, color: cfg.headerColor, fontSize: cfg.headerFontSize ? cfg.headerFontSize + 'px' : (12 * heightScale + 'px') }}>
                            <tr>
                                {cols.map((c) => (
                                    <th
                                        key={c.key}
                                        className={padX + ' ' + padY + ' font-bold uppercase tracking-wider ' + (c.align === 'right' ? 'text-right' : c.align === 'center' ? 'text-center' : 'text-left')}
                                        style={{ width: c.width, borderBottom: '2px solid ' + (cfg.borderColor || '#e2e8f0') }}
                                    >
                                        {c.label}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                    )}
                    <tbody>
                        {rows.map((r, i) => {
                            const bg = cfg.striped !== false && i % 2 === 1 ? cfg.altRowBg : cfg.rowBg;
                            return (
                                <tr key={i} style={{ background: bg }}>
                                    {cols.map((c) => {
                                        let val: any = (r as any)[c.key];
                                        if (c.isCurrency && typeof val === 'number') val = '$' + val.toFixed(2);
                                        else if (c.isNumber && typeof val === 'number') val = val.toLocaleString('es');
                                        return (
                                            <td
                                                key={c.key}
                                                className={padX + ' ' + padY + ' ' + (c.align === 'right' ? 'text-right tabular-nums font-mono' : c.align === 'center' ? 'text-center' : 'text-left') + ' truncate'}
                                                style={{ borderBottom: '1px solid ' + (cfg.borderColor || '#e2e8f0') }}
                                            >
                                                {val ?? ''}
                                            </td>
                                        );
                                    })}
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </motion.div>
    );
};

export default DataTableWidget;
