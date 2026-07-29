'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Lock from 'lucide-react/dist/esm/icons/lock';
import Mail from 'lucide-react/dist/esm/icons/mail';
import Loader2 from 'lucide-react/dist/esm/icons/loader-2';
import ArrowRight from 'lucide-react/dist/esm/icons/arrow-right';
import AlertCircle from 'lucide-react/dist/esm/icons/alert-circle';
import { ThemeToggle } from '@/components/theme/ThemeToggle';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [mounted, setMounted] = useState(false);
    const router = useRouter();

    useEffect(() => {
        setMounted(true);
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });

            if (res.ok) {
                router.push('/admin');
                router.refresh();
            } else {
                const data = await res.json();
                setError(data.error || 'No pudimos iniciar sesión. Verificá tus credenciales.');
            }
        } catch (err) {
            setError('Ocurrió un error. Intentá nuevamente.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div
            className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
            style={{ background: 'var(--pf-bg)', color: 'var(--pf-fg)' }}
        >
            {/* Decorative gradient orbs */}
            <div
                aria-hidden
                className="pointer-events-none absolute -top-32 -left-32 w-[420px] h-[420px] rounded-full blur-3xl opacity-30"
                style={{ background: 'radial-gradient(closest-side, var(--pf-primary), transparent)' }}
            />
            <div
                aria-hidden
                className="pointer-events-none absolute -bottom-40 -right-32 w-[480px] h-[480px] rounded-full blur-3xl opacity-25"
                style={{ background: 'radial-gradient(closest-side, #8b5cf6, transparent)' }}
            />

            {/* Theme toggle */}
            <div className="absolute top-4 right-4 z-10">
                <ThemeToggle />
            </div>

            <motion.div
                initial={mounted ? { opacity: 0, y: 16 } : false}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                className="w-full max-w-md relative z-1"
            >
                <div
                    className="rounded-2xl border overflow-hidden glass-panel"
                    style={{ borderColor: 'var(--pf-border-strong)', boxShadow: 'var(--shadow-lg)' }}
                >
                    <div className="p-8">
                        <div className="flex flex-col items-center mb-8">
                            <div
                                className="w-12 h-12 rounded-xl flex items-center justify-center font-bold text-white text-base mb-4 shrink-0"
                                style={{
                                    background: 'linear-gradient(135deg, var(--pf-primary), #8b5cf6)',
                                    boxShadow: '0 12px 32px -8px rgba(99,102,241,0.55)',
                                }}
                            >
                                PF
                            </div>
                            <h1 className="font-heading text-[28px] font-bold tracking-tight text-center">
                                PixelFlow Studio
                            </h1>
                            <p
                                className="text-[13px] mt-1.5 text-center"
                                style={{ color: 'var(--pf-fg-muted)' }}
                            >
                                Iniciá sesión para acceder al panel
                            </p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-5">
                            {error && (
                                <motion.div
                                    initial={{ opacity: 0, y: -6 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="flex items-start gap-2 px-3.5 py-2.5 rounded-lg text-[13px]"
                                    style={{
                                        background: 'color-mix(in srgb, var(--pf-danger) 10%, transparent)',
                                        border: '1px solid color-mix(in srgb, var(--pf-danger) 28%, transparent)',
                                        color: 'var(--pf-danger)',
                                    }}
                                >
                                    <AlertCircle className="shrink-0 mt-0.5" size={16} />
                                    <span>{error}</span>
                                </motion.div>
                            )}

                            <Field icon={Mail} label="Email" htmlFor="login-email">
                                <input
                                    id="login-email"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="tu@empresa.com"
                                    autoComplete="email"
                                    autoFocus
                                    required
                                    className="w-full h-11 pl-10 pr-3 text-[14px] rounded-lg outline-none transition-colors"
                                    style={{
                                        background: 'var(--pf-bg-input)',
                                        color: 'var(--pf-fg)',
                                        border: '1px solid var(--pf-border)',
                                    }}
                                />
                            </Field>

                            <Field icon={Lock} label="Contraseña" htmlFor="login-password">
                                <input
                                    id="login-password"
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    autoComplete="current-password"
                                    required
                                    className="w-full h-11 pl-10 pr-3 text-[14px] rounded-lg outline-none transition-colors"
                                    style={{
                                        background: 'var(--pf-bg-input)',
                                        color: 'var(--pf-fg)',
                                        border: '1px solid var(--pf-border)',
                                    }}
                                />
                            </Field>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full h-11 rounded-lg font-medium text-[14px] flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
                                style={{
                                    background: 'var(--pf-primary)',
                                    color: 'var(--pf-primary-fg)',
                                    boxShadow: '0 8px 20px -8px color-mix(in srgb, var(--pf-primary) 60%, transparent)',
                                }}
                            >
                                {loading ? (
                                    <>
                                        <Loader2 size={16} className="animate-spin" />
                                        Iniciando sesión…
                                    </>
                                ) : (
                                    <>
                                        Iniciar sesión
                                        <ArrowRight size={16} />
                                    </>
                                )}
                            </button>
                        </form>
                    </div>

                    <div
                        className="px-8 py-4 border-t text-center"
                        style={{ borderColor: 'var(--pf-border)' }}
                    >
                        <p
                            className="text-[11px] font-medium uppercase tracking-[0.18em]"
                            style={{ color: 'var(--pf-fg-subtle)' }}
                        >
                            PixelFlow · Digital Signage Platform · {new Date().getFullYear()}
                        </p>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}

interface FieldProps {
    icon: React.ElementType;
    label: string;
    htmlFor: string;
    children: React.ReactNode;
}

const Field: React.FC<FieldProps> = ({ icon: Icon, label, htmlFor, children }) => (
    <div className="space-y-1.5">
        <label
            htmlFor={htmlFor}
            className="text-[12px] font-semibold uppercase tracking-[0.14em] block"
            style={{ color: 'var(--pf-fg-muted)' }}
        >
            {label}
        </label>
        <div className="relative group">
            <div
                className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none"
                style={{ color: 'var(--pf-fg-subtle)' }}
            >
                <Icon size={16} className="group-focus-within:text-[var(--pf-primary)] transition-colors" />
            </div>
            {children}
        </div>
    </div>
);
