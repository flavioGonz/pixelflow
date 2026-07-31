'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { LayoutJSON, WidgetType, WidgetConfig } from '@/store/usePlayerStore';
import {Plus, Trash2, Smartphone, Monitor, ShoppingBag, Utensils,
    Layout as LayoutIcon, Settings2, Maximize, Save, Layers,
    Database, RefreshCw, Eye, EyeOff, MousePointer2, Palette,
    ChevronRight, ChevronLeft, Zap, Globe, Image as ImageIcon, Sparkles, ArrowLeft, ArrowUp, ArrowDown, ChevronsUp, ChevronsDown, Copy, Network, Clock, Search,
    Megaphone, Instagram, PlaneTakeoff, Music, PanelLeftClose, PanelRightClose, PanelLeftOpen, PanelRightOpen,
    ChevronDown, Link as LinkIcon, Calendar, LogOut, Lock, Type, Info
, Radio, AlertCircle, ExternalLink, Play, Video} from 'lucide-react';
import { Canvas } from '@/components/builder/Canvas';
import { getDefaultData } from '@/lib/widgetDefaults';
import { SensorValuePanel } from '@/components/admin/widget-panels/SensorValuePanel';
import { NavButtonPanel } from '@/components/admin/widget-panels/NavButtonPanel';
import { RichTextEditor } from '@/components/builder/RichTextEditor';
import { ImageUpload } from '@/components/builder/ImageUpload';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { useEditorShortcuts } from '@/hooks/useEditorShortcuts';
import { WidgetPalette } from '@/components/builder/WidgetPalette';
import { CategoryItemsEditor } from '@/components/admin/CategoryItemsEditor';
import { MediaPicker } from '@/components/admin/MediaPicker';
import { CategoryNavPanel } from '@/components/admin/CategoryNavPanel';
import { FloatingToolbar } from '@/components/builder/FloatingToolbar';
import { StatusBar } from '@/components/builder/StatusBar';
import { FloatingRightDock } from '@/components/builder/FloatingRightDock';
import X from 'lucide-react/dist/esm/icons/x';
import { Toaster } from '@/components/ui/sonner';
import { toast } from 'sonner';
import { copyToClipboard } from '@/lib/clipboard';


let socket: Socket;

export default function AdminDashboardPage() {
    return (
        <React.Suspense fallback={<div className="flex-1 grid place-items-center text-muted-foreground">Cargando Studio…</div>}>
            <AdminDashboard />
        </React.Suspense>
    );
}

function AdminDashboard() {
    const [screenId, setScreenId] = useState('pantalla-1');
    const [layoutName, setLayoutName] = useState('Mi Primer Layout');
    const [widgets, setWidgets] = useState<WidgetConfig[]>([]);

    // ============ Undo / Redo ============
    const _undoStackRef = React.useRef<WidgetConfig[][]>([]);
    const _redoStackRef = React.useRef<WidgetConfig[][]>([]);
    const _lastPushedRef = React.useRef<string>('');
    const _suppressPushRef = React.useRef(false);
    // Push current widgets snapshot to undo stack whenever they change (except when we're doing undo/redo)
    React.useEffect(() => {
        if (_suppressPushRef.current) { _suppressPushRef.current = false; return; }
        const snap = JSON.stringify(widgets);
        if (snap === _lastPushedRef.current) return;
        if (_lastPushedRef.current) {
            _undoStackRef.current.push(JSON.parse(_lastPushedRef.current));
            if (_undoStackRef.current.length > 50) _undoStackRef.current.shift();
            _redoStackRef.current = []; // clear redo when new change happens
        }
        _lastPushedRef.current = snap;
    }, [widgets]);
    // Ctrl+Z / Ctrl+Y (or Cmd+Z / Cmd+Shift+Z) shortcuts
    React.useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            const mod = e.ctrlKey || e.metaKey;
            if (!mod) return;
            const key = e.key.toLowerCase();
            if (key === 'z' && !e.shiftKey) {
                if (_undoStackRef.current.length === 0) return;
                e.preventDefault();
                const prev = _undoStackRef.current.pop()!;
                _redoStackRef.current.push(JSON.parse(_lastPushedRef.current));
                _suppressPushRef.current = true;
                _lastPushedRef.current = JSON.stringify(prev);
                setWidgets(prev);
            } else if ((key === 'y') || (key === 'z' && e.shiftKey)) {
                if (_redoStackRef.current.length === 0) return;
                e.preventDefault();
                const next = _redoStackRef.current.pop()!;
                _undoStackRef.current.push(JSON.parse(_lastPushedRef.current));
                _suppressPushRef.current = true;
                _lastPushedRef.current = JSON.stringify(next);
                setWidgets(next);
            }
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, []);
    const [isConnected, setIsConnected] = useState(false);
    const [selectedWidgetId, setSelectedWidgetId] = useState<string | null>(null);
    const [orientation, setOrientation] = useState<'landscape' | 'portrait'>('landscape');
    const [resolution, setResolution] = useState<{ width: number; height: number }>({ width: 1920, height: 1080 });
    const [backgroundImage, setBackgroundImage] = useState('');
    const [backgroundVideo, setBackgroundVideo] = useState('');
    const [backgroundColor, setBackgroundColor] = useState('#ffffff');
    const [backgroundBlur, setBackgroundBlur] = useState(0);
    const [designWidth, setDesignWidth] = useState<number>(1920);
    const [designHeight, setDesignHeight] = useState<number>(1080);
    const [targetDPI, setTargetDPI] = useState<number>(96);
    const [backgroundOverlayColor, setBackgroundOverlayColor] = useState('#000000');
    const [backgroundOverlayOpacity, setBackgroundOverlayOpacity] = useState(0.5);
    const [backgroundPattern, setBackgroundPattern] = useState<'none' | 'dots' | 'grid' | 'waves' | 'noise'>('none');
    const [backgroundPatternOpacity, setBackgroundPatternOpacity] = useState(0.2);
    const [mediaPickerFor, setMediaPickerFor] = useState<null | 'bg-image' | 'bg-video'>(null);
    const [transitionType, setTransitionType] = useState<string>('dramatic');
    const [transitionDuration, setTransitionDuration] = useState<number>(0.7);
    const [editingLayoutId, setEditingLayoutId] = useState<string | null>(null);
    // Ref mirror so socket handlers (bound once) always see the CURRENT value.
    const editingLayoutIdRef = React.useRef<string | null>(null);
    React.useEffect(() => {
        editingLayoutIdRef.current = editingLayoutId;
        if (typeof window !== 'undefined') {
            if (editingLayoutId) localStorage.setItem('pixelflow_draft_editingId', editingLayoutId);
            else localStorage.removeItem('pixelflow_draft_editingId');
        }
    }, [editingLayoutId]);
    const [showResetConfirm, setShowResetConfirm] = useState(false);
    const [layoutToDelete, setLayoutToDelete] = useState<any>(null);
    const [leftSidebarOpen, setLeftSidebarOpen] = useState(true);
    const [rightSidebarOpen, setRightSidebarOpen] = useState(false);
    const [ctxMenu, setCtxMenu] = useState<{ x: number; y: number; visible: boolean }>({ x: 0, y: 0, visible: false });
    const [isDirty, setIsDirty] = useState(false);
    const [lastSavedAt, setLastSavedAt] = useState<number | null>(null);

    const router = useRouter();
    const searchParams = useSearchParams();
    const layoutIdParam = searchParams.get('id');

    // -------- Undo/Redo --------
    const historyPastRef = React.useRef<WidgetConfig[][]>([]);
    const historyFutureRef = React.useRef<WidgetConfig[][]>([]);
    const lastCommittedRef = React.useRef<WidgetConfig[]>([]);

    const commitHistory = useCallback(() => {
        const snap = JSON.parse(JSON.stringify(widgets));
        if (JSON.stringify(lastCommittedRef.current) === JSON.stringify(snap)) return;
        historyPastRef.current = [...historyPastRef.current, lastCommittedRef.current].slice(-50);
        historyFutureRef.current = [];
        lastCommittedRef.current = snap;
    }, [widgets]);

    const setWidgetsWithHistory = useCallback(
        (next: WidgetConfig[] | ((p: WidgetConfig[]) => WidgetConfig[]), opts?: { skipHistory?: boolean }) => {
            setWidgets((prev) => {
                const value = typeof next === 'function' ? (next as any)(prev) : next;
                if (!opts?.skipHistory) {
                    historyPastRef.current = [...historyPastRef.current, lastCommittedRef.current].slice(-50);
                    historyFutureRef.current = [];
                    lastCommittedRef.current = JSON.parse(JSON.stringify(value));
                }
                return value;
            });
        }, []);

    const undo = useCallback(() => {
        if (historyPastRef.current.length === 0) return;
        const previous = historyPastRef.current[historyPastRef.current.length - 1];
        historyPastRef.current = historyPastRef.current.slice(0, -1);
        setWidgets((current) => {
            historyFutureRef.current = [JSON.parse(JSON.stringify(current)), ...historyFutureRef.current].slice(0, 50);
            lastCommittedRef.current = JSON.parse(JSON.stringify(previous));
            return JSON.parse(JSON.stringify(previous));
        });
    }, []);

    const redo = useCallback(() => {
        if (historyFutureRef.current.length === 0) return;
        const next = historyFutureRef.current[0];
        historyFutureRef.current = historyFutureRef.current.slice(1);
        setWidgets((current) => {
            historyPastRef.current = [...historyPastRef.current, JSON.parse(JSON.stringify(current))].slice(-50);
            lastCommittedRef.current = JSON.parse(JSON.stringify(next));
            return JSON.parse(JSON.stringify(next));
        });
    }, []);

    React.useEffect(() => {
        if (lastCommittedRef.current.length === 0 && widgets.length > 0) {
            lastCommittedRef.current = JSON.parse(JSON.stringify(widgets));
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [widgets.length]);

    const nudge = useCallback((dx: number, dy: number) => {
        if (!selectedWidgetId) return;
        setWidgetsWithHistory((prev) => prev.map((w) => w.id === selectedWidgetId
            ? { ...w, x: Math.max(0, Math.min(100 - w.w, w.x + dx)), y: Math.max(0, Math.min(100 - w.h, w.y + dy)) } : w));
    }, [selectedWidgetId, setWidgetsWithHistory]);

    const deleteSelected = useCallback(() => {
        if (!selectedWidgetId) return;
        setWidgetsWithHistory((prev) => prev.filter((w) => w.id !== selectedWidgetId));
        setSelectedWidgetId(null);
    }, [selectedWidgetId, setWidgetsWithHistory]);

    const duplicateSelected = useCallback(() => {
        if (!selectedWidgetId) return;
        const src = widgets.find((w) => w.id === selectedWidgetId);
        if (!src) return;
        const copy: WidgetConfig = {
            ...JSON.parse(JSON.stringify(src)),
            id: 'w-' + Date.now() + '-' + Math.random().toString(36).slice(2, 8),
            x: Math.min(100 - src.w, src.x + 2),
            y: Math.min(100 - src.h, src.y + 2),
        };
        setWidgetsWithHistory((prev) => [...prev, copy]);
        setSelectedWidgetId(copy.id);
    }, [selectedWidgetId, widgets, setWidgetsWithHistory]);

    const bringForward = useCallback(() => {
        if (!selectedWidgetId) return;
        setWidgetsWithHistory((prev) => prev.map((w) => w.id === selectedWidgetId ? { ...w, zIndex: (w.zIndex || 1) + 1 } : w));
    }, [selectedWidgetId, setWidgetsWithHistory]);

    const sendBackward = useCallback(() => {
        if (!selectedWidgetId) return;
        setWidgetsWithHistory((prev) => prev.map((w) => w.id === selectedWidgetId ? { ...w, zIndex: Math.max(1, (w.zIndex || 1) - 1) } : w));
    }, [selectedWidgetId, setWidgetsWithHistory]);

    const bringToFrontWidget = useCallback((id: string) => {
        setWidgetsWithHistory((prev) => {
            const maxZ = prev.reduce((acc, w) => Math.max(acc, w.zIndex || 1), 0);
            return prev.map((w) => w.id === id ? { ...w, zIndex: maxZ + 1 } : w);
        });
    }, [setWidgetsWithHistory]);

    const sendToBackWidget = useCallback((id: string) => {
        setWidgetsWithHistory((prev) => {
            const minZ = prev.reduce((acc, w) => Math.min(acc, w.zIndex || 1), Infinity);
            return prev.map((w) => w.id === id ? { ...w, zIndex: Math.max(1, minZ - 1) } : w);
        });
    }, [setWidgetsWithHistory]);

    const moveLayerUp = useCallback((id: string) => {
        setWidgetsWithHistory((prev) => prev.map((w) => w.id === id ? { ...w, zIndex: (w.zIndex || 1) + 1 } : w));
    }, [setWidgetsWithHistory]);

    const moveLayerDown = useCallback((id: string) => {
        setWidgetsWithHistory((prev) => prev.map((w) => w.id === id ? { ...w, zIndex: Math.max(1, (w.zIndex || 1) - 1) } : w));
    }, [setWidgetsWithHistory]);

    const removeWidget = useCallback((id: string) => {
        setWidgetsWithHistory((prev) => prev.filter((w) => w.id !== id));
        if (selectedWidgetId === id) setSelectedWidgetId(null);
    }, [selectedWidgetId, setWidgetsWithHistory]);

    const alignToCanvas = useCallback((axis: 'left'|'center-h'|'right'|'top'|'center-v'|'bottom') => {
        if (!selectedWidgetId) return;
        setWidgetsWithHistory((prev) => prev.map((w) => {
            if (w.id !== selectedWidgetId) return w;
            let { x, y } = w;
            if (axis === 'left') x = 0;
            if (axis === 'center-h') x = (100 - w.w) / 2;
            if (axis === 'right') x = 100 - w.w;
            if (axis === 'top') y = 0;
            if (axis === 'center-v') y = (100 - w.h) / 2;
            if (axis === 'bottom') y = 100 - w.h;
            return { ...w, x, y };
        }));
    }, [selectedWidgetId, setWidgetsWithHistory]);

    const canvasContainerRef = React.useRef<HTMLDivElement>(null);

    useEditorShortcuts({
        selectedId: selectedWidgetId,
        onNudge: nudge,
        onDelete: deleteSelected,
        onDuplicate: duplicateSelected,
        onUndo: undo,
        onRedo: redo,
        onBringForward: bringForward,
        onSendBackward: sendBackward,
        onDeselect: () => setSelectedWidgetId(null),
    });

    // DB States
    const [savedLayouts, setSavedLayouts] = useState<any[]>([]);
    const [allSensors, setAllSensors] = useState<any[]>([]);
    const [screens, setScreens] = useState<any[]>([]);
    const [allProducts, setAllProducts] = useState<any[]>([]);
    const [allActivities, setAllActivities] = useState<any[]>([]);
    const [allCategories, setAllCategories] = useState<any[]>([
        { id: 'cat-1', name: 'GASTRONOMÍA', photo: '', description: 'Platos de autor y especialidades.' },
        { id: 'cat-2', name: 'BAR & COCKTAILS', photo: '', description: 'Tragos clásicos e internacionales.' },
        { id: 'cat-3', name: 'KIDS CLUB', photo: '', description: 'Actividades para los más pequeños.' },
        { id: 'cat-4', name: 'BIENESTAR & SPA', photo: '', description: 'Relax y cuidado personal.' }
    ]);


    const fetchLayouts = useCallback(() => {
        if (socket) {
            socket.emit('get_layouts');
            socket.emit('get_screens');
        }
    }, []);

    useEffect(() => {
        socket = io();
        socket.on('connect', () => {
            setIsConnected(true);
            fetchLayouts();
        });
        socket.on('disconnect', () => setIsConnected(false));
        // Initial sensors fetch (also refreshed by socket sensors_list)
        fetch('/api/sensors').then(r => r.json()).then((d) => setAllSensors(Array.isArray(d) ? d : [])).catch(() => {});
        socket.on('sensors_list', (list) => setAllSensors(Array.isArray(list) ? list : []));

        socket.on('layouts_list', (layouts) => {
            setSavedLayouts(layouts);

            // Use the ref (not stale state) so save-broadcasts don't reload the layout
            const currentEditing = editingLayoutIdRef.current;

            if (layoutIdParam) {
                const targetLayout = layouts.find((l: any) => l._id === layoutIdParam);
                if (targetLayout) {
                    if (currentEditing !== targetLayout._id) {
                        loadLayout(targetLayout);
                        return;
                    }
                    // Same layout — sync metadata that could have changed externally
                    // (e.g. orientation flipped from /admin/layouts). Widget selection preserved.
                    setOrientation((prev) => targetLayout.orientation && prev !== targetLayout.orientation ? targetLayout.orientation : prev);
                    setResolution((prev) => {
                        if (targetLayout.orientation === 'portrait' && prev.width > prev.height) return { width: prev.height, height: prev.width };
                        if (targetLayout.orientation === 'landscape' && prev.height > prev.width) return { width: prev.height, height: prev.width };
                        return prev;
                    });
                }
            }

            if (!currentEditing && !layoutIdParam) {
                // Prefer the last layout the user was editing (persisted in localStorage) so
                // returning to Studio restores orientation + background + everything as it was.
                let persisted: string | null = null;
                try { persisted = typeof window !== 'undefined' ? localStorage.getItem('pixelflow_draft_editingId') : null; } catch {}
                let target = persisted ? layouts.find((l: any) => l._id === persisted) : null;
                if (!target) target = layouts.find((l: any) => l.name === 'Mi Primer Layout');
                if (target) loadLayout(target);
            }
        });
        socket.on('screens_list', (screenList) => setScreens(screenList));

        // Initialize with default data (fallback)
        const defaultProducts = (getDefaultData('PRODUCT_LIST') as any).items;
        const defaultActivities = (getDefaultData('ACTIVITIES') as any).items;
        setAllProducts(defaultProducts);
        setAllActivities(defaultActivities);

        // Fetch REAL products/categories/activities from server
        const refreshContent = () => {
            fetch('/api/products').then(r => r.json()).then(list => { if (Array.isArray(list) && list.length > 0) setAllProducts(list); }).catch(() => {});
            fetch('/api/categories').then(r => r.json()).then(list => { if (Array.isArray(list) && list.length > 0) setAllCategories(list); }).catch(() => {});
            fetch('/api/activities').then(r => r.json()).then(list => { if (Array.isArray(list) && list.length > 0) setAllActivities(list); }).catch(() => {});
        };
        refreshContent();
        // Auto-refresh every 30s so any change in /admin/products propagates to Studio + player
        const contentRefreshTimer = setInterval(refreshContent, 30000);
        (window as any).__pfContentRefreshTimer = contentRefreshTimer;

        // Load latest draft from localStorage ONLY if there's no persisted editingId
        // (avoids briefly rendering old widgets with wrong orientation before the DB layout arrives).
        const persistedEditingId = localStorage.getItem('pixelflow_draft_editingId');
        const savedWidgets = localStorage.getItem('pixelflow_draft_widgets');
        if (!persistedEditingId && savedWidgets && widgets.length === 0) {
            try {
                const parsed = JSON.parse(savedWidgets);
                setWidgets(parsed);
                const savedName = localStorage.getItem('pixelflow_draft_name');
                if (savedName) setLayoutName(savedName);
            } catch (e) { console.error('Error loading draft', e); }
        }

        return () => {
            socket.disconnect();
            const t = (window as any).__pfContentRefreshTimer;
            if (t) clearInterval(t);
        };
    }, [fetchLayouts]);

    // Save draft to localStorage
    useEffect(() => {
        if (widgets.length > 0) {
            localStorage.setItem('pixelflow_draft_widgets', JSON.stringify(widgets));
            localStorage.setItem('pixelflow_draft_name', layoutName);
        }
    }, [widgets, layoutName]);

    // Mark isDirty for ANY change (widgets, name, orientation, background config, etc.)
    // Skip first render (no changes yet).
    const _firstDirtyRun = React.useRef(true);
    useEffect(() => {
        if (_firstDirtyRun.current) { _firstDirtyRun.current = false; return; }
        setIsDirty(true);
    }, [widgets, layoutName, orientation, resolution, backgroundColor, backgroundImage, backgroundVideo,
        backgroundBlur, backgroundOverlayColor, backgroundOverlayOpacity, backgroundPattern, backgroundPatternOpacity, transitionType, transitionDuration, designWidth, designHeight, targetDPI]);

    // When a fresh layout loads, reset dirty flag so unsaved indicator is only shown after user edits
    useEffect(() => {
        _firstDirtyRun.current = true;
        setIsDirty(false);
    }, [editingLayoutId]);

    // AUTO-SYNC DATA TO WIDGETS
    useEffect(() => {
        setWidgets(prev => prev.map(w => {
            if (w.type === 'PRODUCT_LIST') return { ...w, data: { ...w.data, items: allProducts, categories: allCategories } };
            if (w.type === 'ACTIVITIES') return { ...w, data: { ...w.data, items: allActivities } };
            return w;
        }));
    }, [allProducts, allActivities, allCategories]);

    const addWidget = (type: WidgetType | string, opts?: { x?: number; y?: number }) => {
        const newWidget: WidgetConfig = {
            id: Math.random().toString(36).substr(2, 9),
            type: type as WidgetType,
            x: opts?.x ?? 10,
            y: opts?.y ?? 10,
            w: 30, h: 30,
            zIndex: 1,
            data: getDefaultData(type as WidgetType),
        };
        setWidgetsWithHistory((prev) => [...prev, newWidget]);
        setSelectedWidgetId(newWidget.id);
    };

    // getDefaultData extracted to src/lib/widgetDefaults.ts (see import at top)

    const selectedWidget = widgets.find(w => w.id === selectedWidgetId);

    const updateSelectedWidgetData = (newData: any) => {
        setWidgets(widgets.map(w =>
            w.id === selectedWidgetId ? { ...w, data: { ...w.data, ...newData } } : w
        ));
    };

    const updateSelectedWidgetSize = (key: 'w' | 'h', val: number) => {
        setWidgets(widgets.map(w =>
            w.id === selectedWidgetId ? { ...w, [key]: val } : w
        ));
    };

    const updateSelectedWidgetPos = (key: 'x' | 'y', val: number) => {
        setWidgets(widgets.map(w =>
            w.id === selectedWidgetId ? { ...w, [key]: val } : w
        ));
    };

    const saveOnly = () => {
        if (!layoutName || !layoutName.trim()) {
            toast.error('Poné un nombre al diseño antes de guardar');
            return;
        }
        // Save AND push live to the currently-selected preview screen so the URL updates instantly.
        // The server will also broadcast to any other screens already assigned to this layout.
        socket.emit('save_layout', {
            screenId: screenId || null,
            layout: {
                _id: editingLayoutId || undefined,
                name: layoutName, orientation, widgets,
                backgroundColor, backgroundImage, backgroundVideo, backgroundBlur,
                backgroundOverlayColor, backgroundOverlayOpacity,
                backgroundPattern, backgroundPatternOpacity, transition: transitionType, transitionDuration,
                designWidth, designHeight, targetDPI,
            },
        });
        setIsDirty(false);
        setLastSavedAt(Date.now());
        toast.success('Guardado', { description: layoutName });
    };

    const pushOnly = () => {
        if (!screenId) { toast.error('Seleccioná un monitor de destino primero.'); return; }
        const layout: LayoutJSON = {
            id: 'preview', name: layoutName, orientation, widgets,
            backgroundColor, backgroundImage, backgroundVideo, backgroundBlur,
            backgroundOverlayColor, backgroundOverlayOpacity,
            backgroundPattern, backgroundPatternOpacity, transition: transitionType, transitionDuration,
            designWidth, designHeight, targetDPI,
        };
        socket.emit('update_content', { screenId, layout });
        toast.success('Vista previa enviada a ' + screenId);
    };

    const saveLayout = (isNew: boolean = false) => {
        if (!layoutName || !layoutName.trim()) {
            toast.error('Asigná un nombre al diseño antes de guardarlo.');
            return;
        }
        const isExisting = !isNew && editingLayoutId;
        const layout: any = {
            name: layoutName, orientation, widgets,
            backgroundColor, backgroundImage, backgroundVideo, backgroundBlur,
            backgroundOverlayColor, backgroundOverlayOpacity,
            backgroundPattern, backgroundPatternOpacity, transition: transitionType, transitionDuration,
            designWidth, designHeight, targetDPI,
        };
        if (isExisting) layout._id = editingLayoutId;
        socket.emit('save_layout', { screenId, layout });
        toast.success(isExisting ? 'Diseño actualizado' : 'Diseño guardado',
            { description: layoutName + ' · ' + orientation });
        setTimeout(() => fetchLayouts(), 500);
    };

    const saveAndPush = () => {
        saveLayout();
        pushOnly();
    };

    const createNewLayout = () => {
        setShowResetConfirm(true);
    };

    const handleConfirmReset = () => {
        setEditingLayoutId(null);
        setLayoutName('Nuevo Layout ' + (savedLayouts.length + 1));
        setWidgets([]);
        setBackgroundImage('');
        setBackgroundVideo('');
        setBackgroundColor('#000000');
        setBackgroundBlur(0);
        setBackgroundOverlayColor('#000000');
        setBackgroundOverlayOpacity(0.5);
        setBackgroundPattern('none');
        setBackgroundPatternOpacity(0.2);
        setSelectedWidgetId(null);
        setShowResetConfirm(false);
    };

    const loadLayout = (layout: any) => {
        setEditingLayoutId(layout._id || layout.id);
        editingLayoutIdRef.current = layout._id || layout.id;
        setLayoutName(layout.name);
        setOrientation(layout.orientation || 'landscape');
        // Sync resolution to match the layout's orientation so the canvas doesn't stay stuck in horizontal
        if ((layout.orientation === 'portrait')) {
            setResolution((r) => (r.width > r.height ? { width: 864, height: 1528 } : r));
        } else {
            setResolution((r) => (r.height > r.width ? { width: 1920, height: 1080 } : r));
        }
        setWidgets(layout.widgets);
        setBackgroundImage(layout.backgroundImage || '');
        setBackgroundVideo(layout.backgroundVideo || '');
        setBackgroundColor(layout.backgroundColor || '#000000');
        setBackgroundBlur(layout.backgroundBlur || 0);
        setDesignWidth((layout as any).designWidth || (layout.orientation === 'portrait' ? 1080 : 1920));
        setDesignHeight((layout as any).designHeight || (layout.orientation === 'portrait' ? 1920 : 1080));
        setTargetDPI((layout as any).targetDPI || 96);
        setBackgroundOverlayColor(layout.backgroundOverlayColor || '#000000');
        setBackgroundOverlayOpacity(layout.backgroundOverlayOpacity !== undefined ? layout.backgroundOverlayOpacity : 0.5);
        setBackgroundPattern(layout.backgroundPattern || 'none');
        setTransitionType((layout as any).transition || 'dramatic');
        setTransitionDuration((layout as any).transitionDuration ?? 0.7);
        setBackgroundPatternOpacity(layout.backgroundPatternOpacity !== undefined ? layout.backgroundPatternOpacity : 0.2);
        setSelectedWidgetId(null);
    };

    return (
        <div className="flex-1 flex flex-col min-h-0 font-sans bg-background text-foreground relative">


            <div className="flex flex-1 overflow-hidden">
                {/* Widgets — top horizontal pill */}
                <WidgetPalette onAdd={addWidget} variant="horizontal" />

                {/* All controls — right vertical dock */}
                <FloatingRightDock
                    orientation={orientation}
                    onOrientationChange={(o) => {
                        setOrientation(o);
                        setResolution((r) => {
                            const isPortraitVal = r.height > r.width;
                            const wantPortrait = o === 'portrait';
                            if (isPortraitVal === wantPortrait) return r;
                            if (wantPortrait) return { width: 864, height: 1528 };
                            return { width: 1920, height: 1080 };
                        });
                    }}
                    resolution={resolution}
                    onResolutionChange={(r) => {
                        setResolution(r);
                        setOrientation(r.height > r.width ? 'portrait' : 'landscape');
                    }}
                    selectedWidgetCount={selectedWidgetId ? 1 : 0}
                    totalWidgets={widgets.length}
                    onOpenProperties={() => setRightSidebarOpen(true)}
                    layouts={savedLayouts}
                    activeLayoutId={savedLayouts.find(l => l.name === layoutName)?._id || ''}
                    onLayoutChange={(id) => { const l = savedLayouts.find(x => x._id === id); if (l) loadLayout(l); }}
                    layoutName={layoutName}
                    screens={screens}
                    screenId={screenId}
                    onScreenChange={setScreenId}
                    onPreview={pushOnly}
                    onPublish={saveAndPush}
                    onCopyUrl={async () => {
                        if (!screenId) { toast.error('Seleccioná un monitor primero.'); return; }
                        const url = window.location.origin + '/player/' + screenId;
                        const ok = await copyToClipboard(url);
                        if (ok) toast.success('URL copiada', { description: url });
                        else toast.error('No se pudo copiar', { description: url });
                    }}
                    onUndo={undo}
                    onRedo={redo}
                    onSave={saveOnly}
                    isDirty={isDirty}
                    lastSavedAt={lastSavedAt}
                    isEditing={!!editingLayoutId}
                />

                {/* Main Workspace (Canvas Area) */}
                {/* Main Workspace (Canvas Area) */}
                <main className="flex-1 bg-background overflow-hidden relative">
                    <div className="h-full flex flex-col w-full relative">
                        {/* Interactive Canvas — full bleed */}
                        <div
                            ref={canvasContainerRef}
                            className="flex-1 min-h-0 bg-muted/30 overflow-auto relative group custom-scrollbar pt-16 pb-12"
                            onContextMenu={(e) => {
                                if (!selectedWidgetId) return;
                                e.preventDefault();
                                setCtxMenu({ x: e.clientX, y: e.clientY, visible: true });
                            }}
                            onClick={(e) => { if ((e.target as HTMLElement).closest('[data-ctx-menu]') == null) setCtxMenu((m) => m.visible ? { ...m, visible: false } : m); }}
                        >
                            <Canvas
                                orientation={orientation}
                                widgets={widgets}
                                onWidgetsChange={setWidgetsWithHistory}
                                onCommit={commitHistory}
                                onAddWidget={addWidget}
                                selectedId={selectedWidgetId}
                                onSelect={setSelectedWidgetId}
                                onOpenProperties={() => setRightSidebarOpen(true)}
                                backgroundImage={backgroundImage}
                                backgroundVideo={backgroundVideo}
                                backgroundColor={backgroundColor}
                                backgroundBlur={backgroundBlur}
                                backgroundOverlayColor={backgroundOverlayColor}
                                backgroundOverlayOpacity={backgroundOverlayOpacity}
                                backgroundPattern={backgroundPattern}
                                backgroundPatternOpacity={backgroundPatternOpacity}
                            />

                        </div>

                        {!rightSidebarOpen && (
                            <FloatingToolbar
                                widget={widgets.find((w) => w.id === selectedWidgetId) || null}
                                canvasRef={canvasContainerRef}
                                onDuplicate={duplicateSelected}
                                onDelete={deleteSelected}
                                onBringForward={bringForward}
                                onSendBackward={sendBackward}
                                onAlign={alignToCanvas}
                            />
                        )}

                        <StatusBar
                            selected={widgets.find((w) => w.id === selectedWidgetId) || null}
                            totalWidgets={widgets.length}
                            gridSize={16}
                        />
                    </div>

                    {/* Floating orientation quick-toggle */}
                    <div className="absolute top-3 right-3 z-20 inline-flex items-center gap-0.5 rounded-lg border bg-popover/95 backdrop-blur-md p-0.5 shadow-lg">
                        <button
                            onClick={() => {
                                setOrientation('landscape');
                                setResolution((r) => (r.height > r.width ? { width: r.height, height: r.width } : r));
                            }}
                            className={'flex items-center gap-1.5 h-8 px-2.5 rounded-md text-[11px] font-medium transition-colors ' + (orientation === 'landscape' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground hover:bg-accent')}
                            title="Horizontal"
                        >
                            <Monitor className="size-3.5" /> Horizontal
                        </button>
                        <button
                            onClick={() => {
                                setOrientation('portrait');
                                setResolution((r) => (r.width > r.height ? { width: 864, height: 1528 } : r));
                            }}
                            className={'flex items-center gap-1.5 h-8 px-2.5 rounded-md text-[11px] font-medium transition-colors ' + (orientation === 'portrait' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground hover:bg-accent')}
                            title="Vertical"
                        >
                            <Smartphone className="size-3.5" /> Vertical
                        </button>
                    </div>

                    {/* Right-click context menu */}
                    {ctxMenu.visible && selectedWidgetId && (
                        <div
                            data-ctx-menu
                            className="fixed z-50 min-w-[200px] rounded-md border bg-popover text-popover-foreground shadow-xl backdrop-blur-xl py-1"
                            style={{ left: ctxMenu.x, top: ctxMenu.y, background: 'color-mix(in srgb, var(--popover) 96%, transparent)' }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <button onClick={() => { setRightSidebarOpen(true); setCtxMenu({ ...ctxMenu, visible: false }); }} className="w-full text-left px-3 py-1.5 text-[12px] hover:bg-accent flex items-center gap-2">
                                <Settings2 className="size-3.5" /> Propiedades
                            </button>
                            <div className="h-px bg-border my-1" />
                            <button onClick={() => { alignToCanvas('left'); setCtxMenu({ ...ctxMenu, visible: false }); }} className="w-full text-left px-3 py-1.5 text-[12px] hover:bg-accent">Alinear izquierda</button>
                            <button onClick={() => { alignToCanvas('center-h'); setCtxMenu({ ...ctxMenu, visible: false }); }} className="w-full text-left px-3 py-1.5 text-[12px] hover:bg-accent">Centrar horizontal</button>
                            <button onClick={() => { alignToCanvas('right'); setCtxMenu({ ...ctxMenu, visible: false }); }} className="w-full text-left px-3 py-1.5 text-[12px] hover:bg-accent">Alinear derecha</button>
                            <button onClick={() => { alignToCanvas('top'); setCtxMenu({ ...ctxMenu, visible: false }); }} className="w-full text-left px-3 py-1.5 text-[12px] hover:bg-accent">Alinear arriba</button>
                            <button onClick={() => { alignToCanvas('center-v'); setCtxMenu({ ...ctxMenu, visible: false }); }} className="w-full text-left px-3 py-1.5 text-[12px] hover:bg-accent">Centrar vertical</button>
                            <button onClick={() => { alignToCanvas('bottom'); setCtxMenu({ ...ctxMenu, visible: false }); }} className="w-full text-left px-3 py-1.5 text-[12px] hover:bg-accent">Alinear abajo</button>
                            <div className="h-px bg-border my-1" />
                            <button onClick={() => { bringForward(); setCtxMenu({ ...ctxMenu, visible: false }); }} className="w-full text-left px-3 py-1.5 text-[12px] hover:bg-accent">Traer al frente</button>
                            <button onClick={() => { sendBackward(); setCtxMenu({ ...ctxMenu, visible: false }); }} className="w-full text-left px-3 py-1.5 text-[12px] hover:bg-accent">Enviar al fondo</button>
                            <div className="h-px bg-border my-1" />
                            <button onClick={() => { duplicateSelected(); setCtxMenu({ ...ctxMenu, visible: false }); }} className="w-full text-left px-3 py-1.5 text-[12px] hover:bg-accent">Duplicar</button>
                            <button onClick={() => { deleteSelected(); setCtxMenu({ ...ctxMenu, visible: false }); }} className="w-full text-left px-3 py-1.5 text-[12px] hover:bg-accent text-destructive">Eliminar</button>
                        </div>
                    )}
                </main>

                {/* Properties Inspector — modal Dialog */}
                <AnimatePresence>{rightSidebarOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="fixed inset-0 z-[9999] grid place-items-center p-6 bg-foreground/70 dark:bg-background/90 backdrop-blur-lg"
                    onClick={(e) => { /* solo cierra con la X — click outside no cierra */ }}
                >
                <motion.aside
                    initial={{ scale: 0.96, opacity: 0, y: 12 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.96, opacity: 0, y: 12 }}
                    transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
                    className="w-full max-w-5xl max-h-[92vh] bg-card border text-card-foreground rounded-xl shadow-2xl flex flex-col overflow-hidden"
                >
                    <TooltipProvider>
                    <div className="px-6 py-4 flex items-center justify-between border-b bg-gradient-to-r from-primary/[0.04] to-transparent shrink-0">
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                            <span className="size-10 rounded-lg grid place-items-center bg-primary/10 text-primary shrink-0 ring-1 ring-primary/20">
                                <Settings2 className="size-5" strokeWidth={1.75} />
                            </span>
                            <div className="min-w-0">
                                <h2 className="font-heading text-[16px] font-bold tracking-tight leading-tight truncate">
                                    {selectedWidget ? 'Propiedades del widget' : 'Lienzo Maestro'}
                                </h2>
                                <p className="text-[12px] text-muted-foreground mt-0.5 flex items-center gap-1.5 truncate">
                                    {selectedWidget ? (
                                        <>
                                            <Badge variant="secondary" className="text-[10px] h-4 px-1.5 font-mono uppercase">{selectedWidget.type}</Badge>
                                            <span className="opacity-60">{Math.round(selectedWidget.w)}%×{Math.round(selectedWidget.h)}% · capa {selectedWidget.zIndex || 1}</span>
                                        </>
                                    ) : (
                                        <>
                                            <Badge variant="outline" className="text-[10px] h-4 px-1.5">{widgets.length} capas</Badge>
                                            <span className="opacity-60">{designWidth}×{designHeight}px · {orientation === 'landscape' ? 'Horizontal' : 'Vertical'} · {(Math.sqrt(designWidth * designWidth + designHeight * designHeight) / (targetDPI || 96)).toFixed(1)}"</span>
                                        </>
                                    )}
                                </p>
                            </div>
                        </div>
                        {/* Action toolbar: Save (with dirty state) + Delete (only if widget) + Close */}
                        <div className="flex items-center gap-1 shrink-0">
                            <Tooltip>
                                <TooltipTrigger
                                    onClick={() => saveOnly()}
                                    aria-label="Guardar"
                                    disabled={!isDirty}
                                    className={'size-9 grid place-items-center rounded-md transition-colors relative disabled:opacity-40 disabled:pointer-events-none ' + (
                                        isDirty ? 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/40 hover:bg-amber-500/25' : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                                    )}
                                >
                                    <Save className="size-4" />
                                    {isDirty && <span className="absolute -top-0.5 -right-0.5 size-2 rounded-full bg-amber-500 animate-pulse" />}
                                </TooltipTrigger>
                                <TooltipContent side="bottom">
                                    {isDirty ? 'Guardar cambios y aplicar en vivo' : (lastSavedAt ? 'Guardado hace ' + Math.max(1, Math.floor((Date.now() - lastSavedAt) / 1000)) + 's' : 'Sin cambios')}
                                </TooltipContent>
                            </Tooltip>
                            {selectedWidget && (
                                <Tooltip>
                                    <TooltipTrigger
                                        onClick={() => {
                                            if (!confirm('Eliminar este widget del lienzo?')) return;
                                            setWidgets(widgets.filter(w => w.id !== selectedWidgetId));
                                            setSelectedWidgetId(null);
                                        }}
                                        aria-label="Eliminar"
                                        className="size-9 grid place-items-center rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                                    >
                                        <Trash2 className="size-4" />
                                    </TooltipTrigger>
                                    <TooltipContent side="bottom">Eliminar widget</TooltipContent>
                                </Tooltip>
                            )}
                            <span className="w-px h-6 bg-border mx-1" />
                            <button onClick={() => setRightSidebarOpen(false)} className="size-9 grid place-items-center rounded-md hover:bg-accent text-muted-foreground hover:text-foreground transition-colors">
                                <X className="size-4" />
                            </button>
                        </div>
                    </div>
                    </TooltipProvider>

                    <div className="flex-1 min-w-[400px] flex flex-col h-full overflow-hidden">
                        {
                            selectedWidget ? (
                                <div className="flex-1 flex flex-col h-full overflow-hidden" >
                                    <div className="flex-1 overflow-y-auto">
                                        <section className="p-5">
                                            {selectedWidget.type !== 'CATEGORY_NAV' && (
                                            <div className="space-y-5">

                                                {selectedWidget.type === 'IMAGE' && (
                                                    <div className="space-y-3">
                                                        {/* Header */}
                                                        <div className="flex items-start gap-3 pb-3 border-b border-border">
                                                            <div className="size-9 rounded-lg bg-sky-500/10 flex items-center justify-center flex-shrink-0">
                                                                <ImageIcon className="size-4 text-sky-500" />
                                                            </div>
                                                            <div>
                                                                <h4 className="text-sm font-bold text-foreground">Imagen</h4>
                                                                <p className="text-[10px] text-muted-foreground">Foto estática con ajuste, opacidad y acción táctil.</p>
                                                            </div>
                                                        </div>
                                                        <div className="rounded-lg border bg-card p-4 space-y-3">
                                                            <Label className="text-[11px] font-semibold uppercase text-muted-foreground">Origen</Label>
                                                            <div className="flex items-start gap-3">
                                                                <div className="size-20 rounded-md border overflow-hidden bg-muted grid place-items-center shrink-0">
                                                                    {selectedWidget.data.src ? <img src={selectedWidget.data.src} className="w-full h-full object-cover" /> : <ImageIcon className="size-6 text-muted-foreground/40" />}
                                                                </div>
                                                                <div className="flex-1 space-y-2 min-w-0">
                                                                    <ImageUpload compact label={selectedWidget.data.src ? 'Cambiar foto' : 'Subir foto'} onUploadSuccess={(url) => updateSelectedWidgetData({ src: url })} />
                                                                    <Input value={selectedWidget.data.src || ''} onChange={(e) => updateSelectedWidgetData({ src: e.target.value })} placeholder="…o pegá una URL" className="h-9 text-xs font-mono" />
                                                                </div>
                                                            </div>
                                                            <Input value={selectedWidget.data.alt || ''} onChange={(e) => updateSelectedWidgetData({ alt: e.target.value })} placeholder="Texto alternativo (accesibilidad)" className="h-9 text-sm" />
                                                        </div>
                                                        <div className="rounded-lg border bg-card p-4 space-y-3">
                                                            <Label className="text-[11px] font-semibold uppercase text-muted-foreground">Ajuste</Label>
                                                            <div className="grid grid-cols-2 gap-2">
                                                                <div className="space-y-1"><Label className="text-[11px]">Ajuste</Label>
                                                                    <select className="w-full h-9 rounded-md border bg-background px-2 text-[12px]" value={selectedWidget.data.fit || 'cover'} onChange={(e) => updateSelectedWidgetData({ fit: e.target.value })}>
                                                                        <option value="cover">Cubrir</option>
                                                                        <option value="contain">Ajustar (contener)</option>
                                                                        <option value="fill">Estirar</option>
                                                                        <option value="none">Original</option>
                                                                    </select>
                                                                </div>
                                                                <div className="space-y-1"><Label className="text-[11px]">Posición</Label>
                                                                    <select className="w-full h-9 rounded-md border bg-background px-2 text-[12px]" value={selectedWidget.data.position || 'center'} onChange={(e) => updateSelectedWidgetData({ position: e.target.value })}>
                                                                        <option value="center">Centro</option><option value="top">Arriba</option><option value="bottom">Abajo</option><option value="left">Izquierda</option><option value="right">Derecha</option>
                                                                    </select>
                                                                </div>
                                                            </div>
                                                            <div className="grid grid-cols-3 gap-2">
                                                                <div className="space-y-1"><Label className="text-[11px]">Radio</Label>
                                                                    <Input type="number" min={0} max={80} value={selectedWidget.data.borderRadius ?? 12} onChange={(e) => updateSelectedWidgetData({ borderRadius: parseInt(e.target.value) })} className="h-9 text-sm" />
                                                                </div>
                                                                <div className="space-y-1"><Label className="text-[11px]">Opacidad</Label>
                                                                    <input type="range" min={0} max={1} step={0.05} value={selectedWidget.data.opacity ?? 1} onChange={(e) => updateSelectedWidgetData({ opacity: parseFloat(e.target.value) })} className="w-full accent-primary" />
                                                                </div>
                                                                <div className="space-y-1"><Label className="text-[11px]">Rotación</Label>
                                                                    <Input type="number" min={-180} max={180} value={selectedWidget.data.rotate ?? 0} onChange={(e) => updateSelectedWidgetData({ rotate: parseInt(e.target.value) })} className="h-9 text-sm" />
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="rounded-lg border bg-card p-4 space-y-2">
                                                            <Label className="text-[11px] font-semibold uppercase text-muted-foreground">Al tocar</Label>
                                                            <div className="grid grid-cols-2 gap-2">
                                                                <select className="w-full h-9 rounded-md border bg-background px-2 text-[12px]" value={selectedWidget.data.onTapAction || 'NONE'} onChange={(e) => updateSelectedWidgetData({ onTapAction: e.target.value })}>
                                                                    <option value="NONE">Sin acción</option>
                                                                    <option value="GO_TO">Ir a interface</option>
                                                                    <option value="BACK">Volver atrás</option>
                                                                    <option value="HOME">Ir al inicio</option>
                                                                    <option value="RELOAD">Recargar</option>
                                                                </select>
                                                                {selectedWidget.data.onTapAction === 'GO_TO' && (
                                                                    <select className="w-full h-9 rounded-md border bg-background px-2 text-[12px]" value={selectedWidget.data.targetLayoutId || ''} onChange={(e) => updateSelectedWidgetData({ targetLayoutId: e.target.value })}>
                                                                        <option value="">Elegí un diseño...</option>
                                                                        {savedLayouts.map((l: any) => <option key={l._id} value={l._id}>{l.name}</option>)}
                                                                    </select>
                                                                )}
                                                            </div>
                                                        </div>
                                                        <div className="rounded-lg border bg-card p-4 space-y-2">
                                                            <Label className="text-[11px] font-semibold uppercase text-muted-foreground">Título / Caption</Label>
                                                            <Input value={selectedWidget.data.caption || ''} onChange={(e) => updateSelectedWidgetData({ caption: e.target.value })} placeholder="Título opcional sobre la imagen" className="h-9 text-sm" />
                                                            <div className="grid grid-cols-3 gap-2">
                                                                <select className="w-full h-9 rounded-md border bg-background px-2 text-[12px]" value={selectedWidget.data.captionPosition || 'over'} onChange={(e) => updateSelectedWidgetData({ captionPosition: e.target.value })}>
                                                                    <option value="over">Sobre la imagen</option>
                                                                    <option value="top">Arriba</option>
                                                                    <option value="bottom">Debajo</option>
                                                                </select>
                                                                <div className="flex items-center gap-2 rounded-md border bg-background px-2 h-9">
                                                                    <input type="color" value={selectedWidget.data.captionColor || '#ffffff'} onChange={(e) => updateSelectedWidgetData({ captionColor: e.target.value })} className="size-6 rounded cursor-pointer border-0 bg-transparent" />
                                                                    <span className="font-mono text-[10px] text-muted-foreground truncate">{selectedWidget.data.captionColor || '#ffffff'}</span>
                                                                </div>
                                                                <select className="w-full h-9 rounded-md border bg-background px-2 text-[12px]" value={selectedWidget.data.captionSize || 'md'} onChange={(e) => updateSelectedWidgetData({ captionSize: e.target.value })}>
                                                                    <option value="sm">Chico</option><option value="md">Medio</option><option value="lg">Grande</option><option value="xl">XL</option>
                                                                </select>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}

                                                {selectedWidget.type === 'TEXT' && (
                                                    <div className="space-y-4">
                                                        {/* Header */}
                                                        <div className="flex items-start gap-3 pb-3 border-b border-border">
                                                            <div className="size-9 rounded-lg bg-sky-500/10 flex items-center justify-center flex-shrink-0">
                                                                <Type className="size-4 text-sky-500" />
                                                            </div>
                                                            <div>
                                                                <h4 className="text-sm font-bold text-foreground">Texto Enriquecido</h4>
                                                                <p className="text-[10px] text-muted-foreground">Estilo visual, tipografía y contenido con formato.</p>
                                                            </div>
                                                        </div>
                                                        {/* Grid 3-col */}
                                                        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">

                                                        {/* Estilo visual */}
                                                        <div className="rounded-lg border bg-card p-4 space-y-3">
                                                            <div className="flex items-center gap-2">
                                                                <Palette className="size-3.5 text-muted-foreground" />
                                                                <h5 className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">Estilo Visual</h5>
                                                            </div>
                                                            <div>
                                                                <div className="flex items-center gap-2 mb-1.5">
                                                                    <label className="text-[10px] font-bold text-foreground">Preset</label>
                                                                    <Tooltip>
                                                                        <TooltipTrigger><Info className="size-3 text-muted-foreground" /></TooltipTrigger>
                                                                        <TooltipContent>Elige un estilo base. Cada preset aplica tipografía y efectos distintos.</TooltipContent>
                                                                    </Tooltip>
                                                                </div>
                                                                <select
                                                                    className="w-full h-9 bg-background border border-border rounded-md px-3 text-xs font-medium text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                                                    value={selectedWidget.data.style || 'minimal'}
                                                                    onChange={(e) => updateSelectedWidgetData({ style: e.target.value })}
                                                                >
                                                                    <option value="minimal">Minimalista (Estándar)</option>
                                                                    <option value="gradient">Gradiente Moderno</option>
                                                                    <option value="glass">Cristal Glassmorphism</option>
                                                                    <option value="typewriter">Máquina de Escribir</option>
                                                                </select>
                                                            </div>
                                                            {selectedWidget.data.style === 'gradient' && (
                                                                <div className="grid grid-cols-2 gap-3 pt-1 animate-in fade-in slide-in-from-top-2 duration-300">
                                                                    <div>
                                                                        <label className="text-[10px] font-bold text-foreground block mb-1.5">Color inicio</label>
                                                                        <input type="color" value={selectedWidget.data.gradientFrom || '#3b82f6'} onChange={(e) => updateSelectedWidgetData({ gradientFrom: e.target.value })} className="w-full h-9 rounded-md border border-border bg-background cursor-pointer" />
                                                                    </div>
                                                                    <div>
                                                                        <label className="text-[10px] font-bold text-foreground block mb-1.5">Color fin</label>
                                                                        <input type="color" value={selectedWidget.data.gradientTo || '#8b5cf6'} onChange={(e) => updateSelectedWidgetData({ gradientTo: e.target.value })} className="w-full h-9 rounded-md border border-border bg-background cursor-pointer" />
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>

                                                        {/* Tipografia */}
                                                        <div className="rounded-lg border bg-card p-4 space-y-3">
                                                            <div className="flex items-center gap-2">
                                                                <Type className="size-3.5 text-muted-foreground" />
                                                                <h5 className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">Tipografía</h5>
                                                            </div>
                                                            <div className="grid grid-cols-2 gap-3">
                                                                <div>
                                                                    <div className="flex items-center gap-2 mb-1.5">
                                                                        <label className="text-[10px] font-bold text-foreground">Tamaño</label>
                                                                        <Tooltip>
                                                                            <TooltipTrigger><Info className="size-3 text-muted-foreground" /></TooltipTrigger>
                                                                            <TooltipContent>Valor CSS (rem, px, %). Ej: 2rem, 32px, 120%.</TooltipContent>
                                                                        </Tooltip>
                                                                    </div>
                                                                    <input type="text" value={selectedWidget.data.fontSize || '2rem'} onChange={(e) => updateSelectedWidgetData({ fontSize: e.target.value })} className="w-full h-9 bg-background border border-border rounded-md px-3 text-xs font-medium outline-none focus-visible:ring-2 focus-visible:ring-ring" />
                                                                </div>
                                                                <div>
                                                                    <div className="flex items-center gap-2 mb-1.5">
                                                                        <label className="text-[10px] font-bold text-foreground">Alineación</label>
                                                                    </div>
                                                                    <select value={selectedWidget.data.textAlign || 'center'} onChange={(e) => updateSelectedWidgetData({ textAlign: e.target.value })} className="w-full h-9 bg-background border border-border rounded-md px-3 text-xs font-medium outline-none">
                                                                        <option value="left">Izquierda</option>
                                                                        <option value="center">Centro</option>
                                                                        <option value="right">Derecha</option>
                                                                    </select>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* Contenido */}
                                                        <div className="rounded-lg border bg-card p-4 space-y-3">
                                                            <div className="flex items-center gap-2">
                                                                <Megaphone className="size-3.5 text-muted-foreground" />
                                                                <h5 className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">Contenido</h5>
                                                                <Tooltip>
                                                                    <TooltipTrigger><Info className="size-3 text-muted-foreground" /></TooltipTrigger>
                                                                    <TooltipContent>Texto con formato enriquecido: negrita, cursiva, listas, colores.</TooltipContent>
                                                                </Tooltip>
                                                            </div>
                                                            <RichTextEditor content={selectedWidget.data.content} onChange={(content) => updateSelectedWidgetData({ content })} />
                                                        </div>
                                                        </div>
                                                    </div>
                                                )}

                                                {selectedWidget.type === 'VIDEO' && (
                                                    <div className="space-y-4">
                                                        {/* Header */}
                                                        <div className="flex items-start gap-3 pb-3 border-b border-border">
                                                            <div className="size-9 rounded-lg bg-red-500/10 flex items-center justify-center flex-shrink-0">
                                                                <Video className="size-4 text-red-500" />
                                                            </div>
                                                            <div>
                                                                <h4 className="text-sm font-bold text-foreground">Video</h4>
                                                                <p className="text-[10px] text-muted-foreground">Video con autoplay silenciado y loop.</p>
                                                            </div>
                                                        </div>

                                                        {/* Grid 2-col */}
                                                        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                                                        {/* Origen */}
                                                        <div className="rounded-lg border bg-card p-4 space-y-3">
                                                            <div className="flex items-center gap-2">
                                                                <ExternalLink className="size-3.5 text-muted-foreground" />
                                                                <h5 className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">Origen del Video</h5>
                                                            </div>
                                                            <div>
                                                                <div className="flex items-center gap-2 mb-1.5">
                                                                    <label className="text-[10px] font-bold text-foreground">URL</label>
                                                                    <Tooltip>
                                                                        <TooltipTrigger><Info className="size-3 text-muted-foreground" /></TooltipTrigger>
                                                                        <TooltipContent>Link directo a mp4/webm. También podés subir un archivo abajo.</TooltipContent>
                                                                    </Tooltip>
                                                                </div>
                                                                <input value={selectedWidget.data.url || ''} onChange={(e) => updateSelectedWidgetData({ url: e.target.value })} placeholder="https://…/video.mp4" className="w-full h-9 bg-background border border-border rounded-md px-3 text-xs font-medium outline-none focus-visible:ring-2 focus-visible:ring-ring" />
                                                            </div>
                                                            <div className="pt-1">
                                                                <ImageUpload label="Subir video" onUploadSuccess={(url) => updateSelectedWidgetData({ url })} />
                                                            </div>
                                                            {selectedWidget.data.url && (
                                                                <div className="rounded-md border border-border overflow-hidden bg-black/40 animate-in fade-in duration-300">
                                                                    <video src={selectedWidget.data.url} className="w-full max-h-40 object-contain" muted loop playsInline autoPlay />
                                                                </div>
                                                            )}
                                                        </div>

                                                        <div className="rounded-lg border bg-card p-4 space-y-3">
                                                            <div className="flex items-center gap-2">
                                                                <Settings2 className="size-3.5 text-muted-foreground" />
                                                                <h5 className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">Comportamiento</h5>
                                                            </div>
                                                            <div className="grid grid-cols-2 gap-3">
                                                                <label className="flex items-center justify-between rounded-md border bg-background px-3 py-2 cursor-pointer">
                                                                    <div>
                                                                        <div className="text-[11px] font-medium">Autoplay</div>
                                                                        <div className="text-[9px] text-muted-foreground">Reproduce al cargar</div>
                                                                    </div>
                                                                    <Switch checked={selectedWidget.data.autoPlay !== false} onCheckedChange={(v) => updateSelectedWidgetData({ autoPlay: v })} />
                                                                </label>
                                                                <label className="flex items-center justify-between rounded-md border bg-background px-3 py-2 cursor-pointer">
                                                                    <div>
                                                                        <div className="text-[11px] font-medium">Silenciado</div>
                                                                        <div className="text-[9px] text-muted-foreground">Sin audio (requerido para autoplay)</div>
                                                                    </div>
                                                                    <Switch checked={selectedWidget.data.muted !== false} onCheckedChange={(v) => updateSelectedWidgetData({ muted: v })} />
                                                                </label>
                                                                <label className="flex items-center justify-between rounded-md border bg-background px-3 py-2 cursor-pointer">
                                                                    <div>
                                                                        <div className="text-[11px] font-medium">Loop</div>
                                                                        <div className="text-[9px] text-muted-foreground">Reinicia al terminar</div>
                                                                    </div>
                                                                    <Switch checked={selectedWidget.data.loop !== false} onCheckedChange={(v) => updateSelectedWidgetData({ loop: v })} />
                                                                </label>
                                                                <label className="flex items-center justify-between rounded-md border bg-background px-3 py-2 cursor-pointer">
                                                                    <div>
                                                                        <div className="text-[11px] font-medium">Controles</div>
                                                                        <div className="text-[9px] text-muted-foreground">Barra play/pausa visible</div>
                                                                    </div>
                                                                    <Switch checked={!!selectedWidget.data.showControls} onCheckedChange={(v) => updateSelectedWidgetData({ showControls: v })} />
                                                                </label>
                                                            </div>
                                                            <div className="grid grid-cols-2 gap-3">
                                                                <div>
                                                                    <label className="text-[10px] font-bold text-foreground block mb-1.5">Ajuste</label>
                                                                    <select value={selectedWidget.data.fit || 'cover'} onChange={(e) => updateSelectedWidgetData({ fit: e.target.value })} className="w-full h-9 bg-background border border-border rounded-md px-3 text-xs font-medium outline-none">
                                                                        <option value="cover">Cubrir (crop)</option>
                                                                        <option value="contain">Contener (letterbox)</option>
                                                                        <option value="fill">Estirar</option>
                                                                    </select>
                                                                </div>
                                                                <div>
                                                                    <label className="text-[10px] font-bold text-foreground block mb-1.5">Velocidad</label>
                                                                    <select value={String(selectedWidget.data.playbackRate || 1)} onChange={(e) => updateSelectedWidgetData({ playbackRate: parseFloat(e.target.value) })} className="w-full h-9 bg-background border border-border rounded-md px-3 text-xs font-medium outline-none">
                                                                        <option value="0.5">0.5x (lento)</option>
                                                                        <option value="1">1x (normal)</option>
                                                                        <option value="1.25">1.25x</option>
                                                                        <option value="1.5">1.5x</option>
                                                                        <option value="2">2x (rápido)</option>
                                                                    </select>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        </div>
                                                    </div>
                                                )}

                                                {selectedWidget.type === 'SLIDER' && (
                                                    <div className="space-y-4">
                                                        {/* Header */}
                                                        <div className="flex items-start gap-3 pb-3 border-b border-border">
                                                            <div className="size-9 rounded-lg bg-violet-500/10 flex items-center justify-center flex-shrink-0">
                                                                <ImageIcon className="size-4 text-violet-500" />
                                                            </div>
                                                            <div>
                                                                <h4 className="text-sm font-bold text-foreground">Carrusel de Imágenes</h4>
                                                                <p className="text-[10px] text-muted-foreground">Colección de fotos con auto-play y transiciones.</p>
                                                            </div>
                                                        </div>

                                                        {/* Grid 2-col */}
                                                        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                                                        {/* Items */}
                                                        <div className="rounded-lg border bg-card p-4 space-y-3">
                                                            <div className="flex items-center justify-between">
                                                                <div className="flex items-center gap-2">
                                                                    <ImageIcon className="size-3.5 text-muted-foreground" />
                                                                    <h5 className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">Items del Slider</h5>
                                                                </div>
                                                                <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">{selectedWidget.data.images?.length || 0} total</span>
                                                            </div>
                                                            <div className="grid grid-cols-4 gap-2">
                                                                {selectedWidget.data.images?.map((url: string, idx: number) => (
                                                                    <div key={idx} className="relative aspect-square group/img">
                                                                        <img src={url} className="w-full h-full object-cover rounded-md border border-border" />
                                                                        <button onClick={() => { const n = selectedWidget.data.images.filter((_: any, i: number) => i !== idx); updateSelectedWidgetData({ images: n }); }} className="absolute -top-1.5 -right-1.5 size-5 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold opacity-0 group-hover/img:opacity-100 transition-opacity">×</button>
                                                                    </div>
                                                                ))}
                                                                <button onClick={() => { const u = prompt('URL:'); if (u) updateSelectedWidgetData({ images: [...(selectedWidget.data.images || []), u] }); }} className="aspect-square rounded-md border-2 border-dashed border-border hover:border-primary hover:bg-primary/5 flex items-center justify-center text-muted-foreground hover:text-primary transition-colors">
                                                                    <Plus className="size-5" />
                                                                </button>
                                                            </div>
                                                            <div className="pt-1">
                                                                <ImageUpload label="Subir imagen o video" onUploadSuccess={(url) => updateSelectedWidgetData({ images: [...(selectedWidget.data.images || []), url] })} />
                                                            </div>
                                                        </div>

                                                        <div className="rounded-lg border bg-card p-4 space-y-3">
                                                            <div className="flex items-center gap-2">
                                                                <Settings2 className="size-3.5 text-muted-foreground" />
                                                                <h5 className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">Comportamiento</h5>
                                                            </div>
                                                            <div className="grid grid-cols-2 gap-3">
                                                                <div>
                                                                    <label className="text-[10px] font-bold text-foreground block mb-1.5">Autoplay</label>
                                                                    <div className="flex items-center gap-2">
                                                                        <input type="range" min={0} max={15000} step={500} value={selectedWidget.data.autoplayMs ?? 4000} onChange={(e) => updateSelectedWidgetData({ autoplayMs: parseInt(e.target.value) })} className="flex-1 accent-primary" />
                                                                        <span className="text-[10px] font-mono text-primary min-w-[38px] text-right">{(selectedWidget.data.autoplayMs ?? 4000) / 1000}s</span>
                                                                    </div>
                                                                </div>
                                                                <div>
                                                                    <label className="text-[10px] font-bold text-foreground block mb-1.5">Transición</label>
                                                                    <select value={selectedWidget.data.effect || 'slide'} onChange={(e) => updateSelectedWidgetData({ effect: e.target.value })} className="w-full h-9 bg-background border border-border rounded-md px-3 text-xs font-medium outline-none">
                                                                        <option value="slide">Slide horizontal</option>
                                                                        <option value="fade">Fade</option>
                                                                        <option value="zoom">Zoom (Ken Burns)</option>
                                                                        <option value="cube">Cubo 3D</option>
                                                                    </select>
                                                                </div>
                                                            </div>
                                                            <div className="grid grid-cols-2 gap-3">
                                                                <div>
                                                                    <label className="text-[10px] font-bold text-foreground block mb-1.5">Ajuste imagen</label>
                                                                    <select value={selectedWidget.data.fit || 'cover'} onChange={(e) => updateSelectedWidgetData({ fit: e.target.value })} className="w-full h-9 bg-background border border-border rounded-md px-3 text-xs font-medium outline-none">
                                                                        <option value="cover">Cubrir</option>
                                                                        <option value="contain">Contener</option>
                                                                    </select>
                                                                </div>
                                                                <label className="flex items-center justify-between rounded-md border bg-background px-3 h-9 cursor-pointer">
                                                                    <span className="text-[11px] font-medium">Mostrar dots</span>
                                                                    <Switch checked={selectedWidget.data.showDots !== false} onCheckedChange={(v) => updateSelectedWidgetData({ showDots: v })} />
                                                                </label>
                                                            </div>
                                                        </div>
                                                        </div>
                                                    </div>
                                                )}

                                                {selectedWidget.type === 'QR_CODE' && (
                                                    <div className="space-y-4">
                                                        {/* Header */}
                                                        <div className="flex items-start gap-3 pb-3 border-b border-border">
                                                            <div className="size-9 rounded-lg bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
                                                                <Network className="size-4 text-emerald-500" />
                                                            </div>
                                                            <div>
                                                                <h4 className="text-sm font-bold text-foreground">Código QR</h4>
                                                                <p className="text-[10px] text-muted-foreground">Genera un QR escaneable con URL personalizada.</p>
                                                            </div>
                                                        </div>
                                                        {/* Grid 2-col */}
                                                        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">

                                                        {/* Contenido */}
                                                        <div className="rounded-lg border bg-card p-4 space-y-3">
                                                            <div className="flex items-center gap-2">
                                                                <Type className="size-3.5 text-muted-foreground" />
                                                                <h5 className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">Contenido</h5>
                                                            </div>
                                                            <div>
                                                                <div className="flex items-center gap-2 mb-1.5">
                                                                    <label className="text-[10px] font-bold text-foreground">Título</label>
                                                                    <Tooltip>
                                                                        <TooltipTrigger><Info className="size-3 text-muted-foreground" /></TooltipTrigger>
                                                                        <TooltipContent>Título que aparece encima del código QR.</TooltipContent>
                                                                    </Tooltip>
                                                                </div>
                                                                <input className="w-full h-9 bg-background border border-border rounded-md px-3 text-xs font-medium outline-none focus-visible:ring-2 focus-visible:ring-ring" value={selectedWidget.data.title || ''} onChange={(e) => updateSelectedWidgetData({ title: e.target.value })} placeholder='Ej: "Escanea nuestra carta"' />
                                                            </div>
                                                            <div>
                                                                <div className="flex items-center gap-2 mb-1.5">
                                                                    <label className="text-[10px] font-bold text-foreground">URL destino</label>
                                                                    <Tooltip>
                                                                        <TooltipTrigger><Info className="size-3 text-muted-foreground" /></TooltipTrigger>
                                                                        <TooltipContent>Dirección web que abrirá el smartphone al escanear.</TooltipContent>
                                                                    </Tooltip>
                                                                </div>
                                                                <input className="w-full h-9 bg-background border border-border rounded-md px-3 text-xs font-medium text-primary outline-none focus-visible:ring-2 focus-visible:ring-ring" value={selectedWidget.data.url || ''} onChange={(e) => updateSelectedWidgetData({ url: e.target.value })} placeholder="https://…" />
                                                            </div>
                                                        </div>

                                                        {/* Colores */}
                                                        <div className="rounded-lg border bg-card p-4 space-y-3">
                                                            <div className="flex items-center gap-2">
                                                                <Palette className="size-3.5 text-muted-foreground" />
                                                                <h5 className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">Colores</h5>
                                                            </div>
                                                            <div className="grid grid-cols-2 gap-3">
                                                                <div>
                                                                    <label className="text-[10px] font-bold text-foreground block mb-1.5">Color QR</label>
                                                                    <input type="color" value={selectedWidget.data.qrColor || '#000000'} onChange={(e) => updateSelectedWidgetData({ qrColor: e.target.value })} className="w-full h-9 rounded-md border border-border bg-background cursor-pointer" />
                                                                </div>
                                                                <div>
                                                                    <label className="text-[10px] font-bold text-foreground block mb-1.5">Fondo</label>
                                                                    <input type="color" value={selectedWidget.data.bgColor || '#ffffff'} onChange={(e) => updateSelectedWidgetData({ bgColor: e.target.value })} className="w-full h-9 rounded-md border border-border bg-background cursor-pointer" />
                                                                </div>
                                                            </div>
                                                        </div>
                                                        </div>
                                                    </div>
                                                )}



                                                {selectedWidget.type === 'NAV_BUTTON' && (
                                                    <NavButtonPanel selectedWidget={selectedWidget} updateSelectedWidgetData={updateSelectedWidgetData} savedLayouts={savedLayouts} />
                                                )}
                                                {selectedWidget.type === 'PRODUCT_LIST' && (
                                                    <div className="space-y-4">
                                                        {/* Header */}
                                                        <div className="flex items-start gap-3 pb-3 border-b border-border">
                                                            <div className="size-9 rounded-lg bg-orange-500/10 flex items-center justify-center flex-shrink-0">
                                                                <Utensils className="size-4 text-orange-500" />
                                                            </div>
                                                            <div>
                                                                <h4 className="text-sm font-bold text-foreground">Lista de Productos</h4>
                                                                <p className="text-[10px] text-muted-foreground">Carrusel de productos por categorías.</p>
                                                            </div>
                                                        </div>

                                                        {/* 3-column grid */}
                                                        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
                                                            {/* COL 1 · CONTENIDO */}
                                                            <div className="rounded-lg border bg-card overflow-hidden flex flex-col">
                                                                <div className="flex items-center gap-2 px-4 py-3 border-b bg-gradient-to-br from-sky-500/[0.05] to-transparent">
                                                                    <div className="size-8 rounded-md bg-sky-500/10 grid place-items-center text-sky-500"><ShoppingBag className="size-4" /></div>
                                                                    <div>
                                                                        <h3 className="text-[13px] font-bold leading-none">Contenido</h3>
                                                                        <p className="text-[10px] text-muted-foreground mt-0.5">Título y categorías visibles</p>
                                                                    </div>
                                                                </div>
                                                                <div className="p-4 space-y-3 flex-1">
                                                                    <div className="space-y-1.5">
                                                                        <Label className="text-[11px] text-muted-foreground">Título visible del menú</Label>
                                                                        <Input value={selectedWidget.data.title || ''} onChange={(e) => updateSelectedWidgetData({ title: e.target.value })} placeholder="Ej: NUESTRA CARTA" className="h-9 text-xs" />
                                                                    </div>
                                                                    <div className="space-y-1.5">
                                                                        <Label className="text-[11px] text-muted-foreground">Categorías a mostrar</Label>
                                                                        <div className="rounded-md border bg-background p-2 space-y-0.5 max-h-64 overflow-y-auto">
                                                                            {allCategories.length === 0 && (
                                                                                <div className="text-[11px] text-muted-foreground px-2 py-3 text-center">
                                                                                    No hay categorías. <a href="/admin/products" className="text-primary hover:underline">Crear</a>
                                                                                </div>
                                                                            )}
                                                                            {allCategories.map((cat) => {
                                                                                const catId = cat._id || cat.id;
                                                                                const checked = selectedWidget.data.categoriesToShow?.includes(catId) || false;
                                                                                return (
                                                                                    <label key={catId} className="flex items-center gap-2 cursor-pointer hover:bg-accent px-2 py-1.5 rounded text-[12px]">
                                                                                        <input
                                                                                            type="checkbox"
                                                                                            checked={checked}
                                                                                            onChange={(e) => {
                                                                                                const current: string[] = selectedWidget.data.categoriesToShow || [];
                                                                                                const next = e.target.checked ? [...current, catId] : current.filter((x: string) => x !== catId);
                                                                                                updateSelectedWidgetData({ categoriesToShow: next });
                                                                                            }}
                                                                                            className="size-3.5 rounded accent-primary"
                                                                                        />
                                                                                        {cat.photo && <img src={cat.photo} className="size-6 rounded object-cover shrink-0" />}
                                                                                        <span className="flex-1 truncate font-medium">{cat.name}</span>
                                                                                    </label>
                                                                                );
                                                                            })}
                                                                        </div>
                                                                        <p className="text-[10px] text-muted-foreground italic">Si no seleccionás ninguna, se muestran TODAS.</p>
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            {/* COL 2 · ESTILO */}
                                                            <div className="rounded-lg border bg-card overflow-hidden flex flex-col">
                                                                <div className="flex items-center gap-2 px-4 py-3 border-b bg-gradient-to-br from-violet-500/[0.05] to-transparent">
                                                                    <div className="size-8 rounded-md bg-violet-500/10 grid place-items-center text-violet-500"><Palette className="size-4" /></div>
                                                                    <div>
                                                                        <h3 className="text-[13px] font-bold leading-none">Estilo</h3>
                                                                        <p className="text-[10px] text-muted-foreground mt-0.5">Tema visual y disposición</p>
                                                                    </div>
                                                                </div>
                                                                <div className="p-4 space-y-3 flex-1">
                                                                    <div className="space-y-1.5">
                                                                        <Label className="text-[11px] text-muted-foreground">Tema visual</Label>
                                                                        <Select value={selectedWidget.data.theme || 'clean'} onValueChange={(v) => v && updateSelectedWidgetData({ theme: v })}>
                                                                            <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                                                                            <SelectContent>
                                                                                <SelectItem value="clean">Clean (Light)</SelectItem>
                                                                                <SelectItem value="dark">Dark</SelectItem>
                                                                                <SelectItem value="premium">Premium Gold</SelectItem>
                                                                                <SelectItem value="restaurant">Restaurant (Menú)</SelectItem>
                                                                                <SelectItem value="chalkboard">Chalkboard (Pizarra)</SelectItem>
                                                                            </SelectContent>
                                                                        </Select>
                                                                    </div>
                                                                    <div className="space-y-1.5">
                                                                        <Label className="text-[11px] text-muted-foreground">Disposición</Label>
                                                                        <Select value={selectedWidget.data.layout || 'carousel'} onValueChange={(v) => v && updateSelectedWidgetData({ layout: v })}>
                                                                            <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                                                                            <SelectContent>
                                                                                <SelectItem value="carousel">Carrusel horizontal</SelectItem>
                                                                                <SelectItem value="grid">Grilla</SelectItem>
                                                                                <SelectItem value="list">Lista vertical</SelectItem>
                                                                                <SelectItem value="menuCard">Carta (restaurant)</SelectItem>
                                                                            </SelectContent>
                                                                        </Select>
                                                                    </div>
                                                                    <div className="space-y-1.5">
                                                                        <Label className="text-[11px] text-muted-foreground">Tarjetas por vista</Label>
                                                                        <Select value={String(selectedWidget.data.cardsPerView || 3)} onValueChange={(v) => v && updateSelectedWidgetData({ cardsPerView: parseInt(v) })}>
                                                                            <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                                                                            <SelectContent>
                                                                                {[1,2,3,4,5,6].map(n => <SelectItem key={n} value={String(n)}>{n}</SelectItem>)}
                                                                            </SelectContent>
                                                                        </Select>
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            {/* COL 3 · COMPORTAMIENTO */}
                                                            <div className="rounded-lg border bg-card overflow-hidden flex flex-col">
                                                                <div className="flex items-center gap-2 px-4 py-3 border-b bg-gradient-to-br from-amber-500/[0.05] to-transparent">
                                                                    <div className="size-8 rounded-md bg-amber-500/10 grid place-items-center text-amber-500"><Settings2 className="size-4" /></div>
                                                                    <div>
                                                                        <h3 className="text-[13px] font-bold leading-none">Comportamiento</h3>
                                                                        <p className="text-[10px] text-muted-foreground mt-0.5">Autoplay y qué mostrar</p>
                                                                    </div>
                                                                </div>
                                                                <div className="p-4 space-y-3 flex-1">
                                                                    <div className="space-y-1.5">
                                                                        <div className="flex items-center justify-between">
                                                                            <Label className="text-[11px] text-muted-foreground">Autoplay del carrusel</Label>
                                                                            <span className="text-[10px] font-mono text-primary">{selectedWidget.data.autoplayMs ? (selectedWidget.data.autoplayMs / 1000) + 's' : 'off'}</span>
                                                                        </div>
                                                                        <input type="range" min={0} max={10000} step={500} value={selectedWidget.data.autoplayMs || 0} onChange={(e) => updateSelectedWidgetData({ autoplayMs: parseInt(e.target.value) })} className="w-full accent-primary" />
                                                                        <p className="text-[10px] text-muted-foreground italic">0 = manual · 1-10s = auto</p>
                                                                    </div>
                                                                    <div className="space-y-1.5 pt-2 border-t">
                                                                        <Label className="text-[11px] text-muted-foreground uppercase tracking-wider font-bold">Qué mostrar</Label>
                                                                        <label className="flex items-center justify-between rounded-md border bg-background px-3 py-2 cursor-pointer">
                                                                            <div>
                                                                                <div className="text-[12px] font-medium">Precio</div>
                                                                                <div className="text-[9px] text-muted-foreground">Bajo cada producto</div>
                                                                            </div>
                                                                            <Switch checked={selectedWidget.data.showPrice !== false} onCheckedChange={(v) => updateSelectedWidgetData({ showPrice: v })} />
                                                                        </label>
                                                                        <label className="flex items-center justify-between rounded-md border bg-background px-3 py-2 cursor-pointer">
                                                                            <div>
                                                                                <div className="text-[12px] font-medium">Descripción</div>
                                                                                <div className="text-[9px] text-muted-foreground">Ingredientes o notas</div>
                                                                            </div>
                                                                            <Switch checked={selectedWidget.data.showDescription === true} onCheckedChange={(v) => updateSelectedWidgetData({ showDescription: v })} />
                                                                        </label>
                                                                        <label className="flex items-center justify-between rounded-md border bg-background px-3 py-2 cursor-pointer">
                                                                            <div>
                                                                                <div className="text-[12px] font-medium">Agrupar categorías</div>
                                                                                <div className="text-[9px] text-muted-foreground">Un carrusel por cat.</div>
                                                                            </div>
                                                                            <Switch checked={selectedWidget.data.groupByCategory !== false} onCheckedChange={(v) => updateSelectedWidgetData({ groupByCategory: v })} />
                                                                        </label>
                                                                        <label className="flex items-center justify-between rounded-md border bg-background px-3 py-2 cursor-pointer">
                                                                            <div>
                                                                                <div className="text-[12px] font-medium">Header cat.</div>
                                                                                <div className="text-[9px] text-muted-foreground">Nombre + foto</div>
                                                                            </div>
                                                                            <Switch checked={selectedWidget.data.showCategoryHeader !== false} onCheckedChange={(v) => updateSelectedWidgetData({ showCategoryHeader: v })} />
                                                                        </label>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* Tip */}
                                                        <div className="rounded-md border border-blue-500/25 bg-blue-500/5 px-3 py-2 text-[11px] text-blue-800 dark:text-blue-300 flex items-start gap-2">
                                                            <Info className="size-3.5 mt-0.5 shrink-0" />
                                                            <div><b>Tip:</b> los productos se gestionan desde <a href="/admin/products" className="underline font-medium">Productos</a>. Se sincronizan automáticamente cada 30s.</div>
                                                        </div>
                                                    </div>
                                                )}

                                                {selectedWidget.type === 'ACTIVITIES' && (
                                                    <div className="space-y-4">
                                                        {/* Header */}
                                                        <div className="flex items-start gap-3 pb-3 border-b border-border">
                                                            <div className="size-9 rounded-lg bg-amber-500/10 flex items-center justify-center flex-shrink-0">
                                                                <Calendar className="size-4 text-amber-500" />
                                                            </div>
                                                            <div>
                                                                <h4 className="text-sm font-bold text-foreground">Agenda de Actividades</h4>
                                                                <p className="text-[10px] text-muted-foreground">Eventos programados desde la sección Cronograma.</p>
                                                            </div>
                                                        </div>

                                                        {/* Título */}
                                                        <div className="rounded-lg border bg-card p-4 space-y-3">
                                                            <div className="flex items-center gap-2">
                                                                <Type className="size-3.5 text-muted-foreground" />
                                                                <h5 className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">Título de la Agenda</h5>
                                                            </div>
                                                            <input
                                                                className="w-full h-9 bg-background border border-border rounded-md px-3 text-xs font-medium outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                                                value={selectedWidget.data.title || ''}
                                                                onChange={(e) => updateSelectedWidgetData({ title: e.target.value })}
                                                                placeholder='Ej: "EVENTOS DE HOY"'
                                                            />
                                                        </div>

                                                        {/* Filtro sección */}
                                                        <div className="rounded-lg border bg-card p-4 space-y-3">
                                                            <div className="flex items-center gap-2">
                                                                <Layers className="size-3.5 text-muted-foreground" />
                                                                <h5 className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">Sección a Mostrar</h5>
                                                                <Tooltip>
                                                                    <TooltipTrigger><Info className="size-3 text-muted-foreground" /></TooltipTrigger>
                                                                    <TooltipContent>Filtra por categoría o mostrá todas mezcladas.</TooltipContent>
                                                                </Tooltip>
                                                            </div>
                                                            <select
                                                                className="w-full h-9 bg-background border border-border rounded-md px-3 text-xs font-medium outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                                                value={selectedWidget.data.sectionToShow || 'ALL'}
                                                                onChange={(e) => updateSelectedWidgetData({ sectionToShow: e.target.value })}
                                                            >
                                                                <option value="ALL">Todas las secciones (mix)</option>
                                                                {Array.from(new Set(allActivities.map(a => a.category).filter(Boolean))).map((cat) => (
                                                                    <option key={cat} value={cat}>{cat.toUpperCase()}</option>
                                                                ))}
                                                            </select>
                                                        </div>

                                                        {/* Info gestión */}
                                                        <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-3 flex items-start gap-2.5">
                                                            <AlertCircle className="size-4 text-amber-500 flex-shrink-0 mt-0.5" />
                                                            <p className="text-[11px] text-muted-foreground leading-relaxed">
                                                                Las actividades se gestionan desde la sección <strong className="text-foreground">Cronograma</strong> en la barra lateral.
                                                            </p>
                                                        </div>
                                                    </div>
                                                )}

                                                {selectedWidget.type === 'WEATHER' && (
                                                    <div className="space-y-4">
                                                        {/* Header */}
                                                        <div className="flex items-start gap-3 pb-3 border-b border-border">
                                                            <div className="size-9 rounded-lg bg-cyan-500/10 flex items-center justify-center flex-shrink-0">
                                                                <Globe className="size-4 text-cyan-500" />
                                                            </div>
                                                            <div>
                                                                <h4 className="text-sm font-bold text-foreground">Clima en Vivo</h4>
                                                                <p className="text-[10px] text-muted-foreground">Temperatura y condiciones actuales por ciudad.</p>
                                                            </div>
                                                        </div>

                                                        {/* Ciudad */}
                                                        <div className="rounded-lg border bg-card p-4 space-y-3">
                                                            <div className="flex items-center gap-2">
                                                                <Search className="size-3.5 text-muted-foreground" />
                                                                <h5 className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">Ciudad</h5>
                                                                <Tooltip>
                                                                    <TooltipTrigger><Info className="size-3 text-muted-foreground" /></TooltipTrigger>
                                                                    <TooltipContent>Nombre de la ciudad, con o sin código de país. Ej: "Colonia, UY".</TooltipContent>
                                                                </Tooltip>
                                                            </div>
                                                            <input
                                                                className="w-full h-9 bg-background border border-border rounded-md px-3 text-xs font-medium outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                                                value={selectedWidget.data.city || ''}
                                                                onChange={(e) => updateSelectedWidgetData({ city: e.target.value })}
                                                                placeholder="Ej: Colonia del Sacramento, UY"
                                                            />
                                                        </div>

                                                        {/* Info */}
                                                        <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 flex items-start gap-2.5">
                                                            <Sparkles className="size-4 text-primary flex-shrink-0 mt-0.5" />
                                                            <p className="text-[11px] text-muted-foreground leading-relaxed">
                                                                Buscará automáticamente la ubicación y actualizará el clima cada cierto tiempo.
                                                            </p>
                                                        </div>

                                                        {/* Comportamiento */}
                                                        <div className="rounded-lg border bg-card p-4 space-y-3">
                                                            <div className="flex items-center gap-2">
                                                                <Settings2 className="size-3.5 text-muted-foreground" />
                                                                <h5 className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">Comportamiento</h5>
                                                            </div>
                                                            <div className="grid grid-cols-2 gap-3">
                                                                <div>
                                                                    <label className="text-[10px] font-bold text-foreground block mb-1.5">Unidad</label>
                                                                    <select value={selectedWidget.data.unit || 'celsius'} onChange={(e) => updateSelectedWidgetData({ unit: e.target.value })} className="w-full h-9 bg-background border border-border rounded-md px-3 text-xs font-medium outline-none">
                                                                        <option value="celsius">°C · Celsius</option>
                                                                        <option value="fahrenheit">°F · Fahrenheit</option>
                                                                    </select>
                                                                </div>
                                                                <div>
                                                                    <label className="text-[10px] font-bold text-foreground block mb-1.5">Refresco (min)</label>
                                                                    <input type="number" min={5} max={120} value={selectedWidget.data.refreshMinutes ?? 30} onChange={(e) => updateSelectedWidgetData({ refreshMinutes: parseInt(e.target.value) || 30 })} className="w-full h-9 bg-background border border-border rounded-md px-3 text-xs font-medium outline-none" />
                                                                </div>
                                                            </div>
                                                            <div className="grid grid-cols-2 gap-2">
                                                                <label className="flex items-center justify-between rounded-md border bg-background px-3 h-9 cursor-pointer">
                                                                    <span className="text-[11px] font-medium">Icono clima</span>
                                                                    <Switch checked={selectedWidget.data.showIcon !== false} onCheckedChange={(v) => updateSelectedWidgetData({ showIcon: v })} />
                                                                </label>
                                                                <label className="flex items-center justify-between rounded-md border bg-background px-3 h-9 cursor-pointer">
                                                                    <span className="text-[11px] font-medium">Pronóstico</span>
                                                                    <Switch checked={!!selectedWidget.data.showForecast} onCheckedChange={(v) => updateSelectedWidgetData({ showForecast: v })} />
                                                                </label>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}

                                                {selectedWidget.type === 'TICKER' && (
                                                    <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                                                        {/* Header */}
                                                        <div className="flex items-start gap-3 pb-3 border-b border-border">
                                                            <div className="size-9 rounded-lg bg-amber-500/10 flex items-center justify-center flex-shrink-0">
                                                                <Megaphone className="size-4 text-amber-500" />
                                                            </div>
                                                            <div>
                                                                <h4 className="text-sm font-bold text-foreground">Ticker de Mensajes</h4>
                                                                <p className="text-[10px] text-muted-foreground">Cinta desplazante con mensaje horizontal.</p>
                                                            </div>
                                                        </div>
                                                        {/* Grid 2-col */}
                                                        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">

                                                        {/* Mensaje */}
                                                        <div className="rounded-lg border bg-card p-4 space-y-3">
                                                            <div className="flex items-center gap-2">
                                                                <Type className="size-3.5 text-muted-foreground" />
                                                                <h5 className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">Mensaje</h5>
                                                                <Tooltip>
                                                                    <TooltipTrigger><Info className="size-3 text-muted-foreground" /></TooltipTrigger>
                                                                    <TooltipContent>Texto que se desplaza. Podés separar mensajes con • o —.</TooltipContent>
                                                                </Tooltip>
                                                            </div>
                                                            <textarea
                                                                value={selectedWidget.data.text || ''}
                                                                onChange={(e) => updateSelectedWidgetData({ text: e.target.value })}
                                                                placeholder="Escribí el mensaje que desplaza el ticker…"
                                                                className="w-full bg-background border border-border rounded-md p-3 text-xs font-medium text-foreground outline-none min-h-[100px] focus-visible:ring-2 focus-visible:ring-ring"
                                                            />
                                                        </div>

                                                        {/* Movimiento */}
                                                        <div className="rounded-lg border bg-card p-4 space-y-3">
                                                            <div className="flex items-center gap-2">
                                                                <Zap className="size-3.5 text-muted-foreground" />
                                                                <h5 className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">Movimiento & Estilo</h5>
                                                            </div>
                                                            <div className="grid grid-cols-2 gap-3">
                                                                <div>
                                                                    <div className="flex items-center gap-2 mb-1.5">
                                                                        <label className="text-[10px] font-bold text-foreground">Velocidad</label>
                                                                        <Tooltip>
                                                                            <TooltipTrigger><Info className="size-3 text-muted-foreground" /></TooltipTrigger>
                                                                            <TooltipContent>Segundos por vuelta. Menor = más rápido. Recomendado: 15-40.</TooltipContent>
                                                                        </Tooltip>
                                                                    </div>
                                                                    <input type="number" value={selectedWidget.data.speed} onChange={(e) => updateSelectedWidgetData({ speed: parseInt(e.target.value) })} className="w-full h-9 bg-background border border-border rounded-md px-3 text-xs font-medium outline-none focus-visible:ring-2 focus-visible:ring-ring" />
                                                                </div>
                                                                <div>
                                                                    <label className="text-[10px] font-bold text-foreground block mb-1.5">Fondo</label>
                                                                    <input type="color" value={selectedWidget.data.bgColor} onChange={(e) => updateSelectedWidgetData({ bgColor: e.target.value })} className="w-full h-9 rounded-md border border-border bg-background cursor-pointer" />
                                                                </div>
                                                            </div>
                                                        </div>
                                                        </div>
                                                    </div>
                                                )}

                                                {selectedWidget.type === 'COUNTDOWN' && (
                                                    <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                                                        {/* Header */}
                                                        <div className="flex items-start gap-3 pb-3 border-b border-border">
                                                            <div className="size-9 rounded-lg bg-rose-500/10 flex items-center justify-center flex-shrink-0">
                                                                <Clock className="size-4 text-rose-500" />
                                                            </div>
                                                            <div>
                                                                <h4 className="text-sm font-bold text-foreground">Cuenta Regresiva</h4>
                                                                <p className="text-[10px] text-muted-foreground">Tiempo restante hasta una fecha objetivo.</p>
                                                            </div>
                                                        </div>
                                                        {/* Grid 2-col */}
                                                        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">

                                                        {/* Objetivo */}
                                                        <div className="rounded-lg border bg-card p-4 space-y-3">
                                                            <div className="flex items-center gap-2">
                                                                <Calendar className="size-3.5 text-muted-foreground" />
                                                                <h5 className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">Fecha Objetivo</h5>
                                                                <Tooltip>
                                                                    <TooltipTrigger><Info className="size-3 text-muted-foreground" /></TooltipTrigger>
                                                                    <TooltipContent>Fecha y hora exactas hasta cuando cuenta. Zona horaria del navegador.</TooltipContent>
                                                                </Tooltip>
                                                            </div>
                                                            <input type="datetime-local" value={selectedWidget.data.targetDate?.substring(0, 16) || ''} onChange={(e) => updateSelectedWidgetData({ targetDate: e.target.value })} className="w-full h-9 bg-background border border-border rounded-md px-3 text-xs font-medium outline-none focus-visible:ring-2 focus-visible:ring-ring" />
                                                        </div>

                                                        {/* Textos */}
                                                        <div className="rounded-lg border bg-card p-4 space-y-3">
                                                            <div className="flex items-center gap-2">
                                                                <Type className="size-3.5 text-muted-foreground" />
                                                                <h5 className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">Textos</h5>
                                                            </div>
                                                            <div className="space-y-3">
                                                                <div>
                                                                    <div className="flex items-center gap-2 mb-1.5">
                                                                        <label className="text-[10px] font-bold text-foreground">Título superior</label>
                                                                        <Tooltip>
                                                                            <TooltipTrigger><Info className="size-3 text-muted-foreground" /></TooltipTrigger>
                                                                            <TooltipContent>Aparece arriba del contador. Ej: "Faltan para…"</TooltipContent>
                                                                        </Tooltip>
                                                                    </div>
                                                                    <input type="text" value={selectedWidget.data.title || ''} onChange={(e) => updateSelectedWidgetData({ title: e.target.value })} placeholder='Ej: "Inauguración en"' className="w-full h-9 bg-background border border-border rounded-md px-3 text-xs font-medium outline-none focus-visible:ring-2 focus-visible:ring-ring" />
                                                                </div>
                                                                <div>
                                                                    <div className="flex items-center gap-2 mb-1.5">
                                                                        <label className="text-[10px] font-bold text-foreground">Nombre del evento</label>
                                                                    </div>
                                                                    <input type="text" value={selectedWidget.data.subtitle || ''} onChange={(e) => updateSelectedWidgetData({ subtitle: e.target.value })} placeholder='Ej: "Fiesta de Fin de Año"' className="w-full h-9 bg-background border border-border rounded-md px-3 text-xs font-medium outline-none focus-visible:ring-2 focus-visible:ring-ring" />
                                                                </div>
                                                            </div>
                                                        </div>
                                                        </div>
                                                    </div>
                                                )}

                                                {selectedWidget.type === 'DATA_TABLE' && (
                                                    <div className="space-y-4">
                                                        {/* Header */}
                                                        <div className="flex items-start gap-3 pb-3 border-b border-border">
                                                            <div className="size-9 rounded-lg bg-teal-500/10 flex items-center justify-center flex-shrink-0">
                                                                <Database className="size-4 text-teal-500" />
                                                            </div>
                                                            <div>
                                                                <h4 className="text-sm font-bold text-foreground">Tabla de Datos</h4>
                                                                <p className="text-[10px] text-muted-foreground">Datos tabulados con columnas configurables.</p>
                                                            </div>
                                                        </div>

                                                        {/* Grid 3-col: Tabla | Tipografía | Columnas */}
                                                        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
                                                        {/* Table basics */}
                                                        <div className="rounded-lg border bg-card p-4 space-y-3">
                                                            <h4 className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">Tabla</h4>
                                                            <div className="grid grid-cols-2 gap-3">
                                                                <div className="space-y-1.5">
                                                                    <Label className="text-[11px]">Titulo</Label>
                                                                    <Input value={selectedWidget.data.title || ''} onChange={(e) => updateSelectedWidgetData({ title: e.target.value })} placeholder="Ej: Menu del dia" className="h-9" />
                                                                </div>
                                                                <div className="space-y-1.5">
                                                                    <Label className="text-[11px]">Tema visual</Label>
                                                                    <Select value={selectedWidget.data.theme || 'clean'} onValueChange={(v) => v && updateSelectedWidgetData({ theme: v })}>
                                                                        <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                                                                        <SelectContent>
                                                                            <SelectItem value="clean">Clean (Slate)</SelectItem>
                                                                            <SelectItem value="excel">Excel Green</SelectItem>
                                                                            <SelectItem value="dark">Dark</SelectItem>
                                                                            <SelectItem value="newspaper">Newspaper</SelectItem>
                                                                            <SelectItem value="premium">Premium Gold</SelectItem>
                                                                        </SelectContent>
                                                                    </Select>
                                                                </div>
                                                                <div className="space-y-1.5">
                                                                    <Label className="text-[11px]">Densidad</Label>
                                                                    <Select value={selectedWidget.data.density || 'compact'} onValueChange={(v) => v && updateSelectedWidgetData({ density: v })}>
                                                                        <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                                                                        <SelectContent>
                                                                            <SelectItem value="compact">Compacta</SelectItem>
                                                                            <SelectItem value="comfortable">Comoda</SelectItem>
                                                                            <SelectItem value="spacious">Espaciosa</SelectItem>
                                                                        </SelectContent>
                                                                    </Select>
                                                                </div>
                                                                <div className="flex items-center justify-between rounded-md border bg-background px-3 py-1.5">
                                                                    <Label className="text-[11px]">Filas alternadas</Label>
                                                                    <Switch checked={selectedWidget.data.striped !== false} onCheckedChange={(v) => updateSelectedWidgetData({ striped: v })} />
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* Tipografía */}
                                                        <div className="rounded-lg border bg-card p-4 space-y-3">
                                                            <h4 className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">Tipografía</h4>
                                                            <div className="grid grid-cols-3 gap-2">
                                                                <div className="space-y-1">
                                                                    <Label className="text-[11px]">Título (px)</Label>
                                                                    <Input type="number" min={8} max={64} value={selectedWidget.data.titleFontSize ?? 16} onChange={(e) => updateSelectedWidgetData({ titleFontSize: parseInt(e.target.value) })} className="h-9 text-sm" />
                                                                </div>
                                                                <div className="space-y-1">
                                                                    <Label className="text-[11px]">Header (px)</Label>
                                                                    <Input type="number" min={8} max={48} value={selectedWidget.data.headerFontSize ?? 12} onChange={(e) => updateSelectedWidgetData({ headerFontSize: parseInt(e.target.value) })} className="h-9 text-sm" />
                                                                </div>
                                                                <div className="space-y-1">
                                                                    <Label className="text-[11px]">Celdas (px)</Label>
                                                                    <Input type="number" min={8} max={40} value={selectedWidget.data.cellFontSize ?? 12} onChange={(e) => updateSelectedWidgetData({ cellFontSize: parseInt(e.target.value) })} className="h-9 text-sm" />
                                                                </div>
                                                            </div>
                                                            <div className="grid grid-cols-3 gap-2">
                                                                <div className="space-y-1">
                                                                    <Label className="text-[11px]">Color título</Label>
                                                                    <div className="flex items-center gap-2 rounded-md border bg-background px-2 h-9">
                                                                        <input type="color" value={selectedWidget.data.titleColor || '#ffffff'} onChange={(e) => updateSelectedWidgetData({ titleColor: e.target.value })} className="size-6 rounded cursor-pointer border-0 bg-transparent" />
                                                                        <span className="font-mono text-[10px] text-muted-foreground truncate">{selectedWidget.data.titleColor || '#ffffff'}</span>
                                                                    </div>
                                                                </div>
                                                                <div className="space-y-1">
                                                                    <Label className="text-[11px]">Color header</Label>
                                                                    <div className="flex items-center gap-2 rounded-md border bg-background px-2 h-9">
                                                                        <input type="color" value={selectedWidget.data.headerColor || '#ffffff'} onChange={(e) => updateSelectedWidgetData({ headerColor: e.target.value })} className="size-6 rounded cursor-pointer border-0 bg-transparent" />
                                                                        <span className="font-mono text-[10px] text-muted-foreground truncate">{selectedWidget.data.headerColor || '#ffffff'}</span>
                                                                    </div>
                                                                </div>
                                                                <div className="space-y-1">
                                                                    <Label className="text-[11px]">Color celdas</Label>
                                                                    <div className="flex items-center gap-2 rounded-md border bg-background px-2 h-9">
                                                                        <input type="color" value={selectedWidget.data.rowColor || '#0f172a'} onChange={(e) => updateSelectedWidgetData({ rowColor: e.target.value })} className="size-6 rounded cursor-pointer border-0 bg-transparent" />
                                                                        <span className="font-mono text-[10px] text-muted-foreground truncate">{selectedWidget.data.rowColor || '#0f172a'}</span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div className="space-y-1">
                                                                <Label className="text-[11px]">Fuente</Label>
                                                                <Select value={selectedWidget.data.fontFamily || 'system'} onValueChange={(v) => v && updateSelectedWidgetData({ fontFamily: v === 'system' ? undefined : v })}>
                                                                    <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                                                                    <SelectContent>
                                                                        <SelectItem value="system">Sistema (default)</SelectItem>
                                                                        <SelectItem value="Georgia, serif">Georgia (serif)</SelectItem>
                                                                        <SelectItem value="'Courier New', monospace">Courier (monospace)</SelectItem>
                                                                        <SelectItem value="'Helvetica Neue', Arial, sans-serif">Helvetica</SelectItem>
                                                                        <SelectItem value="'Times New Roman', serif">Times New Roman</SelectItem>
                                                                    </SelectContent>
                                                                </Select>
                                                            </div>
                                                        </div>

                                                        {/* Columns editor */}
                                                        <div className="rounded-lg border bg-card p-4 space-y-3">
                                                            <div className="flex items-center justify-between">
                                                                <h4 className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">Columnas ({(selectedWidget.data.columns || []).length})</h4>
                                                                <Button size="sm" variant="outline" className="h-7 text-[11px]" onClick={() => {
                                                                    const cols = [...(selectedWidget.data.columns || [])];
                                                                    cols.push({ key: 'col' + (cols.length + 1), label: 'Columna ' + (cols.length + 1), align: 'left' });
                                                                    updateSelectedWidgetData({ columns: cols });
                                                                }}>+ Columna</Button>
                                                            </div>
                                                            <div className="space-y-1.5">
                                                                {(selectedWidget.data.columns || []).map((col: any, i: number) => (
                                                                    <div key={i} className="grid grid-cols-[1fr_1fr_80px_80px_28px] gap-1.5 items-center">
                                                                        <Input value={col.key || ''} onChange={(e) => {
                                                                            const cols = [...(selectedWidget.data.columns || [])];
                                                                            cols[i] = { ...cols[i], key: e.target.value };
                                                                            updateSelectedWidgetData({ columns: cols });
                                                                        }} placeholder="clave" className="h-8 text-[11px] font-mono" />
                                                                        <Input value={col.label || ''} onChange={(e) => {
                                                                            const cols = [...(selectedWidget.data.columns || [])];
                                                                            cols[i] = { ...cols[i], label: e.target.value };
                                                                            updateSelectedWidgetData({ columns: cols });
                                                                        }} placeholder="Etiqueta" className="h-8 text-[11px]" />
                                                                        <Select value={col.align || 'left'} onValueChange={(v) => {
                                                                            if (!v) return;
                                                                            const cols = [...(selectedWidget.data.columns || [])];
                                                                            cols[i] = { ...cols[i], align: v };
                                                                            updateSelectedWidgetData({ columns: cols });
                                                                        }}>
                                                                            <SelectTrigger className="h-8 text-[11px]"><SelectValue /></SelectTrigger>
                                                                            <SelectContent>
                                                                                <SelectItem value="left">Izq</SelectItem>
                                                                                <SelectItem value="center">Centro</SelectItem>
                                                                                <SelectItem value="right">Der</SelectItem>
                                                                            </SelectContent>
                                                                        </Select>
                                                                        <Select value={col.isCurrency ? 'currency' : col.isNumber ? 'number' : 'text'} onValueChange={(v) => {
                                                                            if (!v) return;
                                                                            const cols = [...(selectedWidget.data.columns || [])];
                                                                            cols[i] = { ...cols[i], isNumber: v === 'number', isCurrency: v === 'currency' };
                                                                            updateSelectedWidgetData({ columns: cols });
                                                                        }}>
                                                                            <SelectTrigger className="h-8 text-[11px]"><SelectValue /></SelectTrigger>
                                                                            <SelectContent>
                                                                                <SelectItem value="text">Texto</SelectItem>
                                                                                <SelectItem value="number">Numero</SelectItem>
                                                                                <SelectItem value="currency">Moneda</SelectItem>
                                                                            </SelectContent>
                                                                        </Select>
                                                                        <Button size="sm" variant="ghost" className="size-7 text-destructive hover:bg-destructive/10" onClick={() => {
                                                                            const cols = (selectedWidget.data.columns || []).filter((_: any, j: number) => j !== i);
                                                                            updateSelectedWidgetData({ columns: cols });
                                                                        }}>×</Button>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>

                                                        </div>

                                                        {/* Rows editor */}
                                                        <div className="rounded-lg border bg-card p-4 space-y-3">
                                                            <div className="flex items-center justify-between">
                                                                <h4 className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">Filas ({(selectedWidget.data.rows || []).length})</h4>
                                                                <Button size="sm" variant="outline" className="h-7 text-[11px]" onClick={() => {
                                                                    const rows = [...(selectedWidget.data.rows || [])];
                                                                    const newRow: any = {};
                                                                    (selectedWidget.data.columns || []).forEach((c: any) => { newRow[c.key] = ''; });
                                                                    rows.push(newRow);
                                                                    updateSelectedWidgetData({ rows });
                                                                }}>+ Fila</Button>
                                                            </div>
                                                            <div className="rounded-md border overflow-hidden">
                                                                <table className="w-full text-[11px]">
                                                                    <thead className="bg-muted">
                                                                        <tr>
                                                                            {(selectedWidget.data.columns || []).map((c: any) => (
                                                                                <th key={c.key} className="px-2 py-1.5 text-left font-semibold text-[10px] uppercase tracking-wide text-muted-foreground">{c.label || c.key}</th>
                                                                            ))}
                                                                            <th className="w-8"></th>
                                                                        </tr>
                                                                    </thead>
                                                                    <tbody>
                                                                        {(selectedWidget.data.rows || []).map((row: any, i: number) => (
                                                                            <tr key={i} className={i % 2 === 1 ? 'bg-muted/30' : ''}>
                                                                                {(selectedWidget.data.columns || []).map((c: any) => (
                                                                                    <td key={c.key} className="p-0.5">
                                                                                        <input
                                                                                            value={row[c.key] ?? ''}
                                                                                            onChange={(e) => {
                                                                                                const rows = [...(selectedWidget.data.rows || [])];
                                                                                                const parsed = c.isNumber || c.isCurrency ? (parseFloat(e.target.value) || 0) : e.target.value;
                                                                                                rows[i] = { ...rows[i], [c.key]: parsed };
                                                                                                updateSelectedWidgetData({ rows });
                                                                                            }}
                                                                                            className={'w-full px-2 py-1 bg-transparent border-0 outline-none focus:bg-primary/5 rounded ' + (c.align === 'right' ? 'text-right font-mono tabular-nums' : c.align === 'center' ? 'text-center' : 'text-left')}
                                                                                            type={c.isNumber || c.isCurrency ? 'number' : 'text'}
                                                                                            step={c.isCurrency ? '0.01' : undefined}
                                                                                        />
                                                                                    </td>
                                                                                ))}
                                                                                <td className="px-1">
                                                                                    <button
                                                                                        onClick={() => {
                                                                                            const rows = (selectedWidget.data.rows || []).filter((_: any, j: number) => j !== i);
                                                                                            updateSelectedWidgetData({ rows });
                                                                                        }}
                                                                                        className="text-muted-foreground hover:text-destructive text-[14px]"
                                                                                    >×</button>
                                                                                </td>
                                                                            </tr>
                                                                        ))}
                                                                    </tbody>
                                                                </table>
                                                            </div>
                                                            <p className="text-[10px] text-muted-foreground">Editable como Excel: click en cualquier celda para editar. Los numeros/monedas se formatean automaticamente en el player.</p>
                                                        </div>
                                                    </div>
                                                )}

                                                {selectedWidget.type === 'ATMOSPHERE' && (
                                                    <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                                                        {/* Header */}
                                                        <div className="flex items-start gap-3 pb-3 border-b border-border">
                                                            <div className="size-9 rounded-lg bg-yellow-500/10 flex items-center justify-center flex-shrink-0">
                                                                <Sparkles className="size-4 text-yellow-500" />
                                                            </div>
                                                            <div>
                                                                <h4 className="text-sm font-bold text-foreground">Efecto Ambiental</h4>
                                                                <p className="text-[10px] text-muted-foreground">Partículas decorativas superpuestas en la pantalla.</p>
                                                            </div>
                                                        </div>
                                                        {/* Grid 2-col */}
                                                        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">

                                                        {/* Estilo */}
                                                        <div className="rounded-lg border bg-card p-4 space-y-3">
                                                            <div className="flex items-center gap-2">
                                                                <Palette className="size-3.5 text-muted-foreground" />
                                                                <h5 className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">Estilo</h5>
                                                            </div>
                                                            <div className="grid grid-cols-2 gap-2">
                                                                {['GOLD', 'SNOW', 'SOLAR', 'BUBBLES'].map(t => (
                                                                    <button
                                                                        key={t}
                                                                        onClick={() => updateSelectedWidgetData({ type: t })}
                                                                        className={`py-4 rounded-lg border text-[11px] font-bold transition-all ${selectedWidget.data.type === t ? 'bg-primary text-primary-foreground border-primary shadow-sm' : 'bg-background border-border text-foreground hover:border-primary/50 hover:bg-accent'}`}
                                                                    >
                                                                        {t}
                                                                    </button>
                                                                ))}
                                                            </div>
                                                        </div>

                                                        {/* Intensidad */}
                                                        <div className="rounded-lg border bg-card p-4 space-y-3">
                                                            <div className="flex items-center gap-2">
                                                                <Zap className="size-3.5 text-muted-foreground" />
                                                                <h5 className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">Intensidad</h5>
                                                                <span className="ml-auto text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">{selectedWidget.data.intensity}</span>
                                                            </div>
                                                            <input type="range" min="5" max="100" value={selectedWidget.data.intensity} onChange={(e) => updateSelectedWidgetData({ intensity: parseInt(e.target.value) })} className="w-full accent-primary" />
                                                        </div>
                                                        </div>
                                                    </div>
                                                )}

                                                {selectedWidget.type === 'MUSIC_PLAYER' && (
                                                    <div className="space-y-4">
                                                        {/* Header */}
                                                        <div className="flex items-start gap-3 pb-3 border-b border-border">
                                                            <div className="size-9 rounded-lg bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
                                                                <Music className="size-4 text-emerald-500" />
                                                            </div>
                                                            <div>
                                                                <h4 className="text-sm font-bold text-foreground">Reproductor de Música</h4>
                                                                <p className="text-[10px] text-muted-foreground">Spotify, Now Playing o vinilo animado.</p>
                                                            </div>
                                                        </div>
                                                        {/* 2-col grid */}
                                                        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                                                        <div className="rounded-lg border bg-card p-4 space-y-3">
                                                            <h4 className="text-[13px] font-bold flex items-center gap-1.5"><Music className="size-3.5 text-primary" /> Origen de la música</h4>
                                                            <div className="grid grid-cols-1 gap-2">
                                                                <label className="text-[11px] text-muted-foreground">Modo</label>
                                                                <select value={selectedWidget.data.provider || 'VINYL'} onChange={(e) => updateSelectedWidgetData({ provider: e.target.value })} className="w-full h-9 rounded-md border bg-background px-2 text-[12px]">
                                                                    <option value="SPOTIFY_LIVE">Now Playing (cuenta conectada)</option>
                                                                    <option value="SPOTIFY">Spotify Embed (playlist estática)</option>
                                                                    <option value="VINYL">Vinilo animado (título manual)</option>
                                                                </select>
                                                            </div>

                                                            {selectedWidget.data.provider === 'SPOTIFY_LIVE' && (
                                                                <div className="rounded-md border bg-emerald-500/5 border-emerald-500/30 p-3 text-[11px] space-y-1.5">
                                                                    <div className="flex items-center gap-1.5 font-semibold text-emerald-600 dark:text-emerald-400"><Music className="size-3" /> Modo Now Playing</div>
                                                                    <p className="text-muted-foreground">Consulta /api/spotify/current cada 5s y muestra la canción real de la cuenta conectada en <a href="/admin/settings/spotify" className="underline text-primary">Ajustes → Spotify</a>.</p>
                                                                    <div className="grid grid-cols-2 gap-2 pt-2">
                                                                        <div className="space-y-1">
                                                                            <label className="text-[11px] text-muted-foreground">Refresh (ms)</label>
                                                                            <input type="number" min={2000} step={1000} value={selectedWidget.data.refreshMs || 5000} onChange={(e) => updateSelectedWidgetData({ refreshMs: parseInt(e.target.value) })} className="w-full h-9 rounded-md border bg-background px-2 text-[12px] font-mono" />
                                                                        </div>
                                                                        <div className="space-y-1">
                                                                            <label className="text-[11px] text-muted-foreground">Color acento</label>
                                                                            <input type="color" value={selectedWidget.data.accentColor || '#1db954'} onChange={(e) => updateSelectedWidgetData({ accentColor: e.target.value })} className="w-full h-9 rounded-md border bg-background cursor-pointer" />
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            )}

                                                            {selectedWidget.data.provider === 'SPOTIFY' && (
                                                                <div className="space-y-2">
                                                                    <label className="text-[11px] text-muted-foreground">URL o URI del embed (playlist/track/album)</label>
                                                                    <input type="text" value={selectedWidget.data.spotifyEmbedUrl || ''} onChange={(e) => updateSelectedWidgetData({ spotifyEmbedUrl: e.target.value })} placeholder="https://open.spotify.com/playlist/…" className="w-full h-9 rounded-md border bg-background px-2 text-[11px] font-mono" />
                                                                    <div className="flex items-center gap-2">
                                                                        <label className="text-[11px] text-muted-foreground flex-1">Compacto</label>
                                                                        <input type="checkbox" checked={!!selectedWidget.data.compact} onChange={(e) => updateSelectedWidgetData({ compact: e.target.checked })} className="size-3.5 accent-primary" />
                                                                    </div>
                                                                </div>
                                                            )}

                                                            {(selectedWidget.data.provider === 'VINYL' || !selectedWidget.data.provider) && (
                                                                <div className="space-y-2">
                                                                    <div className="space-y-1">
                                                                        <label className="text-[11px] text-muted-foreground">Título de canción / show</label>
                                                                        <input type="text" value={selectedWidget.data.song || ''} onChange={(e) => updateSelectedWidgetData({ song: e.target.value })} placeholder="Ej: SUMMER MIX" className="w-full h-9 rounded-md border bg-background px-2 text-[12px]" />
                                                                    </div>
                                                                    <div className="space-y-1">
                                                                        <label className="text-[11px] text-muted-foreground">Créditos / Artista</label>
                                                                        <input type="text" value={selectedWidget.data.artist || ''} onChange={(e) => updateSelectedWidgetData({ artist: e.target.value })} placeholder="Ej: ALTOS DEL ARAPEY RADIO" className="w-full h-9 rounded-md border bg-background px-2 text-[12px]" />
                                                                    </div>
                                                                    <div className="space-y-1">
                                                                        <label className="text-[11px] text-muted-foreground">URL de portada</label>
                                                                        <input type="text" value={selectedWidget.data.cover || ''} onChange={(e) => updateSelectedWidgetData({ cover: e.target.value })} className="w-full h-9 rounded-md border bg-background px-2 text-[11px] font-mono" />
                                                                    </div>
                                                                    <div className="space-y-1">
                                                                        <label className="text-[11px] text-muted-foreground">Color visualizer</label>
                                                                        <input type="color" value={selectedWidget.data.accentColor || '#10b981'} onChange={(e) => updateSelectedWidgetData({ accentColor: e.target.value })} className="w-full h-9 rounded-md border bg-background cursor-pointer" />
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    
                                                        <div className="rounded-lg border bg-card p-4 space-y-3">
                                                            <h4 className="text-[13px] font-bold flex items-center gap-1.5">
                                                                <span className="size-6 rounded-md grid place-items-center bg-emerald-500/10 text-emerald-500">✱</span>
                                                                Comportamiento
                                                            </h4>
                                                            <div className="flex items-center justify-between rounded-md border bg-background px-3 h-9">
                                                                <div className="flex-1">
                                                                    <label className="text-[12px] font-semibold cursor-pointer">Persistente entre interfaces</label>
                                                                    <p className="text-[10px] text-muted-foreground">La música sigue sonando al cambiar de layout</p>
                                                                </div>
                                                                <Switch checked={!!selectedWidget.data.persistent} onCheckedChange={(v) => updateSelectedWidgetData({ persistent: v })} />
                                                            </div>
                                                            {selectedWidget.data.persistent && (
                                                                <div className="space-y-2 rounded-md border bg-primary/[0.03] p-3">
                                                                    <div className="flex items-center justify-between">
                                                                        <label className="text-[11px] text-muted-foreground">Compacto (barra flotante)</label>
                                                                        <Switch checked={selectedWidget.data.compact !== false} onCheckedChange={(v) => updateSelectedWidgetData({ compact: v })} />
                                                                    </div>
                                                                    <div className="space-y-1">
                                                                        <label className="text-[11px] text-muted-foreground">Posición en pantalla</label>
                                                                        <div className="grid grid-cols-2 gap-1">
                                                                            {['top-left','top-right','bottom-left','bottom-right'].map((pos) => (
                                                                                <button
                                                                                    key={pos}
                                                                                    onClick={() => updateSelectedWidgetData({ floatPosition: pos })}
                                                                                    className={'h-8 rounded-md border text-[10px] font-semibold transition-colors ' + ((selectedWidget.data.floatPosition || 'bottom-right') === pos ? 'border-primary bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-accent')}
                                                                                >
                                                                                    {pos === 'top-left' ? '↖ Arriba izq.' : pos === 'top-right' ? '↗ Arriba der.' : pos === 'bottom-left' ? '↙ Abajo izq.' : '↘ Abajo der.'}
                                                                                </button>
                                                                            ))}
                                                                        </div>
                                                                    </div>
                                                                    <p className="text-[10px] italic text-muted-foreground pt-1 border-t">
                                                                        En modo persistente, el widget aparece flotando en la esquina elegida sobre TODAS las interfaces del player, sin cortarse al cambiar.
                                                                    </p>
                                                                </div>
                                                            )}
                                                        </div>
                                                        </div>
                                                    </div>
                                                )}

                                                {selectedWidget.type === 'SENSOR_VALUE' && (
                                                    <SensorValuePanel selectedWidget={selectedWidget} updateSelectedWidgetData={updateSelectedWidgetData} savedLayouts={savedLayouts} allSensors={allSensors} />
                                                )}
                                                {selectedWidget.type === 'FLIGHT_BOARD' && (
                                                    <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                                                        {/* Header */}
                                                        <div className="flex items-start gap-3 pb-3 border-b border-border">
                                                            <div className="size-9 rounded-lg bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                                                                <PlaneTakeoff className="size-4 text-blue-500" />
                                                            </div>
                                                            <div>
                                                                <h4 className="text-sm font-bold text-foreground">Tablero de Vuelos</h4>
                                                                <p className="text-[10px] text-muted-foreground">Estilo aeropuerto con salidas o llegadas.</p>
                                                            </div>
                                                        </div>

                                                        {/* Configuración */}
                                                        <div className="rounded-lg border bg-card p-4 space-y-3">
                                                            <div className="flex items-center gap-2">
                                                                <Layers className="size-3.5 text-muted-foreground" />
                                                                <h5 className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">Tipo de Tablero</h5>
                                                            </div>
                                                            <select value={selectedWidget.data.type} onChange={(e) => updateSelectedWidgetData({ type: e.target.value })} className="w-full h-9 bg-background border border-border rounded-md px-3 text-xs font-medium outline-none focus-visible:ring-2 focus-visible:ring-ring">
                                                                <option value="DEPARTURES">Salidas</option>
                                                                <option value="ARRIVALS">Llegadas</option>
                                                            </select>
                                                        </div>
                                                    </div>
                                                )}

                                                {selectedWidget.type === 'SOCIAL_FEED' && (
                                                    <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                                                        {/* Header */}
                                                        <div className="flex items-start gap-3 pb-3 border-b border-border">
                                                            <div className="size-9 rounded-lg bg-pink-500/10 flex items-center justify-center flex-shrink-0">
                                                                <Instagram className="size-4 text-pink-500" />
                                                            </div>
                                                            <div>
                                                                <h4 className="text-sm font-bold text-foreground">Feed Social</h4>
                                                                <p className="text-[10px] text-muted-foreground">Rotación entre Instagram y reseñas de TripAdvisor.</p>
                                                            </div>
                                                        </div>

                                                        {/* Intervalo */}
                                                        <div className="rounded-lg border bg-card p-4 space-y-3">
                                                            <div className="flex items-center gap-2">
                                                                <Clock className="size-3.5 text-muted-foreground" />
                                                                <h5 className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">Rotación</h5>
                                                                <Tooltip>
                                                                    <TooltipTrigger><Info className="size-3 text-muted-foreground" /></TooltipTrigger>
                                                                    <TooltipContent>Milisegundos entre cambio de post. Mínimo recomendado 5000.</TooltipContent>
                                                                </Tooltip>
                                                            </div>
                                                            <input type="number" step="1000" min="3000" value={selectedWidget.data.interval} onChange={(e) => updateSelectedWidgetData({ interval: parseInt(e.target.value) })} className="w-full h-9 bg-background border border-border rounded-md px-3 text-xs font-medium outline-none focus-visible:ring-2 focus-visible:ring-ring" />
                                                        </div>

                                                        {/* Info */}
                                                        <div className="rounded-lg border border-pink-500/20 bg-pink-500/5 p-3 flex items-start gap-2.5">
                                                            <Instagram className="size-4 text-pink-500 flex-shrink-0 mt-0.5" />
                                                            <p className="text-[11px] text-muted-foreground leading-relaxed">
                                                                Alterna automáticamente entre las últimas fotos de Instagram y reseñas premium de TripAdvisor.
                                                            </p>
                                                        </div>
                                                    </div>
                                                )}

                                                {selectedWidget.type === 'PRICE_LIST' && (
                                                    <div className="space-y-4">
                                                        {/* Header */}
                                                        <div className="flex items-start gap-3 pb-3 border-b border-border">
                                                            <div className="size-9 rounded-lg bg-amber-500/10 flex items-center justify-center flex-shrink-0">
                                                                <ShoppingBag className="size-4 text-amber-500" />
                                                            </div>
                                                            <div>
                                                                <h4 className="text-sm font-bold text-foreground">Lista de Precios</h4>
                                                                <p className="text-[10px] text-muted-foreground">Ítems con nombre, precio y descripción.</p>
                                                            </div>
                                                        </div>

                                                        {/* 3-col grid */}
                                                        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
                                                        {/* Contenido */}
                                                        <div className="rounded-lg border bg-card p-4 space-y-3">
                                                            <div className="flex items-center gap-2">
                                                                <Type className="size-3.5 text-muted-foreground" />
                                                                <h5 className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">Título</h5>
                                                            </div>
                                                            <input
                                                                className="w-full h-9 bg-background border border-border rounded-md px-3 text-xs font-medium outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                                                value={selectedWidget.data.title || ''}
                                                                onChange={(e) => updateSelectedWidgetData({ title: e.target.value })}
                                                                placeholder='Ej: "LISTA DE PRECIOS"'
                                                            />
                                                        </div>

                                                        {/* Items */}
                                                        <div className="rounded-lg border bg-card p-4 space-y-3">
                                                            <div className="flex items-center justify-between">
                                                                <div className="flex items-center gap-2">
                                                                    <Database className="size-3.5 text-muted-foreground" />
                                                                    <h5 className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">Ítems</h5>
                                                                    <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">{selectedWidget.data.items?.length || 0}</span>
                                                                </div>
                                                                <button
                                                                    onClick={() => updateSelectedWidgetData({ items: [...(selectedWidget.data.items || []), { name: 'Item Nuevo', price: '$0.00', description: '' }] })}
                                                                    className="h-8 px-3 rounded-md bg-primary text-primary-foreground text-[10px] font-bold hover:bg-primary/90 transition-colors flex items-center gap-1.5"
                                                                >
                                                                    <Plus className="size-3.5" /> Agregar
                                                                </button>
                                                            </div>
                                                            <div className="space-y-2 max-h-[320px] overflow-y-auto pr-1 custom-scrollbar">
                                                                {selectedWidget.data.items?.map((item: any, idx: number) => (
                                                                    <div key={idx} className="bg-background/60 p-3 rounded-md border border-border/60 space-y-2">
                                                                        <div className="flex gap-2">
                                                                            <input
                                                                                className="flex-1 h-9 bg-background border border-border rounded-md px-3 text-xs font-medium outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                                                                placeholder="Nombre del ítem"
                                                                                value={item.name || ''}
                                                                                onChange={(e) => { const newItems = [...selectedWidget.data.items]; newItems[idx].name = e.target.value; updateSelectedWidgetData({ items: newItems }); }}
                                                                            />
                                                                            <input
                                                                                className="w-24 h-9 bg-background border border-border rounded-md px-3 text-xs font-bold text-primary outline-none"
                                                                                placeholder="$0"
                                                                                value={item.price || ''}
                                                                                onChange={(e) => { const newItems = [...selectedWidget.data.items]; newItems[idx].price = e.target.value; updateSelectedWidgetData({ items: newItems }); }}
                                                                            />
                                                                        </div>
                                                                        <textarea
                                                                            className="w-full bg-background border border-border rounded-md px-3 py-2 text-[11px] text-muted-foreground outline-none h-12 resize-none"
                                                                            placeholder="Descripción (opcional)"
                                                                            value={item.description || ''}
                                                                            onChange={(e) => { const newItems = [...selectedWidget.data.items]; newItems[idx].description = e.target.value; updateSelectedWidgetData({ items: newItems }); }}
                                                                        />
                                                                        <div className="flex justify-end">
                                                                            <button
                                                                                onClick={() => { const newItems = selectedWidget.data.items.filter((_: any, i: number) => i !== idx); updateSelectedWidgetData({ items: newItems }); }}
                                                                                className="text-destructive/60 hover:text-destructive transition-colors flex items-center gap-1 text-[10px] font-bold"
                                                                            >
                                                                                <Trash2 className="size-3" /> Eliminar
                                                                            </button>
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>

                                                        {/* Tipografía y colores PRICE_LIST */}
                                                        <div className="rounded-lg border bg-card p-4 space-y-3">
                                                            <h4 className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">Tipografía y estilo</h4>
                                                            <div className="grid grid-cols-2 gap-2">
                                                                <div className="space-y-1">
                                                                    <Label className="text-[11px]">Tema</Label>
                                                                    <Select value={selectedWidget.data.theme || 'default'} onValueChange={(v) => v && updateSelectedWidgetData({ theme: v })}>
                                                                        <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                                                                        <SelectContent>
                                                                            <SelectItem value="default">Default (moderno)</SelectItem>
                                                                            <SelectItem value="minimal">Minimal (sin fotos)</SelectItem>
                                                                            <SelectItem value="elegant">Elegant (serif)</SelectItem>
                                                                            <SelectItem value="restaurant">Restaurant (menú)</SelectItem>
                                                                        </SelectContent>
                                                                    </Select>
                                                                </div>
                                                                <div className="space-y-1">
                                                                    <Label className="text-[11px]">Alineación</Label>
                                                                    <Select value={selectedWidget.data.alignment || 'left'} onValueChange={(v) => v && updateSelectedWidgetData({ alignment: v })}>
                                                                        <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                                                                        <SelectContent>
                                                                            <SelectItem value="left">Izquierda</SelectItem>
                                                                            <SelectItem value="center">Centro</SelectItem>
                                                                            <SelectItem value="right">Derecha</SelectItem>
                                                                        </SelectContent>
                                                                    </Select>
                                                                </div>
                                                            </div>
                                                            <div className="grid grid-cols-4 gap-2">
                                                                <div className="space-y-1">
                                                                    <Label className="text-[11px]">Título (px)</Label>
                                                                    <Input type="number" min={12} max={72} value={selectedWidget.data.titleFontSize ?? 30} onChange={(e) => updateSelectedWidgetData({ titleFontSize: parseInt(e.target.value) })} className="h-9 text-sm" />
                                                                </div>
                                                                <div className="space-y-1">
                                                                    <Label className="text-[11px]">Item (px)</Label>
                                                                    <Input type="number" min={10} max={48} value={selectedWidget.data.itemNameFontSize ?? 20} onChange={(e) => updateSelectedWidgetData({ itemNameFontSize: parseInt(e.target.value) })} className="h-9 text-sm" />
                                                                </div>
                                                                <div className="space-y-1">
                                                                    <Label className="text-[11px]">Precio (px)</Label>
                                                                    <Input type="number" min={10} max={48} value={selectedWidget.data.priceFontSize ?? 24} onChange={(e) => updateSelectedWidgetData({ priceFontSize: parseInt(e.target.value) })} className="h-9 text-sm" />
                                                                </div>
                                                                <div className="space-y-1">
                                                                    <Label className="text-[11px]">Desc (px)</Label>
                                                                    <Input type="number" min={8} max={24} value={selectedWidget.data.descFontSize ?? 12} onChange={(e) => updateSelectedWidgetData({ descFontSize: parseInt(e.target.value) })} className="h-9 text-sm" />
                                                                </div>
                                                            </div>
                                                            <div className="grid grid-cols-4 gap-2">
                                                                {[
                                                                    { key: 'titleColor',    label: 'Título',  dflt: '#f59e0b' },
                                                                    { key: 'itemNameColor', label: 'Item',    dflt: '#ffffff' },
                                                                    { key: 'priceColor',    label: 'Precio',  dflt: '#f59e0b' },
                                                                    { key: 'descColor',     label: 'Desc.',   dflt: '#a1a1aa' },
                                                                ].map(f => (
                                                                    <div key={f.key} className="space-y-1">
                                                                        <Label className="text-[11px]">{f.label}</Label>
                                                                        <div className="flex items-center gap-2 rounded-md border bg-background px-2 h-9">
                                                                            <input type="color" value={selectedWidget.data[f.key] || f.dflt} onChange={(e) => updateSelectedWidgetData({ [f.key]: e.target.value })} className="size-6 rounded cursor-pointer border-0 bg-transparent" />
                                                                            <span className="font-mono text-[10px] text-muted-foreground truncate">{selectedWidget.data[f.key] || f.dflt}</span>
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                            <div className="grid grid-cols-2 gap-2">
                                                                <div className="space-y-1">
                                                                    <Label className="text-[11px]">Fuente</Label>
                                                                    <Select value={selectedWidget.data.fontFamily || 'system'} onValueChange={(v) => v && updateSelectedWidgetData({ fontFamily: v === 'system' ? undefined : v })}>
                                                                        <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                                                                        <SelectContent>
                                                                            <SelectItem value="system">Sistema</SelectItem>
                                                                            <SelectItem value="Georgia, serif">Georgia (serif)</SelectItem>
                                                                            <SelectItem value="'Times New Roman', serif">Times New Roman</SelectItem>
                                                                            <SelectItem value="'Helvetica Neue', Arial, sans-serif">Helvetica</SelectItem>
                                                                            <SelectItem value="'Courier New', monospace">Courier</SelectItem>
                                                                        </SelectContent>
                                                                    </Select>
                                                                </div>
                                                                <div className="flex items-center justify-between rounded-md border bg-background px-3 h-9 mt-5">
                                                                    <Label className="text-[11px]">Separador debajo del título</Label>
                                                                    <Switch checked={selectedWidget.data.showDivider !== false} onCheckedChange={(v) => updateSelectedWidgetData({ showDivider: v })} />
                                                                </div>
                                                            </div>
                                                        </div>
                                                        </div>
                                                    </div>
                                                )}

                                                {selectedWidget.type === 'DATE_TIME' && (
                                                    <div className="space-y-4">
                                                        {/* Header */}
                                                        <div className="flex items-start gap-3 pb-3 border-b border-border">
                                                            <div className="size-9 rounded-lg bg-indigo-500/10 flex items-center justify-center flex-shrink-0">
                                                                <Calendar className="size-4 text-indigo-500" />
                                                            </div>
                                                            <div>
                                                                <h4 className="text-sm font-bold text-foreground">Fecha y Hora</h4>
                                                                <p className="text-[10px] text-muted-foreground">Reloj en vivo con estilo personalizable.</p>
                                                            </div>
                                                        </div>
                                                        {/* Grid 3-col */}
                                                        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">

                                                        {/* Estilo visual */}
                                                        <div className="rounded-lg border bg-card p-4 space-y-3">
                                                            <div className="flex items-center gap-2">
                                                                <Palette className="size-3.5 text-muted-foreground" />
                                                                <h5 className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">Estilo Visual</h5>
                                                            </div>
                                                            <div>
                                                                <div className="flex items-center gap-2 mb-1.5">
                                                                    <label className="text-[10px] font-bold text-foreground">Preset</label>
                                                                    <Tooltip>
                                                                        <TooltipTrigger><Info className="size-3 text-muted-foreground" /></TooltipTrigger>
                                                                        <TooltipContent>Elige entre variantes minimalistas, glass, neón, retro o serif.</TooltipContent>
                                                                    </Tooltip>
                                                                </div>
                                                                <select
                                                                    className="w-full h-9 bg-background border border-border rounded-md px-3 text-xs font-medium text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                                                    value={selectedWidget.data.style || 'minimal'}
                                                                    onChange={(e) => updateSelectedWidgetData({ style: e.target.value })}
                                                                >
                                                                    <option value="minimal">Minimalista</option>
                                                                    <option value="card">Tarjeta Glass</option>
                                                                    <option value="neon">Neón Glow</option>
                                                                    <option value="ios">Sleek iOS</option>
                                                                    <option value="retro">Digital Retro</option>
                                                                    <option value="elegant">Serif Elegante</option>
                                                                </select>
                                                            </div>
                                                        </div>

                                                        {/* Formato & color */}
                                                        <div className="rounded-lg border bg-card p-4 space-y-3">
                                                            <div className="flex items-center gap-2">
                                                                <Clock className="size-3.5 text-muted-foreground" />
                                                                <h5 className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">Formato & Color</h5>
                                                            </div>
                                                            <div className="grid grid-cols-2 gap-3">
                                                                <div>
                                                                    <label className="text-[10px] font-bold text-foreground block mb-1.5">Formato hora</label>
                                                                    <select
                                                                        className="w-full h-9 bg-background border border-border rounded-md px-3 text-xs font-medium outline-none"
                                                                        value={selectedWidget.data.format || '24'}
                                                                        onChange={(e) => updateSelectedWidgetData({ format: e.target.value })}
                                                                    >
                                                                        <option value="24">24 Horas</option>
                                                                        <option value="12">12 Horas (AM/PM)</option>
                                                                    </select>
                                                                </div>
                                                                <div>
                                                                    <label className="text-[10px] font-bold text-foreground block mb-1.5">Color texto</label>
                                                                    <input
                                                                        type="color"
                                                                        className="w-full h-9 rounded-md border border-border bg-background cursor-pointer"
                                                                        value={selectedWidget.data.color || '#ffffff'}
                                                                        onChange={(e) => updateSelectedWidgetData({ color: e.target.value })}
                                                                    />
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* Mostrar */}
                                                        <div className="rounded-lg border bg-card p-4 space-y-2">
                                                            <div className="flex items-center gap-2 mb-1">
                                                                <Eye className="size-3.5 text-muted-foreground" />
                                                                <h5 className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">Elementos Visibles</h5>
                                                            </div>
                                                            <label className="flex items-center gap-3 cursor-pointer group py-1.5 rounded-md hover:bg-muted/40 px-2 -mx-2 transition-colors">
                                                                <input
                                                                    type="checkbox"
                                                                    className="w-4 h-4 rounded bg-background border-border checked:bg-primary accent-primary"
                                                                    checked={selectedWidget.data.showDate !== false}
                                                                    onChange={(e) => updateSelectedWidgetData({ showDate: e.target.checked })}
                                                                />
                                                                <span className="text-xs font-medium text-foreground">Mostrar fecha</span>
                                                            </label>
                                                            <label className="flex items-center gap-3 cursor-pointer group py-1.5 rounded-md hover:bg-muted/40 px-2 -mx-2 transition-colors">
                                                                <input
                                                                    type="checkbox"
                                                                    className="w-4 h-4 rounded bg-background border-border checked:bg-primary accent-primary"
                                                                    checked={selectedWidget.data.showSeconds !== false}
                                                                    onChange={(e) => updateSelectedWidgetData({ showSeconds: e.target.checked })}
                                                                />
                                                                <span className="text-xs font-medium text-foreground">Mostrar segundos</span>
                                                            </label>
                                                        </div>
                                                        </div>
                                                    </div>
                                                )}
                                                
                                            </div>
                                            )}

                                            {selectedWidget.type === 'CATEGORY_NAV' && (
                                                <CategoryNavPanel
                                                    widget={selectedWidget}
                                                    onUpdateData={updateSelectedWidgetData}
                                                    onUpdatePos={updateSelectedWidgetPos}
                                                    onUpdateSize={updateSelectedWidgetSize}
                                                    onLayerUp={moveLayerUp}
                                                    onLayerDown={moveLayerDown}
                                                    onLayerFront={bringToFrontWidget}
                                                    onLayerBack={sendToBackWidget}
                                                    savedLayouts={savedLayouts}
                                                />
                                            )}
                                        </section>


                                    </div>
                                </div>
                            ) : (
                                <div className="flex-1 flex flex-col min-h-0 p-5 gap-4 w-full overflow-y-auto">
                                    {/* Canvas props — 3 column grid */}
                                    <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
                                <div className="rounded-lg border bg-card overflow-hidden flex flex-col">
                                    <div className="flex items-center gap-2 px-4 py-3 border-b bg-gradient-to-br from-primary/[0.03] to-transparent">
                                        <div className="size-8 rounded-md bg-primary/10 grid place-items-center text-primary"><ImageIcon className="size-4" /></div>
                                        <div>
                                            <h3 className="text-[13px] font-bold leading-none">Fondo multimedia</h3>
                                            <p className="text-[10px] text-muted-foreground mt-0.5">Color, foto o video de fondo</p>
                                        </div>
                                    </div>
                                    <div className="p-4 space-y-3 flex-1 overflow-y-auto">
                                        <TooltipProvider>
                                                <TooltipProvider>
                                                    {/* Big color picker card with preview */}
                                                    <div className="rounded-lg border bg-card overflow-hidden">
                                                        <div className="p-4 flex items-center gap-3">
                                                            <label className="relative size-16 rounded-lg border-2 overflow-hidden shrink-0 cursor-pointer" style={{ backgroundColor }}>
                                                                <input type="color" value={backgroundColor} onChange={(e) => setBackgroundColor(e.target.value)}
                                                                    className="absolute inset-0 opacity-0 cursor-pointer" />
                                                            </label>
                                                            <div className="min-w-0 flex-1">
                                                                <Label className="text-[13px] font-semibold flex items-center gap-1.5">
                                                                    <Palette className="size-3.5 text-primary" /> Color de fondo sólido
                                                                    <Tooltip><TooltipTrigger><Info className="size-3 text-muted-foreground" /></TooltipTrigger><TooltipContent>Color base cuando no hay imagen ni video</TooltipContent></Tooltip>
                                                                </Label>
                                                                <div className="flex items-center gap-2 mt-1.5">
                                                                    <Input value={backgroundColor} onChange={(e) => setBackgroundColor(e.target.value)} className="h-8 font-mono text-[12px] w-32" />
                                                                    <button onClick={() => setBackgroundColor('#000000')} className="text-[11px] text-muted-foreground hover:text-foreground px-2 py-1 rounded hover:bg-accent">Negro</button>
                                                                    <button onClick={() => setBackgroundColor('#ffffff')} className="text-[11px] text-muted-foreground hover:text-foreground px-2 py-1 rounded hover:bg-accent">Blanco</button>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Media background — pro redesign */}
                                                    <div className="rounded-lg border bg-card overflow-hidden">
                                                        {/* Header */}
                                                        <div className="px-4 pt-3.5 pb-3 border-b bg-gradient-to-br from-primary/[0.03] to-transparent">
                                                            <div className="flex items-center justify-between">
                                                                <Label className="text-[13px] font-bold flex items-center gap-1.5">
                                                                    <span className="size-6 rounded-md grid place-items-center bg-primary/10 text-primary"><ImageIcon className="size-3.5" /></span>
                                                                    Fondo multimedia
                                                                </Label>
                                                                {(backgroundImage || backgroundVideo) && (
                                                                    <Tooltip>
                                                                        <TooltipTrigger>
                                                                            <button
                                                                                onClick={() => { setBackgroundImage(''); setBackgroundVideo(''); }}
                                                                                className="size-7 rounded-md grid place-items-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                                                                            >
                                                                                <Trash2 className="size-3.5" />
                                                                            </button>
                                                                        </TooltipTrigger>
                                                                        <TooltipContent>Quitar fondo actual</TooltipContent>
                                                                    </Tooltip>
                                                                )}
                                                            </div>
                                                        </div>

                                                        <div className="px-4 pt-3">
                                                            {(backgroundImage || backgroundVideo) ? (
                                                                <div className="relative rounded-md overflow-hidden border bg-black" style={{ maxHeight: '160px' }}>
                                                                    <div className="aspect-video max-h-[160px]">
                                                                        {backgroundImage ? (
                                                                            <img src={backgroundImage} className="w-full h-full object-cover" alt="" />
                                                                        ) : (
                                                                            <video src={backgroundVideo} className="w-full h-full object-cover" autoPlay muted loop playsInline />
                                                                        )}
                                                                    </div>
                                                                    <Badge variant="secondary" className="absolute top-2 left-2 text-[10px] gap-1 backdrop-blur-sm bg-black/40 text-white border-white/20">
                                                                        {backgroundImage ? <ImageIcon className="size-2.5" /> : <Play className="size-2.5" />}
                                                                        {backgroundImage ? 'Foto' : 'Video'}
                                                                    </Badge>
                                                                </div>
                                                            ) : (
                                                                <div className="rounded-md border border-dashed border-muted-foreground/30 grid place-items-center text-muted-foreground py-6">
                                                                    <div className="text-center">
                                                                        <ImageIcon className="size-5 mx-auto mb-1 opacity-40" />
                                                                        <div className="text-[10px] uppercase tracking-wider font-semibold">Sin fondo multimedia</div>
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>

                                                        <div className="p-4 space-y-2.5">
                                                            <div className="grid grid-cols-2 gap-2">
                                                                <Tooltip>
                                                                    <TooltipTrigger className="text-left w-full">
                                                                        <div className="rounded-md border bg-background hover:border-primary/50 hover:bg-primary/[0.03] transition-colors p-2.5">
                                                                            <div className="flex items-center gap-2">
                                                                                <span className="size-8 rounded-md grid place-items-center bg-sky-500/10 text-sky-500 shrink-0"><ImageIcon className="size-4" /></span>
                                                                                <div className="min-w-0 flex-1">
                                                                                    <div className="text-[11px] font-bold">Subir foto</div>
                                                                                    <div className="text-[9px] text-muted-foreground">JPG · PNG · WebP</div>
                                                                                </div>
                                                                            </div>
                                                                            <div className="mt-1.5 flex gap-1.5">
                                                                                <div className="flex-1 min-w-0">
                                                                                    <ImageUpload compact label="Subir nuevo" onUploadSuccess={(url) => { setBackgroundImage(url); setBackgroundVideo(''); }} />
                                                                                </div>
                                                                                <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); setMediaPickerFor('bg-image'); }} className="px-2 h-7 text-[10px] font-bold rounded-md border bg-background hover:border-primary/50 hover:text-primary transition-colors">📁 Biblioteca</button>
                                                                            </div>
                                                                        </div>
                                                                    </TooltipTrigger>
                                                                    <TooltipContent side="top">Foto ampliada a pantalla completa detrás de los widgets</TooltipContent>
                                                                </Tooltip>

                                                                <Tooltip>
                                                                    <TooltipTrigger className="text-left w-full">
                                                                        <div className="rounded-md border bg-background hover:border-primary/50 hover:bg-primary/[0.03] transition-colors p-2.5">
                                                                            <div className="flex items-center gap-2">
                                                                                <span className="size-8 rounded-md grid place-items-center bg-rose-500/10 text-rose-500 shrink-0"><Video className="size-4" /></span>
                                                                                <div className="min-w-0 flex-1">
                                                                                    <div className="text-[11px] font-bold">Subir video</div>
                                                                                    <div className="text-[9px] text-muted-foreground">MP4 · WebM · MOV</div>
                                                                                </div>
                                                                            </div>
                                                                            <div className="mt-1.5 flex gap-1.5">
                                                                                <div className="flex-1 min-w-0">
                                                                                    <ImageUpload compact label="Subir nuevo" onUploadSuccess={(url) => { setBackgroundVideo(url); setBackgroundImage(''); }} />
                                                                                </div>
                                                                                <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); setMediaPickerFor('bg-video'); }} className="px-2 h-7 text-[10px] font-bold rounded-md border bg-background hover:border-primary/50 hover:text-primary transition-colors">📁 Biblioteca</button>
                                                                            </div>
                                                                        </div>
                                                                    </TooltipTrigger>
                                                                    <TooltipContent side="top">Loop automático · muted · sin controles visibles</TooltipContent>
                                                                </Tooltip>
                                                            </div>

                                                            <details className="rounded-md border bg-background/50">
                                                                <summary className="cursor-pointer select-none list-none px-2.5 py-1.5 text-[11px] font-semibold text-muted-foreground hover:text-foreground flex items-center gap-1.5">
                                                                    <LinkIcon className="size-3" />
                                                                    …o pegá una URL directa
                                                                </summary>
                                                                <div className="px-2.5 pb-2.5 pt-1 space-y-1.5">
                                                                    <div className="space-y-1">
                                                                        <Label className="text-[10px] flex items-center gap-1">
                                                                            URL foto
                                                                            <Tooltip><TooltipTrigger><Info className="size-2.5 text-muted-foreground" /></TooltipTrigger><TooltipContent>Link directo a .jpg/.png/.webp</TooltipContent></Tooltip>
                                                                        </Label>
                                                                        <Input type="url" value={backgroundImage} onChange={(e) => { setBackgroundImage(e.target.value); if (e.target.value) setBackgroundVideo(''); }} placeholder="https://…/foto.jpg" className="h-7 font-mono text-[10px]" />
                                                                    </div>
                                                                    <div className="space-y-1">
                                                                        <Label className="text-[10px] flex items-center gap-1">
                                                                            URL video
                                                                            <Tooltip><TooltipTrigger><Info className="size-2.5 text-muted-foreground" /></TooltipTrigger><TooltipContent>Link directo a .mp4/.webm o YouTube</TooltipContent></Tooltip>
                                                                        </Label>
                                                                        <Input type="url" value={backgroundVideo} onChange={(e) => { setBackgroundVideo(e.target.value); if (e.target.value) setBackgroundImage(''); }} placeholder="https://youtu.be/… o /uploads/video.mp4" className="h-7 font-mono text-[10px]" />
                                                                    </div>
                                                                </div>
                                                            </details>

                                                            <p className="text-[10px] text-muted-foreground italic px-1 flex items-center gap-1">
                                                                <Info className="size-2.5 shrink-0" />
                                                                El fondo se muestra a pantalla completa. Solo puede haber uno activo (foto o video).
                                                            </p>
                                                        </div>
                                                    </div>
                                                </TooltipProvider>
                                        </TooltipProvider>
                                    </div>
                                </div>
                                <div className="rounded-lg border bg-card overflow-hidden flex flex-col">
                                    <div className="flex items-center gap-2 px-4 py-3 border-b bg-gradient-to-br from-primary/[0.03] to-transparent">
                                        <div className="size-8 rounded-md bg-primary/10 grid place-items-center text-primary"><Sparkles className="size-4" /></div>
                                        <div>
                                            <h3 className="text-[13px] font-bold leading-none">Efectos</h3>
                                            <p className="text-[10px] text-muted-foreground mt-0.5">Resolución, blur y patrón visual</p>
                                        </div>
                                    </div>
                                    <div className="p-4 space-y-3 flex-1 overflow-y-auto">
                                        <TooltipProvider>
                                                <TooltipProvider>
                                                    {/* Resolución destino */}
                                                    <div className="rounded-lg border bg-card p-4 space-y-3">
                                                        <div className="flex items-center gap-2">
                                                            <Monitor className="size-3.5 text-primary" />
                                                            <Label className="text-[13px] font-semibold">Resolución destino</Label>
                                                            <Tooltip><TooltipTrigger><Info className="size-3 text-muted-foreground" /></TooltipTrigger><TooltipContent>Tamaño lógico del canvas para diseñar. Los widgets se guardan en % así que el player escala a cualquier resolución. Sirve para pensar tipografías en pulgadas reales.</TooltipContent></Tooltip>
                                                            <span className="ml-auto text-[10px] font-mono text-muted-foreground">{designWidth}×{designHeight} · {(Math.sqrt(designWidth*designWidth + designHeight*designHeight) / (targetDPI || 96)).toFixed(1)}"</span>
                                                        </div>
                                                        <div className="grid grid-cols-3 gap-2">
                                                            {[
                                                                { label: '1080p H', w: 1920, h: 1080 },
                                                                { label: '1440p H', w: 2560, h: 1440 },
                                                                { label: '4K H',    w: 3840, h: 2160 },
                                                                { label: '1080p V', w: 1080, h: 1920 },
                                                                { label: '1440p V', w: 1440, h: 2560 },
                                                                { label: '4K V',    w: 2160, h: 3840 },
                                                            ].map(p => {
                                                                const active = designWidth === p.w && designHeight === p.h;
                                                                return (
                                                                    <button key={p.label}
                                                                        onClick={() => { setDesignWidth(p.w); setDesignHeight(p.h); setOrientation(p.h > p.w ? 'portrait' : 'landscape'); }}
                                                                        className={'h-9 px-2 rounded-md border text-[11px] font-bold transition-colors ' + (active ? 'bg-primary text-primary-foreground border-primary' : 'bg-background border-border text-foreground hover:border-primary/40 hover:bg-accent')}>
                                                                        {p.label}
                                                                    </button>
                                                                );
                                                            })}
                                                        </div>
                                                        <div className="grid grid-cols-3 gap-2">
                                                            <div className="space-y-1">
                                                                <Label className="text-[10px] text-muted-foreground">Ancho (px)</Label>
                                                                <Input type="number" min={100} max={8000} value={designWidth} onChange={(e) => setDesignWidth(parseInt(e.target.value) || 1920)} className="h-9 text-xs font-mono" />
                                                            </div>
                                                            <div className="space-y-1">
                                                                <Label className="text-[10px] text-muted-foreground">Alto (px)</Label>
                                                                <Input type="number" min={100} max={8000} value={designHeight} onChange={(e) => setDesignHeight(parseInt(e.target.value) || 1080)} className="h-9 text-xs font-mono" />
                                                            </div>
                                                            <div className="space-y-1">
                                                                <Label className="text-[10px] text-muted-foreground flex items-center gap-1">DPI <Tooltip><TooltipTrigger><Info className="size-2.5 text-muted-foreground" /></TooltipTrigger><TooltipContent>Densidad de píxeles del tótem. Solo se usa para calcular la diagonal en pulgadas del cartel.</TooltipContent></Tooltip></Label>
                                                                <Input type="number" min={40} max={400} value={targetDPI} onChange={(e) => setTargetDPI(parseInt(e.target.value) || 96)} className="h-9 text-xs font-mono" />
                                                            </div>
                                                        </div>
                                                        <p className="text-[10px] text-muted-foreground italic flex items-start gap-1 pt-1">
                                                            <Info className="size-2.5 shrink-0 mt-0.5" />
                                                            Los widgets ya se guardan en porcentajes del canvas, así que este ajuste no cambia posiciones: sirve solo para tener referencia de píxeles y pulgadas mientras diseñás.
                                                        </p>
                                                    </div>

                                                    <div className="rounded-lg border bg-card p-4 space-y-3">
                                                        <div className="flex items-center justify-between">
                                                            <Label className="text-[13px] font-semibold flex items-center gap-1.5">
                                                                <Sparkles className="size-3.5 text-primary" /> Desenfoque de fondo
                                                                <Tooltip><TooltipTrigger><Info className="size-3 text-muted-foreground" /></TooltipTrigger><TooltipContent>Blur atmosférico. Da profundidad al contenido superpuesto.</TooltipContent></Tooltip>
                                                            </Label>
                                                            <span className="text-[13px] font-mono tabular-nums text-primary font-bold">{backgroundBlur}px</span>
                                                        </div>
                                                        <input type="range" min="0" max="40" value={backgroundBlur} onChange={(e) => setBackgroundBlur(parseInt(e.target.value))}
                                                            className="w-full h-2 bg-muted rounded-full appearance-none cursor-pointer accent-primary" />
                                                        <div className="grid grid-cols-4 gap-1 text-[10px] text-muted-foreground">
                                                            <button onClick={() => setBackgroundBlur(0)} className="hover:text-foreground py-1 rounded hover:bg-accent">Nítido</button>
                                                            <button onClick={() => setBackgroundBlur(8)} className="hover:text-foreground py-1 rounded hover:bg-accent">Suave</button>
                                                            <button onClick={() => setBackgroundBlur(20)} className="hover:text-foreground py-1 rounded hover:bg-accent">Medio</button>
                                                            <button onClick={() => setBackgroundBlur(40)} className="hover:text-foreground py-1 rounded hover:bg-accent">Fuerte</button>
                                                        </div>
                                                    </div>

                                                    <div className="rounded-lg border bg-card p-4 space-y-3">
                                                        <Label className="text-[13px] font-semibold flex items-center gap-1.5">
                                                            <Sparkles className="size-3.5 text-primary" /> Patrón de textura
                                                            <Tooltip><TooltipTrigger><Info className="size-3 text-muted-foreground" /></TooltipTrigger><TooltipContent>Superpone un patrón sutil (puntos, grilla, ruido) sobre el fondo</TooltipContent></Tooltip>
                                                        </Label>
                                                        <div className="grid grid-cols-5 gap-2">
                                                            {(['none', 'dots', 'grid', 'waves', 'noise'] as const).map(pat => (
                                                                <button
                                                                    key={pat}
                                                                    onClick={() => setBackgroundPattern(pat)}
                                                                    className={'h-14 rounded-md border-2 text-[10px] font-bold uppercase tracking-wide transition-all flex items-center justify-center ' + (
                                                                        backgroundPattern === pat
                                                                            ? 'bg-primary/10 text-primary border-primary shadow-sm'
                                                                            : 'bg-background text-muted-foreground hover:bg-accent hover:text-foreground border-border'
                                                                    )}
                                                                >
                                                                    {pat === 'none' ? '—' : pat}
                                                                </button>
                                                            ))}
                                                        </div>
                                                        {backgroundPattern !== 'none' && (
                                                            <div className="pt-2 border-t space-y-1.5">
                                                                <div className="flex justify-between text-[11px]">
                                                                    <span className="text-muted-foreground">Intensidad</span>
                                                                    <span className="font-mono tabular-nums text-primary font-bold">{Math.round(backgroundPatternOpacity * 100)}%</span>
                                                                </div>
                                                                <input type="range" min="0" max="1" step="0.05" value={backgroundPatternOpacity}
                                                                    onChange={(e) => setBackgroundPatternOpacity(parseFloat(e.target.value))}
                                                                    className="w-full h-2 bg-muted rounded-full appearance-none cursor-pointer accent-primary" />
                                                            </div>
                                                        )}
                                                    </div>
                                                </TooltipProvider>
                                        </TooltipProvider>
                                    </div>
                                </div>
                                <div className="rounded-lg border bg-card overflow-hidden flex flex-col">
                                    <div className="flex items-center gap-2 px-4 py-3 border-b bg-gradient-to-br from-primary/[0.03] to-transparent">
                                        <div className="size-8 rounded-md bg-primary/10 grid place-items-center text-primary"><Layers className="size-4" /></div>
                                        <div>
                                            <h3 className="text-[13px] font-bold leading-none">Máscara y overlay</h3>
                                            <p className="text-[10px] text-muted-foreground mt-0.5">Capa oscura sobre el fondo</p>
                                        </div>
                                    </div>
                                    <div className="p-4 space-y-3 flex-1 overflow-y-auto">
                                        <TooltipProvider>
                                                <TooltipProvider>
                                                    <div className="rounded-lg border bg-card overflow-hidden">
                                                        <div className="p-4 flex items-center gap-3">
                                                            <label className="relative size-16 rounded-lg border-2 overflow-hidden shrink-0 cursor-pointer" style={{ backgroundColor: backgroundOverlayColor, opacity: backgroundOverlayOpacity }}>
                                                                <input type="color" value={backgroundOverlayColor} onChange={(e) => setBackgroundOverlayColor(e.target.value)}
                                                                    className="absolute inset-0 opacity-0 cursor-pointer" />
                                                            </label>
                                                            <div className="min-w-0 flex-1">
                                                                <Label className="text-[13px] font-semibold flex items-center gap-1.5">
                                                                    <Layers className="size-3.5 text-primary" /> Overlay de color
                                                                    <Tooltip><TooltipTrigger><Info className="size-3 text-muted-foreground" /></TooltipTrigger><TooltipContent>Capa de color sobre el fondo. Útil para oscurecer/aclarar para que el texto se lea mejor.</TooltipContent></Tooltip>
                                                                </Label>
                                                                <Input value={backgroundOverlayColor} onChange={(e) => setBackgroundOverlayColor(e.target.value)} className="h-8 font-mono text-[12px] w-32 mt-1.5" />
                                                            </div>
                                                        </div>
                                                        <div className="px-4 pb-4 space-y-1.5 border-t bg-muted/20">
                                                            <div className="flex items-center justify-between pt-3">
                                                                <Label className="text-[12px] flex items-center gap-1.5">
                                                                    Opacidad del overlay
                                                                    <Tooltip><TooltipTrigger><Info className="size-3 text-muted-foreground" /></TooltipTrigger><TooltipContent>0% = transparente · 100% = tapa todo el fondo</TooltipContent></Tooltip>
                                                                </Label>
                                                                <span className="font-mono tabular-nums text-primary font-bold text-[13px]">{Math.round(backgroundOverlayOpacity * 100)}%</span>
                                                            </div>
                                                            <input type="range" min="0" max="1" step="0.05" value={backgroundOverlayOpacity}
                                                                onChange={(e) => setBackgroundOverlayOpacity(parseFloat(e.target.value))}
                                                                className="w-full h-2 bg-background rounded-full appearance-none cursor-pointer accent-primary" />
                                                        </div>
                                                    </div>

                                                    {/* Transiciones entre interfaces */}
                                                    <div className="rounded-lg border bg-card p-4 space-y-3">
                                                        <div>
                                                            <h4 className="text-[13px] font-bold flex items-center gap-1.5">
                                                                Transición al abrir esta interface
                                                            </h4>
                                                            <p className="text-[11px] text-muted-foreground">Cómo aparecen los widgets cuando el player carga este diseño.</p>
                                                        </div>
                                                        <div className="grid grid-cols-2 gap-2">
                                                            <div className="space-y-1.5">
                                                                <Label className="text-[11px]">Efecto</Label>
                                                                <select
                                                                    value={transitionType}
                                                                    onChange={(e) => setTransitionType(e.target.value)}
                                                                    className="w-full h-9 rounded-md border bg-background px-2 text-[12px]"
                                                                >
                                                                    <option value="dramatic">Dramático (blur + zoom)</option>
                                                                    <option value="fade">Fade suave</option>
                                                                    <option value="slideUp">Slide arriba</option>
                                                                    <option value="slideDown">Slide abajo</option>
                                                                    <option value="slideLeft">Slide izquierda</option>
                                                                    <option value="slideRight">Slide derecha</option>
                                                                    <option value="zoom">Zoom in</option>
                                                                    <option value="zoomOut">Zoom out</option>
                                                                    <option value="flip">Flip 3D</option>
                                                                    <option value="blur">Blur</option>
                                                                </select>
                                                            </div>
                                                            <div className="space-y-1.5">
                                                                <Label className="text-[11px]">Duración ({transitionDuration}s)</Label>
                                                                <input
                                                                    type="range"
                                                                    min="0.2"
                                                                    max="2"
                                                                    step="0.1"
                                                                    value={transitionDuration}
                                                                    onChange={(e) => setTransitionDuration(parseFloat(e.target.value))}
                                                                    className="w-full h-9 accent-primary"
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Preview swatch */}
                                                    <div className="rounded-lg border bg-card p-3 space-y-2">
                                                        <Label className="text-[11px] text-muted-foreground">Vista previa combinada</Label>
                                                        <div className="aspect-[3/1] rounded-md overflow-hidden border relative bg-black">
                                                            {backgroundImage && <img src={backgroundImage} className="absolute inset-0 w-full h-full object-cover" style={{ filter: 'blur(' + backgroundBlur + 'px)' }} />}
                                                            {!backgroundImage && <div className="absolute inset-0" style={{ backgroundColor }} />}
                                                            <div className="absolute inset-0" style={{ backgroundColor: backgroundOverlayColor, opacity: backgroundOverlayOpacity }} />
                                                        </div>
                                                    </div>
                                                </TooltipProvider>
                                        </TooltipProvider>
                                    </div>
                                </div>
                                    </div>

                                </div>
                            )
                        }
                    </div>
                </motion.aside>
                </motion.div>
                )}</AnimatePresence>
            </div >

            {/* Custom Styled Confirmation Modal */}
            <AnimatePresence>
                {
                    showResetConfirm && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
                        >
                            <motion.div
                                initial={{ scale: 0.9, y: 20 }}
                                animate={{ scale: 1, y: 0 }}
                                exit={{ scale: 0.9, y: 20 }}
                                className="bg-muted border border-border p-8 rounded-xl max-w-md w-full shadow-2xl relative overflow-hidden"
                            >
                                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-indigo-600" />
                                <div className="flex flex-col items-center text-center gap-4 relative z-10">
                                    <div className="w-16 h-16 bg-primary/10 rounded-lg flex items-center justify-center mb-2">
                                        <LayoutIcon className="w-8 h-8 text-primary" />
                                    </div>
                                    <h3 className="text-2xl font-black text-foreground uppercase italic tracking-tighter">¿Crear Nuevo Lienzo?</h3>
                                    <p className="text-sm text-muted-foreground leading-relaxed font-medium">
                                        Estás a punto de iniciar un diseño limpio. Cualquier cambio no guardado en el layout actual se perderá irreversiblemente.
                                    </p>

                                    <div className="grid grid-cols-2 gap-4 w-full mt-6">
                                        <button
                                            onClick={() => setShowResetConfirm(false)}
                                            className="py-4 rounded-md bg-white/5 hover:bg-white/10 text-muted-foreground hover:text-foreground font-black uppercase tracking-widest text-[10px] transition-all"
                                        >
                                            Cancelar
                                        </button>
                                        <button
                                            onClick={handleConfirmReset}
                                            className="py-4 rounded-md bg-primary hover:bg-primary text-foreground font-black uppercase tracking-widest text-[10px] shadow-lg shadow-blue-600/20 transition-all active:scale-95"
                                        >
                                            Confirmar Nuevo
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        </motion.div>
                    )
                }
            </AnimatePresence >

            {/* Delete Layout Confirmation Modal */}
            <AnimatePresence>
                {
                    layoutToDelete && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
                        >
                            <motion.div
                                initial={{ scale: 0.9, y: 20 }}
                                animate={{ scale: 1, y: 0 }}
                                exit={{ scale: 0.9, y: 20 }}
                                className="bg-muted border border-border p-8 rounded-xl max-w-md w-full shadow-2xl relative overflow-hidden"
                            >
                                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-500 to-orange-600" />
                                <div className="flex flex-col items-center text-center gap-4 relative z-10">
                                    <div className="w-16 h-16 bg-destructive/10 rounded-lg flex items-center justify-center mb-2">
                                        <Trash2 className="w-8 h-8 text-destructive" />
                                    </div>
                                    <h3 className="text-2xl font-black text-foreground uppercase italic tracking-tighter">¿Eliminar Diseño?</h3>
                                    <p className="text-sm text-muted-foreground leading-relaxed font-medium">
                                        <span className="text-foreground font-bold">{layoutToDelete.name}</span> será eliminado permanentemente de la base de datos. Esta acción no se puede deshacer.
                                    </p>

                                    <div className="grid grid-cols-2 gap-4 w-full mt-6">
                                        <button
                                            onClick={() => setLayoutToDelete(null)}
                                            className="py-4 rounded-md bg-white/5 hover:bg-white/10 text-muted-foreground hover:text-foreground font-black uppercase tracking-widest text-[10px] transition-all"
                                        >
                                            Cancelar
                                        </button>
                                        <button
                                            onClick={() => {
                                                socket.emit('delete_layout', layoutToDelete._id);
                                                setLayoutToDelete(null);
                                                setTimeout(fetchLayouts, 500);
                                            }}
                                            className="py-4 rounded-md bg-red-600 hover:bg-destructive text-foreground font-black uppercase tracking-widest text-[10px] shadow-lg shadow-red-600/20 transition-all active:scale-95"
                                        >
                                            Confirmar Eliminar
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        </motion.div>
                    )
                }
            </AnimatePresence >
            <Toaster />

            {/* Media Picker global (Tanda 2) */}
            <MediaPicker
                open={!!mediaPickerFor}
                onClose={() => setMediaPickerFor(null)}
                lockType={mediaPickerFor === 'bg-video' ? 'video' : mediaPickerFor === 'bg-image' ? 'image' : undefined}
                onSelect={(item) => {
                    if (mediaPickerFor === 'bg-image') { setBackgroundImage(item.url); setBackgroundVideo(''); }
                    else if (mediaPickerFor === 'bg-video') { setBackgroundVideo(item.url); setBackgroundImage(''); }
                    setMediaPickerFor(null);
                }}
            />

        </div >
    );
}
