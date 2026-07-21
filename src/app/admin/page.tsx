'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { LayoutJSON, WidgetType, WidgetConfig } from '@/store/usePlayerStore';
import {
    Plus, Trash2, Smartphone, Monitor, ShoppingBag, Utensils,
    Layout as LayoutIcon, Settings2, Maximize, Save, Layers,
    Database, RefreshCw, Eye, EyeOff, MousePointer2, Palette,
    ChevronRight, ChevronLeft, Zap, Globe, Image as ImageIcon, Sparkles, ArrowLeft, ArrowUp, ArrowDown, ChevronsUp, ChevronsDown, Copy, Network, Clock, Search,
    Megaphone, Instagram, PlaneTakeoff, Music, PanelLeftClose, PanelRightClose, PanelLeftOpen, PanelRightOpen,
    ChevronDown, Link as LinkIcon, Calendar, LogOut, Lock
} from 'lucide-react';
import { Canvas } from '@/components/builder/Canvas';
import { RichTextEditor } from '@/components/builder/RichTextEditor';
import { ImageUpload } from '@/components/builder/ImageUpload';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { useEditorShortcuts } from '@/hooks/useEditorShortcuts';
import { WidgetPalette } from '@/components/builder/WidgetPalette';
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
    const [isConnected, setIsConnected] = useState(false);
    const [selectedWidgetId, setSelectedWidgetId] = useState<string | null>(null);
    const [orientation, setOrientation] = useState<'landscape' | 'portrait'>('landscape');
    const [resolution, setResolution] = useState<{ width: number; height: number }>({ width: 1920, height: 1080 });
    const [backgroundImage, setBackgroundImage] = useState('');
    const [backgroundVideo, setBackgroundVideo] = useState('');
    const [backgroundColor, setBackgroundColor] = useState('#ffffff');
    const [backgroundBlur, setBackgroundBlur] = useState(0);
    const [backgroundOverlayColor, setBackgroundOverlayColor] = useState('#000000');
    const [backgroundOverlayOpacity, setBackgroundOverlayOpacity] = useState(0.5);
    const [backgroundPattern, setBackgroundPattern] = useState<'none' | 'dots' | 'grid' | 'waves' | 'noise'>('none');
    const [backgroundPatternOpacity, setBackgroundPatternOpacity] = useState(0.2);
    const [editingLayoutId, setEditingLayoutId] = useState<string | null>(null);
    const [showResetConfirm, setShowResetConfirm] = useState(false);
    const [layoutToDelete, setLayoutToDelete] = useState<any>(null);
    const [leftSidebarOpen, setLeftSidebarOpen] = useState(true);
    const [rightSidebarOpen, setRightSidebarOpen] = useState(false);
    const [ctxMenu, setCtxMenu] = useState<{ x: number; y: number; visible: boolean }>({ x: 0, y: 0, visible: false });

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
        socket.on('layouts_list', (layouts) => {
            setSavedLayouts(layouts);

            // Check if we have an ID in URL to load
            if (layoutIdParam) {
                const targetLayout = layouts.find((l: any) => l._id === layoutIdParam);
                if (targetLayout) {
                    loadLayout(targetLayout);
                    return;
                }
            }

            // Load "Mi Primer Layout" if it exists and we don't have widgets yet and no params
            if (widgets.length === 0 && !layoutIdParam) {
                const initial = layouts.find((l: any) => l.name === 'Mi Primer Layout');
                if (initial) loadLayout(initial);
            }
        });
        socket.on('screens_list', (screenList) => setScreens(screenList));

        // Initialize with default data
        const defaultProducts = (getDefaultData('PRODUCT_LIST') as any).items;
        const defaultActivities = (getDefaultData('ACTIVITIES') as any).items;
        setAllProducts(defaultProducts);
        setAllActivities(defaultActivities);

        // Load latest draft from localStorage
        const savedWidgets = localStorage.getItem('pixelflow_draft_widgets');
        if (savedWidgets && widgets.length === 0) {
            try {
                const parsed = JSON.parse(savedWidgets);
                setWidgets(parsed);
                const savedName = localStorage.getItem('pixelflow_draft_name');
                if (savedName) setLayoutName(savedName);
            } catch (e) { console.error('Error loading draft', e); }
        }

        return () => { socket.disconnect(); };
    }, [fetchLayouts]);

    // Save draft to localStorage
    useEffect(() => {
        if (widgets.length > 0) {
            localStorage.setItem('pixelflow_draft_widgets', JSON.stringify(widgets));
            localStorage.setItem('pixelflow_draft_name', layoutName);
        }
    }, [widgets, layoutName]);

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

    const getDefaultData = (type: WidgetType) => {
        switch (type) {
            case 'TEXT': return { content: '<h1>PixelFlow</h1><p>Digital Signage Platform</p>', fontSize: '2rem', color: '#ffffff' };
            case 'VIDEO': return { url: 'https://assets.mixkit.co/videos/preview/mixkit-stars-in-the-night-sky-121-large.mp4' };
            case 'WEATHER': return { city: 'Buenos Aires', temp: 24, condition: 'SUNNY' };
            case 'PRICE_LIST': return { title: 'LISTA DE PRECIOS', items: [{ name: 'Hamburguesa Smashed', price: '$12', description: 'Carne premium, doble queso.' }] };
            case 'SLIDER': return { images: ['https://picsum.photos/1200/800?random=1', 'https://picsum.photos/1200/800?random=2'] };
            case 'ACTIVITIES': return {
                title: 'CRONOGRAMA DE ACTIVIDADES',
                items: [
                    { category: 'PISCINAS', time: '06:00 a 08:00', title: 'Natación para adultos', desc: 'Capacidad: 50 personas', photo: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?q=80&w=400' },
                    { category: 'PISCINAS', time: '08:30 a 10:00', title: 'Clases de natación infantil', desc: 'Nivel inicial y medio', photo: 'https://images.unsplash.com/photo-1560090528-002f1a6f8820?q=80&w=400' },
                    { category: 'BAR', time: '17:00 a 19:00', title: 'Happy Hour Cocktails', desc: '2x1 en toda la carta de autor.', photo: 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?q=80&w=400' },
                    { category: 'KIDS CLUB', time: '10:00 a 20:00', title: 'Talleres Creativos', desc: 'Cuidado infantil y juegos', photo: 'https://images.unsplash.com/photo-1472162072942-cd5173782a47?q=80&w=400' },
                    { category: 'CINE', time: '21:30 a 23:30', title: 'Película Familiar', desc: 'Función en sala principal', photo: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=400' }
                ]
            };
            case 'PRODUCT_LIST': return {
                title: 'NUESTROS PRODUCTOS',
                items: [
                    // --- CAFETERÍA (10) ---
                    { id: 'c1', name: 'Espresso Intenso', price: 2.50, currency: '$', photo: 'https://images.unsplash.com/photo-1510591509098-f4fdc6d0ff04?q=80&w=400', description: 'Café solo, corto y con mucho cuerpo.', isOffer: false, category: 'Cafetería' },
                    { id: 'c2', name: 'Cappuccino Italiano', price: 3.50, currency: '$', photo: 'https://images.unsplash.com/photo-1572442388796-11668a67e53d?q=80&w=400', description: 'Espresso con espuma de leche cremosa y cacao.', isOffer: true, category: 'Cafetería' },
                    { id: 'c3', name: 'Latte Vainilla', price: 3.80, currency: '$', photo: 'https://images.unsplash.com/photo-1595434066389-99c30d55bc42?q=80&w=400', description: 'Café con leche y un toque de vainilla dulce.', isOffer: false, category: 'Cafetería' },
                    { id: 'c4', name: 'Mocca de Chocolate', price: 4.00, currency: '$', photo: 'https://images.unsplash.com/photo-1544787210-2313404c632c?q=80&w=400', description: 'Perfecta mezcla de café y chocolate premium.', isOffer: false, category: 'Cafetería' },
                    { id: 'c5', name: 'Flat White', price: 3.60, currency: '$', photo: 'https://images.unsplash.com/photo-1517701604599-bb29b56501d1?q=80&w=400', description: 'Espresso doble con una fina capa de leche.', isOffer: false, category: 'Cafetería' },
                    { id: 'c6', name: 'Iced Coffee', price: 4.20, currency: '$', photo: 'https://images.unsplash.com/photo-1517701550927-30cf4bb1dba5?q=80&w=400', description: 'Café frío servido con hielo y jarabe.', isOffer: false, category: 'Cafetería' },
                    { id: 'c7', name: 'Americano Clásico', price: 2.80, currency: '$', photo: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?q=80&w=400', description: 'Café largo rebajado con agua caliente.', isOffer: false, category: 'Cafetería' },
                    { id: 'c8', name: 'Macchiato', price: 3.00, currency: '$', photo: 'https://images.unsplash.com/photo-1485808191679-5f86510681a2?q=80&w=400', description: 'Espresso "manchado" con espuma de leche.', isOffer: false, category: 'Cafetería' },
                    { id: 'c9', name: 'Té Matcha Latte', price: 4.50, currency: '$', photo: 'https://images.unsplash.com/photo-1515822338988-15adec69337a?q=80&w=400', description: 'Té verde matcha japonés con leche.', isOffer: true, category: 'Cafetería' },
                    { id: 'c10', name: 'Croissant Mantequilla', price: 2.20, currency: '$', photo: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?q=80&w=400', description: 'Hojaldre artesanal francés recién horneado.', isOffer: false, category: 'Cafetería' },

                    // --- BAR (10) ---
                    { id: 'b1', name: 'Gin Tonic Premium', price: 8.50, currency: '$', photo: 'https://images.unsplash.com/photo-1527661591475-527312dd65f5?q=80&w=400', description: 'Ginebra artesanal con tónica y botánicos.', isOffer: false, category: 'Bar' },
                    { id: 'b2', name: 'Mojito Cubano', price: 7.50, currency: '$', photo: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?q=80&w=400', description: 'Ron blanco, menta fresca y lima.', isOffer: true, category: 'Bar' },
                    { id: 'b3', name: 'Margarita Clásica', price: 8.00, currency: '$', photo: 'https://images.unsplash.com/photo-1531393661159-c29012f5a60b?q=80&w=400', description: 'Tequila, Cointreau y zumo de lima fresco.', isOffer: false, category: 'Bar' },
                    { id: 'b4', name: 'Cerveza Artesana IPA', price: 5.00, currency: '$', photo: 'https://images.unsplash.com/photo-1535958636474-b021ee887b13?q=80&w=400', description: 'Lupulada, amarga y muy refrescante.', isOffer: false, category: 'Bar' },
                    { id: 'b5', name: 'Negroni', price: 9.00, currency: '$', photo: 'https://images.unsplash.com/photo-1541546339599-ecdb5ec540be?q=80&w=400', description: 'Ginebra, Campari y Vermut rojo.', isOffer: false, category: 'Bar' },
                    { id: 'b6', name: 'Old Fashioned', price: 9.50, currency: '$', photo: 'https://images.unsplash.com/photo-1470337458703-46ad1756a187?q=80&w=400', description: 'Bourbon, amargos y piel de naranja.', isOffer: false, category: 'Bar' },
                    { id: 'b7', name: 'Piña Colada', price: 8.20, currency: '$', photo: 'https://images.unsplash.com/photo-1545244912-76d75bad59c9?q=80&w=400', description: 'Rum, crema de coco y zumo de piña.', isOffer: false, category: 'Bar' },
                    { id: 'b8', name: 'Vino Tinto Reserva', price: 6.00, currency: '$', photo: 'https://images.unsplash.com/photo-1510850402719-e4c197992928?q=80&w=400', description: 'Copa de vino de la región, equilibrado.', isOffer: false, category: 'Bar' },
                    { id: 'b9', name: 'Espresso Martini', price: 8.80, currency: '$', photo: 'https://images.unsplash.com/photo-1545438102-799c3991ffb2?q=80&w=400', description: 'Vodka, licor de café y café espresso.', isOffer: false, category: 'Bar' },
                    { id: 'b10', name: 'Tabla de Quesos', price: 12.00, currency: '$', photo: 'https://images.unsplash.com/photo-1631379578550-7038263cb6e9?q=80&w=400', description: 'Selección de quesos nacionales y frutos secos.', isOffer: false, category: 'Bar' },

                    // --- CINE (10) ---
                    { id: 'f1', name: 'Combo Popcorn Grande', price: 9.50, currency: '$', photo: 'https://images.unsplash.com/photo-1572177191856-3cde618dee1f?q=80&w=400', description: 'Palomitas recién hechas con mantequilla.', isOffer: true, category: 'Cine' },
                    { id: 'f2', name: 'Nachos con Queso', price: 6.50, currency: '$', photo: 'https://images.unsplash.com/photo-1513267048331-5611cad82e41?q=80&w=400', description: 'Nachos crujientes con salsa de queso cheddar.', isOffer: false, category: 'Cine' },
                    { id: 'f3', name: 'Refresco Gigante', price: 4.50, currency: '$', photo: 'https://images.unsplash.com/photo-1622483767028-3f66f344557c?q=80&w=400', description: '1 Litro de tu refresco favorito.', isOffer: false, category: 'Cine' },
                    { id: 'f4', name: 'Hot Dog Especial', price: 5.50, currency: '$', photo: 'https://images.unsplash.com/photo-1612392062631-94dd858cba88?q=80&w=400', description: 'Salchicha ahumada con cebolla crujiente.', isOffer: false, category: 'Cine' },
                    { id: 'f5', name: 'Gominolas Variadas', price: 4.00, currency: '$', photo: 'https://images.unsplash.com/photo-1582050041567-961476d5423f?q=80&w=400', description: 'Mix de caramelos y gomitas dulces.', isOffer: false, category: 'Cine' },
                    { id: 'f6', name: 'Chocolate Negro 70%', price: 3.50, currency: '$', photo: 'https://images.unsplash.com/photo-1511381939415-e44015466834?q=80&w=400', description: 'Tableta de chocolate premium para picar.', isOffer: false, category: 'Cine' },
                    { id: 'f7', name: 'Agua Mineral', price: 2.00, currency: '$', photo: 'https://images.unsplash.com/photo-1548839140-29a749e1cf4d?q=80&w=400', description: 'Botella de agua de manantial.', isOffer: false, category: 'Cine' },
                    { id: 'f8', name: 'Helado Sandwich', price: 4.50, currency: '$', photo: 'https://images.unsplash.com/photo-1505394033325-a6a2fe44ed0e?q=80&w=400', description: 'Galleta con helado de vainilla.', isOffer: false, category: 'Cine' },
                    { id: 'f9', name: 'Pretzels Salados', price: 3.80, currency: '$', photo: 'https://images.unsplash.com/photo-1585502866757-3ff6932c082e?q=80&w=400', description: 'Acompañamiento clásico salado.', isOffer: false, category: 'Cine' },
                    { id: 'f10', name: 'Palomitas de Caramelo', price: 5.50, currency: '$', photo: 'https://images.unsplash.com/photo-1505686994434-e3cc5abf1330?q=80&w=400', description: 'Dulces, crujientes y adictivas.', isOffer: false, category: 'Cine' }
                ]
            };
            case 'QR_CODE': return {
                title: 'ESCANEAME',
                subtitle: 'Ver Menú en tu Móvil',
                url: 'https://altosdelarapey.com',
                bgColor: '#ffffff',
                qrColor: '#000000'
            };
            case 'CATEGORY_NAV': return {
                accentColor: '#3b82f6',
                template: 'CARDS',
                categories: [
                    { id: '1', label: 'Kids Club', icon: 'Baby', active: true },
                    { id: '2', label: 'Piscinas', icon: 'Waves', active: false },
                    { id: '3', label: 'Salón de Juegos', icon: 'Gamepad2', active: false },
                    { id: '4', label: 'Cine', icon: 'Film', active: false },
                    { id: '5', label: 'Gimnasio', icon: 'Dumbbell', active: false },
                    { id: '6', label: 'Spa & Relax', icon: 'Flower2', active: false }
                ]
            };
            case 'NAV_BUTTON': return {
                label: 'VOLVER',
                type: 'BACK',
                icon: 'ArrowLeft',
                color: '#3b82f6'
            };
            case 'TICKER': return {
                text: 'BIENVENIDOS A ALTOS DEL ARAPEY CLUB DE GOLF & HOTEL TERMAL • DISFRUTE DE NUESTRAS PISCINAS TERMALES • HAPPY HOUR EN EL BAR DE 18:00 A 20:00 • ',
                speed: 30,
                bgColor: 'rgba(59, 130, 246, 0.9)',
                textColor: '#ffffff',
                fontSize: '1.5rem',
                showIcon: true
            };
            case 'SOCIAL_FEED': return {
                interval: 8000,
                posts: []
            };
            case 'COUNTDOWN': return {
                targetDate: new Date(Date.now() + 86400000 * 2).toISOString(),
                title: 'PRÓXIMO EVENTO',
                subtitle: 'CENA DE GALA & SHOW',
                accentColor: '#3b82f6'
            };
            case 'FLIGHT_BOARD': return {
                type: 'DEPARTURES',
                flights: []
            };
            case 'MUSIC_PLAYER': return {
                song: 'SUMMER CHILL MIX',
                artist: 'ALTO ARAPEY RADIO',
                cover: '',
                accentColor: '#10b981'
            };
            case 'ATMOSPHERE': return {
                preset: 'sunset',
                intensity: 0.5,
            };
            case 'DATE_TIME': return {
                style: 'MODERN'
            };
            default: return {};
        }
    };

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

    const pushOnly = () => {
        if (!screenId) { toast.error('Seleccioná un monitor de destino primero.'); return; }
        const layout: LayoutJSON = {
            id: 'preview', name: layoutName, orientation, widgets,
            backgroundColor, backgroundImage, backgroundVideo, backgroundBlur,
            backgroundOverlayColor, backgroundOverlayOpacity,
            backgroundPattern, backgroundPatternOpacity,
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
            backgroundPattern, backgroundPatternOpacity,
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
        setLayoutName(layout.name);
        setOrientation(layout.orientation);
        setWidgets(layout.widgets);
        setBackgroundImage(layout.backgroundImage || '');
        setBackgroundVideo(layout.backgroundVideo || '');
        setBackgroundColor(layout.backgroundColor || '#000000');
        setBackgroundBlur(layout.backgroundBlur || 0);
        setBackgroundOverlayColor(layout.backgroundOverlayColor || '#000000');
        setBackgroundOverlayOpacity(layout.backgroundOverlayOpacity !== undefined ? layout.backgroundOverlayOpacity : 0.5);
        setBackgroundPattern(layout.backgroundPattern || 'none');
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
                            return { width: r.height, height: r.width };
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
                            {/* Visual Hint */}
                            {!selectedWidgetId && widgets.length > 0 && (
                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center gap-3">
                                    <MousePointer2 className="w-10 h-10 text-primary animate-bounce" />
                                    <span className="text-[10px] font-bold text-primary/60 uppercase tracking-[0.3em]">Haz click en un elemento para editarlo</span>
                                </div>
                            )}
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
                    className="fixed inset-0 z-[80] grid place-items-center p-6 bg-foreground/50 dark:bg-background/85 backdrop-blur-md"
                    onClick={(e) => { if (e.target === e.currentTarget) setRightSidebarOpen(false); }}
                >
                <motion.aside
                    initial={{ scale: 0.96, opacity: 0, y: 12 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.96, opacity: 0, y: 12 }}
                    transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                    className="w-full max-w-3xl max-h-[88vh] bg-card border text-card-foreground rounded-xl shadow-2xl flex flex-col overflow-hidden"
                >
                    <div className="h-14 px-5 flex items-center justify-between border-b bg-card/50">
                        <div className="flex items-center gap-2.5">
                            <span className="size-8 rounded-md grid place-items-center bg-primary/10 text-primary shrink-0">
                                <Settings2 className="size-4" strokeWidth={1.75} />
                            </span>
                            <div>
                                <h2 className="font-heading text-[14px] font-bold tracking-tight leading-none">
                                    {selectedWidget ? 'Propiedades del widget' : 'Lienzo Maestro'}
                                </h2>
                                <p className="text-[11px] text-muted-foreground mt-0.5">
                                    {selectedWidget
                                        ? selectedWidget.type
                                        : widgets.length + ' capas activas · ' + resolution.width + 'x' + resolution.height}
                                </p>
                            </div>
                        </div>
                        <button onClick={() => setRightSidebarOpen(false)} className="size-7 grid place-items-center rounded-md hover:bg-accent text-muted-foreground hover:text-foreground transition-colors">
                            <X className="size-4" />
                        </button>
                    </div>

                    <div className="flex-1 min-w-[400px] flex flex-col h-full overflow-hidden">
                        {
                            selectedWidget ? (
                                <div className="flex-1 flex flex-col h-full overflow-hidden" >
                                    <div className="flex-1 overflow-y-auto">
                                        <div className="px-5 py-4 border-b bg-card/50">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2 min-w-0">
                                                    <Badge variant="secondary" className="text-[10px] font-bold uppercase tracking-wider">
                                                        {selectedWidget.type === 'CATEGORY_NAV' ? 'Menu tactil' :
                                                            selectedWidget.type === 'NAV_BUTTON' ? 'Boton' :
                                                                selectedWidget.type === 'PRODUCT_LIST' ? 'Productos' :
                                                                    selectedWidget.type}
                                                    </Badge>
                                                    <span className="text-[11px] text-muted-foreground font-mono">
                                                        z:{selectedWidget.zIndex || 1}
                                                    </span>
                                                </div>
                                                <Button size="sm" variant="ghost" onClick={() => setSelectedWidgetId(null)} className="h-7 text-[11px]">
                                                    Deseleccionar
                                                </Button>
                                            </div>
                                        </div>

                                        <section className="p-5 space-y-5">
                                            <div className="rounded-lg border bg-card p-4 space-y-3">
                                                <h4 className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground flex items-center gap-1.5">
                                                    <Maximize className="size-3" /> Geometria
                                                </h4>
                                                <div className="grid grid-cols-4 gap-2">
                                                    <div>
                                                        <Label className="text-[10px] text-muted-foreground mb-1 block">X (%)</Label>
                                                        <Input type="number" value={Math.round(selectedWidget.x || 0)} onChange={(e) => updateSelectedWidgetPos('x', parseInt(e.target.value) || 0)} className="h-8 text-[12px] font-mono" />
                                                    </div>
                                                    <div>
                                                        <Label className="text-[10px] text-muted-foreground mb-1 block">Y (%)</Label>
                                                        <Input type="number" value={Math.round(selectedWidget.y || 0)} onChange={(e) => updateSelectedWidgetPos('y', parseInt(e.target.value) || 0)} className="h-8 text-[12px] font-mono" />
                                                    </div>
                                                    <div>
                                                        <Label className="text-[10px] text-muted-foreground mb-1 block">W (%)</Label>
                                                        <Input type="number" value={Math.round(selectedWidget.w || 0)} onChange={(e) => updateSelectedWidgetSize('w', parseInt(e.target.value) || 0)} className="h-8 text-[12px] font-mono" />
                                                    </div>
                                                    <div>
                                                        <Label className="text-[10px] text-muted-foreground mb-1 block">H (%)</Label>
                                                        <Input type="number" value={Math.round(selectedWidget.h || 0)} onChange={(e) => updateSelectedWidgetSize('h', parseInt(e.target.value) || 0)} className="h-8 text-[12px] font-mono" />
                                                    </div>
                                                </div>
                                                <div className="flex items-center justify-between pt-2 border-t">
                                                    <Label className="text-[10px] text-muted-foreground">Capa (z-index)</Label>
                                                    <div className="flex items-center gap-1">
                                                        <Button size="sm" variant="outline" className="h-7 px-2" onClick={() => bringToFrontWidget(selectedWidget.id)} title="Al frente">
                                                            <ChevronsUp className="size-3.5" />
                                                        </Button>
                                                        <Button size="sm" variant="outline" className="h-7 px-2" onClick={() => moveLayerUp(selectedWidget.id)} title="Subir">
                                                            <ArrowUp className="size-3.5" />
                                                        </Button>
                                                        <span className="font-mono text-[11px] w-7 text-center tabular-nums">{selectedWidget.zIndex || 1}</span>
                                                        <Button size="sm" variant="outline" className="h-7 px-2" onClick={() => moveLayerDown(selectedWidget.id)} title="Bajar">
                                                            <ArrowDown className="size-3.5" />
                                                        </Button>
                                                        <Button size="sm" variant="outline" className="h-7 px-2" onClick={() => sendToBackWidget(selectedWidget.id)} title="Al fondo">
                                                            <ChevronsDown className="size-3.5" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="space-y-5">
                                                {selectedWidget.type === 'TEXT' && (
                                                    <div className="space-y-6">
                                                        <div>
                                                            <label className="text-[9px] text-muted-foreground uppercase block font-black mb-2">Estilo de Texto</label>
                                                            <select
                                                                className="w-full bg-muted border border-border rounded-md p-3 text-xs font-black text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
                                                                value={selectedWidget.data.style || 'minimal'}
                                                                onChange={(e) => updateSelectedWidgetData({ style: e.target.value })}
                                                            >
                                                                <option value="minimal">Minimalista (Estándar)</option>
                                                                <option value="gradient">Gradiente Moderno</option>
                                                                <option value="glass">Cristal Glassmorphism</option>
                                                                <option value="typewriter">Efecto Máquina de Escribir</option>
                                                            </select>
                                                        </div>

                                                        {selectedWidget.data.style === 'gradient' && (
                                                            <div className="grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2 duration-500">
                                                                <div>
                                                                    <label className="text-[8px] font-black text-muted-foreground uppercase block mb-1">Color Inicio</label>
                                                                    <input type="color" value={selectedWidget.data.gradientFrom || '#3b82f6'} onChange={(e) => updateSelectedWidgetData({ gradientFrom: e.target.value })} className="w-full h-8 bg-transparent cursor-pointer" />
                                                                </div>
                                                                <div>
                                                                    <label className="text-[8px] font-black text-muted-foreground uppercase block mb-1">Color Fin</label>
                                                                    <input type="color" value={selectedWidget.data.gradientTo || '#8b5cf6'} onChange={(e) => updateSelectedWidgetData({ gradientTo: e.target.value })} className="w-full h-8 bg-transparent cursor-pointer" />
                                                                </div>
                                                            </div>
                                                        )}

                                                        <div className="grid grid-cols-2 gap-4">
                                                            <div>
                                                                <label className="text-[9px] text-muted-foreground uppercase block font-black mb-2">Tamaño Fuente</label>
                                                                <input type="text" value={selectedWidget.data.fontSize || '2rem'} onChange={(e) => updateSelectedWidgetData({ fontSize: e.target.value })} className="w-full bg-muted border border-border rounded-md p-3 text-xs font-black text-foreground outline-none" />
                                                            </div>
                                                            <div>
                                                                <label className="text-[9px] text-muted-foreground uppercase block font-black mb-2">Alineación</label>
                                                                <select value={selectedWidget.data.textAlign || 'center'} onChange={(e) => updateSelectedWidgetData({ textAlign: e.target.value })} className="w-full bg-muted border border-border rounded-md p-3 text-xs font-black text-foreground outline-none">
                                                                    <option value="left">Izquierda</option>
                                                                    <option value="center">Centro</option>
                                                                    <option value="right">Derecha</option>
                                                                </select>
                                                            </div>
                                                        </div>

                                                        <RichTextEditor content={selectedWidget.data.content} onChange={(content) => updateSelectedWidgetData({ content })} />
                                                    </div>
                                                )}

                                                {selectedWidget.type === 'VIDEO' && (
                                                    <div className="space-y-4">
                                                        <label className="text-[9px] text-muted-foreground uppercase block font-black">URL Video</label>
                                                        <input value={selectedWidget.data.url} onChange={(e) => updateSelectedWidgetData({ url: e.target.value })} className="w-full bg-muted border border-border rounded-md p-4 text-xs font-bold text-primary outline-none" placeholder="https://..." />
                                                        <ImageUpload label="Subir Video" onUploadSuccess={(url) => updateSelectedWidgetData({ url })} />
                                                    </div>
                                                )}

                                                {selectedWidget.type === 'SLIDER' && (
                                                    <div className="space-y-6">
                                                        <div className="flex justify-between items-center mb-2">
                                                            <label className="text-[9px] text-muted-foreground uppercase font-black">Items del Slider</label>
                                                            <span className="text-[9px] font-black text-primary bg-primary/10 px-2 py-0.5 rounded-full">{selectedWidget.data.images?.length || 0} TOTAL</span>
                                                        </div>
                                                        <div className="grid grid-cols-4 gap-3">
                                                            {selectedWidget.data.images?.map((url: string, idx: number) => (
                                                                <div key={idx} className="relative aspect-square group/img">
                                                                    <img src={url} className="w-full h-full object-cover rounded-md border border-border" />
                                                                    <button onClick={() => { const n = selectedWidget.data.images.filter((_: any, i: number) => i !== idx); updateSelectedWidgetData({ images: n }); }} className="absolute -top-1 -right-1 bg-destructive text-foreground rounded-full p-1 opacity-0 group-hover/img:opacity-100 shadow-lg"><Trash2 className="w-2 h-2" /></button>
                                                                </div>
                                                            ))}
                                                            <button onClick={() => { const u = prompt('URL:'); if (u) updateSelectedWidgetData({ images: [...(selectedWidget.data.images || []), u] }); }} className="aspect-square bg-muted border border-dashed border-border rounded-md flex items-center justify-center hover:bg-white/5"><Plus className="w-4 h-4 text-muted-foreground" /></button>
                                                        </div>
                                                        <ImageUpload label="Subir Imagen/Video" onUploadSuccess={(url) => updateSelectedWidgetData({ images: [...(selectedWidget.data.images || []), url] })} />
                                                    </div>
                                                )}

                                                {selectedWidget.type === 'QR_CODE' && (
                                                    <div className="space-y-6">
                                                        <input className="w-full bg-muted border border-border rounded-md p-4 text-xs font-black text-foreground" value={selectedWidget.data.title} onChange={(e) => updateSelectedWidgetData({ title: e.target.value })} placeholder="TÍTULO QR" />
                                                        <input className="w-full bg-muted border border-border rounded-md p-4 text-xs font-black text-primary" value={selectedWidget.data.url} onChange={(e) => updateSelectedWidgetData({ url: e.target.value })} placeholder="URL DESTINO" />
                                                        <div className="grid grid-cols-2 gap-4">
                                                            <div><label className="text-[8px] font-black text-muted-foreground uppercase block mb-2">QR</label><input type="color" value={selectedWidget.data.qrColor} onChange={(e) => updateSelectedWidgetData({ qrColor: e.target.value })} className="w-full h-10 bg-transparent cursor-pointer" /></div>
                                                            <div><label className="text-[8px] font-black text-muted-foreground uppercase block mb-2">FONDO</label><input type="color" value={selectedWidget.data.bgColor} onChange={(e) => updateSelectedWidgetData({ bgColor: e.target.value })} className="w-full h-10 bg-transparent cursor-pointer" /></div>
                                                        </div>
                                                    </div>
                                                )}

                                                {selectedWidget.type === 'CATEGORY_NAV' && (
                                                    <div className="space-y-8">
                                                        <div className="bg-primary/5 p-6 rounded-xl border border-primary/15 space-y-6">
                                                            <div className="flex items-center justify-between">
                                                                <div className="flex flex-col">
                                                                    <span className="text-[11px] font-black text-foreground uppercase italic tracking-widest">Generador de Layouts</span>
                                                                </div>
                                                                <button
                                                                    onClick={() => {
                                                                        const newCats = [...selectedWidget.data.categories];
                                                                        newCats.forEach((cat, idx) => {
                                                                            if (!cat.targetLayoutId) {
                                                                                const newId = 'layout-' + Math.random().toString(36).substr(2, 9);
                                                                                const isVideo = cat.targetBackgroundType === 'VIDEO' || cat.targetBackgroundType === 'YOUTUBE';
                                                                                const bgUrl = cat.targetBackgroundUrl || (isVideo ? '' : (cat.photo || ''));

                                                                                const newLayout = {
                                                                                    id: newId,
                                                                                    name: `Menu: ${cat.label}`,
                                                                                    orientation,
                                                                                    widgets: [
                                                                                        { id: 'back-btn', type: 'NAV_BUTTON', x: 5, y: 5, w: 15, h: 8, data: { label: 'VOLVER', type: 'BACK', icon: 'ArrowLeft', color: '#3b82f6' } },
                                                                                        { id: 'title', type: 'TEXT', x: 25, y: 5, w: 50, h: 10, data: { content: `<h1 style="text-align: center;">${cat.label.toUpperCase()}</h1>` } }
                                                                                    ],
                                                                                    backgroundColor: '#000000',
                                                                                    backgroundImage: isVideo ? '' : bgUrl,
                                                                                    backgroundVideo: isVideo ? bgUrl : '',
                                                                                    backgroundBlur: cat.targetBlur || 20
                                                                                };
                                                                                socket.emit('save_layout', { screenId, layout: newLayout });
                                                                                newCats[idx].targetLayoutId = newId;
                                                                            }
                                                                        });
                                                                        updateSelectedWidgetData({ categories: newCats });
                                                                        setTimeout(fetchLayouts, 1000);
                                                                    }}
                                                                    className="bg-primary hover:bg-primary text-foreground p-3 rounded-lg transition-all shadow-lg active:scale-95"
                                                                >
                                                                    <Layers className="w-5 h-5" />
                                                                </button>
                                                            </div>

                                                            <div className="space-y-4 pt-4 border-t border-border">
                                                                <div className="grid grid-cols-2 gap-4">
                                                                    <div>
                                                                        <label className="text-[8px] font-black text-primary/60 uppercase tracking-[0.2em] mb-2 block">Estética del Menú</label>
                                                                        <select
                                                                            className="w-full bg-muted border border-border rounded-lg p-3 text-[11px] font-black text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
                                                                            value={selectedWidget.data.template || 'CARDS'}
                                                                            onChange={(e) => updateSelectedWidgetData({ template: e.target.value })}
                                                                        >
                                                                            <option value="CARDS">Imágenes (Cards)</option>
                                                                            <option value="FLOATING">Burbujas (Iconos)</option>
                                                                            <option value="GLAS_TILES">Glass Tiles (Modern)</option>
                                                                            <option value="STRIPS">Strips (Horizontal)</option>
                                                                            <option value="NEON_GLOW">Neon Glow (Futurista)</option>
                                                                            <option value="BRUTALIST">Brutalist (Retro)</option>
                                                                            <option value="HOLOGRAPHIC">Holographic (Iridiscente)</option>
                                                                            <option value="MAC_DOCK">Mac Dock (Premium)</option>
                                                                            <option value="BENTO">Bento Grid (Layout)</option>
                                                                        </select>
                                                                    </div>
                                                                    <div>
                                                                        <label className="text-[8px] font-black text-primary/60 uppercase tracking-[0.2em] mb-2 block">Columnas</label>
                                                                        <select
                                                                            className="w-full bg-muted border border-border rounded-lg p-3 text-[11px] font-black text-foreground outline-none"
                                                                            value={selectedWidget.data.columns || 3}
                                                                            onChange={(e) => updateSelectedWidgetData({ columns: parseInt(e.target.value) })}
                                                                        >
                                                                            <option value={1}>1 Columna</option>
                                                                            <option value={2}>2 Columnas</option>
                                                                            <option value={3}>3 Columnas</option>
                                                                            <option value={4}>4 Columnas</option>
                                                                        </select>
                                                                    </div>
                                                                </div>

                                                                <div>
                                                                    <label className="text-[8px] font-black text-primary/60 uppercase tracking-[0.2em] mb-2 block">Título del Menú</label>
                                                                    <input
                                                                        className="w-full bg-muted border border-border rounded-lg p-4 text-[13px] font-black text-foreground italic outline-none focus-visible:ring-2 focus-visible:ring-ring/40 transition-all font-sans"
                                                                        value={selectedWidget.data.title || ''}
                                                                        onChange={(e) => updateSelectedWidgetData({ title: e.target.value })}
                                                                        placeholder="NUESTRAS SECCIONES"
                                                                    />
                                                                </div>

                                                                <div className="grid grid-cols-2 gap-4">
                                                                    <div>
                                                                        <label className="text-[8px] font-black text-muted-foreground uppercase tracking-widest block mb-2">Diseño de Menú</label>
                                                                        <select
                                                                            className="w-full bg-muted border border-border rounded-lg p-3 text-[10px] font-black text-muted-foreground outline-none"
                                                                            value={selectedWidget.data.layout || 'HORIZONTAL'}
                                                                            onChange={(e) => updateSelectedWidgetData({ layout: e.target.value })}
                                                                        >
                                                                            <option value="HORIZONTAL">Horizontal (Deslizable)</option>
                                                                            <option value="VERTICAL">Vertical (Grilla)</option>
                                                                        </select>
                                                                    </div>
                                                                    {selectedWidget.data.layout === 'VERTICAL' && (
                                                                        <div>
                                                                            <label className="text-[8px] font-black text-muted-foreground uppercase tracking-widest block mb-2">Columnas</label>
                                                                            <select
                                                                                className="w-full bg-muted border border-border rounded-lg p-3 text-[10px] font-black text-muted-foreground outline-none"
                                                                                value={selectedWidget.data.columns || 3}
                                                                                onChange={(e) => updateSelectedWidgetData({ columns: parseInt(e.target.value) })}
                                                                            >
                                                                                <option value={1}>1 Columna</option>
                                                                                <option value={2}>2 Columnas</option>
                                                                                <option value={3}>3 Columnas</option>
                                                                                <option value={4}>4 Columnas</option>
                                                                                <option value={5}>5 Columnas</option>
                                                                            </select>
                                                                        </div>
                                                                    )}
                                                                </div>

                                                                <div>
                                                                    <label className="text-[8px] font-black text-muted-foreground uppercase tracking-widest block mb-2">Estilo de Botones</label>
                                                                    <div className="grid grid-cols-3 gap-2">
                                                                        {(['CARDS', 'GLASS', 'MINIMAL'] as const).map(style => (
                                                                            <button
                                                                                key={style}
                                                                                onClick={() => updateSelectedWidgetData({ buttonStyle: style })}
                                                                                className={`py-2 rounded border text-[8px] font-black transition-all ${selectedWidget.data.buttonStyle === style || (!selectedWidget.data.buttonStyle && style === 'CARDS') ? 'bg-primary border-blue-500 text-foreground' : 'bg-muted border-border text-muted-foreground'}`}
                                                                            >
                                                                                {style}
                                                                            </button>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <div className="space-y-4">
                                                            <div className="flex justify-between items-center px-2">
                                                                <h3 className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em]">Botones del Menú</h3>
                                                                <button
                                                                    onClick={() => updateSelectedWidgetData({ categories: [...selectedWidget.data.categories, { id: Math.random(), label: 'NUEVA SECCIÓN', icon: 'Utensils', active: false }] })}
                                                                    className="flex items-center gap-2 px-3 py-1.5 bg-white/5 hover:bg-white/10 text-foreground rounded-lg text-[9px] font-black uppercase transition-all"
                                                                >
                                                                    <Plus className="w-3 h-3" /> Añadir
                                                                </button>
                                                            </div>

                                                            <div className="space-y-4 pr-2 custom-scrollbar max-h-[800px] overflow-y-auto">
                                                                {selectedWidget.data.categories?.map((cat: any, idx: number) => (
                                                                    <div key={cat.id} className="bg-muted p-6 rounded-xl border border-border space-y-5 group relative overflow-hidden">
                                                                        <div className={`absolute top-0 right-0 w-32 h-32 bg-primary/5 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none`} />

                                                                        <div className="flex gap-5 relative z-10">
                                                                            <div className="w-20 h-20 rounded-lg bg-black border border-border overflow-hidden flex-shrink-0 relative group/photo shadow-2xl">
                                                                                <img src={cat.photo || 'https://via.placeholder.com/100'} className="w-full h-full object-cover transition-transform duration-700 group-hover/photo:scale-110" />
                                                                                <div className="absolute inset-0 bg-muted opacity-0 group-hover/photo:opacity-100 transition-opacity flex items-center justify-center">
                                                                                    <ImageUpload
                                                                                        compact
                                                                                        onUploadSuccess={(url) => {
                                                                                            const newCats = [...selectedWidget.data.categories];
                                                                                            newCats[idx].photo = url;
                                                                                            updateSelectedWidgetData({ categories: newCats });
                                                                                        }}
                                                                                    />
                                                                                </div>
                                                                            </div>

                                                                            <div className="flex-1 space-y-4">
                                                                                <div>
                                                                                    <label className="text-[8px] font-black text-muted-foreground uppercase tracking-widest block mb-1">Nombre Visual</label>
                                                                                    <input
                                                                                        className="w-full bg-muted border border-border rounded-md px-4 py-2.5 text-xs font-black italic outline-none text-foreground focus-visible:ring-2 focus-visible:ring-ring/40 transition-colors"
                                                                                        value={cat.label}
                                                                                        onChange={(e) => {
                                                                                            const newCats = [...selectedWidget.data.categories];
                                                                                            newCats[idx].label = e.target.value;
                                                                                            updateSelectedWidgetData({ categories: newCats });
                                                                                        }}
                                                                                    />
                                                                                </div>



                                                                                <div>
                                                                                    <label className="text-[8px] font-black text-muted-foreground uppercase tracking-widest block mb-1">Color Fondo</label>
                                                                                    <div className="flex items-center gap-3 bg-muted border border-border rounded-md p-2 mb-2">
                                                                                        <input
                                                                                            type="color"
                                                                                            value={cat.bucketColor || '#111111'}
                                                                                            onChange={(e) => {
                                                                                                const newCats = [...selectedWidget.data.categories];
                                                                                                newCats[idx].bucketColor = e.target.value;
                                                                                                updateSelectedWidgetData({ categories: newCats });
                                                                                            }}
                                                                                            className="w-8 h-8 rounded cursor-pointer bg-transparent border-none p-0"
                                                                                        />
                                                                                        <span className="text-[10px] font-mono text-muted-foreground uppercase">{cat.bucketColor || '#111111'}</span>
                                                                                    </div>
                                                                                </div>

                                                                                <div>
                                                                                    <label className="text-[8px] font-black text-muted-foreground uppercase tracking-widest block mb-1">Overlay</label>
                                                                                    <div className="flex items-center gap-3 bg-muted border border-border rounded-md p-2 mb-2">
                                                                                        <input
                                                                                            type="color"
                                                                                            value={cat.overlayColor || '#000000'}
                                                                                            onChange={(e) => {
                                                                                                const newCats = [...selectedWidget.data.categories];
                                                                                                newCats[idx].overlayColor = e.target.value;
                                                                                                updateSelectedWidgetData({ categories: newCats });
                                                                                            }}
                                                                                            className="w-8 h-8 rounded cursor-pointer bg-transparent border-none p-0"
                                                                                        />
                                                                                        <span className="text-[10px] font-mono text-muted-foreground uppercase flex-1">{cat.overlayColor || '#000000'}</span>
                                                                                    </div>
                                                                                    <div className="flex items-center gap-2 px-1">
                                                                                        <span className="text-[8px] text-muted-foreground font-bold">ALPHA</span>
                                                                                        <input
                                                                                            type="range" min="0" max="100"
                                                                                            value={cat.overlayOpacity !== undefined ? cat.overlayOpacity : 30}
                                                                                            onChange={(e) => {
                                                                                                const newCats = [...selectedWidget.data.categories];
                                                                                                newCats[idx].overlayOpacity = parseInt(e.target.value);
                                                                                                updateSelectedWidgetData({ categories: newCats });
                                                                                            }}
                                                                                            className="flex-1 h-1 bg-white/10 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary"
                                                                                        />
                                                                                        <span className="text-[9px] text-muted-foreground w-6 text-right tabular-nums">{cat.overlayOpacity !== undefined ? cat.overlayOpacity : 30}%</span>
                                                                                    </div>
                                                                                </div>

                                                                                <div className="grid grid-cols-2 gap-3">
                                                                                    <div className="space-y-1">
                                                                                        <label className="text-[8px] font-black text-muted-foreground uppercase tracking-widest block">Icono</label>
                                                                                        <select
                                                                                            className="w-full bg-muted border border-border rounded-md px-3 py-2 text-[10px] font-black text-muted-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
                                                                                            value={cat.icon || 'Utensils'}
                                                                                            onChange={(e) => {
                                                                                                const newCats = [...selectedWidget.data.categories];
                                                                                                newCats[idx].icon = e.target.value;
                                                                                                updateSelectedWidgetData({ categories: newCats });
                                                                                            }}
                                                                                        >
                                                                                            <option value="Utensils">General</option>
                                                                                            <option value="Pizza">Cena</option>
                                                                                            <option value="Coffee">Café</option>
                                                                                            <option value="Wine">Bebidas</option>
                                                                                            <option value="IceCream">Postres</option>
                                                                                            <option value="Waves">Relax</option>
                                                                                            <option value="Gamepad2">Diversión</option>
                                                                                        </select>
                                                                                    </div>
                                                                                    <div className="space-y-1">
                                                                                        <label className="text-[8px] font-black text-muted-foreground uppercase tracking-widest block">Visibilidad</label>
                                                                                        <button
                                                                                            onClick={() => {
                                                                                                const newCats = selectedWidget.data.categories.map((c: any, i: number) => ({ ...c, active: i === idx }));
                                                                                                updateSelectedWidgetData({ categories: newCats });
                                                                                            }}
                                                                                            className={`w-full py-2 rounded-md text-[9px] font-black uppercase transition-all ${cat.active ? 'bg-primary text-foreground shadow-lg' : 'bg-neutral-800 text-muted-foreground hover:text-foreground'}`}
                                                                                        >
                                                                                            {cat.active ? 'VISIBLE' : 'OCULTO'}
                                                                                        </button>
                                                                                    </div>
                                                                                </div>
                                                                            </div>
                                                                        </div>



                                                                        <div className="flex items-center justify-between pt-4 border-t border-border relative z-10">
                                                                            <div className="flex-1">
                                                                                <label className="text-[7px] font-black text-muted-foreground uppercase tracking-widest block mb-1 italic">Vincular a Layout</label>
                                                                                <select
                                                                                    className="w-full bg-transparent border-none text-[11px] font-black text-primary outline-none focus:ring-0 p-0"
                                                                                    value={cat.targetLayoutId || ''}
                                                                                    onChange={(e) => {
                                                                                        const newCats = [...selectedWidget.data.categories];
                                                                                        newCats[idx].targetLayoutId = e.target.value;
                                                                                        updateSelectedWidgetData({ categories: newCats });
                                                                                    }}
                                                                                >
                                                                                    <option value="">(Sin Acción)</option>
                                                                                    {savedLayouts.map(l => (
                                                                                        <option key={l._id} value={l._id}>{l.name}</option>
                                                                                    ))}
                                                                                </select>
                                                                            </div>
                                                                            <button
                                                                                onClick={() => {
                                                                                    const newCats = selectedWidget.data.categories.filter((_: any, i: number) => i !== idx);
                                                                                    updateSelectedWidgetData({ categories: newCats });
                                                                                }}
                                                                                className="p-3 text-destructive/20 hover:text-destructive hover:bg-destructive/10 rounded-lg transition-all"
                                                                            >
                                                                                <Trash2 className="w-4 h-4" />
                                                                            </button>
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}

                                                {selectedWidget.type === 'NAV_BUTTON' && (
                                                    <div className="space-y-6">
                                                        <div>
                                                            <label className="text-[8px] font-black text-neutral-700 uppercase mb-1.5 block">Icono</label>
                                                            <select
                                                                className="w-full bg-muted border border-border rounded-md p-3 text-[10px] font-black outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
                                                                value={selectedWidget.data.icon || 'ArrowLeft'}
                                                                onChange={(e) => updateSelectedWidgetData({ icon: e.target.value })}
                                                            >
                                                                <option value="ArrowLeft">Flecha Atrás</option>
                                                                <option value="Home">Casita</option>
                                                                <option value="ChevronRight">Flecha Derecha</option>
                                                                <option value="Zap">Rayo</option>
                                                                <option value="Play">Play / Video</option>
                                                                <option value="Info">Info</option>
                                                            </select>
                                                        </div>
                                                        <div>
                                                            <label className="text-[8px] font-black text-neutral-700 uppercase mb-1.5 block">Estilo del Botón (Template)</label>
                                                            <select
                                                                className="w-full bg-muted border border-border rounded-md p-3 text-[10px] font-black outline-none focus-visible:ring-2 focus-visible:ring-ring/40 text-emerald-500"
                                                                value={selectedWidget.data.template || 'GLASS'}
                                                                onChange={(e) => updateSelectedWidgetData({ template: e.target.value })}
                                                            >
                                                                <option value="GLASS">Modern Glass (Cristal)</option>
                                                                <option value="CIRCULAR">Circular Striking (Llamativo)</option>
                                                                <option value="NEON">Neon Glow (Neon)</option>
                                                                <option value="MINIMAL">Minimalist (Limpio)</option>
                                                                <option value="3D">3D Tactile (Relieve)</option>
                                                                <option value="GRADIENT">Premium Gradient (Degradado)</option>
                                                            </select>
                                                        </div>
                                                        <div>
                                                            <label className="text-[8px] font-black text-neutral-700 uppercase mb-1.5 block">Texto del Botón</label>
                                                            <input
                                                                className="w-full bg-muted border border-border rounded-md p-3 text-[10px] font-black outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
                                                                value={selectedWidget.data.label || ''}
                                                                onChange={(e) => updateSelectedWidgetData({ label: e.target.value })}
                                                                placeholder="Ej: VOLVER"
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="text-[8px] font-black text-neutral-700 uppercase mb-1.5 block">Tipo de Acción</label>
                                                            <select
                                                                className="w-full bg-muted border border-border rounded-md p-3 text-[10px] font-black outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
                                                                value={selectedWidget.data.type || 'BACK'}
                                                                onChange={(e) => updateSelectedWidgetData({ type: e.target.value })}
                                                            >
                                                                <option value="BACK">Volver Atrás</option>
                                                                <option value="HOME">Ir al Inicio</option>
                                                                <option value="LINK">Ir a Layout Específico</option>
                                                            </select>
                                                        </div>
                                                        {(selectedWidget.data.type === 'LINK' || selectedWidget.data.type === 'HOME') && (
                                                            <div>
                                                                <label className="text-[8px] font-black text-neutral-700 uppercase mb-1.5 block">Destino (Layout)</label>
                                                                <select
                                                                    className="w-full bg-muted border border-border rounded-md p-3 text-[10px] font-black outline-none focus-visible:ring-2 focus-visible:ring-ring/40 text-primary"
                                                                    value={selectedWidget.data.targetLayoutId || ''}
                                                                    onChange={(e) => updateSelectedWidgetData({ targetLayoutId: e.target.value })}
                                                                >
                                                                    <option value="">Seleccionar Layout...</option>
                                                                    {savedLayouts.map(l => (
                                                                        <option key={l._id} value={l._id}>{l.name}</option>
                                                                    ))}
                                                                </select>
                                                            </div>
                                                        )}
                                                        <div>
                                                            <label className="text-[8px] font-black text-neutral-700 uppercase mb-1.5 block">Color del Acento</label>
                                                            <div className="flex items-center gap-4 bg-muted p-3 rounded-md border border-border">
                                                                <input
                                                                    type="color"
                                                                    className="w-10 h-10 border-none bg-transparent rounded-lg cursor-pointer"
                                                                    value={selectedWidget.data.color || '#3b82f6'}
                                                                    onChange={(e) => updateSelectedWidgetData({ color: e.target.value })}
                                                                />
                                                                <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">{selectedWidget.data.color || '#3B82F6'}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}

                                                {selectedWidget.type === 'PRODUCT_LIST' && (
                                                    <div className="space-y-6">
                                                        <div>
                                                            <label className="text-[9px] text-muted-foreground uppercase block font-black mb-2 italic">Título del Menú</label>
                                                            <input
                                                                className="w-full bg-muted border border-border rounded-md p-4 text-xs font-black italic outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
                                                                value={selectedWidget.data.title || ''}
                                                                onChange={(e) => updateSelectedWidgetData({ title: e.target.value })}
                                                                placeholder="Ej: NUESTRA CARTA"
                                                            />
                                                        </div>

                                                        <div className="space-y-2">
                                                            <label className="text-[9px] text-muted-foreground uppercase block font-black mb-2 italic">Categorías a Mostrar</label>
                                                            <div className="grid grid-cols-1 gap-1.5 bg-black/20 p-3 rounded-lg border border-border max-h-40 overflow-y-auto custom-scrollbar">
                                                                {allCategories.map((cat) => (
                                                                    <label key={cat.id} className="flex items-center justify-between gap-2 cursor-pointer hover:bg-white/5 px-2 py-1.5 rounded transition-all group/catcheck">
                                                                        <span className="text-[10px] font-black text-muted-foreground uppercase italic group-hover/catcheck:text-primary transition-colors">{cat.name}</span>
                                                                        <input
                                                                            type="checkbox"
                                                                            checked={selectedWidget.data.categoriesToShow?.includes(cat.id) || false}
                                                                            onChange={(e) => {
                                                                                const current = selectedWidget.data.categoriesToShow || [];
                                                                                const next = e.target.checked
                                                                                    ? [...current, cat.id]
                                                                                    : current.filter((id: string) => id !== cat.id);
                                                                                updateSelectedWidgetData({ categoriesToShow: next });
                                                                            }}
                                                                            className="w-4 h-4 rounded-md bg-muted border-border checked:bg-primary checked:border-blue-500 focus:ring-0 cursor-pointer"
                                                                        />
                                                                    </label>
                                                                ))}
                                                                {allCategories.length === 0 && (
                                                                    <p className="text-[9px] text-muted-foreground italic p-2">No hay categorías definidas en el catálogo.</p>
                                                                )}
                                                            </div>
                                                        </div>
                                                        <div className="p-4 bg-primary/5 rounded-md border border-primary/15">
                                                            <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest leading-relaxed">
                                                                Los productos se gestionan desde la pestaña <ShoppingBag className="w-3 h-3 inline mb-0.5" /> **Catálogo** en la barra lateral izquierda.
                                                            </p>
                                                        </div>
                                                    </div>
                                                )}

                                                {selectedWidget.type === 'ACTIVITIES' && (
                                                    <div className="space-y-6">
                                                        <div>
                                                            <label className="text-[9px] text-muted-foreground uppercase block font-black mb-2 italic">Título de la Agenda</label>
                                                            <input
                                                                className="w-full bg-muted border border-border rounded-md p-4 text-xs font-black italic outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
                                                                value={selectedWidget.data.title || ''}
                                                                onChange={(e) => updateSelectedWidgetData({ title: e.target.value })}
                                                                placeholder="Ej: EVENTOS DE HOY"
                                                            />
                                                        </div>

                                                        <div className="space-y-2">
                                                            <label className="text-[9px] text-muted-foreground uppercase block font-black mb-2 italic">Sección a Mostrar</label>
                                                            <select
                                                                className="w-full bg-muted border border-border rounded-md p-4 text-[11px] font-black outline-none focus-visible:ring-2 focus-visible:ring-ring/40 text-amber-500"
                                                                value={selectedWidget.data.sectionToShow || 'ALL'}
                                                                onChange={(e) => updateSelectedWidgetData({ sectionToShow: e.target.value })}
                                                            >
                                                                <option value="ALL">TODAS LAS SECCIONES (MIX)</option>
                                                                {Array.from(new Set(allActivities.map(a => a.category).filter(Boolean))).map((cat) => (
                                                                    <option key={cat} value={cat}>{cat.toUpperCase()}</option>
                                                                ))}
                                                            </select>
                                                        </div>
                                                        <div className="p-4 bg-amber-500/5 rounded-md border border-amber-500/10">
                                                            <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest leading-relaxed">
                                                                Las actividades se gestionan desde la pestaña <RefreshCw className="w-3 h-3 inline mb-0.5" /> **Cronograma** en la barra lateral izquierda.
                                                            </p>
                                                        </div>
                                                    </div>
                                                )}

                                                {selectedWidget.type === 'WEATHER' && (
                                                    <div className="space-y-6">
                                                        <div>
                                                            <label className="text-[9px] text-muted-foreground uppercase block font-black mb-2 italic">Ciudad para Clima en Vivo</label>
                                                            <input
                                                                className="w-full bg-muted border border-border rounded-md p-4 text-xs font-black italic outline-none focus-visible:ring-2 focus-visible:ring-ring/40 text-primary"
                                                                value={selectedWidget.data.city || ''}
                                                                onChange={(e) => updateSelectedWidgetData({ city: e.target.value })}
                                                                placeholder="Ej: Buenos Aires, AR"
                                                            />
                                                        </div>
                                                        <div className="p-4 bg-primary/5 rounded-lg border border-primary/15 space-y-2">
                                                            <div className="flex items-center gap-2 text-primary">
                                                                <Sparkles className="w-3 h-3" />
                                                                <span className="text-[9px] font-black uppercase tracking-widest">Motor Inteligente</span>
                                                            </div>
                                                            <p className="text-[10px] text-muted-foreground font-medium leading-relaxed">
                                                                El widget buscará automáticamente la ubicación y clima en tiempo real. No necesitas configurar nada más.
                                                            </p>
                                                        </div>
                                                    </div>
                                                )}

                                                {selectedWidget.type === 'TICKER' && (
                                                    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
                                                        <div>
                                                            <label className="text-[9px] text-muted-foreground uppercase block font-black mb-2 italic">Mensaje de la Cinta</label>
                                                            <textarea
                                                                value={selectedWidget.data.text || ''}
                                                                onChange={(e) => updateSelectedWidgetData({ text: e.target.value })}
                                                                className="w-full bg-muted border border-border rounded-md p-4 text-xs font-bold text-foreground outline-none min-h-[120px] focus-visible:ring-2 focus-visible:ring-ring/40"
                                                            />
                                                        </div>
                                                        <div className="grid grid-cols-2 gap-4">
                                                            <div>
                                                                <label className="text-[9px] text-muted-foreground uppercase block font-black mb-2 italic">Velocidad</label>
                                                                <input type="number" value={selectedWidget.data.speed} onChange={(e) => updateSelectedWidgetData({ speed: parseInt(e.target.value) })} className="w-full bg-muted border border-border rounded-md p-3 text-xs font-black text-foreground" />
                                                            </div>
                                                            <div>
                                                                <label className="text-[9px] text-muted-foreground uppercase block font-black mb-2 italic">Fondo</label>
                                                                <input type="color" value={selectedWidget.data.bgColor} onChange={(e) => updateSelectedWidgetData({ bgColor: e.target.value })} className="w-full h-10 bg-transparent cursor-pointer" />
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}

                                                {selectedWidget.type === 'COUNTDOWN' && (
                                                    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
                                                        <div>
                                                            <label className="text-[9px] text-muted-foreground uppercase block font-black mb-2 italic">Fecha Objetivo</label>
                                                            <input type="datetime-local" value={selectedWidget.data.targetDate?.substring(0, 16) || ''} onChange={(e) => updateSelectedWidgetData({ targetDate: new Date(e.target.value).toISOString() })} className="w-full bg-muted border border-border rounded-md p-4 text-xs font-black text-foreground" />
                                                        </div>
                                                        <div>
                                                            <label className="text-[9px] text-muted-foreground uppercase block font-black mb-2 italic">Título Superior</label>
                                                            <input type="text" value={selectedWidget.data.title || ''} onChange={(e) => updateSelectedWidgetData({ title: e.target.value })} className="w-full bg-muted border border-border rounded-md p-4 text-xs font-black text-foreground italic" />
                                                        </div>
                                                        <div>
                                                            <label className="text-[9px] text-muted-foreground uppercase block font-black mb-2 italic">Nombre del Evento</label>
                                                            <input type="text" value={selectedWidget.data.subtitle || ''} onChange={(e) => updateSelectedWidgetData({ subtitle: e.target.value })} className="w-full bg-muted border border-border rounded-md p-4 text-xs font-black text-foreground italic" />
                                                        </div>
                                                    </div>
                                                )}

                                                {selectedWidget.type === 'ATMOSPHERE' && (
                                                    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
                                                        <div>
                                                            <label className="text-[9px] text-muted-foreground uppercase block font-black mb-3 italic">Estilo Ambiental</label>
                                                            <div className="grid grid-cols-2 gap-2">
                                                                {['GOLD', 'SNOW', 'SOLAR', 'BUBBLES'].map(t => (
                                                                    <button
                                                                        key={t}
                                                                        onClick={() => updateSelectedWidgetData({ type: t })}
                                                                        className={`py-6 rounded-xl border text-[10px] font-black transition-all ${selectedWidget.data.type === t ? 'bg-amber-500 border-amber-400 text-foreground shadow-lg shadow-amber-500/20' : 'bg-muted border-border text-muted-foreground hover:text-foreground hover:bg-white/5'}`}
                                                                    >
                                                                        {t}
                                                                    </button>
                                                                ))}
                                                            </div>
                                                        </div>
                                                        <div className="pt-4">
                                                            <label className="text-[9px] text-muted-foreground uppercase block font-black mb-4 italic">Intensidad ({selectedWidget.data.intensity})</label>
                                                            <input type="range" min="5" max="100" value={selectedWidget.data.intensity} onChange={(e) => updateSelectedWidgetData({ intensity: parseInt(e.target.value) })} className="w-full h-1.5 bg-white/10 rounded-full appearance-none accent-amber-500 cursor-pointer" />
                                                        </div>
                                                    </div>
                                                )}

                                                {selectedWidget.type === 'MUSIC_PLAYER' && (
                                                    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
                                                        <div>
                                                            <label className="text-[9px] text-muted-foreground uppercase block font-black mb-2 italic">Canción / Radio</label>
                                                            <input type="text" value={selectedWidget.data.song || ''} onChange={(e) => updateSelectedWidgetData({ song: e.target.value })} className="w-full bg-muted border border-border rounded-md p-4 text-xs font-black text-foreground italic" />
                                                        </div>
                                                        <div>
                                                            <label className="text-[9px] text-muted-foreground uppercase block font-black mb-2 italic">Créditos</label>
                                                            <input type="text" value={selectedWidget.data.artist || ''} onChange={(e) => updateSelectedWidgetData({ artist: e.target.value })} className="w-full bg-muted border border-border rounded-md p-4 text-xs font-black text-foreground italic" />
                                                        </div>
                                                        <div>
                                                            <label className="text-[9px] text-muted-foreground uppercase block font-black mb-2 italic">Color Visualizer</label>
                                                            <input type="color" value={selectedWidget.data.accentColor || '#10b981'} onChange={(e) => updateSelectedWidgetData({ accentColor: e.target.value })} className="w-full h-10 bg-transparent cursor-pointer" />
                                                        </div>
                                                    </div>
                                                )}

                                                {selectedWidget.type === 'FLIGHT_BOARD' && (
                                                    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
                                                        <div>
                                                            <label className="text-[9px] text-muted-foreground uppercase block font-black mb-2 italic">Configuración Tablero</label>
                                                            <select value={selectedWidget.data.type} onChange={(e) => updateSelectedWidgetData({ type: e.target.value })} className="w-full bg-muted border border-border rounded-md p-4 text-xs font-black text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring/40">
                                                                <option value="DEPARTURES">VUELOS: SALIDAS</option>
                                                                <option value="ARRIVALS">VUELOS: LLEGADAS</option>
                                                            </select>
                                                        </div>
                                                    </div>
                                                )}

                                                {selectedWidget.type === 'SOCIAL_FEED' && (
                                                    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
                                                        <div>
                                                            <label className="text-[9px] text-muted-foreground uppercase block font-black mb-2 italic">Intervalo de Rotación (ms)</label>
                                                            <input type="number" step="1000" min="3000" value={selectedWidget.data.interval} onChange={(e) => updateSelectedWidgetData({ interval: parseInt(e.target.value) })} className="w-full bg-muted border border-border rounded-md p-4 text-xs font-black text-foreground" />
                                                        </div>
                                                        <div className="p-4 bg-pink-500/5 rounded-lg border border-pink-500/10 flex flex-col gap-2">
                                                            <div className="flex items-center gap-2 text-pink-500">
                                                                <Instagram className="w-4 h-4" />
                                                                <span className="text-[9px] font-black uppercase tracking-widest">Feed de Instagram</span>
                                                            </div>
                                                            <p className="text-[10px] text-muted-foreground leading-relaxed italic">
                                                                El sistema alterna automáticamente entre las últimas fotos de Instagram y reseñas premium de TripAdvisor.
                                                            </p>
                                                        </div>
                                                    </div>
                                                )}

                                                {selectedWidget.type === 'PRICE_LIST' && (
                                                    <div className="space-y-6">
                                                        <div>
                                                            <label className="text-[9px] text-muted-foreground uppercase block font-black mb-2 italic">Título del Listado</label>
                                                            <input
                                                                className="w-full bg-muted border border-border rounded-md p-4 text-xs font-black italic outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
                                                                value={selectedWidget.data.title || ''}
                                                                onChange={(e) => updateSelectedWidgetData({ title: e.target.value })}
                                                                placeholder="Ej: LISTA DE PRECIOS"
                                                            />
                                                        </div>
                                                        <div className="space-y-3 pt-4 border-t border-border">
                                                            <div className="flex justify-between items-center bg-muted px-4 py-2 rounded-md">
                                                                <span className="text-[9px] font-black text-muted-foreground tracking-[0.2em] uppercase">Items de Precios</span>
                                                                <button
                                                                    onClick={() => updateSelectedWidgetData({ items: [...(selectedWidget.data.items || []), { name: 'Item Nuevo', price: '$0.00', description: '' }] })}
                                                                    className="text-primary hover:text-foreground transition-colors"
                                                                >
                                                                    <Plus className="w-4 h-4" />
                                                                </button>
                                                            </div>
                                                            <div className="space-y-2 max-h-[350px] overflow-y-auto pr-2 custom-scrollbar">
                                                                {selectedWidget.data.items?.map((item: any, idx: number) => (
                                                                    <div key={idx} className="bg-muted/50 p-4 rounded-md border border-border space-y-3">
                                                                        <div className="flex gap-2">
                                                                            <input
                                                                                className="flex-1 bg-muted border border-border rounded-lg px-3 py-2 text-xs font-black italic outline-none text-foreground focus-visible:ring-2 focus-visible:ring-ring/40"
                                                                                value={item.name || ''}
                                                                                onChange={(e) => {
                                                                                    const newItems = [...selectedWidget.data.items];
                                                                                    newItems[idx].name = e.target.value;
                                                                                    updateSelectedWidgetData({ items: newItems });
                                                                                }}
                                                                            />
                                                                            <input
                                                                                className="w-24 bg-muted border border-border rounded-lg px-3 py-2 text-xs font-black text-primary outline-none"
                                                                                value={item.price || ''}
                                                                                onChange={(e) => {
                                                                                    const newItems = [...selectedWidget.data.items];
                                                                                    newItems[idx].price = e.target.value;
                                                                                    updateSelectedWidgetData({ items: newItems });
                                                                                }}
                                                                            />
                                                                        </div>
                                                                        <textarea
                                                                            className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-[10px] text-muted-foreground outline-none h-12 resize-none"
                                                                            value={item.description || ''}
                                                                            onChange={(e) => {
                                                                                const newItems = [...selectedWidget.data.items];
                                                                                newItems[idx].description = e.target.value;
                                                                                updateSelectedWidgetData({ items: newItems });
                                                                            }}
                                                                        />
                                                                        <div className="flex justify-end">
                                                                            <button
                                                                                onClick={() => {
                                                                                    const newItems = selectedWidget.data.items.filter((_: any, i: number) => i !== idx);
                                                                                    updateSelectedWidgetData({ items: newItems });
                                                                                }}
                                                                                className="text-destructive/40 hover:text-destructive transition-colors"
                                                                            >
                                                                                <Trash2 className="w-3.5 h-3.5" />
                                                                            </button>
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}

                                                {selectedWidget.type === 'DATE_TIME' && (
                                                    <div className="space-y-6">
                                                        <div>
                                                            <label className="text-[9px] text-muted-foreground uppercase block font-black mb-2">Estilo Visual</label>
                                                            <select
                                                                className="w-full bg-muted border border-border rounded-md p-3 text-xs font-black text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
                                                                value={selectedWidget.data.style || 'minimal'}
                                                                onChange={(e) => updateSelectedWidgetData({ style: e.target.value })}
                                                            >
                                                                <option value="minimal">Minimalista</option>
                                                                <option value="card">Tarjeta Glass</option>
                                                                <option value="neon">Neón Glow</option>
                                                                <option value="ios">Sleek iOS Style</option>
                                                                <option value="retro">Digital Retro</option>
                                                                <option value="elegant">Serif Elegant</option>
                                                            </select>
                                                        </div>
                                                        <div className="grid grid-cols-2 gap-4">
                                                            <div>
                                                                <label className="text-[9px] text-muted-foreground uppercase block font-black mb-2">Formato</label>
                                                                <select
                                                                    className="w-full bg-muted border border-border rounded-md p-3 text-xs font-black text-foreground outline-none"
                                                                    value={selectedWidget.data.format || '24'}
                                                                    onChange={(e) => updateSelectedWidgetData({ format: e.target.value })}
                                                                >
                                                                    <option value="24">24 Horas</option>
                                                                    <option value="12">12 Horas</option>
                                                                </select>
                                                            </div>
                                                            <div>
                                                                <label className="text-[9px] text-muted-foreground uppercase block font-black mb-2">Color Texto</label>
                                                                <div className="flex bg-muted border border-border rounded-md p-2">
                                                                    <input
                                                                        type="color"
                                                                        className="w-full h-6 bg-transparent cursor-pointer"
                                                                        value={selectedWidget.data.color || '#ffffff'}
                                                                        onChange={(e) => updateSelectedWidgetData({ color: e.target.value })}
                                                                    />
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="space-y-3 pt-4 border-t border-border">
                                                            <label className="flex items-center gap-3 cursor-pointer group">
                                                                <input
                                                                    type="checkbox"
                                                                    className="w-4 h-4 rounded bg-muted border-border checked:bg-primary"
                                                                    checked={selectedWidget.data.showDate !== false}
                                                                    onChange={(e) => updateSelectedWidgetData({ showDate: e.target.checked })}
                                                                />
                                                                <span className="text-xs font-bold text-muted-foreground group-hover:text-foreground transition-colors">Mostrar Fecha</span>
                                                            </label>
                                                            <label className="flex items-center gap-3 cursor-pointer group">
                                                                <input
                                                                    type="checkbox"
                                                                    className="w-4 h-4 rounded bg-muted border-border checked:bg-primary"
                                                                    checked={selectedWidget.data.showSeconds !== false}
                                                                    onChange={(e) => updateSelectedWidgetData({ showSeconds: e.target.checked })}
                                                                />
                                                                <span className="text-xs font-bold text-muted-foreground group-hover:text-foreground transition-colors">Mostrar Segundos</span>
                                                            </label>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </section>

                                        <div className="px-5 py-4 border-t bg-card/30">
                                            <Button
                                                onClick={() => {
                                                    setWidgets(widgets.filter(w => w.id !== selectedWidgetId));
                                                    setSelectedWidgetId(null);
                                                }}
                                                variant="destructive"
                                                className="w-full"
                                                size="sm"
                                            >
                                                <Trash2 className="size-4" /> Eliminar widget
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <Tabs defaultValue="lienzo" className="flex-1 flex flex-col min-h-0 p-5 gap-3">
                                    <TabsList className="w-full grid grid-cols-2">
                                        <TabsTrigger value="lienzo">
                                            <ImageIcon className="size-3.5" /> Lienzo
                                        </TabsTrigger>
                                        <TabsTrigger value="capas">
                                            <Layers className="size-3.5" /> Capas
                                            {widgets.length > 0 && (
                                                <span className="ml-1 size-4 rounded-full bg-primary/15 text-primary text-[9px] font-bold grid place-items-center">{widgets.length}</span>
                                            )}
                                        </TabsTrigger>
                                    </TabsList>

                                    <TabsContent value="lienzo" className="flex-1 min-h-0 overflow-y-auto pr-1">
                                        <div className="space-y-5">
                                            {/* Background section */}
                                            <section className="rounded-lg border bg-card p-4 space-y-4">
                                                <h4 className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground flex items-center gap-1.5">
                                                    <Palette className="size-3" /> Fondo
                                                </h4>

                                                <div className="flex items-center justify-between">
                                                    <Label className="text-[12px] font-medium">Color de fondo</Label>
                                                    <input
                                                        type="color"
                                                        value={backgroundColor}
                                                        onChange={(e) => setBackgroundColor(e.target.value)}
                                                        className="size-9 rounded-md border bg-transparent cursor-pointer overflow-hidden"
                                                    />
                                                </div>

                                                <Separator />

                                                <div className="space-y-2">
                                                    <Label className="text-[12px] font-medium">Imagen de fondo</Label>
                                                    <ImageUpload
                                                        label="Subir imagen"
                                                        onUploadSuccess={(url) => {
                                                            setBackgroundImage(url);
                                                            setBackgroundVideo('');
                                                        }}
                                                    />
                                                </div>

                                                <div className="space-y-2">
                                                    <Label className="text-[12px] font-medium">Video de fondo</Label>
                                                    <Input
                                                        type="url"
                                                        value={backgroundVideo}
                                                        onChange={(e) => { setBackgroundVideo(e.target.value); setBackgroundImage(''); }}
                                                        placeholder="https://..."
                                                        className="h-9"
                                                    />
                                                    <ImageUpload
                                                        compact
                                                        label="O subir video"
                                                        onUploadSuccess={(url) => { setBackgroundVideo(url); setBackgroundImage(''); }}
                                                    />
                                                </div>

                                                {(backgroundImage || backgroundVideo) && (
                                                    <div className="relative group aspect-video rounded-md overflow-hidden border">
                                                        {backgroundImage ? (
                                                            <img src={backgroundImage} className="w-full h-full object-cover" />
                                                        ) : (
                                                            <video src={backgroundVideo} className="w-full h-full object-cover" autoPlay muted loop />
                                                        )}
                                                        <div className="absolute inset-0 bg-foreground/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                            <Button
                                                                size="sm"
                                                                variant="destructive"
                                                                onClick={() => { setBackgroundImage(''); setBackgroundVideo(''); }}
                                                            >
                                                                <Trash2 className="size-3.5" /> Quitar
                                                            </Button>
                                                        </div>
                                                    </div>
                                                )}
                                            </section>

                                            {/* Atmosphere */}
                                            <section className="rounded-lg border bg-card p-4 space-y-3">
                                                <div className="flex items-center justify-between">
                                                    <h4 className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground flex items-center gap-1.5">
                                                        <Sparkles className="size-3" /> Atmosfera
                                                    </h4>
                                                    <span className="text-[11px] font-mono tabular-nums text-primary">{backgroundBlur}px</span>
                                                </div>
                                                <input
                                                    type="range" min="0" max="40"
                                                    value={backgroundBlur}
                                                    onChange={(e) => setBackgroundBlur(parseInt(e.target.value))}
                                                    className="w-full h-1.5 bg-muted rounded-full appearance-none cursor-pointer accent-primary"
                                                />
                                                <p className="text-[11px] text-muted-foreground">
                                                    Desenfoca el fondo para dar profundidad al contenido superior.
                                                </p>
                                            </section>

                                            {/* Overlay / Mask */}
                                            <section className="rounded-lg border bg-card p-4 space-y-4">
                                                <h4 className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground flex items-center gap-1.5">
                                                    <Layers className="size-3" /> Mascara / Overlay
                                                </h4>

                                                <div className="flex items-center justify-between">
                                                    <Label className="text-[12px] font-medium">Color overlay</Label>
                                                    <input
                                                        type="color"
                                                        value={backgroundOverlayColor}
                                                        onChange={(e) => setBackgroundOverlayColor(e.target.value)}
                                                        className="size-8 rounded-md border bg-transparent cursor-pointer overflow-hidden"
                                                    />
                                                </div>

                                                <div className="space-y-2">
                                                    <div className="flex justify-between text-[11px]">
                                                        <span className="text-muted-foreground">Opacidad</span>
                                                        <span className="font-mono tabular-nums text-foreground">{Math.round(backgroundOverlayOpacity * 100)}%</span>
                                                    </div>
                                                    <input
                                                        type="range" min="0" max="1" step="0.05"
                                                        value={backgroundOverlayOpacity}
                                                        onChange={(e) => setBackgroundOverlayOpacity(parseFloat(e.target.value))}
                                                        className="w-full h-1.5 bg-muted rounded-full appearance-none cursor-pointer accent-primary"
                                                    />
                                                </div>

                                                <Separator />

                                                <div className="space-y-2">
                                                    <Label className="text-[12px] font-medium">Patron de textura</Label>
                                                    <div className="grid grid-cols-5 gap-1.5">
                                                        {(['none', 'dots', 'grid', 'waves', 'noise'] as const).map(pat => (
                                                            <button
                                                                key={pat}
                                                                onClick={() => setBackgroundPattern(pat)}
                                                                className={'h-9 rounded-md border text-[10px] font-bold uppercase tracking-wide transition-colors ' + (
                                                                    backgroundPattern === pat
                                                                        ? 'bg-primary text-primary-foreground border-primary'
                                                                        : 'bg-background text-muted-foreground hover:bg-accent hover:text-foreground'
                                                                )}
                                                            >
                                                                {pat}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>

                                                {backgroundPattern !== 'none' && (
                                                    <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                                                        <div className="flex justify-between text-[11px]">
                                                            <span className="text-muted-foreground">Intensidad</span>
                                                            <span className="font-mono tabular-nums text-foreground">{Math.round(backgroundPatternOpacity * 100)}%</span>
                                                        </div>
                                                        <input
                                                            type="range" min="0" max="1" step="0.05"
                                                            value={backgroundPatternOpacity}
                                                            onChange={(e) => setBackgroundPatternOpacity(parseFloat(e.target.value))}
                                                            className="w-full h-1.5 bg-muted rounded-full appearance-none cursor-pointer accent-primary"
                                                        />
                                                    </div>
                                                )}
                                            </section>
                                        </div>
                                    </TabsContent>

                                    <TabsContent value="capas" className="flex-1 min-h-0 overflow-y-auto pr-1">
                                        {widgets.length === 0 ? (
                                            <div className="text-center py-12 px-6 rounded-lg border border-dashed text-muted-foreground">
                                                <Layers className="size-6 mx-auto mb-3 opacity-50" />
                                                <p className="text-[13px] font-medium mb-1">Sin capas en el lienzo</p>
                                                <p className="text-[11px]">Agrega widgets desde la barra superior para empezar.</p>
                                            </div>
                                        ) : (
                                            <div className="space-y-1.5">
                                                <p className="text-[11px] text-muted-foreground mb-2 px-1">
                                                    Las capas superiores se dibujan encima. Usa las flechas para reordenar.
                                                </p>
                                                {[...widgets]
                                                    .sort((a, b) => (b.zIndex || 1) - (a.zIndex || 1))
                                                    .map((w, idx, arr) => {
                                                        const isSel = selectedWidgetId === w.id;
                                                        const isFirst = idx === 0;
                                                        const isLast = idx === arr.length - 1;
                                                        return (
                                                            <div
                                                                key={w.id}
                                                                onClick={() => setSelectedWidgetId(w.id)}
                                                                className={'group flex items-center gap-2 rounded-md border px-2 py-1.5 cursor-pointer transition-colors ' + (
                                                                    isSel ? 'bg-primary/10 border-primary/40' : 'bg-card hover:bg-accent border-border'
                                                                )}
                                                            >
                                                                <span className="font-mono text-[10px] tabular-nums text-muted-foreground w-6 text-right">
                                                                    {w.zIndex || 1}
                                                                </span>
                                                                <div className="flex-1 min-w-0">
                                                                    <div className="text-[12px] font-semibold truncate">{w.type}</div>
                                                                    <div className="text-[10px] text-muted-foreground font-mono">
                                                                        {Math.round(w.x)},{Math.round(w.y)} · {Math.round(w.w)}x{Math.round(w.h)}
                                                                    </div>
                                                                </div>
                                                                <div className="flex items-center gap-0.5 opacity-60 group-hover:opacity-100 transition-opacity">
                                                                    <button
                                                                        onClick={(e) => { e.stopPropagation(); bringToFrontWidget(w.id); }}
                                                                        disabled={isFirst}
                                                                        title="Traer al frente"
                                                                        className="size-7 grid place-items-center rounded hover:bg-accent disabled:opacity-30 disabled:pointer-events-none"
                                                                    >
                                                                        <ChevronsUp className="size-3.5" />
                                                                    </button>
                                                                    <button
                                                                        onClick={(e) => { e.stopPropagation(); moveLayerUp(w.id); }}
                                                                        disabled={isFirst}
                                                                        title="Subir capa"
                                                                        className="size-7 grid place-items-center rounded hover:bg-accent disabled:opacity-30 disabled:pointer-events-none"
                                                                    >
                                                                        <ArrowUp className="size-3.5" />
                                                                    </button>
                                                                    <button
                                                                        onClick={(e) => { e.stopPropagation(); moveLayerDown(w.id); }}
                                                                        disabled={isLast}
                                                                        title="Bajar capa"
                                                                        className="size-7 grid place-items-center rounded hover:bg-accent disabled:opacity-30 disabled:pointer-events-none"
                                                                    >
                                                                        <ArrowDown className="size-3.5" />
                                                                    </button>
                                                                    <button
                                                                        onClick={(e) => { e.stopPropagation(); sendToBackWidget(w.id); }}
                                                                        disabled={isLast}
                                                                        title="Enviar al fondo"
                                                                        className="size-7 grid place-items-center rounded hover:bg-accent disabled:opacity-30 disabled:pointer-events-none"
                                                                    >
                                                                        <ChevronsDown className="size-3.5" />
                                                                    </button>
                                                                    <button
                                                                        onClick={(e) => { e.stopPropagation(); removeWidget(w.id); }}
                                                                        title="Eliminar"
                                                                        className="size-7 grid place-items-center rounded hover:bg-destructive/15 hover:text-destructive"
                                                                    >
                                                                        <Trash2 className="size-3.5" />
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                            </div>
                                        )}
                                    </TabsContent>
                                </Tabs>
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
        </div >
    );
}
