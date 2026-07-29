'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import CheckCircle2 from 'lucide-react/dist/esm/icons/check-circle-2';
import AlertCircle from 'lucide-react/dist/esm/icons/alert-circle';
import RefreshCw from 'lucide-react/dist/esm/icons/refresh-cw';
import Download from 'lucide-react/dist/esm/icons/download';
import LogOut from 'lucide-react/dist/esm/icons/log-out';
import ExternalLink from 'lucide-react/dist/esm/icons/external-link';
import LinkIcon from 'lucide-react/dist/esm/icons/link';
import Loader2 from 'lucide-react/dist/esm/icons/loader-2';
import Save from 'lucide-react/dist/esm/icons/save';
import { toast } from 'sonner';
import { useSearchParams } from 'next/navigation';

interface EwelinkPanelProps {
    onCreateSensor?: (partial: any) => void;
}

interface EweSettings {
    appId?: string;
    appSecret?: string;
    region?: string;
    enabled?: boolean;
    pollIntervalMs?: number;
    connected?: boolean;
    lastLoginAt?: string;
    lastLoginError?: string;
}

const REGIONS = [
    { v: 'us', label: 'us — Americas (por defecto)' },
    { v: 'eu', label: 'eu — Europa' },
    { v: 'as', label: 'as — Asia' },
    { v: 'cn', label: 'cn — China continental' },
];

export const EwelinkPanel: React.FC<EwelinkPanelProps> = ({ onCreateSensor }) => {
    const [cfg, setCfg] = React.useState<EweSettings>({ region: 'us', pollIntervalMs: 60000 });
    const [loading, setLoading] = React.useState(true);
    const [saving, setSaving] = React.useState(false);
    const [connecting, setConnecting] = React.useState(false);
    const [testing, setTesting] = React.useState(false);
    const [fetching, setFetching] = React.useState(false);
    const [devices, setDevices] = React.useState<any[]>([]);
    const [importState, setImportState] = React.useState<null | { device: any; step: 'confirm' | 'running' | 'done' | 'error'; progress: number; message: string; sensorId?: string }>(null);
    const params = useSearchParams();

    React.useEffect(() => {
        fetch('/api/ewelink/settings').then(r => r.json()).then((data) => {
            setCfg(data);
            setLoading(false);
        }).catch(() => setLoading(false));
    }, []);

    React.useEffect(() => {
        if (params.get('connected') === '1') toast.success('¡Cuenta eWeLink conectada!');
        const err = params.get('error');
        if (err) toast.error('Error: ' + err);
    }, [params]);

    const save = async () => {
        setSaving(true);
        try {
            const r = await fetch('/api/ewelink/settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(cfg),
            });
            if (!r.ok) throw new Error('save failed');
            toast.success('Credenciales guardadas');
        } catch (e: any) { toast.error(e.message); } finally { setSaving(false); }
    };

    const connect = async () => {
        setConnecting(true);
        try {
            // Guardá primero si hay cambios
            await save();
            const r = await fetch('/api/ewelink/auth-url?region=' + (cfg.region || 'us'));
            const data = await r.json();
            if (data.url) window.location.href = data.url;
            else toast.error(data.error || 'No se pudo generar el URL');
        } catch (e: any) { toast.error(e.message); } finally { setConnecting(false); }
    };

    const disconnect = async () => {
        if (!confirm('¿Desconectar la cuenta de eWeLink?')) return;
        await fetch('/api/ewelink/disconnect', { method: 'POST' });
        setCfg({ ...cfg, connected: false });
        setDevices([]);
        toast.success('Desconectado');
    };

    const testToken = async () => {
        setTesting(true);
        try {
            const r = await fetch('/api/ewelink/test-login', { method: 'POST' });
            const data = await r.json();
            if (data.ok) toast.success('Token refresh OK');
            else toast.error(data.error || 'Error');
        } catch (e: any) { toast.error(e.message); } finally { setTesting(false); }
    };

    const importAll = async () => {
        if (!confirm('¿Importar todos los devices como sensores en /admin/sensors?')) return;
        try {
            const r = await fetch('/api/ewelink/import-all', { method: 'POST' });
            const data = await r.json();
            if (data.ok) toast.success(`✅ ${data.created} creados, ${data.updated} actualizados (total ${data.total})`);
            else toast.error(data.error || 'Error');
        } catch (e: any) { toast.error(e.message); }
    };

    const fetchDevices = async () => {
        setFetching(true);
        try {
            const r = await fetch('/api/ewelink/devices');
            const data = await r.json();
            if (!data.ok) { toast.error(data.error || 'Error'); return; }
            const list = data.devices?.thingList || data.devices?.list || data.devices || [];
            setDevices(Array.isArray(list) ? list.map((it: any) => it.itemData || it) : []);
            toast.success((list.length || 0) + ' dispositivos encontrados');
        } catch (e: any) { toast.error(e.message); } finally { setFetching(false); }
    };

    if (loading) return <div className="p-8 grid place-items-center"><Loader2 className="animate-spin size-6" /></div>;

    return (
        <div className="space-y-4">
            {importState && (
                <ImportModal
                    state={importState}
                    onCancel={() => setImportState(null)}
                    onDone={() => setImportState(null)}
                    onStart={async () => {
                        const d = importState.device;
                        setImportState({ ...importState, step: 'running', progress: 10, message: 'Detectando tipo de sensor…' });
                        const params = d.params || {};
                        let kind = 'GENERIC', unit = '', param = '';
                        if ('currentTemperature' in params || 'temperature' in params) { kind = 'TEMPERATURE'; unit = '°C'; param = 'currentTemperature' in params ? 'currentTemperature' : 'temperature'; }
                        else if ('currentHumidity' in params || 'humidity' in params) { kind = 'HUMIDITY'; unit = '%'; param = 'currentHumidity' in params ? 'currentHumidity' : 'humidity'; }
                        else if ('power' in params) { kind = 'POWER'; unit = 'W'; param = 'power'; }
                        else if ('motion' in params || 'motionEvent' in params) { kind = 'MOTION'; param = 'motion'; }
                        else if ('switch' in params) { kind = 'BINARY'; param = 'switch'; }
                        setImportState((s) => s ? { ...s, progress: 40, message: 'Tipo detectado: ' + kind } : s);
                        await new Promise(r => setTimeout(r, 350));
                        try {
                            setImportState((s) => s ? { ...s, progress: 65, message: 'Creando sensor en la base de datos…' } : s);
                            const res = await fetch('/api/sensors', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                    name: d.name || ('Sonoff ' + (d.deviceid || '').slice(-4)),
                                    kind, unit,
                                    provider: 'EWELINK',
                                    providerId: d.deviceid,
                                    providerParam: param,
                                    isOnline: d.online !== false,
                                }),
                            });
                            if (!res.ok) throw new Error(await res.text());
                            const sensor = await res.json();
                            setImportState((s) => s ? { ...s, progress: 100, step: 'done', message: '¡Listo! Sensor "' + (d.name || d.deviceid) + '" importado.', sensorId: sensor._id } : s);
                        } catch (e: any) {
                            setImportState((s) => s ? { ...s, step: 'error', message: e.message || 'Error al importar' } : s);
                        }
                    }}
                />
            )}

            <Alert>
                <AlertDescription className="text-[13px]">
                    Registrá una app en <a href="https://dev.ewelink.cc/#/app" target="_blank" rel="noreferrer" className="underline text-primary">dev.ewelink.cc</a> (OAuth2), copiá <b>APPID</b> y <b>APPSECRET</b>, y agregá el redirect URL abajo (dominio raíz) a los <em>Redirect URL</em> autorizados.
                </AlertDescription>
            </Alert>

            {/* Credenciales de la app */}
            <div className="rounded-lg border bg-card p-4 space-y-3">
                <div className="flex items-center justify-between">
                    <h4 className="text-[13px] font-bold">Credenciales de la app OAuth</h4>
                    {cfg.connected
                        ? <Badge variant="secondary" className="gap-1.5"><CheckCircle2 className="size-3 text-emerald-500" /> Conectado</Badge>
                        : <Badge variant="outline" className="gap-1.5"><AlertCircle className="size-3 text-muted-foreground" /> No conectado</Badge>}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                        <Label className="text-[12px]">APPID</Label>
                        <Input value={cfg.appId || ''} onChange={(e) => setCfg({ ...cfg, appId: e.target.value })} placeholder="32 chars" className="h-9 font-mono text-xs" />
                    </div>
                    <div className="space-y-1.5">
                        <Label className="text-[12px]">APP SECRET</Label>
                        <Input type="password" value={cfg.appSecret || ''} onChange={(e) => setCfg({ ...cfg, appSecret: e.target.value })} placeholder={cfg.appSecret === '••••••••' ? '(guardado)' : 'secret'} className="h-9 font-mono text-xs" />
                    </div>
                    <div className="space-y-1.5">
                        <Label className="text-[12px]">Región (data center)</Label>
                        <Select value={cfg.region || 'us'} onValueChange={(v) => v && setCfg({ ...cfg, region: v })}>
                            <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                            <SelectContent>{REGIONS.map(r => <SelectItem key={r.v} value={r.v}>{r.label}</SelectItem>)}</SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-1.5">
                        <Label className="text-[12px]">Intervalo de polling (ms)</Label>
                        <Input type="number" min={10000} step={5000} value={cfg.pollIntervalMs || 60000} onChange={(e) => setCfg({ ...cfg, pollIntervalMs: parseInt(e.target.value) })} className="h-9 font-mono text-xs" />
                    </div>
                </div>
                <div className="rounded-md border bg-muted/40 p-2.5 text-[11px] font-mono flex items-center gap-2">
                    <LinkIcon className="size-3 shrink-0" />
                    <span className="text-muted-foreground">Redirect URL:</span>
                    <span className="text-primary truncate">{typeof window !== 'undefined' ? window.location.origin + '/api/ewelink/callback' : '…'}</span>
                </div>
                <div className="flex justify-end gap-2 pt-2 border-t">
                    <Button onClick={save} disabled={saving} size="sm" variant="outline" className="gap-1.5">
                        {saving ? <Loader2 className="animate-spin size-3.5" /> : <Save className="size-3.5" />} Guardar
                    </Button>
                </div>
            </div>

            {/* Autorización */}
            <div className="rounded-lg border bg-card p-4 space-y-3">
                <h4 className="text-[13px] font-bold">Autorización</h4>
                {cfg.connected ? (
                    <div className="rounded-md border bg-emerald-500/5 border-emerald-500/30 p-3 flex items-center gap-3">
                        <CheckCircle2 className="size-5 text-emerald-500" />
                        <div className="flex-1">
                            <div className="text-[13px] font-semibold">Cuenta conectada</div>
                            <div className="text-[11px] text-muted-foreground">
                                Región {cfg.region} · última autorización {cfg.lastLoginAt ? new Date(cfg.lastLoginAt).toLocaleString() : '—'}
                            </div>
                        </div>
                        <Button onClick={testToken} disabled={testing} variant="outline" size="sm" className="gap-1.5">
                            {testing ? <Loader2 className="animate-spin size-3.5" /> : <RefreshCw className="size-3.5" />} Test
                        </Button>
                        <Button onClick={disconnect} variant="outline" size="sm" className="gap-1.5">
                            <LogOut className="size-3.5" /> Desconectar
                        </Button>
                    </div>
                ) : (
                    <div className="rounded-md border bg-muted/30 p-4 space-y-3">
                        <p className="text-[13px]">Configurá primero las credenciales, después conectá una cuenta eWeLink (te va a abrir la página de autorización).</p>
                        <Button onClick={connect} disabled={connecting || !cfg.appId || !cfg.appSecret} className="gap-2">
                            {connecting ? <Loader2 className="animate-spin size-4" /> : <ExternalLink className="size-4" />}
                            Conectar cuenta eWeLink
                        </Button>
                        {(!cfg.appId || !cfg.appSecret) && (
                            <p className="text-[11px] text-amber-600">Guardá APPID y APP SECRET primero.</p>
                        )}
                    </div>
                )}
                {cfg.lastLoginError && (
                    <div className="rounded-md border bg-destructive/5 border-destructive/30 p-3 text-[12px] text-destructive">
                        Último error: {cfg.lastLoginError}
                    </div>
                )}
            </div>

            {/* Dispositivos */}
            {cfg.connected && (
                <div className="rounded-lg border bg-card p-4 space-y-3">
                    <div className="flex items-center justify-between">
                        <h4 className="text-[13px] font-bold">Dispositivos</h4>
                        <div className="flex items-center gap-1.5">
                            <Button onClick={fetchDevices} disabled={fetching} size="sm" variant="outline" className="gap-1.5">
                                {fetching ? <Loader2 className="animate-spin size-3.5" /> : <Download className="size-3.5" />} Refrescar lista
                            </Button>
                            <Button onClick={importAll} size="sm" className="gap-1.5">
                                <Download className="size-3.5" /> Importar todos como sensores
                            </Button>
                        </div>
                    </div>
                    {devices.length === 0 ? (
                        <div className="rounded-md border border-dashed p-6 text-center text-[12px] text-muted-foreground">
                            Aún no cargaste la lista. Tocá "Refrescar lista".
                        </div>
                    ) : (
                        <div className="space-y-1">
                            {devices.map((d, i) => (
                                <div key={d.deviceid || i} className="flex items-center gap-3 p-2.5 rounded-md border hover:bg-accent/50">
                                    <span className={'size-2 rounded-full ' + (d.online === false ? 'bg-muted-foreground/40' : 'bg-emerald-500')} />
                                    <div className="flex-1 min-w-0">
                                        <div className="text-[13px] font-semibold truncate">{d.name || 'Sin nombre'}</div>
                                        <div className="text-[10px] text-muted-foreground font-mono truncate">{d.deviceid} · {d.brandName} {d.productModel}</div>
                                    </div>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        className="gap-1 h-7 text-xs"
                                        onClick={() => setImportState({ device: d, step: 'confirm', progress: 0, message: '' })}
                                    >
                                        Importar
                                    </Button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};


// ============================================================
// Import progress modal
// ============================================================
const ImportModal: React.FC<{
    state: { device: any; step: 'confirm' | 'running' | 'done' | 'error'; progress: number; message: string; sensorId?: string };
    onStart: () => void;
    onCancel: () => void;
    onDone: () => void;
}> = ({ state, onStart, onCancel, onDone }) => {
    const d = state.device;
    return (
        <div className="fixed inset-0 z-[9999] grid place-items-center bg-black/60 backdrop-blur-sm p-6" onClick={(e) => { if (e.target === e.currentTarget && state.step !== 'running') onCancel(); }}>
            <div className="w-full max-w-md rounded-xl border bg-card shadow-2xl overflow-hidden">
                <div className="p-5 border-b bg-gradient-to-br from-primary/5 to-transparent">
                    <div className="flex items-center gap-3">
                        <div className={'size-11 rounded-xl grid place-items-center ring-1 ' + (
                            state.step === 'error' ? 'bg-destructive/10 text-destructive ring-destructive/30' :
                            state.step === 'done' ? 'bg-emerald-500/10 text-emerald-500 ring-emerald-500/30' :
                            'bg-sky-500/10 text-sky-500 ring-sky-500/30'
                        )}>
                            {state.step === 'error' ? <AlertCircle className="size-5" /> :
                             state.step === 'done' ? <CheckCircle2 className="size-5" /> :
                             state.step === 'running' ? <Loader2 className="size-5 animate-spin" /> :
                             <Download className="size-5" />}
                        </div>
                        <div className="flex-1 min-w-0">
                            <h3 className="text-[15px] font-bold tracking-tight">
                                {state.step === 'confirm' ? 'Importar sensor' :
                                 state.step === 'running' ? 'Importando…' :
                                 state.step === 'done' ? '¡Importado!' : 'Error'}
                            </h3>
                            <p className="text-[12px] text-muted-foreground truncate">{d.name || d.deviceid}</p>
                        </div>
                    </div>
                </div>

                <div className="p-5 space-y-3">
                    <div className="rounded-md border bg-muted/40 p-3 space-y-1.5">
                        <div className="flex justify-between text-[12px]"><span className="text-muted-foreground">Nombre</span><span className="font-semibold">{d.name || '—'}</span></div>
                        <div className="flex justify-between text-[12px]"><span className="text-muted-foreground">Device ID</span><span className="font-mono text-[11px]">{d.deviceid}</span></div>
                        <div className="flex justify-between text-[12px]"><span className="text-muted-foreground">Marca / Modelo</span><span>{d.brandName || '—'} {d.productModel || ''}</span></div>
                        <div className="flex justify-between text-[12px]"><span className="text-muted-foreground">Estado</span>{d.online === false ? <span className="text-muted-foreground">Offline</span> : <span className="text-emerald-500 font-semibold">Online</span>}</div>
                    </div>

                    {(state.step === 'running' || state.step === 'done') && (
                        <div className="space-y-1.5">
                            <div className="h-2 rounded-full bg-muted overflow-hidden">
                                <div className="h-full bg-primary transition-all duration-500 ease-out" style={{ width: state.progress + '%' }} />
                            </div>
                            <p className="text-[11px] text-muted-foreground text-center">{state.message}</p>
                        </div>
                    )}

                    {state.step === 'error' && (
                        <div className="rounded-md border bg-destructive/5 border-destructive/30 p-3 text-[12px] text-destructive">{state.message}</div>
                    )}
                </div>

                <div className="px-5 py-3 border-t bg-muted/20 flex justify-end gap-2">
                    {state.step === 'confirm' && (
                        <>
                            <button onClick={onCancel} className="h-8 px-3 rounded-md border bg-background text-[12px] hover:bg-accent">Cancelar</button>
                            <button onClick={onStart} className="h-8 px-3 rounded-md bg-primary text-primary-foreground text-[12px] font-semibold hover:bg-primary/90 flex items-center gap-1.5">
                                <Download className="size-3.5" /> Importar como sensor
                            </button>
                        </>
                    )}
                    {state.step === 'running' && (
                        <button disabled className="h-8 px-3 rounded-md bg-muted text-[12px] text-muted-foreground">Trabajando…</button>
                    )}
                    {state.step === 'done' && (
                        <>
                            <a href="/admin/sensors" className="h-8 px-3 rounded-md border bg-background text-[12px] hover:bg-accent flex items-center">Ver en /admin/sensors</a>
                            <button onClick={onDone} className="h-8 px-3 rounded-md bg-primary text-primary-foreground text-[12px] font-semibold hover:bg-primary/90">Listo</button>
                        </>
                    )}
                    {state.step === 'error' && (
                        <button onClick={onCancel} className="h-8 px-3 rounded-md bg-primary text-primary-foreground text-[12px] font-semibold hover:bg-primary/90">Cerrar</button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default EwelinkPanel;
