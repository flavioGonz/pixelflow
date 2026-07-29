'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Music, ExternalLink, CheckCircle2, XCircle, Loader2, LogOut, ArrowLeft } from 'lucide-react';

interface SpotifySettings {
    clientId?: string;
    clientSecret?: string;
    redirectUri?: string;
    scope?: string;
    connected?: boolean;
    userDisplayName?: string;
    userProfileUrl?: string;
    lastAuthAt?: string;
    lastError?: string;
}

function SpotifyInner() {
    const [cfg, setCfg] = useState<SpotifySettings>({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [connecting, setConnecting] = useState(false);
    const params = useSearchParams();

    useEffect(() => {
        fetch('/api/spotify/settings')
            .then(r => r.json())
            .then(data => { setCfg(data); setLoading(false); })
            .catch(e => { console.error(e); setLoading(false); });
    }, []);

    useEffect(() => {
        if (params.get('connected') === '1') toast.success('Spotify conectado');
        const err = params.get('error');
        if (err) toast.error('Error: ' + err);
    }, [params]);

    const save = async () => {
        setSaving(true);
        try {
            const res = await fetch('/api/spotify/settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(cfg),
            });
            if (!res.ok) throw new Error('save failed');
            toast.success('Configuración guardada');
        } catch (e: any) { toast.error(e.message || 'Error'); }
        finally { setSaving(false); }
    };

    const connect = async () => {
        setConnecting(true);
        try {
            const res = await fetch('/api/spotify/auth-url');
            const data = await res.json();
            if (data.url) window.location.href = data.url;
            else toast.error(data.error || 'No se pudo generar el URL');
        } catch (e: any) { toast.error(e.message); }
        finally { setConnecting(false); }
    };

    const disconnect = async () => {
        if (!confirm('¿Desconectar la cuenta de Spotify?')) return;
        await fetch('/api/spotify/disconnect', { method: 'POST' });
        setCfg(prev => ({ ...prev, connected: false, userDisplayName: '', userProfileUrl: '' }));
        toast.success('Desconectado');
    };

    if (loading) return <div className="p-8 grid place-items-center"><Loader2 className="animate-spin size-8 text-primary" /></div>;

    return (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="max-w-3xl mx-auto p-6 space-y-6">
            <div className="flex items-center gap-3">
                <Link href="/admin/settings" className="text-muted-foreground hover:text-foreground transition-colors">
                    <ArrowLeft className="size-4" />
                </Link>
                <div className="size-11 rounded-xl grid place-items-center bg-emerald-500/10 text-emerald-500 ring-1 ring-emerald-500/20">
                    <Music className="size-5" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Spotify</h1>
                    <p className="text-sm text-muted-foreground">Integración OAuth para el widget de Música.</p>
                </div>
                <div className="ml-auto">
                    {cfg.connected
                        ? <Badge variant="secondary" className="gap-1.5"><CheckCircle2 className="size-3 text-emerald-500" />Conectado {cfg.userDisplayName && `· ${cfg.userDisplayName}`}</Badge>
                        : <Badge variant="outline" className="gap-1.5"><XCircle className="size-3 text-muted-foreground" />No conectado</Badge>}
                </div>
            </div>

            <Alert>
                <AlertDescription className="text-[13px]">
                    Registrá una aplicación en <a href="https://developer.spotify.com/dashboard" target="_blank" rel="noreferrer" className="underline text-primary">developer.spotify.com/dashboard</a>, copiá el <b>Client ID</b> y <b>Client Secret</b>, y agregá el redirect URI abajo a la lista de <em>Redirect URIs</em> de la app.
                </AlertDescription>
            </Alert>

            <Card>
                <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                        Credenciales de la app
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                            <Label className="text-[12px]">Client ID</Label>
                            <Input value={cfg.clientId || ''} onChange={(e) => setCfg({ ...cfg, clientId: e.target.value })} placeholder="32 chars" className="h-9 font-mono text-xs" />
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-[12px]">Client Secret</Label>
                            <Input type="password" value={cfg.clientSecret || ''} onChange={(e) => setCfg({ ...cfg, clientSecret: e.target.value })} placeholder={cfg.clientSecret === '••••••••' ? '(guardado)' : 'secret'} className="h-9 font-mono text-xs" />
                        </div>
                    </div>
                    <div className="space-y-1.5">
                        <Label className="text-[12px]">Redirect URI</Label>
                        <Input value={cfg.redirectUri || ''} onChange={(e) => setCfg({ ...cfg, redirectUri: e.target.value })} placeholder="https://tu-dominio/api/spotify/callback" className="h-9 font-mono text-xs" />
                        <p className="text-[11px] text-muted-foreground">Este URL debe estar registrado exactamente igual en el dashboard de Spotify.</p>
                    </div>
                    <div className="space-y-1.5">
                        <Label className="text-[12px]">Scope</Label>
                        <Input value={cfg.scope || ''} onChange={(e) => setCfg({ ...cfg, scope: e.target.value })} placeholder="user-read-currently-playing playlist-read-private" className="h-9 font-mono text-xs" />
                    </div>
                    <div className="flex justify-end gap-2 pt-2 border-t">
                        <Button onClick={save} disabled={saving} size="sm">
                            {saving && <Loader2 className="animate-spin size-3.5" />} Guardar
                        </Button>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">Autorización</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                    {cfg.connected ? (
                        <div className="rounded-md border bg-emerald-500/5 border-emerald-500/30 p-4 flex items-center gap-3">
                            <CheckCircle2 className="size-5 text-emerald-500" />
                            <div className="flex-1">
                                <div className="text-[13px] font-semibold">Cuenta conectada</div>
                                <div className="text-[11px] text-muted-foreground">
                                    {cfg.userDisplayName || 'Usuario'} · última autorización {cfg.lastAuthAt ? new Date(cfg.lastAuthAt).toLocaleString() : '—'}
                                </div>
                            </div>
                            {cfg.userProfileUrl && (
                                <a href={cfg.userProfileUrl} target="_blank" rel="noreferrer" className="text-xs text-primary hover:underline flex items-center gap-1">
                                    Ver perfil <ExternalLink className="size-3" />
                                </a>
                            )}
                            <Button onClick={disconnect} variant="outline" size="sm" className="gap-1.5">
                                <LogOut className="size-3.5" /> Desconectar
                            </Button>
                        </div>
                    ) : (
                        <div className="rounded-md border bg-muted/30 p-4 space-y-3">
                            <p className="text-[13px]">Configurá primero las credenciales, después conectá una cuenta de Spotify.</p>
                            <Button onClick={connect} disabled={connecting || !cfg.clientId || !cfg.redirectUri} className="gap-2">
                                {connecting ? <Loader2 className="animate-spin size-4" /> : <Music className="size-4" />}
                                Conectar cuenta de Spotify
                            </Button>
                            {(!cfg.clientId || !cfg.redirectUri) && (
                                <p className="text-[11px] text-amber-600">Guardá Client ID y Redirect URI primero.</p>
                            )}
                        </div>
                    )}
                    {cfg.lastError && (
                        <div className="rounded-md border bg-destructive/5 border-destructive/30 p-3 text-[12px] text-destructive">
                            Último error: {cfg.lastError}
                        </div>
                    )}
                </CardContent>
            </Card>
        </motion.div>
    );
}

export default function SpotifySettingsPage() {
    return (
        <Suspense fallback={<div className="p-8" />}>
            <SpotifyInner />
        </Suspense>
    );
}
