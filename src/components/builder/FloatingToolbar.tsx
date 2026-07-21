'use client';

import * as React from 'react';
import { WidgetConfig } from '@/store/usePlayerStore';
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import Copy from 'lucide-react/dist/esm/icons/copy';
import Trash2 from 'lucide-react/dist/esm/icons/trash-2';
import BringToFront from 'lucide-react/dist/esm/icons/bring-to-front';
import SendToBack from 'lucide-react/dist/esm/icons/send-to-back';
import AlignStartHorizontal from 'lucide-react/dist/esm/icons/align-start-horizontal';
import AlignEndHorizontal from 'lucide-react/dist/esm/icons/align-end-horizontal';
import AlignCenterHorizontal from 'lucide-react/dist/esm/icons/align-center-horizontal';
import AlignStartVertical from 'lucide-react/dist/esm/icons/align-start-vertical';
import AlignEndVertical from 'lucide-react/dist/esm/icons/align-end-vertical';
import AlignCenterVertical from 'lucide-react/dist/esm/icons/align-center-vertical';
import Lock from 'lucide-react/dist/esm/icons/lock';

interface FloatingToolbarProps {
    widget: WidgetConfig | null;
    /** Bounding rect of the canvas (for positioning) */
    canvasRef: React.RefObject<HTMLDivElement | null>;
    onDuplicate: () => void;
    onDelete: () => void;
    onBringForward: () => void;
    onSendBackward: () => void;
    onAlign: (axis: 'left' | 'center-h' | 'right' | 'top' | 'center-v' | 'bottom') => void;
}

/**
 * Floating context toolbar that appears above the selected widget.
 * Positions itself via the canvas + widget % coordinates.
 */
export const FloatingToolbar: React.FC<FloatingToolbarProps> = ({
    widget,
    canvasRef,
    onDuplicate,
    onDelete,
    onBringForward,
    onSendBackward,
    onAlign,
}) => {
    if (!widget) return null;
    const r = canvasRef.current?.getBoundingClientRect();
    if (!r) return null;

    // Position in viewport: top of the widget minus 44px for the toolbar
    const left = r.left + (widget.x / 100) * r.width + ((widget.w / 100) * r.width) / 2;
    const top = r.top + (widget.y / 100) * r.height - 48;

    return (
        <TooltipProvider>
            <div
                className="fixed z-[999] -translate-x-1/2 inline-flex items-center gap-0.5 p-1 rounded-md border bg-popover text-popover-foreground shadow-md"
                style={{ left, top: Math.max(8, top) }}
                onClick={(e) => e.stopPropagation()}
            >
                <ToolButton tip="Alinear izquierda" icon={AlignStartVertical} onClick={() => onAlign('left')} />
                <ToolButton tip="Centrar horizontal" icon={AlignCenterVertical} onClick={() => onAlign('center-h')} />
                <ToolButton tip="Alinear derecha" icon={AlignEndVertical} onClick={() => onAlign('right')} />

                <span className="mx-1 h-5 w-px bg-border" />

                <ToolButton tip="Alinear arriba" icon={AlignStartHorizontal} onClick={() => onAlign('top')} />
                <ToolButton tip="Centrar vertical" icon={AlignCenterHorizontal} onClick={() => onAlign('center-v')} />
                <ToolButton tip="Alinear abajo" icon={AlignEndHorizontal} onClick={() => onAlign('bottom')} />

                <span className="mx-1 h-5 w-px bg-border" />

                <ToolButton tip="Traer al frente (⌘])" icon={BringToFront} onClick={onBringForward} />
                <ToolButton tip="Enviar al fondo (⌘[)" icon={SendToBack} onClick={onSendBackward} />

                <span className="mx-1 h-5 w-px bg-border" />

                <ToolButton tip="Duplicar (⌘D)" icon={Copy} onClick={onDuplicate} />
                <ToolButton tip="Eliminar (Del)" icon={Trash2} onClick={onDelete} variant="destructive" />
            </div>
        </TooltipProvider>
    );
};

const ToolButton: React.FC<{
    tip: string;
    icon: React.ElementType;
    onClick: () => void;
    variant?: 'default' | 'destructive';
}> = ({ tip, icon: Icon, onClick, variant }) => (
    <Tooltip>
        <TooltipTrigger>
            <button
                type="button"
                onClick={onClick}
                className={'size-7 grid place-items-center rounded-sm transition-colors ' + (
                    variant === 'destructive'
                        ? 'text-muted-foreground hover:text-destructive hover:bg-destructive/10'
                        : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                )}
                aria-label={tip}
            >
                <Icon className="size-3.5" />
            </button>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="text-[11px]">{tip}</TooltipContent>
    </Tooltip>
);
