'use client';

import React from 'react';

interface UseEditorShortcutsOptions {
    selectedId: string | null;
    onNudge: (dx: number, dy: number) => void;
    onDelete: () => void;
    onDuplicate: () => void;
    onUndo: () => void;
    onRedo: () => void;
    onBringForward: () => void;
    onSendBackward: () => void;
    onDeselect: () => void;
    /** Disable all shortcuts (useful when an input is focused or a modal open) */
    disabled?: boolean;
}

/**
 * Global keyboard shortcuts for the editor.
 *  - Arrow keys      → nudge selected widget (1% / 5% with Shift)
 *  - Delete/Backspace→ remove selected
 *  - Cmd/Ctrl+D      → duplicate selected
 *  - Cmd/Ctrl+Z      → undo
 *  - Cmd/Ctrl+Shift+Z or Cmd/Ctrl+Y → redo
 *  - Cmd/Ctrl+]      → bring forward
 *  - Cmd/Ctrl+[      → send backward
 *  - Esc             → deselect
 *
 * Shortcuts auto-disable while focus is in an input/textarea/contenteditable.
 */
export function useEditorShortcuts({
    selectedId,
    onNudge,
    onDelete,
    onDuplicate,
    onUndo,
    onRedo,
    onBringForward,
    onSendBackward,
    onDeselect,
    disabled = false,
}: UseEditorShortcutsOptions) {
    React.useEffect(() => {
        if (disabled) return;

        const isTypingTarget = (target: EventTarget | null): boolean => {
            const el = target as HTMLElement | null;
            if (!el) return false;
            const tag = el.tagName;
            if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true;
            if ((el as HTMLElement).isContentEditable) return true;
            return false;
        };

        const handler = (e: KeyboardEvent) => {
            if (isTypingTarget(e.target)) return;
            const meta = e.metaKey || e.ctrlKey;

            // Undo/Redo (work even without selection)
            if (meta && !e.shiftKey && (e.key === 'z' || e.key === 'Z')) {
                e.preventDefault(); onUndo(); return;
            }
            if (meta && (e.key === 'y' || e.key === 'Y' || ((e.key === 'z' || e.key === 'Z') && e.shiftKey))) {
                e.preventDefault(); onRedo(); return;
            }

            // Esc (works without selection too)
            if (e.key === 'Escape') {
                e.preventDefault(); onDeselect(); return;
            }

            // The rest require a selection
            if (!selectedId) return;

            switch (e.key) {
                case 'ArrowUp':
                    e.preventDefault(); onNudge(0, e.shiftKey ? -5 : -1); return;
                case 'ArrowDown':
                    e.preventDefault(); onNudge(0, e.shiftKey ? 5 : 1); return;
                case 'ArrowLeft':
                    e.preventDefault(); onNudge(e.shiftKey ? -5 : -1, 0); return;
                case 'ArrowRight':
                    e.preventDefault(); onNudge(e.shiftKey ? 5 : 1, 0); return;
                case 'Delete':
                case 'Backspace':
                    e.preventDefault(); onDelete(); return;
            }

            if (meta && (e.key === 'd' || e.key === 'D')) {
                e.preventDefault(); onDuplicate(); return;
            }
            if (meta && e.key === ']') {
                e.preventDefault(); onBringForward(); return;
            }
            if (meta && e.key === '[') {
                e.preventDefault(); onSendBackward(); return;
            }
        };

        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [
        selectedId,
        onNudge,
        onDelete,
        onDuplicate,
        onUndo,
        onRedo,
        onBringForward,
        onSendBackward,
        onDeselect,
        disabled,
    ]);
}
