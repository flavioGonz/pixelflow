'use client';

import { useCallback, useRef, useState } from 'react';

/**
 * Generic undo/redo history hook for any JSON-serializable state.
 *
 * Usage:
 *   const { state, set, commit, undo, redo, canUndo, canRedo } = useEditorHistory(initialState);
 *
 *   - `state`         current value
 *   - `set(next, opts?)`  replaces state. By default it pushes a history entry (commit).
 *                          Pass `{ skipHistory: true }` for transient updates (e.g. during drag);
 *                          call `commit()` once you settle to push that final value into history.
 *   - `commit()`      manually push the CURRENT state into the past stack (used at drag end)
 *   - `reset(next)`   wipes history and starts fresh (used when loading a new layout)
 *   - `undo() / redo()`
 *   - `canUndo / canRedo`
 *
 * Notes:
 *   - We do shallow deep-clone via JSON to avoid reference sharing across history entries.
 *   - Limit defaults to 50 entries (configurable).
 */
export interface UseEditorHistory<T> {
    state: T;
    set: (updater: T | ((prev: T) => T), opts?: { skipHistory?: boolean }) => void;
    commit: () => void;
    reset: (next: T) => void;
    undo: () => void;
    redo: () => void;
    canUndo: boolean;
    canRedo: boolean;
}

export function useEditorHistory<T>(initial: T, limit = 50): UseEditorHistory<T> {
    // Deep clone helper (works fine for plain JSON state — widgets/bg)
    const clone = (v: T): T => JSON.parse(JSON.stringify(v));

    const [state, setStateInternal] = useState<T>(initial);
    const pastRef = useRef<T[]>([]);
    const futureRef = useRef<T[]>([]);
    const lastCommittedRef = useRef<T>(clone(initial));
    const [, force] = useState(0);

    const set = useCallback(
        (updater: T | ((prev: T) => T), opts?: { skipHistory?: boolean }) => {
            setStateInternal((prev) => {
                const next = typeof updater === 'function' ? (updater as (p: T) => T)(prev) : updater;

                if (!opts?.skipHistory) {
                    // Push previous (the last committed snapshot) into past stack
                    pastRef.current = [...pastRef.current, lastCommittedRef.current].slice(-limit);
                    futureRef.current = []; // wipe redo when a new action happens
                    lastCommittedRef.current = clone(next);
                }
                return next;
            });
            if (!opts?.skipHistory) force((n) => n + 1);
        },
        [limit]
    );

    const commit = useCallback(() => {
        setStateInternal((prev) => {
            // If state is unchanged since lastCommitted, no-op
            const prevSerialized = JSON.stringify(prev);
            const lastSerialized = JSON.stringify(lastCommittedRef.current);
            if (prevSerialized === lastSerialized) return prev;
            pastRef.current = [...pastRef.current, lastCommittedRef.current].slice(-limit);
            futureRef.current = [];
            lastCommittedRef.current = clone(prev);
            return prev;
        });
        force((n) => n + 1);
    }, [limit]);

    const reset = useCallback((next: T) => {
        pastRef.current = [];
        futureRef.current = [];
        lastCommittedRef.current = clone(next);
        setStateInternal(next);
        force((n) => n + 1);
    }, []);

    const undo = useCallback(() => {
        if (pastRef.current.length === 0) return;
        const previous = pastRef.current[pastRef.current.length - 1];
        pastRef.current = pastRef.current.slice(0, -1);
        setStateInternal((current) => {
            futureRef.current = [current, ...futureRef.current].slice(0, limit);
            lastCommittedRef.current = clone(previous);
            return clone(previous);
        });
        force((n) => n + 1);
    }, [limit]);

    const redo = useCallback(() => {
        if (futureRef.current.length === 0) return;
        const next = futureRef.current[0];
        futureRef.current = futureRef.current.slice(1);
        setStateInternal((current) => {
            pastRef.current = [...pastRef.current, current].slice(-limit);
            lastCommittedRef.current = clone(next);
            return clone(next);
        });
        force((n) => n + 1);
    }, [limit]);

    return {
        state,
        set,
        commit,
        reset,
        undo,
        redo,
        canUndo: pastRef.current.length > 0,
        canRedo: futureRef.current.length > 0,
    };
}
