'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface FeedbackWidgetProps {
    data: {
        title?: string;
        subtitle?: string;
        thanksMessage?: string;
        source?: string; // context identifier stored with response
        accentColor?: string;
    };
}

const OPTIONS = [
    { emoji: '😍', label: 'Excelente', value: 5 },
    { emoji: '😃', label: 'Bueno',     value: 4 },
    { emoji: '😐', label: 'Regular',   value: 3 },
    { emoji: '😕', label: 'Malo',      value: 2 },
    { emoji: '😡', label: 'Terrible',  value: 1 },
];

const FeedbackWidget: React.FC<FeedbackWidgetProps> = ({ data }) => {
    const [choice, setChoice] = React.useState<number | null>(null);
    const [busy, setBusy] = React.useState(false);
    const title = data.title || '¿Cómo fue tu experiencia?';
    const subtitle = data.subtitle || 'Tocá una carita para valorarnos';
    const thanks = data.thanksMessage || '¡Gracias por tu opinión!';
    const source = data.source || 'default';
    const accent = data.accentColor || '#3b82f6';

    const submit = async (value: number) => {
        setChoice(value);
        setBusy(true);
        try {
            await fetch('/api/feedback', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    value,
                    source,
                    userAgent: navigator.userAgent,
                    at: new Date().toISOString(),
                }),
            });
        } catch { /* ignore — cliente offline no bloquea la respuesta visual */ }
        setBusy(false);
        // Auto-reset after 4s so el próximo huésped puede votar
        setTimeout(() => setChoice(null), 4000);
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full h-full flex flex-col items-center justify-center gap-4 p-4 rounded-2xl bg-white/5 backdrop-blur-md border border-white/10 shadow-2xl"
        >
            <AnimatePresence mode="wait">
                {choice === null ? (
                    <motion.div
                        key="ask"
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        className="flex flex-col items-center gap-4 w-full"
                    >
                        <div className="text-center">
                            <h3 className="text-white text-xl md:text-3xl font-black leading-tight">{title}</h3>
                            <p className="text-white/60 text-[11px] md:text-sm font-medium mt-1 uppercase tracking-wider">{subtitle}</p>
                        </div>
                        <div className="grid grid-cols-5 gap-2 md:gap-4 w-full max-w-2xl">
                            {OPTIONS.map((o) => (
                                <motion.button
                                    key={o.value}
                                    whileTap={{ scale: 0.9 }}
                                    whileHover={{ scale: 1.06, y: -4 }}
                                    onClick={() => submit(o.value)}
                                    disabled={busy}
                                    className="aspect-square rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 backdrop-blur-md flex flex-col items-center justify-center gap-1 transition-colors disabled:opacity-50"
                                    style={{ minHeight: 72 }}
                                >
                                    <span className="text-4xl md:text-6xl leading-none">{o.emoji}</span>
                                    <span className="text-[9px] md:text-[10px] font-bold uppercase tracking-widest text-white/60">{o.label}</span>
                                </motion.button>
                            ))}
                        </div>
                    </motion.div>
                ) : (
                    <motion.div
                        key="thanks"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className="text-center space-y-3"
                    >
                        <div className="text-7xl md:text-9xl">{OPTIONS.find(o => o.value === choice)?.emoji}</div>
                        <h3 className="text-white text-xl md:text-3xl font-black" style={{ color: accent }}>{thanks}</h3>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

export default FeedbackWidget;
