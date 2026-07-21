'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';

type Theme = 'dark' | 'light';
type ThemeMode = Theme | 'system';

interface ThemeContextValue {
    theme: Theme;
    mode: ThemeMode;
    setMode: (m: ThemeMode) => void;
    toggle: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

const STORAGE_KEY = 'pf:theme-mode';

function resolveTheme(mode: ThemeMode): Theme {
    if (mode === 'system') {
        if (typeof window === 'undefined') return 'light';
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return mode;
}

function applyTheme(theme: Theme) {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;

    root.classList.add('pf-theme-transition');
    if (theme === 'dark') {
        root.classList.add('dark');
    } else {
        root.classList.remove('dark');
    }
    // Always remove any stale .light remnant from old code
    root.classList.remove('light');
    window.setTimeout(() => root.classList.remove('pf-theme-transition'), 300);
}

export const ThemeProvider: React.FC<{ children: React.ReactNode; defaultMode?: ThemeMode }> = ({
    children,
    defaultMode = 'light',
}) => {
    const [mode, setModeState] = useState<ThemeMode>(defaultMode);
    const [theme, setTheme] = useState<Theme>('light');

    useEffect(() => {
        const stored = (typeof window !== 'undefined' && (localStorage.getItem(STORAGE_KEY) as ThemeMode | null)) || null;
        const initial: ThemeMode = stored ?? defaultMode;
        setModeState(initial);
        const resolved = resolveTheme(initial);
        setTheme(resolved);
        applyTheme(resolved);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        if (mode !== 'system' || typeof window === 'undefined') return;
        const mq = window.matchMedia('(prefers-color-scheme: dark)');
        const handler = () => {
            const resolved = resolveTheme('system');
            setTheme(resolved);
            applyTheme(resolved);
        };
        mq.addEventListener('change', handler);
        return () => mq.removeEventListener('change', handler);
    }, [mode]);

    const setMode = useCallback((m: ThemeMode) => {
        setModeState(m);
        try { localStorage.setItem(STORAGE_KEY, m); } catch { /* ignore */ }
        const resolved = resolveTheme(m);
        setTheme(resolved);
        applyTheme(resolved);
    }, []);

    const toggle = useCallback(() => {
        const next: Theme = theme === 'dark' ? 'light' : 'dark';
        setMode(next);
    }, [theme, setMode]);

    return (
        <ThemeContext.Provider value={{ theme, mode, setMode, toggle }}>
            {children}
        </ThemeContext.Provider>
    );
};

export function useTheme(): ThemeContextValue {
    const ctx = useContext(ThemeContext);
    if (!ctx) {
        return {
            theme: 'light',
            mode: 'light',
            setMode: () => {},
            toggle: () => {},
        };
    }
    return ctx;
}

/**
 * Inline script that sets the initial theme class BEFORE first paint.
 * Default is light (no class). "dark" class is added when needed.
 */
export const ThemeScript: React.FC<{ defaultMode?: ThemeMode }> = ({ defaultMode = 'light' }) => {
    const code = "(function(){try{var stored=localStorage.getItem('" + STORAGE_KEY + "');var mode=stored||'" + defaultMode + "';var resolved=mode==='system'?(window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'):mode;if(resolved==='dark')document.documentElement.classList.add('dark');document.documentElement.classList.remove('light');document.documentElement.style.colorScheme=resolved;}catch(e){}})();";
    return <script dangerouslySetInnerHTML={{ __html: code }} />;
};
