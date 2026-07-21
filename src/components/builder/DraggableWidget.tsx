'use client';

import React from 'react';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { WidgetConfig } from '@/store/usePlayerStore';
import { GripVertical, Trash2, Settings, Lock } from 'lucide-react';

interface DraggableWidgetProps {
    widget: WidgetConfig;
    onRemove: (id: string) => void;
    onSelect: (widget: WidgetConfig) => void;
    isSelected: boolean;
    /** When true, the widget renders its 8 resize handles. Driven by Canvas. */
    showResizeHandles?: boolean;
    /**
     * Called when the user begins/ends a resize gesture by dragging one of the 8 handles.
     * Canvas listens to this to compute the delta and apply it to widget.w/h/x/y.
     */
    onResizeStart?: (widgetId: string, handle: ResizeHandle, event: React.PointerEvent) => void;
}

export type ResizeHandle = 'n' | 'e' | 's' | 'w' | 'ne' | 'se' | 'sw' | 'nw';

const handleCursorMap: Record<ResizeHandle, string> = {
    n: 'cursor-ns-resize',
    s: 'cursor-ns-resize',
    e: 'cursor-ew-resize',
    w: 'cursor-ew-resize',
    ne: 'cursor-nesw-resize',
    sw: 'cursor-nesw-resize',
    nw: 'cursor-nwse-resize',
    se: 'cursor-nwse-resize',
};

const handlePositionMap: Record<ResizeHandle, string> = {
    n:  'top-0 left-1/2 -translate-x-1/2 -translate-y-1/2',
    s:  'bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2',
    e:  'right-0 top-1/2 translate-x-1/2 -translate-y-1/2',
    w:  'left-0 top-1/2 -translate-x-1/2 -translate-y-1/2',
    ne: 'top-0 right-0 translate-x-1/2 -translate-y-1/2',
    se: 'bottom-0 right-0 translate-x-1/2 translate-y-1/2',
    sw: 'bottom-0 left-0 -translate-x-1/2 translate-y-1/2',
    nw: 'top-0 left-0 -translate-x-1/2 -translate-y-1/2',
};

export function DraggableWidget({
    widget,
    onRemove,
    onSelect,
    isSelected,
    showResizeHandles = false,
    onResizeStart,
}: DraggableWidgetProps) {
    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
        id: widget.id,
        data: widget,
    });

    const style = transform ? {
        transform: CSS.Translate.toString(transform),
    } : undefined;

    const showHandles = isSelected && showResizeHandles && !isDragging;

    return (
        <div
            ref={setNodeRef}
            style={{
                ...style,
                position: 'absolute',
                left: widget.x + '%',
                top: widget.y + '%',
                width: widget.w + '%',
                height: widget.h + '%',
                zIndex: isSelected ? 1000 : (widget.zIndex || 1),
            }}
            className={
                'group transition-[border-color,box-shadow] rounded-md overflow-visible ' +
                (isSelected
                    ? 'ring-2 ring-primary ring-offset-2 ring-offset-background shadow-lg'
                    : 'ring-1 ring-border hover:ring-primary/40 hover:ring-2')
            }
            onClick={(e) => {
                e.stopPropagation();
                onSelect(widget);
            }}
        >
            {/* Control overlay (only the move/grip/actions strip; resize handles are siblings outside) */}
            <div
                className={
                    'absolute top-0 left-0 right-0 h-7 rounded-t-md flex items-center justify-between px-1.5 z-30 transition-opacity ' +
                    (isSelected
                        ? 'opacity-100 bg-primary text-primary-foreground'
                        : 'opacity-0 group-hover:opacity-100 bg-foreground/70 text-background')
                }
            >
                <div
                    {...listeners}
                    {...attributes}
                    className="cursor-grab active:cursor-grabbing px-1 py-0.5 rounded-sm hover:bg-white/15"
                    title="Mover"
                >
                    <GripVertical className="size-3.5" />
                </div>
                <div className="flex items-center gap-0.5 text-[10px] font-medium uppercase tracking-[0.1em]">
                    <span className="opacity-80">{widget.type}</span>
                </div>
                <div className="flex items-center gap-0.5">
                    <button
                        onClick={(e) => { e.stopPropagation(); onSelect(widget); }}
                        className="p-0.5 rounded-sm hover:bg-white/15"
                        title="Propiedades"
                    >
                        <Settings className="size-3.5" />
                    </button>
                    <button
                        onClick={(e) => { e.stopPropagation(); onRemove(widget.id); }}
                        className="p-0.5 rounded-sm hover:bg-destructive/80"
                        title="Eliminar"
                    >
                        <Trash2 className="size-3.5" />
                    </button>
                </div>
            </div>

            {/* Placeholder content */}
            <div className="w-full h-full flex items-center justify-center bg-muted/30 rounded-md pointer-events-none">
                <span className="text-muted-foreground/70 font-medium text-xs uppercase tracking-[0.18em]">
                    {widget.type === 'PRICE_LIST' ? 'Lista de Precios' :
                        widget.type === 'PRODUCT_LIST' ? 'Productos' :
                            widget.type === 'ACTIVITIES' ? 'Cronograma' :
                                widget.type === 'QR_CODE' ? 'Código QR' :
                                    widget.type === 'CATEGORY_NAV' ? 'Categorías/Nav' :
                                        widget.type}
                </span>
            </div>

            {/* Dimensions tag (visible while selected) */}
            {isSelected && (
                <div className="absolute -bottom-7 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-md bg-primary text-primary-foreground text-[10px] font-mono tracking-tight whitespace-nowrap shadow-md pointer-events-none">
                    {Math.round(widget.w)}×{Math.round(widget.h)}
                </div>
            )}

            {/* 8 resize handles — only visible while selected and not dragging */}
            {showHandles && (
                <>
                    {(['n','e','s','w','ne','se','sw','nw'] as ResizeHandle[]).map((h) => (
                        <div
                            key={h}
                            role="button"
                            aria-label={'resize ' + h}
                            onPointerDown={(e) => {
                                e.stopPropagation();
                                onResizeStart?.(widget.id, h, e);
                            }}
                            className={
                                'absolute z-40 size-2.5 rounded-sm bg-background border-2 border-primary shadow-sm ' +
                                handlePositionMap[h] + ' ' + handleCursorMap[h]
                            }
                        />
                    ))}
                </>
            )}
        </div>
    );
}
