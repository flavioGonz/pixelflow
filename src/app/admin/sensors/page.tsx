'use client';

import * as React from 'react';
import { io, Socket } from 'socket.io-client';
import { motion, AnimatePresence } from 'framer-motion';
import Thermometer from 'lucide-react/dist/esm/icons/thermometer';
import Droplets from 'lucide-react/dist/esm/icons/droplets';
import Zap from 'lucide-react/dist/esm/icons/zap';
import Plus from 'lucide-react/dist/esm/icons/plus';
import Trash2 from 'lucide-react/dist/esm/icons/trash-2';
import Edit3 from 'lucide-react/dist/esm/icons/edit-3';
import Wifi from 'lucide-react/dist/esm/icons/wifi';
import WifiOff from 'lucide-react/dist/esm/icons/wifi-off';
import RefreshCw from 'lucide-react/dist/esm/icons/refresh-cw';
import Radio from 'lucide-react/dist/esm/icons/radio';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
    Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
    AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Toaster } from '@/components/ui/sonner';
import { toast } from 'sonner';

let socket: Socket;

interface Sensor {
    _id?: string;
    name: string;
    location?: string;
    kind: 'TEMPERATURE' | 'HUMIDITY' | 'MOTION' | 'CONTACT' | 'POWER' | 'BINARY' | 'GENERIC';
    unit?: string;
    provider: 'EWELINK' | 'MOCK' | 'MQTT';
    providerId?: string;
    providerParam?: string;
    lastValue?: any;
    lastReadAt?: string;
    isOnline?: boolean;
    displayColor?: string;
    displayIcon?: string;
    precision?: number;
}

const KIND_META: Record<string, { label: string; icon: React.ElementType; color: string; defaultUnit: string }> = {
    TEMPERATURE: { label: 'Temperatura', icon: Thermometer, color: '#f59e0b', defaultUnit: '°C' },
    HUMIDITY:    { label: 'Humedad',     icon: Droplets,    color: '#0ea5e9', defaultUnit: '%'  },
    MOTION:      { label: 'Movimiento',  icon: Radio,       color: '#8b5cf6', defaultUnit: ''   },
    CONTACT:     { label: 'Contacto',    icon: Radio,       color: '#10b981', defaultUnit: ''   },
    POWER:       { label: 'Potencia',    icon: Zap,         color: '#ef4444', defaultUnit: 'W'  },
    BINARY:      { label: 'On / Off',    icon: Zap,         color: '#64748b', defaultUnit: ''   },
    GENERIC:     { label: 'Genérico',    icon: Radio,       color: '#94a3b8', defaultUnit: ''   },
};

export default function SensorsPage() {
    const [sensors, setSensors] = React.useState<Sensor[]>([]);
    const [creating, setCreating] = React.useState(false);
    const [editing, setEditing] = React.useState<Sensor | null>(null);
    const [toDelete, setToDelete] = React.useState<Sensor | null>(null);

    const fetchSensors = React.useCallback(async () => {
        const r = await fetch('/api/sensors');
        setSensors(await r.json());
    }, []);

    React.useEffect(() => {
        socket = io();
        socket.on('connect', () => { socket.emit('get_sensors'); });
        socket.on('sensors_list', (list: Sensor[]) => setSensors(list));
        fetchSensors();
        // sensors_auto_refresh: fallback poll every 15s in case socket events miss
        const iv = setInterval(fetchSensors, 15000);
        return () => { clearInterval(iv); socket.disconnect(); };
    }, [fetchSensors]);
    const save = async (sensor: Sensor) => {
        if (!sensor.name?.trim()) { toast.error('Nombre requerido'); return; }
        const isNew = !sensor._id;
        const res = await fetch(isNew ? '/api/sensors' : '/api/sensors/' + sensor._id, {
            method: isNew ? 'POST' : 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(sensor),
        });
        if (res.ok) { toast.success(isNew ? 'Sensor creado' : 'Sensor actualizado', { description: sensor.name }); fetchSensors(); setCreating(false); setEditing(null); }
        else toast.error('No se pudo guardar');
    };

    const del = async () => {
        if (!toDelete?._id) return;
        const r = await fetch('/api/sensors/' + toDelete._id, { method: 'DELETE' });
        if (r.ok) { toast.success('Sensor eliminado'); fetchSensors(); }
        setToDelete(null);
    };

    // Mock reading push (useful when EWELINK not configured yet)
    const pushMock = (s: Sensor) => {
        if (!s._id) return;
        const meta = KIND_META[s.kind];
        let val: any;
        if (s.kind === 'TEMPERATURE') val = 18 + Math.random() * 15;
        else if (s.kind === 'HUMIDITY') val = 30 + Math.random() * 60;
        else if (s.kind === 'POWER')    val = Math.floor(Math.random() * 3000);
        else if (s.kind === 'BINARY' || s.kind === 'MOTION' || s.kind === 'CONTACT') val = Math.random() > 0.5;
        else val = Math.random() * 100;
        socket.emit('push_sensor_reading', { sensorId: s._id, value: val, unit: s.unit || meta.defaultUnit });
        toast.success('Lectura simulada enviada');
    };

    const target: Sensor | null = editing || (creating ? { name: '', kind: 'TEMPERATURE', provider: 'EWELINK', unit: '°C' } as Sensor : null);

    return (
        <div className="flex-1 flex flex-col min-h-0 bg-background text-foreground">
            <AdminHeader
                title="Sensores"
                subtitle="Componentes IoT integrados al hotel"
                icon={<Radio size={20} strokeWidth={1.75} />}
                actions={
                    <div className="flex items-center gap-2">
                        <Button size="sm" variant="outline" onClick={fetchSensors}><RefreshCw className="size-3.5" /></Button>
                        <Button size="sm" onClick={() => setCreating(true)}><Plus className="size-4" /> Nuevo sensor</Button>
                    </div>
                }
            />

            <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {/* Stats */}
                    <div className="rounded-lg border bg-card overflow-hidden">
                        <table className="w-full text-sm">
                            <thead className="bg-muted/40 border-b">
                                <tr className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                                    <th className="text-left px-3 py-2.5 w-10"></th>
                                    <th className="text-left px-3 py-2.5">Nombre</th>
                                    <th className="text-left px-3 py-2.5 w-28">Tipo</th>
                                    <th className="text-right px-3 py-2.5 w-32">Valor</th>
                                    <th className="text-left px-3 py-2.5 w-44">Última lectura</th>
                                    <th className="text-left px-3 py-2.5 w-24">Estado</th>
                                    <th className="text-right px-3 py-2.5 w-56">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border/50">
                                {sensors.map((s) => {
                                    const meta = KIND_META[s.kind] || KIND_META.GENERIC;
                                    const Icon = s.provider === 'EWELINK' && (s.kind === 'BINARY' || s.providerParam === 'switch') ? Zap : meta.icon;
                                    const online = !!s.isOnline;
                                    const isBinary = s.kind === 'BINARY' || s.providerParam === 'switch';
                                    const isOn = s.lastValue === 'on' || s.lastValue === 1 || s.lastValue === true;
                                    return (
                                        <tr key={s._id} className="hover:bg-accent/40 transition-colors">
                                            <td className="px-3 py-2.5">
                                                <div className="size-9 rounded-md grid place-items-center" style={{ backgroundColor: (s.displayColor || meta.color) + '20', color: s.displayColor || meta.color }}>
                                                    <Icon className="size-4" />
                                                </div>
                                            </td>
                                            <td className="px-3 py-2.5">
                                                <div className="font-semibold text-[13px] truncate">{s.name}</div>
                                                <div className="flex items-center gap-2 mt-0.5">
                                                    {s.location && <span className="text-[10px] text-muted-foreground truncate">{s.location}</span>}
                                                    {s.provider === 'EWELINK' && s.providerId && <span className="font-mono text-[9px] text-muted-foreground/70">{s.providerId.slice(-6)}</span>}
                                                </div>
                                            </td>
                                            <td className="px-3 py-2.5">
                                                <Badge variant="secondary" className="text-[10px] h-5 font-normal">{meta.label}</Badge>
                                                {s.providerParam && <div className="text-[9px] font-mono text-muted-foreground mt-0.5">{s.providerParam}</div>}
                                            </td>
                                            <td className="px-3 py-2.5 text-right">
                                                <div className="font-mono text-lg font-bold tabular-nums" style={{ color: s.displayColor || meta.color }}>
                                                    {s.lastValue != null
                                                        ? (typeof s.lastValue === 'number'
                                                            ? s.lastValue.toFixed(s.precision ?? 1)
                                                            : (typeof s.lastValue === 'boolean' ? (s.lastValue ? 'ON' : 'OFF') : String(s.lastValue)))
                                                        : <span className="text-muted-foreground text-sm">—</span>}
                                                    <span className="text-xs text-muted-foreground ml-1">{s.unit || meta.defaultUnit}</span>
                                                </div>
                                            </td>
                                            <td className="px-3 py-2.5 text-[11px] text-muted-foreground">
                                                {s.lastReadAt ? new Date(s.lastReadAt).toLocaleString('es-UY', { hour12: false, month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' }) : 'Nunca'}
                                            </td>
                                            <td className="px-3 py-2.5">
                                                {online
                                                    ? <Badge variant="secondary" className="gap-1 h-5 text-[10px] bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"><span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" /> Online</Badge>
                                                    : <Badge variant="outline" className="gap-1 h-5 text-[10px] border-rose-500/40 text-rose-600"><span className="size-1.5 rounded-full bg-rose-500" /> Offline</Badge>}
                                            </td>
                                            <td className="px-3 py-2.5">
                                                <div className="flex items-center justify-end gap-1">
                                                    {isBinary && s.provider === 'EWELINK' && (
                                                        <div className="flex items-center rounded-md border overflow-hidden mr-1">
                                                            <button
                                                                onClick={async () => {
                                                                    try {
                                                                        const r = await fetch('/api/ewelink/action', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sensorId: s._id, params: { switch: 'on' } }) });
                                                                        const d = await r.json();
                                                                        if (d.ok) toast.success('✓ ' + s.name + ' encendido'); else toast.error(d.error || 'Error');
                                                                        setTimeout(fetchSensors, 1500);
                                                                    } catch (e: any) { toast.error(e.message); }
                                                                }}
                                                                className={'h-7 px-3 text-[11px] font-bold transition-colors ' + (isOn ? 'bg-emerald-500 text-white' : 'hover:bg-emerald-500/10 text-emerald-600')}
                                                            >
                                                                ON
                                                            </button>
                                                            <button
                                                                onClick={async () => {
                                                                    try {
                                                                        const r = await fetch('/api/ewelink/action', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sensorId: s._id, params: { switch: 'off' } }) });
                                                                        const d = await r.json();
                                                                        if (d.ok) toast.success('✓ ' + s.name + ' apagado'); else toast.error(d.error || 'Error');
                                                                        setTimeout(fetchSensors, 1500);
                                                                    } catch (e: any) { toast.error(e.message); }
                                                                }}
                                                                className={'h-7 px-3 text-[11px] font-bold transition-colors border-l ' + (!isOn ? 'bg-rose-500 text-white' : 'hover:bg-rose-500/10 text-rose-600')}
                                                            >
                                                                OFF
                                                            </button>
                                                        </div>
                                                    )}
                                                    <Button size="sm" variant="ghost" className="h-7 w-7" onClick={() => pushMock(s)} title="Simular lectura">
                                                        <Zap className="size-3.5" />
                                                    </Button>
                                                    <Button size="sm" variant="ghost" className="h-7 w-7" onClick={() => setEditing(s)} title="Editar">
                                                        <Edit3 className="size-3.5" />
                                                    </Button>
                                                    <Button size="sm" variant="ghost" className="h-7 w-7 text-destructive hover:bg-destructive/10" onClick={() => setToDelete(s)} title="Eliminar">
                                                        <Trash2 className="size-3.5" />
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
            </div>

            <Dialog open={!!target} onOpenChange={(o) => { if (!o) { setCreating(false); setEditing(null); } }}>
                <DialogContent className="sm:max-w-[560px]">
                    {target && <SensorForm initial={target} isNew={creating} onCancel={() => { setCreating(false); setEditing(null); }} onSave={save} />}
                </DialogContent>
            </Dialog>

            <AlertDialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>¿Eliminar sensor?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Se eliminará <b>{toDelete?.name}</b>. Los widgets que lo estén mostrando dejarán de recibir datos.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={del} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Eliminar</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <Toaster />
        </div>
    );
}

const SensorForm: React.FC<{ initial: Sensor; isNew: boolean; onSave: (s: Sensor) => void; onCancel: () => void }> = ({ initial, isNew, onSave, onCancel }) => {
    const [name, setName] = React.useState(initial.name || '');
    const [location, setLocation] = React.useState(initial.location || '');
    const [kind, setKind] = React.useState(initial.kind || 'TEMPERATURE');
    const [unit, setUnit] = React.useState(initial.unit || KIND_META[initial.kind || 'TEMPERATURE'].defaultUnit);
    const [provider, setProvider] = React.useState(initial.provider || 'EWELINK');
    const [providerId, setProviderId] = React.useState(initial.providerId || '');
    const [ewelinkDevices, setEwelinkDevices] = React.useState<any[]>([]);
    const [loadingDevices, setLoadingDevices] = React.useState(false);
    React.useEffect(() => {
        if (provider !== 'EWELINK') return;
        setLoadingDevices(true);
        fetch('/api/ewelink/devices').then(r => r.json()).then((data) => {
            if (data && data.ok) {
                const list = data.devices?.thingList || data.devices?.list || data.devices || [];
                setEwelinkDevices(Array.isArray(list) ? list.map((it: any) => it.itemData || it) : []);
            }
        }).catch(() => {}).finally(() => setLoadingDevices(false));
    }, [provider]);
    const [providerParam, setProviderParam] = React.useState(initial.providerParam || 'currentTemperature');
    const [displayColor, setDisplayColor] = React.useState(initial.displayColor || KIND_META[initial.kind || 'TEMPERATURE'].color);
    const meta = KIND_META[kind];

    return (
        <>
            <DialogHeader>
                <DialogTitle className="font-heading flex items-center gap-2">
                    <span className="size-8 rounded-md grid place-items-center bg-primary/10 text-primary">
                        <meta.icon className="size-4" />
                    </span>
                    {isNew ? 'Nuevo sensor' : 'Editar sensor'}
                </DialogTitle>
                <DialogDescription>Configuralo y aparecerá como widget arrastrable en el Studio.</DialogDescription>
            </DialogHeader>

            <div className="space-y-3 py-2">
                <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5 col-span-2">
                        <Label className="text-[12px]">Nombre *</Label>
                        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ej: Termostato hall" className="h-9" />
                    </div>
                    <div className="space-y-1.5">
                        <Label className="text-[12px]">Tipo</Label>
                        <Select value={kind} onValueChange={(v) => { if (!v) return; setKind(v as any); setUnit(KIND_META[v].defaultUnit); setDisplayColor(KIND_META[v].color); }}>
                            <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                            <SelectContent>
                                {Object.entries(KIND_META).map(([k, m]) => (
                                    <SelectItem key={k} value={k}>{m.label}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-1.5">
                        <Label className="text-[12px]">Unidad</Label>
                        <Input value={unit} onChange={(e) => setUnit(e.target.value)} className="h-9 font-mono text-center" maxLength={5} />
                    </div>
                    <div className="space-y-1.5 col-span-2">
                        <Label className="text-[12px]">Ubicación</Label>
                        <Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Ej: Hall principal" className="h-9" />
                    </div>
                </div>

                <div className="rounded-lg border bg-card p-3 space-y-3">
                    <Label className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">Integración</Label>
                    <div className="grid grid-cols-3 gap-2">
                        <div className="space-y-1.5">
                            <Label className="text-[11px]">Proveedor</Label>
                            <Select value={provider} onValueChange={(v) => v && setProvider(v as any)}>
                                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="EWELINK">eWeLink (Sonoff)</SelectItem>
                                    <SelectItem value="MQTT">MQTT</SelectItem>
                                    <SelectItem value="MOCK">Mock (test)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-[11px]">Device ID</Label>
                            {provider === 'EWELINK' ? (
                                <Select value={providerId} onValueChange={(v) => {
                                    if (!v) return;
                                    setProviderId(v);
                                    // Auto-fill name + kind based on selected device
                                    const d = ewelinkDevices.find((x) => x.deviceid === v);
                                    if (d) {
                                        if (!name) setName(d.name || ('Sonoff ' + v.slice(-4)));
                                        const params = d.params || {};
                                        if ('currentTemperature' in params && !providerParam) { setKind('TEMPERATURE'); setUnit('°C'); setProviderParam('currentTemperature'); }
                                        else if ('currentHumidity' in params && !providerParam) { setKind('HUMIDITY'); setUnit('%'); setProviderParam('currentHumidity'); }
                                        else if ('power' in params && !providerParam) { setKind('POWER'); setUnit('W'); setProviderParam('power'); }
                                        else if ('switch' in params && !providerParam) { setKind('BINARY'); setProviderParam('switch'); }
                                    }
                                }}>
                                    <SelectTrigger className="h-9 text-[11px]">
                                        <SelectValue placeholder={loadingDevices ? 'Cargando…' : (ewelinkDevices.length ? 'Elegí un device' : 'Sin devices')} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {ewelinkDevices.length === 0 && (
                                            <div className="px-2 py-3 text-[11px] text-muted-foreground italic">
                                                {loadingDevices ? 'Cargando…' : 'No hay devices. Autorizá la cuenta en /admin/settings/integrations/ewelink'}
                                            </div>
                                        )}
                                        {ewelinkDevices.map((d, i) => (
                                            <SelectItem key={d.deviceid || i} value={d.deviceid}>
                                                <span className="flex items-center gap-2">
                                                    <span className={'size-1.5 rounded-full ' + (d.online === false ? 'bg-muted-foreground/40' : 'bg-emerald-500')} />
                                                    <span className="font-medium">{d.name || 'Sin nombre'}</span>
                                                    <span className="font-mono text-[10px] text-muted-foreground">{(d.deviceid || '').slice(-6)}</span>
                                                </span>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            ) : (
                                <Input value={providerId} onChange={(e) => setProviderId(e.target.value)} placeholder="deviceid" className="h-9 font-mono text-[11px]" />
                            )}
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-[11px]">Param</Label>
                            <Input value={providerParam} onChange={(e) => setProviderParam(e.target.value)} placeholder="currentTemperature" className="h-9 font-mono text-[11px]" />
                        </div>
                    </div>
                </div>

                <div className="flex items-center justify-between rounded-md border bg-card px-3 py-2">
                    <Label className="text-[12px]">Color de display</Label>
                    <div className="flex items-center gap-2">
                        <input type="color" value={displayColor} onChange={(e) => setDisplayColor(e.target.value)} className="size-7 rounded border-none bg-transparent cursor-pointer" />
                        <span className="text-[11px] font-mono text-muted-foreground">{displayColor.toUpperCase()}</span>
                    </div>
                </div>
            </div>

            <DialogFooter>
                <Button variant="outline" onClick={onCancel}>Cancelar</Button>
                <Button onClick={() => onSave({ ...initial, name, location, kind, unit, provider, providerId, providerParam, displayColor })}>
                    {isNew ? 'Crear sensor' : 'Guardar'}
                </Button>
            </DialogFooter>
        </>
    );
};
