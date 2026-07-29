'use client';

import * as React from 'react';
import FullCalendar from '@fullcalendar/react';
import timeGridPlugin from '@fullcalendar/timegrid';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import esLocale from '@fullcalendar/core/locales/es';

interface Activity {
    _id?: string;
    title: string;
    time?: string;
    day?: string;
    category?: string;
    photo?: string;
    isWeekly?: boolean;
}

interface ActivityCalendarProps {
    activities: Activity[];
    onCreate: (preset: { day?: string; time?: string; isWeekly?: boolean }) => void;
    onEdit: (a: Activity) => void;
}

const DAY_TO_JS: Record<string, number> = {
    TODOS: -1,
    LUNES: 1, MARTES: 2, MIERCOLES: 3, JUEVES: 4,
    VIERNES: 5, SABADO: 6, DOMINGO: 0,
};

const JS_TO_DAY: Record<number, string> = {
    0: 'DOMINGO', 1: 'LUNES', 2: 'MARTES', 3: 'MIERCOLES',
    4: 'JUEVES', 5: 'VIERNES', 6: 'SABADO',
};

// Parse "HH:mm - HH:mm" or "HH:mm" → {start, end}
function parseTime(t?: string): { start: string; end: string } | null {
    if (!t) return null;
    const parts = t.split('-').map((s) => s.trim());
    const start = parts[0]?.match(/^(\d{1,2}):(\d{2})/);
    if (!start) return null;
    const startStr = start[1].padStart(2, '0') + ':' + start[2];
    let endStr = startStr;
    if (parts[1]) {
        const end = parts[1].match(/^(\d{1,2}):(\d{2})/);
        if (end) endStr = end[1].padStart(2, '0') + ':' + end[2];
        else endStr = addHour(startStr);
    } else {
        endStr = addHour(startStr);
    }
    return { start: startStr, end: endStr };
}

function addHour(hhmm: string): string {
    const [h, m] = hhmm.split(':').map(Number);
    const nextH = (h + 1) % 24;
    return String(nextH).padStart(2, '0') + ':' + String(m).padStart(2, '0');
}

function toEvents(activities: Activity[]) {
    // Anchor to the current week's Monday
    const now = new Date();
    const dayOfWeek = now.getDay();
    const diffToMon = (dayOfWeek === 0 ? -6 : 1 - dayOfWeek);
    const monday = new Date(now);
    monday.setDate(now.getDate() + diffToMon);
    monday.setHours(0, 0, 0, 0);

    const events: any[] = [];
    activities.forEach((a) => {
        const time = parseTime(a.time);
        if (!time) return;
        const targetDay = DAY_TO_JS[a.day || 'TODOS'];
        const daysToRender = targetDay === -1 ? [1, 2, 3, 4, 5, 6, 0] : [targetDay];
        daysToRender.forEach((d) => {
            const dayIdx = d === 0 ? 6 : d - 1;
            const startDate = new Date(monday);
            startDate.setDate(monday.getDate() + dayIdx);
            const [sh, sm] = time.start.split(':').map(Number);
            startDate.setHours(sh, sm, 0, 0);
            const endDate = new Date(startDate);
            const [eh, em] = time.end.split(':').map(Number);
            endDate.setHours(eh, em, 0, 0);
            if (endDate <= startDate) endDate.setDate(endDate.getDate() + 1);
            events.push({
                id: a._id + '-' + d,
                title: a.title + (a.category ? ' · ' + a.category : ''),
                start: startDate.toISOString(),
                end: endDate.toISOString(),
                extendedProps: { activity: a },
                backgroundColor: colorFor(a.category || 'default'),
                borderColor: colorFor(a.category || 'default'),
            });
        });
    });
    return events;
}

function colorFor(seed: string): string {
    const colors = ['#6366f1', '#ec4899', '#10b981', '#f59e0b', '#3b82f6', '#8b5cf6', '#14b8a6', '#f97316'];
    let hash = 0;
    for (let i = 0; i < seed.length; i++) hash = (hash << 5) - hash + seed.charCodeAt(i);
    return colors[Math.abs(hash) % colors.length];
}

export const ActivityCalendar: React.FC<ActivityCalendarProps> = ({ activities, onCreate, onEdit }) => {
    const events = React.useMemo(() => toEvents(activities), [activities]);
    return (
        <div className="rounded-lg border bg-card p-3 shadow-sm">
            <FullCalendar
                plugins={[timeGridPlugin, dayGridPlugin, interactionPlugin]}
                initialView="timeGridWeek"
                locale={esLocale}
                headerToolbar={{
                    left: 'prev,next today',
                    center: 'title',
                    right: 'timeGridWeek,timeGridDay,dayGridMonth',
                }}
                buttonText={{
                    today: 'Hoy', week: 'Semana', day: 'Dia', month: 'Mes',
                }}
                allDaySlot={false}
                slotMinTime="06:00:00"
                slotMaxTime="24:00:00"
                slotDuration="00:30:00"
                selectable
                selectMirror
                nowIndicator
                height="auto"
                events={events}
                select={(info) => {
                    const start = info.start;
                    const end = info.end;
                    const jsDay = start.getDay();
                    const dayLabel = JS_TO_DAY[jsDay];
                    const hh = String(start.getHours()).padStart(2, '0');
                    const mm = String(start.getMinutes()).padStart(2, '0');
                    const eh = String(end.getHours()).padStart(2, '0');
                    const em = String(end.getMinutes()).padStart(2, '0');
                    onCreate({
                        day: dayLabel,
                        time: hh + ':' + mm + ' - ' + eh + ':' + em,
                        isWeekly: true,
                    });
                }}
                eventClick={(info) => {
                    const a = (info.event.extendedProps as any).activity;
                    if (a) onEdit(a);
                }}
            />
        </div>
    );
};
