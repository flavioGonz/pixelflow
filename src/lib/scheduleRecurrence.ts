/**
 * Schedule data model with real dates + recurrence rules.
 * Stored alongside legacy fields for backward-compat with existing data.
 */

export type Recurrence =
    | 'none'      // single occurrence on `startDate`
    | 'daily'     // every day
    | 'weekdays'  // Mon..Fri
    | 'weekly'    // every week on the given daysOfWeek
    | 'monthly'   // every month on the same day-of-month
    | 'custom';   // every N days (interval)

export interface ScheduleEventNew {
    id?: string;
    layoutId: string;
    /** Start time HH:MM */
    startTime: string;
    /** End time HH:MM */
    endTime: string;
    /** Recurrence rule */
    recurrence: Recurrence;
    /** ISO date YYYY-MM-DD when the rule starts being active */
    startDate: string;
    /** Optional ISO date YYYY-MM-DD when the rule stops */
    endDate?: string | null;
    /** For weekly/custom recurrence: which days (0=Sun..6=Sat) */
    daysOfWeek?: number[];
    /** For custom recurrence: every N days */
    intervalDays?: number;
    /** ISO date YYYY-MM-DD list of dates to skip */
    exceptions?: string[];

    /* ----- Legacy fields (kept so old data still renders) ----- */
    dayOfWeek?: number;
}

/**
 * Translate a legacy event (only dayOfWeek + times) to the new shape, defaulting
 * to a weekly recurrence starting next Monday.
 */
export function legacyToNew(ev: any): ScheduleEventNew {
    if (ev.recurrence) return ev as ScheduleEventNew; // already new
    const today = new Date();
    return {
        layoutId: ev.layoutId,
        startTime: ev.startTime,
        endTime: ev.endTime,
        recurrence: 'weekly',
        startDate: today.toISOString().slice(0, 10),
        daysOfWeek: typeof ev.dayOfWeek === 'number' ? [ev.dayOfWeek] : [1],
    };
}

function pad(n: number): string {
    return n.toString().padStart(2, '0');
}

function isoDate(d: Date): string {
    return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
}

function addDays(d: Date, n: number): Date {
    const next = new Date(d);
    next.setDate(next.getDate() + n);
    return next;
}

function startOfDay(d: Date): Date {
    const r = new Date(d);
    r.setHours(0, 0, 0, 0);
    return r;
}

/**
 * Build concrete FullCalendar event instances within [rangeStart, rangeEnd].
 * Each instance has start/end as Date with the real time-of-day applied.
 */
export function expandEvent(
    ev: ScheduleEventNew,
    rangeStart: Date,
    rangeEnd: Date,
): { start: Date; end: Date; date: string }[] {
    const out: { start: Date; end: Date; date: string }[] = [];
    const ruleStart = startOfDay(new Date(ev.startDate));
    const ruleEnd = ev.endDate ? startOfDay(new Date(ev.endDate)) : null;

    const [sh, sm] = ev.startTime.split(':').map(Number);
    const [eh, em] = ev.endTime.split(':').map(Number);

    const exSet = new Set(ev.exceptions || []);

    // Generate candidate dates depending on recurrence
    const candidates: Date[] = [];

    if (ev.recurrence === 'none') {
        candidates.push(ruleStart);
    } else {
        // Iterate day by day in range, respecting rule start/end
        const rangeS = startOfDay(rangeStart);
        const rangeE = startOfDay(rangeEnd);
        const iterStart = rangeS < ruleStart ? ruleStart : rangeS;
        const iterEnd = ruleEnd && ruleEnd < rangeE ? ruleEnd : rangeE;

        if (ev.recurrence === 'daily') {
            for (let d = new Date(iterStart); d <= iterEnd; d = addDays(d, 1)) {
                candidates.push(new Date(d));
            }
        } else if (ev.recurrence === 'weekdays') {
            for (let d = new Date(iterStart); d <= iterEnd; d = addDays(d, 1)) {
                const dow = d.getDay();
                if (dow >= 1 && dow <= 5) candidates.push(new Date(d));
            }
        } else if (ev.recurrence === 'weekly') {
            const days = new Set(ev.daysOfWeek ?? []);
            for (let d = new Date(iterStart); d <= iterEnd; d = addDays(d, 1)) {
                if (days.has(d.getDay())) candidates.push(new Date(d));
            }
        } else if (ev.recurrence === 'monthly') {
            const targetDom = ruleStart.getDate();
            for (let d = new Date(iterStart); d <= iterEnd; d = addDays(d, 1)) {
                if (d.getDate() === targetDom) candidates.push(new Date(d));
            }
        } else if (ev.recurrence === 'custom') {
            const interval = Math.max(1, ev.intervalDays ?? 1);
            let d = new Date(ruleStart);
            while (d < iterStart) d = addDays(d, interval);
            while (d <= iterEnd) {
                candidates.push(new Date(d));
                d = addDays(d, interval);
            }
        }
    }

    for (const day of candidates) {
        const dateKey = isoDate(day);
        if (exSet.has(dateKey)) continue;
        const start = new Date(day);
        start.setHours(sh, sm, 0, 0);
        const end = new Date(day);
        end.setHours(eh, em, 0, 0);
        out.push({ start, end, date: dateKey });
    }

    return out;
}

/** Human-readable recurrence label */
export function describeRecurrence(ev: ScheduleEventNew): string {
    const DAYS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    switch (ev.recurrence) {
        case 'none':     return 'Una vez';
        case 'daily':    return 'Todos los días';
        case 'weekdays': return 'Lun a Vie';
        case 'weekly':
            if (!ev.daysOfWeek || ev.daysOfWeek.length === 0) return 'Semanal';
            return ev.daysOfWeek.slice().sort().map(d => DAYS[d]).join(', ');
        case 'monthly':  return 'Mensual';
        case 'custom':   return 'Cada ' + (ev.intervalDays ?? 1) + ' días';
    }
}
