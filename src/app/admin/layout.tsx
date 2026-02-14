'use client';

import React from 'react';
import { AdminSidebar } from '@/components/admin/Sidebar';
import { motion, AnimatePresence } from 'framer-motion';

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="h-screen bg-[#050505] text-neutral-100 flex font-sans selection:bg-blue-500/30 overflow-hidden">
            <AdminSidebar />

            <main className="flex-1 flex flex-col min-w-0 relative overflow-hidden">
                <AnimatePresence mode="wait">
                    <motion.div
                        key="content"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                        className="flex-1 flex flex-col overflow-hidden"
                    >
                        {children}
                    </motion.div>
                </AnimatePresence>
            </main>
        </div>
    );
}
