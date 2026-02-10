'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { LayoutJSON, WidgetType, WidgetConfig } from '@/store/usePlayerStore';
import {
    Plus, Trash2, Smartphone, Monitor, ShoppingBag, Utensils,
    Layout as LayoutIcon, Settings2, Maximize, Save, Layers,
    Database, RefreshCw, Eye, MousePointer2, Box, Palette,
    ChevronRight, ChevronLeft, Zap, Globe, Image as ImageIcon, Sparkles, ArrowLeft, Copy, Network, Clock, Search,
    Megaphone, Instagram, PlaneTakeoff, Music, PanelLeftClose, PanelRightClose, PanelLeftOpen, PanelRightOpen,
    ChevronDown, Link as LinkIcon, Calendar, LogOut
} from 'lucide-react';
import { Canvas } from '@/components/builder/Canvas';
import { RichTextEditor } from '@/components/builder/RichTextEditor';
import { ImageUpload } from '@/components/builder/ImageUpload';
import { FlowMap } from '@/components/admin/FlowMap';
import { ScheduleCanvas } from '@/components/admin/ScheduleCanvas';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

let socket: Socket;

export default function AdminDashboard() {
    const [screenId, setScreenId] = useState('pantalla-1');
    const [layoutName, setLayoutName] = useState('Mi Primer Layout');
    const [widgets, setWidgets] = useState<WidgetConfig[]>([]);
    const [isConnected, setIsConnected] = useState(false);
    const [selectedWidgetId, setSelectedWidgetId] = useState<string | null>(null);
    const [orientation, setOrientation] = useState<'landscape' | 'portrait'>('landscape');
    const [backgroundImage, setBackgroundImage] = useState('');
    const [backgroundVideo, setBackgroundVideo] = useState('');
    const [backgroundColor, setBackgroundColor] = useState('#000000');
    const [backgroundBlur, setBackgroundBlur] = useState(0);
    const [backgroundOverlayColor, setBackgroundOverlayColor] = useState('#000000');
    const [backgroundOverlayOpacity, setBackgroundOverlayOpacity] = useState(0.5);
    const [backgroundPattern, setBackgroundPattern] = useState<'none' | 'dots' | 'grid' | 'waves' | 'noise'>('none');
    const [backgroundPatternOpacity, setBackgroundPatternOpacity] = useState(0.2);
    const [editingLayoutId, setEditingLayoutId] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'screens' | 'layouts' | 'components' | 'products' | 'activities' | 'flow' | 'settings'>('components');
    const [showResetConfirm, setShowResetConfirm] = useState(false);
    const [layoutToDelete, setLayoutToDelete] = useState<any>(null);
    const [leftSidebarOpen, setLeftSidebarOpen] = useState(true);
    const [rightSidebarOpen, setRightSidebarOpen] = useState(true);
    const router = useRouter();

    // DB States
    const [savedLayouts, setSavedLayouts] = useState<any[]>([]);
    const [screens, setScreens] = useState<any[]>([]);
    const [allProducts, setAllProducts] = useState<any[]>([]);
    const [allActivities, setAllActivities] = useState<any[]>([]);
    const [allSchedules, setAllSchedules] = useState<any[]>([]);
    const [allCategories, setAllCategories] = useState<any[]>([
        { id: 'cat-1', name: 'GASTRONOMÍA', photo: '', description: 'Platos de autor y especialidades.' },
        { id: 'cat-2', name: 'BAR & COCKTAILS', photo: '', description: 'Tragos clásicos e internacionales.' },
        { id: 'cat-3', name: 'KIDS CLUB', photo: '', description: 'Actividades para los más pequeños.' },
        { id: 'cat-4', name: 'BIENESTAR & SPA', photo: '', description: 'Relax y cuidado personal.' }
    ]);
    const [catalogView, setCatalogView] = useState<'categories' | 'products'>('categories');
    const [adminProductSearch, setAdminProductSearch] = useState('');

    const fetchLayouts = useCallback(() => {
        if (socket) {
            socket.emit('get_layouts');
            socket.emit('get_screens');
            socket.emit('get_schedules');
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
            // Load "Mi Primer Layout" if it exists and we don't have widgets yet
            if (widgets.length === 0) {
                const initial = layouts.find((l: any) => l.name === 'Mi Primer Layout');
                if (initial) loadLayout(initial);
            }
        });
        socket.on('screens_list', (screenList) => setScreens(screenList));
        socket.on('schedules_list', (schedules) => setAllSchedules(schedules));

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

    const addWidget = (type: WidgetType) => {
        const newWidget: WidgetConfig = {
            id: Math.random().toString(36).substr(2, 9),
            type,
            x: 10, y: 10, w: 30, h: 30,
            zIndex: 1,
            data: getDefaultData(type),
        };
        setWidgets([...widgets, newWidget]);
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
            case 'ATMOSPHERE': return {
                type: 'GOLD',
                intensity: 20
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

    const pushOnly = () => {
        const layout: LayoutJSON = {
            id: 'preview',
            name: layoutName,
            orientation,
            widgets,
            backgroundColor,
            backgroundImage,
            backgroundVideo,
            backgroundBlur,
            backgroundOverlayColor,
            backgroundOverlayOpacity,
            backgroundPattern,
            backgroundPatternOpacity,
        };
        socket.emit('update_content', { screenId, layout });
    };

    const saveLayout = (isNew: boolean = false) => {
        const id = (isNew || !editingLayoutId) ? 'layout-' + Date.now() : editingLayoutId;
        const layout: LayoutJSON = {
            id,
            name: layoutName,
            orientation,
            widgets,
            backgroundColor,
            backgroundImage,
            backgroundVideo,
            backgroundBlur,
            backgroundOverlayColor,
            backgroundOverlayOpacity,
            backgroundPattern,
            backgroundPatternOpacity,
        };
        socket.emit('save_layout', { screenId, layout });
        setEditingLayoutId(id);
        // Force refresh layouts list after a small delay to ensure DB persistence
        setTimeout(() => {
            fetchLayouts();
            // Optional: Provide visual feedback here if we had a toast system
        }, 500);
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
        setActiveTab('components');
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
        <div className="h-screen bg-[#050505] text-neutral-100 flex flex-col font-sans selection:bg-blue-500/30">
            {/* Professional Glass Header */}
            <header className="h-20 border-b border-white/5 px-10 flex items-center justify-between bg-black/40 backdrop-blur-2xl sticky top-0 z-[100]">
                <div className="flex items-center gap-6">
                    <Link href="/">
                        <button className="flex items-center gap-2 px-4 py-2 rounded-md bg-white/10 text-white font-bold uppercase border border-white/5 shadow-lg active:scale-95 transition-transform text-xs">
                            <ArrowLeft className="w-4 h-4" /> Volver
                        </button>
                    </Link>
                    <button
                        onClick={async () => {
                            await fetch('/api/auth/logout', { method: 'POST' });
                            router.push('/login');
                        }}
                        className="flex items-center gap-2 px-4 py-2 rounded-md bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white font-bold uppercase border border-red-500/20 shadow-lg active:scale-95 transition-all text-xs"
                    >
                        <LogOut className="w-4 h-4" /> Cerrar Sesión
                    </button>
                    <div className="h-8 w-[1px] bg-white/10" />
                    <motion.div
                        initial={{ rotate: -10 }}
                        animate={{ rotate: 0 }}
                        className="w-12 h-12 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-md flex items-center justify-center shadow-2xl shadow-blue-600/40 relative group"
                    >
                        <Zap className="w-7 h-7 text-white group-hover:scale-110 transition-transform" />
                        <div className="absolute inset-0 bg-white/20 rounded-md opacity-0 group-hover:opacity-100 transition-opacity" />
                    </motion.div>
                    <div className="flex-shrink-0">
                        <div className="flex items-center gap-4">
                            <div>
                                <h1 className="text-xl font-black tracking-tighter uppercase flex items-center gap-2">
                                    PixelFlow <span className="text-blue-500">Studio</span>
                                    <span className="bg-blue-500/10 text-blue-400 text-[10px] px-2 py-0.5 rounded-full border border-blue-500/20 ml-2">v2.0 PRO</span>
                                </h1>
                                <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-[0.2em] mt-0.5">Digital Signage Control Center</p>
                            </div>

                            <div className="h-10 w-[1px] bg-white/5 mx-2" />

                            <div className="flex flex-col">
                                <label className="text-[8px] font-black text-neutral-500 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                                    <LayoutIcon className="w-3 h-3 text-blue-500" /> Diseño Activo
                                </label>
                                <div className="relative group/lay">
                                    <select
                                        className="bg-[#111] border border-white/5 rounded-xl px-4 py-2.5 text-[11px] font-black italic text-blue-400 outline-none focus:border-blue-500/50 min-w-[200px] appearance-none pr-10 cursor-pointer hover:bg-[#1a1a1a] transition-all shadow-2xl hover:border-white/10"
                                        value={savedLayouts.find(l => l.name === layoutName)?._id || ''}
                                        onChange={(e) => {
                                            const layout = savedLayouts.find(l => l._id === e.target.value);
                                            if (layout) loadLayout(layout);
                                        }}
                                    >
                                        <option value="" className="bg-[#0a0a0a]">Seleccionar Diseño...</option>
                                        {savedLayouts.map(l => (
                                            <option key={l._id} value={l._id} className="bg-[#0a0a0a] text-white py-2">{l.name.toUpperCase()}</option>
                                        ))}
                                    </select>
                                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-600 group-hover/lay:text-blue-500 transition-colors pointer-events-none" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-6">
                    {/* Monitor Selector Dropdown */}
                    <div className="flex flex-col">
                        <label className="text-[8px] font-black text-neutral-500 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                            <Smartphone className="w-3 h-3 text-blue-500" /> Monitor de Destino
                        </label>
                        <div className="flex items-center gap-2">
                            <div className="relative group/mon">
                                <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                                    <div className={`w-1.5 h-1.5 rounded-full ${screens.find(s => s.screenId === screenId) && (Date.now() - new Date(screens.find(s => s.screenId === screenId).lastSeen).getTime() < 15000) ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]' : 'bg-red-500'}`} />
                                </div>
                                <select
                                    className="bg-[#111] border border-white/5 rounded-xl pl-9 pr-10 py-2.5 text-[11px] font-black italic text-blue-400 outline-none focus:border-blue-500/50 min-w-[240px] appearance-none cursor-pointer hover:bg-[#1a1a1a] transition-all shadow-2xl hover:border-white/10"
                                    value={screenId}
                                    onChange={(e) => setScreenId(e.target.value)}
                                >
                                    {screens.length === 0 ? (
                                        <option value="pantalla-1" className="bg-[#0a0a0a]">Configurando pantallas...</option>
                                    ) : (
                                        screens.map(s => {
                                            const isOnline = Date.now() - new Date(s.lastSeen).getTime() < 15000;
                                            return (
                                                <option key={s.screenId} value={s.screenId} className="bg-[#0a0a0a] text-white py-2">
                                                    {isOnline ? '●' : '○'} {s.name || s.screenId.toUpperCase()} {s.screenId === screenId ? ' (TARGET)' : ''}
                                                </option>
                                            );
                                        })
                                    )}
                                </select>
                                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-600 group-hover/mon:text-blue-500 transition-colors pointer-events-none" />
                            </div>

                            <button
                                onClick={() => {
                                    const url = `${window.location.origin}/player/${screenId}`;
                                    navigator.clipboard.writeText(url);
                                    const btn = document.getElementById('copy-url-btn');
                                    if (btn) {
                                        btn.innerHTML = '<span class="text-emerald-500 text-[10px] font-black italic">COPIADO!</span>';
                                        setTimeout(() => {
                                            btn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-link w-4 h-4"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>';
                                        }, 2000);
                                    }
                                }}
                                id="copy-url-btn"
                                className="w-10 h-10 bg-white/5 hover:bg-blue-600/10 border border-white/5 hover:border-blue-500/30 rounded-xl flex items-center justify-center text-neutral-500 hover:text-blue-500 transition-all active:scale-90 shadow-lg"
                                title="Copiar URL del Monitor"
                            >
                                <LinkIcon className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    <div className="h-8 w-[1px] bg-white/10" />

                    <div className="flex items-center gap-3">
                        <button
                            onClick={pushOnly}
                            className="bg-white/5 hover:bg-white/10 text-neutral-400 hover:text-white text-[11px] font-black uppercase px-5 py-3 rounded-md transition-all flex items-center gap-2 border border-white/5"
                        >
                            <Eye className="w-4 h-4" /> Preview
                        </button>

                        <button
                            onClick={saveAndPush}
                            className="bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-black uppercase px-8 py-3 rounded-md flex items-center gap-2 transition-all active:scale-95 shadow-xl shadow-blue-600/30 hover:shadow-blue-600/40"
                        >
                            <Zap className="w-4 h-4" /> {editingLayoutId ? 'Actualizar' : 'Publicar'}
                        </button>

                        {editingLayoutId && (
                            <button
                                onClick={() => saveLayout(true)}
                                className="bg-white/5 hover:bg-white/10 text-neutral-400 hover:text-white text-[11px] font-black uppercase px-5 py-3 rounded-md transition-all flex items-center gap-2 border border-white/5"
                            >
                                <Plus className="w-4 h-4" /> Guardar Nuevo
                            </button>
                        )}
                    </div>
                </div>
            </header>

            <div className="flex flex-1 overflow-hidden">
                {/* Modern Navigation Sidebar (Fixed) */}
                <aside className="w-16 bg-black/20 border-r border-white/5 flex flex-col items-center py-8 gap-8 z-50 sticky top-20 h-[calc(100vh-80px)] custom-scrollbar">
                    <button
                        onClick={() => setActiveTab('components')}
                        className={`p-3 rounded-md transition-all ${activeTab === 'components' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-neutral-500 hover:text-white hover:bg-white/5'}`}
                    >
                        <Box className="w-6 h-6" />
                    </button>
                    <button
                        onClick={() => setActiveTab('products')}
                        className={`p-3 rounded-md transition-all ${activeTab === 'products' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-neutral-500 hover:text-white hover:bg-white/5'}`}
                    >
                        <ShoppingBag className="w-6 h-6" />
                    </button>
                    <button
                        onClick={() => setActiveTab('activities')}
                        className={`p-3 rounded-md transition-all ${activeTab === 'activities' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-neutral-500 hover:text-white hover:bg-white/5'}`}
                    >
                        <RefreshCw className="w-6 h-6" />
                    </button>
                    <button
                        onClick={() => setActiveTab('layouts')}
                        className={`p-3 rounded-md transition-all ${activeTab === 'layouts' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-neutral-500 hover:text-white hover:bg-white/5'}`}
                    >
                        <Database className="w-6 h-6" />
                    </button>
                    <button
                        onClick={() => setActiveTab('screens')}
                        className={`p-3 rounded-md transition-all ${activeTab === 'screens' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-neutral-500 hover:text-white hover:bg-white/5'}`}
                    >
                        <Smartphone className="w-6 h-6" />
                    </button>
                    <button
                        onClick={() => setActiveTab('flow')}
                        className={`p-3 rounded-md transition-all ${activeTab === 'flow' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-neutral-500 hover:text-white hover:bg-white/5'}`}
                    >
                        <Network className="w-6 h-6" />
                    </button>
                    <Link href="/admin/schedules">
                        <button
                            className="p-3 rounded-md transition-all text-neutral-500 hover:text-emerald-500 hover:bg-white/5"
                            title="Programación de Contenidos (Ir a Página)"
                        >
                            <Calendar className="w-6 h-6" />
                        </button>
                    </Link>
                    <div className="mt-auto">
                        <button
                            onClick={() => setActiveTab('settings')}
                            className={`p-3 rounded-md transition-all ${activeTab === 'settings' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-neutral-600 hover:text-white hover:bg-white/5'}`}
                        >
                            <Settings2 className="w-6 h-6" />
                        </button>
                    </div>
                </aside>

                {/* Content Panel for Sidebar Tabs (Wider) */}
                <motion.aside
                    initial={false}
                    animate={{
                        width: leftSidebarOpen ? 300 : 0,
                        opacity: leftSidebarOpen ? 1 : 0
                    }}
                    transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                    className="bg-[#080808] border-r border-white/5 flex flex-col overflow-hidden relative group/sidebar"
                >
                    {/* Toggle Button Left */}
                    <button
                        onClick={() => setLeftSidebarOpen(!leftSidebarOpen)}
                        className={`absolute top-1/2 -right-4 -translate-y-1/2 z-[60] w-8 h-16 bg-[#080808] border border-white/10 rounded-r-xl flex items-center justify-center text-neutral-500 hover:text-blue-500 transition-all shadow-2xl opacity-0 group-hover/sidebar:opacity-100 ${!leftSidebarOpen ? 'opacity-100 !-right-10 rounded-l-none' : ''}`}
                    >
                        {leftSidebarOpen ? <PanelLeftClose className="w-4 h-4" /> : <PanelLeftOpen className="w-4 h-4" />}
                    </button>

                    <div className="flex-1 overflow-y-auto px-6 pt-4 pb-10 space-y-10 custom-scrollbar min-w-[300px]">
                        <AnimatePresence mode="wait">
                            {activeTab === 'components' && (
                                <motion.div
                                    key="components"
                                    initial={{ opacity: 0, scale: 0.95, filter: 'blur(10px)' }}
                                    animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
                                    exit={{ opacity: 0, scale: 1.05, filter: 'blur(10px)' }}
                                    transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                                    className="space-y-6"
                                >
                                    <div className="sticky top-0 z-20 bg-[#080808] pb-6">
                                        <h2 className="text-[10px] font-black text-blue-500 uppercase tracking-[0.5em] flex items-center gap-2">
                                            <Sparkles className="w-3 h-3" /> Biblioteca de Componentes
                                        </h2>
                                    </div>
                                    <div className="grid grid-cols-1 gap-4 pb-20">
                                        {([
                                            { type: 'TEXT', label: 'Texto Dinámico', desc: 'Títulos y párrafos.', color: 'from-blue-500 to-indigo-600', icon: 'T' },
                                            { type: 'VIDEO', label: 'Video', desc: 'Fondos animados.', color: 'from-red-500 to-orange-600', icon: 'V' },
                                            { type: 'SLIDER', label: 'Galería', desc: 'Carrusel fotos/videos.', color: 'from-emerald-500 to-teal-600', icon: 'S' },
                                            { type: 'PRODUCT_LIST', label: 'Carta', desc: 'Menú productos.', color: 'from-amber-500 to-yellow-600', icon: 'P' },
                                            { type: 'ACTIVITIES', label: 'Agenda', desc: 'Eventos del día.', color: 'from-purple-500 to-pink-600', icon: 'A' },
                                            { type: 'DATE_TIME', label: 'Fecha/Hora', desc: 'Reloj digital.', color: 'from-emerald-400 to-cyan-500', icon: <Clock className="w-5 h-5" /> },
                                            { type: 'QR_CODE', label: 'QR', desc: 'Enlace escaneable.', color: 'from-neutral-500 to-neutral-700', icon: 'Q' },
                                            { type: 'CATEGORY_NAV', label: 'Menú Táctil', desc: 'Navegación principal.', color: 'from-blue-400 to-cyan-500', icon: 'M' },
                                            { type: 'WEATHER', label: 'Clima Vivo', desc: 'Pronóstico en tiempo real.', color: 'from-sky-400 to-blue-600', icon: 'W' },
                                            { type: 'NAV_BUTTON', label: 'Botón', desc: 'Volver/Link.', color: 'from-pink-500 to-rose-600', icon: 'N' },
                                            { type: 'TICKER', label: 'Ticker', desc: 'Cinta de noticias.', color: 'from-blue-600 to-blue-800', icon: <Megaphone className="w-5 h-5" /> },
                                            { type: 'SOCIAL_FEED', label: 'Social Feed', desc: 'Reseñas e Instagram.', color: 'from-pink-600 to-purple-700', icon: <Instagram className="w-5 h-5" /> },
                                            { type: 'COUNTDOWN', label: 'Countdown', desc: 'Reloj regresivo.', color: 'from-orange-500 to-red-600', icon: <Clock className="w-5 h-5" /> },
                                            { type: 'ATMOSPHERE', label: 'Atmósfera', desc: 'Efectos partículas.', color: 'from-amber-400 to-yellow-600', icon: <Sparkles className="w-5 h-5" /> },
                                            { type: 'FLIGHT_BOARD', label: 'Vuelos', desc: 'Salidas/Llegadas.', color: 'from-indigo-600 to-blue-900', icon: <PlaneTakeoff className="w-5 h-5" /> },
                                            { type: 'MUSIC_PLAYER', label: 'Música', desc: 'Player visualizer.', color: 'from-emerald-500 to-green-700', icon: <Music className="w-5 h-5" /> },
                                        ]).map((item: any) => (
                                            <button
                                                key={item.type}
                                                onClick={() => addWidget(item.type)}
                                                className="group relative flex items-center gap-3 bg-[#111] hover:bg-white/[0.03] border border-white/5 hover:border-blue-500/30 p-2.5 rounded-lg transition-all overflow-hidden"
                                            >
                                                <div className={`w-10 h-10 rounded-md bg-gradient-to-br ${item.color} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-500 shrink-0`}>
                                                    <span className="text-lg font-black text-white">{item.icon}</span>
                                                </div>
                                                <div className="flex flex-col items-start">
                                                    <span className="text-[12px] font-black uppercase tracking-tight text-white italic">
                                                        {item.label}
                                                    </span>
                                                    <span className="text-[9px] text-neutral-600 font-bold uppercase tracking-widest mt-0.5 leading-none">
                                                        {item.desc}
                                                    </span>
                                                </div>
                                                {/* Preview Placeholder Decoration */}
                                                <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-100 transition-opacity pointer-events-none">
                                                    <div className="w-16 h-16 bg-white/5 rounded-full blur-2xl" />
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </motion.div>
                            )}

                            {activeTab === 'layouts' && (
                                <motion.div
                                    key="layouts"
                                    initial={{ opacity: 0, scale: 0.95, filter: 'blur(10px)' }}
                                    animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
                                    exit={{ opacity: 0, scale: 1.05, filter: 'blur(10px)' }}
                                    transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                                    className="space-y-6"
                                >
                                    <div className="sticky top-0 z-20 bg-[#080808] pb-6 flex flex-col gap-4">
                                        <div className="flex justify-between items-center">
                                            <h2 className="text-[10px] font-black text-blue-500 uppercase tracking-[0.3em] flex items-center gap-2">
                                                <Database className="w-3 h-3" /> Diseños Guardados
                                            </h2>
                                            <button onClick={fetchLayouts} className="p-2 hover:bg-white/5 rounded-md transition-colors">
                                                <RefreshCw className="w-3 h-3 text-neutral-500" />
                                            </button>
                                        </div>
                                        <button
                                            onClick={createNewLayout}
                                            className="w-full flex items-center justify-center gap-2 py-3 bg-white/5 hover:bg-white/10 text-white text-[11px] font-black uppercase rounded-md border border-white/10 transition-all shadow-lg"
                                        >
                                            <Plus className="w-4 h-4" /> Nuevo Lienzo en Blanco
                                        </button>
                                    </div>
                                    <div className="space-y-3 pb-20">
                                        {savedLayouts.length === 0 ? (
                                            <div className="bg-[#111] p-6 rounded-md border border-white/5 text-center">
                                                <p className="text-[10px] text-neutral-600 italic">No hay diseños guardados.</p>
                                            </div>
                                        ) : (
                                            savedLayouts.map((l) => (
                                                <div key={l._id} className="group relative">
                                                    <button
                                                        onClick={() => loadLayout(l)}
                                                        className="w-full text-left p-4 rounded-md bg-[#111] hover:bg-blue-600/10 border border-white/5 hover:border-blue-500/30 transition-all group-hover:pr-12"
                                                    >
                                                        <div className="text-[12px] font-black italic text-neutral-200 group-hover:text-blue-400 truncate">{l.name}</div>
                                                        <div className="flex items-center gap-3 mt-2">
                                                            <div className="text-[9px] text-neutral-600 font-bold uppercase tracking-widest">{l.orientation}</div>
                                                            <div className="w-1 h-1 rounded-full bg-neutral-800" />
                                                            <div className="text-[9px] text-blue-500/60 font-black uppercase">{l.widgets.length} elementos</div>
                                                        </div>
                                                    </button>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            if (confirm('¿Crear copia de este diseño?')) {
                                                                const newLayout = { ...l };
                                                                delete (newLayout as any)._id;
                                                                delete (newLayout as any).__v;
                                                                newLayout.name = `${l.name} (Copia)`;
                                                                socket.emit('save_layout', { screenId: null, layout: newLayout });
                                                                setTimeout(fetchLayouts, 800);
                                                            }
                                                        }}
                                                        className="absolute right-12 top-1/2 -translate-y-1/2 p-2.5 bg-blue-500/10 text-blue-500 hover:bg-blue-500 hover:text-white rounded-md opacity-0 group-hover:opacity-100 transition-all"
                                                        title="Duplicar como plantilla"
                                                    >
                                                        <Copy className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setLayoutToDelete(l);
                                                        }}
                                                        className="absolute right-3 top-1/2 -translate-y-1/2 p-2.5 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white rounded-md opacity-0 group-hover:opacity-100 transition-all"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </motion.div>
                            )}

                            {activeTab === 'products' && (
                                <motion.div
                                    key="products"
                                    initial={{ opacity: 0, scale: 0.95, filter: 'blur(10px)' }}
                                    animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
                                    exit={{ opacity: 0, scale: 1.05, filter: 'blur(10px)' }}
                                    transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                                    className="space-y-6"
                                >
                                    <div className="sticky top-0 z-20 bg-[#080808] pt-2 pb-6 space-y-6">
                                        <div className="flex items-center justify-between">
                                            <div className="flex bg-black/60 backdrop-blur-md rounded-full p-1.5 border border-white/5 shadow-2xl">
                                                {(['categories', 'products'] as const).map((view) => (
                                                    <button
                                                        key={view}
                                                        onClick={() => setCatalogView(view)}
                                                        className={`px-5 py-2 rounded-full text-[10px] font-black uppercase transition-all duration-300 ${catalogView === view ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/40' : 'text-neutral-500 hover:text-white hover:bg-white/5'}`}
                                                    >
                                                        {view === 'categories' ? 'Categorías' : 'Productos'}
                                                    </button>
                                                ))}
                                            </div>

                                            <button
                                                onClick={catalogView === 'products'
                                                    ? () => setAllProducts([...allProducts, { id: 'p-' + Date.now(), name: 'PRODUCTO PREMIUM', price: 0, currency: '$', description: '', photo: '', categoryIds: [] }])
                                                    : () => setAllCategories([...allCategories, { id: 'cat-' + Date.now(), name: 'NUEVA CATEGORÍA', photo: '', description: '' }])
                                                }
                                                className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all shadow-lg active:scale-90 ${catalogView === 'products' ? 'bg-emerald-500/20 text-emerald-500 border border-emerald-500/20 hover:bg-emerald-500 hover:text-white' : 'bg-blue-500/20 text-blue-500 border border-blue-500/20 hover:bg-blue-500 hover:text-white'}`}
                                            >
                                                <Plus className="w-5 h-5" />
                                            </button>
                                        </div>

                                        <div className="flex items-center gap-3">
                                            <div className="w-6 h-px bg-emerald-500/50" />
                                            <h2 className="text-[11px] font-black text-emerald-500 uppercase tracking-[0.4em] flex items-center gap-2 italic">
                                                <ShoppingBag className="w-4 h-4" /> Catálogo
                                            </h2>
                                        </div>
                                    </div>
                                    {catalogView === 'products' && (
                                        <div className="relative group/adminsearch">
                                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-600 group-focus-within/adminsearch:text-emerald-500 transition-colors" />
                                            <input
                                                type="text"
                                                placeholder="BUSCAR PRODUCTOS POR NOMBRE O DESCRIPCIÓN..."
                                                className="w-full bg-[#111] border border-white/5 rounded-xl py-3.5 pl-12 pr-6 text-[11px] font-black uppercase tracking-widest outline-none focus:border-emerald-500/30 transition-all placeholder:text-neutral-700 italic"
                                                value={adminProductSearch}
                                                onChange={(e) => setAdminProductSearch(e.target.value)}
                                            />
                                        </div>
                                    )}

                                    <div className="space-y-4 pb-20 overflow-x-hidden">
                                        {catalogView === 'categories' ? (
                                            <div className="flex flex-col gap-1.5">
                                                {allCategories.map((cat, idx) => (
                                                    <div key={cat.id} className="bg-[#111]/80 px-3 py-1.5 rounded-lg border border-white/5 flex items-center gap-3 group hover:border-blue-500/40 transition-all">
                                                        <span className="text-[9px] font-black text-blue-500/40 w-4">{idx + 1}</span>
                                                        <input
                                                            className="flex-1 bg-transparent border-none text-[11px] font-black text-white p-0 focus:ring-0 italic uppercase tracking-tight"
                                                            value={cat.name}
                                                            onChange={(e) => {
                                                                const newCats = [...allCategories];
                                                                newCats[idx].name = e.target.value.toUpperCase();
                                                                setAllCategories(newCats);
                                                            }}
                                                        />
                                                        <button
                                                            onClick={() => setAllCategories(allCategories.filter((_, i) => i !== idx))}
                                                            className="text-red-500/10 hover:text-red-500 transition-all p-1.5"
                                                        >
                                                            <Trash2 className="w-3.5 h-3.5" />
                                                        </button>
                                                    </div>
                                                ))}
                                                {allCategories.length === 0 && (
                                                    <div className="p-10 border border-dashed border-white/5 rounded-xl text-center">
                                                        <p className="text-[10px] text-neutral-600 uppercase font-black tracking-widest italic">No hay categorías definidas</p>
                                                    </div>
                                                )}
                                            </div>
                                        ) : (
                                            allProducts
                                                .filter(p =>
                                                    p.name.toLowerCase().includes(adminProductSearch.toLowerCase()) ||
                                                    p.description?.toLowerCase().includes(adminProductSearch.toLowerCase())
                                                )
                                                .map((p, idx) => (
                                                    <div key={p.id} className="bg-[#111]/50 p-4 rounded-xl border border-white/5 space-y-4 group relative hover:border-emerald-500/10 transition-all shadow-xl">
                                                        {/* Top Row: Image & Name */}
                                                        <div className="flex gap-4">
                                                            <div className="w-20 h-20 rounded-lg overflow-hidden bg-black flex-shrink-0 border border-white/10 shadow-lg relative group/thumb">
                                                                <img src={p.photo || 'https://via.placeholder.com/150'} className="w-full h-full object-cover opacity-80 group-hover/thumb:opacity-100 transition-opacity" />
                                                                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover/thumb:opacity-100 transition-opacity flex items-center justify-center">
                                                                    <ImageUpload
                                                                        compact
                                                                        onUploadSuccess={(url) => {
                                                                            const newP = [...allProducts];
                                                                            newP[idx].photo = url;
                                                                            setAllProducts(newP);
                                                                        }}
                                                                    />
                                                                </div>
                                                            </div>
                                                            <div className="flex-1 min-w-0 flex flex-col justify-between py-1">
                                                                <div className="space-y-1">
                                                                    <label className="text-[7px] font-black text-neutral-600 uppercase tracking-[0.2em] block">Nombre del Producto</label>
                                                                    <input
                                                                        className="w-full bg-transparent border-none text-[14px] font-black text-white p-0 focus:ring-0 placeholder:text-neutral-800 italic uppercase leading-tight"
                                                                        value={p.name}
                                                                        placeholder="Nombre..."
                                                                        onChange={(e) => {
                                                                            const newP = [...allProducts];
                                                                            newP[idx].name = e.target.value;
                                                                            setAllProducts(newP);
                                                                        }}
                                                                    />
                                                                </div>
                                                                <div className="space-y-1">
                                                                    <label className="text-[7px] font-black text-neutral-600 uppercase tracking-[0.2em] block">Categoría vinculada</label>
                                                                    <select
                                                                        className="w-full bg-black/40 border border-white/5 rounded-md px-2 py-1.5 text-[10px] font-black text-blue-400 outline-none appearance-none cursor-pointer hover:bg-black/60 transition-colors"
                                                                        value={p.categoryIds?.[0] || ''}
                                                                        onChange={(e) => {
                                                                            const newP = [...allProducts];
                                                                            newP[idx].categoryIds = [e.target.value];
                                                                            setAllProducts(newP);
                                                                        }}
                                                                    >
                                                                        <option value="" className="text-neutral-500">SIN CATEGORÍA</option>
                                                                        {allCategories.map(cat => (
                                                                            <option key={cat.id} value={cat.id} className="bg-[#111]">{cat.name}</option>
                                                                        ))}
                                                                    </select>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* Price & Currency Row (Better spaced) */}
                                                        <div className="grid grid-cols-2 gap-2 p-2 bg-black/30 rounded-lg border border-white/5">
                                                            <div className="space-y-1">
                                                                <label className="text-[7px] font-black text-neutral-600 uppercase tracking-widest block px-1">Moneda</label>
                                                                <div className="relative group/curr">
                                                                    <div className="absolute left-2 top-1/2 -translate-y-1/2 pointer-events-none text-xs">
                                                                        {p.currency === 'U$D' ? '🇺🇸' : p.currency === 'R$' ? '🇧🇷' : p.currency === 'AR$' ? '🇦🇷' : '🇺🇾'}
                                                                    </div>
                                                                    <select
                                                                        className="w-full bg-white/5 border border-white/5 rounded-md pl-7 pr-2 py-2 text-[10px] font-black text-white outline-none cursor-pointer appearance-none hover:bg-white/10 transition-colors"
                                                                        value={p.currency || '$'}
                                                                        onChange={(e) => {
                                                                            const newP = [...allProducts];
                                                                            newP[idx].currency = e.target.value;
                                                                            setAllProducts(newP);
                                                                        }}
                                                                    >
                                                                        <option value="$">PESOS (UYU)</option>
                                                                        <option value="U$D">DÓLARES (USD)</option>
                                                                        <option value="R$">REALES (BRL)</option>
                                                                        <option value="AR$">P. ARGENTINOS (ARS)</option>
                                                                    </select>
                                                                </div>
                                                            </div>
                                                            <div className="space-y-1">
                                                                <label className="text-[7px] font-black text-neutral-600 uppercase tracking-widest block px-1">Precio Final</label>
                                                                <div className="relative">
                                                                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[9px] font-black text-emerald-500/50 italic opacity-0 md:opacity-100">$</span>
                                                                    <input
                                                                        className="w-full bg-white/5 border border-white/5 rounded-md px-2 py-2 text-[14px] font-black text-emerald-500 text-right outline-none focus:border-emerald-500/30 transition-all font-mono"
                                                                        value={p.price}
                                                                        type="number"
                                                                        onChange={(e) => {
                                                                            const newP = [...allProducts];
                                                                            newP[idx].price = parseFloat(e.target.value);
                                                                            setAllProducts(newP);
                                                                        }}
                                                                    />
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <textarea
                                                            className="w-full bg-black/40 border border-white/5 rounded-lg p-3 text-[11px] text-neutral-500 h-20 resize-none outline-none focus:border-emerald-500/50 transition-colors placeholder:text-neutral-800"
                                                            value={p.description}
                                                            placeholder="Descripción premium del producto..."
                                                            onChange={(e) => {
                                                                const newP = [...allProducts];
                                                                newP[idx].description = e.target.value;
                                                                setAllProducts(newP);
                                                            }}
                                                        />

                                                        <div className="flex justify-between items-center pt-2 border-t border-white/5">
                                                            <div className="text-[7px] font-bold text-neutral-700 uppercase tracking-widest italic tracking-tighter shrink-0">ID: {p.id.substring(0, 8)}</div>
                                                            <button
                                                                onClick={() => setAllProducts(allProducts.filter((_, i) => i !== idx))}
                                                                className="flex items-center gap-2 px-3 py-1.5 bg-red-500/5 text-red-500/40 hover:bg-red-500 hover:text-white rounded-lg text-[9px] font-black uppercase transition-all"
                                                            >
                                                                <Trash2 className="w-3 h-3" /> Eliminar
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))
                                        )}
                                    </div>
                                </motion.div>
                            )}

                            {activeTab === 'activities' && (
                                <motion.div
                                    key="activities"
                                    initial={{ opacity: 0, scale: 0.95, filter: 'blur(10px)' }}
                                    animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
                                    exit={{ opacity: 0, scale: 1.05, filter: 'blur(10px)' }}
                                    transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                                    className="space-y-6"
                                >
                                    <div className="sticky top-0 z-20 bg-[#080808] pb-6 flex justify-between items-center gap-4">
                                        <h2 className="text-[10px] font-black text-amber-500 uppercase tracking-widest flex items-center gap-2 italic">
                                            <RefreshCw className="w-3 h-3" /> Cronograma de Actividades
                                        </h2>
                                        <button
                                            onClick={() => setAllActivities([...allActivities, { category: 'CINE', time: '20:00', title: 'Nueva Actividad', desc: '', photo: '' }])}
                                            className="w-8 h-8 bg-amber-500/10 text-amber-500 hover:bg-amber-500 hover:text-white rounded-lg transition-all flex items-center justify-center border border-amber-500/20 active:scale-90"
                                            title="Nueva Actividad"
                                        >
                                            <Plus className="w-4 h-4" />
                                        </button>
                                    </div>

                                    <div className="space-y-4 pb-20 overflow-x-hidden pr-2 custom-scrollbar max-h-[calc(100vh-250px)] overflow-y-auto">
                                        {allActivities.map((a, idx) => (
                                            <div key={idx} className="bg-[#111]/50 p-4 rounded-xl border border-white/5 space-y-4 group hover:border-amber-500/10 transition-all shadow-xl">
                                                {/* Top Row: Category & Time */}
                                                <div className="grid grid-cols-5 gap-2">
                                                    <div className="col-span-3 space-y-1">
                                                        <label className="text-[7px] font-black text-neutral-600 uppercase tracking-widest block px-1">Sección/Lugar</label>
                                                        <input
                                                            className="w-full bg-black/40 border border-white/5 rounded-md px-3 py-1.5 text-[10px] font-black text-amber-500 uppercase outline-none focus:border-amber-500/30 transition-all italic"
                                                            value={a.category}
                                                            onChange={(e) => {
                                                                const newA = [...allActivities];
                                                                newA[idx].category = e.target.value.toUpperCase();
                                                                setAllActivities(newA);
                                                            }}
                                                        />
                                                    </div>
                                                    <div className="col-span-2 space-y-1">
                                                        <label className="text-[7px] font-black text-neutral-600 uppercase tracking-widest block px-1">Horario</label>
                                                        <input
                                                            className="w-full bg-black/30 border border-white/5 rounded-md px-2 py-1.5 text-[10px] font-black text-white text-center outline-none focus:border-amber-500/30 transition-all font-mono"
                                                            value={a.time}
                                                            placeholder="00:00 a 00:00"
                                                            onChange={(e) => {
                                                                const newA = [...allActivities];
                                                                newA[idx].time = e.target.value;
                                                                setAllActivities(newA);
                                                            }}
                                                        />
                                                    </div>
                                                </div>

                                                {/* Middle: Title & Image Thumb */}
                                                <div className="flex gap-4">
                                                    <div className="w-16 h-16 rounded-lg overflow-hidden bg-black flex-shrink-0 border border-white/10 relative group/actphoto">
                                                        <img src={a.photo || 'https://via.placeholder.com/150'} className="w-full h-full object-cover opacity-60 group-hover/actphoto:opacity-100 transition-opacity" />
                                                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover/actphoto:opacity-100 transition-opacity flex items-center justify-center">
                                                            <ImageUpload
                                                                compact
                                                                onUploadSuccess={(url) => {
                                                                    const newA = [...allActivities];
                                                                    newA[idx].photo = url;
                                                                    setAllActivities(newA);
                                                                }}
                                                            />
                                                        </div>
                                                    </div>
                                                    <div className="flex-1 space-y-1 py-1">
                                                        <label className="text-[7px] font-black text-neutral-600 uppercase tracking-widest block">Nombre de la Actividad</label>
                                                        <input
                                                            className="w-full bg-transparent border-none text-[13px] font-black text-white p-0 focus:ring-0 placeholder:text-neutral-800 italic uppercase leading-tight"
                                                            value={a.title}
                                                            onChange={(e) => {
                                                                const newA = [...allActivities];
                                                                newA[idx].title = e.target.value;
                                                                setAllActivities(newA);
                                                            }}
                                                        />
                                                    </div>
                                                </div>

                                                <textarea
                                                    className="w-full bg-black/40 border border-white/5 rounded-lg p-3 text-[10px] text-neutral-500 h-16 resize-none outline-none focus:border-amber-500/50 transition-colors placeholder:text-neutral-800"
                                                    value={a.desc}
                                                    placeholder="Detalles de la actividad (capacidad, requisitos...)"
                                                    onChange={(e) => {
                                                        const newA = [...allActivities];
                                                        newA[idx].desc = e.target.value;
                                                        setAllActivities(newA);
                                                    }}
                                                />

                                                <div className="flex justify-between items-center pt-2 border-t border-white/5">
                                                    <div className="text-[7px] font-bold text-neutral-700 uppercase tracking-widest italic tracking-tighter">Actividad #{idx + 1}</div>
                                                    <button
                                                        onClick={() => setAllActivities(allActivities.filter((_, i) => i !== idx))}
                                                        className="flex items-center gap-2 px-3 py-1.5 bg-red-500/5 text-red-500/40 hover:bg-red-500 hover:text-white rounded-lg text-[9px] font-black uppercase transition-all"
                                                    >
                                                        <Trash2 className="w-3 h-3" /> ELIMINAR
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </motion.div>
                            )}



                            {activeTab === 'flow' && (
                                <div className="h-full flex flex-col">
                                    <div className="flex justify-between items-center mb-6 pl-2">
                                        <h2 className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.3em] flex items-center gap-2">
                                            <Network className="w-3 h-3" /> Mapa de Navegación
                                        </h2>
                                    </div>
                                    <div className="flex-1 bg-[#111] rounded-xl border border-white/5 overflow-hidden relative">
                                        <FlowMap
                                            layouts={savedLayouts}
                                            onEditLayout={(l) => {
                                                loadLayout(l);
                                                setActiveTab('components'); // Switch to editor, or stay in flow? Usually editor is what user wants.
                                                // Actually loadLayout updates state, but UI is split by tabs.
                                                // If loadLayout sets 'editingLayoutId', usually the main view is 'components' or editing mode.
                                                // But in this new tabs design (components, layouts, flow...), editing happens in the center canvas which is always visible unless hidden?
                                                // Ah, looking at layout: Canvas is visible always (line 803+). The sidebar tabs just change the *left panel*.
                                                // So if I click a node, I want to see its properties.
                                                // loadLayout sets selectedWidgetId(null) and updates widgets array. The Canvas updates immediately.
                                                // I probably don't need to change tab, but maybe switching to 'components' allows adding new widgets. 
                                                // Let's keep it simple: just loadLayout. The user sees the canvas update.
                                            }}
                                        />
                                    </div>
                                </div>
                            )}

                            {activeTab === 'screens' && (
                                <motion.div
                                    key="screens"
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    className="space-y-6"
                                >
                                    <div className="flex justify-between items-center mb-6">
                                        <h2 className="text-[10px] font-black text-white uppercase tracking-[0.3em] flex items-center gap-2">
                                            <Smartphone className="w-3 h-3 text-blue-500" /> Gestión de Pantallas Centralizada
                                        </h2>
                                        <span className="text-[9px] font-black text-neutral-600 uppercase tracking-widest">{screens.length} Activas</span>
                                    </div>

                                    <div className="space-y-6 pb-20">
                                        {screens.length === 0 ? (
                                            <div className="bg-[#111] p-10 rounded-xl border border-white/5 text-center space-y-4">
                                                <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center mx-auto">
                                                    <Smartphone className="w-6 h-6 text-neutral-700" />
                                                </div>
                                                <p className="text-[10px] text-neutral-600 italic uppercase tracking-widest">Esperando que nuevas pantallas se conecten...</p>
                                            </div>
                                        ) : (
                                            screens.map((s) => {
                                                const isOnline = Date.now() - new Date(s.lastSeen).getTime() < 15000;
                                                const playerUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/player/${s.screenId}`;

                                                return (
                                                    <div key={s.screenId} className={`relative p-6 rounded-xl border transition-all overflow-hidden ${screenId === s.screenId ? 'bg-blue-600/5 border-blue-500/40 shadow-2xl' : 'bg-[#111] border-white/5 hover:border-white/10'}`}>
                                                        {/* Status Header */}
                                                        <div className="flex items-center justify-between mb-6">
                                                            <div className="flex items-center gap-3">
                                                                <div className={`w-2.5 h-2.5 rounded-full ${isOnline ? 'bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.8)]' : 'bg-red-500/50'}`} />
                                                                <input
                                                                    className="bg-transparent border-none text-base font-black text-white focus:ring-0 p-0 w-48 placeholder:text-neutral-700 italic uppercase tracking-tighter"
                                                                    value={s.name || s.screenId}
                                                                    onChange={(e) => socket.emit('rename_screen', { screenId: s.screenId, name: e.target.value })}
                                                                />
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                <span className={`text-[8px] font-black uppercase px-2 py-1 rounded-md ${isOnline ? 'text-emerald-500 bg-emerald-500/10' : 'text-neutral-600 bg-white/5'}`}>
                                                                    {isOnline ? 'ONLINE' : 'OFFLINE'}
                                                                </span>
                                                            </div>
                                                        </div>

                                                        {/* Assigned Menu / Layout */}
                                                        <div className="space-y-3 mb-6">
                                                            <label className="text-[8px] font-black text-neutral-600 uppercase tracking-widest block">Menú Asignado (Layout)</label>
                                                            <select
                                                                className="w-full bg-black/40 border border-white/5 rounded-lg px-4 py-3 text-[11px] font-black italic text-blue-400 outline-none focus:border-blue-500/50 appearance-none"
                                                                value={s.lastLayoutId || ''}
                                                                onChange={(e) => socket.emit('assign_layout_to_screen', { screenId: s.screenId, layoutId: e.target.value })}
                                                            >
                                                                <option value="">(Sin asignar)</option>
                                                                {savedLayouts.map(l => (
                                                                    <option key={l._id} value={l._id}>{l.name}</option>
                                                                ))}
                                                            </select>
                                                        </div>

                                                        {/* Assigned Schedule */}
                                                        <div className="space-y-3 mb-6">
                                                            <label className="text-[8px] font-black text-neutral-600 uppercase tracking-widest block">Calendario Programado (Opcional)</label>
                                                            <select
                                                                className="w-full bg-black/40 border border-white/5 rounded-lg px-4 py-3 text-[11px] font-black italic text-emerald-400 outline-none focus:border-emerald-500/50 appearance-none"
                                                                value={s.scheduleId || ''}
                                                                onChange={(e) => socket.emit('assign_schedule_to_screen', { screenId: s.screenId, scheduleId: e.target.value })}
                                                            >
                                                                <option value="">(Manual - Sin Calendario)</option>
                                                                {allSchedules.map(sch => (
                                                                    <option key={sch._id} value={sch._id}>{sch.name.toUpperCase()}</option>
                                                                ))}
                                                            </select>
                                                            <p className="text-[8px] text-neutral-600 font-bold uppercase italic px-1">
                                                                * Si asignas un calendario, el diseño cambiará automáticamente según el horario.
                                                            </p>
                                                        </div>

                                                        {/* URL Display */}
                                                        <div className="bg-black/40 p-3 rounded-lg border border-white/5 flex items-center justify-between gap-4 mb-6">
                                                            <div className="flex-1 min-w-0">
                                                                <label className="text-[7px] font-black text-neutral-700 uppercase tracking-widest block mb-1">Display URL</label>
                                                                <div className="text-[10px] font-mono text-neutral-500 truncate select-all">{playerUrl}</div>
                                                            </div>
                                                            <button
                                                                onClick={() => {
                                                                    navigator.clipboard.writeText(playerUrl);
                                                                    // Optional: add toast
                                                                }}
                                                                className="p-2 hover:bg-white/5 rounded-md text-neutral-500 hover:text-white transition-all"
                                                                title="Copiar URL"
                                                            >
                                                                <Copy className="w-4 h-4" />
                                                            </button>
                                                            <Link href={playerUrl} target="_blank">
                                                                <button className="p-2 hover:bg-white/5 rounded-md text-blue-500 hover:text-blue-400 transition-all">
                                                                    <Eye className="w-4 h-4" />
                                                                </button>
                                                            </Link>
                                                        </div>

                                                        <div className="flex items-center justify-between pt-4 border-t border-white/5">
                                                            <button
                                                                onClick={() => socket.emit('authorize_screen', { screenId: s.screenId, isAuthorized: !s.isAuthorized })}
                                                                className={`flex items-center gap-2 group/auth text-[9px] font-black uppercase transition-all px-4 py-2 rounded-lg ${s.isAuthorized ? 'text-emerald-500 hover:text-emerald-400 bg-emerald-500/5' : 'text-red-500/40 hover:text-red-500 bg-red-500/5'}`}
                                                            >
                                                                <Zap className={`w-3.5 h-3.5 ${s.isAuthorized ? 'fill-emerald-500' : ''}`} />
                                                                {s.isAuthorized ? 'Acceso Autorizado' : 'Restringir Acceso'}
                                                            </button>

                                                            <button
                                                                onClick={() => setScreenId(s.screenId)}
                                                                className={`text-[10px] font-black px-6 py-2 rounded-lg transition-all flex items-center gap-2 ${screenId === s.screenId ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30' : 'bg-white/5 text-neutral-500 hover:text-white border border-white/5'}`}
                                                            >
                                                                <RefreshCw className={`w-3.5 h-3.5 ${screenId === s.screenId ? 'animate-spin-slow' : ''}`} />
                                                                {screenId === s.screenId ? 'MODO CONTROL' : 'CONTROLAR'}
                                                            </button>
                                                        </div>
                                                    </div>
                                                );
                                            })
                                        )}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </motion.aside >

                {/* Main Workspace (Canvas Area) */}
                < main className="flex-1 bg-[#0a0a0a] p-12 overflow-hidden relative" >
                    {/* Background Texture */}
                    < div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '40px 40px' }
                    } />

                    < div className="h-full flex flex-col gap-8 max-w-[1400px] mx-auto relative z-10" >
                        {/* Status/Control Bar */}
                        < div className="flex items-center justify-between" >
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-blue-600/10 rounded-lg">
                                    <Palette className="w-5 h-5 text-blue-500" />
                                </div>
                                <input
                                    value={layoutName}
                                    onChange={(e) => setLayoutName(e.target.value)}
                                    className="bg-transparent border-none text-2xl font-black text-white focus:ring-0 p-0 w-[400px] placeholder:text-neutral-800 italic uppercase tracking-tighter"
                                    placeholder="NOMBRE DEL DISEÑO..."
                                />
                            </div>

                            <div className="flex bg-[#111] p-1.5 rounded-lg border border-white/5">
                                <button
                                    onClick={() => setOrientation('landscape')}
                                    className={`px-6 py-2 rounded-md text-[10px] font-black uppercase transition-all flex items-center gap-2 ${orientation === 'landscape' ? 'bg-blue-600 text-white shadow-xl shadow-blue-600/20' : 'text-neutral-500 hover:text-neutral-300'}`}
                                >
                                    <Monitor className="w-4 h-4" /> Landscape
                                </button>
                                <button
                                    onClick={() => setOrientation('portrait')}
                                    className={`px-6 py-2 rounded-md text-[10px] font-black uppercase transition-all flex items-center gap-2 ${orientation === 'portrait' ? 'bg-blue-600 text-white shadow-xl shadow-blue-600/20' : 'text-neutral-500 hover:text-neutral-300'}`}
                                >
                                    <Smartphone className="w-4 h-4" /> Portrait
                                </button>
                            </div>
                        </div >

                        {/* Interactive Canvas */}
                        {/* Interactive Canvas */}
                        <div className="flex-1 min-h-0 bg-[#050505] rounded-xl border border-white/5 shadow-[0_0_100px_rgba(0,0,0,0.5)] overflow-auto p-6 relative group custom-scrollbar">
                            <Canvas
                                orientation={orientation}
                                widgets={widgets}
                                onWidgetsChange={setWidgets}
                                selectedId={selectedWidgetId}
                                onSelect={setSelectedWidgetId}
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
                                    <MousePointer2 className="w-10 h-10 text-blue-500 animate-bounce" />
                                    <span className="text-[10px] font-black text-blue-500/50 uppercase tracking-[0.4em]">Haz click en un elemento para editarlo</span>
                                </div>
                            )}
                        </div>
                    </div >
                </main >

                {/* Properties Inspector Panel */}
                <motion.aside
                    initial={false}
                    animate={{
                        width: rightSidebarOpen ? 400 : 0,
                        opacity: rightSidebarOpen ? 1 : 0
                    }}
                    transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                    className="bg-[#080808] border-l border-white/5 flex flex-col overflow-hidden relative group/rightsidebar"
                >
                    {/* Toggle Button Right */}
                    <button
                        onClick={() => setRightSidebarOpen(!rightSidebarOpen)}
                        className={`absolute top-1/2 -left-4 -translate-y-1/2 z-[60] w-8 h-16 bg-[#080808] border border-white/10 rounded-l-xl flex items-center justify-center text-neutral-500 hover:text-blue-500 transition-all shadow-2xl opacity-0 group-hover/rightsidebar:opacity-100 ${!rightSidebarOpen ? 'opacity-100 !-left-10 rounded-r-none' : ''}`}
                    >
                        {rightSidebarOpen ? <PanelRightClose className="w-4 h-4" /> : <PanelRightOpen className="w-4 h-4" />}
                    </button>

                    <div className="flex-1 min-w-[400px] flex flex-col h-full overflow-hidden">
                        {
                            selectedWidget ? (
                                <div className="flex-1 flex flex-col h-full overflow-hidden" >
                                    <div className="flex-1 overflow-y-auto custom-scrollbar">
                                        <div className="p-8 border-b border-white/5 bg-gradient-to-br from-blue-600/5 to-transparent">
                                            <div className="flex items-center justify-between mb-4">
                                                <span className="bg-blue-500 text-white text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-widest">
                                                    {selectedWidget.type === 'CATEGORY_NAV' ? 'MENÚ TÁCTIL' :
                                                        selectedWidget.type === 'NAV_BUTTON' ? 'BOTÓN NAVEGACIÓN' :
                                                            selectedWidget.type === 'PRODUCT_LIST' ? 'LISTA PRODUCTOS' :
                                                                selectedWidget.type}
                                                </span>
                                                <button onClick={() => setSelectedWidgetId(null)} className="text-neutral-600 hover:text-white transition-colors">
                                                    <RefreshCw className="w-4 h-4" />
                                                </button>
                                            </div>
                                            <h3 className="text-xl font-black uppercase tracking-tighter text-white">Editar Propiedades</h3>
                                        </div >

                                        <section className="p-8 space-y-8">
                                            <div className="space-y-4">
                                                <h4 className="text-[10px] font-black text-neutral-500 uppercase tracking-widest flex items-center gap-2">
                                                    <Maximize className="w-3 h-3 text-blue-500" /> Geometría
                                                </h4>
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div>
                                                        <label className="text-[9px] text-neutral-600 uppercase block font-black mb-2">Ancho (%)</label>
                                                        <input type="number" value={selectedWidget.w || 0} onChange={(e) => updateSelectedWidgetSize('w', parseInt(e.target.value) || 0)} className="w-full bg-[#111] border border-white/5 rounded-md p-3 text-xs font-black text-white outline-none focus:border-blue-500/50" />
                                                    </div>
                                                    <div>
                                                        <label className="text-[9px] text-neutral-600 uppercase block font-black mb-2">Alto (%)</label>
                                                        <input type="number" value={selectedWidget.h || 0} onChange={(e) => updateSelectedWidgetSize('h', parseInt(e.target.value) || 0)} className="w-full bg-[#111] border border-white/5 rounded-md p-3 text-xs font-black text-white outline-none focus:border-blue-500/50" />
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="space-y-6 pt-6 border-t border-white/5">
                                                {selectedWidget.type === 'TEXT' && (
                                                    <div className="space-y-6">
                                                        <div>
                                                            <label className="text-[9px] text-neutral-600 uppercase block font-black mb-2">Estilo de Texto</label>
                                                            <select
                                                                className="w-full bg-[#111] border border-white/5 rounded-md p-3 text-xs font-black text-white outline-none focus:border-blue-500"
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
                                                                    <label className="text-[8px] font-black text-neutral-600 uppercase block mb-1">Color Inicio</label>
                                                                    <input type="color" value={selectedWidget.data.gradientFrom || '#3b82f6'} onChange={(e) => updateSelectedWidgetData({ gradientFrom: e.target.value })} className="w-full h-8 bg-transparent cursor-pointer" />
                                                                </div>
                                                                <div>
                                                                    <label className="text-[8px] font-black text-neutral-600 uppercase block mb-1">Color Fin</label>
                                                                    <input type="color" value={selectedWidget.data.gradientTo || '#8b5cf6'} onChange={(e) => updateSelectedWidgetData({ gradientTo: e.target.value })} className="w-full h-8 bg-transparent cursor-pointer" />
                                                                </div>
                                                            </div>
                                                        )}

                                                        <div className="grid grid-cols-2 gap-4">
                                                            <div>
                                                                <label className="text-[9px] text-neutral-600 uppercase block font-black mb-2">Tamaño Fuente</label>
                                                                <input type="text" value={selectedWidget.data.fontSize || '2rem'} onChange={(e) => updateSelectedWidgetData({ fontSize: e.target.value })} className="w-full bg-[#111] border border-white/5 rounded-md p-3 text-xs font-black text-white outline-none" />
                                                            </div>
                                                            <div>
                                                                <label className="text-[9px] text-neutral-600 uppercase block font-black mb-2">Alineación</label>
                                                                <select value={selectedWidget.data.textAlign || 'center'} onChange={(e) => updateSelectedWidgetData({ textAlign: e.target.value })} className="w-full bg-[#111] border border-white/5 rounded-md p-3 text-xs font-black text-white outline-none">
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
                                                        <label className="text-[9px] text-neutral-600 uppercase block font-black">URL Video</label>
                                                        <input value={selectedWidget.data.url} onChange={(e) => updateSelectedWidgetData({ url: e.target.value })} className="w-full bg-[#111] border border-white/5 rounded-md p-4 text-xs font-bold text-blue-400 outline-none" placeholder="https://..." />
                                                        <ImageUpload label="Subir Video" onUploadSuccess={(url) => updateSelectedWidgetData({ url })} />
                                                    </div>
                                                )}

                                                {selectedWidget.type === 'SLIDER' && (
                                                    <div className="space-y-6">
                                                        <div className="flex justify-between items-center mb-2">
                                                            <label className="text-[9px] text-neutral-600 uppercase font-black">Items del Slider</label>
                                                            <span className="text-[9px] font-black text-blue-500 bg-blue-500/10 px-2 py-0.5 rounded-full">{selectedWidget.data.images?.length || 0} TOTAL</span>
                                                        </div>
                                                        <div className="grid grid-cols-4 gap-3">
                                                            {selectedWidget.data.images?.map((url: string, idx: number) => (
                                                                <div key={idx} className="relative aspect-square group/img">
                                                                    <img src={url} className="w-full h-full object-cover rounded-md border border-white/10" />
                                                                    <button onClick={() => { const n = selectedWidget.data.images.filter((_: any, i: number) => i !== idx); updateSelectedWidgetData({ images: n }); }} className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover/img:opacity-100 shadow-lg"><Trash2 className="w-2 h-2" /></button>
                                                                </div>
                                                            ))}
                                                            <button onClick={() => { const u = prompt('URL:'); if (u) updateSelectedWidgetData({ images: [...(selectedWidget.data.images || []), u] }); }} className="aspect-square bg-[#111] border border-dashed border-white/10 rounded-md flex items-center justify-center hover:bg-white/5"><Plus className="w-4 h-4 text-neutral-600" /></button>
                                                        </div>
                                                        <ImageUpload label="Subir Imagen/Video" onUploadSuccess={(url) => updateSelectedWidgetData({ images: [...(selectedWidget.data.images || []), url] })} />
                                                    </div>
                                                )}

                                                {selectedWidget.type === 'QR_CODE' && (
                                                    <div className="space-y-6">
                                                        <input className="w-full bg-[#111] border border-white/5 rounded-md p-4 text-xs font-black text-white" value={selectedWidget.data.title} onChange={(e) => updateSelectedWidgetData({ title: e.target.value })} placeholder="TÍTULO QR" />
                                                        <input className="w-full bg-[#111] border border-white/5 rounded-md p-4 text-xs font-black text-blue-400" value={selectedWidget.data.url} onChange={(e) => updateSelectedWidgetData({ url: e.target.value })} placeholder="URL DESTINO" />
                                                        <div className="grid grid-cols-2 gap-4">
                                                            <div><label className="text-[8px] font-black text-neutral-600 uppercase block mb-2">QR</label><input type="color" value={selectedWidget.data.qrColor} onChange={(e) => updateSelectedWidgetData({ qrColor: e.target.value })} className="w-full h-10 bg-transparent cursor-pointer" /></div>
                                                            <div><label className="text-[8px] font-black text-neutral-600 uppercase block mb-2">FONDO</label><input type="color" value={selectedWidget.data.bgColor} onChange={(e) => updateSelectedWidgetData({ bgColor: e.target.value })} className="w-full h-10 bg-transparent cursor-pointer" /></div>
                                                        </div>
                                                    </div>
                                                )}

                                                {selectedWidget.type === 'CATEGORY_NAV' && (
                                                    <div className="space-y-8">
                                                        <div className="bg-blue-600/5 p-6 rounded-xl border border-blue-500/10 space-y-6">
                                                            <div className="flex items-center justify-between">
                                                                <div className="flex flex-col">
                                                                    <span className="text-[11px] font-black text-white uppercase italic tracking-widest">Generador de Layouts</span>
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
                                                                    className="bg-blue-600 hover:bg-blue-500 text-white p-3 rounded-lg transition-all shadow-lg active:scale-95"
                                                                >
                                                                    <Layers className="w-5 h-5" />
                                                                </button>
                                                            </div>

                                                            <div className="space-y-4 pt-4 border-t border-white/5">
                                                                <div className="grid grid-cols-2 gap-4">
                                                                    <div>
                                                                        <label className="text-[8px] font-black text-blue-400/60 uppercase tracking-[0.2em] mb-2 block">Estética del Menú</label>
                                                                        <select
                                                                            className="w-full bg-black/40 border border-white/5 rounded-lg p-3 text-[11px] font-black text-white outline-none focus:border-blue-500/50"
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
                                                                        <label className="text-[8px] font-black text-blue-400/60 uppercase tracking-[0.2em] mb-2 block">Columnas</label>
                                                                        <select
                                                                            className="w-full bg-black/40 border border-white/5 rounded-lg p-3 text-[11px] font-black text-white outline-none"
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
                                                                    <label className="text-[8px] font-black text-blue-400/60 uppercase tracking-[0.2em] mb-2 block">Título del Menú</label>
                                                                    <input
                                                                        className="w-full bg-black/40 border border-white/5 rounded-lg p-4 text-[13px] font-black text-white italic outline-none focus:border-blue-500/50 transition-all font-sans"
                                                                        value={selectedWidget.data.title || ''}
                                                                        onChange={(e) => updateSelectedWidgetData({ title: e.target.value })}
                                                                        placeholder="NUESTRAS SECCIONES"
                                                                    />
                                                                </div>

                                                                <div className="grid grid-cols-2 gap-4">
                                                                    <div>
                                                                        <label className="text-[8px] font-black text-neutral-500 uppercase tracking-widest block mb-2">Diseño de Menú</label>
                                                                        <select
                                                                            className="w-full bg-black/40 border border-white/5 rounded-lg p-3 text-[10px] font-black text-white/70 outline-none"
                                                                            value={selectedWidget.data.layout || 'HORIZONTAL'}
                                                                            onChange={(e) => updateSelectedWidgetData({ layout: e.target.value })}
                                                                        >
                                                                            <option value="HORIZONTAL">Horizontal (Deslizable)</option>
                                                                            <option value="VERTICAL">Vertical (Grilla)</option>
                                                                        </select>
                                                                    </div>
                                                                    {selectedWidget.data.layout === 'VERTICAL' && (
                                                                        <div>
                                                                            <label className="text-[8px] font-black text-neutral-500 uppercase tracking-widest block mb-2">Columnas</label>
                                                                            <select
                                                                                className="w-full bg-black/40 border border-white/5 rounded-lg p-3 text-[10px] font-black text-white/70 outline-none"
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
                                                                    <label className="text-[8px] font-black text-neutral-500 uppercase tracking-widest block mb-2">Estilo de Botones</label>
                                                                    <div className="grid grid-cols-3 gap-2">
                                                                        {(['CARDS', 'GLASS', 'MINIMAL'] as const).map(style => (
                                                                            <button
                                                                                key={style}
                                                                                onClick={() => updateSelectedWidgetData({ buttonStyle: style })}
                                                                                className={`py-2 rounded border text-[8px] font-black transition-all ${selectedWidget.data.buttonStyle === style || (!selectedWidget.data.buttonStyle && style === 'CARDS') ? 'bg-blue-600 border-blue-500 text-white' : 'bg-black/40 border-white/5 text-neutral-600'}`}
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
                                                                <h3 className="text-[10px] font-black text-neutral-500 uppercase tracking-[0.3em]">Botones del Menú</h3>
                                                                <button
                                                                    onClick={() => updateSelectedWidgetData({ categories: [...selectedWidget.data.categories, { id: Math.random(), label: 'NUEVA SECCIÓN', icon: 'Utensils', active: false }] })}
                                                                    className="flex items-center gap-2 px-3 py-1.5 bg-white/5 hover:bg-white/10 text-white rounded-lg text-[9px] font-black uppercase transition-all"
                                                                >
                                                                    <Plus className="w-3 h-3" /> Añadir
                                                                </button>
                                                            </div>

                                                            <div className="space-y-4 pr-2 custom-scrollbar max-h-[800px] overflow-y-auto">
                                                                {selectedWidget.data.categories?.map((cat: any, idx: number) => (
                                                                    <div key={cat.id} className="bg-[#111] p-6 rounded-xl border border-white/5 space-y-5 group relative overflow-hidden">
                                                                        <div className={`absolute top-0 right-0 w-32 h-32 bg-blue-600/5 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none`} />

                                                                        <div className="flex gap-5 relative z-10">
                                                                            <div className="w-20 h-20 rounded-lg bg-black border border-white/10 overflow-hidden flex-shrink-0 relative group/photo shadow-2xl">
                                                                                <img src={cat.photo || 'https://via.placeholder.com/100'} className="w-full h-full object-cover transition-transform duration-700 group-hover/photo:scale-110" />
                                                                                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover/photo:opacity-100 transition-opacity flex items-center justify-center">
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
                                                                                    <label className="text-[8px] font-black text-neutral-600 uppercase tracking-widest block mb-1">Nombre Visual</label>
                                                                                    <input
                                                                                        className="w-full bg-black/40 border border-white/10 rounded-md px-4 py-2.5 text-xs font-black italic outline-none text-white focus:border-blue-500/50 transition-colors"
                                                                                        value={cat.label}
                                                                                        onChange={(e) => {
                                                                                            const newCats = [...selectedWidget.data.categories];
                                                                                            newCats[idx].label = e.target.value;
                                                                                            updateSelectedWidgetData({ categories: newCats });
                                                                                        }}
                                                                                    />
                                                                                </div>



                                                                                <div>
                                                                                    <label className="text-[8px] font-black text-neutral-600 uppercase tracking-widest block mb-1">Color Fondo</label>
                                                                                    <div className="flex items-center gap-3 bg-black/40 border border-white/10 rounded-md p-2 mb-2">
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
                                                                                        <span className="text-[10px] font-mono text-neutral-500 uppercase">{cat.bucketColor || '#111111'}</span>
                                                                                    </div>
                                                                                </div>

                                                                                <div>
                                                                                    <label className="text-[8px] font-black text-neutral-600 uppercase tracking-widest block mb-1">Overlay</label>
                                                                                    <div className="flex items-center gap-3 bg-black/40 border border-white/10 rounded-md p-2 mb-2">
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
                                                                                        <span className="text-[10px] font-mono text-neutral-500 uppercase flex-1">{cat.overlayColor || '#000000'}</span>
                                                                                    </div>
                                                                                    <div className="flex items-center gap-2 px-1">
                                                                                        <span className="text-[8px] text-neutral-600 font-bold">ALPHA</span>
                                                                                        <input
                                                                                            type="range" min="0" max="100"
                                                                                            value={cat.overlayOpacity !== undefined ? cat.overlayOpacity : 30}
                                                                                            onChange={(e) => {
                                                                                                const newCats = [...selectedWidget.data.categories];
                                                                                                newCats[idx].overlayOpacity = parseInt(e.target.value);
                                                                                                updateSelectedWidgetData({ categories: newCats });
                                                                                            }}
                                                                                            className="flex-1 h-1 bg-white/10 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-blue-500"
                                                                                        />
                                                                                        <span className="text-[9px] text-white/50 w-6 text-right tabular-nums">{cat.overlayOpacity !== undefined ? cat.overlayOpacity : 30}%</span>
                                                                                    </div>
                                                                                </div>

                                                                                <div className="grid grid-cols-2 gap-3">
                                                                                    <div className="space-y-1">
                                                                                        <label className="text-[8px] font-black text-neutral-600 uppercase tracking-widest block">Icono</label>
                                                                                        <select
                                                                                            className="w-full bg-black/40 border border-white/10 rounded-md px-3 py-2 text-[10px] font-black text-white/50 outline-none focus:border-blue-500/50"
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
                                                                                        <label className="text-[8px] font-black text-neutral-600 uppercase tracking-widest block">Visibilidad</label>
                                                                                        <button
                                                                                            onClick={() => {
                                                                                                const newCats = selectedWidget.data.categories.map((c: any, i: number) => ({ ...c, active: i === idx }));
                                                                                                updateSelectedWidgetData({ categories: newCats });
                                                                                            }}
                                                                                            className={`w-full py-2 rounded-md text-[9px] font-black uppercase transition-all ${cat.active ? 'bg-blue-600 text-white shadow-lg' : 'bg-neutral-800 text-neutral-500 hover:text-white'}`}
                                                                                        >
                                                                                            {cat.active ? 'VISIBLE' : 'OCULTO'}
                                                                                        </button>
                                                                                    </div>
                                                                                </div>
                                                                            </div>
                                                                        </div>



                                                                        <div className="flex items-center justify-between pt-4 border-t border-white/5 relative z-10">
                                                                            <div className="flex-1">
                                                                                <label className="text-[7px] font-black text-neutral-600 uppercase tracking-widest block mb-1 italic">Vincular a Layout</label>
                                                                                <select
                                                                                    className="w-full bg-transparent border-none text-[11px] font-black text-blue-500 outline-none focus:ring-0 p-0"
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
                                                                                className="p-3 text-red-500/20 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all"
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
                                                                className="w-full bg-[#111] border border-white/5 rounded-md p-3 text-[10px] font-black outline-none focus:border-blue-500"
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
                                                                className="w-full bg-[#111] border border-white/5 rounded-md p-3 text-[10px] font-black outline-none focus:border-blue-500 text-emerald-500"
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
                                                                className="w-full bg-[#111] border border-white/5 rounded-md p-3 text-[10px] font-black outline-none focus:border-blue-500"
                                                                value={selectedWidget.data.label || ''}
                                                                onChange={(e) => updateSelectedWidgetData({ label: e.target.value })}
                                                                placeholder="Ej: VOLVER"
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="text-[8px] font-black text-neutral-700 uppercase mb-1.5 block">Tipo de Acción</label>
                                                            <select
                                                                className="w-full bg-[#111] border border-white/5 rounded-md p-3 text-[10px] font-black outline-none focus:border-blue-500"
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
                                                                    className="w-full bg-[#111] border border-white/5 rounded-md p-3 text-[10px] font-black outline-none focus:border-blue-500 text-blue-400"
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
                                                            <div className="flex items-center gap-4 bg-black/40 p-3 rounded-md border border-white/5">
                                                                <input
                                                                    type="color"
                                                                    className="w-10 h-10 border-none bg-transparent rounded-lg cursor-pointer"
                                                                    value={selectedWidget.data.color || '#3b82f6'}
                                                                    onChange={(e) => updateSelectedWidgetData({ color: e.target.value })}
                                                                />
                                                                <span className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">{selectedWidget.data.color || '#3B82F6'}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}

                                                {selectedWidget.type === 'PRODUCT_LIST' && (
                                                    <div className="space-y-6">
                                                        <div>
                                                            <label className="text-[9px] text-neutral-600 uppercase block font-black mb-2 italic">Título del Menú</label>
                                                            <input
                                                                className="w-full bg-[#111] border border-white/5 rounded-md p-4 text-xs font-black italic outline-none focus:border-blue-500"
                                                                value={selectedWidget.data.title || ''}
                                                                onChange={(e) => updateSelectedWidgetData({ title: e.target.value })}
                                                                placeholder="Ej: NUESTRA CARTA"
                                                            />
                                                        </div>

                                                        <div className="space-y-2">
                                                            <label className="text-[9px] text-neutral-600 uppercase block font-black mb-2 italic">Categorías a Mostrar</label>
                                                            <div className="grid grid-cols-1 gap-1.5 bg-black/20 p-3 rounded-lg border border-white/5 max-h-40 overflow-y-auto custom-scrollbar">
                                                                {allCategories.map((cat) => (
                                                                    <label key={cat.id} className="flex items-center justify-between gap-2 cursor-pointer hover:bg-white/5 px-2 py-1.5 rounded transition-all group/catcheck">
                                                                        <span className="text-[10px] font-black text-neutral-400 uppercase italic group-hover/catcheck:text-blue-400 transition-colors">{cat.name}</span>
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
                                                                            className="w-4 h-4 rounded-md bg-[#111] border-white/10 checked:bg-blue-500 checked:border-blue-500 focus:ring-0 cursor-pointer"
                                                                        />
                                                                    </label>
                                                                ))}
                                                                {allCategories.length === 0 && (
                                                                    <p className="text-[9px] text-neutral-600 italic p-2">No hay categorías definidas en el catálogo.</p>
                                                                )}
                                                            </div>
                                                        </div>
                                                        <div className="p-4 bg-blue-500/5 rounded-md border border-blue-500/10">
                                                            <p className="text-[10px] text-neutral-400 font-bold uppercase tracking-widest leading-relaxed">
                                                                Los productos se gestionan desde la pestaña <ShoppingBag className="w-3 h-3 inline mb-0.5" /> **Catálogo** en la barra lateral izquierda.
                                                            </p>
                                                        </div>
                                                    </div>
                                                )}

                                                {selectedWidget.type === 'ACTIVITIES' && (
                                                    <div className="space-y-6">
                                                        <div>
                                                            <label className="text-[9px] text-neutral-600 uppercase block font-black mb-2 italic">Título de la Agenda</label>
                                                            <input
                                                                className="w-full bg-[#111] border border-white/5 rounded-md p-4 text-xs font-black italic outline-none focus:border-blue-500"
                                                                value={selectedWidget.data.title || ''}
                                                                onChange={(e) => updateSelectedWidgetData({ title: e.target.value })}
                                                                placeholder="Ej: EVENTOS DE HOY"
                                                            />
                                                        </div>

                                                        <div className="space-y-2">
                                                            <label className="text-[9px] text-neutral-600 uppercase block font-black mb-2 italic">Sección a Mostrar</label>
                                                            <select
                                                                className="w-full bg-[#111] border border-white/5 rounded-md p-4 text-[11px] font-black outline-none focus:border-blue-500 text-amber-500"
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
                                                            <p className="text-[10px] text-neutral-400 font-bold uppercase tracking-widest leading-relaxed">
                                                                Las actividades se gestionan desde la pestaña <RefreshCw className="w-3 h-3 inline mb-0.5" /> **Cronograma** en la barra lateral izquierda.
                                                            </p>
                                                        </div>
                                                    </div>
                                                )}

                                                {selectedWidget.type === 'WEATHER' && (
                                                    <div className="space-y-6">
                                                        <div>
                                                            <label className="text-[9px] text-neutral-600 uppercase block font-black mb-2 italic">Ciudad para Clima en Vivo</label>
                                                            <input
                                                                className="w-full bg-[#111] border border-white/5 rounded-md p-4 text-xs font-black italic outline-none focus:border-blue-500 text-blue-400"
                                                                value={selectedWidget.data.city || ''}
                                                                onChange={(e) => updateSelectedWidgetData({ city: e.target.value })}
                                                                placeholder="Ej: Buenos Aires, AR"
                                                            />
                                                        </div>
                                                        <div className="p-4 bg-blue-500/5 rounded-lg border border-blue-500/10 space-y-2">
                                                            <div className="flex items-center gap-2 text-blue-400">
                                                                <Sparkles className="w-3 h-3" />
                                                                <span className="text-[9px] font-black uppercase tracking-widest">Motor Inteligente</span>
                                                            </div>
                                                            <p className="text-[10px] text-neutral-500 font-medium leading-relaxed">
                                                                El widget buscará automáticamente la ubicación y clima en tiempo real. No necesitas configurar nada más.
                                                            </p>
                                                        </div>
                                                    </div>
                                                )}

                                                {selectedWidget.type === 'TICKER' && (
                                                    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
                                                        <div>
                                                            <label className="text-[9px] text-neutral-600 uppercase block font-black mb-2 italic">Mensaje de la Cinta</label>
                                                            <textarea
                                                                value={selectedWidget.data.text || ''}
                                                                onChange={(e) => updateSelectedWidgetData({ text: e.target.value })}
                                                                className="w-full bg-[#111] border border-white/5 rounded-md p-4 text-xs font-bold text-white outline-none min-h-[120px] focus:border-blue-500"
                                                            />
                                                        </div>
                                                        <div className="grid grid-cols-2 gap-4">
                                                            <div>
                                                                <label className="text-[9px] text-neutral-600 uppercase block font-black mb-2 italic">Velocidad</label>
                                                                <input type="number" value={selectedWidget.data.speed} onChange={(e) => updateSelectedWidgetData({ speed: parseInt(e.target.value) })} className="w-full bg-[#111] border border-white/5 rounded-md p-3 text-xs font-black text-white" />
                                                            </div>
                                                            <div>
                                                                <label className="text-[9px] text-neutral-600 uppercase block font-black mb-2 italic">Fondo</label>
                                                                <input type="color" value={selectedWidget.data.bgColor} onChange={(e) => updateSelectedWidgetData({ bgColor: e.target.value })} className="w-full h-10 bg-transparent cursor-pointer" />
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}

                                                {selectedWidget.type === 'COUNTDOWN' && (
                                                    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
                                                        <div>
                                                            <label className="text-[9px] text-neutral-600 uppercase block font-black mb-2 italic">Fecha Objetivo</label>
                                                            <input type="datetime-local" value={selectedWidget.data.targetDate?.substring(0, 16) || ''} onChange={(e) => updateSelectedWidgetData({ targetDate: new Date(e.target.value).toISOString() })} className="w-full bg-[#111] border border-white/5 rounded-md p-4 text-xs font-black text-white" />
                                                        </div>
                                                        <div>
                                                            <label className="text-[9px] text-neutral-600 uppercase block font-black mb-2 italic">Título Superior</label>
                                                            <input type="text" value={selectedWidget.data.title || ''} onChange={(e) => updateSelectedWidgetData({ title: e.target.value })} className="w-full bg-[#111] border border-white/5 rounded-md p-4 text-xs font-black text-white italic" />
                                                        </div>
                                                        <div>
                                                            <label className="text-[9px] text-neutral-600 uppercase block font-black mb-2 italic">Nombre del Evento</label>
                                                            <input type="text" value={selectedWidget.data.subtitle || ''} onChange={(e) => updateSelectedWidgetData({ subtitle: e.target.value })} className="w-full bg-[#111] border border-white/5 rounded-md p-4 text-xs font-black text-white italic" />
                                                        </div>
                                                    </div>
                                                )}

                                                {selectedWidget.type === 'ATMOSPHERE' && (
                                                    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
                                                        <div>
                                                            <label className="text-[9px] text-neutral-600 uppercase block font-black mb-3 italic">Estilo Ambiental</label>
                                                            <div className="grid grid-cols-2 gap-2">
                                                                {['GOLD', 'SNOW', 'SOLAR', 'BUBBLES'].map(t => (
                                                                    <button
                                                                        key={t}
                                                                        onClick={() => updateSelectedWidgetData({ type: t })}
                                                                        className={`py-6 rounded-xl border text-[10px] font-black transition-all ${selectedWidget.data.type === t ? 'bg-amber-500 border-amber-400 text-white shadow-lg shadow-amber-500/20' : 'bg-black/40 border-white/5 text-neutral-600 hover:text-white hover:bg-white/5'}`}
                                                                    >
                                                                        {t}
                                                                    </button>
                                                                ))}
                                                            </div>
                                                        </div>
                                                        <div className="pt-4">
                                                            <label className="text-[9px] text-neutral-600 uppercase block font-black mb-4 italic">Intensidad ({selectedWidget.data.intensity})</label>
                                                            <input type="range" min="5" max="100" value={selectedWidget.data.intensity} onChange={(e) => updateSelectedWidgetData({ intensity: parseInt(e.target.value) })} className="w-full h-1.5 bg-white/10 rounded-full appearance-none accent-amber-500 cursor-pointer" />
                                                        </div>
                                                    </div>
                                                )}

                                                {selectedWidget.type === 'MUSIC_PLAYER' && (
                                                    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
                                                        <div>
                                                            <label className="text-[9px] text-neutral-600 uppercase block font-black mb-2 italic">Canción / Radio</label>
                                                            <input type="text" value={selectedWidget.data.song || ''} onChange={(e) => updateSelectedWidgetData({ song: e.target.value })} className="w-full bg-[#111] border border-white/5 rounded-md p-4 text-xs font-black text-white italic" />
                                                        </div>
                                                        <div>
                                                            <label className="text-[9px] text-neutral-600 uppercase block font-black mb-2 italic">Créditos</label>
                                                            <input type="text" value={selectedWidget.data.artist || ''} onChange={(e) => updateSelectedWidgetData({ artist: e.target.value })} className="w-full bg-[#111] border border-white/5 rounded-md p-4 text-xs font-black text-white italic" />
                                                        </div>
                                                        <div>
                                                            <label className="text-[9px] text-neutral-600 uppercase block font-black mb-2 italic">Color Visualizer</label>
                                                            <input type="color" value={selectedWidget.data.accentColor || '#10b981'} onChange={(e) => updateSelectedWidgetData({ accentColor: e.target.value })} className="w-full h-10 bg-transparent cursor-pointer" />
                                                        </div>
                                                    </div>
                                                )}

                                                {selectedWidget.type === 'FLIGHT_BOARD' && (
                                                    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
                                                        <div>
                                                            <label className="text-[9px] text-neutral-600 uppercase block font-black mb-2 italic">Configuración Tablero</label>
                                                            <select value={selectedWidget.data.type} onChange={(e) => updateSelectedWidgetData({ type: e.target.value })} className="w-full bg-[#111] border border-white/5 rounded-md p-4 text-xs font-black text-white outline-none focus:border-blue-500">
                                                                <option value="DEPARTURES">VUELOS: SALIDAS</option>
                                                                <option value="ARRIVALS">VUELOS: LLEGADAS</option>
                                                            </select>
                                                        </div>
                                                    </div>
                                                )}

                                                {selectedWidget.type === 'SOCIAL_FEED' && (
                                                    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
                                                        <div>
                                                            <label className="text-[9px] text-neutral-600 uppercase block font-black mb-2 italic">Intervalo de Rotación (ms)</label>
                                                            <input type="number" step="1000" min="3000" value={selectedWidget.data.interval} onChange={(e) => updateSelectedWidgetData({ interval: parseInt(e.target.value) })} className="w-full bg-[#111] border border-white/5 rounded-md p-4 text-xs font-black text-white" />
                                                        </div>
                                                        <div className="p-4 bg-pink-500/5 rounded-lg border border-pink-500/10 flex flex-col gap-2">
                                                            <div className="flex items-center gap-2 text-pink-500">
                                                                <Instagram className="w-4 h-4" />
                                                                <span className="text-[9px] font-black uppercase tracking-widest">Feed de Instagram</span>
                                                            </div>
                                                            <p className="text-[10px] text-neutral-500 leading-relaxed italic">
                                                                El sistema alterna automáticamente entre las últimas fotos de Instagram y reseñas premium de TripAdvisor.
                                                            </p>
                                                        </div>
                                                    </div>
                                                )}

                                                {selectedWidget.type === 'PRICE_LIST' && (
                                                    <div className="space-y-6">
                                                        <div>
                                                            <label className="text-[9px] text-neutral-600 uppercase block font-black mb-2 italic">Título del Listado</label>
                                                            <input
                                                                className="w-full bg-[#111] border border-white/5 rounded-md p-4 text-xs font-black italic outline-none focus:border-blue-500"
                                                                value={selectedWidget.data.title || ''}
                                                                onChange={(e) => updateSelectedWidgetData({ title: e.target.value })}
                                                                placeholder="Ej: LISTA DE PRECIOS"
                                                            />
                                                        </div>
                                                        <div className="space-y-3 pt-4 border-t border-white/5">
                                                            <div className="flex justify-between items-center bg-[#111] px-4 py-2 rounded-md">
                                                                <span className="text-[9px] font-black text-neutral-500 tracking-[0.2em] uppercase">Items de Precios</span>
                                                                <button
                                                                    onClick={() => updateSelectedWidgetData({ items: [...(selectedWidget.data.items || []), { name: 'Item Nuevo', price: '$0.00', description: '' }] })}
                                                                    className="text-blue-500 hover:text-white transition-colors"
                                                                >
                                                                    <Plus className="w-4 h-4" />
                                                                </button>
                                                            </div>
                                                            <div className="space-y-2 max-h-[350px] overflow-y-auto pr-2 custom-scrollbar">
                                                                {selectedWidget.data.items?.map((item: any, idx: number) => (
                                                                    <div key={idx} className="bg-[#111]/50 p-4 rounded-md border border-white/5 space-y-3">
                                                                        <div className="flex gap-2">
                                                                            <input
                                                                                className="flex-1 bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-xs font-black italic outline-none text-white focus:border-blue-500/50"
                                                                                value={item.name || ''}
                                                                                onChange={(e) => {
                                                                                    const newItems = [...selectedWidget.data.items];
                                                                                    newItems[idx].name = e.target.value;
                                                                                    updateSelectedWidgetData({ items: newItems });
                                                                                }}
                                                                            />
                                                                            <input
                                                                                className="w-24 bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-xs font-black text-blue-500 outline-none"
                                                                                value={item.price || ''}
                                                                                onChange={(e) => {
                                                                                    const newItems = [...selectedWidget.data.items];
                                                                                    newItems[idx].price = e.target.value;
                                                                                    updateSelectedWidgetData({ items: newItems });
                                                                                }}
                                                                            />
                                                                        </div>
                                                                        <textarea
                                                                            className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-[10px] text-neutral-400 outline-none h-12 resize-none"
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
                                                                                className="text-red-500/40 hover:text-red-500 transition-colors"
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
                                                            <label className="text-[9px] text-neutral-600 uppercase block font-black mb-2">Estilo Visual</label>
                                                            <select
                                                                className="w-full bg-[#111] border border-white/5 rounded-md p-3 text-xs font-black text-white outline-none focus:border-blue-500"
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
                                                                <label className="text-[9px] text-neutral-600 uppercase block font-black mb-2">Formato</label>
                                                                <select
                                                                    className="w-full bg-[#111] border border-white/5 rounded-md p-3 text-xs font-black text-white outline-none"
                                                                    value={selectedWidget.data.format || '24'}
                                                                    onChange={(e) => updateSelectedWidgetData({ format: e.target.value })}
                                                                >
                                                                    <option value="24">24 Horas</option>
                                                                    <option value="12">12 Horas</option>
                                                                </select>
                                                            </div>
                                                            <div>
                                                                <label className="text-[9px] text-neutral-600 uppercase block font-black mb-2">Color Texto</label>
                                                                <div className="flex bg-[#111] border border-white/5 rounded-md p-2">
                                                                    <input
                                                                        type="color"
                                                                        className="w-full h-6 bg-transparent cursor-pointer"
                                                                        value={selectedWidget.data.color || '#ffffff'}
                                                                        onChange={(e) => updateSelectedWidgetData({ color: e.target.value })}
                                                                    />
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="space-y-3 pt-4 border-t border-white/5">
                                                            <label className="flex items-center gap-3 cursor-pointer group">
                                                                <input
                                                                    type="checkbox"
                                                                    className="w-4 h-4 rounded bg-[#111] border-white/10 checked:bg-blue-500"
                                                                    checked={selectedWidget.data.showDate !== false}
                                                                    onChange={(e) => updateSelectedWidgetData({ showDate: e.target.checked })}
                                                                />
                                                                <span className="text-xs font-bold text-neutral-400 group-hover:text-white transition-colors">Mostrar Fecha</span>
                                                            </label>
                                                            <label className="flex items-center gap-3 cursor-pointer group">
                                                                <input
                                                                    type="checkbox"
                                                                    className="w-4 h-4 rounded bg-[#111] border-white/10 checked:bg-blue-500"
                                                                    checked={selectedWidget.data.showSeconds !== false}
                                                                    onChange={(e) => updateSelectedWidgetData({ showSeconds: e.target.checked })}
                                                                />
                                                                <span className="text-xs font-bold text-neutral-400 group-hover:text-white transition-colors">Mostrar Segundos</span>
                                                            </label>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </section>

                                        <div className="p-8 border-t border-white/5 space-y-4 bg-red-500/5">
                                            <button
                                                onClick={() => {
                                                    setWidgets(widgets.filter(w => w.id !== selectedWidgetId));
                                                    setSelectedWidgetId(null);
                                                }}
                                                className="w-full flex items-center justify-center gap-3 py-4 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white text-[11px] font-black uppercase rounded-lg border border-red-500/20 transition-all"
                                            >
                                                <Trash2 className="w-4 h-4" /> Eliminar Objeto
                                            </button>
                                        </div>
                                    </div >
                                </div >
                            ) : (
                                <div className="flex-1 flex flex-col p-8 space-y-10 overflow-y-auto">
                                    <div className="space-y-10">
                                        <div className="space-y-8">
                                            <h3 className="text-xl font-black text-white italic uppercase tracking-tighter flex items-center gap-3">
                                                <Settings2 className="w-6 h-6 text-blue-500" /> Lienzo Maestro
                                            </h3>

                                            <div className="space-y-6">
                                                <div className="space-y-4">
                                                    <div className="flex items-center justify-between">
                                                        <label className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">Color de Fondo</label>
                                                        <input
                                                            type="color"
                                                            value={backgroundColor}
                                                            onChange={(e) => setBackgroundColor(e.target.value)}
                                                            className="w-10 h-10 rounded-md bg-transparent border-none cursor-pointer"
                                                        />
                                                    </div>

                                                    <ImageUpload
                                                        label="Fondo de Imagen"
                                                        onUploadSuccess={(url) => {
                                                            setBackgroundImage(url);
                                                            setBackgroundVideo('');
                                                        }}
                                                    />

                                                    <div className="space-y-2">
                                                        <label className="text-[9px] text-neutral-600 uppercase block font-black mb-1">URL de Video Fondo</label>
                                                        <input
                                                            className="w-full bg-black/40 border border-white/5 rounded-md p-3 text-xs font-bold text-blue-400 outline-none"
                                                            value={backgroundVideo}
                                                            onChange={(e) => {
                                                                setBackgroundVideo(e.target.value);
                                                                setBackgroundImage('');
                                                            }}
                                                            placeholder="https://..."
                                                        />
                                                        <ImageUpload
                                                            compact
                                                            label="O sube tu propio video"
                                                            onUploadSuccess={(url) => {
                                                                setBackgroundVideo(url);
                                                                setBackgroundImage('');
                                                            }}
                                                        />
                                                    </div>

                                                    {(backgroundImage || backgroundVideo) && (
                                                        <div className="relative group aspect-video rounded-lg overflow-hidden border border-white/10 shadow-2xl">
                                                            {backgroundImage ? (
                                                                <img src={backgroundImage} className="w-full h-full object-cover" />
                                                            ) : (
                                                                <video src={backgroundVideo} className="w-full h-full object-cover" autoPlay muted loop />
                                                            )}
                                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                                <button
                                                                    onClick={() => {
                                                                        setBackgroundImage('');
                                                                        setBackgroundVideo('');
                                                                    }}
                                                                    className="bg-red-500 text-white p-2 rounded-md"
                                                                >
                                                                    <Trash2 className="w-5 h-5" />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="space-y-4 pt-6 border-t border-white/5">
                                                    <div className="flex justify-between items-center">
                                                        <label className="text-[10px] font-black text-neutral-500 uppercase tracking-widest flex items-center gap-2">
                                                            <Sparkles className="w-4 h-4" /> Estilo Atmosférico
                                                        </label>
                                                        <span className="text-[10px] font-black text-blue-500">{backgroundBlur}px</span>
                                                    </div>
                                                    <input
                                                        type="range" min="0" max="40"
                                                        value={backgroundBlur}
                                                        onChange={(e) => setBackgroundBlur(parseInt(e.target.value))}
                                                        className="w-full h-1.5 bg-[#1a1a1a] rounded-full appearance-none cursor-pointer accent-blue-500 shadow-inner"
                                                    />
                                                    <p className="text-[9px] text-neutral-600 font-bold leading-relaxed">
                                                        Aumenta el desenfoque para dar un toque sofisticado y premium a tu menú interactivo.
                                                    </p>
                                                </div>

                                                <div className="space-y-6 pt-6 border-t border-white/5">
                                                    <h4 className="text-[10px] font-black text-blue-500 uppercase tracking-widest flex items-center gap-2 mb-4">
                                                        <Palette className="w-4 h-4" /> Capas de Diseño (Masks)
                                                    </h4>

                                                    <div className="space-y-4">
                                                        <div className="flex items-center justify-between">
                                                            <label className="text-[9px] text-neutral-400 font-black uppercase">Color de Overlay</label>
                                                            <input
                                                                type="color"
                                                                value={backgroundOverlayColor}
                                                                onChange={(e) => setBackgroundOverlayColor(e.target.value)}
                                                                className="w-8 h-8 rounded bg-transparent border-none cursor-pointer"
                                                            />
                                                        </div>

                                                        <div className="space-y-2">
                                                            <div className="flex justify-between text-[9px] font-black text-neutral-500 uppercase">
                                                                <span>Opacidad Máscara</span>
                                                                <span>{Math.round(backgroundOverlayOpacity * 100)}%</span>
                                                            </div>
                                                            <input
                                                                type="range" min="0" max="1" step="0.05"
                                                                value={backgroundOverlayOpacity}
                                                                onChange={(e) => setBackgroundOverlayOpacity(parseFloat(e.target.value))}
                                                                className="w-full h-1 bg-white/10 rounded-full appearance-none accent-blue-500"
                                                            />
                                                        </div>

                                                        <div className="space-y-2">
                                                            <label className="text-[9px] text-neutral-400 font-black uppercase block mb-2">Patrón de Textura</label>
                                                            <div className="grid grid-cols-5 gap-2">
                                                                {(['none', 'dots', 'grid', 'waves', 'noise'] as const).map(p => (
                                                                    <button
                                                                        key={p}
                                                                        onClick={() => setBackgroundPattern(p)}
                                                                        className={`p-2 rounded border text-[8px] font-black uppercase transition-all ${backgroundPattern === p ? 'bg-blue-600 border-blue-500 text-white' : 'bg-black/40 border-white/5 text-neutral-600'}`}
                                                                    >
                                                                        {p}
                                                                    </button>
                                                                ))}
                                                            </div>
                                                        </div>

                                                        {backgroundPattern !== 'none' && (
                                                            <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                                                                <div className="flex justify-between text-[9px] font-black text-neutral-500 uppercase">
                                                                    <span>Intensidad Patrón</span>
                                                                    <span>{Math.round(backgroundPatternOpacity * 100)}%</span>
                                                                </div>
                                                                <input
                                                                    type="range" min="0" max="1" step="0.05"
                                                                    value={backgroundPatternOpacity}
                                                                    onChange={(e) => setBackgroundPatternOpacity(parseFloat(e.target.value))}
                                                                    className="w-full h-1 bg-white/10 rounded-full appearance-none accent-blue-500"
                                                                />
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-blue-600/5 p-8 rounded-lg border border-blue-500/10 space-y-4">
                                        <h4 className="text-[10px] font-black text-blue-400 uppercase tracking-[0.2em] flex items-center gap-2">
                                            <Globe className="w-4 h-4" /> Centro de Operaciones
                                        </h4>
                                        <p className="text-[11px] text-neutral-400 font-medium leading-relaxed">
                                            Desde aquí controlas la estética global. Todo cambio se sincroniza en tiempo real con las pantallas activas del hotel.
                                        </p>
                                    </div>
                                </div>
                            )
                        }

                        {activeTab === 'settings' && (
                            <motion.div
                                key="settings"
                                initial={{ opacity: 0, scale: 0.95, filter: 'blur(10px)' }}
                                animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
                                exit={{ opacity: 0, scale: 1.05, filter: 'blur(10px)' }}
                                transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                                className="space-y-6"
                            >
                                <div className="sticky top-0 z-20 bg-[#080808] pb-6">
                                    <h2 className="text-[10px] font-black text-blue-500 uppercase tracking-[0.5em] flex items-center gap-2">
                                        <Settings2 className="w-3 h-3" /> Configuración
                                    </h2>
                                </div>

                                <div className="bg-[#111] p-6 rounded-xl border border-white/5 space-y-6">
                                    <div className="flex items-center gap-4 mb-6">
                                        <div className="p-3 bg-blue-500/10 rounded-lg">
                                            <Lock className="w-6 h-6 text-blue-500" />
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-black text-white italic tracking-tighter uppercase">Seguridad</h3>
                                            <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest">Gestionar acceso y credenciales</p>
                                        </div>
                                    </div>

                                    <form onSubmit={async (e) => {
                                        e.preventDefault();
                                        const form = e.target as HTMLFormElement;
                                        const currentPassword = (form.elements.namedItem('currentPassword') as HTMLInputElement).value;
                                        const newPassword = (form.elements.namedItem('newPassword') as HTMLInputElement).value;

                                        try {
                                            const res = await fetch('/api/auth/change-password', {
                                                method: 'POST',
                                                headers: { 'Content-Type': 'application/json' },
                                                body: JSON.stringify({ currentPassword, newPassword })
                                            });

                                            if (res.ok) {
                                                alert('Contraseña actualizada correctamente');
                                                form.reset();
                                            } else {
                                                const data = await res.json();
                                                alert(data.error || 'Error al actualizar la contraseña');
                                            }
                                        } catch (err) {
                                            alert('Error de conexión');
                                        }
                                    }} className="max-w-md">
                                        <div className="space-y-5">
                                            <div className="space-y-2">
                                                <label className="text-[9px] text-neutral-400 font-black uppercase tracking-widest ml-1">Contraseña Actual</label>
                                                <div className="relative group">
                                                    <input
                                                        name="currentPassword"
                                                        type="password"
                                                        className="w-full bg-black/40 border border-white/10 rounded-lg pl-4 pr-4 py-3 text-xs font-bold text-white focus:border-blue-500/50 outline-none transition-all focus:bg-blue-900/10"
                                                        placeholder="••••••••"
                                                        required
                                                    />
                                                </div>
                                            </div>

                                            <div className="space-y-2">
                                                <label className="text-[9px] text-neutral-400 font-black uppercase tracking-widest ml-1">Nueva Contraseña</label>
                                                <div className="relative group">
                                                    <input
                                                        name="newPassword"
                                                        type="password"
                                                        className="w-full bg-black/40 border border-white/10 rounded-lg pl-4 pr-4 py-3 text-xs font-bold text-white focus:border-blue-500/50 outline-none transition-all focus:bg-blue-900/10"
                                                        placeholder="Nueva contraseña segura"
                                                        required
                                                    />
                                                </div>
                                            </div>

                                            <button
                                                type="submit"
                                                className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-lg text-[10px] font-black uppercase tracking-[0.2em] transition-all shadow-lg shadow-blue-900/20 active:scale-95 flex items-center justify-center gap-2 mt-2"
                                            >
                                                <Save className="w-4 h-4" /> Actualizar Credenciales
                                            </button>
                                        </div>
                                    </form>
                                </div>

                                <div className="bg-[#111] p-6 rounded-xl border border-white/5 flex items-center justify-between group hover:border-white/10 transition-all">
                                    <div className="flex items-center gap-4">
                                        <div className="p-3 bg-neutral-800 rounded-lg">
                                            <Monitor className="w-6 h-6 text-neutral-400" />
                                        </div>
                                        <div>
                                            <h3 className="text-sm font-black text-white italic tracking-wider uppercase mb-1">PixelFlow Core</h3>
                                            <div className="flex gap-3 text-[9px] text-neutral-500 font-mono font-bold uppercase tracking-widest">
                                                <span>v2.0.0 PRO</span>
                                                <span className="text-neutral-700">|</span>
                                                <span>Build 2024.10</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="px-3 py-1 bg-green-500/10 border border-green-500/20 rounded-full">
                                        <span className="text-[9px] font-black text-green-500 uppercase tracking-wider flex items-center gap-1.5">
                                            <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                                            Sistema Activo
                                        </span>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </div>
                </motion.aside >
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
                                className="bg-[#111] border border-white/10 p-8 rounded-xl max-w-md w-full shadow-2xl relative overflow-hidden"
                            >
                                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-indigo-600" />
                                <div className="flex flex-col items-center text-center gap-4 relative z-10">
                                    <div className="w-16 h-16 bg-blue-500/10 rounded-lg flex items-center justify-center mb-2">
                                        <LayoutIcon className="w-8 h-8 text-blue-500" />
                                    </div>
                                    <h3 className="text-2xl font-black text-white uppercase italic tracking-tighter">¿Crear Nuevo Lienzo?</h3>
                                    <p className="text-sm text-neutral-400 leading-relaxed font-medium">
                                        Estás a punto de iniciar un diseño limpio. Cualquier cambio no guardado en el layout actual se perderá irreversiblemente.
                                    </p>

                                    <div className="grid grid-cols-2 gap-4 w-full mt-6">
                                        <button
                                            onClick={() => setShowResetConfirm(false)}
                                            className="py-4 rounded-md bg-white/5 hover:bg-white/10 text-neutral-400 hover:text-white font-black uppercase tracking-widest text-[10px] transition-all"
                                        >
                                            Cancelar
                                        </button>
                                        <button
                                            onClick={handleConfirmReset}
                                            className="py-4 rounded-md bg-blue-600 hover:bg-blue-500 text-white font-black uppercase tracking-widest text-[10px] shadow-lg shadow-blue-600/20 transition-all active:scale-95"
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
                                className="bg-[#111] border border-white/10 p-8 rounded-xl max-w-md w-full shadow-2xl relative overflow-hidden"
                            >
                                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-500 to-orange-600" />
                                <div className="flex flex-col items-center text-center gap-4 relative z-10">
                                    <div className="w-16 h-16 bg-red-500/10 rounded-lg flex items-center justify-center mb-2">
                                        <Trash2 className="w-8 h-8 text-red-500" />
                                    </div>
                                    <h3 className="text-2xl font-black text-white uppercase italic tracking-tighter">¿Eliminar Diseño?</h3>
                                    <p className="text-sm text-neutral-400 leading-relaxed font-medium">
                                        <span className="text-white font-bold">{layoutToDelete.name}</span> será eliminado permanentemente de la base de datos. Esta acción no se puede deshacer.
                                    </p>

                                    <div className="grid grid-cols-2 gap-4 w-full mt-6">
                                        <button
                                            onClick={() => setLayoutToDelete(null)}
                                            className="py-4 rounded-md bg-white/5 hover:bg-white/10 text-neutral-400 hover:text-white font-black uppercase tracking-widest text-[10px] transition-all"
                                        >
                                            Cancelar
                                        </button>
                                        <button
                                            onClick={() => {
                                                socket.emit('delete_layout', layoutToDelete._id);
                                                setLayoutToDelete(null);
                                                setTimeout(fetchLayouts, 500);
                                            }}
                                            className="py-4 rounded-md bg-red-600 hover:bg-red-500 text-white font-black uppercase tracking-widest text-[10px] shadow-lg shadow-red-600/20 transition-all active:scale-95"
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
        </div >
    );
}
