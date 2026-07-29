'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Wifi, Eye, EyeOff } from 'lucide-react';

interface WifiWidgetProps {
    data: {
        ssid?: string;
        password?: string;
        title?: string;
        encryption?: 'WPA' | 'WEP' | 'nopass';
        hidden?: boolean;
        theme?: 'dark' | 'light' | 'glass';
        accentColor?: string;
        showPassword?: boolean;
    };
}

// Build the standard Wi-Fi QR payload (RFC 5931 friendly):
// WIFI:T:WPA;S:<ssid>;P:<pass>;H:<true|false>;;
function buildWifiPayload(ssid: string, password: string, enc: string, hidden: boolean): string {
    const esc = (s: string) => (s || '').replace(/([\\;,":])/g, '\\$1');
    const type = enc === 'nopass' ? 'nopass' : (enc || 'WPA');
    return `WIFI:T:${type};S:${esc(ssid)};P:${type === 'nopass' ? '' : esc(password)};${hidden ? 'H:true;' : ''};`;
}

const WifiWidget: React.FC<WifiWidgetProps> = ({ data }) => {
    const [showPass, setShowPass] = React.useState(!!data.showPassword);
    const ssid = data.ssid || 'MyHotel-WiFi';
    const password = data.password || '';
    const enc = data.encryption || 'WPA';
    const hidden = !!data.hidden;
    const theme = data.theme || 'glass';
    const accent = data.accentColor || '#3b82f6';
    const title = data.title || 'Wi-Fi Gratis';

    const wifiPayload = buildWifiPayload(ssid, password, enc, hidden);
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=480x480&margin=2&data=${encodeURIComponent(wifiPayload)}`;

    const bgClass = theme === 'dark'
        ? 'bg-black text-white'
        : theme === 'light'
            ? 'bg-white text-black'
            : 'bg-white/5 text-white backdrop-blur-md';

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
            className={"w-full h-full rounded-2xl border border-white/10 p-6 flex flex-col items-center justify-center gap-4 shadow-2xl " + bgClass}
        >
            {/* Title */}
            <div className="flex items-center gap-3">
                <div className="size-11 rounded-xl grid place-items-center" style={{ background: accent + '22', color: accent }}>
                    <Wifi className="size-6" />
                </div>
                <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tight">{title}</h2>
            </div>

            {/* QR */}
            <div className="rounded-xl bg-white p-3 shadow-2xl">
                <img src={qrUrl} alt="Wi-Fi QR" className="block w-40 h-40 md:w-56 md:h-56" />
            </div>

            {/* Credentials */}
            <div className="w-full max-w-xs space-y-2">
                <div>
                    <div className="text-[10px] uppercase tracking-widest opacity-60 font-bold mb-1">Red</div>
                    <div className="rounded-md border border-current/20 bg-current/5 px-3 py-2 text-lg font-bold font-mono tracking-wide truncate">
                        {ssid}
                    </div>
                </div>
                {enc !== 'nopass' && (
                    <div>
                        <div className="text-[10px] uppercase tracking-widest opacity-60 font-bold mb-1 flex items-center justify-between">
                            Contraseña
                            <button onClick={() => setShowPass(v => !v)} className="opacity-60 hover:opacity-100" title={showPass ? 'Ocultar' : 'Mostrar'}>
                                {showPass ? <EyeOff className="size-3" /> : <Eye className="size-3" />}
                            </button>
                        </div>
                        <div className="rounded-md border border-current/20 bg-current/5 px-3 py-2 text-lg font-bold font-mono tracking-wide truncate select-all">
                            {showPass ? password : '•'.repeat(Math.min(password.length, 12))}
                        </div>
                    </div>
                )}
            </div>

            <p className="text-[10px] uppercase tracking-widest opacity-50 mt-1">Escaneá el QR con la cámara</p>
        </motion.div>
    );
};

export default WifiWidget;
