'use client';

import * as React from 'react';
import { LayoutGrid, List } from 'lucide-react';
import CalendarIcon from 'lucide-react/dist/esm/icons/calendar';

export type ViewMode = 'grid' | 'table' | 'calendar';

interface ViewTogglerProps {
    viewMode: ViewMode;
    setViewMode: (mode: ViewMode) => void;
    /** Which modes are available. Defaults to grid+table. */
    modes?: ViewMode[];
}

const iconMap: Record<ViewMode, React.ElementType> = {
    grid: LayoutGrid,
    table: List,
    calendar: CalendarIcon,
};

const titleMap: Record<ViewMode, string> = {
    grid: 'Vista cuadricula',
    table: 'Vista lista',
    calendar: 'Vista calendario',
};

export function ViewToggler({ viewMode, setViewMode, modes = ['grid', 'table'] }: ViewTogglerProps) {
    return (
        <div className="inline-flex items-center gap-0.5 rounded-md border bg-card p-0.5">
            {modes.map((m) => {
                const Icon = iconMap[m];
                const active = viewMode === m;
                return (
                    <button
                        key={m}
                        onClick={() => setViewMode(m)}
                        title={titleMap[m]}
                        className={
                            'size-7 grid place-items-center rounded-sm transition-colors ' +
                            (active
                                ? 'bg-primary text-primary-foreground'
                                : 'text-muted-foreground hover:text-foreground hover:bg-accent')
                        }
                    >
                        <Icon className="size-3.5" />
                    </button>
                );
            })}
        </div>
    );
}
