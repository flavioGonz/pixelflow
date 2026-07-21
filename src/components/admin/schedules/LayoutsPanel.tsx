'use client';

import * as React from 'react';
import { Draggable } from '@fullcalendar/interaction';
import { motion } from 'framer-motion';
import GripVertical from 'lucide-react/dist/esm/icons/grip-vertical';
import LayoutIcon from 'lucide-react/dist/esm/icons/layout';
import Search from 'lucide-react/dist/esm/icons/search';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { colorForLayout } from '@/lib/scheduleColors';

interface Layout {
    _id: string;
    name: string;
}

interface LayoutsPanelProps {
    layouts: Layout[];
}

/**
 * Right-side panel listing all available layouts as draggable cards.
 * FullCalendar's Draggable extracts data from the data-event attribute on each card.
 */
export const LayoutsPanel: React.FC<LayoutsPanelProps> = ({ layouts }) => {
    const containerRef = React.useRef<HTMLDivElement>(null);
    const [search, setSearch] = React.useState('');

    React.useEffect(() => {
        if (!containerRef.current) return;
        const draggable = new Draggable(containerRef.current, {
            itemSelector: '[data-layout-draggable]',
            eventData: (el) => {
                const layoutId = el.getAttribute('data-layout-id') || '';
                const layoutName = el.getAttribute('data-layout-name') || '';
                const color = colorForLayout(layoutId);
                return {
                    title: layoutName,
                    duration: '01:00:00',
                    backgroundColor: color.bg,
                    borderColor: color.bg,
                    textColor: color.fg,
                    extendedProps: { layoutId, layoutName },
                };
            },
        });
        return () => draggable.destroy();
    }, []);

    const filtered = React.useMemo(
        () => layouts.filter((l) => !search || l.name.toLowerCase().includes(search.toLowerCase())),
        [layouts, search]
    );

    return (
        <aside className="w-[280px] shrink-0 border-l bg-card flex flex-col overflow-hidden">
            <div className="p-4 border-b">
                <div className="flex items-center gap-2 mb-3">
                    <LayoutIcon className="size-4 text-muted-foreground" />
                    <h3 className="font-heading text-sm font-semibold">Diseños</h3>
                    <span className="ml-auto text-[11px] text-muted-foreground tabular-nums">{layouts.length}</span>
                </div>
                <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
                    <Input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Buscar diseño…"
                        className="h-8 pl-8 text-[13px]"
                    />
                </div>
            </div>

            <div ref={containerRef} className="flex-1 overflow-hidden">
                <ScrollArea className="h-full">
                    <div className="p-3 space-y-2">
                        {filtered.map((layout) => {
                            const color = colorForLayout(layout._id);
                            return (
                                <motion.div
                                    key={layout._id}
                                    layout
                                    data-layout-draggable
                                    data-layout-id={layout._id}
                                    data-layout-name={layout.name}
                                    className="group relative flex items-center gap-2.5 px-3 py-2.5 rounded-md border bg-background hover:bg-accent transition-colors cursor-grab active:cursor-grabbing"
                                    whileHover={{ scale: 1.01 }}
                                    whileTap={{ scale: 0.98 }}
                                >
                                    <div
                                        className="size-3 rounded-sm shrink-0"
                                        style={{ background: color.bg }}
                                    />
                                    <span className="text-[13px] font-medium truncate flex-1">{layout.name}</span>
                                    <GripVertical className="size-3.5 text-muted-foreground/40 group-hover:text-muted-foreground shrink-0" />
                                </motion.div>
                            );
                        })}

                        {filtered.length === 0 && (
                            <div className="text-center py-12 px-3 rounded-md border border-dashed text-muted-foreground">
                                <LayoutIcon className="size-5 mx-auto mb-2 opacity-50" />
                                <p className="text-xs">{search ? 'Sin coincidencias' : 'Sin diseños creados'}</p>
                            </div>
                        )}
                    </div>
                </ScrollArea>
            </div>

            <div className="p-3 border-t bg-muted/30">
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                    <span className="font-semibold">Tip:</span> arrastrá un diseño al calendario para crear un evento.
                </p>
            </div>
        </aside>
    );
};
