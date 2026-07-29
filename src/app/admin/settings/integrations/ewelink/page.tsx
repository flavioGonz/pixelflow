'use client';

import React, { Suspense } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowLeft, Radio } from 'lucide-react';
import { EwelinkPanel } from '@/components/admin/EwelinkPanel';

function EwelinkInner() {
    return (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <div className="flex items-center gap-3">
                <Link href="/admin/settings/integrations" className="text-muted-foreground hover:text-foreground transition-colors">
                    <ArrowLeft className="size-4" />
                </Link>
                <div className="size-11 rounded-xl grid place-items-center bg-sky-500/10 text-sky-500 ring-1 ring-sky-500/20">
                    <Radio className="size-5" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">eWeLink Sonoff</h1>
                    <p className="text-sm text-muted-foreground">Autoriza tu cuenta de eWeLink (OAuth2) para leer sensores en el dashboard.</p>
                </div>
            </div>

            <EwelinkPanel onCreateSensor={() => {
                if (typeof window !== 'undefined') window.location.href = '/admin/sensors';
            }} />
        </motion.div>
    );
}

export default function EwelinkSettingsPage() {
    return (
        <Suspense fallback={<div className="p-8" />}>
            <EwelinkInner />
        </Suspense>
    );
}
