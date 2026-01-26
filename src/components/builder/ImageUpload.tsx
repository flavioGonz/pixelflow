'use client';

import React, { useState, useRef } from 'react';
import { Upload, ImageIcon, Loader2 } from 'lucide-react';

interface ImageUploadProps {
    onUploadSuccess: (url: string) => void;
    label?: string;
}

export function ImageUpload({ onUploadSuccess, label = "Subir Imagen" }: ImageUploadProps) {
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        const formData = new FormData();
        formData.append('image', file);

        try {
            const response = await fetch('/api/upload', {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) throw new Error('Upload failed');

            const data = await response.json();
            onUploadSuccess(data.url);
        } catch (error) {
            console.error('Error uploading image:', error);
            alert('Error al subir la imagen');
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="space-y-2">
            <label className="text-[9px] text-neutral-500 uppercase block tracking-widest font-bold">{label}</label>
            <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="w-full h-24 bg-neutral-900 border border-dashed border-white/10 rounded-xl flex flex-col items-center justify-center hover:bg-white/5 transition-all text-neutral-500 hover:text-white group"
            >
                {uploading ? (
                    <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
                ) : (
                    <>
                        <Upload className="w-5 h-5 mb-2 group-hover:scale-110 transition-transform" />
                        <span className="text-[10px] font-bold uppercase tracking-tighter">Click para subir</span>
                    </>
                )}
            </button>
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*,video/*"
                className="hidden"
            />
        </div>
    );
}
