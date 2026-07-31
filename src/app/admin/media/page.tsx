'use client';

import React from 'react';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { MediaLibrary } from '@/components/admin/MediaLibrary';
import { Toaster } from 'sonner';
import ImageIcon from 'lucide-react/dist/esm/icons/image';

export default function MediaPage() {
    return (
        <div className="flex-1 flex flex-col min-h-0 bg-background text-foreground">
            <AdminHeader
                title="Biblioteca de archivos"
                subtitle="Todas las fotos y videos subidos al servidor. Elegilos desde acá al armar interfaces."
                icon={<ImageIcon className="size-5" />}
            />
            <div className="flex-1 min-h-0 overflow-hidden">
                <MediaLibrary />
            </div>
            <Toaster />
        </div>
    );
}
