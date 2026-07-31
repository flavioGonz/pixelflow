require('dotenv').config();
const http = require('http');
const { parse } = require('url');
const next = require('next');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const Layout = require('./src/models/Layout');
const Screen = require('./src/models/Screen');
const Sensor = require('./src/models/Sensor');
const EwelinkClient = require('./src/models/EwelinkClient');
const ewe = EwelinkClient; // singleton instance
const EwelinkSettings = require('./src/models/EwelinkSettings');
const SpotifySettings = require('./src/models/SpotifySettings');
const Settings = require('./src/models/Settings');
const Feedback = require('./src/models/Feedback');
const Schedule = require('./src/models/Schedule');
const multer = require('multer');
const path = require('path');
const express = require('express');
const fs = require('fs');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const User = require('./src/models/User');
const Product = require('./src/models/Product');
const Category = require('./src/models/Category');
const Activity = require('./src/models/Activity');
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

const dev = false; // Hardcoded prod: evita bug donde dotenv carga tarde y Next arranca en dev
const nextApp = next({ dev });
const handle = nextApp.getRequestHandler();

// Ensure uploads folder exists
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}

// Multer storage
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});
const upload = multer({ storage });

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.error('MongoDB Connection Error:', err));

nextApp.prepare().then(() => {
    const expressApp = express();
    expressApp.set('trust proxy', true);
    const server = http.createServer(expressApp);

    // Logging middleware
    expressApp.use((req, res, next) => {
        // console.log(`${req.method} ${req.url}`);
        next();
    });

    expressApp.use(express.json());
    expressApp.use(express.json());
    expressApp.use(cookieParser());

    // --- SWAGGER DOCUMENTATION ---
    const swaggerOptions = {
        definition: {
            openapi: '3.0.0',
            info: {
                title: 'PixelFlow API',
                version: '2.0.0',
                description: 'Digital Signage Platform — REST + WebSocket API for layout composition, screen orchestration, real-time content delivery, and IoT integrations (eWeLink + sensors).',
                contact: { name: 'Infratec', url: 'https://altosdelarapey.infratec.com.uy' },
                license: { name: 'Proprietary' },
            },
            servers: [
                { url: 'https://altosdelarapey.infratec.com.uy', description: 'Producción (Altos del Arapey)' },
                { url: `http://localhost:${process.env.PORT || 3000}`, description: 'Local' },
            ],
            tags: [
                { name: 'Auth', description: 'Login, logout y perfil' },
                { name: 'Layouts', description: 'Interfaces / diseños (CRUD y export)' },
                { name: 'Screens', description: 'Pantallas / totems (registro, autorización, config)' },
                { name: 'Products', description: 'Catálogo de productos' },
                { name: 'Categories', description: 'Categorías del catálogo' },
                { name: 'Activities', description: 'Agenda de actividades / eventos' },
                { name: 'Sensors', description: 'Sensores IoT + polling eWeLink' },
                { name: 'eWeLink', description: 'OAuth2 y acciones sobre devices Sonoff/eWeLink' },
                { name: 'Spotify', description: 'OAuth Spotify + Now Playing + playlists' },
                { name: 'Screensaver', description: 'Configuración global del screensaver universal' },
                { name: 'Feedback', description: 'Votos del widget FEEDBACK (5 emojis)' },
                { name: 'Uploads', description: 'Subida y servido de archivos multimedia' },
            ],
            components: {
                securitySchemes: {
                    cookieAuth: { type: 'apiKey', in: 'cookie', name: 'auth_token', description: 'JWT en cookie httpOnly emitida por /api/auth/login' },
                },
                schemas: {
                    Widget: {
                        type: 'object',
                        properties: {
                            id: { type: 'string' },
                            type: { type: 'string', example: 'TEXT' },
                            x: { type: 'number', description: '% desde la izquierda del canvas' },
                            y: { type: 'number' },
                            w: { type: 'number', description: '% ancho' },
                            h: { type: 'number', description: '% alto' },
                            zIndex: { type: 'number' },
                            data: { type: 'object', description: 'Props específicos del widget' },
                        },
                    },
                    Layout: {
                        type: 'object',
                        properties: {
                            _id: { type: 'string' },
                            name: { type: 'string' },
                            orientation: { type: 'string', enum: ['landscape', 'portrait'] },
                            widgets: { type: 'array', items: { $ref: '#/components/schemas/Widget' } },
                            backgroundColor: { type: 'string' },
                            backgroundImage: { type: 'string' },
                            backgroundVideo: { type: 'string' },
                            designWidth: { type: 'number' },
                            designHeight: { type: 'number' },
                            targetDPI: { type: 'number' },
                        },
                    },
                    Screen: {
                        type: 'object',
                        properties: {
                            screenId: { type: 'string' },
                            name: { type: 'string' },
                            isAuthorized: { type: 'boolean' },
                            lastLayoutId: { type: 'string' },
                            idleTimeoutMs: { type: 'number' },
                            viewport: { type: 'object' },
                            lastSeen: { type: 'string', format: 'date-time' },
                        },
                    },
                    ScreensaverConfig: {
                        type: 'object',
                        properties: {
                            enabled: { type: 'boolean' },
                            idleMs: { type: 'number' },
                            rotateMs: { type: 'number' },
                            layoutIds: { type: 'array', items: { type: 'string' } },
                            layoutDurationsMs: { type: 'object', additionalProperties: { type: 'number' } },
                            mediaItems: {
                                type: 'array',
                                items: {
                                    type: 'object',
                                    properties: {
                                        type: { type: 'string', enum: ['image', 'video'] },
                                        url: { type: 'string' },
                                        durationMs: { type: 'number' },
                                    },
                                },
                            },
                        },
                    },
                    Feedback: {
                        type: 'object',
                        properties: {
                            value: { type: 'integer', minimum: 1, maximum: 5 },
                            source: { type: 'string', example: 'lobby' },
                            userAgent: { type: 'string' },
                            at: { type: 'string', format: 'date-time' },
                        },
                    },
                },
            },
            security: [{ cookieAuth: [] }],
        },
        apis: ['./server.js'],
    };
    const swaggerDocs = swaggerJsdoc(swaggerOptions);
    expressApp.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs, {
        customSiteTitle: 'PixelFlow API · Docs',
        customCss: '.swagger-ui .topbar { background: #0f172a; } .swagger-ui .info .title { color: #0f172a; }',
    }));

    /**
     * @swagger
     * /api/layouts:
     *   get:
     *     summary: Listar todas las interfaces
     *     tags: [Layouts]
     *     responses:
     *       200: { description: OK, content: { application/json: { schema: { type: array, items: { $ref: '#/components/schemas/Layout' } } } } }
     */

    /**
     * @swagger
     * /api/screens/{screenId}/config:
     *   patch:
     *     summary: Actualizar config de una pantalla (idle timeout)
     *     tags: [Screens]
     *     parameters:
     *       - in: path
     *         name: screenId
     *         required: true
     *         schema: { type: string }
     *     requestBody:
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             properties:
     *               idleTimeoutMs: { type: integer }
     *     responses:
     *       200: { description: OK }
     */

    /**
     * @swagger
     * /api/settings/screensaver:
     *   get:
     *     summary: Leer configuración del screensaver global
     *     tags: [Screensaver]
     *     responses:
     *       200: { description: OK, content: { application/json: { schema: { $ref: '#/components/schemas/ScreensaverConfig' } } } }
     *   patch:
     *     summary: Actualizar configuración del screensaver (broadcast a todos los players)
     *     tags: [Screensaver]
     *     requestBody:
     *       content:
     *         application/json:
     *           schema: { $ref: '#/components/schemas/ScreensaverConfig' }
     *     responses:
     *       200: { description: OK }
     */

    /**
     * @swagger
     * /api/feedback:
     *   post:
     *     summary: Registrar un voto del widget FEEDBACK
     *     tags: [Feedback]
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             required: [value]
     *             properties:
     *               value: { type: integer, minimum: 1, maximum: 5 }
     *               source: { type: string, example: lobby }
     *     responses:
     *       200: { description: OK }
     *       400: { description: Valor fuera de rango }
     *   get:
     *     summary: Consultar votos recientes
     *     tags: [Feedback]
     *     parameters:
     *       - in: query
     *         name: since
     *         schema: { type: string, format: date-time }
     *         description: Solo devuelve votos posteriores a esta fecha (default 30 días)
     *     responses:
     *       200:
     *         description: OK
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 count: { type: integer }
     *                 items: { type: array, items: { $ref: '#/components/schemas/Feedback' } }
     */

    // --- SEED DATA ENDPOINT ---
    /**
     * @swagger
     * /api/seed:
     *   post:
     *     summary: Seed the database with default data
     *     responses:
     *       200:
     *         description: Database seeded successfully
     */
    expressApp.post('/api/seed', async (req, res) => {
        try {
            const productsCount = await Product.countDocuments();
            const activitiesCount = await Activity.countDocuments();
            const categoriesCount = await Category.countDocuments();

            if (productsCount > 0 && activitiesCount > 0) {
                return res.json({ message: 'Database already has data.' });
            }

            // Seed Categories
            const cat1 = await Category.create({ name: 'BEBIDAS', order: 1 });
            const cat2 = await Category.create({ name: 'SNACKS', order: 2 });
            const cat3 = await Category.create({ name: 'POSTRES', order: 3 });

            // Seed Products
            await Product.create({
                name: 'COCA COLA',
                description: 'Refresco de cola carbonatada.',
                price: 2.50,
                currency: '$',
                categoryIds: [cat1._id],
                available: true
            });
            await Product.create({
                name: 'PAPAS FRITAS',
                description: 'Papas fritas crujientes con sal.',
                price: 3.00,
                currency: '$',
                categoryIds: [cat2._id],
                available: true
            });
            await Product.create({
                name: 'HELADO',
                description: 'Helado de vainilla con chocolate.',
                price: 4.50,
                currency: '$',
                categoryIds: [cat3._id],
                available: true
            });

            // Seed Activities
            await Activity.create({
                title: 'YOGA MAÑANERO',
                desc: 'Clase de yoga para empezar el día con energía.',
                time: '08:00',
                category: 'BIENESTAR',
                order: 1
            });
            await Activity.create({
                title: 'CINE AL AIRE LIBRE',
                desc: 'Proyección de películas clásicas bajo las estrellas.',
                time: '20:00',
                category: 'ENTRETENIMIENTO',
                order: 2
            });

            res.json({ message: 'Database seeded successfully with default data.' });
        } catch (error) {
            console.error('Seed error:', error);
            res.status(500).json({ error: 'Failed to seed database' });
        }
    });

    // --- AUTHENTICATION ROUTES ---
    /**
     * @swagger
     * /api/auth/login:
     *   post:
     *     summary: User login
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             properties:
     *               email:
     *                 type: string
     *               password:
     *                 type: string
     *     responses:
     *       200:
     *         description: Login successful
     */
    expressApp.post('/api/auth/login', async (req, res) => {
        try {
            const { email, password } = req.body;
            const user = await User.findOne({ email });

            if (!user) {
                return res.status(401).json({ error: 'Invalid credentials' });
            }

            const isMatch = await bcrypt.compare(password, user.password);
            if (!isMatch) {
                return res.status(401).json({ error: 'Invalid credentials' });
            }

            const token = jwt.sign({ userId: user._id, email: user.email }, JWT_SECRET, { expiresIn: '1d' });

            res.cookie('token', token, {
                httpOnly: true,
                secure: process.env.COOKIE_SECURE === 'true',
                maxAge: 24 * 60 * 60 * 1000, // 1 day
                sameSite: 'lax'
            });

            res.json({ user: { email: user.email } });
        } catch (error) {
            console.error('Login error:', error);
            res.status(500).json({ error: 'Server error' });
        }
    });

    /**
     * @swagger
     * /api/auth/logout:
     *   post:
     *     summary: User logout
     *     responses:
     *       200:
     *         description: Logout successful
     */
    expressApp.post('/api/auth/logout', (req, res) => {
        res.clearCookie('token');
        res.json({ message: 'Logged out' });
    });

    /**
     * @swagger
     * /api/auth/me:
     *   get:
     *     summary: Get current user info
     *     responses:
     *       200:
     *         description: User info retrieved
     */
    expressApp.get('/api/auth/me', async (req, res) => {
        try {
            const token = req.cookies.token;
            if (!token) {
                return res.status(401).json({ error: 'Not authenticated' });
            }

            const decoded = jwt.verify(token, JWT_SECRET);
            const user = await User.findById(decoded.userId).select('-password');

            if (!user) {
                return res.status(401).json({ error: 'User not found' });
            }

            res.json({ user });
        } catch (error) {
            res.status(401).json({ error: 'Invalid token' });
        }
    });

    /**
     * @swagger
     * /api/auth/change-password:
     *   post:
     *     summary: Change user password
     *     responses:
     *       200:
     *         description: Password changed successfully
     */
    expressApp.post('/api/auth/change-password', async (req, res) => {
        try {
            const token = req.cookies.token;
            if (!token) {
                return res.status(401).json({ error: 'No autenticado' });
            }

            const decoded = jwt.verify(token, JWT_SECRET);
            const { currentPassword, newPassword } = req.body;

            if (!currentPassword || !newPassword) {
                return res.status(400).json({ error: 'Se requieren ambas contraseñas' });
            }

            if (newPassword.length < 6) {
                return res.status(400).json({ error: 'La nueva contraseña debe tener al menos 6 caracteres' });
            }

            const user = await User.findById(decoded.userId);
            if (!user) {
                return res.status(404).json({ error: 'Usuario no encontrado' });
            }

            const isMatch = await bcrypt.compare(currentPassword, user.password);
            if (!isMatch) {
                return res.status(400).json({ error: 'Contraseña actual incorrecta' });
            }

            const salt = await bcrypt.genSalt(10);
            user.password = await bcrypt.hash(newPassword, salt);
            await user.save();

            res.json({ message: 'Contraseña actualizada correctamente' });
        } catch (error) {
            console.error('Error al cambiar contraseña:', error);
            res.status(500).json({ error: 'Error interno del servidor' });
        }
    });

    // --- PRODUCTS & CATEGORIES ROUTES ---
    /**
     * @swagger
     * /api/products:
     *   get:
     *     summary: Get all products
     *     responses:
     *       200:
     *         description: List of products
     */
    // Products CRUD
    require('./src/routes/products')({ app: expressApp, Product });

    /**
     * @swagger
     * /api/categories:
     *   get:
     *     summary: Get all categories
     *     responses:
     *       200:
     *         description: List of categories
     */
    // Categories CRUD
    require('./src/routes/categories')({ app: expressApp, Category });

    // --- ACTIVITIES ROUTES ---
    /**
     * @swagger
     * /api/activities:
     *   get:
     *     summary: Get all activities
     *     responses:
     *       200:
     *         description: List of activities
     */
    // Activities CRUD
    require('./src/routes/activities')({ app: expressApp, Activity });

    // Serve static files from /uploads
    expressApp.use('/uploads', express.static(uploadDir, {
        maxAge: '365d',
        immutable: true,
        setHeaders: (res) => {
            // Uploaded files have timestamp in filename → filename is unique → cache forever.
            res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
        },
    }));

    // Safe cache headers: prevent poisoned/500 responses from being cached, and mark hashed
    // Next.js static chunks as immutable (they're content-hashed).
    expressApp.use((req, res, next) => {
        const isStatic = req.path.startsWith('/_next/static/');
        const origWriteHead = res.writeHead.bind(res);
        res.writeHead = function (...args) {
            const status = args[0];
            if (status >= 500) {
                res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
                res.removeHeader('ETag');
                res.removeHeader('Expires');
            } else if (isStatic && status >= 200 && status < 300) {
                res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
            }
            return origWriteHead(...args);
        };
        next();
    });


    // API Upload
    /**
     * @swagger
     * /api/upload:
     *   post:
     *     summary: Upload an image or file
     *     responses:
     *       200:
     *         description: File uploaded
     */
        // Get a single layout by id (used by /preview/[layoutId])
    // List all layouts
    expressApp.get('/api/layouts', async (req, res) => {
        try {
            const list = await Layout.find().sort({ updatedAt: -1 }).lean();
            res.json(list);
        } catch (e) { res.status(500).json({ error: e.message }); }
    });
    expressApp.get('/api/layouts/:id', async (req, res) => {
        try {
            const layout = await Layout.findById(req.params.id);
            if (!layout) return res.status(404).json({ error: 'Not found' });
            res.json(layout);
        } catch (err) {
            res.status(400).json({ error: err.message });
        }
    });

    // eWeLink settings + actions



    // Sensors CRUD
    require('./src/routes/sensors')({ app: expressApp, Sensor });

    expressApp.post('/api/screens/:screenId/idle-timeout', async (req, res) => {
        try {
            const { screenId } = req.params;
            const { idleTimeoutMs, screensaverEnabled, screensaverRotateMs } = req.body || {};
            const update = {};
            if (idleTimeoutMs !== undefined) update.idleTimeoutMs = Math.max(3000, Math.min(600000, parseInt(idleTimeoutMs) || 20000));
            if (screensaverEnabled !== undefined) update.screensaverEnabled = !!screensaverEnabled;
            if (screensaverRotateMs !== undefined) update.screensaverRotateMs = Math.max(3000, Math.min(120000, parseInt(screensaverRotateMs) || 10000));
            const screen = await Screen.findOneAndUpdate({ screenId }, update, { new: true });
            if (!screen) return res.status(404).json({ error: 'Screen not found' });
            io.to(`screen_${screenId}`).emit('screen_config', { idleTimeoutMs: screen.idleTimeoutMs, screensaverEnabled: !!screen.screensaverEnabled, screensaverRotateMs: screen.screensaverRotateMs });
            res.json({ ok: true, screen });
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: err.message });
        }
    });

    expressApp.post('/api/upload', upload.single('image'), async (req, res) => {
        if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
        const filename = req.file.filename;
        const url = `/uploads/${filename}`;
        // Metadata para media library
        let meta = { url, filename, size: req.file.size, mimeType: req.file.mimetype };
        try {
            if ((req.file.mimetype || '').startsWith('image/')) {
                const sharp = require('sharp');
                const im = await sharp(req.file.path).metadata();
                meta.width  = im.width;
                meta.height = im.height;
            }
        } catch (e) { /* silent */ }
        res.json(meta);
    });

    // Tanda 2: Media Library
    // GET /api/uploads  → lista con metadata
    expressApp.get('/api/uploads', async (req, res) => {
        try {
            const fs = require('fs').promises;
            const path = require('path');
            const dir = uploadDir;
            const files = await fs.readdir(dir);
            const sharp = (() => { try { return require('sharp'); } catch { return null; } })();
            const results = [];
            for (const f of files) {
                if (f.startsWith('.')) continue;
                try {
                    const st = await fs.stat(path.join(dir, f));
                    if (!st.isFile()) continue;
                    const ext = f.split('.').pop().toLowerCase();
                    const isImage = ['jpg','jpeg','png','webp','gif','avif','svg'].includes(ext);
                    const isVideo = ['mp4','webm','mov','ogg','ogv','mkv'].includes(ext);
                    const item = {
                        filename: f,
                        url: `/uploads/${f}`,
                        size: st.size,
                        mtime: st.mtime.getTime(),
                        type: isImage ? 'image' : (isVideo ? 'video' : 'other'),
                    };
                    if (isImage && sharp && st.size < 20 * 1024 * 1024) {
                        try {
                            const im = await sharp(path.join(dir, f)).metadata();
                            item.width = im.width;
                            item.height = im.height;
                        } catch {}
                    }
                    results.push(item);
                } catch {}
            }
            results.sort((a, b) => b.mtime - a.mtime);
            res.json(results);
        } catch (e) {
            res.status(500).json({ error: e.message });
        }
    });

    // DELETE /api/uploads/:filename
    expressApp.delete('/api/uploads/:filename', async (req, res) => {
        try {
            const fs = require('fs').promises;
            const path = require('path');
            const name = req.params.filename.replace(/[\\/]/g, '');
            if (!name || name.startsWith('.')) return res.status(400).json({ error: 'invalid filename' });
            const full = path.join(uploadDir, name);
            await fs.unlink(full);
            res.json({ ok: true, filename: name });
        } catch (e) {
            res.status(500).json({ error: e.message });
        }
    });


    // ==========================================================
    // Spotify OAuth (admin)
    require('./src/routes/spotify')({ app: expressApp, SpotifySettings });




    // eWeLink OAuth2 routes
    require('./src/routes/ewelink')({ app: expressApp, ewe, io: null });


    // ============ Screensaver global settings ============
    expressApp.get('/api/settings/screensaver', async (req, res) => {
        try {
            let doc = await Settings.findOne({ key: 'global' });
            if (!doc) doc = await Settings.create({ key: 'global' });
            res.json(doc.screensaver || {});
        } catch (e) { res.status(500).json({ error: e.message }); }
    });
    expressApp.patch('/api/settings/screensaver', async (req, res) => {
        try {
            const patch = req.body || {};
            let doc = await Settings.findOne({ key: 'global' });
            if (!doc) doc = await Settings.create({ key: 'global' });
            const cur = doc.screensaver ? doc.screensaver.toObject() : {};
            const merged = { ...cur, ...patch };
            doc.screensaver = merged;
            await doc.save();
            // Broadcast to all connected players
            io.emit('screensaver_config', doc.screensaver);
            res.json(doc.screensaver);
        } catch (e) { res.status(500).json({ error: e.message }); }
    });


    expressApp.post('/api/feedback', async (req, res) => {
        try {
            const { value, source, userAgent, at } = req.body || {};
            const v = parseInt(value);
            if (!v || v < 1 || v > 5) return res.status(400).json({ error: 'value must be 1..5' });
            await Feedback.create({ value: v, source: source || 'default', userAgent: userAgent || '', at: at ? new Date(at) : new Date() });
            res.json({ ok: true });
        } catch (e) { res.status(500).json({ error: e.message }); }
    });
    expressApp.get('/api/feedback', async (req, res) => {
        try {
            const since = req.query.since ? new Date(String(req.query.since)) : new Date(Date.now() - 30 * 24 * 3600 * 1000);
            const items = await Feedback.find({ at: { $gte: since } }).sort({ at: -1 }).limit(1000).lean();
            res.json({ count: items.length, items });
        } catch (e) { res.status(500).json({ error: e.message }); }
    });

    // Next.js handler (must go after ALL expressApp routes)
    expressApp.all(/.*/, (req, res) => {
        const parsedUrl = parse(req.url, true);
        handle(req, res, parsedUrl);
    });

    const io = new Server(server, {
        // Fase A: conexión sólida
        pingInterval: 10000,       // server pinga al cliente cada 10s
        pingTimeout: 20000,        // si no responde en 20s → disconnect
        connectionStateRecovery: {
            maxDisconnectionDuration: 2 * 60 * 1000,  // recupera sesión si vuelve en <2min
            skipMiddlewares: true,
        },
        transports: ['websocket', 'polling'],
    });


    // Map socket.id -> screenId for presence tracking
    const socketScreenMap = new Map();

    // Helper: emit screens_list with computed presence to all admins
    const broadcastScreens = async () => {
        try {
            const screens = await Screen.find();
            io.emit('screens_list', screens);
        } catch (e) {
            console.error('broadcastScreens error:', e);
        }
    };

    // Periodic presence broadcaster so admins see online/offline transitions
    // without waiting for the next register/save event
    setInterval(broadcastScreens, 5000);

    io.on('connection', (socket) => {
        // console.log('Client connected:', socket.id);

        // Register a screen to its own room
        socket.on('register_screen', async (data) => {
            try {
                const { screenId, viewport, userAgent } = data || {};
                socket.join(`screen_${screenId}`);
                socketScreenMap.set(socket.id, screenId);

                // Find or create screen
                let screen = await Screen.findOne({ screenId });
                if (!screen) {
                    screen = await Screen.create({ screenId });
                } else {
                    screen.lastSeen = Date.now();
                }

                if (viewport && typeof viewport === 'object') {
                    screen.viewport = {
                        width: Number(viewport.width) || 0,
                        height: Number(viewport.height) || 0,
                        orientation: viewport.orientation || (viewport.height > viewport.width ? 'portrait' : 'landscape'),
                    };
                }
                if (userAgent && typeof userAgent === 'string') {
                    screen.userAgent = userAgent;
                }
                try {
                    const xff = socket.handshake.headers['x-forwarded-for'];
                    const ip = (typeof xff === 'string' ? xff.split(',')[0] : (Array.isArray(xff) ? xff[0] : socket.handshake.address)) || '';
                    screen.ipAddress = String(ip).trim();
                } catch (_) { /* ignore */ }
                await screen.save();

                console.log(`Screen ${screenId} registered. Authorized: ${screen.isAuthorized}`);

                // Send per-screen config (idle timeout, etc.)
                socket.emit('screen_config', {
                    idleTimeoutMs: screen.idleTimeoutMs || 20000,
                    screensaverEnabled: !!screen.screensaverEnabled,
                    screensaverRotateMs: screen.screensaverRotateMs || 10000
                });

                // Tanda 1: SIEMPRE emitir estado explícito de autorización,
                // así el player no depende de recibir update_layout para saberse autorizado.
                socket.emit('screen_state', {
                    isAuthorized: !!screen.isAuthorized,
                    hasLayout: !!screen.lastLayoutId,
                });

                // If screen is authorized and has a last layout, send it
                if (screen.isAuthorized && screen.lastLayoutId) {
                    const layout = await Layout.findById(screen.lastLayoutId);
                    if (layout) {
                        socket.emit('update_layout', layout);
                    }
                }

                // Inform admins about screen status
                const screens = await Screen.find();
                io.emit('screens_list', screens);
            } catch (err) {
                console.error('Error in register_screen:', err);
            }
        });

        // Request a specific layout (for interactive navigation)
        socket.on('request_layout', async (data) => {
            try {
                const { screenId, layoutId } = data;
                const layout = await Layout.findById(layoutId);
                if (layout) {
                    io.to(`screen_${screenId}`).emit('update_layout', layout);
                }
            } catch (err) {
                console.error('Error in request_layout:', err);
            }
        });

        // Push live content (without saving necessarily, for preview)
        socket.on('update_content', (data) => {
            const { screenId, layout } = data;
            io.to(`screen_${screenId}`).emit('update_layout', layout);
        });

        // Save and push layout
        socket.on('save_layout', async (data) => {
            try {
                const { screenId, layout } = data;

                // Save to DB
                let savedLayout;
                if (layout._id && mongoose.Types.ObjectId.isValid(layout._id)) {
                    savedLayout = await Layout.findByIdAndUpdate(layout._id, layout, { new: true });
                } else {
                    savedLayout = await Layout.findOneAndUpdate(
                        { name: layout.name },
                        layout,
                        { upsert: true, new: true }
                    );
                }

                console.log(`Layout "${layout.name}" saved to DB.`);

                // Push update to the specific screen (if user asked to publish to one)
                if (screenId) {
                    io.to(`screen_${screenId}`).emit('update_layout', savedLayout);
                    await Screen.findOneAndUpdate(
                        { screenId },
                        { lastLayoutId: savedLayout._id, lastSeen: Date.now() }
                    );
                }

                // ALWAYS push the fresh layout to every screen already showing this layout —
                // this makes save behave as a live update to any URL currently using it.
                if (savedLayout && savedLayout._id) {
                    const affectedScreens = await Screen.find({ lastLayoutId: savedLayout._id });
                    for (const scr of affectedScreens) {
                        io.to(`screen_${scr.screenId}`).emit('update_layout', savedLayout);
                    }
                    // Also emit the layouts_list so admin sees the new updatedAt/preview
                    const layouts = await Layout.find().sort({ updatedAt: -1 });
                    io.emit('layouts_list', layouts);
                }

                // Refresh screens_list so admin's screens page reflects lastLayoutId changes
                if (screenId || (savedLayout && savedLayout._id)) {
                    const screens = await Screen.find();
                    io.emit('screens_list', screens);
                }
            } catch (error) {
                console.error('Error saving layout:', error);
            }
        });

        // Screen Management Events
        socket.on('get_screens', async () => {
            const screens = await Screen.find();
            socket.emit('screens_list', screens);
        });

        socket.on('authorize_screen', async (data) => {
            const { screenId, isAuthorized } = data;
            await Screen.findOneAndUpdate({ screenId }, { isAuthorized });
            const screens = await Screen.find();
            io.emit('screens_list', screens);
        });

        socket.on('delete_screen', async (screenId) => {
            try {
                await Screen.findOneAndDelete({ screenId });
                socketScreenMap.forEach((sid, socketId) => {
                    if (sid === screenId) socketScreenMap.delete(socketId);
                });
                const screens = await Screen.find();
                io.emit('screens_list', screens);
                io.to(`screen_${screenId}`).emit('unauthorized');
                console.log(`Screen ${screenId} deleted`);
            } catch (err) {
                console.error('Error deleting screen:', err);
            }
        });

        socket.on('rename_screen', async (data) => {
            const { screenId, name } = data;
            await Screen.findOneAndUpdate({ screenId }, { name });
            const screens = await Screen.find();
            io.emit('screens_list', screens);
        });

        socket.on('assign_layout_to_screen', async (data) => {
            try {
                const { screenId, layoutId } = data;
                if (!layoutId) {
                    // Unassign
                    await Screen.findOneAndUpdate({ screenId }, { $unset: { lastLayoutId: 1 } });
                } else {
                    const screen = await Screen.findOneAndUpdate({ screenId }, { lastLayoutId: layoutId }, { new: true });
                    if (screen) {
                        const layout = await Layout.findById(layoutId);
                        if (layout) io.to(`screen_${screenId}`).emit('update_layout', layout);
                    }
                }
                const screens = await Screen.find();
                io.emit('screens_list', screens);
                console.log(`Layout ${layoutId || '(none)'} assigned to screen ${screenId}`);
            } catch (err) {
                console.error('Error assigning layout:', err);
            }
        });

        // Get all layouts
        socket.on('get_layouts', async () => {
            try {
                const layouts = await Layout.find().sort({ updatedAt: -1 });
                socket.emit('layouts_list', layouts);
            } catch (error) {
                console.error('Error getting layouts:', error);
            }
        });

        // Delete layout
        socket.on('delete_layout', async (id) => {
            try {
                await Layout.findByIdAndDelete(id);
                const layouts = await Layout.find().sort({ updatedAt: -1 });
                io.emit('layouts_list', layouts);
            } catch (error) {
                console.error('Error deleting layout:', error);
            }
        });

        // --- SENSOR EVENTS ---
        socket.on('get_sensors', async () => {
            try { socket.emit('sensors_list', await Sensor.find().sort({ name: 1 })); } catch (e) { console.error(e); }
        });
        socket.on('push_sensor_reading', async (data) => {
            try {
                const { sensorId, value, unit } = data;
                const sensor = await Sensor.findById(sensorId);
                if (!sensor) return;
                sensor.lastValue = value;
                if (unit) sensor.lastUnit = unit;
                sensor.lastReadAt = Date.now();
                sensor.isOnline = true;
                sensor.history.push({ ts: Date.now(), value, unit: unit || sensor.unit });
                if (sensor.history.length > 100) sensor.history = sensor.history.slice(-100);
                await sensor.save();
                io.emit('sensors_list', await Sensor.find().sort({ name: 1 }));
            } catch (e) { console.error('push_sensor_reading', e); }
        });

        // --- SCHEDULE EVENTS ---
        socket.on('get_schedules', async () => {
            try {
                const schedules = await Schedule.find();
                socket.emit('schedules_list', schedules);
            } catch (error) {
                console.error('Error getting schedules:', error);
            }
        });

        socket.on('save_schedule', async (scheduleData) => {
            try {
                console.log(`[Schedule] Saving schedule: ${scheduleData.name}`);
                let saved;
                if (scheduleData._id && mongoose.Types.ObjectId.isValid(scheduleData._id)) {
                    saved = await Schedule.findByIdAndUpdate(scheduleData._id, scheduleData, { new: true, upsert: true });
                } else {
                    // Try to update by name if no ID is present, or create new
                    saved = await Schedule.findOneAndUpdate(
                        { name: scheduleData.name },
                        scheduleData,
                        { upsert: true, new: true }
                    );
                }
                const schedules = await Schedule.find().sort({ createdAt: -1 });
                io.emit('schedules_list', schedules);
                console.log(`[Schedule] Schedule saved successfully: ${saved.name}`);
            } catch (error) {
                console.error('[Schedule] Error saving schedule:', error);
                socket.emit('error_message', 'No se pudo guardar el calendario. Revisa la consola del servidor.');
            }
        });

        socket.on('delete_schedule', async (id) => {
            try {
                await Schedule.findByIdAndDelete(id);
                const schedules = await Schedule.find().sort({ createdAt: -1 });
                io.emit('schedules_list', schedules);
            } catch (error) {
                console.error('Error deleting schedule:', error);
            }
        });

        socket.on('assign_schedule_to_screen', async (data) => {
            const { screenId, scheduleId } = data;
            try {
                await Screen.findOneAndUpdate({ screenId }, { scheduleId });
                const screens = await Screen.find();
                io.emit('screens_list', screens);
            } catch (err) {
                console.error('Error assigning schedule:', err);
            }
        });

        // Heartbeat: player pings every 10s while alive. Updates lastSeen.
        // Fase C: Comandos remotos desde admin → player
        socket.on('remote_command', async (data) => {
            try {
                const { screenId, action, payload } = data || {};
                if (!screenId || !action) return;
                // Emitir al room de la pantalla
                io.to(`screen_${screenId}`).emit('remote_command', {
                    action,
                    payload: payload || {},
                    requestedAt: Date.now(),
                });
            } catch (e) {
                console.error('remote_command error:', e);
            }
        });

        // Player responde a health_check / etc → broadcast a admins
        socket.on('remote_command_reply', (data) => {
            try {
                const screenId = socketScreenMap.get(socket.id);
                if (!screenId) return;
                io.emit('remote_command_reply', { screenId, ...data });
            } catch (e) {
                console.error('remote_command_reply error:', e);
            }
        });

                socket.on('heartbeat', async () => {
            try {
                const screenId = socketScreenMap.get(socket.id);
                if (!screenId) return;
                await Screen.findOneAndUpdate({ screenId }, { lastSeen: Date.now() });
            } catch (e) {
                console.error('heartbeat error:', e);
            }
        });

        socket.on('disconnect', async () => {
            const screenId = socketScreenMap.get(socket.id);
            socketScreenMap.delete(socket.id);
            if (!screenId) return;
            try {
                // Mark this screen as offline by setting lastSeen far in the past
                // so the admin UI shows it as offline immediately. Real lastSeen is
                // restored when the player reconnects via register_screen.
                await Screen.findOneAndUpdate(
                    { screenId },
                    { lastSeen: new Date(Date.now() - 60 * 1000) }
                );
                broadcastScreens();
            } catch (e) {
                console.error('disconnect cleanup error:', e);
            }
        });
    });

    // --- BACKGROUND SCHEDULER ---
    // Runs every 30 seconds to check if any screen needs a layout update based on its schedule
    setInterval(async () => {
        try {
            const now = new Date();
            const currentDay = now.getDay();
            const currentH = now.getHours().toString().padStart(2, '0');
            const currentM = now.getMinutes().toString().padStart(2, '0');
            const currentTime = `${currentH}:${currentM}`;

            const screens = await Screen.find({ scheduleId: { $exists: true, $ne: null } }).populate('scheduleId');

            for (const screen of screens) {
                if (!screen.scheduleId || !screen.scheduleId.events) continue;

                // Find if there's an event right now
                const activeEvent = screen.scheduleId.events.find(event => {
                    // Check time range first
                    if (currentTime < event.startTime || currentTime >= event.endTime) return false;

                    // Check date/day based on schedule type
                    const type = screen.scheduleId.type || 'week'; // Default to week

                    if (type === 'day') {
                        return true; // Applies every day
                    } else if (type === 'month') {
                        // For month, dayOfWeek stores the day index (0 = 1st, 1 = 2nd, etc.)
                        const currentMonthDay = now.getDate(); // 1-31
                        return event.dayOfWeek === (currentMonthDay - 1);
                    } else {
                        // Default 'week'
                        return event.dayOfWeek === currentDay; // 0-6 (Sun-Sat)
                    }
                });

                if (activeEvent) {
                    // Check if the current layout on screen is different
                    if (screen.lastLayoutId?.toString() !== activeEvent.layoutId.toString()) {
                        const layout = await Layout.findById(activeEvent.layoutId);
                        if (layout) {
                            console.log(`[Scheduler] Updating screen ${screen.screenId} to layout ${layout.name} based on ${screen.scheduleId.type} schedule.`);
                            io.to(`screen_${screen.screenId}`).emit('update_layout', layout);
                            // Update screen in DB
                            await Screen.findOneAndUpdate({ screenId: screen.screenId }, { lastLayoutId: activeEvent.layoutId });
                        }
                    }
                }
            }
        } catch (error) {
            console.error('Background Scheduler Error:', error);
        }
    }, 30000);

    // Global eWeLink singleton for on-demand access from routes
let ewelinkInstance = null;

// Sensors polling
    try {
        ewelinkInstance = ewe;
        ewe.loadCreds().then(() => {
            if (ewe.enabled()) { ewe.start(ewe.creds?.pollIntervalMs || 60000); console.log('[eWeLink] polling every ' + ((ewe.creds?.pollIntervalMs || 60000)/1000) + 's'); }
            else console.log('[eWeLink] not configured — go to /admin/settings/integrations/ewelink to authorize');
        }).catch(e => console.error('EwelinkClient loadCreds', e));
    } catch (e) { console.error('EwelinkClient init', e); }

    const PORT = process.env.PORT || 3000;
    server.listen(PORT, (err) => {
        if (err) throw err;
        console.log(`> Ready on http://localhost:${PORT}`);
    });
});
