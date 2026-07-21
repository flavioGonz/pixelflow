'use client';

import * as React from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Trash2 from 'lucide-react/dist/esm/icons/trash-2';
import Repeat from 'lucide-react/dist/esm/icons/repeat';
import CalendarIcon from 'lucide-react/dist/esm/icons/calendar';
import { colorForLayout } from '@/lib/scheduleColors';
import type { ScheduleEventNew, Recurrence } from '@/lib/scheduleRecurrence';
import { describeRecurrence } from '@/lib/scheduleRecurrence';

interface Layout { _id: string; name: string; }

const DAYS = [
    { v: 1, label: 'L' },
    { v: 2, label: 'M' },
    { v: 3, label: 'X' },
    { v: 4, label: 'J' },
    { v: 5, label: 'V' },
    { v: 6, label: 'S' },
    { v: 0, label: 'D' },
];

const RECURRENCE_OPTIONS: { value: Recurrence; label: string; desc: string }[] = [
    { value: 'none',     label: 'Una vez',     desc: 'Solo en la fecha de inicio' },
    { value: 'daily',    label: 'Diario',      desc: 'Todos los días' },
    { value: 'weekdays', label: 'Lun a Vie',   desc: 'Excluye sábado y domingo' },
    { value: 'weekly',   label: 'Semanal',     desc: 'Días específicos cada semana' },
    { value: 'monthly',  label: 'Mensual',     desc: 'Cada mes el mismo día' },
    { value: 'custom',   label: 'Cada N días', desc: 'Intervalo personalizado' },
];

interface EventDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    event: ScheduleEventNew | null;
    editingIndex: number | null;
    layouts: Layout[];
    onSave: (event: ScheduleEventNew) => void;
    onDelete?: () => void;
}

function todayISO(): string {
    const d = new Date();
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}

export const EventDialog: React.FC<EventDialogProps> = ({
    open,
    onOpenChange,
    event,
    editingIndex,
    layouts,
    onSave,
    onDelete,
}) => {
    const [layoutId, setLayoutId] = React.useState('');
    const [startTime, setStartTime] = React.useState('09:00');
    const [endTime, setEndTime] = React.useState('10:00');
    const [recurrence, setRecurrence] = React.useState<Recurrence>('weekly');
    const [startDate, setStartDate] = React.useState(todayISO());
    const [endDate, setEndDate] = React.useState<string>('');
    const [daysOfWeek, setDaysOfWeek] = React.useState<number[]>([1]);
    const [intervalDays, setIntervalDays] = React.useState<number>(2);

    React.useEffect(() => {
        if (!open || !event) return;
        setLayoutId(event.layoutId || '');
        setStartTime(event.startTime || '09:00');
        setEndTime(event.endTime || '10:00');
        setRecurrence(event.recurrence || 'weekly');
        setStartDate(event.startDate || todayISO());
        setEndDate(event.endDate || '');
        setDaysOfWeek(event.daysOfWeek && event.daysOfWeek.length > 0 ? event.daysOfWeek : [1]);
        setIntervalDays(event.intervalDays || 2);
    }, [event, open]);

    const isNew = editingIndex === null;
    const color = colorForLayout(layoutId);
    const validTimes = startTime < endTime;
    const validDates = !endDate || endDate >= startDate;
    const canSave = layoutId && validTimes && validDates && (recurrence !== 'weekly' || daysOfWeek.length > 0);

    const handleSave = () => {
        if (!canSave) return;
        const ev: ScheduleEventNew = {
            ...event,
            layoutId,
            startTime,
            endTime,
            recurrence,
            startDate,
            endDate: endDate || null,
            daysOfWeek: recurrence === 'weekly' ? daysOfWeek : undefined,
            intervalDays: recurrence === 'custom' ? intervalDays : undefined,
        };
        onSave(ev);
        onOpenChange(false);
    };

    const previewText = describeRecurrence({
        ...(event || ({} as ScheduleEventNew)),
        recurrence,
        daysOfWeek,
        intervalDays,
    });

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[520px]">
                <DialogHeader>
                    <DialogTitle className="font-heading">
                        {isNew ? 'Nuevo evento' : 'Editar evento'}
                    </DialogTitle>
                    <DialogDescription>
                        Asigná un diseño a un horario con recurrencia.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-2">
                    {/* Layout */}
                    <div className="space-y-1.5">
                        <Label htmlFor="event-layout">Diseño</Label>
                        <Select value={layoutId} onValueChange={(v) => setLayoutId(v || '')}>
                            <SelectTrigger id="event-layout">
                                <SelectValue placeholder="Elegir diseño…" />
                            </SelectTrigger>
                            <SelectContent>
                                {layouts.map((l) => {
                                    const c = colorForLayout(l._id);
                                    return (
                                        <SelectItem key={l._id} value={l._id}>
                                            <div className="flex items-center gap-2">
                                                <span className="size-3 rounded-sm shrink-0" style={{ background: c.bg }} />
                                                <span>{l.name}</span>
                                            </div>
                                        </SelectItem>
                                    );
                                })}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Time range */}
                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                            <Label htmlFor="event-start">Hora inicio</Label>
                            <Input id="event-start" type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} step={300} />
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="event-end">Hora fin</Label>
                            <Input id="event-end" type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} step={300} />
                        </div>
                    </div>
                    {!validTimes && (
                        <p className="text-xs text-destructive">La hora de fin debe ser posterior a la de inicio.</p>
                    )}

                    {/* Date range */}
                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                            <Label htmlFor="event-startdate">Fecha inicio</Label>
                            <Input id="event-startdate" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="event-enddate" className="flex items-center justify-between">
                                <span>Fecha fin</span>
                                <span className="text-[10px] font-normal text-muted-foreground">opcional</span>
                            </Label>
                            <Input id="event-enddate" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} min={startDate} />
                        </div>
                    </div>
                    {!validDates && (
                        <p className="text-xs text-destructive">La fecha de fin debe ser igual o posterior a la de inicio.</p>
                    )}

                    {/* Recurrence */}
                    <div className="space-y-1.5">
                        <Label className="flex items-center gap-1.5">
                            <Repeat className="size-3.5" />
                            Repetición
                        </Label>
                        <Select value={recurrence} onValueChange={(v) => v && setRecurrence(v as Recurrence)}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {RECURRENCE_OPTIONS.map((opt) => (
                                    <SelectItem key={opt.value} value={opt.value}>
                                        <div className="flex flex-col">
                                            <span className="font-medium">{opt.label}</span>
                                            <span className="text-[11px] text-muted-foreground">{opt.desc}</span>
                                        </div>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {recurrence === 'weekly' && (
                        <div className="space-y-1.5">
                            <Label>Días de la semana</Label>
                            <div className="flex flex-wrap gap-1">
                                {DAYS.map((d) => {
                                    const checked = daysOfWeek.includes(d.v);
                                    return (
                                        <button
                                            key={d.v}
                                            type="button"
                                            onClick={() => {
                                                if (checked) {
                                                    setDaysOfWeek(daysOfWeek.filter((x) => x !== d.v));
                                                } else {
                                                    setDaysOfWeek([...daysOfWeek, d.v].sort());
                                                }
                                            }}
                                            className={'size-8 grid place-items-center rounded-md text-[12px] font-semibold border transition-colors ' + (
                                                checked
                                                    ? 'bg-primary text-primary-foreground border-primary'
                                                    : 'bg-background border-input hover:bg-accent'
                                            )}
                                        >
                                            {d.label}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {recurrence === 'custom' && (
                        <div className="space-y-1.5">
                            <Label htmlFor="event-interval">Cada cuántos días</Label>
                            <Input
                                id="event-interval"
                                type="number"
                                min={1}
                                max={365}
                                value={intervalDays}
                                onChange={(e) => setIntervalDays(Math.max(1, parseInt(e.target.value) || 1))}
                            />
                        </div>
                    )}

                    {/* Preview */}
                    {layoutId && validTimes && (
                        <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-md border bg-muted/30">
                            <span className="size-3 rounded-sm shrink-0" style={{ background: color.bg }} />
                            <div className="flex-1 min-w-0">
                                <div className="text-[13px] font-medium">
                                    {layouts.find(l => l._id === layoutId)?.name || 'Diseño'}
                                </div>
                                <div className="text-[11px] text-muted-foreground flex items-center gap-1.5 flex-wrap">
                                    <CalendarIcon className="size-3" />
                                    <span>{previewText}</span>
                                    <span>·</span>
                                    <span>{startTime}–{endTime}</span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <DialogFooter className="flex flex-row gap-2 sm:justify-between">
                    {!isNew && onDelete ? (
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:text-destructive"
                            onClick={() => { onDelete(); onOpenChange(false); }}
                        >
                            <Trash2 className="size-4 mr-1" /> Eliminar
                        </Button>
                    ) : <span />}
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
                        <Button onClick={handleSave} disabled={!canSave}>
                            {isNew ? 'Crear evento' : 'Guardar cambios'}
                        </Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
