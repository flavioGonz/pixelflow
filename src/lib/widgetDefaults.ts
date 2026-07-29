// Default data payload per widget type. Extracted from admin/page.tsx.
// Keep pure — used both by the Studio and any bootstrap seeder.

export function getDefaultData(type: string): any {
    switch (type) {
        case 'TEXT': return { content: '<h1>PixelFlow</h1><p>Digital Signage Platform</p>', fontSize: '2rem', color: '#ffffff',
            targetLayoutId: '',
            onTapAction: 'NONE'
        };
        case 'VIDEO': return { url: 'https://assets.mixkit.co/videos/preview/mixkit-stars-in-the-night-sky-121-large.mp4' };
        case 'WEATHER': return { city: 'Buenos Aires', temp: 24, condition: 'SUNNY' };
        case 'PRICE_LIST': return { title: 'LISTA DE PRECIOS', items: [{ name: 'Hamburguesa Smashed', price: '$12', description: 'Carne premium, doble queso.' }] };
        case 'SLIDER': return {
            onTapAction: 'NONE',
            targetLayoutId: '', images: ['https://picsum.photos/1200/800?random=1', 'https://picsum.photos/1200/800?random=2'] };
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
            action: 'BACK',
            targetLayoutId: '',
            icon: 'ArrowLeft',
            variant: 'solid',
            color: '#3b82f6',
            textColor: '#ffffff',
            borderRadius: 12,
            shadow: true,
            fontSize: 'lg',
            iconPosition: 'left'
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
            provider: 'SPOTIFY',
            spotifyEmbedUrl: 'https://open.spotify.com/embed/playlist/37i9dQZF1DX4WYpdgoIcn6?utm_source=generator&theme=0',
            song: 'CHILL PLAYLIST',
            artist: 'ALTOS DEL ARAPEY',
            cover: '',
            accentColor: '#10b981',
            showControls: true,
            autoplay: false,
            compact: false
        };
        case 'ATMOSPHERE': return {
            preset: 'sunset',
            intensity: 0.5,
        };
        case 'DATE_TIME': return {
            style: 'MODERN'
        };
        case 'WIFI_INFO':
            return { title: 'Wi-Fi Gratis', ssid: 'MyHotel-WiFi', password: '', encryption: 'WPA', hidden: false, theme: 'glass', accentColor: '#3b82f6' };
        case 'FEEDBACK':
            return { title: '¿Cómo fue tu experiencia?', subtitle: 'Tocá una carita para valorarnos', thanksMessage: '¡Gracias por tu opinión!', source: 'lobby', accentColor: '#3b82f6' };
        case 'IMAGE': return {
            src: '',
            alt: '',
            fit: 'cover',
            position: 'center',
            borderRadius: 12,
            opacity: 1,
            rotate: 0,
            overlay: '',
            overlayOpacity: 0,
            targetLayoutId: '',
            onTapAction: 'NONE',
            caption: '',
            captionPosition: 'over',
            captionColor: '#ffffff',
            captionSize: 'md',
            captionAlign: 'center'
        };
        case 'DATA_TABLE': return {
            title: 'RESUMEN DE VENTAS',
            theme: 'clean',
            density: 'comfortable',
            striped: true,
            showHeader: true,
            columns: [
                { key: 'nombre', label: 'Producto', align: 'left' },
                { key: 'cantidad', label: 'Cant.', align: 'right', width: '80px', isNumber: true },
                { key: 'precio', label: 'Precio', align: 'right', width: '110px', isCurrency: true }
            ],
            rows: [
                { nombre: 'Café espresso', cantidad: 12, precio: 3.50 },
                { nombre: 'Cappuccino',    cantidad: 8,  precio: 4.20 },
                { nombre: 'Latte',         cantidad: 6,  precio: 4.80 },
                { nombre: 'Té chai',       cantidad: 4,  precio: 3.90 },
                { nombre: 'Mate cocido',   cantidad: 15, precio: 2.20 }
            ]
        };
        case 'SENSOR_VALUE': return {
            sensorId: '',
            theme: 'card',
            showLabel: true,
            showUnit: true,
            precision: 1,
            accentColor: '#10b981'
        };
        default: return {};
    }
}
