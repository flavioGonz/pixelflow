const mongoose = require('mongoose');
const Category = require('./src/models/Category');
const Product = require('./src/models/Product');

const CATS = [
  { name: 'Desayunos', description: 'Empezá el día con energía', photo: 'https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?w=800&q=80', order: 1 },
  { name: 'Almuerzos', description: 'Platos calientes al mediodía', photo: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&q=80', order: 2 },
  { name: 'Bebidas', description: 'Refrescos, jugos y cafetería', photo: 'https://images.unsplash.com/photo-1544145945-f90425340c7e?w=800&q=80', order: 3 },
  { name: 'Postres', description: 'Dulces caseros de la casa', photo: 'https://images.unsplash.com/photo-1551024506-0bccd828d307?w=800&q=80', order: 4 },
  { name: 'Vinos', description: 'Selección de bodegas locales', photo: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=800&q=80', order: 5 },
  { name: 'Snacks & Piscina', description: 'Para el reposo junto a la pileta', photo: 'https://images.unsplash.com/photo-1600891964092-4316c288032e?w=800&q=80', order: 6 },
];

// map category name -> id after insert
const PRODUCTS = {
  'Desayunos': [
    { name: 'Continental Completo', price: 480, description: 'Café, jugo, medialunas, fruta, yogur y tostadas', photo: 'https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?w=800&q=80' },
    { name: 'Huevos Benedictine', price: 620, description: 'Sobre pan brioche, salsa holandesa y jamón crudo', photo: 'https://images.unsplash.com/photo-1608039755401-742074f0548d?w=800&q=80' },
    { name: 'Panqueques con Miel', price: 390, description: 'Tres panqueques con miel de eucaliptos y manteca', photo: 'https://images.unsplash.com/photo-1528207776546-365bb710ee93?w=800&q=80' },
    { name: 'Bowl de Frutas', price: 350, description: 'Frutas de estación con granola casera y yogur griego', photo: 'https://images.unsplash.com/photo-1490474418585-ba9bad8fd0ea?w=800&q=80' },
    { name: 'Tostado Jamón & Queso', price: 320, description: 'Pan de campo, jamón cocido y muzzarella fundida', photo: 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=800&q=80' },
  ],
  'Almuerzos': [
    { name: 'Bife de Chorizo', price: 890, description: 'Bife de 300g con papas rústicas y ensalada mixta', photo: 'https://images.unsplash.com/photo-1546964124-0cce460f38ef?w=800&q=80' },
    { name: 'Milanesa Napolitana', price: 720, description: 'Milanesa de ternera con jamón, muzzarella y papas', photo: 'https://images.unsplash.com/photo-1594221708779-94832f4320d1?w=800&q=80' },
    { name: 'Pasta Fresca al Pesto', price: 640, description: 'Tallarines caseros con pesto de albahaca y piñones', photo: 'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=800&q=80' },
    { name: 'Ensalada César', price: 550, description: 'Lechuga romana, pollo grillado, crutones y parmesano', photo: 'https://images.unsplash.com/photo-1550304943-4f24f54ddde9?w=800&q=80' },
    { name: 'Risotto de Hongos', price: 690, description: 'Arroz carnaroli con hongos silvestres y trufa', photo: 'https://images.unsplash.com/photo-1633436374961-09b0c93b3b74?w=800&q=80' },
    { name: 'Salmón Grillado', price: 980, description: 'Salmón rosado con vegetales al vapor y quinoa', photo: 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=800&q=80' },
  ],
  'Bebidas': [
    { name: 'Café Espresso', price: 180, description: 'Café en grano tostado en casa', photo: 'https://images.unsplash.com/photo-1510591509098-f4fdc6d0ff04?w=800&q=80' },
    { name: 'Café con Leche', price: 220, description: 'Espresso doble con leche vaporizada', photo: 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=800&q=80' },
    { name: 'Jugo de Naranja Natural', price: 280, description: 'Exprimido en el momento', photo: 'https://images.unsplash.com/photo-1613478223719-2ab802602423?w=800&q=80' },
    { name: 'Limonada de Menta', price: 260, description: 'Con jengibre fresco y hojas de menta', photo: 'https://images.unsplash.com/photo-1523371683702-1dcb66b1c3b3?w=800&q=80' },
    { name: 'Agua Saborizada Local', price: 180, description: 'Manzana, pomelo o limón — sin azúcar', photo: 'https://images.unsplash.com/photo-1502741224143-90386d7f8c82?w=800&q=80' },
    { name: 'Coca-Cola / Sprite', price: 200, description: 'Lata 354ml', photo: 'https://images.unsplash.com/photo-1554866585-cd94860890b7?w=800&q=80' },
    { name: 'Cerveza Artesanal', price: 420, description: 'IPA local, botella 500ml', photo: 'https://images.unsplash.com/photo-1608270586620-248524c67de9?w=800&q=80' },
  ],
  'Postres': [
    { name: 'Cheesecake de Frutos Rojos', price: 380, description: 'Base de galleta y coulis casero', photo: 'https://images.unsplash.com/photo-1524351199678-941a58a3df50?w=800&q=80' },
    { name: 'Volcán de Chocolate', price: 420, description: 'Con helado de vainilla y frutos secos', photo: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=800&q=80' },
    { name: 'Tiramisú Clásico', price: 390, description: 'Con mascarpone italiano y cacao amargo', photo: 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=800&q=80' },
    { name: 'Flan Casero con Dulce de Leche', price: 320, description: 'Receta de la abuela con crema', photo: 'https://images.unsplash.com/photo-1587244141406-c06f635bd137?w=800&q=80' },
    { name: 'Helado Artesanal (3 sabores)', price: 350, description: 'Sabores del día — consultar mostrador', photo: 'https://images.unsplash.com/photo-1501443762994-82bd5dace89a?w=800&q=80' },
  ],
  'Vinos': [
    { name: 'Tannat Reserva 2022', price: 1400, description: 'Uruguay — Bodega Familiar Bouza', photo: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=800&q=80' },
    { name: 'Malbec Argentino 2021', price: 1200, description: 'Mendoza — Alto de la Escuela', photo: 'https://images.unsplash.com/photo-1553361371-9b22f78e8b1d?w=800&q=80' },
    { name: 'Chardonnay 2023', price: 980, description: 'Uruguay — Notas de manzana verde y roble', photo: 'https://images.unsplash.com/photo-1566754436658-3aca7a4ad1e3?w=800&q=80' },
    { name: 'Sauvignon Blanc 2023', price: 850, description: 'Frescos cítricos, ideal para pescados', photo: 'https://images.unsplash.com/photo-1547595628-c61a29f496f0?w=800&q=80' },
    { name: 'Espumante Brut Nature', price: 1150, description: 'Método champenoise, burbuja fina', photo: 'https://images.unsplash.com/photo-1592483648224-61bf8287bc4f?w=800&q=80' },
  ],
  'Snacks & Piscina': [
    { name: 'Tabla de Fiambres', price: 780, description: 'Selección de embutidos con encurtidos y panes', photo: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=800&q=80' },
    { name: 'Chivito al Plato', price: 690, description: 'Lomito, queso, jamón, huevo, tocino y papas', photo: 'https://images.unsplash.com/photo-1550547660-d9450f859349?w=800&q=80' },
    { name: 'Hamburguesa Gourmet', price: 620, description: 'Carne 200g, cheddar, cebolla caramelizada, papas', photo: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800&q=80' },
    { name: 'Papas Fritas Trufadas', price: 380, description: 'Con aceite de trufa y parmesano rallado', photo: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=800&q=80' },
    { name: 'Nachos con Guacamole', price: 420, description: 'Nachos crujientes con guacamole y salsas', photo: 'https://images.unsplash.com/photo-1582169296194-e4d644c48063?w=800&q=80' },
    { name: 'Bowl Poke de Salmón', price: 720, description: 'Arroz, salmón fresco, palta, edamame, sésamo', photo: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&q=80' },
  ],
};

(async () => {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://192.168.99.121:27017/pixelflow');
  console.log('Connected');
  // wipe (excepto lo que ya haya — cuidado; el user aceptó nutrir)
  await Category.deleteMany({});
  await Product.deleteMany({});
  console.log('Wiped');

  const catMap = {};
  for (const c of CATS) {
    const doc = await Category.create(c);
    catMap[c.name] = String(doc._id);
    console.log('Cat:', c.name, doc._id);
  }
  let total = 0;
  for (const [catName, items] of Object.entries(PRODUCTS)) {
    const catId = catMap[catName];
    for (const it of items) {
      await Product.create({ ...it, currency: '$', categoryIds: [catId], available: true });
      total++;
    }
  }
  console.log('Products created:', total);
  await mongoose.disconnect();
  console.log('Done.');
})().catch(e => { console.error(e); process.exit(1); });
