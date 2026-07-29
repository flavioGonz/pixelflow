'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { io, Socket } from 'socket.io-client';
import * as Icons from 'lucide-react';

let sensorSocket: Socket | null = null;

interface SensorValueData {
    sensorId?: string;
    label?: string;
    theme?: 'card' | 'minimal' | 'circle' | 'strip' | 'gauge' | 'led' | 'big' | 'chip' | 'neon' | 'meter';
    color?: string;
    bgColor?: string;
    showLabel?: boolean;
    showUnit?: boolean;
    showIcon?: boolean;
    // Manual overrides — 0 or undefined means "auto scale to container".
    valueFontSize?: number;
    labelFontSize?: number;
    iconSize?: number;
    unitFontSize?: number;
    // Relative scale — multiplies the auto-computed sizes. 1 = default, 1.5 = 50% larger.
    contentScale?: number;
    icon?: string;
    fontFamily?: 'sans' | 'mono' | 'display';
    precision?: number;
    unitOverride?: string;
    lowThreshold?: number;
    highThreshold?: number;
    lowColor?: string;
    highColor?: string;
    pulseWhenOnline?: boolean;
    blinkOnChange?: boolean;
    min?: number;
    max?: number;
}

const FONT_MAP: Record<string, string> = {
    sans: 'ui-sans-serif, system-ui, sans-serif',
    mono: '"Courier New", "SF Mono", monospace',
    display: 'Georgia, "Times New Roman", serif',
};

/** Observe a container's size. Returns ref + width/height in px. */
function useContainerSize<T extends HTMLElement>(): [React.RefObject<T | null>, number, number] {
    const ref = React.useRef<T | null>(null);
    const [size, setSize] = React.useState<{ w: number; h: number }>({ w: 0, h: 0 });
    React.useEffect(() => {
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
    return [ref, size.w, size.h];
}

const SensorValueWidget: React.FC<{ data: SensorValueData }> = ({ data }) => {
    const [sensor, setSensor] = React.useState<any>(null);
    const [changed, setChanged] = React.useState(false);
    const [wrapRef, w, h] = useContainerSize<HTMLDivElement>();
    const theme = data.theme || 'card';
    const baseColor = data.color || '#3b82f6';
    const bgColor = data.bgColor || 'transparent';
    const showLabel = data.showLabel !== false;
    const showUnit = data.showUnit !== false;
    const showIcon = data.showIcon !== false;
    const fontFamily = FONT_MAP[data.fontFamily || 'sans'];
    const iconName = data.icon || 'Thermometer';
    const AnyIcon = (Icons as any)[iconName] || Icons.Thermometer;
    const scale = data.contentScale && data.contentScale > 0 ? data.contentScale : 1;

    // Auto-scale everything from container size.
    const baseSide = Math.max(60, Math.min(w || 200, h || 200));
    const iconPxFinal = (data.iconSize && data.iconSize > 0 ? data.iconSize : baseSide * 0.16) * scale;
    const valuePx = (data.valueFontSize && data.valueFontSize > 0 ? data.valueFontSize : baseSide * 0.32) * scale;
    const labelPx = (data.labelFontSize && data.labelFontSize > 0 ? data.labelFontSize : baseSide * 0.09) * scale;
    const unitPx  = (data.unitFontSize  && data.unitFontSize  > 0 ? data.unitFontSize  : baseSide * 0.14) * scale;

    // Compute numeric value for threshold comparison
    const rawVal = sensor?.lastValue;
    let numVal: number | null = null;
    if (typeof rawVal === 'number') numVal = rawVal;
    else if (typeof rawVal === 'boolean') numVal = rawVal ? 1 : 0;
    else if (typeof rawVal === 'string') {
        const sl = rawVal.toLowerCase();
        if (sl === 'on') numVal = 1;
        else if (sl === 'off') numVal = 0;
        else if (!isNaN(parseFloat(rawVal))) numVal = parseFloat(rawVal);
    }
    const val = numVal;

    let color = baseColor;
    if (numVal != null) {
        if (data.lowThreshold != null && numVal < data.lowThreshold && data.lowColor) color = data.lowColor;
        else if (data.highThreshold != null && numVal > data.highThreshold && data.highColor) color = data.highColor;
    }

    const prevValueRef = React.useRef<any>(undefined);
    React.useEffect(() => {
        if (prevValueRef.current !== undefined && prevValueRef.current !== sensor?.lastValue && data.blinkOnChange) {
            setChanged(true);
            const t = window.setTimeout(() => setChanged(false), 600);
            prevValueRef.current = sensor?.lastValue;
            return () => window.clearTimeout(t);
        }
        prevValueRef.current = sensor?.lastValue;
    }, [sensor?.lastValue, data.blinkOnChange]);

    React.useEffect(() => {
        if (!sensorSocket) sensorSocket = io();
        const s = sensorSocket;
        const onList = (list: any[]) => {
            if (!data.sensorId) return;
            const found = list.find((x) => x._id === data.sensorId);
            if (found) setSensor(found);
        };
        s.on('sensors_list', onList);
        s.on('connect', () => { s.emit('get_sensors'); });
        if (s.connected) s.emit('get_sensors');
        const t = setInterval(() => s.emit('get_sensors'), 8000);
        return () => { s.off('sensors_list', onList); clearInterval(t); };
    }, [data.sensorId]);

    const unit = data.unitOverride || sensor?.unit || '';
    const label = data.label || sensor?.name || 'Sensor';
    const precision = data.precision ?? sensor?.precision ?? 1;
    const isOnline = !!sensor?.isOnline;

    const displayValue = sensor?.lastValue == null ? '—'
        : (typeof sensor.lastValue === 'number' ? sensor.lastValue.toFixed(precision)
        : (typeof sensor.lastValue === 'boolean' ? (sensor.lastValue ? 'ON' : 'OFF') : String(sensor.lastValue)));

    const pulseAnim = (data.pulseWhenOnline && isOnline) ? {
        boxShadow: [
            '0 0 0 0 ' + color + '99',
            '0 0 0 14px ' + color + '00',
            '0 0 0 0 ' + color + '00',
        ],
        transition: { duration: 2, repeat: Infinity, ease: 'easeOut' as const },
    } : undefined;

    // Style helpers reused across themes
    const iconStyle: React.CSSProperties = { width: iconPxFinal, height: iconPxFinal, color };

    const renderTheme = () => {
        switch (theme) {
            case 'card':
                return (
                    <motion.div
                        animate={pulseAnim}
                        style={{ background: bgColor === 'transparent' ? undefined : bgColor, fontFamily, color }}
                        className="w-full h-full p-4 rounded-2xl border border-white/10 bg-black/30 backdrop-blur-md flex flex-col justify-between overflow-hidden relative"
                    >
                        <div className="flex items-center gap-2">
                            {showIcon && <AnyIcon style={iconStyle} className="shrink-0" />}
                            {showLabel && <span className="font-bold uppercase tracking-widest opacity-70 truncate" style={{ fontSize: labelPx, color: '#e2e8f0' }}>{label}</span>}
                            {isOnline && <span className="ml-auto rounded-full bg-emerald-400 shadow-[0_0_6px_#10b981]" style={{ width: Math.max(4, baseSide*0.02), height: Math.max(4, baseSide*0.02) }} />}
                        </div>
                        <div className="flex items-end gap-2 justify-end">
                            <AnimatePresence mode="wait">
                                <motion.span
                                    key={displayValue}
                                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                                    className="font-black tabular-nums leading-none"
                                    style={{ fontSize: valuePx, color }}
                                >{displayValue}</motion.span>
                            </AnimatePresence>
                            {showUnit && unit && <span className="opacity-70 font-semibold" style={{ color, fontSize: unitPx, marginBottom: valuePx * 0.05 }}>{unit}</span>}
                        </div>
                    </motion.div>
                );

            case 'minimal':
                return (
                    <div style={{ background: bgColor, fontFamily, color }} className="w-full h-full flex flex-col items-center justify-center p-3">
                        {showLabel && <span className="font-bold uppercase tracking-[0.2em] opacity-60" style={{ fontSize: labelPx }}>{label}</span>}
                        <div className="flex items-baseline gap-1.5 mt-1">
                            <span className="font-light tabular-nums leading-none" style={{ fontSize: valuePx, color }}>{displayValue}</span>
                            {showUnit && unit && <span className="opacity-70 font-light" style={{ fontSize: unitPx }}>{unit}</span>}
                        </div>
                    </div>
                );

            case 'circle':
                return (
                    <motion.div
                        animate={pulseAnim}
                        style={{ background: `radial-gradient(circle at center, ${color}22, transparent 70%)`, fontFamily }}
                        className="w-full h-full flex flex-col items-center justify-center p-2"
                    >
                        <div className="rounded-full border-4 grid place-items-center relative"
                             style={{ borderColor: color, background: 'rgba(0,0,0,0.4)', width: baseSide * 0.78, height: baseSide * 0.78 }}>
                            <div className="flex flex-col items-center">
                                {showIcon && <AnyIcon style={{ ...iconStyle, opacity: 0.7, marginBottom: baseSide * 0.02 }} />}
                                <span className="font-black tabular-nums leading-none" style={{ fontSize: valuePx, color }}>{displayValue}</span>
                                {showUnit && unit && <span className="opacity-70 mt-1" style={{ color, fontSize: unitPx }}>{unit}</span>}
                            </div>
                        </div>
                        {showLabel && <div className="font-bold uppercase tracking-widest opacity-60 mt-2" style={{ color: '#e2e8f0', fontSize: labelPx }}>{label}</div>}
                    </motion.div>
                );

            case 'strip':
                return (
                    <div style={{ background: bgColor, fontFamily, color }} className="w-full h-full flex items-center gap-4 px-4 border-l-4">
                        <div className="border-l-4 h-3/4 pl-3" style={{ borderColor: color }}>
                            {showIcon && <AnyIcon style={{ ...iconStyle, marginBottom: baseSide * 0.02 }} />}
                            {showLabel && <div className="font-bold uppercase tracking-wider opacity-70" style={{ fontSize: labelPx }}>{label}</div>}
                        </div>
                        <div className="ml-auto flex items-baseline gap-1.5">
                            <span className="font-bold tabular-nums" style={{ fontSize: valuePx, color }}>{displayValue}</span>
                            {showUnit && unit && <span className="opacity-70" style={{ fontSize: unitPx }}>{unit}</span>}
                        </div>
                    </div>
                );

            case 'gauge': {
                const min = data.min ?? 0;
                const max = data.max ?? 100;
                const clamped = Math.max(min, Math.min(max, val ?? min));
                const pct = ((clamped - min) / (max - min)) * 100;
                const r = 40, C = 2 * Math.PI * r;
                const arc = (pct / 100) * (C * 0.75);
                return (
                    <div style={{ background: bgColor, fontFamily }} className="w-full h-full flex flex-col items-center justify-center p-3">
                        <svg viewBox="0 0 100 100" className="w-full max-w-[80%]" style={{ transform: 'rotate(135deg)' }}>
                            <circle cx="50" cy="50" r={r} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="8" strokeDasharray={C * 0.75 + ' ' + C} strokeLinecap="round" />
                            <motion.circle
                                cx="50" cy="50" r={r} fill="none" stroke={color} strokeWidth="8"
                                strokeDasharray={arc + ' ' + C} strokeLinecap="round"
                                animate={{ strokeDasharray: arc + ' ' + C }} transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                                style={{ filter: `drop-shadow(0 0 6px ${color})` }}
                            />
                        </svg>
                        <div className="-mt-[45%] flex flex-col items-center pointer-events-none">
                            <span className="font-black tabular-nums leading-none" style={{ fontSize: valuePx, color }}>{displayValue}</span>
                            {showUnit && unit && <span className="opacity-70" style={{ color, fontSize: unitPx }}>{unit}</span>}
                            {showLabel && <span className="uppercase tracking-widest mt-1 opacity-60" style={{ color: '#e2e8f0', fontSize: labelPx }}>{label}</span>}
                        </div>
                    </div>
                );
            }

            case 'led':
                return (
                    <div style={{ background: '#0a0a0a', fontFamily: '"Courier New", monospace' }} className="w-full h-full flex flex-col items-center justify-center p-3 border border-white/5 rounded-lg">
                        {showLabel && <div className="uppercase tracking-widest text-emerald-500/60" style={{ fontSize: labelPx }}>{label}</div>}
                        <div className="relative">
                            <span className="font-black tabular-nums leading-none tracking-widest"
                                style={{ fontSize: valuePx, color, textShadow: `0 0 8px ${color}, 0 0 20px ${color}88` }}>
                                {displayValue}
                            </span>
                            <span className="absolute inset-0 font-black tabular-nums leading-none tracking-widest opacity-10"
                                style={{ fontSize: valuePx, color: '#fff' }}>
                                {displayValue.replace(/./g, '8')}
                            </span>
                        </div>
                        {showUnit && unit && <div className="opacity-70 mt-1 uppercase" style={{ color, fontSize: unitPx }}>{unit}</div>}
                    </div>
                );

            case 'big':
                return (
                    <div style={{ background: bgColor, fontFamily }} className="w-full h-full grid place-items-center p-3">
                        <div className="flex flex-col items-center">
                            <span className="font-black italic tabular-nums leading-none tracking-tighter" style={{ fontSize: valuePx * 1.6, color }}>{displayValue}</span>
                            {showUnit && unit && <span className="opacity-70 font-bold" style={{ fontSize: unitPx * 1.4, color }}>{unit}</span>}
                            {showLabel && <span className="uppercase tracking-[0.3em] font-bold opacity-60 mt-2" style={{ color: '#e2e8f0', fontSize: labelPx }}>{label}</span>}
                        </div>
                    </div>
                );

            case 'chip':
                return (
                    <div style={{ fontFamily }} className="w-full h-full grid place-items-center p-2">
                        <div className="inline-flex items-center gap-2 rounded-full border-2" style={{ background: color + '15', borderColor: color, padding: `${baseSide*0.03}px ${baseSide*0.06}px` }}>
                            {showIcon && <AnyIcon style={iconStyle} />}
                            <span className="font-bold tabular-nums" style={{ fontSize: valuePx * 0.6, color }}>{displayValue}{showUnit && unit ? ' ' + unit : ''}</span>
                            {showLabel && <span className="opacity-70 pl-1 border-l" style={{ borderColor: color + '55', color, fontSize: labelPx }}>{label}</span>}
                        </div>
                    </div>
                );

            case 'neon':
                return (
                    <div style={{ background: '#0a0a0a', fontFamily: '"Courier New", monospace' }} className="w-full h-full grid place-items-center p-3 rounded-lg border-2">
                        <div className="text-center" style={{ color, textShadow: `0 0 4px ${color}, 0 0 14px ${color}, 0 0 30px ${color}` }}>
                            {showLabel && <div className="uppercase tracking-[0.3em] mb-1 opacity-90" style={{ fontSize: labelPx }}>{label}</div>}
                            <div className="font-black tabular-nums leading-none" style={{ fontSize: valuePx * 1.2 }}>{displayValue}</div>
                            {showUnit && unit && <div className="opacity-90 uppercase mt-1" style={{ fontSize: unitPx }}>{unit}</div>}
                        </div>
                    </div>
                );

            case 'meter': {
                const min = data.min ?? 0;
                const max = data.max ?? 100;
                const clamped = Math.max(min, Math.min(max, val ?? min));
                const pct = ((clamped - min) / (max - min)) * 100;
                return (
                    <div style={{ background: bgColor, fontFamily, color }} className="w-full h-full flex flex-col justify-center p-3 gap-2">
                        <div className="flex items-baseline gap-2">
                            {showIcon && <AnyIcon style={iconStyle} />}
                            {showLabel && <span className="uppercase tracking-widest opacity-70" style={{ fontSize: labelPx }}>{label}</span>}
                            <span className="ml-auto font-black tabular-nums" style={{ fontSize: valuePx * 0.7, color }}>{displayValue}{showUnit && unit ? ' ' + unit : ''}</span>
                        </div>
                        <div className="rounded-full bg-white/10 overflow-hidden" style={{ height: Math.max(6, baseSide * 0.04) }}>
                            <motion.div className="h-full rounded-full" style={{ background: color, boxShadow: `0 0 8px ${color}88` }}
                                animate={{ width: pct + '%' }} transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }} />
                        </div>
                        <div className="flex justify-between opacity-50 font-mono" style={{ fontSize: labelPx * 0.75 }}>
                            <span>{min}</span><span>{max}</span>
                        </div>
                    </div>
                );
            }

            default:
                return null;
        }
    };

    return (
        <motion.div
            ref={wrapRef}
            animate={changed ? {
                scale: [1, 1.08, 1],
                filter: [
                    'brightness(1)',
                    'brightness(1.4) drop-shadow(0 0 12px ' + color + ')',
                    'brightness(1)',
                ],
            } : { scale: 1, filter: 'brightness(1)' }}
            transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
            className="w-full h-full relative"
        >
            {renderTheme()}
        </motion.div>
    );
};

export default SensorValueWidget;
