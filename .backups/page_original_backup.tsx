'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { LayoutJSON, WidgetType, WidgetConfig } from '@/store/usePlayerStore';
import {
    Plus, Trash2, Smartphone, Monitor, ShoppingBag, Utensils,
    Layout as LayoutIcon, Settings2, Maximize, Save, Layers,
    Database, RefreshCw, Eye, MousePointer2, Box, Palette,
    ChevronRight, Zap, Globe, Image as ImageIcon, Sparkles, ArrowLeft
} from 'lucide-react';
import { Canvas } from '@/components/builder/Canvas';
import { RichTextEditor } from '@/components/builder/RichTextEditor';
import { ImageUpload } from '@/components/builder/ImageUpload';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';

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
    const [editingLayoutId, setEditingLayoutId] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'screens' | 'layouts' | 'components' | 'products' | 'activities'>('components');

    // DB States
    const [savedLayouts, setSavedLayouts] = useState<any[]>([]);
    const [screens, setScreens] = useState<any[]>([]);
    const [allProducts, setAllProducts] = useState<any[]>([]);
    const [allActivities, setAllActivities] = useState<any[]>([]);

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
            // Load "Mi Primer Layout" if it exists and we don't have widgets yet
            if (widgets.length === 0) {
                const initial = layouts.find((l: any) => l.name === 'Mi Primer Layout');
                if (initial) loadLayout(initial);
            }
        });
        socket.on('screens_list', (screenList) => setScreens(screenList));

        // Initialize with default data
        const defaultProducts = getDefaultData('PRODUCT_LIST').items;
        const defaultActivities = getDefaultData('ACTIVITIES').items;
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
            if (w.type === 'PRODUCT_LIST') return { ...w, data: { ...w.data, items: allProducts } };
            if (w.type === 'ACTIVITIES') return { ...w, data: { ...w.data, items: allActivities } };
            return w;
        }));
    }, [allProducts, allActivities]);

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
        };
        socket.emit('save_layout', { screenId, layout });
        setEditingLayoutId(id);
        setTimeout(fetchLayouts, 500);
    };

    const saveAndPush = () => {
        saveLayout();
        pushOnly();
    };

    const createNewLayout = () => {
        if (confirm('¿Deseas crear un nuevo layout? Se perderán los cambios no guardados.')) {
            setEditingLayoutId(null);
            setLayoutName('Nuevo Layout ' + (savedLayouts.length + 1));
            setWidgets([]);
            setBackgroundImage('');
            setBackgroundVideo('');
            setBackgroundColor('#000000');
            setBackgroundBlur(0);
            setSelectedWidgetId(null);
            setActiveTab('components');
        }
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
        setSelectedWidgetId(null);
    };

    return (
        <div className="min-h-screen bg-[#050505] text-neutral-100 flex flex-col font-sans selection:bg-blue-500/30">
            {/* Professional Glass Header */}
            <header className="h-20 border-b border-white/5 px-10 flex items-center justify-between bg-black/40 backdrop-blur-2xl sticky top-0 z-[100]">
                <div className="flex items-center gap-6">
                    <Link href="/">
                        <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-neutral-400 hover:text-white transition-all text-xs font-bold uppercase border border-white/5">
                            <ArrowLeft className="w-4 h-4" /> Volver
                        </button>
                    </Link>
                    <div className="h-8 w-[1px] bg-white/10" />
                    <motion.div
                        initial={{ rotate: -10 }}
                        animate={{ rotate: 0 }}
                        className="w-12 h-12 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl flex items-center justify-center shadow-2xl shadow-blue-600/40 relative group"
                    >
                        <Zap className="w-7 h-7 text-white group-hover:scale-110 transition-transform" />
                        <div className="absolute inset-0 bg-white/20 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity" />
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
                                <label className="text-[8px] font-black text-neutral-600 uppercase tracking-widest mb-1">Editando Layout</label>
                                <select
                                    className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-[11px] font-black italic text-blue-400 outline-none focus:border-blue-500/50 min-w-[180px]"
                                    value={savedLayouts.find(l => l.name === layoutName)?._id || ''}
                                    onChange={(e) => {
                                        const layout = savedLayouts.find(l => l._id === e.target.value);
                                        if (layout) loadLayout(layout);
                                    }}
                                >
                                    <option value="">Seleccionar Layout...</option>
                                    {savedLayouts.map(l => (
                                        <option key={l._id} value={l._id}>{l.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-6">
                    {/* Status Pill */}
                    <div className={`flex items-center gap-3 px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all border
                        ${isConnected ? 'bg-emerald-500/5 text-emerald-400 border-emerald-500/20' : 'bg-red-500/5 text-red-400 border-red-500/20'}
                    `}>
                        <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)] animate-pulse' : 'bg-red-500'}`} />
                        {isConnected ? 'Sistema en Línea' : 'Servidor Desconectado'}
                    </div>

                    <div className="h-8 w-[1px] bg-white/10" />

                    <div className="flex items-center gap-3">
                        <button
                            onClick={pushOnly}
                            className="bg-white/5 hover:bg-white/10 text-neutral-400 hover:text-white text-[11px] font-black uppercase px-5 py-3 rounded-xl transition-all flex items-center gap-2 border border-white/5"
                        >
                            <Eye className="w-4 h-4" /> Preview
                        </button>

                        <button
                            onClick={saveAndPush}
                            className="bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-black uppercase px-8 py-3 rounded-xl flex items-center gap-2 transition-all active:scale-95 shadow-xl shadow-blue-600/30 hover:shadow-blue-600/40"
                        >
                            <Zap className="w-4 h-4" /> {editingLayoutId ? 'Actualizar' : 'Publicar'}
                        </button>

                        {editingLayoutId && (
                            <button
                                onClick={() => saveLayout(true)}
                                className="bg-white/5 hover:bg-white/10 text-neutral-400 hover:text-white text-[11px] font-black uppercase px-5 py-3 rounded-xl transition-all flex items-center gap-2 border border-white/5"
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
                        className={`p-3 rounded-xl transition-all ${activeTab === 'components' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-neutral-500 hover:text-white hover:bg-white/5'}`}
                    >
                        <Box className="w-6 h-6" />
                    </button>
                    <button
                        onClick={() => setActiveTab('products')}
                        className={`p-3 rounded-xl transition-all ${activeTab === 'products' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-neutral-500 hover:text-white hover:bg-white/5'}`}
                    >
                        <ShoppingBag className="w-6 h-6" />
                    </button>
                    <button
                        onClick={() => setActiveTab('activities')}
                        className={`p-3 rounded-xl transition-all ${activeTab === 'activities' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-neutral-500 hover:text-white hover:bg-white/5'}`}
                    >
                        <RefreshCw className="w-6 h-6" />
                    </button>
                    <button
                        onClick={() => setActiveTab('layouts')}
                        className={`p-3 rounded-xl transition-all ${activeTab === 'layouts' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-neutral-500 hover:text-white hover:bg-white/5'}`}
                    >
                        <Database className="w-6 h-6" />
                    </button>
                    <button
                        onClick={() => setActiveTab('screens')}
                        className={`p-3 rounded-xl transition-all ${activeTab === 'screens' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-neutral-500 hover:text-white hover:bg-white/5'}`}
                    >
                        <Smartphone className="w-6 h-6" />
                    </button>
                    <div className="mt-auto">
                        <button className="p-3 text-neutral-600 hover:text-white transition-colors">
                            <Settings2 className="w-6 h-6" />
                        </button>
                    </div>
                </aside>

                {/* Content Panel for Sidebar Tabs (Wider) */}
                <aside className="w-[450px] bg-[#080808] border-r border-white/5 flex flex-col overflow-hidden relative">
                    <div className="flex-1 overflow-y-auto pl-8 pr-12 py-10 space-y-10 custom-scrollbar">
                        <AnimatePresence mode="wait">
                            {activeTab === 'components' && (
                                <motion.div
                                    key="components"
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    className="space-y-6"
                                >
                                    <div className="sticky top-0 z-20 bg-[#080808] pb-6">
                                        <h2 className="text-[10px] font-black text-blue-500 uppercase tracking-[0.5em] flex items-center gap-2">
                                            <Sparkles className="w-3 h-3" /> Biblioteca de Componentes
                                        </h2>
                                    </div>
                                    <div className="grid grid-cols-1 gap-4 pb-20">
                                        {([
                                            { type: 'TEXT', label: 'Texto Dinámico', desc: 'Títulos, descripciones y noticias.', color: 'from-blue-500 to-indigo-600', icon: 'T' },
                                            { type: 'VIDEO', label: 'Reproductor Video', desc: 'Fondos animados o anuncios 4K.', color: 'from-red-500 to-orange-600', icon: 'V' },
                                            { type: 'SLIDER', label: 'Galería Pro', desc: 'Carrusel de fotos y videos.', color: 'from-emerald-500 to-teal-600', icon: 'S' },
                                            { type: 'PRODUCT_LIST', label: 'Carta Digital', desc: 'Menú de productos con precios.', color: 'from-amber-500 to-yellow-600', icon: 'P' },
                                            { type: 'ACTIVITIES', label: 'Agenda Hotel', desc: 'Eventos del día con fotos.', color: 'from-purple-500 to-pink-600', icon: 'A' },
                                            { type: 'QR_CODE', label: 'Conexión Móvil', desc: 'QR táctico para el restaurante.', color: 'from-neutral-500 to-neutral-700', icon: 'Q' },
                                            { type: 'CATEGORY_NAV', label: 'Menú Táctil', desc: 'Botones grandes para TV/Tablet.', color: 'from-blue-400 to-cyan-500', icon: 'M' },
                                            { type: 'NAV_BUTTON', label: 'Botón Navegación', desc: 'Botón Volver / Inicio / Link.', color: 'from-pink-500 to-rose-600', icon: 'N' },
                                        ] as { type: WidgetType, label: string, desc: string, color: string, icon: string }[]).map((item) => (
                                            <button
                                                key={item.type}
                                                onClick={() => addWidget(item.type)}
                                                className="group relative flex flex-col bg-[#111] hover:bg-white/[0.03] border border-white/5 hover:border-blue-500/30 p-5 rounded-xl transition-all overflow-hidden"
                                            >
                                                <div className="flex items-center gap-4 relative z-10">
                                                    <div className={`w-14 h-14 rounded-lg bg-gradient-to-br ${item.color} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-500`}>
                                                        <span className="text-2xl font-black text-white">{item.icon}</span>
                                                    </div>
                                                    <div className="flex flex-col items-start">
                                                        <span className="text-[12px] font-black uppercase tracking-tight text-white italic">
                                                            {item.label}
                                                        </span>
                                                        <span className="text-[9px] text-neutral-600 font-bold uppercase tracking-widest mt-0.5 leading-none">
                                                            {item.desc}
                                                        </span>
                                                    </div>
                                                </div>
                                                {/* Preview Placeholder Decoration */}
                                                <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-100 transition-opacity">
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
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    className="space-y-6"
                                >
                                    <div className="sticky top-0 z-20 bg-[#080808] pb-6 flex flex-col gap-4">
                                        <div className="flex justify-between items-center">
                                            <h2 className="text-[10px] font-black text-blue-500 uppercase tracking-[0.3em] flex items-center gap-2">
                                                <Database className="w-3 h-3" /> Diseños Guardados
                                            </h2>
                                            <button onClick={fetchLayouts} className="p-2 hover:bg-white/5 rounded-xl transition-colors">
                                                <RefreshCw className="w-3 h-3 text-neutral-500" />
                                            </button>
                                        </div>
                                        <button
                                            onClick={createNewLayout}
                                            className="w-full flex items-center justify-center gap-2 py-3 bg-white/5 hover:bg-white/10 text-white text-[11px] font-black uppercase rounded-xl border border-white/10 transition-all shadow-lg"
                                        >
                                            <Plus className="w-4 h-4" /> Nuevo Lienzo en Blanco
                                        </button>
                                    </div>
                                    <div className="space-y-3 pb-20">
                                        {savedLayouts.length === 0 ? (
                                            <div className="bg-[#111] p-6 rounded-xl border border-white/5 text-center">
                                                <p className="text-[10px] text-neutral-600 italic">No hay diseños guardados.</p>
                                            </div>
                                        ) : (
                                            savedLayouts.map((l) => (
                                                <div key={l._id} className="group relative">
                                                    <button
                                                        onClick={() => loadLayout(l)}
                                                        className="w-full text-left p-4 rounded-xl bg-[#111] hover:bg-blue-600/10 border border-white/5 hover:border-blue-500/30 transition-all group-hover:pr-12"
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
                                                            if (confirm('¿Eliminar este diseño?')) {
                                                                socket.emit('delete_layout', l._id);
                                                            }
                                                        }}
                                                        className="absolute right-3 top-1/2 -translate-y-1/2 p-2.5 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white rounded-xl opacity-0 group-hover:opacity-100 transition-all"
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
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    className="space-y-6"
                                >
                                    <div className="sticky top-0 z-20 bg-[#080808] pb-6 flex justify-between items-center">
                                        <h2 className="text-[10px] font-black text-emerald-500 uppercase tracking-widest flex items-center gap-2 italic">
                                            <ShoppingBag className="w-4 h-4" /> Catálogo
                                        </h2>
                                        <button
                                            onClick={() => setAllProducts([...allProducts, { id: 'new-' + Date.now(), name: 'PRODUCTO PREMIUM', price: 0, currency: '$', description: '', photo: '', category: 'General' }])}
                                            className="px-4 py-2 bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500 hover:text-white rounded-lg text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 border border-emerald-500/20"
                                        >
                                            <Plus className="w-3 h-3" /> NUEVO ITEM
                                        </button>
                                    </div>
                                    <div className="space-y-4 pb-20 overflow-x-hidden">
                                        {allProducts.map((p, idx) => (
                                            <div key={p.id} className="bg-[#111] p-5 rounded-xl border border-white/5 space-y-4 group relative hover:border-emerald-500/20 transition-all">
                                                <div className="flex gap-5">
                                                    <div className="w-24 h-24 rounded-lg overflow-hidden bg-black flex-shrink-0 border border-white/10 shadow-lg relative group/thumb">
                                                        <img src={p.photo || 'https://via.placeholder.com/150'} className="w-full h-full object-cover" />
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
                                                    <div className="flex-1 space-y-3">
                                                        <input
                                                            className="w-full bg-transparent border-none text-[15px] font-black text-white p-0 focus:ring-0 placeholder:text-neutral-800 italic"
                                                            value={p.name}
                                                            placeholder="Nombre del Producto"
                                                            onChange={(e) => {
                                                                const newP = [...allProducts];
                                                                newP[idx].name = e.target.value;
                                                                setAllProducts(newP);
                                                            }}
                                                        />
                                                        <div className="grid grid-cols-2 gap-3">
                                                            <div className="flex items-center gap-2 bg-black/40 px-3 py-1.5 rounded-lg border border-white/5">
                                                                <span className="text-[10px] text-neutral-600 font-bold uppercase">$</span>
                                                                <input
                                                                    className="w-full bg-transparent border-none text-sm font-bold text-emerald-500 p-0 focus:ring-0"
                                                                    value={p.price}
                                                                    type="number"
                                                                    onChange={(e) => {
                                                                        const newP = [...allProducts];
                                                                        newP[idx].price = parseFloat(e.target.value);
                                                                        setAllProducts(newP);
                                                                    }}
                                                                />
                                                            </div>
                                                            <input
                                                                className="w-full bg-blue-500/5 border border-blue-500/20 rounded-lg px-3 py-1.5 text-[10px] font-black text-blue-400 uppercase tracking-widest focus:border-blue-500/50 outline-none"
                                                                value={p.category || ''}
                                                                placeholder="CATEGORÍA"
                                                                onChange={(e) => {
                                                                    const newP = [...allProducts];
                                                                    newP[idx].category = e.target.value;
                                                                    setAllProducts(newP);
                                                                }}
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                                <textarea
                                                    className="w-full bg-black/40 border border-white/5 rounded-lg p-3 text-[11px] text-neutral-500 h-20 resize-none outline-none focus:border-emerald-500/50 transition-colors placeholder:text-neutral-800"
                                                    value={p.description}
                                                    placeholder="Escribe una descripción premium del producto..."
                                                    onChange={(e) => {
                                                        const newP = [...allProducts];
                                                        newP[idx].description = e.target.value;
                                                        setAllProducts(newP);
                                                    }}
                                                />
                                                <div className="flex justify-between items-center pt-2 border-t border-white/5">
                                                    <div className="text-[9px] font-bold text-neutral-700 uppercase tracking-widest">ID: {p.id.substring(0, 6)}</div>
                                                    <button
                                                        onClick={() => setAllProducts(allProducts.filter((_, i) => i !== idx))}
                                                        className="flex items-center gap-2 px-4 py-2 bg-red-500/5 text-red-500/40 hover:bg-red-500 hover:text-white rounded-lg text-[10px] font-black uppercase transition-all"
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5" /> Eliminar
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </motion.div>
                            )}

                            {activeTab === 'activities' && (
                                <motion.div
                                    key="activities"
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    className="space-y-6"
                                >
                                    <div className="flex justify-between items-center mb-4">
                                        <h2 className="text-[10px] font-black text-amber-500 uppercase tracking-[0.3em] flex items-center gap-2">
                                            <RefreshCw className="w-3 h-3" /> Cronograma de Actividades
                                        </h2>
                                        <button
                                            onClick={() => setAllActivities([...allActivities, { category: 'CINE', time: '20:00', title: 'Nueva Actividad', desc: '', photo: '' }])}
                                            className="p-2 bg-amber-500/10 text-amber-500 hover:bg-amber-500 hover:text-white rounded-xl transition-all"
                                        >
                                            <Plus className="w-4 h-4" />
                                        </button>
                                    </div>
                                    <div className="space-y-4 max-h-[calc(100vh-250px)] overflow-y-auto pr-2 custom-scrollbar">
                                        {allActivities.map((a, idx) => (
                                            <div key={idx} className="bg-[#111] p-4 rounded-xl border border-white/5 space-y-4">
                                                <div className="flex gap-3">
                                                    <input
                                                        className="flex-1 bg-black/40 border border-white/10 rounded-lg px-3 py-1.5 text-[10px] font-black text-amber-500 uppercase focus:border-amber-500/50 outline-none"
                                                        value={a.category}
                                                        onChange={(e) => {
                                                            const newA = [...allActivities];
                                                            newA[idx].category = e.target.value;
                                                            setAllActivities(newA);
                                                        }}
                                                    />
                                                    <input
                                                        className="w-24 bg-black/40 border border-white/10 rounded-lg px-3 py-1.5 text-[10px] font-black text-white text-center focus:border-amber-500/50 outline-none"
                                                        value={a.time}
                                                        onChange={(e) => {
                                                            const newA = [...allActivities];
                                                            newA[idx].time = e.target.value;
                                                            setAllActivities(newA);
                                                        }}
                                                    />
                                                </div>
                                                <input
                                                    className="w-full bg-transparent border-none text-[13px] font-black text-white p-0 focus:ring-0 italic"
                                                    value={a.title}
                                                    onChange={(e) => {
                                                        const newA = [...allActivities];
                                                        newA[idx].title = e.target.value;
                                                        setAllActivities(newA);
                                                    }}
                                                />
                                                <div className="w-full aspect-video rounded-lg overflow-hidden border border-white/10 bg-black">
                                                    <img src={a.photo || 'https://via.placeholder.com/300x150'} className="w-full h-full object-cover" />
                                                </div>
                                                <textarea
                                                    className="w-full bg-black/40 border border-white/5 rounded-lg p-3 text-[10px] text-neutral-400 h-16 resize-none outline-none focus:border-amber-500/50 transition-colors"
                                                    value={a.desc}
                                                    placeholder="Detalles de la actividad..."
                                                    onChange={(e) => {
                                                        const newA = [...allActivities];
                                                        newA[idx].desc = e.target.value;
                                                        setAllActivities(newA);
                                                    }}
                                                />
                                                <div className="space-y-2">
                                                    <ImageUpload
                                                        label="Cargar Imagen de Actividad"
                                                        onUploadSuccess={(url) => {
                                                            const newA = [...allActivities];
                                                            newA[idx].photo = url;
                                                            setAllActivities(newA);
                                                        }}
                                                    />
                                                    <div className="flex justify-end">
                                                        <button
                                                            onClick={() => setAllActivities(allActivities.filter((_, i) => i !== idx))}
                                                            className="flex items-center gap-2 px-3 py-1.5 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white rounded-lg text-[10px] font-black uppercase transition-all"
                                                        >
                                                            <Trash2 className="w-3 h-3" /> Eliminar
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </motion.div>
                            )}



                            {activeTab === 'screens' && (
                                <motion.div
                                    key="screens"
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    className="space-y-6"
                                >
                                    <h2 className="text-[10px] font-black text-white uppercase tracking-[0.3em] mb-4 flex items-center gap-2">
                                        <Smartphone className="w-3 h-3" /> Gestión de Pantallas
                                    </h2>
                                    <div className="space-y-4">
                                        {screens.length === 0 ? (
                                            <div className="bg-[#111] p-6 rounded-xl border border-white/5 text-center">
                                                <p className="text-[10px] text-neutral-600 italic">Esperando conexiones...</p>
                                            </div>
                                        ) : (
                                            screens.map((s) => (
                                                <div key={s.screenId} className={`p-4 rounded-xl border transition-all ${screenId === s.screenId ? 'bg-blue-600/10 border-blue-500/30 shadow-xl' : 'bg-[#111] border-white/5 hover:border-white/10'}`}>
                                                    <div className="flex items-center justify-between mb-4">
                                                        <input
                                                            className="bg-transparent border-none text-sm font-black text-white focus:ring-0 p-0 w-32 placeholder:text-neutral-700 italic"
                                                            value={s.name || s.screenId}
                                                            onChange={(e) => socket.emit('rename_screen', { screenId: s.screenId, name: e.target.value })}
                                                        />
                                                        <div className={`w-2 h-2 rounded-full ${Date.now() - new Date(s.lastSeen).getTime() < 10000 ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-neutral-800'}`} />
                                                    </div>
                                                    <div className="flex items-center justify-between">
                                                        <button
                                                            onClick={() => socket.emit('authorize_screen', { screenId: s.screenId, isAuthorized: !s.isAuthorized })}
                                                            className={`text-[8px] font-black uppercase px-3 py-1.5 rounded-full transition-colors ${s.isAuthorized ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-500 border border-red-500/20'}`}
                                                        >
                                                            {s.isAuthorized ? 'Acceso Autorizado' : 'Acceso Restringido'}
                                                        </button>
                                                        <button
                                                            onClick={() => setScreenId(s.screenId)}
                                                            className={`text-[10px] font-black px-4 py-1.5 rounded-xl transition-all ${screenId === s.screenId ? 'bg-blue-600 text-white' : 'bg-white/5 text-neutral-500 hover:text-white'}`}
                                                        >
                                                            {screenId === s.screenId ? 'ELEGIDA' : 'ELEGIR'}
                                                        </button>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </aside>

                {/* Main Workspace (Canvas Area) */}
                <main className="flex-1 bg-[#0a0a0a] p-12 overflow-hidden relative">
                    {/* Background Texture */}
                    <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '40px 40px' }} />

                    <div className="h-full flex flex-col gap-8 max-w-[1400px] mx-auto relative z-10">
                        {/* Status/Control Bar */}
                        <div className="flex items-center justify-between">
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

                            <div className="flex bg-[#111] p-1.5 rounded-2xl border border-white/5">
                                <button
                                    onClick={() => setOrientation('landscape')}
                                    className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase transition-all flex items-center gap-2 ${orientation === 'landscape' ? 'bg-blue-600 text-white shadow-xl shadow-blue-600/20' : 'text-neutral-500 hover:text-neutral-300'}`}
                                >
                                    <Monitor className="w-4 h-4" /> Landscape
                                </button>
                                <button
                                    onClick={() => setOrientation('portrait')}
                                    className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase transition-all flex items-center gap-2 ${orientation === 'portrait' ? 'bg-blue-600 text-white shadow-xl shadow-blue-600/20' : 'text-neutral-500 hover:text-neutral-300'}`}
                                >
                                    <Smartphone className="w-4 h-4" /> Portrait
                                </button>
                            </div>
                        </div>

                        {/* Interactive Canvas */}
                        <div className="flex-1 min-h-0 bg-[#050505] rounded-3xl border border-white/5 shadow-[0_0_100px_rgba(0,0,0,0.5)] overflow-hidden p-6 relative group">
                            <Canvas
                                orientation={orientation}
                                widgets={widgets}
                                onWidgetsChange={setWidgets}
                                selectedId={selectedWidgetId}
                                onSelect={setSelectedWidgetId}
                                backgroundImage={backgroundImage}
                                backgroundBlur={backgroundBlur}
                            />

                            {/* Visual Hint */}
                            {!selectedWidgetId && widgets.length > 0 && (
                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center gap-3">
                                    <MousePointer2 className="w-10 h-10 text-blue-500 animate-bounce" />
                                    <span className="text-[10px] font-black text-blue-500/50 uppercase tracking-[0.4em]">Haz click en un elemento para editarlo</span>
                                </div>
                            )}
                        </div>
                    </div>
                </main>

                {/* Properties Inspector Panel */}
                <aside className="w-[400px] bg-[#080808] border-l border-white/5 flex flex-col overflow-hidden">
                    {selectedWidget ? (
                        <div className="flex-1 flex flex-col h-full overflow-hidden">
                            <div className="flex-1 overflow-y-auto custom-scrollbar">
                                <div className="p-8 border-b border-white/5 bg-gradient-to-br from-blue-600/5 to-transparent">
                                    <div className="flex items-center justify-between mb-4">
                                        <span className="bg-blue-500 text-white text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-widest">{selectedWidget.type}</span>
                                        <button onClick={() => setSelectedWidgetId(null)} className="text-neutral-600 hover:text-white transition-colors">
                                            <RefreshCw className="w-4 h-4" />
                                        </button>
                                    </div>
                                    <h3 className="text-xl font-black uppercase tracking-tighter text-white">Editor Premium</h3>
                                    <p className="text-[10px] text-neutral-500 uppercase font-bold tracking-widest mt-1">Sincronización Pro</p>
                                </div>

                                <section className="p-8 space-y-8">
                                    <div className="space-y-4">
                                        <h4 className="text-[10px] font-black text-neutral-500 uppercase tracking-widest flex items-center gap-2">
                                            <Maximize className="w-3 h-3 text-blue-500" /> Geometría
                                        </h4>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="text-[9px] text-neutral-600 uppercase block font-black mb-2">Ancho (%)</label>
                                                <input type="number" value={selectedWidget.w} onChange={(e) => updateSelectedWidgetSize('w', parseInt(e.target.value))} className="w-full bg-[#111] border border-white/5 rounded-xl p-3 text-xs font-black text-white outline-none focus:border-blue-500/50" />
                                            </div>
                                            <div>
                                                <label className="text-[9px] text-neutral-600 uppercase block font-black mb-2">Alto (%)</label>
                                                <input type="number" value={selectedWidget.h} onChange={(e) => updateSelectedWidgetSize('h', parseInt(e.target.value))} className="w-full bg-[#111] border border-white/5 rounded-xl p-3 text-xs font-black text-white outline-none focus:border-blue-500/50" />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-6 pt-6 border-t border-white/5">
                                        {selectedWidget.type === 'TEXT' && (
                                            <RichTextEditor content={selectedWidget.data.content} onChange={(content) => updateSelectedWidgetData({ content })} />
                                        )}

                                        {selectedWidget.type === 'VIDEO' && (
                                            <div className="space-y-4">
                                                <label className="text-[9px] text-neutral-600 uppercase block font-black">URL Video</label>
                                                <input value={selectedWidget.data.url} onChange={(e) => updateSelectedWidgetData({ url: e.target.value })} className="w-full bg-[#111] border border-white/5 rounded-xl p-4 text-xs font-bold text-blue-400 outline-none" placeholder="https://..." />
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
                                                            <img src={url} className="w-full h-full object-cover rounded-xl border border-white/10" />
                                                            <button onClick={() => { const n = selectedWidget.data.images.filter((_: any, i: number) => i !== idx); updateSelectedWidgetData({ images: n }); }} className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover/img:opacity-100 shadow-lg"><Trash2 className="w-2 h-2" /></button>
                                                        </div>
                                                    ))}
                                                    <button onClick={() => { const u = prompt('URL:'); if (u) updateSelectedWidgetData({ images: [...(selectedWidget.data.images || []), u] }); }} className="aspect-square bg-[#111] border border-dashed border-white/10 rounded-xl flex items-center justify-center hover:bg-white/5"><Plus className="w-4 h-4 text-neutral-600" /></button>
                                                </div>
                                                <ImageUpload label="Subir Imagen/Video" onUploadSuccess={(url) => updateSelectedWidgetData({ images: [...(selectedWidget.data.images || []), url] })} />
                                            </div>
                                        )}

                                        {selectedWidget.type === 'QR_CODE' && (
                                            <div className="space-y-6">
                                                <input className="w-full bg-[#111] border border-white/5 rounded-xl p-4 text-xs font-black text-white" value={selectedWidget.data.title} onChange={(e) => updateSelectedWidgetData({ title: e.target.value })} placeholder="TÍTULO QR" />
                                                <input className="w-full bg-[#111] border border-white/5 rounded-xl p-4 text-xs font-black text-blue-400" value={selectedWidget.data.url} onChange={(e) => updateSelectedWidgetData({ url: e.target.value })} placeholder="URL DESTINO" />
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div><label className="text-[8px] font-black text-neutral-600 uppercase block mb-2">QR</label><input type="color" value={selectedWidget.data.qrColor} onChange={(e) => updateSelectedWidgetData({ qrColor: e.target.value })} className="w-full h-10 bg-transparent cursor-pointer" /></div>
                                                    <div><label className="text-[8px] font-black text-neutral-600 uppercase block mb-2">FONDO</label><input type="color" value={selectedWidget.data.bgColor} onChange={(e) => updateSelectedWidgetData({ bgColor: e.target.value })} className="w-full h-10 bg-transparent cursor-pointer" /></div>
                                                </div>
                                            </div>
                                        )}



                                        <div className="space-y-6">
                                            <div>
                                                <label className="text-[9px] text-neutral-600 uppercase block font-black mb-2 italic">Título de la Sección</label>
                                                <input
                                                    className="w-full bg-[#111] border border-white/5 rounded-xl p-4 text-xs font-black italic outline-none focus:border-blue-500"
                                                    value={selectedWidget.data.title || ''}
                                                    onChange={(e) => updateSelectedWidgetData({ title: e.target.value })}
                                                    placeholder="Ej: NUESTRA SELECCIÓN"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-[9px] text-neutral-600 uppercase block font-black mb-3">Estética del Menú</label>
                                                <div className="flex items-center gap-4">
                                                    <div className="flex-1 text-[11px] font-black text-neutral-400 uppercase tracking-widest">Color de Acento</div>
                                                    <input type="color" value={selectedWidget.data.accentColor} onChange={(e) => updateSelectedWidgetData({ accentColor: e.target.value })} className="w-10 h-10 rounded-full border-none p-0 cursor-pointer" />
                                                </div>
                                            </div>
                                            <div className="flex items-center justify-between mb-4 bg-blue-500/5 p-4 rounded-2xl border border-blue-500/10">
                                                <div className="flex flex-col">
                                                    <span className="text-[11px] font-black text-white uppercase italic">Sincronización Inteligente</span>
                                                    <span className="text-[9px] text-neutral-500 font-bold">Genera layouts para cada botón</span>
                                                </div>
                                                <button
                                                    onClick={() => {
                                                        const newCats = [...selectedWidget.data.categories];
                                                        newCats.forEach((cat, idx) => {
                                                            if (!cat.targetLayoutId) {
                                                                const newId = 'layout-' + Math.random().toString(36).substr(2, 9);
                                                                const newLayout = {
                                                                    id: newId,
                                                                    name: `Layout: ${cat.label}`,
                                                                    orientation,
                                                                    widgets: [
                                                                        { id: 'back-btn', type: 'NAV_BUTTON', x: 5, y: 5, w: 15, h: 8, data: { label: 'VOLVER', type: 'BACK', icon: 'ArrowLeft', color: '#3b82f6' } },
                                                                        { id: 'title', type: 'TEXT', x: 25, y: 5, w: 50, h: 10, data: { content: `<h1 style="text-align: center;">${cat.label.toUpperCase()}</h1>` } }
                                                                    ],
                                                                    backgroundColor: '#000000',
                                                                    backgroundImage: cat.photo || '',
                                                                    backgroundBlur: 20
                                                                };
                                                                socket.emit('save_layout', { screenId, layout: newLayout });
                                                                newCats[idx].targetLayoutId = newId;
                                                            }
                                                        });
                                                        updateSelectedWidgetData({ categories: newCats });
                                                        setTimeout(fetchLayouts, 1000);
                                                    }}
                                                    className="bg-blue-600 hover:bg-blue-500 text-white p-2 rounded-xl transition-all shadow-lg shadow-blue-600/20"
                                                >
                                                    <Layers className="w-5 h-5" />
                                                </button>
                                            </div>

                                            <div className="space-y-3 pt-4 border-t border-white/5">
                                                <div className="flex justify-between items-center bg-[#111] px-4 py-2 rounded-xl">
                                                    <span className="text-[9px] font-black text-neutral-500 tracking-[0.2em] uppercase">Tus Categorías</span>
                                                    <button
                                                        onClick={() => updateSelectedWidgetData({ categories: [...selectedWidget.data.categories, { id: Math.random(), label: 'Nueva Sección', icon: 'Utensils', active: false }] })}
                                                        className="text-blue-500 hover:text-white transition-colors"
                                                    >
                                                        <Plus className="w-4 h-4" />
                                                    </button>
                                                </div>
                                                <div className="space-y-3 max-h-[1400px] overflow-y-auto pr-2 custom-scrollbar">
                                                    {selectedWidget.data.categories?.map((cat: any, idx: number) => (
                                                        <div key={cat.id} className="bg-[#111]/50 p-5 rounded-xl border border-white/5 space-y-4 relative group">
                                                            <div className="flex gap-4">
                                                                <div className="w-14 h-14 rounded-lg bg-black border border-white/10 overflow-hidden flex-shrink-0 relative group/photo">
                                                                    <img src={cat.photo || 'https://via.placeholder.com/100'} className="w-full h-full object-cover" />
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
                                                                <div className="flex-1 space-y-3">
                                                                    <div className="flex items-center gap-2">
                                                                        <div className="w-8 h-8 rounded-lg bg-blue-600/10 flex items-center justify-center text-blue-500">
                                                                            <Icon className="w-4 h-4" />
                                                                        </div>
                                                                        <div className="flex-1">
                                                                            <label className="text-[8px] font-black text-neutral-600 uppercase tracking-widest block mb-1">Nombre de Sección</label>
                                                                            <input
                                                                                className="w-full bg-black/40 border border-white/5 rounded-lg px-3 py-2 text-xs font-black italic outline-none text-white focus:border-blue-500/50 transition-colors"
                                                                                value={cat.label}
                                                                                placeholder="Ej: Piscinas..."
                                                                                onChange={(e) => {
                                                                                    const newCats = [...selectedWidget.data.categories];
                                                                                    newCats[idx].label = e.target.value;
                                                                                    updateSelectedWidgetData({ categories: newCats });
                                                                                }}
                                                                            />
                                                                        </div>
                                                                    </div>

                                                                    <div className="grid grid-cols-2 gap-2">
                                                                        <div className="space-y-1">
                                                                            <label className="text-[8px] font-black text-neutral-600 uppercase tracking-widest block">Ícono</label>
                                                                            <select
                                                                                className="w-full bg-black/40 border border-white/10 rounded-lg px-2 py-2 text-[10px] font-black text-white/50 outline-none focus:border-blue-500/50"
                                                                                value={cat.icon || 'Utensils'}
                                                                                onChange={(e) => {
                                                                                    const newCats = [...selectedWidget.data.categories];
                                                                                    newCats[idx].icon = e.target.value;
                                                                                    updateSelectedWidgetData({ categories: newCats });
                                                                                }}
                                                                            >
                                                                                <option value="Utensils">Comida</option>
                                                                                <option value="Coffee">Café</option>
                                                                                <option value="Wine">Bar</option>
                                                                                <option value="Pizza">Cine/Pizza</option>
                                                                                <option value="Baby">Kids Club</option>
                                                                                <option value="Waves">Piscinas</option>
                                                                                <option value="Gamepad2">Juegos</option>
                                                                                <option value="Film">Películas</option>
                                                                                <option value="Dumbbell">Gimnasio</option>
                                                                                <option value="Flower2">Spa</option>
                                                                                <option value="ListChecks">Lista</option>
                                                                            </select>
                                                                        </div>
                                                                        <div className="space-y-1">
                                                                            <label className="text-[8px] font-black text-neutral-600 uppercase tracking-widest block">Estado</label>
                                                                            <button
                                                                                onClick={() => {
                                                                                    const newCats = selectedWidget.data.categories.map((c: any, i: number) => ({ ...c, active: i === idx }));
                                                                                    updateSelectedWidgetData({ categories: newCats });
                                                                                }}
                                                                                className={`w-full py-2 rounded-lg text-[9px] font-black uppercase transition-all ${cat.active ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'bg-neutral-800 text-neutral-500 text-center hover:text-white'}`}
                                                                            >
                                                                                {cat.active ? 'ACTIVO' : 'ACTIVAR'}
                                                                            </button>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                                <div className="flex justify-between items-center bg-black/40 p-3 rounded-xl border border-white/5">
                                                                    <div className="flex flex-col flex-1">
                                                                        <label className="text-[7px] font-black text-neutral-600 uppercase tracking-widest block mb-1">Link a Layout al Tocar</label>
                                                                        <select
                                                                            className="bg-transparent border-none text-[11px] font-black text-blue-500 outline-none focus:ring-0 p-0 italic"
                                                                            value={cat.targetLayoutId || ''}
                                                                            onChange={(e) => {
                                                                                const newCats = [...selectedWidget.data.categories];
                                                                                newCats[idx].targetLayoutId = e.target.value;
                                                                                updateSelectedWidgetData({ categories: newCats });
                                                                            }}
                                                                        >
                                                                            <option value="">(Solo Filtro)</option>
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
                                                                        className="p-2.5 text-red-500/20 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all ml-4"
                                                                    >
                                                                        <Trash2 className="w-4 h-4" />
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        </div>
                                                    ))}
                                            </div>
                                        </div>
                                    </div>
                                    {/* CATEGORY_NAV Editor */}
                                    {selectedWidget.type === 'CATEGORY_NAV' && (
                                        <div className="space-y-8">
                                            <div className="bg-blue-600/5 p-6 rounded-3xl border border-blue-500/10 space-y-6">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex flex-col">
                                                        <span className="text-[11px] font-black text-white uppercase italic tracking-widest">Sincronización Pro</span>
                                                        <span className="text-[9px] text-neutral-500 font-bold">Autogenerar layouts para este menú</span>
                                                    </div>
                                                    <button
                                                        onClick={() => {
                                                            const newCats = [...selectedWidget.data.categories];
                                                            newCats.forEach((cat, idx) => {
                                                                if (!cat.targetLayoutId) {
                                                                    const newId = 'layout-' + Math.random().toString(36).substr(2, 9);
                                                                    const newLayout = {
                                                                        id: newId,
                                                                        name: `Menu: ${cat.label}`,
                                                                        orientation,
                                                                        widgets: [
                                                                            { id: 'back-btn', type: 'NAV_BUTTON', x: 5, y: 5, w: 15, h: 8, data: { label: 'VOLVER', type: 'BACK', icon: 'ArrowLeft', color: '#3b82f6' } },
                                                                            { id: 'title', type: 'TEXT', x: 25, y: 5, w: 50, h: 10, data: { content: `<h1 style="text-align: center;">${cat.label.toUpperCase()}</h1>` } }
                                                                        ],
                                                                        backgroundColor: '#000000',
                                                                        backgroundImage: cat.photo || '',
                                                                        backgroundBlur: 20
                                                                    };
                                                                    socket.emit('save_layout', { screenId, layout: newLayout });
                                                                    newCats[idx].targetLayoutId = newId;
                                                                }
                                                            });
                                                            updateSelectedWidgetData({ categories: newCats });
                                                            setTimeout(fetchLayouts, 1000);
                                                        }}
                                                        className="bg-blue-600 hover:bg-blue-500 text-white p-3 rounded-2xl transition-all shadow-lg active:scale-95"
                                                    >
                                                        <Layers className="w-5 h-5" />
                                                    </button>
                                                </div>

                                                <div className="space-y-4">
                                                    <div>
                                                        <label className="text-[8px] font-black text-blue-400/60 uppercase tracking-[0.2em] mb-2 block">Título del Menú</label>
                                                        <input
                                                            className="w-full bg-black/40 border border-white/5 rounded-2xl p-4 text-[13px] font-black text-white italic outline-none focus:border-blue-500/50 transition-all"
                                                            value={selectedWidget.data.title || ''}
                                                            onChange={(e) => updateSelectedWidgetData({ title: e.target.value })}
                                                            placeholder="NUESTRAS SECCIONES"
                                                        />
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
                                                        <div key={cat.id} className="bg-[#111] p-6 rounded-3xl border border-white/5 space-y-5 group relative overflow-hidden">
                                                            {/* Background accent */}
                                                            <div className={`absolute top-0 right-0 w-32 h-32 bg-blue-600/5 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none`} />

                                                            <div className="flex gap-5 relative z-10">
                                                                <div className="w-20 h-20 rounded-2xl bg-black border border-white/10 overflow-hidden flex-shrink-0 relative group/photo shadow-2xl">
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
                                                                            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-xs font-black italic outline-none text-white focus:border-blue-500/50 transition-colors"
                                                                            value={cat.label}
                                                                            onChange={(e) => {
                                                                                const newCats = [...selectedWidget.data.categories];
                                                                                newCats[idx].label = e.target.value;
                                                                                updateSelectedWidgetData({ categories: newCats });
                                                                            }}
                                                                        />
                                                                    </div>

                                                                    <div className="grid grid-cols-2 gap-3">
                                                                        <div className="space-y-1">
                                                                            <label className="text-[8px] font-black text-neutral-600 uppercase tracking-widest block">Icono</label>
                                                                            <select
                                                                                className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-[10px] font-black text-white/50 outline-none focus:border-blue-500/50"
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
                                                                                className={`w-full py-2 rounded-xl text-[9px] font-black uppercase transition-all ${cat.active ? 'bg-blue-600 text-white shadow-lg' : 'bg-neutral-800 text-neutral-500 hover:text-white'}`}
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
                                                                    className="p-3 text-red-500/20 hover:text-red-500 hover:bg-red-500/10 rounded-2xl transition-all"
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
                                    <div>
                                        <label className="text-[8px] font-black text-neutral-700 uppercase mb-1.5 block">Icono</label>
                                        <select
                                            className="w-full bg-[#111] border border-white/5 rounded-xl p-3 text-[10px] font-black outline-none focus:border-blue-500"
                                            value={selectedWidget.data.icon || 'ArrowLeft'}
                                            onChange={(e) => updateSelectedWidgetData({ icon: e.target.value })}
                                        >
                                            <option value="ArrowLeft">Flecha Atrás</option>
                                            <option value="Home">Casita</option>
                                            <option value="ChevronRight">Flecha Derecha</option>
                                            <option value="Zap">Rayo</option>
                                        </select>
                                    </div>
                            </div>

                            {(selectedWidget.data.type === 'LINK' || selectedWidget.data.type === 'HOME') && (
                                <div>
                                    <label className="text-[8px] font-black text-neutral-700 uppercase mb-1.5 block">Destino (Layout)</label>
                                    <select
                                        className="w-full bg-[#111] border border-white/5 rounded-xl p-3 text-[10px] font-black outline-none focus:border-blue-500 text-blue-400"
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
                                <div className="flex items-center gap-4 bg-black/40 p-3 rounded-xl border border-white/5">
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
        </div>
        </div >
    )
}

{
    selectedWidget.type === 'PRODUCT_LIST' && (
        <div className="space-y-6">
            <div>
                <label className="text-[9px] text-neutral-600 uppercase block font-black mb-2 italic">Título del Menú</label>
                <input
                    className="w-full bg-[#111] border border-white/5 rounded-xl p-4 text-xs font-black italic outline-none focus:border-blue-500"
                    value={selectedWidget.data.title || ''}
                    onChange={(e) => updateSelectedWidgetData({ title: e.target.value })}
                    placeholder="Ej: NUESTRA CARTA"
                />
            </div>
            <div className="p-4 bg-blue-500/5 rounded-xl border border-blue-500/10">
                <p className="text-[10px] text-neutral-400 font-bold uppercase tracking-widest leading-relaxed">
                    Los productos se gestionan desde la pestaña <ShoppingBag className="w-3 h-3 inline mb-0.5" /> **Catálogo** en la barra lateral izquierda.
                </p>
            </div>
        </div>
    )
}

{
    selectedWidget.type === 'ACTIVITIES' && (
        <div className="space-y-6">
            <div>
                <label className="text-[9px] text-neutral-600 uppercase block font-black mb-2 italic">Título de la Agenda</label>
                <input
                    className="w-full bg-[#111] border border-white/5 rounded-xl p-4 text-xs font-black italic outline-none focus:border-blue-500"
                    value={selectedWidget.data.title || ''}
                    onChange={(e) => updateSelectedWidgetData({ title: e.target.value })}
                    placeholder="Ej: EVENTOS DE HOY"
                />
            </div>
            <div className="p-4 bg-amber-500/5 rounded-xl border border-amber-500/10">
                <p className="text-[10px] text-neutral-400 font-bold uppercase tracking-widest leading-relaxed">
                    Las actividades se gestionan desde la pestaña <RefreshCw className="w-3 h-3 inline mb-0.5" /> **Cronograma** en la barra lateral izquierda.
                </p>
            </div>
        </div>
    )
}

{
    selectedWidget.type === 'WEATHER' && (
        <div className="space-y-6">
            <div>
                <label className="text-[9px] text-neutral-600 uppercase block font-black mb-2 italic">Ciudad</label>
                <input
                    className="w-full bg-[#111] border border-white/5 rounded-xl p-4 text-xs font-black italic outline-none focus:border-blue-500"
                    value={selectedWidget.data.city || ''}
                    onChange={(e) => updateSelectedWidgetData({ city: e.target.value })}
                    placeholder="Ej: Buenos Aires"
                />
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="text-[9px] text-neutral-600 uppercase block font-black mb-2">Temperatura</label>
                    <input
                        type="number"
                        className="w-full bg-[#111] border border-white/5 rounded-xl p-4 text-xs font-black outline-none"
                        value={selectedWidget.data.temp || 0}
                        onChange={(e) => updateSelectedWidgetData({ temp: parseInt(e.target.value) })}
                    />
                </div>
                <div>
                    <label className="text-[9px] text-neutral-600 uppercase block font-black mb-2">Condición</label>
                    <select
                        className="w-full bg-[#111] border border-white/5 rounded-xl p-4 text-[10px] font-black outline-none focus:border-blue-500"
                        value={selectedWidget.data.condition || 'SUNNY'}
                        onChange={(e) => updateSelectedWidgetData({ condition: e.target.value })}
                    >
                        <option value="SUNNY">Soleado</option>
                        <option value="CLOUDY">Nublado</option>
                        <option value="RAINY">Lluvia</option>
                        <option value="WINDY">Viento</option>
                    </select>
                </div>
            </div>
        </div>
    )
}

{
    selectedWidget.type === 'PRICE_LIST' && (
        <div className="space-y-6">
            <div>
                <label className="text-[9px] text-neutral-600 uppercase block font-black mb-2 italic">Título del Listado</label>
                <input
                    className="w-full bg-[#111] border border-white/5 rounded-xl p-4 text-xs font-black italic outline-none focus:border-blue-500"
                    value={selectedWidget.data.title || ''}
                    onChange={(e) => updateSelectedWidgetData({ title: e.target.value })}
                    placeholder="Ej: LISTA DE PRECIOS"
                />
            </div>
            <div className="space-y-3 pt-4 border-t border-white/5">
                <div className="flex justify-between items-center bg-[#111] px-4 py-2 rounded-xl">
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
                        <div key={idx} className="bg-[#111]/50 p-4 rounded-xl border border-white/5 space-y-3">
                            <div className="flex gap-2">
                                <input
                                    className="flex-1 bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-xs font-black italic outline-none text-white focus:border-blue-500/50"
                                    value={item.name}
                                    onChange={(e) => {
                                        const newItems = [...selectedWidget.data.items];
                                        newItems[idx].name = e.target.value;
                                        updateSelectedWidgetData({ items: newItems });
                                    }}
                                />
                                <input
                                    className="w-24 bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-xs font-black text-blue-500 outline-none"
                                    value={item.price}
                                    onChange={(e) => {
                                        const newItems = [...selectedWidget.data.items];
                                        newItems[idx].price = e.target.value;
                                        updateSelectedWidgetData({ items: newItems });
                                    }}
                                />
                            </div>
                            <textarea
                                className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-[10px] text-neutral-400 outline-none h-12 resize-none"
                                value={item.description}
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
    )
}
                        </div >
                            </section >

    <div className="p-8 border-t border-white/5 space-y-4 bg-red-500/5">
        <button
            onClick={() => {
                setWidgets(widgets.filter(w => w.id !== selectedWidgetId));
                setSelectedWidgetId(null);
            }}
            className="w-full flex items-center justify-center gap-3 py-4 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white text-[11px] font-black uppercase rounded-2xl border border-red-500/20 transition-all"
        >
            <Trash2 className="w-4 h-4" /> Eliminar Objeto
        </button>
    </div>
            </div >
            ) : (
    <div className="flex-1 flex flex-col p-8 space-y-10 overflow-y-auto">
        <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-3xl blur opacity-10 group-hover:opacity-20 transition-opacity" />
            <div className="bg-[#111] p-8 rounded-3xl border border-white/5 space-y-8 relative">
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
                                className="w-10 h-10 rounded-xl bg-transparent border-none cursor-pointer"
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
                                className="w-full bg-black/40 border border-white/5 rounded-xl p-3 text-xs font-bold text-blue-400 outline-none"
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
                            <div className="relative group aspect-video rounded-2xl overflow-hidden border border-white/10 shadow-2xl">
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
                                        className="bg-red-500 text-white p-2 rounded-xl"
                                    >
                                        <Trash2 className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="space-y-4 pt-4 border-t border-white/5">
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
                </div>
            </div>
        </div>

        <div className="bg-blue-600/5 p-8 rounded-2xl border border-blue-500/10 space-y-4">
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
        </aside >
            </div >
        </div >
    );
}
