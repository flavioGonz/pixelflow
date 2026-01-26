'use client';

import React from 'react';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { WidgetConfig } from '@/store/usePlayerStore';
import { GripVertical, Trash2, Settings } from 'lucide-react';

interface DraggableWidgetProps {
    widget: WidgetConfig;
    onRemove: (id: string) => void;
    onSelect: (widget: WidgetConfig) => void;
    isSelected: boolean;
}

export function DraggableWidget({ widget, onRemove, onSelect, isSelected }: DraggableWidgetProps) {
    const { attributes, listeners, setNodeRef, transform } = useDraggable({
        id: widget.id,
        data: widget,
    });

    const style = transform ? {
        transform: CSS.Translate.toString(transform),
    } : undefined;

    return (
        <div
            ref={setNodeRef}
            style={{
                ...style,
                position: 'absolute',
                left: `${widget.x}%`,
                top: `${widget.y}%`,
                width: `${widget.w}%`,
                height: `${widget.h}%`,
                zIndex: isSelected ? 1000 : (widget.zIndex || 1),
            }}
            className={`group border-2 transition-colors rounded-xl overflow-hidden backdrop-blur-sm
        ${isSelected ? 'border-blue-500 shadow-lg shadow-blue-500/20 z-20' : 'border-white/10 hover:border-white/30 z-10'}
      `}
            onClick={(e) => {
                e.stopPropagation();
                onSelect(widget);
            }}
        >
            {/* Overlay de Control */}
            <div className="absolute top-0 left-0 right-0 h-8 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-between px-2 z-30">
                <div {...listeners} {...attributes} className="cursor-grab active:cursor-grabbing p-1 hover:bg-white/10 rounded">
                    <GripVertical className="w-4 h-4 text-white" />
                </div>
                <div className="flex gap-1">
                    <button
                        onClick={() => onSelect(widget)}
                        className="p-1 hover:bg-blue-500/50 rounded"
                    >
                        <Settings className="w-3.5 h-3.5 text-white" />
                    </button>
                    <button
                        onClick={(e) => { e.stopPropagation(); onRemove(widget.id); }}
                        className="p-1 hover:bg-red-500/50 rounded"
                    >
                        <Trash2 className="w-3.5 h-3.5 text-white" />
                    </button>
                </div>
            </div>

            {/* Info Tag */}
            <div className="absolute bottom-2 left-2 px-2 py-0.5 bg-black/40 rounded text-[8px] font-mono uppercase tracking-tighter z-30 opacity-0 group-hover:opacity-100 transition-opacity">
                {widget.type}
            </div>

            {/* Placeholder del Widget */}
            <div className="w-full h-full flex items-center justify-center bg-white/5 pointer-events-none">
                <span className="text-white/20 font-bold text-xs uppercase tracking-widest">
                    {widget.type === 'PRICE_LIST' ? 'Lista de Precios' :
                        widget.type === 'PRODUCT_LIST' ? 'Productos' :
                            widget.type === 'ACTIVITIES' ? 'Cronograma' :
                                widget.type === 'QR_CODE' ? 'Código QR' :
                                    widget.type === 'CATEGORY_NAV' ? 'Categorías/Nav' :
                                        widget.type}
                </span>
            </div>
        </div>
    );
}
