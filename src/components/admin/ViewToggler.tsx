'use client';

import { LayoutGrid, List } from 'lucide-react';

interface ViewTogglerProps {
    viewMode: 'grid' | 'table';
    setViewMode: (mode: 'grid' | 'table') => void;
}

export function ViewToggler({ viewMode, setViewMode }: ViewTogglerProps) {
    return (
        <div className="flex bg-[#111] border border-white/10 rounded-lg p-1">
            <button
                onClick={() => setViewMode('grid')}
                title="Vista Cuadrícula"
                className={`p-2 rounded-md transition-all ${viewMode === 'grid' ? 'bg-white/10 text-white shadow-sm' : 'text-neutral-500 hover:text-white'}`}
            >
                <LayoutGrid className="w-4 h-4" />
            </button>
            <button
                onClick={() => setViewMode('table')}
                title="Vista Lista"
                className={`p-2 rounded-md transition-all ${viewMode === 'table' ? 'bg-white/10 text-white shadow-sm' : 'text-neutral-500 hover:text-white'}`}
            >
                <List className="w-4 h-4" />
            </button>
        </div>
    );
}
