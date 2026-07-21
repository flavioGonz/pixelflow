require('dotenv').config();
const http = require('http');
const { parse } = require('url');
const next = require('next');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const Layout = require('./src/models/Layout');
const Screen = require('./src/models/Screen');
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

const dev = process.env.NODE_ENV !== 'production';
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
                version: '1.0.0',
                description: 'API documentation for PixelFlow Admin Panel',
            },
            servers: [
                { url: `http://localhost:${process.env.PORT || 3000}` },
            ],
        },
        apis: ['./server.js'], // Files containing annotations
    };
    const swaggerDocs = swaggerJsdoc(swaggerOptions);
    expressApp.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

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
    expressApp.get('/api/products', async (req, res) => {
        try {
            const products = await Product.find().sort({ createdAt: -1 });
            res.json(products);
        } catch (err) { res.status(500).json({ error: err.message }); }
    });

    /**
     * @swagger
     * /api/products:
     *   post:
     *     summary: Create a product
     *     responses:
     *       200:
     *         description: Product created
     */
    expressApp.post('/api/products', async (req, res) => {
        try {
            const product = await Product.create(req.body);
            res.json(product);
        } catch (err) { res.status(500).json({ error: err.message }); }
    });

    /**
     * @swagger
     * /api/products/{id}:
     *   put:
     *     summary: Update a product
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: string
     *     responses:
     *       200:
     *         description: Product updated
     */
    expressApp.put('/api/products/:id', async (req, res) => {
        try {
            const product = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true });
            res.json(product);
        } catch (err) { res.status(500).json({ error: err.message }); }
    });

    /**
     * @swagger
     * /api/products/{id}:
     *   delete:
     *     summary: Delete a product
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: string
     *     responses:
     *       200:
     *         description: Product deleted
     */
    expressApp.delete('/api/products/:id', async (req, res) => {
        try {
            await Product.findByIdAndDelete(req.params.id);
            res.json({ message: 'Deleted' });
        } catch (err) { res.status(500).json({ error: err.message }); }
    });

    /**
     * @swagger
     * /api/categories:
     *   get:
     *     summary: Get all categories
     *     responses:
     *       200:
     *         description: List of categories
     */
    expressApp.get('/api/categories', async (req, res) => {
        try {
            const categories = await Category.find().sort({ order: 1 });
            res.json(categories);
        } catch (err) { res.status(500).json({ error: err.message }); }
    });

    /**
     * @swagger
     * /api/categories:
     *   post:
     *     summary: Create a category
     *     responses:
     *       200:
     *         description: Category created
     */
    expressApp.post('/api/categories', async (req, res) => {
        try {
            const category = await Category.create(req.body);
            res.json(category);
        } catch (err) { res.status(500).json({ error: err.message }); }
    });

    /**
     * @swagger
     * /api/categories/{id}:
     *   put:
     *     summary: Update a category
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: string
     *     responses:
     *       200:
     *         description: Category updated
     */
    expressApp.put('/api/categories/:id', async (req, res) => {
        try {
            const category = await Category.findByIdAndUpdate(req.params.id, req.body, { new: true });
            res.json(category);
        } catch (err) { res.status(500).json({ error: err.message }); }
    });

    /**
     * @swagger
     * /api/categories/{id}:
     *   delete:
     *     summary: Delete a category
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: string
     *     responses:
     *       200:
     *         description: Category deleted
     */
    expressApp.delete('/api/categories/:id', async (req, res) => {
        try {
            await Category.findByIdAndDelete(req.params.id);
            res.json({ message: 'Deleted' });
        } catch (err) { res.status(500).json({ error: err.message }); }
    });

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
    expressApp.get('/api/activities', async (req, res) => {
        try {
            const activities = await Activity.find().sort({ order: 1 });
            res.json(activities);
        } catch (err) { res.status(500).json({ error: err.message }); }
    });

    /**
     * @swagger
     * /api/activities:
     *   post:
     *     summary: Create an activity
     *     responses:
     *       200:
     *         description: Activity created
     */
    expressApp.post('/api/activities', async (req, res) => {
        try {
            const activity = await Activity.create(req.body);
            res.json(activity);
        } catch (err) { res.status(500).json({ error: err.message }); }
    });

    /**
     * @swagger
     * /api/activities/{id}:
     *   put:
     *     summary: Update an activity
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: string
     *     responses:
     *       200:
     *         description: Activity updated
     */
    expressApp.put('/api/activities/:id', async (req, res) => {
        try {
            const activity = await Activity.findByIdAndUpdate(req.params.id, req.body, { new: true });
            res.json(activity);
        } catch (err) { res.status(500).json({ error: err.message }); }
    });

    /**
     * @swagger
     * /api/activities/{id}:
     *   delete:
     *     summary: Delete an activity
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: string
     *     responses:
     *       200:
     *         description: Activity deleted
     */
    expressApp.delete('/api/activities/:id', async (req, res) => {
        try {
            await Activity.findByIdAndDelete(req.params.id);
            res.json({ message: 'Deleted' });
        } catch (err) { res.status(500).json({ error: err.message }); }
    });

    // Serve static files from /uploads
    expressApp.use('/uploads', express.static(uploadDir));

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
    expressApp.post('/api/upload', upload.single('image'), (req, res) => {
        console.log('Upload request received');
        if (!req.file) {
            console.error('No file in request');
            return res.status(400).json({ error: 'No file uploaded' });
        }
        console.log('File uploaded successfully:', req.file.filename);
        res.json({ url: `/uploads/${req.file.filename}` });
    });

    // Next.js handler (Regex catch-all for Express 5 support)
    expressApp.all(/.*/, (req, res) => {
        const parsedUrl = parse(req.url, true);
        handle(req, res, parsedUrl);
    });

    const io = new Server(server);

    io.on('connection', (socket) => {
        // console.log('Client connected:', socket.id);

        // Register a screen to its own room
        socket.on('register_screen', async (data) => {
            try {
                const { screenId, viewport, userAgent } = data || {};
                socket.join(`screen_${screenId}`);

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
                await screen.save();

                console.log(`Screen ${screenId} registered. Authorized: ${screen.isAuthorized}`);

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

                // Push update to the specific screen
                if (screenId) {
                    io.to(`screen_${screenId}`).emit('update_layout', savedLayout);

                    // Update screen lastLayoutId
                    await Screen.findOneAndUpdate(
                        { screenId },
                        { lastLayoutId: savedLayout._id, lastSeen: Date.now() }
                    );
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

        socket.on('rename_screen', async (data) => {
            const { screenId, name } = data;
            await Screen.findOneAndUpdate({ screenId }, { name });
            const screens = await Screen.find();
            io.emit('screens_list', screens);
        });

        socket.on('assign_layout_to_screen', async (data) => {
            const { screenId, layoutId } = data;
            try {
                const screen = await Screen.findOneAndUpdate({ screenId }, { lastLayoutId: layoutId }, { new: true });
                const layout = await Layout.findById(layoutId);
                if (layout) {
                    io.to(`screen_${screenId}`).emit('update_layout', layout);
                }
                const screens = await Screen.find();
                io.emit('screens_list', screens);
                console.log(`Layout ${layoutId} assigned to screen ${screenId}`);
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

        socket.on('disconnect', () => {
            // console.log('Client disconnected:', socket.id);
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

    const PORT = process.env.PORT || 3000;
    server.listen(PORT, (err) => {
        if (err) throw err;
        console.log(`> Ready on http://localhost:${PORT}`);
    });
});
