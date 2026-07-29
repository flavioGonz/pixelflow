'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { motion, AnimatePresence } from 'framer-motion';

const SIDEBAR_STATE_KEY = 'pf:sidebar-expanded';

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const [sidebarExpanded, setSidebarExpanded] = useState(false);
    const [hydrated, setHydrated] = useState(false);
    const pathname = usePathname();

    useEffect(() => {
        try {
            const v = localStorage.getItem(SIDEBAR_STATE_KEY);
            if (v === '1') setSidebarExpanded(true);
        } catch { /* ignore */ }
        setHydrated(true);
    }, []);

    const toggleSidebar = useCallback(() => {
        setSidebarExpanded((prev) => {
            const next = !prev;
            try { localStorage.setItem(SIDEBAR_STATE_KEY, next ? '1' : '0'); } catch { /* ignore */ }
            return next;
        });
    }, []);

    // Special-case Studio so the editor doesn't get exit/enter animation on save reloads.
    // Also disable transition on the editor since its own children have heavy animations.
    const isStudio = pathname === '/admin';

    return (
        <div className="h-screen flex font-sans overflow-hidden bg-background text-foreground">
            <AdminSidebar expanded={sidebarExpanded} onToggle={toggleSidebar} />

            <main className="flex-1 flex flex-col min-w-0 relative overflow-hidden">
                <AnimatePresence mode="wait" initial={false}>
                    <motion.div
                        key={pathname}
                        initial={hydrated && !isStudio ? { opacity: 0, y: 8, filter: 'blur(6px)' } : false}
                        animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                        exit={hydrated && !isStudio ? { opacity: 0, y: -6, filter: 'blur(4px)' } : undefined}
                        transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
                        className="flex-1 flex flex-col overflow-hidden"
                    >
                        {children}
                    </motion.div>
                </AnimatePresence>
            </main>
        </div>
    );
}
