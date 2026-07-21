'use client';

import * as React from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import listPlugin from '@fullcalendar/list';
import interactionPlugin from '@fullcalendar/interaction';
import esLocale from '@fullcalendar/core/locales/es';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { EventDialog } from './EventDialog';
import { colorForLayout } from '@/lib/scheduleColors';
import {
    expandEvent,
    legacyToNew,
    describeRecurrence,
    type ScheduleEventNew,
} from '@/lib/scheduleRecurrence';
import Plus from 'lucide-react/dist/esm/icons/plus';
import RotateCcw from 'lucide-react/dist/esm/icons/rotate-ccw';
import ChevronLeft from 'lucide-react/dist/esm/icons/chevron-left';
import ChevronRight from 'lucide-react/dist/esm/icons/chevron-right';
import CalendarCheck from 'lucide-react/dist/esm/icons/calendar-check';

interface Layout {
    _id: string;
    name: string;
}

interface Schedule {
    _id?: string;
    name: string;
    type?: 'day' | 'week' | 'month';
    events: any[];
}

interface ScheduleEditorProps {
    schedule: Schedule;
    layouts: Layout[];
    onSave: (schedule: Schedule) => void;
}

type ViewType = 'dayGridMonth' | 'timeGridWeek' | 'timeGridDay' | 'listWeek';

function dateStr(d: Date): string {
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}

function dateToTimeStr(d: Date): string {
    return String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
}

export const ScheduleEditor: React.FC<ScheduleEditorProps> = ({ schedule, layouts, onSave }) => {
    const calendarRef = React.useRef<FullCalendar>(null);
    const [view, setView] = React.useState<ViewType>('timeGridWeek');
    const [title, setTitle] = React.useState('');
    const [dialogOpen, setDialogOpen] = React.useState(false);
    const [editingEvent, setEditingEvent] = React.useState<ScheduleEventNew | null>(null);
    const [editingIndex, setEditingIndex] = React.useState<number | null>(null);

    // Normalize legacy events on the fly
    const normalizedEvents = React.useMemo<ScheduleEventNew[]>(
        () => (schedule.events || []).map((e) => legacyToNew(e)),
        [schedule.events]
    );

    // Build FullCalendar events: expand recurrence over a 3-month window around "now"
    const fcEvents = React.useMemo(() => {
        if (typeof window === 'undefined') return [];
        const today = new Date();
        const rangeStart = new Date(today);
        rangeStart.setMonth(rangeStart.getMonth() - 1);
        rangeStart.setHours(0, 0, 0, 0);
        const rangeEnd = new Date(today);
        rangeEnd.setMonth(rangeEnd.getMonth() + 6);
        rangeEnd.setHours(23, 59, 59, 999);

        const out: any[] = [];
        normalizedEvents.forEach((ev, idx) => {
            const layout = layouts.find((l) => l._id === ev.layoutId);
            const color = colorForLayout(ev.layoutId);
            const instances = expandEvent(ev, rangeStart, rangeEnd);
            for (const inst of instances) {
                out.push({
                    id: idx + ':' + inst.date,
                    title: layout?.name || 'Sin diseño',
                    start: inst.start,
                    end: inst.end,
                    backgroundColor: color.bg,
                    borderColor: color.bg,
                    textColor: color.fg,
                    extendedProps: { idx, eventDate: inst.date, recurrenceLabel: describeRecurrence(ev) },
                });
            }
        });
        return out;
    }, [normalizedEvents, layouts]);

    const openCreateDialog = (defaults?: Partial<ScheduleEventNew>) => {
        setEditingEvent({
            layoutId: layouts[0]?._id ?? '',
            startTime: '09:00',
            endTime: '10:00',
            recurrence: 'none',
            startDate: dateStr(new Date()),
            ...defaults,
        } as ScheduleEventNew);
        setEditingIndex(null);
        setDialogOpen(true);
    };

    const openEditDialog = (idx: number) => {
        const ev = normalizedEvents[idx];
        if (!ev) return;
        setEditingEvent(ev);
        setEditingIndex(idx);
        setDialogOpen(true);
    };

    const handleSaveEvent = (event: ScheduleEventNew) => {
        let newEvents = [...(schedule.events || [])];
        if (editingIndex !== null) {
            newEvents[editingIndex] = event;
        } else {
            newEvents.push(event);
        }
        onSave({ ...schedule, events: newEvents });
    };

    const handleDeleteEvent = () => {
        if (editingIndex === null) return;
        const newEvents = (schedule.events || []).filter((_, i) => i !== editingIndex);
        onSave({ ...schedule, events: newEvents });
    };

    const handleClearAll = () => {
        if (!confirm('¿Eliminar todos los eventos de esta rutina?')) return;
        onSave({ ...schedule, events: [] });
    };

    // FullCalendar event handlers
    const handleSelect = (info: any) => {
        openCreateDialog({
            startDate: dateStr(info.start),
            startTime: dateToTimeStr(info.start),
            endTime: dateToTimeStr(info.end),
            recurrence: 'none',
        });
        info.view.calendar.unselect();
    };

    const handleDateClick = (info: any) => {
        // Month view click → create single event on that day
        openCreateDialog({
            startDate: dateStr(info.date),
            recurrence: 'none',
        });
    };

    const handleEventClick = (info: any) => {
        const idx = info.event.extendedProps.idx as number;
        openEditDialog(idx);
    };

    // Toolbar nav (FullCalendar API)
    const api = () => calendarRef.current?.getApi();
    const goPrev = () => api()?.prev();
    const goNext = () => api()?.next();
    const goToday = () => api()?.today();

    React.useEffect(() => {
        const a = api();
        if (a) {
            setTitle(a.view.title);
        }
    }, [view]);

    const handleDatesSet = (arg: any) => {
        setTitle(arg.view.title);
    };

    return (
        <div className="flex h-full w-full overflow-hidden">
            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Toolbar */}
                <div className="flex flex-wrap items-center gap-3 px-6 py-3 border-b bg-card">
                    {/* View tabs */}
                    <Tabs value={view} onValueChange={(v) => { setView(v as ViewType); }}>
                        <TabsList>
                            <TabsTrigger value="dayGridMonth">Mes</TabsTrigger>
                            <TabsTrigger value="timeGridWeek">Semana</TabsTrigger>
                            <TabsTrigger value="timeGridDay">Día</TabsTrigger>
                            <TabsTrigger value="listWeek">Lista</TabsTrigger>
                        </TabsList>
                    </Tabs>

                    {/* Nav */}
                    <div className="flex items-center gap-1">
                        <Button variant="outline" size="icon" className="size-8" onClick={goPrev} title="Anterior">
                            <ChevronLeft className="size-4" />
                        </Button>
                        <Button variant="outline" size="sm" onClick={goToday}>Hoy</Button>
                        <Button variant="outline" size="icon" className="size-8" onClick={goNext} title="Siguiente">
                            <ChevronRight className="size-4" />
                        </Button>
                    </div>

                    {/* Title */}
                    <div className="font-heading text-[15px] font-semibold tracking-tight capitalize">
                        {title}
                    </div>

                    <div className="ml-auto flex items-center gap-2">
                        <span className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground font-semibold flex items-center gap-1.5">
                            <CalendarCheck className="size-3.5" />
                            {normalizedEvents.length} reglas · {fcEvents.length} ocurrencias
                        </span>
                        {normalizedEvents.length > 0 && (
                            <Button variant="ghost" size="sm" onClick={handleClearAll}>
                                <RotateCcw className="size-3.5 mr-1" /> Vaciar
                            </Button>
                        )}
                        <Button size="sm" onClick={() => openCreateDialog()}>
                            <Plus className="size-4 mr-1" /> Nuevo evento
                        </Button>
                    </div>
                </div>

                {/* Calendar */}
                <div className="flex-1 overflow-auto px-6 py-4">
                    <FullCalendar
                        ref={calendarRef}
                        plugins={[dayGridPlugin, timeGridPlugin, listPlugin, interactionPlugin]}
                        initialView={view}
                        key={view}
                        headerToolbar={false}
                        firstDay={1}
                        locale={esLocale}
                        allDaySlot={false}
                        slotMinTime="06:00:00"
                        slotMaxTime="24:00:00"
                        slotDuration="00:30:00"
                        slotLabelInterval="01:00:00"
                        height="100%"
                        nowIndicator
                        dayMaxEvents={3}
                        events={fcEvents}
                        selectable
                        selectMirror
                        select={handleSelect}
                        dateClick={handleDateClick}
                        eventClick={handleEventClick}
                        datesSet={handleDatesSet}
                    />
                </div>
            </div>

            <EventDialog
                open={dialogOpen}
                onOpenChange={setDialogOpen}
                event={editingEvent}
                editingIndex={editingIndex}
                layouts={layouts}
                onSave={handleSaveEvent}
                onDelete={editingIndex !== null ? handleDeleteEvent : undefined}
            />
        </div>
    );
};
