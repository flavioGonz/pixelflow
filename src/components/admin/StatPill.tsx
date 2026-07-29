'use client';

import * as React from 'react';

export type StatTint = 'muted' | 'primary' | 'emerald' | 'amber' | 'rose' | 'blue' | 'violet';

const tintStyles: Record<StatTint, string> = {
    muted:   'border-border bg-card text-muted-foreground',
    primary: 'border-primary/25 bg-primary/5 text-primary',
    emerald: 'border-emerald-500/25 bg-emerald-500/5 text-emerald-700 dark:text-emerald-400',
    amber:   'border-amber-500/25 bg-amber-500/5 text-amber-700 dark:text-amber-400',
    rose:    'border-rose-500/25 bg-rose-500/5 text-rose-700 dark:text-rose-400',
    blue:    'border-blue-500/25 bg-blue-500/5 text-blue-700 dark:text-blue-400',
    violet:  'border-violet-500/25 bg-violet-500/5 text-violet-700 dark:text-violet-400',
};

interface StatPillProps {
    icon: React.ReactNode;
    label: string;
    value: React.ReactNode;
    tint?: StatTint;
    hint?: string;
}

export const StatPill: React.FC<StatPillProps> = ({ icon, label, value, tint = 'muted', hint }) => (
    <div className={'rounded-lg border px-3.5 py-2.5 flex items-center gap-2.5 transition-colors ' + tintStyles[tint]} title={hint}>
        <span className="shrink-0 opacity-80">{icon}</span>
        <div className="flex flex-col min-w-0">
            <span className="text-[10px] uppercase tracking-[0.14em] font-semibold opacity-70 truncate">{label}</span>
            <span className="font-mono text-lg font-bold tabular-nums leading-none">{value}</span>
        </div>
    </div>
);

interface InfoTipProps {
    icon?: React.ReactNode;
    title?: string;
    children: React.ReactNode;
    tint?: StatTint;
}

export const InfoTip: React.FC<InfoTipProps> = ({ icon, title, children, tint = 'blue' }) => (
    <div className={'rounded-lg border px-4 py-3 flex items-start gap-3 ' + tintStyles[tint]}>
        {icon && <span className="shrink-0 mt-0.5 opacity-80">{icon}</span>}
        <div className="min-w-0 text-[12px] leading-relaxed">
            {title && <div className="font-semibold mb-0.5 opacity-90">{title}</div>}
            <div className="opacity-80">{children}</div>
        </div>
    </div>
);
