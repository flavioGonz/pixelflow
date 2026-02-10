'use client';

import React from 'react';
import { DndContext, useSensor, useSensors, PointerSensor, DragEndEvent } from '@dnd-kit/core';
import { restrictToParentElement } from '@dnd-kit/modifiers';
import { DraggableWidget } from './DraggableWidget';
import { WidgetConfig } from '@/store/usePlayerStore';

interface CanvasProps {
    widgets: WidgetConfig[];
    onWidgetsChange: (widgets: WidgetConfig[]) => void;
    selectedId: string | null;
    onSelect: (id: string | null) => void;
    orientation: 'landscape' | 'portrait';
    backgroundImage?: string;
    backgroundVideo?: string;
    backgroundColor?: string;
    backgroundBlur?: number;
    backgroundOverlayColor?: string;
    backgroundOverlayOpacity?: number;
    backgroundPattern?: 'none' | 'dots' | 'grid' | 'waves' | 'noise';
    backgroundPatternOpacity?: number;
}

export function Canvas({
    widgets,
    onWidgetsChange,
    selectedId,
    onSelect,
    orientation,
    backgroundImage,
    backgroundVideo,
    backgroundColor = '#000',
    backgroundBlur = 0,
    backgroundOverlayColor,
    backgroundOverlayOpacity = 0.5,
    backgroundPattern = 'none',
    backgroundPatternOpacity = 0.2
}: CanvasProps) {
    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        })
    );

    const getYoutubeId = (url: string) => {
        if (!url) return null;
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
        const match = url.match(regExp);
        return (match && match[2].length === 11) ? match[2] : null;
    };

    const youtubeId = backgroundVideo ? getYoutubeId(backgroundVideo) : null;

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, delta } = event;
        if (!active) return;

        const widget = widgets.find(w => w.id === active.id);
        if (!widget) return;

        // Convert delta pixels to percentage (relative to container)
        const canvasElement = document.getElementById('builder-canvas');
        if (!canvasElement) return;

        const rect = canvasElement.getBoundingClientRect();
        const deltaXPercent = (delta.x / rect.width) * 100;
        const deltaYPercent = (delta.y / rect.height) * 100;

        const updatedWidgets = widgets.map(w => {
            if (w.id === active.id) {
                return {
                    ...w,
                    x: Math.max(0, Math.min(100 - w.w, w.x + deltaXPercent)),
                    y: Math.max(0, Math.min(100 - w.h, w.y + deltaYPercent)),
                };
            }
            return w;
        });

        onWidgetsChange(updatedWidgets);
    };

    const aspectRatio = orientation === 'landscape' ? 'aspect-video' : 'aspect-[9/16]';

    const Patterns = {
        dots: "radial-gradient(circle, currentColor 1px, transparent 1px)",
        grid: "linear-gradient(to right, currentColor 1px, transparent 1px), linear-gradient(to bottom, currentColor 1px, transparent 1px)",
        waves: "radial-gradient(circle at 100% 150%, transparent 24%, currentColor 25%, currentColor 28%, transparent 29%, transparent 36%, currentColor 36%, currentColor 40%, transparent 41%, transparent)",
        noise: "url('https://grainy-gradients.vercel.app/noise.svg')",
    };

    return (
        <div
            className="w-full flex justify-center items-center py-10"
            onClick={() => onSelect(null)}
        >
            <div
                id="builder-canvas"
                style={{
                    backgroundColor: backgroundColor,
                }}
                className={`relative shadow-2xl rounded-sm border border-neutral-800 w-full max-w-4xl overflow-hidden ${aspectRatio}`}
            >
                {/* Background Layer */}
                <div className="absolute inset-0 z-0 overflow-hidden">
                    {youtubeId ? (
                        <div className="relative w-[300%] h-[300%] -top-[100%] -left-[100%] pointer-events-none">
                            <iframe
                                src={`https://www.youtube.com/embed/${youtubeId}?autoplay=1&mute=1&loop=1&playlist=${youtubeId}&controls=0&showinfo=0&rel=0&iv_load_policy=3&disablekb=1&modestbranding=1`}
                                className="absolute inset-0 w-full h-full object-cover"
                                allow="autoplay; encrypted-media"
                                title="Background Video"
                            />
                        </div>
                    ) : backgroundVideo ? (
                        <video
                            src={backgroundVideo}
                            className="w-full h-full object-cover"
                            autoPlay
                            muted
                            loop
                            playsInline
                        />
                    ) : backgroundImage ? (
                        <div
                            className="w-full h-full bg-cover bg-center"
                            style={{ backgroundImage: `url(${backgroundImage})` }}
                        />
                    ) : null}
                </div>

                {/* Overlay Layer */}
                {backgroundOverlayColor && (
                    <div
                        className="absolute inset-0 z-[1] pointer-events-none"
                        style={{
                            backgroundColor: backgroundOverlayColor,
                            opacity: backgroundOverlayOpacity
                        }}
                    />
                )}

                {/* Pattern Layer */}
                {backgroundPattern && backgroundPattern !== 'none' && (
                    <div
                        className="absolute inset-0 z-[2] pointer-events-none opacity-[0.2]"
                        style={{
                            backgroundImage: Patterns[backgroundPattern as keyof typeof Patterns],
                            backgroundSize: backgroundPattern === 'noise' ? 'auto' : '40px 40px',
                            color: backgroundOverlayColor || '#fff',
                            opacity: backgroundPatternOpacity,
                            mixBlendMode: 'overlay'
                        }}
                    />
                )}

                {backgroundBlur > 0 && (
                    <div
                        className="absolute inset-0 backdrop-blur-md pointer-events-none z-[5]"
                        style={{ backdropFilter: `blur(${backgroundBlur}px)` }}
                    />
                )}
                {/* Editor Grid Helper */}
                <div className="absolute inset-0 opacity-5 pointer-events-none z-[10]"
                    style={{
                        backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)',
                        backgroundSize: '40px 40px'
                    }}
                />

                <DndContext
                    sensors={sensors}
                    onDragEnd={handleDragEnd}
                    modifiers={[restrictToParentElement]}
                >
                    {widgets.map((widget) => (
                        <DraggableWidget
                            key={widget.id}
                            widget={widget}
                            onRemove={(id) => onWidgetsChange(widgets.filter(w => w.id !== id))}
                            onSelect={(w) => onSelect(w.id)}
                            isSelected={selectedId === widget.id}
                        />
                    ))}
                </DndContext>
            </div>
        </div>
    );
}
