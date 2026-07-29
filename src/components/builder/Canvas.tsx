'use client';

import React from 'react';
import { DndContext, useSensor, useSensors, PointerSensor, DragEndEvent, DragMoveEvent, DragStartEvent } from '@dnd-kit/core';
import { restrictToParentElement } from '@dnd-kit/modifiers';
import { DraggableWidget, type ResizeHandle } from './DraggableWidget';
import { WidgetConfig } from '@/store/usePlayerStore';

export interface CanvasProps {
    widgets: WidgetConfig[];
    onWidgetsChange: (widgets: WidgetConfig[], opts?: { skipHistory?: boolean }) => void;
    onCommit?: () => void;
    onAddWidget?: (type: string, opts?: { x?: number; y?: number }) => void;
    selectedId: string | null;
    onSelect: (id: string | null) => void;
    onOpenProperties?: (widget: WidgetConfig) => void;
    orientation: 'landscape' | 'portrait';
    resolution?: { width: number; height: number };
    backgroundImage?: string;
    backgroundVideo?: string;
    backgroundColor?: string;
    backgroundBlur?: number;
    backgroundOverlayColor?: string;
    backgroundOverlayOpacity?: number;
    backgroundPattern?: 'none' | 'dots' | 'grid' | 'waves' | 'noise';
    backgroundPatternOpacity?: number;
    /** Snap grid size in pixels (computed against the rendered canvas width). 0 disables snap. */
    gridSize?: number;
    /** Render the dotted grid behind the widgets when grid is on. */
    showGrid?: boolean;
}

// Snap threshold in % (computed from px); guides appear inside this band
const SMART_GUIDE_THRESHOLD_PCT = 0.5; // ~0.5% of canvas = a few pixels

interface SmartGuide {
    type: 'v' | 'h';
    /** Position in % */
    pos: number;
    /** start/end in % across the orthogonal axis */
    from: number;
    to: number;
}

function getYoutubeId(url: string) {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
}

export function Canvas({
    widgets,
    onWidgetsChange,
    onCommit,
    onAddWidget,
    selectedId,
    onSelect,
    onOpenProperties,
    orientation,
    resolution,
    backgroundImage,
    backgroundVideo,
    backgroundColor = '#000',
    backgroundBlur = 0,
    backgroundOverlayColor,
    backgroundOverlayOpacity = 0.5,
    backgroundPattern = 'none',
    backgroundPatternOpacity = 0.2,
    gridSize = 16,
    showGrid = true,
}: CanvasProps) {
    const canvasRef = React.useRef<HTMLDivElement>(null);
    const wrapperRef = React.useRef<HTMLDivElement>(null);
    const [canvasSize, setCanvasSize] = React.useState<{ w: number; h: number }>({ w: 0, h: 0 });
    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: { distance: 4 },
        })
    );

    const [guides, setGuides] = React.useState<SmartGuide[]>([]);
    const shiftHeldRef = React.useRef(false);
    const resizingRef = React.useRef<{
        id: string;
        handle: ResizeHandle;
        startX: number;
        startY: number;
        startWidget: WidgetConfig;
    } | null>(null);



    // Track shift key for free-drag (snap bypass)
    React.useEffect(() => {
        const down = (e: KeyboardEvent) => { if (e.key === 'Shift') shiftHeldRef.current = true; };
        const up   = (e: KeyboardEvent) => { if (e.key === 'Shift') shiftHeldRef.current = false; };
        window.addEventListener('keydown', down);
        window.addEventListener('keyup', up);
        return () => {
            window.removeEventListener('keydown', down);
            window.removeEventListener('keyup', up);
        };
    }, []);

    const getCanvasRect = () => canvasRef.current?.getBoundingClientRect();

    // Snap a percentage value to the closest grid line (gridSize in pixels of canvas)
    const snapPct = (pctValue: number, axis: 'x' | 'y'): number => {
        if (!gridSize || shiftHeldRef.current) return pctValue;
        const rect = getCanvasRect();
        if (!rect) return pctValue;
        const dim = axis === 'x' ? rect.width : rect.height;
        const stepPct = (gridSize / dim) * 100;
        return Math.round(pctValue / stepPct) * stepPct;
    };

    // Compute smart guides while a widget is being dragged.
    // Returns possibly-snapped position and the list of guides to render.
    const computeGuides = (
        candidate: { x: number; y: number; w: number; h: number },
        ignoreId: string,
    ): { x: number; y: number; guides: SmartGuide[] } => {
        if (shiftHeldRef.current) {
            return { x: candidate.x, y: candidate.y, guides: [] };
        }
        let x = candidate.x;
        let y = candidate.y;
        const out: SmartGuide[] = [];

        const candidateEdges = {
            left: x,
            right: x + candidate.w,
            cx: x + candidate.w / 2,
            top: y,
            bottom: y + candidate.h,
            cy: y + candidate.h / 2,
        };

        // Add canvas edges as snap targets too
        const verticals = [0, 50, 100]; // left/center/right of canvas
        const horizontals = [0, 50, 100];
        const verticalTargets: { pos: number; from: number; to: number }[] = verticals.map((p) => ({ pos: p, from: 0, to: 100 }));
        const horizontalTargets: { pos: number; from: number; to: number }[] = horizontals.map((p) => ({ pos: p, from: 0, to: 100 }));

        for (const w of widgets) {
            if (w.id === ignoreId) continue;
            verticalTargets.push({ pos: w.x,          from: Math.min(w.y, y), to: Math.max(w.y + w.h, y + candidate.h) });
            verticalTargets.push({ pos: w.x + w.w/2,  from: Math.min(w.y, y), to: Math.max(w.y + w.h, y + candidate.h) });
            verticalTargets.push({ pos: w.x + w.w,    from: Math.min(w.y, y), to: Math.max(w.y + w.h, y + candidate.h) });
            horizontalTargets.push({ pos: w.y,          from: Math.min(w.x, x), to: Math.max(w.x + w.w, x + candidate.w) });
            horizontalTargets.push({ pos: w.y + w.h/2,  from: Math.min(w.x, x), to: Math.max(w.x + w.w, x + candidate.w) });
            horizontalTargets.push({ pos: w.y + w.h,    from: Math.min(w.x, x), to: Math.max(w.x + w.w, x + candidate.w) });
        }

        // Vertical guides — snap if candidate left/center/right is close to a target
        for (const t of verticalTargets) {
            for (const edgeKey of ['left', 'cx', 'right'] as const) {
                const edgeVal = candidateEdges[edgeKey];
                if (Math.abs(edgeVal - t.pos) <= SMART_GUIDE_THRESHOLD_PCT) {
                    // Snap candidate's x so that this edge aligns
                    const delta = t.pos - edgeVal;
                    x += delta;
                    candidateEdges.left += delta;
                    candidateEdges.right += delta;
                    candidateEdges.cx += delta;
                    out.push({ type: 'v', pos: t.pos, from: t.from, to: t.to });
                    break;
                }
            }
        }
        // Horizontal guides — snap if candidate top/center/bottom is close
        for (const t of horizontalTargets) {
            for (const edgeKey of ['top', 'cy', 'bottom'] as const) {
                const edgeVal = candidateEdges[edgeKey];
                if (Math.abs(edgeVal - t.pos) <= SMART_GUIDE_THRESHOLD_PCT) {
                    const delta = t.pos - edgeVal;
                    y += delta;
                    candidateEdges.top += delta;
                    candidateEdges.bottom += delta;
                    candidateEdges.cy += delta;
                    out.push({ type: 'h', pos: t.pos, from: t.from, to: t.to });
                    break;
                }
            }
        }

        return { x, y, guides: out };
    };

    const handleDragStart = (_event: DragStartEvent) => {
        setGuides([]);
    };

    const handleDragMove = (event: DragMoveEvent) => {
        const { active, delta } = event;
        if (!active) return;
        const widget = widgets.find(w => w.id === active.id);
        if (!widget) return;
        const rect = getCanvasRect();
        if (!rect) return;

        const deltaXPercent = (delta.x / rect.width) * 100;
        const deltaYPercent = (delta.y / rect.height) * 100;

        const candidate = {
            x: Math.max(0, Math.min(100 - widget.w, widget.x + deltaXPercent)),
            y: Math.max(0, Math.min(100 - widget.h, widget.y + deltaYPercent)),
            w: widget.w,
            h: widget.h,
        };
        const { guides: g } = computeGuides(candidate, widget.id as string);
        setGuides(g);
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, delta } = event;
        setGuides([]);
        if (!active) return;
        const widget = widgets.find(w => w.id === active.id);
        if (!widget) return;
        const rect = getCanvasRect();
        if (!rect) return;

        const deltaXPercent = (delta.x / rect.width) * 100;
        const deltaYPercent = (delta.y / rect.height) * 100;

        const candidate = {
            x: Math.max(0, Math.min(100 - widget.w, widget.x + deltaXPercent)),
            y: Math.max(0, Math.min(100 - widget.h, widget.y + deltaYPercent)),
            w: widget.w,
            h: widget.h,
        };
        // Smart guide snap
        let { x, y } = computeGuides(candidate, widget.id as string);
        // Grid snap (if no smart-guide already snapped — apply on top is OK too, idempotent)
        x = snapPct(x, 'x');
        y = snapPct(y, 'y');
        x = Math.max(0, Math.min(100 - widget.w, x));
        y = Math.max(0, Math.min(100 - widget.h, y));

        const updated = widgets.map(w => w.id === active.id ? { ...w, x, y } : w);
        onWidgetsChange(updated);
    };

    // -------- Resize via pointer events on the 8 handles --------
    const onResizeStart = (widgetId: string, handle: ResizeHandle, ev: React.PointerEvent) => {
        const rect = getCanvasRect();
        if (!rect) return;
        const widget = widgets.find(w => w.id === widgetId);
        if (!widget) return;
        resizingRef.current = {
            id: widgetId,
            handle,
            startX: ev.clientX,
            startY: ev.clientY,
            startWidget: { ...widget },
        };
        (ev.currentTarget as HTMLElement).setPointerCapture(ev.pointerId);
        ev.currentTarget.addEventListener('pointermove', onResizeMove as any);
        ev.currentTarget.addEventListener('pointerup', onResizeEnd as any, { once: true });
    };

    const applyResize = (clientX: number, clientY: number): { x: number; y: number; w: number; h: number } | null => {
        const r = resizingRef.current;
        const rect = getCanvasRect();
        if (!r || !rect) return null;
        const dxPct = ((clientX - r.startX) / rect.width) * 100;
        const dyPct = ((clientY - r.startY) / rect.height) * 100;
        let { x, y, w, h } = r.startWidget;
        const minSize = 2; // 2% min
        const has = (s: string) => r.handle.includes(s);
        if (has('e')) w = Math.max(minSize, w + dxPct);
        if (has('s')) h = Math.max(minSize, h + dyPct);
        if (has('w')) {
            const newX = x + dxPct;
            const newW = w - dxPct;
            if (newW >= minSize) { x = newX; w = newW; }
        }
        if (has('n')) {
            const newY = y + dyPct;
            const newH = h - dyPct;
            if (newH >= minSize) { y = newY; h = newH; }
        }
        // Snap
        x = snapPct(x, 'x'); y = snapPct(y, 'y');
        w = snapPct(w, 'x'); h = snapPct(h, 'y');
        // Clamp
        x = Math.max(0, x); y = Math.max(0, y);
        if (x + w > 100) w = 100 - x;
        if (y + h > 100) h = 100 - y;
        w = Math.max(minSize, w); h = Math.max(minSize, h);
        return { x, y, w, h };
    };

    const onResizeMove = (ev: PointerEvent) => {
        const r = resizingRef.current;
        if (!r) return;
        const next = applyResize(ev.clientX, ev.clientY);
        if (!next) return;
        const updated = widgets.map(w => w.id === r.id ? { ...w, ...next } : w);
        onWidgetsChange(updated, { skipHistory: true });
    };

    const onResizeEnd = (ev: PointerEvent) => {
        const r = resizingRef.current;
        if (!r) return;
        const next = applyResize(ev.clientX, ev.clientY);
        resizingRef.current = null;
        if (next) {
            const updated = widgets.map(w => w.id === r.id ? { ...w, ...next } : w);
            onWidgetsChange(updated, { skipHistory: true });
        }
        onCommit?.();
        try { (ev.target as HTMLElement)?.removeEventListener('pointermove', onResizeMove as any); } catch {}
    };

    // ------------------------------------------------------------

    // Prefer explicit resolution; fall back to orientation defaults.
    const arW = resolution?.width || (orientation === 'landscape' ? 1920 : 1080);
    const arH = resolution?.height || (orientation === 'landscape' ? 1080 : 1920);
    const canvasAspect = arW + ' / ' + arH;

    // Auto-fit canvas to available viewport while preserving aspect ratio
    React.useEffect(() => {
        const el = wrapperRef.current;
        if (!el) return;
        const target = arW / arH;
        const compute = () => {
            const rect = el.getBoundingClientRect();
            const cw = Math.max(0, rect.width - 16);   // leave a tiny breathing room
            const ch = Math.max(0, rect.height - 16);
            if (cw <= 0 || ch <= 0) return;
            let w, h;
            if (cw / ch > target) {
                h = ch;
                w = h * target;
            } else {
                w = cw;
                h = w / target;
            }
            setCanvasSize({ w: Math.floor(w), h: Math.floor(h) });
        };
        compute();
        const ro = new ResizeObserver(compute);
        ro.observe(el);
        return () => ro.disconnect();
    }, [arW, arH]);

    const Patterns: Record<string, string> = {
        dots: 'radial-gradient(circle, currentColor 1px, transparent 1px)',
        grid: 'linear-gradient(to right, currentColor 1px, transparent 1px), linear-gradient(to bottom, currentColor 1px, transparent 1px)',
        waves: 'radial-gradient(circle at 100% 150%, transparent 24%, currentColor 25%, currentColor 28%, transparent 29%, transparent 36%, currentColor 36%, currentColor 40%, transparent 41%, transparent)',
        noise: "url('https://grainy-gradients.vercel.app/noise.svg')",
    };

    const youtubeId = backgroundVideo ? getYoutubeId(backgroundVideo) : null;

    return (
        <div ref={wrapperRef} className="w-full h-full flex justify-center items-center p-2" onClick={() => onSelect(null)}>
            <div
                ref={canvasRef}
                id="builder-canvas"
                style={{ backgroundColor, width: canvasSize.w || '80%', height: canvasSize.h || 'auto', aspectRatio: canvasAspect }}
                className={'relative rounded-md border border-dashed border-primary/30 overflow-hidden shadow-2xl ring-1 ring-border'}
                onDragOver={(e) => {
                    const types = Array.from(e.dataTransfer.types);
                    if (types.includes('application/x-pixelflow-widget')) {
                        e.preventDefault();
                        e.dataTransfer.dropEffect = 'copy';
                    }
                }}
                onDrop={(e) => {
                    const widgetType = e.dataTransfer.getData('application/x-pixelflow-widget');
                    if (!widgetType || !onAddWidget) return;
                    e.preventDefault();
                    const r = canvasRef.current?.getBoundingClientRect();
                    if (!r) return;
                    const xPct = ((e.clientX - r.left) / r.width) * 100;
                    const yPct = ((e.clientY - r.top) / r.height) * 100;
                    // Center the new widget on cursor by offsetting half its default size (15x10)
                    const x = Math.max(0, Math.min(85, xPct - 7.5));
                    const y = Math.max(0, Math.min(90, yPct - 5));
                    onAddWidget(widgetType, { x, y });
                }}
            >
                {/* Background layers */}
                <div className="absolute inset-0 z-0 overflow-hidden">
                    {youtubeId ? (
                        <div className="relative w-[300%] h-[300%] -top-[100%] -left-[100%] pointer-events-none">
                            <iframe
                                src={'https://www.youtube.com/embed/' + youtubeId + '?autoplay=1&mute=1&loop=1&playlist=' + youtubeId + '&controls=0&showinfo=0&rel=0&iv_load_policy=3&disablekb=1&modestbranding=1'}
                                className="absolute inset-0 w-full h-full object-cover"
                                allow="autoplay; encrypted-media"
                                title="Background Video"
                            />
                        </div>
                    ) : backgroundVideo ? (
                        <video src={backgroundVideo} className="w-full h-full object-cover" autoPlay muted loop playsInline />
                    ) : backgroundImage ? (
                        <div className="w-full h-full bg-cover bg-center" style={{ backgroundImage: 'url(' + backgroundImage + ')' }} />
                    ) : null}
                </div>

                {backgroundOverlayColor && (
                    <div className="absolute inset-0 z-[1] pointer-events-none" style={{ backgroundColor: backgroundOverlayColor, opacity: backgroundOverlayOpacity }} />
                )}
                {backgroundPattern && backgroundPattern !== 'none' && (
                    <div
                        className="absolute inset-0 z-[2] pointer-events-none"
                        style={{
                            backgroundImage: Patterns[backgroundPattern],
                            backgroundSize: backgroundPattern === 'noise' ? 'auto' : '40px 40px',
                            color: backgroundOverlayColor || '#fff',
                            opacity: backgroundPatternOpacity,
                            mixBlendMode: 'overlay',
                        }}
                    />
                )}
                {backgroundBlur > 0 && (
                    <div className="absolute inset-0 backdrop-blur-md pointer-events-none z-[5]" style={{ backdropFilter: 'blur(' + backgroundBlur + 'px)' }} />
                )}

                {/* Editor grid */}
                {showGrid && gridSize > 0 && (
                    <div
                        className="absolute inset-0 z-[10] pointer-events-none opacity-30"
                        style={{
                            backgroundImage: 'linear-gradient(to right, color-mix(in srgb, currentColor 20%, transparent) 1px, transparent 1px), linear-gradient(to bottom, color-mix(in srgb, currentColor 20%, transparent) 1px, transparent 1px)',
                            backgroundSize: gridSize + 'px ' + gridSize + 'px',
                            color: 'var(--foreground)',
                        }}
                    />
                )}

                <DndContext
                    sensors={sensors}
                    onDragStart={handleDragStart}
                    onDragMove={handleDragMove}
                    onDragEnd={handleDragEnd}
                    modifiers={[restrictToParentElement]}
                >
                    {widgets.map((widget) => (
                        <DraggableWidget
                            key={widget.id}
                            widget={widget}
                            onRemove={(id) => onWidgetsChange(widgets.filter(w => w.id !== id))}
                            onSelect={(w) => onSelect(w.id)}
                            onOpenProperties={onOpenProperties}
                            isSelected={selectedId === widget.id}
                            showResizeHandles
                            onResizeStart={onResizeStart}
                        />
                    ))}
                </DndContext>

                {/* Smart guides overlay */}
                {guides.map((g, i) => (
                    <div
                        key={i}
                        className="absolute z-[800] pointer-events-none"
                        style={
                            g.type === 'v'
                                ? {
                                      left: g.pos + '%',
                                      top: Math.max(0, g.from - 2) + '%',
                                      height: Math.max(4, g.to - g.from + 4) + '%',
                                      width: '1px',
                                      background: '#ff00ff',
                                      boxShadow: '0 0 6px #ff00ff80',
                                  }
                                : {
                                      top: g.pos + '%',
                                      left: Math.max(0, g.from - 2) + '%',
                                      width: Math.max(4, g.to - g.from + 4) + '%',
                                      height: '1px',
                                      background: '#ff00ff',
                                      boxShadow: '0 0 6px #ff00ff80',
                                  }
                        }
                    />
                ))}
            </div>
        </div>
    );
}
