'use client';

import React, { useState, useCallback, useEffect } from 'react';
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

    return (
        <div className="h-screen flex font-sans overflow-hidden bg-background text-foreground">
            <AdminSidebar expanded={sidebarExpanded} onToggle={toggleSidebar} />

            <main className="flex-1 flex flex-col min-w-0 relative overflow-hidden">
                <AnimatePresence mode="wait">
                    <motion.div
                        key="content"
                        initial={hydrated ? { opacity: 0, x: 12 } : false}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
                        className="flex-1 flex flex-col overflow-hidden"
                    >
                        {children}
                    </motion.div>
                </AnimatePresence>
            </main>
        </div>
    );
}
