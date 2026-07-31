'use client';

import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { MediaLibrary } from '@/components/admin/MediaLibrary';
import { MediaItem } from '@/lib/mediaHelpers';

export interface MediaPickerProps {
    open: boolean;
    onClose: () => void;
    onSelect: (item: MediaItem) => void;
    lockType?: 'image' | 'video';
    title?: string;
}

/**
 * Modal para elegir un archivo desde la biblioteca (o subir uno nuevo).
 * Se cierra automáticamente al seleccionar.
 */
export const MediaPicker: React.FC<MediaPickerProps> = ({ open, onClose, onSelect, lockType, title }) => {
    return (
        <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
            <DialogContent className="max-w-5xl h-[80vh] p-0 flex flex-col">
                <DialogHeader className="px-4 pt-4 pb-2">
                    <DialogTitle>{title || (lockType === 'video' ? 'Elegir video' : lockType === 'image' ? 'Elegir imagen' : 'Elegir archivo')}</DialogTitle>
                </DialogHeader>
                <div className="flex-1 min-h-0 overflow-hidden">
                    <MediaLibrary
                        lockType={lockType}
                        onSelect={(it) => { onSelect(it); onClose(); }}
                    />
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default MediaPicker;
