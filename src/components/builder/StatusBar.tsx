'use client';

import * as React from 'react';
import { WidgetConfig } from '@/store/usePlayerStore';
import MousePointer2 from 'lucide-react/dist/esm/icons/mouse-pointer-2';
import Move from 'lucide-react/dist/esm/icons/move';
import Maximize2 from 'lucide-react/dist/esm/icons/maximize-2';
import Grid3x3 from 'lucide-react/dist/esm/icons/grid-3x3';

interface StatusBarProps {
    selected: WidgetConfig | null;
    totalWidgets: number;
    gridSize: number;
    /** Optional cursor position over canvas in % (set externally) */
    cursorPct?: { x: number; y: number } | null;
}

export const StatusBar: React.FC<StatusBarProps> = ({
    selected,
    totalWidgets,
    gridSize,
    cursorPct,
}) => {
    return (
        <div className="h-7 px-4 flex items-center justify-between text-[11px] font-mono tabular-nums border-t bg-card text-muted-foreground">
            <div className="flex items-center gap-4">
                {selected ? (
                    <>
                        <span className="flex items-center gap-1.5">
                            <Move className="size-3" />
                            X <span className="text-foreground">{Math.round(selected.x)}</span>%
                            <span className="mx-0.5">·</span>
                            Y <span className="text-foreground">{Math.round(selected.y)}</span>%
                        </span>
                        <span className="flex items-center gap-1.5">
                            <Maximize2 className="size-3" />
                            W <span className="text-foreground">{Math.round(selected.w)}</span>%
                            <span className="mx-0.5">·</span>
                            H <span className="text-foreground">{Math.round(selected.h)}</span>%
                        </span>
                        <span className="text-foreground/80">[{selected.type}]</span>
                    </>
                ) : (
                    <span className="flex items-center gap-1.5">
                        <MousePointer2 className="size-3" />
                        Sin selección · {totalWidgets} widget{totalWidgets === 1 ? '' : 's'} en el lienzo
                    </span>
                )}
            </div>

            <div className="flex items-center gap-4">
                {cursorPct && (
                    <span>cursor {cursorPct.x.toFixed(1)}, {cursorPct.y.toFixed(1)}</span>
                )}
                <span className="flex items-center gap-1.5">
                    <Grid3x3 className="size-3" />
                    Grid {gridSize}px
                </span>
            </div>
        </div>
    );
};
