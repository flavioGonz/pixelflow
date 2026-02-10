'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Cloud, Sun, CloudRain, CloudLightning, CloudSnow, CloudFog, Loader2 } from 'lucide-react';

interface WeatherData {
    temp: number;
    condition: string;
    description: string;
    humidity: number;
    windSpeed: number;
    icon: string;
}

interface WeatherWidgetProps {
    data: {
        city: string;
        autoUpdate?: boolean;
    };
}

const WeatherWidget: React.FC<WeatherWidgetProps> = ({ data }) => {
    const [weather, setWeather] = useState<WeatherData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchWeather = async () => {
        try {
            setLoading(true);
            const city = data.city || 'Buenos Aires';

            // 1. Geocoding (Free Nominatim API)
            const geoRes = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(city)}`, {
                headers: { 'User-Agent': 'PixelFlow/1.0' }
            });
            const geoData = await geoRes.json();

            if (!geoData || geoData.length === 0) {
                throw new Error('Ciudad no encontrada');
            }

            const { lat, lon } = geoData[0];

            // 2. Weather Data (Free Open-Meteo API)
            const weatherRes = await fetch(
                `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m&timezone=auto`
            );

            if (!weatherRes.ok) throw new Error('Servidor de clima no responde');

            const wData = await weatherRes.json();

            if (!wData.current) throw new Error('Datos de clima no disponibles');

            const current = wData.current;

            // Map WMO Weather Codes
            // Reference: https://open-meteo.com/en/docs
            const mapWMO = (code: number) => {
                if (code === 0) return { label: 'Despejado', icon: 'SUN', color: 'text-yellow-400' };
                if (code <= 3) return { label: 'Parcialmente Nublado', icon: 'CLOUD_SUN', color: 'text-blue-300' };
                if (code <= 48) return { label: 'Niebla', icon: 'FOG', color: 'text-gray-400' };
                if (code <= 55) return { label: 'Llovizna', icon: 'RAIN', color: 'text-blue-400' };
                if (code <= 65) return { label: 'Lluvia', icon: 'RAIN', color: 'text-blue-500' };
                if (code <= 77) return { label: 'Nieve', icon: 'SNOW', color: 'text-white' };
                if (code <= 82) return { label: 'Chubascos', icon: 'RAIN', color: 'text-blue-600' };
                if (code <= 99) return { label: 'Tormenta', icon: 'THUNDER', color: 'text-purple-500' };
                return { label: 'Variable', icon: 'SUN', color: 'text-yellow-400' };
            };

            const mapped = mapWMO(current.weather_code);

            setWeather({
                temp: Math.round(current.temperature_2m),
                condition: mapped.icon,
                description: mapped.label,
                humidity: current.relative_humidity_2m,
                windSpeed: Math.round(current.wind_speed_10m),
                icon: mapped.color
            });
            setError(null);
        } catch (err) {
            console.error('Weather Fetch Error:', err);
            setError('Error de conexión');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchWeather();
        // Update every 30 minutes if active
        const interval = setInterval(fetchWeather, 30 * 60 * 1000);
        return () => clearInterval(interval);
    }, [data.city]);

    const renderIcon = () => {
        const iconProps = { className: `w-20 h-20 ${weather?.icon || 'text-yellow-400'}` };

        const motionProps = {
            initial: { scale: 0.5, rotate: -20, opacity: 0 },
            animate: {
                scale: 1,
                rotate: 0,
                opacity: 1,
                y: [0, -10, 0]
            },
            transition: {
                y: { duration: 4, repeat: Infinity, ease: "easeInOut" },
                scale: { duration: 0.5, ease: "easeOut" }
            }
        };

        switch (weather?.condition) {
            case 'SUN':
                return (
                    <motion.div {...(motionProps as any)} animate={{ ...(motionProps.animate as any), rotate: 360 }} transition={{ rotate: { duration: 20, repeat: Infinity, ease: "linear" }, y: (motionProps.transition as any).y } as any}>
                        <Sun {...iconProps} className="w-20 h-20 text-amber-400 filter drop-shadow-[0_0_15px_rgba(251,191,36,0.5)]" />
                    </motion.div>
                );
            case 'CLOUD_SUN':
                return (
                    <motion.div {...(motionProps as any)} className="relative">
                        <Sun className="w-12 h-12 text-amber-400 absolute -top-2 -right-2 animate-pulse" />
                        <Cloud {...iconProps} className="w-20 h-20 text-neutral-300" />
                    </motion.div>
                );
            case 'RAIN':
                return (
                    <motion.div {...(motionProps as any)}>
                        <CloudRain {...iconProps} className="w-20 h-20 text-blue-400" />
                        <motion.div
                            animate={{ y: [0, 10, 0], opacity: [0, 1, 0] }}
                            transition={{ duration: 1, repeat: Infinity, delay: 0.2 }}
                            className="absolute bottom-0 left-1/2 -translate-x-1/2 text-blue-400 font-bold"
                        >
                            ...
                        </motion.div>
                    </motion.div>
                );
            case 'THUNDER':
                return (
                    <motion.div {...(motionProps as any)}>
                        <CloudLightning {...iconProps} className="w-20 h-20 text-purple-400 filter drop-shadow-[0_0_10px_rgba(168,85,247,0.5)]" />
                    </motion.div>
                );
            case 'SNOW':
                return (
                    <motion.div {...(motionProps as any)}>
                        <CloudSnow {...iconProps} className="w-20 h-20 text-white" />
                    </motion.div>
                );
            case 'FOG':
                return (
                    <motion.div {...(motionProps as any)}>
                        <CloudFog {...iconProps} className="w-20 h-20 text-neutral-400 opacity-80" />
                    </motion.div>
                );
            default:
                return (
                    <motion.div {...(motionProps as any)}>
                        <Sun {...iconProps} />
                    </motion.div>
                );
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="w-full h-full flex flex-col items-center justify-center p-6 md:p-10 relative overflow-hidden group"
        >
            <AnimatePresence mode="wait">
                {loading ? (
                    <motion.div
                        key="loader"
                        exit={{ opacity: 0 }}
                        className="flex flex-col items-center gap-4"
                    >
                        <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-white/30">Actualizando clima...</span>
                    </motion.div>
                ) : error ? (
                    <motion.div
                        key="error"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-center"
                    >
                        <p className="text-red-500 text-[10px] font-black uppercase mb-2">{error}</p>
                        <button onClick={() => fetchWeather()} className="text-[8px] bg-white/10 px-3 py-1 rounded-full uppercase font-bold">Reintentar</button>
                    </motion.div>
                ) : (
                    <motion.div
                        key="weather-content"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex flex-col items-center gap-0 w-full"
                    >
                        <div className="mt-8 mb-0 flex flex-col items-center gap-1">
                            {renderIcon()}
                            <div className="text-[11px] md:text-xs font-black text-white/40 uppercase tracking-[0.2em] italic text-center">
                                {weather?.description}
                            </div>
                        </div>

                        <div className="flex flex-col items-center">
                            <div className="text-7xl md:text-8xl font-black text-white tracking-tighter flex items-start group-hover:scale-105 transition-transform duration-500">
                                {weather?.temp}
                                <span className="text-3xl md:text-4xl text-blue-500 mt-4 leading-none font-mono">°C</span>
                            </div>
                        </div>

                        <footer className="mt-8 grid grid-cols-2 gap-8 w-full max-w-[200px]">
                            <div className="flex flex-col items-center">
                                <span className="text-[8px] font-black text-neutral-600 uppercase mb-1">Humedad</span>
                                <span className="text-xs font-black text-blue-400">{weather?.humidity}%</span>
                            </div>
                            <div className="flex flex-col items-center">
                                <span className="text-[8px] font-black text-neutral-600 uppercase mb-1">Viento</span>
                                <span className="text-xs font-black text-blue-400">{weather?.windSpeed} <span className="text-[8px]">km/h</span></span>
                            </div>
                        </footer>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

export default WeatherWidget;
